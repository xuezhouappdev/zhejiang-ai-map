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
  const baseData = window.BASE_DISPATCH_DATA || { bases: {}, annualPlanHint: "" };

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

  const BASE_TASK_GROUPS = [
    {
      name: "一、项目建设",
      tasks: [
        "算力服务能力",
        "模型服务能力",
        "数据服务能力",
        "应用验证能力",
        "汇聚行业优势资源",
        "构建行业标准和评测体系",
      ],
    },
    { name: "二、个性化指标", tasks: ["预期成效"] },
    { name: "三、投资完成", tasks: ["国债资金完成率／支付率"] },
  ];

  const BASE_NEED_TYPES = ["数据", "算力", "模型", "场景", "技术人才", "其他"];

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

  const baseCurrentRecord = (records, month) =>
    records.find(r => r.month === month && r.kind === "base") || {};

  const baseMetric = (base, task) =>
    (base.highlights || []).find(item => item.name === task) || null;

  const renderBaseOverview = (project, base) => {
    const highlights = base.highlights || [];
    const averageProgress = highlights.length
      ? Math.round(highlights.reduce((sum, metric) => sum + Number(metric.progress || 0), 0) / highlights.length)
      : 0;
    let html = '<section class="pd-section pd-base-overview-section">';
    html += '<div class="pd-base-section-head"><div><span class="pd-base-kicker">目标测算</span><h3>年度计划完成情况与三年目标完成情况</h3></div>';
    html += '<span class="pd-base-source">综合完成度约 <b data-base-overall-progress>' + averageProgress + '%</b></span></div>';
    html += '<div class="pd-base-overview-cards">';
    html += '<article class="pd-base-overview-card pd-base-card-annual"><span>2026年度计划投资</span><strong>' + esc(fmtYi(project["2026年计划投资"])) + '</strong><small>项目年度投资计划</small></article>';
    html += '<article class="pd-base-overview-card pd-base-card-action pd-base-card-action-wide"><span>三年目标完成情况</span><strong data-base-overall-value>' + averageProgress + '%</strong><div class="pd-base-progress-track"><i data-base-overall-fill style="width:' + averageProgress + '%"></i></div><small>按各项目标当前值与目标值测算</small></article>';
    html += '</div><div class="pd-base-metric-grid">';
    highlights.forEach(metric => {
      const progress = Math.max(0, Math.min(100, Number(metric.progress || 0)));
      html += '<article class="pd-base-metric-card" data-base-metric-card="' + esc(metric.name) + '"><div class="pd-base-metric-title"><b>' + esc(metric.name) + '</b><span data-base-metric-progress>' + progress + '%</span></div>';
      html += '<div class="pd-base-progress-track"><i data-base-metric-fill style="width:' + progress + '%"></i></div>';
      html += '<div class="pd-base-metric-values"><span data-base-metric-current>' + esc(metric.currentDisplay || "当前值待补充") + '</span><span>目标 ' + esc(metric.targetDisplay || "待补充") + '</span></div></article>';
    });
    html += '</div></section>';
    return html;
  };

  const renderBaseTaskCard = (task, project, base, record, index) => {
    const saved = (record.tasks || []).find(item => item.name === task) || {};
    const metric = baseMetric(base, task);
    const metricValue = saved.metricValue != null ? saved.metricValue : "";
    const defaultPlan = task === "国债资金完成率／支付率" && project["2026年计划投资"]
      ? "年度投资计划：" + fmtYi(project["2026年计划投资"]) + "。"
      : "";
    const filled = Boolean(saved.cumulative || saved.nextMonth || saved.issues);
    let html = '<details class="pd-base-task-card" data-base-task="' + esc(task) + '"' + (index === 0 ? " open" : "") + '>';
    html += '<summary><span class="pd-base-task-summary-title"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>' + esc(task) + '</span>';
    html += '<span class="pd-base-task-status ' + (filled ? "is-filled" : "") + '">' + (filled ? "已填报" : "待填报") + '</span></summary>';
    html += '<div class="pd-base-task-content">';
    if (metric) {
      const progress = Math.max(0, Math.min(100, Number(metric.progress || 0)));
      html += '<div class="pd-base-target-meter" data-base-task-meter><div class="pd-base-target-meter-head"><span>目标测算进度</span><b data-base-task-progress>' + progress + '%</b></div>';
      html += '<div class="pd-base-progress-track"><i data-base-task-fill style="width:' + progress + '%"></i></div>';
      html += '<div class="pd-base-metric-values"><span data-base-task-current>' + esc(metric.currentDisplay || "当前值待补充") + '</span><span>目标 ' + esc(metric.targetDisplay || "待补充") + '</span></div></div>';
    } else {
      html += '<div class="pd-base-target-meter pd-base-target-pending"><div class="pd-base-target-meter-head"><span>目标测算进度</span><b>待补录</b></div><p>' + esc(baseData.annualPlanHint || "请依据正式任务书填写") + '</p></div>';
    }
    html += '<div class="pd-base-field-grid">';
    if (metric && metric.targetValue != null) {
      html += '<label class="pd-base-measure-field">当前测算值（' + esc(metric.unit || "项") + '）<input type="number" min="0" step="any" data-base-field="metricValue" value="' + esc(metricValue) + '" placeholder="填写当前值"><small>填写后将实时更新目标进度</small></label>';
    }
    html += '<label>2026年度计划<textarea data-base-field="annualPlan" rows="3" placeholder="请填入国家批复的年度绩效目标和年度任务">' + esc(saved.annualPlan || defaultPlan) + '</textarea></label>';
    html += '<label>累计至本月推进情况<textarea data-base-field="cumulative" rows="3" placeholder="请填写截至本月的累计推进情况">' + esc(saved.cumulative || "") + '</textarea></label>';
    html += '<label>下月计划<textarea data-base-field="nextMonth" rows="3" placeholder="请填写下月重点工作安排">' + esc(saved.nextMonth || "") + '</textarea></label>';
    html += '<label class="pd-base-issue-field">存在问题及协调事项<textarea data-base-field="issues" rows="3" placeholder="如无问题请填写“无”">' + esc(saved.issues || "") + '</textarea></label>';
    html += '</div></div></details>';
    return html;
  };

  const renderBaseNeedRow = (item = {}, index = 0) => {
    const type = item.type === "需求" ? "需求" : "能力";
    const resources = Array.isArray(item.resourceTypes) ? item.resourceTypes : [];
    const shareType = item.shareType || "";
    const connectStatus = item.connectStatus || "待对接";
    let html = '<article class="pd-base-need-row" data-base-need-row>';
    html += '<div class="pd-base-need-row-head"><span>记录 ' + (index + 1) + '</span><button type="button" class="pd-base-icon-btn" data-base-remove-need aria-label="删除记录">删除</button></div>';
    html += '<div class="pd-base-need-grid">';
    html += '<label>类别<select name="needType" data-base-need-type><option value="能力" ' + (type === "能力" ? "selected" : "") + '>能力</option><option value="需求" ' + (type === "需求" ? "selected" : "") + '>需求</option></select></label>';
    html += '<label class="pd-base-need-name">能力／需求名称<input type="text" name="needName" value="' + esc(item.name || "") + '" placeholder="请输入能力或需求名称"></label>';
    html += '<div class="pd-base-need-condition" data-base-ability-fields ' + (type === "需求" ? "hidden" : "") + '><span>共享条件／合作方式</span><div class="pd-base-choice-row">';
    ["免费开放", "商业化合作", "其他"].forEach(option => {
      html += '<label class="pd-base-choice"><input type="radio" name="shareType" value="' + esc(option) + '" ' + (shareType === option ? "checked" : "") + '>' + esc(option) + '</label>';
    });
    html += '</div></div>';
    html += '<div class="pd-base-need-condition" data-base-demand-fields ' + (type === "能力" ? "hidden" : "") + '><span>需求类型</span><div class="pd-base-choice-row">';
    BASE_NEED_TYPES.forEach(option => {
      html += '<label class="pd-base-choice"><input type="checkbox" name="needResource" value="' + esc(option) + '" ' + (resources.includes(option) ? "checked" : "") + '>' + esc(option) + '</label>';
    });
    html += '</div></div>';
    html += '<label>对接状态<select name="connectStatus"><option value="待对接" ' + (connectStatus === "待对接" ? "selected" : "") + '>待对接</option><option value="已对接" ' + (connectStatus === "已对接" ? "selected" : "") + '>已对接</option></select></label>';
    html += '<label class="pd-base-need-note">对接情况<textarea name="connectNote" rows="3" placeholder="填写适合领域、可能供方、对接单位和进展">' + esc(item.connectNote || "") + '</textarea></label>';
    html += '</div></article>';
    return html;
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
        <li>任务完成情况：8 类任务，包含算力、模型、数据、应用验证、行业资源汇聚、标准评测、个性化指标、投资完成</li>
        <li>能力与需求清单：动态记录能力、需求和对接情况</li>
      </ul>
      <p>功能将在 Phase 2 上线。届时字段和 Word 导出将与基地每月调度表格保持一致。</p>
      <p class="pd-pilot-meta">项目：${esc(project.项目名称)}</p>
    </div>`;

  const renderBaseHistory = records => {
    if (!records.length) return '<div class="pd-empty">暂无基地月度调度记录</div>';
    const rows = records.map(record => {
      const tasks = Array.isArray(record.tasks) ? record.tasks : [];
      const filled = tasks.filter(item => item.cumulative || item.nextMonth || item.issues).length;
      const issues = tasks.filter(item => item.issues && item.issues !== "无").length;
      const needs = Array.isArray(record.capabilityNeeds) ? record.capabilityNeeds.filter(item => item.name).length : 0;
      return '<tr><td class="pd-month">' + esc(record.month) + '</td><td>' + (record.isDraft ? "草稿" : "已提交") + '</td><td class="pd-num">' + filled + ' / 8</td><td class="pd-num">' + needs + '</td><td class="pd-num ' + (issues ? "pd-issue" : "") + '">' + issues + '</td><td class="pd-time">' + esc(record.updatedAt || "—") + '</td></tr>';
    }).join("");
    return '<table class="pd-history pd-base-history"><thead><tr><th>月份</th><th>状态</th><th>任务已填</th><th>能力／需求记录</th><th>协调事项</th><th>更新时间</th></tr></thead><tbody>' + rows + '</tbody></table>';
  };

  const renderBaseWorkspace = (project, records) => {
    const base = baseData.bases[String(project.序号)] || {};
    const now = new Date();
    const defaultMonth = now.getFullYear() + "-" + pad2(now.getMonth() + 1);
    const current = baseCurrentRecord(records, defaultMonth);
    const defaultDate = defaultMonth + "-" + pad2(now.getDate());
    const needRows = current.capabilityNeeds && current.capabilityNeeds.length ? current.capabilityNeeds : [{}];
    let taskIndex = 0;
    let html = renderBaseOverview(project, base);
    html += '<section class="pd-section pd-base-form-section"><div class="pd-base-section-head"><div><span class="pd-base-kicker">月度填报</span><h3>本月填报</h3></div><span class="pd-base-source">用户填写项完整保留</span></div>';
    html += '<form class="pd-base-form" id="pdBaseForm">';
    html += '<div class="pd-base-meta-grid">';
    html += '<label>调度月份<input type="month" name="month" value="' + esc(current.month || defaultMonth) + '" required></label>';
    html += '<label>填报时间<input type="date" name="fillDate" value="' + esc(current.fillDate || defaultDate) + '" required></label>';
    html += '<label>填报单位（盖章）<input type="text" name="fillOrg" value="' + esc(current.fillOrg || project.项目业主 || "") + '" required></label>';
    html += '<label>联系人<input type="text" name="contact" value="' + esc(current.contact || "") + '" placeholder="姓名"></label>';
    html += '<label>联系电话<input type="tel" name="phone" value="' + esc(current.phone || "") + '" placeholder="手机或办公电话"></label>';
    html += '</div>';
    html += '<div class="pd-base-tabs" role="tablist"><button type="button" class="pd-base-tab is-active" data-base-tab="tasks" role="tab" aria-selected="true">任务完成情况</button><button type="button" class="pd-base-tab" data-base-tab="needs" role="tab" aria-selected="false">能力与需求</button></div>';
    html += '<div class="pd-base-panel" data-base-panel="tasks">';
    BASE_TASK_GROUPS.forEach(group => {
      html += '<div class="pd-base-task-group"><h4>' + esc(group.name) + '</h4>';
      group.tasks.forEach(task => {
        html += renderBaseTaskCard(task, project, base, current, taskIndex);
        taskIndex += 1;
      });
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="pd-base-panel" data-base-panel="needs" hidden><div class="pd-base-needs-intro"><div><span>动态清单</span><p>保留上月已有记录，只更新发生变化的能力和需求。能力类填写开放方式，需求类填写需求类型。</p></div><button type="button" class="pd-btn pd-btn-secondary" data-base-add-need>＋ 新增能力／需求</button></div>';
    html += '<div id="pdBaseNeedsList">' + needRows.map((item, index) => renderBaseNeedRow(item, index)).join("") + '</div></div>';
    html += '<div class="pd-base-actions"><button type="button" class="pd-btn pd-btn-ghost" data-pd-action="cancel">取消</button><button type="button" class="pd-btn pd-btn-secondary" id="pdBaseSaveDraft">保存草稿</button><button type="submit" class="pd-btn pd-btn-primary">提交本月调度</button></div>';
    html += '</form></section>';
    return html;
  };

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
    if (isPilotBase(project)) {
      if (body) {
        body.innerHTML = renderHeader(project, records)
          + '<section class="pd-section"><h3>历史调度记录</h3>' + renderBaseHistory(records) + '</section>'
          + renderBaseWorkspace(project, records);
        body.scrollTop = 0;
        refreshBaseProgress(body.querySelector("#pdBaseForm"));
      }
      const baseDrawer = document.getElementById("projectDrawer");
      const baseBackdrop = document.getElementById("pdBackdrop");
      baseDrawer?.classList.add("open");
      baseBackdrop?.classList.add("open");
      baseDrawer?.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      return;
    }
    if (body) {
      body.innerHTML = renderHeader(project, records)
        + `<section class="pd-section"><h3>历史调度记录</h3>${renderHistory(records)}</section>`
        + (isPilotBase(project)
          ? `<section class="pd-section">${renderPilotBasePlaceholder(project)}</section>`
          : `<section class="pd-section"><h3>填报本月调度</h3>${renderForm(project, records)}</section>`);
    }
    if (body) body.scrollTop = 0;
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

  const parseFirstNumber = value => {
    const match = String(value || "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  };

  const formatMetricValue = (metric, value) => {
    if (value == null || !Number.isFinite(Number(value))) return metric.currentDisplay || "当前值待补充";
    const number = Number(value);
    const display = Number.isInteger(number) ? String(number) : number.toFixed(2);
    return display + (metric.unit || "");
  };

  const refreshBaseProgress = form => {
    const id = document.getElementById("projectDrawer")?.dataset?.projectId;
    const base = baseData.bases[String(id)] || {};
    const progressValues = [];
    [...form.querySelectorAll("[data-base-task]")].forEach(card => {
      const task = card.dataset.baseTask || "";
      const metric = baseMetric(base, task);
      if (!metric) return;
      let currentValue = metric.currentValue;
      const metricInput = card.querySelector('[data-base-field="metricValue"]');
      const cumulativeText = card.querySelector('[data-base-field="cumulative"]')?.value || "";
      if (metricInput && String(metricInput.value).trim() !== "") {
        currentValue = Number(metricInput.value);
      } else {
        const textValue = parseFirstNumber(cumulativeText);
        if (textValue != null) currentValue = textValue;
      }
      let progress = Number(metric.progress || 0);
      if (metric.targetValue != null && Number.isFinite(Number(currentValue)) && Number(metric.targetValue) > 0) {
        progress = Math.max(0, Math.min(100, Number(currentValue) / Number(metric.targetValue) * 100));
      }
      progress = Math.round(progress);
      progressValues.push(progress);
      const taskProgress = card.querySelector("[data-base-task-progress]");
      const taskFill = card.querySelector("[data-base-task-fill]");
      const taskCurrent = card.querySelector("[data-base-task-current]");
      if (taskProgress) taskProgress.textContent = progress + "%";
      if (taskFill) taskFill.style.width = progress + "%";
      if (taskCurrent) taskCurrent.textContent = formatMetricValue(metric, currentValue);
      const overviewCard = [...document.querySelectorAll("[data-base-metric-card]")].find(item => item.dataset.baseMetricCard === task);
      if (overviewCard) {
        const overviewProgress = overviewCard.querySelector("[data-base-metric-progress]");
        const overviewFill = overviewCard.querySelector("[data-base-metric-fill]");
        const overviewCurrent = overviewCard.querySelector("[data-base-metric-current]");
        if (overviewProgress) overviewProgress.textContent = progress + "%";
        if (overviewFill) overviewFill.style.width = progress + "%";
        if (overviewCurrent) overviewCurrent.textContent = formatMetricValue(metric, currentValue);
      }
    });
    if (progressValues.length) {
      const average = Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length);
      const overallProgress = document.querySelector("[data-base-overall-progress]");
      const overallValue = document.querySelector("[data-base-overall-value]");
      const overallFill = document.querySelector("[data-base-overall-fill]");
      if (overallProgress) overallProgress.textContent = average + "%";
      if (overallValue) overallValue.textContent = average + "%";
      if (overallFill) overallFill.style.width = average + "%";
    }
  };

  const toggleBaseNeedFields = row => {
    const type = row.querySelector('[data-base-need-type]')?.value || "能力";
    const abilityFields = row.querySelector('[data-base-ability-fields]');
    const demandFields = row.querySelector('[data-base-demand-fields]');
    if (abilityFields) abilityFields.hidden = type === "需求";
    if (demandFields) demandFields.hidden = type === "能力";
  };

  const readBaseNeedRows = form => [...form.querySelectorAll("[data-base-need-row]")].map(row => ({
    type: row.querySelector('[name="needType"]')?.value || "能力",
    name: String(row.querySelector('[name="needName"]')?.value || "").trim(),
    shareType: row.querySelector('[name="shareType"]:checked')?.value || "",
    resourceTypes: [...row.querySelectorAll('[name="needResource"]:checked')].map(input => input.value),
    connectStatus: row.querySelector('[name="connectStatus"]')?.value || "待对接",
    connectNote: String(row.querySelector('[name="connectNote"]')?.value || "").trim(),
  }));

  const handleBaseSubmit = (event, asDraft = false) => {
    event.preventDefault();
    const form = event.currentTarget && event.currentTarget.tagName === "FORM"
      ? event.currentTarget
      : document.getElementById("pdBaseForm");
    const id = document.getElementById("projectDrawer")?.dataset?.projectId;
    if (!form || !id) return;
    const fd = new FormData(form);
    const month = String(fd.get("month") || "").trim();
    if (!month) {
      alert("请填写调度月份");
      return;
    }
    const tasks = [...form.querySelectorAll("[data-base-task]")].map(card => {
      const metricInput = card.querySelector('[data-base-field="metricValue"]')?.value || "";
      const cumulative = String(card.querySelector('[data-base-field="cumulative"]')?.value || "").trim();
      return {
        name: card.dataset.baseTask || "",
        metricValue: metricInput ? Number(metricInput) : parseFirstNumber(cumulative),
        annualPlan: String(card.querySelector('[data-base-field="annualPlan"]')?.value || "").trim(),
        cumulative,
        nextMonth: String(card.querySelector('[data-base-field="nextMonth"]')?.value || "").trim(),
        issues: String(card.querySelector('[data-base-field="issues"]')?.value || "").trim(),
      };
    });
    const record = {
      kind: "base",
      month,
      fillDate: String(fd.get("fillDate") || ""),
      fillOrg: String(fd.get("fillOrg") || "").trim(),
      contact: String(fd.get("contact") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      tasks,
      capabilityNeeds: readBaseNeedRows(form).filter(item => item.name || item.connectNote),
      isDraft: asDraft,
      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    };
    const list = (store.byProjectId[id] ??= []);
    const oldIndex = list.findIndex(item => item.kind === "base" && item.month === month);
    if (oldIndex >= 0) list.splice(oldIndex, 1);
    list.unshift(record);
    saveStore(store);
    showToast(asDraft ? "草稿已保存" : "本月调度已提交");
    open(id);
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
      const tabBtn = e.target.closest("[data-base-tab]");
      if (tabBtn) {
        const tab = tabBtn.dataset.baseTab;
        body.querySelectorAll("[data-base-tab]").forEach(btn => {
          const active = btn === tabBtn;
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-selected", active ? "true" : "false");
        });
        body.querySelectorAll("[data-base-panel]").forEach(panel => {
          panel.hidden = panel.dataset.basePanel !== tab;
        });
      }
      const addNeedBtn = e.target.closest("[data-base-add-need]");
      if (addNeedBtn) {
        const list = document.getElementById("pdBaseNeedsList");
        if (list) list.insertAdjacentHTML("beforeend", renderBaseNeedRow({}, list.querySelectorAll("[data-base-need-row]").length));
      }
      const removeNeedBtn = e.target.closest("[data-base-remove-need]");
      if (removeNeedBtn) {
        const rows = body.querySelectorAll("[data-base-need-row]");
        const row = removeNeedBtn.closest("[data-base-need-row]");
        if (row && rows.length > 1) row.remove();
      }
      const draftBtn = e.target.closest("#pdSaveDraft");
      if (draftBtn) {
        const form = document.getElementById("pdForm");
        if (form) {
          // 直接调用 handleSubmit 并传 form，避免事件流依赖
          handleSubmit({ preventDefault: () => {}, currentTarget: form }, true);
        }
      }
      const baseDraftBtn = e.target.closest("#pdBaseSaveDraft");
      if (baseDraftBtn) {
        const form = document.getElementById("pdBaseForm");
        if (form) handleBaseSubmit({ preventDefault: () => {}, currentTarget: form }, true);
      }
    });
    body?.addEventListener("change", e => {
      const typeSelect = e.target.closest("[data-base-need-type]");
      if (typeSelect) toggleBaseNeedFields(typeSelect.closest("[data-base-need-row]"));
      const baseForm = e.target.closest("#pdBaseForm");
      if (baseForm) refreshBaseProgress(baseForm);
    });
    body?.addEventListener("input", e => {
      const baseForm = e.target.closest("#pdBaseForm");
      if (baseForm) refreshBaseProgress(baseForm);
    });
    body?.addEventListener("submit", e => {
      if (e.target && e.target.id === "pdBaseForm") handleBaseSubmit(e, false);
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
