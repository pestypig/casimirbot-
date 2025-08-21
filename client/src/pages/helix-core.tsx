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
import { useEnergyPipeline, useSwitchMode, MODE_CONFIGS, fmtPowerUnitFromW } from "@/hooks/use-energy-pipeline";
import { useMetrics } from "@/hooks/use-metrics";
import { WarpVisualizer } from "@/components/WarpVisualizer";
import { SliceViewer } from "@/components/SliceViewer";
import { useSlicePrefs } from "@/hooks/use-slice-prefs";
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
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import AmplificationPanel from "@/components/AmplificationPanel";
import { PhysicsFieldSampler } from "@/components/PhysicsFieldSampler";
import { ShiftVectorPanel } from "@/components/ShiftVectorPanel";
import { CurvatureKey } from "@/components/CurvatureKey";
import { ShellOutlineVisualizer } from "@/components/ShellOutlineVisualizer";
import LightSpeedStrobeScale from "@/components/LightSpeedStrobeScale";
import HelixCasimirAmplifier from "@/components/HelixCasimirAmplifier";
import { HelpCircle } from "lucide-react";
import { useResonatorAutoDuty } from "@/hooks/useResonatorAutoDuty";
import ResonanceSchedulerTile from "@/components/ResonanceSchedulerTile";

// --- Safe numeric formatters ---
const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const fmt = (v: unknown, digits = 3, fallback = '—') =>
  isFiniteNumber(v) ? v.toFixed(digits) : fallback;

const fexp = (v: unknown, digits = 1, fallback = '—') =>
  isFiniteNumber(v) ? v.toExponential(digits) : fallback;

const fint = (v: unknown, fallback = '0') =>
  isFiniteNumber(v) ? Math.round(v).toLocaleString() : fallback;

const fmtPowerUnit = (mw?: number) => {
  const x = Number(mw);
  if (!Number.isFinite(x)) return "—";
  if (x >= 1) return `${x.toFixed(1)} MW`;
  if (x >= 1e-3) return `${(x * 1e3).toFixed(1)} kW`;
  return `${(x * 1e6).toFixed(1)} W`;
};

// derive instantaneous active tiles from pipeline/system state (with 1% burst duty)
const deriveActiveTiles = (
  totalTiles?: number,
  sectors?: number,
  duty?: number,
  mode?: 'standby'|'hover'|'cruise'|'emergency'
) => {
  if (!isFiniteNumber(totalTiles) || !isFiniteNumber(sectors) || sectors <= 0) return undefined;
  if (mode === 'standby' || !isFiniteNumber(duty) || duty <= 0) return 0;

  const BURST = 0.01; // local ON window
  if (sectors > 1) return Math.round((totalTiles / sectors) * BURST);
  return Math.round(totalTiles * duty * BURST);
};

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
  fordRomanCompliance?: boolean; // was string
  natarioConstraint?: boolean;   // was string
  curvatureLimit?: boolean;      // was string
  U_cycle?: number;
  U_static?: number;
  U_geo?: number;
  U_Q?: number;
  P_loss_raw?: number;
  N_tiles?: number;
  modulationFreq_GHz?: number;
  M_exotic?: number;
  gammaVanDenBroeck?: number;
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
    const stored = localStorage.getItem("helix-mapMode");
    return stored === "galactic" ? "galactic" : "solar";
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
  
  // SliceViewer responsive sizing with ResizeObserver
  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = Math.floor((e.contentBoxSize?.[0]?.inlineSize ?? e.contentRect.width) || 480);
        // Keep 2:1 aspect; cap a bit so it fits the column nicely
        const clampedW = Math.max(360, Math.min(w, 800));
        setSliceSize({ w: clampedW, h: Math.round(clampedW / 2) });
      }
    });
    const el = sliceHostRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
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

  // Auto-duty controller - automatically runs resonance scheduler on mode changes
  useResonatorAutoDuty({
    mode: (pipeline?.currentMode ?? 'hover') as 'standby'|'hover'|'cruise'|'emergency',
    duty: pipeline?.dutyCycle ?? 0.14,
    sectors: systemMetrics?.activeSectors ?? 1,
    freqGHz: pipeline?.modulationFreq_GHz ?? 15,
    onLog: (line) => {
      setMainframeLog(prev => [...prev, line].slice(-50)); // Keep last 50 lines
    },
    onAfterRun: () => {
      refetchMetrics(); // Refresh metrics after auto-duty run
    },
    enabled: true // Enable auto-duty controller
  });

  // Unified, defensive mode fallback for the whole page
  const effectiveMode = (
    pipeline?.currentMode ??
    (systemMetrics as any)?.currentMode ??
    'hover'
  ) as 'standby' | 'hover' | 'cruise' | 'emergency';

  // --- Derived mode knobs for UI (always reflect the selected mode)
  const modeCfg = MODE_CONFIGS[pipeline?.currentMode || effectiveMode] || MODE_CONFIGS.hover;

  // Prefer live pipeline values if present; otherwise fall back to the mode config
  const dutyUI = isFiniteNumber(pipeline?.dutyCycle)
    ? pipeline!.dutyCycle!
    : (modeCfg.dutyCycle ?? 0.14);

  const sectorsUI = isFiniteNumber(pipeline?.sectorStrobing)
    ? pipeline!.sectorStrobing!
    : (modeCfg.sectorStrobing ?? 1);

  const qSpoilUI = isFiniteNumber(pipeline?.qSpoilingFactor)
    ? pipeline!.qSpoilingFactor!
    : (modeCfg.qSpoilingFactor ?? 1);

  // 🔑 Mode version tracking - force WarpVisualizer remount on mode changes  
  const [modeVersion, setModeVersion] = useState(0);
  
  // 🎛️ RAF gating for smooth transitions
  const rafGateRef = useRef<number | null>(null);
  
  // SliceViewer responsive sizing
  const sliceHostRef = useRef<HTMLDivElement>(null);
  const [sliceSize, setSliceSize] = useState({ w: 480, h: 240 });

  // Slice preferences - global persistent state
  const { prefs, update } = useSlicePrefs();
  const { exposure, sigmaRange, diffMode, showContours } = prefs;

  // Calculate epsilonTilt after pipeline is available
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
  const currentMode = (pipeline?.currentMode ?? 'hover').toLowerCase();
  const gTarget = gTargets[currentMode] ?? 0;
  const R_geom = Math.cbrt(hull.a * hull.b * hull.c);
  const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (c*c)));
  
  // REMOVED: Legacy global function call - now using unified visual boost system via WarpVisualizer uniforms

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
    <TooltipProvider>
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
              3D spacetime curvature + equatorial slice viewer — live, mode-aware, and physically grounded
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Natário Warp Bubble Visualizer & Equatorial Slice Viewer */}
            {(() => {
              const betaTiltVec = [0, -1, 0] as [number, number, number];
              const hullAxes: [number, number, number] = (hullMetrics && hullMetrics.hull) ? [
                hullMetrics.hull.a ?? hullMetrics.hull.Lx_m / 2,
                hullMetrics.hull.b ?? hullMetrics.hull.Ly_m / 2,
                hullMetrics.hull.c ?? hullMetrics.hull.Lz_m / 2
              ] : [503.5, 132, 86.5];

              return (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden bg-slate-950">
                      <WarpVisualizer
                        key={`mode-${effectiveMode}-v${modeVersion}-parity-${localStorage.getItem('physics-parity-mode')}`}
                        parameters={(() => {
                          // Compute physics parity from localStorage once per render
                          const physicsParity = localStorage.getItem('physics-parity-mode') === 'true';
                          
                          return {
                            // --- physics inputs (unchanged from pipeline) ---
                            dutyCycle: dutyUI,
                            g_y: pipeline?.gammaGeo || 26,
                            cavityQ: pipeline?.qCavity || 1e9,
                            sagDepth_nm: pipeline?.sagDepth_nm || 16,
                            tsRatio: isFiniteNumber(pipeline?.TS_ratio) ? pipeline!.TS_ratio! : 5.03e4,
                            powerAvg_MW: isFiniteNumber(pipeline?.P_avg) ? pipeline!.P_avg! : 83.3,
                            exoticMass_kg: isFiniteNumber(pipeline?.M_exotic) ? pipeline!.M_exotic! : 1000,
                            currentMode: effectiveMode,
                            sectorStrobing: sectorsUI,
                            qSpoilingFactor: qSpoilUI,
                            gammaVanDenBroeck: isFiniteNumber(pipeline?.gammaVanDenBroeck) ? pipeline!.gammaVanDenBroeck! : 3.83e1,
                            
                            // --- visual policy (clean approach) ---
                            physicsParity,             // tells engine to render true-physics 1×
                            curvatureGainDec: 0,       // no slider; keep at 0 decades (1×)
                            curvatureBoostMax: 1,      // force visualBoost = 1× in parity mode anyway
                            
                            // --- geometry (standard) ---
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
                            epsilonTilt: systemMetrics?.shiftVector?.epsilonTilt ?? epsilonTilt,
                            betaTiltVec: (systemMetrics?.shiftVector?.betaTiltVec ?? [0, -1, 0]) as [number, number, number],
                            wallWidth_m: 6.0,
                            shift: {
                              epsilonTilt: systemMetrics?.shiftVector?.epsilonTilt ?? epsilonTilt,
                              betaTiltVec: (systemMetrics?.shiftVector?.betaTiltVec ?? [0, -1, 0]) as [number, number, number],
                              gTarget, R_geom,
                              gEff_check: (systemMetrics?.shiftVector?.epsilonTilt ?? epsilonTilt) * R_geom
                            },
                            physicsParityMode: physicsParity
                          };
                        })()}
                      />
                    </div>
                  </div>

                  <div className="space-y-4" ref={sliceHostRef}>
                    {/* Slice Controls Panel */}
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-sm font-medium text-slate-200">Slice Controls</h4>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                            <p className="mb-2">Control SliceViewer parameters and physics parity mode. Physics Parity forces authentic 1× physics visualization without visual amplification.</p>
                            <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                            <p className="text-xs italic">Truth exists at every scale; visualization reveals its face.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Physics Parity Debug Mode */}
                      <div className="mb-3 p-2 bg-red-950/30 rounded border border-red-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <input 
                            type="checkbox" 
                            id="physics-parity-mode"
                            className="w-4 h-4"
                            onChange={(e) => {
                              const physicsParityMode = e.target.checked;
                              // Store in localStorage for persistence
                              localStorage.setItem('physics-parity-mode', physicsParityMode.toString());
                              // Force re-render by incrementing mode version
                              setModeVersion(prev => prev + 1);
                            }}
                            defaultChecked={localStorage.getItem('physics-parity-mode') === 'true'}
                          />
                          <label htmlFor="physics-parity-mode" className="text-xs text-red-200 font-medium">
                            🔬 Physics Parity Debug Mode
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-red-400 hover:text-red-300 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <div className="font-medium text-red-300 mb-1">🔬 Debug Mode</div>
                              <p className="text-xs">Forces all visual multipliers to 1 and physics parameters to unity values. Use to identify non-physical curvature sources. All WebGL uniforms will be logged to console.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {localStorage.getItem('physics-parity-mode') === 'true' && (
                          <div className="text-xs text-red-300 bg-red-950/50 p-1 rounded">
                            ⚠️ All visual boosts disabled. Check console for uniform values.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Slice settings (kept) */}
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-700 mb-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <Label htmlFor="exposure-slider" className="text-slate-300">Exposure ({exposure})</Label>
                          <Input
                            id="exposure-slider"
                            type="range"
                            min="1"
                            max="12"
                            step="1"
                            value={exposure}
                            onChange={(e) => update("exposure", parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="sigma-slider" className="text-slate-300">Sigma Range ({sigmaRange})</Label>
                          <Input
                            id="sigma-slider"
                            type="range"
                            min="2"
                            max="12"
                            step="1"
                            value={sigmaRange}
                            onChange={(e) => update("sigmaRange", parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="diff-mode"
                            checked={diffMode}
                            onCheckedChange={(checked) => update("diffMode", checked)}
                          />
                          <Label htmlFor="diff-mode" className="text-slate-300">Diff Mode</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-contours"
                            checked={showContours}
                            onCheckedChange={(checked) => update("showContours", checked)}
                          />
                          <Label htmlFor="show-contours" className="text-slate-300">Show Contours</Label>
                        </div>
                      </div>
                    </div>
                    
                    <SliceViewer
                      hullAxes={[
                        Number(hullAxes[0]) || 503.5,
                        Number(hullAxes[1]) || 132.0,
                        Number(hullAxes[2]) || 86.5,
                      ]}
                      wallWidth_m={6.0}
                      driveDir={[1, 0, 0]}
                      vShip={1.0}
                      gammaGeo={pipeline?.gammaGeo ?? 26}
                      qSpoilingFactor={qSpoilUI}
                      gammaVdB={isFiniteNumber(pipeline?.gammaVanDenBroeck) ? pipeline!.gammaVanDenBroeck! : 3.83e1}
                      dutyCycle={dutyUI}
                      sectors={sectorsUI}
                      viewAvg={true}
                      diffMode={diffMode}
                      refParams={{
                        gammaGeo: 26,
                        qSpoilingFactor: 1,
                        gammaVdB: 3.83e1,
                        dutyCycle: 0.14,
                        sectors: 1,
                        viewAvg: true,
                      }}
                      sigmaRange={sigmaRange}
                      exposure={exposure}
                      zeroStop={1e-7}
                      showContours={showContours}
                      curvatureBoostMax={40}
                      width={sliceSize.w}
                      height={sliceSize.h}
                      className="xl:sticky xl:top-4"
                    />
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* ====== SHELL OUTLINE VIEWER (wireframe surfaces) ====== */}
        <Card className="bg-slate-900/50 border-slate-800 mb-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              Warp Bubble • Shell Outline (ρ=1±Δ)
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                  <p className="mb-2">
                    Three ρ-surfaces (inner/center/outer) bound the wall thickness set by the Natário bell.
                    Inner curves skew toward compression (orange), outer toward expansion (blue). Violet denotes interior tilt direction.
                  </p>
                  <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                  <p className="text-xs italic">
                    Contours show where space would lean—enough to guide, never to tear.
                  </p>
                </TooltipContent>
              </Tooltip>
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
                epsilonTilt: systemMetrics?.shiftVector?.epsilonTilt ?? epsilonTilt,
                betaTiltVec: (systemMetrics?.shiftVector?.betaTiltVec ?? [0,-1,0]) as [number,number,number],
                // Mode coupling from live pipeline data
                mode: effectiveMode,
                dutyCycle: dutyUI,
                sectors: sectorsUI,
                gammaGeo: pipeline?.gammaGeo ?? 26,
                qSpoil: qSpoilUI,
                qCavity: pipeline?.qCavity ?? 1e9,
                // 🔽 NEW: mechanical chain
                qMechanical: pipeline?.qMechanical ?? 1,
                modulationHz: (pipeline?.modulationFreq_GHz ?? 15) * 1e9,
                mech: {
                  mechResonance_Hz: undefined,  // default = modulation (centered)
                  mechZeta: undefined,          // infer from qMechanical if omitted
                  mechCoupling: 0.65,           // tweak visual strength 0..1
                },
              }}
            />
            
            {/* Mechanical Physics HUD */}
            {(() => {
              // Compute A_rel using same formula as mechanical response
              const qMech = pipeline?.qMechanical ?? 1;
              const zeta = 1 / (2 * qMech);
              const f_mod = (pipeline?.modulationFreq_GHz ?? 15) * 1e9;
              const f0 = f_mod; // Resonant frequency defaults to modulation frequency
              const omega = f_mod / f0; // Normalized frequency
              const denomSq = (1 - omega*omega)**2 + (2*zeta*omega)**2;
              const Arel = 1 / Math.sqrt(denomSq);
              
              return (
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-300 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">
                    Q_mech = {qMech.toFixed(3)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">
                    ζ ≈ {zeta.toExponential(2)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">
                    f₀ = {(f0 / 1e9).toFixed(2)} GHz
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">
                    A_rel = {Arel.toFixed(2)}
                  </span>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* ====== Light Speed vs Strobing Scale ====== */}
        <Card className="bg-slate-900/50 border-slate-800 mb-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              c vs Strobing Timeline
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                  <p className="mb-2">
                    The sweep rate across sectors is chosen so no disturbance outruns the grid's τ_LC.
                    This timeline compares modulation (Hz), sector period, and light-crossing to ensure the "average" shell is GR-valid.
                  </p>
                  <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                  <p className="text-xs italic">
                    Go slowly enough to remain whole; move steadily enough to arrive.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Visual comparison of light-crossing time vs modulation frequencies and sector dwell times.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LightSpeedStrobeScale />
          </CardContent>
        </Card>

        {/* ====== OPERATIONAL MODES / ENERGY CONTROL (below hero) ====== */}
        <Card className="bg-slate-900/50 border-slate-800 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              {MAINFRAME_ZONES.ENERGY_PANEL}
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                  <p className="mb-2">
                    Core operational mode controls power output, exotic matter generation, and sector strobing patterns.
                    Each mode balances performance with Ford-Roman compliance and energy efficiency.
                  </p>
                  <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                  <p className="text-xs italic">
                    Power serves purpose. Choose the mode that serves the moment.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>Live mode switch + power, mass & status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Operational Mode Selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-slate-200">Operational Mode</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-sm">
                      <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                      <p className="mb-2">Each mode represents a different balance of power output, sector strobing frequency, and exotic matter requirements based on mission requirements.</p>
                      <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                      <p className="text-xs italic">The wise captain chooses not the fastest path, but the path that arrives intact.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select 
                  value={pipeline?.currentMode || 'hover'}
                  onValueChange={(mode) => {
                    switchMode.mutate(mode as any);
                    setMainframeLog(prev => [
                      ...prev,
                      `[MODE] Switching to ${mode} (duty=${(MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS].dutyCycle*100).toFixed(1)}%, sectors=${MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS].sectorStrobing})...`
                    ]);
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
                          <span className="text-xs text-slate-500">({fmtPowerUnitFromW(config.powerTarget_W)})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pipeline && (
                  <p className="text-xs text-slate-400">{MODE_CONFIGS[pipeline.currentMode]?.description}</p>
                )}
              </div>

              {/* Mode-aware Active Tiles computation */}
              {(() => {
                // Pull inputs
                const totalTilesLive =
                  (systemMetrics?.totalTiles && isFiniteNumber(systemMetrics.totalTiles))
                    ? systemMetrics.totalTiles
                    : (isFiniteNumber(pipeline?.N_tiles) ? pipeline!.N_tiles! : undefined);

                const sectorsLive = isFiniteNumber(systemMetrics?.sectorStrobing)
                  ? systemMetrics!.sectorStrobing!
                  : (isFiniteNumber(pipeline?.sectorStrobing) ? pipeline!.sectorStrobing! : (MODE_CONFIGS[effectiveMode]?.sectorStrobing ?? 1));

                const dutyLive = isFiniteNumber(pipeline?.dutyCycle)
                  ? pipeline!.dutyCycle!
                  : (MODE_CONFIGS[effectiveMode]?.dutyCycle ?? 0);

                // Derived count (mode-aware)
                const derivedActiveTiles = deriveActiveTiles(totalTilesLive, sectorsLive, dutyLive, effectiveMode);

                // Prefer a sensible live server value, but override if it's missing or obviously stale
                const activeTilesDisplay = (() => {
                  const serverVal = systemMetrics?.activeTiles;
                  if (isFiniteNumber(serverVal)) {
                    // If server value matches our derivation (or is close), trust server
                    if (isFiniteNumber(derivedActiveTiles)) {
                      const diff = Math.abs(serverVal - derivedActiveTiles);
                      const rel = derivedActiveTiles === 0 ? diff : diff / derivedActiveTiles;
                      return rel < 0.05 ? serverVal : derivedActiveTiles; // >5% drift → use derived
                    }
                    return serverVal;
                  }
                  // No server value → use derived or a small fallback
                  return isFiniteNumber(derivedActiveTiles) ? derivedActiveTiles : 2_800_000;
                })();

                return (
                  <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400">Active Tiles (Energized)</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                        <p className="mb-2">Only a tiny fraction of tiles energize at any instant. Time-slicing (sectors, duty) ensures the light-crossing time τ_LC exceeds any local "on" window, preserving GR causality while the time-averaged stress matches the Natário profile.</p>
                        <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                        <p className="text-xs italic">Not all lamps must glow at once. A lighthouse turns to reach every ship.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-mono text-cyan-400">
                    {isFiniteNumber(activeTilesDisplay)
                      ? activeTilesDisplay.toLocaleString()
                      : '2,800,000'}
                  </p>
                  {isFiniteNumber(sectorsLive) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {sectorsLive > 1
                        ? `${sectorsLive} sectors • ~${(dutyLive * 100).toFixed(2)}% of grid ON`
                        : `${(dutyLive*100).toFixed(1)}% eligible • 1% local ON`}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400">Energy Output</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                        <p className="mb-2">Average power output from all active Casimir tile sectors. Scales with operational mode and duty cycle.</p>
                        <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                        <p className="text-xs italic">Energy flows where intention directs it.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-mono text-yellow-400">
                    {fmtPowerUnit(pipeline?.P_avg ?? systemMetrics?.energyOutput)}
                  </p>
                </div>
                  </div>
                );
              })()}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400">Exotic Mass</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                        <p className="mb-2">Negative energy density required to curve spacetime according to the Alcubierre metric. Lower values indicate more feasible warp drives.</p>
                        <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                        <p className="text-xs italic">The mountain that appears impossible to move requires only the gentlest persistent pressure in the right direction.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-mono text-purple-400">
                    {fmt(pipeline?.M_exotic ?? systemMetrics?.exoticMass, 0, '1405')} kg
                  </p>
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
                    <div>Duty: {fmt(dutyUI * 100, 1, '0')}%</div>
                    <div>Sectors: {fint(sectorsUI, '0')}</div>
                    <div>Q-Spoil: {fmt(qSpoilUI, 3, '1.000')}</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted">
                          γ<sub>VdB</sub>: {fexp(
                            (pipelineState as any)?.gammaVanDenBroeck ?? pipeline?.gammaVanDenBroeck,
                            1,
                            '2.9e+5'
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
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
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="modulation" className="text-slate-200">Modulation Frequency</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-sm">
                      <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                      <p className="mb-2">The fundamental frequency at which Casimir tiles oscillate. Higher frequencies increase power output but require more precise timing control.</p>
                      <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                      <p className="text-xs italic">Resonance is not about power—it's about timing.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                      <span className="font-mono text-sm">
                        ζ = {fmt(pipelineState?.zeta ?? systemMetrics?.fordRoman?.value, 3, '0.032')}
                      </span>
                      <Badge
                        className={`${
                          (pipelineState?.fordRomanCompliance ?? (systemMetrics?.fordRoman?.status === 'PASS'))
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {(pipelineState?.fordRomanCompliance ?? (systemMetrics?.fordRoman?.status === 'PASS')) ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Natário Zero-Expansion</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">∇·ξ = {fmt(systemMetrics?.natario?.value, 3, '0')}</span>
                      <Badge
                        className={`${
                          (pipelineState?.natarioConstraint ?? (systemMetrics?.natario?.status === 'VALID'))
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {(pipelineState?.natarioConstraint ?? (systemMetrics?.natario?.status === 'VALID')) ? 'VALID' : 'INVALID'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Curvature Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        R {'<'} {(() => {
                          const R_est = isFiniteNumber(pipelineState?.U_cycle)
                            ? Math.abs(pipelineState.U_cycle) / (9e16) // c^2 ≈ 9e16 (safe since checked)
                            : systemMetrics?.curvatureMax;
                          return fexp(R_est, 0, '1e-21');
                        })()}
                      </span>
                      <Badge className={`${pipelineState?.curvatureLimit ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {pipelineState?.curvatureLimit ? 'SAFE' : 'WARN'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Time-Scale Separation</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        TS = {fmt(pipelineState?.TS_ratio ?? systemMetrics?.timeScaleRatio, 1, '5.03e4')}
                      </span>
                      <Badge className={`${(pipelineState?.TS_ratio ?? systemMetrics?.timeScaleRatio ?? 0) > 1 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {(pipelineState?.TS_ratio ?? systemMetrics?.timeScaleRatio ?? 0) > 1 ? 'SAFE' : 'CHECK'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Show pipeline calculation details */}
                {pipelineState && (
                  <div className="mt-4 p-3 bg-slate-950 rounded-lg">
                    <p className="text-xs text-slate-400 mb-2">Energy Pipeline Values:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>U_static: {fexp(pipelineState?.U_static, 2, '—')} J</div>
                      <div>U_geo: {fexp(pipelineState?.U_geo, 2, '—')} J</div>
                      <div>U_Q: {fexp(pipelineState?.U_Q, 2, '—')} J</div>
                      <div>U_cycle: {fexp(pipelineState?.U_cycle, 2, '—')} J</div>
                      <div>P_loss: {fmt(pipelineState?.P_loss_raw, 3, '—')} W/tile</div>
                      <div>N_tiles: {fexp(pipelineState?.N_tiles, 2, '—')}</div>
                      <div className="col-span-2 text-yellow-300 border-t border-slate-700 pt-2 mt-1">
                        γ_VdB: {fexp(pipelineState?.gammaVanDenBroeck, 2, '—')} (Van den Broeck)
                      </div>
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

            {/* Resonance Scheduler (auto, mode-coupled) */}
            <ResonanceSchedulerTile
              mode={effectiveMode}
              duty={dutyUI}
              sectors={sectorsUI}
              freqGHz={(pipeline?.modulationFreq_GHz ?? 15)}
              sectorPeriod_ms={systemMetrics?.sectorPeriod_ms}
              currentSector={systemMetrics?.currentSector}
              hull={pipeline ? { a: 503.5, b: 132, c: 86.5 } : undefined}
              wallWidth_m={6.0}
            />
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
              zeta={pipelineState?.zeta}
              tsRatio={pipelineState?.TS_ratio || 5.03e4}
              frOk={pipelineState?.fordRomanCompliance || true}
              natarioOk={pipelineState?.natarioConstraint || true}
              curvatureOk={pipelineState?.curvatureLimit || true}
              freqGHz={15.0}
              duty={dutyUI}
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
                zeta: pipelineState?.zeta,
                tsRatio: pipelineState?.TS_ratio || 5.03e4,
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
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">Mission Planner</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <div className="font-medium text-yellow-300 mb-1">🧠 Theory</div>
                      <p className="mb-2">
                        Interactive navigation system supporting both galactic-scale (parsec) and solar system (AU) mission planning.
                        Routes calculate energy requirements and travel time based on current warp bubble parameters.
                      </p>
                      <div className="font-medium text-cyan-300 mb-1">🧘 Zen</div>
                      <p className="text-xs italic">
                        The path reveals itself to those who take the first step.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                    zeta: pipelineState?.zeta,
                    tsRatio: pipelineState?.TS_ratio || 5.03e4,
                    freqGHz: 15.0,
                    energyPerLyMWh: (() => {
                      const vLyPerHour = computeEffectiveLyPerHour(
                        pipelineState?.currentMode || 'Hover',
                        pipelineState?.dutyCycle || 0.14,
                        pipelineState?.gammaGeo || 26,
                        pipelineState?.qCavity || 1e9,
                        pipelineState?.zeta,
                        pipelineState?.TS_ratio || 5.03e4
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
                      pipelineState?.zeta,
                      pipelineState?.TS_ratio || 5.03e4
                    )
                  } as HelixPerf}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ====== CASIMIR AMPLIFIER: Complete Physics Pipeline Visualization ====== */}
        <div className="mt-8">
          <HelixCasimirAmplifier 
            metricsEndpoint="/api/helix/metrics"
            stateEndpoint="/api/helix/pipeline" 
            fieldEndpoint="/api/helix/displacement"
            modeEndpoint="/api/helix/mode"
          />
        </div>
        
      </div>
      </div>
    </TooltipProvider>
  );
}