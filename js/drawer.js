/**
 * @file drawer.js  任务抽屉 + 月度进展填报
 * @description
 *   负责首页/任务页右侧抽屉：
 *     - 任务表格渲染（带列选择 / 排序 / 筛选 / 搜索）
 *     - 行展开：任务细节 + 月度进展填报
 *     - 月度进展 modal：localStorage 持久化
 *   依赖：state.js、utils.js、home.js（提供 scopedTasks / DIMS）。
 */

(function () {
  "use strict";

  const state = window.__state;
  const { esc, valueAsText } = window.RenderUtils;
  const Home = window.Home;

  /** @typedef {[string, string]} TaskColumnOption 列 key + 中文标签 */
  /** @type {TaskColumnOption[]} */
  const TASK_COLUMN_OPTIONS = [
    ["task", "任务内容"], ["dimension", "所属领域"], ["group", "重点任务"],
    ["owner", "责任单位"], ["co", "协同单位"], ["timeNode", "时间节点"], ["researchTime", "研究时间"],
    ["importance", "重要程度"], ["target", "目标"], ["id", "编号"],
  ];
  const COLUMNS_KEY = "taskColumns";

  /**
   * 抽屉表格列宽模板，按选中列动态拼接 grid-template-columns。
   * @param {string[]} selectedColumns
   * @returns {string}
   */
  const taskGridTemplate = selectedColumns => selectedColumns.map(key => {
    if (key === "task") return "minmax(360px,2.4fr)";
    if (key === "dimension") return "minmax(70px,.45fr)";
    if (key === "co" || key === "group") return "minmax(170px,1.1fr)";
    if (["researchTime", "importance", "timeNode", "id"].includes(key)) return "minmax(100px,.72fr)";
    return "minmax(120px,.85fr)";
  }).join(" ");

  /**
   * 重新生成抽屉列头 grid + DOM。
   * @returns {void}
   */
  const applyTaskColumns = () => {
    const list = document.querySelector(".task-list");
    const head = document.getElementById("taskListHead");
    if (!list || !head) return;
    list.style.setProperty("--task-grid-columns", taskGridTemplate(state.selectedTaskColumns));
    head.innerHTML = state.selectedTaskColumns.map(key => {
      const label = TASK_COLUMN_OPTIONS.find(item => item[0] === key)?.[1] || key;
      if (!["owner", "timeNode"].includes(key)) return `<div>${esc(label)}</div>`;
      const indicator = state.taskSort.key === key
        ? (state.taskSort.direction === 1 ? "▲" : "▼")
        : "↕";
      return `<div data-sort-key="${key}">${esc(label)}<span class="sort-indicator">${indicator}</span></div>`;
    }).join("");
  };

  /**
   * 构建任务列复选框菜单（持久化到 localStorage）。
   * @returns {void}
   */
  const buildTaskColumnPicker = () => {
    const menu = document.getElementById("columnMenu");
    if (!menu || menu.dataset.ready) return;
    const saved = JSON.parse(localStorage.getItem(COLUMNS_KEY) || "null");
    if (Array.isArray(saved) && saved.length && saved.includes("task")) {
      state.selectedTaskColumns = saved.filter(key =>
        TASK_COLUMN_OPTIONS.some(item => item[0] === key)
      );
    }
    menu.innerHTML = TASK_COLUMN_OPTIONS.map(([key, label]) =>
      `<label><input type="checkbox" value="${key}" ${state.selectedTaskColumns.includes(key) ? "checked" : ""}>${label}</label>`
    ).join("");
    menu.dataset.ready = "true";
    applyTaskColumns();
  };

  /**
   * 渲染抽屉内的维度下拉选项。
   * @returns {void}
   */
  const buildFilters = () => {
    const dSel = document.querySelector("#dimensionFilter");
    if (!dSel) return;
    dSel.innerHTML = '<option value="">全部所属领域</option>' +
      Home.DIMS.map(dim => `<option value="${esc(dim)}">${esc(dim)}</option>`).join("");
  };

  /**
   * 把任务按"重要性"标签拆成多个 <span class="tag">。
   * @param {string} value
   * @returns {string}
   */
  const renderImportanceTags = value => {
    if (!value) return '<span class="tag tag-mute">未标记</span>';
    return String(value).split("；").map(label => {
      const tone = label.includes("省领导") ? "tag-red"
        : label.includes("孟主任") ? "tag-orange"
        : "tag-blue";
      return `<span class="tag ${tone}">${esc(label)}</span>`;
    }).join("");
  };

  /**
   * 读取单元格的展示值。
   * @param {Object} task
   * @param {string} key
   * @returns {string}
   */
  const taskColumnValue = (task, key) => {
    if (key === "task") return `${task.id}．${task.task}`;
    if (key === "timeNode") return task.timeNode || task.time || "";
    return task[key] ?? "";
  };

  /**
   * 渲染抽屉任务表格。
   * @returns {void}
   */
  const renderTasks = () => {
    const rows = document.getElementById("taskRows");
    if (!rows) return;
    const dim = document.querySelector("#dimensionFilter")?.value || "";
    const q = document.getElementById("taskSearch")?.value.trim().toLowerCase() || "";

    const data = Home.scopedTasks().filter(t => {
      if (dim && t.dimension !== dim) return false;
      const impVal = (t.importance || "").trim();
      const v = state.importanceFilterValue;
      if (v === "孟主任关注▲" && !impVal.includes("▲")) return false;
      if (v === "省领导关注★" && !impVal.includes("★")) return false;
      if (q && [t.task, t.dimension, t.group, t.owner, t.co].join(" ").toLowerCase().indexOf(q) === -1) return false;
      return true;
    });

    if (state.taskSort.key) {
      data.sort((a, b) =>
        String(taskColumnValue(a, state.taskSort.key))
          .localeCompare(String(taskColumnValue(b, state.taskSort.key)), "zh-CN", { numeric: true })
        * state.taskSort.direction
      );
    }

    rows.innerHTML = data.map(t => {
      const ps = state.progressStore.byTask[t.id] || [];
      const cells = state.selectedTaskColumns.map(key => {
        if (key === "importance") return `<div class="importance-cell">${renderImportanceTags(t.importance)}</div>`;
        const value = esc(taskColumnValue(t, key));
        if (key === "task") return `<div class="task-name"><span class="chev">›</span><span>${value}</span></div>`;
        return `<div>${value || "—"}</div>`;
      }).join("");
      return `<article class="task" data-id="${esc(t.id)}">
        <div class="task-summary">${cells}</div>
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
                  <button class="primary add-progress" data-id="${esc(t.id)}">填报本月进展</button>
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
  };

  /**
   * 打开抽屉。
   * @param {string} [dim] "all" 或具体维度名；不传则用 state.currentDimension。
   * @returns {void}
   */
  const openDrawer = dim => {
    if (dim) state.currentDimension = dim;
    const drawer = document.getElementById("taskDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    const title = document.getElementById("drawerTitle");
    if (!drawer) return;
    if (title) {
      const cur = state.currentDimension;
      title.textContent = cur && cur !== "all"
        ? cur + "维度｜重点任务清单"
        : "重点任务清单";
    }
    drawer.classList.add("open");
    backdrop?.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    applyTaskColumns();
    buildFilters();
    renderTasks();
  };

  /**
   * 关闭抽屉。
   * @returns {void}
   */
  const closeDrawer = () => {
    const drawer = document.getElementById("taskDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    drawer?.classList.remove("open");
    backdrop?.classList.remove("open");
    drawer?.setAttribute("aria-hidden", "true");
  };

  /**
   * 绑定抽屉所有交互（行展开、筛选、列选择、进展填报、跳转 cell）。
   * @returns {void}
   */
  const initDrawer = () => {
    // 矩阵 cell 跳转（[data-page]）
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

    document.querySelector("#dimensionFilter")?.addEventListener("change", renderTasks);
    document.getElementById("taskSearch")?.addEventListener("input", renderTasks);
    document.getElementById("taskListHead")?.addEventListener("click", event => {
      const cell = event.target.closest("[data-sort-key]");
      if (!cell) return;
      const key = cell.dataset.sortKey;
      state.taskSort = { key, direction: state.taskSort.key === key ? -state.taskSort.direction : 1 };
      applyTaskColumns();
      renderTasks();
    });
    document.getElementById("importanceFilter")?.addEventListener("change", event => {
      state.importanceFilterValue = event.target.value;
      renderTasks();
    });

    document.getElementById("columnToggle")?.addEventListener("click", () => {
      document.getElementById("columnMenu")?.classList.toggle("open");
    });
    document.getElementById("columnMenu")?.addEventListener("change", event => {
      if (!event.target.matches("input[type=checkbox]")) return;
      const checked = [...document.querySelectorAll("#columnMenu input:checked")].map(input => input.value);
      if (!checked.includes("task")) { event.target.checked = true; return; }
      state.selectedTaskColumns = checked;
      localStorage.setItem(COLUMNS_KEY, JSON.stringify(state.selectedTaskColumns));
      applyTaskColumns();
      renderTasks();
    });

    const rows = document.getElementById("taskRows");
    rows?.addEventListener("click", e => {
      const add = e.target.closest(".add-progress");
      if (add) {
        e.stopPropagation();
        state.activeTask = add.dataset.id;
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
        next: document.getElementById("next").value,
      };
      const taskId = state.activeTask;
      if (!taskId) return;
      (state.progressStore.byTask[taskId] ??= []).unshift(item);
      window.RenderState.saveProgress(state.progressStore);
      e.target.reset();
      document.getElementById("progressModal").classList.remove("open");
      renderTasks();
      document.querySelector(`.task[data-id="${taskId}"]`)?.classList.add("open");
      const toast = document.getElementById("toast");
      toast?.classList.add("show");
      setTimeout(() => toast?.classList.remove("show"), 1800);
    });
  };

  /**
   * 旧 render.js 中暴露给首页/任务页使用的若干函数，保留等价行为。
   * @returns {void}
   */
  const populateFilters = () => {
    const dims = Home.DIMS;
    const owners = [...new Set((state.tasks || []).map(t => t.owner))].sort();
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
  };

  window.Drawer = {
    initDrawer,
    openDrawer,
    closeDrawer,
    buildTaskColumnPicker,
    buildFilters,
    renderTasks,
    populateFilters,
  };
})();