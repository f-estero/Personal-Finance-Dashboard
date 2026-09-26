import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import type { Session } from '@supabase/supabase-js'
import PersonalFinanceDashboard from './PersonalFinanceDashboard'
import PrivacyPolicy from './PrivacyPolicy'
import { makeT, detectBrowserLang, type TFunc } from './i18n'
import { Wallet, Lock, Mail, Loader2, Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react'

type Screen = 'login' | 'signup' | 'forgot' | 'reset' | 'check-email'

// Supabase distingue diversi motivi di fallimento del login, ma mostrarli tutti
// come "password errata" innesca un circolo vizioso: l'utente riprova, supera il
// limite di tentativi, e continua a vedere lo stesso messaggio sbagliato.
function authErrorMessage(err: any, t: TFunc): string {
  const code = String(err?.code ?? '')
  const status = Number(err?.status ?? 0)
  const msg = String(err?.message ?? '').toLowerCase()

  if (status === 429 || code === 'over_request_rate_limit' || msg.includes('rate limit')) {
    return t('Troppi tentativi ravvicinati. Aspetta qualche minuto prima di riprovare \u2014 la password potrebbe essere corretta.')
  }
  if (code === 'email_not_confirmed' || msg.includes('not confirmed')) {
    return t('Account non ancora confermato. Apri la mail di conferma che ti abbiamo inviato.')
  }
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed')) {
    if (!supabaseConfigured) {
      return t('Configurazione del server mancante (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Contatta l\'amministratore.')
    }
    return t('Impossibile contattare il server. Controlla la connessione e riprova.')
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return t('Email o password errati')
  }
  return err?.message || t('Email o password errati')
}


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
  const [resendBusy, setResendBusy] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
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

  const reset = () => { setError(''); setInfo(''); setEmail(''); setPassword(''); setConfirmPw(''); setResendMsg('') }

  const handleGoogleLogin = async () => {
    setBusy(true); setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setBusy(false)
    if (err) setError(authErrorMessage(err, t))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    if (password !== confirmPw) { setError(t('Le password non coincidono')); setBusy(false); return }
    if (password.length < 8) { setError(t('Password minima 8 caratteri')); setBusy(false); return }
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: { emailRedirectTo: window.location.origin }
    })
    setBusy(false)
    if (err) setError(err.message)
    else if (data?.session) {
      setSession(data.session)
    } else {
      const e = email; reset(); setInfo(e); setScreen('check-email')
    }
  }

  const handleResendConfirmation = async () => {
    if (!info) return
    setResendBusy(true)
    setResendMsg('')
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email: info,
      options: { emailRedirectTo: window.location.origin }
    })
    setResendBusy(false)
    if (err) {
      setResendMsg(err.message)
    } else {
      setResendMsg(t('Nuova email inviata! Controlla anche in Spam.'))
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
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
          <div>
            <h2 className="text-sm font-semibold text-slate-800 mb-4">{t('Accedi')}</h2>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={busy}
              className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 shadow-sm bg-white mb-4 disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t('Continua con Google')}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400 font-medium">{t('oppure con email')}</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
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
          </div>
        )}

        {screen === 'signup' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button type="button" onClick={() => { reset(); setScreen('login') }} className="text-slate-400 hover:text-slate-700"><ArrowLeft size={16} /></button>
              <h2 className="text-sm font-semibold text-slate-800">{t('Crea account')}</h2>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={busy}
              className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 shadow-sm bg-white mb-4 disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t('Continua con Google')}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400 font-medium">{t('oppure con email')}</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
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
          </div>
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
            <p className="text-xs text-slate-600">
              {t('Abbiamo inviato un link a')} <strong>{info}</strong>.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left space-y-1">
              <p className="text-[11px] text-amber-900 font-medium">
                ⚠️ {t('Per accedere è necessario confermare l\'indirizzo cliccando sul link ricevuto.')}
              </p>
              <p className="text-[11px] text-amber-700">
                {t('Controlla anche nella cartella Spam o Posta Indesiderata.')}
              </p>
            </div>

            {resendMsg && (
              <p className="text-xs text-emerald-600 font-medium">{resendMsg}</p>
            )}

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendBusy}
                className="w-full py-2 px-3 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {resendBusy ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                {resendBusy ? t('Invio...') : t('Rinvia email di conferma')}
              </button>

              <button onClick={() => { reset(); setScreen('login') }}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mx-auto pt-1">
                <ArrowLeft size={12} />{t('Torna al login')}
              </button>
            </div>
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
