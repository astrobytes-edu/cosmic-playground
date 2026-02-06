/**
 * CpPopover — Click-triggered floating panel behavior.
 *
 * JS owns: event listeners, attribute toggling, ARIA state, focus management.
 * CSS owns: positioning, sizing, transitions, visibility.
 * Bridge: hidden attribute, aria-expanded, aria-controls.
 */

/** Find the first focusable element inside a container. */
function firstFocusable(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
}

/** Return focus to the trigger that opened this popover. */
function returnFocusToTrigger(trigger: HTMLElement): void {
  trigger.focus();
}

/** Set up a focus trap: Tab cycles within container, Shift+Tab wraps back. */
function trapFocus(container: HTMLElement, e: KeyboardEvent): void {
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openPopover(trigger: HTMLElement, popover: HTMLElement): void {
  popover.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  const target = firstFocusable(popover);
  if (target) target.focus();
}

function closePopover(trigger: HTMLElement, popover: HTMLElement): void {
  popover.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  returnFocusToTrigger(trigger);
}

function isOpen(popover: HTMLElement): boolean {
  return !popover.hidden;
}

/**
 * Initialize all popovers within a root element.
 * Scans for `.cp-popover-trigger` elements and wires up behavior.
 * Returns a cleanup function to remove all event listeners.
 */
export function initPopovers(root: HTMLElement): () => void {
  const triggers = root.querySelectorAll<HTMLElement>(".cp-popover-trigger");
  const cleanups: (() => void)[] = [];

  for (const trigger of triggers) {
    const popoverId = trigger.getAttribute("aria-controls");
    if (!popoverId) continue;

    const popover = root.querySelector<HTMLElement>(`#${popoverId}`);
    if (!popover) continue;

    // Ensure initial state is closed
    popover.hidden = true;
    trigger.setAttribute("aria-expanded", "false");

    // Click trigger → toggle
    const onTriggerClick = (e: Event) => {
      e.stopPropagation();
      if (isOpen(popover)) {
        closePopover(trigger, popover);
      } else {
        openPopover(trigger, popover);
      }
    };

    // Escape → close
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen(popover)) {
        e.preventDefault();
        closePopover(trigger, popover);
      }
      if (e.key === "Tab" && isOpen(popover)) {
        trapFocus(popover, e);
      }
    };

    // Click outside → close
    const onOutsideClick = (e: Event) => {
      if (
        isOpen(popover) &&
        !trigger.contains(e.target as Node) &&
        !popover.contains(e.target as Node)
      ) {
        closePopover(trigger, popover);
      }
    };

    trigger.addEventListener("click", onTriggerClick);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onOutsideClick);

    cleanups.push(() => {
      trigger.removeEventListener("click", onTriggerClick);
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onOutsideClick);
    });
  }

  return () => {
    for (const fn of cleanups) fn();
  };
}
