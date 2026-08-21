/**
 * @file utils.js  纯函数工具集
 * @description
 *   没有任何副作用、可独立测试的工具函数。所有业务模块依赖此处的工具。
 *   依赖：state.js（仅类型）
 */

(function () {
  "use strict";

  const HTML_ESCAPE_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  /**
   * 转义 HTML 特殊字符，防止 XSS。
   * @param {*} s
   * @returns {string}
   */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => HTML_ESCAPE_MAP[ch]);

  /**
   * 把单元格值规范成可渲染字符串。
   *   - null/undefined → ""
   *   - 数字 → 原样字符串
   *   - 数组 → 用"、"连接
   *   - 其他 → 原值字符串
   * @param {*} value
   * @returns {string}
   */
  const valueAsText = value => {
    if (value == null) return "";
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(valueAsText).filter(Boolean).join("、");
    return String(value);
  };

  /**
   * 把按"；"分隔的字段拆成数组，去空。
   * @param {string} value
   * @returns {string[]}
   */
  const splitField = value => String(value || "")
    .split("；")
    .map(item => item.trim())
    .filter(Boolean);

  /**
   * 按维度过滤政策。
   * @param {Array<Object>} policies
   * @param {string} dimension
   * @returns {Array<Object>}
   */
  const policiesByDim = (policies, dimension) => {
    if (!dimension || dimension === "all") return policies;
    return policies.filter(p => p.category === dimension);
  };

  /**
   * 数字补零到两位。
   * @param {number} n
   * @returns {string}
   */
  const pad2 = n => String(n).padStart(2, "0");

  /**
   * 格式化日期时间为 "YYYY-MM-DD HH:mm:ss"。本项目用于文件命名。
   * @param {Date} [date]
   * @returns {string}
   */
  const formatTimestamp = (date = new Date()) => {
    const y = date.getFullYear();
    const m = pad2(date.getMonth() + 1);
    const d = pad2(date.getDate());
    const h = pad2(date.getHours());
    const mi = pad2(date.getMinutes());
    const s = pad2(date.getSeconds());
    return `${y}${m}${d}_${h}${mi}${s}`;
  };

  /**
   * 简单 debounce。
   * @template {(...args: any[]) => void} F
   * @param {F} fn
   * @param {number} ms
   * @returns {F}
   */
  const debounce = (fn, ms) => {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  };

  window.RenderUtils = {
    esc,
    valueAsText,
    splitField,
    policiesByDim,
    pad2,
    formatTimestamp,
    debounce,
  };
})();