"""シミュレータの式・ラベルを TeX（$…$ インライン、$$…$$ 別行立て）に書き換える一度きりのスクリプト。
new 側は普通の TeX（\\ は 1 本）で書き、JS 文字列用に自動で \\ を 2 本にする。"""
import pathlib, sys
src = pathlib.Path(__file__).resolve().parent.parent / "src/sim"
R = {
"s_hydrostatic.js": [
 ("formula:'p = ρgh　　F = ρg h_G A　　h_P = h_G + I_G/(h_G A)'", r"formula:'$$p = \rho g h \qquad F = \rho g\, h_G A \qquad h_P = h_G + \frac{I_G}{h_G A}$$'"),
 ("（長方形なら水深の 2/3）", r"（長方形なら水深の $\frac{2}{3}$）"),
 ("['底のゲージ圧 p = ρgh',", r"['底のゲージ圧 $p = \rho g h$',"),
 ("['水門の面積 A = bh',", r"['水門の面積 $A = bh$',"),
 ("['図心の深さ h_G',", r"['図心の深さ $h_G$',"),
 ("['全圧力 F = ρg h_G A',", r"['全圧力 $F = \rho g\, h_G A$',"),
 ("['圧力中心 h_P',", r"['圧力中心 $h_P$',"),
 ("['h_P / h',", r"['$h_P / h$',"),
 ("label:'水深 h'", r"label:'水深 $h$'"), ("label:'水門の幅 b'", r"label:'水門の幅 $b$'"),
],
"s_pascal.js": [
 ("formula:'p = F₁/A₁ = F₂/A₂　　A₁x₁ = A₂x₂'", r"formula:'$$p = \frac{F_1}{A_1} = \frac{F_2}{A_2} \qquad A_1 x_1 = A_2 x_2$$'"),
 ("label:'小ピストンを押す力 F₁'", r"label:'小ピストンを押す力 $F_1$'"), ("label:'小ピストンの直径 d₁'", r"label:'小ピストンの直径 $d_1$'"),
 ("label:'大ピストンの直径 d₂'", r"label:'大ピストンの直径 $d_2$'"), ("label:'小ピストンの押し込み量 x₁'", r"label:'小ピストンの押し込み量 $x_1$'"),
 ("['面積比 A₂/A₁',", r"['面積比 $A_2/A_1$',"), ("['圧力 p = F₁/A₁',", r"['圧力 $p = F_1/A_1$',"),
 ("['大ピストンの力 F₂',", r"['大ピストンの力 $F_2$',"), ("['大ピストンの上昇 x₂',", r"['大ピストンの上昇 $x_2$',"),
 ("['仕事 F₁x₁',", r"['仕事 $F_1 x_1$',"), ("['仕事 F₂x₂',", r"['仕事 $F_2 x_2$',"),
],
"s_buoyancy.js": [
 ("formula:'F_B = ρ_流体 g V_排除　　浮いているとき：F_B = mg'", r"formula:'$$F_B = \rho_{\text{流体}}\, g\, V_{\text{排除}} \qquad \text{浮いているとき：}\ F_B = mg$$'"),
 ("密度の比 ρ_物体/ρ_流体 になります", r"密度の比 $\rho_{\text{物体}}/\rho_{\text{流体}}$ になります"),
 ("label:'立方体の一辺 a'", r"label:'立方体の一辺 $a$'"), ("label:'物体の密度 ρ_物体'", r"label:'物体の密度 $\rho_{\text{物体}}$'"),
 ("label:'上から押す力 F'", r"label:'上から押す力 $F$'"),
 ("['物体の重さ mg',", r"['物体の重さ $mg$',"), ("['いまの浮力 F_B',", r"['いまの浮力 $F_B$',"), ("['沈んでいる深さ d',", r"['沈んでいる深さ $d$',"),
 ("['理論：密度比 ρ_物体/ρ_流体',", r"['理論：密度比 $\rho_{\text{物体}}/\rho_{\text{流体}}$',"),
 ("['理論：浮くときの d = a×密度比',", r"['理論：浮くときの $d = a \times$ 密度比',"),
 ("['全没に必要な力 F_B,全 − mg',", r"['全没に必要な力 $F_{B,\text{全}} - mg$',"),
],
"s_continuity.js": [
 ("formula:'Q = A₁v₁ = A₂v₂　　v₂ = v₁ (d₁/d₂)²'", r"formula:'$$Q = A_1 v_1 = A_2 v_2 \qquad v_2 = v_1 \left(\frac{d_1}{d_2}\right)^2$$'"),
 ("label:'太い管の流速 v₁'", r"label:'太い管の流速 $v_1$'"), ("label:'太い管の内径 d₁'", r"label:'太い管の内径 $d_1$'"), ("label:'細い管の内径 d₂'", r"label:'細い管の内径 $d_2$'"),
 ("['断面積 A₁',", r"['断面積 $A_1$',"), ("['断面積 A₂',", r"['断面積 $A_2$',"), ("['流量 Q = A₁v₁',", r"['流量 $Q = A_1 v_1$',"),
 ("['細い管の流速 v₂ = Q/A₂',", r"['細い管の流速 $v_2 = Q/A_2$',"), ("['速度比 v₂/v₁ = (d₁/d₂)²',", r"['速度比 $v_2/v_1 = (d_1/d_2)^2$',"),
],
"s_torricelli.js": [
 ("formula:'v = √(2gh)　　x = v√(2H/g) = 2√(hH)'", r"formula:'$$v = \sqrt{2gh} \qquad x = v\sqrt{\frac{2H}{g}} = 2\sqrt{hH}$$'"),
 ("label:'床からの水位 L'", r"label:'床からの水位 $L$'"), ("label:'孔の高さ H（床から）'", r"label:'孔の高さ $H$（床から）'"), ("label:'孔の直径 d'", r"label:'孔の直径 $d$'"),
 ("[['深さ h',", r"[['深さ $h$',"), ("['流出速度 v = √(2gh)',", r"['流出速度 $v = \sqrt{2gh}$',"), ("['流量 Q = av',", r"['流量 $Q = av$',"),
 ("['到達距離 x = 2√(hH)',", r"['到達距離 $x = 2\sqrt{hH}$',"),
],
"s_venturi.js": [
 ("formula:'p/ρg + v²/2g + z = 一定（全ヘッド）　　p₁ − p₂ = ½ρ(v₂² − v₁²)'", r"formula:'$$\frac{p}{\rho g} + \frac{v^2}{2g} + z = \text{一定（全ヘッド）} \qquad p_1 - p_2 = \frac{1}{2}\rho\,(v_2^2 - v_1^2)$$'"),
 ("速度ヘッド v²/2g です", r"速度ヘッド $v^2/2g$ です"),
 ("label:'入口の流速 v₁'", r"label:'入口の流速 $v_1$'"), ("label:'入口の内径 d₁'", r"label:'入口の内径 $d_1$'"), ("label:'のど部の内径 d₂'", r"label:'のど部の内径 $d_2$'"),
 ("label:'入口の圧力ヘッド p₁/ρg'", r"label:'入口の圧力ヘッド $p_1/\rho g$'"),
 ("['のど部の流速 v₂',", r"['のど部の流速 $v_2$',"), ("['流量 Q',", r"['流量 $Q$',"), ("['圧力差 p₁ − p₂',", r"['圧力差 $p_1 - p_2$',"),
 ("['水柱の差 Δh',", r"['水柱の差 $\Delta h$',"), ("['ピトー管の水柱差 v₁²/2g',", r"['ピトー管の水柱差 $v_1^2/2g$',"), ("['全ヘッド H',", r"['全ヘッド $H$',"),
],
"s_momentum.js": [
 ("formula:'F = ρQ_rel (v − u)(1 − cos β)　　Q_rel = A(v − u)'", r"formula:'$$F = \rho Q_{\text{rel}}\,(v - u)(1 - \cos\beta) \qquad Q_{\text{rel}} = A\,(v - u)$$'"),
 ("label:'噴流の直径 d'", r"label:'噴流の直径 $d$'"), ("label:'噴流の速度 v'", r"label:'噴流の速度 $v$'"),
 ("label:'板の速度 u（噴流と同じ向き）'", r"label:'板の速度 $u$（噴流と同じ向き）'"), ("label:'噴流を曲げる角度 β'", r"label:'噴流を曲げる角度 $\beta$'"),
 ("['噴流の断面積 A',", r"['噴流の断面積 $A$',"), ("['板に当たる流量 Q = A(v−u)',", r"['板に当たる流量 $Q = A(v-u)$',"),
 ("['出口の噴流方向速度 (v−u)cos β',", r"['出口の噴流方向速度 $(v-u)\cos\beta$',"), ("['板が受ける力 F',", r"['板が受ける力 $F$',"), ("['板がされる仕事率 Fu',", r"['板がされる仕事率 $Fu$',"),
],
"s_reynolds.js": [
 ("formula:'Re = ρvd/μ = vd/ν　　（円管：Re < 2300 層流 ／ Re > 4000 程度で乱流）'", r"formula:'$$Re = \frac{\rho v d}{\mu} = \frac{v d}{\nu} \qquad \text{円管：}\ Re < 2300\ \text{で層流、}\ Re > 4000\ \text{程度で乱流}$$'"),
 ("label:'平均流速 v'", r"label:'平均流速 $v$'"), ("label:'管の内径 d'", r"label:'管の内径 $d$'"),
 ("['レイノルズ数 Re = vd/ν',", r"['レイノルズ数 $Re = vd/\nu$',"), ("['臨界流速 v_c（Re = 2300）',", r"['臨界流速 $v_c$（$Re = 2300$）',"),
],
"s_poiseuille.js": [
 ("formula:'u(r) = (Δp/4μL)(R² − r²)　　Q = πd⁴Δp/(128μL)　　u_max = 2v̄'", r"formula:'$$u(r) = \frac{\Delta p}{4\mu L}(R^2 - r^2) \qquad Q = \frac{\pi d^4 \Delta p}{128 \mu L} \qquad u_{\max} = 2\bar{v}$$'"),
 ("label:'圧力差 Δp'", r"label:'圧力差 $\Delta p$'"), ("label:'管の長さ L'", r"label:'管の長さ $L$'"), ("label:'内径 d'", r"label:'内径 $d$'"),
 ("['流量 Q',", r"['流量 $Q$',"), ("['平均流速 v̄ = Q/A',", r"['平均流速 $\bar{v} = Q/A$',"), ("['最大流速 u_max = 2v̄',", r"['最大流速 $u_{\max} = 2\bar{v}$',"),
 ("['レイノルズ数 Re',", r"['レイノルズ数 $Re$',"), ("['壁のせん断応力 τ_w',", r"['壁のせん断応力 $\tau_w$',"), ("['ポンプ動力 ΔpQ',", r"['ポンプ動力 $\Delta p\, Q$',"),
],
"s_couette.js": [
 ("formula:'τ = μ du/dy　　u(y) = U·y/h + (1/2μ)(−dp/dx)·y(h − y)'", r"formula:'$$\tau = \mu \frac{du}{dy} \qquad u(y) = U\frac{y}{h} + \frac{1}{2\mu}\left(-\frac{dp}{dx}\right) y\,(h - y)$$'"),
 ("0 = −dp/dx + μ d²u/dy² に簡単化され", r"$0 = -\frac{dp}{dx} + \mu \frac{d^2u}{dy^2}$ に簡単化され"),
 ("壁のせん断応力は τ = μ du/dy（分布の傾き）です", r"壁のせん断応力は $\tau = \mu\, du/dy$（分布の傾き）です"),
 ("label:'上板の速度 U'", r"label:'上板の速度 $U$'"), ("label:'すき間 h'", r"label:'すき間 $h$'"),
 ("label:'圧力勾配 −dp/dx'", r"label:'圧力勾配 $-dp/dx$'"), ("label:'上板の面積 A'", r"label:'上板の面積 $A$'"),
 ("['最大流速 u_max',", r"['最大流速 $u_{\max}$',"), ("['単位幅流量 q',", r"['単位幅流量 $q$',"), ("['平均流速 q/h',", r"['平均流速 $q/h$',"),
 ("['上板のせん断応力 τ',", r"['上板のせん断応力 $\tau$',"), ("['下板のせん断応力 τ_w',", r"['下板のせん断応力 $\tau_w$',"),
 ("['上板を動かす力 F = τA',", r"['上板を動かす力 $F = \tau A$',"), ("['必要な動力 FU',", r"['必要な動力 $FU$',"),
],
"s_darcy.js": [
 ("formula:'h_f = f (L/d)(v²/2g)　　層流 f = 64/Re　　乱流 1/√f = −2 log(ε/3.7d + 2.51/(Re√f))'", r"formula:'$$h_f = f\,\frac{L}{d}\,\frac{v^2}{2g} \qquad \text{層流：}\ f = \frac{64}{Re} \qquad \text{乱流：}\ \frac{1}{\sqrt{f}} = -2\log_{10}\!\left(\frac{\varepsilon/d}{3.7} + \frac{2.51}{Re\sqrt{f}}\right)$$'"),
 ("速度ヘッド v²/2g に比例し", r"速度ヘッド $v^2/2g$ に比例し"), ("f は層流なら 64/Re", r"$f$ は層流なら $64/Re$"), ("比例係数が管摩擦係数 f です", r"比例係数が管摩擦係数 $f$ です"),
 ("相対粗さ ε/d で決まり", r"相対粗さ $\varepsilon/d$ で決まり"),
 ("label:'平均流速 v'", r"label:'平均流速 $v$'"), ("label:'内径 d'", r"label:'内径 $d$'"), ("label:'管の長さ L'", r"label:'管の長さ $L$'"),
 ("label:'管壁の粗さ ε'", r"label:'管壁の粗さ $\varepsilon$'"), ("label:'f を指定する（f = 0.02）'", r"label:'$f$ を指定する（$f = 0.02$）'"),
 ("['レイノルズ数 Re',", r"['レイノルズ数 $Re$',"), ("['相対粗さ ε/d',", r"['相対粗さ $\varepsilon/d$',"), ("['f（コールブルック式）',", r"['$f$（コールブルック式）',"),
 ("['使った f',", r"['使った $f$',"), ("['損失ヘッド h_f',", r"['損失ヘッド $h_f$',"), ("['圧力損失 Δp',", r"['圧力損失 $\Delta p$',"), ("['流量 Q',", r"['流量 $Q$',"),
 ("['ポンプ動力 ρgQh_f',", r"['ポンプ動力 $\rho g Q h_f$',"),
],
"s_stokes.js": [
 ("formula:'D = 3πμdv　　v_t = (ρ_s − ρ) g d² / (18μ)　　（Re = ρvd/μ < 1 で有効）'", r"formula:'$$D = 3\pi\mu d v \qquad v_t = \frac{(\rho_s - \rho)\, g\, d^2}{18\mu} \qquad \left(Re = \frac{\rho v d}{\mu} < 1\ \text{で有効}\right)$$'"),
 ("v(t) = v_t(1 − e^(−t/τ)) と指数関数的に近づき、τ = m/(3πμd) です", r"$v(t) = v_t\left(1 - e^{-t/\tau}\right)$ と指数関数的に近づき、$\tau = \dfrac{m}{3\pi\mu d}$ です"),
 ("label:'粒子の直径 d'", r"label:'粒子の直径 $d$'"), ("label:'粒子の密度 ρ_s'", r"label:'粒子の密度 $\rho_s$'"),
 ("['終端速度 v_t',", r"['終端速度 $v_t$',"), ("['レイノルズ数 Re',", r"['レイノルズ数 $Re$',"), ("['時定数 τ = m/(3πμd)',", r"['時定数 $\tau = m/(3\pi\mu d)$',"),
 ("['終端での抵抗 3πμdv_t',", r"['終端での抵抗 $3\pi\mu d v_t$',"),
],
"s_cylinder.js": [
 ("formula:'W(z) = U(z + a²/z) + iΓ/(2π)·log z　　u_θ = −2U sinθ − Γ/(2πa)　　C_p = 1 − (u_θ/U)²'", r"formula:'$$W(z) = U\left(z + \frac{a^2}{z}\right) + \frac{i\Gamma}{2\pi}\log z \qquad u_\theta = -2U\sin\theta - \frac{\Gamma}{2\pi a} \qquad C_p = 1 - \left(\frac{u_\theta}{U}\right)^2$$'"),
 ("揚力 L′ = ρUΓ が生じます", r"揚力 $L' = \rho U \Gamma$ が生じます"), ("Γ = 4πaU を超えると", r"$\Gamma = 4\pi a U$ を超えると"),
 ("label:'一様流の速さ U'", r"label:'一様流の速さ $U$'"), ("label:'円柱の半径 a'", r"label:'円柱の半径 $a$'"), ("label:'循環 Γ（時計回り正）'", r"label:'循環 $\Gamma$（時計回り正）'"),
 ("['Γ=0 での θ=90° の p − p∞',", r"['$\Gamma = 0$ での $\theta = 90^\circ$ の $p - p_\infty$',"), ("['よどみ点 θ_s',", r"['よどみ点 $\theta_s$',"),
 ("['Γ/(4πaU)',", r"['$\Gamma/(4\pi a U)$',"), ("['揚力 L′ = ρUΓ（空気 ρ = 1.2）',", r"['揚力 $L' = \rho U \Gamma$（空気 $\rho = 1.2$）',"),
],
"s_kutta.js": [
 ("formula:'L′ = ρUΓ　　クッタ条件：Γ = 4πRU sin(α + β)　　C_L ≈ 2π sin(α + β)'", r"formula:'$$L' = \rho U \Gamma \qquad \text{クッタ条件：}\ \Gamma = 4\pi R U \sin(\alpha + \beta) \qquad C_L \approx 2\pi \sin(\alpha + \beta)$$'"),
 ("写像 z = ζ + c²/ζ（ジューコフスキー変換）", r"写像 $z = \zeta + \dfrac{c^2}{\zeta}$（ジューコフスキー変換）"), ("揚力は L′ = ρUΓ です", r"揚力は $L' = \rho U \Gamma$ です"),
 ("label:'迎え角 α'", r"label:'迎え角 $\alpha$'"), ("label:'反り（キャンバー）δ'", r"label:'反り（キャンバー）$\delta$'"), ("label:'厚み ε'", r"label:'厚み $\varepsilon$'"), ("label:'流速 U'", r"label:'流速 $U$'"),
 ("['翼弦長 c（1 m として換算）',", r"['翼弦長 $c$（1 m として換算）',"), ("['ゼロ揚力角 −β',", r"['ゼロ揚力角 $-\beta$',"), ("['循環 Γ',", r"['循環 $\Gamma$',"),
 ("['揚力係数 C_L',", r"['揚力係数 $C_L$',"), ("['揚力 L′ = ρUΓ（空気）',", r"['揚力 $L' = \rho U \Gamma$（空気）',"), ("['薄翼理論 2π(α+β)',", r"['薄翼理論 $2\pi(\alpha + \beta)$',"),
],
"s_potential.js": [
 ("formula:'ψ = Uy + Σ (m/2π)θ − Σ (Γ/2π) ln r　　u = ∂ψ/∂y,  v = −∂ψ/∂x'", r"formula:'$$\psi = Uy + \sum \frac{m}{2\pi}\theta - \sum \frac{\Gamma}{2\pi}\ln r \qquad u = \frac{\partial\psi}{\partial y},\quad v = -\frac{\partial\psi}{\partial x}$$'"),
 ("流線（ψ = 一定の線）は", r"流線（$\psi$ = 一定の線）は"),
 ("label:'一様流 U'", r"label:'一様流 $U$'"), ("label:'置く要素の強さ |m| または |Γ|'", r"label:'置く要素の強さ $|m|$ または $|\Gamma|$'"),
 ("['理論 x_s = −m/(2πU)',", r"['理論 $x_s = -m/(2\pi U)$',"), ("['下流での物体の幅 m/U',", r"['下流での物体の幅 $m/U$',"), ("['物体表面の流線 ψ',", r"['物体表面の流線 $\psi$',"),
],
"s_boundary.js": [
 ("formula:'δ ≈ 5.0x/√Re_x　　τ_w = 0.332ρU²/√Re_x　　C_f(平均) = 1.328/√Re_L　　Re_x = Ux/ν'", r"formula:'$$\delta \approx \frac{5.0\,x}{\sqrt{Re_x}} \qquad \tau_w = \frac{0.332\,\rho U^2}{\sqrt{Re_x}} \qquad \overline{C_f} = \frac{1.328}{\sqrt{Re_L}} \qquad Re_x = \frac{Ux}{\nu}$$'"),
 ("層流境界層の厚さ δ は √x に比例し", r"層流境界層の厚さ $\delta$ は $\sqrt{x}$ に比例し"), ("Re_x が約 5×10⁵ を超えると", r"$Re_x$ が約 $5 \times 10^5$ を超えると"),
 ("（δ ∝ 1/√U）", r"（$\delta \propto 1/\sqrt{U}$）"), ("（η = y√(U/νx) で重なる）", r"（$\eta = y\sqrt{U/\nu x}$ で重なる）"),
 ("label:'一様流の速さ U'", r"label:'一様流の速さ $U$'"), ("label:'板の長さ L'", r"label:'板の長さ $L$'"), ("label:'板の幅 b'", r"label:'板の幅 $b$'"),
 ("['後端のレイノルズ数 Re_L',", r"['後端のレイノルズ数 $Re_L$',"), ("['後端の厚さ δ(L)',", r"['後端の厚さ $\delta(L)$',"),
 ("['平均摩擦係数 C_f',", r"['平均摩擦係数 $\overline{C_f}$',"), ("['片面の摩擦抵抗 D = ½ρU²C_f Lb',", r"['片面の摩擦抵抗 $D = \frac{1}{2}\rho U^2 \overline{C_f}\, Lb$',"),
],
"s_navierstokes.js": [
 ("formula:'ρ(∂u/∂t + (u·∇)u) = −∇p + μ∇²u　　Re = UD/ν'", r"formula:'$$\rho\left(\frac{\partial \boldsymbol{u}}{\partial t} + (\boldsymbol{u}\cdot\nabla)\boldsymbol{u}\right) = -\nabla p + \mu\nabla^2\boldsymbol{u} \qquad Re = \frac{UD}{\nu}$$'"),
 ("label:'レイノルズ数 Re'", r"label:'レイノルズ数 $Re$'"),
 ("['レイノルズ数 Re = UD/ν',", r"['レイノルズ数 $Re = UD/\nu$',"), ("['格子の動粘性係数 ν',", r"['格子の動粘性係数 $\nu$',"),
 ("['緩和時間 τ = 3ν + ½',", r"['緩和時間 $\tau = 3\nu + \frac{1}{2}$',"), ("['ストローハル数 St',", r"['ストローハル数 $St$',"),
],
"s_dimensional.js": [
 ("formula:'F = f(ρ, v, L, μ) ⇒ F/(ρv²L²) = φ(ρvL/μ)　　Re_模型 = Re_実物 ⇒ π₁ も等しい'", r"formula:'$$F = f(\rho, v, L, \mu) \;\Rightarrow\; \frac{F}{\rho v^2 L^2} = \phi\!\left(\frac{\rho v L}{\mu}\right) \qquad Re_{\text{模型}} = Re_{\text{実物}} \;\Rightarrow\; \pi_1\ \text{も等しい}$$'"),
 ("抵抗 F が密度 ρ・速度 v・長さ L・粘性係数 μ で決まるとき", r"抵抗 $F$ が密度 $\rho$・速度 $v$・長さ $L$・粘性係数 $\mu$ で決まるとき"),
 ("抵抗係数 π₁ = F/(ρv²L²) も等しくなります", r"抵抗係数 $\pi_1 = \dfrac{F}{\rho v^2 L^2}$ も等しくなります"),
 ("label:'実物の長さ L_p'", r"label:'実物の長さ $L_p$'"), ("label:'実物の速さ v_p（空気中）'", r"label:'実物の速さ $v_p$（空気中）'"),
 ("label:'模型の縮尺 1/n'", r"label:'模型の縮尺 $1/n$'"), ("label:'模型の速さ v_m'", r"label:'模型の速さ $v_m$'"), ("label:'模型で測った抵抗 F_m'", r"label:'模型で測った抵抗 $F_m$'"),
 ("['実物の Re',", r"['実物の $Re$',"), ("['模型の Re',", r"['模型の $Re$',"), ("['Re をそろえる模型の速さ',", r"['$Re$ をそろえる模型の速さ',"),
 ("['模型の π₁ = F_m/(ρ_m v_m² L_m²)',", r"['模型の $\pi_1 = F_m/(\rho_m v_m^2 L_m^2)$',"), ("['実物の抵抗の予測 F_p',", r"['実物の抵抗の予測 $F_p$',"),
],
}
bad = 0
for fn, reps in R.items():
    p = src / fn; s = p.read_text()
    for old, new in reps:
        n = s.count(old)
        if n == 0: print("NOT FOUND", fn, old[:60]); bad += 1; continue
        s = s.replace(old, new.replace("\\", "\\\\"))
    p.write_text(s)
print("done, missing:", bad); sys.exit(1 if bad else 0)
