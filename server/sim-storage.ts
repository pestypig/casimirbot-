import { SimulationResult, type InsertSimulationResult } from "@shared/schema";
import { randomUUID } from "node:crypto";
import {
  deleteSimulationById,
  getSimulationById,
  listSimulations,
  saveSimulation,
} from "./db/simulations";

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

class DbStorage implements IStorage {
  async getSimulation(id: string): Promise<SimulationResult | undefined> {
    return (await getSimulationById(id)) ?? undefined;
  }

  async createSimulation(
    insertSimulation: InsertSimulationResult,
  ): Promise<SimulationResult> {
    const id = randomUUID();
    return saveSimulation({ ...insertSimulation, id });
  }

  async updateSimulation(
    id: string,
    updates: Partial<SimulationResult>,
  ): Promise<SimulationResult | undefined> {
    const existing = await getSimulationById(id);
    if (!existing) return undefined;
    const merged: SimulationResult = { ...existing, ...updates, id };
    return saveSimulation(merged);
  }

  async getAllSimulations(): Promise<SimulationResult[]> {
    return listSimulations();
  }

  async deleteSimulation(id: string): Promise<boolean> {
    return deleteSimulationById(id);
  }
}

const shouldUseInMemory = (): boolean =>
  process.env.USE_INMEM_SIMULATION === "1";

const memStorage = new MemStorage();
const dbStorage = new DbStorage();

const withFallback = async <T>(
  label: string,
  fn: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    console.warn(`[sim-storage] ${label} failed, using in-memory fallback`, error);
    return fallback();
  }
};

export const storage: IStorage = {
  async getSimulation(id: string): Promise<SimulationResult | undefined> {
    if (shouldUseInMemory()) {
      return memStorage.getSimulation(id);
    }
    return withFallback(
      "get",
      () => dbStorage.getSimulation(id),
      () => memStorage.getSimulation(id),
    );
  },
  async createSimulation(
    simulation: InsertSimulationResult,
  ): Promise<SimulationResult> {
    if (shouldUseInMemory()) {
      return memStorage.createSimulation(simulation);
    }
    return withFallback(
      "create",
      () => dbStorage.createSimulation(simulation),
      () => memStorage.createSimulation(simulation),
    );
  },
  async updateSimulation(
    id: string,
    updates: Partial<SimulationResult>,
  ): Promise<SimulationResult | undefined> {
    if (shouldUseInMemory()) {
      return memStorage.updateSimulation(id, updates);
    }
    return withFallback(
      "update",
      () => dbStorage.updateSimulation(id, updates),
      () => memStorage.updateSimulation(id, updates),
    );
  },
  async getAllSimulations(): Promise<SimulationResult[]> {
    if (shouldUseInMemory()) {
      return memStorage.getAllSimulations();
    }
    return withFallback(
      "list",
      () => dbStorage.getAllSimulations(),
      () => memStorage.getAllSimulations(),
    );
  },
  async deleteSimulation(id: string): Promise<boolean> {
    if (shouldUseInMemory()) {
      return memStorage.deleteSimulation(id);
    }
    return withFallback(
      "delete",
      () => dbStorage.deleteSimulation(id),
      () => memStorage.deleteSimulation(id),
    );
  },
};
