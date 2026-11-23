# 流体力学 問題集とシミュレータ

- 問題集（27問・初級/中級/上級）: https://claude.ai/artifact/A5ZD1Mg8MHVt1w7cuYYznc
- シミュレータ（27本）: https://claude.ai/artifact/QA4b8ym6G5H3u4QgxXbN6c

## 構成
- `problems.json` … 定理と問題のデータ（ここを直して再生成する）
- `src/problems.template.html` + `build.py` → `problems.html`（`python3 build.py <シミュレータURL>`）
- `src/sim/shell.html`, `core.js`, `s_*.js` + `build_sim.py` → `simulator.html`
  - シミュレータは `defineSim({...})` で 1 ファイル 1 本。`#id` で直接開ける
- `LOOP_PLAN.md` … 15 周のループ作業の記録

## 数式の表示
- 文字列の中に TeX で `$…$`（文中）や `$$…$$`（別行）と書くと、ビルド時に MathJax で SVG に変換して埋め込む
- 初回のみ `cd tools && npm install` が必要（`tools/tex2svg.js`, `tools/mathify.py`）
- キャンバス内の文字は `h_P` や `u_{max}` と書くと下付き文字で描く

## 強調の記法
- `**太字**` / `__下線__` / `==マーカー==` / `!!注意（赤）!!` を文字列中に書くと、M() が装飾して表示する
