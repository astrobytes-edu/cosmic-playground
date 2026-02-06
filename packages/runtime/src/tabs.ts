/**
 * CpTabs — Horizontal tab bar with panel switching.
 *
 * Implements the WAI-ARIA Tabs pattern:
 * - Click tab → show panel, hide others, set aria-selected
 * - Arrow left/right → move between tabs
 * - Home/End → first/last tab
 *
 * JS owns: event listeners, attribute toggling, ARIA state.
 * CSS owns: visual styling, transitions, hidden state.
 */

function activateTab(
  tab: HTMLElement,
  allTabs: HTMLElement[],
  allPanels: HTMLElement[]
): void {
  // Deactivate all tabs
  for (const t of allTabs) {
    t.setAttribute("aria-selected", "false");
    t.setAttribute("tabindex", "-1");
    t.classList.remove("cp-tab--active");
  }

  // Hide all panels
  for (const p of allPanels) {
    p.hidden = true;
  }

  // Activate the selected tab
  tab.setAttribute("aria-selected", "true");
  tab.setAttribute("tabindex", "0");
  tab.classList.add("cp-tab--active");

  // Show the associated panel
  const panelId = tab.getAttribute("aria-controls");
  if (panelId) {
    const panel = document.getElementById(panelId);
    if (panel) panel.hidden = false;
  }
}

/**
 * Initialize all tab groups within a root element.
 * Scans for `[role="tablist"]` elements and wires up behavior.
 * Returns a cleanup function to remove all event listeners.
 */
export function initTabs(root: HTMLElement): () => void {
  const tablists = root.querySelectorAll<HTMLElement>('[role="tablist"]');
  const cleanups: (() => void)[] = [];

  for (const tablist of tablists) {
    const tabs = Array.from(
      tablist.querySelectorAll<HTMLElement>('[role="tab"]')
    );
    if (tabs.length === 0) continue;

    // Gather all associated panels
    const panels: HTMLElement[] = [];
    for (const tab of tabs) {
      const panelId = tab.getAttribute("aria-controls");
      if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) panels.push(panel);
      }
    }

    // Set initial state: first tab with aria-selected="true" is active,
    // or default to the first tab
    const initialActive =
      tabs.find((t) => t.getAttribute("aria-selected") === "true") ?? tabs[0];
    activateTab(initialActive, tabs, panels);

    // Click handler
    const onClick = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        '[role="tab"]'
      );
      if (target && tabs.includes(target)) {
        activateTab(target, tabs, panels);
        target.focus();
      }
    };

    // Keyboard navigation
    const onKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target.matches('[role="tab"]')) return;

      const currentIndex = tabs.indexOf(target);
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = (currentIndex + 1) % tabs.length;
          break;
        case "ArrowLeft":
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      activateTab(tabs[nextIndex], tabs, panels);
      tabs[nextIndex].focus();
    };

    tablist.addEventListener("click", onClick);
    tablist.addEventListener("keydown", onKeydown);

    cleanups.push(() => {
      tablist.removeEventListener("click", onClick);
      tablist.removeEventListener("keydown", onKeydown);
    });
  }

  return () => {
    for (const fn of cleanups) fn();
  };
}
