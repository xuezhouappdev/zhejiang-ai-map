/**
 * @file home.js  首页（index.html / 总览）渲染
 * @description
 *   负责首页各静态板块的渲染：组织流程、五维目标、矩阵、左右侧栏、机制专题。
 *   依赖：state.js（state / constants）、utils.js（esc / valueAsText / splitField）。
 *   不依赖 drawer / ticker / list-page。
 */

(function () {
  "use strict";

  const state = window.__state;
  const { RAIL_DATA, MECH_DATA } = window.__constants;
  const { esc, valueAsText, splitField } = window.RenderUtils;
  const OBJECTS_DATA = window.OBJECTS_DATA || { overall: {}, dimensions: {} };

  /**
   * 当前激活的维度（"all" 或具体维度名）。state.currentDimension 的本地镜像，
   * 抽屉/筛选切换时直接改 state.currentDimension，本函数读最新值。
   * @returns {string}
   */
  const currentDimension = () => state.currentDimension;

  /**
   * 任务数据。state.tasks 在 loadData() 完成时被注入。
   * @type {Array<Object>}
   */
  const TASKS = state.tasks || [];

  /**
   * 维度列表。loadData() 会按 window.TASKS_DATA.dimensions 覆盖。
   * @type {string[]}
   */
  const DIMS = state.dimensions && state.dimensions.length
    ? state.dimensions
    : ["算力", "数据", "模型", "应用", "生态"];

  /**
   * 生成"目标体系"单元格 HTML。
   * @param {string} dimension
   * @returns {string}
   */
  const objectiveMarkup = dimension => {
    const target = OBJECTS_DATA.dimensions?.[dimension];
    if (!target) {
      return `<p>${esc(splitField(OBJECTS_DATA.dimensions?.[dimension]?.["目标体系"]).join("；"))}</p>`;
    }
    return ["2026年", "2030年"]
      .map(year => `<p><strong>${year}</strong>${esc(target[year] || "")}</p>`)
      .join("");
  };

  /**
   * 维度 → 该维度政策名称列表（按 window.POLICIES_DATA 一次性预计算）。
   * @type {Record<string, string[]>}
   */
  const policiesByDim = (() => {
    const all = window.POLICIES_DATA?.policies || [];
    const out = {};
    DIMS.forEach(dim => {
      out[dim] = all.filter(policy => policy.category === dim).map(policy => policy.name);
    });
    return out;
  })();

  /**
   * 生成"政策体系"单元格 HTML。
   * @param {string} dimension
   * @returns {string}
   */
  const policySummaryMarkup = dimension => {
    const list = policiesByDim[dimension] || [];
    const shown = list.slice(0, 1);
    const remain = list.length - shown.length;
    if (!list.length) return '<span class="overview-empty">暂无政策数据</span>';
    const count = remain > 0
      ? `<span class="overview-policy-count">等<span class="pc-num">${remain}</span>项</span>`
      : "";
    return `<span class="overview-policy-text">${esc(shown.join(""))}${count}</span>`;
  };

  /**
   * 渲染矩阵（维度 × 体系）。仅在 #matrix 存在时生效。
   * @returns {void}
   */
  function buildMatrix() {
    const el = document.getElementById("matrix");
    if (!el) return;

    const cols = DIMS.map(d => `<div class="cell head">${d}</div>`).join("");
    const rows = [
      ["目标体系", "目标体系"],
      ["政策体系", "政策体系"],
    ];

    const { PAGE_ROUTES } = window.__constants;

    const rowHTML = rows.map(([label, key]) => {
      const route = PAGE_ROUTES[label];
      const cells = DIMS.map(dim => {
        const val = key === "目标体系"
          ? objectiveMarkup(dim)
          : key === "政策体系"
            ? policySummaryMarkup(dim)
            : "";
        const cls = key === "目标体系"
          ? "cell objective-cell"
          : "cell policy-cell";
        return `<div class="${cls}">${val}</div>`;
      }).join("");
      const rowLabel = route
        ? `<div class="cell row page-link" data-page="${esc(route.href)}" role="link" tabindex="0">${label}</div>`
        : `<div class="cell row">${label}</div>`;
      return `${rowLabel}${cells}`;
    }).join("");

    el.innerHTML = `<div class="cell head"></div>${cols}${rowHTML}`;
  }

  /**
   * 渲染组织架构流程图。
   * @returns {void}
   */
  function buildOrgFlow() {
    const el = document.getElementById("orgFlow");
    if (!el) return;
    el.innerHTML = `
      <div class="org-command">
        <div class="org-command-item org-command-item--lead">
          <span class="org-command-marker" aria-hidden="true"></span>
          <div class="org-command-body"><span class="org-command-role">组长：</span>刘捷省长</div>
        </div>
        <div class="org-command-item">
          <span class="org-command-marker" aria-hidden="true"></span>
          <div class="org-command-body"><span class="org-command-role">副组长：</span>徐文光常务副省长<br>何中伟副省长</div>
        </div>
        <div class="org-command-item org-command-item--office">
          <span class="org-command-marker" aria-hidden="true"></span>
          <div class="org-command-body">人工智能办公室<br><span class="org-command-note">（省发展改革委牵头）</span></div>
        </div>
        <div class="org-command-item org-command-item--support">
          <span class="org-command-marker" aria-hidden="true"></span>
          <div class="org-command-body">专家智库协同支撑</div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染五维目标区域。
   * @returns {void}
   */
  function buildGoals() {
    const el = document.getElementById("goalsSection");
    if (!el) return;
    const o = OBJECTS_DATA.overall || {};
    const t2026 = o.target_2026 || { value: "—", desc: "" };
    const t2030 = o.target_2030 || { value: "—", desc: "" };
    el.innerHTML = `
      <div class="goal revenue">
        <div class="goal-item"><strong>${esc(t2026.value)}</strong><span>${esc(t2026.desc)}</span></div>
        <div class="goal-item"><strong>${esc(t2030.value)}</strong><span>${esc(t2030.desc)}</span></div>
      </div>
      <div class="goal"><strong>${esc(o.vision || "")}</strong></div>
      <div class="goal"><strong>标志性成果</strong><span>${esc((o.milestones || []).join("｜"))}</span></div>
    `;
  }

  /**
   * 渲染左右侧栏的标题头。侧栏 item 由 rail.js 后续填充。
   * @returns {void}
   */
  function buildRails() {
    const left = document.getElementById("railLeft");
    const right = document.getElementById("railRight");
    if (left) {
      left.innerHTML = `<div class="rail-cell head">${RAIL_DATA.leftRail.label.split("").join("<br>")}</div>`;
    }
    if (right) {
      right.innerHTML = `<div class="rail-cell head">${RAIL_DATA.rightRail.label.split("").join("<br>")}</div>`;
    }
  }

  /**
   * 渲染机制专题。
   * @returns {void}
   */
  function buildMechanism() {
    const el = document.querySelector(".mechanism");
    if (!el) return;
    const chain = [...MECH_DATA.chain].reverse();
    const chainMarkup = chain.map((c, i) => `
      <div class="mechanism-flow-item">
        <span class="mechanism-flow-index">0${i + 1}</span>
        <span>${esc(c)}</span>
      </div>
    `).join("");
    const topics = MECH_DATA.topics.map(t => `
      <div class="mechanism-topic-item">
        <span class="mechanism-topic-mark" aria-hidden="true"></span>
        <span>${esc(t)}</span>
      </div>
    `).join("");
    const paradigmMatch = /^(\d+)(工作范式)（(.+)）$/.exec(MECH_DATA.paradigm || "");
    const paradigmMarkup = paradigmMatch
      ? `<span class="mechanism-level-code">${esc(paradigmMatch[1])}</span><span class="mechanism-level-name">${esc(paradigmMatch[2])}</span><span class="mechanism-level-note">（${esc(paradigmMatch[3])}）</span>`
      : `<span class="mechanism-level-name">${esc(MECH_DATA.paradigm || "")}</span>`;
    el.innerHTML = `
      <section class="mechanism-block mechanism-block--flow" aria-label="机制流程">
        <div class="mechanism-block-head"><span class="mechanism-block-index">01</span><span>机制流程</span></div>
        <div class="mechanism-flow">${chainMarkup}</div>
      </section>
      <div class="mechanism-plus" aria-hidden="true">＋</div>
      <section class="mechanism-block mechanism-block--topics" aria-label="专题方向">
        <div class="mechanism-block-head"><span class="mechanism-block-index">02</span><span>专题方向</span></div>
        <div class="mechanism-topic-list">${topics}</div>
      </section>
      <div class="mechanism-level">${paradigmMarkup}</div>
    `;
  }

  /**
   * 加载 tasks 数据（同步版 + http fetch）。完成后写入 state。
   * @returns {Promise<void>}
   */
  async function loadData() {
    if (location.protocol === "file:" && window.TASKS_DATA) {
      state.tasks = window.TASKS_DATA.tasks || [];
      state.dimensions = window.TASKS_DATA.dimensions || [];
      console.log("[home] 本地兼容数据加载成功，共", state.tasks.length, "条任务");
      return;
    }
    if (location.protocol === "file:") {
      console.warn("[home] file:// 环境无可用任务数据，跳过 fetch");
      return;
    }
    try {
      const base = location.pathname.includes("/pages/")
        ? "../data/tasks.json"
        : "data/tasks.json";
      const res = await fetch(base);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      state.tasks = data.tasks || [];
      state.dimensions = data.dimensions || ["算力", "数据", "模型", "应用", "生态"];
    } catch (e) {
      console.warn("[home] 加载 tasks.json 失败:", e.message);
      if (window.TASKS_DATA) {
        state.tasks = window.TASKS_DATA.tasks || [];
        state.dimensions = window.TASKS_DATA.dimensions || [];
      }
    }
    if (Array.isArray(state.tasks)) {
      state.tasks.forEach(t => {
        if (typeof t.group === "string") {
          t.group = t.group.replace(/[。.．,，]+$/, "").trim();
        }
      });
    }
  }

  window.Home = {
    buildMatrix,
    buildOrgFlow,
    buildGoals,
    buildRails,
    buildMechanism,
    loadData,
    /** 供 drawer 模块读取当前维度/任务列表 */
    scopedTasks() {
      const dim = currentDimension();
      const list = state.tasks || [];
      if (!dim || dim === "all") return list;
      return list.filter(t => t.dimension === dim);
    },
    get DIMS() { return DIMS; },
  };
})();
