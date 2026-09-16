module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const { lyrics, voice, genre } = req.body || {};
        
        let tags = genre;
        switch (genre) {
            case 'Coupé Décalé': tags = "ivorian coupe decale, atalaku, fast tempo, festive animation, sebene guitar, log drum"; break;
            case 'Amapiano': tags = "amapiano, deep log drum, south african vibe, groovy shaker, party"; break;
            case 'Afrobeat': tags = "afrobeat, naija groove, smooth percussion, saxophone"; break;
            case 'Ndombolo': tags = "ndombolo, congolese rumba, sebene guitar, fast dance"; break;
            case 'Rap Français': tags = "french rap, trap beat, heavy 808, punchy drill"; break;
            case 'Zouk': tags = "zouk, kizomba, romantic, slow dance, smooth"; break;
            default: tags = "afrobeat, log drum"; break;
        }
        
        const voiceTag = voice === 'female' ? "smooth female vocalist" : (voice === 'duo' ? "male and female duet" : "energetic male vocalist");
        const finalTags = `${tags}, ${voiceTag}`;
        
        const apiKey = process.env.SUNO_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "La cle API SUNO est manquante" });
        
        const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: lyrics,
                tags: finalTags,
                title: "Hit NovaTempo",
                make_instrumental: false,
                wait_audio: false
            })
        });

        const data = await response.json();
        
        if (!response.ok || !data) {
            return res.status(500).json({ error: `Erreur API Suno` });
        }
        
        const jobId = Array.isArray(data) ? data[0].id : data.id;
        return res.status(200).json({ job_id: jobId });
    } catch (error) {
        return res.status(500).json({ error: "Erreur serveur: " + error.message });
    }
}
