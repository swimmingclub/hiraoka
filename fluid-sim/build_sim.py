"""src/sim/ の shell.html + core.js + s_*.js を1枚の simulator.html にまとめる。
文字列中の $…$ / $$…$$ は MathJax で SVG に変換して埋め込む（tools/ で npm install が必要）。
使い方: python3 build_sim.py [問題集のURL]"""
import sys, json, pathlib
root = pathlib.Path(__file__).parent
sys.path.insert(0, str(root / "tools"))
import mathify
src = root / "src/sim"
problems_url = sys.argv[1] if len(sys.argv) > 1 else "https://claude.ai/artifact/A5ZD1Mg8MHVt1w7cuYYznc"
order = ["beginner", "intermediate", "advanced"]
mods = sorted(src.glob("s_*.js"))
items = []
for m in mods:
    items += [(mathify.js_unescape(t), d) for t, d in mathify.extract(m.read_text())]
math = mathify.render(items)
js = "const MATH = " + json.dumps(math, ensure_ascii=False).replace("</", "<\\/") + ";\n" + mathify.M_JS
js += (src / "core.js").read_text().replace("__PROBLEMS_URL__", problems_url)
js += "\n" + "\n".join(m.read_text() for m in mods)
js += "\nSIMS.sort((a,b)=>%r.indexOf(a.level)-%r.indexOf(b.level)||(a.order||0)-(b.order||0));\nboot();\n" % (order, order)
html = (src / "shell.html").read_text().replace("/*__MATHCSS__*/", mathify.MATH_CSS).replace("/*__JS__*/", js)
(root / "simulator.html").write_text(html)
print("wrote simulator.html", len(html), "formulas:", len(math), "modules:", len(mods))
