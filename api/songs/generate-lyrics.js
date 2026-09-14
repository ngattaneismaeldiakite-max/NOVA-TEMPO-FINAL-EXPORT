module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const { prompt, genre } = req.body || {};
        
        if (!prompt || !genre) {
            return res.status(400).json({ error: "Les informations de style ou d'histoire sont manquantes." });
        }
        
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "La cle API Groq est manquante dans les parametres Vercel." });
        }
        
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un parolier professionnel de musique urbaine et pop. Tu dois ecrire des paroles courtes et percutantes (Couplet 1, Refrain, Couplet 2, Refrain). Limite-toi uniquement aux paroles, pas de blabla. Adapte le ton au style musical fourni.'
                    },
                    {
                        role: 'user',
                        content: `Style musical : ${genre}\n\nContexte / Histoire : ${prompt}`
                    }
                ]
            })
        });

        const data = await groqRes.json().catch(() => ({}));
        
        if (!groqRes.ok || data.error) {
            throw new Error((data.error && data.error.message) ? data.error.message : `Erreur HTTP ${groqRes.status}`);
        }
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Format de reponse inattendu de Groq.");
        }
        
        const generatedLyrics = data.choices[0].message.content.trim();
        
        return res.status(200).json({ lyrics: generatedLyrics });
    } catch (error) {
        console.error("Erreur generation Groq:", error);
        return res.status(500).json({ error: "Erreur serveur: " + error.message });
    }
}