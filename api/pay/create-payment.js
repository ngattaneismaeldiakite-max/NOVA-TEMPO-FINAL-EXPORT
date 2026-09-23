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
        if (!selectedPack) return res.status(400).json({ error: 'Pack invalide' });

        const apiKey = process.env.GENIUSPAY_PUBLIC_KEY ? process.env.GENIUSPAY_PUBLIC_KEY.trim() : '';
        const apiSecret = process.env.GENIUSPAY_SECRET_KEY ? process.env.GENIUSPAY_SECRET_KEY.trim() : '';

        const keyInfo = `PublicKey: ${apiKey ? apiKey.substring(0, 7) : 'MANQUANTE'}, SecretKey: ${apiSecret ? apiSecret.substring(0, 7) : 'MANQUANTE'}`;

        if (!apiKey || !apiSecret) {
            return res.status(500).json({ 
                error: `Configuration Vercel incomplète (${keyInfo}). Assurez-vous d'avoir ajouté GENIUSPAY_PUBLIC_KEY et GENIUSPAY_SECRET_KEY sur Vercel.` 
            });
        }

        const host = req.headers.host || 'nova-tempo-final-export.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const geniusPayload = {
            amount: selectedPack.amount,
            currency: 'XOF',
            description: selectedPack.title,
            success_url: `${baseUrl}/profil.html?payment=success&credits=${selectedPack.credits}`,
            error_url: `${baseUrl}/profil.html?payment=cancel`,
            customer: {
                name: user_email ? user_email.split('@')[0] : 'Client NovaTempo',
                email: user_email || 'client@novatempo.com'
            },
            metadata: {
                user_id: user_id,
                credits: selectedPack.credits,
                pack: pack
            }
        };

        const geniusResponse = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'X-API-Secret': apiSecret,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(geniusPayload)
        });

        const text = await geniusResponse.text();
        let data = {};
        try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }

        if (!geniusResponse.ok || (data.success === false)) {
            const errStr = typeof data.error === 'object' ? JSON.stringify(data.error) : (data.message || data.error || text);
            return res.status(500).json({
                error: `GeniusPay (${geniusResponse.status}) [${keyInfo}]: ${errStr}`
            });
        }

        const checkoutUrl = data.data?.checkout_url || data.data?.payment_url || data.checkout_url || data.payment_url;

        if (!checkoutUrl) {
            return res.status(500).json({ error: 'GeniusPay n\'a pas renvoyé d\'URL de paiement: ' + JSON.stringify(data) });
        }

        return res.status(200).json({
            success: true,
            checkout_url: checkoutUrl
        });

    } catch (err) {
        return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
    }
};
