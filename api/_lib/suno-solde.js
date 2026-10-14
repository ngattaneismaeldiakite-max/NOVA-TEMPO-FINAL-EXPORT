// api/_lib/suno-solde.js
// Surveillance du solde de crédits SunoAPI : alerte Telegram quand il baisse, et suspension préventive
// des nouvelles chansons quand il est presque vide (le client n'est alors PAS débité).
//
// Réglages (variables Vercel, tous facultatifs) :
//   SUNO_SEUIL_ALERTE        solde en dessous duquel on te prévient         (défaut 200)
//   SUNO_SEUIL_BLOCAGE       solde en dessous duquel on suspend le studio   (défaut 20)
//   SUNO_CREDITS_PAR_CHANSON coût d'une chanson en crédits, pour afficher « ≈ N chansons » (défaut : non affiché)
//
// Une erreur de lecture du solde ne bloque jamais les clients.

const { notifier, signaler } = require('./erreurs');

const SUNO_API = 'https://api.sunoapi.org/api/v1';
const DUREE_CACHE_MS = 60 * 1000;      // le solde est relu au plus une fois par minute et par instance
const ALERTE_BAS_MS = 3 * 60 * 60 * 1000;   // « bientôt vide » : au plus toutes les 3 h
const ALERTE_VIDE_MS = 30 * 60 * 1000;      // « épuisé » : au plus toutes les 30 min

let cache = { t: 0, valeur: null };
const derniere = { bas: 0, vide: 0 };

function reglage(nom, defaut) {
    const brut = process.env[nom];
    if (brut === undefined || brut === null || String(brut).trim() === '') return defaut;
    const n = Number(brut);
    return Number.isFinite(n) && n >= 0 ? n : defaut;
}

// Retourne le solde (nombre) ou null si la lecture échoue.
async function lireSolde() {
    const maintenant = Date.now();
    if (maintenant - cache.t < DUREE_CACHE_MS) return cache.valeur;
    try {
        const cle = (process.env.SUNO_API_KEY || '').trim();
        if (!cle) throw new Error('SUNO_API_KEY manquante');
        const res = await fetch(`${SUNO_API}/generate/credit`, {
            headers: { Authorization: `Bearer ${cle}` },
            signal: AbortSignal.timeout(4000)
        });
        const data = await res.json().catch(() => ({}));
        const valeur = Number(data.data);
        if (!res.ok || (data.code && data.code !== 200) || data.data === null || data.data === undefined || !Number.isFinite(valeur)) {
            throw new Error(`lecture du solde impossible (${res.status}) ${String(data.msg || '').slice(0, 100)}`);
        }
        cache = { t: maintenant, valeur };
        return valeur;
    } catch (err) {
        console.error('suno-solde:', err.message);
        cache = { t: maintenant - DUREE_CACHE_MS + 10 * 1000, valeur: null }; // on réessaie dans 10 s
        return null;
    }
}

const chansons = solde => {
    const cout = reglage('SUNO_CREDITS_PAR_CHANSON', 0);
    return cout > 0 ? ` (≈ ${Math.floor(solde / cout)} chansons)` : '';
};

// À appeler AVANT de débiter un client. { ok: false } = suspendre la création.
async function verifierSolde() {
    const solde = await lireSolde();
    if (solde === null) return { ok: true, solde: null };

    const seuilBlocage = reglage('SUNO_SEUIL_BLOCAGE', 20);
    const seuilAlerte = reglage('SUNO_SEUIL_ALERTE', 200);
    const maintenant = Date.now();

    if (solde < seuilBlocage) {
        if (maintenant - derniere.vide > ALERTE_VIDE_MS) {
            derniere.vide = maintenant;
            await notifier(`🛑 Nova Tempo — solde Suno épuisé : ${solde} crédits${chansons(solde)}.\nLes nouvelles chansons sont SUSPENDUES (les clients ne sont pas débités). Recharge Suno maintenant.`);
            await signaler('suno-solde', `Solde Suno épuisé (${solde} crédits) : création suspendue`, { niveau: 'erreur' });
        }
        return { ok: false, solde };
    }
    if (solde < seuilAlerte && maintenant - derniere.bas > ALERTE_BAS_MS) {
        derniere.bas = maintenant;
        await notifier(`⚠️ Nova Tempo — solde Suno bientôt vide : ${solde} crédits${chansons(solde)}.\nPense à recharger.`);
    }
    return { ok: true, solde };
}

// Pour les tests
function reinitialiser() { cache = { t: 0, valeur: null }; derniere.bas = 0; derniere.vide = 0; }

module.exports = { verifierSolde, lireSolde, reinitialiser };
