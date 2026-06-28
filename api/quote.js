export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });
  const KEY = process.env.FMP_KEY;
  try {
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`https://financialmodelingprep.com/stable/quote?symbol=${ticker}&apikey=${KEY}`),
      fetch(`https://financialmodelingprep.com/stable/profile?symbol=${ticker}&apikey=${KEY}`)
    ]);
    const [quote, profile] = await Promise.all([quoteRes.json(), profileRes.json()]);
    const q = Array.isArray(quote) ? quote[0] : quote;
    const p = Array.isArray(profile) ? profile[0] : profile;
    if (!q || !q.symbol) return res.status(404).json({ error: 'Ticker not found', raw: quote });
    res.json({
      ticker: q.symbol, name: q.name, price: q.price,
      change: q.change, changePct: q.changePercentage,
      marketCap: q.marketCap, pe: q.pe, eps: q.eps,
      high52: q.yearHigh, low52: q.yearLow,
      avgVol: q.avgVolume, volume: q.volume, exchange: q.exchange,
      sector: p?.sector, industry: p?.industry, country: p?.country,
      divYield: p?.lastDiv, employees: p?.fullTimeEmployees,
      website: p?.website, currency: p?.currency || 'USD',
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
}
