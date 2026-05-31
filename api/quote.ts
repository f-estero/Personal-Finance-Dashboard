import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker } = req.query
  const apiKey = '7BARN3ZnGdkClwf7gKatgfjrZt4Y7Uei'

  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'Ticker mancante' })
  }

  try {
    // Fetch da Financial Modeling Prep API
    const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(ticker)}?apikey=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0 || !data[0].price) {
      return res.status(404).json({ error: 'Ticker non trovato' })
    }

    const quote = data[0]

    return res.status(200).json({
      ticker,
      price: quote.price || 0,
      change: quote.change || 0,
      changePct: quote.changesPercentage || 0,
      high: quote.dayHigh || 0,
      low: quote.dayLow || 0,
      prevClose: quote.previousClose || 0,
      volume: quote.volume || 0,
      updatedAt: new Date().toISOString().split('T')[0],
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Errore nel recupero dei dati' })
  }
}
