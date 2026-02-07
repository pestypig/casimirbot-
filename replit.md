# Casimir Effect Simulation Tool

## Overview
This web-based application simulates the Casimir effect, enabling users to configure simulations, generate geometry files, and visualize results. It integrates with the SCUFF-EM computational electromagnetics package. The project aims to become a comprehensive research platform supporting dynamic effects, array physics, and advanced studies, including warp bubble research using pre-configured "Needle Hull" simulations and interactive exploration of design parameters.

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
- **Physics Integration**: Implements authentic SCUFF-EM physics (Lifshitz formula, PFA, Matsubara formalism) with exponential notation for energy.
- **Modular Architecture**: Designed for expansion into dynamic Casimir effects, array physics, and advanced materials.
- **UI/UX**: Features radar charts, traffic light systems, metric cards, interactive mesh visualization, cross-section rendering, and a cosmic background with contextual guidance.
- **Needle Hull Preset**: Pre-configured simulation for warp bubble research with geometric and physical parameters.
- **Quality Assurance**: Unit tests, real-time UI validation, golden standards for regression testing, and convergence validation.
- **Target-Value Ledger Verification**: Verifies simulation results against research paper specifications for exotic mass and power.
- **Multi-Dimensional Design Explorer**: Interactive phase diagram (heatmap) for real-time exploration of viable design regions.
- **Live Energy Pipeline**: Step-by-step display of physics equations with real-time parameter substitution.
- **Operational Modes**: System for switching between predefined modes (e.g., Hover, Cruise, Emergency, Standby) with real-time calculations.
- **Documentation System**: Integrated access to research papers, physics guides, and API references.
- **3D Spacetime Curvature Visualization**: Real-time WebGL grid rendering of Natário warp bubble deformation effects with physics-accurate parameter mapping.
- **Canvas-Based Casimir Tile Grid**: High-performance Canvas component for sector visualization with physics-driven strobing and real-time sector activation.
- **Strobing Physics Corrections**: Corrected fundamental strobing calculations for exotic mass and power, incorporating femtosecond burst duty and time-slicing mathematics.
- **Hull Geometry Accuracy**: Corrected hull radius calculations to use actual Needle Hull dimensions (1.007 km) for geometric time-scale calculations.
- **Paper-Backed Constants Module**: Comprehensive physics refactoring using authentic research constants and an "honest raw math" approach, including a two-knob system for calibration.
- **Physics Accuracy Corrections**: Fixed critical calculation drift issues, ensuring all UI components reflect authentic server-driven physics values.
- **WebGL Performance Optimizations**: Systematic optimizations to WarpEngine for efficient rendering and memory management.
- **Comprehensive Mode Policy System**: Implemented MODE_POLICY framework with per-mode power/mass targets, smart sector scheduling, and quantum-safety proxy.
- **Persistent Slice Preferences System**: Implemented global slice viewer preferences using localStorage and an event bus pattern for persistent settings across sessions.
- **HelixCasimirAmplifier Integration**: Integrated a Helix Core visualizer component into a dedicated section for physics pipeline visualization.
- **Shared Light-Crossing Loop System**: Unified physics-accurate clock synchronization using `useLightCrossingLoop` hook for all visual components.
- **Time-Evolving Casimir Cavity Energy System**: Implemented physics-accurate cavity energy dynamics in HelixCasimirAmplifier using the shared light-crossing loop.
- **Streamlined Cosmetic Control System**: Removed Slice Controls panel UI for a cleaner interface, with cosmetic curvature control via console API.

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