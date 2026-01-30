export type StubDemoOptions = {
  slug: string;
  title: string;
  oneLiner: string;
};

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function initStubDemo(options: StubDemoOptions) {
  const root = document.querySelector<HTMLElement>("#cp-demo");
  if (!root) throw new Error("Missing #cp-demo root.");

  root.classList.add("cp-layer-instrument", "cp-demo");

  const exhibitHref = `../../exhibits/${encodeURIComponent(options.slug)}/`;
  const stationHref = `../../stations/${encodeURIComponent(options.slug)}/`;
  const instructorHref = `../../instructor/${encodeURIComponent(options.slug)}/`;

  root.innerHTML = `
    <aside class="cp-demo__controls cp-panel" aria-label="Controls panel">
      <div class="cp-panel-header">${escapeHtml(options.title)}</div>
      <div class="cp-panel-body">
        <p class="cp-muted">${escapeHtml(options.oneLiner)}</p>
        <div class="cp-callout" data-kind="model">
          This is a stub while we migrate the legacy version into the new runtime.
        </div>
        <div class="cp-actions">
          <a class="cp-button" href="${exhibitHref}">Open exhibit</a>
          <a class="cp-button cp-button--ghost" href="${stationHref}">Station card</a>
          <a class="cp-button cp-button--ghost" href="${instructorHref}">Instructor notes</a>
        </div>
      </div>
    </aside>

    <section class="cp-demo__stage cp-stage cp-stage--stub" aria-label="Visualization stage">
      <div class="cp-stage__inner">
        <p class="cp-stage__headline">Migration pending</p>
        <p class="cp-muted">
          This space will host the interactive visualization once the demo is migrated.
        </p>
      </div>
    </section>

    <aside class="cp-demo__readouts cp-panel" aria-label="Readouts panel">
      <div class="cp-panel-header">Readouts</div>
      <div class="cp-panel-body">
        <p class="cp-muted">
          Readouts and “what to notice” will live here once the demo is migrated.
        </p>
        <div class="cp-readout">
          <div class="cp-readout__label">(example) Key value</div>
          <div class="cp-readout__value">—</div>
        </div>
        <div class="cp-notice">
          <h3>What to notice</h3>
          <ul>
            <li>How changing a parameter changes the output.</li>
            <li>What stays invariant across the model.</li>
          </ul>
        </div>
      </div>
    </aside>

    <section class="cp-demo__drawer cp-drawer" aria-label="Model notes">
      <strong>Model notes</strong>
      <ul>
        <li>This stub contains no physics yet; it’s a placeholder <code>/play/</code> target.</li>
        <li>When migrated, this drawer will host math mode + deeper model notes.</li>
      </ul>
    </section>
  `;
}
