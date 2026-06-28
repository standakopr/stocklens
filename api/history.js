// api/history.js  –  historické ceny pro graf
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker, period } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });

  const KEY = process.env.FMP_KEY;

  // Podle periody zvolíme endpoint
  let url;
  if (period === '5R' || period === '10R') {
    url = `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?serietype=line&apikey=${KEY}`;
  } else {
    const from = getFromDate(period);
    url = `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?from=${from}&serietype=line&apikey=${KEY}`;
  }

  try {
    const r = await fetch(url);
    const data = await r.json();
    const hist = (data.historical || []).reverse(); // nejstarší první

    // Redukujeme počet bodů pro přehlednost
    const points = samplePoints(hist, 60);
    res.json(points.map(p => ({ date: p.date, price: p.close })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function getFromDate(period) {
  const d = new Date();
  if (period === '1M') d.setMonth(d.getMonth() - 1);
  else if (period === '3M') d.setMonth(d.getMonth() - 3);
  else if (period === '6M') d.setMonth(d.getMonth() - 6);
  else d.setFullYear(d.getFullYear() - 1); // 1R default
  return d.toISOString().split('T')[0];
}

function samplePoints(arr, n) {
  if (arr.length <= n) return arr;
  const step = Math.floor(arr.length / n);
  return arr.filter((_, i) => i % step === 0).slice(0, n);
}
