module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        console.log("=== DÉBUT GENERATION AUDIO ===");

        // --- 🔒 LE NOUVEAU CADENAS DE SÉCURITÉ ICI ---
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Accès refusé : Vous devez être connecté pour créer une musique." });
        }
        const token = authHeader.split(' ')[1];
        
        // Vérification du badge directement avec ton projet Supabase
        const verifyRes = await fetch('https://wxkeuyyppzuqplnutwzk.supabase.co/auth/v1/user', {
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'apikey': 'sb_publishable_DrMH4qQCF4s1KyoPjvlJeA_puXHR_rr' 
            }
        });
        if (!verifyRes.ok) {
            return res.status(401).json({ error: "Accès refusé : Session invalide ou expirée." });
        }
        // --------------------------------------------

        const { lyrics, voice, genre } = req.body || {};
        
        // --- 🛡️ PROTECTION CONTRE LE SPAM DE TEXTE ---
        if (lyrics && lyrics.length > 2000) {
            return res.status(400).json({ error: "Le texte de la chanson est trop long." });
        }

        let styleParams = genre;
        switch (genre) {
            case 'Coupé Décalé': styleParams = "ivorian coupe decale, atalaku, fast tempo, festive animation, sebene guitar, log drum"; break;
            case 'Amapiano': styleParams = "amapiano, deep log drum, south african vibe, groovy shaker, party"; break;
            case 'Afrobeat': styleParams = "afrobeat, naija groove, smooth percussion, saxophone"; break;
            case 'Ndombolo': styleParams = "ndombolo, congolese rumba, sebene guitar, fast dance"; break;
            case 'Rap Français': styleParams = "french rap, trap beat, heavy 808, punchy drill"; break;
            case 'Zouk': styleParams = "zouk, kizomba, romantic, slow dance, smooth"; break;
            case 'Gospel': styleParams = "gospel choir, uplifting, emotional, spiritual, powerful vocals, organ"; break;
            default: styleParams = "afrobeat, log drum"; break;
        }
        
        const voiceTag = voice === 'female' ? "female vocal" : (voice === 'duo' ? "male and female duet" : "male vocal");
        const apiKey = process.env.SUNO_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Erreur de configuration serveur interne." });
        
        const payload = {
            customMode: true,
            instrumental: false,
            prompt: lyrics,
            style: `${styleParams}, ${voiceTag}`,
            title: "Hit NovaTempo",
            model: "V6",
            callBackUrl: "https://example.com/callback"
        };
        
        const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.code && data.code !== 200) {
             return res.status(500).json({ error: "Une erreur est survenue lors de la création musicale chez l'opérateur." });
        }

        let jobId = null;
        if (data.data && data.data.taskId) jobId = data.data.taskId;
        else if (data.data && data.data.task_id) jobId = data.data.task_id;
        else if (data.taskId) jobId = data.taskId;
        else if (data.id) jobId = data.id;

        if (!jobId) {
             return res.status(500).json({ error: "Erreur de communication avec le studio." });
        }

        return res.status(200).json({ job_id: jobId });
    } catch (error) {
        // On cache le message d'erreur technique (Point 4 de l'audit)
        console.error("Erreur serveur backend:", error.message);
        return res.status(500).json({ error: "Une erreur inattendue s'est produite sur nos serveurs." });
    }
}
