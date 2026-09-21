module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        console.log("=== DÉBUT GENERATION AUDIO AVEC GESTION DES CRÉDITS ===");

        // --- 1. VÉRIFICATION DU BADGE UTILISATEUR ---
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Accès refusé : Vous devez être connecté." });
        }
        const token = authHeader.split(' ')[1];
        
        const supabaseUrl = 'https://wxkeuyyppzuqplnutwzk.supabase.co';
        const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'apikey': 'sb_publishable_DrMH4qQCF4s1KyoPjvlJeA_puXHR_rr' 
            }
        });
        
        if (!verifyRes.ok) return res.status(401).json({ error: "Session invalide ou expirée." });
        
        const userData = await verifyRes.json();
        const userId = userData.id;

        // --- 2. VÉRIFICATION DES CRÉDITS VIA LA MASTER KEY ---
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) return res.status(500).json({ error: "Erreur de configuration serveur." });

        const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits`, {
            method: 'GET',
            headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
        });
        const profileData = await profileRes.json();
        
        if (!profileData || profileData.length === 0) {
            return res.status(400).json({ error: "Profil introuvable dans la base." });
        }
        
        const currentCredits = profileData[0].credits;
        
        // Blocage si pas de crédits !
        if (currentCredits < 1) {
            return res.status(402).json({ error: "Crédits insuffisants. Vous devez recharger votre compte." });
        }

        // --- 3. PAIEMENT : ON RETIRE 1 CRÉDIT ---
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
            method: 'PATCH',
            headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ credits: currentCredits - 1 })
        });

        if (!updateRes.ok) return res.status(500).json({ error: "Erreur lors de la facturation." });

        // --- 4. PRÉPARATION DE LA MUSIQUE ---
        const { lyrics, voice, genre } = req.body || {};
        if (lyrics && lyrics.length > 2000) return res.status(400).json({ error: "Texte trop long." });

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
        const sunoKey = process.env.SUNO_API_KEY;
        
        const payload = {
            customMode: true, instrumental: false, prompt: lyrics,
            style: `${styleParams}, ${voiceTag}`, title: "Hit NovaTempo", model: "V6"
        };
        
        // --- 5. ENVOI À SUNO API ---
        const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sunoKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        // --- 6. GESTION DES ERREURS ET REMBOURSEMENT ---
        let jobId = data.data?.taskId || data.data?.task_id || data.taskId || data.id;

        if ((data.code && data.code !== 200) || !jobId) {
             // L'IA a planté : on rembourse le crédit qu'on vient de prendre !
             await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
                method: 'PATCH',
                headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ credits: currentCredits }) // On remet l'ancien solde intact
             });
             return res.status(500).json({ error: "Suno a refusé la requête. Votre crédit a été remboursé." });
        }

        // Succès total !
        return res.status(200).json({ job_id: jobId });

    } catch (error) {
        console.error("Erreur serveur backend:", error.message);
        return res.status(500).json({ error: "Erreur inattendue sur les serveurs NovaTempo." });
    }
}
