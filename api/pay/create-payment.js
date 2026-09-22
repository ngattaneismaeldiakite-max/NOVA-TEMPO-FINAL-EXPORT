// api/pay/create-payment.js
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { pack, user_id, user_email } = req.body;

        if (!user_id || !pack) {
            return res.status(400).json({ error: 'Paramètres manquants (user_id et pack requis)' });
        }

        const packs = {
            'pack1': { amount: 1000, credits: 1, title: '1 Chanson Nova Tempo' },
            'pack3': { amount: 2500, credits: 3, title: 'Pack 3 Chansons Nova Tempo' },
            'pack5': { amount: 4000, credits: 5, title: 'Pack 5 Chansons Nova Tempo' }
        };

        const selectedPack = packs[pack];
        if (!selectedPack) {
            return res.status(400).json({ error: 'Pack invalide' });
        }

        const geniusSecretKey = process.env.GENIUSPAY_SECRET_KEY;
        if (!geniusSecretKey) {
            return res.status(500).json({ error: 'Clé GeniusPay manquante sur le serveur' });
        }

        const host = req.headers.host || 'nova-tempo.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const geniusPayload = {
            amount: selectedPack.amount,
            currency: 'XOF',
            description: selectedPack.title,
            redirect_url: `${baseUrl}/profil.html?payment=success&credits=${selectedPack.credits}`,
            return_url: `${baseUrl}/profil.html?payment=success&credits=${selectedPack.credits}`,
            cancel_url: `${baseUrl}/profil.html?payment=cancel`,
            webhook_url: `${baseUrl}/api/webhook/geniuspay`,
            notify_url: `${baseUrl}/api/webhook/geniuspay`,
            callback_url: `${baseUrl}/api/webhook/geniuspay`,
            customer: {
                email: user_email || 'client@novatempo.com'
            },
            metadata: {
                user_id: user_id,
                credits: selectedPack.credits,
                pack: pack
            },
            custom_data: {
                user_id: user_id,
                credits: selectedPack.credits
            }
        };

        const geniusResponse = await fetch('https://api.geniuspay.ci/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${geniusSecretKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(geniusPayload)
        });

        const data = await geniusResponse.json();

        if (!geniusResponse.ok) {
            console.error('Erreur API GeniusPay :', data);
            return res.status(500).json({ 
                error: 'Impossible d\'initialiser le paiement avec GeniusPay',
                details: data 
            });
        }

        const checkoutUrl = data.payment_url || data.checkout_url || data.url || (data.data && data.data.payment_url);

        return res.status(200).json({
            success: true,
            checkout_url: checkoutUrl,
            data: data
        });

    } catch (err) {
        console.error('Exception paiement GeniusPay :', err);
        return res.status(500).json({ error: 'Erreur interne du serveur', details: err.message });
    }
};
