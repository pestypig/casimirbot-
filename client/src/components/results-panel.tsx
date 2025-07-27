import { useState } from "react";
import { Download, ChartBar, Folder, Terminal, FileCode, Box, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChartVisualization from "@/components/chart-visualization";
import { SimulationResult } from "@shared/schema";

interface ResultsPanelProps {
  simulation: SimulationResult | null;
  onDownloadFile: (fileId: string) => void;
  onDownloadAll: () => void;
}

export default function ResultsPanel({ simulation, onDownloadFile, onDownloadAll }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState("results");

  if (!simulation) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-center">
          <div className="text-muted-foreground">
            <ChartBar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No simulation data available</p>
            <p className="text-sm">Run a simulation to see results here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { results, generatedFiles, logs } = simulation;

  const formatScientificNotation = (value: number) => {
    if (Math.abs(value) === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = (value / Math.pow(10, exp)).toFixed(3); // Show to 3 decimal places for precision
    return `${mantissa} × 10^${exp}`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "scuffgeo":
        return <FileCode className="h-4 w-4 text-blue-600" />;
      case "mesh":
        return <Box className="h-4 w-4 text-green-600" />;
      case "output":
        return <FileText className="h-4 w-4 text-orange-600" />;
      case "log":
        return <Terminal className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-border">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results" className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Generated Files
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Simulation Logs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="results" className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Energy Results */}
            <div>
              <h3 className="text-base font-semibold mb-4">Casimir Energy</h3>
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-mono font-semibold">
                    {results?.totalEnergy ? formatScientificNotation(results.totalEnergy) : "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">Joules (Total Energy)</div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-mono font-semibold">
                    {results?.energyPerArea ? formatScientificNotation(results.energyPerArea) : "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">J/m² (Energy per unit area)</div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-mono font-semibold">
                    {results?.force ? formatScientificNotation(results.force) : "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">N (Casimir Force)</div>
                </div>
              </div>
            </div>

            {/* Visualization */}
            <div>
              <h3 className="text-base font-semibold mb-4">Energy vs. Gap Distance</h3>
              <ChartVisualization simulation={simulation} />
            </div>
          </div>

          {/* Analysis Summary */}
          {results && (
            <div className="mt-8">
              <h3 className="text-base font-semibold mb-4">Analysis Summary</h3>
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Convergence</div>
                    <div className="font-medium">
                      <Badge variant={results.convergence === "Achieved" ? "default" : "destructive"}>
                        {results.convergence || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Xi Points</div>
                    <div className="font-medium">{results.xiPoints?.toLocaleString() || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Computation Time</div>
                    <div className="font-medium">{results.computeTime || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Error Estimate</div>
                    <div className="font-medium">{results.errorEstimate || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="p-6">
          <h3 className="text-base font-semibold mb-4">Generated Files</h3>
          
          {generatedFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files generated yet</p>
              <p className="text-sm">Files will appear here after simulation completion</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {generatedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-muted-foreground">{file.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{file.size}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadFile(file.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button onClick={onDownloadAll} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download All Files (.zip)
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="logs" className="p-6">
          <h3 className="text-base font-semibold mb-4">Simulation Logs</h3>
          <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs available</p>
                <p className="text-xs">Logs will appear here during simulation</p>
              </div>
            ) : (
              <div>
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
                {simulation.status !== "completed" && simulation.status !== "failed" && (
                  <div className="animate-pulse">█</div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
