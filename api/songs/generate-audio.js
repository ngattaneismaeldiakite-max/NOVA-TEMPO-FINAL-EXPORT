module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        console.log("=== DÉBUT GENERATION AUDIO ===");
        const { lyrics, voice, genre } = req.body || {};
        let styleParams = genre;
        switch (genre) {
            case 'Coupé Décalé': styleParams = "ivorian coupe decale, atalaku, fast tempo, festive animation, sebene guitar, log drum"; break;
            case 'Amapiano': styleParams = "amapiano, deep log drum, south african vibe, groovy shaker, party"; break;
            case 'Afrobeat': styleParams = "afrobeat, naija groove, smooth percussion, saxophone"; break;
            case 'Ndombolo': styleParams = "ndombolo, congolese rumba, sebene guitar, fast dance"; break;
            case 'Rap Français': styleParams = "french rap, trap beat, heavy 808, punchy drill"; break;
            case 'Zouk': styleParams = "zouk, kizomba, romantic, slow dance, smooth"; break;
            default: styleParams = "afrobeat, log drum"; break;
        }
        
        const voiceTag = voice === 'female' ? "female vocal" : (voice === 'duo' ? "male and female duet" : "male vocal");
        const apiKey = process.env.SUNO_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "La cle API SUNO est manquante" });
        
        const payload = {
            customMode: true,
            instrumental: false,
            prompt: lyrics,
            style: `${styleParams}, ${voiceTag}`,
            title: "Hit NovaTempo",
            model: "V5.5",
            callBackUrl: "https://example.com/callback"
        };
        
        console.log("Payload envoyé à Suno:", JSON.stringify(payload));
        
        const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Réponse Initiale de Suno (Génération):", JSON.stringify(data));
        
        if (data.code && data.code !== 200) {
             console.error("SunoAPI a refusé:", data.msg);
             return res.status(500).json({ error: "SunoAPI a refusé: " + data.msg });
        }

        let jobId = null;
        if (data.data && data.data.taskId) jobId = data.data.taskId;
        else if (data.data && data.data.task_id) jobId = data.data.task_id;
        else if (data.taskId) jobId = data.taskId;
        else if (data.id) jobId = data.id;

        if (!jobId) {
             console.error("ID introuvable dans la réponse.");
             return res.status(500).json({ error: "ID introuvable. Reponse: " + JSON.stringify(data).substring(0, 80) });
        }

        console.log("Génération lancée avec succès, Job ID:", jobId);
        return res.status(200).json({ job_id: jobId });
    } catch (error) {
        console.error("Erreur Catch Generate Audio:", error.message);
        return res.status(500).json({ error: "Erreur: " + error.message });
    }
}
