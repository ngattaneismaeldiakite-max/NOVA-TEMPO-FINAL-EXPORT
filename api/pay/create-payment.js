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
            return res.status(500).json({ error: 'Clé GENIUSPAY_SECRET_KEY manquante sur Vercel.' });
        }

        const host = req.headers.host || 'nova-tempo.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const geniusPayload = {
            amount: selectedPack.amount,
            currency: 'XOF',
            description: selectedPack.title,
            redirect_url: `${baseUrl}/profil.html?payment=success&credits=${selectedPack.credits}`,
            cancel_url: `${baseUrl}/profil.html?payment=cancel`,
            webhook_url: `${baseUrl}/api/webhook/geniuspay`,
            customer_email: user_email || 'client@novatempo.com',
            metadata: {
                user_id: user_id,
                credits: selectedPack.credits
            }
        };

        // Adresses officielles de l'API GeniusPay
        const endpoints = [
            'https://api.geniuspay.ci/v1/payments',
            'https://api.geniuspay.africa/v1/payments',
            'https://api.geniuspay.app/v1/payments',
            'https://geniuspay.ci/api/v1/payments'
        ];

        let logs = [];
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${geniusSecretKey}`,
                        'X-API-KEY': geniusSecretKey,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(geniusPayload)
                });

                const text = await response.text();
                let json = null;
                try { json = JSON.parse(text); } catch(e) { json = { raw: text }; }

                const checkoutUrl = json?.payment_url || json?.checkout_url || json?.url || json?.data?.payment_url || json?.data?.checkout_url || json?.data?.url;

                if (response.ok && checkoutUrl) {
                    return res.status(200).json({
                        success: true,
                        checkout_url: checkoutUrl
                    });
                } else {
                    logs.push(`[${endpoint} -> HTTP ${response.status}]: ${text.substring(0, 120)}`);
                }
            } catch (err) {
                logs.push(`[${endpoint} -> Erreur Réseau]: ${err.message}`);
            }
        }

        return res.status(500).json({
            error: `Résultats des adresses GeniusPay:\n` + logs.join('\n')
        });

    } catch (err) {
        return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
    }
};
