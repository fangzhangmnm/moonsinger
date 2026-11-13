export type Lang = "zh" | "en";
export type Entry = {
    en: string;
    ja?: string;
};
export declare const S: {
    readonly "\u6B63\u5728\u6838\u5BF9\u7F51\u76D8\u4E0A\u7684\u7248\u672C\u2026": {
        readonly en: "Checking the version on OneDrive…";
    };
    readonly 先离线用: {
        readonly en: "Work offline for now";
    };
    readonly 网盘没连上: {
        readonly en: "OneDrive isn't connected";
    };
    readonly 登录过期了: {
        readonly en: "Sign-in expired";
    };
    readonly 现在没有网络: {
        readonly en: "No network right now";
    };
    readonly 网盘没有回应: {
        readonly en: "OneDrive isn't responding";
    };
    readonly 重新登录: {
        readonly en: "Sign in again";
    };
    readonly 离线继续: {
        readonly en: "Continue offline";
    };
    readonly "\u79BB\u7EBF \u00B7 \u8FD8\u6709 {n} \u4EFD\u6CA1\u4F20\u4E0A\u53BB": {
        readonly en: "Offline · {n} not uploaded yet";
    };
    readonly 离线: {
        readonly en: "Offline";
    };
    readonly "\u5DF2\u8FDE\u4E0A\u7F51\u76D8\uFF0C\u6B63\u5728\u540C\u6B65\u2026": {
        readonly en: "Connected to OneDrive, syncing…";
    };
    readonly 看列表: {
        readonly en: "See the list";
    };
    readonly 重新连接: {
        readonly en: "Reconnect";
    };
    readonly "\u5C0F\u6708\u76F8\uFF08\u3064\u304F\u3088\u307F\u3061\u3083\u3093\uFF09\u7684\u7F72\u540D\u4E0E\u4F7F\u7528\u6761\u6B3E": {
        readonly en: "Tsukuyomi-chan (つくよみちゃん) credits and terms of use";
    };
    readonly "\u539F\u6587\uFF08\u4EE5\u6B64\u4E3A\u51C6\uFF09": {
        readonly en: "Original text (authoritative)";
    };
    readonly "\u4E2D\u6587\u8BD1\u6587\uFF08\u4EC5\u4F9B\u9605\u8BFB\uFF0C\u4EE5\u65E5\u6587\u539F\u6587\u4E3A\u51C6\uFF09": {
        readonly en: "Chinese translation (for reference only; the Japanese original governs)";
    };
    readonly "\u4E50\u5668\u76EE\u5F55\u7684\u56FE\u6807\uFF08\u7B2C\u4E09\u65B9\uFF0C{n} \u4E2A\uFF09": {
        readonly en: "Instrument catalog icons (third-party, {n})";
    };
    readonly "\uFF1B\u6539\u52A8\uFF1A{modified}": {
        readonly en: "; modified: {modified}";
    };
    readonly "\u590D\u5236\u4E86 {n} \u6761": {
        readonly en: "Copied {n} {n|entry|entries}";
    };
    readonly "\u590D\u5236\u4E0D\u4E86\uFF08\u6D4F\u89C8\u5668\u4E0D\u7ED9\u526A\u8D34\u677F\uFF09\uFF1A\u5DF2\u9009\u4E2D\uFF0C\u957F\u6309\u590D\u5236": {
        readonly en: "Can't copy (the browser won't allow clipboard access): text selected, long-press to copy";
    };
    readonly "\u4E0B\u8F7D\u4E86 {name}": {
        readonly en: "Downloaded {name}";
    };
    readonly "MoonSinger \u8BCA\u65AD\u65E5\u5FD7": {
        readonly en: "MoonSinger diagnostic log";
    };
    readonly 分享没成: {
        readonly en: "Sharing didn't work";
    };
    readonly "\uFF08\u7A7A\uFF09": {
        readonly en: "(empty)";
    };
    readonly 清空了: {
        readonly en: "Cleared";
    };
    readonly "MusicXML \u4E50\u8C31\uFF08MoonSinger \u5B58\u6210 .mxl\uFF09": {
        readonly en: "MusicXML score (MoonSinger saves as .mxl)";
    };
    readonly "\u8C31 / \u6B4C\u540D / \u4F5C\u8005\u680F": {
        readonly en: "The score / title / credits";
    };
    readonly 纸: {
        readonly en: "Sheets";
    };
    readonly "\u58F0\u90E8 / \u4E50\u5668": {
        readonly en: "Parts / instruments";
    };
    readonly 混音: {
        readonly en: "The mix";
    };
    readonly 封面: {
        readonly en: "The cover";
    };
    readonly "{p}\uFF1A{what}\u6539\u4E0D\u4E86": {
        readonly en: "{p}: {what} can't be changed";
    };
    readonly 撤销: {
        readonly en: "Undo";
    };
    readonly 重做: {
        readonly en: "Redo";
    };
    readonly 锁着: {
        readonly en: "Locked";
    };
    readonly "\u89E3\u9501\uFF0C\u63A5\u7740\u6539\u8FD9\u4E00\u9996\u3002\u653E\u7740\u4E00\u5929\u4E0D\u52A8\u4F1A\u81EA\u5DF1\u9501\u4E0A\uFF1B\u968F\u65F6\u80FD\u5728\u4E09\u6761\u6760\u91CC\u300C\u9501\u4E0A\u300D": {
        readonly en: "Unlock and keep editing this song. It locks itself after a day untouched; you can lock it any time from the ☰ menu";
    };
    readonly 接着改: {
        readonly en: "Keep editing";
    };
    readonly "\u5148\u628A\u73B0\u5728\u7684\u6837\u5B50\u5B58\u4E00\u7248\u7559\u5E95\uFF08\u6536\u5728\u6B4C\u5E93\u91CC\u8FD9\u9996\u6B4C\u7684\u5361\u7247\u4E0B\u9762\uFF09\uFF0C\u518D\u89E3\u9501\u63A5\u7740\u6539": {
        readonly en: "Save a version of it as it is now (kept under this song’s card in the library), then unlock and keep editing";
    };
    readonly 存一版再改: {
        readonly en: "Save a version, then edit";
    };
    readonly "{dir}/\uFF08\u6574\u4E2A\u6587\u4EF6\u5939\uFF09": {
        readonly en: "{dir}/ (whole folder)";
    };
    readonly "\uFF08\u6839\u6587\u4EF6\u5939\uFF09": {
        readonly en: "(root folder)";
    };
    readonly 歌库里还没有歌: {
        readonly en: "No songs in the library yet";
    };
    readonly "\u5DF2\u5BFC\u51FA {count} \u9996\u5230 {fileName}": {
        readonly en: "Exported {count} {count|song|songs} to {fileName}";
    };
    readonly " \u7B49 {n} \u9879": {
        readonly en: " and {n} more";
    };
    readonly "\u53EA\u5BFC\u51FA\u4E86 {count} \u9996\u5230 {fileName}\u3002\u8FD9\u4E9B\u6CA1\u62FF\u5230\uFF1A{names}": {
        readonly en: "Only exported {count} {count|song|songs} to {fileName}. Couldn't get: {names}";
    };
    readonly "\u6CA1\u80FD\u5BFC\u51FA\uFF1A{names}": {
        readonly en: "Couldn't export: {names}";
    };
    readonly 删除全部本地数据: {
        readonly en: "Delete all local data";
    };
    readonly "\u5220\u9664\u8FD9\u53F0\u8BBE\u5907\u4E0A MoonSinger \u7684\u5168\u90E8\u672C\u5730\u6570\u636E\uFF1A\u6B4C\u5E93\u91CC\u7684\u6B4C\uFF08\u672C\u673A\u526F\u672C\uFF09\u3001\u5FF5\u7F13\u5B58\u3001\u5C01\u9762\u7F13\u5B58\u3001\u8BBE\u7F6E\u3001\u8BCA\u65AD\u65E5\u5FD7\uFF1B\u79BB\u7EBF\u58F3\u4E5F\u91CD\u88C5\u3002\u4E91\u7AEF\uFF08OneDrive\uFF09\u4E0A\u7684\u6B4C\u548C\u672C\u673A\u6587\u4EF6\u4E0D\u53D7\u5F71\u54CD\u3002": {
        readonly en: "Deletes all of MoonSinger's local data on this device: songs in the library (local copies), speech cache, cover cache, settings and the diagnostic log; the offline shell is reinstalled too. Songs on OneDrive and files on this device aren't affected.";
    };
    readonly "\u6709 {dirtyN} \u9996\u8FD8\u6CA1\u4F20\u4E0A\u53BB\uFF0C\u4F1A\u4E00\u8D77\u5220\u6389\uFF08\u4E0D\u9020\u9003\u751F\u526F\u672C\uFF09\u3002": {
        readonly en: "{dirtyN} {dirtyN|song hasn't|songs haven't} been uploaded and will be deleted too (no rescue copy is made).";
    };
    readonly "\u6B4C\u5E93\u91CC\u7684\u6B4C\u90FD\u4F20\u4E0A\u53BB\u4E86\u3002": {
        readonly en: "All songs in the library have been uploaded.";
    };
    readonly "\u8FD9\u53F0\u8BBE\u5907\u6CA1\u8FDB\u8FC7\u6B4C\u5E93\u3002": {
        readonly en: "This device has never opened the library.";
    };
    readonly "\u624B\u91CC\u8FD9\u9996\u6539\u8FC7\u8FD8\u6CA1\u5B58\uFF0C\u4E5F\u4F1A\u4E22\u3002": {
        readonly en: "The song you have open has unsaved changes, and those will be lost too.";
    };
    readonly 还原出厂设置: {
        readonly en: "Factory reset";
    };
    readonly 继续: {
        readonly en: "Continue";
    };
    readonly "\u9010\u5B57\u8F93\u5165\u300C{CONSENT_PHRASE}\u300D\u786E\u8BA4\u3002\u8FD9\u4E00\u6B65\u505A\u5B8C app \u4F1A\u91CD\u5F00\u6210\u65B0\u88C5\u7684\u6837\u5B50\u3002": {
        readonly en: "Type “{CONSENT_PHRASE}” exactly to confirm. When this finishes the app reopens as if newly installed.";
    };
    readonly 删除: {
        readonly en: "Delete";
    };
    readonly "\u8F93\u5165\u7684\u4E0D\u4E00\u6837\uFF0C\u4EC0\u4E48\u90FD\u6CA1\u52A8\u3002": {
        readonly en: "That doesn't match. Nothing was changed.";
    };
    readonly 还没删干净: {
        readonly en: "Not fully deleted yet";
    };
    readonly "\u6709 {blocked} \u4E2A\u5E93\u88AB\u522B\u7684\u6807\u7B7E\u9875\u5360\u7740\uFF0C\u5220\u4E0D\u6389\u3002\u5173\u6389\u5176\u4ED6 MoonSinger \u6807\u7B7E\u9875\uFF08\u6216\u522B\u7684\u7A97\u53E3\uFF09\u518D\u6765\u4E00\u6B21\u2014\u2014\u518D\u505A\u4E00\u904D\u662F\u5B89\u5168\u7684\u3002": {
        readonly en: "{blocked} databases are held by another tab and can't be deleted. Close other MoonSinger tabs (or windows) and try again — doing it again is safe.";
    };
    readonly 好: {
        readonly en: "OK";
    };
    readonly 关闭: {
        readonly en: "Close";
    };
    readonly "\u5220\u4E86 {db} \u4E2A\u5E93\u3001{ls} \u4E2A\u952E\uFF0C\u8FD9\u53F0\u8BBE\u5907\u4E0A\u6CA1\u6709\u6B8B\u7559\u3002\u70B9\u300C\u597D\u300D\u91CD\u5F00\u3002": {
        readonly en: "Deleted {db} databases and {ls} keys; nothing is left on this device. Tap OK to reopen.";
    };
    readonly "\u5220\u4E86 {db} \u4E2A\u5E93\u3001{ls} \u4E2A\u952E\uFF1B\u8FD8\u5269 {residue} \u5904\u6B8B\u7559\uFF08\u679A\u4E3E\u4E0D\u5230\u7684\u5E73\u53F0 / \u521A\u88AB\u91CD\u5EFA\uFF09\uFF0C\u91CD\u5F00\u540E\u518D\u505A\u4E00\u904D\u5C31\u6CA1\u4E86\u3002\u70B9\u300C\u597D\u300D\u91CD\u5F00\u3002": {
        readonly en: "Deleted {db} databases and {ls} keys; {residue} leftovers remain (platforms that can't be enumerated / just recreated). Do it once more after reopening and they'll be gone. Tap OK to reopen.";
    };
    readonly "\u8FD9\u6B21\u58F0\u97F3\u8D77\u6765\u65F6\u591A\u7B97\u4E86 {n} ms\uFF1A\u6309\u952E\u53EF\u80FD\u665A\u8FD9\u4E48\u591A": {
        readonly en: "Audio started {n} ms ahead this time: keys may be this late";
    };
    readonly "\u58F0\u97F3\u6392\u7740\u961F\uFF1A\u81F3\u5C11 {qd} ms\uFF08\u91CF\u4E0D\u5230\u5DF2\u7ECF\u4EA4\u51FA\u53BB\u7684\u90A3\u4E00\u622A\uFF09\u00B7 \u70B9\u8FD9\u91CC\u6E05\u6389 \uFF5C \u7B49\u4E3B\u7EBF\u7A0B {q} ms \u00B7 \u5230\u51FA\u58F0 {s} ms \u00B7 \u58F0\u97F3\u5757 \u5E73\u5E38 {t} ms / \u6700\u957F {a} ms": {
        readonly en: "Audio is backed up: at least {qd} ms (it cannot see what was already handed to the device) · tap here to clear it | main-thread wait {q} ms · to sound {s} ms · audio block usual {t} ms / longest {a} ms";
    };
    readonly "\u6309\u952E\u665A\u4E86\uFF1A\u7B49\u4E3B\u7EBF\u7A0B {q} ms \u00B7 \u5230\u51FA\u58F0 {s} ms \u00B7 \u4E3B\u7EBF\u7A0B\u6700\u957F\u505C {st} ms \u00B7 \u58F0\u97F3\u5757 \u5E73\u5E38 {t} ms / \u6700\u957F {a} ms \u00B7 \u6700\u6162\u4E00\u6B65 {slow}\uFF08\u70B9\u4E00\u4E0B\u6536\u8D77\u8FD9\u4E00\u6B21\uFF09": {
        readonly en: "Keys are late: main-thread wait {q} ms · to sound {s} ms · longest main-thread stall {st} ms · audio block usual {t} ms / longest {a} ms · slowest step {slow} (tap to hide this time)";
    };
    readonly "\u624B\u611F\uFF1A\u7B49\u4E3B\u7EBF\u7A0B {q} ms \u00B7 \u5230\u51FA\u58F0 {s} ms \u00B7 \u4E3B\u7EBF\u7A0B\u6700\u957F\u505C {st} ms \u00B7 \u58F0\u97F3\u5757 \u5E73\u5E38 {t} ms / \u6700\u957F {a} ms\uFF08\u70B9\u4E00\u4E0B\u6536\u8D77\u8FD9\u4E00\u6B21\uFF09": {
        readonly en: "Key feel: main-thread wait {q} ms · to sound {s} ms · longest main-thread stall {st} ms · audio block usual {t} ms / longest {a} ms (tap to hide this time)";
    };
    readonly 没有升降号: {
        readonly en: "no sharps or flats";
    };
    readonly "{n} \u4E2A\u5347\u53F7": {
        readonly en: "{n} {n|sharp|sharps}";
    };
    readonly "{n} \u4E2A\u964D\u53F7": {
        readonly en: "{n} {n|flat|flats}";
    };
    readonly "\u81EA\u52A8\uFF08\u73B0\u5728\uFF1A{p}\uFF09": {
        readonly en: "Auto (now: {p})";
    };
    readonly "\u5927\u8C31\u8868\uFF08\u4E0A\u9AD8\u97F3\u4E0B\u4F4E\u97F3\uFF09": {
        readonly en: "Grand staff (treble above, bass below)";
    };
    readonly 不变: {
        readonly en: "unchanged";
    };
    readonly 自动八度线: {
        readonly en: "Auto 8va lines";
    };
    readonly 开: {
        readonly en: "On";
    };
    readonly 关: {
        readonly en: "Off";
    };
    readonly "\u4E00\u4E32\u5F88\u9AD8 / \u5F88\u4F4E\u7684\u97F3\uFF08\u6BCF\u4E2A\u90FD\u8981\u4E09\u6761\u4EE5\u4E0A\u52A0\u7EBF\uFF09\u81EA\u52A8\u753B 8va / 15ma / 8vb\uFF1B\u624B\u5199\u7684\u8BF4\u4E86\u7B97\uFF0C\u4E0D\u5B58\u8FDB\u8C31\u3002\u53EA\u7BA1\u8FD9\u4E00\u6BB5": {
        readonly en: "A run of very high / low notes (three or more ledger lines each) gets 8va / 15ma / 8vb drawn automatically; written ones win; not saved into the score. Only this section";
    };
    readonly "\u4E0D\u53D8\uFF08{k}\uFF09": {
        readonly en: "No change ({k})";
    };
    readonly "\u548C\u5F26\u7EA7\u6570\u4ECE do \u6570\uFF081 = do\uFF09": {
        readonly en: "Chord degrees count from do (1 = do)";
    };
    readonly "{k} \u5927\u8C03": {
        readonly en: "{k} major";
    };
    readonly "\u548C\u5F26\u7EA7\u6570\u4ECE la \u6570\uFF08a \u5C0F\u8C03\u91CC Am = i\uFF09\uFF1B\u97F3\u548C\u5347\u964D\u53F7\u4E0D\u53D8": {
        readonly en: "Chord degrees count from la (in A minor, Am = i); notes and accidentals stay the same";
    };
    readonly "{k} \u5C0F\u8C03": {
        readonly en: "{k} minor";
    };
    readonly "\u4E0D\u53D8\uFF08{t}\uFF09": {
        readonly en: "No change ({t})";
    };
    readonly "\u5176\u4ED6\u2026\uFF08\u81EA\u5DF1\u5199\uFF09": {
        readonly en: "Other… (type it)";
    };
    readonly "\u8FD9\u5F20\u7EB8\u5F00\u5934\uFF1A\u4ECE\u5934\u5F00\u59CB\u7684\u8C31\u53F7 / \u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\u3002\u53EA\u7BA1\u8FD9\u4E00\u4E2A\u58F0\u90E8\u8FD9\u4E00\u6BB5\uFF08\u5F00\u5934\u7684\u901F\u5EA6\u6574\u5F20\u7EB8\u4E00\u8D77\uFF09\u3002": {
        readonly en: "Start of this sheet: the clef / key / time / tempo it starts with. Only for this part in this section (the starting tempo applies to the whole sheet).";
    };
    readonly "\u4ECE\u8FD9\u91CC\u8D77\u7684\u53D8\u5316\uFF08\u300C\u4E0D\u53D8\u300D= \u8DDF\u524D\u9762\u4E00\u6837\uFF09\u3002": {
        readonly en: "Changes from here on (“No change” = same as before).";
    };
    readonly 谱号: {
        readonly en: "Clef";
    };
    readonly "\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8": {
        readonly en: "Display only; pitches don’t change";
    };
    readonly 调号: {
        readonly en: "Key";
    };
    readonly "\u6539\u8C03\u53F7 = \u5B83\u7BA1\u7684\u97F3\u6309\u65B0\u8C03\u53F7\u62FC\u5199\uFF0C\u97F3\u9AD8\u4E0D\u53D8": {
        readonly en: "Changing the key respells the notes it governs; pitches don’t change";
    };
    readonly 拍号: {
        readonly en: "Time";
    };
    readonly 速度: {
        readonly en: "Speed";
    };
    readonly "\u6253\u5F00\u901F\u5EA6\u6846\uFF1A\u62E8\u901F\u5EA6\u3001\u9009\u901F\u5EA6\u8BCD\u3001\u770B\u5C0F\u8282\u62CD\u5668\uFF0C\u6309\u300C\u786E\u5B9A\u300D\u624D\u5199\u8FDB\u8C31": {
        readonly en: "Open the tempo box: dial the tempo, pick a tempo word, watch the metronome; nothing is written until you press OK";
    };
    readonly "\u4E0D\u53D8\uFF08\u2669={n}\uFF09\u00B7 \u5728\u8FD9\u91CC\u6362\u2026": {
        readonly en: "No change (♩={n}) · change it here…";
    };
    readonly 删掉这里的变化: {
        readonly en: "Remove the changes here";
    };
    readonly "\u300C{name}\u300D\u7684\u8C31\uFF08\u6574\u9996\u90FD\u7B97\uFF09": {
        readonly en: "“{name}” staff (whole song)";
    };
    readonly 分解和弦: {
        readonly en: "Broken chords";
    };
    readonly 认: {
        readonly en: "Read";
    };
    readonly 不认: {
        readonly en: "Ignored";
    };
    readonly "\u8BA4\uFF0C\u53E0\u7740\u7684\u6298\u53E0\u6210\u548C\u5F26\u540D": {
        readonly en: "Read; fold stacked chords into names";
    };
    readonly "\u62C6\u5F00\u5F39\u7684\u548C\u5F26\uFF08\u4E00\u62CD / \u534A\u5C0F\u8282 / \u4E00\u5C0F\u8282\u91CC\u7684\u97F3\u51D1\u6210\u4E00\u4E2A\u548C\u5F26\uFF09\u8981\u4E0D\u8981\u6807\u7EA7\u6570\uFF1B\u53E0\u5728\u4E00\u8D77\u7684\u548C\u5F26\u7167\u65E7\u6807\u3002\u300C\u6298\u53E0\u300D= \u7B80\u8C31\u91CC\u53E0\u7740\u7684\u548C\u5F26\u5199\u6210\u548C\u5F26\u540D\uFF08\u7167\u540D\u5B57\u7684\u6807\u51C6\u6392\u6CD5\u8FD8\u539F\u5F97\u56DE\u624D\u6298\uFF0C\u4E0D\u7136\u7167\u5199\u6570\u5B57\uFF09": {
        readonly en: "Label chords played as broken notes (a beat, half a bar or a whole bar adding up to a chord); stacked chords are labeled either way “Fold” = in numbered notation, stacked chords are written as a chord name (only when the name’s standard voicing gives back exactly these notes; otherwise the numbers stay).";
    };
    readonly 合租: {
        readonly en: "Shared staff";
    };
    readonly "\u6709\u522B\u7684\u58F0\u90E8\u6302\u5728\u8FD9\u4E00\u884C\u4E0A\uFF08\u5B83\u662F\u4E3B\u4EBA\uFF09\uFF0C\u4E0D\u80FD\u518D\u53BB\u6302\u522B\u4EBA": {
        readonly en: "Other parts are attached to this line (it's the host), so it can't attach to another";
    };
    readonly 自己一行: {
        readonly en: "Own line";
    };
    readonly "\u6302\u5728\u300C{name}\u300D\u4E0A": {
        readonly en: "On “{name}”";
    };
    readonly "\u6302\u5728\u522B\u4EBA\u7684\u8C31\u7EBF\u4E0A\u753B\uFF08\u5408\u79DF\uFF1A\u53EA\u770B\u4E2A\u5927\u6982\uFF0C\u97F3\u649E\u5728\u4E00\u8D77\u5C31\u649E\uFF1B\u53EA\u753B\u97F3\uFF0C\u4E0D\u753B\u4F11\u6B62 / \u6B4C\u8BCD / \u529B\u5EA6\uFF1B\u70B9\u540D\u5B57 = \u62C6\u5F00\u6765\u5199\uFF09": {
        readonly en: "Draw on another part's staff (shared: just an overview, colliding notes collide; only notes are drawn, no rests / lyrics / dynamics; tap the name to split it out and write)";
    };
    readonly "\u8FD9\u4E00\u6BB5\u8C03\u53F7\u4E00\u6837\u7684 {n} \u4E2A\u58F0\u90E8\u4E00\u8D77\u6539\u4E86": {
        readonly en: "Changed {n} parts in this section that share this key signature";
    };
    readonly "\u5206\u89E3\u548C\u5F26\uFF1A\u8BA4\uFF0C\u53E0\u7740\u7684\u6298\u53E0\u6210\u548C\u5F26\u540D": {
        readonly en: "Broken chords: read; stacked chords folded into chord names";
    };
    readonly "\u5206\u89E3\u548C\u5F26\uFF1A\u8BA4": {
        readonly en: "Broken chords: read";
    };
    readonly "\u5206\u89E3\u548C\u5F26\uFF1A\u4E0D\u8BA4": {
        readonly en: "Broken chords: ignored";
    };
    readonly 乐谱: {
        readonly en: "Score";
    };
    readonly "\u300C{name}\u300D\u5728\u5916\u9762\u88AB\u6539\u8FC7": {
        readonly en: "“{name}” was changed elsewhere";
    };
    readonly "\u6253\u5F00\u6216\u4E0A\u6B21\u5B58\u4E4B\u540E\uFF0C\u8FD9\u4E2A\u6587\u4EF6\u88AB\u522B\u7684\u7A0B\u5E8F\u6539\u8FC7\u3002\u8986\u76D6 = \u5916\u9762\u6539\u7684\u90A3\u4E9B\u4F1A\u4E22\u3002": {
        readonly en: "Another program changed this file since it was opened or last saved. Overwriting will lose those changes.";
    };
    readonly 覆盖: {
        readonly en: "Overwrite";
    };
    readonly "\u5B58\u6210 .mxl": {
        readonly en: "Save as .mxl";
    };
    readonly "{name} \u00B7 {size}\u3002\u4E0B\u8F7D\u6216\u5206\u4EAB\u5230\u300C\u6587\u4EF6\u300D\u91CC\uFF1B\u4EE5\u540E\u4ECE\u6587\u4EF6\u83DC\u5355\u300C\u6253\u5F00\u300D\u3002": {
        readonly en: "{name} · {size}. Download it or share it to Files; open it later from the menu.";
    };
    readonly "\u8FD9\u9996\u6B4C\u91CC\u539F\u6765\u5E26\u7740\u7684\u90A3\u4EFD mp3\uFF08{size}\uFF09\u4E0D\u518D\u5B58\u8FDB\u6B4C\u91CC\u4E86\uFF1A\u5B83\u5DF2\u7ECF\u8BB0\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u5E93\u91CC\u7167\u6837\u80FD\u542C\u3001\u80FD\u518D\u5BFC\u51FA\u3002": {
        readonly en: "The mp3 that used to be stored inside this song ({size}) is no longer saved into the song file. It is remembered on this device, so you can still play it from the library and export it again.";
    };
    readonly 连线: {
        readonly en: "Slur";
    };
    readonly "\u97F3\u5185\u6E10\u5F3A / \u9F13\u8D77": {
        readonly en: "Swell up / swell";
    };
    readonly 音内渐弱: {
        readonly en: "Swell down";
    };
    readonly 出声的换气: {
        readonly en: "Audible breath";
    };
    readonly 台上这位: {
        readonly en: "The performer on stage";
    };
    readonly "{who}\u7684\u97F3\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF\uFF0C{p}\u505A\u4E0D\u5230\uFF1A\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D8\uFF1B\u97F3\u5185\u6E10\u5F31\u7167\u505A": {
        readonly en: "{who}'s notes decay on their own, so {p} isn't possible: it's written on the score (grayed out) and the sound doesn't change. Swell down still works";
    };
    readonly "{who}\u672C\u6765\u5C31\u8FDE\u7740\u5531\uFF1A{p}\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D8\uFF1B\u8981\u65AD\u53E5\u7528\u547C\u5438": {
        readonly en: "{who} already sings legato: {p} is written on the score (grayed out) and the sound doesn't change. Use a breath to separate phrases";
    };
    readonly "{who}\u672C\u6765\u5C31\u4E0D\u7559\u7F1D\uFF08\u4E50\u5668\u9875\u300C\u97F3\u548C\u97F3\u4E4B\u95F4\u300D= 0\uFF09\uFF1A{p}\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D8": {
        readonly en: "{who} already leaves no gap (“Between notes” on the instrument page = 0): {p} is written on the score (grayed out) and the sound doesn't change";
    };
    readonly "{who}\u4E0D\u8BA4{p}\uFF1A\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D7\u5F71\u54CD": {
        readonly en: "{who} ignores {p}: it's written on the score (grayed out) and doesn't affect the sound";
    };
    readonly "\u8FD9\u4E2A {p} \u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u540E\u9762\u90A3\u4E2A\u97F3\u662F\u5F3A\u540E\u5373\u5F31\uFF08fp\uFF09\uFF0C\u97F3\u5934\u6309 f\u3001\u968F\u540E\u843D\u5230 p": {
        readonly en: "This {p} has no effect (grayed out): the next note is forte-piano (fp), which attacks at f and then falls to p";
    };
    readonly 力度记号: {
        readonly en: "Dynamic marks";
    };
    readonly "PNG 256 \u8272\u3001\u957F\u8FB9\u6700\u591A 2048": {
        readonly en: "PNG, 256 colors, long side up to 2048";
    };
    readonly "\u5B58\u8FDB\u6B4C\u91CC\uFF08{bytes}\uFF09": {
        readonly en: "Save in the song ({bytes})";
    };
    readonly "\u538B\u4E00\u4E0B\u518D\u5B58\uFF08{what}\uFF09": {
        readonly en: "Compress, then save ({what})";
    };
    readonly "\u538B\u4E00\u4E0B\u518D\u5B58\uFF08\u7EA6 {estimate}\uFF09": {
        readonly en: "Compress, then save (about {estimate})";
    };
    readonly "\u53EA\u653E\u5185\u5B58\uFF08\u63A8\u8350\uFF09": {
        readonly en: "Memory only (recommended)";
    };
    readonly "\u53EA\u653E\u5185\u5B58\uFF08\u4E0D\u5B58\u8FDB\u6B4C\u91CC\uFF09": {
        readonly en: "Memory only (not saved in the song)";
    };
    readonly "\u300C{name}\u300D{bytes}\u3002\u53C2\u8003\u7A97\u91CC\u7684\u4E1C\u897F\u8DDF\u7740\u6B4C\u4E00\u8D77\u5B58\u3001\u4E00\u8D77\u540C\u6B65\u3002{smaller}\u53EA\u653E\u5185\u5B58 = \u8FD9\u6B21\u6253\u5F00\u80FD{p}\uFF0C\u4E0D\u5B58\u8FDB\u6B4C\u91CC\uFF1B\u4E0B\u6B21\u6253\u5F00\u662F\u4E2A\u7A7A\u4F4D\uFF0C\u628A\u540C\u4E00\u4E2A\u6587\u4EF6\u62D6\u8FDB\u6765\u5C31\u8865\u4E0A\u3002{suggestRam}": {
        readonly en: "“{name}” is {bytes}. What's in the reference window is saved and synced with the song. {smaller}Memory only = you can {p} it this session, but it isn't saved in the song; next time it's an empty slot, and dragging the same file in fills it again. {suggestRam}";
    };
    readonly "\u538B\u4E86\u4E5F\u4E0D\u4F1A\u66F4\u5C0F\uFF0C\u5C31\u4E0D\u5217\u4E86\u3002": {
        readonly en: "Compressing wouldn't make it smaller, so that option isn't listed.";
    };
    readonly "\u538B\u4E00\u4E0B = {what}\u3002": {
        readonly en: "Compress = {what}.";
    };
    readonly "\u542C##\u52A8\u8BCD": {
        readonly en: "listen to";
    };
    readonly "\u770B##\u52A8\u8BCD": {
        readonly en: "view";
    };
    readonly "\u8D85\u8FC7 4 MB \u7684\uFF0C\u5B58\u8FDB\u53BB\u8FD9\u9996\u6B4C\u4F1A\u5927\u8FD9\u4E48\u591A\u3001\u540C\u6B65\u4E5F\u6162\uFF0C\u6240\u4EE5\u5148\u63A8\u8350\u53EA\u653E\u5185\u5B58\u3002": {
        readonly en: "Over 4 MB: saving it makes this song that much bigger and syncing slower, so memory only is recommended first.";
    };
    readonly "\u97F3\u9891 / \u89C6\u9891\u9ED8\u8BA4\u53EA\u653E\u5185\u5B58\uFF08\u8FD9\u6B21\u6253\u5F00\u6709\u6548\uFF09\uFF1B\u8981\u8DDF\u7740\u6B4C\u8D70\u5C31\u9009\u300C\u5B58\u8FDB\u6B4C\u91CC\u300D\u3002": {
        readonly en: "Audio / video goes to memory only by default (this session); choose “Save in the song” to keep it with the song.";
    };
    readonly 这段音频有点大: {
        readonly en: "This audio is rather large";
    };
    readonly 这段视频有点大: {
        readonly en: "This video is rather large";
    };
    readonly 这张图有点大: {
        readonly en: "This image is rather large";
    };
    readonly 有新版本: {
        readonly en: "New version available";
    };
    readonly 刷新: {
        readonly en: "Refresh";
    };
    readonly 待会儿: {
        readonly en: "Later";
    };
    readonly "\u4ECE\u8D77\u70B9\u653E / \u505C\uFF08\u7A7A\u683C\uFF09\uFF1B\u8FDE\u6309\u4E24\u4E0B = \u4ECE\u5934\u653E\u3002\u957F\u6309 / \u53F3\u952E = \u63A5\u7740\u653E / \u81EA\u52A8\u7FFB / \u5FAA\u73AF / \u4ECE\u5934\u653E / \u63A5\u7F1D\u3002\u8D77\u70B9 = \u957F\u6309 / \u53F3\u952E\u8C31\u9762\u300C\u4ECE\u8FD9\u513F\u653E\u300D\u632A": {
        readonly en: "Play from the start point / stop (Space); double-press = from the top. Long-press / right-click = resume / auto-follow / loop / from the top / seam. To move the start point, long-press / right-click the score: “Play from here”";
    };
    readonly "\u6B4C\u5E93\uFF1A\u6B4C\u653E\u5728\u7F51\u76D8\uFF08OneDrive\uFF09\u6216\u4F60\u9009\u7684\u6587\u4EF6\u5939\u91CC": {
        readonly en: "Library: songs live on OneDrive or in a folder you choose";
    };
    readonly "\u6B4C\u5E93\uFF1A\u6B4C\u653E\u5728\u4F60\u9009\u7684\u6587\u4EF6\u5939\u91CC": {
        readonly en: "Library: songs live in a folder you choose";
    };
    readonly "\u6587\u4EF6\u540D \u00B7 \u70B9\u4E86\u6539\u540D": {
        readonly en: "File name · tap to rename";
    };
    readonly 未命名: {
        readonly en: "Untitled";
    };
    readonly "\u8FD9\u9996\u6B4C\u6CA1\u52A0\u5BC6\uFF08MoonSinger \u8FD9\u4E00\u7248\u8FD8\u4E0D\u52A0\u5BC6\uFF09": {
        readonly en: "This song isn't encrypted (this version of MoonSinger doesn't encrypt yet)";
    };
    readonly 存: {
        readonly en: "Save";
    };
    readonly "\u83DC\u5355\uFF1A\u65B0\u5EFA / \u6253\u5F00 / \u5BFC\u51FA / \u5C01\u9762 / \u58F0\u97F3\u4E0E\u7F72\u540D / \u8BBE\u7F6E": {
        readonly en: "Menu: new / open / export / cover / sounds and credits / settings";
    };
    readonly "\u952E\u76D8\uFF08pad\uFF09": {
        readonly en: "Keyboard (pad)";
    };
    readonly 键盘: {
        readonly en: "Keys";
    };
    readonly "\u64A4\u9500\uFF08Ctrl / \u2318+Z\uFF09": {
        readonly en: "Undo (Ctrl / ⌘+Z)";
    };
    readonly "\u91CD\u505A\uFF08Ctrl / \u2318+Shift+Z\uFF09": {
        readonly en: "Redo (Ctrl / ⌘+Shift+Z)";
    };
    readonly "\u6A21\u5F0F\uFF1A\u8FD9\u4E00\u4E0B\u70B9\u7684\u662F\u54EA\u4E00\u5C42": {
        readonly en: "Mode: which layer a tap edits";
    };
    readonly "\u770B\u54EA\u4E00\u6BB5\uFF1A\u5168\u90E8 / \u53EA\u770B\u8FD9\u4E00\u6BB5": {
        readonly en: "Which section to view: all / just this one";
    };
    readonly "\u770B\u54EA\u4E2A\u58F0\u90E8\uFF1A\u5168\u90E8 / \u53EA\u770B\u8FD9\u4E00\u4E2A": {
        readonly en: "Which part to view: all / just this one";
    };
    readonly 全部曲段: {
        readonly en: "All sections";
    };
    readonly "\u7B2C {p} \u6BB5": {
        readonly en: "Section {p}";
    };
    readonly "\uFF08\u9690\u85CF\uFF09": {
        readonly en: "(hidden)";
    };
    readonly 全部声部: {
        readonly en: "All parts";
    };
    readonly 混音台: {
        readonly en: "Mixer";
    };
    readonly "\u70B9 = \u6536\u8D77": {
        readonly en: "Tap = hide";
    };
    readonly "\u70B9 = \u6253\u5F00": {
        readonly en: "Tap = open";
    };
    readonly "\u526A\u8D34\u677F\u91CC\u7684\u4E0D\u662F\u7B80\u8C31\uFF08\u50CF 1 2 3 | 5 - - \u8FD9\u6837\u7684\u624D\u8BA4\uFF09": {
        readonly en: "The clipboard isn't jianpu (only things like 1 2 3 | 5 - - are recognized)";
    };
    readonly 剪贴板里没有东西: {
        readonly en: "The clipboard is empty";
    };
    readonly "\u8D34\u4E86 {n} \u4E2A": {
        readonly en: "Pasted {n}";
    };
    readonly "\u590D\u5236\u4E86 {n} \u4E2A": {
        readonly en: "Copied {n}";
    };
    readonly "\u526A\u5207\u4E86 {n} \u4E2A": {
        readonly en: "Cut {n}";
    };
    readonly "{why}\uFF1A\u300C\u8C03\u5185\u4E00\u7EA7\u300D\u7528\u4E0D\u4E86\uFF0C\u7528\u534A\u97F3 / \u516B\u5EA6": {
        readonly en: "{why}: “step within the key” doesn't apply; use semitone / octave";
    };
    readonly 再短就没有这种时值了: {
        readonly en: "No shorter note value exists";
    };
    readonly 再长就没有这种时值了: {
        readonly en: "No longer note value exists";
    };
    readonly 选中的里面没有能加附点的时值: {
        readonly en: "Nothing selected can take a dot";
    };
    readonly 重启声音: {
        readonly en: "Restart audio";
    };
    readonly 声音重启了: {
        readonly en: "Audio restarted";
    };
    readonly "\u6362\u8FC7\u4E86\uFF0C\u4F46\u58F0\u97F3\u8BBE\u5907\u8FD8\u6CA1\u8D77\u6765\uFF1A\u518D\u6309\u4E00\u6B21\uFF0C\u6216\u8005\u628A app \u5173\u6389\u91CD\u5F00": {
        readonly en: "Rebuilt, but the audio device has not come up yet: press again, or close the app and reopen it";
    };
    readonly 其他纸: {
        readonly en: "Other sheets";
    };
    readonly 新的一段: {
        readonly en: "New section";
    };
    readonly "\u9690\u85CF\u7740\u7684\uFF08\u70B9 = \u653E\u51FA\u6765\uFF09": {
        readonly en: "Hidden (tap = show)";
    };
    readonly 去看: {
        readonly en: "Go to it";
    };
    readonly 放出来: {
        readonly en: "Unhide";
    };
    readonly "\u9690\u85CF\u7740\u7684\u66F2\u6BB5\uFF08\u4E0D\u653E\u3001\u4E0D\u5370\uFF09": {
        readonly en: "Hidden sections (not played, not printed)";
    };
    readonly "\u300C{p}\u300D\u653E\u51FA\u6765\u4E86\uFF08\u64A4\u9500\u80FD\u518D\u85CF\u8D77\u6765\uFF09": {
        readonly en: "“{p}” is back (undo hides it again)";
    };
    readonly "\u300C{extras}\u300D\u662F\u5355\u58F0\u4E50\u5668\uFF0C\u8FD9\u4E2A\u58F0\u90E8\u53E0\u4E0D\u4E86\u97F3": {
        readonly en: "“{extras}” is a monophonic instrument, so this part can't stack notes";
    };
    readonly 光标前面还没有音: {
        readonly en: "No note before the cursor yet";
    };
    readonly "\u300C{who}\u300D\u4E00\u6B21\u53EA\u51FA\u4E00\u4E2A\u97F3\uFF1A\u51E0\u4E4E\u540C\u65F6\u6309\u4E0B\u7684\u7B2C\u4E8C\u4E2A\u952E\u6CA1\u5199\u3002\u8981\u5199\u548C\u5F26\uFF0C\u7ED9\u8FD9\u4E2A\u58F0\u90E8\u6362\u94A2\u7434\u8FD9\u7C7B\u4E50\u5668": {
        readonly en: "“{who}” plays one note at a time: the second key pressed at almost the same moment was not written. For chords, switch this part to something like a piano";
    };
    readonly 隐藏了这张纸: {
        readonly en: "Hid this sheet";
    };
    readonly 取消隐藏这张纸: {
        readonly en: "Unhid this sheet";
    };
    readonly "\u8FD9\u4E00\u6BB5\u5B9A\u6210\u4E86\u5927\u8C31\u8868\uFF08\u624B\u52A8\u5206\u7684\u4E0A\u4E0B\u884C\u8981\u5B58\u5F97\u4E0B\uFF09\uFF1B\u60F3\u56DE\u5230\u81EA\u52A8\uFF0C\u70B9\u884C\u9996\u8C31\u53F7\u9009\u300C\u81EA\u52A8\u300D": {
        readonly en: "This section is now fixed as a grand staff (so the notes you moved between staves can be saved); to go back to automatic, tap the clef at the start of the line and pick “Auto”";
    };
    readonly "\u6E10\u5F3A / \u6E10\u5F31": {
        readonly en: "crescendo / diminuendo";
    };
    readonly 踏板记号: {
        readonly en: "pedal marks";
    };
    readonly "\u6539\u5230\u4E86\u6CA1\u663E\u793A\u7684{what}\uFF08\u6F14\u594F\u6CD5\u548C\u8868\u60C5\u73B0\u5728\u4E0D\u663E\u793A\uFF1B\u64A4\u9500\u80FD\u627E\u56DE\uFF09": {
        readonly en: "You changed hidden {what} (articulations & dynamics are hidden right now; undo brings them back)";
    };
    readonly "\u3001": {
        readonly en: ", ";
    };
    readonly "\u5199\u4E0A\u4E86\uFF0C\u4F46\u73B0\u5728\u6CA1\u663E\u793A\uFF1A{what}\uFF08\u9875\u9762\u8BBE\u7F6E \u2192\u300C\u770B\u8C31\u300D\u91CC\u6253\u5F00\uFF09": {
        readonly en: "Written, but hidden right now: {what} (turn them on under Page settings › Reading)";
    };
    readonly 没有可撤销的: {
        readonly en: "Nothing to undo";
    };
    readonly 没有可重做的: {
        readonly en: "Nothing to redo";
    };
    readonly 看谱: {
        readonly en: "Reading";
    };
    readonly 版面: {
        readonly en: "Page";
    };
    readonly 休息室: {
        readonly en: "Green room";
    };
    readonly "{issueCount} \u6761\u8F68\u4E0D\u51FA\u58F0\uFF1A\u70B9\u5F00\u770B\u6E05\u5355": {
        readonly en: "{issueCount} {issueCount|track is|tracks are} silent: tap for the list";
    };
    readonly 总轨: {
        readonly en: "Master";
    };
    readonly 从这儿放: {
        readonly en: "Play from here";
    };
    readonly "\u8D77\u70B9\u632A\u5230\u8FD9\u4E2A\u5C0F\u8282\u7684\u5934\uFF0C\u4ECE\u8FD9\u513F\u653E": {
        readonly en: "Moves the start point to the head of this bar and plays from here";
    };
    readonly 接着放: {
        readonly en: "Resume";
    };
    readonly 从上次停下的地方接着放: {
        readonly en: "Continue from where it last stopped";
    };
    readonly 从头放: {
        readonly en: "Play from the top";
    };
    readonly "\u8D77\u70B9\u56DE\u5230\u5F00\u5934\uFF0C\u4ECE\u5934\u653E\uFF08\u4E5F\u53EF\u4EE5\u8FDE\u6309\u4E24\u4E0B |\u25B6 / \u7A7A\u683C\uFF09": {
        readonly en: "Moves the start point back to the top and plays (or double-press |▶ / Space)";
    };
    readonly "\u4ECE\u4E0A\u6B21\u505C\u4E0B\u7684\u5730\u65B9\u63A5\u7740\u653E\uFF08\u8D77\u70B9\u4E0D\u52A8\uFF09": {
        readonly en: "Continue from where it last stopped (start point stays)";
    };
    readonly 跳到正在放的地方: {
        readonly en: "Jump to the playing spot";
    };
    readonly "\u8C31\u6EDA\u5230\u6B63\u5728\u653E\uFF08\u505C\u7740 = \u505C\u4E0B\uFF09\u7684\u90A3\u4E00\u884C\uFF1B\u521A\u624D\u81EA\u5DF1\u6EDA\u8FC7\u4E5F\u7167\u6837\u8FC7\u53BB\u3001\u63A5\u7740\u8DDF": {
        readonly en: "Scrolls the score to the line now playing (or where it stopped), even if you just scrolled, and keeps following";
    };
    readonly "\u7FFB\u8C31\u63D0\u524D\u591A\u5C11\uFF1A\u5FEB\u5230\u884C\u5C3E\uFF08\u6216\u7F16\u6392\u8DF3\u56DE\u53BB\u4E4B\u524D\uFF09\u8FD9\u4E48\u4E45\u5C31\u5148\u7FFB\u8FC7\u53BB\uFF0C\u6700\u540E\u4E00\u5C0F\u622A\u9760\u8BB0\u2014\u2014\u50CF\u94A2\u7434\u5BB6\u7FFB\u8C31\u30020 = \u6362\u4E86\u884C\u624D\u7FFB": {
        readonly en: "How early to turn the page: this long before the end of a line (or before the arrangement jumps back), turn first and read the last bit from memory — like a pianist. 0 = turn only after the line changes";
    };
    readonly 提前翻: {
        readonly en: "Turn early";
    };
    readonly 不: {
        readonly en: "Off";
    };
    readonly "{autoFollow}\u81EA\u52A8\u7FFB": {
        readonly en: "{autoFollow}Auto-follow";
    };
    readonly "\u653E\u7740\u7684\u65F6\u5019\u8C31\u8DDF\u7740\u6B63\u5728\u653E\u7684\u90A3\u4E00\u884C\u6EDA\uFF08\u51FA\u4E86\u5C4F\u5E55\u8212\u670D\u7684\u90A3\u4E00\u6BB5\u624D\u6EDA\uFF1B\u4F60\u81EA\u5DF1\u6EDA\u8FC7 4 \u79D2\u5185\u4E0D\u8DDF\uFF09": {
        readonly en: "While playing, the score follows the line being played (only when it leaves the comfortable part of the screen; not within 4 s of you scrolling)";
    };
    readonly "{loopOn}\u5FAA\u73AF": {
        readonly en: "{loopOn}Loop";
    };
    readonly "\u653E\u5230\u5934\u63A5\u7740\u4ECE\u5934\u653E\uFF1B\u7F16\u6392\u5199\u4E86 [\u5FAA\u73AF\u6BB5] = \u524D\u9762\u653E\u4E00\u904D\u3001\u62EC\u4F4F\u7684\u4E00\u76F4\u5FAA\u73AF": {
        readonly en: "Restart from the top at the end; if the arrangement has [a loop section], play what's before it once, then loop the bracketed part";
    };
    readonly 听接缝: {
        readonly en: "Hear the seam";
    };
    readonly "\u4ECE\u5FAA\u73AF\u6BB5\u7ED3\u5C3E\u524D\u51E0\u79D2\u653E\u8D77\uFF0C\u8DF3\u56DE\u5F00\u5934\u518D\u653E\u51E0\u79D2\u5C31\u505C": {
        readonly en: "Plays the last few seconds of the loop, jumps back to its start, plays a few more seconds, then stops";
    };
    readonly "\u7FFB\u8C31\u63D0\u524D {turnLead} \u79D2": {
        readonly en: "Page turns {turnLead} s early";
    };
    readonly "\u7FFB\u8C31\u4E0D\u63D0\u524D\uFF08\u6362\u4E86\u884C\u624D\u7FFB\uFF09": {
        readonly en: "Page turns aren't early (only after the line changes)";
    };
    readonly 现在没有在放的地方: {
        readonly en: "Nothing is playing right now";
    };
    readonly "\u81EA\u52A8\u7FFB\uFF1A\u5F00": {
        readonly en: "Auto-follow: on";
    };
    readonly "\u81EA\u52A8\u7FFB\uFF1A\u5173": {
        readonly en: "Auto-follow: off";
    };
    readonly 现在的声部都能出声: {
        readonly en: "All parts can sound now";
    };
    readonly 不出声的声部: {
        readonly en: "Silent parts";
    };
    readonly "\u6362\u4EBA / \u627E\u58F0\u97F3\u2026": {
        readonly en: "Change performer / find sound…";
    };
    readonly "\u653E\u548C\u5BFC\u51FA\u7684 mp3 \u91CC\u90FD\u6CA1\u6709\u8FD9{p}\u7684\u58F0\u97F3\uFF0C\u5176\u4F59\u7167\u653E\u3002\u6362\u8C01\u7531\u4F60\u5B9A\uFF0C\u4E0D\u66FF\u8865\u3002": {
        readonly en: "Neither playback nor the exported mp3 will have the sound of {p}; the rest plays as usual. Who replaces it is up to you — no automatic substitutes.";
    };
    readonly "{n} \u6761\u8F68": {
        readonly en: "{n} {n|track|tracks}";
    };
    readonly 条轨: {
        readonly en: "this track";
    };
    readonly 知道了: {
        readonly en: "Got it";
    };
    readonly "\u51C6\u5907\u2026": {
        readonly en: "Preparing…";
    };
    readonly 取消: {
        readonly en: "Cancel";
    };
    readonly "\u6B63\u5728\u53D6\u6D88\u2026": {
        readonly en: "Cancelling…";
    };
    readonly "\u6B63\u5728\u6E32\u67D3\u2026": {
        readonly en: "Rendering…";
    };
    readonly "\u5DF2\u7ECF\u5728\u6E32\u67D3\u7F13\u5B58\u91CC\u4E86\uFF08\u5185\u5BB9\u6CA1\u53D8\uFF09": {
        readonly en: "Already in the render cache (nothing changed)";
    };
    readonly "\u6E32\u597D\u4E86\uFF0C\u4F46\u6CA1\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF08\u5B58\u50A8\u6EE1\u4E86\u6216\u8005\u662F\u9690\u79C1\u6A21\u5F0F\uFF09": {
        readonly en: "Rendered, but it could not be kept in the render cache (storage full or private browsing)";
    };
    readonly "\u6E32\u597D\u4E86\uFF0C\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF1A\u5B58\u4E0B\u53BB\u4E4B\u540E\u6B4C\u5E93\u5C01\u9762\u4E0A\u80FD\u542C": {
        readonly en: "Rendered into the render cache: once you save, you can play it from the library cover";
    };
    readonly "\u6E32\u597D\u4E86\uFF0C\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF1A\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C": {
        readonly en: "Rendered into the render cache: play it straight from this song’s cover in the library";
    };
    readonly 渲染取消了: {
        readonly en: "Rendering cancelled";
    };
    readonly "\u6E32\u4E0D\u4E86\uFF1A{Error}": {
        readonly en: "Couldn't render: {Error}";
    };
    readonly "\u6B63\u5728\u6E32\u67D3\u300C{stem}\u300D\u2026": {
        readonly en: "Rendering “{stem}”…";
    };
    readonly "\u5BFC\u51FA\u6B4C\u58F0\uFF08mp3\uFF09": {
        readonly en: "Export MP3";
    };
    readonly 音质: {
        readonly en: "Quality";
    };
    readonly 范围: {
        readonly en: "Range";
    };
    readonly 整首: {
        readonly en: "Whole song";
    };
    readonly 隐藏的纸不放: {
        readonly en: "Hidden sheets aren't played";
    };
    readonly 这一张纸: {
        readonly en: "This sheet";
    };
    readonly "\u7B2C {p} \u5F20": {
        readonly en: "Sheet {p}";
    };
    readonly 放进渲染缓存: {
        readonly en: "Keep in render cache";
    };
    readonly 放进去: {
        readonly en: "Keep";
    };
    readonly "\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF1B\u8BBE\u7F6E\u91CC\u80FD\u5220": {
        readonly en: "Play it from this song’s cover in the library; delete it in Settings";
    };
    readonly 不放: {
        readonly en: "Don't keep";
    };
    readonly "\u53EA\u5BFC\u51FA\u8FD9\u4E00\u4EFD\uFF0C\u4E0D\u7559": {
        readonly en: "Export this copy only, keep nothing";
    };
    readonly "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BB0\u7740\u4E0A\u6B21\u6E32\u597D\u7684\u8FD9\u4E00\u4EFD\uFF0C\u5185\u5BB9\u6CA1\u53D8\uFF1A\u76F4\u63A5\u62FF\uFF0C\u4E0D\u7528\u7B49\u3002": {
        readonly en: "This device remembers the last render of exactly this, and nothing has changed: you get it right away, no waiting.";
    };
    readonly "\u8BB8\u53EF\uFF1A{fellBack}\u3002\u548C\u7F72\u540D\u4E00\u8D77\u5199\u8FDB mp3 \u7684\u6807\u7B7E\u3002": {
        readonly en: "License: {fellBack}. Written into the mp3 tags along with the credits.";
    };
    readonly "\u8FD9\u4EFD\u6309\u300C\u672A\u58F0\u660E\u300D\u5199\u2014\u2014\u4F60\u9009\u7684\u8BB8\u53EF\u5141\u8BB8\u522B\u4EBA\u6539\u7F16\uFF0C\u548C\u5C0F\u6708\u76F8\u7684\u6761\u6B3E\u53EF\u80FD\u51B2\u7A81\uFF08\u4F5C\u8005\u680F\u91CC\u7684\u9009\u62E9\u6CA1\u52A8\uFF09": {
        readonly en: "This copy is written as “not stated” — the license you chose allows adaptation, which may conflict with Tsukuyomi-chan's terms (your choice in the credits is unchanged)";
    };
    readonly "{n} \u6761\u8F68\u4E0D\u51FA\u58F0\uFF0Cmp3 \u91CC\u4E0D\u4F1A\u6709\u5B83\u4EEC\uFF1A{is}\u3002\u6362\u4EBA\u5728\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u91CC\u3002": {
        readonly en: "{n} {n|track is|tracks are} silent and won't be in the mp3: {is}. Change the performer from the part name at the front of the score.";
    };
    readonly 照样导出: {
        readonly en: "Export anyway";
    };
    readonly 导出: {
        readonly en: "Export";
    };
    readonly 算了: {
        readonly en: "Never mind";
    };
    readonly "\u2713 \u5728\u6587\u4EF6\u5939\u91CC": {
        readonly en: "✓ In the folder";
    };
    readonly "\u00B7 \u6587\u4EF6\u5939\u91CC\u6CA1\u6709": {
        readonly en: "· Not in the folder";
    };
    readonly "\u4F60\u6311\u7684\u300C{name}\u300D\u4E0D\u5728\u73B0\u5728\u8FD9\u51E0\u4E2A\u97F3\u7684\u8BFB\u6CD5\u91CC\uFF08\u97F3\u6539\u8FC7\u4E86\uFF09\uFF1A\u6362\u4E00\u4E2A\uFF0C\u6216\u8005\u6539\u56DE\u81EA\u52A8": {
        readonly en: "The chord you picked, “{name}”, is no longer one of the readings of these notes (the notes changed): pick another, or go back to automatic";
    };
    readonly "\u8FD9\u662F\u4F60\u6311\u7684\u300C{name}\u300D": {
        readonly en: "You picked “{name}”";
    };
    readonly "\u6539\u56DE\u81EA\u52A8\uFF08{label}\uFF09": {
        readonly en: "Back to automatic ({label})";
    };
    readonly "\u6539\u56DE\u81EA\u52A8\uFF08\u8FD9\u51E0\u4E2A\u97F3\u8BA4\u4E0D\u51FA\u548C\u5F26 = \u4E0D\u6807\uFF09": {
        readonly en: "Back to automatic (these notes don't read as a chord = no label)";
    };
    readonly "\u70B9\u4E00\u4E2A = \u7528\u5B83\uFF08\u8BB0\u8FDB\u8FD9\u4E2A\u97F3\uFF0C\u80FD\u64A4\u9500\uFF09": {
        readonly en: "Tap one = use it (stored on this note; undo works)";
    };
    readonly "\u754C\u9762##\u9875\u7B7E": {
        readonly en: "UI";
    };
    readonly "\u754C\u9762\uFF1A\u8FD9\u4E2A\u8F6F\u4EF6\u957F\u4EC0\u4E48\u6837\u3001\u8BF4\u4EC0\u4E48\u8BED\u8A00": {
        readonly en: "UI: how this app looks and which language it speaks";
    };
    readonly "\u97F3\u6E90##\u9875\u7B7E": {
        readonly en: "Sounds";
    };
    readonly "\u97F3\u6E90\uFF1A\u88C5\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7684\u58F0\u97F3": {
        readonly en: "Sounds: the voices and instruments installed on this device";
    };
    readonly "\u8F93\u5165##\u9875\u7B7E": {
        readonly en: "Input";
    };
    readonly "\u8F93\u5165\uFF1A\u63A5\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7684\u952E\u76D8": {
        readonly en: "Input: keyboards connected to this device";
    };
    readonly "\u7EF4\u62A4##\u9875\u7B7E": {
        readonly en: "Upkeep";
    };
    readonly "\u7EF4\u62A4\uFF1A\u6E05\u7406\u7A7A\u95F4\u3001\u51FA\u6BDB\u75C5\u65F6\u4FEE\u4E00\u4E0B\u3001\u628A\u65E5\u5FD7\u53D1\u7ED9\u5F00\u53D1\u8005": {
        readonly en: "Upkeep: free up space, fix things when they go wrong, send logs to the developer";
    };
    readonly "\u5173\u4E8E##\u9875\u7B7E": {
        readonly en: "About";
    };
    readonly "\u5173\u4E8E\uFF1A\u7248\u672C\u3001\u8F6F\u4EF6\u81EA\u5DF1\u7528\u5230\u7684\u522B\u4EBA\u7684\u4E1C\u897F": {
        readonly en: "About: version, and other people’s work this app uses";
    };
    readonly "\u5F00\u53D1\u8005##\u9875\u7B7E": {
        readonly en: "Dev";
    };
    readonly "\u5F00\u53D1\u8005\uFF1A\u8BD5\u9A8C\u5F00\u5173\u3001\u8FD8\u539F\u51FA\u5382": {
        readonly en: "Dev: experimental switches, factory reset";
    };
    readonly 这是什么: {
        readonly en: "What's this";
    };
    readonly 设置: {
        readonly en: "Settings";
    };
    readonly 跟系统: {
        readonly en: "System";
    };
    readonly 模型来源: {
        readonly en: "Model source";
    };
    readonly "\u5148\u627E\u8FD9\u4E2A\u7F51\u7AD9\u4E0B\u7684 <code>pwa-models/</code>\uFF08\u81EA\u5DF1\u642D\u670D\u52A1\u5668\u7684\u8BDD\uFF0C\u628A\u6A21\u578B\u4ED3\u62F7\u8FC7\u53BB\u5C31\u80FD\u7528\uFF09\uFF0C\u627E\u4E0D\u5230\u518D\u7528\u8FD9\u91CC\u586B\u7684\u3002\u53EA\u5728\u8FD9\u6B21\u6253\u5F00\u91CC\u6709\u6548\u3002": {
        readonly en: "Looks first for <code>pwa-models/</code> on this site (if you host your own server, copy the model repo there), then uses what's entered here. Only for this session.";
    };
    readonly 音源库来源: {
        readonly en: "Sound library source";
    };
    readonly 恢复默认: {
        readonly en: "Reset to default";
    };
    readonly "\u4E50\u5668\u97F3\u8272\u5E93\u3001\u9F13\u7EC4\u3001\u97F3\u6548\u7D20\u6750\uFF08\u4E0D\u662F AI \u6A21\u578B\uFF09\u3002\u300C\u6062\u590D\u9ED8\u8BA4\u300D= \u6A21\u578B\u6765\u6E90\u548C\u97F3\u6E90\u5E93\u6765\u6E90\u90FD\u56DE\u5230\u51FA\u5382\u7684\u5730\u5740\u3002\u53EA\u5728\u8FD9\u6B21\u6253\u5F00\u91CC\u6709\u6548\u3002": {
        readonly en: "Instrument banks, drum kits, sound effects (not AI models). “Restore defaults” = both the model source and the sound library source go back to the built-in addresses. Only for this session.";
    };
    readonly 小月相的模型包: {
        readonly en: "Tsukuyomi-chan's model packs";
    };
    readonly 从本机文件导入: {
        readonly en: "Import from a local file";
    };
    readonly "\u9009\u6A21\u578B\u5305\u7684\u5206\u7247\u6587\u4EF6\uFF08chunk-000 \u2026\uFF0C\u540D\u5B57\u4E0D\u91CD\u8981\uFF09\uFF0C\u6216\u6574\u4E2A\u5305\u62FC\u6210\u7684\u4E00\u4E2A\u6587\u4EF6": {
        readonly en: "Choose the pack's chunk files (chunk-000 …, names don't matter), or one file with the whole pack joined";
    };
    readonly 音源库缓存: {
        readonly en: "Sound library cache";
    };
    readonly "\u7559\u5728\u8BBE\u5907\u4E0A\uFF0C\u6CA1\u7F51\u4E5F\u80FD\u7528\uFF1B\u6B4C\u81EA\u5DF1\u5E26\u58F0\u97F3\uFF0C\u8FD9\u91CC\u53EA\u662F\u8D27\u67B6": {
        readonly en: "Kept on this device, works offline; songs carry their own sound, this is only the shelf";
    };
    readonly 小月相的署名与使用条款: {
        readonly en: "Tsukuyomi-chan's credit and terms of use";
    };
    readonly "\u770B\u2026": {
        readonly en: "View…";
    };
    readonly "MIDI \u952E\u76D8": {
        readonly en: "MIDI keyboard";
    };
    readonly 连接: {
        readonly en: "Connect";
    };
    readonly 渲染缓存: {
        readonly en: "Render cache";
    };
    readonly 全清: {
        readonly en: "Clear all";
    };
    readonly "\u5BFC\u51FA\u6216\u300C\u6E32\u67D3\u5230\u7F13\u5B58\u300D\u65F6\u653E\u8FDB\u6765\u7684\u6574\u9996\u6B4C\u58F0\uFF0C\u6B4C\u5E93\u5C01\u9762\u4E0A\u7684 \u25B6 \u9760\u5B83\uFF1B\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3001\u4E0D\u540C\u6B65\uFF0C\u6700\u591A {n} \u9996\uFF0C\u6EE1\u4E86\u4E22\u6700\u4E45\u6CA1\u542C\u7684\uFF1B\u5220\u4E86\u53EA\u662F\u8981\u91CD\u6E32": {
        readonly en: "Whole songs rendered when you export or use “Render to cache”; the ▶ on library covers plays them. Only on this device, never synced, at most {n} songs (the least recently played goes first); deleting only means rendering again";
    };
    readonly 小月相的念缓存: {
        readonly en: "Tsukuyomi-chan's speech cache";
    };
    readonly 清空念缓存: {
        readonly en: "Clear speech cache";
    };
    readonly "\u8BBE\u5907\u4E0A\u7684\u5168\u5C40\u6C60\uFF1A\u5FF5\u8FC7\u7684\u53E5\u5B50\u8DE8\u6B4C\u5171\u7528\uFF0C\u91CD\u5F00 app \u4E5F\u5728\uFF1B\u53EF\u518D\u751F\uFF0C\u6E05\u4E86\u53EA\u662F\u8981\u91CD\u5FF5": {
        readonly en: "A global pool on this device: spoken lines are shared across songs and survive restarts; regenerable — clearing only means re-speaking";
    };
    readonly "\u58F0\u97F3\u4E0D\u5BF9\u52B2\u7684\u65F6\u5019\u6309\u4E00\u4E0B\uFF08\u6309\u952E\u6709\u5EF6\u8FDF\u3001\u6CA1\u6709\u58F0\u97F3\uFF09\uFF1A\u628A\u901A\u5411\u626C\u58F0\u5668\u7684\u90A3\u4E00\u6BB5\u6362\u6210\u65B0\u7684\uFF0C\u6392\u7740\u6CA1\u64AD\u5B8C\u7684\u58F0\u97F3\u4E00\u8D77\u4E22\u6389\u3002\u6B63\u5728\u54CD\u7684\u58F0\u97F3\u4F1A\u65AD\u4E00\u4E0B": {
        readonly en: "Press this when the sound is off (keys respond late, or there is no sound): it rebuilds the path to the speaker and throws away any audio still waiting to play. Anything sounding right now will cut out for a moment";
    };
    readonly 引擎负载与内存: {
        readonly en: "Engine load and memory";
    };
    readonly "\u5C0F\u6708\u76F8\u5F15\u64CE\u7684 WASM \u5185\u5B58\u53EA\u6DA8\u4E0D\u843D\uFF0C\u53EA\u6709\u91CD\u5F00\u624D\u8FD8\u56DE\u53BB\uFF1B\u5FF5\u8FC7\u7684\u53E5\u5B50\u8981\u91CD\u5FF5": {
        readonly en: "Tsukuyomi-chan's engine WASM memory only grows; only a restart returns it. Spoken lines will need re-speaking";
    };
    readonly 重开小月相引擎: {
        readonly en: "Restart Tsukuyomi-chan's engine";
    };
    readonly "\u80FD\u7B97\u5230\u7684\u90E8\u5206\uFF1B\u8D85\u9884\u7B97\u4F1A\u5148\u653E\u5757\u3001\u518D\u51CF\u5E76\u884C\u3001\u518D\u8D81\u7A7A\u91CD\u5F00\u5F15\u64CE\uFF0C\u5E76\u5728\u8FD9\u91CC / \u72B6\u6001\u6761\u660E\u8BF4\u3002\u5C0F\u6708\u76F8\u5F15\u64CE\u7684\u5185\u5B58\u53EA\u6DA8\u4E0D\u843D\uFF0C\u53EA\u6709\u91CD\u5F00\u624D\u8FD8\u56DE\u53BB": {
        readonly en: "The parts we can measure; over budget it drops chunks first, then reduces parallelism, then restarts the engine when idle, and says so here / in the status bar. Tsukuyomi-chan's engine memory only grows; restarting is the only way to give it back";
    };
    readonly 诊断日志: {
        readonly en: "Diagnostic log";
    };
    readonly "\u9ED1\u5323\u5B50\uFF1A\u51FA\u9519\u4E86\u628A\u8FD9\u4E2A\u53D1\u7ED9\u5F00\u53D1\u8005\uFF1B\u4E0D\u4E0A\u4F20\uFF0C\u53EA\u6709\u70B9\u300C\u590D\u5236 / \u5206\u4EAB\u300D\u624D\u79BB\u5F00\u8BBE\u5907": {
        readonly en: "Black box: send this to the developer if something breaks; never uploaded, it only leaves the device when you tap Copy / Share";
    };
    readonly 复制: {
        readonly en: "Copy";
    };
    readonly "\u4E0B\u8F7D .txt": {
        readonly en: "Download .txt";
    };
    readonly "\u5206\u4EAB\u2026": {
        readonly en: "Share…";
    };
    readonly 清空: {
        readonly en: "Clear";
    };
    readonly 清缓存重启: {
        readonly en: "Clear cache and restart";
    };
    readonly "\u5361\u5728\u65E7\u7248\u672C\u65F6\u7528\uFF1A\u6CE8\u9500\u672C app \u7684\u79BB\u7EBF\u7F13\u5B58\u518D\u91CD\u5F00\u3002\u4E0B\u597D\u7684\u5C0F\u6708\u76F8\u6A21\u578B\u5305\u4E0D\u5220": {
        readonly en: "For when you're stuck on an old version: unregisters this app's offline cache and reopens. Downloaded Tsukuyomi-chan model packs stay";
    };
    readonly 版本: {
        readonly en: "Version";
    };
    readonly 版权与署名: {
        readonly en: "Credits and licenses";
    };
    readonly "\u5C0F\u6708\u76F8\u7684\u7F72\u540D\u4E0E\u4F7F\u7528\u6761\u6B3E\u3001\u4E50\u5668\u76EE\u5F55\u56FE\u6807\u7684\u4F5C\u8005\u4E0E\u8BB8\u53EF\uFF0C\u5408\u5728\u4E00\u7BC7\u91CC\u770B": {
        readonly en: "Tsukuyomi-chan's credit and terms of use, plus the authors and licenses of the instrument catalog icons, all in one page";
    };
    readonly 按键手感的数字: {
        readonly en: "Key-feel numbers";
    };
    readonly "\u67E5\u5EF6\u8FDF\u7528\uFF1A\u6253\u5F00 = \u6309\u952E\u65F6\u5728\u952E\u76D8\u4E0A\u9762\u9732\u4E00\u884C\u6570\u5B57\uFF1B\u5173\u7740 = \u4E0D\u663E\u793A\uFF08\u665A\u4E86\u4E5F\u4E0D\u5F39\uFF0C\u53EA\u8BB0\u8FDB\u8BCA\u65AD\u65E5\u5FD7\uFF09": {
        readonly en: "For chasing latency: on = a line of numbers appears above the keys while you play; off = never shown, even when keys are late (it only goes into the diagnostic log)";
    };
    readonly "\u58F0\u97F3\u7684\u8D77\u6CD5\uFF08\u8BD5\u9A8C\uFF09": {
        readonly en: "How audio starts (experiment)";
    };
    readonly "\u5F00 = \u7B2C\u4E00\u6B21\u70B9\u5C4F\u5E55\u5148\u8D77\u4E00\u4E2A\u4E0D\u51FA\u58F0\u7684\u57AB\u811A\u628A\u58F0\u97F3\u786C\u4EF6\u53EB\u9192\uFF0C\u518D\u8D77\u771F\u6B63\u51FA\u58F0\u7684\u90A3\u4E00\u4E2A\uFF1B\u5173 = \u4EE5\u524D\u7684\u8D77\u6CD5\u3002\u6539\u4E86\u8981\u91CD\u5F00 app \u624D\u770B\u5F97\u51FA": {
        readonly en: "On = the first tap starts a silent primer to wake the audio hardware, then the real output starts; off = the old way. Takes effect the next time the app is opened";
    };
    readonly "\u8FD8\u539F\u51FA\u5382\u8BBE\u7F6E\u2026": {
        readonly en: "Factory reset…";
    };
    readonly "\u8FD9\u53F0\u8BBE\u5907\u4E0A MoonSinger \u7684\u5168\u90E8\u672C\u5730\u6570\u636E\u6E05\u6210\u65B0\u88C5\uFF1A\u6B4C\u5E93\u7684\u672C\u673A\u526F\u672C\u3001\u5FF5\u7F13\u5B58\u3001\u5C01\u9762\u7F13\u5B58\u3001\u8BBE\u7F6E\u3001\u8BCA\u65AD\u65E5\u5FD7\u3001\u79BB\u7EBF\u58F3\uFF1B\u4E91\u7AEF\u7684\u6B4C\u548C\u672C\u673A\u6587\u4EF6\u4E0D\u52A8\uFF1B\u5C0F\u6708\u76F8\u6A21\u578B\u5305\u662F\u5BB6\u65CF\u5171\u4EAB\u7F13\u5B58\uFF0C\u4E0D\u52A8\u2014\u2014\u5728\u300C\u97F3\u6E90\u4E0E\u7F13\u5B58\u300D\u7684\u6A21\u578B\u5305\u91CC\u9010\u4E2A\u5220": {
        readonly en: "Wipes all of MoonSinger's local data on this device back to a fresh install: local library copies, speech cache, cover cache, settings, diagnostic log and offline shell; songs in the cloud and local files aren't touched; Tsukuyomi-chan's model packs are shared with other apps on this site and aren't touched — delete them one by one under model packs in Settings › Audio";
    };
    readonly 检查更新: {
        readonly en: "Check for updates";
    };
    readonly "{BUDGET} \u5C0F\u6708\u76F8 {parallelism} \u6761\u9053\uFF08\u8BBE\u5907\u9884\u7B97 {lanes}\uFF09\u3002{p}": {
        readonly en: "{BUDGET} Tsukuyomi-chan {parallelism} lanes (device budget {lanes}). {p}";
    };
    readonly "\u58F0\u97F3\u7684\u8F93\u51FA\u5EF6\u8FDF\uFF08\u6D4F\u89C8\u5668\u62A5\u7684\uFF09{lat} ms\u3002": {
        readonly en: "Audio output latency (as reported by the browser): {lat} ms.";
    };
    readonly "{bytes} / \u9884\u7B97 {budget}\uFF0C{entries} \u6761": {
        readonly en: "{bytes} / budget {budget}, {entries} entries";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u6CA1\u6709 IndexedDB\uFF1A\u53EA\u7528\u5185\u5B58": {
        readonly en: "This browser has no IndexedDB: memory only";
    };
    readonly "\u8BFB\u4E0D\u5230\uFF1A{Error}": {
        readonly en: "Can't read: {Error}";
    };
    readonly "\uFF1B\u8FD9\u4E2A\u7AD9\u70B9\u5171\u7528\u4E86 {usage} / \u914D\u989D {quota}": {
        readonly en: "; this site is using {usage} / quota {quota}";
    };
    readonly "\u8BBE\u5907\u4E0A\u7559\u7740 {total}{quota}\uFF1B\u5185\u5B58\u91CC\u73B0\u5728 {mem}": {
        readonly en: "{total} kept on this device{quota}; {mem} in memory now";
    };
    readonly "\u653E\u6389\u5185\u5B58\u91CC\u7684\u6574\u5305\uFF08\u8BBE\u5907\u4E0A\u7559\u7740\u7684\u4E0D\u52A8\uFF0C\u4E0B\u6B21\u7528\u518D\u4ECE\u8BBE\u5907\u8BFB\uFF09": {
        readonly en: "Release whole banks from memory (what's on the device stays; it's read from the device next time)";
    };
    readonly 放掉内存: {
        readonly en: "Release memory";
    };
    readonly 已留在设备上: {
        readonly en: "Kept on this device";
    };
    readonly 没下载: {
        readonly en: "Not downloaded";
    };
    readonly 删掉: {
        readonly en: "Remove";
    };
    readonly 下载留着: {
        readonly en: "Download and keep";
    };
    readonly "\u300C{p}\u300D\u7684\u58F0\u97F3\uFF08\u8FD9\u9996\u6B4C{packed}\uFF09": {
        readonly en: "Sound of “{p}” (in this song{packed})";
    };
    readonly 也打包着: {
        readonly en: ", also packed";
    };
    readonly "\u5F15\u7528\u7740\uFF1B\u5220\u4E86\u8981\u4ECE\u300C{name}\u300D\u627E": {
        readonly en: "Referenced; if removed it must be found from “{name}”";
    };
    readonly "\u522B\u7684\u6B4C / \u522B\u7684\u7248\u672C / \u522B\u7684 app \u7559\u7684\uFF08{p}\u2026\uFF09": {
        readonly en: "Left by other songs / versions / apps ({p}…)";
    };
    readonly "\uFF08\u6CA1\u6709\uFF09": {
        readonly en: "(none)";
    };
    readonly 还没有记着的: {
        readonly en: "Nothing kept yet";
    };
    readonly "{n} \u9996 \u00B7 {size}": {
        readonly en: "{n} {n|song|songs} · {size}";
    };
    readonly "\u5220\u6389\u65E7\u7248\u672C\u6E32\u7684\uFF08{n} \u6761\uFF0C\u5171 {size}\uFF09": {
        readonly en: "Delete ones rendered by an older version ({n}, {size} total)";
    };
    readonly "{title} \u00B7 {secs} \u79D2 \u00B7 {size} \u00B7 {date}": {
        readonly en: "{title} · {secs} s · {size} · {date}";
    };
    readonly "\u65E7\u7248\u672C\u6E32\u7684\uFF08\u6E32\u67D3\u6838\u5FC3 {v}\uFF09": {
        readonly en: "rendered by an older version (render core {v})";
    };
    readonly 这一版渲的: {
        readonly en: "rendered by this version";
    };
    readonly "\u6B4C\u5E93\u91CC\uFF1A{names}": {
        readonly en: "In the library: {names}";
    };
    readonly 删: {
        readonly en: "Delete";
    };
    readonly "\u4E0B\u8F7D {name} {bytes}%": {
        readonly en: "Downloading {name} {bytes}%";
    };
    readonly "{name} \u7559\u5728\u8BBE\u5907\u4E0A\u4E86": {
        readonly en: "{name} is kept on this device";
    };
    readonly 已经是最新版: {
        readonly en: "Already up to date";
    };
    readonly "\u8FD9\u91CC\u6CA1\u6709\u79BB\u7EBF\u58F3\uFF08\u672C\u673A\u5F00\u53D1 / \u6D4F\u89C8\u5668\u4E0D\u652F\u6301\uFF09\uFF0C\u4E0D\u7528\u66F4\u65B0": {
        readonly en: "No offline shell here (local dev / unsupported browser), nothing to update";
    };
    readonly "\u5168\u6E05\u4E86\uFF08\u8981\u542C\u518D\u6E32\uFF09": {
        readonly en: "All cleared (render again to listen)";
    };
    readonly "\u5220\u4E86 {n} \u6761\u65E7\u7248\u672C\u6E32\u7684\uFF08{size}\uFF09\uFF1A\u6B4C\u5E93\u91CC\u8981\u542C\u518D\u6E32": {
        readonly en: "Deleted {n} rendered by an older version ({size}): render again in the library to listen";
    };
    readonly "\u5220\u4E86\u8FD9\u4E00\u904D\uFF08\u8981\u542C\u518D\u6E32\uFF09": {
        readonly en: "Deleted this render (render again to listen)";
    };
    readonly "\u5FF5\u7F13\u5B58\u6E05\u7A7A\u4E86\uFF08\u5FF5\u8FC7\u7684\u53E5\u5B50\u8981\u91CD\u5FF5\uFF09": {
        readonly en: "Speech cache cleared (spoken lines will need re-speaking)";
    };
    readonly "\u5C0F\u6708\u76F8\u5F15\u64CE\u91CD\u5F00\u4E86\uFF0C\u5185\u5B58\u8FD8\u56DE\u53BB\u4E86\uFF08\u5FF5\u8FC7\u7684\u53E5\u5B50\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u4E0D\u7528\u91CD\u5FF5\uFF09": {
        readonly en: "Tsukuyomi-chan's engine restarted and memory returned (spoken lines are stored on this device, no re-speaking needed)";
    };
    readonly "\u5BFC\u5165\u4E2D\u2026": {
        readonly en: "Importing…";
    };
    readonly "\u5BFC\u5165\u4E2D\u2026 {total}%": {
        readonly en: "Importing… {total}%";
    };
    readonly "\u5BFC\u5165\u6CA1\u6210\uFF1A{Error}": {
        readonly en: "Import failed: {Error}";
    };
    readonly 这些文件不是小月相要的模型包分片: {
        readonly en: "These files aren't the model pack chunks Tsukuyomi-chan needs";
    };
    readonly 分享: {
        readonly en: "Share";
    };
    readonly 下载: {
        readonly en: "Download";
    };
    readonly "\u5173##\u5173\u7A97": {
        readonly en: "Close";
    };
    readonly "\u5DF2\u4E0B\u8F7D {name}": {
        readonly en: "Downloaded {name}";
    };
    readonly 已分享: {
        readonly en: "Shared";
    };
    readonly "\u5206\u4EAB\u5931\u8D25\uFF1A{Error}": {
        readonly en: "Sharing failed: {Error}";
    };
    readonly 打开别的歌: {
        readonly en: "Opening another song";
    };
    readonly "\u8F68\u300C{id}\u300D": {
        readonly en: "Track “{id}”";
    };
    readonly 总线: {
        readonly en: "Bus";
    };
    readonly "\u52A0\u603B\u7EBF\u300C{name}\u300D": {
        readonly en: "Add bus “{name}”";
    };
    readonly "\u5220\u603B\u7EBF\u300C{id}\u300D": {
        readonly en: "Delete bus “{id}”";
    };
    readonly "\u5206\u6BB5\u5531\uFF1A{v}": {
        readonly en: "Sing in segments: {v}";
    };
    readonly "\u6587\u4EF6\u540D\uFF08{p}\uFF09\u00B7 {p2}": {
        readonly en: "File name ({p}) · {p2}";
    };
    readonly 本机文件的名字在文件管理器里改: {
        readonly en: "Rename local files in your file manager";
    };
    readonly 点了改名: {
        readonly en: "Tap to rename";
    };
    readonly "\u6539\u4E86\uFF0C\u9A6C\u4E0A\u81EA\u52A8\u5B58\u5230\u8FD9\u53F0\u8BBE\u5907\uFF08\u70B9 = \u73B0\u5728\u5B58 + \u63A8\uFF09": {
        readonly en: "Changed; saving to this device shortly (tap = save and upload now)";
    };
    readonly "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF08\u6CA1\u767B\u5F55 OneDrive\uFF0C\u4E0D\u4E0A\u4E91\uFF1B\u70B9 = \u5B58 + \u53BB\u767B\u5F55\uFF09": {
        readonly en: "Saved on this device (not signed in to OneDrive, so not in the cloud; tap = save and sign in)";
    };
    readonly "\u5B58\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\uFF08{cloudOffTitle}\uFF09": {
        readonly en: "Saved in this browser ({cloudOffTitle})";
    };
    readonly "\u79BB\u7EBF\uFF1A\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u56DE\u7EBF\u518D\u63A8\u4E0A\u4E91": {
        readonly en: "Offline: saved on this device, uploads when back online";
    };
    readonly "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u8FD8\u6CA1\u63A8\u4E0A\u4E91\uFF08\u70B9 = \u73B0\u5728\u63A8\uFF09": {
        readonly en: "Saved on this device, not uploaded yet (tap = upload now)";
    };
    readonly "\u4E91\u7AEF\u4E5F\u662F\u6700\u65B0\u7684\uFF08\u70B9 = \u590D\u67E5\u4E91\u7AEF\uFF09": {
        readonly en: "The cloud is up to date too (tap = recheck the cloud)";
    };
    readonly "\u6539\u8FC7\u8FD8\u6CA1\u5B58\u56DE\u6587\u4EF6\uFF08\u70B9 = \u5B58\uFF09": {
        readonly en: "Changed, not saved back to the file (tap = save)";
    };
    readonly 存在本地文件里了: {
        readonly en: "Saved in the local file";
    };
    readonly "\u8FD8\u6CA1\u5B58\uFF08\u70B9 = \u5B58\uFF09": {
        readonly en: "Not saved yet (tap = save)";
    };
    readonly "\u65B0\u7684\u4E00\u9996\uFF0C\u8FD8\u6CA1\u5B58": {
        readonly en: "New song, not saved yet";
    };
    readonly "\u6539\u4E86\uFF0C\u9A6C\u4E0A\u81EA\u52A8\u5B58\u5230\u8FD9\u53F0\u8BBE\u5907\uFF08\u70B9 = \u73B0\u5728\u5B58 + \u5199\u8FDB\u6587\u4EF6\u5939\uFF09": {
        readonly en: "Changed; saving to this device shortly (tap = save and write to the folder now)";
    };
    readonly "\u6587\u4EF6\u5939\u7684\u6743\u9650\u6389\u4E86\uFF1A\u6539\u52A8\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF08\u70B9 = \u91CD\u65B0\u6388\u6743\uFF09": {
        readonly en: "Folder permission lost: changes are saved on this device (tap = re-authorize)";
    };
    readonly "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u8FD8\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939\uFF08\u70B9 = \u73B0\u5728\u5199\uFF09": {
        readonly en: "Saved on this device, not written to the folder yet (tap = write now)";
    };
    readonly "\u6587\u4EF6\u5939\u91CC\u4E5F\u662F\u6700\u65B0\u7684\uFF08\u70B9 = \u590D\u67E5\uFF09": {
        readonly en: "The folder is up to date too (tap = recheck)";
    };
    readonly "\u300C{extras}\u300D\u8FD9\u4E2A\u89D2\u8272\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A\uFF08\u539F\u6765\u7684\u4E50\u5668\u8FD9\u4E00\u7248\u6CA1\u6709\uFF09\uFF0C\u6240\u4EE5\u6CA1\u6709{what}\u3002\u8981\u5C0F\u6708\u76F8\u6765\u5531\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u300C{extras2}\u300D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u9009\u5C0F\u6708\u76F8\u3002": {
        readonly en: "Nobody is performing “{extras}” yet (this version doesn't have the original instrument), so there's no {what}. To have Tsukuyomi-chan sing it, tap “{extras2}” at the front of the score and choose her under “Who performs”.";
    };
    readonly "\u5199\u8FD9\u4E2A\u97F3 = \u539F\u901F\uFF08\u97F3\u9AD8\u5BF9\u9F50\uFF1A\u5199\u7684\u97F3 \u2248 \u542C\u5230\u7684\u97F3\uFF09": {
        readonly en: "Writing this note = original speed (pitch aligned: the written note ≈ what you hear)";
    };
    readonly "\u539F\u901F\u952E\uFF1A\u6309\u8FD9\u4E2A\u952E\uFF0C\u91C7\u6837\u4E0D\u62C9\u4F38\u4E0D\u538B\u7F29": {
        readonly en: "Original-speed key: press this key and the sample isn't stretched or compressed";
    };
    readonly "\u8BD5\u542C\u4E0D\u4E86\uFF1A{Error}": {
        readonly en: "Can't audition: {Error}";
    };
    readonly 谱上还没有音: {
        readonly en: "No notes on the score yet";
    };
    readonly "\u5C0F\u6708\u76F8\uFF08\u54FC\uFF09": {
        readonly en: "Tsukuyomi-chan (hum)";
    };
    readonly "\u300C{c}\u300D\u6362\u6210\uFF1A{gmName}": {
        readonly en: "“{c}” replaced by: {gmName}";
    };
    readonly "\u8FD9\u4E00\u884C\u4EA4\u7ED9\u4E86\u65B0\u58F0\u90E8\uFF1A{c}": {
        readonly en: "This line now belongs to a new part: {c}";
    };
    readonly "\u52A0\u4E86\u4E00\u4E2A\u58F0\u90E8\uFF1A{c}": {
        readonly en: "Added a part: {c}";
    };
    readonly "\u52A0\u4E86\u4E00\u4E2A\u58F0\u90E8\uFF1A{c}\uFF08\u76EE\u5F55\u8FD8\u5F00\u7740\uFF0C\u53EF\u4EE5\u63A5\u7740\u6362\uFF09": {
        readonly en: "Added a part: {c} (the catalog stays open — keep switching if you like)";
    };
    readonly "\u300C{extras}\u300D\u6362\u6210\uFF1A{name}": {
        readonly en: "“{extras}” replaced by: {name}";
    };
    readonly "\u300C{name}\u300D\u7684\u58F0\u97F3\u6CA1\u80FD\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF08\u7A7A\u95F4\u4E0D\u591F\uFF0C\u6216\u8FD9\u4E2A\u6D4F\u89C8\u5668\u4E0D\u8BA9\u5B58\uFF09\uFF1A\u8FD9\u6B21\u6253\u5F00\u91CC\u80FD\u54CD\uFF1B\u4E0B\u6B21\u8981\u4ECE\u300C{name2}\u300D\u6587\u4EF6\u627E\u3002\u60F3\u8BA9\u6B4C\u81EA\u5DF1\u5E26\u7740\u5B83\uFF1A\u6587\u4EF6\u83DC\u5355\u300C\u5168\u90E8\u6253\u5305\u8FDB\u6B4C\u300D\u3002": {
        readonly en: "The sound of “{name}” couldn't be kept on this device (out of space, or the browser doesn't allow it): it works this session; next time, find it from the “{name2}” file. To have the song carry it: menu “Pack everything into the song”.";
    };
    readonly 里面没有乐器: {
        readonly en: "No instruments inside";
    };
    readonly "\u8BFB\u4E0D\u4E86\u300C{name}\u300D\uFF1A{Error}": {
        readonly en: "Can't read “{name}”: {Error}";
    };
    readonly "{name}\uFF08\u6CA1\u4EBA\u80FD\u6F14\uFF09": {
        readonly en: "{name} (nobody can perform it)";
    };
    readonly "\u300C{rn}\u300D\u590D\u5236\u4E86\u4E00\u4EFD\uFF1A{who}": {
        readonly en: "“{rn}”: duplicated {who}";
    };
    readonly "\u300C{rn}\u300D\u62F7\u6765\u4E86\u300C{from}\u300D\u7684\uFF1A{who}": {
        readonly en: "“{rn}”: copied {who} from “{from}”";
    };
    readonly "\u6362\u6210\u300C{who}\u300D": {
        readonly en: "Changed to “{who}”";
    };
    readonly "\u300C{rn}\u300D\u9000\u6389\u4E00\u4F4D\u5019\u9009": {
        readonly en: "“{rn}” dropped a candidate";
    };
    readonly 新声部: {
        readonly en: "New part";
    };
    readonly "\uFF08\u6CA1\u4EBA\u4E0A\u573A\uFF09": {
        readonly en: "(nobody on stage)";
    };
    readonly "{id} \u589E\u76CA {p}{p2} dB": {
        readonly en: "{id} gain {p}{p2} dB";
    };
    readonly "{id} \u58F0\u50CF {pan}": {
        readonly en: "{id} pan {pan}";
    };
    readonly 中: {
        readonly en: "C";
    };
    readonly "\u5DE6 {p}": {
        readonly en: "L {p}";
    };
    readonly "\u53F3 {p}": {
        readonly en: "R {p}";
    };
    readonly "\u603B\u8F68\u589E\u76CA {p}{p2} dB": {
        readonly en: "Master gain {p}{p2} dB";
    };
    readonly "\u6BCD\u7EBF\u9650\u5E45{on}": {
        readonly en: "Bus limiter{on}";
    };
    readonly 旁通: {
        readonly en: "Bypass";
    };
    readonly 取消旁通: {
        readonly en: "Un-bypass";
    };
    readonly "\u6DF7\u97F3\u8F68 {n}": {
        readonly en: "Bus {n}";
    };
    readonly "\u52A0{name}": {
        readonly en: "Add {name}";
    };
    readonly "\u5220{name}": {
        readonly en: "Delete {name}";
    };
    readonly "\u6539\u540D\u300C{name}\u300D": {
        readonly en: "Rename “{name}”";
    };
    readonly "{extras} \u5F80{p}\u632A": {
        readonly en: "Move {extras} {p}";
    };
    readonly 前: {
        readonly en: "earlier";
    };
    readonly 后: {
        readonly en: "later";
    };
    readonly "{extras} \u589E\u76CA {p}{p2} dB": {
        readonly en: "{extras} gain {p}{p2} dB";
    };
    readonly "{extras} \u58F0\u50CF": {
        readonly en: "{extras} pan";
    };
    readonly "{track} \u51FA\u5230 {to}": {
        readonly en: "{track} output to {to}";
    };
    readonly "\u300C{next}\u300D\u6362\u4EBA\uFF1A{next2}": {
        readonly en: "“{next}” performer change: {next2}";
    };
    readonly 作者栏: {
        readonly en: "Credits";
    };
    readonly "\u51E0\u884C\u90FD\u884C\uFF0C\u7167\u5199\u7684\u663E\u793A\u5728\u7EB8\u4E0A\uFF08\u6807\u9898\u4E0B\u9762\u9760\u53F3\uFF09": {
        readonly en: "Any number of lines, shown as written on the sheet (right-aligned under the title)";
    };
    readonly "\u53EF\u4E0D\u586B\u3002\u5B58\u8FDB MusicXML\u300C\u5370\u5728\u9875\u9762\u4E0A\u7684\u5B57\u300D\uFF0C\u522B\u7684\u4E50\u8C31\u8F6F\u4EF6\u6253\u5F00\u4E5F\u5728\u7EB8\u4E0A\u3002": {
        readonly en: "Optional. Saved as MusicXML page text, so other score software shows it too.";
    };
    readonly "\u8BB8\u53EF\uFF08\u53EF\u9009\uFF1B\u4F60\u5199\u7684\u8FD9\u90E8\u5206\uFF1A\u8BCD / \u66F2 / \u7F16\uFF09": {
        readonly en: "License (optional; for your part: lyrics / music / arrangement)";
    };
    readonly "\u4E0D\u5199\uFF1A\u6CD5\u5F8B\u9ED8\u8BA4 = \u4FDD\u7559\u6240\u6709\u6743\u5229\uFF08\u522B\u4EBA\u7528\u8981\u5148\u95EE\u4F60\uFF09": {
        readonly en: "Not written: the legal default = all rights reserved (others must ask you first)";
    };
    readonly "\u672A\u58F0\u660E\uFF08\u9ED8\u8BA4\uFF09": {
        readonly en: "Not stated (default)";
    };
    readonly "\u7A7A\u7740 = \u672A\u58F0\u660E\uFF08\u6CD5\u5F8B\u9ED8\u8BA4\u5C31\u662F\u4FDD\u7559\u6240\u6709\u6743\u5229\uFF09\uFF1B\u4E5F\u53EF\u4EE5\u81EA\u5DF1\u5199": {
        readonly en: "Empty = not stated (the legal default is all rights reserved); or write your own";
    };
    readonly "\u4ECE\u7D27\u5230\u677E\u6392\uFF1BCC \u90A3\u51E0\u4E2A\u53D1\u51FA\u53BB\u4EE5\u540E\u5BF9\u5DF2\u7ECF\u53D1\u51FA\u53BB\u7684\u6536\u4E0D\u56DE\u3002\u5B58\u8FDB MusicXML \u7684 &lt;rights&gt;\uFF1B\u5BFC\u51FA mp3 \u65F6\u8FDE\u540C\u7F72\u540D\u5199\u8FDB\u6587\u4EF6\u7684\u6807\u7B7E\u91CC\u3002": {
        readonly en: "Listed strictest to loosest; once published under a CC license, published copies can't be taken back. Saved in MusicXML &lt;rights&gt;; written into the file tags with the credits when exporting mp3.";
    };
    readonly "\u8DDF\u7740\u8FD9\u9996\u6B4C\u5B58\uFF1A\u8FDB\u6B4C\u3001\u80FD\u64A4\u9500\uFF0C\u5BFC\u51FA\u7684 PDF \u7167\u8FD9\u91CC\u5370\u3002": {
        readonly en: "Saved with this song: it goes into the song, can be undone, and the exported PDF prints it this way.";
    };
    readonly "\u8DDF\u7740\u8FD9\u9996\u6B4C\u7684\u89C6\u56FE\u5B58\uFF1A\u5B58\u7684\u65F6\u5019\u987A\u624B\u5E26\u4E0A\uFF0C\u4E0D\u7B97\u6539\u52A8\u3001\u4E0D\u8FDB\u64A4\u9500\u3002": {
        readonly en: "Saved with this song's view: it rides along when you save, but doesn't count as a change and isn't in undo.";
    };
    readonly "\u53EA\u5728\u8FD9\u6B21\u6253\u5F00\u91CC\u6709\u6548\uFF0C\u4E0D\u8FDB\u6B4C\u3002": {
        readonly en: "Only for this session; not saved in the song.";
    };
    readonly 视图: {
        readonly en: "View";
    };
    readonly "\u9875\u9762\uFF08\u5206\u9875\uFF0C\u548C\u5370\u51FA\u6765\u4E00\u6837\uFF09": {
        readonly en: "Page (paged, same as print)";
    };
    readonly "\u8FDE\u7EED\uFF08\u4E0D\u5206\u9875\uFF09": {
        readonly en: "Continuous (no page breaks)";
    };
    readonly "\u6A2A\u5377\uFF08\u4E0D\u6298\u884C\uFF0C\u5F80\u53F3\u6EDA\uFF09": {
        readonly en: "Scroll (no line breaks, scroll right)";
    };
    readonly "\u53EA\u5F71\u54CD\u5C4F\u5E55\u4E0A\u600E\u4E48\u770B\uFF1A\u6253\u5370\u548C\u5BFC\u51FA\u6C38\u8FDC\u6309\u7EB8\u5206\u9875\u3002": {
        readonly en: "Only changes how it looks on screen: printing and export always paginate by paper.";
    };
    readonly 页面: {
        readonly en: "Page";
    };
    readonly "\u6309\u7EB8\uFF08A4 / A5\uFF09\u7684\u771F\u5B9E\u9AD8\u5EA6\u65AD\u9875\uFF0C\u548C\u5370\u51FA\u6765\u7684\u4E00\u6837": {
        readonly en: "Breaks pages at the real paper height (A4 / A5), same as the printout";
    };
    readonly 连续: {
        readonly en: "Continuous";
    };
    readonly "\u4E0D\u65AD\u9875\uFF0C\u6BCF\u4E00\u884C\u548C\u9875\u9762\u89C6\u56FE\u4E00\u6837\uFF0C\u53EA\u662F\u4E0D\u5206\u9875": {
        readonly en: "No page breaks; every line is the same as in Page view, just not paged";
    };
    readonly 横卷: {
        readonly en: "Horizontal scroll";
    };
    readonly "\u6BCF\u5F20\u7EB8\u4E00\u884C\u3001\u4E00\u76F4\u5F80\u53F3\uFF0C\u6A2A\u7740\u6EDA\uFF1B\u58F0\u90E8\u540D\u9489\u5728\u5DE6\u8FB9": {
        readonly en: "One line per sheet, running right and scrolled sideways; part names stay pinned at the left";
    };
    readonly 谱种: {
        readonly en: "Notation";
    };
    readonly 五线谱: {
        readonly en: "Staff";
    };
    readonly 简谱: {
        readonly en: "Numbered (jianpu)";
    };
    readonly 字母谱: {
        readonly en: "Letter names";
    };
    readonly 按音高画在五条线上: {
        readonly en: "Pitches drawn on the five lines";
    };
    readonly "\u6570\u5B57 1\u20137\uFF08\u9996\u8C03\uFF09": {
        readonly en: "Digits 1–7 (movable do)";
    };
    readonly "\u5B9E\u9645\u7684\u97F3\u540D C D E F G A B\uFF0C\u53F3\u4E0A\u89D2\u5199\u5347\u964D\u53F7\u3001\u53F3\u4E0B\u89D2\u5199\u516B\u5EA6\uFF08\u4E2D\u592E C = C4\uFF09": {
        readonly en: "Actual note names C D E F G A B, sharp/flat at the top right, octave at the bottom right (middle C = C4)";
    };
    readonly 移调辅助: {
        readonly en: "Transposition aid";
    };
    readonly "\u4E0D\u7528\uFF08\u7167\u5199\u7684\u8C03\uFF09": {
        readonly en: "Off (as written)";
    };
    readonly "\u6309 C \u8C03\u770B": {
        readonly en: "Read in C";
    };
    readonly "\u7B80\u8C31\u672C\u6765\u5C31\u662F\u9996\u8C03\uFF081 = \u8FD9\u4E2A\u8C03\u7684\u4E3B\u97F3\uFF09\uFF0C\u7528\u4E0D\u4E0A\u300C\u79FB\u8C03\u8F85\u52A9\u300D\uFF1B\u5B58\u7740\u7684\u9009\u62E9\u4E0D\u52A8\uFF0C\u5207\u56DE\u4E94\u7EBF\u8C31\u7167\u65E7\u3002": {
        readonly en: "Numbered notation is already movable-do (1 = the key's tonic), so the transposition aid doesn't apply; your choice is kept and works again on staff.";
    };
    readonly "\u5B57\u6BCD\u8C31\u5199\u7684\u662F\u5B9E\u9645\u7684\u97F3\u540D\uFF0C\u7528\u4E0D\u4E0A\u300C\u79FB\u8C03\u8F85\u52A9\u300D\uFF1B\u5B58\u7740\u7684\u9009\u62E9\u4E0D\u52A8\uFF0C\u5207\u56DE\u4E94\u7EBF\u8C31\u7167\u65E7\u3002": {
        readonly en: "Letter notation writes the actual note names, so the transposition aid doesn't apply; your choice is kept and works again on staff.";
    };
    readonly "\u6309\u5B9E\u9645\u7684\u8C03\u753B\u8C31\uFF0C\u952E\u4E0A\u5927\u5B57\u5199\u97F3\u540D": {
        readonly en: "Draw in the actual key; big key labels show note names";
    };
    readonly "\u8C31\u6362\u5230 C \u8C03\u753B\u3001\u6BCF\u4E2A\u8C03\u53F7\u4E0A\u65B9\u5199\u300C1=\u539F\u6765\u7684\u8C03\u300D\uFF0C\u952E\u4E0A\u5927\u5B57\u5199\u7EA7\u6570\uFF1B\u952E\u7684\u4F4D\u7F6E\u4E0D\u52A8": {
        readonly en: "Draw the score in C with “1=original key” above every key signature; big key labels show degrees; the keys stay where they are";
    };
    readonly "\u4E2D\u592E C \u53EB": {
        readonly en: "Middle C is";
    };
    readonly "C{n}\uFF08\u56FD\u9645\u901A\u7528\uFF09": {
        readonly en: "C{n} (international)";
    };
    readonly "\u5B57\u6BCD\u8C31\u53F3\u4E0B\u89D2\u7684\u516B\u5EA6\u6570\u5B57\u4ECE\u54EA\u513F\u6570\u3002": {
        readonly en: "Where the octave numbers at the bottom right of letter names count from.";
    };
    readonly 和弦辅助: {
        readonly en: "Chord aid";
    };
    readonly 标级数: {
        readonly en: "Show degrees";
    };
    readonly 不标: {
        readonly en: "Don’t show";
    };
    readonly "\u53E0\u5728\u4E00\u8D77\u7684\u548C\u5F26\u4E0A\u65B9\u5199\u5B83\u5728\u8FD9\u4E2A\u8C03\u91CC\u662F\u51E0\u7EA7\uFF08V7\u3001ii\u3001\u266DVII\u3001I/3\u2026\uFF09\uFF1B\u70B9\u5B83\u770B\u5168\u90E8\u5019\u9009": {
        readonly en: "Write the degree of stacked chords in this key above them (V7, ii, ♭VII, I/3…); tap one to see all candidates";
    };
    readonly 演奏法和表情: {
        readonly en: "Articulations & dynamics";
    };
    readonly 显示: {
        readonly en: "Show";
    };
    readonly 不显示: {
        readonly en: "Hide";
    };
    readonly "\u4E0D\u663E\u793A = \u952E\u76D8\u300C\u6F14\u594F\u6CD5\u300D\u300C\u529B\u5EA6\u300D\u4E24\u9875\u4E0A\u7684\u4E1C\u897F\u90FD\u4E0D\u753B\u3001\u4E0D\u5360\u5730\u65B9\uFF08\u8DF3\u97F3\u3001\u91CD\u97F3\u3001\u8FDE\u7EBF\u3001\u547C\u5438\u3001\u529B\u5EA6\u3001\u6E10\u5F3A\u6E10\u5F31\u2026\uFF09\uFF0C\u884C\u8DDF\u7740\u53D8\u77EE\uFF1B\u7B2C\u4E00\u884C\u8C31\u5934\u90A3\u4E00\u884C\u7684\u53F3\u7AEF\u6709\u4E00\u884C\u6DE1\u5B57\u300C\u6F14\u594F\u6CD5\u548C\u8868\u60C5\uFF1A\u4E0D\u663E\u793A\u300D\uFF08\u4E0D\u5370\uFF09\uFF0C\u70B9\u5B83\u56DE\u5230\u8FD9\u91CC\u3002\u53EA\u7BA1\u753B\uFF1A\u64AD\u653E\u7167\u5199\u7684\u6765\uFF0C\u6B4C\u91CC\u7684\u8BB0\u53F7\u4E00\u4E2A\u4E0D\u52A8\uFF1BPDF \u7167\u773C\u524D\u7684\u6837\u5B50\u5370\u3002": {
        readonly en: "Hide = nothing from the keyboard's Articulation and Dynamics pages is drawn or takes room (staccato, accents, slurs, breaths, dynamics, hairpins…), so lines get shorter; a faint “Articulations & dynamics: hidden” at the right end of the first heading line (not printed) brings you back here. Display only: playback follows what's written and no mark in the song changes; the PDF prints what you see.";
    };
    readonly 只看一号轨: {
        readonly en: "First track only";
    };
    readonly 都看: {
        readonly en: "Show all";
    };
    readonly "\u53EA\u770B\u300C{song}\u300D": {
        readonly en: "Only “{song}”";
    };
    readonly "\u901F\u5EA6\u3001\u98CE\u683C\u3001\u53CD\u590D\u5199\u5728\u6700\u4E0A\u9762\u90A3\u4F4D\u8EAB\u4E0A\uFF1B\u522B\u7684\u58F0\u90E8\u7F29\u6210\u7EC6\u884C\u3002": {
        readonly en: "Tempo, style and repeats are written on the top part; the other parts shrink to thin lines.";
    };
    readonly 纸张: {
        readonly en: "Paper";
    };
    readonly "{paper}\uFF08{note}\uFF09": {
        readonly en: "{paper} ({note})";
    };
    readonly 其他: {
        readonly en: "Other";
    };
    readonly "\u6574\u9996\u6B4C\u4E00\u5F20\u7EB8\u3002\u7EB8\u8D8A\u5927\u4E00\u884C\u653E\u7684\u5C0F\u8282\u8D8A\u591A\uFF1B\u5C4F\u5E55\u653E\u5F97\u4E0B\u5C31\u7167\u7EB8\u6392\u3002\u4E0D\u6253\u5370\u7684\u65F6\u5019\u4E0D\u5206\u9875\u3002": {
        readonly en: "One paper size for the whole song. Bigger paper fits more bars per line; if the screen fits, it's laid out as on paper. No page breaks unless printing.";
    };
    readonly 音符密度: {
        readonly en: "Note density";
    };
    readonly "\u81EA\u5B9A\u4E49\uFF08{mm} \u6BEB\u7C73\uFF09": {
        readonly en: "Custom ({mm} mm)";
    };
    readonly "\u540C\u4E00\u5F20\u7EB8\u4E0A\u6392\u5F97\u677E\u8FD8\u662F\u5BC6\uFF1A\u97F3\u7B26\u591A\u5927\u3001\u884C\u8DDD\u3001\u97F3\u548C\u97F3\u4E4B\u95F4\u7684\u8DDD\u79BB\u4E00\u8D77\u53D8\u3002": {
        readonly en: "How loosely or tightly a page is set: note size, line spacing and the space between notes change together.";
    };
    readonly 自定义: {
        readonly en: "Custom";
    };
    readonly "\u522B\u7684\u8F6F\u4EF6\u5B58\u7684\u8C31\u5E26\u7740\u81EA\u5DF1\u7684\u8C31\u9AD8\uFF0C\u7167\u5B83\u6392": {
        readonly en: "The score from another program carries its own staff size; set it that way";
    };
    readonly "\u5355\u884C\u7684\u8C31\u3001\u7ED9\u65B0\u624B\u770B\u7684\u5E38\u7528\u8212\u9002\uFF1B\u58F0\u90E8\u591A\u7684\u603B\u8C31\u5E38\u7528\u7D27\u51D1\u3002\u5B58\u8FDB MusicXML \u7684 scaling \u548C\u884C\u8DDD\uFF0C\u522B\u7684\u8F6F\u4EF6\u6253\u5F00\u4E5F\u4E00\u6837\u3002": {
        readonly en: "Single-line music and music for beginners commonly use Comfortable; scores with many parts commonly use Compact. Saved into MusicXML's scaling and spacing, so other programs open it the same way.";
    };
    readonly 屏幕放不下纸的时候: {
        readonly en: "When the screen can't fit the sheet";
    };
    readonly 不折行: {
        readonly en: "Don't wrap";
    };
    readonly 折行: {
        readonly en: "Wrap";
    };
    readonly "\u6574\u5F20\u7EB8\u7F29\u5C0F\uFF0C\u884C\u548C\u7EB8\u4E0A\u4E00\u6837": {
        readonly en: "Shrink the whole sheet; lines match the paper";
    };
    readonly "\u6309\u5C4F\u5E55\u5BBD\u6392\uFF0C\u8C31\u5927\u4E00\u70B9": {
        readonly en: "Lay out to screen width, with larger staves";
    };
    readonly 小节号: {
        readonly en: "Bar numbers";
    };
    readonly 每行开头: {
        readonly en: "Start of each line";
    };
    readonly 不印: {
        readonly en: "Don't print";
    };
    readonly "\u6BCF\u884C\u6700\u4E0A\u9762\u90A3\u6761\u8C31\u7684\u5DE6\u4E0A\u89D2\uFF0C\u5C0F\u5B57\uFF1B\u6BCF\u5F20\u7EB8\u4ECE 1 \u6570\uFF0C\u5F31\u8D77\u7B97 0": {
        readonly en: "Small, top-left of each line's top staff; each sheet counts from 1, a pickup counts as 0";
    };
    readonly 歌词排法: {
        readonly en: "Lyric spacing";
    };
    readonly 按节奏: {
        readonly en: "By rhythm";
    };
    readonly 按歌词: {
        readonly en: "By lyrics";
    };
    readonly "\u97F3\u7684\u4F4D\u7F6E\u53EA\u770B\u65F6\u503C\uFF0C\u6253\u5B57\u65F6\u97F3\u7B26\u4E0D\u52A8\uFF1B\u6B4C\u8BCD\u8BA9\u8DEF\uFF1A\u501F\u65C1\u8FB9\u7684\u7A7A \u2192 \u8FD9\u4E00\u884C\u4E00\u8D77\u7F29\u4E00\u70B9 \u2192 \u8FD8\u653E\u4E0D\u4E0B\u753B\u7070": {
        readonly en: "Note positions depend only on duration, so notes stay put while you type; lyrics make room: borrow space nearby → shrink the whole line a little → grey out if it still doesn't fit";
    };
    readonly "\u957F\u7684\u5B57\u628A\u97F3\u63A8\u5F00\uFF08\u51FA\u7248\u8C31\u7684\u8001\u89C4\u77E9\uFF09": {
        readonly en: "Long words push notes apart (the traditional engraving rule)";
    };
    readonly 谱上的字: {
        readonly en: "Text on the score";
    };
    readonly 页面设置: {
        readonly en: "Page settings";
    };
    readonly "\u770B\u8C31\uFF1A\u8FD9\u5F20\u7EB8\u5728\u5C4F\u5E55\u4E0A\u600E\u4E48\u770B": {
        readonly en: "View: how this page looks on screen";
    };
    readonly "\u7248\u9762\uFF1A\u7EB8\u5F20\u548C\u97F3\u7B26\u5BC6\u5EA6": {
        readonly en: "Page: paper and note density";
    };
    readonly "\u4E2D\u592E C \u53EB C{n}": {
        readonly en: "Middle C = C{n}";
    };
    readonly 显示演奏法和表情: {
        readonly en: "Show articulations & dynamics";
    };
    readonly 不显示演奏法和表情: {
        readonly en: "Hide articulations & dynamics";
    };
    readonly "\u8C31\u4E0A\u7684\u5B57\uFF1A{l}": {
        readonly en: "Text on the score: {l}";
    };
    readonly "\u5C0F\u6708\u76F8\u5FF5\u51FA\u6765 {n} \u4E2A\u97F3\u8282\u3001\u8C31\u4E0A {n2} \u4E2A\uFF0C\u5BF9\u4E0D\u4E0A\uFF08\u5531\u7684\u65F6\u5019\u4F1A\u62A5\u9519\uFF09\uFF1A": {
        readonly en: "Tsukuyomi-chan says {n} syllables but the score has {n2}, so they don't match (singing will report an error):";
    };
    readonly "\u5C0F\u6708\u76F8\u5FF5\u6210\uFF08\u97F3\u7D20 + \u58F0\u8C03\uFF09\uFF1A": {
        readonly en: "Tsukuyomi-chan reads it as (phonemes + tones):";
    };
    readonly "\u5C0F\u6708\u76F8\u5FF5\u6210\uFF1A": {
        readonly en: "Tsukuyomi-chan reads it as:";
    };
    readonly "\u8DDF\u7740\u754C\u9762\uFF08{lang}\uFF09": {
        readonly en: "Follow the interface ({lang})";
    };
    readonly "\u8F6F\u4EF6\u81EA\u5DF1\u5199\u5728\u8C31\u4E0A\u7684\u5B57\u7528\u54EA\u79CD\u8BED\u8A00\uFF1A\u6CA1\u8D77\u540D\u5B57\u7684\u58F0\u90E8\u5199\u4E50\u5668\u7684\u53EB\u6CD5\u3001\u7B80\u8C31\u9F13\u7684\u56FE\u4F8B\u3001\u300C\u7F16\u6392\u300D\u3001\u51FA\u58F0\u7684\u6362\u6C14\u300C\u5438 / \u6DF1\u5438\u300D\u3002\u6B4C\u8BCD\u3001\u6B4C\u540D\u3001\u4F5C\u8005\u680F\u3001\u4F60\u8D77\u7684\u58F0\u90E8\u540D\u7167\u5199\u7684\u5370\uFF0C\u4E0D\u7FFB\u3002\u8DDF\u7740\u754C\u9762 = \u8FD9\u53F0\u8BBE\u5907\u662F\u4EC0\u4E48\u8BED\u8A00\u5C31\u5370\u4EC0\u4E48\u8BED\u8A00\u3002": {
        readonly en: "Which language the app's own words on the score use: the instrument name of a part you haven't named, the drum legend in numbered notation, “Arrangement”, and the breath words “in / deep in”. Lyrics, the title, the credits and part names you typed are printed as written, never translated. Follow the interface = print in whatever language this device's interface is in.";
    };
    readonly "\u6253\u51FB\u4E50\u7684\u884C\u6CA1\u6709\u8C03\uFF1A\u5199\u7684\u97F3\u9AD8 = \u6572\u54EA\u4E2A\u9F13\uFF0C\u548C\u8C03\u53F7\u65E0\u5173\uFF08\u8C03\u53F7\u7559\u5728\u8C31\u91CC\uFF0C\u4E0D\u8D77\u4F5C\u7528\uFF09": {
        readonly en: "Percussion rows have no key: the written pitch says which drum is hit, not a pitch (the key signature stays in the score but does nothing)";
    };
    readonly 静音: {
        readonly en: "Muted";
    };
    readonly 独奏: {
        readonly en: "Solo";
    };
    readonly 只看它: {
        readonly en: "Only this";
    };
    readonly 不出声: {
        readonly en: "Silent";
    };
    readonly "{p}{p2}\uFF1A\u7A7A\u7740\u7684\u6B4C\u8BCD\u4F4D\u4E0D\u5F00\u6846\uFF1B\u5DF2\u7ECF\u5199\u4E86\u7684\u5B57\u70B9\u5F00\u80FD\u6539\u3001\u80FD\u5220": {
        readonly en: "{p}{p2}: empty lyric slots don't open a box; lyrics already written can still be tapped to edit or delete";
    };
    readonly "\uFF08\u5143\u97F3\u7248\uFF09\u53EA\u54FC": {
        readonly en: " (vowel version) only hums";
    };
    readonly 不唱歌词: {
        readonly en: " doesn't sing lyrics";
    };
    readonly "\u6B4C\u91CC\u53EA\u5269\u8FD9\u4E00\u4E2A\u58F0\u90E8\uFF0C\u5220\u4E0D\u4E86": {
        readonly en: "This is the only part left in the song; it can't be deleted";
    };
    readonly "\u300C{name}\u300D\u662F{secs}\u91CC\u552F\u4E00\u7684\u58F0\u90E8\uFF0C\u5220\u4E0D\u4E86\uFF1A\u5148\u7ED9\u8FD9\u51E0\u6BB5\u653E\u8FDB\u522B\u7684\u58F0\u90E8\uFF0C\u6216\u8005\u628A\u8FD9\u51E0\u6BB5\u6574\u6BB5\u5220\u6389": {
        readonly en: "“{name}” is the only part in {secs}, so it can't be deleted: first put another part into those sections, or delete those sections";
    };
    readonly "\u5220\u6389\u58F0\u90E8\u300C{name}\u300D": {
        readonly en: "Delete part “{name}”";
    };
    readonly "\u5220\u6389\u4E86\u300C{name}\u300D\uFF08\u5B83\u6CA1\u5199\u4E1C\u897F\uFF1B\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": {
        readonly en: "Deleted “{name}” (it hadn't written anything; undo brings it back)";
    };
    readonly "\u300C{p}\u300D{n} \u4E2A\u97F3": {
        readonly en: "“{p}”: {n} {n|note|notes}";
    };
    readonly "\u300C{p}\u300D\uFF08\u6CA1\u6709\u97F3\uFF0C\u53EA\u6709\u4F11\u6B62 / \u8BB0\u53F7\uFF09": {
        readonly en: "“{p}” (no notes, only rests / marks)";
    };
    readonly "\u5220\u6389\u58F0\u90E8\u300C{name}\u300D\uFF1F": {
        readonly en: "Delete the part “{name}”?";
    };
    readonly "\u5B83\u5199\u8FC7\u7684\uFF1A{list}\u3002\u8FDE\u540C\u6B4C\u8BCD\u3001\u8BB0\u53F7\u3001\u5B83\u7684\u4E50\u5668\u8BBE\u7F6E\u4E00\u8D77\u5220\u6389\uFF08\u80FD\u64A4\u9500\uFF0C\u4E00\u6B65\u5168\u627E\u56DE\uFF09\u3002": {
        readonly en: "What it wrote: {list}. Its lyrics, marks and instrument settings are deleted too (undo brings it all back in one step).";
    };
    readonly "\u5220\u6389\u4E86\u300C{name}\u300D\uFF08\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": {
        readonly en: "Deleted “{name}” (undo brings it back)";
    };
    readonly "\u7B2C {n} \u6BB5": {
        readonly en: "Section {n}";
    };
    readonly "\u300C{p}\u300D\u53EA\u6709\u300C{name}\u300D\u8FD9\u4E00\u4E2A\u58F0\u90E8\uFF0C\u5220\u4E0D\u4E86\uFF1A\u8FD9\u4E00\u6BB5\u6574\u6BB5\u4E0D\u8981 = \u7EB8\u9876\u300C\u22EF\u300D\u91CC\u5220\u8FD9\u4E00\u6BB5": {
        readonly en: "“{name}” is the only part in “{p}”, so it can't be deleted: to drop the whole section, use the ⋯ at the top of the sheet";
    };
    readonly "\u5DF2\u4ECE\u300C{p}\u300D\u5220\u6389\u300C{name}\u300D\uFF08\u5B83\u5728\u8FD9\u4E00\u6BB5\u6CA1\u5199\u4E1C\u897F\uFF09": {
        readonly en: "Deleted “{name}” from “{p}” (it hadn't written anything in this section)";
    };
    readonly "\u4ECE\u300C{p}\u300D\u5220\u6389\u300C{name}\u300D\uFF1F": {
        readonly en: "Delete “{name}” from “{p}”?";
    };
    readonly "\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684 {n} \u4E2A\u97F3\uFF0C\u8FDE\u540C\u6B4C\u8BCD\u3001\u8BB0\u53F7\u4E00\u8D77\u5220\u6389\u3002": {
        readonly en: "The {n} {n|note|notes} it wrote in this section {n|is|are} deleted, with their lyrics and marks.";
    };
    readonly "\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684\u4E1C\u897F\u4E00\u8D77\u5220\u6389\u3002": {
        readonly en: "What it wrote in this section is deleted.";
    };
    readonly "\u518D\u628A\u5B83\u653E\u8FDB\u8FD9\u4E00\u6BB5\u662F\u4E00\u884C\u7A7A\u7684\uFF1B\u8981\u627E\u56DE\u53EA\u80FD\u64A4\u9500\u3002": {
        readonly en: "Putting it back into this section gives an empty line; only undo brings the old one back.";
    };
    readonly "\u300C{p}\u300D\u6BB5\u7684\u300C{label}\u300D\u4EA4\u7ED9\u2026": {
        readonly en: "Hand “{label}” in section “{p}” to…";
    };
    readonly "\u5728\u300C{label}\u300D\u4E0A\u9762\u52A0": {
        readonly en: "Add above “{label}”";
    };
    readonly "\u5728\u300C{label}\u300D\u4E0B\u9762\u52A0": {
        readonly en: "Add below “{label}”";
    };
    readonly "\uFF08\u5BF9\u8C03\uFF09": {
        readonly en: " (swap)";
    };
    readonly "\uFF0B \u65B0\u58F0\u90E8\u2026": {
        readonly en: "＋ New part…";
    };
    readonly "\u53EA\u6539\u8FD9\u4E00\u6BB5\uFF1A\u97F3\u3001\u6B4C\u8BCD\u3001\u8BB0\u53F7\u90FD\u4E0D\u52A8\uFF0C\u6362\u4E00\u4E2A\u58F0\u90E8\u5531\uFF1B\u8DE8\u6BB5\u6309\u58F0\u90E8\u63A5\u8D77\u6765\u3002\u5BF9\u65B9\u5728\u8FD9\u4E00\u6BB5\u5DF2\u7ECF\u6709\u4E00\u884C = \u4E24\u884C\u5BF9\u8C03\u3002": {
        readonly en: "This section only: notes, lyrics and marks stay, another part plays them; across sections, lines join up by part. If the other part already has a row here, the two rows swap.";
    };
    readonly "\u53EA\u52A0\u5728\u8FD9\u4E00\u6BB5\uFF08\u522B\u7684\u6BB5\u7167\u65E7\uFF09\u3002": {
        readonly en: "Only added to this section (others unchanged).";
    };
    readonly "\u4ECE\u300C{p}\u300D\u5220\u6389\uFF08\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684\u4E00\u8D77\u5220\uFF0C\u5148\u95EE\uFF09": {
        readonly en: "Delete from “{p}” (what it wrote in that section is deleted; asks first)";
    };
    readonly "\u653E\u8FDB\u300C{p}\u300D\uFF08\u4E00\u884C\u7A7A\u7684\uFF09": {
        readonly en: "Put into “{p}” (an empty line)";
    };
    readonly "\u8D77\u4E2A\u540D\u5B57\uFF08\u8C31\u4E0A\u539F\u6837\u5199\u3001\u4E0D\u7FFB\u8BD1\uFF09\uFF1B\u7A7A\u7740 = \u5199\u8FD9\u4EF6\u4E50\u5668\u7684\u53EB\u6CD5": {
        readonly en: "Give it a name (printed as typed, never translated); empty = the instrument's name";
    };
    readonly "\u6362\u4E50\u5668\uFF08\u8FDB\u4E50\u5668\u76EE\u5F55\uFF09": {
        readonly en: "Change instrument (opens the instrument catalog)";
    };
    readonly 没人上场: {
        readonly en: "Nobody on stage";
    };
    readonly "\u8FD9\u4E00\u884C\u7684\u66F4\u591A\uFF1A\u4E0A\u4E0B\u632A\u3001\u52A0\u3001\u4EA4\u7ED9\u3001\u4E50\u5668\u8BBE\u7F6E\u3001\u5220\u9664": {
        readonly en: "More for this row: move, add, hand over, instrument settings, delete";
    };
    readonly 更多: {
        readonly en: "More";
    };
    readonly 上移: {
        readonly en: "Move up";
    };
    readonly 下移: {
        readonly en: "Move down";
    };
    readonly "\u5728\u8FD9\u4E00\u884C\u4E0A\u9762\u52A0\u4E00\u4E2A\u58F0\u90E8\uFF08\u5DF2\u6709\u7684\u6216\u65B0\u7684\uFF1B\u53EA\u52A0\u5728\u8FD9\u4E00\u6BB5\uFF09": {
        readonly en: "Add a part above this row (existing or new; this section only)";
    };
    readonly "\u5728\u4E0A\u9762\u52A0\u2026": {
        readonly en: "Add above…";
    };
    readonly "\u5728\u8FD9\u4E00\u884C\u4E0B\u9762\u52A0\u4E00\u4E2A\u58F0\u90E8\uFF08\u5DF2\u6709\u7684\u6216\u65B0\u7684\uFF1B\u53EA\u52A0\u5728\u8FD9\u4E00\u6BB5\uFF09": {
        readonly en: "Add a part below this row (existing or new; this section only)";
    };
    readonly "\u5728\u4E0B\u9762\u52A0\u2026": {
        readonly en: "Add below…";
    };
    readonly "\u53EA\u6709\u8FD9\u4E00\u6BB5\uFF1A\u8FD9\u4E00\u884C\u7684\u97F3\u3001\u6B4C\u8BCD\u3001\u8BB0\u53F7\u539F\u6837\u4EA4\u7ED9\u53E6\u4E00\u4E2A\u58F0\u90E8\u6F14\uFF08\u7528\u5B83\u7684\u4E50\u5668\u548C\u6DF7\u97F3\u53F0\u90A3\u4E00\u6761\uFF09": {
        readonly en: "This section only: hand this row’s notes, lyrics and marks to another part (its instrument and its mixer strip)";
    };
    readonly "\u300C{p}\u300D\u6BB5\u4EA4\u7ED9\u2026": {
        readonly en: "Hand section “{p}” to…";
    };
    readonly "\u653E\u8FDB\u300C{p}\u300D": {
        readonly en: "Put into “{p}”";
    };
    readonly "\u4E50\u5668\u8BBE\u7F6E\u2026": {
        readonly en: "Instrument settings…";
    };
    readonly "\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684\u4E00\u8D77\u5220\u6389\uFF08\u5148\u95EE\uFF1B\u80FD\u64A4\u9500\uFF09\u3002\u522B\u7684\u6BB5\u7167\u65E7": {
        readonly en: "Deletes what it wrote in this section (asks first; undo works). Other sections stay as they are";
    };
    readonly "\u4ECE\u300C{p}\u300D\u5220\u6389": {
        readonly en: "Delete from “{p}”";
    };
    readonly "\u6574\u4E2A\u58F0\u90E8\u5220\u6389\uFF1A\u6BCF\u4E00\u6BB5\u91CC\u5B83\u5199\u7684\u3001\u5B83\u7684\u4E50\u5668\u8BBE\u7F6E\u4E00\u8D77\u5220\uFF08\u5148\u95EE\uFF1B\u80FD\u64A4\u9500\uFF09": {
        readonly en: "Delete the whole part: what it wrote in every section and its instrument settings (asks first; undo works)";
    };
    readonly "\u5220\u6389\u58F0\u90E8\u2026": {
        readonly en: "Delete part…";
    };
    readonly 声部管理: {
        readonly en: "Parts";
    };
    readonly "\u5C0F\u683C = \u5728\u54EA\u51E0\u6BB5\uFF08\u4EAE = \u6709\uFF1B\u5708\u7740\u7684 = \u5149\u6807\u8FD9\u4E00\u6BB5\uFF09\uFF1B\u22EF = \u4E0A\u4E0B\u632A\u3001\u52A0\u3001\u4EA4\u7ED9\u3001\u5220\u9664": {
        readonly en: "Chips = which sections (lit = has it; ringed = the cursor's section); ⋯ = move, add, hand over, delete";
    };
    readonly "\u65B0\u58F0\u90E8\u53EA\u52A0\u5728\u5149\u6807\u8FD9\u4E00\u6BB5\uFF08\u522B\u7684\u6BB5\u7167\u65E7\uFF09\uFF0C\u52A0\u5B8C\u6311\u4E50\u5668": {
        readonly en: "The new part goes only into the cursor’s section (others unchanged); then pick an instrument";
    };
    readonly "\uFF0B \u65B0\u58F0\u90E8": {
        readonly en: "＋ New part";
    };
    readonly "\u89D2\u8272\u6539\u540D\uFF1A{n}": {
        readonly en: "Role renamed: {n}";
    };
    readonly "\u540D\u5B57\u6E05\u6389\u4E86\uFF1A\u8DDF\u7740\u4E50\u5668\u5199\u300C{inst}\u300D": {
        readonly en: "Name cleared: shows the instrument, “{inst}”";
    };
    readonly "\u8FD9\u4E00\u6BB5\u7684\u8FD9\u4E00\u884C\u4EA4\u7ED9\u4E86\u300C{name}\u300D": {
        readonly en: "This section’s row was handed to “{name}”";
    };
    readonly 这一段: {
        readonly en: "This section";
    };
    readonly "\u6539\u66F2\u6BB5\u540D\u2026": {
        readonly en: "Rename section…";
    };
    readonly "\u9690\u85CF = \u4E0D\u653E\u3001\u4E0D\u8FDB\u538B\u5E73\u4EF6\uFF1B\u8C31\u4E0A\u6298\u53E0\u7740\uFF0C\u7FFB\u9875\u80FD\u8FDB\u53BB": {
        readonly en: "Hidden = not played and not in the flattened copy; collapsed on the score, reachable by paging";
    };
    readonly "\u663E\u793A\uFF08\u73B0\u5728\u9690\u85CF\u7740\uFF09": {
        readonly en: "Show (hidden now)";
    };
    readonly "\u9690\u85CF\uFF08\u4E0D\u653E\uFF09": {
        readonly en: "Hide (don't play)";
    };
    readonly "\u5220\u8FD9\u4E00\u6BB5\u2026": {
        readonly en: "Delete this section…";
    };
    readonly 插入: {
        readonly en: "Insert";
    };
    readonly "\u65B0\u7684\u4E00\u6BB5\u63D2\u5728\u5B83\u524D\u9762\uFF08\u8C31\u5934\u7167\u6284\u524D\u4E00\u6BB5\u7ED3\u5C3E\u7684\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\uFF09": {
        readonly en: "Insert a new section before it (its header copies the key / time / tempo where the previous section ends)";
    };
    readonly 在上面插一段: {
        readonly en: "Insert above";
    };
    readonly 新的一段接在它后面: {
        readonly en: "Insert a new section after it";
    };
    readonly 在下面插一段: {
        readonly en: "Insert below";
    };
    readonly "\u6574\u6BB5\uFF08\u6240\u6709\u58F0\u90E8\u7684\u97F3\u3001\u8BB0\u53F7\u3001\u6B4C\u8BCD\uFF09\u7167\u6284\u4E00\u4EFD\uFF0C\u63A5\u5728\u5B83\u540E\u9762": {
        readonly en: "Copy the whole section (all parts' notes, marks and lyrics) right after it";
    };
    readonly 复制这一段: {
        readonly en: "Duplicate section";
    };
    readonly 编辑: {
        readonly en: "Edit";
    };
    readonly "\u8FD9\u5F20\u7EB8 / \u6574\u9996\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u79FB\u8C03\u3001\u8F6C\u8C03\uFF08\u8C03\u53F7\u8DDF\u7740\u632A\uFF09": {
        readonly en: "Transpose / change key for all parts on this sheet or the whole song (key signature moves too)";
    };
    readonly "\u79FB\u8C03 / \u8F6C\u8C03\u2026": {
        readonly en: "Transpose / change key…";
    };
    readonly "\u66F2\u6BB5 = \u4E00\u5F20\u7EB8\uFF1A\u6BCF\u4E00\u6BB5\u662F\u4E00\u4E2A\u65B0\u7684\u5F00\u59CB\uFF0C\u5404\u58F0\u90E8\u5728\u8FD9\u91CC\u91CD\u65B0\u5BF9\u9F50\uFF1B\u4E00\u6BB5\u91CC\u8981\u54EA\u4E9B\u58F0\u90E8\u968F\u5B83\uFF08\u6BCF\u6BB5\u5E95\u4E0B\u300C\uFF0B \u58F0\u90E8\u300D\uFF09\u3002": {
        readonly en: "Section = one sheet: each section is a fresh start where all parts line up again; each section has its own parts (use ＋ Part under it).";
    };
    readonly "{name} \u526F\u672C": {
        readonly en: "{name} copy";
    };
    readonly 曲段: {
        readonly en: "Section";
    };
    readonly "\u590D\u5236\u4E86\u4E00\u6BB5\uFF08\u63A5\u5728\u540E\u9762\uFF09": {
        readonly en: "Section duplicated (placed right after)";
    };
    readonly "\u8FD9\u5F20\u7EB8\u663E\u793A\u4E86\uFF08\u4F1A\u653E\uFF09": {
        readonly en: "This sheet is shown (will play)";
    };
    readonly "\u8FD9\u5F20\u7EB8\u9690\u85CF\u4E86\uFF08\u4E0D\u653E\uFF09": {
        readonly en: "This sheet is hidden (won't play)";
    };
    readonly "\u5220\u6389\u300C{p}\u300D\uFF1F": {
        readonly en: "Delete “{p}”?";
    };
    readonly "\u8FD9\u5F20\u7EB8\u4E0A\u6240\u6709\u58F0\u90E8\u5199\u7684\u4E1C\u897F\u4E00\u8D77\u5220\u6389\uFF08\u80FD\u64A4\u9500\uFF1A\u64A4\u9500 / Ctrl+Z\uFF09\u3002": {
        readonly en: "Everything written in all parts on this sheet is deleted (can be undone: Undo / Ctrl+Z).";
    };
    readonly "\u52A0\u8FDB\u300C{p}\u300D": {
        readonly en: "Add to “{p}”";
    };
    readonly "\u5DF2\u6709\u7684\u58F0\u90E8\uFF0C\u53EA\u52A0\u8FDB\u8FD9\u4E00\u6BB5\uFF08\u522B\u7684\u6BB5\u7167\u65E7\uFF09": {
        readonly en: "An existing part, added to this section only (others unchanged)";
    };
    readonly "\u65B0\u7684\u4E00\u4E2A\u58F0\u90E8\uFF0C\u53EA\u51FA\u73B0\u5728\u8FD9\u4E00\u6BB5\uFF1B\u52A0\u5B8C\u6311\u4E50\u5668": {
        readonly en: "A new part, only in this section; then pick an instrument";
    };
    readonly "\u58F0\u90E8\u7BA1\u7406\u2026": {
        readonly en: "Parts…";
    };
    readonly "{who} \u5728\u6F14": {
        readonly en: "Played by {who}";
    };
    readonly 隐藏: {
        readonly en: "Hide";
    };
    readonly "\u9690\u85CF\uFF1A\u8FD9\u4E00\u4F4D\u7F29\u6210\u7EC6\u884C\u3001\u4E0D\u5360\u5730\u65B9\uFF0C\u7167\u6837\u51FA\u58F0\uFF1B\u518D\u70B9 = \u663E\u793A": {
        readonly en: "Hide: this part shrinks to a thin line and takes no room, but still plays; tap again = show";
    };
    readonly "\u53EA\u770B\u5B83\uFF1A\u522B\u7684\u58F0\u90E8\u90FD\u7F29\u6210\u7EC6\u884C\uFF08\u53EF\u4EE5\u51E0\u4F4D\u4E00\u8D77\u53EA\u770B\uFF09\uFF1B\u518D\u70B9 = \u90FD\u770B": {
        readonly en: "Only this: every other part shrinks to a thin line (several parts can be 'only' at once); tap again = show all";
    };
    readonly 出声: {
        readonly en: "Sounding";
    };
    readonly "\u9759\u97F3##\u5F00\u5173": {
        readonly en: "Mute";
    };
    readonly "\u9759\u97F3\uFF1A\u8FD9\u4E00\u4F4D\u4E0D\u51FA\u58F0\uFF0C\u8C31\u4E0A\u7167\u6837\u753B\uFF1B\u518D\u70B9 = \u51FA\u58F0": {
        readonly en: "Mute: this part makes no sound but is still drawn; tap again = sound";
    };
    readonly "\u72EC\u594F\uFF1A\u53EA\u542C\u5B83\uFF08\u53EF\u4EE5\u51E0\u4F4D\u4E00\u8D77\u72EC\u594F\uFF09\uFF1B\u518D\u70B9 = \u5173\u6389": {
        readonly en: "Solo: hear only this part (several parts can solo at once); tap again = off";
    };
    readonly 换乐器: {
        readonly en: "Change instrument";
    };
    readonly 进乐器目录: {
        readonly en: "Open the instrument catalog";
    };
    readonly "\u6362\u4E50\u5668\uFF1A\u8FDB\u4E50\u5668\u76EE\u5F55\uFF08\u53F3\u8FB9\u7684\u952E\u76D8\u80FD\u8BD5\uFF1B\u9876\u4E0A\u662F\u8FD9\u9996\u6B4C\u7684\u4E50\u5668\u9884\u8BBE\uFF09\uFF0C\u9009\u597D\u5C31\u6362\u4E0A\u3001\u76EE\u5F55\u8FD8\u5F00\u7740\u53EF\u4EE5\u63A5\u7740\u6362\uFF0C\u300C\u2190 \u8C31\u300D\u56DE\u6765": {
        readonly en: "Change instrument: open the catalog (try with the keyboard on the right; this song’s instrument presets are on top); picking one swaps it in and keeps the catalog open so you can keep trying; “← Score” goes back";
    };
    readonly 乐器设置: {
        readonly en: "Instrument settings";
    };
    readonly "\u600E\u4E48\u6F14\u3001\u54CD\u5EA6": {
        readonly en: "How it plays, loudness";
    };
    readonly "\u8FD9\u4F4D\u600E\u4E48\u6F14\uFF08\u54CD\u5EA6\u3001\u529B\u5EA6\u3001\u5531\u6CD5\u2026\uFF09\u548C\u8C31\u4E0A\u5199\u4EC0\u4E48\u540D\u5B57\uFF1A\u5168\u5C4F\u4E00\u9875\uFF0C\u53F3\u8FB9\u7684\u952E\u76D8\u80FD\u8BD5": {
        readonly en: "How this performer plays (loudness, dynamics, singing…) and the name on the score: a full page, try it on the keys at the right";
    };
    readonly "\u6240\u6709\u58F0\u90E8\u6392\u4E00\u5217\uFF1A\u6539\u540D\u3001\u4E0A\u4E0B\u632A\u3001\u5728\u54EA\u51E0\u6BB5\uFF1B\u8FD9\u4E00\u6BB5\u4E0A\u9762 / \u4E0B\u9762\u52A0\u3001\u4EA4\u7ED9\u522B\u7684\u58F0\u90E8\u3001\u4ECE\u8FD9\u4E00\u6BB5\u5220\u6389": {
        readonly en: "All parts in one list: rename, move, choose sections; add above / below in this section, hand to another part, delete from this section";
    };
    readonly "\u6709 {n} \u4E2A\u5B57\u5531\u4E0D\u51FA\u6765\uFF08\u8C31\u4E0A\u753B\u7070\uFF09\uFF1A{first}{x}": {
        readonly en: "{n} {n|syllable|syllables} can't be sung (grayed out on the score): {first}{x}";
    };
    readonly " \u7B49": {
        readonly en: " etc.";
    };
    readonly "\u8D77\u70B9\u632A\u5230\u8FD9\u4E2A\u5C0F\u8282\u7684\u5934\uFF0C\u4ECE\u8FD9\u513F\u653E\uFF08\u4E4B\u540E |\u25B6 \u56DE\u5230\u8FD9\u513F\u91CD\u653E\uFF1B\u7F16\u8F91\u3001\u632A\u5149\u6807\u90FD\u4E0D\u52A8\u8D77\u70B9\uFF09": {
        readonly en: "Moves the start point to the head of this bar and plays from here (later |▶ replays from here; editing or moving the cursor doesn't move it)";
    };
    readonly 粘贴: {
        readonly en: "Paste";
    };
    readonly "\u8D34\u5728\u8FD9\u91CC\uFF1Aapp \u91CC\u590D\u5236\u7684\uFF0C\u6216\u7CFB\u7EDF\u526A\u8D34\u677F\u91CC\u7684\u7B80\u8C31\u6587\u5B57\uFF081 2 3 | 5 - -\uFF09": {
        readonly en: "Paste here: copied in the app, or jianpu text on the system clipboard (1 2 3 | 5 - -)";
    };
    readonly "\u5C0F\u8282\u7EBF |": {
        readonly en: "Barline |";
    };
    readonly "\u4ECE\u8FD9\u91CC\u91CD\u65B0\u6570\u5C0F\u8282\uFF08\u5F31\u8D77\uFF09": {
        readonly en: "Recount bars from here (pickup)";
    };
    readonly "\u8C31\u53F7 \u00B7 \u8C03\u53F7 \u00B7 \u62CD\u53F7 \u00B7 \u901F\u5EA6\u2026": {
        readonly en: "Clef · Key · Time · Tempo…";
    };
    readonly "\u4ECE\u8FD9\u513F\u8D77\u6362\uFF08\u540C\u4E00\u4E2A\u9762\u677F\uFF09": {
        readonly en: "Change from here (one panel)";
    };
    readonly "\u516B\u5EA6\u7EBF\u2026": {
        readonly en: "Ottava line…";
    };
    readonly "8va / 15ma / 8vb\uFF08\u53EA\u7BA1\u753B\uFF09": {
        readonly en: "8va / 15ma / 8vb (display only)";
    };
    readonly "\u8FD9\u5F20\u7EB8 / \u6574\u9996\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u632A\uFF08\u8C03\u53F7\u8DDF\u7740\u632A\uFF09\uFF1B\u53EA\u632A\u4E00\u6BB5 = \u9009\u4E2D\u5B83\uFF0C\u7528\u9009\u533A\u83DC\u5355": {
        readonly en: "Moves all parts on this sheet or in the whole song (key signature too); to move just a passage, select it and use the selection menu";
    };
    readonly "\u529B\u5EA6 {d}\uFF1A\u4ECE\u8FD9\u513F\u524D\u9762\u90A3\u4E2A\u97F3\u8D77": {
        readonly en: "Dynamic {d}: from the note before here";
    };
    readonly 全选: {
        readonly en: "Select all";
    };
    readonly "\u98CE\u683C\u8BB0\u53F7\u8981\u653E\u5728\u4E00\u4E2A\u97F3\u4E0A\uFF08\u8FD9\u5F20\u7EB8\u91CC\u8FD8\u6CA1\u6709\u97F3\uFF09": {
        readonly en: "A style mark goes on a note (this sheet has no notes yet)";
    };
    readonly "\u53CD\u590D / \u8DF3\u8F6C\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4F4D\uFF08{extras}\uFF09\u90A3\u4E00\u884C\uFF1A\u8FD9\u4E00\u884C\u5199\u7684\u753B\u7070\u3001\u4E0D\u8D77\u4F5C\u7528": {
        readonly en: "Repeats / jumps only count on the top part's line ({extras}): written on this line they're grayed out and have no effect";
    };
    readonly "\u7B2C {p} \u5F20\u7EB8": {
        readonly en: "Sheet {p}";
    };
    readonly "\u8FD9\u4E00\u6BB5\u300C{paperId}\u300D": {
        readonly en: "This section “{paperId}”";
    };
    readonly 移调: {
        readonly en: "Transpose";
    };
    readonly "\u2191 \u534A\u97F3": {
        readonly en: "↑ Semitone";
    };
    readonly "\u2193 \u534A\u97F3": {
        readonly en: "↓ Semitone";
    };
    readonly "\u2191 \u5168\u97F3": {
        readonly en: "↑ Whole tone";
    };
    readonly "\u2193 \u5168\u97F3": {
        readonly en: "↓ Whole tone";
    };
    readonly 八度: {
        readonly en: "Octave";
    };
    readonly "\u2191 \u516B\u5EA6": {
        readonly en: "↑ Octave";
    };
    readonly "\u2193 \u516B\u5EA6": {
        readonly en: "↓ Octave";
    };
    readonly "\u8F6C\u8C03\u5230\uFF08\u73B0\u5728 1={now}\uFF09\uFF1A\u97F3\u6309\u4E24\u4E2A\u4E3B\u97F3\u4E4B\u95F4\u7684\u97F3\u7A0B\u632A": {
        readonly en: "Change key to (now 1={now}): notes move by the interval between the two tonics";
    };
    readonly "{whole}\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u632A\uFF0C\u8C03\u53F7\u8DDF\u7740\u632A\uFF08\u53D6\u5347\u964D\u53F7\u5C11\u7684\u5199\u6CD5\uFF1B\u632A\u516B\u5EA6\u8C03\u53F7\u4E0D\u53D8\uFF09\u3002\u6B4C\u8BCD\u3001\u8BB0\u53F7\u3001\u8C31\u53F7\u4E0D\u52A8\uFF1B\u9F13 / \u56FA\u5B9A\u6572\u4E00\u4E2A\u952E\u7684\u58F0\u90E8\uFF08\u5199\u7684\u97F3\u9AD8 = \u6572\u54EA\u4E2A\uFF09\u4E0D\u52A8\uFF1Bpad \u7684\u300C1=\u300D\u4E0D\u8DDF\u3002": {
        readonly en: "{whole}all parts move together, and the key signature follows (spelled with fewer accidentals; octave moves leave it unchanged). Lyrics, marks and clefs stay; drums / single-key parts (written pitch = which one to hit) stay; the pad's “1=” doesn't follow.";
    };
    readonly 这张纸上: {
        readonly en: "On this sheet,";
    };
    readonly 已经是这个调: {
        readonly en: "Already in this key";
    };
    readonly 没有可以挪的音: {
        readonly en: "No notes to move";
    };
    readonly "{held} \u662F\u9F13 / \u56FA\u5B9A\u6572\u4E00\u4E2A\u952E\uFF08\u5199\u7684\u97F3\u9AD8 = \u6572\u54EA\u4E2A\uFF09\uFF0C\u6CA1\u632A": {
        readonly en: "{held} is drums / single-key (written pitch = which one to hit), so it wasn't moved";
    };
    readonly "\u8C31\u5185\u53CD\u590D\uFF1A\u63D2\u5728\u5149\u6807\u5904\uFF1B\u5149\u6807\u6328\u7740\u5C0F\u8282\u7EBF = \u628A\u90A3\u6761\u6539\u6210\u53CD\u590D\u7684\u3002\u653E\u7684\u65F6\u5019\u6309\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C\u5C55\u5F00\uFF0C\u522B\u7684\u58F0\u90E8\u8DDF\u7740\uFF1B\u4E0D\u8DE8\u7EB8\u3002\u8DF3\u56DE\u6765\uFF08D.C. / D.S.\uFF09\u4E4B\u540E\u53CD\u590D\u4E0D\u518D\u53CD\u590D\u3002": {
        readonly en: "Score repeats: inserted at the cursor; next to a barline = turns that barline into a repeat. Playback expands them from this sheet's top part, other parts follow; they don't cross sheets. After a jump back (D.C. / D.S.), repeats don't repeat again.";
    };
    readonly 反复开始: {
        readonly en: "Repeat start";
    };
    readonly "\u53CD\u590D\u7ED3\u675F\uFF1A\u56DE\u5230 |:\uFF08\u6CA1\u6709 = \u8FD9\u5F20\u7EB8\u5F00\u5934\uFF09\u518D\u653E\u4E00\u904D": {
        readonly en: "Repeat end: back to |: (or this sheet's start if none) and play again";
    };
    readonly "\u524D\u4E00\u6BB5\u53CD\u590D\u7ED3\u675F\u3001\u540E\u4E00\u6BB5\u53CD\u590D\u5F00\u59CB": {
        readonly en: "End one repeat, start another";
    };
    readonly 一共放三遍: {
        readonly en: "Play three times in total";
    };
    readonly 一共放四遍: {
        readonly en: "Play four times in total";
    };
    readonly 改回普通小节线: {
        readonly en: "Back to a normal barline";
    };
    readonly "\u2016 \u6BB5\u843D\u7EBF": {
        readonly en: "‖ Double bar";
    };
    readonly "\u6BB5\u843D\u7EBF\uFF08\u4E24\u6839\u7EC6\u7EBF\uFF09\uFF1A\u5206\u6BB5\u7684\u8BB0\u53F7\uFF0C\u4E0D\u662F\u4E24\u6839\u5C0F\u8282\u7EBF\uFF1B\u6328\u7740\u5C0F\u8282\u7EBF = \u628A\u90A3\u6761\u6539\u6210\u6BB5\u843D\u7EBF": {
        readonly en: "Double bar (two thin lines): a section marker, not two barlines; next to a barline = turns that one into a double bar";
    };
    readonly 终止线: {
        readonly en: "Final bar";
    };
    readonly "\u7EC8\u6B62\u7EBF\uFF08\u7EC6 + \u7C97\uFF09\uFF1A\u66F2\u5B50 / \u8FD9\u4E00\u6BB5\u5230\u8FD9\u513F\u7ED3\u675F": {
        readonly en: "Final bar (thin + thick): the piece / this section ends here";
    };
    readonly "\u623F\u5B50\uFF1A\u7B2C {p} \u904D\u8D70\u8FD9\u91CC": {
        readonly en: "Ending: take this on pass {p}";
    };
    readonly "\u8E29\u4E0B\uFF08\u7559\u4F4F\u97F3\uFF09": {
        readonly en: "Press (keep notes ringing)";
    };
    readonly "\u62AC\u8D77\uFF08\u6B62\u97F3\uFF09": {
        readonly en: "Lift (stop the notes)";
    };
    readonly "\u6362\u8E0F\u677F\uFF08\u5148\u6B62\u97F3\u3001\u63A5\u7740\u7559\uFF09": {
        readonly en: "Change pedal (stop, then keep again)";
    };
    readonly 延音踏板: {
        readonly en: "Sustain pedal";
    };
    readonly 持音踏板: {
        readonly en: "Sostenuto pedal";
    };
    readonly 弱音踏板: {
        readonly en: "Soft pedal";
    };
    readonly "\u8FD9\u91CC\u672C\u6765\u5C31\u8E29\u7740\uFF1A\u8FD9\u4E2A\u8E29\u4E0B\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09": {
        readonly en: "The pedal is already down here: this press does nothing (greyed)";
    };
    readonly "\u8FD9\u91CC\u672C\u6765\u6CA1\u8E29\u7740\uFF1A\u8FD9\u4E2A\u62AC\u8D77\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09": {
        readonly en: "The pedal isn't down here: this lift does nothing (greyed)";
    };
    readonly "\u8E0F\u677F\u8BB0\u53F7\u6302\u5728\u97F3\u4E0A\uFF1A\u8FD9\u5F20\u7EB8\u4E0A\u5149\u6807\u9644\u8FD1\u8FD8\u6CA1\u6709\u97F3": {
        readonly en: "Pedal marks hang on notes: there are no notes near the cursor on this sheet yet";
    };
    readonly "\u628A\u8FD9\u4E00\u6BB5\u8E29\u4F4F\uFF08\u9009\u533A\u5F00\u5934\u8E29\u4E0B\u3001\u7ED3\u5C3E\u62AC\u8D77\uFF09": {
        readonly en: "Hold this passage (press at the start of the selection, lift at its end)";
    };
    readonly "\u8FD9\u4E2A\u97F3\u4E0A\u5DF2\u7ECF\u6709\u4E86\uFF1A\u518D\u70B9 = \u53BB\u6389": {
        readonly en: "Already on this note: tap again to remove";
    };
    readonly "\uFF08\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\uFF09": {
        readonly en: " (from the note before the cursor)";
    };
    readonly "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u8FD9\u91CC\u672C\u6765\u5C31\u8E29\u7740": {
        readonly en: "No effect (greyed): the pedal is already down here";
    };
    readonly "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u8FD9\u91CC\u672C\u6765\u6CA1\u8E29\u7740": {
        readonly en: "No effect (greyed): the pedal isn't down here";
    };
    readonly "\u8FD9\u91CC\u4E4B\u524D\u6CA1\u8E29\u7740\uFF0C\u6362\u8E0F\u677F = \u8E29\u4E0B": {
        readonly en: "The pedal wasn't down before this, so a change = a press";
    };
    readonly 删掉这个踏板记号: {
        readonly en: "Delete this pedal mark";
    };
    readonly "8va\uFF1A\u8C31\u4E0A\u753B\u4F4E\u4E00\u4E2A\u516B\u5EA6\uFF08\u5B9E\u9645\u7167\u5199\u7684\u9AD8\u516B\u5EA6\u54CD\uFF09": {
        readonly en: "8va: drawn an octave lower (sounds an octave higher, as written)";
    };
    readonly "15ma\uFF1A\u8C31\u4E0A\u753B\u4F4E\u4E24\u4E2A\u516B\u5EA6": {
        readonly en: "15ma: drawn two octaves lower";
    };
    readonly "8vb\uFF1A\u8C31\u4E0A\u753B\u9AD8\u4E00\u4E2A\u516B\u5EA6\uFF08\u5B9E\u9645\u7167\u5199\u7684\u4F4E\u516B\u5EA6\u54CD\uFF09": {
        readonly en: "8vb: drawn an octave higher (sounds an octave lower, as written)";
    };
    readonly 到这儿结束八度线: {
        readonly en: "End the ottava line here";
    };
    readonly "\u516B\u5EA6\u7EBF\uFF1A\u4ECE\u5149\u6807\u5904\u8D77{sel}\u3002\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8\u3002": {
        readonly en: "Ottava line: from the cursor{sel}. Display only, pitch doesn't change.";
    };
    readonly "\uFF08\u6709\u9009\u533A = \u53EA\u753B\u8FD9\u4E00\u6BB5\uFF09": {
        readonly en: " (with a selection = just this passage)";
    };
    readonly "\uFF0C\u5230\u4E0B\u4E00\u4E2A\u516B\u5EA6\u7EBF\u8BB0\u53F7\u4E3A\u6B62": {
        readonly en: ", up to the next ottava mark";
    };
    readonly 大谱表: {
        readonly en: "Grand staff";
    };
    readonly "\u81EA\u52A8\u516B\u5EA6\u7EBF\uFF1A\u8FD9\u4E00\u4E32\u97F3\u8981\u4E09\u6761\u4EE5\u4E0A\u52A0\u7EBF\uFF0C\u81EA\u52A8\u753B\u4E86 {lab}\u3002\u53EA\u7BA1\u753B\u3001\u4E0D\u5B58\u8FDB\u8C31\uFF0C\u97F3\u9AD8\u4E0D\u53D8\uFF1B\u6539\u4E86\u97F3\u4F1A\u8DDF\u7740\u91CD\u7B97\u3002\u624B\u5199\u7684\u516B\u5EA6\u7EBF\u8BF4\u4E86\u7B97\u3002": {
        readonly en: "Auto ottava: this run needs three or more ledger lines, so {lab} was drawn automatically. Display only, not saved in the score; pitch doesn't change, and it recalculates as notes change. Handwritten ottava lines win.";
    };
    readonly "\u56FA\u5B9A\u6210\u624B\u5199\u7684 {lab}\uFF08\u4E4B\u540E\u81EA\u5DF1\u6539\uFF09": {
        readonly en: "Make it a handwritten {lab} (edit it yourself afterward)";
    };
    readonly 这一段不要自动八度线: {
        readonly en: "No automatic octave lines in this section";
    };
    readonly "\u8FD9\u4E00\u6BB5\u8FD9\u4E2A\u58F0\u90E8\u7684\u81EA\u52A8\u516B\u5EA6\u7EBF\u5173\u4E86\uFF08\u70B9\u8C31\u53F7\u3001\u8C31\u5934\u9762\u677F\u91CC\u80FD\u518D\u5F00\uFF09": {
        readonly en: "Automatic octave lines are off for this part in this section (turn them back on by tapping the clef, in the header panel)";
    };
    readonly "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A{why}": {
        readonly en: "No effect (grayed out): {why}";
    };
    readonly "\u5927\u8C31\u8868\u4E0A\u516B\u5EA6\u7EBF\u73B0\u5728\u4E0D\u8D77\u4F5C\u7528\uFF08\u97F3\u4E0D\u632A\uFF0C\u4E5F\u4E0D\u5370\uFF09": {
        readonly en: "Octave lines have no effect on a grand staff yet (notes are not moved and the line is not printed)";
    };
    readonly "\u516B\u5EA6\u7EBF\uFF1A{p}\u3002\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8\u3002": {
        readonly en: "Ottava line: {p}. Display only, pitch doesn't change.";
    };
    readonly 删掉这条八度线: {
        readonly en: "Delete this ottava line";
    };
    readonly "Segno\uFF1AD.S. \u8DF3\u56DE\u5230\u8FD9\u513F": {
        readonly en: "Segno: D.S. jumps back here";
    };
    readonly "Coda\uFF1ATo Coda \u8DF3\u5230\u8FD9\u513F": {
        readonly en: "Coda: To Coda jumps here";
    };
    readonly "Fine\uFF1A\u8DF3\u56DE\u6765\uFF08al Fine\uFF09\u4E4B\u540E\u5728\u8FD9\u513F\u505C": {
        readonly en: "Fine: after jumping back (al Fine), stop here";
    };
    readonly "To Coda\uFF1A\u8DF3\u56DE\u6765\uFF08al Coda\uFF09\u4E4B\u540E\u4ECE\u8FD9\u513F\u53BB Coda": {
        readonly en: "To Coda: after jumping back (al Coda), go to the Coda from here";
    };
    readonly "D.C.\uFF1A\u8DF3\u56DE\u8FD9\u5F20\u7EB8\u5F00\u5934\uFF0C\u653E\u5230\u7EB8\u5C3E": {
        readonly en: "D.C.: back to the start of this sheet, play to the end";
    };
    readonly "D.C. al Fine\uFF1A\u8DF3\u56DE\u5F00\u5934\uFF0C\u653E\u5230 Fine": {
        readonly en: "D.C. al Fine: back to the start, play to Fine";
    };
    readonly "D.C. al Coda\uFF1A\u8DF3\u56DE\u5F00\u5934\uFF0C\u5230 To Coda \u53BB Coda": {
        readonly en: "D.C. al Coda: back to the start, at To Coda go to the Coda";
    };
    readonly "D.S.\uFF1A\u8DF3\u56DE Segno\uFF0C\u653E\u5230\u7EB8\u5C3E": {
        readonly en: "D.S.: back to the Segno, play to the end";
    };
    readonly "D.S. al Fine\uFF1A\u8DF3\u56DE Segno\uFF0C\u653E\u5230 Fine": {
        readonly en: "D.S. al Fine: back to the Segno, play to Fine";
    };
    readonly "D.S. al Coda\uFF1A\u8DF3\u56DE Segno\uFF0C\u5230 To Coda \u53BB Coda": {
        readonly en: "D.S. al Coda: back to the Segno, at To Coda go to the Coda";
    };
    readonly "\u623F\u5B50\uFF1A\u7B2C {nums} \u904D\u8D70\u8FD9\u4E2A\u62EC\u53F7\uFF0C\u522B\u7684\u904D\u8DF3\u8FC7": {
        readonly en: "Ending: pass {nums} takes this bracket, other passes skip it";
    };
    readonly "\u8FD9\u4E00\u7248\u4E0D\u8BA4\u8BC6\u300C{style}\u300D\uFF1A\u4E0D\u52A0\u8F7B\u91CD\uFF08\u6362\u4E00\u4E2A\u98CE\u683C\u5C31\u597D\uFF09": {
        readonly en: "This version doesn't know “{style}”: no beat weighting (pick another style)";
    };
    readonly "{p} \u8FD9\u4E2A\u9884\u8BBE\u6CA1\u5217\uFF1A\u6309\u53E4\u5178\u7684\u5F3A\u5F31\u63A8{m}": {
        readonly en: "This preset doesn't list {p}: inferred from classical strong and weak beats{m}";
    };
    readonly "\uFF08\u51E0\u4E2A\u516B\u5206\u4E00\u7EC4\u8C31\u4E0A\u6CA1\u8BB0\uFF0C\u6309 2 + 2 + \u2026 + 3 \u63A8\uFF09": {
        readonly en: " (eighth-note grouping isn't written, assumed 2 + 2 + … + 3)";
    };
    readonly "{p}\uFF1A\u8FD9\u4E2A\u9884\u8BBE\u4E0D\u52A0\u8F7B\u91CD": {
        readonly en: "{p}: this preset adds no beat weighting";
    };
    readonly "\u6447\u6446\uFF1A\u4E00\u62CD\u91CC\u524D\u4E00\u4E2A\u516B\u5206\u5360 {p}%\uFF08\u76F4 = 50%\uFF0C\u4E09\u8FDE\u97F3\u611F \u2248 67%\uFF1B\u5E45\u5EA6\u53EA\u653E\u5927 / \u7F29\u5C0F\u6BD4\u76F4\u7684\u591A\u51FA\u6765\u7684\u90A3\u4E00\u622A\uFF0C\u5939\u5728 {p2}\u2013{p3}%\uFF09\u3002\u8FD9\u5F20\u7EB8\u4E0A\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u6447\uFF08\u5C0F\u6708\u76F8\u4E5F\u662F\uFF0C\u4E0D\u5206\u8DDF\u591A\u5C11\uFF09\uFF1B\u5199\u6210\u8FDE\u97F3\u7684\u97F3\u30016/8 \u8FD9\u7C7B\u62CD\u53F7\u4E0D\u6447": {
        readonly en: "Swing: the first eighth takes {p}% of each beat (straight = 50%, triplet feel ≈ 67%; amount only scales the part above straight, clamped to {p2}–{p3}%). All parts on this sheet swing together (Tsukuyomi-chan too, regardless of how much they follow); tuplets and meters like 6/8 don't swing";
    };
    readonly "\u8DDF {p}%": {
        readonly en: "Follows {p}%";
    };
    readonly 不跟: {
        readonly en: "Doesn't follow";
    };
    readonly "\u8FD9\u5F20\u7EB8\u4E0A\uFF1A{p}\uFF08\u6309\u4E50\u5668\u7C7B\u522B\uFF0C\u9884\u8BBE\u7ED9\u7684\uFF09": {
        readonly en: "On this sheet: {p} (by instrument family, from the preset)";
    };
    readonly "\u4E5F\u53EB {p}": {
        readonly en: "Also called {p}";
    };
    readonly 从这儿起不加拍子轻重: {
        readonly en: "No beat weighting from here";
    };
    readonly 不加轻重: {
        readonly en: "No weighting";
    };
    readonly "\u5E45\u5EA6\uFF1A\u9884\u8BBE\u7684 {a} \u500D": {
        readonly en: "Amount: {a} × preset";
    };
    readonly "\u98CE\u683C = \u62CD\u5B50\u8F7B\u91CD\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u8D77\u5230\u8FD9\u5F20\u7EB8\u7ED3\u5C3E\uFF0C\u6BCF\u4E2A\u97F3\u6309\u5B83\u843D\u5728\u5C0F\u8282\u91CC\u7684\u54EA\u4E00\u62CD\u8F7B\u4E00\u70B9\u6216\u91CD\u4E00\u70B9\uFF08\u50CF\u9F13\u624B\u7684\u5F8B\u52A8\uFF09\uFF1B\u5199\u4E86\u91CD\u97F3 / \u5F31\u5316\u7684\u97F3\u7167\u5199\u7684\u6765\u3002": {
        readonly en: "Style = beat weighting: from this note to the end of the sheet, each note gets slightly lighter or heavier depending on where it falls in the bar (like a drummer's groove); notes with written accents / unstress follow what's written.";
    };
    readonly "\u4E00\u8F6E\u7684\u7B2C\u4E00\u5C0F\u8282\u662F\u4E09\u51FB\u90A3\u8FB9\uFF08\u524D\u53E5\uFF09\uFF0C\u4ECE\u8FD9\u4E2A\u8BB0\u53F7\u90A3\u4E00\u5C0F\u8282\u8D77\u6570": {
        readonly en: "The first bar of the cycle is the three-hit side (first phrase), counted from this mark's bar";
    };
    readonly "\u9519\u5F00\u4E00\u5C0F\u8282\uFF1A\u4E24\u5C0F\u8282\u5BF9\u8C03\uFF0C\u7B2C\u4E00\u5C0F\u8282\u662F\u4E24\u51FB\u90A3\u8FB9": {
        readonly en: "Offset by a bar: the two bars swap, the first bar is the two-hit side";
    };
    readonly "2-3\uFF08\u9519\u5F00\u4E00\u5C0F\u8282\uFF09": {
        readonly en: "2-3 (offset by a bar)";
    };
    readonly "\u53BB\u6389\u8FD9\u4E2A\u98CE\u683C\u8BB0\u53F7\uFF08\u8FD9\u513F\u8D77\u56DE\u5230\u524D\u4E00\u4E2A\u98CE\u683C\uFF1B\u8FD9\u5F20\u7EB8\u5F00\u5934 = \u4E0D\u52A0\uFF09": {
        readonly en: "Remove this style mark (from here it returns to the previous style; at the start of a sheet = none)";
    };
    readonly "\u53EA\u7BA1\u8FD9\u5F20\u7EB8\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u5230\u8FD9\u5F20\u7EB8\u7ED3\u5C3E\uFF08\u6216\u4E0B\u4E00\u4E2A\u98CE\u683C\u8BB0\u53F7\uFF09\u3002\u957F\u6309\u62D6 = \u632A\u5230\u522B\u7684\u97F3\u4E0A": {
        readonly en: "This sheet only: from this note to the end of the sheet (or the next style mark). Long-press and drag = move to another note";
    };
    readonly "\u6539\u6210 {d}": {
        readonly en: "Change to {d}";
    };
    readonly 渐强: {
        readonly en: "Crescendo";
    };
    readonly 渐弱: {
        readonly en: "Diminuendo";
    };
    readonly "\u8FD9\u5F20\u7EB8\u91CC\u524D\u9762\u6CA1\u6709\u529B\u5EA6\u8BB0\u53F7\uFF0C\u6CA1\u6709\u5730\u65B9\u6E10\u8FC7\u6765": {
        readonly en: "No dynamic earlier on this sheet, so there's nothing to ramp from";
    };
    readonly "\u4E2D\u95F4\u6709\u624B\u5199\u7684\u6E10\u5F3A\u6E10\u5F31\uFF0C\u6309\u624B\u5199\u7684\u8D70": {
        readonly en: "There's a handwritten crescendo / diminuendo in between; that wins";
    };
    readonly "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u540E\u9762\u90A3\u4E2A\u97F3\u662F\u5F3A\u540E\u5373\u5F31\uFF08fp\uFF09\u2014\u2014\u97F3\u5934\u6309 f\u3001\u968F\u540E\u843D\u5230 p\uFF0C\u4E4B\u540E\u4E5F\u662F p\uFF0C\u8FD9\u4E2A {value} \u7BA1\u4E0D\u5230": {
        readonly en: "No effect (grayed out): the next note is forte-piano (fp) — it attacks at f, falls to p and stays p, out of reach of this {value}";
    };
    readonly "\u6E10\u5230\uFF1A\u4ECE\u8FD9\u5F20\u7EB8\u91CC\u4E0A\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u90A3\u513F\u4E00\u8DEF\u6E10\u53D8\u5230\u8FD9\u91CC\uFF08\u8C31\u4E0A\u865A\u7EBF\u53D1\u5939\uFF09\uFF1B\u5173 = \u5230\u8FD9\u513F\u7A81\u53D8": {
        readonly en: "Ramp: changes gradually from the previous dynamic on this sheet to here (dashed hairpin on the score); off = changes suddenly here";
    };
    readonly "{ramp}\u6E10\u5230\uFF08\u4ECE\u4E0A\u4E00\u4E2A\u529B\u5EA6\u6E10\u53D8\u8FC7\u6765\uFF09": {
        readonly en: "{ramp}Ramp (gradually from the previous dynamic)";
    };
    readonly "\u4E0D\u8D77\u4F5C\u7528\uFF1A": {
        readonly en: "No effect:";
    };
    readonly "\u548C\u65B9\u5411\u53CD\u7740\uFF1A\u7167\u65B9\u5411\u5148\u8D70\u4E00\u6863\uFF0C\u5230\u8FD9\u513F\u7A81\u53D8\u6210 {d}\uFF08\u8C31\u4E0A\u7070\u5B57\u8BF4\u660E\uFF09": {
        readonly en: "Against the direction: it moves one step that way first, then jumps to {d} here (a gray note on the score says so)";
    };
    readonly "\u7EC8\u70B9 = {d}": {
        readonly en: "Ends at {d}";
    };
    readonly 变到: {
        readonly en: "Goes to";
    };
    readonly "\u6CA1\u5199\u7EC8\u70B9\uFF1A\u7167\u65B9\u5411\u8D70\u4E00\u6863\uFF08\u8C31\u4E0A\u7070\u5B57\uFF09": {
        readonly en: "No written end: moves one step in its direction (gray note on the score)";
    };
    readonly 走一档: {
        readonly en: "One step";
    };
    readonly "\u7EC8\u70B9\u90A3\u4E2A\u529B\u5EA6\u8BB0\u53F7\u8FD8\u7BA1\u7740\u540E\u9762\u7684\u97F3\uFF1A\u8FD9\u91CC\u4E0D\u53BB\u6389\u5B83\uFF08\u8981\u6539\u5B83\u5C31\u70B9\u5B83\uFF09": {
        readonly en: "The ending dynamic still governs the notes after it, so it isn't removed here (tap it to change it)";
    };
    readonly "\u632A\u5230\u8FD9\u4E00\u6BB5\u6700\u540E\u4E00\u4E2A\u97F3\u540E\u9762\uFF1A\u6E10\u5F3A\u6E10\u5F31 / \u6E10\u5230\u4E00\u76F4\u8D70\u5230\u8FD9\u4E00\u6BB5\u7ED3\u675F": {
        readonly en: "Move it after the last note of this section: crescendos / ramps run all the way to the end of the section";
    };
    readonly 挪到这一段结尾: {
        readonly en: "Move to the end of this section";
    };
    readonly "\u53BB\u6389\u8FD9\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF08\u540E\u9762\u7684\u97F3\u56DE\u5230\u524D\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF09": {
        readonly en: "Remove this dynamic (later notes return to the previous one)";
    };
    readonly "\u53BB\u6389\u8FD9\u4E2A\u6E10\u5F3A / \u6E10\u5F31": {
        readonly en: "Remove this crescendo / diminuendo";
    };
    readonly "\u957F\u6309\u62D6 = \u632A\u5230\u522B\u7684\u97F3\u4E0A\uFF08\u6700\u540E\u4E00\u4E2A\u97F3\u7684\u53F3\u8FB9 = \u8FD9\u4E00\u6BB5\u7ED3\u5C3E\uFF09": {
        readonly en: "Long-press and drag = move it to another note (right of the last note = the end of this section)";
    };
    readonly "\u957F\u6309\u62D6 = \u632A\u5230\u522B\u7684\u97F3\u4E0A": {
        readonly en: "Long-press and drag = move to another note";
    };
    readonly "\u987A\u624B\u53BB\u6389\u4E86 {n} \u4E2A\u4E0D\u518D\u7BA1\u4EFB\u4F55\u97F3\u7684\u8BB0\u53F7\uFF08\u529B\u5EA6 / \u6E10\u5F3A\u6E10\u5F31 / \u8E0F\u677F\uFF1B\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": {
        readonly en: "Also removed {n} marks that no longer govern any note (dynamics / hairpins / pedals; undo brings them back)";
    };
    readonly "\u7EC8\u70B9\u6539\u6210\u4E86 {d}\uFF08\u53D1\u5939\u540E\u9762\u90A3\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF09": {
        readonly en: "End changed to {d} (the dynamic after the hairpin)";
    };
    readonly "\u5728\u4E0B\u4E00\u6761\u6E10\u5F3A\u6E10\u5F31\u524D\u9762\u653E\u4E86 {d}": {
        readonly en: "Put {d} before the next hairpin";
    };
    readonly "\u5728\u8FD9\u4E00\u6BB5\u6700\u540E\u4E00\u4E2A\u97F3\u540E\u9762\u653E\u4E86 {d}": {
        readonly en: "Put {d} after the last note of this section";
    };
    readonly "\u53BB\u6389\u4E86\u8FD9\u4E00\u6BB5\u7ED3\u5C3E\u90A3\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1A\u56DE\u5230\u8D70\u4E00\u6863": {
        readonly en: "Removed the dynamic at the end of this section: back to one step";
    };
    readonly "\u2039 \u8F6C\u8C03\u5230\u2026": {
        readonly en: "‹ Change key to…";
    };
    readonly 现在的调: {
        readonly en: "Current key";
    };
    readonly "\u8F6C\u8C03\u2026": {
        readonly en: "Change key…";
    };
    readonly 按调号拼写: {
        readonly en: "Spell by key signature";
    };
    readonly "\u6574\u6BB5\u8F6C\u5230\u53E6\u4E00\u4E2A\u8C03\uFF1A\u97F3\u6309\u4E24\u4E2A\u4E3B\u97F3\u4E4B\u95F4\u7684\u97F3\u7A0B\u632A\uFF0C\u8C03\u53F7\u8DDF\u7740\u6362": {
        readonly en: "Move the whole passage to another key: notes move by the interval between the two tonics, and the key signature changes";
    };
    readonly "\u97F3\u9AD8\u4E0D\u53D8\uFF1A\u8C03\u5185\u7684\u97F3\u6362\u6210\u8C03\u53F7\u91CC\u7684\u5199\u6CD5\uFF08A\u266D \u5728\u4E94\u4E2A\u5347\u53F7\u7684\u8C03\u91CC = G\u266F\uFF09\uFF0C\u8C03\u5916\u7684\u4E0D\u52A8": {
        readonly en: "Pitch stays: in-key notes use the key's spelling (A♭ in a five-sharp key = G♯), out-of-key notes stay";
    };
    readonly 时值: {
        readonly en: "Duration";
    };
    readonly 都改成: {
        readonly en: "Change all to";
    };
    readonly 都改成长短旋钮现在那一档: {
        readonly en: "Change all to the current length setting";
    };
    readonly 清掉记号: {
        readonly en: "Clear marks";
    };
    readonly 曲级: {
        readonly en: "Passage level";
    };
    readonly "\u529B\u5EA6\u5B57\u3001\u6E10\u5F3A\u6E10\u5F31\u3001\u6E10\u5230\u3001\u98CE\u683C\uFF08\u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\u524D\u9762\u6302\u7740\u7684\u4E5F\u7B97\uFF09": {
        readonly en: "Dynamics, crescendo / diminuendo, ramps, style (including those just before the first selected note)";
    };
    readonly 音级: {
        readonly en: "Note level";
    };
    readonly "\u6F14\u594F\u6CD5\u3001\u97F3\u5934\uFF08\u91CD\u97F3 / \u7A81\u5F3A\u2026\uFF09\u3001\u97F3\u5185\u8D77\u4F0F\u3001\u8FDE\u7EBF\u3001\u547C\u5438\u3001\u6C14\u58F0": {
        readonly en: "Articulations, attacks (accent / sforzando…), swells, slurs, breaths, whispers";
    };
    readonly 都清: {
        readonly en: "Clear all";
    };
    readonly "\u66F2\u7EA7 + \u97F3\u7EA7\uFF1B\u97F3\u3001\u6B4C\u8BCD\u3001\u8C03\u53F7\u62CD\u53F7\u901F\u5EA6\u3001\u53CD\u590D\u4E0D\u52A8": {
        readonly en: "Passage + note level; notes, lyrics, key / time / tempo and repeats stay";
    };
    readonly 剪切: {
        readonly en: "Cut";
    };
    readonly "\u7C98\u8D34\uFF08\u66FF\u6362\u9009\u4E2D\u7684\uFF09": {
        readonly en: "Paste (replaces selection)";
    };
    readonly 选中的这一段没有这类记号: {
        readonly en: "This selection has no marks of that kind";
    };
    readonly "{why}\uFF1A\u300C{what}\u300D\u7528\u4E0D\u4E86": {
        readonly en: "{why}: “{what}” doesn't apply";
    };
    readonly "\u8FD9\u4E00\u7248\u51FA\u4E0D\u4E86\u58F0\uFF08\u522B\u7684\u8F6F\u4EF6\u539F\u6765\u7684\u4E50\u5668\uFF09": {
        readonly en: "This version can't sound it (the other software's original instrument)";
    };
    readonly "\u300C{name}\u300D\u4E0D\u662F\u6B4C\u91CC\u8BB0\u7684\u90A3\u4E2A\u300C{name2}\u300D\uFF08sha256 {p}\u2026 \u2260 {p2}\u2026\uFF09": {
        readonly en: "“{name}” isn't the “{name2}” recorded in the song (sha256 {p}… ≠ {p2}…)";
    };
    readonly "\u627E\u5230\u4E86\uFF1A\u300C{name}\u300D\u80FD\u54CD\u4E86": {
        readonly en: "Found: “{name}” can sound now";
    };
    readonly "\u6BCF\u5F20\u7EB8\u5F00\u5934\u8865\u4E86 {startDyns} \u4E2A\u529B\u5EA6\u8BB0\u53F7\u3001\u7406\u987A\u4E86 {reordered} \u5904\u8BB0\u53F7\u7684\u5148\u540E\uFF08\u4EE5\u524D\u8865\u7684\u529B\u5EA6\u6392\u5728\u4E86\u6E10\u5F3A\u6E10\u5F31\u540E\u9762\uFF0C\u90A3\u51E0\u4E2A\u6E10\u5F3A\u6E10\u5F31\u6CA1\u8D77\u4F5C\u7528\uFF0C\u73B0\u5728\u8D77\u4F5C\u7528\u4E86\uFF0C\u542C\u8D77\u6765\u4F1A\u53D8\uFF1B\u4E0B\u6B21\u5B58\u65F6\u4E00\u8D77\u5199\u8FDB\u6587\u4EF6\uFF09": {
        readonly en: "Added {startDyns} dynamics and reordered marks in {reordered} places at sheet starts (an earlier auto-added dynamic had landed after a hairpin, which silenced that hairpin; it works now, so it will sound different; written to the file on the next save)";
    };
    readonly "\u6BCF\u5F20\u7EB8\u5F00\u5934\u7406\u987A\u4E86 {reordered} \u5904\u8BB0\u53F7\u7684\u5148\u540E\uFF08\u4EE5\u524D\u8865\u7684\u529B\u5EA6\u6392\u5728\u4E86\u6E10\u5F3A\u6E10\u5F31\u540E\u9762\uFF0C\u90A3\u51E0\u4E2A\u6E10\u5F3A\u6E10\u5F31\u6CA1\u8D77\u4F5C\u7528\uFF0C\u73B0\u5728\u8D77\u4F5C\u7528\u4E86\uFF0C\u542C\u8D77\u6765\u4F1A\u53D8\uFF1B\u4E0B\u6B21\u5B58\u65F6\u4E00\u8D77\u5199\u8FDB\u6587\u4EF6\uFF09": {
        readonly en: "Reordered marks in {reordered} places at sheet starts (an earlier auto-added dynamic had landed after a hairpin, which silenced that hairpin; it works now, so it will sound different; written to the file on the next save)";
    };
    readonly "\u6BCF\u5F20\u7EB8\u5F00\u5934\u8865\u4E86 {startDyns} \u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF08\u5C31\u662F\u90A3\u91CC\u672C\u6765\u751F\u6548\u7684\uFF0C\u542C\u8D77\u6765\u4E0D\u53D8\uFF1B\u4E0B\u6B21\u5B58\u65F6\u4E00\u8D77\u5199\u8FDB\u6587\u4EF6\uFF09": {
        readonly en: "Added {startDyns} dynamics at sheet starts (the ones already in effect there, so it sounds the same; written to the file on the next save)";
    };
    readonly "\u300C{p}\u300D\u6539\u8FC7\u8FD8\u6CA1\u5B58": {
        readonly en: "“{p}” has unsaved changes";
    };
    readonly "{what}\u4F1A\u4E22\u6389\u8FD9\u4E9B\u6539\u52A8\u3002": {
        readonly en: "{what} will discard these changes.";
    };
    readonly 先存: {
        readonly en: "Save first";
    };
    readonly "\u4E22\u6389\uFF0C\u7EE7\u7EED": {
        readonly en: "Discard and continue";
    };
    readonly 新建: {
        readonly en: "New";
    };
    readonly 新的一首: {
        readonly en: "New song";
    };
    readonly "\u6CA1\u6253\u5F00\uFF1A{Error}": {
        readonly en: "Not opened: {Error}";
    };
    readonly "\u4ECE {host} \u6253\u5F00\u4E86 {name}\uFF1A\u8FD9\u662F\u4E00\u4EFD\u62F7\u8D1D\uFF0C\u60F3\u7559\u4E0B\u6765\u5C31\u6309\u300C\u5B58\u300D\u3002": {
        readonly en: "Opened {name} from {host}. This is a copy; press Save to keep it.";
    };
    readonly "\u6253\u5F00\u4E86 {name}": {
        readonly en: "Opened {name}";
    };
    readonly "\u6253\u4E0D\u5F00 {name}\uFF1A{Error}": {
        readonly en: "Can't open {name}: {Error}";
    };
    readonly "\u4ECE\u94FE\u63A5\u6253\u5F00\u8FD9\u9996\u6B4C\uFF1F": {
        readonly en: "Open this song from a link?";
    };
    readonly "\u4F1A\u4ECE {host} \u4E0B\u8F7D\u8FD9\u4E2A\u6587\u4EF6\uFF1A{url}\u3002\u8FD9\u662F\u522B\u4EBA\u653E\u5728\u7F51\u4E0A\u7684\u6587\u4EF6\uFF1B\u6253\u5F00\u7684\u662F\u4E00\u4EFD\u62F7\u8D1D\uFF0C\u60F3\u7559\u4E0B\u6765\u5C31\u6309\u300C\u5B58\u300D\u3002": {
        readonly en: "This downloads the file from {host}: {url}. It is a file someone put online; you get a copy, and pressing Save keeps it.";
    };
    readonly 打开: {
        readonly en: "Open";
    };
    readonly 打开链接里的歌: {
        readonly en: "Open the song from the link";
    };
    readonly "\u6B63\u5728\u4ECE {host} \u4E0B\u8F7D\u2026": {
        readonly en: "Downloading from {host}…";
    };
    readonly "\u6B63\u5728\u4ECE {host} \u4E0B\u8F7D\u2026 {pc}%": {
        readonly en: "Downloading from {host}… {pc}%";
    };
    readonly "{host} \u7ED9\u7684\u662F\u4E00\u4E2A\u7F51\u9875\uFF0C\u4E0D\u662F\u6B4C\u6587\u4EF6\uFF1A\u8981\u7528\u80FD\u76F4\u63A5\u4E0B\u8F7D\u7684\u94FE\u63A5\uFF08\u7F51\u76D8\u7684\u5206\u4EAB\u9875\u591A\u534A\u8981\u6362\u6210\u300C\u4E0B\u8F7D\u300D\u90A3\u4E2A\u94FE\u63A5\uFF09\u3002": {
        readonly en: "{host} sent a web page, not a song file. Use a direct download link (for a cloud drive, usually its “download” link rather than the share page).";
    };
    readonly "\u4ECE {host} \u62FF\u5230\u7684\u4E0D\u662F\u6B4C\u6587\u4EF6\uFF08.mxl / .musicxml\uFF09\u3002": {
        readonly en: "What came from {host} is not a song file (.mxl / .musicxml).";
    };
    readonly "\u8FD9\u9996\u6B4C\u9501\u7740\uFF0C\u6709\u6539\u52A8\u6CA1\u5B58\u3001\u4E5F\u4E0D\u4F1A\u63A8\u4E0A\u4E91\uFF1A\u6539\u52A8\u8FD8\u5728\uFF0C\u70B9\u8C31\u4E0A\u9762\u7684\u300C\u63A5\u7740\u6539\u300D\u4E4B\u540E\u518D\u5B58\u3002": {
        readonly en: "This song is locked, so the changes were not saved or uploaded. They are still here: tap “Keep editing” above the score, then save.";
    };
    readonly "\u8FD8\u662F\u7A7A\u7684\uFF0C\u6CA1\u4EC0\u4E48\u53EF\u5B58": {
        readonly en: "Still empty, nothing to save";
    };
    readonly "\u5B58\u597D\u4E86\uFF1A{name}": {
        readonly en: "Saved: {name}";
    };
    readonly 没存: {
        readonly en: "Not saved";
    };
    readonly "\u6CA1\u5B58\uFF08\u53D6\u6D88\u4E86\uFF09": {
        readonly en: "Not saved (canceled)";
    };
    readonly "\u6CA1\u5B58\u4E0A\uFF1A{Error}": {
        readonly en: "Couldn't save: {Error}";
    };
    readonly "\u8FD9\u51E0\u4EF6\u627E\u4E0D\u5230\u58F0\u97F3\uFF0C\u526F\u672C\u91CC\u6CA1\u5E26\uFF1A{p}\u3002\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u91CC\u300C\u627E\u6587\u4EF6\u2026\u300D\uFF0C\u518D\u5BFC\u51FA\u4E00\u6B21\u3002": {
        readonly en: "No sound found for these, so the copy doesn't include them: {p}. Tap the part name at the front of the score, “Find file…” under “Who performs”, and export again.";
    };
    readonly "\u8BB8\u53EF\u8FD9\u4E00\u4EFD\u6309\u300C\u672A\u58F0\u660E\u300D\u5199\u4E86\uFF08\u4F60\u9009\u7684\u8BB8\u53EF\u548C\u5C0F\u6708\u76F8\u7684\u6761\u6B3E\u53EF\u80FD\u51B2\u7A81\uFF1B\u4F5C\u8005\u680F\u91CC\u7684\u9009\u62E9\u6CA1\u52A8\uFF09\u3002": {
        readonly en: "This copy's license was written as “not stated” (your chosen license may conflict with Tsukuyomi-chan's terms; your choice in the credits is unchanged).";
    };
    readonly 署名: {
        readonly en: "Credits";
    };
    readonly "\u6253\u5305\u5206\u53D1\u7684\u8BB8\u53EF\uFF08\u8FD9\u4EFD\u526F\u672C\u91CC\u5E26\u7740\u8FD9\u4E9B\u6E90\u6587\u4EF6\uFF09": {
        readonly en: "Licenses for packed distribution (this copy carries these source files)";
    };
    readonly "\u5B58\u4E86\u4E00\u4EFD\uFF1A{name}{fellBack}": {
        readonly en: "Saved a copy: {name}{fellBack}";
    };
    readonly "\uFF08\u8BB8\u53EF\u6309\u672A\u58F0\u660E\u5199\uFF09": {
        readonly en: " (license written as not stated)";
    };
    readonly "\u5B58\u4E00\u4EFD .mxl \u526F\u672C\uFF08\u6253\u5305\u97F3\u6E90\uFF09": {
        readonly en: "Save an .mxl copy (packed sounds)";
    };
    readonly "\u5B58\u4E00\u4EFD .mxl \u526F\u672C": {
        readonly en: "Save an .mxl copy";
    };
    readonly "{name} \u00B7 {size}\u3002\u73B0\u5728\u8FD9\u9996\u6B4C\u7684\u4E00\u4EFD\u62F7\u8D1D\uFF1B\u8FD9\u91CC\u518D\u6539\uFF0C\u5B83\u4E0D\u4F1A\u8DDF\u7740\u53D8\u3002{credits}": {
        readonly en: "{name} · {size}. A copy of the song as it is now; later edits here won't change it. {credits}";
    };
    readonly "\u6253\u5305\u4E86 {n} \u4EF6\u58F0\u97F3": {
        readonly en: "Packed {n} {n|sound|sounds}";
    };
    readonly "\u6253\u5305\u4E86 {n} \u4EF6\u58F0\u97F3\u8FDB\u6B4C\uFF1A\u73B0\u5728\u6B4C\u91CC\u5E26\u7740 {size}{embedSoftLimit}\uFF0C\u53D1\u7ED9\u522B\u4EBA\u4E5F\u80FD\u54CD": {
        readonly en: "Packed {n} {n|sound|sounds} into the song: it now carries {size}{embedSoftLimit}, and works when sent to others";
    };
    readonly "\uFF08\u8D85\u8FC7 {embedSoftLimit}\uFF1A\u5B58 / \u540C\u6B65\u4F1A\u6162\u4E00\u70B9\uFF09": {
        readonly en: " (over {embedSoftLimit}: saving / syncing gets a bit slower)";
    };
    readonly "\u8FD9\u51E0\u4EF6\u627E\u4E0D\u5230\u58F0\u97F3\uFF0C\u6CA1\u6253\u5305\uFF1A{p}\u3002\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u91CC\u300C\u627E\u6587\u4EF6\u2026\u300D\u3002": {
        readonly en: "No sound found for these, so they weren't packed: {p}. Tap the part name at the front of the score, “Find file…” under “Who performs”.";
    };
    readonly "\u6CA1\u6709\u8981\u6253\u5305\u7684\uFF08\u5C0F\u6708\u76F8 / \u5143\u97F3\u7248\u4E0D\u6253\u5305\uFF1A\u5B83\u4EEC\u662F\u6A21\u578B\u5305\uFF0C\u6B4C\u91CC\u53EA\u9489\u54C8\u5E0C\uFF09": {
        readonly en: "Nothing to pack (Tsukuyomi-chan / vowel versions aren't packed: they're model packs, the song only pins a hash)";
    };
    readonly 歌里没有打包着的声音: {
        readonly en: "The song has no packed sounds";
    };
    readonly "\u89E3\u5305\u4E86 {size} \u4EF6\u58F0\u97F3": {
        readonly en: "Unpacked {size} {size|sound|sounds}";
    };
    readonly "\u89E3\u5305\u4E86 {size} \u4EF6\uFF1A\u6B4C\u91CC\u53EA\u8BB0\u6765\u6E90\uFF08\u5C0F\u4E86 {n}\uFF09\uFF1B\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7559\u7740\uFF0C\u7167\u6837\u80FD\u54CD\u3002\u522B\u7684\u8BBE\u5907\u4E0A\u4ECE\u5BB6\u65CF\u97F3\u6E90\u5E93\u6216\u539F\u6587\u4EF6\u627E": {
        readonly en: "Unpacked {size}: the song only records sources now ({n} smaller); kept on this device, so it still sounds. Other devices find it from the family sound library or the original file";
    };
    readonly "\u8FD9\u51E0\u4EF6\u6CA1\u89E3\u5305\uFF1A{p}\u2014\u2014\u8FD9\u53F0\u8BBE\u5907\u7559\u4E0D\u4F4F\u5B83\u7684\u58F0\u97F3\uFF08\u7A7A\u95F4\u4E0D\u591F\uFF0C\u6216\u6D4F\u89C8\u5668\u4E0D\u8BA9\u5B58\uFF09\uFF0C\u5BB6\u65CF\u97F3\u6E90\u5E93\u91CC\u4E5F\u6CA1\u6709\uFF0C\u89E3\u4E86\u5C31\u627E\u4E0D\u56DE\u6765\u3002": {
        readonly en: "These weren't unpacked: {p} — this device can't keep the sound (out of space, or the browser doesn't allow it) and it's not in the family sound library, so it couldn't be recovered.";
    };
    readonly 复制下来贴进作品说明: {
        readonly en: "Copy this and paste it into your work's description";
    };
    readonly 复制署名: {
        readonly en: "Copy credits";
    };
    readonly 署名复制好了: {
        readonly en: "Credits copied";
    };
    readonly "\u590D\u5236\u4E0D\u4E86\uFF08\u6D4F\u89C8\u5668\u4E0D\u8BA9\uFF09\uFF1A\u957F\u6309\u4E0A\u9762\u7684\u5B57\u81EA\u5DF1\u9009": {
        readonly en: "Can't copy (the browser won't allow it): long-press the text above to select it";
    };
    readonly "\u6E32\u4E00\u904D\uFF0C\u7F16\u6210 mp3\uFF0C\u5206\u4EAB\u6216\u4E0B\u8F7D\uFF1B\u6E32\u597D\u7684\u90A3\u4EFD\u8BB0\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u5E93\u91CC\u8FD9\u9996\u6B4C\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C": {
        readonly en: "Render once into an mp3 to share or download. The render is remembered on this device, so you can play it straight from this song’s cover in the library";
    };
    readonly "\u6B4C\u58F0\uFF08mp3\uFF09\u2026": {
        readonly en: "MP3…";
    };
    readonly "\u5370\u51FA\u6765\u7684\u8C31\uFF08\u6309\u8FD9\u9996\u6B4C\u7684\u7EB8\u5F20\u5206\u9875\uFF1B\u6B4C\u8BCD\u7528\u5D4C\u8FDB\u53BB\u7684\u5B57\u4F53\uFF0C\u80FD\u9009\u4E2D\u590D\u5236\uFF09": {
        readonly en: "A printed score (paged by this song's paper; lyrics use an embedded font and can be selected and copied)";
    };
    readonly "\u4E50\u8C31\uFF08PDF\uFF09\u2026": {
        readonly en: "Score (PDF)…";
    };
    readonly "\u73B0\u5728\u8FD9\u9996\u6B4C\u7684\u4E00\u4EFD\u62F7\u8D1D\uFF08\u6587\u4EF6\u540D\u5E26\u65F6\u523B\uFF09\uFF1B\u8FD9\u91CC\u7684\u6B4C\u8FD8\u4F4F\u539F\u6765\u7684\u5BB6": {
        readonly en: "A copy of the song as it is now (timestamped file name); the song here stays in its home";
    };
    readonly "\u5B58\u4E00\u4EFD .mxl \u526F\u672C\u2026": {
        readonly en: "Save an .mxl copy…";
    };
    readonly "\u526F\u672C\u91CC\u628A\u4E50\u5668\u7684\u58F0\u97F3\u4E5F\u88C5\u8FDB\u53BB\uFF08\u53D1\u7ED9\u522B\u4EBA\u4E5F\u80FD\u54CD\uFF09\uFF1B\u8FD9\u91CC\u7684\u6B4C\u7167\u65E7\u53EA\u8BB0\u6765\u6E90": {
        readonly en: "The copy also carries the instruments' sounds (works when sent to others); the song here still only records sources";
    };
    readonly "\u5B58\u4E00\u4EFD .mxl \u526F\u672C\uFF08\u6253\u5305\u97F3\u6E90\uFF09\u2026": {
        readonly en: "Save an .mxl copy (packed sounds)…";
    };
    readonly "\u5BFC\u51FA = \u5BC4\u4E00\u4EFD\u51FA\u53BB\uFF0C\u8FD9\u91CC\u7684\u6B4C\u8FD8\u662F\u539F\u6765\u90A3\u4E2A\u5BB6\uFF0C\u300C\u5B58\u300D\u624D\u662F\u5B58\u56DE\u53BB\u3002": {
        readonly en: "Export = send out a copy; the song here keeps its home, and “Save” is what saves back.";
    };
    readonly "\u4E50\u8C31\uFF08PDF\uFF09": {
        readonly en: "Score (PDF)";
    };
    readonly 印哪些: {
        readonly en: "What to print";
    };
    readonly "\u6BCF\u5F20\u7EB8\u6309\u987A\u5E8F\u63A5\u7740\u6392\uFF08= \u5206\u9875 + \u300C\u5168\u90E8\u300D\uFF09": {
        readonly en: "Each sheet in order (= paged + “All”)";
    };
    readonly "\u8FD9\u4E00\u6BB5\u300C{p}\u300D": {
        readonly en: "This section “{p}”";
    };
    readonly 这张纸: {
        readonly en: "This sheet";
    };
    readonly "\u53EA\u5370\u5149\u6807\u6240\u5728\u7684\u8FD9\u5F20\u7EB8\uFF08= \u5206\u9875 + \u300C\u672C\u6BB5\u300D\uFF09": {
        readonly en: "Print only the sheet with the cursor (= paged + “This section”)";
    };
    readonly 声部: {
        readonly en: "Parts";
    };
    readonly 照分页预览: {
        readonly en: "As in the paged preview";
    };
    readonly "\u9690\u85CF\u7684\u58F0\u90E8\u4E0D\u5370\uFF0C\u9884\u89C8\u91CC\u90A3\u6761\u7EC6\u884C\u7684\u4F4D\u7F6E\u7A7A\u7740\uFF08\u548C\u9884\u89C8\u4E00\u6837\uFF09": {
        readonly en: "Hidden parts aren't printed; their thin line's spot stays blank (same as the preview)";
    };
    readonly "\u53EA\u6392\u770B\u5F97\u89C1\u7684\uFF1A{p}": {
        readonly en: "Only visible parts: {p}";
    };
    readonly "\u9690\u85CF\u7684\u58F0\u90E8\u6574\u4E2A\u62FF\u6389\u3001\u91CD\u65B0\u6392\uFF0C\u4E0D\u7559\u7A7A\u4F4D\uFF08\u50CF\u62BD\u51FA\u6765\u7684\u5206\u8C31\uFF1B\u548C\u5206\u9875\u9884\u89C8\u4E0D\u4E00\u6837\uFF09": {
        readonly en: "Hidden parts are removed and it's re-laid out with no gaps (like an extracted part; differs from the paged preview)";
    };
    readonly 谱上的字用: {
        readonly en: "Score text in";
    };
    readonly "\u7B2C\u4E00\u6B21\u8981\u4E0B\u8F7D\u5B57\u4F53\uFF08\u601D\u6E90\u9ED1\u4F53\uFF0C\u7EA6 {p} MB\uFF09\uFF0C\u4E4B\u540E\u79BB\u7EBF\u4E5F\u80FD\u7528\u3002\u7EB8\u5F20 = \u8FD9\u9996\u6B4C\u7684\u7EB8\uFF08\u9875\u9762\u8BBE\u7F6E\u91CC\u6539\uFF09\u3002": {
        readonly en: "The font (Source Han Sans) downloads the first time (about {p} MB), then works offline. Paper = this song's paper (change it in Page settings).";
    };
    readonly "\u53EA\u6392\u770B\u5F97\u89C1\u7684\u58F0\u90E8\uFF08{p}\uFF09\uFF1A\u91CD\u65B0\u6392\u3001\u4E0D\u7559\u7A7A\u4F4D\u2014\u2014\u548C\u5206\u9875\u9884\u89C8\u4E0D\u4E00\u6837\u3002": {
        readonly en: "Only visible parts ({p}): re-laid out with no gaps — differs from the paged preview.";
    };
    readonly "\u5370\u51FA\u6765\u7684 = \u9875\u9762\u8BBE\u7F6E\u91CC\u300C\u5206\u9875\u300D+ \u66F2\u6BB5\u63A7\u4EF6\u300C{p}\u300D\u770B\u5230\u7684\u6837\u5B50\uFF0C\u53BB\u6389\u6309\u94AE\u548C\u63D0\u793A\uFF1B\u9690\u85CF\u7684{p2}\u58F0\u90E8\u4E0D\u5370\uFF08\u9884\u89C8\u91CC\u90A3\u6761\u7EC6\u884C\u7684\u4F4D\u7F6E\u7A7A\u7740\uFF09\u3002": {
        readonly en: "Printed = what you see with “Paged” in Page settings + “{p}” on the section control, minus buttons and hints; hidden {p2}parts aren't printed (their thin line's spot stays blank).";
    };
    readonly 本段: {
        readonly en: "This section";
    };
    readonly 全部: {
        readonly en: "All";
    };
    readonly "\u7EB8 / ": {
        readonly en: "sheets /";
    };
    readonly "\u7167\u8FD9\u9996\u6B4C\u9875\u9762\u8BBE\u7F6E\u300C\u770B\u8C31\u300D\u9875\u7684\u8BBE\u7F6E\u5370\uFF1A{w}\uFF08\u5728\u90A3\u513F\u6539\uFF09\u3002": {
        readonly en: "Printed with this song's Page settings › Reading: {w} (change them there).";
    };
    readonly "\u6309 C \u8C03\u770B\uFF08\u6BCF\u4E2A\u8C03\u53F7\u4E0A\u65B9\u5370\u300C1=\u539F\u6765\u7684\u8C03\u300D\uFF09": {
        readonly en: "read in C (“1=original key” above each key signature)";
    };
    readonly 和弦级数: {
        readonly en: "chord degrees";
    };
    readonly 不印演奏法和表情: {
        readonly en: "without articulations & dynamics";
    };
    readonly "\u751F\u6210 PDF": {
        readonly en: "Create PDF";
    };
    readonly "\u4E0B\u8F7D\u5B57\u4F53\uFF08\u7B2C\u4E00\u6B21\u7EA6 {p} MB\uFF09\u2026": {
        readonly en: "Downloading font (about {p} MB the first time)…";
    };
    readonly "\u6392\u7248\u2026": {
        readonly en: "Laying out…";
    };
    readonly "\u8FD9\u4E9B\u5B57\u8FD9\u6B3E\u5B57\u4F53\u91CC\u6CA1\u6709\uFF0CPDF \u91CC\u662F\u7A7A\u767D\uFF1A{p}{p2}": {
        readonly en: "This font doesn't have these characters, so they're blank in the PDF: {p}{p2}";
    };
    readonly "\u6709 {n} \u79CD\u8BB0\u8C31\u7B26\u53F7\u6CA1\u753B\u51FA\u6765\uFF08{p}\uFF09\u2014\u2014\u8FD9\u662F app \u7684\u6BDB\u75C5\uFF0C\u8BF7\u544A\u8BC9\u6211\u4EEC\u3002": {
        readonly en: "{n} notation symbols weren't drawn ({p}) — that's a bug in the app, please tell us.";
    };
    readonly "\u4E50\u8C31 PDF \u597D\u4E86": {
        readonly en: "Score PDF is ready";
    };
    readonly "{pages} \u9875 \u00B7 {p} \u00B7 {e6}{miss}{missM}": {
        readonly en: "{pages} {pages|page|pages} · {p} · {e6}{miss}{missM}";
    };
    readonly 黑体: {
        readonly en: "Sans";
    };
    readonly "PDF \u751F\u6210\u5931\u8D25\uFF1A{Error}": {
        readonly en: "PDF creation failed: {Error}";
    };
    readonly 乐器的声音: {
        readonly en: "Instrument sounds";
    };
    readonly "{n} \u4EF6\uFF1A\u6253\u5305\u5728\u6B4C\u91CC {n2} \u4EF6{length}\uFF0C\u53EA\u8BB0\u6765\u6E90 {n3} \u4EF6\u3002\u6253\u5305 = \u58F0\u97F3\u8DDF\u7740\u6B4C\u8D70\uFF08\u53D1\u7ED9\u522B\u4EBA\u4E5F\u80FD\u54CD\uFF0C\u6587\u4EF6\u53D8\u5927\uFF09\uFF1B\u53EA\u8BB0\u6765\u6E90 = \u6B4C\u5C0F\uFF0C\u58F0\u97F3\u4ECE\u8FD9\u53F0\u8BBE\u5907 / \u5BB6\u65CF\u97F3\u6E90\u5E93 / \u4F60\u7684\u6587\u4EF6\u91CC\u627E\u3002\u5C0F\u6708\u76F8\u4E0D\u6253\u5305\uFF08\u5979\u662F\u6A21\u578B\u5305\uFF0C\u6B4C\u91CC\u53EA\u9489\u54C8\u5E0C\uFF09\u3002": {
        readonly en: "{n} items: {n2} packed in the song{length}, {n3} source-only. Packed = the sound travels with the song (works when sent to others, bigger file); source-only = small song, the sound is found on this device / in the family sound library / in your files. Tsukuyomi-chan isn't packed (she's a model pack, the song only pins a hash).";
    };
    readonly 全部打包进歌: {
        readonly en: "Pack everything into the song";
    };
    readonly "\u5168\u90E8\u89E3\u5305\uFF08\u53EA\u8BB0\u6765\u6E90\uFF09": {
        readonly en: "Unpack everything (source only)";
    };
    readonly "\u6253\u5305\u5206\u53D1\u7684\u8BB8\u53EF\uFF08\u6587\u4EF6\u91CC\u5E26\u7740\u8FD9\u4E9B\u6E90\u6587\u4EF6\uFF09": {
        readonly en: "Licenses for packed distribution (the file carries these source files)";
    };
    readonly "\u5728\u6B4C\u5E93\u91CC\uFF08\u6587\u4EF6\u5939\u300C{label}\u300D\uFF09\uFF0C\u81EA\u52A8\u5B58\uFF1B\u6362\u6B4C / \u9000\u51FA / \u6309\u300C\u5B58\u300D\u65F6\u5199\u8FDB\u6587\u4EF6\u5939": {
        readonly en: "In the library (folder “{label}”), autosaved; written to the folder when switching songs / leaving / pressing Save";
    };
    readonly "\u5728\u6B4C\u5E93\u91CC\uFF0C\u81EA\u52A8\u5B58{p}": {
        readonly en: "In the library, autosaved{p}";
    };
    readonly "\uFF1B\u6362\u6B4C / \u9000\u51FA / \u6309\u300C\u5B58\u300D\u65F6\u63A8\u4E0A OneDrive": {
        readonly en: "; uploaded to OneDrive when switching songs / leaving / pressing Save";
    };
    readonly "\uFF08\u6CA1\u767B\u5F55\uFF0C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF09": {
        readonly en: " (not signed in, only on this device)";
    };
    readonly "\uFF08\u53EA\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\uFF1B\u7F51\u76D8\u5728\u5B98\u7F51\u7248\uFF09": {
        readonly en: " (only in this browser; OneDrive is on the official site)";
    };
    readonly "\u5B58\u5728\u672C\u673A\u6587\u4EF6 {name}\uFF0C\u300C\u5B58\u300D= \u5B58\u56DE\u53BB": {
        readonly en: "Stored in local file {name}; “Save” saves back to it";
    };
    readonly "\u65B0\u7684\u4E00\u9996\uFF1A\u7B2C\u4E00\u7B14\u5199\u4E0B\u53BB\u5C31\u8FDB\u6B4C\u5E93": {
        readonly en: "New song: joins the library with the first thing you write";
    };
    readonly "\u8FD8\u6CA1\u5B58\u8FC7\uFF1A\u300C\u5B58\u300D\u4F1A\u95EE\u5B58\u5230\u54EA": {
        readonly en: "Not saved yet: “Save” will ask where";
    };
    readonly "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u300C\u5B58\u300D= \u4E0B\u8F7D\u6216\u5206\u4EAB\u4E00\u4E2A .mxl": {
        readonly en: "On this device “Save” = download or share an .mxl";
    };
    readonly "\u672C\u673A\u6587\u4EF6\u7684\u540D\u5B57\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u91CC\u6539\uFF08\u73B0\u5728\u662F {name}\uFF09": {
        readonly en: "Rename local files in your file manager (currently {name})";
    };
    readonly "\u6253\u5F00\u672C\u673A\u6587\u4EF6\u2026": {
        readonly en: "Open local file…";
    };
    readonly "\u6253\u5F00 .mxl / .musicxml\uFF08\u62D6\u8FDB\u6765\u4E5F\u884C\uFF1BCtrl / \u2318+O\uFF09": {
        readonly en: "Open .mxl / .musicxml (or drag it in; Ctrl / ⌘+O)";
    };
    readonly "\u5BFC\u51FA\u2026": {
        readonly en: "Export…";
    };
    readonly "mp3\u3001.mxl \u526F\u672C\uFF08\u6253\u5305\u97F3\u6E90\uFF09\u2026\uFF08Ctrl / \u2318+Shift+S\uFF09": {
        readonly en: "mp3, .mxl copy (packed sounds)… (Ctrl / ⌘+Shift+S)";
    };
    readonly 渲染到缓存: {
        readonly en: "Render to cache";
    };
    readonly "\u6E32\u4E00\u904D\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF08\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF09\uFF1A\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF1B\u4E0D\u5BFC\u51FA\u6587\u4EF6": {
        readonly en: "Renders this song into the render cache (this device only) so you can play it from its cover in the library; no file is exported";
    };
    readonly 存进歌库: {
        readonly en: "Save to library";
    };
    readonly "\u628A\u8FD9\u9996\u6B4C\u653E\u8FDB\u6B4C\u5E93\uFF08\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7559\u4E00\u4EFD\uFF1B\u767B\u5F55\u540E\u540C\u6B65\u5230 OneDrive\uFF09": {
        readonly en: "Put this song in the library (a copy stays on this device; syncs to OneDrive after signing in)";
    };
    readonly "\u628A\u8FD9\u9996\u6B4C\u653E\u8FDB\u6B4C\u5E93\uFF08\u53EA\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\u7559\u4E00\u4EFD\uFF1B\u7F51\u76D8\u5728\u5B98\u7F51\u7248\uFF09": {
        readonly en: "Put this song in the library (a copy stays only in this browser; OneDrive is on the official site)";
    };
    readonly "\u6539\u6587\u4EF6\u540D\u2026": {
        readonly en: "Rename file…";
    };
    readonly "\u53EA\u6539\u6587\u4EF6\u540D\uFF0C\u7EB8\u4E0A\u7684\u6B4C\u540D\u4E0D\u53D8\uFF08\u70B9\u9876\u680F\u7684\u6587\u4EF6\u540D\u4E5F\u4E00\u6837\uFF09": {
        readonly en: "Only the file name changes, not the title on the sheet (same as tapping the file name at the top)";
    };
    readonly "\u5C01\u9762\u56FE\u2026": {
        readonly en: "Cover image…";
    };
    readonly 歌库卡片上的图: {
        readonly en: "The picture on the library card";
    };
    readonly "\u58F0\u97F3\u4E0E\u7F72\u540D\u2026": {
        readonly en: "Sounds and credits…";
    };
    readonly "\u4E50\u5668\u7684\u58F0\u97F3\u6253\u5305 / \u89E3\u5305\uFF1B\u8FD9\u9996\u6B4C\u7528\u4E86\u8C01\u7684\u58F0\u97F3": {
        readonly en: "Pack / unpack instrument sounds; whose sounds this song uses";
    };
    readonly "\u9501\u4E0A\uFF08\u5148\u4E0D\u6539\u4E86\uFF09": {
        readonly en: "Lock (done editing for now)";
    };
    readonly "\u5148\u628A\u6539\u52A8\u5B58\u597D\uFF0C\u518D\u628A\u8FD9\u9996\u6B4C\u9501\u4E0A\uFF1A\u4E4B\u540E\u6253\u5F00\u662F\u53EA\u80FD\u770B\u3001\u80FD\u542C\u7684\uFF0C\u70B9\u300C\u63A5\u7740\u6539\u300D\u968F\u65F6\u89E3\u5F00": {
        readonly en: "Saves your changes, then locks this song: it opens view-and-listen only until you tap “Keep editing”";
    };
    readonly 收起参考窗: {
        readonly en: "Hide reference window";
    };
    readonly "\u53C2\u8003\u7A97{p}": {
        readonly en: "Reference window{p}";
    };
    readonly "\uFF08{p} \u5F20\uFF09": {
        readonly en: " ({p} {p|item|items})";
    };
    readonly "\u622A\u56FE / \u6587\u5B57\u653E\u5728\u65C1\u8FB9\u5BF9\u7740\u770B\uFF1A\u70B9\u5F00\u540E\u7C98\u8D34\uFF08Ctrl / \u2318+V\uFF09\u3001\u62D6\u8FDB\u6765\uFF0C\u6216\u8005\u300C\uFF0B\u300D\u5BFC\u5165\uFF1B\u8DDF\u7740\u6B4C\u4E00\u8D77\u5B58": {
        readonly en: "Keep screenshots / text beside you to refer to: open it, then paste (Ctrl / ⌘+V), drag in, or import with “＋”; saved with the song";
    };
    readonly "\u8BBE\u7F6E\u2026": {
        readonly en: "Settings…";
    };
    readonly "\u6A21\u578B / \u97F3\u6E90\u5E93\u6765\u6E90\u3001\u7F13\u5B58\u3001\u7F72\u540D\u4E0E\u6761\u6B3E\u3001\u8BCA\u65AD\u65E5\u5FD7\u3001\u7248\u672C": {
        readonly en: "Model / sound library sources, cache, credits and terms, diagnostic log, version";
    };
    readonly "\u6CA1\u9501\u4E0A\uFF1A\u6539\u52A8\u8FD8\u6CA1\u5B58\u597D\uFF08\u518D\u8BD5\u4E00\u6B21\uFF09\u3002": {
        readonly en: "Not locked: the changes are not saved yet (try again).";
    };
    readonly "\u6CA1\u9501\u4E0A\uFF1A\u6539\u52A8\u6CA1\u6709\u5199\u56DE\u6587\u4EF6\u3002": {
        readonly en: "Not locked: the changes were not written back to the file.";
    };
    readonly "\u9501\u4E0A\u4E86\u3002\u8981\u6539\uFF0C\u70B9\u8C31\u4E0A\u9762\u7684\u300C\u63A5\u7740\u6539\u300D\u3002": {
        readonly en: "Locked. To edit, tap “Keep editing” above the score.";
    };
    readonly "\u6CA1\u9501\u4E0A\uFF1A{Error}": {
        readonly en: "Not locked: {Error}";
    };
    readonly 封面图: {
        readonly en: "Cover image";
    };
    readonly 没有封面图: {
        readonly en: "No cover image";
    };
    readonly "\u9009\u4E00\u5F20\u56FE\u5F53\u5C01\u9762\uFF08\u7F29\u6210 256\u00B2 \u5B58\u8FDB\u6B4C\u91CC\uFF1B\u6B4C\u5E93\u5361\u7247\u4E0A\u6B4C\u540D\u5370\u5728\u56FE\u4E0A\u9762\uFF09": {
        readonly en: "Choose an image as the cover (shrunk to 256² and stored in the song; the library card prints the title over it)";
    };
    readonly "\u6362\u4E00\u5F20\u2026": {
        readonly en: "Replace…";
    };
    readonly "\u9009\u4E00\u5F20\u56FE\u2026": {
        readonly en: "Choose an image…";
    };
    readonly 去掉封面图: {
        readonly en: "Remove cover image";
    };
    readonly "\u6B4C\u5E93\u5361\u7247\u4E0A\u7684\u56FE\uFF1B\u6B4C\u540D\u548C\u65E5\u671F\u7167\u6837\u5370\u5728\u4E0A\u9762\u3002\u7F29\u6210 256\u00B2 \u5B58\u8FDB\u6B4C\u91CC\u3002": {
        readonly en: "The picture on the library card; title and date still print over it. Shrunk to 256² and stored in the song.";
    };
    readonly 去掉了封面图: {
        readonly en: "Cover image removed";
    };
    readonly 声音与署名: {
        readonly en: "Sounds and credits";
    };
    readonly "\u8FD9\u9996\u6B4C\u6CA1\u7528\u4E50\u5668\u7684\u58F0\u97F3\u6587\u4EF6\uFF08\u5C0F\u6708\u76F8 / \u5143\u97F3\u7248\u7684\u58F0\u97F3\u968F app \u8D70\uFF0C\u4E0D\u8FDB\u6B4C\uFF09\u3002": {
        readonly en: "This song uses no instrument sound files (Tsukuyomi-chan / vowel versions come with the app, not the song).";
    };
    readonly 改文件名: {
        readonly en: "Rename file";
    };
    readonly 文件名: {
        readonly en: "File name";
    };
    readonly "\u53EA\u6539\u6587\u4EF6\u540D\uFF0C\u7EB8\u4E0A\u7684\u6B4C\u540D\u4E0D\u53D8\u3002\u4E0B\u6B21\u5B58\u7684\u65F6\u5019\u7528\u8FD9\u4E2A\u540D\u5B57\u3002": {
        readonly en: "Only the file name changes, not the title on the sheet. The next save uses this name.";
    };
    readonly 改: {
        readonly en: "Rename";
    };
    readonly "\u6587\u4EF6\u540D\u6539\u6210 {stem}{SONG_SUFFIX}": {
        readonly en: "File renamed to {stem}{SONG_SUFFIX}";
    };
    readonly "\u6253\u5F00\u300C{name}\u300D": {
        readonly en: "Opened “{name}”";
    };
    readonly "\u6253\u5F00\u300C{id}\u300D": {
        readonly en: "Opening “{id}”";
    };
    readonly "\u6253\u4E0D\u5F00\u300C{id}\u300D\uFF1A\u8FD9\u53F0\u8BBE\u5907\u4E0A\u6CA1\u6709\u5B83\u7684\u5B57\u8282\uFF08\u79BB\u7EBF\u3001\u6216\u8FD8\u6CA1\u4ECE\u4E91\u7AEF\u62C9\u4E0B\u6765\uFF09": {
        readonly en: "Can't open “{id}”: its bytes aren't on this device (offline, or not pulled from the cloud yet)";
    };
    readonly "\u65B0\u7684\u4E00\u9996\uFF08\u7B2C\u4E00\u7B14\u5199\u4E0B\u53BB\u5C31\u8FDB\u6B4C\u5E93\uFF09": {
        readonly en: "New song (joins the library with the first thing you write)";
    };
    readonly "\u8FD8\u662F\u7A7A\u7684\uFF1A\u5199\u4E0B\u7B2C\u4E00\u7B14\u5C31\u81EA\u52A8\u8FDB\u6B4C\u5E93": {
        readonly en: "Still empty: joins the library automatically with the first thing you write";
    };
    readonly "\u8FDB\u6B4C\u5E93\u4E86\uFF1A{stem}{SONG_SUFFIX}": {
        readonly en: "In the library: {stem}{SONG_SUFFIX}";
    };
    readonly "\u53EA\u6539\u6587\u4EF6\u540D\uFF0C\u7EB8\u4E0A\u7684\u6B4C\u540D\u4E0D\u53D8\u3002": {
        readonly en: "Only the file name changes, not the title on the sheet.";
    };
    readonly "\u300C{v}\u300D\u5DF2\u7ECF\u6709\u4E86\uFF08{p}\uFF09\uFF0C\u6CA1\u6539": {
        readonly en: "“{v}” already exists ({p}), not renamed";
    };
    readonly 云端: {
        readonly en: "in the cloud";
    };
    readonly 这台设备上: {
        readonly en: "on this device";
    };
    readonly 这次没动: {
        readonly en: "Nothing changed this time";
    };
    readonly "\u6587\u4EF6\u540D\u6539\u6210 {stem}{SONG_SUFFIX}\uFF1B\u7167\u4F60\u7684\u610F\u601D\uFF0C\u4E91\u7AEF\u65E7\u540D\u90A3\u4EFD\u7559\u7740\u6CA1\u52A8": {
        readonly en: "File renamed to {stem}{SONG_SUFFIX}; as you chose, the copy under the old name in the cloud stays untouched";
    };
    readonly "\u6587\u4EF6\u540D\u6539\u6210 {stem}{SONG_SUFFIX}\uFF08\u65E7\u540D\u7684\u90A3\u4EFD\u8C31\u7CFB\u4E0D\u660E\uFF0C\u4E91\u7AEF\u539F\u5730\u7559\u7740\u4E86\u2014\u2014\u6B4C\u5E93\u91CC\u8FD8\u770B\u5F97\u89C1\uFF09": {
        readonly en: "File renamed to {stem}{SONG_SUFFIX} (the copy under the old name has an unknown history, so it stays in the cloud — still visible in the library)";
    };
    readonly "\u8FD9\u4E2A\u90E8\u7F72\u65B9\u5F0F\u6CA1\u6709\u6B4C\u5E93\uFF08itch\uFF1A\u6B4C\u53EA\u7528\u6587\u4EF6\u5B58\uFF09": {
        readonly en: "This deployment has no library (itch: songs only use files)";
    };
    readonly "\u8FD9\u4E2A\u90E8\u7F72\u65B9\u5F0F\u6CA1\u6709\u7F51\u76D8\uFF08\u5907\u7528\u7248\uFF1A\u6B4C\u5E93\u7684\u5BB6\u53EA\u80FD\u662F\u6587\u4EF6\u5939\uFF09": {
        readonly en: "This deployment has no OneDrive (standalone version: the library's home can only be a folder)";
    };
    readonly "\u300C{stem}\u300D\u5DF2\u7ECF\u8FDB\u4E86\u56DE\u6536\u7AD9\uFF1B\u624B\u91CC\u8FD9\u4EFD\u73B0\u5728\u6CA1\u6709\u5BB6\u4E86\uFF08\u300C\u5B58\u300D\u4F1A\u95EE\u5B58\u5230\u54EA\uFF0C\u6216\u300C\u5B58\u8FDB\u6B4C\u5E93\u300D\uFF09\u3002": {
        readonly en: "“{stem}” is now in the trash; the copy in hand has no home now (“Save” will ask where, or “Save to library”).";
    };
    readonly 进歌库: {
        readonly en: "Save to library";
    };
    readonly 歌库要先有个家: {
        readonly en: "The library needs a home first";
    };
    readonly "\u6B4C\u653E\u5728\u6D4F\u89C8\u5668\u5916\u9762\u3001\u4F60\u81EA\u5DF1\u591F\u5F97\u7740\u7684\u5730\u65B9\uFF0C\u624D\u4E0D\u6015\u6D4F\u89C8\u5668\u6E05\u7F13\u5B58\u3002{cloud}{folder}\u4E0D\u60F3\u9009\u4E5F\u884C\uFF1A\u300C\u5B58\u300D= \u5B58\u6210\u6587\u4EF6\uFF0C\u300C\u6253\u5F00\u300D= \u9009\u6587\u4EF6\u3002": {
        readonly en: "Keep songs outside the browser, somewhere you can reach, so clearing browser data can't hurt them. {cloud}{folder}You can skip this too: “Save” = save as a file, “Open” = choose a file.";
    };
    readonly "\u7F51\u76D8\u5728\u5B98\u7F51\u7248\u91CC\uFF08{SITE_HOST}\uFF09\u3002": {
        readonly en: "OneDrive is on the official site ({SITE_HOST}).";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u9009\u4E0D\u4E86\u6587\u4EF6\u5939\uFF08\u684C\u9762\u7248 Chrome / Edge \u53EF\u4EE5\uFF09\u3002": {
        readonly en: "This browser can't choose folders (desktop Chrome / Edge can).";
    };
    readonly "\u8FDE\u63A5\u7F51\u76D8\uFF08OneDrive\uFF09": {
        readonly en: "Connect OneDrive";
    };
    readonly 选一个文件夹: {
        readonly en: "Choose a folder";
    };
    readonly 换到文件夹: {
        readonly en: "Switch to a folder";
    };
    readonly "\u6CA1\u62FF\u5230\u300C{label}\u300D\u7684\u6743\u9650\uFF1A\u6539\u52A8\u8FD8\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u4E00\u9996\u6CA1\u4E22\u3002": {
        readonly en: "Didn't get permission for “{label}”: changes are still on this device, no songs lost.";
    };
    readonly "\u6587\u4EF6\u5939\u300C{label}\u300D\u7684\u6743\u9650\u6389\u4E86\uFF1A\u6539\u52A8\u5148\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u4E00\u9996\u6CA1\u4E22": {
        readonly en: "Permission for folder “{label}” was lost: changes are saved on this device for now, no songs lost";
    };
    readonly 重新授权: {
        readonly en: "Re-authorize";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\u8FD8\u6709 {legacyLeft} \u9996\u65E7\u6B4C\uFF0C\u6CA1\u642C\u8FDB\u300C{label}\u300D": {
        readonly en: "This browser still has {legacyLeft} old {legacyLeft|song|songs} not moved into “{label}”";
    };
    readonly 搬进来: {
        readonly en: "Move them in";
    };
    readonly 全部导出: {
        readonly en: "Export all";
    };
    readonly "\u8FD9\u4E9B\u6B4C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u7684\u6D4F\u89C8\u5668\u91CC\uFF0C\u6CA1\u6709\u5907\u4EFD": {
        readonly en: "These songs exist only in this device's browser, with no backup";
    };
    readonly 搬进一个文件夹: {
        readonly en: "Move into a folder";
    };
    readonly 连接网盘: {
        readonly en: "Connect OneDrive";
    };
    readonly "\u6B4C\u5E93\u5728\u6587\u4EF6\u5939\u300C{label}\u300D": {
        readonly en: "Library is in folder “{label}”";
    };
    readonly "\u6B4C\u5C31\u662F\u8FD9\u4E2A\u6587\u4EF6\u5939\u91CC\u7684 .mxl\uFF0C\u8D44\u6E90\u7BA1\u7406\u5668\u91CC\u4E5F\u770B\u5F97\u5230\uFF1B\u56DE\u6536\u7AD9 / \u5907\u4EFD\u7BB1\u662F\u91CC\u9762\u7684 .trash / .backup\u3002{lost}": {
        readonly en: "Songs are the .mxl files in this folder, visible in your file manager too; the trash / backup are .trash / .backup inside it. {lost}";
    };
    readonly "\n\u73B0\u5728\u6743\u9650\u6389\u4E86\uFF1A\u6539\u52A8\u5148\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3002": {
        readonly en: "\nPermission is lost now: changes are saved on this device for now.";
    };
    readonly "\u4E0D\u7528\u8FD9\u4E2A\u6587\u4EF6\u5939\u4E86\u2026": {
        readonly en: "Stop using this folder…";
    };
    readonly "\u5939\u91CC\u7684\u6B4C\u4E00\u9996\u4E0D\u52A8\uFF1B\u4E4B\u540E\u53EF\u4EE5\u518D\u9009\u4E00\u4E2A\u5BB6": {
        readonly en: "Songs in the folder stay untouched; you can choose another home later";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\u6709 {n} \u9996\u6B4C": {
        readonly en: "This browser has {n} {n|song|songs}";
    };
    readonly "\u5B83\u4EEC\u53EA\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\uFF0C\u6E05\u7F13\u5B58\u5C31\u6CA1\u4E86\u3002{f}\u7A0D\u540E\u4E5F\u884C\uFF1A\u6B4C\u5E93\u9876\u4E0A\u90A3\u6761\u8FD8\u5728\u3002": {
        readonly en: "They exist only in this browser and vanish if it's cleared. {f}Later is fine too: the bar at the top of the library stays.";
    };
    readonly "\u642C\u8FDB\u300C{label}\u300D\uFF1A\u9010\u9996\u6838\u5BF9\u5B57\u8282\uFF0C\u4E00\u6A21\u4E00\u6837\u624D\u4ECE\u6D4F\u89C8\u5668\u79FB\u8D70\u3002": {
        readonly en: "Move into “{label}”: bytes are checked song by song, and removed from the browser only if identical.";
    };
    readonly "\u9009\u4E00\u4E2A\u5BB6\u642C\u8FC7\u53BB\uFF1B\u6216\u8005\u5148\u5168\u90E8\u5BFC\u51FA\u6210\u6587\u4EF6\u3002": {
        readonly en: "Choose a home to move them to, or export everything as files first.";
    };
    readonly "\u642C\u8FDB\u300C{label}\u300D": {
        readonly en: "Move into “{label}”";
    };
    readonly "\u9009\u4E00\u4E2A\u6587\u4EF6\u5939\uFF0C\u642C\u8FDB\u53BB": {
        readonly en: "Choose a folder and move in";
    };
    readonly 稍后: {
        readonly en: "Later";
    };
    readonly "\u6B63\u5728\u628A\u6B4C\u642C\u8FDB\u300C{label}\u300D\u2026": {
        readonly en: "Moving songs into “{label}”…";
    };
    readonly 没写进文件夹: {
        readonly en: "Not written to the folder";
    };
    readonly "\u65E7\u5E93\u6CA1\u79FB\u8D70\uFF08{status}\uFF09": {
        readonly en: "Old library copy not removed ({status})";
    };
    readonly "\u6B63\u5728\u642C\u6B4C {done} / {total}\u2026": {
        readonly en: "Moving songs {done} / {total}…";
    };
    readonly "\u642C\u5BB6\u6CA1\u6210\uFF1A{Error}\u3002\u6D4F\u89C8\u5668\u91CC\u7684\u6B4C\u4E00\u9996\u6CA1\u52A8\u3002": {
        readonly en: "Move failed: {Error}. No songs in the browser were touched.";
    };
    readonly "\u4E91\u7AEF\uFF08OneDrive\uFF09": {
        readonly en: "Cloud (OneDrive)";
    };
    readonly "\u5DF2\u767B\u5F55{who}\u3002\u6B4C\u5E93\u540C\u6B65\u5230 OneDrive \u7684\u300C\u5E94\u7528\u300D\u6587\u4EF6\u5939\uFF08\u8FD9\u4E2A app \u53EA\u80FD\u770B\u81EA\u5DF1\u7684\u90A3\u4E2A\u5939\uFF0C\u770B\u4E0D\u5230\u4F60\u522B\u7684\u6587\u4EF6\uFF09\u3002": {
        readonly en: "Signed in{who}. The library syncs to OneDrive's Apps folder (this app can only see its own folder, none of your other files).";
    };
    readonly "\u767B\u5F55\u5FAE\u8F6F\u4E2A\u4EBA\u8D26\u53F7\u540E\uFF0C\u6B4C\u5E93\u540C\u6B65\u5230 OneDrive \u7684\u300C\u5E94\u7528\u300D\u6587\u4EF6\u5939\uFF08\u8FD9\u4E2A app \u53EA\u80FD\u770B\u81EA\u5DF1\u7684\u90A3\u4E2A\u5939\uFF0C\u770B\u4E0D\u5230\u4F60\u522B\u7684\u6587\u4EF6\uFF09\u3002\u4E0D\u767B\u5F55\u4E5F\u80FD\u7528\uFF0C\u6B4C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3002": {
        readonly en: "After signing in with a personal Microsoft account, the library syncs to OneDrive's Apps folder (this app can only see its own folder, none of your other files). It works without signing in, with songs only on this device.";
    };
    readonly 刷新云端: {
        readonly en: "Refresh cloud";
    };
    readonly 退出登录: {
        readonly en: "Sign out";
    };
    readonly 歌还留在这台设备上: {
        readonly en: "Songs stay on this device";
    };
    readonly 登录微软账号: {
        readonly en: "Sign in with Microsoft";
    };
    readonly "MoonSinger-\u6B4C\u5E93-{p}{p2}{p3}-{p4}{p5}.zip": {
        readonly en: "MoonSinger-library-{p}{p2}{p3}-{p4}{p5}.zip";
    };
    readonly "\u6B63\u5728\u6253\u5305\u6B4C\u5E93\u2026": {
        readonly en: "Packing the library…";
    };
    readonly 歌库打包好了: {
        readonly en: "Library packed";
    };
    readonly "\u5BFC\u51FA\u6CA1\u6210\uFF1A{Error}": {
        readonly en: "Export failed: {Error}";
    };
    readonly "\u8FD8\u6709 {n} \u9996\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939": {
        readonly en: "{n} {n|song|songs} not written to the folder yet";
    };
    readonly "\u8FD8\u6709 {n} \u9996\u6CA1\u4E0A\u4E91": {
        readonly en: "{n} {n|song|songs} not in the cloud yet";
    };
    readonly "\u9000\u51FA\u540E\u8FD9\u4E9B\u6539\u52A8\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3002\u53EF\u4EE5\u5148\u63A8\u4E0A\u53BB\uFF08\u63A8\u4E0D\u4E0A\u53BB\u7684\u9010\u9996\u4E0B\u8F7D\u5907\u4EFD\uFF09\uFF0C\u6216\u8005\u7167\u6837\u9000\u51FA\u3002": {
        readonly en: "After signing out these changes exist only on this device. You can upload them first (what can't be uploaded is downloaded song by song as backup), or sign out anyway.";
    };
    readonly "\u5148\u63A8\u4E0A\u53BB / \u4E0B\u8F7D\u5907\u4EFD": {
        readonly en: "Upload first / download backup";
    };
    readonly 照样退出: {
        readonly en: "Sign out anyway";
    };
    readonly "\u4E0D\u7528\u300C{label}\u300D\u4E86\uFF1A\u5939\u91CC\u7684\u6B4C\u4E00\u9996\u6CA1\u52A8\uFF0C\u518D\u8FDB\u6B4C\u5E93\u53EF\u4EE5\u9009\u5BB6": {
        readonly en: "Stopped using “{label}”: no songs in the folder were touched; choose a home next time you open the library";
    };
    readonly "\u9000\u51FA\u4E86\uFF1A\u6B4C\u90FD\u8FD8\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u518D\u8FDE\u4E0A\u7F51\u76D8\u5C31\u80FD\u63A5\u7740\u7528": {
        readonly en: "Signed out: all songs are still on this device; reconnect OneDrive to carry on";
    };
    readonly "\u63A8\u4E0D\u4E0A\u53BB\u7684 {n} \u9996\u5DF2\u4E0B\u8F7D\u5907\u4EFD": {
        readonly en: "{n} {n|song that couldn't upload was|songs that couldn't upload were} downloaded as backup";
    };
    readonly 都推上去了: {
        readonly en: "Everything uploaded";
    };
    readonly 去微软登录: {
        readonly en: "Sign in with Microsoft";
    };
    readonly "\u9875\u9762\u4F1A\u8DF3\u5230\u5FAE\u8F6F\u7684\u767B\u5F55\u9875\uFF08\u53EA\u8BA4\u4E2A\u4EBA\u8D26\u53F7\uFF09\uFF0C\u767B\u5F55\u5B8C\u81EA\u52A8\u56DE\u5230\u8FD9\u91CC\u3002{inGallery}": {
        readonly en: "The page will go to Microsoft's sign-in (personal accounts only) and come back here afterward. {inGallery}";
    };
    readonly "\u624B\u91CC\u7684\u6B4C\u5DF2\u7ECF\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\u3002": {
        readonly en: "The song in hand is already saved on this device.";
    };
    readonly "\u624B\u91CC\u8FD9\u9996\u65E0\u5730\u7684\u6B4C\u6539\u8FC7\u8FD8\u6CA1\u5B58\u2014\u2014\u8DF3\u8D70\u4F1A\u4E22\uFF0C\u5148\u5B58\u4E00\u4E0B\u518D\u6765\u3002": {
        readonly en: "The homeless song in hand has unsaved changes — leaving would lose them, so save first.";
    };
    readonly 去登录: {
        readonly en: "Sign in";
    };
    readonly 云端有新版本: {
        readonly en: "Newer version in the cloud";
    };
    readonly "\u300C{id}\u300D\u5728\u522B\u7684\u8BBE\u5907\u4E0A\u6539\u8FC7\u4E86\uFF0C\u6B63\u5728\u6362\u6210\u6700\u65B0\u7684\u2026\u2026\u5148\u522B\u6253\u5B57\u3002": {
        readonly en: "“{id}” was changed on another device, switching to the latest… hold off on typing.";
    };
    readonly 换成云端的新版本了: {
        readonly en: "Switched to the newer cloud version";
    };
    readonly "\u300C{id}\u300D\u4E91\u7AEF\u7684\u65B0\u7248\u672C\u62C9\u4E0B\u6765\u4E86\uFF0C\u4F46\u91CD\u5F00\u5931\u8D25\u2014\u2014\u8BF7\u4ECE\u6B4C\u5E93\u518D\u6253\u5F00\u4E00\u6B21": {
        readonly en: "The newer cloud version of “{id}” was pulled, but reopening failed — please open it again from the library";
    };
    readonly "{n} \u9996\u6539\u8FC7\u7684\u8FD8\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A{named}": {
        readonly en: "{n} edited {n|song is|songs are} still only on this device{named}";
    };
    readonly "\uFF1B\u4F20\u7684\u8BDD\u8FDE\u6B63\u5728\u5199\u7684\u8FD9\u9996\u4E00\u8D77": {
        readonly en: "; uploading also includes the song you're writing";
    };
    readonly "\u5199\u8FDB\u300C{label}\u300D": {
        readonly en: "Write into “{label}”";
    };
    readonly 传上去: {
        readonly en: "Upload";
    };
    readonly 以后再说: {
        readonly en: "Not now";
    };
    readonly "{r} \u9996\u90FD\u4F20\u4E0A\u53BB\u4E86": {
        readonly en: "{r} {r|song|songs} uploaded";
    };
    readonly "\u4F20\u4E0A\u53BB {r} \u9996\uFF0C\u8FD8\u6709 {left} \u9996\u6CA1\u4F20\u6210{named}\uFF1A\u522B\u7684\u8BBE\u5907\u6539\u8FC7\u7684\u8981\u4F60\u9009\uFF0C\u7F51\u7EDC\u95EE\u9898\u7684\u4E4B\u540E\u518D\u8BD5\u3002": {
        readonly en: "Uploaded {r} {r|song|songs}, {left} not done{named}: changes from other devices need your choice, network problems will retry later.";
    };
    readonly 去处理: {
        readonly en: "Handle them";
    };
    readonly "\u6709 {neverUploaded} \u9996\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\uFF0C\u8FD8\u6709 {others} \u9996\u6539\u8FC7\u6CA1\u4F20\u3002\u73B0\u5728\u5168\u4F20\uFF1F": {
        readonly en: "{neverUploaded} {neverUploaded|song exists|songs exist} only on this device, and {others} more {others|has|have} changes not uploaded. Upload everything now?";
    };
    readonly "\u6709 {neverUploaded} \u9996\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\uFF0C\u73B0\u5728{f}\uFF1F": {
        readonly en: "{neverUploaded} {neverUploaded|song exists|songs exist} only on this device. {f} now?";
    };
    readonly "\u522B\u7684\u8BBE\u5907\u6539\u8FC7\u7684\u4E0D\u4F1A\u88AB\u76D6\u6389\uFF0C\u4F1A\u7559\u7ED9\u4F60\u9009\u3002\u7A0D\u540E = \u5B83\u4EEC\u8FDB\u6B4C\u5E93\u300C\u8981\u5904\u7406\u300D\u7684\u5217\u8868\uFF0C\u4EC0\u4E48\u90FD\u4E0D\u4F20\u3002": {
        readonly en: "Changes made on other devices won't be overwritten; you'll get to choose. Later = they go on the library's “Needs attention” list and nothing is uploaded.";
    };
    readonly 现在传: {
        readonly en: "Upload now";
    };
    readonly "{n} \u9996\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u5E93\u300C\u8981\u5904\u7406\u300D\u91CC\u770B\u5F97\u89C1": {
        readonly en: "{n} {n|song stays|songs stay} on this device, in the library's “Needs attention” list";
    };
    readonly 换封面图: {
        readonly en: "Change cover image";
    };
    readonly "\u5C01\u9762\u56FE\u6362\u597D\u4E86\uFF08{n}\uFF09": {
        readonly en: "Cover image changed ({n})";
    };
    readonly "\u8FD9\u5F20\u56FE\u7528\u4E0D\u4E86\uFF1A{Error}": {
        readonly en: "This image can't be used: {Error}";
    };
    readonly 存在这台设备上了: {
        readonly en: "Saved on this device";
    };
    readonly "\u8981\u540C\u6B65\u5230 OneDrive \u5417\uFF1F\u767B\u5F55\u5FAE\u8F6F\u4E2A\u4EBA\u8D26\u53F7\u540E\uFF0C\u6B4C\u5E93\u540C\u6B65\u5230\u4F60 OneDrive \u7684\u300C\u5E94\u7528\u300D\u6587\u4EF6\u5939\uFF08\u8FD9\u4E2A app \u53EA\u80FD\u770B\u81EA\u5DF1\u7684\u90A3\u4E2A\u5939\uFF09\u3002": {
        readonly en: "Sync to OneDrive? After signing in with a personal Microsoft account, the library syncs to your OneDrive's Apps folder (this app can only see its own folder).";
    };
    readonly 暂不: {
        readonly en: "Not now";
    };
    readonly "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u8FD8\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939": {
        readonly en: "Saved on this device, not written to the folder yet";
    };
    readonly "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u4E91\u7AEF\u7A0D\u540E\u518D\u63A8": {
        readonly en: "Saved on this device, uploading to the cloud later";
    };
    readonly "\u5DF2\u5B58 \u2713": {
        readonly en: "Saved ✓";
    };
    readonly "\u8FD9\u9996\u6B4C\u6CA1\u52A0\u5BC6\u3002MoonSinger \u8FD9\u4E00\u7248\u8FD8\u4E0D\u52A0\u5BC6\uFF08\u8981\u7684\u8BDD\u544A\u8BC9\u5F00\u53D1\u8005\uFF1A\u7167 WXHW \u63A5 zip.js + 7z \u5C31\u80FD\u5F00\uFF09\u3002": {
        readonly en: "This song isn't encrypted. This version of MoonSinger doesn't encrypt yet.";
    };
    readonly "\u300C{p}\u300D\u91CC\u952E\u76D8\u4E0D\u5199\u97F3\uFF08\u5207\u5230\u300C\u97F3\u300D\u518D\u5199\uFF09": {
        readonly en: "In “{p}” the keys don't write notes (switch to “Notes” to write)";
    };
    readonly "\u8FD9\u6761\u58F0\u90E8\u53F0\u4E0A\u662F\u5355\u58F0\u7684\uFF08\u5C0F\u6708\u76F8 / \u5143\u97F3\u7248 / \u6CA1\u4EBA\uFF09\uFF1A\u53E0\u4E0D\u4E86\u3002\u6362\u6210\u80FD\u53E0\u97F3\u7684\u4E50\u5668\u518D\u53E0": {
        readonly en: "This part's performer is monophonic (Tsukuyomi-chan / vowel version / nobody): it can't stack. Switch to an instrument that can";
    };
    readonly "MIDI \u952E\u76D8\u63A5\u4E0A\u4E86\uFF1A{name}": {
        readonly en: "MIDI keyboard connected: {name}";
    };
    readonly "MIDI \u952E\u76D8\u62D4\u6389\u4E86\uFF1A{name}": {
        readonly en: "MIDI keyboard unplugged: {name}";
    };
    readonly "MIDI \u952E\u76D8\uFF1A\u8FD8\u6CA1\u8FDE\uFF08\u70B9\u4E00\u4E0B\u770B\u600E\u4E48\u8FDE\uFF09": {
        readonly en: "MIDI keyboard: not connected (tap to see how)";
    };
    readonly "MIDI \u952E\u76D8\uFF1A\u7B49\u6D4F\u89C8\u5668\u7684\u8BB8\u53EF\u2026": {
        readonly en: "MIDI keyboard: waiting for browser permission…";
    };
    readonly "MIDI \u952E\u76D8\uFF1A\u6D4F\u89C8\u5668\u6CA1\u7ED9\uFF08\u70B9\u4E00\u4E0B\u770B\u600E\u4E48\u529E\uFF09": {
        readonly en: "MIDI keyboard: browser denied it (tap to see what to do)";
    };
    readonly "MIDI \u952E\u76D8\uFF1A\u5F00\u7740\uFF0C\u8FD8\u6CA1\u63D2\u7434\uFF08\u63D2\u4E0A\u5C31\u8BA4\uFF09": {
        readonly en: "MIDI keyboard: on, nothing plugged in (recognized when plugged in)";
    };
    readonly "MIDI \u952E\u76D8\uFF1A\u63A5\u7740 {p}\uFF08\u5F39\u4E00\u4E0B\u8FD9\u4E2A\u70B9\u4F1A\u95EA\uFF09": {
        readonly en: "MIDI keyboard: connected to {p} (this dot flashes when you play)";
    };
    readonly "\u95EE\u6D4F\u89C8\u5668\u8981 MIDI \u7684\u8BB8\u53EF\uFF08\u6D4F\u89C8\u5668\u4F1A\u5F39\u5B83\u81EA\u5DF1\u7684\u6846\uFF09\uFF1B\u7ED9\u8FC7\u4E00\u6B21\u4EE5\u540E\u5F00 app \u81EA\u5DF1\u63A5\u4E0A": {
        readonly en: "Asks the browser for MIDI permission (it shows its own prompt); after that, the app connects by itself";
    };
    readonly "\u6211\u6CA1\u6709 MIDI \u952E\u76D8": {
        readonly en: "I don't have a MIDI keyboard";
    };
    readonly "\u9876\u680F\u4E0D\u518D\u9732\u300CMIDI\u300D\uFF1B\u4EE5\u540E\u8981\u8FDE\uFF1A\u83DC\u5355 \u2192 \u8BBE\u7F6E \u2192 MIDI \u952E\u76D8": {
        readonly en: "“MIDI” no longer shows in the top bar; to connect later: Menu → Settings → MIDI keyboard";
    };
    readonly "\u9876\u680F\u4E0D\u9732\u300CMIDI\u300D\u4E86\uFF1B\u4EE5\u540E\u8981\u8FDE\uFF1A\u83DC\u5355 \u2192 \u8BBE\u7F6E \u2192 MIDI \u952E\u76D8": {
        readonly en: "“MIDI” is hidden from the top bar; to connect later: Menu → Settings → MIDI keyboard";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u8BFB\u4E0D\u4E86 MIDI \u952E\u76D8\uFF08iPad / iPhone \u4E0A\u7684\u6D4F\u89C8\u5668\u90FD\u6CA1\u6709 Web MIDI\uFF09\uFF1B\u7535\u8111\u4E0A\u7684 Chrome / Edge / Firefox \u53EF\u4EE5": {
        readonly en: "This browser can't read MIDI keyboards (no browser on iPad / iPhone has Web MIDI); Chrome / Edge / Firefox on a computer can";
    };
    readonly "\u7B49\u6D4F\u89C8\u5668\u7684\u8BB8\u53EF\u2026": {
        readonly en: "Waiting for browser permission…";
    };
    readonly "\u6D4F\u89C8\u5668\u6CA1\u7ED9\uFF08{why}\uFF09\u3002\u5728\u5730\u5740\u680F\u5DE6\u8FB9\u7684\u7AD9\u70B9\u8BBE\u7F6E\u91CC\u5141\u8BB8 MIDI\uFF0C\u518D\u70B9\u8FDE\u63A5": {
        readonly en: "The browser denied it ({why}). Allow MIDI in the site settings left of the address bar, then tap Connect";
    };
    readonly "\u7434\u7528 USB \u63D2\u4E0A\u7535\u8111\uFF0C\u70B9\u300C\u8FDE\u63A5\u300D\uFF08\u6D4F\u89C8\u5668\u4F1A\u95EE\u4E00\u6B21\uFF0C\u4EE5\u540E\u5F00 app \u81EA\u5DF1\u63A5\u4E0A\uFF09": {
        readonly en: "Plug the keyboard into the computer via USB and tap “Connect” (the browser asks once, then the app connects by itself)";
    };
    readonly "\u63A5\u7740\uFF1A{p}\u3002\u5F39\u7684\u97F3\u6309\u5149\u6807\u5904\u7684\u957F\u77ED\u5199\u8FDB\u8C31\uFF1B\u300C\u5F39\u300D\u5F00\u7740 / \u8BCD / \u542C\u91CC\u53EA\u51FA\u58F0": {
        readonly en: "Connected: {p}. Notes you play are written with the length at the cursor; with “Jam” on, or in Lyrics / Listen, they only sound";
    };
    readonly "\u5F00\u7740\uFF0C\u8FD8\u6CA1\u63D2\u7434\uFF08\u63D2\u4E0A\u5C31\u8BA4\uFF09": {
        readonly en: "On, nothing plugged in (recognized when plugged in)";
    };
    readonly "\u5FF5\u7F13\u5B58\u548C\u5C01\u9762\u7F13\u5B58\u6362\u4E86\u65B0\u540D\u5B57\uFF0C\u4F1A\u91CD\u65B0\u751F\u6210\u4E00\u6B21\uFF08\u6B4C\u4E0D\u53D7\u5F71\u54CD\uFF09": {
        readonly en: "The speech and cover caches got new names and will regenerate once (songs aren't affected)";
    };
    readonly "\u8BD5\u542C\u5143\u97F3\u8868\u6CA1\u4E0B\u8F7D\u4E0B\u6765\uFF1A{Error}": {
        readonly en: "Couldn't download the audition vowel table: {Error}";
    };
    readonly "\u6B4C\u5E93\u91CC\u8FD9\u53F0\u8BBE\u5907\u8BB0\u7740\u7684\u58F0\u97F3\u662F\u4E4B\u524D\u7684\u5F15\u64CE\u6E32\u7684\uFF1A\u5C01\u9762\u4E0A\u6807\u300C\u65E7\u300D\u3001\u7167\u6837\u80FD\u542C\uFF0C\u64AD\u653E\u6761\u4E0A\u300C\u91CD\u65B0\u6E32\u67D3\u300D\u7528\u73B0\u5728\u7684\u5F15\u64CE\u91CD\u6E32\uFF1B\u8BBE\u7F6E\u300C\u6E32\u67D3\u7F13\u5B58\u300D\u91CC\u53EF\u4EE5\u4E00\u952E\u5220\u6389\u65E7\u7684\u3002": {
        readonly en: "Songs this device has kept for the library were rendered by the previous engine: their covers are marked “old” and they still play; “Render again” on the player bar re-renders with the current engine, and Settings → Render cache can delete all the old ones at once.";
    };
    readonly "SoundFont \u4E50\u5668\u53C8\u548C\u6807\u51C6\u64AD\u653E\u5668\uFF08FluidSynth\uFF09\u5BF9\u4E86\u4E00\u6B21\u9F50\uFF1A\u6BCF\u4EF6\u4E50\u5668\u6309\u5E93\u91CC\u7ED9\u5B83\u5199\u7684\u529B\u5EA6\u66F2\u7EBF\u8D70\u2014\u2014\u591A\u6570\u4E50\u5668 ppp \u5230 fff \u7684\u5DEE\u522B\u4ECE 36 dB \u6536\u5230 30 dB\uFF0C\u98CE\u7434\u8FD9\u7C7B\u5E93\u91CC\u5B9A\u6210\u4E0D\u968F\u529B\u5EA6\u7684\u5C31\u6309\u591A\u91CD\u90FD\u4E00\u6837\u54CD\uFF1B\u5E93\u91CC\u5199\u7684\u521D\u59CB\u8870\u51CF\u4E5F\u7167\u6807\u51C6\u7B97\u3002\u5728 mf \u4E0A\u591A\u6570\u4E50\u5668\u53C8\u8F7B\u4E86 0\u20139 dB\uFF08\u4E2D\u4F4D\u6570\u7EA6 3 dB\uFF09\uFF0C\u4E50\u5668\u4E4B\u95F4\u7684\u8F7B\u91CD\u4F1A\u632A\u3002\u5C0F\u6708\u76F8\u548C\u5143\u97F3\u7248\u7684\u5F3A\u5F31\u4E5F\u6536\u5230\u540C\u6837\u7684\u5E45\u5EA6\uFF08\u5979\u7684 mf \u6BD4\u4E0A\u4E00\u7248\u54CD 1.3 dB\uFF09\u3002\u65E7\u6B4C\u7684\u5E73\u8861\u8981\u91CD\u65B0\u8C03\u3002": {
        readonly en: "SoundFont instruments are aligned with the standard player (FluidSynth) once more: each instrument now follows the velocity curve its library gives it — for most instruments ppp to fff narrows from 36 dB to 30 dB, and ones the library makes velocity-insensitive (organs and the like) sound equally loud however hard you play; the library's initial attenuation is also applied the standard way. At mf most instruments get another 0–9 dB quieter (about 3 dB in the middle), and the balance between instruments shifts. Tsukuyomi-chan and the vowel version narrow to the same range (her mf is 1.3 dB louder than the last version). Old songs need their balance redone.";
    };
    readonly "\u4E50\u5668\u548C\u5C0F\u6708\u76F8\u7684\u5F3A\u5F31\u6539\u6210\u4E86 SoundFont \u7684\u653E\u6CD5\uFF0C\u548C\u6807\u51C6\u64AD\u653E\u5668\uFF08FluidSynth\uFF09\u4E00\u6837\uFF1A\u6BCF\u4EF6\u4E50\u5668\u6309\u5E93\u91CC\u7ED9\u5B83\u5199\u7684\u529B\u5EA6\u66F2\u7EBF\u8D70\uFF08\u591A\u6570\u4E50\u5668 ppp \u5230 fff \u5DEE 30 dB\uFF1B\u98CE\u7434\u8FD9\u7C7B\u5E93\u91CC\u5B9A\u6210\u4E0D\u968F\u529B\u5EA6\u7684\uFF0C\u6309\u591A\u91CD\u90FD\u4E00\u6837\u54CD\uFF09\uFF0C\u5E93\u91CC\u5199\u7684\u521D\u59CB\u8870\u51CF\u4E5F\u7167\u6807\u51C6\u7B97\u3002\u6574\u9996\u4F1A\u53D8\u8F7B\u3001\u4E50\u5668\u4E4B\u95F4\u7684\u8F7B\u91CD\u4F1A\u632A\uFF1B\u5C0F\u6708\u76F8\u548C\u5143\u97F3\u7248\u7684\u5F3A\u5F31\u4E5F\u6309\u540C\u4E00\u6761\u66F2\u7EBF\u3002\u65E7\u6B4C\u7684\u5E73\u8861\u8981\u91CD\u65B0\u8C03\u3002": {
        readonly en: "Instrument and Tsukuyomi-chan dynamics now work the SoundFont way, the same as the standard player (FluidSynth): each instrument follows the velocity curve its library gives it (for most, ppp to fff spans 30 dB; ones the library makes velocity-insensitive, like organs, sound equally loud however hard you play), and the library's initial attenuation is applied the standard way. Whole songs get quieter and the balance between instruments shifts; Tsukuyomi-chan and the vowel version follow the same curve. Old songs need their balance redone.";
    };
    readonly 这台设备上读不到它的字节: {
        readonly en: "Its bytes can't be read on this device";
    };
    readonly 写完在新家里找不到: {
        readonly en: "Not found in the new home after writing";
    };
    readonly 写进去的字节和原来的对不上: {
        readonly en: "Written bytes don't match the original";
    };
    readonly " \u7B49 {n} \u9996": {
        readonly en: " and {n} more {n|song|songs}";
    };
    readonly "\u642C\u597D\u4E86 {n} \u9996\u5230\u300C{home}\u300D": {
        readonly en: "Moved {n} {n|song|songs} into “{home}”";
    };
    readonly "{n} \u9996\u8FDE\u7740\u7F51\u76D8\u7684\u62F7\u4E86\u4E00\u4EFD\u8FC7\u53BB\uFF0C\u6D4F\u89C8\u5668\u91CC\u90A3\u4EFD\u7559\u7740\uFF08\u767B\u5F55\u540E\u7167\u5E38\u540C\u6B65\uFF09": {
        readonly en: "{n} OneDrive-linked {n|song was|songs were} copied over; the browser's {n|copy stays|copies stay} (sync as usual after signing in)";
    };
    readonly "{n} \u9996\u5DF2\u7ECF\u5728\u300C{home}\u300D\u91CC\u4E86\uFF0C\u4F46\u6D4F\u89C8\u5668\u91CC\u7684\u65E7\u7684\u6CA1\u79FB\u8D70\uFF1A{stuck}": {
        readonly en: "{n} {n|song is|songs are} already in “{home}”, but the old browser copies weren't removed: {stuck}";
    };
    readonly "{n} \u9996\u6CA1\u642C\u6210\uFF0C\u8FD8\u5728\u6D4F\u89C8\u5668\u91CC\uFF0C\u4E00\u4E2A\u5B57\u8282\u6CA1\u52A8\uFF1A{failed}": {
        readonly en: "{n} {n|song wasn't|songs weren't} moved and {n|remains|remain} in the browser, not a byte changed: {failed}";
    };
    readonly 没有要搬的歌: {
        readonly en: "No songs to move";
    };
    readonly "\u9009\u533A\u5199\u6EE1\u4E86\uFF1A\u5199\u4E0D\u51FA\u9009\u533A\u3002\u8981\u5F80\u540E\u5199\uFF0C\u5148\u70B9\u522B\u5904\u9000\u51FA\u9009\u533A": {
        readonly en: "The selection is full: can't write past it. To keep writing, tap elsewhere to leave the selection";
    };
    readonly "\u7436\u97F3\u53EA\u6302\u5728\u548C\u5F26\u4E0A\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6216\u9009\u4E2D\u7684\uFF09\u662F\u5355\u97F3": {
        readonly en: "Arpeggios only go on chords: the note before the cursor (or the selection) is a single note";
    };
    readonly "{p}\u8981\u6302\u5728\u4E00\u4E2A\u97F3\u4E0A\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": {
        readonly en: "{p} must go on a note (before the cursor is a rest, or no note yet)";
    };
    readonly "\u8FDE\u7EBF\u4ECE\u4E00\u4E2A\u97F3\u8FDE\u5230\u4E0B\u4E00\u4E2A\u97F3\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": {
        readonly en: "A slur goes from one note to the next (before the cursor is a rest, or no note yet)";
    };
    readonly "\u51FA\u58F0\u7684\u6362\u6C14\u6302\u5728\u4E00\u4E2A\u97F3\u540E\u9762\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": {
        readonly en: "An audible breath goes after a note (before the cursor is a rest, or no note yet)";
    };
    readonly "\u97F3\u5185\u7684\u8D77\u4F0F\u8981\u6302\u5728\u4E00\u4E2A\u97F3\u4E0A\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": {
        readonly en: "A swell must go on a note (before the cursor is a rest, or no note yet)";
    };
    readonly "{p}\u4ECE\u4E00\u4E2A\u97F3\u5230\u4E0B\u4E00\u4E2A\u97F3\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": {
        readonly en: "{p} goes from one note to the next (before the cursor is a rest, or no note yet)";
    };
    readonly 跟谱: {
        readonly en: "Follow score";
    };
    readonly 跟着谱上这里的调号: {
        readonly en: "Uses the key signature here";
    };
    readonly 手动: {
        readonly en: "Manual";
    };
    readonly "\u624B\u52A8\uFF1A\u952E\u76D8\u6309 {pad} \u6392\uFF0C\u548C\u8C31\u4E0A\u8FD9\u91CC\u7684\u8C03\u53F7\uFF081={k}\uFF09\u4E0D\u4E00\u6837\u3002\u70B9\u5F00\u300C1=\u300D\uFF0C\u8C03\u5F0F\u90A3\u4E00\u5217\u6700\u4E0A\u9762\u7684\u300C\u8DDF\u8C31\u300D= \u56DE\u5230\u8DDF\u7740\u8C31\u8D70": {
        readonly en: "Manual: the keyboard is laid out in {pad}, which differs from the key signature here (1={k}). Open “1=” and pick “Follow score” at the top of the mode column to follow the score again";
    };
    readonly "{name}\uFF08\u8DDF\u7740\u8C31\u4E0A\u8FD9\u91CC\u7684\u8C03\u53F7\uFF09": {
        readonly en: "{name} (follows the key signature here)";
    };
    readonly "{name}\uFF08\u624B\u52A8\uFF09": {
        readonly en: "{name} (manual)";
    };
    readonly "\u3093 / \u55EF": {
        readonly en: "ん (hum)";
    };
    readonly "\u3042 / \u554A": {
        readonly en: "あ (ah)";
    };
    readonly "\u304A / \u54E6": {
        readonly en: "お (oh)";
    };
    readonly "\u3046 / \u545C": {
        readonly en: "う (oo)";
    };
    readonly "\u3089 / \u5566": {
        readonly en: "ら (la)";
    };
    readonly "{p}\u524D\u300C{mark}\u300D{p2}": {
        readonly en: "“{mark}” before {p}{p2}";
    };
    readonly 下一个字: {
        readonly en: "the next syllable";
    };
    readonly 这个字: {
        readonly en: "this syllable";
    };
    readonly "\uFF08\u987F\u4E00\u4E0B\uFF0C\u4E0D\u6362\u6C14\uFF09": {
        readonly en: " (a brief stop, no breath)";
    };
    readonly "\uFF08\u6362\u6C14\uFF09": {
        readonly en: " (a breath)";
    };
    readonly "\uFF08\u5927\u53E3\u6362\u6C14\uFF09": {
        readonly en: " (a big breath)";
    };
    readonly 不变成唱法记号: {
        readonly en: "Doesn't become a singing mark";
    };
    readonly "\u6309\u4E0B\u90A3\u4E00\u4E0B\u7684\u8F7B\u91CD\uFF08MIDI \u529B\u5EA6\uFF09\uFF1A\u6E10\u5F3A\u6E10\u5F31 = \u6BCF\u4E2A\u65B0\u97F3\u4E00\u4E2A\u53F0\u9636\uFF0C\u6309\u4F4F\u7684\u97F3\u4E2D\u95F4\u4E0D\u53D8\uFF1B\u4E00\u4E2A\u97F3\u91CC\u9762\u8981\u53D8\uFF0C\u7528\u97F3\u5185\u8D77\u4F0F{canSwell}": {
        readonly en: "How hard the key is struck (MIDI velocity): crescendo / diminuendo = one step per new note, held notes don't change; to change within a note, use a swell{canSwell}";
    };
    readonly "\uFF08\u8FD9\u4EF6\u4E50\u5668\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF\uFF1A\u97F3\u5185\u53EA\u80FD\u53D8\u5F31\uFF09": {
        readonly en: " (this instrument decays on its own: within a note it can only get softer)";
    };
    readonly "\u4E00\u6761\u8FDE\u7EED\u7684\u97F3\u91CF\u66F2\u7EBF\uFF08\u4E58\u5728{sung}\u51FA\u6765\u7684\u58F0\u97F3\u4E0A\uFF09\uFF1A\u6E10\u5F3A\u6E10\u5F31\u5728\u4E00\u4E2A\u957F\u97F3\u4E2D\u95F4\u4E5F\u4E00\u76F4\u5728\u53D8\uFF0C\u548C\u97F3\u5185\u8D77\u4F0F\u662F\u540C\u4E00\u79CD\u53D8\u6CD5\uFF1B\u53EA\u53D8\u54CD\u5EA6\u3001\u4E0D\u53D8\u97F3\u8272{sung2}": {
        readonly en: "A continuous volume curve (multiplied onto the {sung} sound): crescendo / diminuendo keep changing through a long note, the same way a swell does; only loudness changes, not timbre{sung2}";
    };
    readonly "\u5531##\u51FA\u58F0": {
        readonly en: "sung";
    };
    readonly "\u5F39##\u51FA\u58F0": {
        readonly en: "played";
    };
    readonly "\uFF08\u771F\u4EBA\u6E10\u5F31\u4F1A\u53D8\u865A\u3001\u53D8\u6697\uFF0C\u8FD9\u4E2A\u8FD8\u6CA1\u6709\uFF09": {
        readonly en: " (a real singer's diminuendo gets airier and darker; not modeled yet)";
    };
    readonly 力度怎么变: {
        readonly en: "How dynamics change";
    };
    readonly "\u529B\u5EA6\u8868\uFF1A{string}": {
        readonly en: "Dynamics table: {string}";
    };
    readonly 渐强渐弱没写终点: {
        readonly en: "Crescendo / diminuendo with no endpoint";
    };
    readonly "\u8D70\u4E00\u6863 = \u529B\u5EA6 {wedgeStepVel}": {
        readonly en: "One step = velocity {wedgeStepVel}";
    };
    readonly 幽灵音: {
        readonly en: "Ghost note";
    };
    readonly "\u529B\u5EA6 {ghostVel}": {
        readonly en: "Velocity {ghostVel}";
    };
    readonly "\u6574\u4E2A\u97F3 {ghostDb}": {
        readonly en: "Whole note {ghostDb}";
    };
    readonly 弱化: {
        readonly en: "Unstressed";
    };
    readonly "\u529B\u5EA6 {unstressVel}": {
        readonly en: "Velocity {unstressVel}";
    };
    readonly "\u6574\u4E2A\u97F3 {unstressDb}": {
        readonly en: "Whole note {unstressDb}";
    };
    readonly 次重音: {
        readonly en: "Stress";
    };
    readonly "\u529B\u5EA6 +{stressVel}": {
        readonly en: "Velocity +{stressVel}";
    };
    readonly "\u97F3\u5934 {accentSec} {stressDb}": {
        readonly en: "Attack {accentSec} {stressDb}";
    };
    readonly 重音: {
        readonly en: "Accent";
    };
    readonly "\u529B\u5EA6 +{accentVel}": {
        readonly en: "Velocity +{accentVel}";
    };
    readonly "\u97F3\u5934 {accentSec} {accentDb}{sung}": {
        readonly en: "Attack {accentSec} {accentDb}{sung}";
    };
    readonly 强音: {
        readonly en: "Marcato";
    };
    readonly "\u529B\u5EA6 +{marcatoVel}": {
        readonly en: "Velocity +{marcatoVel}";
    };
    readonly "\u97F3\u5934 {accentSec} {marcatoDb}{sung}": {
        readonly en: "Attack {accentSec} {marcatoDb}{sung}";
    };
    readonly "\u7A81\u5F3A sfz": {
        readonly en: "Sforzando sfz";
    };
    readonly "\u529B\u5EA6 +{sfzVel}": {
        readonly en: "Velocity +{sfzVel}";
    };
    readonly "\u97F3\u5934 {sfzDb}\uFF0C{sfzSec} \u91CC\u843D\u56DE\u6765{sung}": {
        readonly en: "Attack {sfzDb}, falls back within {sfzSec}{sung}";
    };
    readonly "\u5F3A\u540E\u5373\u5F31 fp": {
        readonly en: "Forte-piano fp";
    };
    readonly "\u97F3\u5934\u6309 f\uFF0C{fpSec} \u91CC\u843D\u5230 p\uFF0C\u4E4B\u540E\u90FD\u662F p{sung}": {
        readonly en: "Attacks at f, falls to p within {fpSec}, then stays p{sung}";
    };
    readonly "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4EF6\u4E50\u5668\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF\uFF08\u6EDA\u594F\u7684\u97F3\u4F8B\u5916\uFF1A\u6BCF\u4E00\u4E0B\u7684\u529B\u5EA6\u8DDF\u7740\u8D77\u4F0F\uFF09": {
        readonly en: "Not possible: this instrument decays once struck (except on rolled notes: each hit's velocity follows the swell)";
    };
    readonly "\u5199\u7684\u529B\u5EA6\u662F\u6700\u9AD8\u70B9\uFF1A< \u4ECE \u2212{swellDb} dB \u957F\u5230\u5199\u7684\u529B\u5EA6\uFF1B<> \u4E24\u5934 \u2212{swellDb2} dB\u3001\u4E2D\u95F4\u56DE\u5230\u5199\u7684\u529B\u5EA6\uFF08\u5F3A\u540E\u5373\u5F31\u4E4B\u540E\u7684 < \u957F\u56DE\u97F3\u5934\u7684 f\uFF09": {
        readonly en: "The written dynamic is the peak: < grows from −{swellDb} dB to it; <> starts and ends at −{swellDb2} dB, returning to it in the middle (a < after fp grows back to the attack's f)";
    };
    readonly "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4EF6\u4E50\u5668\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF": {
        readonly en: "Not possible: this instrument decays on its own";
    };
    readonly "\u4E00\u8DEF\u5F80\u4E0B\u5230 \u2212{swellDb} dB": {
        readonly en: "Falls all the way to −{swellDb} dB";
    };
    readonly 跳音: {
        readonly en: "Staccato";
    };
    readonly "\u5531 / \u5F39 {staccatoGate} \u7684\u957F\u5EA6": {
        readonly en: "Sung / played at {staccatoGate} of its length";
    };
    readonly 保持: {
        readonly en: "Tenuto";
    };
    readonly 这个音不留缝: {
        readonly en: "No gap after this note";
    };
    readonly "\u8FDE\u5230\u4E0B\u4E00\u4E2A\u97F3\u3001\u4E0D\u7559\u7F1D": {
        readonly en: "Connects to the next note with no gap";
    };
    readonly 呼吸: {
        readonly en: "Breath";
    };
    readonly "\u524D\u4E00\u4E2A\u97F3\u6536\u77ED {breathSec}\uFF08\u6700\u591A {breathShare}\uFF09": {
        readonly en: "Shortens the previous note by {breathSec} (at most {breathShare})";
    };
    readonly "\u51FA\u58F0\u7684\u6362\u6C14\uFF08\u8F7B\u5438 / \u6DF1\u5438\uFF09": {
        readonly en: "Audible breath (soft / deep)";
    };
    readonly "\u6362\u6C14\u7684\u7A7A\u5F53\u91CC\u4E00\u58F0\u5438\u6C14\uFF08\u6309\u4E0B\u4E00\u4E2A\u5B57\u7684\u5143\u97F3\u5851\u5F62\uFF0C\u6BD4\u5B83\u8F7B\u7EA6 28 dB\uFF1B\u6DF1\u5438 = \u7A7A\u5F53\u957F\u4E00\u70B9\u3001\u54CD 4 dB\uFF09": {
        readonly en: "An inhale in the breath gap (shaped by the next syllable's vowel, about 28 dB softer; deep = a longer gap and 4 dB louder)";
    };
    readonly "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4F4D\u53EA\u65AD\u5F00\uFF0C\u4E0D\u51FA\u5438\u6C14\u58F0": {
        readonly en: "Not possible: this performer only separates, with no inhale sound";
    };
    readonly "\u6C14\u58F0\uFF08\u00D7 \u7B26\u5934\uFF09": {
        readonly en: "Whisper (× notehead)";
    };
    readonly "\u8FD9\u4E2A\u5B57\u4E0D\u5531\u97F3\u9AD8\uFF1A\u7528\u5FF5\u7684\u65F6\u5019\u7684\u6C14\u58F0\uFF08\u8C31\u5305\u7EDC\u7167\u65E7\u3001\u58F0\u5E26\u4E0D\u632F\uFF09\uFF0C\u518D\u8F7B 6 dB": {
        readonly en: "This syllable has no sung pitch: uses the breathy spoken voice (same spectral envelope, no vocal-fold vibration), 6 dB softer";
    };
    readonly "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4F4D\u53EA\u6309\u97F3\u9AD8\u51FA\u58F0": {
        readonly en: "Not possible: this performer only sounds by pitch";
    };
    readonly 音和音之间: {
        readonly en: "Between notes";
    };
    readonly 连着唱: {
        readonly en: "Legato";
    };
    readonly "{gapSec}\uFF08\u6700\u591A {gapShare}\uFF09": {
        readonly en: "{gapSec} (at most {gapShare})";
    };
    readonly 滚奏: {
        readonly en: "Roll";
    };
    readonly "\u6574\u4E2A\u97F3\u6572\u6EE1\uFF0C\u6BCF\u79D2 {hz} \u4E0B\uFF1B\u6BCF\u4E00\u4E0B\u6309\u6572\u4E0B\u53BB\u90A3\u4E00\u523B\u7684\u529B\u5EA6\uFF08\u6E10\u5F3A\u6E10\u5F31 / \u6E10\u5230 / \u97F3\u5185\u8D77\u4F0F / \u5F3A\u540E\u5373\u5F31\u90FD\u5728\u6BCF\u4E00\u4E0B\u91CC\uFF09\uFF0C\u91CD\u97F3\u8FD9\u4E00\u7EC4\u53EA\u7B97\u7B2C\u4E00\u4E0B": {
        readonly en: "Fills the whole note, {hz} hits per second; each hit uses the dynamic at the moment it lands (crescendos, ramps, in-note swells and fp are all in each hit's velocity); accents and the like only on the first hit";
    };
    readonly "\u8BB0\u53F7\u600E\u4E48\u6F14\uFF08\u8FD9\u4F4D\u81EA\u5DF1\u7684\u914D\u7F6E\uFF0C\u8DDF\u7740\u6F14\u594F\u8005\u5B58\u8FDB\u6B4C\uFF09": {
        readonly en: "How marks are performed (this performer's own settings, saved in the song with them)";
    };
    readonly "\u4EBA\u58F0\uFF08\u8FDE\u7740\u5531\uFF09": {
        readonly en: "Voice (legato)";
    };
    readonly "\u81EA\u5DF1\u7684 .sf2\uFF08\u76EE\u5F55\u91CC\u6CA1\u6709\u8FD9\u4E2A\u97F3\u8272\u7684\u8FDE\u65AD\u6570\u636E\uFF09": {
        readonly en: "Own .sf2 (the catalog has no legato data for this sound)";
    };
    readonly "\u4E00\u4E0B\u5C31\u5B8C / \u97F3\u6548\uFF08\u4E0D\u7559\u7F1D\uFF09": {
        readonly en: "One-shot / sound effect (no gap)";
    };
    readonly "\u8FD9\u4EF6\u4E50\u5668\uFF1A{what}": {
        readonly en: "Instrument: {what}";
    };
    readonly "\u7B2C\u4E8C\u884C\u8D77\u5199 {ab}": {
        readonly en: "from the 2nd system: {ab}";
    };
    readonly "MIDI \u529B\u5EA6": {
        readonly en: "MIDI velocity";
    };
    readonly "\u54CD\u5EA6 dB": {
        readonly en: "Loudness dB";
    };
    readonly 第几份录音: {
        readonly en: "Recording #";
    };
    readonly "\u6EDA\u594F\u7684\u97F3\u4E0A\u6309\u529B\u5EA6\u505A\uFF08\u58F0\u97F3\u8F7D\u597D\u540E\u663E\u793A\u7EA6\u51E0\u6863\uFF09\u3002": {
        readonly en: "On rolled notes this is done with velocity (shown once the sound is loaded).";
    };
    readonly "\u6EDA\u594F\u7684\u97F3\u4E0A\u6309\u529B\u5EA6\u505A\uFF1Amf\uFF08{mf}\uFF09\u4F4E {d} dB \u2248 \u529B\u5EA6 {to}\uFF08\u7EA6 {n} \u6863\u529B\u5EA6\uFF09\u3002": {
        readonly en: "On rolled notes this is done with velocity: {d} dB below mf ({mf}) ≈ velocity {to} (about {n} dynamic steps).";
    };
    readonly "\u58F0\u97F3\u5D4C\u5728\u6B4C\u91CC\uFF08{n}\uFF09{library}": {
        readonly en: "Sound embedded in the song ({n}){library}";
    };
    readonly "\uFF0C\u6765\u81EA\u5BB6\u65CF\u97F3\u6E90\u5E93\u7684 {name}": {
        readonly en: ", from {name} in the family sound library";
    };
    readonly "\uFF0C\u6765\u81EA {name}": {
        readonly en: ", from {name}";
    };
    readonly "\u58F0\u97F3\u6CA1\u968F\u8FD9\u9996\u6B4C\u5E26\u6765\uFF0C\u6240\u4EE5\u6CA1\u4EBA\u4E0A\u573A\u2014\u2014\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": {
        readonly en: "The sound didn't come with this song, so nobody is on stage — pick another “Who performs”";
    };
    readonly "\u5F31\u5F15\u7528\uFF1A\u6B4C\u91CC\u4E0D\u5E26\u58F0\u97F3\uFF0C\u7528\u65F6\u4ECE\u300C{name}\u300D\u627E\uFF08{found}\uFF09": {
        readonly en: "Weak reference: the song carries no sound; found from “{name}” when used ({found})";
    };
    readonly 本次已找到: {
        readonly en: "found this session";
    };
    readonly "\u5BB6\u65CF\u97F3\u6E90\u5E93 / \u8BBE\u5907\u7F13\u5B58 / \u4F60\u7684\u6587\u4EF6": {
        readonly en: "family sound library / device cache / your files";
    };
    readonly "\u627E\u6587\u4EF6\u2026": {
        readonly en: "Find file…";
    };
    readonly 响度: {
        readonly en: "Loudness";
    };
    readonly "\u8FD9\u4F4D\u6F14\u594F\u8005\u5C0F\u58F0 1 dB": {
        readonly en: "This performer 1 dB softer";
    };
    readonly "\u5927\u58F0 1 dB": {
        readonly en: "1 dB louder";
    };
    readonly "\u56DE\u5230\u9ED8\u8BA4 {d}": {
        readonly en: "Back to default {d}";
    };
    readonly 默认: {
        readonly en: "Default";
    };
    readonly "\u8FD9\u4F4D\u6F14\u594F\u8005\u81EA\u5DF1\u7684\u97F3\u91CF\uFF1A\u8FD9\u4E2A\u5E93\u7684\u9ED8\u8BA4\u662F {d}\u3002\u5E93\u548C\u5E93\u4E4B\u95F4\u5C31\u5728\u8FD9\u4E00\u4E2A\u6570\u4E0A\u5BF9\u9F50\uFF0C\u51E0\u4E2A\u58F0\u90E8\u53E0\u5728\u4E00\u8D77\u4E5F\u4E0D\u9876\u5230\u5929\u82B1\u677F\u3001\u4E0D\u628A\u58F0\u97F3\u538B\u53D8\u6837\uFF1B\u6DF7\u97F3\u53F0\u7684\u63A8\u5B50\u662F\u8FD9\u9996\u6B4C\u7684\u51B3\u5B9A\uFF0C\u53E6\u7B97": {
        readonly en: "This performer's own volume: this library's default is {d}. Libraries are matched to each other on this one number, and stacked parts don't hit the ceiling and get squashed; the mixer fader is a decision for this song and is separate";
    };
    readonly "\u7F1D\u5C0F 10 ms\uFF08\u66F4\u8FDE\uFF09": {
        readonly en: "Gap 10 ms smaller (more legato)";
    };
    readonly "\u7F1D\u5927 10 ms\uFF08\u66F4\u65AD\uFF09": {
        readonly en: "Gap 10 ms larger (more detached)";
    };
    readonly "\u56DE\u5230\u9ED8\u8BA4 {p} ms": {
        readonly en: "Back to default {p} ms";
    };
    readonly "\u4E0D\u5199\u8BB0\u53F7\u7684\u97F3\u548C\u4E0B\u4E00\u4E2A\u97F3\u4E4B\u95F4\u7559\u7684\u7F1D\uFF1A0 = \u8FDE\u7740\u3002{d}\u8FDE\u7EBF\uFF08\u8FDE\u594F\uFF09\u3001\u4FDD\u6301\u7684\u97F3\u4E0D\u7559\u7F1D\uFF1B\u547C\u5438 = \u8FD9\u91CC\u65AD\u5F00\uFF1B\u8DF3\u97F3\u53E6\u7B97": {
        readonly en: "Gap left between unmarked notes and the next note: 0 = connected. {d}Slurred (legato) and tenuto notes leave no gap; a breath separates here; staccato is separate";
    };
    readonly "{label}\uFF1A\u9ED8\u8BA4 {p} ms\uFF08\u97F3\u4E50\u76EE\u5F55\u7ED9\u7684\uFF0C\u6309\u97F3\u8272\u9010\u4E2A\uFF09\u3002": {
        readonly en: "{label}: default {p} ms (from the music catalog, per sound).";
    };
    readonly "\u6BCF\u79D2 {n} \u4E0B": {
        readonly en: "{n} per second";
    };
    readonly "\u6EDA\u594F\u7A00\u4E00\u70B9\uFF08\u6BCF\u79D2\u5C11 2 \u4E0B\uFF09": {
        readonly en: "Slower roll (2 fewer hits per second)";
    };
    readonly "\u6EDA\u594F\u5BC6\u4E00\u70B9\uFF08\u6BCF\u79D2\u591A 2 \u4E0B\uFF09": {
        readonly en: "Faster roll (2 more hits per second)";
    };
    readonly 回到这件乐器的默认: {
        readonly en: "Back to this instrument's default";
    };
    readonly "\u8C31\u4E0A\u7B26\u5E72\u5E26\u4E09\u9053\u659C\u7EBF\u7684\u97F3 = \u6EDA\u594F\uFF1A\u6574\u4E2A\u97F3\u6309\u8FD9\u4E2A\u5BC6\u5EA6\u6572\u6EE1\uFF1B\u6BCF\u4E00\u4E0B\u6309\u6572\u4E0B\u53BB\u90A3\u4E00\u523B\u7684\u529B\u5EA6\u2014\u2014\u6E10\u5F3A\u6E10\u5F31 / \u6E10\u5230\u3001\u97F3\u5185\u8D77\u4F0F\uFF08\u9F13\u4E5F\u884C\uFF09\u3001\u5F3A\u540E\u5373\u5F31\u90FD\u5728\u6BCF\u4E00\u4E0B\u7684\u529B\u5EA6\u91CC\uFF0C\u91CD\u97F3\u8FD9\u4E00\u7EC4\u53EA\u7B97\u7B2C\u4E00\u4E0B\u3001\u5E7D\u7075\u97F3 / \u5F31\u5316\u6BCF\u4E00\u4E0B\u90FD\u7B97\u3002\u6BCF\u4E00\u4E0B\u90FD\u662F\u6574\u4E0B\u6572\uFF1A\u60F3\u8F7B\u4E00\u70B9\uFF0C\u5C31\u5728\u8FD9\u4E2A\u97F3\u4E0A\u518D\u52A0\u5E7D\u7075\u97F3\u3002\u9ED8\u8BA4\uFF1A\u9F13\u7C7B\u4E00\u5F8B 12\uFF0C\u6709\u97F3\u9AD8\u7684 14\uFF08\u6BCF\u79D2\uFF09\u3002": {
        readonly en: "A note with three slashes through the stem is a roll: the whole note is filled at this density; each hit uses the dynamic at the moment it lands — crescendos / ramps, in-note swells (drums too) and fp are all in each hit's velocity; accents and the like only on the first hit, ghost / unstressed on every hit. Every hit is a full stroke: for a softer roll, also mark the note as a ghost note. Defaults: drums 12, pitched 14 (per second).";
    };
    readonly 音内起伏多深: {
        readonly en: "In-note swell depth";
    };
    readonly "\u6D45\u4E00\u70B9\uFF08\u22123 dB\uFF09": {
        readonly en: "Shallower (−3 dB)";
    };
    readonly "\u6DF1\u4E00\u70B9\uFF08+3 dB\uFF09": {
        readonly en: "Deeper (+3 dB)";
    };
    readonly "\u56DE\u5230\u9ED8\u8BA4 {d} dB": {
        readonly en: "Back to default {d} dB";
    };
    readonly "\u97F3\u5185\u6E10\u5F3A / \u6E10\u5F31 / \u9F13\u8D77\u7684\u6DF1\u6D45\uFF1A\u5199\u7684\u529B\u5EA6\u662F\u6700\u9AD8\u70B9\uFF0C< \u4ECE\u4F4E {d} dB \u957F\u5230\u5199\u7684\u529B\u5EA6\u3001> \u6536\u5230\u4F4E {d} dB\u3001<> \u4E24\u5934\u4F4E {d} dB\u3002{vel}": {
        readonly en: "How deep in-note crescendo / decrescendo / swell go: the written dynamic is the peak; < grows from {d} dB below to the written dynamic, > falls to {d} dB below, <> is {d} dB below at both ends. {vel}";
    };
    readonly "\u5531\u51FA\u6765\u7684\u6BCF\u4E00\u53E5\u5148\u4E58 \u00D7{k}\uFF08{db} dB\uFF09\uFF1A\u5531\u6CD5\u6838\u5FC3\u539F\u59CB\u8F93\u51FA\u7684\u8865\u507F\uFF0C\u6211\u4EEC\u6309\u91CF\u8FC7\u7684\u539F\u59CB\u5CF0\u503C\uFF08\u7EA6 0.42\uFF09\u653E\u5927\u5230 0.89 \u5B9A\u7684\u6570\u3002": {
        readonly en: "Each sung phrase is first multiplied by ×{k} ({db} dB): compensation for the singing core's raw output, a number we set by scaling the measured raw peak (about 0.42) up to 0.89.";
    };
    readonly "\u529B\u5EA6\u8BB0\u53F7 \u2192 \u529B\u5EA6 \u2192 \u54CD\u5EA6\uFF0C\u548C\u4E50\u5668\u540C\u4E00\u6761\u89C4\u77E9\uFF08SoundFont \u7684\u653E\u6CD5\uFF1A\u54CD\u5EA6 = \u6DF1\u5EA6 \u00F7 960 \u00D7 40\u00B7log10(\u529B\u5EA6 \u00F7 127)\uFF0C\u6EE1\u529B\u5EA6 = 0 dB\uFF09\u3002\u8FD9\u4F4D\u7684\u529B\u5EA6\u6DF1\u5EA6 {dp}\uFF08\u7167\u5E93\u91CC\u4EBA\u58F0\u7C7B\u548C\u957F\u7B1B\u3001\u5C0F\u63D0\u7434\u8FD9\u7C7B\u62C9\u957F\u97F3\u7684\u4E50\u5668\uFF1B\u89C4\u8303\u9ED8\u8BA4 960\uFF09\uFF1B\u6CA1\u6709\u5F55\u97F3\u5C42\uFF0C\u53EA\u53D8\u54CD\u5EA6\uFF1A{extras}": {
        readonly en: "Dynamic mark → velocity → loudness, by the same rule as the instruments (the SoundFont way: loudness = depth ÷ 960 × 40·log10(velocity ÷ 127), full velocity = 0 dB). This performer's velocity depth is {dp} (like the library's voices and sustained instruments such as flute and violin; the SoundFont default is 960); no recorded layers, only loudness changes: {extras}";
    };
    readonly 哼的字: {
        readonly en: "Hum syllable";
    };
    readonly "\u6CA1\u5199\u6B4C\u8BCD\u7684\u97F3\u5531\u4EC0\u4E48\uFF08\u6574\u9996\u6B4C\u4E00\u4E2A\uFF09": {
        readonly en: "What notes without lyrics sing (one for the whole song)";
    };
    readonly "\u9AD8\u7EA7\uFF1A\u5531\u6CD5\u6838\u5FC3\u7684\u65CB\u94AE": {
        readonly en: "Advanced: singing core knobs";
    };
    readonly "\u8FD9\u4E00\u7248\u51FA\u4E0D\u4E86\u58F0\uFF08\u522B\u7684\u8F6F\u4EF6\u539F\u6765\u7684\u4E50\u5668\uFF09\uFF1A\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": {
        readonly en: "This version can't sound it (the other software's original instrument): pick another “Who performs”";
    };
    readonly "\u56DE\u5230\u8C31\uFF08Esc\uFF09": {
        readonly en: "Back to the score (Esc)";
    };
    readonly "\u2190 \u8C31": {
        readonly en: "← Score";
    };
    readonly 乐器: {
        readonly en: "Instruments";
    };
    readonly 换一个声部: {
        readonly en: "Switch part";
    };
    readonly "\u8BD5\u542C\u952E\u76D8\uFF1A\u5F00 / \u5173": {
        readonly en: "Audition keys: on / off";
    };
    readonly 台上: {
        readonly en: "On stage";
    };
    readonly "\u6F14\u594F\u8005\u548C\u4ED6\u624B\u91CC\u7684\u7434\uFF1B\u540D\u5B57\u4E0D\u4E0A\u8C31": {
        readonly en: "The performer and the instrument they hold; this name isn't on the score";
    };
    readonly "\u4E50\u5668\u76EE\u5F55\uFF1A\u9876\u4E0A\u662F\u8FD9\u9996\u6B4C\u91CC\u7528\u8FC7\u7684\uFF0C\u4E0B\u9762\u6309\u66F2\u98CE / \u5E74\u4EE3 / \u65CF\u6D4F\u89C8\uFF1B\u53F3\u8FB9\u7684\u952E\u76D8\u8BD5\u542C\uFF0C\u9009\u597D\u5C31\u6362\u4E0A": {
        readonly en: "Instrument catalog: what this song has used is at the top, browse below by style / era / family; try on the keys at the right, pick one and it’s on";
    };
    readonly "\u6362\u4E50\u5668\u2026": {
        readonly en: "Change instrument…";
    };
    readonly "{who} \u600E\u4E48\u6F14": {
        readonly en: "How {who} performs";
    };
    readonly "\u53F3\u8FB9\u7684\u952E\u76D8\u5F39\u7684\u5C31\u662F\u53F0\u4E0A\u8FD9\u4F4D\uFF0C\u6539\u4E86\u9A6C\u4E0A\u80FD\u8BD5": {
        readonly en: "The keys at the right play whoever's on stage; changes can be tried right away";
    };
    readonly "\u8C31\u4E0A\u5199\u300C{rn}\u300D": {
        readonly en: "Shown on the score as “{rn}”";
    };
    readonly 改名在声部管理: {
        readonly en: "rename it under Parts";
    };
    readonly "\u300C{rn}\u300D\u97F3\u548C\u97F3\u4E4B\u95F4 {p} ms": {
        readonly en: "“{rn}” between notes {p} ms";
    };
    readonly "\u300C{rn}\u300D\u97F3\u5185\u8D77\u4F0F {d} dB": {
        readonly en: "“{rn}” in-note swell {d} dB";
    };
    readonly "\u300C{rn}\u300D\u6EDA\u594F\u56DE\u5230\u9ED8\u8BA4": {
        readonly en: "“{rn}” roll back to default";
    };
    readonly "\u300C{rn}\u300D\u6EDA\u594F\u6BCF\u79D2 {n} \u4E0B": {
        readonly en: "“{rn}” roll: {n} per second";
    };
    readonly "\u300C{rn}\u300D\u54CD\u5EA6\u6821\u51C6 {next} dB": {
        readonly en: "“{rn}” loudness calibration {next} dB";
    };
    readonly "\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A\uFF08\u522B\u7684\u8F6F\u4EF6\u539F\u6765\u7684\u4E50\u5668\uFF0C\u8FD9\u4E00\u7248\u8BA4\u4E0D\u51FA\uFF09": {
        readonly en: "Nobody on stage yet (the other software's original instrument isn't recognized by this version)";
    };
    readonly "{next}\u3002\u8FD9{p}\u653E\u548C\u5BFC\u51FA\u90FD\u4E0D\u51FA\u58F0\uFF0C\u5176\u4F59\u7167\u653E\uFF1B\u70B9 |\u25B6 \u89D2\u4E0A\u7684\u6570\u5B57\u770B\u6E05\u5355\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": {
        readonly en: "{next}. {p} silent in both playback and export, the rest plays as usual; tap the number on the corner of |▶ for the list, and tap the part name at the front of the score to change “Who performs”.";
    };
    readonly 现在的声部都能出声了: {
        readonly en: "All parts can sound now";
    };
    readonly "\u300C{who}\u300D\u5531\u4E0D\u4E86\u8FD9\u4E00\u53E5\uFF1A{failed}": {
        readonly en: "“{who}” can't sing this line: {failed}";
    };
    readonly "{who}\uFF1A{pumpQuiet} {left} \u53E5\u2026": {
        readonly en: "{who}: {pumpQuiet} {left} lines…";
    };
    readonly 先唱着: {
        readonly en: "singing ahead";
    };
    readonly 还有: {
        readonly en: "still";
    };
    readonly "\u300C{who}\u300D\u5531\u4E0D\u4E86\u8FD9\u4E00\u53E5\uFF1A{msg}": {
        readonly en: "“{who}” can't sing this line: {msg}";
    };
    readonly "\u5185\u5B58 / \u8D1F\u8F7D\u5403\u7D27\uFF1A\u5C0F\u6708\u76F8\u6539\u6210\u4E00\u6761\u9053\u5531\uFF08\u6162\u4E00\u70B9\uFF0C\u58F0\u97F3\u4E0D\u53D8\uFF09": {
        readonly en: "Memory / load is tight: Tsukuyomi-chan now sings on one lane (slower, same sound)";
    };
    readonly "\u97F3\u9891\u7EBF\u7A0B\u6700\u8FD1 1 s \u5FD9 {p}%\uFF1A\u53EF\u80FD\u7206\u97F3\u3002\u6548\u679C\u94FE / \u58F0\u90E8\u662F\u4F60\u7684\u6DF7\u97F3\uFF0C\u4E0D\u66FF\u4F60\u52A8\uFF1B\u53EF\u4EE5\u5148\u628A\u6CA1\u5728\u542C\u7684\u58F0\u90E8\u9759\u97F3": {
        readonly en: "The audio thread was {p}% busy in the last 1 s: it may crackle. Effects and parts are your mix, so nothing changes automatically; you could mute parts you aren't listening to";
    };
    readonly "\u6CA1\u6709\u51FA\u58F0\uFF1A{issues}\u3002\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": {
        readonly en: "Nothing sounded: {issues}. Tap the part name at the front of the score to change “Who performs”.";
    };
    readonly 没有会出声的声部: {
        readonly en: "No parts that can sound";
    };
    readonly "\u5FAA\u73AF {loopFrom} \u79D2": {
        readonly en: "Loop {loopFrom} s";
    };
    readonly "{atNow} \u79D2": {
        readonly en: "{atNow} s";
    };
    readonly "\u653E\u4E0D\u4E86\uFF1A{Error}": {
        readonly en: "Can't play: {Error}";
    };
    readonly "\u64AD\u653E\u51FA\u9519\u4E86\uFF0C\u5DF2\u7ECF\u505C\u4E0B\uFF08\u9519\u8BEF\u8BB0\u8FDB\u4E86\u8BCA\u65AD\u65E5\u5FD7\uFF09\uFF1A{p}": {
        readonly en: "Playback error, stopped (recorded in the diagnostic log): {p}";
    };
    readonly "\u7B49\u5C0F\u6708\u76F8\u5531\u597D\u8FD9\u4E00\u53E5\u2026": {
        readonly en: "Waiting for Tsukuyomi-chan to finish this line…";
    };
    readonly "\u300C{name}\u300D\u54CD\u4E0D\u4E86\uFF1A{Error}": {
        readonly en: "“{name}” can't sound: {Error}";
    };
    readonly "\u7F16 mp3\u2026": {
        readonly en: "Encoding mp3…";
    };
    readonly 这一张: {
        readonly en: "This sheet";
    };
    readonly 立体声: {
        readonly en: "Stereo";
    };
    readonly 单声道: {
        readonly en: "Mono";
    };
    readonly 歌声导出好了: {
        readonly en: "MP3 exported";
    };
    readonly "{p} \u79D2 \u00B7 mp3 {Q} {kbps}k {size}{fromFinal}{fellBack}{length}{lines}": {
        readonly en: "{p} s · mp3 {Q} {kbps}k {size}{fromFinal}{fellBack}{length}{lines}";
    };
    readonly "\uFF08\u7528\u7684\u662F\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BB0\u7740\u7684\u4E0A\u6B21\u6E32\u597D\u7684\u90A3\u4EFD\uFF0C\u5185\u5BB9\u6CA1\u53D8\uFF09": {
        readonly en: " (the last render remembered on this device; nothing has changed)";
    };
    readonly "\u4E5F\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\u4E86\uFF1A\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF0C\u5185\u5BB9\u4E0D\u53D8\u518D\u5BFC\u51FA\u4E0D\u7528\u518D\u6E32\u3002\u8BBE\u7F6E\u300C\u97F3\u6E90\u4E0E\u7F13\u5B58\u300D\u2192\u300C\u6E32\u67D3\u7F13\u5B58\u300D\u91CC\u770B\u5F97\u89C1\u3001\u5220\u5F97\u6389\u3002": {
        readonly en: "Also kept in the render cache: play it straight from this song’s cover in the library, and re-exporting an unchanged song is instant. See or delete it under Settings › Audio › Render cache.";
    };
    readonly "\u8FD9\u51E0\u6761\u8F68\u6CA1\u51FA\u58F0\uFF0Cmp3 \u91CC\u6CA1\u6709\u5B83\u4EEC\uFF1A": {
        readonly en: "These tracks were silent and aren't in the mp3:";
    };
    readonly "\u7F72\u540D \u00B7 \u5DF2\u5199\u8FDB mp3 \u7684\u6807\u7B7E": {
        readonly en: "Credits · written into the mp3 tags";
    };
    readonly "\u5BFC\u51FA\u5931\u8D25\uFF1A{Error}": {
        readonly en: "Export failed: {Error}";
    };
    readonly "\u6B63\u5728\u5BFC\u51FA\u6216\u51C6\u5907\u64AD\u653E\uFF0C\u7B49\u5B83\u5B8C\u4E86\u518D\u6E32": {
        readonly en: "Exporting or getting ready to play; render after that finishes";
    };
    readonly "{label} \u00B7 \u5F00\u5934 {p} \u79D2": {
        readonly en: "{label} · first {p} s";
    };
    readonly 这个浏览器解不了音频: {
        readonly en: "This browser can't decode the audio";
    };
    readonly "PNG {REF_IMAGE_COLORS} \u8272\u3001{w} \u00D7 {h}\uFF08\u957F\u8FB9\u6700\u591A {REF_IMAGE_EDGE}\uFF09": {
        readonly en: "PNG {REF_IMAGE_COLORS} colors, {w} × {h} (long side up to {REF_IMAGE_EDGE})";
    };
    readonly "mp3 {REF_MP3_KBPS}k{right}\u3001{p} \u5206\u949F": {
        readonly en: "mp3 {REF_MP3_KBPS}k{right}, {p} min";
    };
    readonly " \u5355\u58F0\u9053": {
        readonly en: " mono";
    };
    readonly "\u4E0D\u4F1A\u538B\u8FD9\u79CD\uFF1A{kind}": {
        readonly en: "Can't compress this kind: {kind}";
    };
    readonly 原尺寸: {
        readonly en: "Original size";
    };
    readonly 删掉这张: {
        readonly en: "Delete this one";
    };
    readonly 再点一次删掉: {
        readonly en: "Tap again to delete";
    };
    readonly 上一张: {
        readonly en: "Previous";
    };
    readonly 下一张: {
        readonly en: "Next";
    };
    readonly 参考窗菜单: {
        readonly en: "Reference window menu";
    };
    readonly "\u70B9\u4E00\u4E0B\u7F29\u6210\u5C0F\u56FE\u6807\uFF0C\u6309\u4F4F\u62D6\u52A8\u632A\u4F4D\u7F6E": {
        readonly en: "Tap to shrink to an icon, hold and drag to move";
    };
    readonly 改大小: {
        readonly en: "Resize";
    };
    readonly 往前挪: {
        readonly en: "Move earlier";
    };
    readonly 往后挪: {
        readonly en: "Move later";
    };
    readonly "\u8DF3\u5230\u2026": {
        readonly en: "Jump to…";
    };
    readonly 图片: {
        readonly en: "Image";
    };
    readonly 文字: {
        readonly en: "Text";
    };
    readonly 音频: {
        readonly en: "Audio";
    };
    readonly 视频: {
        readonly en: "Video";
    };
    readonly 内容不在了: {
        readonly en: "Content is gone";
    };
    readonly "\u5BFC\u5165\u56FE\u7247 / \u97F3\u9891 / \u89C6\u9891 / \u6587\u5B57\u2026": {
        readonly en: "Import image / audio / video / text…";
    };
    readonly 播放: {
        readonly en: "Play";
    };
    readonly 暂停: {
        readonly en: "Pause";
    };
    readonly 循环: {
        readonly en: "Loop";
    };
    readonly 上一帧: {
        readonly en: "Previous frame";
    };
    readonly 下一帧: {
        readonly en: "Next frame";
    };
    readonly "\u53EA\u5728\u5185\u5B58\u91CC\uFF0C\u6CA1\u5B58\u8FDB\u6B4C\u91CC\u2014\u2014\u628A\u8FD9\u4E2A\u6587\u4EF6\u62D6\u8FDB\u6765\uFF0C\u6216\u8005\u70B9 \uFF0B \u91CD\u65B0\u5BFC\u5165\uFF0C\u5C31\u8865\u56DE\u8FD9\u91CC": {
        readonly en: "Only in memory, not saved in the song — drag this file in, or re-import with ＋, to fill this spot";
    };
    readonly 缩成小图标: {
        readonly en: "Shrink to an icon";
    };
    readonly "\u70B9\u4E00\u4E0B\u6062\u590D\uFF0C\u6309\u4F4F\u62D6\u52A8\u632A\u4F4D\u7F6E": {
        readonly en: "Tap to restore, hold and drag to move";
    };
    readonly 剪贴板里没有图片或文字: {
        readonly en: "No image or text on the clipboard";
    };
    readonly "\u8FD9\u5F20\u56FE\u8FD9\u4E2A\u6D4F\u89C8\u5668\u6253\u4E0D\u5F00{name}": {
        readonly en: "This browser can't open this image{name}";
    };
    readonly "\u53C2\u8003\u7A97\uFF1A{message}": {
        readonly en: "Reference window: {message}";
    };
    readonly "\u8BA4\u4E0D\u51FA\uFF1A{name}\uFF08\u53C2\u8003\u7A97\u6536\u56FE\u7247\u3001\u97F3\u9891\u548C\u6587\u5B57\uFF09": {
        readonly en: "Not recognized: {name} (the reference window takes images, audio and text)";
    };
    readonly "\u6CA1\u52A0\u4E0A\uFF1A{name}\uFF08{message}\uFF09": {
        readonly en: "Not added: {name} ({message})";
    };
    readonly 出错了: {
        readonly en: "Something went wrong";
    };
    readonly "\u52A0\u4E86 {n} \u5F20": {
        readonly en: "Added {n}";
    };
    readonly "\u8865\u56DE {n} \u5F20\uFF08\u53EA\u653E\u5185\u5B58\u7684\u7A7A\u4F4D\uFF09": {
        readonly en: "Filled {n} (memory-only empty slots)";
    };
    readonly "\u53C2\u8003\u7A97\uFF1A{p}": {
        readonly en: "Reference window: {p}";
    };
    readonly "\u7C98\u8D34.{p}": {
        readonly en: "pasted.{p}";
    };
    readonly "\u8BFB\u4E0D\u4E86\u526A\u8D34\u677F\uFF1A\u70B9\u4E00\u4E0B\u53C2\u8003\u7A97\uFF0C\u518D\u6309 Ctrl / \u2318+V": {
        readonly en: "Can't read the clipboard: tap the reference window, then press Ctrl / ⌘+V";
    };
    readonly "\u8FD9\u9996\u6B4C\u7684\u53C2\u8003\u7A97\u662F\u66F4\u65B0\u7248\u672C\u7684 app \u5B58\u7684\uFF1A\u8FD9\u7248\u6CA1\u6709\u7684\u529F\u80FD\u4FDD\u5B58\u65F6\u4E0D\u4E22\uFF0C\u53EA\u662F\u770B\u4E0D\u5230": {
        readonly en: "This song's reference window was saved by a newer app: features this version lacks aren't lost on save, they're just not visible";
    };
    readonly "\u8FD9\u9996\u6B4C\u7684\u53C2\u8003\u7A97\u662F\u66F4\u65B0\u7248\u672C\u7684 app \u5B58\u7684\uFF08\u53C2\u8003\u6E05\u5355\u7B2C {fileVersion} \u7248\uFF0C\u8FD9\u4E00\u7248\u8BA4\u5230\u7B2C {libVersion} \u7248\uFF09\uFF1A\u539F\u6837\u7559\u7740\u3001\u5B58\u7684\u65F6\u5019\u539F\u6837\u5199\u56DE\uFF0C\u8FD9\u91CC\u5148\u4E0D\u663E\u793A": {
        readonly en: "This song's reference window was saved by a newer app (reference list version {fileVersion}, this version knows up to {libVersion}): kept as is and written back as is, not shown here for now";
    };
    readonly "\u53C2\u8003\u7A97\u8BFB\u4E0D\u51FA\u6765\uFF1A{Error}\uFF08\u5B57\u8282\u539F\u6837\u7559\u7740\u3001\u5B58\u7684\u65F6\u5019\u539F\u6837\u5199\u56DE\uFF09": {
        readonly en: "Can't read the reference window: {Error} (bytes stay untouched and are written back as is)";
    };
    readonly "\u8FD9\u9996\u6B4C\u7684\u53C2\u8003\u7A97\u662F\u66F4\u65B0\u7248\u672C\u7684 app \u5B58\u7684\uFF0C\u8FD9\u4E00\u7248\u5148\u4E0D\u663E\u793A\uFF08\u539F\u6837\u7559\u7740\uFF09": {
        readonly en: "This song's reference window was saved by a newer app; this version doesn't show it for now (kept as is)";
    };
    readonly "\u9053 {p}\uFF1A\u5806 {wasm}{p2} + \u5FF5\u7F13\u5B58 {cache}": {
        readonly en: "Lane {p}: heap {wasm}{p2} + speech cache {cache}";
    };
    readonly "\uFF08\u521A\u8D77\u6765 {base}\uFF09": {
        readonly en: " (at startup {base})";
    };
    readonly 小月相引擎没起: {
        readonly en: "Tsukuyomi-chan's engine isn't running";
    };
    readonly "\u97F3\u9891\u7EBF\u7A0B\uFF1A\u6CA1\u5728\u62A5": {
        readonly en: "Audio thread: not reporting";
    };
    readonly "\u97F3\u9891\u7EBF\u7A0B\u6700\u8FD1 1 s \u5FD9 {p}%{AUDIO_HOT}": {
        readonly en: "Audio thread {p}% busy in the last 1 s{AUDIO_HOT}";
    };
    readonly "\uFF08\u70ED\uFF1A\u53EF\u80FD\u7206\u97F3\uFF09": {
        readonly en: " (hot: may crackle)";
    };
    readonly "\u80FD\u7B97\u5230\u7684\u5360\u7528 {s} / \u9884\u7B97 {total}\uFF08{lanes}\uFF1B\u5F55\u97F3\u623F\u91CC {chunks} \u5757 {chunkBytes}\uFF1B\u97F3\u6E90\u5185\u5B58 {soundMem}\uFF09\u3002{audio}\u3002": {
        readonly en: "Measured usage {s} / budget {total} ({lanes}; {chunks} chunks {chunkBytes} in the studio; sound memory {soundMem}). {audio}.";
    };
    readonly "\u8FD9\u662F itch \u4E0A\u7684\u8BD5\u73A9\u7248\uFF1A\u9664\u4E86\u7F51\u76D8\u540C\u6B65\uFF0C\u522B\u7684\u90FD\u6709\u3002\u5B8C\u6574\u7248\u5728 {SITE_HOST}": {
        readonly en: "This is the itch demo: everything except OneDrive sync. The full version is at {SITE_HOST}";
    };
    readonly "\u8FD9\u662F\u4E0B\u8F7D\u4E0B\u6765\u7684\u5907\u7528\u7248\uFF1A\u9664\u4E86\u7F51\u76D8\u540C\u6B65\uFF0C\u522B\u7684\u90FD\u6709\u3002\u5B8C\u6574\u7248\u5728 {SITE_HOST}": {
        readonly en: "This is the downloaded standalone version: everything except OneDrive sync. The full version is at {SITE_HOST}";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u6253\u5F00\u5907\u7528\u7248\u6CA1\u6D4B\u8FC7\uFF1A\u8BBE\u7F6E\u548C\u7F13\u5B58\u5B58\u4E0D\u4F4F\uFF08\u5173\u4E86\u5C31\u5FD8\uFF09\uFF0C\u6B4C\u8BF7\u8BB0\u5F97\u300C\u5B58\u300D\u4E0B\u6765\u3002\u9047\u5230\u95EE\u9898\u8BF7\u5230 {REPORT_URL} \u544A\u8BC9\u6211\u4EEC": {
        readonly en: "This browser hasn't been tested with the standalone version: settings and caches don't persist (forgotten when closed), so remember to “Save” your songs. For problems, tell us at {REPORT_URL}";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u5199\u4E0D\u8FDB\u5B58\u50A8\u4E86\uFF1A\u8FD9\u6B21\u6253\u5F00\u4E4B\u540E\u6539\u7684\u8BBE\u7F6E\u53EA\u7559\u5728\u5185\u5B58\u91CC\uFF0C\u5173\u4E86\u5C31\u5FD8": {
        readonly en: "This browser can't write to storage: settings changed from now on stay in memory and are forgotten when closed";
    };
    readonly 网盘在官网: {
        readonly en: "OneDrive is on the official site";
    };
    readonly "\u7F51\u76D8\uFF08OneDrive\uFF09\u540C\u6B65\u53EA\u5728\u5B98\u7F51\u7248\u91CC\u6709\uFF1A{SITE_HOST}": {
        readonly en: "OneDrive sync is only on the official site: {SITE_HOST}";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u5B58\u4E0D\u4F4F\u6B4C\u5E93\uFF08\u5173\u4E86\u5C31\u5FD8\uFF09\uFF1A\u6B4C\u8BF7\u7528\u300C\u5B58\u300D\u4E0B\u8F7D\u6210\u6587\u4EF6\uFF1B\u6B4C\u5E93\u5728\u5B98\u7F51\u7248\u91CC\uFF1A{SITE_HOST}": {
        readonly en: "This browser can't keep a library (forgotten when closed): use “Save” to download songs as files; the library is on the official site: {SITE_HOST}";
    };
    readonly "\u6B4C\u5E93\u53EA\u5728\u5B98\u7F51\u7248\u91CC\u6709\uFF08{SITE_HOST}\uFF09\uFF1A\u8FD9\u91CC\u7684\u6B4C\u6CA1\u6709\u6D4F\u89C8\u5668\u5916\u7684\u5BB6\u2014\u2014\u300C\u5B58\u300D= \u4E0B\u8F7D\u6210 .mxl \u6587\u4EF6\uFF0C\u300C\u6253\u5F00\u300D= \u9009\u6587\u4EF6": {
        readonly en: "The library is only on the official site ({SITE_HOST}): songs here have no home outside the browser — “Save” = download an .mxl file, “Open” = choose a file";
    };
    readonly "itch \u7248\u8DDF\u7740 itch \u4E0A\u7684\u7248\u672C\u8D70\uFF1A\u4F5C\u8005\u63A8\u4E86\u65B0\u7248\uFF0C\u5237\u65B0\u8FD9\u4E00\u9875\u5C31\u662F\u65B0\u7684": {
        readonly en: "The itch version follows what's on itch: when a new version is pushed, refresh this page to get it";
    };
    readonly "\u5907\u7528\u7248\u4E0D\u4F1A\u81EA\u5DF1\u66F4\u65B0\uFF1A\u8981\u65B0\u7248\u5C31\u91CD\u65B0\u4E0B\u8F7D\u8FD9\u4E2A\u6587\u4EF6\u5939\uFF0C\u6216\u53BB\u5B98\u7F51 {SITE_HOST}": {
        readonly en: "The standalone version doesn't update itself: for a new version, download this folder again or go to the official site {SITE_HOST}";
    };
    readonly "\u8FD9\u91CC\u6CA1\u6709\u79BB\u7EBF\u58F3\uFF0C\u4E0D\u7528\u66F4\u65B0": {
        readonly en: "No offline shell here, nothing to update";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u9009\u4E0D\u4E86\u6587\u4EF6\u5939\uFF08\u684C\u9762\u7248 Chrome / Edge \u53EF\u4EE5\uFF09\uFF0C\u6240\u4EE5\u5907\u7528\u7248\u5728\u8FD9\u91CC\u6CA1\u6709\u6B4C\u5E93\uFF1A\u300C\u5B58\u300D= \u4E0B\u8F7D\u6210 .mxl \u6587\u4EF6\uFF0C\u300C\u6253\u5F00\u300D= \u9009\u6587\u4EF6\uFF1B\u6B4C\u5E93\u4E5F\u5728\u5B98\u7F51\u7248\u91CC\uFF1A{SITE_HOST}": {
        readonly en: "This browser can't choose folders (desktop Chrome / Edge can), so the standalone version has no library here: “Save” = download an .mxl file, “Open” = choose a file; the library is also on the official site: {SITE_HOST}";
    };
    readonly 去官网: {
        readonly en: "Official site";
    };
    readonly 报告问题: {
        readonly en: "Report a problem";
    };
    readonly "\u5907\u7528\u7248\uFF1A\u5C0F\u6708\u76F8\u7684\u6A21\u578B\u5305\u5C31\u5728\u8FD9\u4E2A\u6587\u4EF6\u5939\u7684 pwa-models/ \u91CC\uFF0C\u7528\u5230\u624D\u8BFB\u3001\u8BFB\u7684\u65F6\u5019\u6838\u54C8\u5E0C\uFF1B\u4E0D\u7528\u4E0B\u8F7D\u3001\u4E5F\u4E0D\u7528\u5BFC\u5165": {
        readonly en: "Standalone: Tsukuyomi-chan's model pack is in this folder's pwa-models/, read when needed and hash-checked as it's read; no download or import needed";
    };
    readonly "\u5907\u7528\u7248\uFF1A\u97F3\u6E90\u5C31\u5728\u8FD9\u4E2A\u6587\u4EF6\u5939\u7684 pwa-sounds/ \u91CC\uFF0C\u7528\u5230\u624D\u8BFB\uFF1B\u6D4F\u89C8\u5668\u7F13\u5B58\u5728\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u91CC\u7528\u4E0D\u4E86\uFF0C\u8FD9\u91CC\u6CA1\u6709\u300C\u7559\u5728\u8BBE\u5907\u4E0A\u300D\u8FD9\u56DE\u4E8B": {
        readonly en: "Standalone: sounds are in this folder's pwa-sounds/, read when needed; browser cache doesn't work on pages opened by double-click, so nothing is “kept on the device” here";
    };
    readonly "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u4E0D\u8BA9\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u7684\u540E\u53F0\u7EBF\u7A0B\u5B58\u4E1C\u897F\uFF1A\u5FF5\u7F13\u5B58\u53EA\u5728\u5185\u5B58\u91CC\uFF08\u6BCF\u6B21\u6253\u5F00\u7B2C\u4E00\u904D\u8981\u91CD\u5FF5\uFF09": {
        readonly en: "This browser doesn't let background threads store data on pages opened by double-click: the speech cache is memory-only (the first pass of each session re-speaks)";
    };
    readonly "\u8FD9\u4EFD mp3 \u653E\u4E0D\u4E86\uFF08\u6587\u4EF6\u574F\u4E86\uFF1F\uFF09": {
        readonly en: "This mp3 can't be played (damaged file?)";
    };
    readonly 音: {
        readonly en: "Notes";
    };
    readonly 词: {
        readonly en: "Lyrics";
    };
    readonly 符: {
        readonly en: "Symbols";
    };
    readonly 听: {
        readonly en: "Listen";
    };
    readonly "\u97F3\uFF1A\u5199\u97F3\u548C\u8BB0\u53F7\u2014\u2014\u8C31\u4E0A\u97F3\u548C\u8BB0\u53F7\u90FD\u80FD\u6539\uFF08\u70B9\u97F3 = \u5149\u6807\uFF0C\u7B14 / \u9F20\u6807\u62D6\u97F3 = \u6539\u97F3\u9AD8 / \u65F6\u503C\uFF1B\u70B9\u8BB0\u53F7 = \u5B83\u7684\u83DC\u5355\u3001\u6309\u4F4F\u62D6 = \u632A\uFF09\uFF1B\u5C0F\u952E\u76D8\u9876\u4E0A\u300C\u7B26 / \u97F3\u300D\u5207\u97F3\u952E / \u7B26\u53F7\u683C\uFF0C\u9000\u683C\u5220\u4EC0\u4E48\u8DDF\u7740\u952E\u76D8": {
        readonly en: "Notes: write notes and marks — both can be edited on the score (tap a note = cursor, drag with pen / mouse = change pitch / length; tap a mark = its menu, hold and drag = move); the switch above the keys toggles note keys / symbol grid, and Backspace follows the keys";
    };
    readonly "\u8BCD\uFF1A\u70B9\u97F3\u6216\u5B83\u4E0B\u9762 = \u5199\u8FD9\u4E2A\u97F3\u7684\u6B4C\u8BCD\uFF1B\u6309\u4F4F\u5B57\u62D6 = \u632A / \u5408\uFF1B\u9000\u683C = \u5220\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u7684\u5B57": {
        readonly en: "Lyrics: tap a note or below it = write its lyric; hold a syllable and drag = move / join; Backspace = delete the syllable of the note before the cursor";
    };
    readonly "\u7B26\uFF1A\u952E\u76D8 = \u7B26\u53F7\u683C\uFF08\u529B\u5EA6\u3001\u6E10\u5F3A\u6E10\u5F31\u3001\u6F14\u594F\u6CD5\u3001\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\u3001\u53CD\u590D\u3001\u98CE\u683C\uFF1B\u9000\u683C = \u5220\u8BB0\u53F7\uFF09\u3002\u8C31\u4E0A\u548C\u300C\u97F3\u300D\u4E00\u6837\uFF1A\u97F3\u548C\u8BB0\u53F7\u90FD\u80FD\u6539": {
        readonly en: "Symbols: keys = symbol grid (dynamics, hairpins, articulations, key / time / tempo, repeats, style; Backspace = delete marks). On the score it's the same as “Notes”: notes and marks can both be edited";
    };
    readonly "\u542C\uFF1A\u8C31\u9501\u4F4F\u9632\u8BEF\u89E6\u2014\u2014\u8F7B\u70B9\u53EA\u8BA4\u770B\u8C31\u7684\uFF08\u58F0\u90E8\u540D / \u7FFB\u7EB8 / \u672C\u6BB5\uFF09\uFF0C\u4E0D\u8DF3\u64AD\uFF1B\u957F\u6309 / \u53F3\u952E\u8C31\u9762 = \u4ECE\u8FD9\u513F\u653E / \u63A5\u7740\u653E / \u4ECE\u5934\u653E\uFF1B\u7A7A\u683C = \u653E / \u505C\uFF1B\u5E95\u4E0B\u662F\u6DF7\u97F3\u53F0\uFF08Esc \u56DE\u5230\u5199\uFF09": {
        readonly en: "Listen: the score locks to prevent accidental edits — taps only do viewing things (part names / page turns / this section) and never jump playback; long-press / right-click the score = play from here / resume / from the top; Space = play / stop; the mixer sits below (Esc returns to writing)";
    };
    readonly "\u6CA1\u6709\u51FA\u58F0\uFF1A{e}": {
        readonly en: "Nothing sounded: {e}";
    };
    readonly "\u6DF7\u97F3\u2026": {
        readonly en: "Mixing…";
    };
    readonly 均衡: {
        readonly en: "EQ";
    };
    readonly "\u6BCF\u6BB5\u4E00\u4E2A\u53CC\u4E8C\u9636 H(z) = (b0 + b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2)\uFF0C\u7CFB\u6570\u6309 RBJ Audio EQ Cookbook\uFF08hp / lp Q = 0.707\uFF1B\u67B6\u5B50 Q = 0.707\uFF1B\u5CF0 Q \u53EF\u8C03\uFF09\u3002hpHz / lpHz = 0 \u5173\u3002": {
        readonly en: "One biquad per band H(z) = (b0 + b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2), coefficients from the RBJ Audio EQ Cookbook (hp / lp Q = 0.707; shelves Q = 0.707; peak Q adjustable). hpHz / lpHz = 0 is off.";
    };
    readonly 低切: {
        readonly en: "Low cut";
    };
    readonly 高切: {
        readonly en: "High cut";
    };
    readonly 低架: {
        readonly en: "Low shelf";
    };
    readonly 低架频率: {
        readonly en: "Low shelf freq";
    };
    readonly 中峰: {
        readonly en: "Mid peak";
    };
    readonly 中峰频率: {
        readonly en: "Mid peak freq";
    };
    readonly 中峰宽: {
        readonly en: "Mid peak width";
    };
    readonly 高架: {
        readonly en: "High shelf";
    };
    readonly 高架频率: {
        readonly en: "High shelf freq";
    };
    readonly 压缩: {
        readonly en: "Compressor";
    };
    readonly "\u5305\u7EDC e[n] = max(|x|, e[n-1]\u00B7r) \u8D77\uFF08attack\uFF09\u843D\uFF08release\uFF09\u5404\u4E00\u4E2A\u65F6\u95F4\u5E38\u6570\uFF1B\u8D85\u8FC7 threshold \u7684\u90E8\u5206\u6309 ratio \u538B\uFF08kneeDb \u5185\u8F6F\u62D0\u70B9\uFF1Ag = -(x - T + K/2)^2 \u00B7 (1 - 1/R) / (2K)\uFF09\uFF1B\u589E\u76CA = 10^(g/20) \u00D7 10^(makeup/20)\u3002key \u7ED9\u4E86 = \u542C\u522B\u7684\u8F68\uFF08\u4FA7\u94FE\uFF09\uFF0C\u4E0D\u7ED9 = \u542C\u81EA\u5DF1\u3002": {
        readonly en: "Envelope e[n] = max(|x|, e[n-1]·r) with one time constant each for attack and release; above the threshold, compressed by ratio (soft knee within kneeDb: g = -(x - T + K/2)^2 · (1 - 1/R) / (2K)); gain = 10^(g/20) × 10^(makeup/20). With a key = listens to another track (sidechain); without = listens to itself.";
    };
    readonly 阈值: {
        readonly en: "Threshold";
    };
    readonly 比例: {
        readonly en: "Ratio";
    };
    readonly 起: {
        readonly en: "Attack";
    };
    readonly 落: {
        readonly en: "Release";
    };
    readonly 拐点: {
        readonly en: "Knee";
    };
    readonly 补偿: {
        readonly en: "Makeup";
    };
    readonly 延迟: {
        readonly en: "Delay";
    };
    readonly "y[n] = x[n]\u00B7dry + d[n]\u00B7mix\uFF08dry \u6CA1\u5199 = 1 \u2212 mix\uFF0Cv0.10.10 \u524D\u7684\u5199\u6CD5\uFF09\uFF0Cd[n] = x[n - D] + fb \u00B7 LP(d[n - D])\uFF0CLP = \u4E00\u9636\u4F4E\u901A dampHz\u3002D = timeMs\uFF08\u6700\u957F 2 s\uFF09\u3002": {
        readonly en: "y[n] = x[n]·dry + d[n]·mix (no dry = 1 − mix, the pre-v0.10.10 form), d[n] = x[n - D] + fb · LP(d[n - D]), LP = one-pole low-pass dampHz. D = timeMs (up to 2 s).";
    };
    readonly 时间: {
        readonly en: "Time";
    };
    readonly 反馈: {
        readonly en: "Feedback";
    };
    readonly 湿: {
        readonly en: "Wet";
    };
    readonly 原声: {
        readonly en: "Dry";
    };
    readonly 反馈高切: {
        readonly en: "Feedback high cut";
    };
    readonly 混响: {
        readonly en: "Reverb";
    };
    readonly "Freeverb\uFF1A8 \u6761\u4F4E\u901A\u53CD\u9988\u68B3\u72B6\uFF08\u957F\u5EA6 1116\u20261617 @44.1k\uFF0C\u6309\u91C7\u6837\u7387\u7F29\u653E\uFF1B\u53CD\u9988 = 0.7 + 0.28\u00B7room\uFF0C\u4F4E\u901A = damp\uFF09\u5E76\u8054\uFF0C\u518D\u4E32 4 \u6761\u5168\u901A\uFF08g = 0.5\uFF09\uFF1B\u53F3\u8FB9\u5404\u957F 23 \u4E2A\u91C7\u6837\uFF1B\u524D\u9762\u4E00\u6BB5 preDelayMs \u7EAF\u5EF6\u8FDF\uFF1By = x\u00B7(1-mix) + wet\u00B7mix\u3002": {
        readonly en: "Freeverb: 8 low-pass feedback combs in parallel (lengths 1116…1617 @44.1k, scaled by sample rate; feedback = 0.7 + 0.28·room, low-pass = damp), then 4 all-pass in series (g = 0.5); the right side is 23 samples longer each; a preDelayMs pure delay in front; y = x·(1-mix) + wet·mix.";
    };
    readonly 房间大小: {
        readonly en: "Room size";
    };
    readonly 高频吸收: {
        readonly en: "Damping";
    };
    readonly 预延迟: {
        readonly en: "Pre-delay";
    };
    readonly 宽度: {
        readonly en: "Width";
    };
    readonly 合唱: {
        readonly en: "Chorus";
    };
    readonly "v \u6761\u5EF6\u8FDF d_k(t) = delayMs + depthMs \u00B7 sin(2\u03C0 \u00B7 rateHz \u00B7 t + 2\u03C0k/v)\uFF08\u7EBF\u6027\u63D2\u503C\u8BFB\uFF09\uFF0C\u7B2C k \u6761\u6446\u5728 pan_k = spread \u00B7 (2k/(v-1) - 1)\uFF1By = x\u00B7(1-mix) + mix \u00B7 \u03A3_k d_k / v\u3002": {
        readonly en: "v delays d_k(t) = delayMs + depthMs · sin(2π · rateHz · t + 2πk/v) (read with linear interpolation), voice k placed at pan_k = spread · (2k/(v-1) - 1); y = x·(1-mix) + mix · Σ_k d_k / v.";
    };
    readonly 几条: {
        readonly en: "Voices";
    };
    readonly 抖动深度: {
        readonly en: "Depth";
    };
    readonly 抖动快慢: {
        readonly en: "Rate";
    };
    readonly 左右铺开: {
        readonly en: "Spread";
    };
    readonly 增益: {
        readonly en: "Gain";
    };
    readonly "{kind}\uFF1A\u8FD9\u4E00\u7248\u4E0D\u8BA4\u8BC6": {
        readonly en: "{kind}: not recognized by this version";
    };
    readonly 还没有人上场: {
        readonly en: "Nobody on stage yet";
    };
    readonly "\u300C{label}\u300D\u4E0D\u4F1A\u6309\u97F3\u7B26\u8868\u51FA\u58F0": {
        readonly en: "“{label}” can't sound from a note list";
    };
    readonly "\u8BD5\u542C\u5143\u97F3\u8868\uFF1A{Error}\uFF08\u5148\u8DD1 node scripts/gen-preview-vowels.mjs\uFF1F\uFF09": {
        readonly en: "Audition vowel table: {Error} (run node scripts/gen-preview-vowels.mjs first?)";
    };
    readonly "\u7ACB\u4F53\u58F0 192k": {
        readonly en: "Stereo 192k";
    };
    readonly "\u7EA6 1.4 MB / \u5206\u949F": {
        readonly en: "about 1.4 MB / minute";
    };
    readonly "\u5C0F\u6587\u4EF6\uFF08\u5355\u58F0\u9053 64k\uFF09": {
        readonly en: "Small file (mono 64k)";
    };
    readonly "\u7EA6 0.5 MB / \u5206\u949F": {
        readonly en: "about 0.5 MB / minute";
    };
    readonly "mp3 \u7F16\u7801 worker \u51FA\u9519": {
        readonly en: "mp3 encoder worker error";
    };
    readonly "\u5B57\u4F53\u4E0B\u4E0D\u6765\uFF08{Error}\uFF09": {
        readonly en: "Couldn't download the font ({Error})";
    };
    readonly "\u97F3\u4E50\u5B57\u5F62\u4E0B\u4E0D\u6765\uFF08{Error}\uFF09": {
        readonly en: "Couldn't download the music glyphs ({Error})";
    };
    readonly 这首歌: {
        readonly en: "This song";
    };
    readonly "\uFF08\u6CA1\u58F0\u660E\u8BB8\u53EF\uFF09": {
        readonly en: "(no license stated)";
    };
    readonly 保留所有权利: {
        readonly en: "All rights reserved";
    };
    readonly "\u4EC0\u4E48\u90FD\u8981\u5148\u95EE\u4F60\uFF08\u6CD5\u5F8B\u9ED8\u8BA4\u5C31\u662F\u8FD9\u6837\uFF0C\u8FD9\u91CC\u53EA\u662F\u5199\u660E\uFF09": {
        readonly en: "Everyone must ask you first for anything (that's the legal default; this just says so)";
    };
    readonly "\u00A9 {y} \u4FDD\u7559\u6240\u6709\u6743\u5229": {
        readonly en: "© {y} All rights reserved";
    };
    readonly 仅供欣赏: {
        readonly en: "For listening only";
    };
    readonly "\u542C\u53EF\u4EE5\uFF1B\u8F6C\u8F7D\u3001\u6539\u7F16\u3001\u5546\u7528\u90FD\u8981\u5148\u95EE\u4F60": {
        readonly en: "Listening is fine; reposting, adapting and commercial use must ask you first";
    };
    readonly "\u00A9 {y} \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002\u4EC5\u4F9B\u4E2A\u4EBA\u6B23\u8D4F\uFF0C\u7981\u6B62\u8F6C\u8F7D\u3001\u6539\u7F16\u3001\u5546\u7528\u3002": {
        readonly en: "© {y} All rights reserved. For personal listening only; no reposting, adaptation or commercial use.";
    };
    readonly 商用请联系: {
        readonly en: "Contact for commercial use";
    };
    readonly "\u4FDD\u7559\u6240\u6709\u6743\u5229\uFF0C\u5E76\u544A\u8BC9\u522B\u4EBA\u5546\u7528\u600E\u4E48\u627E\u4F60": {
        readonly en: "All rights reserved, plus telling people how to reach you for commercial use";
    };
    readonly "\u00A9 {y} \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002\u5546\u7528\u8BF7\u8054\u7CFB\u4F5C\u8005\u3002": {
        readonly en: "© {y} All rights reserved. Contact the author for commercial use.";
    };
    readonly "\u6CE8\u660E\u51FA\u5904\u53EF\u4EE5\u539F\u6837\u8F6C\u53D1\uFF1B\u4E0D\u8BB8\u6539\u3001\u4E0D\u8BB8\u5546\u7528\uFF08\u6700\u7D27\u7684 CC\uFF09": {
        readonly en: "Can be reshared unchanged with credit; no changes, no commercial use (the strictest CC)";
    };
    readonly "\u6CE8\u660E\u51FA\u5904\u53EF\u4EE5\u6539\uFF1B\u4E0D\u8BB8\u5546\u7528": {
        readonly en: "Can be changed with credit; no commercial use";
    };
    readonly "\u6CE8\u660E\u51FA\u5904\u53EF\u4EE5\u6539\u3001\u53EF\u4EE5\u5546\u7528\uFF1B\u6539\u4E86\u7684\u8981\u7528\u540C\u6837\u7684\u8BB8\u53EF": {
        readonly en: "Can be changed and used commercially with credit; changes must use the same license";
    };
    readonly 注明出处随便用: {
        readonly en: "Free to use with credit";
    };
    readonly "\u653E\u5F03\u6743\u5229\uFF0C\u8C01\u90FD\u80FD\u968F\u4FBF\u7528\uFF08\u53D1\u51FA\u53BB\u6536\u4E0D\u56DE\uFF09": {
        readonly en: "Rights waived, anyone can use it freely (can't be taken back once published)";
    };
    readonly "\u4F60\u9009\u7684\u8BB8\u53EF\u5141\u8BB8\u522B\u4EBA\u6539\u7F16 / \u5F53\u7D20\u6750\u518D\u7528\uFF0C\u53EF\u91CC\u9762\u6709\u5C0F\u6708\u76F8\u7684\u58F0\u97F3\uFF0C\u5C0F\u6708\u76F8\u7684\u6761\u6B3E\u4E0D\u8BB8\u8FD9\u6837\u516C\u5F00\uFF08\u8BBE\u7F6E\u91CC\u6709\u539F\u6587\u548C\u8BD1\u6587\uFF09\uFF0C\u6240\u4EE5\u5BFC\u51FA\u65F6\u8BB8\u53EF\u90A3\u4E00\u9879\u6309\u300C\u672A\u58F0\u660E\u300D\u5199\uFF1B\u4F60\u5728\u8FD9\u91CC\u7684\u9009\u62E9\u6CA1\u52A8\u3002": {
        readonly en: "The license you chose lets others adapt or reuse this as material, but it contains Tsukuyomi-chan's voice, and her terms don't allow that publicly (original and translation are in Settings), so exports write the license as “not stated”; your choice here is unchanged.";
    };
    readonly 许可证不明: {
        readonly en: "License unknown";
    };
    readonly "\uFF08\u6CA1\u6709\u7F72\u540D\u4FE1\u606F\uFF09": {
        readonly en: "(no credit information)";
    };
    readonly "{ly} \u8BCD\u66F2": {
        readonly en: "Lyrics & music: {ly}";
    };
    readonly "{ly} \u8BCD": {
        readonly en: "Lyrics: {ly}";
    };
    readonly "{co} \u66F2": {
        readonly en: "Music: {co}";
    };
    readonly "{a} \u7F16\u66F2": {
        readonly en: "Arranged by {a}";
    };
    readonly 排练记号: {
        readonly en: "Rehearsal marks";
    };
    readonly "\u865A\u7EBF\uFF08\u5982\u6E10\u5F3A\u6E10\u5F31\u7684\u5EF6\u7EED\u7EBF\uFF09": {
        readonly en: "Dashes (e.g. the continuation line of a hairpin)";
    };
    readonly 括线: {
        readonly en: "Brackets";
    };
    readonly 弱音器记号: {
        readonly en: "Mute marks";
    };
    readonly 竖琴踏板图: {
        readonly en: "Harp pedal diagrams";
    };
    readonly 止音记号: {
        readonly en: "Damp marks";
    };
    readonly "\u8FD9\u4EFD MusicXML \u662F timewise \u6392\u6CD5\uFF0C\u8FD9\u4E00\u7248\u53EA\u8BFB partwise": {
        readonly en: "This MusicXML is timewise; this version only reads partwise";
    };
    readonly "\u8FD9\u4E0D\u662F MusicXML \u4E50\u8C31\uFF08\u6839\u5143\u7D20\u662F <{name}>\uFF09": {
        readonly en: "This isn't a MusicXML score (root element is <{name}>)";
    };
    readonly "\u8FD9\u4EFD MusicXML \u91CC\u6CA1\u6709\u58F0\u90E8": {
        readonly en: "This MusicXML has no parts";
    };
    readonly "\u548C\u5F26\u8BB0\u53F7\uFF08\u6CA1\u6807\u5728\u4E00\u4E2A\u97F3\u7684\u5F00\u5934\uFF09": {
        readonly en: "Chord symbols (not at the start of a note)";
    };
    readonly "\u548C\u5F26\u8BB0\u53F7\uFF08\u8FD9\u4E00\u7248\u4E0D\u8BA4\u7684\u79CD\u7C7B\uFF09": {
        readonly en: "Chord symbols (a kind this version doesn't know)";
    };
    readonly "\u6F14\u594F\u6CD5\u8BB0\u53F7\uFF08\u8FD9\u4E00\u7248\u4E0D\u8BA4\u7684\uFF09": {
        readonly en: "Articulation marks (not recognized by this version)";
    };
    readonly "\u529B\u5EA6\u8BB0\u53F7\uFF08\u8FD9\u4E00\u7248\u4E0D\u8BA4\u7684\uFF0C\u5982 sfz\uFF09": {
        readonly en: "Dynamic marks (not recognized by this version, such as sfz)";
    };
    readonly "\u6309\u62CD\u5B50\u91CD\u590D\u7684\u98A4\u97F3\uFF08\u4E00\u4E24\u9053\u659C\u7EBF\uFF09": {
        readonly en: "Measured tremolo (one or two slashes)";
    };
    readonly 大谱表下面一行的换谱号: {
        readonly en: "clef changes on the lower staff of a grand staff";
    };
    readonly "\u6587\u5B57\u8BB0\u53F7\uFF08\u5982 dolce\u3001rit.\uFF09": {
        readonly en: "Text directions (e.g. dolce, rit.)";
    };
    readonly 别的方向记号: {
        readonly en: "Other direction marks";
    };
    readonly 装饰音: {
        readonly en: "Grace notes";
    };
    readonly 提示音符: {
        readonly en: "Cue notes";
    };
    readonly 同一声部里的第二条旋律: {
        readonly en: "A second melody within one part";
    };
    readonly "\u53E0\u97F3\uFF08\u524D\u9762\u6CA1\u6709\u80FD\u53E0\u7684\u97F3\uFF09": {
        readonly en: "Stacked notes (with nothing before to stack on)";
    };
    readonly "\u6CA1\u6709\u97F3\u9AD8\u7684\u97F3\uFF08\u6253\u51FB\u4E50\uFF09": {
        readonly en: "Unpitched notes (percussion)";
    };
    readonly 第二段及以后的歌词: {
        readonly en: "Lyrics beyond the first verse";
    };
    readonly "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF09": {
        readonly en: "Tsukuyomi-chan Corpus Terms of Use (derived model)";
    };
    readonly 小月相: {
        readonly en: "Tsukuyomi-chan";
    };
    readonly "\u5C0F\u6708\u76F8\uFF08\u5143\u97F3\uFF09": {
        readonly en: "Tsukuyomi-chan (vowels)";
    };
    readonly "\u9EA6\u514B\u98CE {t}": {
        readonly en: "Mic {t}";
    };
    readonly "\u53C2\u8003\u7A97\u7684\u6587\u4EF6\u4E0D\u5728 {REFERENCES_DIR} \u4E0B\uFF1A{path}": {
        readonly en: "A reference window file isn't under {REFERENCES_DIR}: {path}";
    };
    readonly "\u9EA6\u514B\u98CE {x}": {
        readonly en: "Mic {x}";
    };
    readonly "\u4E0A\u573A\u7684\u5019\u9009\u4E0D\u80FD\u5220\uFF0C\u5148\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": {
        readonly en: "The candidate on stage can't be deleted; change “Who performs” first";
    };
    readonly 角色: {
        readonly en: "role";
    };
    readonly 混音轨: {
        readonly en: "Bus";
    };
    readonly 演奏者: {
        readonly en: "performer";
    };
    readonly 效果格: {
        readonly en: "effect slot";
    };
    readonly 效果的种类: {
        readonly en: "effect type";
    };
    readonly "\u8FD9\u9996\u6B4C\u7684\u6587\u4EF6\u91CC\u6709\u4E0D\u5408\u89C4\u77E9\u7684\u7F16\u53F7\uFF08{what}\uFF09\uFF1A\u591A\u534A\u662F\u88AB\u522B\u7684\u5DE5\u5177\u6539\u8FC7\u6216\u8005\u6587\u4EF6\u574F\u4E86\uFF0C\u6CA1\u6709\u6253\u5F00\u3002": {
        readonly en: "This song file contains malformed internal IDs ({what}): it was probably edited by another tool or is damaged, so it was not opened.";
    };
    readonly "{k} {n} \u4E2A": {
        readonly en: "{n} × {k}";
    };
    readonly "\u8FD9\u4E2A\u6587\u4EF6\u89E3\u4E0D\u5F00\uFF08\u4E0D\u662F\u5B8C\u6574\u7684 .mxl\uFF1F\uFF09\uFF1A{Error}": {
        readonly en: "This file can't be unpacked (not a complete .mxl?): {Error}";
    };
    readonly "\u8FD9\u4E2A\u538B\u7F29\u5305\u91CC\u6CA1\u6709 META-INF/container.xml\uFF0C\u4E0D\u662F .mxl": {
        readonly en: "This archive has no META-INF/container.xml, so it's not an .mxl";
    };
    readonly "container.xml \u6307\u7684\u4E3B\u4E50\u8C31\u5728\u5305\u91CC\u627E\u4E0D\u5230": {
        readonly en: "The main score named in container.xml isn't in the archive";
    };
    readonly "{p} \u8BFB\u4E0D\u61C2\uFF08\u6587\u4EF6\u574F\u4E86\uFF1F\uFF09": {
        readonly en: "{p} can't be read (damaged file?)";
    };
    readonly "\u8FD9\u9996\u6B4C\u662F\u66F4\u65B0\u7248\u672C\u7684 MoonSinger \u5B58\u7684\uFF08{what} \u7B2C {major} \u7248\uFF0C\u8FD9\u4E00\u7248\u53EA\u8BA4\u5230\u7B2C {p} \u7248\uFF09\uFF0C\u6253\u5F00\u518D\u5B58\u4F1A\u4E22\u4E1C\u897F\uFF0C\u6240\u4EE5\u6CA1\u6709\u6253\u5F00\u3002\u8BF7\u5148\u66F4\u65B0 app\u3002": {
        readonly en: "This song was saved by a newer MoonSinger ({what} version {major}, this version knows up to {p}); opening and saving would lose data, so it wasn't opened. Please update the app first.";
    };
    readonly 总目录: {
        readonly en: "The manifest";
    };
    readonly 谱的扩展: {
        readonly en: "The score extension";
    };
    readonly "\u4F11\u606F\u5BA4\u300C{name}\u300D": {
        readonly en: "Green room “{name}”";
    };
    readonly 录音房: {
        readonly en: "The studio";
    };
    readonly "\u7EB8\u300C{id}\u300D\u7684\u8C31\uFF08{file}\uFF09\u5728\u5305\u91CC\u627E\u4E0D\u5230": {
        readonly en: "Score of sheet “{id}” ({file}) isn't in the archive";
    };
    readonly "\u8FD9\u9996\u6B4C\u662F\u66F4\u65B0\u7248\u672C\u7684 MoonSinger \u5B58\u7684\uFF08{p}\u91CC\u6709\u8FD9\u4E00\u7248\u8FD8\u6CA1\u6709\u7684\u4E1C\u897F\uFF09\uFF1A\u7167\u6837\u80FD\u5F00\u80FD\u6539\u80FD\u5B58\uFF0C\u53EA\u662F\u90A3\u4E9B\u4E1C\u897F\u8FD9\u4E00\u7248\u770B\u4E0D\u5230\uFF0C\u5728\u8FD9\u4E00\u7248\u91CC\u5B58\u4E00\u6B21\uFF0C\u5176\u4E2D\u4E00\u90E8\u5206\u4F1A\u4E22\u3002\u60F3\u539F\u6837\u7559\u7740\uFF0C\u5148\u66F4\u65B0 app \u518D\u6539\u3002": {
        readonly en: "This song was saved by a newer MoonSinger ({p} has things this version doesn’t know): you can still open, edit and save it, but this version can’t show those things, and saving it here will lose some of them. To keep them as they are, update the app before editing.";
    };
    readonly "\u58F0\u90E8\u300C{name}\u300D\u548C\u522B\u7684\u58F0\u90E8\u5171\u7528\u4E00\u4EFD\u4E50\u5668\u8BBE\u7F6E\uFF1B\u6BCF\u4E2A\u58F0\u90E8\u6709\u81EA\u5DF1\u7684\u4E50\u5668\uFF0C\u6240\u4EE5\u62C6\u6210\u4E86\u4E24\u4EFD\uFF08\u4E50\u5668\u548C\u8BBE\u7F6E\u90FD\u7167\u6284\uFF09\u3002": {
        readonly en: "Part “{name}” shared its instrument settings with another part; every part has its own instrument, so they were split into two copies (instrument and settings copied).";
    };
    readonly "\u8FD9\u4EFD\u8C31\u91CC\u6709\u8FD9\u4E00\u7248\u8FD8\u4E0D\u652F\u6301\u7684\u4E1C\u897F\uFF0C\u6CA1\u6709\u8BFB\u8FDB\u6765\uFF1A{k}\u3002\u5B58\u7684\u65F6\u5019\u5B83\u4EEC\u4E0D\u4F1A\u5728\u65B0\u6587\u4EF6\u91CC\u2014\u2014\u8981\u7559\u539F\u6837\uFF0C\u8BF7\u300C\u53E6\u5B58\u4E3A\u300D\u65B0\u6587\u4EF6\u3002": {
        readonly en: "This score has things this version doesn't support, which weren't read: {k}. They won't be in a new file when saving — to keep them, save as a new file.";
    };
    readonly "{k} {n} \u5904": {
        readonly en: "{k} at {n} places";
    };
    readonly 原来的乐器: {
        readonly en: "The original instrument";
    };
    readonly "\u58F0\u90E8\u300C{name}\u300D\u539F\u6765\u662F{was}{gm}\uFF1B\u8FD9\u4E00\u7248\u6CA1\u6709\u8FD9\u4EF6\u4E50\u5668\uFF0C\u6240\u4EE5\u8FD8\u6CA1\u4EBA\u4E0A\u573A\u3002\u8981\u5C0F\u6708\u76F8\u6765\u5531\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u300C{name2}\u300D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u9009\u5C0F\u6708\u76F8\u3002": {
        readonly en: "Part “{name}” used to be {was}{gm}; this version doesn't have that instrument, so nobody is on stage yet. To have Tsukuyomi-chan sing it, tap “{name2}” at the front of the score and choose her under “Who performs”.";
    };
    readonly "\uFF08GM {gm} \u53F7\uFF09": {
        readonly en: " (GM {gm})";
    };
    readonly "\u300C{name}\u300D\u7684\u58F0\u97F3\uFF08{path}\uFF09\u6CA1\u968F\u8FD9\u9996\u6B4C\u4E00\u8D77\u5E26\u6765\uFF0C\u6240\u4EE5\u6CA1\u4EBA\u4E0A\u573A\u3002\u70B9\u8C31\u524D\u9762\u7684\u300C{name2}\u300D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": {
        readonly en: "The sound of “{name}” ({path}) didn't come with this song, so nobody is on stage. Tap “{name2}” at the front of the score to change “Who performs”.";
    };
    readonly "XML \u8BFB\u4E0D\u61C2\uFF08\u7B2C {i} \u884C\uFF09\uFF1A{what}": {
        readonly en: "Can't read the XML (line {i}): {what}";
    };
    readonly 注释没收尾: {
        readonly en: "Unterminated comment";
    };
    readonly "CDATA \u6CA1\u6536\u5C3E": {
        readonly en: "Unterminated CDATA";
    };
    readonly 处理指令没收尾: {
        readonly en: "Unterminated processing instruction";
    };
    readonly 结束标签没收尾: {
        readonly en: "Unterminated end tag";
    };
    readonly "\u7ED3\u675F\u6807\u7B7E </{name}> \u5BF9\u4E0D\u4E0A <{top}>": {
        readonly en: "End tag </{name}> doesn't match <{top}>";
    };
    readonly 标签名: {
        readonly en: "Tag name";
    };
    readonly "<{name}> \u91CC\u6709\u8BFB\u4E0D\u61C2\u7684\u4E1C\u897F": {
        readonly en: "Something unreadable inside <{name}>";
    };
    readonly "<{name}> \u6CA1\u6709\u7ED3\u675F": {
        readonly en: "<{name}> has no end";
    };
    readonly 没有根元素: {
        readonly en: "No root element";
    };
    readonly "\u8FD8\u6CA1\u6709\u6B4C\u3002\u70B9\u300C\u65B0\u5EFA\u300D\u5199\u4E00\u9996\uFF0C\u6216\u628A .mxl \u62D6\u8FDB\u6765\u3002": {
        readonly en: "No songs yet. Tap “New” to write one, or drag in an .mxl.";
    };
    readonly "\u8FD9\u4E2A\u5939\u91CC\u8FD8\u6CA1\u6709\u6B4C\u3002": {
        readonly en: "No songs in this folder yet.";
    };
    readonly "\u56DE\u6536\u7AD9\u662F\u7A7A\u7684\u3002": {
        readonly en: "The trash is empty.";
    };
    readonly 打开中: {
        readonly en: "Open now";
    };
    readonly 歌库: {
        readonly en: "Library";
    };
    readonly "\u4E91\u7AEF\uFF1A\u767B\u5F55 / \u9000\u51FA": {
        readonly en: "Cloud: sign in / out";
    };
    readonly "\u5373\u5174\uFF1A\u6311\u4E50\u5668\u3001\u7528\u952E\u76D8\u5F39\u7740\u73A9\uFF08\u4E0D\u5199\u8FDB\u54EA\u9996\u6B4C\uFF09": {
        readonly en: "Jam: pick an instrument and play on the keys for fun (not written into any song)";
    };
    readonly 即兴: {
        readonly en: "Jam";
    };
    readonly "\u65B0\u5EFA\uFF1A\u4E00\u9996\u6B4C / \u4E00\u4E2A\u6587\u4EF6\u5939": {
        readonly en: "New: a song / a folder";
    };
    readonly 回收站和备份箱: {
        readonly en: "Trash and backups";
    };
    readonly 回到歌: {
        readonly en: "Back to the song";
    };
    readonly 回收站: {
        readonly en: "Trash";
    };
    readonly 备份箱: {
        readonly en: "Backups";
    };
    readonly 旧: {
        readonly en: "outdated";
    };
    readonly "\u6539\u4E8E {lastModified}": {
        readonly en: "Changed {lastModified}";
    };
    readonly "\u6E32\u67D3\u7F13\u5B58\u91CC\u8FD8\u6CA1\u6709\u8FD9\u9996\uFF1A\u70B9 = \u6E32\u67D3\uFF08\u4E4B\u540E\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF09": {
        readonly en: "Not in the render cache yet: tap to render (then play it from the cover)";
    };
    readonly "\u6682\u505C\uFF08\u5E95\u8FB9\u64AD\u653E\u6761\u4E0A\u4E5F\u80FD\u63A7\uFF09": {
        readonly en: "Pause (also on the bottom player bar)";
    };
    readonly "\u64AD\u653E\u6E32\u67D3\u7F13\u5B58\u91CC\u4E0A\u6B21\u6E32\u7684\u90A3\u4E00\u904D\uFF08\u4E4B\u540E\u6539\u8FC7\uFF0C{p} \u79D2\uFF09": {
        readonly en: "Play the last render from the render cache (outdated: changed since; {p} s)";
    };
    readonly "\u64AD\u653E\u6E32\u67D3\u7F13\u5B58\u91CC\u7684\u8FD9\u4E00\u904D\uFF08\u65E7\u7248\u672C\u7684\u5F15\u64CE\u6E32\u7684\uFF0C{p} \u79D2\uFF09": {
        readonly en: "Play the copy in the render cache (rendered by an older engine, {p} s)";
    };
    readonly "\u64AD\u653E\u6E32\u67D3\u7F13\u5B58\u91CC\u7684\u8FD9\u4E00\u904D\uFF08{p} \u79D2\uFF09": {
        readonly en: "Play from render cache ({p} s)";
    };
    readonly "\u542C\u6B4C\u91CC\u5E26\u7740\u7684\u90A3\u4EFD mp3\uFF08{p} \u79D2\uFF09": {
        readonly en: "Play the mp3 stored inside the song ({p} s)";
    };
    readonly "\u6E32\u67D3\u7F13\u5B58\u91CC\u90A3\u4E00\u904D\u662F\u6539\u4E4B\u524D\u3001\u7528\u65E7\u7248\u672C\u7684\u5F15\u64CE\uFF08\u6E32\u67D3\u6838\u5FC3 {v}\uFF09\u6E32\u7684\uFF1A\u7167\u6837\u80FD\u542C\uFF1B\u64AD\u653E\u6761\u4E0A\u300C\u91CD\u65B0\u6E32\u67D3\u300D\u6309\u73B0\u5728\u7684\u6837\u5B50\u3001\u7528\u73B0\u5728\u7684\u5F15\u64CE\u91CD\u6E32": {
        readonly en: "The copy in the render cache was rendered before later edits, by an older engine (render core {v}): you can still play it; “Render again” on the player bar re-renders the song as it is now with the current engine";
    };
    readonly "\u6E32\u67D3\u7F13\u5B58\u91CC\u90A3\u4E00\u904D\u662F\u65E7\u7248\u672C\u7684\u5F15\u64CE\uFF08\u6E32\u67D3\u6838\u5FC3 {v}\uFF09\u6E32\u7684\uFF1A\u7167\u6837\u80FD\u542C\uFF1B\u64AD\u653E\u6761\u4E0A\u300C\u91CD\u65B0\u6E32\u67D3\u300D\u7528\u73B0\u5728\u7684\u5F15\u64CE\u91CD\u6E32": {
        readonly en: "The copy in the render cache was rendered by an older engine (render core {v}): you can still play it; “Render again” on the player bar re-renders it with the current engine";
    };
    readonly "\u6E32\u67D3\u7F13\u5B58\u91CC\u90A3\u4E00\u904D\u662F\u6539\u4E4B\u524D\u6E32\u7684\uFF08\u4E4B\u540E\u6539\u8FC7\uFF09": {
        readonly en: "The render cache has a render from before later changes";
    };
    readonly "\u4ECE\u5934\u653E\uFF08\u9501\u5C4F / \u8033\u673A\u7684\u300C\u4E0A\u4E00\u9996\u300D\u4E5F\u662F\uFF09": {
        readonly en: "From the top (“previous track” on the lock screen / headphones too)";
    };
    readonly "\u653E / \u6682\u505C": {
        readonly en: "Play / pause";
    };
    readonly 按现在的样子重新渲一遍: {
        readonly en: "Render again as it is now";
    };
    readonly 重新渲染: {
        readonly en: "Render again";
    };
    readonly "\u5206\u4EAB / \u4E0B\u8F7D\u8FD9\u9996\u7684 mp3": {
        readonly en: "Share / download this song’s mp3";
    };
    readonly 停: {
        readonly en: "Stop";
    };
    readonly "{stem} \u00B7 \u65E7\uFF08\u4E4B\u540E\u6539\u8FC7\uFF09": {
        readonly en: "{stem} · outdated (changed since)";
    };
    readonly "{stem} \u00B7 \u65E7\uFF08\u65E7\u7248\u672C\u7684\u5F15\u64CE\u6E32\u7684\uFF09": {
        readonly en: "{stem} · old (rendered by an older engine)";
    };
    readonly "\u8FD9\u4E00\u904D\u662F\u65E7\u7248\u672C\u7684\u5F15\u64CE\u6E32\u7684\uFF1A\u7528\u73B0\u5728\u7684\u5F15\u64CE\u91CD\u65B0\u6E32\u4E00\u904D\uFF0C\u6362\u6389\u5B83": {
        readonly en: "This copy was rendered by an older engine: render it again with the current engine to replace it";
    };
    readonly "\u8FD9\u4E00\u904D\u662F\u4E4B\u524D\u6E32\u7684\uFF1A\u5FAA\u73AF\u8981\u7B49\u4F59\u97F3\u653E\u5B8C\u624D\u56DE\u5230\u5F00\u5934\u3002\u91CD\u65B0\u6E32\u4E00\u904D\uFF0C\u5FAA\u73AF\u5C31\u6309\u8C31\u5207\uFF08\u548C\u7F16\u8F91\u5668\u91CC\u4E00\u6837\uFF09": {
        readonly en: "This render is from before: looping waits for the tail to die out before starting over. Render again and the loop cuts by the score, like in the editor";
    };
    readonly "\u5355\u66F2\u5FAA\u73AF\uFF1A\u5F00\u7740\uFF08\u653E\u5B8C\u4ECE\u5934\u518D\u653E\uFF0C\u9501\u5C4F\u4E5F\u4E00\u6837\uFF09": {
        readonly en: "Loop song: on (restarts at the end, on the lock screen too)";
    };
    readonly "\u5355\u66F2\u5FAA\u73AF\uFF1A\u5173\u7740\uFF08\u653E\u5B8C\u5C31\u505C\uFF09": {
        readonly en: "Loop song: off (stops at the end)";
    };
    readonly "\u6E32\u67D3\u7F13\u5B58\u91CC\u8FD8\u6CA1\u6709\u8FD9\u9996\uFF1A\u70B9\u5B83\u5C01\u9762\u4E0A\u7684\u94AE\u6E32\u67D3\uFF0C\u6216\u8005\u6253\u5F00\u5B83\u7528\u4E09\u6761\u6760\u91CC\u7684\u300C\u6E32\u67D3\u5230\u7F13\u5B58\u300D\u3002": {
        readonly en: "This song isn’t in the render cache yet: tap the button on its cover to render it, or open it and use “Render to cache” in the ☰ menu.";
    };
    readonly "\u53D6\u300C{stem}\u300D\u7684\u58F0\u97F3\u2026": {
        readonly en: "Getting the audio for “{stem}”…";
    };
    readonly 这台设备上记着的那一遍: {
        readonly en: "Remembered on this device";
    };
    readonly "mp3 \u6CA1\u53D6\u5230\uFF08{blob}\uFF09": {
        readonly en: "Couldn't get the mp3 ({blob})";
    };
    readonly 空: {
        readonly en: "empty";
    };
    readonly "\u6B4C\u91CC\u5E26\u7740\u7684\u90A3\u4EFD mp3": {
        readonly en: "The mp3 stored inside the song";
    };
    readonly "\u6CA1\u80FD\u81EA\u5DF1\u5F00\u59CB\u653E\uFF1A\u70B9\u5E95\u8FB9\u64AD\u653E\u6761\u4E0A\u7684 \u25B6": {
        readonly en: "Couldn't start playing by itself: tap ▶ on the bottom player bar";
    };
    readonly "\u6B4C\u5E93\u8FD8\u6CA1\u63A5\u4E0A\uFF0C\u5EFA\u4E0D\u4E86\u6587\u4EF6\u5939": {
        readonly en: "The library isn't connected yet, so folders can't be created";
    };
    readonly 新建文件夹: {
        readonly en: "New folder";
    };
    readonly 新文件夹: {
        readonly en: "New folder";
    };
    readonly 文件夹名: {
        readonly en: "Folder name";
    };
    readonly 文件夹名不能空着: {
        readonly en: "Folder name can't be empty";
    };
    readonly "\u6587\u4EF6\u5939\u540D\u91CC\u4E0D\u80FD\u6709 / \\ : * ? \" < > |\uFF0C\u4E5F\u4E0D\u80FD\u7528\u70B9\u6216\u7A7A\u683C\u5F00\u5934 / \u7ED3\u5C3E\uFF08OneDrive \u4E0D\u6536\uFF09": {
        readonly en: "Folder names can't contain / \\ : * ? \" < > |, or start / end with a dot or space (OneDrive rejects them)";
    };
    readonly "\u65B0\u5EFA\u6587\u4EF6\u5939\u300C{n}\u300D\u2026": {
        readonly en: "Creating folder “{n}”…";
    };
    readonly "\u300C{n}\u300D\u8FD9\u4E2A\u540D\u5B57\u5DF2\u7ECF\u6709\u4E86\uFF08\u540C\u540D\u7684\u6B4C\u6216\u6587\u4EF6\u5939\uFF09": {
        readonly en: "“{n}” already exists (a song or folder with that name)";
    };
    readonly "\u5EFA\u597D\u4E86\u6587\u4EF6\u5939\u300C{n}\u300D": {
        readonly en: "Created folder “{n}”";
    };
    readonly "\u65B0\u5EFA\u6587\u4EF6\u5939\u6CA1\u6210\u529F\uFF1A{Error}": {
        readonly en: "Couldn't create folder: {Error}";
    };
    readonly 新建歌: {
        readonly en: "New song";
    };
    readonly 在现在这个夹里: {
        readonly en: "In this folder";
    };
    readonly "\u65B0\u5EFA\u6587\u4EF6\u5939\u2026": {
        readonly en: "New folder…";
    };
    readonly "\u6B4C\u5E93\u5728\u6587\u4EF6\u5939\u300C{folder}\u300D": {
        readonly en: "Library is in folder “{folder}”";
    };
    readonly "\u4E91\u7AEF\uFF1A\u5DF2\u767B\u5F55{p}": {
        readonly en: "Cloud: signed in{p}";
    };
    readonly "\u4E91\u7AEF\uFF1A\u6CA1\u767B\u5F55\uFF08\u6B4C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF09": {
        readonly en: "Cloud: not signed in (songs only on this device)";
    };
    readonly "{file} \u548C app \u5185\u5D4C\u7684\u4E0D\u4E00\u6837\uFF08\u88AB\u6539\u8FC7\uFF1F\uFF09": {
        readonly en: "{file} differs from the copy built into the app (modified?)";
    };
    readonly "\u9F13\u4EF6 {note}": {
        readonly en: "Drum piece {note}";
    };
    readonly "{zh}\u7684\u5E38\u7528\u97F3\u57DF{basis}": {
        readonly en: "Common range of {zh}{basis}";
    };
    readonly "\uFF08\u4F9D\u636E\uFF1A{basis}\uFF09": {
        readonly en: " (basis: {basis})";
    };
    readonly "\u539F\u901F\u952E\uFF1A\u6309\u8FD9\u4E2A\u952E\uFF0C\u91C7\u6837\u4E0D\u62C9\u4F38\u4E0D\u538B\u7F29{recommendedBasis}": {
        readonly en: "Original-speed key: press this key and the sample isn't stretched or compressed{recommendedBasis}";
    };
    readonly "\u8C31\u4E0A\u5199\u7684\u5C31\u662F\u5B9E\u9645\u97F3\u9AD8\uFF08MoonSinger \u4E0D\u6309\u4E50\u5668\u79FB\u8C03\uFF09\uFF0C\u53D1\u7ED9\u97F3\u6E90\u7684\u4E5F\u662F\u8FD9\u4E2A\u97F3\u3002": {
        readonly en: "What's written is the actual pitch (MoonSinger doesn't transpose by instrument), and that's what's sent to the sound source.";
    };
    readonly "\u8FD9\u4EF6\u4E50\u5668\u7684\u8C31\u4E60\u60EF\u5199{p} {octave} \u4E2A\u516B\u5EA6\uFF08\u5B9E\u9645{p2}\uFF09\uFF1B\u60F3\u8981\u8C31\u9762\u597D\u8BFB\uFF0C\u7528\u8C31\u53F7\uFF08\u8FD9\u4EF6\u4E50\u5668\u6309\u5B9E\u9645\u97F3\u9AD8\u65F6\u5E38\u7528\u300C{concertClef}\u300D\uFF0C\u8C31\u53F7\u300C\u81EA\u52A8\u300D\u4E5F\u4F1A\u6311\uFF09\u6216 8va \u7EBF\uFF0C\u51FA\u58F0\u4E0D\u53D8\u3002": {
        readonly en: "This instrument is customarily written {p} {octave} octaves (sounding {p2}); for an easier-to-read score, use a clef (at concert pitch it commonly uses “{concertClef}”, which “Auto” also picks) or an 8va line; the sound doesn't change.";
    };
    readonly 低: {
        readonly en: "lower";
    };
    readonly 高: {
        readonly en: "higher";
    };
    readonly "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u5224\u4E0D\u51C6\u2014\u2014\u6BCF\u4E2A\u952E\u6700\u5F3A\u7684\u90A3\u4E2A\u5206\u97F3\u6BD4\u952E\u540D\u9AD8 {measured} \u534A\u97F3\uFF0C\u542C\u8D77\u6765\u591A\u534A\u8DDF\u7740\u5B83\u3002": {
        readonly en: "Measured on this GS sound: unclear — the strongest partial of each key is {measured} semitones above the key name, and it likely sounds like that.";
    };
    readonly "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u6309\u54EA\u4E2A\u952E\uFF0C\u8033\u6735\u542C\u5230\u7684\u5C31\u662F\u90A3\u4E2A\u97F3\u3002": {
        readonly en: "Measured on this GS sound: whichever key you press is the note you hear.";
    };
    readonly "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u6700\u5F3A\u7684\u5206\u97F3\u6BD4\u952E\u540D\u9AD8 {measured} \u534A\u97F3\uFF08{measuredOctave} \u4E2A\u516B\u5EA6\uFF09\uFF0C\u4F46\u8033\u6735\u542C\u5230\u7684\u97F3\u540D\u8FD8\u662F\u952E\u540D\uFF08\u949F\u7684\u6253\u51FB\u97F3\uFF09\u2014\u2014\u542C\u7740\u89C9\u5F97\u9AD8\u4E86\u662F\u8FD9\u4E2A\u539F\u56E0\u3002": {
        readonly en: "Measured on this GS sound: the strongest partial is {measured} semitones above the key name ({measuredOctave} octaves), but the perceived note is still the key name (a bell's strike tone) — that's why it can sound high.";
    };
    readonly "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u8033\u6735\u542C\u5230\u7684\u6BD4\u952E\u540D{p} {perceived} \u534A\u97F3\u3002": {
        readonly en: "Measured on this GS sound: it sounds {p} than the key name by {perceived} semitones.";
    };
    readonly 按年代: {
        readonly en: "By era";
    };
    readonly 按曲风: {
        readonly en: "By genre";
    };
    readonly "\u6309\u79CD\u7C7B\uFF08\u9F13\u3001Pad\u2026\uFF09": {
        readonly en: "By kind (drums, pads…)";
    };
    readonly "\u6309\u65CF\uFF08GM \u7684\u987A\u5E8F\uFF09": {
        readonly en: "By family (GM order)";
    };
    readonly 按发声方式: {
        readonly en: "By sound source";
    };
    readonly "\u4F53\u9E23\uFF08\u6572\u5B83\u81EA\u5DF1\uFF09": {
        readonly en: "Idiophones (struck itself)";
    };
    readonly "\u819C\u9E23\uFF08\u6572\u76AE\uFF09": {
        readonly en: "Membranophones (struck skin)";
    };
    readonly "\u5F26\u9E23\uFF08\u5F26\uFF09": {
        readonly en: "Chordophones (strings)";
    };
    readonly "\u6C14\u9E23\uFF08\u6C14\uFF09": {
        readonly en: "Aerophones (air)";
    };
    readonly "\u7535\u9E23\uFF08\u7535\uFF09": {
        readonly en: "Electrophones (electric)";
    };
    readonly 人声: {
        readonly en: "Voice";
    };
    readonly 音效: {
        readonly en: "Sound effects";
    };
    readonly "\uFF08{from} \u8D77\uFF09": {
        readonly en: " (from {from})";
    };
    readonly 年代不详: {
        readonly en: "Era unknown";
    };
    readonly 分类不详: {
        readonly en: "Family unknown";
    };
    readonly 鼓和打击乐: {
        readonly en: "Drums & percussion";
    };
    readonly "Pad\uFF08\u5408\u6210\u5668\u7684\u94FA\u5E95\u97F3\u8272\uFF09": {
        readonly en: "Pads (synth pad sounds)";
    };
    readonly "\u5176\u4F59\uFF08\u8FD8\u6CA1\u6309\u79CD\u7C7B\u5206\uFF09": {
        readonly en: "Others (not sorted by kind yet)";
    };
    readonly 没贴风格: {
        readonly en: "No style tag";
    };
    readonly "\u516C\u5143\u524D {y}": {
        readonly en: "{y} BC";
    };
    readonly 写音: {
        readonly en: "Write notes";
    };
    readonly "1\u20137\uFF08\u5C0F\u952E\u76D8\u4E5F\u884C\uFF09": {
        readonly en: "1–7 (numpad too)";
    };
    readonly "\u5199\u4E00\u4E2A\u97F3\uFF1A\u8C03\u91CC\u7B2C\u51E0\u7EA7\uFF0C\u843D\u5728\u79BB\u4E0A\u4E00\u4E2A\u97F3\u6700\u8FD1\u5904": {
        readonly en: "Write a note: this scale degree, nearest the previous note";
    };
    readonly "\u628A\u9009\u4E2D\u7684\u7B2C\u4E00\u4E2A\u97F3\u6539\u6210\u8FD9\u4E00\u7EA7\uFF0C\u9009\u4E2D\u8DF3\u5230\u4E0B\u4E00\u4E2A\u97F3": {
        readonly en: "Change the first selected note to this degree, and move the selection to the next note";
    };
    readonly 只唱不写: {
        readonly en: "Sound only, don't write";
    };
    readonly "\u53E0\uFF1A\u8FD9\u4E00\u7EA7\u53E0\u5230\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u4E0A\uFF08\u548C\u5F26\uFF0C\u843D\u5728\u79BB\u5B83\u73B0\u6709\u7684\u97F3\u6700\u8FD1\u5904\uFF1B\u5DF2\u7ECF\u6709 = \u53BB\u6389\uFF09\u3002\u540C pad\u300C\u53E0\u300D": {
        readonly en: "Stack: add this degree to the note before the cursor (a chord, placed nearest its existing notes; already there = removed). Same as the pad's stack key";
    };
    readonly "\u53E0\u5230\u521A\u5199\u7684\u90A3\u4E2A / \u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\u4E0A": {
        readonly en: "Stack on the note just written / the selection's first note";
    };
    readonly "\u540C\u4E0A\uFF0C\u5F80\u4E0B\u627E\uFF08\u6570\u5B57\u6B63\u4E0B\u65B9\u90A3\u4E00\u6392\uFF09": {
        readonly en: "Same, searching downward (the row right below the digits)";
    };
    readonly "\u540C\u4E0A\uFF0C\u5F80\u4E0B\u627E": {
        readonly en: "Same, searching downward";
    };
    readonly "\u53EA\u5531\u4E0D\u5199\uFF08\u5F80\u4E0B\u627E\uFF09": {
        readonly en: "Sound only, don't write (searching downward)";
    };
    readonly 休止: {
        readonly en: "Rest";
    };
    readonly "\u9009\u533A\u91CC\u5199\u4E00\u4E2A\u4F11\u6B62\uFF08\u66FF\u6362\u6A21\u5F0F\uFF1A\u6309\u957F\u77ED\u6863\u5403\u6389\u9009\u533A\u91CC\u7684\u97F3\uFF0C\u4E0D\u5199\u51FA\u9009\u533A\uFF09": {
        readonly en: "Write a rest in the selection (replace mode: eats selected notes at the current length, never past the selection)";
    };
    readonly 小节线: {
        readonly en: "Barline";
    };
    readonly 在选中后面插小节线: {
        readonly en: "Insert a barline after the selection";
    };
    readonly "\u77ED\uFF1A\u4E0B\u4E00\u4E2A\u97F3\u7684\u65F6\u503C\u51CF\u534A\uFF08\u5230\u4E09\u5341\u4E8C\u5206\u4E3A\u6B62\uFF09": {
        readonly en: "Shorter: halve the next note's length (down to a thirty-second)";
    };
    readonly "\u77ED\uFF1A\u63A5\u4E0B\u6765\u5199\u7684\u51CF\u534A\uFF08\u9009\u533A\u91CC\u5199 = \u6309\u8FD9\u4E00\u6863\u66FF\u6362\uFF1B\u6574\u7EC4\u6539\u65F6\u503C\u8D70\u9009\u533A\u83DC\u5355\uFF09": {
        readonly en: "Shorter: halve what's written next (in a selection = replaces at this length; to change a whole group, use the selection menu)";
    };
    readonly "\u957F\uFF1A\u4E0B\u4E00\u4E2A\u97F3\u7684\u65F6\u503C\u52A0\u500D\uFF08\u5230\u5168\u97F3\u7B26\u4E3A\u6B62\uFF09": {
        readonly en: "Longer: double the next note's length (up to a whole note)";
    };
    readonly "\u957F\uFF1A\u63A5\u4E0B\u6765\u5199\u7684\u52A0\u500D\uFF08\u9009\u533A\u91CC\u5199 = \u6309\u8FD9\u4E00\u6863\u66FF\u6362\uFF1B\u6574\u7EC4\u6539\u65F6\u503C\u8D70\u9009\u533A\u83DC\u5355\uFF09": {
        readonly en: "Longer: double what's written next (in a selection = replaces at this length; to change a whole group, use the selection menu)";
    };
    readonly "\u4E09\u8FDE\u97F3\u5F00 / \u5173\uFF08\u4E0B\u4E00\u4E2A\u97F3\u8D77\uFF09": {
        readonly en: "Triplets on / off (from the next note)";
    };
    readonly "\u521A\u5199\u7684\u97F3\u52A0\u4E00\u4EFD\uFF08\u7B80\u8C31\u7684\u6A2A\u7EBF\uFF09\uFF1B\u9694\u7740\u5C0F\u8282\u7EBF = \u65B0\u5F00\u4E00\u4E2A\u8FDE\u7740\u7684\u540C\u97F3": {
        readonly en: "Add one unit to the note just written (the jianpu dash); across a barline = starts a tied note of the same pitch";
    };
    readonly 选中的音各加一份: {
        readonly en: "Add one unit to each selected note";
    };
    readonly 音高: {
        readonly en: "Pitch";
    };
    readonly "\u266F\uFF1A\u70B9\u4E00\u4E0B\u7BA1\u4E0B\u4E00\u4E2A\u97F3\uFF0C\u8FDE\u70B9\u4E24\u4E0B\u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00": {
        readonly en: "♯: tap = next note, double-tap = lock, tap again = unlock";
    };
    readonly 选中的音升半音: {
        readonly en: "Raise selected notes a semitone";
    };
    readonly "\u266D\uFF1A\u540C\u4E0A": {
        readonly en: "♭: same";
    };
    readonly 选中的音降半音: {
        readonly en: "Lower selected notes a semitone";
    };
    readonly 光标前那个音高八度: {
        readonly en: "Note before the cursor up an octave";
    };
    readonly 选中的音高八度: {
        readonly en: "Selected notes up an octave";
    };
    readonly 光标前那个音低八度: {
        readonly en: "Note before the cursor down an octave";
    };
    readonly 选中的音低八度: {
        readonly en: "Selected notes down an octave";
    };
    readonly 光标前那个音往上一级: {
        readonly en: "Note before the cursor up a scale step";
    };
    readonly 选中的音往上一级: {
        readonly en: "Selected notes up a scale step";
    };
    readonly 光标前那个音往下一级: {
        readonly en: "Note before the cursor down a scale step";
    };
    readonly 选中的音往下一级: {
        readonly en: "Selected notes down a scale step";
    };
    readonly "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5347\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF1AC \u5927\u8C03 E \u2192 F\uFF09": {
        readonly en: "Note before the cursor up a semitone (spelled by key: in C major, E → F)";
    };
    readonly "\u9009\u4E2D\u7684\u97F3\u6574\u4F53\u5347\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09": {
        readonly en: "Selected notes up a semitone (spelled by key)";
    };
    readonly "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u964D\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09": {
        readonly en: "Note before the cursor down a semitone (spelled by key)";
    };
    readonly "\u9009\u4E2D\u7684\u97F3\u6574\u4F53\u964D\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09": {
        readonly en: "Selected notes down a semitone (spelled by key)";
    };
    readonly 光标与选中: {
        readonly en: "Cursor and selection";
    };
    readonly 光标左移: {
        readonly en: "Cursor left";
    };
    readonly "\u6536\u6210\u9009\u4E2D\u5DE6\u8FB9\u7684\u5149\u6807\uFF08\u56DE\u5230\u5199\uFF09": {
        readonly en: "Collapse to a cursor left of the selection (back to writing)";
    };
    readonly 光标右移: {
        readonly en: "Cursor right";
    };
    readonly "\u6536\u6210\u9009\u4E2D\u53F3\u8FB9\u7684\u5149\u6807\uFF08\u56DE\u5230\u5199\uFF09": {
        readonly en: "Collapse to a cursor right of the selection (back to writing)";
    };
    readonly "\u9009\u4E2D\u5149\u6807\u524D\u90A3\u4E2A\uFF08\u5199 \u2192 \u6539\uFF09": {
        readonly en: "Select the item before the cursor (write → edit)";
    };
    readonly 选中往左扩一个: {
        readonly en: "Extend selection left by one";
    };
    readonly "\u9009\u4E2D\u5149\u6807\u540E\u90A3\u4E2A\uFF08\u5199 \u2192 \u6539\uFF09": {
        readonly en: "Select the item after the cursor (write → edit)";
    };
    readonly 选中往右扩一个: {
        readonly en: "Extend selection right by one";
    };
    readonly "\u4ECE\u5149\u6807\u9009\u5230\u5F00\u5934\uFF08\u5199 \u2192 \u6539\uFF09": {
        readonly en: "Select from the cursor to the start (write → edit)";
    };
    readonly 选到开头: {
        readonly en: "Select to the start";
    };
    readonly "\u4ECE\u5149\u6807\u9009\u5230\u672B\u5C3E\uFF08Home \u518D Shift+End = \u5168\u9009\uFF09": {
        readonly en: "Select from the cursor to the end (Home, then Shift+End = select all)";
    };
    readonly 选到末尾: {
        readonly en: "Select to the end";
    };
    readonly 光标到开头: {
        readonly en: "Cursor to the start";
    };
    readonly 光标到末尾: {
        readonly en: "Cursor to the end";
    };
    readonly "\u6536\u8D77\uFF0C\u4E0D\u8D34\u6846\u91CC\u7684\u5B57": {
        readonly en: "Close without pasting the box's text";
    };
    readonly "\u6536\u8D77\uFF0C\u4E0D\u6539\uFF08\u521A\u63D2\u7684\u8BB0\u53F7 = \u64A4\u6389\uFF09": {
        readonly en: "Close without changing (a mark just inserted = removed)";
    };
    readonly 关掉面板: {
        readonly en: "Close the panel";
    };
    readonly "\u64A4\u56DE\u672C\u6B21\u8F93\u5165\u7684\u6700\u540E\u4E00\u7B14\uFF08\u300C\u2212\u300D\u3001\u97F3\uFF09\uFF1B\u632A\u8FC7\u5149\u6807\u540E = \u5220\u5149\u6807\u524D\u4E00\u4E2A": {
        readonly en: "Take back the last stroke of this input (“−”, a note); after moving the cursor = delete the item before it";
    };
    readonly 删掉选中: {
        readonly en: "Delete the selection";
    };
    readonly "\u6846\u662F\u7A7A\u7684\uFF1A\u56DE\u5230\u4E0A\u4E00\u4E2A\u97F3\uFF0C\u628A\u5B83\u7684\u5B57\u62FF\u51FA\u6765\u63A5\u7740\u5220": {
        readonly en: "Empty box: back to the previous note, its text comes out to keep deleting";
    };
    readonly 删光标后一个: {
        readonly en: "Delete the item after the cursor";
    };
    readonly "\u5C0F\u6708\u76F8\u5531 / \u505C": {
        readonly en: "Tsukuyomi-chan sing / stop";
    };
    readonly "\u300C\u5F39\u300D\u5F00 / \u5173\uFF08\u97F3\u7B26\u952E\u53EA\u5531\u4E0D\u5199\uFF09": {
        readonly en: "“Jam” on / off (note keys sound without writing)";
    };
    readonly "\u300C\u5F39\u300D\u5F00 / \u5173": {
        readonly en: "“Jam” on / off";
    };
    readonly "\u300C\u5F39\u300D\u5173": {
        readonly en: "“Jam” off";
    };
    readonly 文件: {
        readonly en: "File";
    };
    readonly "\u5B58\uFF08\u5B58\u56DE\u6253\u5F00\u7684\u90A3\u4E2A\u6587\u4EF6\uFF1B\u8FD8\u6CA1\u6709\u5BB6 = \u95EE\u5B58\u5230\u54EA / iPad \u4E0B\u8F7D\uFF09": {
        readonly en: "Save (back to the opened file; no home yet = asks where / downloads on iPad)";
    };
    readonly "\u5BFC\u51FA\u2026\uFF08\u6B4C\u58F0 mp3 / \u5B58\u4E00\u4EFD .mxl \u526F\u672C\uFF1B\u539F\u6765\u7684\u300C\u53E6\u5B58\u4E3A\u300D\u4F4F\u8FD9\u91CC\uFF09": {
        readonly en: "Export… (MP3 / an .mxl copy; what used to be “Save as”)";
    };
    readonly "\u6253\u5F00\u2026\uFF08.mxl / .musicxml\uFF09": {
        readonly en: "Open… (.mxl / .musicxml)";
    };
    readonly "\u6253\u5F00\u2026": {
        readonly en: "Open…";
    };
    readonly 选区: {
        readonly en: "Selection";
    };
    readonly "\u590D\u5236\u9009\u4E2D\uFF08app \u5185\u539F\u6837 + \u7CFB\u7EDF\u526A\u8D34\u677F\u4E00\u884C\u7B80\u8C31\uFF09": {
        readonly en: "Copy selection (as is in the app + one line of jianpu on the system clipboard)";
    };
    readonly 剪切选中: {
        readonly en: "Cut selection";
    };
    readonly "\u8D34\u5728\u5149\u6807\u5904\uFF08app \u5185\u590D\u5236\u8FC7\u7684\uFF1B\u6CA1\u6709\u5C31\u8BD5\u7740\u8BFB\u7CFB\u7EDF\u526A\u8D34\u677F\u91CC\u7684\u7B80\u8C31\u6587\u5B57\uFF09": {
        readonly en: "Paste at the cursor (copied in the app; otherwise tries jianpu text on the system clipboard)";
    };
    readonly "\u8D34 = \u66FF\u6362\u9009\u4E2D": {
        readonly en: "Paste = replace selection";
    };
    readonly "\u5168\u9009\uFF08\u8FD9\u5F20\u7EB8\u4E0A\u8FD9\u4E2A\u58F0\u90E8\uFF09": {
        readonly en: "Select all (this part on this sheet)";
    };
    readonly "\u64A4\u9500\u4E0A\u4E00\u6B65\uFF08\u62D6 / \u8FDE\u6253\u6B4C\u8BCD\u7B97\u4E00\u6B65\uFF09": {
        readonly en: "Undo the last step (a drag / a run of lyric typing counts as one)";
    };
    readonly 歌词框: {
        readonly en: "Lyric box";
    };
    readonly "\u7A7A\u683C / Tab": {
        readonly en: "Space / Tab";
    };
    readonly "\u8FD9\u4E2A\u8BCD\u5B8C\u4E86\uFF1A\u8D34\u4E0A\u3001\u8DF3\u4E0B\u4E00\u4E2A\u97F3\uFF08\u6846\u662F\u7A7A\u7684 = \u53EA\u8DF3\uFF09": {
        readonly en: "This word is done: paste and jump to the next note (empty box = just jump)";
    };
    readonly 回上一个音: {
        readonly en: "Back to the previous note";
    };
    readonly "\u8DDF\u5728\u5B57\u6BCD\u540E\u9762\uFF1A\u97F3\u8282\u5B8C\u4E86\u3001\u8BCD\u6CA1\u5B8C\uFF08\u8C31\u4E0A\u753B\u8FDE\u5B57\u7B26\uFF09\uFF0C\u8DF3\u4E0B\u4E00\u4E2A\u97F3": {
        readonly en: "After a letter: syllable done, word not done (a hyphen on the score), jump to the next note";
    };
    readonly "\u8D34\u4E0A\u3001\u6536\u8D77": {
        readonly en: "Paste and close";
    };
    readonly 记号框: {
        readonly en: "Mark box";
    };
    readonly "\u6309\u6846\u91CC\u7684\u5B57\u6539\uFF081=D / Bb / 2# \u00B7 3/4 \u00B7 90 \u6216 Andante\uFF09\u3001\u6536\u8D77": {
        readonly en: "Apply the box's text (1=D / Bb / 2# · 3/4 · 90 or Andante) and close";
    };
    readonly 空格: {
        readonly en: "Space";
    };
    readonly "\u5C0F\u952E\u76D8 Enter": {
        readonly en: "Numpad Enter";
    };
    readonly 退格: {
        readonly en: "Backspace";
    };
    readonly "\u5C0F\u952E\u76D8 -": {
        readonly en: "Numpad -";
    };
    readonly "\u5C0F\u952E\u76D8 *": {
        readonly en: "Numpad *";
    };
    readonly "\u5C0F\u952E\u76D8 /": {
        readonly en: "Numpad /";
    };
    readonly "\u9762\u677F\uFF08\u5BFC\u51FA\u597D\u4E86\uFF09": {
        readonly en: "Panel (export done)";
    };
    readonly "\u6F14\u594F\u6CD5##\u9875\u7B7E": {
        readonly en: "Artic.";
    };
    readonly "\u529B\u5EA6##\u9875\u7B7E": {
        readonly en: "Dyn.";
    };
    readonly 记号: {
        readonly en: "Marks";
    };
    readonly "\u5F3A\u5EA6\uFF08\u5E7D\u7075\u97F3 / \u5F31\u5316 / \u6B21\u91CD\u97F3 / \u91CD\u97F3 / \u5F3A\u97F3 / \u7A81\u5F3A / \u5F3A\u540E\u5373\u5F31\uFF09\u3001\u4FDD\u6301 / \u8DF3\u97F3 / \u8FDE\u7EBF / \u547C\u5438\uFF08\u9759\u9ED8 / \u8F7B\u5438 / \u6DF1\u5438\uFF09\u3001\u6C14\u58F0": {
        readonly en: "Strength (ghost / unstressed / stress / accent / marcato / sfz / fp), tenuto / staccato / slur / breath (silent / soft / deep), whisper";
    };
    readonly "ppp\u2026fff\u3001\u6E10\u5F3A / \u6E10\u5F31\u3001\u6E10\u5230\u3001\u97F3\u5185\u8D77\u4F0F": {
        readonly en: "ppp…fff, crescendo / diminuendo, ramp, swells";
    };
    readonly "\u8C03\u53F7 / \u62CD\u53F7 / \u8C31\u53F7 / \u516B\u5EA6\u7EBF / \u901F\u5EA6\u3001\u98CE\u683C\uFF08\u62CD\u5B50\u8F7B\u91CD\uFF09\u3001\u53CD\u590D\u3001\u8E0F\u677F": {
        readonly en: "Key / time / clef / octave lines / tempo, style (beat weights), repeats, pedals";
    };
    readonly 三十二分: {
        readonly en: "Thirty-second";
    };
    readonly 十六分: {
        readonly en: "Sixteenth";
    };
    readonly 八分: {
        readonly en: "Eighth";
    };
    readonly 四分: {
        readonly en: "Quarter";
    };
    readonly 二分: {
        readonly en: "Half";
    };
    readonly 全音符: {
        readonly en: "Whole";
    };
    readonly "{n} \u8FDE\u97F3": {
        readonly en: "{n}-tuplet";
    };
    readonly "\u5149\u6807\u5DE6\u79FB\uFF08{p}\uFF09": {
        readonly en: "Cursor left ({p})";
    };
    readonly "\u5149\u6807\u53F3\u79FB\uFF08{p}\uFF09": {
        readonly en: "Cursor right ({p})";
    };
    readonly "\u4F11\u6B62\uFF08{p}\uFF09": {
        readonly en: "Rest ({p})";
    };
    readonly "\u5C0F\u8282\u7EBF\uFF08{p}\uFF09": {
        readonly en: "Barline ({p})";
    };
    readonly "\u547C\u5438\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u540E\u9762\u6362\u4E00\u53E3\u6C14\uFF08\u5C0F\u6708\u76F8\u5531\u5230\u8FD9\u513F\u6362\u6C14\uFF1B\u4E50\u5668\u5728\u8FD9\u513F\u7A0D\u5FAE\u65AD\u5F00\uFF1B\u8FDE\u7EBF\u8FDE\u7740\u4E5F\u7167\u6837\u65AD\u5F00\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389\uFF09": {
        readonly en: "Breath: a breath after the note before the cursor (Tsukuyomi-chan breathes here; instruments separate slightly; it separates even under a slur; tap again to remove)";
    };
    readonly "\u5347\u964D\uFF08\u548C Shift \u4E00\u6837\uFF09\uFF1A\u70B9\u4E00\u4E0B = \u4E0B\u4E00\u4E2A\u97F3\uFF1B\u8FDE\u70B9\u4E24\u4E0B = \u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00\uFF1B\u6309\u4F4F\u5199 = \u6309\u4F4F\u671F\u95F4\u3002\u5728\u952E\u4E0A\u4E0A\u4E0B\u6ED1\u6362 \uD834\uDD2A / \u266F / \u266D / \uD834\uDD2B": {
        readonly en: "Accidental (like Shift): tap = next note; double-tap = lock, tap again = unlock; hold while writing = while held. Slide up / down on the key to change 𝄪 / ♯ / ♭ / 𝄫";
    };
    readonly 升降: {
        readonly en: "Acc.";
    };
    readonly "\u53E0\uFF08\u50CF Caps Lock\uFF09\uFF1A\u6309\u4E00\u4E0B = \u9009\u4E2D\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u6765\u6539\u2014\u2014\u6309\u97F3\u952E\u53E0\u4E0A / \u62FF\u6389\uFF08\u6700\u540E\u4E00\u4E2A\u62FF\u6389 = \u4E00\u6837\u957F\u7684\u4F11\u6B62\uFF0C\u4F11\u6B62\u4E0A\u6309 = \u53D8\u56DE\u97F3\uFF09\u3001\u2014 \u957F\u4E00\u6B65\u3001\u232B \u77ED\u4E00\u6B65\u3001\u2190 \u2192 \u6362\u524D\u540E\u7684\u97F3\uFF1B\u518D\u6309\u4E00\u4E0B = \u56DE\u5230\u5B83\u540E\u9762\u63A5\u7740\u5199\u3002\u5355\u58F0\u4E50\u5668\u7684\u58F0\u90E8\u53E0\u4E0D\u4E86": {
        readonly en: "Stack (like Caps Lock): press = select the note before the cursor to edit it — note keys add / remove (removing the last = a rest of the same length; on a rest = back to a note), — one step longer, ⌫ one step shorter, ← → to neighbors; press again = back after it to keep writing. Monophonic parts can't stack";
    };
    readonly 叠音: {
        readonly en: "Stack";
    };
    readonly "\u51CF\u534A\uFF08\u957F\u77ED\u57FA\u7EBF\u77ED\u4E00\u6863\uFF09\uFF1A\u70B9\u4E00\u4E0B = \u4E0B\u4E00\u4E2A\u97F3\uFF1B\u8FDE\u70B9\u4E24\u4E0B = \u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00\uFF1B\u4E5F\u53EF\u4EE5\u6309\u4F4F\u5199": {
        readonly en: "Halve (one notch shorter): tap = next note; double-tap = lock, tap again = unlock; or hold while writing";
    };
    readonly 减半: {
        readonly en: "Halve";
    };
    readonly "\u62C9\u957F\u4E00\u4EFD\uFF08{p}\uFF09": {
        readonly en: "Extend by one unit ({p})";
    };
    readonly 拉长: {
        readonly en: "Extend";
    };
    readonly "\u9000\u683C\uFF08{p}\uFF09": {
        readonly en: "Backspace ({p})";
    };
    readonly "\u25BE \u8FD8\u6709 {n} \u4E2A": {
        readonly en: "▾ {n} more";
    };
    readonly 返回: {
        readonly en: "Back";
    };
    readonly 自动小节线: {
        readonly en: "Auto barlines";
    };
    readonly "\u6309\u62CD\u53F7\u81EA\u52A8\u753B\u5C0F\u8282\u7EBF\uFF08\u53EA\u753B\u3001\u4E0D\u8FDB\u6570\u636E\uFF09\uFF1B\u624B\u63D2\u7684\u300C|\u300D= \u4ECE\u90A3\u91CC\u91CD\u65B0\u6570\uFF0C\u5F31\u8D77 = \u5199\u5B8C\u5F31\u8D77\u7684\u97F3\u6309\u4E00\u4E0B\u300C|\u300D": {
        readonly en: "Draws barlines from the time signature (display only, not in the data); a hand-inserted “|” recounts from there; for a pickup, write its notes and press “|”";
    };
    readonly 换谱表: {
        readonly en: "Change staff";
    };
    readonly "\u5927\u8C31\u8868\uFF1A\u521A\u5199\u7684\u97F3\uFF08\u6216\u9009\u4E2D\u7684\uFF09\u632A\u5230\u53E6\u4E00\u5F20\u8C31\u8868\uFF1B\u518D\u6309\u4E00\u6B21\u56DE\u5230\u6309\u97F3\u9AD8\u81EA\u52A8\u5206": {
        readonly en: "Grand staff: moves the note just written (or the selection) to the other staff; press again = back to auto by pitch";
    };
    readonly "\u5E03\u5C40\u2026": {
        readonly en: "Layout…";
    };
    readonly "\u51E0\u884C\u51E0\u5217\u3001\u9996\u8C03 / \u7EDD\u5BF9": {
        readonly en: "Rows and columns, movable / fixed do";
    };
    readonly 渐到: {
        readonly en: "Ramp";
    };
    readonly "\u6362\u56DE\u97F3\u952E\uFF08\u5199\u97F3 / \u4F11\u6B62 / \u5C0F\u8282\u7EBF\uFF09": {
        readonly en: "Back to note keys (notes / rests / barlines)";
    };
    readonly "\u5F39\uFF1A\u97F3\u952E\u53EA\u54CD\u4E0D\u5199\uFF08\u5FEB\u6377\u952E `\uFF09\uFF1B\u518D\u70B9\u56DE\u5230\u5199": {
        readonly en: "Jam: note keys sound without writing (shortcut `); tap again to return to writing";
    };
    readonly 弹: {
        readonly en: "Jam";
    };
    readonly "\u6536\u8D77\u952E\u76D8\uFF08\u70B9\u4E94\u7EBF\u8C31\u518D\u5F39\u51FA\u6765\uFF09": {
        readonly en: "Hide the keys (tap the staff to bring them back)";
    };
    readonly 收起: {
        readonly en: "Hide";
    };
    readonly "\u66F4\u591A\uFF1A\u5E03\u5C40\u3001\u63D2\u8BB0\u53F7": {
        readonly en: "More: layout, insert marks";
    };
    readonly "\u97F3\u57DF\uFF08\u8FD9\u5757 pad \u4ECE\u54EA\u4E2A\u97F3\u5230\u54EA\u4E2A\u97F3\uFF09\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\u2014\u2014\u50CF\u63A8\u4E00\u5F20\u7EB8\uFF0C\u5F80\u4E0A\u63A8 = \u770B\u4E0B\u9762\u66F4\u4F4E\u7684": {
        readonly en: "Range (the pad's lowest to highest note): hold and slide up / down, or tap to choose — like pushing a sheet of paper: pushing up shows lower notes";
    };
    readonly "\u957F\u77ED\u57FA\u7EBF\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\uFF08\u542B\u8FDE\u97F3\uFF09": {
        readonly en: "Note length: hold and slide up / down, or tap to choose (tuplets included)";
    };
    readonly "1=\uFF08pad \u81EA\u5DF1\u7684\u8C03\uFF09\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\uFF08\u4E94\u5EA6\u5708\uFF09": {
        readonly en: "1= (the pad's own key): hold and slide up / down, or tap to choose (circle of fifths)";
    };
    readonly "\u6362\u6210\u7B26\u53F7\u683C\uFF08\u529B\u5EA6\u3001\u6E10\u5F3A\u6E10\u5F31\u3001\u6F14\u594F\u6CD5\u3001\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\u3001\u53CD\u590D\u3001\u98CE\u683C\u3001\u53E5\u53F7\uFF09\u2014\u2014\u8C31\u4E0A\u97F3\u548C\u8BB0\u53F7\u672C\u6765\u5C31\u4E00\u8D77\u6539\uFF0C\u8FD9\u91CC\u53EA\u6362\u952E\u76D8": {
        readonly en: "Switch to the symbol grid (dynamics, hairpins, articulations, key / time / tempo, repeats, style, phrase end) — notes and marks are edited together on the score anyway; this only switches the keys";
    };
    readonly "\u5C11\u4E00{name}": {
        readonly en: "One fewer {name}";
    };
    readonly "\u591A\u4E00{name}": {
        readonly en: "One more {name}";
    };
    readonly 行: {
        readonly en: "Rows";
    };
    readonly 自动: {
        readonly en: "Auto";
    };
    readonly 按屏幕高度自动定几行: {
        readonly en: "Sets the row count from the screen height";
    };
    readonly "\u952E\u76D8\u51E0\u884C\uFF08\u9AD8\u5EA6\uFF09": {
        readonly en: "Key rows (height)";
    };
    readonly 列: {
        readonly en: "Columns";
    };
    readonly 键盘几列: {
        readonly en: "Key columns";
    };
    readonly 键位: {
        readonly en: "Key layout";
    };
    readonly 首调: {
        readonly en: "Movable do";
    };
    readonly "\u6BCF\u884C\u4ECE 1 \u8D77\uFF0C\u8DDF\u7740\u300C1=\u300D\u8D70": {
        readonly en: "Each row starts at 1, following “1=”";
    };
    readonly 绝对: {
        readonly en: "Fixed";
    };
    readonly "\u6BCF\u884C\u4ECE C \u8D77\uFF08\u4E0D\u8DDF\u7740\u300C1=\u300D\u632A\uFF09": {
        readonly en: "Each row starts at C (doesn't follow “1=”)";
    };
    readonly 滑: {
        readonly en: "Slide";
    };
    readonly 滚键盘: {
        readonly en: "Glide";
    };
    readonly "\u624B\u6307\u6309\u7740\u6ED1\u5230\u4E0B\u4E00\u4E2A\u952E = \u54CD\u4E0B\u4E00\u4E2A\uFF08\u5199\u7684\u65F6\u5019\u4E00\u8DEF\u5199\uFF09": {
        readonly en: "Sliding your finger to the next key sounds that key (writes along the way while writing)";
    };
    readonly "\u5728\u97F3\u952E\u4E0A\u4E0A\u4E0B\u6ED1 = \u8FD9\u4E00\u4E2A\u97F3\u5347 / \u964D\uFF08\u9ECF\u7740\uFF09": {
        readonly en: "Sliding up / down on a note key bends just this note up / down (sticky)";
    };
    readonly 键盘布局: {
        readonly en: "Keyboard layout";
    };
    readonly "\uFF08\u53F0\u4E0A\u8FD9\u4F4D\u4E0D\u8BA4\uFF1A\u5199\u5728\u8C31\u4E0A\u753B\u7070\uFF0C\u51FA\u58F0\u4E0D\u53D7\u5F71\u54CD\uFF09": {
        readonly en: " (the performer on stage ignores this: drawn gray on the score, sound unaffected)";
    };
    readonly 琶音: {
        readonly en: "Arpeggio";
    };
    readonly "\u7436\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u548C\u5F26\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u4ECE\u4F4E\u5230\u9AD8\u4F9D\u6B21\u594F\u51FA\uFF08\u548C\u5F26\u5DE6\u8FB9\u4E00\u6761\u6CE2\u6D6A\u7EBF\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": {
        readonly en: "Arpeggio: rolls the chord before the cursor (or the selection) low to high (a wavy line left of the chord); tap again to remove";
    };
    readonly "\u6EDA\u594F\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u6574\u4E2A\u97F3\u6572\u6EE1\uFF08\u7B26\u5E72\u4E0A\u4E09\u9053\u659C\u7EBF\uFF09\uFF1B\u591A\u5BC6\u5728\u4E50\u5668\u9875\u8C03\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": {
        readonly en: "Roll: the note before the cursor (or the selection) is filled with rapid hits (three slashes on the stem); set how fast on the instrument page; tap again to remove";
    };
    readonly "\u8DF3\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u5531 / \u5F39\u5F97\u77ED\u4FC3\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": {
        readonly en: "Staccato: the note before the cursor (or the selection) sung / played short; tap again to remove";
    };
    readonly "\u5E7D\u7075\u97F3\uFF08\u62EC\u53F7\u7B26\u5934\uFF09\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u5F88\u8F7B\u3001\u51E0\u4E4E\u542C\u4E0D\u89C1\uFF1B\u97F3\u7684\u5F3A\u5EA6\u53EA\u6709\u4E00\u79CD\uFF1A\u548C\u5F31\u5316 / \u6B21\u91CD\u97F3 / \u91CD\u97F3 / \u5F3A\u97F3 / \u7A81\u5F3A / \u5F3A\u540E\u5373\u5F31\u4E92\u65A5": {
        readonly en: "Ghost note (parenthesized notehead): the note before the cursor (or the selection) is very soft, almost inaudible; a note has one strength: excludes unstressed / stress / accent / marcato / sfz / fp";
    };
    readonly "\u5F31\u5316\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u8F7B\u4E00\u70B9\uFF1B\u548C\u522B\u7684\u5F3A\u5EA6\u4E92\u65A5": {
        readonly en: "Unstressed: the note before the cursor (or the selection) a little lighter; excludes other strengths";
    };
    readonly "\u6B21\u91CD\u97F3\uFF1A\u6BD4\u91CD\u97F3\u8F7B\u7684\u91CD\u97F3\uFF08\u56DB\u62CD\u5B50\u300C\u5F3A\u5F31\u6B21\u5F3A\u5F31\u300D\u7684\u6B21\u5F3A\uFF09\uFF1B\u548C\u522B\u7684\u5F3A\u5EA6\u4E92\u65A5": {
        readonly en: "Stress: lighter than an accent (the secondary beat in 4/4's strong-weak-medium-weak); excludes other strengths";
    };
    readonly "\u91CD\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u52A0\u91CD\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": {
        readonly en: "Accent: the note before the cursor (or the selection) heavier; tap again to remove";
    };
    readonly "\u5F3A\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u6BD4\u91CD\u97F3\u66F4\u91CD\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": {
        readonly en: "Marcato: the note before the cursor (or the selection) heavier than an accent; tap again to remove";
    };
    readonly 突强: {
        readonly en: "Sforzando";
    };
    readonly "\u7A81\u5F3A sfz\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u97F3\u5934\u731B\u5730\u51B2\u4E00\u4E0B\u518D\u843D\u56DE\u6765\uFF1B\u548C\u91CD\u97F3 / \u5F3A\u97F3 / fp \u4E92\u65A5": {
        readonly en: "Sforzando sfz: the note before the cursor (or the selection) jolts at the attack and falls back; excludes accent / marcato / fp";
    };
    readonly 强后即弱: {
        readonly en: "Forte-piano";
    };
    readonly "\u5F3A\u540E\u5373\u5F31 fp\uFF1A\u97F3\u5934 f\uFF0C\u9A6C\u4E0A\u843D\u5230 p\uFF0C\u4E4B\u540E\u7684\u97F3\u90FD\u662F p\uFF1B\u548C\u91CD\u97F3 / \u5F3A\u97F3 / sfz \u4E92\u65A5": {
        readonly en: "Forte-piano fp: attacks at f, falls right to p, and later notes stay p; excludes accent / marcato / sfz";
    };
    readonly "\u4FDD\u6301\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u5531 / \u5F39\u6EE1\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": {
        readonly en: "Tenuto: the note before the cursor (or the selection) sung / played in full; tap again to remove";
    };
    readonly "\u6E10\u5F3A <\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\uFF09\u8D77\uFF0C\u4E00\u8DEF\u6E10\u5F3A\u5230\u8FD9\u5F20\u7EB8\u91CC\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1B\u6CA1\u5199 = \u8D70\u4E00\u6863\uFF08\u8C31\u4E0A\u7070\u5B57\u6807\u51FA\u63A8\u5B9A\u7684\u7EC8\u70B9\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": {
        readonly en: "Crescendo <: from the note before the cursor (or the selection's first note), grows up to the next dynamic on this sheet; none = one step (the inferred endpoint shows in gray on the score); tap again to remove";
    };
    readonly "\u6E10\u5F31 >\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\uFF09\u8D77\uFF0C\u4E00\u8DEF\u6E10\u5F31\u5230\u8FD9\u5F20\u7EB8\u91CC\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1B\u6CA1\u5199 = \u8D70\u4E00\u6863\uFF08\u8C31\u4E0A\u7070\u5B57\u6807\u51FA\u63A8\u5B9A\u7684\u7EC8\u70B9\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": {
        readonly en: "Diminuendo >: from the note before the cursor (or the selection's first note), falls to the next dynamic on this sheet; none = one step (the inferred endpoint shows in gray on the score); tap again to remove";
    };
    readonly 力度: {
        readonly en: "Dynamics";
    };
    readonly "\u529B\u5EA6 {d}\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\uFF08\u6709\u9009\u533A = \u9009\u533A\u5F00\u5934\uFF09\uFF0C\u7BA1\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1B\u90A3\u513F\u5DF2\u7ECF\u662F\u5B83 = \u53BB\u6389": {
        readonly en: "Dynamic {d}: from the note before the cursor (or the selection's start) until the next dynamic; already that = removed";
    };
    readonly "\u6E10\u5230\uFF1A\u70B9\u4E00\u4E0B = \u4E0B\u4E00\u4E2A\u529B\u5EA6\u4ECE\u8FD9\u5F20\u7EB8\u91CC\u4E0A\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u90A3\u513F\u4E00\u8DEF\u6E10\u53D8\u8FC7\u6765\uFF08\u8C31\u4E0A\u753B\u865A\u7EBF\u53D1\u5939\uFF1B\u624B\u5199\u7684\u6E10\u5F3A\u6E10\u5F31\u662F\u5B9E\u7EBF\uFF09\uFF1B\u8FDE\u70B9\u4E24\u4E0B = \u9501\u4F4F\uFF0C\u4E4B\u540E\u5199\u7684\u529B\u5EA6\u90FD\u662F\u6E10\u5230\uFF1B\u518D\u70B9 = \u5173\u3002\u4E0D\u5F00 = \u5230\u90A3\u513F\u7A81\u53D8": {
        readonly en: "Ramp: tap = the next dynamic ramps from the previous one on this sheet (dashed hairpin on the score; handwritten hairpins are solid); double-tap = lock, every dynamic written is a ramp; tap again = off. Off = changes suddenly there";
    };
    readonly 音内渐强: {
        readonly en: "Swell up";
    };
    readonly 音内鼓起: {
        readonly en: "Swell";
    };
    readonly "{p}\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u81EA\u5DF1\u91CC\u9762\u7684\u8D77\u4F0F\uFF1B\u548C\u6BB5\u843D\u7684\u6E10\u5F3A\u6E10\u5F31\u662F\u4E24\u5C42\uFF0C\u53EF\u4EE5\u53E0\uFF1B\u518D\u70B9 = \u53BB\u6389": {
        readonly en: "{p}: a swell inside the note before the cursor (or the selection); a separate layer from phrase hairpins, they can stack; tap again = remove";
    };
    readonly "\u97F3\u5185\u6E10\u5F31\uFF08\u952F\u9F7F\uFF09": {
        readonly en: "Swell down (sawtooth)";
    };
    readonly "\u97F3\u5185\u9F13\u8D77\uFF08messa di voce\uFF09": {
        readonly en: "Swell (messa di voce)";
    };
    readonly "\u8FDE\u7EBF\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8FDE\u5230\u4E0B\u4E00\u4E2A\u97F3\uFF08\u8FDE\u594F\u3001\u4E0D\u7559\u7F1D\uFF1B\u6709\u9009\u533A = \u9009\u4E2D\u7684\u8FDE\u8D77\u6765\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389\uFF09\u3002\u540C\u4E00\u4E2A\u97F3\u4E0A\u53C8\u6709\u547C\u5438 = \u547C\u5438\u7B97\u6570\uFF1A\u90A3\u91CC\u7167\u6837\u65AD\u5F00\u6362\u6C14\uFF0C\u8FDE\u7EBF\u7167\u753B": {
        readonly en: "Slur: connects the note before the cursor to the next (legato, no gap; with a selection = connects it; tap again to remove). A breath on the same note wins: it still separates and breathes there, and the slur is still drawn";
    };
    readonly "\u5438##\u8BB0\u53F7": {
        readonly en: "in";
    };
    readonly 轻吸: {
        readonly en: "Soft inhale";
    };
    readonly "\u51FA\u58F0\u7684\u6362\u6C14\uFF08\u8F7B\u5438\uFF09\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u540E\u9762\u6362\u6C14\u3001\u542C\u5F97\u89C1\u5438\u6C14\u58F0\uFF08\u6CA1\u6709\u547C\u5438\u8BB0\u53F7\u5C31\u8FDE\u9017\u53F7\u4E00\u8D77\u52A0\u4E0A\uFF1B\u518D\u70B9\u4E00\u6B21 = \u6574\u4E2A\u53BB\u6389\uFF09\u3002\u53EA\u6709\u70B9\u4E86\u7684\u5730\u65B9\u624D\u51FA\u58F0\uFF0C\u666E\u901A\u7684\u547C\u5438\u8BB0\u53F7\u7167\u65E7\u9759\u9ED8": {
        readonly en: "Audible breath (soft): breathes after the note before the cursor with an audible inhale (adds the comma if there's no breath mark; tap again = removes it all). Only tapped spots make a sound; plain breath marks stay silent";
    };
    readonly "\u6DF1\u5438##\u8BB0\u53F7": {
        readonly en: "deep in";
    };
    readonly 深吸: {
        readonly en: "Deep inhale";
    };
    readonly "\u51FA\u58F0\u7684\u6362\u6C14\uFF08\u6DF1\u5438\uFF09\uFF1A\u5927\u53E3\u5438\u6C14\u3001\u6362\u6C14\u7684\u7A7A\u5F53\u4E5F\u957F\u4E00\u70B9\uFF08\u4ECE\u524D\u4E00\u4E2A\u97F3\u672B\u5C3E\u501F\u65F6\u95F4\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21 = \u6574\u4E2A\u53BB\u6389": {
        readonly en: "Audible breath (deep): a big inhale with a slightly longer gap (borrowed from the end of the previous note); tap again = removes it all";
    };
    readonly 气声: {
        readonly en: "Whisper";
    };
    readonly "\u6C14\u58F0\uFF08\u00D7 \u7B26\u5934\uFF09\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u4E0D\u5531\u97F3\u9AD8\u3001\u7528\u6C14\u58F0\u5531\u8FD9\u4E2A\u5B57\uFF08\u5FF5\u767D / \u8033\u8BED\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389\u3002\u53EA\u6709\u5C0F\u6708\u76F8\u505A\u5F97\u5230\uFF0C\u4E50\u5668\u4E0A\u753B\u7070": {
        readonly en: "Whisper (× notehead): the note before the cursor (or the selection) has no sung pitch, breathing this syllable (speech / whisper); tap again to remove. Only Tsukuyomi-chan can do it; grayed out on instruments";
    };
    readonly "\u63D2\u8C03\u53F7\uFF08\u5728\u5149\u6807\u5904\uFF1B\u5148\u586B\u73B0\u5728\u7684\uFF0C\u63D2\u4E86\u518D\u6539\uFF09": {
        readonly en: "Insert key signature (at the cursor; starts with the current one, edit after inserting)";
    };
    readonly "\u63D2\u62CD\u53F7\uFF08\u5728\u5149\u6807\u5904\uFF09": {
        readonly en: "Insert time signature (at the cursor)";
    };
    readonly "\u901F\u5EA6##\u8C31": {
        readonly en: "Tempo";
    };
    readonly "\u63D2\u901F\u5EA6\uFF08\u5728\u5149\u6807\u5904\uFF09": {
        readonly en: "Insert tempo (at the cursor)";
    };
    readonly "\u8C31\u53F7\uFF1A\u4ECE\u5149\u6807\u5904\u8D77\u6362\u8C31\u53F7\uFF08\u9AD8\u97F3 / \u4F4E\u97F3 / \u4E0B\u52A0 8 / \u4E0A\u52A0 8 / \u4E0A\u52A0 15\uFF09\uFF1B\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8\u3002\u6BCF\u884C\u5F00\u5934\u7684\u8C31\u53F7\u4E5F\u80FD\u76F4\u63A5\u70B9": {
        readonly en: "Clef: changes the clef from the cursor (treble / bass / 8 below / 8 above / 15 above); display only, pitch doesn't change. The clef at the start of each line can be tapped too";
    };
    readonly 八度线: {
        readonly en: "Ottava";
    };
    readonly "\u516B\u5EA6\u7EBF\uFF1A\u4ECE\u5149\u6807\u5904\u8D77\u8C31\u4E0A\u753B\u4F4E\uFF088va / 15ma\uFF09\u6216\u753B\u9AD8\uFF088vb\uFF09\uFF1B\u6709\u9009\u533A = \u8FD9\u4E00\u6BB5\uFF1B\u300C\u7ED3\u675F\u300D= \u5230\u8FD9\u513F\u6536\u3002\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8": {
        readonly en: "Ottava line: from the cursor, drawn lower (8va / 15ma) or higher (8vb); with a selection = this passage; “End” = stops here. Display only, pitch doesn't change";
    };
    readonly 风格: {
        readonly en: "Style";
    };
    readonly 拍子轻重: {
        readonly en: "Beat weighting";
    };
    readonly "\u98CE\u683C\u8BB0\u53F7\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\u5230\u8FD9\u5F20\u7EB8\u7ED3\u5C3E\uFF0C\u6BCF\u4E2A\u97F3\u6309\u5B83\u5728\u5C0F\u8282\u91CC\u7684\u4F4D\u7F6E\u8F7B\u4E00\u70B9 / \u91CD\u4E00\u70B9\uFF08\u53E4\u5178 / \u6D41\u884C / \u534E\u5C14\u5179 / \u8FDB\u884C\u66F2\u2026\u70B9\u5F00\u9009\uFF09\uFF1B\u6574\u5F20\u7EB8\u7684\u58F0\u90E8\u4E00\u8D77\u542C\uFF0C\u5404\u4EBA\u8DDF\u591A\u5C11\u6309\u4E50\u5668": {
        readonly en: "Style mark: from the note before the cursor to the end of the sheet, each note gets lighter / heavier by its place in the bar (classical / pop / waltz / march… tap to choose); all parts on the sheet follow, each by instrument";
    };
    readonly 反复: {
        readonly en: "Repeat";
    };
    readonly "\u8C31\u5185\u53CD\u590D / \u8DF3\u8F6C\uFF1A|: :|\u3001\u623F\u5B50 1. 2.\u3001Segno / Coda / D.C. / D.S. / Fine\u2026\uFF08\u70B9\u5F00\u9009\uFF1B\u63D2\u5728\u5149\u6807\u5904\uFF0C\u6328\u7740\u5C0F\u8282\u7EBF = \u628A\u90A3\u6761\u6539\u6210\u53CD\u590D\u7684\uFF09\u3002\u4E0D\u8DE8\u7EB8\uFF1B\u653E\u7684\u65F6\u5019\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C": {
        readonly en: "Score repeats / jumps: |: :|, endings 1. 2., Segno / Coda / D.C. / D.S. / Fine… (tap to choose; inserted at the cursor, next to a barline = turns it into a repeat). Doesn't cross sheets; playback only looks at this sheet's top part";
    };
    readonly 踏板: {
        readonly en: "Pedal";
    };
    readonly "\u8E0F\u677F\uFF08\u7559\u4E0D\u7559\u4F4F\u97F3\uFF09\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\u8E29\u4E0B / \u62AC\u8D77 / \u6362\u8E0F\u677F\uFF0C\u5B57\u8DDF\u7740\u90A3\u513F\u73B0\u5728\u8E29\u6CA1\u8E29\uFF1B\u6709\u9009\u533A = \u628A\u8FD9\u4E00\u6BB5\u8E29\u4F4F\u3002\u70B9\u8C31\u4E0A\u7684\u8E0F\u677F\u8BB0\u53F7\u80FD\u6539\u3001\u5220\uFF0C\u957F\u6309\u62D6\u80FD\u632A": {
        readonly en: "Pedal (keep notes ringing or not): press / lift / change from the note before the cursor; the choices follow whether the pedal is down there. With a selection = hold that passage. Tap a pedal mark on the score to change or delete it; long-press and drag to move it";
    };
    readonly "\u5927\u8C31\u8868\uFF1A\u8FD9\u4E2A\u97F3\u6362\u5230\u53E6\u4E00\u5F20\u8C31\u8868": {
        readonly en: "Grand staff: move this note to the other staff";
    };
    readonly "{who}\u7684\u97F3\u57DF\u91CC": {
        readonly en: "Within {who}'s range";
    };
    readonly 短一步: {
        readonly en: "Shorter";
    };
    readonly "\u77ED\u4E00\u6B65\uFF08\u9000\u683C\uFF09\uFF1A\u9009\u4E2D\u7684\u8FD9\u4E2A\u97F3\u77ED\u4E00\u6863\uFF0C\u7A7A\u51FA\u6765\u7684\u53D8\u6210\u4F11\u6B62": {
        readonly en: "One step shorter (backspace): the selected note gets one notch shorter, and the freed space becomes a rest";
    };
    readonly 长一步: {
        readonly en: "Longer";
    };
    readonly "{name}\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1\u6362\u8C03 / \u70B9\u5F00\u9009\u8C03\u548C\u8C03\u5F0F": {
        readonly en: "{name}: hold and slide up or down to change key / tap to pick key and mode";
    };
    readonly "\u957F\u77ED\u57FA\u7EBF\uFF1A{p}{tuplet}\u2014\u2014\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009": {
        readonly en: "Note length: {p}{tuplet} — hold and slide up / down, or tap to choose";
    };
    readonly "\uFF08{tuplet} \u8FDE\u97F3\uFF09": {
        readonly en: " ({tuplet}-tuplet)";
    };
    readonly "\u97F3\u57DF {rowShift}\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\u2014\u2014\u50CF\u63A8\u4E00\u5F20\u7EB8\uFF0C\u5F80\u4E0A\u63A8 = \u770B\u4E0B\u9762\u66F4\u4F4E\u7684": {
        readonly en: "Range {rowShift}: hold and slide up / down, or tap to choose — like pushing a sheet of paper: pushing up shows lower notes";
    };
    readonly "pad \u7684\u8C03\uFF08\u4E94\u5EA6\u5708\uFF09": {
        readonly en: "The pad's key (circle of fifths)";
    };
    readonly 长短基线: {
        readonly en: "Note length";
    };
    readonly 音域窗口: {
        readonly en: "Range window";
    };
    readonly 不连: {
        readonly en: "No tuplet";
    };
    readonly 连音: {
        readonly en: "Tuplets";
    };
    readonly "\u8C03\u5F0F\uFF1Apad \u4E0A\u6392\u54EA\u4E9B\u97F3": {
        readonly en: "Mode: which notes the pad lays out";
    };
    readonly " data-def=\"{def}\" title=\"\u53CC\u51FB\u56DE {defText}\"": {
        readonly en: " data-def=\"{def}\" title=\"Double-click: back to {defText}\"";
    };
    readonly "SoundFont \u4E50\u5668": {
        readonly en: "SoundFont instrument";
    };
    readonly "SoundFont \u4E50\u5668\uFF08TinySoundFont \u51FA\u58F0\uFF09": {
        readonly en: "SoundFont instrument (sounds via TinySoundFont)";
    };
    readonly "\u53F0\u4E0A\u7684\u4E0D\u662F SoundFont \u4E50\u5668": {
        readonly en: "The performer on stage isn't a SoundFont instrument";
    };
    readonly "\u529B\u5EA6\u6DF1\u5EA6 = \u5E93\u91CC\u7ED9\u8FD9\u4EF6\u4E50\u5668\u5199\u7684\uFF08\u58F0\u97F3\u8F7D\u597D\u540E\u663E\u793A\uFF09\uFF1B\u54CD\u5EA6 = \u6DF1\u5EA6 \u00F7 960 \u00D7 40\u00B7log10(\u529B\u5EA6 \u00F7 127)\u3002": {
        readonly en: "Velocity depth = what the library sets for this instrument (shown once the sound is loaded); loudness = depth ÷ 960 × 40·log10(velocity ÷ 127). ";
    };
    readonly "\u8FD9\u4EF6\u4E50\u5668\u6309\u591A\u91CD\u90FD\u4E00\u6837\u54CD\uFF08\u5E93\u91CC\u8FD9\u4E48\u5B9A\u7684\uFF1A\u529B\u5EA6\u6DF1\u5EA6 0\uFF09\u3002": {
        readonly en: "This instrument sounds equally loud however hard you play (the library sets it so: velocity depth 0). ";
    };
    readonly "\u529B\u5EA6\u6DF1\u5EA6 {d}\uFF08\u5E93\u91CC\u5199\u7684\uFF1B\u89C4\u8303\u9ED8\u8BA4 960\uFF09\uFF1A\u54CD\u5EA6 = {d} \u00F7 960 \u00D7 40\u00B7log10(\u529B\u5EA6 \u00F7 127)\uFF0C\u6EE1\u529B\u5EA6 127 = 0 dB\uFF0C\u529B\u5EA6\u51CF\u534A = \u8F7B {half} dB\u3002": {
        readonly en: "Velocity depth {d} (set by the library; the SoundFont default is 960): loudness = {d} ÷ 960 × 40·log10(velocity ÷ 127), full velocity 127 = 0 dB, half the velocity = {half} dB quieter. ";
    };
    readonly "\u529B\u5EA6\u6DF1\u5EA6\u6309\u9F13\u4EF6 / \u97F3\u533A\u4E0D\u4E00\u6837\uFF1A{ds}\uFF08\u5E93\u91CC\u5199\u7684\uFF1B\u89C4\u8303\u9ED8\u8BA4 960\uFF09\u3002\u54CD\u5EA6 = \u6DF1\u5EA6 \u00F7 960 \u00D7 40\u00B7log10(\u529B\u5EA6 \u00F7 127)\u3002": {
        readonly en: "Velocity depth differs by drum / key range: {ds} (set by the library; the SoundFont default is 960). Loudness = depth ÷ 960 × 40·log10(velocity ÷ 127). ";
    };
    readonly "\u529B\u5EA6##MIDI": {
        readonly en: "Velocity";
    };
    readonly "\u8F7B\u4E00\u70B9\uFF08MIDI \u529B\u5EA6 \u22128\uFF09": {
        readonly en: "A little softer (MIDI velocity −8)";
    };
    readonly "\u91CD\u4E00\u70B9\uFF08+8\uFF09": {
        readonly en: "A little harder (+8)";
    };
    readonly "\u56DE\u5230 {def}": {
        readonly en: "Back to {def}";
    };
    readonly "\u6CA1\u5199\u529B\u5EA6\u8BB0\u53F7\u7684\u97F3\u6309\u8FD9\u4E2A\u529B\u5EA6\uFF08MIDI 1\u2013127\uFF09\u3002{depth}{dynamicsVel}{L}": {
        readonly en: "Notes without a dynamic use this velocity (MIDI 1–127). {depth}{dynamicsVel}{L}";
    };
    readonly "\u529B\u5EA6\u8BB0\u53F7\u6309\u8FD9\u4F4D\u7684\u529B\u5EA6\u8868\uFF08\u91CD\u97F3 +{accentVel}\u3001\u5F3A\u97F3 +{marcatoVel}\uFF1B\u522B\u7684\u8BB0\u53F7\u89C1\u4E0B\u9762\u300C\u8BB0\u53F7\u600E\u4E48\u6F14\u300D\uFF09\uFF1A{L}": {
        readonly en: "Dynamics follow this performer's velocity table (accent +{accentVel}, marcato +{marcatoVel}; for other marks see “How marks are performed” below): {L}";
    };
    readonly "\u8FD9\u4F4D\u662F\u4E4B\u524D\u4E0A\u573A\u7684\uFF1A\u529B\u5EA6\u8BB0\u53F7\u8FD8\u662F\u53EA\u6539\u97F3\u91CF\uFF1A{p}": {
        readonly en: "This performer came on stage earlier: dynamics still only change volume: {p}";
    };
    readonly "GS \u91CC\u8FD9\u4E2A\u97F3\u8272\u6709 {count} \u4E2A\u529B\u5EA6\u5C42{p}\uFF1A\u8DE8\u5C42 = \u6362\u4E00\u4EFD\u5F55\u97F3\uFF0C\u97F3\u8272\u4F1A\u53D8\uFF0C\u4E0D\u53EA\u662F\u54CD\u5EA6\u3002": {
        readonly en: "This GS sound has {count} velocity layers{p}: crossing a layer = a different recording, so timbre changes, not just loudness.";
    };
    readonly "\uFF0C\u73B0\u5728\u5728\u7B2C {p} \u5C42\uFF08{p2}\u2013{p3}\uFF09": {
        readonly en: ", now on layer {p} ({p2}–{p3})";
    };
    readonly "GS \u91CC\u8FD9\u4E2A\u97F3\u8272\u53EA\u6709\u4E00\u4E2A\u529B\u5EA6\u5C42\uFF1A\u529B\u5EA6\u53EA\u6539\u54CD\u5EA6\u3002": {
        readonly en: "This GS sound has one velocity layer: velocity only changes loudness.";
    };
    readonly 固定原速: {
        readonly en: "Fixed speed";
    };
    readonly "\u6BCF\u4E2A\u97F3\u90FD\u6572\u539F\u901F\u952E\uFF1A\u5199\u8C31\u6309\u952E\u3001\u64AD\u653E\u90FD\u662F\u539F\u6765\u7684\u6837\u5B50\uFF1B\u8C31\u4E0A\u5199\u7684\u97F3\u9AD8\u7167\u7559\uFF0C\u53EA\u662F\u4E0D\u62FF\u6765\u51FA\u58F0": {
        readonly en: "Every note strikes the original-speed key: writing, keys and playback all sound original; the written pitch stays on the score, it's just not used for sound";
    };
    readonly 音高对齐: {
        readonly en: "Pitch align";
    };
    readonly "\u6309\u539F\u901F\u65F6\u6700\u5F3A\u7684\u90A3\u4E2A\u9891\u7387\u5927\u81F4\u5BF9\u9F50\uFF0C\u8C31\u4E0A\u7684\u97F3 \u2248 \u542C\u5230\u7684\u97F3\uFF1B\u4E0D\u4E00\u5B9A\u662F\u8033\u6735\u542C\u5230\u7684\u4E3B\u97F3": {
        readonly en: "Aligns the strongest frequency at original speed, so the written note ≈ what you hear; not always the perceived main pitch";
    };
    readonly "\u8C31\u4E0A\u5199\u4E0D\u540C\u7684\u97F3\u4E5F\u90FD\u54CD\u539F\u6765\u7684\u6837\u5B50\uFF08\u97F3\u9AD8\u7559\u5728\u8C31\u4E0A\uFF0C\u5173\u6389\u5C31\u6309\u5B83\u53D8\u8C03\uFF09": {
        readonly en: "Different written notes all sound original (pitch stays on the score; turn this off to transpose by it)";
    };
    readonly "\u5199\u7684\u97F3 \u2248 \u542C\u5230\u7684\u97F3\uFF08\u5927\u81F4\uFF09": {
        readonly en: "Written note ≈ what you hear (roughly)";
    };
    readonly "\u6309\u5199\u7684\u97F3\u53D8\u8C03\u53D8\u901F\uFF1A\u8D8A\u9AD8\u8D8A\u5C16\u8D8A\u5FEB\uFF0C\u8D8A\u4F4E\u8D8A\u6C89\u8D8A\u6162{sfx}": {
        readonly en: "Varies pitch and speed by the written note: higher is shriller and faster, lower is deeper and slower{sfx}";
    };
    readonly "\uFF1B\u8FD9\u4E2A\u97F3\u6548\u539F\u901F\u65F6\u542C\u4E0D\u51FA\u97F3\u9AD8\uFF0C\u6CA1\u6CD5\u5BF9\u9F50": {
        readonly en: "; this sound effect has no audible pitch at original speed, so it can't align";
    };
    readonly 修八度: {
        readonly en: "Octave fix";
    };
    readonly "{p}{tr} \u534A\u97F3": {
        readonly en: "{p}{tr} semitones";
    };
    readonly 低一个八度: {
        readonly en: "Down an octave";
    };
    readonly 低半音: {
        readonly en: "Down a semitone";
    };
    readonly 高半音: {
        readonly en: "Up a semitone";
    };
    readonly 高一个八度: {
        readonly en: "Up an octave";
    };
    readonly "\u56DE\u5230 0": {
        readonly en: "Back to 0";
    };
    readonly 归零: {
        readonly en: "Reset";
    };
    readonly "\u5927\u90E8\u5206\u60C5\u51B5\u4E0D\u7528\u52A8\uFF1A\u67D0\u4E9B\u97F3\u8272\u672C\u8EAB\u5C31\u5DEE\u516B\u5EA6\uFF08\u6BD4\u5982 GS \u7684 Guitar Harmonics \u9AD8\u4E24\u4E2A\u516B\u5EA6\uFF09\u65F6\u515C\u5E95\uFF0C\u8C03\u597D\u540E\u5199\u4EC0\u4E48\u97F3\u5C31\u54CD\u4EC0\u4E48\u97F3": {
        readonly en: "Rarely needed: a fallback when a sound is itself off by octaves (e.g. GS Guitar Harmonics is two octaves high); once fixed, what you write is what sounds";
    };
    readonly "\u4E0D\u56FA\u5B9A\u539F\u901F\uFF08\u6309\u5199\u7684\u97F3\u53D8\u8C03\uFF09": {
        readonly en: "Not fixed speed (transposes by the written note)";
    };
    readonly "\u300C{rn}\u300D\u97F3\u9AD8\u5BF9\u9F50{on}": {
        readonly en: "“{rn}” pitch align{on}";
    };
    readonly "\u300C{rn}\u300D\u4FEE\u516B\u5EA6 / \u79FB\u8C03 {next} \u534A\u97F3": {
        readonly en: "“{rn}” octave fix / transpose {next} semitones";
    };
    readonly "\u300C{rn}\u300D\u529B\u5EA6 {p}": {
        readonly en: "“{rn}” velocity {p}";
    };
    readonly 齐平: {
        readonly en: "Leveling";
    };
    readonly "\u6BCF\u4E2A\u5B57\u7684\u54CD\u5EA6\u5F80\u6574\u53E5\u7684\u4E2D\u4F4D\u6570\u62C9\u51E0\u6210\uFF1A\u5173 = \u7167\u5FF5\u7684\u65F6\u5019\u81EA\u5DF1\u7684\u8F7B\u91CD\uFF08\u5B57\u548C\u5B57\u4E4B\u95F4\u54CD\u5EA6\u4E0D\u53EF\u63A7\uFF09\uFF1B0.8 = \u62C9\u516B\u6210\uFF08\u9ED8\u8BA4\uFF1B2026-10-14 \u5230 10-17 \u9ED8\u8BA4\u5173\u8FC7\uFF09\u3002\u56E2\u5B50 C \u6BB5\u7B2C 10 \u5C0F\u8282\u300C\u305D\u300D\u7684\u7834\u97F3\u662F\u9F50\u5E73\u300C\u6BCF\u5B57\u91CD\u8D77\u300D\u5728\u5B57\u7684\u8FB9\u754C\u4E0A\u8DF3\u51FA\u6765\u7684\u53F0\u9636\uFF0C\u300C\u8FDE\u7EED\u300D\u4E0D\u8DF3": {
        readonly en: "How far each syllable's loudness is pulled toward the line's median: off = as spoken (loudness between syllables is uncontrolled); 0.8 = 80% (default). Restarting per syllable can step at syllable boundaries and crackle; “Continuous” doesn't step";
    };
    readonly 齐平过渡: {
        readonly en: "Leveling transition";
    };
    readonly 每字重起: {
        readonly en: "Per syllable";
    };
    readonly "\u9F50\u5E73\u5F00\u7740\u65F6\u589E\u76CA\u600E\u4E48\u4ECE\u4E00\u4E2A\u5B57\u6362\u5230\u4E0B\u4E00\u4E2A\u5B57\uFF1A\u6BCF\u5B57\u91CD\u8D77 = \u5728\u6BCF\u4E2A\u5B57\u7684\u5143\u97F3\u8D77\u70B9\u4ECE 0 \u8D77\u300130 ms \u5185\u722C\u5230\u8FD9\u4E2A\u5B57\u7684\u76EE\u6807\uFF0C\u8F85\u97F3\u4E0D\u52A0\uFF1B\u8FDE\u7EED = \u4ECE\u524D\u4E00\u4E2A\u5B57\u7684\u589E\u76CA\u8D77\uFF0C\u7ECF\u8FC7\u8F85\u97F3\u5230\u5143\u97F3\u8D77\u70B9\u540E 30 ms \u5E73\u6ED1\u8FC7\u6E21\u5230\u8FD9\u4E2A\u5B57\u7684": {
        readonly en: "How gain moves between syllables while leveling: per syllable = starts from 0 at each syllable's vowel onset and climbs to its target within 30 ms, consonants not boosted; continuous = smoothly from the previous syllable's gain, through the consonant, to this one's within 30 ms of the vowel onset";
    };
    readonly 齐平上限: {
        readonly en: "Leveling limit";
    };
    readonly "\u9F50\u5E73\u6700\u591A\u628A\u4E00\u4E2A\u5B57\u62C9\u51E0 dB": {
        readonly en: "The most dB leveling can pull a syllable";
    };
    readonly 借元音门槛: {
        readonly en: "Vowel-borrow threshold";
    };
    readonly "\u4E00\u4E2A\u5B57\u81EA\u5DF1\u6700\u5E72\u51C0\u90A3\u4E09\u5206\u4E4B\u4E00\u5E27\u7684\u6742\u5EA6\u8D85\u8FC7\u8FD9\u4E2A\u6570 = \u5F53\u5B83\u662F\u6C14\u58F0\u5FF5\u7684\uFF0C\u62FF\u540C\u4E00\u53E5\u91CC\u522B\u7684\u5E72\u51C0\u7684\u540C\u5143\u97F3\u6765\u5531\uFF08\u300C\u305D\u300D\u662F 0.34\uFF09": {
        readonly en: "If the noisiness of a syllable's cleanest third of frames exceeds this, it's treated as spoken breathily, and a clean same-vowel syllable from the line is sung instead";
    };
    readonly 气息: {
        readonly en: "Breathiness";
    };
    readonly 实声: {
        readonly en: "Clear";
    };
    readonly 照念的: {
        readonly en: "As spoken";
    };
    readonly "\u5408\u6210\u524D\u628A\u6BCF\u5E27\u6BCF\u4E2A\u9891\u6BB5\u7684\u6742\u5EA6\u538B\u5230\u8FD9\u4E2A\u5143\u97F3\u6700\u5E72\u51C0\u90A3\u51E0\u5E27\u7684\u7A0B\u5EA6\uFF1A0 = \u5168\u538B\u6210\u5B9E\u58F0\uFF0C1 = \u7167 piper \u5FF5\u51FA\u6765\u7684\u7559\u7740": {
        readonly en: "Before synthesis, presses each frame's band noisiness down to the level of this vowel's cleanest frames: 0 = fully clear voice, 1 = keep what piper spoke";
    };
    readonly "\u5C0F\u6708\u76F8\u672C\u4EBA\uFF08\u3064\u304F\u3088\u307F\u3061\u3083\u3093\uFF1B\u7B2C\u4E00\u6B21\u8981\u52A0\u8F7D\u7EA6 65 MB\uFF09": {
        readonly en: "Tsukuyomi-chan herself (つくよみちゃん; loads about 65 MB the first time)";
    };
    readonly "\uFF08\u9ED8\u8BA4\uFF09": {
        readonly en: " (default)";
    };
    readonly "\u6539\u4E86\u7528\u5230\u7684\u53E5\u5B50\u4F1A\u91CD\u5531\uFF1B\u5B58\u8FDB\u6B4C\u91CC\u3001\u80FD\u64A4\u9500": {
        readonly en: "Changing it re-sings the lines that use it; saved in the song, can be undone";
    };
    readonly 分段唱: {
        readonly en: "Sing in segments";
    };
    readonly 每句: {
        readonly en: "Per line";
    };
    readonly "\u5728\u4F11\u6B62\u5904\u5207\uFF08\u4F11\u6B62 \u2265 0.25 \u79D2\uFF09\uFF1A\u5185\u5B58\u6700\u7701\uFF0C\u6539\u4E00\u53E5\u53EA\u91CD\u5531\u90A3\u4E00\u53E5": {
        readonly en: "Cut at rests (rests ≥ 0.25 s): least memory; editing a line only re-sings that line";
    };
    readonly 每张纸: {
        readonly en: "Per sheet";
    };
    readonly 一张纸一段: {
        readonly en: "One segment per sheet";
    };
    readonly 一整首: {
        readonly en: "Whole song";
    };
    readonly "\u4E00\u53E3\u6C14\u5531\u5B8C\uFF08\u4EE5\u524D\u7684\u5531\u6CD5\uFF1B\u957F\u6B4C\u5728 iPad \u4E0A\u53EF\u80FD\u5185\u5B58\u4E0D\u591F\uFF09": {
        readonly en: "Sing it all at once (the old way; long songs may run out of memory on iPad)";
    };
    readonly "\u4E00\u53E3\u6C14\u5531\u5B8C\uFF1A\u53E5\u548C\u53E5\u4E4B\u95F4\u5531\u6CD5\u6700\u8FDE\u8D2F\uFF0C\u4F46\u957F\u6B4C\u5728 iPad \u4E0A\u53EF\u80FD\u5185\u5B58\u4E0D\u591F": {
        readonly en: "Sing it all at once: smoothest between lines, but long songs may run out of memory on iPad";
    };
    readonly "\u5206\u6BB5\u5531\uFF1A\u4E00\u6BB5\u5531\u5B8C\u5C31\u653E\u6389\uFF0C\u91CD\u590D\u7684\u6BB5 / \u6CA1\u6539\u7684\u53E5\u5B50\u76F4\u63A5\u62FF\u4E0A\u6B21\u7684\uFF1B\u6BB5\u548C\u6BB5\u4E4B\u95F4\u5207\u5728\u4F11\u6B62 / \u7EB8\u754C\uFF0C\u6574\u9996\u6700\u540E\u7EDF\u4E00\u97F3\u91CF": {
        readonly en: "Sing in segments: each is released after singing, repeated segments / unchanged lines reuse last time's; cuts fall at rests / sheet boundaries, with one volume for the whole song at the end";
    };
    readonly "\u300C{rn}\u300D\u5206\u6BB5\u5531\uFF1A{p}": {
        readonly en: "“{rn}” sing in segments: {p}";
    };
    readonly "\u5C0F\u6708\u76F8\u7684\u5143\u97F3\u91C7\u6837\uFF1A\u6309\u4E0B\u5373\u54CD\u3001\u4EFB\u4F55\u8BBE\u5907\u90FD\u80FD\u8DD1": {
        readonly en: "Tsukuyomi-chan's vowel samples: instant response, runs on any device";
    };
    readonly 这个浏览器不让双击打开的网页用存储: {
        readonly en: "This browser doesn't let pages opened by double-click use storage";
    };
    readonly 这个浏览器现在不让这一页用存储: {
        readonly en: "This browser doesn't let this page use storage right now";
    };
    readonly "\u548C itch \u4E0A\u522B\u7684\u6E38\u620F\u5171\u7528\u4E00\u4E2A\u5B58\u50A8\u6876": {
        readonly en: "Shares one storage bucket with other games on itch";
    };
    readonly 和这台电脑上别的双击打开的网页共用一个存储桶: {
        readonly en: "Shares one storage bucket with other double-clicked pages on this computer";
    };
    readonly "\u5199\u4E0D\u8FDB\u5B58\u50A8\u4E86\uFF08{why}\uFF09\uFF1A\u8FD9\u6B21\u6253\u5F00\u4E4B\u540E\u7684\u8BBE\u7F6E\u53EA\u7559\u5728\u5185\u5B58\u91CC": {
        readonly en: "Can't write to storage ({why}): settings from now on stay in memory only";
    };
    readonly "\u7F16\u6392\u3000": {
        readonly en: "Arrangement ";
    };
    readonly " \u7B49 {n} \u5904": {
        readonly en: " at {n} places";
    };
    readonly "\u9690\u85CF\u4E86 {n} \u6BB5": {
        readonly en: "{n} {n|section|sections} hidden";
    };
    readonly "\u9690\u85CF\u4E86 {n} \u4E2A\u58F0\u90E8": {
        readonly en: "{n} {n|part|parts} hidden";
    };
    readonly "\u6F14\u594F\u6CD5\u548C\u8868\u60C5\uFF1A\u4E0D\u663E\u793A": {
        readonly en: "Articulations & dynamics: hidden";
    };
    readonly "\u6709\u4E00\u7EC4\u6BD4\u4E00\u9875\u9AD8\uFF0C\u63A5\u5230\u4E86\u4E0B\u4E00\u9875": {
        readonly en: "A group is taller than a page, continued on the next page";
    };
    readonly 无调: {
        readonly en: "no key";
    };
    readonly 极弱: {
        readonly en: "very very soft";
    };
    readonly 很弱: {
        readonly en: "very soft";
    };
    readonly "\u5F31##\u529B\u5EA6": {
        readonly en: "soft";
    };
    readonly 中弱: {
        readonly en: "moderately soft";
    };
    readonly 中强: {
        readonly en: "moderately loud";
    };
    readonly "\u5F3A##\u529B\u5EA6": {
        readonly en: "loud";
    };
    readonly 很强: {
        readonly en: "very loud";
    };
    readonly 极强: {
        readonly en: "very very loud";
    };
    readonly "\u8FD9\u4E2A\u97F3\u77ED\u4E00\u70B9\u3001\u548C\u4E0B\u4E00\u4E2A\u97F3\u65AD\u5F00": {
        readonly en: "Make this note short, detached from the next one";
    };
    readonly 这个音的音头重一点: {
        readonly en: "Lean on the start of this note";
    };
    readonly 比重音更重的音头: {
        readonly en: "A heavier attack than an accent";
    };
    readonly "\u6BD4\u91CD\u97F3\u8F7B\u4E00\u6863\u7684\u91CD\uFF08\u56DB\u62CD\u5B50\u91CC\u7684\u7B2C\u4E09\u62CD\u90A3\u79CD\uFF09": {
        readonly en: "A lighter stress than an accent (like beat three in 4/4)";
    };
    readonly 这个音轻一点: {
        readonly en: "Play this note softer";
    };
    readonly "\u51E0\u4E4E\u542C\u4E0D\u89C1\u7684\u97F3\uFF08\u53EA\u7559\u4E2A\u5F71\u5B50\uFF09": {
        readonly en: "A note you can barely hear (just a shadow)";
    };
    readonly "\u8FD9\u4E2A\u97F3\u5531 / \u594F\u6EE1\uFF0C\u4E0D\u548C\u4E0B\u4E00\u4E2A\u97F3\u65AD\u5F00": {
        readonly en: "Hold this note full length, connected to the next one";
    };
    readonly 这个音后面换气: {
        readonly en: "Breathe after this note";
    };
    readonly "\u97F3\u5934\u7A81\u7136\u51B2\u4E00\u4E0B\u3001\u518D\u56DE\u5230\u5F53\u4E0B\u7684\u529B\u5EA6": {
        readonly en: "A sudden burst at the start, then back to the current dynamic";
    };
    readonly "\u97F3\u5934\u6309\u5F3A\u3001\u9A6C\u4E0A\u843D\u5230\u5F31\uFF0C\u540E\u9762\u7684\u97F3\u90FD\u662F\u5F31": {
        readonly en: "Loud attack that drops straight to soft; the notes after stay soft";
    };
    readonly "\u4E0D\u5531\u97F3\u9AD8\u3001\u7528\u6C14\u58F0\u5FF5\uFF08\u97F3\u9AD8\u7167\u5199\u5728\u8C31\u4E0A\uFF09": {
        readonly en: "Speak this note in a breathy voice instead of singing the pitch (the pitch stays written)";
    };
    readonly 这个音里面从弱长到写的力度: {
        readonly en: "Grow from soft to the written dynamic within this note";
    };
    readonly 这个音里面从写的力度收弱: {
        readonly en: "Fade from the written dynamic within this note";
    };
    readonly "\u8FD9\u4E2A\u97F3\u91CC\u9762\u5148\u957F\u540E\u6536\uFF08messa di voce\uFF09": {
        readonly en: "Grow then fade within this note (messa di voce)";
    };
    readonly 和弦从低到高一个个拨出来: {
        readonly en: "Roll the chord from the lowest note up";
    };
    readonly "\u8FD9\u4E2A\u97F3\u5FEB\u901F\u5730\u53CD\u590D\u6572\uFF08\u6EDA\uFF09\uFF1B\u6BCF\u4E00\u4E0B\u90FD\u662F\u6574\u4E0B\u6572\uFF0C\u60F3\u8F7B\u4E00\u70B9\u5C31\u518D\u52A0\u5E7D\u7075\u97F3": {
        readonly en: "Repeat this note rapidly (a roll); every hit is a full stroke — for a softer roll, also add a ghost note";
    };
    readonly "{dynName}\uFF08{dyn}\uFF09\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u8D77\u662F\u8FD9\u4E2A\u5F3A\u5F31\uFF0C\u7BA1\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7": {
        readonly en: "{dynName} ({dyn}): from this note on, at this loudness, until the next dynamic mark";
    };
    readonly "\u4ECE\u8FD9\u91CC\u8D77\u8D8A\u6765\u8D8A\u5F3A\uFF0C\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u4E3A\u6B62": {
        readonly en: "Getting louder from here until the next dynamic mark";
    };
    readonly "\u4ECE\u8FD9\u91CC\u8D77\u8D8A\u6765\u8D8A\u5F31\uFF0C\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u4E3A\u6B62": {
        readonly en: "Getting softer from here until the next dynamic mark";
    };
    readonly 从上一个力度记号均匀变到这一个: {
        readonly en: "Change evenly from the previous dynamic mark to this one";
    };
    readonly "\u8E29\u4E0B\uFF1A\u4E4B\u540E\u677E\u5F00\u7684\u952E\u5148\u4E0D\u505C\uFF0C\u5230\u6362\u8E0F\u677F\u6216\u62AC\u8D77\u624D\u505C": {
        readonly en: "Pedal down: keys you let go keep sounding until the next pedal change or lift";
    };
    readonly "\u8E29\u4E0B\u90A3\u4E00\u523B\u6309\u7740\u7684\u952E\u7559\u4F4F\uFF0C\u540E\u9762\u5F39\u7684\u7167\u5E38": {
        readonly en: "Keys held at the moment of pressing keep sounding; later notes play as usual";
    };
    readonly "\u8E29\u4E0B\uFF1A\u5F39\u5F97\u8F7B\u4E00\u70B9\u3001\u97F3\u8272\u6697\u4E00\u70B9": {
        readonly en: "Pedal down: play a little softer and darker";
    };
    readonly "{src} \u8F7D\u8FDB\u6765\u4E86\uFF0C\u4F46\u91CC\u9762\u6CA1\u6709\u300C{key}\u300D": {
        readonly en: "{src} loaded, but “{key}” isn't in it";
    };
    readonly "\u5907\u7528\u7248\u6587\u4EF6\u5939\u91CC\u5C11\u4E86 {src}\uFF08\u6216\u6D4F\u89C8\u5668\u4E0D\u8BA9\u8BFB\uFF09": {
        readonly en: "{src} is missing from the standalone folder (or the browser won't let it be read)";
    };
    readonly "\u5907\u7528\u7248\u91CC\u6CA1\u6709 {path}": {
        readonly en: "{path} isn't in the standalone version";
    };
    readonly "{path}\uFF1A\u5907\u7528\u7248\u6587\u4EF6\u5939\u91CC\u7684\u8FD9\u4E2A\u6587\u4EF6\u548C app \u91CC\u9489\u7684\u54C8\u5E0C\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09": {
        readonly en: "{path}: this file in the standalone folder doesn't match the hash pinned in the app (modified or damaged)";
    };
    readonly "{path}\uFF1A\u548C app \u91CC\u9489\u7684\u54C8\u5E0C\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09": {
        readonly en: "{path}: doesn't match the hash pinned in the app (modified or damaged)";
    };
    readonly "\u5C11\u4E86\u300C{close}\u300D": {
        readonly en: "Missing “{close}”";
    };
    readonly "\u591A\u4E86\u300C{c}\u300D": {
        readonly en: "Extra “{c}”";
    };
    readonly "\u770B\u4E0D\u61C2\u300C{p}\u300D": {
        readonly en: "Can't understand “{p}”";
    };
    readonly "\u6CA1\u6709\u53EB\u300C{name}\u300D\u7684\u7EB8\uFF08\u5199\u66F2\u6BB5\u540D\uFF0C\u6216\u8005\u7B2C\u51E0\u5F20\u7EB8\u7684\u5E8F\u53F7\uFF09": {
        readonly en: "No sheet named “{name}” (write a section name, or a sheet number)";
    };
    readonly "\u91CD\u590D\u6B21\u6570\u8981\u5728 1 \u5230 99 \u4E4B\u95F4": {
        readonly en: "Repeat counts must be 1 to 99";
    };
    readonly 循环段是空的: {
        readonly en: "The loop section is empty";
    };
    readonly "\u5FAA\u73AF\u6BB5\u53EA\u80FD\u653E\u5728\u6700\u540E\uFF1A\u540E\u9762\u7684\u6C38\u8FDC\u653E\u4E0D\u5230": {
        readonly en: "The loop section can only be last: anything after it would never play";
    };
    readonly 高音: {
        readonly en: "Treble";
    };
    readonly "\u9AD8\u97F3 8vb": {
        readonly en: "Treble 8vb";
    };
    readonly "\u9AD8\u97F3 8va": {
        readonly en: "Treble 8va";
    };
    readonly "\u9AD8\u97F3 15ma": {
        readonly en: "Treble 15ma";
    };
    readonly 低音: {
        readonly en: "Bass";
    };
    readonly "\u4F4E\u97F3 8vb": {
        readonly en: "Bass 8vb";
    };
    readonly 高音谱号: {
        readonly en: "Treble clef";
    };
    readonly "\u9AD8\u97F3\u8C31\u53F7\u4E0B\u9762\u6302 8\uFF1A\u8C31\u4E0A\u5199\u7684\u97F3\u5B9E\u9645\u4F4E\u4E00\u4E2A\u516B\u5EA6\u54CD\uFF08\u5409\u4ED6\u3001\u7537\u9AD8\u97F3\uFF09": {
        readonly en: "Treble clef with 8 below: written notes sound an octave lower (guitar, tenor)";
    };
    readonly "\u9AD8\u97F3\u8C31\u53F7\u4E0A\u9762\u6302 8\uFF1A\u5B9E\u9645\u9AD8\u4E00\u4E2A\u516B\u5EA6\uFF08\u77ED\u7B1B\uFF09": {
        readonly en: "Treble clef with 8 above: sounds an octave higher (piccolo)";
    };
    readonly "\u9AD8\u97F3\u8C31\u53F7\u4E0A\u9762\u6302 15\uFF1A\u5B9E\u9645\u9AD8\u4E24\u4E2A\u516B\u5EA6\uFF08\u949F\u7434\u3001\u94C3\uFF09": {
        readonly en: "Treble clef with 15 above: sounds two octaves higher (glockenspiel, bells)";
    };
    readonly 低音谱号: {
        readonly en: "Bass clef";
    };
    readonly "\u4F4E\u97F3\u8C31\u53F7\u4E0B\u9762\u6302 8\uFF1A\u5B9E\u9645\u4F4E\u4E00\u4E2A\u516B\u5EA6\uFF08\u4F4E\u97F3\u63D0\u7434\u3001\u8D1D\u65AF\uFF09": {
        readonly en: "Bass clef with 8 below: sounds an octave lower (double bass, bass guitar)";
    };
    readonly 结束八度线: {
        readonly en: "End ottava line";
    };
    readonly 最重: {
        readonly en: "strongest";
    };
    readonly 很重: {
        readonly en: "very strong";
    };
    readonly 重: {
        readonly en: "strong";
    };
    readonly 稍重: {
        readonly en: "slightly strong";
    };
    readonly 稍轻: {
        readonly en: "slightly light";
    };
    readonly 轻: {
        readonly en: "light";
    };
    readonly 一: {
        readonly en: "1";
    };
    readonly 二: {
        readonly en: "2";
    };
    readonly 三: {
        readonly en: "3";
    };
    readonly 四: {
        readonly en: "4";
    };
    readonly 五: {
        readonly en: "5";
    };
    readonly 六: {
        readonly en: "6";
    };
    readonly 七: {
        readonly en: "7";
    };
    readonly 八: {
        readonly en: "8";
    };
    readonly 九: {
        readonly en: "9";
    };
    readonly 十: {
        readonly en: "10";
    };
    readonly 十一: {
        readonly en: "11";
    };
    readonly 十二: {
        readonly en: "12";
    };
    readonly "{p}\u62CD {p2}": {
        readonly en: "Beat {p} {p2}";
    };
    readonly "\u4E24\u5C0F\u8282\u4E00\u8F6E\uFF1A\u7B2C\u4E00\u5C0F\u8282 {p}\uFF1B\u7B2C\u4E8C\u5C0F\u8282 {p2}\uFF1B\u91CD\u7684\u683C\u5B50\uFF08\u5C0F\u8282-\u7B2C\u51E0\u4E2A\u5341\u516D\u5206\uFF09{p3}": {
        readonly en: "Two-bar cycle: first bar {p}; second bar {p2}; strong slots (bar-sixteenth) {p3}";
    };
    readonly 拍里的八分: {
        readonly en: "Eighths within the beat";
    };
    readonly 半拍: {
        readonly en: "Half-beat";
    };
    readonly "\uFF1B\u66F4\u7EC6\u7684 {finer}": {
        readonly en: "; finer {finer}";
    };
    readonly 加了一张纸: {
        readonly en: "Added a sheet";
    };
    readonly 删了一张纸: {
        readonly en: "Deleted a sheet";
    };
    readonly 加了一个声部: {
        readonly en: "Added a part";
    };
    readonly 删了一个声部: {
        readonly en: "Deleted a part";
    };
    readonly 挪了声部顺序: {
        readonly en: "Reordered parts";
    };
    readonly "\u5199\u4E86 {d} \u4E2A": {
        readonly en: "Wrote {d}";
    };
    readonly "\u5220\u4E86 {d} \u4E2A": {
        readonly en: "Deleted {d}";
    };
    readonly 改歌名: {
        readonly en: "Changed title";
    };
    readonly 改作者栏: {
        readonly en: "Changed credits";
    };
    readonly 改曲段名: {
        readonly en: "Renamed section";
    };
    readonly "\u6539##\u8C31": {
        readonly en: "Edited";
    };
    readonly "{engineName}\u4E0D\u5531\u6B4C\u8BCD\uFF08\u53EA\u54FC / \u53EA\u5F39\uFF09\uFF1B\u6B4C\u8BCD\u7167\u5199\u7167\u5B58": {
        readonly en: "{engineName} doesn't sing lyrics (only hums / plays); lyrics are still written and saved";
    };
    readonly "\u8FD9\u4E00\u6BB5\u6709\u5047\u540D\u3001\u6309\u65E5\u8BED\u5531\uFF1A\u6C49\u5B57\u5C0F\u6708\u76F8\u6309\u8BFB\u97F3\u6570\u62CD\uFF0C\u4E00\u4E2A\u5B57\u53EF\u80FD\u597D\u51E0\u62CD\u3001\u5BF9\u4E0D\u4E0A\u97F3\u2014\u2014\u5199\u6210\u5047\u540D\uFF08\u4E00\u6BB5\u90FD\u662F\u6C49\u5B57\u624D\u6309\u4E2D\u6587\u5531\uFF1B\u6BB5 = \u4E50\u5668\u8BBE\u7F6E\u91CC\u7684\u300C\u5206\u6BB5\u5531\u300D\uFF09": {
        readonly en: "This segment has kana and is sung in Japanese: Tsukuyomi-chan counts kanji by reading, so one character may take several beats and miss the notes — write it in kana (a segment is sung in Chinese only if it's all kanji; segment = “Sing in segments” in instrument settings)";
    };
    readonly "\u4E00\u4E2A\u97F3\u4E0A {beats} \u62CD\uFF1A\u5C0F\u6708\u76F8\u4E00\u4E2A\u97F3\u5531\u4E00\u62CD\u2014\u2014\u62C6\u6210 {beats2} \u4E2A\u97F3\uFF0C\u6216\u8005\u7528\u300C+\u300D\u8FDE\u7740\u5199": {
        readonly en: "{beats} beats on one note: Tsukuyomi-chan sings one beat per note — split into {beats2} notes, or join with “+”";
    };
    readonly "\u8FD9\u4E00\u6BB5\u6309\u65E5\u8BED\u5531\uFF1A\u5B57\u6BCD / \u6570\u5B57 / \u7B26\u53F7\u5FF5\u4E0D\u51C6\u2014\u2014\u5199\u6210\u5047\u540D": {
        readonly en: "This segment is sung in Japanese: letters / digits / symbols aren't read reliably — write them in kana";
    };
    readonly "\u8FD9\u4E00\u6BB5\u6309\u4E2D\u6587\u5531\uFF1A\u4E00\u4E2A\u97F3\u5199\u4E00\u4E2A\u6C49\u5B57": {
        readonly en: "This segment is sung in Chinese: one character per note";
    };
    readonly "\u8FD9\u4E00\u6BB5\u6309\u82F1\u6587\u5531\uFF1A\u5199\u62C9\u4E01\u5B57\u6BCD": {
        readonly en: "This segment is sung in English: use Latin letters";
    };
    readonly 舒适: {
        readonly en: "Comfortable";
    };
    readonly "\u97F3\u7B26\u5927\uFF0C\u4E00\u9875\u653E\u5F97\u5C11": {
        readonly en: "Big notes, fewer per page";
    };
    readonly 紧凑: {
        readonly en: "Compact";
    };
    readonly "\u97F3\u7B26\u5C0F\uFF0C\u4E00\u9875\u653E\u5F97\u591A\uFF08\u6B4C\u540D\u548C\u58F0\u90E8\u540D\u7167\u5927\u7684\uFF0C\u6B4C\u8BCD\u7528\u5C0F\u5B57\uFF09": {
        readonly en: "Small notes, more per page (title and part names stay big; lyrics are smaller)";
    };
    readonly "\u6A2A\u653E\uFF1A\u603B\u8C31 / \u5927\u5C4F": {
        readonly en: "Landscape: scores / large screens";
    };
    readonly 正经纸: {
        readonly en: "Standard paper";
    };
    readonly "\u5C0F\u518C\u5B50\uFF0CA4 \u5BF9\u6298": {
        readonly en: "Booklet, A4 folded";
    };
    readonly 口袋本: {
        readonly en: "Pocket";
    };
    readonly "A3 \u6A2A": {
        readonly en: "A3 landscape";
    };
    readonly "\u53CD\u590D / \u8DF3\u8F6C\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C": {
        readonly en: "Repeats / jumps only count on this sheet's top part";
    };
    readonly "\u8FD9\u5F20\u7EB8\u4E0A\u6CA1\u6709 Segno\uFF0CD.S. \u8DF3\u4E0D\u4E86": {
        readonly en: "No Segno on this sheet, so D.S. can't jump";
    };
    readonly "\u6CA1\u6709 To Coda\uFF1A\u8DF3\u56DE\u6765\u4E4B\u540E\u4E00\u8DEF\u653E\u5230\u7EB8\u5C3E": {
        readonly en: "No To Coda: after jumping back it plays to the end of the sheet";
    };
    readonly 大调: {
        readonly en: "Major";
    };
    readonly 大小调: {
        readonly en: "Major / minor";
    };
    readonly 小调: {
        readonly en: "Minor";
    };
    readonly 和声小调: {
        readonly en: "Harmonic minor";
    };
    readonly 旋律小调: {
        readonly en: "Melodic minor";
    };
    readonly 宫调式: {
        readonly en: "Gong mode";
    };
    readonly 五声: {
        readonly en: "Pentatonic";
    };
    readonly 商调式: {
        readonly en: "Shang mode";
    };
    readonly 角调式: {
        readonly en: "Jue mode";
    };
    readonly 徵调式: {
        readonly en: "Zhi mode";
    };
    readonly 羽调式: {
        readonly en: "Yu mode";
    };
    readonly 六声加清角: {
        readonly en: "Hexatonic + qingjue";
    };
    readonly 民族: {
        readonly en: "Chinese";
    };
    readonly 六声加变宫: {
        readonly en: "Hexatonic + biangong";
    };
    readonly 雅乐: {
        readonly en: "Yayue";
    };
    readonly 燕乐: {
        readonly en: "Yanyue";
    };
    readonly 都节: {
        readonly en: "Miyako-bushi";
    };
    readonly 日本: {
        readonly en: "Japanese";
    };
    readonly 琉球: {
        readonly en: "Ryukyu";
    };
    readonly 布鲁斯: {
        readonly en: "Blues";
    };
    readonly 多利亚: {
        readonly en: "Dorian";
    };
    readonly 教会调式: {
        readonly en: "Church modes";
    };
    readonly 弗里几亚: {
        readonly en: "Phrygian";
    };
    readonly 利底亚: {
        readonly en: "Lydian";
    };
    readonly 混合利底亚: {
        readonly en: "Mixolydian";
    };
    readonly 洛克利亚: {
        readonly en: "Locrian";
    };
    readonly 西班牙: {
        readonly en: "Spanish";
    };
    readonly 阿拉伯: {
        readonly en: "Arabic";
    };
    readonly 匈牙利小调: {
        readonly en: "Hungarian minor";
    };
    readonly 全音阶: {
        readonly en: "Whole tone";
    };
    readonly 半音阶: {
        readonly en: "Chromatic";
    };
    readonly 广板: {
        readonly en: "Largo";
    };
    readonly 小广板: {
        readonly en: "Larghetto";
    };
    readonly 柔板: {
        readonly en: "Adagio";
    };
    readonly 行板: {
        readonly en: "Andante";
    };
    readonly 中板: {
        readonly en: "Moderato";
    };
    readonly 小快板: {
        readonly en: "Allegretto";
    };
    readonly 快板: {
        readonly en: "Allegro";
    };
    readonly 活板: {
        readonly en: "Vivace";
    };
    readonly 急板: {
        readonly en: "Presto";
    };
    readonly 最急板: {
        readonly en: "Prestissimo";
    };
    readonly "\u5C0F\u6708\u76F8\u7684 worker \u51FA\u9519": {
        readonly en: "Tsukuyomi-chan's worker failed";
    };
    readonly "\u5C0F\u6708\u76F8\u7684 worker \u91CD\u5F00\u4E86": {
        readonly en: "Tsukuyomi-chan's worker restarted";
    };
    readonly "\u5185\u5B58\u4E0D\u591F\uFF1A\u91CD\u5F00\u5C0F\u6708\u76F8\u7684\u5F15\u64CE\u518D\u8BD5\u4E00\u6B21": {
        readonly en: "Out of memory: restarting Tsukuyomi-chan's engine to try again";
    };
    readonly "\u8FD9\u53F0\u8BBE\u5907\u7684\u5185\u5B58\u4E0D\u591F\uFF0C\u5C0F\u6708\u76F8\u7684\u5F15\u64CE\u8D77\u4E0D\u6765\uFF08\u5DF2\u7ECF\u91CD\u5F00\u8FC7\u4E00\u6B21\u5F15\u64CE\uFF09\u3002\u53EF\u4EE5\u628A\u522B\u7684\u4E50\u5668\u58F0\u90E8\u9759\u97F3\u518D\u653E\uFF0C\u6216\u8005\u5173\u6389 app \u91CD\u65B0\u6253\u5F00\uFF1B\u4E5F\u53EF\u4EE5\u7ED9\u8FD9\u4E2A\u58F0\u90E8\u6362\u300C\u5C0F\u6708\u76F8\uFF08\u5143\u97F3\uFF09\u300D": {
        readonly en: "This device doesn't have enough memory to start Tsukuyomi-chan's engine (already restarted once). You can mute other instrument parts and play again, or close and reopen the app; or switch this part to “Tsukuyomi-chan (vowels)”";
    };
    readonly "\u4ECE\u6587\u4EF6\u5939\u8BFB{what}": {
        readonly en: "Reading {what} from the folder";
    };
    readonly "\u4E0B\u8F7D{what}\uFF08{e6} MB\uFF0C\u53EA\u4E0B\u8FD9\u4E00\u6B21\uFF09{total}%": {
        readonly en: "Downloading {what} ({e6} MB, only this once) {total}%";
    };
    readonly "{what}\u4E0B\u8F7D\u4E0D\u4E0B\u6765\uFF08\u8BD5\u8FC7 {p}\uFF09\uFF1A{Error}\u3002\u53EF\u4EE5\u5728\u8BBE\u7F6E\u91CC\u6362\u6A21\u578B\u6765\u6E90\uFF0C\u6216\u4ECE\u672C\u673A\u6587\u4EF6\u5BFC\u5165": {
        readonly en: "{what} couldn't be downloaded (tried {p}): {Error}. You can change the model source in Settings, or import from a local file";
    };
    readonly "\u7F13\u5B58\u91CC\u7684\u5C0F\u6708\u76F8\u6A21\u578B\u548C\u6E05\u5355\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09\uFF0C\u574F\u7684\u90A3\u4E00\u7247\u5DF2\u7ECF\u4E22\u6389\uFF1A\u518D\u5531\u4E00\u6B21\u4F1A\u91CD\u65B0\u4E0B\u8F7D\uFF08{Error}\uFF09": {
        readonly en: "The cached Tsukuyomi-chan model doesn't match its manifest (modified or damaged); the bad chunk was discarded: singing again will re-download it ({Error})";
    };
    readonly "{slug}: \u5305\u91CC\u6CA1\u6709 {path}": {
        readonly en: "{slug}: {path} isn't in the pack";
    };
    readonly "\u52A0\u8F7D piper \u5F15\u64CE": {
        readonly en: "Loading the piper engine";
    };
    readonly 加载小月相的模型: {
        readonly en: "Loading Tsukuyomi-chan's model";
    };
    readonly 加载日语前端: {
        readonly en: "Loading the Japanese front end";
    };
    readonly 中文前端: {
        readonly en: "Chinese front end";
    };
    readonly 英文词典: {
        readonly en: "English dictionary";
    };
    readonly "\u52A0\u8F7D WORLD": {
        readonly en: "Loading WORLD";
    };
    readonly 主线程没读到这个文件: {
        readonly en: "The main thread couldn't read this file";
    };
    readonly 小月相在唱: {
        readonly en: "Tsukuyomi-chan is singing";
    };
    readonly "\u5FF5\uFF081/2\uFF09": {
        readonly en: "Speaking (1/2)";
    };
    readonly "\u5FF5\uFF082/2\uFF09": {
        readonly en: "Speaking (2/2)";
    };
    readonly "\u5206\u6790\uFF081/3 \u97F3\u9AD8\uFF09": {
        readonly en: "Analyzing (1/3 pitch)";
    };
    readonly "\u5206\u6790\uFF082/3 \u8C31\u5305\u7EDC\uFF09": {
        readonly en: "Analyzing (2/3 spectral envelope)";
    };
    readonly "\u5206\u6790\uFF083/3 \u6C14\u58F0\uFF09": {
        readonly en: "Analyzing (3/3 breathiness)";
    };
    readonly "\u5206\u6790\uFF08\u7F13\u5B58\uFF09": {
        readonly en: "Analyzing (cached)";
    };
    readonly 合成: {
        readonly en: "Synthesizing";
    };
    readonly "\u8FD9\u4E0D\u662F\u4E00\u4E2A\u7F51\u5740\uFF1A{link}": {
        readonly en: "This is not a web address: {link}";
    };
    readonly "\u53EA\u8BA4 https \u5F00\u5934\u7684\u94FE\u63A5\uFF1A{link}": {
        readonly en: "Only links starting with https work: {link}";
    };
    readonly "Google Drive \u4E0D\u8BA9\u522B\u7684\u7F51\u9875\u76F4\u63A5\u8BFB\u91CC\u9762\u7684\u6587\u4EF6\uFF0C\u8FD9\u6761\u94FE\u63A5\u6253\u4E0D\u5F00\u3002\u6362\u6210 Dropbox\u3001OneDrive\u3001GitHub\uFF0C\u6216\u8005\u81EA\u5DF1\u7F51\u7AD9\u4E0A\u7684\u76F4\u94FE\u3002": {
        readonly en: "Google Drive does not let other web pages read its files, so this link can’t be opened. Use Dropbox, OneDrive, GitHub, or a direct link on your own site.";
    };
    readonly "\u8FD9\u662F Dropbox \u7684\u6587\u4EF6\u5939\u94FE\u63A5\uFF1A\u8981\u5206\u4EAB\u5355\u4E2A\u6B4C\u6587\u4EF6\u7684\u94FE\u63A5\u3002": {
        readonly en: "This is a Dropbox folder link. Share the link to a single song file instead.";
    };
    readonly "\u8FD9\u662F GitHub \u7684\u9875\u9762\uFF0C\u4E0D\u662F\u6587\u4EF6\uFF1A\u8981\u94FE\u5230\u4ED3\u5E93\u91CC\u7684\u90A3\u4E2A\u6B4C\u6587\u4EF6\uFF08\u5730\u5740\u91CC\u6709 /blob/ \u7684\u90A3\u79CD\uFF09\u3002": {
        readonly en: "This is a GitHub page, not a file. Link to the song file in the repository (an address with /blob/ in it).";
    };
    readonly "\u8BA4\u4E0D\u51FA\u8FD9\u4E2A Gist \u94FE\u63A5\uFF1A\u8981\u5E26\u7528\u6237\u540D\u7684\u90A3\u79CD\uFF08gist.github.com/\u540D\u5B57/\u7F16\u53F7\uFF09\u3002": {
        readonly en: "Can’t read this Gist link. Use the form with the user name (gist.github.com/name/id).";
    };
    readonly "\u6CA1\u62FF\u5230\uFF1A{host} \u4E0D\u8BA9\u522B\u7684\u7F51\u9875\u8BFB\u8FD9\u4E2A\u6587\u4EF6\uFF0C\u6216\u8005\u7F51\u65AD\u4E86\u3002": {
        readonly en: "Couldn’t get it: {host} doesn’t let other web pages read this file, or the network is down.";
    };
    readonly "{host} \u8BF4\u8FD9\u4E2A\u6587\u4EF6\u4E0D\u5728\u4E86\uFF08{status}\uFF09\uFF1A\u94FE\u63A5\u8FC7\u671F\u4E86\uFF0C\u6216\u8005\u6CA1\u8BBE\u6210\u516C\u5F00\u5206\u4EAB\u3002": {
        readonly en: "{host} says the file is gone ({status}). The link may have expired or isn’t shared publicly.";
    };
    readonly "{host} \u4E0D\u8BA9\u8BFB\uFF08{status}\uFF09\uFF1A\u8FD9\u6761\u94FE\u63A5\u6CA1\u8BBE\u6210\u300C\u77E5\u9053\u94FE\u63A5\u7684\u4EBA\u90FD\u80FD\u770B\u300D\u3002": {
        readonly en: "{host} refused ({status}). The link isn’t set to “anyone with the link can view”.";
    };
    readonly "{host} \u56DE\u4E86 {status}\uFF0C\u6CA1\u62FF\u5230\u6587\u4EF6\u3002": {
        readonly en: "{host} answered {status}; no file.";
    };
    readonly "\u8FD9\u4E2A\u6587\u4EF6\u8D85\u8FC7 {mb} MB\uFF0C\u4E0D\u50CF\u4E00\u9996\u6B4C\uFF0C\u6CA1\u6253\u5F00\u3002": {
        readonly en: "This file is over {mb} MB, too big for a song, so it wasn’t opened.";
    };
    readonly "\u5927\u5C0F\u4E0D\u5BF9\uFF08{n} \u2260 {bytes}\uFF09": {
        readonly en: "Wrong size ({n} ≠ {bytes})";
    };
    readonly 比目录里说的大: {
        readonly en: "Larger than the catalog says";
    };
    readonly "\u5927\u5C0F\u4E0D\u5BF9\uFF08{o} \u2260 {bytes}\uFF09": {
        readonly en: "Wrong size ({o} ≠ {bytes})";
    };
    readonly "\u5185\u5BB9\u548C\u76EE\u5F55\u91CC\u9489\u7684\u4E0D\u4E00\u6837\uFF08sha256 {p}\u2026 \u2260 {p2}\u2026\uFF09\uFF0C\u6CA1\u6709\u7528\u5B83": {
        readonly en: "Content differs from the hash pinned in the catalog (sha256 {p}… ≠ {p2}…), so it wasn't used";
    };
    readonly "\u300C{name}\u300D\u62FF\u4E0D\u5230\uFF08\u8BD5\u8FC7 {p}\uFF09\u3002\u6700\u540E\u4E00\u6B21\uFF1A{last}\u3002\u53EF\u4EE5\u5728\u8BBE\u7F6E\u91CC\u6362\u97F3\u6E90\u5E93\u6765\u6E90\uFF0C\u6216\u4ECE\u672C\u673A .sf2 \u6587\u4EF6\u9009\u3002": {
        readonly en: "Couldn't get “{name}” (tried {p}). Last attempt: {last}. You can change the sound library source in Settings, or choose from a local .sf2 file.";
    };
    readonly "\u300C{name}\u300D\u7684\u58F0\u97F3\uFF08{path}\uFF09\u6CA1\u968F\u8FD9\u9996\u6B4C\u5E26\u6765": {
        readonly en: "The sound of “{name}” ({path}) didn't come with this song";
    };
    readonly "\u627E\u300C{name}\u300D\u7684\u58F0\u97F3\uFF1A\u4E0B\u8F7D {name2} {bytes}%": {
        readonly en: "Finding the sound of “{name}”: downloading {name2} {bytes}%";
    };
    readonly "\u300C{name}\u300D\u7684\u58F0\u97F3\u6CA1\u968F\u6B4C\u5E26\uFF08\u5F31\u5F15\u7528\uFF09\uFF0C\u8FD9\u53F0\u8BBE\u5907\u548C\u5BB6\u65CF\u97F3\u6E90\u5E93\u91CC\u4E5F\u6CA1\u6709\u5B83\u6765\u81EA\u7684\u300C{name2}\u300D\uFF08sha256 {p}\u2026\uFF09\u3002\u70B9\u8C31\u524D\u9762\u7684\u300C{p2}\u300D\uFF0C\u7ED9\u5B83\u300C\u627E\u6587\u4EF6\u2026\u300D\uFF0C\u6216\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": {
        readonly en: "The sound of “{name}” didn't come with the song (weak reference), and “{name2}” (sha256 {p}…) isn't on this device or in the family sound library either. Tap “{p2}” at the front of the score, “Find file…”, or change “Who performs”";
    };
    readonly "\u4ECE\u300C{name}\u300D\u5207\u51FA\u6765\u7684\u300C{name2}\u300D\u548C\u6B4C\u91CC\u8BB0\u7684\u4E0D\u4E00\u6837\uFF08sha256 {p}\u2026 \u2260 {p2}\u2026\uFF09\uFF0C\u6CA1\u6709\u7528\u5B83": {
        readonly en: "“{name2}” cut from “{name}” differs from what the song records (sha256 {p}… ≠ {p2}…), so it wasn't used";
    };
    readonly "\u300C{n}\u300D\u4E91\u7AEF\u5DF2\u7ECF\u6709\u540C\u540D\u7684\u4E86\uFF0C\u79BB\u7EBF\u65F6\u5B58\u7684\u8FD9\u4EFD\u6CA1\u63A8\u4E0A\u53BB\uFF08\u5728\u6B4C\u5E93\u91CC\u6539\u4E2A\u540D\u518D\u63A8\uFF09": {
        readonly en: "“{n}” already exists in the cloud, so the copy saved offline wasn't uploaded (rename it in the library and upload again)";
    };
    readonly "\u79BB\u7EBF\u65F6\u5B58\u7684\u6B4C\u63A8\u4E0A\u4E91\u4E86\uFF08{done} / {total}\uFF09": {
        readonly en: "Songs saved offline were uploaded ({done} / {total})";
    };
    readonly "\u6B63\u5728\u628A\u79BB\u7EBF\u65F6\u5B58\u7684\u6B4C\u63A8\u4E0A\u4E91\u2026 {done} / {total}": {
        readonly en: "Uploading songs saved offline… {done} / {total}";
    };
    readonly "\u600E\u4E48\u8BA4\u7684\uFF1A\u51D1\u5F97\u6210\u5B8C\u6574\u548C\u5F26\u7684\u4F18\u5148\uFF08\u4E0D\u7701\u97F3\uFF09\u2192 \u6700\u4F4E\u97F3\u5F53\u6839\u97F3\u7684\u4F18\u5148 \u2192 \u6839\u97F3\u5728\u8FD9\u4E2A\u8C03\u91CC\u7684\u4F18\u5148 \u2192 \u7B80\u5355\u7684\u4F18\u5148\u3002\u6253\u5E73\u7684\u4E24\u4E2A\u90FD\u5199\u5728\u8C31\u4E0A\u3002": {
        readonly en: "How it is read: chords that are complete (nothing left out) win → the lowest note as root wins → a root inside this key wins → simpler chords win. When two tie, both are written on the score.";
    };
    readonly "\u8F6C\u4F4D\uFF08\u6700\u4F4E\u97F3\u4E0D\u662F\u6839\u97F3\uFF09": {
        readonly en: "Inversion (the lowest note is not the root)";
    };
    readonly "\u6CA1\u6709\u4E09\u5EA6\uFF1A\u5927\u4E09\u548C\u5F26\u8FD8\u662F\u5C0F\u4E09\u548C\u5F26\u5206\u4E0D\u51FA\u6765\uFF0C\u6309\u8FD9\u4E2A\u8C03\u91CC\u7684\u5199": {
        readonly en: "No third: major or minor can’t be told apart, so it follows this key";
    };
    readonly "\u7701\u4E86 {n} \u4E2A\u97F3": {
        readonly en: "{n} {n|note|notes} left out";
    };
    readonly "\u6CA1\u6709\u53EF\u7528\u7684\u8D77\u6CD5\uFF08\u6253\u5305\u65F6\u6CA1\u5E26\u8FD9\u4E2A\u7EBF\u7A0B\uFF09": {
        readonly en: "No way to start it (this thread wasn't bundled)";
    };
    readonly "\u540E\u53F0\u7EBF\u7A0B\u300C{name}\u300D\u8D77\u4E0D\u6765\uFF1A{Error}": {
        readonly en: "Background thread “{name}” can't start: {Error}";
    };
    readonly "\u51FA\u58F0\u7EBF\u7A0B\u300C{name}\u300D\u8D77\u4E0D\u6765\uFF1A{Error}": {
        readonly en: "Audio thread “{name}” can't start: {Error}";
    };
    readonly 旋律: {
        readonly en: "Melody";
    };
    readonly 和弦: {
        readonly en: "Chords";
    };
    readonly 第二旋律: {
        readonly en: "2nd melody";
    };
    readonly 伴奏: {
        readonly en: "Accomp.";
    };
    readonly 铺底: {
        readonly en: "Pad";
    };
    readonly 节奏: {
        readonly en: "Rhythm";
    };
    readonly "\u70B9\u4E00\u4EF6\u4E50\u5668 \u2192 \u6311\u8C01\u6765\u6F14 \u2192 \u7528\u53F3\u8FB9\u7684\u952E\u76D8\u8BD5 \u2192 \u300C\u9009\u8FD9\u4E2A\u300D= \u6362\u4E0A\u3002\u76EE\u5F55\u4E0D\u5173\uFF0C\u653E\u7740\u6B4C\u4E5F\u80FD\u63A5\u7740\u6362\uFF1B\u56DE\u8C31\u70B9\u300C\u2190 \u8C31\u300D\u3002\u8C31\u4E0A\u7684\u540D\u5B57\u8DDF\u7740\u6362\u6210\u90A3\u4EF6\u4E50\u5668\u3002": {
        readonly en: "Tap an instrument → pick who plays it → try it on the keyboard → “Use this” switches to it. The catalog stays open, so you can keep switching even while the song plays; tap “← Score” to go back. The name on the score follows the instrument.";
    };
    readonly "\u641C\u4E50\u5668\uFF08\u4E2D / \u82F1 / \u65E5\uFF09": {
        readonly en: "Search instruments (zh / en / ja)";
    };
    readonly "\u81EA\u5DF1\u7684 .sf2 \u6587\u4EF6\uFF1A\u9009\u4E2D\u7684\u90A3\u4E00\u4EF6\u5207\u51FA\u6765\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u91CC\u53EA\u8BB0\u6765\u6E90": {
        readonly en: "Your own .sf2 file: the one you pick is cut out and kept on this device; the song only records where it came from";
    };
    readonly "\u6253\u5F00 .sf2\u2026": {
        readonly en: "Open .sf2…";
    };
    readonly 跳到: {
        readonly en: "Jump to";
    };
    readonly 列表滚到这一组: {
        readonly en: "Scroll the list to this group";
    };
    readonly 隐藏找不到的: {
        readonly en: "Hide unavailable";
    };
    readonly "\u52A0\u8F7D\u76EE\u5F55\u2026": {
        readonly en: "Loading the catalog…";
    };
    readonly "\u4E50\u5668\u76EE\u5F55\uFF08\u5F39\u7740\u73A9\uFF09": {
        readonly en: "Instrument catalog (just for fun)";
    };
    readonly "\u627E\u4EBA\u7ED9\u300C{p}\u300D": {
        readonly en: "Finding someone for “{p}”";
    };
    readonly "\u2190 \u6B4C\u5E93": {
        readonly en: "← Library";
    };
    readonly "\u70B9\u4E00\u4EF6\u4E50\u5668 \u2192 \u6311\u8C01\u6765\u6F14 \u2192 \u7528\u952E\u76D8\u5F39\u7740\u73A9\u3002\u8981\u7ED9\u6B4C\u91CC\u7684\u58F0\u90E8\u9009\u4E50\u5668\uFF1A\u5F00\u4E00\u9996\u6B4C\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u3002": {
        readonly en: "Tap an instrument → choose who performs → play on the keys for fun. To choose an instrument for a part: open a song and tap the part name at the front of the score.";
    };
    readonly "\u76EE\u5F55\u52A0\u8F7D\u4E0D\u4E86\uFF1A{Error}": {
        readonly en: "Can't load the catalog: {Error}";
    };
    readonly "\u70B9\u4E0B\u9762\u4E00\u4EF6\u4E50\u5668\uFF0C\u6362\u8FDB\u8FD9\u4E00\u683C": {
        readonly en: "Tap an instrument below to put it in this slot";
    };
    readonly "\u70B9 = \u6362\u4E0A\u300C{name}\u300D\uFF1B\u957F\u6309\uFF08\u53F3\u952E\uFF09= \u6362\u6210\u522B\u7684 / \u62FF\u6389": {
        readonly en: "Tap = switch to “{name}”; long-press (right-click) = replace / remove";
    };
    readonly 复制一份: {
        readonly en: "Duplicate";
    };
    readonly 拷到这个声部: {
        readonly en: "Copy to this part";
    };
    readonly "\u6362\u6210\u2026": {
        readonly en: "Replace with…";
    };
    readonly 拿掉: {
        readonly en: "Remove";
    };
    readonly 取消置顶: {
        readonly en: "Unpin";
    };
    readonly 置顶到常用: {
        readonly en: "Pin to favorites";
    };
    readonly 这首歌的乐器预设: {
        readonly en: "Instrument presets in this song";
    };
    readonly "\u6B63\u5728\u53F0\u4E0A\uFF1B\u957F\u6309\uFF08\u53F3\u952E\uFF09= \u590D\u5236\u4E00\u4EFD": {
        readonly en: "On stage now; long-press (right-click) = duplicate";
    };
    readonly "\u70B9 = \u6362\u4E0A\uFF1B\u957F\u6309\uFF08\u53F3\u952E\uFF09= \u590D\u5236\u4E00\u4EFD / \u5220\u6389": {
        readonly en: "Tap = use it; long-press (right-click) = duplicate / delete";
    };
    readonly "\u70B9 = \u62F7\u4E00\u4EFD\u5230\u8FD9\u4E2A\u58F0\u90E8\u3001\u6362\u4E0A\uFF08\u300C{from}\u300D\u90A3\u8FB9\u4E0D\u52A8\uFF09": {
        readonly en: "Tap = copy it to this part and use it (the one on “{from}” stays as it is)";
    };
    readonly "\u5728 {from} \u4E0A": {
        readonly en: "on {from}";
    };
    readonly "\u5F00\u7740\uFF1A\u76EE\u5F55\u91CC\u6CA1\u6709\u8C01\u80FD\u6F14\uFF08\u8FDE\u5E73\u66FF\u4E5F\u6CA1\u6709\uFF09\u7684\u4E50\u5668\u4E0D\u5217\u51FA\u6765\uFF08\u8FD9\u4E00\u9875\u85CF\u4E86 {n} \u4EF6\uFF09\u3002\u70B9\u4E00\u4E0B = \u5168\u5217\u51FA\u6765": {
        readonly en: "On: instruments nobody in the catalog can perform (not even a stand-in) are hidden ({n} hidden here). Tap to list everything";
    };
    readonly "\u5173\u7740\uFF1A\u6240\u6709\u4E50\u5668\u90FD\u5217\u51FA\u6765\uFF0C\u6CA1\u6709\u8C01\u80FD\u6F14\u7684\u4E5F\u5728\u3002\u70B9\u4E00\u4E0B = \u85CF\u8D77\u6765": {
        readonly en: "Off: every instrument is listed, including ones nobody can perform. Tap to hide them";
    };
    readonly "{label} \u00B7 {n} \u4EF6": {
        readonly en: "{label} · {n}";
    };
    readonly "\u6CA1\u6709\u53EB\u300C{q}\u300D\u7684\u80FD\u6F14\u7684\u4E50\u5668\uFF08\u85CF\u7740 {n} \u4EF6\u6CA1\u6709\u8C01\u80FD\u6F14\u7684\uFF1A\u5173\u6389\u300C\u9690\u85CF\u627E\u4E0D\u5230\u7684\u300D\u80FD\u770B\u5230\uFF09": {
        readonly en: "No playable instrument named “{q}” ({n} with no performer are hidden — turn off “Hide unavailable” to see them)";
    };
    readonly "\u6CA1\u6709\u53EB\u300C{q}\u300D\u7684": {
        readonly en: "Nothing named “{q}”";
    };
    readonly 收起这一组: {
        readonly en: "Collapse this group";
    };
    readonly "\u5C55\u5F00\u8FD9\u4E00\u7EC4\uFF08\u522B\u7684\u6536\u8D77\uFF09": {
        readonly en: "Expand this group (others collapse)";
    };
    readonly 顶替: {
        readonly en: "Substitute";
    };
    readonly 用它放这条声部的开头: {
        readonly en: "Plays the start of this part with it";
    };
    readonly "\u25B6 \u542C\u5F00\u5934": {
        readonly en: "▶ Hear the start";
    };
    readonly "\u5148\u4E0D\u6362\uFF1A\u52A0\u4E00\u4E2A\u65B0\u58F0\u90E8\u653E\u5B83\uFF0C\u5F00\u300C\u5F39\u300D\u770B\u7740\u8C31\u5F39\u7740\u8BD5\uFF08\u53F0\u4E0A\u8FD9\u4F4D\u4E0D\u52A8\uFF09": {
        readonly en: "Don't swap yet: add a new part with it and turn on Play to try it along with the score (the current performer stays)";
    };
    readonly 加成新声部试试: {
        readonly en: "Try as a new part";
    };
    readonly "\uFF0B \u58F0\u90E8": {
        readonly en: "＋ Part";
    };
    readonly "\u9009\u5B83\u6765\u6F14\u8FD9\u4E2A\u58F0\u90E8\uFF08\u76EE\u5F55\u4E0D\u5173\uFF0C\u53EF\u4EE5\u63A5\u7740\u6362\uFF09": {
        readonly en: "Use it for this part (the catalog stays open)";
    };
    readonly 选这个: {
        readonly en: "Choose this";
    };
    readonly 鼓组: {
        readonly en: "Drum kits";
    };
    readonly "\u53D8\u4F53\uFF08bank {b}\uFF09": {
        readonly en: "Variations (bank {b})";
    };
    readonly "{name}\uFF08{n} \u4EF6\uFF09": {
        readonly en: "{name} ({n} items)";
    };
    readonly "\u6536\u8D77\u8FD9\u4E2A\u6587\u4EF6\uFF08\u5B57\u8282\u653E\u6389\uFF0C\u8981\u518D\u7528\u5C31\u91CD\u65B0\u6253\u5F00\uFF09": {
        readonly en: "Close this file (its bytes are dropped; open it again to use it)";
    };
    readonly 收起这个文件: {
        readonly en: "Close this file";
    };
    readonly "\u9009\u7684\u90A3\u4E00\u4EF6\u5207\u51FA\u6765\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u91CC\u53EA\u8BB0\u6765\u6E90\uFF08\u6B4C\u5C0F\uFF09\u3002\u8981\u6B4C\u81EA\u5DF1\u5E26\u7740\u58F0\u97F3 = \u6587\u4EF6\u83DC\u5355\u300C\u5168\u90E8\u6253\u5305\u8FDB\u6B4C\u300D\uFF0C\u6216\u5BFC\u51FA\u300C\u6253\u5305\u97F3\u6E90\u300D\u7684\u526F\u672C\u3002": {
        readonly en: "The one you choose is cut out and kept on this device; the song only records where it came from (keeps the song small). To make the song carry the sound itself: File menu → “Pack everything into the song”, or save an .mxl copy (packed sounds).";
    };
    readonly "\u5728\u8FD9\u79CD\u98CE\u91CC\u9876\u66FF\u300C{asName}\u300D": {
        readonly en: "Substitutes for “{asName}” in this style";
    };
    readonly "\u9876 {asName}": {
        readonly en: "Subs for {asName}";
    };
    readonly "\u7EA6 ": {
        readonly en: "c. ";
    };
    readonly "\u5531\u6B4C\u8BCD\uFF1B\u6CA1\u5199\u6B4C\u8BCD\u7684\u97F3\u6309\u300C\u54FC\u7684\u5B57\u300D\u5531": {
        readonly en: "Sings lyrics; notes without lyrics use the “Hum syllable”";
    };
    readonly "\u53EA\u54FC\u300C\u54FC\u7684\u5B57\u300D\u3001\u4E0D\u5531\u6B4C\u8BCD\uFF1B\u8F7B\uFF0C\u7834\u8BBE\u5907\u4E5F\u5E26\u5F97\u52A8": {
        readonly en: "Only hums the hum syllable, no lyrics; light enough for older devices";
    };
    readonly "\u9F13\u4EF6 \u00B7 {gmName}\uFF08Standard \u9F13\u7EC4\u7684 {note} \u53F7\u952E\uFF09": {
        readonly en: "Drum piece · {gmName} (key {note} of the Standard kit)";
    };
    readonly "\u9F13\u7EC4 \u00B7 {gmName}": {
        readonly en: "Drum kit · {gmName}";
    };
    readonly "\u9876\u66FF{p}{reason}": {
        readonly en: "Substitute{p}{reason}";
    };
    readonly "\uFF08GM \u539F\u6587\u8BA4\u53EF\uFF09": {
        readonly en: " (GM original accepts it)";
    };
    readonly "\uFF08\u524D\u8EAB\uFF09": {
        readonly en: " (predecessor)";
    };
    readonly "\uFF08\u4EFF\u58F0\uFF09": {
        readonly en: " (imitation)";
    };
    readonly "\uFF08\u540C\u7C7B\uFF09": {
        readonly en: " (same type)";
    };
    readonly "\uFF08\u53EA\u662F\u540C\u540D\uFF09": {
        readonly en: " (same name only)";
    };
    readonly 目录里还没有谁能演它: {
        readonly en: "Nobody in the catalog can perform it yet";
    };
    readonly 合: {
        readonly en: "Join";
    };
    readonly "\u8FD9\u4E2A\u5B57\u5E76\u8FDB\u524D\u4E00\u4E2A\u97F3\uFF08\u4E00\u4E2A\u97F3\u4E0A\u51E0\u4E2A\u5B57\uFF09\uFF1B\u8FD9\u4E00\u53E5\u540E\u9762\u7684\u5B57\u5F80\u524D\u632A\u4E00\u4E2A\u97F3": {
        readonly en: "Merges this syllable into the previous note (several syllables on one note); later syllables in this phrase shift forward one note";
    };
    readonly "\u6324\u4E86\uFF1A\u6309\u8282\u594F\u6392\uFF0C\u8FD9\u4E2A\u5B57\u653E\u4E0D\u4E0B\uFF08\u7EB8\u7684\u8BBE\u7F6E\u91CC\u6362\u6210\u300C\u6309\u6B4C\u8BCD\u300D= \u628A\u97F3\u63A8\u5F00\uFF09": {
        readonly en: "Crowded: laid out by rhythm, this syllable doesn't fit (in sheet settings, “By lyrics” pushes notes apart)";
    };
    readonly 无升降: {
        readonly en: "No accidentals";
    };
    readonly "\u6309\u8FD9\u4E2A\u901F\u5EA6\u6446\uFF1A\u6446\u5230\u4E00\u5934 = \u4E00\u62CD": {
        readonly en: "Swinging at this tempo: one end of the swing = one beat";
    };
    readonly 确定: {
        readonly en: "OK";
    };
    readonly "\u62E8\u901F\u5EA6\uFF1A\u4E00\u683C = 1\uFF0C\u4E00\u7529\u6ED1\u4E00\u5927\u6BB5": {
        readonly en: "Dial the tempo: one notch = 1, a flick covers more";
    };
    readonly "{from} \u8D77": {
        readonly en: "from {from}";
    };
    readonly 弦乐: {
        readonly en: "Strings";
    };
    readonly 铜管: {
        readonly en: "Brass";
    };
    readonly 木管: {
        readonly en: "Woodwinds";
    };
    readonly 弹拨: {
        readonly en: "Plucked";
    };
    readonly 打击: {
        readonly en: "Percussion";
    };
    readonly "\u6709\u97F3\u9AD8\u6253\u51FB / \u94C3": {
        readonly en: "Pitched percussion / bells";
    };
    readonly "\u97F3\u6548 / \u5176\u4ED6": {
        readonly en: "Sound effects / other";
    };
    readonly 自动低切: {
        readonly en: "Auto low cut";
    };
    readonly "\u8DDF\u901F\u5EA6\uFF08\u51E0\u62CD\u4E00\u6B21\uFF1B0 = \u7528\u4E0A\u9762\u7684\u6BEB\u79D2\uFF09": {
        readonly en: "Follow tempo (beats per echo; 0 = use the ms above)";
    };
    readonly "\u81EA\u52A8\u4F4E\u5207\uFF1A\u6309\u8FD9\u4E2A\u58F0\u90E8\u6700\u4F4E\u7684\u97F3\u653E\u4F4E\u5207\uFF08\u5F80\u4E0B\u5927\u4E09\u5EA6\uFF09\uFF0C\u5207\u6389\u5B83\u7528\u4E0D\u7740\u7684\u4F4E\u9891\u2014\u2014\u9686\u9686\u58F0\u3001\u548C\u522B\u7684\u8F68\u7CCA\u5728\u4E00\u8D77\u7684\u4F4E\u9891": {
        readonly en: "Auto low cut: sets the low cut from this part's lowest note (a major third below), removing lows it doesn't use — rumble and lows that muddy other tracks";
    };
    readonly "\u4F4E\u5207\uFF1A\u8FD9\u4E2A\u9891\u7387\u4EE5\u4E0B\u7684\u90FD\u5207\u6389\u3002\u4EBA\u58F0\u5E38\u5728 80\u2013120 Hz\uFF0C\u94C3\u8FD9\u7C7B\u9AD8\u7684\u4E50\u5668\u53EF\u4EE5\u66F4\u9AD8\uFF1B\u6700\u5DE6 = \u5173": {
        readonly en: "Low cut: removes everything below this frequency. Voices are often 80–120 Hz; high instruments like bells can go higher; far left = off";
    };
    readonly "\u9AD8\u5207\uFF1A\u8FD9\u4E2A\u9891\u7387\u4EE5\u4E0A\u7684\u90FD\u5207\u6389\uFF0C\u53BB\u523A\u8033\u3001\u5636\u5636\u58F0\uFF1B\u6700\u5DE6 = \u5173": {
        readonly en: "High cut: removes everything above this frequency, for harshness and hiss; far left = off";
    };
    readonly "\u4F4E\u67B6\uFF1A\u8F6C\u6298\u9891\u7387\u4EE5\u4E0B\u6574\u4F53\u52A0 / \u51CF\u591A\u5C11\u3002\u51CF = \u53BB\u95F7\u3001\u7ED9\u522B\u7684\u8F68\u8BA9\u51FA\u4F4E\u9891\uFF1B\u52A0 = \u52A0\u539A": {
        readonly en: "Low shelf: boosts / cuts everything below the corner. Cut = less muddy, leaves lows for other tracks; boost = thicker";
    };
    readonly "\u4F4E\u67B6\u7684\u8F6C\u6298\u9891\u7387\uFF1A\u4ECE\u8FD9\u91CC\u5F80\u4E0B\u7B97\u300C\u4F4E\u300D": {
        readonly en: "Low shelf corner: “low” counts down from here";
    };
    readonly "\u4E2D\u5CF0\uFF1A\u5728\u4E00\u4E2A\u9891\u6BB5\u4E0A\u63A8 / \u6316\u591A\u5C11\u3002\u4E24\u6837\u4E1C\u897F\u7CCA\u5728\u4E00\u8D77\u65F6\uFF0C\u5728\u5176\u4E2D\u4E00\u4E2A\u4E0A\u6316\u4E00\u5200\u7ED9\u53E6\u4E00\u4E2A\u8BA9\u4F4D": {
        readonly en: "Mid peak: boosts / cuts one band. When two things blur together, cut one to make room for the other";
    };
    readonly "\u4E2D\u5CF0\u7684\u4E2D\u5FC3\u9891\u7387\uFF1A\u63A8 / \u6316\u7684\u662F\u54EA\u4E00\u6BB5": {
        readonly en: "Mid peak center: which band is boosted / cut";
    };
    readonly "\u4E2D\u5CF0\u7684\u5BBD\u7A84\uFF1AQ \u8D8A\u5927\u8D8A\u7A84\uFF081 \u2248 \u4E00\u4E2A\u591A\u516B\u5EA6\u5BBD\uFF0C4 \u2248 \u5C0F\u534A\u4E2A\u516B\u5EA6\uFF09": {
        readonly en: "Mid peak width: higher Q is narrower (1 ≈ a bit over an octave, 4 ≈ under half an octave)";
    };
    readonly "\u9AD8\u67B6\uFF1A\u8F6C\u6298\u9891\u7387\u4EE5\u4E0A\u6574\u4F53\u52A0 / \u51CF\u591A\u5C11\u3002\u52A0 = \u4EAE\u3001\u51CF = \u6697": {
        readonly en: "High shelf: boosts / cuts everything above the corner. Boost = brighter, cut = darker";
    };
    readonly "\u9AD8\u67B6\u7684\u8F6C\u6298\u9891\u7387\uFF1A\u4ECE\u8FD9\u91CC\u5F80\u4E0A\u7B97\u300C\u9AD8\u300D": {
        readonly en: "High shelf corner: “high” counts up from here";
    };
    readonly "\u9608\u503C\uFF1A\u58F0\u97F3\u8D85\u8FC7\u8FD9\u4E2A\u7535\u5E73\u624D\u5F00\u59CB\u538B\uFF1B\u8D8A\u4F4E\uFF0C\u538B\u5230\u7684\u8D8A\u591A": {
        readonly en: "Threshold: compression starts above this level; lower compresses more";
    };
    readonly "\u6BD4\u4F8B\uFF1A\u8D85\u8FC7\u9608\u503C\u7684\u90E8\u5206\u538B\u6210\u51E0\u5206\u4E4B\u4E00\uFF084:1 = \u8D85\u51FA 4 dB \u7684\u53EA\u5269 1 dB\uFF09": {
        readonly en: "Ratio: how much the part above the threshold is reduced (4:1 = 4 dB over becomes 1 dB)";
    };
    readonly "\u8D77\u538B\uFF1A\u8D85\u8FC7\u9608\u503C\u4E4B\u540E\u591A\u5FEB\u538B\u4E0B\u53BB\u3002\u77ED = \u8FDE\u5B57\u5934\u4E00\u8D77\u538B\u5E73\uFF1B\u957F = \u8BA9\u5B57\u5934\u5148\u51B2\u51FA\u6765\u3001\u66F4\u6709\u52B2": {
        readonly en: "Attack: how fast it compresses after crossing the threshold. Short = flattens word onsets too; long = lets onsets punch through";
    };
    readonly "\u653E\u5F00\uFF1A\u58F0\u97F3\u843D\u56DE\u9608\u503C\u4EE5\u4E0B\u4E4B\u540E\u591A\u5FEB\u677E\u5F00\u3002\u592A\u77ED\u4F1A\u4E00\u62BD\u4E00\u62BD\u7684\uFF0C\u592A\u957F\u4E0B\u4E00\u4E2A\u5B57\u4E5F\u88AB\u538B\u7740": {
        readonly en: "Release: how fast it lets go after falling below the threshold. Too short pumps; too long keeps the next word compressed too";
    };
    readonly "\u62D0\u70B9\uFF1A\u9608\u503C\u9644\u8FD1\u8FD9\u4E48\u5BBD\u7684\u4E00\u6BB5\u91CC\u6162\u6162\u5F00\u59CB\u538B\uFF08\u8F6F\uFF09\uFF1B0 = \u4E00\u5230\u9608\u503C\u5C31\u538B\uFF08\u786C\uFF09": {
        readonly en: "Knee: compression eases in over this width around the threshold (soft); 0 = kicks in right at the threshold (hard)";
    };
    readonly "\u8865\u507F\uFF1A\u538B\u5B8C\u6574\u4F53\u52A0\u56DE\u6765\u591A\u5C11\uFF08\u538B\u7F29\u4F1A\u8BA9\u6574\u4F53\u53D8\u8F7B\uFF09": {
        readonly en: "Makeup: how much to add back after compressing (compression makes things quieter overall)";
    };
    readonly "\u6DF7\u54CD\u65F6\u95F4\uFF08RT60\uFF09\uFF1A\u58F0\u97F3\u505C\u4E86\u4E4B\u540E\uFF0C\u5C3E\u5DF4\u8870\u51CF 60 dB \u8981\u591A\u4E45\u3002\u5C0F\u623F\u95F4\u4E0D\u5230 1 \u79D2\uFF0C\u5927\u5385 2\u20133 \u79D2\uFF0C\u6559\u5802\u66F4\u957F": {
        readonly en: "Reverb time (RT60): how long the tail takes to fall 60 dB after the sound stops. Small rooms under 1 s, halls 2–3 s, churches longer";
    };
    readonly "\u9AD8\u9891\u4ECE\u8FD9\u91CC\u5F00\u59CB\u8870\u51CF\uFF1A\u771F\u5B9E\u7684\u623F\u95F4\u91CC\u9AD8\u9891\u88AB\u5438\u6536\u5F97\u5FEB\uFF0C\u5C3E\u5DF4\u8D8A\u5F80\u540E\u8D8A\u6697\uFF1B\u6570\u8D8A\u4F4E\u8D8A\u6697": {
        readonly en: "Highs start fading from here: real rooms absorb highs fast, so the tail gets darker; lower is darker";
    };
    readonly "\u6E7F\uFF1A\u6DF7\u54CD\u7684\u58F0\u97F3\u6709\u591A\u54CD": {
        readonly en: "Wet: how loud the reverb is";
    };
    readonly "\u539F\u58F0\uFF1A\u539F\u6765\u7684\u58F0\u97F3\u7559\u591A\u5C11\u3002\u63D2\u5728\u58F0\u90E8\u8F68\u4E0A\u4E00\u822C 0 dB\uFF08\u4E0D\u52A8\uFF09\uFF1B\u5F53\u53D1\u9001\u7684\u8FD4\u56DE\u8F68\u7528 = \u5173": {
        readonly en: "Dry: how much of the original to keep. Usually 0 dB (untouched) on a part's track; off on a send's return track";
    };
    readonly "\u9884\u5EF6\u8FDF\uFF1A\u539F\u58F0\u4E4B\u540E\u8FC7\u591A\u4E45\u6DF7\u54CD\u624D\u8FDB\u6765\u3002\u62C9\u5F00\u4E00\u70B9\uFF0C\u4EBA\u58F0\u66F4\u6E05\u695A\u3001\u4E0D\u88AB\u7CCA\u4F4F": {
        readonly en: "Pre-delay: how long after the dry sound the reverb comes in. A little keeps voices clear and not smeared";
    };
    readonly "\u5BBD\u5EA6\uFF1A\u6DF7\u54CD\u5728\u5DE6\u53F3\u94FA\u591A\u5F00": {
        readonly en: "Width: how far the reverb spreads left and right";
    };
    readonly "\u8DDF\u901F\u5EA6\uFF1A\u56DE\u58F0\u9694\u51E0\u62CD\uFF0C\u6309\u6B4C\u7684\u901F\u5EA6\u7B97\u65F6\u95F4\uFF1B0 = \u7528\u4E0B\u9762\u7684\u6BEB\u79D2": {
        readonly en: "Follow tempo: beats between echoes, timed from the song's tempo; 0 = use the ms below";
    };
    readonly "\u65F6\u95F4\uFF1A\u6BCF\u6B21\u56DE\u58F0\u9694\u591A\u4E45": {
        readonly en: "Time: the gap between echoes";
    };
    readonly "\u6BCF\u6B21\u56DE\u58F0\uFF1A\u6BCF\u91CD\u590D\u4E00\u6B21\u8F7B\u591A\u5C11 dB\uFF1B\u8D8A\u63A5\u8FD1 0\uFF0C\u56DE\u58F0\u8D8A\u4E45": {
        readonly en: "Each echo: how many dB softer per repeat; closer to 0 lasts longer";
    };
    readonly "\u6E7F\uFF1A\u56DE\u58F0\u6709\u591A\u54CD": {
        readonly en: "Wet: how loud the echoes are";
    };
    readonly "\u53CD\u9988\u9AD8\u5207\uFF1A\u6BCF\u6B21\u56DE\u58F0\u90FD\u628A\u8FD9\u4E2A\u9891\u7387\u4EE5\u4E0A\u7684\u524A\u6389\u4E00\u70B9\uFF0C\u8D8A\u5F80\u540E\u8D8A\u6697\uFF08\u50CF\u771F\u7684\u56DE\u58F0\uFF09": {
        readonly en: "Feedback high cut: each echo loses a bit above this frequency, getting darker over time (like real echoes)";
    };
    readonly "\u51E0\u6761\uFF1A\u540C\u65F6\u6709\u51E0\u4E2A\u7A0D\u5FAE\u9519\u5F00\u7684\u526F\u672C": {
        readonly en: "Voices: how many slightly offset copies at once";
    };
    readonly "\u5EF6\u8FDF\uFF1A\u526F\u672C\u6BD4\u539F\u58F0\u665A\u591A\u5C11": {
        readonly en: "Delay: how much later the copies are than the dry sound";
    };
    readonly "\u6296\u52A8\u6DF1\u5EA6\uFF1A\u526F\u672C\u7684\u5EF6\u8FDF\u6765\u56DE\u6643\u591A\u5927\u2014\u2014\u6643 = \u97F3\u9AD8\u8F7B\u5FAE\u8D77\u4F0F\uFF0C\u50CF\u597D\u51E0\u4E2A\u4EBA\u5531\u4E0D\u9F50": {
        readonly en: "Depth: how far each copy's delay wobbles — wobble = slight pitch movement, like several people not quite together";
    };
    readonly "\u6296\u52A8\u5FEB\u6162\uFF1A\u6BCF\u79D2\u6643\u51E0\u6B21": {
        readonly en: "Rate: wobbles per second";
    };
    readonly "\u5DE6\u53F3\u94FA\u5F00\uFF1A\u526F\u672C\u6446\u5F97\u591A\u5F00": {
        readonly en: "Spread: how wide the copies are placed";
    };
    readonly "\u6E7F\uFF1A\u526F\u672C\u6709\u591A\u54CD": {
        readonly en: "Wet: how loud the copies are";
    };
    readonly "\u589E\u76CA\uFF1A\u5355\u7EAF\u8C03\u5927\u8C03\u5C0F\uFF08\u524D\u9762\u7684\u63D2\u4EF6\u628A\u97F3\u91CF\u6539\u4E86\uFF0C\u7528\u5B83\u8865\u56DE\u6765\uFF09": {
        readonly en: "Gain: plain louder / softer (to make up for level changed by earlier plugins)";
    };
    readonly "\u6DF7\u54CD\u65F6\u95F4\uFF08RT60\uFF09": {
        readonly en: "Reverb time (RT60)";
    };
    readonly 高频从这里开始衰减: {
        readonly en: "Highs fade from here";
    };
    readonly "\u4E0D\u8870\u51CF\uFF0820 kHz \u4EE5\u4E0A\uFF09": {
        readonly en: "No fade (above 20 kHz)";
    };
    readonly "\u6E7F\uFF08\u6548\u679C\uFF09": {
        readonly en: "Wet (effect)";
    };
    readonly 每次回声: {
        readonly en: "Each echo";
    };
    readonly "{v} dB / \u6B21": {
        readonly en: "{v} dB / echo";
    };
    readonly "\u5BBD\u5EA6\uFF080 = \u5355\u58F0\u9053\uFF0C100% = \u5DE6\u53F3\u94FA\u6EE1\uFF09": {
        readonly en: "Width (0 = mono, 100% = full stereo)";
    };
    readonly "\u5DE6\u53F3\u94FA\u5F00\uFF080 = \u90FD\u5728\u4E2D\u95F4\uFF0C100% = \u94FA\u5230\u4E24\u8FB9\uFF09": {
        readonly en: "Spread (0 = all center, 100% = full width)";
    };
    readonly "{v} \u6761": {
        readonly en: "{v} {v|voice|voices}";
    };
    readonly "\u5207\u6389\u8FD9\u4E2A\u58F0\u90E8\u7528\u4E0D\u7740\u7684\u4F4E\u9891\uFF1A\u4F4E\u5207\u653E\u5728\u5B83\u6700\u4F4E\u7684\u97F3\u5F80\u4E0B\u4E00\u70B9": {
        readonly en: "Removes lows this part doesn't use: the low cut sits a bit below its lowest note";
    };
    readonly "\u539A \u2194 \u4EAE": {
        readonly en: "Warm ↔ Bright";
    };
    readonly "\u5F80\u5DE6 = \u539A\uFF08\u4F4E\u7684\u591A\u4E00\u70B9\u3001\u9AD8\u7684\u5C11\u4E00\u70B9\uFF09\uFF0C\u5F80\u53F3 = \u4EAE\uFF1B\u4E2D\u95F4 = \u4E0D\u52A8": {
        readonly en: "Left = warmer (more lows, fewer highs), right = brighter; center = unchanged";
    };
    readonly 平: {
        readonly en: "Flat";
    };
    readonly "\u539A {p} dB": {
        readonly en: "Warm {p} dB";
    };
    readonly "\u4EAE {p} dB": {
        readonly en: "Bright {p} dB";
    };
    readonly 让多少: {
        readonly en: "Duck by";
    };
    readonly 压多少: {
        readonly en: "Compress by";
    };
    readonly "\u88AB\u90A3\u6761\u8F68\u538B\uFF1A\u5B83\u4E00\u54CD\uFF0C\u8FD9\u6761\u5C31\u8BA9\u51FA\u6765\uFF1B\u5F80\u53F3 = \u8BA9\u5F97\u8D8A\u591A\uFF08\u4E0D\u8865\u507F\uFF1A\u5B83\u4E0D\u54CD\u7684\u65F6\u5019\u8FD9\u6761\u7167\u63A8\u5B50\u7684\u97F3\u91CF\uFF09": {
        readonly en: "Compressed by that track: when it sounds, this one makes way; right = makes way more (no makeup: when it's silent this one sits at the fader level)";
    };
    readonly "\u628A\u5FFD\u5927\u5FFD\u5C0F\u62C9\u5E73\uFF1A\u5F80\u53F3 = \u538B\u5F97\u8D8A\u72E0\uFF08\u54CD\u7684\u5B57\u538B\u4E0B\u6765\u3001\u8F7B\u7684\u76F8\u5BF9\u663E\u51FA\u6765\uFF09": {
        readonly en: "Evens out loud and soft: right = harder (loud syllables come down, soft ones stand out more)";
    };
    readonly "{thresholdDb} dB \u8D77\u538B \u00B7 {ratio}:1": {
        readonly en: "Compresses from {thresholdDb} dB · {ratio}:1";
    };
    readonly 远近: {
        readonly en: "Distance";
    };
    readonly "\u5F80\u53F3 = \u8D8A\u8FDC\u3001\u8D8A\u5927\u7684\u623F\u95F4\uFF08\u94C3\u53EF\u4EE5\u8FDC\u4E00\u70B9\uFF0C\u8D34\u8033\u7684\u4EBA\u58F0\u8FD1\u4E00\u70B9\uFF09\uFF1B\u539F\u58F0\u4E0D\u52A8\uFF0C\u53EA\u5F80\u4E0A\u52A0\u6DF7\u54CD": {
        readonly en: "Right = farther, in a bigger room (bells can be distant, close vocals near); the dry sound stays, reverb is only added on top";
    };
    readonly "\u6E7F {mix} \u00B7 {room} s": {
        readonly en: "Wet {mix} · {room} s";
    };
    readonly 回声多少: {
        readonly en: "Echo amount";
    };
    readonly "\u5F80\u53F3 = \u56DE\u58F0\u8D8A\u54CD\u3001\u8D8A\u4E45\uFF1B\u539F\u58F0\u4E0D\u52A8": {
        readonly en: "Right = louder, longer echoes; the dry sound stays";
    };
    readonly "\u6E7F {mix} \u00B7 \u6BCF\u6B21 {feedback} dB": {
        readonly en: "Wet {mix} · each {feedback} dB";
    };
    readonly 几拍一次: {
        readonly en: "Beats per echo";
    };
    readonly "\u56DE\u58F0\u548C\u62CD\u5B50\u5BF9\u9F50\uFF08\u8DDF\u7740\u6B4C\u7684\u901F\u5EA6\uFF09": {
        readonly en: "Aligns echoes with the beat (follows the song's tempo)";
    };
    readonly 附点八分: {
        readonly en: "Dotted eighth";
    };
    readonly 宽: {
        readonly en: "Wide";
    };
    readonly "\u5F80\u53F3 = \u8D8A\u5BBD\u3001\u8D8A\u50CF\u597D\u51E0\u4E2A\u4EBA\uFF1B\u539F\u58F0\u4E0D\u52A8": {
        readonly en: "Right = wider, more like several people; the dry sound stays";
    };
    readonly "\u6E7F {mix} \u00B7 \u6296\u52A8 {depthMs} ms": {
        readonly en: "Wet {mix} · depth {depthMs} ms";
    };
    readonly "\u63D2\u4EF6\u94FE\u4E2D\u95F4\u5355\u7EAF\u8C03\u5927\u8C03\u5C0F\uFF08\u524D\u9762\u7684\u63D2\u4EF6\u628A\u97F3\u91CF\u6539\u4E86\uFF0C\u7528\u5B83\u8865\u56DE\u6765\uFF09": {
        readonly en: "Plain louder / softer inside the plugin chain (to make up for level changed by earlier plugins)";
    };
    readonly 混响时间: {
        readonly en: "Reverb time";
    };
    readonly "\u5C3E\u5DF4\u8870\u51CF 60 dB \u8981\u591A\u4E45\uFF08RT60\uFF09\uFF1A\u5F80\u53F3 = \u8D8A\u5927\u7684\u623F\u95F4\uFF08\u53D1\u591A\u5C11\u7531\u53D1\u9001\u90A3\u8FB9\u7684\u65CB\u94AE\u7BA1\uFF09": {
        readonly en: "How long the tail takes to fall 60 dB (RT60): right = bigger room (how much is sent is set on the send knob)";
    };
    readonly 回声多长: {
        readonly en: "Echo length";
    };
    readonly "\u5F80\u53F3 = \u56DE\u58F0\u91CD\u590D\u5F97\u8D8A\u4E45\uFF08\u53D1\u591A\u5C11\u7531\u53D1\u9001\u90A3\u8FB9\u7684\u65CB\u94AE\u7BA1\uFF09": {
        readonly en: "Right = echoes repeat longer (how much is sent is set on the send knob)";
    };
    readonly "\u6BCF\u6B21 {e} dB": {
        readonly en: "Each {e} dB";
    };
    readonly "\u5F80\u53F3 = \u8D8A\u5BBD\u3001\u8D8A\u50CF\u597D\u51E0\u4E2A\u4EBA\uFF08\u53D1\u591A\u5C11\u7531\u53D1\u9001\u90A3\u8FB9\u7684\u65CB\u94AE\u7BA1\uFF09": {
        readonly en: "Right = wider, more like several people (how much is sent is set on the send knob)";
    };
    readonly "\u6296\u52A8 {w} ms": {
        readonly en: "Depth {w} ms";
    };
    readonly "{name}\uFF08\u5173\uFF09": {
        readonly en: "{name} (off)";
    };
    readonly "{name}\uFF08\u5168\u91CF\uFF09": {
        readonly en: "{name} (full)";
    };
    readonly " \u4F4E\u5207": {
        readonly en: " low cut";
    };
    readonly "\uFF08\u5E73\uFF09": {
        readonly en: " (flat)";
    };
    readonly " \u539A": {
        readonly en: " warm";
    };
    readonly " \u4EAE": {
        readonly en: " bright";
    };
    readonly "\u8C31\u79CD\u548C\u7EB8\uFF1A{paperLabel}": {
        readonly en: "Notation and paper: {paperLabel}";
    };
    readonly 这一段的菜单: {
        readonly en: "This section's menu";
    };
    readonly "\u9690\u85CF {n}": {
        readonly en: "{n} hidden";
    };
    readonly "\u8FD9\u4E00\u6BB5\u6709 {n} \u4F4D\u9690\u85CF\u7740\uFF08\u4E0D\u6392\u3001\u4E0D\u5360\u5730\u65B9\uFF09\uFF1A\u70B9\u5F00\u770B\u662F\u8C01\u3001\u653E\u51FA\u6765": {
        readonly en: "{n} {n|part is|parts are} hidden in this section (not laid out, no space taken): tap to see who and show them";
    };
    readonly 上一段: {
        readonly en: "Previous section";
    };
    readonly 下一段: {
        readonly en: "Next section";
    };
    readonly "\u53EA\u770B\u672C\u6BB5\uFF08\u518D\u70B9 = \u770B\u5168\u90E8\u66F2\u6BB5\uFF09": {
        readonly en: "Show only this section (tap again = all sections)";
    };
    readonly 只看本段: {
        readonly en: "Show only this section";
    };
    readonly 曲段名: {
        readonly en: "Section name";
    };
    readonly "\u8FD9\u4E00\u6BB5\u9690\u85CF\u7740\uFF1A\u4E0D\u653E\u3001\u4E0D\u5370\uFF08\u300C\u22EF\u300D\u91CC\u80FD\u653E\u51FA\u6765\uFF09": {
        readonly en: "This section is hidden: not played, not printed (unhide it from “⋯”)";
    };
    readonly "\uFF08\u8FD9\u5F20\u7EB8\u4E0A\u6CA1\u6709\u58F0\u90E8\uFF09": {
        readonly en: "(no parts on this sheet)";
    };
    readonly "\uFF0B \u65B0\u66F2\u6BB5": {
        readonly en: "＋ New section";
    };
    readonly 歌名: {
        readonly en: "Title";
    };
    readonly 作者: {
        readonly en: "Author";
    };
    readonly "\u4E0D\u5199 = \u6BCF\u5F20\u7EB8\u6309\u987A\u5E8F\u5404\u653E\u4E00\u904D\uFF08\u4F8B\uFF1A\u524D\u594F (A A1)\u00D73 A A2 [\u526F\u6B4C]\uFF09": {
        readonly en: "Empty = each sheet plays once in order (e.g. Intro (A A1)×3 A A2 [Chorus])";
    };
    readonly "\u5C0F\u8C03\uFF1A\u548C\u5F26\u7EA7\u6570\u4ECE la \u6570\u3002\u70B9 = \u8C31\u53F7 / \u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6": {
        readonly en: "Minor: chord degrees count from la. Tap = clef / key / time / tempo";
    };
    readonly "\u8FD9\u91CC\u662F C \u8C03\uFF08\u6CA1\u6709\u5347\u964D\u53F7\uFF09\uFF1A\u70B9 = \u8C31\u53F7 / \u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6": {
        readonly en: "C major here (no sharps or flats): tap = clef / key / time / tempo";
    };
    readonly "\u6709 {n} \u6BB5\u9690\u85CF\u7740\uFF08\u4E0D\u653E\u3001\u4E0D\u5370\u3001\u4E0D\u5360\u5730\u65B9\uFF09\uFF1A\u70B9\u5F00\u53BB\u770B\u6216\u653E\u51FA\u6765": {
        readonly en: "{n} hidden {n|section|sections} (not played, not printed, no space taken): open to go to one or unhide it";
    };
    readonly "\u6709\u4E00\u7EC4\u58F0\u90E8\u6BD4\u4E00\u9875\u80FD\u653E\u7684\u8FD8\u9AD8\uFF0C\u5728\u884C\u548C\u884C\u4E4B\u95F4\u65AD\u5F00\u3001\u63A5\u5230\u4E86\u4E0B\u4E00\u9875\uFF08\u4E0D\u7F29\u5C0F\u3001\u4E0D\u6362\u7EB8\uFF09\uFF1A\u70B9\u5F00\u9875\u9762\u8BBE\u7F6E\u7684\u300C\u7248\u9762\u300D\u9875": {
        readonly en: "A group of parts is taller than a page can hold, so it breaks between staves and continues on the next page (nothing is shrunk, the paper is not changed): tap to open Page settings › Page";
    };
    readonly "\u6F14\u594F\u6CD5\u548C\u8868\u60C5\u73B0\u5728\u4E0D\u663E\u793A\uFF08\u9875\u9762\u8BBE\u7F6E\u300C\u770B\u8C31\u300D\u91CC\u5173\u7740\uFF1B\u64AD\u653E\u7167\u5199\u7684\u6765\uFF09\uFF1A\u70B9\u5F00\u53BB\u6253\u5F00": {
        readonly en: "Articulations & dynamics are hidden right now (turned off under Page settings › Reading; playback follows what's written): tap to change";
    };
    readonly "\u8FD9\u4E00\u5BB6\u5C55\u5F00\u7740\uFF1A\u70B9 = \u53E0\u56DE\u53BB\uFF08\u5149\u6807\u632A\u5230\u4E0B\u4E00\u4F4D\uFF09": {
        readonly en: "This family is spread out: tap = fold it back (the cursor moves to the next part)";
    };
    readonly "\u73B0\u5728\u7684\u7F29\u653E\uFF08100% = \u7EB8\u7684\u5B9E\u9645\u5C3A\u5BF8\uFF09\uFF1B\u70B9 = \u56DE\u5230\u81EA\u52A8\u5927\u5C0F\uFF08Ctrl / \u2318 + 0\uFF09\u3002Ctrl / \u2318 + \u6EDA\u8F6E\u3001\u634F\u5408 = \u7F29\u653E\uFF1BCtrl / \u2318 + = / \u2212 = \u4E00\u6863\u4E00\u6863": {
        readonly en: "Current zoom (100% = the paper's real size); tap = back to auto size (Ctrl / ⌘ + 0). Ctrl / ⌘ + wheel or pinch = zoom; Ctrl / ⌘ + = / − = step by step";
    };
    readonly "\u8D77\u70B9\uFF1A|\u25B6 \u4ECE\u8FD9\u513F\u653E\uFF08\u957F\u6309 / \u53F3\u952E\u7A7A\u767D\u5904\u300C\u4ECE\u8FD9\u513F\u653E\u300D\u632A\u5B83\uFF1B\u7F16\u8F91\u4E0D\u52A8\u5B83\uFF09": {
        readonly en: "Start point: |▶ plays from here (long-press / right-click blank space, “Play from here”, to move it; editing doesn't move it)";
    };
    readonly "\u8FD9\u5F20\u7EB8\u4E0A\u53EA\u6709\u8FD9\u4E00\u5BB6\uFF1A\u6CA1\u6709\u522B\u7684\u58F0\u90E8\u53EF\u4EE5\u632A\u8FC7\u53BB\uFF08\u5207\u5230\u300C\u542C\u300D\u5C31\u90FD\u53E0\u8D77\u6765\uFF09": {
        readonly en: "This sheet only has this family: no other part to move to (switch to “Listen” and they all stack)";
    };
    readonly "\u540E\u9762\u6CA1\u6709\u7A7A\u7740\u7684\u97F3\u4E86\uFF0C\u5B57\u53EA\u80FD\u632A\u5230\u8FD9\u513F": {
        readonly en: "No empty notes after this one, so the syllable can only move this far";
    };
    readonly "\u524D\u9762\u9694\u7740\u53E5\u53F7\uFF08\u6216\u8005\u6CA1\u6709\u97F3\u4E86\uFF09\uFF0C\u5B57\u632A\u4E0D\u8FC7\u53BB": {
        readonly en: "A phrase end is in the way (or no more notes), so the syllable can't move there";
    };
    readonly 强后弱: {
        readonly en: "fp";
    };
    readonly "\u5F80\u4E0A\u4E00\u7EA7\uFF08\u8C03\u5185\uFF09": {
        readonly en: "Up a scale step";
    };
    readonly "\u5F80\u4E0B\u4E00\u7EA7\uFF08\u8C03\u5185\uFF09": {
        readonly en: "Down a scale step";
    };
    readonly 升半音: {
        readonly en: "Up a semitone";
    };
    readonly 降半音: {
        readonly en: "Down a semitone";
    };
    readonly 高八度: {
        readonly en: "Up an octave";
    };
    readonly 低八度: {
        readonly en: "Down an octave";
    };
    readonly 时值减半: {
        readonly en: "Halve durations";
    };
    readonly 时值加倍: {
        readonly en: "Double durations";
    };
    readonly 附点: {
        readonly en: "Dot";
    };
    readonly "\u52A0\u9644\u70B9\uFF08\u90FD\u6709\u9644\u70B9 = \u53BB\u6389\uFF09": {
        readonly en: "Add a dot (all dotted = removes them)";
    };
    readonly "{sel} \u4E2A": {
        readonly en: "{sel} selected";
    };
    readonly "\u64CD\u4F5C\u2026": {
        readonly en: "Actions…";
    };
    readonly 粘贴到光标处: {
        readonly en: "Paste at the cursor";
    };
    readonly 基础: {
        readonly en: "Basics";
    };
    readonly "\u589E\u76CA\u3001\u58F0\u50CF\u3001\u9759\u97F3 / \u72EC\u594F\uFF1A\u5148\u628A\u51E0\u6761\u8F68\u7684\u97F3\u91CF\u6446\u5E73\u3001\u5DE6\u53F3\u6446\u5F00\uFF08\u6DF7\u97F3\u7684\u7B2C\u4E00\u6B65\uFF09": {
        readonly en: "Gain, pan, mute / solo: first balance the tracks' levels and spread them left and right (step one of mixing)";
    };
    readonly "\u6BCF\u6761\u8F68\u7684\u9ED8\u8BA4 EQ\uFF1A\u4E24\u6837\u4E1C\u897F\u7CCA\u5728\u4E00\u8D77\u3001\u592A\u95F7 / \u592A\u523A": {
        readonly en: "Each track's default EQ: for two things blurring together, too muddy / too harsh";
    };
    readonly "\u6BCF\u6761\u8F68\u4E0A\u7684\u7B2C\u4E00\u4E2A\u538B\u7F29\uFF1A\u628A\u5FFD\u5927\u5FFD\u5C0F\u62C9\u5E73": {
        readonly en: "The first compressor on each track: evens out loud and soft";
    };
    readonly 发送: {
        readonly en: "Sends";
    };
    readonly "\u51FA\u5230\u54EA\u3001\u63A8\u5B50\u540E\u53D1\u7ED9\u54EA\u51E0\u6761\u6DF7\u97F3\u8F68\uFF08\u6DF7\u54CD / \u5EF6\u8FDF\u653E\u5728\u6DF7\u97F3\u8F68\u4E0A\uFF0C\u51E0\u6761\u8F68\u5171\u7528\uFF09": {
        readonly en: "Where it outputs, and which buses it sends to post-fader (reverb / delay live on a bus, shared by several tracks)";
    };
    readonly 链: {
        readonly en: "Chain";
    };
    readonly "\u6BCF\u6761\u8F68\u4E0A\u7684\u5168\u90E8\u63D2\u4EF6\u683C\uFF1A\u968F\u4FBF\u63D2\u3001\u5F00\u5173\u3001\u62FF\u6389": {
        readonly en: "All plugin slots on each track: insert anything, toggle, remove";
    };
    readonly "\u589E\u76CA\uFF08\u63A8\u5B50\uFF09\uFF1A\u8FD9\u6761\u8F68\u6574\u4F53\u7684\u97F3\u91CF\u3002\u6DF7\u97F3\u7684\u7B2C\u4E00\u6B65 = \u5148\u628A\u51E0\u6761\u8F68\u7684\u97F3\u91CF\u6446\u5E73": {
        readonly en: "Gain (fader): this track's overall volume. Step one of mixing = balance the tracks' levels first";
    };
    readonly "\u58F0\u50CF\uFF1A\u5728\u5DE6\u53F3\u54EA\u4E2A\u4F4D\u7F6E\u3002\u51E0\u6761\u8F68\u5DE6\u53F3\u9519\u5F00\u4E00\u70B9\uFF0C\u5C31\u4E0D\u4F1A\u90FD\u6324\u5728\u6B63\u4E2D\u95F4\u3002\u6570\u5B57 = \u5F80\u4E00\u8FB9\u63A8\u4E86\u591A\u5C11\uFF08\u7B49\u529F\u7387\uFF1A\u600E\u4E48\u6446\u603B\u54CD\u5EA6\u4E0D\u53D8\uFF09\uFF1A\u4E2D = \u4E24\u4E2A\u5587\u53ED\u5404 \u22123 dB\uFF1B50 = \u8FD9\u8FB9 \u22120.7 dB\u3001\u90A3\u8FB9 \u22128.3 dB\uFF08\u5DEE 7.7 dB\uFF09\uFF1B100 = \u5168\u5728\u8FD9\u8FB9\uFF0C\u53E6\u4E00\u8FB9\u6CA1\u58F0": {
        readonly en: "Pan: where it sits between left and right. Spread tracks a little so they don't all crowd the center. The number = how far it's pushed to one side (equal power: total loudness stays the same): center = −3 dB on each speaker; 50 = this side −0.7 dB, that side −8.3 dB (7.7 dB apart); 100 = all on this side, nothing on the other";
    };
    readonly "\u603B\u8F68\u589E\u76CA\uFF1A\u6240\u6709\u8F68\u6DF7\u5728\u4E00\u8D77\u4E4B\u540E\u6574\u4F53\u518D\u8C03\u5927\u8C03\u5C0F": {
        readonly en: "Master gain: overall louder / softer after all tracks are mixed";
    };
    readonly "\u51FA\u5230\uFF1A\u8FD9\u6761\u8F68\u7684\u58F0\u97F3\u6700\u540E\u53BB\u54EA\u2014\u2014\u76F4\u63A5\u53BB\u603B\u8F68\uFF0C\u6216\u8005\u5148\u8FDB\u4E00\u6761\u6DF7\u97F3\u8F68\uFF08\u5728\u90A3\u91CC\u4E00\u8D77\u8FC7\u6548\u679C\uFF09": {
        readonly en: "Output to: where this track's sound finally goes — straight to master, or into a bus first (to share effects there)";
    };
    readonly "\u53D1\u9001\uFF1A\u63A8\u5B50\u4E4B\u540E\u518D\u590D\u5236\u4E00\u4EFD\u7ED9\u8FD9\u6761\u6DF7\u97F3\u8F68\u2014\u2014\u8DDF\u7740\u8FD9\u6761\u8F68\u7684\u589E\u76CA\u548C\u58F0\u50CF\u8D70\uFF1A\u63A8\u5B50\u62C9\u4F4E 3 dB\uFF0C\u53D1\u8FC7\u53BB\u7684\u4E5F\u4F4E 3 dB\uFF08\u539F\u58F0\u548C\u6548\u679C\u7684\u6BD4\u4F8B\u4E0D\u53D8\uFF09\uFF1B\u9759\u97F3\u4E86\u5C31\u4E0D\u53D1\u3002\u8FD9\u91CC\u7684\u6570 = \u8FD9\u4E00\u4F4D\u8FDB\u90A3\u8FB9\u7684\u91CF\uFF0C\u8D8A\u5927\u90A3\u8FB9\u7684\u6548\u679C\uFF08\u6DF7\u54CD / \u5EF6\u8FDF\uFF09\u8D8A\u591A\uFF1B\u539F\u58F0\u7167\u65E7\u8D70\u300C\u51FA\u5230\u300D": {
        readonly en: "Send: a post-fader copy goes to this bus — it follows this track's gain and pan: pull the fader down 3 dB and the send drops 3 dB too (dry-to-effect ratio stays); muted means no send. The number = how much enters that bus; higher means more of its effect (reverb / delay); the dry sound still goes to “Output to”";
    };
    readonly "\u6DF7\u97F3\u8F68\u589E\u76CA\uFF1A\u4ECE\u8FD9\u6761\u6DF7\u97F3\u8F68\u51FA\u6765\u7684\u603B\u91CF\u3002\u6DF7\u54CD / \u5EF6\u8FDF\u8FD9\u7C7B\u5168\u6E7F\u7684\u6DF7\u97F3\u8F68 = \u90A3\u8FB9\u7684\u6548\u679C\u6709\u591A\u5927\uFF0C\u53D1\u7ED9\u5B83\u7684\u51E0\u4F4D\u4E00\u8D77\u53D8\uFF08\u6BCF\u4F4D\u5355\u72EC\u591A\u5C11\u770B\u5404\u81EA\u7684\u300C\u53D1\u9001\u300D\uFF09\u3002\u8981\u662F\u6709\u51E0\u4F4D\u662F\u300C\u51FA\u5230\u300D\u5B83\uFF08\u539F\u58F0\u4E5F\u8FDB\u6765\uFF09\uFF0C\u90A3\u8FD9\u4E2A\u63A8\u5B50\u8FDE\u539F\u58F0\u4E00\u8D77\u8C03": {
        readonly en: "Bus gain: the total coming out of this bus. For fully wet buses (reverb / delay) = how big the effect is, for everyone sending to it (each one's amount is on their own “Send”). If some parts “Output to” it (dry sound too), this fader moves the dry sound as well";
    };
    readonly "\u9650\u5E45\uFF08\u603B\u8F68\u6700\u540E\u4E00\u9053\uFF09\uFF1A\u8D85\u8FC7\u5929\u82B1\u677F\uFF08\u22120.18 dBFS\uFF09\u7684\u90A3\u4E00\u5C0F\u6BB5\u5F88\u5FEB\u538B\u4E0B\u6765\uFF0C\u4E0D\u8D85\u7684\u5730\u65B9\u4E00\u4E2A\u91C7\u6837\u90FD\u4E0D\u52A8\uFF0C\u4E0D\u6539\u97F3\u8272\u3002\u5173\u6389 = \u8D85\u4E86\u5C31\u524A\u6CE2\uFF08\u7206\u97F3\u3001\u5BFC\u51FA\u7684\u6587\u4EF6\u91CC\u4E5F\u662F\uFF09\u3002\u4E00\u822C\u4E00\u76F4\u5F00\u7740\uFF1B\u60F3\u770B\u81EA\u5DF1\u7684\u6DF7\u97F3\u5230\u5E95\u591A\u54CD\uFF0C\u53EF\u4EE5\u5148\u5173\u4E86\u770B\u5CF0\u503C": {
        readonly en: "Limiter (the final stage on master): quickly brings down the bit that exceeds the ceiling (−0.18 dBFS); everywhere else not one sample changes, and timbre is untouched. Off = clipping when over (crackle, in exported files too). Usually left on; to see how loud your mix really is, turn it off and watch the peak";
    };
    readonly "\u5CF0\u503C\uFF1A\u6700\u8FD1\u8FD9\u4E00\u4E0B\u6700\u54CD\u7684\u90A3\u4E2A\u91C7\u6837\uFF08dBFS\uFF09\u30020 dB = \u6EE1\u683C\uFF0C\u518D\u5927\u5C31\u524A\u6CE2\uFF1B\u9650\u5E45\u5F00\u7740\u65F6\u6700\u591A\u5230 \u22120.18 dB\u3002\u9876\u4E0A\u7684\u7EC6\u7EBF\u662F\u540C\u4E00\u4E2A\u6570": {
        readonly en: "Peak: the loudest sample just now (dBFS). 0 dB = full scale, above that clips; with the limiter on it tops out at −0.18 dB. The thin line on top shows the same number";
    };
    readonly "\u5E73\u5747\u7535\u5E73\uFF08RMS\uFF0C\u6700\u8FD1 0.3 \u79D2\uFF0C\u63A8\u5B50\u4E4B\u540E\uFF0CdBFS\uFF09\uFF1A\u6BD4\u5CF0\u503C\u66F4\u63A5\u8FD1\u8033\u6735\u89C9\u5F97\u7684\u54CD\u3002\u51E0\u6761\u8F68\u6446\u5E73\u97F3\u91CF\u770B\u8FD9\u4E2A\uFF1B\u9876\u4E0A\u7684\u7EC6\u7EBF\uFF08\u5CF0\u503C\uFF09\u770B\u4F1A\u4E0D\u4F1A\u7206": {
        readonly en: "Average level (RMS, last 0.3 s, post-fader, dBFS): closer to perceived loudness than peak. Use this to balance tracks; use the thin line on top (peak) to watch for clipping";
    };
    readonly "\u5DE6\u53F3\u76F8\u5173\uFF08\u22121 \u5230 +1\uFF09\uFF1A+1 = \u5DE6\u53F3\u4E00\u6837\uFF08\u5355\u58F0\u9053\uFF09\uFF1B0 \u9644\u8FD1 = \u5F88\u5BBD\uFF1B\u5C0F\u4E8E 0 = \u5DE6\u53F3\u53CD\u76F8\uFF0C\u624B\u673A\u5916\u653E / \u5355\u58F0\u9053\u4E00\u5408\u5C31\u4F1A\u53D8\u5C0F\u3001\u53D8\u7A7A\u3002\u80CC\u666F\u7684\u56FE\uFF1A\u7AD6\u7EBF = \u5355\u58F0\u9053\uFF0C\u8D8A\u5706\u8D8A\u5BBD\uFF0C\u6A2A\u7740 = \u53CD\u76F8\uFF1B\u5F80\u5DE6\u4E0A\u659C = \u504F\u5DE6\u58F0\u9053\u3001\u5F80\u53F3\u4E0A\u659C = \u504F\u53F3": {
        readonly en: "Stereo correlation (−1 to +1): +1 = left and right identical (mono); around 0 = very wide; below 0 = out of phase, which gets thin and quiet on phone speakers / mono. The background figure: vertical line = mono, rounder = wider, horizontal = out of phase; tilting up-left = left-heavy, up-right = right-heavy";
    };
    readonly "\u538B\u4E86\u591A\u5C11\uFF1A\u8FD9\u6761\u8F68\u4E0A\u7B2C\u4E00\u53F0\u538B\u7F29\u6B64\u523B\u628A\u58F0\u97F3\u538B\u4F4E\u4E86\u51E0 dB\uFF08\u4E0B\u9762\u644A\u5F00\u7684\u5C31\u662F\u5B83\uFF09\u3002\u4E00\u76F4\u538B\u5F88\u591A = \u9608\u503C\u592A\u4F4E\u6216\u6BD4\u4F8B\u592A\u5927": {
        readonly en: "Gain reduction: how many dB the first compressor on this track is reducing right now (it's the one shown below). Constantly a lot = threshold too low or ratio too high";
    };
    readonly "\u88AB\u8C01\u538B\uFF08\u4FA7\u94FE\uFF09\uFF1A\u538B\u7F29\u5668\u4E0D\u770B\u81EA\u5DF1\uFF0C\u800C\u770B\u53E6\u4E00\u6761\u8F68\u6709\u591A\u54CD\u2014\u2014\u6BD4\u5982\u5C0F\u6708\u76F8\u4E00\u5531\uFF0C\u4F34\u594F\u81EA\u5DF1\u8BA9\u4E00\u70B9": {
        readonly en: "Compressed by (sidechain): the compressor listens to another track instead of itself — say, the backing ducks a bit when Tsukuyomi-chan sings";
    };
    readonly 平均: {
        readonly en: "Average";
    };
    readonly 左右相关: {
        readonly en: "Stereo correlation";
    };
    readonly "\u62F7\u8FD9\u4E00\u683C\u7684\u53C2\u6570\uFF08\u79CD\u7C7B + \u5168\u90E8\u53C2\u6570\uFF1B\u4E0D\u62F7\u5F00\u5173\u3001\u4E0D\u62F7\u88AB\u8C01\u538B\uFF09": {
        readonly en: "Copy this slot's parameters (kind + all parameters; not on/off, not “compressed by”)";
    };
    readonly 拷参数: {
        readonly en: "Copy params";
    };
    readonly "\u628A\u62F7\u7684\u53C2\u6570\uFF08\u6765\u81EA\u300C{from}\u300D\uFF09\u76D6\u5230\u8FD9\u4E00\u683C\u4E0A\uFF1B\u5F00\u5173 / \u88AB\u8C01\u538B\u7167\u65E7\uFF1B\u80FD\u64A4\u9500": {
        readonly en: "Applies the copied parameters (from “{from}”) to this slot; on/off and “compressed by” stay; can be undone";
    };
    readonly 粘参数: {
        readonly en: "Paste params";
    };
    readonly "\u64AD\u653E\uFF08\u7A7A\u683C\uFF09": {
        readonly en: "Play (Space)";
    };
    readonly "\u52A0\u4E00\u6761\u6DF7\u97F3\u8F68\uFF08\u8DEF\u7531\u8F68\uFF09\uFF1A\u51E0\u6761\u8F68\u53D1\u8FC7\u6765\u4E00\u8D77\u8FC7\u6548\u679C\uFF0C\u6BD4\u5982\u5171\u7528\u4E00\u4E2A\u6DF7\u54CD": {
        readonly en: "Add a bus (routing track): several tracks send here to share effects, such as one reverb";
    };
    readonly "\uFF0B \u6DF7\u97F3\u8F68": {
        readonly en: "＋ Bus";
    };
    readonly "\u66F4\u591A\uFF1A\u6392\u6570\u2026": {
        readonly en: "More: rows…";
    };
    readonly "\u6536\u8D77\u6DF7\u97F3\u53F0\uFF1A\u5E95\u5EA7\u8BA9\u51FA\u6765\u3001\u8FD8\u5728\u300C\u542C\u300D\uFF08Esc = \u56DE\u53BB\u5199\uFF09": {
        readonly en: "Collapses the mixer: frees the dock, still in “Listen” (Esc = back to writing)";
    };
    readonly "\u6548\u679C\u5168\u5173\u7740\uFF1A\u63D2\u4EF6\u548C\u53D1\u9001\u90FD\u4E0D\u54CD\uFF0C\u53EA\u5269\u63A8\u5B50\u3001\u58F0\u50CF\u3001\u51FA\u5230\u548C\u603B\u8F68\u9650\u5E45\u2014\u2014\u542C\u8C31\u5B50\u672C\u8EAB / \u542C\u5DEE\u522B\u7528\uFF1B\u518D\u70B9\u4E00\u4E0B\u56DE\u6765\u3002\u5BFC\u51FA\u7167\u5E38\u5E26\u6548\u679C\u3002": {
        readonly en: "All effects off: plugins and sends are silent, leaving only faders, pan, outputs and the master limiter — for hearing the score itself / comparing; tap again to return. Exports still include effects.";
    };
    readonly "\u4E0D\u518D\u53D1\u7ED9 {to}": {
        readonly en: "Stop sending to {to}";
    };
    readonly "\u5F00 / \u5173": {
        readonly en: "On / off";
    };
    readonly "{strip} \u7C98\u6210\u65B0\u7684\u4E00\u683C\uFF1A{kind}": {
        readonly en: "{strip} pasted as a new slot: {kind}";
    };
    readonly 改成最接近的一键: {
        readonly en: "Switch to the nearest Simple";
    };
    readonly "\u53D1\u7ED9 {to} {v}": {
        readonly en: "Send to {to} {v}";
    };
    readonly "\u53D1\u7ED9 {value}": {
        readonly en: "Send to {value}";
    };
    readonly 被谁压: {
        readonly en: "Compressed by";
    };
    readonly "\u51E0\u4E2A\u5927\u65CB\u94AE\uFF0C\u6309\u516C\u5F0F\u8C03\u4E0B\u9762\u5168\u91CF\u7684\u53C2\u6570\uFF08\u53EA\u6362\u8FD9\u4E00\u683C\uFF09": {
        readonly en: "A few big knobs that set the full parameters below by formula (this slot only)";
    };
    readonly 一键: {
        readonly en: "Simple";
    };
    readonly "\u6BCF\u4E00\u4E2A\u53C2\u6570\u90FD\u644A\u5F00\uFF08\u53EA\u6362\u8FD9\u4E00\u683C\uFF09": {
        readonly en: "Every parameter laid out (this slot only)";
    };
    readonly 全量: {
        readonly en: "Full";
    };
    readonly "{track} \u63D2\u4E0A{kind}": {
        readonly en: "{track} inserted {kind}";
    };
    readonly "{track} \u62FF\u6389{gone}": {
        readonly en: "{track} removed {gone}";
    };
    readonly "\u4E0D\u7528\uFF08\u81EA\u5DF1\u538B\u81EA\u5DF1\uFF09": {
        readonly en: "None (compresses itself)";
    };
    readonly "\u5728\u5168\u91CF\u91CC\u8C03\u8FC7\uFF0C\u4E00\u952E\u8868\u8FBE\u4E0D\u4E86\uFF1A\u4E00\u952E\u5148\u9501\u7740\uFF0C\u514D\u5F97\u4E00\u78B0\u5C31\u76D6\u6389\u3002": {
        readonly en: "Adjusted in Full in a way Simple can't express: Simple stays locked so a touch can't overwrite it.";
    };
    readonly "\u6309\u6700\u63A5\u8FD1\u7684\u4E00\u952E\u6570\u503C\u6539\u5199\u2014\u2014\u5168\u91CF\u91CC\u591A\u8C03\u7684\u4F1A\u4E22\u6389\uFF08\u6BD4\u5982\u4E2D\u9891\u90A3\u4E00\u5200\uFF09\uFF1B\u80FD\u64A4\u9500": {
        readonly en: "Rewrites to the nearest Simple values — extra adjustments in Full are lost (like that mid-band cut); can be undone";
    };
    readonly "\u6DF7\u97F3\u8F68 / \u603B\u8F68\u4E0A\u6CA1\u6709\u97F3\uFF0C\u7528\u4E0D\u4E0A{v}": {
        readonly en: "Buses / master have no notes, so {v} isn't usable";
    };
    readonly "\uFF08\u5F00\u7740\u4E5F\u4E0D\u5207\uFF09": {
        readonly en: " (no cut even when on)";
    };
    readonly "\u81EA\u52A8\uFF1A{hz} Hz\uFF08\u8FD9\u4F4D\u6700\u4F4E\u7684\u97F3\u5F80\u4E0B\u56DB\u4E2A\u534A\u97F3\uFF09": {
        readonly en: "Auto: {hz} Hz (four semitones below this part's lowest note)";
    };
    readonly "\u81EA\u52A8\uFF08\u8FD9\u6761\u8F68\u6CA1\u6709\u97F3 = \u4E0D\u5207\uFF09": {
        readonly en: "Auto (no notes on this track = no cut)";
    };
    readonly "\u5F80\u8FD9\u6761\u8F68\u4E0A\u63D2\u4E00\u4E2A{kind}": {
        readonly en: "Insert a {kind} on this track";
    };
    readonly "\u5173 = \u8FD9\u4E00\u683C\u8DF3\u8FC7\uFF08\u53C2\u6570\u7559\u7740\uFF09": {
        readonly en: "Off = this slot is skipped (parameters stay)";
    };
    readonly 关着: {
        readonly en: "Off";
    };
    readonly 开着: {
        readonly en: "On";
    };
    readonly "\u8FD8\u6709 {p} \u4E2A{kind}\u5728\u300C\u94FE\u300D\u91CC": {
        readonly en: "{p} more {kind} in “Chain”";
    };
    readonly 压了: {
        readonly en: "Reduced";
    };
    readonly 出到: {
        readonly en: "Output to";
    };
    readonly "{out}\uFF08\u63A5\u4E0D\u4E0A\uFF09": {
        readonly en: "{out} (can't connect)";
    };
    readonly "\u53D1\u7ED9 {to}": {
        readonly en: "Send to {to}";
    };
    readonly 不再发给它: {
        readonly en: "Stop sending to it";
    };
    readonly "\uFF0B \u53D1\u9001\u5230\u2026": {
        readonly en: "＋ Send to…";
    };
    readonly "\u63A8\u5B50\u4E4B\u540E\u53D1\u4E00\u4EFD\u5230\u4E00\u6761\u6DF7\u97F3\u8F68\uFF08\u6DF7\u54CD / \u5EF6\u8FDF\u8FD9\u7C7B\u653E\u5728\u6DF7\u97F3\u8F68\u4E0A\uFF0C\u51E0\u6761\u8F68\u5171\u7528\uFF09": {
        readonly en: "Sends a post-fader copy to a bus (reverb / delay live on buses, shared by several tracks)";
    };
    readonly "\u8FD8\u6CA1\u6709\u6DF7\u97F3\u8F68\uFF08\u9876\u680F\u300C\uFF0B \u6DF7\u97F3\u8F68\u300D\u52A0\uFF09": {
        readonly en: "No buses yet (add one with “＋ Bus” at the top)";
    };
    readonly "\u300C{out}\u300D\u4E0A\u7684{kind}\u662F\u5168\u6E7F\u7684\uFF1A\u51FA\u5230\u5B83 = \u539F\u58F0\u6CA1\u4E86\uFF0C\u53EA\u5269{kind2}\u3002\u8981\u539F\u58F0\u52A0{kind3}\uFF1A\u51FA\u5230\u603B\u8F68\uFF0C\u7528\u4E0B\u9762\u7684\u300C\u53D1\u9001\u300D\u3002": {
        readonly en: "The {kind} on “{out}” is fully wet: outputting there = no dry sound, only {kind2}. For dry plus {kind3}: output to master and use “Send” below.";
    };
    readonly "\u51FA\u5230\u300C{out}\u300D= \u6574\u6761\u58F0\u97F3\u90FD\u8FC7\u5B83\u7684{kind}\uFF1A\u51FA\u5230\u5B83\u7684\u51E0\u6761\u8F68{kind2}\u4E00\u6837\u591A{dryDb}\u3002\u60F3\u6BCF\u6761\u8F68\u5404\u81EA\u591A\u5C11\uFF1A\u51FA\u5230\u603B\u8F68\u3001\u7528\u4E0B\u9762\u7684\u300C\u53D1\u9001\u300D\uFF0C\u90A3\u6761\u6DF7\u97F3\u8F68\u4E0A\u7684{kind3}\u6539\u6210\u5168\u6E7F\u3002": {
        readonly en: "Outputting to “{out}” = the whole sound passes through its {kind}: tracks output there all get the same {kind2}{dryDb}. For a different amount per track: output to master, use “Send” below, and make the {kind3} on that bus fully wet.";
    };
    readonly "\uFF0C\u539F\u58F0\u4E5F\u88AB\u5B83\u5173\u5C0F {dryDb}\uFF08\u63A8\u5B50\u4E0A\u770B\u4E0D\u51FA\u6765\uFF09": {
        readonly en: ", and it also reduces the dry sound by {dryDb} (not visible on the fader)";
    };
    readonly "{kind}\uFF1A\u70B9\u5F00\u8C03{DEFAULT_EQ_ID}": {
        readonly en: "{kind}: tap to adjust{DEFAULT_EQ_ID}";
    };
    readonly "\uFF08\u9ED8\u8BA4\u90A3\u4E00\u683C\uFF1A\u80FD\u5173\u3001\u80FD\u6362\u9762\u677F\uFF0C\u4E0D\u80FD\u5220\uFF09": {
        readonly en: " (the default slot: can be toggled and its panel switched, not deleted)";
    };
    readonly "\u94FE\u5C3E\u52A0\u4E00\u683C\uFF1A\u62F7\u7684\u90A3\u4E00\u683C\uFF08\u6765\u81EA\u300C{from}\u300D\uFF09\u7684\u79CD\u7C7B\u548C\u53C2\u6570": {
        readonly en: "Adds a slot at the end of the chain: the kind and parameters of the copied slot (from “{from}”)";
    };
    readonly "\u7C98\u6210\u65B0\u7684\u4E00\u683C\uFF1A{kind}": {
        readonly en: "Paste as a new slot: {kind}";
    };
    readonly "\u63D2\u4E00\u4E2A\u63D2\u4EF6\uFF08\u4EFB\u4F55\u63D2\u4EF6\u90FD\u80FD\u63D2\u5728\u4EFB\u4F55\u8F68\u4E0A\uFF09": {
        readonly en: "Insert a plugin (any plugin works on any track)";
    };
    readonly "\u4ECE\u8FD9\u6761\u8F68\u4E0A\u62FF\u6389\uFF08\u80FD\u64A4\u9500\uFF09": {
        readonly en: "Remove from this track (can be undone)";
    };
    readonly "\u8D34\u5728\u5E95\u4E0B\u65F6\u663E\u793A\u51E0\u6392\u5361\u7247\uFF08\u540C\u5C0F\u952E\u76D8\u7684\u300C\u884C\u300D\uFF09\uFF1A\u81EA\u52A8 = \u534A\u5C4F\u653E\u5F97\u4E0B\u7684\u6700\u591A\u6392\uFF1B\u624B\u52A8\u6700\u591A\u5230\u5C4F\u5E55\u653E\u5F97\u4E0B\u3001\u8C31\u8FD8\u9732\u4E00\u6761\u4E3A\u6B62\u3002\u6A2A\u7740\u653E / \u5168\u5C4F\u65F6\u4E0D\u7BA1": {
        readonly en: "How many rows of cards to show when docked at the bottom (like the keypad rows): Auto = as many as fit in half the screen; manual goes up to what the screen can hold while a strip of the score stays visible. Ignored when docked at the side or full screen";
    };
    readonly 排数: {
        readonly en: "Rows";
    };
    readonly 少一排: {
        readonly en: "One row fewer";
    };
    readonly 多一排: {
        readonly en: "One row more";
    };
    readonly 效果全关: {
        readonly en: "All FX off";
    };
    readonly 效果开着: {
        readonly en: "FX on";
    };
    readonly "\u73B0\u5728\uFF1A\u63D2\u4EF6\u548C\u53D1\u9001\u90FD\u4E0D\u54CD\uFF08\u63A8\u5B50 / \u58F0\u50CF\u7559\u7740\uFF09\u3002\u70B9 = \u6548\u679C\u56DE\u6765": {
        readonly en: "Now: plugins and sends are silent (faders / pan stay). Tap = effects back";
    };
    readonly "\u70B9 = \u6682\u65F6\u5173\u6389\u5168\u90E8\u6548\u679C\uFF08\u63D2\u4EF6 + \u53D1\u9001\uFF09\uFF0C\u542C\u8C31\u5B50\u672C\u8EAB / \u542C\u5DEE\u522B\uFF1B\u63A8\u5B50\u3001\u58F0\u50CF\u7559\u7740": {
        readonly en: "Tap = temporarily turn off all effects (plugins + sends), to hear the score itself / compare; faders and pan stay";
    };
    readonly "\u8FD8\u539F\uFF1A\u56DE\u5230\u5E95\u5EA7": {
        readonly en: "Restore: back to the dock";
    };
    readonly "\u6DF7\u97F3\u53F0\u94FA\u6EE1\uFF08\u63A8\u5230\u6700\u4E0A\u9762\uFF0C\u5361\u7247\u6392\u6210\u597D\u51E0\u5217\uFF0C\u4E00\u773C\u770B\u5168\uFF09\uFF1B\u518D\u70B9 = \u56DE\u5230\u5E95\u5EA7": {
        readonly en: "Fills the screen with the mixer (cards in several columns, all in view); tap again = back to the dock";
    };
    readonly 还原: {
        readonly en: "Restore";
    };
    readonly 全屏: {
        readonly en: "Full screen";
    };
    readonly 限幅: {
        readonly en: "Limiter";
    };
    readonly "\u5173\u7740\uFF08\u53EF\u80FD\u524A\u6CE2\uFF09": {
        readonly en: "Off (may clip)";
    };
    readonly 峰值: {
        readonly en: "Peak";
    };
    readonly "\u603B\u8F68\u5C31\u662F\u8F93\u51FA\uFF0C\u4E0D\u518D\u53D1\u7ED9\u522B\u5904": {
        readonly en: "Master is the output; it doesn't send anywhere else";
    };
    readonly 所有声部混在一起之后: {
        readonly en: "After all parts are mixed";
    };
    readonly 声像: {
        readonly en: "Pan";
    };
    readonly "\u65C1\u901A\uFF1A\u8FD9\u6761\u6DF7\u97F3\u8F68\u4E0A\u7684\u63D2\u4EF6\u5168\u8DF3\u8FC7\uFF08\u63A8\u5B50 / \u58F0\u50CF / \u51FA\u5230 / \u53D1\u9001\u7167\u65E7\uFF09\uFF1B\u518D\u70B9 = \u56DE\u6765": {
        readonly en: "Bypass: all plugins on this bus are skipped (fader / pan / output / sends stay); tap again = back";
    };
    readonly 旁通中: {
        readonly en: "Bypassed";
    };
    readonly 往前挪一位: {
        readonly en: "Move earlier";
    };
    readonly 往后挪一位: {
        readonly en: "Move later";
    };
    readonly "\u5220\u6389\u8FD9\u6761\u6DF7\u97F3\u8F68\uFF08\u53D1\u7ED9\u5B83\u7684\u3001\u51FA\u5230\u5B83\u7684\u90FD\u6539\u56DE\u603B\u8F68\uFF1B\u80FD\u64A4\u9500\uFF09": {
        readonly en: "Delete this bus (tracks sending or outputting to it go back to master; can be undone)";
    };
    readonly "\u540D\u5B57\uFF08\u70B9\u4E86\u6539\uFF09": {
        readonly en: "Name (tap to change)";
    };
    readonly "\u9759\u97F3\uFF1A\u8FD9\u6761\u6DF7\u97F3\u8F68\u4E0D\u51FA\u58F0\u3001\u4E5F\u4E0D\u5F80\u4E0B\u53D1\uFF08\u53D1\u7ED9\u5B83\u7684\u90A3\u51E0\u4F4D\u539F\u58F0\u7167\u65E7\uFF09": {
        readonly en: "Mute: this bus is silent and sends nothing onward (the dry sound of parts sending to it is unaffected)";
    };
    readonly 静: {
        readonly en: "M";
    };
    readonly "\u6DF7\u97F3\u8F68 \u00B7 \u65C1\u901A\u4E2D\uFF08\u63D2\u4EF6\u5168\u8DF3\u8FC7\uFF09": {
        readonly en: "Bus · bypassed (all plugins skipped)";
    };
    readonly "\u8FD9\u4F4D\u4E50\u624B\u81EA\u5DF1\u7684\u54CD\u5EA6\uFF08\u4E50\u5668\u9875\u300C\u54CD\u5EA6\u300D\u90A3\u4E00\u884C\uFF09\uFF0C\u548C\u63A8\u5B50\u76F8\u52A0\uFF1A\u63A8\u5B50 {g}\u3001\u4E50\u624B {p} = \u8FD9\u6761\u8F68\u4E00\u5171 {t}\u3002\u70B9\u8FD9\u91CC\u53BB\u4E50\u5668\u9875\u6539": {
        readonly en: "This performer's own loudness (the Loudness row on the instrument page), added to the fader: fader {g}, performer {p} = {t} for this track in total. Tap to change it on the instrument page";
    };
    readonly "\u4E50\u624B {p}": {
        readonly en: "Performer {p}";
    };
    readonly "\u5F80\u524D\u632A\u4E00\u4F4D\uFF08\u8C31\u4E0A\u8FD9\u4E2A\u58F0\u90E8\u4E5F\u5F80\u4E0A\u632A\uFF09": {
        readonly en: "Move earlier (this part also moves up on the score)";
    };
    readonly "\u5F80\u540E\u632A\u4E00\u4F4D\uFF08\u8C31\u4E0A\u8FD9\u4E2A\u58F0\u90E8\u4E5F\u5F80\u4E0B\u632A\uFF09": {
        readonly en: "Move later (this part also moves down on the score)";
    };
    readonly "\u5728 {refs} \u5F20\u7EB8\u4E0A": {
        readonly en: "On {refs} {refs|sheet|sheets}";
    };
    readonly 哪张纸上都没有: {
        readonly en: "Not on any sheet";
    };
    readonly "\u5220\u6389\u8FD9\u4E2A\u58F0\u90E8\uFF08\u5B83\u7684\u4E50\u5668\u8BBE\u7F6E\u4E00\u8D77\u5220\uFF1B\u80FD\u64A4\u9500\uFF09": {
        readonly en: "Delete this part (its instrument settings go too; undoable)";
    };
    readonly 删掉这个声部: {
        readonly en: "Delete this part";
    };
    readonly "\u9759\u97F3\uFF08\u8FD9\u4F4D\u4E0D\u51FA\u58F0\uFF1B\u548C\u8C31\u4E0A\u58F0\u90E8\u540D\u4E0B\u9762\u7684\u300C\u9759\u300D\u662F\u540C\u4E00\u4E2A\uFF09": {
        readonly en: "Mute (this part is silent; same as “M” under the part name on the score)";
    };
    readonly "\u72EC\u594F\uFF08\u53EA\u542C\u72EC\u594F\u7684\u51E0\u4F4D\uFF1B\u548C\u8C31\u4E0A\u7684\u300C\u72EC\u300D\u662F\u540C\u4E00\u4E2A\uFF09": {
        readonly en: "Solo (only hear the parts on solo; same as “S” on the score)";
    };
    readonly 独: {
        readonly en: "S";
    };
};
export type Key = keyof typeof S;
