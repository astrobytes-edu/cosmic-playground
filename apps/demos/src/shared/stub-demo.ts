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

  const exhibitHref = `../../exhibits/${encodeURIComponent(options.slug)}/`;
  const stationHref = `../../stations/${encodeURIComponent(options.slug)}/`;
  const instructorHref = `../../instructor/${encodeURIComponent(options.slug)}/`;

  root.innerHTML = `
    <header class="cp-header">
      <h1>${escapeHtml(options.title)}</h1>
      <p class="cp-subtitle">${escapeHtml(options.oneLiner)}</p>
    </header>

    <section class="cp-instrument" aria-label="Demo instrument">
      <aside class="cp-panel" aria-label="Controls">
        <h2 class="cp-panel-title">Controls</h2>
        <p class="cp-muted">
          This demo is a stub while we migrate the legacy version into the new runtime.
        </p>
        <div class="cp-actions">
          <a class="cp-button" href="${exhibitHref}">Open exhibit</a>
          <a class="cp-button cp-button--ghost" href="${stationHref}">Station card</a>
          <a class="cp-button cp-button--ghost" href="${instructorHref}">Instructor notes</a>
        </div>
      </aside>

      <main class="cp-stage" aria-label="Visualization stage">
        <div class="cp-stage__inner">
          <p class="cp-stage__headline">Migration pending</p>
          <p class="cp-muted">
            In the next milestone, this space will host the interactive visualization
            with consistent controls and readouts.
          </p>
        </div>
      </main>

      <aside class="cp-panel" aria-label="Readouts">
        <h2 class="cp-panel-title">Readouts</h2>
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
      </aside>
    </section>
  `;
}

