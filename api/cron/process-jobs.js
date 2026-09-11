import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '3', 10);
const ELEVENLABS_PRICE_PER_MIN = 0.15; // USD per minute

export default async function handler(req, res) {
  // Optionnel: Vrifier un token de cron Vercel si configur
  
  // ==========================================
  // PHASE 1: Lancement des nouveaux jobs
  // ==========================================
  
  // 1. Vrifier la limite de concurrence stricte
  const { count: processingCount, error: countErr } = await supabase
    .from('song_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');
    
  if (countErr) return res.status(500).json({ error: countErr.message });

  const availableSlots = MAX_CONCURRENT_JOBS - (processingCount || 0);

  if (availableSlots > 0) {
    // Rcuprer les jobs en attente selon les slots disponibles
    const { data: pendingJobs, error: pendingErr } = await supabase
      .from('song_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(availableSlots);

    if (pendingJobs && pendingJobs.length > 0) {
      for (const job of pendingJobs) {
        try {
          const response = await axios.post(
            'https://api.elevenlabs.io/v1/music', // Remplacer par l'URL exacte d'Elevenlabs ou l'API cible
            { prompt: job.prompt },
            { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
          );
          
          await supabase
            .from('song_jobs')
            .update({ status: 'processing', elevenlabs_job_id: response.data.job_id })
            .eq('id', job.id);
            
        } catch (error) {
          if (error.response?.status === 429) {
            // Rate limit : On ne met pas en failed, on laisse en pending pour retry (Backoff implicite car non lanc)
            console.log(Job \ rate limited (429), keeping as pending.);
            break; // Stop fetching more if API is saturated
          } else {
            // Echec critique
            console.error(\Job \ failed:\, error.message);
            await supabase.from('song_jobs').update({ 
              status: 'failed', 
              error_message: error.message 
            }).eq('id', job.id);
            
            // Refund
            const { data: credits } = await supabase.from('user_credits').select('balance').eq('user_id', job.user_id).single();
            if (credits) {
              await supabase.from('user_credits').update({ balance: credits.balance + 1 }).eq('user_id', job.user_id);
            }
          }
        }
      }
    }
  }

  // ==========================================
  // PHASE 2: Vrification des jobs en cours (Polling)
  // ==========================================
  
  const { data: activeJobs } = await supabase
    .from('song_jobs')
    .select('*')
    .eq('status', 'processing');

  if (activeJobs && activeJobs.length > 0) {
    for (const job of activeJobs) {
      try {
        const response = await axios.get(
          \https://api.elevenlabs.io/v1/music/\\,
          { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
        );

        if (response.data.status === 'succeeded') {
          const audioUrl = response.data.audio_url; 
          const durationSecs = response.data.duration_seconds || 120; // Default if not provided
          
          // Calculer le cot et logger
          const estimatedCost = (durationSecs / 60) * ELEVENLABS_PRICE_PER_MIN;
          
          await supabase.from('api_usage_logs').insert([{
            job_id: job.id,
            duration_seconds: durationSecs,
            estimated_cost_usd: estimatedCost
          }]);

          await supabase.from('song_jobs').update({
            status: 'done',
            audio_url: audioUrl
          }).eq('id', job.id);
          
        } else if (response.data.status === 'failed') {
          throw new Error("API returned failed status");
        }
        // If still processing, do nothing
      } catch (error) {
        // En cas d'erreur API, on incremente retry_count ou on marque comme failed
        if (error.response?.status === 429) {
           console.log(Polling \ rate limited (429), ignoring for now.);
        } else {
           const nextRetry = job.retry_count + 1;
           if (nextRetry > 3) {
              await supabase.from('song_jobs').update({ status: 'failed', error_message: 'Max retries exceeded' }).eq('id', job.id);
              // Refund logic here...
           } else {
              await supabase.from('song_jobs').update({ retry_count: nextRetry }).eq('id', job.id);
           }
        }
      }
    }
  }

  // Trigger billing alert check asynchronously
  // Note: Un cron pur n'a pas besoin d'attendre la fin de l'alerte
  axios.post(\\/api/admin/billing-alert\).catch(()=>null);

  res.status(200).json({ success: true, processed: activeJobs?.length, started: availableSlots });
}
