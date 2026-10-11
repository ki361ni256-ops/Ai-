"""BGM と効果音をコードで作る（自作。著作権・ライセンスの心配なし）。48kHz モノラルの numpy 配列を返す。
雰囲気は 04_演出.md の BGM-A〜F・効果音の表に合わせた簡単なもの。もっと良い曲に差し替えるのは自由。
"""
import numpy as np, wave

SR = 48000
rng = np.random.default_rng(7)

def t_(sec): return np.arange(int(sec * SR)) / SR
def fade(x, a=1.0, b=1.0):
    n = len(x); fa, fb = min(int(a * SR), n // 2), min(int(b * SR), n // 2)
    if fa: x[:fa] *= np.linspace(0, 1, fa)
    if fb: x[-fb:] *= np.linspace(1, 0, fb)
    return x
def lowpass(x, k=200):
    if k <= 1: return x
    return np.convolve(x, np.ones(k) / k, mode="same")
def norm(x, peak):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak
def db(v): return 10 ** (v / 20)
def note(f0, dur, decay=1.2, harm=(1, .5, .25, .12)):
    t = t_(dur); env = np.exp(-t / decay) * np.minimum(1, t / 0.005)
    return sum(a * np.sin(2 * np.pi * f0 * (i + 1) * t) for i, a in enumerate(harm)) * env
def place(buf, x, at):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(x)); buf[i:j] += x[: j - i]

# ---------- BGM ----------
def bgm_A(sec):   # 深夜の低いドローン
    t = t_(sec)
    x = (np.sin(2*np.pi*55*t) + .6*np.sin(2*np.pi*82.4*t + 1) + .3*np.sin(2*np.pi*110.3*t)) * (0.7 + 0.3*np.sin(2*np.pi*t/9))
    x += lowpass(rng.standard_normal(len(t)), 400) * 1.2 * (0.6 + 0.4*np.sin(2*np.pi*t/13 + 2))
    return fade(norm(x, 1), 3, 3)
def bgm_B(sec):   # だんだん高まる緊張（最後はぶつ切り）
    t = t_(sec); ramp = (t / sec) ** 2
    f = 55 * (1 + 0.15 * t / sec)
    x = (np.sin(2*np.pi*np.cumsum(f)/SR) + .5*np.sin(2*np.pi*np.cumsum(f*1.5)/SR)) * (0.2 + ramp)
    x += lowpass(rng.standard_normal(len(t)), 120) * ramp * 2
    return fade(norm(x, 1), 1, 0.01)
def bgm_C(sec):   # ピアノの単音が間をあけて鳴る
    buf = np.zeros(int(sec * SR)); scale = [220, 261.6, 293.7, 329.6, 392, 440]
    at, k = 0.5, 0
    while at < sec - 3:
        place(buf, note(scale[(k * 3) % len(scale)], 4, 1.6) * 0.8, at); at += 4.5 + (k % 3); k += 1
    t = t_(sec); buf += 0.15 * np.sin(2*np.pi*110*t) * (0.5 + 0.5*np.sin(2*np.pi*t/11))
    return fade(norm(buf, 1), 2, 3)
def bgm_D(sec):   # 一定テンポの軽いミニマル（クリック＋やわらかいシンセ）
    buf = np.zeros(int(sec * SR)); beat = 60 / 100
    click = note(2000, 0.03, 0.006, (1,)) * 0.5
    arp = [261.6, 329.6, 392, 329.6]
    for i in range(int(sec / beat)):
        place(buf, click, i * beat)
        place(buf, note(arp[i % 4], beat * 2, 0.35, (1, .2)) * 0.35, i * beat)
    t = t_(sec); buf += 0.12 * (np.sin(2*np.pi*130.8*t) + np.sin(2*np.pi*196*t))
    return fade(norm(buf, 1), 1.5, 2)
def bgm_E(sec):   # 明るく穏やか（昼の散歩）
    buf = np.zeros(int(sec * SR)); beat = 60 / 92
    chords = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]]
    for i in range(int(sec / beat)):
        ch = chords[(i // 4) % 4]
        place(buf, note(ch[i % 3] * 2, beat * 1.5, 0.5, (1, .4, .15)) * 0.5, i * beat)
        if i % 4 == 0: place(buf, note(ch[0] / 2, beat * 4, 1.5, (1, .3)) * 0.5, i * beat)
    return fade(norm(buf, 1), 1.5, 2)
def bgm_F(sec):   # 思索的なアンビエント（やわらかいパッド）
    t = t_(sec); chords = [[146.8, 220, 261.6], [130.8, 196, 246.9], [110, 164.8, 220], [123.5, 185, 233.1]]
    x = np.zeros(len(t)); seg = 8.0
    for k in range(int(sec / seg) + 1):
        a, b = int(k * seg * SR), int(min((k + 1) * seg + 2, sec) * SR)
        if a >= len(t): break
        tt = t[a:b] - t[a]; env = np.minimum(1, tt / 2) * np.minimum(1, (tt[-1] - tt) / 2 + 1e-9)
        x[a:b] += sum(np.sin(2*np.pi*f*tt) + .5*np.sin(2*np.pi*f*1.003*tt) for f in chords[k % 4]) * env
    return fade(norm(lowpass(x, 30), 1), 3, 3)
BGM = dict(A=bgm_A, B=bgm_B, C=bgm_C, D=bgm_D, E=bgm_E, F=bgm_F)
BGM_LEVEL = dict(A=-27, B=-24, C=-26, D=-26, E=-25, F=-27)   # ピークの dBFS（ナレーションは -16 LUFS 前後）

# ---------- 効果音 ----------
def sfx(name):
    if name == "pop": return note(900, 0.12, 0.03, (1, .3)) * 0.6
    if name == "click": return note(2400, 0.02, 0.004, (1,)) * 0.5
    if name == "clockstop": return note(1800, 0.25, 0.04, (1, .6, .3)) * 0.9
    if name == "pin": return note(1200, 0.15, 0.05, (1, .5)) * 0.5
    if name == "tag": return lowpass(rng.standard_normal(int(.08 * SR)), 6) * np.exp(-t_(.08) / .015) * 0.6 + note(520, .08, .02, (1,)) * .4
    if name == "tick": return note(3000, 0.01, 0.003, (1,)) * 0.4
    if name == "rewind":
        t = t_(1.2); f = 300 + 1500 * (t / 1.2) ** 2
        return np.sin(2*np.pi*np.cumsum(f)/SR) * 0.25 * fade(np.ones(len(t)), .1, .2)
    if name == "paper": return lowpass(rng.standard_normal(int(.5 * SR)), 3) * np.exp(-t_(.5) / .15) * 0.5
    if name == "flip":
        buf = np.zeros(int(.8 * SR))
        for i in range(8): place(buf, lowpass(rng.standard_normal(int(.04 * SR)), 4) * .5, i * .09)
        return buf
    if name == "drum":
        buf = np.zeros(int(6 * SR))
        for k, at in enumerate([0, 1.2, 1.8, 3.0, 3.6, 4.8]):
            hit = note(70, 1.2, 0.35, (1, .4)) * 0.9
            place(buf, hit, at); place(buf, hit * 0.3, at + 0.18)   # 反響
        return lowpass(buf, 20)
    if name == "wind": return fade(lowpass(rng.standard_normal(int(6 * SR)), 300) * (0.6 + 0.4*np.sin(2*np.pi*t_(6)/3)) * 3, 1, 2)
    if name in ("train", "car"):
        d = 5 if name == "train" else 4; t = t_(d)
        x = lowpass(rng.standard_normal(len(t)), 600) * 4
        if name == "train":
            for k in range(int(d / 0.9)): x[int(k*.9*SR):int(k*.9*SR) + 2000] += np.sin(2*np.pi*90*t[:2000]) * np.exp(-t[:2000]/.02) * .8
        return fade(x * 0.5, 1, 1.5)
    raise KeyError(name)
SFX_LEVEL = -20  # 効果音のピークの目安（dBFS）

def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())

def read_wav(path):
    with wave.open(str(path)) as w:
        return np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32767

def mix(narration_wav, out_wav, bgm_sections, sfx_hits, f):
    """bgm_sections: [(記号, 台本の開始秒, 台本の終了秒)]、sfx_hits: [(名前, 台本の秒, 回数, 間隔)]
    f: 台本の秒 → 実際の秒（narrate.warp）"""
    nar = read_wav(narration_wav)
    bed = np.zeros(len(nar))
    for k, a, b in bgm_sections:
        ra, rb = f(a), f(b)
        if rb - ra < 1: continue
        place(bed, norm(BGM[k](rb - ra), db(BGM_LEVEL[k])), ra)
    for name, at, n, step in sfx_hits:
        x = norm(sfx(name), db(SFX_LEVEL))
        for i in range(n): place(bed, x, f(at) + i * step)
    write_wav(out_wav, nar + bed)


def load_audio(path):
    """mp3 などを 48kHz モノラルの配列で読む"""
    import subprocess
    raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float64) / 32767

def loop_track(x, length, xfade=3.0):
    """曲を length サンプルまで、つなぎ目を xfade 秒で重ねながら繰り返す"""
    n = int(xfade * SR); out = np.zeros(length); pos = 0
    ramp = np.linspace(0, 1, n)
    while pos < length:
        seg = x.copy()
        if pos > 0: seg[:n] *= ramp
        seg[-n:] *= ramp[::-1]
        place(out, seg, pos / SR)
        pos += len(x) - n
    return out

def duck_gain(nar, speak_db=-15.0, attack=0.08, release=0.6):
    """ナレーションが鳴っている間だけ BGM を speak_db 下げるゲイン（なめらかに上下）"""
    hop = int(0.02 * SR); n = len(nar) // hop + 1
    env = np.array([np.sqrt(np.mean(nar[i*hop:(i+1)*hop] ** 2) + 1e-12) for i in range(n)])
    talking = env > db(-40)
    g = np.ones(n); lo = db(speak_db); cur = 1.0
    a, r = np.exp(-0.02 / attack), np.exp(-0.02 / release)
    hold = 0
    for i in range(n):
        if talking[i]: hold = 15          # 0.3秒は下げたまま（言葉の切れ目でふわふわしない）
        target = lo if hold > 0 else 1.0
        hold -= 1
        k = a if target < cur else r
        cur = target + (cur - target) * k
        g[i] = cur
    return np.repeat(g, hop)[:len(nar)]

def mix_track(narration_wav, out_wav, track, sfx_hits, f, level_db=-24.0, fade_in=2.0, fade_out=4.0, pad_sec=0.0):
    """1曲を通しで流す版。曲の基準の大きさ（RMS）を level_db にそろえ、話している間は下げる"""
    nar = read_wav(narration_wav)
    if pad_sec: nar = np.concatenate([nar, np.zeros(int(pad_sec * SR))])
    x = load_audio(track)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * db(level_db)
    bed = loop_track(x, len(nar))
    bed = fade(bed, fade_in, fade_out) * duck_gain(nar)
    for name, at, n, step in sfx_hits:
        s = norm(sfx(name), db(SFX_LEVEL))
        for i in range(n): place(bed, s, f(at) + i * step)
    out = nar + bed
    peak = np.max(np.abs(out))
    if peak > 0.97: out *= 0.97 / peak
    write_wav(out_wav, out)
