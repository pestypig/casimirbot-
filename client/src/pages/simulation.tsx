import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ParameterPanel from "@/components/parameter-panel";
import SimulationStatus from "@/components/simulation-status";
import ResultsPanel from "@/components/results-panel";
import { MeshVisualization } from "@/components/mesh-visualization";
import {
  createSimulation,
  startSimulation,
  generateScuffgeo,
  downloadFile,
  downloadAllFiles,
  createWebSocketConnection,
} from "@/lib/simulation-api";
import { SimulationParameters, SimulationResult } from "@shared/schema";

export default function Simulation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSimulation, setCurrentSimulation] = useState<SimulationResult | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");

  // Shared phase diagram state - Needle Hull Mk 1 defaults
  const [tileArea, setTileArea] = useState(5); // cm²
  const [shipRadius, setShipRadius] = useState(82.0); // m

  // Dynamic sim params - Needle Hull Mk 1 defaults
  const [gammaGeo, setGammaGeo] = useState(26);        // UI only
  const [qFactor, setQFactor] = useState(1.6e6);       // cavity Q
  const [duty, setDuty] = useState(0.002);             // ship-wide duty (fraction)
  const [sagDepth, setSagDepth] = useState(16);        // nm
  const [temperature, setTemperature] = useState(20);  // K
  const [strokeAmplitude, setStrokeAmplitude] = useState(50); // pm
  const [burstTime, setBurstTime] = useState(10);      // µs
  const [cycleTime, setCycleTime] = useState(1000);    // µs
  const [xiPoints, setXiPoints] = useState(5000);

  // Apply Needle Hull Preset
  const applyNeedleHullPreset = () => {
    setTileArea(5);
    setShipRadius(82.0);
    setGammaGeo(26);
    setQFactor(1.6e6);
    setDuty(0.002);
    setSagDepth(16);
    setTemperature(20);
    setStrokeAmplitude(50);
    setBurstTime(10);
    setCycleTime(1000);
    setXiPoints(5000);
  };

  // Fetch a single simulation by id (needed queryFn)
  const fetchSimulation = async (id: string): Promise<SimulationResult> => {
    const res = await fetch(`/api/simulations/${id}`);
    if (!res.ok) throw new Error("Failed to fetch simulation");
    return res.json();
  };

  // Query for simulation data
  const { data: simulation } = useQuery<SimulationResult>({
    queryKey: ["/api/simulations", currentSimulation?.id],
    enabled: !!currentSimulation?.id,
    // Poll while running
    refetchInterval:
      currentSimulation?.status && !["completed", "failed"].includes(currentSimulation.status)
        ? 2000
        : false,
    suspense: false,
    queryFn: () => fetchSimulation(currentSimulation!.id),
  });

  // Create simulation
  const createSimulationMutation = useMutation({
    mutationFn: createSimulation,
    onSuccess: (newSimulation: SimulationResult) => {
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
    },
  });

  // Start simulation
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
    },
  });

  // Generate SCUFF-EM geometry file
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
    },
  });

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!currentSimulation?.id) return;

    const websocket = createWebSocketConnection(currentSimulation.id);
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "progress") {
        // server sends { type: 'progress', message: string }
        setCurrentStep(data.message);
        setCurrentSimulation((prev) =>
          prev ? { ...prev, status: "calculating", logs: [...(prev.logs ?? []), data.message] } : prev
        );
      } else if (data.type === "completed") {
        // server sends { type: 'completed', results: {...} }
        setCurrentSimulation((prev) =>
          prev ? { ...prev, status: "completed", results: data.results } : prev
        );
        queryClient.invalidateQueries({ queryKey: ["/api/simulations", currentSimulation.id] });
      } else if (data.type === "error") {
        // server sends { type: 'error', error: string }
        setCurrentSimulation((prev) => (prev ? { ...prev, status: "failed", error: data.error } : prev));
        toast({ title: "Simulation Error", description: data.error, variant: "destructive" });
      }
    };

    setWs(websocket);
    return () => {
      websocket.close();
      setWs(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSimulation?.id]);

  const handleRunSimulation = () => {
    // Map UI -> backend schema
    const params: SimulationParameters = {
      geometry: "bowl",
      gap: 1.0, // nm
      radius: 25000, // µm (25 mm tile radius)
      sagDepth, // nm
      material: "PEC",
      temperature, // K
      moduleType: "dynamic",
      dynamicConfig: {
        modulationFreqGHz: 15,
        strokeAmplitudePm: strokeAmplitude, // pm
        burstLengthUs: burstTime, // µs
        cycleLengthUs: cycleTime, // µs
        cavityQ: qFactor,
        sectorCount: 400,
        sectorDuty: duty, // fraction
        pulseFrequencyGHz: 15,
        lightCrossingTimeNs: 100,
        shiftAmplitude: strokeAmplitude * 1e-12, // meters from pm
        expansionTolerance: 1e-12,
        warpFieldType: "natario",
      },
      advanced: {
        xiMin: 1e-3,
        maxXiPoints: xiPoints,
        intervals: 50,
        absTol: 0,
        relTol: 0.01,
      },
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
            <SimulationStatus simulation={currentSimulation} currentStep={currentStep} onDownload={handleDownload} />

            <MeshVisualization sagDepth1={0} sagDepth2={sagDepth} radius={25} />

            {simulation && (
              <ResultsPanel
                simulation={simulation}
                onDownload={handleDownload}
                showVisualProof={true}
                showVerification={true}
                showPhaseDiagram={false}
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