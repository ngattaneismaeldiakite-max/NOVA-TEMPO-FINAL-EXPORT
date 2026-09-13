export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });
    
    const PIAPI_KEY = "7eafe4d5fb1ed82a5e9d911db62168687e3a85160ed92ecd5fb6a95f1b3883eb";
    
    try {
        const taskId = req.query.id;
        
        const response = await fetch('https://api.piapi.ai/api/suno/v1/music/' + taskId, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + PIAPI_KEY,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.code !== 200) {
            return res.status(500).json({ error: data.message || 'API Error PiAPI' });
        }

        const status = data.data.status; 
        
        if (status === 'completed') {
            const clips = data.data.clips;
            let clip1Url = '';
            
            // PiAPI returns clips differently sometimes, usually an object mapped by clip ID or array
            if (Array.isArray(clips) && clips.length > 0) {
                clip1Url = clips[0].audio_url;
            } else if (typeof clips === 'object' && Object.values(clips).length > 0) {
                clip1Url = Object.values(clips)[0].audio_url;
            }
            
            return res.status(200).json({
                status: 'completed',
                audio_url: clip1Url
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