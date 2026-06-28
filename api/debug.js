// api/debug.js  –  test API klíče
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.FMP_KEY;
  
  try {
    const r = await fetch(`https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${KEY}`);
    const text = await r.text();
    res.json({ 
      status: r.status,
      key_present: !!KEY,
      key_length: KEY ? KEY.length : 0,
      raw_response: text.substring(0, 500)
    });
  } catch(e) {
    res.json({ error: e.message });
  }
}
