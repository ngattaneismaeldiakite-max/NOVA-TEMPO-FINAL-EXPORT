module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const { lyrics, voice, genre } = req.body || {};
        
        // Optimisation experte des tags pour Suno (PiAPI)
        let sunoTags = genre;
        switch (genre) {
            case 'Afrobeat':
                sunoTags = "afrobeat, afropop, rhythmic, upbeat, percussion";
                break;
            case 'Amapiano':
                sunoTags = "amapiano, deep log drum, afro house, groovy";
                break;
            case 'Pop Acoustique':
                sunoTags = "acoustic pop, emotional, guitar, piano, clear vocal";
                break;
            case 'Rap Français':
                sunoTags = "french rap, trap beat, hard 808, punchy, urban";
                break;
            case 'Coupé Décalé':
                sunoTags = "coupe decale, fast afrobeat, dance, energetic, african club";
                break;
            case 'R&B Soul':
                sunoTags = "contemporary r&b, smooth soul, romantic, emotional";
                break;
            case 'Reggae Dancehall':
                sunoTags = "dancehall, reggae pop, sunny, tropical, upbeat";
                break;
        }
        
        // Ajout de la voix
        const voiceTag = voice === 'female' ? "female vocalist" : (voice === 'duo' ? "male and female duet" : "male vocalist");
        const finalTags = `${sunoTags}, ${voiceTag}, high quality, catchy`;
        
        const apiKey = process.env.PIAPI_KEY;
        
        if (!apiKey) return res.status(500).json({ error: "La cle API PiAPI est manquante" });
        
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

        const data = await response.json();
        if (data.code !== 200) {
            return res.status(500).json({ error: data.message || 'API Error PiAPI' });
        }

        return res.status(200).json({ job_id: data.data.task_id });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}