import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

function runNodeScript({ scriptPath, cwd }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("close", (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

async function writeFile(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

async function mkdirp(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function demoHtml({ withAtomic }) {
  const atomic = withAtomic ? ' aria-atomic="true"' : "";
  return `<!doctype html>
<html lang="en">
  <body>
    <div id="cp-demo" role="main" aria-label="Demo instrument">
      <button id="copyResults" type="button">Copy results</button>
      <p id="status" role="status" aria-live="polite"${atomic}></p>
      <div class="cp-demo__drawer"></div>
    </div>
  </body>
</html>
`;
}

describe("validate-play-dirs", () => {
  test("fails when #status lacks aria-atomic=true", async () => {
    const scriptPath = new URL("./validate-play-dirs.mjs", import.meta.url).pathname;
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-playdirs-"));

    await writeFile(
      path.join(root, "apps/site/src/content/demos/demo.md"),
      "---\ntitle: demo\n---\n"
    );
    await mkdirp(path.join(root, "apps/demos/src/demos/demo"));
    await writeFile(
      path.join(root, "apps/site/public/play/demo/index.html"),
      demoHtml({ withAtomic: false })
    );

    const result = await runNodeScript({ scriptPath, cwd: root });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("export status live-region");
    expect(result.stderr).toContain("aria-atomic");
  });

  test("passes when #status includes aria-atomic=true", async () => {
    const scriptPath = new URL("./validate-play-dirs.mjs", import.meta.url).pathname;
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-playdirs-"));

    await writeFile(
      path.join(root, "apps/site/src/content/demos/demo.md"),
      "---\ntitle: demo\n---\n"
    );
    await mkdirp(path.join(root, "apps/demos/src/demos/demo"));
    await writeFile(
      path.join(root, "apps/site/public/play/demo/index.html"),
      demoHtml({ withAtomic: true })
    );

    const result = await runNodeScript({ scriptPath, cwd: root });
    expect(result.code).toBe(0);
  });
  describe("content_verified is derived from the tracker's open P0s", () => {
    const scriptPath = new URL("./validate-play-dirs.mjs", import.meta.url).pathname;

    async function fixture({ findingStatus, area = "demo", file = "apps/demos/src/demos/demo/main.ts" }) {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-playdirs-"));
      await writeFile(
        path.join(root, "apps/site/src/content/demos/demo.md"),
        "---\ntitle: demo\ncontent_verified: true\n---\n"
      );
      await mkdirp(path.join(root, "apps/demos/src/demos/demo"));
      await writeFile(path.join(root, "docs/reviews/demo.md"), "# physics review\n");
      await writeFile(
        path.join(root, "apps/site/public/play/demo/index.html"),
        demoHtml({ withAtomic: true })
      );
      await writeFile(
        path.join(root, "docs/tracker/findings.json"),
        JSON.stringify({
          findings: [{ id: "aaaa1111", sevC: "P0", area, file, title: "a confirmed P0" }]
        })
      );
      await writeFile(
        path.join(root, "docs/tracker/state.json"),
        JSON.stringify({ status: findingStatus ? { aaaa1111: { state: findingStatus } } : {} })
      );
      return root;
    }

    test("fails when a demo claims content_verified: true with an open confirmed P0", async () => {
      const root = await fixture({ findingStatus: "confirmed" });
      const result = await runNodeScript({ scriptPath, cwd: root });
      expect(result.code).toBe(1);
      expect(result.stderr).toContain("open P0");
      expect(result.stderr).toContain("demo (aaaa1111)");
    });

    test("an untracked P0 counts as open; the demo is found from the file path when area is a theme", async () => {
      const root = await fixture({ findingStatus: null, area: "test & gate integrity" });
      const result = await runNodeScript({ scriptPath, cwd: root });
      expect(result.code).toBe(1);
      expect(result.stderr).toContain("demo (aaaa1111)");
    });

    test("passes once the P0 is marked fixed", async () => {
      const root = await fixture({ findingStatus: "fixed" });
      const result = await runNodeScript({ scriptPath, cwd: root });
      expect(result.code).toBe(0);
    });
  });
  describe("frontmatter modes match the controls the demo source ships", () => {
    const scriptPath = new URL("./validate-play-dirs.mjs", import.meta.url).pathname;

    async function fixture({ modes, mainTs = "" }) {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-playdirs-"));
      await writeFile(
        path.join(root, "apps/site/src/content/demos/demo.md"),
        `---\ntitle: demo\nmodes: [${modes.join(", ")}]\n---\n`
      );
      await writeFile(
        path.join(root, "apps/demos/src/demos/demo/index.html"),
        demoHtml({ withAtomic: true })
      );
      await writeFile(path.join(root, "apps/demos/src/demos/demo/main.ts"), mainTs);
      await writeFile(
        path.join(root, "apps/site/public/play/demo/index.html"),
        demoHtml({ withAtomic: true })
      );
      return root;
    }

    const STATION = "createDemoModes({ station: { columns: [] } });\n";
    const CHALLENGE = "new ChallengeEngine([], {});\n";

    test("fails when frontmatter claims modes the source does not have", async () => {
      const root = await fixture({ modes: ["station", "challenge", "export"] });
      const result = await runNodeScript({ scriptPath, cwd: root });
      expect(result.code).toBe(1);
      expect(result.stderr).toContain("modes");
      expect(result.stderr).toContain("demo");
      expect(result.stderr).toContain("station, challenge");
    });

    test("fails when the source has a mode the frontmatter omits", async () => {
      const root = await fixture({ modes: ["export"], mainTs: STATION + CHALLENGE });
      const result = await runNodeScript({ scriptPath, cwd: root });
      expect(result.code).toBe(1);
      expect(result.stderr).toContain("modes");
    });

    test("passes when frontmatter matches the source", async () => {
      const root = await fixture({
        modes: ["station", "challenge", "export"],
        mainTs: STATION + CHALLENGE
      });
      const result = await runNodeScript({ scriptPath, cwd: root });
      expect(result.code).toBe(0);
    });
  });
});

