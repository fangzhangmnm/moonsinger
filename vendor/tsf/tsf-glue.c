// Thin C API over TinySoundFont (Bernhard Schelling, MIT) for a WASM build: load a SoundFont 2 bank from memory, list presets,
// play notes by preset index, render mono float. Deterministic: same calls → same samples (no randomness in tsf), which is what
// 「渲染 = 纯函数(文件)」 needs. created 2026-10-07 by Claude Fable 5.1. Build: build-tsf.sh.
// Memory: tsf converts the bank's 16-bit samples to float at load (≈ 2× the sf2's sample bytes) and keeps no reference to the input
// buffer afterwards, so the caller frees it right after sf_load.
#define TSF_IMPLEMENTATION
#define TSF_NO_STDIO
#include "tsf.h"

tsf *sf_load(const void *buf, int size, int samplerate) {
  tsf *f = tsf_load_memory(buf, size);
  if (!f) return 0;
  tsf_set_output(f, TSF_MONO, samplerate, 0.0f);   // one channel: the song mixes voices itself (pan / gain live in the studio layer)
  return f;
}
// A player = fresh voice state over the same (ref-counted, shared) sample data. One per render job → the job is a pure function of
// its note events; tsf_reset only *fades* voices (endquick), so reusing one instance across jobs is not deterministic.
tsf *sf_copy(tsf *f) { return tsf_copy(f); }
void sf_close(tsf *f) { if (f) tsf_close(f); }
void sf_reset(tsf *f) { tsf_reset(f); }
int sf_preset_count(const tsf *f) { return tsf_get_presetcount(f); }
const char *sf_preset_name(const tsf *f, int i) { return tsf_get_presetname(f, i); }
int sf_preset_bank(const tsf *f, int i) { return (i < 0 || i >= f->presetNum) ? -1 : f->presets[i].bank; }
int sf_preset_num(const tsf *f, int i) { return (i < 0 || i >= f->presetNum) ? -1 : f->presets[i].preset; }
int sf_preset_index(const tsf *f, int bank, int num) { return tsf_get_presetindex(f, bank, num); }   // −1 = not in this bank
int sf_set_max_voices(tsf *f, int n) { return tsf_set_max_voices(f, n); }
void sf_set_volume(tsf *f, float gain) { tsf_set_volume(f, gain); }
int sf_note_on(tsf *f, int preset_index, int key, float vel) { return tsf_note_on(f, preset_index, key, vel); }   // vel 0..1
void sf_note_off(tsf *f, int preset_index, int key) { tsf_note_off(f, preset_index, key); }
void sf_note_off_all(tsf *f) { tsf_note_off_all(f); }
int sf_active(tsf *f) { return tsf_active_voice_count(f); }
// Writes `samples` mono floats into out (overwrites, no mixing).
void sf_render(tsf *f, float *out, int samples) { tsf_render_float(f, out, samples, 0); }
