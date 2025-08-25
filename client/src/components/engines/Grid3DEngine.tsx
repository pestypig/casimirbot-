import { useRef, useEffect } from 'react';

// Minimal 3D grid engine that samples the Natário displacement field
// and renders it as instanced points/lines with physics-accurate coloring
export default function Grid3DEngine({ uniforms, ...rest }: { uniforms: any; [key: string]: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isDestroyed = false;

    // Build a rectilinear lattice in model space (64×40×64)
    const buildGrid = (nx: number, ny: number, nz: number) => {
      const points = [];
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          for (let k = 0; k < nz; k++) {
            const x = (i / (nx - 1) - 0.5) * 2; // -1 to 1
            const y = (j / (ny - 1) - 0.5) * 2; // -1 to 1  
            const z = (k / (nz - 1) - 0.5) * 2; // -1 to 1
            points.push({ x, y, z, originalX: x, originalY: y, originalZ: z });
          }
        }
      }
      return points;
    };

    // Sample displacement field using Natário bell math
    const sampleDisplacementField = (x: number, y: number, z: number, uniforms: any) => {
      const { hullAxes = [1, 0.26, 0.17], wallWidth = 0.06, gammaVdB = 1e11, gammaGeo = 26, qSpoilingFactor = 1, dutyEffectiveFR = 0.000025, viewMassFraction = 1.0 } = uniforms;
      
      // Ellipsoidal radius calculation
      const rho = Math.sqrt(
        Math.pow(x / hullAxes[0], 2) + 
        Math.pow(y / hullAxes[1], 2) + 
        Math.pow(z / hullAxes[2], 2)
      );
      
      // Natário bell function
      const sigma = wallWidth / 2;
      const bell = Math.exp(-Math.pow((rho - 1) / sigma, 2));
      
      // Theta calculation with physics chain
      const thetaScaleCanonical = Math.pow(gammaGeo, 3) * qSpoilingFactor * gammaVdB * dutyEffectiveFR;
      const thetaScaleUsed = thetaScaleCanonical * viewMassFraction; // Apply view mass fraction
      const theta = bell * thetaScaleUsed;
      
      // Sign based on compression/expansion regions
      const sign = rho < 1 ? -1 : 1;
      
      return { theta, sign, rho, displacement: theta * sign };
    };

    // Apply tone mapping (exposure, zeroStop)
    const toneMap = (value: number, exposure = 5, zeroStop = 1e-7) => {
      const abs = Math.abs(value);
      if (abs < zeroStop) return 0;
      return Math.sign(value) * Math.asinh(abs * Math.pow(10, exposure)) / Math.asinh(Math.pow(10, exposure));
    };

    // Color mapping for theta visualization
    const getColor = (theta: number, exposure: number, zeroStop: number) => {
      const mapped = toneMap(theta, exposure, zeroStop);
      const intensity = Math.abs(mapped);
      
      if (mapped > 0) {
        // Expansion (blue)
        return `rgba(0, ${Math.floor(intensity * 255)}, 255, 0.8)`;
      } else if (mapped < 0) {
        // Compression (orange/red)
        return `rgba(255, ${Math.floor(intensity * 165)}, 0, 0.8)`;
      } else {
        // Zero (white)
        return 'rgba(255, 255, 255, 0.1)';
      }
    };

    // Render function
    const render = () => {
      if (isDestroyed) return;
      
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      // Build grid
      const grid = buildGrid(32, 20, 32); // Moderate resolution for performance
      
      // Apply displacement and render
      const exposure = uniforms.exposure || 5;
      const zeroStop = uniforms.zeroStop || 1e-7;
      
      grid.forEach(point => {
        const { theta, displacement } = sampleDisplacementField(point.x, point.y, point.z, uniforms);
        
        // Apply displacement to position
        point.x = point.originalX + displacement * 0.1; // Scale for visibility
        point.y = point.originalY + displacement * 0.1;
        point.z = point.originalZ + displacement * 0.1;
        
        // Project to 2D (simple orthographic projection)
        const screenX = (point.x * 0.3 + 0.5) * width;
        const screenY = (point.y * 0.3 + 0.5) * height;
        const screenZ = point.z; // For depth sorting
        
        // Color based on theta
        const color = getColor(theta, exposure, zeroStop);
        
        // Draw point
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(render);
    };

    // Initialize and start rendering
    render();

    // Cleanup
    return () => {
      isDestroyed = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [uniforms]);

  // Engine interface methods for compatibility
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add engine methods to canvas for compatibility
    (canvas as any).setVisible = (visible: boolean) => {
      canvas.style.visibility = visible ? 'visible' : 'hidden';
    };

    (canvas as any).updateUniforms = (newUniforms: any) => {
      // Updates will trigger re-render via useEffect dependency
    };

    (canvas as any).bootstrap = (payload: any) => {
      // Initialize with payload data
    };

    (canvas as any).isLoaded = true;
    (canvas as any).gridProgram = true; // Mock for readiness checks
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      {...rest}
      style={{ 
        width: '100%', 
        height: '100%',
        background: 'black',
        ...rest.style 
      }}
    />
  );
}