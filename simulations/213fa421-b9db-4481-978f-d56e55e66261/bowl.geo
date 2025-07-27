
// Concave spherical cap (bowl) mesh generation
SetFactory("OpenCASCADE");

// Parameters
base_radius = 0.024999999999999998;
sag_depth = 1.5000000000000002e-7;
radius_of_curvature = 2083.3333334083327;

// Center of the sphere for the concave cap
sphere_center_z = radius_of_curvature - sag_depth;

// Create the full sphere
Sphere(1) = {0, 0, sphere_center_z, radius_of_curvature};

// Create a cylinder to cut the sphere and create the cap
Cylinder(2) = {0, 0, -sag_depth, 0, 0, sag_depth * 2, base_radius};

// Create the bowl by intersecting the sphere with the cylinder
BooleanIntersection(3) = { Volume{1}; Delete; }{ Volume{2}; Delete; };

// Create the flat bottom surface
Disk(4) = {0, 0, 0, base_radius};

// Union the bowl with the flat bottom
BooleanUnion(5) = { Volume{3}; Delete; }{ Surface{4}; Delete; };

// Set mesh characteristic length based on the base radius
characteristic_length = base_radius / 20;
Characteristic Length {1} = characteristic_length;

// Generate 3D mesh
Mesh 3;

// Save as version 2.2 format for SCUFF-EM compatibility
Mesh.MshFileVersion = 2.2;
