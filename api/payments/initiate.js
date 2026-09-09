// api/payments/initiate.js
const { createClient } = require('@supabase/supabase-js');
const pricing = require('../config/pricing');

// Initialisation de Supabase (Variables définies dans Vercel)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = async (req, res) => {
    // Enable CORS for frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { user_id, offer_id, phone_number, payment_method } = req.body;

        if (!user_id || !offer_id) {
            return res.status(400).json({ error: 'user_id et offer_id sont requis.' });
        }

        // 1. Récupérer l'offre depuis la source unique de vérité
        const offer = pricing.OFFERS[offer_id];
        
        if (!offer) {
            return res.status(400).json({ error: 'Offre invalide.' });
        }

        // 2. Créer une transaction en statut "pending" dans la base de données
        const { data: transaction, error: insertError } = await supabase
            .from('payments')
            .insert([{
                user_id: user_id,
                amount: offer.price_fcfa,
                credits_awarded: offer.credits, // On stocke bien les crédits (50, 100, 250)
                status: 'pending',
                payment_method: payment_method || 'mobile_money',
                provider_reference: null // Sera mis à jour après la validation du paiement
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Erreur DB:', insertError);
            throw new Error('Erreur lors de la création de la transaction.');
        }

        // 3. Ici, on simulerait l'appel à l'API de paiement (CinetPay, Wave, etc.)
        // Pour l'instant on retourne les infos pour que le frontend affiche le modal.
        
        return res.status(200).json({
            success: true,
            transaction_id: transaction.id,
            offer_details: {
                name: offer.name,
                price_fcfa: offer.price_fcfa,
                songs: offer.songs
            },
            message: 'Transaction initialisée. Prêt pour le paiement.'
        });

    } catch (error) {
        console.error('Erreur Initiate Payment:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
};
