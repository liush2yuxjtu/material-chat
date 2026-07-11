#!/usr/bin/env python3
"""解析 Playwright JSON 报告，生成 PR 评论用的 Markdown 摘要 + GitHub Step Summary。"""

import json, os, sys, glob
from pathlib import Path

RESULTS_JSON = "test-results/test-results.json"
SCREENSHOT_DIR = "test-results/artifacts"
OUTPUT_MD = os.environ.get("GITHUB_STEP_SUMMARY", "")
COMMENT_FILE = "uat-comment.md"

PAGES_BASE = os.environ.get("PAGES_BASE", "")
RUN_ID = os.environ.get("GITHUB_RUN_ID", "")
REPO = os.environ.get("GITHUB_REPOSITORY", "")
SERVER_URL = os.environ.get("GITHUB_SERVER_URL", "https://github.com")

STATUS_EMOJI = {
    "passed": "✅",
    "failed": "❌",
    "skipped": "⏭️",
    "timedOut": "⏱️",
}

def load_results():
    if not os.path.exists(RESULTS_JSON):
        return None
    with open(RESULTS_JSON) as f:
        return json.load(f)

def collect_screenshots():
    """收集所有截图，返回 {test_title: [screenshot_paths]}"""
    shots = {}
    for png in sorted(glob.glob(f"{SCREENSHOT_DIR}/**/*.png", recursive=True)):
        name = Path(png).stem
        shots.setdefault(name, []).append(png)
    return shots

def find_failure_screenshots(suites):
    """根据失败的 spec 标题匹配截图"""
    failed_titles = set()
    for suite in suites:
        for spec in suite.get("specs", []):
            for test in spec.get("tests", []):
                for result in test.get("results", []):
                    if result.get("status") == "failed":
                        failed_titles.add(test.get("title", ""))
    return failed_titles

def parse_suites(data):
    if not data:
        return [], 0, 0, 0, 0
    suites = data.get("suites", [])
    rows = []
    total = passed = failed = skipped = 0
    for suite in suites:
        suite_name = suite.get("title", "root")
        for spec in suite.get("specs", []):
            spec_title = spec.get("title", "")
            for test in spec.get("tests", []):
                total += 1
                for result in test.get("results", []):
                    status = result.get("status", "unknown")
                    duration = result.get("duration", 0)
                    if status == "passed": passed += 1
                    elif status == "failed": failed += 1
                    elif status == "skipped": skipped += 1
                    emoji = STATUS_EMOJI.get(status, "❓")
                    rows.append({
                        "suite": suite_name,
                        "spec": spec_title,
                        "test": test.get("title", ""),
                        "status": status,
                        "emoji": emoji,
                        "duration": f"{duration / 1000:.1f}s",
                        "error": (result.get("errors", [{}])[0].get("message", "") or "")[:300] if result.get("errors") else "",
                    })
    return rows, total, passed, failed, skipped

def generate_comment(rows, total, passed, failed, skipped, shots, failed_titles):
    overall = "🟢 ALL PASSED" if failed == 0 else f"🔴 {failed} FAILED"

    lines = [
        f"## 🧪 UAT 测试结果 — {overall}",
        "",
        f"| | 数量 |",
        f"|---|---|",
        f"| ✅ Passed | {passed} |",
        f"| ❌ Failed | {failed} |",
        f"| ⏭️ Skipped | {skipped} |",
        f"| 📊 **Total** | **{total}** |",
        "",
    ]

    # 报告链接
    if PAGES_BASE:
        lines.append(f"📊 [**查看完整 HTML 报告（含截图/视频/Trace）**]({PAGES_BASE}/uat-report/)")
    else:
        lines.append(f"📊 [查看 Actions 下载报告]({SERVER_URL}/{REPO}/actions/runs/{RUN_ID})")
    lines.append("")

    # 详细结果表
    if rows:
        lines.append("<details><summary>📋 详细测试结果（点击展开）</summary>")
        lines.append("")
        lines.append("| 状态 | 测试 | 耗时 |")
        lines.append("|------|------|------|")
        for r in rows:
            lines.append(f"| {r['emoji']} | **{r['test']}** | {r['duration']} |")
        lines.append("</details>")
        lines.append("")

    # 失败截图
    if failed > 0 and failed_titles:
        lines.append("### ❌ 失败截图")
        lines.append("")
        matched = 0
        for ftitle in failed_titles:
            for shot_name, shot_paths in shots.items():
                # 模糊匹配：截图文件名包含测试名的一部分
                if ftitle[:20].replace(" ", "-").lower() in shot_name.lower():
                    for sp in shot_paths[:2]:  # 最多2张
                        fname = Path(sp).name
                        if PAGES_BASE:
                            # 截图被复制到了 playwright-report/screenshots/
                            lines.append(f"**{ftitle}**")
                            lines.append(f"![{ftitle}]({PAGES_BASE}/uat-report/screenshots/{fname})")
                            lines.append("")
                            matched += 1
                    break
        if matched == 0:
            lines.append(f"（截图在 HTML 报告中查看）")
            lines.append("")

    # footer
    lines.append("---")
    lines.append(f"🤖 自动生成 · [Actions Run]({SERVER_URL}/{REPO}/actions/runs/{RUN_ID})")

    return "\n".join(lines)

def main():
    data = load_results()
    rows, total, passed, failed, skipped = parse_suites(data)
    failed_titles = find_failure_screenshots(data.get("suites", []) if data else [])
    shots = collect_screenshots()
    comment = generate_comment(rows, total, passed, failed, skipped, shots, failed_titles)

    # 写入 PR comment 文件
    with open(COMMENT_FILE, "w") as f:
        f.write(comment)

    # 写入 GitHub Step Summary
    if OUTPUT_MD:
        with open(OUTPUT_MD, "a") as f:
            f.write(comment)

    print(f"Generated summary: {total} tests, {passed} passed, {failed} failed")
    # 输出给后续 step 用
    with open(os.environ.get("GITHUB_OUTPUT", "/dev/null"), "a") as f:
        f.write(f"total={total}\npassed={passed}\nfailed={failed}\n")

if __name__ == "__main__":
    main()
