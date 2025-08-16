# Casimir Effect Simulation Tool

## Overview

This application is a web-based tool for simulating the Casimir effect, providing a user-friendly interface for setting up simulations, generating geometry files, and visualizing results. It integrates with the SCUFF-EM computational electromagnetics package to perform calculations for various geometric arrangements (sphere, parallel plates, bowl). The project aims to evolve into a comprehensive research platform for advanced Casimir effect studies, including dynamic effects, array physics, and integration with real SCUFF-EM binaries and the Einstein Toolkit.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript.
- **UI**: shadcn/ui (built on Radix UI) and Tailwind CSS for theming.
- **State Management**: React Query for server state.
- **Routing**: Wouter.
- **Forms**: React Hook Form with Zod validation.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Build Tool**: Vite (dev) and esbuild (prod).
- **Real-time**: WebSocket connections for simulation updates.
- **File Management**: Local filesystem for simulation files.

### Data Storage
- **Primary**: In-memory `Map` for development.
- **Future Database**: Drizzle ORM configured for PostgreSQL.
- **Session Storage**: PostgreSQL session store (connect-pg-simple) for deployment.
- **Schema**: Shared Zod schemas for type safety.

### Key Features & Design Decisions
- **SCUFF-EM Integration**: Service layer for geometry file generation (.scuffgeo) and simulation execution, including mesh management for different geometries.
- **Real-time Simulation Feedback**: WebSocket-based progress tracking and status updates during simulation execution.
- **User Interface**: Includes a parameter panel for configuration, a status tracker, and interactive results display using Recharts.
- **API Layer**: RESTful endpoints for simulation management, static file serving for downloads, and a WebSocket server for real-time communication. Comprehensive error handling.
- **Data Flow**: User input (React forms) -> Zod validation -> Express backend (simulation creation, file generation) -> Background simulation (WebSocket updates) -> Results processing -> Frontend visualization.
- **Physics Integration**: Implements authentic SCUFF-EM physics, including Lifshitz formula for parallel plates, Proximity Force Approximation (PFA) for curved geometries, and Matsubara formalism for temperature corrections. Energy formatting uses exponential notation.
- **Casimir-Tile Research Platform Foundation**: Modular architecture supporting expansion into dynamic Casimir effects, array physics, and advanced materials.
- **UI/UX Decisions**: Incorporates radar charts, traffic light systems, and individual metric cards for visualizing simulation results and compliance. Interactive mesh visualization and cross-section rendering.
- **Needle Hull Preset**: A pre-configured simulation setup based on specific research papers, including detailed geometric and physical parameters for warp bubble research. This integrates complex amplification factors (geometric, Q-enhancement, Van-den-Broeck) and power mitigation strategies.
- **Quality Assurance System**: Unit tests, real-time validation UI (Xi points, error tolerance), golden standards for regression testing, and convergence validation.
- **Target-Value Ledger Verification**: Verifies simulation results against research paper specifications for exotic mass and power, using a traffic-light validation system.
- **Multi-Dimensional Design Explorer**: Interactive phase diagram (heat-map) allowing real-time exploration of viable design regions based on adjustable physics parameters (e.g., geometric amplification, Q-factor, duty cycle, sag depth) and configurable constraint tolerances (power, mass, quantum safety). Supports ellipsoid geometry for larger hulls.
- **Live Energy Pipeline**: Transparent, step-by-step display of physics equations with real-time parameter substitution, showing the calculation flow from static Casimir to power and mass generation.
- **Operational Modes**: Comprehensive system for switching between predefined operational modes (e.g., Hover, Cruise, Emergency, Standby), each with specific physical parameters and real-time calculation updates.
- **Documentation System**: Integrated access to research papers, physics guides, and API references.
- **3D Spacetime Curvature Visualization**: Real-time WebGL-based grid rendering showing authentic Natário warp bubble deformation effects with full operational mode integration. Features three orthogonal sheets (XY cyan floor, XZ magenta wall, YZ yellow wall) displaying physics-accurate parameter mapping responding to duty cycle, power output, and operational mode transitions. Energy pipeline successfully connected to 3D visualization with all 4 debugging checkpoints operational (January 2025). York-time coloring system implemented with blue (contraction) to red/orange (expansion) gradients and 4x visual gain multiplier for enhanced visibility (January 2025). Proof panel diagnostics fixed to read from correct parameter sources with numeric coercion for all physics values (January 2025).
- **Zen Long Toasts System**: Educational feedback system providing theory explanations and philosophical reflections for all UI interactions. Includes mode switching, parameter adjustments, pulse execution, and diagnostics with authentic physics context and Moving-Zen wisdom quotes. Toast messages now display correct mode-specific physics values with real-time parameter calculation for each operational mode transition (January 2025).
- **Luma Atmospheric System**: Cosmic guardian star background with whisper overlay system for enhanced user experience. Features BackgroundLuma component with CSS-based starfield and floating PNG implementation (Three.js integration attempted but blocked by React version conflicts), LumaWhisper typewriter-style notifications, event bus architecture for contextual zen guidance, and strategic triggers for mode switching, navigation, and route planning interactions. Assets stored in /public/luma/ with Butler.glb 3D model and Luma_29.png icon. Fully operational with 18% opacity, 6px blur, gentle animations, and 50-star dynamic starfield. Zen whispers trigger on mode changes with authentic philosophical context.
- **Mission Start Portal**: Feather-light entry page at root `/` route with 4 mission profiles (Radiant Optimist, Engineer, Diplomat, Strategist). Progressive disclosure interface showing profile icons initially, then revealing zen quotes, physics focus areas, and navigation on selection. Main application moved to `/bridge` route for clean URL structure (January 2025).
- **Enhanced UI Components (January 2025)**: Added reusable Tooltip component for contextual explanations and interactive AmplificationPanel displaying real-time multiplication chains (γ_geo × q_spoiling × γ_VdB). Pipeline Parameters section now includes tooltips for Van den Broeck pocket amplification with scientific explanations. Amplification Panel shows live physics calculations with color-coded factor chips and logarithmic progress bars for immediate visual understanding.
- **Canvas-Based Casimir Tile Grid (January 2025)**: Replaced div-based sector visualization with high-performance Canvas component featuring 60fps sector-sweep animation, physics-driven strobing display, and contained 320×170 scalable panel. Real-time sector activation visualization with trailing effects, live legend showing active fraction, sweep frequency, and tiles per sector. Fully integrated with authentic strobing physics calculations.
- **Strobing Physics Corrections (January 2025)**: Major breakthrough fixing fundamental strobing calculation errors. Metrics API now reports actual concurrent sectors (S = 1 for hover, 400 for cruise) instead of fake 78% active tiles (873M). Implemented physics-first calculations with femtosecond burst duty (0.5fs), effective duty for Ford-Roman sampling, and proper time-slicing mathematics. Results: exotic mass reduced from ~4×10¹² kg to ~31M kg (10⁵ improvement), power reduced to realistic ~0.023 MW in hover mode. Added strobing transparency fields: activeFraction (S/N ≈ 8.9×10⁻¹⁰), dutyBurst, dutyEffectiveFR, strobeHz (2000Hz), sectorPeriod_ms (0.5ms).
- **Sector-Aware Ford-Roman ζ Calculation (January 2025)**: Complete redesign implementing time-sliced strobing with sector scaling. Fixed consistency issues where different modes had different ζ calculations. New formula: ζ = 1/(dutyEffectiveFR × √Q) where dutyEffectiveFR = dutyInstant × activeFraction, and dutyInstant = dutyCycle × qSpoilingFactor. Results: hover mode (1/400 sectors) ζ ≈ 7.14e-5 (PASS), cruise mode (400/400 sectors) ζ ≈ 0.32-1.28 depending on duty. Added single source of truth with __sectors and __fr calculation caches. System status now reflects proper Ford-Roman compliance across all operational modes. HUD and Tile Grid read from same physics source ensuring consistency.
- **Role-Based Station System (January 2025)**: Complete personal workstation system with 4 mission profiles (Radiant Optimist 🌞, Engineer ⚙️, Diplomat 🐼, Strategist 🐒). Each profile gets personalized station at `/station/role` with role-appropriate metrics panels, live physics data integration via useMetrics hook (2-second polling), sticky navigation bar, and zen-themed UI. Progressive disclosure flow: Profile Selection → Personal Station → Bridge Access. All stations display authentic real-time data from physics engine including energy output, exotic mass, Ford-Roman compliance, sector strobing, and amplification chains. Clean URL structure with convenience routes and seamless navigation between station/bridge modes.
- **Hull Geometry Accuracy Patch (January 2025)**: Fixed hardcoded 82m hull radius in time-scale (TS) calculations, now using actual 1.007 km Needle Hull dimensions (1007×264×173 m). Implemented proper geometric time-scale calculations with both conservative (longest dimension) and typical (geometric mean) approaches. Added hull geometry exposure in metrics API and station interfaces. TS ratio now accurately reflects ~50,000 instead of misleading ~4,100 value, ensuring scientific accuracy across all physics calculations and UI displays.
- **Visual-Physics Alignment Completed (January 2025)**: Successfully integrated authentic ellipsoidal needle hull geometry into 3D WebGL visualization. Updated WarpVisualizer component to use hull semi-axes (a=503.5m, b=132m, c=86.5m) from metrics API instead of spherical coordinates. WebGL renderer now displays scientifically accurate ellipsoidal warp bubble matching 1007×264×173 m needle hull physics calculations. Fixed useMetrics hook integration in helix-core.tsx for live hull data access.

## Recent Updates (January 2025)

### Interface Enhancement & User Experience
- **Mission Portal Integration**: Successfully deployed root `/` route with 4-profile mission selector, main application relocated to `/bridge` for clean URL mapping
- **Role-Based Station System**: Complete personal workstation implementation with live metrics integration, sticky navigation, and role-appropriate physics dashboards
- **Live Physics Visualization**: Implemented Canvas-based Casimir Tile Grid with real-time sector animation and authentic strobing physics display
- **Interactive Explanations**: Added Tooltip system and AmplificationPanel for immediate understanding of complex physics parameters with hover-based education
- **Performance Optimization**: Canvas rendering handles 400 sectors at 60fps with smooth trailing effects and real-time parameter updates

## External Dependencies

- **@neondatabase/serverless**: Database connection (for Neon PostgreSQL).
- **drizzle-orm**: Database ORM.
- **@tanstack/react-query**: Server state management.
- **react-hook-form**: Form handling and validation.
- **recharts**: Data visualization and charting.
- **@radix-ui/***: UI primitives.
- **tailwindcss**: CSS framework.
- **class-variance-authority**: Component variants.
- **cmdk**: Command palette.
- **tsx**: TypeScript execution.
- **vite**: Frontend build tool.
- **esbuild**: JavaScript bundler.