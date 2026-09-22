// api/webhook/geniuspay.js
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const payload = req.body;
        console.log('Webhook GeniusPay reçu :', JSON.stringify(payload));

        const status = payload.status || payload.event || (payload.data && payload.data.status);
        const isSuccess = ['SUCCESS', 'SUCCESSFUL', 'PAID', 'COMPLETED', 'payment.success'].includes(status);

        if (!isSuccess) {
            console.log(`Paiement non finalisé ou échec (statut: ${status}).`);
            return res.status(200).json({ received: true, status: 'ignored' });
        }

        const metadata = payload.metadata || payload.custom_data || (payload.data && payload.data.metadata) || {};
        const userId = metadata.user_id;
        const creditsToAdd = parseInt(metadata.credits || 1, 10);

        if (!userId) {
            console.error('Erreur Webhook: Aucun user_id trouvé dans le payload.');
            return res.status(400).json({ error: 'user_id manquant' });
        }

        const supabaseUrl = 'https://wxkeuyyppzuqplnutwzk.supabase.co';
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseServiceRoleKey) {
            console.error('Erreur Webhook: SUPABASE_SERVICE_ROLE_KEY manquante sur le serveur.');
            return res.status(500).json({ error: 'Configuration serveur incomplète' });
        }

        // 1. Récupération du solde actuel
        const getProfileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits`, {
            headers: {
                'apikey': supabaseServiceRoleKey,
                'Authorization': `Bearer ${supabaseServiceRoleKey}`
            }
        });

        const profiles = await getProfileRes.json();
        const currentCredits = (profiles && profiles.length > 0) ? (profiles[0].credits || 0) : 0;
        const newCredits = currentCredits + creditsToAdd;

        // 2. Mise à jour des crédits dans Supabase
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseServiceRoleKey,
                'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                credits: newCredits,
                updated_at: new Date().toISOString()
            })
        });

        if (!updateRes.ok) {
            const errText = await updateRes.text();
            console.error('Erreur lors de la mise à jour des crédits Supabase :', errText);
            return res.status(500).json({ error: 'Échec de la mise à jour des crédits' });
        }

        console.log(`Succès Webhook : +${creditsToAdd} crédits ajoutés à l'utilisateur ${userId}. Nouveau solde : ${newCredits}`);
        return res.status(200).json({ success: true, message: 'Crédits mis à jour avec succès' });

    } catch (err) {
        console.error('Exception Webhook GeniusPay :', err);
        return res.status(500).json({ error: 'Erreur interne du Webhook', details: err.message });
    }
};
