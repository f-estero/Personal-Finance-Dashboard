-- Corregge i due avvisi del linter Supabase su public.user_data:
-- 0003 auth_rls_initplan e 0006 multiple_permissive_policies.
BEGIN;

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

COMMIT;
