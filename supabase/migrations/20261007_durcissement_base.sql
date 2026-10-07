-- ==========================================================================
-- NOVA TEMPO - Durcissement de la base (07/10/2026)
-- À exécuter UNE fois dans Supabase > SQL Editor. Sans risque : peut être relancé.
-- Principe : un client ne fait que LIRE ses propres données ; toute écriture passe par le serveur.
-- ==========================================================================

-- 1. CHANSONS : lecture de ses propres chansons uniquement, aucune écriture depuis le navigateur
alter table public.tracks enable row level security;
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'tracks' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy %I on public.tracks', p.policyname);
  end loop;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tracks' and cmd = 'SELECT') then
    create policy "Lire ses chansons" on public.tracks for select using (auth.uid() = user_id);
  end if;
end $$;
revoke insert, update, delete on public.tracks from anon, authenticated;

-- 2. PAIEMENTS : lecture seule pour le client
alter table public.payments enable row level security;
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'payments' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy %I on public.payments', p.policyname);
  end loop;
end $$;
revoke insert, update, delete on public.payments from anon, authenticated;

-- 3. PROFILS : le client ne peut ni créer, ni modifier, ni supprimer son profil (crédits compris)
revoke insert, update, delete on public.profiles from anon, authenticated;

-- 4. TABLES HISTORIQUES INUTILISÉES : plus aucun accès depuis le navigateur
do $$
declare t text;
begin
  foreach t in array array['songs', 'creations', 'user_credits', 'song_jobs', 'api_usage_logs'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- 5. STOCKAGE : le dossier "tracks" n'accepte que des MP3 de 25 Mo maximum
update storage.buckets
   set file_size_limit = 26214400, allowed_mime_types = array['audio/mpeg']
 where id = 'tracks';

-- 6. PERFORMANCE : listes de chansons et chansons en cours
create index if not exists tracks_user_created_idx on public.tracks (user_id, created_at desc);
create index if not exists tracks_statut_idx on public.tracks (statut) where statut in ('pending', 'processing');
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);
