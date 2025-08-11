import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { Home, Activity, Grid3X3, Gauge, Brain, Calendar, Terminal, Atom, Cpu, Send, AlertCircle, CheckCircle2, Zap, Database, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useEnergyPipeline, useSwitchMode, MODE_CONFIGS } from "@/hooks/use-energy-pipeline";
import { WarpVisualizer } from "@/components/WarpVisualizer";
import { FuelGauge, computeEffectiveLyPerHour } from "@/components/FuelGauge";

import { TripPlayer } from "@/components/TripPlayer";
import { GalaxyMapPanZoom } from "@/components/GalaxyMapPanZoom";
import { GalaxyDeepZoom } from "@/components/GalaxyDeepZoom";
import { GalaxyOverlays } from "@/components/GalaxyOverlays";
import { SolarMap } from "@/components/SolarMap";
import { RouteSteps } from "@/components/RouteSteps";
import { BODIES } from "@/lib/galaxy-catalog";
import { HelixPerf } from "@/lib/galaxy-schema";
import { computeSolarXY, solarToBodies, getSolarBodiesAsPc } from "@/lib/solar-adapter";
import { Switch } from "@/components/ui/switch";
import { calibrateToImage, SVG_CALIB } from "@/lib/galaxy-calibration";
import { BackgroundLuma } from "@/components/BackgroundLuma";
import { LumaOverlayHost } from "@/components/LumaOverlayHost";
import { publish } from "@/lib/luma-bus";

// Mainframe zones configuration
const MAINFRAME_ZONES = {
  TILE_GRID: "Casimir Tile Grid",
  ENERGY_PANEL: "Energy Control Panel", 
  COMPLIANCE_HUD: "Metric Compliance HUD",
  PHASE_DIAGRAM: "Phase Diagram AI",
  RESONANCE_SCHEDULER: "Resonance Scheduler",
  LOG_TERMINAL: "Log + Document Terminal",
  WARP_VISUALIZER: "Natário Warp Bubble"
};

// Mock tile sectors for demo
const TILE_SECTORS = Array.from({ length: 400 }, (_, i) => ({
  id: `S${i + 1}`,
  qFactor: 5e4 + Math.random() * 1e5,
  errorRate: Math.random() * 0.05,
  temperature: 20 + Math.random() * 5,
  active: Math.random() > 0.3,
  strobing: Math.random() > 0.8,
  curvatureContribution: Math.random() * 1e-15
}));

// Mock compliance metrics
interface ComplianceMetrics {
  activeTiles: number;
  totalTiles: number;
  exoticMass: {
    value: number;
    limit: number;
    status: string;
  };
  natario: {
    value: number;
    status: string;
  };
  curvatureMax: number;
  timeScaleRatio: number;
  overallStatus: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    result: any;
  };
}

export default function HelixCore() {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [mainframeLog, setMainframeLog] = useState<string[]>([
    "[HELIX-CORE] System initialized",
    "[HELIX-CORE] Needle Hull mainframe ready",
    "[HELIX-CORE] Awaiting commands..."
  ]);
  const [commandInput, setCommandInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'HELIX-CORE mainframe initialized. Ready for commands.',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMode, setActiveMode] = useState<"auto" | "manual" | "diagnostics" | "theory">("auto");
  const [modulationFrequency, setModulationFrequency] = useState(15); // Default 15 GHz
  const scrollRef = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState<string[]>(["SOL","ORI_OB1","VEL_OB2","SOL"]);
  const [useDeepZoom, setUseDeepZoom] = useState(false);
  const [mapMode, setMapMode] = useState<"galactic" | "solar">(() => {
    // Persist mode preference with Solar (AU) as default
    const stored = localStorage.getItem("helix-mapMode");
    return (stored === "galactic" || stored === "solar") ? stored : "solar";
  });
  const [solarBodies, setSolarBodies] = useState(() => solarToBodies(computeSolarXY()));
  
  // Live solar positions for route planning (updates every 5 seconds)
  const [solarTick, setSolarTick] = useState(0);
  const solarBodiesForRoutes = useMemo(() => getSolarBodiesAsPc(), [solarTick]);
  const [deepZoomViewer, setDeepZoomViewer] = useState<any>(null);
  const [galaxyCalibration, setGalaxyCalibration] = useState<{originPx:{x:number;y:number}; pxPerPc:number} | null>(null);

  // Physics integration
  const { data: pipelineState, refetch: refetchPipeline } = useEnergyPipeline();
  const switchMode = useSwitchMode();

  // Load galaxy map and compute calibration
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const { originPx, pxPerPc } = calibrateToImage(img.naturalWidth, img.naturalHeight, SVG_CALIB);
      setGalaxyCalibration({ originPx, pxPerPc });
      console.log('🗺️ Galaxy calibration:', { 
        imageSize: { w: img.naturalWidth, h: img.naturalHeight },
        sunPixel: originPx, 
        scale: `${pxPerPc.toFixed(4)} px/pc` 
      });
    };
    img.src = "/galaxymap.png";
  }, []);

  // Fetch compliance metrics
  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/helix/metrics'],
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  const metrics = metricsData as ComplianceMetrics | undefined;

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendCommand = async () => {
    if (!commandInput.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: commandInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await apiRequest({
        url: '/api/helix/chat',
        method: 'POST',
        body: {
          message: commandInput,
          context: {
            selectedSector,
            activeMode,
            mainframeLog: mainframeLog.slice(-10) // Last 10 log entries for context
          }
        }
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };

      if (response.functionResult) {
        assistantMessage.functionCall = {
          name: response.message.function_call.name,
          result: response.functionResult
        };
        setMainframeLog(prev => [...prev, `[FUNCTION] ${response.message.function_call.name} executed`]);
        refetchMetrics();
      }

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Communication Error",
        description: error instanceof Error ? error.message : "Failed to communicate with HELIX-CORE",
        variant: "destructive"
      });
    } finally {
      setCommandInput("");
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Background Luma Guardian Star */}
      <BackgroundLuma opacity={0.6} blurPx={0} />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 relative z-10">
        <div className="container mx-auto p-4 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Cpu className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  HELIX-CORE
                </h1>
                <p className="text-sm text-slate-400">Needle Hull Mainframe System</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-green-400 text-green-400">
                <Activity className="w-3 h-3 mr-1" />
                ONLINE
              </Badge>
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Bridge
                </Button>
              </Link>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mb-6">
            <div className="flex gap-2">
              <Button 
                variant={activeMode === "auto" ? "default" : "outline"}
                onClick={() => setActiveMode("auto")}
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Auto
              </Button>
              <Button 
                variant={activeMode === "manual" ? "default" : "outline"}
                onClick={() => setActiveMode("manual")}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Manual
              </Button>
              <Button 
                variant={activeMode === "diagnostics" ? "default" : "outline"}
                onClick={() => setActiveMode("diagnostics")}
                className="flex items-center gap-2"
              >
                <Terminal className="w-4 h-4" />
                Diagnostics
              </Button>
              <Button 
                variant={activeMode === "theory" ? "default" : "outline"}
                onClick={() => setActiveMode("theory")}
                className="flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Theory
              </Button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mode-dependent left panel */}
            <div className="lg:col-span-2 space-y-6">
              {activeMode === "auto" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-cyan-400" />
                      Operational Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mode: {pipelineState?.currentMode || 'Hover'}</Label>
                        <div className="text-2xl font-bold text-cyan-400">
                          {MODE_CONFIGS[pipelineState?.currentMode || 'hover']?.name || 'Hover Mode'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Power Output</Label>
                        <div className="text-2xl font-bold text-yellow-400">
                          {(pipelineState?.P_avg || 83.3).toFixed(1)} MW
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Exotic Mass</Label>
                        <div className={`text-2xl font-bold ${
                          (pipelineState?.M_exotic || 1405) > 0 
                            ? 'text-red-400' 
                            : 'text-green-400'
                        }`}>
                          {(pipelineState?.M_exotic || 1405).toExponential(2)} kg
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Overall Status</Label>
                        <Badge 
                          variant={pipelineState?.overallStatus === 'VIABLE' ? 'default' : 'destructive'}
                          className="text-sm"
                        >
                          {pipelineState?.overallStatus || 'VIABLE'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeMode === "manual" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="w-5 h-5 text-cyan-400" />
                      Tile Grid Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Duty Cycle</Label>
                          <div className="text-lg font-mono text-cyan-400">
                            {((pipelineState?.dutyCycle || 0.14) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <Label>Sector Strobing</Label>
                          <div className="text-lg font-mono text-yellow-400">
                            {((pipelineState?.sectorStrobing || 0.4) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <Label>Modulation Frequency</Label>
                          <div className="text-lg font-mono text-purple-400">
                            {(pipelineState?.modulationFreq_GHz || 15).toFixed(1)} GHz
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Current Mode Configuration</Label>
                        <div className="p-3 bg-slate-800 rounded-lg">
                          <div className="text-sm font-bold text-cyan-400">
                            {MODE_CONFIGS[pipelineState?.currentMode || 'hover']?.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {MODE_CONFIGS[pipelineState?.currentMode || 'hover']?.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Compliance HUD */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                    Compliance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Ford-Roman Limit</Label>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          (pipelineState?.zeta || 0.032) < 0.1 ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <span className="text-sm">
                          {((pipelineState?.fordRomanCompliance || 0.8) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Natário Constraint</Label>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          (pipelineState?.natarioConstraint || 0.92) > 0.9 ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <span className="text-sm">
                          {((pipelineState?.natarioConstraint || 0.92) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Curvature Safety</Label>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          (pipelineState?.U_cycle || 0) < (pipelineState?.curvatureLimit || 1e16) ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <span className="text-sm">
                          {((pipelineState?.curvatureLimit || 1e16) / 1e16).toExponential(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Time-Scale Ratio</Label>
                    <div className={`text-lg font-mono ${
                      (pipelineState?.TS_ratio || 4102.74) > 1000 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {(pipelineState?.TS_ratio || 4102.74) > 1000 
                        ? (pipelineState?.TS_ratio || 4102.74).toExponential(2) 
                        : (pipelineState?.TS_ratio || 4102.74).toFixed(2)
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Energy Pipeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Atom className="w-5 h-5 text-cyan-400" />
                    Energy Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                    <div>Static: {(pipelineState?.U_static || 0).toExponential(2)} J</div>
                    <div>Geometric: {(pipelineState?.U_geo || 0).toExponential(2)} J</div>
                    <div>Q-Enhancement: {(pipelineState?.U_Q || 0).toExponential(2)} J</div>
                    <div>Cycle: {(pipelineState?.U_cycle || 0).toExponential(2)} J</div>
                    <div>Loss: {(pipelineState?.P_loss_raw || 0).toExponential(2)} W</div>
                    <div>Tiles: {(pipelineState?.N_tiles || 0).toExponential(2)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Warp Visualizer */}
              <WarpVisualizer
                parameters={{
                  dutyCycle: pipelineState?.dutyCycle || 0.14,
                  g_y: pipelineState?.gammaGeo || 26,
                  cavityQ: pipelineState?.qCavity || 1e9,
                  sagDepth_nm: pipelineState?.sag_nm || 16,
                  tsRatio: pipelineState?.TS_ratio || 4102.74,
                  powerAvg_MW: pipelineState?.P_avg || 83.3,
                  exoticMass_kg: pipelineState?.M_exotic || 1405,
                  mode: pipelineState?.currentMode || 'hover',
                  sectorStrobing: pipelineState?.sectorStrobing || 0.4,
                  qSpoilingFactor: pipelineState?.qSpoilingFactor || 0.15,
                  gammaVanDenBroeck: pipelineState?.gammaVanDenBroeck || 2.5
                }}
                onModeChange={async (newMode) => {
                  try {
                    await switchMode(newMode);
                    publish('zen-whisper', {
                      text: `Mode switched to ${newMode}`,
                      duration: 3000
                    });
                  } catch (error) {
                    console.error('Mode switch failed:', error);
                  }
                }}
              />
            </div>

            {/* Mission Planner */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    Mission Planner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FuelGauge
                    performance={{
                      currentMode: pipelineState?.currentMode || 'Hover',
                      totalPowerMW: pipelineState?.P_avg || 83.3,
                      zeta: pipelineState?.zeta || 0.032,
                      tsRatio: pipelineState?.TS_ratio || 4102.74,
                      fordRomanCompliance: pipelineState?.fordRomanCompliance || 0.8,
                      natarioConstraint: pipelineState?.natarioConstraint || 0.92,
                      curvatureLimit: pipelineState?.curvatureLimit || 1e16,
                      lyPerHourAtCurrentDuty: (() => {
                        const vLyPerHour = computeEffectiveLyPerHour(
                          pipelineState?.currentMode || 'Hover',
                          pipelineState?.dutyCycle || 0.14,
                          pipelineState?.gammaGeo || 26,
                          pipelineState?.qCavity || 1e9,
                          pipelineState?.zeta || 0.032,
                          pipelineState?.TS_ratio || 4102.74
                        );
                        const hoursPerLy = vLyPerHour > 0 ? 1 / vLyPerHour : Infinity;
                        return isFinite(hoursPerLy) ? (pipelineState?.P_avg || 83.3) * hoursPerLy : Infinity;
                      })(),
                      energyPerCycleJ: (() => {
                        const cyclesPerSec = 15.0 * 1e9;
                        return cyclesPerSec > 0 ? ((pipelineState?.P_avg || 83.3) * 1e6) / cyclesPerSec : Infinity;
                      })(),
                      vEffLyPerHour: (mode, duty) => computeEffectiveLyPerHour(
                        mode, 
                        duty, 
                        pipelineState?.gammaGeo || 26,
                        pipelineState?.qCavity || 1e9,
                        pipelineState?.zeta || 0.032,
                        pipelineState?.TS_ratio || 4102.74
                      )
                    } as HelixPerf}
                  />
                </CardContent>
              </Card>

              {/* HELIX-CORE Chat */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-cyan-400" />
                    HELIX-CORE Terminal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="chat">AI Chat</TabsTrigger>
                      <TabsTrigger value="logs">System Logs</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="chat" className="space-y-3">
                      <ScrollArea className="h-64 bg-slate-950 rounded-lg p-3" ref={scrollRef}>
                        <div className="space-y-3">
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`space-y-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                              <div className={`inline-block max-w-[80%] p-3 rounded-lg text-sm ${
                                msg.role === 'user' 
                                  ? 'bg-cyan-600/20 text-cyan-100' 
                                  : msg.role === 'system'
                                  ? 'bg-purple-600/20 text-purple-100'
                                  : 'bg-slate-800 text-slate-100'
                              }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                {msg.functionCall && (
                                  <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
                                    <p className="text-yellow-400">Function: {msg.functionCall.name}</p>
                                    <pre className="mt-1 text-slate-300">{JSON.stringify(msg.functionCall.result, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                {msg.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                          {isProcessing && (
                            <div className="text-center">
                              <Badge variant="outline" className="animate-pulse">
                                <Cpu className="w-3 h-3 mr-1" />
                                Processing...
                              </Badge>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      
                      <div className="flex gap-2">
                        <Input
                          value={commandInput}
                          onChange={(e) => setCommandInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendCommand()}
                          placeholder="Ask HELIX-CORE..."
                          className="bg-slate-950 border-slate-700 text-slate-100"
                          disabled={isProcessing}
                        />
                        <Button 
                          onClick={sendCommand} 
                          disabled={isProcessing || !commandInput.trim()}
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="logs" className="space-y-3">
                      <ScrollArea className="h-64 bg-slate-950 rounded-lg p-3">
                        <div className="font-mono text-xs space-y-1">
                          {mainframeLog.map((log, i) => (
                            <div key={i} className={
                              log.includes('[FUNCTION]') ? 'text-yellow-400' :
                              log.includes('[RESULT]') ? 'text-purple-400' :
                              log.includes('[TILE]') ? 'text-cyan-400' :
                              log.includes('[DATA]') ? 'text-blue-400' :
                              'text-green-400'
                            }>
                              {log}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Luma Whisper Overlay */}
      <LumaOverlayHost />
    </>
  );
}