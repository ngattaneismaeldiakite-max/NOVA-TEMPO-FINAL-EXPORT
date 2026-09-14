module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const { lyrics, voice, genre } = req.body || {};
        
        let sunoTags = genre;
        switch (genre) {
            case 'Afrobeat': sunoTags = "afrobeat, afropop, rhythmic, upbeat, percussion"; break;
            case 'Amapiano': sunoTags = "amapiano, deep log drum, afro house, groovy"; break;
            case 'Pop Acoustique': sunoTags = "acoustic pop, emotional, guitar, piano, clear vocal"; break;
            case 'Rap Français': sunoTags = "french rap, trap beat, hard 808, punchy, urban"; break;
            case 'Coupé Décalé': sunoTags = "coupe decale, fast afrobeat, dance, energetic, african club"; break;
            case 'R&B Soul': sunoTags = "contemporary r&b, smooth soul, romantic, emotional"; break;
            case 'Reggae Dancehall': sunoTags = "dancehall, reggae pop, sunny, tropical, upbeat"; break;
        }
        
        const voiceTag = voice === 'female' ? "female vocalist" : (voice === 'duo' ? "male and female duet" : "male vocalist");
        const finalTags = `${sunoTags}, ${voiceTag}, high quality, catchy`;
        
        const apiKey = process.env.PIAPI_KEY;
        if (!apiKey) return res.status(500).json({ error: "La cle API PiAPI est manquante sur Vercel" });
        
        const response = await fetch('https://api.piapi.ai/api/suno/v1/music', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                custom_mode: true,
                prompt: lyrics,
                tags: finalTags,
                title: 'NovaTempo Track',
                make_instrumental: false,
                wait_audio: false
            })
        });

        // Lecture sécurisée du format texte d'abord pour éviter le crash JSON
        const rawText = await response.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            return res.status(500).json({ error: `PiAPI a renvoyé une erreur non-JSON: ${rawText.substring(0, 150)}` });
        }

        if (data.code !== 200) {
            return res.status(500).json({ error: `Erreur PiAPI (Code ${data.code}): ${data.message}` });
        }

        return res.status(200).json({ job_id: data.data.task_id });
    } catch (error) {
        return res.status(500).json({ error: "Erreur Serveur Interne: " + error.message });
    }
}