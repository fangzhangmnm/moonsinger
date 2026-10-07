// created 2026-10-06 by Claude Opus 5.5
import { describe, it, assert } from "./runner.mjs";
import { APP_VERSION } from "../src/version.ts";

describe("smoke", () => {
  it("runner 跑通、版本号可读", () => { assert(/^v\d+\.\d+\.\d+-\d{4}-\d{2}-\d{2}$/.test(APP_VERSION), APP_VERSION); });
});
