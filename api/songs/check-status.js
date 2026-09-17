module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const taskId = req.query.id;
        console.log(`\n=== CHECK STATUS POUR ID: ${taskId} ===`);
        
        const apiKey = process.env.SUNO_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Clé manquante" });
        
        const response = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log("Réponse check-status Suno:", JSON.stringify(data));
        
        if (data.code && data.code !== 200) {
            console.error("Erreur dans le statut:", data.msg);
            return res.status(200).json({ error: data.msg || 'Erreur API Suno' });
        }
        
        let sunoData = [];
        if (data.data && data.data.response && Array.isArray(data.data.response.sunoData)) sunoData = data.data.response.sunoData;
        else if (data.data && data.data.sunoData) sunoData = data.data.sunoData;
        else if (data.data && Array.isArray(data.data)) sunoData = data.data;

        if (sunoData && sunoData.length > 0) {
            const song = sunoData[0];
            const status = song.status ? song.status.toLowerCase() : 'processing'; 
            const audioUrl = song.audio_url || song.url || song.song_path;
            
            console.log(`Statut de la piste analysé: ${status}, Audio URL: ${audioUrl ? 'Présent' : 'Absent'}`);
            
            if (status === 'complete' || status === 'completed' || status === 'success' || audioUrl) {
                console.log("SUCCÈS: Chanson prête !");
                return res.status(200).json({ status: 'completed', outputs: [song] });
            }
            if (status === 'fail' || status === 'failed' || status === 'error') {
                 console.error("ECHEC de la génération chez Suno.");
                 return res.status(200).json({ status: 'failed' });
            }
        }
        
        let debugMsg = data.msg || "en attente";
        if (data.data && data.data.status) debugMsg = data.data.status;
        
        console.log("Toujours en cours. Info Suno:", debugMsg);
        return res.status(200).json({ status: 'patientez... Info Suno: ' + debugMsg });

    } catch (error) {
        console.error("Erreur Catch Check Status:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
