// pack-itch.mjs —— itch 版 = 整站 + 资源子集，往 index.html 烤 <meta name="deployment" content="itch">。created 2026-11-03 by Claude Opus 5.5（家族工单 A 第 3 步）
//   user 11-03「我建议itch是zip部署」「不要把鸡蛋放在一个篮子里」：资源（小月相 5 个模型包 + GM 音源）跟着 zip 走，同站点先找（src/sources/*.ts 的 bases()），
//   GitHub Pages 挂了 itch 版照样能唱。只组装 + 自检，不联网、不推（推 = scripts/push-itch.sh，HEAD == prod 守卫在那边）。
//   用法：node scripts/pack-itch.mjs [输出目录，默认 .itch-build/site]   → 目录 + 同名 .zip（itch 后台手传 / butler 都行）
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT, copySite, resourceList, readVerified, bakeMarker, selfCheck, writeFile, die } from "./pack-site.mjs";

const out = resolve(process.argv[2] || join(ROOT, ".itch-build/site"));
copySite(out);
let res = 0;
for (const r of await resourceList()) { writeFile(join(out, r.site), readVerified(r)); res++; }
const html = readFileSync(join(out, "index.html"), "utf8");
writeFile(join(out, "index.html"), bakeMarker(html, "itch"));
console.log(`[pack] 资源 ${res} 个（模型包分片 / 清单 / 许可证 + GM 音源），每个都对过 app 里钉的哈希`);
selfCheck(out, "itch 版");

const zip = `${out}.zip`;
rmSync(zip, { force: true });
try { execFileSync("zip", ["-qrX", zip, "."], { cwd: out }); } catch (e) { die(`zip 失败：${e.message}`); }   // -X 不带系统属性；目录本身不当条目（Windows 自带压缩会把空夹也记上）
console.log(`[pack] ✓ ${out}\n[pack] ✓ ${zip}`);
