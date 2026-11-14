var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/i18n/strings.ts
var S = {
  "\u6B63\u5728\u6838\u5BF9\u7F51\u76D8\u4E0A\u7684\u7248\u672C\u2026": { en: "Checking the version on OneDrive\u2026" },
  "\u5148\u79BB\u7EBF\u7528": { en: "Work offline for now" },
  "\u7F51\u76D8\u6CA1\u8FDE\u4E0A": { en: "OneDrive isn't connected" },
  "\u767B\u5F55\u8FC7\u671F\u4E86": { en: "Sign-in expired" },
  "\u73B0\u5728\u6CA1\u6709\u7F51\u7EDC": { en: "No network right now" },
  "\u7F51\u76D8\u6CA1\u6709\u56DE\u5E94": { en: "OneDrive isn't responding" },
  "\u91CD\u65B0\u767B\u5F55": { en: "Sign in again" },
  "\u79BB\u7EBF\u7EE7\u7EED": { en: "Continue offline" },
  "\u79BB\u7EBF \xB7 \u8FD8\u6709 {n} \u4EFD\u6CA1\u4F20\u4E0A\u53BB": { en: "Offline \xB7 {n} not uploaded yet" },
  "\u79BB\u7EBF": { en: "Offline" },
  "\u5DF2\u8FDE\u4E0A\u7F51\u76D8\uFF0C\u6B63\u5728\u540C\u6B65\u2026": { en: "Connected to OneDrive, syncing\u2026" },
  "\u770B\u5217\u8868": { en: "See the list" },
  "\u91CD\u65B0\u8FDE\u63A5": { en: "Reconnect" },
  "\u5C0F\u6708\u76F8\uFF08\u3064\u304F\u3088\u307F\u3061\u3083\u3093\uFF09\u7684\u7F72\u540D\u4E0E\u4F7F\u7528\u6761\u6B3E": { en: "Tsukuyomi-chan (\u3064\u304F\u3088\u307F\u3061\u3083\u3093) credits and terms of use" },
  "\u539F\u6587\uFF08\u4EE5\u6B64\u4E3A\u51C6\uFF09": { en: "Original text (authoritative)" },
  "\u4E2D\u6587\u8BD1\u6587\uFF08\u4EC5\u4F9B\u9605\u8BFB\uFF0C\u4EE5\u65E5\u6587\u539F\u6587\u4E3A\u51C6\uFF09": { en: "Chinese translation (for reference only; the Japanese original governs)" },
  "\u4E50\u5668\u76EE\u5F55\u7684\u56FE\u6807\uFF08\u7B2C\u4E09\u65B9\uFF0C{n} \u4E2A\uFF09": { en: "Instrument catalog icons (third-party, {n})" },
  "\uFF1B\u6539\u52A8\uFF1A{modified}": { en: "; modified: {modified}" },
  "\u590D\u5236\u4E86 {n} \u6761": { en: "Copied {n} {n|entry|entries}" },
  "\u590D\u5236\u4E0D\u4E86\uFF08\u6D4F\u89C8\u5668\u4E0D\u7ED9\u526A\u8D34\u677F\uFF09\uFF1A\u5DF2\u9009\u4E2D\uFF0C\u957F\u6309\u590D\u5236": { en: "Can't copy (the browser won't allow clipboard access): text selected, long-press to copy" },
  "\u4E0B\u8F7D\u4E86 {name}": { en: "Downloaded {name}" },
  "MoonSinger \u8BCA\u65AD\u65E5\u5FD7": { en: "MoonSinger diagnostic log" },
  "\u5206\u4EAB\u6CA1\u6210": { en: "Sharing didn't work" },
  "\uFF08\u7A7A\uFF09": { en: "(empty)" },
  "\u6E05\u7A7A\u4E86": { en: "Cleared" },
  "MusicXML \u4E50\u8C31\uFF08MoonSinger \u5B58\u6210 .mxl\uFF09": { en: "MusicXML score (MoonSinger saves as .mxl)" },
  "\u8C31 / \u6B4C\u540D / \u4F5C\u8005\u680F": { en: "The score / title / credits" },
  "\u7EB8": { en: "Sheets" },
  "\u58F0\u90E8 / \u4E50\u5668": { en: "Parts / instruments" },
  "\u6DF7\u97F3": { en: "The mix" },
  "\u5C01\u9762": { en: "The cover" },
  "{p}\uFF1A{what}\u6539\u4E0D\u4E86": { en: "{p}: {what} can't be changed" },
  "\u64A4\u9500": { en: "Undo" },
  "\u91CD\u505A": { en: "Redo" },
  "\u9501\u7740": { en: "Locked" },
  "\u89E3\u9501\uFF0C\u63A5\u7740\u6539\u8FD9\u4E00\u9996\u3002\u653E\u7740\u4E00\u5929\u4E0D\u52A8\u4F1A\u81EA\u5DF1\u9501\u4E0A\uFF1B\u968F\u65F6\u80FD\u5728\u4E09\u6761\u6760\u91CC\u300C\u9501\u4E0A\u300D": { en: "Unlock and keep editing this song. It locks itself after a day untouched; you can lock it any time from the \u2630 menu" },
  "\u63A5\u7740\u6539": { en: "Keep editing" },
  "\u5148\u628A\u73B0\u5728\u7684\u6837\u5B50\u5B58\u4E00\u7248\u7559\u5E95\uFF08\u6536\u5728\u6B4C\u5E93\u91CC\u8FD9\u9996\u6B4C\u7684\u5361\u7247\u4E0B\u9762\uFF09\uFF0C\u518D\u89E3\u9501\u63A5\u7740\u6539": { en: "Save a version of it as it is now (kept under this song\u2019s card in the library), then unlock and keep editing" },
  "\u5B58\u4E00\u7248\u518D\u6539": { en: "Save a version, then edit" },
  "{dir}/\uFF08\u6574\u4E2A\u6587\u4EF6\u5939\uFF09": { en: "{dir}/ (whole folder)" },
  "\uFF08\u6839\u6587\u4EF6\u5939\uFF09": { en: "(root folder)" },
  "\u6B4C\u5E93\u91CC\u8FD8\u6CA1\u6709\u6B4C": { en: "No songs in the library yet" },
  "\u5DF2\u5BFC\u51FA {count} \u9996\u5230 {fileName}": { en: "Exported {count} {count|song|songs} to {fileName}" },
  " \u7B49 {n} \u9879": { en: " and {n} more" },
  "\u53EA\u5BFC\u51FA\u4E86 {count} \u9996\u5230 {fileName}\u3002\u8FD9\u4E9B\u6CA1\u62FF\u5230\uFF1A{names}": { en: "Only exported {count} {count|song|songs} to {fileName}. Couldn't get: {names}" },
  "\u6CA1\u80FD\u5BFC\u51FA\uFF1A{names}": { en: "Couldn't export: {names}" },
  "\u5220\u9664\u5168\u90E8\u672C\u5730\u6570\u636E": { en: "Delete all local data" },
  "\u5220\u9664\u8FD9\u53F0\u8BBE\u5907\u4E0A MoonSinger \u7684\u5168\u90E8\u672C\u5730\u6570\u636E\uFF1A\u6B4C\u5E93\u91CC\u7684\u6B4C\uFF08\u672C\u673A\u526F\u672C\uFF09\u3001\u5FF5\u7F13\u5B58\u3001\u5C01\u9762\u7F13\u5B58\u3001\u8BBE\u7F6E\u3001\u8BCA\u65AD\u65E5\u5FD7\uFF1B\u79BB\u7EBF\u58F3\u4E5F\u91CD\u88C5\u3002\u4E91\u7AEF\uFF08OneDrive\uFF09\u4E0A\u7684\u6B4C\u548C\u672C\u673A\u6587\u4EF6\u4E0D\u53D7\u5F71\u54CD\u3002": { en: "Deletes all of MoonSinger's local data on this device: songs in the library (local copies), speech cache, cover cache, settings and the diagnostic log; the offline shell is reinstalled too. Songs on OneDrive and files on this device aren't affected." },
  "\u6709 {dirtyN} \u9996\u8FD8\u6CA1\u4F20\u4E0A\u53BB\uFF0C\u4F1A\u4E00\u8D77\u5220\u6389\uFF08\u4E0D\u9020\u9003\u751F\u526F\u672C\uFF09\u3002": { en: "{dirtyN} {dirtyN|song hasn't|songs haven't} been uploaded and will be deleted too (no rescue copy is made)." },
  "\u6B4C\u5E93\u91CC\u7684\u6B4C\u90FD\u4F20\u4E0A\u53BB\u4E86\u3002": { en: "All songs in the library have been uploaded." },
  "\u8FD9\u53F0\u8BBE\u5907\u6CA1\u8FDB\u8FC7\u6B4C\u5E93\u3002": { en: "This device has never opened the library." },
  "\u624B\u91CC\u8FD9\u9996\u6539\u8FC7\u8FD8\u6CA1\u5B58\uFF0C\u4E5F\u4F1A\u4E22\u3002": { en: "The song you have open has unsaved changes, and those will be lost too." },
  "\u8FD8\u539F\u51FA\u5382\u8BBE\u7F6E": { en: "Factory reset" },
  "\u7EE7\u7EED": { en: "Continue" },
  "\u9010\u5B57\u8F93\u5165\u300C{CONSENT_PHRASE}\u300D\u786E\u8BA4\u3002\u8FD9\u4E00\u6B65\u505A\u5B8C app \u4F1A\u91CD\u5F00\u6210\u65B0\u88C5\u7684\u6837\u5B50\u3002": { en: "Type \u201C{CONSENT_PHRASE}\u201D exactly to confirm. When this finishes the app reopens as if newly installed." },
  "\u5220\u9664": { en: "Delete" },
  "\u8F93\u5165\u7684\u4E0D\u4E00\u6837\uFF0C\u4EC0\u4E48\u90FD\u6CA1\u52A8\u3002": { en: "That doesn't match. Nothing was changed." },
  "\u8FD8\u6CA1\u5220\u5E72\u51C0": { en: "Not fully deleted yet" },
  "\u6709 {blocked} \u4E2A\u5E93\u88AB\u522B\u7684\u6807\u7B7E\u9875\u5360\u7740\uFF0C\u5220\u4E0D\u6389\u3002\u5173\u6389\u5176\u4ED6 MoonSinger \u6807\u7B7E\u9875\uFF08\u6216\u522B\u7684\u7A97\u53E3\uFF09\u518D\u6765\u4E00\u6B21\u2014\u2014\u518D\u505A\u4E00\u904D\u662F\u5B89\u5168\u7684\u3002": { en: "{blocked} databases are held by another tab and can't be deleted. Close other MoonSinger tabs (or windows) and try again \u2014 doing it again is safe." },
  "\u597D": { en: "OK" },
  "\u5173\u95ED": { en: "Close" },
  "\u5220\u4E86 {db} \u4E2A\u5E93\u3001{ls} \u4E2A\u952E\uFF0C\u8FD9\u53F0\u8BBE\u5907\u4E0A\u6CA1\u6709\u6B8B\u7559\u3002\u70B9\u300C\u597D\u300D\u91CD\u5F00\u3002": { en: "Deleted {db} databases and {ls} keys; nothing is left on this device. Tap OK to reopen." },
  "\u5220\u4E86 {db} \u4E2A\u5E93\u3001{ls} \u4E2A\u952E\uFF1B\u8FD8\u5269 {residue} \u5904\u6B8B\u7559\uFF08\u679A\u4E3E\u4E0D\u5230\u7684\u5E73\u53F0 / \u521A\u88AB\u91CD\u5EFA\uFF09\uFF0C\u91CD\u5F00\u540E\u518D\u505A\u4E00\u904D\u5C31\u6CA1\u4E86\u3002\u70B9\u300C\u597D\u300D\u91CD\u5F00\u3002": { en: "Deleted {db} databases and {ls} keys; {residue} leftovers remain (platforms that can't be enumerated / just recreated). Do it once more after reopening and they'll be gone. Tap OK to reopen." },
  "\u8FD9\u6B21\u58F0\u97F3\u8D77\u6765\u65F6\u591A\u7B97\u4E86 {n} ms\uFF1A\u6309\u952E\u53EF\u80FD\u665A\u8FD9\u4E48\u591A": { en: "Audio started {n} ms ahead this time: keys may be this late" },
  "\u58F0\u97F3\u6392\u7740\u961F\uFF1A\u81F3\u5C11 {qd} ms\uFF08\u91CF\u4E0D\u5230\u5DF2\u7ECF\u4EA4\u51FA\u53BB\u7684\u90A3\u4E00\u622A\uFF09\xB7 \u70B9\u8FD9\u91CC\u6E05\u6389 \uFF5C \u7B49\u4E3B\u7EBF\u7A0B {q} ms \xB7 \u5230\u51FA\u58F0 {s} ms \xB7 \u58F0\u97F3\u5757 \u5E73\u5E38 {t} ms / \u6700\u957F {a} ms": { en: "Audio is backed up: at least {qd} ms (it cannot see what was already handed to the device) \xB7 tap here to clear it | main-thread wait {q} ms \xB7 to sound {s} ms \xB7 audio block usual {t} ms / longest {a} ms" },
  "\u6309\u952E\u665A\u4E86\uFF1A\u7B49\u4E3B\u7EBF\u7A0B {q} ms \xB7 \u5230\u51FA\u58F0 {s} ms \xB7 \u4E3B\u7EBF\u7A0B\u6700\u957F\u505C {st} ms \xB7 \u58F0\u97F3\u5757 \u5E73\u5E38 {t} ms / \u6700\u957F {a} ms \xB7 \u6700\u6162\u4E00\u6B65 {slow}\uFF08\u70B9\u4E00\u4E0B\u6536\u8D77\u8FD9\u4E00\u6B21\uFF09": { en: "Keys are late: main-thread wait {q} ms \xB7 to sound {s} ms \xB7 longest main-thread stall {st} ms \xB7 audio block usual {t} ms / longest {a} ms \xB7 slowest step {slow} (tap to hide this time)" },
  "\u624B\u611F\uFF1A\u7B49\u4E3B\u7EBF\u7A0B {q} ms \xB7 \u5230\u51FA\u58F0 {s} ms \xB7 \u4E3B\u7EBF\u7A0B\u6700\u957F\u505C {st} ms \xB7 \u58F0\u97F3\u5757 \u5E73\u5E38 {t} ms / \u6700\u957F {a} ms\uFF08\u70B9\u4E00\u4E0B\u6536\u8D77\u8FD9\u4E00\u6B21\uFF09": { en: "Key feel: main-thread wait {q} ms \xB7 to sound {s} ms \xB7 longest main-thread stall {st} ms \xB7 audio block usual {t} ms / longest {a} ms (tap to hide this time)" },
  "\u6CA1\u6709\u5347\u964D\u53F7": { en: "no sharps or flats" },
  "{n} \u4E2A\u5347\u53F7": { en: "{n} {n|sharp|sharps}" },
  "{n} \u4E2A\u964D\u53F7": { en: "{n} {n|flat|flats}" },
  "\u81EA\u52A8\uFF08\u73B0\u5728\uFF1A{p}\uFF09": { en: "Auto (now: {p})" },
  "\u5927\u8C31\u8868\uFF08\u4E0A\u9AD8\u97F3\u4E0B\u4F4E\u97F3\uFF09": { en: "Grand staff (treble above, bass below)" },
  "\u4E0D\u53D8": { en: "unchanged" },
  "\u81EA\u52A8\u516B\u5EA6\u7EBF": { en: "Auto 8va lines" },
  "\u5F00": { en: "On" },
  "\u5173": { en: "Off" },
  "\u4E00\u4E32\u5F88\u9AD8 / \u5F88\u4F4E\u7684\u97F3\uFF08\u6BCF\u4E2A\u90FD\u8981\u4E09\u6761\u4EE5\u4E0A\u52A0\u7EBF\uFF09\u81EA\u52A8\u753B 8va / 15ma / 8vb\uFF1B\u624B\u5199\u7684\u8BF4\u4E86\u7B97\uFF0C\u4E0D\u5B58\u8FDB\u8C31\u3002\u53EA\u7BA1\u8FD9\u4E00\u6BB5": { en: "A run of very high / low notes (three or more ledger lines each) gets 8va / 15ma / 8vb drawn automatically; written ones win; not saved into the score. Only this section" },
  "\u4E0D\u53D8\uFF08{k}\uFF09": { en: "No change ({k})" },
  "\u548C\u5F26\u7EA7\u6570\u4ECE do \u6570\uFF081 = do\uFF09": { en: "Chord degrees count from do (1 = do)" },
  "{k} \u5927\u8C03": { en: "{k} major" },
  "\u548C\u5F26\u7EA7\u6570\u4ECE la \u6570\uFF08a \u5C0F\u8C03\u91CC Am = i\uFF09\uFF1B\u97F3\u548C\u5347\u964D\u53F7\u4E0D\u53D8": { en: "Chord degrees count from la (in A minor, Am = i); notes and accidentals stay the same" },
  "{k} \u5C0F\u8C03": { en: "{k} minor" },
  "\u4E0D\u53D8\uFF08{t}\uFF09": { en: "No change ({t})" },
  "\u5176\u4ED6\u2026\uFF08\u81EA\u5DF1\u5199\uFF09": { en: "Other\u2026 (type it)" },
  "\u8FD9\u5F20\u7EB8\u5F00\u5934\uFF1A\u4ECE\u5934\u5F00\u59CB\u7684\u8C31\u53F7 / \u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\u3002\u53EA\u7BA1\u8FD9\u4E00\u4E2A\u58F0\u90E8\u8FD9\u4E00\u6BB5\uFF08\u5F00\u5934\u7684\u901F\u5EA6\u6574\u5F20\u7EB8\u4E00\u8D77\uFF09\u3002": { en: "Start of this sheet: the clef / key / time / tempo it starts with. Only for this part in this section (the starting tempo applies to the whole sheet)." },
  "\u4ECE\u8FD9\u91CC\u8D77\u7684\u53D8\u5316\uFF08\u300C\u4E0D\u53D8\u300D= \u8DDF\u524D\u9762\u4E00\u6837\uFF09\u3002": { en: "Changes from here on (\u201CNo change\u201D = same as before)." },
  "\u8C31\u53F7": { en: "Clef" },
  "\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8": { en: "Display only; pitches don\u2019t change" },
  "\u8C03\u53F7": { en: "Key" },
  "\u6539\u8C03\u53F7 = \u5B83\u7BA1\u7684\u97F3\u6309\u65B0\u8C03\u53F7\u62FC\u5199\uFF0C\u97F3\u9AD8\u4E0D\u53D8": { en: "Changing the key respells the notes it governs; pitches don\u2019t change" },
  "\u62CD\u53F7": { en: "Time" },
  "\u901F\u5EA6": { en: "Speed" },
  "\u6253\u5F00\u901F\u5EA6\u6846\uFF1A\u62E8\u901F\u5EA6\u3001\u9009\u901F\u5EA6\u8BCD\u3001\u770B\u5C0F\u8282\u62CD\u5668\uFF0C\u6309\u300C\u786E\u5B9A\u300D\u624D\u5199\u8FDB\u8C31": { en: "Open the tempo box: dial the tempo, pick a tempo word, watch the metronome; nothing is written until you press OK" },
  "\u4E0D\u53D8\uFF08\u2669={n}\uFF09\xB7 \u5728\u8FD9\u91CC\u6362\u2026": { en: "No change (\u2669={n}) \xB7 change it here\u2026" },
  "\u5220\u6389\u8FD9\u91CC\u7684\u53D8\u5316": { en: "Remove the changes here" },
  "\u300C{name}\u300D\u7684\u8C31\uFF08\u6574\u9996\u90FD\u7B97\uFF09": { en: "\u201C{name}\u201D staff (whole song)" },
  "\u5206\u89E3\u548C\u5F26": { en: "Broken chords" },
  "\u8BA4": { en: "Read" },
  "\u4E0D\u8BA4": { en: "Ignored" },
  "\u62C6\u5F00\u5F39\u7684\u548C\u5F26\uFF08\u4E00\u62CD / \u534A\u5C0F\u8282 / \u4E00\u5C0F\u8282\u91CC\u7684\u97F3\u51D1\u6210\u4E00\u4E2A\u548C\u5F26\uFF09\u8981\u4E0D\u8981\u6807\u7EA7\u6570\uFF1B\u53E0\u5728\u4E00\u8D77\u7684\u548C\u5F26\u7167\u65E7\u6807": { en: "Label chords played as broken notes (a beat, half a bar or a whole bar adding up to a chord); stacked chords are labeled either way" },
  "\u5408\u79DF": { en: "Shared staff" },
  "\u6709\u522B\u7684\u58F0\u90E8\u6302\u5728\u8FD9\u4E00\u884C\u4E0A\uFF08\u5B83\u662F\u4E3B\u4EBA\uFF09\uFF0C\u4E0D\u80FD\u518D\u53BB\u6302\u522B\u4EBA": { en: "Other parts are attached to this line (it's the host), so it can't attach to another" },
  "\u81EA\u5DF1\u4E00\u884C": { en: "Own line" },
  "{key}\uFF08\u65AD\u4E86\uFF09": { en: "{key} (broken)" },
  "\u6302\u5728\u300C{name}\u300D\u4E0A": { en: "On \u201C{name}\u201D" },
  "\u6302\u5728\u522B\u4EBA\u7684\u8C31\u7EBF\u4E0A\u753B\uFF08\u5408\u79DF\uFF1A\u53EA\u770B\u4E2A\u5927\u6982\uFF0C\u97F3\u649E\u5728\u4E00\u8D77\u5C31\u649E\uFF1B\u53EA\u753B\u97F3\uFF0C\u4E0D\u753B\u4F11\u6B62 / \u6B4C\u8BCD / \u529B\u5EA6\uFF1B\u70B9\u540D\u5B57 = \u62C6\u5F00\u6765\u5199\uFF09": { en: "Draw on another part's staff (shared: just an overview, colliding notes collide; only notes are drawn, no rests / lyrics / dynamics; tap the name to split it out and write)" },
  "\u65AD\u4E86\uFF1A\u6587\u4EF6\u91CC\u5199\u7740\u6302\u5728\u300C{id}\u300D\u4E0A\uFF0C\u8FD9\u4E00\u9996\u91CC\u6CA1\u6709\u8FD9\u4F4D\uFF08\u6216\u90A3\u4F4D\u81EA\u5DF1\u4E5F\u6302\u5728\u522B\u4EBA\u4E0A\uFF09\u3002\u73B0\u5728\u7167\u81EA\u5DF1\u4E00\u884C\u753B\uFF1B\u4E0A\u9762\u9009\u4E00\u4E2A\u5C31\u6539\u6389": { en: "Broken: the file says this part shares the staff of \u201C{id}\u201D, but that part is not in this song (or it is itself sharing someone else\u2019s staff). It is drawn on its own row for now; pick one above to change it" },
  "\u8FD9\u4E00\u6BB5\u8C03\u53F7\u4E00\u6837\u7684 {n} \u4E2A\u58F0\u90E8\u4E00\u8D77\u6539\u4E86": { en: "Changed {n} parts in this section that share this key signature" },
  "\u5206\u89E3\u548C\u5F26\uFF1A\u8BA4": { en: "Broken chords: read" },
  "\u5206\u89E3\u548C\u5F26\uFF1A\u4E0D\u8BA4": { en: "Broken chords: ignored" },
  "\u4E50\u8C31": { en: "Score" },
  "\u8FD9\u9996\u6B4C\u6709 {n} \u5904\u7EB8\u5F00\u5934\u6CA1\u5199\u529B\u5EA6\uFF1A\u8FD9\u4E00\u4E0B\u6539\u8C31\u65F6\u8865\u4E0A\u4E86\u90A3\u91CC\u672C\u6765\u751F\u6548\u7684\u90A3\u4E2A\uFF08\u542C\u8D77\u6765\u4E0D\u53D8\uFF09\uFF0C\u5B58\u7684\u65F6\u5019\u4E00\u8D77\u5199\u8FDB\u6587\u4EF6": { en: "{n} sheet start(s) in this song had no dynamic: this edit filled in the one already in effect there (sounds the same); it goes into the file when you save" },
  "\u300C{name}\u300D\u5728\u5916\u9762\u88AB\u6539\u8FC7": { en: "\u201C{name}\u201D was changed elsewhere" },
  "\u6253\u5F00\u6216\u4E0A\u6B21\u5B58\u4E4B\u540E\uFF0C\u8FD9\u4E2A\u6587\u4EF6\u88AB\u522B\u7684\u7A0B\u5E8F\u6539\u8FC7\u3002\u8986\u76D6 = \u5916\u9762\u6539\u7684\u90A3\u4E9B\u4F1A\u4E22\u3002": { en: "Another program changed this file since it was opened or last saved. Overwriting will lose those changes." },
  "\u8986\u76D6": { en: "Overwrite" },
  "\u5B58\u6210 .mxl": { en: "Save as .mxl" },
  "{name} \xB7 {size}\u3002\u4E0B\u8F7D\u6216\u5206\u4EAB\u5230\u300C\u6587\u4EF6\u300D\u91CC\uFF1B\u4EE5\u540E\u4ECE\u6587\u4EF6\u83DC\u5355\u300C\u6253\u5F00\u300D\u3002": { en: "{name} \xB7 {size}. Download it or share it to Files; open it later from the menu." },
  "\u8FDE\u7EBF": { en: "Slur" },
  "\u97F3\u5185\u6E10\u5F3A / \u9F13\u8D77": { en: "Swell up / swell" },
  "\u97F3\u5185\u6E10\u5F31": { en: "Swell down" },
  "\u51FA\u58F0\u7684\u6362\u6C14": { en: "Audible breath" },
  "\u53F0\u4E0A\u8FD9\u4F4D": { en: "The performer on stage" },
  "{who}\u7684\u97F3\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF\uFF0C{p}\u505A\u4E0D\u5230\uFF1A\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D8\uFF1B\u97F3\u5185\u6E10\u5F31\u7167\u505A": { en: "{who}'s notes decay on their own, so {p} isn't possible: it's written on the score (grayed out) and the sound doesn't change. Swell down still works" },
  "{who}\u672C\u6765\u5C31\u8FDE\u7740\u5531\uFF1A{p}\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D8\uFF1B\u8981\u65AD\u53E5\u7528\u547C\u5438": { en: "{who} already sings legato: {p} is written on the score (grayed out) and the sound doesn't change. Use a breath to separate phrases" },
  "{who}\u672C\u6765\u5C31\u4E0D\u7559\u7F1D\uFF08\u4E50\u5668\u9875\u300C\u97F3\u548C\u97F3\u4E4B\u95F4\u300D= 0\uFF09\uFF1A{p}\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D8": { en: "{who} already leaves no gap (\u201CBetween notes\u201D on the instrument page = 0): {p} is written on the score (grayed out) and the sound doesn't change" },
  "{who}\u4E0D\u8BA4{p}\uFF1A\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D7\u5F71\u54CD": { en: "{who} ignores {p}: it's written on the score (grayed out) and doesn't affect the sound" },
  "\u8FD9\u4E2A {p} \u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u540E\u9762\u90A3\u4E2A\u97F3\u662F\u5F3A\u540E\u5373\u5F31\uFF08fp\uFF09\uFF0C\u97F3\u5934\u6309 f\u3001\u968F\u540E\u843D\u5230 p": { en: "This {p} has no effect (grayed out): the next note is forte-piano (fp), which attacks at f and then falls to p" },
  "\u529B\u5EA6\u8BB0\u53F7": { en: "Dynamic marks" },
  "PNG 256 \u8272\u3001\u957F\u8FB9\u6700\u591A 2048": { en: "PNG, 256 colors, long side up to 2048" },
  "\u5B58\u8FDB\u6B4C\u91CC\uFF08{bytes}\uFF09": { en: "Save in the song ({bytes})" },
  "\u538B\u4E00\u4E0B\u518D\u5B58\uFF08{what}\uFF09": { en: "Compress, then save ({what})" },
  "\u538B\u4E00\u4E0B\u518D\u5B58\uFF08\u7EA6 {estimate}\uFF09": { en: "Compress, then save (about {estimate})" },
  "\u53EA\u653E\u5185\u5B58\uFF08\u63A8\u8350\uFF09": { en: "Memory only (recommended)" },
  "\u53EA\u653E\u5185\u5B58\uFF08\u4E0D\u5B58\u8FDB\u6B4C\u91CC\uFF09": { en: "Memory only (not saved in the song)" },
  "\u300C{name}\u300D{bytes}\u3002\u53C2\u8003\u7A97\u91CC\u7684\u4E1C\u897F\u8DDF\u7740\u6B4C\u4E00\u8D77\u5B58\u3001\u4E00\u8D77\u540C\u6B65\u3002{smaller}\u53EA\u653E\u5185\u5B58 = \u8FD9\u6B21\u6253\u5F00\u80FD{p}\uFF0C\u4E0D\u5B58\u8FDB\u6B4C\u91CC\uFF1B\u4E0B\u6B21\u6253\u5F00\u662F\u4E2A\u7A7A\u4F4D\uFF0C\u628A\u540C\u4E00\u4E2A\u6587\u4EF6\u62D6\u8FDB\u6765\u5C31\u8865\u4E0A\u3002{suggestRam}": { en: "\u201C{name}\u201D is {bytes}. What's in the reference window is saved and synced with the song. {smaller}Memory only = you can {p} it this session, but it isn't saved in the song; next time it's an empty slot, and dragging the same file in fills it again. {suggestRam}" },
  "\u538B\u4E86\u4E5F\u4E0D\u4F1A\u66F4\u5C0F\uFF0C\u5C31\u4E0D\u5217\u4E86\u3002": { en: "Compressing wouldn't make it smaller, so that option isn't listed." },
  "\u538B\u4E00\u4E0B = {what}\u3002": { en: "Compress = {what}." },
  "\u542C##\u52A8\u8BCD": { en: "listen to" },
  "\u770B##\u52A8\u8BCD": { en: "view" },
  "\u8D85\u8FC7 4 MB \u7684\uFF0C\u5B58\u8FDB\u53BB\u8FD9\u9996\u6B4C\u4F1A\u5927\u8FD9\u4E48\u591A\u3001\u540C\u6B65\u4E5F\u6162\uFF0C\u6240\u4EE5\u5148\u63A8\u8350\u53EA\u653E\u5185\u5B58\u3002": { en: "Over 4 MB: saving it makes this song that much bigger and syncing slower, so memory only is recommended first." },
  "\u97F3\u9891 / \u89C6\u9891\u9ED8\u8BA4\u53EA\u653E\u5185\u5B58\uFF08\u8FD9\u6B21\u6253\u5F00\u6709\u6548\uFF09\uFF1B\u8981\u8DDF\u7740\u6B4C\u8D70\u5C31\u9009\u300C\u5B58\u8FDB\u6B4C\u91CC\u300D\u3002": { en: "Audio / video goes to memory only by default (this session); choose \u201CSave in the song\u201D to keep it with the song." },
  "\u8FD9\u6BB5\u97F3\u9891\u6709\u70B9\u5927": { en: "This audio is rather large" },
  "\u8FD9\u6BB5\u89C6\u9891\u6709\u70B9\u5927": { en: "This video is rather large" },
  "\u8FD9\u5F20\u56FE\u6709\u70B9\u5927": { en: "This image is rather large" },
  "\u6709\u65B0\u7248\u672C": { en: "New version available" },
  "\u5237\u65B0": { en: "Refresh" },
  "\u5F85\u4F1A\u513F": { en: "Later" },
  "\u4ECE\u8D77\u70B9\u653E / \u505C\uFF08\u7A7A\u683C\uFF09\uFF1B\u8FDE\u6309\u4E24\u4E0B = \u4ECE\u5934\u653E\u3002\u957F\u6309 / \u53F3\u952E = \u63A5\u7740\u653E / \u81EA\u52A8\u7FFB / \u5FAA\u73AF / \u4ECE\u5934\u653E / \u63A5\u7F1D\u3002\u8D77\u70B9 = \u957F\u6309 / \u53F3\u952E\u8C31\u9762\u300C\u4ECE\u8FD9\u513F\u653E\u300D\u632A": { en: "Play from the start point / stop (Space); double-press = from the top. Long-press / right-click = resume / auto-follow / loop / from the top / seam. To move the start point, long-press / right-click the score: \u201CPlay from here\u201D" },
  "\u6B4C\u5E93\uFF1A\u6B4C\u653E\u5728\u7F51\u76D8\uFF08OneDrive\uFF09\u6216\u4F60\u9009\u7684\u6587\u4EF6\u5939\u91CC": { en: "Library: songs live on OneDrive or in a folder you choose" },
  "\u6B4C\u5E93\uFF1A\u6B4C\u653E\u5728\u4F60\u9009\u7684\u6587\u4EF6\u5939\u91CC": { en: "Library: songs live in a folder you choose" },
  "\u6587\u4EF6\u540D \xB7 \u70B9\u4E86\u6539\u540D": { en: "File name \xB7 tap to rename" },
  "\u672A\u547D\u540D": { en: "Untitled" },
  "\u8FD9\u9996\u6B4C\u6CA1\u52A0\u5BC6\uFF08MoonSinger \u8FD9\u4E00\u7248\u8FD8\u4E0D\u52A0\u5BC6\uFF09": { en: "This song isn't encrypted (this version of MoonSinger doesn't encrypt yet)" },
  "\u5B58": { en: "Save" },
  "\u83DC\u5355\uFF1A\u65B0\u5EFA / \u6253\u5F00 / \u5BFC\u51FA / \u5C01\u9762 / \u58F0\u97F3\u4E0E\u7F72\u540D / \u8BBE\u7F6E": { en: "Menu: new / open / export / cover / sounds and credits / settings" },
  "\u952E\u76D8\uFF08pad\uFF09": { en: "Keyboard (pad)" },
  "\u952E\u76D8": { en: "Keys" },
  "\u64A4\u9500\uFF08Ctrl / \u2318+Z\uFF09": { en: "Undo (Ctrl / \u2318+Z)" },
  "\u91CD\u505A\uFF08Ctrl / \u2318+Shift+Z\uFF09": { en: "Redo (Ctrl / \u2318+Shift+Z)" },
  "\u6A21\u5F0F\uFF1A\u8FD9\u4E00\u4E0B\u70B9\u7684\u662F\u54EA\u4E00\u5C42": { en: "Mode: which layer a tap edits" },
  "\u770B\u54EA\u4E00\u6BB5\uFF1A\u5168\u90E8 / \u53EA\u770B\u8FD9\u4E00\u6BB5": { en: "Which section to view: all / just this one" },
  "\u770B\u54EA\u4E2A\u58F0\u90E8\uFF1A\u5168\u90E8 / \u53EA\u770B\u8FD9\u4E00\u4E2A": { en: "Which part to view: all / just this one" },
  "\u5168\u90E8\u66F2\u6BB5": { en: "All sections" },
  "\u7B2C {p} \u6BB5": { en: "Section {p}" },
  "\uFF08\u9690\u85CF\uFF09": { en: "(hidden)" },
  "\u5168\u90E8\u58F0\u90E8": { en: "All parts" },
  "\u6DF7\u97F3\u53F0": { en: "Mixer" },
  "\u70B9 = \u6536\u8D77": { en: "Tap = hide" },
  "\u70B9 = \u6253\u5F00": { en: "Tap = open" },
  "\u526A\u8D34\u677F\u91CC\u7684\u4E0D\u662F\u7B80\u8C31\uFF08\u50CF 1 2 3 | 5 - - \u8FD9\u6837\u7684\u624D\u8BA4\uFF09": { en: "The clipboard isn't jianpu (only things like 1 2 3 | 5 - - are recognized)" },
  "\u526A\u8D34\u677F\u91CC\u6CA1\u6709\u4E1C\u897F": { en: "The clipboard is empty" },
  "\u8D34\u4E86 {n} \u4E2A": { en: "Pasted {n}" },
  "\u590D\u5236\u4E86 {n} \u4E2A": { en: "Copied {n}" },
  "\u526A\u5207\u4E86 {n} \u4E2A": { en: "Cut {n}" },
  "{why}\uFF1A\u300C\u8C03\u5185\u4E00\u7EA7\u300D\u7528\u4E0D\u4E86\uFF0C\u7528\u534A\u97F3 / \u516B\u5EA6": { en: "{why}: \u201Cstep within the key\u201D doesn't apply; use semitone / octave" },
  "\u518D\u77ED\u5C31\u6CA1\u6709\u8FD9\u79CD\u65F6\u503C\u4E86": { en: "No shorter note value exists" },
  "\u518D\u957F\u5C31\u6CA1\u6709\u8FD9\u79CD\u65F6\u503C\u4E86": { en: "No longer note value exists" },
  "\u9009\u4E2D\u7684\u91CC\u9762\u6CA1\u6709\u80FD\u52A0\u9644\u70B9\u7684\u65F6\u503C": { en: "Nothing selected can take a dot" },
  "\u91CD\u542F\u58F0\u97F3": { en: "Restart audio" },
  "\u58F0\u97F3\u91CD\u542F\u4E86": { en: "Audio restarted" },
  "\u6362\u8FC7\u4E86\uFF0C\u4F46\u58F0\u97F3\u8BBE\u5907\u8FD8\u6CA1\u8D77\u6765\uFF1A\u518D\u6309\u4E00\u6B21\uFF0C\u6216\u8005\u628A app \u5173\u6389\u91CD\u5F00": { en: "Rebuilt, but the audio device has not come up yet: press again, or close the app and reopen it" },
  "\u754C\u9762\u8BED\u8A00": { en: "Interface language" },
  "\u3001": { en: ", " },
  "\u8FD9\u53F0\u8BBE\u5907\u7684{names}\u5B58\u8FDB\u4E86\u6B4C\u5E93\uFF0C\u6362\u8BBE\u5907\u4E5F\u7167\u8FD9\u4E2A\u3002": { en: "Saved this device's {names} to your library; other devices will follow it." },
  "\u7167\u6B4C\u5E93\u91CC\u5B58\u7684\u6362\u4E86\uFF1A{names}\u3002": { en: "Switched to what your library has: {names}." },
  "\u6B4C\u5E93\u91CC\u5B58\u7684{names}\u8BFB\u4E0D\u61C2\uFF08\u53EF\u80FD\u662F\u66F4\u65B0\u7684\u7248\u672C\u5B58\u7684\uFF09\uFF0C\u8FD9\u53F0\u8BBE\u5907\u7167\u81EA\u5DF1\u7684\u3002": { en: "Your library's {names} can't be read (maybe saved by a newer version); this device keeps its own." },
  "\u6B4C\u5E93\u91CC\u5B58\u7684\u754C\u9762\u8BED\u8A00\u662F {l}\uFF0C\u91CD\u65B0\u8F7D\u5165\u540E\u6362\u3002": { en: "Your library's interface language is {l}; it changes after a reload." },
  "\u8DDF\u7CFB\u7EDF": { en: "System" },
  "\u91CD\u65B0\u8F7D\u5165": { en: "Reload" },
  "\u5176\u4ED6\u7EB8": { en: "Other sheets" },
  "\u65B0\u7684\u4E00\u6BB5": { en: "New section" },
  "\u9690\u85CF\u7740\u7684\uFF08\u70B9 = \u653E\u51FA\u6765\uFF09": { en: "Hidden (tap = show)" },
  "\u53BB\u770B": { en: "Go to it" },
  "\u653E\u51FA\u6765": { en: "Unhide" },
  "\u9690\u85CF\u7740\u7684\u66F2\u6BB5\uFF08\u4E0D\u653E\u3001\u4E0D\u5370\uFF09": { en: "Hidden sections (not played, not printed)" },
  "\u300C{p}\u300D\u653E\u51FA\u6765\u4E86\uFF08\u64A4\u9500\u80FD\u518D\u85CF\u8D77\u6765\uFF09": { en: "\u201C{p}\u201D is back (undo hides it again)" },
  "\u300C{extras}\u300D\u662F\u5355\u58F0\u4E50\u5668\uFF0C\u8FD9\u4E2A\u58F0\u90E8\u53E0\u4E0D\u4E86\u97F3": { en: "\u201C{extras}\u201D is a monophonic instrument, so this part can't stack notes" },
  "\u5149\u6807\u524D\u9762\u8FD8\u6CA1\u6709\u97F3": { en: "No note before the cursor yet" },
  "\u300C{who}\u300D\u4E00\u6B21\u53EA\u51FA\u4E00\u4E2A\u97F3\uFF1A\u51E0\u4E4E\u540C\u65F6\u6309\u4E0B\u7684\u7B2C\u4E8C\u4E2A\u952E\u6CA1\u5199\u3002\u8981\u5199\u548C\u5F26\uFF0C\u7ED9\u8FD9\u4E2A\u58F0\u90E8\u6362\u94A2\u7434\u8FD9\u7C7B\u4E50\u5668": { en: "\u201C{who}\u201D plays one note at a time: the second key pressed at almost the same moment was not written. For chords, switch this part to something like a piano" },
  "\u9690\u85CF\u4E86\u8FD9\u5F20\u7EB8": { en: "Hid this sheet" },
  "\u53D6\u6D88\u9690\u85CF\u8FD9\u5F20\u7EB8": { en: "Unhid this sheet" },
  "\u8FD9\u4E00\u6BB5\u5B9A\u6210\u4E86\u5927\u8C31\u8868\uFF08\u624B\u52A8\u5206\u7684\u4E0A\u4E0B\u884C\u8981\u5B58\u5F97\u4E0B\uFF09\uFF1B\u60F3\u56DE\u5230\u81EA\u52A8\uFF0C\u70B9\u884C\u9996\u8C31\u53F7\u9009\u300C\u81EA\u52A8\u300D": { en: "This section is now fixed as a grand staff (so the notes you moved between staves can be saved); to go back to automatic, tap the clef at the start of the line and pick \u201CAuto\u201D" },
  "\u6E10\u5F3A / \u6E10\u5F31": { en: "crescendo / diminuendo" },
  "\u8E0F\u677F\u8BB0\u53F7": { en: "pedal marks" },
  "\u6539\u5230\u4E86\u6CA1\u663E\u793A\u7684{what}\uFF08\u6F14\u594F\u6CD5\u548C\u8868\u60C5\u73B0\u5728\u4E0D\u663E\u793A\uFF1B\u64A4\u9500\u80FD\u627E\u56DE\uFF09": { en: "You changed hidden {what} (articulations & dynamics are hidden right now; undo brings them back)" },
  "\u5199\u4E0A\u4E86\uFF0C\u4F46\u73B0\u5728\u6CA1\u663E\u793A\uFF1A{what}\uFF08\u9875\u9762\u8BBE\u7F6E \u2192\u300C\u770B\u8C31\u300D\u91CC\u6253\u5F00\uFF09": { en: "Written, but hidden right now: {what} (turn them on under Page settings \u203A Reading)" },
  "\u6CA1\u6709\u53EF\u64A4\u9500\u7684": { en: "Nothing to undo" },
  "\u6CA1\u6709\u53EF\u91CD\u505A\u7684": { en: "Nothing to redo" },
  "\u770B\u8C31": { en: "Reading" },
  "\u7248\u9762": { en: "Page" },
  "\u4F11\u606F\u5BA4": { en: "Green room" },
  "{issueCount} \u6761\u8F68\u4E0D\u51FA\u58F0\uFF1A\u70B9\u5F00\u770B\u6E05\u5355": { en: "{issueCount} {issueCount|track is|tracks are} silent: tap for the list" },
  "\u603B\u8F68": { en: "Master" },
  "\u4ECE\u8FD9\u513F\u653E": { en: "Play from here" },
  "\u8D77\u70B9\u632A\u5230\u8FD9\u4E2A\u5C0F\u8282\u7684\u5934\uFF0C\u4ECE\u8FD9\u513F\u653E": { en: "Moves the start point to the head of this bar and plays from here" },
  "\u63A5\u7740\u653E": { en: "Resume" },
  "\u4ECE\u4E0A\u6B21\u505C\u4E0B\u7684\u5730\u65B9\u63A5\u7740\u653E": { en: "Continue from where it last stopped" },
  "\u4ECE\u5934\u653E": { en: "Play from the top" },
  "\u8D77\u70B9\u56DE\u5230\u5F00\u5934\uFF0C\u4ECE\u5934\u653E\uFF08\u4E5F\u53EF\u4EE5\u8FDE\u6309\u4E24\u4E0B |\u25B6 / \u7A7A\u683C\uFF09": { en: "Moves the start point back to the top and plays (or double-press |\u25B6 / Space)" },
  "\u4ECE\u4E0A\u6B21\u505C\u4E0B\u7684\u5730\u65B9\u63A5\u7740\u653E\uFF08\u8D77\u70B9\u4E0D\u52A8\uFF09": { en: "Continue from where it last stopped (start point stays)" },
  "\u8DF3\u5230\u6B63\u5728\u653E\u7684\u5730\u65B9": { en: "Jump to the playing spot" },
  "\u8C31\u6EDA\u5230\u6B63\u5728\u653E\uFF08\u505C\u7740 = \u505C\u4E0B\uFF09\u7684\u90A3\u4E00\u884C\uFF1B\u521A\u624D\u81EA\u5DF1\u6EDA\u8FC7\u4E5F\u7167\u6837\u8FC7\u53BB\u3001\u63A5\u7740\u8DDF": { en: "Scrolls the score to the line now playing (or where it stopped), even if you just scrolled, and keeps following" },
  "\u7FFB\u8C31\u63D0\u524D\u591A\u5C11\uFF1A\u5FEB\u5230\u884C\u5C3E\uFF08\u6216\u7F16\u6392\u8DF3\u56DE\u53BB\u4E4B\u524D\uFF09\u8FD9\u4E48\u4E45\u5C31\u5148\u7FFB\u8FC7\u53BB\uFF0C\u6700\u540E\u4E00\u5C0F\u622A\u9760\u8BB0\u2014\u2014\u50CF\u94A2\u7434\u5BB6\u7FFB\u8C31\u30020 = \u6362\u4E86\u884C\u624D\u7FFB": { en: "How early to turn the page: this long before the end of a line (or before the arrangement jumps back), turn first and read the last bit from memory \u2014 like a pianist. 0 = turn only after the line changes" },
  "\u63D0\u524D\u7FFB": { en: "Turn early" },
  "\u4E0D": { en: "Off" },
  "{autoFollow}\u81EA\u52A8\u7FFB": { en: "{autoFollow}Auto-follow" },
  "\u653E\u7740\u7684\u65F6\u5019\u8C31\u8DDF\u7740\u6B63\u5728\u653E\u7684\u90A3\u4E00\u884C\u6EDA\uFF08\u51FA\u4E86\u5C4F\u5E55\u8212\u670D\u7684\u90A3\u4E00\u6BB5\u624D\u6EDA\uFF1B\u4F60\u81EA\u5DF1\u6EDA\u8FC7 4 \u79D2\u5185\u4E0D\u8DDF\uFF09": { en: "While playing, the score follows the line being played (only when it leaves the comfortable part of the screen; not within 4 s of you scrolling)" },
  "{loopOn}\u5FAA\u73AF": { en: "{loopOn}Loop" },
  "\u653E\u5230\u5934\u63A5\u7740\u4ECE\u5934\u653E\uFF1B\u7F16\u6392\u5199\u4E86 [\u5FAA\u73AF\u6BB5] = \u524D\u9762\u653E\u4E00\u904D\u3001\u62EC\u4F4F\u7684\u4E00\u76F4\u5FAA\u73AF": { en: "Restart from the top at the end; if the arrangement has [a loop section], play what's before it once, then loop the bracketed part" },
  "\u542C\u63A5\u7F1D": { en: "Hear the seam" },
  "\u4ECE\u5FAA\u73AF\u6BB5\u7ED3\u5C3E\u524D\u51E0\u79D2\u653E\u8D77\uFF0C\u8DF3\u56DE\u5F00\u5934\u518D\u653E\u51E0\u79D2\u5C31\u505C": { en: "Plays the last few seconds of the loop, jumps back to its start, plays a few more seconds, then stops" },
  "\u7FFB\u8C31\u63D0\u524D {turnLead} \u79D2": { en: "Page turns {turnLead} s early" },
  "\u7FFB\u8C31\u4E0D\u63D0\u524D\uFF08\u6362\u4E86\u884C\u624D\u7FFB\uFF09": { en: "Page turns aren't early (only after the line changes)" },
  "\u73B0\u5728\u6CA1\u6709\u5728\u653E\u7684\u5730\u65B9": { en: "Nothing is playing right now" },
  "\u81EA\u52A8\u7FFB\uFF1A\u5F00": { en: "Auto-follow: on" },
  "\u81EA\u52A8\u7FFB\uFF1A\u5173": { en: "Auto-follow: off" },
  "\u73B0\u5728\u7684\u58F0\u90E8\u90FD\u80FD\u51FA\u58F0": { en: "All parts can sound now" },
  "\u4E0D\u51FA\u58F0\u7684\u58F0\u90E8": { en: "Silent parts" },
  "\u88C5\u56DE\u6765": { en: "Reinstall" },
  "\u6362\u4EBA / \u627E\u58F0\u97F3\u2026": { en: "Change performer / find sound\u2026" },
  "\u653E\u548C\u5BFC\u51FA\u7684 mp3 \u91CC\u90FD\u6CA1\u6709\u8FD9{p}\u7684\u58F0\u97F3\uFF0C\u5176\u4F59\u7167\u653E\u3002\u6362\u8C01\u7531\u4F60\u5B9A\uFF0C\u4E0D\u66FF\u8865\u3002": { en: "Neither playback nor the exported mp3 will have the sound of {p}; the rest plays as usual. Who replaces it is up to you \u2014 no automatic substitutes." },
  "{n} \u6761\u8F68": { en: "{n} {n|track|tracks}" },
  "\u6761\u8F68": { en: "this track" },
  "\u77E5\u9053\u4E86": { en: "Got it" },
  "\u51C6\u5907\u2026": { en: "Preparing\u2026" },
  "\u53D6\u6D88": { en: "Cancel" },
  "\u6B63\u5728\u53D6\u6D88\u2026": { en: "Cancelling\u2026" },
  "\u6B63\u5728\u6E32\u67D3\u2026": { en: "Rendering\u2026" },
  "\u5DF2\u7ECF\u5728\u6E32\u67D3\u7F13\u5B58\u91CC\u4E86\uFF08\u5185\u5BB9\u6CA1\u53D8\uFF09": { en: "Already in the render cache (nothing changed)" },
  "\u6E32\u597D\u4E86\uFF0C\u4F46\u6CA1\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF08\u5B58\u50A8\u6EE1\u4E86\u6216\u8005\u662F\u9690\u79C1\u6A21\u5F0F\uFF09": { en: "Rendered, but it could not be kept in the render cache (storage full or private browsing)" },
  "\u6E32\u597D\u4E86\uFF0C\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF1A\u5B58\u4E0B\u53BB\u4E4B\u540E\u6B4C\u5E93\u5C01\u9762\u4E0A\u80FD\u542C": { en: "Rendered into the render cache: once you save, you can play it from the library cover" },
  "\u6E32\u597D\u4E86\uFF0C\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF1A\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C": { en: "Rendered into the render cache: play it straight from this song\u2019s cover in the library" },
  "\u6E32\u67D3\u53D6\u6D88\u4E86": { en: "Rendering cancelled" },
  "\u6E32\u4E0D\u4E86\uFF1A{Error}": { en: "Couldn't render: {Error}" },
  "\u6B63\u5728\u6E32\u67D3\u300C{stem}\u300D\u2026": { en: "Rendering \u201C{stem}\u201D\u2026" },
  "\u5BFC\u51FA\u6B4C\u58F0\uFF08mp3\uFF09": { en: "Export MP3" },
  "\u97F3\u8D28": { en: "Quality" },
  "\u8303\u56F4": { en: "Range" },
  "\u6574\u9996": { en: "Whole song" },
  "\u9690\u85CF\u7684\u7EB8\u4E0D\u653E": { en: "Hidden sheets aren't played" },
  "\u8FD9\u4E00\u5F20\u7EB8": { en: "This sheet" },
  "\u7B2C {p} \u5F20": { en: "Sheet {p}" },
  "\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58": { en: "Keep in render cache" },
  "\u653E\u8FDB\u53BB": { en: "Keep" },
  "\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF1B\u8BBE\u7F6E\u91CC\u80FD\u5220": { en: "Play it from this song\u2019s cover in the library; delete it in Settings" },
  "\u4E0D\u653E": { en: "Don't keep" },
  "\u53EA\u5BFC\u51FA\u8FD9\u4E00\u4EFD\uFF0C\u4E0D\u7559": { en: "Export this copy only, keep nothing" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BB0\u7740\u4E0A\u6B21\u6E32\u597D\u7684\u8FD9\u4E00\u4EFD\uFF0C\u5185\u5BB9\u6CA1\u53D8\uFF1A\u76F4\u63A5\u62FF\uFF0C\u4E0D\u7528\u7B49\u3002": { en: "This device remembers the last render of exactly this, and nothing has changed: you get it right away, no waiting." },
  "\u8BB8\u53EF\uFF1A{fellBack}\u3002\u548C\u7F72\u540D\u4E00\u8D77\u5199\u8FDB mp3 \u7684\u6807\u7B7E\u3002": { en: "License: {fellBack}. Written into the mp3 tags along with the credits." },
  "\u8FD9\u4EFD\u6309\u300C\u672A\u58F0\u660E\u300D\u5199\u2014\u2014\u4F60\u9009\u7684\u8BB8\u53EF\u5141\u8BB8\u522B\u4EBA\u6539\u7F16\uFF0C\u548C\u5C0F\u6708\u76F8\u7684\u6761\u6B3E\u53EF\u80FD\u51B2\u7A81\uFF08\u4F5C\u8005\u680F\u91CC\u7684\u9009\u62E9\u6CA1\u52A8\uFF09": { en: "This copy is written as \u201Cnot stated\u201D \u2014 the license you chose allows adaptation, which may conflict with Tsukuyomi-chan's terms (your choice in the credits is unchanged)" },
  "{n} \u6761\u8F68\u4E0D\u51FA\u58F0\uFF0Cmp3 \u91CC\u4E0D\u4F1A\u6709\u5B83\u4EEC\uFF1A{is}\u3002\u6362\u4EBA\u5728\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u91CC\u3002": { en: "{n} {n|track is|tracks are} silent and won't be in the mp3: {is}. Change the performer from the part name at the front of the score." },
  "\u7167\u6837\u5BFC\u51FA": { en: "Export anyway" },
  "\u5BFC\u51FA": { en: "Export" },
  "\u7B97\u4E86": { en: "Never mind" },
  "\u4F60\u6311\u7684\u300C{name}\u300D\u4E0D\u5728\u73B0\u5728\u8FD9\u51E0\u4E2A\u97F3\u7684\u8BFB\u6CD5\u91CC\uFF08\u97F3\u6539\u8FC7\u4E86\uFF09\uFF1A\u6362\u4E00\u4E2A\uFF0C\u6216\u8005\u6539\u56DE\u81EA\u52A8": { en: "The chord you picked, \u201C{name}\u201D, is no longer one of the readings of these notes (the notes changed): pick another, or go back to automatic" },
  "\u8FD9\u662F\u4F60\u6311\u7684\u300C{name}\u300D": { en: "You picked \u201C{name}\u201D" },
  "\u6539\u56DE\u81EA\u52A8\uFF08{label}\uFF09": { en: "Back to automatic ({label})" },
  "\u6539\u56DE\u81EA\u52A8\uFF08\u8FD9\u51E0\u4E2A\u97F3\u8BA4\u4E0D\u51FA\u548C\u5F26 = \u4E0D\u6807\uFF09": { en: "Back to automatic (these notes don't read as a chord = no label)" },
  "\u70B9\u4E00\u4E2A = \u7528\u5B83\uFF08\u8BB0\u8FDB\u8FD9\u4E2A\u97F3\uFF0C\u80FD\u64A4\u9500\uFF09": { en: "Tap one = use it (stored on this note; undo works)" },
  "\u754C\u9762##\u9875\u7B7E": { en: "UI" },
  "\u754C\u9762\uFF1A\u8FD9\u4E2A\u8F6F\u4EF6\u957F\u4EC0\u4E48\u6837\u3001\u8BF4\u4EC0\u4E48\u8BED\u8A00": { en: "UI: how this app looks and which language it speaks" },
  "\u97F3\u6E90##\u9875\u7B7E": { en: "Sounds" },
  "\u97F3\u6E90\uFF1A\u88C5\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7684\u58F0\u97F3": { en: "Sounds: the voices and instruments installed on this device" },
  "\u8F93\u5165##\u9875\u7B7E": { en: "Input" },
  "\u8F93\u5165\uFF1A\u63A5\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7684\u952E\u76D8": { en: "Input: keyboards connected to this device" },
  "\u7EF4\u62A4##\u9875\u7B7E": { en: "Upkeep" },
  "\u7EF4\u62A4\uFF1A\u6E05\u7406\u7A7A\u95F4\u3001\u51FA\u6BDB\u75C5\u65F6\u4FEE\u4E00\u4E0B\u3001\u628A\u65E5\u5FD7\u53D1\u7ED9\u5F00\u53D1\u8005": { en: "Upkeep: free up space, fix things when they go wrong, send logs to the developer" },
  "\u5173\u4E8E##\u9875\u7B7E": { en: "About" },
  "\u5173\u4E8E\uFF1A\u7248\u672C\u3001\u8F6F\u4EF6\u81EA\u5DF1\u7528\u5230\u7684\u522B\u4EBA\u7684\u4E1C\u897F": { en: "About: version, and other people\u2019s work this app uses" },
  "\u5F00\u53D1\u8005##\u9875\u7B7E": { en: "Dev" },
  "\u5F00\u53D1\u8005\uFF1A\u8BD5\u9A8C\u5F00\u5173\u3001\u8FD8\u539F\u51FA\u5382": { en: "Dev: experimental switches, factory reset" },
  "\u8FD9\u662F\u4EC0\u4E48": { en: "What's this" },
  "\u6CA1\u9009\uFF08\u7167\u8F6F\u4EF6\u7684\u9ED8\u8BA4\uFF1A{x}\uFF09": { en: "Not chosen (software default: {x})" },
  "\u4E60\u60EF\u770B\u7684\u8C31": { en: "Notation I usually read" },
  "\u65B0\u5EFA\u7684\u6B4C\u7167\u5B83\u5199\u4E0B\u6765\uFF1B\u9875\u9762\u8BBE\u7F6E\u91CC\u5199\u7740\u300C\u8DDF\u7740\u6211\u7684\u4E60\u60EF\u300D\u7684\u6B4C\u8DDF\u7740\u5B83\u53D8\u3002\u6BCF\u9996\u6B4C\u5728\u9875\u9762\u8BBE\u7F6E\u91CC\u80FD\u5355\u72EC\u6362\u3002": { en: "New songs are written with it; songs set to \u201CFollow my habits\u201D in Page settings change with it. Each song can be changed on its own in Page settings." },
  "\u79FB\u8C03\u8F85\u52A9": { en: "Transposition aid" },
  "\u4E0D\u7528\uFF08\u7167\u5199\u7684\u8C03\uFF09": { en: "Off (as written)" },
  "\u6309 C \u8C03\u770B": { en: "Read in C" },
  "\u548C\u5F26\u5199\u6CD5": { en: "Chord naming" },
  "\u4E2D\u592E C \u53EB": { en: "Middle C is" },
  "\u521D\u59CB\u8BBE\u7F6E": { en: "Initial setup" },
  "\u6253\u5F00\u2026": { en: "Open\u2026" },
  "\u8FD9\u53F0\u8BBE\u5907\u7684\u4E60\u60EF\uFF1A\u65B0\u5EFA\u7684\u6B4C\u7167\u5B83\u5199\u4E0B\u6765\uFF08\u4E4B\u540E\u8FD9\u9996\u6B4C\u5C31\u4E00\u76F4\u662F\u8FD9\u4E2A\u6837\uFF09\uFF1B\u9875\u9762\u8BBE\u7F6E\u91CC\u5199\u7740\u300C\u8DDF\u7740\u6211\u7684\u4E60\u60EF\u300D\u7684\u6B4C\u8DDF\u7740\u5B83\u53D8\u3002\u4E60\u60EF\u672C\u8EAB\u4E0D\u8FDB\u6B4C\uFF1B\u8FDE\u7740\u6B4C\u5E93\u65F6\u8DDF\u7740\u6B4C\u5E93\u8D70\uFF08\u8FDB\u540C\u4E00\u4E2A\u6B4C\u5E93\u7684\u8BBE\u5907\u7528\u540C\u4E00\u4EFD\uFF09\u3002": { en: "This device's habits: new songs are written with them (and then the song stays that way); songs whose page settings say \u201Cfollow my habits\u201D change with them. Habits are not stored in songs; when connected to a song library, they follow the library (every device using the same library shares one set)." },
  "MIDI \u952E\u76D8": { en: "MIDI keyboard" },
  "\u8FDE\u63A5": { en: "Connect" },
  "\u7248\u672C": { en: "Version" },
  "\u7B2C\u4E09\u65B9\u7684\u4F5C\u8005\u548C\u8BB8\u53EF": { en: "Third-party authors and licenses" },
  "\u770B\u2026": { en: "View\u2026" },
  "\u8F6F\u4EF6\u81EA\u5DF1\u7528\u5230\u7684\u522B\u4EBA\u7684\u4E1C\u897F\uFF08\u4E50\u5668\u76EE\u5F55\u7684\u56FE\u6807\u2026\uFF09\uFF1B\u5C0F\u6708\u76F8\u7684\u7F72\u540D\u4E0E\u4F7F\u7528\u6761\u6B3E\u5728\u300C\u97F3\u6E90\u300D\u9875\u5B83\u90A3\u4E00\u680F\u7684 \xA9": { en: "Other people\u2019s work the app itself uses (the instrument catalog icons\u2026); Tsukuyomi-chan\u2019s credit and terms of use are under \xA9 in her column on the Sounds page" },
  "\u6309\u952E\u624B\u611F\u7684\u6570\u5B57": { en: "Key-feel numbers" },
  "\u67E5\u5EF6\u8FDF\u7528\uFF1A\u6253\u5F00 = \u6309\u952E\u65F6\u5728\u952E\u76D8\u4E0A\u9762\u9732\u4E00\u884C\u6570\u5B57\uFF1B\u5173\u7740 = \u4E0D\u663E\u793A\uFF08\u665A\u4E86\u4E5F\u4E0D\u5F39\uFF0C\u53EA\u8BB0\u8FDB\u8BCA\u65AD\u65E5\u5FD7\uFF09": { en: "For chasing latency: on = a line of numbers appears above the keys while you play; off = never shown, even when keys are late (it only goes into the diagnostic log)" },
  "\u58F0\u97F3\u7684\u8D77\u6CD5\uFF08\u8BD5\u9A8C\uFF09": { en: "How audio starts (experiment)" },
  "\u5F00 = \u7B2C\u4E00\u6B21\u70B9\u5C4F\u5E55\u5148\u8D77\u4E00\u4E2A\u4E0D\u51FA\u58F0\u7684\u57AB\u811A\u628A\u58F0\u97F3\u786C\u4EF6\u53EB\u9192\uFF0C\u518D\u8D77\u771F\u6B63\u51FA\u58F0\u7684\u90A3\u4E00\u4E2A\uFF1B\u5173 = \u4EE5\u524D\u7684\u8D77\u6CD5\u3002\u6539\u4E86\u8981\u91CD\u5F00 app \u624D\u770B\u5F97\u51FA": { en: "On = the first tap starts a silent primer to wake the audio hardware, then the real output starts; off = the old way. Takes effect the next time the app is opened" },
  "\u5F15\u64CE\u8D1F\u8F7D\u4E0E\u5185\u5B58": { en: "Engine load and memory" },
  "\u80FD\u7B97\u5230\u7684\u90E8\u5206\uFF1B\u8D85\u9884\u7B97\u4F1A\u5148\u653E\u5757\u3001\u518D\u51CF\u5E76\u884C\u3001\u518D\u8D81\u7A7A\u91CD\u5F00\u5F15\u64CE\uFF0C\u5E76\u5728\u72B6\u6001\u6761\u660E\u8BF4": { en: "What can be counted; when over budget it first drops blocks, then lowers parallelism, then restarts the engine when idle, and says so in the status bar" },
  "\u8FD8\u539F\u51FA\u5382\u8BBE\u7F6E\u2026": { en: "Factory reset\u2026" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A MoonSinger \u7684\u5168\u90E8\u672C\u5730\u6570\u636E\u6E05\u6210\u65B0\u88C5\uFF1A\u6B4C\u5E93\u7684\u672C\u673A\u526F\u672C\u3001\u5FF5\u7F13\u5B58\u3001\u5C01\u9762\u7F13\u5B58\u3001\u8BBE\u7F6E\u3001\u8BCA\u65AD\u65E5\u5FD7\u3001\u79BB\u7EBF\u58F3\uFF1B\u4E91\u7AEF\u7684\u6B4C\u548C\u672C\u673A\u6587\u4EF6\u4E0D\u52A8\uFF1B\u5C0F\u6708\u76F8\u548C\u4E50\u5668\u97F3\u8272\u5E93\u4E0D\u52A8\u2014\u2014\u8981\u5220\u5728\u300C\u97F3\u6E90\u300D\u9875\u5404\u81EA\u90A3\u4E00\u680F\u5220": { en: "Resets everything MoonSinger stores on this device to a fresh install: local copies of library songs, the spoken-lyrics cache, cover cache, settings, diagnostic log, offline shell. Songs in the cloud and local files are untouched; Tsukuyomi-chan and the instrument library are untouched too \u2014 delete them in their own columns on the Sounds page" },
  "\u68C0\u67E5\u66F4\u65B0": { en: "Check for updates" },
  "\u8BBE\u7F6E": { en: "Settings" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u6CA1\u6709 IndexedDB\uFF1A\u5FF5\u8FC7\u7684\u53E5\u5B50\u53EA\u5728\u5185\u5B58\u91CC": { en: "This browser has no IndexedDB: spoken lyrics are kept in memory only" },
  "{BUDGET} \u5C0F\u6708\u76F8 {parallelism} \u6761\u9053\uFF08\u8BBE\u5907\u9884\u7B97 {lanes}\uFF09\u3002{p}": { en: "{BUDGET} Tsukuyomi-chan {parallelism} lanes (device budget {lanes}). {p}" },
  "\u58F0\u97F3\u7684\u8F93\u51FA\u5EF6\u8FDF\uFF08\u6D4F\u89C8\u5668\u62A5\u7684\uFF09\uFF1A{lat} ms": { en: "Audio output latency (as reported by the browser): {lat} ms" },
  "\u8FD9\u4E2A\u7AD9\u70B9\u5171\u7528\u4E86 {usage} / \u914D\u989D {quota}": { en: "This site uses {usage} / quota {quota}" },
  "\u5BFC\u5165\u4E2D\u2026": { en: "Importing\u2026" },
  "\u5BFC\u5165\u4E2D\u2026 {total}%": { en: "Importing\u2026 {total}%" },
  "\u5BFC\u5165\u6CA1\u6210\uFF1A{Error}": { en: "Import failed: {Error}" },
  "\u8FD9\u4E9B\u6587\u4EF6\u4E0D\u662F\u5C0F\u6708\u76F8\u8981\u7684\u6A21\u578B\u5305\u5206\u7247": { en: "These files aren't the model pack chunks Tsukuyomi-chan needs" },
  "\u5DF2\u7ECF\u662F\u6700\u65B0\u7248": { en: "Already up to date" },
  "\u8FD9\u91CC\u6CA1\u6709\u79BB\u7EBF\u58F3\uFF08\u672C\u673A\u5F00\u53D1 / \u6D4F\u89C8\u5668\u4E0D\u652F\u6301\uFF09\uFF0C\u4E0D\u7528\u66F4\u65B0": { en: "No offline shell here (local dev / unsupported browser), nothing to update" },
  "\u8BCA\u65AD\u65E5\u5FD7": { en: "Diagnostic log" },
  "\u5206\u4EAB": { en: "Share" },
  "\u4E0B\u8F7D": { en: "Download" },
  "\u5173##\u5173\u7A97": { en: "Close" },
  "\u5DF2\u4E0B\u8F7D {name}": { en: "Downloaded {name}" },
  "\u5DF2\u5206\u4EAB": { en: "Shared" },
  "\u5206\u4EAB\u5931\u8D25\uFF1A{Error}": { en: "Sharing failed: {Error}" },
  "\u6253\u5F00\u522B\u7684\u6B4C": { en: "Opening another song" },
  "\u8F68\u300C{id}\u300D": { en: "Track \u201C{id}\u201D" },
  "\u603B\u7EBF": { en: "Bus" },
  "\u52A0\u603B\u7EBF\u300C{name}\u300D": { en: "Add bus \u201C{name}\u201D" },
  "\u5220\u603B\u7EBF\u300C{id}\u300D": { en: "Delete bus \u201C{id}\u201D" },
  "\u5206\u6BB5\u5531\uFF1A{v}": { en: "Sing in segments: {v}" },
  "\u6587\u4EF6\u540D\uFF08{p}\uFF09\xB7 {p2}": { en: "File name ({p}) \xB7 {p2}" },
  "\u672C\u673A\u6587\u4EF6\u7684\u540D\u5B57\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u91CC\u6539": { en: "Rename local files in your file manager" },
  "\u70B9\u4E86\u6539\u540D": { en: "Tap to rename" },
  "\u6539\u4E86\uFF0C\u9A6C\u4E0A\u81EA\u52A8\u5B58\u5230\u8FD9\u53F0\u8BBE\u5907\uFF08\u70B9 = \u73B0\u5728\u5B58 + \u63A8\uFF09": { en: "Changed; saving to this device shortly (tap = save and upload now)" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF08\u6CA1\u767B\u5F55 OneDrive\uFF0C\u4E0D\u4E0A\u4E91\uFF1B\u70B9 = \u5B58 + \u53BB\u767B\u5F55\uFF09": { en: "Saved on this device (not signed in to OneDrive, so not in the cloud; tap = save and sign in)" },
  "\u5B58\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\uFF08{cloudOffTitle}\uFF09": { en: "Saved in this browser ({cloudOffTitle})" },
  "\u79BB\u7EBF\uFF1A\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u56DE\u7EBF\u518D\u63A8\u4E0A\u4E91": { en: "Offline: saved on this device, uploads when back online" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u8FD8\u6CA1\u63A8\u4E0A\u4E91\uFF08\u70B9 = \u73B0\u5728\u63A8\uFF09": { en: "Saved on this device, not uploaded yet (tap = upload now)" },
  "\u4E91\u7AEF\u4E5F\u662F\u6700\u65B0\u7684\uFF08\u70B9 = \u590D\u67E5\u4E91\u7AEF\uFF09": { en: "The cloud is up to date too (tap = recheck the cloud)" },
  "\u6539\u8FC7\u8FD8\u6CA1\u5B58\u56DE\u6587\u4EF6\uFF08\u70B9 = \u5B58\uFF09": { en: "Changed, not saved back to the file (tap = save)" },
  "\u5B58\u5728\u672C\u5730\u6587\u4EF6\u91CC\u4E86": { en: "Saved in the local file" },
  "\u8FD8\u6CA1\u5B58\uFF08\u70B9 = \u5B58\uFF09": { en: "Not saved yet (tap = save)" },
  "\u65B0\u7684\u4E00\u9996\uFF0C\u8FD8\u6CA1\u5B58": { en: "New song, not saved yet" },
  "\u6539\u4E86\uFF0C\u9A6C\u4E0A\u81EA\u52A8\u5B58\u5230\u8FD9\u53F0\u8BBE\u5907\uFF08\u70B9 = \u73B0\u5728\u5B58 + \u5199\u8FDB\u6587\u4EF6\u5939\uFF09": { en: "Changed; saving to this device shortly (tap = save and write to the folder now)" },
  "\u6587\u4EF6\u5939\u7684\u6743\u9650\u6389\u4E86\uFF1A\u6539\u52A8\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF08\u70B9 = \u91CD\u65B0\u6388\u6743\uFF09": { en: "Folder permission lost: changes are saved on this device (tap = re-authorize)" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u8FD8\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939\uFF08\u70B9 = \u73B0\u5728\u5199\uFF09": { en: "Saved on this device, not written to the folder yet (tap = write now)" },
  "\u6587\u4EF6\u5939\u91CC\u4E5F\u662F\u6700\u65B0\u7684\uFF08\u70B9 = \u590D\u67E5\uFF09": { en: "The folder is up to date too (tap = recheck)" },
  "\u300C{extras}\u300D\u8FD9\u4E2A\u89D2\u8272\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A\uFF08\u539F\u6765\u7684\u4E50\u5668\u8FD9\u4E00\u7248\u6CA1\u6709\uFF09\uFF0C\u6240\u4EE5\u6CA1\u6709{what}\u3002\u8981\u5C0F\u6708\u76F8\u6765\u5531\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u300C{extras2}\u300D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u9009\u5C0F\u6708\u76F8\u3002": { en: "Nobody is performing \u201C{extras}\u201D yet (this version doesn't have the original instrument), so there's no {what}. To have Tsukuyomi-chan sing it, tap \u201C{extras2}\u201D at the front of the score and choose her under \u201CWho performs\u201D." },
  "\u5199\u8FD9\u4E2A\u97F3 = \u539F\u901F\uFF08\u97F3\u9AD8\u5BF9\u9F50\uFF1A\u5199\u7684\u97F3 \u2248 \u542C\u5230\u7684\u97F3\uFF09": { en: "Writing this note = original speed (pitch aligned: the written note \u2248 what you hear)" },
  "\u539F\u901F\u952E\uFF1A\u6309\u8FD9\u4E2A\u952E\uFF0C\u91C7\u6837\u4E0D\u62C9\u4F38\u4E0D\u538B\u7F29": { en: "Original-speed key: press this key and the sample isn't stretched or compressed" },
  "\u8BD5\u542C\u4E0D\u4E86\uFF1A{Error}": { en: "Can't audition: {Error}" },
  "\u4E0B\u8F7D {name} {bytes}%": { en: "Downloading {name} {bytes}%" },
  "\u8C31\u4E0A\u8FD8\u6CA1\u6709\u97F3": { en: "No notes on the score yet" },
  "\u5C0F\u6708\u76F8\uFF08\u54FC\uFF09": { en: "Tsukuyomi-chan (hum)" },
  "\u300C{c}\u300D\u6362\u6210\uFF1A{gmName}": { en: "\u201C{c}\u201D replaced by: {gmName}" },
  "\u8FD9\u4E00\u884C\u4EA4\u7ED9\u4E86\u65B0\u58F0\u90E8\uFF1A{c}": { en: "This line now belongs to a new part: {c}" },
  "\u52A0\u4E86\u4E00\u4E2A\u58F0\u90E8\uFF1A{c}": { en: "Added a part: {c}" },
  "\u52A0\u4E86\u4E00\u4E2A\u58F0\u90E8\uFF1A{c}\uFF08\u76EE\u5F55\u8FD8\u5F00\u7740\uFF0C\u53EF\u4EE5\u63A5\u7740\u6362\uFF09": { en: "Added a part: {c} (the catalog stays open \u2014 keep switching if you like)" },
  "\u300C{extras}\u300D\u6362\u6210\uFF1A{name}": { en: "\u201C{extras}\u201D replaced by: {name}" },
  "\u300C{name}\u300D\u7684\u58F0\u97F3\u6CA1\u80FD\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF08\u7A7A\u95F4\u4E0D\u591F\uFF0C\u6216\u8FD9\u4E2A\u6D4F\u89C8\u5668\u4E0D\u8BA9\u5B58\uFF09\uFF1A\u8FD9\u6B21\u6253\u5F00\u91CC\u80FD\u54CD\uFF1B\u4E0B\u6B21\u8981\u4ECE\u300C{name2}\u300D\u6587\u4EF6\u627E\u3002\u60F3\u8BA9\u6B4C\u81EA\u5DF1\u5E26\u7740\u5B83\uFF1A\u6587\u4EF6\u83DC\u5355\u300C\u5168\u90E8\u6253\u5305\u8FDB\u6B4C\u300D\u3002": { en: "The sound of \u201C{name}\u201D couldn't be kept on this device (out of space, or the browser doesn't allow it): it works this session; next time, find it from the \u201C{name2}\u201D file. To have the song carry it: menu \u201CPack everything into the song\u201D." },
  "\u91CC\u9762\u6CA1\u6709\u4E50\u5668": { en: "No instruments inside" },
  "\u8BFB\u4E0D\u4E86\u300C{name}\u300D\uFF1A{Error}": { en: "Can't read \u201C{name}\u201D: {Error}" },
  "{name}\uFF08\u6CA1\u4EBA\u80FD\u6F14\uFF09": { en: "{name} (nobody can perform it)" },
  "\u300C{rn}\u300D\u590D\u5236\u4E86\u4E00\u4EFD\uFF1A{who}": { en: "\u201C{rn}\u201D: duplicated {who}" },
  "\u300C{rn}\u300D\u62F7\u6765\u4E86\u300C{from}\u300D\u7684\uFF1A{who}": { en: "\u201C{rn}\u201D: copied {who} from \u201C{from}\u201D" },
  "\u6362\u6210\u300C{who}\u300D": { en: "Changed to \u201C{who}\u201D" },
  "\u300C{rn}\u300D\u9000\u6389\u4E00\u4F4D\u5019\u9009": { en: "\u201C{rn}\u201D dropped a candidate" },
  "\u65B0\u58F0\u90E8": { en: "New part" },
  "\uFF08\u6CA1\u4EBA\u4E0A\u573A\uFF09": { en: "(nobody on stage)" },
  "{id} \u589E\u76CA {p}{p2} dB": { en: "{id} gain {p}{p2} dB" },
  "{id} \u58F0\u50CF {pan}": { en: "{id} pan {pan}" },
  "\u4E2D": { en: "C" },
  "\u5DE6 {p}": { en: "L {p}" },
  "\u53F3 {p}": { en: "R {p}" },
  "\u603B\u8F68\u589E\u76CA {p}{p2} dB": { en: "Master gain {p}{p2} dB" },
  "\u6BCD\u7EBF\u9650\u5E45{on}": { en: "Bus limiter{on}" },
  "\u65C1\u901A": { en: "Bypass" },
  "\u53D6\u6D88\u65C1\u901A": { en: "Un-bypass" },
  "\u6DF7\u97F3\u8F68 {n}": { en: "Bus {n}" },
  "\u52A0{name}": { en: "Add {name}" },
  "\u5220{name}": { en: "Delete {name}" },
  "\u6539\u540D\u300C{name}\u300D": { en: "Rename \u201C{name}\u201D" },
  "{extras} \u5F80{p}\u632A": { en: "Move {extras} {p}" },
  "\u524D": { en: "earlier" },
  "\u540E": { en: "later" },
  "{extras} \u589E\u76CA {p}{p2} dB": { en: "{extras} gain {p}{p2} dB" },
  "{extras} \u58F0\u50CF": { en: "{extras} pan" },
  "{track} \u51FA\u5230 {to}": { en: "{track} output to {to}" },
  "\u300C{next}\u300D\u6362\u4EBA\uFF1A{next2}": { en: "\u201C{next}\u201D performer change: {next2}" },
  "\u5C0F\u6708\u76F8": { en: "Tsukuyomi-chan" },
  "\u4F60\u81EA\u5DF1\u7684 {name}": { en: "your own {name}" },
  "{lib}\uFF08{parts}\uFF09": { en: "{lib} ({parts})" },
  "\u672C\u673A\u6587\u4EF6\u7684\u540D\u5B57\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u91CC\u6539\uFF08\u73B0\u5728\u662F {name}\uFF09": { en: "Rename local files in your file manager (currently {name})" },
  "\u6587\u4EF6\u540D": { en: "File name" },
  "\u6539\u2026": { en: "Rename\u2026" },
  "\u8FD9\u9996\u6B4C\u9501\u7740\uFF0C\u53EA\u80FD\u770B": { en: "This song is locked: view only" },
  "\u89E3\u9501": { en: "Unlock" },
  "\u540D\u5B57": { en: "Name" },
  "\u6B4C\u540D": { en: "Title" },
  "\u4F5C\u8005\u548C\u8BB8\u53EF": { en: "Author and license" },
  "\u51E0\u884C\u90FD\u884C\uFF0C\u7167\u5199\u7684\u663E\u793A\u5728\u7EB8\u4E0A\uFF08\u6807\u9898\u4E0B\u9762\u9760\u53F3\uFF09": { en: "Any number of lines, shown as written on the sheet (right-aligned under the title)" },
  "\u53EF\u4E0D\u586B\u3002\u5B58\u8FDB MusicXML\u300C\u5370\u5728\u9875\u9762\u4E0A\u7684\u5B57\u300D\uFF0C\u522B\u7684\u4E50\u8C31\u8F6F\u4EF6\u6253\u5F00\u4E5F\u5728\u7EB8\u4E0A\u3002": { en: "Optional. Saved as MusicXML page text, so other score software shows it too." },
  "\u8BB8\u53EF\uFF08\u53EF\u9009\uFF1B\u4F60\u5199\u7684\u8FD9\u90E8\u5206\uFF1A\u8BCD / \u66F2 / \u7F16\uFF09": { en: "License (optional; for your part: lyrics / music / arrangement)" },
  "\u4E0D\u5199\uFF1A\u6CD5\u5F8B\u9ED8\u8BA4 = \u4FDD\u7559\u6240\u6709\u6743\u5229\uFF08\u522B\u4EBA\u7528\u8981\u5148\u95EE\u4F60\uFF09": { en: "Not written: the legal default = all rights reserved (others must ask you first)" },
  "\u672A\u58F0\u660E\uFF08\u9ED8\u8BA4\uFF09": { en: "Not stated (default)" },
  "\u7A7A\u7740 = \u672A\u58F0\u660E\uFF08\u6CD5\u5F8B\u9ED8\u8BA4\u5C31\u662F\u4FDD\u7559\u6240\u6709\u6743\u5229\uFF09\uFF1B\u4E5F\u53EF\u4EE5\u81EA\u5DF1\u5199": { en: "Empty = not stated (the legal default is all rights reserved); or write your own" },
  "\u4ECE\u7D27\u5230\u677E\u6392\uFF1BCC \u90A3\u51E0\u4E2A\u53D1\u51FA\u53BB\u4EE5\u540E\u5BF9\u5DF2\u7ECF\u53D1\u51FA\u53BB\u7684\u6536\u4E0D\u56DE\u3002\u5B58\u8FDB MusicXML \u7684 &lt;rights&gt;\uFF1B\u5BFC\u51FA mp3 \u65F6\u8FDE\u540C\u7F72\u540D\u5199\u8FDB\u6587\u4EF6\u7684\u6807\u7B7E\u91CC\u3002": { en: "Listed strictest to loosest; once published under a CC license, published copies can't be taken back. Saved in MusicXML &lt;rights&gt;; written into the file tags with the credits when exporting mp3." },
  "\u6CA1\u6709\u5C01\u9762\u56FE": { en: "No cover image" },
  "\u9009\u4E00\u5F20\u56FE\u5F53\u5C01\u9762\uFF08\u7F29\u6210 256\xB2 \u5B58\u8FDB\u6B4C\u91CC\uFF1B\u6B4C\u5E93\u5361\u7247\u4E0A\u6B4C\u540D\u5370\u5728\u56FE\u4E0A\u9762\uFF09": { en: "Choose an image as the cover (shrunk to 256\xB2 and stored in the song; the library card prints the title over it)" },
  "\u6362\u4E00\u5F20\u2026": { en: "Replace\u2026" },
  "\u9009\u4E00\u5F20\u56FE\u2026": { en: "Choose an image\u2026" },
  "\u53BB\u6389\u5C01\u9762\u56FE": { en: "Remove cover image" },
  "\u6B4C\u5E93\u5361\u7247\u4E0A\u7684\u56FE\uFF1B\u6B4C\u540D\u548C\u65E5\u671F\u7167\u6837\u5370\u5728\u4E0A\u9762\u3002\u7F29\u6210 256\xB2 \u5B58\u8FDB\u6B4C\u91CC\u3002": { en: "The picture on the library card; title and date still print over it. Shrunk to 256\xB2 and stored in the song." },
  "\u58F0\u97F3": { en: "Sound" },
  "\u7528\u5230\u7684\uFF1A{libs}": { en: "Uses: {libs}" },
  "\u7F3A\uFF1A{list}": { en: "Missing: {list}" },
  "\u770B\u6E05\u5355\u2026": { en: "See the list\u2026" },
  "\u8FD9\u9996\u6B4C\u6CA1\u7528\u4E50\u5668\u7684\u58F0\u97F3\u6587\u4EF6\uFF08\u5C0F\u6708\u76F8 / \u5143\u97F3\u7248\u7684\u58F0\u97F3\u968F app \u8D70\uFF0C\u4E0D\u8FDB\u6B4C\uFF09\u3002": { en: "This song uses no instrument sound files (Tsukuyomi-chan / vowel versions come with the app, not the song)." },
  "\u7F72\u540D": { en: "Credits" },
  "\u8FD9\u9996\u6B4C\u7528\u4E86\u8C01\u7684\u58F0\u97F3": { en: "Whose sounds this song uses" },
  "\u8FD8\u6CA1\u6709\u53EF\u7F72\u7684\u540D": { en: "Nothing to credit yet" },
  "\u8FD9\u9996\u6B4C": { en: "This song" },
  "\u53BB\u6389\u4E86\u5C01\u9762\u56FE": { en: "Cover image removed" },
  "\u8FD9\u4E00\u7248\u4E0D\u8BA4\u8BC6\uFF08{v}\uFF09": { en: "Not known to this version ({v})" },
  "\u8DDF\u7740\u8FD9\u9996\u6B4C\u5B58\uFF1A\u8FDB\u6B4C\u3001\u80FD\u64A4\u9500\uFF0C\u5BFC\u51FA\u7684 PDF \u7167\u8FD9\u91CC\u5370\u3002": { en: "Saved with this song: it goes into the song, can be undone, and the exported PDF prints it this way." },
  "\u8DDF\u7740\u8FD9\u9996\u6B4C\u7684\u89C6\u56FE\u5B58\uFF1A\u5B58\u7684\u65F6\u5019\u987A\u624B\u5E26\u4E0A\uFF0C\u4E0D\u7B97\u6539\u52A8\u3001\u4E0D\u8FDB\u64A4\u9500\u3002": { en: "Saved with this song's view: it rides along when you save, but doesn't count as a change and isn't in undo." },
  "\u53EA\u5728\u8FD9\u6B21\u6253\u5F00\u91CC\u6709\u6548\uFF0C\u4E0D\u8FDB\u6B4C\u3002": { en: "Only for this session; not saved in the song." },
  "\u89C6\u56FE": { en: "View" },
  "\u9875\u9762\uFF08\u5206\u9875\uFF0C\u548C\u5370\u51FA\u6765\u4E00\u6837\uFF09": { en: "Page (paged, same as print)" },
  "\u8FDE\u7EED\uFF08\u4E0D\u5206\u9875\uFF09": { en: "Continuous (no page breaks)" },
  "\u6A2A\u5377\uFF08\u4E0D\u6298\u884C\uFF0C\u5F80\u53F3\u6EDA\uFF09": { en: "Scroll (no line breaks, scroll right)" },
  "\u53EA\u5F71\u54CD\u5C4F\u5E55\u4E0A\u600E\u4E48\u770B\uFF1A\u6253\u5370\u548C\u5BFC\u51FA\u6C38\u8FDC\u6309\u7EB8\u5206\u9875\u3002": { en: "Only changes how it looks on screen: printing and export always paginate by paper." },
  "\u9875\u9762": { en: "Page" },
  "\u6309\u7EB8\uFF08A4 / A5\uFF09\u7684\u771F\u5B9E\u9AD8\u5EA6\u65AD\u9875\uFF0C\u548C\u5370\u51FA\u6765\u7684\u4E00\u6837": { en: "Breaks pages at the real paper height (A4 / A5), same as the printout" },
  "\u8FDE\u7EED": { en: "Continuous" },
  "\u4E0D\u65AD\u9875\uFF0C\u6BCF\u4E00\u884C\u548C\u9875\u9762\u89C6\u56FE\u4E00\u6837\uFF0C\u53EA\u662F\u4E0D\u5206\u9875": { en: "No page breaks; every line is the same as in Page view, just not paged" },
  "\u6A2A\u5377": { en: "Horizontal scroll" },
  "\u6BCF\u5F20\u7EB8\u4E00\u884C\u3001\u4E00\u76F4\u5F80\u53F3\uFF0C\u6A2A\u7740\u6EDA\uFF1B\u58F0\u90E8\u540D\u9489\u5728\u5DE6\u8FB9": { en: "One line per sheet, running right and scrolled sideways; part names stay pinned at the left" },
  "\u8C31\u79CD": { en: "Notation" },
  "\u7B80\u8C31\u672C\u6765\u5C31\u662F\u9996\u8C03\uFF081 = \u8FD9\u4E2A\u8C03\u7684\u4E3B\u97F3\uFF09\uFF0C\u7528\u4E0D\u4E0A\u300C\u79FB\u8C03\u8F85\u52A9\u300D\uFF1B\u5B58\u7740\u7684\u9009\u62E9\u4E0D\u52A8\uFF0C\u5207\u56DE\u4E94\u7EBF\u8C31\u7167\u65E7\u3002": { en: "Numbered notation is already movable-do (1 = the key's tonic), so the transposition aid doesn't apply; your choice is kept and works again on staff." },
  "\u5B57\u6BCD\u8C31\u5199\u7684\u662F\u5B9E\u9645\u7684\u97F3\u540D\uFF0C\u7528\u4E0D\u4E0A\u300C\u79FB\u8C03\u8F85\u52A9\u300D\uFF1B\u5B58\u7740\u7684\u9009\u62E9\u4E0D\u52A8\uFF0C\u5207\u56DE\u4E94\u7EBF\u8C31\u7167\u65E7\u3002": { en: "Letter notation writes the actual note names, so the transposition aid doesn't apply; your choice is kept and works again on staff." },
  "\u6309\u5B9E\u9645\u7684\u8C03\u753B\u8C31\uFF0C\u952E\u4E0A\u5927\u5B57\u5199\u97F3\u540D": { en: "Draw in the actual key; big key labels show note names" },
  "\u8C31\u6362\u5230 C \u8C03\u753B\u3001\u6BCF\u4E2A\u8C03\u53F7\u4E0A\u65B9\u5199\u300C1=\u539F\u6765\u7684\u8C03\u300D\uFF1B\u952E\u4E0A\u7684\u5927\u5B57\u4E5F\u6309 C \u8C03\u5199\uFF08\u8C31\u4E0A\u753B\u6210\u7684\u540D\u5B57\uFF09\uFF0C\u5C0F\u5B57\u662F\u5B9E\u9645\u7684\u97F3\uFF1B\u952E\u7684\u4F4D\u7F6E\u4E0D\u52A8": { en: "Redraws the score in C, with the original key written as 1=\u2026 above each key signature; the big labels on the keys are in C too (the name drawn on the score) and the small ones are the actual notes; the keys stay where they are" },
  "\u548C\u5F26\u8F85\u52A9": { en: "Chord aid" },
  "\u6807": { en: "On" },
  "\u4E0D\u6807": { en: "Don\u2019t show" },
  "\u53E0\u5728\u4E00\u8D77\u7684\u548C\u5F26\u4E0B\u9762\u6807\u51FA\u5B83\u662F\u4EC0\u4E48\u548C\u5F26\uFF08\u5199\u6CD5\u5728\u4E0B\u4E00\u884C\uFF09\uFF1B\u70B9\u5B83\u770B\u5168\u90E8\u5019\u9009": { en: "Label stacked chords underneath with what chord they are (how they are written is the next row); tap one to see all candidates" },
  "\u6F14\u594F\u6CD5\u548C\u8868\u60C5": { en: "Articulations & dynamics" },
  "\u663E\u793A": { en: "Show" },
  "\u4E0D\u663E\u793A": { en: "Hide" },
  "\u4E0D\u663E\u793A = \u952E\u76D8\u300C\u6F14\u594F\u6CD5\u300D\u300C\u529B\u5EA6\u300D\u4E24\u9875\u4E0A\u7684\u4E1C\u897F\u90FD\u4E0D\u753B\u3001\u4E0D\u5360\u5730\u65B9\uFF08\u8DF3\u97F3\u3001\u91CD\u97F3\u3001\u8FDE\u7EBF\u3001\u547C\u5438\u3001\u529B\u5EA6\u3001\u6E10\u5F3A\u6E10\u5F31\u2026\uFF09\uFF0C\u884C\u8DDF\u7740\u53D8\u77EE\uFF1B\u7B2C\u4E00\u884C\u8C31\u5934\u90A3\u4E00\u884C\u7684\u53F3\u7AEF\u6709\u4E00\u884C\u6DE1\u5B57\u300C\u6F14\u594F\u6CD5\u548C\u8868\u60C5\uFF1A\u4E0D\u663E\u793A\u300D\uFF08\u4E0D\u5370\uFF09\uFF0C\u70B9\u5B83\u56DE\u5230\u8FD9\u91CC\u3002\u53EA\u7BA1\u753B\uFF1A\u64AD\u653E\u7167\u5199\u7684\u6765\uFF0C\u6B4C\u91CC\u7684\u8BB0\u53F7\u4E00\u4E2A\u4E0D\u52A8\uFF1BPDF \u7167\u773C\u524D\u7684\u6837\u5B50\u5370\u3002": { en: "Hide = nothing from the keyboard's Articulation and Dynamics pages is drawn or takes room (staccato, accents, slurs, breaths, dynamics, hairpins\u2026), so lines get shorter; a faint \u201CArticulations & dynamics: hidden\u201D at the right end of the first heading line (not printed) brings you back here. Display only: playback follows what's written and no mark in the song changes; the PDF prints what you see." },
  "\u53EA\u770B\u4E00\u53F7\u8F68": { en: "First track only" },
  "\u90FD\u770B": { en: "Show all" },
  "\u53EA\u770B\u300C{song}\u300D": { en: "Only \u201C{song}\u201D" },
  "\u901F\u5EA6\u3001\u98CE\u683C\u3001\u53CD\u590D\u5199\u5728\u6700\u4E0A\u9762\u90A3\u4F4D\u8EAB\u4E0A\uFF1B\u522B\u7684\u58F0\u90E8\u7F29\u6210\u7EC6\u884C\u3002": { en: "Tempo, style and repeats are written on the top part; the other parts shrink to thin lines." },
  "\u7EB8\u5F20": { en: "Paper" },
  "{paper}\uFF08{note}\uFF09": { en: "{paper} ({note})" },
  "\u5176\u4ED6": { en: "Other" },
  "\u6574\u9996\u6B4C\u4E00\u5F20\u7EB8\u3002\u7EB8\u8D8A\u5927\u4E00\u884C\u653E\u7684\u5C0F\u8282\u8D8A\u591A\uFF1B\u5C4F\u5E55\u653E\u5F97\u4E0B\u5C31\u7167\u7EB8\u6392\u3002\u4E0D\u6253\u5370\u7684\u65F6\u5019\u4E0D\u5206\u9875\u3002": { en: "One paper size for the whole song. Bigger paper fits more bars per line; if the screen fits, it's laid out as on paper. No page breaks unless printing." },
  "\u8FB9\u8DDD": { en: "Margins" },
  "\u8DDF\u7740\u8F6F\u4EF6\uFF08\u73B0\u5728\u662F\uFF1A{x}\uFF09": { en: "Follow the software (now: {x})" },
  "\u81EA\u5B9A\u4E49\uFF08{x}\uFF09": { en: "Custom ({x})" },
  "\u7EB8\u8FB9\u7559\u591A\u5BBD\u3002\u8FD9\u9996\u6B4C\u5E26\u7740\u81EA\u5DF1\u7684\u8FB9\u8DDD\uFF08\u522B\u7684\u8F6F\u4EF6\u5B58\u7684\u8C31\u3001\u8001\u6587\u4EF6\u91CC\u5199\u7740\u7684\uFF09\uFF1B\u9009\u300C\u8DDF\u7740\u8F6F\u4EF6\u300D= \u7528\u8FD9\u5F20\u7EB8\u81EA\u5DF1\u7684\u8FB9\u8DDD\uFF0C\u6362\u7EB8\u65F6\u8DDF\u7740\u6362\u3002": { en: "How much space is left at the edges of the paper. This song carries its own margins (a score saved by another program, or written in an older file); choose Follow the software to use this paper size's own margins, which change when you change the paper." },
  "\u97F3\u7B26\u5BC6\u5EA6": { en: "Note density" },
  "\u81EA\u5B9A\u4E49\uFF08{mm} \u6BEB\u7C73\uFF09": { en: "Custom ({mm} mm)" },
  "\u540C\u4E00\u5F20\u7EB8\u4E0A\u6392\u5F97\u677E\u8FD8\u662F\u5BC6\uFF1A\u97F3\u7B26\u591A\u5927\u3001\u884C\u8DDD\u3001\u97F3\u548C\u97F3\u4E4B\u95F4\u7684\u8DDD\u79BB\u4E00\u8D77\u53D8\u3002": { en: "How loosely or tightly a page is set: note size, line spacing and the space between notes change together." },
  "\u81EA\u5B9A\u4E49": { en: "Custom" },
  "\u522B\u7684\u8F6F\u4EF6\u5B58\u7684\u8C31\u5E26\u7740\u81EA\u5DF1\u7684\u8C31\u9AD8\uFF0C\u7167\u5B83\u6392": { en: "The score from another program carries its own staff size; set it that way" },
  "\u5355\u884C\u7684\u8C31\u3001\u7ED9\u65B0\u624B\u770B\u7684\u5E38\u7528\u8212\u9002\uFF1B\u58F0\u90E8\u591A\u7684\u603B\u8C31\u5E38\u7528\u7D27\u51D1\u3002\u5B58\u8FDB MusicXML \u7684 scaling \u548C\u884C\u8DDD\uFF0C\u522B\u7684\u8F6F\u4EF6\u6253\u5F00\u4E5F\u4E00\u6837\u3002": { en: "Single-line music and music for beginners commonly use Comfortable; scores with many parts commonly use Compact. Saved into MusicXML's scaling and spacing, so other programs open it the same way." },
  "\u5C4F\u5E55\u653E\u4E0D\u4E0B\u7EB8\u7684\u65F6\u5019": { en: "When the screen can't fit the sheet" },
  "\u4E0D\u6298\u884C": { en: "Don't wrap" },
  "\u6298\u884C": { en: "Wrap" },
  "\u6574\u5F20\u7EB8\u7F29\u5C0F\uFF0C\u884C\u548C\u7EB8\u4E0A\u4E00\u6837": { en: "Shrink the whole sheet; lines match the paper" },
  "\u6309\u5C4F\u5E55\u5BBD\u6392\uFF0C\u8C31\u5927\u4E00\u70B9": { en: "Lay out to screen width, with larger staves" },
  "\u5C0F\u8282\u53F7": { en: "Bar numbers" },
  "\u6BCF\u884C\u5F00\u5934": { en: "Start of each line" },
  "\u4E0D\u5370": { en: "Don't print" },
  "\u6BCF\u884C\u6700\u4E0A\u9762\u90A3\u6761\u8C31\u7684\u5DE6\u4E0A\u89D2\uFF0C\u5C0F\u5B57\uFF1B\u6BCF\u5F20\u7EB8\u4ECE 1 \u6570\uFF0C\u5F31\u8D77\u7B97 0": { en: "Small, top-left of each line's top staff; each sheet counts from 1, a pickup counts as 0" },
  "\u6B4C\u8BCD\u6392\u6CD5": { en: "Lyric spacing" },
  "\u6309\u8282\u594F": { en: "By rhythm" },
  "\u6309\u6B4C\u8BCD": { en: "By lyrics" },
  "\u97F3\u7684\u4F4D\u7F6E\u53EA\u770B\u65F6\u503C\uFF0C\u6253\u5B57\u65F6\u97F3\u7B26\u4E0D\u52A8\uFF1B\u6B4C\u8BCD\u8BA9\u8DEF\uFF1A\u501F\u65C1\u8FB9\u7684\u7A7A \u2192 \u8FD9\u4E00\u884C\u4E00\u8D77\u7F29\u4E00\u70B9 \u2192 \u8FD8\u653E\u4E0D\u4E0B\u753B\u7070": { en: "Note positions depend only on duration, so notes stay put while you type; lyrics make room: borrow space nearby \u2192 shrink the whole line a little \u2192 grey out if it still doesn't fit" },
  "\u957F\u7684\u5B57\u628A\u97F3\u63A8\u5F00\uFF08\u51FA\u7248\u8C31\u7684\u8001\u89C4\u77E9\uFF09": { en: "Long words push notes apart (the traditional engraving rule)" },
  "\u8C31\u4E0A\u7684\u5B57": { en: "Text on the score" },
  "\u628A\u8FD9\u9996\u6B4C\u7684{list}\u5199\u6210\u6211\u7684\u4E60\u60EF\u73B0\u5728\u7684\u6837\u5B50\uFF08\u6CA1\u8BBE\u4E60\u60EF\u7684\u7167\u8F6F\u4EF6\u7684\u9ED8\u8BA4\uFF09\uFF0C\u8C31\u4E0A\u7684\u5B57\u5199\u6210\u754C\u9762\u7684\u8BED\u8A00\uFF1B\u522B\u7684\u4E0D\u52A8\u3002\u80FD\u64A4\u9500": { en: "Write this song's {list} as my habits are now (where no habit is set, the software default) and its score text in the interface language; nothing else changes. Can be undone" },
  "\u9875\u9762\u8BBE\u7F6E": { en: "Page settings" },
  "\u770B\u8C31\uFF1A\u8FD9\u5F20\u7EB8\u5728\u5C4F\u5E55\u4E0A\u600E\u4E48\u770B": { en: "View: how this page looks on screen" },
  "\u7248\u9762\uFF1A\u7EB8\u5F20\u548C\u97F3\u7B26\u5BC6\u5EA6": { en: "Page: paper and note density" },
  "\u5957\u7528\u6211\u7684\u4E60\u60EF": { en: "Apply my habits" },
  "\u7B80\u8C31": { en: "Numbered (jianpu)" },
  "\u5B57\u6BCD\u8C31": { en: "Letter names" },
  "\u4E94\u7EBF\u8C31": { en: "Staff" },
  "\u4E2D\u592E C \u53EB C{n}": { en: "Middle C = C{n}" },
  "\u663E\u793A\u6F14\u594F\u6CD5\u548C\u8868\u60C5": { en: "Show articulations & dynamics" },
  "\u4E0D\u663E\u793A\u6F14\u594F\u6CD5\u548C\u8868\u60C5": { en: "Hide articulations & dynamics" },
  "\u8C31\u4E0A\u7684\u5B57\uFF1A{l}": { en: "Text on the score: {l}" },
  "\u5C0F\u6708\u76F8\u5FF5\u51FA\u6765 {n} \u4E2A\u97F3\u8282\u3001\u8C31\u4E0A {n2} \u4E2A\uFF0C\u5BF9\u4E0D\u4E0A\uFF08\u5531\u7684\u65F6\u5019\u4F1A\u62A5\u9519\uFF09\uFF1A": { en: "Tsukuyomi-chan says {n} syllables but the score has {n2}, so they don't match (singing will report an error):" },
  "\u5C0F\u6708\u76F8\u5FF5\u6210\uFF08\u97F3\u7D20 + \u58F0\u8C03\uFF09\uFF1A": { en: "Tsukuyomi-chan reads it as (phonemes + tones):" },
  "\u5C0F\u6708\u76F8\u5FF5\u6210\uFF1A": { en: "Tsukuyomi-chan reads it as:" },
  "\u8DDF\u7740\u754C\u9762\uFF08{lang}\uFF09": { en: "Follow the interface ({lang})" },
  "\u8F6F\u4EF6\u81EA\u5DF1\u5199\u5728\u8C31\u4E0A\u7684\u5B57\u7528\u54EA\u79CD\u8BED\u8A00\uFF1A\u6CA1\u8D77\u540D\u5B57\u7684\u58F0\u90E8\u5199\u4E50\u5668\u7684\u53EB\u6CD5\u3001\u7B80\u8C31\u9F13\u7684\u56FE\u4F8B\u3001\u300C\u7F16\u6392\u300D\u3001\u51FA\u58F0\u7684\u6362\u6C14\u300C\u5438 / \u6DF1\u5438\u300D\u3002\u6B4C\u8BCD\u3001\u6B4C\u540D\u3001\u4F5C\u8005\u680F\u3001\u4F60\u8D77\u7684\u58F0\u90E8\u540D\u7167\u5199\u7684\u5370\uFF0C\u4E0D\u7FFB\u3002\u8DDF\u7740\u754C\u9762 = \u8FD9\u53F0\u8BBE\u5907\u662F\u4EC0\u4E48\u8BED\u8A00\u5C31\u5370\u4EC0\u4E48\u8BED\u8A00\u3002": { en: "Which language the app's own words on the score use: the instrument name of a part you haven't named, the drum legend in numbered notation, \u201CArrangement\u201D, and the breath words \u201Cin / deep in\u201D. Lyrics, the title, the credits and part names you typed are printed as written, never translated. Follow the interface = print in whatever language this device's interface is in." },
  "\u6253\u51FB\u4E50\u7684\u884C\u6CA1\u6709\u8C03\uFF1A\u5199\u7684\u97F3\u9AD8 = \u6572\u54EA\u4E2A\u9F13\uFF0C\u548C\u8C03\u53F7\u65E0\u5173\uFF08\u8C03\u53F7\u7559\u5728\u8C31\u91CC\uFF0C\u4E0D\u8D77\u4F5C\u7528\uFF09": { en: "Percussion rows have no key: the written pitch says which drum is hit, not a pitch (the key signature stays in the score but does nothing)" },
  "\u9759\u97F3": { en: "Muted" },
  "\u72EC\u594F": { en: "Solo" },
  "\u53EA\u770B\u5B83": { en: "Only this" },
  "\u4E0D\u51FA\u58F0": { en: "Silent" },
  "\u81EA\u7136\u8870\u51CF": { en: "Natural decay" },
  "{p}{p2}\uFF1A\u7A7A\u7740\u7684\u6B4C\u8BCD\u4F4D\u4E0D\u5F00\u6846\uFF1B\u5DF2\u7ECF\u5199\u4E86\u7684\u5B57\u70B9\u5F00\u80FD\u6539\u3001\u80FD\u5220": { en: "{p}{p2}: empty lyric slots don't open a box; lyrics already written can still be tapped to edit or delete" },
  "\uFF08\u5143\u97F3\u7248\uFF09\u53EA\u54FC": { en: " (vowel version) only hums" },
  "\u4E0D\u5531\u6B4C\u8BCD": { en: " doesn't sing lyrics" },
  "\u6B4C\u91CC\u53EA\u5269\u8FD9\u4E00\u4E2A\u58F0\u90E8\uFF0C\u5220\u4E0D\u4E86": { en: "This is the only part left in the song; it can't be deleted" },
  "\u300C{name}\u300D\u662F{secs}\u91CC\u552F\u4E00\u7684\u58F0\u90E8\uFF0C\u5220\u4E0D\u4E86\uFF1A\u5148\u7ED9\u8FD9\u51E0\u6BB5\u653E\u8FDB\u522B\u7684\u58F0\u90E8\uFF0C\u6216\u8005\u628A\u8FD9\u51E0\u6BB5\u6574\u6BB5\u5220\u6389": { en: "\u201C{name}\u201D is the only part in {secs}, so it can't be deleted: first put another part into those sections, or delete those sections" },
  "\u5220\u6389\u58F0\u90E8\u300C{name}\u300D": { en: "Delete part \u201C{name}\u201D" },
  "\u5220\u6389\u4E86\u300C{name}\u300D\uFF08\u5B83\u6CA1\u5199\u4E1C\u897F\uFF1B\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": { en: "Deleted \u201C{name}\u201D (it hadn't written anything; undo brings it back)" },
  "\u300C{p}\u300D{n} \u4E2A\u97F3": { en: "\u201C{p}\u201D: {n} {n|note|notes}" },
  "\u300C{p}\u300D\uFF08\u6CA1\u6709\u97F3\uFF0C\u53EA\u6709\u4F11\u6B62 / \u8BB0\u53F7\uFF09": { en: "\u201C{p}\u201D (no notes, only rests / marks)" },
  "\u5220\u6389\u58F0\u90E8\u300C{name}\u300D\uFF1F": { en: "Delete the part \u201C{name}\u201D?" },
  "\u5B83\u5199\u8FC7\u7684\uFF1A{list}\u3002\u8FDE\u540C\u6B4C\u8BCD\u3001\u8BB0\u53F7\u3001\u5B83\u7684\u4E50\u5668\u8BBE\u7F6E\u4E00\u8D77\u5220\u6389\uFF08\u80FD\u64A4\u9500\uFF0C\u4E00\u6B65\u5168\u627E\u56DE\uFF09\u3002": { en: "What it wrote: {list}. Its lyrics, marks and instrument settings are deleted too (undo brings it all back in one step)." },
  "\u5220\u6389": { en: "Remove" },
  "\u5220\u6389\u4E86\u300C{name}\u300D\uFF08\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": { en: "Deleted \u201C{name}\u201D (undo brings it back)" },
  "\u7B2C {n} \u6BB5": { en: "Section {n}" },
  "\u300C{p}\u300D\u53EA\u6709\u300C{name}\u300D\u8FD9\u4E00\u4E2A\u58F0\u90E8\uFF0C\u5220\u4E0D\u4E86\uFF1A\u8FD9\u4E00\u6BB5\u6574\u6BB5\u4E0D\u8981 = \u7EB8\u9876\u300C\u22EF\u300D\u91CC\u5220\u8FD9\u4E00\u6BB5": { en: "\u201C{name}\u201D is the only part in \u201C{p}\u201D, so it can't be deleted: to drop the whole section, use the \u22EF at the top of the sheet" },
  "\u5DF2\u4ECE\u300C{p}\u300D\u5220\u6389\u300C{name}\u300D\uFF08\u5B83\u5728\u8FD9\u4E00\u6BB5\u6CA1\u5199\u4E1C\u897F\uFF09": { en: "Deleted \u201C{name}\u201D from \u201C{p}\u201D (it hadn't written anything in this section)" },
  "\u4ECE\u300C{p}\u300D\u5220\u6389\u300C{name}\u300D\uFF1F": { en: "Delete \u201C{name}\u201D from \u201C{p}\u201D?" },
  "\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684 {n} \u4E2A\u97F3\uFF0C\u8FDE\u540C\u6B4C\u8BCD\u3001\u8BB0\u53F7\u4E00\u8D77\u5220\u6389\u3002": { en: "The {n} {n|note|notes} it wrote in this section {n|is|are} deleted, with their lyrics and marks." },
  "\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684\u4E1C\u897F\u4E00\u8D77\u5220\u6389\u3002": { en: "What it wrote in this section is deleted." },
  "\u518D\u628A\u5B83\u653E\u8FDB\u8FD9\u4E00\u6BB5\u662F\u4E00\u884C\u7A7A\u7684\uFF1B\u8981\u627E\u56DE\u53EA\u80FD\u64A4\u9500\u3002": { en: "Putting it back into this section gives an empty line; only undo brings the old one back." },
  "\u300C{p}\u300D\u6BB5\u7684\u300C{label}\u300D\u4EA4\u7ED9\u2026": { en: "Hand \u201C{label}\u201D in section \u201C{p}\u201D to\u2026" },
  "\u5728\u300C{label}\u300D\u4E0A\u9762\u52A0": { en: "Add above \u201C{label}\u201D" },
  "\u5728\u300C{label}\u300D\u4E0B\u9762\u52A0": { en: "Add below \u201C{label}\u201D" },
  "\uFF08\u5BF9\u8C03\uFF09": { en: " (swap)" },
  "\uFF0B \u65B0\u58F0\u90E8\u2026": { en: "\uFF0B New part\u2026" },
  "\u53EA\u6539\u8FD9\u4E00\u6BB5\uFF1A\u97F3\u3001\u6B4C\u8BCD\u3001\u8BB0\u53F7\u90FD\u4E0D\u52A8\uFF0C\u6362\u4E00\u4E2A\u58F0\u90E8\u5531\uFF1B\u8DE8\u6BB5\u6309\u58F0\u90E8\u63A5\u8D77\u6765\u3002\u5BF9\u65B9\u5728\u8FD9\u4E00\u6BB5\u5DF2\u7ECF\u6709\u4E00\u884C = \u4E24\u884C\u5BF9\u8C03\u3002": { en: "This section only: notes, lyrics and marks stay, another part plays them; across sections, lines join up by part. If the other part already has a row here, the two rows swap." },
  "\u53EA\u52A0\u5728\u8FD9\u4E00\u6BB5\uFF08\u522B\u7684\u6BB5\u7167\u65E7\uFF09\u3002": { en: "Only added to this section (others unchanged)." },
  "\u4ECE\u300C{p}\u300D\u5220\u6389\uFF08\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684\u4E00\u8D77\u5220\uFF0C\u5148\u95EE\uFF09": { en: "Delete from \u201C{p}\u201D (what it wrote in that section is deleted; asks first)" },
  "\u653E\u8FDB\u300C{p}\u300D\uFF08\u4E00\u884C\u7A7A\u7684\uFF09": { en: "Put into \u201C{p}\u201D (an empty line)" },
  "\u8D77\u4E2A\u540D\u5B57\uFF08\u8C31\u4E0A\u539F\u6837\u5199\u3001\u4E0D\u7FFB\u8BD1\uFF09\uFF1B\u7A7A\u7740 = \u5199\u8FD9\u4EF6\u4E50\u5668\u7684\u53EB\u6CD5": { en: "Give it a name (printed as typed, never translated); empty = the instrument's name" },
  "\u6362\u4E50\u5668\uFF08\u8FDB\u4E50\u5668\u76EE\u5F55\uFF09": { en: "Change instrument (opens the instrument catalog)" },
  "\u6CA1\u4EBA\u4E0A\u573A": { en: "Nobody on stage" },
  "\u8FD9\u4E00\u884C\u7684\u66F4\u591A\uFF1A\u4E0A\u4E0B\u632A\u3001\u52A0\u3001\u4EA4\u7ED9\u3001\u4E50\u5668\u8BBE\u7F6E\u3001\u5220\u9664": { en: "More for this row: move, add, hand over, instrument settings, delete" },
  "\u66F4\u591A": { en: "More" },
  "\u4E0A\u79FB": { en: "Move up" },
  "\u4E0B\u79FB": { en: "Move down" },
  "\u5728\u8FD9\u4E00\u884C\u4E0A\u9762\u52A0\u4E00\u4E2A\u58F0\u90E8\uFF08\u5DF2\u6709\u7684\u6216\u65B0\u7684\uFF1B\u53EA\u52A0\u5728\u8FD9\u4E00\u6BB5\uFF09": { en: "Add a part above this row (existing or new; this section only)" },
  "\u5728\u4E0A\u9762\u52A0\u2026": { en: "Add above\u2026" },
  "\u5728\u8FD9\u4E00\u884C\u4E0B\u9762\u52A0\u4E00\u4E2A\u58F0\u90E8\uFF08\u5DF2\u6709\u7684\u6216\u65B0\u7684\uFF1B\u53EA\u52A0\u5728\u8FD9\u4E00\u6BB5\uFF09": { en: "Add a part below this row (existing or new; this section only)" },
  "\u5728\u4E0B\u9762\u52A0\u2026": { en: "Add below\u2026" },
  "\u53EA\u6709\u8FD9\u4E00\u6BB5\uFF1A\u8FD9\u4E00\u884C\u7684\u97F3\u3001\u6B4C\u8BCD\u3001\u8BB0\u53F7\u539F\u6837\u4EA4\u7ED9\u53E6\u4E00\u4E2A\u58F0\u90E8\u6F14\uFF08\u7528\u5B83\u7684\u4E50\u5668\u548C\u6DF7\u97F3\u53F0\u90A3\u4E00\u6761\uFF09": { en: "This section only: hand this row\u2019s notes, lyrics and marks to another part (its instrument and its mixer strip)" },
  "\u300C{p}\u300D\u6BB5\u4EA4\u7ED9\u2026": { en: "Hand section \u201C{p}\u201D to\u2026" },
  "\u653E\u8FDB\u300C{p}\u300D": { en: "Put into \u201C{p}\u201D" },
  "\u4E50\u5668\u8BBE\u7F6E\u2026": { en: "Instrument settings\u2026" },
  "\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684\u4E00\u8D77\u5220\u6389\uFF08\u5148\u95EE\uFF1B\u80FD\u64A4\u9500\uFF09\u3002\u522B\u7684\u6BB5\u7167\u65E7": { en: "Deletes what it wrote in this section (asks first; undo works). Other sections stay as they are" },
  "\u4ECE\u300C{p}\u300D\u5220\u6389": { en: "Delete from \u201C{p}\u201D" },
  "\u6574\u4E2A\u58F0\u90E8\u5220\u6389\uFF1A\u6BCF\u4E00\u6BB5\u91CC\u5B83\u5199\u7684\u3001\u5B83\u7684\u4E50\u5668\u8BBE\u7F6E\u4E00\u8D77\u5220\uFF08\u5148\u95EE\uFF1B\u80FD\u64A4\u9500\uFF09": { en: "Delete the whole part: what it wrote in every section and its instrument settings (asks first; undo works)" },
  "\u5220\u6389\u58F0\u90E8\u2026": { en: "Delete part\u2026" },
  "\u58F0\u90E8\u7BA1\u7406": { en: "Parts" },
  "\u5C0F\u683C = \u5728\u54EA\u51E0\u6BB5\uFF08\u4EAE = \u6709\uFF1B\u5708\u7740\u7684 = \u5149\u6807\u8FD9\u4E00\u6BB5\uFF09\uFF1B\u22EF = \u4E0A\u4E0B\u632A\u3001\u52A0\u3001\u4EA4\u7ED9\u3001\u5220\u9664": { en: "Chips = which sections (lit = has it; ringed = the cursor's section); \u22EF = move, add, hand over, delete" },
  "\u65B0\u58F0\u90E8\u53EA\u52A0\u5728\u5149\u6807\u8FD9\u4E00\u6BB5\uFF08\u522B\u7684\u6BB5\u7167\u65E7\uFF09\uFF0C\u52A0\u5B8C\u6311\u4E50\u5668": { en: "The new part goes only into the cursor\u2019s section (others unchanged); then pick an instrument" },
  "\uFF0B \u65B0\u58F0\u90E8": { en: "\uFF0B New part" },
  "\u89D2\u8272\u6539\u540D\uFF1A{n}": { en: "Role renamed: {n}" },
  "\u540D\u5B57\u6E05\u6389\u4E86\uFF1A\u8DDF\u7740\u4E50\u5668\u5199\u300C{inst}\u300D": { en: "Name cleared: shows the instrument, \u201C{inst}\u201D" },
  "\u8FD9\u4E00\u6BB5\u7684\u8FD9\u4E00\u884C\u4EA4\u7ED9\u4E86\u300C{name}\u300D": { en: "This section\u2019s row was handed to \u201C{name}\u201D" },
  "\u8FD9\u4E00\u6BB5": { en: "This section" },
  "\u6539\u66F2\u6BB5\u540D\u2026": { en: "Rename section\u2026" },
  "\u9690\u85CF = \u4E0D\u653E\u3001\u4E0D\u8FDB\u538B\u5E73\u4EF6\uFF1B\u8C31\u4E0A\u6298\u53E0\u7740\uFF0C\u7FFB\u9875\u80FD\u8FDB\u53BB": { en: "Hidden = not played and not in the flattened copy; collapsed on the score, reachable by paging" },
  "\u663E\u793A\uFF08\u73B0\u5728\u9690\u85CF\u7740\uFF09": { en: "Show (hidden now)" },
  "\u9690\u85CF\uFF08\u4E0D\u653E\uFF09": { en: "Hide (don't play)" },
  "\u5220\u8FD9\u4E00\u6BB5\u2026": { en: "Delete this section\u2026" },
  "\u63D2\u5165": { en: "Insert" },
  "\u65B0\u7684\u4E00\u6BB5\u63D2\u5728\u5B83\u524D\u9762\uFF08\u8C31\u5934\u7167\u6284\u524D\u4E00\u6BB5\u7ED3\u5C3E\u7684\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\uFF09": { en: "Insert a new section before it (its header copies the key / time / tempo where the previous section ends)" },
  "\u5728\u4E0A\u9762\u63D2\u4E00\u6BB5": { en: "Insert above" },
  "\u65B0\u7684\u4E00\u6BB5\u63A5\u5728\u5B83\u540E\u9762": { en: "Insert a new section after it" },
  "\u5728\u4E0B\u9762\u63D2\u4E00\u6BB5": { en: "Insert below" },
  "\u6574\u6BB5\uFF08\u6240\u6709\u58F0\u90E8\u7684\u97F3\u3001\u8BB0\u53F7\u3001\u6B4C\u8BCD\uFF09\u7167\u6284\u4E00\u4EFD\uFF0C\u63A5\u5728\u5B83\u540E\u9762": { en: "Copy the whole section (all parts' notes, marks and lyrics) right after it" },
  "\u590D\u5236\u8FD9\u4E00\u6BB5": { en: "Duplicate section" },
  "\u7F16\u8F91": { en: "Edit" },
  "\u8FD9\u5F20\u7EB8 / \u6574\u9996\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u79FB\u8C03\u3001\u8F6C\u8C03\uFF08\u8C03\u53F7\u8DDF\u7740\u632A\uFF09": { en: "Transpose / change key for all parts on this sheet or the whole song (key signature moves too)" },
  "\u79FB\u8C03 / \u8F6C\u8C03\u2026": { en: "Transpose / change key\u2026" },
  "\u66F2\u6BB5 = \u4E00\u5F20\u7EB8\uFF1A\u6BCF\u4E00\u6BB5\u662F\u4E00\u4E2A\u65B0\u7684\u5F00\u59CB\uFF0C\u5404\u58F0\u90E8\u5728\u8FD9\u91CC\u91CD\u65B0\u5BF9\u9F50\uFF1B\u4E00\u6BB5\u91CC\u8981\u54EA\u4E9B\u58F0\u90E8\u968F\u5B83\uFF08\u6BCF\u6BB5\u5E95\u4E0B\u300C\uFF0B \u58F0\u90E8\u300D\uFF09\u3002": { en: "Section = one sheet: each section is a fresh start where all parts line up again; each section has its own parts (use \uFF0B Part under it)." },
  "{name} \u526F\u672C": { en: "{name} copy" },
  "\u66F2\u6BB5": { en: "Section" },
  "\u590D\u5236\u4E86\u4E00\u6BB5\uFF08\u63A5\u5728\u540E\u9762\uFF09": { en: "Section duplicated (placed right after)" },
  "\u8FD9\u5F20\u7EB8\u663E\u793A\u4E86\uFF08\u4F1A\u653E\uFF09": { en: "This sheet is shown (will play)" },
  "\u8FD9\u5F20\u7EB8\u9690\u85CF\u4E86\uFF08\u4E0D\u653E\uFF09": { en: "This sheet is hidden (won't play)" },
  "\u5220\u6389\u300C{p}\u300D\uFF1F": { en: "Delete \u201C{p}\u201D?" },
  "\u8FD9\u5F20\u7EB8\u4E0A\u6240\u6709\u58F0\u90E8\u5199\u7684\u4E1C\u897F\u4E00\u8D77\u5220\u6389\uFF08\u80FD\u64A4\u9500\uFF1A\u64A4\u9500 / Ctrl+Z\uFF09\u3002": { en: "Everything written in all parts on this sheet is deleted (can be undone: Undo / Ctrl+Z)." },
  "\u5220": { en: "Delete" },
  "\u52A0\u8FDB\u300C{p}\u300D": { en: "Add to \u201C{p}\u201D" },
  "\u5DF2\u6709\u7684\u58F0\u90E8\uFF0C\u53EA\u52A0\u8FDB\u8FD9\u4E00\u6BB5\uFF08\u522B\u7684\u6BB5\u7167\u65E7\uFF09": { en: "An existing part, added to this section only (others unchanged)" },
  "\u65B0\u7684\u4E00\u4E2A\u58F0\u90E8\uFF0C\u53EA\u51FA\u73B0\u5728\u8FD9\u4E00\u6BB5\uFF1B\u52A0\u5B8C\u6311\u4E50\u5668": { en: "A new part, only in this section; then pick an instrument" },
  "\u58F0\u90E8\u7BA1\u7406\u2026": { en: "Parts\u2026" },
  "{who} \u5728\u6F14": { en: "Played by {who}" },
  "\u9690\u85CF": { en: "Hide" },
  "\u9690\u85CF\uFF1A\u8FD9\u4E00\u4F4D\u7F29\u6210\u7EC6\u884C\u3001\u4E0D\u5360\u5730\u65B9\uFF0C\u7167\u6837\u51FA\u58F0\uFF1B\u518D\u70B9 = \u663E\u793A": { en: "Hide: this part shrinks to a thin line and takes no room, but still plays; tap again = show" },
  "\u53EA\u770B\u5B83\uFF1A\u522B\u7684\u58F0\u90E8\u90FD\u7F29\u6210\u7EC6\u884C\uFF08\u53EF\u4EE5\u51E0\u4F4D\u4E00\u8D77\u53EA\u770B\uFF09\uFF1B\u518D\u70B9 = \u90FD\u770B": { en: "Only this: every other part shrinks to a thin line (several parts can be 'only' at once); tap again = show all" },
  "\u51FA\u58F0": { en: "Sounding" },
  "\u9759\u97F3##\u5F00\u5173": { en: "Mute" },
  "\u9759\u97F3\uFF1A\u8FD9\u4E00\u4F4D\u4E0D\u51FA\u58F0\uFF0C\u8C31\u4E0A\u7167\u6837\u753B\uFF1B\u518D\u70B9 = \u51FA\u58F0": { en: "Mute: this part makes no sound but is still drawn; tap again = sound" },
  "\u72EC\u594F\uFF1A\u53EA\u542C\u5B83\uFF08\u53EF\u4EE5\u51E0\u4F4D\u4E00\u8D77\u72EC\u594F\uFF09\uFF1B\u518D\u70B9 = \u5173\u6389": { en: "Solo: hear only this part (several parts can solo at once); tap again = off" },
  "\u6362\u4E50\u5668": { en: "Change instrument" },
  "\u8FDB\u4E50\u5668\u76EE\u5F55": { en: "Open the instrument catalog" },
  "\u6362\u4E50\u5668\uFF1A\u8FDB\u4E50\u5668\u76EE\u5F55\uFF08\u53F3\u8FB9\u7684\u952E\u76D8\u80FD\u8BD5\uFF1B\u9876\u4E0A\u662F\u8FD9\u9996\u6B4C\u7684\u4E50\u5668\u9884\u8BBE\uFF09\uFF0C\u9009\u597D\u5C31\u6362\u4E0A\u3001\u76EE\u5F55\u8FD8\u5F00\u7740\u53EF\u4EE5\u63A5\u7740\u6362\uFF0C\u300C\u2190 \u8C31\u300D\u56DE\u6765": { en: "Change instrument: open the catalog (try with the keyboard on the right; this song\u2019s instrument presets are on top); picking one swaps it in and keeps the catalog open so you can keep trying; \u201C\u2190 Score\u201D goes back" },
  "\u4E50\u5668\u8BBE\u7F6E": { en: "Instrument settings" },
  "\u600E\u4E48\u6F14\u3001\u54CD\u5EA6": { en: "How it plays, loudness" },
  "\u8FD9\u4F4D\u600E\u4E48\u6F14\uFF08\u54CD\u5EA6\u3001\u529B\u5EA6\u3001\u5531\u6CD5\u2026\uFF09\u548C\u8C31\u4E0A\u5199\u4EC0\u4E48\u540D\u5B57\uFF1A\u5168\u5C4F\u4E00\u9875\uFF0C\u53F3\u8FB9\u7684\u952E\u76D8\u80FD\u8BD5": { en: "How this performer plays (loudness, dynamics, singing\u2026) and the name on the score: a full page, try it on the keys at the right" },
  "\u6240\u6709\u58F0\u90E8\u6392\u4E00\u5217\uFF1A\u6539\u540D\u3001\u4E0A\u4E0B\u632A\u3001\u5728\u54EA\u51E0\u6BB5\uFF1B\u8FD9\u4E00\u6BB5\u4E0A\u9762 / \u4E0B\u9762\u52A0\u3001\u4EA4\u7ED9\u522B\u7684\u58F0\u90E8\u3001\u4ECE\u8FD9\u4E00\u6BB5\u5220\u6389": { en: "All parts in one list: rename, move, choose sections; add above / below in this section, hand to another part, delete from this section" },
  "\u6709 {n} \u4E2A\u5B57\u5531\u4E0D\u51FA\u6765\uFF08\u8C31\u4E0A\u753B\u7070\uFF09\uFF1A{first}{x}": { en: "{n} {n|syllable|syllables} can't be sung (grayed out on the score): {first}{x}" },
  " \u7B49": { en: " etc." },
  "\u8D77\u70B9\u632A\u5230\u8FD9\u4E2A\u5C0F\u8282\u7684\u5934\uFF0C\u4ECE\u8FD9\u513F\u653E\uFF08\u4E4B\u540E |\u25B6 \u56DE\u5230\u8FD9\u513F\u91CD\u653E\uFF1B\u7F16\u8F91\u3001\u632A\u5149\u6807\u90FD\u4E0D\u52A8\u8D77\u70B9\uFF09": { en: "Moves the start point to the head of this bar and plays from here (later |\u25B6 replays from here; editing or moving the cursor doesn't move it)" },
  "\u7C98\u8D34": { en: "Paste" },
  "\u8D34\u5728\u8FD9\u91CC\uFF1Aapp \u91CC\u590D\u5236\u7684\uFF0C\u6216\u7CFB\u7EDF\u526A\u8D34\u677F\u91CC\u7684\u7B80\u8C31\u6587\u5B57\uFF081 2 3 | 5 - -\uFF09": { en: "Paste here: copied in the app, or jianpu text on the system clipboard (1 2 3 | 5 - -)" },
  "\u5C0F\u8282\u7EBF |": { en: "Barline |" },
  "\u4ECE\u8FD9\u91CC\u91CD\u65B0\u6570\u5C0F\u8282\uFF08\u5F31\u8D77\uFF09": { en: "Recount bars from here (pickup)" },
  "\u8C31\u53F7 \xB7 \u8C03\u53F7 \xB7 \u62CD\u53F7 \xB7 \u901F\u5EA6\u2026": { en: "Clef \xB7 Key \xB7 Time \xB7 Tempo\u2026" },
  "\u4ECE\u8FD9\u513F\u8D77\u6362\uFF08\u540C\u4E00\u4E2A\u9762\u677F\uFF09": { en: "Change from here (one panel)" },
  "\u516B\u5EA6\u7EBF\u2026": { en: "Ottava line\u2026" },
  "8va / 15ma / 8vb\uFF08\u53EA\u7BA1\u753B\uFF09": { en: "8va / 15ma / 8vb (display only)" },
  "\u8FD9\u5F20\u7EB8 / \u6574\u9996\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u632A\uFF08\u8C03\u53F7\u8DDF\u7740\u632A\uFF09\uFF1B\u53EA\u632A\u4E00\u6BB5 = \u9009\u4E2D\u5B83\uFF0C\u7528\u9009\u533A\u83DC\u5355": { en: "Moves all parts on this sheet or in the whole song (key signature too); to move just a passage, select it and use the selection menu" },
  "\u529B\u5EA6 {d}\uFF1A\u4ECE\u8FD9\u513F\u524D\u9762\u90A3\u4E2A\u97F3\u8D77": { en: "Dynamic {d}: from the note before here" },
  "\u5168\u9009": { en: "Select all" },
  "\u98CE\u683C\u8BB0\u53F7\u8981\u653E\u5728\u4E00\u4E2A\u97F3\u4E0A\uFF08\u8FD9\u5F20\u7EB8\u91CC\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "A style mark goes on a note (this sheet has no notes yet)" },
  "\u53CD\u590D / \u8DF3\u8F6C\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4F4D\uFF08{extras}\uFF09\u90A3\u4E00\u884C\uFF1A\u8FD9\u4E00\u884C\u5199\u7684\u753B\u7070\u3001\u4E0D\u8D77\u4F5C\u7528": { en: "Repeats / jumps only count on the top part's line ({extras}): written on this line they're grayed out and have no effect" },
  "\u7B2C {p} \u5F20\u7EB8": { en: "Sheet {p}" },
  "\u8FD9\u4E00\u6BB5\u300C{paperId}\u300D": { en: "This section \u201C{paperId}\u201D" },
  "\u79FB\u8C03": { en: "Transpose" },
  "\u2191 \u534A\u97F3": { en: "\u2191 Semitone" },
  "\u2193 \u534A\u97F3": { en: "\u2193 Semitone" },
  "\u2191 \u5168\u97F3": { en: "\u2191 Whole tone" },
  "\u2193 \u5168\u97F3": { en: "\u2193 Whole tone" },
  "\u516B\u5EA6": { en: "Octave" },
  "\u2191 \u516B\u5EA6": { en: "\u2191 Octave" },
  "\u2193 \u516B\u5EA6": { en: "\u2193 Octave" },
  "\u8F6C\u8C03\u5230\uFF08\u73B0\u5728 1={now}\uFF09\uFF1A\u97F3\u6309\u4E24\u4E2A\u4E3B\u97F3\u4E4B\u95F4\u7684\u97F3\u7A0B\u632A": { en: "Change key to (now 1={now}): notes move by the interval between the two tonics" },
  "{whole}\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u632A\uFF0C\u8C03\u53F7\u8DDF\u7740\u632A\uFF08\u53D6\u5347\u964D\u53F7\u5C11\u7684\u5199\u6CD5\uFF1B\u632A\u516B\u5EA6\u8C03\u53F7\u4E0D\u53D8\uFF09\u3002\u6B4C\u8BCD\u3001\u8BB0\u53F7\u3001\u8C31\u53F7\u4E0D\u52A8\uFF1B\u9F13 / \u56FA\u5B9A\u6572\u4E00\u4E2A\u952E\u7684\u58F0\u90E8\uFF08\u5199\u7684\u97F3\u9AD8 = \u6572\u54EA\u4E2A\uFF09\u4E0D\u52A8\uFF1Bpad \u7684\u300C1=\u300D\u4E0D\u8DDF\u3002": { en: "{whole}all parts move together, and the key signature follows (spelled with fewer accidentals; octave moves leave it unchanged). Lyrics, marks and clefs stay; drums / single-key parts (written pitch = which one to hit) stay; the pad's \u201C1=\u201D doesn't follow." },
  "\u8FD9\u5F20\u7EB8\u4E0A": { en: "On this sheet," },
  "\u5DF2\u7ECF\u662F\u8FD9\u4E2A\u8C03": { en: "Already in this key" },
  "\u6CA1\u6709\u53EF\u4EE5\u632A\u7684\u97F3": { en: "No notes to move" },
  "{held} \u662F\u9F13 / \u56FA\u5B9A\u6572\u4E00\u4E2A\u952E\uFF08\u5199\u7684\u97F3\u9AD8 = \u6572\u54EA\u4E2A\uFF09\uFF0C\u6CA1\u632A": { en: "{held} is drums / single-key (written pitch = which one to hit), so it wasn't moved" },
  "\u8C31\u5185\u53CD\u590D\uFF1A\u63D2\u5728\u5149\u6807\u5904\uFF1B\u5149\u6807\u6328\u7740\u5C0F\u8282\u7EBF = \u628A\u90A3\u6761\u6539\u6210\u53CD\u590D\u7684\u3002\u653E\u7684\u65F6\u5019\u6309\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C\u5C55\u5F00\uFF0C\u522B\u7684\u58F0\u90E8\u8DDF\u7740\uFF1B\u4E0D\u8DE8\u7EB8\u3002\u8DF3\u56DE\u6765\uFF08D.C. / D.S.\uFF09\u4E4B\u540E\u53CD\u590D\u4E0D\u518D\u53CD\u590D\u3002": { en: "Score repeats: inserted at the cursor; next to a barline = turns that barline into a repeat. Playback expands them from this sheet's top part, other parts follow; they don't cross sheets. After a jump back (D.C. / D.S.), repeats don't repeat again." },
  "\u53CD\u590D\u5F00\u59CB": { en: "Repeat start" },
  "\u53CD\u590D\u7ED3\u675F\uFF1A\u56DE\u5230 |:\uFF08\u6CA1\u6709 = \u8FD9\u5F20\u7EB8\u5F00\u5934\uFF09\u518D\u653E\u4E00\u904D": { en: "Repeat end: back to |: (or this sheet's start if none) and play again" },
  "\u524D\u4E00\u6BB5\u53CD\u590D\u7ED3\u675F\u3001\u540E\u4E00\u6BB5\u53CD\u590D\u5F00\u59CB": { en: "End one repeat, start another" },
  "\u4E00\u5171\u653E\u4E09\u904D": { en: "Play three times in total" },
  "\u4E00\u5171\u653E\u56DB\u904D": { en: "Play four times in total" },
  "\u6539\u56DE\u666E\u901A\u5C0F\u8282\u7EBF": { en: "Back to a normal barline" },
  "\u2016 \u6BB5\u843D\u7EBF": { en: "\u2016 Double bar" },
  "\u6BB5\u843D\u7EBF\uFF08\u4E24\u6839\u7EC6\u7EBF\uFF09\uFF1A\u5206\u6BB5\u7684\u8BB0\u53F7\uFF0C\u4E0D\u662F\u4E24\u6839\u5C0F\u8282\u7EBF\uFF1B\u6328\u7740\u5C0F\u8282\u7EBF = \u628A\u90A3\u6761\u6539\u6210\u6BB5\u843D\u7EBF": { en: "Double bar (two thin lines): a section marker, not two barlines; next to a barline = turns that one into a double bar" },
  "\u7EC8\u6B62\u7EBF": { en: "Final bar" },
  "\u7EC8\u6B62\u7EBF\uFF08\u7EC6 + \u7C97\uFF09\uFF1A\u66F2\u5B50 / \u8FD9\u4E00\u6BB5\u5230\u8FD9\u513F\u7ED3\u675F": { en: "Final bar (thin + thick): the piece / this section ends here" },
  "\u623F\u5B50\uFF1A\u7B2C {p} \u904D\u8D70\u8FD9\u91CC": { en: "Ending: take this on pass {p}" },
  "\u8E29\u4E0B\uFF08\u63A5\u7740\u54CD\uFF09": { en: "Press (keeps ringing)" },
  "\u62AC\u8D77\uFF08\u6B62\u97F3\uFF09": { en: "Lift (stop the notes)" },
  "\u6362\u8E0F\u677F\uFF08\u5148\u6B62\u97F3\u3001\u518D\u63A5\u7740\u54CD\uFF09": { en: "Change pedal (stop, then keep ringing)" },
  "\u8E29\u4E0B\uFF08\u6309\u7740\u7684\u97F3\u63A5\u7740\u54CD\uFF09": { en: "Press (held notes keep ringing)" },
  "\u62AC\u8D77\uFF08\u653E\u5F00\u90A3\u51E0\u4E2A\u97F3\uFF09": { en: "Release (let those notes go)" },
  "\u6362\u8E0F\u677F\uFF08\u6362\u6210\u6B64\u523B\u6309\u7740\u7684\u97F3\uFF09": { en: "Change pedal (switch to the notes held now)" },
  "\u8E29\u4E0B\uFF08\u5F39\u5F97\u8F7B\u4E00\u70B9\uFF09": { en: "Press (play a little softer)" },
  "\u62AC\u8D77\uFF08\u56DE\u5230\u539F\u6765\u7684\u8F7B\u91CD\uFF09": { en: "Lift (back to the written loudness)" },
  "\u6362\u8E0F\u677F\uFF08\u5F31\u97F3\u7167\u65E7\u8E29\u7740\uFF09": { en: "Change pedal (the soft pedal stays down)" },
  "\u5EF6\u97F3\u8E0F\u677F": { en: "Sustain pedal" },
  "\u6301\u97F3\u8E0F\u677F": { en: "Sostenuto pedal" },
  "\u5F31\u97F3\u8E0F\u677F": { en: "Soft pedal" },
  "\u8FD9\u4F4D\u6CA1\u5199\u8E0F\u677F\u8BB0\u53F7\u65F6\u662F\u81EA\u7136\u8870\u51CF\uFF0C\u8FD9\u91CC\u672C\u6765\u5C31\u8E29\u7740\uFF1A\u8FD9\u4E2A\u8E29\u4E0B\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09": { en: "This performer uses natural decay when no pedal mark is written, so the pedal is already down here: this press has no effect (greyed)" },
  "\u8FD9\u91CC\u672C\u6765\u5C31\u8E29\u7740\uFF1A\u8FD9\u4E2A\u8E29\u4E0B\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09": { en: "The pedal is already down here: this press does nothing (greyed)" },
  "\u8FD9\u91CC\u672C\u6765\u6CA1\u8E29\u7740\uFF1A\u8FD9\u4E2A\u62AC\u8D77\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09": { en: "The pedal isn't down here: this lift does nothing (greyed)" },
  "\u8E0F\u677F\u8BB0\u53F7\u6302\u5728\u97F3\u4E0A\uFF1A\u8FD9\u5F20\u7EB8\u4E0A\u5149\u6807\u9644\u8FD1\u8FD8\u6CA1\u6709\u97F3": { en: "Pedal marks hang on notes: there are no notes near the cursor on this sheet yet" },
  "\u628A\u8FD9\u4E00\u6BB5\u8E29\u4F4F\uFF08\u9009\u533A\u5F00\u5934\u8E29\u4E0B\u3001\u7ED3\u5C3E\u62AC\u8D77\uFF09": { en: "Hold this passage (press at the start of the selection, lift at its end)" },
  "\u8FD9\u4E2A\u97F3\u4E0A\u5DF2\u7ECF\u6709\u4E86\uFF1A\u518D\u70B9 = \u53BB\u6389": { en: "Already on this note: tap again to remove" },
  "\uFF08\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\uFF09": { en: " (from the note before the cursor)" },
  "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u8FD9\u4F4D\u6CA1\u5199\u8E0F\u677F\u8BB0\u53F7\u65F6\u662F\u81EA\u7136\u8870\u51CF\uFF0C\u8FD9\u91CC\u672C\u6765\u5C31\u8E29\u7740": { en: "No effect (greyed): this performer uses natural decay when no pedal mark is written, so the pedal is already down here" },
  "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u8FD9\u91CC\u672C\u6765\u5C31\u8E29\u7740": { en: "No effect (greyed): the pedal is already down here" },
  "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u8FD9\u91CC\u672C\u6765\u6CA1\u8E29\u7740": { en: "No effect (greyed): the pedal isn't down here" },
  "\u8FD9\u91CC\u4E4B\u524D\u6CA1\u8E29\u7740\uFF0C\u6362\u8E0F\u677F = \u8E29\u4E0B": { en: "The pedal wasn't down before this, so a change = a press" },
  "\u5220\u6389\u8FD9\u4E2A\u8E0F\u677F\u8BB0\u53F7": { en: "Delete this pedal mark" },
  "8va\uFF1A\u8C31\u4E0A\u753B\u4F4E\u4E00\u4E2A\u516B\u5EA6\uFF08\u5B9E\u9645\u7167\u5199\u7684\u9AD8\u516B\u5EA6\u54CD\uFF09": { en: "8va: drawn an octave lower (sounds an octave higher, as written)" },
  "15ma\uFF1A\u8C31\u4E0A\u753B\u4F4E\u4E24\u4E2A\u516B\u5EA6": { en: "15ma: drawn two octaves lower" },
  "8vb\uFF1A\u8C31\u4E0A\u753B\u9AD8\u4E00\u4E2A\u516B\u5EA6\uFF08\u5B9E\u9645\u7167\u5199\u7684\u4F4E\u516B\u5EA6\u54CD\uFF09": { en: "8vb: drawn an octave higher (sounds an octave lower, as written)" },
  "\u5230\u8FD9\u513F\u7ED3\u675F\u516B\u5EA6\u7EBF": { en: "End the ottava line here" },
  "\u516B\u5EA6\u7EBF\uFF1A\u4ECE\u5149\u6807\u5904\u8D77{sel}\u3002\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8\u3002": { en: "Ottava line: from the cursor{sel}. Display only, pitch doesn't change." },
  "\uFF08\u6709\u9009\u533A = \u53EA\u753B\u8FD9\u4E00\u6BB5\uFF09": { en: " (with a selection = just this passage)" },
  "\uFF0C\u5230\u4E0B\u4E00\u4E2A\u516B\u5EA6\u7EBF\u8BB0\u53F7\u4E3A\u6B62": { en: ", up to the next ottava mark" },
  "\u5927\u8C31\u8868": { en: "Grand staff" },
  "\u81EA\u52A8\u516B\u5EA6\u7EBF\uFF1A\u8FD9\u4E00\u4E32\u97F3\u8981\u4E09\u6761\u4EE5\u4E0A\u52A0\u7EBF\uFF0C\u81EA\u52A8\u753B\u4E86 {lab}\u3002\u53EA\u7BA1\u753B\u3001\u4E0D\u5B58\u8FDB\u8C31\uFF0C\u97F3\u9AD8\u4E0D\u53D8\uFF1B\u6539\u4E86\u97F3\u4F1A\u8DDF\u7740\u91CD\u7B97\u3002\u624B\u5199\u7684\u516B\u5EA6\u7EBF\u8BF4\u4E86\u7B97\u3002": { en: "Auto ottava: this run needs three or more ledger lines, so {lab} was drawn automatically. Display only, not saved in the score; pitch doesn't change, and it recalculates as notes change. Handwritten ottava lines win." },
  "\u56FA\u5B9A\u6210\u624B\u5199\u7684 {lab}\uFF08\u4E4B\u540E\u81EA\u5DF1\u6539\uFF09": { en: "Make it a handwritten {lab} (edit it yourself afterward)" },
  "\u8FD9\u4E00\u6BB5\u4E0D\u8981\u81EA\u52A8\u516B\u5EA6\u7EBF": { en: "No automatic octave lines in this section" },
  "\u8FD9\u4E00\u6BB5\u8FD9\u4E2A\u58F0\u90E8\u7684\u81EA\u52A8\u516B\u5EA6\u7EBF\u5173\u4E86\uFF08\u70B9\u8C31\u53F7\u3001\u8C31\u5934\u9762\u677F\u91CC\u80FD\u518D\u5F00\uFF09": { en: "Automatic octave lines are off for this part in this section (turn them back on by tapping the clef, in the header panel)" },
  "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A{why}": { en: "No effect (grayed out): {why}" },
  "\u5927\u8C31\u8868\u4E0A\u516B\u5EA6\u7EBF\u73B0\u5728\u4E0D\u8D77\u4F5C\u7528\uFF08\u97F3\u4E0D\u632A\uFF0C\u4E5F\u4E0D\u5370\uFF09": { en: "Octave lines have no effect on a grand staff yet (notes are not moved and the line is not printed)" },
  "\u516B\u5EA6\u7EBF\uFF1A{p}\u3002\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8\u3002": { en: "Ottava line: {p}. Display only, pitch doesn't change." },
  "\u5220\u6389\u8FD9\u6761\u516B\u5EA6\u7EBF": { en: "Delete this ottava line" },
  "Segno\uFF1AD.S. \u8DF3\u56DE\u5230\u8FD9\u513F": { en: "Segno: D.S. jumps back here" },
  "Coda\uFF1ATo Coda \u8DF3\u5230\u8FD9\u513F": { en: "Coda: To Coda jumps here" },
  "Fine\uFF1A\u8DF3\u56DE\u6765\uFF08al Fine\uFF09\u4E4B\u540E\u5728\u8FD9\u513F\u505C": { en: "Fine: after jumping back (al Fine), stop here" },
  "To Coda\uFF1A\u8DF3\u56DE\u6765\uFF08al Coda\uFF09\u4E4B\u540E\u4ECE\u8FD9\u513F\u53BB Coda": { en: "To Coda: after jumping back (al Coda), go to the Coda from here" },
  "D.C.\uFF1A\u8DF3\u56DE\u8FD9\u5F20\u7EB8\u5F00\u5934\uFF0C\u653E\u5230\u7EB8\u5C3E": { en: "D.C.: back to the start of this sheet, play to the end" },
  "D.C. al Fine\uFF1A\u8DF3\u56DE\u5F00\u5934\uFF0C\u653E\u5230 Fine": { en: "D.C. al Fine: back to the start, play to Fine" },
  "D.C. al Coda\uFF1A\u8DF3\u56DE\u5F00\u5934\uFF0C\u5230 To Coda \u53BB Coda": { en: "D.C. al Coda: back to the start, at To Coda go to the Coda" },
  "D.S.\uFF1A\u8DF3\u56DE Segno\uFF0C\u653E\u5230\u7EB8\u5C3E": { en: "D.S.: back to the Segno, play to the end" },
  "D.S. al Fine\uFF1A\u8DF3\u56DE Segno\uFF0C\u653E\u5230 Fine": { en: "D.S. al Fine: back to the Segno, play to Fine" },
  "D.S. al Coda\uFF1A\u8DF3\u56DE Segno\uFF0C\u5230 To Coda \u53BB Coda": { en: "D.S. al Coda: back to the Segno, at To Coda go to the Coda" },
  "\u623F\u5B50\uFF1A\u7B2C {nums} \u904D\u8D70\u8FD9\u4E2A\u62EC\u53F7\uFF0C\u522B\u7684\u904D\u8DF3\u8FC7": { en: "Ending: pass {nums} takes this bracket, other passes skip it" },
  "\u8FD9\u9996\u6B4C\u91CC\u6CA1\u6709\u300C{style}\u300D\u8FD9\u79CD\u98CE\u683C\u7684\u62CD\u5B50\u8868\uFF0C\u73B0\u884C\u7684\u9884\u8BBE\u91CC\u4E5F\u6CA1\u6709\uFF1A\u8FD9\u4E2A\u8BB0\u53F7\u4E0D\u8D77\u4F5C\u7528\uFF08\u4E0D\u52A0\u8F7B\u91CD\u3001\u4E0D\u6447\uFF0C\u4E0D\u62FF\u522B\u7684\u98CE\u683C\u9876\u4E0A\uFF09\u3002\u6362\u4E00\u4E2A\u98CE\u683C\u5C31\u597D": { en: "This song has no rhythm table for the style \u201C{style}\u201D, and the current presets don\u2019t have it either: this mark has no effect (no accents, no swing, nothing else stands in). Pick another style" },
  "{p} \u8FD9\u4E2A\u9884\u8BBE\u6CA1\u5217\uFF1A\u6309\u53E4\u5178\u7684\u5F3A\u5F31\u63A8{m}": { en: "This preset doesn't list {p}: inferred from classical strong and weak beats{m}" },
  "\uFF08\u51E0\u4E2A\u516B\u5206\u4E00\u7EC4\u8C31\u4E0A\u6CA1\u8BB0\uFF0C\u6309 2 + 2 + \u2026 + 3 \u63A8\uFF09": { en: " (eighth-note grouping isn't written, assumed 2 + 2 + \u2026 + 3)" },
  "{p}\uFF1A\u8FD9\u4E2A\u9884\u8BBE\u4E0D\u52A0\u8F7B\u91CD": { en: "{p}: this preset adds no beat weighting" },
  "\u6447\u6446\uFF1A\u4E00\u62CD\u91CC\u524D\u4E00\u4E2A\u516B\u5206\u5360 {p}%\uFF08\u76F4 = 50%\uFF0C\u4E09\u8FDE\u97F3\u611F \u2248 67%\uFF1B\u5E45\u5EA6\u53EA\u653E\u5927 / \u7F29\u5C0F\u6BD4\u76F4\u7684\u591A\u51FA\u6765\u7684\u90A3\u4E00\u622A\uFF0C\u5939\u5728 {p2}\u2013{p3}%\uFF09\u3002\u8FD9\u5F20\u7EB8\u4E0A\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u6447\uFF08\u5C0F\u6708\u76F8\u4E5F\u662F\uFF0C\u4E0D\u5206\u8DDF\u591A\u5C11\uFF09\uFF1B\u5199\u6210\u8FDE\u97F3\u7684\u97F3\u30016/8 \u8FD9\u7C7B\u62CD\u53F7\u4E0D\u6447": { en: "Swing: the first eighth takes {p}% of each beat (straight = 50%, triplet feel \u2248 67%; amount only scales the part above straight, clamped to {p2}\u2013{p3}%). All parts on this sheet swing together (Tsukuyomi-chan too, regardless of how much they follow); tuplets and meters like 6/8 don't swing" },
  "\u8DDF {p}%": { en: "Follows {p}%" },
  "\u4E0D\u8DDF": { en: "Doesn't follow" },
  "\u8FD9\u5F20\u7EB8\u4E0A\uFF1A{p}\uFF08\u6309\u4E50\u5668\u7C7B\u522B\uFF0C\u9884\u8BBE\u7ED9\u7684\uFF09": { en: "On this sheet: {p} (by instrument family, from the preset)" },
  "\u4E5F\u53EB {p}": { en: "Also called {p}" },
  "\u4ECE\u8FD9\u513F\u8D77\u4E0D\u52A0\u62CD\u5B50\u8F7B\u91CD": { en: "No beat weighting from here" },
  "\u4E0D\u52A0\u8F7B\u91CD": { en: "No weighting" },
  "\u5E45\u5EA6\uFF1A\u9884\u8BBE\u7684 {a} \u500D": { en: "Amount: {a} \xD7 preset" },
  "\u98CE\u683C = \u62CD\u5B50\u8F7B\u91CD\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u8D77\u5230\u8FD9\u5F20\u7EB8\u7ED3\u5C3E\uFF0C\u6BCF\u4E2A\u97F3\u6309\u5B83\u843D\u5728\u5C0F\u8282\u91CC\u7684\u54EA\u4E00\u62CD\u8F7B\u4E00\u70B9\u6216\u91CD\u4E00\u70B9\uFF08\u50CF\u9F13\u624B\u7684\u5F8B\u52A8\uFF09\uFF1B\u5199\u4E86\u91CD\u97F3 / \u5F31\u5316\u7684\u97F3\u7167\u5199\u7684\u6765\u3002": { en: "Style = beat weighting: from this note to the end of the sheet, each note gets slightly lighter or heavier depending on where it falls in the bar (like a drummer's groove); notes with written accents / unstress follow what's written." },
  "\u4E00\u8F6E\u7684\u7B2C\u4E00\u5C0F\u8282\u662F\u4E09\u51FB\u90A3\u8FB9\uFF08\u524D\u53E5\uFF09\uFF0C\u4ECE\u8FD9\u4E2A\u8BB0\u53F7\u90A3\u4E00\u5C0F\u8282\u8D77\u6570": { en: "The first bar of the cycle is the three-hit side (first phrase), counted from this mark's bar" },
  "\u9519\u5F00\u4E00\u5C0F\u8282\uFF1A\u4E24\u5C0F\u8282\u5BF9\u8C03\uFF0C\u7B2C\u4E00\u5C0F\u8282\u662F\u4E24\u51FB\u90A3\u8FB9": { en: "Offset by a bar: the two bars swap, the first bar is the two-hit side" },
  "2-3\uFF08\u9519\u5F00\u4E00\u5C0F\u8282\uFF09": { en: "2-3 (offset by a bar)" },
  "\u53BB\u6389\u8FD9\u4E2A\u98CE\u683C\u8BB0\u53F7\uFF08\u8FD9\u513F\u8D77\u56DE\u5230\u524D\u4E00\u4E2A\u98CE\u683C\uFF1B\u8FD9\u5F20\u7EB8\u5F00\u5934 = \u4E0D\u52A0\uFF09": { en: "Remove this style mark (from here it returns to the previous style; at the start of a sheet = none)" },
  "\u53EA\u7BA1\u8FD9\u5F20\u7EB8\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u5230\u8FD9\u5F20\u7EB8\u7ED3\u5C3E\uFF08\u6216\u4E0B\u4E00\u4E2A\u98CE\u683C\u8BB0\u53F7\uFF09\u3002\u957F\u6309\u62D6 = \u632A\u5230\u522B\u7684\u97F3\u4E0A": { en: "This sheet only: from this note to the end of the sheet (or the next style mark). Long-press and drag = move to another note" },
  "\u6539\u6210 {d}": { en: "Change to {d}" },
  "\u6E10\u5F3A": { en: "Crescendo" },
  "\u6E10\u5F31": { en: "Diminuendo" },
  "\u8FD9\u5F20\u7EB8\u91CC\u524D\u9762\u6CA1\u6709\u529B\u5EA6\u8BB0\u53F7\uFF0C\u6CA1\u6709\u5730\u65B9\u6E10\u8FC7\u6765": { en: "No dynamic earlier on this sheet, so there's nothing to ramp from" },
  "\u4E2D\u95F4\u6709\u624B\u5199\u7684\u6E10\u5F3A\u6E10\u5F31\uFF0C\u6309\u624B\u5199\u7684\u8D70": { en: "There's a handwritten crescendo / diminuendo in between; that wins" },
  "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u540E\u9762\u90A3\u4E2A\u97F3\u662F\u5F3A\u540E\u5373\u5F31\uFF08fp\uFF09\u2014\u2014\u97F3\u5934\u6309 f\u3001\u968F\u540E\u843D\u5230 p\uFF0C\u4E4B\u540E\u4E5F\u662F p\uFF0C\u8FD9\u4E2A {value} \u7BA1\u4E0D\u5230": { en: "No effect (grayed out): the next note is forte-piano (fp) \u2014 it attacks at f, falls to p and stays p, out of reach of this {value}" },
  "\u6E10\u5230\uFF1A\u4ECE\u8FD9\u5F20\u7EB8\u91CC\u4E0A\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u90A3\u513F\u4E00\u8DEF\u6E10\u53D8\u5230\u8FD9\u91CC\uFF08\u8C31\u4E0A\u865A\u7EBF\u53D1\u5939\uFF09\uFF1B\u5173 = \u5230\u8FD9\u513F\u7A81\u53D8": { en: "Ramp: changes gradually from the previous dynamic on this sheet to here (dashed hairpin on the score); off = changes suddenly here" },
  "{ramp}\u6E10\u5230\uFF08\u4ECE\u4E0A\u4E00\u4E2A\u529B\u5EA6\u6E10\u53D8\u8FC7\u6765\uFF09": { en: "{ramp}Ramp (gradually from the previous dynamic)" },
  "\u4E0D\u8D77\u4F5C\u7528\uFF1A": { en: "No effect:" },
  "\u548C\u65B9\u5411\u53CD\u7740\uFF1A\u7167\u65B9\u5411\u5148\u8D70\u4E00\u6863\uFF0C\u5230\u8FD9\u513F\u7A81\u53D8\u6210 {d}\uFF08\u8C31\u4E0A\u7070\u5B57\u8BF4\u660E\uFF09": { en: "Against the direction: it moves one step that way first, then jumps to {d} here (a gray note on the score says so)" },
  "\u7EC8\u70B9 = {d}": { en: "Ends at {d}" },
  "\u53D8\u5230": { en: "Goes to" },
  "\u6CA1\u5199\u7EC8\u70B9\uFF1A\u7167\u65B9\u5411\u8D70\u4E00\u6863\uFF08\u8C31\u4E0A\u7070\u5B57\uFF09": { en: "No written end: moves one step in its direction (gray note on the score)" },
  "\u8D70\u4E00\u6863": { en: "One step" },
  "\u7EC8\u70B9\u90A3\u4E2A\u529B\u5EA6\u8BB0\u53F7\u8FD8\u7BA1\u7740\u540E\u9762\u7684\u97F3\uFF1A\u8FD9\u91CC\u4E0D\u53BB\u6389\u5B83\uFF08\u8981\u6539\u5B83\u5C31\u70B9\u5B83\uFF09": { en: "The ending dynamic still governs the notes after it, so it isn't removed here (tap it to change it)" },
  "\u632A\u5230\u8FD9\u4E00\u6BB5\u6700\u540E\u4E00\u4E2A\u97F3\u540E\u9762\uFF1A\u6E10\u5F3A\u6E10\u5F31 / \u6E10\u5230\u4E00\u76F4\u8D70\u5230\u8FD9\u4E00\u6BB5\u7ED3\u675F": { en: "Move it after the last note of this section: crescendos / ramps run all the way to the end of the section" },
  "\u632A\u5230\u8FD9\u4E00\u6BB5\u7ED3\u5C3E": { en: "Move to the end of this section" },
  "\u53BB\u6389\u8FD9\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF08\u540E\u9762\u7684\u97F3\u56DE\u5230\u524D\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF09": { en: "Remove this dynamic (later notes return to the previous one)" },
  "\u53BB\u6389\u8FD9\u4E2A\u6E10\u5F3A / \u6E10\u5F31": { en: "Remove this crescendo / diminuendo" },
  "\u957F\u6309\u62D6 = \u632A\u5230\u522B\u7684\u97F3\u4E0A\uFF08\u6700\u540E\u4E00\u4E2A\u97F3\u7684\u53F3\u8FB9 = \u8FD9\u4E00\u6BB5\u7ED3\u5C3E\uFF09": { en: "Long-press and drag = move it to another note (right of the last note = the end of this section)" },
  "\u957F\u6309\u62D6 = \u632A\u5230\u522B\u7684\u97F3\u4E0A": { en: "Long-press and drag = move to another note" },
  "\u987A\u624B\u53BB\u6389\u4E86 {n} \u4E2A\u4E0D\u518D\u7BA1\u4EFB\u4F55\u97F3\u7684\u8BB0\u53F7\uFF08\u529B\u5EA6 / \u6E10\u5F3A\u6E10\u5F31 / \u8E0F\u677F\uFF1B\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": { en: "Also removed {n} marks that no longer govern any note (dynamics / hairpins / pedals; undo brings them back)" },
  "\u7EC8\u70B9\u6539\u6210\u4E86 {d}\uFF08\u53D1\u5939\u540E\u9762\u90A3\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF09": { en: "End changed to {d} (the dynamic after the hairpin)" },
  "\u5728\u4E0B\u4E00\u6761\u6E10\u5F3A\u6E10\u5F31\u524D\u9762\u653E\u4E86 {d}": { en: "Put {d} before the next hairpin" },
  "\u5728\u8FD9\u4E00\u6BB5\u6700\u540E\u4E00\u4E2A\u97F3\u540E\u9762\u653E\u4E86 {d}": { en: "Put {d} after the last note of this section" },
  "\u53BB\u6389\u4E86\u8FD9\u4E00\u6BB5\u7ED3\u5C3E\u90A3\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1A\u56DE\u5230\u8D70\u4E00\u6863": { en: "Removed the dynamic at the end of this section: back to one step" },
  "\u2039 \u8F6C\u8C03\u5230\u2026": { en: "\u2039 Change key to\u2026" },
  "\u73B0\u5728\u7684\u8C03": { en: "Current key" },
  "\u8F6C\u8C03\u2026": { en: "Change key\u2026" },
  "\u6309\u8C03\u53F7\u62FC\u5199": { en: "Spell by key signature" },
  "\u6574\u6BB5\u8F6C\u5230\u53E6\u4E00\u4E2A\u8C03\uFF1A\u97F3\u6309\u4E24\u4E2A\u4E3B\u97F3\u4E4B\u95F4\u7684\u97F3\u7A0B\u632A\uFF0C\u8C03\u53F7\u8DDF\u7740\u6362": { en: "Move the whole passage to another key: notes move by the interval between the two tonics, and the key signature changes" },
  "\u97F3\u9AD8\u4E0D\u53D8\uFF1A\u8C03\u5185\u7684\u97F3\u6362\u6210\u8C03\u53F7\u91CC\u7684\u5199\u6CD5\uFF08A\u266D \u5728\u4E94\u4E2A\u5347\u53F7\u7684\u8C03\u91CC = G\u266F\uFF09\uFF0C\u8C03\u5916\u7684\u4E0D\u52A8": { en: "Pitch stays: in-key notes use the key's spelling (A\u266D in a five-sharp key = G\u266F), out-of-key notes stay" },
  "\u65F6\u503C": { en: "Duration" },
  "\u90FD\u6539\u6210": { en: "Change all to" },
  "\u90FD\u6539\u6210\u957F\u77ED\u65CB\u94AE\u73B0\u5728\u90A3\u4E00\u6863": { en: "Change all to the current length setting" },
  "\u6E05\u6389\u8BB0\u53F7": { en: "Clear marks" },
  "\u66F2\u7EA7": { en: "Passage level" },
  "\u529B\u5EA6\u5B57\u3001\u6E10\u5F3A\u6E10\u5F31\u3001\u6E10\u5230\u3001\u98CE\u683C\uFF08\u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\u524D\u9762\u6302\u7740\u7684\u4E5F\u7B97\uFF09": { en: "Dynamics, crescendo / diminuendo, ramps, style (including those just before the first selected note)" },
  "\u97F3\u7EA7": { en: "Note level" },
  "\u6F14\u594F\u6CD5\u3001\u97F3\u5934\uFF08\u91CD\u97F3 / \u7A81\u5F3A\u2026\uFF09\u3001\u97F3\u5185\u8D77\u4F0F\u3001\u8FDE\u7EBF\u3001\u547C\u5438\u3001\u6C14\u58F0": { en: "Articulations, attacks (accent / sforzando\u2026), swells, slurs, breaths, whispers" },
  "\u90FD\u6E05": { en: "Clear all" },
  "\u66F2\u7EA7 + \u97F3\u7EA7\uFF1B\u97F3\u3001\u6B4C\u8BCD\u3001\u8C03\u53F7\u62CD\u53F7\u901F\u5EA6\u3001\u53CD\u590D\u4E0D\u52A8": { en: "Passage + note level; notes, lyrics, key / time / tempo and repeats stay" },
  "\u590D\u5236": { en: "Copy" },
  "\u526A\u5207": { en: "Cut" },
  "\u7C98\u8D34\uFF08\u66FF\u6362\u9009\u4E2D\u7684\uFF09": { en: "Paste (replaces selection)" },
  "\u9009\u4E2D\u7684\u8FD9\u4E00\u6BB5\u6CA1\u6709\u8FD9\u7C7B\u8BB0\u53F7": { en: "This selection has no marks of that kind" },
  "{why}\uFF1A\u300C{what}\u300D\u7528\u4E0D\u4E86": { en: "{why}: \u201C{what}\u201D doesn't apply" },
  "\u8FD9\u4E00\u7248\u51FA\u4E0D\u4E86\u58F0\uFF08\u522B\u7684\u8F6F\u4EF6\u539F\u6765\u7684\u4E50\u5668\uFF09": { en: "This version can't sound it (the other software's original instrument)" },
  "\u300C{name}\u300D\u4E0D\u662F\u6B4C\u91CC\u8BB0\u7684\u90A3\u4E2A\u300C{name2}\u300D\uFF08sha256 {p}\u2026 \u2260 {p2}\u2026\uFF09": { en: "\u201C{name}\u201D isn't the \u201C{name2}\u201D recorded in the song (sha256 {p}\u2026 \u2260 {p2}\u2026)" },
  "\u627E\u5230\u4E86\uFF1A\u300C{name}\u300D\u80FD\u54CD\u4E86": { en: "Found: \u201C{name}\u201D can sound now" },
  "\u54FC\u7684\u5B57": { en: "Hum syllable" },
  "\u300C{p}\u300D\u6539\u8FC7\u8FD8\u6CA1\u5B58": { en: "\u201C{p}\u201D has unsaved changes" },
  "{what}\u4F1A\u4E22\u6389\u8FD9\u4E9B\u6539\u52A8\u3002": { en: "{what} will discard these changes." },
  "\u5148\u5B58": { en: "Save first" },
  "\u4E22\u6389\uFF0C\u7EE7\u7EED": { en: "Discard and continue" },
  "\u65B0\u5EFA": { en: "New" },
  "\u65B0\u7684\u4E00\u9996": { en: "New song" },
  "\u6CA1\u6253\u5F00\uFF1A{Error}": { en: "Not opened: {Error}" },
  "\u4ECE {host} \u6253\u5F00\u4E86 {name}\uFF1A\u8FD9\u662F\u4E00\u4EFD\u62F7\u8D1D\uFF0C\u60F3\u7559\u4E0B\u6765\u5C31\u6309\u300C\u5B58\u300D\u3002": { en: "Opened {name} from {host}. This is a copy; press Save to keep it." },
  "\u6253\u5F00\u4E86 {name}": { en: "Opened {name}" },
  "\u6253\u4E0D\u5F00 {name}\uFF1A{Error}": { en: "Can't open {name}: {Error}" },
  "\u4ECE\u94FE\u63A5\u6253\u5F00\u8FD9\u9996\u6B4C\uFF1F": { en: "Open this song from a link?" },
  "\u4F1A\u4ECE {host} \u4E0B\u8F7D\u8FD9\u4E2A\u6587\u4EF6\uFF1A{url}\u3002\u8FD9\u662F\u522B\u4EBA\u653E\u5728\u7F51\u4E0A\u7684\u6587\u4EF6\uFF1B\u6253\u5F00\u7684\u662F\u4E00\u4EFD\u62F7\u8D1D\uFF0C\u60F3\u7559\u4E0B\u6765\u5C31\u6309\u300C\u5B58\u300D\u3002": { en: "This downloads the file from {host}: {url}. It is a file someone put online; you get a copy, and pressing Save keeps it." },
  "\u6253\u5F00": { en: "Open" },
  "\u6253\u5F00\u94FE\u63A5\u91CC\u7684\u6B4C": { en: "Open the song from the link" },
  "\u6B63\u5728\u4ECE {host} \u4E0B\u8F7D\u2026": { en: "Downloading from {host}\u2026" },
  "\u6B63\u5728\u4ECE {host} \u4E0B\u8F7D\u2026 {pc}%": { en: "Downloading from {host}\u2026 {pc}%" },
  "{host} \u7ED9\u7684\u662F\u4E00\u4E2A\u7F51\u9875\uFF0C\u4E0D\u662F\u6B4C\u6587\u4EF6\uFF1A\u8981\u7528\u80FD\u76F4\u63A5\u4E0B\u8F7D\u7684\u94FE\u63A5\uFF08\u7F51\u76D8\u7684\u5206\u4EAB\u9875\u591A\u534A\u8981\u6362\u6210\u300C\u4E0B\u8F7D\u300D\u90A3\u4E2A\u94FE\u63A5\uFF09\u3002": { en: "{host} sent a web page, not a song file. Use a direct download link (for a cloud drive, usually its \u201Cdownload\u201D link rather than the share page)." },
  "\u4ECE {host} \u62FF\u5230\u7684\u4E0D\u662F\u6B4C\u6587\u4EF6\uFF08.mxl / .musicxml\uFF09\u3002": { en: "What came from {host} is not a song file (.mxl / .musicxml)." },
  "\u8FD9\u9996\u6B4C\u9501\u7740\uFF0C\u6709\u6539\u52A8\u6CA1\u5B58\u3001\u4E5F\u4E0D\u4F1A\u63A8\u4E0A\u4E91\uFF1A\u6539\u52A8\u8FD8\u5728\uFF0C\u70B9\u8C31\u4E0A\u9762\u7684\u300C\u63A5\u7740\u6539\u300D\u4E4B\u540E\u518D\u5B58\u3002": { en: "This song is locked, so the changes were not saved or uploaded. They are still here: tap \u201CKeep editing\u201D above the score, then save." },
  "\u8FD8\u662F\u7A7A\u7684\uFF0C\u6CA1\u4EC0\u4E48\u53EF\u5B58": { en: "Still empty, nothing to save" },
  "\u5B58\u597D\u4E86\uFF1A{name}": { en: "Saved: {name}" },
  "\u6CA1\u5B58": { en: "Not saved" },
  "\u6CA1\u5B58\uFF08\u53D6\u6D88\u4E86\uFF09": { en: "Not saved (canceled)" },
  "\u6CA1\u5B58\u4E0A\uFF1A{Error}": { en: "Couldn't save: {Error}" },
  "\u8FD9\u51E0\u4EF6\u627E\u4E0D\u5230\u58F0\u97F3\uFF0C\u526F\u672C\u91CC\u6CA1\u5E26\uFF1A{p}\u3002\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u91CC\u300C\u627E\u6587\u4EF6\u2026\u300D\uFF0C\u518D\u5BFC\u51FA\u4E00\u6B21\u3002": { en: "No sound found for these, so the copy doesn't include them: {p}. Tap the part name at the front of the score, \u201CFind file\u2026\u201D under \u201CWho performs\u201D, and export again." },
  "\u8BB8\u53EF\u8FD9\u4E00\u4EFD\u6309\u300C\u672A\u58F0\u660E\u300D\u5199\u4E86\uFF08\u4F60\u9009\u7684\u8BB8\u53EF\u548C\u5C0F\u6708\u76F8\u7684\u6761\u6B3E\u53EF\u80FD\u51B2\u7A81\uFF1B\u4F5C\u8005\u680F\u91CC\u7684\u9009\u62E9\u6CA1\u52A8\uFF09\u3002": { en: "This copy's license was written as \u201Cnot stated\u201D (your chosen license may conflict with Tsukuyomi-chan's terms; your choice in the credits is unchanged)." },
  "\u6253\u5305\u5206\u53D1\u7684\u8BB8\u53EF\uFF08\u8FD9\u4EFD\u526F\u672C\u91CC\u5E26\u7740\u8FD9\u4E9B\u6E90\u6587\u4EF6\uFF09": { en: "Licenses for packed distribution (this copy carries these source files)" },
  "\u5B58\u4E86\u4E00\u4EFD\uFF1A{name}{fellBack}": { en: "Saved a copy: {name}{fellBack}" },
  "\uFF08\u8BB8\u53EF\u6309\u672A\u58F0\u660E\u5199\uFF09": { en: " (license written as not stated)" },
  "\u5B58\u4E00\u4EFD .mxl \u526F\u672C\uFF08\u6253\u5305\u97F3\u6E90\uFF09": { en: "Save an .mxl copy (packed sounds)" },
  "\u5B58\u4E00\u4EFD .mxl \u526F\u672C": { en: "Save an .mxl copy" },
  "{name} \xB7 {size}\u3002\u73B0\u5728\u8FD9\u9996\u6B4C\u7684\u4E00\u4EFD\u62F7\u8D1D\uFF1B\u8FD9\u91CC\u518D\u6539\uFF0C\u5B83\u4E0D\u4F1A\u8DDF\u7740\u53D8\u3002{credits}": { en: "{name} \xB7 {size}. A copy of the song as it is now; later edits here won't change it. {credits}" },
  "\u6253\u5305\u4E86 {n} \u4EF6\u58F0\u97F3": { en: "Packed {n} {n|sound|sounds}" },
  "\u6253\u5305\u4E86 {n} \u4EF6\u58F0\u97F3\u8FDB\u6B4C\uFF1A\u73B0\u5728\u6B4C\u91CC\u5E26\u7740 {size}{embedSoftLimit}\uFF0C\u53D1\u7ED9\u522B\u4EBA\u4E5F\u80FD\u54CD": { en: "Packed {n} {n|sound|sounds} into the song: it now carries {size}{embedSoftLimit}, and works when sent to others" },
  "\uFF08\u8D85\u8FC7 {embedSoftLimit}\uFF1A\u5B58 / \u540C\u6B65\u4F1A\u6162\u4E00\u70B9\uFF09": { en: " (over {embedSoftLimit}: saving / syncing gets a bit slower)" },
  "\u8FD9\u51E0\u4EF6\u627E\u4E0D\u5230\u58F0\u97F3\uFF0C\u6CA1\u6253\u5305\uFF1A{p}\u3002\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u91CC\u300C\u627E\u6587\u4EF6\u2026\u300D\u3002": { en: "No sound found for these, so they weren't packed: {p}. Tap the part name at the front of the score, \u201CFind file\u2026\u201D under \u201CWho performs\u201D." },
  "\u6CA1\u6709\u8981\u6253\u5305\u7684\uFF08\u5C0F\u6708\u76F8 / \u5143\u97F3\u7248\u4E0D\u6253\u5305\uFF1A\u5B83\u4EEC\u662F\u6A21\u578B\u5305\uFF0C\u6B4C\u91CC\u53EA\u9489\u54C8\u5E0C\uFF09": { en: "Nothing to pack (Tsukuyomi-chan / vowel versions aren't packed: they're model packs, the song only pins a hash)" },
  "\u6B4C\u91CC\u6CA1\u6709\u6253\u5305\u7740\u7684\u58F0\u97F3": { en: "The song has no packed sounds" },
  "\u89E3\u5305\u4E86 {size} \u4EF6\u58F0\u97F3": { en: "Unpacked {size} {size|sound|sounds}" },
  "\u89E3\u5305\u4E86 {size} \u4EF6\uFF1A\u6B4C\u91CC\u53EA\u8BB0\u6765\u6E90\uFF08\u5C0F\u4E86 {n}\uFF09\uFF1B\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7559\u7740\uFF0C\u7167\u6837\u80FD\u54CD\u3002\u522B\u7684\u8BBE\u5907\u4E0A\u4ECE\u5BB6\u65CF\u97F3\u6E90\u5E93\u6216\u539F\u6587\u4EF6\u627E": { en: "Unpacked {size}: the song only records sources now ({n} smaller); kept on this device, so it still sounds. Other devices find it from the family sound library or the original file" },
  "\u8FD9\u51E0\u4EF6\u6CA1\u89E3\u5305\uFF1A{p}\u2014\u2014\u8FD9\u53F0\u8BBE\u5907\u7559\u4E0D\u4F4F\u5B83\u7684\u58F0\u97F3\uFF08\u7A7A\u95F4\u4E0D\u591F\uFF0C\u6216\u6D4F\u89C8\u5668\u4E0D\u8BA9\u5B58\uFF09\uFF0C\u5BB6\u65CF\u97F3\u6E90\u5E93\u91CC\u4E5F\u6CA1\u6709\uFF0C\u89E3\u4E86\u5C31\u627E\u4E0D\u56DE\u6765\u3002": { en: "These weren't unpacked: {p} \u2014 this device can't keep the sound (out of space, or the browser doesn't allow it) and it's not in the family sound library, so it couldn't be recovered." },
  "\u590D\u5236\u4E0B\u6765\u8D34\u8FDB\u4F5C\u54C1\u8BF4\u660E": { en: "Copy this and paste it into your work's description" },
  "\u590D\u5236\u7F72\u540D": { en: "Copy credits" },
  "\u7F72\u540D\u590D\u5236\u597D\u4E86": { en: "Credits copied" },
  "\u590D\u5236\u4E0D\u4E86\uFF08\u6D4F\u89C8\u5668\u4E0D\u8BA9\uFF09\uFF1A\u957F\u6309\u4E0A\u9762\u7684\u5B57\u81EA\u5DF1\u9009": { en: "Can't copy (the browser won't allow it): long-press the text above to select it" },
  "\u6E32\u4E00\u904D\uFF0C\u7F16\u6210 mp3\uFF0C\u5206\u4EAB\u6216\u4E0B\u8F7D\uFF1B\u6E32\u597D\u7684\u90A3\u4EFD\u8BB0\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u5E93\u91CC\u8FD9\u9996\u6B4C\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C": { en: "Render once into an mp3 to share or download. The render is remembered on this device, so you can play it straight from this song\u2019s cover in the library" },
  "\u6B4C\u58F0\uFF08mp3\uFF09\u2026": { en: "MP3\u2026" },
  "\u5370\u51FA\u6765\u7684\u8C31\uFF08\u6309\u8FD9\u9996\u6B4C\u7684\u7EB8\u5F20\u5206\u9875\uFF1B\u6B4C\u8BCD\u7528\u5D4C\u8FDB\u53BB\u7684\u5B57\u4F53\uFF0C\u80FD\u9009\u4E2D\u590D\u5236\uFF09": { en: "A printed score (paged by this song's paper; lyrics use an embedded font and can be selected and copied)" },
  "\u4E50\u8C31\uFF08PDF\uFF09\u2026": { en: "Score (PDF)\u2026" },
  "\u73B0\u5728\u8FD9\u9996\u6B4C\u7684\u4E00\u4EFD\u62F7\u8D1D\uFF08\u6587\u4EF6\u540D\u5E26\u65F6\u523B\uFF09\uFF1B\u8FD9\u91CC\u7684\u6B4C\u8FD8\u4F4F\u539F\u6765\u7684\u5BB6": { en: "A copy of the song as it is now (timestamped file name); the song here stays in its home" },
  "\u5B58\u4E00\u4EFD .mxl \u526F\u672C\u2026": { en: "Save an .mxl copy\u2026" },
  "\u526F\u672C\u91CC\u628A\u4E50\u5668\u7684\u58F0\u97F3\u4E5F\u88C5\u8FDB\u53BB\uFF08\u53D1\u7ED9\u522B\u4EBA\u4E5F\u80FD\u54CD\uFF09\uFF1B\u8FD9\u91CC\u7684\u6B4C\u7167\u65E7\u53EA\u8BB0\u6765\u6E90": { en: "The copy also carries the instruments' sounds (works when sent to others); the song here still only records sources" },
  "\u5B58\u4E00\u4EFD .mxl \u526F\u672C\uFF08\u6253\u5305\u97F3\u6E90\uFF09\u2026": { en: "Save an .mxl copy (packed sounds)\u2026" },
  "\u5BFC\u51FA = \u5BC4\u4E00\u4EFD\u51FA\u53BB\uFF0C\u8FD9\u91CC\u7684\u6B4C\u8FD8\u662F\u539F\u6765\u90A3\u4E2A\u5BB6\uFF0C\u300C\u5B58\u300D\u624D\u662F\u5B58\u56DE\u53BB\u3002": { en: "Export = send out a copy; the song here keeps its home, and \u201CSave\u201D is what saves back." },
  "\u4E50\u8C31\uFF08PDF\uFF09": { en: "Score (PDF)" },
  "\u5370\u54EA\u4E9B": { en: "What to print" },
  "\u6BCF\u5F20\u7EB8\u6309\u987A\u5E8F\u63A5\u7740\u6392\uFF08= \u5206\u9875 + \u300C\u5168\u90E8\u300D\uFF09": { en: "Each sheet in order (= paged + \u201CAll\u201D)" },
  "\u8FD9\u4E00\u6BB5\u300C{p}\u300D": { en: "This section \u201C{p}\u201D" },
  "\u8FD9\u5F20\u7EB8": { en: "This sheet" },
  "\u53EA\u5370\u5149\u6807\u6240\u5728\u7684\u8FD9\u5F20\u7EB8\uFF08= \u5206\u9875 + \u300C\u672C\u6BB5\u300D\uFF09": { en: "Print only the sheet with the cursor (= paged + \u201CThis section\u201D)" },
  "\u58F0\u90E8": { en: "Parts" },
  "\u7167\u5206\u9875\u9884\u89C8": { en: "As in the paged preview" },
  "\u9690\u85CF\u7684\u58F0\u90E8\u4E0D\u5370\uFF0C\u9884\u89C8\u91CC\u90A3\u6761\u7EC6\u884C\u7684\u4F4D\u7F6E\u7A7A\u7740\uFF08\u548C\u9884\u89C8\u4E00\u6837\uFF09": { en: "Hidden parts aren't printed; their thin line's spot stays blank (same as the preview)" },
  "\u53EA\u6392\u770B\u5F97\u89C1\u7684\uFF1A{p}": { en: "Only visible parts: {p}" },
  "\u9690\u85CF\u7684\u58F0\u90E8\u6574\u4E2A\u62FF\u6389\u3001\u91CD\u65B0\u6392\uFF0C\u4E0D\u7559\u7A7A\u4F4D\uFF08\u50CF\u62BD\u51FA\u6765\u7684\u5206\u8C31\uFF1B\u548C\u5206\u9875\u9884\u89C8\u4E0D\u4E00\u6837\uFF09": { en: "Hidden parts are removed and it's re-laid out with no gaps (like an extracted part; differs from the paged preview)" },
  "\u8C31\u4E0A\u7684\u5B57\u7528": { en: "Score text in" },
  "\u7B2C\u4E00\u6B21\u8981\u4E0B\u8F7D\u5B57\u4F53\uFF08\u601D\u6E90\u9ED1\u4F53\uFF0C\u7EA6 {p} MB\uFF09\uFF0C\u4E4B\u540E\u79BB\u7EBF\u4E5F\u80FD\u7528\u3002\u7EB8\u5F20 = \u8FD9\u9996\u6B4C\u7684\u7EB8\uFF08\u9875\u9762\u8BBE\u7F6E\u91CC\u6539\uFF09\u3002": { en: "The font (Source Han Sans) downloads the first time (about {p} MB), then works offline. Paper = this song's paper (change it in Page settings)." },
  "\u53EA\u6392\u770B\u5F97\u89C1\u7684\u58F0\u90E8\uFF08{p}\uFF09\uFF1A\u91CD\u65B0\u6392\u3001\u4E0D\u7559\u7A7A\u4F4D\u2014\u2014\u548C\u5206\u9875\u9884\u89C8\u4E0D\u4E00\u6837\u3002": { en: "Only visible parts ({p}): re-laid out with no gaps \u2014 differs from the paged preview." },
  "\u5370\u51FA\u6765\u7684 = \u9875\u9762\u8BBE\u7F6E\u91CC\u300C\u5206\u9875\u300D+ \u66F2\u6BB5\u63A7\u4EF6\u300C{p}\u300D\u770B\u5230\u7684\u6837\u5B50\uFF0C\u53BB\u6389\u6309\u94AE\u548C\u63D0\u793A\uFF1B\u9690\u85CF\u7684{p2}\u58F0\u90E8\u4E0D\u5370\uFF08\u9884\u89C8\u91CC\u90A3\u6761\u7EC6\u884C\u7684\u4F4D\u7F6E\u7A7A\u7740\uFF09\u3002": { en: "Printed = what you see with \u201CPaged\u201D in Page settings + \u201C{p}\u201D on the section control, minus buttons and hints; hidden {p2}parts aren't printed (their thin line's spot stays blank)." },
  "\u672C\u6BB5": { en: "This section" },
  "\u5168\u90E8": { en: "All" },
  "\u7EB8 / ": { en: "sheets /" },
  "\u7167\u8FD9\u9996\u6B4C\u9875\u9762\u8BBE\u7F6E\u300C\u770B\u8C31\u300D\u9875\u7684\u8BBE\u7F6E\u5370\uFF1A{w}\uFF08\u5728\u90A3\u513F\u6539\uFF09\u3002": { en: "Printed with this song's Page settings \u203A Reading: {w} (change them there)." },
  "\u6309 C \u8C03\u770B\uFF08\u6BCF\u4E2A\u8C03\u53F7\u4E0A\u65B9\u5370\u300C1=\u539F\u6765\u7684\u8C03\u300D\uFF09": { en: "read in C (\u201C1=original key\u201D above each key signature)" },
  "\u548C\u5F26\u7EA7\u6570": { en: "chord degrees" },
  "\u4E0D\u5370\u6F14\u594F\u6CD5\u548C\u8868\u60C5": { en: "without articulations & dynamics" },
  "\u751F\u6210 PDF": { en: "Create PDF" },
  "\u4E0B\u8F7D\u5B57\u4F53\uFF08\u7B2C\u4E00\u6B21\u7EA6 {p} MB\uFF09\u2026": { en: "Downloading font (about {p} MB the first time)\u2026" },
  "\u6392\u7248\u2026": { en: "Laying out\u2026" },
  "\u8FD9\u4E9B\u5B57\u8FD9\u6B3E\u5B57\u4F53\u91CC\u6CA1\u6709\uFF0CPDF \u91CC\u662F\u7A7A\u767D\uFF1A{p}{p2}": { en: "This font doesn't have these characters, so they're blank in the PDF: {p}{p2}" },
  "\u6709 {n} \u79CD\u8BB0\u8C31\u7B26\u53F7\u6CA1\u753B\u51FA\u6765\uFF08{p}\uFF09\u2014\u2014\u8FD9\u662F app \u7684\u6BDB\u75C5\uFF0C\u8BF7\u544A\u8BC9\u6211\u4EEC\u3002": { en: "{n} notation symbols weren't drawn ({p}) \u2014 that's a bug in the app, please tell us." },
  "\u4E50\u8C31 PDF \u597D\u4E86": { en: "Score PDF is ready" },
  "{pages} \u9875 \xB7 {p} \xB7 {e6}{miss}{missM}": { en: "{pages} {pages|page|pages} \xB7 {p} \xB7 {e6}{miss}{missM}" },
  "\u9ED1\u4F53": { en: "Sans" },
  "PDF \u751F\u6210\u5931\u8D25\uFF1A{Error}": { en: "PDF creation failed: {Error}" },
  "\u4E50\u5668\u7684\u58F0\u97F3": { en: "Instrument sounds" },
  "{n} \u4EF6\uFF1A\u6253\u5305\u5728\u6B4C\u91CC {n2} \u4EF6{length}\uFF0C\u53EA\u8BB0\u6765\u6E90 {n3} \u4EF6\u3002\u6253\u5305 = \u58F0\u97F3\u8DDF\u7740\u6B4C\u8D70\uFF08\u53D1\u7ED9\u522B\u4EBA\u4E5F\u80FD\u54CD\uFF0C\u6587\u4EF6\u53D8\u5927\uFF09\uFF1B\u53EA\u8BB0\u6765\u6E90 = \u6B4C\u5C0F\uFF0C\u58F0\u97F3\u4ECE\u8FD9\u53F0\u8BBE\u5907 / \u5BB6\u65CF\u97F3\u6E90\u5E93 / \u4F60\u7684\u6587\u4EF6\u91CC\u627E\u3002\u5C0F\u6708\u76F8\u4E0D\u6253\u5305\uFF08\u5979\u662F\u6A21\u578B\u5305\uFF0C\u6B4C\u91CC\u53EA\u9489\u54C8\u5E0C\uFF09\u3002": { en: "{n} items: {n2} packed in the song{length}, {n3} source-only. Packed = the sound travels with the song (works when sent to others, bigger file); source-only = small song, the sound is found on this device / in the family sound library / in your files. Tsukuyomi-chan isn't packed (she's a model pack, the song only pins a hash)." },
  "\u5168\u90E8\u6253\u5305\u8FDB\u6B4C": { en: "Pack everything into the song" },
  "\u5168\u90E8\u89E3\u5305\uFF08\u53EA\u8BB0\u6765\u6E90\uFF09": { en: "Unpack everything (source only)" },
  "\u6253\u5305\u5206\u53D1\u7684\u8BB8\u53EF\uFF08\u6587\u4EF6\u91CC\u5E26\u7740\u8FD9\u4E9B\u6E90\u6587\u4EF6\uFF09": { en: "Licenses for packed distribution (the file carries these source files)" },
  "\u5728\u6B4C\u5E93\u91CC\uFF08\u6587\u4EF6\u5939\u300C{label}\u300D\uFF09\uFF0C\u81EA\u52A8\u5B58\uFF1B\u6362\u6B4C / \u9000\u51FA / \u6309\u300C\u5B58\u300D\u65F6\u5199\u8FDB\u6587\u4EF6\u5939": { en: "In the library (folder \u201C{label}\u201D), autosaved; written to the folder when switching songs / leaving / pressing Save" },
  "\u5728\u6B4C\u5E93\u91CC\uFF0C\u81EA\u52A8\u5B58{p}": { en: "In the library, autosaved{p}" },
  "\uFF1B\u6362\u6B4C / \u9000\u51FA / \u6309\u300C\u5B58\u300D\u65F6\u63A8\u4E0A OneDrive": { en: "; uploaded to OneDrive when switching songs / leaving / pressing Save" },
  "\uFF08\u6CA1\u767B\u5F55\uFF0C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF09": { en: " (not signed in, only on this device)" },
  "\uFF08\u53EA\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\uFF1B\u7F51\u76D8\u5728\u5B98\u7F51\u7248\uFF09": { en: " (only in this browser; OneDrive is on the official site)" },
  "\u5B58\u5728\u672C\u673A\u6587\u4EF6 {name}\uFF0C\u300C\u5B58\u300D= \u5B58\u56DE\u53BB": { en: "Stored in local file {name}; \u201CSave\u201D saves back to it" },
  "\u65B0\u7684\u4E00\u9996\uFF1A\u7B2C\u4E00\u7B14\u5199\u4E0B\u53BB\u5C31\u8FDB\u6B4C\u5E93": { en: "New song: joins the library with the first thing you write" },
  "\u8FD8\u6CA1\u5B58\u8FC7\uFF1A\u300C\u5B58\u300D\u4F1A\u95EE\u5B58\u5230\u54EA": { en: "Not saved yet: \u201CSave\u201D will ask where" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u300C\u5B58\u300D= \u4E0B\u8F7D\u6216\u5206\u4EAB\u4E00\u4E2A .mxl": { en: "On this device \u201CSave\u201D = download or share an .mxl" },
  "\u6253\u5F00\u672C\u673A\u6587\u4EF6\u2026": { en: "Open local file\u2026" },
  "\u6253\u5F00 .mxl / .musicxml\uFF08\u62D6\u8FDB\u6765\u4E5F\u884C\uFF1BCtrl / \u2318+O\uFF09": { en: "Open .mxl / .musicxml (or drag it in; Ctrl / \u2318+O)" },
  "\u5BFC\u51FA\u2026": { en: "Export\u2026" },
  "mp3\u3001.mxl \u526F\u672C\uFF08\u6253\u5305\u97F3\u6E90\uFF09\u2026\uFF08Ctrl / \u2318+Shift+S\uFF09": { en: "mp3, .mxl copy (packed sounds)\u2026 (Ctrl / \u2318+Shift+S)" },
  "\u6E32\u67D3\u5230\u7F13\u5B58": { en: "Render to cache" },
  "\u6E32\u4E00\u904D\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF08\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF09\uFF1A\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF1B\u4E0D\u5BFC\u51FA\u6587\u4EF6": { en: "Renders this song into the render cache (this device only) so you can play it from its cover in the library; no file is exported" },
  "\u5B58\u8FDB\u6B4C\u5E93": { en: "Save to library" },
  "\u628A\u8FD9\u9996\u6B4C\u653E\u8FDB\u6B4C\u5E93\uFF08\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7559\u4E00\u4EFD\uFF1B\u767B\u5F55\u540E\u540C\u6B65\u5230 OneDrive\uFF09": { en: "Put this song in the library (a copy stays on this device; syncs to OneDrive after signing in)" },
  "\u628A\u8FD9\u9996\u6B4C\u653E\u8FDB\u6B4C\u5E93\uFF08\u53EA\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\u7559\u4E00\u4EFD\uFF1B\u7F51\u76D8\u5728\u5B98\u7F51\u7248\uFF09": { en: "Put this song in the library (a copy stays only in this browser; OneDrive is on the official site)" },
  "\u9501\u4E0A\uFF08\u5148\u4E0D\u6539\u4E86\uFF09": { en: "Lock (done editing for now)" },
  "\u5148\u628A\u6539\u52A8\u5B58\u597D\uFF0C\u518D\u628A\u8FD9\u9996\u6B4C\u9501\u4E0A\uFF1A\u4E4B\u540E\u6253\u5F00\u662F\u53EA\u80FD\u770B\u3001\u80FD\u542C\u7684\uFF0C\u70B9\u300C\u63A5\u7740\u6539\u300D\u968F\u65F6\u89E3\u5F00": { en: "Saves your changes, then locks this song: it opens view-and-listen only until you tap \u201CKeep editing\u201D" },
  "\u6536\u8D77\u53C2\u8003\u7A97": { en: "Hide reference window" },
  "\u53C2\u8003\u7A97{p}": { en: "Reference window{p}" },
  "\uFF08{p} \u5F20\uFF09": { en: " ({p} {p|item|items})" },
  "\u622A\u56FE / \u6587\u5B57\u653E\u5728\u65C1\u8FB9\u5BF9\u7740\u770B\uFF1A\u70B9\u5F00\u540E\u7C98\u8D34\uFF08Ctrl / \u2318+V\uFF09\u3001\u62D6\u8FDB\u6765\uFF0C\u6216\u8005\u300C\uFF0B\u300D\u5BFC\u5165\uFF1B\u8DDF\u7740\u6B4C\u4E00\u8D77\u5B58": { en: "Keep screenshots / text beside you to refer to: open it, then paste (Ctrl / \u2318+V), drag in, or import with \u201C\uFF0B\u201D; saved with the song" },
  "\u8BBE\u7F6E\u2026": { en: "Settings\u2026" },
  "\u6A21\u578B / \u97F3\u6E90\u5E93\u6765\u6E90\u3001\u7F13\u5B58\u3001\u7F72\u540D\u4E0E\u6761\u6B3E\u3001\u8BCA\u65AD\u65E5\u5FD7\u3001\u7248\u672C": { en: "Model / sound library sources, cache, credits and terms, diagnostic log, version" },
  "\u6CA1\u9501\u4E0A\uFF1A\u6539\u52A8\u8FD8\u6CA1\u5B58\u597D\uFF08\u518D\u8BD5\u4E00\u6B21\uFF09\u3002": { en: "Not locked: the changes are not saved yet (try again)." },
  "\u6CA1\u9501\u4E0A\uFF1A\u6539\u52A8\u6CA1\u6709\u5199\u56DE\u6587\u4EF6\u3002": { en: "Not locked: the changes were not written back to the file." },
  "\u9501\u4E0A\u4E86\u3002\u8981\u6539\uFF0C\u70B9\u8C31\u4E0A\u9762\u7684\u300C\u63A5\u7740\u6539\u300D\u3002": { en: "Locked. To edit, tap \u201CKeep editing\u201D above the score." },
  "\u6CA1\u9501\u4E0A\uFF1A{Error}": { en: "Not locked: {Error}" },
  "\u6539\u6587\u4EF6\u540D": { en: "Rename file" },
  "\u53EA\u6539\u6587\u4EF6\u540D\uFF0C\u7EB8\u4E0A\u7684\u6B4C\u540D\u4E0D\u53D8\u3002\u4E0B\u6B21\u5B58\u7684\u65F6\u5019\u7528\u8FD9\u4E2A\u540D\u5B57\u3002": { en: "Only the file name changes, not the title on the sheet. The next save uses this name." },
  "\u6539": { en: "Rename" },
  "\u6587\u4EF6\u540D\u6539\u6210 {stem}{SONG_SUFFIX}": { en: "File renamed to {stem}{SONG_SUFFIX}" },
  "\u6253\u5F00\u300C{name}\u300D": { en: "Opened \u201C{name}\u201D" },
  "\u6253\u5F00\u300C{id}\u300D": { en: "Opening \u201C{id}\u201D" },
  "\u6253\u4E0D\u5F00\u300C{id}\u300D\uFF1A\u8FD9\u53F0\u8BBE\u5907\u4E0A\u6CA1\u6709\u5B83\u7684\u5B57\u8282\uFF08\u79BB\u7EBF\u3001\u6216\u8FD8\u6CA1\u4ECE\u4E91\u7AEF\u62C9\u4E0B\u6765\uFF09": { en: "Can't open \u201C{id}\u201D: its bytes aren't on this device (offline, or not pulled from the cloud yet)" },
  "\u65B0\u7684\u4E00\u9996\uFF08\u7B2C\u4E00\u7B14\u5199\u4E0B\u53BB\u5C31\u8FDB\u6B4C\u5E93\uFF09": { en: "New song (joins the library with the first thing you write)" },
  "\u8FD8\u662F\u7A7A\u7684\uFF1A\u5199\u4E0B\u7B2C\u4E00\u7B14\u5C31\u81EA\u52A8\u8FDB\u6B4C\u5E93": { en: "Still empty: joins the library automatically with the first thing you write" },
  "\u8FDB\u6B4C\u5E93\u4E86\uFF1A{stem}{SONG_SUFFIX}": { en: "In the library: {stem}{SONG_SUFFIX}" },
  "\u53EA\u6539\u6587\u4EF6\u540D\uFF0C\u7EB8\u4E0A\u7684\u6B4C\u540D\u4E0D\u53D8\u3002": { en: "Only the file name changes, not the title on the sheet." },
  "\u300C{v}\u300D\u5DF2\u7ECF\u6709\u4E86\uFF08{p}\uFF09\uFF0C\u6CA1\u6539": { en: "\u201C{v}\u201D already exists ({p}), not renamed" },
  "\u4E91\u7AEF": { en: "in the cloud" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A": { en: "on this device" },
  "\u8FD9\u6B21\u6CA1\u52A8": { en: "Nothing changed this time" },
  "\u6587\u4EF6\u540D\u6539\u6210 {stem}{SONG_SUFFIX}\uFF1B\u7167\u4F60\u7684\u610F\u601D\uFF0C\u4E91\u7AEF\u65E7\u540D\u90A3\u4EFD\u7559\u7740\u6CA1\u52A8": { en: "File renamed to {stem}{SONG_SUFFIX}; as you chose, the copy under the old name in the cloud stays untouched" },
  "\u6587\u4EF6\u540D\u6539\u6210 {stem}{SONG_SUFFIX}\uFF08\u65E7\u540D\u7684\u90A3\u4EFD\u8C31\u7CFB\u4E0D\u660E\uFF0C\u4E91\u7AEF\u539F\u5730\u7559\u7740\u4E86\u2014\u2014\u6B4C\u5E93\u91CC\u8FD8\u770B\u5F97\u89C1\uFF09": { en: "File renamed to {stem}{SONG_SUFFIX} (the copy under the old name has an unknown history, so it stays in the cloud \u2014 still visible in the library)" },
  "\u8FD9\u4E2A\u90E8\u7F72\u65B9\u5F0F\u6CA1\u6709\u6B4C\u5E93\uFF08itch\uFF1A\u6B4C\u53EA\u7528\u6587\u4EF6\u5B58\uFF09": { en: "This deployment has no library (itch: songs only use files)" },
  "\u8FD9\u4E2A\u90E8\u7F72\u65B9\u5F0F\u6CA1\u6709\u7F51\u76D8\uFF08\u5907\u7528\u7248\uFF1A\u6B4C\u5E93\u7684\u5BB6\u53EA\u80FD\u662F\u6587\u4EF6\u5939\uFF09": { en: "This deployment has no OneDrive (standalone version: the library's home can only be a folder)" },
  "\u300C{stem}\u300D\u5DF2\u7ECF\u8FDB\u4E86\u56DE\u6536\u7AD9\uFF1B\u624B\u91CC\u8FD9\u4EFD\u73B0\u5728\u6CA1\u6709\u5BB6\u4E86\uFF08\u300C\u5B58\u300D\u4F1A\u95EE\u5B58\u5230\u54EA\uFF0C\u6216\u300C\u5B58\u8FDB\u6B4C\u5E93\u300D\uFF09\u3002": { en: "\u201C{stem}\u201D is now in the trash; the copy in hand has no home now (\u201CSave\u201D will ask where, or \u201CSave to library\u201D)." },
  "\u8FDB\u6B4C\u5E93": { en: "Save to library" },
  "\u6B4C\u5E93\u8981\u5148\u6709\u4E2A\u5BB6": { en: "The library needs a home first" },
  "\u6B4C\u653E\u5728\u6D4F\u89C8\u5668\u5916\u9762\u3001\u4F60\u81EA\u5DF1\u591F\u5F97\u7740\u7684\u5730\u65B9\uFF0C\u624D\u4E0D\u6015\u6D4F\u89C8\u5668\u6E05\u7F13\u5B58\u3002{cloud}{folder}\u4E0D\u60F3\u9009\u4E5F\u884C\uFF1A\u300C\u5B58\u300D= \u5B58\u6210\u6587\u4EF6\uFF0C\u300C\u6253\u5F00\u300D= \u9009\u6587\u4EF6\u3002": { en: "Keep songs outside the browser, somewhere you can reach, so clearing browser data can't hurt them. {cloud}{folder}You can skip this too: \u201CSave\u201D = save as a file, \u201COpen\u201D = choose a file." },
  "\u7F51\u76D8\u5728\u5B98\u7F51\u7248\u91CC\uFF08{SITE_HOST}\uFF09\u3002": { en: "OneDrive is on the official site ({SITE_HOST})." },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u9009\u4E0D\u4E86\u6587\u4EF6\u5939\uFF08\u684C\u9762\u7248 Chrome / Edge \u53EF\u4EE5\uFF09\u3002": { en: "This browser can't choose folders (desktop Chrome / Edge can)." },
  "\u8FDE\u63A5\u7F51\u76D8\uFF08OneDrive\uFF09": { en: "Connect OneDrive" },
  "\u9009\u4E00\u4E2A\u6587\u4EF6\u5939": { en: "Choose a folder" },
  "\u6362\u5230\u6587\u4EF6\u5939": { en: "Switch to a folder" },
  "\u6CA1\u62FF\u5230\u300C{label}\u300D\u7684\u6743\u9650\uFF1A\u6539\u52A8\u8FD8\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u4E00\u9996\u6CA1\u4E22\u3002": { en: "Didn't get permission for \u201C{label}\u201D: changes are still on this device, no songs lost." },
  "\u6587\u4EF6\u5939\u300C{label}\u300D\u7684\u6743\u9650\u6389\u4E86\uFF1A\u6539\u52A8\u5148\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u4E00\u9996\u6CA1\u4E22": { en: "Permission for folder \u201C{label}\u201D was lost: changes are saved on this device for now, no songs lost" },
  "\u91CD\u65B0\u6388\u6743": { en: "Re-authorize" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\u8FD8\u6709 {legacyLeft} \u9996\u65E7\u6B4C\uFF0C\u6CA1\u642C\u8FDB\u300C{label}\u300D": { en: "This browser still has {legacyLeft} old {legacyLeft|song|songs} not moved into \u201C{label}\u201D" },
  "\u642C\u8FDB\u6765": { en: "Move them in" },
  "\u5168\u90E8\u5BFC\u51FA": { en: "Export all" },
  "\u8FD9\u4E9B\u6B4C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u7684\u6D4F\u89C8\u5668\u91CC\uFF0C\u6CA1\u6709\u5907\u4EFD": { en: "These songs exist only in this device's browser, with no backup" },
  "\u642C\u8FDB\u4E00\u4E2A\u6587\u4EF6\u5939": { en: "Move into a folder" },
  "\u8FDE\u63A5\u7F51\u76D8": { en: "Connect OneDrive" },
  "\u6B4C\u5E93\u5728\u6587\u4EF6\u5939\u300C{label}\u300D": { en: "Library is in folder \u201C{label}\u201D" },
  "\u6B4C\u5C31\u662F\u8FD9\u4E2A\u6587\u4EF6\u5939\u91CC\u7684 .mxl\uFF0C\u8D44\u6E90\u7BA1\u7406\u5668\u91CC\u4E5F\u770B\u5F97\u5230\uFF1B\u56DE\u6536\u7AD9 / \u5907\u4EFD\u7BB1\u662F\u91CC\u9762\u7684 .trash / .backup\u3002{lost}": { en: "Songs are the .mxl files in this folder, visible in your file manager too; the trash / backup are .trash / .backup inside it. {lost}" },
  "\n\u73B0\u5728\u6743\u9650\u6389\u4E86\uFF1A\u6539\u52A8\u5148\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3002": { en: "\nPermission is lost now: changes are saved on this device for now." },
  "\u4E0D\u7528\u8FD9\u4E2A\u6587\u4EF6\u5939\u4E86\u2026": { en: "Stop using this folder\u2026" },
  "\u5939\u91CC\u7684\u6B4C\u4E00\u9996\u4E0D\u52A8\uFF1B\u4E4B\u540E\u53EF\u4EE5\u518D\u9009\u4E00\u4E2A\u5BB6": { en: "Songs in the folder stay untouched; you can choose another home later" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\u6709 {n} \u9996\u6B4C": { en: "This browser has {n} {n|song|songs}" },
  "\u5B83\u4EEC\u53EA\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\uFF0C\u6E05\u7F13\u5B58\u5C31\u6CA1\u4E86\u3002{f}\u7A0D\u540E\u4E5F\u884C\uFF1A\u6B4C\u5E93\u9876\u4E0A\u90A3\u6761\u8FD8\u5728\u3002": { en: "They exist only in this browser and vanish if it's cleared. {f}Later is fine too: the bar at the top of the library stays." },
  "\u642C\u8FDB\u300C{label}\u300D\uFF1A\u9010\u9996\u6838\u5BF9\u5B57\u8282\uFF0C\u4E00\u6A21\u4E00\u6837\u624D\u4ECE\u6D4F\u89C8\u5668\u79FB\u8D70\u3002": { en: "Move into \u201C{label}\u201D: bytes are checked song by song, and removed from the browser only if identical." },
  "\u9009\u4E00\u4E2A\u5BB6\u642C\u8FC7\u53BB\uFF1B\u6216\u8005\u5148\u5168\u90E8\u5BFC\u51FA\u6210\u6587\u4EF6\u3002": { en: "Choose a home to move them to, or export everything as files first." },
  "\u642C\u8FDB\u300C{label}\u300D": { en: "Move into \u201C{label}\u201D" },
  "\u9009\u4E00\u4E2A\u6587\u4EF6\u5939\uFF0C\u642C\u8FDB\u53BB": { en: "Choose a folder and move in" },
  "\u7A0D\u540E": { en: "Later" },
  "\u6B63\u5728\u628A\u6B4C\u642C\u8FDB\u300C{label}\u300D\u2026": { en: "Moving songs into \u201C{label}\u201D\u2026" },
  "\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939": { en: "Not written to the folder" },
  "\u65E7\u5E93\u6CA1\u79FB\u8D70\uFF08{status}\uFF09": { en: "Old library copy not removed ({status})" },
  "\u6B63\u5728\u642C\u6B4C {done} / {total}\u2026": { en: "Moving songs {done} / {total}\u2026" },
  "\u642C\u5BB6\u6CA1\u6210\uFF1A{Error}\u3002\u6D4F\u89C8\u5668\u91CC\u7684\u6B4C\u4E00\u9996\u6CA1\u52A8\u3002": { en: "Move failed: {Error}. No songs in the browser were touched." },
  "\u4E91\u7AEF\uFF08OneDrive\uFF09": { en: "Cloud (OneDrive)" },
  "\u5DF2\u767B\u5F55{who}\u3002\u6B4C\u5E93\u540C\u6B65\u5230 OneDrive \u7684\u300C\u5E94\u7528\u300D\u6587\u4EF6\u5939\uFF08\u8FD9\u4E2A app \u53EA\u80FD\u770B\u81EA\u5DF1\u7684\u90A3\u4E2A\u5939\uFF0C\u770B\u4E0D\u5230\u4F60\u522B\u7684\u6587\u4EF6\uFF09\u3002": { en: "Signed in{who}. The library syncs to OneDrive's Apps folder (this app can only see its own folder, none of your other files)." },
  "\u767B\u5F55\u5FAE\u8F6F\u4E2A\u4EBA\u8D26\u53F7\u540E\uFF0C\u6B4C\u5E93\u540C\u6B65\u5230 OneDrive \u7684\u300C\u5E94\u7528\u300D\u6587\u4EF6\u5939\uFF08\u8FD9\u4E2A app \u53EA\u80FD\u770B\u81EA\u5DF1\u7684\u90A3\u4E2A\u5939\uFF0C\u770B\u4E0D\u5230\u4F60\u522B\u7684\u6587\u4EF6\uFF09\u3002\u4E0D\u767B\u5F55\u4E5F\u80FD\u7528\uFF0C\u6B4C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3002": { en: "After signing in with a personal Microsoft account, the library syncs to OneDrive's Apps folder (this app can only see its own folder, none of your other files). It works without signing in, with songs only on this device." },
  "\u5237\u65B0\u4E91\u7AEF": { en: "Refresh cloud" },
  "\u9000\u51FA\u767B\u5F55": { en: "Sign out" },
  "\u6B4C\u8FD8\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A": { en: "Songs stay on this device" },
  "\u767B\u5F55\u5FAE\u8F6F\u8D26\u53F7": { en: "Sign in with Microsoft" },
  "MoonSinger-\u6B4C\u5E93-{p}{p2}{p3}-{p4}{p5}.zip": { en: "MoonSinger-library-{p}{p2}{p3}-{p4}{p5}.zip" },
  "\u6B63\u5728\u6253\u5305\u6B4C\u5E93\u2026": { en: "Packing the library\u2026" },
  "\u6B4C\u5E93\u6253\u5305\u597D\u4E86": { en: "Library packed" },
  "\u5BFC\u51FA\u6CA1\u6210\uFF1A{Error}": { en: "Export failed: {Error}" },
  "\u8FD8\u6709 {n} \u9996\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939": { en: "{n} {n|song|songs} not written to the folder yet" },
  "\u8FD8\u6709 {n} \u9996\u6CA1\u4E0A\u4E91": { en: "{n} {n|song|songs} not in the cloud yet" },
  "\u9000\u51FA\u540E\u8FD9\u4E9B\u6539\u52A8\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3002\u53EF\u4EE5\u5148\u63A8\u4E0A\u53BB\uFF08\u63A8\u4E0D\u4E0A\u53BB\u7684\u9010\u9996\u4E0B\u8F7D\u5907\u4EFD\uFF09\uFF0C\u6216\u8005\u7167\u6837\u9000\u51FA\u3002": { en: "After signing out these changes exist only on this device. You can upload them first (what can't be uploaded is downloaded song by song as backup), or sign out anyway." },
  "\u5148\u63A8\u4E0A\u53BB / \u4E0B\u8F7D\u5907\u4EFD": { en: "Upload first / download backup" },
  "\u7167\u6837\u9000\u51FA": { en: "Sign out anyway" },
  "\u4E0D\u7528\u300C{label}\u300D\u4E86\uFF1A\u5939\u91CC\u7684\u6B4C\u4E00\u9996\u6CA1\u52A8\uFF0C\u518D\u8FDB\u6B4C\u5E93\u53EF\u4EE5\u9009\u5BB6": { en: "Stopped using \u201C{label}\u201D: no songs in the folder were touched; choose a home next time you open the library" },
  "\u9000\u51FA\u4E86\uFF1A\u6B4C\u90FD\u8FD8\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u518D\u8FDE\u4E0A\u7F51\u76D8\u5C31\u80FD\u63A5\u7740\u7528": { en: "Signed out: all songs are still on this device; reconnect OneDrive to carry on" },
  "\u63A8\u4E0D\u4E0A\u53BB\u7684 {n} \u9996\u5DF2\u4E0B\u8F7D\u5907\u4EFD": { en: "{n} {n|song that couldn't upload was|songs that couldn't upload were} downloaded as backup" },
  "\u90FD\u63A8\u4E0A\u53BB\u4E86": { en: "Everything uploaded" },
  "\u53BB\u5FAE\u8F6F\u767B\u5F55": { en: "Sign in with Microsoft" },
  "\u9875\u9762\u4F1A\u8DF3\u5230\u5FAE\u8F6F\u7684\u767B\u5F55\u9875\uFF08\u53EA\u8BA4\u4E2A\u4EBA\u8D26\u53F7\uFF09\uFF0C\u767B\u5F55\u5B8C\u81EA\u52A8\u56DE\u5230\u8FD9\u91CC\u3002{inGallery}": { en: "The page will go to Microsoft's sign-in (personal accounts only) and come back here afterward. {inGallery}" },
  "\u624B\u91CC\u7684\u6B4C\u5DF2\u7ECF\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\u3002": { en: "The song in hand is already saved on this device." },
  "\u624B\u91CC\u8FD9\u9996\u65E0\u5730\u7684\u6B4C\u6539\u8FC7\u8FD8\u6CA1\u5B58\u2014\u2014\u8DF3\u8D70\u4F1A\u4E22\uFF0C\u5148\u5B58\u4E00\u4E0B\u518D\u6765\u3002": { en: "The homeless song in hand has unsaved changes \u2014 leaving would lose them, so save first." },
  "\u53BB\u767B\u5F55": { en: "Sign in" },
  "\u4E91\u7AEF\u6709\u65B0\u7248\u672C": { en: "Newer version in the cloud" },
  "\u300C{id}\u300D\u5728\u522B\u7684\u8BBE\u5907\u4E0A\u6539\u8FC7\u4E86\uFF0C\u6B63\u5728\u6362\u6210\u6700\u65B0\u7684\u2026\u2026\u5148\u522B\u6253\u5B57\u3002": { en: "\u201C{id}\u201D was changed on another device, switching to the latest\u2026 hold off on typing." },
  "\u6362\u6210\u4E91\u7AEF\u7684\u65B0\u7248\u672C\u4E86": { en: "Switched to the newer cloud version" },
  "\u300C{id}\u300D\u4E91\u7AEF\u7684\u65B0\u7248\u672C\u62C9\u4E0B\u6765\u4E86\uFF0C\u4F46\u91CD\u5F00\u5931\u8D25\u2014\u2014\u8BF7\u4ECE\u6B4C\u5E93\u518D\u6253\u5F00\u4E00\u6B21": { en: "The newer cloud version of \u201C{id}\u201D was pulled, but reopening failed \u2014 please open it again from the library" },
  "{n} \u9996\u6539\u8FC7\u7684\u8FD8\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A{named}": { en: "{n} edited {n|song is|songs are} still only on this device{named}" },
  "\uFF1B\u4F20\u7684\u8BDD\u8FDE\u6B63\u5728\u5199\u7684\u8FD9\u9996\u4E00\u8D77": { en: "; uploading also includes the song you're writing" },
  "\u5199\u8FDB\u300C{label}\u300D": { en: "Write into \u201C{label}\u201D" },
  "\u4F20\u4E0A\u53BB": { en: "Upload" },
  "\u4EE5\u540E\u518D\u8BF4": { en: "Not now" },
  "{r} \u9996\u90FD\u4F20\u4E0A\u53BB\u4E86": { en: "{r} {r|song|songs} uploaded" },
  "\u4F20\u4E0A\u53BB {r} \u9996\uFF0C\u8FD8\u6709 {left} \u9996\u6CA1\u4F20\u6210{named}\uFF1A\u522B\u7684\u8BBE\u5907\u6539\u8FC7\u7684\u8981\u4F60\u9009\uFF0C\u7F51\u7EDC\u95EE\u9898\u7684\u4E4B\u540E\u518D\u8BD5\u3002": { en: "Uploaded {r} {r|song|songs}, {left} not done{named}: changes from other devices need your choice, network problems will retry later." },
  "\u53BB\u5904\u7406": { en: "Handle them" },
  "\u6709 {neverUploaded} \u9996\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\uFF0C\u8FD8\u6709 {others} \u9996\u6539\u8FC7\u6CA1\u4F20\u3002\u73B0\u5728\u5168\u4F20\uFF1F": { en: "{neverUploaded} {neverUploaded|song exists|songs exist} only on this device, and {others} more {others|has|have} changes not uploaded. Upload everything now?" },
  "\u6709 {neverUploaded} \u9996\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\uFF0C\u73B0\u5728{f}\uFF1F": { en: "{neverUploaded} {neverUploaded|song exists|songs exist} only on this device. {f} now?" },
  "\u522B\u7684\u8BBE\u5907\u6539\u8FC7\u7684\u4E0D\u4F1A\u88AB\u76D6\u6389\uFF0C\u4F1A\u7559\u7ED9\u4F60\u9009\u3002\u7A0D\u540E = \u5B83\u4EEC\u8FDB\u6B4C\u5E93\u300C\u8981\u5904\u7406\u300D\u7684\u5217\u8868\uFF0C\u4EC0\u4E48\u90FD\u4E0D\u4F20\u3002": { en: "Changes made on other devices won't be overwritten; you'll get to choose. Later = they go on the library's \u201CNeeds attention\u201D list and nothing is uploaded." },
  "\u73B0\u5728\u4F20": { en: "Upload now" },
  "{n} \u9996\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u5E93\u300C\u8981\u5904\u7406\u300D\u91CC\u770B\u5F97\u89C1": { en: "{n} {n|song stays|songs stay} on this device, in the library's \u201CNeeds attention\u201D list" },
  "\u6362\u5C01\u9762\u56FE": { en: "Change cover image" },
  "\u5C01\u9762\u56FE\u6362\u597D\u4E86\uFF08{n}\uFF09": { en: "Cover image changed ({n})" },
  "\u8FD9\u5F20\u56FE\u7528\u4E0D\u4E86\uFF1A{Error}": { en: "This image can't be used: {Error}" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86": { en: "Saved on this device" },
  "\u8981\u540C\u6B65\u5230 OneDrive \u5417\uFF1F\u767B\u5F55\u5FAE\u8F6F\u4E2A\u4EBA\u8D26\u53F7\u540E\uFF0C\u6B4C\u5E93\u540C\u6B65\u5230\u4F60 OneDrive \u7684\u300C\u5E94\u7528\u300D\u6587\u4EF6\u5939\uFF08\u8FD9\u4E2A app \u53EA\u80FD\u770B\u81EA\u5DF1\u7684\u90A3\u4E2A\u5939\uFF09\u3002": { en: "Sync to OneDrive? After signing in with a personal Microsoft account, the library syncs to your OneDrive's Apps folder (this app can only see its own folder)." },
  "\u6682\u4E0D": { en: "Not now" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u8FD8\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939": { en: "Saved on this device, not written to the folder yet" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u4E91\u7AEF\u7A0D\u540E\u518D\u63A8": { en: "Saved on this device, uploading to the cloud later" },
  "\u5DF2\u5B58 \u2713": { en: "Saved \u2713" },
  "\u8FD9\u9996\u6B4C\u6CA1\u52A0\u5BC6\u3002MoonSinger \u8FD9\u4E00\u7248\u8FD8\u4E0D\u52A0\u5BC6\uFF08\u8981\u7684\u8BDD\u544A\u8BC9\u5F00\u53D1\u8005\uFF1A\u7167 WXHW \u63A5 zip.js + 7z \u5C31\u80FD\u5F00\uFF09\u3002": { en: "This song isn't encrypted. This version of MoonSinger doesn't encrypt yet." },
  "\u300C{p}\u300D\u91CC\u952E\u76D8\u4E0D\u5199\u97F3\uFF08\u5207\u5230\u300C\u97F3\u300D\u518D\u5199\uFF09": { en: "In \u201C{p}\u201D the keys don't write notes (switch to \u201CNotes\u201D to write)" },
  "\u8FD9\u6761\u58F0\u90E8\u53F0\u4E0A\u662F\u5355\u58F0\u7684\uFF08\u5C0F\u6708\u76F8 / \u5143\u97F3\u7248 / \u6CA1\u4EBA\uFF09\uFF1A\u53E0\u4E0D\u4E86\u3002\u6362\u6210\u80FD\u53E0\u97F3\u7684\u4E50\u5668\u518D\u53E0": { en: "This part's performer is monophonic (Tsukuyomi-chan / vowel version / nobody): it can't stack. Switch to an instrument that can" },
  "MIDI \u952E\u76D8\u63A5\u4E0A\u4E86\uFF1A{name}": { en: "MIDI keyboard connected: {name}" },
  "MIDI \u952E\u76D8\u62D4\u6389\u4E86\uFF1A{name}": { en: "MIDI keyboard unplugged: {name}" },
  "MIDI \u952E\u76D8\uFF1A\u8FD8\u6CA1\u8FDE\uFF08\u70B9\u4E00\u4E0B\u770B\u600E\u4E48\u8FDE\uFF09": { en: "MIDI keyboard: not connected (tap to see how)" },
  "MIDI \u952E\u76D8\uFF1A\u7B49\u6D4F\u89C8\u5668\u7684\u8BB8\u53EF\u2026": { en: "MIDI keyboard: waiting for browser permission\u2026" },
  "MIDI \u952E\u76D8\uFF1A\u6D4F\u89C8\u5668\u6CA1\u7ED9\uFF08\u70B9\u4E00\u4E0B\u770B\u600E\u4E48\u529E\uFF09": { en: "MIDI keyboard: browser denied it (tap to see what to do)" },
  "MIDI \u952E\u76D8\uFF1A\u5F00\u7740\uFF0C\u8FD8\u6CA1\u63D2\u7434\uFF08\u63D2\u4E0A\u5C31\u8BA4\uFF09": { en: "MIDI keyboard: on, nothing plugged in (recognized when plugged in)" },
  "MIDI \u952E\u76D8\uFF1A\u63A5\u7740 {p}\uFF08\u5F39\u4E00\u4E0B\u8FD9\u4E2A\u70B9\u4F1A\u95EA\uFF09": { en: "MIDI keyboard: connected to {p} (this dot flashes when you play)" },
  "\u95EE\u6D4F\u89C8\u5668\u8981 MIDI \u7684\u8BB8\u53EF\uFF08\u6D4F\u89C8\u5668\u4F1A\u5F39\u5B83\u81EA\u5DF1\u7684\u6846\uFF09\uFF1B\u7ED9\u8FC7\u4E00\u6B21\u4EE5\u540E\u5F00 app \u81EA\u5DF1\u63A5\u4E0A": { en: "Asks the browser for MIDI permission (it shows its own prompt); after that, the app connects by itself" },
  "\u6211\u6CA1\u6709 MIDI \u952E\u76D8": { en: "I don't have a MIDI keyboard" },
  "\u9876\u680F\u4E0D\u518D\u9732\u300CMIDI\u300D\uFF1B\u4EE5\u540E\u8981\u8FDE\uFF1A\u83DC\u5355 \u2192 \u8BBE\u7F6E \u2192 MIDI \u952E\u76D8": { en: "\u201CMIDI\u201D no longer shows in the top bar; to connect later: Menu \u2192 Settings \u2192 MIDI keyboard" },
  "\u9876\u680F\u4E0D\u9732\u300CMIDI\u300D\u4E86\uFF1B\u4EE5\u540E\u8981\u8FDE\uFF1A\u83DC\u5355 \u2192 \u8BBE\u7F6E \u2192 MIDI \u952E\u76D8": { en: "\u201CMIDI\u201D is hidden from the top bar; to connect later: Menu \u2192 Settings \u2192 MIDI keyboard" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u8BFB\u4E0D\u4E86 MIDI \u952E\u76D8\uFF08iPad / iPhone \u4E0A\u7684\u6D4F\u89C8\u5668\u90FD\u6CA1\u6709 Web MIDI\uFF09\uFF1B\u7535\u8111\u4E0A\u7684 Chrome / Edge / Firefox \u53EF\u4EE5": { en: "This browser can't read MIDI keyboards (no browser on iPad / iPhone has Web MIDI); Chrome / Edge / Firefox on a computer can" },
  "\u7B49\u6D4F\u89C8\u5668\u7684\u8BB8\u53EF\u2026": { en: "Waiting for browser permission\u2026" },
  "\u6D4F\u89C8\u5668\u6CA1\u7ED9\uFF08{why}\uFF09\u3002\u5728\u5730\u5740\u680F\u5DE6\u8FB9\u7684\u7AD9\u70B9\u8BBE\u7F6E\u91CC\u5141\u8BB8 MIDI\uFF0C\u518D\u70B9\u8FDE\u63A5": { en: "The browser denied it ({why}). Allow MIDI in the site settings left of the address bar, then tap Connect" },
  "\u7434\u7528 USB \u63D2\u4E0A\u7535\u8111\uFF0C\u70B9\u300C\u8FDE\u63A5\u300D\uFF08\u6D4F\u89C8\u5668\u4F1A\u95EE\u4E00\u6B21\uFF0C\u4EE5\u540E\u5F00 app \u81EA\u5DF1\u63A5\u4E0A\uFF09": { en: "Plug the keyboard into the computer via USB and tap \u201CConnect\u201D (the browser asks once, then the app connects by itself)" },
  "\u63A5\u7740\uFF1A{p}\u3002\u5F39\u7684\u97F3\u6309\u5149\u6807\u5904\u7684\u957F\u77ED\u5199\u8FDB\u8C31\uFF1B\u300C\u5F39\u300D\u5F00\u7740 / \u8BCD / \u542C\u91CC\u53EA\u51FA\u58F0": { en: "Connected: {p}. Notes you play are written with the length at the cursor; with \u201CJam\u201D on, or in Lyrics / Listen, they only sound" },
  "\u5F00\u7740\uFF0C\u8FD8\u6CA1\u63D2\u7434\uFF08\u63D2\u4E0A\u5C31\u8BA4\uFF09": { en: "On, nothing plugged in (recognized when plugged in)" },
  "\u5FF5\u7F13\u5B58\u548C\u5C01\u9762\u7F13\u5B58\u6362\u4E86\u65B0\u540D\u5B57\uFF0C\u4F1A\u91CD\u65B0\u751F\u6210\u4E00\u6B21\uFF08\u6B4C\u4E0D\u53D7\u5F71\u54CD\uFF09": { en: "The speech and cover caches got new names and will regenerate once (songs aren't affected)" },
  "\u8BD5\u542C\u5143\u97F3\u8868\u6CA1\u4E0B\u8F7D\u4E0B\u6765\uFF1A{Error}": { en: "Couldn't download the audition vowel table: {Error}" },
  "\u6B4C\u5E93\u91CC\u8FD9\u53F0\u8BBE\u5907\u8BB0\u7740\u7684\u58F0\u97F3\u662F\u4E4B\u524D\u7684\u5F15\u64CE\u6E32\u7684\uFF1A\u5C01\u9762\u4E0A\u6807\u300C\u65E7\u300D\u3001\u7167\u6837\u80FD\u542C\uFF0C\u64AD\u653E\u6761\u4E0A\u300C\u91CD\u65B0\u6E32\u67D3\u300D\u7528\u73B0\u5728\u7684\u5F15\u64CE\u91CD\u6E32\uFF1B\u8BBE\u7F6E\u300C\u6E32\u67D3\u7F13\u5B58\u300D\u91CC\u53EF\u4EE5\u4E00\u952E\u5220\u6389\u65E7\u7684\u3002": { en: "Songs this device has kept for the library were rendered by the previous engine: their covers are marked \u201Cold\u201D and they still play; \u201CRender again\u201D on the player bar re-renders with the current engine, and Settings \u2192 Render cache can delete all the old ones at once." },
  "SoundFont \u4E50\u5668\u53C8\u548C\u6807\u51C6\u64AD\u653E\u5668\uFF08FluidSynth\uFF09\u5BF9\u4E86\u4E00\u6B21\u9F50\uFF1A\u6BCF\u4EF6\u4E50\u5668\u6309\u5E93\u91CC\u7ED9\u5B83\u5199\u7684\u529B\u5EA6\u66F2\u7EBF\u8D70\u2014\u2014\u591A\u6570\u4E50\u5668 ppp \u5230 fff \u7684\u5DEE\u522B\u4ECE 36 dB \u6536\u5230 30 dB\uFF0C\u98CE\u7434\u8FD9\u7C7B\u5E93\u91CC\u5B9A\u6210\u4E0D\u968F\u529B\u5EA6\u7684\u5C31\u6309\u591A\u91CD\u90FD\u4E00\u6837\u54CD\uFF1B\u5E93\u91CC\u5199\u7684\u521D\u59CB\u8870\u51CF\u4E5F\u7167\u6807\u51C6\u7B97\u3002\u5728 mf \u4E0A\u591A\u6570\u4E50\u5668\u53C8\u8F7B\u4E86 0\u20139 dB\uFF08\u4E2D\u4F4D\u6570\u7EA6 3 dB\uFF09\uFF0C\u4E50\u5668\u4E4B\u95F4\u7684\u8F7B\u91CD\u4F1A\u632A\u3002\u5C0F\u6708\u76F8\u548C\u5143\u97F3\u7248\u7684\u5F3A\u5F31\u4E5F\u6536\u5230\u540C\u6837\u7684\u5E45\u5EA6\uFF08\u5979\u7684 mf \u6BD4\u4E0A\u4E00\u7248\u54CD 1.3 dB\uFF09\u3002\u65E7\u6B4C\u7684\u5E73\u8861\u8981\u91CD\u65B0\u8C03\u3002": { en: "SoundFont instruments are aligned with the standard player (FluidSynth) once more: each instrument now follows the velocity curve its library gives it \u2014 for most instruments ppp to fff narrows from 36 dB to 30 dB, and ones the library makes velocity-insensitive (organs and the like) sound equally loud however hard you play; the library's initial attenuation is also applied the standard way. At mf most instruments get another 0\u20139 dB quieter (about 3 dB in the middle), and the balance between instruments shifts. Tsukuyomi-chan and the vowel version narrow to the same range (her mf is 1.3 dB louder than the last version). Old songs need their balance redone." },
  "\u4E50\u5668\u548C\u5C0F\u6708\u76F8\u7684\u5F3A\u5F31\u6539\u6210\u4E86 SoundFont \u7684\u653E\u6CD5\uFF0C\u548C\u6807\u51C6\u64AD\u653E\u5668\uFF08FluidSynth\uFF09\u4E00\u6837\uFF1A\u6BCF\u4EF6\u4E50\u5668\u6309\u5E93\u91CC\u7ED9\u5B83\u5199\u7684\u529B\u5EA6\u66F2\u7EBF\u8D70\uFF08\u591A\u6570\u4E50\u5668 ppp \u5230 fff \u5DEE 30 dB\uFF1B\u98CE\u7434\u8FD9\u7C7B\u5E93\u91CC\u5B9A\u6210\u4E0D\u968F\u529B\u5EA6\u7684\uFF0C\u6309\u591A\u91CD\u90FD\u4E00\u6837\u54CD\uFF09\uFF0C\u5E93\u91CC\u5199\u7684\u521D\u59CB\u8870\u51CF\u4E5F\u7167\u6807\u51C6\u7B97\u3002\u6574\u9996\u4F1A\u53D8\u8F7B\u3001\u4E50\u5668\u4E4B\u95F4\u7684\u8F7B\u91CD\u4F1A\u632A\uFF1B\u5C0F\u6708\u76F8\u548C\u5143\u97F3\u7248\u7684\u5F3A\u5F31\u4E5F\u6309\u540C\u4E00\u6761\u66F2\u7EBF\u3002\u65E7\u6B4C\u7684\u5E73\u8861\u8981\u91CD\u65B0\u8C03\u3002": { en: "Instrument and Tsukuyomi-chan dynamics now work the SoundFont way, the same as the standard player (FluidSynth): each instrument follows the velocity curve its library gives it (for most, ppp to fff spans 30 dB; ones the library makes velocity-insensitive, like organs, sound equally loud however hard you play), and the library's initial attenuation is applied the standard way. Whole songs get quieter and the balance between instruments shifts; Tsukuyomi-chan and the vowel version follow the same curve. Old songs need their balance redone." },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BFB\u4E0D\u5230\u5B83\u7684\u5B57\u8282": { en: "Its bytes can't be read on this device" },
  "\u5199\u5B8C\u5728\u65B0\u5BB6\u91CC\u627E\u4E0D\u5230": { en: "Not found in the new home after writing" },
  "\u5199\u8FDB\u53BB\u7684\u5B57\u8282\u548C\u539F\u6765\u7684\u5BF9\u4E0D\u4E0A": { en: "Written bytes don't match the original" },
  " \u7B49 {n} \u9996": { en: " and {n} more {n|song|songs}" },
  "\u642C\u597D\u4E86 {n} \u9996\u5230\u300C{home}\u300D": { en: "Moved {n} {n|song|songs} into \u201C{home}\u201D" },
  "{n} \u9996\u8FDE\u7740\u7F51\u76D8\u7684\u62F7\u4E86\u4E00\u4EFD\u8FC7\u53BB\uFF0C\u6D4F\u89C8\u5668\u91CC\u90A3\u4EFD\u7559\u7740\uFF08\u767B\u5F55\u540E\u7167\u5E38\u540C\u6B65\uFF09": { en: "{n} OneDrive-linked {n|song was|songs were} copied over; the browser's {n|copy stays|copies stay} (sync as usual after signing in)" },
  "{n} \u9996\u5DF2\u7ECF\u5728\u300C{home}\u300D\u91CC\u4E86\uFF0C\u4F46\u6D4F\u89C8\u5668\u91CC\u7684\u65E7\u7684\u6CA1\u79FB\u8D70\uFF1A{stuck}": { en: "{n} {n|song is|songs are} already in \u201C{home}\u201D, but the old browser copies weren't removed: {stuck}" },
  "{n} \u9996\u6CA1\u642C\u6210\uFF0C\u8FD8\u5728\u6D4F\u89C8\u5668\u91CC\uFF0C\u4E00\u4E2A\u5B57\u8282\u6CA1\u52A8\uFF1A{failed}": { en: "{n} {n|song wasn't|songs weren't} moved and {n|remains|remain} in the browser, not a byte changed: {failed}" },
  "\u6CA1\u6709\u8981\u642C\u7684\u6B4C": { en: "No songs to move" },
  "\u9009\u533A\u5199\u6EE1\u4E86\uFF1A\u5199\u4E0D\u51FA\u9009\u533A\u3002\u8981\u5F80\u540E\u5199\uFF0C\u5148\u70B9\u522B\u5904\u9000\u51FA\u9009\u533A": { en: "The selection is full: can't write past it. To keep writing, tap elsewhere to leave the selection" },
  "\u5728\u9009\u4E50\u5668\uFF1A\u8C31\u88AB\u76D6\u4F4F\u4E86\uFF0C\u56DE\u5230\u8C31\u518D\u632A\u5149\u6807": { en: "Picking an instrument: the score is covered; go back to the score to move the cursor" },
  "\u5728\u9009\u4E50\u5668\uFF1A\u952E\u76D8\u53EA\u5F39\u4E0D\u5199\uFF1B\u56DE\u5230\u8C31\u518D\u5199": { en: "Picking an instrument: the keyboard only plays, it doesn't write; go back to the score to write" },
  "\u9501\u7740\uFF1A\u8981\u6539\u5148\u70B9\u8C31\u4E0A\u9762\u7684\u300C\u63A5\u7740\u6539\u300D": { en: "Locked: to edit, first tap \u201CKeep editing\u201D above the score" },
  "\u300C\u5F39\u300D\u5F00\u7740\uFF1A\u7B26\u53F7\u683C\u5168\u662F\u5199\u8BB0\u53F7\u7684\uFF0C\u518D\u70B9\u300C\u5F39\u300D\u63A5\u56DE\u53BB\u624D\u80FD\u7528": { en: "\u201CPlay\u201D is on: the symbol keys all write marks; tap \u201CPlay\u201D again to plug back in" },
  "\u300C\u5F39\u300D\u5F00\u7740\uFF1A\u53EA\u5F39\u4E0D\u5199\uFF1B\u518D\u70B9\u300C\u5F39\u300D\u63A5\u56DE\u53BB": { en: "\u201CPlay\u201D is on: it only plays, it doesn't write; tap \u201CPlay\u201D again to plug back in" },
  "\u53F0\u4E0A\u8FD9\u4F4D\u662F\u5355\u58F0\u7684\uFF0C\u53E0\u4E0D\u4E86": { en: "The performer on stage plays one note at a time, so notes can't be stacked" },
  "\u8FD9\u4E2A\u58F0\u90E8\u4E0D\u662F\u5927\u8C31\u8868\uFF0C\u53EA\u6709\u4E00\u5F20\u8C31": { en: "This part isn't a grand staff; there's only one staff" },
  "\u5149\u6807\u524D\u9762\u6CA1\u6709\u97F3\u53EF\u4EE5\u62C9\u957F": { en: "There's no note before the cursor to lengthen" },
  "\u5149\u6807\u524D\u9762\u6CA1\u6709\u53EF\u5220\u7684": { en: "There's nothing before the cursor to delete" },
  "\u8FD9\u5F20\u7EB8\u4E0A\u8FD8\u6CA1\u6709\u97F3\uFF1A\u8BB0\u53F7\u8981\u6302\u5728\u97F3\u4E0A": { en: "There are no notes on this sheet yet: marks attach to notes" },
  "\u7436\u97F3\u53EA\u6302\u5728\u548C\u5F26\u4E0A\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u662F\u5355\u97F3": { en: "Arpeggios only go on chords: the note before the cursor is a single note" },
  "\u7436\u97F3\u53EA\u6302\u5728\u548C\u5F26\u4E0A\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6216\u9009\u4E2D\u7684\uFF09\u662F\u5355\u97F3": { en: "Arpeggios only go on chords: the note before the cursor (or the selection) is a single note" },
  "{p}\u8981\u6302\u5728\u4E00\u4E2A\u97F3\u4E0A\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "{p} must go on a note (before the cursor is a rest, or no note yet)" },
  "\u8FDE\u7EBF\u4ECE\u4E00\u4E2A\u97F3\u8FDE\u5230\u4E0B\u4E00\u4E2A\u97F3\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "A slur goes from one note to the next (before the cursor is a rest, or no note yet)" },
  "\u51FA\u58F0\u7684\u6362\u6C14\u6302\u5728\u4E00\u4E2A\u97F3\u540E\u9762\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "An audible breath goes after a note (before the cursor is a rest, or no note yet)" },
  "\u97F3\u5185\u7684\u8D77\u4F0F\u8981\u6302\u5728\u4E00\u4E2A\u97F3\u4E0A\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "A swell must go on a note (before the cursor is a rest, or no note yet)" },
  "{p}\u4ECE\u4E00\u4E2A\u97F3\u5230\u4E0B\u4E00\u4E2A\u97F3\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "{p} goes from one note to the next (before the cursor is a rest, or no note yet)" },
  "\u952E\u4E0A\u6309 C \u8C03\u5199": { en: "Keys in C" },
  "\u79FB\u8C03\u8F85\u52A9\u5F00\u7740\uFF1A\u952E\u4E0A\u7684\u5927\u5B57\u662F\u8FD9\u4E2A\u97F3\u5728\u8C31\u4E0A\uFF08\u6362\u5230 C \u8C03\uFF09\u753B\u6210\u7684\u540D\u5B57\uFF0C\u5C0F\u5B57\u662F\u5B9E\u9645\u7684\u97F3\uFF1B\u300C1=\u300D\u5199\u7684\u662F\u5B9E\u9645\u7684\u8C03": { en: "Transposition aid is on: the big label on each key is the name this note is drawn as on the score (in C); the small label is the actual note; 1= shows the actual key" },
  "\u8DDF\u8C31": { en: "Follow score" },
  "\u8DDF\u7740\u8C31\u4E0A\u8FD9\u91CC\u7684\u8C03\u53F7": { en: "Uses the key signature here" },
  "\u624B\u52A8": { en: "Manual" },
  "\u624B\u52A8\uFF1A\u952E\u76D8\u6309 {pad} \u6392\uFF0C\u548C\u8C31\u4E0A\u8FD9\u91CC\u7684\u8C03\u53F7\uFF081={k}\uFF09\u4E0D\u4E00\u6837\u3002\u70B9\u5F00\u300C1=\u300D\uFF0C\u8C03\u5F0F\u90A3\u4E00\u5217\u6700\u4E0A\u9762\u7684\u300C\u8DDF\u8C31\u300D= \u56DE\u5230\u8DDF\u7740\u8C31\u8D70": { en: "Manual: the keyboard is laid out in {pad}, which differs from the key signature here (1={k}). Open \u201C1=\u201D and pick \u201CFollow score\u201D at the top of the mode column to follow the score again" },
  "{name}\uFF08\u8DDF\u7740\u8C31\u4E0A\u8FD9\u91CC\u7684\u8C03\u53F7\uFF09": { en: "{name} (follows the key signature here)" },
  "{name}\uFF08\u624B\u52A8\uFF09": { en: "{name} (manual)" },
  "\u8BB0\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u90FD\u53EF\u4EE5\u4E0D\u9009\uFF0C\u4EE5\u540E\u5728\u8BBE\u7F6E\u91CC\u6539\u3002": { en: "Kept on this device; you can leave any of these unpicked and change them later in Settings." },
  "\u4E0D\u7528": { en: "Off" },
  "\u5566": { en: "la" },
  "\u3093 / \u55EF": { en: "\u3093 (hum)" },
  "\u3042 / \u554A": { en: "\u3042 (ah)" },
  "\u304A / \u54E6": { en: "\u304A (oh)" },
  "\u3046 / \u545C": { en: "\u3046 (oo)" },
  "\u3089 / \u5566": { en: "\u3089 (la)" },
  "\u6539\u56DE\u73B0\u5728\u7684\u9ED8\u8BA4\uFF08\u5199\u8FDB\u6B4C\u91CC\uFF1B\u80FD\u64A4\u9500\uFF09": { en: "Change back to the current default (written into the song; can be undone)" },
  "\u9ED8\u8BA4": { en: "Default" },
  "{p}\u524D\u300C{mark}\u300D{p2}": { en: "\u201C{mark}\u201D before {p}{p2}" },
  "\u4E0B\u4E00\u4E2A\u5B57": { en: "the next syllable" },
  "\u8FD9\u4E2A\u5B57": { en: "this syllable" },
  "\uFF08\u987F\u4E00\u4E0B\uFF0C\u4E0D\u6362\u6C14\uFF09": { en: " (a brief stop, no breath)" },
  "\uFF08\u6362\u6C14\uFF09": { en: " (a breath)" },
  "\uFF08\u5927\u53E3\u6362\u6C14\uFF09": { en: " (a big breath)" },
  "\u4E0D\u53D8\u6210\u5531\u6CD5\u8BB0\u53F7": { en: "Doesn't become a singing mark" },
  "\u6309\u4E0B\u90A3\u4E00\u4E0B\u7684\u8F7B\u91CD\uFF08MIDI \u529B\u5EA6\uFF09\uFF1A\u6E10\u5F3A\u6E10\u5F31 = \u6BCF\u4E2A\u65B0\u97F3\u4E00\u4E2A\u53F0\u9636\uFF0C\u6309\u4F4F\u7684\u97F3\u4E2D\u95F4\u4E0D\u53D8\uFF1B\u4E00\u4E2A\u97F3\u91CC\u9762\u8981\u53D8\uFF0C\u7528\u97F3\u5185\u8D77\u4F0F{canSwell}": { en: "How hard the key is struck (MIDI velocity): crescendo / diminuendo = one step per new note, held notes don't change; to change within a note, use a swell{canSwell}" },
  "\uFF08\u8FD9\u4EF6\u4E50\u5668\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF\uFF1A\u97F3\u5185\u53EA\u80FD\u53D8\u5F31\uFF09": { en: " (this instrument decays on its own: within a note it can only get softer)" },
  "\u4E00\u6761\u8FDE\u7EED\u7684\u97F3\u91CF\u66F2\u7EBF\uFF08\u4E58\u5728{sung}\u51FA\u6765\u7684\u58F0\u97F3\u4E0A\uFF09\uFF1A\u6E10\u5F3A\u6E10\u5F31\u5728\u4E00\u4E2A\u957F\u97F3\u4E2D\u95F4\u4E5F\u4E00\u76F4\u5728\u53D8\uFF0C\u548C\u97F3\u5185\u8D77\u4F0F\u662F\u540C\u4E00\u79CD\u53D8\u6CD5\uFF1B\u53EA\u53D8\u54CD\u5EA6\u3001\u4E0D\u53D8\u97F3\u8272{sung2}": { en: "A continuous volume curve (multiplied onto the {sung} sound): crescendo / diminuendo keep changing through a long note, the same way a swell does; only loudness changes, not timbre{sung2}" },
  "\u5531##\u51FA\u58F0": { en: "sung" },
  "\u5F39##\u51FA\u58F0": { en: "played" },
  "\uFF08\u771F\u4EBA\u6E10\u5F31\u4F1A\u53D8\u865A\u3001\u53D8\u6697\uFF0C\u8FD9\u4E2A\u8FD8\u6CA1\u6709\uFF09": { en: " (a real singer's diminuendo gets airier and darker; not modeled yet)" },
  "\u529B\u5EA6\u600E\u4E48\u53D8": { en: "How dynamics change" },
  "\u529B\u5EA6\u8868\uFF1A{string}": { en: "Dynamics table: {string}" },
  "dB \u8868\uFF1A{string}": { en: "dB table: {string}" },
  "\u6E10\u5F3A\u6E10\u5F31\u6CA1\u5199\u7EC8\u70B9": { en: "Crescendo / diminuendo with no endpoint" },
  "\u8D70\u4E00\u6863 = \u529B\u5EA6 {wedgeStepVel}": { en: "One step = velocity {wedgeStepVel}" },
  "\u8D70\u5230\u8868\u91CC\u7684\u4E0B\u4E00\u6863": { en: "Goes to the next step in the table" },
  "\u5E7D\u7075\u97F3": { en: "Ghost note" },
  "\u529B\u5EA6 {ghostVel}": { en: "Velocity {ghostVel}" },
  "\u6574\u4E2A\u97F3 {ghostDb}": { en: "Whole note {ghostDb}" },
  "\u5F31\u5316": { en: "Unstressed" },
  "\u529B\u5EA6 {unstressVel}": { en: "Velocity {unstressVel}" },
  "\u6574\u4E2A\u97F3 {unstressDb}": { en: "Whole note {unstressDb}" },
  "\u6B21\u91CD\u97F3": { en: "Stress" },
  "\u529B\u5EA6 +{stressVel}": { en: "Velocity +{stressVel}" },
  "\u97F3\u5934 {accentSec} {stressDb}": { en: "Attack {accentSec} {stressDb}" },
  "\u91CD\u97F3": { en: "Accent" },
  "\u529B\u5EA6 +{accentVel}": { en: "Velocity +{accentVel}" },
  "\u97F3\u5934 {accentSec} {accentDb}{sung}": { en: "Attack {accentSec} {accentDb}{sung}" },
  "\u5F3A\u97F3": { en: "Marcato" },
  "\u529B\u5EA6 +{marcatoVel}": { en: "Velocity +{marcatoVel}" },
  "\u97F3\u5934 {accentSec} {marcatoDb}{sung}": { en: "Attack {accentSec} {marcatoDb}{sung}" },
  "\u7A81\u5F3A sfz": { en: "Sforzando sfz" },
  "\u529B\u5EA6 +{sfzVel}": { en: "Velocity +{sfzVel}" },
  "\u97F3\u5934 {sfzDb}\uFF0C{sfzSec} \u91CC\u843D\u56DE\u6765{sung}": { en: "Attack {sfzDb}, falls back within {sfzSec}{sung}" },
  "\u5F3A\u540E\u5373\u5F31 fp": { en: "Forte-piano fp" },
  "\u97F3\u5934\u6309 f\uFF0C{fpSec} \u91CC\u843D\u5230 p\uFF0C\u4E4B\u540E\u90FD\u662F p{sung}": { en: "Attacks at f, falls to p within {fpSec}, then stays p{sung}" },
  "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4EF6\u4E50\u5668\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF\uFF08\u6EDA\u594F\u7684\u97F3\u4F8B\u5916\uFF1A\u6BCF\u4E00\u4E0B\u7684\u529B\u5EA6\u8DDF\u7740\u8D77\u4F0F\uFF09": { en: "Not possible: this instrument decays once struck (except on rolled notes: each hit's velocity follows the swell)" },
  "\u5199\u7684\u529B\u5EA6\u662F\u6700\u9AD8\u70B9\uFF1A< \u4ECE \u2212{swellDb} dB \u957F\u5230\u5199\u7684\u529B\u5EA6\uFF1B<> \u4E24\u5934 \u2212{swellDb2} dB\u3001\u4E2D\u95F4\u56DE\u5230\u5199\u7684\u529B\u5EA6\uFF08\u5F3A\u540E\u5373\u5F31\u4E4B\u540E\u7684 < \u957F\u56DE\u97F3\u5934\u7684 f\uFF09": { en: "The written dynamic is the peak: < grows from \u2212{swellDb} dB to it; <> starts and ends at \u2212{swellDb2} dB, returning to it in the middle (a < after fp grows back to the attack's f)" },
  "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4EF6\u4E50\u5668\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF": { en: "Not possible: this instrument decays on its own" },
  "\u4E00\u8DEF\u5F80\u4E0B\u5230 \u2212{swellDb} dB": { en: "Falls all the way to \u2212{swellDb} dB" },
  "\u8DF3\u97F3": { en: "Staccato" },
  "\u5531 / \u5F39 {staccatoGate} \u7684\u957F\u5EA6": { en: "Sung / played at {staccatoGate} of its length" },
  "\u4FDD\u6301": { en: "Tenuto" },
  "\u8FD9\u4E2A\u97F3\u4E0D\u7559\u7F1D": { en: "No gap after this note" },
  "\u8FDE\u5230\u4E0B\u4E00\u4E2A\u97F3\u3001\u4E0D\u7559\u7F1D": { en: "Connects to the next note with no gap" },
  "\u547C\u5438": { en: "Breath" },
  "\u524D\u4E00\u4E2A\u97F3\u6536\u77ED {breathSec}\uFF08\u6700\u591A {breathShare}\uFF09": { en: "Shortens the previous note by {breathSec} (at most {breathShare})" },
  "\u51FA\u58F0\u7684\u6362\u6C14\uFF08\u8F7B\u5438 / \u6DF1\u5438\uFF09": { en: "Audible breath (soft / deep)" },
  "\u6362\u6C14\u7684\u7A7A\u5F53\u91CC\u4E00\u58F0\u5438\u6C14\uFF08\u6309\u4E0B\u4E00\u4E2A\u5B57\u7684\u5143\u97F3\u5851\u5F62\uFF0C\u6BD4\u5B83\u8F7B\u7EA6 28 dB\uFF1B\u6DF1\u5438 = \u7A7A\u5F53\u957F\u4E00\u70B9\u3001\u54CD 4 dB\uFF09": { en: "An inhale in the breath gap (shaped by the next syllable's vowel, about 28 dB softer; deep = a longer gap and 4 dB louder)" },
  "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4F4D\u53EA\u65AD\u5F00\uFF0C\u4E0D\u51FA\u5438\u6C14\u58F0": { en: "Not possible: this performer only separates, with no inhale sound" },
  "\u6C14\u58F0\uFF08\xD7 \u7B26\u5934\uFF09": { en: "Whisper (\xD7 notehead)" },
  "\u8FD9\u4E2A\u5B57\u4E0D\u5531\u97F3\u9AD8\uFF1A\u7528\u5FF5\u7684\u65F6\u5019\u7684\u6C14\u58F0\uFF08\u8C31\u5305\u7EDC\u7167\u65E7\u3001\u58F0\u5E26\u4E0D\u632F\uFF09\uFF0C\u518D\u8F7B 6 dB": { en: "This syllable has no sung pitch: uses the breathy spoken voice (same spectral envelope, no vocal-fold vibration), 6 dB softer" },
  "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4F4D\u53EA\u6309\u97F3\u9AD8\u51FA\u58F0": { en: "Not possible: this performer only sounds by pitch" },
  "\u97F3\u548C\u97F3\u4E4B\u95F4": { en: "Between notes" },
  "\u8FDE\u7740\u5531": { en: "Legato" },
  "{gapSec}\uFF08\u6700\u591A {gapShare}\uFF09": { en: "{gapSec} (at most {gapShare})" },
  "\u6EDA\u594F": { en: "Roll" },
  "\u6574\u4E2A\u97F3\u6572\u6EE1\uFF0C\u6BCF\u79D2 {hz} \u4E0B\uFF1B\u6BCF\u4E00\u4E0B\u6309\u6572\u4E0B\u53BB\u90A3\u4E00\u523B\u7684\u529B\u5EA6\uFF08\u6E10\u5F3A\u6E10\u5F31 / \u6E10\u5230 / \u97F3\u5185\u8D77\u4F0F / \u5F3A\u540E\u5373\u5F31\u90FD\u5728\u6BCF\u4E00\u4E0B\u91CC\uFF09\uFF0C\u91CD\u97F3\u8FD9\u4E00\u7EC4\u53EA\u7B97\u7B2C\u4E00\u4E0B": { en: "Fills the whole note, {hz} hits per second; each hit uses the dynamic at the moment it lands (crescendos, ramps, in-note swells and fp are all in each hit's velocity); accents and the like only on the first hit" },
  "\u7436\u97F3": { en: "Arpeggio" },
  "\u548C\u5F26\u4ECE\u4F4E\u5230\u9AD8\u4F9D\u6B21\u63D0\u65E9 {ms}\uFF0C\u6700\u4E0A\u9762\u90A3\u4E2A\u97F3\u51C6\u65F6\u843D\u62CD\uFF08\u6700\u591A\u644A\u5230\u8FD9\u4E2A\u97F3\u4E00\u534A\u957F\uFF09": { en: "Chord notes start {ms} earlier from low to high; the top note lands on the beat (spread over at most half the note)" },
  "\u5199\u7684\u7ED3\u5C3E\u843D\u5728\u8E29\u7740\u7684\u4E00\u6BB5\u91CC = \u7559\u5230\u4E0B\u4E00\u6B21\u6362\u8E0F\u677F / \u62AC\u8D77\uFF1B\u540C\u4E00\u4E2A\u97F3\u518D\u5F39 = \u65E7\u7684\u5148\u677E": { en: "A note whose written end falls while the pedal is down keeps sounding until the next change or lift; the same key played again releases the old note first" },
  "\u8E29\u4E0B\u90A3\u4E00\u523B\u6309\u7740\u7684\u97F3\u7559\u5230\u62AC\u8D77\uFF1B\u4E4B\u540E\u5F39\u7684\u7167\u5E38": { en: "The keys held at the moment it is pressed keep sounding until it is lifted; notes played after that are as written" },
  "\u8E29\u7740\u671F\u95F4\u8D77\u7684\u97F3\u529B\u5EA6 {softVel}\uFF0C\u65F6\u503C\u4E0D\u52A8": { en: "Notes started while it is down: velocity {softVel}, lengths unchanged" },
  "\u8E29\u7740\u671F\u95F4\u8D77\u7684\u97F3\u53D8\u8F7B": { en: "Notes started while it is down get softer" },
  "\u8BB0\u53F7\u600E\u4E48\u6F14\uFF08\u8FD9\u4F4D\u81EA\u5DF1\u7684\u914D\u7F6E\uFF0C\u8DDF\u7740\u6F14\u594F\u8005\u5B58\u8FDB\u6B4C\uFF09": { en: "How marks are performed (this performer's own settings, saved in the song with them)" },
  "\u73B0\u5728\u7684\u9ED8\u8BA4\uFF1A{v}": { en: "Current default: {v}" },
  "\u4EBA\u58F0\uFF08\u8FDE\u7740\u5531\uFF09": { en: "Voice (legato)" },
  "\u81EA\u5DF1\u7684 .sf2\uFF08\u76EE\u5F55\u91CC\u6CA1\u6709\u8FD9\u4E2A\u97F3\u8272\u7684\u8FDE\u65AD\u6570\u636E\uFF09": { en: "Own .sf2 (the catalog has no legato data for this sound)" },
  "\u4E00\u4E0B\u5C31\u5B8C / \u97F3\u6548\uFF08\u4E0D\u7559\u7F1D\uFF09": { en: "One-shot / sound effect (no gap)" },
  "\u8FD9\u4EF6\u4E50\u5668\uFF1A{what}": { en: "Instrument: {what}" },
  "\u7B2C\u4E8C\u884C\u8D77\u5199 {ab}": { en: "from the 2nd system: {ab}" },
  "\u6539\u8FD9\u4E00\u6863": { en: "Change this level" },
  "{d} \u6BD4 {next} \u8FD8\u54CD": { en: "{d} is louder than {next}" },
  "\uFF1B": { en: "; " },
  "MIDI \u529B\u5EA6": { en: "MIDI velocity" },
  "\u73B0\u5728\u7684\u9ED8\u8BA4": { en: "Current default" },
  "\u54CD\u5EA6 dB": { en: "Loudness dB" },
  "\u7B2C\u51E0\u4EFD\u5F55\u97F3": { en: "Recording #" },
  "\u7A81\u5F3A": { en: "Sforzando" },
  "\u5F3A\u540E\u5373\u5F31": { en: "Forte-piano" },
  "{p}\u524D {mark}": { en: "before {p}: {mark}" },
  "\u8FD9\u4F4D": { en: "This one" },
  "\u6EDA\u594F\u7684\u97F3\u4E0A\u6309\u529B\u5EA6\u505A\uFF08\u58F0\u97F3\u8F7D\u597D\u540E\u663E\u793A\u7EA6\u51E0\u6863\uFF09\u3002": { en: "On rolled notes this is done with velocity (shown once the sound is loaded)." },
  "\u6EDA\u594F\u7684\u97F3\u4E0A\u6309\u529B\u5EA6\u505A\uFF1Amf\uFF08{mf}\uFF09\u4F4E {d} dB \u2248 \u529B\u5EA6 {to}\uFF08\u7EA6 {n} \u6863\u529B\u5EA6\uFF09\u3002": { en: "On rolled notes this is done with velocity: {d} dB below mf ({mf}) \u2248 velocity {to} (about {n} dynamic steps)." },
  "\u58F0\u97F3\u5D4C\u5728\u6B4C\u91CC\uFF08{n}\uFF09{library}": { en: "Sound embedded in the song ({n}){library}" },
  "\uFF0C\u6765\u81EA\u5BB6\u65CF\u97F3\u6E90\u5E93\u7684 {name}": { en: ", from {name} in the family sound library" },
  "\uFF0C\u6765\u81EA {name}": { en: ", from {name}" },
  "\u58F0\u97F3\u6CA1\u968F\u8FD9\u9996\u6B4C\u5E26\u6765\uFF0C\u6240\u4EE5\u6CA1\u4EBA\u4E0A\u573A\u2014\u2014\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": { en: "The sound didn't come with this song, so nobody is on stage \u2014 pick another \u201CWho performs\u201D" },
  "\u5F31\u5F15\u7528\uFF1A\u6B4C\u91CC\u4E0D\u5E26\u58F0\u97F3\uFF0C\u7528\u65F6\u4ECE\u300C{name}\u300D\u627E\uFF08{found}\uFF09": { en: "Weak reference: the song carries no sound; found from \u201C{name}\u201D when used ({found})" },
  "\u672C\u6B21\u5DF2\u627E\u5230": { en: "found this session" },
  "\u5BB6\u65CF\u97F3\u6E90\u5E93 / \u8BBE\u5907\u7F13\u5B58 / \u4F60\u7684\u6587\u4EF6": { en: "family sound library / device cache / your files" },
  "\u627E\u6587\u4EF6\u2026": { en: "Find file\u2026" },
  "\u8FD9\u4E00\u7248\u4E0D\u8BA4\u8BC6\u7684\u300C{k}\u300D": { en: "\u201C{k}\u201D (not known to this version)" },
  "\uFF08\u5173\u7740\uFF09": { en: " (off)" },
  "\uFF08\u6CA1\u6709\uFF09": { en: "(none)" },
  "\u8FD9\u4E00\u6863\u8F7B\u4E00\u70B9\uFF08\u2212{s}\uFF09": { en: "This level a little softer (\u2212{s})" },
  "\u8FD9\u4E00\u6863\u54CD\u4E00\u70B9\uFF08+{s}\uFF09": { en: "This level a little louder (+{s})" },
  "\u70B9\u8868\u91CC\u7684\u4E00\u683C\uFF0C\u6539\u90A3\u4E00\u6863": { en: "Click a cell in the table to change that level" },
  "\u54CD\u5EA6": { en: "Loudness" },
  "\u8FD9\u4F4D\u6F14\u594F\u8005\u5C0F\u58F0 1 dB": { en: "This performer 1 dB softer" },
  "\u5927\u58F0 1 dB": { en: "1 dB louder" },
  "\u8FD9\u4F4D\u6F14\u594F\u8005\u81EA\u5DF1\u7684\u97F3\u91CF\uFF1A\u8FD9\u4E2A\u5E93\u7684\u9ED8\u8BA4\u662F {d}\u3002\u5E93\u548C\u5E93\u4E4B\u95F4\u5C31\u5728\u8FD9\u4E00\u4E2A\u6570\u4E0A\u5BF9\u9F50\uFF0C\u51E0\u4E2A\u58F0\u90E8\u53E0\u5728\u4E00\u8D77\u4E5F\u4E0D\u9876\u5230\u5929\u82B1\u677F\u3001\u4E0D\u628A\u58F0\u97F3\u538B\u53D8\u6837\uFF1B\u6DF7\u97F3\u53F0\u7684\u63A8\u5B50\u662F\u8FD9\u9996\u6B4C\u7684\u51B3\u5B9A\uFF0C\u53E6\u7B97": { en: "This performer's own volume: this library's default is {d}. Libraries are matched to each other on this one number, and stacked parts don't hit the ceiling and get squashed; the mixer fader is a decision for this song and is separate" },
  "\u8FD9\u4F4D\u81EA\u5DF1\u7684\u6548\u679C": { en: "This performer\u2019s own effects" },
  "\u8DDF\u7740\u8FD9\u4F4D\u6F14\u594F\u8005\u8D70\u7684\u6548\u679C\uFF08\u7434\u7BB1\u3001\u97F3\u7BB1\u8FD9\u4E00\u7C7B\uFF09\uFF1A\u51FA\u58F0\u65F6\u6392\u5728\u6DF7\u97F3\u53F0\u4E0A\u8FD9\u6761\u8F68\u7684\u6548\u679C\u524D\u9762\uFF1B\u6362\u4E00\u4F4D\u4E0A\u573A\uFF0C\u5C31\u6362\u6210\u90A3\u4E00\u4F4D\u8EAB\u4E0A\u7684\u3002\u8FD9\u91CC\u53EA\u5217\u51FA\u6765\uFF0C\u8FD9\u4E00\u7248\u4E0D\u80FD\u5728\u8FD9\u91CC\u6539": { en: "Effects that travel with this performer (the instrument body, an amp and the like): in the sound they come before this track\u2019s effects on the mixer; when someone else takes the stage, theirs are used instead. Listed here only \u2014 this version can\u2019t edit them here." },
  "\u7F1D\u5C0F 10 ms\uFF08\u66F4\u8FDE\uFF09": { en: "Gap 10 ms smaller (more legato)" },
  "\u7F1D\u5927 10 ms\uFF08\u66F4\u65AD\uFF09": { en: "Gap 10 ms larger (more detached)" },
  "\u4E0D\u5199\u8BB0\u53F7\u7684\u97F3\u548C\u4E0B\u4E00\u4E2A\u97F3\u4E4B\u95F4\u7559\u7684\u7F1D\uFF1A0 = \u8FDE\u7740\u3002{d}\u8FDE\u7EBF\uFF08\u8FDE\u594F\uFF09\u3001\u4FDD\u6301\u7684\u97F3\u4E0D\u7559\u7F1D\uFF1B\u547C\u5438 = \u8FD9\u91CC\u65AD\u5F00\uFF1B\u8DF3\u97F3\u53E6\u7B97": { en: "Gap left between unmarked notes and the next note: 0 = connected. {d}Slurred (legato) and tenuto notes leave no gap; a breath separates here; staccato is separate" },
  "{label}\uFF1A\u9ED8\u8BA4 {p} ms\uFF08\u97F3\u4E50\u76EE\u5F55\u7ED9\u7684\uFF0C\u6309\u97F3\u8272\u9010\u4E2A\uFF09\u3002": { en: "{label}: default {p} ms (from the music catalog, per sound)." },
  "\u6BCF\u79D2 {n} \u4E0B": { en: "{n} per second" },
  "\u6EDA\u594F\u7A00\u4E00\u70B9\uFF08\u6BCF\u79D2\u5C11 2 \u4E0B\uFF09": { en: "Slower roll (2 fewer hits per second)" },
  "\u6EDA\u594F\u5BC6\u4E00\u70B9\uFF08\u6BCF\u79D2\u591A 2 \u4E0B\uFF09": { en: "Faster roll (2 more hits per second)" },
  "\u8C31\u4E0A\u7B26\u5E72\u5E26\u4E09\u9053\u659C\u7EBF\u7684\u97F3 = \u6EDA\u594F\uFF1A\u6574\u4E2A\u97F3\u6309\u8FD9\u4E2A\u5BC6\u5EA6\u6572\u6EE1\uFF1B\u6BCF\u4E00\u4E0B\u6309\u6572\u4E0B\u53BB\u90A3\u4E00\u523B\u7684\u529B\u5EA6\u2014\u2014\u6E10\u5F3A\u6E10\u5F31 / \u6E10\u5230\u3001\u97F3\u5185\u8D77\u4F0F\uFF08\u9F13\u4E5F\u884C\uFF09\u3001\u5F3A\u540E\u5373\u5F31\u90FD\u5728\u6BCF\u4E00\u4E0B\u7684\u529B\u5EA6\u91CC\uFF0C\u91CD\u97F3\u8FD9\u4E00\u7EC4\u53EA\u7B97\u7B2C\u4E00\u4E0B\u3001\u5E7D\u7075\u97F3 / \u5F31\u5316\u6BCF\u4E00\u4E0B\u90FD\u7B97\u3002\u6BCF\u4E00\u4E0B\u90FD\u662F\u6574\u4E0B\u6572\uFF1A\u60F3\u8F7B\u4E00\u70B9\uFF0C\u5C31\u5728\u8FD9\u4E2A\u97F3\u4E0A\u518D\u52A0\u5E7D\u7075\u97F3\u3002\u9ED8\u8BA4\uFF1A\u9F13\u7C7B\u4E00\u5F8B 12\uFF0C\u6709\u97F3\u9AD8\u7684 14\uFF08\u6BCF\u79D2\uFF09\u3002": { en: "A note with three slashes through the stem is a roll: the whole note is filled at this density; each hit uses the dynamic at the moment it lands \u2014 crescendos / ramps, in-note swells (drums too) and fp are all in each hit's velocity; accents and the like only on the first hit, ghost / unstressed on every hit. Every hit is a full stroke: for a softer roll, also mark the note as a ghost note. Defaults: drums 12, pitched 14 (per second)." },
  "\u97F3\u5185\u8D77\u4F0F\u591A\u6DF1": { en: "In-note swell depth" },
  "\u6D45\u4E00\u70B9\uFF08\u22123 dB\uFF09": { en: "Shallower (\u22123 dB)" },
  "\u6DF1\u4E00\u70B9\uFF08+3 dB\uFF09": { en: "Deeper (+3 dB)" },
  "\u97F3\u5185\u6E10\u5F3A / \u6E10\u5F31 / \u9F13\u8D77\u7684\u6DF1\u6D45\uFF1A\u5199\u7684\u529B\u5EA6\u662F\u6700\u9AD8\u70B9\uFF0C< \u4ECE\u4F4E {d} dB \u957F\u5230\u5199\u7684\u529B\u5EA6\u3001> \u6536\u5230\u4F4E {d} dB\u3001<> \u4E24\u5934\u4F4E {d} dB\u3002{vel}": { en: "How deep in-note crescendo / decrescendo / swell go: the written dynamic is the peak; < grows from {d} dB below to the written dynamic, > falls to {d} dB below, <> is {d} dB below at both ends. {vel}" },
  "\u7F3A\u7684\u6570": { en: "Missing values" },
  "\u8FD9\u4F4D\u4E50\u624B\u8EAB\u4E0A\u8FD9\u51E0\u4E2A\u6570\u7F3A\u4E86\u6216\u8005\u4E0D\u662F\u6570\uFF1A\u6CA1\u6709\u51FA\u58F0\uFF08\u5728\u300C\u4E0D\u51FA\u58F0\u300D\u6E05\u5355\u91CC\uFF09\uFF0C\u6309\u952E\u8BD5\u542C\u4E5F\u4E0D\u54CD\uFF1B\u97F3\u548C\u97F3\u4E4B\u95F4\u3001\u529B\u5EA6\u8BB0\u53F7\u3001\u8BB0\u53F7\u600E\u4E48\u6F14\u8FD9\u51E0\u6837\u4E0D\u62FF\u5B83\u7B97\uFF0C\u5148\u4E0D\u663E\u793A\u3002\u8981\u8BA9\u5B83\u51FA\u58F0\uFF1A\u70B9\u4E0A\u9762\u300C\u6362\u4E50\u5668\u2026\u300D\u6362\u4E00\u4F4D\u4E0A\u573A\uFF0C\u65B0\u4E0A\u573A\u7684\u90A3\u4E00\u4F4D\u6309\u73B0\u5728\u7684\u9ED8\u8BA4\u5199\u5168": { en: "These values on this performer are missing or not numbers: it makes no sound (it is on the \u201Cnot sounding\u201D list) and key audition is silent too; gaps between notes, dynamic marks and how marks are played are not computed from it and are hidden for now. To make it sound: tap \u201CChange instrument\u2026\u201D above and put another performer on stage; the new one is written in full from the current defaults" },
  "\u529B\u5EA6\u8BB0\u53F7 \u2192 \u54CD\u5EA6\uFF1A\u8FD9\u4F4D\u8EAB\u4E0A\u5E26\u7740\u4E00\u5F20\u8868\uFF0C\u6BCF\u4E2A\u529B\u5EA6\u8BB0\u53F7\u4E58\u591A\u5C11 dB\u3002\u6E10\u5F3A\u6E10\u5F31\u5728 dB \u4E0A\u5E73\u5747\u5730\u53D8\uFF1B\u540E\u9762\u6CA1\u5199\u529B\u5EA6\u8BB0\u53F7\u7684\uFF0C\u8D70\u5230\u8868\u91CC\u7684\u4E0B\u4E00\u6863\u3002\u6CA1\u6709\u5F55\u97F3\u5C42\uFF0C\u53EA\u53D8\u54CD\u5EA6\uFF1A{table}": { en: "Dynamic markings \u2192 loudness: this performer carries a table of how many dB each marking applies. Hairpins change evenly in dB; with no marking after them, they go to the next step in the table. No recorded layers \u2014 only loudness changes: {table}" },
  "\u529B\u5EA6\u8BB0\u53F7 \u2192 MIDI \u529B\u5EA6\uFF08\u91CD\u97F3 +{accentVel}\u3001\u5F3A\u97F3 +{marcatoVel}\uFF1B\u522B\u7684\u8BB0\u53F7\u89C1\u4E0B\u9762\u300C\u8BB0\u53F7\u600E\u4E48\u6F14\u300D\uFF09\uFF1A{table}": { en: "Dynamics \u2192 MIDI velocity (accent +{accentVel}, marcato +{marcatoVel}; other marks under \u201CHow marks are played\u201D below): {table}" },
  "\u8BB0\u53F7\u600E\u4E48\u5531": { en: "How marks are sung" },
  "\u8C31\u4E0A\u7684\u8BB0\u53F7\u53D8\u6210\u5531\u6CD5\u6838\u5FC3\u8BA4\u7684\u5B57\u524D\u8BB0\u53F7\uFF08^ = \u987F\u4E00\u4E0B\u4E0D\u6362\u6C14\uFF0Cv = \u6362\u6C14\uFF09\uFF1A{table}": { en: "Marks in the score become the singing core\u2019s before-syllable marks (^ = short stop without a breath, v = breath): {table}" },
  "\u6CA1\u5199\u6B4C\u8BCD\u7684\u97F3\u5531\u4EC0\u4E48\uFF08\u8FD9\u4E00\u4F4D\u7684\uFF09": { en: "What notes without lyrics are sung as (this performer\u2019s own)" },
  "\u9AD8\u7EA7\uFF1A\u5531\u6CD5\u6838\u5FC3\u7684\u65CB\u94AE": { en: "Advanced: singing core knobs" },
  "\u8FD9\u4E00\u7248\u51FA\u4E0D\u4E86\u58F0\uFF08\u522B\u7684\u8F6F\u4EF6\u539F\u6765\u7684\u4E50\u5668\uFF09\uFF1A\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": { en: "This version can't sound it (the other software's original instrument): pick another \u201CWho performs\u201D" },
  "\u548C\u73B0\u5728\u7684\u9ED8\u8BA4\u4E0D\u4E00\u6837\u7684\u6709 {n} \u5904\uFF1A": { en: "{n} differ from the current default: " },
  "\u548C\u73B0\u5728\u7684\u9ED8\u8BA4\u90FD\u4E00\u6837": { en: "All the same as the current default" },
  "\uFF08\u8FD8\u6709 {n} \u884C\u8981\u7B49\u97F3\u4E50\u76EE\u5F55\u8F7D\u597D\u518D\u6BD4\uFF09": { en: " ({n} more rows will be compared once the instrument catalog has loaded)" },
  "\u56DE\u5230\u8C31\uFF08Esc\uFF09": { en: "Back to the score (Esc)" },
  "\u2190 \u8C31": { en: "\u2190 Score" },
  "\u4E50\u5668": { en: "Instruments" },
  "\u6362\u4E00\u4E2A\u58F0\u90E8": { en: "Switch part" },
  "\u8BD5\u542C\u952E\u76D8\uFF1A\u5F00 / \u5173": { en: "Audition keys: on / off" },
  "\u53F0\u4E0A": { en: "On stage" },
  "\u6F14\u594F\u8005\u548C\u4ED6\u624B\u91CC\u7684\u7434\uFF1B\u540D\u5B57\u4E0D\u4E0A\u8C31": { en: "The performer and the instrument they hold; this name isn't on the score" },
  "\u4E50\u5668\u76EE\u5F55\uFF1A\u9876\u4E0A\u662F\u8FD9\u9996\u6B4C\u91CC\u7528\u8FC7\u7684\uFF0C\u4E0B\u9762\u6309\u66F2\u98CE / \u5E74\u4EE3 / \u65CF\u6D4F\u89C8\uFF1B\u53F3\u8FB9\u7684\u952E\u76D8\u8BD5\u542C\uFF0C\u9009\u597D\u5C31\u6362\u4E0A": { en: "Instrument catalog: what this song has used is at the top, browse below by style / era / family; try on the keys at the right, pick one and it\u2019s on" },
  "\u6362\u4E50\u5668\u2026": { en: "Change instrument\u2026" },
  "{who} \u600E\u4E48\u6F14": { en: "How {who} performs" },
  "\u53F3\u8FB9\u7684\u952E\u76D8\u5F39\u7684\u5C31\u662F\u53F0\u4E0A\u8FD9\u4F4D\uFF0C\u6539\u4E86\u9A6C\u4E0A\u80FD\u8BD5": { en: "The keys at the right play whoever's on stage; changes can be tried right away" },
  "\u8C31\u4E0A\u5199\u300C{rn}\u300D": { en: "Shown on the score as \u201C{rn}\u201D" },
  "MusicXML \u7684\u4E50\u5668\u4EE3\u53F7\uFF1A\u6B4C\u91CC\u6CA1\u5199": { en: "MusicXML instrument code: not written in the song" },
  "\u6539\u540D\u5728\u58F0\u90E8\u7BA1\u7406": { en: "rename it under Parts" },
  "\u300C{rn}\u300D\u529B\u5EA6\u8BB0\u53F7 {d} \u2192 {v}": { en: "\u201C{rn}\u201D dynamic {d} \u2192 {v}" },
  "\u300C{rn}\u300D{what}\u6539\u56DE\u73B0\u5728\u7684\u9ED8\u8BA4": { en: "\u201C{rn}\u201D: {what} changed back to the current default" },
  "\u300C{rn}\u300D\u97F3\u548C\u97F3\u4E4B\u95F4 {p} ms": { en: "\u201C{rn}\u201D between notes {p} ms" },
  "\u300C{rn}\u300D\u97F3\u5185\u8D77\u4F0F {d} dB": { en: "\u201C{rn}\u201D in-note swell {d} dB" },
  "\u300C{rn}\u300D\u6EDA\u594F\u6BCF\u79D2 {n} \u4E0B": { en: "\u201C{rn}\u201D roll: {n} per second" },
  "\u300C{rn}\u300D\u54CD\u5EA6\u6821\u51C6 {next} dB": { en: "\u201C{rn}\u201D loudness calibration {next} dB" },
  "\u5C0F\u6708\u76F8\u7684\u58F0\u97F3": { en: "Tsukuyomi-chan\u2019s voice" },
  "\u8FD0\u884C\u5F15\u64CE": { en: "Runtime engine" },
  "\u65E5\u8BED\u8BFB\u97F3": { en: "Japanese readings" },
  "\u4E2D\u6587\u8BFB\u97F3": { en: "Chinese readings" },
  "\u82F1\u6587\u8BFB\u97F3": { en: "English readings" },
  "\u5B58\u5728\u8FD9\u4E2A\u7F51\u5740\u4E0B\uFF0C\u6B63\u5F0F\u7248\u548C\u5F00\u53D1\u7248\u5171\u7528\u8FD9\u4E00\u4EFD\uFF1B\u5728\u8FD9\u91CC\u5220\u4E86\uFF0C\u53E6\u4E00\u4E2A\u7248\u672C\u4E5F\u8981\u91CD\u65B0\u4E0B\u8F7D\u3002": { en: "Stored under this web address; the release and dev versions share this copy. Delete it here and the other version has to download it again too." },
  "\u88C5\u7740 = \u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6CA1\u7F51\u4E5F\u80FD\u7528\uFF1B\u6CA1\u88C5 = \u7528\u5230\u65F6\u4F1A\u81EA\u5DF1\u4E0B\u8F7D\uFF1B\u4F60\u5220\u4E86 = \u4E0D\u4F1A\u81EA\u5DF1\u4E0B\u8F7D\uFF0C\u7528\u5B83\u7684\u58F0\u90E8\u4E0D\u51FA\u58F0\uFF0C\u70B9\u300C\u88C5\u56DE\u6765\u300D\u624D\u4E0B\u3002": { en: "Installed = on this device, works offline; Not installed = downloads by itself when needed; Deleted by you = never downloads by itself, voices using it are silent until you press Reinstall." },
  "\u5B83\u7684\u7F13\u5B58\u5728\u300C\u7EF4\u62A4\u300D\u91CC": { en: "Its cache is under Upkeep" },
  "\u5728\u6587\u4EF6\u5939\u91CC": { en: "In the folder" },
  "\u88C5\u7740 \xB7 {size}": { en: "Installed \xB7 {size}" },
  "\u4F60\u5220\u4E86 \xB7 \u4E0D\u4F1A\u81EA\u5DF1\u4E0B\u8F7D": { en: "Deleted by you \xB7 won\u2019t download by itself" },
  "\u6CA1\u88C5 \xB7 \u7528\u5230\u65F6\u4F1A\u81EA\u5DF1\u4E0B\u8F7D": { en: "Not installed \xB7 downloads by itself when needed" },
  "\u88C5\u4E86\u4E00\u90E8\u5206\uFF08{have} / {total}\uFF09\xB7 \u7528\u5230\u65F6\u4F1A\u81EA\u5DF1\u4E0B\u8F7D": { en: "Partly installed ({have} / {total}) \xB7 downloads by itself when needed" },
  "\uFF08\u6CA1\u4E0B\uFF09": { en: " (not downloaded)" },
  "\u5531\u6B4C\u7684\u90A3\u4E00\u4F4D\uFF1A\u5979\u7684\u58F0\u97F3\uFF0C\u548C\u5531\u7684\u65F6\u5019\u8981\u7528\u7684\u51E0\u6837\uFF08\u8FD0\u884C\u5F15\u64CE\u3001\u65E5\u8BED / \u4E2D\u6587 / \u82F1\u6587\u8BFB\u97F3\uFF09\u3002": { en: "The singer: her voice, plus what she needs to sing (runtime engine; Japanese / Chinese / English readings)." },
  "\u7EC4\u6210\uFF08\u5305\u7684\u539F\u540D\uFF09\uFF1A": { en: "Made of (original package names): " },
  "\u7248\u6743\u548C\u4F7F\u7528\u89C4\u5219": { en: "Copyright and terms of use" },
  "\u5168\u6587\u2026": { en: "Full text\u2026" },
  "\u4ECE\u672C\u673A\u6587\u4EF6\u5BFC\u5165": { en: "Import from a local file" },
  "\u73B0\u5728\u4E0B\u8F7D": { en: "Download now" },
  "\u6765\u6E90": { en: "Source" },
  "\u6062\u590D\u9ED8\u8BA4": { en: "Reset to default" },
  "\u4E00\u4E2A\u6587\u4EF6\uFF08{size}\uFF09\uFF0C\u4E0D\u662F AI \u6A21\u578B\uFF1B\u6B4C\u91CC\u7528\u5230\u7684\u90A3\u51E0\u4EF6\u4F1A\u5207\u4E0B\u6765\u6253\u5305\u8FDB\u6B4C\uFF0C\u8FD9\u91CC\u53EA\u662F\u8D27\u67B6\u3002": { en: "One file ({size}), not an AI model; the instruments a song uses are cut out and packed into the song \u2014 this is just the shelf." },
  "{name} \u7B49 {n} \u4EF6": { en: "{name} and {n} more" },
  "\u6CA1\u6709": { en: "None" },
  "\u8FD9\u9996\u6B4C\u91CC\uFF1A{names}\uFF08{how}\uFF09": { en: "In this song: {names} ({how})" },
  "\u4E5F\u6253\u5305\u7740": { en: ", also packed" },
  "\u5F15\u7528\u7740": { en: "referenced" },
  "\u4F60\u81EA\u5DF1\u52A0\u7684\u97F3\u8272\u6587\u4EF6": { en: "Sound files you added" },
  "\u4ECE\u81EA\u5DF1\u7684 .sf2 \u9009\u4E50\u5668\u65F6\u3001\u6216\u8005\u300C\u5168\u90E8\u89E3\u5305\u300D\u65F6\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7684\u5C0F\u5757\uFF08\u540D\u5B57\u662F\u4ECE\u8FD9\u5757\u6587\u4EF6\u91CC\u8BFB\u7684\uFF09\u3002\u4E0D\u662F\u81EA\u5E26\u7684\uFF1A\u5220\u4E86\u5C31\u6CA1\u4E86\uFF0C\u6CA1\u6709\u539F\u6765\u7684 .sf2 \u5C31\u627E\u4E0D\u56DE\u6765\u3002": { en: "Small pieces kept on this device when you picked an instrument from your own .sf2 or used Unpack all (the name is read from the piece itself). Not built in: once deleted it is gone, and without the original .sf2 it cannot be recovered." },
  "\u5FF5\u8FC7\u7684\u53E5\u5B50\uFF1A\u5FF5\u8FC7\u7684\u6B4C\u8BCD\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u8DE8\u6B4C\u5171\u7528\u3001\u91CD\u5F00 app \u4E5F\u5728\uFF0C\u6E05\u4E86\u53EA\u662F\u8981\u91CD\u5FF5\u3002\u5F15\u64CE\uFF1A\u5531\u6B4C\u7684\u7A0B\u5E8F\u5360\u7684\u5185\u5B58\u53EA\u6DA8\u4E0D\u843D\uFF0C\u6E05 = \u91CD\u5F00\u5B83\u3001\u5185\u5B58\u8FD8\u56DE\u53BB\uFF08\u5FF5\u8FC7\u7684\u53E5\u5B50\u4E0D\u4E22\uFF09\u3002": { en: "Spoken lyrics: lyrics already read aloud, kept on this device, shared across songs and kept after restarting the app; clearing only means reading them again. Engine: the singing program\u2019s memory only grows; clearing restarts it and gives the memory back (spoken lyrics are kept)." },
  "\u5FF5\u8FC7\u7684\u53E5\u5B50\uFF1A{bytes} / \u9884\u7B97 {budget}\uFF0C{entries} \u6761": { en: "Spoken lyrics: {bytes} / budget {budget}, {entries} entries" },
  "\u5FF5\u8FC7\u7684\u53E5\u5B50\uFF1A\u2026": { en: "Spoken lyrics: \u2026" },
  "\u6E05": { en: "Clear" },
  "\u5F15\u64CE\uFF1A\u8FD8\u6CA1\u8D77\u6765": { en: "Engine: not started" },
  "\u5F15\u64CE\uFF1A\u5185\u5B58 {size}": { en: "Engine: memory {size}" },
  "\u4E50\u5668\u97F3\u8272\u5E93": { en: "Instrument library" },
  "\u8F7D\u8FDB\u5185\u5B58\u7684\u6574\u5305\uFF08\u6700\u591A\u4E24\u4EFD\uFF09\uFF1B\u6E05\u4E86\u53EA\u662F\u4E0B\u6B21\u7528\u5230\u65F6\u4ECE\u8BBE\u5907\u4E0A\u518D\u8BFB\u4E00\u6B21\uFF0C\u6587\u4EF6\u4E0D\u52A8\u3002": { en: "Whole libraries loaded into memory (at most two); clearing only means reading them from this device again next time; the file stays." },
  "\u5185\u5B58\u91CC\uFF1A{size}": { en: "In memory: {size}" },
  "\u5185\u5B58\u91CC\uFF1A\u6CA1\u5360": { en: "In memory: none" },
  "\u6E05\u5185\u5B58": { en: "Clear memory" },
  "\u5BFC\u51FA\u6216\u300C\u6E32\u67D3\u5230\u7F13\u5B58\u300D\u65F6\u653E\u8FDB\u6765\u7684\u6574\u9996\u6B4C\u58F0\uFF0C\u6B4C\u5E93\u5C01\u9762\u4E0A\u7684 \u25B6 \u9760\u5B83\uFF1B\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3001\u4E0D\u540C\u6B65\uFF0C\u6700\u591A {n} \u9996\uFF0C\u6EE1\u4E86\u4E22\u6700\u4E45\u6CA1\u542C\u7684\uFF1B\u6E05\u4E86\u53EA\u662F\u8981\u91CD\u6E32\u3002": { en: "Whole-song audio saved when exporting or using Render to cache; the \u25B6 on library covers uses it. Only on this device, not synced, at most {n} songs, the least recently played go first when full; clearing only means rendering again." },
  "\u8FD9\u4E00\u7248\u7684\u6E32\u67D3\u6838\u5FC3\u662F {v}\uFF1B\u6807\u300C\u65E7\u7248\u672C\u6E32\u7684\u300D= \u66F4\u65E9\u7684\u6E32\u67D3\u6838\u5FC3\u6E32\u7684\uFF0C\u7167\u6837\u80FD\u542C\uFF1A": { en: "This version\u2019s render core is {v}; Rendered by an older version = rendered by an earlier render core, still playable:" },
  "\uFF08\u73B0\u5728\u6CA1\u6709\uFF09": { en: " (none right now)" },
  "\u8FD8\u6CA1\u6709\u8BB0\u7740\u7684": { en: "Nothing kept yet" },
  "{n} \u9996 \xB7 {size}": { en: "{n} {n|song|songs} \xB7 {size}" },
  "\u6E05\u65E7\u7248\u672C\u6E32\u7684\uFF08{n} \u6761\uFF0C\u5171 {size}\uFF09": { en: "Clear older renders ({n}, {size} total)" },
  "{title} \xB7 {secs} \u79D2 \xB7 {size} \xB7 {date}": { en: "{title} \xB7 {secs} s \xB7 {size} \xB7 {date}" },
  "\u65E7\u7248\u672C\u6E32\u7684": { en: "Rendered by an older version" },
  "\u6B4C\u5E93\u91CC\uFF1A{names}": { en: "In the library: {names}" },
  "\u6E32\u67D3\u597D\u7684\u58F0\u97F3": { en: "Rendered audio" },
  "\u58F0\u97F3\u8BBE\u5907": { en: "Audio device" },
  "\u58F0\u97F3\u4E0D\u5BF9\u52B2\u7684\u65F6\u5019\u6309\u4E00\u4E0B\uFF08\u6309\u952E\u6709\u5EF6\u8FDF\u3001\u6CA1\u6709\u58F0\u97F3\uFF09\uFF1A\u628A\u901A\u5411\u626C\u58F0\u5668\u7684\u90A3\u4E00\u6BB5\u6362\u6210\u65B0\u7684\uFF0C\u6392\u7740\u6CA1\u64AD\u5B8C\u7684\u58F0\u97F3\u4E00\u8D77\u4E22\u6389\u3002\u6B63\u5728\u54CD\u7684\u58F0\u97F3\u4F1A\u65AD\u4E00\u4E0B": { en: "Press this when the sound is off (keys respond late, or there is no sound): it rebuilds the path to the speaker and throws away any audio still waiting to play. Anything sounding right now will cut out for a moment" },
  "\u8F6F\u4EF6": { en: "Software" },
  "\u300C\u6E05\u7F13\u5B58\u91CD\u542F\u300D= \u5361\u5728\u65E7\u7248\u672C\u65F6\u7528\uFF1A\u6E05\u6389\u8FD9\u4E2A app \u81EA\u5DF1\u7684\u79BB\u7EBF\u7F13\u5B58\u518D\u91CD\u5F00\uFF1B\u6B4C\u3001\u6A21\u578B\u5305\u3001\u97F3\u6E90\u90FD\u4E0D\u52A8\u3002": { en: "Clear cache and restart = for when you are stuck on an old version: clears this app\u2019s own offline cache and reopens it; songs, model packs and sounds are untouched." },
  "\u6E05\u7F13\u5B58\u91CD\u542F": { en: "Clear cache and restart" },
  "\u9ED1\u5323\u5B50\uFF1A\u51FA\u9519\u4E86\u628A\u8FD9\u4E2A\u53D1\u7ED9\u5F00\u53D1\u8005\uFF1B\u4E0D\u4E0A\u4F20\uFF0C\u53EA\u6709\u70B9\u300C\u590D\u5236 / \u5206\u4EAB\u300D\u624D\u79BB\u5F00\u8BBE\u5907": { en: "Black box: send this to the developer if something breaks; never uploaded, it only leaves the device when you tap Copy / Share" },
  "\u4E0B\u8F7D .txt": { en: "Download .txt" },
  "\u5206\u4EAB\u2026": { en: "Share\u2026" },
  "\u4E0B\u8F7D\u5C0F\u6708\u76F8 {p}%": { en: "Downloading Tsukuyomi-chan {p}%" },
  "\u4E0B\u8F7D\u4E50\u5668\u97F3\u8272\u5E93 {p}%": { en: "Downloading the instrument library {p}%" },
  "\u5C0F\u6708\u76F8\u88C5\u597D\u4E86": { en: "Tsukuyomi-chan installed" },
  "\u4E50\u5668\u97F3\u8272\u5E93\u88C5\u597D\u4E86": { en: "Instrument library installed" },
  "\u6CA1\u88C5\u4E0A\uFF1A{e}": { en: "Not installed: {e}" },
  "\u6CA1\u6E05\u6389\uFF1A{e}": { en: "Not cleared: {e}" },
  "\u73B0\u5728\u6253\u5F00\u7684\u6B4C\u91CC\uFF0C{names} \u4F1A\u4E0D\u51FA\u58F0\u3002": { en: "In the song that is open now, {names} will go silent." },
  "\u73B0\u5728\u6253\u5F00\u7684\u6B4C\u91CC\u6CA1\u6709\u58F0\u90E8\u4F1A\u56E0\u6B64\u4E0D\u51FA\u58F0\u3002": { en: "No voice in the song that is open now goes silent because of this." },
  "\u5220\u6389\u5C0F\u6708\u76F8\uFF1F": { en: "Delete Tsukuyomi-chan?" },
  "\u5360 {size}\u3002\u5220\u4E86\u4E4B\u540E\u4E0D\u4F1A\u81EA\u5DF1\u4E0B\u8F7D\uFF0C\u7528\u5230\u5979\u7684\u58F0\u90E8\u4E0D\u51FA\u58F0\uFF0C\u76F4\u5230\u4F60\u70B9\u300C\u88C5\u56DE\u6765\u300D\uFF08\u8981\u8054\u7F51\uFF09\uFF1B\u5FF5\u8FC7\u7684\u53E5\u5B50\u4E00\u8D77\u6E05\u6389\u3002{silenced}{shared}": { en: "Takes {size}. After deleting it won\u2019t download by itself; voices using her are silent until you press Reinstall (needs internet). Spoken lyrics are cleared as well. {silenced}{shared}" },
  "\u6CA1\u5220\u6389\uFF1A{e}": { en: "Not deleted: {e}" },
  "\u5FF5\u8FC7\u7684\u53E5\u5B50\u6CA1\u6E05\u6389\uFF1A{e}": { en: "Spoken lyrics not cleared: {e}" },
  "\u5C0F\u6708\u76F8\u5220\u4E86\uFF1A\u4E0D\u4F1A\u81EA\u5DF1\u4E0B\u8F7D\uFF0C\u7528\u5230\u5979\u7684\u58F0\u90E8\u4E0D\u51FA\u58F0\uFF1B\u8981\u7528\u65F6\u70B9\u300C\u88C5\u56DE\u6765\u300D": { en: "Tsukuyomi-chan deleted: she won\u2019t download by itself and voices using her are silent; press Reinstall when you need her" },
  "\u5220\u6389\u4E50\u5668\u97F3\u8272\u5E93\uFF1F": { en: "Delete the instrument library?" },
  "\u5360 {size}\u3002\u5220\u4E86\u4E4B\u540E\u4E0D\u4F1A\u81EA\u5DF1\u4E0B\u8F7D\uFF1A\u6B4C\u91CC\u6253\u5305\u7740\u58F0\u97F3\u7684\u7167\u6837\u54CD\uFF0C\u53EA\u5F15\u7528\u5B83\u7684\u4E0D\u51FA\u58F0\uFF0C\u76F4\u5230\u4F60\u70B9\u300C\u88C5\u56DE\u6765\u300D\uFF08\u8981\u8054\u7F51\uFF09\u3002{silenced}{shared}": { en: "Takes {size}. After deleting it won\u2019t download by itself: voices whose sound is packed into the song keep playing, voices that only reference it are silent until you press Reinstall (needs internet). {silenced}{shared}" },
  "\u4E50\u5668\u97F3\u8272\u5E93\u5220\u4E86\uFF1A\u4E0D\u4F1A\u81EA\u5DF1\u4E0B\u8F7D\uFF0C\u53EA\u5F15\u7528\u5B83\u7684\u58F0\u90E8\u4E0D\u51FA\u58F0\uFF1B\u8981\u7528\u65F6\u70B9\u300C\u88C5\u56DE\u6765\u300D": { en: "Instrument library deleted: it won\u2019t download by itself and voices that only reference it are silent; press Reinstall when you need it" },
  "\u5220\u6389\u8FD9\u4E2A\u97F3\u8272\u6587\u4EF6\uFF1F": { en: "Delete this sound file?" },
  "\u5360 {size}\u3002\u4E0D\u662F\u81EA\u5E26\u7684\uFF1A\u5220\u4E86\u5C31\u6CA1\u4E86\uFF0C\u6CA1\u6709\u539F\u6765\u7684 .sf2 \u5C31\u627E\u4E0D\u56DE\u6765\u3002{silenced}": { en: "Takes {size}. Not built in: once deleted it is gone, and without the original .sf2 it cannot be recovered. {silenced}" },
  "\u5FF5\u8FC7\u7684\u53E5\u5B50\u6E05\u4E86\uFF08\u8981\u91CD\u5FF5\uFF09": { en: "Spoken lyrics cleared (they will be read again)" },
  "\u5C0F\u6708\u76F8\u7684\u5F15\u64CE\u91CD\u5F00\u4E86\uFF0C\u5185\u5B58\u8FD8\u56DE\u53BB\u4E86\uFF08\u5FF5\u8FC7\u7684\u53E5\u5B50\u4E0D\u4E22\uFF09": { en: "Tsukuyomi-chan\u2019s engine restarted and its memory given back (spoken lyrics are kept)" },
  "\u6E32\u67D3\u597D\u7684\u58F0\u97F3\u6E05\u4E86\uFF08\u8981\u542C\u518D\u6E32\uFF09": { en: "Rendered audio cleared (render again to listen)" },
  "\u6E05\u4E86 {n} \u6761\u65E7\u7248\u672C\u6E32\u7684\uFF08{size}\uFF09\uFF1A\u6B4C\u5E93\u91CC\u8981\u542C\u518D\u6E32": { en: "Cleared {n} older renders ({size}): render again in the library to listen" },
  "\u6E05\u4E86\u8FD9\u4E00\u904D\uFF08\u8981\u542C\u518D\u6E32\uFF09": { en: "Cleared this render (render again to listen)" },
  "\u5F00\u7740\u72EC\u594F\uFF0C\u8FD9\u51E0\u4E2A\u58F0\u90E8\u88AB\u6321\u4F4F\u3001\u4E0D\u8FDB\u8FD9\u4E00\u4EFD\uFF1A{list}": { en: "Solo is on, so these parts are left out of this file: {list}" },
  "\u8FD9\u51E0\u4E2A\u58F0\u90E8\u9759\u7740\u3001\u4E0D\u8FDB\u8FD9\u4E00\u4EFD\uFF1A{list}": { en: "These parts are muted and left out of this file: {list}" },
  "\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A\uFF1A\u8FD9\u4E2A\u58F0\u90E8\u7684\u4E50\u624B\u6587\u4EF6\u91CC\u6CA1\u6709": { en: "No one is performing yet: the file has no performer for this part" },
  "\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A\uFF08\u522B\u7684\u8F6F\u4EF6\u539F\u6765\u7684\u4E50\u5668\uFF0C\u8FD9\u4E00\u7248\u8BA4\u4E0D\u51FA\uFF09": { en: "Nobody on stage yet (the other software's original instrument isn't recognized by this version)" },
  "\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A\uFF1A\u8FD9\u4E2A\u58F0\u90E8\u7684\u4E50\u624B\u8BFB\u4E0D\u61C2": { en: "No one is performing yet: this part\u2019s performer cannot be read" },
  "\u8FD9\u4F4D\u4E50\u624B\u8EAB\u4E0A\u7F3A\u8FD9\u51E0\u4E2A\u6570\uFF0C\u6CA1\u6709\u51FA\u58F0\uFF1A{keys}": { en: "This performer is missing these numbers, so it makes no sound: {keys}" },
  "\u70B9 |\u25B6 \u89D2\u4E0A\u7684\u6570\u5B57\u770B\u6E05\u5355\uFF0C\u88AB\u4F60\u5220\u4E86\u7684\u5E93\u5728\u6E05\u5355\u91CC\u80FD\u88C5\u56DE\u6765\uFF1B\u522B\u7684\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": { en: "Tap the number on the corner of |\u25B6 for the list; a library you deleted can be put back from there. For the others, tap the part name at the front of the score to change \u201CWho performs\u201D." },
  "\u70B9 |\u25B6 \u89D2\u4E0A\u7684\u6570\u5B57\uFF0C\u6E05\u5355\u91CC\u80FD\u88C5\u56DE\u6765\u3002": { en: "Tap the number on the corner of |\u25B6; you can put it back from the list." },
  "\u70B9 |\u25B6 \u89D2\u4E0A\u7684\u6570\u5B57\u770B\u6E05\u5355\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": { en: "Tap the number on the corner of |\u25B6 for the list, and tap the part name at the front of the score to change \u201CWho performs\u201D." },
  "{next}\u3002\u8FD9{p}\u653E\u548C\u5BFC\u51FA\u90FD\u4E0D\u51FA\u58F0\uFF0C\u5176\u4F59\u7167\u653E\uFF1B{what}": { en: "{next}. {p} silent in both playback and export, the rest plays as usual; {what}" },
  "\u73B0\u5728\u7684\u58F0\u90E8\u90FD\u80FD\u51FA\u58F0\u4E86": { en: "All parts can sound now" },
  "\u300C{who}\u300D\u5531\u4E0D\u4E86\u8FD9\u4E00\u53E5\uFF1A{failed}": { en: "\u201C{who}\u201D can't sing this line: {failed}" },
  "{who}\uFF1A{pumpQuiet} {left} \u53E5\u2026": { en: "{who}: {pumpQuiet} {left} lines\u2026" },
  "\u5148\u5531\u7740": { en: "singing ahead" },
  "\u8FD8\u6709": { en: "still" },
  "\u300C{who}\u300D\u5531\u4E0D\u4E86\u8FD9\u4E00\u53E5\uFF1A{msg}": { en: "\u201C{who}\u201D can't sing this line: {msg}" },
  "\u5185\u5B58 / \u8D1F\u8F7D\u5403\u7D27\uFF1A\u5C0F\u6708\u76F8\u6539\u6210\u4E00\u6761\u9053\u5531\uFF08\u6162\u4E00\u70B9\uFF0C\u58F0\u97F3\u4E0D\u53D8\uFF09": { en: "Memory / load is tight: Tsukuyomi-chan now sings on one lane (slower, same sound)" },
  "\u97F3\u9891\u7EBF\u7A0B\u6700\u8FD1 1 s \u5FD9 {p}%\uFF1A\u53EF\u80FD\u7206\u97F3\u3002\u6548\u679C\u94FE / \u58F0\u90E8\u662F\u4F60\u7684\u6DF7\u97F3\uFF0C\u4E0D\u66FF\u4F60\u52A8\uFF1B\u53EF\u4EE5\u5148\u628A\u6CA1\u5728\u542C\u7684\u58F0\u90E8\u9759\u97F3": { en: "The audio thread was {p}% busy in the last 1 s: it may crackle. Effects and parts are your mix, so nothing changes automatically; you could mute parts you aren't listening to" },
  "\u6CA1\u6709\u51FA\u58F0\uFF1A{issues}\u3002{what}": { en: "Nothing sounded: {issues}. {what}" },
  "\u6CA1\u6709\u4F1A\u51FA\u58F0\u7684\u58F0\u90E8": { en: "No parts that can sound" },
  "\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": { en: "Tap the part name at the front of the score to change \u201CWho performs\u201D." },
  "\u5FAA\u73AF {loopFrom} \u79D2": { en: "Loop {loopFrom} s" },
  "{atNow} \u79D2": { en: "{atNow} s" },
  "\u653E\u4E0D\u4E86\uFF1A{Error}": { en: "Can't play: {Error}" },
  "\u64AD\u653E\u51FA\u9519\u4E86\uFF0C\u5DF2\u7ECF\u505C\u4E0B\uFF08\u9519\u8BEF\u8BB0\u8FDB\u4E86\u8BCA\u65AD\u65E5\u5FD7\uFF09\uFF1A{p}": { en: "Playback error, stopped (recorded in the diagnostic log): {p}" },
  "\u7B49\u5C0F\u6708\u76F8\u5531\u597D\u8FD9\u4E00\u53E5\u2026": { en: "Waiting for Tsukuyomi-chan to finish this line\u2026" },
  "\u300C{name}\u300D\u54CD\u4E0D\u4E86\uFF1A{Error}": { en: "\u201C{name}\u201D can't sound: {Error}" },
  "\u7F16 mp3\u2026": { en: "Encoding mp3\u2026" },
  "\u8FD9\u4E00\u5F20": { en: "This sheet" },
  "\u7ACB\u4F53\u58F0": { en: "Stereo" },
  "\u5355\u58F0\u9053": { en: "Mono" },
  "\u6B4C\u58F0\u5BFC\u51FA\u597D\u4E86": { en: "MP3 exported" },
  "{p} \u79D2 \xB7 mp3 {Q} {kbps}k {size}{fromFinal}{fellBack}{length}{lines}": { en: "{p} s \xB7 mp3 {Q} {kbps}k {size}{fromFinal}{fellBack}{length}{lines}" },
  "\uFF08\u7528\u7684\u662F\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BB0\u7740\u7684\u4E0A\u6B21\u6E32\u597D\u7684\u90A3\u4EFD\uFF0C\u5185\u5BB9\u6CA1\u53D8\uFF09": { en: " (the last render remembered on this device; nothing has changed)" },
  "\u4E5F\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\u4E86\uFF1A\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF0C\u5185\u5BB9\u4E0D\u53D8\u518D\u5BFC\u51FA\u4E0D\u7528\u518D\u6E32\u3002\u8BBE\u7F6E\u300C\u97F3\u6E90\u4E0E\u7F13\u5B58\u300D\u2192\u300C\u6E32\u67D3\u7F13\u5B58\u300D\u91CC\u770B\u5F97\u89C1\u3001\u5220\u5F97\u6389\u3002": { en: "Also kept in the render cache: play it straight from this song\u2019s cover in the library, and re-exporting an unchanged song is instant. See or delete it under Settings \u203A Audio \u203A Render cache." },
  "\u8FD9\u51E0\u6761\u8F68\u6CA1\u51FA\u58F0\uFF0Cmp3 \u91CC\u6CA1\u6709\u5B83\u4EEC\uFF1A": { en: "These tracks were silent and aren't in the mp3:" },
  "\u7F72\u540D \xB7 \u5DF2\u5199\u8FDB mp3 \u7684\u6807\u7B7E": { en: "Credits \xB7 written into the mp3 tags" },
  "\u5BFC\u51FA\u5931\u8D25\uFF1A{Error}": { en: "Export failed: {Error}" },
  "\u6B63\u5728\u5BFC\u51FA\u6216\u51C6\u5907\u64AD\u653E\uFF0C\u7B49\u5B83\u5B8C\u4E86\u518D\u6E32": { en: "Exporting or getting ready to play; render after that finishes" },
  "{label} \xB7 \u5F00\u5934 {p} \u79D2": { en: "{label} \xB7 first {p} s" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u89E3\u4E0D\u4E86\u97F3\u9891": { en: "This browser can't decode the audio" },
  "PNG {REF_IMAGE_COLORS} \u8272\u3001{w} \xD7 {h}\uFF08\u957F\u8FB9\u6700\u591A {REF_IMAGE_EDGE}\uFF09": { en: "PNG {REF_IMAGE_COLORS} colors, {w} \xD7 {h} (long side up to {REF_IMAGE_EDGE})" },
  "mp3 {REF_MP3_KBPS}k{right}\u3001{p} \u5206\u949F": { en: "mp3 {REF_MP3_KBPS}k{right}, {p} min" },
  " \u5355\u58F0\u9053": { en: " mono" },
  "\u4E0D\u4F1A\u538B\u8FD9\u79CD\uFF1A{kind}": { en: "Can't compress this kind: {kind}" },
  "\u539F\u5C3A\u5BF8": { en: "Original size" },
  "\u5220\u6389\u8FD9\u5F20": { en: "Delete this one" },
  "\u518D\u70B9\u4E00\u6B21\u5220\u6389": { en: "Tap again to delete" },
  "\u4E0A\u4E00\u5F20": { en: "Previous" },
  "\u4E0B\u4E00\u5F20": { en: "Next" },
  "\u53C2\u8003\u7A97\u83DC\u5355": { en: "Reference window menu" },
  "\u70B9\u4E00\u4E0B\u7F29\u6210\u5C0F\u56FE\u6807\uFF0C\u6309\u4F4F\u62D6\u52A8\u632A\u4F4D\u7F6E": { en: "Tap to shrink to an icon, hold and drag to move" },
  "\u6539\u5927\u5C0F": { en: "Resize" },
  "\u5F80\u524D\u632A": { en: "Move earlier" },
  "\u5F80\u540E\u632A": { en: "Move later" },
  "\u8DF3\u5230\u2026": { en: "Jump to\u2026" },
  "\u56FE\u7247": { en: "Image" },
  "\u6587\u5B57": { en: "Text" },
  "\u97F3\u9891": { en: "Audio" },
  "\u89C6\u9891": { en: "Video" },
  "\u5185\u5BB9\u4E0D\u5728\u4E86": { en: "Content is gone" },
  "\u5BFC\u5165\u56FE\u7247 / \u97F3\u9891 / \u89C6\u9891 / \u6587\u5B57\u2026": { en: "Import image / audio / video / text\u2026" },
  "\u64AD\u653E": { en: "Play" },
  "\u6682\u505C": { en: "Pause" },
  "\u5FAA\u73AF": { en: "Loop" },
  "\u4E0A\u4E00\u5E27": { en: "Previous frame" },
  "\u4E0B\u4E00\u5E27": { en: "Next frame" },
  "\u53EA\u5728\u5185\u5B58\u91CC\uFF0C\u6CA1\u5B58\u8FDB\u6B4C\u91CC\u2014\u2014\u628A\u8FD9\u4E2A\u6587\u4EF6\u62D6\u8FDB\u6765\uFF0C\u6216\u8005\u70B9 \uFF0B \u91CD\u65B0\u5BFC\u5165\uFF0C\u5C31\u8865\u56DE\u8FD9\u91CC": { en: "Only in memory, not saved in the song \u2014 drag this file in, or re-import with \uFF0B, to fill this spot" },
  "\u7F29\u6210\u5C0F\u56FE\u6807": { en: "Shrink to an icon" },
  "\u70B9\u4E00\u4E0B\u6062\u590D\uFF0C\u6309\u4F4F\u62D6\u52A8\u632A\u4F4D\u7F6E": { en: "Tap to restore, hold and drag to move" },
  "\u526A\u8D34\u677F\u91CC\u6CA1\u6709\u56FE\u7247\u6216\u6587\u5B57": { en: "No image or text on the clipboard" },
  "\u8FD9\u5F20\u56FE\u8FD9\u4E2A\u6D4F\u89C8\u5668\u6253\u4E0D\u5F00{name}": { en: "This browser can't open this image{name}" },
  "\u53C2\u8003\u7A97\uFF1A{message}": { en: "Reference window: {message}" },
  "\u8BA4\u4E0D\u51FA\uFF1A{name}\uFF08\u53C2\u8003\u7A97\u6536\u56FE\u7247\u3001\u97F3\u9891\u548C\u6587\u5B57\uFF09": { en: "Not recognized: {name} (the reference window takes images, audio and text)" },
  "\u6CA1\u52A0\u4E0A\uFF1A{name}\uFF08{message}\uFF09": { en: "Not added: {name} ({message})" },
  "\u51FA\u9519\u4E86": { en: "Something went wrong" },
  "\u52A0\u4E86 {n} \u5F20": { en: "Added {n}" },
  "\u8865\u56DE {n} \u5F20\uFF08\u53EA\u653E\u5185\u5B58\u7684\u7A7A\u4F4D\uFF09": { en: "Filled {n} (memory-only empty slots)" },
  "\u53C2\u8003\u7A97\uFF1A{p}": { en: "Reference window: {p}" },
  "\u7C98\u8D34.{p}": { en: "pasted.{p}" },
  "\u8BFB\u4E0D\u4E86\u526A\u8D34\u677F\uFF1A\u70B9\u4E00\u4E0B\u53C2\u8003\u7A97\uFF0C\u518D\u6309 Ctrl / \u2318+V": { en: "Can't read the clipboard: tap the reference window, then press Ctrl / \u2318+V" },
  "\u8FD9\u9996\u6B4C\u7684\u53C2\u8003\u7A97\u662F\u66F4\u65B0\u7248\u672C\u7684 app \u5B58\u7684\uFF1A\u8FD9\u7248\u6CA1\u6709\u7684\u529F\u80FD\u4FDD\u5B58\u65F6\u4E0D\u4E22\uFF0C\u53EA\u662F\u770B\u4E0D\u5230": { en: "This song's reference window was saved by a newer app: features this version lacks aren't lost on save, they're just not visible" },
  "\u8FD9\u9996\u6B4C\u7684\u53C2\u8003\u7A97\u662F\u66F4\u65B0\u7248\u672C\u7684 app \u5B58\u7684\uFF08\u53C2\u8003\u6E05\u5355\u7B2C {fileVersion} \u7248\uFF0C\u8FD9\u4E00\u7248\u8BA4\u5230\u7B2C {libVersion} \u7248\uFF09\uFF1A\u539F\u6837\u7559\u7740\u3001\u5B58\u7684\u65F6\u5019\u539F\u6837\u5199\u56DE\uFF0C\u8FD9\u91CC\u5148\u4E0D\u663E\u793A": { en: "This song's reference window was saved by a newer app (reference list version {fileVersion}, this version knows up to {libVersion}): kept as is and written back as is, not shown here for now" },
  "\u53C2\u8003\u7A97\u8BFB\u4E0D\u51FA\u6765\uFF1A{Error}\uFF08\u5B57\u8282\u539F\u6837\u7559\u7740\u3001\u5B58\u7684\u65F6\u5019\u539F\u6837\u5199\u56DE\uFF09": { en: "Can't read the reference window: {Error} (bytes stay untouched and are written back as is)" },
  "\u8FD9\u9996\u6B4C\u7684\u53C2\u8003\u7A97\u662F\u66F4\u65B0\u7248\u672C\u7684 app \u5B58\u7684\uFF0C\u8FD9\u4E00\u7248\u5148\u4E0D\u663E\u793A\uFF08\u539F\u6837\u7559\u7740\uFF09": { en: "This song's reference window was saved by a newer app; this version doesn't show it for now (kept as is)" },
  "\u9053 {p}\uFF1A\u5806 {wasm}{p2} + \u5FF5\u7F13\u5B58 {cache}": { en: "Lane {p}: heap {wasm}{p2} + speech cache {cache}" },
  "\uFF08\u521A\u8D77\u6765 {base}\uFF09": { en: " (at startup {base})" },
  "\u5C0F\u6708\u76F8\u5F15\u64CE\u6CA1\u8D77": { en: "Tsukuyomi-chan's engine isn't running" },
  "\u97F3\u9891\u7EBF\u7A0B\uFF1A\u6CA1\u5728\u62A5": { en: "Audio thread: not reporting" },
  "\u97F3\u9891\u7EBF\u7A0B\u6700\u8FD1 1 s \u5FD9 {p}%{AUDIO_HOT}": { en: "Audio thread {p}% busy in the last 1 s{AUDIO_HOT}" },
  "\uFF08\u70ED\uFF1A\u53EF\u80FD\u7206\u97F3\uFF09": { en: " (hot: may crackle)" },
  "\u80FD\u7B97\u5230\u7684\u5360\u7528 {s} / \u9884\u7B97 {total}\uFF08{lanes}\uFF1B\u5F55\u97F3\u623F\u91CC {chunks} \u5757 {chunkBytes}\uFF1B\u97F3\u6E90\u5185\u5B58 {soundMem}\uFF09\u3002{audio}\u3002": { en: "Measured usage {s} / budget {total} ({lanes}; {chunks} chunks {chunkBytes} in the studio; sound memory {soundMem}). {audio}." },
  "\u8FD9\u662F itch \u4E0A\u7684\u8BD5\u73A9\u7248\uFF1A\u9664\u4E86\u7F51\u76D8\u540C\u6B65\uFF0C\u522B\u7684\u90FD\u6709\u3002\u5B8C\u6574\u7248\u5728 {SITE_HOST}": { en: "This is the itch demo: everything except OneDrive sync. The full version is at {SITE_HOST}" },
  "\u8FD9\u662F\u4E0B\u8F7D\u4E0B\u6765\u7684\u5907\u7528\u7248\uFF1A\u9664\u4E86\u7F51\u76D8\u540C\u6B65\uFF0C\u522B\u7684\u90FD\u6709\u3002\u5B8C\u6574\u7248\u5728 {SITE_HOST}": { en: "This is the downloaded standalone version: everything except OneDrive sync. The full version is at {SITE_HOST}" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u6253\u5F00\u5907\u7528\u7248\u6CA1\u6D4B\u8FC7\uFF1A\u8BBE\u7F6E\u548C\u7F13\u5B58\u5B58\u4E0D\u4F4F\uFF08\u5173\u4E86\u5C31\u5FD8\uFF09\uFF0C\u6B4C\u8BF7\u8BB0\u5F97\u300C\u5B58\u300D\u4E0B\u6765\u3002\u9047\u5230\u95EE\u9898\u8BF7\u5230 {REPORT_URL} \u544A\u8BC9\u6211\u4EEC": { en: "This browser hasn't been tested with the standalone version: settings and caches don't persist (forgotten when closed), so remember to \u201CSave\u201D your songs. For problems, tell us at {REPORT_URL}" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u5199\u4E0D\u8FDB\u5B58\u50A8\u4E86\uFF1A\u8FD9\u6B21\u6253\u5F00\u4E4B\u540E\u6539\u7684\u8BBE\u7F6E\u53EA\u7559\u5728\u5185\u5B58\u91CC\uFF0C\u5173\u4E86\u5C31\u5FD8": { en: "This browser can't write to storage: settings changed from now on stay in memory and are forgotten when closed" },
  "\u7F51\u76D8\u5728\u5B98\u7F51": { en: "OneDrive is on the official site" },
  "\u7F51\u76D8\uFF08OneDrive\uFF09\u540C\u6B65\u53EA\u5728\u5B98\u7F51\u7248\u91CC\u6709\uFF1A{SITE_HOST}": { en: "OneDrive sync is only on the official site: {SITE_HOST}" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u5B58\u4E0D\u4F4F\u6B4C\u5E93\uFF08\u5173\u4E86\u5C31\u5FD8\uFF09\uFF1A\u6B4C\u8BF7\u7528\u300C\u5B58\u300D\u4E0B\u8F7D\u6210\u6587\u4EF6\uFF1B\u6B4C\u5E93\u5728\u5B98\u7F51\u7248\u91CC\uFF1A{SITE_HOST}": { en: "This browser can't keep a library (forgotten when closed): use \u201CSave\u201D to download songs as files; the library is on the official site: {SITE_HOST}" },
  "\u6B4C\u5E93\u53EA\u5728\u5B98\u7F51\u7248\u91CC\u6709\uFF08{SITE_HOST}\uFF09\uFF1A\u8FD9\u91CC\u7684\u6B4C\u6CA1\u6709\u6D4F\u89C8\u5668\u5916\u7684\u5BB6\u2014\u2014\u300C\u5B58\u300D= \u4E0B\u8F7D\u6210 .mxl \u6587\u4EF6\uFF0C\u300C\u6253\u5F00\u300D= \u9009\u6587\u4EF6": { en: "The library is only on the official site ({SITE_HOST}): songs here have no home outside the browser \u2014 \u201CSave\u201D = download an .mxl file, \u201COpen\u201D = choose a file" },
  "itch \u7248\u8DDF\u7740 itch \u4E0A\u7684\u7248\u672C\u8D70\uFF1A\u4F5C\u8005\u63A8\u4E86\u65B0\u7248\uFF0C\u5237\u65B0\u8FD9\u4E00\u9875\u5C31\u662F\u65B0\u7684": { en: "The itch version follows what's on itch: when a new version is pushed, refresh this page to get it" },
  "\u5907\u7528\u7248\u4E0D\u4F1A\u81EA\u5DF1\u66F4\u65B0\uFF1A\u8981\u65B0\u7248\u5C31\u91CD\u65B0\u4E0B\u8F7D\u8FD9\u4E2A\u6587\u4EF6\u5939\uFF0C\u6216\u53BB\u5B98\u7F51 {SITE_HOST}": { en: "The standalone version doesn't update itself: for a new version, download this folder again or go to the official site {SITE_HOST}" },
  "\u8FD9\u91CC\u6CA1\u6709\u79BB\u7EBF\u58F3\uFF0C\u4E0D\u7528\u66F4\u65B0": { en: "No offline shell here, nothing to update" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u9009\u4E0D\u4E86\u6587\u4EF6\u5939\uFF08\u684C\u9762\u7248 Chrome / Edge \u53EF\u4EE5\uFF09\uFF0C\u6240\u4EE5\u5907\u7528\u7248\u5728\u8FD9\u91CC\u6CA1\u6709\u6B4C\u5E93\uFF1A\u300C\u5B58\u300D= \u4E0B\u8F7D\u6210 .mxl \u6587\u4EF6\uFF0C\u300C\u6253\u5F00\u300D= \u9009\u6587\u4EF6\uFF1B\u6B4C\u5E93\u4E5F\u5728\u5B98\u7F51\u7248\u91CC\uFF1A{SITE_HOST}": { en: "This browser can't choose folders (desktop Chrome / Edge can), so the standalone version has no library here: \u201CSave\u201D = download an .mxl file, \u201COpen\u201D = choose a file; the library is also on the official site: {SITE_HOST}" },
  "\u53BB\u5B98\u7F51": { en: "Official site" },
  "\u62A5\u544A\u95EE\u9898": { en: "Report a problem" },
  "\u5907\u7528\u7248\uFF1A\u5C0F\u6708\u76F8\u7684\u6A21\u578B\u5305\u5C31\u5728\u8FD9\u4E2A\u6587\u4EF6\u5939\u7684 pwa-models/ \u91CC\uFF0C\u7528\u5230\u624D\u8BFB\u3001\u8BFB\u7684\u65F6\u5019\u6838\u54C8\u5E0C\uFF1B\u4E0D\u7528\u4E0B\u8F7D\u3001\u4E5F\u4E0D\u7528\u5BFC\u5165": { en: "Standalone: Tsukuyomi-chan's model pack is in this folder's pwa-models/, read when needed and hash-checked as it's read; no download or import needed" },
  "\u5907\u7528\u7248\uFF1A\u97F3\u6E90\u5C31\u5728\u8FD9\u4E2A\u6587\u4EF6\u5939\u7684 pwa-sounds/ \u91CC\uFF0C\u7528\u5230\u624D\u8BFB\uFF1B\u6D4F\u89C8\u5668\u7F13\u5B58\u5728\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u91CC\u7528\u4E0D\u4E86\uFF0C\u8FD9\u91CC\u6CA1\u6709\u300C\u7559\u5728\u8BBE\u5907\u4E0A\u300D\u8FD9\u56DE\u4E8B": { en: "Standalone: sounds are in this folder's pwa-sounds/, read when needed; browser cache doesn't work on pages opened by double-click, so nothing is \u201Ckept on the device\u201D here" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u4E0D\u8BA9\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u7684\u540E\u53F0\u7EBF\u7A0B\u5B58\u4E1C\u897F\uFF1A\u5FF5\u7F13\u5B58\u53EA\u5728\u5185\u5B58\u91CC\uFF08\u6BCF\u6B21\u6253\u5F00\u7B2C\u4E00\u904D\u8981\u91CD\u5FF5\uFF09": { en: "This browser doesn't let background threads store data on pages opened by double-click: the speech cache is memory-only (the first pass of each session re-speaks)" },
  "\u8FD9\u4EFD mp3 \u653E\u4E0D\u4E86\uFF08\u6587\u4EF6\u574F\u4E86\uFF1F\uFF09": { en: "This mp3 can't be played (damaged file?)" },
  "\u97F3": { en: "Notes" },
  "\u8BCD": { en: "Lyrics" },
  "\u7B26": { en: "Symbols" },
  "\u542C": { en: "Listen" },
  "\u97F3\uFF1A\u5199\u97F3\u548C\u8BB0\u53F7\u2014\u2014\u8C31\u4E0A\u97F3\u548C\u8BB0\u53F7\u90FD\u80FD\u6539\uFF08\u70B9\u97F3 = \u5149\u6807\uFF0C\u7B14 / \u9F20\u6807\u62D6\u97F3 = \u6539\u97F3\u9AD8 / \u65F6\u503C\uFF1B\u70B9\u8BB0\u53F7 = \u5B83\u7684\u83DC\u5355\u3001\u6309\u4F4F\u62D6 = \u632A\uFF09\uFF1B\u5C0F\u952E\u76D8\u9876\u4E0A\u300C\u7B26 / \u97F3\u300D\u5207\u97F3\u952E / \u7B26\u53F7\u683C\uFF0C\u9000\u683C\u5220\u4EC0\u4E48\u8DDF\u7740\u952E\u76D8": { en: "Notes: write notes and marks \u2014 both can be edited on the score (tap a note = cursor, drag with pen / mouse = change pitch / length; tap a mark = its menu, hold and drag = move); the switch above the keys toggles note keys / symbol grid, and Backspace follows the keys" },
  "\u8BCD\uFF1A\u70B9\u97F3\u6216\u5B83\u4E0B\u9762 = \u5199\u8FD9\u4E2A\u97F3\u7684\u6B4C\u8BCD\uFF1B\u6309\u4F4F\u5B57\u62D6 = \u632A / \u5408\uFF1B\u9000\u683C = \u5220\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u7684\u5B57": { en: "Lyrics: tap a note or below it = write its lyric; hold a syllable and drag = move / join; Backspace = delete the syllable of the note before the cursor" },
  "\u7B26\uFF1A\u952E\u76D8 = \u7B26\u53F7\u683C\uFF08\u529B\u5EA6\u3001\u6E10\u5F3A\u6E10\u5F31\u3001\u6F14\u594F\u6CD5\u3001\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\u3001\u53CD\u590D\u3001\u98CE\u683C\uFF1B\u9000\u683C = \u5220\u8BB0\u53F7\uFF09\u3002\u8C31\u4E0A\u548C\u300C\u97F3\u300D\u4E00\u6837\uFF1A\u97F3\u548C\u8BB0\u53F7\u90FD\u80FD\u6539": { en: "Symbols: keys = symbol grid (dynamics, hairpins, articulations, key / time / tempo, repeats, style; Backspace = delete marks). On the score it's the same as \u201CNotes\u201D: notes and marks can both be edited" },
  "\u542C\uFF1A\u8C31\u9501\u4F4F\u9632\u8BEF\u89E6\u2014\u2014\u8F7B\u70B9\u53EA\u8BA4\u770B\u8C31\u7684\uFF08\u58F0\u90E8\u540D / \u7FFB\u7EB8 / \u672C\u6BB5\uFF09\uFF0C\u4E0D\u8DF3\u64AD\uFF1B\u957F\u6309 / \u53F3\u952E\u8C31\u9762 = \u4ECE\u8FD9\u513F\u653E / \u63A5\u7740\u653E / \u4ECE\u5934\u653E\uFF1B\u7A7A\u683C = \u653E / \u505C\uFF1B\u5E95\u4E0B\u662F\u6DF7\u97F3\u53F0\uFF08Esc \u56DE\u5230\u5199\uFF09": { en: "Listen: the score locks to prevent accidental edits \u2014 taps only do viewing things (part names / page turns / this section) and never jump playback; long-press / right-click the score = play from here / resume / from the top; Space = play / stop; the mixer sits below (Esc returns to writing)" },
  "\u8FD9\u4E2A\u58F0\u90E8\u7684\u8F68\uFF08\u6CA1\u6709\uFF09": { en: "this part\u2019s track (missing)" },
  "\u8FD9\u4E2A\u58F0\u90E8\u7684\u8F68": { en: "this part\u2019s track" },
  "\u6DF7\u97F3\u8F68\u300C{name}\u300D": { en: "mix track \u201C{name}\u201D" },
  "\u6CA1\u6709\u51FA\u58F0\uFF1A{e}": { en: "Nothing sounded: {e}" },
  "\u6DF7\u97F3\u2026": { en: "Mixing\u2026" },
  "\u81EA\u52A8\u4F4E\u5207": { en: "Auto low cut" },
  "\u8DDF\u901F\u5EA6\uFF08\u51E0\u62CD\u4E00\u6B21\uFF1B0 = \u7528\u4E0A\u9762\u7684\u6BEB\u79D2\uFF09": { en: "Follow tempo (beats per echo; 0 = use the ms above)" },
  "\u5747\u8861": { en: "EQ" },
  "\u6BCF\u6BB5\u4E00\u4E2A\u53CC\u4E8C\u9636 H(z) = (b0 + b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2)\uFF0C\u7CFB\u6570\u6309 RBJ Audio EQ Cookbook\uFF08hp / lp Q = 0.707\uFF1B\u67B6\u5B50 Q = 0.707\uFF1B\u5CF0 Q \u53EF\u8C03\uFF09\u3002hpHz / lpHz = 0 \u5173\u3002": { en: "One biquad per band H(z) = (b0 + b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2), coefficients from the RBJ Audio EQ Cookbook (hp / lp Q = 0.707; shelves Q = 0.707; peak Q adjustable). hpHz / lpHz = 0 is off." },
  "\u4F4E\u5207": { en: "Low cut" },
  "\u9AD8\u5207": { en: "High cut" },
  "\u4F4E\u67B6": { en: "Low shelf" },
  "\u4F4E\u67B6\u9891\u7387": { en: "Low shelf freq" },
  "\u4E2D\u5CF0": { en: "Mid peak" },
  "\u4E2D\u5CF0\u9891\u7387": { en: "Mid peak freq" },
  "\u4E2D\u5CF0\u5BBD": { en: "Mid peak width" },
  "\u9AD8\u67B6": { en: "High shelf" },
  "\u9AD8\u67B6\u9891\u7387": { en: "High shelf freq" },
  "\u538B\u7F29": { en: "Compressor" },
  "\u5305\u7EDC e[n] = max(|x|, e[n-1]\xB7r) \u8D77\uFF08attack\uFF09\u843D\uFF08release\uFF09\u5404\u4E00\u4E2A\u65F6\u95F4\u5E38\u6570\uFF1B\u8D85\u8FC7 threshold \u7684\u90E8\u5206\u6309 ratio \u538B\uFF08kneeDb \u5185\u8F6F\u62D0\u70B9\uFF1Ag = -(x - T + K/2)^2 \xB7 (1 - 1/R) / (2K)\uFF09\uFF1B\u589E\u76CA = 10^(g/20) \xD7 10^(makeup/20)\u3002key \u7ED9\u4E86 = \u542C\u522B\u7684\u8F68\uFF08\u4FA7\u94FE\uFF09\uFF0C\u4E0D\u7ED9 = \u542C\u81EA\u5DF1\u3002": { en: "Envelope e[n] = max(|x|, e[n-1]\xB7r) with one time constant each for attack and release; above the threshold, compressed by ratio (soft knee within kneeDb: g = -(x - T + K/2)^2 \xB7 (1 - 1/R) / (2K)); gain = 10^(g/20) \xD7 10^(makeup/20). With a key = listens to another track (sidechain); without = listens to itself." },
  "\u9608\u503C": { en: "Threshold" },
  "\u6BD4\u4F8B": { en: "Ratio" },
  "\u8D77": { en: "Attack" },
  "\u843D": { en: "Release" },
  "\u62D0\u70B9": { en: "Knee" },
  "\u8865\u507F": { en: "Makeup" },
  "\u5EF6\u8FDF": { en: "Delay" },
  "y[n] = x[n]\xB7dry + d[n]\xB7mix\uFF08mix / dry = \u7EBF\u6027\u7684\u5E45\u5EA6\u500D\u6570\uFF09\uFF0Cd[n] = x[n - D] + fb \xB7 LP(d[n - D])\uFF0CLP = \u4E00\u9636\u4F4E\u901A dampHz\u3002D = timeMs\uFF08\u6700\u957F 2 s\uFF09\u3002": { en: "y[n] = x[n]\xB7dry + d[n]\xB7mix (mix / dry = linear amplitude multipliers), d[n] = x[n - D] + fb \xB7 LP(d[n - D]), LP = one-pole low-pass at dampHz. D = timeMs (max 2 s)." },
  "\u65F6\u95F4": { en: "Time" },
  "\u53CD\u9988": { en: "Feedback" },
  "\u6E7F": { en: "Wet" },
  "\u539F\u58F0": { en: "Dry" },
  "\u53CD\u9988\u9AD8\u5207": { en: "Feedback high cut" },
  "\u6DF7\u54CD": { en: "Reverb" },
  "Freeverb\uFF08\u516C\u5F00\u7B97\u6CD5\uFF0Croom / damp \u5C31\u662F\u5B83\u7684\u540C\u540D\u53C2\u6570\uFF09\uFF1A8 \u6761\u4F4E\u901A\u53CD\u9988\u68B3\u72B6\uFF08\u957F\u5EA6 1116\u20261617 @44.1k\uFF0C\u6309\u91C7\u6837\u7387\u7F29\u653E\uFF1B\u53CD\u9988 = 0.7 + 0.28\xB7room\uFF0C\u4F4E\u901A = damp\uFF09\u5E76\u8054\uFF0C\u518D\u4E32 4 \u6761\u5168\u901A\uFF08g = 0.5\uFF09\uFF1B\u53F3\u8FB9\u5404\u957F 23 \u4E2A\u91C7\u6837\uFF1B\u524D\u9762\u4E00\u6BB5 preDelayMs \u7EAF\u5EF6\u8FDF\uFF1By = x\xB7dry + wet\xB7mix\uFF08mix / dry = \u7EBF\u6027\u7684\u5E45\u5EA6\u500D\u6570\uFF1B\u754C\u9762\u4E0A\u7684\u79D2 / kHz / dB \u662F\u4ECE\u8FD9\u51E0\u4E2A\u6570\u6362\u7B97\u51FA\u6765\u7ED9\u4EBA\u770B\u7684\uFF09\u3002": { en: "Freeverb (a public algorithm; room / damp are its parameters of the same name): 8 low-pass feedback combs (lengths 1116\u20261617 @44.1k, scaled to the sample rate; feedback = 0.7 + 0.28\xB7room, low-pass = damp) in parallel, then 4 allpasses in series (g = 0.5); the right side is 23 samples longer each; a preDelayMs pure delay in front; y = x\xB7dry + wet\xB7mix (mix / dry = linear amplitude multipliers; the seconds / kHz / dB shown in the panel are converted from these numbers for people to read)." },
  "\u623F\u95F4\u5927\u5C0F": { en: "Room size" },
  "\u9AD8\u9891\u5438\u6536": { en: "Damping" },
  "\u9884\u5EF6\u8FDF": { en: "Pre-delay" },
  "\u5BBD\u5EA6": { en: "Width" },
  "\u5408\u5531": { en: "Chorus" },
  "v \u6761\u5EF6\u8FDF d_k(t) = delayMs + depthMs \xB7 sin(2\u03C0 \xB7 rateHz \xB7 t + 2\u03C0k/v)\uFF08\u7EBF\u6027\u63D2\u503C\u8BFB\uFF09\uFF0C\u7B2C k \u6761\u6446\u5728 pan_k = spread \xB7 (2k/(v-1) - 1)\uFF1By = x\xB7dry + mix \xB7 \u03A3_k d_k / v\uFF08mix / dry = \u7EBF\u6027\u7684\u5E45\u5EA6\u500D\u6570\uFF09\u3002": { en: "v delay lines d_k(t) = delayMs + depthMs \xB7 sin(2\u03C0 \xB7 rateHz \xB7 t + 2\u03C0k/v) (read with linear interpolation), line k panned to pan_k = spread \xB7 (2k/(v-1) - 1); y = x\xB7dry + mix \xB7 \u03A3_k d_k / v (mix / dry = linear amplitude multipliers)." },
  "\u51E0\u6761": { en: "Voices" },
  "\u6296\u52A8\u6DF1\u5EA6": { en: "Depth" },
  "\u6296\u52A8\u5FEB\u6162": { en: "Rate" },
  "\u5DE6\u53F3\u94FA\u5F00": { en: "Spread" },
  "\u589E\u76CA": { en: "Gain" },
  "{kind}\uFF1A\u8FD9\u4E00\u7248\u4E0D\u8BA4\u8BC6": { en: "{kind}: not recognized by this version" },
  "\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A": { en: "Nobody on stage yet" },
  "\u6DF7\u97F3\u53F0\u4E0A\u7F3A\u8FD9\u51E0\u4E2A\u6570\uFF0C\u6CA1\u6709\u51FA\u58F0\uFF1A{keys}": { en: "These numbers are missing on the mixer, so it made no sound: {keys}" },
  "\u300C{label}\u300D\u4E0D\u4F1A\u6309\u97F3\u7B26\u8868\u51FA\u58F0": { en: "\u201C{label}\u201D can't sound from a note list" },
  "\u8BD5\u542C\u5143\u97F3\u8868\uFF1A{Error}\uFF08\u5148\u8DD1 node scripts/gen-preview-vowels.mjs\uFF1F\uFF09": { en: "Audition vowel table: {Error} (run node scripts/gen-preview-vowels.mjs first?)" },
  "\u7ACB\u4F53\u58F0 192k": { en: "Stereo 192k" },
  "\u7EA6 1.4 MB / \u5206\u949F": { en: "about 1.4 MB / minute" },
  "\u5C0F\u6587\u4EF6\uFF08\u5355\u58F0\u9053 64k\uFF09": { en: "Small file (mono 64k)" },
  "\u7EA6 0.5 MB / \u5206\u949F": { en: "about 0.5 MB / minute" },
  "mp3 \u7F16\u7801 worker \u51FA\u9519": { en: "mp3 encoder worker error" },
  "\u5B57\u4F53\u4E0B\u4E0D\u6765\uFF08{Error}\uFF09": { en: "Couldn't download the font ({Error})" },
  "\u97F3\u4E50\u5B57\u5F62\u4E0B\u4E0D\u6765\uFF08{Error}\uFF09": { en: "Couldn't download the music glyphs ({Error})" },
  "\uFF08\u6CA1\u58F0\u660E\u8BB8\u53EF\uFF09": { en: "(no license stated)" },
  "\u4FDD\u7559\u6240\u6709\u6743\u5229": { en: "All rights reserved" },
  "\u4EC0\u4E48\u90FD\u8981\u5148\u95EE\u4F60\uFF08\u6CD5\u5F8B\u9ED8\u8BA4\u5C31\u662F\u8FD9\u6837\uFF0C\u8FD9\u91CC\u53EA\u662F\u5199\u660E\uFF09": { en: "Everyone must ask you first for anything (that's the legal default; this just says so)" },
  "\xA9 {y} \u4FDD\u7559\u6240\u6709\u6743\u5229": { en: "\xA9 {y} All rights reserved" },
  "\u4EC5\u4F9B\u6B23\u8D4F": { en: "For listening only" },
  "\u542C\u53EF\u4EE5\uFF1B\u8F6C\u8F7D\u3001\u6539\u7F16\u3001\u5546\u7528\u90FD\u8981\u5148\u95EE\u4F60": { en: "Listening is fine; reposting, adapting and commercial use must ask you first" },
  "\xA9 {y} \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002\u4EC5\u4F9B\u4E2A\u4EBA\u6B23\u8D4F\uFF0C\u7981\u6B62\u8F6C\u8F7D\u3001\u6539\u7F16\u3001\u5546\u7528\u3002": { en: "\xA9 {y} All rights reserved. For personal listening only; no reposting, adaptation or commercial use." },
  "\u5546\u7528\u8BF7\u8054\u7CFB": { en: "Contact for commercial use" },
  "\u4FDD\u7559\u6240\u6709\u6743\u5229\uFF0C\u5E76\u544A\u8BC9\u522B\u4EBA\u5546\u7528\u600E\u4E48\u627E\u4F60": { en: "All rights reserved, plus telling people how to reach you for commercial use" },
  "\xA9 {y} \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002\u5546\u7528\u8BF7\u8054\u7CFB\u4F5C\u8005\u3002": { en: "\xA9 {y} All rights reserved. Contact the author for commercial use." },
  "\u6CE8\u660E\u51FA\u5904\u53EF\u4EE5\u539F\u6837\u8F6C\u53D1\uFF1B\u4E0D\u8BB8\u6539\u3001\u4E0D\u8BB8\u5546\u7528\uFF08\u6700\u7D27\u7684 CC\uFF09": { en: "Can be reshared unchanged with credit; no changes, no commercial use (the strictest CC)" },
  "\u6CE8\u660E\u51FA\u5904\u53EF\u4EE5\u6539\uFF1B\u4E0D\u8BB8\u5546\u7528": { en: "Can be changed with credit; no commercial use" },
  "\u6CE8\u660E\u51FA\u5904\u53EF\u4EE5\u6539\u3001\u53EF\u4EE5\u5546\u7528\uFF1B\u6539\u4E86\u7684\u8981\u7528\u540C\u6837\u7684\u8BB8\u53EF": { en: "Can be changed and used commercially with credit; changes must use the same license" },
  "\u6CE8\u660E\u51FA\u5904\u968F\u4FBF\u7528": { en: "Free to use with credit" },
  "\u653E\u5F03\u6743\u5229\uFF0C\u8C01\u90FD\u80FD\u968F\u4FBF\u7528\uFF08\u53D1\u51FA\u53BB\u6536\u4E0D\u56DE\uFF09": { en: "Rights waived, anyone can use it freely (can't be taken back once published)" },
  "\u4F60\u9009\u7684\u8BB8\u53EF\u5141\u8BB8\u522B\u4EBA\u6539\u7F16 / \u5F53\u7D20\u6750\u518D\u7528\uFF0C\u53EF\u91CC\u9762\u6709\u5C0F\u6708\u76F8\u7684\u58F0\u97F3\uFF0C\u5C0F\u6708\u76F8\u7684\u6761\u6B3E\u4E0D\u8BB8\u8FD9\u6837\u516C\u5F00\uFF08\u8BBE\u7F6E\u91CC\u6709\u539F\u6587\u548C\u8BD1\u6587\uFF09\uFF0C\u6240\u4EE5\u5BFC\u51FA\u65F6\u8BB8\u53EF\u90A3\u4E00\u9879\u6309\u300C\u672A\u58F0\u660E\u300D\u5199\uFF1B\u4F60\u5728\u8FD9\u91CC\u7684\u9009\u62E9\u6CA1\u52A8\u3002": { en: "The license you chose lets others adapt or reuse this as material, but it contains Tsukuyomi-chan's voice, and her terms don't allow that publicly (original and translation are in Settings), so exports write the license as \u201Cnot stated\u201D; your choice here is unchanged." },
  "\u8BB8\u53EF\u8BC1\u4E0D\u660E": { en: "License unknown" },
  "\uFF08\u6CA1\u6709\u7F72\u540D\u4FE1\u606F\uFF09": { en: "(no credit information)" },
  "{ly} \u8BCD\u66F2": { en: "Lyrics & music: {ly}" },
  "{ly} \u8BCD": { en: "Lyrics: {ly}" },
  "{co} \u66F2": { en: "Music: {co}" },
  "{a} \u7F16\u66F2": { en: "Arranged by {a}" },
  "\u6392\u7EC3\u8BB0\u53F7": { en: "Rehearsal marks" },
  "\u865A\u7EBF\uFF08\u5982\u6E10\u5F3A\u6E10\u5F31\u7684\u5EF6\u7EED\u7EBF\uFF09": { en: "Dashes (e.g. the continuation line of a hairpin)" },
  "\u62EC\u7EBF": { en: "Brackets" },
  "\u5F31\u97F3\u5668\u8BB0\u53F7": { en: "Mute marks" },
  "\u7AD6\u7434\u8E0F\u677F\u56FE": { en: "Harp pedal diagrams" },
  "\u6B62\u97F3\u8BB0\u53F7": { en: "Damp marks" },
  "\u8FD9\u4EFD MusicXML \u662F timewise \u6392\u6CD5\uFF0C\u8FD9\u4E00\u7248\u53EA\u8BFB partwise": { en: "This MusicXML is timewise; this version only reads partwise" },
  "\u8FD9\u4E0D\u662F MusicXML \u4E50\u8C31\uFF08\u6839\u5143\u7D20\u662F <{name}>\uFF09": { en: "This isn't a MusicXML score (root element is <{name}>)" },
  "\u8FD9\u4EFD MusicXML \u91CC\u6CA1\u6709\u58F0\u90E8": { en: "This MusicXML has no parts" },
  "\u548C\u5F26\u8BB0\u53F7\uFF08\u6CA1\u6807\u5728\u4E00\u4E2A\u97F3\u7684\u5F00\u5934\uFF09": { en: "Chord symbols (not at the start of a note)" },
  "\u548C\u5F26\u8BB0\u53F7\uFF08\u8FD9\u4E00\u7248\u4E0D\u8BA4\u7684\u79CD\u7C7B\uFF09": { en: "Chord symbols (a kind this version doesn't know)" },
  "\u6F14\u594F\u6CD5\u8BB0\u53F7\uFF08\u8FD9\u4E00\u7248\u4E0D\u8BA4\u7684\uFF09": { en: "Articulation marks (not recognized by this version)" },
  "\u529B\u5EA6\u8BB0\u53F7\uFF08\u8FD9\u4E00\u7248\u4E0D\u8BA4\u7684\uFF0C\u5982 sfz\uFF09": { en: "Dynamic marks (not recognized by this version, such as sfz)" },
  "\u6309\u62CD\u5B50\u91CD\u590D\u7684\u98A4\u97F3\uFF08\u4E00\u4E24\u9053\u659C\u7EBF\uFF09": { en: "Measured tremolo (one or two slashes)" },
  "\u5927\u8C31\u8868\u4E0B\u9762\u4E00\u884C\u7684\u6362\u8C31\u53F7": { en: "clef changes on the lower staff of a grand staff" },
  "\u6587\u5B57\u8BB0\u53F7\uFF08\u5982 dolce\u3001rit.\uFF09": { en: "Text directions (e.g. dolce, rit.)" },
  "\u522B\u7684\u65B9\u5411\u8BB0\u53F7": { en: "Other direction marks" },
  "\u88C5\u9970\u97F3": { en: "Grace notes" },
  "\u63D0\u793A\u97F3\u7B26": { en: "Cue notes" },
  "\u540C\u4E00\u58F0\u90E8\u91CC\u7684\u7B2C\u4E8C\u6761\u65CB\u5F8B": { en: "A second melody within one part" },
  "\u53E0\u97F3\uFF08\u524D\u9762\u6CA1\u6709\u80FD\u53E0\u7684\u97F3\uFF09": { en: "Stacked notes (with nothing before to stack on)" },
  "\u6CA1\u6709\u97F3\u9AD8\u7684\u97F3\uFF08\u6253\u51FB\u4E50\uFF09": { en: "Unpitched notes (percussion)" },
  "\u7B2C\u4E8C\u6BB5\u53CA\u4EE5\u540E\u7684\u6B4C\u8BCD": { en: "Lyrics beyond the first verse" },
  "\uFF08\u6CA1\u6709\u4E50\u624B\uFF09": { en: "(no performer)" },
  "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF09": { en: "Tsukuyomi-chan Corpus Terms of Use (derived model)" },
  "\u6B4C\u8BCD\u600E\u4E48\u6392": { en: "how lyrics are laid out" },
  "\u8C31\u4E0A\u7684\u5B57\u7528\u54EA\u79CD\u8BED\u8A00": { en: "language of the text on the score" },
  "\u53C2\u8003\u7A97\u7684\u6587\u4EF6\u4E0D\u5728 {REFERENCES_DIR} \u4E0B\uFF1A{path}": { en: "A reference window file isn't under {REFERENCES_DIR}: {path}" },
  "\u9EA6\u514B\u98CE {t}": { en: "Mic {t}" },
  "\u9EA6\u514B\u98CE {x}": { en: "Mic {x}" },
  "\u4E0A\u573A\u7684\u5019\u9009\u4E0D\u80FD\u5220\uFF0C\u5148\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": { en: "The candidate on stage can't be deleted; change \u201CWho performs\u201D first" },
  "\u89D2\u8272": { en: "role" },
  "\u6DF7\u97F3\u8F68": { en: "Bus" },
  "\u6F14\u594F\u8005": { en: "performer" },
  "\u6548\u679C\u683C": { en: "effect slot" },
  "\u6548\u679C\u7684\u79CD\u7C7B": { en: "effect type" },
  "\u8FD9\u9996\u6B4C\u7684\u6587\u4EF6\u91CC\u6709\u4E0D\u5408\u89C4\u77E9\u7684\u7F16\u53F7\uFF08{what}\uFF09\uFF1A\u591A\u534A\u662F\u88AB\u522B\u7684\u5DE5\u5177\u6539\u8FC7\u6216\u8005\u6587\u4EF6\u574F\u4E86\uFF0C\u6CA1\u6709\u6253\u5F00\u3002": { en: "This song file contains malformed internal IDs ({what}): it was probably edited by another tool or is damaged, so it was not opened." },
  "{k} {n} \u4E2A": { en: "{n} \xD7 {k}" },
  "\u8FD9\u4EFD\u8C31\u6CA1\u5199\u901F\u5EA6\uFF0C\u6309 \u2669={bpm} \u5F00\u7684\u3002": { en: "This score has no tempo; opened at \u2669={bpm}." },
  "\u8FD9\u4EFD\u8C31\u6CA1\u5199\u8C03\u53F7\uFF0C\u6309 C \u5927\u8C03\u5F00\u7684\u3002": { en: "This score has no key signature; opened in C major." },
  "\u8FD9\u4EFD\u8C31\u6CA1\u5199\u62CD\u53F7\uFF0C\u6309 {t} \u5F00\u7684\u3002": { en: "This score does not write a time signature; opened as {t}." },
  "\u8FD9\u4E2A\u6587\u4EF6\u89E3\u4E0D\u5F00\uFF08\u4E0D\u662F\u5B8C\u6574\u7684 .mxl\uFF1F\uFF09\uFF1A{Error}": { en: "This file can't be unpacked (not a complete .mxl?): {Error}" },
  "\u8FD9\u4E2A\u538B\u7F29\u5305\u91CC\u6CA1\u6709 META-INF/container.xml\uFF0C\u4E0D\u662F .mxl": { en: "This archive has no META-INF/container.xml, so it's not an .mxl" },
  "container.xml \u6307\u7684\u4E3B\u4E50\u8C31\u5728\u5305\u91CC\u627E\u4E0D\u5230": { en: "The main score named in container.xml isn't in the archive" },
  "{p} \u8BFB\u4E0D\u61C2\uFF08\u6587\u4EF6\u574F\u4E86\uFF1F\uFF09": { en: "{p} can't be read (damaged file?)" },
  "\u8FD9\u9996\u6B4C\u662F\u66F4\u65B0\u7248\u672C\u7684 MoonSinger \u5B58\u7684\uFF08{what} \u7B2C {major} \u7248\uFF0C\u8FD9\u4E00\u7248\u53EA\u8BA4\u5230\u7B2C {p} \u7248\uFF09\uFF0C\u6253\u5F00\u518D\u5B58\u4F1A\u4E22\u4E1C\u897F\uFF0C\u6240\u4EE5\u6CA1\u6709\u6253\u5F00\u3002\u8BF7\u5148\u66F4\u65B0 app\u3002": { en: "This song was saved by a newer MoonSinger ({what} version {major}, this version knows up to {p}); opening and saving would lose data, so it wasn't opened. Please update the app first." },
  "\u603B\u76EE\u5F55": { en: "The manifest" },
  "\u8C31\u7684\u6269\u5C55": { en: "The score extension" },
  "\u4F11\u606F\u5BA4\u300C{name}\u300D": { en: "Green room \u201C{name}\u201D" },
  "\u5F55\u97F3\u623F": { en: "The studio" },
  "\u8C31\u7684\u6269\u5C55\u91CC\u6CA1\u6709\u7EB8\u7684\u8868\uFF0C\u8BFB\u4E0D\u61C2": { en: "The score extension has no list of sheets; cannot read it" },
  "\u7EB8\u300C{id}\u300D\u7684\u8C31\uFF08{file}\uFF09\u5728\u5305\u91CC\u627E\u4E0D\u5230": { en: "Score of sheet \u201C{id}\u201D ({file}) isn't in the archive" },
  "\u8FD9\u9996\u6B4C\u662F\u66F4\u65B0\u7248\u672C\u7684 MoonSinger \u5B58\u7684\uFF08{p}\u91CC\u6709\u8FD9\u4E00\u7248\u8FD8\u6CA1\u6709\u7684\u4E1C\u897F\uFF09\uFF1A\u7167\u6837\u80FD\u5F00\u80FD\u6539\u80FD\u5B58\uFF0C\u53EA\u662F\u90A3\u4E9B\u4E1C\u897F\u8FD9\u4E00\u7248\u770B\u4E0D\u5230\uFF0C\u5728\u8FD9\u4E00\u7248\u91CC\u5B58\u4E00\u6B21\uFF0C\u5176\u4E2D\u4E00\u90E8\u5206\u4F1A\u4E22\u3002\u60F3\u539F\u6837\u7559\u7740\uFF0C\u5148\u66F4\u65B0 app \u518D\u6539\u3002": { en: "This song was saved by a newer MoonSinger ({p} has things this version doesn\u2019t know): you can still open, edit and save it, but this version can\u2019t show those things, and saving it here will lose some of them. To keep them as they are, update the app before editing." },
  "\u8FD9\u9996\u6B4C\u7684\u6DF7\u97F3\u53F0\u90A3\u4E00\u4EFD\u8BFB\u4E0D\u61C2\uFF1A\u6BCF\u6761\u8F68\u7684\u63A8\u5B50\u3001\u58F0\u50CF\u6309\u9ED8\u8BA4\u5F00\u7684\uFF08\u603B\u8F68\u7167\u6587\u4EF6\u91CC\u5199\u7684\uFF09\u3002\u5B58\u4E00\u6B21\u5C31\u6309\u73B0\u5728\u7684\u6837\u5B50\u5199\u8FDB\u6587\u4EF6\u3002": { en: "This song\u2019s mixer part cannot be read: each track\u2019s fader and pan opened at their defaults (the master as written in the file). Saving once writes the current state into the file." },
  "\u58F0\u90E8\u300C{name}\u300D\u548C\u522B\u7684\u58F0\u90E8\u5171\u7528\u4E00\u4EFD\u4E50\u5668\u8BBE\u7F6E\uFF1B\u6BCF\u4E2A\u58F0\u90E8\u6709\u81EA\u5DF1\u7684\u4E50\u5668\uFF0C\u6240\u4EE5\u62C6\u6210\u4E86\u4E24\u4EFD\uFF08\u4E50\u5668\u548C\u8BBE\u7F6E\u90FD\u7167\u6284\uFF09\u3002": { en: "Part \u201C{name}\u201D shared its instrument settings with another part; every part has its own instrument, so they were split into two copies (instrument and settings copied)." },
  "\u8FD9\u4EFD\u8C31\u91CC\u6709\u8FD9\u4E00\u7248\u8FD8\u4E0D\u652F\u6301\u7684\u4E1C\u897F\uFF0C\u6CA1\u6709\u8BFB\u8FDB\u6765\uFF1A{k}\u3002\u5B58\u7684\u65F6\u5019\u5B83\u4EEC\u4E0D\u4F1A\u5728\u65B0\u6587\u4EF6\u91CC\u2014\u2014\u8981\u7559\u539F\u6837\uFF0C\u8BF7\u300C\u53E6\u5B58\u4E3A\u300D\u65B0\u6587\u4EF6\u3002": { en: "This score has things this version doesn't support, which weren't read: {k}. They won't be in a new file when saving \u2014 to keep them, save as a new file." },
  "{k} {n} \u5904": { en: "{k} at {n} places" },
  "\u539F\u6765\u7684\u4E50\u5668": { en: "The original instrument" },
  "\u58F0\u90E8\u300C{name}\u300D\u539F\u6765\u662F{was}{gm}\uFF1B\u8FD9\u4E00\u7248\u6CA1\u6709\u8FD9\u4EF6\u4E50\u5668\uFF0C\u6240\u4EE5\u8FD8\u6CA1\u4EBA\u4E0A\u573A\u3002\u8981\u5C0F\u6708\u76F8\u6765\u5531\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u300C{name2}\u300D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u9009\u5C0F\u6708\u76F8\u3002": { en: "Part \u201C{name}\u201D used to be {was}{gm}; this version doesn't have that instrument, so nobody is on stage yet. To have Tsukuyomi-chan sing it, tap \u201C{name2}\u201D at the front of the score and choose her under \u201CWho performs\u201D." },
  "\uFF08GM {gm} \u53F7\uFF09": { en: " (GM {gm})" },
  "\u300C{name}\u300D\u7684\u58F0\u97F3\uFF08{path}\uFF09\u6CA1\u968F\u8FD9\u9996\u6B4C\u4E00\u8D77\u5E26\u6765\uFF0C\u6240\u4EE5\u6CA1\u4EBA\u4E0A\u573A\u3002\u70B9\u8C31\u524D\u9762\u7684\u300C{name2}\u300D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": { en: "The sound of \u201C{name}\u201D ({path}) didn't come with this song, so nobody is on stage. Tap \u201C{name2}\u201D at the front of the score to change \u201CWho performs\u201D." },
  "\u8FD9\u9996\u6B4C\u662F\u66F4\u65B0\u7248\u672C\u7684 MoonSinger \u5B58\u7684\uFF0C\u9875\u9762\u8BBE\u7F6E\u91CC\u8FD9\u51E0\u6837\u8FD9\u4E00\u7248\u4E0D\u8BA4\u8BC6\uFF1A{keys}\u3002\u753B\u7684\u65F6\u5019\u5148\u6309\u6700\u57FA\u672C\u7684\u90A3\u4E00\u6863\uFF0C\u5B58\u7684\u65F6\u5019\u7167\u539F\u6837\u5199\u56DE\u3002": { en: "This song was saved by a newer MoonSinger; this version doesn\u2019t recognise these page settings: {keys}. They are drawn with the most basic option for now and written back unchanged when you save." },
  "\u5C0F\u6708\u76F8\uFF08\u5143\u97F3\uFF09": { en: "Tsukuyomi-chan (vowels)" },
  "XML \u8BFB\u4E0D\u61C2\uFF08\u7B2C {i} \u884C\uFF09\uFF1A{what}": { en: "Can't read the XML (line {i}): {what}" },
  "\u6CE8\u91CA\u6CA1\u6536\u5C3E": { en: "Unterminated comment" },
  "CDATA \u6CA1\u6536\u5C3E": { en: "Unterminated CDATA" },
  "\u5904\u7406\u6307\u4EE4\u6CA1\u6536\u5C3E": { en: "Unterminated processing instruction" },
  "\u7ED3\u675F\u6807\u7B7E\u6CA1\u6536\u5C3E": { en: "Unterminated end tag" },
  "\u7ED3\u675F\u6807\u7B7E </{name}> \u5BF9\u4E0D\u4E0A <{top}>": { en: "End tag </{name}> doesn't match <{top}>" },
  "\u6807\u7B7E\u540D": { en: "Tag name" },
  "<{name}> \u91CC\u6709\u8BFB\u4E0D\u61C2\u7684\u4E1C\u897F": { en: "Something unreadable inside <{name}>" },
  "<{name}> \u6CA1\u6709\u7ED3\u675F": { en: "<{name}> has no end" },
  "\u6CA1\u6709\u6839\u5143\u7D20": { en: "No root element" },
  "\u8FD8\u6CA1\u6709\u6B4C\u3002\u70B9\u300C\u65B0\u5EFA\u300D\u5199\u4E00\u9996\uFF0C\u6216\u628A .mxl \u62D6\u8FDB\u6765\u3002": { en: "No songs yet. Tap \u201CNew\u201D to write one, or drag in an .mxl." },
  "\u8FD9\u4E2A\u5939\u91CC\u8FD8\u6CA1\u6709\u6B4C\u3002": { en: "No songs in this folder yet." },
  "\u56DE\u6536\u7AD9\u662F\u7A7A\u7684\u3002": { en: "The trash is empty." },
  "\u6253\u5F00\u4E2D": { en: "Open now" },
  "\u6B4C\u5E93": { en: "Library" },
  "\u4E91\u7AEF\uFF1A\u767B\u5F55 / \u9000\u51FA": { en: "Cloud: sign in / out" },
  "\u5373\u5174\uFF1A\u6311\u4E50\u5668\u3001\u7528\u952E\u76D8\u5F39\u7740\u73A9\uFF08\u4E0D\u5199\u8FDB\u54EA\u9996\u6B4C\uFF09": { en: "Jam: pick an instrument and play on the keys for fun (not written into any song)" },
  "\u5373\u5174": { en: "Jam" },
  "\u65B0\u5EFA\uFF1A\u4E00\u9996\u6B4C / \u4E00\u4E2A\u6587\u4EF6\u5939": { en: "New: a song / a folder" },
  "\u56DE\u6536\u7AD9\u548C\u5907\u4EFD\u7BB1": { en: "Trash and backups" },
  "\u56DE\u5230\u6B4C": { en: "Back to the song" },
  "\u56DE\u6536\u7AD9": { en: "Trash" },
  "\u5907\u4EFD\u7BB1": { en: "Backups" },
  "\u6E05\u7A7A": { en: "Clear" },
  "\u65E7": { en: "outdated" },
  "\u6539\u4E8E {lastModified}": { en: "Changed {lastModified}" },
  "\u6E32\u67D3\u7F13\u5B58\u91CC\u8FD8\u6CA1\u6709\u8FD9\u9996\uFF1A\u70B9 = \u6E32\u67D3\uFF08\u4E4B\u540E\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF09": { en: "Not in the render cache yet: tap to render (then play it from the cover)" },
  "\u6682\u505C\uFF08\u5E95\u8FB9\u64AD\u653E\u6761\u4E0A\u4E5F\u80FD\u63A7\uFF09": { en: "Pause (also on the bottom player bar)" },
  "\u64AD\u653E\u6E32\u67D3\u7F13\u5B58\u91CC\u4E0A\u6B21\u6E32\u7684\u90A3\u4E00\u904D\uFF08\u4E4B\u540E\u6539\u8FC7\uFF0C{p} \u79D2\uFF09": { en: "Play the last render from the render cache (outdated: changed since; {p} s)" },
  "\u64AD\u653E\u6E32\u67D3\u7F13\u5B58\u91CC\u7684\u8FD9\u4E00\u904D\uFF08\u65E7\u7248\u672C\u7684\u5F15\u64CE\u6E32\u7684\uFF0C{p} \u79D2\uFF09": { en: "Play the copy in the render cache (rendered by an older engine, {p} s)" },
  "\u64AD\u653E\u6E32\u67D3\u7F13\u5B58\u91CC\u7684\u8FD9\u4E00\u904D\uFF08{p} \u79D2\uFF09": { en: "Play from render cache ({p} s)" },
  "\u542C\u6B4C\u91CC\u5E26\u7740\u7684\u90A3\u4EFD mp3\uFF08{p} \u79D2\uFF09": { en: "Play the mp3 stored inside the song ({p} s)" },
  "\u6E32\u67D3\u7F13\u5B58\u91CC\u90A3\u4E00\u904D\u662F\u6539\u4E4B\u524D\u3001\u7528\u65E7\u7248\u672C\u7684\u5F15\u64CE\uFF08\u6E32\u67D3\u6838\u5FC3 {v}\uFF09\u6E32\u7684\uFF1A\u7167\u6837\u80FD\u542C\uFF1B\u64AD\u653E\u6761\u4E0A\u300C\u91CD\u65B0\u6E32\u67D3\u300D\u6309\u73B0\u5728\u7684\u6837\u5B50\u3001\u7528\u73B0\u5728\u7684\u5F15\u64CE\u91CD\u6E32": { en: "The copy in the render cache was rendered before later edits, by an older engine (render core {v}): you can still play it; \u201CRender again\u201D on the player bar re-renders the song as it is now with the current engine" },
  "\u6E32\u67D3\u7F13\u5B58\u91CC\u90A3\u4E00\u904D\u662F\u65E7\u7248\u672C\u7684\u5F15\u64CE\uFF08\u6E32\u67D3\u6838\u5FC3 {v}\uFF09\u6E32\u7684\uFF1A\u7167\u6837\u80FD\u542C\uFF1B\u64AD\u653E\u6761\u4E0A\u300C\u91CD\u65B0\u6E32\u67D3\u300D\u7528\u73B0\u5728\u7684\u5F15\u64CE\u91CD\u6E32": { en: "The copy in the render cache was rendered by an older engine (render core {v}): you can still play it; \u201CRender again\u201D on the player bar re-renders it with the current engine" },
  "\u6E32\u67D3\u7F13\u5B58\u91CC\u90A3\u4E00\u904D\u662F\u6539\u4E4B\u524D\u6E32\u7684\uFF08\u4E4B\u540E\u6539\u8FC7\uFF09": { en: "The render cache has a render from before later changes" },
  "\u4ECE\u5934\u653E\uFF08\u9501\u5C4F / \u8033\u673A\u7684\u300C\u4E0A\u4E00\u9996\u300D\u4E5F\u662F\uFF09": { en: "From the top (\u201Cprevious track\u201D on the lock screen / headphones too)" },
  "\u653E / \u6682\u505C": { en: "Play / pause" },
  "\u6309\u73B0\u5728\u7684\u6837\u5B50\u91CD\u65B0\u6E32\u4E00\u904D": { en: "Render again as it is now" },
  "\u91CD\u65B0\u6E32\u67D3": { en: "Render again" },
  "\u5206\u4EAB / \u4E0B\u8F7D\u8FD9\u9996\u7684 mp3": { en: "Share / download this song\u2019s mp3" },
  "\u505C": { en: "Stop" },
  "{stem} \xB7 \u65E7\uFF08\u4E4B\u540E\u6539\u8FC7\uFF09": { en: "{stem} \xB7 outdated (changed since)" },
  "{stem} \xB7 \u65E7\uFF08\u65E7\u7248\u672C\u7684\u5F15\u64CE\u6E32\u7684\uFF09": { en: "{stem} \xB7 old (rendered by an older engine)" },
  "\u8FD9\u4E00\u904D\u662F\u65E7\u7248\u672C\u7684\u5F15\u64CE\u6E32\u7684\uFF1A\u7528\u73B0\u5728\u7684\u5F15\u64CE\u91CD\u65B0\u6E32\u4E00\u904D\uFF0C\u6362\u6389\u5B83": { en: "This copy was rendered by an older engine: render it again with the current engine to replace it" },
  "\u8FD9\u4E00\u904D\u662F\u4E4B\u524D\u6E32\u7684\uFF1A\u5FAA\u73AF\u8981\u7B49\u4F59\u97F3\u653E\u5B8C\u624D\u56DE\u5230\u5F00\u5934\u3002\u91CD\u65B0\u6E32\u4E00\u904D\uFF0C\u5FAA\u73AF\u5C31\u6309\u8C31\u5207\uFF08\u548C\u7F16\u8F91\u5668\u91CC\u4E00\u6837\uFF09": { en: "This render is from before: looping waits for the tail to die out before starting over. Render again and the loop cuts by the score, like in the editor" },
  "\u5355\u66F2\u5FAA\u73AF\uFF1A\u5F00\u7740\uFF08\u653E\u5B8C\u4ECE\u5934\u518D\u653E\uFF0C\u9501\u5C4F\u4E5F\u4E00\u6837\uFF09": { en: "Loop song: on (restarts at the end, on the lock screen too)" },
  "\u5355\u66F2\u5FAA\u73AF\uFF1A\u5173\u7740\uFF08\u653E\u5B8C\u5C31\u505C\uFF09": { en: "Loop song: off (stops at the end)" },
  "\u6E32\u67D3\u7F13\u5B58\u91CC\u8FD8\u6CA1\u6709\u8FD9\u9996\uFF1A\u70B9\u5B83\u5C01\u9762\u4E0A\u7684\u94AE\u6E32\u67D3\uFF0C\u6216\u8005\u6253\u5F00\u5B83\u7528\u4E09\u6761\u6760\u91CC\u7684\u300C\u6E32\u67D3\u5230\u7F13\u5B58\u300D\u3002": { en: "This song isn\u2019t in the render cache yet: tap the button on its cover to render it, or open it and use \u201CRender to cache\u201D in the \u2630 menu." },
  "\u53D6\u300C{stem}\u300D\u7684\u58F0\u97F3\u2026": { en: "Getting the audio for \u201C{stem}\u201D\u2026" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BB0\u7740\u7684\u90A3\u4E00\u904D": { en: "Remembered on this device" },
  "\u6CA1\u80FD\u81EA\u5DF1\u5F00\u59CB\u653E\uFF1A\u70B9\u5E95\u8FB9\u64AD\u653E\u6761\u4E0A\u7684 \u25B6": { en: "Couldn't start playing by itself: tap \u25B6 on the bottom player bar" },
  "\u6B4C\u5E93\u8FD8\u6CA1\u63A5\u4E0A\uFF0C\u5EFA\u4E0D\u4E86\u6587\u4EF6\u5939": { en: "The library isn't connected yet, so folders can't be created" },
  "\u65B0\u5EFA\u6587\u4EF6\u5939": { en: "New folder" },
  "\u65B0\u6587\u4EF6\u5939": { en: "New folder" },
  "\u6587\u4EF6\u5939\u540D": { en: "Folder name" },
  "\u6587\u4EF6\u5939\u540D\u4E0D\u80FD\u7A7A\u7740": { en: "Folder name can't be empty" },
  '\u6587\u4EF6\u5939\u540D\u91CC\u4E0D\u80FD\u6709 / \\ : * ? " < > |\uFF0C\u4E5F\u4E0D\u80FD\u7528\u70B9\u6216\u7A7A\u683C\u5F00\u5934 / \u7ED3\u5C3E\uFF08OneDrive \u4E0D\u6536\uFF09': { en: `Folder names can't contain / \\ : * ? " < > |, or start / end with a dot or space (OneDrive rejects them)` },
  "\u65B0\u5EFA\u6587\u4EF6\u5939\u300C{n}\u300D\u2026": { en: "Creating folder \u201C{n}\u201D\u2026" },
  "\u300C{n}\u300D\u8FD9\u4E2A\u540D\u5B57\u5DF2\u7ECF\u6709\u4E86\uFF08\u540C\u540D\u7684\u6B4C\u6216\u6587\u4EF6\u5939\uFF09": { en: "\u201C{n}\u201D already exists (a song or folder with that name)" },
  "\u5EFA\u597D\u4E86\u6587\u4EF6\u5939\u300C{n}\u300D": { en: "Created folder \u201C{n}\u201D" },
  "\u65B0\u5EFA\u6587\u4EF6\u5939\u6CA1\u6210\u529F\uFF1A{Error}": { en: "Couldn't create folder: {Error}" },
  "\u65B0\u5EFA\u6B4C": { en: "New song" },
  "\u5728\u73B0\u5728\u8FD9\u4E2A\u5939\u91CC": { en: "In this folder" },
  "\u65B0\u5EFA\u6587\u4EF6\u5939\u2026": { en: "New folder\u2026" },
  "\u6B4C\u5E93\u5728\u6587\u4EF6\u5939\u300C{folder}\u300D": { en: "Library is in folder \u201C{folder}\u201D" },
  "\u4E91\u7AEF\uFF1A\u5DF2\u767B\u5F55{p}": { en: "Cloud: signed in{p}" },
  "\u4E91\u7AEF\uFF1A\u6CA1\u767B\u5F55\uFF08\u6B4C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF09": { en: "Cloud: not signed in (songs only on this device)" },
  "{file} \u548C app \u5185\u5D4C\u7684\u4E0D\u4E00\u6837\uFF08\u88AB\u6539\u8FC7\uFF1F\uFF09": { en: "{file} differs from the copy built into the app (modified?)" },
  "\u9F13\u4EF6 {note}": { en: "Drum piece {note}" },
  "{zh}\u7684\u5E38\u7528\u97F3\u57DF{basis}": { en: "Common range of {zh}{basis}" },
  "\uFF08\u4F9D\u636E\uFF1A{basis}\uFF09": { en: " (basis: {basis})" },
  "\u539F\u901F\u952E\uFF1A\u6309\u8FD9\u4E2A\u952E\uFF0C\u91C7\u6837\u4E0D\u62C9\u4F38\u4E0D\u538B\u7F29{recommendedBasis}": { en: "Original-speed key: press this key and the sample isn't stretched or compressed{recommendedBasis}" },
  "\u8C31\u4E0A\u5199\u7684\u5C31\u662F\u5B9E\u9645\u97F3\u9AD8\uFF08MoonSinger \u4E0D\u6309\u4E50\u5668\u79FB\u8C03\uFF09\uFF0C\u53D1\u7ED9\u97F3\u6E90\u7684\u4E5F\u662F\u8FD9\u4E2A\u97F3\u3002": { en: "What's written is the actual pitch (MoonSinger doesn't transpose by instrument), and that's what's sent to the sound source." },
  "\u8FD9\u4EF6\u4E50\u5668\u7684\u8C31\u4E60\u60EF\u5199{p} {octave} \u4E2A\u516B\u5EA6\uFF08\u5B9E\u9645{p2}\uFF09\uFF1B\u60F3\u8981\u8C31\u9762\u597D\u8BFB\uFF0C\u7528\u8C31\u53F7\uFF08\u8FD9\u4EF6\u4E50\u5668\u6309\u5B9E\u9645\u97F3\u9AD8\u65F6\u5E38\u7528\u300C{concertClef}\u300D\uFF0C\u8C31\u53F7\u300C\u81EA\u52A8\u300D\u4E5F\u4F1A\u6311\uFF09\u6216 8va \u7EBF\uFF0C\u51FA\u58F0\u4E0D\u53D8\u3002": { en: "This instrument is customarily written {p} {octave} octaves (sounding {p2}); for an easier-to-read score, use a clef (at concert pitch it commonly uses \u201C{concertClef}\u201D, which \u201CAuto\u201D also picks) or an 8va line; the sound doesn't change." },
  "\u4F4E": { en: "lower" },
  "\u9AD8": { en: "higher" },
  "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u5224\u4E0D\u51C6\u2014\u2014\u6BCF\u4E2A\u952E\u6700\u5F3A\u7684\u90A3\u4E2A\u5206\u97F3\u6BD4\u952E\u540D\u9AD8 {measured} \u534A\u97F3\uFF0C\u542C\u8D77\u6765\u591A\u534A\u8DDF\u7740\u5B83\u3002": { en: "Measured on this GS sound: unclear \u2014 the strongest partial of each key is {measured} semitones above the key name, and it likely sounds like that." },
  "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u6309\u54EA\u4E2A\u952E\uFF0C\u8033\u6735\u542C\u5230\u7684\u5C31\u662F\u90A3\u4E2A\u97F3\u3002": { en: "Measured on this GS sound: whichever key you press is the note you hear." },
  "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u6700\u5F3A\u7684\u5206\u97F3\u6BD4\u952E\u540D\u9AD8 {measured} \u534A\u97F3\uFF08{measuredOctave} \u4E2A\u516B\u5EA6\uFF09\uFF0C\u4F46\u8033\u6735\u542C\u5230\u7684\u97F3\u540D\u8FD8\u662F\u952E\u540D\uFF08\u949F\u7684\u6253\u51FB\u97F3\uFF09\u2014\u2014\u542C\u7740\u89C9\u5F97\u9AD8\u4E86\u662F\u8FD9\u4E2A\u539F\u56E0\u3002": { en: "Measured on this GS sound: the strongest partial is {measured} semitones above the key name ({measuredOctave} octaves), but the perceived note is still the key name (a bell's strike tone) \u2014 that's why it can sound high." },
  "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u8033\u6735\u542C\u5230\u7684\u6BD4\u952E\u540D{p} {perceived} \u534A\u97F3\u3002": { en: "Measured on this GS sound: it sounds {p} than the key name by {perceived} semitones." },
  "\u6309\u5E74\u4EE3": { en: "By era" },
  "\u6309\u66F2\u98CE": { en: "By genre" },
  "\u6309\u79CD\u7C7B\uFF08\u9F13\u3001Pad\u2026\uFF09": { en: "By kind (drums, pads\u2026)" },
  "\u6309\u65CF\uFF08GM \u7684\u987A\u5E8F\uFF09": { en: "By family (GM order)" },
  "\u6309\u53D1\u58F0\u65B9\u5F0F": { en: "By sound source" },
  "\u4F53\u9E23\uFF08\u6572\u5B83\u81EA\u5DF1\uFF09": { en: "Idiophones (struck itself)" },
  "\u819C\u9E23\uFF08\u6572\u76AE\uFF09": { en: "Membranophones (struck skin)" },
  "\u5F26\u9E23\uFF08\u5F26\uFF09": { en: "Chordophones (strings)" },
  "\u6C14\u9E23\uFF08\u6C14\uFF09": { en: "Aerophones (air)" },
  "\u7535\u9E23\uFF08\u7535\uFF09": { en: "Electrophones (electric)" },
  "\u4EBA\u58F0": { en: "Voice" },
  "\u97F3\u6548": { en: "Sound effects" },
  "\uFF08{from} \u8D77\uFF09": { en: " (from {from})" },
  "\u5E74\u4EE3\u4E0D\u8BE6": { en: "Era unknown" },
  "\u5206\u7C7B\u4E0D\u8BE6": { en: "Family unknown" },
  "\u9F13\u548C\u6253\u51FB\u4E50": { en: "Drums & percussion" },
  "Pad\uFF08\u5408\u6210\u5668\u7684\u94FA\u5E95\u97F3\u8272\uFF09": { en: "Pads (synth pad sounds)" },
  "\u5176\u4F59\uFF08\u8FD8\u6CA1\u6309\u79CD\u7C7B\u5206\uFF09": { en: "Others (not sorted by kind yet)" },
  "\u6CA1\u8D34\u98CE\u683C": { en: "No style tag" },
  "\u516C\u5143\u524D {y}": { en: "{y} BC" },
  "\u5199\u97F3": { en: "Write notes" },
  "1\u20137\uFF08\u5C0F\u952E\u76D8\u4E5F\u884C\uFF09": { en: "1\u20137 (numpad too)" },
  "\u5199\u4E00\u4E2A\u97F3\uFF1A\u8C03\u91CC\u7B2C\u51E0\u7EA7\uFF0C\u843D\u5728\u79BB\u4E0A\u4E00\u4E2A\u97F3\u6700\u8FD1\u5904": { en: "Write a note: this scale degree, nearest the previous note" },
  "\u628A\u9009\u4E2D\u7684\u7B2C\u4E00\u4E2A\u97F3\u6539\u6210\u8FD9\u4E00\u7EA7\uFF0C\u9009\u4E2D\u8DF3\u5230\u4E0B\u4E00\u4E2A\u97F3": { en: "Change the first selected note to this degree, and move the selection to the next note" },
  "\u53EA\u5531\u4E0D\u5199": { en: "Sound only, don't write" },
  "\u53E0\uFF1A\u8FD9\u4E00\u7EA7\u53E0\u5230\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u4E0A\uFF08\u548C\u5F26\uFF0C\u843D\u5728\u79BB\u5B83\u73B0\u6709\u7684\u97F3\u6700\u8FD1\u5904\uFF1B\u5DF2\u7ECF\u6709 = \u53BB\u6389\uFF09\u3002\u540C pad\u300C\u53E0\u300D": { en: "Stack: add this degree to the note before the cursor (a chord, placed nearest its existing notes; already there = removed). Same as the pad's stack key" },
  "\u53E0\u5230\u521A\u5199\u7684\u90A3\u4E2A / \u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\u4E0A": { en: "Stack on the note just written / the selection's first note" },
  "\u540C\u4E0A\uFF0C\u5F80\u4E0B\u627E\uFF08\u6570\u5B57\u6B63\u4E0B\u65B9\u90A3\u4E00\u6392\uFF09": { en: "Same, searching downward (the row right below the digits)" },
  "\u540C\u4E0A\uFF0C\u5F80\u4E0B\u627E": { en: "Same, searching downward" },
  "\u53EA\u5531\u4E0D\u5199\uFF08\u5F80\u4E0B\u627E\uFF09": { en: "Sound only, don't write (searching downward)" },
  "\u4F11\u6B62": { en: "Rest" },
  "\u9009\u533A\u91CC\u5199\u4E00\u4E2A\u4F11\u6B62\uFF08\u66FF\u6362\u6A21\u5F0F\uFF1A\u6309\u957F\u77ED\u6863\u5403\u6389\u9009\u533A\u91CC\u7684\u97F3\uFF0C\u4E0D\u5199\u51FA\u9009\u533A\uFF09": { en: "Write a rest in the selection (replace mode: eats selected notes at the current length, never past the selection)" },
  "\u5C0F\u8282\u7EBF": { en: "Barline" },
  "\u5728\u9009\u4E2D\u540E\u9762\u63D2\u5C0F\u8282\u7EBF": { en: "Insert a barline after the selection" },
  "\u77ED\uFF1A\u4E0B\u4E00\u4E2A\u97F3\u7684\u65F6\u503C\u51CF\u534A\uFF08\u5230\u4E09\u5341\u4E8C\u5206\u4E3A\u6B62\uFF09": { en: "Shorter: halve the next note's length (down to a thirty-second)" },
  "\u77ED\uFF1A\u63A5\u4E0B\u6765\u5199\u7684\u51CF\u534A\uFF08\u9009\u533A\u91CC\u5199 = \u6309\u8FD9\u4E00\u6863\u66FF\u6362\uFF1B\u6574\u7EC4\u6539\u65F6\u503C\u8D70\u9009\u533A\u83DC\u5355\uFF09": { en: "Shorter: halve what's written next (in a selection = replaces at this length; to change a whole group, use the selection menu)" },
  "\u957F\uFF1A\u4E0B\u4E00\u4E2A\u97F3\u7684\u65F6\u503C\u52A0\u500D\uFF08\u5230\u5168\u97F3\u7B26\u4E3A\u6B62\uFF09": { en: "Longer: double the next note's length (up to a whole note)" },
  "\u957F\uFF1A\u63A5\u4E0B\u6765\u5199\u7684\u52A0\u500D\uFF08\u9009\u533A\u91CC\u5199 = \u6309\u8FD9\u4E00\u6863\u66FF\u6362\uFF1B\u6574\u7EC4\u6539\u65F6\u503C\u8D70\u9009\u533A\u83DC\u5355\uFF09": { en: "Longer: double what's written next (in a selection = replaces at this length; to change a whole group, use the selection menu)" },
  "\u4E09\u8FDE\u97F3\u5F00 / \u5173\uFF08\u4E0B\u4E00\u4E2A\u97F3\u8D77\uFF09": { en: "Triplets on / off (from the next note)" },
  "\u521A\u5199\u7684\u97F3\u52A0\u4E00\u4EFD\uFF08\u7B80\u8C31\u7684\u6A2A\u7EBF\uFF09\uFF1B\u9694\u7740\u5C0F\u8282\u7EBF = \u65B0\u5F00\u4E00\u4E2A\u8FDE\u7740\u7684\u540C\u97F3": { en: "Add one unit to the note just written (the jianpu dash); across a barline = starts a tied note of the same pitch" },
  "\u9009\u4E2D\u7684\u97F3\u5404\u52A0\u4E00\u4EFD": { en: "Add one unit to each selected note" },
  "\u97F3\u9AD8": { en: "Pitch" },
  "\u266F\uFF1A\u70B9\u4E00\u4E0B\u7BA1\u4E0B\u4E00\u4E2A\u97F3\uFF0C\u8FDE\u70B9\u4E24\u4E0B\u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00": { en: "\u266F: tap = next note, double-tap = lock, tap again = unlock" },
  "\u9009\u4E2D\u7684\u97F3\u5347\u534A\u97F3": { en: "Raise selected notes a semitone" },
  "\u266D\uFF1A\u540C\u4E0A": { en: "\u266D: same" },
  "\u9009\u4E2D\u7684\u97F3\u964D\u534A\u97F3": { en: "Lower selected notes a semitone" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u9AD8\u516B\u5EA6": { en: "Note before the cursor up an octave" },
  "\u9009\u4E2D\u7684\u97F3\u9AD8\u516B\u5EA6": { en: "Selected notes up an octave" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u4F4E\u516B\u5EA6": { en: "Note before the cursor down an octave" },
  "\u9009\u4E2D\u7684\u97F3\u4F4E\u516B\u5EA6": { en: "Selected notes down an octave" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5F80\u4E0A\u4E00\u7EA7": { en: "Note before the cursor up a scale step" },
  "\u9009\u4E2D\u7684\u97F3\u5F80\u4E0A\u4E00\u7EA7": { en: "Selected notes up a scale step" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5F80\u4E0B\u4E00\u7EA7": { en: "Note before the cursor down a scale step" },
  "\u9009\u4E2D\u7684\u97F3\u5F80\u4E0B\u4E00\u7EA7": { en: "Selected notes down a scale step" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5347\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF1AC \u5927\u8C03 E \u2192 F\uFF09": { en: "Note before the cursor up a semitone (spelled by key: in C major, E \u2192 F)" },
  "\u9009\u4E2D\u7684\u97F3\u6574\u4F53\u5347\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09": { en: "Selected notes up a semitone (spelled by key)" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u964D\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09": { en: "Note before the cursor down a semitone (spelled by key)" },
  "\u9009\u4E2D\u7684\u97F3\u6574\u4F53\u964D\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09": { en: "Selected notes down a semitone (spelled by key)" },
  "\u5149\u6807\u4E0E\u9009\u4E2D": { en: "Cursor and selection" },
  "\u5149\u6807\u5DE6\u79FB": { en: "Cursor left" },
  "\u6536\u6210\u9009\u4E2D\u5DE6\u8FB9\u7684\u5149\u6807\uFF08\u56DE\u5230\u5199\uFF09": { en: "Collapse to a cursor left of the selection (back to writing)" },
  "\u5149\u6807\u53F3\u79FB": { en: "Cursor right" },
  "\u6536\u6210\u9009\u4E2D\u53F3\u8FB9\u7684\u5149\u6807\uFF08\u56DE\u5230\u5199\uFF09": { en: "Collapse to a cursor right of the selection (back to writing)" },
  "\u9009\u4E2D\u5149\u6807\u524D\u90A3\u4E2A\uFF08\u5199 \u2192 \u6539\uFF09": { en: "Select the item before the cursor (write \u2192 edit)" },
  "\u9009\u4E2D\u5F80\u5DE6\u6269\u4E00\u4E2A": { en: "Extend selection left by one" },
  "\u9009\u4E2D\u5149\u6807\u540E\u90A3\u4E2A\uFF08\u5199 \u2192 \u6539\uFF09": { en: "Select the item after the cursor (write \u2192 edit)" },
  "\u9009\u4E2D\u5F80\u53F3\u6269\u4E00\u4E2A": { en: "Extend selection right by one" },
  "\u4ECE\u5149\u6807\u9009\u5230\u5F00\u5934\uFF08\u5199 \u2192 \u6539\uFF09": { en: "Select from the cursor to the start (write \u2192 edit)" },
  "\u9009\u5230\u5F00\u5934": { en: "Select to the start" },
  "\u4ECE\u5149\u6807\u9009\u5230\u672B\u5C3E\uFF08Home \u518D Shift+End = \u5168\u9009\uFF09": { en: "Select from the cursor to the end (Home, then Shift+End = select all)" },
  "\u9009\u5230\u672B\u5C3E": { en: "Select to the end" },
  "\u5149\u6807\u5230\u5F00\u5934": { en: "Cursor to the start" },
  "\u5149\u6807\u5230\u672B\u5C3E": { en: "Cursor to the end" },
  "\u6536\u8D77\uFF0C\u4E0D\u8D34\u6846\u91CC\u7684\u5B57": { en: "Close without pasting the box's text" },
  "\u6536\u8D77\uFF0C\u4E0D\u6539\uFF08\u521A\u63D2\u7684\u8BB0\u53F7 = \u64A4\u6389\uFF09": { en: "Close without changing (a mark just inserted = removed)" },
  "\u5173\u6389\u9762\u677F": { en: "Close the panel" },
  "\u64A4\u56DE\u672C\u6B21\u8F93\u5165\u7684\u6700\u540E\u4E00\u7B14\uFF08\u300C\u2212\u300D\u3001\u97F3\uFF09\uFF1B\u632A\u8FC7\u5149\u6807\u540E = \u5220\u5149\u6807\u524D\u4E00\u4E2A": { en: "Take back the last stroke of this input (\u201C\u2212\u201D, a note); after moving the cursor = delete the item before it" },
  "\u5220\u6389\u9009\u4E2D": { en: "Delete the selection" },
  "\u6846\u662F\u7A7A\u7684\uFF1A\u56DE\u5230\u4E0A\u4E00\u4E2A\u97F3\uFF0C\u628A\u5B83\u7684\u5B57\u62FF\u51FA\u6765\u63A5\u7740\u5220": { en: "Empty box: back to the previous note, its text comes out to keep deleting" },
  "\u5220\u5149\u6807\u540E\u4E00\u4E2A": { en: "Delete the item after the cursor" },
  "\u5C0F\u6708\u76F8\u5531 / \u505C": { en: "Tsukuyomi-chan sing / stop" },
  "\u300C\u5F39\u300D\u5F00 / \u5173\uFF08\u97F3\u7B26\u952E\u53EA\u5531\u4E0D\u5199\uFF09": { en: "\u201CJam\u201D on / off (note keys sound without writing)" },
  "\u300C\u5F39\u300D\u5F00 / \u5173": { en: "\u201CJam\u201D on / off" },
  "\u300C\u5F39\u300D\u5173": { en: "\u201CJam\u201D off" },
  "\u6587\u4EF6": { en: "File" },
  "\u5B58\uFF08\u5B58\u56DE\u6253\u5F00\u7684\u90A3\u4E2A\u6587\u4EF6\uFF1B\u8FD8\u6CA1\u6709\u5BB6 = \u95EE\u5B58\u5230\u54EA / iPad \u4E0B\u8F7D\uFF09": { en: "Save (back to the opened file; no home yet = asks where / downloads on iPad)" },
  "\u5BFC\u51FA\u2026\uFF08\u6B4C\u58F0 mp3 / \u5B58\u4E00\u4EFD .mxl \u526F\u672C\uFF1B\u539F\u6765\u7684\u300C\u53E6\u5B58\u4E3A\u300D\u4F4F\u8FD9\u91CC\uFF09": { en: "Export\u2026 (MP3 / an .mxl copy; what used to be \u201CSave as\u201D)" },
  "\u6253\u5F00\u2026\uFF08.mxl / .musicxml\uFF09": { en: "Open\u2026 (.mxl / .musicxml)" },
  "\u9009\u533A": { en: "Selection" },
  "\u590D\u5236\u9009\u4E2D\uFF08app \u5185\u539F\u6837 + \u7CFB\u7EDF\u526A\u8D34\u677F\u4E00\u884C\u7B80\u8C31\uFF09": { en: "Copy selection (as is in the app + one line of jianpu on the system clipboard)" },
  "\u526A\u5207\u9009\u4E2D": { en: "Cut selection" },
  "\u8D34\u5728\u5149\u6807\u5904\uFF08app \u5185\u590D\u5236\u8FC7\u7684\uFF1B\u6CA1\u6709\u5C31\u8BD5\u7740\u8BFB\u7CFB\u7EDF\u526A\u8D34\u677F\u91CC\u7684\u7B80\u8C31\u6587\u5B57\uFF09": { en: "Paste at the cursor (copied in the app; otherwise tries jianpu text on the system clipboard)" },
  "\u8D34 = \u66FF\u6362\u9009\u4E2D": { en: "Paste = replace selection" },
  "\u5168\u9009\uFF08\u8FD9\u5F20\u7EB8\u4E0A\u8FD9\u4E2A\u58F0\u90E8\uFF09": { en: "Select all (this part on this sheet)" },
  "\u64A4\u9500\u4E0A\u4E00\u6B65\uFF08\u62D6 / \u8FDE\u6253\u6B4C\u8BCD\u7B97\u4E00\u6B65\uFF09": { en: "Undo the last step (a drag / a run of lyric typing counts as one)" },
  "\u6B4C\u8BCD\u6846": { en: "Lyric box" },
  "\u7A7A\u683C / Tab": { en: "Space / Tab" },
  "\u8FD9\u4E2A\u8BCD\u5B8C\u4E86\uFF1A\u8D34\u4E0A\u3001\u8DF3\u4E0B\u4E00\u4E2A\u97F3\uFF08\u6846\u662F\u7A7A\u7684 = \u53EA\u8DF3\uFF09": { en: "This word is done: paste and jump to the next note (empty box = just jump)" },
  "\u56DE\u4E0A\u4E00\u4E2A\u97F3": { en: "Back to the previous note" },
  "\u8DDF\u5728\u5B57\u6BCD\u540E\u9762\uFF1A\u97F3\u8282\u5B8C\u4E86\u3001\u8BCD\u6CA1\u5B8C\uFF08\u8C31\u4E0A\u753B\u8FDE\u5B57\u7B26\uFF09\uFF0C\u8DF3\u4E0B\u4E00\u4E2A\u97F3": { en: "After a letter: syllable done, word not done (a hyphen on the score), jump to the next note" },
  "\u8D34\u4E0A\u3001\u6536\u8D77": { en: "Paste and close" },
  "\u8BB0\u53F7\u6846": { en: "Mark box" },
  "\u6309\u6846\u91CC\u7684\u5B57\u6539\uFF081=D / Bb / 2# \xB7 3/4 \xB7 90 \u6216 Andante\uFF09\u3001\u6536\u8D77": { en: "Apply the box's text (1=D / Bb / 2# \xB7 3/4 \xB7 90 or Andante) and close" },
  "\u7A7A\u683C": { en: "Space" },
  "\u5C0F\u952E\u76D8 Enter": { en: "Numpad Enter" },
  "\u9000\u683C": { en: "Backspace" },
  "\u5C0F\u952E\u76D8 -": { en: "Numpad -" },
  "\u5C0F\u952E\u76D8 *": { en: "Numpad *" },
  "\u5C0F\u952E\u76D8 /": { en: "Numpad /" },
  "\u9762\u677F\uFF08\u5BFC\u51FA\u597D\u4E86\uFF09": { en: "Panel (export done)" },
  "\u6F14\u594F\u6CD5##\u9875\u7B7E": { en: "Artic." },
  "\u529B\u5EA6##\u9875\u7B7E": { en: "Dyn." },
  "\u8BB0\u53F7": { en: "Marks" },
  "\u5F3A\u5EA6\uFF08\u5E7D\u7075\u97F3 / \u5F31\u5316 / \u6B21\u91CD\u97F3 / \u91CD\u97F3 / \u5F3A\u97F3 / \u7A81\u5F3A / \u5F3A\u540E\u5373\u5F31\uFF09\u3001\u4FDD\u6301 / \u8DF3\u97F3 / \u8FDE\u7EBF / \u547C\u5438\uFF08\u9759\u9ED8 / \u8F7B\u5438 / \u6DF1\u5438\uFF09\u3001\u6C14\u58F0": { en: "Strength (ghost / unstressed / stress / accent / marcato / sfz / fp), tenuto / staccato / slur / breath (silent / soft / deep), whisper" },
  "ppp\u2026fff\u3001\u6E10\u5F3A / \u6E10\u5F31\u3001\u6E10\u5230\u3001\u97F3\u5185\u8D77\u4F0F": { en: "ppp\u2026fff, crescendo / diminuendo, ramp, swells" },
  "\u8C03\u53F7 / \u62CD\u53F7 / \u8C31\u53F7 / \u516B\u5EA6\u7EBF / \u901F\u5EA6\u3001\u98CE\u683C\uFF08\u62CD\u5B50\u8F7B\u91CD\uFF09\u3001\u53CD\u590D\u3001\u8E0F\u677F": { en: "Key / time / clef / octave lines / tempo, style (beat weights), repeats, pedals" },
  "\u4E09\u5341\u4E8C\u5206": { en: "Thirty-second" },
  "\u5341\u516D\u5206": { en: "Sixteenth" },
  "\u516B\u5206": { en: "Eighth" },
  "\u56DB\u5206": { en: "Quarter" },
  "\u4E8C\u5206": { en: "Half" },
  "\u5168\u97F3\u7B26": { en: "Whole" },
  "{n} \u8FDE\u97F3": { en: "{n}-tuplet" },
  "\u7B26\u53F7\u683C\u5F00\u7740\uFF1A\u8FD9\u4E00\u9762\u53EA\u5199\u8BB0\u53F7\uFF1B\u70B9\u300C\u97F3\u300D\u6362\u56DE\u97F3\u952E\u5199\u97F3": { en: "The symbol keys are showing: this side only writes marks; tap \u201CNotes\u201D to switch back" },
  "\u5149\u6807\u5DE6\u79FB\uFF08{p}\uFF09": { en: "Cursor left ({p})" },
  "\u5149\u6807\u53F3\u79FB\uFF08{p}\uFF09": { en: "Cursor right ({p})" },
  "\u4F11\u6B62\uFF08{p}\uFF09": { en: "Rest ({p})" },
  "\u5C0F\u8282\u7EBF\uFF08{p}\uFF09": { en: "Barline ({p})" },
  "\u547C\u5438\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u540E\u9762\u6362\u4E00\u53E3\u6C14\uFF08\u5C0F\u6708\u76F8\u5531\u5230\u8FD9\u513F\u6362\u6C14\uFF1B\u4E50\u5668\u5728\u8FD9\u513F\u7A0D\u5FAE\u65AD\u5F00\uFF1B\u8FDE\u7EBF\u8FDE\u7740\u4E5F\u7167\u6837\u65AD\u5F00\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389\uFF09": { en: "Breath: a breath after the note before the cursor (Tsukuyomi-chan breathes here; instruments separate slightly; it separates even under a slur; tap again to remove)" },
  "\u5347\u964D\uFF08\u548C Shift \u4E00\u6837\uFF09\uFF1A\u70B9\u4E00\u4E0B = \u4E0B\u4E00\u4E2A\u97F3\uFF1B\u8FDE\u70B9\u4E24\u4E0B = \u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00\uFF1B\u6309\u4F4F\u5199 = \u6309\u4F4F\u671F\u95F4\u3002\u5728\u952E\u4E0A\u4E0A\u4E0B\u6ED1\u6362 \u{1D12A} / \u266F / \u266D / \u{1D12B}": { en: "Accidental (like Shift): tap = next note; double-tap = lock, tap again = unlock; hold while writing = while held. Slide up / down on the key to change \u{1D12A} / \u266F / \u266D / \u{1D12B}" },
  "\u5347\u964D": { en: "Acc." },
  "\u53E0\uFF08\u50CF Caps Lock\uFF09\uFF1A\u6309\u4E00\u4E0B = \u9009\u4E2D\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u6765\u6539\u2014\u2014\u6309\u97F3\u952E\u53E0\u4E0A / \u62FF\u6389\uFF08\u6700\u540E\u4E00\u4E2A\u62FF\u6389 = \u4E00\u6837\u957F\u7684\u4F11\u6B62\uFF0C\u4F11\u6B62\u4E0A\u6309 = \u53D8\u56DE\u97F3\uFF09\u3001\u2014 \u957F\u4E00\u6B65\u3001\u232B \u77ED\u4E00\u6B65\u3001\u2190 \u2192 \u6362\u524D\u540E\u7684\u97F3\uFF1B\u518D\u6309\u4E00\u4E0B = \u56DE\u5230\u5B83\u540E\u9762\u63A5\u7740\u5199\u3002\u5355\u58F0\u4E50\u5668\u7684\u58F0\u90E8\u53E0\u4E0D\u4E86": { en: "Stack (like Caps Lock): press = select the note before the cursor to edit it \u2014 note keys add / remove (removing the last = a rest of the same length; on a rest = back to a note), \u2014 one step longer, \u232B one step shorter, \u2190 \u2192 to neighbors; press again = back after it to keep writing. Monophonic parts can't stack" },
  "\u53E0\u97F3": { en: "Stack" },
  "\u51CF\u534A\uFF08\u957F\u77ED\u57FA\u7EBF\u77ED\u4E00\u6863\uFF09\uFF1A\u70B9\u4E00\u4E0B = \u4E0B\u4E00\u4E2A\u97F3\uFF1B\u8FDE\u70B9\u4E24\u4E0B = \u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00\uFF1B\u4E5F\u53EF\u4EE5\u6309\u4F4F\u5199": { en: "Halve (one notch shorter): tap = next note; double-tap = lock, tap again = unlock; or hold while writing" },
  "\u51CF\u534A": { en: "Halve" },
  "\u62C9\u957F\u4E00\u4EFD\uFF08{p}\uFF09": { en: "Extend by one unit ({p})" },
  "\u62C9\u957F": { en: "Extend" },
  "\u9000\u683C\uFF08{p}\uFF09": { en: "Backspace ({p})" },
  "\u25BE \u8FD8\u6709 {n} \u4E2A": { en: "\u25BE {n} more" },
  "\u8FD4\u56DE": { en: "Back" },
  "\u81EA\u52A8\u5C0F\u8282\u7EBF": { en: "Auto barlines" },
  "\u6309\u62CD\u53F7\u81EA\u52A8\u753B\u5C0F\u8282\u7EBF\uFF08\u53EA\u753B\u3001\u4E0D\u8FDB\u6570\u636E\uFF09\uFF1B\u624B\u63D2\u7684\u300C|\u300D= \u4ECE\u90A3\u91CC\u91CD\u65B0\u6570\uFF0C\u5F31\u8D77 = \u5199\u5B8C\u5F31\u8D77\u7684\u97F3\u6309\u4E00\u4E0B\u300C|\u300D": { en: "Draws barlines from the time signature (display only, not in the data); a hand-inserted \u201C|\u201D recounts from there; for a pickup, write its notes and press \u201C|\u201D" },
  "\u6362\u8C31\u8868": { en: "Change staff" },
  "\u5927\u8C31\u8868\uFF1A\u521A\u5199\u7684\u97F3\uFF08\u6216\u9009\u4E2D\u7684\uFF09\u632A\u5230\u53E6\u4E00\u5F20\u8C31\u8868\uFF1B\u518D\u6309\u4E00\u6B21\u56DE\u5230\u6309\u97F3\u9AD8\u81EA\u52A8\u5206": { en: "Grand staff: moves the note just written (or the selection) to the other staff; press again = back to auto by pitch" },
  "\u5E03\u5C40\u2026": { en: "Layout\u2026" },
  "\u51E0\u884C\u51E0\u5217\u3001\u9996\u8C03 / \u7EDD\u5BF9": { en: "Rows and columns, movable / fixed do" },
  "\u6E10\u5230": { en: "Ramp" },
  "\u6362\u56DE\u97F3\u952E\uFF08\u5199\u97F3 / \u4F11\u6B62 / \u5C0F\u8282\u7EBF\uFF09": { en: "Back to note keys (notes / rests / barlines)" },
  "\u5F39\uFF1A\u97F3\u952E\u53EA\u54CD\u4E0D\u5199\uFF08\u5FEB\u6377\u952E `\uFF09\uFF1B\u518D\u70B9\u56DE\u5230\u5199": { en: "Jam: note keys sound without writing (shortcut `); tap again to return to writing" },
  "\u5F39": { en: "Jam" },
  "\u6536\u8D77\u952E\u76D8\uFF08\u70B9\u4E94\u7EBF\u8C31\u518D\u5F39\u51FA\u6765\uFF09": { en: "Hide the keys (tap the staff to bring them back)" },
  "\u6536\u8D77": { en: "Hide" },
  "\u66F4\u591A\uFF1A\u5E03\u5C40\u3001\u63D2\u8BB0\u53F7": { en: "More: layout, insert marks" },
  "\u97F3\u57DF\uFF08\u8FD9\u5757 pad \u4ECE\u54EA\u4E2A\u97F3\u5230\u54EA\u4E2A\u97F3\uFF09\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\u2014\u2014\u50CF\u63A8\u4E00\u5F20\u7EB8\uFF0C\u5F80\u4E0A\u63A8 = \u770B\u4E0B\u9762\u66F4\u4F4E\u7684": { en: "Range (the pad's lowest to highest note): hold and slide up / down, or tap to choose \u2014 like pushing a sheet of paper: pushing up shows lower notes" },
  "\u957F\u77ED\u57FA\u7EBF\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\uFF08\u542B\u8FDE\u97F3\uFF09": { en: "Note length: hold and slide up / down, or tap to choose (tuplets included)" },
  "1=\uFF08pad \u81EA\u5DF1\u7684\u8C03\uFF09\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\uFF08\u4E94\u5EA6\u5708\uFF09": { en: "1= (the pad's own key): hold and slide up / down, or tap to choose (circle of fifths)" },
  "\u6362\u6210\u7B26\u53F7\u683C\uFF08\u529B\u5EA6\u3001\u6E10\u5F3A\u6E10\u5F31\u3001\u6F14\u594F\u6CD5\u3001\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\u3001\u53CD\u590D\u3001\u98CE\u683C\u3001\u53E5\u53F7\uFF09\u2014\u2014\u8C31\u4E0A\u97F3\u548C\u8BB0\u53F7\u672C\u6765\u5C31\u4E00\u8D77\u6539\uFF0C\u8FD9\u91CC\u53EA\u6362\u952E\u76D8": { en: "Switch to the symbol grid (dynamics, hairpins, articulations, key / time / tempo, repeats, style, phrase end) \u2014 notes and marks are edited together on the score anyway; this only switches the keys" },
  "\u5C11\u4E00{name}": { en: "One fewer {name}" },
  "\u591A\u4E00{name}": { en: "One more {name}" },
  "\u884C": { en: "Rows" },
  "\u81EA\u52A8": { en: "Auto" },
  "\u6309\u5C4F\u5E55\u9AD8\u5EA6\u81EA\u52A8\u5B9A\u51E0\u884C": { en: "Sets the row count from the screen height" },
  "\u952E\u76D8\u51E0\u884C\uFF08\u9AD8\u5EA6\uFF09": { en: "Key rows (height)" },
  "\u5217": { en: "Columns" },
  "\u952E\u76D8\u51E0\u5217": { en: "Key columns" },
  "\u952E\u4F4D": { en: "Key layout" },
  "\u9996\u8C03": { en: "Movable do" },
  "\u6BCF\u884C\u4ECE 1 \u8D77\uFF0C\u8DDF\u7740\u300C1=\u300D\u8D70": { en: "Each row starts at 1, following \u201C1=\u201D" },
  "\u7EDD\u5BF9": { en: "Fixed" },
  "\u6BCF\u884C\u4ECE C \u8D77\uFF08\u4E0D\u8DDF\u7740\u300C1=\u300D\u632A\uFF09": { en: "Each row starts at C (doesn't follow \u201C1=\u201D)" },
  "\u6ED1": { en: "Slide" },
  "\u6EDA\u952E\u76D8": { en: "Glide" },
  "\u624B\u6307\u6309\u7740\u6ED1\u5230\u4E0B\u4E00\u4E2A\u952E = \u54CD\u4E0B\u4E00\u4E2A\uFF08\u5199\u7684\u65F6\u5019\u4E00\u8DEF\u5199\uFF09": { en: "Sliding your finger to the next key sounds that key (writes along the way while writing)" },
  "\u5728\u97F3\u952E\u4E0A\u4E0A\u4E0B\u6ED1 = \u8FD9\u4E00\u4E2A\u97F3\u5347 / \u964D\uFF08\u9ECF\u7740\uFF09": { en: "Sliding up / down on a note key bends just this note up / down (sticky)" },
  "\u952E\u76D8\u5E03\u5C40": { en: "Keyboard layout" },
  "\u4E0D\u753B": { en: "Not drawn" },
  "\u65E0\u6548": { en: "No effect" },
  "\uFF08\u8FD9\u79CD\u8C31\u4E0D\u753B\u5B83\uFF1A\u5199\u5728\u8C31\u4E0A\uFF0C\u5207\u56DE\u4E94\u7EBF\u8C31\u624D\u770B\u5F97\u89C1\uFF09": { en: "(this notation doesn't draw it: it's written in the score and shows when you switch back to the staff)" },
  "\uFF08\u5199\u5728\u8FD9\u91CC\u4E0D\u8D77\u4F5C\u7528\uFF1A\u5199\u5728\u8C31\u4E0A\u753B\u7070\uFF09": { en: "(no effect here: it's written in the score and greyed)" },
  "\uFF08\u53F0\u4E0A\u8FD9\u4F4D\u4E0D\u8BA4\uFF1A\u5199\u5728\u8C31\u4E0A\u753B\u7070\uFF0C\u51FA\u58F0\u4E0D\u53D7\u5F71\u54CD\uFF09": { en: " (the performer on stage ignores this: drawn gray on the score, sound unaffected)" },
  "\u7436\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u548C\u5F26\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u4ECE\u4F4E\u5230\u9AD8\u4F9D\u6B21\u594F\u51FA\uFF08\u548C\u5F26\u5DE6\u8FB9\u4E00\u6761\u6CE2\u6D6A\u7EBF\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Arpeggio: rolls the chord before the cursor (or the selection) low to high (a wavy line left of the chord); tap again to remove" },
  "\u6EDA\u594F\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u6574\u4E2A\u97F3\u6572\u6EE1\uFF08\u7B26\u5E72\u4E0A\u4E09\u9053\u659C\u7EBF\uFF09\uFF1B\u591A\u5BC6\u5728\u4E50\u5668\u9875\u8C03\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Roll: the note before the cursor (or the selection) is filled with rapid hits (three slashes on the stem); set how fast on the instrument page; tap again to remove" },
  "\u8DF3\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u5531 / \u5F39\u5F97\u77ED\u4FC3\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Staccato: the note before the cursor (or the selection) sung / played short; tap again to remove" },
  "\u5E7D\u7075\u97F3\uFF08\u62EC\u53F7\u7B26\u5934\uFF09\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u5F88\u8F7B\u3001\u51E0\u4E4E\u542C\u4E0D\u89C1\uFF1B\u97F3\u7684\u5F3A\u5EA6\u53EA\u6709\u4E00\u79CD\uFF1A\u548C\u5F31\u5316 / \u6B21\u91CD\u97F3 / \u91CD\u97F3 / \u5F3A\u97F3 / \u7A81\u5F3A / \u5F3A\u540E\u5373\u5F31\u4E92\u65A5": { en: "Ghost note (parenthesized notehead): the note before the cursor (or the selection) is very soft, almost inaudible; a note has one strength: excludes unstressed / stress / accent / marcato / sfz / fp" },
  "\u5F31\u5316\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u8F7B\u4E00\u70B9\uFF1B\u548C\u522B\u7684\u5F3A\u5EA6\u4E92\u65A5": { en: "Unstressed: the note before the cursor (or the selection) a little lighter; excludes other strengths" },
  "\u6B21\u91CD\u97F3\uFF1A\u6BD4\u91CD\u97F3\u8F7B\u7684\u91CD\u97F3\uFF08\u56DB\u62CD\u5B50\u300C\u5F3A\u5F31\u6B21\u5F3A\u5F31\u300D\u7684\u6B21\u5F3A\uFF09\uFF1B\u548C\u522B\u7684\u5F3A\u5EA6\u4E92\u65A5": { en: "Stress: lighter than an accent (the secondary beat in 4/4's strong-weak-medium-weak); excludes other strengths" },
  "\u91CD\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u52A0\u91CD\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Accent: the note before the cursor (or the selection) heavier; tap again to remove" },
  "\u5F3A\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u6BD4\u91CD\u97F3\u66F4\u91CD\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Marcato: the note before the cursor (or the selection) heavier than an accent; tap again to remove" },
  "\u7A81\u5F3A sfz\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u97F3\u5934\u731B\u5730\u51B2\u4E00\u4E0B\u518D\u843D\u56DE\u6765\uFF1B\u548C\u91CD\u97F3 / \u5F3A\u97F3 / fp \u4E92\u65A5": { en: "Sforzando sfz: the note before the cursor (or the selection) jolts at the attack and falls back; excludes accent / marcato / fp" },
  "\u5F3A\u540E\u5373\u5F31 fp\uFF1A\u97F3\u5934 f\uFF0C\u9A6C\u4E0A\u843D\u5230 p\uFF0C\u4E4B\u540E\u7684\u97F3\u90FD\u662F p\uFF1B\u548C\u91CD\u97F3 / \u5F3A\u97F3 / sfz \u4E92\u65A5": { en: "Forte-piano fp: attacks at f, falls right to p, and later notes stay p; excludes accent / marcato / sfz" },
  "\u4FDD\u6301\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u5531 / \u5F39\u6EE1\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Tenuto: the note before the cursor (or the selection) sung / played in full; tap again to remove" },
  "\u6E10\u5F3A <\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\uFF09\u8D77\uFF0C\u4E00\u8DEF\u6E10\u5F3A\u5230\u8FD9\u5F20\u7EB8\u91CC\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1B\u6CA1\u5199 = \u8D70\u4E00\u6863\uFF08\u8C31\u4E0A\u7070\u5B57\u6807\u51FA\u63A8\u5B9A\u7684\u7EC8\u70B9\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Crescendo <: from the note before the cursor (or the selection's first note), grows up to the next dynamic on this sheet; none = one step (the inferred endpoint shows in gray on the score); tap again to remove" },
  "\u6E10\u5F31 >\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\uFF09\u8D77\uFF0C\u4E00\u8DEF\u6E10\u5F31\u5230\u8FD9\u5F20\u7EB8\u91CC\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1B\u6CA1\u5199 = \u8D70\u4E00\u6863\uFF08\u8C31\u4E0A\u7070\u5B57\u6807\u51FA\u63A8\u5B9A\u7684\u7EC8\u70B9\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Diminuendo >: from the note before the cursor (or the selection's first note), falls to the next dynamic on this sheet; none = one step (the inferred endpoint shows in gray on the score); tap again to remove" },
  "\u529B\u5EA6": { en: "Dynamics" },
  "\u529B\u5EA6 {d}\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\uFF08\u6709\u9009\u533A = \u9009\u533A\u5F00\u5934\uFF09\uFF0C\u7BA1\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1B\u90A3\u513F\u5DF2\u7ECF\u662F\u5B83 = \u53BB\u6389": { en: "Dynamic {d}: from the note before the cursor (or the selection's start) until the next dynamic; already that = removed" },
  "\u6E10\u5230\uFF1A\u70B9\u4E00\u4E0B = \u4E0B\u4E00\u4E2A\u529B\u5EA6\u4ECE\u8FD9\u5F20\u7EB8\u91CC\u4E0A\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u90A3\u513F\u4E00\u8DEF\u6E10\u53D8\u8FC7\u6765\uFF08\u8C31\u4E0A\u753B\u865A\u7EBF\u53D1\u5939\uFF1B\u624B\u5199\u7684\u6E10\u5F3A\u6E10\u5F31\u662F\u5B9E\u7EBF\uFF09\uFF1B\u8FDE\u70B9\u4E24\u4E0B = \u9501\u4F4F\uFF0C\u4E4B\u540E\u5199\u7684\u529B\u5EA6\u90FD\u662F\u6E10\u5230\uFF1B\u518D\u70B9 = \u5173\u3002\u4E0D\u5F00 = \u5230\u90A3\u513F\u7A81\u53D8": { en: "Ramp: tap = the next dynamic ramps from the previous one on this sheet (dashed hairpin on the score; handwritten hairpins are solid); double-tap = lock, every dynamic written is a ramp; tap again = off. Off = changes suddenly there" },
  "\u97F3\u5185\u6E10\u5F3A": { en: "Swell up" },
  "\u97F3\u5185\u9F13\u8D77": { en: "Swell" },
  "{p}\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u81EA\u5DF1\u91CC\u9762\u7684\u8D77\u4F0F\uFF1B\u548C\u6BB5\u843D\u7684\u6E10\u5F3A\u6E10\u5F31\u662F\u4E24\u5C42\uFF0C\u53EF\u4EE5\u53E0\uFF1B\u518D\u70B9 = \u53BB\u6389": { en: "{p}: a swell inside the note before the cursor (or the selection); a separate layer from phrase hairpins, they can stack; tap again = remove" },
  "\u97F3\u5185\u6E10\u5F31\uFF08\u952F\u9F7F\uFF09": { en: "Swell down (sawtooth)" },
  "\u97F3\u5185\u9F13\u8D77\uFF08messa di voce\uFF09": { en: "Swell (messa di voce)" },
  "\u8FDE\u7EBF\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8FDE\u5230\u4E0B\u4E00\u4E2A\u97F3\uFF08\u8FDE\u594F\u3001\u4E0D\u7559\u7F1D\uFF1B\u6709\u9009\u533A = \u9009\u4E2D\u7684\u8FDE\u8D77\u6765\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389\uFF09\u3002\u540C\u4E00\u4E2A\u97F3\u4E0A\u53C8\u6709\u547C\u5438 = \u547C\u5438\u7B97\u6570\uFF1A\u90A3\u91CC\u7167\u6837\u65AD\u5F00\u6362\u6C14\uFF0C\u8FDE\u7EBF\u7167\u753B": { en: "Slur: connects the note before the cursor to the next (legato, no gap; with a selection = connects it; tap again to remove). A breath on the same note wins: it still separates and breathes there, and the slur is still drawn" },
  "\u5438##\u8BB0\u53F7": { en: "in" },
  "\u8F7B\u5438": { en: "Soft inhale" },
  "\u51FA\u58F0\u7684\u6362\u6C14\uFF08\u8F7B\u5438\uFF09\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u540E\u9762\u6362\u6C14\u3001\u542C\u5F97\u89C1\u5438\u6C14\u58F0\uFF08\u6CA1\u6709\u547C\u5438\u8BB0\u53F7\u5C31\u8FDE\u9017\u53F7\u4E00\u8D77\u52A0\u4E0A\uFF1B\u518D\u70B9\u4E00\u6B21 = \u6574\u4E2A\u53BB\u6389\uFF09\u3002\u53EA\u6709\u70B9\u4E86\u7684\u5730\u65B9\u624D\u51FA\u58F0\uFF0C\u666E\u901A\u7684\u547C\u5438\u8BB0\u53F7\u7167\u65E7\u9759\u9ED8": { en: "Audible breath (soft): breathes after the note before the cursor with an audible inhale (adds the comma if there's no breath mark; tap again = removes it all). Only tapped spots make a sound; plain breath marks stay silent" },
  "\u6DF1\u5438##\u8BB0\u53F7": { en: "deep in" },
  "\u6DF1\u5438": { en: "Deep inhale" },
  "\u51FA\u58F0\u7684\u6362\u6C14\uFF08\u6DF1\u5438\uFF09\uFF1A\u5927\u53E3\u5438\u6C14\u3001\u6362\u6C14\u7684\u7A7A\u5F53\u4E5F\u957F\u4E00\u70B9\uFF08\u4ECE\u524D\u4E00\u4E2A\u97F3\u672B\u5C3E\u501F\u65F6\u95F4\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21 = \u6574\u4E2A\u53BB\u6389": { en: "Audible breath (deep): a big inhale with a slightly longer gap (borrowed from the end of the previous note); tap again = removes it all" },
  "\u6C14\u58F0": { en: "Whisper" },
  "\u6C14\u58F0\uFF08\xD7 \u7B26\u5934\uFF09\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u4E0D\u5531\u97F3\u9AD8\u3001\u7528\u6C14\u58F0\u5531\u8FD9\u4E2A\u5B57\uFF08\u5FF5\u767D / \u8033\u8BED\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389\u3002\u53EA\u6709\u5C0F\u6708\u76F8\u505A\u5F97\u5230\uFF0C\u4E50\u5668\u4E0A\u753B\u7070": { en: "Whisper (\xD7 notehead): the note before the cursor (or the selection) has no sung pitch, breathing this syllable (speech / whisper); tap again to remove. Only Tsukuyomi-chan can do it; grayed out on instruments" },
  "\u63D2\u8C03\u53F7\uFF08\u5728\u5149\u6807\u5904\uFF1B\u5148\u586B\u73B0\u5728\u7684\uFF0C\u63D2\u4E86\u518D\u6539\uFF09": { en: "Insert key signature (at the cursor; starts with the current one, edit after inserting)" },
  "\u63D2\u62CD\u53F7\uFF08\u5728\u5149\u6807\u5904\uFF09": { en: "Insert time signature (at the cursor)" },
  "\u901F\u5EA6##\u8C31": { en: "Tempo" },
  "\u63D2\u901F\u5EA6\uFF08\u5728\u5149\u6807\u5904\uFF09": { en: "Insert tempo (at the cursor)" },
  "\u8C31\u53F7\uFF1A\u4ECE\u5149\u6807\u5904\u8D77\u6362\u8C31\u53F7\uFF08\u9AD8\u97F3 / \u4F4E\u97F3 / \u4E0B\u52A0 8 / \u4E0A\u52A0 8 / \u4E0A\u52A0 15\uFF09\uFF1B\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8\u3002\u6BCF\u884C\u5F00\u5934\u7684\u8C31\u53F7\u4E5F\u80FD\u76F4\u63A5\u70B9": { en: "Clef: changes the clef from the cursor (treble / bass / 8 below / 8 above / 15 above); display only, pitch doesn't change. The clef at the start of each line can be tapped too" },
  "\u516B\u5EA6\u7EBF": { en: "Ottava" },
  "\u516B\u5EA6\u7EBF\uFF1A\u4ECE\u5149\u6807\u5904\u8D77\u8C31\u4E0A\u753B\u4F4E\uFF088va / 15ma\uFF09\u6216\u753B\u9AD8\uFF088vb\uFF09\uFF1B\u6709\u9009\u533A = \u8FD9\u4E00\u6BB5\uFF1B\u300C\u7ED3\u675F\u300D= \u5230\u8FD9\u513F\u6536\u3002\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8": { en: "Ottava line: from the cursor, drawn lower (8va / 15ma) or higher (8vb); with a selection = this passage; \u201CEnd\u201D = stops here. Display only, pitch doesn't change" },
  "\u98CE\u683C": { en: "Style" },
  "\u62CD\u5B50\u8F7B\u91CD": { en: "Beat weighting" },
  "\u98CE\u683C\u8BB0\u53F7\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\u5230\u8FD9\u5F20\u7EB8\u7ED3\u5C3E\uFF0C\u6BCF\u4E2A\u97F3\u6309\u5B83\u5728\u5C0F\u8282\u91CC\u7684\u4F4D\u7F6E\u8F7B\u4E00\u70B9 / \u91CD\u4E00\u70B9\uFF08\u53E4\u5178 / \u6D41\u884C / \u534E\u5C14\u5179 / \u8FDB\u884C\u66F2\u2026\u70B9\u5F00\u9009\uFF09\uFF1B\u6574\u5F20\u7EB8\u7684\u58F0\u90E8\u4E00\u8D77\u542C\uFF0C\u5404\u4EBA\u8DDF\u591A\u5C11\u6309\u4E50\u5668": { en: "Style mark: from the note before the cursor to the end of the sheet, each note gets lighter / heavier by its place in the bar (classical / pop / waltz / march\u2026 tap to choose); all parts on the sheet follow, each by instrument" },
  "\u53CD\u590D": { en: "Repeat" },
  "\u8C31\u5185\u53CD\u590D / \u8DF3\u8F6C\uFF1A|: :|\u3001\u623F\u5B50 1. 2.\u3001Segno / Coda / D.C. / D.S. / Fine\u2026\uFF08\u70B9\u5F00\u9009\uFF1B\u63D2\u5728\u5149\u6807\u5904\uFF0C\u6328\u7740\u5C0F\u8282\u7EBF = \u628A\u90A3\u6761\u6539\u6210\u53CD\u590D\u7684\uFF09\u3002\u4E0D\u8DE8\u7EB8\uFF1B\u653E\u7684\u65F6\u5019\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C": { en: "Score repeats / jumps: |: :|, endings 1. 2., Segno / Coda / D.C. / D.S. / Fine\u2026 (tap to choose; inserted at the cursor, next to a barline = turns it into a repeat). Doesn't cross sheets; playback only looks at this sheet's top part" },
  "\u8E0F\u677F": { en: "Pedal" },
  "\u8E0F\u677F\uFF08\u97F3\u63A5\u7740\u54CD\u8FD8\u662F\u6B62\u4F4F\uFF09\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\u8E29\u4E0B / \u62AC\u8D77 / \u6362\u8E0F\u677F\uFF0C\u5B57\u8DDF\u7740\u90A3\u513F\u73B0\u5728\u8E29\u6CA1\u8E29\uFF1B\u6709\u9009\u533A = \u628A\u8FD9\u4E00\u6BB5\u8E29\u4F4F\u3002\u70B9\u8C31\u4E0A\u7684\u8E0F\u677F\u8BB0\u53F7\u80FD\u6539\u3001\u5220\uFF0C\u957F\u6309\u62D6\u80FD\u632A": { en: "Pedal (notes keep ringing or stop): press / release / change from the note before the cursor; the labels follow whether the pedal is down there now; with a selection = hold the pedal through it. Tap a pedal mark on the score to change or delete it; long-press and drag to move it" },
  "\u5927\u8C31\u8868\uFF1A\u8FD9\u4E2A\u97F3\u6362\u5230\u53E6\u4E00\u5F20\u8C31\u8868": { en: "Grand staff: move this note to the other staff" },
  "{who}\u7684\u97F3\u57DF\u91CC": { en: "Within {who}'s range" },
  "\u77ED\u4E00\u6B65": { en: "Shorter" },
  "\u77ED\u4E00\u6B65\uFF08\u9000\u683C\uFF09\uFF1A\u9009\u4E2D\u7684\u8FD9\u4E2A\u97F3\u77ED\u4E00\u6863\uFF0C\u7A7A\u51FA\u6765\u7684\u53D8\u6210\u4F11\u6B62": { en: "One step shorter (backspace): the selected note gets one notch shorter, and the freed space becomes a rest" },
  "\u957F\u4E00\u6B65": { en: "Longer" },
  "{name}\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1\u6362\u8C03 / \u70B9\u5F00\u9009\u8C03\u548C\u8C03\u5F0F": { en: "{name}: hold and slide up or down to change key / tap to pick key and mode" },
  "\u957F\u77ED\u57FA\u7EBF\uFF1A{p}{tuplet}\u2014\u2014\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009": { en: "Note length: {p}{tuplet} \u2014 hold and slide up / down, or tap to choose" },
  "\uFF08{tuplet} \u8FDE\u97F3\uFF09": { en: " ({tuplet}-tuplet)" },
  "\u97F3\u57DF {rowShift}\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\u2014\u2014\u50CF\u63A8\u4E00\u5F20\u7EB8\uFF0C\u5F80\u4E0A\u63A8 = \u770B\u4E0B\u9762\u66F4\u4F4E\u7684": { en: "Range {rowShift}: hold and slide up / down, or tap to choose \u2014 like pushing a sheet of paper: pushing up shows lower notes" },
  "pad \u7684\u8C03\uFF08\u4E94\u5EA6\u5708\uFF09": { en: "The pad's key (circle of fifths)" },
  "\u957F\u77ED\u57FA\u7EBF": { en: "Note length" },
  "\u97F3\u57DF\u7A97\u53E3": { en: "Range window" },
  "\u4E0D\u8FDE": { en: "No tuplet" },
  "\u8FDE\u97F3": { en: "Tuplets" },
  "\u8C03\u5F0F\uFF1Apad \u4E0A\u6392\u54EA\u4E9B\u97F3": { en: "Mode: which notes the pad lays out" },
  ' data-def="{def}" title="\u53CC\u51FB\u56DE {defText}"': { en: ' data-def="{def}" title="Double-click: back to {defText}"' },
  "\u4E0A {t} \xB7 \u4E0B {b} \xB7 \u5DE6 {l} \xB7 \u53F3 {r} \u6BEB\u7C73": { en: "top {t} \xB7 bottom {b} \xB7 left {l} \xB7 right {r} mm" },
  "{mm} \u6BEB\u7C73": { en: "{mm} mm" },
  "\u8DDF\u7740\u6211\u7684\u4E60\u60EF\uFF08\u73B0\u5728\u662F\uFF1A{x}\uFF09": { en: "Follow my habits (now: {x})" },
  "\u8DDF\u7740\u8F6F\u4EF6\u7684\u9ED8\u8BA4\uFF08\u73B0\u5728\u662F\uFF1A{x}\uFF09": { en: "Software default (now: {x})" },
  "{what}\uFF1A\u8DDF\u7740\u6211\u7684\u4E60\u60EF": { en: "{what}: follow my habits" },
  "{what}\uFF1A\u8DDF\u7740\u8F6F\u4EF6": { en: "{what}: follow the software" },
  "{what}\uFF1A\u8DDF\u7740\u8F6F\u4EF6\u7684\u9ED8\u8BA4": { en: "{what}: software default" },
  "\u6309\u97F3\u9AD8\u753B\u5728\u4E94\u6761\u7EBF\u4E0A": { en: "Pitches drawn on the five lines" },
  "\u6570\u5B57 1\u20137\uFF08\u9996\u8C03\uFF09": { en: "Digits 1\u20137 (movable do)" },
  "\u5B9E\u9645\u7684\u97F3\u540D C D E F G A B\uFF0C\u53F3\u4E0A\u89D2\u5199\u5347\u964D\u53F7\u3001\u53F3\u4E0B\u89D2\u5199\u516B\u5EA6\uFF08\u4E2D\u592E C = C{n}\uFF09": { en: "The actual note names C D E F G A B, with sharps and flats at the upper right and the octave at the lower right (middle C = C{n})" },
  "C{n}\uFF08\u56FD\u9645\u901A\u7528\uFF09": { en: "C{n} (international)" },
  "\u7EA7\u6570\uFF08I\u3001V7\uFF09": { en: "Degrees (I, V7)" },
  "\u6839\u97F3\uFF08C\u3001G7\uFF09": { en: "Roots (C, G7)" },
  "\u7EA7\u6570": { en: "Degrees" },
  "\u6839\u97F3": { en: "Roots" },
  "\u548C\u5F26\u8F85\u52A9\u6807\u51FA\u6765\u7684\u5B57\u5199\u6210\u7EA7\u6570\u8FD8\u662F\u6839\u97F3\u3002\u5F00\u7740\u79FB\u8C03\u8F85\u52A9\u65F6\u6839\u97F3\u7167\u6362\u5230 C \u8C03\u4E4B\u540E\u7684\u5199\uFF0C\u548C\u773C\u524D\u7684\u8C31\u5BF9\u5F97\u4E0A\u3002": { en: "Whether chord labels are written as degrees or as roots. With the transposition aid on, roots follow the score in C, so they match what you see." },
  "\u8C03\u53F7\u91CC\u5347\u964D\u53F7\u591A\u3001\u8BFB\u7740\u8D39\u52B2\u7684\u65F6\u5019\u7528\u3002": { en: "For when a key signature has many sharps or flats and is hard to read." },
  "\u5F00\u4E86\u4EE5\u540E\uFF0C\u4E94\u7EBF\u8C31\u6362\u5230 C \u8C03\u6765\u753B\uFF0C\u539F\u6765\u7684\u8C03\u7167\u6837\u5199\u5728\u8C31\u4E0A\uFF0C\u6BD4\u5982\u300C1=F\u300D\u3002\u952E\u76D8\u4E0A\u6BCF\u4E2A\u952E\u7684\u5927\u5B57\u662F\u8FD9\u4E2A\u97F3\u5728\u8C31\u4E0A\u7684\u540D\u5B57\uFF0C\u5C0F\u5B57\u662F\u5B83\u5B9E\u9645\u7684\u97F3\uFF1AF \u8C03\u7684\u6B4C\u91CC\uFF0C\u5F39\u51FA\u6765\u662F F \u7684\u90A3\u4E2A\u952E\uFF0C\u5927\u5B57\u5199 C\uFF0C\u5C0F\u5B57\u5199 F\u3002\u952E\u7684\u4F4D\u7F6E\u4E0D\u52A8\u3002": { en: "When on, staff notation is drawn in C, and the original key is still written on the score, e.g. \u201C1=F\u201D. On the keyboard, the big label on each key is the name the note has on the score, and the small label is the actual note: in a song in F, the key that sounds F shows a big C and a small F. Keys don't move." },
  "\u53EA\u6539\u663E\u793A\uFF0C\u58F0\u97F3\u548C\u6587\u4EF6\u90FD\u4E0D\u53D8\u3002\u7B80\u8C31\u548C\u5B57\u6BCD\u8C31\u7528\u4E0D\u4E0A\u5B83\u3002": { en: "Display only: the sound and the file don't change. It has no effect in numbered or letter notation." },
  "\u516B\u5EA6\u7684\u6570\u5B57\u4ECE\u54EA\u513F\u6570\uFF1A\u5B57\u6BCD\u8C31\u3001\u7B80\u8C31\u8C31\u5934\u3001\u952E\u4E0A\u7684\u5B57\u3001\u97F3\u57DF\u65CB\u94AE\u90FD\u7167\u5B83\u5199\u3002\u53EA\u6539\u53EB\u6CD5\uFF0C\u6587\u4EF6\u91CC\u3001\u58F0\u97F3\u91CC\u7684\u516B\u5EA6\u4E0D\u53D8\u3002": { en: "Where the octave numbers count from: letter notation, the numbered-notation header, the key labels and the range knob all follow it. Only the naming changes; octaves in the file and in the sound stay the same." },
  "\u8DDF\u7740\u97F3\u7B26\u5BC6\u5EA6": { en: "Follows note density" },
  "\u8FD9\u5F20\u7EB8\u81EA\u5DF1\u7684": { en: "This paper\u2019s own" },
  "\u97F3\u548C\u97F3\u4E4B\u95F4\uFF08\u6700\u591A\uFF09": { en: "Between notes (at most)" },
  "{n} \u4E2A\u952E\u63D0\u524D\u5F00\u59CB\u653E\uFF0C\u6700\u591A {ms} ms": { en: "{n} keys start early, up to {ms} ms" },
  "\u4E0D\u63D0\u524D": { en: "No early start" },
  "SoundFont \u4E50\u5668": { en: "SoundFont instrument" },
  "SoundFont \u4E50\u5668\uFF08TinySoundFont \u51FA\u58F0\uFF09": { en: "SoundFont instrument (sounds via TinySoundFont)" },
  "\u529B\u5EA6##MIDI": { en: "Velocity" },
  "\u4FEE\u516B\u5EA6": { en: "Octave fix" },
  "\u7740\u529B\u70B9": { en: "Hit point" },
  "\u4F59\u97F3": { en: "Ring-on" },
  "\u53F0\u4E0A\u7684\u4E0D\u662F SoundFont \u4E50\u5668": { en: "The performer on stage isn't a SoundFont instrument" },
  "\u529B\u5EA6\u6DF1\u5EA6 = \u5E93\u91CC\u7ED9\u8FD9\u4EF6\u4E50\u5668\u5199\u7684\uFF08\u58F0\u97F3\u8F7D\u597D\u540E\u663E\u793A\uFF09\uFF1B\u54CD\u5EA6 = \u6DF1\u5EA6 \xF7 960 \xD7 40\xB7log10(\u529B\u5EA6 \xF7 127)\u3002": { en: "Velocity depth = what the library sets for this instrument (shown once the sound is loaded); loudness = depth \xF7 960 \xD7 40\xB7log10(velocity \xF7 127). " },
  "\u8FD9\u4EF6\u4E50\u5668\u6309\u591A\u91CD\u90FD\u4E00\u6837\u54CD\uFF08\u5E93\u91CC\u8FD9\u4E48\u5B9A\u7684\uFF1A\u529B\u5EA6\u6DF1\u5EA6 0\uFF09\u3002": { en: "This instrument sounds equally loud however hard you play (the library sets it so: velocity depth 0). " },
  "\u529B\u5EA6\u6DF1\u5EA6 {d}\uFF08\u5E93\u91CC\u5199\u7684\uFF1B\u89C4\u8303\u9ED8\u8BA4 960\uFF09\uFF1A\u54CD\u5EA6 = {d} \xF7 960 \xD7 40\xB7log10(\u529B\u5EA6 \xF7 127)\uFF0C\u6EE1\u529B\u5EA6 127 = 0 dB\uFF0C\u529B\u5EA6\u51CF\u534A = \u8F7B {half} dB\u3002": { en: "Velocity depth {d} (set by the library; the SoundFont default is 960): loudness = {d} \xF7 960 \xD7 40\xB7log10(velocity \xF7 127), full velocity 127 = 0 dB, half the velocity = {half} dB quieter. " },
  "\u529B\u5EA6\u6DF1\u5EA6\u6309\u9F13\u4EF6 / \u97F3\u533A\u4E0D\u4E00\u6837\uFF1A{ds}\uFF08\u5E93\u91CC\u5199\u7684\uFF1B\u89C4\u8303\u9ED8\u8BA4 960\uFF09\u3002\u54CD\u5EA6 = \u6DF1\u5EA6 \xF7 960 \xD7 40\xB7log10(\u529B\u5EA6 \xF7 127)\u3002": { en: "Velocity depth differs by drum / key range: {ds} (set by the library; the SoundFont default is 960). Loudness = depth \xF7 960 \xD7 40\xB7log10(velocity \xF7 127). " },
  "\u8F7B\u4E00\u70B9\uFF08MIDI \u529B\u5EA6 \u22128\uFF09": { en: "A little softer (MIDI velocity \u22128)" },
  "\u91CD\u4E00\u70B9\uFF08+8\uFF09": { en: "A little harder (+8)" },
  "\u6CA1\u5199\u529B\u5EA6\u8BB0\u53F7\u7684\u97F3\u6309\u8FD9\u4E2A\u529B\u5EA6\uFF08MIDI 1\u2013127\uFF09\u3002{depth}{L}": { en: "Notes without a dynamic mark use this velocity (MIDI 1\u2013127). {depth}{L}" },
  "GS \u91CC\u8FD9\u4E2A\u97F3\u8272\u6709 {count} \u4E2A\u529B\u5EA6\u5C42{p}\uFF1A\u8DE8\u5C42 = \u6362\u4E00\u4EFD\u5F55\u97F3\uFF0C\u97F3\u8272\u4F1A\u53D8\uFF0C\u4E0D\u53EA\u662F\u54CD\u5EA6\u3002": { en: "This GS sound has {count} velocity layers{p}: crossing a layer = a different recording, so timbre changes, not just loudness." },
  "\uFF0C\u73B0\u5728\u5728\u7B2C {p} \u5C42\uFF08{p2}\u2013{p3}\uFF09": { en: ", now on layer {p} ({p2}\u2013{p3})" },
  "GS \u91CC\u8FD9\u4E2A\u97F3\u8272\u53EA\u6709\u4E00\u4E2A\u529B\u5EA6\u5C42\uFF1A\u529B\u5EA6\u53EA\u6539\u54CD\u5EA6\u3002": { en: "This GS sound has one velocity layer: velocity only changes loudness." },
  "\u56FA\u5B9A\u539F\u901F": { en: "Fixed speed" },
  "\u6309\u5199\u7684\u97F3\u53D8\u8C03\uFF08\u97F3\u9AD8\u5BF9\u9F50\uFF09": { en: "Follows the written pitch (pitch aligned)" },
  "\u6309\u5199\u7684\u97F3\u53D8\u8C03": { en: "Follows the written pitch" },
  "\u6BCF\u4E2A\u97F3\u90FD\u6572\u539F\u901F\u952E\uFF1A\u5199\u8C31\u6309\u952E\u3001\u64AD\u653E\u90FD\u662F\u539F\u6765\u7684\u6837\u5B50\uFF1B\u8C31\u4E0A\u5199\u7684\u97F3\u9AD8\u7167\u7559\uFF0C\u53EA\u662F\u4E0D\u62FF\u6765\u51FA\u58F0": { en: "Every note strikes the original-speed key: writing, keys and playback all sound original; the written pitch stays on the score, it's just not used for sound" },
  "\u97F3\u9AD8\u5BF9\u9F50": { en: "Pitch align" },
  "\u6309\u539F\u901F\u65F6\u6700\u5F3A\u7684\u90A3\u4E2A\u9891\u7387\u5927\u81F4\u5BF9\u9F50\uFF0C\u8C31\u4E0A\u7684\u97F3 \u2248 \u542C\u5230\u7684\u97F3\uFF1B\u4E0D\u4E00\u5B9A\u662F\u8033\u6735\u542C\u5230\u7684\u4E3B\u97F3": { en: "Aligns the strongest frequency at original speed, so the written note \u2248 what you hear; not always the perceived main pitch" },
  "\u8C31\u4E0A\u5199\u4E0D\u540C\u7684\u97F3\u4E5F\u90FD\u54CD\u539F\u6765\u7684\u6837\u5B50\uFF08\u97F3\u9AD8\u7559\u5728\u8C31\u4E0A\uFF0C\u5173\u6389\u5C31\u6309\u5B83\u53D8\u8C03\uFF09": { en: "Different written notes all sound original (pitch stays on the score; turn this off to transpose by it)" },
  "\u5199\u7684\u97F3 \u2248 \u542C\u5230\u7684\u97F3\uFF08\u5927\u81F4\uFF09": { en: "Written note \u2248 what you hear (roughly)" },
  "\u6309\u5199\u7684\u97F3\u53D8\u8C03\u53D8\u901F\uFF1A\u8D8A\u9AD8\u8D8A\u5C16\u8D8A\u5FEB\uFF0C\u8D8A\u4F4E\u8D8A\u6C89\u8D8A\u6162{sfx}": { en: "Varies pitch and speed by the written note: higher is shriller and faster, lower is deeper and slower{sfx}" },
  "\uFF1B\u8FD9\u4E2A\u97F3\u6548\u539F\u901F\u65F6\u542C\u4E0D\u51FA\u97F3\u9AD8\uFF0C\u6CA1\u6CD5\u5BF9\u9F50": { en: "; this sound effect has no audible pitch at original speed, so it can't align" },
  "{p}{tr} \u534A\u97F3": { en: "{p}{tr} semitones" },
  "\u4F4E\u4E00\u4E2A\u516B\u5EA6": { en: "Down an octave" },
  "\u4F4E\u534A\u97F3": { en: "Down a semitone" },
  "\u9AD8\u534A\u97F3": { en: "Up a semitone" },
  "\u9AD8\u4E00\u4E2A\u516B\u5EA6": { en: "Up an octave" },
  "\u56DE\u5230 0": { en: "Back to 0" },
  "\u5F52\u96F6": { en: "Reset" },
  "\u5927\u90E8\u5206\u60C5\u51B5\u4E0D\u7528\u52A8\uFF1A\u67D0\u4E9B\u97F3\u8272\u672C\u8EAB\u5C31\u5DEE\u516B\u5EA6\uFF08\u6BD4\u5982 GS \u7684 Guitar Harmonics \u9AD8\u4E24\u4E2A\u516B\u5EA6\uFF09\u65F6\u515C\u5E95\uFF0C\u8C03\u597D\u540E\u5199\u4EC0\u4E48\u97F3\u5C31\u54CD\u4EC0\u4E48\u97F3": { en: "Rarely needed: a fallback when a sound is itself off by octaves (e.g. GS Guitar Harmonics is two octaves high); once fixed, what you write is what sounds" },
  "\u91C7\u6837\u5F00\u5934\u5230\u300C\u7838\u4E0B\u53BB\u90A3\u4E00\u4E0B\u300D\u6709\u591A\u8FDC\uFF1A\u653E\u7684\u65F6\u5019\u63D0\u524D\u8FD9\u4E48\u591A\u5F00\u59CB\uFF0C\u8BA9\u7838\u4E0B\u53BB\u90A3\u4E00\u4E0B\u843D\u5728\u5199\u7684\u90A3\u4E00\u62CD\u4E0A\uFF08\u53CD\u5411\u9572\u8FD9\u7C7B\u6700\u660E\u663E\uFF09\u3002\u6309\u6BCF\u4E2A\u6572\u7684\u952E\u6309\u503C\u8BB0\u5728\u8FD9\u4F4D\u8EAB\u4E0A\uFF0C\u6570\u662F\u6253\u51FB\u4E50\u8868\u91CC\u5B9E\u6D4B\u7684": { en: "How far the hit is from the start of the sample: playback starts this much earlier so the hit lands on the written beat (most obvious with reverse cymbals). Stored by value on this performer for each key struck; the numbers are measured in the percussion table" },
  "\u5230\u70B9\u91CA\u653E": { en: "Release at note end" },
  "\u81EA\u5DF1\u7684\u97F3\u6E90\u6587\u4EF6\uFF0C\u76EE\u5F55\u4E0D\u8BA4\u8BC6\u5B83": { en: "Your own sound file: the catalog does not know it" },
  "\u76EE\u5F55\u91CC\u6CA1\u6709\u6807\u6210\u81EA\u5DF1\u4E00\u76F4\u54CD": { en: "Not marked in the catalog as ringing on by itself" },
  "\u5199\u7684\u65F6\u503C\u5230\u4E86\u4E0D\u677E\u952E\uFF08= \u6BCF\u4E00\u6BB5\u5F00\u5934\u5EF6\u97F3\u8E0F\u677F\u5C31\u8E29\u7740\uFF09\uFF1A\u97F3\u987A\u7740\u5305\u7EDC\u7684\u8870\u51CF\u6BB5\u54CD\u5230\u505C\uFF1B\u540C\u4E00\u4E2A\u97F3\u518D\u5F39\u3001\u5199\u4E86\u62AC\u8D77\u6216\u8FD9\u4E00\u6BB5\u7ED3\u675F\u624D\u6536\u3002\u8DF3\u97F3\u7167\u5199\u7684\u677E": { en: "The key is not let go when the written length ends (= the sustain pedal is down at the start of each section): the note rings through the envelope's decay; it stops when the same note is played again, a pedal release is written, or the section ends. Staccato notes still stop as written" },
  "\u5199\u7684\u65F6\u503C\u5230\u4E86\u5C31\u677E\u952E\uFF08= \u6BCF\u4E00\u6BB5\u5F00\u5934\u5EF6\u97F3\u8E0F\u677F\u62AC\u7740\uFF09\uFF1A\u8FDB\u5165\u5305\u7EDC\u7684\u91CA\u653E\u6BB5\uFF0C\u4E50\u5668\u81EA\u5DF1\u7684\u6536\u5C3E\u7167\u6837\u6709": { en: "The key is let go when the written length ends (= the sustain pedal is up at the start of each section): the envelope's release stage follows, so the instrument's own fade-out is still there" },
  "\u6CA1\u5199\u8E0F\u677F\u8BB0\u53F7\u65F6\u7528\u8FD9\u4E00\u683C\u3002\u5B83\u5B9A\u7684\u662F\u4EC0\u4E48\u65F6\u5019\u677E\u952E\uFF1B\u5305\u7EDC\uFF08\u8D77\u97F3\u3001\u8870\u51CF\u3001\u91CA\u653E\uFF09\u662F\u97F3\u8272\u5E93\u5199\u7684\uFF0C\u8FD9\u91CC\u4E0D\u6539\u3002\u51FA\u5382\uFF1A{side}\u2014\u2014{why}": { en: "Used where no pedal mark is written. It decides when the key is let go; the envelope (attack, decay, release) comes from the sound library and is not changed here. Factory setting: {side} \u2014 {why}" },
  "\u4E0D\u56FA\u5B9A\u539F\u901F\uFF08\u6309\u5199\u7684\u97F3\u53D8\u8C03\uFF09": { en: "Not fixed speed (transposes by the written note)" },
  "\u300C{rn}\u300D\u97F3\u9AD8\u5BF9\u9F50{on}": { en: "\u201C{rn}\u201D pitch align{on}" },
  "\u300C{rn}\u300D\u4FEE\u516B\u5EA6 / \u79FB\u8C03 {next} \u534A\u97F3": { en: "\u201C{rn}\u201D octave fix / transpose {next} semitones" },
  "\u300C{rn}\u300D\u6CA1\u5199\u8E0F\u677F\u8BB0\u53F7\u65F6\uFF1A{p}": { en: "\u201C{rn}\u201D when no pedal is written: {p}" },
  "\u300C{rn}\u300D\u529B\u5EA6 {p}": { en: "\u201C{rn}\u201D velocity {p}" },
  "\u9F50\u5E73": { en: "Leveling" },
  "\u6BCF\u4E2A\u5B57\u7684\u54CD\u5EA6\u5F80\u6574\u53E5\u7684\u4E2D\u4F4D\u6570\u62C9\u51E0\u6210\uFF1A\u5173 = \u7167\u5FF5\u7684\u65F6\u5019\u81EA\u5DF1\u7684\u8F7B\u91CD\uFF08\u5B57\u548C\u5B57\u4E4B\u95F4\u54CD\u5EA6\u4E0D\u53EF\u63A7\uFF09\uFF1B0.8 = \u62C9\u516B\u6210\uFF08\u9ED8\u8BA4\uFF1B2026-10-14 \u5230 10-17 \u9ED8\u8BA4\u5173\u8FC7\uFF09\u3002\u56E2\u5B50 C \u6BB5\u7B2C 10 \u5C0F\u8282\u300C\u305D\u300D\u7684\u7834\u97F3\u662F\u9F50\u5E73\u300C\u6BCF\u5B57\u91CD\u8D77\u300D\u5728\u5B57\u7684\u8FB9\u754C\u4E0A\u8DF3\u51FA\u6765\u7684\u53F0\u9636\uFF0C\u300C\u8FDE\u7EED\u300D\u4E0D\u8DF3": { en: "How far each syllable's loudness is pulled toward the line's median: off = as spoken (loudness between syllables is uncontrolled); 0.8 = 80% (default). Restarting per syllable can step at syllable boundaries and crackle; \u201CContinuous\u201D doesn't step" },
  "\u9F50\u5E73\u8FC7\u6E21": { en: "Leveling transition" },
  "\u6BCF\u5B57\u91CD\u8D77": { en: "Per syllable" },
  "\u9F50\u5E73\u5F00\u7740\u65F6\u589E\u76CA\u600E\u4E48\u4ECE\u4E00\u4E2A\u5B57\u6362\u5230\u4E0B\u4E00\u4E2A\u5B57\uFF1A\u6BCF\u5B57\u91CD\u8D77 = \u5728\u6BCF\u4E2A\u5B57\u7684\u5143\u97F3\u8D77\u70B9\u4ECE 0 \u8D77\u300130 ms \u5185\u722C\u5230\u8FD9\u4E2A\u5B57\u7684\u76EE\u6807\uFF0C\u8F85\u97F3\u4E0D\u52A0\uFF1B\u8FDE\u7EED = \u4ECE\u524D\u4E00\u4E2A\u5B57\u7684\u589E\u76CA\u8D77\uFF0C\u7ECF\u8FC7\u8F85\u97F3\u5230\u5143\u97F3\u8D77\u70B9\u540E 30 ms \u5E73\u6ED1\u8FC7\u6E21\u5230\u8FD9\u4E2A\u5B57\u7684": { en: "How gain moves between syllables while leveling: per syllable = starts from 0 at each syllable's vowel onset and climbs to its target within 30 ms, consonants not boosted; continuous = smoothly from the previous syllable's gain, through the consonant, to this one's within 30 ms of the vowel onset" },
  "\u9F50\u5E73\u4E0A\u9650": { en: "Leveling limit" },
  "\u9F50\u5E73\u6700\u591A\u628A\u4E00\u4E2A\u5B57\u62C9\u51E0 dB": { en: "The most dB leveling can pull a syllable" },
  "\u501F\u5143\u97F3\u95E8\u69DB": { en: "Vowel-borrow threshold" },
  "\u4E00\u4E2A\u5B57\u81EA\u5DF1\u6700\u5E72\u51C0\u90A3\u4E09\u5206\u4E4B\u4E00\u5E27\u7684\u6742\u5EA6\u8D85\u8FC7\u8FD9\u4E2A\u6570 = \u5F53\u5B83\u662F\u6C14\u58F0\u5FF5\u7684\uFF0C\u62FF\u540C\u4E00\u53E5\u91CC\u522B\u7684\u5E72\u51C0\u7684\u540C\u5143\u97F3\u6765\u5531\uFF08\u300C\u305D\u300D\u662F 0.34\uFF09": { en: "If the noisiness of a syllable's cleanest third of frames exceeds this, it's treated as spoken breathily, and a clean same-vowel syllable from the line is sung instead" },
  "\u6C14\u606F": { en: "Breathiness" },
  "\u5B9E\u58F0": { en: "Clear" },
  "\u7167\u5FF5\u7684": { en: "As spoken" },
  "\u5408\u6210\u524D\u628A\u6BCF\u5E27\u6BCF\u4E2A\u9891\u6BB5\u7684\u6742\u5EA6\u538B\u5230\u8FD9\u4E2A\u5143\u97F3\u6700\u5E72\u51C0\u90A3\u51E0\u5E27\u7684\u7A0B\u5EA6\uFF1A0 = \u5168\u538B\u6210\u5B9E\u58F0\uFF0C1 = \u7167 piper \u5FF5\u51FA\u6765\u7684\u7559\u7740": { en: "Before synthesis, presses each frame's band noisiness down to the level of this vowel's cleanest frames: 0 = fully clear voice, 1 = keep what piper spoke" },
  "\u5C0F\u6708\u76F8\u672C\u4EBA\uFF08\u3064\u304F\u3088\u307F\u3061\u3083\u3093\uFF1B\u7B2C\u4E00\u6B21\u8981\u52A0\u8F7D\u7EA6 65 MB\uFF09": { en: "Tsukuyomi-chan herself (\u3064\u304F\u3088\u307F\u3061\u3083\u3093; loads about 65 MB the first time)" },
  "\u539F\u59CB\u8F93\u51FA\u589E\u76CA": { en: "Raw output gain" },
  "\u5206\u6BB5\u5531": { en: "Sing in segments" },
  "\u6CA1\u5199": { en: "not set" },
  "\u5C0F 0.5 dB": { en: "0.5 dB quieter" },
  "\u5927 0.5 dB": { en: "0.5 dB louder" },
  "\u5531\u6CD5\u6838\u5FC3\u7B97\u51FA\u6765\u7684\u539F\u59CB\u58F0\u97F3\uFF0C\u8FDB\u5979\u8FD9\u6761\u8F68\u4E4B\u524D\u5148\u4E58\u591A\u5C11\u3002\u9ED8\u8BA4 {d}\uFF1A\u91CF\u8FC7\u7684\u539F\u59CB\u5CF0\u503C\u7EA6 0.42\uFF0C\u62AC\u5230 0.89\u2014\u2014\u8FD9\u662F\u8FD9\u4E2A\u5F15\u64CE\u81EA\u5DF1\u7684\u6EE1\u97F3\u91CF\u3002\u6539\u4E86\u4E0D\u7528\u91CD\u5531\uFF0C\u6BCF\u4E00\u53E5\u8DDF\u7740\u53D8\u3002\u5B83\u4E58\u5728\u6548\u679C\u5668\u4E4B\u524D\uFF1A\u538B\u7F29\u3001\u5747\u8861\u6536\u5230\u7684\u662F\u4E58\u8FC7\u4E4B\u540E\u7684\u58F0\u97F3\u3002\u4E0A\u9762\u300C\u54CD\u5EA6\u300D\u90A3\u4E00\u884C\u548C\u63A8\u5B50\u5728\u4E00\u8D77\uFF0C\u5728\u6548\u679C\u5668\u4E4B\u540E\u3002": { en: "How much the singing core\u2019s raw output is multiplied by before it enters her track. Default {d}: the measured raw peak is about 0.42, lifted to 0.89 \u2014 this is the engine\u2019s own full scale. Changing this needs no re-singing; every phrase follows. It is applied before the effects: the compressor and EQ receive the sound after this gain. The \u201CLoudness\u201D row above sits with the fader, after the effects." },
  "\uFF08\u9ED8\u8BA4\uFF09": { en: " (default)" },
  "\u6539\u4E86\u7528\u5230\u7684\u53E5\u5B50\u4F1A\u91CD\u5531\uFF1B\u5B58\u8FDB\u6B4C\u91CC\u3001\u80FD\u64A4\u9500": { en: "Changing it re-sings the lines that use it; saved in the song, can be undone" },
  "\u6BCF\u53E5": { en: "Per line" },
  "\u6BCF\u5F20\u7EB8": { en: "Per sheet" },
  "\u4E00\u6574\u9996": { en: "Whole song" },
  "\u5728\u4F11\u6B62\u5904\u5207\uFF08\u4F11\u6B62 \u2265 0.25 \u79D2\uFF09\uFF1A\u5185\u5B58\u6700\u7701\uFF0C\u6539\u4E00\u53E5\u53EA\u91CD\u5531\u90A3\u4E00\u53E5": { en: "Cut at rests (rests \u2265 0.25 s): least memory; editing a line only re-sings that line" },
  "\u4E00\u5F20\u7EB8\u4E00\u6BB5": { en: "One segment per sheet" },
  "\u4E00\u53E3\u6C14\u5531\u5B8C\uFF08\u4EE5\u524D\u7684\u5531\u6CD5\uFF1B\u957F\u6B4C\u5728 iPad \u4E0A\u53EF\u80FD\u5185\u5B58\u4E0D\u591F\uFF09": { en: "Sing it all at once (the old way; long songs may run out of memory on iPad)" },
  "\u4E00\u53E3\u6C14\u5531\u5B8C\uFF1A\u53E5\u548C\u53E5\u4E4B\u95F4\u5531\u6CD5\u6700\u8FDE\u8D2F\uFF0C\u4F46\u957F\u6B4C\u5728 iPad \u4E0A\u53EF\u80FD\u5185\u5B58\u4E0D\u591F": { en: "Sing it all at once: smoothest between lines, but long songs may run out of memory on iPad" },
  "\u5206\u6BB5\u5531\uFF1A\u4E00\u6BB5\u5531\u5B8C\u5C31\u653E\u6389\uFF0C\u91CD\u590D\u7684\u6BB5 / \u6CA1\u6539\u7684\u53E5\u5B50\u76F4\u63A5\u62FF\u4E0A\u6B21\u7684\uFF1B\u6BB5\u548C\u6BB5\u4E4B\u95F4\u5207\u5728\u4F11\u6B62 / \u7EB8\u754C\uFF0C\u6574\u9996\u6700\u540E\u7EDF\u4E00\u97F3\u91CF": { en: "Sing in segments: each is released after singing, repeated segments / unchanged lines reuse last time's; cuts fall at rests / sheet boundaries, with one volume for the whole song at the end" },
  "\u300C{rn}\u300D\u539F\u59CB\u8F93\u51FA\u589E\u76CA {db} dB": { en: "\u201C{rn}\u201D raw output gain {db} dB" },
  "\u300C{rn}\u300D\u5206\u6BB5\u5531\uFF1A{p}": { en: "\u201C{rn}\u201D sing in segments: {p}" },
  "\u5C0F\u6708\u76F8\u7684\u5143\u97F3\u91C7\u6837\uFF1A\u6309\u4E0B\u5373\u54CD\u3001\u4EFB\u4F55\u8BBE\u5907\u90FD\u80FD\u8DD1": { en: "Tsukuyomi-chan's vowel samples: instant response, runs on any device" },
  "\u5143\u97F3\u8868\u7684\u6EE1\u97F3\u91CF": { en: "Vowel table full scale" },
  "\u5CF0\u503C 0.8\uFF08\u22121.9 dB\uFF09": { en: "peak 0.8 (\u22121.9 dB)" },
  "\u5143\u97F3\u7248\u7684\u58F0\u97F3\u662F\u9884\u5148\u5531\u597D\u3001\u968F app \u5E26\u7740\u7684\u4E00\u5F20\u5143\u97F3\u8868\uFF1B\u751F\u6210\u90A3\u5F20\u8868\u7684\u65F6\u5019\u6574\u5F20\u7F29\u5230\u6700\u54CD\u7684\u4E00\u4E0B = \u6EE1\u5E45\u7684 0.8\u3002\u8FD9\u662F\u8FD9\u4E2A\u5E93\u81EA\u5DF1\u7684\u6EE1\u97F3\u91CF\uFF0C\u8FD9\u91CC\u4E0D\u80FD\u8C03\uFF1B\u4E0A\u9762\u300C\u54CD\u5EA6\u300D\u90A3\u4E00\u884C\u5728\u5B83\u4E4B\u4E0A\u7BA1\u8FD9\u4F4D\u4E50\u624B\u6574\u4F53\u591A\u54CD": { en: "The vowel version plays a vowel table that was sung in advance and ships with the app; when that table was generated, the whole table was scaled so its loudest sample is 0.8 of full scale. This is this library\u2019s own full scale and can\u2019t be adjusted here; the \u201CLoudness\u201D row above sets how loud this performer is overall on top of it." },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u4E0D\u8BA9\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u7528\u5B58\u50A8": { en: "This browser doesn't let pages opened by double-click use storage" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u73B0\u5728\u4E0D\u8BA9\u8FD9\u4E00\u9875\u7528\u5B58\u50A8": { en: "This browser doesn't let this page use storage right now" },
  "\u548C itch \u4E0A\u522B\u7684\u6E38\u620F\u5171\u7528\u4E00\u4E2A\u5B58\u50A8\u6876": { en: "Shares one storage bucket with other games on itch" },
  "\u548C\u8FD9\u53F0\u7535\u8111\u4E0A\u522B\u7684\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u5171\u7528\u4E00\u4E2A\u5B58\u50A8\u6876": { en: "Shares one storage bucket with other double-clicked pages on this computer" },
  "\u5199\u4E0D\u8FDB\u5B58\u50A8\u4E86\uFF08{why}\uFF09\uFF1A\u8FD9\u6B21\u6253\u5F00\u4E4B\u540E\u7684\u8BBE\u7F6E\u53EA\u7559\u5728\u5185\u5B58\u91CC": { en: "Can't write to storage ({why}): settings from now on stay in memory only" },
  "\u7F16\u6392\u3000": { en: "Arrangement\u2002" },
  " \u7B49 {n} \u5904": { en: " at {n} places" },
  "\u9690\u85CF\u4E86 {n} \u6BB5": { en: "{n} {n|section|sections} hidden" },
  "\u9690\u85CF\u4E86 {n} \u4E2A\u58F0\u90E8": { en: "{n} {n|part|parts} hidden" },
  "\u6F14\u594F\u6CD5\u548C\u8868\u60C5\uFF1A\u4E0D\u663E\u793A": { en: "Articulations & dynamics: hidden" },
  "\u6709\u4E00\u7EC4\u6BD4\u4E00\u9875\u9AD8\uFF0C\u63A5\u5230\u4E86\u4E0B\u4E00\u9875": { en: "A group is taller than a page, continued on the next page" },
  "\u65E0\u8C03": { en: "no key" },
  "\u6781\u5F31": { en: "very very soft" },
  "\u5F88\u5F31": { en: "very soft" },
  "\u5F31##\u529B\u5EA6": { en: "soft" },
  "\u4E2D\u5F31": { en: "moderately soft" },
  "\u4E2D\u5F3A": { en: "moderately loud" },
  "\u5F3A##\u529B\u5EA6": { en: "loud" },
  "\u5F88\u5F3A": { en: "very loud" },
  "\u6781\u5F3A": { en: "very very loud" },
  "\u8FD9\u4E2A\u97F3\u77ED\u4E00\u70B9\u3001\u548C\u4E0B\u4E00\u4E2A\u97F3\u65AD\u5F00": { en: "Make this note short, detached from the next one" },
  "\u8FD9\u4E2A\u97F3\u7684\u97F3\u5934\u91CD\u4E00\u70B9": { en: "Lean on the start of this note" },
  "\u6BD4\u91CD\u97F3\u66F4\u91CD\u7684\u97F3\u5934": { en: "A heavier attack than an accent" },
  "\u6BD4\u91CD\u97F3\u8F7B\u4E00\u6863\u7684\u91CD\uFF08\u56DB\u62CD\u5B50\u91CC\u7684\u7B2C\u4E09\u62CD\u90A3\u79CD\uFF09": { en: "A lighter stress than an accent (like beat three in 4/4)" },
  "\u8FD9\u4E2A\u97F3\u8F7B\u4E00\u70B9": { en: "Play this note softer" },
  "\u51E0\u4E4E\u542C\u4E0D\u89C1\u7684\u97F3\uFF08\u53EA\u7559\u4E2A\u5F71\u5B50\uFF09": { en: "A note you can barely hear (just a shadow)" },
  "\u8FD9\u4E2A\u97F3\u5531 / \u594F\u6EE1\uFF0C\u4E0D\u548C\u4E0B\u4E00\u4E2A\u97F3\u65AD\u5F00": { en: "Hold this note full length, connected to the next one" },
  "\u8FD9\u4E2A\u97F3\u540E\u9762\u6362\u6C14": { en: "Breathe after this note" },
  "\u97F3\u5934\u7A81\u7136\u51B2\u4E00\u4E0B\u3001\u518D\u56DE\u5230\u5F53\u4E0B\u7684\u529B\u5EA6": { en: "A sudden burst at the start, then back to the current dynamic" },
  "\u97F3\u5934\u6309\u5F3A\u3001\u9A6C\u4E0A\u843D\u5230\u5F31\uFF0C\u540E\u9762\u7684\u97F3\u90FD\u662F\u5F31": { en: "Loud attack that drops straight to soft; the notes after stay soft" },
  "\u4E0D\u5531\u97F3\u9AD8\u3001\u7528\u6C14\u58F0\u5FF5\uFF08\u97F3\u9AD8\u7167\u5199\u5728\u8C31\u4E0A\uFF09": { en: "Speak this note in a breathy voice instead of singing the pitch (the pitch stays written)" },
  "\u8FD9\u4E2A\u97F3\u91CC\u9762\u4ECE\u5F31\u957F\u5230\u5199\u7684\u529B\u5EA6": { en: "Grow from soft to the written dynamic within this note" },
  "\u8FD9\u4E2A\u97F3\u91CC\u9762\u4ECE\u5199\u7684\u529B\u5EA6\u6536\u5F31": { en: "Fade from the written dynamic within this note" },
  "\u8FD9\u4E2A\u97F3\u91CC\u9762\u5148\u957F\u540E\u6536\uFF08messa di voce\uFF09": { en: "Grow then fade within this note (messa di voce)" },
  "\u548C\u5F26\u4ECE\u4F4E\u5230\u9AD8\u4E00\u4E2A\u4E2A\u62E8\u51FA\u6765": { en: "Roll the chord from the lowest note up" },
  "\u8FD9\u4E2A\u97F3\u5FEB\u901F\u5730\u53CD\u590D\u6572\uFF08\u6EDA\uFF09\uFF1B\u6BCF\u4E00\u4E0B\u90FD\u662F\u6574\u4E0B\u6572\uFF0C\u60F3\u8F7B\u4E00\u70B9\u5C31\u518D\u52A0\u5E7D\u7075\u97F3": { en: "Repeat this note rapidly (a roll); every hit is a full stroke \u2014 for a softer roll, also add a ghost note" },
  "{dynName}\uFF08{dyn}\uFF09\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u8D77\u662F\u8FD9\u4E2A\u5F3A\u5F31\uFF0C\u7BA1\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7": { en: "{dynName} ({dyn}): from this note on, at this loudness, until the next dynamic mark" },
  "\u4ECE\u8FD9\u91CC\u8D77\u8D8A\u6765\u8D8A\u5F3A\uFF0C\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u4E3A\u6B62": { en: "Getting louder from here until the next dynamic mark" },
  "\u4ECE\u8FD9\u91CC\u8D77\u8D8A\u6765\u8D8A\u5F31\uFF0C\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u4E3A\u6B62": { en: "Getting softer from here until the next dynamic mark" },
  "\u4ECE\u4E0A\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u5747\u5300\u53D8\u5230\u8FD9\u4E00\u4E2A": { en: "Change evenly from the previous dynamic mark to this one" },
  "\u8E29\u4E0B\uFF1A\u4E4B\u540E\u677E\u5F00\u7684\u952E\u5148\u4E0D\u505C\uFF0C\u5230\u6362\u8E0F\u677F\u6216\u62AC\u8D77\u624D\u505C": { en: "Pedal down: keys you let go keep sounding until the next pedal change or lift" },
  "\u8E29\u4E0B\u90A3\u4E00\u523B\u6309\u7740\u7684\u952E\u63A5\u7740\u54CD\uFF0C\u540E\u9762\u5F39\u7684\u7167\u5E38": { en: "Notes held when it is pressed keep ringing; notes played after that behave as usual" },
  "\u8E29\u4E0B\uFF1A\u5F39\u5F97\u8F7B\u4E00\u70B9\u3002\u97F3\u8272\u53D8\u4E0D\u53D8\u770B\u8FD9\u4EF6\u4E50\u5668\u7684\u97F3\u8272\u5E93": { en: "Press: play a little softer. Whether the tone changes depends on the instrument's sound library" },
  "{src} \u8F7D\u8FDB\u6765\u4E86\uFF0C\u4F46\u91CC\u9762\u6CA1\u6709\u300C{key}\u300D": { en: "{src} loaded, but \u201C{key}\u201D isn't in it" },
  "\u5907\u7528\u7248\u6587\u4EF6\u5939\u91CC\u5C11\u4E86 {src}\uFF08\u6216\u6D4F\u89C8\u5668\u4E0D\u8BA9\u8BFB\uFF09": { en: "{src} is missing from the standalone folder (or the browser won't let it be read)" },
  "\u5907\u7528\u7248\u91CC\u6CA1\u6709 {path}": { en: "{path} isn't in the standalone version" },
  "{path}\uFF1A\u5907\u7528\u7248\u6587\u4EF6\u5939\u91CC\u7684\u8FD9\u4E2A\u6587\u4EF6\u548C app \u91CC\u9489\u7684\u54C8\u5E0C\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09": { en: "{path}: this file in the standalone folder doesn't match the hash pinned in the app (modified or damaged)" },
  "{path}\uFF1A\u548C app \u91CC\u9489\u7684\u54C8\u5E0C\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09": { en: "{path}: doesn't match the hash pinned in the app (modified or damaged)" },
  "\u5C11\u4E86\u300C{close}\u300D": { en: "Missing \u201C{close}\u201D" },
  "\u591A\u4E86\u300C{c}\u300D": { en: "Extra \u201C{c}\u201D" },
  "\u770B\u4E0D\u61C2\u300C{p}\u300D": { en: "Can't understand \u201C{p}\u201D" },
  "\u6CA1\u6709\u53EB\u300C{name}\u300D\u7684\u7EB8\uFF08\u5199\u66F2\u6BB5\u540D\uFF0C\u6216\u8005\u7B2C\u51E0\u5F20\u7EB8\u7684\u5E8F\u53F7\uFF09": { en: "No sheet named \u201C{name}\u201D (write a section name, or a sheet number)" },
  "\u91CD\u590D\u6B21\u6570\u8981\u5728 1 \u5230 99 \u4E4B\u95F4": { en: "Repeat counts must be 1 to 99" },
  "\u5FAA\u73AF\u6BB5\u662F\u7A7A\u7684": { en: "The loop section is empty" },
  "\u5FAA\u73AF\u6BB5\u53EA\u80FD\u653E\u5728\u6700\u540E\uFF1A\u540E\u9762\u7684\u6C38\u8FDC\u653E\u4E0D\u5230": { en: "The loop section can only be last: anything after it would never play" },
  "\u9AD8\u97F3": { en: "Treble" },
  "\u9AD8\u97F3 8vb": { en: "Treble 8vb" },
  "\u9AD8\u97F3 8va": { en: "Treble 8va" },
  "\u9AD8\u97F3 15ma": { en: "Treble 15ma" },
  "\u4F4E\u97F3": { en: "Bass" },
  "\u4F4E\u97F3 8vb": { en: "Bass 8vb" },
  "\u9AD8\u97F3\u8C31\u53F7": { en: "Treble clef" },
  "\u9AD8\u97F3\u8C31\u53F7\u4E0B\u9762\u6302 8\uFF1A\u8C31\u4E0A\u5199\u7684\u97F3\u5B9E\u9645\u4F4E\u4E00\u4E2A\u516B\u5EA6\u54CD\uFF08\u5409\u4ED6\u3001\u7537\u9AD8\u97F3\uFF09": { en: "Treble clef with 8 below: written notes sound an octave lower (guitar, tenor)" },
  "\u9AD8\u97F3\u8C31\u53F7\u4E0A\u9762\u6302 8\uFF1A\u5B9E\u9645\u9AD8\u4E00\u4E2A\u516B\u5EA6\uFF08\u77ED\u7B1B\uFF09": { en: "Treble clef with 8 above: sounds an octave higher (piccolo)" },
  "\u9AD8\u97F3\u8C31\u53F7\u4E0A\u9762\u6302 15\uFF1A\u5B9E\u9645\u9AD8\u4E24\u4E2A\u516B\u5EA6\uFF08\u949F\u7434\u3001\u94C3\uFF09": { en: "Treble clef with 15 above: sounds two octaves higher (glockenspiel, bells)" },
  "\u4F4E\u97F3\u8C31\u53F7": { en: "Bass clef" },
  "\u4F4E\u97F3\u8C31\u53F7\u4E0B\u9762\u6302 8\uFF1A\u5B9E\u9645\u4F4E\u4E00\u4E2A\u516B\u5EA6\uFF08\u4F4E\u97F3\u63D0\u7434\u3001\u8D1D\u65AF\uFF09": { en: "Bass clef with 8 below: sounds an octave lower (double bass, bass guitar)" },
  "\u7ED3\u675F\u516B\u5EA6\u7EBF": { en: "End ottava line" },
  "\u6700\u91CD": { en: "strongest" },
  "\u5F88\u91CD": { en: "very strong" },
  "\u91CD": { en: "strong" },
  "\u7A0D\u91CD": { en: "slightly strong" },
  "\u7A0D\u8F7B": { en: "slightly light" },
  "\u8F7B": { en: "light" },
  "\u4E00": { en: "1" },
  "\u4E8C": { en: "2" },
  "\u4E09": { en: "3" },
  "\u56DB": { en: "4" },
  "\u4E94": { en: "5" },
  "\u516D": { en: "6" },
  "\u4E03": { en: "7" },
  "\u516B": { en: "8" },
  "\u4E5D": { en: "9" },
  "\u5341": { en: "10" },
  "\u5341\u4E00": { en: "11" },
  "\u5341\u4E8C": { en: "12" },
  "{p}\u62CD {p2}": { en: "Beat {p} {p2}" },
  "\u4E24\u5C0F\u8282\u4E00\u8F6E\uFF1A\u7B2C\u4E00\u5C0F\u8282 {p}\uFF1B\u7B2C\u4E8C\u5C0F\u8282 {p2}\uFF1B\u91CD\u7684\u683C\u5B50\uFF08\u5C0F\u8282-\u7B2C\u51E0\u4E2A\u5341\u516D\u5206\uFF09{p3}": { en: "Two-bar cycle: first bar {p}; second bar {p2}; strong slots (bar-sixteenth) {p3}" },
  "\u62CD\u91CC\u7684\u516B\u5206": { en: "Eighths within the beat" },
  "\u534A\u62CD": { en: "Half-beat" },
  "\uFF1B\u66F4\u7EC6\u7684 {finer}": { en: "; finer {finer}" },
  "\u52A0\u4E86\u4E00\u5F20\u7EB8": { en: "Added a sheet" },
  "\u5220\u4E86\u4E00\u5F20\u7EB8": { en: "Deleted a sheet" },
  "\u52A0\u4E86\u4E00\u4E2A\u58F0\u90E8": { en: "Added a part" },
  "\u5220\u4E86\u4E00\u4E2A\u58F0\u90E8": { en: "Deleted a part" },
  "\u632A\u4E86\u58F0\u90E8\u987A\u5E8F": { en: "Reordered parts" },
  "\u5199\u4E86 {d} \u4E2A": { en: "Wrote {d}" },
  "\u5220\u4E86 {d} \u4E2A": { en: "Deleted {d}" },
  "\u6539\u6B4C\u540D": { en: "Changed title" },
  "\u6539\u4F5C\u8005\u680F": { en: "Changed credits" },
  "\u6539\u66F2\u6BB5\u540D": { en: "Renamed section" },
  "\u6539##\u8C31": { en: "Edited" },
  "{engineName}\u4E0D\u5531\u6B4C\u8BCD\uFF08\u53EA\u54FC / \u53EA\u5F39\uFF09\uFF1B\u6B4C\u8BCD\u7167\u5199\u7167\u5B58": { en: "{engineName} doesn't sing lyrics (only hums / plays); lyrics are still written and saved" },
  "\u8FD9\u4E00\u6BB5\u6709\u5047\u540D\u3001\u6309\u65E5\u8BED\u5531\uFF1A\u6C49\u5B57\u5C0F\u6708\u76F8\u6309\u8BFB\u97F3\u6570\u62CD\uFF0C\u4E00\u4E2A\u5B57\u53EF\u80FD\u597D\u51E0\u62CD\u3001\u5BF9\u4E0D\u4E0A\u97F3\u2014\u2014\u5199\u6210\u5047\u540D\uFF08\u4E00\u6BB5\u90FD\u662F\u6C49\u5B57\u624D\u6309\u4E2D\u6587\u5531\uFF1B\u6BB5 = \u4E50\u5668\u8BBE\u7F6E\u91CC\u7684\u300C\u5206\u6BB5\u5531\u300D\uFF09": { en: "This segment has kana and is sung in Japanese: Tsukuyomi-chan counts kanji by reading, so one character may take several beats and miss the notes \u2014 write it in kana (a segment is sung in Chinese only if it's all kanji; segment = \u201CSing in segments\u201D in instrument settings)" },
  "\u4E00\u4E2A\u97F3\u4E0A {beats} \u62CD\uFF1A\u5C0F\u6708\u76F8\u4E00\u4E2A\u97F3\u5531\u4E00\u62CD\u2014\u2014\u62C6\u6210 {beats2} \u4E2A\u97F3\uFF0C\u6216\u8005\u7528\u300C+\u300D\u8FDE\u7740\u5199": { en: "{beats} beats on one note: Tsukuyomi-chan sings one beat per note \u2014 split into {beats2} notes, or join with \u201C+\u201D" },
  "\u8FD9\u4E00\u6BB5\u6309\u65E5\u8BED\u5531\uFF1A\u5B57\u6BCD / \u6570\u5B57 / \u7B26\u53F7\u5FF5\u4E0D\u51C6\u2014\u2014\u5199\u6210\u5047\u540D": { en: "This segment is sung in Japanese: letters / digits / symbols aren't read reliably \u2014 write them in kana" },
  "\u8FD9\u4E00\u6BB5\u6309\u4E2D\u6587\u5531\uFF1A\u4E00\u4E2A\u97F3\u5199\u4E00\u4E2A\u6C49\u5B57": { en: "This segment is sung in Chinese: one character per note" },
  "\u8FD9\u4E00\u6BB5\u6309\u82F1\u6587\u5531\uFF1A\u5199\u62C9\u4E01\u5B57\u6BCD": { en: "This segment is sung in English: use Latin letters" },
  "\u8212\u9002": { en: "Comfortable" },
  "\u97F3\u7B26\u5927\uFF0C\u4E00\u9875\u653E\u5F97\u5C11": { en: "Big notes, fewer per page" },
  "\u7D27\u51D1": { en: "Compact" },
  "\u97F3\u7B26\u5C0F\uFF0C\u4E00\u9875\u653E\u5F97\u591A\uFF08\u6B4C\u540D\u548C\u58F0\u90E8\u540D\u7167\u5927\u7684\uFF0C\u6B4C\u8BCD\u7528\u5C0F\u5B57\uFF09": { en: "Small notes, more per page (title and part names stay big; lyrics are smaller)" },
  "\u6A2A\u653E\uFF1A\u603B\u8C31 / \u5927\u5C4F": { en: "Landscape: scores / large screens" },
  "\u6B63\u7ECF\u7EB8": { en: "Standard paper" },
  "\u5C0F\u518C\u5B50\uFF0CA4 \u5BF9\u6298": { en: "Booklet, A4 folded" },
  "\u53E3\u888B\u672C": { en: "Pocket" },
  "A3 \u6A2A": { en: "A3 landscape" },
  "\u53CD\u590D / \u8DF3\u8F6C\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C": { en: "Repeats / jumps only count on this sheet's top part" },
  "\u8FD9\u5F20\u7EB8\u4E0A\u6CA1\u6709 Segno\uFF0CD.S. \u8DF3\u4E0D\u4E86": { en: "No Segno on this sheet, so D.S. can't jump" },
  "\u6CA1\u6709 To Coda\uFF1A\u8DF3\u56DE\u6765\u4E4B\u540E\u4E00\u8DEF\u653E\u5230\u7EB8\u5C3E": { en: "No To Coda: after jumping back it plays to the end of the sheet" },
  "\u5927\u8C03": { en: "Major" },
  "\u5927\u5C0F\u8C03": { en: "Major / minor" },
  "\u5C0F\u8C03": { en: "Minor" },
  "\u548C\u58F0\u5C0F\u8C03": { en: "Harmonic minor" },
  "\u65CB\u5F8B\u5C0F\u8C03": { en: "Melodic minor" },
  "\u5BAB\u8C03\u5F0F": { en: "Gong mode" },
  "\u4E94\u58F0": { en: "Pentatonic" },
  "\u5546\u8C03\u5F0F": { en: "Shang mode" },
  "\u89D2\u8C03\u5F0F": { en: "Jue mode" },
  "\u5FB5\u8C03\u5F0F": { en: "Zhi mode" },
  "\u7FBD\u8C03\u5F0F": { en: "Yu mode" },
  "\u516D\u58F0\u52A0\u6E05\u89D2": { en: "Hexatonic + qingjue" },
  "\u6C11\u65CF": { en: "Chinese" },
  "\u516D\u58F0\u52A0\u53D8\u5BAB": { en: "Hexatonic + biangong" },
  "\u96C5\u4E50": { en: "Yayue" },
  "\u71D5\u4E50": { en: "Yanyue" },
  "\u90FD\u8282": { en: "Miyako-bushi" },
  "\u65E5\u672C": { en: "Japanese" },
  "\u7409\u7403": { en: "Ryukyu" },
  "\u5E03\u9C81\u65AF": { en: "Blues" },
  "\u591A\u5229\u4E9A": { en: "Dorian" },
  "\u6559\u4F1A\u8C03\u5F0F": { en: "Church modes" },
  "\u5F17\u91CC\u51E0\u4E9A": { en: "Phrygian" },
  "\u5229\u5E95\u4E9A": { en: "Lydian" },
  "\u6DF7\u5408\u5229\u5E95\u4E9A": { en: "Mixolydian" },
  "\u6D1B\u514B\u5229\u4E9A": { en: "Locrian" },
  "\u897F\u73ED\u7259": { en: "Spanish" },
  "\u963F\u62C9\u4F2F": { en: "Arabic" },
  "\u5308\u7259\u5229\u5C0F\u8C03": { en: "Hungarian minor" },
  "\u5168\u97F3\u9636": { en: "Whole tone" },
  "\u534A\u97F3\u9636": { en: "Chromatic" },
  "\u5E7F\u677F": { en: "Largo" },
  "\u5C0F\u5E7F\u677F": { en: "Larghetto" },
  "\u67D4\u677F": { en: "Adagio" },
  "\u884C\u677F": { en: "Andante" },
  "\u4E2D\u677F": { en: "Moderato" },
  "\u5C0F\u5FEB\u677F": { en: "Allegretto" },
  "\u5FEB\u677F": { en: "Allegro" },
  "\u6D3B\u677F": { en: "Vivace" },
  "\u6025\u677F": { en: "Presto" },
  "\u6700\u6025\u677F": { en: "Prestissimo" },
  "\u5C0F\u6708\u76F8\u7684 worker \u51FA\u9519": { en: "Tsukuyomi-chan's worker failed" },
  "\u5C0F\u6708\u76F8\u7684 worker \u91CD\u5F00\u4E86": { en: "Tsukuyomi-chan's worker restarted" },
  "\u5185\u5B58\u4E0D\u591F\uFF1A\u91CD\u5F00\u5C0F\u6708\u76F8\u7684\u5F15\u64CE\u518D\u8BD5\u4E00\u6B21": { en: "Out of memory: restarting Tsukuyomi-chan's engine to try again" },
  "\u8FD9\u53F0\u8BBE\u5907\u7684\u5185\u5B58\u4E0D\u591F\uFF0C\u5C0F\u6708\u76F8\u7684\u5F15\u64CE\u8D77\u4E0D\u6765\uFF08\u5DF2\u7ECF\u91CD\u5F00\u8FC7\u4E00\u6B21\u5F15\u64CE\uFF09\u3002\u53EF\u4EE5\u628A\u522B\u7684\u4E50\u5668\u58F0\u90E8\u9759\u97F3\u518D\u653E\uFF0C\u6216\u8005\u5173\u6389 app \u91CD\u65B0\u6253\u5F00\uFF1B\u4E5F\u53EF\u4EE5\u7ED9\u8FD9\u4E2A\u58F0\u90E8\u6362\u300C\u5C0F\u6708\u76F8\uFF08\u5143\u97F3\uFF09\u300D": { en: "This device doesn't have enough memory to start Tsukuyomi-chan's engine (already restarted once). You can mute other instrument parts and play again, or close and reopen the app; or switch this part to \u201CTsukuyomi-chan (vowels)\u201D" },
  "\u4ECE\u6587\u4EF6\u5939\u8BFB{what}": { en: "Reading {what} from the folder" },
  "\u4E0B\u8F7D{what}\uFF08{e6} MB\uFF0C\u53EA\u4E0B\u8FD9\u4E00\u6B21\uFF09{total}%": { en: "Downloading {what} ({e6} MB, only this once) {total}%" },
  "{what}\u4E0B\u8F7D\u4E0D\u4E0B\u6765\uFF08\u8BD5\u8FC7 {p}\uFF09\uFF1A{Error}\u3002\u53EF\u4EE5\u5728\u8BBE\u7F6E\u91CC\u6362\u6A21\u578B\u6765\u6E90\uFF0C\u6216\u4ECE\u672C\u673A\u6587\u4EF6\u5BFC\u5165": { en: "{what} couldn't be downloaded (tried {p}): {Error}. You can change the model source in Settings, or import from a local file" },
  "\u7F13\u5B58\u91CC\u7684\u5C0F\u6708\u76F8\u6A21\u578B\u548C\u6E05\u5355\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09\uFF0C\u574F\u7684\u90A3\u4E00\u7247\u5DF2\u7ECF\u4E22\u6389\uFF1A\u518D\u5531\u4E00\u6B21\u4F1A\u91CD\u65B0\u4E0B\u8F7D\uFF08{Error}\uFF09": { en: "The cached Tsukuyomi-chan model doesn't match its manifest (modified or damaged); the bad chunk was discarded: singing again will re-download it ({Error})" },
  "{slug}: \u5305\u91CC\u6CA1\u6709 {path}": { en: "{slug}: {path} isn't in the pack" },
  "\u52A0\u8F7D piper \u5F15\u64CE": { en: "Loading the piper engine" },
  "\u52A0\u8F7D\u5C0F\u6708\u76F8\u7684\u6A21\u578B": { en: "Loading Tsukuyomi-chan's model" },
  "\u52A0\u8F7D\u65E5\u8BED\u524D\u7AEF": { en: "Loading the Japanese front end" },
  "\u4E2D\u6587\u524D\u7AEF": { en: "Chinese front end" },
  "\u82F1\u6587\u8BCD\u5178": { en: "English dictionary" },
  "\u52A0\u8F7D WORLD": { en: "Loading WORLD" },
  "\u4E3B\u7EBF\u7A0B\u6CA1\u8BFB\u5230\u8FD9\u4E2A\u6587\u4EF6": { en: "The main thread couldn't read this file" },
  "\u5C0F\u6708\u76F8\u5728\u5531": { en: "Tsukuyomi-chan is singing" },
  "\u5FF5\uFF081/2\uFF09": { en: "Speaking (1/2)" },
  "\u5FF5\uFF082/2\uFF09": { en: "Speaking (2/2)" },
  "\u5206\u6790\uFF081/3 \u97F3\u9AD8\uFF09": { en: "Analyzing (1/3 pitch)" },
  "\u5206\u6790\uFF082/3 \u8C31\u5305\u7EDC\uFF09": { en: "Analyzing (2/3 spectral envelope)" },
  "\u5206\u6790\uFF083/3 \u6C14\u58F0\uFF09": { en: "Analyzing (3/3 breathiness)" },
  "\u5206\u6790\uFF08\u7F13\u5B58\uFF09": { en: "Analyzing (cached)" },
  "\u5408\u6210": { en: "Synthesizing" },
  "\u8FD9\u4E0D\u662F\u4E00\u4E2A\u7F51\u5740\uFF1A{link}": { en: "This is not a web address: {link}" },
  "\u53EA\u8BA4 https \u5F00\u5934\u7684\u94FE\u63A5\uFF1A{link}": { en: "Only links starting with https work: {link}" },
  "Google Drive \u4E0D\u8BA9\u522B\u7684\u7F51\u9875\u76F4\u63A5\u8BFB\u91CC\u9762\u7684\u6587\u4EF6\uFF0C\u8FD9\u6761\u94FE\u63A5\u6253\u4E0D\u5F00\u3002\u6362\u6210 Dropbox\u3001OneDrive\u3001GitHub\uFF0C\u6216\u8005\u81EA\u5DF1\u7F51\u7AD9\u4E0A\u7684\u76F4\u94FE\u3002": { en: "Google Drive does not let other web pages read its files, so this link can\u2019t be opened. Use Dropbox, OneDrive, GitHub, or a direct link on your own site." },
  "\u8FD9\u662F Dropbox \u7684\u6587\u4EF6\u5939\u94FE\u63A5\uFF1A\u8981\u5206\u4EAB\u5355\u4E2A\u6B4C\u6587\u4EF6\u7684\u94FE\u63A5\u3002": { en: "This is a Dropbox folder link. Share the link to a single song file instead." },
  "\u8FD9\u662F GitHub \u7684\u9875\u9762\uFF0C\u4E0D\u662F\u6587\u4EF6\uFF1A\u8981\u94FE\u5230\u4ED3\u5E93\u91CC\u7684\u90A3\u4E2A\u6B4C\u6587\u4EF6\uFF08\u5730\u5740\u91CC\u6709 /blob/ \u7684\u90A3\u79CD\uFF09\u3002": { en: "This is a GitHub page, not a file. Link to the song file in the repository (an address with /blob/ in it)." },
  "\u8BA4\u4E0D\u51FA\u8FD9\u4E2A Gist \u94FE\u63A5\uFF1A\u8981\u5E26\u7528\u6237\u540D\u7684\u90A3\u79CD\uFF08gist.github.com/\u540D\u5B57/\u7F16\u53F7\uFF09\u3002": { en: "Can\u2019t read this Gist link. Use the form with the user name (gist.github.com/name/id)." },
  "\u6CA1\u62FF\u5230\uFF1A{host} \u4E0D\u8BA9\u522B\u7684\u7F51\u9875\u8BFB\u8FD9\u4E2A\u6587\u4EF6\uFF0C\u6216\u8005\u7F51\u65AD\u4E86\u3002": { en: "Couldn\u2019t get it: {host} doesn\u2019t let other web pages read this file, or the network is down." },
  "{host} \u8BF4\u8FD9\u4E2A\u6587\u4EF6\u4E0D\u5728\u4E86\uFF08{status}\uFF09\uFF1A\u94FE\u63A5\u8FC7\u671F\u4E86\uFF0C\u6216\u8005\u6CA1\u8BBE\u6210\u516C\u5F00\u5206\u4EAB\u3002": { en: "{host} says the file is gone ({status}). The link may have expired or isn\u2019t shared publicly." },
  "{host} \u4E0D\u8BA9\u8BFB\uFF08{status}\uFF09\uFF1A\u8FD9\u6761\u94FE\u63A5\u6CA1\u8BBE\u6210\u300C\u77E5\u9053\u94FE\u63A5\u7684\u4EBA\u90FD\u80FD\u770B\u300D\u3002": { en: "{host} refused ({status}). The link isn\u2019t set to \u201Canyone with the link can view\u201D." },
  "{host} \u56DE\u4E86 {status}\uFF0C\u6CA1\u62FF\u5230\u6587\u4EF6\u3002": { en: "{host} answered {status}; no file." },
  "\u8FD9\u4E2A\u6587\u4EF6\u8D85\u8FC7 {mb} MB\uFF0C\u4E0D\u50CF\u4E00\u9996\u6B4C\uFF0C\u6CA1\u6253\u5F00\u3002": { en: "This file is over {mb} MB, too big for a song, so it wasn\u2019t opened." },
  "\u5C0F\u6708\u76F8\u88AB\u4F60\u5220\u4E86": { en: "Tsukuyomi-chan was deleted by you" },
  "\u4E50\u5668\u97F3\u8272\u5E93\u88AB\u4F60\u5220\u4E86": { en: "The instrument library was deleted by you" },
  "\u5927\u5C0F\u4E0D\u5BF9\uFF08{n} \u2260 {bytes}\uFF09": { en: "Wrong size ({n} \u2260 {bytes})" },
  "\u6BD4\u76EE\u5F55\u91CC\u8BF4\u7684\u5927": { en: "Larger than the catalog says" },
  "\u5927\u5C0F\u4E0D\u5BF9\uFF08{o} \u2260 {bytes}\uFF09": { en: "Wrong size ({o} \u2260 {bytes})" },
  "\u5185\u5BB9\u548C\u76EE\u5F55\u91CC\u9489\u7684\u4E0D\u4E00\u6837\uFF08sha256 {p}\u2026 \u2260 {p2}\u2026\uFF09\uFF0C\u6CA1\u6709\u7528\u5B83": { en: "Content differs from the hash pinned in the catalog (sha256 {p}\u2026 \u2260 {p2}\u2026), so it wasn't used" },
  "\u300C{name}\u300D\u62FF\u4E0D\u5230\uFF08\u8BD5\u8FC7 {p}\uFF09\u3002\u6700\u540E\u4E00\u6B21\uFF1A{last}\u3002\u53EF\u4EE5\u5728\u8BBE\u7F6E\u91CC\u6362\u97F3\u6E90\u5E93\u6765\u6E90\uFF0C\u6216\u4ECE\u672C\u673A .sf2 \u6587\u4EF6\u9009\u3002": { en: "Couldn't get \u201C{name}\u201D (tried {p}). Last attempt: {last}. You can change the sound library source in Settings, or choose from a local .sf2 file." },
  "\u300C{name}\u300D\u7684\u58F0\u97F3\uFF08{path}\uFF09\u6CA1\u968F\u8FD9\u9996\u6B4C\u5E26\u6765": { en: "The sound of \u201C{name}\u201D ({path}) didn't come with this song" },
  "\u627E\u300C{name}\u300D\u7684\u58F0\u97F3\uFF1A\u4E0B\u8F7D {name2} {bytes}%": { en: "Finding the sound of \u201C{name}\u201D: downloading {name2} {bytes}%" },
  "\u300C{name}\u300D\u7684\u58F0\u97F3\u6CA1\u968F\u6B4C\u5E26\uFF08\u5F31\u5F15\u7528\uFF09\uFF0C\u8FD9\u53F0\u8BBE\u5907\u548C\u5BB6\u65CF\u97F3\u6E90\u5E93\u91CC\u4E5F\u6CA1\u6709\u5B83\u6765\u81EA\u7684\u300C{name2}\u300D\uFF08sha256 {p}\u2026\uFF09\u3002\u70B9\u8C31\u524D\u9762\u7684\u300C{p2}\u300D\uFF0C\u7ED9\u5B83\u300C\u627E\u6587\u4EF6\u2026\u300D\uFF0C\u6216\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": { en: "The sound of \u201C{name}\u201D didn't come with the song (weak reference), and \u201C{name2}\u201D (sha256 {p}\u2026) isn't on this device or in the family sound library either. Tap \u201C{p2}\u201D at the front of the score, \u201CFind file\u2026\u201D, or change \u201CWho performs\u201D" },
  "\u4ECE\u300C{name}\u300D\u5207\u51FA\u6765\u7684\u300C{name2}\u300D\u548C\u6B4C\u91CC\u8BB0\u7684\u4E0D\u4E00\u6837\uFF08sha256 {p}\u2026 \u2260 {p2}\u2026\uFF09\uFF0C\u6CA1\u6709\u7528\u5B83": { en: "\u201C{name2}\u201D cut from \u201C{name}\u201D differs from what the song records (sha256 {p}\u2026 \u2260 {p2}\u2026), so it wasn't used" },
  "\u300C{n}\u300D\u4E91\u7AEF\u5DF2\u7ECF\u6709\u540C\u540D\u7684\u4E86\uFF0C\u79BB\u7EBF\u65F6\u5B58\u7684\u8FD9\u4EFD\u6CA1\u63A8\u4E0A\u53BB\uFF08\u5728\u6B4C\u5E93\u91CC\u6539\u4E2A\u540D\u518D\u63A8\uFF09": { en: "\u201C{n}\u201D already exists in the cloud, so the copy saved offline wasn't uploaded (rename it in the library and upload again)" },
  "\u79BB\u7EBF\u65F6\u5B58\u7684\u6B4C\u63A8\u4E0A\u4E91\u4E86\uFF08{done} / {total}\uFF09": { en: "Songs saved offline were uploaded ({done} / {total})" },
  "\u6B63\u5728\u628A\u79BB\u7EBF\u65F6\u5B58\u7684\u6B4C\u63A8\u4E0A\u4E91\u2026 {done} / {total}": { en: "Uploading songs saved offline\u2026 {done} / {total}" },
  "\u600E\u4E48\u8BA4\u7684\uFF1A\u51D1\u5F97\u6210\u5B8C\u6574\u548C\u5F26\u7684\u4F18\u5148\uFF08\u4E0D\u7701\u97F3\uFF09\u2192 \u6700\u4F4E\u97F3\u5F53\u6839\u97F3\u7684\u4F18\u5148 \u2192 \u6839\u97F3\u5728\u8FD9\u4E2A\u8C03\u91CC\u7684\u4F18\u5148 \u2192 \u7B80\u5355\u7684\u4F18\u5148\u3002\u6253\u5E73\u7684\u4E24\u4E2A\u90FD\u5199\u5728\u8C31\u4E0A\u3002": { en: "How it is read: chords that are complete (nothing left out) win \u2192 the lowest note as root wins \u2192 a root inside this key wins \u2192 simpler chords win. When two tie, both are written on the score." },
  "\u8F6C\u4F4D\uFF08\u6700\u4F4E\u97F3\u4E0D\u662F\u6839\u97F3\uFF09": { en: "Inversion (the lowest note is not the root)" },
  "\u6CA1\u6709\u4E09\u5EA6\uFF1A\u5927\u4E09\u548C\u5F26\u8FD8\u662F\u5C0F\u4E09\u548C\u5F26\u5206\u4E0D\u51FA\u6765\uFF0C\u6309\u8FD9\u4E2A\u8C03\u91CC\u7684\u5199": { en: "No third: major or minor can\u2019t be told apart, so it follows this key" },
  "\u7701\u4E86 {n} \u4E2A\u97F3": { en: "{n} {n|note|notes} left out" },
  "\u6CA1\u6709\u53EF\u7528\u7684\u8D77\u6CD5\uFF08\u6253\u5305\u65F6\u6CA1\u5E26\u8FD9\u4E2A\u7EBF\u7A0B\uFF09": { en: "No way to start it (this thread wasn't bundled)" },
  "\u540E\u53F0\u7EBF\u7A0B\u300C{name}\u300D\u8D77\u4E0D\u6765\uFF1A{Error}": { en: "Background thread \u201C{name}\u201D can't start: {Error}" },
  "\u51FA\u58F0\u7EBF\u7A0B\u300C{name}\u300D\u8D77\u4E0D\u6765\uFF1A{Error}": { en: "Audio thread \u201C{name}\u201D can't start: {Error}" },
  "\u65CB\u5F8B": { en: "Melody" },
  "\u548C\u5F26": { en: "Chords" },
  "\u7B2C\u4E8C\u65CB\u5F8B": { en: "2nd melody" },
  "\u4F34\u594F": { en: "Accomp." },
  "\u94FA\u5E95": { en: "Pad" },
  "\u8282\u594F": { en: "Rhythm" },
  "\u70B9\u4E00\u4EF6\u4E50\u5668 \u2192 \u6311\u8C01\u6765\u6F14 \u2192 \u7528\u53F3\u8FB9\u7684\u952E\u76D8\u8BD5 \u2192 \u300C\u9009\u8FD9\u4E2A\u300D= \u6362\u4E0A\u3002\u76EE\u5F55\u4E0D\u5173\uFF0C\u653E\u7740\u6B4C\u4E5F\u80FD\u63A5\u7740\u6362\uFF1B\u56DE\u8C31\u70B9\u300C\u2190 \u8C31\u300D\u3002\u8C31\u4E0A\u7684\u540D\u5B57\u8DDF\u7740\u6362\u6210\u90A3\u4EF6\u4E50\u5668\u3002": { en: "Tap an instrument \u2192 pick who plays it \u2192 try it on the keyboard \u2192 \u201CUse this\u201D switches to it. The catalog stays open, so you can keep switching even while the song plays; tap \u201C\u2190 Score\u201D to go back. The name on the score follows the instrument." },
  "\u641C\u4E50\u5668\uFF08\u4E2D / \u82F1 / \u65E5\uFF09": { en: "Search instruments (zh / en / ja)" },
  "\u81EA\u5DF1\u7684 .sf2 \u6587\u4EF6\uFF1A\u9009\u4E2D\u7684\u90A3\u4E00\u4EF6\u5207\u51FA\u6765\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u91CC\u53EA\u8BB0\u6765\u6E90": { en: "Your own .sf2 file: the one you pick is cut out and kept on this device; the song only records where it came from" },
  "\u6253\u5F00 .sf2\u2026": { en: "Open .sf2\u2026" },
  "\u8DF3\u5230": { en: "Jump to" },
  "\u5217\u8868\u6EDA\u5230\u8FD9\u4E00\u7EC4": { en: "Scroll the list to this group" },
  "\u9690\u85CF\u627E\u4E0D\u5230\u7684": { en: "Hide unavailable" },
  "\u52A0\u8F7D\u76EE\u5F55\u2026": { en: "Loading the catalog\u2026" },
  "\u4E50\u5668\u76EE\u5F55\uFF08\u5F39\u7740\u73A9\uFF09": { en: "Instrument catalog (just for fun)" },
  "\u627E\u4EBA\u7ED9\u300C{p}\u300D": { en: "Finding someone for \u201C{p}\u201D" },
  "\u2190 \u6B4C\u5E93": { en: "\u2190 Library" },
  "\u70B9\u4E00\u4EF6\u4E50\u5668 \u2192 \u6311\u8C01\u6765\u6F14 \u2192 \u7528\u952E\u76D8\u5F39\u7740\u73A9\u3002\u8981\u7ED9\u6B4C\u91CC\u7684\u58F0\u90E8\u9009\u4E50\u5668\uFF1A\u5F00\u4E00\u9996\u6B4C\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u3002": { en: "Tap an instrument \u2192 choose who performs \u2192 play on the keys for fun. To choose an instrument for a part: open a song and tap the part name at the front of the score." },
  "\u76EE\u5F55\u52A0\u8F7D\u4E0D\u4E86\uFF1A{Error}": { en: "Can't load the catalog: {Error}" },
  "\u70B9\u4E0B\u9762\u4E00\u4EF6\u4E50\u5668\uFF0C\u6362\u8FDB\u8FD9\u4E00\u683C": { en: "Tap an instrument below to put it in this slot" },
  "\u70B9 = \u6362\u4E0A\u300C{name}\u300D\uFF1B\u957F\u6309\uFF08\u53F3\u952E\uFF09= \u6362\u6210\u522B\u7684 / \u62FF\u6389": { en: "Tap = switch to \u201C{name}\u201D; long-press (right-click) = replace / remove" },
  "\u590D\u5236\u4E00\u4EFD": { en: "Duplicate" },
  "\u62F7\u5230\u8FD9\u4E2A\u58F0\u90E8": { en: "Copy to this part" },
  "\u6362\u6210\u2026": { en: "Replace with\u2026" },
  "\u62FF\u6389": { en: "Remove" },
  "\u53D6\u6D88\u7F6E\u9876": { en: "Unpin" },
  "\u7F6E\u9876\u5230\u5E38\u7528": { en: "Pin to favorites" },
  "\u8FD9\u9996\u6B4C\u7684\u4E50\u5668\u9884\u8BBE": { en: "Instrument presets in this song" },
  "\u6B63\u5728\u53F0\u4E0A\uFF1B\u957F\u6309\uFF08\u53F3\u952E\uFF09= \u590D\u5236\u4E00\u4EFD": { en: "On stage now; long-press (right-click) = duplicate" },
  "\u70B9 = \u6362\u4E0A\uFF1B\u957F\u6309\uFF08\u53F3\u952E\uFF09= \u590D\u5236\u4E00\u4EFD / \u5220\u6389": { en: "Tap = use it; long-press (right-click) = duplicate / delete" },
  "\u70B9 = \u62F7\u4E00\u4EFD\u5230\u8FD9\u4E2A\u58F0\u90E8\u3001\u6362\u4E0A\uFF08\u300C{from}\u300D\u90A3\u8FB9\u4E0D\u52A8\uFF09": { en: "Tap = copy it to this part and use it (the one on \u201C{from}\u201D stays as it is)" },
  "\u5728 {from} \u4E0A": { en: "on {from}" },
  "\u5F00\u7740\uFF1A\u76EE\u5F55\u91CC\u6CA1\u6709\u8C01\u80FD\u6F14\uFF08\u8FDE\u5E73\u66FF\u4E5F\u6CA1\u6709\uFF09\u7684\u4E50\u5668\u4E0D\u5217\u51FA\u6765\uFF08\u8FD9\u4E00\u9875\u85CF\u4E86 {n} \u4EF6\uFF09\u3002\u70B9\u4E00\u4E0B = \u5168\u5217\u51FA\u6765": { en: "On: instruments nobody in the catalog can perform (not even a stand-in) are hidden ({n} hidden here). Tap to list everything" },
  "\u5173\u7740\uFF1A\u6240\u6709\u4E50\u5668\u90FD\u5217\u51FA\u6765\uFF0C\u6CA1\u6709\u8C01\u80FD\u6F14\u7684\u4E5F\u5728\u3002\u70B9\u4E00\u4E0B = \u85CF\u8D77\u6765": { en: "Off: every instrument is listed, including ones nobody can perform. Tap to hide them" },
  "{label} \xB7 {n} \u4EF6": { en: "{label} \xB7 {n}" },
  "\u6CA1\u6709\u53EB\u300C{q}\u300D\u7684\u80FD\u6F14\u7684\u4E50\u5668\uFF08\u85CF\u7740 {n} \u4EF6\u6CA1\u6709\u8C01\u80FD\u6F14\u7684\uFF1A\u5173\u6389\u300C\u9690\u85CF\u627E\u4E0D\u5230\u7684\u300D\u80FD\u770B\u5230\uFF09": { en: "No playable instrument named \u201C{q}\u201D ({n} with no performer are hidden \u2014 turn off \u201CHide unavailable\u201D to see them)" },
  "\u6CA1\u6709\u53EB\u300C{q}\u300D\u7684": { en: "Nothing named \u201C{q}\u201D" },
  "\u6536\u8D77\u8FD9\u4E00\u7EC4": { en: "Collapse this group" },
  "\u5C55\u5F00\u8FD9\u4E00\u7EC4\uFF08\u522B\u7684\u6536\u8D77\uFF09": { en: "Expand this group (others collapse)" },
  "\u9876\u66FF": { en: "Substitute" },
  "\u7528\u5B83\u653E\u8FD9\u6761\u58F0\u90E8\u7684\u5F00\u5934": { en: "Plays the start of this part with it" },
  "\u25B6 \u542C\u5F00\u5934": { en: "\u25B6 Hear the start" },
  "\u5148\u4E0D\u6362\uFF1A\u52A0\u4E00\u4E2A\u65B0\u58F0\u90E8\u653E\u5B83\uFF0C\u5F00\u300C\u5F39\u300D\u770B\u7740\u8C31\u5F39\u7740\u8BD5\uFF08\u53F0\u4E0A\u8FD9\u4F4D\u4E0D\u52A8\uFF09": { en: "Don't swap yet: add a new part with it and turn on Play to try it along with the score (the current performer stays)" },
  "\u52A0\u6210\u65B0\u58F0\u90E8\u8BD5\u8BD5": { en: "Try as a new part" },
  "\uFF0B \u58F0\u90E8": { en: "\uFF0B Part" },
  "\u9009\u5B83\u6765\u6F14\u8FD9\u4E2A\u58F0\u90E8\uFF08\u76EE\u5F55\u4E0D\u5173\uFF0C\u53EF\u4EE5\u63A5\u7740\u6362\uFF09": { en: "Use it for this part (the catalog stays open)" },
  "\u9009\u8FD9\u4E2A": { en: "Choose this" },
  "\u9F13\u7EC4": { en: "Drum kits" },
  "\u53D8\u4F53\uFF08bank {b}\uFF09": { en: "Variations (bank {b})" },
  "{name}\uFF08{n} \u4EF6\uFF09": { en: "{name} ({n} items)" },
  "\u6536\u8D77\u8FD9\u4E2A\u6587\u4EF6\uFF08\u5B57\u8282\u653E\u6389\uFF0C\u8981\u518D\u7528\u5C31\u91CD\u65B0\u6253\u5F00\uFF09": { en: "Close this file (its bytes are dropped; open it again to use it)" },
  "\u6536\u8D77\u8FD9\u4E2A\u6587\u4EF6": { en: "Close this file" },
  "\u9009\u7684\u90A3\u4E00\u4EF6\u5207\u51FA\u6765\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u91CC\u53EA\u8BB0\u6765\u6E90\uFF08\u6B4C\u5C0F\uFF09\u3002\u8981\u6B4C\u81EA\u5DF1\u5E26\u7740\u58F0\u97F3 = \u6587\u4EF6\u83DC\u5355\u300C\u5168\u90E8\u6253\u5305\u8FDB\u6B4C\u300D\uFF0C\u6216\u5BFC\u51FA\u300C\u6253\u5305\u97F3\u6E90\u300D\u7684\u526F\u672C\u3002": { en: "The one you choose is cut out and kept on this device; the song only records where it came from (keeps the song small). To make the song carry the sound itself: File menu \u2192 \u201CPack everything into the song\u201D, or save an .mxl copy (packed sounds)." },
  "\u5728\u8FD9\u79CD\u98CE\u91CC\u9876\u66FF\u300C{asName}\u300D": { en: "Substitutes for \u201C{asName}\u201D in this style" },
  "\u9876 {asName}": { en: "Subs for {asName}" },
  "\u7EA6 ": { en: "c. " },
  "\u5531\u6B4C\u8BCD\uFF1B\u6CA1\u5199\u6B4C\u8BCD\u7684\u97F3\u6309\u300C\u54FC\u7684\u5B57\u300D\u5531": { en: "Sings lyrics; notes without lyrics use the \u201CHum syllable\u201D" },
  "\u53EA\u54FC\u300C\u54FC\u7684\u5B57\u300D\u3001\u4E0D\u5531\u6B4C\u8BCD\uFF1B\u8F7B\uFF0C\u7834\u8BBE\u5907\u4E5F\u5E26\u5F97\u52A8": { en: "Only hums the hum syllable, no lyrics; light enough for older devices" },
  "\u9F13\u4EF6 \xB7 {gmName}\uFF08Standard \u9F13\u7EC4\u7684 {note} \u53F7\u952E\uFF09": { en: "Drum piece \xB7 {gmName} (key {note} of the Standard kit)" },
  "\u9F13\u7EC4 \xB7 {gmName}": { en: "Drum kit \xB7 {gmName}" },
  "\u9876\u66FF{p}{reason}": { en: "Substitute{p}{reason}" },
  "\uFF08GM \u539F\u6587\u8BA4\u53EF\uFF09": { en: " (GM original accepts it)" },
  "\uFF08\u524D\u8EAB\uFF09": { en: " (predecessor)" },
  "\uFF08\u4EFF\u58F0\uFF09": { en: " (imitation)" },
  "\uFF08\u540C\u7C7B\uFF09": { en: " (same type)" },
  "\uFF08\u53EA\u662F\u540C\u540D\uFF09": { en: " (same name only)" },
  "\u76EE\u5F55\u91CC\u8FD8\u6CA1\u6709\u8C01\u80FD\u6F14\u5B83": { en: "Nobody in the catalog can perform it yet" },
  "\u5408": { en: "Join" },
  "\u8FD9\u4E2A\u5B57\u5E76\u8FDB\u524D\u4E00\u4E2A\u97F3\uFF08\u4E00\u4E2A\u97F3\u4E0A\u51E0\u4E2A\u5B57\uFF09\uFF1B\u8FD9\u4E00\u53E5\u540E\u9762\u7684\u5B57\u5F80\u524D\u632A\u4E00\u4E2A\u97F3": { en: "Merges this syllable into the previous note (several syllables on one note); later syllables in this phrase shift forward one note" },
  "\u6324\u4E86\uFF1A\u6309\u8282\u594F\u6392\uFF0C\u8FD9\u4E2A\u5B57\u653E\u4E0D\u4E0B\uFF08\u7EB8\u7684\u8BBE\u7F6E\u91CC\u6362\u6210\u300C\u6309\u6B4C\u8BCD\u300D= \u628A\u97F3\u63A8\u5F00\uFF09": { en: "Crowded: laid out by rhythm, this syllable doesn't fit (in sheet settings, \u201CBy lyrics\u201D pushes notes apart)" },
  "\u65E0\u5347\u964D": { en: "No accidentals" },
  "\u6309\u8FD9\u4E2A\u901F\u5EA6\u6446\uFF1A\u6446\u5230\u4E00\u5934 = \u4E00\u62CD": { en: "Swinging at this tempo: one end of the swing = one beat" },
  "\u786E\u5B9A": { en: "OK" },
  "\u62E8\u901F\u5EA6\uFF1A\u4E00\u683C = 1\uFF0C\u4E00\u7529\u6ED1\u4E00\u5927\u6BB5": { en: "Dial the tempo: one notch = 1, a flick covers more" },
  "{from} \u8D77": { en: "from {from}" },
  "\u5F26\u4E50": { en: "Strings" },
  "\u94DC\u7BA1": { en: "Brass" },
  "\u6728\u7BA1": { en: "Woodwinds" },
  "\u5F39\u62E8": { en: "Plucked" },
  "\u6253\u51FB": { en: "Percussion" },
  "\u6709\u97F3\u9AD8\u6253\u51FB / \u94C3": { en: "Pitched percussion / bells" },
  "\u97F3\u6548 / \u5176\u4ED6": { en: "Sound effects / other" },
  "\u81EA\u52A8\u4F4E\u5207\uFF1A\u6309\u8FD9\u4E2A\u58F0\u90E8\u5168\u66F2\u6700\u4F4E\u7684\u97F3\u653E\u4F4E\u5207\u2014\u2014\u90A3\u4E2A\u97F3\u5F80\u4E0B\u5927\u4E09\u5EA6\uFF08\u7EA6 0.79 \u500D\uFF09\uFF0C\u5939\u5728 20\u2013300 Hz\uFF1B\u6DF7\u97F3\u8F68\u3001\u603B\u8F68\u6CA1\u6709\u97F3 = \u4E0D\u5207\u3002\u5207\u6389\u5B83\u7528\u4E0D\u7740\u7684\u4F4E\u9891\uFF08\u9686\u9686\u58F0\u3001\u548C\u522B\u7684\u8F68\u7CCA\u5728\u4E00\u8D77\u7684\u4F4E\u9891\uFF09\u3002\u5F00\u7740\u65F6\u4F4E\u5207\u9891\u7387\u8DDF\u7740\u8C31\u8D70\uFF1B\u5B58\u7684\u65F6\u5019\u628A\u8FD9\u4E00\u523B\u7B97\u51FA\u6765\u7684\u6570\u5199\u8FDB\u300C\u4F4E\u5207\u300D\u90A3\u4E00\u683C": { en: "Auto low cut: sets the low cut from this part's lowest note in the whole song \u2014 a major third below it (about 0.79\xD7), kept within 20\u2013300 Hz; bus and master tracks have no notes = no cut. Cuts lows it doesn't use (rumble, lows that muddy other tracks). While on, the low-cut frequency follows the score; saving writes the number computed at that moment into the \u201CLow cut\u201D field" },
  "\u4F4E\u5207\uFF1A\u8FD9\u4E2A\u9891\u7387\u4EE5\u4E0B\u7684\u90FD\u5207\u6389\u3002\u4EBA\u58F0\u5E38\u5728 80\u2013120 Hz\uFF0C\u94C3\u8FD9\u7C7B\u9AD8\u7684\u4E50\u5668\u53EF\u4EE5\u66F4\u9AD8\uFF1B\u6700\u5DE6 = \u5173": { en: "Low cut: removes everything below this frequency. Voices are often 80\u2013120 Hz; high instruments like bells can go higher; far left = off" },
  "\u9AD8\u5207\uFF1A\u8FD9\u4E2A\u9891\u7387\u4EE5\u4E0A\u7684\u90FD\u5207\u6389\uFF0C\u53BB\u523A\u8033\u3001\u5636\u5636\u58F0\uFF1B\u6700\u5DE6 = \u5173": { en: "High cut: removes everything above this frequency, for harshness and hiss; far left = off" },
  "\u4F4E\u67B6\uFF1A\u8F6C\u6298\u9891\u7387\u4EE5\u4E0B\u6574\u4F53\u52A0 / \u51CF\u591A\u5C11\u3002\u51CF = \u53BB\u95F7\u3001\u7ED9\u522B\u7684\u8F68\u8BA9\u51FA\u4F4E\u9891\uFF1B\u52A0 = \u52A0\u539A": { en: "Low shelf: boosts / cuts everything below the corner. Cut = less muddy, leaves lows for other tracks; boost = thicker" },
  "\u4F4E\u67B6\u7684\u8F6C\u6298\u9891\u7387\uFF1A\u4ECE\u8FD9\u91CC\u5F80\u4E0B\u7B97\u300C\u4F4E\u300D": { en: "Low shelf corner: \u201Clow\u201D counts down from here" },
  "\u4E2D\u5CF0\uFF1A\u5728\u4E00\u4E2A\u9891\u6BB5\u4E0A\u63A8 / \u6316\u591A\u5C11\u3002\u4E24\u6837\u4E1C\u897F\u7CCA\u5728\u4E00\u8D77\u65F6\uFF0C\u5728\u5176\u4E2D\u4E00\u4E2A\u4E0A\u6316\u4E00\u5200\u7ED9\u53E6\u4E00\u4E2A\u8BA9\u4F4D": { en: "Mid peak: boosts / cuts one band. When two things blur together, cut one to make room for the other" },
  "\u4E2D\u5CF0\u7684\u4E2D\u5FC3\u9891\u7387\uFF1A\u63A8 / \u6316\u7684\u662F\u54EA\u4E00\u6BB5": { en: "Mid peak center: which band is boosted / cut" },
  "\u4E2D\u5CF0\u7684\u5BBD\u7A84\uFF1AQ \u8D8A\u5927\u8D8A\u7A84\uFF081 \u2248 \u4E00\u4E2A\u591A\u516B\u5EA6\u5BBD\uFF0C4 \u2248 \u5C0F\u534A\u4E2A\u516B\u5EA6\uFF09": { en: "Mid peak width: higher Q is narrower (1 \u2248 a bit over an octave, 4 \u2248 under half an octave)" },
  "\u9AD8\u67B6\uFF1A\u8F6C\u6298\u9891\u7387\u4EE5\u4E0A\u6574\u4F53\u52A0 / \u51CF\u591A\u5C11\u3002\u52A0 = \u4EAE\u3001\u51CF = \u6697": { en: "High shelf: boosts / cuts everything above the corner. Boost = brighter, cut = darker" },
  "\u9AD8\u67B6\u7684\u8F6C\u6298\u9891\u7387\uFF1A\u4ECE\u8FD9\u91CC\u5F80\u4E0A\u7B97\u300C\u9AD8\u300D": { en: "High shelf corner: \u201Chigh\u201D counts up from here" },
  "\u9608\u503C\uFF1A\u58F0\u97F3\u8D85\u8FC7\u8FD9\u4E2A\u7535\u5E73\u624D\u5F00\u59CB\u538B\uFF1B\u8D8A\u4F4E\uFF0C\u538B\u5230\u7684\u8D8A\u591A": { en: "Threshold: compression starts above this level; lower compresses more" },
  "\u6BD4\u4F8B\uFF1A\u8D85\u8FC7\u9608\u503C\u7684\u90E8\u5206\u538B\u6210\u51E0\u5206\u4E4B\u4E00\uFF084:1 = \u8D85\u51FA 4 dB \u7684\u53EA\u5269 1 dB\uFF09": { en: "Ratio: how much the part above the threshold is reduced (4:1 = 4 dB over becomes 1 dB)" },
  "\u8D77\u538B\uFF1A\u8D85\u8FC7\u9608\u503C\u4E4B\u540E\u591A\u5FEB\u538B\u4E0B\u53BB\u3002\u77ED = \u8FDE\u5B57\u5934\u4E00\u8D77\u538B\u5E73\uFF1B\u957F = \u8BA9\u5B57\u5934\u5148\u51B2\u51FA\u6765\u3001\u66F4\u6709\u52B2": { en: "Attack: how fast it compresses after crossing the threshold. Short = flattens word onsets too; long = lets onsets punch through" },
  "\u653E\u5F00\uFF1A\u58F0\u97F3\u843D\u56DE\u9608\u503C\u4EE5\u4E0B\u4E4B\u540E\u591A\u5FEB\u677E\u5F00\u3002\u592A\u77ED\u4F1A\u4E00\u62BD\u4E00\u62BD\u7684\uFF0C\u592A\u957F\u4E0B\u4E00\u4E2A\u5B57\u4E5F\u88AB\u538B\u7740": { en: "Release: how fast it lets go after falling below the threshold. Too short pumps; too long keeps the next word compressed too" },
  "\u62D0\u70B9\uFF1A\u9608\u503C\u9644\u8FD1\u8FD9\u4E48\u5BBD\u7684\u4E00\u6BB5\u91CC\u6162\u6162\u5F00\u59CB\u538B\uFF08\u8F6F\uFF09\uFF1B0 = \u4E00\u5230\u9608\u503C\u5C31\u538B\uFF08\u786C\uFF09": { en: "Knee: compression eases in over this width around the threshold (soft); 0 = kicks in right at the threshold (hard)" },
  "\u8865\u507F\uFF1A\u538B\u5B8C\u6574\u4F53\u52A0\u56DE\u6765\u591A\u5C11\uFF08\u538B\u7F29\u4F1A\u8BA9\u6574\u4F53\u53D8\u8F7B\uFF09": { en: "Makeup: how much to add back after compressing (compression makes things quieter overall)" },
  "\u6DF7\u54CD\u65F6\u95F4\uFF08RT60\uFF09\uFF1A\u58F0\u97F3\u505C\u4E86\u4E4B\u540E\uFF0C\u5C3E\u5DF4\u8870\u51CF 60 dB \u8981\u591A\u4E45\u3002\u5C0F\u623F\u95F4\u4E0D\u5230 1 \u79D2\uFF0C\u5927\u5385 2\u20133 \u79D2\uFF0C\u6559\u5802\u66F4\u957F": { en: "Reverb time (RT60): how long the tail takes to fall 60 dB after the sound stops. Small rooms under 1 s, halls 2\u20133 s, churches longer" },
  "\u9AD8\u9891\u4ECE\u8FD9\u91CC\u5F00\u59CB\u8870\u51CF\uFF1A\u771F\u5B9E\u7684\u623F\u95F4\u91CC\u9AD8\u9891\u88AB\u5438\u6536\u5F97\u5FEB\uFF0C\u5C3E\u5DF4\u8D8A\u5F80\u540E\u8D8A\u6697\uFF1B\u6570\u8D8A\u4F4E\u8D8A\u6697": { en: "Highs start fading from here: real rooms absorb highs fast, so the tail gets darker; lower is darker" },
  "\u6E7F\uFF1A\u6DF7\u54CD\u7684\u58F0\u97F3\u6709\u591A\u54CD": { en: "Wet: how loud the reverb is" },
  "\u539F\u58F0\uFF1A\u539F\u6765\u7684\u58F0\u97F3\u7559\u591A\u5C11\u3002\u63D2\u5728\u58F0\u90E8\u8F68\u4E0A\u4E00\u822C 0 dB\uFF08\u4E0D\u52A8\uFF09\uFF1B\u5F53\u53D1\u9001\u7684\u8FD4\u56DE\u8F68\u7528 = \u5173": { en: "Dry: how much of the original to keep. Usually 0 dB (untouched) on a part's track; off on a send's return track" },
  "\u9884\u5EF6\u8FDF\uFF1A\u539F\u58F0\u4E4B\u540E\u8FC7\u591A\u4E45\u6DF7\u54CD\u624D\u8FDB\u6765\u3002\u62C9\u5F00\u4E00\u70B9\uFF0C\u4EBA\u58F0\u66F4\u6E05\u695A\u3001\u4E0D\u88AB\u7CCA\u4F4F": { en: "Pre-delay: how long after the dry sound the reverb comes in. A little keeps voices clear and not smeared" },
  "\u5BBD\u5EA6\uFF1A\u6DF7\u54CD\u5728\u5DE6\u53F3\u94FA\u591A\u5F00": { en: "Width: how far the reverb spreads left and right" },
  "\u8DDF\u901F\u5EA6\uFF1A\u56DE\u58F0\u9694\u51E0\u62CD\u3002\u65F6\u95F4 = \u51E0\u62CD \xD7 60000 \xF7 \u6B4C\u5F00\u5934\u7684\u901F\u5EA6\uFF08\u6BEB\u79D2\uFF0C\u6700\u591A 2000\uFF09\uFF1B0 = \u7528\u4E0B\u9762\u7684\u6BEB\u79D2\u3002\u5F00\u7740\u65F6\u65F6\u95F4\u8DDF\u7740\u8C31\u8D70\uFF1B\u5B58\u7684\u65F6\u5019\u628A\u8FD9\u4E00\u523B\u7B97\u51FA\u6765\u7684\u6BEB\u79D2\u5199\u8FDB\u300C\u65F6\u95F4\u300D\u90A3\u4E00\u683C": { en: "Follow tempo: echoes this many beats apart. Time = beats \xD7 60000 \xF7 the song's opening tempo (ms, at most 2000); 0 = use the milliseconds below. While on, the time follows the score; saving writes the milliseconds computed at that moment into the \u201CTime\u201D field" },
  "\u65F6\u95F4\uFF1A\u6BCF\u6B21\u56DE\u58F0\u9694\u591A\u4E45": { en: "Time: the gap between echoes" },
  "\u6BCF\u6B21\u56DE\u58F0\uFF1A\u6BCF\u91CD\u590D\u4E00\u6B21\u8F7B\u591A\u5C11 dB\uFF1B\u8D8A\u63A5\u8FD1 0\uFF0C\u56DE\u58F0\u8D8A\u4E45": { en: "Each echo: how many dB softer per repeat; closer to 0 lasts longer" },
  "\u6E7F\uFF1A\u56DE\u58F0\u6709\u591A\u54CD": { en: "Wet: how loud the echoes are" },
  "\u53CD\u9988\u9AD8\u5207\uFF1A\u6BCF\u6B21\u56DE\u58F0\u90FD\u628A\u8FD9\u4E2A\u9891\u7387\u4EE5\u4E0A\u7684\u524A\u6389\u4E00\u70B9\uFF0C\u8D8A\u5F80\u540E\u8D8A\u6697\uFF08\u50CF\u771F\u7684\u56DE\u58F0\uFF09": { en: "Feedback high cut: each echo loses a bit above this frequency, getting darker over time (like real echoes)" },
  "\u51E0\u6761\uFF1A\u540C\u65F6\u6709\u51E0\u4E2A\u7A0D\u5FAE\u9519\u5F00\u7684\u526F\u672C": { en: "Voices: how many slightly offset copies at once" },
  "\u5EF6\u8FDF\uFF1A\u526F\u672C\u6BD4\u539F\u58F0\u665A\u591A\u5C11": { en: "Delay: how much later the copies are than the dry sound" },
  "\u6296\u52A8\u6DF1\u5EA6\uFF1A\u526F\u672C\u7684\u5EF6\u8FDF\u6765\u56DE\u6643\u591A\u5927\u2014\u2014\u6643 = \u97F3\u9AD8\u8F7B\u5FAE\u8D77\u4F0F\uFF0C\u50CF\u597D\u51E0\u4E2A\u4EBA\u5531\u4E0D\u9F50": { en: "Depth: how far each copy's delay wobbles \u2014 wobble = slight pitch movement, like several people not quite together" },
  "\u6296\u52A8\u5FEB\u6162\uFF1A\u6BCF\u79D2\u6643\u51E0\u6B21": { en: "Rate: wobbles per second" },
  "\u5DE6\u53F3\u94FA\u5F00\uFF1A\u526F\u672C\u6446\u5F97\u591A\u5F00": { en: "Spread: how wide the copies are placed" },
  "\u6E7F\uFF1A\u526F\u672C\u6709\u591A\u54CD": { en: "Wet: how loud the copies are" },
  "\u589E\u76CA\uFF1A\u5355\u7EAF\u8C03\u5927\u8C03\u5C0F\uFF08\u524D\u9762\u7684\u63D2\u4EF6\u628A\u97F3\u91CF\u6539\u4E86\uFF0C\u7528\u5B83\u8865\u56DE\u6765\uFF09": { en: "Gain: plain louder / softer (to make up for level changed by earlier plugins)" },
  "\u6DF7\u54CD\u65F6\u95F4\uFF08RT60\uFF09": { en: "Reverb time (RT60)" },
  "\u9AD8\u9891\u4ECE\u8FD9\u91CC\u5F00\u59CB\u8870\u51CF": { en: "Highs fade from here" },
  "\u4E0D\u8870\u51CF\uFF0820 kHz \u4EE5\u4E0A\uFF09": { en: "No fade (above 20 kHz)" },
  "\u6E7F\uFF08\u6548\u679C\uFF09": { en: "Wet (effect)" },
  "\u6BCF\u6B21\u56DE\u58F0": { en: "Each echo" },
  "{v} dB / \u6B21": { en: "{v} dB / echo" },
  "\u5BBD\u5EA6\uFF080 = \u5355\u58F0\u9053\uFF0C100% = \u5DE6\u53F3\u94FA\u6EE1\uFF09": { en: "Width (0 = mono, 100% = full stereo)" },
  "\u5DE6\u53F3\u94FA\u5F00\uFF080 = \u90FD\u5728\u4E2D\u95F4\uFF0C100% = \u94FA\u5230\u4E24\u8FB9\uFF09": { en: "Spread (0 = all center, 100% = full width)" },
  "{v} \u6761": { en: "{v} {v|voice|voices}" },
  "\u5207\u6389\u8FD9\u4E2A\u58F0\u90E8\u7528\u4E0D\u7740\u7684\u4F4E\u9891\uFF1A\u4F4E\u5207\u653E\u5728\u5B83\u6700\u4F4E\u7684\u97F3\u5F80\u4E0B\u4E00\u70B9": { en: "Removes lows this part doesn't use: the low cut sits a bit below its lowest note" },
  "\u539A \u2194 \u4EAE": { en: "Warm \u2194 Bright" },
  "\u5F80\u5DE6 = \u539A\uFF08\u4F4E\u7684\u591A\u4E00\u70B9\u3001\u9AD8\u7684\u5C11\u4E00\u70B9\uFF09\uFF0C\u5F80\u53F3 = \u4EAE\uFF1B\u4E2D\u95F4 = \u4E0D\u52A8": { en: "Left = warmer (more lows, fewer highs), right = brighter; center = unchanged" },
  "\u5E73": { en: "Flat" },
  "\u539A {p} dB": { en: "Warm {p} dB" },
  "\u4EAE {p} dB": { en: "Bright {p} dB" },
  "\u8BA9\u591A\u5C11": { en: "Duck by" },
  "\u538B\u591A\u5C11": { en: "Compress by" },
  "\u88AB\u90A3\u6761\u8F68\u538B\uFF1A\u5B83\u4E00\u54CD\uFF0C\u8FD9\u6761\u5C31\u8BA9\u51FA\u6765\uFF1B\u5F80\u53F3 = \u8BA9\u5F97\u8D8A\u591A\uFF08\u4E0D\u8865\u507F\uFF1A\u5B83\u4E0D\u54CD\u7684\u65F6\u5019\u8FD9\u6761\u7167\u63A8\u5B50\u7684\u97F3\u91CF\uFF09": { en: "Compressed by that track: when it sounds, this one makes way; right = makes way more (no makeup: when it's silent this one sits at the fader level)" },
  "\u628A\u5FFD\u5927\u5FFD\u5C0F\u62C9\u5E73\uFF1A\u5F80\u53F3 = \u538B\u5F97\u8D8A\u72E0\uFF08\u54CD\u7684\u5B57\u538B\u4E0B\u6765\u3001\u8F7B\u7684\u76F8\u5BF9\u663E\u51FA\u6765\uFF09": { en: "Evens out loud and soft: right = harder (loud syllables come down, soft ones stand out more)" },
  "{thresholdDb} dB \u8D77\u538B \xB7 {ratio}:1": { en: "Compresses from {thresholdDb} dB \xB7 {ratio}:1" },
  "\u8FDC\u8FD1": { en: "Distance" },
  "\u5F80\u53F3 = \u8D8A\u8FDC\u3001\u8D8A\u5927\u7684\u623F\u95F4\uFF08\u94C3\u53EF\u4EE5\u8FDC\u4E00\u70B9\uFF0C\u8D34\u8033\u7684\u4EBA\u58F0\u8FD1\u4E00\u70B9\uFF09\uFF1B\u539F\u58F0\u4E0D\u52A8\uFF0C\u53EA\u5F80\u4E0A\u52A0\u6DF7\u54CD": { en: "Right = farther, in a bigger room (bells can be distant, close vocals near); the dry sound stays, reverb is only added on top" },
  "\u6E7F {mix} \xB7 {room} s": { en: "Wet {mix} \xB7 {room} s" },
  "\u56DE\u58F0\u591A\u5C11": { en: "Echo amount" },
  "\u5F80\u53F3 = \u56DE\u58F0\u8D8A\u54CD\u3001\u8D8A\u4E45\uFF1B\u539F\u58F0\u4E0D\u52A8": { en: "Right = louder, longer echoes; the dry sound stays" },
  "\u6E7F {mix} \xB7 \u6BCF\u6B21 {feedback} dB": { en: "Wet {mix} \xB7 each {feedback} dB" },
  "\u51E0\u62CD\u4E00\u6B21": { en: "Beats per echo" },
  "\u56DE\u58F0\u548C\u62CD\u5B50\u5BF9\u9F50\uFF08\u8DDF\u7740\u6B4C\u7684\u901F\u5EA6\uFF09": { en: "Aligns echoes with the beat (follows the song's tempo)" },
  "\u9644\u70B9\u516B\u5206": { en: "Dotted eighth" },
  "\u5BBD": { en: "Wide" },
  "\u5F80\u53F3 = \u8D8A\u5BBD\u3001\u8D8A\u50CF\u597D\u51E0\u4E2A\u4EBA\uFF1B\u539F\u58F0\u4E0D\u52A8": { en: "Right = wider, more like several people; the dry sound stays" },
  "\u6E7F {mix} \xB7 \u6296\u52A8 {depthMs} ms": { en: "Wet {mix} \xB7 depth {depthMs} ms" },
  "\u63D2\u4EF6\u94FE\u4E2D\u95F4\u5355\u7EAF\u8C03\u5927\u8C03\u5C0F\uFF08\u524D\u9762\u7684\u63D2\u4EF6\u628A\u97F3\u91CF\u6539\u4E86\uFF0C\u7528\u5B83\u8865\u56DE\u6765\uFF09": { en: "Plain louder / softer inside the plugin chain (to make up for level changed by earlier plugins)" },
  "\u6DF7\u54CD\u65F6\u95F4": { en: "Reverb time" },
  "\u5C3E\u5DF4\u8870\u51CF 60 dB \u8981\u591A\u4E45\uFF08RT60\uFF09\uFF1A\u5F80\u53F3 = \u8D8A\u5927\u7684\u623F\u95F4\uFF08\u53D1\u591A\u5C11\u7531\u53D1\u9001\u90A3\u8FB9\u7684\u65CB\u94AE\u7BA1\uFF09": { en: "How long the tail takes to fall 60 dB (RT60): right = bigger room (how much is sent is set on the send knob)" },
  "\u56DE\u58F0\u591A\u957F": { en: "Echo length" },
  "\u5F80\u53F3 = \u56DE\u58F0\u91CD\u590D\u5F97\u8D8A\u4E45\uFF08\u53D1\u591A\u5C11\u7531\u53D1\u9001\u90A3\u8FB9\u7684\u65CB\u94AE\u7BA1\uFF09": { en: "Right = echoes repeat longer (how much is sent is set on the send knob)" },
  "\u6BCF\u6B21 {e} dB": { en: "Each {e} dB" },
  "\u5F80\u53F3 = \u8D8A\u5BBD\u3001\u8D8A\u50CF\u597D\u51E0\u4E2A\u4EBA\uFF08\u53D1\u591A\u5C11\u7531\u53D1\u9001\u90A3\u8FB9\u7684\u65CB\u94AE\u7BA1\uFF09": { en: "Right = wider, more like several people (how much is sent is set on the send knob)" },
  "\u6296\u52A8 {w} ms": { en: "Depth {w} ms" },
  "{name}\uFF08\u5173\uFF09": { en: "{name} (off)" },
  "{name}\uFF08\u5168\u91CF\uFF09": { en: "{name} (full)" },
  " \u4F4E\u5207": { en: " low cut" },
  "\uFF08\u5E73\uFF09": { en: " (flat)" },
  " \u539A": { en: " warm" },
  " \u4EAE": { en: " bright" },
  "\u8C31\u79CD\u548C\u7EB8\uFF1A{paperLabel}": { en: "Notation and paper: {paperLabel}" },
  "\u8FD9\u9996\u6B4C\uFF1A\u540D\u5B57\u3001\u4F5C\u8005\u548C\u8BB8\u53EF\u3001\u5C01\u9762\u3001\u58F0\u97F3\u3001\u7F72\u540D": { en: "This song: name, author and license, cover, sound, credits" },
  "\u8FD9\u4E00\u6BB5\u7684\u83DC\u5355": { en: "This section's menu" },
  "\u9690\u85CF {n}": { en: "{n} hidden" },
  "\u8FD9\u4E00\u6BB5\u6709 {n} \u4F4D\u9690\u85CF\u7740\uFF08\u4E0D\u6392\u3001\u4E0D\u5360\u5730\u65B9\uFF09\uFF1A\u70B9\u5F00\u770B\u662F\u8C01\u3001\u653E\u51FA\u6765": { en: "{n} {n|part is|parts are} hidden in this section (not laid out, no space taken): tap to see who and show them" },
  "\u4E0A\u4E00\u6BB5": { en: "Previous section" },
  "\u4E0B\u4E00\u6BB5": { en: "Next section" },
  "\u53EA\u770B\u672C\u6BB5\uFF08\u518D\u70B9 = \u770B\u5168\u90E8\u66F2\u6BB5\uFF09": { en: "Show only this section (tap again = all sections)" },
  "\u53EA\u770B\u672C\u6BB5": { en: "Show only this section" },
  "\u66F2\u6BB5\u540D": { en: "Section name" },
  "\u8FD9\u4E00\u6BB5\u9690\u85CF\u7740\uFF1A\u4E0D\u653E\u3001\u4E0D\u5370\uFF08\u300C\u22EF\u300D\u91CC\u80FD\u653E\u51FA\u6765\uFF09": { en: "This section is hidden: not played, not printed (unhide it from \u201C\u22EF\u201D)" },
  "\uFF08\u8FD9\u5F20\u7EB8\u4E0A\u6CA1\u6709\u58F0\u90E8\uFF09": { en: "(no parts on this sheet)" },
  "\uFF0B \u65B0\u66F2\u6BB5": { en: "\uFF0B New section" },
  "\u4F5C\u8005": { en: "Author" },
  "\u4E0D\u5199 = \u6BCF\u5F20\u7EB8\u6309\u987A\u5E8F\u5404\u653E\u4E00\u904D\uFF08\u4F8B\uFF1A\u524D\u594F (A A1)\xD73 A A2 [\u526F\u6B4C]\uFF09": { en: "Empty = each sheet plays once in order (e.g. Intro (A A1)\xD73 A A2 [Chorus])" },
  "\u5C0F\u8C03\uFF1A\u548C\u5F26\u7EA7\u6570\u4ECE la \u6570\u3002\u70B9 = \u8C31\u53F7 / \u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6": { en: "Minor: chord degrees count from la. Tap = clef / key / time / tempo" },
  "\u8FD9\u91CC\u662F C \u8C03\uFF08\u6CA1\u6709\u5347\u964D\u53F7\uFF09\uFF1A\u70B9 = \u8C31\u53F7 / \u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6": { en: "C major here (no sharps or flats): tap = clef / key / time / tempo" },
  "\u6709 {n} \u6BB5\u9690\u85CF\u7740\uFF08\u4E0D\u653E\u3001\u4E0D\u5370\u3001\u4E0D\u5360\u5730\u65B9\uFF09\uFF1A\u70B9\u5F00\u53BB\u770B\u6216\u653E\u51FA\u6765": { en: "{n} hidden {n|section|sections} (not played, not printed, no space taken): open to go to one or unhide it" },
  "\u6709\u4E00\u7EC4\u58F0\u90E8\u6BD4\u4E00\u9875\u80FD\u653E\u7684\u8FD8\u9AD8\uFF0C\u5728\u884C\u548C\u884C\u4E4B\u95F4\u65AD\u5F00\u3001\u63A5\u5230\u4E86\u4E0B\u4E00\u9875\uFF08\u4E0D\u7F29\u5C0F\u3001\u4E0D\u6362\u7EB8\uFF09\uFF1A\u70B9\u5F00\u9875\u9762\u8BBE\u7F6E\u7684\u300C\u7248\u9762\u300D\u9875": { en: "A group of parts is taller than a page can hold, so it breaks between staves and continues on the next page (nothing is shrunk, the paper is not changed): tap to open Page settings \u203A Page" },
  "\u6F14\u594F\u6CD5\u548C\u8868\u60C5\u73B0\u5728\u4E0D\u663E\u793A\uFF08\u9875\u9762\u8BBE\u7F6E\u300C\u770B\u8C31\u300D\u91CC\u5173\u7740\uFF1B\u64AD\u653E\u7167\u5199\u7684\u6765\uFF09\uFF1A\u70B9\u5F00\u53BB\u6253\u5F00": { en: "Articulations & dynamics are hidden right now (turned off under Page settings \u203A Reading; playback follows what's written): tap to change" },
  "\u8FD9\u4E00\u5BB6\u5C55\u5F00\u7740\uFF1A\u70B9 = \u53E0\u56DE\u53BB\uFF08\u5149\u6807\u632A\u5230\u4E0B\u4E00\u4F4D\uFF09": { en: "This family is spread out: tap = fold it back (the cursor moves to the next part)" },
  "\u73B0\u5728\u7684\u7F29\u653E\uFF08100% = \u7EB8\u7684\u5B9E\u9645\u5C3A\u5BF8\uFF09\uFF1B\u70B9 = \u56DE\u5230\u81EA\u52A8\u5927\u5C0F\uFF08Ctrl / \u2318 + 0\uFF09\u3002Ctrl / \u2318 + \u6EDA\u8F6E\u3001\u634F\u5408 = \u7F29\u653E\uFF1BCtrl / \u2318 + = / \u2212 = \u4E00\u6863\u4E00\u6863": { en: "Current zoom (100% = the paper's real size); tap = back to auto size (Ctrl / \u2318 + 0). Ctrl / \u2318 + wheel or pinch = zoom; Ctrl / \u2318 + = / \u2212 = step by step" },
  "\u8D77\u70B9\uFF1A|\u25B6 \u4ECE\u8FD9\u513F\u653E\uFF08\u957F\u6309 / \u53F3\u952E\u7A7A\u767D\u5904\u300C\u4ECE\u8FD9\u513F\u653E\u300D\u632A\u5B83\uFF1B\u7F16\u8F91\u4E0D\u52A8\u5B83\uFF09": { en: "Start point: |\u25B6 plays from here (long-press / right-click blank space, \u201CPlay from here\u201D, to move it; editing doesn't move it)" },
  "\u8FD9\u5F20\u7EB8\u4E0A\u53EA\u6709\u8FD9\u4E00\u5BB6\uFF1A\u6CA1\u6709\u522B\u7684\u58F0\u90E8\u53EF\u4EE5\u632A\u8FC7\u53BB\uFF08\u5207\u5230\u300C\u542C\u300D\u5C31\u90FD\u53E0\u8D77\u6765\uFF09": { en: "This sheet only has this family: no other part to move to (switch to \u201CListen\u201D and they all stack)" },
  "\u540E\u9762\u6CA1\u6709\u7A7A\u7740\u7684\u97F3\u4E86\uFF0C\u5B57\u53EA\u80FD\u632A\u5230\u8FD9\u513F": { en: "No empty notes after this one, so the syllable can only move this far" },
  "\u524D\u9762\u9694\u7740\u53E5\u53F7\uFF08\u6216\u8005\u6CA1\u6709\u97F3\u4E86\uFF09\uFF0C\u5B57\u632A\u4E0D\u8FC7\u53BB": { en: "A phrase end is in the way (or no more notes), so the syllable can't move there" },
  "\u5F3A\u540E\u5F31": { en: "fp" },
  "\u5F80\u4E0A\u4E00\u7EA7\uFF08\u8C03\u5185\uFF09": { en: "Up a scale step" },
  "\u5F80\u4E0B\u4E00\u7EA7\uFF08\u8C03\u5185\uFF09": { en: "Down a scale step" },
  "\u5347\u534A\u97F3": { en: "Up a semitone" },
  "\u964D\u534A\u97F3": { en: "Down a semitone" },
  "\u9AD8\u516B\u5EA6": { en: "Up an octave" },
  "\u4F4E\u516B\u5EA6": { en: "Down an octave" },
  "\u65F6\u503C\u51CF\u534A": { en: "Halve durations" },
  "\u65F6\u503C\u52A0\u500D": { en: "Double durations" },
  "\u9644\u70B9": { en: "Dot" },
  "\u52A0\u9644\u70B9\uFF08\u90FD\u6709\u9644\u70B9 = \u53BB\u6389\uFF09": { en: "Add a dot (all dotted = removes them)" },
  "{sel} \u4E2A": { en: "{sel} selected" },
  "\u64CD\u4F5C\u2026": { en: "Actions\u2026" },
  "\u7C98\u8D34\u5230\u5149\u6807\u5904": { en: "Paste at the cursor" },
  "\u57FA\u7840": { en: "Basics" },
  "\u589E\u76CA\u3001\u58F0\u50CF\u3001\u9759\u97F3 / \u72EC\u594F\uFF1A\u5148\u628A\u51E0\u6761\u8F68\u7684\u97F3\u91CF\u6446\u5E73\u3001\u5DE6\u53F3\u6446\u5F00\uFF08\u6DF7\u97F3\u7684\u7B2C\u4E00\u6B65\uFF09": { en: "Gain, pan, mute / solo: first balance the tracks' levels and spread them left and right (step one of mixing)" },
  "\u6BCF\u6761\u8F68\u7684\u9ED8\u8BA4 EQ\uFF1A\u4E24\u6837\u4E1C\u897F\u7CCA\u5728\u4E00\u8D77\u3001\u592A\u95F7 / \u592A\u523A": { en: "Each track's default EQ: for two things blurring together, too muddy / too harsh" },
  "\u6BCF\u6761\u8F68\u4E0A\u7684\u7B2C\u4E00\u4E2A\u538B\u7F29\uFF1A\u628A\u5FFD\u5927\u5FFD\u5C0F\u62C9\u5E73": { en: "The first compressor on each track: evens out loud and soft" },
  "\u53D1\u9001": { en: "Sends" },
  "\u51FA\u5230\u54EA\u3001\u63A8\u5B50\u540E\u53D1\u7ED9\u54EA\u51E0\u6761\u6DF7\u97F3\u8F68\uFF08\u6DF7\u54CD / \u5EF6\u8FDF\u653E\u5728\u6DF7\u97F3\u8F68\u4E0A\uFF0C\u51E0\u6761\u8F68\u5171\u7528\uFF09": { en: "Where it outputs, and which buses it sends to post-fader (reverb / delay live on a bus, shared by several tracks)" },
  "\u94FE": { en: "Chain" },
  "\u6BCF\u6761\u8F68\u4E0A\u7684\u5168\u90E8\u63D2\u4EF6\u683C\uFF1A\u968F\u4FBF\u63D2\u3001\u5F00\u5173\u3001\u62FF\u6389": { en: "All plugin slots on each track: insert anything, toggle, remove" },
  "\u589E\u76CA\uFF08\u63A8\u5B50\uFF09\uFF1A\u8FD9\u6761\u8F68\u6574\u4F53\u7684\u97F3\u91CF\u3002\u6DF7\u97F3\u7684\u7B2C\u4E00\u6B65 = \u5148\u628A\u51E0\u6761\u8F68\u7684\u97F3\u91CF\u6446\u5E73": { en: "Gain (fader): this track's overall volume. Step one of mixing = balance the tracks' levels first" },
  "\u58F0\u50CF\uFF1A\u5728\u5DE6\u53F3\u54EA\u4E2A\u4F4D\u7F6E\u3002\u51E0\u6761\u8F68\u5DE6\u53F3\u9519\u5F00\u4E00\u70B9\uFF0C\u5C31\u4E0D\u4F1A\u90FD\u6324\u5728\u6B63\u4E2D\u95F4\u3002\u6570\u5B57 = \u5F80\u4E00\u8FB9\u63A8\u4E86\u591A\u5C11\uFF08\u7B49\u529F\u7387\uFF1A\u600E\u4E48\u6446\u603B\u54CD\u5EA6\u4E0D\u53D8\uFF09\uFF1A\u4E2D = \u4E24\u4E2A\u5587\u53ED\u5404 \u22123 dB\uFF1B50 = \u8FD9\u8FB9 \u22120.7 dB\u3001\u90A3\u8FB9 \u22128.3 dB\uFF08\u5DEE 7.7 dB\uFF09\uFF1B100 = \u5168\u5728\u8FD9\u8FB9\uFF0C\u53E6\u4E00\u8FB9\u6CA1\u58F0": { en: "Pan: where it sits between left and right. Spread tracks a little so they don't all crowd the center. The number = how far it's pushed to one side (equal power: total loudness stays the same): center = \u22123 dB on each speaker; 50 = this side \u22120.7 dB, that side \u22128.3 dB (7.7 dB apart); 100 = all on this side, nothing on the other" },
  "\u603B\u8F68\u589E\u76CA\uFF1A\u6240\u6709\u8F68\u6DF7\u5728\u4E00\u8D77\u4E4B\u540E\u6574\u4F53\u518D\u8C03\u5927\u8C03\u5C0F": { en: "Master gain: overall louder / softer after all tracks are mixed" },
  "\u51FA\u5230\uFF1A\u8FD9\u6761\u8F68\u7684\u58F0\u97F3\u6700\u540E\u53BB\u54EA\u2014\u2014\u76F4\u63A5\u53BB\u603B\u8F68\uFF0C\u6216\u8005\u5148\u8FDB\u4E00\u6761\u6DF7\u97F3\u8F68\uFF08\u5728\u90A3\u91CC\u4E00\u8D77\u8FC7\u6548\u679C\uFF09": { en: "Output to: where this track's sound finally goes \u2014 straight to master, or into a bus first (to share effects there)" },
  "\u53D1\u9001\uFF1A\u63A8\u5B50\u4E4B\u540E\u518D\u590D\u5236\u4E00\u4EFD\u7ED9\u8FD9\u6761\u6DF7\u97F3\u8F68\u2014\u2014\u8DDF\u7740\u8FD9\u6761\u8F68\u7684\u589E\u76CA\u548C\u58F0\u50CF\u8D70\uFF1A\u63A8\u5B50\u62C9\u4F4E 3 dB\uFF0C\u53D1\u8FC7\u53BB\u7684\u4E5F\u4F4E 3 dB\uFF08\u539F\u58F0\u548C\u6548\u679C\u7684\u6BD4\u4F8B\u4E0D\u53D8\uFF09\uFF1B\u9759\u97F3\u4E86\u5C31\u4E0D\u53D1\u3002\u8FD9\u91CC\u7684\u6570 = \u8FD9\u4E00\u4F4D\u8FDB\u90A3\u8FB9\u7684\u91CF\uFF0C\u8D8A\u5927\u90A3\u8FB9\u7684\u6548\u679C\uFF08\u6DF7\u54CD / \u5EF6\u8FDF\uFF09\u8D8A\u591A\uFF1B\u539F\u58F0\u7167\u65E7\u8D70\u300C\u51FA\u5230\u300D": { en: "Send: a post-fader copy goes to this bus \u2014 it follows this track's gain and pan: pull the fader down 3 dB and the send drops 3 dB too (dry-to-effect ratio stays); muted means no send. The number = how much enters that bus; higher means more of its effect (reverb / delay); the dry sound still goes to \u201COutput to\u201D" },
  "\u6DF7\u97F3\u8F68\u589E\u76CA\uFF1A\u4ECE\u8FD9\u6761\u6DF7\u97F3\u8F68\u51FA\u6765\u7684\u603B\u91CF\u3002\u6DF7\u54CD / \u5EF6\u8FDF\u8FD9\u7C7B\u5168\u6E7F\u7684\u6DF7\u97F3\u8F68 = \u90A3\u8FB9\u7684\u6548\u679C\u6709\u591A\u5927\uFF0C\u53D1\u7ED9\u5B83\u7684\u51E0\u4F4D\u4E00\u8D77\u53D8\uFF08\u6BCF\u4F4D\u5355\u72EC\u591A\u5C11\u770B\u5404\u81EA\u7684\u300C\u53D1\u9001\u300D\uFF09\u3002\u8981\u662F\u6709\u51E0\u4F4D\u662F\u300C\u51FA\u5230\u300D\u5B83\uFF08\u539F\u58F0\u4E5F\u8FDB\u6765\uFF09\uFF0C\u90A3\u8FD9\u4E2A\u63A8\u5B50\u8FDE\u539F\u58F0\u4E00\u8D77\u8C03": { en: "Bus gain: the total coming out of this bus. For fully wet buses (reverb / delay) = how big the effect is, for everyone sending to it (each one's amount is on their own \u201CSend\u201D). If some parts \u201COutput to\u201D it (dry sound too), this fader moves the dry sound as well" },
  "\u5CF0\u503C\uFF1A\u6700\u8FD1\u8FD9\u4E00\u4E0B\u6700\u54CD\u7684\u90A3\u4E2A\u91C7\u6837\uFF08dBFS\uFF09\u30020 dB = \u6EE1\u683C\uFF0C\u518D\u5927\u5C31\u524A\u6CE2\uFF1B\u9650\u5E45\u5F00\u7740\u65F6\u6700\u591A\u5230\u5929\u82B1\u677F\u3002\u9876\u4E0A\u7684\u7EC6\u7EBF\u662F\u540C\u4E00\u4E2A\u6570": { en: "Peak: the loudest sample just now (dBFS). 0 dB = full scale, above that it clips; with the limiter on it stops at the ceiling. The thin line at the top is the same number" },
  "\u5E73\u5747\u7535\u5E73\uFF08RMS\uFF0C\u6700\u8FD1 0.3 \u79D2\uFF0C\u63A8\u5B50\u4E4B\u540E\uFF0CdBFS\uFF09\uFF1A\u6BD4\u5CF0\u503C\u66F4\u63A5\u8FD1\u8033\u6735\u89C9\u5F97\u7684\u54CD\u3002\u51E0\u6761\u8F68\u6446\u5E73\u97F3\u91CF\u770B\u8FD9\u4E2A\uFF1B\u9876\u4E0A\u7684\u7EC6\u7EBF\uFF08\u5CF0\u503C\uFF09\u770B\u4F1A\u4E0D\u4F1A\u7206": { en: "Average level (RMS, last 0.3 s, post-fader, dBFS): closer to perceived loudness than peak. Use this to balance tracks; use the thin line on top (peak) to watch for clipping" },
  "\u5DE6\u53F3\u76F8\u5173\uFF08\u22121 \u5230 +1\uFF09\uFF1A+1 = \u5DE6\u53F3\u4E00\u6837\uFF08\u5355\u58F0\u9053\uFF09\uFF1B0 \u9644\u8FD1 = \u5F88\u5BBD\uFF1B\u5C0F\u4E8E 0 = \u5DE6\u53F3\u53CD\u76F8\uFF0C\u624B\u673A\u5916\u653E / \u5355\u58F0\u9053\u4E00\u5408\u5C31\u4F1A\u53D8\u5C0F\u3001\u53D8\u7A7A\u3002\u80CC\u666F\u7684\u56FE\uFF1A\u7AD6\u7EBF = \u5355\u58F0\u9053\uFF0C\u8D8A\u5706\u8D8A\u5BBD\uFF0C\u6A2A\u7740 = \u53CD\u76F8\uFF1B\u5F80\u5DE6\u4E0A\u659C = \u504F\u5DE6\u58F0\u9053\u3001\u5F80\u53F3\u4E0A\u659C = \u504F\u53F3": { en: "Stereo correlation (\u22121 to +1): +1 = left and right identical (mono); around 0 = very wide; below 0 = out of phase, which gets thin and quiet on phone speakers / mono. The background figure: vertical line = mono, rounder = wider, horizontal = out of phase; tilting up-left = left-heavy, up-right = right-heavy" },
  "\u538B\u4E86\u591A\u5C11\uFF1A\u8FD9\u6761\u8F68\u4E0A\u7B2C\u4E00\u53F0\u538B\u7F29\u6B64\u523B\u628A\u58F0\u97F3\u538B\u4F4E\u4E86\u51E0 dB\uFF08\u4E0B\u9762\u644A\u5F00\u7684\u5C31\u662F\u5B83\uFF09\u3002\u4E00\u76F4\u538B\u5F88\u591A = \u9608\u503C\u592A\u4F4E\u6216\u6BD4\u4F8B\u592A\u5927": { en: "Gain reduction: how many dB the first compressor on this track is reducing right now (it's the one shown below). Constantly a lot = threshold too low or ratio too high" },
  "\u88AB\u8C01\u538B\uFF08\u4FA7\u94FE\uFF09\uFF1A\u538B\u7F29\u5668\u4E0D\u770B\u81EA\u5DF1\uFF0C\u800C\u770B\u53E6\u4E00\u6761\u8F68\u6709\u591A\u54CD\u2014\u2014\u6BD4\u5982\u5C0F\u6708\u76F8\u4E00\u5531\uFF0C\u4F34\u594F\u81EA\u5DF1\u8BA9\u4E00\u70B9": { en: "Compressed by (sidechain): the compressor listens to another track instead of itself \u2014 say, the backing ducks a bit when Tsukuyomi-chan sings" },
  "\u5E73\u5747": { en: "Average" },
  "\u5DE6\u53F3\u76F8\u5173": { en: "Stereo correlation" },
  "\u9650\u5E45\uFF08\u603B\u8F68\u6700\u540E\u4E00\u9053\uFF09\uFF1A\u524D\u77BB {la} ms \u770B\u89C1\u8981\u8D85\u8FC7\u5929\u82B1\u677F\uFF08{c} dBFS = \u6EE1\u5E45\u7684 {lin}\uFF09\u7684\u90A3\u4E00\u4E0B\uFF0C\u6309\u300C\u8D77\u300D{a} ms \u63D0\u524D\u628A\u5B83\u538B\u4E0B\u6765\uFF0C\u8FC7\u4E86\u6309\u300C\u653E\u300D{r} ms \u6162\u6162\u677E\u5F00\uFF1B\u4E0D\u8D85\u7684\u5730\u65B9\u4E00\u4E2A\u91C7\u6837\u90FD\u4E0D\u52A8\uFF0C\u4E0D\u6539\u97F3\u8272\u3002\u8F93\u51FA\u56E0\u6B64\u665A {la} ms\uFF08\u5BFC\u51FA\u65F6\u6263\u6389\uFF09\u3002\u8FD9\u56DB\u4E2A\u6570\u5B58\u5728\u8FD9\u9996\u6B4C\u91CC\uFF0C\u8FD9\u4E00\u7248\u6CA1\u6709\u8C03\u8282\u7684\u94AE\u3002\u5173\u6389 = \u8D85\u4E86\u5C31\u524A\u6CE2\uFF08\u7206\u97F3\u3001\u5BFC\u51FA\u7684\u6587\u4EF6\u91CC\u4E5F\u662F\uFF09\u3002\u4E00\u822C\u4E00\u76F4\u5F00\u7740\uFF1B\u60F3\u770B\u81EA\u5DF1\u7684\u6DF7\u97F3\u5230\u5E95\u591A\u54CD\uFF0C\u53EF\u4EE5\u5148\u5173\u4E86\u770B\u5CF0\u503C": { en: "Limiter (the last stage on the master): it looks {la} ms ahead for anything about to go over the ceiling ({c} dBFS = {lin} of full scale), pulls it down early with a {a} ms attack, and lets go slowly over a {r} ms release afterwards; everywhere it isn\u2019t over, not a single sample changes and the tone stays the same. The output is therefore {la} ms late (removed on export). These four numbers are stored in this song; this version has no knobs for them. Off = anything over clips (pops, in exported files too). Usually leave it on; to see how loud your mix really is, turn it off for a moment and watch the peak" },
  "\u62F7\u8FD9\u4E00\u683C\u7684\u53C2\u6570\uFF08\u79CD\u7C7B + \u5168\u90E8\u53C2\u6570\uFF1B\u4E0D\u62F7\u5F00\u5173\u3001\u4E0D\u62F7\u88AB\u8C01\u538B\uFF09": { en: "Copy this slot's parameters (kind + all parameters; not on/off, not \u201Ccompressed by\u201D)" },
  "\u62F7\u53C2\u6570": { en: "Copy params" },
  "\u628A\u62F7\u7684\u53C2\u6570\uFF08\u6765\u81EA\u300C{from}\u300D\uFF09\u76D6\u5230\u8FD9\u4E00\u683C\u4E0A\uFF1B\u5F00\u5173 / \u88AB\u8C01\u538B\u7167\u65E7\uFF1B\u80FD\u64A4\u9500": { en: "Applies the copied parameters (from \u201C{from}\u201D) to this slot; on/off and \u201Ccompressed by\u201D stay; can be undone" },
  "\u7C98\u53C2\u6570": { en: "Paste params" },
  "\u64AD\u653E\uFF08\u7A7A\u683C\uFF09": { en: "Play (Space)" },
  "\u52A0\u4E00\u6761\u6DF7\u97F3\u8F68\uFF08\u8DEF\u7531\u8F68\uFF09\uFF1A\u51E0\u6761\u8F68\u53D1\u8FC7\u6765\u4E00\u8D77\u8FC7\u6548\u679C\uFF0C\u6BD4\u5982\u5171\u7528\u4E00\u4E2A\u6DF7\u54CD": { en: "Add a bus (routing track): several tracks send here to share effects, such as one reverb" },
  "\uFF0B \u6DF7\u97F3\u8F68": { en: "\uFF0B Bus" },
  "\u66F4\u591A\uFF1A\u6392\u6570\u2026": { en: "More: rows\u2026" },
  "\u6536\u8D77\u6DF7\u97F3\u53F0\uFF1A\u5E95\u5EA7\u8BA9\u51FA\u6765\u3001\u8FD8\u5728\u300C\u542C\u300D\uFF08Esc = \u56DE\u53BB\u5199\uFF09": { en: "Collapses the mixer: frees the dock, still in \u201CListen\u201D (Esc = back to writing)" },
  "\u6548\u679C\u5168\u5173\u7740\uFF1A\u63D2\u4EF6\u548C\u53D1\u9001\u90FD\u4E0D\u54CD\uFF0C\u53EA\u5269\u63A8\u5B50\u3001\u58F0\u50CF\u3001\u51FA\u5230\u548C\u603B\u8F68\u9650\u5E45\u2014\u2014\u542C\u8C31\u5B50\u672C\u8EAB / \u542C\u5DEE\u522B\u7528\uFF1B\u518D\u70B9\u4E00\u4E0B\u56DE\u6765\u3002\u5BFC\u51FA\u7167\u5E38\u5E26\u6548\u679C\u3002": { en: "All effects off: plugins and sends are silent, leaving only faders, pan, outputs and the master limiter \u2014 for hearing the score itself / comparing; tap again to return. Exports still include effects." },
  "\u4E0D\u518D\u53D1\u7ED9 {to}": { en: "Stop sending to {to}" },
  "\u5F00 / \u5173": { en: "On / off" },
  "{strip} \u7C98\u6210\u65B0\u7684\u4E00\u683C\uFF1A{kind}": { en: "{strip} pasted as a new slot: {kind}" },
  "\u6539\u6210\u6700\u63A5\u8FD1\u7684\u4E00\u952E": { en: "Switch to the nearest Simple" },
  "\u53D1\u7ED9 {to} {v}": { en: "Send to {to} {v}" },
  "\u53D1\u7ED9 {value}": { en: "Send to {value}" },
  "\u88AB\u8C01\u538B": { en: "Compressed by" },
  "\u51E0\u4E2A\u5927\u65CB\u94AE\uFF0C\u6309\u516C\u5F0F\u8C03\u4E0B\u9762\u5168\u91CF\u7684\u53C2\u6570\uFF08\u53EA\u6362\u8FD9\u4E00\u683C\uFF09": { en: "A few big knobs that set the full parameters below by formula (this slot only)" },
  "\u4E00\u952E": { en: "Simple" },
  "\u6BCF\u4E00\u4E2A\u53C2\u6570\u90FD\u644A\u5F00\uFF08\u53EA\u6362\u8FD9\u4E00\u683C\uFF09": { en: "Every parameter laid out (this slot only)" },
  "\u5168\u91CF": { en: "Full" },
  "{track} \u63D2\u4E0A{kind}": { en: "{track} inserted {kind}" },
  "{track} \u62FF\u6389{gone}": { en: "{track} removed {gone}" },
  "\u4E0D\u7528\uFF08\u81EA\u5DF1\u538B\u81EA\u5DF1\uFF09": { en: "None (compresses itself)" },
  "\u88AB\u8C01\u538B\uFF1A\u65AD\u4E86\uFF0C\u300C{key}\u300D\u8FD9\u6761\u8F68\u4E0D\u5728\uFF08\u73B0\u5728\u542C\u81EA\u5DF1\uFF09": { en: "Ducked by: broken, track \u201C{key}\u201D is missing (listening to itself for now)" },
  "\u5728\u5168\u91CF\u91CC\u8C03\u8FC7\uFF0C\u4E00\u952E\u8868\u8FBE\u4E0D\u4E86\uFF1A\u4E00\u952E\u5148\u9501\u7740\uFF0C\u514D\u5F97\u4E00\u78B0\u5C31\u76D6\u6389\u3002": { en: "Adjusted in Full in a way Simple can't express: Simple stays locked so a touch can't overwrite it." },
  "\u6309\u6700\u63A5\u8FD1\u7684\u4E00\u952E\u6570\u503C\u6539\u5199\u2014\u2014\u5168\u91CF\u91CC\u591A\u8C03\u7684\u4F1A\u4E22\u6389\uFF08\u6BD4\u5982\u4E2D\u9891\u90A3\u4E00\u5200\uFF09\uFF1B\u80FD\u64A4\u9500": { en: "Rewrites to the nearest Simple values \u2014 extra adjustments in Full are lost (like that mid-band cut); can be undone" },
  "\u6DF7\u97F3\u8F68 / \u603B\u8F68\u4E0A\u6CA1\u6709\u97F3\uFF0C\u7528\u4E0D\u4E0A{v}": { en: "Buses / master have no notes, so {v} isn't usable" },
  "\uFF08\u5F00\u7740\u4E5F\u4E0D\u5207\uFF09": { en: " (no cut even when on)" },
  "\u81EA\u52A8\uFF1A{hz} Hz\uFF08\u8FD9\u4F4D\u6700\u4F4E\u7684\u97F3\u5F80\u4E0B\u56DB\u4E2A\u534A\u97F3\uFF09": { en: "Auto: {hz} Hz (four semitones below this part's lowest note)" },
  "\u81EA\u52A8\uFF08\u8FD9\u6761\u8F68\u6CA1\u6709\u97F3 = \u4E0D\u5207\uFF09": { en: "Auto (no notes on this track = no cut)" },
  "\u5F80\u8FD9\u6761\u8F68\u4E0A\u63D2\u4E00\u4E2A{kind}": { en: "Insert a {kind} on this track" },
  "\u5173 = \u8FD9\u4E00\u683C\u8DF3\u8FC7\uFF08\u53C2\u6570\u7559\u7740\uFF09": { en: "Off = this slot is skipped (parameters stay)" },
  "\u5173\u7740": { en: "Off" },
  "\u5F00\u7740": { en: "On" },
  "\u8FD8\u6709 {p} \u4E2A{kind}\u5728\u300C\u94FE\u300D\u91CC": { en: "{p} more {kind} in \u201CChain\u201D" },
  "\u538B\u4E86": { en: "Reduced" },
  "\u65AD\u4E86\uFF1A\u300C{to}\u300D\u8FD9\u6761\u6DF7\u97F3\u8F68\u4E0D\u5728": { en: "Broken: mix track \u201C{to}\u201D is missing" },
  "\u63A5\u6210\u73AF\u4E86\uFF0C\u6CA1\u63A5\u4E0A": { en: "This makes a loop, so it is not connected" },
  "\uFF0C\u73B0\u5728\u51FA\u5230\u603B\u8F68": { en: ", going to the master for now" },
  "\uFF0C\u8FD9\u4E00\u6761\u4E0D\u53D1": { en: ", this send is not sent" },
  "\u6709 {n} \u5904\u65AD\u4E86": { en: "{n} broken link(s)" },
  "\u51FA\u5230": { en: "Output to" },
  "{out}\uFF08\u63A5\u4E0D\u4E0A\uFF09": { en: "{out} (can't connect)" },
  "\u53D1\u7ED9 {to}": { en: "Send to {to}" },
  "\u4E0D\u518D\u53D1\u7ED9\u5B83": { en: "Stop sending to it" },
  "\uFF0B \u53D1\u9001\u5230\u2026": { en: "\uFF0B Send to\u2026" },
  "\u63A8\u5B50\u4E4B\u540E\u53D1\u4E00\u4EFD\u5230\u4E00\u6761\u6DF7\u97F3\u8F68\uFF08\u6DF7\u54CD / \u5EF6\u8FDF\u8FD9\u7C7B\u653E\u5728\u6DF7\u97F3\u8F68\u4E0A\uFF0C\u51E0\u6761\u8F68\u5171\u7528\uFF09": { en: "Sends a post-fader copy to a bus (reverb / delay live on buses, shared by several tracks)" },
  "\u8FD8\u6CA1\u6709\u6DF7\u97F3\u8F68\uFF08\u9876\u680F\u300C\uFF0B \u6DF7\u97F3\u8F68\u300D\u52A0\uFF09": { en: "No buses yet (add one with \u201C\uFF0B Bus\u201D at the top)" },
  "\u300C{out}\u300D\u4E0A\u7684{kind}\u662F\u5168\u6E7F\u7684\uFF1A\u51FA\u5230\u5B83 = \u539F\u58F0\u6CA1\u4E86\uFF0C\u53EA\u5269{kind2}\u3002\u8981\u539F\u58F0\u52A0{kind3}\uFF1A\u51FA\u5230\u603B\u8F68\uFF0C\u7528\u4E0B\u9762\u7684\u300C\u53D1\u9001\u300D\u3002": { en: "The {kind} on \u201C{out}\u201D is fully wet: outputting there = no dry sound, only {kind2}. For dry plus {kind3}: output to master and use \u201CSend\u201D below." },
  "\u51FA\u5230\u300C{out}\u300D= \u6574\u6761\u58F0\u97F3\u90FD\u8FC7\u5B83\u7684{kind}\uFF1A\u51FA\u5230\u5B83\u7684\u51E0\u6761\u8F68{kind2}\u4E00\u6837\u591A{dryDb}\u3002\u60F3\u6BCF\u6761\u8F68\u5404\u81EA\u591A\u5C11\uFF1A\u51FA\u5230\u603B\u8F68\u3001\u7528\u4E0B\u9762\u7684\u300C\u53D1\u9001\u300D\uFF0C\u90A3\u6761\u6DF7\u97F3\u8F68\u4E0A\u7684{kind3}\u6539\u6210\u5168\u6E7F\u3002": { en: "Outputting to \u201C{out}\u201D = the whole sound passes through its {kind}: tracks output there all get the same {kind2}{dryDb}. For a different amount per track: output to master, use \u201CSend\u201D below, and make the {kind3} on that bus fully wet." },
  "\uFF0C\u539F\u58F0\u4E5F\u88AB\u5B83\u5173\u5C0F {dryDb}\uFF08\u63A8\u5B50\u4E0A\u770B\u4E0D\u51FA\u6765\uFF09": { en: ", and it also reduces the dry sound by {dryDb} (not visible on the fader)" },
  "{kind}\uFF1A\u70B9\u5F00\u8C03{DEFAULT_EQ_ID}": { en: "{kind}: tap to adjust{DEFAULT_EQ_ID}" },
  "\uFF08\u9ED8\u8BA4\u90A3\u4E00\u683C\uFF1A\u80FD\u5173\u3001\u80FD\u6362\u9762\u677F\uFF0C\u4E0D\u80FD\u5220\uFF09": { en: " (the default slot: can be toggled and its panel switched, not deleted)" },
  "\u94FE\u5C3E\u52A0\u4E00\u683C\uFF1A\u62F7\u7684\u90A3\u4E00\u683C\uFF08\u6765\u81EA\u300C{from}\u300D\uFF09\u7684\u79CD\u7C7B\u548C\u53C2\u6570": { en: "Adds a slot at the end of the chain: the kind and parameters of the copied slot (from \u201C{from}\u201D)" },
  "\u7C98\u6210\u65B0\u7684\u4E00\u683C\uFF1A{kind}": { en: "Paste as a new slot: {kind}" },
  "\u63D2\u4E00\u4E2A\u63D2\u4EF6\uFF08\u4EFB\u4F55\u63D2\u4EF6\u90FD\u80FD\u63D2\u5728\u4EFB\u4F55\u8F68\u4E0A\uFF09": { en: "Insert a plugin (any plugin works on any track)" },
  "\u4ECE\u8FD9\u6761\u8F68\u4E0A\u62FF\u6389\uFF08\u80FD\u64A4\u9500\uFF09": { en: "Remove from this track (can be undone)" },
  "\u8D34\u5728\u5E95\u4E0B\u65F6\u663E\u793A\u51E0\u6392\u5361\u7247\uFF08\u540C\u5C0F\u952E\u76D8\u7684\u300C\u884C\u300D\uFF09\uFF1A\u81EA\u52A8 = \u534A\u5C4F\u653E\u5F97\u4E0B\u7684\u6700\u591A\u6392\uFF1B\u624B\u52A8\u6700\u591A\u5230\u5C4F\u5E55\u653E\u5F97\u4E0B\u3001\u8C31\u8FD8\u9732\u4E00\u6761\u4E3A\u6B62\u3002\u6A2A\u7740\u653E / \u5168\u5C4F\u65F6\u4E0D\u7BA1": { en: "How many rows of cards to show when docked at the bottom (like the keypad rows): Auto = as many as fit in half the screen; manual goes up to what the screen can hold while a strip of the score stays visible. Ignored when docked at the side or full screen" },
  "\u6392\u6570": { en: "Rows" },
  "\u5C11\u4E00\u6392": { en: "One row fewer" },
  "\u591A\u4E00\u6392": { en: "One row more" },
  "\u6548\u679C\u5168\u5173": { en: "All FX off" },
  "\u6548\u679C\u5F00\u7740": { en: "FX on" },
  "\u73B0\u5728\uFF1A\u63D2\u4EF6\u548C\u53D1\u9001\u90FD\u4E0D\u54CD\uFF08\u63A8\u5B50 / \u58F0\u50CF\u7559\u7740\uFF09\u3002\u70B9 = \u6548\u679C\u56DE\u6765": { en: "Now: plugins and sends are silent (faders / pan stay). Tap = effects back" },
  "\u70B9 = \u6682\u65F6\u5173\u6389\u5168\u90E8\u6548\u679C\uFF08\u63D2\u4EF6 + \u53D1\u9001\uFF09\uFF0C\u542C\u8C31\u5B50\u672C\u8EAB / \u542C\u5DEE\u522B\uFF1B\u63A8\u5B50\u3001\u58F0\u50CF\u7559\u7740": { en: "Tap = temporarily turn off all effects (plugins + sends), to hear the score itself / compare; faders and pan stay" },
  "\u8FD8\u539F\uFF1A\u56DE\u5230\u5E95\u5EA7": { en: "Restore: back to the dock" },
  "\u6DF7\u97F3\u53F0\u94FA\u6EE1\uFF08\u63A8\u5230\u6700\u4E0A\u9762\uFF0C\u5361\u7247\u6392\u6210\u597D\u51E0\u5217\uFF0C\u4E00\u773C\u770B\u5168\uFF09\uFF1B\u518D\u70B9 = \u56DE\u5230\u5E95\u5EA7": { en: "Fills the screen with the mixer (cards in several columns, all in view); tap again = back to the dock" },
  "\u8FD8\u539F": { en: "Restore" },
  "\u5168\u5C4F": { en: "Full screen" },
  "\u9650\u5E45": { en: "Limiter" },
  "\u5173\u7740\uFF08\u53EF\u80FD\u524A\u6CE2\uFF09": { en: "Off (may clip)" },
  "\u5CF0\u503C": { en: "Peak" },
  "\u603B\u8F68\u5C31\u662F\u8F93\u51FA\uFF0C\u4E0D\u518D\u53D1\u7ED9\u522B\u5904": { en: "Master is the output; it doesn't send anywhere else" },
  "\u6240\u6709\u58F0\u90E8\u6DF7\u5728\u4E00\u8D77\u4E4B\u540E": { en: "After all parts are mixed" },
  "\u58F0\u50CF": { en: "Pan" },
  "\u65C1\u901A\uFF1A\u8FD9\u6761\u6DF7\u97F3\u8F68\u4E0A\u7684\u63D2\u4EF6\u5168\u8DF3\u8FC7\uFF08\u63A8\u5B50 / \u58F0\u50CF / \u51FA\u5230 / \u53D1\u9001\u7167\u65E7\uFF09\uFF1B\u518D\u70B9 = \u56DE\u6765": { en: "Bypass: all plugins on this bus are skipped (fader / pan / output / sends stay); tap again = back" },
  "\u65C1\u901A\u4E2D": { en: "Bypassed" },
  "\u5F80\u524D\u632A\u4E00\u4F4D": { en: "Move earlier" },
  "\u5F80\u540E\u632A\u4E00\u4F4D": { en: "Move later" },
  "\u5220\u6389\u8FD9\u6761\u6DF7\u97F3\u8F68\uFF08\u53D1\u7ED9\u5B83\u7684\u3001\u51FA\u5230\u5B83\u7684\u90FD\u6539\u56DE\u603B\u8F68\uFF1B\u80FD\u64A4\u9500\uFF09": { en: "Delete this bus (tracks sending or outputting to it go back to master; can be undone)" },
  "\u540D\u5B57\uFF08\u70B9\u4E86\u6539\uFF09": { en: "Name (tap to change)" },
  "\u9759\u97F3\uFF1A\u8FD9\u6761\u6DF7\u97F3\u8F68\u4E0D\u51FA\u58F0\u3001\u4E5F\u4E0D\u5F80\u4E0B\u53D1\uFF08\u53D1\u7ED9\u5B83\u7684\u90A3\u51E0\u4F4D\u539F\u58F0\u7167\u65E7\uFF09": { en: "Mute: this bus is silent and sends nothing onward (the dry sound of parts sending to it is unaffected)" },
  "\u9759": { en: "M" },
  "\u6DF7\u97F3\u8F68 \xB7 \u65C1\u901A\u4E2D\uFF08\u63D2\u4EF6\u5168\u8DF3\u8FC7\uFF09": { en: "Bus \xB7 bypassed (all plugins skipped)" },
  "\u8FD9\u4F4D\u4E50\u624B\u81EA\u5DF1\u7684\u54CD\u5EA6\uFF08\u4E50\u5668\u9875\u300C\u54CD\u5EA6\u300D\u90A3\u4E00\u884C\uFF09\uFF0C\u548C\u63A8\u5B50\u76F8\u52A0\uFF1A\u63A8\u5B50 {g}\u3001\u4E50\u624B {p} = \u8FD9\u6761\u8F68\u4E00\u5171 {t}\u3002\u70B9\u8FD9\u91CC\u53BB\u4E50\u5668\u9875\u6539": { en: "This performer's own loudness (the Loudness row on the instrument page), added to the fader: fader {g}, performer {p} = {t} for this track in total. Tap to change it on the instrument page" },
  "\u4E50\u624B {p}": { en: "Performer {p}" },
  "\u8FD9\u4F4D\u4E50\u624B\u8EAB\u4E0A\u6709 {n} \u5904\u548C\u73B0\u5728\u7684\u9ED8\u8BA4\u4E0D\u4E00\u6837\uFF08\u54CD\u5EA6\u53E6\u7B97\uFF09\u3002\u70B9\u8FD9\u91CC\u53BB\u4E50\u5668\u9875\u770B\u662F\u54EA\u51E0\u5904": { en: "This performer differs from the current default in {n} places (loudness counted separately). Click to see which on the instrument page" },
  "\u4E50\u624B {n} \u5904\u4E0D\u540C": { en: "Performer: {n} differ" },
  "\u5F80\u524D\u632A\u4E00\u4F4D\uFF08\u8C31\u4E0A\u8FD9\u4E2A\u58F0\u90E8\u4E5F\u5F80\u4E0A\u632A\uFF09": { en: "Move earlier (this part also moves up on the score)" },
  "\u5F80\u540E\u632A\u4E00\u4F4D\uFF08\u8C31\u4E0A\u8FD9\u4E2A\u58F0\u90E8\u4E5F\u5F80\u4E0B\u632A\uFF09": { en: "Move later (this part also moves down on the score)" },
  "\u5728 {refs} \u5F20\u7EB8\u4E0A": { en: "On {refs} {refs|sheet|sheets}" },
  "\u54EA\u5F20\u7EB8\u4E0A\u90FD\u6CA1\u6709": { en: "Not on any sheet" },
  "\u5220\u6389\u8FD9\u4E2A\u58F0\u90E8\uFF08\u5B83\u7684\u4E50\u5668\u8BBE\u7F6E\u4E00\u8D77\u5220\uFF1B\u80FD\u64A4\u9500\uFF09": { en: "Delete this part (its instrument settings go too; undoable)" },
  "\u5220\u6389\u8FD9\u4E2A\u58F0\u90E8": { en: "Delete this part" },
  "\u9759\u97F3\uFF08\u8FD9\u4F4D\u4E0D\u51FA\u58F0\uFF1B\u548C\u8C31\u4E0A\u58F0\u90E8\u540D\u4E0B\u9762\u7684\u300C\u9759\u300D\u662F\u540C\u4E00\u4E2A\uFF09": { en: "Mute (this part is silent; same as \u201CM\u201D under the part name on the score)" },
  "\u72EC\u594F\uFF08\u53EA\u542C\u72EC\u594F\u7684\u51E0\u4F4D\uFF1B\u548C\u8C31\u4E0A\u7684\u300C\u72EC\u300D\u662F\u540C\u4E00\u4E2A\uFF09": { en: "Solo (only hear the parts on solo; same as \u201CS\u201D on the score)" },
  "\u72EC": { en: "S" }
};

// src/device-kv.ts
var PREFIX = "moonsinger-5b1e7c0a92d34f6e:";
var _mem = /* @__PURE__ */ new Map();
function _ls() {
  try {
    const ls2 = globalThis.localStorage;
    ls2.getItem(PREFIX + "__probe");
    return ls2;
  } catch {
    return null;
  }
}
function deviceKvGet(key) {
  const k = PREFIX + key;
  const ls2 = _ls();
  if (ls2) {
    try {
      return ls2.getItem(k);
    } catch {
    }
  }
  return _mem.get(k) ?? null;
}

// src/i18n/index.ts
var LANGS = ["zh", "en"];
var valid = (v) => LANGS.includes(v) ? v : null;
function detect() {
  const g = globalThis;
  if (g.process?.versions?.node) return "zh";
  if (typeof g.document === "undefined") {
    const m = typeof g.name === "string" ? /^lang=(\w+)/.exec(g.name) : null;
    return valid(m?.[1]) ?? "zh";
  }
  const saved = valid(deviceKvGet("lang"));
  if (saved) return saved;
  return (g.navigator?.language ?? "en").toLowerCase().startsWith("zh") ? "zh" : "en";
}
var _lang = null;
function lang() {
  return _lang ??= detect();
}
function fill(raw, params) {
  if (!params) return raw;
  return raw.replace(/\{(\w+)(?:\|([^|}]*)\|([^}]*))?\}/g, (m, k, one, many) => {
    if (!(k in params)) return m;
    return one !== void 0 ? Number(params[k]) === 1 ? one : many ?? "" : String(params[k]);
  });
}
var TABLE = typeof __I18N_OFF__ !== "undefined" && __I18N_OFF__ ? {} : S;
function lookup(key, l = lang()) {
  if (l === "zh") {
    const i = key.indexOf("##");
    return i < 0 ? key : key.slice(0, i);
  }
  const e = TABLE[key];
  return e?.en || key;
}
function _t(key, params) {
  return fill(lookup(key), params);
}

// src/singer/en-front.mjs
var UNITS = /* @__PURE__ */ new Set(["\u0251\u02D0", "\u0254\u02D0", "i\u02D0", "u\u02D0", "\u025C\u02D0", "a\u026A", "e\u026A", "o\u028A", "a\u028A", "\u0254\u026A"]);
var VOWEL_CH = /* @__PURE__ */ new Set([..."aeiou\u026A\u028A\u025B\u0254\xE6\u0251\u028C\u0259\u025C\u025A\u025D"]);
function nucleusStarts(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!VOWEL_CH.has(tokens[i])) continue;
    out.push(i);
    if (UNITS.has(tokens[i] + (tokens[i + 1] ?? ""))) i++;
  }
  return out;
}
function makeEnglishFront({ g2p, encodeTokens: encodeTokens2, idMap }) {
  function phonemizeWords(words) {
    const all = [], prosody = [], keptSung = [], keptWord = [], nuclei = [];
    const tokens = [];
    words.forEach((w, wi) => {
      const r = g2p.phonemize(w);
      const starts = new Set(nucleusStarts(r.tokens));
      nuclei.push(starts.size);
      if (!starts.size) return;
      if (all.length) {
        all.push(" ");
        prosody.push([0, 0, 0]);
      }
      r.tokens.forEach((t, i) => {
        all.push(t);
        prosody.push(r.prosody[i]);
        if (idMap[t]) {
          tokens.push(t);
          keptSung.push(starts.has(i));
          keptWord.push(wi);
        }
      });
    });
    const { ids, pros } = encodeTokens2(all, prosody, idMap);
    return { tokens, ids, pros, sung: keptSung, wordOf: keptWord, nuclei };
  }
  return { phonemizeWords };
}
function groupWords(entries) {
  const groups = [];
  for (const e of entries) {
    const g = groups[groups.length - 1];
    if (g && g.open) g.items.push(e);
    else groups.push({ items: [e], open: false });
    groups[groups.length - 1].open = !!e.hyph;
  }
  return groups;
}
function wordsOf(entries) {
  return groupWords(entries).map((g) => g.items.map((e) => e.kana).join(""));
}
function alignEnglish(entries, nucleiPerWord) {
  const groups = groupWords(entries), out = [];
  let leadRest = 0;
  groups.forEach((g, wi) => {
    const n = nucleiPerWord[wi], items = g.items, last = items[items.length - 1], rest = last.rest || 0;
    const mk = (kana, notes) => ({ kana, notes, ...items[0].hum ? { hum: true } : {} });
    const made = [];
    if (n <= 0) {
      const len = items.reduce((s, e) => s + e.notes.reduce((a, [, l]) => a + l, 0) + (e.rest || 0), 0);
      const prev = out[out.length - 1];
      if (prev) prev.rest = (prev.rest || 0) + len;
      else leadRest += len;
      return;
    }
    if (n <= items.length) {
      for (let k = 0; k < n - 1; k++) made.push(mk(items[k].kana, items[k].notes));
      made.push(mk(items.slice(n - 1).map((e) => e.kana).join(""), items.slice(n - 1).flatMap((e) => e.notes)));
    } else {
      for (let k = 0; k < items.length - 1; k++) made.push(mk(items[k].kana, items[k].notes));
      const need = n - (items.length - 1), notes = last.notes;
      if (notes.length >= need) {
        for (let k = 0; k < need - 1; k++) made.push(mk(last.kana, [notes[k]]));
        made.push(mk(last.kana, notes.slice(need - 1)));
      } else {
        for (let k = 0; k < notes.length - 1; k++) made.push(mk(last.kana, [notes[k]]));
        const [midi, len] = notes[notes.length - 1], parts = need - (notes.length - 1);
        for (let k = 0; k < parts; k++) made.push(mk(last.kana, [[midi, len / parts]]));
      }
    }
    if (rest) made[made.length - 1].rest = rest;
    out.push(...made);
  });
  return { entries: out, leadRest };
}

// src/singer/sing-core.mjs
var DEFAULT_OPT = {
  leadIn: 0.5,
  // s before the first sung vowel (the first consonant comes out of it)
  tail: 0.6,
  // s of silence after the last note
  consonantCap: 0.5,
  // a consonant may take at most this share of the previous note when no rest precedes it
  vowelFrames: [8, 16],
  // piper frames (11.6 ms) for vowel + its blank: 2 × the model's own length, clamped to this range
  attack: 0.06,
  // s of the vowel start copied 1:1 before stretching
  release: 0.08,
  // s of fade-out at the end of a note before a rest / at the end
  holdDb: 6,
  // the held stretch = clean frames (see breath) within this many dB of the vowel's loudest clean frame
  vowelLag: 0.02,
  // s: fallback only — the sung vowel starts where piper's vowel turns clean (periodic), within its first half
  cleanMax: 0.4,
  // a vowel whose own cleanest frames are noisier than this (whispered: なかよし's し, つく's つ) is replaced by a
  // clean sample of the same vowel elsewhere in the song — envelope AND noise profile (take 5 borrowed only the noise
  // profile: a whisper's envelope sung voiced = buzz) — sung vowels are never devoiced (user「常识唱歌的时候这种音会唱成什么」)
  // knobs from the table (ai-docs/20261005-moonsinger-upheaval.md §8), take 4 — user 2026-10-05「突然气球漏气变成气音」「有些音突然很轻」:
  breath: 0,
  // 实声/气息: 0 = every vowel frame as clean (periodic) as that vowel's cleanest frames; 1 = piper's own breathiness
  level: 0.8,
  // 音量: pull each syllable's loudness this far toward the song's median (0 = speech's own loud/soft pattern)
  levelMaxDb: 6,
  // take 5 allowed 12 and boosted the consonants too: user「一堆麦克风的电噪声……有时候还有电锯声」
  levelContinuous: false,
  // 2026-10-14 (Claude Fable 5.1, F-16「そ」爆音): false = 每个字的增益从它元音起点起 30 ms 内从 0 爬到目标（辅音不动）——
  //   相邻两个字一轻一重时，边界上先跳回 0 再爬，前后可达 ~10 dB 落在清辅音进元音那一下（user 听感：只有把 level 关到 0 才不破）；
  //   true = 增益连续：从前一个字的目标值起、经过这个字的辅音、到元音起点后 30 ms 线性过渡到这个字的目标值（休止之后从 0 起）；辅音也跟着过渡。实验行，耳朵定
  tailIntoNext: 0.04,
  // s at most of the vowel's tail copied 1:1 into the next consonant
  portamentoMs: 40,
  // width of the pitch glide between two notes
  // 哼的字（score 条目带 hum: true = 没写歌词、唱这首歌「哼的字」的音；MoonSinger 编辑器给）。2026-10-07 (Claude Opus 5.5)，
  //   user「全歌唱的时候也是都听的像啊」：「んんん」全被注成舌根 N_uvular（嘴张着 ≈ 鼻化的 a）；「ららら」的弹舌只有 20–70 ms，夹在两个 a 中间。默认关 = 原样。
  humNasal: null,
  // 哼「ん」改用哪个 N（"N_m" = 双唇，闭嘴哼）；null = 照注音
  humConsMin: 0,
  // s：哼的字的辅音在歌的时钟上至少这么长（ら 的弹舌拉开）；0 = 照 piper
  vibrato: { cents: 15, hz: 5.5, delay: 0.25, fadeIn: 0.2, minNote: 0.5 },
  // only on notes ≥ minNote s
  noiseScale: 0.667,
  noiseW: 0.5,
  // the read-aloud library's defaults
  atlasXfade: 0.04,
  // s: crossfade piper → atlas at the start of the held stretch; atlas → piper happens across the tail segment (not inside the hold)
  atlasGainClamp: 12,
  // dB: the level match atlas → piper's held level is clamped to ±this (take 1 had −17 dB on 着: a quiet speech vowel pulling a sung frame way down)
  atlasExprLevel: 1,
  // 0..1: how much of the expression set's own loudness difference (強 / 弱 / 深 / 明 vs the normal set at that pitch) is kept (take 1 = 0: 強 sounded like normal)
  atlasTiltHz: 3e3,
  // breath: bins above this are attenuated (an inhale has little energy up there)
  breathDb: -28,
  // breath loudness relative to the coming vowel's held level
  lift: 0.06,
  // s: ^ = silence before the syllable (stolen from the previous note), no inhale   (v3 had 0.09: user「吃了很多音长」)
  gap: {
    v: { share: 0.25, max: 0.16, db: 0 },
    // v: an inhale: at most this share of the previous note / this long, at breathDb   (v3: 0.4 / 0.28)
    O: { share: 0.35, max: 0.24, db: 4 }
  },
  // O: 大口: longer and this many dB louder   (v3: 0.5 / 0.42 / +6)
  breathMinRest: 1,
  // in eighths: only rests at least this long get an inhale (shorter = no time to breathe)
  // 2026-10-10 (Claude Opus 5.5) — score entries may carry whisper: true (气声: the syllable is sung without pitch — f0 stays 0, so WORLD makes it
  //   pure noise through piper's own envelope; user「x同意，做支持」) and inhale: true (the breath before this syllable is audible even with breath: false —
  //   per written mark only; user「不应该每个逗号都大喘气」). Neither changes anything when absent (the default path is sample-identical).
  whisperDb: -6
  // 气声 is this much softer than the syllable's sung level (AI's starting value; the ear decides)
  // (v0.9.16 tried two other ways to sing a borrowed vowel — crossfade at its edges / the whole donor syllable; the user kept the original, 2026-10-10
  //  「ab，要不用原版？之前其实已经修好了」, and both were removed again in v0.9.18.)
};
var VOWEL = /* @__PURE__ */ new Set(["a", "i", "u", "e", "o", "N"]);
var VOICED_FOR = { A: "a", I: "i", U: "u", E: "e", O: "o" };
var isMark = (t) => "[]#?!".includes(t) || /^tone\d$/.test(t);
function expandEntries(SRC, TRANSPOSE) {
  return SRC.map((e) => ({ ...e, notes: e.notes.map(([m, l]) => [m + TRANSPOSE, l]) })).flatMap((e) => {
    const n = e.moras || 1;
    if (n === 1) return [e];
    if (e.notes.length !== 1) throw new Error(`${e.kana}: moras > 1 needs one note`);
    const [midi, len] = e.notes[0];
    return Array.from({ length: n }, (_, i) => ({ kana: [...e.kana][i] ?? e.kana, notes: [[midi, len / n]], rest: i === n - 1 ? e.rest : 0, before: i === 0 ? e.before : void 0, whisper: e.whisper, inhale: i === 0 ? e.inhale : void 0 }));
  });
}
function phonemesOf(LANG, TEXT, pn2, EN) {
  const sungText = TEXT.replace(/[、。，．,.！？!?]/g, "");
  const ph = LANG === "en" ? EN : LANG === "zh" ? pn2.phonemizeZh(sungText) : pn2.phonemize(sungText);
  const tokens = LANG === "ja" ? ph.tokens.map((t) => VOICED_FOR[t] ?? t) : ph.tokens;
  return { ph, tokens };
}
function sungSyllables(LANG, tokens, EN) {
  const moras = [];
  let gap = [];
  const sung1 = LANG === "zh" ? (t, i) => /^tone\d$/.test(tokens[i + 1] ?? "") : LANG === "en" ? (t, i) => EN.sung[i] : (t) => VOWEL.has(t) || /^N/.test(t);
  tokens.forEach((t, i) => {
    if (sung1(t, i)) {
      moras.push({ gap, vowel: i });
      gap = [];
    } else gap.push(i);
  });
  return { moras, trailing: gap };
}
var labelOf = (tokens, m) => [...m.gap.filter((i) => !isMark(tokens[i]) && tokens[i] !== "_").map((i) => tokens[i]), tokens[m.vowel]].join("");
function readingCore({ score: SRC, text: TEXT, lang: LANG = "ja", piper: pn2 }) {
  if (LANG === "en") return { labels: null, said: [] };
  const SCORE = expandEntries(SRC, 0), { tokens } = phonemesOf(LANG, TEXT, pn2, null), { moras } = sungSyllables(LANG, tokens, null);
  const said = moras.map((m) => labelOf(tokens, m) + (LANG === "zh" ? (tokens[m.vowel + 1] ?? "").replace(/^tone/, "") : ""));
  if (said.length !== SCORE.length) return { labels: null, said };
  const labels = [];
  let k = 0;
  for (const e of SRC) {
    const n = e.moras || 1;
    labels.push(said.slice(k, k + n).join("-"));
    k += n;
  }
  return { labels, said };
}
async function singCore({
  score: SCORE_IN,
  text: TEXT,
  tempo: TEMPO_QUARTER,
  lang: LANG = "ja",
  transpose: TRANSPOSE = 0,
  phrasing: PHRASING = "score",
  atlas: ATLAS = "off",
  mix: MIX = 1,
  breath: BREATH = false,
  preset: PRESET = 0,
  piper: pn2,
  world: W,
  loadAtlas = null,
  opt = {},
  log = () => {
  },
  only = null
}) {
  const OPT = { ...DEFAULT_OPT, ...opt };
  if (ATLAS !== "off" && !loadAtlas) throw new Error(`atlas=${ATLAS} needs loadAtlas`);
  let EN = null, leadRest = 0, SRC = SCORE_IN;
  if (LANG === "en") {
    EN = pn2.phonemizeEnWords(wordsOf(SCORE_IN));
    ({ entries: SRC, leadRest } = alignEnglish(SCORE_IN, EN.nuclei));
  }
  const EIGHTH0 = 60 / TEMPO_QUARTER / 2;
  if (only) SRC = SRC.map((e, k) => k === only.entry ? { ...e, notes: [[only.midi - TRANSPOSE, Math.max(0.25, only.secs / EIGHTH0)]], rest: 0 } : e);
  const SCORE = expandEntries(SRC, TRANSPOSE);
  const SR2 = pn2.SR, HOP2 = pn2.HOP, FR = SR2 / HOP2, EIGHTH = 60 / TEMPO_QUARTER / 2, FP = 5, FPS = FP / 1e3;
  const { ph, tokens } = phonemesOf(LANG, TEXT, pn2, EN);
  if (OPT.humNasal && LANG === "ja") {
    let k = 0;
    tokens.forEach((t2, i) => {
      if (!(VOWEL.has(t2) || /^N/.test(t2))) return;
      if (SCORE[k]?.hum && /^N/.test(t2)) tokens[i] = OPT.humNasal;
      k++;
    });
  }
  const { ids, pros } = LANG === "ja" ? pn2.encode(tokens, ph.prosody) : ph;
  const RUN = { lang: LANG, preset: PRESET };
  const owner = [];
  let p = 2;
  for (const t2 of tokens) {
    owner.push(t2 === "_" ? [p] : [p, p + 1]);
    p += t2 === "_" ? 1 : 2;
  }
  if (p !== ids.length - 1) throw new Error(`id layout: expected EOS at ${p}, have ${ids.length - 1}`);
  const { moras, trailing } = sungSyllables(LANG, tokens, EN);
  if (moras.length !== SCORE.length) throw new Error(`${moras.length} sung syllables in the text, ${SCORE.length} in the score
 text: ${moras.map((m) => tokens.slice(m.gap.length ? m.gap[0] : m.vowel, m.vowel + 1).filter((t2) => !"[]#?!_".includes(t2)).join("")).join(" ")}`);
  moras.forEach((m, k) => {
    m.kana = SCORE[k].kana;
    m.mark = SCORE[k].before ?? null;
    if (m.mark && !"^vO".includes(m.mark)) throw new Error(`${m.kana}: before must be ^ v or O`);
    m.label = labelOf(tokens, m);
    const lastPause = m.gap.lastIndexOf(m.gap.findLast?.((i) => tokens[i] === "_") ?? -1);
    m.pause = lastPause >= 0 ? m.gap[lastPause] : null;
    m.cons = m.gap.slice(lastPause + 1);
    m.before = lastPause >= 0 ? m.gap.slice(0, lastPause + 1) : [];
  });
  moras.forEach((m, k) => {
    m.whisper = !!SCORE[k].whisper;
    m.inhale = !!SCORE[k].inhale;
  });
  if (LANG === "en") moras.forEach((m, k) => {
    const w = EN.wordOf[m.vowel], next = moras[k + 1];
    if (!next) {
      m.coda = trailing.filter((i) => !isMark(tokens[i]));
      return;
    }
    if (!(SCORE[k].rest > 0)) return;
    m.coda = next.cons.filter((i) => EN.wordOf[i] === w);
    next.cons = next.cons.filter((i) => EN.wordOf[i] !== w);
  });
  if (PHRASING !== "score") {
    if (PHRASING !== "punct" && PHRASING !== "none") throw new Error(`--phrasing=${PHRASING}: unknown (score|punct|none)`);
    let ti = 0;
    moras.forEach((m, k) => {
      let punct = false;
      for (const ch of [...SCORE[k].kana]) {
        while (ti < TEXT.length && "\u3063\u3001\u3002\uFF0C".includes(TEXT[ti])) {
          if (TEXT[ti] !== "\u3063") punct = true;
          ti++;
        }
        if (TEXT[ti] === ch) ti++;
      }
      m.mark = PHRASING === "punct" && punct && k > 0 ? "v" : null;
    });
  }
  const pred = (await pn2.run(ids, pros, { noiseScale: 0, noiseW: 0, ...RUN })).durations;
  const frames = new Float32Array(ids.length).fill(1);
  frames[0] = 10;
  for (const m of moras) {
    for (const i of m.cons) if (!isMark(tokens[i])) owner[i].forEach((j) => frames[j] = Math.max(1, Math.round(pred[j])));
    for (const i of m.coda ?? []) if (!isMark(tokens[i])) owner[i].forEach((j) => frames[j] = Math.max(1, Math.round(pred[j])));
    if (m.pause !== null) frames[owner[m.pause][0]] = 10;
    const [a, b] = owner[m.vowel], tot = Math.min(OPT.vowelFrames[1], Math.max(OPT.vowelFrames[0], Math.round(2 * (pred[a] + pred[b]))));
    frames[a] = Math.max(1, Math.round(tot * pred[a] / (pred[a] + pred[b])));
    frames[b] = Math.max(1, tot - frames[a]);
  }
  frames[ids.length - 1] = 8;
  const cum = [0];
  for (const v of frames) cum.push(cum[cum.length - 1] + v);
  const sec = (idIndex) => cum[idIndex] / FR;
  let t0 = performance.now();
  const said = await pn2.run(ids, pros, { noiseScale: OPT.noiseScale, noiseW: OPT.noiseW, override: Array.from(frames), ...RUN });
  const piperMs = performance.now() - t0;
  if (said.audio.length !== cum[cum.length - 1] * HOP2) throw new Error(`audio ${said.audio.length} samples, timeline ${cum[cum.length - 1] * HOP2}`);
  const x = said.audio;
  for (const m of moras) {
    m.c0 = m.cons.length ? sec(owner[m.cons[0]][0]) : sec(owner[m.vowel][0]);
    m.v0 = sec(owner[m.vowel][0]);
    m.v1 = sec(owner[m.vowel][1] + 1);
    if (m.coda?.length) m.codaC1 = sec(owner[m.coda[m.coda.length - 1]][1] + 1);
  }
  t0 = performance.now();
  const an2 = W.analyze(x, SR2, { framePeriod: FP, f0Floor: 80, f0Ceil: 1e3 }), bins = an2.bins;
  const energy = (f) => {
    let e = 0;
    for (let q2 = 0; q2 < bins; q2++) e += an2.sp[f * bins + q2];
    return 10 * Math.log10(e + 1e-30);
  };
  const BAND = [Math.round(500 / SR2 * an2.fft), Math.round(4e3 / SR2 * an2.fft)];
  const noisiness = (f) => {
    let s = 0;
    for (let q2 = BAND[0]; q2 < BAND[1]; q2++) s += an2.ap[f * bins + q2];
    return s / (BAND[1] - BAND[0]);
  };
  for (const m of moras) {
    const a0 = Math.ceil(m.v0 / FPS), mid = Math.floor((m.v0 + m.v1) / 2 / FPS);
    let on2 = -1;
    for (let f = a0; f <= mid; f++) if (noisiness(f) <= OPT.cleanMax) {
      on2 = f;
      break;
    }
    m.v0 = on2 >= 0 ? on2 * FPS : Math.min(m.v0 + OPT.vowelLag, (m.v0 + m.v1) / 2);
  }
  for (const m of moras) {
    const f0i = Math.ceil(m.v0 / FPS), f1i = Math.max(f0i + 1, Math.floor(m.v1 / FPS)), fr = [];
    for (let f = f0i; f < f1i; f++) fr.push(f);
    const cleanest = Math.min(...fr.map(noisiness)), clean = (f) => noisiness(f) <= cleanest + 0.15;
    let best = fr.filter(clean).reduce((p2, f) => energy(f) > energy(p2) ? f : p2, fr.find(clean));
    let a = best, b = best;
    const floor = energy(best) - OPT.holdDb;
    while (a - 1 >= f0i && energy(a - 1) >= floor && clean(a - 1)) a--;
    while (b + 1 < f1i && energy(b + 1) >= floor && clean(b + 1)) b++;
    m.hold = { h0: a * FPS, h1: Math.max((b + 1) * FPS, a * FPS + FPS) };
    const best3 = [...fr].sort((p2, q2) => noisiness(p2) - noisiness(q2)).slice(0, Math.max(1, Math.ceil(fr.length / 3)));
    m.apClean = new Float64Array(bins);
    const col = new Float64Array(best3.length);
    for (let q2 = 0; q2 < bins; q2++) {
      best3.forEach((f, i) => col[i] = an2.ap[f * bins + q2]);
      col.sort();
      m.apClean[q2] = col[col.length >> 1];
    }
    let e = 0;
    for (let f = a; f <= b; f++) e += energy(f);
    m.levelDb = e / (b - a + 1);
    m.ownClean = best3.reduce((p2, f) => p2 + noisiness(f), 0) / best3.length;
    m.cleanFrames = best3;
  }
  {
    const tmpl = (ms2) => {
      const fr = ms2.flatMap((m) => m.cleanFrames);
      if (!fr.length) return null;
      const out = new Float64Array(bins), col = new Float64Array(fr.length);
      for (let q2 = 0; q2 < bins; q2++) {
        fr.forEach((f, i) => col[i] = an2.ap[f * bins + q2]);
        col.sort();
        out[q2] = col[col.length >> 1];
      }
      return out;
    };
    const tmplSp = (ms2) => {
      const fr = ms2.flatMap((m) => m.cleanFrames);
      if (!fr.length) return null;
      const out = new Float64Array(bins), col = new Float64Array(fr.length);
      for (let q2 = 0; q2 < bins; q2++) {
        fr.forEach((f, i) => col[i] = Math.log(an2.sp[f * bins + q2] + 1e-16));
        col.sort();
        out[q2] = Math.exp(col[col.length >> 1]);
      }
      return out;
    };
    const good = moras.filter((m) => m.ownClean <= OPT.cleanMax), all = tmpl(good), allSp = tmplSp(good);
    for (const m of moras) if (m.ownClean > OPT.cleanMax && !m.whisper) {
      const same = good.filter((g) => tokens[g.vowel] === tokens[m.vowel]);
      m.apClean = tmpl(same) ?? all ?? m.apClean;
      m.spClean = tmplSp(same) ?? allSp ?? void 0;
      m.borrowed = (tmpl(same) ?? all) !== null;
    }
    log(`whispered vowels sung from a clean sample of the same vowel: ${moras.filter((m) => m.borrowed).map((m) => m.kana).join(" ") || "none"}`);
  }
  {
    const lv = moras.filter((m) => m.ownClean <= OPT.cleanMax).map((m) => m.levelDb).sort((p2, q2) => p2 - q2), med = lv[lv.length >> 1];
    for (const m of moras) m.gainDb = (m.ownClean > OPT.cleanMax ? 0 : Math.max(-OPT.levelMaxDb, Math.min(OPT.levelMaxDb, OPT.level * (med - m.levelDb)))) + (m.whisper ? OPT.whisperDb : 0);
  }
  let t = OPT.leadIn + leadRest * EIGHTH;
  const notes = [];
  SCORE.forEach((s, k) => {
    const m = moras[k];
    m.noteStart = t;
    for (const [midi, len] of s.notes) {
      notes.push({ k, midi, t0: t, t1: t + len * EIGHTH });
      t += len * EIGHTH;
    }
    m.noteEnd = t;
    m.rest = (s.rest || 0) > 0;
    t += (s.rest || 0) * EIGHTH;
    m.end = m.noteEnd;
  });
  moras.forEach((m, k) => {
    if (!m.mark || k === 0) return;
    const prev = moras[k - 1];
    if (prev.rest) return;
    const noteLen = prev.noteEnd - prev.noteStart, cons = Math.min(m.v0 - m.c0, OPT.consonantCap * noteLen);
    const want = m.mark === "^" ? OPT.lift : Math.min(OPT.gap[m.mark].max, OPT.gap[m.mark].share * noteLen);
    prev.end = prev.noteEnd - Math.min(want + cons, 0.6 * noteLen);
    prev.rest = true;
    prev.stolen = true;
  });
  moras.forEach((m, k) => {
    let len = m.v0 - m.c0;
    if (SCORE[k].hum && OPT.humConsMin > 0 && m.cons.some((i) => !isMark(tokens[i]) && tokens[i] !== "_")) len = Math.max(len, OPT.humConsMin);
    if (k > 0 && (!moras[k - 1].rest || moras[k - 1].stolen)) len = Math.min(len, OPT.consonantCap * (moras[k - 1].noteEnd - moras[k - 1].noteStart));
    m.preStart = m.noteStart - len;
  });
  const segs = [];
  const seg = (s0, s1, c0, c1, kind, k, hold = false) => {
    if (s1 > s0 + 1e-9) segs.push({ s0, s1, c0, c1, kind, k, hold });
  };
  seg(0, moras[0].preStart, 0, moras[0].c0, "lead", -1);
  moras.forEach((m, k) => {
    seg(m.preStart, m.noteStart, m.c0, m.v0, "cons", k);
    const sEnd0 = k + 1 < moras.length && !m.rest ? moras[k + 1].preStart : m.end;
    const codaLen = m.codaC1 ? Math.min(m.codaC1 - m.v1, 0.45 * (sEnd0 - m.noteStart)) : 0, sEnd = sEnd0 - codaLen;
    const L = sEnd - m.noteStart, last = k + 1 === moras.length, fade = (m.rest || last) && !codaLen ? OPT.release : 0;
    m.fade = fade > 0 ? [sEnd - Math.min(fade, 0.4 * L), sEnd] : null;
    const { h0, h1 } = m.hold, tailC = fade > 0 ? 0 : Math.min(OPT.tailIntoNext, m.v1 - h1);
    const attC = h0 - m.v0;
    if (L <= attC + tailC + 0.02) seg(m.noteStart, sEnd, m.v0, fade > 0 ? h1 : m.v1, "vowel", k);
    else {
      seg(m.noteStart, m.noteStart + attC, m.v0, h0, "vowel", k);
      seg(m.noteStart + attC, sEnd - tailC, h0, h1, "vowel", k, true);
      if (tailC > 0) seg(sEnd - tailC, sEnd, m.v1 - tailC, m.v1, "vowel", k, "tail");
    }
    if (codaLen > 0) {
      seg(sEnd, sEnd0, m.v1, m.codaC1, "cons", k, "coda");
      m.codaFade = [sEnd0 - Math.min(0.04, codaLen / 2), sEnd0];
    }
    if (m.rest && k + 1 < moras.length) seg(m.end, moras[k + 1].preStart, m.codaC1 ?? m.v1, moras[k + 1].c0, "rest", k);
  });
  const songEnd = moras[moras.length - 1].noteEnd;
  const ATLAS_VOWEL = (tok) => {
    if (LANG !== "zh") return /^N/.test(tok) ? "N" : VOWEL.has(tok) ? tok : null;
    const c = tok[0];
    return { a: "a", i: "i", u: "u", y: "i", e: "e", "\u0259": "e", "\u0264": "o", o: "o", "\u027B": "i", "\u0268": "i", "\u025A": "e" }[c] ?? null;
  };
  let atlas = null;
  if (ATLAS !== "off") {
    const exprId = { strong: "strong", soft: "soft", deep: "deep", bright: "bright" }[ATLAS];
    if (ATLAS !== "normal" && !exprId) throw new Error(`--atlas=${ATLAS}: unknown (normal|strong|soft|deep|bright|off)`);
    const normal = await Promise.all(["B3", "Ds4", "G4", "B4"].map((id) => loadAtlas(id)));
    atlas = ATLAS === "normal" ? normal : [await loadAtlas(exprId)];
    for (const a of [...normal, ...atlas]) {
      const e = a.entries[0];
      if (!e || e.bins !== bins || e.fft !== an2.fft || a.framePeriodMs !== FP) throw new Error(`atlas ${a.set}: bins/fft/frame period differ from this analysis`);
    }
    if (ATLAS !== "normal") {
      const a = atlas[0], ref = [...normal].sort((p2, q2) => Math.abs(p2.midi - a.midi) - Math.abs(q2.midi - a.midi))[0];
      a.exprOffset = {};
      for (const v of ["a", "i", "u", "e", "o", "N"]) {
        const mean = (set) => {
          const es2 = set.entries.filter((e) => e.vowel === v);
          return es2.length ? es2.reduce((s, e) => s + e.energyDb, 0) / es2.length : NaN;
        };
        const d = mean(a) - mean(ref);
        a.exprOffset[v] = isFinite(d) ? d : 0;
      }
      log(`\u56FE\u8C31 ${ATLAS} vs ${ref.set}: loudness offset per vowel dB ${JSON.stringify(Object.fromEntries(Object.entries(a.exprOffset).map(([k, x2]) => [k, +x2.toFixed(1)])))}`);
    }
  }
  function atlasFrame(m, midi, tau, k) {
    const v = ATLAS_VOWEL(tokens[m.vowel]);
    if (!v) return null;
    let mixSets;
    if (atlas.length === 1) mixSets = [{ a: atlas[0], w: 1 }];
    else {
      const sorted = [...atlas].sort((p2, q2) => p2.midi - q2.midi);
      let lo2 = sorted[0], hi = sorted[sorted.length - 1];
      for (let i = 0; i + 1 < sorted.length; i++) if (midi >= sorted[i].midi && midi <= sorted[i + 1].midi) {
        lo2 = sorted[i];
        hi = sorted[i + 1];
      }
      const w = midi <= lo2.midi ? 0 : midi >= hi.midi ? 1 : (midi - lo2.midi) / (hi.midi - lo2.midi);
      mixSets = w === 0 ? [{ a: lo2, w: 1 }] : w === 1 ? [{ a: hi, w: 1 }] : [{ a: lo2, w: 1 - w }, { a: hi, w }];
    }
    const logsp = new Float64Array(bins), apo = new Float64Array(bins);
    let used = 0;
    for (const { a, w } of mixSets) {
      const es2 = a.entries.filter((e2) => e2.vowel === v);
      if (!es2.length) continue;
      const e = es2[k % es2.length], L = e.frames, idx0 = Math.floor(tau / FPS);
      let i = idx0 % Math.max(1, 2 * L - 2);
      if (i >= L) i = 2 * L - 2 - i;
      const gdb = Math.max(-OPT.atlasGainClamp, Math.min(OPT.atlasGainClamp, m.levelDb - e.energyDb)) + OPT.atlasExprLevel * (a.exprOffset?.[v] ?? 0);
      const base = (e.frame0 + i) * bins * 2, gain = gdb / 10 * Math.LN10;
      for (let q2 = 0; q2 < bins; q2++) {
        logsp[q2] += w * (Math.log(a.data[base + q2] + 1e-16) + gain);
        apo[q2] += w * a.data[base + bins + q2];
      }
      used += w;
    }
    if (used <= 0) return null;
    if (used < 0.999) for (let q2 = 0; q2 < bins; q2++) {
      logsp[q2] /= used;
      apo[q2] /= used;
    }
    return { logsp, ap: apo };
  }
  function breathTemplate(m, midi, k) {
    const fr = atlas ? atlasFrame(m, midi, 0, k) : null;
    const logsp = new Float64Array(bins);
    if (fr) logsp.set(fr.logsp);
    else {
      const src = m.spClean ?? null;
      for (let q2 = 0; q2 < bins; q2++) logsp[q2] = Math.log((src ? src[q2] : an2.sp[Math.ceil(m.hold.h0 / FPS) * bins + q2]) + 1e-16);
    }
    const tilt = Math.round(OPT.atlasTiltHz / SR2 * an2.fft);
    for (let q2 = 0; q2 < bins; q2++) if (q2 > tilt) logsp[q2] += Math.log(0.25) * Math.min(1, (q2 - tilt) / tilt);
    let e = 0;
    for (let q2 = 0; q2 < bins; q2++) e += Math.exp(logsp[q2]);
    const db = 10 * Math.log10(e + 1e-30);
    const want = m.levelDb + OPT.breathDb, g = (want - db) / 10 * Math.LN10;
    for (let q2 = 0; q2 < bins; q2++) logsp[q2] += g;
    return logsp;
  }
  const midiOf = (k) => notes.find((n) => n.k === k).midi;
  const N2 = Math.ceil(songEnd / FPS) + 1;
  const pitchSegs = [...notes, ...moras.map((m, k) => ({ t0: m.preStart, t1: m.noteStart, midi: notes.find((n) => n.k === k).midi }))];
  const cents = new Float64Array(N2).fill(NaN);
  for (let j = 0; j < N2; j++) {
    const tt = j * FPS;
    const s = pitchSegs.find((q2) => tt >= q2.t0 && tt < q2.t1);
    if (s) cents[j] = s.midi * 100;
  }
  const half = Math.max(1, Math.round(OPT.portamentoMs / 2 / FP)), smooth = Float64Array.from(cents);
  for (let j = 0; j < N2; j++) {
    if (isNaN(cents[j])) continue;
    let s = 0, c = 0;
    for (let q2 = j - half; q2 <= j + half; q2++) if (q2 >= 0 && q2 < N2 && !isNaN(cents[q2])) {
      s += cents[q2];
      c++;
    }
    smooth[j] = s / c;
  }
  for (const n of notes) {
    const V = OPT.vibrato;
    if (n.t1 - n.t0 < V.minNote) continue;
    for (let j = Math.ceil((n.t0 + V.delay) / FPS); j * FPS < n.t1 && j < N2; j++) {
      const u = j * FPS - n.t0 - V.delay;
      smooth[j] += V.cents * Math.min(1, u / V.fadeIn) * Math.sin(2 * Math.PI * V.hz * u);
    }
  }
  const onlyK = only ? SRC.slice(0, only.entry).reduce((a, e) => a + (e.moras || 1), 0) : -1;
  const onlyM = only ? moras[Math.min(onlyK, moras.length - 1)] : null;
  const J0 = onlyM ? Math.max(0, Math.floor(onlyM.preStart / FPS)) : 0, J1 = onlyM ? Math.min(N2, Math.ceil(onlyM.end / FPS) + 1) : N2, NN = J1 - J0;
  const sp = new Float64Array(NN * bins), ap = new Float64Array(NN * bins), f0 = new Float64Array(NN);
  let repaired = 0, vowelFrames = 0, atlasFrames = 0, holdFrames = 0, breaths = /* @__PURE__ */ new Map();
  const breathSp = /* @__PURE__ */ new Map();
  for (let j = J0; j < J1; j++) {
    const jj = j - J0;
    const tt = j * FPS, s = segs.find((q2) => tt >= q2.s0 && tt < q2.s1) ?? (tt >= songEnd ? segs[segs.length - 1] : null);
    if (!s) continue;
    const c = s.c0 + (Math.min(tt, s.s1) - s.s0) / (s.s1 - s.s0) * (s.c1 - s.c0), fi = Math.min(an2.frames - 1, c / FPS);
    const a = Math.floor(fi), b = Math.min(an2.frames - 1, a + 1), w = fi - a;
    for (let q2 = 0; q2 < bins; q2++) {
      sp[jj * bins + q2] = Math.exp((1 - w) * Math.log(an2.sp[a * bins + q2] + 1e-16) + w * Math.log(an2.sp[b * bins + q2] + 1e-16));
      ap[jj * bins + q2] = (1 - w) * an2.ap[a * bins + q2] + w * an2.ap[b * bins + q2];
    }
    const srcVoiced = an2.f0[a] > 0 || an2.f0[b] > 0, sung = !isNaN(smooth[j]);
    if (s.kind === "rest" || s.kind === "lead") {
      for (let q2 = 0; q2 < bins; q2++) sp[jj * bins + q2] *= 1e-6;
      const nk = s.kind === "lead" ? 0 : s.k + 1, mark = s.kind === "lead" ? moras[0]?.inhale ? moras[0].mark ?? "v" : "v" : moras[nk]?.mark ?? null;
      const audible = BREATH || !!moras[nk]?.inhale;
      const restLen = s.s1 - s.s0, stolen = s.kind === "rest" && !!moras[s.k].stolen, longEnough = s.kind === "lead" || restLen >= OPT.breathMinRest * EIGHTH - 1e-6;
      const g = OPT.gap[mark === "O" ? "O" : "v"];
      if (audible && nk < moras.length && mark !== "^" && (stolen || longEnough || moras[nk]?.inhale)) {
        const bl = Math.min(g.max, 0.8 * restLen), b0 = s.s1 - bl, boost = 10 ** (g.db / 10);
        if (tt >= b0) {
          if (!breathSp.has(nk)) breathSp.set(nk, breathTemplate(moras[nk], midiOf(nk), nk));
          const u = (tt - b0) / bl, env = u < 0.7 ? 0.5 - 0.5 * Math.cos(Math.PI * u / 0.7) : 0.5 + 0.5 * Math.cos(Math.PI * (u - 0.7) / 0.3);
          const tpl = breathSp.get(nk);
          for (let q2 = 0; q2 < bins; q2++) {
            sp[jj * bins + q2] = Math.exp(tpl[q2]) * env * env * boost;
            ap[jj * bins + q2] = 1;
          }
          f0[jj] = 0;
          breaths.set(nk, mark === "O" ? "O" : "v");
        }
      }
    }
    if (s.kind === "vowel" && sung && moras[s.k].whisper) vowelFrames++;
    else if (s.kind === "vowel" && sung) {
      vowelFrames++;
      f0[jj] = 440 * 2 ** ((smooth[j] - 6900) / 1200);
      const m = moras[s.k];
      let changed = false;
      if (m.spClean) sp.set(m.spClean, jj * bins);
      for (let q2 = 0; q2 < bins; q2++) {
        const v = ap[jj * bins + q2], c2 = m.apClean[q2];
        if (v > c2) {
          ap[jj * bins + q2] = c2 + OPT.breath * (v - c2);
          changed = true;
        }
      }
      if (changed && !srcVoiced) repaired++;
      if (atlas && s.hold) {
        holdFrames++;
        const holdSeg = s.hold === true ? s : segs.find((q2) => q2.kind === "vowel" && q2.k === s.k && q2.hold === true);
        const tau = tt - (holdSeg ? holdSeg.s0 : s.s0), total = s.s1 - s.s0, xf = Math.max(1e-3, Math.min(OPT.atlasXfade, total / 3));
        let wa;
        if (s.hold === "tail") {
          wa = holdSeg ? MIX * (1 - (tt - s.s0) / total) : 0;
        } else {
          const fadeOut = moras[s.k].fade ? Math.min(1, (total - (tt - s.s0)) / xf) : 1;
          wa = MIX * Math.min(1, (tt - s.s0) / xf, fadeOut);
        }
        const fr = wa > 0 ? atlasFrame(m, midiOf(s.k), tau, s.k) : null;
        if (fr) {
          atlasFrames++;
          for (let q2 = 0; q2 < bins; q2++) {
            sp[jj * bins + q2] = Math.exp((1 - wa) * Math.log(sp[jj * bins + q2] + 1e-16) + wa * fr.logsp[q2]);
            ap[jj * bins + q2] = (1 - wa) * ap[jj * bins + q2] + wa * fr.ap[q2];
          }
        }
      }
    }
    const fm = s.kind === "vowel" ? moras[s.k].fade : s.kind === "cons" && s.hold === "coda" ? moras[s.k].codaFade : null;
    if (fm && tt >= fm[0]) {
      const g = Math.max(0.01, 1 - (tt - fm[0]) / (fm[1] - fm[0]));
      for (let q2 = 0; q2 < bins; q2++) sp[jj * bins + q2] *= g * g;
    }
    if (OPT.levelContinuous && (s.kind === "vowel" || s.kind === "cons") && s.k >= 0) {
      const m = moras[s.k], pm = s.k > 0 ? moras[s.k - 1] : null, g0 = pm && !(pm.rest && !pm.stolen) ? pm.gainDb : 0;
      const w2 = Math.min(1, Math.max(0, (tt - m.preStart) / Math.max(0.03, m.noteStart + 0.03 - m.preStart))), gg = 10 ** ((g0 + w2 * (m.gainDb - g0)) / 10);
      for (let q2 = 0; q2 < bins; q2++) sp[jj * bins + q2] *= gg;
    } else if (s.kind === "vowel" && s.k >= 0) {
      const m = moras[s.k], w2 = Math.min(1, Math.max(0, (tt - m.noteStart) / 0.03)), gg = 10 ** (w2 * m.gainDb / 10);
      for (let q2 = 0; q2 < bins; q2++) sp[jj * bins + q2] *= gg;
    }
    if (s.kind === "cons" && sung && srcVoiced && noisiness(a) <= 0.5 && noisiness(b) <= 0.5 && !moras[s.k]?.whisper) f0[jj] = 440 * 2 ** ((smooth[j] - 6900) / 1200);
  }
  const y = W.synth({ f0, sp, ap, fft: an2.fft, fs: SR2, framePeriod: FP });
  const worldMs = performance.now() - t0;
  function finish(sig) {
    const fade = Math.round(0.03 * SR2), n = sig.length, out = new Float32Array(n + Math.round(OPT.tail * SR2));
    let m = 1e-9;
    for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(sig[i]));
    for (let i = 0; i < n; i++) out[i] = sig[i] / m * 0.89 * (i > n - fade ? (n - i) / fade : 1);
    return out;
  }
  return { sung: finish(y), y, x, SR: SR2, finish, internals: {
    tokens,
    moras,
    notes,
    segs,
    an: an2,
    sp,
    ap,
    f0,
    N: N2,
    bins,
    FP,
    FPS,
    EIGHTH,
    songEnd,
    noisiness,
    atlas,
    breaths,
    repaired,
    vowelFrames,
    atlasFrames,
    holdFrames,
    piperMs,
    worldMs,
    ATLAS_VOWEL,
    midiOf,
    OPT
  } };
}

// src/singer/world-wrap.mjs
function wrapWorld(M) {
  const put = (arr) => {
    const p = M._malloc(arr.length * 8);
    M.HEAPF64.set(arr, p / 8);
    return p;
  };
  function analyze(x, fs2, { framePeriod = 5, f0Floor = 80, f0Ceil = 1e3 } = {}, hooks = null) {
    const px = put(Float64Array.from(x));
    try {
      hooks?.stage?.("f0");
      hooks?.check?.();
      const a = M._w_f0(px, x.length, fs2, framePeriod, f0Floor, f0Ceil);
      try {
        hooks?.stage?.("sp");
        hooks?.check?.();
        M._w_sp(a, px, x.length, fs2, f0Floor);
        hooks?.stage?.("ap");
        hooks?.check?.();
        M._w_ap(a, px, x.length, fs2);
        const frames = M._w_frames(a), fft = M._w_fft(a), bins = fft / 2 + 1;
        const view = (p, n) => M.HEAPF64.slice(p / 8, p / 8 + n);
        return { frames, fft, bins, framePeriod, fs: fs2, f0: view(M._w_f0_ptr(a), frames), sp: view(M._w_sp_ptr(a), frames * bins), ap: view(M._w_ap_ptr(a), frames * bins) };
      } finally {
        M._w_free(a);
      }
    } finally {
      M._free(px);
    }
  }
  function synth({ f0, sp, ap, fft, fs: fs2, framePeriod }) {
    const frames = f0.length, n = M._w_synth_len(frames, fs2, framePeriod);
    const pf = put(f0), ps2 = put(sp), pa = put(ap), py = M._malloc(n * 8);
    M._w_synth(pf, frames, ps2, pa, fft, fs2, framePeriod, py);
    const y = M.HEAPF64.slice(py / 8, py / 8 + n);
    [pf, ps2, pa, py].forEach((p) => M._free(p));
    return y;
  }
  return { analyze, synth };
}

// src/singer/speech-cache.ts
var f32 = new Float32Array(1);
var u32 = new Uint32Array(f32.buffer);
function toBf16(x) {
  const out = new Uint16Array(x.length);
  for (let i = 0; i < x.length; i++) {
    f32[0] = x[i];
    const b = u32[0];
    out[i] = b + 32767 + (b >>> 16 & 1) >>> 16 & 65535;
  }
  return out;
}
function fromBf16(x) {
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    u32[0] = x[i] << 16;
    out[i] = f32[0];
  }
  return out;
}
var SpeechCache = class {
  map = /* @__PURE__ */ new Map();
  // 插入顺序 = 最久没用的在前
  bytes = 0;
  /** 分析按它来自哪段 piper 输出记（同一个 Float32Array 对象 → 同一次念） */
  audioKey = /* @__PURE__ */ new WeakMap();
  /** 最近一次解好码的分析（按键试听连按同一句：不用每次把 bf16 解成 Float64 ≈ 1M 个数）。交出去的不拷贝——唱法核心不就地改这些数组（core 里 grep 过）。 */
  hot = null;
  hits = 0;
  misses = 0;
  diskHits = 0;
  budget;
  store = null;
  model = "";
  touched = /* @__PURE__ */ new Map();
  // 盘上的 at 一分钟最多碰一次
  diskKeys = /* @__PURE__ */ new Map();
  // 内存键 → 盘键（算过一次就记着）
  warned = false;
  constructor(budget = 32e6) {
    this.budget = budget;
  }
  // 不用参数属性：Node 的 strip-only TS 不认
  get used() {
    return this.bytes;
  }
  setBudget(b) {
    this.budget = b;
    this.trim();
  }
  touch(k, e) {
    this.map.delete(k);
    this.map.set(k, e);
  }
  put(k, e) {
    const old = this.map.get(k);
    if (old) {
      this.bytes -= old.bytes;
      this.map.delete(k);
    }
    this.map.set(k, e);
    this.bytes += e.bytes;
    this.trim();
  }
  trim() {
    for (const [k, e] of this.map) {
      if (this.bytes <= this.budget) break;
      this.map.delete(k);
      this.bytes -= e.bytes;
    }
  }
  clear() {
    this.map.clear();
    this.bytes = 0;
    this.hot = null;
  }
  /** 接上持久层；model = 模型配置标签（语音包 + 运行时包的 id）：换模型 = 另一组键。 */
  attachStore(store2, model) {
    this.store = store2;
    this.model = model;
    this.diskKeys.clear();
  }
  get disk() {
    return this.store;
  }
  async diskKey(kind, memKey, sub = "") {
    const id = `${kind}|${memKey}`;
    let h = this.diskKeys.get(id);
    if (!h) {
      h = await sha256(memKey);
      this.diskKeys.set(id, h);
    }
    return `${this.model}|${kind}|${h}${sub}`;
  }
  diskFail(e) {
    if (this.warned) return;
    this.warned = true;
    console.warn("speech store: " + (e?.message ?? e));
  }
  touchDisk(diskKey) {
    const t = Date.now();
    if ((this.touched.get(diskKey) ?? 0) > t - 6e4) return;
    this.touched.set(diskKey, t);
    this.store?.touch(diskKey).catch((e) => this.diskFail(e));
  }
  /** run 回来那一刻：这一句念的分析（可能几份：不同 fs / 参数）从盘上预取进内存，让同步的 analyze 能命中。 */
  async prefetchAnalyses(pKey) {
    if (!this.store) return;
    for (const k of this.map.keys()) if (k.startsWith(`a:${pKey}:`)) return;
    try {
      const prefix = await this.diskKey("a", pKey, "|");
      for (const { key, e } of await this.store.scan(prefix)) {
        if (e.kind !== "a" || this.map.has(e.k)) continue;
        this.put(e.k, { bytes: e.bytes, an: { meta: e.meta, f0: e.f0, sp: e.sp, ap: e.ap } });
        this.diskKeys.set(`a|${e.k}`, key.slice(prefix.length - 1 - 64, prefix.length - 1));
        this.diskHits++;
      }
    } catch (e) {
      this.diskFail(e);
    }
  }
  wrapPiper(piper) {
    const self2 = this, run = piper.run.bind(piper);
    return { ...piper, run: async (ids, pros, o) => {
      const k = "p:" + JSON.stringify([ids, pros, o]);
      let had = self2.map.get(k);
      if (!had?.run && self2.store) {
        try {
          const dk = await self2.diskKey("p", k), e = await self2.store.get(dk);
          if (e?.kind === "p") {
            had = { bytes: e.bytes, run: { audio: e.audio, durations: e.durations } };
            self2.put(k, had);
            self2.diskHits++;
            self2.touchDisk(dk);
          }
        } catch (e) {
          self2.diskFail(e);
        }
      }
      if (had?.run) {
        self2.hits++;
        self2.touch(k, had);
        const a = had.run.audio.slice();
        self2.audioKey.set(a, k);
        await self2.prefetchAnalyses(k);
        return { audio: a, durations: had.run.durations?.slice() };
      }
      self2.misses++;
      const r = await run(ids, pros, o);
      const keep = { audio: r.audio.slice(), durations: r.durations?.slice() };
      self2.put(k, { bytes: keep.audio.byteLength + (keep.durations?.byteLength ?? 0), run: keep });
      self2.audioKey.set(r.audio, k);
      if (self2.store) void self2.diskKey("p", k).then((dk) => self2.store.put(dk, { kind: "p", k, bytes: keep.audio.byteLength + (keep.durations?.byteLength ?? 0), audio: keep.audio, durations: keep.durations })).catch((e) => self2.diskFail(e));
      await self2.prefetchAnalyses(k);
      return r;
    } };
  }
  wrapWorld(world) {
    const self2 = this, analyze = world.analyze.bind(world);
    return { ...world, analyze: (x, fs2, o, hooks = null) => {
      const from = x instanceof Float32Array ? self2.audioKey.get(x) : void 0;
      const k = from ? `a:${from}:${fs2}:${JSON.stringify(o ?? {})}` : null;
      const had = k ? self2.map.get(k) : void 0;
      if (had?.an) {
        self2.hits++;
        self2.touch(k, had);
        hooks?.stage?.("cached");
        hooks?.check?.();
        if (self2.store && from) void self2.diskKey("a", from, `|${self2.diskKeys.get(`a|${k}`) ?? ""}`).then((dk) => {
          if (self2.diskKeys.has(`a|${k}`)) self2.touchDisk(dk);
        }).catch(() => void 0);
        if (self2.hot?.key === k) return self2.hot.an;
        const an3 = { ...had.an.meta, f0: had.an.f0.slice(), sp: fromBf16(had.an.sp), ap: fromBf16(had.an.ap) };
        self2.hot = { key: k, an: an3 };
        return an3;
      }
      self2.misses++;
      const an2 = analyze(x, fs2, o, hooks), { f0, sp, ap, ...meta } = an2, spB = toBf16(sp), apB = toBf16(ap);
      if (k) {
        const bytes = f0.byteLength + spB.byteLength + apB.byteLength, f0c = f0.slice();
        self2.put(k, { bytes, an: { meta, f0: f0c, sp: spB, ap: apB } });
        if (self2.store && from) void Promise.all([self2.diskKey("a", from, "|"), sha256(k)]).then(([pre, h]) => {
          self2.diskKeys.set(`a|${k}`, h);
          return self2.store.put(pre + h, { kind: "a", k, bytes, meta: structuredClone(meta), f0: f0c, sp: spB, ap: apB });
        }).catch((e) => self2.diskFail(e));
      }
      const outAn = { ...meta, f0, sp: fromBf16(spB), ap: fromBf16(apB) };
      if (k) self2.hot = { key: k, an: outAn };
      return outAn;
    } };
  }
};
async function sha256(text) {
  const sub = globalThis.crypto?.subtle;
  if (sub) {
    const d = await sub.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(d)].map((b2) => b2.toString(16).padStart(2, "0")).join("");
  }
  let a = 2166136261, b = 16777619 ^ 1540483477;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619);
    b = Math.imul(b ^ c, 16777619) ^ b >>> 13;
  }
  return ((a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0")).padEnd(64, "0");
}

// src/singer/speech-store.ts
var STORE = "entries";
var META = "meta";
var DB_VERSION = 1;
var req = (r) => new Promise((ok, fail) => {
  r.onsuccess = () => ok(r.result);
  r.onerror = () => fail(r.error ?? new Error("idb"));
});
var done = (tx) => new Promise((ok, fail) => {
  tx.oncomplete = () => ok();
  tx.onerror = () => fail(tx.error ?? new Error("idb tx"));
  tx.onabort = () => fail(tx.error ?? new Error("idb abort"));
});
var strip = (r) => {
  const { key: _k, at: _a, ...e } = r;
  return e;
};
async function openSpeechStore(name, budget) {
  const idb = globalThis.indexedDB;
  if (!idb) return null;
  let db;
  try {
    db = await new Promise((ok, fail) => {
      const r = idb.open(name, DB_VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "key" }).createIndex("at", "at");
        if (!d.objectStoreNames.contains(META)) d.createObjectStore(META, { keyPath: "key" });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fail(r.error ?? new Error("idb open"));
      r.onblocked = () => fail(new Error("idb blocked"));
    });
  } catch {
    return null;
  }
  let budgetNow = budget;
  const total = async (tx) => (await req(tx.objectStore(META).get("total")))?.bytes ?? 0;
  const setTotal = (tx, bytes) => tx.objectStore(META).put({ key: "total", bytes: Math.max(0, bytes) });
  return {
    async get(key) {
      const tx = db.transaction(STORE, "readonly"), r = await req(tx.objectStore(STORE).get(key));
      return r ? strip(r) : null;
    },
    async put(key, e) {
      const tx = db.transaction([STORE, META], "readwrite"), s = tx.objectStore(STORE);
      const old = await req(s.get(key));
      let t = await total(tx) - (old?.bytes ?? 0) + e.bytes;
      s.put({ key, at: Date.now(), ...e });
      if (t > budgetNow) {
        const cur = s.index("at").openCursor();
        await new Promise((ok, fail) => {
          cur.onerror = () => fail(cur.error ?? new Error("idb cursor"));
          cur.onsuccess = () => {
            const c = cur.result;
            if (!c || t <= budgetNow) {
              ok();
              return;
            }
            const r = c.value;
            if (r.key !== key) {
              t -= r.bytes;
              c.delete();
            }
            c.continue();
          };
        });
      }
      setTotal(tx, t);
      await done(tx);
    },
    async scan(prefix) {
      const tx = db.transaction(STORE, "readonly");
      const rs2 = await req(tx.objectStore(STORE).getAll(IDBKeyRange.bound(prefix, prefix + "\uFFFF")));
      return rs2.map((r) => ({ key: r.key, e: strip(r) }));
    },
    async touch(key) {
      const tx = db.transaction(STORE, "readwrite"), s = tx.objectStore(STORE), r = await req(s.get(key));
      if (r) {
        r.at = Date.now();
        s.put(r);
      }
      await done(tx);
    },
    async info() {
      const tx = db.transaction([STORE, META], "readonly");
      const [bytes, entries] = await Promise.all([total(tx), req(tx.objectStore(STORE).count())]);
      return { bytes, entries, budget: budgetNow };
    },
    async clear() {
      const tx = db.transaction([STORE, META], "readwrite");
      tx.objectStore(STORE).clear();
      setTotal(tx, 0);
      await done(tx);
    },
    setBudget(b) {
      budgetNow = b;
    }
  };
}

// node_modules/@internal/model-packs/dist/sha256.js
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
var Sha256 = class {
  h = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
  buf = new Uint8Array(64);
  bufLen = 0;
  total = 0;
  w = new Uint32Array(64);
  done = false;
  update(bytes) {
    if (this.done)
      throw new Error("Sha256: update after hex()");
    let i = 0;
    this.total += bytes.length;
    if (this.bufLen) {
      const take = Math.min(64 - this.bufLen, bytes.length);
      this.buf.set(bytes.subarray(0, take), this.bufLen);
      this.bufLen += take;
      i = take;
      if (this.bufLen === 64) {
        this.block(this.buf, 0);
        this.bufLen = 0;
      }
    }
    for (; i + 64 <= bytes.length; i += 64)
      this.block(bytes, i);
    if (i < bytes.length) {
      this.buf.set(bytes.subarray(i), 0);
      this.bufLen = bytes.length - i;
    }
    return this;
  }
  block(p, o) {
    const w = this.w, H = this.h;
    for (let t = 0; t < 16; t++, o += 4)
      w[t] = p[o] << 24 | p[o + 1] << 16 | p[o + 2] << 8 | p[o + 3];
    for (let t = 16; t < 64; t++) {
      const x = w[t - 15], y = w[t - 2];
      const s0 = (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ x >>> 3;
      const s1 = (y >>> 17 | y << 15) ^ (y >>> 19 | y << 13) ^ y >>> 10;
      w[t] = w[t - 16] + s0 + w[t - 7] + s1 | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let t = 0; t < 64; t++) {
      const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      const ch = e & f ^ ~e & g;
      const t1 = h + S1 + ch + K[t] + w[t] | 0;
      const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      const maj = a & b ^ a & c ^ b & c;
      const t2 = S0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H[0] += a;
    H[1] += b;
    H[2] += c;
    H[3] += d;
    H[4] += e;
    H[5] += f;
    H[6] += g;
    H[7] += h;
  }
  hex() {
    if (this.done)
      throw new Error("Sha256: hex() twice");
    const total = this.total;
    const padLen = (this.bufLen < 56 ? 56 - this.bufLen : 120 - this.bufLen) + 8;
    const pad = new Uint8Array(padLen);
    pad[0] = 128;
    const bits = total * 8, hi = Math.floor(bits / 4294967296), lo2 = bits >>> 0, n = padLen;
    pad[n - 8] = hi >>> 24;
    pad[n - 7] = hi >>> 16;
    pad[n - 6] = hi >>> 8;
    pad[n - 5] = hi;
    pad[n - 4] = lo2 >>> 24;
    pad[n - 3] = lo2 >>> 16;
    pad[n - 2] = lo2 >>> 8;
    pad[n - 1] = lo2;
    this.total -= padLen;
    this.update(pad);
    this.done = true;
    return Array.from(this.h, (x) => x.toString(16).padStart(8, "0")).join("");
  }
};

// node_modules/@internal/model-packs/dist/pack-store.js
var SLICE = 1 << 20;
function createPackStore(deps) {
  const cacheName = deps.cacheName ?? "pwa-models";
  const keyOf = (slug, name) => `${location.origin}/__pwa-models__/${slug}/${name}`;
  function manifestOf(slug) {
    const p = deps.packs[slug];
    if (!p)
      throw new Error(`unknown pack: ${slug}`);
    return p;
  }
  const openCache = () => caches.open(cacheName);
  async function hashBlob(b) {
    const sha = new Sha256();
    for (let o = 0; o < b.size; o += SLICE)
      sha.update(new Uint8Array(await b.slice(o, Math.min(o + SLICE, b.size)).arrayBuffer()));
    return sha.hex();
  }
  const verifiedBlobs = /* @__PURE__ */ new Map();
  const forget = (slug) => {
    verifiedBlobs.delete(slug);
  };
  async function cachedChunkSizes(slug, m) {
    const cache = await openCache();
    const sizes = [];
    for (const c of m.chunks) {
      const r = await cache.match(keyOf(slug, c.name));
      sizes.push(r ? Number(r.headers.get("content-length") ?? 0) : 0);
    }
    return sizes;
  }
  async function putChunk(slug, name, bytes) {
    forget(slug);
    const cache = await openCache();
    const size = bytes instanceof Blob ? bytes.size : bytes.length;
    await cache.put(keyOf(slug, name), new Response(bytes, { headers: { "content-length": String(size), "content-type": "application/octet-stream" } }));
  }
  async function markVerified(slug, packId) {
    const cache = await openCache();
    await cache.put(keyOf(slug, "verified.json"), new Response(JSON.stringify({ packId, at: (/* @__PURE__ */ new Date()).toISOString() }), { headers: { "content-type": "application/json" } }));
  }
  async function status(slug) {
    const { packId, manifest: m } = manifestOf(slug);
    const cache = await openCache();
    const sizes = await cachedChunkSizes(slug, m);
    const complete = sizes.every((n, i) => n === m.chunks[i].bytes);
    const marker = await cache.match(keyOf(slug, "verified.json"));
    const verified = marker ? (await marker.json()).packId === packId : false;
    return { slug, ready: complete && verified, bytesCached: sizes.reduce((a, b) => a + b, 0), bytesTotal: m.totalBytes };
  }
  async function dropIfStale(slug) {
    const { packId, manifest: m } = manifestOf(slug);
    const cache = await openCache();
    const marker = await cache.match(keyOf(slug, "verified.json"));
    if (!marker || (await marker.json()).packId === packId)
      return;
    forget(slug);
    for (const c of m.chunks)
      await cache.delete(keyOf(slug, c.name));
    await cache.delete(keyOf(slug, "verified.json"));
  }
  async function sealIfComplete(slug, fresh) {
    const { packId, manifest: m } = manifestOf(slug);
    const sizes = await cachedChunkSizes(slug, m);
    if (!sizes.every((n, i) => n === m.chunks[i].bytes))
      return;
    const cache = await openCache();
    for (const c of m.chunks) {
      if (fresh.has(c.name))
        continue;
      const r = await cache.match(keyOf(slug, c.name));
      const ok = !!r && await hashBlob(await r.blob()) === c.sha256;
      if (!ok) {
        await cache.delete(keyOf(slug, c.name));
        return;
      }
    }
    await markVerified(slug, packId);
  }
  async function download(slug, base, progress) {
    const { packId, manifest: m } = manifestOf(slug);
    await dropIfStale(slug);
    const sizes = await cachedChunkSizes(slug, m);
    let done2 = sizes.reduce((a, n, i) => a + (n === m.chunks[i].bytes ? n : 0), 0);
    progress({ done: done2, total: m.totalBytes });
    const root = base.replace(/\/+$/, "");
    for (let i = 0; i < m.chunks.length; i++) {
      const c = m.chunks[i];
      if (sizes[i] === c.bytes)
        continue;
      const res = await fetch(`${root}/packs/${slug}/${c.name}`, { cache: "no-store" });
      if (!res.ok || !res.body)
        throw new Error(`fetch ${c.name}: HTTP ${res.status}`);
      const reader = res.body.getReader();
      const sha = new Sha256();
      const buf = new Uint8Array(c.bytes);
      let got = 0, lastReported = 0;
      for (; ; ) {
        const { value, done: end } = await reader.read();
        if (end)
          break;
        if (got + value.length > c.bytes)
          throw new Error(`${c.name}: larger than manifest says`);
        sha.update(value);
        buf.set(value, got);
        got += value.length;
        if (got - lastReported >= 1048576 || got === c.bytes) {
          lastReported = got;
          progress({ done: done2 + got, total: m.totalBytes });
        }
      }
      if (got !== c.bytes)
        throw new Error(`${c.name}: got ${got} bytes, expected ${c.bytes}`);
      if (sha.hex() !== c.sha256)
        throw new Error(`${c.name}: sha256 mismatch (source tampered or corrupted)`);
      await putChunk(slug, c.name, buf);
      done2 += got;
    }
    await markVerified(slug, packId);
    return status(slug);
  }
  async function importFiles(slugs, files, progress) {
    const packs = slugs.map((slug) => ({ slug, m: manifestOf(slug).manifest }));
    for (const p of packs)
      await dropIfStale(p.slug);
    const fresh = new Map(packs.map((p) => [p.slug, /* @__PURE__ */ new Set()]));
    const total = files.reduce((a, f) => a + f.size, 0);
    let done2 = 0, matched = 0;
    const bad = [];
    for (const f of files) {
      const whole = packs.find((p) => p.m.chunks.length > 1 && p.m.totalBytes === f.size);
      if (whole) {
        let offset = 0;
        for (const c of whole.m.chunks) {
          const piece = f.slice(offset, offset + c.bytes);
          if (await hashBlob(piece) !== c.sha256)
            throw new Error(`${f.name}: sha256 mismatch at ${c.name} (wrong or corrupted file)`);
          await putChunk(whole.slug, c.name, piece);
          fresh.get(whole.slug).add(c.name);
          offset += c.bytes;
          progress({ done: done2 + offset, total });
        }
        matched++;
      } else {
        const sameSize = packs.flatMap((p) => p.m.chunks.filter((c) => c.bytes === f.size).map((c) => ({ slug: p.slug, c })));
        if (sameSize.length) {
          const hex = await hashBlob(f);
          const hits = sameSize.filter((x) => x.c.sha256 === hex);
          if (!hits.length)
            bad.push(f.name);
          for (const h of hits) {
            await putChunk(h.slug, h.c.name, f);
            fresh.get(h.slug).add(h.c.name);
          }
          if (hits.length)
            matched++;
        }
      }
      done2 += f.size;
      progress({ done: done2, total });
    }
    for (const p of packs)
      await sealIfComplete(p.slug, fresh.get(p.slug));
    if (bad.length)
      throw new Error(`${bad[0]}: sha256 mismatch (wrong or corrupted file)`);
    if (!matched)
      throw new Error("no-matching-file");
    return Promise.all(slugs.map(status));
  }
  async function downloadAll(slugs, base, progress) {
    const total = slugs.reduce((a, s) => a + manifestOf(s).manifest.totalBytes, 0);
    const have = (await Promise.all(slugs.map(status))).map((st) => st.bytesCached);
    const report = () => progress({ done: have.reduce((a, b) => a + b, 0), total });
    report();
    for (let i = 0; i < slugs.length; i++)
      await download(slugs[i], base, (p) => {
        have[i] = p.done;
        report();
      });
    return Promise.all(slugs.map(status));
  }
  async function deletePack(slug) {
    forget(slug);
    const { manifest: m } = manifestOf(slug);
    const cache = await openCache();
    for (const c of m.chunks)
      await cache.delete(keyOf(slug, c.name));
    await cache.delete(keyOf(slug, "verified.json"));
  }
  const noop = () => {
  };
  return {
    status: (slugs) => Promise.all(slugs.map(status)),
    download: (slugs, base, onProgress) => downloadAll(slugs, base, onProgress ?? noop),
    importFiles: (slugs, files, onProgress) => importFiles(slugs, files, onProgress ?? noop),
    async delete(slugs) {
      for (const slug of slugs)
        await deletePack(slug);
    },
    async chunks(slug) {
      const memo = verifiedBlobs.get(slug);
      if (memo)
        return memo.slice();
      if (!(await status(slug)).ready)
        throw new Error("pack-missing");
      const { manifest: m } = manifestOf(slug);
      const cache = await openCache();
      const out = [];
      for (const c of m.chunks) {
        const r = await cache.match(keyOf(slug, c.name));
        if (!r)
          throw new Error("pack-missing");
        const b = await r.blob();
        if (b.size !== c.bytes || await hashBlob(b) !== c.sha256) {
          await cache.delete(keyOf(slug, c.name));
          await cache.delete(keyOf(slug, "verified.json"));
          throw new Error(`pack-corrupt: ${slug}/${c.name} failed sha256 on read (cache tampered or corrupted; dropped it, download or import again)`);
        }
        out.push(b);
      }
      verifiedBlobs.set(slug, out);
      return out.slice();
    }
  };
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

// src/config.ts
var APP_NS = "moonsinger-5b1e7c0a92d34f6e";
var APP_DB_PREFIX = `${APP_NS}.`;
var CACHE_DBS = { thumbs: `${APP_NS}.thumbs`, facts: `${APP_NS}.facts`, speech: `${APP_NS}.speech`, renders: `${APP_NS}.renders` };
var WAKE_CHECK_AFTER_MS = 10 * 6e4;

// node_modules/@internal/read-aloud/backend/piper-plus/vendor/onnxruntime-web/ort.wasm.bundle.min.mjs
var ort_wasm_bundle_min_exports = {};
__export(ort_wasm_bundle_min_exports, {
  InferenceSession: () => rs,
  TRACE: () => Cr,
  TRACE_EVENT_BEGIN: () => Pe,
  TRACE_EVENT_END: () => Ue,
  TRACE_FUNC_BEGIN: () => _e,
  TRACE_FUNC_END: () => De,
  Tensor: () => de,
  default: () => iu,
  env: () => Y,
  registerBackend: () => Je
});
var qt = Object.defineProperty;
var Qa = Object.getOwnPropertyDescriptor;
var Ka = Object.getOwnPropertyNames;
var es = Object.prototype.hasOwnProperty;
var Jt = ((n) => typeof __require < "u" ? __require : typeof Proxy < "u" ? new Proxy(n, { get: (t, a) => (typeof __require < "u" ? __require : t)[a] }) : n)(function(n) {
  if (typeof __require < "u") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + n + '" is not supported');
});
var N = (n, t, a) => () => {
  if (a) throw a[0];
  try {
    return n && (t = n(n = 0)), t;
  } catch (u) {
    throw a = [u], u;
  }
};
var ut = (n, t) => {
  for (var a in t) qt(n, a, { get: t[a], enumerable: true });
};
var ts = (n, t, a, u) => {
  if (t && typeof t == "object" || typeof t == "function") for (let o of Ka(t)) !es.call(n, o) && o !== a && qt(n, o, { get: () => t[o], enumerable: !(u = Qa(t, o)) || u.enumerable });
  return n;
};
var Xt = (n) => ts(qt({}, "__esModule", { value: true }), n);
var ft;
var Be;
var Je;
var ns;
var pr;
var Zt = N(() => {
  "use strict";
  ft = /* @__PURE__ */ new Map(), Be = [], Je = (n, t, a) => {
    if (t && typeof t.init == "function" && typeof t.createInferenceSessionHandler == "function") {
      let u = ft.get(n);
      if (u === void 0) ft.set(n, { backend: t, priority: a });
      else {
        if (u.priority > a) return;
        if (u.priority === a && u.backend !== t) throw new Error(`cannot register backend "${n}" using priority ${a}`);
      }
      if (a >= 0) {
        let o = Be.indexOf(n);
        o !== -1 && Be.splice(o, 1);
        for (let d = 0; d < Be.length; d++) if (ft.get(Be[d]).priority <= a) {
          Be.splice(d, 0, n);
          return;
        }
        Be.push(n);
      }
      return;
    }
    throw new TypeError("not a valid backend");
  }, ns = async (n) => {
    let t = ft.get(n);
    if (!t) return "backend not found.";
    if (t.initialized) return t.backend;
    if (t.aborted) return t.error;
    {
      let a = !!t.initPromise;
      try {
        return a || (t.initPromise = t.backend.init(n)), await t.initPromise, t.initialized = true, t.backend;
      } catch (u) {
        return a || (t.error = `${u}`, t.aborted = true), t.error;
      } finally {
        delete t.initPromise;
      }
    }
  }, pr = async (n) => {
    let t = n.executionProviders || [], a = t.map((m) => typeof m == "string" ? m : m.name), u = a.length === 0 ? Be : a, o, d = [], c = /* @__PURE__ */ new Set();
    for (let m of u) {
      let h = await ns(m);
      typeof h == "string" ? d.push({ name: m, err: h }) : (o || (o = h), o === h && c.add(m));
    }
    if (!o) throw new Error(`no available backend found. ERR: ${d.map((m) => `[${m.name}] ${m.err}`).join(", ")}`);
    for (let { name: m, err: h } of d) a.includes(m) && console.warn(`removing requested execution provider "${m}" from session options because it is not available: ${h}`);
    let l = t.filter((m) => c.has(typeof m == "string" ? m : m.name));
    return [o, new Proxy(n, { get: (m, h) => h === "executionProviders" ? l : Reflect.get(m, h) })];
  };
});
var mr = N(() => {
  "use strict";
  Zt();
});
var hr;
var wr = N(() => {
  "use strict";
  hr = "1.30.0";
});
var br;
var q;
var Qt = N(() => {
  "use strict";
  wr();
  br = "warning", q = { wasm: {}, webgl: {}, webgpu: {}, versions: { common: hr }, set logLevel(n) {
    if (n !== void 0) {
      if (typeof n != "string" || ["verbose", "info", "warning", "error", "fatal"].indexOf(n) === -1) throw new Error(`Unsupported logging level: ${n}`);
      br = n;
    }
  }, get logLevel() {
    return br;
  } };
  Object.defineProperty(q, "logLevel", { enumerable: true });
});
var Y;
var yr = N(() => {
  "use strict";
  Qt();
  Y = q;
});
var gr;
var Er;
var Tr = N(() => {
  "use strict";
  gr = (n, t) => {
    let a = typeof document < "u" ? document.createElement("canvas") : new OffscreenCanvas(1, 1);
    a.width = n.dims[3], a.height = n.dims[2];
    let u = a.getContext("2d");
    if (u != null) {
      let o, d;
      t?.tensorLayout !== void 0 && t.tensorLayout === "NHWC" ? (o = n.dims[2], d = n.dims[3]) : (o = n.dims[3], d = n.dims[2]);
      let c = t?.format !== void 0 ? t.format : "RGB", l = t?.norm, m, h;
      l === void 0 || l.mean === void 0 ? m = [255, 255, 255, 255] : typeof l.mean == "number" ? m = [l.mean, l.mean, l.mean, l.mean] : (m = [l.mean[0], l.mean[1], l.mean[2], 0], l.mean[3] !== void 0 && (m[3] = l.mean[3])), l === void 0 || l.bias === void 0 ? h = [0, 0, 0, 0] : typeof l.bias == "number" ? h = [l.bias, l.bias, l.bias, l.bias] : (h = [l.bias[0], l.bias[1], l.bias[2], 0], l.bias[3] !== void 0 && (h[3] = l.bias[3]));
      let g = d * o, b = 0, y = g, T = g * 2, I = -1;
      c === "RGBA" ? (b = 0, y = g, T = g * 2, I = g * 3) : c === "RGB" ? (b = 0, y = g, T = g * 2) : c === "RBG" && (b = 0, T = g, y = g * 2);
      for (let D = 0; D < d; D++) for (let $ = 0; $ < o; $++) {
        let v = (n.data[b++] - h[0]) * m[0], A = (n.data[y++] - h[1]) * m[1], F = (n.data[T++] - h[2]) * m[2], P = I === -1 ? 255 : (n.data[I++] - h[3]) * m[3];
        u.fillStyle = "rgba(" + v + "," + A + "," + F + "," + P + ")", u.fillRect($, D, 1, 1);
      }
      if ("toDataURL" in a) return a.toDataURL();
      throw new Error("toDataURL is not supported");
    } else throw new Error("Can not access image data");
  }, Er = (n, t) => {
    let a = typeof document < "u" ? document.createElement("canvas").getContext("2d") : new OffscreenCanvas(1, 1).getContext("2d"), u;
    if (a != null) {
      let o, d, c;
      t?.tensorLayout !== void 0 && t.tensorLayout === "NHWC" ? (o = n.dims[2], d = n.dims[1], c = n.dims[3]) : (o = n.dims[3], d = n.dims[2], c = n.dims[1]);
      let l = t !== void 0 && t.format !== void 0 ? t.format : "RGB", m = t?.norm, h, g;
      m === void 0 || m.mean === void 0 ? h = [255, 255, 255, 255] : typeof m.mean == "number" ? h = [m.mean, m.mean, m.mean, m.mean] : (h = [m.mean[0], m.mean[1], m.mean[2], 255], m.mean[3] !== void 0 && (h[3] = m.mean[3])), m === void 0 || m.bias === void 0 ? g = [0, 0, 0, 0] : typeof m.bias == "number" ? g = [m.bias, m.bias, m.bias, m.bias] : (g = [m.bias[0], m.bias[1], m.bias[2], 0], m.bias[3] !== void 0 && (g[3] = m.bias[3]));
      let b = d * o;
      if (t !== void 0 && (t.format !== void 0 && c === 4 && t.format !== "RGBA" || c === 3 && t.format !== "RGB" && t.format !== "BGR")) throw new Error("Tensor format doesn't match input tensor dims");
      let y = 4, T = 0, I = 1, D = 2, $ = 3, v = 0, A = b, F = b * 2, P = -1;
      l === "RGBA" ? (v = 0, A = b, F = b * 2, P = b * 3) : l === "RGB" ? (v = 0, A = b, F = b * 2) : l === "RBG" && (v = 0, F = b, A = b * 2), u = a.createImageData(o, d);
      for (let k = 0; k < d * o; T += y, I += y, D += y, $ += y, k++) u.data[T] = (n.data[v++] - g[0]) * h[0], u.data[I] = (n.data[A++] - g[1]) * h[1], u.data[D] = (n.data[F++] - g[2]) * h[2], u.data[$] = P === -1 ? 255 : (n.data[P++] - g[3]) * h[3];
    } else throw new Error("Can not access image data");
    return u;
  };
});
var Kt;
var Sr;
var vr;
var Ar;
var Or;
var Ir;
var Br = N(() => {
  "use strict";
  ct();
  Kt = (n, t) => {
    if (n === void 0) throw new Error("Image buffer must be defined");
    if (t.height === void 0 || t.width === void 0) throw new Error("Image height and width must be defined");
    if (t.tensorLayout === "NHWC") throw new Error("NHWC Tensor layout is not supported yet");
    let { height: a, width: u } = t, o = t.norm ?? { mean: 255, bias: 0 }, d, c;
    typeof o.mean == "number" ? d = [o.mean, o.mean, o.mean, o.mean] : d = [o.mean[0], o.mean[1], o.mean[2], o.mean[3] ?? 255], typeof o.bias == "number" ? c = [o.bias, o.bias, o.bias, o.bias] : c = [o.bias[0], o.bias[1], o.bias[2], o.bias[3] ?? 0];
    let l = t.format !== void 0 ? t.format : "RGBA", m = t.tensorFormat !== void 0 && t.tensorFormat !== void 0 ? t.tensorFormat : "RGB", h = a * u, g = m === "RGBA" ? new Float32Array(h * 4) : new Float32Array(h * 3), b = 4, y = 0, T = 1, I = 2, D = 3, $ = 0, v = h, A = h * 2, F = -1;
    l === "RGB" && (b = 3, y = 0, T = 1, I = 2, D = -1), m === "RGBA" ? F = h * 3 : m === "RBG" ? ($ = 0, A = h, v = h * 2) : m === "BGR" && (A = 0, v = h, $ = h * 2);
    for (let k = 0; k < h; k++, y += b, I += b, T += b, D += b) g[$++] = (n[y] + c[0]) / d[0], g[v++] = (n[T] + c[1]) / d[1], g[A++] = (n[I] + c[2]) / d[2], F !== -1 && D !== -1 && (g[F++] = (n[D] + c[3]) / d[3]);
    return m === "RGBA" ? new Z("float32", g, [1, 4, a, u]) : new Z("float32", g, [1, 3, a, u]);
  }, Sr = async (n, t) => {
    let a = typeof HTMLImageElement < "u" && n instanceof HTMLImageElement, u = typeof ImageData < "u" && n instanceof ImageData, o = typeof ImageBitmap < "u" && n instanceof ImageBitmap, d = typeof n == "string", c, l = t ?? {}, m = () => {
      if (typeof document < "u") return document.createElement("canvas");
      if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(1, 1);
      throw new Error("Canvas is not supported");
    }, h = (g) => typeof HTMLCanvasElement < "u" && g instanceof HTMLCanvasElement || g instanceof OffscreenCanvas ? g.getContext("2d") : null;
    if (a) {
      let g = m();
      g.width = n.width, g.height = n.height;
      let b = h(g);
      if (b != null) {
        let y = n.height, T = n.width;
        if (t !== void 0 && t.resizedHeight !== void 0 && t.resizedWidth !== void 0 && (y = t.resizedHeight, T = t.resizedWidth), t !== void 0) {
          if (l = t, t.tensorFormat !== void 0) throw new Error("Image input config format must be RGBA for HTMLImageElement");
          l.tensorFormat = "RGBA", l.height = y, l.width = T;
        } else l.tensorFormat = "RGBA", l.height = y, l.width = T;
        b.drawImage(n, 0, 0), c = b.getImageData(0, 0, T, y).data;
      } else throw new Error("Can not access image data");
    } else if (u) {
      let g, b;
      if (t !== void 0 && t.resizedWidth !== void 0 && t.resizedHeight !== void 0 ? (g = t.resizedHeight, b = t.resizedWidth) : (g = n.height, b = n.width), t !== void 0 && (l = t), l.format = "RGBA", l.height = g, l.width = b, t !== void 0) {
        let y = m();
        y.width = b, y.height = g;
        let T = h(y);
        if (T != null) T.putImageData(n, 0, 0), c = T.getImageData(0, 0, b, g).data;
        else throw new Error("Can not access image data");
      } else c = n.data;
    } else if (o) {
      if (t === void 0) throw new Error("Please provide image config with format for Imagebitmap");
      let g = m();
      g.width = n.width, g.height = n.height;
      let b = h(g);
      if (b != null) {
        let y = n.height, T = n.width;
        return b.drawImage(n, 0, 0, T, y), c = b.getImageData(0, 0, T, y).data, l.height = y, l.width = T, Kt(c, l);
      } else throw new Error("Can not access image data");
    } else {
      if (d) return new Promise((g, b) => {
        let y = m(), T = h(y);
        if (!n || !T) return b();
        let I = new Image();
        I.crossOrigin = "Anonymous", I.src = n, I.onload = () => {
          y.width = I.width, y.height = I.height, T.drawImage(I, 0, 0, y.width, y.height);
          let D = T.getImageData(0, 0, y.width, y.height);
          l.height = y.height, l.width = y.width, g(Kt(D.data, l));
        };
      });
      throw new Error("Input data provided is not supported - aborted tensor creation");
    }
    if (c !== void 0) return Kt(c, l);
    throw new Error("Input data provided is not supported - aborted tensor creation");
  }, vr = (n, t) => {
    let { width: a, height: u, download: o, dispose: d } = t, c = [1, u, a, 4];
    return new Z({ location: "texture", type: "float32", texture: n, dims: c, download: o, dispose: d });
  }, Ar = (n, t) => {
    let { dataType: a, dims: u, download: o, dispose: d } = t;
    return new Z({ location: "gpu-buffer", type: a ?? "float32", gpuBuffer: n, dims: u, download: o, dispose: d });
  }, Or = (n, t) => {
    let { dataType: a, dims: u, download: o, dispose: d } = t;
    return new Z({ location: "ml-tensor", type: a ?? "float32", mlTensor: n, dims: u, download: o, dispose: d });
  }, Ir = (n, t, a) => new Z({ location: "cpu-pinned", type: n, data: t, dims: a ?? [t.length] });
});
var Le;
var Xe;
var Lr;
var _r;
var Dr = N(() => {
  "use strict";
  Le = /* @__PURE__ */ new Map([["float32", Float32Array], ["uint8", Uint8Array], ["int8", Int8Array], ["uint16", Uint16Array], ["int16", Int16Array], ["int32", Int32Array], ["bool", Uint8Array], ["float64", Float64Array], ["uint32", Uint32Array], ["int4", Uint8Array], ["uint4", Uint8Array]]), Xe = /* @__PURE__ */ new Map([[Float32Array, "float32"], [Uint8Array, "uint8"], [Int8Array, "int8"], [Uint16Array, "uint16"], [Int16Array, "int16"], [Int32Array, "int32"], [Float64Array, "float64"], [Uint32Array, "uint32"]]), Lr = false, _r = () => {
    if (!Lr) {
      Lr = true;
      let n = typeof BigInt64Array < "u" && BigInt64Array.from, t = typeof BigUint64Array < "u" && BigUint64Array.from, a = globalThis.Float16Array, u = typeof a < "u" && a.from;
      n && (Le.set("int64", BigInt64Array), Xe.set(BigInt64Array, "int64")), t && (Le.set("uint64", BigUint64Array), Xe.set(BigUint64Array, "uint64")), u ? (Le.set("float16", a), Xe.set(a, "float16")) : Le.set("float16", Uint16Array);
    }
  };
});
var Pr;
var Ur;
var xr = N(() => {
  "use strict";
  ct();
  Pr = (n) => {
    let t = 1;
    for (let a = 0; a < n.length; a++) {
      let u = n[a];
      if (typeof u != "number" || !Number.isSafeInteger(u)) throw new TypeError(`dims[${a}] must be an integer, got: ${u}`);
      if (u < 0) throw new RangeError(`dims[${a}] must be a non-negative integer, got: ${u}`);
      t *= u;
    }
    return t;
  }, Ur = (n, t) => {
    switch (n.location) {
      case "cpu":
        return new Z(n.type, n.data, t);
      case "cpu-pinned":
        return new Z({ location: "cpu-pinned", data: n.data, type: n.type, dims: t });
      case "texture":
        return new Z({ location: "texture", texture: n.texture, type: n.type, dims: t });
      case "gpu-buffer":
        return new Z({ location: "gpu-buffer", gpuBuffer: n.gpuBuffer, type: n.type, dims: t });
      case "ml-tensor":
        return new Z({ location: "ml-tensor", mlTensor: n.mlTensor, type: n.type, dims: t });
      default:
        throw new Error(`tensorReshape: tensor location ${n.location} is not supported`);
    }
  };
});
var Z;
var ct = N(() => {
  "use strict";
  Tr();
  Br();
  Dr();
  xr();
  Z = class {
    constructor(t, a, u) {
      _r();
      let o, d;
      if (typeof t == "object" && "location" in t) switch (this.dataLocation = t.location, o = t.type, d = t.dims, t.location) {
        case "cpu-pinned": {
          let l = Le.get(o);
          if (!l) throw new TypeError(`unsupported type "${o}" to create tensor from pinned buffer`);
          if (!(t.data instanceof l)) throw new TypeError(`buffer should be of type ${l.name}`);
          this.cpuData = t.data;
          break;
        }
        case "texture": {
          if (o !== "float32") throw new TypeError(`unsupported type "${o}" to create tensor from texture`);
          this.gpuTextureData = t.texture, this.downloader = t.download, this.disposer = t.dispose;
          break;
        }
        case "gpu-buffer": {
          if (o !== "float32" && o !== "float16" && o !== "int32" && o !== "int64" && o !== "uint32" && o !== "uint8" && o !== "bool" && o !== "uint4" && o !== "int4") throw new TypeError(`unsupported type "${o}" to create tensor from gpu buffer`);
          this.gpuBufferData = t.gpuBuffer, this.downloader = t.download, this.disposer = t.dispose;
          break;
        }
        case "ml-tensor": {
          if (o !== "float32" && o !== "float16" && o !== "int32" && o !== "int64" && o !== "uint32" && o !== "uint64" && o !== "int8" && o !== "uint8" && o !== "bool" && o !== "uint4" && o !== "int4") throw new TypeError(`unsupported type "${o}" to create tensor from MLTensor`);
          this.mlTensorData = t.mlTensor, this.downloader = t.download, this.disposer = t.dispose;
          break;
        }
        default:
          throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`);
      }
      else {
        let l, m;
        if (typeof t == "string") if (o = t, m = u, t === "string") {
          if (!Array.isArray(a)) throw new TypeError("A string tensor's data must be a string array.");
          l = a;
        } else {
          let h = Le.get(t);
          if (h === void 0) throw new TypeError(`Unsupported tensor type: ${t}.`);
          if (Array.isArray(a)) {
            if (t === "float16" && h === Uint16Array || t === "uint4" || t === "int4") throw new TypeError(`Creating a ${t} tensor from number array is not supported. Please use ${h.name} as data.`);
            t === "uint64" || t === "int64" ? l = h.from(a, BigInt) : l = h.from(a);
          } else if (a instanceof h) l = a;
          else if (a instanceof Uint8ClampedArray) if (t === "uint8") l = Uint8Array.from(a);
          else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");
          else if (t === "float16" && a instanceof Uint16Array && h !== Uint16Array) l = new globalThis.Float16Array(a.buffer, a.byteOffset, a.length);
          else throw new TypeError(`A ${o} tensor's data must be type of ${h}`);
        }
        else if (m = a, Array.isArray(t)) {
          if (t.length === 0) throw new TypeError("Tensor type cannot be inferred from an empty array.");
          let h = typeof t[0];
          if (h === "string") o = "string", l = t;
          else if (h === "boolean") o = "bool", l = Uint8Array.from(t);
          else throw new TypeError(`Invalid element type of data array: ${h}.`);
        } else if (t instanceof Uint8ClampedArray) o = "uint8", l = Uint8Array.from(t);
        else {
          let h = Xe.get(t.constructor);
          if (h === void 0) throw new TypeError(`Unsupported type for tensor data: ${t.constructor}.`);
          o = h, l = t;
        }
        if (m === void 0) m = [l.length];
        else if (!Array.isArray(m)) throw new TypeError("A tensor's dims must be a number array");
        d = m, this.cpuData = l, this.dataLocation = "cpu";
      }
      let c = Pr(d);
      if (this.cpuData && c !== this.cpuData.length && !((o === "uint4" || o === "int4") && Math.ceil(c / 2) === this.cpuData.length)) throw new Error(`Tensor's size(${c}) does not match data length(${this.cpuData.length}).`);
      this.type = o, this.dims = d, this.size = c;
    }
    static async fromImage(t, a) {
      return Sr(t, a);
    }
    static fromTexture(t, a) {
      return vr(t, a);
    }
    static fromGpuBuffer(t, a) {
      return Ar(t, a);
    }
    static fromMLTensor(t, a) {
      return Or(t, a);
    }
    static fromPinnedBuffer(t, a, u) {
      return Ir(t, a, u);
    }
    toDataURL(t) {
      return gr(this, t);
    }
    toImageData(t) {
      return Er(this, t);
    }
    get data() {
      if (this.ensureValid(), !this.cpuData) throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");
      return this.cpuData;
    }
    get location() {
      return this.dataLocation;
    }
    get texture() {
      if (this.ensureValid(), !this.gpuTextureData) throw new Error("The data is not stored as a WebGL texture.");
      return this.gpuTextureData;
    }
    get gpuBuffer() {
      if (this.ensureValid(), !this.gpuBufferData) throw new Error("The data is not stored as a WebGPU buffer.");
      return this.gpuBufferData;
    }
    get mlTensor() {
      if (this.ensureValid(), !this.mlTensorData) throw new Error("The data is not stored as a WebNN MLTensor.");
      return this.mlTensorData;
    }
    async getData(t) {
      switch (this.ensureValid(), this.dataLocation) {
        case "cpu":
        case "cpu-pinned":
          return this.data;
        case "texture":
        case "gpu-buffer":
        case "ml-tensor": {
          if (!this.downloader) throw new Error("The current tensor is not created with a specified data downloader.");
          if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
          try {
            this.isDownloading = true;
            let a = await this.downloader();
            return this.downloader = void 0, this.dataLocation = "cpu", this.cpuData = a, t && this.disposer && (this.disposer(), this.disposer = void 0), a;
          } finally {
            this.isDownloading = false;
          }
        }
        default:
          throw new Error(`cannot get data from location: ${this.dataLocation}`);
      }
    }
    dispose() {
      if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
      this.disposer && (this.disposer(), this.disposer = void 0), this.cpuData = void 0, this.gpuTextureData = void 0, this.gpuBufferData = void 0, this.mlTensorData = void 0, this.downloader = void 0, this.isDownloading = void 0, this.dataLocation = "none";
    }
    ensureValid() {
      if (this.dataLocation === "none") throw new Error("The tensor is disposed.");
    }
    reshape(t) {
      if (this.ensureValid(), this.downloader || this.disposer) throw new Error("Cannot reshape a tensor that owns GPU resource.");
      return Ur(this, t);
    }
  };
});
var de;
var en = N(() => {
  "use strict";
  ct();
  de = Z;
});
var Cr;
var Mr;
var _e;
var De;
var Pe;
var Ue;
var tn = N(() => {
  "use strict";
  Qt();
  Cr = (n, t) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || console.timeStamp(`${n}::ORT::${t}`);
  }, Mr = (n, t) => {
    let a = new Error().stack?.split(/\r\n|\r|\n/g) || [], u = false;
    for (let o = 0; o < a.length; o++) {
      if (u && !a[o].includes("TRACE_FUNC")) {
        let d = `FUNC_${n}::${a[o].trim().split(" ")[1]}`;
        t && (d += `::${t}`), Cr("CPU", d);
        return;
      }
      a[o].includes("TRACE_FUNC") && (u = true);
    }
  }, _e = (n) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || Mr("BEGIN", n);
  }, De = (n) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || Mr("END", n);
  }, Pe = (n) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || console.time(`ORT::${n}`);
  }, Ue = (n) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || console.timeEnd(`ORT::${n}`);
  };
});
var lt;
var Rr = N(() => {
  "use strict";
  Zt();
  en();
  tn();
  lt = class n {
    constructor(t) {
      this.handler = t;
    }
    async run(t, a, u) {
      _e(), Pe("InferenceSession.run");
      let o = {}, d = {};
      if (typeof t != "object" || t === null || t instanceof de || Array.isArray(t)) throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");
      let c = true;
      if (typeof a == "object") {
        if (a === null) throw new TypeError("Unexpected argument[1]: cannot be null.");
        if (a instanceof de) throw new TypeError("'fetches' cannot be a Tensor");
        if (Array.isArray(a)) {
          if (a.length === 0) throw new TypeError("'fetches' cannot be an empty array.");
          c = false;
          for (let h of a) {
            if (typeof h != "string") throw new TypeError("'fetches' must be a string array or an object.");
            if (this.outputNames.indexOf(h) === -1) throw new RangeError(`'fetches' contains invalid output name: ${h}.`);
            o[h] = null;
          }
          if (typeof u == "object" && u !== null) d = u;
          else if (typeof u < "u") throw new TypeError("'options' must be an object.");
        } else {
          let h = false, g = Object.getOwnPropertyNames(a);
          for (let b of this.outputNames) if (g.indexOf(b) !== -1) {
            let y = a[b];
            (y === null || y instanceof de) && (h = true, c = false, o[b] = y);
          }
          if (h) {
            if (typeof u == "object" && u !== null) d = u;
            else if (typeof u < "u") throw new TypeError("'options' must be an object.");
          } else d = a;
        }
      } else if (typeof a < "u") throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");
      for (let h of this.inputNames) if (typeof t[h] > "u") throw new Error(`input '${h}' is missing in 'feeds'.`);
      if (c) for (let h of this.outputNames) o[h] = null;
      let l = await this.handler.run(t, o, d), m = {};
      for (let h in l) if (Object.hasOwnProperty.call(l, h)) {
        let g = l[h];
        g instanceof de ? m[h] = g : m[h] = new de(g.type, g.data, g.dims);
      }
      return Ue("InferenceSession.run"), De(), m;
    }
    async release() {
      return this.handler.dispose();
    }
    static async create(t, a, u, o) {
      _e(), Pe("InferenceSession.create");
      let d, c = {};
      if (typeof t == "string") {
        if (d = t, typeof a == "object" && a !== null) c = a;
        else if (typeof a < "u") throw new TypeError("'options' must be an object.");
      } else if (t instanceof Uint8Array) {
        if (d = t, typeof a == "object" && a !== null) c = a;
        else if (typeof a < "u") throw new TypeError("'options' must be an object.");
      } else if (t instanceof ArrayBuffer || typeof SharedArrayBuffer < "u" && t instanceof SharedArrayBuffer) {
        let g = t, b = 0, y = t.byteLength;
        if (typeof a == "object" && a !== null) c = a;
        else if (typeof a == "number") {
          if (b = a, !Number.isSafeInteger(b)) throw new RangeError("'byteOffset' must be an integer.");
          if (b < 0 || b >= g.byteLength) throw new RangeError(`'byteOffset' is out of range [0, ${g.byteLength}).`);
          if (y = t.byteLength - b, typeof u == "number") {
            if (y = u, !Number.isSafeInteger(y)) throw new RangeError("'byteLength' must be an integer.");
            if (y <= 0 || b + y > g.byteLength) throw new RangeError(`'byteLength' is out of range (0, ${g.byteLength - b}].`);
            if (typeof o == "object" && o !== null) c = o;
            else if (typeof o < "u") throw new TypeError("'options' must be an object.");
          } else if (typeof u < "u") throw new TypeError("'byteLength' must be a number.");
        } else if (typeof a < "u") throw new TypeError("'options' must be an object.");
        d = new Uint8Array(g, b, y);
      } else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");
      let [l, m] = await pr(c), h = await l.createInferenceSessionHandler(d, m);
      return Ue("InferenceSession.create"), De(), new n(h);
    }
    startProfiling() {
      this.handler.startProfiling();
    }
    endProfiling() {
      this.handler.endProfiling();
    }
    get inputNames() {
      return this.handler.inputNames;
    }
    get outputNames() {
      return this.handler.outputNames;
    }
    get inputMetadata() {
      return this.handler.inputMetadata;
    }
    get outputMetadata() {
      return this.handler.outputMetadata;
    }
  };
});
var rs;
var Fr = N(() => {
  "use strict";
  Rr();
  rs = lt;
});
var Nr = N(() => {
  "use strict";
});
var kr = N(() => {
  "use strict";
});
var Wr = N(() => {
  "use strict";
});
var Gr = N(() => {
  "use strict";
});
var nn = {};
ut(nn, { InferenceSession: () => rs, TRACE: () => Cr, TRACE_EVENT_BEGIN: () => Pe, TRACE_EVENT_END: () => Ue, TRACE_FUNC_BEGIN: () => _e, TRACE_FUNC_END: () => De, Tensor: () => de, env: () => Y, registerBackend: () => Je });
var Te = N(() => {
  "use strict";
  mr();
  yr();
  Fr();
  en();
  Nr();
  kr();
  tn();
  Wr();
  Gr();
});
var dt = N(() => {
  "use strict";
});
var jr = {};
ut(jr, { default: () => os });
var zr;
var Hr;
var os;
var Vr = N(() => {
  "use strict";
  rn();
  xe();
  pt();
  zr = "ort-wasm-proxy-worker", Hr = globalThis.self?.name === zr;
  Hr && (self.onmessage = (n) => {
    let { type: t, in: a } = n.data;
    try {
      switch (t) {
        case "init-wasm":
          mt(a.wasm).then(() => {
            ht(a).then(() => {
              postMessage({ type: t });
            }, (u) => {
              postMessage({ type: t, err: u });
            });
          }, (u) => {
            postMessage({ type: t, err: u });
          });
          break;
        case "init-ep": {
          let { epName: u, env: o } = a;
          wt(o, u).then(() => {
            postMessage({ type: t });
          }, (d) => {
            postMessage({ type: t, err: d });
          });
          break;
        }
        case "copy-from": {
          let { buffer: u } = a, o = Ze(u);
          postMessage({ type: t, out: o });
          break;
        }
        case "create": {
          let { model: u, options: o } = a;
          bt(u, o).then((d) => {
            postMessage({ type: t, out: d });
          }, (d) => {
            postMessage({ type: t, err: d });
          });
          break;
        }
        case "release":
          yt(a), postMessage({ type: t });
          break;
        case "run": {
          let { sessionId: u, inputIndices: o, inputs: d, outputIndices: c, options: l } = a;
          gt(u, o, d, c, new Array(c.length).fill(null), l).then((m) => {
            m.some((h) => h[3] !== "cpu") ? postMessage({ type: t, err: "Proxy does not support non-cpu tensor location." }) : postMessage({ type: t, out: m }, Tt([...d, ...m]));
          }, (m) => {
            postMessage({ type: t, err: m });
          });
          break;
        }
        case "end-profiling":
          Et(a), postMessage({ type: t });
          break;
        default:
      }
    } catch (u) {
      postMessage({ type: t, err: u });
    }
  });
  os = Hr ? null : (n) => new Worker(n ?? oe, { type: "module", name: zr });
});
var qr = {};
ut(qr, { default: () => as });
async function Yr(n = {}) {
  var t = n, a = !!globalThis.window, u = !!globalThis.WorkerGlobalScope, o = u && self.name?.startsWith("em-pthread");
  t.mountExternalData = (e, r) => {
    e.startsWith("./") && (e = e.substring(2)), (t.Tb || (t.Tb = /* @__PURE__ */ new Map())).set(e, r);
  }, t.unmountExternalData = () => {
    delete t.Tb, delete t.mc, delete t.lc, delete t.nc;
  }, globalThis.SharedArrayBuffer ?? new WebAssembly.Memory({ initial: 0, maximum: 0, shared: true }).buffer.constructor;
  var d, c, l = (e, r) => {
    throw r;
  }, m = import.meta.url, h = "";
  if (a || u) {
    try {
      h = new URL(".", m).href;
    } catch {
    }
    u && (c = (e) => {
      var r = new XMLHttpRequest();
      return r.open("GET", e, false), r.responseType = "arraybuffer", r.send(null), new Uint8Array(r.response);
    }), d = async (e) => {
      if (k(e)) return new Promise((i, s) => {
        var f = new XMLHttpRequest();
        f.open("GET", e, true), f.responseType = "arraybuffer", f.onload = () => {
          f.status == 200 || f.status == 0 && f.response ? i(f.response) : s(f.status);
        }, f.onerror = s, f.send(null);
      });
      var r = await fetch(e, { credentials: "same-origin" });
      if (r.ok) return r.arrayBuffer();
      throw Error(r.status + " : " + r.url);
    };
  }
  var g, b, y, T, I, D, $ = console.log.bind(console), v = console.error.bind(console), A = $, F = v, P = false, k = (e) => e.startsWith("file://");
  function w() {
    ge.buffer != H.buffer && ee();
  }
  if (o) {
    let e = function(r) {
      try {
        var i = r.data, s = i.Rb;
        if (s === "load") {
          let f = [];
          self.onmessage = (p) => f.push(p), D = () => {
            postMessage({ Rb: "loaded" });
            for (let p of f) e(p);
            self.onmessage = e;
          };
          for (let p of i.ac) t[p] && !t[p].proxy || (t[p] = (...E) => {
            postMessage({ Rb: "callHandler", $b: p, args: E });
          }, p == "print" && (A = t[p]), p == "printErr" && (F = t[p]));
          ge = i.fc, ee(), b = i.hc, Ut(), it();
        } else if (s === "run") {
          (function(f) {
            var p = (w(), W)[f + 52 >>> 2 >>> 0];
            f = (w(), W)[f + 56 >>> 2 >>> 0], ir(p, p - f), _(p);
          })(i.Qb), zt(i.Qb, 0, 0, 1, 0, 0), wn(), Ft(i.Qb), Q ||= true;
          try {
            Io(i.dc, i.Vb);
          } catch (f) {
            if (f != "unwind") throw f;
          }
        } else i.target !== "setimmediate" && (s === "checkMailbox" ? Q && rt() : s && (F(`worker: received unknown command ${s}`), F(i)));
      } catch (f) {
        throw nr(), f;
      }
    };
    var As = e, Q = false;
    self.onunhandledrejection = (r) => {
      throw r.reason || r;
    }, self.onmessage = e;
  }
  var H, ne, pe, B, W, re, me, O, K2, je = false;
  function ee() {
    var e = ge.buffer;
    t.HEAP8 = H = new Int8Array(e), pe = new Int16Array(e), t.HEAPU8 = ne = new Uint8Array(e), new Uint16Array(e), t.HEAP32 = B = new Int32Array(e), t.HEAPU32 = W = new Uint32Array(e), re = new Float32Array(e), me = new Float64Array(e), O = new BigInt64Array(e), new BigUint64Array(e);
  }
  function he() {
    je = true, o ? D() : Ee.Va();
  }
  function j(e) {
    throw F(e = "Aborted(" + e + ")"), P = true, e = new WebAssembly.RuntimeError(e + ". Build with -sASSERTIONS for more info."), I?.(e), e;
  }
  function J() {
    return { a: { T: ca, f: Bo, w: Lo, e: _o, k: Do, h: Po, L: Uo, b: xo, G: Co, ua: vn, j: Mo, M: In, La: Bn, qa: Ln, sa: _n, Ma: Dn, Ja: Pn, Ca: Un, Ia: xn, Z: Cn, ra: Mn, oa: Rn, Ka: Fn, pa: Nn, Ra: Ro, Fa: Fo, ma: ko, va: Wo, ja: Go, U: $o, Ea: Ft, Oa: zo, za: Ho, Aa: jo, Ba: Vo, xa: $n, ya: zn, ka: Hn, Ta: qo, Qa: Zo, W: Qo, V: Ko, Pa: Jo, F: ea, Na: ta, na, u: Yo, H: ra, S: at, la: aa, ba: oa, Ua: sa, Ga: Yn, Ha: qn, ta: ye, I: Jn, wa: Xn, Y: Zn, Da: Qn, X: Kn, $: Ya, N: $a, aa: Va, O: Ga, v: Da, d: ma, m: da, n: la, r: Aa, ca: Na, E: Fa, o: ba, P: ka, C: za, J: Ra, da: Ma, ea: Ca, z: Oa, fa: Ua, Q: xa, ga: Pa, y: La, D: Wa, c: pa, q: wa, i: ha, _: qa, l: ga, p: Ea, s: ya, t: Ta, x: Ia, R: _a, A: Ha, K: Ba, B: ja, ha: va, ia: Sa, g: ua, a: ge, Sa: V } };
  }
  async function Ut() {
    function e(s, f) {
      return Ee = s.exports, Ee = function() {
        var p = Ee, E = (C) => () => C() >>> 0, S2 = (C) => (R) => C(R) >>> 0;
        return (p = Object.assign({}, p)).ub = E(p.ub), p.wb = S2(p.wb), p.Kb = S2(p.Kb), p.Lb = E(p.Lb), p.Pb = S2(p.Pb), p;
      }(), mn.push(Ee.xb), s = Ee, t._OrtInit = s.Wa, t._OrtGetLastError = s.Xa, t._OrtCreateSessionOptions = s.Ya, t._OrtAppendExecutionProvider = s.Za, t._OrtAddFreeDimensionOverride = s._a, t._OrtAddSessionConfigEntry = s.$a, t._OrtReleaseSessionOptions = s.ab, t._OrtCreateSession = s.bb, t._OrtReleaseSession = s.cb, t._OrtGetInputOutputCount = s.db, t._OrtGetInputOutputMetadata = s.eb, t._OrtFree = s.fb, t._OrtCreateTensor = s.gb, t._OrtGetTensorData = s.hb, t._OrtReleaseTensor = s.ib, t._OrtCreateRunOptions = s.jb, t._OrtAddRunConfigEntry = s.kb, t._OrtReleaseRunOptions = s.lb, t._OrtCreateBinding = s.mb, t._OrtBindInput = s.nb, t._OrtBindOutput = s.ob, t._OrtClearBoundOutputs = s.pb, t._OrtReleaseBinding = s.qb, t._OrtRunWithBinding = s.rb, t._OrtRun = s.sb, t._OrtEndProfiling = s.tb, st = s.ub, er = t._free = s.vb, tr = t._malloc = s.wb, zt = s.zb, nr = s.Ab, rr = s.Bb, or = s.Cb, Ht = s.Db, ar = s.Eb, sr = s.Fb, x = s.Gb, qe = s.Hb, ir = s.Ib, _ = s.Jb, jt = s.Kb, U = s.Lb, ur = s.Mb, Vt = s.Nb, fr = s.Ob, cr = s.Pb, lr = s.yb, b = f, Ee;
    }
    var r, i = J();
    return t.instantiateWasm ? new Promise((s) => {
      t.instantiateWasm(i, (f, p) => {
        s(e(f, p));
      });
    }) : o ? e(new WebAssembly.Instance(b, J()), b) : (K2 ??= t.locateFile ? t.locateFile ? t.locateFile("ort-wasm-simd-threaded.wasm", h) : h + "ort-wasm-simd-threaded.wasm" : new URL("ort-wasm-simd-threaded.wasm", import.meta.url).href, r = await async function(s) {
      var f = K2;
      if (!g && !k(f)) try {
        var p = fetch(f, { credentials: "same-origin" });
        return await WebAssembly.instantiateStreaming(p, s);
      } catch (E) {
        F(`wasm streaming compile failed: ${E}`), F("falling back to ArrayBuffer instantiation");
      }
      return async function(E, S2) {
        try {
          var C = await async function(R) {
            if (!g) try {
              var X = await d(R);
              return new Uint8Array(X);
            } catch {
            }
            if (R == K2 && g) R = new Uint8Array(g);
            else {
              if (!c) throw "both async and sync fetching of the wasm failed";
              R = c(R);
            }
            return R;
          }(E);
          return await WebAssembly.instantiate(C, S2);
        } catch (R) {
          F(`failed to asynchronously prepare wasm: ${R}`), j(R);
        }
      }(f, s);
    }(i), e(r.instance, r.module));
  }
  class Se {
    name = "ExitStatus";
    constructor(r) {
      this.message = `Program terminated with exit(${r})`, this.status = r;
    }
  }
  var ve = (e) => {
    e.terminate(), e.onmessage = () => {
    };
  }, Ve = [], Re = 0, te = null, ue = (e) => {
    ce.length == 0 && (yn(), bn(ce[0]));
    var r = ce.pop();
    if (!r) return 6;
    Fe.push(r), Ae[e.Qb] = r, r.Qb = e.Qb;
    var i = { Rb: "run", dc: e.cc, Vb: e.Vb, Qb: e.Qb };
    return r.postMessage(i, e.Zb), 0;
  }, se = 0, L = (e, r, ...i) => {
    var s, f = 16 * i.length, p = U(), E = jt(f), S2 = E >>> 3;
    for (s of i) typeof s == "bigint" ? ((w(), O)[S2++ >>> 0] = 1n, (w(), O)[S2++ >>> 0] = s) : ((w(), O)[S2++ >>> 0] = 0n, (w(), me)[S2++ >>> 0] = s);
    return e = rr(e, 0, f, E, r), _(p), e;
  };
  function V(e) {
    if (o) return L(0, 1, e);
    if (y = e, !(0 < se)) {
      for (var r of Fe) ve(r);
      for (r of ce) ve(r);
      ce = [], Fe = [], Ae = {}, P = true;
    }
    l(0, new Se(e));
  }
  function fe(e) {
    if (o) return L(1, 0, e);
    ye(e);
  }
  var ye = (e) => {
    if (y = e, o) throw fe(e), "unwind";
    V(e);
  }, ce = [], Fe = [], mn = [], Ae = {}, hn = (e) => {
    var r = e.Qb;
    delete Ae[r], ce.push(e), Fe.splice(Fe.indexOf(e), 1), e.Qb = 0, or(r);
  };
  function wn() {
    mn.forEach((e) => e());
  }
  var bn = (e) => new Promise((r) => {
    e.onmessage = (f) => {
      var p = f.data;
      if (f = p.Rb, p.Ub && p.Ub != st()) {
        var E = Ae[p.Ub];
        E ? E.postMessage(p, p.Zb) : F(`Internal error! Worker sent a message "${f}" to target pthread ${p.Ub}, but that thread no longer exists!`);
      } else f === "checkMailbox" ? rt() : f === "spawnThread" ? ue(p) : f === "cleanupThread" ? Rt(() => {
        hn(Ae[p.ec]);
      }) : f === "loaded" ? (e.loaded = true, r(e)) : p.target === "setimmediate" ? e.postMessage(p) : f === "uncaughtException" ? e.onerror(p.error) : f === "callHandler" ? t[p.$b](...p.args) : f && F(`worker sent an unknown command ${f}`);
    }, e.onerror = (f) => {
      throw F(`worker sent an error! ${f.filename}:${f.lineno}: ${f.message}`), f;
    };
    var i, s = [];
    for (i of []) t.propertyIsEnumerable(i) && s.push(i);
    e.postMessage({ Rb: "load", ac: s, fc: ge, hc: b });
  });
  function yn() {
    var e = new Worker((() => {
      let r = URL;
      return import.meta.url > "file:" && import.meta.url < "file;" ? new r("ort.wasm.bundle.min.mjs", import.meta.url) : new URL(import.meta.url);
    })(), { type: "module", workerData: "em-pthread", name: "em-pthread" });
    ce.push(e);
  }
  var ge, gn = [], M = (e) => {
    var r = gn[e];
    return r || (gn[e] = r = lr.get(e)), r;
  }, Io = (e, r) => {
    se = 0, e = M(e)(r), 0 < se ? y = e : Ht(e);
  }, tt = [], nt = 0;
  function Bo(e) {
    var r = new xt(e >>>= 0);
    return (w(), H)[r.Sb + 12 >>> 0] == 0 && (En(r, true), nt--), Tn(r, false), tt.push(r), cr(e);
  }
  var Ne = 0, Lo = () => {
    x(0, 0);
    var e = tt.pop();
    ur(e.Wb), Ne = 0;
  };
  function En(e, r) {
    r = r ? 1 : 0, (w(), H)[e.Sb + 12 >>> 0] = r;
  }
  function Tn(e, r) {
    r = r ? 1 : 0, (w(), H)[e.Sb + 13 >>> 0] = r;
  }
  class xt {
    constructor(r) {
      this.Wb = r, this.Sb = r - 24;
    }
  }
  var Ct = (e) => {
    var r = Ne;
    if (!r) return qe(0), 0;
    var i = new xt(r);
    (w(), W)[i.Sb + 16 >>> 2 >>> 0] = r;
    var s = (w(), W)[i.Sb + 4 >>> 2 >>> 0];
    if (!s) return qe(0), r;
    for (var f of e) {
      if (f === 0 || f === s) break;
      if (fr(f, s, i.Sb + 16)) return qe(f), r;
    }
    return qe(s), r;
  };
  function _o() {
    return Ct([]);
  }
  function Do(e) {
    return Ct([e >>> 0]);
  }
  function Po(e, r, i, s) {
    return Ct([e >>> 0, r >>> 0, i >>> 0, s >>> 0]);
  }
  var Uo = () => {
    var e = tt.pop();
    e || j("no exception to throw");
    var r = e.Wb;
    throw (w(), H)[e.Sb + 13 >>> 0] == 0 && (tt.push(e), Tn(e, true), En(e, false), nt++), Vt(r), Ne = r;
  };
  function xo(e, r, i) {
    var s = new xt(e >>>= 0);
    throw r >>>= 0, i >>>= 0, (w(), W)[s.Sb + 16 >>> 2 >>> 0] = 0, (w(), W)[s.Sb + 4 >>> 2 >>> 0] = r, (w(), W)[s.Sb + 8 >>> 2 >>> 0] = i, Vt(e), nt++, Ne = e;
  }
  var Co = () => nt;
  function Sn(e, r, i, s) {
    return o ? L(2, 1, e, r, i, s) : vn(e, r, i, s);
  }
  function vn(e, r, i, s) {
    if (e >>>= 0, r >>>= 0, i >>>= 0, s >>>= 0, !globalThis.SharedArrayBuffer) return 6;
    var f = [];
    return o && f.length === 0 ? Sn(e, r, i, s) : (e = { cc: i, Qb: e, Vb: s, Zb: f }, o ? (e.Rb = "spawnThread", postMessage(e, f), 0) : ue(e));
  }
  function Mo(e) {
    throw Ne ||= e >>> 0, Ne;
  }
  var An = globalThis.TextDecoder && new TextDecoder(), On = (e, r = 0, i, s) => {
    var f = r >>>= 0;
    if (i = f + i, s) s = i;
    else {
      for (; e[f] && !(f >= i); ) ++f;
      s = f;
    }
    if (16 < s - r && e.buffer && An) return An.decode(e.buffer instanceof ArrayBuffer ? e.subarray(r, s) : e.slice(r, s));
    for (f = ""; r < s; ) if (128 & (i = e[r++])) {
      var p = 63 & e[r++];
      if ((224 & i) == 192) f += String.fromCharCode((31 & i) << 6 | p);
      else {
        var E = 63 & e[r++];
        65536 > (i = (240 & i) == 224 ? (15 & i) << 12 | p << 6 | E : (7 & i) << 18 | p << 12 | E << 6 | 63 & e[r++]) ? f += String.fromCharCode(i) : (i -= 65536, f += String.fromCharCode(55296 | i >> 10, 56320 | 1023 & i));
      }
    } else f += String.fromCharCode(i);
    return f;
  }, Mt = (e, r, i) => (e >>>= 0) ? On((w(), ne), e, r, i) : "";
  function In(e, r, i) {
    return o ? L(3, 1, e, r, i) : 0;
  }
  function Bn(e, r) {
    if (o) return L(4, 1, e, r);
  }
  function Ln(e, r) {
    if (o) return L(5, 1, e, r);
  }
  function _n(e, r, i) {
    if (o) return L(6, 1, e, r, i);
  }
  function Dn(e, r, i) {
    return o ? L(7, 1, e, r, i) : 0;
  }
  function Pn(e, r) {
    if (o) return L(8, 1, e, r);
  }
  function Un(e, r, i) {
    if (o) return L(9, 1, e, r, i);
  }
  function xn(e, r, i, s) {
    if (o) return L(10, 1, e, r, i, s);
  }
  function Cn(e, r, i, s) {
    if (o) return L(11, 1, e, r, i, s);
  }
  function Mn(e, r, i, s) {
    if (o) return L(12, 1, e, r, i, s);
  }
  function Rn(e) {
    if (o) return L(13, 1, e);
  }
  function Fn(e, r) {
    if (o) return L(14, 1, e, r);
  }
  function Nn(e, r, i) {
    if (o) return L(15, 1, e, r, i);
  }
  var Ro = () => j("");
  function Fo(e) {
    zt(e >>> 0, !u, 1, !a, 131072, false), wn();
  }
  var Rt = (e) => {
    if (!P) try {
      if (e(), !(0 < se)) try {
        o ? st() && Ht(y) : ye(y);
      } catch (r) {
        r instanceof Se || r == "unwind" || l(0, r);
      }
    } catch (r) {
      r instanceof Se || r == "unwind" || l(0, r);
    }
  }, No = !Atomics.waitAsync || globalThis.navigator?.userAgent && 91 > Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || [])[2]);
  function Ft(e) {
    e >>>= 0, No || (Atomics.waitAsync((w(), B), e >>> 2, e).value.then(rt), e += 128, Atomics.store((w(), B), e >>> 2, 1));
  }
  var rt = () => Rt(() => {
    var e = st();
    e && (Ft(e), sr());
  });
  function ko(e, r) {
    (e >>>= 0) == r >>> 0 ? setTimeout(rt) : o ? postMessage({ Ub: e, Rb: "checkMailbox" }) : (e = Ae[e]) && e.postMessage({ Rb: "checkMailbox" });
  }
  var Nt = [];
  function Wo(e, r, i, s, f) {
    for (r >>>= 0, f >>>= 0, Nt.length = 0, i = f >>> 3, s = f + s >>> 3; i < s; ) {
      var p;
      p = (w(), O)[i++ >>> 0] ? (w(), O)[i++ >>> 0] : (w(), me)[i++ >>> 0], Nt.push(p);
    }
    return (r ? dr[r] : fa[e])(...Nt);
  }
  var Go = () => {
    se = 0;
  };
  function $o(e) {
    e >>>= 0, o ? postMessage({ Rb: "cleanupThread", ec: e }) : hn(Ae[e]);
  }
  function zo(e) {
  }
  function Ho(e, r) {
    e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e), r >>>= 0, e = new Date(1e3 * e), (w(), B)[r >>> 2 >>> 0] = e.getUTCSeconds(), (w(), B)[r + 4 >>> 2 >>> 0] = e.getUTCMinutes(), (w(), B)[r + 8 >>> 2 >>> 0] = e.getUTCHours(), (w(), B)[r + 12 >>> 2 >>> 0] = e.getUTCDate(), (w(), B)[r + 16 >>> 2 >>> 0] = e.getUTCMonth(), (w(), B)[r + 20 >>> 2 >>> 0] = e.getUTCFullYear() - 1900, (w(), B)[r + 24 >>> 2 >>> 0] = e.getUTCDay(), e = (e.getTime() - Date.UTC(e.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) / 864e5 | 0, (w(), B)[r + 28 >>> 2 >>> 0] = e;
  }
  var kn = (e) => e % 4 == 0 && (e % 100 != 0 || e % 400 == 0), Wn = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], Gn = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  function jo(e, r) {
    e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e), r >>>= 0, e = new Date(1e3 * e), (w(), B)[r >>> 2 >>> 0] = e.getSeconds(), (w(), B)[r + 4 >>> 2 >>> 0] = e.getMinutes(), (w(), B)[r + 8 >>> 2 >>> 0] = e.getHours(), (w(), B)[r + 12 >>> 2 >>> 0] = e.getDate(), (w(), B)[r + 16 >>> 2 >>> 0] = e.getMonth(), (w(), B)[r + 20 >>> 2 >>> 0] = e.getFullYear() - 1900, (w(), B)[r + 24 >>> 2 >>> 0] = e.getDay();
    var i = (kn(e.getFullYear()) ? Wn : Gn)[e.getMonth()] + e.getDate() - 1 | 0;
    (w(), B)[r + 28 >>> 2 >>> 0] = i, (w(), B)[r + 36 >>> 2 >>> 0] = -60 * e.getTimezoneOffset(), i = new Date(e.getFullYear(), 6, 1).getTimezoneOffset();
    var s = new Date(e.getFullYear(), 0, 1).getTimezoneOffset();
    e = 0 | (i != s && e.getTimezoneOffset() == Math.min(s, i)), (w(), B)[r + 32 >>> 2 >>> 0] = e;
  }
  function Vo(e) {
    e >>>= 0;
    var r = new Date((w(), B)[e + 20 >>> 2 >>> 0] + 1900, (w(), B)[e + 16 >>> 2 >>> 0], (w(), B)[e + 12 >>> 2 >>> 0], (w(), B)[e + 8 >>> 2 >>> 0], (w(), B)[e + 4 >>> 2 >>> 0], (w(), B)[e >>> 2 >>> 0], 0), i = (w(), B)[e + 32 >>> 2 >>> 0], s = r.getTimezoneOffset(), f = new Date(r.getFullYear(), 6, 1).getTimezoneOffset(), p = new Date(r.getFullYear(), 0, 1).getTimezoneOffset(), E = Math.min(p, f);
    return 0 > i ? (w(), B)[e + 32 >>> 2 >>> 0] = +(f != p && E == s) : 0 < i != (E == s) && (f = Math.max(p, f), r.setTime(r.getTime() + 6e4 * ((0 < i ? E : f) - s))), (w(), B)[e + 24 >>> 2 >>> 0] = r.getDay(), i = (kn(r.getFullYear()) ? Wn : Gn)[r.getMonth()] + r.getDate() - 1 | 0, (w(), B)[e + 28 >>> 2 >>> 0] = i, (w(), B)[e >>> 2 >>> 0] = r.getSeconds(), (w(), B)[e + 4 >>> 2 >>> 0] = r.getMinutes(), (w(), B)[e + 8 >>> 2 >>> 0] = r.getHours(), (w(), B)[e + 12 >>> 2 >>> 0] = r.getDate(), (w(), B)[e + 16 >>> 2 >>> 0] = r.getMonth(), (w(), B)[e + 20 >>> 2 >>> 0] = r.getYear(), e = r.getTime(), BigInt(isNaN(e) ? -1 : e / 1e3);
  }
  function $n(e, r, i, s, f, p, E) {
    return o ? L(16, 1, e, r, i, s, f, p, E) : -52;
  }
  function zn(e, r, i, s, f, p) {
    if (o) return L(17, 1, e, r, i, s, f, p);
  }
  var Ye = {}, Yo = () => performance.timeOrigin + performance.now();
  function Hn(e, r) {
    if (o) return L(18, 1, e, r);
    if (Ye[e] && (clearTimeout(Ye[e].id), delete Ye[e]), !r) return 0;
    var i = setTimeout(() => {
      delete Ye[e], Rt(() => ar(e, performance.timeOrigin + performance.now()));
    }, r);
    return Ye[e] = { id: i, oc: r }, 0;
  }
  var Oe = (e, r, i) => {
    var s = (w(), ne);
    if (r >>>= 0, 0 < i) {
      var f = r;
      i = r + i - 1;
      for (var p = 0; p < e.length; ++p) {
        var E = e.codePointAt(p);
        if (127 >= E) {
          if (r >= i) break;
          s[r++ >>> 0] = E;
        } else if (2047 >= E) {
          if (r + 1 >= i) break;
          s[r++ >>> 0] = 192 | E >> 6, s[r++ >>> 0] = 128 | 63 & E;
        } else if (65535 >= E) {
          if (r + 2 >= i) break;
          s[r++ >>> 0] = 224 | E >> 12, s[r++ >>> 0] = 128 | E >> 6 & 63, s[r++ >>> 0] = 128 | 63 & E;
        } else {
          if (r + 3 >= i) break;
          s[r++ >>> 0] = 240 | E >> 18, s[r++ >>> 0] = 128 | E >> 12 & 63, s[r++ >>> 0] = 128 | E >> 6 & 63, s[r++ >>> 0] = 128 | 63 & E, p++;
        }
      }
      s[r >>> 0] = 0, e = r - f;
    } else e = 0;
    return e;
  };
  function qo(e, r, i, s) {
    e >>>= 0, r >>>= 0, i >>>= 0, s >>>= 0;
    var f = (/* @__PURE__ */ new Date()).getFullYear(), p = new Date(f, 0, 1).getTimezoneOffset();
    f = new Date(f, 6, 1).getTimezoneOffset();
    var E = Math.max(p, f);
    (w(), W)[e >>> 2 >>> 0] = 60 * E, (w(), B)[r >>> 2 >>> 0] = +(p != f), e = (r = (S2) => {
      var C = Math.abs(S2);
      return `UTC${0 <= S2 ? "-" : "+"}${String(Math.floor(C / 60)).padStart(2, "0")}${String(C % 60).padStart(2, "0")}`;
    })(p), r = r(f), f < p ? (Oe(e, i, 17), Oe(r, s, 17)) : (Oe(e, s, 17), Oe(r, i, 17));
  }
  var Jo = () => Date.now(), Xo = 1;
  function Zo(e, r, i) {
    if (i >>>= 0, !(0 <= e && 3 >= e)) return 28;
    if (e === 0) e = Date.now();
    else {
      if (!Xo) return 52;
      e = performance.timeOrigin + performance.now();
    }
    return e = Math.round(1e6 * e), (w(), O)[i >>> 3 >>> 0] = BigInt(e), 0;
  }
  var kt = [];
  function Qo(e, r, i) {
    e >>>= 0, r >>>= 0, i >>>= 0, kt.length = 0;
    for (var s; s = (w(), ne)[r++ >>> 0]; ) {
      var f = s != 105;
      i += (f &= s != 112) && i % 8 ? 4 : 0, kt.push(s == 112 ? (w(), W)[i >>> 2 >>> 0] : s == 106 ? (w(), O)[i >>> 3 >>> 0] : s == 105 ? (w(), B)[i >>> 2 >>> 0] : (w(), me)[i >>> 3 >>> 0]), i += f ? 8 : 4;
    }
    return dr[e](...kt);
  }
  var Ko = () => {
  };
  function ea(e, r) {
    return F(Mt(e >>> 0, r >>> 0));
  }
  var ta = () => {
    throw se += 1, "unwind";
  };
  function na() {
    return 4294901760;
  }
  var ra = () => navigator.hardwareConcurrency, Ie = {}, Wt = (e) => {
    for (var r = 0, i = 0; i < e.length; ++i) {
      var s = e.charCodeAt(i);
      127 >= s ? r++ : 2047 >= s ? r += 2 : 55296 <= s && 57343 >= s ? (r += 4, ++i) : r += 3;
    }
    return r;
  }, ot = (e) => {
    var r;
    return (r = /\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(e)) ? +r[1] : (r = /:(\d+):\d+(?:\)|$)/.exec(e)) ? 2147483648 | +r[1] : 0;
  }, jn = (e) => {
    for (var r of e) (e = ot(r)) && (Ie[e] = r);
  };
  function oa() {
    var e = Error().stack.toString().split(`
`);
    return e[0] == "Error" && e.shift(), jn(e), Ie.Xb = ot(e[3]), Ie.bc = e, Ie.Xb;
  }
  function at(e) {
    if (!(e = Ie[e >>> 0])) return 0;
    var r;
    if (r = /^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(e)) e = r[1];
    else if (r = /^\s+at (.*) \(.*\)$/.exec(e)) e = r[1];
    else {
      if (!(r = /^(.+?)@/.exec(e))) return 0;
      e = r[1];
    }
    er(at.Yb ?? 0), r = Wt(e) + 1;
    var i = tr(r);
    return i && Oe(e, i, r), at.Yb = i, at.Yb;
  }
  function aa(e) {
    e >>>= 0;
    var r = (w(), ne).length;
    if (e <= r || 4294901760 < e) return false;
    for (var i = 1; 4 >= i; i *= 2) {
      var s = r * (1 + 0.2 / i);
      s = Math.min(s, e + 100663296);
      e: {
        s = (Math.min(4294901760, 65536 * Math.ceil(Math.max(e, s) / 65536)) - ge.buffer.byteLength + 65535) / 65536 | 0;
        try {
          ge.grow(s), ee();
          var f = 1;
          break e;
        } catch {
        }
        f = void 0;
      }
      if (f) return true;
    }
    return false;
  }
  function sa(e, r, i) {
    if (e >>>= 0, r >>>= 0, Ie.Xb == e) var s = Ie.bc;
    else (s = Error().stack.toString().split(`
`))[0] == "Error" && s.shift(), jn(s);
    for (var f = 3; s[f] && ot(s[f]) != e; ) ++f;
    for (e = 0; e < i && s[e + f]; ++e) (w(), B)[r + 4 * e >>> 2 >>> 0] = ot(s[e + f]);
    return e;
  }
  var Gt, $t = {}, Vn = () => {
    if (!Gt) {
      var e, r = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8", _: "./this.program" };
      for (e in $t) $t[e] === void 0 ? delete r[e] : r[e] = $t[e];
      var i = [];
      for (e in r) i.push(`${e}=${r[e]}`);
      Gt = i;
    }
    return Gt;
  };
  function Yn(e, r) {
    if (o) return L(19, 1, e, r);
    e >>>= 0, r >>>= 0;
    var i, s = 0, f = 0;
    for (i of Vn()) {
      var p = r + s;
      (w(), W)[e + f >>> 2 >>> 0] = p, s += Oe(i, p, 1 / 0) + 1, f += 4;
    }
    return 0;
  }
  function qn(e, r) {
    if (o) return L(20, 1, e, r);
    e >>>= 0, r >>>= 0;
    var i = Vn();
    for (var s of ((w(), W)[e >>> 2 >>> 0] = i.length, e = 0, i)) e += Wt(s) + 1;
    return (w(), W)[r >>> 2 >>> 0] = e, 0;
  }
  function Jn(e) {
    return o ? L(21, 1, e) : 52;
  }
  function Xn(e, r, i, s, f) {
    return o ? L(22, 1, e, r, i, s, f) : 52;
  }
  function Zn(e, r, i, s) {
    return o ? L(23, 1, e, r, i, s) : 52;
  }
  function Qn(e, r, i, s) {
    return o ? L(24, 1, e, r, i, s) : 70;
  }
  var ia = [null, [], []];
  function Kn(e, r, i, s) {
    if (o) return L(25, 1, e, r, i, s);
    r >>>= 0, i >>>= 0, s >>>= 0;
    for (var f = 0, p = 0; p < i; p++) {
      var E = (w(), W)[r >>> 2 >>> 0], S2 = (w(), W)[r + 4 >>> 2 >>> 0];
      r += 8;
      for (var C = 0; C < S2; C++) {
        var R = e, X = (w(), ne)[E + C >>> 0], le = ia[R];
        X === 0 || X === 10 ? ((R === 1 ? A : F)(On(le)), le.length = 0) : le.push(X);
      }
      f += S2;
    }
    return (w(), W)[s >>> 2 >>> 0] = f, 0;
  }
  function ua(e) {
    return e >>> 0;
  }
  o || function() {
    for (var e = t.numThreads - 1; e--; ) yn();
    Ve.push(async () => {
      var r = async function() {
        if (!o) return Promise.all(ce.map(bn));
      }();
      Re++, await r, --Re == 0 && te && (r = te, te = null, r());
    });
  }(), o || (ge = new WebAssembly.Memory({ initial: 256, maximum: 65536, shared: true }), ee()), t.wasmBinary && (g = t.wasmBinary), t.stackSave = () => U(), t.stackRestore = (e) => _(e), t.stackAlloc = (e) => jt(e), t.setValue = function(e, r, i = "i8") {
    switch (i.endsWith("*") && (i = "*"), i) {
      case "i1":
      case "i8":
        (w(), H)[e >>> 0] = r;
        break;
      case "i16":
        (w(), pe)[e >>> 1 >>> 0] = r;
        break;
      case "i32":
        (w(), B)[e >>> 2 >>> 0] = r;
        break;
      case "i64":
        (w(), O)[e >>> 3 >>> 0] = BigInt(r);
        break;
      case "float":
        (w(), re)[e >>> 2 >>> 0] = r;
        break;
      case "double":
        (w(), me)[e >>> 3 >>> 0] = r;
        break;
      case "*":
        (w(), W)[e >>> 2 >>> 0] = r;
        break;
      default:
        j(`invalid type for setValue: ${i}`);
    }
  }, t.getValue = function(e, r = "i8") {
    switch (r.endsWith("*") && (r = "*"), r) {
      case "i1":
      case "i8":
        return (w(), H)[e >>> 0];
      case "i16":
        return (w(), pe)[e >>> 1 >>> 0];
      case "i32":
        return (w(), B)[e >>> 2 >>> 0];
      case "i64":
        return (w(), O)[e >>> 3 >>> 0];
      case "float":
        return (w(), re)[e >>> 2 >>> 0];
      case "double":
        return (w(), me)[e >>> 3 >>> 0];
      case "*":
        return (w(), W)[e >>> 2 >>> 0];
      default:
        j(`invalid type for getValue: ${r}`);
    }
  }, t.UTF8ToString = Mt, t.stringToUTF8 = Oe, t.lengthBytesUTF8 = Wt;
  var st, er, tr, zt, nr, rr, or, Ht, ar, sr, x, qe, ir, _, jt, U, ur, Vt, fr, cr, lr, Ee, fa = [V, fe, Sn, In, Bn, Ln, _n, Dn, Pn, Un, xn, Cn, Mn, Rn, Fn, Nn, $n, zn, Hn, Yn, qn, Jn, Xn, Zn, Qn, Kn], dr = { 1042604: (e, r, i, s, f) => {
    if (t === void 0 || !t.Tb) return 1;
    if ((e = Mt(Number(e >>> 0))).startsWith("./") && (e = e.substring(2)), !(e = t.Tb.get(e))) return 2;
    if (r = Number(r >>> 0), i = Number(i >>> 0), s = Number(s >>> 0), r + i > e.byteLength) return 3;
    try {
      let p = e.subarray(r, r + i);
      switch (f) {
        case 0:
          (w(), ne).set(p, s >>> 0);
          break;
        case 1:
          t.ic ? t.ic(s, p) : t.kc(s, p);
          break;
        default:
          return 4;
      }
      return 0;
    } catch {
      return 4;
    }
  }, 1043428: () => typeof wasmOffsetConverter < "u" };
  function ca() {
    return typeof wasmOffsetConverter < "u";
  }
  function la(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function da(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function pa(e) {
    var r = U();
    try {
      M(e)();
    } catch (i) {
      if (_(r), i !== i + 0) throw i;
      x(1, 0);
    }
  }
  function ma(e, r) {
    var i = U();
    try {
      return M(e)(r);
    } catch (s) {
      if (_(i), s !== s + 0) throw s;
      x(1, 0);
    }
  }
  function ha(e, r, i) {
    var s = U();
    try {
      M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function wa(e, r) {
    var i = U();
    try {
      M(e)(r);
    } catch (s) {
      if (_(i), s !== s + 0) throw s;
      x(1, 0);
    }
  }
  function ba(e, r, i, s, f, p, E) {
    var S2 = U();
    try {
      return M(e)(r, i, s, f, p, E);
    } catch (C) {
      if (_(S2), C !== C + 0) throw C;
      x(1, 0);
    }
  }
  function ya(e, r, i, s, f, p) {
    var E = U();
    try {
      M(e)(r, i, s, f, p);
    } catch (S2) {
      if (_(E), S2 !== S2 + 0) throw S2;
      x(1, 0);
    }
  }
  function ga(e, r, i, s) {
    var f = U();
    try {
      M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function Ea(e, r, i, s, f) {
    var p = U();
    try {
      M(e)(r, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      x(1, 0);
    }
  }
  function Ta(e, r, i, s, f, p, E) {
    var S2 = U();
    try {
      M(e)(r, i, s, f, p, E);
    } catch (C) {
      if (_(S2), C !== C + 0) throw C;
      x(1, 0);
    }
  }
  function Sa(e, r, i, s, f, p, E) {
    var S2 = U();
    try {
      M(e)(r, i, s, f, p, E);
    } catch (C) {
      if (_(S2), C !== C + 0) throw C;
      x(1, 0);
    }
  }
  function va(e, r, i, s, f, p, E, S2) {
    var C = U();
    try {
      M(e)(r, i, s, f, p, E, S2);
    } catch (R) {
      if (_(C), R !== R + 0) throw R;
      x(1, 0);
    }
  }
  function Aa(e, r, i, s, f) {
    var p = U();
    try {
      return M(e)(r, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      x(1, 0);
    }
  }
  function Oa(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function Ia(e, r, i, s, f, p, E, S2) {
    var C = U();
    try {
      M(e)(r, i, s, f, p, E, S2);
    } catch (R) {
      if (_(C), R !== R + 0) throw R;
      x(1, 0);
    }
  }
  function Ba(e, r, i, s, f, p, E, S2, C, R, X, le) {
    var we = U();
    try {
      M(e)(r, i, s, f, p, E, S2, C, R, X, le);
    } catch (be) {
      if (_(we), be !== be + 0) throw be;
      x(1, 0);
    }
  }
  function La(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      return x(1, 0), 0n;
    }
  }
  function _a(e, r, i, s, f, p, E, S2, C) {
    var R = U();
    try {
      M(e)(r, i, s, f, p, E, S2, C);
    } catch (X) {
      if (_(R), X !== X + 0) throw X;
      x(1, 0);
    }
  }
  function Da(e) {
    var r = U();
    try {
      return M(e)();
    } catch (i) {
      if (_(r), i !== i + 0) throw i;
      x(1, 0);
    }
  }
  function Pa(e, r) {
    var i = U();
    try {
      return M(e)(r);
    } catch (s) {
      if (_(i), s !== s + 0) throw s;
      return x(1, 0), 0n;
    }
  }
  function Ua(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function xa(e) {
    var r = U();
    try {
      return M(e)();
    } catch (i) {
      if (_(r), i !== i + 0) throw i;
      return x(1, 0), 0n;
    }
  }
  function Ca(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function Ma(e, r, i, s, f) {
    var p = U();
    try {
      return M(e)(r, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      x(1, 0);
    }
  }
  function Ra(e, r, i, s, f, p) {
    var E = U();
    try {
      return M(e)(r, i, s, f, p);
    } catch (S2) {
      if (_(E), S2 !== S2 + 0) throw S2;
      x(1, 0);
    }
  }
  function Fa(e, r, i, s, f, p) {
    var E = U();
    try {
      return M(e)(r, i, s, f, p);
    } catch (S2) {
      if (_(E), S2 !== S2 + 0) throw S2;
      x(1, 0);
    }
  }
  function Na(e, r, i, s, f, p) {
    var E = U();
    try {
      return M(e)(r, i, s, f, p);
    } catch (S2) {
      if (_(E), S2 !== S2 + 0) throw S2;
      x(1, 0);
    }
  }
  function ka(e, r, i, s, f, p, E, S2) {
    var C = U();
    try {
      return M(e)(r, i, s, f, p, E, S2);
    } catch (R) {
      if (_(C), R !== R + 0) throw R;
      x(1, 0);
    }
  }
  function Wa(e, r, i, s, f) {
    var p = U();
    try {
      return M(e)(r, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      return x(1, 0), 0n;
    }
  }
  function Ga(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function $a(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function za(e, r, i, s, f, p, E, S2, C, R, X, le) {
    var we = U();
    try {
      return M(e)(r, i, s, f, p, E, S2, C, R, X, le);
    } catch (be) {
      if (_(we), be !== be + 0) throw be;
      x(1, 0);
    }
  }
  function Ha(e, r, i, s, f, p, E, S2, C, R, X) {
    var le = U();
    try {
      M(e)(r, i, s, f, p, E, S2, C, R, X);
    } catch (we) {
      if (_(le), we !== we + 0) throw we;
      x(1, 0);
    }
  }
  function ja(e, r, i, s, f, p, E, S2, C, R, X, le, we, be, Ja, Xa) {
    var Za = U();
    try {
      M(e)(r, i, s, f, p, E, S2, C, R, X, le, we, be, Ja, Xa);
    } catch (Yt) {
      if (_(Za), Yt !== Yt + 0) throw Yt;
      x(1, 0);
    }
  }
  function Va(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function Ya(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function qa(e, r, i, s) {
    var f = U();
    try {
      M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function it() {
    if (0 < Re) te = it;
    else if (o) T?.(t), he();
    else {
      for (var e = Ve; 0 < e.length; ) e.shift()(t);
      0 < Re ? te = it : (t.calledRun = true, P || (he(), T?.(t)));
    }
  }
  return o || (Ee = await Ut(), it()), t.PTR_SIZE = 4, je ? t : new Promise((e, r) => {
    T = e, I = r;
  });
}
var as;
var ss;
var Jr = N(() => {
  "use strict";
  as = Yr, ss = globalThis.self?.name?.startsWith("em-pthread");
  ss && Yr();
});
var Qr;
var an;
var is;
var oe;
var Kr;
var on;
var us;
var fs;
var eo;
var cs;
var Xr;
var to;
var Zr;
var no;
var pt = N(() => {
  "use strict";
  dt();
  Qr = typeof location > "u" ? void 0 : location.origin, an = import.meta.url > "file:" && import.meta.url < "file;", is = () => {
    if (true) {
      if (an) {
        let n = URL;
        return new URL(new n("ort.wasm.bundle.min.mjs", import.meta.url).href, Qr).href;
      }
      return import.meta.url;
    }
  }, oe = is(), Kr = () => {
    if (oe && !oe.startsWith("blob:")) return oe.substring(0, oe.lastIndexOf("/") + 1);
  }, on = (n, t) => {
    try {
      let a = t ?? oe;
      return (a ? new URL(n, a) : new URL(n)).origin === Qr;
    } catch {
      return false;
    }
  }, us = (n, t) => {
    let a = t ?? oe;
    try {
      return (a ? new URL(n, a) : new URL(n)).href;
    } catch {
      return;
    }
  }, fs = (n, t) => `${t ?? "./"}${n}`, eo = async (n) => {
    let a = await (await fetch(n, { credentials: "same-origin" })).blob();
    return URL.createObjectURL(a);
  }, cs = async (n) => (await import(
    /*webpackIgnore:true*/
    /*@vite-ignore*/
    n
  )).default, Xr = (Vr(), Xt(jr)).default, to = async () => {
    if (!oe) throw new Error("Failed to load proxy worker: cannot determine the script source URL.");
    if (on(oe)) return [void 0, Xr()];
    let n = await eo(oe);
    return [n, Xr(n)];
  }, Zr = (Jr(), Xt(qr)).default, no = async (n, t, a, u) => {
    let o = Zr && !(n || t);
    if (o) if (oe) o = on(oe) || u && !a;
    else if (u && !a) o = true;
    else throw new Error("cannot determine the script source URL.");
    if (o) return [void 0, Zr];
    {
      let d = "ort-wasm-simd-threaded.mjs", c = n ?? us(d, t), l = a && c && !on(c, t), m = l ? await eo(c) : c ?? fs(d, t);
      return [l ? m : void 0, await cs(m)];
    }
  };
});
var sn;
var un;
var St;
var ro;
var ls;
var ds;
var ps;
var mt;
var z;
var xe = N(() => {
  "use strict";
  pt();
  un = false, St = false, ro = false, ls = () => {
    if (typeof SharedArrayBuffer > "u") return false;
    try {
      return typeof MessageChannel < "u" && new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)), WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11]));
    } catch {
      return false;
    }
  }, ds = () => {
    try {
      return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 30, 1, 28, 0, 65, 0, 253, 15, 253, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 253, 186, 1, 26, 11]));
    } catch {
      return false;
    }
  }, ps = () => {
    try {
      return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 19, 1, 17, 0, 65, 1, 253, 15, 65, 2, 253, 15, 65, 3, 253, 15, 253, 147, 2, 11]));
    } catch {
      return false;
    }
  }, mt = async (n) => {
    if (un) return Promise.resolve();
    if (St) throw new Error("multiple calls to 'initializeWebAssembly()' detected.");
    if (ro) throw new Error("previous call to 'initializeWebAssembly()' failed.");
    St = true;
    let t = n.initTimeout, a = n.numThreads;
    if (n.simd !== false) {
      if (n.simd === "relaxed") {
        if (!ps()) throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.");
      } else if (!ds()) throw new Error("WebAssembly SIMD is not supported in the current environment.");
    }
    let u = ls();
    a > 1 && !u && (typeof self < "u" && !self.crossOriginIsolated && console.warn("env.wasm.numThreads is set to " + a + ", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."), console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."), n.numThreads = a = 1);
    let o = n.wasmPaths, d = typeof o == "string" ? o : void 0, c = o?.mjs, l = c?.href ?? c, m = o?.wasm, h = m?.href ?? m, g = n.wasmBinary, [b, y] = await no(l, d, a > 1, !!g || !!h), T = false, I = [];
    if (t > 0 && I.push(new Promise((D) => {
      setTimeout(() => {
        T = true, D();
      }, t);
    })), I.push(new Promise((D, $) => {
      let v = { numThreads: a };
      if (g) v.wasmBinary = g, v.locateFile = (A) => A;
      else if (h || d) v.locateFile = (A) => h ?? d + A;
      else if (l && l.indexOf("blob:") !== 0) v.locateFile = (A) => new URL(A, l).href;
      else if (b) {
        let A = Kr();
        A && (v.locateFile = (F) => A + F);
      }
      y(v).then((A) => {
        St = false, un = true, sn = A, D(), b && URL.revokeObjectURL(b);
      }, (A) => {
        St = false, ro = true, $(A);
      });
    })), await Promise.race(I), T) throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`);
  }, z = () => {
    if (un && sn) return sn;
    throw new Error("WebAssembly is not initialized yet.");
  };
});
var ae;
var Qe;
var G;
var vt = N(() => {
  "use strict";
  xe();
  ae = (n, t) => {
    let a = z(), u = a.lengthBytesUTF8(n) + 1, o = a._malloc(u);
    return a.stringToUTF8(n, o, u), t.push(o), o;
  }, Qe = (n, t, a, u) => {
    if (typeof n == "object" && n !== null) {
      if (a.has(n)) throw new Error("Circular reference in options");
      a.add(n);
    }
    Object.entries(n).forEach(([o, d]) => {
      let c = t ? t + o : o;
      if (typeof d == "object") Qe(d, c + ".", a, u);
      else if (typeof d == "string" || typeof d == "number") u(c, d.toString());
      else if (typeof d == "boolean") u(c, d ? "1" : "0");
      else throw new Error(`Can't handle extra config type: ${typeof d}`);
    });
  }, G = (n) => {
    let t = z(), a = t.stackSave();
    try {
      let u = t.PTR_SIZE, o = t.stackAlloc(2 * u);
      t._OrtGetLastError(o, o + u);
      let d = Number(t.getValue(o, u === 4 ? "i32" : "i64")), c = t.getValue(o + u, "*"), l = c ? t.UTF8ToString(c) : "";
      throw new Error(`${n} ERROR_CODE: ${d}, ERROR_MESSAGE: ${l}`);
    } finally {
      t.stackRestore(a);
    }
  };
});
var oo;
var ao = N(() => {
  "use strict";
  xe();
  vt();
  oo = (n) => {
    let t = z(), a = 0, u = [], o = n || {};
    try {
      if (n?.logSeverityLevel === void 0) o.logSeverityLevel = 2;
      else if (typeof n.logSeverityLevel != "number" || !Number.isInteger(n.logSeverityLevel) || n.logSeverityLevel < 0 || n.logSeverityLevel > 4) throw new Error(`log severity level is not valid: ${n.logSeverityLevel}`);
      if (n?.logVerbosityLevel === void 0) o.logVerbosityLevel = 0;
      else if (typeof n.logVerbosityLevel != "number" || !Number.isInteger(n.logVerbosityLevel)) throw new Error(`log verbosity level is not valid: ${n.logVerbosityLevel}`);
      n?.terminate === void 0 && (o.terminate = false);
      let d = 0;
      return n?.tag !== void 0 && (d = ae(n.tag, u)), a = t._OrtCreateRunOptions(o.logSeverityLevel, o.logVerbosityLevel, !!o.terminate, d), a === 0 && G("Can't create run options."), n?.extra !== void 0 && Qe(n.extra, "", /* @__PURE__ */ new WeakSet(), (c, l) => {
        let m = ae(c, u), h = ae(l, u);
        t._OrtAddRunConfigEntry(a, m, h) !== 0 && G(`Can't set a run config entry: ${c} - ${l}.`);
      }), [a, u];
    } catch (d) {
      throw a !== 0 && t._OrtReleaseRunOptions(a), u.forEach((c) => t._free(c)), d;
    }
  };
});
var ms;
var hs;
var ws;
var ke;
var bs;
var so;
var io = N(() => {
  "use strict";
  xe();
  vt();
  ms = (n) => {
    switch (n) {
      case "disabled":
        return 0;
      case "basic":
        return 1;
      case "extended":
        return 2;
      case "layout":
        return 3;
      case "all":
        return 99;
      default:
        throw new Error(`unsupported graph optimization level: ${n}`);
    }
  }, hs = (n) => {
    switch (n) {
      case "sequential":
        return 0;
      case "parallel":
        return 1;
      default:
        throw new Error(`unsupported execution mode: ${n}`);
    }
  }, ws = (n) => {
    n.extra || (n.extra = {}), n.extra.session || (n.extra.session = {});
    let t = n.extra.session;
    t.use_ort_model_bytes_directly || (t.use_ort_model_bytes_directly = "1"), n.executionProviders && n.executionProviders.some((a) => (typeof a == "string" ? a : a.name) === "webgpu") && (n.enableMemPattern = false);
  }, ke = (n, t, a, u) => {
    let o = ae(t, u), d = ae(a, u);
    z()._OrtAddSessionConfigEntry(n, o, d) !== 0 && G(`Can't set a session config entry: ${t} - ${a}.`);
  }, bs = async (n, t, a) => {
    let u = t.executionProviders;
    for (let o of u) {
      let d = typeof o == "string" ? o : o.name, c = [];
      switch (d) {
        case "webnn":
          if (d = "WEBNN", ke(n, "session.disable_quant_qdq", "1", a), ke(n, "session.disable_qdq_constant_folding", "1", a), typeof o != "string") {
            let y = o?.deviceType;
            y && ke(n, "deviceType", y, a);
          }
          break;
        case "webgpu":
          if (d = "JS", typeof o != "string") {
            let b = o;
            if (b?.preferredLayout) {
              if (b.preferredLayout !== "NCHW" && b.preferredLayout !== "NHWC") throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${b.preferredLayout}`);
              ke(n, "preferredLayout", b.preferredLayout, a);
            }
          }
          break;
        case "wasm":
        case "cpu":
          continue;
        default:
          throw new Error(`not supported execution provider: ${d}`);
      }
      let l = ae(d, a), m = c.length, h = 0, g = 0;
      if (m > 0) {
        h = z()._malloc(m * z().PTR_SIZE), a.push(h), g = z()._malloc(m * z().PTR_SIZE), a.push(g);
        for (let b = 0; b < m; b++) z().setValue(h + b * z().PTR_SIZE, c[b][0], "*"), z().setValue(g + b * z().PTR_SIZE, c[b][1], "*");
      }
      await z()._OrtAppendExecutionProvider(n, l, h, g, m) !== 0 && G(`Can't append execution provider: ${d}.`);
    }
  }, so = async (n) => {
    let t = z(), a = 0, u = [], o = n || {};
    ws(o);
    try {
      let d = ms(o.graphOptimizationLevel ?? "all"), c = hs(o.executionMode ?? "sequential"), l = typeof o.logId == "string" ? ae(o.logId, u) : 0, m = o.logSeverityLevel ?? 2;
      if (!Number.isInteger(m) || m < 0 || m > 4) throw new Error(`log severity level is not valid: ${m}`);
      let h = o.logVerbosityLevel ?? 0;
      if (!Number.isInteger(h) || h < 0 || h > 4) throw new Error(`log verbosity level is not valid: ${h}`);
      let g = typeof o.optimizedModelFilePath == "string" ? ae(o.optimizedModelFilePath, u) : 0;
      if (a = t._OrtCreateSessionOptions(d, !!o.enableCpuMemArena, !!o.enableMemPattern, c, !!o.enableProfiling, 0, l, m, h, g), a === 0 && G("Can't create session options."), o.executionProviders && await bs(a, o, u), o.enableGraphCapture !== void 0) {
        if (typeof o.enableGraphCapture != "boolean") throw new Error(`enableGraphCapture must be a boolean value: ${o.enableGraphCapture}`);
        ke(a, "enableGraphCapture", o.enableGraphCapture.toString(), u);
      }
      if (o.freeDimensionOverrides) for (let [b, y] of Object.entries(o.freeDimensionOverrides)) {
        if (typeof b != "string") throw new Error(`free dimension override name must be a string: ${b}`);
        if (typeof y != "number" || !Number.isInteger(y) || y < 0) throw new Error(`free dimension override value must be a non-negative integer: ${y}`);
        let T = ae(b, u);
        t._OrtAddFreeDimensionOverride(a, T, y) !== 0 && G(`Can't set a free dimension override: ${b} - ${y}.`);
      }
      return o.extra !== void 0 && Qe(o.extra, "", /* @__PURE__ */ new WeakSet(), (b, y) => {
        ke(a, b, y, u);
      }), [a, u];
    } catch (d) {
      throw a !== 0 && t._OrtReleaseSessionOptions(a) !== 0 && G("Can't release session options."), u.forEach((c) => t._free(c)), d;
    }
  };
});
var We;
var At;
var Ge;
var uo;
var fo;
var Ot;
var It;
var co;
var fn = N(() => {
  "use strict";
  We = (n) => {
    switch (n) {
      case "int8":
        return 3;
      case "uint8":
        return 2;
      case "bool":
        return 9;
      case "int16":
        return 5;
      case "uint16":
        return 4;
      case "int32":
        return 6;
      case "uint32":
        return 12;
      case "float16":
        return 10;
      case "float32":
        return 1;
      case "float64":
        return 11;
      case "string":
        return 8;
      case "int64":
        return 7;
      case "uint64":
        return 13;
      case "int4":
        return 22;
      case "uint4":
        return 21;
      default:
        throw new Error(`unsupported data type: ${n}`);
    }
  }, At = (n) => {
    switch (n) {
      case 3:
        return "int8";
      case 2:
        return "uint8";
      case 9:
        return "bool";
      case 5:
        return "int16";
      case 4:
        return "uint16";
      case 6:
        return "int32";
      case 12:
        return "uint32";
      case 10:
        return "float16";
      case 1:
        return "float32";
      case 11:
        return "float64";
      case 8:
        return "string";
      case 7:
        return "int64";
      case 13:
        return "uint64";
      case 22:
        return "int4";
      case 21:
        return "uint4";
      default:
        throw new Error(`unsupported data type: ${n}`);
    }
  }, Ge = (n, t) => {
    let a = [-1, 4, 1, 1, 2, 2, 4, 8, -1, 1, 2, 8, 4, 8, -1, -1, -1, -1, -1, -1, -1, 0.5, 0.5][n], u = typeof t == "number" ? t : t.reduce((o, d) => o * d, 1);
    return a > 0 ? Math.ceil(u * a) : void 0;
  }, uo = (n) => {
    switch (n) {
      case "float16":
        return typeof Float16Array < "u" ? Float16Array : Uint16Array;
      case "float32":
        return Float32Array;
      case "uint8":
        return Uint8Array;
      case "int8":
        return Int8Array;
      case "uint16":
        return Uint16Array;
      case "int16":
        return Int16Array;
      case "int32":
        return Int32Array;
      case "bool":
        return Uint8Array;
      case "float64":
        return Float64Array;
      case "uint32":
        return Uint32Array;
      case "int64":
        return BigInt64Array;
      case "uint64":
        return BigUint64Array;
      default:
        throw new Error(`unsupported type: ${n}`);
    }
  }, fo = (n) => {
    switch (n) {
      case "verbose":
        return 0;
      case "info":
        return 1;
      case "warning":
        return 2;
      case "error":
        return 3;
      case "fatal":
        return 4;
      default:
        throw new Error(`unsupported logging level: ${n}`);
    }
  }, Ot = (n) => n === "float32" || n === "float16" || n === "int32" || n === "int64" || n === "uint32" || n === "uint8" || n === "bool" || n === "uint4" || n === "int4", It = (n) => n === "float32" || n === "float16" || n === "int32" || n === "int64" || n === "uint32" || n === "uint64" || n === "int8" || n === "uint8" || n === "bool" || n === "uint4" || n === "int4", co = (n) => {
    switch (n) {
      case "none":
        return 0;
      case "cpu":
        return 1;
      case "cpu-pinned":
        return 2;
      case "texture":
        return 3;
      case "gpu-buffer":
        return 4;
      case "ml-tensor":
        return 5;
      default:
        throw new Error(`unsupported data location: ${n}`);
    }
  };
});
var Ke;
var cn = N(() => {
  "use strict";
  dt();
  Ke = async (n) => {
    if (typeof n == "string") if (false) try {
      let { readFile: t } = Jt("node:fs/promises");
      return new Uint8Array(await t(n));
    } catch (t) {
      if (t.code === "ERR_FS_FILE_TOO_LARGE") {
        let { createReadStream: a } = Jt("node:fs"), u = a(n), o = [];
        for await (let d of u) o.push(d);
        return new Uint8Array(Buffer.concat(o));
      }
      throw t;
    }
    else {
      let t = await fetch(n);
      if (!t.ok) throw new Error(`failed to load external data file: ${n}`);
      let a = t.headers.get("Content-Length"), u = a ? parseInt(a, 10) : 0;
      if (u < 1073741824) return new Uint8Array(await t.arrayBuffer());
      {
        if (!t.body) throw new Error(`failed to load external data file: ${n}, no response body.`);
        let o = t.body.getReader(), d;
        try {
          d = new ArrayBuffer(u);
        } catch (l) {
          if (l instanceof RangeError) {
            let m = Math.ceil(u / 65536);
            d = new WebAssembly.Memory({ initial: m, maximum: m }).buffer;
          } else throw l;
        }
        let c = 0;
        for (; ; ) {
          let { done: l, value: m } = await o.read();
          if (l) break;
          let h = m.byteLength;
          new Uint8Array(d, c, h).set(m), c += h;
        }
        return new Uint8Array(d, 0, u);
      }
    }
    else return n instanceof Blob ? new Uint8Array(await n.arrayBuffer()) : n instanceof Uint8Array ? n : new Uint8Array(n);
  };
});
var ys;
var ht;
var wt;
var $e;
var gs;
var lo;
var Ze;
var bt;
var yt;
var po;
var gt;
var Et;
var Tt;
var rn = N(() => {
  "use strict";
  Te();
  ao();
  io();
  fn();
  xe();
  vt();
  cn();
  ys = (n, t) => {
    z()._OrtInit(n, t) !== 0 && G("Can't initialize onnxruntime.");
  }, ht = async (n) => {
    ys(n.wasm.numThreads, fo(n.logLevel));
  }, wt = async (n, t) => {
    z().asyncInit?.();
    let a = n.webgpu.adapter;
    if (t === "webgpu") {
      if (typeof navigator > "u" || !navigator.gpu) throw new Error("WebGPU is not supported in current environment");
      if (a) {
        if (typeof a.limits != "object" || typeof a.features != "object" || typeof a.requestDevice != "function") throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.");
      } else {
        let u = n.webgpu.powerPreference;
        if (u !== void 0 && u !== "low-power" && u !== "high-performance") throw new Error(`Invalid powerPreference setting: "${u}"`);
        let o = n.webgpu.forceFallbackAdapter;
        if (o !== void 0 && typeof o != "boolean") throw new Error(`Invalid forceFallbackAdapter setting: "${o}"`);
        if (a = await navigator.gpu.requestAdapter({ powerPreference: u, forceFallbackAdapter: o }), !a) throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.');
      }
    }
    if (t === "webnn" && (typeof navigator > "u" || !navigator.ml)) throw new Error("WebNN is not supported in current environment");
  }, $e = /* @__PURE__ */ new Map(), gs = (n) => {
    let t = z(), a = t.stackSave();
    try {
      let u = t.PTR_SIZE, o = t.stackAlloc(2 * u);
      t._OrtGetInputOutputCount(n, o, o + u) !== 0 && G("Can't get session input/output count.");
      let c = u === 4 ? "i32" : "i64";
      return [Number(t.getValue(o, c)), Number(t.getValue(o + u, c))];
    } finally {
      t.stackRestore(a);
    }
  }, lo = (n, t) => {
    let a = z(), u = a.stackSave(), o = 0;
    try {
      let d = a.PTR_SIZE, c = a.stackAlloc(2 * d);
      a._OrtGetInputOutputMetadata(n, t, c, c + d) !== 0 && G("Can't get session input/output metadata.");
      let m = Number(a.getValue(c, "*"));
      o = Number(a.getValue(c + d, "*"));
      let h = a.HEAP32[o / 4];
      if (h === 0) return [m, 0];
      let g = a.HEAPU32[o / 4 + 1], b = [];
      for (let y = 0; y < g; y++) {
        let T = Number(a.getValue(o + 8 + y * d, "*"));
        b.push(T !== 0 ? a.UTF8ToString(T) : Number(a.getValue(o + 8 + (y + g) * d, "*")));
      }
      return [m, h, b];
    } finally {
      a.stackRestore(u), o !== 0 && a._OrtFree(o);
    }
  }, Ze = (n) => {
    let t = z(), a = t._malloc(n.byteLength);
    if (a === 0) throw new Error(`Can't create a session. failed to allocate a buffer of size ${n.byteLength}.`);
    return t.HEAPU8.set(n, a), [a, n.byteLength];
  }, bt = async (n, t) => {
    let a, u, o = z();
    Array.isArray(n) ? [a, u] = n : n.buffer === o.HEAPU8.buffer ? [a, u] = [n.byteOffset, n.byteLength] : [a, u] = Ze(n);
    let d = 0, c = 0, l = 0, m = [], h = [], g = [];
    try {
      if ([c, m] = await so(t), t?.externalData && o.mountExternalData) {
        let P = [];
        for (let k of t.externalData) {
          let w = typeof k == "string" ? k : k.path, Q = typeof k == "string" ? k : k.data;
          P.push(Ke(Q).then((H) => {
            o.mountExternalData(w, H);
          }));
        }
        await Promise.all(P);
      }
      for (let P of t?.executionProviders ?? []) if ((typeof P == "string" ? P : P.name) === "webnn") {
        if (o.shouldTransferToMLTensor = false, typeof P != "string") {
          let w = P, Q = w?.context, H = w?.gpuDevice, ne = w?.deviceType, pe = w?.powerPreference;
          Q ? o.currentContext = Q : H ? o.currentContext = await o.webnnCreateMLContext(H) : o.currentContext = await o.webnnCreateMLContext({ deviceType: ne, powerPreference: pe });
        } else o.currentContext = await o.webnnCreateMLContext();
        break;
      }
      d = await o._OrtCreateSession(a, u, c), o.webgpuOnCreateSession?.(d), d === 0 && G("Can't create a session."), o.jsepOnCreateSession?.(), o.currentContext && (o.webnnRegisterMLContext(d, o.currentContext), o.currentContext = void 0, o.shouldTransferToMLTensor = true);
      let [b, y] = gs(d), T = !!t?.enableGraphCapture, I = [], D = [], $ = [], v = [], A = [];
      for (let P = 0; P < b; P++) {
        let [k, w, Q] = lo(d, P);
        k === 0 && G("Can't get an input name."), h.push(k);
        let H = o.UTF8ToString(k);
        I.push(H), $.push(w === 0 ? { name: H, isTensor: false } : { name: H, isTensor: true, type: At(w), shape: Q });
      }
      for (let P = 0; P < y; P++) {
        let [k, w, Q] = lo(d, P + b);
        k === 0 && G("Can't get an output name."), g.push(k);
        let H = o.UTF8ToString(k);
        D.push(H), v.push(w === 0 ? { name: H, isTensor: false } : { name: H, isTensor: true, type: At(w), shape: Q });
      }
      return $e.set(d, [d, h, g, null, T, false]), [d, I, D, $, v];
    } catch (b) {
      throw h.forEach((y) => o._OrtFree(y)), g.forEach((y) => o._OrtFree(y)), l !== 0 && o._OrtReleaseBinding(l) !== 0 && G("Can't release IO binding."), d !== 0 && o._OrtReleaseSession(d) !== 0 && G("Can't release session."), b;
    } finally {
      o._free(a), c !== 0 && o._OrtReleaseSessionOptions(c) !== 0 && G("Can't release session options."), m.forEach((b) => o._free(b)), o.unmountExternalData?.();
    }
  }, yt = (n) => {
    let t = z(), a = $e.get(n);
    if (!a) throw new Error(`cannot release session. invalid session id: ${n}`);
    let [u, o, d, c, l] = a;
    c && (l && t._OrtClearBoundOutputs(c.handle) !== 0 && G("Can't clear bound outputs."), t._OrtReleaseBinding(c.handle) !== 0 && G("Can't release IO binding.")), t.jsepOnReleaseSession?.(n), t.webnnOnReleaseSession?.(n), t.webgpuOnReleaseSession?.(n), o.forEach((m) => t._OrtFree(m)), d.forEach((m) => t._OrtFree(m)), t._OrtReleaseSession(u) !== 0 && G("Can't release session."), $e.delete(n);
  }, po = async (n, t, a, u, o, d, c = false) => {
    if (!n) {
      t.push(0);
      return;
    }
    let l = z(), m = l.PTR_SIZE, h = n[0], g = n[1], b = n[3], y = b, T, I;
    if (h === "string" && (b === "gpu-buffer" || b === "ml-tensor")) throw new Error("String tensor is not supported on GPU.");
    if (c && b !== "gpu-buffer") throw new Error(`External buffer must be provided for input/output index ${d} when enableGraphCapture is true.`);
    if (b === "gpu-buffer") {
      let v = n[2].gpuBuffer;
      I = Ge(We(h), g);
      {
        let A = l.jsepRegisterBuffer;
        if (!A) throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');
        T = A(u, d, v, I);
      }
    } else if (b === "ml-tensor") {
      let v = n[2].mlTensor;
      I = Ge(We(h), g);
      let A = l.webnnRegisterMLTensor;
      if (!A) throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');
      T = A(u, v, We(h), g);
    } else {
      let v = n[2];
      if (Array.isArray(v)) {
        I = m * v.length, T = l._malloc(I), a.push(T);
        for (let A = 0; A < v.length; A++) {
          if (typeof v[A] != "string") throw new TypeError(`tensor data at index ${A} is not a string`);
          l.setValue(T + A * m, ae(v[A], a), "*");
        }
      } else {
        let A = l.webnnIsGraphInput, F = l.webnnIsGraphOutput;
        if (h !== "string" && A && F) {
          let P = l.UTF8ToString(o);
          if (A(u, P) || F(u, P)) {
            let k = We(h);
            I = Ge(k, g), y = "ml-tensor";
            let w = l.webnnCreateTemporaryTensor, Q = l.webnnUploadTensor;
            if (!w || !Q) throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');
            let H = await w(u, k, g);
            Q(H, new Uint8Array(v.buffer, v.byteOffset, v.byteLength)), T = H;
          } else I = v.byteLength, T = l._malloc(I), a.push(T), l.HEAPU8.set(new Uint8Array(v.buffer, v.byteOffset, I), T);
        } else I = v.byteLength, T = l._malloc(I), a.push(T), l.HEAPU8.set(new Uint8Array(v.buffer, v.byteOffset, I), T);
      }
    }
    let D = l.stackSave(), $ = l.stackAlloc(4 * g.length);
    try {
      g.forEach((A, F) => l.setValue($ + F * m, A, m === 4 ? "i32" : "i64"));
      let v = l._OrtCreateTensor(We(h), T, I, $, g.length, co(y));
      v === 0 && G(`Can't create tensor for input/output. session=${u}, index=${d}.`), t.push(v);
    } finally {
      l.stackRestore(D);
    }
  }, gt = async (n, t, a, u, o, d) => {
    let c = z(), l = c.PTR_SIZE, m = $e.get(n);
    if (!m) throw new Error(`cannot run inference. invalid session id: ${n}`);
    let h = m[0], g = m[1], b = m[2], y = m[3], T = m[4], I = m[5], D = t.length, $ = u.length, v = 0, A = [], F = [], P = [], k = [], w = [], Q = c.stackSave(), H = c.stackAlloc(D * l), ne = c.stackAlloc(D * l), pe = c.stackAlloc($ * l), B = c.stackAlloc($ * l);
    try {
      [v, A] = oo(d), Pe("wasm prepareInputOutputTensor");
      for (let O = 0; O < D; O++) await po(a[O], F, k, n, g[t[O]], t[O], T);
      for (let O = 0; O < $; O++) await po(o[O], P, k, n, b[u[O]], D + u[O], T);
      Ue("wasm prepareInputOutputTensor");
      for (let O = 0; O < D; O++) c.setValue(H + O * l, F[O], "*"), c.setValue(ne + O * l, g[t[O]], "*");
      for (let O = 0; O < $; O++) c.setValue(pe + O * l, P[O], "*"), c.setValue(B + O * l, b[u[O]], "*");
      c.jsepOnRunStart?.(h), c.webnnOnRunStart?.(h);
      let W;
      W = await c._OrtRun(h, ne, H, D, B, $, pe, v), W !== 0 && G("failed to call OrtRun().");
      let re = [], me = [];
      Pe("wasm ProcessOutputTensor");
      for (let O = 0; O < $; O++) {
        let K2 = Number(c.getValue(pe + O * l, "*"));
        if (K2 === P[O] || w.includes(P[O])) {
          re.push(o[O]), K2 !== P[O] && c._OrtReleaseTensor(K2) !== 0 && G("Can't release tensor.");
          continue;
        }
        let je = c.stackSave(), ee = c.stackAlloc(4 * l), he = false, j, J = 0;
        try {
          c._OrtGetTensorData(K2, ee, ee + l, ee + 2 * l, ee + 3 * l) !== 0 && G(`Can't access output tensor data on index ${O}.`);
          let Se = l === 4 ? "i32" : "i64", ve = Number(c.getValue(ee, Se));
          J = c.getValue(ee + l, "*");
          let Ve = c.getValue(ee + l * 2, "*"), Re = Number(c.getValue(ee + l * 3, Se)), te = [];
          for (let L = 0; L < Re; L++) te.push(Number(c.getValue(Ve + L * l, Se)));
          c._OrtFree(Ve) !== 0 && G("Can't free memory for tensor dims.");
          let ue = te.reduce((L, V) => L * V, 1);
          j = At(ve);
          let se = y?.outputPreferredLocations[u[O]];
          if (j === "string") {
            if (se === "gpu-buffer" || se === "ml-tensor") throw new Error("String tensor is not supported on GPU.");
            let L = [];
            for (let V = 0; V < ue; V++) {
              let fe = c.getValue(J + V * l, "*"), ye = c.getValue(J + (V + 1) * l, "*"), ce = V === ue - 1 ? void 0 : ye - fe;
              L.push(c.UTF8ToString(fe, ce));
            }
            re.push([j, te, L, "cpu"]);
          } else if (se === "gpu-buffer" && ue > 0) {
            let L = c.jsepGetBuffer;
            if (!L) throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');
            let V = L(J), fe = Ge(ve, ue);
            if (fe === void 0 || !Ot(j)) throw new Error(`Unsupported data type: ${j}`);
            he = true, re.push([j, te, { gpuBuffer: V, download: c.jsepCreateDownloader(V, fe, j), dispose: () => {
              c._OrtReleaseTensor(K2) !== 0 && G("Can't release tensor.");
            } }, "gpu-buffer"]);
          } else if (se === "ml-tensor" && ue > 0) {
            let L = c.webnnEnsureTensor, V = c.webnnIsGraphInputOutputTypeSupported;
            if (!L || !V) throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');
            if (Ge(ve, ue) === void 0 || !It(j)) throw new Error(`Unsupported data type: ${j}`);
            if (!V(n, j, false)) throw new Error(`preferredLocation "ml-tensor" for ${j} output is not supported by current WebNN Context.`);
            let ye = await L(n, J, ve, te, false);
            he = true, re.push([j, te, { mlTensor: ye, download: c.webnnCreateMLTensorDownloader(J, j), dispose: () => {
              c.webnnReleaseTensorId(J), c._OrtReleaseTensor(K2);
            } }, "ml-tensor"]);
          } else if (se === "ml-tensor-cpu-output" && ue > 0) {
            let L = c.webnnCreateMLTensorDownloader(J, j)(), V = re.length;
            he = true, me.push((async () => {
              let fe = [V, await L];
              return c.webnnReleaseTensorId(J), c._OrtReleaseTensor(K2), fe;
            })()), re.push([j, te, [], "cpu"]);
          } else {
            let L = uo(j), V = new L(ue);
            new Uint8Array(V.buffer, V.byteOffset, V.byteLength).set(c.HEAPU8.subarray(J, J + V.byteLength)), re.push([j, te, V, "cpu"]);
          }
        } finally {
          c.stackRestore(je), j === "string" && J && c._free(J), he || c._OrtReleaseTensor(K2);
        }
      }
      y && !T && (c._OrtClearBoundOutputs(y.handle) !== 0 && G("Can't clear bound outputs."), $e.set(n, [h, g, b, y, T, false]));
      for (let [O, K2] of await Promise.all(me)) re[O][2] = K2;
      return Ue("wasm ProcessOutputTensor"), re;
    } finally {
      c.webnnOnRunEnd?.(h), c.stackRestore(Q), F.forEach((W) => c._OrtReleaseTensor(W)), P.forEach((W) => c._OrtReleaseTensor(W)), k.forEach((W) => c._free(W)), v !== 0 && c._OrtReleaseRunOptions(v), A.forEach((W) => c._free(W));
    }
  }, Et = (n) => {
    let t = z(), a = $e.get(n);
    if (!a) throw new Error("invalid session id");
    let u = a[0], o = t._OrtEndProfiling(u);
    o === 0 && G("Can't get an profile file name."), t._OrtFree(o);
  }, Tt = (n) => {
    let t = [];
    for (let a of n) {
      let u = a[2];
      !Array.isArray(u) && "buffer" in u && t.push(u.buffer);
    }
    return t;
  };
});
var Me;
var ie;
var et;
var Lt;
var _t2;
var Bt;
var ln;
var dn;
var ze;
var He;
var Ts;
var mo;
var ho;
var wo;
var bo;
var yo;
var go;
var Eo;
var pn = N(() => {
  "use strict";
  Te();
  rn();
  xe();
  pt();
  Me = () => !!Y.wasm.proxy && typeof document < "u", et = false, Lt = false, _t2 = false, dn = /* @__PURE__ */ new Map(), ze = (n, t) => {
    let a = dn.get(n);
    a ? a.push(t) : dn.set(n, [t]);
  }, He = () => {
    if (et || !Lt || _t2 || !ie) throw new Error("worker not ready");
  }, Ts = (n) => {
    switch (n.data.type) {
      case "init-wasm":
        et = false, n.data.err ? (_t2 = true, ln[1](n.data.err)) : (Lt = true, ln[0]()), Bt && (URL.revokeObjectURL(Bt), Bt = void 0);
        break;
      case "init-ep":
      case "copy-from":
      case "create":
      case "release":
      case "run":
      case "end-profiling": {
        let t = dn.get(n.data.type);
        n.data.err ? t.shift()[1](n.data.err) : t.shift()[0](n.data.out);
        break;
      }
      default:
    }
  }, mo = async () => {
    if (!Lt) {
      if (et) throw new Error("multiple calls to 'initWasm()' detected.");
      if (_t2) throw new Error("previous call to 'initWasm()' failed.");
      if (et = true, Me()) return new Promise((n, t) => {
        ie?.terminate(), to().then(([a, u]) => {
          try {
            ie = u, ie.onerror = (d) => t(d), ie.onmessage = Ts, ln = [n, t];
            let o = { type: "init-wasm", in: Y };
            !o.in.wasm.wasmPaths && (a || an) && (o.in.wasm.wasmPaths = { wasm: new URL("ort-wasm-simd-threaded.wasm", import.meta.url).href }), ie.postMessage(o), Bt = a;
          } catch (o) {
            t(o);
          }
        }, t);
      });
      try {
        await mt(Y.wasm), await ht(Y), Lt = true;
      } catch (n) {
        throw _t2 = true, n;
      } finally {
        et = false;
      }
    }
  }, ho = async (n) => {
    if (Me()) return He(), new Promise((t, a) => {
      ze("init-ep", [t, a]);
      let u = { type: "init-ep", in: { epName: n, env: Y } };
      ie.postMessage(u);
    });
    await wt(Y, n);
  }, wo = async (n) => Me() ? (He(), new Promise((t, a) => {
    ze("copy-from", [t, a]);
    let u = { type: "copy-from", in: { buffer: n } };
    ie.postMessage(u, [n.buffer]);
  })) : Ze(n), bo = async (n, t) => {
    if (Me()) {
      if (t?.preferredOutputLocation) throw new Error('session option "preferredOutputLocation" is not supported for proxy.');
      return He(), new Promise((a, u) => {
        ze("create", [a, u]);
        let o = { type: "create", in: { model: n, options: { ...t } } }, d = [];
        n instanceof Uint8Array && d.push(n.buffer), ie.postMessage(o, d);
      });
    } else return bt(n, t);
  }, yo = async (n) => {
    if (Me()) return He(), new Promise((t, a) => {
      ze("release", [t, a]);
      let u = { type: "release", in: n };
      ie.postMessage(u);
    });
    yt(n);
  }, go = async (n, t, a, u, o, d) => {
    if (Me()) {
      if (a.some((c) => c[3] !== "cpu")) throw new Error("input tensor on GPU is not supported for proxy.");
      if (o.some((c) => c)) throw new Error("pre-allocated output tensor is not supported for proxy.");
      return He(), new Promise((c, l) => {
        ze("run", [c, l]);
        let m = a, h = { type: "run", in: { sessionId: n, inputIndices: t, inputs: m, outputIndices: u, options: d } };
        ie.postMessage(h, Tt(m));
      });
    } else return gt(n, t, a, u, o, d);
  }, Eo = async (n) => {
    if (Me()) return He(), new Promise((t, a) => {
      ze("end-profiling", [t, a]);
      let u = { type: "end-profiling", in: n };
      ie.postMessage(u);
    });
    Et(n);
  };
});
var To;
var Ss;
var Dt;
var So = N(() => {
  "use strict";
  Te();
  pn();
  fn();
  dt();
  cn();
  To = (n, t) => {
    switch (n.location) {
      case "cpu":
        return [n.type, n.dims, n.data, "cpu"];
      case "gpu-buffer":
        return [n.type, n.dims, { gpuBuffer: n.gpuBuffer }, "gpu-buffer"];
      case "ml-tensor":
        return [n.type, n.dims, { mlTensor: n.mlTensor }, "ml-tensor"];
      default:
        throw new Error(`invalid data location: ${n.location} for ${t()}`);
    }
  }, Ss = (n) => {
    switch (n[3]) {
      case "cpu":
        return new de(n[0], n[2], n[1]);
      case "gpu-buffer": {
        let t = n[0];
        if (!Ot(t)) throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);
        let { gpuBuffer: a, download: u, dispose: o } = n[2];
        return de.fromGpuBuffer(a, { dataType: t, dims: n[1], download: u, dispose: o });
      }
      case "ml-tensor": {
        let t = n[0];
        if (!It(t)) throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);
        let { mlTensor: a, download: u, dispose: o } = n[2];
        return de.fromMLTensor(a, { dataType: t, dims: n[1], download: u, dispose: o });
      }
      default:
        throw new Error(`invalid data location: ${n[3]}`);
    }
  }, Dt = class {
    async fetchModelAndCopyToWasmMemory(t) {
      return wo(await Ke(t));
    }
    async loadModel(t, a) {
      _e();
      let u;
      typeof t == "string" ? u = await this.fetchModelAndCopyToWasmMemory(t) : u = t, [this.sessionId, this.inputNames, this.outputNames, this.inputMetadata, this.outputMetadata] = await bo(u, a), De();
    }
    async dispose() {
      return yo(this.sessionId);
    }
    async run(t, a, u) {
      _e();
      let o = [], d = [];
      Object.entries(t).forEach((y) => {
        let T = y[0], I = y[1], D = this.inputNames.indexOf(T);
        if (D === -1) throw new Error(`invalid input '${T}'`);
        o.push(I), d.push(D);
      });
      let c = [], l = [];
      Object.entries(a).forEach((y) => {
        let T = y[0], I = y[1], D = this.outputNames.indexOf(T);
        if (D === -1) throw new Error(`invalid output '${T}'`);
        c.push(I), l.push(D);
      });
      let m = o.map((y, T) => To(y, () => `input "${this.inputNames[d[T]]}"`)), h = c.map((y, T) => y ? To(y, () => `output "${this.outputNames[l[T]]}"`) : null), g = await go(this.sessionId, d, m, l, h, u), b = {};
      for (let y = 0; y < g.length; y++) b[this.outputNames[l[y]]] = c[y] ?? Ss(g[y]);
      return De(), b;
    }
    startProfiling() {
    }
    endProfiling() {
      Eo(this.sessionId);
    }
  };
});
var Ao = {};
ut(Ao, { OnnxruntimeWebAssemblyBackend: () => Pt, initializeFlags: () => vo, wasmBackend: () => vs });
var vo;
var Pt;
var vs;
var Oo = N(() => {
  "use strict";
  Te();
  pn();
  So();
  vo = () => {
    (typeof Y.wasm.initTimeout != "number" || Y.wasm.initTimeout < 0) && (Y.wasm.initTimeout = 0);
    let n = Y.wasm.simd;
    if (typeof n != "boolean" && n !== void 0 && n !== "fixed" && n !== "relaxed" && (console.warn(`Property "env.wasm.simd" is set to unknown value "${n}". Reset it to \`false\` and ignore SIMD feature checking.`), Y.wasm.simd = false), typeof Y.wasm.proxy != "boolean" && (Y.wasm.proxy = false), typeof Y.wasm.trace != "boolean" && (Y.wasm.trace = false), typeof Y.wasm.numThreads != "number" || !Number.isInteger(Y.wasm.numThreads) || Y.wasm.numThreads <= 0) if (typeof self < "u" && !self.crossOriginIsolated) Y.wasm.numThreads = 1;
    else {
      let t = typeof navigator > "u" ? Jt("node:os").cpus().length : navigator.hardwareConcurrency;
      Y.wasm.numThreads = Math.min(4, Math.ceil((t || 1) / 2));
    }
  }, Pt = class {
    async init(t) {
      vo(), await mo(), await ho(t);
    }
    async createInferenceSessionHandler(t, a) {
      let u = new Dt();
      return await u.loadModel(t, a), u;
    }
  }, vs = new Pt();
});
Te();
Te();
Te();
var $r = "1.30.0";
var iu = nn;
{
  let n = (Oo(), Xt(Ao)).wasmBackend;
  Je("cpu", n, 10), Je("wasm", n, 10);
}
Object.defineProperty(Y.versions, "web", { value: $r, enumerable: true });

// node_modules/@internal/read-aloud/backend/piper-plus/vendor/ojt/ojt.mjs
async function Module(moduleArg = {}) {
  var Module2 = moduleArg;
  var ENVIRONMENT_IS_WEB = !!globalThis.window;
  var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
  var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
  var thisProgram = "./this.program";
  var _scriptName = import.meta.url;
  var scriptDirectory = "";
  function locateFile(path) {
    if (Module2["locateFile"]) {
      return Module2["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
  }
  var readAsync, readBinary;
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    try {
      scriptDirectory = new URL(".", _scriptName).href;
    } catch {
    }
    {
      if (ENVIRONMENT_IS_WORKER) {
        readBinary = (url) => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.responseType = "arraybuffer";
          xhr.send(null);
          return new Uint8Array(xhr.response);
        };
      }
      readAsync = async (url) => {
        var response = await fetch(url, { credentials: "same-origin" });
        if (response.ok) {
          return response.arrayBuffer();
        }
        throw new Error(response.status + " : " + response.url);
      };
    }
  } else {
  }
  var out = console.log.bind(console);
  var err = console.error.bind(console);
  var wasmBinary;
  var ABORT = false;
  class EmscriptenEH {
  }
  class EmscriptenSjLj extends EmscriptenEH {
  }
  var runtimeInitialized = false;
  function getMemoryBuffer() {
    return wasmMemory.buffer;
  }
  function updateMemoryViews() {
    if (HEAP8?.buffer?.resizable) return;
    var b = getMemoryBuffer();
    HEAP8 = new Int8Array(b);
    HEAP16 = new Int16Array(b);
    Module2["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    HEAP32 = new Int32Array(b);
    HEAPU32 = new Uint32Array(b);
    HEAP64 = new BigInt64Array(b);
  }
  function preRun() {
  }
  function initRuntime() {
    runtimeInitialized = true;
    if (!Module2["noFSInit"] && !FS.initialized) FS.init();
    TTY.init();
    wasmExports["__wasm_call_ctors"]();
    FS.ignorePermissions = false;
  }
  function postRun() {
  }
  function abort(what) {
    what = `Aborted(${what})`;
    err(what);
    ABORT = true;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e;
  }
  var wasmBinaryFile;
  function findWasmBinary() {
    if (Module2["locateFile"]) {
      return locateFile("ojt.wasm");
    }
    return new URL("ojt.wasm", import.meta.url).href;
  }
  function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  }
  async function getWasmBinary(binaryFile) {
    if (!wasmBinary) {
      try {
        var response = await readAsync(binaryFile);
        return new Uint8Array(response);
      } catch {
      }
    }
    return getBinarySync(binaryFile);
  }
  async function instantiateArrayBuffer(binaryFile, imports) {
    try {
      var binary = await getWasmBinary(binaryFile);
      var instance = await WebAssembly.instantiate(binary, imports);
      return instance;
    } catch (reason) {
      err(`failed to asynchronously prepare wasm: ${reason}`);
      abort(reason);
    }
  }
  async function instantiateAsync(binary, binaryFile, imports) {
    if (!binary) {
      try {
        var response = fetch(binaryFile, { credentials: "same-origin" });
        var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
        return instantiationResult;
      } catch (reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
      }
    }
    return instantiateArrayBuffer(binaryFile, imports);
  }
  function getWasmImports() {
    var imports = { env: wasmImports, wasi_snapshot_preview1: wasmImports };
    return imports;
  }
  async function createWasm() {
    function receiveInstance(instance) {
      wasmExports = instance.exports;
      assignWasmExports(wasmExports);
      updateMemoryViews();
      return wasmExports;
    }
    function receiveInstantiationResult(result2) {
      return receiveInstance(result2["instance"]);
    }
    var info = getWasmImports();
    wasmBinaryFile ??= findWasmBinary();
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
  }
  class ExitStatus {
    name = "ExitStatus";
    constructor(status) {
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }
  }
  var HEAP8;
  var stackRestore = (val) => __emscripten_stack_restore(val);
  var stackSave = () => _emscripten_stack_get_current();
  var HEAPU32;
  class ExceptionInfo {
    constructor(excPtr) {
      this.excPtr = excPtr;
      this.ptr = excPtr - 24;
    }
    set_type(type) {
      HEAPU32[this.ptr + 4 >> 2] = type;
    }
    get_type() {
      return HEAPU32[this.ptr + 4 >> 2];
    }
    set_destructor(destructor) {
      HEAPU32[this.ptr + 8 >> 2] = destructor;
    }
    get_destructor() {
      return HEAPU32[this.ptr + 8 >> 2];
    }
    set_caught(caught) {
      caught = caught ? 1 : 0;
      HEAP8[this.ptr + 12] = caught;
    }
    get_caught() {
      return HEAP8[this.ptr + 12] != 0;
    }
    set_rethrown(rethrown) {
      rethrown = rethrown ? 1 : 0;
      HEAP8[this.ptr + 13] = rethrown;
    }
    get_rethrown() {
      return HEAP8[this.ptr + 13] != 0;
    }
    init(type, destructor) {
      this.set_adjusted_ptr(0);
      this.set_type(type);
      this.set_destructor(destructor);
    }
    set_adjusted_ptr(adjustedPtr) {
      HEAPU32[this.ptr + 16 >> 2] = adjustedPtr;
    }
    get_adjusted_ptr() {
      return HEAPU32[this.ptr + 16 >> 2];
    }
  }
  var uncaughtExceptionCount = 0;
  var __Unwind_RaiseException = (ex) => {
    abort();
  };
  var ___cxa_throw = (ptr, type, destructor) => {
    var info = new ExceptionInfo(ptr);
    info.init(type, destructor);
    uncaughtExceptionCount++;
    __Unwind_RaiseException(ptr);
  };
  var HEAP32;
  var syscallGetVarargI = () => {
    var ret = HEAP32[+SYSCALLS.varargs >> 2];
    SYSCALLS.varargs += 4;
    return ret;
  };
  var syscallGetVarargP = syscallGetVarargI;
  var PATH = { isAbs: (path) => path.charAt(0) === "/", splitPath: (filename) => {
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  }, normalizeArray: (parts, allowAboveRoot) => {
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    if (allowAboveRoot) {
      for (; up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  }, normalize: (path) => {
    var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
    path = PATH.normalizeArray(path.split("/").filter((p) => !!p), !isAbsolute).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  }, dirname: (path) => {
    var result = PATH.splitPath(path), root = result[0], dir = result[1];
    if (!root && !dir) {
      return ".";
    }
    if (dir) {
      dir = dir.slice(0, -1);
    }
    return root + dir;
  }, basename: (path) => path && path.match(/([^\/]+|\/)\/*$/)[1], join: (...paths) => PATH.normalize(paths.join("/")), join2: (l, r) => PATH.normalize(l + "/" + r) };
  var initRandomFill = () => (view) => (crypto.getRandomValues(view), 0);
  var randomFill = (view) => (randomFill = initRandomFill())(view);
  var PATH_FS = { resolve: (...args) => {
    var resolvedPath = "", resolvedAbsolute = false;
    for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = i >= 0 ? args[i] : FS.cwd();
      if (typeof path != "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path);
    }
    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((p) => !!p), !resolvedAbsolute).join("/");
    return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
  }, relative: (from, to2) => {
    from = PATH_FS.resolve(from).slice(1);
    to2 = PATH_FS.resolve(to2).slice(1);
    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to2.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  } };
  var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
    var maxIdx = idx + maxBytesToRead;
    if (ignoreNul) return maxIdx;
    while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
    return idx;
  };
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
    var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
      return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    var str = "";
    while (idx < endPtr) {
      var u0 = heapOrArray[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = heapOrArray[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      var u2 = heapOrArray[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
    return str;
  };
  var FS_stdin_getChar_buffer = [];
  var lengthBytesUTF8 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      var c = str.charCodeAt(i);
      if (c <= 127) {
        len++;
      } else if (c <= 2047) {
        len += 2;
      } else if (c >= 55296 && c <= 57343) {
        len += 4;
        ++i;
      } else {
        len += 3;
      }
    }
    return len;
  };
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
      var u = str.codePointAt(i);
      if (u <= 127) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u;
      } else if (u <= 2047) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 192 | u >> 6;
        heap[outIdx++] = 128 | u & 63;
      } else if (u <= 65535) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 224 | u >> 12;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63;
      } else {
        if (outIdx + 3 >= endIdx) break;
        heap[outIdx++] = 240 | u >> 18;
        heap[outIdx++] = 128 | u >> 12 & 63;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63;
        i++;
      }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx;
  };
  var intArrayFromString = (stringy, dontAddNull, length) => {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
  };
  var FS_stdin_getChar = () => {
    if (!FS_stdin_getChar_buffer.length) {
      var result = null;
      if (globalThis.window?.prompt) {
        result = window.prompt("Input: ");
        if (result !== null) {
          result += "\n";
        }
      } else {
      }
      if (!result) {
        return null;
      }
      FS_stdin_getChar_buffer = intArrayFromString(result, true);
    }
    return FS_stdin_getChar_buffer.shift();
  };
  var TTY = { ttys: [], init() {
  }, shutdown() {
  }, register(dev, ops) {
    TTY.ttys[dev] = { input: [], output: [], ops };
    FS.registerDevice(dev, TTY.stream_ops);
  }, stream_ops: { open(stream) {
    var tty = TTY.ttys[stream.node.rdev];
    if (!tty) {
      throw new FS.ErrnoError(43);
    }
    stream.tty = tty;
    stream.seekable = false;
  }, close(stream) {
    stream.tty.ops.fsync(stream.tty);
  }, fsync(stream) {
    stream.tty.ops.fsync(stream.tty);
  }, read(stream, buffer, offset, length, pos) {
    if (!stream.tty || !stream.tty.ops.get_char) {
      throw new FS.ErrnoError(60);
    }
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
      var result;
      try {
        result = stream.tty.ops.get_char(stream.tty);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (result === void 0 && !bytesRead) {
        throw new FS.ErrnoError(6);
      }
      if (result === null || result === void 0) break;
      bytesRead++;
      buffer[offset + i] = result;
      if (result === 10) break;
    }
    if (bytesRead) {
      stream.node.atime = Date.now();
    }
    return bytesRead;
  }, write(stream, buffer, offset, length, pos) {
    if (!stream.tty || !stream.tty.ops.put_char) {
      throw new FS.ErrnoError(60);
    }
    try {
      for (var i = 0; i < length; i++) {
        stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
      }
    } catch (e) {
      throw new FS.ErrnoError(29);
    }
    if (length) {
      stream.node.mtime = stream.node.ctime = Date.now();
    }
    return i;
  } }, default_tty_ops: { get_char(tty) {
    return FS_stdin_getChar();
  }, put_char(tty, val) {
    if (val === null || val === 10) {
      out(UTF8ArrayToString(tty.output));
      tty.output = [];
    } else {
      if (val != 0) tty.output.push(val);
    }
  }, fsync(tty) {
    if (tty.output?.length > 0) {
      out(UTF8ArrayToString(tty.output));
      tty.output = [];
    }
  }, ioctl_tcgets(tty) {
    return { c_iflag: 25856, c_oflag: 5, c_cflag: 191, c_lflag: 35387, c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  }, ioctl_tcsets(tty, optional_actions, data) {
    return 0;
  }, ioctl_tiocgwinsz(tty) {
    return [24, 80];
  } }, default_tty1_ops: { put_char(tty, val) {
    if (val === null || val === 10) {
      err(UTF8ArrayToString(tty.output));
      tty.output = [];
    } else {
      if (val != 0) tty.output.push(val);
    }
  }, fsync(tty) {
    if (tty.output?.length > 0) {
      err(UTF8ArrayToString(tty.output));
      tty.output = [];
    }
  } } };
  var HEAPU8;
  var zeroMemory = (ptr, size) => HEAPU8.fill(0, ptr, ptr + size);
  var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
  var mmapAlloc = (size) => {
    size = alignMemory(size, 65536);
    var ptr = _emscripten_builtin_memalign(65536, size);
    if (ptr) zeroMemory(ptr, size);
    return ptr;
  };
  var MEMFS = { ops_table: null, mount(mount) {
    return MEMFS.createNode(null, "/", 16895, 0);
  }, createNode(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      throw new FS.ErrnoError(63);
    }
    MEMFS.ops_table ||= { dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } }, file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } }, link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} }, chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops } };
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {};
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      node.usedBytes = 0;
      node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream;
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream;
    }
    node.atime = node.mtime = node.ctime = Date.now();
    if (parent) {
      parent.contents[name] = node;
      parent.atime = parent.mtime = parent.ctime = node.atime;
    }
    return node;
  }, getFileDataAsTypedArray(node) {
    return node.contents.subarray(0, node.usedBytes);
  }, expandFileStorage(node, newCapacity) {
    var prevCapacity = node.contents.length;
    if (prevCapacity >= newCapacity) return;
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
    if (prevCapacity) newCapacity = Math.max(newCapacity, 256);
    var oldContents = MEMFS.getFileDataAsTypedArray(node);
    node.contents = new Uint8Array(newCapacity);
    node.contents.set(oldContents);
  }, resizeFileStorage(node, newSize) {
    if (node.usedBytes == newSize) return;
    var oldContents = node.contents;
    node.contents = new Uint8Array(newSize);
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
    node.usedBytes = newSize;
  }, node_ops: { getattr(node) {
    var attr = {};
    attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
    attr.ino = node.id;
    attr.mode = node.mode;
    attr.nlink = 1;
    attr.uid = 0;
    attr.gid = 0;
    attr.rdev = node.rdev;
    if (FS.isDir(node.mode)) {
      attr.size = 4096;
    } else if (FS.isFile(node.mode)) {
      attr.size = node.usedBytes;
    } else if (FS.isLink(node.mode)) {
      attr.size = node.link.length;
    } else {
      attr.size = 0;
    }
    attr.atime = new Date(node.atime);
    attr.mtime = new Date(node.mtime);
    attr.ctime = new Date(node.ctime);
    attr.blksize = 4096;
    attr.blocks = Math.ceil(attr.size / attr.blksize);
    return attr;
  }, setattr(node, attr) {
    for (const key of ["mode", "atime", "mtime", "ctime"]) {
      if (attr[key] != null) {
        node[key] = attr[key];
      }
    }
    if (attr.size !== void 0) {
      MEMFS.resizeFileStorage(node, attr.size);
    }
  }, lookup(parent, name) {
    if (!MEMFS.doesNotExistError) {
      MEMFS.doesNotExistError = new FS.ErrnoError(44);
      MEMFS.doesNotExistError.stack = "<generic error, no stack>";
    }
    throw MEMFS.doesNotExistError;
  }, mknod(parent, name, mode, dev) {
    return MEMFS.createNode(parent, name, mode, dev);
  }, rename(old_node, new_dir, new_name) {
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {
    }
    if (new_node) {
      if (FS.isDir(old_node.mode)) {
        for (var i in new_node.contents) {
          throw new FS.ErrnoError(55);
        }
      }
      FS.hashRemoveNode(new_node);
    }
    delete old_node.parent.contents[old_node.name];
    new_dir.contents[new_name] = old_node;
    old_node.name = new_name;
    new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
  }, unlink(parent, name) {
    delete parent.contents[name];
    parent.ctime = parent.mtime = Date.now();
  }, rmdir(parent, name) {
    var node = FS.lookupNode(parent, name);
    for (var i in node.contents) {
      throw new FS.ErrnoError(55);
    }
    delete parent.contents[name];
    parent.ctime = parent.mtime = Date.now();
  }, readdir(node) {
    return [".", "..", ...Object.keys(node.contents)];
  }, symlink(parent, newname, oldpath) {
    var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
    node.link = oldpath;
    return node;
  }, readlink(node) {
    if (!FS.isLink(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    return node.link;
  } }, stream_ops: { read(stream, buffer, offset, length, position) {
    var contents = stream.node.contents;
    if (position >= stream.node.usedBytes) return 0;
    var size = Math.min(stream.node.usedBytes - position, length);
    buffer.set(contents.subarray(position, position + size), offset);
    return size;
  }, write(stream, buffer, offset, length, position, canOwn) {
    if (buffer.buffer === HEAP8.buffer) {
      canOwn = false;
    }
    if (!length) return 0;
    var node = stream.node;
    node.mtime = node.ctime = Date.now();
    if (canOwn) {
      node.contents = buffer.subarray(offset, offset + length);
      node.usedBytes = length;
    } else if (!node.usedBytes && !position) {
      node.contents = buffer.slice(offset, offset + length);
      node.usedBytes = length;
    } else {
      MEMFS.expandFileStorage(node, position + length);
      node.contents.set(buffer.subarray(offset, offset + length), position);
      node.usedBytes = Math.max(node.usedBytes, position + length);
    }
    return length;
  }, llseek(stream, offset, whence) {
    var position = offset;
    if (whence === 1) {
      position += stream.position;
    } else if (whence === 2) {
      if (FS.isFile(stream.node.mode)) {
        position += stream.node.usedBytes;
      }
    }
    if (position < 0) {
      throw new FS.ErrnoError(28);
    }
    return position;
  }, mmap(stream, length, position, prot, flags) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    var ptr;
    var allocated;
    var contents = stream.node.contents;
    if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
      allocated = false;
      ptr = contents.byteOffset;
    } else {
      allocated = true;
      ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      if (contents) {
        if (position > 0 || position + length < contents.length) {
          if (contents.subarray) {
            contents = contents.subarray(position, position + length);
          } else {
            contents = Array.prototype.slice.call(contents, position, position + length);
          }
        }
        HEAP8.set(contents, ptr);
      }
    }
    return { ptr, allocated };
  }, msync(stream, buffer, offset, length, mmapFlags) {
    MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
    return 0;
  } } };
  var FS_modeStringToFlags = (str) => {
    if (typeof str != "string") return str;
    var flagModes = { r: 0, "r+": 2, w: 512 | 64 | 1, "w+": 512 | 64 | 2, a: 1024 | 64 | 1, "a+": 1024 | 64 | 2 };
    var flags = flagModes[str];
    if (typeof flags == "undefined") {
      throw new Error(`Unknown file open mode: ${str}`);
    }
    return flags;
  };
  var FS_fileDataToTypedArray = (data) => {
    if (typeof data == "string") {
      data = intArrayFromString(data, true);
    }
    if (!data.subarray) {
      data = new Uint8Array(data);
    }
    return data;
  };
  var FS_getMode = (canRead, canWrite) => {
    var mode = 0;
    if (canRead) mode |= 292 | 73;
    if (canWrite) mode |= 146;
    return mode;
  };
  var asyncLoad = async (url) => {
    var arrayBuffer = await readAsync(url);
    return new Uint8Array(arrayBuffer);
  };
  var FS_createDataFile = (...args) => FS.createDataFile(...args);
  var getUniqueRunDependency = (id) => id;
  var dependenciesPromise = null;
  var resolveRunDependencies = async () => dependenciesPromise;
  var runDependencies = 0;
  var dependenciesPromiseResolve = null;
  var removeRunDependency = (id) => {
    runDependencies--;
    if (!runDependencies) {
      dependenciesPromiseResolve();
    }
  };
  var addRunDependency = (id) => {
    if (!runDependencies) {
      dependenciesPromise = new Promise((resolve) => dependenciesPromiseResolve = resolve);
    }
    runDependencies++;
  };
  var preloadPlugins = [];
  var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
    if (typeof Browser != "undefined") Browser.init();
    for (var plugin of preloadPlugins) {
      if (plugin["canHandle"](fullname)) {
        return plugin["handle"](byteArray, fullname);
      }
    }
    return byteArray;
  };
  var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency(`cp ${fullname}`);
    addRunDependency(dep);
    try {
      var byteArray = url;
      if (typeof url == "string") {
        byteArray = await asyncLoad(url);
      }
      byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
      preFinish?.();
      if (!dontCreateFile) {
        FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
      }
    } finally {
      removeRunDependency(dep);
    }
  };
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
    FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
  };
  var FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, filesystems: null, syncFSRequests: 0, ErrnoError: class {
    name = "ErrnoError";
    constructor(errno) {
      this.errno = errno;
    }
  }, FSStream: class {
    shared = {};
    get object() {
      return this.node;
    }
    set object(val) {
      this.node = val;
    }
    get isRead() {
      return (this.flags & 2097155) !== 1;
    }
    get isWrite() {
      return (this.flags & 2097155) !== 0;
    }
    get isAppend() {
      return this.flags & 1024;
    }
    get flags() {
      return this.shared.flags;
    }
    set flags(val) {
      this.shared.flags = val;
    }
    get position() {
      return this.shared.position;
    }
    set position(val) {
      this.shared.position = val;
    }
  }, FSNode: class {
    node_ops = {};
    stream_ops = {};
    readMode = 292 | 73;
    writeMode = 146;
    mounted = null;
    constructor(parent, name, mode, rdev) {
      if (!parent) {
        parent = this;
      }
      this.parent = parent;
      this.mount = parent.mount;
      this.id = FS.nextInode++;
      this.name = name;
      this.mode = mode;
      this.rdev = rdev;
      this.atime = this.mtime = this.ctime = Date.now();
    }
    get read() {
      return (this.mode & this.readMode) === this.readMode;
    }
    set read(val) {
      val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
    }
    get write() {
      return (this.mode & this.writeMode) === this.writeMode;
    }
    set write(val) {
      val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
    }
    get isFolder() {
      return FS.isDir(this.mode);
    }
    get isDevice() {
      return FS.isChrdev(this.mode);
    }
    addListener(cb, exclusive = false) {
      var entry = { cb, exclusive };
      var listeners = this.listeners ??= /* @__PURE__ */ new Set();
      listeners.add(entry);
      return { listeners, entry };
    }
    notifyListeners(flags) {
      if (!this.listeners) return;
      var excl;
      for (var entry of this.listeners) {
        if (entry.exclusive) (excl ||= []).push(entry);
        else entry.cb(flags);
      }
      if (excl) {
        var i = (this.exclTurn || 0) % excl.length;
        this.exclTurn = i + 1;
        excl[i].cb(flags);
      }
    }
  }, lookupPath(path, opts = {}) {
    if (!path) {
      throw new FS.ErrnoError(44);
    }
    opts.follow_mount ??= true;
    if (!PATH.isAbs(path)) {
      path = FS.cwd() + "/" + path;
    }
    linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
      var parts = path.split("/").filter((p) => !!p);
      var current = FS.root;
      var current_path = "/";
      for (var i = 0; i < parts.length; i++) {
        var islast = i === parts.length - 1;
        if (islast && opts.parent) {
          break;
        }
        if (parts[i] === ".") {
          continue;
        }
        if (parts[i] === "..") {
          current_path = PATH.dirname(current_path);
          if (FS.isRoot(current)) {
            path = current_path + "/" + parts.slice(i + 1).join("/");
            nlinks--;
            continue linkloop;
          } else {
            current = current.parent;
          }
          continue;
        }
        current_path = PATH.join2(current_path, parts[i]);
        try {
          current = FS.lookupNode(current, parts[i]);
        } catch (e) {
          if (e?.errno === 44 && islast && opts.noent_okay) {
            return { path: current_path };
          }
          throw e;
        }
        if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
          current = current.mounted.root;
        }
        if (FS.isLink(current.mode) && (!islast || opts.follow)) {
          if (!current.node_ops.readlink) {
            throw new FS.ErrnoError(52);
          }
          var link = current.node_ops.readlink(current);
          if (!PATH.isAbs(link)) {
            link = PATH.dirname(current_path) + "/" + link;
          }
          path = link + "/" + parts.slice(i + 1).join("/");
          continue linkloop;
        }
      }
      return { path: current_path, node: current };
    }
    throw new FS.ErrnoError(32);
  }, getPath(node) {
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path) return mount;
        return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
      }
      path = path ? `${node.name}/${path}` : node.name;
      node = node.parent;
    }
  }, hashName(parentid, name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
    }
    return (parentid + hash >>> 0) % FS.nameTable.length;
  }, hashAddNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node;
  }, hashRemoveNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next;
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break;
        }
        current = current.name_next;
      }
    }
  }, lookupNode(parent, name) {
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }
    return FS.lookup(parent, name);
  }, createNode(parent, name, mode, rdev) {
    var node = new FS.FSNode(parent, name, mode, rdev);
    FS.hashAddNode(node);
    return node;
  }, destroyNode(node) {
    FS.hashRemoveNode(node);
  }, isRoot(node) {
    return node === node.parent;
  }, isMountpoint(node) {
    return !!node.mounted;
  }, isFile(mode) {
    return (mode & 61440) === 32768;
  }, isDir(mode) {
    return (mode & 61440) === 16384;
  }, isLink(mode) {
    return (mode & 61440) === 40960;
  }, isChrdev(mode) {
    return (mode & 61440) === 8192;
  }, isBlkdev(mode) {
    return (mode & 61440) === 24576;
  }, isFIFO(mode) {
    return (mode & 61440) === 4096;
  }, isSocket(mode) {
    return (mode & 49152) === 49152;
  }, flagsToPermissionString(flag) {
    var perms = ["r", "w", "rw"][flag & 3];
    if (flag & 512) {
      perms += "w";
    }
    return perms;
  }, nodePermissions(node, perms) {
    if (FS.ignorePermissions) {
      return 0;
    }
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2;
    }
    if (perms.includes("w") && !(node.mode & 146)) {
      return 2;
    }
    if (perms.includes("x") && !(node.mode & 73)) {
      return 2;
    }
    return 0;
  }, mayLookup(dir) {
    if (!FS.isDir(dir.mode)) return 54;
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode) return errCode;
    if (!dir.node_ops.lookup) return 2;
    return 0;
  }, mayCreate(dir, name) {
    if (!FS.isDir(dir.mode)) {
      return 54;
    }
    try {
      var node = FS.lookupNode(dir, name);
      return 20;
    } catch (e) {
    }
    return FS.nodePermissions(dir, "wx");
  }, mayDelete(dir, name, isdir) {
    var node;
    try {
      node = FS.lookupNode(dir, name);
    } catch (e) {
      return e.errno;
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode;
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54;
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10;
      }
    } else if (FS.isDir(node.mode)) {
      return 31;
    }
    return 0;
  }, mayOpen(node, flags) {
    if (!node) {
      return 44;
    }
    if (FS.isLink(node.mode)) {
      return 32;
    }
    var mode = FS.flagsToPermissionString(flags);
    if (FS.isDir(node.mode)) {
      if (mode !== "r" || flags & (512 | 64)) {
        return 31;
      }
    }
    return FS.nodePermissions(node, mode);
  }, checkOpExists(op, err2) {
    if (!op) {
      throw new FS.ErrnoError(err2);
    }
    return op;
  }, MAX_OPEN_FDS: 4096, nextfd() {
    for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
      if (!FS.streams[fd]) {
        return fd;
      }
    }
    throw new FS.ErrnoError(33);
  }, getStreamChecked(fd) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    return stream;
  }, getStream: (fd) => FS.streams[fd], createStream(stream, fd = -1) {
    stream = Object.assign(new FS.FSStream(), stream);
    if (fd == -1) {
      fd = FS.nextfd();
    }
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream;
  }, closeStream(fd) {
    FS.streams[fd] = null;
  }, dupStream(origStream, fd = -1) {
    var stream = FS.createStream(origStream, fd);
    stream.stream_ops?.dup?.(stream);
    return stream;
  }, doSetAttr(stream, node, attr) {
    var setattr = stream?.stream_ops.setattr;
    var arg = setattr ? stream : node;
    setattr ??= node.node_ops.setattr;
    FS.checkOpExists(setattr, 63);
    try {
      setattr(arg, attr);
    } catch (e) {
      if (e instanceof RangeError) {
        throw new FS.ErrnoError(22);
      }
      throw e;
    }
  }, chrdev_stream_ops: { open(stream) {
    var device = FS.getDevice(stream.node.rdev);
    stream.stream_ops = device.stream_ops;
    stream.stream_ops.open?.(stream);
  }, llseek() {
    throw new FS.ErrnoError(70);
  } }, major: (dev) => dev >> 8, minor: (dev) => dev & 255, makedev: (ma, mi) => ma << 8 | mi, registerDevice(dev, ops) {
    FS.devices[dev] = { stream_ops: ops };
  }, getDevice: (dev) => FS.devices[dev], getMounts(mount) {
    var mounts = [];
    var check = [mount];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push(...m.mounts);
    }
    return mounts;
  }, syncfs(populate, callback) {
    if (typeof populate == "function") {
      callback = populate;
      populate = false;
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      FS.syncFSRequests--;
      return callback(errCode);
    }
    function done2(errCode) {
      if (errCode) {
        if (!done2.errored) {
          done2.errored = true;
          return doCallback(errCode);
        }
        return;
      }
      if (++completed >= mounts.length) {
        doCallback(null);
      }
    }
    for (var mount of mounts) {
      if (mount.type.syncfs) {
        mount.type.syncfs(mount, populate, done2);
      } else {
        done2(null);
      }
    }
  }, mount(type, opts, mountpoint) {
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10);
    } else if (!root && !pseudo) {
      var lookup2 = FS.lookupPath(mountpoint, { follow_mount: false });
      mountpoint = lookup2.path;
      node = lookup2.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
    }
    var mount = { type, opts, mountpoint, mounts: [] };
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot;
    } else if (node) {
      node.mounted = mount;
      if (node.mount) {
        node.mount.mounts.push(mount);
      }
    }
    return mountRoot;
  }, unmount(mountpoint) {
    var lookup2 = FS.lookupPath(mountpoint, { follow_mount: false });
    if (!FS.isMountpoint(lookup2.node)) {
      throw new FS.ErrnoError(28);
    }
    var node = lookup2.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    for (var [hash, current] of Object.entries(FS.nameTable)) {
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current);
        }
        current = next;
      }
    }
    node.mounted = null;
    var idx = node.mount.mounts.indexOf(mount);
    node.mount.mounts.splice(idx, 1);
  }, lookup(parent, name) {
    return parent.node_ops.lookup(parent, name);
  }, mknod(path, mode, dev) {
    var lookup2 = FS.lookupPath(path, { parent: true });
    var parent = lookup2.node;
    var name = PATH.basename(path);
    if (!name) {
      throw new FS.ErrnoError(28);
    }
    if (name === "." || name === "..") {
      throw new FS.ErrnoError(20);
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.mknod(parent, name, mode, dev);
  }, statfs(path) {
    return FS.statfsNode(FS.lookupPath(path, { follow: true }).node);
  }, statfsStream(stream) {
    return FS.statfsNode(stream.node);
  }, statfsNode(node) {
    var rtn = { bsize: 4096, frsize: 4096, blocks: 1e6, bfree: 5e5, bavail: 5e5, files: FS.nextInode, ffree: FS.nextInode - 1, fsid: 42, flags: 2, namelen: 255 };
    if (node.node_ops.statfs) {
      Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
    }
    return rtn;
  }, create(path, mode = 438) {
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0);
  }, mkdir(path, mode = 511) {
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0);
  }, mkdirTree(path, mode) {
    var dirs = path.split("/");
    var d = "";
    for (var dir of dirs) {
      if (!dir) continue;
      if (d || PATH.isAbs(path)) d += "/";
      d += dir;
      try {
        FS.mkdir(d, mode);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
    }
  }, mkdev(path, mode, dev) {
    if (typeof dev == "undefined") {
      dev = mode;
      mode = 438;
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev);
  }, symlink(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44);
    }
    var lookup2 = FS.lookupPath(newpath, { parent: true });
    var parent = lookup2.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.symlink(parent, newname, oldpath);
  }, link(oldpath, newpath, flags) {
    var lookup2 = FS.lookupPath(newpath, { parent: true });
    var parent = lookup2.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.link) {
      throw new FS.ErrnoError(34);
    }
    return parent.node_ops.link(parent, newname, oldpath, flags);
  }, rename(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    var lookup2, old_dir, new_dir;
    lookup2 = FS.lookupPath(old_path, { parent: true });
    old_dir = lookup2.node;
    lookup2 = FS.lookupPath(new_path, { parent: true });
    new_dir = lookup2.node;
    if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75);
    }
    var old_node = FS.lookupNode(old_dir, old_name);
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28);
    }
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55);
    }
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {
    }
    if (old_node === new_node) {
      return;
    }
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
      throw new FS.ErrnoError(10);
    }
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    FS.hashRemoveNode(old_node);
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name);
      old_node.parent = new_dir;
    } catch (e) {
      throw e;
    } finally {
      FS.hashAddNode(old_node);
    }
  }, rmdir(path) {
    var lookup2 = FS.lookupPath(path, { parent: true });
    var parent = lookup2.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node);
  }, readdir(path) {
    var lookup2 = FS.lookupPath(path, { follow: true });
    var node = lookup2.node;
    var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
    return readdir(node);
  }, unlink(path) {
    var lookup2 = FS.lookupPath(path, { parent: true });
    var parent = lookup2.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node);
  }, readlink(path) {
    var lookup2 = FS.lookupPath(path);
    var link = lookup2.node;
    if (!link) {
      throw new FS.ErrnoError(44);
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28);
    }
    return link.node_ops.readlink(link);
  }, stat(path, dontFollow) {
    var lookup2 = FS.lookupPath(path, { follow: !dontFollow });
    var node = lookup2.node;
    var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
    return getattr(node);
  }, fstat(fd) {
    var stream = FS.getStreamChecked(fd);
    var node = stream.node;
    var getattr = stream.stream_ops.getattr;
    var arg = getattr ? stream : node;
    getattr ??= node.node_ops.getattr;
    FS.checkOpExists(getattr, 63);
    return getattr(arg);
  }, lstat(path) {
    return FS.stat(path, true);
  }, doChmod(stream, node, mode, dontFollow) {
    FS.doSetAttr(stream, node, { mode: mode & 4095 | node.mode & ~4095, ctime: Date.now(), dontFollow });
  }, chmod(path, mode, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup2 = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup2.node;
    } else {
      node = path;
    }
    FS.doChmod(null, node, mode, dontFollow);
  }, lchmod(path, mode) {
    FS.chmod(path, mode, true);
  }, fchmod(fd, mode) {
    var stream = FS.getStreamChecked(fd);
    FS.doChmod(stream, stream.node, mode, false);
  }, doChown(stream, node, dontFollow) {
    FS.doSetAttr(stream, node, { timestamp: Date.now(), dontFollow });
  }, chown(path, uid, gid, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup2 = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup2.node;
    } else {
      node = path;
    }
    FS.doChown(null, node, dontFollow);
  }, lchown(path, uid, gid) {
    FS.chown(path, uid, gid, true);
  }, fchown(fd, uid, gid) {
    var stream = FS.getStreamChecked(fd);
    FS.doChown(stream, stream.node, false);
  }, doTruncate(stream, node, len) {
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.doSetAttr(stream, node, { size: len, timestamp: Date.now() });
  }, truncate(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    var node;
    if (typeof path == "string") {
      var lookup2 = FS.lookupPath(path, { follow: true });
      node = lookup2.node;
    } else {
      node = path;
    }
    FS.doTruncate(null, node, len);
  }, ftruncate(fd, len) {
    var stream = FS.getStreamChecked(fd);
    if (len < 0 || (stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28);
    }
    FS.doTruncate(stream, stream.node, len);
  }, utime(path, atime, mtime, dontFollow) {
    var lookup2 = FS.lookupPath(path, { follow: !dontFollow });
    FS.doSetAttr(null, lookup2.node, { atime, mtime, dontFollow });
  }, open(path, flags, mode = 438) {
    if (path === "") {
      throw new FS.ErrnoError(44);
    }
    flags = FS_modeStringToFlags(flags);
    if (flags & 64) {
      mode = mode & 4095 | 32768;
    } else {
      mode = 0;
    }
    var node;
    var isDirPath;
    if (typeof path == "object") {
      node = path;
    } else {
      isDirPath = path.endsWith("/");
      var lookup2 = FS.lookupPath(path, { follow: !(flags & 131072), noent_okay: true });
      node = lookup2.node;
      path = lookup2.path;
    }
    var created = false;
    if (flags & 64) {
      if (node) {
        if (flags & 128) {
          throw new FS.ErrnoError(20);
        }
      } else if (isDirPath) {
        throw new FS.ErrnoError(31);
      } else {
        node = FS.mknod(path, mode | 511, 0);
        created = true;
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    if (FS.isChrdev(node.mode)) {
      flags &= ~512;
    }
    if (flags & 65536 && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    if (flags & 512 && !created) {
      FS.truncate(node, 0);
    }
    flags &= ~(128 | 512 | 131072);
    var stream = FS.createStream({ node, path: FS.getPath(node), flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false });
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }
    if (created) {
      FS.chmod(node, mode & 511);
    }
    return stream;
  }, close(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (stream.getdents) stream.getdents = null;
    stream.node?.notifyListeners(32);
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (e) {
      throw e;
    } finally {
      FS.closeStream(stream.fd);
    }
    stream.fd = null;
  }, isClosed(stream) {
    return stream.fd === null;
  }, llseek(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70);
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28);
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position;
  }, read(stream, buffer, offset, length, position) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  }, write(stream, buffer, offset, length, position, canOwn) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28);
    }
    if (stream.seekable && stream.flags & 1024) {
      FS.llseek(stream, 0, 2);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
    if (!seeking) stream.position += bytesWritten;
    return bytesWritten;
  }, mmap(stream, length, position, prot, flags) {
    if (prot & 2 && !(flags & 2) && (stream.flags & 2097155) !== 2) {
      throw new FS.ErrnoError(2);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2);
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43);
    }
    if (!length) {
      throw new FS.ErrnoError(28);
    }
    return stream.stream_ops.mmap(stream, length, position, prot, flags);
  }, msync(stream, buffer, offset, length, mmapFlags) {
    if (!stream.stream_ops.msync) {
      return 0;
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
  }, ioctl(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59);
    }
    return stream.stream_ops.ioctl(stream, cmd, arg);
  }, readFile(path, opts = {}) {
    opts.flags = opts.flags ?? 0;
    opts.encoding = opts.encoding ?? "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      abort(`Invalid encoding type "${opts.encoding}"`);
    }
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      buf = UTF8ArrayToString(buf);
    }
    FS.close(stream);
    return buf;
  }, writeFile(path, data, opts = {}) {
    opts.flags = opts.flags ?? 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    data = FS_fileDataToTypedArray(data);
    FS.write(stream, data, 0, data.byteLength, void 0, opts.canOwn);
    FS.close(stream);
  }, cwd: () => FS.currentPath, chdir(path) {
    var lookup2 = FS.lookupPath(path, { follow: true });
    if (lookup2.node === null) {
      throw new FS.ErrnoError(44);
    }
    if (!FS.isDir(lookup2.node.mode)) {
      throw new FS.ErrnoError(54);
    }
    var errCode = FS.nodePermissions(lookup2.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.currentPath = lookup2.path;
  }, createDefaultDirectories() {
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user");
  }, createDefaultDevices() {
    FS.mkdir("/dev");
    FS.registerDevice(FS.makedev(1, 3), { read: () => 0, write: (stream, buffer, offset, length, pos) => length, llseek: () => 0 });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    var randomBuffer = new Uint8Array(1024), randomLeft = 0;
    var randomByte = () => {
      if (!randomLeft) {
        randomFill(randomBuffer);
        randomLeft = randomBuffer.byteLength;
      }
      return randomBuffer[--randomLeft];
    };
    FS.createDevice("/dev", "random", randomByte);
    FS.createDevice("/dev", "urandom", randomByte);
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp");
  }, createSpecialDirectories() {
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount({ mount() {
      var node = FS.createNode(proc_self, "fd", 16895, 73);
      node.stream_ops = { llseek: MEMFS.stream_ops.llseek };
      node.node_ops = { lookup(parent, name) {
        var fd = +name;
        var stream = FS.getStreamChecked(fd);
        var ret = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: () => stream.path }, id: fd + 1 };
        ret.parent = ret;
        return ret;
      }, readdir() {
        return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString());
      } };
      return node;
    } }, {}, "/proc/self/fd");
  }, createStandardStreams(input, output, error) {
    if (input) {
      FS.createDevice("/dev", "stdin", input);
    } else {
      FS.symlink("/dev/tty", "/dev/stdin");
    }
    if (output) {
      FS.createDevice("/dev", "stdout", null, output);
    } else {
      FS.symlink("/dev/tty", "/dev/stdout");
    }
    if (error) {
      FS.createDevice("/dev", "stderr", null, error);
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr");
    }
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1);
  }, staticInit() {
    FS.nameTable = new Array(4096);
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
    FS.filesystems = { MEMFS };
  }, init(input, output, error) {
    FS.initialized = true;
    FS.createStandardStreams(input, output, error);
  }, quit() {
    FS.initialized = false;
    for (var stream of FS.streams) {
      if (stream) {
        FS.close(stream);
      }
    }
  }, findObject(path, dontResolveLastLink) {
    var ret = FS.analyzePath(path, dontResolveLastLink);
    if (!ret.exists) {
      return null;
    }
    return ret.object;
  }, analyzePath(path, dontResolveLastLink) {
    try {
      var lookup2 = FS.lookupPath(path, { follow: !dontResolveLastLink });
      path = lookup2.path;
    } catch (e) {
    }
    var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
    try {
      var lookup2 = FS.lookupPath(path, { parent: true });
      ret.parentExists = true;
      ret.parentPath = lookup2.path;
      ret.parentObject = lookup2.node;
      ret.name = PATH.basename(path);
      lookup2 = FS.lookupPath(path, { follow: !dontResolveLastLink });
      ret.exists = true;
      ret.path = lookup2.path;
      ret.object = lookup2.node;
      ret.name = lookup2.node.name;
      ret.isRoot = lookup2.path === "/";
    } catch (e) {
      ret.error = e.errno;
    }
    return ret;
  }, createPath(parent, path, canRead, canWrite) {
    parent = typeof parent == "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
      parent = current;
    }
    return current;
  }, createFile(parent, name, properties, canRead, canWrite) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(canRead, canWrite);
    return FS.create(path, mode);
  }, createDataFile(parent, name, data, canRead, canWrite, canOwn) {
    var path = name;
    if (parent) {
      parent = typeof parent == "string" ? parent : FS.getPath(parent);
      path = name ? PATH.join2(parent, name) : parent;
    }
    var mode = FS_getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      data = FS_fileDataToTypedArray(data);
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode);
    }
  }, createDevice(parent, name, input, output) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(!!input, !!output);
    FS.createDevice.major ??= 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    FS.registerDevice(dev, { open(stream) {
      stream.seekable = false;
    }, close(stream) {
      if (output?.buffer?.length) {
        output(10);
      }
    }, read(stream, buffer, offset, length, pos) {
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = input();
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === void 0 && !bytesRead) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === void 0) break;
        bytesRead++;
        buffer[offset + i] = result;
      }
      if (bytesRead) {
        stream.node.atime = Date.now();
      }
      return bytesRead;
    }, write(stream, buffer, offset, length, pos) {
      for (var i = 0; i < length; i++) {
        try {
          output(buffer[offset + i]);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
      }
      if (length) {
        stream.node.mtime = stream.node.ctime = Date.now();
      }
      return i;
    } });
    return FS.mkdev(path, mode, dev);
  }, forceLoadFile(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
    if (globalThis.XMLHttpRequest) {
      abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
    } else {
      try {
        obj.contents = readBinary(obj.url);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    }
  }, createLazyFile(parent, name, url, canRead, canWrite) {
    class LazyUint8Array {
      lengthKnown = false;
      chunks = [];
      get(idx) {
        if (idx > this.length - 1 || idx < 0) {
          return void 0;
        }
        var chunkOffset = idx % this.chunkSize;
        var chunkNum = idx / this.chunkSize | 0;
        return this.getter(chunkNum)[chunkOffset];
      }
      setDataGetter(getter) {
        this.getter = getter;
      }
      cacheLength() {
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", url, false);
        xhr.send(null);
        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
        var datalength = Number(xhr.getResponseHeader("Content-length"));
        var header;
        var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
        var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
        var chunkSize = 1024 * 1024;
        if (!hasByteServing) chunkSize = datalength;
        var doXHR = (from, to2) => {
          if (from > to2) abort(`invalid range (${from}, ${to2}) or no bytes requested!`);
          if (to2 > datalength - 1) abort(`only ${datalength} bytes available! programmer error!`);
          var xhr2 = new XMLHttpRequest();
          xhr2.open("GET", url, false);
          if (datalength !== chunkSize) xhr2.setRequestHeader("Range", `bytes=${from}-${to2}`);
          xhr2.responseType = "arraybuffer";
          if (xhr2.overrideMimeType) {
            xhr2.overrideMimeType("text/plain; charset=x-user-defined");
          }
          xhr2.send(null);
          if (!(xhr2.status >= 200 && xhr2.status < 300 || xhr2.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr2.status}`);
          if (xhr2.response !== void 0) {
            return new Uint8Array(xhr2.response || []);
          }
          return intArrayFromString(xhr2.responseText ?? "", true);
        };
        var lazyArray2 = this;
        lazyArray2.setDataGetter((chunkNum) => {
          var start = chunkNum * chunkSize;
          var end = (chunkNum + 1) * chunkSize - 1;
          end = Math.min(end, datalength - 1);
          if (typeof lazyArray2.chunks[chunkNum] == "undefined") {
            lazyArray2.chunks[chunkNum] = doXHR(start, end);
          }
          if (typeof lazyArray2.chunks[chunkNum] == "undefined") abort("doXHR failed!");
          return lazyArray2.chunks[chunkNum];
        });
        if (usesGzip || !datalength) {
          chunkSize = datalength = 1;
          datalength = this.getter(0).length;
          chunkSize = datalength;
          out("LazyFiles on gzip forces download of the whole file when length is accessed");
        }
        this._length = datalength;
        this._chunkSize = chunkSize;
        this.lengthKnown = true;
      }
      get length() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._length;
      }
      get chunkSize() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._chunkSize;
      }
    }
    if (globalThis.XMLHttpRequest) {
      if (!ENVIRONMENT_IS_WORKER) abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");
      var lazyArray = new LazyUint8Array();
      var properties = { isDevice: false, contents: lazyArray };
    } else {
      var properties = { isDevice: false, url };
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    if (properties.contents) {
      node.contents = properties.contents;
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url;
    }
    Object.defineProperties(node, { usedBytes: { get: function() {
      return this.contents.length;
    } } });
    var stream_ops = {};
    for (const [key, fn2] of Object.entries(node.stream_ops)) {
      stream_ops[key] = (...args) => {
        FS.forceLoadFile(node);
        return fn2(...args);
      };
    }
    function writeChunks(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= contents.length) return 0;
      var size = Math.min(contents.length - position, length);
      if (contents.slice) {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i];
        }
      } else {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents.get(position + i);
        }
      }
      return size;
    }
    stream_ops.read = (stream, buffer, offset, length, position) => {
      FS.forceLoadFile(node);
      return writeChunks(stream, buffer, offset, length, position);
    };
    stream_ops.mmap = (stream, length, position, prot, flags) => {
      FS.forceLoadFile(node);
      var ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      writeChunks(stream, HEAP8, ptr, length, position);
      return { ptr, allocated: true };
    };
    node.stream_ops = stream_ops;
    return node;
  } };
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "";
  var HEAP64;
  var SYSCALLS = { currentUmask: 18, calculateAt(dirfd, path, allowEmpty) {
    if (PATH.isAbs(path)) {
      return path;
    }
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = SYSCALLS.getStreamFromFD(dirfd);
      dir = dirstream.path;
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44);
      }
      return dir;
    }
    return dir + "/" + path;
  }, writeStat(buf, stat) {
    HEAPU32[buf >> 2] = stat.dev;
    HEAPU32[buf + 4 >> 2] = stat.mode;
    HEAPU32[buf + 8 >> 2] = stat.nlink;
    HEAPU32[buf + 12 >> 2] = stat.uid;
    HEAPU32[buf + 16 >> 2] = stat.gid;
    HEAPU32[buf + 20 >> 2] = stat.rdev;
    HEAP64[buf + 24 >> 3] = BigInt(stat.size);
    HEAP32[buf + 32 >> 2] = 4096;
    HEAP32[buf + 36 >> 2] = stat.blocks;
    var atime = stat.atime.getTime();
    var mtime = stat.mtime.getTime();
    var ctime = stat.ctime.getTime();
    HEAP64[buf + 40 >> 3] = BigInt(Math.floor(atime / 1e3));
    HEAPU32[buf + 48 >> 2] = atime % 1e3 * 1e3 * 1e3;
    HEAP64[buf + 56 >> 3] = BigInt(Math.floor(mtime / 1e3));
    HEAPU32[buf + 64 >> 2] = mtime % 1e3 * 1e3 * 1e3;
    HEAP64[buf + 72 >> 3] = BigInt(Math.floor(ctime / 1e3));
    HEAPU32[buf + 80 >> 2] = ctime % 1e3 * 1e3 * 1e3;
    HEAP64[buf + 88 >> 3] = BigInt(stat.ino);
    return 0;
  }, writeStatFs(buf, stats) {
    HEAPU32[buf + 4 >> 2] = stats.bsize;
    HEAPU32[buf + 60 >> 2] = stats.bsize;
    HEAP64[buf + 8 >> 3] = BigInt(stats.blocks);
    HEAP64[buf + 16 >> 3] = BigInt(stats.bfree);
    HEAP64[buf + 24 >> 3] = BigInt(stats.bavail);
    HEAP64[buf + 32 >> 3] = BigInt(stats.files);
    HEAP64[buf + 40 >> 3] = BigInt(stats.ffree);
    HEAPU32[buf + 48 >> 2] = stats.fsid;
    HEAPU32[buf + 64 >> 2] = stats.flags;
    HEAPU32[buf + 56 >> 2] = stats.namelen;
  }, doMsync(addr, stream, len, flags, offset) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (flags & 2) {
      return 0;
    }
    var buffer = HEAPU8.subarray(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags);
  }, getStreamFromFD(fd) {
    var stream = FS.getStreamChecked(fd);
    return stream;
  }, varargs: void 0, getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  } };
  var HEAP16;
  function ___syscall_fcntl64(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          var mask = 289792;
          stream.flags = stream.flags & ~mask | arg & mask;
          return 0;
        }
        case 12: {
          var arg = syscallGetVarargP();
          var offset = 0;
          HEAP16[arg + offset >> 1] = 2;
          return 0;
        }
        case 13:
        case 14:
          return 0;
      }
      return -28;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_fstat64(fd, buf) {
    try {
      return SYSCALLS.writeStat(buf, FS.fstat(fd));
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_ioctl(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[argp >> 2] = termios.c_iflag || 0;
            HEAP32[argp + 4 >> 2] = termios.c_oflag || 0;
            HEAP32[argp + 8 >> 2] = termios.c_cflag || 0;
            HEAP32[argp + 12 >> 2] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[argp + i + 17] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[argp >> 2];
            var c_oflag = HEAP32[argp + 4 >> 2];
            var c_cflag = HEAP32[argp + 8 >> 2];
            var c_lflag = HEAP32[argp + 12 >> 2];
            var c_cc = [];
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[argp + i + 17]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0;
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[argp >> 2] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28;
        }
        case 21537:
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[argp >> 1] = winsize[0];
            HEAP16[argp + 2 >> 1] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default:
          return -28;
      }
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_lstat64(path, buf) {
    try {
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.lstat(path));
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_newfstatat(dirfd, path, buf, flags) {
    try {
      path = SYSCALLS.getStr(path);
      var nofollow = flags & 256;
      var allowEmpty = flags & 4096;
      flags = flags & ~6400;
      path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
      return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_openat(dirfd, path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      if (flags & 64) {
        mode &= ~SYSCALLS.currentUmask;
      }
      return FS.open(path, flags, mode).fd;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_stat64(path, buf) {
    try {
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.stat(path));
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  var __abort_js = () => abort("");
  var INT53_MAX = 9007199254740992;
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);
  function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
    offset = bigintToI53Checked(offset);
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var res = FS.mmap(stream, len, offset, prot, flags);
      var ptr = res.ptr;
      HEAP32[allocated >> 2] = res.allocated;
      HEAPU32[addr >> 2] = ptr;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function __munmap_js(addr, len, prot, flags, fd, offset) {
    offset = bigintToI53Checked(offset);
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      if (prot & 2) {
        SYSCALLS.doMsync(addr, stream, len, flags, offset);
      }
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
  var __tzset_js = (timezone, daylight, std_name, dst_name) => {
    var currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
    HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
    var extractZone = (timezoneOffset) => {
      var sign = timezoneOffset >= 0 ? "-" : "+";
      var absOffset = Math.abs(timezoneOffset);
      var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
      var minutes = String(absOffset % 60).padStart(2, "0");
      return `UTC${sign}${hours}${minutes}`;
    };
    var winterName = extractZone(winterOffset);
    var summerName = extractZone(summerOffset);
    if (summerOffset < winterOffset) {
      stringToUTF8(winterName, std_name, 17);
      stringToUTF8(summerName, dst_name, 17);
    } else {
      stringToUTF8(winterName, dst_name, 17);
      stringToUTF8(summerName, std_name, 17);
    }
  };
  var getHeapMax = () => 1073741824;
  var growMemory = (size) => {
    var oldHeapSize = wasmMemory.buffer.byteLength;
    var pages = (size - oldHeapSize + 65535) / 65536 | 0;
    try {
      wasmMemory.grow(pages);
      updateMemoryViews();
      return 1;
    } catch (e) {
    }
  };
  var _emscripten_resize_heap = (requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
      return false;
    }
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
      var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
      overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
      var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
      var replacement = growMemory(newSize);
      if (replacement) {
        return true;
      }
    }
    return false;
  };
  var ENV = {};
  var getExecutableName = () => thisProgram;
  var getEnvStrings = () => {
    if (!getEnvStrings.strings) {
      var lang2 = (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
      var env = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: lang2, _: getExecutableName() };
      for (var x in ENV) {
        if (ENV[x] === void 0) delete env[x];
        else env[x] = ENV[x];
      }
      var strings = [];
      for (var x in env) {
        strings.push(`${x}=${env[x]}`);
      }
      getEnvStrings.strings = strings;
    }
    return getEnvStrings.strings;
  };
  var _environ_get = (__environ, environ_buf) => {
    var bufSize = 0;
    var envp = 0;
    for (var string of getEnvStrings()) {
      var ptr = environ_buf + bufSize;
      HEAPU32[__environ + envp >> 2] = ptr;
      bufSize += stringToUTF8(string, ptr, Infinity) + 1;
      envp += 4;
    }
    return 0;
  };
  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
    var strings = getEnvStrings();
    HEAPU32[penviron_count >> 2] = strings.length;
    var bufSize = 0;
    for (var string of strings) {
      bufSize += lengthBytesUTF8(string) + 1;
    }
    HEAPU32[penviron_buf_size >> 2] = bufSize;
    return 0;
  };
  function _fd_close(fd) {
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  var doReadv = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAPU32[iov >> 2];
      var len = HEAPU32[iov + 4 >> 2];
      iov += 8;
      try {
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
      } catch (e) {
        if (ret > 0 && e instanceof FS.ErrnoError && (e.errno == 6 || e.errno == 6)) {
          break;
        }
        throw e;
      }
      if (curr < 0) return -1;
      ret += curr;
      if (curr < len) break;
      if (typeof offset != "undefined") {
        offset += curr;
      }
    }
    return ret;
  };
  function _fd_read(fd, iov, iovcnt, pnum) {
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[pnum >> 2] = num;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    try {
      if (isNaN(offset)) return 22;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      HEAP64[newOffset >> 3] = BigInt(stream.position);
      if (stream.getdents && !offset && whence === 0) stream.getdents = null;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  var doWritev = (stream, iov, iovcnt, offset) => {
    if (iovcnt == 1) {
      return FS.write(stream, HEAP8, HEAPU32[iov >> 2], HEAPU32[iov + 4 >> 2], offset);
    }
    var total = 0;
    for (var i = 0, p = iov; i < iovcnt; i++, p += 8) {
      total += HEAPU32[p + 4 >> 2];
    }
    var view = new Uint8Array(total);
    var voff = 0;
    for (var i = 0; i < iovcnt; i++, iov += 8) {
      var ptr = HEAPU32[iov >> 2];
      var len = HEAPU32[iov + 4 >> 2];
      view.set(HEAPU8.subarray(ptr, ptr + len), voff);
      voff += len;
    }
    return FS.write(stream, view, 0, total, offset);
  };
  function _fd_write(fd, iov, iovcnt, pnum) {
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[pnum >> 2] = num;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  var getCFunc = (ident) => {
    var func = Module2["_" + ident];
    return func;
  };
  var writeArrayToMemory = (array, buffer) => {
    HEAP8.set(array, buffer);
  };
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  var stringToUTF8OnStack = (str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret;
  };
  var ccall = (ident, returnType, argTypes, args, opts) => {
    var toC = { string: (str) => {
      var ret2 = 0;
      if (str !== null && str !== void 0 && str !== 0) {
        ret2 = stringToUTF8OnStack(str);
      }
      return ret2;
    }, array: (arr) => {
      var ret2 = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret2);
      return ret2;
    } };
    function convertReturnValue(ret2) {
      if (returnType === "string") {
        return UTF8ToString(ret2);
      }
      if (returnType === "boolean") return Boolean(ret2);
      return ret2;
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (!stack) stack = stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func(...cArgs);
    function onDone(ret2) {
      if (stack) stackRestore(stack);
      return convertReturnValue(ret2);
    }
    ret = onDone(ret);
    return ret;
  };
  var cwrap = (ident, returnType, argTypes, opts) => {
    var numericArgs = !argTypes || argTypes.every((type) => type === "number" || type === "boolean");
    var numericRet = returnType !== "string";
    if (numericRet && numericArgs && !opts) {
      return getCFunc(ident);
    }
    return (...args) => ccall(ident, returnType, argTypes, args, opts);
  };
  var FS_createPath = (...args) => FS.createPath(...args);
  var FS_unlink = (...args) => FS.unlink(...args);
  var FS_createLazyFile = (...args) => FS.createLazyFile(...args);
  var FS_createDevice = (...args) => FS.createDevice(...args);
  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.preloadFile = FS_preloadFile;
  FS.staticInit();
  {
    if (Module2["print"]) out = Module2["print"];
    if (Module2["printErr"]) err = Module2["printErr"];
    if (Module2["wasmBinary"]) wasmBinary = Module2["wasmBinary"];
  }
  Module2["addRunDependency"] = addRunDependency;
  Module2["removeRunDependency"] = removeRunDependency;
  Module2["ccall"] = ccall;
  Module2["cwrap"] = cwrap;
  Module2["UTF8ToString"] = UTF8ToString;
  Module2["stringToUTF8"] = stringToUTF8;
  Module2["lengthBytesUTF8"] = lengthBytesUTF8;
  Module2["FS_preloadFile"] = FS_preloadFile;
  Module2["FS_unlink"] = FS_unlink;
  Module2["FS_createPath"] = FS_createPath;
  Module2["FS_createDevice"] = FS_createDevice;
  Module2["FS"] = FS;
  Module2["FS_createDataFile"] = FS_createDataFile;
  Module2["FS_createLazyFile"] = FS_createLazyFile;
  var _ojt_init, _ojt_stage1, _malloc, _free, _ojt_stage2, _ojt_labels, _emscripten_builtin_memalign, _setThrew, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, memory, __indirect_function_table, wasmMemory;
  function assignWasmExports(wasmExports2) {
    _ojt_init = Module2["_ojt_init"] = wasmExports2["ojt_init"];
    _ojt_stage1 = Module2["_ojt_stage1"] = wasmExports2["ojt_stage1"];
    _malloc = Module2["_malloc"] = wasmExports2["malloc"];
    _free = Module2["_free"] = wasmExports2["free"];
    _ojt_stage2 = Module2["_ojt_stage2"] = wasmExports2["ojt_stage2"];
    _ojt_labels = Module2["_ojt_labels"] = wasmExports2["ojt_labels"];
    _emscripten_builtin_memalign = wasmExports2["emscripten_builtin_memalign"];
    _setThrew = wasmExports2["setThrew"];
    __emscripten_stack_restore = wasmExports2["_emscripten_stack_restore"];
    __emscripten_stack_alloc = wasmExports2["_emscripten_stack_alloc"];
    _emscripten_stack_get_current = wasmExports2["emscripten_stack_get_current"];
    memory = wasmMemory = wasmExports2["memory"];
    __indirect_function_table = wasmExports2["__indirect_function_table"];
  }
  var wasmImports = { __cxa_throw: ___cxa_throw, __syscall_fcntl64: ___syscall_fcntl64, __syscall_fstat64: ___syscall_fstat64, __syscall_ioctl: ___syscall_ioctl, __syscall_lstat64: ___syscall_lstat64, __syscall_newfstatat: ___syscall_newfstatat, __syscall_openat: ___syscall_openat, __syscall_stat64: ___syscall_stat64, _abort_js: __abort_js, _mmap_js: __mmap_js, _munmap_js: __munmap_js, _tzset_js: __tzset_js, emscripten_resize_heap: _emscripten_resize_heap, environ_get: _environ_get, environ_sizes_get: _environ_sizes_get, fd_close: _fd_close, fd_read: _fd_read, fd_seek: _fd_seek, fd_write: _fd_write };
  async function run() {
    preRun();
    if (runDependencies) {
      await resolveRunDependencies();
    }
    if (ABORT) return;
    initRuntime();
    postRun();
  }
  var wasmExports;
  wasmExports = await createWasm();
  await run();
  ;
  return Module2;
}
var ojt_default = Module;

// node_modules/@internal/read-aloud/backend/piper-plus/ja-frontend.js
var FIELDS = ["string", "pos", "pos_group1", "pos_group2", "pos_group3", "ctype", "cform", "orig", "read", "pron", "acc", "mora_size", "chain_rule", "chain_flag"];
var INT_FIELDS = /* @__PURE__ */ new Set(["acc", "mora_size", "chain_flag"]);
var cps = (s) => Array.from(s);
var isKanji = (c) => {
  const o = c.codePointAt(0);
  return o >= 19968 && o <= 40959;
};
function parseNjd(tsv) {
  const out = [];
  for (const line of tsv.split("\n")) {
    if (!line) continue;
    const f = line.split("	"), o = {};
    FIELDS.forEach((k, i) => {
      o[k] = INT_FIELDS.has(k) ? parseInt(f[i], 10) : f[i] ?? "";
    });
    out.push(o);
  }
  return out;
}
var dumpNjd = (features) => features.map((o) => FIELDS.map((k) => String(o[k]).replace(/[\t\n\0]/g, "")).join("	")).join("\n") + (features.length ? "\n" : "");
function applyOriginalRuleBeforeChaining(F) {
  for (let i = 0; i < F.length - 1; i++) {
    const njd = F[i], next = F[i + 1];
    if (njd.pos === "\u540D\u8A5E" && next.string === "\u4E0D\u8DB3" && next.pron === "\u30D5\u30BD\u30AF") {
      next.read = "\u30D6\u30BD\u30AF";
      next.pron = "\u30D6\u30BD\u30AF";
    }
    let isFractionDenominator = false;
    if (i + 2 < F.length && next.string === "\u306E") isFractionDenominator = F[i + 2].pos_group1 === "\u6570";
    if (isFractionDenominator && njd.string.endsWith("\u5206")) {
      if (njd.pron.endsWith("\u30D5\u30F3") || njd.pron.endsWith("\u30D7\u30F3")) {
        njd.read = cps(njd.read).slice(0, -2).join("") + "\u30D6\u30F3";
        njd.pron = cps(njd.pron).slice(0, -2).join("") + "\u30D6\u30F3";
      } else if (njd.pron.endsWith("\u30D6")) {
        njd.read += "\u30F3";
        njd.pron += "\u30F3";
      }
    }
    if (i > 0 && i + 2 < F.length && njd.string === "\u5206" && F[i - 1].pos_group1 === "\u6570" && next.string === "\u306E" && F[i + 2].pos_group1 === "\u6570") {
      njd.read = "\u30D6\u30F3";
      njd.pron = "\u30D6\u30F3";
    }
    if (njd.string === "\u3007" && next.string === "\u3007") for (const p of [njd, next]) {
      p.pos_group1 = "\u4E00\u822C";
      p.read = "\u30DE\u30EB";
      p.pron = "\u30DE\u30EB";
      p.acc = 1;
      p.mora_size = 2;
    }
    if (next.string === "\u7403" && next.pos === "\u540D\u8A5E" && next.pos_group1 === "\u63A5\u5C3E" && next.pron === "\u30AD\u30E5\u30FC" && cps(njd.string).some((c) => c >= "\u4E00" && c <= "\u9FFF") && cps(njd.string).some((c) => c >= "\u3041" && c <= "\u3096")) {
      next.read = "\u30C0\u30DE";
      next.pron = "\u30C0\u30DE";
      next.acc = 1;
      next.mora_size = 2;
      next.chain_rule = "C4";
    }
    if ((["\u30B5\u5909\u63A5\u7D9A", "\u683C\u52A9\u8A5E", "\u63A5\u7D9A\u52A9\u8A5E"].includes(njd.pos_group1) || njd.pos === "\u540D\u8A5E" && njd.pos_group1 === "\u4E00\u822C" || njd.pos === "\u526F\u8A5E") && next.ctype === "\u30B5\u5909\u30FB\u30B9\u30EB") next.chain_flag = 1;
    if (["\u304A", "\u5FA1", "\u3054"].includes(njd.string) && njd.chain_rule === "P1") {
      if (next.acc === 0 || next.acc === next.mora_size) {
        next.chain_rule = "C4";
        next.acc = 0;
      } else next.chain_rule = "C1";
    }
    if (njd.pos === "\u52D5\u8A5E" && next.pos === "\u52D5\u8A5E") next.chain_rule = next.acc !== 0 ? "C1" : "C4";
    if (["\u9023\u7528\u5F62", "\u9023\u7528\u30BF\u63A5\u7D9A", "\u9023\u7528\u30B4\u30B6\u30A4\u63A5\u7D9A", "\u9023\u7528\u30C6\u63A5\u7D9A"].includes(njd.cform) && njd.acc === njd.mora_size && njd.mora_size > 1) njd.acc -= 1;
    if (["\u308C\u308B", "\u3089\u308C\u308B", "\u305B\u308B", "\u3055\u305B\u308B", "\u3061\u3083\u3046"].includes(njd.orig) && next.string === "\u305F") next.chain_rule = "F2@1";
    if (njd.pos === "\u5F62\u5BB9\u8A5E" && ["\u306A\u308B", "\u3059\u308B"].includes(next.orig)) next.chain_flag = 1;
  }
  return F;
}
function modifyFillerAccent(F) {
  let after = false;
  for (const f of F) {
    if (f.pos === "\u30D5\u30A3\u30E9\u30FC") {
      if (f.acc > f.mora_size) f.acc = 0;
      after = true;
    } else if (after) {
      if (f.pos === "\u540D\u8A5E") f.chain_flag = 0;
      after = false;
    }
  }
  return F;
}
function naniPredict(model, next) {
  if (!next) return 0;
  const x = [];
  for (const oh of model.onehot) {
    const v = next[model.x_cols[oh.col]];
    for (const c of oh.cats) x.push(c === v ? 1 : 0);
  }
  const score = [0, 0];
  for (const tree of model.trees) {
    let n = 0;
    for (; ; ) {
      const [mode, feat, val, tn2, fn2] = tree.nodes[n];
      if (mode === "LEAF") {
        const w = tree.leaves[n];
        if (w) {
          score[0] += w[0];
          score[1] += w[1];
        }
        break;
      }
      n = x[feat] <= val ? tn2 : fn2;
    }
  }
  return score[1] > score[0] ? 1 : 0;
}
function predictNaniReading(F, model) {
  F.forEach((cur, i) => {
    if (cur.orig !== "\u4F55") return;
    const next = i + 1 < F.length ? F[i + 1] : null;
    const high = next !== null && (["\u3092", "\u304C", "\u306B", "\u3082", "\u3088\u308A"].includes(next.orig) || next.orig === "\u3059\u308B" || next.string === "\u3067" && next.pos === "\u52A9\u52D5\u8A5E" && next.ctype === "\u7279\u6B8A\u30FB\u30C0");
    const keepNan = next !== null && next.orig === "\u3067" && next.pos === "\u52A9\u8A5E" && next.pos_group1 === "\u683C\u52A9\u8A5E";
    let isNan;
    if (high) isNan = 0;
    else if (keepNan) isNan = 1;
    else if (model) isNan = naniPredict(model, next);
    else return;
    cur.pron = cur.read = isNan === 1 ? "\u30CA\u30F3" : "\u30CA\u30CB";
  });
  return F;
}
var MULTI_READ_KANJI = new Set("\u98A8\u89B3\u65B9\u51FA\u6642\u4E0A\u4E0B\u541B\u624B\u5ACC\u8868\u5BFE\u8272\u4EBA\u524D\u5F8C\u89D2\u91D1\u982D\u7B46\u6C34\u9593\u68DA\u5E8A\u5165\u6765\u5857\u6012\u5305\u88AB\u958B\u5F3E\u637B\u6F5C\u652F\u62B1\u884C\u964D\u7A2E\u8A33\u7CDE\u7A7A\u6027\u4F53\u7B49\u751F\u6B62\u582A\u6369\u5BB6\u7E01\u52B4\u4E2D\u9AD8\u4F4E\u6C17\u8981\u9000\u9762\u8272\u4E3B\u8853\u76F4\u7247\u7DD2\u5C0F\u5927\u5024".split(""));
function emulateKanjiYomiPass(F) {
  const hits = F.filter((f) => MULTI_READ_KANJI.has(f.orig)), surfaceHits = F.filter((f) => MULTI_READ_KANJI.has(f.string));
  if (!hits.length || surfaceHits.length !== hits.length) return F;
  for (const f of hits) if (f.pos_group1 !== "\u63A5\u5C3E" && f.pos !== "\u63A5\u982D\u8A5E") {
    const y = f.orig === "\u65B9" && f.read === "\u30DB\u30A6" ? "\u30DB\u30AA" : f.read;
    f.pron = y;
    f.read = y;
  }
  return F;
}
var DAN = {};
for (const [d, s] of [["a", "\u30A2\u30AB\u30B5\u30BF\u30CA\u30CF\u30DE\u30E4\u30E9\u30EF\u30AC\u30B6\u30C0\u30D0\u30D1\u30A1"], ["i", "\u30A4\u30AD\u30B7\u30C1\u30CB\u30D2\u30DF\u30EA\u30AE\u30B8\u30C2\u30D3\u30D4\u30A3"], ["u", "\u30A6\u30AF\u30B9\u30C4\u30CC\u30D5\u30E0\u30E6\u30EB\u30B0\u30BA\u30C5\u30D6\u30D7\u30F4\u30A5"], ["e", "\u30A8\u30B1\u30BB\u30C6\u30CD\u30D8\u30E1\u30EC\u30B2\u30BC\u30C7\u30D9\u30DA\u30A7"], ["o", "\u30AA\u30B3\u30BD\u30C8\u30CE\u30DB\u30E2\u30E8\u30ED\u30F2\u30B4\u30BE\u30C9\u30DC\u30DD\u30A9"]]) for (const c of s) DAN[c] = d;
function suppressUnnaturalAuxiliaryULongVowel(F) {
  for (let i = 0; i < F.length - 1; i++) {
    const cur = F[i], next = F[i + 1];
    if (next.pron !== "\u30FC" || next.read !== "\u30A6") continue;
    const p = cps(cur.pron.replace(/’+$/u, ""));
    if (!p.length) continue;
    if (["a", "i", "e"].includes(DAN[p[p.length - 1]])) next.pron = "\u30A6";
  }
  return F;
}
var YOUON = new Set("\u30E3\u30E5\u30E7\u30A1\u30A3\u30A5\u30A7\u30A9");
function retreatAccNuc(F) {
  if (!F.length) return F;
  let acc = 0, head = F[0];
  for (const njd of F) {
    if (njd.chain_flag === 0 || njd.chain_flag === -1) {
      head = njd;
      acc = njd.acc;
    }
    let pron = cps(njd.pron).filter((c) => !YOUON.has(c));
    if (pron.length === 0) pron = cps(njd.pron);
    if (acc > 0) {
      if (acc <= njd.mora_size) {
        const nuc = acc - 1 < pron.length ? pron[acc - 1] : pron[0];
        if (["\u30FC", "\u30C3", "\u30F3"].includes(nuc)) head.acc += -1;
        acc = -1;
      } else acc = acc - njd.mora_size;
    }
  }
  return F;
}
function modifyAccAfterChaining(F) {
  if (!F.length) return F;
  let acc = 0, isAfterNuc = false, phaseLen = 0, head = F[0];
  for (const njd of F) {
    if (njd.chain_flag === 0 || njd.chain_flag === -1) {
      isAfterNuc = false;
      head = njd;
      acc = njd.acc;
      phaseLen = 0;
    }
    if (acc === 0) continue;
    else if (isAfterNuc) {
      if (njd.ctype === "\u7279\u6B8A\u30FB\u30DE\u30B9") head.acc = njd.cform !== "\u672A\u7136\u5F62" ? phaseLen + 1 : phaseLen + 2;
      else if (njd.ctype === "\u7279\u6B8A\u30FB\u30CA\u30A4") head.acc = phaseLen;
      else if (["\u308C\u308B", "\u3089\u308C\u308B", "\u3059\u304E\u308B", "\u305B\u308B", "\u3055\u305B\u308B"].includes(njd.orig)) head.acc = phaseLen + njd.acc;
      else {
        isAfterNuc = false;
        acc = 0;
      }
      phaseLen += njd.mora_size;
    } else {
      phaseLen += njd.mora_size;
      if (acc <= njd.mora_size) isAfterNuc = true;
      else acc = acc - njd.mora_size;
    }
  }
  return F;
}
var SEION = {};
{
  const d = "\u304C\u304E\u3050\u3052\u3054\u3056\u3058\u305A\u305C\u305E\u3060\u3062\u3065\u3067\u3069\u3070\u3073\u3076\u3079\u307C\u30AC\u30AE\u30B0\u30B2\u30B4\u30B6\u30B8\u30BA\u30BC\u30BE\u30C0\u30C2\u30C5\u30C7\u30C9\u30D0\u30D3\u30D6\u30D9\u30DC\u30F4", s = "\u304B\u304D\u304F\u3051\u3053\u3055\u3057\u3059\u305B\u305D\u305F\u3061\u3064\u3066\u3068\u306F\u3072\u3075\u3078\u307B\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8\u30CF\u30D2\u30D5\u30D8\u30DB\u30A6";
  cps(d).forEach((c, i) => {
    SEION[c] = cps(s)[i];
  });
}
function splitKanaMora(text) {
  const ch = cps(text), out = [];
  for (let i = 0; i < ch.length; ) {
    if (i + 1 < ch.length && YOUON.has(ch[i + 1])) {
      out.push(ch[i] + ch[i + 1]);
      i += 2;
    } else {
      out.push(ch[i]);
      i++;
    }
  }
  return out;
}
function detectOdoriUnit(read) {
  const m = splitKanaMora(cps(read).map((c) => SEION[c] ?? c).join("")), n = m.length;
  if (n < 2) return null;
  for (let p = 1; p <= Math.floor(n / 2); p++) if (m.slice(n - p * 2, n - p).join("|") === m.slice(n - p).join("|")) return p;
  return null;
}
var DAKU = {};
{
  const a = "\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8\u30CF\u30D2\u30D5\u30D8\u30DB\u304B\u304D\u304F\u3051\u3053\u3055\u3057\u3059\u305B\u305D\u305F\u3061\u3064\u3066\u3068\u306F\u3072\u3075\u3078\u307B", b = "\u30AC\u30AE\u30B0\u30B2\u30B4\u30B6\u30B8\u30BA\u30BC\u30BE\u30C0\u30C2\u30C5\u30C7\u30C9\u30D0\u30D3\u30D6\u30D9\u30DC\u304C\u304E\u3050\u3052\u3054\u3056\u3058\u305A\u305C\u305E\u3060\u3062\u3065\u3067\u3069\u3070\u3073\u3076\u3079\u307C";
  cps(a).forEach((c, i) => {
    DAKU[c] = cps(b)[i];
  });
  for (const [x, y] of [["\u30AD", "\u30AE"], ["\u30B7", "\u30B8"], ["\u30C1", "\u30C2"], ["\u30D2", "\u30D3"], ["\u304D", "\u304E"], ["\u3057", "\u3058"], ["\u3061", "\u3062"], ["\u3072", "\u3073"]]) for (const s of x < "\u30A1" ? "\u3083\u3085\u3087" : "\u30E3\u30E5\u30E7") DAKU[x + s] = y + s;
}
var DAKU_REV = Object.fromEntries(Object.entries(DAKU).map(([k, v]) => [v, k]));
var asNoun = (f) => {
  f.pos = "\u540D\u8A5E";
  f.pos_group1 = "\u4E00\u822C";
  f.pos_group2 = "*";
  f.pos_group3 = "*";
  f.ctype = "*";
  f.cform = "*";
};
function processOdoriFeatures(F, cFrontend) {
  const isDancing = (orig) => orig.length > 0 && cps(orig).every((c) => c === "\u3005");
  const isOdoriji = (orig) => cps(orig).every((c) => "\u309D\u309E\u30FD\u30FE".includes(c));
  const countOdori = (orig) => cps(orig).filter((c) => c === "\u3005").length;
  const isKanjiToken = (t) => t.pos !== "\u8A18\u53F7" && cps(t.orig).some(isKanji);
  const isSingleKanjiToken = (t) => isKanjiToken(t) && cps(t.orig).length === 1 && isKanji(cps(t.orig)[0]);
  const needsReanalysis = (od, prev, next) => {
    if (countOdori(od.orig) !== 1 || !isKanjiToken(prev)) return [false, "", null];
    const po2 = cps(prev.orig);
    if (po2.length > 1 && isKanji(po2[po2.length - 1])) return [true, po2[po2.length - 1], next && isSingleKanjiToken(next) ? next.orig : null];
    return [false, "", null];
  };
  const processOdoriji = (od, prev) => {
    const readChars = splitKanaMora(prev.read);
    let src = prev.pron.replace(/’/g, "");
    if (src === "") src = prev.read;
    const pronChars = splitKanaMora(src), moraPerChar = prev.mora_size / readChars.length;
    const pRead = readChars[readChars.length - 1], pPron = pronChars[pronChars.length - 1];
    let forced = false;
    for (const c of cps(od.orig)) {
      if (c === "\u309E" || c === "\u30FE") {
        forced = true;
        break;
      }
      if (c === "\u309D" || c === "\u30FD") break;
    }
    const single = !cps(pRead).some((c) => YOUON.has(c));
    if (forced) {
      od.read = DAKU[pRead] || pRead;
      od.pron = DAKU[pPron] || pPron;
    } else if (single) {
      od.read = DAKU_REV[pRead] || pRead;
      od.pron = DAKU_REV[pPron] || pPron;
    } else {
      od.read = pRead;
      od.pron = pPron;
    }
    od.mora_size = Math.trunc(moraPerChar);
    if (od.pos === "\u8A18\u53F7") asNoun(od);
    return od;
  };
  let i = 0;
  while (i < F.length) {
    if (isDancing(F[i].orig)) {
      if (i > 0 && cFrontend) {
        const [need, target, nextKanji] = needsReanalysis(F[i], F[i - 1], i + 1 < F.length ? F[i + 1] : null);
        if (need) {
          if (nextKanji !== null) {
            const an3 = cFrontend(target + nextKanji);
            if (an3.length > 0) an3[0].chain_flag = 1;
            F.splice(i, 2, ...an3);
            i += an3.length;
            continue;
          }
          const an2 = cFrontend(target);
          F[i] = an2[0];
          F[i].chain_flag = 1;
          asNoun(F[i]);
          i += 1;
          continue;
        }
      }
      const start = i;
      let end = i, total = 0;
      while (end < F.length && isDancing(F[end].orig)) {
        total += countOdori(F[end].orig);
        end++;
      }
      if (i > 0 && F[i - 1].orig.endsWith("\u3005")) {
        const prev = F[i - 1], period = detectOdoriUnit(prev.read);
        if (period !== null) {
          const rm = splitKanaMora(prev.read), pm = splitKanaMora(prev.pron);
          if (rm.length >= period && rm.length > 0) {
            const cur = F[i], n = countOdori(cur.orig), unitMora = Math.floor(prev.mora_size / rm.length) * period;
            cur.read = rm.slice(rm.length - period).join("").repeat(n);
            cur.pron = pm.slice(pm.length - period).join("").repeat(n);
            cur.mora_size = unitMora * n;
            cur.acc = prev.acc;
            cur.chain_flag = 1;
            if (cur.pos === "\u8A18\u53F7") asNoun(cur);
            i += 1;
            continue;
          }
        }
      }
      const normal = [];
      let j = start - 1, collected = 0;
      const needed = Math.min(total, 8);
      while (j >= 0) {
        const t = F[j];
        if (["\u8A18\u53F7", "\u30D5\u30A3\u30E9\u30FC", "\u611F\u52D5\u8A5E"].includes(t.pos)) break;
        if (isKanjiToken(t)) {
          normal.push(t);
          collected += cps(t.orig).length;
          if (collected >= needed) break;
        } else break;
        j--;
      }
      normal.reverse();
      if (!normal.length) {
        i = end;
        continue;
      }
      const singleKanji = normal.length === 1 && cps(normal[0].orig).length === 1;
      const baseRead = singleKanji ? normal[0].read : normal.map((x) => x.read).join(""), basePron = singleKanji ? normal[0].pron : normal.map((x) => x.pron).join("");
      const baseMora = singleKanji ? normal[0].mora_size : normal.reduce((a, x) => a + x.mora_size, 0), baseAcc = normal[0].acc;
      for (let k = start; k < end; k++) {
        const n = countOdori(F[k].orig);
        if (singleKanji) {
          F[k].read = baseRead.repeat(n);
          F[k].pron = basePron.repeat(n);
          F[k].mora_size = baseMora * n;
        } else {
          F[k].read = baseRead;
          F[k].pron = basePron;
          F[k].mora_size = baseMora;
        }
        F[k].acc = baseAcc;
        F[k].chain_flag = 1;
        if (F[k].pos === "\u8A18\u53F7") asNoun(F[k]);
      }
      i = end;
    } else if (isOdoriji(F[i].orig)) {
      if (i > 0 && F[i - 1].pos !== "\u8A18\u53F7") {
        let p = i - 1;
        while (p >= 0) {
          if (F[p].pos !== "\u8A18\u53F7" && F[p].mora_size > 0) break;
          p--;
        }
        if (p >= 0) F[i] = processOdoriji(F[i], F[p]);
      }
      i += 1;
    } else i += 1;
  }
  return F;
}
function questionType(text) {
  const s = text.trim(), e = (...xs) => xs.some((x) => s.endsWith(x));
  if (e("?!", "\uFF01\uFF1F", "\uFF1F\uFF01")) return "?!";
  if (e("?.", "\u3002\uFF1F", "\uFF1F\u3002")) return "?.";
  if (e("?~", "\uFF5E\uFF1F", "\uFF1F\uFF5E")) return "?~";
  if (e("?", "\uFF1F")) return "?";
  return "$";
}
var SKIP = /* @__PURE__ */ new Set(["_", "#", "[", "]", "^", "$", "?", "?!", "?.", "?~"]);
function applyNRules(tokens) {
  const r = tokens.slice();
  let next = null;
  for (let i = r.length - 1; i >= 0; i--) {
    const t = r[i];
    if (!SKIP.has(t) && t !== "N") next = t;
    else if (t === "N") {
      if (next === null) r[i] = "N_uvular";
      else if (["m", "my", "b", "by", "p", "py"].includes(next)) r[i] = "N_m";
      else if (["n", "ny", "t", "ty", "d", "dy", "ts", "ch"].includes(next)) r[i] = "N_n";
      else if (["k", "ky", "kw", "g", "gy", "gw"].includes(next)) r[i] = "N_ng";
      else r[i] = "N_uvular";
      next = r[i];
    }
  }
  return r;
}
var RE_PH = /-([^+]+)\+/;
var RE_PROS = /\/A:([\d-]+)\+([0-9]+)\+([0-9]+)\//;
function labelsToTokens(labels, text) {
  const tokens = [], prosody = [], q2 = questionType(text);
  labels.forEach((label, idx) => {
    const m = RE_PH.exec(label);
    if (!m) return;
    const ph = m[1];
    if (ph === "sil") {
      if (idx !== 0 && idx === labels.length - 1 && q2 !== "$") {
        tokens.push(q2);
        prosody.push(null);
      }
      return;
    }
    if (ph === "pau") {
      tokens.push("_");
      prosody.push(null);
      return;
    }
    tokens.push(ph);
    const p = RE_PROS.exec(label);
    if (!p) {
      prosody.push(null);
      return;
    }
    const a1 = parseInt(p[1], 10), a2 = parseInt(p[2], 10), a3 = parseInt(p[3], 10);
    prosody.push([a1, a2, a3]);
    let a2next = -1;
    if (idx < labels.length - 1) {
      const n = RE_PROS.exec(labels[idx + 1]);
      a2next = n ? parseInt(n[2], 10) : -1;
    }
    if (a1 === 0 && a2next === a2 + 1) {
      tokens.push("]");
      prosody.push(null);
    }
    if (a2 === a3 && a2next === 1) {
      tokens.push("#");
      prosody.push(null);
    }
    if (a2 === 1 && a2next === 2) {
      tokens.push("[");
      prosody.push(null);
    }
  });
  return { tokens: applyNRules(tokens), prosody };
}
function mountDictionaryBytes(Module2, dict, dicDir = "/dic") {
  Module2.FS.mkdir(dicDir);
  for (const [name, bytes] of [["char.bin", dict.char], ["matrix.bin", dict.matrix], ["unk.dic", dict.unk]]) Module2.FS.writeFile(`${dicDir}/${name}`, bytes);
  const len = dict.sys.length, ptr = Module2._malloc(len);
  if (!ptr) throw new Error("out of memory while loading the Japanese dictionary");
  Module2.HEAPU8.set(dict.sys, ptr);
  Module2.FS.writeFile(`${dicDir}/sys.dic`, new Uint8Array(0));
  const node = Module2.FS.lookupPath(`${dicDir}/sys.dic`).node;
  node.contents = Module2.HEAPU8.subarray(ptr, ptr + len);
  node.usedBytes = len;
  Module2.__ojtHeapAtMount = Module2.HEAPU8.buffer;
}
function createJaFrontend(Module2, dicDir = "/dic", { naniModel = null, emulateSudachiPass = true } = {}) {
  const call = (name, text) => {
    const n = Module2.lengthBytesUTF8(text) + 1, p = Module2._malloc(n);
    Module2.stringToUTF8(text, p, n);
    try {
      const r = Module2[name](p);
      if (!r) throw new Error(name + " failed (text too long or MeCab error)");
      return Module2.UTF8ToString(r);
    } finally {
      Module2._free(p);
    }
  };
  {
    const n = Module2.lengthBytesUTF8(dicDir) + 1, p = Module2._malloc(n);
    Module2.stringToUTF8(dicDir, p, n);
    const ok = Module2._ojt_init(p);
    Module2._free(p);
    if (ok !== 1) throw new Error("MeCab dictionary load failed: " + dicDir);
  }
  if (Module2.__ojtHeapAtMount && Module2.__ojtHeapAtMount !== Module2.HEAPU8.buffer) throw new Error("WASM heap grew while MeCab was loading the zero-copy dictionary; rebuild ojt.wasm with a larger INITIAL_MEMORY");
  {
    const node = Module2.FS.lookupPath(`${dicDir}/sys.dic`).node;
    node.contents = new Uint8Array(0);
    node.usedBytes = 0;
  }
  function cFrontend(text) {
    const s1 = call("_ojt_stage1", text.replace(/[\t\n\r\0]/g, " "));
    if (!s1) return [];
    return parseNjd(call("_ojt_stage2", dumpNjd(applyOriginalRuleBeforeChaining(parseNjd(s1)))));
  }
  function runFrontend(text, { vanilla = false } = {}) {
    let F = cFrontend(text);
    if (!vanilla) {
      F = modifyFillerAccent(F);
      F = predictNaniReading(F, naniModel);
      if (emulateSudachiPass) F = emulateKanjiYomiPass(F);
      F = suppressUnnaturalAuxiliaryULongVowel(F);
      F = retreatAccNuc(F);
      F = modifyAccAfterChaining(F);
      F = processOdoriFeatures(F, cFrontend);
    }
    return F;
  }
  function extractFullcontext(text, opts) {
    const F = runFrontend(text, opts);
    return F.length ? call("_ojt_labels", dumpNjd(F)).split("\n").filter(Boolean) : [];
  }
  function phonemize(text, opts) {
    const clean = Array.from(text).filter((ch) => ch >= " " || "\n	\r".includes(ch)).join("");
    if (!clean) return { tokens: [], prosody: [] };
    return labelsToTokens(extractFullcontext(clean, opts), clean);
  }
  return { cFrontend, runFrontend, extractFullcontext, phonemize };
}

// node_modules/@internal/read-aloud/backend/piper-plus/pua-map.js
var TOKEN2CHAR = { "a:": "\uE000", "i:": "\uE001", "u:": "\uE002", "e:": "\uE003", "o:": "\uE004", "cl": "\uE005", "ky": "\uE006", "kw": "\uE007", "gy": "\uE008", "gw": "\uE009", "ty": "\uE00A", "dy": "\uE00B", "py": "\uE00C", "by": "\uE00D", "ch": "\uE00E", "ts": "\uE00F", "sh": "\uE010", "zy": "\uE011", "hy": "\uE012", "ny": "\uE013", "my": "\uE014", "ry": "\uE015", "?!": "\uE016", "?.": "\uE017", "?~": "\uE018", "N_m": "\uE019", "N_n": "\uE01A", "N_ng": "\uE01B", "N_uvular": "\uE01C", "rr": "\uE01D", "y_vowel": "\uE01E", "p\u02B0": "\uE020", "t\u02B0": "\uE021", "k\u02B0": "\uE022", "t\u0255": "\uE023", "t\u0255\u02B0": "\uE024", "t\u0282": "\uE025", "t\u0282\u02B0": "\uE026", "ts\u02B0": "\uE027", "a\u026A": "\uE028", "e\u026A": "\uE029", "a\u028A": "\uE02A", "o\u028A": "\uE02B", "an": "\uE02C", "\u0259n": "\uE02D", "a\u014B": "\uE02E", "\u0259\u014B": "\uE02F", "u\u014B": "\uE030", "ia": "\uE031", "i\u025B": "\uE032", "iou": "\uE033", "ia\u028A": "\uE034", "i\u025Bn": "\uE035", "in": "\uE036", "ia\u014B": "\uE037", "i\u014B": "\uE038", "iu\u014B": "\uE039", "ua": "\uE03A", "uo": "\uE03B", "ua\u026A": "\uE03C", "ue\u026A": "\uE03D", "uan": "\uE03E", "u\u0259n": "\uE03F", "ua\u014B": "\uE040", "u\u0259\u014B": "\uE041", "y\u025B": "\uE042", "y\u025Bn": "\uE043", "yn": "\uE044", "\u027B\u0329": "\uE045", "tone1": "\uE046", "tone2": "\uE047", "tone3": "\uE048", "tone4": "\uE049", "tone5": "\uE04A", "p\u0348": "\uE04B", "t\u0348": "\uE04C", "k\u0348": "\uE04D", "s\u0348": "\uE04E", "t\u0348\u0255": "\uE04F", "k\u031A": "\uE050", "t\u031A": "\uE051", "p\u031A": "\uE052", "t\u0283": "\uE054", "d\u0292": "\uE055", "\u025B\u0303": "\uE056", "\u0251\u0303": "\uE057", "\u0254\u0303": "\uE058", "i\u02D0": "\uE059", "y\u02D0": "\uE05A", "e\u02D0": "\uE05B", "\u025B\u02D0": "\uE05C", "\xF8\u02D0": "\uE05D", "\u0251\u02D0": "\uE05E", "o\u02D0": "\uE05F", "u\u02D0": "\uE060", "\u0289\u02D0": "\uE061", "\u0254\u026A": "\uE062", "\u0153\u0303": "\uE063", "\u0250\u0303": "\uE064" };

// node_modules/@internal/read-aloud/backend/piper-plus/encode.js
function encodeTokens(tokens, prosody, phonemeIdMap, { quirk = true, pauseAt = null } = {}) {
  const pad = phonemeIdMap["_"][0], ids = [phonemeIdMap["^"][0], pad], pros = [[0, 0, 0], [0, 0, 0]];
  let k = 0;
  tokens.forEach((tok, i) => {
    const mapped = TOKEN2CHAR[tok] ?? tok;
    for (const ch of mapped) {
      const m = phonemeIdMap[ch];
      if (!m) {
        if (pauseAt && pauseAt.has(ch) && ids.length > 2 && i < tokens.length - 1) {
          ids.push(pad);
          pros.push([0, 0, 0]);
        }
        continue;
      }
      for (const id of m) {
        ids.push(id);
        pros.push((quirk ? prosody[k] : prosody[i]) || [0, 0, 0]);
        k++;
        if (id !== pad) {
          ids.push(pad);
          pros.push([0, 0, 0]);
        }
      }
    }
  });
  ids.push(phonemeIdMap["$"][0]);
  pros.push([0, 0, 0]);
  return { ids, pros };
}

// node_modules/@internal/read-aloud/backend/piper-plus/zh-loanwords.js
var zh_loanwords_default = { "acronyms": { "GPS": ["ji4", "pi4", "ai1", "si4"], "USB": ["you1", "ai1", "si4", "bi4"], "CPU": ["si4", "pi4", "you1"], "GPU": ["ji4", "pi4", "you1"], "AI": ["ei1", "ai4"], "API": ["ei1", "pi4", "ai4"], "URL": ["you1", "a4", "er2", "ai1", "er2"], "SDK": ["ai1", "si4", "di4", "kei4"], "HTML": ["ai1", "chi4", "ti4", "ai1", "mu5", "ai1", "er2"], "CSS": ["si4", "ai1", "si4", "ai1", "si4"], "JS": ["jie4", "ai1", "si4"], "CSV": ["si4", "ai1", "si4", "wei1"], "PDF": ["pi4", "di4", "ai1", "fu2"], "XML": ["ai4", "ke4", "si1", "ai1", "mu5", "ai1", "er2"], "SQL": ["ai1", "si4", "kiu1", "ai1", "er2"], "UI": ["you1", "ai4"], "UX": ["you1", "ai4", "ke4", "si1"], "DNS": ["di4", "en1", "ai1", "si4"], "IP": ["ai4", "pi4"], "TCP": ["ti4", "si4", "pi4"], "UDP": ["you1", "di4", "pi4"], "SSH": ["ai1", "si4", "ai1", "si4", "ai1", "chi4"], "SSL": ["ai1", "si4", "ai1", "si4", "ai1", "er2"], "TLS": ["ti4", "ai1", "er2", "ai1", "si4"], "VPN": ["wei1", "pi4", "en1"], "NPC": ["en1", "pi4", "si4"], "RPG": ["a4", "er2", "pi4", "ji4"], "FPS": ["ai1", "fu2", "pi4", "ai1", "si4"], "CEO": ["si4", "yi1", "ou1"], "CFO": ["si4", "ai1", "fu2", "ou1"], "CTO": ["si4", "ti4", "ou1"], "COO": ["si4", "ou1", "ou1"], "PR": ["pi4", "a4", "er2"], "HR": ["ai1", "chi4", "a4", "er2"], "KPI": ["kei4", "pi4", "ai4"], "ROI": ["a4", "er2", "ou1", "ai4"], "OKR": ["ou1", "kei4", "a4", "er2"], "CRM": ["si4", "a4", "er2", "ai1", "mu5"], "ERP": ["yi1", "a4", "er2", "pi4"], "IOT": ["ai4", "ou1", "ti4"], "AR": ["ei1", "a4", "er2"], "VR": ["wei1", "a4", "er2"], "MR": ["ai1", "mu5", "a4", "er2"], "ML": ["ai1", "mu5", "ai1", "er2"], "DL": ["di4", "ai1", "er2"], "NLP": ["en1", "ai1", "er2", "pi4"], "LED": ["ai1", "er2", "yi1", "di4"], "LCD": ["ai1", "er2", "si4", "di4"], "OLED": ["ou1", "ai1", "er2", "yi1", "di4"], "PHP": ["pi4", "ai1", "chi4", "pi4"], "PNG": ["pi4", "en1", "ji4"], "JPG": ["jie4", "pi4", "ji4"], "MP3": ["ai1", "mu5", "pi4", "san1"], "MP4": ["ai1", "mu5", "pi4", "si4"], "FBI": ["ai1", "fu2", "bi4", "ai4"], "CIA": ["si4", "ai4", "ei1"], "NBA": ["en1", "bi4", "ei1"], "UN": ["you1", "en1"], "EU": ["yi1", "you1"], "UK": ["you1", "kei4"], "US": ["you1", "ai1", "si4"], "USA": ["you1", "ai1", "si4", "ei1"], "ATM": ["ei1", "ti4", "ai1", "mu5"], "PIN": ["pi4", "ai4", "en1"], "FAQ": ["ai1", "fu2", "ei1", "kiu1"], "WTO": ["shuang1", "bi3", "you1", "ti4", "ou1"] }, "loanwords": { "Python": ["pai4", "sen1"], "iPhone": ["ai4", "feng1"], "iPad": ["ai4", "pa4"], "ChatGPT": ["chai4", "ti2", "ji4", "pi4", "ti4"], "Java": ["jia3", "wa3"], "Google": ["gu3", "ge1"], "Facebook": ["fei4", "si1", "bu4", "ke4"], "Microsoft": ["wei2", "ruan3"], "Twitter": ["tui1", "te4"], "YouTube": ["you1", "tu4", "bei4"], "WhatsApp": ["hua2", "ci2", "a1", "pu1"], "WeChat": ["wei1", "xin4"], "TikTok": ["ti4", "ke4", "ti4", "ke4"], "Linux": ["li4", "nei4", "ke4", "si1"], "Docker": ["dao4", "ke4"], "Kubernetes": ["ku4", "bo2", "nei4", "ti4", "si1"], "GitHub": ["ji2", "te4", "ha2", "bu4"], "Slack": ["si1", "la1", "ke4"], "Zoom": ["zu4", "mu3"], "Spotify": ["si1", "bo1", "ti4", "fei1"], "Netflix": ["nai4", "fei1"], "Amazon": ["ya4", "ma3", "xun4"], "Tesla": ["te4", "si1", "la1"], "Bitcoin": ["bi3", "te4", "bi4"], "Ethereum": ["yi3", "tai4", "fang1"], "Discord": ["di2", "si1", "ke1", "de2"], "Reddit": ["rui4", "di2", "te4"], "Steam": ["si1", "ti4", "mu3"], "Minecraft": ["mai4", "ke4", "la1", "fu1", "te4"], "Excel": ["yi1", "ke4", "sai1", "er3"], "Word": ["wo4", "de2"], "PowerPoint": ["pao4", "wei4", "pin3", "te4"], "Skype": ["si1", "kai1", "pu3"], "LinkedIn": ["ling3", "ying1"], "Android": ["an1", "zhuo2"], "iOS": ["ai4", "ou1", "ai1", "si4"], "macOS": ["ma3", "ke4", "ou1", "ai1", "si4"], "Windows": ["wen2", "duo1", "si1"], "Apple": ["a1", "pou1"], "Office": ["ao4", "fei1", "si1"] }, "letter_fallback": { "A": ["ei1"], "B": ["bi4"], "C": ["si4"], "D": ["di4"], "E": ["yi1"], "F": ["ai1", "fu2"], "G": ["ji4"], "H": ["ai1", "chi4"], "I": ["ai4"], "J": ["jie4"], "K": ["kei4"], "L": ["ai1", "er2"], "M": ["ai1", "mu5"], "N": ["en1"], "O": ["ou1"], "P": ["pi4"], "Q": ["kiu1"], "R": ["a4", "er2"], "S": ["ai1", "si4"], "T": ["ti4"], "U": ["you1"], "V": ["wei1"], "W": ["shuang1", "bi3", "you1"], "X": ["ai4", "ke4", "si1"], "Y": ["wai4"], "Z": ["zi4"] } };

// node_modules/@internal/read-aloud/backend/piper-plus/zh-g2p.js
var INITIAL_TO_IPA = {
  b: "p",
  p: "p\u02B0",
  m: "m",
  f: "f",
  d: "t",
  t: "t\u02B0",
  n: "n",
  l: "l",
  g: "k",
  k: "k\u02B0",
  h: "x",
  j: "t\u0255",
  q: "t\u0255\u02B0",
  x: "\u0255",
  zh: "t\u0282",
  ch: "t\u0282\u02B0",
  sh: "\u0282",
  r: "\u027B",
  z: "ts",
  c: "ts\u02B0",
  s: "s"
};
var FINAL_TO_IPA = {
  a: "a",
  o: "o",
  e: "\u0264",
  i: "i",
  u: "u",
  "\xFC": "y_vowel",
  v: "y_vowel",
  ai: "a\u026A",
  ei: "e\u026A",
  ao: "a\u028A",
  ou: "o\u028A",
  an: "an",
  en: "\u0259n",
  ang: "a\u014B",
  eng: "\u0259\u014B",
  ong: "u\u014B",
  er: "\u025A",
  ia: "ia",
  ie: "i\u025B",
  iao: "ia\u028A",
  iu: "iou",
  iou: "iou",
  ian: "i\u025Bn",
  in: "in",
  iang: "ia\u014B",
  ing: "i\u014B",
  iong: "iu\u014B",
  ua: "ua",
  uo: "uo",
  uai: "ua\u026A",
  ui: "ue\u026A",
  uei: "ue\u026A",
  uan: "uan",
  un: "u\u0259n",
  uen: "u\u0259n",
  uang: "ua\u014B",
  ueng: "u\u0259\u014B",
  "\xFCe": "y\u025B",
  ve: "y\u025B",
  "\xFCan": "y\u025Bn",
  van: "y\u025Bn",
  "\xFCn": "yn",
  vn: "yn",
  "-i_retroflex": "\u027B\u0329",
  "-i_alveolar": "\u0268"
};
var INITIALS_ORDER = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "r", "z", "c", "s"];
var RETROFLEX = /* @__PURE__ */ new Set(["zh", "ch", "sh", "r"]);
var ALVEOLAR = /* @__PURE__ */ new Set(["z", "c", "s"]);
var ZH_PUNCT_MAP = { "\u3002": ".", "\uFF0C": ",", "\uFF01": "!", "\uFF1F": "?", "\u3001": ",", "\uFF1B": ";", "\uFF1A": ":", "\u2026": ".", "\u2014": ",", "\u201C": '"', "\u201D": '"', "\u2018": "'", "\u2019": "'" };
var ZH_PUNCT = /* @__PURE__ */ new Set([",", ".", ";", ":", "!", "?", "\u3002", "\uFF0C", "\uFF01", "\uFF1F", "\u3001", "\uFF1B", "\uFF1A", "\u201C", "\u201D", "\u2018", "\u2019", "\u2026", "\u2014"]);
var WS = /* @__PURE__ */ new Set([9, 10, 11, 12, 13, 32, 133, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288]);
var isWs = (ch) => WS.has(ch.codePointAt(0));
var RE_ALPHA = /\p{Alphabetic}/u;
var isCjk = (ch) => {
  const c = ch.codePointAt(0);
  return c >= 19968 && c <= 40959 || c >= 13312 && c <= 19903;
};
function normalizePinyin(py) {
  const s = py.replace(/v/g, "\xFC");
  if (s.startsWith("yu")) return "\xFC" + s.slice(2);
  if (s.startsWith("y")) {
    const rest = s.slice(1);
    return rest.startsWith("i") ? rest : "i" + rest;
  }
  if (s.startsWith("w")) {
    const rest = s.slice(1);
    return rest.startsWith("u") ? rest : "u" + rest;
  }
  return s;
}
function splitPinyin(pinyin) {
  for (const init of INITIALS_ORDER) {
    if (!pinyin.startsWith(init)) continue;
    let fin = pinyin.slice(init.length);
    if (fin === "i") {
      if (RETROFLEX.has(init)) return [init, "-i_retroflex"];
      if (ALVEOLAR.has(init)) return [init, "-i_alveolar"];
    }
    if ((init === "j" || init === "q" || init === "x") && fin.startsWith("u")) fin = "\xFC" + fin.slice(1);
    return [init, fin];
  }
  return ["", pinyin];
}
function pinyinToIpa(syllable, tone) {
  const [initial, fin] = splitPinyin(syllable), tokens = [];
  if (initial && INITIAL_TO_IPA[initial]) tokens.push(INITIAL_TO_IPA[initial]);
  if (fin) {
    if (Object.hasOwn(FINAL_TO_IPA, fin)) tokens.push(FINAL_TO_IPA[fin]);
    else for (const ch of fin) if (ch >= "a" && ch <= "z") tokens.push(Object.hasOwn(FINAL_TO_IPA, ch) ? FINAL_TO_IPA[ch] : ch);
  }
  if (tone >= 1 && tone <= 5) tokens.push("tone" + tone);
  return tokens;
}
function extractTone(syl) {
  const c = syl.charCodeAt(syl.length - 1);
  return c >= 49 && c <= 53 ? [syl.slice(0, -1), c - 48] : [syl, 5];
}
function applyToneSandhi(st) {
  for (let i = 0; i + 1 < st.length; i++) {
    const t = st[i][1], next = st[i + 1][1];
    if (t === 3 && next === 3) {
      st[i][1] = 2;
      continue;
    }
    if (st[i][0] === "i" && t === 1) {
      if (next === 4) st[i][1] = 2;
      else if (next >= 1 && next <= 3) st[i][1] = 4;
      continue;
    }
    if (st[i][0] === "bu" && t === 4 && next === 4) st[i][1] = 2;
  }
}
var DIGIT_PINYIN = ["ling2", "yi1", "er4", "san1", "si4", "wu3", "liu4", "qi1", "ba1", "jiu3"];
function latinToPinyin(token) {
  if (Object.hasOwn(zh_loanwords_default.loanwords, token)) return zh_loanwords_default.loanwords[token];
  const up = token.toUpperCase();
  if (Object.hasOwn(zh_loanwords_default.acronyms, up)) return zh_loanwords_default.acronyms[up];
  const out = [];
  for (const ch of up) {
    if (Object.hasOwn(zh_loanwords_default.letter_fallback, ch)) out.push(...zh_loanwords_default.letter_fallback[ch]);
    else if (ch >= "0" && ch <= "9") out.push(DIGIT_PINYIN[+ch]);
  }
  return out;
}
function createChineseG2p({ single, phrases }) {
  const singleDict = /* @__PURE__ */ new Map(), phraseDict = /* @__PURE__ */ new Map();
  for (const [k, v] of Object.entries(single)) {
    const cp = Number(k);
    if (!Number.isInteger(cp)) continue;
    const py = Array.isArray(v) ? v[0] : v;
    if (py) singleDict.set(String.fromCodePoint(cp), py);
  }
  for (const [k, v] of Object.entries(phrases)) {
    const list = typeof v === "string" ? v.split(/\s+/).filter(Boolean) : v.map((x) => Array.isArray(x) ? x[0] : x);
    if (list.length) phraseDict.set(k, list);
  }
  function textToPinyin(chars) {
    const out = [], n = chars.length;
    for (let i = 0; i < n; ) {
      const cp = chars[i];
      if (!isCjk(cp)) {
        out.push({ chinese: false, normalized: "", tone: 0 });
        i++;
        continue;
      }
      let hit = null, hitLen = 0;
      for (let len = Math.min(n - i, 8); len >= 2; len--) {
        const p = phraseDict.get(chars.slice(i, i + len).join(""));
        if (p) {
          hit = p;
          hitLen = len;
          break;
        }
      }
      if (hit) {
        for (let j = 0; j < hitLen; j++) {
          const [base, tone] = j < hit.length ? extractTone(hit[j]) : ["", 5];
          out.push({ chinese: true, normalized: normalizePinyin(base), tone });
        }
        i += hitLen;
        continue;
      }
      const raw = singleDict.get(cp);
      if (raw !== void 0) {
        const [base, tone] = extractTone(raw.split(",")[0]);
        out.push({ chinese: true, normalized: normalizePinyin(base), tone });
      } else out.push({ chinese: false, normalized: "", tone: 0 });
      i++;
    }
    return out;
  }
  function phonemize(text) {
    const chars = Array.from(text), n = chars.length;
    const wordInfo = new Array(n).fill(null);
    for (let i = 0; i < n; ) {
      if (!isCjk(chars[i])) {
        i++;
        continue;
      }
      let j = i;
      while (j < n && isCjk(chars[j])) j++;
      for (let k = i; k < j; k++) wordInfo[k] = [k - i + 1, j - i];
      i = j;
    }
    const cp = textToPinyin(chars);
    for (let i = 0; i < n; ) {
      if (!cp[i].chinese) {
        i++;
        continue;
      }
      let j = i;
      while (j < n && cp[j].chinese) j++;
      if (j - i >= 2) {
        const st = cp.slice(i, j).map((c) => [c.normalized, c.tone]);
        applyToneSandhi(st);
        st.forEach(([, tone], k) => {
          cp[i + k].tone = tone;
        });
      }
      i = j;
    }
    const tokens = [], prosody = [];
    for (let idx = 0; idx < n; idx++) {
      const ch = chars[idx], c = cp[idx];
      if (/[A-Za-z0-9]/.test(ch) && !c.chinese) {
        let j = idx;
        while (j < n && /[A-Za-z0-9]/.test(chars[j])) j++;
        const tok = chars.slice(idx, j).join("");
        if (/[A-Za-z]/.test(tok)) {
          const syl = latinToPinyin(tok);
          syl.forEach((py, k) => {
            const [base, tone2] = extractTone(py);
            for (const t of pinyinToIpa(normalizePinyin(base), tone2)) {
              tokens.push(t);
              prosody.push([tone2, k + 1, syl.length]);
            }
          });
          idx = j - 1;
          continue;
        }
      }
      if (!c.chinese) {
        if (Object.hasOwn(ZH_PUNCT_MAP, ch)) {
          tokens.push(ZH_PUNCT_MAP[ch]);
          prosody.push(null);
        } else if (ZH_PUNCT.has(ch)) {
          tokens.push(ch);
          prosody.push(null);
        } else if (isWs(ch)) {
          tokens.push(" ");
          prosody.push([0, 0, 0]);
        } else if (ch >= "0" && ch <= "9" || RE_ALPHA.test(ch)) {
          tokens.push(ch);
          prosody.push([0, 0, 1]);
        }
        continue;
      }
      let normalized = c.normalized;
      const tone = c.tone;
      const erhua = normalized.length > 1 && normalized !== "er" && normalized.endsWith("r");
      if (erhua) normalized = normalized.slice(0, -1);
      const ipa = pinyinToIpa(normalized, tone);
      if (erhua && ipa.length) {
        if (ipa[ipa.length - 1].startsWith("tone")) ipa.splice(ipa.length - 1, 0, "\u025A");
        else ipa.push("\u025A");
      }
      const [pos, len] = wordInfo[idx] || [1, 1];
      for (const t of ipa) {
        tokens.push(t);
        prosody.push([tone, pos, len]);
      }
    }
    return { tokens, prosody };
  }
  function encodeRustLayout(text, phonemeIdMap) {
    const { tokens, prosody } = phonemize(text);
    const pad = phonemeIdMap["_"][0], ids = [phonemeIdMap["^"][0], pad], pros = [[0, 0, 0], [0, 0, 0]];
    let eos = "$";
    tokens.forEach((tok, i) => {
      const mapped = TOKEN2CHAR[tok] ?? tok;
      if (mapped === "^" || mapped === "$" || mapped === "?" || mapped === TOKEN2CHAR["?!"] || mapped === TOKEN2CHAR["?."] || mapped === TOKEN2CHAR["?~"]) {
        if (mapped !== "^") eos = mapped;
        return;
      }
      for (const ch of mapped) {
        const m = phonemeIdMap[ch];
        if (m) for (const id of m) {
          ids.push(id);
          pros.push(prosody[i] || [0, 0, 0]);
        }
      }
      ids.push(pad);
      pros.push([0, 0, 0]);
    });
    ids.push((phonemeIdMap[eos] || phonemeIdMap["$"])[0]);
    pros.push([0, 0, 0]);
    return { ids, pros };
  }
  function encode(text, phonemeIdMap, layout = "wasm") {
    if (layout === "python") {
      const t = phonemize(text);
      return encodeTokens(t.tokens, t.prosody, phonemeIdMap);
    }
    const r = encodeRustLayout(text, phonemeIdMap);
    return toReferenceLayout(r.ids, r.pros);
  }
  return { phonemize, encodeRustLayout, encode };
}
function toReferenceLayout(ids, pros) {
  const oi = [], op = [], unfiltered = [], keptAt = [];
  for (let i = 0; i < ids.length; ) {
    if (ids[i] !== 0) {
      if (i > 0 && i < ids.length - 1) {
        keptAt.push(oi.length);
        unfiltered.push(pros[i]);
      }
      oi.push(ids[i]);
      op.push(pros[i]);
      i++;
      continue;
    }
    let j = i;
    while (j < ids.length && ids[j] === 0) j++;
    oi.push(0);
    op.push([0, 0, 0]);
    for (let k = 1; k < j - i; k++) unfiltered.push([0, 0, 0]);
    i = j;
  }
  keptAt.forEach((pos, k) => {
    op[pos] = unfiltered[k];
  });
  return { ids: oi, pros: op };
}

// node_modules/@internal/read-aloud/backend/piper-plus/en-g2p.js
var ARPA2IPA = {
  AA: "\u0251",
  AE: "\xE6",
  AH: "\u028C",
  AO: "\u0254\u02D0",
  AW: "a\u028A",
  AY: "a\u026A",
  B: "b",
  CH: "t\u0283",
  D: "d",
  DH: "\xF0",
  EH: "\u025B",
  ER: "\u025A",
  EY: "e\u026A",
  F: "f",
  G: "\u0261",
  HH: "h",
  IH: "\u026A",
  IY: "i\u02D0",
  JH: "d\u0292",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "\u014B",
  OW: "o\u028A",
  OY: "\u0254\u026A",
  P: "p",
  R: "\u0279",
  S: "s",
  SH: "\u0283",
  T: "t",
  TH: "\u03B8",
  UH: "\u028A",
  UW: "u\u02D0",
  V: "v",
  W: "w",
  Y: "j",
  Z: "z",
  ZH: "\u0292"
};
var FUNCTION_WORDS = new Set("a an the i me my mine myself you your yours yourself he him his himself she her hers herself it its itself we us our ours ourselves they them their theirs themselves am is are was were be been being have has had having do does did will would shall should can could may might must at by for from in of on to with about after before between into through under and but or nor so yet if that than when while as because since not no".split(" "));
var PUNCT = /* @__PURE__ */ new Set([",", ".", ";", ":", "!", "?"]);
var VERB_CUES = new Set("to i you we they he she it who will would shall should can could may might must not don't didn't doesn't won't wouldn't can't couldn't let's please".split(" "));
var PAST_CUES = new Set("have has had having was were been be is are am got get 've 'd".split(" "));
var OVERRIDES = { live: "L IH1 V", lives: "L IH1 V Z", lead: "L IY1 D", leads: "L IY1 D Z", wind: "W IH1 N D", winds: "W IH1 N D Z", tear: "T IH1 R", tears: "T IH1 R Z" };
var DIGRAPH_RULES = [
  ["igh", ["AY1"]],
  ["th", ["TH"]],
  ["sh", ["SH"]],
  ["ch", ["CH"]],
  ["ph", ["F"]],
  ["wh", ["W"]],
  ["ck", ["K"]],
  ["ng", ["NG"]],
  ["qu", ["K", "W"]],
  ["oo", ["UW1"]],
  ["ee", ["IY1"]],
  ["ea", ["IY1"]],
  ["ai", ["EY1"]],
  ["ay", ["EY1"]],
  ["oi", ["OY1"]],
  ["oy", ["OY1"]],
  ["ou", ["AW1"]],
  ["ow", ["OW1"]],
  ["aw", ["AO1"]],
  ["au", ["AO1"]]
];
var LETTER_RULES = {
  a: ["AE1"],
  b: ["B"],
  c: ["K"],
  d: ["D"],
  e: ["EH1"],
  f: ["F"],
  g: ["G"],
  h: ["HH"],
  i: ["IH1"],
  j: ["JH"],
  k: ["K"],
  l: ["L"],
  m: ["M"],
  n: ["N"],
  o: ["AA1"],
  p: ["P"],
  q: ["K"],
  r: ["R"],
  s: ["S"],
  t: ["T"],
  u: ["AH1"],
  v: ["V"],
  w: ["W"],
  x: ["K", "S"],
  y: ["Y"],
  z: ["Z"]
};
var ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
var TENS = "  twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
function cardinal(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  if (n < 1e3) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + cardinal(n % 100) : "");
  for (const [v, w] of [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"]]) if (n >= v) return cardinal(Math.floor(n / v)) + " " + w + (n % v ? " " + cardinal(n % v) : "");
  return String(n);
}
var ORD = { one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth" };
function ordinal(n) {
  const w = cardinal(n).split(" "), l = w.pop();
  w.push(ORD[l] || (l.endsWith("y") ? l.slice(0, -1) + "ieth" : l + "th"));
  return w.join(" ");
}
function expandNumbers(text) {
  return text.replace(/(\d),(?=\d{3})/g, "$1").replace(/\b(\d+)(st|nd|rd|th)\b/g, (_, d) => ordinal(+d)).replace(/\b(\d+)\.(\d+)\b/g, (_, a, b) => cardinal(+a) + " point " + Array.from(b, (c) => ONES[+c]).join(" ")).replace(/\b\d+\b/g, (d) => {
    const n = +d;
    if (n > 1e3 && n < 3e3 && d.length === 4) {
      if (n === 2e3) return "two thousand";
      if (n > 2e3 && n < 2010) return "two thousand " + ONES[n % 100];
      if (n % 100 === 0) return cardinal(n / 100) + " hundred";
      if (n % 100 < 10) return cardinal(Math.floor(n / 100)) + " oh " + ONES[n % 100];
      return cardinal(Math.floor(n / 100)) + " " + cardinal(n % 100);
    }
    return n < 1e12 ? cardinal(n) : Array.from(d, (c) => ONES[+c]).join(" ");
  });
}
function morphFallback(word, cmu) {
  const n = word.length, tryBase = (b, suf) => cmu[b] ? cmu[b] + " " + suf : null, dbl = (b) => b.length >= 2 && b[b.length - 1] === b[b.length - 2];
  let r;
  if (n > 4 && word.endsWith("ing")) {
    const b = word.slice(0, -3);
    if ((r = tryBase(b, "IH0 NG")) || dbl(b) && (r = tryBase(b.slice(0, -1), "IH0 NG")) || (r = tryBase(b + "e", "IH0 NG"))) return r;
  }
  if (n > 3 && word.endsWith("ed")) {
    const b = word.slice(0, -2);
    if ((r = tryBase(b, "D")) || dbl(b) && (r = tryBase(b.slice(0, -1), "D")) || (r = tryBase(word.slice(0, -1), "D"))) return r;
  }
  if (n > 2 && word.endsWith("s")) {
    if (n > 4 && word.endsWith("ies") && (r = tryBase(word.slice(0, -3) + "y", "Z"))) return r;
    if (n > 3 && word.endsWith("es") && (r = tryBase(word.slice(0, -2), "IH0 Z"))) return r;
    if (r = tryBase(word.slice(0, -1), "Z")) return r;
  }
  if (n > 3 && word.endsWith("er")) {
    const b = word.slice(0, -2);
    if ((r = tryBase(b, "ER0")) || dbl(b) && (r = tryBase(b.slice(0, -1), "ER0"))) return r;
  }
  if (n > 3 && word.endsWith("ly")) {
    if ((r = tryBase(word.slice(0, -2), "L IY0")) || n > 4 && word[n - 3] === "i" && (r = tryBase(word.slice(0, -3) + "y", "L IY0"))) return r;
  }
  if (n > 4 && word.endsWith("est") && (r = tryBase(word.slice(0, -3), "AH0 S T"))) return r;
  return null;
}
function letterRules(word) {
  const out = [];
  for (let i = 0; i < word.length; ) {
    const hit = DIGRAPH_RULES.find(([p]) => word.startsWith(p, i));
    if (hit) {
      out.push(...hit[1]);
      i += hit[0].length;
    } else {
      const a = LETTER_RULES[word[i]];
      if (a) out.push(...a);
      i++;
    }
  }
  return out;
}
var SIBILANT = /* @__PURE__ */ new Set(["S", "Z", "SH", "ZH", "CH", "JH"]);
var VOICELESS = /* @__PURE__ */ new Set(["P", "T", "K", "F", "TH"]);
function createEnglishG2p({ cmudict, homographs = null }) {
  const cmu = cmudict;
  function wordToArpabet(word, prev, next) {
    if (OVERRIDES[word]) return OVERRIDES[word].split(" ");
    if (homographs && homographs[word]) {
      const [p1, p2, pos] = homographs[word], verbish = VERB_CUES.has(prev || "");
      const pick = pos === "V" ? verbish ? p1 : p2 : pos === "VBD" ? PAST_CUES.has(prev || "") ? p2 : p1 : pos === "VBN" ? next === "to" ? p2 : p1 : verbish ? p2 : p1;
      return pick.trim().split(" ");
    }
    if (cmu[word]) return cmu[word].split(" ");
    const m = /^(.+)'(s|ll|d|ve|re)$/.exec(word);
    if (m && cmu[m[1]]) {
      const base = cmu[m[1]].split(" "), last = base[base.length - 1].replace(/\d/, "");
      const suf = m[2] === "s" ? SIBILANT.has(last) ? ["IH0", "Z"] : VOICELESS.has(last) ? ["S"] : ["Z"] : { ll: ["AH0", "L"], d: ["D"], ve: ["V"], re: ["ER0"] }[m[2]];
      return [...base, ...suf];
    }
    const bare = word.replace(/'/g, "");
    if (bare !== word && cmu[bare]) return cmu[bare].split(" ");
    const mf = morphFallback(bare, cmu);
    return mf ? mf.split(" ") : letterRules(bare);
  }
  function wordToIpa(arpa) {
    const out = [];
    for (let i = 0; i < arpa.length; i++) {
      const m = /^([A-Z]+)(\d)?$/.exec(arpa[i]);
      if (!m) continue;
      const base = m[1], stress = m[2] === void 0 ? -1 : +m[2];
      if (base === "AA" && arpa[i + 1] === "R") {
        out.push(["\u0251\u02D0\u0279", stress]);
        i++;
        continue;
      }
      if (base === "ER" && stress === 1) {
        out.push(["\u025C\u02D0", stress]);
        continue;
      }
      if (base === "AH" && stress === 0) {
        out.push(["\u0259", stress]);
        continue;
      }
      if (ARPA2IPA[base]) out.push([ARPA2IPA[base], stress]);
    }
    return out;
  }
  function phonemize(text) {
    let t = expandNumbers(String(text)).normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[‘’]/g, "'").replace(/[-‐-―]/g, " ");
    t = t.replace(/[^ a-z'.,?!;:]/g, " ").replace(/i\.e\./g, "that is").replace(/e\.g\./g, "for example");
    const raw = t.match(/[a-z']+|[.,?!;:]/g) || [];
    const tokens = [], prosody = [];
    let needSpace = false, prev = "";
    for (let ri = 0; ri < raw.length; ri++) {
      let w = raw[ri];
      if (PUNCT.has(w)) {
        if (w !== ";" && w !== ":") {
          tokens.push(w);
          prosody.push([0, 0, 1]);
        }
        needSpace = true;
        continue;
      }
      w = w.replace(/^'+|'+$/g, "");
      if (!w) continue;
      if (needSpace) {
        tokens.push(" ");
        prosody.push([0, 0, 0]);
      }
      let ipas = wordToIpa(wordToArpabet(w, prev, raw[ri + 1]));
      if (FUNCTION_WORDS.has(w)) ipas = ipas.map(([ipa, s]) => [ipa, s >= 1 ? 0 : s]);
      const count = ipas.reduce((a, [ipa]) => a + Array.from(ipa).length, 0);
      for (const [ipa, s] of ipas) {
        const a2 = s === 1 ? 2 : s === 2 ? 1 : 0;
        if (s === 1) {
          tokens.push("\u02C8");
          prosody.push([0, a2, count]);
        } else if (s === 2) {
          tokens.push("\u02CC");
          prosody.push([0, a2, count]);
        }
        for (const ch of ipa) {
          tokens.push(ch);
          prosody.push([0, a2, count]);
        }
      }
      needSpace = true;
      prev = w;
    }
    return { tokens, prosody };
  }
  return { phonemize, wordToArpabet };
}

// src/sources/removed.ts
var removedWhy = (lib) => lib === "voice" ? _t("\u5C0F\u6708\u76F8\u88AB\u4F60\u5220\u4E86") : _t("\u4E50\u5668\u97F3\u8272\u5E93\u88AB\u4F60\u5220\u4E86");
var packPlan = (ready, removed) => ready ? "use" : removed ? "removed" : "download";

// src/singer/worker.ts
var wasmMems = /* @__PURE__ */ new Set();
var captureMem = (imports, instance) => {
  for (const ns2 of Object.values(imports ?? {})) if (ns2 && typeof ns2 === "object") {
    for (const v of Object.values(ns2)) if (v instanceof WebAssembly.Memory) wasmMems.add(v);
  }
  const ex = instance?.exports;
  if (ex) {
    for (const v of Object.values(ex)) if (v instanceof WebAssembly.Memory) wasmMems.add(v);
  }
};
{
  const WA = WebAssembly;
  const inst = WA.instantiate, stream = WA.instantiateStreaming;
  WA.instantiate = async function(src, imports) {
    const r = await inst.call(WebAssembly, src, imports);
    captureMem(imports, r.instance ?? r);
    return r;
  };
  if (stream) WA.instantiateStreaming = async function(src, imports) {
    const r = await stream.call(WebAssembly, src, imports);
    captureMem(imports, r.instance);
    return r;
  };
}
var heapNow = () => {
  let n = 0;
  for (const m of wasmMems) n += m.buffer.byteLength;
  return n;
};
var baseHeap;
var memNow = () => ({ wasm: heapNow(), cache: speech.used, base: baseHeap });
var worldBase = () => new URL("../vendor/world/", import.meta.url);
var hostFiles = false;
var needSeq = 0;
var needs = /* @__PURE__ */ new Map();
function hostGet(path, sha2562) {
  return new Promise((ok, fail) => {
    const nid = ++needSeq;
    needs.set(nid, { ok, fail });
    self.postMessage({ type: "need", nid, path, ...sha2562 ? { sha256: sha2562 } : {} });
  });
}
var hostPacks = /* @__PURE__ */ new Map();
var bases = ["https://fangzhangmnm.github.io/pwa-models"];
var blocked = false;
var store = createPackStore({ packs: PACKS });
async function ensurePacks(slugs, what, say) {
  if (hostFiles) {
    for (const slug of slugs) {
      if (hostPacks.has(slug)) continue;
      say(_t("\u4ECE\u6587\u4EF6\u5939\u8BFB{what}", { what }));
      const blobs = [];
      for (const c of PACKS[slug].manifest.chunks) blobs.push(new Blob([await hostGet(`pwa-models/packs/${slug}/${c.name}`, c.sha256)]));
      hostPacks.set(slug, blobs);
    }
    return;
  }
  const plan = packPlan((await store.status(slugs)).every((s) => s.ready), blocked);
  if (plan === "use") return;
  if (plan === "removed") throw new Error(removedWhy("voice"));
  let last = null;
  for (const base of bases) {
    try {
      await store.download(slugs, base, (p) => say(_t("\u4E0B\u8F7D{what}\uFF08{e6} MB\uFF0C\u53EA\u4E0B\u8FD9\u4E00\u6B21\uFF09{total}%", { what, e6: (p.total / 1e6).toFixed(0), total: Math.floor(p.done / p.total * 100) })));
      return;
    } catch (e) {
      last = e;
    }
  }
  throw new Error(_t("{what}\u4E0B\u8F7D\u4E0D\u4E0B\u6765\uFF08\u8BD5\u8FC7 {p}\uFF09\uFF1A{Error}\u3002\u53EF\u4EE5\u5728\u8BBE\u7F6E\u91CC\u6362\u6A21\u578B\u6765\u6E90\uFF0C\u6216\u4ECE\u672C\u673A\u6587\u4EF6\u5BFC\u5165", { what, p: bases.join("\u3001"), Error: last?.message ?? last }));
}
async function chunksOf(slug) {
  if (hostFiles) {
    const b = hostPacks.get(slug);
    if (!b) throw new Error("pack-missing");
    return b;
  }
  try {
    return await store.chunks(slug);
  } catch (e) {
    if (/^pack-corrupt/.test(e?.message ?? "")) throw new Error(_t("\u7F13\u5B58\u91CC\u7684\u5C0F\u6708\u76F8\u6A21\u578B\u548C\u6E05\u5355\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09\uFF0C\u574F\u7684\u90A3\u4E00\u7247\u5DF2\u7ECF\u4E22\u6389\uFF1A\u518D\u5531\u4E00\u6B21\u4F1A\u91CD\u65B0\u4E0B\u8F7D\uFF08{Error}\uFF09", { Error: e.message }));
    throw e;
  }
}
async function packFile(slug, path) {
  const files = PACKS[slug].manifest.files;
  const f = files.find((x) => x.path === path);
  if (!f) throw new Error(_t("{slug}: \u5305\u91CC\u6CA1\u6709 {path}", { slug, path }));
  const piece = new Blob(await chunksOf(slug)).slice(f.offset, f.offset + f.bytes);
  if (!path.endsWith(".gz")) return new Uint8Array(await piece.arrayBuffer());
  return new Uint8Array(await new Response(piece.stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}
var packJson = async (slug, path) => JSON.parse(new TextDecoder().decode(await packFile(slug, path)));
var SR = 22050;
var HOP = 256;
var engine = null;
var speech = new SpeechCache(32e6);
var SPEECH_DB = CACHE_DBS.speech;
var SPEECH_FORMAT = 1;
var diskBudget = 512e6;
var storeP = null;
var speechStore = () => storeP ??= (diskBudget <= 0 ? Promise.resolve(null) : openSpeechStore(SPEECH_DB, diskBudget)).then((st) => {
  st?.setBudget(diskBudget);
  return st;
}).catch(() => null);
var hex16 = async (bytes) => {
  try {
    return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return new Sha256().update(bytes).hex().slice(0, 16);
  }
};
var bootMs = {};
async function loadEngine(say) {
  const V = SINGER.voice, JA = SINGER.lang.ja;
  let tk = performance.now();
  const lap = (name) => {
    const t = performance.now();
    bootMs[name] = Math.round(t - tk);
    tk = t;
  };
  await ensurePacks([V, SINGER.runtime, JA], _t("\u5C0F\u6708\u76F8"), say);
  lap("packs");
  const store2 = await speechStore();
  say(_t("\u52A0\u8F7D piper \u5F15\u64CE"));
  const ort = ort_wasm_bundle_min_exports;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmBinary = await packFile(SINGER.runtime, "ort-wasm-simd-threaded.wasm.gz");
  lap("ortWasm");
  say(_t("\u52A0\u8F7D\u5C0F\u6708\u76F8\u7684\u6A21\u578B"));
  const sess = await ort.InferenceSession.create(await packFile(V, "model.onnx"), { executionProviders: ["wasm"], graphOptimizationLevel: "disabled" });
  ort.env.wasm.wasmBinary = void 0;
  lap("session");
  say(_t("\u52A0\u8F7D\u65E5\u8BED\u524D\u7AEF"));
  const Module2 = await ojt_default({ wasmBinary: await packFile(JA, "ja/ojt.wasm.gz"), print: () => {
  }, printErr: () => {
  }, ...hostFiles ? { locateFile: (p) => p } : {} });
  mountDictionaryBytes(Module2, { sys: await packFile(JA, "ja/sys.dic.gz"), matrix: await packFile(JA, "ja/matrix.bin.gz"), char: await packFile(JA, "ja/char.bin.gz"), unk: await packFile(JA, "ja/unk.dic.gz") });
  const ja = createJaFrontend(Module2, "/dic", { naniModel: await packJson(JA, "ja/nani-model.json.gz") });
  lap("jaFrontend");
  const config = await packJson(V, "config.json");
  let zh = null;
  const ensureZh = async (say2) => {
    if (zh) return;
    const ZH = SINGER.lang.zh;
    await ensurePacks([ZH], _t("\u4E2D\u6587\u524D\u7AEF"), say2);
    zh = createChineseG2p({ single: await packJson(ZH, "zh/pinyin_single.tone3.json.gz"), phrases: await packJson(ZH, "zh/pinyin_phrases.tone3.json.gz") });
  };
  let en2 = null;
  const ensureEn = async (say2) => {
    if (en2) return;
    const EN = SINGER.lang.en;
    await ensurePacks([EN], _t("\u82F1\u6587\u8BCD\u5178"), say2);
    en2 = makeEnglishFront({ g2p: createEnglishG2p({ cmudict: await packJson(EN, "en/cmudict_data.json.gz"), homographs: await packJson(EN, "en/homographs.json.gz") }), encodeTokens, idMap: config.phoneme_id_map });
  };
  async function run(ids, pros, { noiseScale = 0.667, lengthScale = 1.5, noiseW = 0.5, override = null, lang: lang2 = "ja", preset = 0 } = {}) {
    const n = ids.length, big = (v) => BigInt(v), lid = config.language_id_map?.[lang2] ?? 0;
    const feeds = {
      input: new ort.Tensor("int64", BigInt64Array.from(ids, big), [1, n]),
      input_lengths: new ort.Tensor("int64", BigInt64Array.from([big(n)]), [1]),
      scales: new ort.Tensor("float32", Float32Array.from([noiseScale, lengthScale, noiseW]), [3]),
      lid: new ort.Tensor("int64", BigInt64Array.from([big(lid)]), [1]),
      prosody_features: new ort.Tensor("int64", BigInt64Array.from(pros.flat(), big), [1, n, 3]),
      speaker_embedding: new ort.Tensor("float32", new Float32Array(256), [1, 256]),
      speaker_embedding_mask: new ort.Tensor("int64", BigInt64Array.from([0n]), [1, 1])
    };
    if (sess.inputNames.includes("preset")) feeds.preset = new ort.Tensor("int64", BigInt64Array.from([big(preset)]), [1]);
    if (sess.inputNames.includes("dur_override")) feeds.dur_override = new ort.Tensor("float32", override ? Float32Array.from(override) : new Float32Array(n), [1, n]);
    const r = await sess.run(feeds);
    return { audio: new Float32Array(r.output.data), durations: Float32Array.from(r.durations.data) };
  }
  const piper = speech.wrapPiper({
    SR,
    HOP,
    run,
    phonemize: (text) => {
      const r = ja.phonemize(text);
      return { tokens: r.tokens, prosody: r.prosody, ...encodeTokens(r.tokens, r.prosody, config.phoneme_id_map) };
    },
    phonemizeZh: (text) => {
      const t = zh.phonemize(text), e = zh.encode(text, config.phoneme_id_map);
      return { tokens: t.tokens, prosody: t.prosody, ids: e.ids, pros: e.pros };
    },
    encode: (tokens, prosody) => encodeTokens(tokens, prosody, config.phoneme_id_map),
    phonemizeEnWords: (words) => en2.phonemizeWords(words)
  });
  say(_t("\u52A0\u8F7D WORLD"));
  let createWorld, worldBytes;
  if (hostFiles) {
    const js = await hostGet("vendor/world/world.mjs"), url = URL.createObjectURL(new Blob([js], { type: "text/javascript" }));
    try {
      ({ default: createWorld } = await import(
        /* @vite-ignore */
        url
      ));
    } finally {
      URL.revokeObjectURL(url);
    }
    worldBytes = await hostGet("vendor/world/world.wasm");
  } else {
    ({ default: createWorld } = await import(
      /* @vite-ignore */
      new URL("world.mjs", worldBase()).href
    ));
    const wasm = await fetch(new URL("world.wasm", worldBase()));
    if (!wasm.ok) throw new Error(`WORLD: HTTP ${wasm.status}`);
    worldBytes = new Uint8Array(await wasm.arrayBuffer());
  }
  if (store2) speech.attachStore(store2, `${PACKS[V].packId.slice(0, 16)}:${PACKS[SINGER.runtime].packId.slice(0, 16)}:w${await hex16(worldBytes)}:v${SPEECH_FORMAT}`);
  const world = speech.wrapWorld(wrapWorld(await createWorld(hostFiles ? { locateFile: (p) => p, instantiateWasm: (imports, done2) => {
    void WebAssembly.instantiate(worldBytes, imports).then((r) => done2(r.instance));
    return {};
  } } : { wasmBinary: worldBytes })));
  lap("world");
  baseHeap = heapNow();
  return { piper, world, ensureZh, ensureEn, zhReady: () => !!zh, presetDefault: config.preset_default ?? {} };
}
var cancelled = /* @__PURE__ */ new Set();
self.onmessage = async (ev) => {
  const q2 = ev.data;
  if (q2.type === "init") {
    hostFiles = q2.hostFiles;
    return;
  }
  if (q2.type === "file") {
    const n = needs.get(q2.nid);
    needs.delete(q2.nid);
    if (!n) return;
    if (q2.bytes) n.ok(new Uint8Array(q2.bytes));
    else n.fail(new Error(q2.error ?? _t("\u4E3B\u7EBF\u7A0B\u6CA1\u8BFB\u5230\u8FD9\u4E2A\u6587\u4EF6")));
    return;
  }
  const post = (m, transfer = []) => self.postMessage(m, transfer);
  if (q2.type === "cancel") {
    cancelled.add(q2.id);
    return;
  }
  if (q2.type === "cache") {
    try {
      if (q2.diskBytes !== void 0) {
        diskBudget = q2.diskBytes;
        (await storeP)?.setBudget(diskBudget);
      }
      const st = await speechStore();
      if (q2.op === "clear") {
        await st?.clear();
        speech.clear();
      }
      post({ type: "cache", id: q2.id, disk: st ? await st.info() : null });
    } catch (err) {
      post({ type: "error", id: q2.id, message: err?.message ?? String(err) });
    }
    return;
  }
  if (q2.type === "read") {
    try {
      const e = engine ? await engine.catch(() => null) : null;
      if (!e || q2.lang === "en" || q2.lang === "zh" && !e.zhReady()) {
        post({ type: "read", id: q2.id, ready: false, labels: null, said: [] });
        return;
      }
      post({ type: "read", id: q2.id, ready: true, ...readingCore({ score: q2.score, text: q2.text, lang: q2.lang, piper: e.piper }) });
    } catch (err) {
      post({ type: "error", id: q2.id, message: err?.message ?? String(err) });
    }
    return;
  }
  if (q2.type === "warm") {
    const say2 = (stage) => post({ type: "progress", id: q2.id, stage });
    try {
      if (q2.models?.length) bases = q2.models;
      blocked = !!q2.blocked;
      if (q2.diskBytes !== void 0) diskBudget = q2.diskBytes;
      if (!engine) engine = loadEngine(say2).catch((e) => {
        engine = null;
        throw e;
      });
      await engine;
      post({ type: "done", id: q2.id, samples: new Float32Array(0), sr: SR, mem: memNow(), ms: { load: 0, sing: 0, ...Object.keys(bootMs).length ? { boot: bootMs } : {} } });
      bootMs = {};
    } catch (err) {
      post({ type: "error", id: q2.id, message: err?.message ?? String(err) });
    }
    return;
  }
  if (q2.type !== "sing") return;
  const say = (stage) => post({ type: "progress", id: q2.id, stage });
  const check = () => {
    if (cancelled.has(q2.id)) {
      cancelled.delete(q2.id);
      throw new Error("cancelled");
    }
  };
  try {
    const t0 = performance.now();
    if (q2.models?.length) bases = q2.models;
    blocked = !!q2.blocked;
    if (q2.cacheBytes !== void 0) speech.setBudget(q2.cacheBytes);
    if (q2.diskBytes !== void 0) {
      diskBudget = q2.diskBytes;
      (await storeP)?.setBudget(diskBudget);
    }
    if (!engine) engine = loadEngine(say).catch((e2) => {
      engine = null;
      throw e2;
    });
    const e = await engine;
    if (q2.lang === "zh") await e.ensureZh(say);
    if (q2.lang === "en") await e.ensureEn(say);
    const t1 = performance.now();
    say(_t("\u5C0F\u6708\u76F8\u5728\u5531"));
    const breath = q2.breath ?? false;
    const preset = e.presetDefault[q2.lang] ?? 0;
    let runs = 0;
    const piper = { ...e.piper, run: async (ids, pros, o) => {
      check();
      say(runs++ === 0 ? _t("\u5FF5\uFF081/2\uFF09") : _t("\u5FF5\uFF082/2\uFF09"));
      const r2 = await e.piper.run(ids, pros, o);
      check();
      return r2;
    } };
    const names = { f0: _t("\u5206\u6790\uFF081/3 \u97F3\u9AD8\uFF09"), sp: _t("\u5206\u6790\uFF082/3 \u8C31\u5305\u7EDC\uFF09"), ap: _t("\u5206\u6790\uFF083/3 \u6C14\u58F0\uFF09"), cached: _t("\u5206\u6790\uFF08\u7F13\u5B58\uFF09") };
    const world = { ...e.world, analyze: (x, fs2, o) => e.world.analyze(x, fs2, o, { stage: (n) => say(names[n] ?? n), check }), synth: (a) => {
      check();
      say(_t("\u5408\u6210"));
      return e.world.synth(a);
    } };
    check();
    const r = await singCore({ score: q2.score, text: q2.text, tempo: q2.tempo, lang: q2.lang, atlas: "off", breath, preset, piper, world, loadAtlas: null, opt: q2.opt ?? {}, only: q2.only ?? null });
    check();
    const samples = q2.raw || q2.only ? Float32Array.from(r.y) : r.sung;
    post({ type: "done", id: q2.id, samples, sr: r.SR, mem: memNow(), ms: { load: t1 - t0, sing: performance.now() - t1, ...Object.keys(bootMs).length ? { boot: bootMs } : {} } }, [samples.buffer]);
    bootMs = {};
  } catch (err) {
    cancelled.delete(q2.id);
    engine = engine && await engine.catch(() => null) ? engine : null;
    post({ type: "error", id: q2.id, message: err?.message ?? String(err) });
  }
};
/*! Bundled license information:

@internal/read-aloud/backend/piper-plus/vendor/onnxruntime-web/ort.wasm.bundle.min.mjs:
  (*!
   * ONNX Runtime Web v1.30.0
   * Copyright (c) Microsoft Corporation. All rights reserved.
   * Licensed under the MIT License.
   *)
*/
//# sourceMappingURL=singer-worker-f6e87b39d4ac.mjs.map
