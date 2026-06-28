export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker, period } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });
  const KEY = process.env.FMP_KEY;
  const from = getFromDate(period || '1R');
  try {
    const r = await fetch(`https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${ticker}&from=${from}&apikey=${KEY}`);
    const data = await r.json();
    const hist = Array.isArray(data) ? data.reverse() : [];
    const points = samplePoints(hist, 60);
    res.json(points.map(p => ({ date: p.date, price: p.close })));
  } catch(e) { res.status(500).json({ error: e.message }); }
}
function getFromDate(period) {
  const d = new Date();
  if (period==='1M') d.setMonth(d.getMonth()-1);
  else if (period==='3M') d.setMonth(d.getMonth()-3);
  else if (period==='6M') d.setMonth(d.getMonth()-6);
  else if (period==='5R') d.setFullYear(d.getFullYear()-5);
  else d.setFullYear(d.getFullYear()-1);
  return d.toISOString().split('T')[0];
}
function samplePoints(arr, n) {
  if (arr.length <= n) return arr;
  const step = Math.floor(arr.length / n);
  return arr.filter((_,i) => i % step === 0).slice(0, n);
}
