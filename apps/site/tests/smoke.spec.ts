import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function normalizeBasePath(value: string) {
  const trimmed = value.trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

async function demoSlugsFromContent() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const siteRoot = path.resolve(here, "..");
  const demosDir = path.join(siteRoot, "src", "content", "demos");

  const entries = await fs.readdir(demosDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
    .map((name) => name.replace(/\.(md|mdx)$/, ""))
    .sort();
}

const basePath = normalizeBasePath(
  process.env.CP_BASE_PATH && process.env.CP_BASE_PATH.trim().length > 0
    ? process.env.CP_BASE_PATH
    : "/cosmic-playground/"
);

test.describe("Cosmic Playground smoke", () => {
  test("Explore renders demo cards", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("explore/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Explore", exact: true })
    ).toBeVisible();
    if ((await demoSlugsFromContent()).includes("hydrostatic-equilibrium-explorer")) {
      await expect(
        page.getByRole("heading", { name: /Hydrostatic Equilibrium Explorer/i })
      ).toBeVisible();
    }
    expect(await page.locator(".demo-card").count()).toBeGreaterThan(0);
    expect(errors, `Console errors on ${basePath}explore/`).toEqual([]);
  });

  test("Explore cards use Canvas thumbnails with SVG fallback", async ({ page }) => {
    await page.goto("explore/");

    const cardCount = await page.locator(".demo-card").count();
    expect(cardCount).toBeGreaterThan(0);
    await expect(page.locator(".demo-card .demo-canvas-thumb canvas")).toHaveCount(cardCount);
    await expect(page.locator(".demo-card .demo-canvas-thumb__fallback svg")).toHaveCount(cardCount);
  });

  test("Canvas thumbnails do not animate under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      const original = window.requestAnimationFrame.bind(window);
      let count = 0;
      window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
        count += 1;
        return original(cb);
      }) as typeof window.requestAnimationFrame;
      Object.defineProperty(window, "__thumbnailRafCount", {
        get: () => count
      });
    });

    await page.goto("explore/");
    await expect(page.locator(".demo-card .demo-canvas-thumb canvas").first()).toBeVisible();
    const count = await page.evaluate(() => (window as any).__thumbnailRafCount ?? 0);
    expect(count).toBe(0);
  });

  test("Canvas thumbnail renderer keeps real alpha and distinct scene families", async () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const source = await fs.readFile(
      path.resolve(here, "..", "src", "components", "DemoCanvasThumbnail.astro"),
      "utf8"
    );

    expect(source).toContain("color-mix(in srgb");
    expect(source).not.toContain("_alpha");
    expect(source).toContain("thumbnailSceneBySlug");
  });

  test("Canvas thumbnails expose distinct scene metadata on Explore", async ({ page }) => {
    await page.goto("explore/");

    await expect(page.locator('[data-demo-thumbnail][data-slug="galaxy-rotation"]').first()).toHaveAttribute(
      "data-scene",
      "galaxy"
    );
    await expect(
      page.locator('[data-demo-thumbnail][data-slug="hydrostatic-equilibrium-explorer"]')
    ).toHaveAttribute("data-scene", "stellar-core");
    // Was `eos-lab` / "regime-map". That demo is `unlisted: true` while its equation of
    // state is reworked, so it is no longer on Explore by design -- see topics.spec.ts.
    await expect(page.locator('[data-demo-thumbnail][data-slug="stars-zams-hr"]')).toHaveAttribute(
      "data-scene",
      "hr-track"
    );
  });

  test("Homepage featured thumbnail wrapper does not add a second glow stage", async ({ page }) => {
    await page.goto("./");

    const background = await page.locator(".featured-card__illustration").first().evaluate((node) => {
      return window.getComputedStyle(node).backgroundImage;
    });
    expect(background).toBe("none");
  });

  test("Hero glow is scoped to hero", async ({ page }) => {
    await page.goto("explore/");
    const bodyBg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundImage
    );
    const heroBg = await page.locator(".cp-hero").evaluate((el) =>
      window.getComputedStyle(el).backgroundImage
    );
    expect(bodyBg).not.toContain("radial-gradient");
    expect(heroBg).toContain("radial-gradient");
  });

  // NOTE: this checks that *some* .cp-chip renders, which the quick-filter row and the
  // topic jump-links always satisfy. It does not exercise the active-filter chips: the
  // site builds with `output: "static"`, so `Astro.url.searchParams` is empty at build
  // time and the `?topic=` filter never applies in production. Tracked in STATUS.md.
  test("Chip styling is applied on the explore page", async ({ page }) => {
    await page.goto("explore/?topic=Orbits");
    const chip = page.locator(".cp-chip").first();
    await expect(chip).toBeVisible();
  });

  test("Explore cards show time ranges (not exact minutes)", async ({ page }) => {
    await page.goto("explore/");
    const timeBadge = page
      .locator(".demo-card .cp-badge")
      .filter({ hasText: "min" })
      .first();
    await expect(timeBadge).toBeVisible();
    const text = (await timeBadge.textContent()) ?? "";
    expect(text).toMatch(/(≤|–|\+)/);
  });

  test("Explore cards lead with readiness, and only when it needs saying", async ({ page }) => {
    // One status vocabulary on the card, not three. `status` and `readiness` used to sit
    // side by side saying near-identical things -- 14 of 19 demos read "draft" and
    // "experimental" and content_verified:true at once. A launch-ready exhibit shows no
    // badge at all, so the first badge is either a readiness level or the topic.
    await page.goto("explore/");
    const badges = page.locator(".demo-card .demo-card__badges .cp-badge");
    await expect(badges.first()).toBeVisible();
    const firstText = (await badges.first().textContent())?.trim().toLowerCase() ?? "";
    const readinessLabels = ["stub", "experimental", "near-ready"];

    await expect(page.locator(".demo-card").first()).toHaveAttribute("data-readiness", /.+/);
    const readiness = await page.locator(".demo-card").first().getAttribute("data-readiness");
    if (readiness === "launch-ready") {
      expect(readinessLabels).not.toContain(firstText);
    } else {
      expect(readinessLabels).toContain(firstText);
    }
    // The retired vocabulary must not come back alongside it. Checked per badge, since
    // a container's text is every badge concatenated and would never match on its own.
    const retired = await page.evaluate(() =>
      [...document.querySelectorAll(".cp-badge")]
        .map((b) => b.textContent?.trim().toLowerCase() ?? "")
        .filter((t) => ["stable", "beta", "draft"].includes(t))
    );
    expect(retired).toEqual([]);
  });

  test("Explore filter uses invitational microcopy", async ({ page }) => {
    await page.goto("explore/");
    const search = page.locator("input[name='q']");
    await expect(search).toHaveAttribute("placeholder", "Search demos…");
    const summary = page.locator(".filter-bar__details summary");
    await expect(summary).toHaveText("More ways to filter");
  });

  test("Explore shows start-here tiles and quick filters", async ({ page }) => {
    await page.goto("explore/");

    await expect(page.locator(".start-here__tile")).toHaveCount(5);
    // Two chips since 2026-09-09: `lt10` and `noMath` duplicated a select exactly and
    // `labs` matched all 19 demos. See QUICK_FILTER_KEYS in lib/exploreFilter.ts.
    await expect(page.locator(".quick-filters .cp-chip")).toHaveCount(2);
    await expect(page.getByText("Looking for a guided path?")).toBeVisible();
  });

  test("Explore quick filter links use expected query params", async ({ page }) => {
    await page.goto("explore/");

    // Chips are real links so they still say what they do with JS off; the script
    // intercepts the click to filter in place. Located by data-quick rather than by name,
    // because the script appends each chip's result count to its label ("ASTR 101 (17)").
    await expect(page.locator("[data-quick='astr101']")).toHaveAttribute(
      "href",
      /quick=astr101/
    );
    await expect(page.locator("[data-quick='updated']")).toHaveAttribute(
      "href",
      /quick=updated/
    );
  });

  test("Explore featured row shows lead text", async ({ page }) => {
    await page.goto("explore/");
    const lead = page.locator(".featured__lede");
    await expect(lead).toHaveText("Begin with the core orbit ideas before branching out.");
  });

  test("Explore shows onboarding cadence strip", async ({ page }) => {
    await page.goto("explore/");
    const cadence = page.locator(".explore-onboard__cadence li");
    await expect(cadence).toHaveCount(3);
    await expect(cadence.nth(0)).toHaveText("Predict");
    await expect(cadence.nth(1)).toHaveText("Play");
    await expect(cadence.nth(2)).toHaveText("Explain");
  });

  test("Explore shows exhibit count line", async ({ page }) => {
    await page.goto("explore/");
    const count = page.locator(".results__count");
    await expect(count).toContainText("interactive exhibit");
  });

  test("Station fallback copy is generic when a demo lacks station content", async ({
    page
  }) => {
    await page.goto("stations/planetary-conjunctions/");

    await expect(
      page.getByRole("heading", { name: /planetary conjunctions/i })
    ).toBeVisible();
    await expect(page.getByText(/phase angle/i)).toHaveCount(0);
    await expect(page.getByText(/illuminated fraction/i)).toHaveCount(0);
    await expect(page.getByText(/generic station template/i)).toBeVisible();
  });

  test("Instructor pages are honest about missing teaching material", async ({ page }) => {
    // Two states exist. Originally this test pointed at planetary-conjunctions, which
    // had 1 of 5 sections; that bundle is now complete, and as of 2026-09-04 NO bundle
    // is partial, so the "incomplete" branch has no instance to assert against. What
    // remains testable -- and what a lesson-planning instructor actually hits -- is the
    // no-bundle fallback. The partial branch has no test of its own; what stops a bundle
    // sliding into it unnoticed is "Complete instructor bundles show no incompleteness
    // notice" below. (This comment used to claim unit tests covered both branches. As of
    // 2026-09-10 no test file references the instructor section list at all.)
    const slugsWithNoBundle = ["eos-lab", "stars-zams-hr", "cluster-census"];

    for (const slug of slugsWithNoBundle) {
      await page.goto(`instructor/${slug}/`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // The page must not silently look like real teaching material -- and the notice has
      // to be the page's labelled status region, not any stray word. This used to be
      // getByText(/scaffold/i), and the only text it matched was an engineering TODO,
      // "Add export-results scaffolding once runtime lands": the defect was passing the test.
      const status = page.getByRole("region", { name: "Instructor bundle status" });
      await expect(status).toBeVisible();
      await expect(status).toContainText(/scaffold/i);
      // Nor publish the site's own engineering TODOs as page content. The fallback used to
      // render "Add a proper instructor content collection for richer notes" under a
      // Backlog heading on all three of these pages (audit B8).
      await expect(page.locator("body")).not.toContainText("Add a proper instructor content collection");
    }
  });

  test("Complete instructor bundles show no incompleteness notice", async ({ page }) => {
    // Regression guard for the bundles authored on 2026-09-04: if a section is deleted,
    // the notice comes back and this fails.
    for (const slug of ["retrograde-motion", "planetary-conjunctions", "moon-phases"]) {
      await page.goto(`instructor/${slug}/`);
      await expect(page.getByText(/Instructor Bundle Incomplete/i)).toHaveCount(0);
      // These are the rendered section labels from sectionLabels in
      // src/pages/instructor/[slug].astro, not the frontmatter section keys.
      for (const section of ["Overview", "Activities", "Assessment", "Model notes (deeper)", "Backlog"]) {
        await expect(
          page.getByRole("heading", { name: section, exact: true }).first()
        ).toBeVisible();
      }
    }
  });

  test("All /play/<slug>/ pages load the instrument root", async ({ page }) => {
    const slugs = await demoSlugsFromContent();
    expect(slugs.length).toBeGreaterThan(0);

    for (const slug of slugs) {
      const errors: string[] = [];
      page.removeAllListeners("pageerror");
      page.removeAllListeners("console");
      page.on("pageerror", (err) => errors.push(String(err)));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await page.goto(`play/${slug}/`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#cp-demo")).toBeVisible();
      expect(errors, `Console errors on ${basePath}play/${slug}/`).toEqual([]);
    }
  });

  test("Moon phases advanced controls toggle and presets", async ({ page }) => {
    await page.goto("play/moon-phases/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    const advancedToggle = page.locator("#toggle-advanced");
    const advancedControls = page.locator("#advanced-controls");
    const dayOfYear = page.locator("#dayOfYear");
    const presetSummer = page.locator("#preset-summer");

    await expect(advancedToggle).toBeVisible();
    await expect(advancedControls).toHaveClass(/is-hidden/);

    await advancedToggle.check();
    await expect(advancedControls).not.toHaveClass(/is-hidden/);

    await presetSummer.click();
    await expect(dayOfYear).toHaveValue("172");

    const riseSetToggle = page.locator("#toggle-rise-set");
    const riseSetLine = page.locator("#rise-set-line");
    await expect(riseSetLine).toHaveClass(/is-hidden/);
    await riseSetToggle.check();
    await expect(riseSetLine).not.toHaveClass(/is-hidden/);
  });

  test("Kepler’s Laws renders with resolved canvas colors and animates", async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });

    await page.goto("play/keplers-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    await expect(page.locator("#cp-demo")).toHaveAttribute("data-shell", "viz-first");
    await expect(page.locator('label[for="aAu"] .katex')).toBeVisible();
    await expect(page.locator('label[for="ecc"] .katex')).toBeVisible();

    // Units toggle is inside advanced readouts; open it first.
    await page.locator("#readoutAdvanced").click();
    await expect(page.locator("#advancedReadoutControls")).toBeVisible();

    // Units toggle should switch to CGS in 201 mode.
    await page.locator("#unit201").click();
    await expect(page.locator("#velocityUnit")).toHaveAttribute("data-unit", "cm/s");
    await expect(page.locator("#accelUnit")).toHaveAttribute("data-unit", "cm/s^2");
    await expect(page.locator("#velocityUnit .katex")).toBeVisible();

    // Newton mode reveals vectors toggle and renders vectors on request.
    await page.locator("#modeNewton").click();
    const vectorsToggle = page.locator("#toggleVectorsLabel");
    await expect(vectorsToggle).toBeVisible();
    await expect(page.locator("#massField")).toBeVisible();
    await page.locator("#toggleVectors").check();
    await expect(page.locator("#velocityVector")).toBeVisible();
    await expect(page.locator("#forceVector")).toBeVisible();

    // Equal areas overlay renders when enabled.
    await page.locator("#toggleEqualAreas").check();
    await expect(page.locator("#equalAreasGroup")).toBeVisible();

    // Preset updates core parameters.
    await page.getByRole("button", { name: "Jupiter" }).click();
    await expect(page.locator("#aDisplay")).toContainText("5.20");
    await expect(page.locator("#eDisplay")).toHaveText("0.049");

    // (1) Verify the planet marker is not rendered with a default/invalid color.
    // When canvas colors come from CSS vars like `var(--cp-accent)` or `color-mix(...)`,
    // the canvas API won't accept them unless resolved to computed rgb(...).
    const planetPixel = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>("#orbitCanvas");
      const a = document.querySelector<HTMLInputElement>("#aAu");
      const e = document.querySelector<HTMLInputElement>("#ecc");
      if (!canvas || !a || !e) return null;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const dpr = window.devicePixelRatio || 1;

      const sliderA = Number(a.value);
      const sliderE = Number(e.value);
      const min = 0.3;
      const max = 40;
      const minLog = Math.log10(min);
      const maxLog = Math.log10(max);
      const aAu = Math.pow(10, minLog + (sliderA / 1000) * (maxLog - minLog));
      const ecc = sliderE / 1000;
      const rp = aAu * (1 - ecc);
      const ra = aAu * (1 + ecc);
      const b = aAu * Math.sqrt(1 - ecc * ecc);
      const pad = 0.2 * aAu;

      const margin = 36;
      const plotW = Math.max(1, w - 2 * margin);
      const plotH = Math.max(1, h - 2 * margin);
      const xMin = -ra - pad;
      const xMax = rp + pad;
      const yMax = b + pad;
      const scale = Math.min(plotW / (xMax - xMin), plotH / (2 * yMax));
      const cx = margin + (-xMin) * scale;
      const cy = h / 2;

      // Default mean anomaly is 0, which puts the planet at perihelion (x=rp, y=0).
      const px = cx + rp * scale;
      const py = cy;

      const image = ctx.getImageData(Math.round(px * dpr), Math.round(py * dpr), 1, 1);
      const [r, g, bch, alpha] = image.data;
      return { r, g, b: bch, alpha };
    });

    expect(planetPixel).not.toBeNull();
    expect(planetPixel?.alpha, "Planet marker should be visible (non-transparent)").toBeGreaterThan(0);
    expect(
      (planetPixel?.r ?? 0) + (planetPixel?.g ?? 0) + (planetPixel?.b ?? 0),
      "Planet marker should not be rendered as near-black (invalid canvas color)."
    ).toBeGreaterThan(60);

    // (2) Verify animation advances the time slider.
    const mean = page.locator("#meanAnomalyDeg");
    const before = await mean.inputValue();
    await page.locator("#play").click();
    await expect(page.locator("#pause")).toBeEnabled();
    await page.waitForTimeout(350);
    const after = await mean.inputValue();
    expect(after, "Mean anomaly should advance while animating.").not.toEqual(before);
  });

  /**
   * Wait out the shell's entry animation before clicking a utility button.
   *
   * The demo shell slides its panels in on load (`cp-slide-up`, 0.6s, one iteration) and
   * #copyResults rides inside one of them, so for that window the button is a moving
   * target. Playwright compares the bounding box on two consecutive frames and retries
   * while it differs -- on a loaded CI runner it can keep missing until the 30s timeout,
   * which is how this failed on 2026-09-10 with "element is not stable". eos-lab is the
   * demo that hits it, because its regime-grid worker keeps the main thread busy enough
   * to stretch the animation across many more frames than it takes locally.
   *
   * Bounded, so a genuinely endless animation cannot hang the test -- it just falls back
   * to Playwright's own stability handling.
   */
  async function waitForEntryAnimations(page: any) {
    await page.evaluate(async () => {
      const running = document.getAnimations().filter((a) => a.playState === "running");
      await Promise.race([
        Promise.allSettled(running.map((a) => a.finished)),
        new Promise((resolve) => setTimeout(resolve, 3000))
      ]);
    });
  }

  /**
   * Start as a returning visitor, so eos-lab's first-visit tour never opens.
   *
   * eos-lab starts a guided tour for anyone without `eos-lab-toured` in localStorage --
   * `requestAnimationFrame` then `setTimeout(runTour, 600)` -- and every Playwright context
   * is a first visit. The tour lays a full-page `.tour-overlay` over the controls, so a click
   * on #copyResults only lands if it beats that timer. Reproduced 2026-09-10: clicking
   * straight after load succeeds; clicking 1.5s after load is intercepted by the overlay;
   * with the key set, the same late click succeeds. waitForEntryAnimations made this pass
   * on a fast runner and still lose on a slow one -- the retry in CI run 34540167260 failed
   * with "<div class="tour-overlay"></div> intercepts pointer events".
   *
   * These tests are about the export payload, not the tour. The tour blocking a student's
   * first visit is its own defect (audit item U3) and is not hidden by this.
   */
  async function skipFirstVisitTours(page: any) {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("eos-lab-toured", "1");
      } catch {
        // Storage can be blocked; the tour then runs and the test reports it honestly.
      }
    });
  }

  async function installClipboardCapture(page: any) {
    await page.addInitScript(() => {
      (window as any).__cpLastClipboardText = null;
      const clipboard = (navigator as any).clipboard ?? {};
      (navigator as any).clipboard = clipboard;
      clipboard.writeText = async (text: string) => {
        (window as any).__cpLastClipboardText = text;
      };
    });
  }

  async function getCapturedClipboardText(page: any) {
    return await page.evaluate(() => (window as any).__cpLastClipboardText);
  }

  const migratedInteractiveDemos = [
    {
      slug: "angular-size",
      expects: ["Diameter D (km)", "Distance d (km)", "Angular diameter theta (deg)"]
    },
    {
      slug: "blackbody-radiation",
      expects: [
        "Temperature T (K)",
        "Peak wavelength lambda_peak (nm)",
        "Luminosity ratio L/Lsun (same radius)"
      ]
    },
    {
      slug: "binary-orbits",
      expects: ["Secondary mass ratio (M2/M1)", "Separation a (AU)", "Orbital period P (yr)"]
    },
    {
      slug: "conservation-laws",
      expects: [
        "Central mass M (Msun)",
        "Specific energy eps (AU^2/yr^2)",
        "Specific angular momentum |h| (AU^2/yr)"
      ]
    },
    {
      slug: "eclipse-geometry",
      expects: ["Earth–Moon distance (km)", "Phase angle Delta (deg)", "abs(beta) (deg)"]
    },
    {
      slug: "moon-phases",
      expects: ["Phase angle alpha (deg)", "Illuminated (%)"]
    },
    {
      slug: "seasons",
      expects: [
        "Axial tilt epsilon (deg)",
        "Solar declination delta (deg)",
        "Earth–Sun distance r (AU)"
      ]
    },
    {
      slug: "keplers-laws",
      expects: ["Semi-major axis a (AU)", "Orbital period P (yr)", "Speed v (km/s)"]
    },
    {
      slug: "retrograde-motion",
      expects: ["Observer", "Target", "Apparent longitude (deg)"]
    },
    {
      slug: "parallax-distance",
      expects: [
        "Inferred parallax p_hat (mas)",
        "Distance true d_true (pc)",
        "Signal-to-noise p_hat/sigma_p_hat (inferred)"
      ]
    },
    {
      slug: "em-spectrum",
      expects: ["Wavelength lambda (nm)", "Frequency nu (Hz)", "Photon energy E (eV)"]
    },
    {
      slug: "doppler-shift",
      expects: [
        "Radial velocity (km/s)",
        "Redshift z",
        "Observed wavelength (nm)",
        "Observed frequency (THz)",
        "NR divergence (%)"
      ]
    },
    {
      slug: "telescope-resolution",
      expects: [
        "Diffraction limit theta_diff (arcsec)",
        "Effective resolution theta_eff (arcsec)",
        "Binary separation (arcsec)"
      ]
    },
    {
      slug: "planetary-conjunctions",
      // "Oppositions observed", not "Conjunctions observed": the default target is Mars,
      // which orbits outside Earth's orbit, so the same-longitude alignment is an
      // opposition. This expectation previously pinned the incorrect label.
      expects: ["Synodic period (days)", "Days elapsed", "Oppositions observed"]
    },
    {
      slug: "eos-lab",
      expects: ["Temperature T (K)", "P_gas (dyne cm^-2)", "P_tot (dyne cm^-2)"]
    }
  ] as const;

  for (const demo of migratedInteractiveDemos) {
    test(`Migrated demo exports stable results text (${demo.slug})`, async ({
      page
    }) => {
      await installClipboardCapture(page);
      await skipFirstVisitTours(page);

      await page.goto(`play/${demo.slug}/`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#cp-demo")).toBeVisible();
      await waitForEntryAnimations(page);

      await page.locator("#copyResults").click();
      await expect(page.locator("#status")).toContainText("Copied");

      const copied = await getCapturedClipboardText(page);
      expect(typeof copied).toBe("string");

      const text = String(copied);
      expect(text).toContain("Cosmic Playground");
      expect(text).toContain("(v1)");
      expect(text).toContain("Timestamp:");
      expect(text).toContain("\nParameters:\n");
      expect(text).toContain("\nReadouts:\n");

      for (const needle of demo.expects) {
        expect(text, `Expected export to include "${needle}"`).toContain(needle);
      }
    });

    test(`Migrated demo copy results is keyboard-activatable (${demo.slug})`, async ({
      page
    }) => {
      await installClipboardCapture(page);
      await skipFirstVisitTours(page);

      await page.goto(`play/${demo.slug}/`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#cp-demo")).toBeVisible();
      await waitForEntryAnimations(page);

      const copyButton = page.locator("#copyResults");
      await expect(copyButton).toBeVisible();

      for (let i = 0; i < 80; i++) {
        if (await copyButton.evaluate((el) => el === document.activeElement)) break;
        await page.keyboard.press("Tab");
      }
      await expect(copyButton).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.locator("#status")).toContainText("Copied");

      const copied = await getCapturedClipboardText(page);
      expect(String(copied)).toContain("Timestamp:");
      expect(String(copied)).toContain("(v1)");
    });
  }

  test("Pilot demo respects prefers-reduced-motion (binary-orbits)", async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.addInitScript(() => {
      (window as any).__cpRafCount = 0;
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
        (window as any).__cpRafCount++;
        return original(cb);
      }) as any;
    });

    await page.goto("play/binary-orbits/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    await page.waitForTimeout(300);

    const count = await page.evaluate(() => (window as any).__cpRafCount);
    expect(count, "requestAnimationFrame should not loop under reduced motion").toBeLessThanOrEqual(1);
  });

  test("Base typography uses design tokens", async ({ page }) => {
    await page.goto("explore/");

    const body = page.locator("body");
    const fontSize = await body.evaluate((el) =>
      window.getComputedStyle(el).fontSize
    );
    // 1.125rem = 18px at default browser settings
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(18);
  });

  test("Icon component renders SVG", async ({ page }) => {
    await page.goto("explore/");

    // After we add icons, search input should have search icon
    const searchIcon = page.locator(".filter-bar svg");
    await expect(searchIcon.first()).toBeVisible();
  });

  test("Topic badges show icons", async ({ page }) => {
    await page.goto("explore/");

    // Topic badges should have SVG icons
    const topicBadge = page.locator('.cp-badge[data-tone="blue"] svg');
    await expect(topicBadge.first()).toBeVisible();
  });

  test("Cards have transition on hover", async ({ page }) => {
    await page.goto("explore/");

    const card = page.locator(".demo-card").first();
    const transition = await card.evaluate((el) =>
      window.getComputedStyle(el).transition
    );
    expect(transition).toContain("transform");
    expect(transition).toContain("box-shadow");
  });

  test("Buttons have focus-visible ring", async ({ page }) => {
    await page.goto("explore/");

    // The first .cp-button in the DOM is the filter form's Apply, which the Explore
    // script hides once it takes over filtering -- a hidden control cannot show a focus
    // ring, and is not what this test is about. Take the first one a reader can reach.
    const cpButton = page.locator(".cp-button:visible").first();
    await expect(cpButton).toBeVisible();

    // Focus the button programmatically then check its focus-visible styles
    await cpButton.focus();

    const outline = await cpButton.evaluate((el) =>
      window.getComputedStyle(el).outlineColor
    );
    // Should have an outline color defined (teal focus ring)
    expect(outline).toBeTruthy();
  });

  test("Navigation shows active state", async ({ page }) => {
    await page.goto("explore/");

    const activeLink = page.locator('nav a[aria-current="page"]').first();
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toContainText("Explore");
  });

  test("Card titles are tinted", async ({ page }) => {
    await page.goto("explore/");

    const bodyColor = await page.evaluate(() => {
      const color = window.getComputedStyle(document.body).color;
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    });
    expect(bodyColor).not.toBeNull();

    const titleColor = await page.evaluate(() => {
      const title = document.querySelector(".demo-card__title");
      if (!title) return null;
      const color = window.getComputedStyle(title).color;
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    });
    expect(titleColor).not.toBeNull();
    expect(titleColor).not.toEqual(bodyColor);
  });

  test("Header shows cadence tagline", async ({ page }) => {
    await page.goto("explore/");

    const cadenceItems = page.locator(".brand__cadence li");
    await expect(cadenceItems).toHaveCount(3);
    await expect(cadenceItems.nth(0)).toHaveText("Predict");
    await expect(cadenceItems.nth(1)).toHaveText("Play");
    await expect(cadenceItems.nth(2)).toHaveText("Explain");
  });

  test("Header brand mark and demo SVG motion respect reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("explore/");

    const brandHome = page.getByLabel("Cosmic Playground home");
    await expect(brandHome).toBeVisible();
    await expect(page.locator(".brand__home .brand-mark")).toHaveCount(1);
    await expect(page.locator(".brand__home .brand-mark")).toHaveAttribute("aria-hidden", "true");

    const brandOrbitAnimation = await page.locator(".brand-mark__orbit").evaluate((node) => {
      return window.getComputedStyle(node).animationName;
    });
    expect(brandOrbitAnimation).toBe("none");

    const demoStarAnimation = await page.locator(".demo-illus__stars circle").first().evaluate((node) => {
      return window.getComputedStyle(node).animationName;
    });
    expect(demoStarAnimation).toBe("none");
  });

  test("Hero shows physics line", async ({ page }) => {
    await page.goto("explore/");

    const hero = page.locator(".explore-hero");
    await expect(
      hero.getByText("Play with the universe. Learn the physics.")
    ).toBeVisible();
  });

  test("Body text uses softened off-white", async ({ page }) => {
    await page.goto("explore/");

    const channels = await page.evaluate(() => {
      const color = window.getComputedStyle(document.body).color;
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    });

    expect(channels).not.toBeNull();
    (channels as number[]).forEach((value) => {
      expect(value).toBeGreaterThan(205);
      expect(value).toBeLessThan(255);
    });
  });

  test("Footer shows attribution and contact link", async ({ page }) => {
    await page.goto("explore/");

    const footer = page.locator(".site-footer");
    await expect(
      footer.getByText("Developed and designed by Anna Rosen.")
    ).toBeVisible();

    const contact = footer.getByRole("link", { name: "Contact" });
    await expect(contact).toHaveAttribute("href", "mailto:alrosen@sdsu.edu");
  });

  test("Links have transitions", async ({ page }) => {
    await page.goto("explore/");

    const link = page.locator("a").first();
    const transition = await link.evaluate((el) =>
      window.getComputedStyle(el).transition
    );
    // Links should have a color transition defined
    expect(transition).toContain("color");
  });

  test("Badges have hover transition", async ({ page }) => {
    await page.goto("explore/");

    const badge = page.locator(".cp-badge").first();
    const transition = await badge.evaluate((el) =>
      window.getComputedStyle(el).transition
    );
    expect(transition).toContain("background");
  });

  test("Empty state shows when no results", async ({ page }) => {
    /*
     * This used to build a `<div class="empty-state">` with JS, append it, and assert
     * that the div it had just created was visible -- so it passed without the page
     * having an empty state at all. Drive the real one instead: a search matching no
     * demo must leave the reader an explanation, not a silently empty results region.
     */
    await page.goto("explore/?q=zzzznotademo");

    await expect(page.locator("[data-topic-section] .demo-card:visible")).toHaveCount(0);
    const emptyState = page.locator(".empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No demos found");
  });

  test("Playlists page groups journeys and exposes required concept playlists", async ({
    page
  }) => {
    await page.goto("playlists/");
    await expect(page.getByRole("heading", { name: "For Astro 101 lectures" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "For inquiry labs (Station mode)" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "For self-study" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "For instructors (modules)" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Astro 101 Core Concepts" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Solar System Geometry" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Orbits & Gravity" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Light & Measuring the Universe" })
    ).toBeVisible();
  });
});

test.describe("Cosmic Playground no-JS smoke", () => {
  test.use({ javaScriptEnabled: false });

  test("Home content remains visible without JavaScript", async ({ page }) => {
    await page.goto("./");

    await expect(
      page.getByRole("heading", { level: 2, name: "Start here" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Recently updated" })
    ).toBeVisible();
  });
});
