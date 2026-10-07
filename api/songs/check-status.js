// api/songs/check-status.js
// Statut d'une chanson de l'utilisateur connecté (id = id de la ligne tracks).
const { rest, getUserFromRequest } = require('../_lib/supabase');
const { signaler } = require('../_lib/erreurs');
const { refreshTrack } = require('../_lib/tracks');

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

        const track = await refreshTrack(rows[0]);

        if (track.statut === 'completed') {
            return res.status(200).json({ status: 'completed', outputs: [{ audio_url: track.url_audio }] });
        }
        if (track.statut === 'failed') {
            return res.status(200).json({ status: 'failed' });
        }
        return res.status(200).json({ status: 'processing' });
    } catch (err) {
        await signaler('check-status', err);
        // On laisse le navigateur réessayer au prochain passage
        return res.status(200).json({ status: 'processing' });
    }
};
