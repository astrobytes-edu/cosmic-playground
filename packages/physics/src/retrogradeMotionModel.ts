import { AstroConstants } from "./astroConstants";
import { solveEccentricAnomalyRadDeterministic } from "./keplerSolver";
import { TwoBodyAnalytic } from "./twoBodyAnalytic";

const TAU = 2 * Math.PI;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function wrap0ToTauRad(thetaRad: number): number {
  if (!Number.isFinite(thetaRad)) return Number.NaN;
  const wrapped = ((thetaRad % TAU) + TAU) % TAU;
  // Ensure 2π maps to 0, keeping the range [0, 2π).
  return wrapped === TAU ? 0 : wrapped;
}

function wrap0To360Deg(deg: number): number {
  if (!Number.isFinite(deg)) return Number.NaN;
  const wrapped = ((deg % 360) + 360) % 360;
  return wrapped === 360 ? 0 : wrapped;
}

function wrapDeltaDeg180(deltaDeg: number): number {
  let d = deltaDeg;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

const DT_INTERNAL_DAY = 0.25;
const MODEL_MONTH_DAYS = 30;
const STATIONARY_TOL_DAY = 1e-3;

const PLANET_ELEMENTS = {
  // "Toy J2000-ish" heliocentric elements for a coplanar Keplerian teaching model.
  // These are not used for real-world date prediction; they just set a deterministic phase reference.
  Venus: { aAu: 0.72333199, e: 0.00677323, varpiDeg: 131.602467, L0Deg: 181.97973 },
  Earth: { aAu: 1.00000011, e: 0.01671022, varpiDeg: 102.937682, L0Deg: 100.464572 },
  Mars: { aAu: 1.52366231, e: 0.09341233, varpiDeg: 336.04084, L0Deg: 355.45332 },
  Jupiter: { aAu: 5.20336301, e: 0.04839266, varpiDeg: 14.75385, L0Deg: 34.40438 },
  Saturn: { aAu: 9.53707032, e: 0.0541506, varpiDeg: 92.43194, L0Deg: 49.94432 }
} as const;

export type RetrogradePlanetKey = keyof typeof PLANET_ELEMENTS;

function isFiniteEccentricity(e: number): boolean {
  return Number.isFinite(e) && e >= 0 && e < 1;
}

export const RetrogradeMotionModel = {
  modelYearDays(): number {
    return AstroConstants.TIME.YEAR_S / AstroConstants.TIME.DAY_S;
  },

  solveEccentricAnomalyRad(args: {
    meanAnomalyRad: number;
    eccentricity: number;
    toleranceRad?: number;
    maxIterations?: number;
  }): number {
    return solveEccentricAnomalyRadDeterministic(args);
  }
  ,

  orbitStateAtModelDay(args: {
    elements: { aAu: number; e: number; varpiDeg: number; L0Deg: number };
    tDay: number;
    t0Day: number;
    centralMassSolar?: number;
  }): {
    tDay: number;
    meanLongitudeDeg: number;
    meanAnomalyRad: number;
    eccentricAnomalyRad: number;
    trueAnomalyRad: number;
    rAu: number;
    xAu: number;
    yAu: number;
  } {
    const aAu = args.elements.aAu;
    const e = args.elements.e;
    const varpiDeg = args.elements.varpiDeg;
    const L0Deg = args.elements.L0Deg;
    const tDay = args.tDay;
    const t0Day = args.t0Day;
    const centralMassSolar =
      Number.isFinite(args.centralMassSolar) && args.centralMassSolar! > 0
        ? args.centralMassSolar!
        : 1;

    if (!Number.isFinite(aAu) || !(aAu > 0)) {
      return {
        tDay,
        meanLongitudeDeg: Number.NaN,
        meanAnomalyRad: Number.NaN,
        eccentricAnomalyRad: Number.NaN,
        trueAnomalyRad: Number.NaN,
        rAu: Number.NaN,
        xAu: Number.NaN,
        yAu: Number.NaN
      };
    }
    if (!isFiniteEccentricity(e)) {
      return {
        tDay,
        meanLongitudeDeg: Number.NaN,
        meanAnomalyRad: Number.NaN,
        eccentricAnomalyRad: Number.NaN,
        trueAnomalyRad: Number.NaN,
        rAu: Number.NaN,
        xAu: Number.NaN,
        yAu: Number.NaN
      };
    }
    if (![varpiDeg, L0Deg, tDay, t0Day].every(Number.isFinite)) {
      return {
        tDay,
        meanLongitudeDeg: Number.NaN,
        meanAnomalyRad: Number.NaN,
        eccentricAnomalyRad: Number.NaN,
        trueAnomalyRad: Number.NaN,
        rAu: Number.NaN,
        xAu: Number.NaN,
        yAu: Number.NaN
      };
    }

    const pYr = TwoBodyAnalytic.orbitalPeriodYrFromAuSolar({
      aAu,
      massSolar: centralMassSolar
    });
    const yearDays = RetrogradeMotionModel.modelYearDays();
    const pDay = pYr * yearDays;
    const nRadPerDay = (2 * Math.PI) / pDay;

    const meanLongitudeDeg = L0Deg + RAD_TO_DEG * nRadPerDay * (tDay - t0Day);
    const meanAnomalyRad = wrap0ToTauRad(DEG_TO_RAD * (meanLongitudeDeg - varpiDeg));

    const eccentricAnomalyRad = solveEccentricAnomalyRadDeterministic({
      meanAnomalyRad,
      eccentricity: e
    });

    const sinE2 = Math.sin(eccentricAnomalyRad / 2);
    const cosE2 = Math.cos(eccentricAnomalyRad / 2);
    const trueAnomalyRad =
      2 *
      Math.atan2(
        Math.sqrt(1 + e) * sinE2,
        Math.sqrt(1 - e) * cosE2
      );

    const rAu = aAu * (1 - e * Math.cos(eccentricAnomalyRad));
    const varpiRad = DEG_TO_RAD * varpiDeg;
    const theta = trueAnomalyRad + varpiRad;
    const xAu = rAu * Math.cos(theta);
    const yAu = rAu * Math.sin(theta);

    return {
      tDay,
      meanLongitudeDeg,
      meanAnomalyRad,
      eccentricAnomalyRad,
      trueAnomalyRad,
      rAu,
      xAu,
      yAu
    };
  },

  /**
   * Phase-unwrapping over a wrapped [0,360) series using the explicit 180° jump rule.
   * (Design spec contract.)
   */
  unwrapDeg180(wrappedDeg: number[]): number[] {
    if (wrappedDeg.length === 0) return [];
    const out: number[] = new Array(wrappedDeg.length);
    out[0] = wrappedDeg[0];
    for (let i = 1; i < wrappedDeg.length; i++) {
      const prev = wrappedDeg[i - 1];
      const cur = wrappedDeg[i];
      const delta = wrapDeltaDeg180(cur - prev);
      out[i] = out[i - 1] + delta;
    }
    return out;
  },

  /**
   * Central difference derivative for an unwrapped series in degrees.
   * Endpoints use one-sided differences (design spec contract).
   */
  centralDifferenceDegPerDay(args: { yDeg: number[]; dtDay: number }): number[] {
    const y = args.yDeg;
    const dt = args.dtDay;
    const n = y.length;
    if (n === 0) return [];
    if (!Number.isFinite(dt) || !(dt > 0)) return y.map(() => Number.NaN);
    if (n === 1) return [Number.NaN];

    const out: number[] = new Array(n);
    out[0] = (y[1] - y[0]) / dt;
    for (let i = 1; i < n - 1; i++) {
      out[i] = (y[i + 1] - y[i - 1]) / (2 * dt);
    }
    out[n - 1] = (y[n - 1] - y[n - 2]) / dt;
    return out;
  },

  dtInternalDay(): number {
    return DT_INTERNAL_DAY;
  },

  modelMonthDays(): number {
    return MODEL_MONTH_DAYS;
  },

  planetElements(key: RetrogradePlanetKey) {
    return PLANET_ELEMENTS[key];
  },

  lambdaAppWrappedDegAtModelDay(args: {
    observer: RetrogradePlanetKey;
    target: RetrogradePlanetKey;
    tDay: number;
    t0Day: number;
  }): number {
    const o = RetrogradeMotionModel.orbitStateAtModelDay({
      elements: PLANET_ELEMENTS[args.observer],
      tDay: args.tDay,
      t0Day: args.t0Day
    });
    const t = RetrogradeMotionModel.orbitStateAtModelDay({
      elements: PLANET_ELEMENTS[args.target],
      tDay: args.tDay,
      t0Day: args.t0Day
    });

    const dx = t.xAu - o.xAu;
    const dy = t.yAu - o.yAu;
    const angleDeg = RAD_TO_DEG * Math.atan2(dy, dx);
    return wrap0To360Deg(angleDeg);
  },

  computeSeries(args: {
    observer: RetrogradePlanetKey;
    target: RetrogradePlanetKey;
    windowStartDay: number;
    windowMonths: number;
    t0Day?: number;
  }): {
    observer: RetrogradePlanetKey;
    target: RetrogradePlanetKey;
    t0Day: number;
    windowStartDay: number;
    windowEndDay: number;
    dtInternalDay: number;
    timesDay: number[];
    lambdaWrappedDeg: number[];
    lambdaUnwrappedDeg: number[];
    dLambdaDtDegPerDay: number[];
    stationaryDays: number[];
    retrogradeIntervals: { startDay: number; endDay: number }[];
  } {
    const t0Day = Number.isFinite(args.t0Day) ? args.t0Day! : 0;
    const windowStartDay = args.windowStartDay;
    const windowDays = args.windowMonths * MODEL_MONTH_DAYS;
    const windowEndDay = windowStartDay + windowDays;

    const dt = DT_INTERNAL_DAY;

    const n = Math.max(0, Math.floor((windowEndDay - windowStartDay) / dt) + 1);
    const timesDay: number[] = new Array(n);
    const lambdaWrappedDeg: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      const tDay = windowStartDay + i * dt;
      timesDay[i] = tDay;
      lambdaWrappedDeg[i] = RetrogradeMotionModel.lambdaAppWrappedDegAtModelDay({
        observer: args.observer,
        target: args.target,
        tDay,
        t0Day
      });
    }

    const lambdaUnwrappedDeg = RetrogradeMotionModel.unwrapDeg180(lambdaWrappedDeg);
    const dLambdaDtDegPerDay = RetrogradeMotionModel.centralDifferenceDegPerDay({
      yDeg: lambdaUnwrappedDeg,
      dtDay: dt
    });

    function dLambdaDtAt(tDay: number): number {
      const lamMinus = RetrogradeMotionModel.lambdaAppWrappedDegAtModelDay({
        observer: args.observer,
        target: args.target,
        tDay: tDay - dt,
        t0Day
      });
      const lamPlus = RetrogradeMotionModel.lambdaAppWrappedDegAtModelDay({
        observer: args.observer,
        target: args.target,
        tDay: tDay + dt,
        t0Day
      });
      const delta = wrapDeltaDeg180(lamPlus - lamMinus);
      return delta / (2 * dt);
    }

    function refineStationaryDayInBracket(tLo: number, tHi: number): number {
      let lo = tLo;
      let hi = tHi;
      let fLo = dLambdaDtAt(lo);
      let fHi = dLambdaDtAt(hi);

      if (!Number.isFinite(fLo) || !Number.isFinite(fHi)) return 0.5 * (lo + hi);
      if (fLo === 0) return lo;
      if (fHi === 0) return hi;

      // If the bracket doesn't actually change sign (numerical edge), return midpoint deterministically.
      if (fLo * fHi > 0) return 0.5 * (lo + hi);

      for (let i = 0; i < 80; i++) {
        if (hi - lo < STATIONARY_TOL_DAY) return 0.5 * (lo + hi);
        const mid = 0.5 * (lo + hi);
        const fMid = dLambdaDtAt(mid);
        if (!Number.isFinite(fMid)) return 0.5 * (lo + hi);
        if (fMid === 0) return mid;

        if (fLo * fMid <= 0) {
          hi = mid;
          fHi = fMid;
        } else {
          lo = mid;
          fLo = fMid;
        }
      }

      return 0.5 * (lo + hi);
    }

    // Stationary point detection by derivative sign change on the internal grid.
    const stationaryDays: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const d0 = dLambdaDtDegPerDay[i];
      const d1 = dLambdaDtDegPerDay[i + 1];
      if (!Number.isFinite(d0) || !Number.isFinite(d1)) continue;
      if (d0 === 0) {
        stationaryDays.push(timesDay[i]);
        continue;
      }
      if (d0 * d1 < 0) {
        stationaryDays.push(refineStationaryDayInBracket(timesDay[i], timesDay[i + 1]));
      }
    }

    // Deduplicate stationary points that land extremely close together.
    stationaryDays.sort((a, b) => a - b);
    const stationaryUnique: number[] = [];
    for (const t of stationaryDays) {
      const last = stationaryUnique[stationaryUnique.length - 1];
      if (stationaryUnique.length === 0 || Math.abs(t - last) > 1e-6) {
        stationaryUnique.push(t);
      }
    }

    // Retrograde intervals: between event boundaries where dλ~/dt < 0.
    const eventTimes = [windowStartDay, ...stationaryUnique, windowEndDay].sort((a, b) => a - b);
    const retrogradeIntervals: { startDay: number; endDay: number }[] = [];
    for (let i = 0; i < eventTimes.length - 1; i++) {
      const startDay = eventTimes[i];
      const endDay = eventTimes[i + 1];
      if (!(endDay > startDay)) continue;
      const mid = 0.5 * (startDay + endDay);
      const slope = dLambdaDtAt(mid);
      if (Number.isFinite(slope) && slope < 0) retrogradeIntervals.push({ startDay, endDay });
    }

    return {
      observer: args.observer,
      target: args.target,
      t0Day,
      windowStartDay,
      windowEndDay,
      dtInternalDay: dt,
      timesDay,
      lambdaWrappedDeg,
      lambdaUnwrappedDeg,
      dLambdaDtDegPerDay,
      stationaryDays: stationaryUnique,
      retrogradeIntervals
    };
  }
} as const;
