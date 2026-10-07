-- ==========================================================================
-- NOVA TEMPO - Journal des erreurs (07/10/2026)
-- À exécuter UNE fois dans Supabase > SQL Editor. Peut être relancé sans risque.
-- Visible uniquement par toi (Table Editor) et par le serveur ; jamais par les clients.
-- ==========================================================================
create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,
  niveau text not null default 'erreur',
  message text,
  contexte jsonb,
  user_id uuid
);
alter table public.error_logs enable row level security;
revoke all on public.error_logs from anon, authenticated;
create index if not exists error_logs_created_idx on public.error_logs (created_at desc);

-- Nettoyage : appeler de temps en temps (ou lancer à la main) pour garder 30 jours de journal
create or replace function public.purger_error_logs() returns void
language sql security definer set search_path = public as
$$ delete from public.error_logs where created_at < now() - interval '30 days' $$;
revoke all on function public.purger_error_logs() from public, anon, authenticated;
