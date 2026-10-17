// Thin C API over LAME (libmp3lame 3.100, LGPL-2.1) for a WASM build: open an encoder, feed float PCM, get mp3 bytes, flush, close.
// created 2026-10-17 by Claude Fable 5.1. Build: build-lame.sh. Replaces the vendored lamejs (JS port) — its Mp3Encoder hard-wired
// plain stereo + no bit reservoir, and the port's reservoir code is broken (ai-docs/20261017-final-mp3-quality.md). Real LAME does both.
#include <stdlib.h>
#include "lame.h"

// channels 1 / 2; kbps = CBR bitrate; joint = 1 → joint stereo (ignored for mono); quality = LAME -q (0 best … 9 fastest; 2 = "-h").
// No Xing / Info frame (bWriteVbrTag 0: CBR, first bytes are the first frame; the app prepends its own ID3v2), no automatic ID3,
// bit reservoir ON (the whole point). Returns 0 on failure.
lame_global_flags *mg_open(int channels, int samplerate, int kbps, int joint, int quality) {
  lame_global_flags *gf = lame_init();
  if (!gf) return 0;
  lame_set_num_channels(gf, channels);
  lame_set_in_samplerate(gf, samplerate);
  lame_set_out_samplerate(gf, samplerate);
  lame_set_brate(gf, kbps);
  lame_set_VBR(gf, vbr_off);
  lame_set_mode(gf, channels == 1 ? MONO : (joint ? JOINT_STEREO : STEREO));
  lame_set_quality(gf, quality);
  lame_set_bWriteVbrTag(gf, 0);
  lame_set_disable_reservoir(gf, 0);
  lame_set_write_id3tag_automatic(gf, 0);
  if (lame_init_params(gf) < 0) { lame_close(gf); return 0; }
  return gf;
}
// l / r: float samples in −1…1 (r ignored for mono; pass l again). Returns bytes written to out (≥ 0) or a negative LAME error.
int mg_encode(lame_global_flags *gf, const float *l, const float *r, int n, unsigned char *out, int outsize) {
  return lame_encode_buffer_ieee_float(gf, l, r ? r : l, n, out, outsize);
}
int mg_flush(lame_global_flags *gf, unsigned char *out, int outsize) { return lame_encode_flush(gf, out, outsize); }
void mg_close(lame_global_flags *gf) { if (gf) lame_close(gf); }
// Encoder delay in samples (for the record: 576 for LAME; decoders add their own 529).
int mg_delay(lame_global_flags *gf) { return lame_get_encoder_delay(gf); }
