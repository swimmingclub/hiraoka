"""Synthesizes an original minimal beat (120 BPM) for a video.

Usage: python3 audio.py out.wav [duration intro_end beat_stop cuts blips]
(cuts and blips are comma-separated times in seconds; defaults fit the 30s conjunction video)
"""
import sys, wave
import numpy as np

A = sys.argv[2:]
SR = 44100
DUR = float(A[0]) if A else 30.0
INTRO_END = float(A[1]) if A else 3.0
STOP = float(A[2]) if A else 28.0
rng = np.random.default_rng(7)
mix = np.zeros(int(SR * DUR))
CUTS = [float(x) for x in A[3].split(",")] if A else [3.0, 6.5, 12.5, 19.5, 25.0, 28.0]
BLIPS = [float(x) for x in A[4].split(",")] if A else [1.5, 5.1, 7.3, 9.3, 10.8, 11.2, 13.3, 16.1, 17.6, 20.3, 23.5, 28.85]


def put(sig, t, gain=1.0):
    i = int(t * SR)
    n = min(len(sig), len(mix) - i)
    if n > 0:
        mix[i:i + n] += sig[:n] * gain


def kick():
    t = np.arange(int(0.3 * SR)) / SR
    f = 45 + 110 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)


def hat(decay=90):
    t = np.arange(int(0.08 * SR)) / SR
    n = rng.standard_normal(len(t))
    return np.diff(n, prepend=0) * np.exp(-t * decay)


def bass(freq, dur=0.22):
    t = np.arange(int(dur * SR)) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t)
    return s * np.minimum(1, t * 200) * np.exp(-t * 7)


def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, mode='same')


def impact():
    t = np.arange(int(0.9 * SR)) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 20)) / SR) * np.exp(-t * 4)
    return sub + 0.5 * lowpass(rng.standard_normal(len(t)), 30) * np.exp(-t * 9)


def riser(dur=0.5):
    t = np.arange(int(dur * SR)) / SR
    return np.diff(rng.standard_normal(len(t)), prepend=0) * (t / dur) ** 3


def blip(freq):
    t = np.arange(int(0.06 * SR)) / SR
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 60)


K, H, I, R = kick(), hat(), impact(), riser()
NOTES = [55.0, 55.0, 65.41, 49.0]  # A1 A1 C2 G1, one per bar
beat = 0.5
for b in range(int(DUR / beat)):
    t = b * beat
    if t >= STOP:
        break
    full = t >= INTRO_END
    if full or b % 2 == 0:
        put(K, t, 0.9)
    put(H, t + 0.25, 0.22 if full else 0.12)
    if full:
        put(H, t + 0.125, 0.08)
        put(H, t + 0.375, 0.08)
        f = NOTES[(b // 4) % 4]
        put(bass(f), t + 0.25, 0.45)
        if b % 4 == 3:
            put(bass(f * 2, 0.12), t + 0.375, 0.3)
for c in CUTS:
    put(R, c - 0.5, 0.25)
    put(I, c, 0.9)
# UI blips where key words get highlighted
for t in BLIPS:
    put(blip(1760), t, 0.18)

fade = np.ones(len(mix))
n = int(1.2 * SR)
fade[-n:] = np.linspace(1, 0, n) ** 2
mix = np.tanh(mix * 0.9) * fade * 0.85
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
