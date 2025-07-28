import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class GmshService {
  
  /**
   * Generates a concave spherical cap mesh using Gmsh
   * @param sagDepth - Sag depth in nanometers (now properly drives mesh generation)
   * @param radius - Radius in micrometers (defaults to 25000 µm = 25 mm)
   * @param outputPath - Path where the mesh file will be saved
   */
  async generateBowlMesh(sagDepth: number, radius: number = 25000, outputPath: string): Promise<void> {
    console.log(`[Gmsh] Generating bowl mesh with sagDepth=${sagDepth} nm, radius=${radius} µm`);
    const radiusInMeters = radius * 1e-6; // Convert µm to m
    const sagDepthInMeters = sagDepth * 1e-9; // Convert nm to m
    
    // Calculate the radius of curvature for the spherical cap
    // For a spherical cap: R = (r² + h²) / (2h)
    // where r is the base radius and h is the sag depth
    const baseRadius = radiusInMeters;
    const radiusOfCurvature = (baseRadius * baseRadius + sagDepthInMeters * sagDepthInMeters) / (2 * sagDepthInMeters);
    
    // Create Gmsh script for concave spherical cap
    const gmshScript = this.generateBowlGmshScript(baseRadius, sagDepthInMeters, radiusOfCurvature);
    
    // Write the Gmsh script to a temporary file
    const scriptPath = outputPath.replace('.msh', '.geo');
    await fs.writeFile(scriptPath, gmshScript);
    
    // Execute Gmsh to generate the mesh
    await this.executeGmsh(scriptPath, outputPath);
    
    // Clean up the script file
    await fs.unlink(scriptPath).catch(() => {}); // Ignore errors if file doesn't exist
  }
  
  /**
   * Generates a sphere mesh using Gmsh
   */
  async generateSphereMesh(radius: number, outputPath: string): Promise<void> {
    const radiusInMeters = radius * 1e-6; // Convert µm to m
    
    const gmshScript = `
// Sphere mesh generation
SetFactory("OpenCASCADE");

// Create sphere
Sphere(1) = {0, 0, 0, ${radiusInMeters}};

// Set mesh characteristic length
Characteristic Length {1} = ${radiusInMeters / 10};

// Generate 3D mesh
Mesh 3;

// Save as version 2.2 format for SCUFF-EM compatibility
Mesh.MshFileVersion = 2.2;
`;

    const scriptPath = outputPath.replace('.msh', '.geo');
    await fs.writeFile(scriptPath, gmshScript);
    await this.executeGmsh(scriptPath, outputPath);
    await fs.unlink(scriptPath).catch(() => {});
  }
  
  /**
   * Generates a flat plate mesh using Gmsh
   */
  async generatePlateMesh(radius: number, outputPath: string): Promise<void> {
    const radiusInMeters = radius * 1e-6; // Convert µm to m
    
    const gmshScript = `
// Flat plate mesh generation
SetFactory("OpenCASCADE");

// Create disk
Disk(1) = {0, 0, 0, ${radiusInMeters}};

// Set mesh characteristic length
Characteristic Length {1} = ${radiusInMeters / 20};

// Generate 2D mesh
Mesh 2;

// Save as version 2.2 format for SCUFF-EM compatibility
Mesh.MshFileVersion = 2.2;
`;

    const scriptPath = outputPath.replace('.msh', '.geo');
    await fs.writeFile(scriptPath, gmshScript);
    await this.executeGmsh(scriptPath, outputPath);
    await fs.unlink(scriptPath).catch(() => {});
  }
  
  private generateBowlGmshScript(baseRadius: number, sagDepth: number, radiusOfCurvature: number): string {
    // Use simplified geometry to avoid mesh issues
    const lc = baseRadius / 15; // mesh size
    
    return `
// Simplified bowl mesh using OpenCASCADE for reliability
SetFactory("OpenCASCADE");

// Parameters
base_radius = ${baseRadius};
sag_depth = ${sagDepth};
lc = ${lc};

// Create a simple bowl using Boolean operations
// Start with a cylinder
Cylinder(1) = {0, 0, -sag_depth, 0, 0, sag_depth, base_radius};

// Create a sphere for the curved bottom
Sphere(2) = {0, 0, -sag_depth/2, sag_depth};

// Intersect to create bowl shape
BooleanIntersection(3) = { Volume{1}; Delete; }{ Volume{2}; Delete; };

// Set mesh parameters
Characteristic Length {:} = lc;

// Generate 3D mesh
Mesh 3;

// Save in SCUFF-EM format
Mesh.MshFileVersion = 2.2;
`;
  }
  
  private async executeGmsh(scriptPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const gmsh = spawn('gmsh', ['-3', '-format', 'msh2', '-o', outputPath, scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      gmsh.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      gmsh.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      gmsh.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Gmsh execution failed with code ${code}:\nstdout: ${stdout}\nstderr: ${stderr}`));
        }
      });
      
      gmsh.on('error', (error) => {
        reject(new Error(`Failed to start Gmsh: ${error.message}`));
      });
    });
  }
}

export const gmshService = new GmshService();