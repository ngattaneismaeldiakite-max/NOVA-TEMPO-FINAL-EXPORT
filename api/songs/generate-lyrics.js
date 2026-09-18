module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // On récupère bien le 'prompt' (le thème) et le 'genre' (le style) envoyés par le studio
        const { prompt, genre } = req.body;
        const groqApiKey = process.env.GROQ_API_KEY;
        const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

        if (!groqApiKey) return res.status(500).json({ error: "Clé API Groq manquante" });

        // On analyse le genre choisi pour dicter le bon style de langage à Groq
        let styleInstruction = "";
        const currentGenre = (genre || "").toLowerCase();
        
        if (currentGenre.includes("afrobeat") || currentGenre.includes("coupé décalé") || currentGenre.includes("amapiano") || currentGenre.includes("rap")) {
            styleInstruction = `1. STYLE URBAIN AFRICAIN : Utilise un langage courant, franc et direct. Ajoute naturellement de l'argot ivoirien ou urbain ("môgô", "enjaillement", "drap", "faro", "kiffer") pour que ça sonne très authentique et rue. PAS de poésie classique.`;
        } else if (currentGenre.includes("gospel")) {
            styleInstruction = `1. STYLE GOSPEL : Utilise un vocabulaire spirituel, respectueux, inspirant et pur (Seigneur, grâce, foi, louange). AUCUN argot, AUCUN mot de la rue, AUCUNE vulgarité.`;
        } else if (currentGenre.includes("zouk") || currentGenre.includes("r&b")) {
            styleInstruction = `1. STYLE ROMANTIQUE : Utilise un vocabulaire centré sur l'amour, les sentiments, la douceur et la passion. Reste très mélodieux. AUCUN mot de la rue ou argot dur.`;
        } else {
            styleInstruction = `1. STYLE ADAPTÉ : Adapte le vocabulaire exactement au style musical demandé ("${genre}"). Reste naturel et évite la poésie trop compliquée.`;
        }

        const systemPrompt = `Tu es un parolier professionnel de musique. Tu dois écrire les paroles d'une chanson.
LE STYLE DEMANDÉ EST : ${genre || 'Pop'}

RÈGLES IMPORTANTES :
${styleInstruction}
2. 100% UNIQUE À CHAQUE FOIS : Chaque chanson doit être totalement différente des précédentes. Ne réutilise jamais les mêmes rimes, varie au maximum ton imagination !
3. STRUCTURE OBLIGATOIRE : Utilise strictement ces balises reconnues par l'IA musicale : [Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro].
4. LE REFRAIN (Chorus) : Il doit être super accrocheur, facile à retenir, et correspondre à l'émotion du style musical.
5. FORMAT STRICT : Renvoie UNIQUEMENT les paroles de la chanson. Zéro explication avant, zéro bonjour, zéro commentaire après.`;

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
                    { role: 'user', content: `Écris-moi les paroles d'une chanson sur ce thème : "${prompt || 'La vie de tous les jours'}".\nLe genre musical est : ${genre || 'Général'}.\n(Code diversité aléatoire : ${Date.now()})` }
                ],
                temperature: 0.95, // Très haut pour assurer la diversité des textes
                max_tokens: 1000
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(500).json({ error: data.error?.message || "Erreur Groq" });
        }

        return res.status(200).json({ lyrics: data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
