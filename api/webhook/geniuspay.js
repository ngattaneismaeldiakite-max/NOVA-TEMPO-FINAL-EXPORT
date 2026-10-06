// api/webhook/geniuspay.js
// Notification GeniusPay. Le contenu reçu n'est jamais cru tel quel :
// on retrouve le paiement chez nous, puis on redemande son statut réel à GeniusPay.
const { rest } = require('../_lib/supabase');
const { findPayment, settlePayment } = require('../_lib/payments');

const UUID = /^[0-9a-f-]{36}$/i;

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    try {
        const body = req.body || {};
        const data = body.data || body;
        const reference = data.reference || body.reference;
        const metadata = data.metadata || body.metadata || {};

        let payment = null;
        if (reference) {
            payment = await findPayment(`provider_reference=eq.${encodeURIComponent(reference)}`);
        }
        if (!payment && metadata.payment_id && UUID.test(metadata.payment_id)) {
            payment = await findPayment(`id=eq.${metadata.payment_id}`);
            // Référence pas encore enregistrée (course avec create-payment) : on la rattache.
            if (payment && !payment.provider_reference && reference) {
                await rest(`payments?id=eq.${payment.id}&provider_reference=is.null`, {
                    method: 'PATCH',
                    body: { provider_reference: reference },
                    prefer: 'return=minimal'
                });
                payment.provider_reference = reference;
            }
        }

        if (!payment) {
            console.warn('Webhook GeniusPay: paiement introuvable', reference);
            return res.status(200).json({ received: true, status: 'unknown' });
        }

        const result = await settlePayment(payment);
        console.log(`Webhook GeniusPay: paiement ${payment.id} -> ${result.status}`);
        return res.status(200).json({ received: true, status: result.status });
    } catch (err) {
        console.error('Webhook GeniusPay:', err);
        // 500 => GeniusPay réessaiera plus tard
        return res.status(500).json({ error: 'Erreur interne' });
    }
};
