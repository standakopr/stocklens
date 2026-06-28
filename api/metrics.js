// api/metrics.js  –  P/E, počty akcií, ROE, dividendy (10 let)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });

  const KEY = process.env.FMP_KEY;
  try {
    const [metricsRes, sharesRes] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?limit=12&apikey=${KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/shares_float?symbol=${ticker}&apikey=${KEY}`)
    ]);
    const [metrics, sharesData] = await Promise.all([metricsRes.json(), sharesRes.json()]);

    if (!Array.isArray(metrics)) return res.status(404).json({ error: 'No data' });

    const rows = metrics.reverse().map(y => ({
      year:             y.calendarYear || y.date?.substring(0, 4),
      date:             y.date,
      pe:               y.peRatio,
      pb:               y.pbRatio,
      ps:               y.priceToSalesRatio,
      roe:              y.roe,
      roa:              y.roa,
      roic:             y.roic,
      debtToEquity:     y.debtToEquity,
      currentRatio:     y.currentRatio,
      sharesOutstanding: y.sharesOutstanding,
      freeCashFlow:     y.freeCashFlowPerShare,
      dividendYield:    y.dividendYield,
      bookValue:        y.bookValuePerShare,
      evEbitda:         y.enterpriseValueOverEBITDA,
    }));

    res.json({ metrics: rows, float: sharesData[0] || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
