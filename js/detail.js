const SECTION = document.body.dataset.section;
const DATA = window.OBJECTS_DATA || { dimensions: {}, overall: {} };
const DIMS = ["算力", "数据", "模型", "应用", "生态"];
const params = new URLSearchParams(location.search);
const selected = params.get("dim") || "";
const esc = value => String(value || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const items = value => String(value || "").split("；").map(item => item.trim()).filter(Boolean);

function renderTabs() {
  const tabs = document.getElementById("dimensionTabs");
  const page = location.pathname.split("/").pop();
  tabs.innerHTML = `<a href="${page}" class="${selected ? "" : "active"}">全部维度</a>` + DIMS.map(dim => `<a href="?dim=${encodeURIComponent(dim)}" class="${selected === dim ? "active" : ""}">${dim}</a>`).join("");
}
function renderOverall() {
  const box = document.getElementById("overallCard");
  if (!box || SECTION !== "目标体系") return;
  const o = DATA.overall || {};
  box.innerHTML = `<div class="overall-item"><strong>${esc(o.target_2026?.value)}</strong><span>${esc(o.target_2026?.desc)}</span></div><div class="overall-item"><strong>${esc(o.target_2030?.value)}</strong><span>${esc(o.target_2030?.desc)}</span></div><div class="overall-item"><strong>${esc(o.vision)}</strong><span>总体愿景</span></div><div class="overall-item"><strong>${esc((o.milestones || []).length)}项</strong><span>${esc((o.milestones || []).join("｜"))}</span></div>`;
}
function renderCards() {
  const dims = selected ? DIMS.filter(dim => dim === selected) : DIMS;
  document.getElementById("detailGrid").innerHTML = dims.map(dim => {
    const source = SECTION === "责任主体" ? DATA.leadership?.[dim] : DATA.dimensions?.[dim]?.[SECTION];
    const list = items(source);
    return `<article class="detail-card" data-dim="${dim}"><h3>${dim}</h3><ul>${list.map(item => `<li>${esc(item)}</li>`).join("")}</ul></article>`;
  }).join("") || '<div class="empty">暂无相关内容</div>';
}
renderTabs(); renderOverall(); renderCards();
