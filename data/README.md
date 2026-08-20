# `app/data/` 数据目录说明

本目录存放图谱的全部静态数据，采用 **JSON + JS 双轨约定**：每份数据同时存在两份，**字节级一致**。

---

## 📂 文件清单

| 序号 | 真源（JSON） | 副本（JS） | 用途 |
|---|---|---|---|
| 1 | `goals.json` | `goals.js` | 发展目标 |
| 2 | `mechanism.json` | `mechanism.js` | 推进机制 |
| 3 | `news.json` | `news.js` | 新闻动态 |
| 4 | `policies.json` | `policies.js` | 政策清单 |
| 5 | `projects.json` | `projects.js` | 项目清单 |
| 6 | `rail.json` | `rail.js` | 轨道/栏位 |
| 7 | `scenes.json` | `scenes.js` | 应用场景 |
| 8 | `tasks.json` | `tasks.js` | 重点任务 |
| 9 | `experts.json` | `experts.js` | 专家委员会名单 |
| 10 | `objects.json` | `objects.js` | 目标体系分维度 |

辅助文件：

| 文件 | 说明 |
|---|---|
| `sync.py` | 一键同步脚本（只可改 JSON，脚本自动重写对应 `.js`） |
| `map.svg` | 图谱底层 SVG 图形（手维护） |

---

## 🔁 双轨同步约定

### 哪份是真源？

**.json 永远是源，.js 是派生副本。**

- 浏览器可直接加载 `.js`（`<script src="...">` 拿到 `var XXX = {...}`）
- `.js` 文件可读性比 `.json` 差
- 因此**所有人工维护动作只能在 `.json` 上进行**，再跑 `sync.py` 生成 `.js`

### 为什么搞两套？

- 早期图谱用纯 HTML + 内联数据上线，`<script>` 注入数据比 `fetch().json()` 简单，没有异步、不需要起本地 server
- 改成纯 `.json` 后，CI/CD 与人工对比数据时不必依赖浏览器，`.json` 可直接 `jq`、`diff`、Excel 打开
- 双轨制保证两种场景都能跑：直接双击 `index.html` 看（用 `.js`），或本地起 server（用 `.json`）

### 维护流程（硬规矩）

```
改 X.json → cd app/data && python3 sync.py → 改完即同步
```

任何时候：

- ❌ 禁止直接编辑 `.js`（会被下次 `sync.py` 覆盖）
- ✅ 必须改 `.json` 然后跑 `sync.py`

---

## 🛠 sync.py 用法

### 命令

```bash
cd app/data
python3 sync.py                        # 同步全部 8 对
python3 sync.py tasks.json             # 同步单文件
python3 sync.py tasks.json scenes.json # 同步多文件
```

### 输出解读

```
[OK] goals.json → goals.js (1342 bytes)
[OK] mechanism.json → mechanism.js   (267 bytes)
...
=== 8/8 一致 ===      # 全部相同，无更新
```

或：

```
[CHANGED] tasks.json → tasks.js   (从 66628 → 66715 bytes)
...
=== 7 一致 / 1 已更新 ===
```

### 什么时候跑？

- 改完任一 `.json` 之后立刻跑（手动触发）
- 准备 `git commit` 之前（pre-commit hook 会自动跑，跑不通则拦下提交）

---

## 📋 命名规范

| 规则 | 约束 |
|---|---|
| 顶层变量名 | `.json` 顶层 key → `.js` 顶层变量（驼峰 + `_DATA` 后缀） |
| 例外 | `projects.json` 顶层是数组 → `PROJECTS_DATA`（不是 `PROJECTS`） |
| 例外 | 历史 `goals.js` 用 `goalsData`（驼峰无 `_DATA`），已冻结，新文件不准这样命名 |
| 文件大小写 | 全小写 + 连字符 |
| 编码 | UTF-8（无 BOM） |
| 缩进 | JSON 用 2 空格 |
| 尾换行 | `.json` 必须有 1 个 `\n` 结尾（`sync.py` 会校验） |

---

## 🚨 故障排查

### Q: `git commit` 时被 pre-commit 拦下，提示 "JSON 与 JS 不一致"

```bash
cd app/data
python3 sync.py       # 自动重写全部不一致的 .js
git add -A
git commit -m "..."
```

### Q: `sync.py` 报错 "不是合法 JSON"

- 检查最近修改的 `.json`，多半是末尾少了逗号或多了逗号
- 用 `python3 -m json.tool < X.json` 验证

### Q: 浏览器看到的还是旧数据

- 浏览器缓存了 `.js`：强制刷新（Cmd+Shift+R / Ctrl+Shift+F5）
- 或打开 DevTools → Network → Disable cache

---

## 🔗 pre-commit 自动检查

本仓库在 `.git/hooks/pre-commit` 装了自动校验钩子：

```
git commit → pre-commit → python3 sync.py →  ├─ 全部一致 → 放行
                                              └─ 有差异   → 报错、打印 sync.py 输出、exit 1、拦下提交
```

**改了 `.json` 不跑 sync 就 commit，会被直接拒绝。**

跳过校验（不推荐）：`git commit --no-verify -m "..."`
