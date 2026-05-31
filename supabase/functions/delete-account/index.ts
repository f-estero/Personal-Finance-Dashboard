// ═══════════════════════════════════════════════════════════════════════════
// Edge Function: delete-account
// Cancella DEFINITIVAMENTE l'account auth dell'utente chiamante + i suoi dati.
// Necessaria perché il client SDK non può eliminare un utente da auth.users:
// serve la service_role key, che NON deve mai stare nel frontend.
//
// Deploy:  supabase functions deploy delete-account
// Secrets: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono iniettati in automatico
//          dal runtime Supabase (non vanno configurati a mano).
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // 1. Identifica l'utente dal suo JWT (Authorization: Bearer <token>)
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return new Response(JSON.stringify({ error: 'Non autenticato' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Client admin (service_role) — bypassa la RLS, usato solo qui lato server.
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Token non valido' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const userId = userData.user.id

  // 2. Cancella i dati finanziari (ridondante con ON DELETE CASCADE, ma esplicito)
  await admin.from('user_data').delete().eq('user_id', userId)

  // 3. Cancella l'account auth — questo rispetta il diritto all'oblio (GDPR art. 17)
  const { error: delErr } = await admin.auth.admin.deleteUser(userId)
  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
