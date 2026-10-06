// Textes par occasion (dans _lib pour ne pas compter comme fonctions Vercel).
// "evenement" n'a pas encore de textes : il utilise buildFallbackLyrics.
const TEMPLATES = {
    amour: require('../_lib/templates/amour'),
    anniversaire: require('../_lib/templates/anniversaire'),
    hommage: require('../_lib/templates/hommage'),
    mariage: require('../_lib/templates/mariage'),
    adoration: require('../_lib/templates/adoration'),
    promotion: require('../_lib/templates/promotion')
};

const ALLOWED_OCCASIONS = ['amour', 'anniversaire', 'hommage', 'evenement', 'mariage', 'adoration', 'promotion'];

function fillTemplate(template, data) {
    if (!template) return '';

    try {
        const nom = data.nom || data.cible || data.target || data['amour-prenom'] || data['anniv-prenom'] || data['hommage-nom'] || data['adoration-prenom'] || data['adoration-nom'] || data['mariage-prenom'] || data['promo-nom'] || 'cher client';
        const relation = data.relation || data['amour-surnom'] || data['hommage-lien'] || data['mariage-surnom'] || data['anniv-relation'] || 'partenaire';
        const anecdote = data.anecdote || data.souvenir || data.histoire || data['amour-souvenir'] || data['anniv-souvenir'] || data['adoration-temoignage'] || data['promo-anecdote'] || 'un concept unique';
        const duree = data.duree || data.duree_relation || data.age || data['anniv-age'] || 'des années';
        const momentDifficile = data.moment_difficile || data.momentDifficile || data['adoration-epreuve'] || 'la tempête';
        const benediction = data.benediction || data['adoration-benediction'] || 'tes bienfaits';
        
        // Champs spécifiques à la promotion
        const produit = data.produit || data.service || data.evenement || data['promo-produit'] || data['promo-service'] || 'notre offre';
        const argument = data.argument || data.avantage || data.benefice || data['promo-argument'] || 'une qualité exceptionnelle';
        const cta = data.cta || data.action || data['promo-cta'] || 'clique ici sans tarder';
        const objectif = data.objectif || data['promo-objectif'] || 'notre défi';
        const succes = data.succes || data['promo-succes'] || 'notre réussite';
        const hashtag = data.hashtag || data['promo-hashtag'] || '#NovaTempo';

        // Remplacement des balises entre accolades {}
        template = template.replace(/\{NOM\}/g, nom);
        template = template.replace(/\{RELATION\}/g, relation);
        template = template.replace(/\{ANECDOTE\}/g, anecdote);
        template = template.replace(/\{DUREE_RELATION\}/g, duree);
        template = template.replace(/\{MOMENT_DIFFICILE\}/g, momentDifficile);
        template = template.replace(/\{BENEDICTION\}/g, benediction);

        template = template.replace(/\{PRODUIT\}/g, produit);
        template = template.replace(/\{SERVICE\}/g, produit);
        template = template.replace(/\{EVENEMENT\}/g, produit);
        template = template.replace(/\{ARGUMENT\}/g, argument);
        template = template.replace(/\{CTA\}/g, cta);
        template = template.replace(/\{OBJECTIF\}/g, objectif);
        template = template.replace(/\{SUCCES\}/g, succes);
        template = template.replace(/\{HASHTAG\}/g, hashtag);

        // Remplacement des balises secondaires entre crochets []
        template = template.replace(/\[prenom_destinataire\]/g, nom);
        template = template.replace(/\[prenom\]/g, nom);
        template = template.replace(/\[nom\]/g, nom);
        template = template.replace(/\[surnom\]/g, relation);
        template = template.replace(/\[lien\]/g, relation);
        template = template.replace(/\[souvenir\]/g, anecdote);
        template = template.replace(/\[anecdote\]/g, anecdote);
        template = template.replace(/\[age\]/g, duree);
        template = template.replace(/\[duree\]/g, duree);
        template = template.replace(/\[moment_difficile\]/g, momentDifficile);
        template = template.replace(/\[benediction\]/g, benediction);
        template = template.replace(/\[produit\]/g, produit);
        template = template.replace(/\[cta\]/g, cta);

        // Nettoyage des ponctuations et espaces orphelins
        template = template.replace(/, ,/g, ',');
        template = template.replace(/ \./g, '.');
        
        return template;
    } catch (error) {
        console.error("Erreur lors du remplissage du template:", error);
        return template; 
    }
}

function buildFallbackLyrics(data, occasion) {
    const nom = data.nom || data.cible || 'ami(e)';
    const relation = data.relation || 'proche';
    const anecdote = data.anecdote || data.souvenir || 'nos beaux moments';
    const detail = data.detail || data.histoire || 'un moment unique';

    return `[Couplet 1]
Les jours passent et je repense à toi
${nom}, mon ${relation}, t'es toujours là
${anecdote}, un souvenir gravé en moi
Rien ne pourra effacer tes pas

[Refrain]
C'est pour toi que résonne cette mélodie
Pour célébrer notre histoire et la vie
Que la musique apporte sa douceur
${nom}, tu fais mon bonheur

[Couplet 2]
On avance ensemble sur le chemin
${detail}, la main dans la main
Les moments partagés restent au présent
Tu es là dans mes pensées à chaque instant

[Outro]
Merci d'être là, tout simplement
${nom}, cette chanson est pour toi maintenant`;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const data = req.body || {};
        const requested = String(data.occasion || 'amour').toLowerCase();
        const occasion = ALLOWED_OCCASIONS.includes(requested) ? requested : 'amour';

        const templates = TEMPLATES[occasion] || null;

        let finalLyrics = "";

        if (templates && Array.isArray(templates) && templates.length > 0) {
            // Tirage aléatoire parmi les templates rédigés
            const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
            finalLyrics = fillTemplate(randomTemplate, data);
        } else {
            // Fallback propre structuré avec couplets/refrain
            finalLyrics = buildFallbackLyrics(data, occasion);
        }

        return res.status(200).json({ lyrics: finalLyrics });
        
    } catch (error) {
        console.error('Erreur interne generate-lyrics:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la génération des paroles',
            details: error.message 
        });
    }
};
