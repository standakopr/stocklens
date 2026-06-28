export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.FMP_KEY;
  const { endpoint } = req.query;
  
  const urls = {
    financials: `https://financialmodelingprep.com/stable/income-statement?symbol=AAPL&limit=5&apikey=${KEY}`,
    balance:    `https://financialmodelingprep.com/stable/balance-sheet-statement?symbol=AAPL&limit=5&apikey=${KEY}`,
    metrics:    `https://financialmodelingprep.com/stable/key-metrics?symbol=AAPL&limit=5&apikey=${KEY}`,
    owners:     `https://financialmodelingprep.com/stable/institutional-ownership/institutional-holders/symbol?symbol=AAPL&apikey=${KEY}`,
    history:    `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=AAPL&from=2024-01-01&apikey=${KEY}`,
  };
  
  const url = urls[endpoint] || urls.financials;
  try {
    const r = await fetch(url);
    const text = await r.text();
    res.json({ status: r.status, endpoint, raw: text.substring(0, 400) });
  } catch(e) { res.json({ error: e.message }); }
}
