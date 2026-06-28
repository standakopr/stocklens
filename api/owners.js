export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });
  const KEY = process.env.FMP_KEY;
  try {
    const r = await fetch(`https://financialmodelingprep.com/stable/institutional-ownership/institutional-holders/symbol?symbol=${ticker}&apikey=${KEY}`);
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return res.status(404).json({ error: 'No data', raw: data });
    const top = data.sort((a,b) => b.shares - a.shares).slice(0,15).map(h => ({
      holder: h.investorName || h.holder,
      shares: h.sharesNumber || h.shares,
      change: h.change || 0,
      changePct: h.changeInSharesNumberPercentage || 0,
      dateReported: h.date || h.dateReported,
    }));
    res.json(top);
  } catch(e) { res.status(500).json({ error: e.message }); }
}
