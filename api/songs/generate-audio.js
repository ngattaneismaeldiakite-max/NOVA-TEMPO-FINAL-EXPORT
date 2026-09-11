// maxDuration explicite (60s) pour Vercel
module.exports.maxDuration = 60; // Equivalent CJS de export const maxDuration = 60;

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
}

const COST_PER_SONG = 50; 

// Tâche asynchrone (Background process)
async function processAudioInBackground(jobId, lyrics, voice, userId, creditsBalance, elevenLabsKey) {
    try {
        const voiceId = (voice === 'female') ? 'EXAVITQu4vr4xnSDxMaL' : 'pNInz6obpgDQGcFmaJcg';
        const elResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsKey
            },
            body: JSON.stringify({
                text: lyrics,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (!elResponse.ok) throw new Error("Erreur API ElevenLabs");

        const arrayBuffer = await elResponse.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        const audioUrl = "data:audio/mpeg;base64," + base64Audio;

        await supabase.from('user_credits').update({ balance: creditsBalance - COST_PER_SONG }).eq('user_id', userId);
        await supabase.from('song_jobs').update({ status: 'completed', audio_url: audioUrl }).eq('id', jobId);
    } catch (error) {
        console.error(error);
        await supabase.from('song_jobs').update({ status: 'failed' }).eq('id', jobId);
    }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabase) return res.status(500).json({ error: "Supabase non configuré." });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

      const { lyrics, genre, voice } = req.body;
      if (!lyrics) return res.status(400).json({ error: 'Paroles manquantes' });

      const { data: credits, error: creditError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (creditError || !credits || credits.balance < COST_PER_SONG) {
        return res.status(402).json({ error: 'Solde insuffisant' });
      }

      const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
      if (!elevenLabsKey) return res.status(500).json({ error: "Clé ElevenLabs manquante." });

      // 1. Enregistrement immédiat "en cours"
      const { data: job, error: jobError } = await supabase
        .from('song_jobs')
        .insert([{
          user_id: user.id,
          prompt: lyrics,
          metadata: { genre, voice },
          status: 'en_cours',
          audio_url: ''
        }])
        .select('id')
        .single();

      if (jobError) return res.status(500).json({ error: 'Erreur DB' });

      // 2. Déclenchement de la génération en fond (Polling)
      processAudioInBackground(job.id, lyrics, voice, user.id, credits.balance, elevenLabsKey);

      // 3. Réponse instantanée au frontend
      return res.status(200).json({ success: true, job_id: job.id });
  } catch(err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur Serveur' });
  }
}