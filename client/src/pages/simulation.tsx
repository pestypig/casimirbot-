import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ParameterPanel from "@/components/parameter-panel";
import SimulationStatus from "@/components/simulation-status";
import ResultsPanel from "@/components/results-panel";
import { MeshVisualization } from "@/components/mesh-visualization";
import { createSimulation, startSimulation, generateScuffgeo, downloadFile, downloadAllFiles, createWebSocketConnection } from "@/lib/simulation-api";
import { SimulationParameters, SimulationResult } from "@shared/schema";

export default function Simulation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSimulation, setCurrentSimulation] = useState<SimulationResult | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  
  // Shared phase diagram state - Needle Hull Mk 1 defaults
  const [tileArea, setTileArea] = useState(5); // cm² (Needle Hull: 5 cm²)
  const [shipRadius, setShipRadius] = useState(82.0); // m (Needle Hull: 82.0 m ellipsoid scale)
  
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
      queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
      toast({
        title: "Simulation Created",
        description: `Simulation ${newSimulation.id} created successfully`,
      });
    },
    onError: (error) => {
      console.error("Create simulation error:", error);
      toast({
        title: "Error",
        description: "Failed to create simulation",
        variant: "destructive",
      });
    }
  });

  // Start simulation mutation
  const startSimulationMutation = useMutation({
    mutationFn: startSimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
      toast({
        title: "Simulation Started",
        description: "Simulation is now running",
      });
    },
    onError: (error) => {
      console.error("Start simulation error:", error);
      toast({
        title: "Error",
        description: "Failed to start simulation",
        variant: "destructive",
      });
    }
  });

  // Generate SCUFF-EM geometry file mutation
  const generateScuffgeoMutation = useMutation({
    mutationFn: generateScuffgeo,
    onSuccess: () => {
      toast({
        title: "Geometry Generated",
        description: "SCUFF-EM geometry file created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Generate scuffgeo error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate geometry file",
        variant: "destructive",
      });
    }
  });

  // Handle WebSocket connection for real-time updates
  useEffect(() => {
    if (currentSimulation?.id && !ws) {
      const websocket = createWebSocketConnection(currentSimulation.id);
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'status') {
          setCurrentStep(data.step);
          setCurrentSimulation(prev => prev ? { ...prev, status: data.status } : null);
        }
      };
      setWs(websocket);
    }

    return () => {
      if (ws) {
        ws.close();
        setWs(null);
      }
    };
  }, [currentSimulation?.id]);

  const handleRunSimulation = () => {
    const params: SimulationParameters = {
      geometry: "bowl", // Always use bowl geometry for Needle Hull
      gapDistance: 1.0, // Fixed 1 nm gap
      tileArea,
      shipRadius,
      sagDepth,
      temperature,
      gammaGeo,
      qFactor,
      duty,
      strokeAmplitude,
      burstTime,
      cycleTime,
      xiPoints
    };

    createSimulationMutation.mutate(params);
  };

  const handleStartSimulation = () => {
    if (currentSimulation?.id) {
      startSimulationMutation.mutate(currentSimulation.id);
    }
  };

  const handleGenerateGeometry = () => {
    if (currentSimulation?.id) {
      generateScuffgeoMutation.mutate(currentSimulation.id);
    }
  };

  const handleDownload = (filename: string) => {
    if (currentSimulation?.id) {
      downloadFile(currentSimulation.id, filename);
    }
  };

  const handleDownloadAll = () => {
    if (currentSimulation?.id) {
      downloadAllFiles(currentSimulation.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Simulation Configuration</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Parameters and Controls */}
          <div className="space-y-6">
            <ParameterPanel
              tileArea={tileArea}
              setTileArea={setTileArea}
              shipRadius={shipRadius}
              setShipRadius={setShipRadius}
              gammaGeo={gammaGeo}
              setGammaGeo={setGammaGeo}
              qFactor={qFactor}
              setQFactor={setQFactor}
              duty={duty}
              setDuty={setDuty}
              sagDepth={sagDepth}
              setSagDepth={setSagDepth}
              temperature={temperature}
              setTemperature={setTemperature}
              strokeAmplitude={strokeAmplitude}
              setStrokeAmplitude={setStrokeAmplitude}
              burstTime={burstTime}
              setBurstTime={setBurstTime}
              cycleTime={cycleTime}
              setCycleTime={setCycleTime}
              xiPoints={xiPoints}
              setXiPoints={setXiPoints}
              onApplyNeedleHullPreset={applyNeedleHullPreset}
              onRunSimulation={handleRunSimulation}
              isRunning={createSimulationMutation.isPending}
            />

            <div className="flex gap-2">
              <Button 
                onClick={handleStartSimulation} 
                disabled={!currentSimulation || startSimulationMutation.isPending}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Simulation
              </Button>
              <Button 
                onClick={handleGenerateGeometry} 
                disabled={!currentSimulation || generateScuffgeoMutation.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Generate Geometry
              </Button>
              <Button 
                onClick={handleDownloadAll} 
                disabled={!currentSimulation}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download All
              </Button>
            </div>
          </div>

          {/* Right Column - Status and Visualization */}
          <div className="space-y-6">
            <SimulationStatus
              simulation={currentSimulation}
              currentStep={currentStep}
              onDownload={handleDownload}
            />

            <MeshVisualization 
              sagDepth1={0} 
              sagDepth2={sagDepth} 
              radius={25}
            />

            {simulation && (
              <ResultsPanel
                simulation={simulation}
                onDownload={handleDownload}
                showVisualProof={true}
                showVerification={true}
                showPhaseDiagram={false} // Hide phase diagram on this page
                tileArea={tileArea}
                shipRadius={shipRadius}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}