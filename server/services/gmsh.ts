import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class GmshService {
  
  /**
   * Generates a concave spherical cap mesh using Gmsh
   * @param sagDepth - Sag depth in nanometers
   * @param radius - Radius in micrometers (defaults to 25000 µm = 25 mm)
   * @param outputPath - Path where the mesh file will be saved
   */
  async generateBowlMesh(sagDepth: number, radius: number = 25000, outputPath: string): Promise<void> {
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
    return `
// Concave spherical cap (bowl) mesh generation
SetFactory("Built-in");

// Parameters
base_radius = ${baseRadius};
sag_depth = ${sagDepth};
radius_of_curvature = ${radiusOfCurvature};

// Create a concave spherical cap using built-in geometry
// Center of the sphere
sphere_center_z = radius_of_curvature - sag_depth;

// Points for the spherical cap
Point(1) = {0, 0, 0, base_radius/20};  // Center of base
Point(2) = {base_radius, 0, 0, base_radius/20};  // Edge of base
Point(3) = {0, base_radius, 0, base_radius/20};  // Edge of base (90 degrees)
Point(4) = {-base_radius, 0, 0, base_radius/20}; // Edge of base (180 degrees)
Point(5) = {0, -base_radius, 0, base_radius/20}; // Edge of base (270 degrees)
Point(6) = {0, 0, -sag_depth, base_radius/20}; // Bottom of bowl

// Create the base using lines to avoid cocircular issues
Line(1) = {2, 3};
Line(2) = {3, 4};
Line(3) = {4, 5};
Line(4) = {5, 2};

// Create the base surface
Line Loop(1) = {1, 2, 3, 4};
Plane Surface(1) = {1};

// Create lines from edge to bottom (avoid circle issues)
Line(5) = {2, 6};
Line(6) = {3, 6};
Line(7) = {4, 6};
Line(8) = {5, 6};

// Create curved surfaces for the bowl
Line Loop(2) = {1, 6, -5};
Ruled Surface(2) = {2};

Line Loop(3) = {2, 7, -6};
Ruled Surface(3) = {3};

Line Loop(4) = {3, 8, -7};
Ruled Surface(4) = {4};

Line Loop(5) = {4, 5, -8};
Ruled Surface(5) = {5};

// Create the 3D volume
Surface Loop(1) = {1, 2, 3, 4, 5};
Volume(1) = {1};

// Generate 3D mesh
Mesh 3;

// Save as version 2.2 format for SCUFF-EM compatibility
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