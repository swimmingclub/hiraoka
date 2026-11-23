"""文字列中の $…$（インライン）と $$…$$（別行立て）を集め、MathJax で SVG に変換した辞書を返す。
ページ側では M(文字列) がこの辞書で数式を置き換える（core.js / problems.template.html）。"""
import json, re, subprocess, pathlib
TOOLS = pathlib.Path(__file__).resolve().parent
PAT = re.compile(r"\$\$(.+?)\$\$|\$(?!\{)([^$\n]+?)\$", re.S)

def extract(text):
    out = []
    for m in PAT.finditer(text):
        if m.group(1) is not None: out.append((m.group(1), True))
        else: out.append((m.group(2), False))
    return out

def js_unescape(s):
    return s.replace("\\\\", "\x00").replace("\\'", "'").replace("\x00", "\\")

def split_top(tex, sep=r"\qquad"):
    """波かっこの外にある \\qquad で式を分ける（狭い画面で折り返すため）"""
    parts, depth, cur, i = [], 0, "", 0
    while i < len(tex):
        if depth == 0 and tex.startswith(sep, i):
            parts.append(cur.strip()); cur = ""; i += len(sep); continue
        c = tex[i]; depth += (c == "{") - (c == "}"); cur += c; i += 1
    parts.append(cur.strip())
    return [p for p in parts if p]

def render(items):
    uniq = set()
    for t, d in items:
        if d:
            for part in split_top(t): uniq.add((part, True))
        else: uniq.add((t, False))
    payload = json.dumps([{"tex": t, "display": d} for t, d in sorted(uniq)])
    r = subprocess.run(["node", str(TOOLS / "tex2svg.js")], input=payload, capture_output=True, text=True)
    if r.returncode != 0: raise SystemExit("MathJax error:\n" + r.stderr)
    svgs = json.loads(r.stdout); out = {}
    for t, d in items:
        if d: out["D:" + t] = "".join('<span class="mjx-p">' + svgs["D:" + p] + "</span>" for p in split_top(t))
        else: out[t] = svgs[t]
    return out

def strings_in(obj):
    if isinstance(obj, str): yield obj
    elif isinstance(obj, dict):
        for v in obj.values(): yield from strings_in(v)
    elif isinstance(obj, list):
        for v in obj: yield from strings_in(v)

# ページに埋め込む置き換え関数（MATH はキー→SVG の辞書）
M_JS = r"""
// 数式（$…$, $$…$$）を SVG に置き換え、残りの文に強調記法を適用する
//   **太字**  __下線__  ==マーカー==  !!注意（赤）!!
function M(s){ const esc=t=>t.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  const keep=[]; const re=/\$\$([\s\S]+?)\$\$|\$(?!\{)([^$\n]+?)\$/g;
  let t=s.replace(re,(all,d,i)=>{ let h;
    if(d!==undefined){ const v=MATH['D:'+d]; h=v?'<span class="mjx-d">'+v+'</span>':esc(d); }
    else { const v=MATH[i]; h=v?'<span class="mjx-i">'+v+'</span>':esc(i); }
    keep.push(h); return '\u0000'+(keep.length-1)+'\u0000'; });
  t=esc(t)
    .replace(/\*\*([\s\S]+?)\*\*/g,'<strong class="em-b">$1</strong>')
    .replace(/__([\s\S]+?)__/g,'<span class="em-u">$1</span>')
    .replace(/==([\s\S]+?)==/g,'<mark class="em-hl">$1</mark>')
    .replace(/!!([\s\S]+?)!!/g,'<strong class="em-warn">$1</strong>');
  return t.replace(/\u0000(\d+)\u0000/g,(a,n)=>keep[+n]); }
"""
MATH_CSS = """
.em-b{font-weight:700;color:var(--ink)}
.em-u{text-decoration:underline;text-decoration-color:var(--accent);text-decoration-thickness:2px;text-underline-offset:4px;color:var(--ink)}
mark.em-hl{background:linear-gradient(transparent 52%,var(--hl) 52%);color:var(--ink);padding:0 1px}
.em-warn{font-weight:700;color:var(--a)}
.mjx-i svg{display:inline-block;overflow:visible}
@media (max-width:600px){.mjx-i{display:inline-block;max-width:100%;overflow-x:auto;overflow-y:hidden;vertical-align:middle;padding-block:2px}}
.mjx-d{display:flex;flex-wrap:wrap;align-items:center;column-gap:2.2em;row-gap:6px;padding-block:4px;max-width:100%}
.mjx-p{display:block;max-width:100%;overflow-x:auto;overflow-y:hidden}
.mjx-p svg{display:block;overflow:visible}
"""
