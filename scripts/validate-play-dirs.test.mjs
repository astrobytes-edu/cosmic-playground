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
    <div id="cp-demo" aria-label="Demo instrument">
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
});

