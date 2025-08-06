# Casimir Effect Simulation Tool

## Overview
This application is a web-based tool for simulating the Casimir effect using the SCUFF-EM computational electromagnetics package. It provides a user-friendly interface for setting up simulations, generating geometry files, and visualizing results. The application enables users to configure different geometric arrangements (sphere, parallel plates, bowl) and automatically generates the necessary input files for SCUFF-EM calculations.

The project's vision is to evolve into a comprehensive research platform for advanced physics, including dynamic Casimir effects, array physics (N×N tile lattices), and integration with advanced materials like superconducting thin films. It aims to provide a robust foundation for exploring concepts such as exotic mass generation for theoretical warp drive requirements, ensuring scientific accuracy and compliance with established research.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Build Tool**: Vite for development and esbuild for production
- **Session Management**: WebSocket connections for real-time updates
- **File Management**: Local filesystem storage for simulation files

### Data Storage Solutions
- **Primary Storage**: In-memory storage using Map data structure
- **Database ORM**: Drizzle ORM configured for PostgreSQL (ready for future integration)
- **Schema Definition**: Shared Zod schemas for type safety
- **Session Storage**: PostgreSQL session store (connect-pg-simple) ready for deployment

### Core Features & Design Patterns
- **SCUFF-EM Integration**: Service layer for generating geometry files and executing simulations, including automatic .scuffgeo file creation and mesh management.
- **Real-time Updates**: WebSocket-based progress tracking for simulations.
- **User Interface Components**: Parameter panel, real-time status tracker, interactive results display (Recharts), and file download interface.
- **API Layer**: RESTful endpoints for CRUD operations on simulations, static file delivery, and WebSocket server for real-time communication. Includes comprehensive error handling.
- **Data Flow**: User input via React forms, client-side Zod validation, HTTP requests to Express backend, backend generation of simulation records and SCUFF-EM files, background simulation with WebSocket updates, and frontend parsing/rendering of results.
- **Scientific Calculations**: Implementation of authentic Casimir calculations based on Fluctuating Surface Current (FSC) method, Lifshitz formula for parallel plates, and Proximity Force Approximation (PFA) for curved geometries. Includes scientific temperature corrections and realistic Xi integration points.
- **Modular Physics Platform**: Foundation for modular expansion into Dynamic Casimir Effects (DCE) and N×N array simulations.
- **Dynamic Casimir Module**: Incorporates 15 GHz modulation controls, quantum inequality safety monitoring (Ford-Roman bounds), and GR validity tests. Provides visualizations for time-domain modulation, frequency spectrum, and detailed variable tables.
- **Needle Hull Preset**: Configuration for theoretical warp bubble research, applying specific geometry, modulation, superconducting parameters, and sector strobing for geometry-amplified Casimir effects. Includes advanced calculations for Van-den-Broeck amplification, power scaling, and exotic mass generation, aligning with research paper specifications.
- **Quality Assurance**: Unit tests against analytic formulas, real-time validation UI (Xi points, error tolerance, quantum safety), golden standards for regression testing, and convergence validation.
- **Target-Value Ledger Verification**: Real-time verification against research paper specifications for exotic mass, power, and quantum safety targets.
- **Mesh Generation**: Robust Gmsh script generation for different geometries, including sag depth for bowl configurations, with enhanced error handling.
- **Energy Pipeline**: Transparent, step-by-step equation display with real-time parameter substitution, showing calculations from static Casimir effect to power and mass generation, with scientific notation and unit formatting.
- **Metrics Dashboard**: Real-time visualization of key metrics using radar charts and traffic light systems for compliance.
- **Multi-Dimensional Design Explorer**: Interactive phase diagram (heat-map) visualizing viable regions across various physics parameters (gamma_geo, Q-Factor, burst duty, sag depth) and constraint tolerances. Uses ellipsoid geometry calculations for accurate hull scaling.
- **Operational Mode Selector**: Supports different operational modes (Hover, Cruise, Emergency, Standby) with dynamic parameter switching and real-time energy pipeline recalculation.
- **Documentation System**: Integrated access to research papers, physics guides, and API references.
- **UI/UX Decisions**: Shadcn/ui and Tailwind CSS for a modern, responsive interface. Interactive charts (Recharts) for data visualization. Clear navigation and reorganized layout for focused user experience. Consistent use of scientific notation and visual indicators for status.

## External Dependencies

- **Database**:
    - `@neondatabase/serverless`: Database connection (ready for Neon PostgreSQL)
    - `drizzle-orm`: Database ORM with PostgreSQL dialect
- **Frontend Libraries**:
    - `@tanstack/react-query`: Server state management
    - `react-hook-form`: Form handling and validation
    - `recharts`: Data visualization and charting
    - `@radix-ui/*`: Comprehensive set of UI primitives
    - `tailwindcss`: Utility-first CSS framework
    - `class-variance-authority`: Type-safe component variants
    - `cmdk`: Command palette and search functionality
- **Development Tools**:
    - `tsx`: TypeScript execution for development
    - `vite`: Frontend build tool and development server
    - `esbuild`: Fast JavaScript bundler for production
- **External Services**:
    - **OpenAI GPT-4 API**: Integrated for HELIX-CORE AI mainframe functionality.
    - **SCUFF-EM**: Computational electromagnetics package (integrated via service layer).
    - **math-gpt.org**: Referenced for Dynamic Casimir module formulation.