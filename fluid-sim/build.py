"""problems.json と テンプレートから公開用 HTML を生成する。
使い方: python3 build.py [シミュレータのURL]"""
import json, sys, pathlib
root = pathlib.Path(__file__).parent
data = json.loads((root/"problems.json").read_text())
sim_url = sys.argv[1] if len(sys.argv) > 1 else ""
t = (root/"src/problems.template.html").read_text()
t = t.replace("__DATA__", json.dumps(data, ensure_ascii=False)).replace("__SIM_URL__", sim_url)
(root/"problems.html").write_text(t)
print("wrote problems.html", len(t))
