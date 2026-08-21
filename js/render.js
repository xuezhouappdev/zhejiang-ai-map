// render.js — 总图渲染引擎（浙江省人工智能高质量发展工作图谱）
// 数据来源: 外部 JSON (tasks.json / objects / rail / mechanism / news)
// 浏览器兼容性: Chrome / Firefox / Safari / Edge 最新版（支持 ES2022）

// ── 全局数据（从 tasks.json 动态加载）──────────────────────
let TASKS = [];
let DIMS = ["算力", "数据", "模型", "应用", "生态"];

const RAIL_DATA = {"version": "2026-08-20", "leftRail": {"label": "工作体系", "items": [{"name": "例会", "desc": ["协调", "机制"], "interactive": false}, {"name": "统计", "desc": ["监测", "机制"], "interactive": false}, {"name": "专题", "desc": ["调研", "机制"], "interactive": true}, {"name": "跟踪", "desc": ["调度", "机制"], "interactive": false}, {"name": "安全", "desc": ["保障", "机制"], "interactive": false}, {"name": "评价", "desc": ["推广", "机制"], "interactive": false}]}, "rightRail": {"label": "评价体系", "items": [{"name": "目标", "desc": ["监测"], "interactive": false}, {"name": "政策", "desc": ["评估"], "interactive": false}, {"name": "任务", "desc": ["调度"], "interactive": false}, {"name": "项目", "desc": ["跟踪"], "interactive": false}, {"name": "综合", "desc": ["评价"], "interactive": false}, {"name": "通报", "desc": ["晾晒"], "interactive": false}]}};

const MECH_DATA = {"version": "2026-08-20", "chain": ["专班研究", "办公室协调", "领导小组审议"], "topics": ["算力专题", "数据专题", "模型专题", "应用专题", "生态专题"], "paradigm": "4353工作范式（分类分层分级）"};

const OBJECTS_DATA = window.OBJECTS_DATA || { overall: {}, dimensions: {} };
const objectiveMarkup = dimension => {
  const target = OBJECTS_DATA.dimensions?.[dimension];
  if (!target) return `<p>${esc(splitField(OBJECTS_DATA.dimensions?.[dimension]?.["目标体系"]).join("；"))}</p>`;
  return ["2026年", "2030年"]
    .map(year => `<p><strong>${year}</strong>${esc(target[year] || "")}</p>`)
    .join("");
};
const splitField = value => String(value || "").split("；").map(item => item.trim()).filter(Boolean);
const policiesByDim = (() => {
  const all = window.POLICIES_DATA?.policies || [];
  const out = {};
  DIMS.forEach(dim => {
    out[dim] = all.filter(policy => policy.category === dim).map(policy => policy.name);
  });
  return out;
})();
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

// ── 工具函数 ───────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
let currentDimension = "all";
let activeTask = null;
const progressStore = JSON.parse(localStorage.getItem("progressStore") || "{}");
const TASK_COLUMN_OPTIONS = [
  ["task", "任务内容"], ["dimension", "所属领域"], ["group", "重点任务"],
  ["owner", "责任单位"], ["co", "协同单位"], ["timeNode", "时间节点"], ["researchTime", "研究时间"],
  ["importance", "重要程度"], ["target", "目标"], ["id", "编号"]
];
const DEFAULT_TASK_COLUMNS = ["task", "dimension", "owner", "co", "timeNode", "importance"];
let selectedTaskColumns = DEFAULT_TASK_COLUMNS.slice();
let taskSort = { key: "", direction: 1 };
let importanceFilterValue = "";
const PAGE_ROUTES = {
  "重点任务": "pages/tasks.html",
  "重大项目": "pages/projects.html",
  "应用场景": "pages/scene.html",
};

// ── 加载外部数据 ──────────────────────────────────────
async function loadData() {
  // 浏览器直接打开本地文件时，fetch 会被 file:// 安全策略拦截。
  // tasks.js 是由 tasks.json 同步生成的本地兼容数据入口。
  // tasks.js 已同步加载，无需 fetch（列表页无 tasks.js 时直接跳过）
  if (location.protocol === "file:" && window.TASKS_DATA) {
    TASKS = window.TASKS_DATA.tasks || [];
    DIMS = window.TASKS_DATA.dimensions || DIMS;
    console.log("本地兼容数据加载成功，共", TASKS.length, "条任务");
    return;
  }
  // http/https 环境走 fetch
  if (location.protocol === "file:") {
    console.warn("file:// 环境无可用任务数据，跳过 fetch");
    return;
  }

  try {
    console.log("开始加载 tasks.json...");
    const base = location.pathname.includes("/pages/")
      ? "../data/tasks.json"
      : "data/tasks.json";
    const res = await fetch(base);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    TASKS = data.tasks || [];
    DIMS = data.dimensions || ["算力", "数据", "模型", "应用", "生态"];
    console.log("tasks.json 加载成功，共", TASKS.length, "条任务");
  } catch (e) {
    console.warn("加载 tasks.json 失败:", e.message);
    if (window.TASKS_DATA) {
      TASKS = window.TASKS_DATA.tasks || [];
      DIMS = window.TASKS_DATA.dimensions || DIMS;
      console.warn("已切换到本地兼容数据，共", TASKS.length, "条任务");
    } else {
      console.warn("未找到可用的任务数据");
    }
  }

  // 统一清洗 group 末尾句号（中英文 / 全半角逗号句号），保证三处页面口径一致
  TASKS.forEach(t => { t.group = String(t.group || "").replace(/[。.．,，]+$/, "").trim(); });
}


// ── 动态生成 Matrix HTML ────────────────────────────────

function buildMatrix() {
  const el = document.getElementById("matrix");
  if (!el) return;

  const cols = DIMS.map(d => `<div class="cell head">${d}</div>`).join("");
  const rows = [
    ["目标体系", "目标体系"],
    ["政策体系", "政策体系"],
  ];

  const rowHTML = rows.map(([label, key]) => {
    const route = PAGE_ROUTES[label];
    const cells = DIMS.map((dim, i) => {
      const val = key === "目标体系"
        ? objectiveMarkup(dim)
        : key === "政策体系"
          ? policySummaryMarkup(dim)
        : OBJECTS_DATA.dimensions[dim] && OBJECTS_DATA.dimensions[dim][key] || "";
      const cls = key === "目标体系" ? "cell objective-cell" : key === "政策体系" ? "cell policy-cell" : key === "action" ? "cell task-preview" : "cell";
      // 重点任务特殊处理
      if (key === "action") {
        const tasks = TASKS.filter(t => t.dimension === dim).slice(0, 5);
        let links;
        if (tasks.length > 0) {
          links = tasks.map((t, idx) =>
            `<li><span class="task-no">${idx+1}．</span><span class="task-text">${esc(t.group.replace(/"/g, "").slice(0,12))}</span></li>`
          ).join("");
        } else {
          // TASKS 未加载时显示占位提示
          links = `<li class="task-placeholder">暂无任务数据</li>`;
        }
        return `<div class="${cls}"><ul>${links}</ul></div>`;
      }
      return `<div class="${cls}">${key === "目标体系" || key === "政策体系" ? val : esc(val)}</div>`;
    }).join("");
    const rowLabel = route ? `<div class="cell row page-link" data-page="${route}" role="link" tabindex="0">${label}</div>` : `<div class="cell row">${label}</div>`;
    return `${rowLabel}${cells}`;
  }).join("");

  el.innerHTML = `<div class="cell head"></div>${cols}${rowHTML}`;
}

// ── 动态生成组织架构 ─────────────────────────────────────
function buildOrgFlow() {
  const el = document.getElementById("orgFlow");
  if (!el) return;
  el.innerHTML = `
    <div class="flow-line">组长：刘捷省长</div>
    <div class="arrow">↓</div>
    <div class="flow-line">副组长：徐文光常务副省长<br>何中伟副省长</div>
    <div class="arrow">↓</div>
    <div class="flow-line">人工智能办公室<br>（省发展改革委牵头）</div>
    <div class="flow-line">专家智库协同支撑</div>
  `;
}

// ── 动态生成目标区域 ─────────────────────────────────────
function buildGoals() {
  const el = document.getElementById("goalsSection");
  if (!el) return;
  const o = OBJECTS_DATA.overall;
  el.innerHTML = `
    <div class="goal revenue">
      <div class="goal-item"><strong>${o.target_2026.value}</strong><span>${o.target_2026.desc}</span></div>
      <div class="goal-item"><strong>${o.target_2030.value}</strong><span>${o.target_2030.desc}</span></div>
    </div>
    <div class="goal"><strong>${o.vision}</strong></div>
    <div class="goal"><strong>标志性成果</strong><span>${o.milestones.join("｜")}</span></div>
  `;
}

// ── 动态生成 Rail HTML ──────────────────────────────────
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

// ── 动态生成 Mechanism HTML ────────────────────────────
function buildMechanism() {
  const el = document.querySelector(".mechanism");
  if (!el) return;
  const chain = MECH_DATA.chain.map((c, i) =>
    i > 0 ? `<div class="mechanism-up">↑</div><div>${esc(c)}</div>` : `<div>${esc(c)}</div>`
  ).join("");
  const topics = MECH_DATA.topics.map(t => `<div>${esc(t)}</div>`).join("");
  el.innerHTML = `
    <div class="mechanism-chain">${chain}</div>
    <div class="mechanism-next" aria-hidden="true">⇨</div>
    <div class="mechanism-topics">${topics}</div>
    <div class="mechanism-level">${esc(MECH_DATA.paradigm)}</div>
  `;
}

// ── 渲染任务抽屉 ────────────────────────────────────────
function scopedTasks() {
  const dim = currentDimension;
  if (!dim || dim === "all") return TASKS;
  return TASKS.filter(t => t.dimension === dim);
}

function taskColumnValue(task, key) {
  if (key === "task") return `${task.id}．${task.task}`;
  if (key === "timeNode") return task.timeNode || task.time || "";
  return task[key] ?? "";
}

function renderImportanceTags(value) {
  if (!value) return '<span class="tag tag-mute">未标记</span>';
  return String(value).split("；").map(label => {
    const tone = label.includes("省领导") ? "tag-red" : label.includes("孟主任") ? "tag-orange" : "tag-blue";
    return `<span class="tag ${tone}">${esc(label)}</span>`;
  }).join("");
}

function taskGridTemplate() {
  return selectedTaskColumns.map(key => {
    if (key === "task") return "minmax(360px,2.4fr)";
    if (key === "dimension") return "minmax(70px,.45fr)";
    if (key === "co" || key === "group") return "minmax(170px,1.1fr)";
    if (["researchTime", "importance", "timeNode", "id"].includes(key)) return "minmax(100px,.72fr)";
    return "minmax(120px,.85fr)";
  }).join(" ");
}

function applyTaskColumns() {
  const list = document.querySelector(".task-list");
  const head = document.getElementById("taskListHead");
  if (!list || !head) return;
  list.style.setProperty("--task-grid-columns", taskGridTemplate());
  head.innerHTML = selectedTaskColumns.map(key => {
    const label = TASK_COLUMN_OPTIONS.find(item => item[0] === key)?.[1] || key;
    if (!["owner", "timeNode"].includes(key)) return `<div>${label}</div>`;
    const indicator = taskSort.key === key ? (taskSort.direction === 1 ? "▲" : "▼") : "↕";
    return `<div data-sort-key="${key}">${label}<span class="sort-indicator">${indicator}</span></div>`;
  }).join("");
}

function buildTaskColumnPicker() {
  const menu = document.getElementById("columnMenu");
  if (!menu || menu.dataset.ready) return;
  const saved = JSON.parse(localStorage.getItem("taskColumns") || "null");
  if (Array.isArray(saved) && saved.length && saved.includes("task")) selectedTaskColumns = saved.filter(key => TASK_COLUMN_OPTIONS.some(item => item[0] === key));
  menu.innerHTML = TASK_COLUMN_OPTIONS.map(([key, label]) => `<label><input type="checkbox" value="${key}" ${selectedTaskColumns.includes(key) ? "checked" : ""}>${label}</label>`).join("");
  menu.dataset.ready = "true";
  applyTaskColumns();
}

function buildFilters() {
  const dSel = $("#dimensionFilter");
  if (dSel) dSel.innerHTML = '<option value="">全部所属领域</option>' + DIMS.map(dim => `<option value="${esc(dim)}">${esc(dim)}</option>`).join("");
}

function renderTasks() {
  const rows = document.getElementById("taskRows");
  if (!rows) return;
  const dim = $("#dimensionFilter").value;
  const q = $("#taskSearch").value.trim().toLowerCase();

  const data = scopedTasks().filter(t => {
    if (dim && t.dimension !== dim) return false;
    const impVal = (t.importance || "").trim();
    const v = importanceFilterValue;
    if (v === "孟主任关注▲" && !impVal.includes("▲")) return false;
    if (v === "省领导关注★" && !impVal.includes("★")) return false;
    if (q && [t.task, t.dimension, t.group, t.owner, t.co].join(" ").toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
  if (taskSort.key) data.sort((a, b) => String(taskColumnValue(a, taskSort.key)).localeCompare(String(taskColumnValue(b, taskSort.key)), "zh-CN", { numeric:true }) * taskSort.direction);

  rows.innerHTML = data.map(t => {
    const ps = progressStore[t.id] || [];
    const cells = selectedTaskColumns.map(key => {
      if (key === "importance") return `<div class="importance-cell">${renderImportanceTags(t.importance)}</div>`;
      const value = esc(taskColumnValue(t, key));
      if (key === "task") return `<div class="task-name"><span class="chev">›</span><span>${value}</span></div>`;
      return `<div>${value || "—"}</div>`;
    }).join("");
    return `<article class="task" data-id="${t.id}">
      <div class="task-summary">${cells}
      </div>
      <div class="task-detail">
        <div class="task-detail-inner">
          <div class="detail-pad">
            <section class="detail-box">
              <h3>任务细节</h3>
              <p>${esc(t.task)}</p>
              <div class="meta">
                <div><b>所属领域</b>${esc(t.dimension)}</div>
                <div><b>所属重点任务</b>${esc(t.group)}</div>
                <div><b>责任单位</b>${esc(t.owner)}</div>
                <div><b>协同单位</b>${esc(t.co) || "—"}</div>
                <div><b>时间节点</b>${esc(t.timeNode || t.time)}</div>
                <div><b>研究时间</b>${esc(t.researchTime) || "—"}</div>
                <div><b>重要程度</b>${t.importance ? `<span class="tag ${t.importance.includes("★") ? "tag-red" : t.importance.includes("▲") ? "tag-orange" : "tag-blue"}">${esc(t.importance)}</span>` : `<span class="tag tag-mute">未标记</span>`}</div>
                <div class="meta-wide"><b>预期目标</b>${esc(t.target) || "—"}</div>
              </div>
            </section>
            <section class="monthly">
              <div class="monthly-top">
                <h3>月度进展情况</h3>
                <button class="primary add-progress" data-id="${t.id}">填报本月进展</button>
              </div>
              <table class="progress-table">
                <thead><tr><th>调度月份</th><th>任务状态</th><th>月度进展情况</th><th>存在问题</th><th>下月工作安排</th></tr></thead>
                <tbody>${ps.length ? ps.map(p =>
                  `<tr><td>${esc(p.month)}</td><td>${esc(p.status)}</td><td>${esc(p.progress)}</td><td>${esc(p.problem || "无")}</td><td>${esc(p.next || "—")}</td></tr>`
                ).join("") : '<tr><td colspan="5" class="empty">暂无月度进展记录</td></tr>'}</tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </article>`;
  }).join("") || '<div class="empty">没有符合条件的任务</div>';
}

function renderTaskProgress(id) {
  const el = document.getElementById("progress-" + id);
  if (!el) return;
  const store = JSON.parse(localStorage.getItem("progressStore") || "{}");
  const records = store[id] || [];
  if (!records.length) return;
  el.innerHTML = '<div class="progress-list">' +
    records.map(p => `<div class="progress-item">
      <span class="p-month">${esc(p.month)}</span>
      <span class="p-status">${esc(p.status)}</span>
      <span class="p-text">${esc(p.progress)}</span>
    </div>`).join("") + '</div>';
}

// ── 抽屉开关 ────────────────────────────────────────────
function openDrawer(dim) {
  currentDimension = dim;
  const drawer = document.getElementById("taskDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const title = document.getElementById("drawerTitle");
  if (!drawer) return;
  if (title) title.textContent = dim && dim !== "all"
    ? dim + "维度｜重点任务清单"
    : "重点任务清单";
  drawer.classList.add("open");
  backdrop?.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  applyTaskColumns();
  buildFilters();
  renderTasks();
}

function closeDrawer() {
  const drawer = document.getElementById("taskDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  drawer.classList.remove("open");
  backdrop?.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

// ── 初始化抽屉及进展填报事件 ────────────────────────────
function initDrawer() {
  document.querySelectorAll("[data-page]").forEach(el => {
    const navigate = () => { location.href = el.dataset.page; };
    el.addEventListener("click", navigate);
    el.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate();
      }
    });
  });
  document.getElementById("drawerClose")?.addEventListener("click", closeDrawer);
  document.getElementById("drawerBackdrop")?.addEventListener("click", closeDrawer);
  ["#dimensionFilter"].forEach(s =>
    document.querySelector(s)?.addEventListener("change", renderTasks)
  );
  document.getElementById("taskSearch")?.addEventListener("input", renderTasks);
  document.getElementById("taskListHead")?.addEventListener("click", event => {
    const cell = event.target.closest("[data-sort-key]");
    if (!cell) return;
    const key = cell.dataset.sortKey;
    taskSort = { key, direction: taskSort.key === key ? -taskSort.direction : 1 };
    applyTaskColumns();
    renderTasks();
  });
  document.getElementById("importanceFilter")?.addEventListener("change", event => {
    importanceFilterValue = event.target.value;
    renderTasks();
  });
  document.getElementById("columnToggle")?.addEventListener("click", () => document.getElementById("columnMenu")?.classList.toggle("open"));
  document.getElementById("columnMenu")?.addEventListener("change", event => {
    if (!event.target.matches("input[type=checkbox]")) return;
    const checked = [...document.querySelectorAll("#columnMenu input:checked")].map(input => input.value);
    if (!checked.includes("task")) { event.target.checked = true; return; }
    selectedTaskColumns = checked;
    localStorage.setItem("taskColumns", JSON.stringify(selectedTaskColumns));
    applyTaskColumns();
    renderTasks();
  });

  const rows = document.getElementById("taskRows");
  rows?.addEventListener("click", e => {
    const add = e.target.closest(".add-progress");
    if (add) {
      e.stopPropagation();
      activeTask = add.dataset.id;
      document.getElementById("progressModal")?.classList.add("open");
      return;
    }
    const summary = e.target.closest(".task-summary");
    if (summary) {
      const task = summary.closest(".task");
      document.querySelectorAll(".task.open").forEach(x => {
        if (x !== task) x.classList.remove("open");
      });
      task.classList.toggle("open");
    }
  });

  document.getElementById("modalCancel")?.addEventListener("click", () =>
    document.getElementById("progressModal")?.classList.remove("open")
  );
  document.getElementById("progressModal")?.addEventListener("click", e => {
    if (e.target.id === "progressModal") e.currentTarget.classList.remove("open");
  });
  document.getElementById("progressForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const item = {
      month: document.getElementById("month").value,
      status: document.getElementById("status").value,
      progress: document.getElementById("progress").value,
      result: document.getElementById("result").value,
      problem: document.getElementById("problem").value,
      coordination: document.getElementById("coordination").value,
      next: document.getElementById("next").value
    };
    (progressStore[activeTask] ??= []).unshift(item);
    localStorage.setItem("progressStore", JSON.stringify(progressStore));
    e.target.reset();
    document.getElementById("progressModal").classList.remove("open");
    renderTasks();
    document.querySelector(`.task[data-id="${activeTask}"]`)?.classList.add("open");
    const toast = document.getElementById("toast");
    toast?.classList.add("show");
    setTimeout(() => toast?.classList.remove("show"), 1800);
  });
}

function populateFilters() {
  const dims = DIMS;
  const owners = [...new Set(TASKS.map(t => t.owner))].sort();
  const gf = document.getElementById("groupFilter");
  const of = document.getElementById("ownerFilter");
  dims.forEach(d => {
    const o = document.createElement("option");
    o.value = d; o.textContent = d;
    gf?.appendChild(o);
  });
  owners.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o; opt.textContent = o;
    of?.appendChild(opt);
  });
}

// ── 资讯滚动 ───────────────────────────────────────────
const NEWS_DATA = [
  "浙江省算力券申领通道开放，首批额度 2 亿元",
  "之江实验室发布「之江璇玑」多模态大模型 v2.0",
  "杭州获批国家人工智能创新高地先行区",
  "《浙江省人工智能高质量发展行动方案（2026版）》正式印发",
];

function initTicker() {
  const track = document.getElementById("tickerTrack");
  const dateEl = document.getElementById("tickerDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("zh-CN",
      {year:"numeric",month:"2-digit",day:"2-digit"}
    );
  }
  if (track) {
    // 生成两份数据实现无缝滚动
    const content = NEWS_DATA
      .map(n => '<span class="ticker-item">' + esc(n) + '</span>')
      .join('<span class="ticker-sep">｜</span>');
    track.innerHTML = content + '<span class="ticker-sep">｜</span>' + content;
  }
}

// ════════════════════════════════════════════════════════════
// 统一列表页渲染引擎（政策体系 / 重大项目 / 应用场景）
// ════════════════════════════════════════════════════════════

const SCENE_CITY_ORDER = [
  {
    name: "杭州市",
    aliases: ["杭州市", "杭州", "拱墅区", "上城区", "滨江区", "富阳区", "淳安县", "临平区", "钱塘区", "西湖区", "萧山区", "余杭区", "建德市", "桐庐县"]
  },
  {
    name: "宁波市",
    aliases: ["宁波市", "宁波", "海曙区", "北仑区", "江北区", "宁海县", "鄞州区", "镇海区", "余姚市", "慈溪市", "奉化区", "象山县"]
  },
  {
    name: "温州市",
    aliases: ["温州市", "温州", "苍南县", "洞头区", "龙湾区", "鹿城区", "泰顺县", "文成县", "永嘉县", "乐清市", "龙港市", "瑞安市", "平阳县", "瓯海区"]
  },
  {
    name: "嘉兴市",
    aliases: ["嘉兴市", "嘉兴", "海宁市", "嘉善县", "南湖区", "平湖市", "桐乡市", "秀洲区", "海盐县"]
  },
  {
    name: "湖州市",
    aliases: ["湖州市", "湖州", "德清县", "南浔区", "吴兴区", "长兴县", "安吉县"]
  },
  {
    name: "绍兴市",
    aliases: ["绍兴市", "绍兴", "滨海新区", "柯桥区", "上虞区", "嵊州市", "新昌县", "越城区", "诸暨市"]
  },
  {
    name: "金华市",
    aliases: ["金华市", "金华", "金东区", "兰溪市", "婺城区", "义乌市", "浦江县", "永康市", "东阳市", "武义县", "磐安县"]
  },
  {
    name: "衢州市",
    aliases: ["衢州市", "衢州", "江山市", "开化县", "柯城区", "龙游县", "衢江区", "常山县"]
  },
  {
    name: "舟山市",
    aliases: ["舟山市", "舟山", "岱山县", "定海区", "普陀区"]
  },
  {
    name: "台州市",
    aliases: ["台州市", "台州", "黄岩区", "椒江区", "路桥区", "三门县", "仙居县", "温岭市", "临海市", "玉环市", "天台县"]
  },
  {
    name: "丽水市",
    aliases: ["丽水市", "丽水", "缙云县", "莲都区", "青田县", "庆元县", "松阳县", "遂昌县", "云和县", "景宁县", "龙泉市"]
  }
];

const sceneLocationRank = value => {
  const text = String(value || "").replace(/\s+/g, "");
  if (!text) return SCENE_CITY_ORDER.length + 1;
  for (let index = 0; index < SCENE_CITY_ORDER.length; index += 1) {
    if (SCENE_CITY_ORDER[index].aliases.some(alias => text.includes(alias))) return index + 1;
  }
  if (text === "省级" || text === "浙江省级" || text.startsWith("浙江省") || text.includes("全省")) return 0;
  return SCENE_CITY_ORDER.length + 1;
};

const PAGE_CONFIG = {
  policies: {
    dataKey: "POLICIES_DATA",
    pageTitle: "重点任务",
    listTitle: "政策体系",
    listHeadTitle: "重点任务",
    apiMode: false,
    columns: [
      { key: "id",        label: "编号",   width: "70px" },
      { key: "name",      label: "政策名称", width: "minmax(280px,2fr)" },
      { key: "category",  label: "所属领域", width: "minmax(100px,.8fr)" },
      { key: "issuer",    label: "发文层级", width: "minmax(80px,.65fr)" },
      { key: "department",label: "责任部门", width: "minmax(160px,1.1fr)" },
      { key: "date",      label: "发文时间", width: "minmax(100px,.75fr)" },
    ],
    filterFields: [
      { id: "listCategoryFilter", key: "category", label: "所属领域", options: "auto" }
    ],
    searchFields: ["name", "department", "issuer"],
  },
  projects: {
    dataKey: "PROJECTS_DATA",
    pageTitle: "重大项目",
    listTitle: "重大项目",
    listHeadTitle: "重大项目",
    apiMode: true,
    apiDataPath: "projects",
    columns: [
      { key: "序号",              label: "序号",   width: "55px" },
      { key: "项目名称",           label: "项目名称", width: "minmax(220px,1.8fr)" },
      { key: "大类",              label: "所属领域", width: "minmax(65px,.5fr)" },
      { key: "领域",              label: "细分赛道", width: "minmax(130px,1fr)" },
      { key: "建设地点",           label: "地点",   width: "minmax(80px,.65fr)" },
      { key: "起止年限",           label: "年限",   width: "minmax(90px,.7fr)", sortable: true, sortType: "year" },
      { key: "总投资",            label: "总投资（亿元）", width: "minmax(90px,.7fr)", number: true, sortable: true },
      { key: "2026年计划投资",     label: "2026计划（亿元）", width: "minmax(95px,.72fr)", number: true, sortable: true },
      { key: "项目业主",           label: "项目业主", width: "minmax(160px,1.1fr)" },
      { key: "建设性质",           label: "性质",   width: "minmax(65px,.5fr)" },
    ],
    filterFields: [
      { id: "listCategoryFilter", key: "大类", label: "所属领域", options: "auto" },
      { id: "listLocationFilter", key: "建设地点", label: "地点", options: "auto" },
      { id: "listNatureFilter", key: "建设性质", label: "性质", options: "auto" }
    ],
    searchFields: ["项目名称", "项目业主", "建设地点"],
  },
  experts: {
    dataKey: "EXPERTS_DATA",
    pageTitle: "专家库",
    listTitle: "专家库",
    listHeadTitle: "专家库",
    apiMode: true,
    apiDataPath: "members",
    columns: [
      { key: "序号",           label: "序号",       width: "55px" },
      { key: "姓名",           label: "姓名",       width: "minmax(90px,.7fr)" },
      { key: "所属领域",       label: "所属领域",   width: "minmax(150px,1fr)" },
      { key: "原委员会职务",   label: "原委员会职务", width: "minmax(120px,.9fr)" },
      { key: "职务",           label: "职务",       width: "minmax(360px,3fr)" },
      { key: "备注",           label: "备注",       width: "minmax(220px,1.5fr)" }
    ],
    filterFields: [
      { id: "listExpertDomainFilter", key: "所属领域", label: "所属领域", options: "auto" }
    ],
    searchFields: ["姓名", "所属领域", "职务", "备注"]
  },
  scenes: {
    dataKey: "SCENES_DATA",
    pageTitle: "应用场景",
    listTitle: "应用场景",
    listHeadTitle: "应用场景",
    apiMode: true,
    apiDataPath: "items",
    columns: [
      { key: "序号",      label: "序号",    width: "55px" },
      { key: "场景名称",   label: "场景名称",  width: "minmax(220px,1.8fr)" },
      { key: "场景领域",   label: "场景领域",  width: "minmax(180px,1.3fr)" },
      { key: "所在地点",   label: "地点",    width: "minmax(75px,.6fr)", sortType: "scene-location" },
      { key: "业主单位",   label: "业主单位",  width: "minmax(160px,1.1fr)" },
      { key: "主管部门",   label: "主管部门",  width: "minmax(150px,1fr)" },
    ],
    filterFields: [
      { id: "listSceneFieldFilter", key: "场景领域", label: "场景领域", options: "auto" },
      { id: "listLocationFilter", key: "所在地点", label: "地点", options: "auto" }
    ],
    defaultSort: { key: "所在地点", direction: 1 },
    renumber: true,
    searchFields: ["场景名称", "业主单位", "所在地点", "主管部门", "场景说明"],
  },
};

function initListPage(section) {
  const cfg = PAGE_CONFIG[section];
  if (!cfg) return;

  // 加载数据
  let rawItems = [];
  if (window[cfg.dataKey]) {
    const src = window[cfg.dataKey];
    rawItems = cfg.apiMode ? (src[cfg.apiDataPath] || []) : (src.policies || []);
    console.log(`[${section}] 加载 ${rawItems.length} 条数据`);
  }

  const filterFields = cfg.filterFields || [];
  const sortState = {
    key: cfg.defaultSort?.key || "",
    direction: cfg.defaultSort?.direction || 1
  };
  const valueAsText = value => Array.isArray(value) ? value.join("、") : String(value ?? "");

  const sortValue = (item, column) => {
    const value = item[column.key] ?? "";
    if (column.sortType === "scene-location") return sceneLocationRank(value);
    if (column.sortType === "year") {
      const year = String(value).match(/\d{4}/);
      return year ? Number(year[0]) : null;
    }
    if (typeof value === "number") return value;
    const numeric = Number(value);
    return value !== "" && Number.isFinite(numeric) ? numeric : String(value);
  };

  const compareItems = (a, b, column) => {
    const av = sortValue(a, column);
    const bv = sortValue(b, column);
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortState.direction;
    if (typeof av === "number") return -1 * sortState.direction;
    if (typeof bv === "number") return 1 * sortState.direction;
    return String(av).localeCompare(String(bv), "zh-CN", { numeric: true }) * sortState.direction;
  };

  // 构建筛选器
  const filtersEl = document.getElementById("listFilters");
  if (filtersEl) {
    let html = filterFields.map(field => {
      const options = field.options === "auto"
        ? [...new Set(rawItems.flatMap(item => {
          const value = item[field.key];
          return Array.isArray(value) ? value : [value];
        }).filter(Boolean))]
        : field.options || [];
      return `<select id="${field.id}" aria-label="筛选${field.label}">
        <option value="">全部${field.label}</option>
        ${options.map(opt => `<option value="${esc(opt)}">${esc(opt)}</option>`).join("")}
      </select>`;
    }).join("");
    html += `<input id="listSearch" placeholder="搜索${cfg.listTitle}" aria-label="搜索">`;
    filtersEl.innerHTML = html;
  }

  const rowsEl = document.getElementById("listRows");
  const headEl = document.getElementById("listHead");
  const bodyEl = document.querySelector(".list-body");

  // 渲染函数
  const render = () => {
    const q = (document.getElementById("listSearch")?.value || "").trim().toLowerCase();

    const filtered = rawItems.filter(item => {
      for (const field of filterFields) {
        const value = document.getElementById(field.id)?.value || "";
        const itemValue = item[field.key];
        const matches = Array.isArray(itemValue) ? itemValue.includes(value) : itemValue === value;
        if (value && !matches) return false;
      }
      if (q) {
        const text = cfg.searchFields.map(f => valueAsText(item[f])).join(" ");
        if (text.toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    });

    if (sortState.key) {
      const column = cfg.columns.find(c => c.key === sortState.key);
      if (column) filtered.sort((a, b) => compareItems(a, b, column));
    }

    const colWidths = cfg.columns.map(c => c.width).join(" ");

    // 同时在 .list-body 和表头行上设置 grid 列宽（两处都设保证兼容）
    if (bodyEl) bodyEl.style.setProperty("--task-grid-columns", colWidths);
    if (headEl) {
      headEl.style.gridTemplateColumns = colWidths;
      headEl.innerHTML = cfg.columns.map(c => {
        const sortable = c.sortable;
        const indicator = sortState.key === c.key ? (sortState.direction === 1 ? "▲" : "▼") : "↕";
        const attrs = sortable
          ? ` class="list-sortable" data-sort-key="${esc(c.key)}" role="button" tabindex="0" aria-label="按${esc(c.label)}排序"`
          : "";
        return `<div${attrs}>${c.label.replace(/\n/g,"<br>")}${sortable ? `<span class="sort-indicator">${indicator}</span>` : ""}</div>`;
      }).join("");
    }
    if (!rowsEl) return;
    rowsEl.style.gridTemplateColumns = "minmax(0, 1fr)";

    rowsEl.innerHTML = filtered.length
      ? filtered.map((item, idx) => {
          const cells = cfg.columns.map(c => {
            let val = item[c.key] ?? "";
            if (c.number && typeof val === "number") val = val.toFixed(2);
            if (c.key === "序号") val = cfg.renumber ? idx + 1 : (typeof val === "number" ? val : idx + 1);
            const label = val == null ? "—" : esc(valueAsText(val)).replace(/\n/g, "<br>");
            const cls = c.key === cfg.columns[1].key ? "row-title" : "";
            return `<div class="${cls}">${label}</div>`;
          }).join("");
          return `<article class="list-row">
            <div class="list-summary">${cells}</div>
          </article>`;
        }).join("")
      : '<div class="list-empty">没有符合条件的记录</div>';
  };

  filterFields.forEach(field => document.getElementById(field.id)?.addEventListener("change", render));
  document.getElementById("listSearch")?.addEventListener("input", render);
  headEl?.addEventListener("click", event => {
    const cell = event.target.closest("[data-sort-key]");
    if (!cell) return;
    const key = cell.dataset.sortKey;
    sortState.direction = sortState.key === key ? -sortState.direction : 1;
    sortState.key = key;
    render();
  });
  headEl?.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const cell = event.target.closest("[data-sort-key]");
    if (!cell) return;
    event.preventDefault();
    cell.click();
  });

  // 初始渲染
  render();
}

// ════════════════════════════════════════════════════════════
// 总体初始化
// ════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", async () => {
  const section = document.body.dataset.listPage;
  await loadData();         // 先加载 tasks.json
  buildOrgFlow();    // 组织架构
  buildGoals();       // 目标区域
  buildMatrix();      // 动态生成矩阵内容
  buildRails();       // 动态生成侧栏
  buildMechanism();   // 动态生成机制专题
  if (!section) initDrawer(); // 仅总图和任务页启用任务抽屉
  initTicker();       // 资讯滚动
  if (document.body.classList.contains("task-page")) openDrawer("all");

  // 列表页自动初始化
  if (section && PAGE_CONFIG[section]) initListPage(section);
});
