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
        // Check if WarpEngine is already loaded to avoid duplicate declarations
        if (window.WarpEngine) {
          try {
            engineRef.current = new window.WarpEngine(canvasRef.current);
            setIsLoaded(true);
          } catch (error) {
            console.error('Failed to initialize existing WarpEngine:', error);
          }
          return;
        }

        // Load the WarpEngine script dynamically
        const script = document.createElement('script');
        script.src = '/warp-engine.js?' + Date.now(); // Cache bust
        script.onload = () => {
          if (window.WarpEngine) {
            try {
              engineRef.current = new window.WarpEngine(canvasRef.current);
              setIsLoaded(true);
              // Engine now auto-starts its render loop
            } catch (error) {
              console.error('Failed to initialize WarpEngine:', error);
              setIsLoaded(false);
            }
          }
        };
        script.onerror = () => {
          console.error('Failed to load WarpEngine');
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
      engineRef.current.updateUniforms(parameters);
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
            <CardDescription>Real-time spacetime curvature visualization</CardDescription>
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
        <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
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
            <div className="font-semibold text-slate-300">Visual Effects Guide:</div>
            <div>• <span className="text-cyan-400">Duty Cycle</span>: Controls overall brightness & ripple depth</div>
            <div>• <span className="text-orange-400">γ Geometric</span>: Adjusts color contrast & bubble sharpness</div>
            <div>• <span className="text-blue-400">Sag Depth</span>: Bubble size (larger = wider disc)</div>
            <div>• <span className="text-green-400">Power</span>: Ripple propagation speed</div>
            <div>• <span className="text-yellow-400">Q Factor</span>: Golden halo intensity</div>
            <div>• <span className="text-purple-400">Exotic Mass</span>: Outer shock ring visibility</div>
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