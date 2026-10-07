// api/erreurs.js
// Reçoit les erreurs JavaScript survenues dans le navigateur des clients (limitées, sans donnée personnelle).
const { signaler } = require('./_lib/erreurs');
const { ipDe, tropDeDemandes } = require('./_lib/securite');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
    if (tropDeDemandes(`erreurs:${ipDe(req)}`, 10, 60 * 1000)) return res.status(429).json({ ok: false });
    const b = req.body || {};
    if (typeof b.message !== 'string' || !b.message) return res.status(400).json({ ok: false });
    await signaler('navigateur', b.message, {
        contexte: { page: String(b.page || '').slice(0, 120), ligne: Number(b.ligne) || null, agent: String(req.headers['user-agent'] || '').slice(0, 120) }
    });
    return res.status(200).json({ ok: true });
};
