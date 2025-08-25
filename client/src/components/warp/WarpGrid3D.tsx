'use client';

import React, { useEffect, useRef, useState } from 'react';

interface WarpGrid3DProps {
  hull: { a: number; b: number; c: number };
  wallWidth_m?: number;
  sectorCount: number;
  sectors: number;
  dutyEffectiveFR: number;
  lightCrossing?: { dwell_ms?: number; burst_ms?: number; currentSector?: number };
  gammaGeo: number;
  gammaVdB: number;
  qSpoilingFactor: number;
  width?: number;
  height?: number;
  sliceY?: number; // YZ slice position (-1 to 1)
  sliceZ?: number; // XZ slice position (-1 to 1)
}

// 3D Natário displacement field sampling
function sampleDisplacement3D(x: number, y: number, z: number, params: {
  hull: { a: number; b: number; c: number };
  wallWidth_m: number;
  gammaGeo: number;
  gammaVdB: number;
  qSpoilingFactor: number;
  dutyEffectiveFR: number;
  sectorMask?: { maskCenter: number; maskWidth: number };
}) {
  const { hull, wallWidth_m, gammaGeo, gammaVdB, qSpoilingFactor, dutyEffectiveFR } = params;
  
  // Ellipsoidal coordinate ρ
  const rho = Math.sqrt((x*x)/(hull.a*hull.a) + (y*y)/(hull.b*hull.b) + (z*z)/(hull.c*hull.c));
  
  // Natário bell function 
  const sigma = wallWidth_m / 2;
  const bell = Math.exp(-0.5 * Math.pow((rho - 1) / sigma, 2));
  
  // Physics chain: θ-scale = γ³ · q · γ_VdB · √(duty)
  const thetaScale = Math.pow(gammaGeo, 3) * qSpoilingFactor * gammaVdB * Math.sqrt(dutyEffectiveFR);
  
  // Displacement magnitude
  const displacement = thetaScale * bell;
  
  return {
    displacement,
    rho,
    theta: displacement, // θ = displacement for coloring
    bell
  };
}

export default function WarpGrid3D(props: WarpGrid3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isRendering, setIsRendering] = useState(false);
  
  const gridRes = { x: 64, y: 40, z: 64 }; // ~163k vertices
  const maxPoints = gridRes.x * gridRes.y * gridRes.z;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsRendering(true);
    
    const render = () => {
      const { width = 400, height = 300 } = props;
      canvas.width = width;
      canvas.height = height;
      
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = Math.min(width, height) * 0.3;
      
      // Sample 3D grid points
      const points: Array<{
        x: number; y: number; z: number;
        displacement: number; theta: number;
        screenX: number; screenY: number;
        depth: number;
      }> = [];
      
      const { sliceY = 0, sliceZ = 0 } = props;
      
      for (let i = 0; i < gridRes.x; i++) {
        for (let j = 0; j < gridRes.y; j++) {
          for (let k = 0; k < gridRes.z; k++) {
            // Skip points for performance (LOD)
            if (points.length > maxPoints * 0.1) continue; // 10% sampling
            
            // Grid coordinates (-1 to 1)
            const x = (i / (gridRes.x - 1)) * 2 - 1;
            const y = (j / (gridRes.y - 1)) * 2 - 1;
            const z = (k / (gridRes.z - 1)) * 2 - 1;
            
            // Apply slice filters for performance
            if (Math.abs(y - sliceY) > 0.3 && Math.abs(z - sliceZ) > 0.3) continue;
            
            // Sample displacement field
            const sample = sampleDisplacement3D(x, y, z, {
              hull: props.hull,
              wallWidth_m: props.wallWidth_m || 0.06,
              gammaGeo: props.gammaGeo,
              gammaVdB: props.gammaVdB,
              qSpoilingFactor: props.qSpoilingFactor,
              dutyEffectiveFR: props.dutyEffectiveFR
            });
            
            // Apply displacement to position
            const displaceX = x + sample.displacement * 0.1; // Scale displacement for visibility
            const displaceY = y + sample.displacement * 0.1;
            const displaceZ = z + sample.displacement * 0.1;
            
            // 3D to 2D projection (simple orthographic)
            const rotY = Date.now() * 0.0005; // Slow rotation
            const cos = Math.cos(rotY);
            const sin = Math.sin(rotY);
            
            const rotatedX = displaceX * cos - displaceZ * sin;
            const rotatedZ = displaceX * sin + displaceZ * cos;
            
            const screenX = centerX + rotatedX * scale;
            const screenY = centerY + displaceY * scale;
            const depth = rotatedZ;
            
            points.push({
              x: displaceX, y: displaceY, z: displaceZ,
              displacement: sample.displacement,
              theta: sample.theta,
              screenX, screenY, depth
            });
          }
        }
      }
      
      // Sort by depth for proper rendering
      points.sort((a, b) => b.depth - a.depth);
      
      // Render points
      points.forEach(point => {
        // Color by theta sign and magnitude
        const thetaMag = Math.abs(point.theta);
        const logMag = Math.log10(1 + thetaMag * 1e6) / 8; // Tone mapping
        const intensity = Math.min(1, logMag);
        
        // Depth fog
        const fogFactor = Math.max(0, 1 - Math.abs(point.depth) * 0.5);
        const alpha = intensity * fogFactor * 0.8;
        
        if (alpha < 0.1) return; // Skip transparent points
        
        // Color: blue for negative theta, red for positive
        const isPositive = point.theta > 0;
        const r = isPositive ? Math.round(255 * intensity) : 50;
        const g = 50;
        const b = isPositive ? 50 : Math.round(255 * intensity);
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        
        // Point size based on displacement magnitude
        const pointSize = Math.max(1, Math.min(4, intensity * 3));
        
        ctx.beginPath();
        ctx.arc(point.screenX, point.screenY, pointSize, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Add grid info overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText(`Grid 3D: ${points.length}/${maxPoints} points`, 10, 20);
      ctx.fillText(`θ-scale: ${(props.gammaGeo**3 * props.qSpoilingFactor * props.gammaVdB * Math.sqrt(props.dutyEffectiveFR)).toExponential(2)}`, 10, 35);
      
      setIsRendering(false);
    };
    
    // Throttled animation loop
    const animate = () => {
      render();
      animationRef.current = setTimeout(() => requestAnimationFrame(animate), 100); // 10 FPS
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      setIsRendering(false);
    };
  }, [props]);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={props.width || 400}
        height={props.height || 300}
        className="border border-slate-600 rounded"
        style={{ backgroundColor: '#0a0a0a' }}
      />
      {isRendering && (
        <div className="absolute top-2 right-2 text-xs text-cyan-400">
          Rendering...
        </div>
      )}
    </div>
  );
}