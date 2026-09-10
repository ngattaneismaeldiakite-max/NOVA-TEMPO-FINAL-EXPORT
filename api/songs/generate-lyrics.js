module.exports = async (req, res) => {
    // CORS headers - Securisation pour Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        // Le frontend (studio.html) envoie "prompt" (le texte d'inspiration) et "genre" (le style musical)
        const { prompt: inspirationText, genre } = req.body;
        
        // 1. Message Systeme Strict
        const systemPrompt = "Tu es un auteur-compositeur professionnel. Génère UNIQUEMENT les paroles de la chanson demandée, dans le style musical précisé. Ne pose jamais de question, ne demande jamais de précision, ne réponds jamais autre chose que les paroles elles-mêmes.";

        // 2. Message Utilisateur Final
        const finalUserMessage = `Texte d'inspiration : "${inspirationText}"\nStyle musical : ${genre}\n\nÉcris les paroles de la chanson (2 couplets et 1 refrain).`;

        const headers = {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        };

        const selectedModelId = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: selectedModelId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: finalUserMessage }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(400).json({ error: data.error.message || "Erreur de l'API Groq" });
        }

        res.status(200).json({ lyrics: data.choices[0].message.content });
        
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
    }
};