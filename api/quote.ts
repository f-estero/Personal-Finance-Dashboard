import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker } = req.query

  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'Ticker mancante' })
  }

  // 1. Pulizia e auto-traduzione intelligente dei suffissi per Yahoo Finance
  let processedTicker = ticker.trim().toUpperCase()
  
  if (processedTicker.endsWith('.LON')) {
    processedTicker = processedTicker.replace('.LON', '.L') // Traduzione London Stock Exchange
  } else if (processedTicker.endsWith('.MIL')) {
    processedTicker = processedTicker.replace('.MIL', '.MI') // Traduzione Borsa Italiana (.MIL -> .MI)
  } else if (processedTicker.endsWith('.BIT')) {
    processedTicker = processedTicker.replace('.BIT', '.MI') // Traduzione Borsa Italiana (.BIT -> .MI)
  }

  try {
    // URL dell'API Chart di Yahoo Finance (range 1d per avere quotazione odierna e metadati)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(processedTicker)}?range=1d&interval=1d`
    
    // Timeout di sicurezza di 5 secondi
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Fondamentale: emula un browser reale per evitare il blocco anti-bot di Yahoo
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: `Ticker "${processedTicker}" non trovato` })
      }
      return res.status(response.status).json({ error: `Servizio quotazioni non disponibile (HTTP ${response.status})` })
    }
    
    const data = await response.json()

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      return res.status(404).json({ error: `Dati non disponibili per il ticker "${processedTicker}"` })
    }

    const result = data.chart.result[0]
    const meta = result.meta
    const quote = result.indicators?.quote?.[0] || {}

    // Estrazione dei parametri finanziari con fallback robusti
    const price = meta.regularMarketPrice || meta.previousClose || 0
    const prevClose = meta.chartPreviousClose || meta.previousClose || 0
    const change = price - prevClose
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

    // Estrazione dei massimi, minimi e volumi giornalieri
    const high = quote.high?.[0] || price
    const low = quote.low?.[0] || price
    const volume = quote.volume?.[0] || meta.regularMarketVolume || 0

    // Restituisce la risposta nello schema dati originario atteso dal frontend
    return res.status(200).json({
      ticker: processedTicker,
      price,
      change,
      changePct,
      high,
      low,
      prevClose,
      volume,
      updatedAt: new Date().toISOString().split('T')[0],
    })
  } catch (e: any) {
    console.error('Errore nel recupero delle quote per', processedTicker, ':', e)
    const friendlyMessage = e.name === 'AbortError' 
      ? 'Richiesta scaduta (timeout di 5s)' 
      : 'Impossibile recuperare la quotazione di mercato'
    return res.status(500).json({ error: friendlyMessage })
  }
}
