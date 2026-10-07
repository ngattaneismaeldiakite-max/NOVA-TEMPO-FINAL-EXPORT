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
    // Les accolades sont retirées : elles servent de balises dans les modèles
    const nettoyer = (v, max) => String(v).replace(/[{}\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
    const champ = (...cles) => {
        for (const cle of cles) {
            const v = data[cle];
            if (typeof v === 'string' && v.trim()) return nettoyer(v, 200) || null;
        }
        return null;
    };
    const produit = champ('produit', 'service', 'evenement', 'promo-produit', 'promo-service');
    // "30" -> "30 ans" (âge ou durée tapés en chiffres seuls)
    // "30", "30ans", "30 an" -> "30 ans"
    const enAnnees = v => {
        const m = v && v.match(/^(\d{1,3})\s*(ans?)?$/i);
        return m ? `${m[1]} ans` : v;
    };
    // "Ma babydoo" -> "ma babydoo" : le petit nom est chanté au milieu d'une phrase
    const petitNom = v => (v && /^(Mon|Ma|Mes|Ton|Ta|Tes|Notre|Nos) /.test(v) ? v[0].toLowerCase() + v.slice(1) : v);
    return {
        AGE: enAnnees(champ('age', 'anniv-age')),
        NOM: champ('nom', 'cible', 'target', 'amour-prenom', 'anniv-prenom', 'hommage-nom', 'adoration-prenom', 'adoration-nom', 'mariage-prenom', 'promo-nom'),
        RELATION: petitNom(champ('relation', 'amour-surnom', 'hommage-lien', 'mariage-surnom', 'anniv-relation')),
        ANECDOTE: champ('anecdote', 'souvenir', 'histoire', 'amour-souvenir', 'anniv-souvenir', 'adoration-temoignage', 'promo-anecdote'),
        DUREE_RELATION: enAnnees(champ('duree', 'duree_relation')),
        MOMENT_DIFFICILE: champ('moment_difficile', 'momentDifficile', 'adoration-epreuve'),
        BENEDICTION: champ('benediction', 'adoration-benediction'),
        PRODUIT: produit,
        SERVICE: produit,
        EVENEMENT: produit,
        ARGUMENT: champ('argument', 'avantage', 'benefice', 'promo-argument'),
        CTA: champ('cta', 'action', 'promo-cta'),
        OBJECTIF: champ('objectif', 'promo-objectif'),
        SUCCES: champ('succes', 'promo-succes'),
        HASHTAG: champ('hashtag', 'promo-hashtag') || '#NovaTempo',
        GENRE_INCONNU: null // forme genrée qu'on ne peut pas accorder (couple, groupe, duo)
    };
}

// Réponses "sur mesure" du parcours (alimentent le [Pont] personnalisé)
function lireSurMesure(data) {
    const nettoyer = (v, max) => String(v).replace(/[{}\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
    const liste = (v, max) => (Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : []))
        .filter(x => typeof x === 'string' && x.trim())
        .map(x => nettoyer(x, 40))
        .slice(0, max);
    const texte = (v, max) => (typeof v === 'string' && v.trim() ? nettoyer(v, max) : null);
    return {
        qualites: liste(data.qualites, 2),
        voeux: liste(data.voeux || data.voeu, 2),
        lecons: liste(data.lecons || data.lecon, 2),
        promesses: liste(data.promesses || data.promesse, 2),
        message: texte(data.message, 110),
        statut: data.statut === 'vivant' ? 'vivant' : 'disparu'
    };
}

const et = liste => liste.length > 1 ? `${liste.slice(0, -1).join(', ')} et ${liste[liste.length - 1]}` : liste[0];
const auHasard = options => options[Math.floor(Math.random() * options.length)];

// Couplet construit à partir des réponses, dans le style des chansons (phrases courtes, "je / tu").
// Retourne le texte du [Pont] (balises {NOM}, {T:...} comprises) ou '' si rien à dire.
function construirePont(occasion, s) {
    const l = [];
    const [q1, q2] = s.qualites;
    const qualites = q2 ? `${q1} et ${q2}` : q1;

    if (occasion === 'amour') {
        if (q1) l.push(auHasard([`Tu es ${qualites}, c'est pour ça que je t'aime`, `${q1[0].toUpperCase() + q1.slice(1)}${q2 ? `, ${q2}` : ''}, tu es tout ce que j'aime`]));
        if (s.message) l.push(auHasard(["Il y a une chose que je veux te dire", "Ce soir je te le dis enfin"]), s.message);
    } else if (occasion === 'anniversaire') {
        if (q1) l.push(auHasard([`{NOM}, toi qui es si ${qualites}`, `Si ${qualites}, personne n'est comme toi`]));
        if (s.voeux.length) l.push(auHasard([`Pour cette nouvelle année, je te souhaite ${et(s.voeux)}`, `Que cette année t'apporte ${et(s.voeux)}`]));
        if (s.message) l.push(s.message);
    } else if (occasion === 'mariage') {
        if (q1) l.push(`Tu es ${qualites}, c'est toi que j'ai {T:choisi|choisie}`);
        if (s.promesses.length) l.push(`Devant Dieu et devant les hommes`, `Je te promets ${et(s.promesses)}`);
        if (s.message) l.push(s.message);
    } else if (occasion === 'hommage') {
        const passe = s.statut === 'disparu';
        if (s.lecons.length) l.push(`Tu m'as appris ${et(s.lecons)}`, passe ? 'Et je le garde en moi pour toujours' : "Et c'est grâce à toi que je suis là");
        if (q1) l.push(passe ? `Tu étais ${qualites}, on se souvient de toi` : `Tu es ${qualites}, on te le dit aujourd'hui`);
        if (s.message) l.push(passe ? 'Si tu m\'entends là-haut' : 'Du fond du cœur je veux te dire', s.message);
    }

    if (!l.length) return '';
    return '[Pont]\n' + l.join('\n');
}

// Hommage "de son vivant" : on retire les lignes qui parlent de la disparition
const LIGNES_DE_DEUIL = /\b(parti|partie|repose|repos|la terre t'a repris|ton âme|là-haut|veille[sz]? sur|disparu|disparue|adieu|n'es plus|tu me manques|tu vis encore|vis en moi|ton nom vit|on ne t'oublie pas|je ne t'oublie pas|tu étais|héritage|ancêtre|mémoire|ciel t'a|au paradis)\b/i;

function adapterAuStatut(modele, occasion, s) {
    if (occasion !== 'hommage' || s.statut !== 'vivant') return modele;
    return modele.split('\n').filter(ligne => !LIGNES_DE_DEUIL.test(ligne)).join('\n');
}

// Insère le [Pont] juste avant l'[Outro] (ou à la fin)
function insererPont(modele, pont) {
    if (!pont) return modele;
    const i = modele.indexOf('[Outro]');
    return i === -1 ? `${modele.trimEnd()}\n\n${pont}` : `${modele.slice(0, i)}${pont}\n\n${modele.slice(i)}`;
}

// Mots de relation dont le genre est évident ("frère", "tata"...)
const MOTS_MASC = ['frère', 'frérot', 'père', 'papa', 'papi', 'fils', 'oncle', 'tonton', 'cousin', 'ami', 'mari', 'époux', 'chéri', 'copain', 'pote', 'gars', 'grand-père', 'parrain', 'neveu', 'beau-père', 'beau-frère', 'patron', 'roi', 'prince', 'homme', 'monsieur', 'fiancé', 'compagnon'];
const MOTS_FEM = ['sœur', 'soeur', 'mère', 'maman', 'mamie', 'fille', 'tante', 'tata', 'cousine', 'amie', 'femme', 'épouse', 'chérie', 'copine', 'grand-mère', 'marraine', 'nièce', 'belle-mère', 'belle-sœur', 'patronne', 'reine', 'princesse', 'dame', 'madame', 'go', 'fiancée', 'compagne'];

function genreDeRelation(valeur) {
    if (!valeur) return null;
    const mots = valeur.toLowerCase().split(/[\s,.!?'’]+/).filter(Boolean);
    const h = mots.some(m => MOTS_MASC.includes(m));
    const f = mots.some(m => MOTS_FEM.includes(m));
    return h && !f ? 'h' : f && !h ? 'f' : null;
}

// Genre de la personne fêtée (question du Studio, sinon déduit de la relation)
// et du chanteur (voix choisie). null = inconnu ou plusieurs personnes.
function lireGenres(data, valeurs) {
    const sexe = String(data.sexe || '').toLowerCase();
    const voix = String(data.voix || data.voice || '').toLowerCase();
    let T = sexe === 'h' || sexe === 'homme' ? 'h' : sexe === 'f' || sexe === 'femme' ? 'f' : null;
    if (!T && !sexe) T = genreDeRelation(valeurs.RELATION);
    return {
        T,
        J: voix === 'male' ? 'h' : voix === 'female' ? 'f' : null
    };
}

// {T:masc|fém} = personne fêtée, {J:masc|fém} = chanteur
function accorderGenres(modele, genres) {
    return modele.replace(/\{([TJ]):([^|{}]*)\|([^{}]*)\}/g, (m, qui, masc, fem) => {
        const g = genres[qui];
        return g === 'h' ? masc : g === 'f' ? fem : '{GENRE_INCONNU}';
    });
}

// Possessif accordé : "ma {RELATION}" + "frère" pour un homme -> "mon frère"
function possessif(det, valeur, genrePersonne) {
    const d = det.toLowerCase();
    const genre = genreDeRelation(valeur) || genrePersonne;
    if (!genre || (d !== 'mon' && d !== 'ma')) return det;
    const voyelle = /^[aeiouyàâéèêëîïôûœh]/i.test(valeur);
    const accord = genre === 'h' || voyelle ? 'mon' : 'ma';
    return det[0] === det[0].toUpperCase() ? accord[0].toUpperCase() + accord.slice(1) : accord;
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
function adapterLigne(ligne, valeurs, manquantes, genres = {}) {
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
        if (DETERMINANT_EN_TETE.test(v)) return v;
        return `${cle === 'RELATION' ? possessif(det, v, genres.T) : det} ${v}`;
    });
    l = l.replace(BALISE, (m, cle) => (valeurs[cle] != null ? valeurs[cle] : m));

    // Anti-doublon : le surnom choisi ("mon roi") ne doit pas revenir dans la même ligne
    // ("Koffi, mon roi, t'es mon roi" -> "Koffi, mon roi")
    if (valeurs.RELATION) {
        const surnom = valeurs.RELATION.toLowerCase();
        const morceaux = l.split(',');
        let vu = false;
        const gardes = morceaux.filter(m => {
            if (!m.toLowerCase().includes(surnom)) return true;
            if (!vu) { vu = true; return true; }
            return false;
        });
        if (gardes.length && gardes.length < morceaux.length) l = gardes.join(',');
    }

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
function remplir(modele, valeurs, genres = {}) {
    const manquantes = new Set(Object.keys(valeurs).filter(k => valeurs[k] == null));
    const lignes = accorderGenres(modele, genres).split('\n');
    const resultat = [];
    let total = 0, gardees = 0;

    for (const ligne of lignes) {
        const estContenu = ligne.trim() && !/^\s*\[[^\]]+\]\s*$/.test(ligne);
        if (estContenu) total++;
        const adaptee = adapterLigne(ligne, valeurs, manquantes, genres);
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

// Modèles adaptés à chaque lien (numéros 1-based dans le fichier de l'occasion).
// "general" = utilisable pour n'importe qui, quand le lien n'est pas connu.
const LIENS = {
    anniversaire: {
        amour: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        parent: [7, 11, 12, 13, 14, 15, 16, 18, 20],
        enfant: [2, 7, 11, 12, 14, 15, 17, 20],
        proche: [2, 7, 11, 12, 14, 15, 16, 19, 20],
        general: [7, 11, 14, 15, 16, 20]
    }
};

// Lien déduit du mot de relation si la question n'a pas été posée
const MOTS_LIEN = {
    parent: ['papa', 'maman', 'père', 'mère', 'papi', 'mamie', 'grand-père', 'grand-mère', 'tonton', 'tata', 'oncle', 'tante'],
    enfant: ['fils', 'fille', 'enfant', 'bébé', 'petit-fils', 'petite-fille', 'neveu', 'nièce'],
    amour: ['chéri', 'chérie', 'amour', 'mari', 'femme', 'époux', 'épouse', 'fiancé', 'fiancée', 'cœur', 'go', 'homme'],
    proche: ['frère', 'sœur', 'soeur', 'ami', 'amie', 'pote', 'copain', 'copine', 'collègue', 'cousin', 'cousine', 'voisin', 'voisine', 'boss', 'patron', 'patronne']
};

function lienDeRelation(relation) {
    if (!relation) return null;
    const mots = relation.toLowerCase().split(/[\s,.!?'’]+/).filter(Boolean);
    for (const lien of ['parent', 'enfant', 'amour', 'proche']) {
        if (mots.some(m => MOTS_LIEN[lien].includes(m))) return lien;
    }
    return null;
}

// Événement : chaque type proposé dans le Studio a ses textes (numéros dans evenement.js)
const TYPES_EVENEMENT = {
    'la grande soirée': [1, 2, 3, 6, 10, 18, 20],
    'le lancement': [1, 2, 5, 12],
    "la fête de fin d'année": [1, 2, 3, 4, 10, 20],
    'le baptême': [7, 11, 16],
    'la remise des diplômes': [8],
    'le gala': [1, 2, 6, 19, 20],
    'le concert': [1, 3, 10, 15]
};
const EVENEMENT_GENERAL = [1, 2, 3, 10, 18, 20]; // fêtes génériques, pour un type tapé librement

function modelesPour(occasion, data, valeurs) {
    const tous = TEMPLATES[occasion];
    if (occasion === 'evenement') {
        const type = String(valeurs.ANECDOTE || '').toLowerCase().replace(/’/g, "'");
        return (TYPES_EVENEMENT[type] || EVENEMENT_GENERAL).map(n => tous[n - 1]).filter(Boolean);
    }
    const table = LIENS[occasion];
    if (!table) return tous;
    const demande = String(data.lien || '').toLowerCase();
    const lien = table[demande] ? demande : (lienDeRelation(valeurs.RELATION) || 'general');
    return table[lien].map(n => tous[n - 1]).filter(Boolean);
}

// Choisit au hasard parmi les modèles qui restent les plus complets
function genererParoles(occasion, data) {
    const valeurs = lireValeurs(data);
    const genres = lireGenres(data, valeurs);
    const surMesure = lireSurMesure(data);
    const modeles = modelesPour(occasion, data, valeurs).map(m => adapterAuStatut(m, occasion, surMesure));
    const candidats = modeles.map(m => ({ modele: m, ...remplir(m, valeurs, genres) }));
    const meilleur = Math.max(...candidats.map(c => c.ratio));
    const bons = candidats.filter(c => c.ratio >= meilleur - 0.08 && c.texte.split('\n').filter(l => l.trim() && !l.startsWith('[')).length >= 6);
    const choix = bons.length ? bons : candidats.sort((a, b) => b.ratio - a.ratio).slice(0, 1);
    const retenu = auHasard(choix);
    // Le couplet sur mesure est ajouté au modèle retenu puis rempli comme le reste
    const pont = construirePont(occasion, surMesure);
    return pont ? remplir(insererPont(retenu.modele, pont), valeurs, genres).texte : retenu.texte;
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
