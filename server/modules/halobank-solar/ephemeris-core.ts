import * as Astronomy from "astronomy-engine";
import type { SolarAberration, SolarFrame, SolarObserver } from "./types";

const AU_M = 149_597_870_700;
const C_M_PER_S = 299_792_458;
const DAY_S = 86_400;

type Vec3 = [number, number, number];

type BodyDef = {
  id: number;
  name: string;
  astronomyName: string;
  mu?: number;
};

const BODY_BY_ID = new Map<number, BodyDef>([
  [10, { id: 10, name: "Sun", astronomyName: "Sun" }],
  [199, { id: 199, name: "Mercury", astronomyName: "Mercury", mu: 2.2032e13 }],
  [299, { id: 299, name: "Venus", astronomyName: "Venus", mu: 3.24859e14 }],
  [301, { id: 301, name: "Moon", astronomyName: "Moon", mu: 4.9048695e12 }],
  [399, { id: 399, name: "Earth", astronomyName: "Earth", mu: 3.986004354e14 }],
  [499, { id: 499, name: "Mars", astronomyName: "Mars", mu: 4.282837e13 }],
  [599, { id: 599, name: "Jupiter", astronomyName: "Jupiter", mu: 1.26686534e17 }],
  [699, { id: 699, name: "Saturn", astronomyName: "Saturn", mu: 3.7931187e16 }],
  [799, { id: 799, name: "Uranus", astronomyName: "Uranus", mu: 5.793939e15 }],
  [899, { id: 899, name: "Neptune", astronomyName: "Neptune", mu: 6.836529e15 }],
]);

export const DEFAULT_VECTOR_TARGETS = [10, 399, 301] as const;
export const PLANET_CONTEXT_IDS = [199, 299, 499, 599, 699, 799, 899] as const;

export type BaryState = {
  pos: Vec3;
  vel: Vec3;
};

export type SolarVectorRequest = {
  tsIso: string;
  targetIds: number[];
  centerId: number;
  frame: SolarFrame;
  aberration: SolarAberration;
  observer?: SolarObserver;
};

export type SolarVectorCompatibility = {
  earth: { r_AU: Vec3; v_AUperD: Vec3 };
  moon: { r_AU: Vec3; v_AUperD: Vec3 };
  sunObs: { ra_deg: number; dec_deg: number; range_AU: number; lt_s: number };
  moonObs: { ra_deg: number; dec_deg: number; range_AU: number; lt_s: number };
  planets: Array<{ id: number; name: string; mu?: number; r_AU: Vec3; v_AUperD: Vec3 }>;
};

export type SolarVectorBundle = {
  states: Array<{
    target: number;
    center: number;
    frame: SolarFrame;
    pos: Vec3;
    vel: Vec3;
    light_time_s: number;
  }>;
  compatibility: SolarVectorCompatibility;
  warnings: string[];
};

const toVec3 = (x: number, y: number, z: number): Vec3 => [x, y, z];

const vecSub = (a: Vec3, b: Vec3): Vec3 => toVec3(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const vecAdd = (a: Vec3, b: Vec3): Vec3 => toVec3(a[0] + b[0], a[1] + b[1], a[2] + b[2]);
const vecScale = (a: Vec3, s: number): Vec3 => toVec3(a[0] * s, a[1] * s, a[2] * s);
const vecNorm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

const wrap360 = (value: number): number => {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

function getBody(id: number): BodyDef {
  const body = BODY_BY_ID.get(id);
  if (!body) {
    throw new Error(`Unsupported NAIF body id: ${id}`);
  }
  return body;
}

export function resolveSupportedBody(id: number): BodyDef | null {
  return BODY_BY_ID.get(id) ?? null;
}

export function getBaryState(id: number, date: Date): BaryState {
  const body = getBody(id);
  const st = Astronomy.BaryState(body.astronomyName as any, date);
  return {
    pos: toVec3(st.x, st.y, st.z),
    vel: toVec3(st.vx, st.vy, st.vz),
  };
}

function vectorToRaDec(vectorAu: Vec3): { ra_deg: number; dec_deg: number; range_AU: number } {
  const range = vecNorm(vectorAu);
  if (!Number.isFinite(range) || range <= 0) {
    return { ra_deg: 0, dec_deg: 0, range_AU: 0 };
  }
  const ra = wrap360((Math.atan2(vectorAu[1], vectorAu[0]) * 180) / Math.PI);
  const dec = (Math.asin(vectorAu[2] / range) * 180) / Math.PI;
  return { ra_deg: ra, dec_deg: dec, range_AU: range };
}

function buildEarthObserverState(date: Date, observer?: SolarObserver): { state: BaryState; warning?: string } {
  const earth = getBaryState(399, date);
  if (!observer || observer.mode === "geocenter") {
    return { state: earth };
  }

  if (observer.body !== 399) {
    return {
      state: earth,
      warning: "HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING",
    };
  }

  const elevationKm = observer.height_m / 1000;
  const obs = new Astronomy.Observer(observer.lat_deg, observer.lon_deg, elevationKm);
  const obsState = Astronomy.ObserverState(date, obs, true);
  const offset: BaryState = {
    pos: toVec3(obsState.x, obsState.y, obsState.z),
    vel: toVec3(obsState.vx, obsState.vy, obsState.vz),
  };
  return {
    state: {
      pos: vecAdd(earth.pos, offset.pos),
      vel: vecAdd(earth.vel, offset.vel),
    },
  };
}

function getReferenceState(args: {
  date: Date;
  centerId: number;
  observer?: SolarObserver;
}): { centerId: number; state: BaryState; warning?: string } {
  const { date, centerId, observer } = args;
  if (!observer) {
    return { centerId, state: centerId === 0 ? { pos: [0, 0, 0], vel: [0, 0, 0] } : getBaryState(centerId, date) };
  }

  if (observer.mode === "geocenter" || observer.mode === "body-fixed") {
    const { state, warning } = buildEarthObserverState(date, observer);
    return { centerId: 399, state, warning };
  }

  return { centerId, state: centerId === 0 ? { pos: [0, 0, 0], vel: [0, 0, 0] } : getBaryState(centerId, date) };
}

function resolveRelativeState(args: {
  targetId: number;
  date: Date;
  reference: BaryState;
  aberration: SolarAberration;
}): { pos: Vec3; vel: Vec3; lightTimeS: number } {
  const { targetId, date, reference, aberration } = args;
  const targetNow = getBaryState(targetId, date);
  const relNow = vecSub(targetNow.pos, reference.pos);
  const lightTimeNow = (vecNorm(relNow) * AU_M) / C_M_PER_S;

  if (aberration === "none") {
    return {
      pos: relNow,
      vel: vecSub(targetNow.vel, reference.vel),
      lightTimeS: lightTimeNow,
    };
  }

  const targetRet = getBaryState(targetId, new Date(date.getTime() - lightTimeNow * 1000));
  let relRet = vecSub(targetRet.pos, reference.pos);
  if (aberration === "lt+s") {
    const observerShift = vecScale(reference.vel, lightTimeNow / DAY_S);
    relRet = vecSub(relRet, observerShift);
  }
  return {
    pos: relRet,
    vel: vecSub(targetRet.vel, reference.vel),
    lightTimeS: lightTimeNow,
  };
}

function heliocentricState(id: number, date: Date): { r_AU: Vec3; v_AUperD: Vec3 } {
  const body = getBaryState(id, date);
  const sun = getBaryState(10, date);
  return {
    r_AU: vecSub(body.pos, sun.pos),
    v_AUperD: vecSub(body.vel, sun.vel),
  };
}

export function buildSolarVectorBundle(request: SolarVectorRequest): SolarVectorBundle {
  const date = new Date(request.tsIso);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Invalid timestamp");
  }

  const { centerId, state: reference, warning } = getReferenceState({
    date,
    centerId: request.centerId,
    observer: request.observer,
  });
  const warnings: string[] = warning ? [warning] : [];

  const states = request.targetIds.map((targetId) => {
    const rel = resolveRelativeState({
      targetId,
      date,
      reference,
      aberration: request.aberration,
    });
    return {
      target: targetId,
      center: centerId,
      frame: request.frame,
      pos: rel.pos,
      vel: rel.vel,
      light_time_s: rel.lightTimeS,
    };
  });

  const earth = heliocentricState(399, date);
  const moon = heliocentricState(301, date);

  const sunObsRel = resolveRelativeState({
    targetId: 10,
    date,
    reference,
    aberration: request.aberration,
  });
  const moonObsRel = resolveRelativeState({
    targetId: 301,
    date,
    reference,
    aberration: request.aberration,
  });

  const sunObsEq = vectorToRaDec(sunObsRel.pos);
  const moonObsEq = vectorToRaDec(moonObsRel.pos);

  const planets = request.targetIds
    .filter((id) => PLANET_CONTEXT_IDS.includes(id as (typeof PLANET_CONTEXT_IDS)[number]))
    .map((id) => {
      const body = getBody(id);
      const helio = heliocentricState(id, date);
      return {
        id: body.id,
        name: body.name,
        mu: body.mu,
        r_AU: helio.r_AU,
        v_AUperD: helio.v_AUperD,
      };
    });

  return {
    states,
    compatibility: {
      earth,
      moon,
      sunObs: {
        ...sunObsEq,
        lt_s: sunObsRel.lightTimeS,
      },
      moonObs: {
        ...moonObsEq,
        lt_s: moonObsRel.lightTimeS,
      },
      planets,
    },
    warnings,
  };
}

