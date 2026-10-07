// api/pay/verify-payment.js
// Appelé au retour de GeniusPay (profil.html?payment=success&pid=...).
// Crédite le compte si GeniusPay confirme le paiement, même si le webhook n'est pas encore arrivé.
const { getUserFromRequest } = require('../_lib/supabase');
const { signaler } = require('../_lib/erreurs');
const { findPayment, settlePayment } = require('../_lib/payments');

const UUID = /^[0-9a-f-]{36}$/i;

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

    try {
        const user = await getUserFromRequest(req);
        if (!user) return res.status(401).json({ error: 'Vous devez être connecté.' });

        const pid = req.query.pid;
        if (!pid || !UUID.test(pid)) return res.status(400).json({ error: 'Paiement inconnu' });

        const payment = await findPayment(`id=eq.${pid}&user_id=eq.${user.id}`);
        if (!payment) return res.status(404).json({ error: 'Paiement inconnu' });

        const result = await settlePayment(payment);
        return res.status(200).json({ status: result.status, credits_added: payment.credits });
    } catch (err) {
        await signaler('verify-payment', err, { niveau: 'critique' });
        return res.status(500).json({ error: 'Vérification impossible pour le moment.' });
    }
};
