"""K-7 Mk-III design budget: mass, torque, power, deploy geometry.
All masses are estimates (g). Values marked ASSUME must be replaced with datasheet numbers."""
import math

G = 9.81
# ---------------- mass table (g) ----------------
PTK7465_G = 75            # ASSUME: replace with datasheet mass
MASS = {
    "arm servos PTK7465 x8": 8 * PTK7465_G,
    "arm links CNC Al 5mm, 4 plates/arm x2": 2 * 4 * 46,
    "arm shells + tips (caster, gripper, small servo) x2": 2 * 90,
    "ring rim Al (r72-78, w20) x2": 2 * 153,
    "ring tire TPU (r90-105, w32, 30% infill) x2": 2 * 150,
    "ring spacer PETG (r78-90) x2": 2 * 80,
    "carrier: BLDC 5010 + driver + rollers + bracket x2": 2 * 230,
    "gimbal servos steer+camber x2 sides": 4 * 55,
    "fairing x2": 2 * 40,
    "deploy rail/stage + actuators x2": 2 * 120,
    "body frame Al + printed panels": 600,
    "Kakip + heatsink": 100,
    "MCU board, drivers, IMU, camera": 120,
    "battery 4S 3000mAh LiPo": 330,
    "wiring, fasteners": 200,
}
PAYLOAD = 300
m_robot = sum(MASS.values()) / 1000
m_total = m_robot + PAYLOAD / 1000

# ---------------- arm as outrigger (main role) ----------------
PTK_STALL_KGCM = 7.5                    # user-provided stall torque
CONT_RULE, PEAK_RULE = 1 / 3, 0.8       # design rule: continuous <= 1/3 stall, transient <= 80%
L_AX_TIP = 0.175                        # axle -> arm tip, horizontal (m)
H_CG = 0.05                             # CG above axle (m)
cases = {
    "steady light touch (controller holds 1 N/arm)": 2 * 1.0,
    "tilt 10 deg, balance off": m_total * G * H_CG * math.sin(math.radians(10)) / L_AX_TIP,
    "full lean, CG 50 mm ahead of axle": m_total * G * 0.05 / L_AX_TIP,
}
ARMS = {  # name: (upper, fore, shoulder->tip horiz, elbow->load-line offset, arm mass beyond shoulder kg, its CG m)
    "Mk-III arm 190+190 mm, knee posture": (0.19, 0.19, 0.12, 0.17, 0.30, 0.13),
    "small arm 65+65 mm, strut posture": (0.065, 0.065, 0.03, 0.038, 0.20, 0.05),
}
def kgcm(nm): return nm / G * 100
# ---------------- ring drive for balancing ----------------
R_RING, R_GEAR, R_PINION, ETA = 0.105, 0.072, 0.008, 0.85
ratio = R_GEAR / R_PINION
h_cg, tilt_deg, acc = 0.05, 10, 2.0     # CG above axle (m), recover tilt, accel (m/s^2)
T_tilt = m_total * G * h_cg * math.sin(math.radians(tilt_deg))
T_acc = m_total * acc * R_RING
T_wheel = (T_tilt + T_acc) / 2          # per wheel
T_motor = T_wheel / ratio / ETA
v_max = 2.0
rpm_motor = v_max / R_RING * ratio * 60 / (2 * math.pi)

# ---------------- power / runtime ----------------
P = {"idle balance": {"BLDC x2": 6, "servo hold x12": 6, "Kakip": 7, "MCU+sensors": 1.5},
     "driving": {"BLDC x2": 25, "servo hold x12": 6, "Kakip": 8, "MCU+sensors": 1.5},
     "arm work (grounded)": {"BLDC x2": 0, "arm servos moving": 30, "Kakip": 8, "MCU+sensors": 1.5}}
E_wh = 14.8 * 3.0 * 0.8

# ---------------- deploy geometry: can a single swing arm exit the side opening? ----------------
R_OPEN, RW = 0.1075, 0.032
S = (0.087, 0.0); D = (0.155, -0.06)    # stowed / deployed ring centre (x out, y up), 50 mm clearance target
# pivot must lie directly below S so the first motion is axial: |D-P| = |S-P|
yp = (S[1] ** 2 - (D[0] - S[0]) ** 2 - D[1] ** 2) / (2 * (S[1] - D[1]))
r = S[1] - yp
beta = math.asin(min(1, RW / r))
drop_while_inside = r * (1 - math.cos(beta))

def line(k, v, unit=""):
    print(f"  {k:<48} {v}{unit}")

if __name__ == "__main__":
    print("MASS (g)")
    for k, v in MASS.items(): line(k, v)
    line("robot total", f"{m_robot:.2f} kg"); line("with payload", f"{m_total:.2f} kg")
    print("ARM AS OUTRIGGER (PTK7465 PLUS stall %.1f kg·cm; continuous <= %.1f, transient <= %.1f)" % (PTK_STALL_KGCM, PTK_STALL_KGCM * CONT_RULE, PTK_STALL_KGCM * PEAK_RULE))
    for an, (l1, l2, xs, xe, ma, mc) in ARMS.items():
        print("  " + an)
        for cn, f_total in cases.items():
            f = f_total / 2
            ts = kgcm(f * xs + ma * G * mc); te = kgcm(f * xe)
            lim = PTK_STALL_KGCM * (CONT_RULE if cn.startswith("steady") else PEAK_RULE)
            ok = "OK" if max(ts, te) <= lim else "NG"
            line("    " + cn, f"tip {f:.1f} N | shoulder {ts:.1f} / elbow {te:.1f} kg·cm  {ok}")
    print("RING DRIVE")
    line("gear ratio internal/pinion", f"{ratio:.1f}:1")
    line("per-wheel torque (tilt %d° + %.1f m/s²)" % (tilt_deg, acc), f"{T_wheel:.2f} N·m")
    line("motor torque needed", f"{T_motor * 1000:.0f} mN·m")
    line("motor speed at %.1f m/s" % v_max, f"{rpm_motor:.0f} rpm")
    print("POWER (4S 3000mAh, 80%% usable = %.1f Wh)" % E_wh)
    for k, d in P.items():
        w = sum(d.values()); line(k, f"{w:.1f} W -> {E_wh / w * 60:.0f} min")
    print("SWING-ARM DEPLOY CHECK")
    line("pivot below stowed centre", f"y = {yp * 1000:.1f} mm, radius {r * 1000:.1f} mm")
    line("drop while ring still inside opening", f"{drop_while_inside * 1000:.1f} mm")
    line("radial clearance in opening", f"{(R_OPEN - R_RING) * 1000:.1f} mm")
    line("verdict", "COLLIDES" if drop_while_inside > (R_OPEN - R_RING) else "OK")


# ================= Loop 4: drop-link actuator torque + fore/aft CG =================
def loop4():
    print("DROP-LINK ACTUATOR (per side, link %.0f mm)" % (0.07 * 1000))
    F = m_total * G / 2
    for name, y_drop in [("ring just touches floor (lifting body)", 0.014), ("deployed, 60 mm drop", 0.06)]:
        th = math.asin(y_drop / 0.07); t = F * 0.07 * math.cos(th)
        line("  " + name, f"{t:.2f} N·m = {kgcm(t):.1f} kg·cm static, x2 dynamic {kgcm(2 * t):.1f} kg·cm")
    # fore/aft CG in stance: z forward from body centre (m). axle sits at +0.034 after the leading link drops.
    AXLE_Z = 0.034
    arm = 8 * PTK7465_G + 2 * 4 * 16 + 2 * 60
    wheel = 2 * (153 + 150 + 80 + 230 + 110 + 40)
    layouts = {
        "Mk-III as drawn (battery/Kakip centred-front)": {"arms": (arm, 0.165), "wheel modules": (wheel, AXLE_Z), "deploy": (240, 0.03),
            "frame": (600, 0), "Kakip": (100, 0.08), "MCU/drivers": (120, 0.05), "battery": (330, 0), "wiring": (200, 0), "payload": (300, 0)},
        "rear electronics: battery z-86, Kakip z-80, MCU z-50": {"arms": (arm, 0.165), "wheel modules": (wheel, AXLE_Z), "deploy": (240, 0.03),
            "frame": (600, 0), "Kakip": (100, -0.08), "MCU/drivers": (120, -0.05), "battery": (330, -0.086), "wiring": (200, 0), "payload": (300, 0)},
    }
    print("FORE/AFT CG IN STANCE (axle at z=%+.0f mm, CG height above axle %.0f mm)" % (AXLE_Z * 1000, H_CG * 1000))
    for n, comp in layouts.items():
        M_ = sum(m for m, z in comp.values()); zc = sum(m * z for m, z in comp.values()) / M_
        off = zc - AXLE_Z; lean = math.degrees(math.atan2(off, H_CG))
        line("  " + n, f"CG z={zc * 1000:+.1f} mm, {off * 1000:+.1f} mm from axle -> body leans back {lean:.1f}°")

if __name__ == "__main__":
    loop4()


# ================= Loop 5: internal packaging (AABB interference) =================
# boxes: name -> (cx, cy, cz, sx, sy, sz) in body frame (m); x right/left, y up, z forward
INTERNAL = {
    "battery 2S 3000mAh #1": (0, -0.075, -0.096, 0.105, 0.035, 0.018),
    "battery 2S 3000mAh #2": (0, -0.075, -0.076, 0.105, 0.035, 0.018),
    "Kakip (vertical, behind bay)": (0, 0.07, -0.092, 0.085, 0.056, 0.022),
    "MCU + power board": (0, -0.005, -0.03, 0.09, 0.012, 0.06),
    "camera module": (0, 0.034, 0.09, 0.04, 0.04, 0.025),
    "ToF L": (-0.03, -0.085, 0.098, 0.015, 0.01, 0.01),
    "ToF R": (0.03, -0.085, 0.098, 0.015, 0.01, 0.01),
    "slide stepper L": (-0.035, 0.04, 0.0, 0.028, 0.028, 0.034),
    "slide stepper R": (0.035, 0.04, 0.0, 0.028, 0.028, 0.034),
    "IMU": (0, -0.04, 0.0, 0.02, 0.005, 0.02),
}
KEEP_OUT = {
    "ring bay L (stowed ring)": (-0.0865, 0, 0, 0.040, 0.215, 0.215),
    "ring bay R (stowed ring)": (0.0865, 0, 0, 0.040, 0.215, 0.215),
    "cargo bay (50 mm deep)": (0, 0.09, 0, 0.12, 0.05, 0.13),
    "shell walls (inner limit)": None,
}
INNER = (0.10, 0.105, 0.105)   # half extents available inside the shell

def overlap(a, b):
    return all(abs(a[i] - b[i]) * 2 < (a[i + 3] + b[i + 3]) for i in range(3))

def loop5():
    print("PACKAGING CHECK")
    bad = 0
    items = list(INTERNAL.items())
    for i, (n, a) in enumerate(items):
        for k in range(3):
            if abs(a[k]) + a[k + 3] / 2 > INNER[k] + 1e-9:
                print(f"  OUTSIDE SHELL: {n} axis {'xyz'[k]}"); bad += 1
        for m, b in items[i + 1:]:
            if overlap(a, b): print(f"  CLASH: {n} <-> {m}"); bad += 1
        for m, b in KEEP_OUT.items():
            if b and overlap(a, b): print(f"  CLASH: {n} <-> {m}"); bad += 1
    bz = (INTERNAL["battery 2S 3000mAh #1"][2] + INTERNAL["battery 2S 3000mAh #2"][2]) / 2
    print(f"  battery centre z = {bz * 1000:.0f} mm (Loop 4 assumed -100 mm)")
    print("  result:", "OK, no clashes" if not bad else f"{bad} problem(s)")

if __name__ == "__main__":
    loop5()
