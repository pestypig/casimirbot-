/**
 * Module Registry for Casimir-Tile Research Platform
 * Manages loading and coordination between physics modules
 */

export interface CasimirModule {
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  initialize: () => Promise<boolean>;
  calculate: (params: any) => Promise<any>;
  cleanup?: () => Promise<void>;
}

export class ModuleRegistry {
  private modules = new Map<string, CasimirModule>();
  private initialized = new Set<string>();

  /**
   * Register a new physics module
   */
  register(module: CasimirModule): void {
    this.modules.set(module.name, module);
  }

  /**
   * Get available modules
   */
  getAvailable(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Initialize a module and its dependencies
   */
  async initialize(moduleName: string): Promise<boolean> {
    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`Module ${moduleName} not found`);
    }

    // Initialize dependencies first
    for (const dep of module.dependencies) {
      if (!this.initialized.has(dep)) {
        await this.initialize(dep);
      }
    }

    // Initialize the module
    if (!this.initialized.has(moduleName)) {
      const success = await module.initialize();
      if (success) {
        this.initialized.add(moduleName);
      }
      return success;
    }

    return true;
  }

  /**
   * Execute calculation using specified module
   */
  async calculate(moduleName: string, params: any): Promise<any> {
    if (!this.initialized.has(moduleName)) {
      await this.initialize(moduleName);
    }

    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`Module ${moduleName} not found`);
    }

    return module.calculate(params);
  }

  /**
   * Clean up all modules
   */
  async cleanup(): Promise<void> {
    for (const name of this.modules.keys()) {
      const module = this.modules.get(name);
      if (module && this.initialized.has(name) && module.cleanup) {
        await module.cleanup();
      }
    }
    this.initialized.clear();
  }
}

// Global module registry instance
export const moduleRegistry = new ModuleRegistry();

// Import and register physics modules
import { staticCasimirModule } from '../sim_core/static-casimir.js';
import { dynamicCasimirModule } from '../dynamic/dynamic-casimir.js';
import { warpBubbleModule } from '../warp/warp-module.js';

// Register all available modules
moduleRegistry.register(staticCasimirModule);
moduleRegistry.register(dynamicCasimirModule);
moduleRegistry.register(warpBubbleModule);