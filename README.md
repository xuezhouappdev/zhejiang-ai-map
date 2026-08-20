# 浙江省人工智能高质量发展工作推进图谱

## 项目说明

本项目为浙江省人工智能高质量发展工作推进图谱的静态 Web 版本，采用纯前端技术栈，无需构建工具，双击 `index.html` 即可在浏览器中打开。

## 目录结构

```
浙江省人工智能产业链图谱/
├── app/                  # 工程化版本（本次重构）
│   ├── index.html        # 总图入口页
│   ├── tasks.html        # 重点任务清单页（支持筛选/搜索）
│   ├── data/
│   │   ├── tasks.json   # 任务清单数据（113 条）
│   │   ├── goals.json   # 1+5 目标体系
│   │   ├── rail.json    # 工作体系/评价体系
│   │   └── map.svg      # 浙江省 11 地市地图
│   ├── styles/
│   │   ├── tokens.css   # CSS 主题变量
│   │   └── layout.css   # 页面布局与组件样式
│   ├── js/
│   │   └── render.js    # 总图渲染引擎
│   └── tools/
│       └── deploy.sh     # 阿里云 OSS 一键部署脚本
├── 图谱/                  # 原始版本（保留备份）
└── 前期材料/              # 原始汇报材料
```

## 快速开始

**本地预览**
```bash
# 方法一：直接双击 app/index.html

# 方法二：用本地服务器（推荐）
cd app
python3 -m http.server 8080
# 访问 http://localhost:8080/index.html
```

**修改数据**
- 任务清单：编辑 `data/tasks.json`
- 目标体系：编辑 `data/goals.json`
- 侧边栏体系：编辑 `data/rail.json`
- 地图：替换 `data/map.svg`（SVG 格式）

**修改样式**
- 主题色：编辑 `styles/tokens.css` 中的 `:root` 变量
- 布局/组件：编辑 `styles/layout.css`

**部署到阿里云 OSS**
```bash
cd app
bash tools/deploy.sh
```

## 功能说明

| 页面 | 功能 |
|------|------|
| `index.html` | 总图展示，点击矩阵单元格可打开任务抽屉，点击任务可填报月度进展 |
| `tasks.html` | 独立任务清单页，支持按维度/责任单位/时间节点筛选，支持搜索 |

## 扩展指南

**新增页面**
1. 复制 `tasks.html` 作为模板
2. 按需修改样式和交互
3. 数据统一从 `data/tasks.json` 读取

**地图扩展**
当前 `data/map.svg` 为静态展示图。后续可替换为交互地图（GeoJSON + ECharts/Leaflet 等）。

**月度进展持久化**
当前使用 `localStorage` 存储，刷新不丢失。如需多人协同，需接入后端 API。

## 技术栈

- 纯 HTML5 + CSS3 + Vanilla JavaScript
- 无框架、无构建工具
- 数据格式：JSON
- 浏览器兼容性：Chrome/Firefox/Safari/Edge 最新版
