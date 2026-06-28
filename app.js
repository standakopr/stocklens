// ============================================================
//  app.js  –  StockLens  (živá data z FMP přes Vercel API)
// ============================================================

let priceChartInst = null;
let currentData    = {};
let activePeriod   = '1R';
let activeSection  = 'financials';

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput').addEventListener('input', e => onSearch(e.target.value));
  document.getElementById('searchInput').addEventListener('keydown', onKey);
  document.querySelectorAll('.qbtn').forEach(b => b.addEventListener('click', () => loadStock(b.dataset.ticker)));
  document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) closeSugg(); });
});

// ---------- SEARCH ----------
const POPULAR = [
  {t:'AAPL',n:'Apple Inc.'},{t:'MSFT',n:'Microsoft Corp.'},{t:'NVDA',n:'NVIDIA Corp.'},
  {t:'GOOGL',n:'Alphabet Inc.'},{t:'TSLA',n:'Tesla Inc.'},{t:'AMZN',n:'Amazon.com'},
  {t:'META',n:'Meta Platforms'},{t:'JPM',n:'JPMorgan Chase'},{t:'V',n:'Visa Inc.'},
  {t:'SJ.TO',n:'Stella-Jones (TSX)'},{t:'BRK-B',n:'Berkshire Hathaway'},
  {t:'JNJ',n:'Johnson & Johnson'},{t:'WMT',n:'Walmart'},{t:'XOM',n:'ExxonMobil'},
];

function onSearch(val) {
  const q = val.trim().toUpperCase();
  const box = document.getElementById('suggestions');
  if (!q) { closeSugg(); return; }
  const hits = POPULAR.filter(x => x.t.includes(q) || x.n.toUpperCase().includes(q)).slice(0,6);
  if (!hits.length) { closeSugg(); return; }
  box.innerHTML = hits.map(x=>`<div class="sugg-item" data-t="${x.t}"><span class="sugg-ticker">${x.t}</span><span class="sugg-name">${x.n}</span></div>`).join('');
  box.querySelectorAll('.sugg-item').forEach(el => el.addEventListener('click', () => {
    document.getElementById('searchInput').value = el.dataset.t;
    closeSugg(); loadStock(el.dataset.t);
  }));
  box.classList.add('open');
}
function onKey(e) { if (e.key==='Enter') { closeSugg(); loadStock(e.target.value.trim().toUpperCase()); } }
function closeSugg() { document.getElementById('suggestions').classList.remove('open'); }

// ---------- LOAD ----------
async function loadStock(ticker) {
  if (!ticker) return;
  ticker = ticker.toUpperCase();
  showLoading();
  try {
    const quote = await apiFetch(`/api/quote?ticker=${ticker}`);
    currentData.quote = quote;
    currentData.ticker = ticker;
    renderHero(quote);
    renderSectionTabs();
    loadSection(activeSection);
  } catch(e) {
    showError(`Ticker "${ticker}" nebyl nalezen. Zkontroluj správnost tickeru.`);
  }
}

async function loadSection(section) {
  activeSection = section;
  document.querySelectorAll('.stab').forEach(b => b.classList.toggle('active', b.dataset.section===section));
  const ticker = currentData.ticker;

  if (section === 'price') {
    showSectionLoading();
    const hist = await apiFetch(`/api/history?ticker=${ticker}&period=${activePeriod}`);
    currentData.history = hist;
    renderPriceSection(hist);

  } else if (section === 'financials') {
    showSectionLoading();
    const fin = await apiFetch(`/api/financials?ticker=${ticker}`);
    currentData.financials = fin;
    renderFinancialsSection(fin);

  } else if (section === 'balance') {
    showSectionLoading();
    const bal = await apiFetch(`/api/balance?ticker=${ticker}`);
    currentData.balance = bal;
    renderBalanceSection(bal);

  } else if (section === 'metrics') {
    showSectionLoading();
    const met = await apiFetch(`/api/metrics?ticker=${ticker}`);
    currentData.metrics = met;
    renderMetricsSection(met);

  } else if (section === 'owners') {
    showSectionLoading();
    const own = await apiFetch(`/api/owners?ticker=${ticker}`);
    currentData.owners = own;
    renderOwnersSection(own);
  }
}

// ---------- API FETCH ----------
async function apiFetch(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ---------- RENDER HERO ----------
function renderHero(q) {
  const up = q.change >= 0;
  const sign = up ? '+' : '';
  const curr = q.currency || 'USD';

  document.getElementById('mainContent').innerHTML = `
    <div class="hero">
      <div class="hero-left">
        <div class="ticker-badge">${currentData.ticker} · ${q.exchange || ''} · ${q.country || ''}</div>
        <div class="company-name">${q.name}</div>
        <div class="price-row">
          <div class="price-big">${curr} ${fmt(q.price, 2)}</div>
          <div class="price-change ${up?'up':'dn'}">
            ${up?'▲':'▼'} ${sign}${fmt(q.change,2)} (${sign}${fmt(q.changePct,2)}%) dnes
          </div>
        </div>
        <div class="tag-row">
          ${q.sector ? `<span class="tag">${q.sector}</span>` : ''}
          ${q.industry ? `<span class="tag">${q.industry}</span>` : ''}
          ${q.country ? `<span class="tag">${q.country}</span>` : ''}
        </div>
      </div>
      <div class="hero-meta">
        <div class="hero-meta-item"><div class="val">${fmtBig(q.marketCap)}</div><div class="lbl">Tržní kap.</div></div>
        <div class="hero-meta-item"><div class="val">${q.pe ? fmt(q.pe,1) : '—'}</div><div class="lbl">P/E</div></div>
        <div class="hero-meta-item"><div class="val">${q.eps ? fmt(q.eps,2) : '—'}</div><div class="lbl">EPS</div></div>
        <div class="hero-meta-item"><div class="val">${q.divYield ? fmt(q.divYield,2)+'%' : '—'}</div><div class="lbl">Dividenda</div></div>
      </div>
    </div>
    <div id="sectionTabs"></div>
    <div id="sectionContent"></div>
  `;
}

// ---------- SECTION TABS ----------
function renderSectionTabs() {
  const tabs = [
    { id:'price',      label:'📈 Graf ceny' },
    { id:'financials', label:'💰 Finanční výkazy' },
    { id:'balance',    label:'🏦 Balance Sheet' },
    { id:'metrics',    label:'📊 Ukazatele' },
    { id:'owners',     label:'👥 Vlastníci' },
  ];
  document.getElementById('sectionTabs').innerHTML = `
    <div class="section-tabs">
      ${tabs.map(t=>`<button class="stab ${t.id===activeSection?'active':''}" data-section="${t.id}">${t.label}</button>`).join('')}
    </div>
  `;
  document.querySelectorAll('.stab').forEach(b => b.addEventListener('click', () => loadSection(b.dataset.section)));
}

// ---------- PRICE SECTION ----------
function renderPriceSection(hist) {
  const q = currentData.quote;
  const up = q.change >= 0;
  setSectionContent(`
    <div class="card">
      <div class="card-header">
        <div class="card-title">Vývoj ceny — ${q.name}</div>
        <div class="period-tabs">
          ${['1M','3M','6M','1R'].map(p=>`<button class="ptab ${p===activePeriod?'active':''}" data-p="${p}">${p}</button>`).join('')}
        </div>
      </div>
      <div class="chart-area"><canvas id="priceChart"></canvas></div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-header"><div class="card-title">Detail ceny</div></div>
        ${infoRow('52T maximum', fmtPrice(q.high52, q.currency))}
        ${infoRow('52T minimum', fmtPrice(q.low52, q.currency))}
        ${infoRow('Dnešní objem', fmtNum(q.volume))}
        ${infoRow('Průměrný objem', fmtNum(q.avgVol))}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Firma</div></div>
        ${infoRow('Sektor', q.sector||'—')}
        ${infoRow('Odvětví', q.industry||'—')}
        ${infoRow('Zaměstnanci', fmtNum(q.employees))}
        ${infoRow('Web', q.website ? `<a href="${q.website}" target="_blank" style="color:var(--accent)">${q.website.replace('https://','')}</a>` : '—')}
      </div>
    </div>
  `);

  document.querySelectorAll('.ptab').forEach(b => b.addEventListener('click', async () => {
    activePeriod = b.dataset.p;
    document.querySelectorAll('.ptab').forEach(x=>x.classList.toggle('active',x.dataset.p===activePeriod));
    const newHist = await apiFetch(`/api/history?ticker=${currentData.ticker}&period=${activePeriod}`);
    drawPriceChart(newHist, up);
  }));

  drawPriceChart(hist, up);
}

function drawPriceChart(hist, up) {
  if (priceChartInst) { priceChartInst.destroy(); priceChartInst = null; }
  const ctx = document.getElementById('priceChart').getContext('2d');
  const color = up ? '#4ade80' : '#f87171';
  priceChartInst = new Chart(ctx, {
    type:'line',
    data:{
      labels: hist.map(p=>p.date),
      datasets:[{ data:hist.map(p=>p.price), borderColor:color, backgroundColor:color+'15', borderWidth:2, fill:true, tension:0.3, pointRadius:0, pointHoverRadius:4 }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{ intersect:false, mode:'index' },
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#1e2535', borderColor:'#2a3245', borderWidth:1, callbacks:{ label:c=>` ${currentData.quote?.currency||'USD'} ${c.parsed.y.toFixed(2)}` } } },
      scales:{
        x:{ ticks:{ color:'#5a6480', font:{size:10}, maxTicksLimit:8 }, grid:{color:'rgba(255,255,255,0.03)'}, border:{display:false} },
        y:{ ticks:{ color:'#5a6480', font:{size:10} }, grid:{color:'rgba(255,255,255,0.04)'}, border:{display:false} }
      }
    }
  });
}

// ---------- FINANCIALS SECTION ----------
function renderFinancialsSection(rows) {
  if (!rows.length) { setSectionContent('<div class="error-box">Data nejsou dostupná.</div>'); return; }
  const years = rows.map(r => r.year);
  const table = (title, key, fmt2, cls) => tableRow(title, rows, key, fmt2, cls);

  setSectionContent(`
    <div class="card">
      <div class="card-header"><div class="card-title">Výkaz zisku a ztrát (USD)</div></div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>Ukazatel</th>${years.map(y=>`<th>${y}</th>`).join('')}</tr></thead>
          <tbody>
            ${tableRow('Tržby', rows, 'revenue', fmtM, 'strong')}
            ${tableRow('Hrubý zisk', rows, 'grossProfit', fmtM)}
            ${tableRow('Provozní zisk', rows, 'operatingIncome', fmtM)}
            ${tableRow('EBITDA', rows, 'ebitda', fmtM)}
            ${tableRow('Čistý zisk', rows, 'netIncome', fmtM)}
            ${tableRow('EPS', rows, 'eps', v=>v?fmt(v,2):'—')}
            ${tableRow('EPS (zředěné)', rows, 'epsDiluted', v=>v?fmt(v,2):'—')}
            ${tableRow('Hrubá marže', rows, 'grossMargin', v=>v?pct(v):'—')}
            ${tableRow('Čistá marže', rows, 'netMargin', v=>v?pct(v):'—')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

// ---------- BALANCE SECTION ----------
function renderBalanceSection(rows) {
  if (!rows.length) { setSectionContent('<div class="error-box">Data nejsou dostupná.</div>'); return; }
  const years = rows.map(r => r.year);
  setSectionContent(`
    <div class="card">
      <div class="card-header"><div class="card-title">Balance Sheet — Aktiva (USD)</div></div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>Ukazatel</th>${years.map(y=>`<th>${y}</th>`).join('')}</tr></thead>
          <tbody>
            ${tableRow('Celková aktiva', rows, 'totalAssets', fmtM, 'strong')}
            ${tableRow('Oběžná aktiva', rows, 'totalCurrentAssets', fmtM)}
            ${tableRow('Hotovost', rows, 'cash', fmtM)}
            ${tableRow('Zásoby', rows, 'inventory', fmtM)}
            ${tableRow('Goodwill', rows, 'goodwill', fmtM)}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Balance Sheet — Závazky & Vlastní kapitál (USD)</div></div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>Ukazatel</th>${years.map(y=>`<th>${y}</th>`).join('')}</tr></thead>
          <tbody>
            ${tableRow('Celkové závazky', rows, 'totalLiabilities', fmtM, 'strong')}
            ${tableRow('Krátkodobé závazky', rows, 'totalCurrentLiab', fmtM)}
            ${tableRow('Dlouhodobý dluh', rows, 'longTermDebt', fmtM)}
            ${tableRow('Vlastní kapitál', rows, 'totalEquity', fmtM, 'strong')}
            ${tableRow('Nerozdělený zisk', rows, 'retainedEarnings', fmtM)}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

// ---------- METRICS SECTION ----------
function renderMetricsSection(data) {
  const rows = data.metrics || [];
  if (!rows.length) { setSectionContent('<div class="error-box">Data nejsou dostupná.</div>'); return; }
  const years = rows.map(r => r.year);
  setSectionContent(`
    <div class="card">
      <div class="card-header"><div class="card-title">Valuace & Rentabilita</div></div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>Ukazatel</th>${years.map(y=>`<th>${y}</th>`).join('')}</tr></thead>
          <tbody>
            ${tableRow('P/E ratio', rows, 'pe', v=>v?fmt(v,1):'—')}
            ${tableRow('P/B ratio', rows, 'pb', v=>v?fmt(v,2):'—')}
            ${tableRow('P/S ratio', rows, 'ps', v=>v?fmt(v,2):'—')}
            ${tableRow('EV/EBITDA', rows, 'evEbitda', v=>v?fmt(v,1):'—')}
            ${tableRow('ROE', rows, 'roe', v=>v?pct(v):'—')}
            ${tableRow('ROA', rows, 'roa', v=>v?pct(v):'—')}
            ${tableRow('ROIC', rows, 'roic', v=>v?pct(v):'—')}
            ${tableRow('Debt/Equity', rows, 'debtToEquity', v=>v?fmt(v,2):'—')}
            ${tableRow('Current Ratio', rows, 'currentRatio', v=>v?fmt(v,2):'—')}
            ${tableRow('Div. výnos', rows, 'dividendYield', v=>v?pct(v):'—')}
            ${tableRow('FCF / akcii', rows, 'freeCashFlow', v=>v?fmt(v,2):'—')}
            ${tableRow('Book Value / akcii', rows, 'bookValue', v=>v?fmt(v,2):'—')}
            ${tableRow('Počet akcií (mil.)', rows, 'sharesOutstanding', v=>v?fmt(v/1e6,1):'—')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

// ---------- OWNERS SECTION ----------
function renderOwnersSection(owners) {
  if (!owners.length) { setSectionContent('<div class="error-box">Data o vlastnících nejsou dostupná.</div>'); return; }
  setSectionContent(`
    <div class="card">
      <div class="card-header"><div class="card-title">Institucionální vlastníci</div></div>
      <div class="data-table-wrap">
        <table class="owners-table">
          <thead>
            <tr>
              <th>Vlastník</th>
              <th>Akcií</th>
              <th>Změna</th>
              <th>Změna %</th>
              <th>Datum</th>
            </tr>
          </thead>
          <tbody>
            ${owners.map(o => {
              const up = o.change >= 0;
              return `<tr>
                <td>${o.holder}</td>
                <td>${fmtNum(o.shares)}</td>
                <td class="${up?'change-up':'change-dn'}">${up?'+':''}${fmtNum(o.change)}</td>
                <td class="${up?'change-up':'change-dn'}">${up?'+':''}${fmt(o.changePct,1)}%</td>
                <td style="color:var(--text3)">${o.dateReported||'—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

// ---------- HELPERS ----------
function tableRow(label, rows, key, fmtFn, extraClass='') {
  return `<tr>
    <td>${label}</td>
    ${rows.map(r => {
      const v = r[key];
      const formatted = fmtFn ? fmtFn(v) : (v ?? '—');
      const neg = typeof v === 'number' && v < 0;
      return `<td class="${neg?'neg':''} ${extraClass}">${formatted}</td>`;
    }).join('')}
  </tr>`;
}

function infoRow(label, val) {
  return `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px">
    <span style="color:var(--text2)">${label}</span><span style="font-weight:600">${val}</span>
  </div>`;
}

function setSectionContent(html) {
  document.getElementById('sectionContent').innerHTML = html;
}

function showLoading() {
  document.getElementById('mainContent').innerHTML = `<div class="loading"><div class="spinner"></div><div>Načítám data…</div></div>`;
}
function showSectionLoading() {
  document.getElementById('sectionContent').innerHTML = `<div class="loading"><div class="spinner"></div><div>Načítám…</div></div>`;
}
function showError(msg) {
  document.getElementById('mainContent').innerHTML = `<div class="content"><div class="error-box">${msg}</div></div>`;
}

// Formátování
const fmt    = (v,d=0) => v != null ? Number(v).toFixed(d) : '—';
const pct    = v => (v*100).toFixed(1)+'%';
const fmtNum = v => v != null ? Number(v).toLocaleString('cs-CZ') : '—';
const fmtPrice = (v, curr='USD') => v != null ? `${curr} ${fmt(v,2)}` : '—';

function fmtM(v) {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e12) return sign + (abs/1e12).toFixed(2) + 'T';
  if (abs >= 1e9)  return sign + (abs/1e9).toFixed(1) + 'B';
  if (abs >= 1e6)  return sign + (abs/1e6).toFixed(1) + 'M';
  return sign + abs.toFixed(0);
}

function fmtBig(v) {
  if (!v) return '—';
  if (v >= 1e12) return '$'+(v/1e12).toFixed(2)+'T';
  if (v >= 1e9)  return '$'+(v/1e9).toFixed(1)+'B';
  if (v >= 1e6)  return '$'+(v/1e6).toFixed(1)+'M';
  return '$'+v;
}
