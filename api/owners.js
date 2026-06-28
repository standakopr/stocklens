// api/owners.js  –  institucionální vlastníci + změny
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });

  const KEY = process.env.FMP_KEY;
  try {
    const r = await fetch(
      `https://financialmodelingprep.com/api/v3/institutional-holder/${ticker}?apikey=${KEY}`
    );
    const data = await r.json();
    if (!Array.isArray(data)) return res.status(404).json({ error: 'No data' });

    // Top 15 vlastníků seřazených podle počtu akcií
    const top = data
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 15)
      .map(h => ({
        holder:    h.holder,
        shares:    h.shares,
        change:    h.change,
        changePct: h.shares > 0 ? (h.change / (h.shares - h.change)) * 100 : 0,
        dateReported: h.dateReported,
      }));

    res.json(top);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
