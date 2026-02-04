import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const demoPath = path.join(
  process.cwd(),
  "apps/demos/src/demos/moon-phases/index.html"
);

function readHtml() {
  return fs.readFileSync(demoPath, "utf8");
}

describe("moon-phases demo structure", () => {
  test("includes orbital + phase views, timeline, animation, shadow toggle", () => {
    const html = readHtml();
    expect(html).toContain('id="orbital-svg"');
    expect(html).toContain('id="phase-svg"');
    expect(html).toContain('id="timeline-strip"');
    expect(html).toContain('id="btn-play"');
    expect(html).toContain('id="btn-pause"');
    expect(html).toContain('id="btn-step-forward"');
    expect(html).toContain('id="btn-step-back"');
    expect(html).toContain('id="speed-select"');
    expect(html).toContain('id="show-shadow-toggle"');
    expect(html).toContain('id="toggle-advanced"');
    expect(html).toContain('id="latitude"');
    expect(html).toContain('id="dayOfYear"');
    expect(html).toContain('id="preset-spring"');
    expect(html).toContain('id="preset-summer"');
    expect(html).toContain('id="preset-fall"');
    expect(html).toContain('id="preset-winter"');
    expect(html).toContain('id="toggle-sky-view"');
    expect(html).toContain('id="sky-view"');
    expect(html).toContain('id="rise-time"');
    expect(html).toContain('id="set-time"');
    expect(html).toContain('id="rise-set-status"');
  });
});
