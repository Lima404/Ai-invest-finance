-- ============================================================
-- AI Invest — Esquema financeiro
-- Tabelas para os "endpoints" do app: receitas, despesas, orcamentos.
-- Padrao Supabase: cada linha pertence a um usuario (user_id) e o
-- acesso e' protegido por Row Level Security (RLS).
--
-- Como aplicar:
--   • Supabase Dashboard > SQL Editor > cole e execute; ou
--   • Supabase CLI:  supabase db push ; ou
--   • MCP do Supabase (apos autenticar): apply_migration
-- ============================================================

-- ----------------------------------------------------------------
-- Funcao utilitaria: mantem updated_at sempre atualizado
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ================================================================
-- RECEITAS (entradas de dinheiro)
-- ================================================================
create table if not exists public.receitas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data        date not null,
  descricao   text not null,
  valor       numeric(14,2) not null check (valor >= 0),
  categoria   text not null default 'Outras receitas',
  origem      text not null default 'Manual',
  observacao  text,
  external_id text,
  created_at  timestamptz not null default now()
);

comment on table public.receitas is 'Entradas de dinheiro do usuario (salario, freelance, investimentos...)';

create index if not exists receitas_user_data_idx on public.receitas (user_id, data desc);
-- dedup de importacoes (OFX/CSV/PDF) por id externo, quando houver
create unique index if not exists receitas_user_external_idx
  on public.receitas (user_id, external_id)
  where external_id is not null;

alter table public.receitas enable row level security;

create policy "receitas_select_own" on public.receitas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "receitas_insert_own" on public.receitas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "receitas_update_own" on public.receitas
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "receitas_delete_own" on public.receitas
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ================================================================
-- DESPESAS (saidas de dinheiro)
-- ================================================================
create table if not exists public.despesas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data        date not null,
  descricao   text not null,
  valor       numeric(14,2) not null check (valor >= 0),
  categoria   text not null default 'Outras despesas',
  origem      text not null default 'Manual',
  observacao  text,
  external_id text,
  created_at  timestamptz not null default now()
);

comment on table public.despesas is 'Saidas de dinheiro do usuario (cadastro manual ou importadas de extrato/fatura)';

create index if not exists despesas_user_data_idx on public.despesas (user_id, data desc);
create index if not exists despesas_user_categoria_idx on public.despesas (user_id, categoria);
create unique index if not exists despesas_user_external_idx
  on public.despesas (user_id, external_id)
  where external_id is not null;

alter table public.despesas enable row level security;

create policy "despesas_select_own" on public.despesas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "despesas_insert_own" on public.despesas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "despesas_update_own" on public.despesas
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "despesas_delete_own" on public.despesas
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ================================================================
-- ORCAMENTOS (metas mensais por categoria de despesa)
-- ================================================================
create table if not exists public.orcamentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria     text not null,
  limite_mensal numeric(14,2) not null check (limite_mensal > 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- uma meta por categoria por usuario
  unique (user_id, categoria)
);

comment on table public.orcamentos is 'Metas de gasto mensais por categoria de despesa';

create index if not exists orcamentos_user_idx on public.orcamentos (user_id);

create trigger orcamentos_set_updated_at
  before update on public.orcamentos
  for each row execute function public.set_updated_at();

alter table public.orcamentos enable row level security;

create policy "orcamentos_select_own" on public.orcamentos
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "orcamentos_insert_own" on public.orcamentos
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "orcamentos_update_own" on public.orcamentos
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "orcamentos_delete_own" on public.orcamentos
  for delete to authenticated using ((select auth.uid()) = user_id);
