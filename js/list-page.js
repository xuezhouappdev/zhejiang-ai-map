/**
 * @file list-page.js  通用列表页引擎
 * @description
 *   承载 policies / projects / experts / scenes 四个列表页。
 *   每个页面用 <body data-list-page="policies|projects|experts|scenes"> 标识。
 *   依赖：state.js（constants.PAGE_CONFIG / SCENE_CITY_ORDER）、utils.js。
 */

(function () {
  "use strict";

  const { esc, valueAsText } = window.RenderUtils;
  const { SCENE_CITY_ORDER } = window.__constants;

  /**
   * @typedef {Object} ListColumn
   * @property {string} key         字段名
   * @property {string} label       表头文案
   * @property {string} width       CSS grid-template-columns 值
   * @property {boolean} [sortable]
   * @property {boolean} [number]
   * @property {boolean} [renumber]
   * @property {"year"|"scene-location"} [sortType]
   */

  /**
   * @typedef {Object} FilterField
   * @property {string} id          DOM 元素 id
   * @property {string} key         数据字段名
   * @property {string} label
   * @property {"auto"|string[]} options
   * @property {(item:Object)=>any} [getValue]     自定义取值（用于归一）
   * @property {string[]} [excludeFromOptions]      下拉里要排除的选项
   * @property {(a:string,b:string)=>number} [compareValues]  下拉排序
   */

  /**
   * @typedef {Object} PageConfig
   * @property {string} dataKey               window 全局数据 key
   * @property {string} pageTitle
   * @property {string} listTitle
   * @property {string} listHeadTitle
   * @property {boolean} apiMode
   * @property {string} [apiDataPath]         当 apiMode=true 时从 dataKey[apiDataPath] 取数据
   * @property {ListColumn[]} columns
   * @property {FilterField[]} [filterFields]
   * @property {string[]} [searchFields]
   * @property {{key:string, direction:1|-1}} [defaultSort]
   * @property {boolean} [renumber]
   */

  /**
   * 四类列表页的统一配置。
   * @type {Record<string, PageConfig>}
   */
  const PAGE_CONFIG = {
    policies: {
      dataKey: "POLICIES_DATA",
      pageTitle: "重点任务",
      listTitle: "政策体系",
      listHeadTitle: "重点任务",
      apiMode: false,
      columns: [
        { key: "id",         label: "编号",   width: "70px" },
        { key: "name",       label: "政策名称", width: "minmax(280px,2fr)" },
        { key: "category",   label: "所属领域", width: "minmax(100px,.8fr)" },
        { key: "issuer",     label: "发文层级", width: "minmax(80px,.65fr)" },
        { key: "department", label: "责任部门", width: "minmax(160px,1.1fr)" },
        { key: "date",       label: "发文时间", width: "minmax(100px,.75fr)" },
      ],
      filterFields: [
        { id: "listCategoryFilter", key: "category", label: "所属领域", options: "auto" },
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
        { key: "序号",             label: "序号",   width: "50px" },
        { key: "项目名称",          label: "项目名称", width: "minmax(180px,2.2fr)" },
        { key: "大类",             label: "所属领域", width: "66px" },
        { key: "领域",             label: "细分赛道", width: "minmax(105px,1fr)" },
        { key: "建设地点",          label: "地点",   width: "70px" },
        { key: "起止年限",          label: "年限",   width: "76px", sortable: true, sortType: "year" },
        { key: "总投资",           label: "总投资（亿元）", width: "78px", number: true, sortable: true },
        { key: "2026年计划投资",    label: "2026计划（亿元）", width: "90px", number: true, sortable: true },
        { key: "项目业主",          label: "项目业主", width: "minmax(140px,1.2fr)" },
        { key: "建设性质",          label: "性质",   width: "60px" },
      ],
      filterFields: [
        { id: "listCategoryFilter", key: "大类", label: "所属领域", options: "auto" },
        { id: "listLocationFilter", key: "建设地点", label: "地点", options: "auto" },
        { id: "listNatureFilter", key: "建设性质", label: "性质", options: "auto" },
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
        { key: "序号",            label: "序号",         width: "55px" },
        { key: "姓名",            label: "姓名",         width: "minmax(90px,.7fr)" },
        { key: "所属领域",         label: "所属领域",     width: "minmax(150px,1fr)" },
        { key: "原委员会职务",     label: "原委员会职务", width: "minmax(120px,.9fr)" },
        { key: "职务",            label: "职务",         width: "minmax(360px,3fr)" },
        { key: "备注",            label: "备注",         width: "minmax(220px,1.5fr)" },
      ],
      filterFields: [
        { id: "listExpertDomainFilter", key: "所属领域", label: "所属领域", options: "auto" },
      ],
      searchFields: ["姓名", "所属领域", "职务", "备注"],
    },
    scenes: {
      dataKey: "SCENES_DATA",
      pageTitle: "应用场景",
      listTitle: "应用场景",
      listHeadTitle: "应用场景",
      apiMode: true,
      apiDataPath: "items",
      columns: [
        { key: "序号",      label: "序号",     width: "55px" },
        { key: "场景名称",   label: "场景名称",   width: "minmax(220px,1.8fr)" },
        { key: "场景领域",   label: "场景领域",   width: "minmax(180px,1.3fr)", getValue: item => item.category?.main || "" },
        { key: "所在地点",   label: "地点",     width: "minmax(75px,.6fr)", sortType: "scene-location", sortable: true, getValue: normalizeSceneLocation },
        { key: "业主单位",   label: "业主单位",   width: "minmax(160px,1.1fr)" },
        { key: "主管部门",   label: "主管部门",   width: "minmax(150px,1fr)" },
      ],
      filterFields: [
        { id: "listSceneFieldFilter", key: "场景领域", label: "场景领域", options: "auto", getValue: item => item.category?.main || "",
          compareValues: (a, b) => {
            const order = ["产业升级","民生服务","社会治理","科技创新","跨界融合","国际合作","其他"];
            return order.indexOf(a) - order.indexOf(b);
          } },
        { id: "listLocationFilter", key: "所在地点", label: "地点", options: "auto", getValue: normalizeSceneLocation, excludeFromOptions: ["未识别"],
          compareValues: (a, b) => sceneLocationRank(a) - sceneLocationRank(b) },
      ],
      defaultSort: { key: "所在地点", direction: 1 },
      renumber: true,
      searchFields: ["场景名称", "业主单位", "所在地点", "主管部门", "场景说明"],
    },
  };

  /**
   * 规范化场景地点："浙江省" / 11 个地级市 / "未识别"。
   * @param {string} raw
   * @returns {string}
   */
  function normalizeSceneLocation(raw) {
    const text = String(raw || "").replace(/\s+/g, "");
    if (!text) return "未识别";
    if (text === "省级" || text === "浙江省级" || /^浙江省(?!.*?(杭州|宁波|温州|嘉兴|湖州|绍兴|金华|衢州|舟山|台州|丽水))/.test(text) || text.includes("全省")) return "浙江省";
    for (const city of SCENE_CITY_ORDER) {
      if (city.aliases.some(alias => text.includes(alias))) return city.name;
    }
    if (text === "开发区") return "金华市";
    return "未识别";
  }

  /**
   * 场景地点排序：浙江省→11 地级市按 SCENE_CITY_ORDER→未识别。
   * @param {string} value  应为 normalizeSceneLocation 的返回值
   * @returns {number}
   */
  function sceneLocationRank(value) {
    const text = String(value || "");
    if (text === "浙江省") return 0;
    const idx = SCENE_CITY_ORDER.findIndex(c => c.name === text);
    if (idx >= 0) return idx + 1;
    return SCENE_CITY_ORDER.length + 1;
  }

  /**
   * 初始化列表页。
   * @param {"policies"|"projects"|"experts"|"scenes"} section
   * @returns {void}
   */
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
      direction: cfg.defaultSort?.direction || 1,
    };

    /**
     * 列排序键值转换。
     * @param {Object} item
     * @param {ListColumn} column
     * @returns {string|number}
     */
    const sortValue = (item, column) => {
      const value = (typeof column.getValue === "function" ? column.getValue(item) : item[column.key]) ?? "";
      if (column.sortType === "scene-location") return sceneLocationRank(value);
      if (column.sortType === "year") {
        const year = String(value).match(/\d{4}/);
        return year ? Number(year[0]) : null;
      }
      if (typeof value === "number") return value;
      const numeric = Number(value);
      return value !== "" && Number.isFinite(numeric) ? numeric : String(value);
    };

    /**
     * 行比较器。
     * @param {Object} a
     * @param {Object} b
     * @param {ListColumn} column
     * @returns {number}
     */
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
            const v = typeof field.getValue === "function" ? field.getValue(item) : item[field.key];
            return Array.isArray(v) ? v : [v];
          }).filter(Boolean))]
          : field.options || [];
        const filteredOptions = (field.excludeFromOptions && field.excludeFromOptions.length)
          ? options.filter(o => !field.excludeFromOptions.includes(o))
          : options;
        const sortOptions = field.options === "auto"
          ? [...filteredOptions].sort((a, b) => {
              if (typeof field.compareValues === "function") return field.compareValues(a, b);
              return 0;
            })
          : filteredOptions;
        return `<select id="${field.id}" aria-label="筛选${field.label}">
          <option value="">全部${field.label}</option>
          ${sortOptions.map(opt => `<option value="${esc(opt)}">${esc(opt)}</option>`).join("")}
        </select>`;
      }).join("");
      html += `<input id="listSearch" placeholder="搜索${esc(cfg.listTitle)}" aria-label="搜索">`;
      filtersEl.innerHTML = html;
    }

    const rowsEl = document.getElementById("listRows");
    const headEl = document.getElementById("listHead");
    const bodyEl = document.querySelector(".list-body");

    /**
     * 渲染当前筛选+排序后的表格。
     * @returns {void}
     */
    const render = () => {
      const q = (document.getElementById("listSearch")?.value || "").trim().toLowerCase();

      const filtered = rawItems.filter(item => {
        for (const field of filterFields) {
          const value = document.getElementById(field.id)?.value || "";
          const itemValue = typeof field.getValue === "function" ? field.getValue(item) : item[field.key];
          const matches = Array.isArray(itemValue) ? itemValue.includes(value) : itemValue === value;
          if (value && !matches) return false;
        }
        if (q) {
          const text = (cfg.searchFields || []).map(f => valueAsText(item[f])).join(" ");
          if (text.toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
      });

      if (sortState.key) {
        const column = cfg.columns.find(c => c.key === sortState.key);
        if (column) filtered.sort((a, b) => compareItems(a, b, column));
      }

      const actionColumn = section === "projects"
        ? { key: "__dispatch", label: "项目进展", width: "110px" }
        : null;
      const displayColumns = actionColumn ? [...cfg.columns, actionColumn] : cfg.columns;
      const colWidths = displayColumns.map(c => c.width).join(" ");

      // 同时在 .list-body 和表头行上设置 grid 列宽（两处都设保证兼容）
      if (bodyEl) bodyEl.style.setProperty("--task-grid-columns", colWidths);
      if (headEl) {
        headEl.style.gridTemplateColumns = colWidths;
        headEl.innerHTML = displayColumns.map(c => {
          const sortable = c.sortable;
          const indicator = sortState.key === c.key ? (sortState.direction === 1 ? "▲" : "▼") : "↕";
          const attrs = c.key === "__dispatch"
            ? ` class="list-head-action"`
            : sortable
              ? ` class="list-sortable" data-sort-key="${esc(c.key)}" role="button" tabindex="0" aria-label="按${esc(c.label)}排序"`
              : "";
          return `<div${attrs}>${c.label.replace(/\n/g, "<br>")}${sortable ? `<span class="sort-indicator">${indicator}</span>` : ""}</div>`;
        }).join("");
      }
      if (!rowsEl) return;
      rowsEl.style.gridTemplateColumns = "minmax(0, 1fr)";

      rowsEl.innerHTML = filtered.length
        ? filtered.map((item, idx) => {
          const cells = cfg.columns.map(c => {
            let val = (typeof c.getValue === "function" ? c.getValue(item) : item[c.key]) ?? "";
            if (c.number && typeof val === "number") val = val.toFixed(2);
            if (c.key === "序号") val = cfg.renumber ? idx + 1 : (typeof val === "number" ? val : idx + 1);
            const label = val == null ? "—" : esc(valueAsText(val)).replace(/\n/g, "<br>");
            const isTitleCell = c.key === cfg.columns[1].key;
            const cls = isTitleCell ? "row-title" : "";
            const pdfBadge = isTitleCell && section === "policies" && item.pdfUrl
              ? `<i class="fa-solid fa-file-pdf list-row-pdf" aria-hidden="true" title="本政策有 PDF 文件"></i>`
              : "";
            return `<div class="${cls}">${label}${pdfBadge}</div>`;
          }).join("");
          const actionCell = section === "projects"
            ? `<div class="row-action"><button type="button" class="row-action-btn" data-project-dispatch="${esc(item.序号)}" aria-label="查看此项目进展">项目进展</button></div>`
            : "";
          const detailHref = section === "policies" && item.id != null
            ? `policy-detail.html?id=${encodeURIComponent(item.id)}`
            : "";
          const attrs = detailHref
            ? ` data-detail-href="${detailHref}" tabindex="0" role="link" aria-label="查看${esc(item.name || "详情")}"`
            : "";
          return `<article class="list-row"${attrs}>
            <div class="list-summary">${cells}${actionCell}</div>
          </article>`;
        }).join("")
        : '<div class="list-empty">没有符合条件的记录</div>';
    };

    filterFields.forEach(field => document.getElementById(field.id)?.addEventListener("change", render));
    document.getElementById("listSearch")?.addEventListener("input", render);

    // 行点击/键盘事件（仅 policies 详情）
    if (rowsEl && !rowsEl.dataset.detailBound) {
      rowsEl.dataset.detailBound = "1";
      rowsEl.addEventListener("click", event => {
        const row = event.target.closest(".list-row[data-detail-href]");
        if (!row) return;
        const href = row.dataset.detailHref;
        if (href) window.location.href = href;
      });
      rowsEl.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const row = event.target.closest(".list-row[data-detail-href]");
        if (!row) return;
        event.preventDefault();
        const href = row.dataset.detailHref;
        if (href) window.location.href = href;
      });
    }

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

    render();
  }

  window.ListPage = { initListPage, PAGE_CONFIG };
})();
