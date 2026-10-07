// Thin C API over WORLD (M. Morise, modified BSD) for a WASM build: analyse a mono signal once, edit f0 in JS, synthesise.
// created 2026-10-05 by Claude Opus 5.5. Build: tools/build-world.sh. Layout of sp / ap: frame-major, (fft_size/2+1) doubles per frame.
#include <cstdlib>
#include "world/harvest.h"
#include "world/cheaptrick.h"
#include "world/d4c.h"
#include "world/synthesis.h"
extern "C" {
struct WAnalysis { int frames, fft, bins; double *t, *f0, *sp, *ap; };
static double **rows(double *flat, int frames, int bins) { double **r = (double **)malloc(sizeof(double *) * frames); for (int i = 0; i < frames; i++) r[i] = flat + (size_t)i * bins; return r; }
WAnalysis *w_analyze(const double *x, int n, int fs, double frame_period, double f0_floor, double f0_ceil) {
  WAnalysis *a = (WAnalysis *)calloc(1, sizeof(WAnalysis));
  HarvestOption ho; InitializeHarvestOption(&ho); ho.frame_period = frame_period; ho.f0_floor = f0_floor; ho.f0_ceil = f0_ceil;
  a->frames = GetSamplesForHarvest(fs, n, frame_period);
  a->t = (double *)malloc(sizeof(double) * a->frames); a->f0 = (double *)malloc(sizeof(double) * a->frames);
  Harvest(x, n, fs, &ho, a->t, a->f0);
  CheapTrickOption co; InitializeCheapTrickOption(fs, &co); co.f0_floor = f0_floor; a->fft = GetFFTSizeForCheapTrick(fs, &co); co.fft_size = a->fft;
  a->bins = a->fft / 2 + 1;
  a->sp = (double *)malloc(sizeof(double) * a->frames * a->bins); a->ap = (double *)malloc(sizeof(double) * a->frames * a->bins);
  double **sp = rows(a->sp, a->frames, a->bins), **ap = rows(a->ap, a->frames, a->bins);
  CheapTrick(x, n, fs, a->t, a->f0, a->frames, &co, sp);
  D4COption dop; InitializeD4COption(&dop);
  D4C(x, n, fs, a->t, a->f0, a->frames, a->fft, &dop, ap);
  free(sp); free(ap);
  return a;
}
int w_frames(WAnalysis *a) { return a->frames; }
int w_fft(WAnalysis *a) { return a->fft; }
double *w_f0(WAnalysis *a) { return a->f0; }
double *w_sp(WAnalysis *a) { return a->sp; }
double *w_ap(WAnalysis *a) { return a->ap; }
void w_free(WAnalysis *a) { if (!a) return; free(a->t); free(a->f0); free(a->sp); free(a->ap); free(a); }
int w_synth_len(int frames, int fs, double frame_period) { return (int)((frames - 1) * frame_period / 1000.0 * fs) + 1; }
// f0 / sp / ap: caller-owned, `frames` frames (sp / ap frame-major with fft/2+1 bins). Writes w_synth_len(...) samples into y.
void w_synth(const double *f0, int frames, const double *sp, const double *ap, int fft, int fs, double frame_period, double *y) {
  int bins = fft / 2 + 1;
  double **s = rows((double *)sp, frames, bins), **p = rows((double *)ap, frames, bins);
  Synthesis(f0, frames, (const double *const *)s, (const double *const *)p, fft, frame_period, fs, w_synth_len(frames, fs, frame_period), y);
  free(s); free(p);
}
}
