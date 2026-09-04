/**
 * Wrap every markdown-rendered <table> in a horizontally scrollable region.
 *
 * Instructor and station bundles contain wide reference tables (backlog grids, clicker
 * item banks, parameter tables). At a 320px viewport these forced the whole page to
 * scroll horizontally, failing WCAG 2.2 SC 1.4.10 (Reflow) on every /instructor/* and
 * /stations/* route.
 *
 * Wrapping (rather than setting `display: block` on the table itself) is deliberate:
 * `display: block` drops the table role from the accessibility tree in several browsers,
 * trading a reflow failure for a worse one.
 *
 * The wrapper is focusable and labelled because a scrollable region must be reachable by
 * keyboard (WCAG 2.1.1); browsers do not make an overflow container focusable on its own.
 *
 * Written as a plain hast walk so it needs no additional dependency.
 */
export default function rehypeScrollableTables() {
  return (tree) => {
    visit(tree);
  };

  function visit(node) {
    if (!node || !Array.isArray(node.children)) return;

    for (let i = 0; i < node.children.length; i += 1) {
      const child = node.children[i];
      if (child && child.type === "element" && child.tagName === "table") {
        // Skip if this table is already wrapped (idempotent across re-runs).
        const alreadyWrapped =
          node.type === "element" &&
          node.tagName === "div" &&
          node.properties?.className?.includes?.("cp-table-scroll");
        if (!alreadyWrapped) {
          node.children[i] = {
            type: "element",
            tagName: "div",
            properties: {
              className: ["cp-table-scroll"],
              tabIndex: 0,
              role: "region",
              "aria-label": "Scrollable table"
            },
            children: [child]
          };
        }
      }
      visit(node.children[i]);
    }
  }
}
