-- ═══════════════════════════════════════════════════════
-- Personal Finance Dashboard — Supabase Schema
-- Esegui questo nel SQL Editor: supabase.com/dashboard/project/irnocdgpbzjotpclcptr/sql
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_data (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  config     JSONB NOT NULL DEFAULT '{}',
  state      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-aggiorna updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_data_updated_at ON public.user_data;
CREATE TRIGGER user_data_updated_at
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Row Level Security
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Una sola policy per azione, solo per utenti autenticati.
-- (select auth.uid()) viene valutato una volta per query invece che per ogni riga.
-- I DROP rendono lo script rieseguibile e rimuovono la vecchia policy duplicata.
DROP POLICY IF EXISTS "Accesso solo ai propri dati" ON public.user_data;
DROP POLICY IF EXISTS "select_own" ON public.user_data;
DROP POLICY IF EXISTS "insert_own" ON public.user_data;
DROP POLICY IF EXISTS "update_own" ON public.user_data;
DROP POLICY IF EXISTS "delete_own" ON public.user_data;

CREATE POLICY "select_own" ON public.user_data FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "insert_own" ON public.user_data FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "update_own" ON public.user_data FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "delete_own" ON public.user_data FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
