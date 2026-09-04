export function requiredSelector<T extends Element>(
  selector: string,
  root: ParentNode = document
): T {
  const el = root.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Missing required DOM element: ${selector}`);
  }
  return el;
}

/**
 * Resolve a canvas 2D context, or throw.
 *
 * `HTMLCanvasElement.getContext` is typed `CanvasRenderingContext2D | null`, and a
 * module-level `if (!ctx) throw` does NOT narrow the binding inside hoisted `function`
 * declarations that close over it (the function could, in principle, run before the
 * check). Narrowing here — at the boundary — is what makes the non-null type survive
 * into every draw routine, instead of forcing a non-null assertion at each use.
 *
 * @param canvas  the canvas to bind
 * @param label   human-readable context for the error message; defaults to the
 *                canvas id (or "canvas") so a failure is diagnosable in the field
 */
export function requiredContext2d(
  canvas: HTMLCanvasElement,
  label?: string
): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const where = label ?? (canvas.id ? `#${canvas.id}` : "canvas");
    throw new Error(`Canvas 2D context unavailable (${where}).`);
  }
  return ctx;
}
