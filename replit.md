# DynamoGym - Integrated Gym Management System

## Overview

DynamoGym is a comprehensive gym management ERP system built as a full-stack web application. It's designed for managing gym memberships, tracking member subscriptions, handling product inventory, managing employees and suppliers, and generating financial reports. The interface is in Arabic with RTL (right-to-left) layout support.

The system provides features for:
- Member subscription management with various plan types
- Product inventory and sales tracking
- Employee payroll management
- Supplier debt tracking
- Financial reporting (expenses, suppliers)
- WhatsApp integration for member communication

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for development and production
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration following Material Design 3 principles
- **State Management**: React Query (@tanstack/react-query) for server state
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful API endpoints prefixed with `/api`
- **Static Serving**: Production builds served from `dist/public`

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM
- **External BaaS**: Supabase integration for real-time data and authentication
- **Schema Location**: `shared/schema.ts` with Drizzle table definitions
- **Migrations**: Managed via `drizzle-kit push` command
- **In-Memory Fallback**: MemStorage class for development without database

### Project Structure
```
├── client/          # React frontend application
│   └── src/
│       ├── components/ui/  # shadcn/ui components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utilities and query client
│       └── pages/          # Page components
├── server/          # Express backend
│   ├── index.ts     # Server entry point
│   ├── routes.ts    # API route definitions
│   ├── storage.ts   # Data access layer
│   └── vite.ts      # Vite dev server integration
├── shared/          # Shared types and schemas
│   └── schema.ts    # Drizzle database schema
└── script/          # Build scripts
```

### Build System
- Development: Vite dev server with HMR, integrated with Express
- Production: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- Path aliases configured: `@/` for client src, `@shared/` for shared code

## External Dependencies

### Database & Backend Services
- **PostgreSQL**: Primary relational database (requires `DATABASE_URL` environment variable)
- **Supabase**: Backend-as-a-Service for real-time features (requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- **Drizzle ORM**: Type-safe database queries and schema management

### Frontend Libraries
- **Radix UI**: Full suite of accessible UI primitives (dialog, dropdown, tabs, etc.)
- **React Query**: Server state management and caching
- **React Day Picker**: Calendar component
- **Embla Carousel**: Carousel functionality
- **Recharts**: Data visualization and charts
- **Vaul**: Drawer component
- **cmdk**: Command palette functionality

### Development Tools
- **Replit Plugins**: Dev banner, cartographer, runtime error overlay for Replit environment
- **TypeScript**: Strict mode enabled with bundler module resolution