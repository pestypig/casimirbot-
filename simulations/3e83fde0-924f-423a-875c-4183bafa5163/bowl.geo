
// Simplified bowl mesh using OpenCASCADE for reliability
SetFactory("OpenCASCADE");

// Parameters
base_radius = 0.024999999999999998;
sag_depth = 1.6e-8;
lc = 0.0016666666666666666;

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
