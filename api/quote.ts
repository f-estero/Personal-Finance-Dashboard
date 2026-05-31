import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker } = req.query

  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'Ticker mancante' })
  }

  try {
    // Fetch da YahooQuery API (gratuito, pubblico)
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=price`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.quoteSummary?.result?.[0]?.price) {
      return res.status(404).json({ error: 'Ticker non trovato' })
    }

    const price = data.quoteSummary.result[0].price

    return res.status(200).json({
      ticker,
      price: price.regularMarketPrice?.raw || 0,
      change: (price.regularMarketPrice?.raw || 0) - (price.regularMarketPreviousClose?.raw || 0),
      changePct: price.regularMarketChangePercent?.raw || 0,
      high: price.regularMarketDayHigh?.raw || 0,
      low: price.regularMarketDayLow?.raw || 0,
      prevClose: price.regularMarketPreviousClose?.raw || 0,
      volume: price.regularMarketVolume?.raw || 0,
      updatedAt: new Date().toISOString().split('T')[0],
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Errore nel recupero dei dati' })
  }
}
