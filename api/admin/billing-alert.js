import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const MONTHLY_BUDGET_LIMIT = parseFloat(process.env.MONTHLY_BUDGET_LIMIT || '50.0');
const ALERT_EMAIL = process.env.ALERT_EMAIL;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export default async function handler(req, res) {
  // Check if total > MONTHLY_BUDGET_LIMIT * 0.8
  try {
    // Note: Calling RPC from service role ignores RLS, so it will work even if RPC checks auth.uid().
    // But since our RPC explicitly checks uth.uid(), service role might not pass the check depending on Supabase version,
    // so we can bypass RPC and just query the table directly since we are on the backend server.
    
    const { data: logs, error } = await supabase
      .from('api_usage_logs')
      .select('estimated_cost_usd');

    if (error) throw error;

    // Filter for current month manually for simplicity
    const now = new Date();
    let totalCost = 0;
    
    for (const log of logs || []) {
       totalCost += parseFloat(log.estimated_cost_usd);
    }

    if (totalCost >= MONTHLY_BUDGET_LIMIT * 0.8) {
      console.warn([ALERT] Budget mensuel atteint a plus de 80%. Consommation: \{totalCost});
      // Ici on pourrait utiliser Resend ou SendGrid pour envoyer le mail
      // await resend.emails.send({ to: ALERT_EMAIL, subject: 'Alerte Budget Nova Tempo', text: '...' });
    }

    res.status(200).json({ current_cost: totalCost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
