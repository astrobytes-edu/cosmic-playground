import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";

export type AngularDiameterArgs = { diameterKm: number; distanceKm: number };

function angularDiameterDeg({ diameterKm, distanceKm }: AngularDiameterArgs): number {
  if (!Number.isFinite(diameterKm) || diameterKm <= 0) return 0;
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 180;
  const radians = 2 * Math.atan(diameterKm / (2 * distanceKm));
  return Math.min(180, AstroUnits.radToDeg(radians));
}

function distanceForAngularDiameterDeg(args: {
  diameterKm: number;
  angularDiameterDeg: number;
}): number {
  const { diameterKm, angularDiameterDeg } = args;
  if (!Number.isFinite(diameterKm) || diameterKm <= 0) return Number.NaN;
  if (!Number.isFinite(angularDiameterDeg) || angularDiameterDeg <= 0) return Infinity;
  if (angularDiameterDeg >= 180) return 0;
  const theta = AstroUnits.degToRad(angularDiameterDeg);
  return diameterKm / (2 * Math.tan(theta / 2));
}

function moonDistanceKmFromRecession(args: {
  distanceTodayKm: number;
  recessionCmPerYr: number;
  timeMyr: number;
}): number {
  const { distanceTodayKm, recessionCmPerYr, timeMyr } = args;
  if (!Number.isFinite(distanceTodayKm)) return Number.NaN;
  if (!Number.isFinite(recessionCmPerYr)) return Number.NaN;
  if (!Number.isFinite(timeMyr)) return Number.NaN;

  // 1 cm/yr = 1e-5 km/yr; 1 Myr = 1e6 yr → 10 km/Myr.
  const kmPerMyr = recessionCmPerYr * 10;
  return distanceTodayKm + kmPerMyr * timeMyr;
}

const presets = {
  // Astronomical objects (diameters/distances in km)
  sun: {
    name: "Sun",
    diameter: 1.392e6,
    distance: AstroConstants.LENGTH.KM_PER_AU,
    category: "astronomical",
    color: "sun",
    description: "Our star"
  },
  moon: {
    name: "Moon (Today)",
    diameter: 3474,
    distance: 384400,
    category: "astronomical",
    color: "moon",
    description: "Earth's satellite",
    timeEvolution: true
  },
  jupiter: {
    name: "Jupiter",
    diameter: 139820,
    distance: 6.287e8,
    category: "astronomical",
    color: "planet",
    description: "At opposition"
  },
  venus: {
    name: "Venus",
    diameter: 12104,
    distance: 4.14e7,
    category: "astronomical",
    color: "planet",
    description: "At closest approach"
  },
  mars: {
    name: "Mars",
    diameter: 6779,
    distance: 5.46e7,
    category: "astronomical",
    color: "mars",
    description: "At opposition"
  },
  andromeda: {
    name: "Andromeda",
    diameter: 1.26e18,
    distance: 2.4e19,
    category: "astronomical",
    color: "galaxy",
    description: "Nearest large galaxy (bright disk)"
  },

  // Everyday objects (diameters/distances in km)
  basketball: {
    name: "Basketball @ 10m",
    diameter: 0.000239,
    distance: 0.01,
    category: "everyday",
    color: "object",
    description: "Standard basketball"
  },
  soccerball: {
    name: "Soccer ball @ 20m",
    diameter: 0.00022,
    distance: 0.02,
    category: "everyday",
    color: "object",
    description: "Regulation soccer ball"
  },
  quarter: {
    name: "Quarter @ arm's length",
    diameter: 0.0000243,
    distance: 0.0007,
    category: "everyday",
    color: "object",
    description: "US quarter coin"
  },
  thumb: {
    name: "Your thumb",
    diameter: 0.00002,
    distance: 0.0007,
    category: "everyday",
    color: "object",
    description: "Thumb at arm's length ≈ 2°"
  },
  airplane: {
    name: "Jet @ 10km",
    diameter: 0.06,
    distance: 10,
    category: "everyday",
    color: "object",
    description: "Commercial jet overhead"
  },
  iss: {
    name: "ISS overhead",
    diameter: 0.109,
    distance: 420,
    category: "everyday",
    color: "object",
    description: "International Space Station"
  }
} as const;

export const AngularSizeModel = {
  angularDiameterDeg,
  distanceForAngularDiameterDeg,
  moonDistanceKmFromRecession,
  presets
} as const;

