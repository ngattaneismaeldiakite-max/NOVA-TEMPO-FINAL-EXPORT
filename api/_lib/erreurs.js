// api/_lib/erreurs.js
// Suivi des erreurs : journal dans la table error_logs (Supabase) + alerte Telegram facultative.
// Ne fait jamais échouer la requête en cours et n'enregistre aucun secret ni donnée client.

const { rest } = require('./supabase');

const deja = new Map(); // anti-spam : la même alerte au plus une fois par 10 min et par instance

// Retire tout ce qui ressemble à un secret ou à une adresse e-mail
function nettoyer(texte, max = 600) {
    return String(texte == null ? '' : texte)
        .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***')
        .replace(/(eyJ[A-Za-z0-9_-]{10,})/g, '***')
        .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '***@***')
        .slice(0, max);
}

async function alerteTelegram(texte) {
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chat = (process.env.TELEGRAM_CHAT_ID || '').trim();
    if (!token || !chat) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: texte, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(2500)
    });
}

// niveau : 'erreur' (à regarder) ou 'critique' (alerte immédiate sur le téléphone)
async function signaler(source, erreur, { niveau = 'erreur', contexte = {}, userId = null } = {}) {
    const message = nettoyer(erreur && erreur.message ? erreur.message : erreur);
    console.error(`[${niveau}] ${source}: ${message}`);
    try {
        await rest('error_logs', {
            method: 'POST',
            prefer: 'return=minimal',
            body: { source: String(source).slice(0, 80), niveau, message, contexte: JSON.parse(nettoyer(JSON.stringify(contexte), 1500) || '{}'), user_id: userId }
        });
    } catch (e) {
        console.error('error_logs indisponible:', nettoyer(e.message, 200));
    }
    if (niveau === 'critique') {
        const cle = `${source}|${message.slice(0, 80)}`;
        const maintenant = Date.now();
        if (!deja.has(cle) || maintenant - deja.get(cle) > 10 * 60 * 1000) {
            deja.set(cle, maintenant);
            await alerteTelegram(`🚨 Nova Tempo — ${source}\n${message}`).catch(e => console.error('Telegram:', nettoyer(e.message, 200)));
        }
    }
}

module.exports = { signaler, nettoyer };
