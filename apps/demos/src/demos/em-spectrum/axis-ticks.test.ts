import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { wavelengthToPositionPercent } from "./logic";

/**
 * P0 d085a04d: the tick and power-of-ten rows were evenly spaced (CSS grid) on an
 * axis that is linear in log10(lambda). Every label row must carry the wavelength it
 * names (`data-lambda-cm`), and main.ts positions it with wavelengthToPositionPercent --
 * the same function the bar, marker, highlight and scale-objects row use.
 */

const html = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");

const CM_PER_M = 100;
const CM_PER_KM = 1e5;

/** The wavelength (cm) that a printed tick label names. */
function labelToCm(label: string): number {
  const t = label.trim();
  const power = t.match(/^\$10\^\{(-?\d+)\}\\,\\mathrm\{m\}\$$/);
  if (power) return 10 ** Number(power[1]) * CM_PER_M;
  const unit: Record<string, number> = {
    km: CM_PER_KM,
    m: CM_PER_M,
    mm: 0.1,
    "$\\mu\\mathrm{m}$": 1e-4,
    nm: 1e-7,
    pm: 1e-10,
    fm: 1e-13
  };
  const m = t.match(/^(\d+) (km|m|mm|nm|pm|fm|\$\\mu\\mathrm\{m\}\$)$/);
  if (!m) throw new Error(`unrecognised tick label: ${label}`);
  return Number(m[1]) * unit[m[2]];
}

function rowSpans(rowClass: string): Array<{ attrs: string; text: string }> {
  const row = html.match(new RegExp(`<div class="${rowClass}"[^>]*>([\\s\\S]*?)</div>`));
  if (!row) throw new Error(`row .${rowClass} not found`);
  return [...row[1].matchAll(/<span([^>]*)>([\s\S]*?)<\/span>/g)].map((m) => ({
    attrs: m[1],
    text: m[2]
  }));
}

// 10 km, 1 m, 1 mm, 1 um, 1 nm, 1 pm, 10 fm on the 1e6 .. 1e-12 cm axis (18 decades).
const TRUE_POSITIONS = [0, 22.2222, 38.8889, 55.5556, 72.2222, 88.8889, 100];

describe.each(["spectrum__ticks", "spectrum__powers"])("EM Spectrum -- .%s row", (rowClass) => {
  const spans = rowSpans(rowClass);

  it("has seven labels", () => {
    expect(spans).toHaveLength(7);
  });

  it("every label declares the wavelength it names", () => {
    for (const s of spans) {
      const m = s.attrs.match(/data-lambda-cm="([^"]+)"/);
      expect(m, `no data-lambda-cm on ${s.text}`).not.toBeNull();
      const declared = Number(m?.[1]);
      expect(declared / labelToCm(s.text)).toBeCloseTo(1, 9);
    }
  });

  it("each label sits where wavelengthToPositionPercent puts its wavelength", () => {
    const positions = spans.map((s) =>
      wavelengthToPositionPercent(Number(s.attrs.match(/data-lambda-cm="([^"]+)"/)?.[1]))
    );
    expect(positions).toHaveLength(TRUE_POSITIONS.length);
    positions.forEach((p, i) => {
      expect(p).toBeCloseTo(TRUE_POSITIONS[i], 3);
    });
  });
});
