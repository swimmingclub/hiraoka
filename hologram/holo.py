"""
ホログラム計算プログラム（計算機合成ホログラム / CGH）

2 つのモードがあります。

  python holo.py gs  [画像ファイル]   … 平面の画像を映す「位相ホログラム」を計算（Gerchberg–Saxton 法）
  python holo.py 3d                   … 奥行きのある点群（3D物体）のホログラムを計算し、
                                        ピント合わせと「見る位置で見え方が変わる（視差）」を再現

必要なライブラリ:  pip install numpy pillow matplotlib
結果は ./hologram_output/ に PNG で保存されます。
"""

import sys
from pathlib import Path

import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont

# ---------------- 共通パラメータ（実際の機材に合わせて変更） ----------------
WAVELENGTH = 532e-9   # レーザー波長 [m]（緑色 532nm）
PITCH = 8e-6          # SLM（表示パネル）の画素ピッチ [m]
N = 1024              # ホログラムの画素数（N × N）
OUT = Path("hologram_output")

# グラフの日本語表示用に、インストールされている日本語フォントを探して使う
from matplotlib import font_manager

_installed = {f.name for f in font_manager.fontManager.ttflist}
_jp = [f for f in ["Noto Sans CJK JP", "Noto Sans JP", "IPAexGothic", "IPAGothic",
                   "Hiragino Sans", "Yu Gothic", "Meiryo", "MS Gothic"] if f in _installed]
plt.rcParams["font.family"] = _jp + ["DejaVu Sans"]


def save_gray(arr, path, gamma=1.0):
    """配列を 0〜255 のグレースケール PNG として保存"""
    a = np.asarray(arr, dtype=float)
    a = a - a.min()
    if a.max() > 0:
        a = a / a.max()
    a = a ** gamma
    Image.fromarray((a * 255).astype(np.uint8)).save(path)


# =====================================================================
# モード1: Gerchberg–Saxton 法による位相ホログラム（フーリエホログラム）
# =====================================================================
def make_default_target(n):
    """画像を指定しなかったときの目標画像（文字と図形）"""
    img = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.load_default(size=n // 9)
    except TypeError:  # 古い Pillow
        font = ImageFont.load_default()
    d.text((n * 0.30, n * 0.36), "HOLO", fill=255, font=font)
    d.ellipse([n * 0.30, n * 0.55, n * 0.42, n * 0.67], outline=255, width=n // 100)
    d.rectangle([n * 0.46, n * 0.55, n * 0.58, n * 0.67], outline=255, width=n // 100)
    d.polygon([(n * 0.68, n * 0.55), (n * 0.62, n * 0.67), (n * 0.74, n * 0.67)],
              outline=255, width=n // 100)
    return np.asarray(img, dtype=float) / 255.0


def load_target(path, n):
    """画像ファイルを読み込み、N×N の中央に縮小して配置"""
    img = Image.open(path).convert("L")
    img.thumbnail((n // 2, n // 2))          # 周りに余白を残すと再生像がきれい
    canvas = Image.new("L", (n, n), 0)
    canvas.paste(img, ((n - img.width) // 2, (n - img.height) // 2))
    return np.asarray(canvas, dtype=float) / 255.0


def gerchberg_saxton(target, iterations=100, seed=0):
    """
    目標の明るさ分布 target を再生する位相分布 phi を求める。
      SLM 面:   振幅は一様（レーザーが均一に当たる）、位相だけ自由
      再生面:   振幅を目標画像に合わせ、位相は自由
    の 2 つの条件を、フーリエ変換で行き来しながら交互に満たしていく。
    """
    rng = np.random.default_rng(seed)
    amp_target = np.sqrt(target)                        # 明るさ → 振幅
    amp_target_s = np.fft.ifftshift(amp_target)         # FFT の座標系に合わせる
    phi = rng.uniform(0, 2 * np.pi, target.shape)       # 初期位相はランダム
    errors = []
    for _ in range(iterations):
        far = np.fft.fft2(np.exp(1j * phi))                         # SLM → 再生面
        recon = np.abs(far)
        errors.append(np.sqrt(np.mean((recon / recon.max() - amp_target_s) ** 2)))
        far = amp_target_s * np.exp(1j * np.angle(far))             # 振幅を目標に置換
        phi = np.angle(np.fft.ifft2(far))                           # 再生面 → SLM
    return phi, errors


def run_gs(image_path=None):
    OUT.mkdir(exist_ok=True)
    target = load_target(image_path, N) if image_path else make_default_target(N)

    phi, errors = gerchberg_saxton(target, iterations=100)

    # SLM に表示する 8bit 画像（0〜255 が 0〜2π に対応）
    phi_8bit = np.round((phi % (2 * np.pi)) / (2 * np.pi) * 255).astype(np.uint8)
    Image.fromarray(phi_8bit).save(OUT / "gs_hologram_for_SLM.png")

    # 8bit に量子化した位相で再生をシミュレーション
    phi_q = phi_8bit / 255.0 * 2 * np.pi
    recon = np.abs(np.fft.fftshift(np.fft.fft2(np.exp(1j * phi_q)))) ** 2
    save_gray(recon, OUT / "gs_reconstruction.png", gamma=0.5)

    fig, ax = plt.subplots(1, 4, figsize=(16, 4.4))
    ax[0].imshow(target, cmap="gray"); ax[0].set_title("目標の画像")
    ax[1].imshow(phi_8bit, cmap="gray"); ax[1].set_title("ホログラム（位相パターン）\n→ SLM に表示する")
    ax[2].imshow(recon ** 0.5, cmap="gray"); ax[2].set_title("再生像のシミュレーション")
    ax[3].plot(errors); ax[3].set_title("誤差の減り方"); ax[3].set_xlabel("繰り返し回数")
    for a in ax[:3]:
        a.axis("off")
    plt.tight_layout()
    plt.savefig(OUT / "gs_summary.png", dpi=110)
    print(f"保存しました: {OUT}/gs_summary.png, gs_hologram_for_SLM.png, gs_reconstruction.png")


# =====================================================================
# モード2: 3D 点群のホログラム（フレネルホログラム）
# =====================================================================
def make_point_cloud():
    """手前にリング、奥に十字を置いた簡単な 3D 物体  (x, y, z, 明るさ)"""
    pts = []
    z_near, z_far = 0.15, 0.22                     # ホログラムからの距離 [m]
    for t in np.linspace(0, 2 * np.pi, 28, endpoint=False):   # 手前: リング
        pts.append((0.9e-3 * np.cos(t), 0.9e-3 * np.sin(t), z_near, 1.0))
    for s in np.linspace(-1.2e-3, 1.2e-3, 15):                # 奥: 十字
        pts.append((s, 0.0, z_far, 1.0))
        if abs(s) > 1e-9:
            pts.append((0.0, s, z_far, 1.0))
    return np.array(pts), z_near, z_far


def point_cloud_field(points, seed=1):
    """
    各点から出る球面波をホログラム面で足し合わせる（物体光）。
    画素ピッチで表せない細かい縞（= 見える角度の外）は計算に入れない。
    """
    rng = np.random.default_rng(seed)
    c = (np.arange(N) - N / 2) * PITCH
    X, Y = np.meshgrid(c, c)
    k = 2 * np.pi / WAVELENGTH
    sin_max = WAVELENGTH / (2 * PITCH)             # 表示できる最大の回折角
    field = np.zeros((N, N), dtype=complex)
    for xp, yp, zp, a in points:
        rho2 = (X - xp) ** 2 + (Y - yp) ** 2
        r = np.sqrt(rho2 + zp ** 2)
        mask = np.sqrt(rho2) <= zp * sin_max / np.sqrt(1 - sin_max ** 2)
        field += mask * a / r * np.exp(1j * (k * r + rng.uniform(0, 2 * np.pi)))
    return field


def propagate(field, z):
    """角スペクトル法で光を距離 z だけ伝搬させる（z<0 は逆向き）"""
    fx = np.fft.fftfreq(N, d=PITCH)
    FX, FY = np.meshgrid(fx, fx)
    arg = 1 - (WAVELENGTH * FX) ** 2 - (WAVELENGTH * FY) ** 2
    kz = 2 * np.pi / WAVELENGTH * np.sqrt(np.maximum(arg, 0))
    H = np.exp(1j * kz * z) * (arg > 0)
    return np.fft.ifft2(np.fft.fft2(field) * H)


def run_3d():
    OUT.mkdir(exist_ok=True)
    points, z_near, z_far = make_point_cloud()
    print(f"点の数: {len(points)}  計算中...")
    obj = point_cloud_field(points)

    # 乾板に記録される「干渉縞」（物体光 + まっすぐ来る参照光）
    ref = np.abs(obj).max()
    hologram = np.abs(obj + ref) ** 2
    save_gray(hologram, OUT / "3d_hologram_fringes.png")

    # 再生: 干渉縞に光を当て、逆向きに伝搬させてピントを合わせる
    h = hologram - hologram.mean()                 # 0 次光（直進光）を除く
    rec_near = np.abs(propagate(h, -z_near)) ** 2
    rec_far = np.abs(propagate(h, -z_far)) ** 2

    # 視差: ホログラムの一部（小さな窓 = 目の瞳）だけを通して見る
    win = int(1.6e-3 / PITCH)                      # 窓の大きさ 1.6mm
    views = {}
    for name, cx in [("左から見た像", N // 2 - int(2.6e-3 / PITCH)),
                     ("右から見た像", N // 2 + int(2.6e-3 / PITCH))]:
        m = np.zeros((N, N))
        m[N // 2 - win // 2:N // 2 + win // 2, cx - win // 2:cx + win // 2] = 1
        views[name] = np.abs(propagate(h * m, -(z_near + z_far) / 2)) ** 2

    crop = slice(N // 2 - 330, N // 2 + 330)
    fig, ax = plt.subplots(1, 5, figsize=(20, 4.6))
    ax[0].imshow(hologram[N // 2 - 128:N // 2 + 128, N // 2 - 128:N // 2 + 128], cmap="gray")
    ax[0].set_title("干渉縞（中央部を拡大）")
    ax[1].imshow(rec_near[crop, crop] ** 0.3, cmap="gray")
    ax[1].set_title(f"{z_near*100:.0f}cm にピント\n（手前のリングがくっきり）")
    ax[2].imshow(rec_far[crop, crop] ** 0.3, cmap="gray")
    ax[2].set_title(f"{z_far*100:.0f}cm にピント\n（奥の十字がくっきり）")
    for i, (name, v) in enumerate(views.items()):
        ax[3 + i].imshow(v[crop, crop] ** 0.5, cmap="gray")
        ax[3 + i].set_title(f"{name}\n（リングと十字の位置関係がずれる）")
    for a in ax:
        a.axis("off")
    plt.tight_layout()
    plt.savefig(OUT / "3d_summary.png", dpi=110)
    print(f"保存しました: {OUT}/3d_summary.png, 3d_hologram_fringes.png")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "gs"
    if mode == "gs":
        run_gs(sys.argv[2] if len(sys.argv) > 2 else None)
    elif mode == "3d":
        run_3d()
    else:
        print(__doc__)
