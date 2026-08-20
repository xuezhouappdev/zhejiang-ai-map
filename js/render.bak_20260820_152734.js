// render.js — 总图渲染引擎（浙江省人工智能高质量发展工作图谱）
// 数据来源: 外部 JSON (tasks.json / goals / rail / mechanism / news)
// 浏览器兼容性: Chrome / Firefox / Safari / Edge 最新版（支持 ES2022）

// ── 全局数据（从 tasks.json 动态加载）──────────────────────
let TASKS = [];
let DIMS = ["算力", "数据", "模型", "应用", "生态"];

const GOALS_DATA = {"version": "2026-08-20", "overall": {"target_2026": {"value": "8300亿元", "desc": "2026年核心产业营收"}, "target_2030": {"value": "1.2万亿元", "desc": "2030年核心产业营收"}, "vision": "人工智能创新发展高地", "milestones": ["中阿应用合作中心", "10万卡算力中心", "开源社区"]}, "dimensions": {"算力": {"目标体系": "2026年：200 EFlops以上；2030年：算力规模全国前三；云服务规模全国领先", "政策体系": "《浙江省推进算力网建设实施方案》《公共算力池建设工作指引》", "重点任务": "有序推进算力布局；加强电力配套保障；实施人工智能券补助", "重大项目": "算力基础设施；网络基础设施", "应用场景": "芯模协同场景", "责任主体": "省发展改革委；省经信厅等"}, "数据": {"目标体系": "2026年：建成不低于10PB的高质量数据集；2030年：建成不低于20PB的高质量数据集", "政策体系": "《浙江省关于支持先行探索数据要素资源化价值化的若干措施（试行）》", "重点任务": "加强公共数据有序利用；布局高端数据标注平台；支持建设可信数据空间", "重大项目": "高质量数据集；数据基础设施", "应用场景": "数据要素×行业应用；高质量数据集应用", "责任主体": "省数据局；省经信厅等"}, "模型": {"目标体系": "2026年：突破20项以上关键核心技术；培育80个以上高价值垂类模型", "政策体系": "《生成式人工智能服务管理暂行办法》", "重点任务": "加强核心技术攻关；建设行业中试基地", "重大项目": "代理模型攻关；基础模型；领域模型；适配攻关", "应用场景": "行业模型应用；数模共振应用", "责任主体": "省委网信办；省科技厅等"}, "应用": {"目标体系": "2026年：打造300个以上典型应用场景；重点行业应用普及率超过70%", "政策体系": "《支持国家人工智能应用中试基地建设的若干举措》；国家人工智能应用中试基地项目调整管理细则", "重点任务": "打造出海服务平台；培育标杆应用场景；鼓励智能体创新应用；支持具身智能应用；支持智能终端消费", "重大项目": "具身智能和人形机器人；应用攻关；中试基地", "应用场景": "智能体应用场景；智能终端应用场景", "责任主体": "省发展改革委；省经信厅等"}, "生态": {"目标体系": "核心产业规模跃升；形成高能级产业生态", "政策体系": "《促进人工智能高质量发展行动方案（2026版）》《关于支持人工智能创新发展的若干措施》", "重点任务": "培育壮大开源社区；布局产业孵化平台；加大人才引育力度；举办赛事会议活动；提升安全能力", "重大项目": "产业；数字化转型", "应用场景": "魔搭社区；AI＋产业", "责任主体": "省发展改革委；省经信厅，省委组织部，省教育厅，省科技厅等"}}};

const RAIL_DATA = {"version": "2026-08-20", "leftRail": {"label": "工作体系", "items": [{"name": "例会", "desc": ["协调", "机制"], "interactive": false}, {"name": "统计", "desc": ["监测", "机制"], "interactive": false}, {"name": "专题", "desc": ["调研", "机制"], "interactive": true}, {"name": "跟踪", "desc": ["调度", "机制"], "interactive": false}, {"name": "安全", "desc": ["保障", "机制"], "interactive": false}, {"name": "评价", "desc": ["推广", "机制"], "interactive": false}]}, "rightRail": {"label": "评价体系", "items": [{"name": "目标", "desc": ["监测"], "interactive": false}, {"name": "政策", "desc": ["评估"], "interactive": false}, {"name": "任务", "desc": ["调度"], "interactive": false}, {"name": "项目", "desc": ["跟踪"], "interactive": false}, {"name": "综合", "desc": ["评价"], "interactive": false}, {"name": "通报", "desc": ["晾晒"], "interactive": false}]}};

const MECH_DATA = {"version": "2026-08-20", "chain": ["专班研究", "办公室协调", "领导小组审议"], "topics": ["算力专题", "数据专题", "模型专题", "应用专题", "生态专题"], "paradigm": "4353工作范式（分类分层分级）"};

// ── 工具函数 ───────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
let currentDimension = "all";
let activeTask = null;
const progressStore = JSON.parse(localStorage.getItem("progressStore") || "{}");

// ── 加载外部数据 ──────────────────────────────────────
async function loadData() {
  // 浏览器直接打开本地文件时，fetch 会被 file:// 安全策略拦截。
  // tasks.js 是由 tasks.json 同步生成的本地兼容数据入口。
  if (location.protocol === "file:" && window.TASKS_DATA) {
    TASKS = window.TASKS_DATA.tasks || [];
    DIMS = window.TASKS_DATA.dimensions || DIMS;
    console.log("本地兼容数据加载成功，共", TASKS.length, "条任务");
    return;
  }

  try {
    console.log("开始加载 tasks.json...");
    const res = await fetch("data/tasks.json");
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
      return;
    }
    console.warn("未找到可用的任务数据");
  }
}


// ── 动态生成 Matrix HTML ────────────────────────────────

function buildMatrix() {
  const el = document.getElementById("matrix");
  if (!el) return;

  const cols = DIMS.map(d => `<div class="cell head">${d}</div>`).join("");
  const rows = [
    ["目标体系", "目标体系"],
    ["政策体系", "政策体系"],
    ["重点任务", "action"],
    ["重大项目", "重大项目"],
    ["应用场景", "应用场景"],
    ["责任主体", "责任主体"],
  ];

  const rowHTML = rows.map(([label, key]) => {
    const cells = DIMS.map((dim, i) => {
      const val = GOALS_DATA.dimensions[dim] && GOALS_DATA.dimensions[dim][key] || "";
      const cls = key === "action" ? `cell action" data-dimension="${dim}` : "cell";
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
          links = `<li class="task-placeholder">点击查看全部任务 →</li>`;
        }
        return `<div class="${cls}"><ul>${links}</ul></div>`;
      }
      return `<div class="${cls}">${esc(val)}</div>`;
    }).join("");
    return `<div class="cell row">${label}</div>${cells}`;
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
  const o = GOALS_DATA.overall;
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
    const items = RAIL_DATA.leftRail.items.map(item =>
      `<div class="rail-cell${item.interactive ? " interactive" : ""}">${item.name}<br>${item.desc.join("<br>")}</div>`
    ).join("");
    left.innerHTML = `<div class="rail-cell head">${RAIL_DATA.leftRail.label.split("").join("<br>")}</div>${items}`;
  }
  if (right) {
    const items = RAIL_DATA.rightRail.items.map(item =>
      `<div class="rail-cell">${item.name}<br>${item.desc.join("<br>")}</div>`
    ).join("");
    right.innerHTML = `<div class="rail-cell head">${RAIL_DATA.rightRail.label.split("").join("<br>")}</div>${items}`;
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

function buildFilters() {
  const groups = [...new Set(scopedTasks().map(t => t.group))];
  const owners = [...new Set(scopedTasks().map(t => t.owner))];
  const times = [...new Set(scopedTasks().map(t => t.time))];

  const gSel = $("#groupFilter");
  const oSel = $("#ownerFilter");
  const tSel = $("#timeFilter");

  gSel.innerHTML = '<option value="">全部重点任务</option>' +
    groups.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join("");
  oSel.innerHTML = '<option value="">全部责任单位</option>' +
    owners.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join("");
  tSel.innerHTML = '<option value="">全部时间节点</option>' +
    times.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
}

function renderTasks() {
  const rows = document.getElementById("taskRows");
  if (!rows) return;
  const g = $("#groupFilter").value;
  const o = $("#ownerFilter").value;
  const tm = $("#timeFilter").value;
  const q = $("#taskSearch").value.trim().toLowerCase();

  const data = scopedTasks().filter(t =>
    (!g || t.group === g) &&
    (!o || t.owner === o) &&
    (!tm || t.time === tm) &&
    (!q || [t.task, t.owner, t.co, t.group].join(" ").toLowerCase().includes(q))
  );

  rows.innerHTML = data.map(t => {
    const ps = progressStore[t.id] || [];
    return `<article class="task" data-id="${t.id}">
      <div class="task-summary">
        <div class="task-name"><span class="chev">›</span><span>${t.id}．${esc(t.task)}</span></div>
        <div>${esc(t.owner)}</div>
        <div>${esc(t.co || "无")}</div>
        <div>${esc(t.time)}</div>
      </div>
      <div class="task-detail">
        <div class="task-detail-inner">
          <div class="detail-pad">
            <section class="detail-box">
              <h3>任务细节</h3>
              <p>${esc(t.task)}</p>
              <div class="meta">
                <div><b>任务分类</b>${esc(t.category)}</div>
                <div><b>所属重点任务</b>${esc(t.group)}</div>
                <div><b>责任单位</b>${esc(t.owner)}</div>
                <div><b>时间节点</b>${esc(t.time)}</div>
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
  backdrop.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  buildFilters();
  renderTasks();
}

function closeDrawer() {
  const drawer = document.getElementById("taskDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

// ── 初始化抽屉及进展填报事件 ────────────────────────────
function initDrawer() {
  document.querySelectorAll("[data-dimension]").forEach(el =>
    el.addEventListener("click", () => openDrawer(el.dataset.dimension))
  );
  document.getElementById("drawerClose")?.addEventListener("click", closeDrawer);
  document.getElementById("drawerBackdrop")?.addEventListener("click", closeDrawer);
  ["#groupFilter", "#ownerFilter", "#timeFilter"].forEach(s =>
    document.querySelector(s)?.addEventListener("change", renderTasks)
  );
  document.getElementById("taskSearch")?.addEventListener("input", renderTasks);

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

// ── 总体初始化 ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();         // 先加载 tasks.json
  buildOrgFlow();    // 组织架构
  buildGoals();       // 目标区域
  buildMatrix();      // 动态生成矩阵内容
  buildRails();       // 动态生成侧栏
  buildMechanism();   // 动态生成机制专题
  initDrawer();       // 抽屉初始化（含buildFilters）
  initTicker();       // 资讯滚动
});
