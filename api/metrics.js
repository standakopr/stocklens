export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });
  const KEY = process.env.FMP_KEY;
  try {
    const r = await fetch(`https://financialmodelingprep.com/stable/key-metrics?symbol=${ticker}&limit=12&apikey=${KEY}`);
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return res.status(404).json({ error: 'No data', raw: data });
    const rows = data.reverse().map(y => ({
      year: y.calendarYear || y.date?.substring(0,4),
      pe: y.peRatio, pb: y.pbRatio, ps: y.priceToSalesRatio,
      roe: y.roe, roa: y.roa, roic: y.roic,
      debtToEquity: y.debtToEquity, currentRatio: y.currentRatio,
      sharesOutstanding: y.sharesOutstanding, freeCashFlow: y.freeCashFlowPerShare,
      dividendYield: y.dividendYield, bookValue: y.bookValuePerShare,
      evEbitda: y.enterpriseValueOverEBITDA,
    }));
    res.json({ metrics: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
}
