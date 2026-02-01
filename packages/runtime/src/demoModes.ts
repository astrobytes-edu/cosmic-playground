import { injectStyleOnce } from "./domStyle";
import { copyTextToClipboard } from "./clipboard";
import { renderMath } from "./math";

export type DemoModeKeys = {
  help?: string;
  station?: string;
};

export type DemoShortcut = {
  key: string;
  action: string;
};

export type DemoHelpSection = {
  heading: string;
  type?: "shortcuts" | "bullets" | "html";
  items?: DemoShortcut[] | string[];
  html?: string;
};

export type DemoHelpConfig = {
  title?: string;
  subtitle?: string;
  ariaLabel?: string;
  sections?: DemoHelpSection[];
};

export type StationColumn = { key: string; label?: string };
export type StationRow = Record<string, string>;
export type StationRowSet = { label: string; getRows: () => StationRow[] };

export type DemoStationConfig = {
  title?: string;
  subtitle?: string;
  ariaLabel?: string;

  steps?: string[];
  columns: StationColumn[];
  getSnapshotRow: () => StationRow | null;
  snapshotLabel?: string;
  rowSets?: StationRowSet[];
  synthesisPrompt?: string;
};

type Dialog = {
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
};

const DEFAULT_KEYS: Required<DemoModeKeys> = {
  help: "?",
  station: "g"
};

const DEMO_MODES_CSS = `
:root {
  --cp-modal-z: 1000;
}

.cp-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--cp-modal-z);
  display: none;
  align-items: center;
  justify-content: center;
  padding: var(--cp-space-5);
  background: rgba(0, 0, 0, 0.6);
}

.cp-modal-backdrop.open {
  display: flex;
}

.cp-modal {
  width: min(920px, 100%);
  max-height: min(88vh, 900px);
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--cp-bg1) 94%, transparent);
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-r-3);
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.cp-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--cp-space-3);
  padding: var(--cp-space-4) var(--cp-space-5);
  border-bottom: 1px solid var(--cp-border);
}

.cp-modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--cp-text);
  line-height: 1.2;
  margin: 0;
}

.cp-modal-subtitle {
  margin-top: var(--cp-space-1);
  font-size: 0.95rem;
  color: var(--cp-muted);
  line-height: 1.35;
}

.cp-modal-close {
  background: transparent;
  border: 1px solid var(--cp-border);
  color: var(--cp-muted);
  border-radius: 9999px;
  width: 44px;
  height: 44px;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  display: grid;
  place-items: center;
}

.cp-modal-close:hover {
  color: var(--cp-text);
  border-color: var(--cp-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cp-accent) 28%, transparent);
}

.cp-modal-close:focus-visible {
  outline: 2px solid var(--cp-focus);
  outline-offset: 2px;
}

.cp-modal-body {
  padding: var(--cp-space-5);
  overflow: auto;
}

.cp-modal-section {
  margin-bottom: var(--cp-space-5);
}

.cp-modal-section:last-child {
  margin-bottom: 0;
}

.cp-modal-section h3 {
  margin: 0 0 var(--cp-space-2) 0;
  font-size: 0.85rem;
  color: var(--cp-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cp-kbd,
kbd.cp-kbd {
  display: inline-block;
  font-family: var(--cp-font-mono);
  font-size: 0.85em;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
  background: color-mix(in srgb, var(--cp-bg2) 78%, transparent);
  border: 1px solid var(--cp-border);
  color: var(--cp-text);
  white-space: nowrap;
}

.cp-shortcuts {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.cp-shortcuts th,
.cp-shortcuts td {
  border: 1px solid var(--cp-border);
  padding: 0.5rem 0.6rem;
  vertical-align: top;
}

.cp-shortcuts th {
  background: color-mix(in srgb, var(--cp-accent) 12%, transparent);
  color: var(--cp-muted);
  font-weight: 700;
}

.cp-station-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cp-space-2);
  align-items: center;
  margin-bottom: var(--cp-space-2);
}

.cp-station-actions button {
  border: 1px solid var(--cp-border);
  background: color-mix(in srgb, var(--cp-bg2) 78%, transparent);
  color: var(--cp-text);
  padding: 0.5rem 0.8rem;
  border-radius: 10px;
  cursor: pointer;
}

.cp-station-actions button:hover {
  border-color: var(--cp-accent);
}

.cp-station-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.cp-station-table th,
.cp-station-table td {
  border: 1px solid var(--cp-border);
  padding: 0.5rem 0.6rem;
  vertical-align: top;
}

.cp-station-table th {
  background: color-mix(in srgb, var(--cp-accent2) 14%, transparent);
  color: var(--cp-muted);
  font-weight: 700;
}

.cp-modal-status {
  margin-top: var(--cp-space-3);
  font-size: 0.95rem;
  color: var(--cp-muted);
}

@media (max-width: 540px) {
  .cp-modal-body {
    padding: var(--cp-space-4);
  }
}

@media print {
  body.cp-printing #cp-demo {
    display: none !important;
  }

  body.cp-printing .cp-modal-backdrop {
    position: static !important;
    inset: auto !important;
    display: block !important;
    background: transparent !important;
    padding: 0 !important;
  }

  body.cp-printing .cp-modal {
    max-height: none !important;
    width: 100% !important;
    border: none !important;
    box-shadow: none !important;
  }

  body.cp-printing .cp-modal-close,
  body.cp-printing .cp-station-actions {
    display: none !important;
  }
}
`;

function ensureStyles() {
  injectStyleOnce({ id: "cp-runtime-demo-modes", cssText: DEMO_MODES_CSS });
}

function isBrowser(): boolean {
  return typeof document !== "undefined" && typeof window !== "undefined";
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(target.isContentEditable);
}

function escapeHtml(text: unknown): string {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsQuotes = /[",\n\r]/.test(str);
  const escaped = str.replaceAll('"', '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function toCsv(args: { columns: StationColumn[]; rows: StationRow[] }): string {
  if (!Array.isArray(args.columns) || args.columns.length === 0) {
    throw new Error("DemoModes.toCsv: columns must be a non-empty array");
  }
  const header = args.columns.map((c) => csvEscape(c.label ?? c.key)).join(",");
  const lines = [header];
  for (const row of args.rows ?? []) {
    const line = args.columns.map((c) => csvEscape(row?.[c.key])).join(",");
    lines.push(line);
  }
  return lines.join("\n") + "\n";
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!isBrowser()) return [];
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => {
    if (el.hasAttribute("disabled")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  });
  return nodes;
}

function createDialog(args: {
  title?: string;
  subtitle?: string;
  ariaLabel?: string;
  bodyEl: HTMLElement;
}): Dialog {
  ensureStyles();
  if (!isBrowser()) {
    return { isOpen: () => false, open: () => {}, close: () => {} };
  }

  const previous = { active: null as HTMLElement | null };

  const backdrop = document.createElement("div");
  backdrop.className = "cp-modal-backdrop";

  const modal = document.createElement("div");
  modal.className = "cp-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", args.ariaLabel || args.title || "Dialog");
  modal.tabIndex = -1;

  const header = document.createElement("div");
  header.className = "cp-modal-header";
  header.innerHTML = `
    <div>
      <h2 class="cp-modal-title">${escapeHtml(args.title ?? "")}</h2>
      ${args.subtitle ? `<div class="cp-modal-subtitle">${escapeHtml(args.subtitle)}</div>` : ""}
    </div>
    <button class="cp-modal-close" type="button" aria-label="Close">&times;</button>
  `;

  const body = document.createElement("div");
  body.className = "cp-modal-body";
  body.appendChild(args.bodyEl);

  modal.appendChild(header);
  modal.appendChild(body);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const closeBtn = header.querySelector<HTMLButtonElement>(".cp-modal-close");

  function close() {
    backdrop.classList.remove("open");
    document.body.classList.remove("cp-printing");

    if (previous.active && document.contains(previous.active)) {
      previous.active.focus();
    }
    previous.active = null;
  }

  function open() {
    previous.active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    backdrop.classList.add("open");
    renderMath(modal);
    if (closeBtn) closeBtn.focus();
    else modal.focus();
  }

  function isOpen() {
    return backdrop.classList.contains("open");
  }

  backdrop.addEventListener("mousedown", (event) => {
    if (event.target === backdrop) close();
  });

  if (closeBtn) closeBtn.addEventListener("click", close);

  backdrop.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") return;

    const focusables = getFocusableElements(modal);
    if (focusables.length === 0) {
      event.preventDefault();
      modal.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === modal) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  return { isOpen, open, close };
}

function renderShortcutTable(shortcuts: DemoShortcut[]): HTMLElement {
  const table = document.createElement("table");
  table.className = "cp-shortcuts";
  table.innerHTML = `
    <thead>
      <tr><th style="width: 36%">Key</th><th>Action</th></tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");
  if (!tbody) return table;

  for (const item of shortcuts ?? []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><kbd class="cp-kbd">${escapeHtml(item.key ?? "")}</kbd></td>
      <td>${escapeHtml(item.action ?? "")}</td>
    `;
    tbody.appendChild(tr);
  }
  return table;
}

function renderBulletList(items: string[]): HTMLElement {
  const ul = document.createElement("ul");
  ul.style.margin = "0";
  ul.style.paddingLeft = "1.2rem";
  for (const item of items ?? []) {
    const li = document.createElement("li");
    li.textContent = String(item);
    ul.appendChild(li);
  }
  return ul;
}

function createHelpDialog(helpConfig: DemoHelpConfig): Dialog {
  const rootEl = document.createElement("div");

  for (const section of helpConfig.sections ?? []) {
    const sectionEl = document.createElement("div");
    sectionEl.className = "cp-modal-section";

    const h = document.createElement("h3");
    h.textContent = section.heading ?? "";
    sectionEl.appendChild(h);

    if (section.type === "shortcuts") {
      sectionEl.appendChild(
        renderShortcutTable((section.items ?? []) as DemoShortcut[])
      );
    } else if (section.type === "bullets") {
      sectionEl.appendChild(renderBulletList((section.items ?? []) as string[]));
    } else if (section.type === "html") {
      const div = document.createElement("div");
      div.innerHTML = section.html ?? "";
      sectionEl.appendChild(div);
    } else {
      sectionEl.appendChild(renderBulletList((section.items ?? []) as string[]));
    }

    rootEl.appendChild(sectionEl);
  }

  return createDialog({
    title: helpConfig.title ?? "Help",
    subtitle: helpConfig.subtitle ?? "",
    ariaLabel: helpConfig.ariaLabel ?? helpConfig.title ?? "Help",
    bodyEl: rootEl
  });
}

function createStationDialog(stationConfig: DemoStationConfig) {
  const state = { rows: [] as StationRow[] };

  const rootEl = document.createElement("div");

  if (Array.isArray(stationConfig.steps) && stationConfig.steps.length > 0) {
    const sectionEl = document.createElement("div");
    sectionEl.className = "cp-modal-section";
    const h = document.createElement("h3");
    h.textContent = "Steps";
    sectionEl.appendChild(h);

    const ol = document.createElement("ol");
    ol.style.margin = "0";
    ol.style.paddingLeft = "1.2rem";
    for (const step of stationConfig.steps) {
      const li = document.createElement("li");
      li.innerHTML = String(step);
      ol.appendChild(li);
    }
    sectionEl.appendChild(ol);
    rootEl.appendChild(sectionEl);
  }

  const columns = stationConfig.columns ?? [];
  const hasTable = Array.isArray(columns) && columns.length > 0;

  const tableSection = document.createElement("div");
  tableSection.className = "cp-modal-section";
  tableSection.innerHTML = `<h3>Data Table</h3>`;

  const actions = document.createElement("div");
  actions.className = "cp-station-actions";

  const btnSnapshot = document.createElement("button");
  btnSnapshot.type = "button";
  btnSnapshot.textContent = stationConfig.snapshotLabel ?? "Add row (snapshot)";

  const btnClear = document.createElement("button");
  btnClear.type = "button";
  btnClear.textContent = "Clear table";

  const btnCopyCsv = document.createElement("button");
  btnCopyCsv.type = "button";
  btnCopyCsv.textContent = "Copy CSV";

  const btnPrint = document.createElement("button");
  btnPrint.type = "button";
  btnPrint.textContent = "Print";

  actions.appendChild(btnSnapshot);
  if (stationConfig.rowSets?.length) {
    for (const rowSet of stationConfig.rowSets) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = rowSet.label ?? "Add rows";
      btn.addEventListener("click", () => {
        const rows = typeof rowSet.getRows === "function" ? rowSet.getRows() : [];
        addRows(rows);
      });
      actions.appendChild(btn);
    }
  }
  actions.appendChild(btnClear);
  actions.appendChild(btnCopyCsv);
  actions.appendChild(btnPrint);

  const tableWrap = document.createElement("div");
  const table = document.createElement("table");
  table.className = "cp-station-table";
  tableWrap.appendChild(table);

  const status = document.createElement("div");
  status.className = "cp-modal-status";
  status.setAttribute("aria-live", "polite");
  status.setAttribute("role", "status");

  tableSection.appendChild(actions);
  tableSection.appendChild(tableWrap);
  tableSection.appendChild(status);
  rootEl.appendChild(tableSection);

  if (stationConfig.synthesisPrompt) {
    const sectionEl = document.createElement("div");
    sectionEl.className = "cp-modal-section";
    const h = document.createElement("h3");
    h.textContent = "Synthesis";
    sectionEl.appendChild(h);
    const p = document.createElement("div");
    p.innerHTML = stationConfig.synthesisPrompt;
    sectionEl.appendChild(p);
    rootEl.appendChild(sectionEl);
  }

  const dialog = createDialog({
    title: stationConfig.title ?? "Station Mode",
    subtitle: stationConfig.subtitle ?? "",
    ariaLabel: stationConfig.ariaLabel ?? stationConfig.title ?? "Station Mode",
    bodyEl: rootEl
  });

  function setStatus(message: string) {
    status.textContent = message;
  }

  function renderTable() {
    if (!hasTable) {
      table.innerHTML = `<tbody><tr><td>No table configured.</td></tr></tbody>`;
      return;
    }

    const thead = `<thead><tr>${columns
      .map((c) => `<th>${escapeHtml(c.label ?? c.key)}</th>`)
      .join("")}</tr></thead>`;
    const tbodyRows = (state.rows ?? [])
      .map((row) => {
        const cells = columns
          .map((c) => `<td>${escapeHtml(row?.[c.key] ?? "")}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    table.innerHTML = `${thead}<tbody>${
      tbodyRows ||
      `<tr><td colspan="${columns.length}">No rows yet. Use “${escapeHtml(btnSnapshot.textContent)}”.</td></tr>`
    }</tbody>`;
  }

  function addRows(rows: StationRow[]) {
    for (const row of rows ?? []) {
      if (row && typeof row === "object") state.rows.push(row);
    }
    renderTable();
    if (rows?.length) setStatus(`Added ${rows.length} row(s).`);
  }

  function addSnapshotRow() {
    const row = stationConfig.getSnapshotRow();
    if (!row) {
      setStatus("Could not add row (no snapshot available).");
      return;
    }
    addRows([row]);
  }

  btnSnapshot.addEventListener("click", addSnapshotRow);
  btnClear.addEventListener("click", () => {
    state.rows = [];
    renderTable();
    setStatus("Cleared table.");
  });

  btnCopyCsv.addEventListener("click", async () => {
    if (!hasTable) {
      setStatus("No table configured.");
      return;
    }
    const csv = toCsv({ columns, rows: state.rows });
    try {
      await copyTextToClipboard(csv);
      setStatus("Copied CSV to clipboard.");
    } catch (err) {
      setStatus(err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.");
    }
  });

  btnPrint.addEventListener("click", async () => {
    document.body.classList.add("cp-printing");
    dialog.open();
    await new Promise((r) => setTimeout(r, 50));
    window.print();
    document.body.classList.remove("cp-printing");
  });

  renderTable();

  return {
    dialog,
    setRows: (rows: StationRow[]) => {
      state.rows = Array.isArray(rows) ? rows.slice() : [];
      renderTable();
    },
    addRows,
    addSnapshotRow,
    getRows: () => state.rows.slice()
  };
}

export function createDemoModes(config: {
  keys?: DemoModeKeys;
  bindKeys?: boolean;
  help?: DemoHelpConfig;
  station?: DemoStationConfig;
}) {
  const keys = { ...DEFAULT_KEYS, ...(config.keys ?? {}) };

  const helpDialog = config.help ? createHelpDialog(config.help) : null;
  const station = config.station ? createStationDialog(config.station) : null;

  function toggleHelp() {
    if (!helpDialog) return;
    if (helpDialog.isOpen()) helpDialog.close();
    else helpDialog.open();
  }

  function toggleStation() {
    if (!station) return;
    if (station.dialog.isOpen()) station.dialog.close();
    else station.dialog.open();
  }

  function bindButtons(args: {
    helpButton?: HTMLElement | null;
    stationButton?: HTMLElement | null;
  }) {
    if (helpDialog && args.helpButton) {
      args.helpButton.addEventListener("click", () => helpDialog.open());
    }
    if (station && args.stationButton) {
      args.stationButton.addEventListener("click", () => station.dialog.open());
    }
  }

  function bindKeys() {
    if (!isBrowser()) return;
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      if (helpDialog && event.key === keys.help) {
        event.preventDefault();
        toggleHelp();
        return;
      }
      if (station && event.key === keys.station) {
        event.preventDefault();
        toggleStation();
      }
    });
  }

  if (config.bindKeys !== false) bindKeys();

  return {
    bindButtons,
    help: helpDialog,
    station,
    keys
  };
}
