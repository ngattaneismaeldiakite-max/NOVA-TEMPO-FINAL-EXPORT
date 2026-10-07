// api/songs/suno-callback.js
// Appelé par SunoAPI quand une génération avance. Sert uniquement de déclencheur :
// le statut réel est relu chez Suno via refreshTrack (rien n'est cru du contenu reçu).
const { rest } = require('../_lib/supabase');
const { signaler } = require('../_lib/erreurs');
const { refreshTrack } = require('../_lib/tracks');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    try {
        const body = req.body || {};
        const taskId = body.data?.task_id || body.data?.taskId || body.taskId || body.task_id;
        if (!taskId) return res.status(200).json({ received: true });

        const rows = await rest(`tracks?suno_task_id=eq.${encodeURIComponent(taskId)}&select=*`);
        if (rows && rows.length) {
            await refreshTrack(rows[0]);
        }
        return res.status(200).json({ received: true });
    } catch (err) {
        await signaler('suno-callback', err);
        return res.status(200).json({ received: true });
    }
};
