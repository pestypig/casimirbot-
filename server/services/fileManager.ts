import fs from 'fs/promises';
import path from 'path';

export class FileManager {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'simulations');
  }

  async readFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath);
    return await fs.readFile(fullPath);
  }

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.unlink(fullPath);
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async createZipArchive(simulationId: string): Promise<Buffer> {
    // In a real implementation, this would create a proper ZIP archive
    // For now, return a mock ZIP content
    const mockZipContent = Buffer.from(`Mock ZIP archive for simulation ${simulationId}`);
    return mockZipContent;
  }
}

export const fileManager = new FileManager();
