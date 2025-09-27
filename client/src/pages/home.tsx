// client/src/pages/home.tsx (or wherever this component lives)
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Atom, Settings, Book, History, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhaseDiagram from "@/components/phase-diagram";
import { LiveEnergyPipeline } from "@/components/live-energy-pipeline";
import { useUpdatePipeline, MODE_CONFIGS, ModeKey } from "@/hooks/use-energy-pipeline";
import BridgeDerivationCards from "@/components/BridgeDerivationCards";

export default function Home() {
  // Hook for updating backend pipeline
  const updatePipeline = useUpdatePipeline();

  // Shared phase diagram state - Needle Hull Mk 1 defaults
  const [tileArea, setTileArea] = useState(25); // cm² (Needle Hull: 25 cm²)
  const [shipRadius, setShipRadius] = useState(503.5); // m (Needle Hull: 503.5 m ellipsoid scale)

  // Constraint configuration state (exact Needle Hull defaults)
  const [massTolPct, setMassTolPct] = useState(5); // ±5% mass tolerance (1340-1470 kg range)
  const [maxPower, setMaxPower] = useState(100); // 100 MW max power (headroom above 83 MW target)
  const [maxZeta, setMaxZeta] = useState(1.0); // ζ ≤ 1.0 Ford-Roman bound
  const [minGamma, setMinGamma] = useState(25); // γ ≥ 25 geometric amplification

  // Dynamic simulation parameters - Needle Hull Mk 1 defaults
  const [gammaGeo, setGammaGeo] = useState(26); // γ_geo = 26 (Needle Hull research value)
  const [qFactor, setQFactor] = useState(1e9); // Q_cavity default for research sketch
  const [duty, setDuty] = useState(0.14); // 14% burst duty cycle (HOVER MODE default)
  const [sagDepth, setSagDepth] = useState(16); // 16 nm sag depth for Ω profiling
  const [temperature, setTemperature] = useState(20);
  const [exoticMassTarget, setExoticMassTarget] = useState(1405); // Default to research paper target

  // Operational mode state - default to hover mode
  const [selectedMode, setSelectedMode] = useState<ModeKey>("hover");

  // Function to determine best matching mode based on current duty, using MODE_CONFIGS
  const findBestMatchingMode = (currentDuty: number): ModeKey => {
    let best: ModeKey = "hover";
    let bestErr = Number.POSITIVE_INFINITY;
    (Object.keys(MODE_CONFIGS) as ModeKey[]).forEach((k) => {
      const target = MODE_CONFIGS[k].dutyCycle ?? 0;
      const err = Math.abs(currentDuty - target);
      // tolerance: 15% of target or an absolute floor
      const tol = Math.max(0.001, 0.15 * Math.max(target, 0.001));
      if (err < bestErr && err <= tol) {
        bestErr = err;
        best = k;
      }
    });
    return best;
    };

  // Mode-aware constraint calculation (kept explicit; can diverge from MODE_CONFIGS if needed)
  const getModeAwareConstraints = (mode: ModeKey) => {
    switch (mode) {
      case "hover": // 14% duty → ~83 MW
        return { maxPower: 120, maxZeta: 0.1, massTolPct: 5 };
      case "cruise": // 0.5% duty → ~0.007 MW
        return { maxPower: 20, maxZeta: 1.5, massTolPct: 5 };
      case "emergency": // 50% duty → ~297 MW
        return { maxPower: 400, maxZeta: 0.05, massTolPct: 5 };
      case "standby": // 0% duty → 0 MW
        return { maxPower: 10, maxZeta: 10, massTolPct: 5 };
      default:
        return { maxPower: 100, maxZeta: 1.0, massTolPct: 5 };
    }
  };

  // Get current mode constraints
  const currentConstraints = getModeAwareConstraints(selectedMode);

  // Auto-update constraints when mode changes (UI-only knobs)
  useEffect(() => {
    const c = getModeAwareConstraints(selectedMode);
    setMaxPower(c.maxPower);
    setMaxZeta(c.maxZeta);
    setMassTolPct(c.massTolPct);
  }, [selectedMode]);

  // Keep server pipeline mode & duty in sync with local selection (and align duty to mode default)
  useEffect(() => {
    const cfg = MODE_CONFIGS[selectedMode];
    if (!cfg) return;
    const dutyForMode = cfg.dutyCycle ?? duty;
    // Align local duty to selected mode's nominal duty
    setDuty(dutyForMode);
    // Notify backend (currentMode + dutyCycle)
    updatePipeline.mutate({
      currentMode: selectedMode,
      dutyCycle: dutyForMode,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Atom className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Needle Hull Mk 1 Research Platform</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/simulation">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Simulation Config
              </Button>
            </Link>
            <Link href="/documentation">
              <Button variant="outline" className="flex items-center gap-2">
                <Book className="w-4 h-4" />
                Documentation
              </Button>
            </Link>
            <Link href="/helix-core">
              <Button variant="outline" className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                HELIX-CORE
              </Button>
            </Link>
            <Button variant="outline" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Live Energy Pipeline */}
          <div className="space-y-4">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Atom className="w-5 h-5" />
                Live Energy Pipeline
              </h2>
              <LiveEnergyPipeline
                gammaGeo={gammaGeo}
                qFactor={qFactor}
                duty={duty}
                sagDepth={sagDepth}
                temperature={temperature}
                tileArea={tileArea}
                shipRadius={shipRadius}
                gapDistance={1.0}
                sectorCount={400}
                exoticMassTarget={exoticMassTarget}
                isRunning={false}
                selectedMode={selectedMode}
                onModeChange={(mode: string) => {
                  const mk = mode as ModeKey;
                  setSelectedMode(mk);
                  const cfg = MODE_CONFIGS[mk];
                  if (cfg?.dutyCycle != null) {
                    setDuty(cfg.dutyCycle);
                  }
                  // Update backend with mode & aligned duty
                  updatePipeline.mutate({
                    currentMode: mk as any,
                    dutyCycle: cfg?.dutyCycle ?? duty,
                  });
                }}
                onParameterUpdate={({
                  duty: newDuty,
                  qFactor: newQ,
                  gammaGeo: newGamma,
                  exoticMassTarget: newM,
                }) => {
                  if (newDuty !== undefined) setDuty(newDuty);
                  if (newQ !== undefined) setQFactor(newQ);
                  if (newGamma !== undefined) setGammaGeo(newGamma);
                  if (newM !== undefined) setExoticMassTarget(newM);

                  // Update backend pipeline with new parameters
                  updatePipeline.mutate({
                    dutyCycle: newDuty ?? duty,
                    // ⬇️ map UI qFactor → pipeline qCavity (not qMechanical)
                    qCavity: newQ ?? qFactor,
                    gammaGeo: newGamma ?? gammaGeo,
                    exoticMassTarget_kg: newM ?? exoticMassTarget,
                    currentMode: selectedMode,
                  });
                }}
              />
            </div>

            {/* Bridge Physics Derivation Cards */}
            <BridgeDerivationCards />
          </div>

          {/* Interactive Phase Diagram */}
          <div className="space-y-4">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Interactive Phase Diagram
              </h2>
              <PhaseDiagram
                tileArea={tileArea}
                onTileAreaChange={setTileArea}
                shipRadius={shipRadius}
                onShipRadiusChange={setShipRadius}
                massTolPct={massTolPct}
                onMassTolPctChange={setMassTolPct}
                maxPower={maxPower}
                onMaxPowerChange={setMaxPower}
                maxZeta={maxZeta}
                onMaxZetaChange={setMaxZeta}
                minGamma={minGamma}
                onMinGammaChange={setMinGamma}
                gammaGeo={gammaGeo}
                onGammaGeoChange={(g: number) => {
                  setGammaGeo(g);
                  updatePipeline.mutate({ gammaGeo: g });
                }}
                qFactor={qFactor}
                onQFactorChange={(q: number) => {
                  setQFactor(q);
                  // map to qCavity in backend
                  updatePipeline.mutate({ qCavity: q });
                }}
                duty={duty}
                onDutyChange={(newDuty: number) => {
                  setDuty(newDuty);
                  // Backend: keep duty in sync
                  updatePipeline.mutate({ dutyCycle: newDuty });

                  // Auto-update operational mode when duty cycle changes from phase diagram
                  const matchingMode = findBestMatchingMode(newDuty);
                  if (matchingMode !== selectedMode) {
                    setSelectedMode(matchingMode);
                    const cfg = MODE_CONFIGS[matchingMode];
                    // ensure backend also sees mode change
                    updatePipeline.mutate({
                      currentMode: matchingMode,
                      dutyCycle: cfg?.dutyCycle ?? newDuty,
                    });
                  }
                }}
                sagDepth={sagDepth}
                onSagDepthChange={setSagDepth}
                temperature={temperature}
                currentSimulation={null}
                // Add mode synchronization
                selectedMode={selectedMode}
                onModeChange={(newMode: string) => {
                  const mk = newMode as ModeKey;
                  setSelectedMode(mk);
                  const cfg = MODE_CONFIGS[mk as unknown as ModeKey];
                  if (cfg?.dutyCycle != null) setDuty(cfg.dutyCycle);
                  updatePipeline.mutate({
                    currentMode: mk as any,
                    dutyCycle: cfg?.dutyCycle ?? duty,
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Natário Zero-Expansion Warp Bubble Research Platform • Needle Hull Mk 1 Configuration</p>
          <p>Real-time energy pipeline calculations with authentic Casimir physics</p>
        </div>
      </div>
    </div>
  );
}
