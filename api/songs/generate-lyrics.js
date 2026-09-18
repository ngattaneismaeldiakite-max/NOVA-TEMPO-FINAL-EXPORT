module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // On récupère TOUT : le prompt, le style musical, et la nouvelle occasion !
        const { prompt, genre, occasion } = req.body;
        const groqApiKey = process.env.GROQ_API_KEY;
        const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

        if (!groqApiKey) return res.status(500).json({ error: "Clé API Groq manquante" });

        const currentGenre = (genre || "").toLowerCase();
        const currentOccasion = (occasion || "").toLowerCase();
        
        let styleInstruction = "";
        
        // 1. GESTION DU STYLE MUSICAL
        if (currentGenre.includes("afrobeat") || currentGenre.includes("coupé décalé") || currentGenre.includes("amapiano") || currentGenre.includes("rap")) {
            styleInstruction += `STYLE URBAIN AFRICAIN : Langage courant de la rue, franc et direct. Ajoute de l'argot (Nouchi : "môgô", "enjaillement", "drap", "faro", "kiffer") pour que ça sonne authentique. PAS de poésie classique.\n`;
        } else if (currentGenre.includes("gospel")) {
            styleInstruction += `STYLE GOSPEL : Vocabulaire spirituel, respectueux, inspirant et pur (Seigneur, grâce, foi, louange). AUCUN argot de la rue, AUCUNE vulgarité.\n`;
        } else if (currentGenre.includes("zouk") || currentGenre.includes("r&b")) {
            styleInstruction += `STYLE ROMANTIQUE : Vocabulaire centré sur l'amour, les sentiments, la douceur et la passion. AUCUN mot dur ou vulgaire.\n`;
        } else {
            styleInstruction += `STYLE ADAPTÉ : Adapte le vocabulaire au style musical ("${genre}").\n`;
        }

        // 2. GESTION DE LA PROMOTION / ÉVÉNEMENT
        if (currentOccasion.includes("promotion") || currentOccasion.includes("événement") || currentOccasion.includes("evenement")) {
            styleInstruction += `\nATTENTION - OCCASION PROMOTIONNELLE : L'utilisateur raconte une histoire pour faire la promotion d'un événement, d'un produit ou d'un business. Tu dois ABSOLUMENT transformer son récit en une chanson publicitaire ou événementielle très entraînante qui met en valeur ce qu'il a écrit ! Ne dis pas "voici la promotion", vante le produit musicalement de manière stylée !\n`;
        } else {
            styleInstruction += `\nL'occasion est : "${occasion || 'Générale'}". Adapte l'humeur du texte à cette occasion.\n`;
        }

        const systemPrompt = `Tu es un parolier professionnel de musique. Tu dois écrire les paroles d'une chanson.
LE STYLE DEMANDÉ EST : ${genre || 'Pop'}

RÈGLES IMPORTANTES :
1. ${styleInstruction}
2. 100% UNIQUE À CHAQUE FOIS : Chaque chanson doit être totalement différente des précédentes.
3. STRUCTURE OBLIGATOIRE : Utilise strictement ces balises reconnues par l'IA musicale : [Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro].
4. LE REFRAIN (Chorus) : Il doit être super accrocheur, très répétitif et facile à retenir.
5. FORMAT STRICT : Renvoie UNIQUEMENT les paroles de la chanson. Zéro explication, zéro bonjour, zéro commentaire.`;

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
                    { role: 'user', content: `Écris-moi les paroles sur ce thème : "${prompt || 'La vie de tous les jours'}".\n(Code diversité aléatoire : ${Date.now()})` }
                ],
                temperature: 0.95, // Température haute pour assurer des textes toujours inédits
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
