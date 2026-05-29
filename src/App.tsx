import { useEffect, useState } from 'react'
import { supabase, storage } from './supabase'
import type { Session } from '@supabase/supabase-js'
import PersonalFinanceDashboard from './PersonalFinanceDashboard'
import { Wallet, Mail, Loader2 } from 'lucide-react'

// Inietta l'adapter di storage nel global window così il componente originale
// lo trova senza modifiche (usa window.storage.get/set)
;(window as any).storage = storage

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSending(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setSending(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Wallet size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Personal Finance</h1>
              <p className="text-xs text-slate-500">Dashboard privata</p>
            </div>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail size={22} className="text-emerald-700" />
              </div>
              <p className="text-sm font-semibold text-slate-900 mb-1">Controlla la tua email</p>
              <p className="text-xs text-slate-500">Abbiamo inviato un magic link a <strong>{email}</strong>. Clicca il link per accedere.</p>
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="francesco@email.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white"
                />
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-2 px-4 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                {sending ? 'Invio in corso...' : 'Accedi con magic link'}
              </button>
              <p className="text-[11px] text-slate-400 text-center">Nessuna password — ricevi un link sicuro via email.</p>
            </form>
          )}
        </div>
      </div>
    )
  }

  return <PersonalFinanceDashboard />
}
