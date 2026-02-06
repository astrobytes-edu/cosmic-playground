import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initTabs } from "./tabs";

function createTabsHTML(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <div class="cp-tabs" role="tablist" aria-label="Test tabs">
      <button class="cp-tab" role="tab" aria-selected="true" aria-controls="panel-a">Tab A</button>
      <button class="cp-tab" role="tab" aria-selected="false" aria-controls="panel-b">Tab B</button>
      <button class="cp-tab" role="tab" aria-selected="false" aria-controls="panel-c">Tab C</button>
    </div>
    <div class="cp-tab-panel" id="panel-a" role="tabpanel">Panel A content</div>
    <div class="cp-tab-panel" id="panel-b" role="tabpanel" hidden>Panel B content</div>
    <div class="cp-tab-panel" id="panel-c" role="tabpanel" hidden>Panel C content</div>
  `;
  document.body.appendChild(root);
  return root;
}

describe("CpTabs", () => {
  let root: HTMLElement;
  let cleanup: () => void;
  let tabs: HTMLElement[];
  let panels: HTMLElement[];

  beforeEach(() => {
    root = createTabsHTML();
    cleanup = initTabs(root);
    tabs = Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]'));
    panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  });

  afterEach(() => {
    cleanup();
    root.remove();
  });

  it("initializes with first tab active", () => {
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].classList.contains("cp-tab--active")).toBe(true);
    expect(tabs[0].getAttribute("tabindex")).toBe("0");
    expect(panels[0].hidden).toBe(false);
  });

  it("deactivates other tabs on init", () => {
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(tabs[1].getAttribute("tabindex")).toBe("-1");
    expect(panels[1].hidden).toBe(true);
  });

  it("switches tab on click", () => {
    tabs[1].click();
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].classList.contains("cp-tab--active")).toBe(true);
    expect(panels[1].hidden).toBe(false);

    // Previous tab is deactivated
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    expect(tabs[0].classList.contains("cp-tab--active")).toBe(false);
    expect(panels[0].hidden).toBe(true);
  });

  it("navigates right with ArrowRight", () => {
    tabs[0].focus();
    tabs[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );

    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(panels[1].hidden).toBe(false);
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("wraps around with ArrowRight from last tab", () => {
    tabs[2].click(); // activate last
    tabs[2].focus();
    tabs[2].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );

    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("navigates left with ArrowLeft", () => {
    tabs[1].click(); // activate second
    tabs[1].focus();
    tabs[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })
    );

    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("wraps around with ArrowLeft from first tab", () => {
    tabs[0].focus();
    tabs[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })
    );

    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[2]);
  });

  it("Home key moves to first tab", () => {
    tabs[2].click();
    tabs[2].focus();
    tabs[2].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true })
    );

    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("End key moves to last tab", () => {
    tabs[0].focus();
    tabs[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true })
    );

    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[2]);
  });

  it("only one panel is visible at a time", () => {
    tabs[1].click();
    const visible = panels.filter((p) => !p.hidden);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("panel-b");
  });

  it("cleanup removes event listeners", () => {
    cleanup();
    const initialSelected = tabs[0].getAttribute("aria-selected");
    tabs[1].click();
    // After cleanup, clicks should not change state
    expect(tabs[0].getAttribute("aria-selected")).toBe(initialSelected);
  });
});
