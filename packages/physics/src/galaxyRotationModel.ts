/**
 * GalaxyRotationModel
 *
 * Galaxy rotation-curve helpers in explicit galaxy units:
 * - radius: kpc
 * - velocity: km/s
 * - mass: 10^10 solar masses
 */

export interface GalaxyParams {
  bulgeMass10: number;
  bulgeScaleKpc: number;
  diskMass10: number;
  diskScaleLengthKpc: number;
  haloMass10: number;
  haloScaleRadiusKpc: number;
}

export interface EnclosedMass10 {
  total: number;
  visible: number;
  dark: number;
  bulge: number;
  disk: number;
  halo: number;
}

export interface NfwDerived {
  rVirKpc: number;
  concentration: number;
  rhoScale10PerKpc3: number;
}

export interface RotationCurvePoint {
  radiusKpc: number;
  vTotalKmS: number;
  vBulgeKmS: number;
  vDiskKmS: number;
  vHaloKmS: number;
  vKeplerianKmS: number;
  vMondKmS: number;
  mTotal10: number;
  mVisible10: number;
  mDark10: number;
  darkVisRatio: number;
  baryonFraction: number;
  deltaLambda21mm: number;
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function nfwF(x: number): number {
  if (!isFinitePositive(x)) return NaN;
  return Math.log(1 + x) - x / (1 + x);
}

// Modified Bessel function approximations from Numerical Recipes / Cephes-style fits.
function besselI0(xIn: number): number {
  const x = Math.abs(xIn);
  if (!Number.isFinite(x)) return NaN;
  if (x < 3.75) {
    const y = (x / 3.75) ** 2;
    return 1 + y * (
      3.5156229 + y * (
        3.0899424 + y * (
          1.2067492 + y * (
            0.2659732 + y * (
              0.0360768 + y * 0.0045813
            )
          )
        )
      )
    );
  }
  const y = 3.75 / x;
  return (Math.exp(x) / Math.sqrt(x)) * (
    0.39894228 + y * (
      0.01328592 + y * (
        0.00225319 + y * (
          -0.00157565 + y * (
            0.00916281 + y * (
              -0.02057706 + y * (
                0.02635537 + y * (
                  -0.01647633 + y * 0.00392377
                )
              )
            )
          )
        )
      )
    )
  );
}

function besselI1(xIn: number): number {
  if (!Number.isFinite(xIn)) return NaN;
  const x = Math.abs(xIn);
  let ans: number;
  if (x < 3.75) {
    const y = (x / 3.75) ** 2;
    ans = x * (
      0.5 + y * (
        0.87890594 + y * (
          0.51498869 + y * (
            0.15084934 + y * (
              0.02658733 + y * (
                0.00301532 + y * 0.00032411
              )
            )
          )
        )
      )
    );
  } else {
    const y = 3.75 / x;
    ans = (Math.exp(x) / Math.sqrt(x)) * (
      0.39894228 + y * (
        -0.03988024 + y * (
          -0.00362018 + y * (
            0.00163801 + y * (
              -0.01031555 + y * (
                0.02282967 + y * (
                  -0.02895312 + y * (
                    0.01787654 + y * -0.00420059
                  )
                )
              )
            )
          )
        )
      )
    );
  }
  return xIn < 0 ? -ans : ans;
}

function besselK0(x: number): number {
  if (!isFinitePositive(x)) return NaN;
  if (x <= 2) {
    const y = (x * x) / 4;
    return -Math.log(x / 2) * besselI0(x) + (
      -0.57721566 + y * (
        0.4227842 + y * (
          0.23069756 + y * (
            0.0348859 + y * (
              0.00262698 + y * (
                0.0001075 + y * 0.0000074
              )
            )
          )
        )
      )
    );
  }
  const y = 2 / x;
  return (Math.exp(-x) / Math.sqrt(x)) * (
    1.25331414 + y * (
      -0.07832358 + y * (
        0.02189568 + y * (
          -0.01062446 + y * (
            0.00587872 + y * (
              -0.0025154 + y * 0.00053208
            )
          )
        )
      )
    )
  );
}

function besselK1(x: number): number {
  if (!isFinitePositive(x)) return NaN;
  if (x <= 2) {
    const y = (x * x) / 4;
    return Math.log(x / 2) * besselI1(x) + (1 / x) * (
      1 + y * (
        0.15443144 + y * (
          -0.67278579 + y * (
            -0.18156897 + y * (
              -0.01919402 + y * (
                -0.00110404 + y * -0.00004686
              )
            )
          )
        )
      )
    );
  }
  const y = 2 / x;
  return (Math.exp(-x) / Math.sqrt(x)) * (
    1.25331414 + y * (
      0.23498619 + y * (
        -0.0365562 + y * (
          0.01504268 + y * (
            -0.00780353 + y * (
              0.00325614 + y * -0.00068245
            )
          )
        )
      )
    )
  );
}

function circularVelocityKmS(args: { enclosedMass10: number; radiusKpc: number }): number {
  const { enclosedMass10, radiusKpc } = args;
  if (!isFiniteNonNegative(radiusKpc) || !isFiniteNonNegative(enclosedMass10)) return NaN;
  if (radiusKpc === 0 || enclosedMass10 === 0) return 0;
  return Math.sqrt((GalaxyRotationModel.G_GALAXY * enclosedMass10) / radiusKpc);
}

const PRESETS = {
  "milky-way-like": {
    bulgeMass10: 0.8,
    bulgeScaleKpc: 0.3,
    diskMass10: 4.3,
    diskScaleLengthKpc: 2.6,
    haloMass10: 110,
    haloScaleRadiusKpc: 21.5,
  },
  "dwarf-galaxy": {
    bulgeMass10: 0,
    bulgeScaleKpc: 0.5,
    diskMass10: 0.3,
    diskScaleLengthKpc: 1.5,
    haloMass10: 5,
    haloScaleRadiusKpc: 8,
  },
  "massive-spiral": {
    bulgeMass10: 2,
    bulgeScaleKpc: 0.5,
    diskMass10: 10,
    diskScaleLengthKpc: 5,
    haloMass10: 150,
    haloScaleRadiusKpc: 25,
  },
  "no-dark-matter": {
    bulgeMass10: 0.9,
    bulgeScaleKpc: 0.3,
    diskMass10: 5.0,
    diskScaleLengthKpc: 2.6,
    haloMass10: 0,
    haloScaleRadiusKpc: 21.5,
  },
} as const satisfies Record<string, GalaxyParams>;

export const GalaxyRotationModel = {
  G_GALAXY: 4.3009e4, // kpc (km/s)^2 per (10^10 Msun)
  C_KM_S: 299_792.458,
  H0_KM_S_MPC: 67.4,
  OMEGA_M: 0.315,
  A0_MOND: 3703, // (km/s)^2 / kpc
  LAMBDA_21_MM: 211.06, // mm
  DELTA_VIRIAL: 200,
  COSMIC_BARYON_FRACTION: 0.157,

  PRESETS,

  get H0_KM_S_KPC(): number {
    return this.H0_KM_S_MPC / 1000;
  },

  get rhoCrit10PerKpc3(): number {
    return (3 * this.H0_KM_S_KPC * this.H0_KM_S_KPC) / (8 * Math.PI * this.G_GALAXY);
  },

  bulgeEnclosedMass10(args: {
    radiusKpc: number;
    bulgeMass10: number;
    bulgeScaleKpc?: number;
  }): number {
    const radiusKpc = args.radiusKpc;
    const bulgeMass10 = args.bulgeMass10;
    const bulgeScaleKpc = args.bulgeScaleKpc ?? 0.3;
    if (!isFiniteNonNegative(radiusKpc) || !isFiniteNonNegative(bulgeMass10) || !isFinitePositive(bulgeScaleKpc)) {
      return NaN;
    }
    if (radiusKpc === 0 || bulgeMass10 === 0) return 0;
    const ratio = radiusKpc / (radiusKpc + bulgeScaleKpc);
    return bulgeMass10 * ratio * ratio;
  },

  diskEnclosedMass10(args: {
    radiusKpc: number;
    diskMass10: number;
    diskScaleLengthKpc: number;
  }): number {
    const radiusKpc = args.radiusKpc;
    const diskMass10 = args.diskMass10;
    const diskScaleLengthKpc = args.diskScaleLengthKpc;
    if (!isFiniteNonNegative(radiusKpc) || !isFiniteNonNegative(diskMass10) || !isFinitePositive(diskScaleLengthKpc)) {
      return NaN;
    }
    if (radiusKpc === 0 || diskMass10 === 0) return 0;
    const x = radiusKpc / diskScaleLengthKpc;
    return diskMass10 * (1 - (1 + x) * Math.exp(-x));
  },

  haloEnclosedMass10(args: {
    radiusKpc: number;
    haloMass10: number;
    haloScaleRadiusKpc: number;
  }): number {
    const radiusKpc = args.radiusKpc;
    const haloMass10 = args.haloMass10;
    const haloScaleRadiusKpc = args.haloScaleRadiusKpc;
    if (!isFiniteNonNegative(radiusKpc) || !isFiniteNonNegative(haloMass10) || !isFinitePositive(haloScaleRadiusKpc)) {
      return NaN;
    }
    if (radiusKpc === 0 || haloMass10 === 0) return 0;

    const derived = this.nfwDerived({ haloMass10, haloScaleRadiusKpc });
    if (!isFinitePositive(derived.concentration)) return NaN;

    const x = radiusKpc / haloScaleRadiusKpc;
    const fX = nfwF(Math.max(x, 1e-12));
    const fC = nfwF(derived.concentration);
    if (!isFinitePositive(fX) || !isFinitePositive(fC)) return NaN;

    const enclosed = haloMass10 * (fX / fC);
    return Math.min(enclosed, haloMass10);
  },

  vBulgeKmS(args: {
    radiusKpc: number;
    bulgeMass10: number;
    bulgeScaleKpc?: number;
  }): number {
    const enclosedMass10 = this.bulgeEnclosedMass10(args);
    return circularVelocityKmS({ enclosedMass10, radiusKpc: args.radiusKpc });
  },

  vDiskKmS(args: {
    radiusKpc: number;
    diskMass10: number;
    diskScaleLengthKpc: number;
  }): number {
    const radiusKpc = args.radiusKpc;
    const diskMass10 = args.diskMass10;
    const diskScaleLengthKpc = args.diskScaleLengthKpc;
    if (!isFiniteNonNegative(radiusKpc) || !isFiniteNonNegative(diskMass10) || !isFinitePositive(diskScaleLengthKpc)) {
      return NaN;
    }
    if (radiusKpc === 0 || diskMass10 === 0) return 0;

    const y = radiusKpc / (2 * diskScaleLengthKpc);
    if (!isFinitePositive(y)) return NaN;
    if (y < 1e-6) return 0;

    const i0 = besselI0(y);
    const i1 = besselI1(y);
    const k0 = besselK0(y);
    const k1 = besselK1(y);
    const kernel = i0 * k0 - i1 * k1;
    if (!Number.isFinite(kernel)) return NaN;
    const safeKernel = Math.max(0, kernel);

    const vDiskSq = 2 * this.G_GALAXY * (diskMass10 / diskScaleLengthKpc) * y * y * safeKernel;
    if (!Number.isFinite(vDiskSq) || vDiskSq < 0) return NaN;
    return Math.sqrt(vDiskSq);
  },

  vHaloKmS(args: {
    radiusKpc: number;
    haloMass10: number;
    haloScaleRadiusKpc: number;
  }): number {
    const enclosedMass10 = this.haloEnclosedMass10(args);
    return circularVelocityKmS({ enclosedMass10, radiusKpc: args.radiusKpc });
  },

  enclosedMass10(args: { radiusKpc: number; params: GalaxyParams }): EnclosedMass10 {
    const { radiusKpc, params } = args;
    const bulge = this.bulgeEnclosedMass10({
      radiusKpc,
      bulgeMass10: params.bulgeMass10,
      bulgeScaleKpc: params.bulgeScaleKpc,
    });
    const disk = this.diskEnclosedMass10({
      radiusKpc,
      diskMass10: params.diskMass10,
      diskScaleLengthKpc: params.diskScaleLengthKpc,
    });
    const halo = this.haloEnclosedMass10({
      radiusKpc,
      haloMass10: params.haloMass10,
      haloScaleRadiusKpc: params.haloScaleRadiusKpc,
    });
    const visible = bulge + disk;
    const dark = halo;
    const total = visible + dark;
    return { total, visible, dark, bulge, disk, halo };
  },

  vKeplerianKmS(args: { radiusKpc: number; params: GalaxyParams }): number {
    const masses = this.enclosedMass10(args);
    return circularVelocityKmS({ enclosedMass10: masses.visible, radiusKpc: args.radiusKpc });
  },

  vMondDeepKmS(args: { radiusKpc: number; params: GalaxyParams }): number {
    const { radiusKpc, params } = args;
    if (!isFiniteNonNegative(radiusKpc)) return NaN;
    if (radiusKpc === 0) return 0;
    const masses = this.enclosedMass10({ radiusKpc, params });
    if (!isFiniteNonNegative(masses.visible)) return NaN;
    if (masses.visible === 0) return 0;
    return Math.pow(this.G_GALAXY * masses.visible * this.A0_MOND, 0.25);
  },

  vMondKmS(args: { radiusKpc: number; params: GalaxyParams }): number {
    const { radiusKpc, params } = args;
    if (!isFiniteNonNegative(radiusKpc)) return NaN;
    if (radiusKpc === 0) return 0;
    const masses = this.enclosedMass10({ radiusKpc, params });
    if (!isFiniteNonNegative(masses.visible)) return NaN;
    if (masses.visible === 0) return 0;

    const aN = (this.G_GALAXY * masses.visible) / (radiusKpc * radiusKpc);
    if (!isFinitePositive(aN)) return NaN;
    const a = 0.5 * aN * (1 + Math.sqrt(1 + (4 * this.A0_MOND) / aN));
    if (!isFiniteNonNegative(a)) return NaN;
    return Math.sqrt(a * radiusKpc);
  },

  vTotalKmS(args: { radiusKpc: number; params: GalaxyParams }): number {
    const { radiusKpc, params } = args;
    if (!isFiniteNonNegative(radiusKpc)) return NaN;
    if (radiusKpc === 0) return 0;
    const vBulge = this.vBulgeKmS({
      radiusKpc,
      bulgeMass10: params.bulgeMass10,
      bulgeScaleKpc: params.bulgeScaleKpc,
    });
    const vDisk = this.vDiskKmS({
      radiusKpc,
      diskMass10: params.diskMass10,
      diskScaleLengthKpc: params.diskScaleLengthKpc,
    });
    const vHalo = this.vHaloKmS({
      radiusKpc,
      haloMass10: params.haloMass10,
      haloScaleRadiusKpc: params.haloScaleRadiusKpc,
    });
    if (!Number.isFinite(vBulge) || !Number.isFinite(vDisk) || !Number.isFinite(vHalo)) return NaN;
    return Math.sqrt(vBulge * vBulge + vDisk * vDisk + vHalo * vHalo);
  },

  nfwDerived(args: { haloMass10: number; haloScaleRadiusKpc: number }): NfwDerived {
    const { haloMass10, haloScaleRadiusKpc } = args;
    if (!isFiniteNonNegative(haloMass10) || !isFinitePositive(haloScaleRadiusKpc)) {
      return { rVirKpc: NaN, concentration: NaN, rhoScale10PerKpc3: NaN };
    }
    if (haloMass10 === 0) {
      return { rVirKpc: 0, concentration: 0, rhoScale10PerKpc3: 0 };
    }
    const denominator = 4 * Math.PI * this.DELTA_VIRIAL * this.rhoCrit10PerKpc3;
    const rVirKpc = Math.cbrt((3 * haloMass10) / denominator);
    const concentration = rVirKpc / haloScaleRadiusKpc;
    const fC = nfwF(concentration);
    const rhoScale10PerKpc3 = haloMass10 / (4 * Math.PI * haloScaleRadiusKpc ** 3 * fC);
    return { rVirKpc, concentration, rhoScale10PerKpc3 };
  },

  massFromVelocity10(args: { velocityKmS: number; radiusKpc: number }): number {
    const { velocityKmS, radiusKpc } = args;
    if (!isFiniteNonNegative(radiusKpc) || !isFiniteNonNegative(velocityKmS)) return NaN;
    if (radiusKpc === 0 || velocityKmS === 0) return 0;
    return (velocityKmS * velocityKmS * radiusKpc) / this.G_GALAXY;
  },

  deltaLambda21mm(velocityKmS: number): number {
    if (!Number.isFinite(velocityKmS)) return NaN;
    return (this.LAMBDA_21_MM * velocityKmS) / this.C_KM_S;
  },

  baryonFraction(args: { radiusKpc: number; params: GalaxyParams }): number {
    const masses = this.enclosedMass10(args);
    if (!Number.isFinite(masses.total) || masses.total <= 0) return 0;
    return masses.visible / masses.total;
  },

  rotationCurve(args: {
    params: GalaxyParams;
    rMinKpc?: number;
    rMaxKpc?: number;
    nPoints?: number;
  }): RotationCurvePoint[] {
    const rMinKpc = args.rMinKpc ?? 0;
    const rMaxKpc = args.rMaxKpc ?? 50;
    const nPoints = Math.max(2, Math.floor(args.nPoints ?? 250));
    if (!isFiniteNonNegative(rMinKpc) || !isFiniteNonNegative(rMaxKpc) || rMaxKpc < rMinKpc) return [];

    const rows: RotationCurvePoint[] = [];
    for (let i = 0; i < nPoints; i += 1) {
      const t = nPoints === 1 ? 0 : i / (nPoints - 1);
      const radiusKpc = rMinKpc + t * (rMaxKpc - rMinKpc);
      const masses = this.enclosedMass10({ radiusKpc, params: args.params });
      const vBulgeKmS = this.vBulgeKmS({
        radiusKpc,
        bulgeMass10: args.params.bulgeMass10,
        bulgeScaleKpc: args.params.bulgeScaleKpc,
      });
      const vDiskKmS = this.vDiskKmS({
        radiusKpc,
        diskMass10: args.params.diskMass10,
        diskScaleLengthKpc: args.params.diskScaleLengthKpc,
      });
      const vHaloKmS = this.vHaloKmS({
        radiusKpc,
        haloMass10: args.params.haloMass10,
        haloScaleRadiusKpc: args.params.haloScaleRadiusKpc,
      });
      const vTotalKmS = Math.sqrt(vBulgeKmS ** 2 + vDiskKmS ** 2 + vHaloKmS ** 2);
      const vKeplerianKmS = circularVelocityKmS({ enclosedMass10: masses.visible, radiusKpc });
      const vMondKmS = this.vMondKmS({ radiusKpc, params: args.params });
      const darkVisRatio = masses.visible > 0 ? masses.dark / masses.visible : NaN;
      const baryonFraction = masses.total > 0 ? masses.visible / masses.total : 0;
      rows.push({
        radiusKpc,
        vTotalKmS,
        vBulgeKmS,
        vDiskKmS,
        vHaloKmS,
        vKeplerianKmS,
        vMondKmS,
        mTotal10: masses.total,
        mVisible10: masses.visible,
        mDark10: masses.dark,
        darkVisRatio,
        baryonFraction,
        deltaLambda21mm: this.deltaLambda21mm(vTotalKmS),
      });
    }
    return rows;
  },
} as const;

export type GalaxyPresetKey = keyof typeof PRESETS;
