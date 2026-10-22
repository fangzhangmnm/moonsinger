// src/score/roles.ts
var ROLE_GROUPS = [
  { group: "\u4EBA\u58F0", items: [
    { sound: "voice.vocals", name: "Vocals", zh: "\u4E3B\u5531" },
    { sound: "voice.vocals", name: "Backing Vocals", zh: "\u548C\u58F0" },
    { sound: "voice.soprano", name: "Soprano", zh: "\u5973\u9AD8\u97F3\uFF08\u5408\u5531\uFF09" },
    { sound: "voice.alto", name: "Alto", zh: "\u5973\u4F4E\u97F3\uFF08\u5408\u5531\uFF09" },
    { sound: "voice.tenor", name: "Tenor", zh: "\u7537\u9AD8\u97F3\uFF08\u5408\u5531\uFF09" },
    { sound: "voice.bass", name: "Bass", zh: "\u7537\u4F4E\u97F3\uFF08\u5408\u5531\uFF09" }
  ] },
  { group: "\u4E50\u961F", items: [
    { sound: "keyboard.piano", name: "Piano", zh: "\u94A2\u7434 / \u952E\u76D8" },
    { sound: "pluck.guitar", name: "Guitar", zh: "\u5409\u4ED6" },
    { sound: "pluck.bass", name: "Bass", zh: "\u8D1D\u65AF" },
    { sound: "drum.group.set", name: "Drums", zh: "\u9F13" },
    { sound: "strings.group", name: "Strings", zh: "\u5F26\u4E50" },
    { sound: "synth.pad", name: "Synth Pad", zh: "\u5408\u6210\u94FA\u5E95" },
    { sound: "synth.tone.sawtooth", name: "Synth Lead", zh: "\u5408\u6210\u4E3B\u97F3" }
  ] }
];
var ROLE_PRESETS = ROLE_GROUPS.flatMap((g) => g.items);
var DEFAULT_ROLE = ROLE_PRESETS[0];
function numberParts(parts) {
  const key = (p) => `${p.name}\0${p.sound}`;
  const total = /* @__PURE__ */ new Map();
  for (const p of parts) total.set(key(p), (total.get(key(p)) ?? 0) + 1);
  const seen = /* @__PURE__ */ new Map();
  return parts.map((p) => {
    const k = key(p);
    if ((total.get(k) ?? 0) < 2) return p.name;
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    return `${p.name} ${n}`;
  });
}

// vendor/fflate/fflate.esm.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
};
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr2 = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr2, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr2[b.s] - tr2[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr2[i2_1] > mb) {
        dt += cst - (1 << mbt - tr2[i2_1]);
        tr2[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr2[i2_2] < mb)
        dt -= 1 << mb - tr2[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr2[i2_3] == mb) {
        --tr2[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr2), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
}();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
var fltn = function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (val instanceof u8)
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}

// src/score/paper.ts
var STAFF_MM = 7;
var STAFF_MM_COMPACT = 5;
var densityOf = (p) => p.density ?? "cozy";
var staffMmOf = (p) => p.staffMm ?? (densityOf(p) === "compact" ? STAFF_MM_COMPACT : STAFF_MM);
var SIZES = { A3L: { w: 420, h: 297, m: 18 }, A4: { w: 210, h: 297, m: 15 }, A5: { w: 148, h: 210, m: 16 }, A6: { w: 105, h: 148, m: 10 } };
var DEFAULT_PAPER = "A5";
function paperOf(kind, density = "cozy") {
  const s = SIZES[kind];
  return { kind, widthMm: s.w, heightMm: s.h, marginMm: { l: s.m, r: s.m, t: s.m, b: s.m }, ...density === "compact" ? { density } : {} };
}

// src/score/pitch.ts
var STEPS = ["C", "D", "E", "F", "G", "A", "B"];
var STEP_SEMI = [0, 2, 4, 5, 7, 9, 11];
var HOME = { step: "D", alter: 0, octave: 4 };
var stepIndex = (s) => STEPS.indexOf(s);
function midiOf(p) {
  return (p.octave + 1) * 12 + STEP_SEMI[stepIndex(p.step)] + p.alter;
}
function diatonicIndex(p) {
  return p.octave * 7 + stepIndex(p.step);
}

// src/score/repeats.ts
function tickOf(tokens) {
  const out = [];
  let t = 0;
  for (const x of tokens) {
    out.push(t);
    if (isTimed(x)) t += x.dur;
  }
  return out;
}
var hasRepeats = (tokens) => tokens.some((t) => t.kind === "nav" || t.kind === "bar" && !!t.repeat);
function playSegments(tokens, len) {
  if (!hasRepeats(tokens)) return null;
  const ticks = tickOf(tokens), ev = [];
  tokens.forEach((t, i) => {
    if (t.kind === "bar" && t.repeat) {
      if (t.repeat === "end" || t.repeat === "both") ev.push({ i, tick: ticks[i], k: "end", times: Math.max(2, t.times ?? 2) });
      if (t.repeat === "start" || t.repeat === "both") ev.push({ i, tick: ticks[i], k: "start" });
    } else if (t.kind === "nav") ev.push({ i, tick: ticks[i], k: "nav", what: t.what, nums: t.nums ?? [1] });
  });
  const segs = [];
  const emit = (a, b) => {
    if (b > a) segs.push({ t0: a, t1: Math.min(b, len) });
  };
  const find = (pred, from = 0) => {
    for (let k = from; k < ev.length; k++) if (pred(ev[k])) return k;
    return -1;
  };
  const segno = find((e) => e.k === "nav" && e.what === "segno");
  let p = 0, segStart = 0, secStart = 0, secP = 0, pass = 1, jumped = false, mode = null, landed = -1, guard = 0;
  const count = /* @__PURE__ */ new Map();
  while (p < ev.length && guard++ < 512 && segs.length < 256) {
    const e = ev[p];
    if (e.k === "start") {
      if (p !== landed) {
        secStart = e.tick;
        secP = p;
        pass = 1;
      }
      p++;
      continue;
    }
    if (e.k === "end") {
      const n = count.get(p) ?? 0;
      if (!jumped && n < (e.times ?? 2) - 1) {
        count.set(p, n + 1);
        emit(segStart, e.tick);
        segStart = secStart;
        pass++;
        p = secP;
        landed = ev[secP]?.k === "start" && ev[secP].tick === secStart ? secP : -1;
        continue;
      }
      secStart = e.tick;
      secP = p + 1;
      pass = 1;
      p++;
      continue;
    }
    const w = e.what;
    if (w === "ending") {
      if ((e.nums ?? [1]).includes(pass)) {
        p++;
        continue;
      }
      const close = find((x) => x.k === "end" || x.k === "start" || x.k === "nav" && x.what === "ending", p + 1);
      let to, np;
      if (close >= 0) {
        to = ev[close].tick;
        np = ev[close].k === "end" ? close + 1 : close;
      } else {
        const bi = tokens.findIndex((t, i) => i > e.i && t.kind === "bar");
        to = bi >= 0 ? ticks[bi] : len;
        np = find((x) => x.tick >= to, p + 1);
        if (np < 0) np = ev.length;
      }
      emit(segStart, e.tick);
      segStart = to;
      p = np;
      continue;
    }
    if ((w === "dc" || w === "dcFine" || w === "dcCoda" || w === "ds" || w === "dsFine" || w === "dsCoda") && !jumped) {
      const toSegno = w.startsWith("ds");
      if (toSegno && segno < 0) {
        p++;
        continue;
      }
      emit(segStart, e.tick);
      jumped = true;
      mode = w.endsWith("Fine") ? "fine" : w.endsWith("Coda") ? "coda" : null;
      p = toSegno ? segno : 0;
      segStart = toSegno ? ev[segno].tick : 0;
      secStart = segStart;
      secP = p;
      pass = 1;
      landed = -1;
      continue;
    }
    if (w === "fine" && jumped && mode === "fine") {
      emit(segStart, e.tick);
      return segs;
    }
    if (w === "toCoda" && jumped && mode === "coda") {
      let c = find((x) => x.k === "nav" && x.what === "coda", p + 1);
      if (c < 0) c = find((x) => x.k === "nav" && x.what === "coda");
      if (c >= 0) {
        emit(segStart, e.tick);
        segStart = ev[c].tick;
        p = c + 1;
        mode = null;
        continue;
      }
    }
    p++;
  }
  emit(segStart, len);
  return segs;
}
var STATE_KINDS = /* @__PURE__ */ new Set(["key", "time", "tempo", "dyn", "groove", "clef", "ottava"]);
function sliceBySegments(tokens, segs, newId) {
  const ticks = tickOf(tokens), out = [], used = /* @__PURE__ */ new Set();
  const copy = (t) => {
    if (used.has(t.id)) return { ...t, id: newId() };
    used.add(t.id);
    return t;
  };
  const total = tokens.reduce((a, t) => a + (isTimed(t) ? t.dur : 0), 0);
  let prevEnd = 0;
  segs.forEach((s, k) => {
    let cur = s.t0, first = true;
    const jump = k > 0 && s.t0 !== prevEnd;
    if (jump) {
      const last = /* @__PURE__ */ new Map();
      tokens.forEach((t, i) => {
        if (STATE_KINDS.has(t.kind) && ticks[i] < s.t0) last.set(t.kind, t);
      });
      for (const kind of ["key", "time", "tempo", "groove", "dyn", "clef", "ottava"]) {
        const t = last.get(kind);
        if (t) out.push({ ...t, id: newId() });
      }
    }
    tokens.forEach((t, i) => {
      const at = ticks[i];
      if (t.kind === "nav") return;
      if (t.kind === "bar") {
        if (at < s.t0 || at > s.t1 || at === s.t0 && (k > 0 || !!t.repeat)) return;
        const b = copy(t);
        const { repeat: _r, times: _t, ...plain } = b;
        out.push(plain);
        return;
      }
      const inside = at >= s.t0 && (at < s.t1 || k === segs.length - 1 && s.t1 >= total && at === s.t1 && !isTimed(t));
      if (!inside) return;
      if (!isTimed(t)) {
        out.push(copy(t));
        return;
      }
      if (at > cur) out.push({ kind: "rest", id: newId(), dur: at - cur });
      let x = copy(t);
      const room = s.t1 - at;
      if (x.dur > room) x = { ...x, dur: room };
      if (first && jump && x.kind === "note" && x.tie) {
        const { tie: _t, ...rest } = x;
        x = rest;
      }
      out.push(x);
      cur = at + x.dur;
      first = false;
    });
    if (s.t1 > cur) out.push({ kind: "rest", id: newId(), dur: s.t1 - cur });
    prevEnd = s.t1;
  });
  return out;
}
function expandPaper(song, paper, newId) {
  const owner = tempoOwner(song, paper);
  if (!owner) return paper;
  const segs = playSegments(paper.tracks[owner], paperTicks(paper));
  if (!segs) {
    if (!Object.values(paper.tracks).some(hasRepeats)) return paper;
    return { ...paper, tracks: Object.fromEntries(Object.entries(paper.tracks).map(([k, t]) => [k, t.filter((x) => x.kind !== "nav").map((x) => x.kind === "bar" && x.repeat ? { kind: "bar", id: x.id } : x)])) };
  }
  return { ...paper, tracks: Object.fromEntries(Object.entries(paper.tracks).map(([k, t]) => [k, sliceBySegments(t, segs, newId)])) };
}

// src/score/song.ts
var TPQ = 1680;
var WHOLE = TPQ * 4;
var LADDER = [TPQ / 8, TPQ / 4, TPQ / 2, TPQ, TPQ * 2, WHOLE];
var MIN_DUR = TPQ / 8 * 4 / 7;
var MAX_DUR = WHOLE * 4;
var NAV_LABEL = { segno: "Segno", coda: "Coda", fine: "Fine", toCoda: "To Coda", dc: "D.C.", dcFine: "D.C. al Fine", dcCoda: "D.C. al Coda", ds: "D.S.", dsFine: "D.S. al Fine", dsCoda: "D.S. al Coda" };
var endingLabel = (nums) => nums && nums.length ? nums.map((n) => `${n}.`).join(" ") : "1.";
function swellOf(t) {
  if (t?.kind !== "note" || !t.art) return void 0;
  return t.art.includes("swellUp") ? "<" : t.art.includes("swellDown") ? ">" : t.art.includes("swellBoth") ? "<>" : void 0;
}
var DYNS = ["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"];
var CLEFS = ["G", "G8vb", "G8va", "G15ma", "F", "F8vb"];
var SPLIT_MIDI = 60;
var DEFAULT_KEY = 0;
var DEFAULT_TIME = { beats: 4, beatType: 4 };
var DEFAULT_BPM = 90;
var isTimed = (t) => t.kind === "note" || t.kind === "rest";
var isMark = (t) => t.kind === "key" || t.kind === "time" || t.kind === "tempo";
function headLen(tokens) {
  let n = 0;
  while (n < tokens.length && isMark(tokens[n])) n++;
  return n;
}
function prevPitch(tokens, i) {
  for (let j = i - 1; j >= 0; j--) {
    const t = tokens[j];
    if (t.kind === "note" && t.pitch) return t.pitch;
  }
  return null;
}
function effectivePitch(tokens, i) {
  const t = tokens[i];
  if (t.kind === "note" && t.pitch) return t.pitch;
  return prevPitch(tokens, i) ?? HOME;
}
function rampTarget(tokens, i, end = tokens.length) {
  for (let j = i + 1; j < end; j++) {
    const t = tokens[j];
    if (t.kind === "hairpin") return -1;
    if (t.kind === "dyn") return t.ramp ? j : -1;
  }
  return -1;
}
function tempoOwner(song, paper) {
  return song.parts.find((p) => paper.tracks[p.id])?.id ?? null;
}
function autoStaffs(tokens, staves) {
  let last = 1;
  return tokens.map((t, i) => {
    if (staves !== 2) return 1;
    if (t.kind === "note") last = midiOf(effectivePitch(tokens, i)) < SPLIT_MIDI ? 2 : 1;
    return last;
  });
}
function staffOfTokens(tokens, staves) {
  const auto = autoStaffs(tokens, staves);
  let last = 1;
  return tokens.map((t, i) => {
    if (staves !== 2) return 1;
    const s = (t.kind === "note" || t.kind === "rest") && t.staff ? t.staff : t.kind === "note" ? auto[i] : last;
    last = s;
    return s;
  });
}
var SWING_GRID = TPQ / 16;
var trackTicks = (tokens) => tokens.reduce((a, t) => a + (isTimed(t) ? t.dur : 0), 0);
var paperTicks = (p) => Math.max(0, ...Object.values(p.tracks).map(trackTicks));
function flattenPart(song, partId, opts = {}) {
  const out = [], starts = [];
  let id = -1;
  let k = -1;
  const seq = opts.order ? opts.order.flatMap((pid) => song.papers.filter((p) => p.id === pid)) : song.papers.filter((p) => !p.hidden);
  const seen = /* @__PURE__ */ new Set();
  seq.forEach((p00) => {
    const again = seen.has(p00.id);
    seen.add(p00.id);
    const p0 = expandPaper(song, p00, () => id--);
    const p = again ? { ...p0, tracks: Object.fromEntries(Object.entries(p0.tracks).map(([k2, t]) => [k2, t.map((x) => ({ ...x, id: id-- }))])) } : p0;
    k++;
    const have = p.tracks[partId], len = paperTicks(p);
    starts.push({ index: out.length, paper: p });
    let toks;
    if (have) toks = have;
    else {
      const src = song.parts.map((x) => p.tracks[x.id]).find((x) => x) ?? [];
      toks = src.slice(0, headLen(src)).map((t) => ({ ...t, id: id-- }));
      if (opts.tempo) {
        let t = 0, at = 0;
        for (const u of src.slice(headLen(src))) {
          if (u.kind === "tempo") {
            if (t > at) toks.push({ kind: "rest", id: id--, dur: t - at });
            toks.push({ ...u, id: id-- });
            at = t;
          } else if (isTimed(u)) t += u.dur;
        }
        if (at > 0 && len > at) {
          toks.push({ kind: "rest", id: id--, dur: len - at });
        }
      }
    }
    if (k === 0) out.push(...toks);
    else {
      const h = headLen(toks);
      out.push(...toks.slice(0, h).map((t) => ({ ...t, id: id-- })), ...toks.slice(h));
    }
    const pad = len - trackTicks(toks);
    if (pad > 0) out.push({ kind: "rest", id: id--, dur: pad });
  });
  return { tokens: out, starts };
}

// src/score/clef.ts
var CLEF_SHIFT = { G: 0, G8vb: 7, G8va: -7, G15ma: -14, F: 12, F8vb: 19 };
var ottavaShift = (s) => -7 * s;
var BOTTOM = 30;
var TOP = 38;
var ledgerLines = (pos) => pos > TOP ? Math.floor((pos - TOP) / 2) : pos < BOTTOM ? Math.floor((BOTTOM - pos) / 2) : 0;
var ledgerCost = (pos) => {
  const l = ledgerLines(pos);
  return l * (l + 1) / 2;
};
var BIAS = { G: 0, F: 0.1, G8vb: 1, G8va: 1, G15ma: 1.5, F8vb: 1.5 };
function autoClef(positions, prev = null) {
  if (!positions.length) return prev ?? "G";
  return pickClef((c) => positions.reduce((a, x) => a + ledgerCost(x + CLEF_SHIFT[c]) + BIAS[c], 0), positions.length, prev);
}
function pickClef(cost, n, prev) {
  let best = "G", bc = Infinity;
  for (const c of CLEFS) {
    const v = cost(c);
    if (v < bc - 1e-9) {
      bc = v;
      best = c;
    }
  }
  if (prev && cost(prev) <= bc + Math.max(1, 0.1 * n)) return prev;
  return best;
}
var RUN_COST = 3;
function startClef(tokens, partClef, prev, autoOtt = false) {
  if (partClef) return partClef;
  if (autoOtt) {
    const cut = tokens.findIndex((t) => t.kind === "clef"), seg = cut < 0 ? tokens : tokens.slice(0, cut);
    let n = 0;
    for (const t of seg) if (t.kind === "note" && t.pitch) n += 1 + (t.chord?.length ?? 0);
    if (!n) return prev ?? "G";
    return pickClef((c) => {
      const ao = autoOttava(seg, displayStates(seg, c));
      let v = ao.runs.length * RUN_COST;
      seg.forEach((t, i) => {
        if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) v += ledgerCost(diatonicIndex(p) + CLEF_SHIFT[c] + ottavaShift(ao.ott[i] ?? 0)) + BIAS[c];
      });
      return v;
    }, n, prev);
  }
  const pos = [];
  let o = 0;
  for (const t of tokens) {
    if (t.kind === "clef") break;
    if (t.kind === "ottava") {
      o = t.shift;
      continue;
    }
    if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) pos.push(diatonicIndex(p) + ottavaShift(o));
  }
  return autoClef(pos, prev);
}
function displayStates(tokens, start) {
  const clef = new Array(tokens.length), ott = new Array(tokens.length);
  let c = start, o = 0;
  tokens.forEach((t, i) => {
    if (t.kind === "clef") c = t.clef;
    else if (t.kind === "ottava") o = t.shift;
    clef[i] = c;
    ott[i] = o;
  });
  return { clef, ott };
}
function autoOttava(tokens, ds) {
  const ott = ds.ott.slice(), auto = new Array(tokens.length).fill(false), runs = [];
  const items = [];
  tokens.forEach((t, i) => {
    if (!isTimed(t)) return;
    const manual = (ds.ott[i] ?? 0) !== 0;
    if (t.kind !== "note" || !t.pitch) {
      items.push({ i, note: false, hi: NaN, lo: NaN, dir: 0, manual });
      return;
    }
    const pos = [t.pitch, ...t.chord ?? []].map((p) => diatonicIndex(p) + CLEF_SHIFT[ds.clef[i]]);
    const hi = Math.max(...pos), lo = Math.min(...pos);
    const up = hi > TOP && ledgerLines(hi) >= 3, down = lo < BOTTOM && ledgerLines(lo) >= 3;
    items.push({ i, note: true, hi, lo, dir: up && !down ? 1 : down && !up ? -1 : 0, manual });
  });
  const notes = items.filter((x) => x.note).length, cands2 = items.filter((x) => x.dir && !x.manual).length;
  if (cands2 < 2 || cands2 * 3 > notes) return { ott, auto, runs };
  const okGap = (x, dir) => !x.manual && (!x.note || (dir === 1 ? !(x.lo - 7 < BOTTOM && ledgerLines(x.lo - 7) >= 3) : !(x.hi + 7 > TOP && ledgerLines(x.hi + 7) >= 3)));
  for (let k = 0; k < items.length; ) {
    const it = items[k];
    if (!it.dir || it.manual) {
      k++;
      continue;
    }
    const dir = it.dir;
    let e = k, n = 1;
    for (; ; ) {
      const a = items[e + 1], b = items[e + 2];
      if (a && a.dir === dir && !a.manual) {
        e += 1;
        n++;
        continue;
      }
      if (a && b && b.dir === dir && !b.manual && okGap(a, dir)) {
        e += 2;
        n++;
        continue;
      }
      break;
    }
    if (n >= 2) {
      const span = items.slice(k, e + 1).filter((x) => x.note);
      const shift = dir === -1 ? -1 : span.some((x) => x.hi - 7 > TOP && ledgerLines(x.hi - 7) >= 3) ? 2 : 1;
      const from = items[k].i, to = items[e].i;
      for (let j = from; j <= to; j++) {
        ott[j] = shift;
        auto[j] = true;
      }
      runs.push({ from, to, shift });
    }
    k = e + 1;
  }
  return { ott, auto, runs };
}
function withAutoOttava(tokens, start) {
  const { runs } = autoOttava(tokens, displayStates(tokens, start));
  if (!runs.length) return tokens;
  const out = tokens.slice();
  for (const r of [...runs].reverse()) {
    if (tokens.slice(r.to + 1).some((t) => isTimed(t))) out.splice(r.to + 1, 0, { kind: "ottava", id: 0, shift: 0, auto: true });
    out.splice(r.from, 0, { kind: "ottava", id: 0, shift: r.shift, auto: true });
  }
  return out;
}
function resolveSongClefs(song) {
  const out = /* @__PURE__ */ new Map(), last = /* @__PURE__ */ new Map();
  for (const paper of song.papers) {
    const m = /* @__PURE__ */ new Map();
    out.set(paper.id, m);
    for (const part of song.parts) {
      const toks = paper.tracks[part.id];
      if (!toks || part.staves === 2) continue;
      const c = startClef(toks, part.clef, last.get(part.id) ?? null, part.autoOttava !== false);
      m.set(part.id, c);
      const ds = displayStates(toks, c);
      last.set(part.id, ds.clef.length ? ds.clef[ds.clef.length - 1] : c);
    }
  }
  return out;
}

// src/score/arrange.ts
var REP = /^(?:[×xX*])(\d+)/;
function parseArrangement(text2, papers) {
  const src = (text2 ?? "").trim();
  if (!src) return { order: papers.filter((p) => !p.hidden).map((p) => p.id), loop: null, issues: [], explicit: false };
  const issues = [];
  let i = 0;
  const ws = () => {
    while (i < src.length && /[\s、,，→]/.test(src[i])) i++;
  };
  const findPaper = (name) => {
    const byName = papers.find((p) => p.name.trim() === name);
    if (byName) return byName.id;
    if (/^\d+$/.test(name)) {
      const k = Number(name);
      if (k >= 1 && k <= papers.length) return papers[k - 1].id;
    }
    return null;
  };
  const rep = () => {
    const save = i;
    while (src[i] === " ") i++;
    const m = REP.exec(src.slice(i));
    if (!m) {
      i = save;
      return null;
    }
    i += m[0].length;
    return Number(m[1]);
  };
  const seq = (close) => {
    const out = [];
    for (; ; ) {
      ws();
      if (i >= src.length) {
        if (close) issues.push({ at: src.length, len: 0, why: `\u5C11\u4E86\u300C${close}\u300D` });
        return out;
      }
      const c = src[i];
      if (close && c === close) {
        i++;
        return out;
      }
      if (c === ")" || c === "]") {
        issues.push({ at: i, len: 1, why: `\u591A\u4E86\u300C${c}\u300D` });
        i++;
        continue;
      }
      if (c === "[") return out;
      let node;
      const at = i;
      if (c === "(") {
        i++;
        node = { kind: "rep", body: seq(")"), n: 1 };
      } else {
        let name = "";
        while (i < src.length && !/[\s、,，→()[\]×*]/.test(src[i]) && !(/[xX]/.test(src[i]) && /\d/.test(src[i + 1] ?? "") && name)) name += src[i++];
        if (!name) {
          issues.push({ at: i, len: 1, why: `\u770B\u4E0D\u61C2\u300C${src[i]}\u300D` });
          i++;
          continue;
        }
        const paper = findPaper(name);
        if (!paper) {
          issues.push({ at, len: name.length, why: `\u6CA1\u6709\u53EB\u300C${name}\u300D\u7684\u7EB8\uFF08\u5199\u66F2\u6BB5\u540D\uFF0C\u6216\u8005\u7B2C\u51E0\u5F20\u7EB8\u7684\u5E8F\u53F7\uFF09` });
          node = { kind: "rep", body: [], n: 1 };
        } else node = { kind: "ref", paper, text: name, at };
      }
      const n = rep();
      if (n !== null) {
        if (n < 1 || n > 99) issues.push({ at, len: i - at, why: "\u91CD\u590D\u6B21\u6570\u8981\u5728 1 \u5230 99 \u4E4B\u95F4" });
        if (n >= 1) node = { kind: "rep", body: [node], n: Math.min(99, n) };
      }
      out.push(node);
    }
  };
  const main = seq(null);
  let loopNodes = null;
  ws();
  if (i < src.length && src[i] === "[") {
    const at = i;
    i++;
    loopNodes = seq("]");
    if (!loopNodes.length) issues.push({ at, len: i - at, why: "\u5FAA\u73AF\u6BB5\u662F\u7A7A\u7684" });
    ws();
    if (i < src.length) {
      issues.push({ at: i, len: src.length - i, why: "\u5FAA\u73AF\u6BB5\u53EA\u80FD\u653E\u5728\u6700\u540E\uFF1A\u540E\u9762\u7684\u6C38\u8FDC\u653E\u4E0D\u5230" });
    }
  }
  const expand = (ns) => ns.flatMap((n) => n.kind === "ref" ? [n.paper] : Array.from({ length: n.n }, () => expand(n.body)).flat());
  const loop = loopNodes ? expand(loopNodes) : null;
  return { order: expand(main), loop: loop && loop.length ? loop : null, issues, explicit: true };
}
var playOrder = (a) => [...a.order, ...a.loop ?? []];
var songPlayOrder = (song) => playOrder(parseArrangement(song.arrangement, song.papers));

// src/score/lyrics.ts
var MELISMA_MARK = "\u30FC";
var ELISION = "\u203F";
var SMALL = /* @__PURE__ */ new Set([..."\u3083\u3085\u3087\u3041\u3043\u3045\u3047\u3049\u308E\u3095\u3096\u30E3\u30E5\u30E7\u30A1\u30A3\u30A5\u30A7\u30A9\u30EE\u30F5\u30F6", "\u3063", "\u30C3"]);

// src/score/lang.ts
var KANA = /[぀-ヿㇰ-ㇿｦ-ﾟ]/;
var HAN = /\p{Script=Han}/u;
var LATIN = /[A-Za-z]/;
function partDefaultLang(tokens) {
  const ls = tokens.flatMap((t) => t.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? [t.lyric] : []).join("");
  if (KANA.test(ls)) return "ja";
  if (HAN.test(ls)) return "zh";
  if (LATIN.test(ls)) return "en";
  return "ja";
}
function syllableLangs(tokens, override = true) {
  const def = partDefaultLang(tokens);
  let prev = def;
  return tokens.map((t) => {
    if (t.kind !== "note" || !t.lyric || t.lyric === MELISMA_MARK) return null;
    let l = KANA.test(t.lyric) ? "ja" : HAN.test(t.lyric) ? prev : LATIN.test(t.lyric) ? "en" : prev;
    if (override && t.lang) l = t.lang;
    prev = l;
    return l;
  });
}

// src/format/xml.ts
var esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// src/score/grooves.gen.ts
var GROOVE_STYLES = [
  {
    "id": "none",
    "name": {
      "zh": "\u65E0",
      "en": "None",
      "ja": "\u306A\u3057"
    },
    "aliases": [
      "\u65E0\u98CE\u683C",
      "Off"
    ],
    "meters": {},
    "phase": null,
    "fallback": "none",
    "follow": {
      "piano": 0,
      "chromatic-percussion": 0,
      "organ": 0,
      "guitar": 0,
      "bass": 0,
      "strings": 0,
      "ensemble": 0,
      "brass": 0,
      "reed": 0,
      "pipe": 0,
      "synth-lead": 0,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0,
      "percussive": 0,
      "sound-effects": 0,
      "percussion": 0,
      "voice": 0
    },
    "swing": null
  },
  {
    "id": "classical",
    "name": {
      "zh": "\u53E4\u5178",
      "en": "Classical",
      "ja": "\u30AF\u30E9\u30B7\u30C3\u30AF"
    },
    "aliases": [
      "Classic",
      "\u53E4\u5178\u6D3E"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "3/4": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5,
          0,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5
        ]
      },
      "6/8": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "12/8": {
        "grid": 24,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.5,
      "chromatic-percussion": 0.6,
      "organ": 0.2,
      "guitar": 0.6,
      "bass": 0.6,
      "strings": 0.5,
      "ensemble": 0.3,
      "brass": 0.5,
      "reed": 0.4,
      "pipe": 0.4,
      "synth-lead": 0.4,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  },
  {
    "id": "pop",
    "name": {
      "zh": "\u6D41\u884C",
      "en": "Pop",
      "ja": "\u30DD\u30C3\u30D7\u30B9"
    },
    "aliases": [
      "Rock",
      "\u6447\u6EDA",
      "\u30ED\u30C3\u30AF",
      "R&B",
      "Backbeat",
      "\u53CD\u62CD"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          0.5,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0.5,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25
        ]
      },
      "12/8": {
        "grid": 24,
        "weights": [
          0.5,
          -0.25,
          0,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0,
          -0.25,
          0.5,
          -0.25,
          0,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0,
          -0.25
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.5,
      "organ": 0.3,
      "guitar": 0.8,
      "bass": 1,
      "strings": 0.2,
      "ensemble": 0.1,
      "brass": 0.6,
      "reed": 0.3,
      "pipe": 0.2,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 0.8,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  },
  {
    "id": "waltz",
    "name": {
      "zh": "\u534E\u5C14\u5179",
      "en": "Waltz",
      "ja": "\u30EF\u30EB\u30C4"
    },
    "aliases": [
      "\u5706\u821E\u66F2",
      "Valse",
      "Walzer"
    ],
    "meters": {
      "3/4": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.8,
      "chromatic-percussion": 0.6,
      "organ": 0.3,
      "guitar": 0.8,
      "bass": 1,
      "strings": 0.5,
      "ensemble": 0.3,
      "brass": 0.5,
      "reed": 0.3,
      "pipe": 0.3,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 0.8,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  },
  {
    "id": "march",
    "name": {
      "zh": "\u8FDB\u884C\u66F2",
      "en": "March",
      "ja": "\u30DE\u30FC\u30C1"
    },
    "aliases": [
      "\u884C\u8FDB\u66F2",
      "Marcia",
      "\u884C\u9032\u66F2"
    ],
    "meters": {
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5,
          0.5,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5
        ]
      },
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "6/8": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.6,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 1,
      "strings": 0.5,
      "ensemble": 0.3,
      "brass": 0.8,
      "reed": 0.6,
      "pipe": 0.6,
      "synth-lead": 0.4,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.4
    },
    "swing": null
  },
  {
    "id": "swing",
    "name": {
      "zh": "Swing",
      "en": "Swing",
      "ja": "\u30B9\u30A6\u30A3\u30F3\u30B0"
    },
    "aliases": [
      "\u6447\u6446",
      "\u7235\u58EB",
      "Jazz",
      "\u30B8\u30E3\u30BA"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          0.25,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0.25,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.5,
      "chromatic-percussion": 0.4,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 0.4,
      "strings": 0.2,
      "ensemble": 0.1,
      "brass": 0.5,
      "reed": 0.5,
      "pipe": 0.3,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.4,
      "percussive": 0.6,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.2
    },
    "swing": {
      "unit": "8th",
      "ratio": 0.667,
      "range": [
        0.5,
        0.75
      ]
    }
  },
  {
    "id": "four-on-the-floor",
    "name": {
      "zh": "\u56DB\u62CD\u5E95\u9F13",
      "en": "Four on the floor",
      "ja": "4\u3064\u6253\u3061"
    },
    "aliases": [
      "\u7535\u5B50",
      "\u8FEA\u65AF\u79D1",
      "Disco",
      "EDM",
      "House",
      "\u30C7\u30A3\u30B9\u30B3"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          0,
          0.5,
          0,
          1,
          0,
          0.5,
          0,
          1,
          0,
          0.5,
          0,
          1,
          0,
          0.5,
          0
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.4,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 0.8,
      "strings": 0.2,
      "ensemble": 0.1,
      "brass": 0.5,
      "reed": 0.3,
      "pipe": 0.2,
      "synth-lead": 0.5,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.4,
      "percussive": 0.8,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.2
    },
    "swing": null
  },
  {
    "id": "bossa-nova",
    "name": {
      "zh": "\u6CE2\u8428",
      "en": "Bossa nova",
      "ja": "\u30DC\u30B5\u30CE\u30F4\u30A1"
    },
    "aliases": [
      "Bossa",
      "\u5DF4\u8428\u8BFA\u74E6",
      "\u30DC\u30B5\u30CE\u30D0",
      "Samba-reggae"
    ],
    "meters": {
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.25,
          -0.25,
          0.75,
          0.5,
          -0.25,
          0.75,
          0.25,
          0.5,
          -0.25,
          0.75,
          0.25,
          0.5,
          0.75,
          -0.25,
          0.25
        ],
        "bars": 2
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5
        ],
        "bars": 2
      },
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5
        ],
        "bars": 2
      }
    },
    "phase": "3-2",
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.4,
      "organ": 0.3,
      "guitar": 1,
      "bass": 0.6,
      "strings": 0.1,
      "ensemble": 0.1,
      "brass": 0.3,
      "reed": 0.3,
      "pipe": 0.3,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.1
    },
    "swing": null
  },
  {
    "id": "latin",
    "name": {
      "zh": "\u62C9\u4E01\uFF08\u514B\u62C9\u7EF4\uFF09",
      "en": "Latin (son clave)",
      "ja": "\u30E9\u30C6\u30F3\uFF08\u30BD\u30F3\u30FB\u30AF\u30E9\u30FC\u30D9\uFF09"
    },
    "aliases": [
      "\u62C9\u4E01",
      "Latin",
      "Son",
      "Salsa",
      "\u8428\u5C14\u8428",
      "Mambo",
      "\u66FC\u6CE2",
      "\u30B5\u30EB\u30B5",
      "\u30E9\u30C6\u30F3",
      "Clave",
      "\u514B\u62C9\u7EF4"
    ],
    "meters": {
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.25,
          -0.25,
          0.75,
          0,
          -0.25,
          0.75,
          -0.25,
          0.25,
          -0.25,
          0.75,
          -0.25,
          0.75,
          -0.25,
          -0.25,
          -0.25
        ],
        "bars": 2
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ],
        "bars": 2
      },
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ],
        "bars": 2
      }
    },
    "phase": "3-2",
    "fallback": "classical",
    "follow": {
      "piano": 0.8,
      "chromatic-percussion": 0.5,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 0.8,
      "strings": 0.3,
      "ensemble": 0.1,
      "brass": 0.6,
      "reed": 0.4,
      "pipe": 0.4,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.6,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  }
];

// src/score/groove.ts
var grooveStyle = (id) => GROOVE_STYLES.find((s) => s.id === id) ?? null;
var grooveNameEn = (style) => {
  const s = grooveStyle(style);
  return style === "none" ? "none" : s ? s.name.en : style;
};
var grooveLabel = (t) => `Style: ${grooveNameEn(t.style)}${t.shift && grooveHasPhase(grooveStyle(t.style)) ? " 2-3" : ""}${t.amount !== void 0 && t.amount !== 1 && t.style !== "none" ? ` \xD7${t.amount}` : ""}`;
var grooveHasPhase = (s) => !!s && Object.values(s.meters).some((m) => (m.bars ?? 1) > 1);

// src/format/musicxml.ts
var measureLen = (beats, beatType) => beats * WHOLE / beatType;
var TYPES = [["whole", WHOLE], ["half", WHOLE / 2], ["quarter", TPQ], ["eighth", TPQ / 2], ["16th", TPQ / 4], ["32nd", TPQ / 8], ["64th", TPQ / 16]];
var TUPLETS = [[1, 1], [3, 2], [5, 4], [6, 4], [7, 4]];
function noteType(dur) {
  for (const [act, norm] of TUPLETS) for (const [type, base] of TYPES) for (let dots = 0; dots <= 2; dots++) {
    if (Math.abs(base * (2 - 1 / 2 ** dots) * (norm / act) - dur) < 0.5) return { type, dots, tuplet: act === 1 ? null : [act, norm] };
  }
  return null;
}
var pitchXml = (p) => `<pitch><step>${p.step}</step>${p.alter ? `<alter>${p.alter}</alter>` : ""}<octave>${p.octave}</octave></pitch>`;
var LAYOUT_TENTHS = { cozy: { system: 110, staff: 80 }, compact: { system: 60, staff: 50 } };
var tenthsPerMm = (p) => 40 / staffMmOf(p);
function defaultsXml(p) {
  const t = (mm) => +(mm * tenthsPerMm(p)).toFixed(2), m = p.marginMm;
  const compact = densityOf(p) === "compact";
  return `<defaults><scaling><millimeters>${staffMmOf(p)}</millimeters><tenths>40</tenths></scaling><page-layout><page-height>${t(p.heightMm)}</page-height><page-width>${t(p.widthMm)}</page-width><page-margins type="both"><left-margin>${t(m.l)}</left-margin><right-margin>${t(m.r)}</right-margin><top-margin>${t(m.t)}</top-margin><bottom-margin>${t(m.b)}</bottom-margin></page-margins></page-layout><system-layout><system-distance>${compact ? LAYOUT_TENTHS.compact.system : LAYOUT_TENTHS.cozy.system}</system-distance></system-layout><staff-layout><staff-distance>${compact ? LAYOUT_TENTHS.compact.staff : LAYOUT_TENTHS.cozy.staff}</staff-distance></staff-layout></defaults>`;
}
function creditXml(text2, p) {
  const t = (mm) => +(mm * tenthsPerMm(p)).toFixed(1);
  return `<credit page="1"><credit-words default-x="${t(p.widthMm - p.marginMm.r)}" default-y="${t(p.heightMm - p.marginMm.t - 12)}" justify="right" valign="top">${esc(text2)}</credit-words></credit>`;
}
var dynXml = (v) => `<direction placement="above"><direction-type><dynamics><${v}/></dynamics></direction-type></direction>`;
var wedgeXml = (type, extra = "") => `<direction placement="above"><direction-type><wedge type="${type}" number="1"${extra}/></direction-type></direction>`;
var RAMP_ID = "ramp-";
var DYN_ORDER = DYNS;
var ART_XML = { accent: "accent", marcato: "strong-accent", sfz: "sfz", fp: "fp", staccato: "staccato", tenuto: "tenuto", breath: "breath-mark", stress: "stress", unstress: "unstress", ghost: "", whisper: "", swellUp: "", swellDown: "", swellBoth: "", arpeggio: "" };
var NOTE_DYN = ["sfz", "fp"];
var GROOVE_ID = "groove.";
var grooveXml = (t) => `<direction placement="above"><direction-type><words font-style="italic" id="${GROOVE_ID}${t.style}.${Math.round((t.amount ?? 1) * 100)}.${t.id}${t.shift ? ".2-3" : ""}">${esc(grooveLabel(t))}</words></direction-type></direction>`;
var NAV_ID = "nav.";
var navXml = (t) => {
  const id = `${NAV_ID}${t.what}.${t.id}`;
  if (t.what === "segno") return `<direction placement="above"><direction-type><segno id="${id}"/></direction-type><sound segno="segno"/></direction>`;
  if (t.what === "coda") return `<direction placement="above"><direction-type><coda id="${id}"/></direction-type><sound coda="coda"/></direction>`;
  if (t.what === "ending") return "";
  const snd = t.what === "fine" ? `fine="yes"` : t.what === "toCoda" ? `tocoda="coda"` : t.what.startsWith("dc") ? `dacapo="yes"` : `dalsegno="segno"`;
  return `<direction placement="above"><direction-type><words id="${id}" font-style="italic">${esc(NAV_LABEL[t.what])}</words></direction-type><sound ${snd}/></direction>`;
};
var tempoXml = (bpm) => `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`;
var CLEF_OC = { G: 0, G8vb: -1, G8va: 1, G15ma: 2, F: 0, F8vb: -1 };
var clefXml = (c) => {
  const F = c === "F" || c === "F8vb", oc = CLEF_OC[c];
  return `<clef><sign>${F ? "F" : "G"}</sign><line>${F ? 4 : 2}</line>${oc ? `<clef-octave-change>${oc}</clef-octave-change>` : ""}</clef>`;
};
var autoSeq = 0;
var ottavaXml = (shift, open, auto = false) => {
  const id = () => auto ? ` id="ms-auto-${++autoSeq}"` : "";
  const stop = open ? `<direction><direction-type><octave-shift type="stop" size="${open === 2 ? 15 : 8}"${id()}/></direction-type></direction>` : "";
  if (!shift) return stop;
  return stop + `<direction placement="${shift > 0 ? "above" : "below"}"><direction-type><octave-shift type="${shift > 0 ? "down" : "up"}" size="${shift === 2 ? 15 : 8}"${id()}/></direction-type></direction>`;
};
function partMeasures(toks, breaks, first, clef = "G", staves = 1) {
  const staffs = staffOfTokens(toks, staves);
  const head = headLen(toks);
  const H = { fifths: DEFAULT_KEY, beats: DEFAULT_TIME.beats, beatType: DEFAULT_TIME.beatType, bpm: DEFAULT_BPM };
  for (let i = 0; i < head; i++) {
    const t = toks[i];
    if (t.kind === "key") H.fifths = t.fifths;
    else if (t.kind === "time") {
      H.beats = t.beats;
      H.beatType = t.beatType;
    } else if (t.kind === "tempo") H.bpm = t.bpm;
  }
  const langs = syllableLangs(toks);
  const measures = [];
  let cur = [], ticks = 0, len = measureLen(H.beats, H.beatType);
  let ending = null;
  const endingCloses = (i) => {
    for (let j = i + 1; j < toks.length; j++) {
      const u = toks[j];
      if (u.kind === "bar" && (u.repeat === "end" || u.repeat === "both")) return true;
      if (u.kind === "nav" && u.what === "ending" || u.kind === "bar" && u.repeat === "start") return false;
    }
    return false;
  };
  const close = (manual, right = "") => {
    if (ending && !ending.closedByRepeat && !right) {
      cur.push(`<barline location="right"><ending number="${ending.num}" type="discontinue"/></barline>`);
      ending = null;
    }
    if (right) cur.push(right);
    measures.push({ body: cur, manual });
    cur = [];
    ticks = 0;
  };
  const clefs = staves === 2 ? `<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>` : clefXml(clef);
  cur.push(`<attributes><divisions>${TPQ}</divisions><key><fifths>${H.fifths}</fifths></key><time><beats>${H.beats}</beats><beat-type>${H.beatType}</beat-type></time>${clefs}</attributes>`);
  if (first) cur.push(tempoXml(H.bpm));
  let prevHyph = false;
  const syllabic = (t) => {
    const s = t.hyph ? prevHyph ? "middle" : "begin" : prevHyph ? "end" : "single";
    prevHyph = !!t.hyph;
    return s;
  };
  const unwritten = [];
  const nextTimed = (i) => {
    for (let j = i + 1; j < toks.length; j++) {
      const t = toks[j];
      if (t.kind === "note" || t.kind === "rest") return t;
    }
    return null;
  };
  const noteAt = (i, d) => {
    for (let j = i + d; j >= 0 && j < toks.length; j += d) if (toks[j].kind === "note") return toks[j];
    return null;
  };
  let ottOpen = 0, wedgeOpen = false;
  const slurs = (i, t) => {
    const pv = noteAt(i, -1), nx = noteAt(i, 1), out = !!t.slur && !!nx, into = !!pv?.slur;
    return `${into && !out ? `<slur type="stop" number="1"/>` : ""}${out && !into ? `<slur type="start" number="1"/>` : ""}`;
  };
  for (let i = head; i < toks.length; i++) {
    const t = toks[i];
    const br = breaks?.get(i);
    if (br !== void 0) {
      if (wedgeOpen) {
        cur.push(wedgeXml("stop"));
        wedgeOpen = false;
      }
      if (ticks > 0) close(false);
      cur.push(`<print new-page="yes"/>`);
      if (first && br) cur.push(`<direction placement="above"><direction-type><rehearsal>${esc(br)}</rehearsal></direction-type></direction>`);
    }
    if (t.kind === "bar" && t.repeat) {
      const fwd = `<barline location="left"><bar-style>heavy-light</bar-style><repeat direction="forward"/></barline>`;
      const noteIn = cur.some((x) => x.startsWith("<note"));
      if (t.repeat === "start" && ticks === 0 && !noteIn) {
        cur.push(fwd);
        continue;
      }
      let right = "";
      if (t.repeat === "end" || t.repeat === "both") {
        const stop = ending && ending.closedByRepeat ? `<ending number="${ending.num}" type="stop"/>` : "";
        right = `<barline location="right"><bar-style>light-heavy</bar-style>${stop}<repeat direction="backward"${t.times && t.times > 2 ? ` times="${t.times}"` : ""}/></barline>`;
        if (stop) ending = null;
      }
      close(true, right);
      if (t.repeat === "start" || t.repeat === "both") cur.push(fwd);
      continue;
    }
    if (t.kind === "bar") {
      close(true, t.style ? `<barline location="right"><bar-style>${t.style === "double" ? "light-light" : "light-heavy"}</bar-style></barline>` : "");
      continue;
    }
    if (t.kind === "nav") {
      if (t.what === "ending") {
        if (ticks >= len) close(false);
        const num = (t.nums ?? [1]).join(", ");
        cur.push(`<barline location="left"><ending number="${num}" type="start">${esc(endingLabel(t.nums))}</ending></barline>`);
        ending = { num, closedByRepeat: endingCloses(i) };
      } else {
        if ((t.what === "segno" || t.what === "coda") && ticks >= len) close(false);
        cur.push(navXml(t));
      }
      continue;
    }
    if (t.kind === "phrase") continue;
    if (t.kind === "key" || t.kind === "time" || t.kind === "tempo") {
      if (ticks >= len || t.kind === "time" && ticks > 0) close(false);
      if (t.kind === "key") cur.push(`<attributes><key><fifths>${t.fifths}</fifths></key></attributes>`);
      else if (t.kind === "time") {
        cur.push(`<attributes><time><beats>${t.beats}</beats><beat-type>${t.beatType}</beat-type></time></attributes>`);
        len = measureLen(t.beats, t.beatType);
      } else if (first) cur.push(tempoXml(t.bpm));
      continue;
    }
    if (t.kind === "dyn") {
      if (ticks >= len) close(false);
      if (wedgeOpen) {
        cur.push(wedgeXml("stop"));
        wedgeOpen = false;
      }
      cur.push(dynXml(t.value));
      let end = toks.length;
      for (const b of breaks?.keys() ?? []) if (b > i && b < end) end = b;
      const j = rampTarget(toks, i, end);
      if (j >= 0) {
        const a = DYN_ORDER.indexOf(t.value), b = DYN_ORDER.indexOf(toks[j].value);
        if (a !== b) {
          cur.push(wedgeXml(b > a ? "crescendo" : "diminuendo", ` line-type="dashed" id="${RAMP_ID}${toks[j].id}"`));
          wedgeOpen = true;
        }
      }
      continue;
    }
    if (t.kind === "hairpin") {
      if (ticks >= len) close(false);
      if (wedgeOpen) cur.push(wedgeXml("stop"));
      cur.push(wedgeXml(t.dir === "cresc" ? "crescendo" : "diminuendo"));
      wedgeOpen = true;
      continue;
    }
    if (t.kind === "groove") {
      if (ticks >= len) close(false);
      cur.push(grooveXml(t));
      continue;
    }
    if (t.kind === "clef") {
      if (staves === 1) {
        if (ticks >= len) close(false);
        cur.push(`<attributes>${clefXml(t.clef)}</attributes>`);
      }
      continue;
    }
    if (t.kind === "ottava") {
      if (ticks >= len) close(false);
      const x = ottavaXml(t.shift, ottOpen, !!t.auto);
      if (x) cur.push(x);
      ottOpen = t.shift;
      continue;
    }
    if (t.kind !== "note" && t.kind !== "rest") continue;
    let left = t.dur, k = 0;
    const tieOut = t.kind === "note" && nextTimed(i)?.kind === "note" && nextTimed(i).tie;
    let lyricDone = false;
    while (left > 0.5) {
      if (ticks >= len) close(false);
      const piece = Math.min(left, len - ticks), firstPiece = k === 0, last = left - piece <= 0.5;
      const ty = noteType(piece);
      const id = `${t.kind === "note" ? "n" : "r"}${t.id}${firstPiece ? "" : `-${k + 1}`}`;
      let x = `<note id="${id}">`;
      if (t.kind === "rest") x += `<rest/><duration>${Math.round(piece)}</duration>`;
      else {
        const tieIn = firstPiece ? !!t.tie : true, tieOn = last ? tieOut : true;
        x += pitchXml(effectivePitch(toks, i)) + `<duration>${Math.round(piece)}</duration>` + (tieIn ? `<tie type="stop"/>` : "") + (tieOn ? `<tie type="start"/>` : "");
      }
      x += `<voice>1</voice>`;
      const typeXml = ty ? `<type>${ty.type}</type>` + "<dot/>".repeat(ty.dots) + (ty.tuplet ? `<time-modification><actual-notes>${ty.tuplet[0]}</actual-notes><normal-notes>${ty.tuplet[1]}</normal-notes></time-modification>` : "") : "";
      const staffXml = staves === 2 ? `<staff>${staffs[i]}</staff>` : "";
      const ghostH = t.kind === "note" && (t.art ?? []).includes("ghost"), whisperH = t.kind === "note" && (t.art ?? []).includes("whisper");
      const headXml = ghostH || whisperH ? `<notehead${ghostH ? ` parentheses="yes"` : ""}>${whisperH ? "x" : "normal"}</notehead>` : "";
      x += typeXml + headXml + staffXml;
      const chordXml = [];
      if (t.kind === "note") {
        const tieIn = firstPiece ? !!t.tie : true, tieOn = last ? tieOut : true;
        const arts = (t.art ?? []).filter((a) => !!ART_XML[a] && (a === "breath" ? last : firstPiece)), noteDyn = arts.filter((a) => NOTE_DYN.includes(a)), artic = arts.filter((a) => !NOTE_DYN.includes(a));
        const inhaleXml = (a) => a === "breath" && t.inhale ? `<other-articulation>${t.inhale === "big" ? "inhale-big" : "inhale"}</other-articulation>` : "";
        const artXml = (artic.length ? `<articulations>${artic.map((a) => `<${ART_XML[a]}/>` + inhaleXml(a)).join("")}</articulations>` : "") + (noteDyn.length ? `<dynamics>${noteDyn.map((a) => `<${ART_XML[a]}/>`).join("")}</dynamics>` : "");
        const slurXml = firstPiece ? slurs(i, t) : "";
        const arpXml = firstPiece && (t.art ?? []).includes("arpeggio") ? "<arpeggiate/>" : "";
        if (tieIn || tieOn || artXml || slurXml || arpXml) x += `<notations>${tieIn ? `<tied type="stop"/>` : ""}${tieOn ? `<tied type="start"/>` : ""}${slurXml}${artXml}${arpXml}</notations>`;
        for (const [ci, cp] of (t.chord ?? []).entries()) {
          chordXml.push(`<note id="${id}c${ci + 1}"><chord/>` + pitchXml(cp) + `<duration>${Math.round(piece)}</duration>` + (tieIn ? `<tie type="stop"/>` : "") + (tieOn ? `<tie type="start"/>` : "") + `<voice>1</voice>` + typeXml + headXml + staffXml + (tieIn || tieOn || arpXml ? `<notations>${tieIn ? `<tied type="stop"/>` : ""}${tieOn ? `<tied type="start"/>` : ""}${arpXml}</notations>` : "") + `</note>`);
        }
        if (!lyricDone && t.lyric) {
          if (t.lyric === MELISMA_MARK) x += `<lyric number="1"><extend/></lyric>`;
          else {
            const lang = esc(langs[i] ?? "ja"), parts = t.lyric.split(ELISION);
            x += `<lyric number="1"><syllabic>${syllabic(t)}</syllabic><text xml:lang="${lang}">${esc(parts[0])}</text>` + parts.slice(1).map((p) => `<elision/><syllabic>single</syllabic><text xml:lang="${lang}">${esc(p)}</text>`).join("") + `</lyric>`;
          }
        }
        lyricDone = true;
      }
      x += `</note>`;
      cur.push(x);
      for (const cx of chordXml) cur.push(cx);
      ticks += piece;
      left -= piece;
      k++;
    }
    if (t.kind === "note" && !t.pitch) unwritten.push(`n${t.id}`);
  }
  if (wedgeOpen) cur.push(wedgeXml("stop"));
  if (cur.length || !measures.length) close(false);
  return { measures, unwritten, lastLen: len };
}
function writeMusicXml(doc, meta) {
  const paper = doc.paper ?? paperOf(DEFAULT_PAPER);
  autoSeq = 0;
  const built = doc.parts.map((p, k) => ({ p, ...partMeasures(p.tokens, p.breaks, k === 0, p.info.clef ?? "G", p.info.staves === 2 ? 2 : 1) }));
  const nMeas = Math.max(0, ...built.map((b) => b.measures.length));
  const manualBars = {}, unwritten = [];
  const bodies = built.map((b) => {
    const mb = [];
    const ms = b.measures.map((m, n) => {
      if (m.manual) mb.push(n + 1);
      return `<measure number="${n + 1}">${m.body.join("")}</measure>`;
    });
    if (doc.padMeasures) for (let n = b.measures.length; n < nMeas; n++) ms.push(`<measure number="${n + 1}"><note><rest measure="yes"/><duration>${Math.round(b.lastLen)}</duration><voice>1</voice></note></measure>`);
    manualBars[b.p.info.id] = mb;
    unwritten.push(...b.unwritten);
    return `<part id="${b.p.info.id}">
${ms.join("\n")}
</part>`;
  });
  const partList = doc.parts.map(({ info: P }) => `<score-part id="${P.id}"><part-name>${esc(P.name)}</part-name><score-instrument id="${P.id}-I1"><instrument-name>${esc(P.instrumentName)}</instrument-name><instrument-sound>${esc(P.sound)}</instrument-sound>${P.variant ? `<virtual-instrument><virtual-library>${esc(P.variant.library)}</virtual-library><virtual-name>${esc(P.variant.name)}</virtual-name></virtual-instrument>` : ""}</score-instrument><midi-instrument id="${P.id}-I1"><midi-program>${P.program}</midi-program>${P.volume !== void 0 ? `<volume>${P.volume}</volume>` : ""}${P.pan !== void 0 ? `<pan>${P.pan}</pan>` : ""}</midi-instrument></score-part>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
${doc.title ? `<work><work-title>${esc(doc.title)}</work-title></work>
` : ""}${doc.movementTitle ? `<movement-title>${esc(doc.movementTitle)}</movement-title>
` : ""}<identification>${doc.rights ? `<rights>${esc(doc.rights)}</rights>` : ""}<encoding><software>${esc(meta.software)}</software><encoding-date>${esc(meta.date)}</encoding-date></encoding></identification>
${defaultsXml(paper)}
${doc.credits ? creditXml(doc.credits, paper) + "\n" : ""}<part-list>${partList}</part-list>
${bodies.join("\n")}
</score-partwise>
`;
  return { xml, manualBars, unwritten };
}

// src/format/contract.ts
var FORMAT = { manifest: 2, score: 2, lounge: 2, studio: 2 };
var FORMAT_MINOR = { manifest: 1, score: 1, lounge: 1, studio: 1 };
var FORMAT_PATCH = { manifest: 0, score: 0, lounge: 0, studio: 0 };

// src/format/sha256-sync.ts
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var rotr = (x, n) => x >>> n | x << 32 - n;
function sha256HexSync(data) {
  const len = data.length, bitLen = len * 8;
  const padded = new Uint8Array(len + 9 + 63 >> 6 << 6);
  padded.set(data);
  padded[len] = 128;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 4294967296));
  dv.setUint32(padded.length - 4, bitLen >>> 0);
  const H = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
  const W = new Uint32Array(64);
  for (let o = 0; o < padded.length; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ W[i - 15] >>> 3, s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ W[i - 2] >>> 10;
      W[i] = W[i - 16] + s0 + W[i - 7] + s1 >>> 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = e & f ^ ~e & g, t1 = h + S1 + ch + K[i] + W[i] >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), maj = a & b ^ a & c ^ b & c, t2 = S0 + maj >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + t1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 >>> 0;
    }
    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
    H[5] = H[5] + f >>> 0;
    H[6] = H[6] + g >>> 0;
    H[7] = H[7] + h >>> 0;
  }
  let out = "";
  for (let i = 0; i < 8; i++) out += H[i].toString(16).padStart(8, "0");
  return out;
}
var sha256TextSync = (s) => sha256HexSync(new TextEncoder().encode(s));

// src/format/final.ts
var FINAL_MP3_ENTRY = ".moonsinger/final.mp3";
var ENCODING = /<encoding>[\s\S]*?<\/encoding>\s*/g;
function strippedXml(xml) {
  return xml.replace(ENCODING, "");
}
function scoreExtNoView(text2) {
  const o = JSON.parse(text2);
  if ("view" in o) delete o.view;
  return JSON.stringify(o);
}
function contentFingerprint(p) {
  const papers = Object.keys(p.papers).sort().map((id) => [id, strippedXml(p.papers[id])]);
  const lounge = Object.keys(p.lounge).sort().map((id) => [id, JSON.stringify(JSON.parse(p.lounge[id]))]);
  const studio = JSON.stringify(JSON.parse(p.studio));
  const thumbnail = p.thumbnail ? sha256HexSync(p.thumbnail) : null;
  return sha256TextSync(JSON.stringify({ v: 2, papers, scoreExt: scoreExtNoView(p.scoreExt), lounge, studio, sounds: [...p.sounds].sort(), thumbnail }));
}

// src/singer/packs.gen.ts
var SINGER = { "voice": "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007", "runtime": "runtime-onnxruntime-web-1.30.0-20261001", "lang": { "ja": "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", "zh": "lang-zh-pinyin-20261001", "en": "lang-en-cmudict-20261001" } };
var PACKS = {
  "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007": { "packId": "56d81c8eb51e693e937397e2557ac3af4dff328e420b761c6e5df8b8b5b80ca6", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 25165824, "name": "chunk-000", "sha256": "269d70de8efb9ef41cdfd5de0a4acd220eb263163c8d1586c2b627c8cb1eaec6" }, { "bytes": 14503410, "name": "chunk-001", "sha256": "56131bbd5133d34a5d7cf4bd668c83a2da1fe8157fbbb849a94c4d1b9569b4ff" }], "createdAt": "2026-10-07", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "piper-plus-voice", "sampleRate": 22050, "speakers": 1 }, "files": [{ "bytes": 39662905, "offset": 0, "path": "model.onnx", "sha256": "d10f3806abeda0ec9ee294d0e39ef5f3884c47b4b09028d23375b71db4107712" }, { "bytes": 6329, "offset": 39662905, "path": "config.json", "sha256": "f6a373726beef08f9094e97f434185b1f9840b76ced0a73281fc40023b02d02d" }], "lang": ["ja", "en", "zh", "es", "fr", "pt"], "license": { "attribution": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\uFF08CV.\u5922\u524D\u9ECE\uFF09https://tyc.rei-yumesaki.net/material/corpus/ \uFF1Bmodel: derivative of ayousanz/piper-plus-tsukuyomi-chan; zh/en language vectors from ayousanz/piper-plus-base (CC-BY-4.0)", "file": "LICENSE.txt", "name": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF1Bmodel card: license other / tsukuyomi-chan-corpus\uFF09+ base model CC-BY-4.0", "sha256": "ff76774a797dfedbd00d6b0b167cebf5ceb341d380d865ed4cba495310ace4d9" }, "name": "\u6708\u8BFB\uFF08\u4E2D\u82F1\u589E\u5F3A\uFF0C\u65F6\u957F\u53EF\u63A5\u7BA1\uFF09\u2014 \u3064\u304F\u3088\u307F\u3061\u3083\u3093 piper-plus \u516D\u8BED\u5355\u97F3\u8272\uFF0Cfp16\uFF0C\u4E2D\u82F1\u6539\u8BFB\u5E95\u6A21\u7684\u8BED\u8A00\u5411\u91CF + dur_override \u8F93\u5165\uFF08\u5531\u6B4C\u7528\uFF09", "notes": "Modified model (see LICENSE.txt \xA7[4]). Needs the runtime pack (onnxruntime-web) and one text-frontend pack per language. With dur_override all zeros it reads exactly like voice-tsukuyomi-chan-zhen-6lang-fp16-20261002. The credit block and the four prohibited uses must be shown in the product UI.", "sha256": "466803b3eba2be734c26955c1b701a7e64e566a3e997474c4c744666768e56f9", "slug": "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007", "source": { "converted": "dur_override input on top of voice-tsukuyomi-chan-zhen-6lang-fp16-20261002 (see LICENSE.txt \xA7[4]); all zeros = that pack, sample-identical", "file": "voice-tsukuyomi-chan-zhen-6lang-fp16-20261002/model.onnx @ sha256 ae7ab68a\u2026 + piper-plus/dur-override-exp/make_dur_override.py; config.json = that pack's", "model": "https://huggingface.co/ayousanz/piper-plus-tsukuyomi-chan" }, "task": "tts", "totalBytes": 39669234, "v": 1 } },
  "runtime-onnxruntime-web-1.30.0-20261001": { "packId": "f76668f9383b922aef483f4c0a374fb727b9a9203d230cb2fceabb34fc4459be", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 3687160, "name": "chunk-000", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "onnxruntime-web", "engineConfig": { "kind": "wasm-runtime", "version": "1.30.0" }, "files": [{ "bytes": 3687160, "offset": 0, "path": "ort-wasm-simd-threaded.wasm.gz", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "lang": [""], "license": { "attribution": "ONNX Runtime (Microsoft)", "file": "LICENSE.txt", "name": "MIT (Microsoft, onnxruntime)", "sha256": "2f07c72751aed99790b8a4869cf2311df85a860b22ded05fa22803587a48922c" }, "name": "onnxruntime-web 1.30.0\uFF08WASM \u63A8\u7406\u8FD0\u884C\u65F6\uFF0C\u5355\u7EBF\u7A0B SIMD\uFF09", "notes": "Engine binary. The matching JS glue (ort.wasm.bundle.min.mjs) is vendored in the app, not in this pack.", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788", "slug": "runtime-onnxruntime-web-1.30.0-20261001", "source": { "converted": "", "file": "dist/ort-wasm-simd-threaded.wasm (unmodified)", "model": "https://www.npmjs.com/package/onnxruntime-web/v/1.30.0" }, "task": "runtime", "totalBytes": 3687160, "v": 1 } },
  "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001": { "packId": "b66632d8ab153a865e2727d745794da248a9c748558920bfd004443cdb9f2d4c", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 24471527, "name": "chunk-000", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "ja" }, "files": [{ "bytes": 22438129, "offset": 0, "path": "ja/sys.dic.gz", "sha256": "b1804e8c2e6244bb36c7c24eb5af9d4307a80acfb481dcffdc71c7aa60ede055" }, { "bytes": 1867237, "offset": 22438129, "path": "ja/matrix.bin.gz", "sha256": "824f60e50360fb2b186b16d1fe5fd6312919f03c33a73bc86ece37a301b3f0b8" }, { "bytes": 643, "offset": 24305366, "path": "ja/char.bin.gz", "sha256": "335d6f4a6c6cd50ab1d0782dbf6b13ab9e2bed08ed1fd34c97d499d4a05fb665" }, { "bytes": 782, "offset": 24306009, "path": "ja/unk.dic.gz", "sha256": "03721395b79e257fbd2b0e742a4faaed6073ecb79b0cf615fbe352995581b603" }, { "bytes": 147207, "offset": 24306791, "path": "ja/ojt.wasm.gz", "sha256": "97a8738abbdc773b4785b1f6ba849c432a5764cf13c1637df4da630a82f45f8a" }, { "bytes": 17529, "offset": 24453998, "path": "ja/nani-model.json.gz", "sha256": "0427c6cfe53f6c4d771f6c3e50fea06ddeaac96f5e24bdab4f49493395c9630a" }], "lang": ["ja"], "license": { "attribution": "Open JTalk (Nagoya Institute of Technology); MeCab (Taku Kudo, NTT); NAIST Japanese Dictionary; pyopenjtalk / pyopenjtalk-plus (tsukumijima et al.)", "file": "LICENSE.txt", "name": "Modified BSD (Open JTalk) + BSD (MeCab) + BSD-3-Clause style (NAIST-jdic / Open JTalk dictionary) + MIT (pyopenjtalk-plus)", "sha256": "b8dd3d66249df450fc71f3f8f8f29da02b5b01b8b47c03f412af8bc16090c1bb" }, "name": "\u65E5\u8BED\u6587\u672C\u524D\u7AEF\uFF08OpenJTalk + pyopenjtalk-plus \u8BCD\u5178\uFF09", "notes": "ojt.wasm is an engine binary built on 2026-10-01 from the upstream sources (wrapper source: backend/vendor/ojt/ojt_wasm.c). 160 MB initial heap.", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60", "slug": "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", "source": { "converted": "", "file": "dictionary: wheel pyopenjtalk/dictionary/; ojt.wasm: built from the sdist (sha256 cdcb0746659857554c6dad23956cad77e21f76c9f3dfa000ea2f8d4f0ba11d99) with Emscripten 6.0.10; nani-model.json: exported from pyopenjtalk/yomi_model/", "model": "https://pypi.org/project/pyopenjtalk-plus/0.4.1.post9/" }, "task": "tts-frontend", "totalBytes": 24471527, "v": 1 } },
  "lang-zh-pinyin-20261001": { "packId": "a84c73d781c805a65b73deb3b39ac9f5fedd15f0cdf3d66b925005c8152af9e3", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 686220, "name": "chunk-000", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "zh" }, "files": [{ "bytes": 186217, "offset": 0, "path": "zh/pinyin_single.tone3.json.gz", "sha256": "ec5c44ed3cd18eda41a04a7831f8d069600cdfb19e55e5b001a42bbdf3a4ad82" }, { "bytes": 500003, "offset": 186217, "path": "zh/pinyin_phrases.tone3.json.gz", "sha256": "43dd0534a63c6bddb4c0f20ee88f19f5933875ff3979acc777652028a66f5ba8" }], "lang": ["zh"], "license": { "attribution": "pypinyin, pinyin-data, phrase-pinyin-data (mozillazg)", "file": "LICENSE.txt", "name": "MIT (pypinyin / pinyin-data / phrase-pinyin-data)", "sha256": "82783f291266e986df7494586db072217e2940227f93208f4f920a53b7a7d91e" }, "name": "\u4E2D\u6587\u62FC\u97F3\u8BCD\u5178\uFF08pypinyin \u6570\u636E\uFF09", "notes": "Tone marks converted to tone-number style (the form the model's phoneme table expects).", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1", "slug": "lang-zh-pinyin-20261001", "source": { "converted": "", "file": "piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/pinyin_{single,phrases}.json, tone marks converted to tone numbers", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 686220, "v": 1 } },
  "lang-en-cmudict-20261001": { "packId": "e54e7243870cef39d5015a51fe7fc57917da946908223a3d5baa5cab85956226", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 868090, "name": "chunk-000", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "en" }, "files": [{ "bytes": 863232, "offset": 0, "path": "en/cmudict_data.json.gz", "sha256": "3083a0cf26e01398a6877c8834150f03a230baf6965832b00bfae699063208f4" }, { "bytes": 4858, "offset": 863232, "path": "en/homographs.json.gz", "sha256": "2ef14b6d49476790fdb2008150d417cb9069f7dcb74c25706a43bcc3fe5c4187" }], "lang": ["en"], "license": { "attribution": "CMU Pronouncing Dictionary (Carnegie Mellon University); g2p-en (Kyubyong Park & Jongseok Kim)", "file": "LICENSE.txt", "name": "BSD-2-Clause style (CMU Pronouncing Dictionary) + Apache-2.0 (g2p-en homographs)", "sha256": "3d3a944042879fa3c5a25c317ea7e609c0efa7cf0900c0c298ba331953c27039" }, "name": "\u82F1\u8BED\u53D1\u97F3\u8BCD\u5178\uFF08CMUdict + \u540C\u5F62\u5F02\u97F3\u8868\uFF09", "notes": "homographs.json is a format conversion of g2p-en's homographs.en (Apache-2.0 \xA74: modified file notice).", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926", "slug": "lang-en-cmudict-20261001", "source": { "converted": "", "file": "cmudict_data.json: piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/; homographs.json: PyPI g2p-en 2.1.0 g2p_en/homographs.en converted to JSON (content unchanged)", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 868090, "v": 1 } }
};
var CREDIT = { "credit": "\u672C\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u97F3\u58F0\u5408\u6210\u306B\u306F\u3001\u30D5\u30EA\u30FC\u7D20\u6750\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u300C\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u300D\uFF08\xA9 Rei Yumesaki\uFF09\u304C\u7121\u6599\u516C\u958B\u3057\u3066\u3044\u308B\u97F3\u58F0\u30C7\u30FC\u30BF\u3092\u4F7F\u7528\u3057\u3066\u3044\u307E\u3059\u3002\n\u25A0\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\uFF08CV.\u5922\u524D\u9ECE\uFF09\nhttps://tyc.rei-yumesaki.net/material/corpus/", "terms": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u306E\u58F0\u8CEA\u3092\u4F7F\u7528\u3059\u308B\u5834\u5408\u306F\u3001\u51FA\u529B\u3057\u305F\u97F3\u58F0\u3092\u6B21\u306E\u76EE\u7684\u3067\u4F7F\u7528\u3059\u308B\u3053\u3068\u3092\u7981\u6B62\u3057\u307E\u3059\u3002\n\u3010\u7981\u6B62\u4E8B\u9805\u3011\n\u25A0\u4EBA\u3092\u6279\u5224\u30FB\u653B\u6483\u3059\u308B\u3053\u3068\u3002\uFF08\u300C\u6279\u5224\u30FB\u653B\u6483\u300D\u306E\u5B9A\u7FA9\u306F\u3001\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u30E9\u30A4\u30BB\u30F3\u30B9\u306B\u6E96\u3058\u307E\u3059\uFF09\n\u25A0\u7279\u5B9A\u306E\u653F\u6CBB\u7684\u7ACB\u5834\u30FB\u5B97\u6559\u30FB\u601D\u60F3\u3078\u306E\u8CDB\u540C\u307E\u305F\u306F\u53CD\u5BFE\u3092\u547C\u3073\u304B\u3051\u308B\u3053\u3068\u3002\n\u25A0\u523A\u6FC0\u306E\u5F37\u3044\u8868\u73FE\u3092\u30BE\u30FC\u30CB\u30F3\u30B0\u306A\u3057\u3067\u516C\u958B\u3059\u308B\u3053\u3068\u3002\n\u25A0\u4ED6\u8005\u306B\u5BFE\u3057\u3066\u4E8C\u6B21\u5229\u7528\uFF08\u7D20\u6750\u3068\u3057\u3066\u306E\u5229\u7528\uFF09\u3092\u8A31\u53EF\u3059\u308B\u5F62\u3067\u516C\u958B\u3059\u308B\u3053\u3068\u3002", "termsUrl": "https://tyc.rei-yumesaki.net/material/corpus/", "attribution": ["ayousanz/piper-plus-tsukuyomi-chan \u2014 \u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04 (modified: zh / en language vectors)", "ayousanz/piper-plus-base \u2014 CC-BY-4.0 (zh / en language vectors)", "Open JTalk \xB7 MeCab \xB7 NAIST-jdic \xB7 pyopenjtalk-plus \xB7 CMUdict \xB7 g2p-en \xB7 pypinyin \xB7 ONNX Runtime"] };

// src/version.ts
var APP_VERSION = "v0.14.5-2026-10-21";

// src/format/performance.ts
var DYNAMICS_DB = { ppp: -24, pp: -18, p: -12, mp: -6, mf: 0, f: 6, ff: 12, fff: 18 };
var ARTICULATION = { staccatoGate: 0.5, tenutoGate: 1, accentDb: 4 };
var MARK_DEFAULTS = {
  accentSec: 0.12,
  // 重音 / 强音：音头加重持续多久（秒；月读 / 元音版 / 旧乐器的 dB 那一路）
  breathSec: 0.16,
  breathShare: 0.25,
  // 呼吸：前一个音收短多少（秒），最多占这个音的几分之几（元音版 / 乐器）
  gapShare: 0.25,
  // 连断底色的缝最多吃掉这个音的几分之几
  wedgeStepDb: 6,
  wedgeStepVel: 16,
  // 渐强渐弱后面没写力度记号 = 走一档：dB 那一路 / 力度那一路各走多少
  sfzDb: 9,
  sfzVel: 32,
  sfzSec: 0.2,
  // 突强：音头比当下高多少（dB 那一路，sfzSec 里落回来）/ 力度那一路加多少
  fpSec: 0.2,
  // 强后即弱：音头按这位的 f，这么久落到 p（之后的音都是 p）
  arpeggioSec: 0.035,
  // 琶音（v0.9.45 / v0.9.48）：旋律（最上面）准时落拍，下面的从低到高每个提早这么多秒（最多摊到这个音一半长）；35 ms = user 定的
  swellDb: 6,
  // 音内起伏：< 走到 +swellDb、> 走到 −swellDb、<> 中间到 +swellDb 再回来
  // 强度的其余几级（2026-10-08 深夜 Opus 5.5）：次重音 = 重音的一半（音头 accentSec 那一段 / 力度）；弱化 / 幽灵音 = 整个音轻下去（幽灵音 ≈ 强音反过来）
  stressDb: 2,
  stressVel: 8,
  unstressDb: -3,
  unstressVel: -10,
  ghostDb: -9,
  ghostVel: -28
};
var SING_MARKS = {
  staccato: { mark: "^", at: "next" },
  accent: { mark: "^", at: "this" },
  marcato: { mark: "^", at: "this" },
  breath: { mark: "v", at: "next" },
  sfz: { mark: "^", at: "this" },
  fp: { mark: "^", at: "this" }
  // 音头那一组都顿一下（同重音，user「嗯重音也顿」）
};
var MARCATO_DB = 7;
var DEFAULT_CALIBRATION_DB = -6;
var TSUKUYOMI_DEFAULTS = { level: 0.8, levelMaxDb: 6, cleanMax: 0.4, breath: 0, levelContinuous: 1 };
var REPO = "https://github.com/fangzhangmnm/moonsinger";
var TSUKUYOMI_CREDIT = {
  attribution: [CREDIT.credit, ...CREDIT.attribution],
  license: { name: "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF09", url: CREDIT.termsUrl, text: CREDIT.terms }
};
var TSUKUYOMI_SPEC = { kind: "ours", doc: "#tsukuyomi", source: { repo: REPO, ref: APP_VERSION, path: "src/singer/sing-core.mjs" } };
var VOWEL_SAMPLER_SPEC = { kind: "ours", doc: "#vowel-sampler", source: { repo: REPO, ref: APP_VERSION, path: "src/singer/sampler.ts" } };
var TSUKUYOMI_MODEL = { pack: SINGER.voice, sha256: PACKS[SINGER.voice].packId };

// src/format/project.ts
var MIMETYPE = "application/vnd.recordare.musicxml";
var DIR = ".moonsinger/";
var SOUNDS = `${DIR}sounds/`;
var REFERENCES_DIR = `${DIR}references/`;
var PAPERS = `${DIR}papers/`;
var paperFile = (id) => `${PAPERS}${id}.musicxml`;
var THUMBNAIL_ENTRY = "Thumbnails/thumbnail.png";
var CANDIDATE_ID = { full: "c1", light: "c2" };
var common = () => ({ calibrationDb: DEFAULT_CALIBRATION_DB, chain: [], dynamicsDb: { ...DYNAMICS_DB }, articulation: { ...ARTICULATION, gapSec: 0, marcatoDb: MARCATO_DB, ...MARK_DEFAULTS } });
function defaultRole(hum, id) {
  return { version: FORMAT.lounge, id, name: DEFAULT_ROLE.name, sound: DEFAULT_ROLE.sound, active: CANDIDATE_ID.full, candidates: [
    { id: CANDIDATE_ID.full, name: "\u5C0F\u6708\u76F8", instrument: { engine: "tsukuyomi", model: { ...TSUKUYOMI_MODEL }, hum }, gm: { program: 55, variant: "tsukuyomi" }, ...common(), sing: structuredClone(SING_MARKS), defaults: { ...TSUKUYOMI_DEFAULTS }, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(TSUKUYOMI_SPEC) },
    { id: CANDIDATE_ID.light, name: "\u5C0F\u6708\u76F8\uFF08\u5143\u97F3\uFF09", instrument: { engine: "vowel-sampler", table: "builtin", hum }, gm: { program: 55, variant: "tsukuyomi-vowels" }, ...common(), defaults: {}, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(VOWEL_SAMPLER_SPEC) }
  ] };
}
var cands = (role) => role?.candidates ?? [];
var instrumentOf = (c) => c && c.instrument && typeof c.instrument === "object" ? c.instrument : null;
var isVoice = (i) => !!i && (i.engine === "tsukuyomi" || i.engine === "vowel-sampler");
var roleOf = (extras, role, hum) => structuredClone(extras.lounge[role] ?? defaultRole(hum, role));
var stampOf = (k) => ({ version: FORMAT[k], minor: FORMAT_MINOR[k], patch: FORMAT_PATCH[k] });
var fpTextOf = (o) => {
  const { minor: _m, patch: _p, ...rest } = o;
  return JSON.stringify(rest, null, 2) + "\n";
};
var KNOWN_SCORE_KEYS = /* @__PURE__ */ new Set(["version", "minor", "patch", "papers", "parts", "view", "arrangement", "lyricFit", "barNumbers"]);
function saveMxl(a) {
  const { out, fingerprint } = buildEntries(a);
  if (a.extras.final && a.extras.final.fingerprint !== fingerprint) throw new Error("\u8FD9\u9996\u6B4C\u5B9A\u7A3F\u4E86\uFF0C\u5185\u5BB9\u5374\u53D8\u4E86\uFF1A\u5B9A\u7A3F\u7740\u4E0D\u80FD\u8FD9\u6837\u5B58\u3002\u5148\u300C\u6539\u7A3F\u300D\u518D\u6539\uFF0C\u6216\u8005\u64A4\u9500\u521A\u624D\u7684\u6539\u52A8\u3002");
  const entries = {};
  for (const [path, bytes] of Object.entries(out)) entries[path] = [bytes, { level: path === "mimetype" || path === THUMBNAIL_ENTRY || path === FINAL_MP3_ENTRY ? 0 : path.startsWith(SOUNDS) ? 1 : path.startsWith(REFERENCES_DIR) && !path.endsWith(".json") ? 0 : 6 }];
  return zipSync(entries);
}
function buildEntries(a) {
  const song = a.song;
  const lounge = { ...a.extras.lounge };
  for (const part of song.parts) {
    const role = roleOf(a.extras, part.role, a.hum);
    for (const c of cands(role)) {
      const i = instrumentOf(c);
      if (isVoice(i)) i.hum = a.hum;
    }
    lounge[part.role] = role;
  }
  const studio = structuredClone(a.extras.studio ?? emptyStudio());
  const tracks = (studio.tracks ?? []).slice();
  for (const part of song.parts) if (!tracks.some((m) => m.id === part.mic)) tracks.push(micTrack(part.mic, `\u9EA6\u514B\u98CE ${tracks.filter((t) => t.kind === "mic").length + 1}`));
  studio.tracks = tracks;
  if (!studio.master) studio.master = { gainDb: 0, limiter: true, chain: [] };
  const mics = tracks.filter((t) => t.kind === "mic");
  const labels = partLabels(song, { ...a.extras, lounge });
  const infoOf = (part, k) => {
    const role = lounge[part.role], active = cands(role).find((c) => c.id === role.active), mic = mics.find((m) => m.id === part.mic);
    return {
      id: part.id,
      name: labels[k],
      ...part.staves === 2 ? { staves: 2 } : {},
      instrumentName: String(active?.name ?? "\u5C0F\u6708\u76F8"),
      sound: String(role.sound ?? DEFAULT_ROLE.sound),
      program: Number(active?.gm?.program ?? 55),
      variant: typeof active?.gm?.variant === "string" ? { library: "MoonSinger", name: String(active.gm.variant) } : void 0,
      pan: mic ? Math.round(Number(mic.pan ?? 0) * 90) : void 0
    };
  };
  const infos = song.parts.map(infoOf), meta = { software: `MoonSinger ${a.app}`, date: a.date };
  const files = {};
  const clefStarts = resolveSongClefs(song);
  const autoOtt = (part) => part.staves !== 2 && part.autoOttava !== false;
  const clefInfo = (paperId, part) => {
    const c = part.staves === 2 ? void 0 : clefStarts.get(paperId)?.get(part.id);
    return c && c !== "G" ? { clef: c } : {};
  };
  const papers = song.papers.map((p) => {
    const parts = song.parts.flatMap((part, k) => p.tracks[part.id] ? [{ info: { ...infos[k], ...clefInfo(p.id, part) }, tokens: autoOtt(part) ? withAutoOttava(p.tracks[part.id], clefStarts.get(p.id)?.get(part.id) ?? "G") : p.tracks[part.id] }] : []);
    const w = writeMusicXml({ title: song.title, movementTitle: p.name || void 0, paper: song.paper, credits: song.credits, rights: song.rights, parts }, meta);
    files[paperFile(p.id)] = strToU8(w.xml);
    const phrases = {};
    for (const [pid, toks] of Object.entries(p.tracks)) {
      const ids = toks.flatMap((t, k) => t.kind === "phrase" && k > 0 ? [toks[k - 1].id] : []);
      if (ids.length) phrases[pid] = ids;
    }
    const swells = {};
    for (const [pid, toks] of Object.entries(p.tracks)) for (const t of toks) {
      const sw = swellOf(t);
      if (sw) (swells[pid] ??= {})[String(t.id)] = sw;
    }
    return { id: p.id, file: paperFile(p.id), manualBars: w.manualBars, unwritten: w.unwritten, ...Object.keys(phrases).length ? { phrases } : {}, ...Object.keys(swells).length ? { swells } : {}, ...p.hidden ? { hidden: true } : {} };
  });
  const flat = writeMusicXml({ title: song.title, paper: song.paper, credits: song.credits, rights: song.rights, padMeasures: true, parts: song.parts.map((part, k) => {
    const f = flattenPart(song, part.id, { tempo: k === 0, order: songPlayOrder(song) });
    let toks = f.tokens.slice(), starts = f.starts.map((x) => ({ ...x }));
    if (autoOtt(part) && starts.length) {
      const out2 = toks.slice(0, starts[0].index), ns = starts.map((x) => ({ ...x }));
      starts.forEach((s0, j) => {
        ns[j].index = out2.length;
        out2.push(...withAutoOttava(toks.slice(s0.index, starts[j + 1]?.index ?? toks.length), clefStarts.get(s0.paper.id)?.get(part.id) ?? "G"));
      });
      toks = out2;
      starts = ns;
    }
    const first = part.staves === 2 ? void 0 : clefStarts.get(starts[0]?.paper.id ?? "")?.get(part.id);
    if (first) {
      let off = 0;
      for (let j = 1; j < starts.length; j++) {
        const at = starts[j].index + off, want = clefStarts.get(starts[j].paper.id)?.get(part.id);
        starts[j].index = at;
        if (!want) continue;
        const ds = displayStates(toks.slice(0, at), first), now = at > 0 ? ds.clef[at - 1] : first;
        if (now !== want) {
          toks.splice(at, 0, { kind: "clef", id: 0, clef: want });
          off++;
        }
      }
    }
    return { info: { ...infos[k], ...first && first !== "G" ? { clef: first } : {} }, tokens: toks, breaks: new Map(starts.slice(1).map((s) => [s.index, s.paper.name])) };
  }) }, meta);
  const scoreRest = Object.fromEntries(Object.entries(a.extras.scoreExt ?? {}).filter(([k]) => !KNOWN_SCORE_KEYS.has(k)));
  const scoreExt = {
    ...scoreRest,
    ...stampOf("score"),
    papers,
    parts: song.parts.map((p) => ({ id: p.id, role: p.role, mic: p.mic, kind: "pitched", ...p.staves === 2 ? {} : { clef: p.clef ?? "auto" }, ...p.autoOttava === false ? { autoOttava: false } : {}, ...p.host ? { host: p.host } : {} })),
    // clef（v0.9.28，可选）：声部自己的谱号；auto = 自动（MusicXML 里写的是挑好的那个）
    ...a.view && Object.keys(a.view).length ? { view: a.view } : {},
    // 视图态（desk）：存时顺手捞进来，全默认不写（契约 ViewV1，2026-10-08）
    ...song.arrangement?.trim() ? { arrangement: song.arrangement } : {},
    // 编排那一行（可选，2026-10-08 深夜）
    ...song.lyricFit === "lyrics" ? { lyricFit: "lyrics" } : {},
    ...song.barNumbers === "off" ? { barNumbers: "off" } : {}
  };
  const referenced = referencedSounds(lounge);
  const sounds = Object.entries(a.extras.sounds).filter(([p]) => referenced.has(p)).sort(([x], [y]) => x < y ? -1 : 1);
  const json = (o) => strToU8(JSON.stringify(o, null, 2) + "\n");
  const jsonText = (o) => JSON.stringify(o, null, 2) + "\n";
  const fpParts = {
    papers: Object.fromEntries(papers.map((p) => [p.id, strFromU8(files[p.file])])),
    scoreExt: fpTextOf(scoreExt),
    lounge: Object.fromEntries(Object.entries(lounge).map(([id, r]) => [id, fpTextOf(r)])),
    studio: fpTextOf(studio),
    sounds: sounds.map(([p]) => p),
    thumbnail: a.extras.thumbnail
  };
  const fingerprint = contentFingerprint(fpParts);
  const { final: _f, finalRev: _r, core: _c, ...manifestRest } = a.extras.manifest ?? {};
  const manifest = {
    ...manifestRest,
    format: "moonsinger",
    ...stampOf("manifest"),
    app: a.app,
    saved: a.date,
    files: {
      "score.json": FORMAT.score,
      "studio.json": FORMAT.studio,
      ...Object.fromEntries(Object.entries(lounge).map(([id, r]) => [`lounge/${id}.json`, Number(r.version ?? 1)])),
      ...Object.fromEntries(papers.map((p) => [`papers/${p.id}.musicxml`, 0]))
    },
    // 0 = 标准件（MusicXML），不是我们的版本号
    derived: ["score.musicxml"],
    sounds: sounds.map(([path, b]) => ({ path, sha256: path.slice(SOUNDS.length).replace(/\.sf2$/, ""), bytes: b.length })),
    ...a.core ? { core: { version: a.core.version, hash: a.core.hash } } : {},
    // 渲染核心的版本 + 哈希（每次存都记）
    ...a.extras.finalRev > 0 ? { finalRev: a.extras.finalRev } : {},
    ...a.extras.final && a.extras.finalMp3 ? { final: a.extras.final } : {}
  };
  const rootfiles = [
    `<rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>`,
    ...a.extras.rootfiles.map((r) => `<rootfile full-path="${r.path}" media-type="${r.mediaType}"/>`)
  ].join("\n    ");
  const out = {};
  out["mimetype"] = strToU8(MIMETYPE);
  out["META-INF/container.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    ${rootfiles}
  </rootfiles>
</container>
`);
  out["score.musicxml"] = strToU8(flat.xml);
  out[`${DIR}score.json`] = json(scoreExt);
  for (const [path, bytes] of Object.entries(files)) out[path] = bytes;
  for (const [id, r] of Object.entries(lounge)) out[`${DIR}lounge/${id}.json`] = json({ ...r, ...stampOf("lounge") });
  out[`${DIR}studio.json`] = json({ ...studio, ...stampOf("studio") });
  for (const [path, bytes] of sounds) out[path] = bytes;
  for (const [path, bytes] of Object.entries(a.references ?? {})) {
    if (!path.startsWith(REFERENCES_DIR)) throw new Error(`\u53C2\u8003\u7A97\u7684\u6587\u4EF6\u4E0D\u5728 ${REFERENCES_DIR} \u4E0B\uFF1A${path}`);
    out[path] = bytes;
  }
  if (a.extras.final && a.extras.finalMp3) out[FINAL_MP3_ENTRY] = a.extras.finalMp3;
  for (const [path, bytes] of Object.entries(a.extras.unknown)) if (!(path in out) && path !== THUMBNAIL_ENTRY && path !== FINAL_MP3_ENTRY) out[path] = bytes;
  out[`${DIR}manifest.json`] = json(manifest);
  if (a.extras.thumbnail) out[THUMBNAIL_ENTRY] = a.extras.thumbnail;
  return { out, fingerprint };
}
function roleName(extras, role) {
  return String(extras.lounge[role]?.name ?? DEFAULT_ROLE.name);
}
function roleSound(extras, role) {
  return String(extras.lounge[role]?.sound ?? DEFAULT_ROLE.sound);
}
function partLabels(song, extras) {
  return numberParts(song.parts.map((p) => ({ name: roleName(extras, p.role), sound: roleSound(extras, p.role) })));
}
var emptyStudio = () => ({ version: FORMAT.studio, tracks: [], master: { gainDb: 0, limiter: true, chain: [] } });
var micTrack = (id, name) => ({ id, kind: "mic", name, gainDb: 0, pan: 0, chain: [], sends: [], to: "master" });
function referencedSounds(lounge) {
  const refs = /* @__PURE__ */ new Set();
  for (const r of Object.values(lounge)) for (const c of cands(r)) {
    const i = instrumentOf(c);
    if (i?.engine === "soundfont" && typeof i.source?.embedded === "string") refs.add(i.source.embedded);
  }
  return refs;
}

// src/format/encode-worker.ts
function runEncodeJob(job, now = () => performance.now()) {
  const t0 = now();
  try {
    return { seq: job.seq, bytes: saveMxl(job.args), ms: now() - t0 };
  } catch (e) {
    return { seq: job.seq, error: e?.message ?? String(e) };
  }
}
if (typeof document === "undefined" && typeof self !== "undefined" && typeof self.postMessage === "function") {
  const ws = self;
  ws.onmessage = (e) => {
    const r = runEncodeJob(e.data);
    if ("bytes" in r) ws.postMessage(r, [r.bytes.buffer]);
    else ws.postMessage(r);
  };
}
export {
  runEncodeJob
};
//# sourceMappingURL=encode-worker-2d31348f3d68.mjs.map
