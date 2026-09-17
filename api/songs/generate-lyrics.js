module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { theme } = req.body;
        const groqApiKey = process.env.GROQ_API_KEY;
        
        // Lecture dynamique du modèle via la variable d'environnement (avec la valeur par défaut demandée)
        const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

        if (!groqApiKey) return res.status(500).json({ error: "Clé API Groq manquante" });

        const systemPrompt = `Tu es le plus grand arrangeur et 'Atalaku' de Côte d'Ivoire (dans le style de Douk Saga, DJ Arafat, Willy L'Ancien).
Ton travail est d'écrire des paroles de chansons (Coupé Décalé, Afrobeat, Amapiano) extrêmement festives et rythmées.
RÈGLES IMPORTANTES :
1. Utilise l'argot ivoirien (Nouchi) de manière naturelle : "enjaillement", "boucantier", "môgô", "drap", "faro", "kiffer", "baramôgô", etc.
2. Commence toujours par un [Intro Atalaku] où tu fais l'animation.
3. Structure avec : [Intro], [Couplet 1], [Refrain], [Couplet 2], [Outro].
4. Le refrain doit être très répétitif et facile à chanter pour TikTok.
5. Adapte tes paroles au thème fourni par l'utilisateur.
6. NE DONNE AUCUNE EXPLICATION, renvoie UNIQUEMENT les paroles.`;

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
                    { role: 'user', content: `Écris-moi un tube africain sur ce thème : ${theme || 'La fête et la joie de vivre'}` }
                ],
                temperature: 0.8,
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
