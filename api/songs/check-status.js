module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const taskId = req.query.id;
        const apiKey = process.env.PIAPI_KEY;
        if (!apiKey) return res.status(500).json({ error: "La cle API PiAPI est manquante" });
        
        const response = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json().catch(() => ({}));
        
        if (data.code && data.code !== 200) {
            return res.status(500).json({ error: data.message || 'API Error PiAPI' });
        }

        const status = data.data ? data.data.status : 'pending'; 
        
        if (status === 'completed') {
            const outputs = data.data.output;
            return res.status(200).json({ 
                status: 'completed', 
                outputs: outputs // On renvoie TOUT l'objet pour debugger le nom exact de la clé
            });
        } else if (status === 'failed') {
             return res.status(200).json({ status: 'failed' });
        } else {
             return res.status(200).json({ status: 'processing' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}