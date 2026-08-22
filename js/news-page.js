/**
 * @file news-page.js  资讯库页面
 * @description
 *   简报式时间线：按月分组倒序展示资讯，支持分类、属地筛选与关键词搜索。
 *   数据源 window.NEWS_DATA.items，字段约定：
 *   { id, date: "YYYY-MM-DD", category, region, title, summary, source, url? }
 *   url 可选，存在时「来源」渲染为外部链接。
 *   依赖：utils.js（esc）、state.js（__constants）。
 */

(function () {
  "use strict";

  const esc = window.RenderUtils.esc;
  const NEWS_DATA = window.__constants.NEWS_DATA || { items: [] };

  // 分类 → 徽章配色类名（未命中的分类使用 misc 灰色）
  const CATEGORY_CLASS = {
    "政策发布": "policy",
    "重大项目": "project",
    "企业动态": "corp",
    "平台算力": "infra",
    "活动会议": "event",
    "国家层面": "national",
  };

  const state = { category: "", region: "", q: "" };

  const timelineEl = document.getElementById("newsTimeline");
  const filtersEl = document.getElementById("newsFilters");
  if (!timelineEl) return;

  /**
   * 按当前筛选状态过滤条目。
   * @returns {Array} 过滤后的条目数组
   */
  const getFiltered = () => {
    const items = Array.isArray(NEWS_DATA.items) ? NEWS_DATA.items : [];
    return items.filter(n => {
      if (state.category && n.category !== state.category) return false;
      if (state.region && n.region !== state.region) return false;
      if (state.q) {
        const text = [n.title, n.summary, n.source, n.category, n.region]
          .map(v => String(v || "")).join(" ").toLowerCase();
        if (text.indexOf(state.q) === -1) return false;
      }
      return true;
    });
  };

  /**
   * 渲染筛选条（分类、属地选项从数据自动去重生成）。
   * @returns {void}
   */
  const renderFilters = () => {
    if (!filtersEl) return;
    const items = Array.isArray(NEWS_DATA.items) ? NEWS_DATA.items : [];
    const uniq = key => [...new Set(items.map(n => n[key]).filter(Boolean))];
    filtersEl.innerHTML = `
      <select id="newsCategoryFilter" aria-label="筛选分类">
        <option value="">全部分类</option>
        ${uniq("category").map(c => `<option value="${esc(c)}"${state.category === c ? " selected" : ""}>${esc(c)}</option>`).join("")}
      </select>
      <select id="newsRegionFilter" aria-label="筛选属地">
        <option value="">全部属地</option>
        ${uniq("region").map(r => `<option value="${esc(r)}"${state.region === r ? " selected" : ""}>${esc(r)}</option>`).join("")}
      </select>
      <input id="newsSearch" placeholder="搜索资讯标题、摘要、来源" aria-label="搜索资讯" value="${esc(state.q)}">`;
    filtersEl.querySelector("#newsCategoryFilter").addEventListener("change", e => {
      state.category = e.target.value;
      renderTimeline();
    });
    filtersEl.querySelector("#newsRegionFilter").addEventListener("change", e => {
      state.region = e.target.value;
      renderTimeline();
    });
    filtersEl.querySelector("#newsSearch").addEventListener("input", e => {
      state.q = e.target.value.trim().toLowerCase();
      renderTimeline();
    });
  };

  /**
   * 渲染单条资讯卡片。
   * @param {Object} n 资讯条目
   * @returns {string} HTML 片段
   */
  const renderItem = n => {
    const catCls = CATEGORY_CLASS[n.category] || "misc";
    const date = String(n.date || "");
    const mmdd = date.length >= 10 ? date.slice(5, 10).replace("-", "/") : date;
    const sourceHtml = n.url
      ? `<a class="news-item-source news-item-source-link" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">来源：${esc(n.source || "原文链接")}<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
      : `<span class="news-item-source">来源：${esc(n.source || "—")}</span>`;
    return `
      <article class="news-item">
        <div class="news-item-date">${esc(mmdd)}</div>
        <div class="news-item-main">
          <div class="news-item-badges">
            ${n.category ? `<span class="news-badge cat-${catCls}">${esc(n.category)}</span>` : ""}
            ${n.region ? `<span class="news-badge news-badge-region">${esc(n.region)}</span>` : ""}
          </div>
          <h3 class="news-item-title">${esc(n.title || "")}</h3>
          ${n.summary ? `<p class="news-item-summary">${esc(n.summary)}</p>` : ""}
          ${sourceHtml}
        </div>
      </article>`;
  };

  /**
   * 渲染时间线主体：按月分组倒序＋顶部统计。
   * @returns {void}
   */
  const renderTimeline = () => {
    const filtered = getFiltered();
    if (!filtered.length) {
      timelineEl.innerHTML = `<div class="news-empty">暂无匹配的资讯</div>`;
      return;
    }
    // 按日期倒序后按月分组
    const sorted = [...filtered].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const months = [];
    const byMonth = {};
    sorted.forEach(n => {
      const key = String(n.date || "").slice(0, 7) || "未知";
      if (!byMonth[key]) { byMonth[key] = []; months.push(key); }
      byMonth[key].push(n);
    });
    const monthLabel = key => {
      if (/^\d{4}-\d{2}$/.test(key)) return `${key.slice(0, 4)}年${parseInt(key.slice(5, 7), 10)}月`;
      return key;
    };
    timelineEl.innerHTML = `
      <div class="news-stats">当前筛选共 <strong>${filtered.length}</strong> 条资讯</div>
      ${months.map(m => `
        <section class="news-month" aria-label="${esc(monthLabel(m))}">
          <div class="news-month-head">
            <h2>${esc(monthLabel(m))}</h2>
            <span class="news-month-count">共 ${byMonth[m].length} 条</span>
          </div>
          ${byMonth[m].map(renderItem).join("")}
        </section>`).join("")}`;
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderFilters();
    renderTimeline();
  });
})();
