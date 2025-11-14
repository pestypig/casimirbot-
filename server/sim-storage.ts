import { SimulationResult, type InsertSimulationResult } from "@shared/schema";
import { randomUUID } from "node:crypto";

export interface IStorage {
  getSimulation(id: string): Promise<SimulationResult | undefined>;
  createSimulation(simulation: InsertSimulationResult): Promise<SimulationResult>;
  updateSimulation(id: string, updates: Partial<SimulationResult>): Promise<SimulationResult | undefined>;
  getAllSimulations(): Promise<SimulationResult[]>;
  deleteSimulation(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private simulations: Map<string, SimulationResult>;

  constructor() {
    this.simulations = new Map();
  }

  async getSimulation(id: string): Promise<SimulationResult | undefined> {
    return this.simulations.get(id);
  }

  async createSimulation(insertSimulation: InsertSimulationResult): Promise<SimulationResult> {
    const id = randomUUID();
    const simulation: SimulationResult = { ...insertSimulation, id };
    this.simulations.set(id, simulation);
    return simulation;
  }

  async updateSimulation(id: string, updates: Partial<SimulationResult>): Promise<SimulationResult | undefined> {
    const existing = this.simulations.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.simulations.set(id, updated);
    return updated;
  }

  async getAllSimulations(): Promise<SimulationResult[]> {
    return Array.from(this.simulations.values()).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async deleteSimulation(id: string): Promise<boolean> {
    return this.simulations.delete(id);
  }
}

export const storage = new MemStorage();
