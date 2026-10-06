-- ==========================================================================
-- NOVA TEMPO - Sécurisation des crédits, paiements et chansons (06/10/2026)
-- À exécuter UNE fois dans Supabase > SQL Editor.
-- Compatible avec le code actuellement en ligne : peut être lancé avant le déploiement.
-- ==========================================================================

-- 1. PROFILS ---------------------------------------------------------------
-- Les clients ne peuvent plus modifier eux-mêmes leur ligne (dont les crédits).
drop policy if exists "Modifier son profil" on public.profiles;

update public.profiles set credits = 0 where credits is null;
alter table public.profiles alter column credits set default 0;
alter table public.profiles alter column credits set not null;
alter table public.profiles drop constraint if exists profiles_credits_positifs;
alter table public.profiles add constraint profiles_credits_positifs check (credits >= 0) not valid;

-- Nouvel inscrit : profil créé avec 0 crédit.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits)
  select new.id, new.email, 0
  where not exists (select 1 from public.profiles where id = new.id);
  return new;
end;
$$;

-- 2. PAIEMENTS -------------------------------------------------------------
alter table public.payments add column if not exists credits integer;
alter table public.payments add column if not exists paid_at timestamptz;
create unique index if not exists payments_provider_reference_key
  on public.payments (provider_reference) where provider_reference is not null;

-- Crédite un paiement une seule fois (pending -> success), de façon atomique.
-- Retourne le nouveau solde, ou NULL si le paiement était déjà traité / inconnu.
create or replace function public.credit_payment(p_payment_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_credits integer;
  v_new integer;
begin
  update public.payments
     set status = 'success', paid_at = now()
   where id = p_payment_id and status = 'pending'
  returning user_id, credits into v_user, v_credits;

  if v_user is null then
    return null;
  end if;

  insert into public.profiles (id, email, credits)
  select v_user, (select email from auth.users where id = v_user), 0
  where not exists (select 1 from public.profiles where id = v_user);

  update public.profiles
     set credits = credits + coalesce(v_credits, 0)
   where id = v_user
  returning credits into v_new;

  return v_new;
end;
$$;

-- Retire 1 crédit si le solde le permet. Retourne le nouveau solde, ou NULL si solde insuffisant.
create or replace function public.consume_credit(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new integer;
begin
  update public.profiles
     set credits = credits - 1
   where id = p_user and credits >= 1
  returning credits into v_new;
  return v_new;
end;
$$;

-- Rend 1 crédit (génération échouée).
create or replace function public.refund_credit(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new integer;
begin
  update public.profiles
     set credits = credits + 1
   where id = p_user
  returning credits into v_new;
  return v_new;
end;
$$;

-- Ces fonctions ne sont appelables que par le serveur (clé service_role).
revoke all on function public.credit_payment(uuid) from public, anon, authenticated;
revoke all on function public.consume_credit(uuid) from public, anon, authenticated;
revoke all on function public.refund_credit(uuid) from public, anon, authenticated;
grant execute on function public.credit_payment(uuid) to service_role;
grant execute on function public.consume_credit(uuid) to service_role;
grant execute on function public.refund_credit(uuid) to service_role;

-- 3. CHANSONS (table unique : tracks) -------------------------------------
alter table public.tracks add column if not exists statut text not null default 'completed';
alter table public.tracks add column if not exists suno_task_id text;
alter table public.tracks add column if not exists voix text;
alter table public.tracks add column if not exists erreur text;
alter table public.tracks add column if not exists updated_at timestamptz default now();
create unique index if not exists tracks_suno_task_id_key
  on public.tracks (suno_task_id) where suno_task_id is not null;

-- Les chansons sont désormais enregistrées uniquement par le serveur.
drop policy if exists "Insertion : propriétaires uniquement" on public.tracks;

-- 4. STOCKAGE DES FICHIERS AUDIO --------------------------------------------
-- SunoAPI ne conserve les fichiers que 14 jours : on les copie ici.
insert into storage.buckets (id, name, public)
values ('tracks', 'tracks', true)
on conflict (id) do nothing;
