import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface WarpVisualizerProps {
  parameters: {
    dutyCycle: number;
    g_y: number;
    cavityQ: number;
    sagDepth_nm: number;
    tsRatio: number;
    powerAvg_MW: number;
    exoticMass_kg: number;
    // Operational mode data
    currentMode?: string;
    sectorStrobing?: number;
    qSpoilingFactor?: number;
    gammaVanDenBroeck?: number;
  };
}

export function WarpVisualizer({ parameters }: WarpVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const animationRef = useRef<number>();
  const [isRunning, setIsRunning] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeEngine = async () => {
      if (!canvasRef.current) return;

      try {
        // Check if SimpleWarpEngine is already loaded
        if (window.SimpleWarpEngine) {
          try {
            engineRef.current = new window.SimpleWarpEngine(canvasRef.current);
            setIsLoaded(true);
          } catch (error) {
            console.error('Failed to initialize existing SimpleWarpEngine:', error);
          }
          return;
        }

        // Load the Simple WarpEngine for reliable visualization
        const script = document.createElement('script');
        script.src = '/warp-simple.js?v=' + Date.now(); // 2D Canvas fallback for reliability
        console.log('Loading Simple WarpEngine from:', script.src);
        script.onload = () => {
          console.log('SimpleWarpEngine loaded, window.SimpleWarpEngine available:', !!window.SimpleWarpEngine);
          if (window.SimpleWarpEngine) {
            try {
              console.log('Creating SimpleWarpEngine instance...');
              engineRef.current = new window.SimpleWarpEngine(canvasRef.current);
              console.log('SimpleWarpEngine instance created successfully');
              setIsLoaded(true);
            } catch (error) {
              console.error('Failed to initialize SimpleWarpEngine:', error);
              console.error('Error details:', (error as Error).message, (error as Error).stack);
              setIsLoaded(false);
            }
          } else {
            console.error('SimpleWarpEngine not found on window after script load');
          }
        };
        script.onerror = () => {
          console.error('Failed to load SimpleWarpEngine');
          setIsLoaded(false);
        };
        document.head.appendChild(script);

        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (error) {
        console.error('Failed to initialize WarpEngine:', error);
        setIsLoaded(false);
      }
    };

    initializeEngine();

    return () => {
      // Clean up engine resources
      if (engineRef.current?.destroy) {
        engineRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current && isLoaded) {
      console.log('🔄 Live operational mode update:', {
        mode: parameters.currentMode || 'hover',
        dutyCycle: parameters.dutyCycle,
        g_y: parameters.g_y,
        cavityQ: parameters.cavityQ,
        sagDepth_nm: parameters.sagDepth_nm,
        powerAvg_MW: parameters.powerAvg_MW,
        exoticMass_kg: parameters.exoticMass_kg,
        sectorStrobing: parameters.sectorStrobing,
        qSpoilingFactor: parameters.qSpoilingFactor,
        gammaVanDenBroeck: parameters.gammaVanDenBroeck
      });

      // Enhanced uniform update with smooth transitions (inspired by GPT's suggestion)
      engineRef.current.updateUniforms({
        // Core physics parameters
        dutyCycle: parameters.dutyCycle,
        g_y: parameters.g_y,
        cavityQ: parameters.cavityQ,
        sagDepth_nm: parameters.sagDepth_nm,
        powerAvg_MW: parameters.powerAvg_MW,
        exoticMass_kg: parameters.exoticMass_kg,
        // Operational mode parameters
        currentMode: parameters.currentMode,
        sectorStrobing: parameters.sectorStrobing,
        qSpoilingFactor: parameters.qSpoilingFactor,
        gammaVanDenBroeck: parameters.gammaVanDenBroeck
      });
    }
  }, [parameters, isLoaded]);

  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        // The optimized engine handles its own resizing automatically
        // through the _resize() method bound to window resize events
        if (engineRef.current._resize) {
          engineRef.current._resize();
        }
      }
    };

    // Manual resize trigger for component changes
    if (isLoaded && engineRef.current) {
      handleResize();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded]);

  const toggleAnimation = () => {
    setIsRunning(!isRunning);
    if (engineRef.current) {
      if (!isRunning) {
        // Resume animation loop
        engineRef.current._startRenderLoop();
      } else {
        // Pause animation loop
        if (engineRef.current.animationId) {
          cancelAnimationFrame(engineRef.current.animationId);
          engineRef.current.animationId = null;
        }
      }
    }
  };

  const resetView = () => {
    if (engineRef.current) {
      // Reset any view parameters if needed
      engineRef.current.updateUniforms(parameters);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Natário Warp Bubble</CardTitle>
            <CardDescription>
              {parameters.currentMode ? 
                `${parameters.currentMode.toUpperCase()} Mode - Real-time spacetime curvature` : 
                'Real-time spacetime curvature visualization'
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAnimation}
              data-testid="button-toggle-animation"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              data-testid="button-reset-view"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            width={512}
            height={256}
            data-testid="canvas-warp-bubble"
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2 mx-auto"></div>
                <div className="text-sm">Loading Warp Engine...</div>
              </div>
            </div>
          )}
          
          {/* Live operational mode HUD (inspired by GPT's suggestion) */}
          {isLoaded && (
            <div className="absolute top-2 left-2 bg-black/80 rounded px-2 py-1 text-xs font-mono">
              <div className="text-cyan-400 font-semibold">
                {parameters.currentMode?.toUpperCase() || 'HOVER'} MODE
              </div>
              <div className="text-green-400">
                P: {parameters.powerAvg_MW.toFixed(1)}MW | 
                D: {(parameters.dutyCycle * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duty Cycle:</span>
                <span className="text-cyan-400">{(parameters.dutyCycle * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">γ Geometric:</span>
                <span className="text-orange-400">{parameters.g_y.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Q Factor:</span>
                <span className="text-yellow-400">{parameters.cavityQ.toExponential(1)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sag Depth:</span>
                <span className="text-blue-400">{parameters.sagDepth_nm.toFixed(1)} nm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Power:</span>
                <span className="text-green-400">{parameters.powerAvg_MW.toFixed(1)} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exotic Mass:</span>
                <span className="text-purple-400">{parameters.exoticMass_kg.toFixed(0)} kg</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Operational Mode Physics:</div>
            <div className="mb-2 text-cyan-300">
              <strong>{parameters.currentMode?.toUpperCase() || 'HOVER'} MODE</strong> - 
              {parameters.currentMode === 'hover' && ' gentle bulge, slow ripple'}
              {parameters.currentMode === 'cruise' && ' field nearly flat, faint ripple'}
              {parameters.currentMode === 'emergency' && ' strong bulge, fast shimmer'}
              {parameters.currentMode === 'standby' && ' grid perfectly flat, background calm'}
            </div>
            <div>• <span className="text-orange-400">Sector Strobing</span>: {parameters.sectorStrobing || 1}× spatial coherence</div>
            <div>• <span className="text-yellow-400">Q Spoiling</span>: {((parameters.qSpoilingFactor || 1) * 100).toFixed(0)}% cavity efficiency</div>
            <div>• <span className="text-purple-400">γ Van den Broeck</span>: {(parameters.gammaVanDenBroeck || 6.57e7).toExponential(1)} curvature amplifier</div>
            <div className="mt-2 text-slate-500">
              <span className="font-semibold">3D Grid:</span> Live Natário spacetime curvature with mode-specific deformation scaling
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

declare global {
  interface Window {
    WarpEngine: any;
  }
}