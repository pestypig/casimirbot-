"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEnergyPipeline, type EnergyPipelineState } from "@/hooks/use-energy-pipeline";

interface LumaPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LumaPanel({ isOpen, onClose }: LumaPanelProps) {
  const { data: pipeline } = useEnergyPipeline();
  
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-16 right-4 z-50 w-96 max-w-[90vw]">
      <Card className="border-cyan-300/30 bg-slate-900/95 text-slate-100 shadow-2xl backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" className="text-cyan-200">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <rect
                    key={i}
                    x="11.5"
                    y="1"
                    width="1"
                    height="3"
                    fill="currentColor"
                    transform={`rotate(${i * 45} 12 12)`}
                  />
                ))}
              </svg>
              <CardTitle className="text-lg text-cyan-100">Luma</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="now" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="now" className="data-[state=active]:bg-cyan-600/20">
                Now
              </TabsTrigger>
              <TabsTrigger value="theory" className="data-[state=active]:bg-cyan-600/20">
                Theory
              </TabsTrigger>
              <TabsTrigger value="zen" className="data-[state=active]:bg-cyan-600/20">
                Zen
              </TabsTrigger>
            </TabsList>
            <TabsContent value="now" className="space-y-3 mt-4">
              <div className="text-sm text-slate-300">
                <p className="font-medium text-cyan-200">Current Status</p>
                {pipeline ? (
                  <>
                    <p className="capitalize">{(pipeline as EnergyPipelineState).currentMode} mode active. Form held at {((pipeline as EnergyPipelineState).dutyCycle * 100).toFixed(1)}% duty.</p>
                    <p>ζ = {((pipeline as EnergyPipelineState).zeta?.toFixed(3) ?? '0.000')} ({(pipeline as EnergyPipelineState).zeta < 0.05 ? 'quantum safety maintained' : 'approaching limits'})</p>
                    <p>TS ratio = {((pipeline as EnergyPipelineState).TS_ratio / 1000).toFixed(1)}k ({(pipeline as EnergyPipelineState).TS_ratio > 100 ? 'homogenized GR regime' : 'classical regime'})</p>
                    <p className="text-xs text-slate-400 mt-2">
                      Power: {((pipeline as EnergyPipelineState).P_avg / 1e6).toFixed(1)} MW • Mass: {((pipeline as EnergyPipelineState).M_exotic / 1000).toFixed(1)} t
                    </p>
                  </>
                ) : (
                  <p>Loading status...</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="theory" className="space-y-3 mt-4">
              <div className="text-sm text-slate-300">
                <p className="font-medium text-cyan-200">Natário Mechanics</p>
                <p>The duty cycle controls spacetime curvature amplitude through:</p>
                <code className="block bg-slate-800 p-2 rounded text-xs mt-2 text-cyan-100">
                  β = γ_geo × Q_burst × (Δa/a)
                </code>
                <p className="text-xs mt-2">Lower duty = stable form. Higher duty = more thrust.</p>
              </div>
            </TabsContent>
            <TabsContent value="zen" className="space-y-3 mt-4">
              <div className="text-sm text-slate-300">
                <p className="font-medium text-cyan-200">Moving Zen</p>
                <p className="italic">"Distance is not in space, but in intention."</p>
                <p className="mt-3">Form comes before speed. Perfect timing shapes perfect action.</p>
                <p className="text-xs text-slate-400 mt-3">— The Way of Maai</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}