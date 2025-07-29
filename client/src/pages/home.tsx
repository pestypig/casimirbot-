import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Atom, Book, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ParameterPanel from "@/components/parameter-panel";
import SimulationStatus from "@/components/simulation-status";
import ResultsPanel from "@/components/results-panel";
import { MeshVisualization } from "@/components/mesh-visualization";
import PhaseDiagram from "@/components/phase-diagram";
import { LiveEnergyPipeline } from "@/components/live-energy-pipeline";
import { createSimulation, startSimulation, generateScuffgeo, downloadFile, downloadAllFiles, createWebSocketConnection } from "@/lib/simulation-api";
import { SimulationParameters, SimulationResult } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSimulation, setCurrentSimulation] = useState<SimulationResult | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  
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
  const [duty, setDuty] = useState(0.002);             // 0.2% burst duty cycle
  const [sagDepth, setSagDepth] = useState(16);        // 16 nm sag depth for Ω profiling
  const [temperature, setTemperature] = useState(20);
  const [strokeAmplitude, setStrokeAmplitude] = useState(50);
  const [burstTime, setBurstTime] = useState(10);
  const [cycleTime, setCycleTime] = useState(1000);
  const [xiPoints, setXiPoints] = useState(5000);
  
  // Apply Needle Hull Preset - sets all parameters to exact research paper defaults
  const applyNeedleHullPreset = () => {
    setTileArea(5);       // cm² (Needle Hull: 5 cm²)
    setShipRadius(82.0);  // m (Needle Hull: 82.0 m ellipsoid scale)
    setGammaGeo(26);      // γ_geo = 26 (research value)
    setQFactor(1.6e6);    // Q = 1.6 × 10⁶ (research value)
    setDuty(0.002);       // 0.2% burst duty cycle
    setSagDepth(16);      // 16 nm sag depth for Ω profiling
    setTemperature(20);
    setStrokeAmplitude(50);
    setBurstTime(10);
    setCycleTime(1000);
    setXiPoints(5000);
    // Reset constraint sliders to research paper defaults
    setMassTolPct(5);     // ±5% for strict research compliance
    setMaxPower(100);     // 100 MW for Needle Hull target
    setMaxZeta(1.0);      // Ford-Roman bound
    setMinGamma(25);      // Research geometric amplification
  };

  // Query for simulation data
  const { data: simulation, isLoading } = useQuery<SimulationResult>({
    queryKey: ["/api/simulations", currentSimulation?.id],
    enabled: !!currentSimulation?.id,
    refetchInterval: currentSimulation?.status && 
      !["completed", "failed"].includes(currentSimulation.status) ? 2000 : false,
  });

  // Create simulation mutation
  const createSimulationMutation = useMutation({
    mutationFn: createSimulation,
    onSuccess: (newSimulation) => {
      setCurrentSimulation(newSimulation);
      queryClient.setQueryData(["/api/simulations", newSimulation.id], newSimulation);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create simulation",
        variant: "destructive",
      });
    },
  });

  // Start simulation mutation
  const startSimulationMutation = useMutation({
    mutationFn: (id: string) => startSimulation(id),
    onSuccess: () => {
      toast({
        title: "Simulation Started",
        description: "Your Casimir effect simulation is now running",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start simulation",
        variant: "destructive",
      });
    },
  });

  // Generate scuffgeo mutation
  const generateScuffgeoMutation = useMutation({
    mutationFn: (id: string) => generateScuffgeo(id),
    onSuccess: (content) => {
      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'geometry.scuffgeo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "File Generated",
        description: "geometry.scuffgeo file has been downloaded",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate file",
        variant: "destructive",
      });
    },
  });

  // WebSocket connection management
  useEffect(() => {
    if (currentSimulation?.id && currentSimulation.status !== "completed" && currentSimulation.status !== "failed") {
      const websocket = createWebSocketConnection(currentSimulation.id);
      
      websocket.onopen = () => {
        console.log("WebSocket connected");
      };
      
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'progress':
            setCurrentStep(data.message);
            break;
          case 'completed':
            queryClient.invalidateQueries({ queryKey: ["/api/simulations", currentSimulation.id] });
            toast({
              title: "Simulation Completed",
              description: "Your Casimir effect simulation has finished successfully",
            });
            break;
          case 'error':
            queryClient.invalidateQueries({ queryKey: ["/api/simulations", currentSimulation.id] });
            toast({
              title: "Simulation Failed",
              description: data.error,
              variant: "destructive",
            });
            break;
        }
      };
      
      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      setWs(websocket);
      
      return () => {
        websocket.close();
      };
    }
  }, [currentSimulation?.id, currentSimulation?.status, queryClient, toast]);

  const handleCreateAndRunSimulation = async (parameters: SimulationParameters) => {
    try {
      const newSimulation = await createSimulationMutation.mutateAsync(parameters);
      await startSimulationMutation.mutateAsync(newSimulation.id);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleGenerateOnly = async (parameters: SimulationParameters) => {
    try {
      const newSimulation = await createSimulationMutation.mutateAsync(parameters);
      await generateScuffgeoMutation.mutateAsync(newSimulation.id);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    if (!currentSimulation) return;
    
    try {
      const blob = await downloadFile(currentSimulation.id, fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileId;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = async () => {
    if (!currentSimulation) return;
    
    try {
      const blob = await downloadAllFiles(currentSimulation.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-${currentSimulation.id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download files",
        variant: "destructive",
      });
    }
  };

  const isSimulationRunning = createSimulationMutation.isPending || startSimulationMutation.isPending || generateScuffgeoMutation.isPending;
  const activeSimulation = simulation || currentSimulation;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Atom className="text-primary-foreground text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Casimir Bot Lite</h1>
              <p className="text-sm text-muted-foreground">SCUFF-EM Simulation Interface</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Book className="h-4 w-4 mr-2" />
              Documentation
            </Button>
            <Button variant="ghost" size="sm">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Parameter Panel */}
          <div className="lg:col-span-1">
            <ParameterPanel
              onSubmit={handleCreateAndRunSimulation}
              onGenerateOnly={handleGenerateOnly}
              isLoading={isSimulationRunning}
              onTileAreaChange={setTileArea}
              onShipRadiusChange={setShipRadius}
              onApplyPreset={applyNeedleHullPreset}
              parameterValues={{
                gammaGeo,
                qFactor,
                duty,
                sagDepth,
                temperature,
                strokeAmplitude,
                burstTime,
                cycleTime,
                xiPoints
              }}
              onParameterChange={{
                setGammaGeo,
                setQFactor,
                setDuty,
                setSagDepth,
                setTemperature,
                setStrokeAmplitude,
                setBurstTime,
                setCycleTime,
                setXiPoints
              }}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Simulation Status */}
            <SimulationStatus
              status={activeSimulation?.status || "idle"}
              currentStep={currentStep}
            />

            {/* Mesh Visualization */}
            <MeshVisualization />

            {/* Live Energy Pipeline - Real-time Equation Display */}
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
              isRunning={isSimulationRunning}
            />

            {/* Interactive Phase Diagram - Always Visible */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold mb-2">Interactive Phase Diagram</h3>
                <p className="text-sm text-muted-foreground">
                  Explore the design space with authentic Needle Hull Mk 1 physics. Fixed 1400 kg exotic mass budget with auto-duty scaling.
                </p>
              </div>
              <div className="p-6">
                <PhaseDiagram
                  tileArea={tileArea}
                  shipRadius={shipRadius}
                  onTileAreaChange={setTileArea}
                  onShipRadiusChange={setShipRadius}
                  // Physics parameters for live calculations
                  gammaGeo={gammaGeo}
                  qFactor={qFactor}
                  duty={duty}
                  sagDepth={sagDepth}
                  temperature={temperature}
                  strokeAmplitude={strokeAmplitude}
                  burstTime={burstTime}
                  cycleTime={cycleTime}
                  xiPoints={xiPoints}
                  // Constraint configuration
                  massTolPct={massTolPct}
                  maxPower={maxPower}
                  maxZeta={maxZeta}
                  minGamma={minGamma}
                  onMassTolPctChange={setMassTolPct}
                  onMaxPowerChange={setMaxPower}
                  onMaxZetaChange={setMaxZeta}
                  onMinGammaChange={setMinGamma}
                  // Physics parameter callbacks
                  onGammaGeoChange={setGammaGeo}
                  onQFactorChange={setQFactor}
                  onDutyChange={setDuty}
                  onSagDepthChange={setSagDepth}
                  simulationStatus={activeSimulation?.status || 'pending'}
                  simulationResults={activeSimulation}
                />
              </div>
            </div>

            {/* Results Panel - Only when simulation exists */}
            {activeSimulation && (
              <ResultsPanel
                simulation={activeSimulation}
                onDownloadFile={handleDownloadFile}
                onDownloadAll={handleDownloadAll}
                tileArea={tileArea}
                shipRadius={shipRadius}
                onTileAreaChange={setTileArea}
                onShipRadiusChange={setShipRadius}
                gammaGeo={gammaGeo}
                qFactor={qFactor}
                duty={duty}
                sagDepth={sagDepth}
                temperature={temperature}
                strokeAmplitude={strokeAmplitude}
                burstTime={burstTime}
                cycleTime={cycleTime}
                xiPoints={xiPoints}
                // Physics parameter callbacks
                onGammaGeoChange={setGammaGeo}
                onQFactorChange={setQFactor}
                onDutyChange={setDuty}
                onSagDepthChange={setSagDepth}
                onGapChange={(value) => {}} // Gap distance control (placeholder)
                // Constraint configuration props
                massTolPct={massTolPct}
                maxPower={maxPower}
                maxZeta={maxZeta}
                minGamma={minGamma}
                onMassTolPctChange={setMassTolPct}
                onMaxPowerChange={setMaxPower}
                onMaxZetaChange={setMaxZeta}
                onMinGammaChange={setMinGamma}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
