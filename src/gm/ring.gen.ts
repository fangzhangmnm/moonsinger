// 生成物：node scripts/gen-instruments.mjs（目录 v16 的乐器概念上的 ring 栏）。勿手改。
// GS 货架上的音色（「bank:program[:note]」，只认本尊）→ 这件乐器不去管它就一直响的依据（中 / 英）。不在表里 = 目录没标成自己一直响。
export const RING_FREE: Readonly<Record<string, { readonly zh: string; readonly en: string }>> = {
 "0:9": {
  "zh": "金属片敲了一直响，琴上没有止音的东西，要用手按。",
  "en": "Struck metal bars ring on; nothing on the instrument stops them except the hand."
 },
 "0:10": {
  "zh": "簧片拨了响到自己衰完，没有止音的东西。",
  "en": "Plucked comb teeth ring until they die away; nothing damps them."
 },
 "0:12": {
  "zh": "没有制音器，敲了响到衰完。",
  "en": "No dampers; each stroke rings until it dies away."
 },
 "0:13": {
  "zh": "没有制音器，敲了响到衰完（很短）。",
  "en": "No dampers; each stroke rings until it dies away (briefly)."
 },
 "0:14": {
  "zh": "写法上几乎都让它响（不管时值，或写「让它响」）。",
  "en": "Almost always written to ring regardless of note length, or marked \"let ring\"."
 },
 "0:15": {
  "zh": "敲弦后弦自己振，琴上没有制音器。",
  "en": "Struck strings vibrate freely; the instrument has no dampers."
 },
 "0:46": {
  "zh": "拨了弦一直响，要用手掌贴住弦才停；谱上要止会专门写。",
  "en": "Plucked strings ring on until the player damps them with the palm; stopping is written explicitly."
 },
 "0:47": {
  "zh": "鼓皮敲了一直响，止音要用手按鼓皮，谱上会专门写。",
  "en": "The struck head rings on; stopping takes a hand on the head and is written explicitly."
 },
 "0:107": {
  "zh": "拨弦后一直响，止音要另一只手按弦，是特意的动作。",
  "en": "Plucked strings ring on; stopping takes a deliberate press of the other hand."
 },
 "0:108": {
  "zh": "弹片拨了一直响，要手指按住才停。",
  "en": "Plucked tines ring on until a finger holds them."
 },
 "0:112": {
  "zh": "挂着敲，响到自己停。",
  "en": "Hung and struck; rings until it dies away by itself."
 },
 "0:113": {
  "zh": "敲了响到自己衰完。",
  "en": "Rings until it dies away by itself."
 },
 "0:114": {
  "zh": "鼓面敲了一直响，没有止音机构，止要用手按鼓面。",
  "en": "The struck pan rings on; there is no damping mechanism, only the hand on the surface."
 },
 "0:115": {
  "zh": "敲了一下就完。",
  "en": "Each stroke is over at once."
 },
 "0:116": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "0:117": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "0:118": {
  "zh": "一下一下的鼓声，响到音色自己衰完。",
  "en": "Each hit sounds until the sample dies away by itself."
 },
 "0:119": {
  "zh": "敲了一直响，用手掐住才停（掐住有专门的记号）。",
  "en": "Rings on after a stroke until choked by hand (choking has its own mark)."
 },
 "128:0:35": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:36": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:37": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:38": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:39": {
  "zh": "拍一下就完。",
  "en": "Each clap is over at once."
 },
 "128:0:40": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:41": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:42": {
  "zh": "敲了响到自己衰完；开合由脚踏的写法管，不靠松键。",
  "en": "Rings until it dies away; open and closed sounds come from the pedal, not from letting go."
 },
 "128:0:43": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:44": {
  "zh": "敲了响到自己衰完；开合由脚踏的写法管，不靠松键。",
  "en": "Rings until it dies away; open and closed sounds come from the pedal, not from letting go."
 },
 "128:0:45": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:46": {
  "zh": "敲了响到自己衰完；开合由脚踏的写法管，不靠松键。",
  "en": "Rings until it dies away; open and closed sounds come from the pedal, not from letting go."
 },
 "128:0:47": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:48": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:49": {
  "zh": "敲了响到自己衰完；要掐住是特意的动作。",
  "en": "Rings until it dies away; choking it is a deliberate act."
 },
 "128:0:50": {
  "zh": "鼓皮敲了自己衰完，没人会按住它让它停。",
  "en": "The struck head dies away on its own; nobody holds it to stop the sound."
 },
 "128:0:51": {
  "zh": "敲了响到自己衰完；要掐住是特意的动作。",
  "en": "Rings until it dies away; choking it is a deliberate act."
 },
 "128:0:52": {
  "zh": "敲了响到自己衰完；要掐住是特意的动作。",
  "en": "Rings until it dies away; choking it is a deliberate act."
 },
 "128:0:53": {
  "zh": "敲了响到自己衰完；要掐住是特意的动作。",
  "en": "Rings until it dies away; choking it is a deliberate act."
 },
 "128:0:54": {
  "zh": "敲了、摇了响到自己停。",
  "en": "Struck or shaken, it sounds until it stops by itself."
 },
 "128:0:55": {
  "zh": "敲了响到自己衰完；要掐住是特意的动作。",
  "en": "Rings until it dies away; choking it is a deliberate act."
 },
 "128:0:56": {
  "zh": "敲了响到自己衰完。",
  "en": "Rings until it dies away by itself."
 },
 "128:0:57": {
  "zh": "敲了响到自己衰完；要掐住是特意的动作。",
  "en": "Rings until it dies away; choking it is a deliberate act."
 },
 "128:0:58": {
  "zh": "敲一下颤到自己停。",
  "en": "One strike rattles until it stops by itself."
 },
 "128:0:59": {
  "zh": "敲了响到自己衰完；要掐住是特意的动作。",
  "en": "Rings until it dies away; choking it is a deliberate act."
 },
 "128:0:60": {
  "zh": "手拍了自己衰完；闷音是另一种拍法，不靠松键。",
  "en": "Hand strokes die away on their own; muted tones are a separate stroke, not letting go."
 },
 "128:0:61": {
  "zh": "手拍了自己衰完；闷音是另一种拍法，不靠松键。",
  "en": "Hand strokes die away on their own; muted tones are a separate stroke, not letting go."
 },
 "128:0:62": {
  "zh": "手拍了自己衰完；闷音是另一种拍法，不靠松键。",
  "en": "Hand strokes die away on their own; muted tones are a separate stroke, not letting go."
 },
 "128:0:63": {
  "zh": "手拍了自己衰完；闷音是另一种拍法，不靠松键。",
  "en": "Hand strokes die away on their own; muted tones are a separate stroke, not letting go."
 },
 "128:0:64": {
  "zh": "手拍了自己衰完；闷音是另一种拍法，不靠松键。",
  "en": "Hand strokes die away on their own; muted tones are a separate stroke, not letting go."
 },
 "128:0:65": {
  "zh": "敲了自己衰完，没人会按住它让它停。",
  "en": "Strokes die away on their own; nobody holds it to stop the sound."
 },
 "128:0:66": {
  "zh": "敲了自己衰完，没人会按住它让它停。",
  "en": "Strokes die away on their own; nobody holds it to stop the sound."
 },
 "128:0:67": {
  "zh": "敲了响到自己衰完。",
  "en": "Rings until it dies away by itself."
 },
 "128:0:68": {
  "zh": "敲了响到自己衰完。",
  "en": "Rings until it dies away by itself."
 },
 "128:0:69": {
  "zh": "刮一下、摇一下就完。",
  "en": "Each scrape or shake is over at once."
 },
 "128:0:70": {
  "zh": "摇一下就完。",
  "en": "Each shake is over at once."
 },
 "128:0:75": {
  "zh": "两根木棒对敲，一下就完。",
  "en": "Two sticks struck together; each click is over at once."
 },
 "128:0:76": {
  "zh": "敲了一下就完。",
  "en": "Each stroke is over at once."
 },
 "128:0:77": {
  "zh": "敲了一下就完。",
  "en": "Each stroke is over at once."
 },
 "128:0:80": {
  "zh": "敲了一直响，要用手握住才停（谱上常写「让它响」）。",
  "en": "Rings on after a stroke until the hand grips it (scores often say \"let ring\")."
 },
 "128:0:81": {
  "zh": "敲了一直响，要用手握住才停（谱上常写「让它响」）。",
  "en": "Rings on after a stroke until the hand grips it (scores often say \"let ring\")."
 }
};
