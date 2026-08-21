/**
 * @file project-drawer.js  重大项目调度抽屉
 * @description
 *   重大项目页（projects.html）右侧滑出抽屉：
 *     - 项目级进度卡片（累计完成率、形象进度、待协调事项高亮）
 *     - 历史月度调度记录（按月倒序）
 *     - 当前月度填报（5 字段：月份 / 本月投资 / 累计投资 / 进度节点 / 推进情况 / 存在问题）
 *     - 中试基地（6 个）项目暂打占位，提示"暂未上线"
 *   持久化：localStorage["projectDispatchStore"] → { byProjectId: { [id]: [record, ...] } }
 *   依赖：state.js、utils.js、list-page.js（提供 PROJECTS_DATA）。
 */

(function () {
  "use strict";

  const { esc, valueAsText, pad2 } = window.RenderUtils;
  const data = window.PROJECTS_DATA || { projects: [] };
  const allProjects = data.projects || [];

  const STORAGE_KEY = "projectDispatchStore";

  /** @typedef {{month:string, thisMonthInvest:number, cumInvest:number, phase:string, progressNote:string, issueNote:string, updatedAt:string}} DispatchRecord */

  /** @returns {{byProjectId: Record<string, DispatchRecord[]>}} */
  const loadStore = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { byProjectId: {} };
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && parsed.byProjectId
        ? parsed
        : { byProjectId: {} };
    } catch (err) {
      console.warn("[project-drawer] loadStore 解析失败", err);
      return { byProjectId: {} };
    }
  };

  /** @param {{byProjectId: Record<string, DispatchRecord[]>}} store */
  const saveStore = store => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.warn("[project-drawer] saveStore 写入失败", err);
    }
  };

  const store = loadStore();

  /** 形象进度节点枚举 */
  const PHASE_OPTIONS = [
    "前期",
    "开工",
    "主体施工",
    "设备安装",
    "试运行",
    "竣工验收",
    "投产",
  ];

  const isPilotBase = project => project && project.领域 === "中试基地";

  /**
   * 把数字归一化成可比较的 Number；非数字返回 0。
   * @param {*} v
   * @returns {number}
   */
  const toNumber = v => {
    if (v == null) return 0;
    const n = Number(String(v).replace(/[, ]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  /**
   * 计算项目双口径进度。
   * @param {Object} project
   * @param {DispatchRecord[]} records
   * @returns {{
   *   cum:{ratio:number,isUnknown:boolean,isOver:boolean,display:string},
   *   plan:{ratio:number,isUnknown:boolean,isOver:boolean,display:string}
   * }}
   */
  const computeProgress = (project, records) => {
    const total = toNumber(project.总投资);
    const planYear = toNumber(project["2026年计划投资"]);
    const cumRaw = String(project["截至2025年底完成投资"] ?? "").trim();
    const cumKnown = cumRaw !== "" && cumRaw !== "/" && toNumber(cumRaw) > 0;
    const latestCum = records.length
      ? Math.max(...records.map(r => toNumber(r.cumInvest)))
      : 0;
    const cumValue = cumKnown ? Math.max(toNumber(cumRaw), latestCum) : 0;
    const cumRatio = total > 0 ? cumValue / total : 0;
    const cumOver = cumRatio > 1.0001;
    const cumDisplay = !cumKnown
      ? "未填报"
      : cumOver
        ? `${(cumRatio * 100).toFixed(0)}%（超投）`
        : `${(cumRatio * 100).toFixed(cumRatio * 100 >= 10 ? 0 : 1)}%`;

    const planRatio = total > 0 && planYear > 0 ? planYear / total : 0;
    const planOver = planRatio > 1.0001;
    const planDisplay = !planYear
      ? "未明确"
      : `${(planRatio * 100).toFixed(planRatio * 100 >= 10 ? 0 : 1)}%`;

    return {
      cum: {
        ratio: Math.max(0, cumRatio),
        isUnknown: !cumKnown,
        isOver: cumOver,
        display: cumDisplay,
      },
      plan: {
        ratio: Math.max(0, planRatio),
        isUnknown: !planYear,
        isOver: planOver,
        display: planDisplay,
      },
    };
  };

  /**
   * 渲染 SVG 进度环（上层：累计完成率；下层：2026 年计划完成率，二者同一渲染器）。
   * @param {number} ratio 0-1 区间（允许 > 1 表示超投）
   * @param {"main"|"plan"} variant
   * @param {{isOver?:boolean,isUnknown?:boolean}} [opts]
   * @returns {string}
   */
  const renderProgressRing = (ratio, variant = "main", opts = {}) => {
    const r = 36;
    const c = 2 * Math.PI * r;
    const showRatio = Number.isFinite(ratio) ? Math.max(0, ratio) : 0;
    const dash = c * Math.min(1, showRatio);
    const pctNum = showRatio * 100;
    const pctText = opts.isUnknown
      ? "—"
      : pctNum >= 10
        ? pctNum.toFixed(0)
        : pctNum.toFixed(1);
    const cls = `pd-ring pd-ring-${variant}${opts.isUnknown ? " pd-ring-unknown" : ""}`;
    return `<svg class="${cls}" viewBox="0 0 90 90" aria-hidden="true">
      <circle cx="45" cy="45" r="${r}" class="pd-ring-bg"/>
      <circle cx="45" cy="45" r="${r}" class="pd-ring-fg" stroke-dasharray="${dash.toFixed(2)} ${c.toFixed(2)}"/>
    </svg>
    <div class="pd-ring-text"><b>${pctText}</b>${opts.isUnknown ? "" : "<span>%</span>"}</div>`;
  };

  /**
   * 建设性质 → 配色 + 中文标签。
   * @param {string} nature
   * @returns {{key:string,label:string,color:string}}
   */
  const natureMeta = nature => {
    const map = {
      "谋划":   { key: "plan",  label: "谋划阶段",   color: "#94a3b8" },
      "新建":   { key: "new",   label: "新建项目",   color: "#3B82F6" },
      "在建":   { key: "build", label: "正在建设",   color: "#1E40AF" },
      "拟建":   { key: "new",   label: "拟建项目",   color: "#0EA5E9" },
      "竣工":   { key: "done",  label: "已竣工",     color: "#6366F1" },
      "投产":   { key: "done",  label: "已投产",     color: "#10B981" },
    };
    const v = (nature || "").trim();
    return map[v] || { key: "unknown", label: v || "未注明", color: "#DC2626" };
  };

  /**
   * 格式化亿元数字；非数字（"/"等）显式 —。
   * @param {*} v
   * @returns {string}
   */
  const fmtYi = v => {
    if (v == null || String(v).trim() === "") return "—";
    if (String(v).trim() === "/") return "/";
    const n = toNumber(v);
    return Number.isFinite(n) && v !== "/" ? `${n.toFixed(2)} 亿元` : "—";
  };

  /**
   * 找到项目实体（按"序号"）。
   * @param {string} id
   * @returns {Object|undefined}
   */
  const findProject = id => allProjects.find(p => String(p.序号) === String(id));

  /**
   * 渲染抽屉头部（项目元信息 + 双环进度 + 建设性质色块）。
   * @param {Object} project
   * @param {DispatchRecord[]} records
   * @returns {string}
   */
  const renderHeader = (project, records) => {
    const prog = computeProgress(project, records);
    const latest = records[0];
    const lastMonth = latest ? latest.month : "—";
    const hasOpenIssue = records.some(r => r.issueNote && r.issueNote.trim());
    const phase = latest && latest.phase ? latest.phase : "尚未填报";
    const nature = natureMeta(project.建设性质);
    const natBadge = `<span class="pd-nature-badge pd-nature-${nature.key}" style="--nat-color:${nature.color}"><i class="fa-solid fa-circle" aria-hidden="true"></i>${esc(nature.label)}</span>`;
    return `
      <section class="pd-header">
        <div class="pd-header-meta">
          <div class="pd-eyebrow">${esc(project.分组 || "")} · ${esc(project.大类 || "")} · ${esc(project.领域 || "")}</div>
          <h2 class="pd-title">${esc(project.项目名称 || "")}</h2>
          <div class="pd-meta-grid">
            <div><span>序号</span><b>${esc(project.序号 || "—")}</b></div>
            <div><span>地点</span><b>${esc(project.建设地点 || "—")}</b></div>
            <div><span>起止年限</span><b>${esc(project.起止年限 || "—")}</b></div>
            <div><span>性质</span><b>${natBadge}</b></div>
            <div class="pd-meta-wide"><span>业主</span><b>${esc(project.项目业主 || "—")}</b></div>
            <div><span>总投资</span><b>${toNumber(project.总投资).toFixed(2)} 亿元</b></div>
            <div><span>2026 计划</span><b>${fmtYi(project["2026年计划投资"])}</b></div>
            <div><span>截至 2025 底</span><b>${fmtYi(project["截至2025年底完成投资"])}</b></div>
          </div>
        </div>
        <div class="pd-header-progress">
          <div class="pd-rings">
            <div class="pd-ring-cell" title="累计完成率 = 截至 2025 底完成投资 ÷ 总投资（含调度记录累计）">
              <div class="pd-ring-wrap pd-ring-wrap-main">${renderProgressRing(prog.cum.ratio, "main", { isUnknown: prog.cum.isUnknown })}</div>
              <div class="pd-ring-cap"><b>累计</b>·${esc(prog.cum.display)}</div>
            </div>
            <div class="pd-ring-cell" title="2026 计划占比 = 2026 年计划投资 ÷ 总投资（看今年盘子多大）">
              <div class="pd-ring-wrap pd-ring-wrap-plan">${renderProgressRing(prog.plan.ratio, "plan", { isUnknown: prog.plan.isUnknown })}</div>
              <div class="pd-ring-cap"><b>2026</b>·${esc(prog.plan.display)}</div>
            </div>
          </div>
          <div class="pd-progress-meta">
            <div><span>形象进度</span><b>${esc(phase)}</b></div>
            <div><span>最近填报</span><b>${esc(lastMonth)}</b></div>
            <div><span>已调度月数</span><b>${records.length}</b></div>
            ${hasOpenIssue ? '<div class="pd-issue-alert">⚠ 有未协调事项</div>' : ""}
          </div>
        </div>
      </section>`;
  };

  /**
   * 渲染历史记录表（按月倒序）。
   * @param {DispatchRecord[]} records
   * @returns {string}
   */
  const renderHistory = records => {
    if (!records.length) {
      return `<div class="pd-empty">暂无月度调度记录</div>`;
    }
    const rows = records.map(r => `
      <tr data-month="${esc(r.month)}">
        <td class="pd-month">${esc(r.month)}</td>
        <td>${esc(r.phase || "—")}</td>
        <td class="pd-num">${r.thisMonthInvest != null ? Number(r.thisMonthInvest).toFixed(2) : "—"}</td>
        <td class="pd-num">${r.cumInvest != null ? Number(r.cumInvest).toFixed(2) : "—"}</td>
        <td class="pd-note">${esc(r.progressNote || "—")}</td>
        <td class="pd-note ${r.issueNote ? "pd-issue" : ""}">${esc(r.issueNote || "—")}</td>
        <td class="pd-time">${esc(r.updatedAt || "—")}</td>
      </tr>`).join("");
    return `
      <table class="pd-history">
        <thead>
          <tr>
            <th>月份</th><th>节点</th><th>本月投资</th><th>累计投资</th>
            <th>推进情况</th><th>问题</th><th>更新时间</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  };

  /**
   * 渲染底部填报表单。
   * @param {Object} project
   * @param {DispatchRecord[]} records
   * @returns {string}
   */
  const renderForm = (project, records) => {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const lastCum = records.length ? Math.max(...records.map(r => toNumber(r.cumInvest))) : toNumber(project["截至2025年底完成投资"]);
    const phaseOpts = PHASE_OPTIONS.map(p =>
      `<option value="${esc(p)}">${esc(p)}</option>`
    ).join("");
    return `
      <form class="pd-form" id="pdForm">
        <fieldset class="pd-fs">
          <legend>填报头部信息</legend>
          <div class="pd-row">
            <label>填报时间
              <input type="date" name="fillDate" value="${defaultMonth}-${pad2(now.getDate())}" required>
            </label>
            <label>填报单位
              <input type="text" name="fillOrg" value="${esc(project.项目业主 || "")}" required>
            </label>
            <label>联系人
              <input type="text" name="contact" placeholder="姓名">
            </label>
            <label>联系电话
              <input type="tel" name="phone" placeholder="13800000000">
            </label>
          </div>
        </fieldset>

        <fieldset class="pd-fs">
          <legend>本月调度数据</legend>
          <div class="pd-row">
            <label>调度月份
              <input type="month" name="month" value="${defaultMonth}" required>
            </label>
            <label>本月完成投资（亿元）
              <input type="number" name="thisMonthInvest" step="0.01" min="0" placeholder="0.00">
            </label>
            <label>累计完成投资（亿元）
              <input type="number" name="cumInvest" step="0.01" min="0" value="${lastCum.toFixed(2)}">
            </label>
            <label>形象进度节点
              <select name="phase">
                <option value="">— 未变更 —</option>
                ${phaseOpts}
              </select>
            </label>
          </div>
          <label class="pd-block">推进情况简述
            <textarea name="progressNote" rows="3" placeholder="本月主要工作进展、关键会议、合同签订、设备到货等"></textarea>
          </label>
          <label class="pd-block">存在问题及协调事项
            <textarea name="issueNote" rows="3" placeholder="如有需要省发改委、推进组协调的事项，请详细说明"></textarea>
          </label>
        </fieldset>

        <div class="pd-actions">
          <button type="button" class="pd-btn pd-btn-ghost" data-pd-action="cancel">取消</button>
          <button type="button" class="pd-btn pd-btn-secondary" id="pdSaveDraft">保存草稿</button>
          <button type="submit" class="pd-btn pd-btn-primary">提交本月调度</button>
        </div>
      </form>`;
  };

  /**
   * 中试基地项目占位卡片。
   * @param {Object} project
   * @returns {string}
   */
  const renderPilotBasePlaceholder = project => `
    <div class="pd-pilot-placeholder">
      <i class="fa-solid fa-flask-vial" aria-hidden="true"></i>
      <h3>中试基地调度（暂未上线）</h3>
      <p>本项目为「国家人工智能应用中试基地」，调度内容需填写：</p>
      <ul>
        <li><b>附表 1</b>：任务完成情况表（8 类任务：算力、模型、数据、应用验证、行业资源汇聚、标准评测、个性化指标、投资完成）</li>
        <li><b>附表 2</b>：能力与需求清单（动态行、多选 checkbox）</li>
      </ul>
      <p>功能将在 Phase 2 上线。届时附表 1/2 字段、Word 导出将与基地每月调度表格保持一致。</p>
      <p class="pd-pilot-meta">项目：${esc(project.项目名称)}</p>
    </div>`;

  /**
   * 打开抽屉并渲染。
   * @param {string} id 项目序号
   * @returns {void}
   */
  const open = id => {
    const project = findProject(id);
    if (!project) {
      console.warn("[project-drawer] 未找到项目", id);
      return;
    }
    const drawer = document.getElementById("projectDrawer");
    if (drawer) drawer.dataset.projectId = String(id);
    const records = (store.byProjectId[id] || []).slice().sort((a, b) =>
      (b.month || "").localeCompare(a.month || "")
    );
    const body = document.getElementById("pdBody");
    const title = document.getElementById("pdTitle");
    if (title) title.textContent = `项目调度 · ${project.项目名称 || ""}`;
    if (body) {
      body.innerHTML = renderHeader(project, records)
        + `<section class="pd-section"><h3>历史调度记录</h3>${renderHistory(records)}</section>`
        + (isPilotBase(project)
          ? `<section class="pd-section">${renderPilotBasePlaceholder(project)}</section>`
          : `<section class="pd-section"><h3>填报本月调度</h3>${renderForm(project, records)}</section>`);
    }
    const backdrop = document.getElementById("pdBackdrop");
    drawer?.classList.add("open");
    backdrop?.classList.add("open");
    drawer?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  /** @returns {void} */
  const close = () => {
    const drawer = document.getElementById("projectDrawer");
    const backdrop = document.getElementById("pdBackdrop");
    drawer?.classList.remove("open");
    backdrop?.classList.remove("open");
    drawer?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  /**
   * 处理表单提交（保存草稿 / 正式提交）。
   * @param {SubmitEvent|Event} event
   * @param {boolean} [asDraft=false]
   * @returns {void}
   */
  const handleSubmit = (event, asDraft = false) => {
    event.preventDefault();
    const form = event.currentTarget && event.currentTarget.tagName === "FORM"
      ? event.currentTarget
      : (event.target && event.target.closest && event.target.closest("form")) || document.getElementById("pdForm");
    if (!form) return;
    const fd = new FormData(form);
    const id = document.getElementById("projectDrawer")?.dataset?.projectId;
    if (!id) return;
    const month = String(fd.get("month") || "").trim();
    if (!month) {
      alert("请填写调度月份");
      return;
    }
    const record = {
      month,
      thisMonthInvest: fd.get("thisMonthInvest") !== "" ? Number(fd.get("thisMonthInvest")) : null,
      cumInvest: fd.get("cumInvest") !== "" ? Number(fd.get("cumInvest")) : null,
      phase: String(fd.get("phase") || "").trim(),
      progressNote: String(fd.get("progressNote") || "").trim(),
      issueNote: String(fd.get("issueNote") || "").trim(),
      fillDate: String(fd.get("fillDate") || ""),
      fillOrg: String(fd.get("fillOrg") || "").trim(),
      contact: String(fd.get("contact") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      isDraft: asDraft,
      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    };
    const list = (store.byProjectId[id] ??= []);
    list.unshift(record);
    saveStore(store);
    showToast(asDraft ? "草稿已保存" : "本月调度已提交");
    open(id);
  };

  /** @param {string} msg */
  const showToast = msg => {
    const toast = document.getElementById("pdToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
  };

  /**
   * 初始化所有事件绑定。
   * @returns {void}
   */
  const init = () => {
    document.getElementById("pdClose")?.addEventListener("click", close);
    document.getElementById("pdBackdrop")?.addEventListener("click", close);
    // 全局委托：项目表行末"调度"按钮
    document.addEventListener("click", e => {
      const btn = e.target.closest('[data-project-dispatch]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        open(btn.dataset.projectDispatch);
        return;
      }
      const closeBtn = e.target.closest('[data-pd-action="cancel"]');
      if (closeBtn) close();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") close();
    });

    const body = document.getElementById("pdBody");
    body?.addEventListener("click", e => {
      const cancelBtn = e.target.closest('[data-pd-action="cancel"]');
      if (cancelBtn) close();
      const draftBtn = e.target.closest("#pdSaveDraft");
      if (draftBtn) {
        const form = document.getElementById("pdForm");
        if (form) {
          // 直接调用 handleSubmit 并传 form，避免事件流依赖
          handleSubmit({ preventDefault: () => {}, currentTarget: form }, true);
        }
      }
    });
    body?.addEventListener("submit", e => {
      if (e.target && e.target.id === "pdForm") handleSubmit(e, false);
    });

    // 记住当前打开的项目 id
    const drawer = document.getElementById("projectDrawer");
    if (drawer && !drawer.dataset.projectIdBound) {
      drawer.dataset.projectIdBound = "1";
      window.ProjectDrawer = window.ProjectDrawer || {};
      const origOpen = open;
      window.ProjectDrawer.open = id => {
        drawer.dataset.projectId = id;
        origOpen(id);
      };
    }
  };

  // 暴露 API
  window.ProjectDrawer = window.ProjectDrawer || {};
  window.ProjectDrawer.open = id => {
    const drawer = document.getElementById("projectDrawer");
    if (drawer) drawer.dataset.projectId = id;
    open(id);
  };
  window.ProjectDrawer.close = close;
  window.ProjectDrawer.init = init;

  // DOM 就绪后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
