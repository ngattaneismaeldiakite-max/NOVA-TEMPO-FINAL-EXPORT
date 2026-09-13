export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    const PIAPI_KEY = "7eafe4d5fb1ed82a5e9d911db62168687e3a85160ed92ecd5fb6a95f1b3883eb";
    
    try {
        const { lyrics, voice, genre } = req.body;
        const tags = genre + ", " + voice + " voice";
        
        const response = await fetch('https://api.piapi.ai/api/suno/v1/music', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + PIAPI_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                custom_mode: true,
                prompt: lyrics,
                tags: tags,
                title: 'NovaTempo Track',
                make_instrumental: false,
                wait_audio: false
            })
        });

        const data = await response.json();
        if (data.code !== 200) {
            return res.status(500).json({ error: data.message || 'API Error PiAPI' });
        }

        return res.status(200).json({ job_id: data.data.task_id });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}