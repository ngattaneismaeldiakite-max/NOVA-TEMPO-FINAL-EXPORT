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
        const { prompt, genre } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Le sujet (prompt) est requis.' });
        }

        const systemPrompt = `Tu es un parolier professionnel. Ecris les paroles completes d'une chanson sur le theme fourni. Style musical demande : ${genre || 'Pop'}. Structure exigee : [Couplet 1], [Refrain], [Couplet 2], [Refrain], [Pont], [Refrain], [Outro]. Ne mets pas de texte d'introduction ni de conclusion, renvoie UNIQUEMENT les paroles.`;

        if (process.env.GROQ_API_KEY) {
            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Theme de la chanson : ${prompt}` }
                    ],
                    temperature: 0.8,
                    max_tokens: 500
                })
            });

            if (!groqResponse.ok) {
                const errorText = await groqResponse.text();
                console.error("Erreur Groq:", errorText);
                return res.status(500).json({ error: "Erreur avec l'API Groq : " + errorText });
            }

            const data = await groqResponse.json();
            return res.status(200).json({
                success: true,
                lyrics: data.choices[0].message.content.trim()
            });
        }
        
        // Simule le temps de rflexion de l'IA (Si GROQ_API_KEY n'est pas encore sur Vercel)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const fallbackLyrics = `[Couplet 1]\nJe regarde le ciel, je pense a tout ca\nLes moments qu'on a vecus, toi et moi\nLe vent souffle fort, mais je reste debout\n\n[Refrain]\nOh, c'est notre histoire qui s'ecrit\nA travers la nuit, a travers la vie\nRien ne pourra jamais nous arreter\nParce qu'on est nes pour briller\n\n[Couplet 2]\nLes obstacles sur la route, on les oublie\nChaque seconde avec toi, c'est de la magie\nOn avance ensemble, sans jamais trembler\n\n[Refrain]\nOh, c'est notre histoire qui s'ecrit\nA travers la nuit, a travers la vie\nRien ne pourra jamais nous arreter\nParce qu'on est nes pour briller\n\n[Pont]\nEt meme si demain le monde s'ecroule\nOn trouvera la force dans la foule\n\n[Outro]\nNes pour briller...\nOui, toi et moi.\n(Fin)`;

        return res.status(200).json({
            success: true,
            lyrics: fallbackLyrics,
            note: "Texte genere en simulation. Ajoutez GROQ_API_KEY sur Vercel !"
        });

    } catch (error) {
        console.error('Erreur Backend:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur lors de la generation du texte.' });
    }
};
