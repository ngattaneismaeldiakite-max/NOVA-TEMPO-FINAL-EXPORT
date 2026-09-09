module.exports = async function handler(req, res) {
    // 2. CORS: N'accepter que le domaine officiel
    const ALLOWED_ORIGIN = 'https://nova-tempo.vercel.app';
    const origin = req.headers.origin;
    
    // On autorise localhost pour le dveloppement, sinon on restreint
    if (origin === ALLOWED_ORIGIN || origin === 'http://127.0.0.1:5500' || origin === 'http://localhost:5500') {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Mthode non autorise' });
    }

    const { promptText, occasion, style, voice } = req.body;

    if (!promptText) {
        return res.status(400).json({ error: 'Le prompt est requis.' });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    if (!ELEVENLABS_API_KEY) {
        // 3. Log dtaill ct serveur uniquement, message gnrique pour le client
        console.error('[AUTH ERROR] Cl API ElevenLabs manquante dans Vercel env.');
        return res.status(500).json({ error: 'Une erreur interne est survenue.' });
    }

    try {
        const fullPrompt = "Une musique pour l'occasion : $occasion. Style musical : $style. Voix : $voice. Contexte : $promptText";

        const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: fullPrompt,
                duration_seconds: 15,
                prompt_influence: 0.5
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            // 3. Log dtaill ct serveur
            console.error('[ELEVENLABS ERROR]', response.status, errorText);
            // 3. Message gnrique pour le client
            throw new Error('Une erreur est survenue lors de la communication avec le service audio.');
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');
        const audioDataUri = "data:audio/mpeg;base64,$base64Audio";

        return res.status(200).json({
            success: true,
            audio_url: audioDataUri,
            lyrics: "Gnr par l'IA"
        });
        
    } catch (error) {
        // 3 & 4. Log dtaill serveur, pas de console.log de dbug, erreur gnrique renvoye
        console.error("[SERVER ERROR]", error.message);
        return res.status(500).json({ error: 'Une erreur inattendue est survenue. Veuillez ressayer plus tard.' });
    }
}
