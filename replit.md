# Casimir Effect Simulation Tool

## Overview
This web-based application simulates the Casimir effect, allowing users to configure simulations, generate geometry files, and visualize results. It integrates with the SCUFF-EM computational electromagnetics package for calculations across various geometries (sphere, parallel plates, bowl). The long-term vision is a comprehensive research platform supporting dynamic effects, array physics, and integration with SCUFF-EM binaries and the Einstein Toolkit. The project also lays the foundation for advanced studies, including warp bubble research using pre-configured "Needle Hull" simulations and interactive exploration of design parameters.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript.
- **UI**: shadcn/ui (Radix UI) and Tailwind CSS.
- **State Management**: React Query.
- **Routing**: Wouter.
- **Forms**: React Hook Form with Zod validation.
- **Visualization**: Recharts for data display, WebGL for 3D spacetime curvature visualization, Canvas for Casimir Tile Grid.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Build Tool**: Vite (dev) and esbuild (prod).
- **Real-time**: WebSocket for simulation updates.
- **File Management**: Local filesystem for simulation files.

### Data Storage
- **Development**: In-memory `Map`.
- **Production**: Drizzle ORM configured for PostgreSQL, with PostgreSQL session store.
- **Shared Schemas**: Zod for type safety.

### Key Features & Design Decisions
- **SCUFF-EM Integration**: Service layer for generating `.scuffgeo` files and executing simulations, including mesh management.
- **Real-time Feedback**: WebSocket-based progress and status updates during simulations.
- **Physics Integration**: Implements authentic SCUFF-EM physics, including Lifshitz formula, Proximity Force Approximation (PFA), and Matsubara formalism. Energy formatting uses exponential notation.
- **Modular Architecture**: Designed for expansion into dynamic Casimir effects, array physics, and advanced materials.
- **UI/UX**: Radar charts, traffic light systems, individual metric cards, interactive mesh visualization, and cross-section rendering.
- **Needle Hull Preset**: Pre-configured simulation for warp bubble research, incorporating geometric and physical parameters, amplification factors (geometric, Q-enhancement, Van-den-Broeck), and power mitigation.
- **Quality Assurance**: Unit tests, real-time UI validation, golden standards for regression testing, and convergence validation.
- **Target-Value Ledger Verification**: Verifies simulation results against research paper specifications for exotic mass and power using a traffic-light system.
- **Multi-Dimensional Design Explorer**: Interactive phase diagram (heatmap) for real-time exploration of viable design regions based on adjustable physics parameters and configurable constraint tolerances (power, mass, quantum safety). Supports ellipsoid geometry.
- **Live Energy Pipeline**: Step-by-step display of physics equations with real-time parameter substitution, showing calculation flow.
- **Operational Modes**: System for switching between predefined modes (e.g., Hover, Cruise, Emergency, Standby) with real-time calculations.
- **Documentation System**: Integrated access to research papers, physics guides, and API references.
- **3D Spacetime Curvature Visualization**: Real-time WebGL grid rendering of authentic Natário warp bubble deformation effects, with integration of operational modes. Features three orthogonal sheets displaying physics-accurate parameter mapping and York-time coloring.
- **Zen Long Toasts System**: Educational feedback providing theory explanations and philosophical reflections for UI interactions, with authentic physics context and wisdom quotes.
- **Luma Atmospheric System**: Cosmic guardian star background with whisper overlay system for enhanced user experience and contextual guidance.
- **Mission Start Portal**: Entry page at root `/` with mission profiles (Radiant Optimist, Engineer, Diplomat, Strategist) for progressive disclosure of content. Main application is at `/bridge`.
- **Enhanced UI Components**: Reusable Tooltip component and interactive AmplificationPanel displaying real-time multiplication chains (γ_geo × q_spoiling × γ_VdB) with live physics calculations.
- **Canvas-Based Casimir Tile Grid**: High-performance Canvas component for sector visualization with 60fps animation, physics-driven strobing, and real-time sector activation.
- **Strobing Physics Corrections**: Corrected fundamental strobing calculations for exotic mass and power, incorporating femtosecond burst duty and time-slicing mathematics. Includes transparency fields for active fraction, duty, and strobe frequency.
- **Sector-Aware Ford-Roman ζ Calculation**: Redesigned time-sliced strobing with sector scaling, ensuring consistent ζ calculation across modes and proper Ford-Roman compliance.
- **Role-Based Station System**: Personal workstation system for different mission profiles at `/station/role` with role-appropriate metrics, live physics data, and navigation.
- **Hull Geometry Accuracy**: Corrected hull radius calculations to use actual Needle Hull dimensions (1.007 km) for geometric time-scale calculations, ensuring scientific accuracy across all physics.
- **Visual-Physics Alignment**: Integrated authentic ellipsoidal needle hull geometry into 3D WebGL visualization, matching physics calculations.
- **Smooth Natário Ridge Fix**: Implemented smooth C¹-continuous transitions in physics sampler using softSign and soft wall envelope windowing to eliminate jagged visual artifacts in the warp bubble.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection.
- **drizzle-orm**: Database ORM.
- **@tanstack/react-query**: Server state management.
- **react-hook-form**: Form handling and validation.
- **recharts**: Data visualization.
- **@radix-ui/***: UI primitives.
- **tailwindcss**: CSS framework.
- **class-variance-authority**: Component variants.
- **cmdk**: Command palette.
- **tsx**: TypeScript execution.
- **vite**: Frontend build tool.
- **esbuild**: JavaScript bundler.