"""既存の問題・定理・シミュレータ説明に強調記法を入れる一度きりのスクリプト。
  **太字** __下線__ ==マーカー== !!注意!!"""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent

LAWS = ["クッタ・ジューコフスキーの定理", "ナビエ・ストークス方程式", "ブラジウスの解", "ベルヌーイの定理", "パスカルの原理",
        "アルキメデスの原理", "トリチェリの定理", "ストークスの法則", "ニュートンの粘性法則", "ダランベールのパラドックス",
        "ジューコフスキー変換", "クッタ条件", "π 定理", "静水圧の式", "運動量の法則", "連続の式", "ラプラス方程式",
        "NS 方程式", "相対速度", "水平投射", "放物線分布", "ベルヌーイ", "マグヌス効果", "カルマン渦列", "力学的相似", "相似"]

def underline_laws(s):
    """数式の外にある法則名に下線（1 文につき各語 1 回、長い語を優先、既存の記法とは重ねない）"""
    parts = re.split(r"(\$\$.+?\$\$|\$[^$]+?\$)", s)
    used = set()
    for i in range(0, len(parts), 2):
        seg = parts[i]
        for w in LAWS:
            if w in used or w not in seg: continue
            if any(w in u for u in used): continue
            j = seg.find(w)
            before = seg[:j]
            if before.count("__") % 2 or before.count("==") % 2 or before.count("**") % 2: continue
            seg = seg[:j] + "__" + w + "__" + seg[j + len(w):]; used.add(w)
        parts[i] = seg
    return "".join(parts)

def bold_first_sentence(s):
    j = s.find("。")
    if j <= 0 or s.startswith("**"): return s
    return "**" + s[:j] + "**" + s[j:]

def bold_marks(s):
    return re.sub(r"\((\d)\)(?!\*)", r"**(\1)**", s)

HL = {  # 問題ごとのマーカー（解説・ポイント内の文字列）
 "B1": ["「図心の圧力 × 面積」"], "B2": ["両ピストンの圧力は等しい"], "B3": ["浮いている ⇒ 浮力 = 重力"],
 "B4": ["直径の比の 2 乗で効く"], "B5": ["最も遠くまで飛ぶ"], "B6": ["圧力差から流量が測れる"],
 "M1": ["単位時間に失われる運動量"], "M2": ["⇒ 層流", "⇒ 乱流"], "M3": ["⇒ 層流で妥当"],
 "M4": ["すき間が狭いほど速度勾配が大きく"], "M5": ["流速を 2 倍にすると損失は 4 倍、動力は 8 倍"], "M6": ["⇒ 適用可"],
 "A1": ["（前後対称）"], "A2": ["（下側に移動）"], "A3": ["が物体表面"], "A4": ["⇒ 全長で層流"],
 "A5": ["慣性項は 0"], "A6": ["が等しいので"],
}
WARN = {"M3": ["層流の仮定が妥当か確かめよ"], "M6": ["ストークスの法則が使えるか確かめよ"], "A1": ["現実には境界層がはく離して"]}

def mark(s, phrases, tag):
    for ph in phrases:
        if ph in s and (tag + ph) not in s: s = s.replace(ph, tag + ph + tag, 1)
    return s

def problems():
    p = root / "problems.json"; d = json.loads(p.read_text())
    for t in d["theorems"]:
        t["idea"] = underline_laws(bold_first_sentence(t["idea"]))
    for q in d["problems"]:
        hl, wn = HL.get(q["id"], []), WARN.get(q["id"], [])
        q["question"] = bold_marks(mark(q["question"], wn, "!!"))
        q["steps"] = [underline_laws(bold_marks(mark(mark(s, hl, "=="), wn, "!!"))) for s in q["steps"]]
        q["answer"] = bold_marks(q["answer"])
        q["point"] = mark(bold_first_sentence(mark(q["point"], hl, "==")), wn, "!!")
    p.write_text(json.dumps(d, ensure_ascii=False, indent=1))

SIMWARN = ["キャビテーション（気泡の発生）が起こります", "層流の仮定が成り立たなくなるので注意しましょう", "ストークスの法則が使えなくなります",
           "予測は信用できません", "ポテンシャル流（粘性なし）では現れない現象です"]
def sims():
    for f in sorted((root / "src/sim").glob("s_*.js")):
        s = f.read_text()
        def fix(m, kind):
            body = m.group(2)
            if kind == "explain": body = underline_laws(bold_first_sentence(body))
            else:
                body = mark(body, SIMWARN, "!!")
                # 最初の問いかけ（？で終わる文）をマーカーに
                k = body.find("？")
                if k > 0 and "==" not in body[:k]:
                    st = max(body.rfind("。", 0, k), -1) + 1
                    body = body[:st] + "==" + body[st:k + 1] + "==" + body[k + 1:]
            return m.group(1) + body + "'"
        s = re.sub(r"(explain:')((?:[^'\\]|\\.)*)'", lambda m: fix(m, "explain"), s)
        s = re.sub(r"(hint:')((?:[^'\\]|\\.)*)'", lambda m: fix(m, "hint"), s)
        f.write_text(s)

problems(); sims(); print("ok")
