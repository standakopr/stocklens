// api/quote.js  –  aktuální cena + základní metriky
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });

  const KEY = process.env.FMP_KEY;
  try {
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${KEY}`)
    ]);
    const [quote, profile] = await Promise.all([quoteRes.json(), profileRes.json()]);

    if (!quote[0]) return res.status(404).json({ error: 'Ticker not found' });

    const q = quote[0];
    const p = profile[0] || {};

    res.json({
      ticker:      q.symbol,
      name:        q.name,
      price:       q.price,
      change:      q.change,
      changePct:   q.changesPercentage,
      marketCap:   q.marketCap,
      pe:          q.pe,
      eps:         q.eps,
      high52:      q.yearHigh,
      low52:       q.yearLow,
      avgVol:      q.avgVolume,
      volume:      q.volume,
      exchange:    q.exchange,
      sector:      p.sector,
      industry:    p.industry,
      country:     p.country,
      divYield:    p.lastDiv,
      description: p.description,
      employees:   p.fullTimeEmployees,
      website:     p.website,
      image:       p.image,
      currency:    p.currency,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
