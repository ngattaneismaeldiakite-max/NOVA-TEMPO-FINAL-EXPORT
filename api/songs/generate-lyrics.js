// api/songs/generate-lyrics.js
// Choisit un modèle de paroles pour l'occasion et le remplit avec les réponses du client.
// Un champ laissé vide n'est jamais remplacé par un texte bidon : la phrase est adaptée
// (interpellation retirée, "pour Awa" -> "pour toi") ou la ligne est retirée, et on choisit
// le modèle qui reste le plus complet avec les informations données.

// Textes par occasion (dans _lib pour ne pas compter comme fonctions Vercel).
const TEMPLATES = {
    amour: require('../_lib/templates/amour'),
    anniversaire: require('../_lib/templates/anniversaire'),
    hommage: require('../_lib/templates/hommage'),
    mariage: require('../_lib/templates/mariage'),
    adoration: require('../_lib/templates/adoration'),
    promotion: require('../_lib/templates/promotion'),
    evenement: require('../_lib/templates/evenement')
};

const ALLOWED_OCCASIONS = Object.keys(TEMPLATES);

// Réponses du formulaire -> balises des modèles
function lireValeurs(data) {
    const champ = (...cles) => {
        for (const cle of cles) {
            const v = data[cle];
            if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 200);
        }
        return null;
    };
    const produit = champ('produit', 'service', 'evenement', 'promo-produit', 'promo-service');
    return {
        NOM: champ('nom', 'cible', 'target', 'amour-prenom', 'anniv-prenom', 'hommage-nom', 'adoration-prenom', 'adoration-nom', 'mariage-prenom', 'promo-nom'),
        RELATION: champ('relation', 'amour-surnom', 'hommage-lien', 'mariage-surnom', 'anniv-relation'),
        ANECDOTE: champ('anecdote', 'souvenir', 'histoire', 'amour-souvenir', 'anniv-souvenir', 'adoration-temoignage', 'promo-anecdote'),
        DUREE_RELATION: champ('duree', 'duree_relation', 'age', 'anniv-age'),
        MOMENT_DIFFICILE: champ('moment_difficile', 'momentDifficile', 'adoration-epreuve'),
        BENEDICTION: champ('benediction', 'adoration-benediction'),
        PRODUIT: produit,
        SERVICE: produit,
        EVENEMENT: produit,
        ARGUMENT: champ('argument', 'avantage', 'benefice', 'promo-argument'),
        CTA: champ('cta', 'action', 'promo-cta'),
        OBJECTIF: champ('objectif', 'promo-objectif'),
        SUCCES: champ('succes', 'promo-succes'),
        HASHTAG: champ('hashtag', 'promo-hashtag') || '#NovaTempo'
    };
}

const BALISE = /\{([A-Z_]+)\}/g;
// Mots qui accompagnent une balise et disparaissent avec elle ("ma {RELATION}", "ô {NOM}")
const ACCOMPAGNANTS = /^(?:mon|ma|mes|ton|ta|tes|notre|nos|votre|vos|le|la|les|l'|l’|cher|chère|ô|oh|et|à|depuis|ça fait|cela fait)$/i;
const DETERMINANT_EN_TETE = /^(?:mon|ma|mes|ton|ta|tes|notre|nos|votre|vos|le|la|les|un|une|des)\s|^l['’]/i;

// Un morceau de phrase (entre virgules) qui ne contient que des balises manquantes et
// des petits mots d'accompagnement peut être retiré sans casser la phrase.
function morceauRetirable(morceau, manquantes) {
    if (![...morceau.matchAll(BALISE)].some(m => manquantes.has(m[1]))) return false;
    const reste = morceau
        .replace(BALISE, (m, cle) => (manquantes.has(cle) ? ' ' : m))
        .replace(/[!?.…«»"]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    return reste.every(mot => ACCOMPAGNANTS.test(mot));
}

// Retourne la ligne adaptée, ou null si elle doit être retirée.
function adapterLigne(ligne, valeurs, manquantes) {
    if (!ligne.trim()) return ''; // ligne vide entre deux parties
    if (/^\s*\[[^\]]+\]\s*$/.test(ligne)) return ligne.trim(); // [Refrain], [Couplet 1]...
    let l = ligne;

    if (manquantes.size && BALISE.test(l)) {
        BALISE.lastIndex = 0;
        // 1. Retirer les morceaux qui ne servaient qu'à porter l'info manquante
        const morceaux = l.split(',');
        const gardes = morceaux.filter(m => !morceauRetirable(m, manquantes));
        if (gardes.length && gardes.length < morceaux.length) {
            l = gardes.join(',');
        }
        // 2. Prénom manquant après une préposition ou une formule : "pour {NOM}" -> "pour toi"
        if (manquantes.has('NOM')) {
            l = l.replace(/\b(pour|à|chez|avec|de|sur|vers|contre|sans)\s+\{NOM\}/gi, '$1 toi');
            l = l.replace(/\b(Merci|Bravo|Félicitations|Bienvenue|Joyeux anniversaire|Bon anniversaire|Bonne fête|Dédicace à|Applaudissez)\s+\{NOM\}/gi, (m, f) => f === 'Dédicace à' ? 'Dédicace à toi' : f);
        }
        // 3. S'il reste une info manquante, la ligne n'a plus de sens : on la retire
        BALISE.lastIndex = 0;
        if ([...l.matchAll(BALISE)].some(m => manquantes.has(m[1]))) return null;
    }

    // "ma {RELATION}" + réponse "ma chérie" -> "ma chérie" (pas "ma ma chérie")
    l = l.replace(/\b(mon|ma|mes|ton|ta|tes|notre|nos|votre|vos)\s+\{([A-Z_]+)\}/gi, (m, det, cle) => {
        const v = valeurs[cle];
        if (v == null) return m;
        return DETERMINANT_EN_TETE.test(v) ? v : `${det} ${v}`;
    });
    l = l.replace(BALISE, (m, cle) => (valeurs[cle] != null ? valeurs[cle] : m));

    // Nettoyage de la ponctuation laissée par les retraits
    l = l.replace(/\s+,/g, ',')
        .replace(/,\s*,+/g, ',')
        .replace(/^\s*[,;]\s*/, '')
        .replace(/[,;]\s*$/, '')
        .replace(/,\s*([!?.…])/g, '$1')
        .replace(/ {2,}/g, ' ')
        .replace(/ \./g, '.')
        .trim();
    l = l.replace(/^\p{Ll}/u, lettre => lettre.toUpperCase());
    return l.trim() ? l : null;
}

// Remplit un modèle. Retourne { texte, ratio } (ratio = part des lignes conservées).
function remplir(modele, valeurs) {
    const manquantes = new Set(Object.keys(valeurs).filter(k => valeurs[k] == null));
    const lignes = modele.split('\n');
    const resultat = [];
    let total = 0, gardees = 0;

    for (const ligne of lignes) {
        const estContenu = ligne.trim() && !/^\s*\[[^\]]+\]\s*$/.test(ligne);
        if (estContenu) total++;
        const adaptee = adapterLigne(ligne, valeurs, manquantes);
        if (adaptee === null) continue;
        if (estContenu) gardees++;
        resultat.push(adaptee);
    }

    // Retirer les sections devenues vides et les lignes vides en double
    const propre = [];
    for (let i = 0; i < resultat.length; i++) {
        const l = resultat[i];
        if (/^\s*\[[^\]]+\]\s*$/.test(l)) {
            const suivante = resultat.slice(i + 1).find(x => x.trim());
            if (!suivante || /^\s*\[[^\]]+\]\s*$/.test(suivante)) continue;
        }
        if (!l.trim() && (!propre.length || !propre[propre.length - 1].trim())) continue;
        propre.push(l);
    }
    while (propre.length && !propre[propre.length - 1].trim()) propre.pop();

    return { texte: propre.join('\n'), ratio: total ? gardees / total : 0 };
}

// Choisit au hasard parmi les modèles qui restent les plus complets
function genererParoles(occasion, data) {
    const valeurs = lireValeurs(data);
    const candidats = TEMPLATES[occasion].map(m => remplir(m, valeurs));
    const meilleur = Math.max(...candidats.map(c => c.ratio));
    const bons = candidats.filter(c => c.ratio >= meilleur - 0.08 && c.texte.split('\n').filter(l => l.trim() && !l.startsWith('[')).length >= 6);
    const choix = bons.length ? bons : candidats.sort((a, b) => b.ratio - a.ratio).slice(0, 1);
    return choix[Math.floor(Math.random() * choix.length)].texte;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const data = req.body || {};
        const requested = String(data.occasion || 'amour').toLowerCase();
        const occasion = ALLOWED_OCCASIONS.includes(requested) ? requested : 'amour';
        return res.status(200).json({ lyrics: genererParoles(occasion, data) });
    } catch (error) {
        console.error('Erreur interne generate-lyrics:', error);
        return res.status(500).json({ error: 'Erreur lors de la génération des paroles' });
    }
};

module.exports.genererParoles = genererParoles;
