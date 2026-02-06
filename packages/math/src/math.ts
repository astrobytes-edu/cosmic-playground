export const EPS = 1e-12;

/** Evenly spaced grid including both endpoints. */
export function linspace(min: number, max: number, n: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(n)) {
    throw new Error("linspace requires finite numeric arguments");
  }
  if (n < 2) return [min];
  const step = (max - min) / (n - 1);
  return Array.from({ length: n }, (_, index) => min + index * step);
}

/** Log-spaced grid: base^(linspace(minExponent, maxExponent, n)). */
export function logspace(
  minExponent: number,
  maxExponent: number,
  n: number,
  base = 10
): number[] {
  if (
    !Number.isFinite(minExponent) ||
    !Number.isFinite(maxExponent) ||
    !Number.isFinite(n) ||
    !Number.isFinite(base)
  ) {
    throw new Error("logspace requires finite numeric arguments");
  }
  if (!(base > 0) || Math.abs(base - 1) < EPS) {
    throw new Error("logspace requires base > 0 and base != 1");
  }
  if (n < 2) return [Math.pow(base, minExponent)];
  return linspace(minExponent, maxExponent, n).map((exponent) =>
    Math.pow(base, exponent)
  );
}

/** Clamp value into [min, max]. */
export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

/** Trapezoidal integration on a tabulated grid. */
export function integrateTrapz(f: (x: number) => number, x: number[]): number {
  if (x.length < 2) return 0;
  let sum = 0;
  for (let index = 0; index < x.length - 1; index += 1) {
    const x0 = x[index];
    const x1 = x[index + 1];
    const dx = x1 - x0;
    if (!(dx > 0)) {
      throw new Error("integrateTrapz requires a strictly increasing grid");
    }
    sum += 0.5 * dx * (f(x0) + f(x1));
  }
  return sum;
}

/** Simpson integration on an odd, evenly spaced grid. */
export function integrateSimpson(f: (x: number) => number, x: number[]): number {
  const y = x.map((value) => f(value));
  return integrateSimpsonSamples(y, x);
}

/** Simpson integration for tabulated samples y(x). */
export function integrateSimpsonSamples(y: number[], x: number[]): number {
  if (y.length !== x.length) {
    throw new Error("Simpson samples require x/y arrays of equal length");
  }
  if (x.length < 3 || x.length % 2 === 0) {
    throw new Error("Simpson requires an odd number of points >= 3");
  }

  const h = (x[x.length - 1] - x[0]) / (x.length - 1);
  if (!(h > 0)) throw new Error("Simpson requires a strictly increasing grid");

  for (let index = 1; index < x.length; index += 1) {
    const step = x[index] - x[index - 1];
    if (!(step > 0)) throw new Error("Simpson requires a strictly increasing grid");
    if (Math.abs(step - h) > Math.max(Math.abs(h) * 1e-8, EPS)) {
      throw new Error("Simpson requires evenly spaced grid points");
    }
  }

  let sum = y[0] + y[x.length - 1];
  for (let index = 1; index < x.length - 1; index += 1) {
    sum += (index % 2 === 0 ? 2 : 4) * y[index];
  }

  return (h / 3) * sum;
}

/** Deterministic bracketed root finder. */
export function findRootBisection(
  f: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-6,
  maxIter = 100
): number {
  let lo = Math.min(a, b);
  let hi = Math.max(a, b);
  let flo = f(lo);
  let fhi = f(hi);

  if (!(Number.isFinite(flo) && Number.isFinite(fhi))) {
    throw new Error("Function returned non-finite endpoint value");
  }
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if (flo * fhi > 0) {
    throw new Error("Root not bracketed");
  }

  let mid = lo;
  for (let iter = 0; iter < maxIter; iter += 1) {
    mid = 0.5 * (lo + hi);
    const fmid = f(mid);
    if (!Number.isFinite(fmid)) {
      throw new Error("Function returned non-finite midpoint value");
    }
    if (Math.abs(fmid) < tol || Math.abs(hi - lo) < tol) {
      return mid;
    }

    if (flo * fmid < 0) {
      hi = mid;
      fhi = fmid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }
  return mid;
}

/** Newton-Raphson root finder with finite guards. */
export function findRootNewton(
  f: (x: number) => number,
  df: (x: number) => number,
  x0: number,
  tol = 1e-6,
  maxIter = 50
): number {
  let x = x0;

  for (let iter = 0; iter < maxIter; iter += 1) {
    const fx = f(x);
    const dfx = df(x);

    if (!Number.isFinite(fx) || !Number.isFinite(dfx)) {
      throw new Error("Non-finite Newton evaluation");
    }
    if (Math.abs(dfx) < EPS) {
      throw new Error("Derivative too small");
    }

    const xNext = x - fx / dfx;
    if (!Number.isFinite(xNext)) {
      throw new Error("Diverged");
    }
    if (Math.abs(xNext - x) < tol) {
      return xNext;
    }
    x = xNext;
  }

  return x;
}

/** Piecewise-linear interpolation on a strictly increasing grid. */
export function interp1(x: number[], y: number[], xq: number): number {
  const n = x.length;
  if (n !== y.length) throw new Error("x/y length mismatch");
  if (n === 0) throw new Error("interp1 requires non-empty arrays");
  if (n === 1) return y[0];

  for (let index = 1; index < n; index += 1) {
    if (!(x[index] > x[index - 1])) {
      throw new Error("interp1 requires strictly increasing x");
    }
  }

  if (xq <= x[0]) return y[0];
  if (xq >= x[n - 1]) return y[n - 1];

  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (x[mid] <= xq) lo = mid;
    else hi = mid;
  }

  const t = (xq - x[lo]) / (x[lo + 1] - x[lo]);
  return (1 - t) * y[lo] + t * y[lo + 1];
}
