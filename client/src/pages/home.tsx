import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Atom, Book, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ParameterPanel from "@/components/parameter-panel";
import SimulationStatus from "@/components/simulation-status";
import ResultsPanel from "@/components/results-panel";
import { MeshVisualization } from "@/components/mesh-visualization";
import { createSimulation, startSimulation, generateScuffgeo, downloadFile, downloadAllFiles, createWebSocketConnection } from "@/lib/simulation-api";
import { SimulationParameters, SimulationResult } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSimulation, setCurrentSimulation] = useState<SimulationResult | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  
  // Shared phase diagram state
  const [tileArea, setTileArea] = useState(25); // cm² (default: 5 cm × 5 cm = 25 cm²)
  const [shipRadius, setShipRadius] = useState(5.0); // m
  
  // Dynamic simulation parameters for real-time phase diagram updates
  const [gammaGeo, setGammaGeo] = useState(25);
  const [qFactor, setQFactor] = useState(1e9);
  const [duty, setDuty] = useState(0.01);
  const [sagDepth, setSagDepth] = useState(16);
  const [temperature, setTemperature] = useState(20);
  const [strokeAmplitude, setStrokeAmplitude] = useState(50);
  const [burstTime, setBurstTime] = useState(10);
  const [cycleTime, setCycleTime] = useState(1000);
  const [xiPoints, setXiPoints] = useState(5000);
  
  // Apply Needle Hull Preset - sets all parameters to paper defaults
  const applyNeedleHullPreset = () => {
    setTileArea(25);      // cm²
    setShipRadius(5.0);   // m
    setGammaGeo(25);
    setQFactor(1e9);
    setDuty(0.01);
    setSagDepth(16);
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

            {/* Results Panel */}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
