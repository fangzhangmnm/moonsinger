#!/usr/bin/env python3
# patch-tsf.py —— 编之前给 tsf.h 的副本打我们的补丁（原件在家族检疫桶里，不动）。created 2026-11-08 by Claude Fable 5.1
# 用法：python3 patch-tsf.py <tsf.h 的副本>（build-tsf.sh 调）。每处替换都要求原文恰好出现一次，否则报错停下（上游变了 = 人来看）。
#
# 补丁 1：音量在一块里线性过渡（只改单声道那条渲染路——我们只用 TSF_MONO，见 tsf-glue.c）
#   上游每 64 个采样（TSF_RENDER_EFFECTSAMPLEBLOCK）开头取一次音量、整块用这个值，包络走得快的时候（收音 80 ms 的音色 = 每块掉 14%）
#   出来是一级一级的台阶，听起来是收音时的「静电噪音」。user 2026-11-08（真机，GS 的 Ocarina 顶埙）：「松手的一瞬间就杂音了」
#   「就是那种静电噪音似的那种…我怀疑是那种突然切断导致的」「我换成笛子之后就没有，用埙就有」。
#   量（48 kHz，GS 0:79 Ocarina，每个键 × 3 种力度 × 5 种时长 = 735 种）：松手后的二阶差分尖峰最多是按住时的 57 倍、603 种超标；补丁后见 SOURCE.md。
#   改法：包络已经在这一块开头推进到了块尾（ampenv.level = 块尾的值），所以从「块头的音量」线性滑到「块尾的音量」。
import sys
EXPECT_SHA256 = "70d55963c98f60ebb81518eaa1f25d46888d5180eb5f5289fd6b74ffc177d197"   # tsf.h v0.9（检疫桶里那一份）；不一样 = 只警告，下面的替换对不上才停

def main(path: str) -> None:
    import hashlib
    raw = open(path, "rb").read()
    if hashlib.sha256(raw).hexdigest() != EXPECT_SHA256: print("patch-tsf: warning: tsf.h is not the copy this patch was written against", file=sys.stderr)
    s = raw.decode("utf-8"); crlf = "\r\n" in s
    if crlf: s = s.replace("\r\n", "\n")
    def rep(old: str, new: str) -> None:
        nonlocal s
        if s.count(old) != 1: sys.exit(f"patch-tsf: expected exactly one match, found {s.count(old)}:\n{old}")
        s = s.replace(old, new)
    rep("\t\tfloat gainMono, gainLeft, gainRight;\n", "\t\tfloat gainMono, gainLeft, gainRight, gainStep;   // [MoonSinger] gainStep: see TSF_MONO below\n")
    rep("""\t\t\tcase TSF_MONO:
\t\t\t\twhile (blockSamples-- && tmpSourceSamplePosition < tmpSampleEndDbl)
""", """\t\t\tcase TSF_MONO:
\t\t\t\t// [MoonSinger patch 1, 2026-11-08] Ramp the gain linearly from this block's start level to its end level.
\t\t\t\t// Upstream holds the block-start gain for the whole block, so a fast envelope (e.g. an 80 ms release) comes out as a
\t\t\t\t// staircase = audible zipper noise. ampenv.level was already advanced to the end of this block above.
\t\t\t\tgainStep = (noteGain * v->ampenv.level - gainMono) / (float)blockSamples;
\t\t\t\twhile (blockSamples-- && tmpSourceSamplePosition < tmpSampleEndDbl)
""")
    rep("""\t\t\t\t\t*outL++ += val * gainMono;
""", """\t\t\t\t\t*outL++ += val * gainMono;
\t\t\t\t\tgainMono += gainStep;   // [MoonSinger patch 1]
""")
    if crlf: s = s.replace("\n", "\r\n")
    open(path, "wb").write(s.encode("utf-8"))
    print("patch-tsf: 1 patch applied (gain ramp, TSF_MONO)")

if __name__ == "__main__": main(sys.argv[1])
