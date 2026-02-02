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

async function readJson(p) {
  const text = await fs.readFile(p, "utf8");
  return JSON.parse(text);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const unitSuffix = {
  mas: "Mas",
  arcsec: "Arcsec",
  deg: "Deg",
  rad: "Rad",
  nm: "Nm",
  um: "Um",
  mm: "Mm",
  cm: "Cm",
  m: "M",
  km: "Km",
  au: "Au",
  pc: "Pc",
  ly: "Ly",
  hz: "Hz",
  s: "S",
  min: "Min",
  hr: "Hr",
  day: "Day",
  yr: "Yr",
  k: "K",
  msun: "MSun"
};

function validateManifestShape({ pkgDir, manifest, violations }) {
  if (!manifest || typeof manifest !== "object") {
    violations.push(`${pkgDir}: manifest.json must be a JSON object`);
    return;
  }
  if (!isNonEmptyString(manifest.package)) {
    violations.push(`${pkgDir}: manifest.json missing required "package" string`);
  }
  if (manifest.manifestVersion !== 1) {
    violations.push(`${pkgDir}: manifest.json "manifestVersion" must be 1`);
  }
  if (!Array.isArray(manifest.datasets) || manifest.datasets.length === 0) {
    violations.push(`${pkgDir}: manifest.json "datasets" must be a non-empty array`);
  }
}

function validateDataset({ pkgDir, dataset, indexText, violations }) {
  if (!dataset || typeof dataset !== "object") {
    violations.push(`${pkgDir}: dataset entry must be an object`);
    return;
  }

  const requiredStrings = ["id", "title", "description", "unitsPolicy", "license"];
  for (const key of requiredStrings) {
    if (!isNonEmptyString(dataset[key])) {
      violations.push(`${pkgDir}: dataset "${dataset.id ?? "(unknown)"}" missing "${key}"`);
    }
  }

  if (!Number.isInteger(dataset.version) || dataset.version < 1) {
    violations.push(`${pkgDir}: dataset "${dataset.id}" missing integer version >= 1`);
  }

  if (!Array.isArray(dataset.exports) || dataset.exports.length === 0) {
    violations.push(`${pkgDir}: dataset "${dataset.id}" "exports" must be a non-empty array`);
  } else {
    for (const exp of dataset.exports) {
      if (!isNonEmptyString(exp)) {
        violations.push(`${pkgDir}: dataset "${dataset.id}" has non-string export name`);
        continue;
      }
      if (!new RegExp(`\\b${exp}\\b`).test(indexText)) {
        violations.push(`${pkgDir}: dataset "${dataset.id}" export "${exp}" not found in src/index.ts`);
      }
    }
    const expectedMeta = `${dataset.id}Meta`;
    if (!dataset.exports.includes(expectedMeta)) {
      violations.push(`${pkgDir}: dataset "${dataset.id}" must export "${expectedMeta}" (metadata export)`);
    }
  }

  const prov = dataset.provenance;
  if (!prov || typeof prov !== "object" || !isNonEmptyString(prov.kind)) {
    violations.push(`${pkgDir}: dataset "${dataset.id}" missing provenance.kind`);
  } else if (!isNonEmptyString(prov.notes)) {
    violations.push(`${pkgDir}: dataset "${dataset.id}" missing provenance.notes`);
  }

  if (!Array.isArray(dataset.fields) || dataset.fields.length === 0) {
    violations.push(`${pkgDir}: dataset "${dataset.id}" "fields" must be a non-empty array`);
  } else {
    for (const field of dataset.fields) {
      if (!field || typeof field !== "object") {
        violations.push(`${pkgDir}: dataset "${dataset.id}" field entry must be an object`);
        continue;
      }
      if (!isNonEmptyString(field.name)) {
        violations.push(`${pkgDir}: dataset "${dataset.id}" field missing name`);
      }
      if (!isNonEmptyString(field.type)) {
        violations.push(`${pkgDir}: dataset "${dataset.id}" field "${field.name}" missing type`);
      }
      if (!isNonEmptyString(field.unit)) {
        violations.push(`${pkgDir}: dataset "${dataset.id}" field "${field.name}" missing unit`);
      }

      if (dataset.unitsPolicy === "units-in-field-names") {
        const unit = String(field.unit ?? "").toLowerCase();
        if (unit !== "unitless" && unit in unitSuffix) {
          const suffix = unitSuffix[unit];
          if (!String(field.name ?? "").includes(suffix)) {
            violations.push(
              `${pkgDir}: dataset "${dataset.id}" field "${field.name}" should include unit suffix "${suffix}" (unit=${field.unit})`
            );
          }
        }
      }
    }
  }
}

export async function validateDatasets({ repoRoot = process.cwd() } = {}) {
  const packagesRoot = path.join(repoRoot, "packages");
  if (!(await pathExists(packagesRoot))) return [];

  const entries = await fs.readdir(packagesRoot, { withFileTypes: true });
  const dataPackages = entries
    .filter((e) => e.isDirectory() && e.name.startsWith("data-"))
    .map((e) => path.join(packagesRoot, e.name));

  const violations = [];

  for (const pkgDir of dataPackages) {
    const manifestPath = path.join(pkgDir, "manifest.json");
    const packageJsonPath = path.join(pkgDir, "package.json");
    const indexPath = path.join(pkgDir, "src", "index.ts");

    if (!(await pathExists(manifestPath))) {
      violations.push(`${path.relative(repoRoot, pkgDir)}: missing manifest.json`);
      continue;
    }
    if (!(await pathExists(packageJsonPath))) {
      violations.push(`${path.relative(repoRoot, pkgDir)}: missing package.json`);
      continue;
    }
    if (!(await pathExists(indexPath))) {
      violations.push(`${path.relative(repoRoot, pkgDir)}: missing src/index.ts`);
      continue;
    }

    const manifest = await readJson(manifestPath);
    const pkgJson = await readJson(packageJsonPath);
    const indexText = await fs.readFile(indexPath, "utf8");

    validateManifestShape({
      pkgDir: path.relative(repoRoot, pkgDir),
      manifest,
      violations
    });

    if (manifest?.package && pkgJson?.name && manifest.package !== pkgJson.name) {
      violations.push(
        `${path.relative(repoRoot, pkgDir)}: manifest.package "${manifest.package}" must match package.json name "${pkgJson.name}"`
      );
    }

    if (Array.isArray(manifest?.datasets)) {
      for (const dataset of manifest.datasets) {
        validateDataset({
          pkgDir: path.relative(repoRoot, pkgDir),
          dataset,
          indexText,
          violations
        });
      }
    }
  }

  return violations;
}

export async function main() {
  const violations = await validateDatasets({ repoRoot });
  if (violations.length === 0) return 0;

  console.error("Dataset contract violations found:");
  for (const v of violations) console.error(`- ${v}`);
  console.error(`\nTotal: ${violations.length}`);
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-process-exit
  main().then((code) => process.exit(code));
}

