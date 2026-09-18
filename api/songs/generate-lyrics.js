module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { theme } = req.body;
        const groqApiKey = process.env.GROQ_API_KEY;
        
        // Lecture dynamique du modèle via la variable d'environnement
        const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

        if (!groqApiKey) return res.status(500).json({ error: "Clé API Groq manquante" });

        const systemPrompt = `Tu es un parolier urbain africain spécialisé dans les hits de tous les jours (Afrobeat, Coupé Décalé, Amapiano).
RÈGLES IMPORTANTES :
1. LANGAGE QUOTIDIEN ET SIMPLE : AUCUNE poésie, AUCUNE phrase énigmatique ou philosophique, AUCUN style occidental. Utilise le langage courant, franc, direct et familier de la rue et des quartiers en Afrique francophone. Les gens doivent se reconnaître dans la vraie vie.
2. VOCABULAIRE LOCAL : Intègre naturellement l'argot ivoirien ou urbain (Nouchi : "enjaillement", "môgô", "kiffer", "gérer", "chiller", "drap", "wé") comme si tu parlais à tes amis au maquis.
3. 100% UNIQUE À CHAQUE FOIS : Chaque chanson doit être totalement différente des précédentes. Ne réutilise jamais les mêmes phrases ou les mêmes rimes. Varie les refrains !
4. STRUCTURE OBLIGATOIRE : Utilise strictement ces balises reconnues par l'IA musicale : [Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro].
5. LE REFRAIN (Chorus) : Il doit être super simple, très répétitif, ambianceur et taillé pour exploser sur TikTok.
6. FORMAT STRICT : Renvoie UNIQUEMENT les paroles de la chanson. Zéro explication avant, zéro bonjour, zéro commentaire après.`;

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
                    { role: 'user', content: `Écris-moi les paroles d'un son très lourd sur ce thème : "${theme || 'La vraie vie, les amis, la fête'}".\nRappelle-toi : pas de poésie bizarre, parle comme nous au quartier de façon simple ! (Code diversité: ${Date.now()})` }
                ],
                temperature: 0.95, // Température élevée pour forcer la nouveauté à chaque clic
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
