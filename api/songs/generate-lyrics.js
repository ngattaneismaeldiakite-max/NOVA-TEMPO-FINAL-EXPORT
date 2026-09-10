module.exports = async (req, res) => {
    // CORS headers - Securisation pour Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { theme, style } = req.body;
        
        const prompt = `Ecris les paroles d'une chanson sur le theme '${theme}' dans le style '${style}'. La chanson doit avoir 2 couplets et 1 refrain. Ne mets pas de musique, juste le texte.`;

        const headers = {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        };

        // Configuration du modÃƒÆ’Ã‚Â¨le via Variable d'Environnement, avec un fallback par dÃƒÆ’Ã‚Â©faut
        const selectedModelId = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: selectedModelId,
                messages: [{ role: 'user', content: prompt }],
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