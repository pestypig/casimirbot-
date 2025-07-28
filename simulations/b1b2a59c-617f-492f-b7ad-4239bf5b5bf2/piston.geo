
// Flat plate mesh generation
SetFactory("OpenCASCADE");

// Create disk
Disk(1) = {0, 0, 0, 0.024999999999999998};

// Set mesh characteristic length
Characteristic Length {1} = 0.0012499999999999998;

// Generate 2D mesh
Mesh 2;

// Save as version 2.2 format for SCUFF-EM compatibility
Mesh.MshFileVersion = 2.2;
