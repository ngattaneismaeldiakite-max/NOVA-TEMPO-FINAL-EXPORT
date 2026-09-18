const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Liste des occasions supportées par les templates stricts
const ALLOWED_OCCASIONS = ['amour', 'anniversaire', 'hommage', 'promotion', 'adoration'];

function fillTemplate(template, data, occasion) {
    if (!template) return '';

    try {
        // Remplacement générique pour nettoyer les balises
        // (La logique reste identique, on remplace selon l'occasion)
        
        // Amour
        template = template.replace(/\[prenom_destinataire\]/g, data['amour-prenom'] || 'mon amour');
        template = template.replace(/\[qualite1\]/g, data['amour-qualite1'] || 'merveilleux(se)');
        template = template.replace(/\[qualite2\]/g, data['amour-qualite2'] || 'doux(ce)');
        template = template.replace(/\[qualite3\]/g, data['amour-qualite3'] || 'unique');
        template = template.replace(/\[souvenir\]/g, data['amour-souvenir'] || 'notre rencontre');
        template = template.replace(/\[surnom\]/g, data['amour-surnom'] || 'mon cœur');

        // Anniversaire
        template = template.replace(/\[prenom\]/g, data['anniv-prenom'] || 'l\'ami(e)');
        template = template.replace(/\[age\]/g, data['anniv-age'] ? `${data['anniv-age']} ans` : 'un an de plus');
        template = template.replace(/\[qualite1\]/g, data['anniv-qualite1'] || 'génial(e)');
        template = template.replace(/\[qualite2\]/g, data['anniv-qualite2'] || 'incroyable');
        template = template.replace(/\[souvenir\]/g, data['anniv-souvenir'] || 'nos beaux moments');
        template = template.replace(/\[message_special\]/g, data['anniv-message'] || 'profite de ta journée');

        // Hommage
        template = template.replace(/\[nom\]/g, data['hommage-nom'] || 'notre étoile');
        template = template.replace(/\[lien\]/g, data['hommage-lien'] || 'un être cher');
        template = template.replace(/\[qualite1\]/g, data['hommage-qualite1'] || 'fort(e)');
        template = template.replace(/\[qualite2\]/g, data['hommage-qualite2'] || 'aimant(e)');
        template = template.replace(/\[qualite3\]/g, data['hommage-qualite3'] || 'inoubliable');
        template = template.replace(/\[souvenir\]/g, data['hommage-souvenir'] || 'ton sourire');
        template = template.replace(/\[valeur\]/g, data['hommage-valeur'] || 'ton courage');
        template = template.replace(/\[proches\]/g, data['hommage-proches'] || 'nous tous');

        // Promotion / Événement
        template = template.replace(/\[nom_produit\]/g, data['pro-nom'] || 'l\'événement');
        template = template.replace(/\[type\]/g, data['pro-type'] || 'le projet');
        template = template.replace(/\[point1\]/g, data['pro-point1'] || 'innovant');
        template = template.replace(/\[point2\]/g, data['pro-point2'] || 'unique');
        template = template.replace(/\[point3\]/g, data['pro-point3'] || 'incroyable');
        template = template.replace(/\[lieu\]/g, data['pro-lieu'] || 'ici');
        template = template.replace(/\[date\]/g, data['pro-date'] || 'bientôt');
        template = template.replace(/\[public\]/g, data['pro-public'] || 'tout le monde');
        template = template.replace(/\[action\]/g, data['pro-action'] || 'rejoignez-nous');

        // Louange et Adoration
        template = template.replace(/\[nom_de_dieu\]/g, data['ado-nom'] || 'Seigneur');
        template = template.replace(/\[attribut1\]/g, data['ado-attribut1'] || 'Bon');
        template = template.replace(/\[attribut2\]/g, data['ado-attribut2'] || 'Fidèle');
        template = template.replace(/\[attribut3\]/g, data['ado-attribut3'] || 'Puissant');
        template = template.replace(/\[prenom\]/g, data['ado-prenom'] || '');
        template = template.replace(/\[situation\]/g, data['ado-situation'] || '');
        template = template.replace(/\[verset\]/g, data['ado-verset'] ? `(${data['ado-verset']})` : '');

        // Nettoyage des lignes vides ou des virgules orphelines
        template = template.replace(/, ,/g, ',');
        template = template.replace(/ \./g, '.');
        
        return template;
    } catch (error) {
        console.error("Erreur lors du remplissage du template:", error);
        return template; // Retourne le template brut en cas d'erreur
    }
}

module.exports = async (req, res) => {
    // Activer CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const data = req.body;
        const occasion = data.occasion;

        // 1. SI C'EST UNE OCCASION STANDARD (Amour, Anniversaire, Hommage, Promo, Adoration)
        if (ALLOWED_OCCASIONS.includes(occasion)) {
            let templates;
            
            // Charger le bon fichier de templates selon l'occasion
            switch (occasion) {
                case 'amour':
                    templates = require('./templates/amour');
                    break;
                case 'anniversaire':
                    templates = require('./templates/anniversaire');
                    break;
                case 'hommage':
                    templates = require('./templates/hommage');
                    break;
                case 'promotion':
                    templates = require('./templates/promotion');
                    break;
                case 'adoration':
                    templates = require('./templates/adoration');
                    break;
            }

            // Choisir un template au hasard parmi les 50
            const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
            
            // Remplir le template avec les données du formulaire
            const finalLyrics = fillTemplate(randomTemplate, data, occasion);

            return res.status(200).json({ lyrics: finalLyrics });
        } 
        
        // 2. SI L'OCCASION N'EST PAS RECONNUE (Sécurité / Fallback)
        else {
            const prompt = `Écris les paroles d'une chanson sur le thème : ${data.prompt}. 
            Structure la chanson avec [Couplet 1], [Refrain], [Couplet 2], [Refrain], [Pont], [Outro].
            Ne mets aucun commentaire, juste les paroles.`;

            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Tu es un parolier professionnel."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "mixtral-8x7b-32768",
                temperature: 0.7,
                max_tokens: 1000,
            });

            return res.status(200).json({ lyrics: completion.choices[0].message.content });
        }

    } catch (error) {
        console.error('Erreur Groq/Template:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la génération',
            details: error.message 
        });
    }
};
