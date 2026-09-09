-- ==========================================
-- NOVA TEMPO - INIT SYSTEM
-- ==========================================

-- IMPORTANT: Remplacez 'VOTRE_USER_ID_ICI' par votre vrai user_id (UUID) d'administrateur
-- depuis Supabase Authentication avant d'exécuter ce script !

-- 1. Table: user_credits
CREATE TABLE public.user_credits (
    user_id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    balance integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
-- Insert/Update reserved to service_role (backend)

-- 2. Table: song_jobs
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'done', 'failed', 'refunded');

CREATE TABLE public.song_jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    status job_status DEFAULT 'pending' NOT NULL,
    prompt text NOT NULL,
    elevenlabs_job_id text,
    audio_url text,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.song_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own jobs" ON public.song_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON public.song_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Update reserved to service_role (backend worker)

-- 3. Table: payments
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'XOF' NOT NULL,
    status payment_status DEFAULT 'pending' NOT NULL,
    provider_reference text,
    pack_id text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- 4. Table: api_usage_logs (Financial tracking)
CREATE TABLE public.api_usage_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid REFERENCES public.song_jobs NOT NULL,
    duration_seconds numeric(10,2) NOT NULL,
    estimated_cost_usd numeric(10,4) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read api logs" ON public.api_usage_logs FOR SELECT USING (auth.uid()::text = 'VOTRE_USER_ID_ICI');

-- 5. RPC Function: get_current_month_cost (For Admin Dashboard)
CREATE OR REPLACE FUNCTION public.get_current_month_cost()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_cost numeric;
BEGIN
    -- Securite : verifier l'ID admin
    IF auth.uid()::text != 'VOTRE_USER_ID_ICI' THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT COALESCE(SUM(estimated_cost_usd), 0) INTO total_cost
    FROM public.api_usage_logs
    WHERE date_trunc('month', created_at) = date_trunc('month', now());

    RETURN total_cost;
END;
$$;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_song_jobs_modtime
BEFORE UPDATE ON public.song_jobs
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_credits_modtime
BEFORE UPDATE ON public.user_credits
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

