module.exports = async (req, res) => {
    // CORS headers - Securisation pour Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { theme, style } = req.body;
        
        const prompt = "Ecris les paroles d'une chanson sur le theme '' dans le style ''. La chanson doit avoir 2 couplets et 1 refrain. Ne mets pas de musique, juste le texte.";

        const headers = {
            'Authorization': Bearer ,
            'Content-Type': 'application/json'
        };

        // 1. RECHERCHE DYNAMIQUE DU MODELE DISPONIBLE (Anti-Deprecation)
        const modelsReq = await fetch('https://api.groq.com/v1/models', { headers });
        const modelsData = await modelsReq.json();
        const availableModels = modelsData.data || [];
        
        if (availableModels.length === 0) {
            throw new Error("Aucun modèle disponible sur Groq pour cette clé API.");
        }

        // On prend un modèle Llama en priorité (en évitant les modèles de sécurité), sinon le premier de la liste
        let selectedModelId = availableModels[0].id;
        const preferred = availableModels.find(m => m.id.includes('llama') && !m.id.includes('guard') && !m.id.includes('whisper'));
        if (preferred) {
            selectedModelId = preferred.id;
        } else {
            const mixtral = availableModels.find(m => m.id.includes('mixtral'));
            if (mixtral) selectedModelId = mixtral.id;
        }

        // 2. GENERATION DES PAROLES
        const response = await fetch('https://api.groq.com/v1/chat/completions', {
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