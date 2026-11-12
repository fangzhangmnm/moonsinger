#!/usr/bin/env python3
# fluidsynth-reference.py —— 用标准播放器（FluidSynth）出「每件乐器 × 八档力度」的响度对照表（施工单 9-4，2026-11-12；created by Claude Opus 5.5（MoonSinger小弟））。
#   为什么：user 2026-11-12「我们现在放出来的各件乐器之间的轻重，是不是这个库作者本来的意思」→「真正该对齐的是：我们的引擎和标准播放器 对齐」。
#   我们的引擎（vendor/tsf/，打了 patch-tsf.py 补丁 2）照 FluidSynth 的源码算初始衰减和库自带的力度曲线；这张表是尺子，scripts/compare-fluidsynth.mjs 拿我们的引擎同样量、对比。
#   FluidSynth 不进仓、不是 app 的依赖：这台机器上的系统库（Ubuntu libfluidsynth3）用 ctypes 调。重出：
#     python3 -I scripts/fluidsynth-reference.py --sf2=<整包或子集.sf2> --cases=gs|fixtures --out=<表.json>
#   测试用的那一份 = test/fixtures/sf2/fluidsynth-reference.json（--cases=fixtures，对 test/fixtures/sf2/ 里的子集各出一遍，见 --sf2 可以给多个）。
#   设置：48 kHz、增益 1.0、混响 / 合唱关；每个音一台新的播放器（前一个音的尾巴不混进来）；按住 2 秒不松；左右相加 ÷ √2（我们的引擎是单声道）。
#   默认的「力度 → 滤波器」调制器拿掉：FluidSynth 现在的源码里它已经不起作用（fluid_mod.c fluid_mod_get_value：「S. Christian Collins' mod」直接回 0），
#   这台机器的 2.3.4 还起作用（下面 --keep-vel2filter 可以留着它对比）；我们的引擎也不认。
#   量法：ITU-R BS.1770 的 K 加权（48 kHz 的系数）+ 最大瞬时响度（400 ms 窗、100 ms 一跳）；997 Hz 满幅正弦自检 = −3.01。
import argparse, ctypes as C, hashlib, json, math, os, sys
import numpy as np

SR = 48000; N = SR * 2
VELS = [16, 33, 49, 64, 80, 96, 112, 126]   # 力度表（src/format/performance.ts DYNAMICS_VEL：ppp … fff）
# 整包（GeneralUser GS 2.0.3）：统筹 11-12 那一批 + 库里力度深度不一样的几件 + 用别的调制器的（键号 → 衰减、线性 / 正向的力度 → 衰减）
GS = [("钢琴", 0, 0, 60), ("电钢琴", 0, 4, 60), ("大键琴（700）", 0, 6, 60), ("钟琴", 0, 9, 84), ("木琴", 0, 13, 72), ("风琴（700）", 0, 19, 60),
      ("音轮风琴不随力度（0）", 11, 16, 60), ("大键琴不随力度（100）", 11, 6, 60), ("尼龙吉他", 0, 24, 55), ("电贝斯", 0, 33, 36), ("小提琴", 0, 40, 69),
      ("大提琴", 0, 42, 48), ("弦乐合奏", 0, 48, 60), ("合唱 Aah", 0, 52, 60), ("人声 Ooh", 0, 53, 60), ("小号（700）", 0, 56, 67), ("圆号", 0, 60, 55),
      ("萨克斯", 0, 65, 60), ("双簧管", 0, 68, 67), ("单簧管", 0, 71, 60), ("长笛", 0, 73, 72), ("口哨（键号 → 衰减）", 0, 78, 79),
      ("军鼓", 128, 0, 38), ("底鼓", 128, 0, 36), ("闭镲", 128, 0, 42), ("吊镲", 128, 0, 49), ("军鼓（Standard 3）", 128, 2, 38), ("底鼓（Standard 3）", 128, 2, 36)]
# 仓里的子集（test/fixtures/sf2/）：每个文件里有哪几个预设
FIXTURES = [("Sine Wave", 8, 80, 69), ("Square Lead", 0, 80, 69), ("Castanets", 8, 115, 60), ("Tonewheel Org noVel", 11, 16, 60)]

fs = C.CDLL("libfluidsynth.so.3"); V = C.c_void_p
fs.fluid_version_str.restype = C.c_char_p
fs.new_fluid_settings.restype = V; fs.delete_fluid_settings.argtypes = [V]; fs.new_fluid_synth.restype = V; fs.new_fluid_synth.argtypes = [V]; fs.delete_fluid_synth.argtypes = [V]
fs.fluid_settings_setnum.argtypes = [V, C.c_char_p, C.c_double]; fs.fluid_settings_setint.argtypes = [V, C.c_char_p, C.c_int]
fs.fluid_synth_sfload.argtypes = [V, C.c_char_p, C.c_int]; fs.fluid_synth_program_select.argtypes = [V, C.c_int, C.c_int, C.c_int, C.c_int]
fs.fluid_synth_noteon.argtypes = [V, C.c_int, C.c_int, C.c_int]; fs.fluid_synth_write_float.argtypes = [V, C.c_int, V, C.c_int, C.c_int, V, C.c_int, C.c_int]
fs.new_fluid_mod.restype = V; fs.fluid_mod_set_source1.argtypes = [V, C.c_int, C.c_int]; fs.fluid_mod_set_source2.argtypes = [V, C.c_int, C.c_int]
fs.fluid_mod_set_dest.argtypes = [V, C.c_int]; fs.fluid_mod_set_amount.argtypes = [V, C.c_double]; fs.fluid_synth_remove_default_mod.argtypes = [V, V]
VEL2FILTER = fs.new_fluid_mod()   # fluid_synth.c default_vel2filter_mod：来源 1 = 力度（线性、单极、负向），来源 2 = 力度（开关、单极、正向），目的 = 滤波器截止，−2400
fs.fluid_mod_set_source1(VEL2FILTER, 2, 0 | 0 | 0 | 1); fs.fluid_mod_set_source2(VEL2FILTER, 2, 0 | 12 | 0 | 0); fs.fluid_mod_set_dest(VEL2FILTER, 8); fs.fluid_mod_set_amount(VEL2FILTER, -2400)

def render(path, bank, prog, key, vel, keep_vel2filter):
    st = fs.new_fluid_settings()
    fs.fluid_settings_setnum(st, b"synth.sample-rate", float(SR)); fs.fluid_settings_setnum(st, b"synth.gain", 1.0)
    fs.fluid_settings_setint(st, b"synth.reverb.active", 0); fs.fluid_settings_setint(st, b"synth.chorus.active", 0)
    sy = fs.new_fluid_synth(st)
    if not keep_vel2filter: fs.fluid_synth_remove_default_mod(sy, VEL2FILTER)
    sid = fs.fluid_synth_sfload(sy, path.encode(), 0); ch = 9 if bank == 128 else 0
    if fs.fluid_synth_program_select(sy, ch, sid, bank, prog) != 0: raise SystemExit(f"没有这个预设 {bank}:{prog}（{path}）")
    fs.fluid_synth_noteon(sy, ch, key, vel)
    L = (C.c_float * N)(); R = (C.c_float * N)(); fs.fluid_synth_write_float(sy, N, L, 0, 1, R, 0, 1)
    fs.delete_fluid_synth(sy); fs.delete_fluid_settings(st)
    return (np.frombuffer(L, dtype=np.float32).astype(np.float64) + np.frombuffer(R, dtype=np.float32)) / math.sqrt(2)

def biquad(x, b0, b1, b2, a1, a2):
    y = np.empty_like(x); x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v
    return y
def max_momentary(x):
    k = biquad(biquad(x, 1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585), 1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621)
    W = int(0.4 * SR); H = int(0.1 * SR); c = np.concatenate([[0.0], np.cumsum(k * k)])
    return max(-0.691 + 10 * math.log10((c[s + W] - c[s]) / W + 1e-30) for s in range(0, len(k) - W + 1, H))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--sf2", action="append", required=True); ap.add_argument("--cases", choices=["gs", "fixtures"], default="gs")
    ap.add_argument("--out", required=True); ap.add_argument("--keep-vel2filter", action="store_true"); a = ap.parse_args()
    check = max_momentary(np.sin(2 * math.pi * 997 * np.arange(SR) / SR))
    assert abs(check + 3.01) < 0.02, f"响度量法自检没过：{check:.3f}"
    out = {"fluidsynth": fs.fluid_version_str().decode(), "settings": {"sampleRate": SR, "gain": 1.0, "reverb": False, "chorus": False, "seconds": N / SR,
           "freshSynthPerNote": True, "mix": "(L+R)/sqrt2", "defaultVel2Filter": a.keep_vel2filter, "measure": "BS.1770 K-weighted max momentary (400 ms, 100 ms hop)"},
           "velocities": VELS, "files": []}
    for path in a.sf2:
        data = open(path, "rb").read(); cases = GS if a.cases == "gs" else [c for c in FIXTURES if c[0] in data.decode("latin1")]
        rows = []
        for label, bank, prog, key in cases:
            lufs = [round(max_momentary(render(path, bank, prog, key, v, a.keep_vel2filter)), 3) for v in VELS]
            rows.append({"label": label, "bank": bank, "program": prog, "key": key, "lufs": lufs}); print(label, lufs, file=sys.stderr)
        out["files"].append({"name": os.path.basename(path), "sha256": hashlib.sha256(data).hexdigest(), "cases": rows})
    json.dump(out, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

if __name__ == "__main__": main()
