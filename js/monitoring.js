/**
 * 统计监测驾驶舱。
 * 数据来源：data/monitoring.js，由统计监测目录中的月报表标准化生成。
 */
(function () {
  "use strict";

  const data = window.MONITORING_DATA;
  if (!data?.months?.length) return;

  const refs = {
    monthSelect: document.getElementById("monthSelect"),
    kpiGrid: document.getElementById("kpiGrid"),
    trendTabs: document.getElementById("trendTabs"),
    trendChart: document.getElementById("trendChart"),
    rankingMetric: document.getElementById("rankingMetric"),
    rankingChart: document.getElementById("rankingChart"),
    rankingSubtitle: document.getElementById("rankingSubtitle"),
    sectorChart: document.getElementById("sectorChart"),
    heatmapTable: document.getElementById("heatmapTable"),
    detailTable: document.getElementById("detailTable"),
    currentSource: document.getElementById("currentSource"),
    sourceFiles: document.getElementById("sourceFiles"),
    coverageText: document.getElementById("coverageText"),
    latestPeriodShort: document.getElementById("latestPeriodShort"),
  };

  const state = {
    month: data.coverage?.latest || data.months.at(-1).month,
    trendMetric: "revenue",
    rankingMetric: "revenue",
  };

  const sectorColors = {
    "算力服务": "#2563eb",
    "数据服务": "#0891b2",
    "算法模型": "#6366f1",
    "智能终端": "#f59e0b",
  };

  const metricDefs = {
    revenue: { label: "营业收入", unit: "亿元", growth: "revenueGrowth", convert: value => Number(value) / 100000 },
    cost: { label: "营业成本", unit: "亿元", growth: "costGrowth", convert: value => Number(value) / 100000 },
    rd: { label: "研发费用", unit: "亿元", growth: "rdGrowth", convert: value => Number(value) / 100000 },
    profit: { label: "利润总额", unit: "亿元", growth: "profitGrowth", convert: value => Number(value) / 100000 },
    employment: { label: "平均用工", unit: "万人", growth: "employmentGrowth", convert: value => Number(value) / 10000 },
    enterprises: { label: "企业数", unit: "家", growth: null, convert: value => Number(value) },
  };

  const esc = value => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const monthLabel = value => {
    const [year, month] = String(value).split("-");
    return `${year}年${month}月`;
  };

  const shortMonthLabel = value => `${Number(String(value).split("-")[1])}月`;

  const formatNumber = (value, decimals = 1) => Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formatCompact = (value, decimals = 1) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    if (Math.abs(number) >= 1000) return number.toLocaleString("zh-CN", { maximumFractionDigits: decimals });
    return formatNumber(number, decimals);
  };

  const growthInfo = value => {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return {
        className: numeric > 0 ? "up" : numeric < 0 ? "down" : "neutral",
        text: `${numeric > 0 ? "+" : ""}${formatNumber(numeric, 1)}%`,
      };
    }
    return { className: "neutral", text: String(value || "—") };
  };

  const currentPeriod = () => data.months.find(item => item.month === state.month) || data.months.at(-1);

  const renderKpis = () => {
    const period = currentPeriod();
    const p = period.province;
    const cards = [
      { key: "enterprises", label: "纳统企业", icon: "fa-building", accent: "#1e40af", decimals: 0, note: "本期企业规模" },
      { key: "revenue", label: "累计营业收入", icon: "fa-chart-column", accent: "#2563eb", decimals: 1, note: "较上年同期" },
      { key: "cost", label: "累计营业成本", icon: "fa-receipt", accent: "#3b82f6", decimals: 1, note: "较上年同期" },
      { key: "rd", label: "累计研发费用", icon: "fa-flask", accent: "#0891b2", decimals: 1, note: "较上年同期" },
      { key: "profit", label: "累计利润总额", icon: "fa-coins", accent: "#6366f1", decimals: 1, note: "较上年同期" },
      { key: "employment", label: "平均用工人数", icon: "fa-users", accent: "#f59e0b", decimals: 2, note: "较上年同期" },
    ];

    refs.kpiGrid.innerHTML = cards.map(card => {
      const def = metricDefs[card.key];
      const value = def.convert(p[card.key]);
      const growth = def.growth ? growthInfo(p[def.growth]) : null;
      return `<article class="kpi-card" style="--kpi-accent:${card.accent}">
        <div class="kpi-card-head"><span>${card.label}</span><i class="fa-solid ${card.icon}" aria-hidden="true"></i></div>
        <div class="kpi-value"><strong>${formatCompact(value, card.decimals)}</strong><span>${def.unit}</span></div>
        <div class="kpi-foot"><span>${card.note}</span>${growth ? `<span class="growth-chip ${growth.className}">${growth.text}</span>` : `<span class="growth-chip neutral">${monthLabel(period.month)}</span>`}</div>
      </article>`;
    }).join("");
  };

  const trendRows = () => {
    const reported = new Map(data.months.filter(item => item.month.startsWith("2026-")).map(item => [item.month, item]));
    return ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]
      .map(month => reported.get(month) || { month, missing: true });
  };

  const renderTrend = () => {
    const def = metricDefs[state.trendMetric];
    const rows = trendRows();
    const values = rows.map(row => row.missing ? 0 : def.convert(row.province[state.trendMetric]));
    const max = Math.max(...values, 1) * 1.16;
    const width = 960;
    const height = 330;
    const margin = { top: 44, right: 22, bottom: 50, left: 68 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const step = plotW / rows.length;
    const barWidth = Math.min(78, step * .54);
    const ticks = 4;

    const grid = Array.from({ length: ticks + 1 }, (_, index) => {
      const value = max * (ticks - index) / ticks;
      const y = margin.top + plotH * index / ticks;
      return `<line class="chart-grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line>
        <text class="chart-axis-label" x="${margin.left - 10}" y="${y + 4}" text-anchor="end">${formatCompact(value, state.trendMetric === "employment" ? 0 : 1)}</text>`;
    }).join("");

    const bars = rows.map((row, index) => {
      const x = margin.left + step * index + (step - barWidth) / 2;
      const labelX = x + barWidth / 2;
      const month = shortMonthLabel(row.month);
      if (row.missing) {
        const missingHeight = plotH * .34;
        const y = margin.top + plotH - missingHeight;
        return `<rect class="chart-bar missing" x="${x}" y="${y}" width="${barWidth}" height="${missingHeight}"></rect>
          <text class="chart-missing-label" x="${labelX}" y="${y - 8}" text-anchor="middle">缺报</text>
          <text class="chart-axis-label" x="${labelX}" y="${height - 19}" text-anchor="middle">${month}</text>`;
      }
      const value = def.convert(row.province[state.trendMetric]);
      const barHeight = value / max * plotH;
      const y = margin.top + plotH - barHeight;
      const growth = growthInfo(row.province[def.growth]);
      return `<rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"></rect>
        <text class="chart-growth-label" x="${labelX}" y="${Math.max(14, y - 21)}" text-anchor="middle">同比${esc(growth.text)}</text>
        <text class="chart-value-label" x="${labelX}" y="${Math.max(28, y - 7)}" text-anchor="middle">${formatCompact(value, state.trendMetric === "employment" ? 2 : 1)}</text>
        <text class="chart-axis-label" x="${labelX}" y="${height - 19}" text-anchor="middle">${month}</text>`;
    }).join("");

    refs.trendChart.innerHTML = `<svg class="trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${def.label}累计走势，单位${def.unit}">
      ${grid}
      <line class="chart-axis-line" x1="${margin.left}" y1="${margin.top + plotH}" x2="${width - margin.right}" y2="${margin.top + plotH}"></line>
      <text class="chart-axis-label" x="${margin.left}" y="20">单位：${def.unit}</text>
      ${bars}
    </svg>`;
  };

  const rankingValue = (row, metric) => metricDefs[metric].convert(row[metric]);

  const renderRanking = () => {
    const period = currentPeriod();
    const metric = state.rankingMetric;
    const def = metricDefs[metric];
    const rows = [...period.cities].sort((a, b) => rankingValue(b, metric) - rankingValue(a, metric));
    const max = Math.max(...rows.map(row => rankingValue(row, metric)), 1);
    refs.rankingSubtitle.textContent = `${def.label}，单位：${def.unit}`;
    refs.rankingChart.innerHTML = rows.map(row => {
      const value = rankingValue(row, metric);
      const growth = def.growth ? growthInfo(row[def.growth]) : { className: "neutral", text: "—" };
      const decimals = metric === "employment" ? 2 : metric === "enterprises" ? 0 : 1;
      return `<div class="rank-row">
        <span class="rank-name">${esc(row.name.replace("市", ""))}</span>
        <span class="rank-bar-track"><span class="rank-bar" style="width:${Math.max(1, value / max * 100).toFixed(2)}%"></span></span>
        <span class="rank-value">${formatCompact(value, decimals)}</span>
        <span class="rank-growth"><span class="growth-chip ${growth.className}">${growth.text}</span></span>
      </div>`;
    }).join("");
  };

  const renderSector = () => {
    const period = currentPeriod();
    const total = period.province.revenue;
    const sectors = [...period.sectors].sort((a, b) => b.revenue - a.revenue);
    refs.sectorChart.innerHTML = `<div class="sector-stack" role="img" aria-label="四领域营业收入占比">
      ${sectors.map(row => `<span title="${esc(row.name)} ${(row.revenue / total * 100).toFixed(1)}%" style="width:${(row.revenue / total * 100).toFixed(4)}%;background:${sectorColors[row.name]}"></span>`).join("")}
    </div>
    <div class="sector-list">${sectors.map(row => {
      const growth = growthInfo(row.revenueGrowth);
      return `<div class="sector-row">
        <span class="sector-swatch" style="background:${sectorColors[row.name]}"></span>
        <span class="sector-name">${esc(row.name)}</span>
        <span class="sector-value">${formatCompact(row.revenue / 100000, 1)}亿元　同比<span class="growth-chip ${growth.className}">${growth.text}</span></span>
        <span class="sector-share">${formatNumber(row.revenue / total * 100, 1)}%</span>
      </div>`;
    }).join("")}</div>`;
  };

  const heatClass = value => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "neutral";
    if (numeric >= 50) return "positive-strong";
    if (numeric > 10) return "positive";
    if (numeric >= 0) return "positive-light";
    if (numeric > -30) return "negative";
    return "negative-strong";
  };

  const heatText = value => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value || "—");
    return `${numeric > 0 ? "+" : ""}${formatNumber(numeric, 1)}%`;
  };

  const renderHeatmap = () => {
    const period = currentPeriod();
    const columns = [
      ["营业收入", "revenueGrowth"],
      ["研发费用", "rdGrowth"],
      ["利润总额", "profitGrowth"],
      ["平均用工", "employmentGrowth"],
    ];
    refs.heatmapTable.innerHTML = `<thead><tr><th>地市</th>${columns.map(([label]) => `<th>${label}同比</th>`).join("")}</tr></thead>
      <tbody>${period.cities.map(city => `<tr><td>${esc(city.name)}</td>${columns.map(([, field]) => `<td class="heat-cell ${heatClass(city[field])}">${esc(heatText(city[field]))}</td>`).join("")}</tr>`).join("")}</tbody>`;
  };

  const moneyCell = value => {
    const numeric = Number(value) / 100000;
    return `<span class="${numeric < 0 ? "number-negative" : ""}">${formatCompact(numeric, 1)}</span>`;
  };

  const growthCell = value => {
    const info = growthInfo(value);
    return `<span class="growth-chip ${info.className}">${esc(info.text)}</span>`;
  };

  const renderDetailTable = () => {
    const period = currentPeriod();
    const rows = [{ ...period.province, name: "浙江省合计", total: true }, ...period.cities];
    refs.detailTable.innerHTML = `<thead><tr>
      <th>地区</th><th>企业数</th><th>营业收入</th><th>营收同比</th><th>研发费用</th><th>研发同比</th><th>利润总额</th><th>利润同比</th><th>平均用工</th><th>用工同比</th>
    </tr></thead><tbody>${rows.map(row => `<tr class="${row.total ? "total-row" : ""}">
      <td>${esc(row.name)}</td><td>${formatCompact(row.enterprises, 0)}</td><td>${moneyCell(row.revenue)}</td><td>${growthCell(row.revenueGrowth)}</td>
      <td>${moneyCell(row.rd)}</td><td>${growthCell(row.rdGrowth)}</td><td>${moneyCell(row.profit)}</td><td>${growthCell(row.profitGrowth)}</td>
      <td>${formatCompact(row.employment / 10000, 2)}</td><td>${growthCell(row.employmentGrowth)}</td>
    </tr>`).join("")}</tbody>`;
  };

  const renderPeriodContext = () => {
    const period = currentPeriod();
    refs.currentSource.textContent = period.source;
    refs.latestPeriodShort.textContent = shortMonthLabel(data.coverage.latest);
  };

  const renderPeriodViews = () => {
    renderKpis();
    renderRanking();
    renderSector();
    renderHeatmap();
    renderDetailTable();
    renderPeriodContext();
  };

  const init = () => {
    refs.monthSelect.innerHTML = [...data.months].reverse().map(item => `<option value="${item.month}" ${item.month === state.month ? "selected" : ""}>${monthLabel(item.month)}</option>`).join("");
    refs.coverageText.textContent = `${data.coverage.periods}期数据`;
    refs.sourceFiles.innerHTML = data.months.map(item => `<span>${esc(item.source)}</span>`).join("");

    refs.monthSelect.addEventListener("change", event => {
      state.month = event.target.value;
      renderPeriodViews();
    });
    refs.rankingMetric.addEventListener("change", event => {
      state.rankingMetric = event.target.value;
      renderRanking();
    });
    refs.trendTabs.addEventListener("click", event => {
      const button = event.target.closest("button[data-metric]");
      if (!button) return;
      state.trendMetric = button.dataset.metric;
      refs.trendTabs.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
      renderTrend();
    });

    renderTrend();
    renderPeriodViews();
  };

  init();
})();
