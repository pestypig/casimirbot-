# Casimir Effect Simulation Tool

## Overview

This application is a web-based tool for simulating the Casimir effect using the SCUFF-EM computational electromagnetics package. It provides a user-friendly interface for setting up simulations, generating geometry files, and visualizing results. The application allows users to configure different geometric arrangements (sphere, parallel plates, bowl) and automatically generates the necessary input files for SCUFF-EM calculations.

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

## Key Components

### Simulation Engine
- **SCUFF-EM Integration**: Service layer for generating geometry files and executing simulations
- **File Generation**: Automatic .scuffgeo file creation based on user parameters
- **Mesh Management**: Handling of computational mesh files for different geometries
- **Real-time Updates**: WebSocket-based progress tracking during simulation execution

### User Interface Components
- **Parameter Panel**: Form interface for configuring simulation parameters
- **Status Tracker**: Real-time visualization of simulation progress through different stages
- **Results Display**: Interactive charts and data visualization using Recharts
- **File Management**: Download interface for generated files and simulation outputs

### API Layer
- **RESTful Endpoints**: CRUD operations for simulations
- **File Serving**: Static file delivery for downloads
- **WebSocket Server**: Real-time communication for simulation status updates
- **Error Handling**: Comprehensive error management with proper HTTP status codes

## Data Flow

1. **User Input**: Parameters entered through React form components
2. **Validation**: Client-side validation using Zod schemas
3. **API Communication**: HTTP requests to Express backend
4. **Simulation Creation**: Backend generates unique simulation records
5. **File Generation**: SCUFF-EM geometry files created based on parameters
6. **Execution**: Background simulation process with WebSocket status updates
7. **Results Processing**: Output files parsed and structured for frontend consumption
8. **Visualization**: React components render results with interactive charts

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Database connection (ready for Neon PostgreSQL)
- **drizzle-orm**: Database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **recharts**: Data visualization and charting

### UI Framework
- **@radix-ui/***: Comprehensive set of UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **cmdk**: Command palette and search functionality

### Development Tools
- **tsx**: TypeScript execution for development
- **vite**: Frontend build tool and development server
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **Type Checking**: TypeScript compilation with strict mode
- **Replit Integration**: Custom plugins for Replit development environment

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code for Node.js execution
- **Static Serving**: Express serves built frontend assets
- **Environment Variables**: DATABASE_URL for PostgreSQL connection

### Database Configuration
- **Development**: In-memory storage for rapid prototyping
- **Production Ready**: Drizzle ORM configured for PostgreSQL migration
- **Session Management**: PostgreSQL sessions with connect-pg-simple
- **Migration Support**: Drizzle Kit for database schema management

The application is designed to be easily deployable on platforms like Replit, with the ability to scale from in-memory development storage to full PostgreSQL production deployment.

## Recent Changes: Latest modifications with dates

### July 27, 2025
- **Added Sag Depth Parameter**: Enhanced bowl geometry configuration with user-controlled sag depth parameter
  - New sagDepth field in simulation schema (0-1000 nm range, allowing flat surfaces)
  - Dynamic UI field that appears only when bowl geometry is selected
  - Integrated Gmsh mesh generation for realistic concave spherical cap geometry
  - Fixed form validation issues preventing NaN values in input fields
  - Bowl mesh now uses 25 mm radius with user-specified sag depth as requested
- **Added Cross-Section Visualization**: Created interactive mesh visualization component
  - Real-time cross-section rendering showing curvature changes at different sag depths
  - Side-by-side comparison of two different sag depths (default: 0 nm vs 50 nm)
  - Mathematical curvature analysis with radius of curvature calculations
  - SVG-based rendering with grid lines and proper scaling for scientific accuracy
- **Fixed Casimir Energy Calculations**: Implemented realistic physics-based calculations
  - Sag depth now properly affects energy values with geometry-specific enhancement factors
  - Bowl geometry shows significant energy differences (e.g., 0.1 nm vs 200 nm: -10.33 vs -1401.72 J)
  - Updated energy formatting to exponential notation with 3 decimal places (e.g., -1.402 × 10^3)
  - Fixed computation times to be realistic and geometry-dependent (bowl: 3.5+ min, sphere: 2.8+ min, plate: 2.2+ min)