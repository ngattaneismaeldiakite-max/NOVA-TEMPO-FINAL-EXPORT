// api/pay/create-payment.js
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

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

        const geniusSecretKey = process.env.GENIUSPAY_SECRET_KEY ? process.env.GENIUSPAY_SECRET_KEY.trim() : '';
        if (!geniusSecretKey) {
            return res.status(500).json({ error: 'Clé GENIUSPAY_SECRET_KEY manquante dans les variables Vercel.' });
        }

        const host = req.headers.host || 'nova-tempo.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const endpoints = [
            'https://api.geniuspay.ci/v1/payments',
            'https://sandbox-api.geniuspay.ci/v1/payments',
            'https://api.sandbox.geniuspay.ci/v1/payments',
            'https://api.geniuspay.africa/v1/payments'
        ];

        const headerVariants = [
            { 'Authorization': `Bearer ${geniusSecretKey}` },
            { 'X-API-KEY': geniusSecretKey },
            { 'X-SECRET-KEY': geniusSecretKey },
            { 'X-GENIUS-KEY': geniusSecretKey }
        ];

        let responseData = null;
        let lastErrorMsg = '';

        for (const endpoint of endpoints) {
            for (const headerVar of headerVariants) {
                try {
                    const payload = {
                        amount: selectedPack.amount,
                        currency: 'XOF',
                        description: selectedPack.title,
                        redirect_url: `${baseUrl}/profil.html?payment=success&credits=${selectedPack.credits}`,
                        cancel_url: `${baseUrl}/profil.html?payment=cancel`,
                        webhook_url: `${baseUrl}/api/webhook/geniuspay`,
                        customer_email: user_email || 'client@novatempo.com',
                        api_key: geniusSecretKey,
                        secret_key: geniusSecretKey,
                        metadata: {
                            user_id: user_id,
                            credits: selectedPack.credits
                        }
                    };

                    const geniusResponse = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            ...headerVar
                        },
                        body: JSON.stringify(payload)
                    });

                    const text = await geniusResponse.text();
                    try { responseData = JSON.parse(text); } catch(e) { responseData = { raw: text }; }

                    const checkoutUrl = responseData?.payment_url || responseData?.checkout_url || responseData?.url || responseData?.data?.payment_url || responseData?.data?.checkout_url || responseData?.data?.url;

                    if (geniusResponse.ok && checkoutUrl) {
                        return res.status(200).json({
                            success: true,
                            checkout_url: checkoutUrl,
                            data: responseData
                        });
                    } else {
                        lastErrorMsg = typeof responseData === 'object' ? JSON.stringify(responseData) : String(responseData);
                    }
                } catch (e) {
                    lastErrorMsg = e.message;
                }
            }
        }

        const keyPrefix = geniusSecretKey ? geniusSecretKey.substring(0, 5) : 'vide';
        return res.status(500).json({
            error: `GeniusPay (Clé Vercel commence par: ${keyPrefix}...): ${lastErrorMsg}`
        });

    } catch (err) {
        return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
    }
};
