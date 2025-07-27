import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scuffemService } from "./services/scuffem";
import { fileManager } from "./services/fileManager";
import { simulationParametersSchema } from "@shared/schema";
import { WebSocket, WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time simulation updates
  // Only set up WebSocket in production or when explicitly enabled
  let wss: WebSocketServer | null = null;
  const connections = new Map<string, WebSocket>();

  if (process.env.NODE_ENV === "production" || process.env.ENABLE_WS === "true") {
    wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws' // Use a specific path to avoid conflicts
    });

    wss.on('connection', (ws, req) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const simulationId = url.searchParams.get('simulationId');
      
      if (simulationId) {
        connections.set(simulationId, ws);
        
        ws.on('close', () => {
          connections.delete(simulationId);
        });
      }
    });
  }

  // Get all simulations
  app.get("/api/simulations", async (req, res) => {
    try {
      const simulations = await storage.getAllSimulations();
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch simulations" 
      });
    }
  });

  // Get specific simulation
  app.get("/api/simulations/:id", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }
      res.json(simulation);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch simulation" 
      });
    }
  });

  // Create new simulation
  app.post("/api/simulations", async (req, res) => {
    try {
      const validatedData = simulationParametersSchema.parse(req.body);
      
      const simulation = await storage.createSimulation({
        parameters: validatedData,
        status: "pending",
        startTime: new Date(),
        generatedFiles: [],
        logs: []
      });

      res.status(201).json(simulation);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid simulation parameters" 
      });
    }
  });

  // Start simulation
  app.post("/api/simulations/:id/start", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }

      // Update status to generating
      await storage.updateSimulation(req.params.id, { status: "generating" });

      // Get WebSocket connection for this simulation
      const ws = connections.get(req.params.id);

      // Start simulation in background
      scuffemService.runSimulation(
        simulation.parameters,
        req.params.id,
        (message: string) => {
          // Send progress updates via WebSocket
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'progress', message }));
          }
          
          // Also store in logs
          storage.updateSimulation(req.params.id, {
            logs: [...simulation.logs, message]
          });
        }
      ).then(async (result) => {
        if (result.success) {
          // Get generated files
          const generatedFiles = await scuffemService.getSimulationFiles(req.params.id);
          
          await storage.updateSimulation(req.params.id, {
            status: "completed",
            endTime: new Date(),
            results: result.results,
            generatedFiles
          });

          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'completed', results: result.results }));
          }
        } else {
          await storage.updateSimulation(req.params.id, {
            status: "failed",
            endTime: new Date(),
            error: result.error
          });

          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'error', error: result.error }));
          }
        }
      }).catch(async (error) => {
        await storage.updateSimulation(req.params.id, {
          status: "failed",
          endTime: new Date(),
          error: error.message
        });

        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', error: error.message }));
        }
      });

      res.json({ message: "Simulation started" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to start simulation" 
      });
    }
  });

  // Generate .scuffgeo file only
  app.post("/api/simulations/:id/generate", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }

      const scuffgeoContent = scuffemService.generateScuffgeoContent(simulation.parameters);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="geometry.scuffgeo"');
      res.send(scuffgeoContent);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate .scuffgeo file" 
      });
    }
  });

  // Download file
  app.get("/api/simulations/:id/files/:fileId", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }

      const file = simulation.generatedFiles.find(f => f.id === req.params.fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const fileContent = await fileManager.readFile(file.path);
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.send(fileContent);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to download file" 
      });
    }
  });

  // Download all files as ZIP
  app.get("/api/simulations/:id/download", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }

      const zipContent = await fileManager.createZipArchive(req.params.id);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="simulation-${req.params.id}.zip"`);
      res.send(zipContent);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create ZIP archive" 
      });
    }
  });

  // Delete simulation
  app.delete("/api/simulations/:id", async (req, res) => {
    try {
      const success = await storage.deleteSimulation(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Simulation not found" });
      }
      res.json({ message: "Simulation deleted" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete simulation" 
      });
    }
  });

  return httpServer;
}
