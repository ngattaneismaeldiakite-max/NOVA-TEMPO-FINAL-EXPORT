// api/_lib/securite.js
// Garde-fous communs : limitation de débit (par instance, en mémoire) et adresse IP du visiteur.
// Complète les limites en base (ex. chansons en cours) ; suffit à freiner les abus simples.

const compteurs = new Map();

function ipDe(req) {
    const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return xff || (req.socket && req.socket.remoteAddress) || 'inconnue';
}

// Retourne true si la clé a dépassé `max` appels sur `fenetreMs`.
function tropDeDemandes(cle, max, fenetreMs) {
    const maintenant = Date.now();
    if (compteurs.size > 5000) {
        for (const [k, v] of compteurs) if (v.fin < maintenant) compteurs.delete(k);
    }
    const c = compteurs.get(cle);
    if (!c || c.fin < maintenant) {
        compteurs.set(cle, { n: 1, fin: maintenant + fenetreMs });
        return false;
    }
    c.n += 1;
    return c.n > max;
}

// Utilisé par les tests pour repartir de zéro
function reinitialiser() { compteurs.clear(); }

module.exports = { ipDe, tropDeDemandes, reinitialiser };
