// api/financials.js  –  výkaz zisku a ztrát (10 let)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });

  const KEY = process.env.FMP_KEY;
  try {
    const r = await fetch(
      `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?limit=12&apikey=${KEY}`
    );
    const data = await r.json();
    if (!Array.isArray(data)) return res.status(404).json({ error: 'No data' });

    const rows = data.reverse().map(y => ({
      year:        y.calendarYear || y.date?.substring(0, 4),
      date:        y.date,
      revenue:     y.revenue,
      grossProfit: y.grossProfit,
      netIncome:   y.netIncome,
      ebitda:      y.ebitda,
      eps:         y.eps,
      epsDiluted:  y.epsdiluted,
      grossMargin: y.grossProfitRatio,
      netMargin:   y.netIncomeRatio,
      operatingIncome: y.operatingIncome,
    }));

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
