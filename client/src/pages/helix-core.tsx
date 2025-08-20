import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { useMetrics } from "@/hooks/use-metrics";
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

import { publish } from "@/lib/luma-bus";
import { CasimirTileGridPanel } from "@/components/CasimirTileGridPanel";
import { Tooltip } from "@/components/ui/tooltip";
import AmplificationPanel from "@/components/AmplificationPanel";
import { PhysicsFieldSampler } from "@/components/PhysicsFieldSampler";
import { ShiftVectorPanel } from "@/components/ShiftVectorPanel";
import { CurvatureKey } from "@/components/CurvatureKey";
import { ShellOutlineVisualizer } from "@/components/ShellOutlineVisualizer";

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



interface EnergyPipelineState {
  currentMode?: string;
  dutyCycle?: number;
  sectorStrobing?: number;
  gammaGeo?: number;
  qSpoilingFactor?: number;
  qCavity?: number;
  P_avg?: number;
  zeta?: number;
  TS_ratio?: number;
  fordRomanCompliance?: string;
  natarioConstraint?: string;
  curvatureLimit?: string;
  U_cycle?: number;
  U_static?: number;
  U_geo?: number;
  U_Q?: number;
  P_loss_raw?: number;
  N_tiles?: number;
  modulationFreq_GHz?: number;
}

interface SystemMetrics {
  activeSectors: number;     // NEW: active sectors (1, 400, etc.)
  totalSectors: number;      // NEW: total sectors (400)
  activeTiles: number;       // Updated: actual tile count
  totalTiles: number;
  tilesPerSector: number;    // NEW: tiles per sector
  sectorStrobing: number;    // Added for strobing display
  currentSector: number;     // NEW: physics-timed sweep index
  strobeHz: number;          // NEW: sector sweep frequency
  sectorPeriod_ms: number;   // NEW: time per sector
  energyOutput: number;
  exoticMass: number;
  fordRoman: {
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
  shiftVector?: {
    epsilonTilt: number;
    betaTiltVec: [number, number, number];
  };
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
  // Generate logical sector list (no physics here)
  const SECTORS = useMemo(
    () => Array.from({ length: 400 }, (_, i) => ({ id: `S${i + 1}` })), []
  );

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
  
  // Fade memory for trailing glow (per-sector intensity 0..1)
  const [trail, setTrail] = useState<number[]>(() => Array(400).fill(0));
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
  
  // Get metrics data for hull geometry
  const { metrics: hullMetrics } = useMetrics();
  
  // Update solar system positions periodically
  useEffect(() => {
    if (mapMode === "solar") {
      const updateSolarPositions = () => {
        setSolarBodies(solarToBodies(computeSolarXY()));
      };
      
      const interval = setInterval(updateSolarPositions, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [mapMode]);
  
  // Update route calculation positions every 5 seconds and test Luma whisper
  useEffect(() => {
    const interval = setInterval(() => setSolarTick(t => t + 1), 5000);
    
    // Test Luma whisper on first load
    const timer = setTimeout(() => {
      publish("luma:whisper", { text: "HELIX-CORE initialized. Welcome to the cosmic bridge." });
    }, 2000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);
  
  // Use centralized energy pipeline
  const { data: pipelineState } = useEnergyPipeline();
  const switchMode = useSwitchMode();
  
  // Type-safe access to pipeline state
  const pipeline = pipelineState as EnergyPipelineState;
  
  // Fetch system metrics
  const { data: systemMetrics, refetch: refetchMetrics } = useQuery<SystemMetrics>({
    queryKey: ['/api/helix/metrics'],
    refetchInterval: 5000 // Update every 5 seconds
  });

  // Unified, defensive mode fallback for the whole page
  const effectiveMode = (
    pipeline?.currentMode ??
    (systemMetrics as any)?.currentMode ??
    'hover'
  ) as 'standby' | 'hover' | 'cruise' | 'emergency';

  // 🔑 Mode version tracking - force WarpVisualizer remount on mode changes  
  const [modeVersion, setModeVersion] = useState(0);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Send command to HELIX-CORE
  const sendCommand = async () => {
    if (!commandInput.trim() || isProcessing) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: commandInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setCommandInput("");
    setIsProcessing(true);
    
    try {
      const response = await apiRequest('POST', '/api/helix/command', {
        messages: chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })).concat([{ 
          role: 'user' as const, 
          content: commandInput,
          timestamp: new Date()
        }])
      });
      
      const responseData = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseData.message.content,
        timestamp: new Date()
      };
      
      if (responseData.functionResult) {
        assistantMessage.functionCall = {
          name: responseData.message.function_call.name,
          result: responseData.functionResult
        };
        
        // Log function calls
        setMainframeLog(prev => [...prev, 
          `[FUNCTION] ${responseData.message.function_call.name}(${JSON.stringify(JSON.parse(responseData.message.function_call.arguments))})`,
          `[RESULT] ${JSON.stringify(responseData.functionResult)}`
        ]);
        
        // Refresh metrics if a pulse was executed
        if (responseData.message.function_call.name === 'pulse_sector') {
          refetchMetrics();
        }
      }
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      toast({
        title: "Command Error",
        description: error instanceof Error ? error.message : "Failed to process command",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Physics-timed sector sweep for UI animation
  useEffect(() => {
    if (!systemMetrics) return;

    const S = Math.max(1, systemMetrics.sectorStrobing || 1);
    const idx = (systemMetrics.currentSector ?? 0) % S;

    // Decay all sectors
    setTrail(prev => prev.map(v => Math.max(0, v * 0.90)));
    // Energize current sector
    setTrail(prev => {
      const copy = prev.slice();
      copy[idx] = 1; // full bright
      return copy;
    });
  }, [systemMetrics?.currentSector, systemMetrics?.sectorStrobing]);

  // Sync 3D engine with strobing state
  useEffect(() => {
    if (!systemMetrics) return;
    (window as any).setStrobingState?.({
      sectorCount: systemMetrics.sectorStrobing,
      currentSector: systemMetrics.currentSector
    });
  }, [systemMetrics?.sectorStrobing, systemMetrics?.currentSector]);

  // Color mapper (blue→active; red if ζ breach)
  const sectorColor = (i: number) => {
    const ζ = systemMetrics?.fordRoman?.value ?? 0.0;
    const limitBreach = ζ >= 1.0;
    const v = trail[i] ?? 0;
    if (limitBreach) {
      return `rgba(239, 68, 68, ${0.2 + 0.8*v})`; // red
    }
    return `rgba(34, 197, 94, ${0.2 + 0.8*v})`; // green
  };

  // Handle tile click
  const handleTileClick = async (sectorId: string) => {
    setSelectedSector(sectorId);
    const sectorIndex = parseInt(sectorId.replace('S', '')) - 1;
    
    setMainframeLog(prev => [...prev, 
      `[TILE] Selected ${sectorId}`,
      `[DATA] Sector Index: ${sectorIndex}, Fade: ${trail[sectorIndex]?.toFixed(3) || '0.000'}`
    ]);
    
    // In manual mode, pulse the sector
    if (activeMode === "manual") {
      setIsProcessing(true);
      try {
        const command = `Pulse sector ${sectorId} with 1 nm gap`;
        const userMessage: ChatMessage = {
          role: 'user',
          content: command,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, userMessage]);
        
        const response = await apiRequest('POST', '/api/helix/command', {
          messages: chatMessages.concat({ role: 'user', content: command })
        });
        
        const responseData = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: responseData.message.content,
          timestamp: new Date()
        };
        
        if (responseData.functionResult) {
          assistantMessage.functionCall = {
            name: responseData.message.function_call.name,
            result: responseData.functionResult
          };
          setMainframeLog(prev => [...prev, 
            `[MANUAL] ${sectorId} pulsed: Energy=${responseData.functionResult.energy?.toExponential(2)} J`
          ]);
          refetchMetrics();
        }
        
        setChatMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        toast({
          title: "Manual Pulse Error",
          description: error instanceof Error ? error.message : "Failed to pulse sector",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
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
            <Link href="/why">
              <Badge variant="outline" className="cursor-pointer border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors">
                <Activity className="w-3 h-3 mr-1" />
                Why
              </Badge>
            </Link>
            <Link href="/bridge">
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Bridge
              </Button>
            </Link>
          </div>
        </div>

        {/* === Quick Operational Mode Switch (global) === */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: 'standby',   label: 'Standby',   hint: 'Field idle' },
              { key: 'hover',     label: 'Hover',     hint: 'Gentle bulge' },
              { key: 'cruise',    label: 'Cruise',    hint: 'Coherent 400× strobe' },
              { key: 'emergency', label: 'Emergency', hint: 'Max response' },
            ] as const).map(m => {
              const isActive = effectiveMode === m.key;
              return (
                <Button
                  key={m.key}
                  variant={isActive ? 'default' : 'outline'}
                  className={`font-mono ${isActive ? 'bg-cyan-600 text-white' : 'bg-slate-900'}`}
                  onClick={() => {
                    if (!isActive) {
                      switchMode.mutate(m.key as any);
                      setModeVersion(v => v + 1); // force visualizer remount for instant change
                      setMainframeLog(prev => [...prev, `[MODE] Quick switch → ${m.key}`]);
                    }
                  }}
                >
                  {m.label}
                  <span className="ml-2 text-xs opacity-70">{m.hint}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* ====== HERO: Natário Warp Bubble (full width) ====== */}
        <Card className="bg-slate-900/50 border-slate-800 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Atom className="w-5 h-5 text-cyan-400" />
              {MAINFRAME_ZONES.WARP_VISUALIZER}
            </CardTitle>
            <CardDescription>
              3D spacetime curvature — live, mode-aware, and physically grounded
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Natário Warp Bubble Visualizer */}
            {(() => {
              const G = 9.80665, c = 299792458;
              const hull = (hullMetrics && hullMetrics.hull) ? {
                ...hullMetrics.hull,
                a: hullMetrics.hull.a ?? hullMetrics.hull.Lx_m / 2,
                b: hullMetrics.hull.b ?? hullMetrics.hull.Ly_m / 2,
                c: hullMetrics.hull.c ?? hullMetrics.hull.Lz_m / 2
              } : { Lx_m: 1007, Ly_m: 264, Lz_m: 173, a: 503.5, b: 132, c: 86.5 };

              const gTargets: Record<string, number> = {
                hover: 0.10*G, cruise: 0.05*G, emergency: 0.30*G, standby: 0
              };
              const mode = (pipeline?.currentMode ?? 'hover').toLowerCase();
              const gTarget = gTargets[mode] ?? 0;
              const R_geom = Math.cbrt(hull.a * hull.b * hull.c);
              const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (c*c)));
              const betaTiltVec = [0, -1, 0] as [number, number, number];

              return (
                <div className="rounded-lg overflow-hidden bg-slate-950">
                  <WarpVisualizer
                    key={`mode-${effectiveMode}-${pipeline?.sectorStrobing || 1}-${pipeline?.dutyCycle || 0.14}-v${modeVersion}`}
                    parameters={{
                      dutyCycle: pipeline?.dutyCycle || 0.14,
                      g_y: pipeline?.gammaGeo || 26,
                      cavityQ: pipeline?.qCavity || 1e9,
                      sagDepth_nm: pipeline?.sag_nm || 16,
                      tsRatio: pipeline?.TS_ratio || 4102.74,
                      powerAvg_MW: pipeline?.P_avg || 83.3,
                      exoticMass_kg: pipeline?.M_exotic || 1405,
                      currentMode: effectiveMode,
                      sectorStrobing: pipeline?.sectorStrobing || 1,
                      qSpoilingFactor: pipeline?.qSpoilingFactor || 1,
                      gammaVanDenBroeck: pipeline?.gammaVanDenBroeck || 2.86e5,
                      hull: (hullMetrics && hullMetrics.hull) ? {
                        ...hullMetrics.hull,
                        a: hullMetrics.hull.a ?? hullMetrics.hull.Lx_m / 2,
                        b: hullMetrics.hull.b ?? hullMetrics.hull.Ly_m / 2,
                        c: hullMetrics.hull.c ?? hullMetrics.hull.Lz_m / 2
                      } : {
                        Lx_m: 1007, Ly_m: 264, Lz_m: 173,
                        a: 503.5, b: 132, c: 86.5,
                        wallThickness_m: 6.0
                      },
                      wall: { w_norm: 0.016 },
                      gridScale: 1.6,
                      epsilonTilt: systemMetrics?.shiftVector?.epsilonTilt ?? 0.012,
                      betaTiltVec: (systemMetrics?.shiftVector?.betaTiltVec ?? [0, -1, 0]) as [number, number, number],
                      wallWidth_m: 6.0,
                      shift: {
                        epsilonTilt: systemMetrics?.shiftVector?.epsilonTilt ?? 0.012,
                        betaTiltVec: (systemMetrics?.shiftVector?.betaTiltVec ?? [0, -1, 0]) as [number, number, number],
                        gTarget: 0.5, R_geom: 86.5,
                        gEff_check: ((systemMetrics?.shiftVector?.epsilonTilt ?? 0.012) * 86.5 * 86.5) / 86.5
                      }
                    }}
                  />
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* ====== SHELL OUTLINE VIEWER (wireframe surfaces) ====== */}
        <Card className="bg-slate-900/50 border-slate-800 mb-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Warp Bubble • Shell Outline (ρ=1±Δ)
            </CardTitle>
            <CardDescription>
              Wireframe of inner/center/outer Natário wall (ellipsoidal), with interior shift vector.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShellOutlineVisualizer
              parameters={{
                hull: (hullMetrics && hullMetrics.hull) ? {
                  a: hullMetrics.hull.a ?? hullMetrics.hull.Lx_m / 2,
                  b: hullMetrics.hull.b ?? hullMetrics.hull.Ly_m / 2,
                  c: hullMetrics.hull.c ?? hullMetrics.hull.Lz_m / 2
                } : {
                  a: 0.42, b: 0.11, c: 0.09 // normalized scene units
                },
                wallWidth: 0.06,
                epsilonTilt: systemMetrics?.shiftVector?.epsilonTilt ?? 0.012,
                betaTiltVec: (systemMetrics?.shiftVector?.betaTiltVec ?? [0,-1,0]) as [number,number,number],
                // NEW: mode coupling from live pipeline data
                mode: effectiveMode,
                dutyCycle: pipeline?.dutyCycle ?? 0.14,
                sectors: pipeline?.sectorStrobing ?? 1,
                gammaGeo: pipeline?.gammaGeo ?? 26,
                qSpoil: pipeline?.qSpoilingFactor ?? 1.0,
                qCavity: pipeline?.qCavity ?? 1e9,
              }}
            />
          </CardContent>
        </Card>

        {/* ====== OPERATIONAL MODES / ENERGY CONTROL (below hero) ====== */}
        <Card className="bg-slate-900/50 border-slate-800 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              {MAINFRAME_ZONES.ENERGY_PANEL}
            </CardTitle>
            <CardDescription>Live mode switch + power, mass & status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Operational Mode Selector */}
              <div className="space-y-2">
                <Label className="text-slate-200">Operational Mode</Label>
                <Select 
                  value={pipeline?.currentMode || 'hover'}
                  onValueChange={(mode) => {
                    switchMode.mutate(mode as any);
                    setMainframeLog(prev => [...prev, `[MODE] Switching to ${mode} mode...`]);
                  }}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODE_CONFIGS).map(([mode, config]) => (
                      <SelectItem key={mode} value={mode}>
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{config.name}</span>
                          <span className="text-xs text-slate-500">({config.powerTarget} MW)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pipeline && (
                  <p className="text-xs text-slate-400">{MODE_CONFIGS[pipeline.currentMode]?.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 rounded-lg">
                  <p className="text-xs text-slate-400">Active Tiles (Energized)</p>
                  <p className="text-lg font-mono text-cyan-400">{systemMetrics?.activeTiles.toLocaleString() || '2,800,000'}</p>
                  {systemMetrics?.sectorStrobing && (
                    <p className="text-xs text-slate-500 mt-1">
                      {systemMetrics.sectorStrobing} sectors strobing
                    </p>
                  )}
                </div>
                <div className="p-3 bg-slate-950 rounded-lg">
                  <p className="text-xs text-slate-400">Energy Output</p>
                  <p className="text-lg font-mono text-yellow-400">{pipeline?.P_avg?.toFixed(1) || systemMetrics?.energyOutput || 83.3} MW</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 rounded-lg">
                  <p className="text-xs text-slate-400">Exotic Mass</p>
                  <p className="text-lg font-mono text-purple-400">{pipeline?.M_exotic?.toFixed(0) || systemMetrics?.exoticMass || 1405} kg</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg">
                  <p className="text-xs text-slate-400">System Status</p>
                  <p className="text-lg font-mono text-green-400">{pipeline?.overallStatus || systemMetrics?.overallStatus || 'NOMINAL'}</p>
                </div>
              </div>

              {/* Show current pipeline parameters */}
              {pipeline && (
                <div className="p-3 bg-slate-950 rounded-lg text-xs font-mono">
                  <p className="text-slate-400 mb-1">Pipeline Parameters:</p>
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <div>Duty: {(pipeline.dutyCycle * 100).toFixed(1)}%</div>
                    <div>Sectors: {pipeline.sectorStrobing}</div>
                    <div>Q-Spoil: {pipeline.qSpoilingFactor?.toFixed(3)}</div>
                    <Tooltip
                      label={
                        <div className="space-y-1">
                          <div className="font-semibold">γ<sub>VdB</sub> (Van den Broeck pocket amplification)</div>
                          <p>
                            From Alcubierre's metric modified by Van den Broeck — the "folded pocket"
                            lets a meter-scale cabin sit inside a kilometer-scale effective bubble
                            without paying the bubble's full energy cost.
                          </p>
                          <p className="opacity-80">
                            This is a geometry selection, not an operational setting. It doesn't vary
                            with duty cycle or strobing sectors.
                          </p>
                        </div>
                      }
                    >
                      <span className="cursor-help underline decoration-dotted">
                        γ<sub>VdB</sub>: {((pipelineState as any).gammaVanDenBroeck || 286000).toExponential(1)}
                      </span>
                    </Tooltip>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="modulation" className="text-slate-200">Modulation Frequency</Label>
                <div className="flex gap-2">
                  <Input 
                    id="modulation"
                    type="number" 
                    value={modulationFrequency}
                    onChange={(e) => setModulationFrequency(Number(e.target.value))}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                  />
                  <span className="flex items-center text-sm text-slate-400">GHz</span>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600"
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    const command = `Simulate a full pulse cycle at ${modulationFrequency} GHz`;
                    const userMessage: ChatMessage = {
                      role: 'user',
                      content: command,
                      timestamp: new Date()
                    };
                    setChatMessages(prev => [...prev, userMessage]);
                    
                    const response = await apiRequest('POST', '/api/helix/command', {
                      messages: chatMessages.concat({ role: 'user', content: command })
                    });
                    
                    const responseData = await response.json();
                    const assistantMessage: ChatMessage = {
                      role: 'assistant',
                      content: responseData.message.content,
                      timestamp: new Date()
                    };
                    
                    if (responseData.functionResult) {
                      assistantMessage.functionCall = {
                        name: responseData.message.function_call.name,
                        result: responseData.functionResult
                      };
                      setMainframeLog(prev => [...prev, 
                        `[PULSE] ${responseData.functionResult.log || 'Cycle complete'}`
                      ]);
                      refetchMetrics();
                    }
                    
                    setChatMessages(prev => [...prev, assistantMessage]);
                  } catch (error) {
                    toast({
                      title: "Pulse Sequence Error",
                      description: error instanceof Error ? error.message : "Failed to execute",
                      variant: "destructive"
                    });
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
              >
                Execute Pulse Sequence
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ====== SECONDARY GRID (rest of the panels) ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: Compliance, Amplification, Shift Vector */}
          <div className="space-y-4">
            {/* Metric Compliance HUD */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-green-400" />
                  {MAINFRAME_ZONES.COMPLIANCE_HUD}
                </CardTitle>
                <CardDescription>
                  GR condition monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Ford-Roman Inequality</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">ζ = {pipelineState?.zeta?.toFixed(3) || systemMetrics?.fordRoman.value.toFixed(3) || '0.032'}</span>
                      <Badge className={`${(pipelineState?.fordRomanCompliance || systemMetrics?.fordRoman.status === 'PASS') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {pipelineState?.fordRomanCompliance ? 'PASS' : systemMetrics?.fordRoman.status || 'PASS'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Natário Zero-Expansion</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">∇·ξ = {systemMetrics?.natario.value || 0}</span>
                      <Badge className={`${(pipelineState?.natarioConstraint || systemMetrics?.natario.status === 'VALID') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {pipelineState?.natarioConstraint ? 'VALID' : systemMetrics?.natario.status || 'VALID'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Curvature Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">R {'<'} {(pipelineState && Math.abs(pipelineState.U_cycle) / (3e8 * 3e8))?.toExponential(0) || systemMetrics?.curvatureMax.toExponential(0) || '1e-21'}</span>
                      <Badge className={`${pipelineState?.curvatureLimit ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {pipelineState?.curvatureLimit ? 'SAFE' : 'WARN'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Time-Scale Separation</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">TS = {pipelineState?.TS_ratio?.toFixed(1) || systemMetrics?.timeScaleRatio.toFixed(1) || '4102.7'}</span>
                      <Badge className={`${(pipelineState && pipelineState.TS_ratio < 1) ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {(pipelineState && pipelineState.TS_ratio < 1) ? 'SAFE' : 'CHECK'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Show pipeline calculation details */}
                {pipelineState && (
                  <div className="mt-4 p-3 bg-slate-950 rounded-lg">
                    <p className="text-xs text-slate-400 mb-2">Energy Pipeline Values:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>U_static: {pipelineState.U_static.toExponential(2)} J</div>
                      <div>U_geo: {pipelineState.U_geo.toExponential(2)} J</div>
                      <div>U_Q: {pipelineState.U_Q.toExponential(2)} J</div>
                      <div>U_cycle: {pipelineState.U_cycle.toExponential(2)} J</div>
                      <div>P_loss: {pipelineState.P_loss_raw.toFixed(3)} W/tile</div>
                      <div>N_tiles: {pipelineState.N_tiles.toExponential(2)}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Amplification Panel */}
            <AmplificationPanel />

            {/* Curvature Key */}
            <CurvatureKey />

            {/* Shift Vector • Interior Gravity */}
            <ShiftVectorPanel
              mode={pipelineState?.currentMode || "hover"}
              shift={systemMetrics?.shiftVector}
            />

          </div>

          {/* Middle Column - Casimir Tile Grid & Physics Field */}
          <div className="space-y-4">
            {/* Casimir Tile Grid - Canvas Component */}
            {systemMetrics && (
              <CasimirTileGridPanel
                metrics={{
                  totalTiles: systemMetrics.totalTiles,
                  sectorStrobing: systemMetrics.sectorStrobing,
                  totalSectors: systemMetrics.totalSectors,
                  tilesPerSector: systemMetrics.tilesPerSector,
                  currentSector: systemMetrics.currentSector,
                  strobeHz: systemMetrics.strobeHz,
                  sectorPeriod_ms: systemMetrics.sectorPeriod_ms,
                  overallStatus: systemMetrics.overallStatus as any,
                }}
                width={320}
                height={170}
              />
            )}

            {/* Physics Field Sampler for Validation */}
            <PhysicsFieldSampler />

            {/* Resonance Scheduler */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  {MAINFRAME_ZONES.RESONANCE_SCHEDULER}
                </CardTitle>
                <CardDescription>
                  Strobing pulse timeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Pulse Timeline Visualization */}
                  <div className="h-32 bg-slate-950 rounded-lg p-4">
                    <div className="h-full flex items-end justify-between gap-1">
                      {Array.from({ length: 20 }, (_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                          style={{ 
                            height: `${Math.sin(i * 0.3) * 50 + 50}%`,
                            opacity: 0.8 + Math.sin(i * 0.5) * 0.2
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 bg-slate-950 rounded text-center">
                      <p className="text-xs text-slate-400">Duty Cycle</p>
                      <p className="font-mono text-slate-100">{pipelineState ? (pipelineState.dutyCycle * 100).toFixed(1) : '14'}%</p>
                    </div>
                    <div className="p-2 bg-slate-950 rounded text-center">
                      <p className="text-xs text-slate-400">Sectors</p>
                      <p className="font-mono text-slate-100">{pipelineState?.sectorStrobing || 1}</p>
                    </div>
                    <div className="p-2 bg-slate-950 rounded text-center">
                      <p className="text-xs text-slate-400">Frequency</p>
                      <p className="font-mono text-slate-100">{pipelineState?.modulationFreq_GHz || 15} GHz</p>
                    </div>
                  </div>
                  
                  {/* Show current mode configuration */}
                  {pipelineState && (
                    <div className="mt-3 p-3 bg-slate-950 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Current Mode: {MODE_CONFIGS[pipelineState.currentMode]?.name}</p>
                      <p className="text-xs text-slate-300">{MODE_CONFIGS[pipelineState.currentMode]?.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Terminal & Inspector */}
          <div className="space-y-4">
            {/* Log + Document Terminal */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-orange-400" />
                  {MAINFRAME_ZONES.LOG_TERMINAL}
                </CardTitle>
                <CardDescription>
                  Mainframe command interface
                </CardDescription>
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

            {/* Operations Toolbar (moved here) */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Operations Toolbar
                </CardTitle>
                <CardDescription>
                  Quick actions: auto-duty sequence, diagnostics sweep, and theory playback.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {/* Auto-Duty Mode */}
                  <Button 
                    variant={activeMode === "auto" ? "default" : "outline"}
                    onClick={async () => {
                      setActiveMode("auto");
                      setIsProcessing(true);
                      try {
                        const command = "Execute auto-duty pulse sequence across all 400 sectors";
                        const userMessage: ChatMessage = {
                          role: 'user',
                          content: command,
                          timestamp: new Date()
                        };
                        setChatMessages(prev => [...prev, userMessage]);

                        const response = await apiRequest('POST', '/api/helix/command', {
                          messages: chatMessages.concat({ role: 'user', content: command })
                        });
                        const responseData = await response.json();

                        const assistantMessage: ChatMessage = {
                          role: 'assistant',
                          content: responseData.message.content,
                          timestamp: new Date()
                        };

                        if (responseData.functionResult) {
                          assistantMessage.functionCall = {
                            name: responseData.message.function_call?.name ?? 'auto_duty',
                            result: responseData.functionResult
                          };
                          setMainframeLog(prev => [...prev, 
                            `[AUTO-DUTY] ${responseData.functionResult.log || 'Sequence initiated'}`
                          ]);
                          // refresh metrics so the whole page updates
                          refetchMetrics();
                        }

                        setChatMessages(prev => [...prev, assistantMessage]);
                      } catch (error) {
                        toast({
                          title: "Auto-Duty Error",
                          description: error instanceof Error ? error.message : "Failed to execute",
                          variant: "destructive"
                        });
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    className="flex items-center gap-2"
                    disabled={isProcessing}
                  >
                    <Brain className="w-4 h-4" />
                    Auto-Duty Mode
                  </Button>

                  {/* Diagnostics Mode */}
                  <Button 
                    variant={activeMode === "diagnostics" ? "default" : "outline"}
                    onClick={async () => {
                      setActiveMode("diagnostics");
                      setIsProcessing(true);
                      try {
                        const command = "Run comprehensive diagnostics scan on all tile sectors";
                        const userMessage: ChatMessage = {
                          role: 'user',
                          content: command,
                          timestamp: new Date()
                        };
                        setChatMessages(prev => [...prev, userMessage]);

                        const response = await apiRequest('POST', '/api/helix/command', {
                          messages: chatMessages.concat({ role: 'user', content: command })
                        });
                        const responseData = await response.json();

                        const assistantMessage: ChatMessage = {
                          role: 'assistant',
                          content: responseData.message.content,
                          timestamp: new Date()
                        };

                        if (responseData.functionResult) {
                          assistantMessage.functionCall = {
                            name: responseData.message.function_call?.name ?? 'diagnostics',
                            result: responseData.functionResult
                          };
                          setMainframeLog(prev => [...prev, 
                            `[DIAGNOSTICS] System Health: ${responseData.functionResult.systemHealth ?? 'OK'}`
                          ]);
                          // optional: refresh metrics
                          refetchMetrics();
                        }

                        setChatMessages(prev => [...prev, assistantMessage]);
                      } catch (error) {
                        toast({
                          title: "Diagnostics Error",
                          description: error instanceof Error ? error.message : "Failed to run scan",
                          variant: "destructive"
                        });
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    className="flex items-center gap-2"
                    disabled={isProcessing}
                  >
                    <Gauge className="w-4 h-4" />
                    Diagnostics
                  </Button>

                  {/* Theory Playback */}
                  <Button 
                    variant={activeMode === "theory" ? "default" : "outline"}
                    onClick={() => {
                      setActiveMode("theory");
                      setMainframeLog(prev => [...prev, 
                        "[THEORY] Loading Needle Hull Mark 1 documentation..."
                      ]);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Atom className="w-4 h-4" />
                    Theory Playback
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Duplicate Natário Warp Bubble visualizer removed; hero instance is the source of truth */}
            
            {/* Mission Fuel / Range Gauge */}
            <FuelGauge
              mode={pipelineState?.currentMode || 'Hover'}
              powerMW={pipelineState?.P_avg || 83.3}
              zeta={pipelineState?.zeta || 0.032}
              tsRatio={pipelineState?.TS_ratio || 4102.74}
              frOk={pipelineState?.fordRomanCompliance || true}
              natarioOk={pipelineState?.natarioConstraint || true}
              curvatureOk={pipelineState?.curvatureLimit || true}
              freqGHz={15.0}
              duty={pipelineState?.dutyCycle || 0.14}
              gammaGeo={pipelineState?.gammaGeo || 26}
              qFactor={pipelineState?.qCavity || 1e9}
              pMaxMW={120}
            />

            {/* Trip Player */}
            <TripPlayer
              plan={{ 
                distanceLy: 0.5, 
                cruiseDuty: 0.14, 
                cruiseMode: "Cruise",
                hoverMode: "Hover",
                stationKeepHours: 2 
              }}
              getState={() => ({
                zeta: pipelineState?.zeta || 0.032,
                tsRatio: pipelineState?.TS_ratio || 4102.74,
                powerMW: pipelineState?.P_avg || 83.3,
                freqGHz: 15.0
              })}
              setMode={(mode) => {
                if (switchMode) {
                  switchMode.mutate(mode as any);
                  // Bump mode version to force WarpVisualizer remount
                  setModeVersion(v => v + 1);
                  // Luma whisper on mode change
                  const whispers = {
                    'Hover': "Form first. Speed follows.",
                    'Cruise': "Timing matched. Take the interval; apply thrust.",
                    'Emergency': "Breathe once. Choose the useful distance.",
                    'Standby': "Meet change with correct posture. The rest aligns."
                  };
                  publish("luma:whisper", { text: whispers[mode as keyof typeof whispers] || "Configuration updated." });
                }
              }}
              setDuty={(duty) => {
                // Note: In real implementation, would need a setDuty function from energy pipeline
                console.log('Setting duty:', duty);
              }}
              onTick={(phase, t) => {
                // Optional: Log trip progress
                console.log(`Trip phase: ${phase}, time: ${t}s`);
              }}
            />

            {/* Mission Planner - Galactic Maps */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Mission Planner</CardTitle>
                <div className="flex items-center space-x-4">
                  <Select value={mapMode} onValueChange={(v: "galactic" | "solar") => {
                    setMapMode(v);
                    localStorage.setItem("helix-mapMode", v); // Persist preference
                    // Reset route when switching modes
                    if (v === "solar") {
                      setRoute(["EARTH", "SATURN", "SUN"]);
                      publish("luma:whisper", { text: "Solar navigation initialized. Near-space trajectory computed." });
                    } else {
                      setRoute(["SOL", "ORI_OB1", "VEL_OB2", "SOL"]);
                      publish("luma:whisper", { text: "Galactic coordinates engaged. Interstellar passage mapped." });
                    }
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="galactic">Galactic (pc)</SelectItem>
                      <SelectItem value="solar">Solar (AU)</SelectItem>
                    </SelectContent>
                  </Select>
                  {mapMode === "galactic" && (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="deep-zoom-toggle" className="text-xs">High-Res</Label>
                      <Switch
                        id="deep-zoom-toggle"
                        checked={useDeepZoom}
                        onCheckedChange={setUseDeepZoom}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {mapMode === "solar" ? (
                  <div className="w-full overflow-hidden rounded-md bg-slate-950 border border-slate-800">
                    {/* Constrained container so the canvas can't blow past its panel */}
                    <div className="mx-auto max-w-[720px]">
                      <SolarMap
                        key={`solar-${720}x${360}`}   // force a single mounted instance
                        /* Slightly smaller, stable aspect to fit the panel */
                        width={720}
                        height={360}
                        routeIds={route}
                        /* Auto-fit so Earth & Saturn BOTH appear within the smaller panel */
                        fitToIds={["EARTH","SATURN"]}
                        fitMarginPx={28}
                        /* Clean props to avoid conflicts */
                        centerOnId={undefined}
                        centerBetweenIds={undefined}
                        onPickBody={(id) => {
                          setRoute(r => r.length ? [...r.slice(0,-1), id, r[r.length-1]] : [id]);
                          publish("luma:whisper", { text: "Waypoint selected. Route updated." });
                        }}
                      />
                    </div>
                  </div>
                ) : !galaxyCalibration ? (
                  <div className="h-40 grid place-items-center text-xs text-slate-400">
                    Loading galactic coordinate system…
                  </div>
                ) : useDeepZoom ? (
                  <div className="relative">
                    <GalaxyDeepZoom
                      dziUrl="/galaxy_tiles.dzi"
                      width={800}
                      height={400}
                      onViewerReady={setDeepZoomViewer}
                    />
                    {deepZoomViewer && (
                      <GalaxyOverlays
                        viewer={deepZoomViewer}
                        labels={[]} // Will load from JSON when available
                        bodies={BODIES}
                        routeIds={route}
                        originPx={galaxyCalibration.originPx}
                        pxPerPc={galaxyCalibration.pxPerPc}
                        onBodyClick={(id) => {
                          setRoute(r => r.length ? [...r.slice(0,-1), id, r[r.length-1]] : [id]);
                          publish("luma:whisper", { text: "Stellar target acquired. Course adjusted." });
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <GalaxyMapPanZoom
                    imageUrl="/galaxymap.png"
                    bodies={BODIES}
                    routeIds={route}
                    onPickBody={(id) => {
                      setRoute(r => r.length ? [...r.slice(0,-1), id, r[r.length-1]] : [id]);
                      publish("luma:whisper", { text: "Galactic destination set. Navigation computed." });
                    }}
                    originPx={{ x: 10123.142, y: 9480.491 }}
                    scalePxPerPc={1.6666667}
                    debug
                    width={800}
                    height={400}
                  />
                )}
                {/* Removable route chips */}
                <div className="flex flex-wrap gap-2 items-center">
                  {route.map((id, idx) => (
                    <span
                      key={`${id}-${idx}`}
                      className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-800 text-slate-100 text-xs"
                    >
                      {id}
                      {/* Protect start/end if you want (optional): e.g., idx>0 && idx<route.length-1 */}
                      <button
                        className="ml-1 rounded px-1 text-slate-300 hover:text-red-300 hover:bg-slate-700"
                        onClick={() => {
                          setRoute(r => {
                            const copy = r.slice();
                            copy.splice(idx, 1);
                            // If last node removed, keep SUN as terminus by convention (optional)
                            if (copy.length === 0) return ["SUN"];
                            return copy;
                          });
                          publish("luma:whisper", { text: `Removed waypoint: ${id}` });
                        }}
                        aria-label={`Remove ${id}`}
                        title={`Remove ${id}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {route.length === 0 && (
                    <span className="text-xs text-slate-500">
                      No waypoints yet — tap bodies on the map to add them.
                    </span>
                  )}
                </div>

                <RouteSteps 
                  bodies={mapMode === "solar" ? solarBodiesForRoutes : BODIES}
                  plan={{ waypoints: route }}
                  mode={mapMode}
                  perf={{
                    mode: pipelineState?.currentMode || 'Hover',
                    powerMW: pipelineState?.P_avg || 83.3,
                    duty: pipelineState?.dutyCycle || 0.14,
                    gammaGeo: pipelineState?.gammaGeo || 26,
                    qFactor: pipelineState?.qCavity || 1e9,
                    zeta: pipelineState?.zeta || 0.032,
                    tsRatio: pipelineState?.TS_ratio || 4102.74,
                    freqGHz: 15.0,
                    energyPerLyMWh: (() => {
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
          </div>
        </div>
      </div>


    </div>
  );
}