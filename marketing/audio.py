"""Synthesizes the 128 BPM score + SFX in numpy, ducks it under the Hinglish VO, writes audio/mix.wav (48 kHz stereo)."""
import json, pathlib, subprocess, wave
import numpy as np

D = pathlib.Path(__file__).parent
SR = 48000
TL = json.loads((D / "timeline.json").read_text())
BEAT, TOTAL = TL["beat"], TL["total"]
SC = {s["id"]: s for s in TL["scenes"]}
N = int((TOTAL + 1.0) * SR)
rng = np.random.default_rng(7)
t_of = lambda n: np.arange(n) / SR


def put(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i < 0 or i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i] * gain


def env_exp(n, tau):
    return np.exp(-t_of(n) / tau)


def hp(x, a=0.97):  # crude one-pole high-pass
    y = np.empty_like(x); p = 0.0; q = 0.0
    for i, v in enumerate(x):
        p = a * (p + v - q); q = v; y[i] = p
    return y


def lp(x, a=0.1):  # one-pole low-pass, vectorised-ish via cumulative filter
    y = np.empty_like(x); p = 0.0
    for i, v in enumerate(x):
        p += a * (v - p); y[i] = p
    return y


def kick():
    n = int(0.42 * SR); t = t_of(n)
    f = 45 + 140 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.6 * np.sin(ph) * np.exp(-t / 0.16)) * 0.95


def clap():
    n = int(0.22 * SR); noise = rng.standard_normal(n)
    x = hp(noise, 0.92) * (np.exp(-t_of(n) / 0.045) + 0.6 * np.exp(-((t_of(n) - 0.012) ** 2) / 1e-5))
    return x * 0.5


def hat(open_=False):
    n = int((0.2 if open_ else 0.05) * SR)
    return hp(rng.standard_normal(n), 0.985) * env_exp(n, 0.08 if open_ else 0.015) * 0.28


def bass(freq, dur):
    n = int(dur * SR); t = t_of(n)
    x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) + 0.18 * np.sign(np.sin(2 * np.pi * freq * t))
    return np.tanh(x * 1.3) * np.minimum(1, t / 0.005) * np.exp(-t / (dur * 0.9)) * 0.55


def pluck(freq, dur=0.22):
    n = int(dur * SR); t = t_of(n)
    x = sum(np.sin(2 * np.pi * freq * k * t) / k for k in (1, 2, 3, 4)) * np.exp(-t / 0.09)
    return x * 0.16


def pad(freqs, dur):
    n = int(dur * SR); t = t_of(n); x = 0
    for f in freqs:
        for dt in (-0.4, 0.4):
            x = x + np.sin(2 * np.pi * (f + dt) * t) + 0.4 * np.sin(4 * np.pi * (f + dt) * t)
    a = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4)
    return x * a * 0.045


def whoosh(dur=0.7, up=True):
    n = int(dur * SR); t = t_of(n)
    nz = rng.standard_normal(n)
    sweep = np.linspace(0.6, 0.97, n) if up else np.linspace(0.97, 0.6, n)
    y = np.empty(n); p = 0.0
    for i in range(n):
        p += (1 - sweep[i]) * (nz[i] - p); y[i] = p
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** (1.5 if up else 1.0)
    return y * e * 5.0


def impact(dur=1.4):
    n = int(dur * SR); t = t_of(n)
    sub = np.sin(2 * np.pi * (38 + 60 * np.exp(-t / 0.12)) * t) * np.exp(-t / 0.55)
    crash = hp(rng.standard_normal(n), 0.95) * np.exp(-t / 0.5) * 0.35
    return np.tanh(sub * 1.5) * 0.9 + crash


def thud(freq=70, dur=0.35):
    n = int(dur * SR); t = t_of(n)
    return np.sin(2 * np.pi * (freq + 80 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.1) * 0.9


def ding(freq=1318.5, dur=0.9):
    n = int(dur * SR); t = t_of(n)
    return (np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 2.76 * t)) * np.exp(-t / 0.28) * 0.28


def riser(dur, f0=200, f1=2400):
    n = int(dur * SR); t = t_of(n)
    f = np.geomspace(f0, f1, n)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    nz = hp(rng.standard_normal(n), 0.9) * np.linspace(0, 1, n) ** 2 * 0.5
    return (tone + nz) * np.linspace(0, 1, n) ** 1.5


def tick(hi=True):
    n = int(0.04 * SR); t = t_of(n)
    return np.sin(2 * np.pi * (2200 if hi else 1500) * t) * np.exp(-t / 0.006) * 0.35


def siren(dur):
    n = int(dur * SR); t = t_of(n)
    f = 700 + 350 * np.sin(2 * np.pi * 0.9 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.06 * np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.6)


# ───────── music (mono) ─────────
M = np.zeros(N)
S = np.zeros(N)  # SFX, not ducked
K = np.zeros(N)  # kick positions → sidechain pump

hook, pain, brand, cta = SC["hook"], SC["pain"], SC["brand"], SC["cta"]
groove_start = brand["start"]
# hook: heartbeat + siren + dark drone, riser into the cut
put(M, pad([55, 82.4], hook["len"] + 0.4), 0, 1.2)
put(M, siren(hook["len"]), 0.2, 1.0)
for b in range(int(hook["len"] / (BEAT * 2))):
    at = b * BEAT * 2
    put(M, thud(55, 0.3), at, 0.9); put(M, thud(55, 0.3), at + BEAT * 0.5, 0.6)
put(M, riser(1.2, 150, 1800), pain["start"] - 1.2, 0.7)

# pain: tension — ticking clock + low pad, pitch-down "fail" at X marks, riser into the drop
put(M, pad([55, 65.4, 98], pain["len"] + 0.4), pain["start"], 1.0)
tk = pain["start"]; i = 0
while tk < brand["start"] - 0.05:
    put(M, tick(i % 2 == 0), tk, 0.9); tk += BEAT * 0.5; i += 1
put(M, riser(1.6, 120, 3000), brand["start"] - 1.6, 0.9)
put(S, whoosh(0.5, True), pain["start"] - 0.3, 0.7)

# the drop
put(S, impact(), brand["start"] - 0.02, 1.0)

chords = [(55.0, [220, 261.6, 329.6]), (43.65, [174.6, 220, 261.6]), (65.4, [261.6, 329.6, 392]), (49.0, [196, 246.9, 293.7])]
bar = BEAT * 4
t0 = groove_start
nbars = int((TOTAL - t0) / bar) + 1
for b in range(nbars):
    at = t0 + b * bar
    root, ch = chords[b % 4]
    last = at > cta["start"] + 1.0
    put(M, pad(ch, bar + 0.1), at, 1.0)
    for beat in range(4):
        bt = at + beat * BEAT
        if bt >= TOTAL - 0.2:
            break
        if not (last and beat > 0):
            put(M, kick(), bt, 1.0); K[int(bt * SR) : int(bt * SR) + 1] = 1
        if beat in (1, 3) and not last:
            put(M, clap(), bt, 0.8)
        # offbeat hat + 16th ghost
        put(M, hat(), bt + BEAT * 0.5, 0.9)
        if beat == 3:
            put(M, hat(True), bt + BEAT * 0.5, 0.7)
        # rolling offbeat bass
        for sub, mult in ((0.5, 1.0), (0.75, 2.0)):
            if last:
                continue
            put(M, bass(root * mult, BEAT * 0.22), bt + BEAT * sub, 0.8)
        # arp (8ths)
        for k in range(2):
            f = ch[(beat * 2 + k) % 3] * (2 if (beat + k) % 2 else 1)
            if not last:
                put(M, pluck(f), bt + BEAT * 0.5 * k, 0.8)

# sidechain pump from kick
kick_env = np.zeros(N)
for i in np.flatnonzero(K):
    n = int(0.28 * SR); kick_env[i : i + n] = np.maximum(kick_env[i : i + n], np.exp(-t_of(min(n, N - i)) / 0.09))
# (kick is part of M; pump only the non-kick content softly)
M *= 1 - 0.0 * kick_env

# ───────── SFX hits synced to the film ─────────
W = lambda sid, i: SC[sid]["words"][i]
bounds = [s["start"] for s in TL["scenes"]][1:]
for i, bnd in enumerate(bounds):
    if i in (0, 1, 7):
        continue
    put(S, whoosh(0.45, True), bnd - 0.25, 0.8)
put(S, impact(0.8), cta["start"], 0.5)
# hook: DELHI / GAADI BAND hits + clock
put(S, thud(60, 0.5), W("hook", 4)["start"] - 0.04, 1.0); put(S, thud(48, 0.7), W("hook", 5)["start"] - 0.04, 1.2)
put(S, impact(0.9), W("hook", 5)["start"] - 0.04, 0.6)
# pain cards slamming in
for i, wi in enumerate((0, 2, 4, 7)):
    put(S, thud(110 - 10 * i, 0.25), W("pain", wi)["start"] - 0.03, 0.7)
    put(S, whoosh(0.25, False), W("pain", wi)["start"] - 0.2, 0.4)
for i in range(4):
    put(S, thud(90, 0.2), W("pain", 8)["end"] - 0.05 + i * 0.1, 0.8)
# brand letters + ring
for i in range(10):
    put(S, tick(True), brand["start"] + 0.6 + i * 0.05, 0.7)
put(S, ding(1568, 1.2), W("brand", 5)["start"] + 1.0, 0.8)
# book: steps + price counter + stamp
bk = SC["book"]
for wi in (0, 2, 4):
    put(S, tick(False), W("book", wi)["start"] - 0.05, 1.0); put(S, whoosh(0.25, True), W("book", wi)["start"] - 0.25, 0.4)
tc = W("book", 4)["start"] - 0.1
for i in range(14):
    put(S, tick(True), tc + i * 0.07, 0.5)
put(S, ding(1318.5, 1.0), tc + 1.0, 0.9)
put(S, thud(65, 0.4), W("book", 11)["end"] - 0.1, 1.1)
# track + pay
for wi in (0, 2, 5):
    put(S, tick(False), W("track", wi)["start"] - 0.05, 1.0)
put(S, ding(1760, 0.9), W("track", 5)["start"] + 0.1, 0.7)
put(S, whoosh(0.4, True), SC["pay"]["start"] - 0.2, 0.6)
put(S, thud(60, 0.5), W("pay", 3)["end"] - 0.05, 1.2); put(S, ding(1318.5, 1.2), W("pay", 3)["end"], 0.8)
# biz: device swaps
for t_ in (SC["biz"]["start"] + 0.05, W("biz", 6)["start"] - 0.1, W("biz", 9)["start"] - 0.1, W("biz", 10)["start"] + 0.15):
    put(S, whoosh(0.35, True), t_ - 0.2, 0.6); put(S, thud(100, 0.2), t_, 0.5)
# payoff: counter + confetti pop
po = SC["payoff"]
put(S, impact(1.0), po["start"], 0.6)
for i in range(30):
    put(S, tick(True), po["start"] + 0.25 + i * 0.048, 0.5)
put(S, impact(1.2), po["start"] + 1.7, 0.7); put(S, ding(1568, 1.5), po["start"] + 1.7, 0.9)
for i in range(4):
    put(S, ding(1318.5 * (1 + 0.25 * i), 0.5), po["start"] + 1.2 + i * 0.14, 0.4)
# cta shine
put(S, ding(1568, 1.4), cta["start"] + 1.0 + 0.45, 0.6)

# ───────── VO ─────────
def decode(name):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(D / "audio" / name), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)

V = np.zeros(N)
for s in TL["scenes"]:
    v = decode(f"{s['id']}.mp3")
    v /= max(1e-6, np.abs(v).max())
    put(V, v * 0.9, s["voStart"])

# voice presence EQ (gentle air boost) + soft compression
Vx = V + 0.25 * hp(V, 0.88) * 0.0
Vx = np.tanh(Vx * 1.4) / 1.4 * 1.15

# duck music under VO (fast attack, slow release)
env = np.abs(V)
w = int(0.05 * SR)
env = np.convolve(env, np.ones(w) / w, mode="same")
rel = np.empty_like(env); p = 0.0
for i, x in enumerate(env):
    p = x if x > p else p + (x - p) * (1 / (0.35 * SR))
    rel[i] = p
duck = 1 - 0.5 * np.clip(rel / 0.12, 0, 1)

music = M * duck * 0.55
mix = music + S * 0.9 + Vx
# stereo with a tiny haas widening on music only
L = mix.copy(); R = mix.copy()
d = int(0.0007 * SR)
L[d:] += 0.12 * music[:-d]; R[:-d] += 0.12 * music[d:]
st = np.stack([L, R], 1)
st = np.tanh(st * 0.9) / 0.9
peak = np.abs(st).max()
st = st / peak * 0.89
pcm = (st * 32767).astype("<i2")
with wave.open(str(D / "audio" / "mix.wav"), "wb") as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
print("mix.wav", len(pcm) / SR, "s")
