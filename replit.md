# Overview

This is a Magic: The Gathering (MTG) card collection management application built with a modern web stack. The application allows users to search for MTG cards using the Scryfall API, view detailed card information, and manage their personal collection. It features a responsive design with a clean, dark-themed interface optimized for card browsing and collection management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is built using **React** with **TypeScript** and **Vite** as the build tool. The architecture follows a component-based design pattern with the following key decisions:

- **Component Library**: Uses **shadcn/ui** components built on top of **Radix UI** primitives for consistent, accessible UI elements
- **Styling**: **Tailwind CSS** with custom CSS variables for theming and a dark MTG-themed color scheme
- **State Management**: **TanStack React Query** (formerly React Query) for server state management and caching
- **Routing**: **Wouter** for lightweight client-side routing
- **Form Handling**: **React Hook Form** with **Zod** validation schemas

The frontend implements a card search interface with advanced filtering, detailed card modals, and collection management views. The design emphasizes visual appeal with card imagery and MTG-themed styling.

## Backend Architecture

The server is built with **Node.js** and **Express** following a RESTful API design:

- **API Structure**: RESTful endpoints for card search, collection management, and user operations
- **Middleware**: Custom logging middleware for API request tracking and error handling
- **Development Setup**: Integrated Vite development server for hot module replacement
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

## Data Storage Solutions

The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations:

- **Schema Design**: Separate tables for users and collections with proper relationships
- **Type Safety**: Generated TypeScript types from database schema using Drizzle
- **Migrations**: Database schema versioning through Drizzle migrations
- **Fallback Storage**: In-memory storage implementation for development/demo purposes

The database schema supports user authentication, collection management with quantities, and stores card data from external APIs.

## Authentication and Authorization

Currently implements a demo-mode authentication system:

- **Demo User**: Hard-coded user ID for development and demonstration
- **Session Management**: Prepared for session-based authentication with PostgreSQL session store
- **Future Enhancement**: Architecture supports full user registration and authentication

## External Service Integrations

**Scryfall API Integration**: Primary external dependency for MTG card data

- **Card Search**: Real-time search with advanced filtering (mana cost, colors, types, rarities)
- **Card Details**: Comprehensive card information including images, pricing, and metadata
- **Error Handling**: Graceful handling of API failures with fallback responses
- **Rate Limiting**: Respectful API usage patterns

The integration abstracts Scryfall's API complexity while providing rich filtering and search capabilities to the frontend.