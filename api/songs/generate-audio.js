// api/songs/generate-audio.js
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Méthode non autorisée" });

    try {
        console.log("=== DÉBUT GENERATION AUDIO ===");
        
        const supabaseUrl = 'https://wxkeuyyppzuqplnutwzk.supabase.co';
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAnonKey = 'sb_publishable_DrMH4qQCF4s1KyoPjvlJeA_puXHR_rr';

        // 1. Vérification de l'authentification (Token Supabase)
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Accès refusé : Vous devez être connecté." });
        }

        // Validation du Token utilisateur via l'API Auth de Supabase (0 dépendance, ultra-rapide)
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey
            }
        });

        const userData = await userRes.json();
        if (!userRes.ok || !userData || !userData.id) {
            return res.status(401).json({ error: "Accès refusé : Votre session a expiré. Veuillez vous reconnecter." });
        }

        const userId = userData.id;

        // 2. Vérification et gestion des crédits
        if (supabaseServiceRoleKey) {
            const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits`, {
                headers: {
                    'apikey': supabaseServiceRoleKey,
                    'Authorization': `Bearer ${supabaseServiceRoleKey}`
                }
            });

            const profiles = await profileRes.json();
            const userCredits = (profiles && profiles.length > 0 && profiles[0].credits !== undefined) ? profiles[0].credits : 0;

            if (userCredits < 1) {
                return res.status(402).json({ error: "Solde insuffisant ! Vous avez 0 crédit. Veuillez recharger votre compte dans Mon Espace." });
            }

            // Déduction de 1 crédit
            await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseServiceRoleKey,
                    'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    credits: userCredits - 1,
                    updated_at: new Date().toISOString()
                })
            });
        }

        // 3. Préparation et envoi à l'IA Suno
        const { lyrics, voice, genre } = req.body || {};
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
        if (!apiKey) {
            return res.status(500).json({ error: "La clé API SUNO est manquante sur Vercel." });
        }

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
            return res.status(500).json({ error: "SunoAPI a refusé: " + (data.msg || "Erreur de génération") });
        }

        let jobId = data.data?.taskId || data.data?.task_id || data.taskId || data.id;
        if (!jobId) {
            return res.status(500).json({ error: "ID de génération introuvable." });
        }

        return res.status(200).json({ job_id: jobId });

    } catch (error) {
        console.error("Erreur Catch Generate Audio:", error);
        return res.status(500).json({ error: "Erreur serveur : " + error.message });
    }
};
