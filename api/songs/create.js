const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
}

const COST_PER_SONG = 50; // Correspond a 1 Chanson

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase n est pas configure sur Vercel.' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

      const { lyrics, genre, voice } = req.body;
      if (!lyrics || lyrics.length < 10) {
        return res.status(400).json({ error: 'Paroles manquantes ou trop courtes' });
      }

      // 1. Check Balance
      const { data: credits, error: creditError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (creditError || !credits || credits.balance < COST_PER_SONG) {
        return res.status(402).json({ error: 'Solde de chansons insuffisant' });
      }

      // 2. Decrement Balance
      const newBalance = credits.balance - COST_PER_SONG;
      await supabase
        .from('user_credits')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      // 3. Create Job
      const { data: job, error: jobError } = await supabase
        .from('song_jobs')
        .insert([{
          user_id: user.id,
          prompt: lyrics,
          metadata: { genre, voice },
          status: 'pending'
        }])
        .select('id')
        .single();

      if (jobError) {
        await supabase.from('user_credits').update({ balance: credits.balance }).eq('user_id', user.id);
        return res.status(500).json({ error: 'Failed to create job' });
      }

      return res.status(200).json({ success: true, job_id: job.id, new_balance: newBalance });
  } catch(err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur Serveur Interne' });
  }
}