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
#
# 补丁 2：初始衰减照标准播放器（FluidSynth）算（施工单 ai-docs/20261111-score-surface-construction-plan.md 9-4，2026-11-12；edited by Claude Opus 5.5）
#   user 2026-11-12：「我们现在放出来的各件乐器之间的轻重，是不是这个库作者本来的意思。对我也在担心这个」→ 点头「真正该对齐的是：我们的引擎和标准播放器 对齐」。
#   上游两处和 FluidSynth（3ac3b3b4c3e2 的源码逐行对过，位置写在施工记录）不一样：
#   ① 发生器「初始衰减」上游按每 cB 0.01 dB 算；FluidSynth 载入时乘 EMU_ATTENUATION_FACTOR 0.4（fluid_defsfont.c 33 / 1465：声卡当年的做法）= 每 cB 0.04 dB。
#      只乘在发生器的值上（预设一级 + 乐器一级相加之后），调制器的输出不乘；发生器 + 调制器的和最后夹在 0–1440 cB（fluid_voice.c）。
#   ② 上游不读调制器，力度只按一次方乘（gainToDecibels(1/vel)）。FluidSynth：默认「力度 → 初始衰减」960 cB（来源 0x0502 = 力度、负向、单极、凹），
#      乐器一级同源同目的的盖掉它的量（区里的盖过全局区的），预设一级的加在上面（量 0 跳过；fluid_defsfont.c 745–875、fluid_voice.c 1505–1550），
#      同源 = 两个来源都一样、不看变换（fluid_mod.c fluid_mod_test_identity）。凹曲线 = 表 −(400/960)·log10((127−i)/127)、两头 0 / 1、整数点之间线性插、
#      单极时夹到 127/128（fluid_conv.c fluid_concave、fluid_mod.c fluid_mod_transform_source_value）。
#      所以量 A 的库：衰减 = A ÷ 960 × 40 × log10(127 ÷ 力度) dB（A = 960 = 音量按力度的平方）。
#   这里只认目的 = 初始衰减、来源是力度 / 键号 / 无的调制器（敲下去那一刻就定了的）；来源是 MIDI 控制器、触后、弯音的跳过——这个引擎没有通道状态，
#   FluidSynth 的通道音量 100/127（约 −4 dB，所有乐器一样）也就不学。别的目的（力度 → 滤波器等）照旧不认。
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
    # ---- 补丁 2：初始衰减照 FluidSynth ----
    rep("""struct tsf_region
{
	int loop_mode;
""", """// [MoonSinger patch 2, 2026-11-12] A modulator whose destination is initial attenuation (see tsf_attmod_* below).
#define TSF_ATTMOD_MAX 8
struct tsf_attmod { tsf_u16 src, amtSrc, trans; float amount; };

struct tsf_region
{
	int loop_mode;
""")
    rep("""	float delayVibLFO;
	int freqVibLFO, vibLfoToPitch;
};
""", """	float delayVibLFO;
	int freqVibLFO, vibLfoToPitch;
	int attModNum; struct tsf_attmod attMod[TSF_ATTMOD_MAX];   // [MoonSinger patch 2] attenuation modulators (zone list while loading, merged list after tsf_attmod_finalize)
};
""")
    rep("""						case GEN_FLOAT_LIMITATTN:  vfactor =  0.01f; vmin =      0.0f; vmax =   14.4f; break;
""", """						case GEN_FLOAT_LIMITATTN:  vfactor =  0.04f; vmin =   -144.0f; vmax =  144.0f; break;   // [MoonSinger patch 2] FluidSynth: cB x 0.4 (EMU_ATTENUATION_FACTOR) = 0.04 dB per cB; the 0..144 dB clamp is on the total with modulators (tsf_region_attenuation)
""")
    rep("""static void tsf_region_operator(struct tsf_region* region, tsf_u16 genOper, union tsf_hydra_genamount* amount, struct tsf_region* merge_region)
""", """// [MoonSinger patch 2, 2026-11-12] Attenuation modulators, the FluidSynth way (fluid_defsfont.c / fluid_voice.c / fluid_mod.c / fluid_conv.c).
// Same zone: an identical modulator (same two source operators; transform not compared) replaces the earlier / the global zone's one.
static void tsf_attmod_put(struct tsf_region* r, tsf_u16 src, tsf_u16 amtSrc, tsf_u16 trans, short amount)
{
	int i; float a = (float)amount;
	if (trans != 0 && trans != 2) { a = 0.0f; trans = 0; }   // only linear / absolute value exist; FluidSynth disables the modulator
	for (i = 0; i < r->attModNum; i++) if (r->attMod[i].src == src && r->attMod[i].amtSrc == amtSrc) { r->attMod[i].trans = trans; r->attMod[i].amount = a; return; }
	if (r->attModNum < TSF_ATTMOD_MAX) { struct tsf_attmod* m = &r->attMod[r->attModNum++]; m->src = src; m->amtSrc = amtSrc; m->trans = trans; m->amount = a; }
}
// Default velocity -> attenuation (SF2.01 8.4.1: 0x0502 = velocity, negative, unipolar, concave; 960 cB); the instrument level supersedes
// an identical one (only the amount), the preset level adds (amount 0 skipped). Result replaces zone's list.
static void tsf_attmod_finalize(struct tsf_region* zone, const struct tsf_region* preset)
{
	struct tsf_attmod out[TSF_ATTMOD_MAX]; int n = 1, i, j;
	out[0].src = 0x0502; out[0].amtSrc = 0; out[0].trans = 0; out[0].amount = 960.0f;
	for (i = 0; i < zone->attModNum; i++)
	{
		const struct tsf_attmod* m = &zone->attMod[i];
		for (j = 0; j < n; j++) if (out[j].src == m->src && out[j].amtSrc == m->amtSrc) break;
		if (j < n) out[j].amount = m->amount; else if (n < TSF_ATTMOD_MAX) out[n++] = *m;
	}
	for (i = 0; i < preset->attModNum; i++)
	{
		const struct tsf_attmod* m = &preset->attMod[i];
		if (m->amount == 0.0f) continue;
		for (j = 0; j < n; j++) if (out[j].src == m->src && out[j].amtSrc == m->amtSrc) break;
		if (j < n) out[j].amount += m->amount; else if (n < TSF_ATTMOD_MAX) out[n++] = *m;
	}
	for (i = 0; i < n; i++) zone->attMod[i] = out[i];
	zone->attModNum = n;
}
static float tsf_attmod_ctab(int i) { return (i <= 0 ? 0.0f : (i >= 127 ? 1.0f : (float)(-400.0 / 960.0 * TSF_LOG10((127.0 - i) / 127.0)))); }
static float tsf_attmod_concave(float x) { int i = (int)x; if (x < 0.0f) return 0.0f; if (i >= 127) return 1.0f; return tsf_attmod_ctab(i) + (tsf_attmod_ctab(i + 1) - tsf_attmod_ctab(i)) * (x - (float)i); }
static float tsf_attmod_vtab(int i) { return (i <= 0 ? 0.0f : (i >= 127 ? 1.0f : 1.0f - tsf_attmod_ctab(127 - i))); }
static float tsf_attmod_convex(float x) { int i = (int)x; if (x < 0.0f) return 0.0f; if (i >= 127) return 1.0f; return tsf_attmod_vtab(i) + (tsf_attmod_vtab(i + 1) - tsf_attmod_vtab(i)) * (x - (float)i); }
// A source operator mapped to its normalized value (fluid_mod_transform_source_value, range 128). *ok = 0 = a source this engine has no state for.
static float tsf_attmod_map(tsf_u16 op, int key, float midiVel, int* ok)
{
	int index = op & 0x7F, type = op >> 10; float n, inv, v; const float top = 127.0f / 128.0f;
	if (op & 0x80) { *ok = 0; return 0.0f; }   // MIDI CC
	if (index == 0) return 1.0f;               // no controller
	if (index == 2) v = midiVel; else if (index == 3) v = (float)key; else { *ok = 0; return 0.0f; }
	if (type > 3) { *ok = 0; return 0.0f; }
	n = v / 128.0f; inv = 1.0f - 1.0f / 128.0f - n;
	if (!(op & 0x200))
	{
		v = ((op & 0x100) ? inv : n);
		if (type == 1) { v = tsf_attmod_concave(128.0f * v); if (v > top) v = top; }
		else if (type == 2) { v = tsf_attmod_convex(128.0f * v); if (v > top) v = top; }
		else if (type == 3) v = (v >= 0.5f ? 1.0f : 0.0f);
	}
	else
	{
		float b = ((op & 0x100) ? inv : n);
		v = (b == top ? b : -1.0f + 2.0f * b);
		if (type == 1) { if (v >= 0.0f) { v = tsf_attmod_concave(128.0f * v); if (v > top) v = top; } else v = -tsf_attmod_concave(-128.0f * v); }
		else if (type == 2) { if (v >= 0.0f) { v = tsf_attmod_convex(128.0f * v); if (v > top) v = top; } else v = -tsf_attmod_convex(-128.0f * v); }
		else if (type == 3) v = (v >= 0.0f ? 1.0f : -1.0f);
	}
	return v;
}
// Total initial attenuation in dB for this key / velocity (vel 0..1): generators + modulators, clamped to 0..1440 cB like fluid_voice.c.
static float tsf_region_attenuation(const struct tsf_region* r, int key, float vel)
{
	float cb = 0.0f, db, midiVel = vel * 127.0f; int i;
	for (i = 0; i < r->attModNum; i++)
	{
		const struct tsf_attmod* m = &r->attMod[i]; int ok = 1; float a = tsf_attmod_map(m->src, key, midiVel, &ok), b = tsf_attmod_map(m->amtSrc, key, midiVel, &ok), o;
		if (!ok) continue;
		o = m->amount * a * b; if (m->trans == 2 && o < 0.0f) o = -o;
		cb += o;
	}
	db = r->attenuation + cb * 0.1f;
	return (db < 0.0f ? 0.0f : (db > 144.0f ? 144.0f : db));
}

static void tsf_region_operator(struct tsf_region* region, tsf_u16 genOper, union tsf_hydra_genamount* amount, struct tsf_region* merge_region)
""")
    rep("""			struct tsf_region presetRegion = globalRegion;
			int hadGenInstrument = 0;
""", """			struct tsf_region presetRegion = globalRegion;
			int hadGenInstrument = 0;
			{ // [MoonSinger patch 2] this preset zone's attenuation modulators (the global zone's carried in presetRegion)
				int m; for (m = ppbag->modNdx; m < ppbag[1].modNdx && m < hydra->pmodNum; m++)
					if (hydra->pmods[m].modDestOper == 48) tsf_attmod_put(&presetRegion, hydra->pmods[m].modSrcOper, hydra->pmods[m].modAmtSrcOper, hydra->pmods[m].modTransOper, hydra->pmods[m].modAmount);
			}
""")
    rep("""						struct tsf_region zoneRegion = instRegion;
						int hadSampleID = 0;
""", """						struct tsf_region zoneRegion = instRegion;
						int hadSampleID = 0;
						{ // [MoonSinger patch 2] this instrument zone's attenuation modulators (the global zone's carried in instRegion)
							int m; for (m = pibag->instModNdx; m < pibag[1].instModNdx && m < hydra->imodNum; m++)
								if (hydra->imods[m].modDestOper == 48) tsf_attmod_put(&zoneRegion, hydra->imods[m].modSrcOper, hydra->imods[m].modAmtSrcOper, hydra->imods[m].modTransOper, hydra->imods[m].modAmount);
						}
""")
    rep("""								tsf_region_operator(&zoneRegion, 0, TSF_NULL, &presetRegion);
""", """								tsf_region_operator(&zoneRegion, 0, TSF_NULL, &presetRegion);
								tsf_attmod_finalize(&zoneRegion, &presetRegion);   // [MoonSinger patch 2]
""")
    rep("""		voice->noteGainDB = f->globalGainDB - region->attenuation - tsf_gainToDecibels(1.0f / vel);
""", """		voice->noteGainDB = f->globalGainDB - tsf_region_attenuation(region, key, vel);   // [MoonSinger patch 2] was: - region->attenuation - tsf_gainToDecibels(1.0f / vel)
""")
    if crlf: s = s.replace("\n", "\r\n")
    open(path, "wb").write(s.encode("utf-8"))
    print("patch-tsf: 2 patches applied (gain ramp, TSF_MONO; initial attenuation the FluidSynth way)")

if __name__ == "__main__": main(sys.argv[1])
