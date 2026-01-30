function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripFrontmatter(qmd) {
  if (!qmd.startsWith("---\n")) return { frontmatter: "", body: qmd };
  const end = qmd.indexOf("\n---\n", 4);
  if (end === -1) return { frontmatter: "", body: qmd };
  return { frontmatter: qmd.slice(0, end + 5), body: qmd.slice(end + 5) };
}

function titleFromFrontmatter(frontmatter) {
  const match = frontmatter.match(/^\s*title:\s*(.+)\s*$/m);
  if (!match) return null;
  const raw = match[1].trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

function hasLikelyMath(text) {
  if (/\$\$[\s\S]+?\$\$/.test(text)) return true;
  if (/\$[^$\n]{2,}?\$/.test(text)) return true;
  if (/\\(frac|times|cdot|sin|cos|tan|pi|mu|lambda)\b/.test(text)) return true;
  return false;
}

function rewriteLegacyLinks(text, demoSlug) {
  let out = text;

  // Demo path references.
  out = out.replaceAll(`/demos/${demoSlug}/`, `/play/${demoSlug}/`);

  // Instructor nav links inside legacy bundles.
  const sectionLinks = [
    ["index.qmd", "#index"],
    ["activities.qmd", "#activities"],
    ["assessment.qmd", "#assessment"],
    ["model.qmd", "#model"],
    ["backlog.qmd", "#backlog"]
  ];
  for (const [from, to] of sectionLinks) {
    out = out.replace(
      new RegExp(`\\]\\(${escapeRegExp(from)}\\)`, "g"),
      `](${to})`
    );
  }

  // Legacy hub index.
  out = out.replaceAll("](/demos/_instructor/)", "](/instructor/)");

  return out;
}

function calloutKindFromClass(calloutClass) {
  const base = calloutClass.trim().toLowerCase();
  return base
    .replace(/^callout-/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCaseWords(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function defaultCalloutLabel(kind) {
  const spaced = String(kind).replace(/-/g, " ");
  return titleCaseWords(spaced);
}

function extractCalloutMeta(openLine) {
  // Accept :::, ::::, etc.
  // Example: ::: {.callout-note title="Navigation"}
  const match = openLine.match(
    /^:{3,}\s*\{\.([a-z0-9-]+)(?:\s+title="([^"]+)")?(?:\s+collapse="true")?\s*\}\s*$/i
  );
  if (!match) return null;
  return { kind: calloutKindFromClass(match[1]), title: match[2] ?? null };
}

function toBlockquote(title, kind, contentLines) {
  const label = title ? `${title}` : kind ? defaultCalloutLabel(kind) : "Note";

  const quoted = [];
  quoted.push(`> **${label}**`);

  const body = contentLines
    .join("\n")
    .trim()
    .split("\n")
    .map((l) => (l.trim().length === 0 ? ">" : `> ${l}`));

  quoted.push(...body);
  return quoted.join("\n");
}

function convertCalloutsToBlockquotes(text) {
  const lines = text.split("\n");
  const out = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const meta = extractCalloutMeta(line.trim());
    if (!meta) {
      out.push(line);
      i++;
      continue;
    }

    const content = [];
    i++;
    while (i < lines.length) {
      const l = lines[i];
      if (/^:{3,}\s*$/.test(l.trim())) {
        i++;
        break;
      }
      content.push(l);
      i++;
    }

    out.push("");
    out.push(toBlockquote(meta.title, meta.kind, content));
    out.push("");
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function convertQuartoToMarkdown(args) {
  const { qmd, demoSlug } = args;

  const { frontmatter, body } = stripFrontmatter(qmd);
  const title = titleFromFrontmatter(frontmatter);

  let text = body.trim();
  text = rewriteLegacyLinks(text, demoSlug);
  text = convertCalloutsToBlockquotes(text);

  return { markdown: text.trim() + "\n", title: title ?? null, hasMath: hasLikelyMath(text) };
}
