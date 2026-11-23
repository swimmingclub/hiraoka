"""problems.json とテンプレートから公開用 problems.html を生成する。
文字列中の $…$ / $$…$$ は MathJax で SVG に変換して埋め込む（tools/ で npm install が必要）。
使い方: python3 build.py [シミュレータのURL]"""
import json, sys, pathlib
root = pathlib.Path(__file__).parent
sys.path.insert(0, str(root / "tools"))
import mathify
data = json.loads((root / "problems.json").read_text())
sim_url = sys.argv[1] if len(sys.argv) > 1 else "https://claude.ai/artifact/QA4b8ym6G5H3u4QgxXbN6c"
items = []
for t in data["theorems"]: items.append((t["formula"], True))
for s in mathify.strings_in(data):
    items += mathify.extract(s)
math = mathify.render(items)
t = (root / "src/problems.template.html").read_text()
t = t.replace("/*__MATHCSS__*/", mathify.MATH_CSS).replace("/*__MJS__*/", mathify.M_JS)
t = t.replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
t = t.replace("__MATH__", json.dumps(math, ensure_ascii=False).replace("</", "<\\/")).replace("__SIM_URL__", sim_url)
(root / "problems.html").write_text(t)
print("wrote problems.html", len(t), "formulas:", len(math))
