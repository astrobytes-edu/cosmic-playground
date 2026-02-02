export function setLiveRegionText(el: HTMLElement, text: string): void {
  const prev = el.textContent ?? "";
  if (prev !== text) {
    el.textContent = text;
    return;
  }

  // If the same status message repeats, some screen readers may not re-announce it.
  // Clear then set on a future frame to force a DOM change.
  el.textContent = "";
  const schedule =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (cb: FrameRequestCallback) => setTimeout(cb, 0);
  schedule(() => {
    el.textContent = text;
  });
}

