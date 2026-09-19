import { useEffect, useMemo, useState } from 'react'
import { supabase, storage } from './supabase'
import type { Session } from '@supabase/supabase-js'
import PersonalFinanceDashboard from './PersonalFinanceDashboard'
import PrivacyPolicy from './PrivacyPolicy'
import { makeT, detectBrowserLang } from './i18n'
import { Wallet, Lock, Mail, Loader2, Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react'

;(window as any).storage = storage

type Screen = 'login' | 'signup' | 'forgot' | 'reset' | 'check-email'

export default function App() {
  // Schermata pre-login: nessuna config utente disponibile, si usa la lingua del browser.
  const t = useMemo(() => makeT(detectBrowserLang()), [])

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<Screen>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  useEffect(() => {
    const handler = () => setShowPrivacy(true);
    window.addEventListener('show-privacy', handler);
    return () => window.removeEventListener('show-privacy', handler);
  }, []);

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) setScreen('reset')

    supabase.auth.getSession().then(({ data }) => {
      if (!hash.includes('type=recovery')) setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') { setScreen('reset'); setSession(null) }
      else if (event === 'SIGNED_IN' && screen !== 'reset') setSession(s)
      else if (event === 'SIGNED_OUT') setSession(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const reset = () => { setError(''); setInfo(''); setEmail(''); setPassword(''); setConfirmPw('') }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (err) setError(t('Email o password errati'))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    if (password !== confirmPw) { setError(t('Le password non coincidono')); setBusy(false); return }
    if (password.length < 8) { setError(t('Password minima 8 caratteri')); setBusy(false); return }
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin }
    })
    setBusy(false)
    if (err) setError(err.message)
    else { const e = email; reset(); setInfo(e); setScreen('check-email') }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#type=recovery`
    })
    setBusy(false)
    if (err) setError(err.message)
    else { const e = email; reset(); setInfo(e); setScreen('check-email') }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    if (password !== confirmPw) { setError(t('Le password non coincidono')); setBusy(false); return }
    if (password.length < 8) { setError(t('Password minima 8 caratteri')); setBusy(false); return }
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) setError(err.message)
    else { const { data } = await supabase.auth.getSession(); setSession(data.session); window.location.hash = '' }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
    </div>
  )

  if (session) return (
    <>
      <PersonalFinanceDashboard />
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    </>
  )

  return (
    <>
    {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm p-8">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Wallet size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">Finance Personal Dashboard</h1>
            <p className="text-xs text-slate-500">{t('Dashboard privata')}</p>
          </div>
        </div>

        {screen === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">{t('Accedi')}</h2>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">{t('Email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder={t('nome@email.com')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">{t('Password')}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            <button type="submit" disabled={busy}
              className="w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              {busy ? t('Accesso...') : t('Accedi')}
            </button>
            <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
              <button type="button" onClick={() => { reset(); setScreen('forgot') }}
                className="hover:text-slate-800 underline underline-offset-2">{t('Password dimenticata?')}</button>
              <button type="button" onClick={() => { reset(); setScreen('signup') }}
                className="hover:text-slate-800 flex items-center gap-1">
                <UserPlus size={12} />{t('Registrati')}
              </button>
            </div>
          </form>
        )}

        {screen === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button type="button" onClick={() => { reset(); setScreen('login') }} className="text-slate-400 hover:text-slate-700"><ArrowLeft size={16} /></button>
              <h2 className="text-sm font-semibold text-slate-800">{t('Crea account')}</h2>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">{t('Email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder={t('nome@email.com')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">{t('Password')}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder={t('min. 8 caratteri')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">{t('Conferma password')}</label>
              <input type="password" required value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="••••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="privacy" checked={privacyAccepted}
                onChange={e => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 accent-emerald-600 flex-shrink-0" />
              <label htmlFor="privacy" className="text-xs text-slate-600">
                {t('Ho letto e accetto la')}{' '}
                <button type="button" onClick={() => setShowPrivacy(true)}
                  className="text-emerald-600 hover:underline font-medium">
                  {t('Privacy Policy')}
                </button>
                {'. '}{t('Comprendo che i miei dati finanziari sono memorizzati in cloud.')}
              </label>
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            <button type="submit" disabled={busy || !privacyAccepted}
              className="w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              {busy ? t('Registrazione...') : t('Crea account')}
            </button>
          </form>
        )}

        {screen === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button type="button" onClick={() => { reset(); setScreen('login') }} className="text-slate-400 hover:text-slate-700"><ArrowLeft size={16} /></button>
              <h2 className="text-sm font-semibold text-slate-800">{t('Reset password')}</h2>
            </div>
            <p className="text-xs text-slate-500">{t('Inserisci la tua email — ti mandiamo un link per reimpostare la password.')}</p>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">{t('Email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder={t('nome@email.com')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            <button type="submit" disabled={busy}
              className="w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              {busy ? t('Invio...') : t('Invia link reset')}
            </button>
          </form>
        )}

        {screen === 'check-email' && (
          <div className="text-center py-2 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} className="text-emerald-700" />
            </div>
            <p className="text-sm font-semibold text-slate-900">{t('Controlla la tua email')}</p>
            <p className="text-xs text-slate-500">{t('Abbiamo inviato un link a')} <strong>{info}</strong>.</p>
            <button onClick={() => { reset(); setScreen('login') }}
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mx-auto mt-2">
              <ArrowLeft size={12} />{t('Torna al login')}
            </button>
          </div>
        )}

        {/* Link privacy nel footer */}
        {(screen === 'login' || screen === 'signup') && (
          <p className="text-[11px] text-slate-400 text-center mt-4">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-emerald-600 hover:underline">
              {t('Privacy Policy')}
            </button>
            {' · '}{t('I tuoi dati sono protetti e cifrati')}
          </p>
        )}

        {screen === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">{t('Nuova password')}</h2>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">{t('Nuova password')}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder={t('min. 8 caratteri')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">{t('Conferma password')}</label>
              <input type="password" required value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="••••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            <button type="submit" disabled={busy}
              className="w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              {busy ? t('Salvataggio...') : t('Salva nuova password')}
            </button>
          </form>
        )}

      </div>
    </div>
    </>
  )
}
