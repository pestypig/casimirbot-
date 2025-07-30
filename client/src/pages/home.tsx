import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Atom, Settings, Book, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhaseDiagram from "@/components/phase-diagram";
import { LiveEnergyPipeline } from "@/components/live-energy-pipeline";

export default function Home() {
  // Shared phase diagram state - Needle Hull Mk 1 defaults
  const [tileArea, setTileArea] = useState(5); // cm² (Needle Hull: 5 cm²)
  const [shipRadius, setShipRadius] = useState(82.0); // m (Needle Hull: 82.0 m ellipsoid scale)
  
  // Constraint configuration state (exact Needle Hull defaults)
  const [massTolPct, setMassTolPct] = useState(5);      // ±5% mass tolerance (1340-1470 kg range)
  const [maxPower, setMaxPower] = useState(100);       // 100 MW max power (headroom above 83 MW target)
  const [maxZeta, setMaxZeta] = useState(1.0);         // ζ ≤ 1.0 Ford-Roman bound
  const [minGamma, setMinGamma] = useState(25);        // γ ≥ 25 geometric amplification
  
  // Dynamic simulation parameters - Needle Hull Mk 1 defaults
  const [gammaGeo, setGammaGeo] = useState(26);        // γ_geo = 26 (Needle Hull research value)
  const [qFactor, setQFactor] = useState(1.6e6);       // Q = 1.6 × 10⁶ (Needle Hull research value)
  const [duty, setDuty] = useState(0.14);              // 14% burst duty cycle (HOVER MODE default)
  const [sagDepth, setSagDepth] = useState(16);        // 16 nm sag depth for Ω profiling
  const [temperature, setTemperature] = useState(20);
  
  // Operational mode state - default to hover mode
  const [selectedMode, setSelectedMode] = useState("hover");
  
  // Function to determine best matching mode based on current parameters
  const findBestMatchingMode = (currentDuty: number): string => {
    const modes = {
      hover: { duty: 0.14, threshold: 0.02 },
      cruise: { duty: 0.005, threshold: 0.002 },
      emergency: { duty: 0.50, threshold: 0.1 },
      standby: { duty: 0.0, threshold: 0.001 }
    };
    
    let bestMatch = "hover";
    let minDifference = Infinity;
    
    for (const [mode, config] of Object.entries(modes)) {
      const difference = Math.abs(currentDuty - config.duty);
      if (difference < minDifference && difference <= config.threshold) {
        minDifference = difference;
        bestMatch = mode;
      }
    }
    
    return bestMatch;
  };

  // Mode-aware constraint calculation
  const getModeAwareConstraints = (mode: string) => {
    switch(mode) {
      case "hover":     // 14% duty → ~83 MW
        return { maxPower: 120, maxZeta: 0.1, massTolPct: 5 };
      case "cruise":    // 0.5% duty → ~0.007 MW  
        return { maxPower: 20, maxZeta: 1.5, massTolPct: 5 };
      case "emergency": // 50% duty → ~297 MW
        return { maxPower: 400, maxZeta: 0.05, massTolPct: 5 };
      case "standby":   // 0% duty → 0 MW
        return { maxPower: 10, maxZeta: 10, massTolPct: 5 };
      default:
        return { maxPower: 100, maxZeta: 1.0, massTolPct: 5 };
    }
  };

  // Get current mode constraints
  const currentConstraints = getModeAwareConstraints(selectedMode);
  
  // Auto-update constraints when mode changes
  useEffect(() => {
    const newConstraints = getModeAwareConstraints(selectedMode);
    setMaxPower(newConstraints.maxPower);
    setMaxZeta(newConstraints.maxZeta);
    setMassTolPct(newConstraints.massTolPct);
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
                isRunning={false}
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                onParameterUpdate={({ duty: newDuty, qFactor: newQFactor, gammaGeo: newGammaGeo }) => {
                  if (newDuty !== undefined) setDuty(newDuty);
                  if (newQFactor !== undefined) setQFactor(newQFactor);  
                  if (newGammaGeo !== undefined) setGammaGeo(newGammaGeo);
                }}
              />
            </div>
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
                onGammaGeoChange={setGammaGeo}
                qFactor={qFactor}
                onQFactorChange={setQFactor}
                duty={duty}
                onDutyChange={(newDuty: number) => {
                  setDuty(newDuty);
                  // Auto-update operational mode when duty cycle changes from phase diagram
                  const matchingMode = findBestMatchingMode(newDuty);
                  if (matchingMode !== selectedMode) {
                    setSelectedMode(matchingMode);
                  }
                }}
                sagDepth={sagDepth}
                onSagDepthChange={setSagDepth}
                temperature={temperature}
                currentSimulation={null}
                // Add mode synchronization
                selectedMode={selectedMode}
                onModeChange={(newMode: string) => {
                  setSelectedMode(newMode);
                  // Update other parameters when mode changes from phase diagram
                  const modes = {
                    hover: { duty: 0.14 },
                    cruise: { duty: 0.005 },
                    emergency: { duty: 0.50 },
                    standby: { duty: 0.0 }
                  };
                  const modeConfig = modes[newMode as keyof typeof modes];
                  if (modeConfig) {
                    setDuty(modeConfig.duty);
                  }
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