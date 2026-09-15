module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const { lyrics, voice, genre } = req.body || {};
        
        let tags = genre;
        switch (genre) {
            case 'Afrobeat': tags = "afrobeat, log drum, groove bassline, melodic percussion, radio quality"; break;
            case 'Amapiano': tags = "amapiano, deep log drum, afro house, groovy, amapiano piano riff, shaker rhythm, deep bass"; break;
            case 'Pop Acoustique': tags = "acoustic pop, emotional, guitar, piano, clear vocal"; break;
            case 'Rap Français': tags = "french rap, trap beat, hard 808, punchy, urban, french rap flow, trap 808, punchy hi-hats, urban vocal delivery"; break;
            case 'Coupé Décalé': tags = "coupe decale, fast tempo, festive percussion, call and response vocals, party energy"; break;
            case 'R&B Soul': tags = "contemporary r&b, smooth soul, romantic, emotional"; break;
            case 'Reggae Dancehall': tags = "dancehall, reggae pop, sunny, tropical, upbeat"; break;
        }
        
        const voiceTag = voice === 'female' ? "female vocalist" : (voice === 'duo' ? "male and female duet" : "male vocalist");
        const finalTags = `${tags}, ${voiceTag}, professional studio quality, clear mix`;
        
        const apiKey = process.env.GOAPI_KEY;
        if (!apiKey) return res.status(500).json({ error: "La cle GOAPI_KEY est manquante sur Vercel" });
        
        const response = await fetch('https://api.goapi.ai/api/suno/v1/music', {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
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

        const rawText = await response.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            return res.status(500).json({ error: `GoAPI erreur brute: ${rawText.substring(0, 150)}` });
        }

        if (data.code !== 200) {
            return res.status(500).json({ error: data.message || `API Error GoAPI (Code ${data.code})` });
        }

        return res.status(200).json({ job_id: data.data.task_id });
    } catch (error) {
        return res.status(500).json({ error: "Erreur serveur: " + error.message });
    }
}
