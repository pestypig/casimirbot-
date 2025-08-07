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
        // Load the WarpEngine script
        const script = document.createElement('script');
        script.src = '/warp-engine.js';
        script.onload = () => {
          if (window.WarpEngine) {
            engineRef.current = new window.WarpEngine(canvasRef.current);
            setIsLoaded(true);
            startAnimation();
          }
        };
        script.onerror = () => {
          console.error('Failed to load WarpEngine');
        };
        document.head.appendChild(script);

        return () => {
          document.head.removeChild(script);
        };
      } catch (error) {
        console.error('Failed to initialize WarpEngine:', error);
      }
    };

    initializeEngine();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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
        const rect = canvasRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          engineRef.current.resize(rect.width, rect.height);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded]);

  const startAnimation = () => {
    if (!engineRef.current || !isRunning) return;

    const animate = (time: number) => {
      if (engineRef.current) {
        engineRef.current.render(time);
      }
      if (isRunning) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const toggleAnimation = () => {
    setIsRunning(!isRunning);
    if (!isRunning && engineRef.current) {
      startAnimation();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
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
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duty Cycle:</span>
              <span>{(parameters.dutyCycle * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">γ Geometric:</span>
              <span>{parameters.g_y.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Q Factor:</span>
              <span>{parameters.cavityQ.toExponential(1)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sag Depth:</span>
              <span>{parameters.sagDepth_nm.toFixed(1)} nm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Power:</span>
              <span>{parameters.powerAvg_MW.toFixed(1)} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exotic Mass:</span>
              <span>{parameters.exoticMass_kg.toFixed(0)} kg</span>
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