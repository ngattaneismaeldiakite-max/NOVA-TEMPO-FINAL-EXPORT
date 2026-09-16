module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const taskId = req.query.id;
        const apiKey = process.env.SUNO_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "La cle API Suno est manquante" });
        
        const response = await fetch(`https://api.sunoapi.org/api/v1/generate?ids=${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        let songData;
        if (Array.isArray(data)) songData = data[0];
        else if (data.data && Array.isArray(data.data)) songData = data.data[0];
        else songData = data;
        
        if (!songData) return res.status(200).json({ status: 'processing' });

        const status = songData.status || 'pending'; 
        
        if (status === 'complete' || status === 'completed') {
            return res.status(200).json({ 
                status: 'completed', 
                outputs: [songData] 
            });
        } else if (status === 'failed' || status === 'error') {
             return res.status(200).json({ status: 'failed' });
        } else {
             return res.status(200).json({ status: 'processing' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
