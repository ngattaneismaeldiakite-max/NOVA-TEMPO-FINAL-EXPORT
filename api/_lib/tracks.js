// api/_lib/tracks.js
// Suivi d'une chanson Suno jusqu'à sa sauvegarde (table tracks + Storage).

const { rest, rpc, uploadPublicFile } = require('./supabase');
const { signaler } = require('./erreurs');

const SUNO_API = 'https://api.sunoapi.org/api/v1';
const MAX_DURATION_MS = 15 * 60 * 1000; // au-delà : échec + remboursement

function sunoHeaders() {
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) throw new Error('SUNO_API_KEY manquante sur Vercel');
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
}

// SunoAPI limite à 20 requêtes / 10 s : codes 405 (taux dépassé) et 430 (appels trop fréquents).
// Le code 429 veut dire « crédits insuffisants » (autre problème, à ne pas réessayer).
const LIMITE_DEBIT = code => code === 405 || code === 430;
// Réglages modifiables par les tests uniquement
const delais = {
    intervalle: 12 * 1000,   // au plus une lecture Suno toutes les 12 s par chanson
    avant: 20 * 1000,        // une chanson prend plus de 20 s : inutile de demander avant
    reessai: [1200, 2500]    // attentes entre les essais de lancement (limite de débit)
};
const dernieresVerifs = new Map();        // id de chanson -> heure de la dernière lecture
const attendre = ms => new Promise(r => setTimeout(r, ms));

function erreurLimite() {
    const e = new Error('SunoAPI : trop d\'appels simultanés, réessai plus tard');
    e.limite = true;
    return e;
}

async function startSunoGeneration(payload) {
    let data = {}, res;
    for (let essai = 0; ; essai++) {
        res = await fetch(`${SUNO_API}/generate`, {
            method: 'POST',
            headers: sunoHeaders(),
            body: JSON.stringify(payload)
        });
        data = await res.json().catch(() => ({}));
        const code = Number(data.code) || res.status;
        // Trop d'appels à la fois : on patiente un peu et on réessaie, le client ne voit rien
        if (LIMITE_DEBIT(code) && essai < delais.reessai.length) { await attendre(delais.reessai[essai]); continue; }
        break;
    }
    if (!res.ok || (data.code && data.code !== 200)) {
        throw new Error(`SunoAPI a refusé (${res.status}): ${data.msg || 'erreur inconnue'}`);
    }
    const taskId = data.data?.taskId || data.data?.task_id || data.taskId;
    if (!taskId) throw new Error('SunoAPI: identifiant de tâche absent');
    return taskId;
}

async function getSunoTask(taskId) {
    const res = await fetch(`${SUNO_API}/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
        headers: sunoHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (LIMITE_DEBIT(Number(data.code)) || LIMITE_DEBIT(res.status)) throw erreurLimite();
    if (data.code && data.code !== 200) {
        throw new Error(`SunoAPI record-info: ${data.msg || res.status}`);
    }
    const info = data.data || {};
    const sunoData = info.response?.sunoData || info.sunoData || [];
    const ready = sunoData.find(s => s.audioUrl || s.audio_url);
    const status = String(info.status || '').toUpperCase();
    return {
        audioUrl: ready ? (ready.audioUrl || ready.audio_url) : null,
        failed: /FAIL|ERROR|SENSITIVE/.test(status),
        status,
        errorMessage: info.errorMessage || data.msg || status
    };
}

async function markFailed(track, reason) {
    const rows = await rest(`tracks?id=eq.${track.id}&statut=in.(pending,processing)`, {
        method: 'PATCH',
        prefer: 'return=representation',
        body: { statut: 'failed', erreur: String(reason).slice(0, 500), updated_at: new Date().toISOString() }
    });
    // Rembourser une seule fois : seulement si c'est nous qui avons fait passer la chanson en échec.
    if (rows && rows.length) {
        await rpc('refund_credit', { p_user: track.user_id });
    }
}

async function copyAudioToStorage(track, sunoUrl) {
    try {
        const audioRes = await fetch(sunoUrl);
        if (!audioRes.ok) throw new Error(`téléchargement ${audioRes.status}`);
        const buffer = Buffer.from(await audioRes.arrayBuffer());
        return await uploadPublicFile('tracks', `${track.user_id}/${track.id}.mp3`, buffer, 'audio/mpeg');
    } catch (err) {
        // On garde le lien Suno (valable 14 jours) plutôt que de perdre la chanson.
        await signaler('copie-audio', `Copie audio ${track.id} impossible: ${err.message}`);
        return sunoUrl;
    }
}

// Fait avancer une chanson "processing". Retourne la ligne tracks à jour.
// Le navigateur demande l'état toutes les 5 s : pour ne pas saturer SunoAPI (20 requêtes / 10 s pour tout le
// site), la lecture chez Suno est limitée à une toutes les 12 s par chanson, et jamais avant 20 s.
// Le rappel (callback) de Suno, lui, passe toujours (forcer).
async function refreshTrack(track, { forcer = false } = {}) {
    if (track.statut !== 'processing' || !track.suno_task_id) return track;

    if (!forcer) {
        const age = Date.now() - new Date(track.created_at).getTime();
        const derniere = dernieresVerifs.get(track.id) || 0;
        if (age < delais.avant || Date.now() - derniere < delais.intervalle) return track;
    }
    dernieresVerifs.set(track.id, Date.now());
    if (dernieresVerifs.size > 2000) dernieresVerifs.delete(dernieresVerifs.keys().next().value);

    let task;
    try {
        task = await getSunoTask(track.suno_task_id);
    } catch (err) {
        if (err.limite) return track; // Suno est occupé : on réessaiera au prochain passage, sans échec ni remboursement
        throw err;
    }

    if (task.audioUrl) {
        dernieresVerifs.delete(track.id);
        const finalUrl = await copyAudioToStorage(track, task.audioUrl);
        const rows = await rest(`tracks?id=eq.${track.id}&statut=eq.processing`, {
            method: 'PATCH',
            prefer: 'return=representation',
            body: { statut: 'completed', url_audio: finalUrl, updated_at: new Date().toISOString() }
        });
        return rows && rows.length ? rows[0] : (await rest(`tracks?id=eq.${track.id}&select=*`))[0];
    }

    const tooOld = Date.now() - new Date(track.created_at).getTime() > MAX_DURATION_MS;
    if (task.failed || tooOld) {
        dernieresVerifs.delete(track.id);
        await markFailed(track, task.failed ? task.errorMessage : 'Délai de génération dépassé');
        return { ...track, statut: 'failed' };
    }

    return track;
}

// Pour les tests : repartir sans mémoire des lectures et sans attente entre essais
function reinitialiserLimites() { dernieresVerifs.clear(); }

module.exports = { startSunoGeneration, refreshTrack, markFailed, reinitialiserLimites, delais };
