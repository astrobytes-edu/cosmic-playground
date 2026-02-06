/**
 * CpBottomSheet — Mobile controls drawer with drag-to-snap.
 *
 * Three snap points: collapsed (10vh), half (50vh), full (90vh).
 * JS owns: touch/pointer events, snap calculations, ARIA state.
 * CSS owns: transform, transitions, positioning.
 * Bridge: data-snap attribute ("collapsed" | "half" | "full").
 */

export type SnapPoint = "collapsed" | "half" | "full";

const SNAP_THRESHOLDS = {
  /** If dragged above 70% of viewport → snap full */
  full: 0.3,
  /** If dragged above 35% of viewport → snap half */
  half: 0.5,
  /** Otherwise → collapsed */
  collapsed: 0.9,
} as const;

/** Snap order for toggle: collapsed ↔ half */
const TOGGLE_MAP: Record<SnapPoint, SnapPoint> = {
  collapsed: "half",
  half: "collapsed",
  full: "half",
};

function setSnap(sheet: HTMLElement, snap: SnapPoint): void {
  sheet.setAttribute("data-snap", snap);

  // ARIA: expanded when not collapsed
  const handle = sheet.querySelector<HTMLElement>(".cp-bottom-sheet__handle");
  if (handle) {
    handle.setAttribute("aria-expanded", snap !== "collapsed" ? "true" : "false");
  }

  // Live region announcement
  const labels: Record<SnapPoint, string> = {
    collapsed: "Controls collapsed",
    half: "Controls expanded",
    full: "Controls fully expanded",
  };
  const region = sheet.querySelector<HTMLElement>('[aria-live]');
  if (region) {
    region.textContent = labels[snap];
  }
}

function getSnap(sheet: HTMLElement): SnapPoint {
  return (sheet.getAttribute("data-snap") as SnapPoint) || "collapsed";
}

function snapFromDragPosition(viewportY: number, viewportHeight: number): SnapPoint {
  const ratio = viewportY / viewportHeight;
  if (ratio <= SNAP_THRESHOLDS.full) return "full";
  if (ratio <= SNAP_THRESHOLDS.half) return "half";
  return "collapsed";
}

/**
 * Initialize the bottom sheet within a root element.
 * Finds `.cp-bottom-sheet` and wires up drag, tap, and outside-click behavior.
 * Returns a cleanup function to remove all event listeners.
 */
export function initBottomSheet(root: HTMLElement): () => void {
  const sheet = root.querySelector<HTMLElement>(".cp-bottom-sheet");
  if (!sheet) return () => {};

  const handle = sheet.querySelector<HTMLElement>(".cp-bottom-sheet__handle");
  if (!handle) return () => {};

  // Ensure initial state
  if (!sheet.hasAttribute("data-snap")) {
    setSnap(sheet, "collapsed");
  }

  let isDragging = false;
  let startY = 0;
  let startSnap: SnapPoint = "collapsed";

  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    startY = e.clientY;
    startSnap = getSnap(sheet);

    // Disable CSS transition during drag for immediate feedback
    sheet.style.transition = "none";
    if (handle.setPointerCapture) handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;

    // Calculate approximate position for visual feedback during drag
    const deltaY = e.clientY - startY;
    const currentTransform = getComputedStyle(sheet).transform;
    // Let CSS handle intermediate positions via a temporary transform
    // We track the pointer position and snap on release
    void deltaY;
    void currentTransform;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;

    // Re-enable CSS transition
    sheet.style.transition = "";

    const endY = e.clientY;
    const deltaY = endY - startY;

    // If drag distance is small, treat as tap → toggle
    if (Math.abs(deltaY) < 10) {
      setSnap(sheet, TOGGLE_MAP[startSnap]);
      return;
    }

    // Snap based on where the pointer ended
    const snap = snapFromDragPosition(endY, window.innerHeight);
    setSnap(sheet, snap);
  };

  // Touch outside sheet while expanded → collapse
  const onOutsideClick = (e: Event) => {
    const snap = getSnap(sheet);
    if (snap === "collapsed") return;
    if (!sheet.contains(e.target as Node)) {
      setSnap(sheet, "collapsed");
    }
  };

  // Keyboard: Escape → collapse
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && getSnap(sheet) !== "collapsed") {
      e.preventDefault();
      setSnap(sheet, "collapsed");
    }
  };

  handle.addEventListener("pointerdown", onPointerDown);
  handle.addEventListener("pointermove", onPointerMove);
  handle.addEventListener("pointerup", onPointerUp);
  document.addEventListener("click", onOutsideClick);
  document.addEventListener("keydown", onKeydown);

  const cleanups = () => {
    handle.removeEventListener("pointerdown", onPointerDown);
    handle.removeEventListener("pointermove", onPointerMove);
    handle.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("click", onOutsideClick);
    document.removeEventListener("keydown", onKeydown);
  };

  return cleanups;
}
