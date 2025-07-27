
// Concave spherical cap (bowl) mesh generation
SetFactory("Built-in");

// Parameters
base_radius = 0.024999999999999998;
sag_depth = 2.0000000000000002e-7;
radius_of_curvature = 1562.5000000999996;

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

// Create the base circle
Circle(1) = {2, 1, 3};
Circle(2) = {3, 1, 4};
Circle(3) = {4, 1, 5};
Circle(4) = {5, 1, 2};

// Create the base surface
Line Loop(1) = {1, 2, 3, 4};
Plane Surface(1) = {1};

// Create arcs from edge to bottom
Circle(5) = {2, 1, 6};
Circle(6) = {3, 1, 6};
Circle(7) = {4, 1, 6};
Circle(8) = {5, 1, 6};

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
