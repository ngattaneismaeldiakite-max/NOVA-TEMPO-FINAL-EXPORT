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
        
        const systemPrompt = `Tu es un "hitmaker" et parolier ultra-moderne (spécialisé en Afrobeat, Rap, Pop urbaine, Coupé Décalé). 
RÈGLES ABSOLUES :
1. AUCUNE poésie clichée. Zéro métaphore ringarde (interdit d'utiliser des mots comme : destin, âme, étoiles, éternité, larmes, firmament).
2. Utilise un langage courant, urbain, direct et naturel. Ça doit sonner comme un VRAI hit radio d'aujourd'hui, écrit par quelqu'un de la rue ou des clubs, pas comme un poème.
3. Adapte l'énergie au style : si c'est Afrobeat ou Coupé Décalé, sois festif, très rythmé, utilise des onomatopées ou des mots d'ambiance.
4. Structure stricte et aérée : [Couplet 1], [Refrain], [Couplet 2], [Refrain].
5. Ne renvoie QUE les paroles de la chanson, sans aucun commentaire avant ou après.`;
        
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
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