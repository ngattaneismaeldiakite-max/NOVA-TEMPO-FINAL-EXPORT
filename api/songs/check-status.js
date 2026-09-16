module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const taskId = req.query.id;
        const apiKey = process.env.SUNO_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "La cle API Suno est manquante" });
        
        const response = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.code && data.code !== 200) {
            return res.status(200).json({ error: data.msg || 'Erreur API Suno' });
        }
        
        let sunoData = [];
        if (data.data && data.data.response && Array.isArray(data.data.response.sunoData)) {
            sunoData = data.data.response.sunoData;
        } else if (data.data && data.data.sunoData) {
            sunoData = data.data.sunoData;
        } else if (data.data && Array.isArray(data.data)) {
            sunoData = data.data;
        }
        
        if (!sunoData || sunoData.length === 0) {
            const taskStatus = (data.data && data.data.status) ? data.data.status.toLowerCase() : 'processing';
            if (taskStatus === 'fail' || taskStatus === 'failed') return res.status(200).json({ status: 'failed' });
            return res.status(200).json({ status: 'processing' });
        }

        const songData = sunoData[0];
        const status = songData.status ? songData.status.toLowerCase() : 'processing'; 
        
        // CORRECTION : On accepte "success", "complete", "completed", ou si l'URL audio est déjà là !
        if (status === 'complete' || status === 'completed' || status === 'success' || songData.audio_url || songData.url || songData.song_path) {
            return res.status(200).json({ status: 'completed', outputs: [songData] });
        } else if (status === 'failed' || status === 'error' || status === 'fail') {
             return res.status(200).json({ status: 'failed' });
        } else {
             return res.status(200).json({ status: 'processing' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
