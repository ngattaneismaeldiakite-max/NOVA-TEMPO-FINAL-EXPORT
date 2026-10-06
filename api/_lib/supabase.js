// api/_lib/supabase.js
// Accès serveur à Supabase (clé service_role), sans dépendance npm.

const URL_PAR_DEFAUT = 'https://wxkeuyyppzuqplnutwzk.supabase.co';

// Tolère les erreurs de saisie dans la variable Vercel (espaces, guillemets,
// "https://" manquant, chemin en trop comme /rest/v1) ; sinon adresse du projet.
function normaliserUrl(brute) {
    const v = String(brute || '').trim().replace(/^["']|["']$/g, '');
    if (!v) return URL_PAR_DEFAUT;
    try {
        const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
        if (!/\.supabase\.(co|in)$/i.test(u.hostname)) throw new Error('hôte inattendu');
        return `https://${u.hostname}`;
    } catch (e) {
        console.error(`SUPABASE_URL invalide sur Vercel (${e.message}) : adresse du projet utilisée.`);
        return URL_PAR_DEFAUT;
    }
}

const SUPABASE_URL = normaliserUrl(process.env.SUPABASE_URL);
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '') || undefined;

function assertConfigured() {
    if (!SERVICE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel');
    }
}

function serviceHeaders(extra = {}) {
    return {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        ...extra
    };
}

// Appel REST (PostgREST). `path` ex: "profiles?id=eq.xxx&select=credits".
async function rest(path, { method = 'GET', body, prefer } = {}) {
    assertConfigured();
    const headers = serviceHeaders({ 'Content-Type': 'application/json' });
    if (prefer) headers.Prefer = prefer;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    const text = await res.text();
    if (!res.ok) {
        throw new Error(`Supabase ${method} ${path.split('?')[0]} (${res.status}): ${text}`);
    }
    return text ? JSON.parse(text) : null;
}

function rpc(fn, args) {
    return rest(`rpc/${fn}`, { method: 'POST', body: args });
}

// Retourne l'utilisateur Supabase correspondant au jeton "Authorization: Bearer ...", ou null.
async function getUserFromRequest(req) {
    assertConfigured();
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return null;

    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
}

// Envoie un fichier dans un bucket public et retourne son URL publique.
async function uploadPublicFile(bucket, objectPath, buffer, contentType) {
    assertConfigured();
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`, {
        method: 'POST',
        headers: serviceHeaders({ 'Content-Type': contentType, 'x-upsert': 'true' }),
        body: buffer
    });
    if (!res.ok) {
        throw new Error(`Upload Storage (${res.status}): ${await res.text()}`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
}

function siteUrl(req) {
    if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = host && host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
}

module.exports = { rest, rpc, getUserFromRequest, uploadPublicFile, siteUrl };
