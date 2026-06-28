export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.FMP_KEY;
  try {
    const r = await fetch(`https://financialmodelingprep.com/stable/quote?symbol=AAPL&apikey=${KEY}`);
    const text = await r.text();
    res.json({ status: r.status, key_present: !!KEY, raw: text.substring(0,300) });
  } catch(e) { res.json({ error: e.message }); }
}
