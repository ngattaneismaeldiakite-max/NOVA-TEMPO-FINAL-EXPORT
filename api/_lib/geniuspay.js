// api/_lib/geniuspay.js
// Appels à l'API marchand GeniusPay.

const API_BASE = (process.env.GENIUSPAY_API_BASE || 'https://geniuspay.ci/api/v1/merchant').replace(/\/$/, '');

const SUCCESS_STATUSES = ['completed', 'success', 'successful', 'paid'];
const FAILED_STATUSES = ['failed', 'cancelled', 'canceled', 'expired', 'refunded'];

function authHeaders() {
    const apiKey = (process.env.GENIUSPAY_PUBLIC_KEY || '').trim();
    const apiSecret = (process.env.GENIUSPAY_SECRET_KEY || '').trim();
    if (!apiKey || !apiSecret) {
        throw new Error('GENIUSPAY_PUBLIC_KEY / GENIUSPAY_SECRET_KEY manquantes sur Vercel');
    }
    return {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
}

async function call(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers: authHeaders() });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
    if (!res.ok || data.success === false) {
        throw new Error(`GeniusPay ${path} (${res.status}): ${text.slice(0, 500)}`);
    }
    return data.data || data;
}

async function createPayment(payload) {
    const data = await call('/payments', { method: 'POST', body: JSON.stringify(payload) });
    return {
        reference: data.reference || data.id || null,
        checkoutUrl: data.checkout_url || data.payment_url || null
    };
}

// Source de vérité : on ne se fie jamais au contenu d'un webhook, on redemande à GeniusPay.
async function getPayment(reference) {
    const data = await call(`/payments/${encodeURIComponent(reference)}`);
    const status = String(data.status || '').toLowerCase();
    return {
        reference: data.reference || reference,
        status,
        isSuccess: SUCCESS_STATUSES.includes(status),
        isFailed: FAILED_STATUSES.includes(status),
        amount: Number(data.amount),
        currency: data.currency,
        metadata: data.metadata || {}
    };
}

module.exports = { createPayment, getPayment };
