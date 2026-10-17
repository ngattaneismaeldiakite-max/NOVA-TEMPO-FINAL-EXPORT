// api/songs/check-status.js
// Statut d'une chanson de l'utilisateur connecté (id = id de la ligne tracks).
const { rest, getUserFromRequest, siteUrl } = require('../_lib/supabase');
const { signaler } = require('../_lib/erreurs');
const { refreshTrack, demarrerEnAttente, positionEnFile } = require('../_lib/tracks');

const UUID = /^[0-9a-f-]{36}$/i;

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

    try {
        const user = await getUserFromRequest(req);
        if (!user) return res.status(401).json({ error: 'Vous devez être connecté.' });

        const id = req.query.id;
        if (!id || !UUID.test(id)) return res.status(400).json({ error: 'Identifiant invalide' });

        const rows = await rest(`tracks?id=eq.${id}&user_id=eq.${user.id}&select=*`);
        if (!rows || !rows.length) return res.status(404).json({ error: 'Chanson introuvable' });

        // Chanson en file d'attente (Suno saturé) : on tente de la lancer ; sinon on indique son rang
        const enAttente = rows[0].statut === 'pending' && !rows[0].suno_task_id;
        const track = enAttente
            ? await demarrerEnAttente(rows[0], `${siteUrl(req)}/api/songs/suno-callback`)
            : await refreshTrack(rows[0]);

        if (track.statut === 'completed') {
            return res.status(200).json({ status: 'completed', outputs: [{ audio_url: track.url_audio }] });
        }
        if (track.statut === 'failed') {
            return res.status(200).json({ status: 'failed' });
        }
        if (track.statut === 'pending' && !track.suno_task_id) {
            return res.status(200).json({ status: 'processing', queued: true, position: await positionEnFile(track) });
        }
        return res.status(200).json({ status: 'processing' });
    } catch (err) {
        await signaler('check-status', err);
        // On laisse le navigateur réessayer au prochain passage
        return res.status(200).json({ status: 'processing' });
    }
};
