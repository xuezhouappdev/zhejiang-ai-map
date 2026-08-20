#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
data/sync.py
============

把 app/data/*.json 同步生成对应的 *.js 包装文件。

用途
----
本项目的数据采用 .json + .js 双轨制：
  * .json 是人编辑的真源（Git diff 友好、JSON Schema 可校验）
  * .js 是 <script src> 用的运行时容器，避免 file:// 下 fetch() 的 CORS 限制

调用方式
--------
  $ python3 app/data/sync.py              # 同步全部
  $ python3 app/data/sync.py goals tasks  # 仅同步指定几个

约定
----
  * 命名：goals.json -> window.GOALS_DATA（大写 + _DATA 后缀）
  * 头部注释：与既有 *.js 保持完全一致（git blame 不变）
  * 行为：仅当 JSON 内容变化时才写 .js；否则保持文件 mtime 不动
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
HEADER_TEMPLATE = "// 由 {name}.json 同步生成，支持 file:// 本地直接打开。\n"


def json_to_js_global(name: str, payload: object) -> str:
    """生成 'window.<NAME>_DATA = <pretty JSON>;\\n' 字符串。"""
    global_name = re.sub(r"[^A-Za-z0-9]", "_", name).upper() + "_DATA"
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    return HEADER_TEMPLATE.format(name=name) + f"window.{global_name} = {body};\n"


def sync_one(json_path: Path) -> tuple[str, str]:
    """同步一个 .json -> .js。返回 (json_name, status)。"""
    name = json_path.stem
    js_path = json_path.with_suffix(".js")

    try:
        payload = json.loads(json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return name, f"❌ JSON 解析失败：{e}"

    new_content = json_to_js_global(name, payload)

    if js_path.exists() and js_path.read_text(encoding="utf-8") == new_content:
        return name, "⏭️  内容未变，跳过"

    js_path.write_text(new_content, encoding="utf-8")
    return name, "✅ 已更新"


def main(argv: list[str]) -> int:
    if not DATA_DIR.exists():
        print(f"[!] 数据目录不存在：{DATA_DIR}", file=sys.stderr)
        return 1

    targets: list[Path]
    if len(argv) > 1:
        # 用户指定了名字，只同步这几个
        targets = []
        for arg in argv[1:]:
            stem = arg.removesuffix(".json")
            p = DATA_DIR / f"{stem}.json"
            if not p.exists():
                print(f"[!] 找不到 {p}", file=sys.stderr)
                return 2
            targets.append(p)
    else:
        targets = sorted(DATA_DIR.glob("*.json"))

    if not targets:
        print("[!] 没有可同步的 .json", file=sys.stderr)
        return 1

    print(f"📦 数据目录：{DATA_DIR}")
    print(f"🔄 待同步 {len(targets)} 个文件\n")

    failed = 0
    for p in targets:
        name, status = sync_one(p)
        print(f"  {name:<14} {status}")
        if status.startswith("❌"):
            failed += 1

    print()
    if failed:
        print(f"⚠️  完成，{failed} 个失败")
        return 1
    print("🎉 全部完成")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
