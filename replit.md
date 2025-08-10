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
- **3D Spacetime Curvature Visualization**: Real-time WebGL-based grid rendering with dual warp profiles - symmetric Natário (HOVER mode) and asymmetric Alcubierre directional compression (CRUISE mode). Features three orthogonal cage sheets (XY cyan floor, XZ magenta wall, YZ yellow wall) centered through bubble origin with proper 3D radius calculation and perspective camera viewing. Energy pipeline fully connected with mode-dependent physics profiles, amplitude clamping, and bubble-hugging cage geometry (January 2025).

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