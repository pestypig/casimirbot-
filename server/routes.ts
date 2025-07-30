import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scuffemService } from "./services/scuffem";
import { fileManager } from "./services/fileManager";
import { simulationParametersSchema } from "@shared/schema";
import { WebSocket, WebSocketServer } from "ws";
import targetValidationRoutes from "./routes/target-validation.js";

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

  // Add target validation routes
  app.use('/api', targetValidationRoutes);

  // Papers API - JSON endpoint for research documentation
  app.get("/api/papers", (req, res) => {
    const papers = [
      {
        id: 'needle-hull-mk1',
        title: 'Needle Hull Mark 1: 83 MW Casimir Stress Geometry',
        filename: '83 MW Needle Hull Mark 1 update_1753733381119.pdf',
        url: '/documents/83 MW Needle Hull Mark 1 update_1753733381119.pdf',
        year: 2025,
        category: 'Warp Bubble Physics',
        description: 'Comprehensive analysis of the Needle Hull Mk 1 configuration, targeting 1.405×10³ kg exotic mass generation with 83 MW power requirements for theoretical warp bubble applications.',
        version: '2025.1',
        keywords: ['casimir effect', 'warp bubble', 'exotic mass', 'needle hull']
      },
      {
        id: 'geometry-amplified-casimir',
        title: 'Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator',
        filename: 'Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator_1753733560411.pdf',
        url: '/documents/Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator_1753733560411.pdf',
        year: 2025,
        category: 'Dynamic Casimir Effects',
        description: 'Investigation of geometric amplification factors in concave cavity geometries, achieving γ ≈ 25× blue-shift enhancement for dynamic boundary modulation.',
        version: '2025.1',
        keywords: ['dynamic casimir', 'geometric amplification', 'concave resonator', 'blue-shift']
      },
      {
        id: 'time-sliced-strobing',
        title: 'Time-Sliced Sector Strobing Functions as a GR-Valid Proxy',
        filename: 'time-sliced sector strobing functions as a GR-valid proxy_1753733389106.pdf',
        url: '/documents/time-sliced sector strobing functions as a GR-valid proxy_1753733389106.pdf',
        year: 2025,
        category: 'General Relativity',
        description: 'Theoretical framework for sector strobing techniques ensuring General Relativistic validity through time-scale separation and Ford-Roman compliance.',
        version: '2025.1',
        keywords: ['general relativity', 'sector strobing', 'ford-roman', 'time-scale separation']
      },
      {
        id: 'bubble-metrics-checklist',
        title: 'CheckList of Bubble Metric Analysis',
        filename: 'CheckList of Bubble Metric_1753798567838.pdf',
        url: '/documents/CheckList of Bubble Metric_1753798567838.pdf',
        year: 2025,
        category: 'Methodology',
        description: 'Comprehensive verification checklist for warp bubble metric calculations, including quantum inequality bounds and stress-energy tensor validation.',
        version: '2025.1',
        keywords: ['warp bubble', 'metrics', 'verification', 'quantum inequality']
      }
    ];

    res.json({
      count: papers.length,
      papers: papers,
      updated: new Date().toISOString(),
      api_version: "1.0"
    });
  });

  // Serve PDF documents from attached_assets  
  app.use('/documents', (req, res, next) => {
    // Set proper headers for PDF files
    if (req.path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    }
    next();
  }, express.static('attached_assets'));

  return httpServer;
}
