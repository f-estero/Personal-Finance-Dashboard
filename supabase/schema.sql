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

CREATE POLICY "select_own" ON public.user_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON public.user_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON public.user_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON public.user_data FOR DELETE USING (auth.uid() = user_id);
