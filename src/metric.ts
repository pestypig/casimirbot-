// Metric utilities for parametric shells (ellipsoid here)
export type Vec3 = [number, number, number];

export function ellipsoidPoint(
  a: number, b: number, c: number,
  theta: number, phi: number
): Vec3 {
  return [
    a * Math.cos(phi) * Math.cos(theta),
    b * Math.sin(phi),
    c * Math.cos(phi) * Math.sin(theta),
  ];
}

export function ellipsoidPartials(
  a: number, b: number, c: number,
  theta: number, phi: number
) {
  // ∂X/∂θ, ∂X/∂φ for X(θ,φ) on ellipsoid
  const dTheta: Vec3 = [
    -a * Math.cos(phi) * Math.sin(theta),
     0,
     c * Math.cos(phi) * Math.cos(theta),
  ];
  const dPhi: Vec3 = [
    -a * Math.sin(phi) * Math.cos(theta),
     b * Math.cos(phi),
    -c * Math.sin(phi) * Math.sin(theta),
  ];
  return { dTheta, dPhi };
}

function dot(u: Vec3, v: Vec3) {
  return u[0]*v[0] + u[1]*v[1] + u[2]*v[2];
}

/** First fundamental form on the ellipsoid shell.
 *  Returns E=g_θθ, F=g_θφ, G=g_φφ, det, and the proper area element dA=√det.
 */
export function firstFundamentalForm(
  a: number, b: number, c: number,
  theta: number, phi: number
) {
  const { dTheta, dPhi } = ellipsoidPartials(a,b,c,theta,phi);
  const E = dot(dTheta, dTheta);
  const F = dot(dTheta, dPhi);
  const G = dot(dPhi,   dPhi);
  const det = E*G - F*F;
  return { E, F, G, det, dA: Math.sqrt(Math.max(det, 0)) };
}