import React, { useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDriveSyncStore } from "@/store/useDriveSyncStore";
import { useFlightDirectorStore } from "@/store/useFlightDirectorStore";
import { useUpdatePipeline } from "@/hooks/use-energy-pipeline";
import { shallow } from "zustand/shallow";

const clampRange = (value: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Number.isFinite(value) ? value : lo));
const wrap01 = (value: number) => {
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
};
const TAU = Math.PI * 2;
const shortestPhaseDelta01 = (targetFrac: number, currentFrac: number) => {
  const delta = (targetFrac - currentFrac) * TAU;
  return Math.atan2(Math.sin(delta), Math.cos(delta)) / TAU;
};
const DEFAULT_NEGATIVE_FRACTION = 0.4;
const DEFAULT_THRUST_FRAC = 1 - DEFAULT_NEGATIVE_FRACTION;

const MANUAL_FLIGHT_KEY_NAMES = new Set([
  "w",
  "a",
  "s",
  "d",
  "space",
  "shift",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);
const MANUAL_FLIGHT_KEY_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

type Heading = { label: string; frac: number };

const HEADINGS: Heading[] = [
  { label: "N", frac: 0.0 },
  { label: "NE", frac: 0.125 },
  { label: "E", frac: 0.25 },
  { label: "SE", frac: 0.375 },
  { label: "S", frac: 0.5 },
  { label: "SW", frac: 0.625 },
  { label: "W", frac: 0.75 },
  { label: "NW", frac: 0.875 },
];

const degFromFrac = (frac: number) => wrap01(frac) * 360;

const cardinalFromFrac = (frac: number) => {
  const degrees = degFromFrac(frac);
  const index = Math.round((degrees % 360) / 45) % HEADINGS.length;
  return HEADINGS[index].label;
};

type MiniRoseProps = {
  phase01: number;
  splitFrac: number;
};

type DirectionPadProps = {
  className?: string;
  onVizIntent?: (intent: { rise: number; planar: number }) => void;
};

function MiniRose({ phase01, splitFrac }: MiniRoseProps) {
  const primaryTheta = wrap01(phase01) * TAU;
  const oppositeTheta = wrap01(phase01 + 0.5) * TAU;
  const radius = 46;
  const center = 60;

  const toPoint = (theta: number) => {
    const rotated = theta - Math.PI / 2;
    return {
      x: center + radius * Math.cos(rotated),
      y: center + radius * Math.sin(rotated),
    };
  };

  const primary = toPoint(primaryTheta);
  const opposite = toPoint(oppositeTheta);
  const weightPrimary = clampRange(splitFrac, 0, 1);
  const weightOpposite = 1 - weightPrimary;

  return (
    <svg viewBox="0 0 120 120" width={120} height={120} aria-label="Heading rose (yaw)">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeOpacity="0.25" />
      <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="currentColor" strokeOpacity="0.2" />
      <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="currentColor" strokeOpacity="0.2" />
      <circle cx={primary.x} cy={primary.y} r={6 + 6 * weightPrimary} fill="currentColor" />
      <circle cx={opposite.x} cy={opposite.y} r={6 + 6 * weightOpposite} fill="currentColor" opacity={0.55} />
      <text x={center} y={14} textAnchor="middle" fontSize="10" opacity="0.65">
        N
      </text>
      <text x={center + radius + 8} y={center + 3} fontSize="10" opacity="0.65">
        E
      </text>
      <text x={center} y={center + radius + 14} textAnchor="middle" fontSize="10" opacity="0.65">
        S
      </text>
      <text x={center - radius - 8} y={center + 3} textAnchor="end" fontSize="10" opacity="0.65">
        W
      </text>
    </svg>
  );
}

export default function DirectionPad({ className, onVizIntent }: DirectionPadProps) {
  const {
    phase01: phase01State,
    splitFrac: splitFracState,
    sigmaSectors: sigmaSectorsState,
    sectorFloor: floorState,
    phaseMode: phaseModeState,
    intent,
    nudge01,
    setPhase,
    setPhaseMode,
    setSplit,
    setSigma: setSigmaStore,
    setFloor: setFloorStore,
    setIntent,
    setNudge01,
  } = useDriveSyncStore(
    (state) => ({
      phase01: state.phase01,
      splitFrac: state.splitFrac,
      sigmaSectors: state.sigmaSectors,
      sectorFloor: state.sectorFloor,
      phaseMode: state.phaseMode,
      intent: state.intent,
      nudge01: state.nudge01,
      setPhase: state.setPhase,
      setPhaseMode: state.setPhaseMode,
      setSplit: state.setSplit,
      setSigma: state.setSigma,
      setFloor: state.setFloor,
      setIntent: state.setIntent,
      setNudge01: state.setNudge01,
    }),
    shallow
  );
  const mutatePipeline = useUpdatePipeline();

  const flightEnabled = useFlightDirectorStore((state) => state.enabled);
  const flightMode = useFlightDirectorStore((state) => state.mode);
  const flightCoupling = useFlightDirectorStore((state) => state.coupling);
  const flightYawRate = useFlightDirectorStore((state) => state.yawRate_dps);
  const flightBias = useFlightDirectorStore((state) => state.thrustBias01);
  const flightMaxYawRate = useFlightDirectorStore((state) => state.maxYawRate_dps);
  const flightMaxYawAccel = useFlightDirectorStore((state) => state.maxYawAccel_dps2);

  const phase01 = useMemo(() => {
    const value =
      typeof phase01State === "number" && Number.isFinite(phase01State) ? phase01State : 0;
    return wrap01(value);
  }, [phase01State]);

  const splitFrac = useMemo(() => {
    const value =
      typeof splitFracState === "number" && Number.isFinite(splitFracState)
        ? splitFracState
        : DEFAULT_THRUST_FRAC;
    return clampRange(value, 0, 1);
  }, [splitFracState]);

  const sigmaSectors = useMemo(() => {
    const value =
      typeof sigmaSectorsState === "number" && Number.isFinite(sigmaSectorsState)
        ? sigmaSectorsState
        : 0.25;
    return clampRange(value, 0.25, 8);
  }, [sigmaSectorsState]);

  const floor = useMemo(() => {
    const value =
      typeof floorState === "number" && Number.isFinite(floorState)
        ? floorState
        : 0.2;
    return clampRange(value, 0, 0.99);
  }, [floorState]);

  const phaseRef = useRef(phase01);
  useEffect(() => {
    phaseRef.current = phase01;
  }, [phase01]);

  const phaseModeRef = useRef(phaseModeState);
  useEffect(() => {
    phaseModeRef.current = phaseModeState;
  }, [phaseModeState]);

  const intentRef = useRef(intent);
  useEffect(() => {
    intentRef.current = intent;
  }, [intent]);

  useEffect(() => {
    const state = useFlightDirectorStore.getState();
    if (Math.abs(state.thrustBias01 - splitFrac) > 1e-3) {
      state.setThrustBias01(splitFrac);
    }
  }, [splitFrac]);

  const onBiasChange = (value: number) => {
    const bias = clampRange(value, 0, 1);
    setSplit(true, bias);
    try {
      const negFrac = clampRange(1 - bias, 0, 1);
      mutatePipeline.mutate({ negativeFraction: negFrac });
    } catch {
      // pipeline endpoint may be unavailable in mock environments
    }
    const state = useFlightDirectorStore.getState();
    state.setThrustBias01(bias);
  };

  const holdStation = () => {
    onBiasChange(0.5);
    const state = useFlightDirectorStore.getState();
    state.setMode("MAN");
    state.zeroRate();
    state.setYawRateCmd(0);
  };

  const setHeading = (frac: number) => {
    const headingFrac = wrap01(frac);
    const state = useFlightDirectorStore.getState();
    state.setMode("HDG");
    state.setTargetYaw01(headingFrac);
    state.zeroRate();
    state.setYawRateCmd(0);
    if (phaseModeRef.current !== "manual") {
      setPhaseMode("manual");
      phaseModeRef.current = "manual";
    }
  };

  const onModeChange = (next: string) => {
    if (!next) return;
    const state = useFlightDirectorStore.getState();
    const desired = next === "HDG" ? "HDG" : "MAN";
    state.setMode(desired);
    if (desired === "HDG") {
      state.setTargetYaw01(phaseRef.current ?? 0);
    }
    if (desired === "MAN") {
      state.zeroRate();
      state.setYawRateCmd(0);
    }
  };

  const onCouplingChange = (next: string) => {
    if (!next) return;
    const state = useFlightDirectorStore.getState();
    state.setCoupling(next === "coupled" ? "coupled" : "decoupled");
  };

  const onYawRateLimitChange = (values: number[]) => {
    const rate = clampRange(values[0] ?? flightMaxYawRate, 10, 180);
    const state = useFlightDirectorStore.getState();
    state.setLimits(rate, state.maxYawAccel_dps2);
  };

  const onYawAccelLimitChange = (values: number[]) => {
    const accel = clampRange(values[0] ?? flightMaxYawAccel, 30, 720);
    const state = useFlightDirectorStore.getState();
    state.setLimits(state.maxYawRate_dps, accel);
  };

  useEffect(() => {
    const pressed = new Set<string>();

    const normalizeKey = (key: string) => {
      if (key === " ") return "space";
      if (key === "Spacebar") return "space";
      return key.length === 1 ? key.toLowerCase() : key.toLowerCase();
    };

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
    };

    const updateIntentFromKeys = () => {
      const x =
        (pressed.has("d") || pressed.has("arrowright") ? 1 : 0) -
        (pressed.has("a") || pressed.has("arrowleft") ? 1 : 0);
      const y =
        (pressed.has("w") || pressed.has("arrowup") ? 1 : 0) -
        (pressed.has("s") || pressed.has("arrowdown") ? 1 : 0);
      const z =
        (pressed.has("space") ? 1 : 0) -
        (pressed.has("shift") ? 1 : 0);
      setIntent({ x, y, z });

      const state = useFlightDirectorStore.getState();
      state.setRise(clampRange(z, -1, 1));
      const yawAxis = clampRange(
        (pressed.has("d") || pressed.has("arrowright") ? 1 : 0) -
          (pressed.has("a") || pressed.has("arrowleft") ? 1 : 0),
        -1,
        1
      );
      if (Math.abs(yawAxis) > 0) {
        if (state.mode !== "MAN") {
          state.setMode("MAN");
        }
        state.setYawRateCmd(yawAxis * state.maxYawRate_dps);
      } else {
        state.setYawRateCmd(0);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        isEditableTarget(event.target) ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      const key = normalizeKey(event.key);

      if (key === "h") {
        event.preventDefault();
        const state = useFlightDirectorStore.getState();
        state.setMode("HDG");
        state.setTargetYaw01(phaseRef.current ?? 0);
        state.zeroRate();
        state.setYawRateCmd(0);
        return;
      }
      if (key === "m") {
        event.preventDefault();
        const state = useFlightDirectorStore.getState();
        state.setMode("MAN");
        state.zeroRate();
        state.setYawRateCmd(0);
        return;
      }
      if (key === "c") {
        event.preventDefault();
        const state = useFlightDirectorStore.getState();
        state.setCoupling(state.coupling === "coupled" ? "decoupled" : "coupled");
        return;
      }

      if (!MANUAL_FLIGHT_KEY_NAMES.has(key) && !MANUAL_FLIGHT_KEY_CODES.has(event.code)) {
        return;
      }
      event.preventDefault();
      pressed.add(key);
      if (event.key === "Shift") {
        pressed.add(event.code);
      }
      updateIntentFromKeys();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        isEditableTarget(event.target) ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      const key = normalizeKey(event.key);
      if (!MANUAL_FLIGHT_KEY_NAMES.has(key) && !MANUAL_FLIGHT_KEY_CODES.has(event.code)) {
        return;
      }
      event.preventDefault();
      pressed.delete(key);
      if (event.key === "Shift") {
        pressed.delete(event.code);
      }
      updateIntentFromKeys();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      pressed.clear();
      setIntent({ x: 0, y: 0, z: 0 });
      const state = useFlightDirectorStore.getState();
      state.setYawRateCmd(0);
      state.setRise(0);
    };
  }, [setIntent]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.max(0, (now - last) / 1000);
      last = now;

      const state = useFlightDirectorStore.getState();
      if (state.enabled) {
        if (phaseModeRef.current !== "manual") {
          setPhaseMode("manual");
          phaseModeRef.current = "manual";
        }
        const current = phaseRef.current ?? 0;
        const { nextYaw01 } = state.tick(dt, current);
        if (Number.isFinite(nextYaw01) && Math.abs(nextYaw01 - current) > 1e-6) {
          phaseRef.current = nextYaw01;
          setPhase(nextYaw01);
        }
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame((time) => {
      last = time;
      tick(time);
    });
    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [setPhase, setPhaseMode]);

  const splitBiasPercent = Math.round(Math.abs(splitFrac - 0.5) * 200);
  const headingDeg = Math.round(degFromFrac(phase01));
  const headingCard = cardinalFromFrac(phase01);

  useEffect(() => {
    if (!onVizIntent) return;
    const current = intentRef.current;
    const rise = clampRange(current.z, -1, 1);
    const planar = clampRange(Math.hypot(current.x, current.y), 0, 1);
    onVizIntent({ rise, planar });
  }, [onVizIntent]);

  useEffect(() => {
    if (!onVizIntent) return;
    const rise = clampRange(intent.z, -1, 1);
    const planar = clampRange(Math.hypot(intent.x, intent.y), 0, 1);
    onVizIntent({ rise, planar });
  }, [intent.x, intent.y, intent.z, onVizIntent]);

  useEffect(() => {
    if (!onVizIntent) return;
    return () => {
      onVizIntent({ rise: 0, planar: 0 });
    };
  }, [onVizIntent]);

  return (
    <Card className={cn("p-3 space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Yaw (heading)</Badge>
          <Badge>
            {headingCard} | {headingDeg.toString().padStart(3, "0")} deg
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          Heading rotates the equatorial lobe pair; pitch and roll are not driven.
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2 xl:items-start">
        <div className="space-y-3">
          <div className="rounded-md border border-dashed p-3 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Flight Director
                </div>
                <div className="text-xs text-muted-foreground">
                  {flightMode} | {flightCoupling} | {Math.round(flightYawRate)} deg/s
                </div>
              </div>
              <Button
                variant={flightEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const state = useFlightDirectorStore.getState();
                  state.setEnabled(!state.enabled);
                  if (!state.enabled) {
                    state.setYawRateCmd(0);
                    state.zeroRate();
                  }
                }}
              >
                {flightEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  Mode
                </span>
                <ToggleGroup type="single" value={flightMode} onValueChange={onModeChange}>
                  <ToggleGroupItem value="MAN">MAN (rate)</ToggleGroupItem>
                  <ToggleGroupItem value="HDG">HDG (hold)</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-1">
                <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  Coupling
                </span>
                <ToggleGroup type="single" value={flightCoupling} onValueChange={onCouplingChange}>
                  <ToggleGroupItem value="decoupled">Decoupled</ToggleGroupItem>
                  <ToggleGroupItem value="coupled">Coupled</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Max yaw rate</span>
                  <span>{Math.round(flightMaxYawRate)} deg/s</span>
                </div>
                <Slider
                  min={10}
                  max={180}
                  step={5}
                  value={[flightMaxYawRate]}
                  onValueChange={onYawRateLimitChange}
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Max yaw accel</span>
                  <span>{Math.round(flightMaxYawAccel)} deg/s^2</span>
                </div>
                <Slider
                  min={30}
                  max={720}
                  step={10}
                  value={[flightMaxYawAccel]}
                  onValueChange={onYawAccelLimitChange}
                />
              </div>
            </div>
            <div className="text-[0.7rem] text-muted-foreground leading-5">
              A/D (or Left/Right) command rate, W/S bias split, Space lifts, Shift dips. Tap H to capture heading,
              M to return to manual, C to toggle scheduler coupling.
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Flight intent
                </div>
                <div className="text-xs text-muted-foreground">
                  WASD / arrows steer laterally, Space lifts, Shift dips.
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={holdStation}>
                Hold station
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                dX <span className="font-mono text-foreground">{intent.x.toFixed(2)}</span>
              </div>
              <div>
                dY <span className="font-mono text-foreground">{intent.y.toFixed(2)}</span>
              </div>
              <div>
                dZ <span className="font-mono text-foreground">{intent.z.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Visual nudge</span>
                <Badge variant="outline">{Math.round(nudge01 * 100)}%</Badge>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[nudge01]}
                onValueChange={(values) => {
                  const value = Array.isArray(values) ? values[0] ?? nudge01 : nudge01;
                  setNudge01(value);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>sigma (sectors)</span>
                <Badge variant="outline">{sigmaSectors.toFixed(2)}</Badge>
              </div>
              <Slider
                min={0.25}
                max={8}
                step={0.25}
                value={[sigmaSectors]}
                onValueChange={(values) => {
                  const value = Array.isArray(values) ? values[0] ?? sigmaSectors : sigmaSectors;
                  setSigmaStore(clampRange(value, 0.25, 8));
                }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Floor</span>
                <Badge variant="outline">{floor.toFixed(2)}</Badge>
              </div>
              <Slider
                min={0}
                max={0.99}
                step={0.01}
                value={[floor]}
                onValueChange={(values) => {
                  const value = Array.isArray(values) ? values[0] ?? floor : floor;
                  setFloorStore(clampRange(value, 0, 0.99));
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6 md:col-span-4 flex justify-center">
              <MiniRose phase01={phase01} splitFrac={splitFrac} />
            </div>
            <div className="col-span-6 md:col-span-8 grid grid-cols-3 gap-2">
              {HEADINGS.map((heading) => {
                const isActive = Math.abs(shortestPhaseDelta01(heading.frac, phase01)) < 1e-3;
                return (
                  <Button
                    key={heading.label}
                    variant={isActive ? "default" : "secondary"}
                    onClick={() => setHeading(heading.frac)}
                  >
                    {heading.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Primary / secondary split (|bias| {splitBiasPercent}%)
              </span>
              <Badge variant="outline">
                {Math.round(splitFrac * 100)}% / {Math.round((1 - splitFrac) * 100)}%
              </Badge>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[flightBias]}
              onValueChange={(values) => {
                const value = Array.isArray(values) ? values[0] ?? flightBias : flightBias;
                onBiasChange(value);
              }}
            />
            <div className="text-[0.65rem] text-muted-foreground">
              Scheduler negativeFraction receives {(100 - Math.round(splitFrac * 100))}% to mirror the opposite lobe.
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground leading-5">
            <strong>Why it can look clockwise only:</strong> we start at 0 deg (north). Buttons on the
            right advance phase, which renders clockwise; buttons on the left wrap across 360 deg. The
            rose shows both lobes, so the wrap is visible and expected.
          </div>
        </div>
      </div>
    </Card>
  );
}
