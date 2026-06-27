// ============================================================
//  app.js  –  StockLens logika
// ============================================================

let priceChartInstance = null;
let activePeriod = '1R';

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');

  input.addEventListener('input', () => onSearch(input.value));
  input.addEventListener('keydown', onKey);

  document.querySelectorAll('.qbtn').forEach(btn => {
    btn.addEventListener('click', () => loadStock(btn.dataset.ticker));
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) closeSuggestions();
  });
});

// ---------- SEARCH ----------
function onSearch(val) {
  const box = document.getElementById('suggestions');
  const q = val.trim().toUpperCase();
  if (!q) { closeSuggestions(); return; }

  const hits = SUGGESTIONS_DB.filter(x =>
    x.t.startsWith(q) || x.n.toUpperCase().includes(q)
  ).slice(0, 6);

  if (!hits.length) { closeSuggestions(); return; }

  box.innerHTML = hits.map(x => `
    <div class="sugg-item" data-ticker="${x.t}">
      <span class="sugg-ticker">${x.t}</span>
      <span class="sugg-name">${x.n}</span>
    </div>
  `).join('');

  box.querySelectorAll('.sugg-item').forEach(el => {
    el.addEventListener('click', () => {
      loadStock(el.dataset.ticker);
      document.getElementById('searchInput').value = el.dataset.ticker;
    });
  });

  box.classList.add('open');
}

function onKey(e) {
  if (e.key === 'Enter') {
    const val = e.target.value.trim().toUpperCase();
    closeSuggestions();
    loadStock(val);
  }
}

function closeSuggestions() {
  document.getElementById('suggestions').classList.remove('open');
}

// ---------- LOAD STOCK ----------
function loadStock(ticker) {
  closeSuggestions();
  ticker = ticker.toUpperCase();
  const s = STOCKS[ticker];
  if (!s) {
    renderNotFound(ticker);
    return;
  }
  activePeriod = '1R';
  renderStock(ticker, s);
}

// ---------- RENDER NOT FOUND ----------
function renderNotFound(ticker) {
  document.getElementById('mainContent').innerHTML = `
    <div class="not-found">
      <div class="ico">🔍</div>
      <p>Ticker <strong>${ticker}</strong> nebyl nalezen v demo datech.</p>
      <p style="margin-top:6px;font-size:12px;">Zkus: AAPL · MSFT · NVDA · GOOGL · TSLA · AMZN</p>
    </div>
  `;
}

// ---------- RENDER STOCK ----------
function renderStock(ticker, s) {
  const up = s.change >= 0;
  const changeSign = up ? '+' : '';

  document.getElementById('mainContent').innerHTML = `

    <!-- HERO -->
    <div class="hero">
      <div class="ticker-badge">${ticker} · ${s.sector} · ${s.country}</div>
      <div class="company-name">${s.name}</div>
      <div class="price-row">
        <div class="price-big">$${s.price.toFixed(2)}</div>
        <div class="price-change ${up ? 'up' : 'dn'}">
          ${up ? '▲' : '▼'} ${changeSign}$${Math.abs(s.change).toFixed(2)}
          (${changeSign}${s.changePct.toFixed(2)}%) dnes
        </div>
      </div>
      <div class="tag-row">
        ${s.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
    </div>

    <!-- METRICS -->
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-label">Tržní kapitalizace</div>
        <div class="metric-val">${s.marketCap}</div>
        <div class="metric-sub">Celková hodnota firmy</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">P/E ratio</div>
        <div class="metric-val">${s.pe}</div>
        <div class="metric-sub">Cena / zisk na akcii</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">EPS (TTM)</div>
        <div class="metric-val">${s.eps}</div>
        <div class="metric-sub">Zisk na akcii</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Dividenda</div>
        <div class="metric-val">${s.divYield}</div>
        <div class="metric-sub">Roční výnos</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Roční tržby</div>
        <div class="metric-val">${s.revenue}</div>
        <div class="metric-sub">Celkové výnosy</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">ROE</div>
        <div class="metric-val">${s.roe}</div>
        <div class="metric-sub">Výnosnost vlastního kapitálu</div>
      </div>
    </div>

    <!-- PRICE CHART -->
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title">Vývoj ceny</div>
        <div class="period-tabs">
          ${['1M','3M','1R','5R'].map(p => `
            <button class="ptab ${p === activePeriod ? 'active' : ''}" data-period="${p}">${p}</button>
          `).join('')}
        </div>
      </div>
      <div class="chart-area">
        <canvas id="priceChart"></canvas>
      </div>
    </div>

    <!-- BOTTOM ROW -->
    <div class="two-col">

      <!-- Revenue bars -->
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">Roční tržby (mld. USD)</div>
        </div>
        <div class="bar-chart" id="revBars"></div>
      </div>

      <!-- Info table -->
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">Přehled</div>
        </div>
        <div class="info-row"><span class="lbl">52T maximum</span><span class="val">${s.high52}</span></div>
        <div class="info-row"><span class="lbl">52T minimum</span><span class="val">${s.low52}</span></div>
        <div class="info-row"><span class="lbl">Průměrný objem</span><span class="val">${s.avgVol}</span></div>
        <div class="info-row"><span class="lbl">Čistý zisk</span><span class="val">${s.netIncome}</span></div>
        <div class="info-row"><span class="lbl">Burza</span><span class="val">${s.exchange}</span></div>
        <div class="info-row"><span class="lbl">Sektor</span><span class="val">${s.sector}</span></div>
      </div>

    </div>
  `;

  // Period tabs
  document.querySelectorAll('.ptab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePeriod = btn.dataset.period;
      drawPriceChart(s, activePeriod, up);
    });
  });

  drawPriceChart(s, activePeriod, up);
  drawRevBars(s);
}

// ---------- PRICE CHART ----------
function drawPriceChart(s, period, up) {
  if (priceChartInstance) { priceChartInstance.destroy(); priceChartInstance = null; }

  const data = s.priceHistory[period] || s.priceHistory['1R'];
  const labels = data.map((_, i) => '');

  const ctx = document.getElementById('priceChart').getContext('2d');
  const color = up ? '#4ade80' : '#f87171';
  const bgColor = up ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)';

  priceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: color,
        backgroundColor: bgColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: color,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e2535',
          borderColor: '#2a3245',
          borderWidth: 1,
          titleColor: '#8b95ad',
          bodyColor: '#e8eaf0',
          callbacks: {
            label: ctx => ` $${ctx.parsed.y.toFixed(2)}`,
          }
        }
      },
      scales: {
        x: { display: false },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#5a6480',
            font: { size: 11 },
            callback: v => '$' + v,
          },
          border: { display: false },
        }
      }
    }
  });
}

// ---------- REVENUE BARS ----------
function drawRevBars(s) {
  const el = document.getElementById('revBars');
  if (!el) return;
  const max = Math.max(...s.revenueData);
  el.innerHTML = s.revenueData.map((v, i) => `
    <div class="bar-col">
      <div class="bar-val">$${v}B</div>
      <div class="bar" style="height:${Math.round((v / max) * 110) + 4}px" title="${s.years[i]}: $${v}B"></div>
      <div class="bar-label">${s.years[i]}</div>
    </div>
  `).join('');
}
