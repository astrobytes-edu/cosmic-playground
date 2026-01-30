import fs from "node:fs/promises";
import path from "node:path";

const INCLUDE_RE = /^\s*\{\{<\s*include\s+(.+?)\s*>\}\}\s*$/;

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export async function inlineQuartoIncludes(args) {
  const { text, fromPath, maxDepth = 10 } = args;
  if (maxDepth <= 0) {
    throw new Error(`Include expansion exceeded maxDepth at ${fromPath}`);
  }

  const lines = text.split("\n");
  const out = [];

  for (const line of lines) {
    const match = line.match(INCLUDE_RE);
    if (!match) {
      out.push(line);
      continue;
    }

    const rawTarget = stripQuotes(match[1]);
    const resolved = path.resolve(path.dirname(fromPath), rawTarget);
    const included = await readText(resolved);
    const expanded = await inlineQuartoIncludes({
      text: included,
      fromPath: resolved,
      maxDepth: maxDepth - 1
    });

    out.push(expanded.trimEnd());
  }

  return out.join("\n");
}

