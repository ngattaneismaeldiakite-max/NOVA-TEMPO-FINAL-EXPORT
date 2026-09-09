const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
}

const COST_PER_SONG = 50; // Prix en credits

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase n\'est pas configure sur Vercel.' });
  }

  // 1. Authentification de l'utilisateur
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

      const { lyrics, genre, voice } = req.body;
      if (!lyrics) {
        return res.status(400).json({ error: 'Paroles manquantes' });
      }

      // 2. Vrification du solde
      const { data: credits, error: creditError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (creditError || !credits || credits.balance < COST_PER_SONG) {
        return res.status(402).json({ error: 'Solde insuffisant' });
      }

      // 3. Dbit des crdits
      const newBalance = credits.balance - COST_PER_SONG;
      await supabase
        .from('user_credits')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      // 4. Appel a ElevenLabs (Simulation si pas de cl)
      let audioUrl = "";
      const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

      if (elevenLabsKey) {
          // VRAI APPEL API ELEVENLABS (Exemple TTS - a adapter selon le endpoint exact voulu)
          console.log("Appel de l'API ElevenLabs en cours...");
          // const voiceId = voice === 'female' ? 'EXAVITQu4vr4xnSDxMaL' : 'pNInz6obpgDQGcFmaJcg';
          // const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, { ... });
          // Upload sur Supabase Storage...
          // audioUrl = publicUrl;
          
          // Simulation tempo le temps que la vraie cl soit active et teste
          await new Promise(resolve => setTimeout(resolve, 3000));
          audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 
      } else {
          // SIMULATION EN ATTENDANT LA CL
          console.log("Simulation ElevenLabs (Cl manquante)");
          await new Promise(resolve => setTimeout(resolve, 3000));
          audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 
      }

      // 5. Sauvegarde de la chanson gnre dans l'historique
      const { data: job, error: jobError } = await supabase
        .from('song_jobs')
        .insert([{
          user_id: user.id,
          prompt: lyrics,
          metadata: { genre, voice },
          status: 'completed',
          audio_url: audioUrl
        }])
        .select('id')
        .single();

      if (jobError) {
        // Remboursement en cas d'echec
        await supabase.from('user_credits').update({ balance: credits.balance }).eq('user_id', user.id);
        return res.status(500).json({ error: 'Failed to create job/song' });
      }

      return res.status(200).json({ success: true, job_id: job.id, audio_url: audioUrl, new_balance: newBalance });
  } catch(err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur Serveur Interne' });
  }
}