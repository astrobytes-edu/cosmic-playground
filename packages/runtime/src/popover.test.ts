import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initPopovers } from "./popover";

function createPopoverHTML(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <div class="cp-popover-anchor">
      <button class="cp-popover-trigger" aria-expanded="false" aria-controls="testPopover">
        Open
      </button>
      <div class="cp-popover" id="testPopover" role="dialog" aria-label="Test" hidden>
        <div class="cp-popover__body">
          <button id="innerBtn">Inner</button>
          <a href="#" id="innerLink">Link</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  return root;
}

describe("CpPopover", () => {
  let root: HTMLElement;
  let cleanup: () => void;
  let trigger: HTMLElement;
  let popover: HTMLElement;

  beforeEach(() => {
    root = createPopoverHTML();
    cleanup = initPopovers(root);
    trigger = root.querySelector<HTMLElement>(".cp-popover-trigger")!;
    popover = root.querySelector<HTMLElement>("#testPopover")!;
  });

  afterEach(() => {
    cleanup();
    root.remove();
  });

  it("starts closed with aria-expanded=false", () => {
    expect(popover.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens on trigger click", () => {
    trigger.click();
    expect(popover.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes on second trigger click", () => {
    trigger.click(); // open
    trigger.click(); // close
    expect(popover.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on Escape key", () => {
    trigger.click(); // open
    expect(popover.hidden).toBe(false);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(popover.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not close on Escape when already closed", () => {
    // Should not throw or change state
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(popover.hidden).toBe(true);
  });

  it("closes on outside click", () => {
    trigger.click(); // open
    expect(popover.hidden).toBe(false);

    // Click on the body (outside popover)
    document.body.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );
    expect(popover.hidden).toBe(true);
  });

  it("does not close when clicking inside popover body", () => {
    trigger.click(); // open
    const innerBtn = root.querySelector<HTMLElement>("#innerBtn")!;
    innerBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(popover.hidden).toBe(false);
  });

  it("moves focus into popover on open", () => {
    trigger.click();
    // First focusable inside the popover body should receive focus
    const innerBtn = root.querySelector<HTMLElement>("#innerBtn")!;
    expect(document.activeElement).toBe(innerBtn);
  });

  it("returns focus to trigger on close", () => {
    trigger.click(); // open
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(document.activeElement).toBe(trigger);
  });

  it("cleanup removes all event listeners", () => {
    cleanup();
    trigger.click();
    // After cleanup, clicks should not toggle the popover
    // (hidden attribute was already set to true by init)
    expect(popover.hidden).toBe(true);
  });
});

describe("CpPopover — multiple popovers", () => {
  it("initializes multiple independent popovers", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div class="cp-popover-anchor">
        <button class="cp-popover-trigger" aria-expanded="false" aria-controls="pop1">A</button>
        <div class="cp-popover" id="pop1" hidden><div class="cp-popover__body"><button>X</button></div></div>
      </div>
      <div class="cp-popover-anchor">
        <button class="cp-popover-trigger" aria-expanded="false" aria-controls="pop2">B</button>
        <div class="cp-popover" id="pop2" hidden><div class="cp-popover__body"><button>Y</button></div></div>
      </div>
    `;
    document.body.appendChild(root);

    const cleanup = initPopovers(root);
    const triggers = root.querySelectorAll<HTMLElement>(".cp-popover-trigger");
    const pop1 = root.querySelector<HTMLElement>("#pop1")!;
    const pop2 = root.querySelector<HTMLElement>("#pop2")!;

    triggers[0].click();
    expect(pop1.hidden).toBe(false);
    expect(pop2.hidden).toBe(true);

    triggers[1].click();
    expect(pop2.hidden).toBe(false);
    // pop1 stays open (independent)
    expect(pop1.hidden).toBe(false);

    cleanup();
    root.remove();
  });
});
