module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const { lyrics, voice, genre } = req.body || {};
        
        let tags = genre;
        switch (genre) {
            case 'Afrobeat': tags = "afrobeat, afropop, rhythmic, upbeat, percussion"; break;
            case 'Amapiano': tags = "amapiano, deep log drum, afro house, groovy"; break;
            case 'Pop Acoustique': tags = "acoustic pop, emotional, guitar, piano, clear vocal"; break;
            case 'Rap Français': tags = "french rap, trap beat, hard 808, punchy, urban"; break;
            case 'Coupé Décalé': tags = "coupe decale, fast afrobeat, dance, energetic, african club"; break;
            case 'R&B Soul': tags = "contemporary r&b, smooth soul, romantic, emotional"; break;
            case 'Reggae Dancehall': tags = "dancehall, reggae pop, sunny, tropical, upbeat"; break;
        }
        
        const voiceTag = voice === 'female' ? "female vocalist" : (voice === 'duo' ? "male and female duet" : "male vocalist");
        const finalTags = `${tags}, ${voiceTag}, high quality, catchy`;
        
        const apiKey = process.env.PIAPI_KEY;
        if (!apiKey) return res.status(500).json({ error: "La cle API PiAPI est manquante" });
        
        const response = await fetch('https://api.piapi.ai/api/v1/task', {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "music-u",
                task_type: "generate_music",
                input: {
                    gpt_description_prompt: finalTags,
                    lyrics: lyrics,
                    lyrics_type: "user"
                }
            })
        });

        const rawText = await response.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            return res.status(500).json({ error: `PiAPI erreur brute: ${rawText.substring(0, 150)}` });
        }

        if (data.code !== 200) {
            return res.status(500).json({ error: data.message || `API Error PiAPI (Code ${data.code})` });
        }

        return res.status(200).json({ job_id: data.data.task_id });
    } catch (error) {
        return res.status(500).json({ error: "Erreur serveur: " + error.message });
    }
}