/**
 * @file ticker.js  当日资讯滚动条
 * @description
 *   首页底部的无缝横向滚动资讯条。读取 window.NEWS_DATA，复制双份接龙实现无缝循环。
 *   依赖：utils.js（esc）。
 */

(function () {
  "use strict";

  const { esc } = window.RenderUtils;
  const { NEWS_DATA } = window.__constants;
  const TICKER_SPEED_PX_PER_SECOND = 97;

  /**
   * 根据单份资讯内容宽度计算动画时长，确保不同页面的实际像素速度一致。
   * @param {HTMLElement|null} track
   * @returns {void}
   */
  const syncTickerSpeed = track => {
    if (!track) return;
    requestAnimationFrame(() => {
      const loopWidth = track.scrollWidth / 2;
      if (!loopWidth) return;
      const duration = loopWidth / TICKER_SPEED_PX_PER_SECOND;
      track.style.setProperty("--ticker-duration", `${duration.toFixed(2)}s`);
    });
  };

  /**
   * 将整条资讯栏绑定为资讯库入口，并补齐键盘操作。
   * @param {HTMLElement|null} ticker
   * @returns {void}
   */
  const bindTickerLink = ticker => {
    const href = ticker?.dataset.href;
    if (!ticker || !href) return;
    const navigate = () => { location.href = href; };
    ticker.addEventListener("click", navigate);
    ticker.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      navigate();
    });
  };

  /**
   * 初始化滚动条：日期 + 文本接龙。
   * @returns {void}
   */
  const initTicker = () => {
    const track = document.getElementById("tickerTrack");
    const dateEl = document.getElementById("tickerDate");
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
      });
    }
    if (track && Array.isArray(NEWS_DATA.items) && NEWS_DATA.items.length) {
      const items = NEWS_DATA.items
        .map(n => `<span class="ticker-item">${esc(n.title || n)}</span>`)
        .join('<span class="ticker-sep">｜</span>');
      track.innerHTML = items + '<span class="ticker-sep">｜</span>' + items;
    } else if (track && Array.isArray(NEWS_DATA)) {
      // 兼容 NEWS_DATA 直接是字符串数组的旧形态
      const items = NEWS_DATA
        .map(n => `<span class="ticker-item">${esc(n)}</span>`)
        .join('<span class="ticker-sep">｜</span>');
      track.innerHTML = items + '<span class="ticker-sep">｜</span>' + items;
    }
    syncTickerSpeed(track);
    bindTickerLink(document.querySelector(".news-ticker"));
  };

  window.Ticker = { initTicker };
})();
