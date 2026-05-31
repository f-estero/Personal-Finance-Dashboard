import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, ExternalLink, Info } from 'lucide-react'
import * as yahooFinance from 'yahoo-finance2'

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

// ─── Yahoo Finance fetch ──────────────────────────────────────────────────────
async function fetchQuote(ticker: string): Promise<Quote> {
  try {
    const quote = await yahooFinance.quote(ticker)

    if (!quote || quote.regularMarketPrice === null) {
      throw new Error('Ticker non trovato')
    }

    return {
      ticker,
      price: quote.regularMarketPrice || 0,
      change: (quote.regularMarketPrice || 0) - (quote.regularMarketPreviousClose || 0),
      changePct: quote.regularMarketChangePercent || 0,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
      prevClose: quote.regularMarketPreviousClose || 0,
      volume: quote.regularMarketVolume || 0,
      updatedAt: new Date().toISOString().split('T')[0],
    }
  } catch (e: any) {
    throw new Error(e.message || 'Errore nel recupero dei dati')
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function MarketTab({ config }: Props) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const instruments = config.pac?.instruments || []
  const tickeredInstruments = instruments.filter((i: any) => i.ticker?.trim())

  const fetchAllQuotes = useCallback(async () => {
    if (tickeredInstruments.length === 0) return
    setLoading(true)
    const newQuotes: Record<string, Quote> = {}
    const newErrors: Record<string, string> = {}

    for (const ins of tickeredInstruments) {
      try {
        const q = await fetchQuote(ins.ticker.trim())
        newQuotes[ins.id] = q
        // Piccola pausa tra le richieste per evitare rate limiting
        await new Promise(r => setTimeout(r, 200))
      } catch (e: any) {
        newErrors[ins.id] = e.message
      }
    }

    setQuotes(newQuotes)
    setErrors(newErrors)
    setLastFetch(new Date().toLocaleTimeString('it-IT'))
    setLoading(false)
  }, [JSON.stringify(tickeredInstruments.map((i: any) => i.ticker))])

  // Auto-fetch al caricamento del tab
  useEffect(() => {
    if (tickeredInstruments.length > 0 && Object.keys(quotes).length === 0) {
      fetchAllQuotes()
    }
  }, [])

  // ─── Main Market View ───
  return (
    <div className="space-y-5">
      {/* Header con refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Prezzi di mercato</h2>
          <p className="text-xs text-slate-500">
            {lastFetch ? `Aggiornato alle ${lastFetch}` : 'Dati in tempo reale · Yahoo Finance'}
          </p>
        </div>
        <button
          onClick={fetchAllQuotes}
          disabled={loading || tickeredInstruments.length === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Caricamento...' : 'Aggiorna'}
        </button>
      </div>

      {/* Nessun ticker configurato */}
      {tickeredInstruments.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="inline-flex p-3 bg-amber-50 rounded-full mb-3">
            <AlertCircle size={24} className="text-amber-500" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">Nessun ticker configurato</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Vai in <strong>Impostazioni → PAC</strong> e aggiungi il ticker di borsa per ogni ETF (es. <span className="font-mono bg-slate-100 px-1 rounded">VUSA.LON</span>, <span className="font-mono bg-slate-100 px-1 rounded">VOO</span>)
          </p>
        </div>
      )}

      {/* Tabella prezzi */}
      {tickeredInstruments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">I tuoi ETF</h3>
            <p className="text-xs text-slate-500 mt-0.5">Prezzi in tempo reale dalla borsa</p>
          </div>
          <div className="divide-y divide-slate-100">
            {tickeredInstruments.map((ins: any) => {
              const q = quotes[ins.id]
              const err = errors[ins.id]
              const isPos = q ? q.changePct >= 0 : null

              return (
                <div key={ins.id} className="px-5 py-4 flex items-center gap-4">
                  {/* Color dot + nome */}
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ins.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{ins.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{ins.ticker}</p>
                  </div>

                  {loading && !q && !err && (
                    <div className="text-xs text-slate-400 animate-pulse">Caricamento...</div>
                  )}

                  {err && !loading && (
                    <div className="flex items-center gap-1 text-xs text-rose-600">
                      <AlertCircle size={12} />
                      <span>{err}</span>
                    </div>
                  )}

                  {q && (
                    <div className="flex items-center gap-6 flex-shrink-0">
                      {/* High/Low */}
                      <div className="hidden sm:block text-right">
                        <p className="text-[10px] text-slate-400">H: {fmt2(q.high)}</p>
                        <p className="text-[10px] text-slate-400">L: {fmt2(q.low)}</p>
                      </div>
                      {/* Prev close */}
                      <div className="hidden md:block text-right">
                        <p className="text-[10px] text-slate-400">Chiusura prec.</p>
                        <p className="text-xs font-medium text-slate-600">{fmt2(q.prevClose)}</p>
                      </div>
                      {/* Variazione */}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${isPos ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        <span className="text-xs font-semibold tabular-nums">{fmtPct(q.changePct)}</span>
                      </div>
                      {/* Prezzo */}
                      <div className="text-right w-20">
                        <p className="text-base font-bold text-slate-900 tabular-nums">{fmt2(q.price)}</p>
                        <p className={`text-[11px] tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {q.change >= 0 ? '+' : ''}{fmt2(q.change)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {lastFetch && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Dati: {quotes[tickeredInstruments[0]?.id]?.updatedAt || '—'}</span>
              <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-slate-600">
                Yahoo Finance <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Info card */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2.5">
        <Info size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900">
          <strong>Yahoo Finance:</strong> Gratuito, illimitato, senza API key.
          Funziona con qualsiasi ticker: VUSA.LON, VOO, SPY, VXUS, ecc.
          Prezzi in tempo reale durante gli orari di borsa.
        </div>
      </div>
    </div>
  )
}
