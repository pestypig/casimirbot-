export type Vec3 = readonly [number, number, number];

export interface AlcubierreParams {
  R: number;
  sigma: number;
  v: number;
  center: Vec3;
}

const EPS = 1e-9;
const INV16PI = 1 / (16 * Math.PI);

const clampDenominator = (value: number) => {
  if (value >= 0) return Math.max(value, EPS);
  return Math.min(value, -EPS);
};

const sechSq = (x: number) => {
  const c = Math.cosh(x);
  if (!Number.isFinite(c) || c === 0) return 0;
  return 1 / (c * c);
};

export const radialDistance = (x: number, y: number, z: number, center: Vec3) => {
  const dx = x - center[0];
  const dy = y - center[1];
  const dz = z - center[2];
  return Math.hypot(dx, dy, dz);
};

export const shapeFunction = (rs: number, R: number, sigma: number) => {
  if (!Number.isFinite(rs)) return 0;
  const denom = clampDenominator(2 * Math.tanh(sigma * R));
  const tanhPlus = Math.tanh(sigma * (rs + R));
  const tanhMinus = Math.tanh(sigma * (rs - R));
  return (tanhPlus - tanhMinus) / denom;
};

export const shapeDerivative = (rs: number, R: number, sigma: number) => {
  if (!Number.isFinite(rs)) return 0;
  const denom = clampDenominator(2 * Math.tanh(sigma * R));
  const sechPlus = sechSq(sigma * (rs + R));
  const sechMinus = sechSq(sigma * (rs - R));
  return sigma * (sechPlus - sechMinus) / denom;
};

export const shapeGradient = (x: number, y: number, z: number, params: AlcubierreParams) => {
  const rs = radialDistance(x, y, z, params.center);
  if (rs < EPS) {
    return { rs, x: 0, y: 0, z: 0 };
  }
  const dfdr = shapeDerivative(rs, params.R, params.sigma);
  const scale = dfdr / rs;
  return {
    rs,
    x: scale * (x - params.center[0]),
    y: scale * (y - params.center[1]),
    z: scale * (z - params.center[2]),
  };
};

export const betaField = (x: number, y: number, z: number, params: AlcubierreParams) => {
  const rs = radialDistance(x, y, z, params.center);
  const f = shapeFunction(rs, params.R, params.sigma);
  const betaX = -params.v * f;
  return { rs, f, beta: { x: betaX, y: 0, z: 0 } };
};

export const metric = (x: number, y: number, z: number, params: AlcubierreParams) => {
  const { beta } = betaField(x, y, z, params);
  const betaSq = beta.x * beta.x + beta.y * beta.y + beta.z * beta.z;
  return {
    g_tt: -(1 - betaSq),
    g_tx: beta.x,
    g_ty: beta.y,
    g_tz: beta.z,
    g_xx: 1,
    g_yy: 1,
    g_zz: 1,
  };
};

export const theta = (x: number, y: number, z: number, params: AlcubierreParams) => {
  const grad = shapeGradient(x, y, z, params);
  return params.v * grad.x;
};

export const extrinsicCurvature = (
  x: number,
  y: number,
  z: number,
  params: AlcubierreParams
) => {
  const grad = shapeGradient(x, y, z, params);
  const vs = params.v;
  return {
    Kxx: -vs * grad.x,
    Kxy: -0.5 * vs * grad.y,
    Kxz: -0.5 * vs * grad.z,
    Kyy: 0,
    Kzz: 0,
    Kyz: 0,
  };
};

export const energyDensityEulerian = (
  x: number,
  y: number,
  z: number,
  params: AlcubierreParams
) => {
  const { Kxx, Kxy, Kxz, Kyy, Kzz, Kyz } = extrinsicCurvature(x, y, z, params);
  const trace = Kxx + Kyy + Kzz;
  const squared =
    Kxx * Kxx +
    Kyy * Kyy +
    Kzz * Kzz +
    2 * (Kxy * Kxy + Kxz * Kxz + Kyz * Kyz);
  return (trace * trace - squared) * INV16PI;
};
