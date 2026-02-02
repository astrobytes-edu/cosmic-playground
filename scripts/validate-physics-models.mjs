import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

async function pathExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exportedSymbolNameFromSource(text) {
  // Convention in packages/physics: export const <Name>Model = {...}
  // Some modules also export helper constants; we specifically want the exported *Model symbol.
  const modelConst = text.match(/\bexport\s+const\s+([A-Za-z0-9_]*Model)\b/);
  if (modelConst) return modelConst[1];
  const modelFn = text.match(/\bexport\s+function\s+([A-Za-z0-9_]*Model)\b/);
  if (modelFn) return modelFn[1];

  // Fallback: first export (rare; keeps the validator usable for future modules).
  const constMatch = text.match(/\bexport\s+const\s+([A-Za-z0-9_]+)\b/);
  if (constMatch) return constMatch[1];
  const fnMatch = text.match(/\bexport\s+function\s+([A-Za-z0-9_]+)\b/);
  if (fnMatch) return fnMatch[1];
  return null;
}

export async function validatePhysicsModels({ repoRoot = process.cwd() } = {}) {
  const physicsSrc = path.join(repoRoot, "packages", "physics", "src");
  const indexPath = path.join(physicsSrc, "index.ts");
  if (!(await pathExists(physicsSrc))) return [];
  if (!(await pathExists(indexPath))) return [`packages/physics/src: missing index.ts`];

  const entries = await fs.readdir(physicsSrc, { withFileTypes: true });
  const modelFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith("Model.ts"))
    .map((e) => e.name);

  const indexText = await fs.readFile(indexPath, "utf8");
  const violations = [];

  for (const file of modelFiles) {
    const base = file.replace(/\.ts$/, "");
    const testFile = `${base}.test.ts`;
    const implPath = path.join(physicsSrc, file);
    const testPath = path.join(physicsSrc, testFile);

    if (!(await pathExists(testPath))) {
      violations.push(`packages/physics/src/${file}: missing required test file ${testFile}`);
    }

    const implText = await fs.readFile(implPath, "utf8");
    const exportName = exportedSymbolNameFromSource(implText);
    if (!exportName) {
      violations.push(`packages/physics/src/${file}: could not determine exported symbol (expected "export const …" or "export function …")`);
      continue;
    }

    const exportRe = new RegExp(`\\bexport\\s*\\{\\s*${escapeRegExp(exportName)}\\s*\\}`, "m");
    if (!exportRe.test(indexText)) {
      violations.push(`packages/physics/src/index.ts: missing export for ${exportName} (from ${file})`);
    }
  }

  return violations;
}

export async function main() {
  const violations = await validatePhysicsModels({ repoRoot });
  if (violations.length === 0) return 0;
  console.error("Physics/model contract violations found:");
  for (const v of violations) console.error(`- ${v}`);
  console.error(`\nTotal: ${violations.length}`);
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-process-exit
  main().then((code) => process.exit(code));
}
