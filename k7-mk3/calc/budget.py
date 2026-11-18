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

# ---------------- arm load when used as outrigger ----------------
ARM_SELF_KG, ARM_CG_M = 0.30, 0.13     # arm beyond the shoulder (incl. elbow/wrist servos)
SHARE = 0.25                           # worst-case share of robot weight on one arm tip
F_tip = SHARE * m_total * G
def shoulder_nm(tip_horiz_m):
    return F_tip * tip_horiz_m + ARM_SELF_KG * G * ARM_CG_M
poses = {"Mk-III stance (tip 0.26 m ahead)": 0.26, "A5: forearm vertical (tip 0.12 m ahead)": 0.12}

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
    print("ARM SHOULDER PITCH LOAD (one arm carries %d%% of weight)" % (SHARE * 100))
    for k, x in poses.items():
        t = shoulder_nm(x); line(k, f"{t:.2f} N·m = {t / G * 100:.1f} kg·cm, x1.5 = {t * 1.5 / G * 100:.1f} kg·cm")
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
