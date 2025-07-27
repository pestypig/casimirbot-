import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface MeshVisualizationProps {
  className?: string;
}

export function MeshVisualization({ className }: MeshVisualizationProps) {
  const [sagDepth1, setSagDepth1] = useState<number>(0);
  const [sagDepth2, setSagDepth2] = useState<number>(50);
  const [crossSectionData, setCrossSectionData] = useState<{
    depth1: { points: Array<{x: number, y: number}>, sagDepth: number };
    depth2: { points: Array<{x: number, y: number}>, sagDepth: number };
  } | null>(null);

  // Generate cross-section points for bowl geometry
  const generateCrossSection = (sagDepth: number) => {
    const radius = 25; // 25 mm radius as specified
    const sagDepthMm = sagDepth / 1000000; // Convert nm to mm
    const points: Array<{x: number, y: number}> = [];
    
    if (sagDepth === 0) {
      // Flat surface
      for (let x = -radius; x <= radius; x += 0.5) {
        points.push({ x, y: 0 });
      }
    } else {
      // Calculate radius of curvature for spherical cap
      const radiusOfCurvature = (radius * radius + sagDepthMm * sagDepthMm) / (2 * sagDepthMm);
      const centerY = radiusOfCurvature - sagDepthMm;
      
      // Generate points along the spherical arc
      for (let x = -radius; x <= radius; x += 0.5) {
        if (Math.abs(x) <= radius) {
          // Calculate y coordinate on sphere
          const discriminant = radiusOfCurvature * radiusOfCurvature - x * x;
          if (discriminant >= 0) {
            const y = centerY - Math.sqrt(discriminant);
            points.push({ x, y: -y }); // Negative y for concave bowl
          }
        }
      }
    }
    
    return points;
  };

  const updateCrossSections = () => {
    const data1 = generateCrossSection(sagDepth1);
    const data2 = generateCrossSection(sagDepth2);
    
    setCrossSectionData({
      depth1: { points: data1, sagDepth: sagDepth1 },
      depth2: { points: data2, sagDepth: sagDepth2 }
    });
  };

  useEffect(() => {
    updateCrossSections();
  }, [sagDepth1, sagDepth2]);

  // Create SVG path from points
  const createPath = (points: Array<{x: number, y: number}>) => {
    if (points.length === 0) return '';
    
    const pathCommands = points.map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      // Scale and translate for SVG viewport
      const scaledX = (point.x + 25) * 8; // Scale to fit 400px width
      const scaledY = 150 + point.y * 1000; // Scale and center vertically
      return `${command} ${scaledX} ${scaledY}`;
    });
    
    return pathCommands.join(' ');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bowl Geometry Cross-Section Visualization</CardTitle>
        <CardDescription>
          Compare bowl curvature at different sag depths (25 mm radius)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sagDepth1">Sag Depth 1 (nm)</Label>
              <Input
                id="sagDepth1"
                type="number"
                min="0"
                max="1000"
                step="1"
                value={sagDepth1}
                onChange={(e) => setSagDepth1(parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sagDepth2">Sag Depth 2 (nm)</Label>
              <Input
                id="sagDepth2"
                type="number"
                min="0"
                max="1000"
                step="1"
                value={sagDepth2}
                onChange={(e) => setSagDepth2(parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          </div>

          <Button onClick={updateCrossSections} className="w-full">
            Update Cross-Sections
          </Button>

          <Separator />

          {/* Visualization */}
          {crossSectionData && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Cross-Section Comparison</h3>
                <p className="text-sm text-muted-foreground">
                  Blue: {crossSectionData.depth1.sagDepth} nm | Red: {crossSectionData.depth2.sagDepth} nm
                </p>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <svg width="400" height="200" viewBox="0 0 400 200" className="mx-auto">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="400" height="200" fill="url(#grid)" />
                  
                  {/* Center line */}
                  <line x1="200" y1="0" x2="200" y2="200" stroke="#ccc" strokeWidth="1" strokeDasharray="5,5" />
                  
                  {/* Horizontal reference line */}
                  <line x1="0" y1="150" x2="400" y2="150" stroke="#ccc" strokeWidth="1" strokeDasharray="5,5" />
                  
                  {/* Cross-section curves */}
                  <path
                    d={createPath(crossSectionData.depth1.points)}
                    stroke="#2563eb"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d={createPath(crossSectionData.depth2.points)}
                    stroke="#dc2626"
                    strokeWidth="2"
                    fill="none"
                  />
                  
                  {/* Axis labels */}
                  <text x="200" y="15" textAnchor="middle" className="text-xs fill-gray-600">
                    Cross-Section View
                  </text>
                  <text x="20" y="195" className="text-xs fill-gray-600">-25mm</text>
                  <text x="380" y="195" className="text-xs fill-gray-600">+25mm</text>
                  <text x="10" y="155" className="text-xs fill-gray-600">0</text>
                </svg>
              </div>
              
              {/* Data display */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                    Sag Depth: {crossSectionData.depth1.sagDepth} nm
                  </h4>
                  <p className="text-blue-600 dark:text-blue-300">
                    {crossSectionData.depth1.sagDepth === 0 ? 'Flat surface' : `Curved with ${crossSectionData.depth1.points.length} points`}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Sag Depth: {crossSectionData.depth2.sagDepth} nm
                  </h4>
                  <p className="text-red-600 dark:text-red-300">
                    {crossSectionData.depth2.sagDepth === 0 ? 'Flat surface' : `Curved with ${crossSectionData.depth2.points.length} points`}
                  </p>
                </div>
              </div>
              
              {/* Curvature analysis */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Curvature Analysis
                </h4>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {crossSectionData.depth1.sagDepth > 0 && (
                    <p>• Depth 1 radius of curvature: {
                      ((25 * 25 + (crossSectionData.depth1.sagDepth / 1000000) * (crossSectionData.depth1.sagDepth / 1000000)) / 
                       (2 * (crossSectionData.depth1.sagDepth / 1000000))).toFixed(2)
                    } mm</p>
                  )}
                  {crossSectionData.depth2.sagDepth > 0 && (
                    <p>• Depth 2 radius of curvature: {
                      ((25 * 25 + (crossSectionData.depth2.sagDepth / 1000000) * (crossSectionData.depth2.sagDepth / 1000000)) / 
                       (2 * (crossSectionData.depth2.sagDepth / 1000000))).toFixed(2)
                    } mm</p>
                  )}
                  <p>• Maximum depth difference: {Math.abs(crossSectionData.depth2.sagDepth - crossSectionData.depth1.sagDepth)} nm</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}