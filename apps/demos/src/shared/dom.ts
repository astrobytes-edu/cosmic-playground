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

