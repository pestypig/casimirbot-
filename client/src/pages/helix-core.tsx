import { useState, useEffect, useRef } from "react";
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

// Mainframe zones configuration
const MAINFRAME_ZONES = {
  TILE_GRID: "Casimir Tile Grid",
  ENERGY_PANEL: "Energy Control Panel", 
  COMPLIANCE_HUD: "Metric Compliance HUD",
  PHASE_DIAGRAM: "Phase Diagram AI",
  RESONANCE_SCHEDULER: "Resonance Scheduler",
  LOG_TERMINAL: "Log + Document Terminal",
  LATTICE_INSPECTOR: "Graphene Lattice Inspector"
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

interface SystemMetrics {
  activeTiles: number;
  totalTiles: number;
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
  
  // Fetch system metrics
  const { data: systemMetrics, refetch: refetchMetrics } = useQuery<SystemMetrics>({
    queryKey: ['/api/helix/metrics'],
    refetchInterval: 5000 // Update every 5 seconds
  });
  
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
        })).concat({ role: 'user', content: commandInput })
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
  
  // Handle tile click
  const handleTileClick = async (sectorId: string) => {
    setSelectedSector(sectorId);
    const sector = TILE_SECTORS.find(s => s.id === sectorId);
    if (sector) {
      setMainframeLog(prev => [...prev, 
        `[TILE] Selected ${sectorId}`,
        `[DATA] Q-Factor: ${sector.qFactor.toExponential(2)}, Temp: ${sector.temperature.toFixed(1)}K`
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
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
                      name: responseData.message.function_call.name,
                      result: responseData.functionResult
                    };
                    setMainframeLog(prev => [...prev, 
                      `[AUTO-DUTY] ${responseData.functionResult.log || 'Sequence initiated'}`
                    ]);
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
            >
              <Brain className="w-4 h-4" />
              Auto-Duty Mode
            </Button>
            <Button 
              variant={activeMode === "manual" ? "default" : "outline"}
              onClick={() => setActiveMode("manual")}
              className="flex items-center gap-2"
            >
              <Grid3X3 className="w-4 h-4" />
              Manual Pulse Mode
            </Button>
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
                      name: responseData.message.function_call.name,
                      result: responseData.functionResult
                    };
                    setMainframeLog(prev => [...prev, 
                      `[DIAGNOSTICS] System Health: ${responseData.functionResult.systemHealth}`
                    ]);
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
            >
              <Gauge className="w-4 h-4" />
              Diagnostics Mode
            </Button>
            <Button 
              variant={activeMode === "theory" ? "default" : "outline"}
              onClick={() => {
                setActiveMode("theory");
                // Theory playback would load PDFs - placeholder for now
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
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Tile Grid & Energy */}
          <div className="space-y-4">
            {/* Casimir Tile Grid */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-cyan-400" />
                  {MAINFRAME_ZONES.TILE_GRID}
                </CardTitle>
                <CardDescription>
                  Interactive map of all tile sectors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeMode === "manual" && (
                  <div className="mb-2 text-center text-sm text-cyan-400">
                    Click any tile to pulse it manually
                  </div>
                )}
                <div className="grid grid-cols-10 gap-1 p-4 bg-slate-950 rounded-lg">
                  {TILE_SECTORS.slice(0, 100).map(sector => (
                    <div
                      key={sector.id}
                      onClick={() => handleTileClick(sector.id)}
                      className={`
                        w-3 h-3 rounded-sm transition-all
                        ${activeMode === "manual" ? "cursor-pointer hover:scale-110" : "cursor-default"}
                        ${sector.strobing ? 'animate-pulse' : ''}
                        ${selectedSector === sector.id ? 'ring-2 ring-cyan-400' : ''}
                        ${isProcessing && selectedSector === sector.id ? 'animate-pulse' : ''}
                        ${sector.active 
                          ? sector.errorRate > 0.03 
                            ? 'bg-red-500' 
                            : 'bg-green-500'
                          : 'bg-slate-700'
                        }
                      `}
                      title={`${sector.id}: Q=${sector.qFactor.toExponential(1)}, Error=${(sector.errorRate * 100).toFixed(1)}%`}
                    />
                  ))}
                </div>
                {selectedSector && (
                  <div className="mt-4 p-3 bg-slate-950 rounded-lg text-sm">
                    <p className="font-mono text-cyan-400">Sector {selectedSector}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>Q-Factor: {TILE_SECTORS.find(s => s.id === selectedSector)?.qFactor.toExponential(2)}</div>
                      <div>Temp: {TILE_SECTORS.find(s => s.id === selectedSector)?.temperature.toFixed(1)} K</div>
                      <div>Error: {((TILE_SECTORS.find(s => s.id === selectedSector)?.errorRate || 0) * 100).toFixed(1)}%</div>
                      <div>Curvature: {TILE_SECTORS.find(s => s.id === selectedSector)?.curvatureContribution.toExponential(1)}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Energy Control Panel */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-yellow-400" />
                  {MAINFRAME_ZONES.ENERGY_PANEL}
                </CardTitle>
                <CardDescription>
                  Live Casimir energy output monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-950 rounded-lg">
                      <p className="text-xs text-slate-400">Active Tiles</p>
                      <p className="text-lg font-mono text-cyan-400">{systemMetrics?.activeTiles || 312}/{systemMetrics?.totalTiles || 400}</p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg">
                      <p className="text-xs text-slate-400">Energy Output</p>
                      <p className="text-lg font-mono text-yellow-400">{systemMetrics?.energyOutput || 83.3} MW</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-950 rounded-lg">
                      <p className="text-xs text-slate-400">Exotic Mass</p>
                      <p className="text-lg font-mono text-purple-400">{systemMetrics?.exoticMass || 1405} kg</p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg">
                      <p className="text-xs text-slate-400">System Status</p>
                      <p className="text-lg font-mono text-green-400">{systemMetrics?.overallStatus || 'NOMINAL'}</p>
                    </div>
                  </div>
                  
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
          </div>

          {/* Center Column - Compliance & Phase Diagram */}
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
                      <span className="font-mono text-sm">ζ = {systemMetrics?.fordRoman.value.toFixed(3) || '0.032'}</span>
                      <Badge className={`${systemMetrics?.fordRoman.status === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {systemMetrics?.fordRoman.status || 'PASS'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Natário Zero-Expansion</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">∇·ξ = {systemMetrics?.natario.value || 0}</span>
                      <Badge className={`${systemMetrics?.natario.status === 'VALID' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {systemMetrics?.natario.status || 'VALID'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Curvature Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">R {'<'} {systemMetrics?.curvatureMax.toExponential(0) || '1e-21'}</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400">WARN</Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                    <span className="text-sm">Time-Scale Separation</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">TS = {systemMetrics?.timeScaleRatio.toFixed(1) || '4102.7'}</span>
                      <Badge className="bg-green-500/20 text-green-400">SAFE</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <p className="text-xs text-slate-400">Burst</p>
                      <p className="font-mono text-slate-100">10 μs</p>
                    </div>
                    <div className="p-2 bg-slate-950 rounded text-center">
                      <p className="text-xs text-slate-400">Cycle</p>
                      <p className="font-mono text-slate-100">1 ms</p>
                    </div>
                    <div className="p-2 bg-slate-950 rounded text-center">
                      <p className="text-xs text-slate-400">Sectors</p>
                      <p className="font-mono text-slate-100">400</p>
                    </div>
                  </div>
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

            {/* Graphene Lattice Inspector */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Atom className="w-5 h-5 text-teal-400" />
                  {MAINFRAME_ZONES.LATTICE_INSPECTOR}
                </CardTitle>
                <CardDescription>
                  Microscale geometry diagnostics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Cavity Gap</p>
                    <p className="font-mono text-lg text-slate-100">1.000 nm</p>
                  </div>
                  
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Surface Roughness</p>
                    <p className="font-mono text-lg text-slate-100">0.05 nm RMS</p>
                  </div>
                  
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Q Enhancement</p>
                    <p className="font-mono text-lg text-slate-100">1.6×10⁶</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Vibrational Mode</p>
                    <p className="font-mono text-lg text-slate-100">15.0 GHz</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}