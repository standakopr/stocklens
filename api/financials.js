export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });
  const KEY = process.env.FMP_KEY;
  try {
    const r = await fetch(`https://financialmodelingprep.com/stable/income-statement?symbol=${ticker}&limit=12&apikey=${KEY}`);
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return res.status(404).json({ error: 'No data', raw: data });
    const rows = data.reverse().map(y => ({
      year: y.calendarYear || y.date?.substring(0,4),
      revenue: y.revenue, grossProfit: y.grossProfit,
      operatingIncome: y.operatingIncome, ebitda: y.ebitda,
      netIncome: y.netIncome, eps: y.eps, epsDiluted: y.epsdiluted,
      grossMargin: y.grossProfitRatio, netMargin: y.netIncomeRatio,
    }));
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
}
