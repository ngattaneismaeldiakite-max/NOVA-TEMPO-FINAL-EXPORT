const fs = require('fs');
const path = require('path');

// Fonction pour nettoyer les templates et remplacer les variables proprement
function fillTemplate(template, data) {
    let text = template;
    
    const replaceVar = (tag, value) => {
        if (!value || value.trim() === '') {
            // Si la variable est vide, on la retire et on essaie d'effacer la virgule ou l'espace juste avant/après
            text = text.replace(new RegExp(`[\\s,]*${tag}[\\s,]*`, 'g'), ' ');
        } else {
            text = text.replace(new RegExp(tag, 'g'), value.trim());
        }
    };

    replaceVar('\\{NOM\\}', data.nom);
    replaceVar('\\{RELATION\\}', data.relation);
    replaceVar('\\{ANECDOTE\\}', data.anecdote);
    replaceVar('\\{DUREE_RELATION\\}', data.duree);
    replaceVar('\\{AGE\\}', data.age);

    // Nettoyage final des doubles espaces ou virgules en trop
    return text.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { prompt, genre, occasion, nom, relation, anecdote, duree, age } = req.body;
        const currentOccasion = (occasion || "").toLowerCase().trim();

        // ==========================================
        // 1. SYSTÈME DE TEMPLATES (SANS GROQ)
        // ==========================================
        try {
            // On cherche si un fichier template existe pour cette occasion (ex: api/songs/templates/amour.js)
            const templatesPath = path.join(process.cwd(), 'api', 'songs', 'templates', `${currentOccasion}.js`);
            
            if (fs.existsSync(templatesPath)) {
                const templates = require(templatesPath);
                
                if (templates && templates.length > 0) {
                    const randomIndex = Math.floor(Math.random() * templates.length);
                    const selectedTemplate = templates[randomIndex];
                    
                    const finalLyrics = fillTemplate(selectedTemplate, {
                        nom, relation, anecdote, duree, age
                    });

                    // On retourne le texte. isTemplate permet de savoir que c'est un texte exact.
                    return res.status(200).json({ lyrics: finalLyrics, isTemplate: true });
                }
            }
        } catch (err) {
            console.error("Erreur avec les templates locaux, passage à Groq:", err);
        }

        // ==========================================
        // 2. FALLBACK VERS GROQ (Pour les autres occasions)
        // ==========================================
        const groqApiKey = process.env.GROQ_API_KEY;
        const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

        if (!groqApiKey) return res.status(500).json({ error: "Clé API Groq manquante" });

        const currentGenre = (genre || "").toLowerCase();
        let styleInstruction = "";
        
        if (currentGenre.includes("afrobeat") || currentGenre.includes("coupé décalé") || currentGenre.includes("amapiano") || currentGenre.includes("rap")) {
            styleInstruction += `STYLE URBAIN AFRICAIN : Langage courant de la rue, franc et direct. Ajoute de l'argot (Nouchi : "môgô", "enjaillement", "drap"). PAS de poésie.\n`;
        } else if (currentGenre.includes("gospel")) {
            styleInstruction += `STYLE GOSPEL : Vocabulaire spirituel, inspirant (Seigneur, grâce, foi). AUCUN argot.\n`;
        } else if (currentGenre.includes("zouk") || currentGenre.includes("r&b")) {
            styleInstruction += `STYLE ROMANTIQUE : Douceur, amour. AUCUN mot dur.\n`;
        } else {
            styleInstruction += `STYLE ADAPTÉ : Adapte le vocabulaire au style musical ("${genre}").\n`;
        }

        if (currentOccasion.includes("promotion") || currentOccasion.includes("événement") || currentOccasion.includes("evenement")) {
            styleInstruction += `\nATTENTION PROMOTION : Transforme le récit en vraie publicité entraînante !\n`;
        }

        const systemPrompt = `Tu es un parolier professionnel de musique.
LE STYLE DEMANDÉ EST : ${genre || 'Pop'}
RÈGLES :
1. ${styleInstruction}
2. 100% UNIQUE
3. STRUCTURE : [Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro].
4. LE REFRAIN : Super accrocheur.
5. FORMAT STRICT : Renvoie UNIQUEMENT les paroles.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: groqModel, 
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Écris-moi les paroles sur : "${prompt || 'La vie'}".\n(Code diversité : ${Date.now()})` }
                ],
                temperature: 0.95,
                max_tokens: 1000
            })
        });

        const data = await response.json();
        if (!response.ok) return res.status(500).json({ error: data.error?.message || "Erreur Groq" });
        return res.status(200).json({ lyrics: data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
