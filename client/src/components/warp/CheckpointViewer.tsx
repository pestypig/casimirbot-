"use client";
import React, { useEffect, useState } from "react";
import { Check, onCheck, Side, Stage } from "@/lib/checkpoints";

interface CheckpointViewerProps {
  title?: string;
  sides?: Side[];
  stages?: Stage[];
  maxHistory?: number;
}

export default function CheckpointViewer({ 
  title = "DAG Checkpoints", 
  sides = ["REAL", "SHOW"],
  stages = ["input", "expect", "uniforms", "gpu", "frame"],
  maxHistory = 100 
}: CheckpointViewerProps) {
  const [checks, setChecks] = useState<Check[]>([]);

  useEffect(() => {
    const handler = (check: Check) => {
      setChecks(prev => {
        const updated = [check, ...prev].slice(0, maxHistory);
        return updated;
      });
    };

    onCheck(handler);
  }, [maxHistory]);

  // Group by stage and side
  const grouped = checks.reduce((acc, check) => {
    const key = `${check.stage}.${check.side}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(check);
    return acc;
  }, {} as Record<string, Check[]>);

  const getSeverityColor = (sev?: string) => {
    switch (sev) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getPassColor = (pass: boolean) => pass ? 'text-green-400' : 'text-red-400';

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <h4 className="text-sm font-semibold text-white/90 mb-3">{title}</h4>
      
      <div className="grid grid-cols-2 gap-4">
        {sides.map(side => (
          <div key={side} className="space-y-3">
            <h5 className="text-xs font-medium text-white/80 uppercase tracking-wide">{side}</h5>
            
            {stages.map(stage => {
              const stageChecks = grouped[`${stage}.${side}`] || [];
              const latest = stageChecks[0]; // Most recent
              
              return (
                <div key={stage} className="border border-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/70 uppercase">{stage}</span>
                    {latest && (
                      <span className={`text-xs ${getPassColor(latest.pass)}`}>
                        {latest.pass ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                  
                  {latest ? (
                    <div className="space-y-1">
                      <div className="text-xs text-white/90">{latest.msg}</div>
                      {latest.expect !== undefined && (
                        <div className="text-xs text-white/60">
                          expect: {typeof latest.expect === 'object' ? JSON.stringify(latest.expect) : String(latest.expect)}
                        </div>
                      )}
                      {latest.actual !== undefined && (
                        <div className="text-xs text-white/60">
                          actual: {typeof latest.actual === 'object' ? JSON.stringify(latest.actual) : String(latest.actual)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-white/40">No data</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Recent activity */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <h6 className="text-xs font-medium text-white/70 mb-2">Recent Activity</h6>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {checks.slice(0, 10).map((check, i) => (
            <div key={`${check.at}-${i}`} className="flex items-center gap-2 text-xs">
              <span className={getPassColor(check.pass)}>{check.pass ? '✓' : '✗'}</span>
              <span className="text-white/50">{check.side}</span>
              <span className="text-white/50">{check.stage}</span>
              <span className="text-white/70 flex-1">{check.msg}</span>
              <span className="text-white/40">{new Date(check.at).toLocaleTimeString().slice(-8)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}