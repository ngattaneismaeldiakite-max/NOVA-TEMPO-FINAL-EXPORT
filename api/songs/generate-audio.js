// api/songs/generate-audio.js
// Retire 1 crédit, crée la chanson en base et lance la génération Suno.
const { rest, rpc, getUserFromRequest, siteUrl } = require('../_lib/supabase');
const { startSunoGeneration, markFailed, refreshTrack } = require('../_lib/tracks');
const { tropDeDemandes } = require('../_lib/securite');
const MAX_EN_COURS = 3; // chansons simultanées par client

const STYLES = {
    'Coupé Décalé': 'ivorian coupe decale, atalaku, fast tempo, festive animation, sebene guitar, log drum',
    'Amapiano': 'amapiano, deep log drum, south african vibe, groovy shaker, party',
    'Afrobeat': 'afrobeat, naija groove, smooth percussion, saxophone',
    'Ndombolo': 'ndombolo, congolese rumba, sebene guitar, fast dance',
    'Rap Français': 'french rap, trap beat, heavy 808, punchy drill',
    'Zouk': 'zouk, kizomba, romantic, slow dance, smooth',
    'Gospel': 'gospel choir, uplifting, emotional, spiritual, powerful vocals, organ'
};
const VOICES = { male: 'male vocal', female: 'female vocal', duo: 'male and female duet' };
const OCCASIONS = ['amour', 'anniversaire', 'hommage', 'evenement', 'mariage', 'adoration', 'promotion'];

// Code de diagnostic ajouté aux erreurs (aucun secret) : aide au support sans accès aux logs
const codeErreur = (etape, err) => {
    const texte = String((err && err.message) || '');
    const http = texte.match(/\((\d{3})\)/);
    // Erreur PostgreSQL : code (ex. 23502) + colonne en cause, sans aucune donnée client
    const pg = texte.match(/"code"\s*:\s*"([0-9A-Z]{5})"/);
    const colonne = texte.match(/column \\?"([a-z_]+)\\?"/i);
    return [etape, http && http[1], pg && pg[1], colonne && colonne[1]].filter(Boolean).join('-');
};

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    let user;
    try {
        user = await getUserFromRequest(req);
    } catch (err) {
        console.error('generate-audio config:', err.message);
        return res.status(500).json({ error: `Service momentanément indisponible (code ${codeErreur('A1', err)}).` });
    }
    if (!user) return res.status(401).json({ error: 'Accès refusé : vous devez être connecté.' });

    const { lyrics, voice, genre, occasion, titre } = req.body || {};
    if (typeof lyrics !== 'string' || lyrics.trim().length < 10 || lyrics.length > 5000) {
        return res.status(400).json({ error: 'Paroles manquantes ou trop longues.' });
    }
    const style = STYLES[genre] ? genre : 'Afrobeat';
    const voix = VOICES[voice] ? voice : 'male';
    const occ = OCCASIONS.includes(occasion) ? occasion : 'amour';
    const title = (typeof titre === 'string' && titre.trim() ? titre.trim() : 'Hit NovaTempo').slice(0, 80);

    if (!process.env.SUNO_API_KEY) {
        console.error('generate-audio: SUNO_API_KEY manquante');
        return res.status(500).json({ error: 'Service momentanément indisponible (code A2).' });
    }

    if (tropDeDemandes(`audio:${user.id}`, 8, 10 * 60 * 1000)) {
        return res.status(429).json({ error: 'Trop de demandes rapprochées. Patientez un instant.' });
    }

    // Chansons déjà en cours : on rattrape celles qui sont bloquées (crédit rendu), puis on plafonne
    try {
        const enCours = await rest(`tracks?user_id=eq.${user.id}&statut=in.(pending,processing)&select=*&limit=10`);
        let actives = 0;
        for (const t of enCours || []) {
            const maj = await refreshTrack(t).catch(() => t);
            if (maj.statut === 'pending' || maj.statut === 'processing') actives += 1;
        }
        if (actives >= MAX_EN_COURS) {
            return res.status(429).json({ error: 'Tu as déjà plusieurs chansons en cours de création. Attends qu’elles soient prêtes.' });
        }
    } catch (err) {
        console.error('generate-audio contrôle des chansons en cours:', err.message);
    }

    // 1. Retrait atomique d'un crédit
    let newBalance;
    try {
        newBalance = await rpc('consume_credit', { p_user: user.id });
    } catch (err) {
        console.error('generate-audio consume_credit:', err.message);
        return res.status(500).json({ error: `Service momentanément indisponible (code ${codeErreur('A3', err)}).` });
    }
    if (newBalance === null || newBalance === undefined) {
        return res.status(402).json({ error: 'Solde insuffisant ! Rechargez votre compte dans Mon Espace.' });
    }

    // 2. Enregistrer la chanson en base (avant Suno, pour ne jamais la perdre)
    let track;
    try {
        [track] = await rest('tracks', {
            method: 'POST',
            prefer: 'return=representation',
            body: {
                user_id: user.id,
                titre: title,
                occasion: occ,
                style_musical: style,
                voix,
                paroles: lyrics,
                statut: 'pending',
                url_audio: '' // colonne obligatoire dans la base : remplie quand Suno a fini
            }
        });
    } catch (err) {
        console.error('generate-audio insert track:', err.message);
        await rpc('refund_credit', { p_user: user.id }).catch(() => null);
        return res.status(500).json({ error: `Impossible de démarrer la création. Votre crédit n’a pas été débité (code ${codeErreur('A4', err)}).` });
    }

    // 3. Lancer Suno
    try {
        const taskId = await startSunoGeneration({
            customMode: true,
            instrumental: false,
            prompt: lyrics,
            style: `${STYLES[style]}, ${VOICES[voix]}`,
            title,
            model: 'V6',
            callBackUrl: `${siteUrl(req)}/api/songs/suno-callback`
        });

        await rest(`tracks?id=eq.${track.id}`, {
            method: 'PATCH',
            prefer: 'return=minimal',
            body: { statut: 'processing', suno_task_id: taskId, updated_at: new Date().toISOString() }
        });

        return res.status(200).json({ job_id: track.id, credits: newBalance });
    } catch (err) {
        console.error('generate-audio Suno:', err.message);
        await markFailed(track, err.message).catch(e => console.error('markFailed:', e.message));
        return res.status(502).json({ error: 'Le studio est momentanément saturé. Votre crédit vous a été rendu, réessayez dans un instant.' });
    }
};
