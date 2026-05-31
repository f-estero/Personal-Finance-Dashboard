import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'ATTENZIONE: Variabili d\'ambiente di Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) mancanti! ' +
    'Configura il file .env per abilitare la sincronizzazione cloud.'
  )
}

const safeUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://dummy-url.supabase.co';
const safeKey = supabaseAnonKey || 'dummy-key';

export const supabase = createClient(safeUrl, safeKey);

// ─── Storage adapter ──────────────────────────────────────────────────────────
// Stessa interfaccia di window.storage usata nel componente originale.
// Legge/scrive un singolo record JSON per utente nella tabella user_data.

export const storage = {
  async get(key: string): Promise<{ value: string } | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_data')
      .select('config, state')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) return null

    // Il componente salva tutto in un unico JSON {version, config, state}
    const payload = JSON.stringify({ config: data.config, state: data.state })
    return { value: payload }
  },

  async set(_key: string, value: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const parsed = JSON.parse(value)
    await supabase
      .from('user_data')
      .upsert(
        { user_id: user.id, config: parsed.config ?? {}, state: parsed.state ?? {} },
        { onConflict: 'user_id' }
      )
  },
}
