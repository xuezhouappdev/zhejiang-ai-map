(function () {
  const data = window.GOALS_DATA || { overall: {}, dimensions: {} };
  const rails = window.RAIL_DATA || { leftRail: { items: [] }, rightRail: { items: [] } };
  const news = window.NEWS_DATA?.items || [];
  const dims = ["算力", "数据", "模型", "应用", "生态"];
  const section = document.body.dataset.section || "";
  const isDetailsPage = location.pathname.endsWith("/details.html") || location.pathname.endsWith("details.html");

  // 从 tasks.js 取真实任务数据，统一剥掉 group 末尾句号（中英文 / 全半角）
  const cleanGroup = g => String(g || "").replace(/[。.．,，]+$/, "").trim();
  const taskGroupsByDim = (() => {
    const out = {};
    const tasks = window.TASKS_DATA?.tasks || [];
    tasks.forEach(t => {
      const dim = t.dimension;
      const g = cleanGroup(t.group);
      if (!dim || !g) return;
      (out[dim] = out[dim] || new Set()).add(g);
    });
    const obj = {};
    Object.keys(out).forEach(d => { obj[d] = [...out[d]]; });
    return obj;
  })();
  const esc = value =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const split = value =>
    String(value || "")
      .split("；")
      .map(item => item.trim())
      .filter(Boolean);
  const rowKey = label => (label === "重点任务" ? "重点任务" : label);
  const rows = ["目标体系", "政策体系", "重点任务", "重大项目", "应用场景", "责任主体"];
  const o = data.overall || {};
  const header = document.querySelector(".page-header");
  if (!header) return;

  const guaranteeItems = ["资讯库", "政策库", "企业库", "项目库", "场景库", "专家库", "产业图谱"];

  const renderGuaranteePanel = (prefix = "guarantee") =>
    `<section class="${prefix}-panel" aria-label="保障体系">
      <div class="${prefix}-title">保障体系</div>
      <div class="${prefix}-grid">
        ${guaranteeItems.map(item => `<div>${item}</div>`).join("")}
      </div>
    </section>`;

  const rail = side => {
    const source = side === "left" ? rails.leftRail : rails.rightRail;
    return `<aside class="overview-rail ${side}"><div class="overview-rail-title">${esc(source?.label)}</div>${(source?.items || []).map(item => `<div class="overview-rail-item"><strong>${esc(item.name)}</strong>${(item.desc || []).map(desc => `<span>${esc(desc)}</span>`).join("")}</div>`).join("")}</aside>`;
  };
  const cells = rows
    .map(label => {
      const active = section === label ? " active" : "";
      const values = dims
        .map(dim => {
          // 重点任务行：直接从 tasks.js 取真实 group 列表（去重 + 已剥句号），与 tasks.html 完全同源
          if (label === "重点任务") {
            const groups = taskGroupsByDim[dim] || [];
            const content = groups.length
              ? `<ul class="overview-task-list">${groups.map(item => `<li>${esc(item)}</li>`).join("")}</ul>`
              : '<span class="overview-empty">暂无重点任务数据</span>';
            return `<div class="overview-cell">${content}</div>`;
          }
          const list = split(data.dimensions?.[dim]?.[rowKey(label)]);
          const content = esc(list.join("；"));
          return `<div class="overview-cell">${content}</div>`;
        })
        .join("");
      const rowLabel = isDetailsPage && label === "重点任务"
        ? `<a class="overview-row-label overview-page-link${active}" href="tasks.html">${esc(label)}</a>`
        : `<div class="overview-row-label${active}">${esc(label)}</div>`;
      return `${rowLabel}${values}`;
    })
    .join("");

  const overview = document.createElement("section");
  overview.className = "secondary-overview";
  overview.setAttribute("aria-label", "工作推进总览");
  overview.innerHTML = `${rail("left")}<div class="overview-center">
    <div class="overview-band">总体统筹——总体目标</div>
    <div class="overview-goals"><div><strong>${esc(o.target_2026?.value)}</strong><span>${esc(o.target_2026?.desc)}</span></div><div><strong>${esc(o.target_2030?.value)}</strong><span>${esc(o.target_2030?.desc)}</span></div><div><strong>${esc(o.vision)}</strong></div><div><strong>标志性成果</strong><span>${esc((o.milestones || []).join("｜"))}</span></div></div>
    <div class="overview-band light">五大维度——纵向链路推进</div>
    <div class="overview-matrix"><div class="overview-cell head"></div>${dims.map(dim => `<div class="overview-cell head">${dim}</div>`).join("")}${cells}</div>
    ${renderGuaranteePanel("overview-guarantee")}
  </div>${rail("right")}`;
  header.insertAdjacentElement("afterend", overview);

  const ticker = document.createElement("section");
  ticker.className = "overview-news-ticker";
  ticker.setAttribute("aria-label", "当日资讯");
  const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  const newsItems = news.map(item => `<span class="overview-news-item"><b>${esc(item.title)}</b><span>${esc(item.summary)}</span></span>`).join('<span class="overview-news-sep">｜</span>');
  ticker.innerHTML = `<div class="overview-news-label"><span>当日资讯</span><span class="overview-news-date">${esc(today)}</span></div><div class="overview-news-window"><div class="overview-news-track">${newsItems}<span class="overview-news-sep">｜</span>${newsItems}</div></div>`;
  overview.insertAdjacentElement("afterend", ticker);

  document.body.classList.add("overview-only");
  window.renderGuaranteePanel = renderGuaranteePanel;
})();
