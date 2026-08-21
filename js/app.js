/**
 * @file app.js  总入口调度器
 * @description
 *   原 render.js 末尾的 DOMContentLoaded 监听器，拆模块后单独成文件。
 *   根据 body 上的 data-list-page / class 决定调用哪些模块。
 *
 *   加载顺序（以 index.html 为例）：
 *     data/*.js → js/state.js → js/utils.js → js/home.js → js/drawer.js → js/ticker.js → js/app.js
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    const section = document.body.dataset.listPage;

    // 首页 + 任务页：先加载任务数据，再渲染各板块（仅当 home.js 已加载时执行）
    if (window.Home) {
      await window.Home.loadData();
      window.Home.buildOrgFlow();
      window.Home.buildGoals();
      window.Home.buildMatrix();
      window.Home.buildRails();
      window.Home.buildMechanism();
    }

    // 任务抽屉：仅总图（首页）和任务页启用
    if (window.Drawer) {
      if (!section) window.Drawer.initDrawer();
      window.Drawer.buildTaskColumnPicker();
    }

    // 资讯滚动条：所有页都启用（首页、任务页、列表页都有 #tickerTrack）
    if (window.Ticker) window.Ticker.initTicker();

    // 任务页特殊处理：默认打开抽屉
    if (document.body.classList.contains("task-page") && window.Drawer) {
      window.Drawer.openDrawer("all");
    }

    // 列表页
    if (section && window.ListPage && window.ListPage.PAGE_CONFIG[section]) {
      window.ListPage.initListPage(section);
    }
  });
})();