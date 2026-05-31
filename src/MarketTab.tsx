import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, ExternalLink, Info } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Quote {
  ticker: string
  price: number
  change: number
  changePct: number
  high: number
  low: number
  prevClose: number
  volume: number
  updatedAt: string
  history?: number[]
  error?: string
}

interface Props {
  config: any
  updateConfig: (patch: any) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt2 = (v: number) =>
  new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

const CACHE_KEY = 'pfd_market_quotes_v2'
const CACHE_TTL = 5 * 60 * 1000 // 5 minuti

const GLOBAL_MARKETS = [
  { id: 'sp500', name: 'S&P 500', ticker: '^GSPC', type: 'index', icon: '📈' },
  { id: 'nasdaq', name: 'NASDAQ 100', ticker: '^NDX', type: 'index', icon: '💻' },
  { id: 'ftsemib', name: 'FTSE MIB', ticker: 'FTSEMIB.MI', type: 'index', icon: '🇮🇹' },
  { id: 'btc', name: 'Bitcoin (EUR)', ticker: 'BTC-EUR', type: 'crypto', icon: '🪙' },
  { id: 'eth', name: 'Ethereum (EUR)', ticker: 'ETH-EUR', type: 'crypto', icon: '⟠' },
  { id: 'gold', name: 'Oro (Gold)', ticker: 'GC=F', type: 'commodity', icon: '🟡' },
  { id: 'oil', name: 'Petrolio (Oil)', ticker: 'CL=F', type: 'commodity', icon: '🛢️' },
]

// ─── Fetch Single Quote ──────────────────────────────────────────────────────
async function fetchQuote(ticker: string): Promise<Quote> {
  try {
    const res = await fetch(`/api/quote?ticker=${encodeURIComponent(ticker)}`)
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Errore di caricamento')
    }

    return data
  } catch (e: any) {
    throw new Error(e.message || 'Errore di connessione')
  }
}

// ─── Premium SVG Sparkline Component ─────────────────────────────────────────
function Sparkline({ data, isPositive }: { data?: number[]; isPositive?: boolean }) {
  if (!data || data.length < 2) {
    return (
      <div className="w-24 h-6 flex items-center justify-center text-[10px] text-slate-400 font-mono tracking-wider">
        ——
      </div>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min === 0 ? 1 : max - min
  
  const width = 100
  const height = 30
  
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width
      const y = height - ((val - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  const strokeColor = isPositive ? '#10b981' : '#f43f5e' // Emerald (verde) o Rose (rosso)

  return (
    <div className="w-24 h-8 flex items-center">
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MarketTab({ config }: Props) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [globalQuotes, setGlobalQuotes] = useState<Record<string, Quote>>({})
  const [globalErrors, setGlobalErrors] = useState<Record<string, string>>({})
  
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<string | null>(null)

  const instruments = config.pac?.instruments || []
  const tickeredInstruments = instruments.filter((i: any) => i.ticker?.trim())

  const fetchAllQuotes = useCallback(async (force = false) => {
    // Controllo Cache
    if (!force) {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < CACHE_TTL) {
            setQuotes(parsed.quotes || {})
            setErrors(parsed.errors || {})
            setGlobalQuotes(parsed.globalQuotes || {})
            setGlobalErrors(parsed.globalErrors || {})
            setLastFetch(parsed.lastFetch || null)
            return
          }
        } catch (e) {
          sessionStorage.removeItem(CACHE_KEY)
        }
      }
    }

    setLoading(true)
    const newQuotes: Record<string, Quote> = {}
    const newErrors: Record<string, string> = {}
    const newGlobalQuotes: Record<string, Quote> = {}
    const newGlobalErrors: Record<string, string> = {}

    // Fetch concorrente in parallelo (Velocità elevata)
    const globalPromises = GLOBAL_MARKETS.map(async (item) => {
      try {
        const q = await fetchQuote(item.ticker)
        newGlobalQuotes[item.id] = q
      } catch (e: any) {
        newGlobalErrors[item.id] = e.message || 'Errore'
      }
    })

    const etfPromises = tickeredInstruments.map(async (ins: any) => {
      try {
        const q = await fetchQuote(ins.ticker.trim())
        newQuotes[ins.id] = q
      } catch (e: any) {
        newErrors[ins.id] = e.message || 'Errore'
      }
    })

    await Promise.all([...globalPromises, ...etfPromises])

    const timeStr = new Date().toLocaleTimeString('it-IT')
    setQuotes(newQuotes)
    setErrors(newErrors)
    setGlobalQuotes(newGlobalQuotes)
    setGlobalErrors(newGlobalErrors)
    setLastFetch(timeStr)
    setLoading(false)

    // Salvataggio in cache
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        quotes: newQuotes,
        errors: newErrors,
        globalQuotes: newGlobalQuotes,
        globalErrors: newGlobalErrors,
        lastFetch: timeStr,
      })
    )
  }, [JSON.stringify(tickeredInstruments.map((i: any) => i.ticker))])

  // Auto-fetch al caricamento
  useEffect(() => {
    fetchAllQuotes()
  }, [fetchAllQuotes])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Mercati Finanziari</h2>
          <p className="text-xs text-slate-500">
            {lastFetch ? `Aggiornato alle ${lastFetch}` : 'Caricamento dati di mercato...'}
          </p>
        </div>
        <button
          onClick={() => fetchAllQuotes(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Aggiornamento...' : 'Aggiorna'}
        </button>
      </div>

      {/* ─── 1. GRIGLIA INDICI GLOBALI & ASSET ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {GLOBAL_MARKETS.map((market) => {
          const q = globalQuotes[market.id]
          const err = globalErrors[market.id]
          const isPos = q ? q.changePct >= 0 : null

          return (
            <div key={market.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm min-w-0 transition-transform duration-200 hover:-translate-y-0.5">
              {/* Sezione Superiore: Icona, Nome ed Exchange Ticker */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm flex-shrink-0">{market.icon}</span>
                  <span className="text-xs font-semibold text-slate-700 truncate">{market.name}</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono tracking-wider block mt-0.5">{market.ticker}</span>
              </div>

              {/* Sezione Inferiore: Prezzo + Badge Variazione (stacked) e Sparkline */}
              <div className="mt-4 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  {loading && !q && !err ? (
                    <div className="h-5 w-16 bg-slate-100 rounded animate-pulse" />
                  ) : err ? (
                    <span className="text-[10px] text-slate-400 font-mono">N/D</span>
                  ) : q ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 tabular-nums truncate">{fmt2(q.price)}</span>
                      <span className={`inline-flex items-center justify-center gap-0.5 text-[9px] font-bold mt-1.5 tabular-nums px-1.5 py-0.5 rounded ${isPos ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {isPos ? '▲' : '▼'} {fmtPct(q.changePct)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">...</span>
                  )}
                </div>
                
                {/* Sparkline dell'indice */}
                {!err && q?.history && (
                  <div className="flex-shrink-0">
                    <Sparkline data={q.history} isPositive={isPos ?? true} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── 2. SEZIONE ETF PERSONALI ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">I tuoi ETF e Fondi in Portafoglio</h3>
            <p className="text-xs text-slate-500 mt-0.5">Andamento dei tuoi asset principali</p>
          </div>
          <Badge valuta="EUR" />
        </div>

        {tickeredInstruments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex p-3 bg-amber-50 rounded-full mb-3">
              <AlertCircle size={24} className="text-amber-500" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">Nessun ticker configurato</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Vai in <strong>Impostazioni → PAC</strong> e aggiungi il ticker di borsa per ogni ETF (es. <span className="font-mono bg-slate-100 px-1 rounded">VUSA.L</span> per Londra, <span className="font-mono bg-slate-100 px-1 rounded">VUSA.MI</span> per Milano o <span className="font-mono bg-slate-100 px-1 rounded">VOO</span>)
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3">ETF / Fondo</th>
                  <th className="px-6 py-3 text-right">Prezzo</th>
                  <th className="px-6 py-3 text-center">Variazione 24h</th>
                  <th className="px-6 py-3 text-center">Trend (30g)</th>
                  <th className="px-6 py-3 text-right hidden sm:table-cell">Precedente</th>
                  <th className="px-6 py-3 text-right hidden md:table-cell">Range Giorno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickeredInstruments.map((ins: any) => {
                  const q = quotes[ins.id]
                  const err = errors[ins.id]
                  const isPos = q ? q.changePct >= 0 : null

                  return (
                    <tr key={ins.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Nome ed ETF */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ins.color }} />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{ins.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">{ins.ticker}</p>
                          </div>
                        </div>
                      </td>

                      {/* Prezzo attuale */}
                      <td className="px-6 py-4 text-right font-semibold tabular-nums text-slate-900">
                        {loading && !q && !err ? (
                          <span className="text-slate-300 animate-pulse">Caricamento...</span>
                        ) : err ? (
                          <span className="text-rose-600 text-xs flex items-center justify-end gap-1">
                            <AlertCircle size={12} /> N/D
                          </span>
                        ) : q ? (
                          <span>{fmt2(q.price)}</span>
                        ) : (
                          <span className="text-slate-300">...</span>
                        )}
                      </td>

                      {/* Variazione */}
                      <td className="px-6 py-4">
                        {q && (
                          <div className="flex items-center justify-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${isPos ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {fmtPct(q.changePct)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Trend (Sparkline) */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {!err && q?.history && (
                            <Sparkline data={q.history} isPositive={isPos ?? true} />
                          )}
                        </div>
                      </td>

                      {/* Chiusura Precedente */}
                      <td className="px-6 py-4 text-right text-slate-500 tabular-nums hidden sm:table-cell">
                        {q ? fmt2(q.prevClose) : '—'}
                      </td>

                      {/* Range Massimo/Minimo */}
                      <td className="px-6 py-4 text-right text-xs text-slate-400 tabular-nums hidden md:table-cell">
                        {q ? (
                          <div>
                            <div>H: {fmt2(q.high)}</div>
                            <div className="text-[10px] text-slate-300">L: {fmt2(q.low)}</div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {lastFetch && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Dati forniti in differita via Yahoo Finance</span>
            <a
              href="https://finance.yahoo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-slate-600 transition-colors"
            >
              Yahoo Finance <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>

      {/* ─── 3. CARD DI INFORMATIVA GENERALE ─── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2.5 shadow-sm">
        <Info size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <strong>Dashboard dei Mercati integrata:</strong> Tutte le informazioni finanziarie (Indici, Criptovalute e Materie Prime) sono recuperate in tempo reale. I dati storici tracciati negli sparkline mostrano l'andamento grafico degli ultimi 30 giorni di borsa. 
          <span className="block mt-1 text-emerald-700 font-medium">Nota: I prezzi degli indici globali come S&P 500 sono espressi nella valuta di origine (USD), mentre Bitcoin ed Ethereum sono espressi in Euro (€).</span>
        </div>
      </div>
    </div>
  )
}

// Piccolo componente di supporto Badge
function Badge({ valuta }: { valuta: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      Valuta: {valuta}
    </span>
  )
}
