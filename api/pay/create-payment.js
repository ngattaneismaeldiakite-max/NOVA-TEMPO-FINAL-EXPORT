// api/pay/create-payment.js
// Crée un paiement GeniusPay pour l'utilisateur connecté.
const { rest, getUserFromRequest, siteUrl } = require('../_lib/supabase');
const { PACKS } = require('../_lib/pricing');
const geniuspay = require('../_lib/geniuspay');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    try {
        const user = await getUserFromRequest(req);
        if (!user) return res.status(401).json({ error: 'Vous devez être connecté.' });

        const packId = (req.body || {}).pack;
        const pack = PACKS[packId];
        if (!pack) return res.status(400).json({ error: 'Pack invalide' });

        // Page de retour après paiement : le Studio (achat en cours de création) ou le Profil
        const returnPage = (req.body || {}).return_to === 'studio' ? 'studio' : 'profil';

        // 1. Enregistrer le paiement en attente
        const [payment] = await rest('payments', {
            method: 'POST',
            prefer: 'return=representation',
            body: {
                user_id: user.id,
                amount: pack.amount,
                currency: 'XOF',
                status: 'pending',
                pack_id: packId,
                credits: pack.credits
            }
        });

        // 2. Ouvrir la session de paiement GeniusPay
        const baseUrl = siteUrl(req);
        let checkout;
        try {
            checkout = await geniuspay.createPayment({
                amount: pack.amount,
                currency: 'XOF',
                description: pack.title,
                success_url: `${baseUrl}/${returnPage}.html?payment=success&pid=${payment.id}`,
                error_url: `${baseUrl}/${returnPage}.html?payment=cancel&pid=${payment.id}`,
                customer: {
                    name: user.email ? user.email.split('@')[0] : 'Client NovaTempo',
                    email: user.email
                },
                metadata: { payment_id: payment.id, user_id: user.id, pack: packId }
            });
        } catch (err) {
            console.error('create-payment GeniusPay:', err.message);
            await rest(`payments?id=eq.${payment.id}`, { method: 'PATCH', body: { status: 'failed' }, prefer: 'return=minimal' });
            return res.status(502).json({ error: 'Le service de paiement est indisponible. Réessayez dans quelques minutes.' });
        }

        if (!checkout.checkoutUrl) {
            console.error('create-payment: pas de checkout_url', checkout);
            return res.status(502).json({ error: 'Le service de paiement n’a pas renvoyé de lien.' });
        }

        if (checkout.reference) {
            await rest(`payments?id=eq.${payment.id}`, {
                method: 'PATCH',
                body: { provider_reference: checkout.reference },
                prefer: 'return=minimal'
            });
        }

        return res.status(200).json({ success: true, checkout_url: checkout.checkoutUrl });
    } catch (err) {
        console.error('create-payment:', err);
        return res.status(500).json({ error: 'Erreur serveur. Réessayez plus tard.' });
    }
};
