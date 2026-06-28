export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });
  const KEY = process.env.FMP_KEY;
  try {
    const r = await fetch(`https://financialmodelingprep.com/stable/balance-sheet-statement?symbol=${ticker}&limit=12&apikey=${KEY}`);
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return res.status(404).json({ error: 'No data', raw: data });
    const rows = data.reverse().map(y => ({
      year: y.calendarYear || y.date?.substring(0,4),
      totalAssets: y.totalAssets, totalCurrentAssets: y.totalCurrentAssets,
      cash: y.cashAndCashEquivalents, inventory: y.inventory, goodwill: y.goodwill,
      totalLiabilities: y.totalLiabilities, totalCurrentLiab: y.totalCurrentLiabilities,
      longTermDebt: y.longTermDebt, totalEquity: y.totalStockholdersEquity,
      retainedEarnings: y.retainedEarnings,
    }));
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
}
