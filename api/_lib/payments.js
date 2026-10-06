// api/_lib/payments.js
// Validation d'un paiement auprès de GeniusPay puis crédit du compte (une seule fois).

const { rest, rpc } = require('./supabase');
const geniuspay = require('./geniuspay');

async function findPayment(filter) {
    const rows = await rest(`payments?${filter}&select=*&limit=1`);
    return rows && rows.length ? rows[0] : null;
}

// `payment` = ligne de la table payments. Retourne { status, credits? }.
async function settlePayment(payment) {
    if (payment.status !== 'pending') {
        return { status: payment.status };
    }
    if (!payment.provider_reference) {
        return { status: 'pending' };
    }

    const remote = await geniuspay.getPayment(payment.provider_reference);

    if (remote.isSuccess) {
        if (!(remote.amount >= payment.amount)) {
            console.error(`Paiement ${payment.id}: montant GeniusPay ${remote.amount} < attendu ${payment.amount}`);
            return { status: 'pending' };
        }
        const newBalance = await rpc('credit_payment', { p_payment_id: payment.id });
        return { status: 'success', credits: newBalance };
    }

    if (remote.isFailed) {
        await rest(`payments?id=eq.${payment.id}&status=eq.pending`, {
            method: 'PATCH',
            body: { status: 'failed' },
            prefer: 'return=minimal'
        });
        return { status: 'failed' };
    }

    return { status: 'pending' };
}

module.exports = { findPayment, settlePayment };
