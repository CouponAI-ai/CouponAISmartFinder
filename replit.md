# CouponAI - Smart Coupon Discovery Platform

## Overview

CouponAI is a mobile-first web application designed to help users discover, save, and organize coupons and deals from multiple stores. The platform features AI-powered personalized recommendations using OpenAI's API, location-based deal discovery with geocoding, and a comprehensive browsing experience optimized for mobile devices. The application emphasizes quick deal scanning, thumb-friendly navigation, and clear discount visibility, drawing inspiration from modern shopping apps like Honey, Rakuten, and Groupon.

## Project Status
**Current State**: ✅ Fully functional MVP - Built from scratch on November 13, 2025

### Recent Build (November 13, 2025)
Complete rebuild of CouponAI application with all features:
- ✅ All 5 pages implemented (Home, Browse, AI Picks, Saved, Profile)
- ✅ Complete backend with Express API and in-memory storage
- ✅ OpenAI integration for AI-powered recommendations
- ✅ Geocoding backend with Haversine distance calculation
- ✅ Location-based deals via `/api/coupons/nearby` endpoint
- ✅ End-to-end testing completed successfully
- ✅ All core functionality verified and working

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Framework:**
- Shadcn UI component library with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Mobile-first responsive design with card-based layouts

**Component Structure:**
- Page-based architecture with five main routes: Home, Browse, AI Picks, Saved, and Profile
- Reusable components including DealCard, DealDetailModal, and BottomNav
- Fixed bottom navigation bar for mobile-optimized thumb reach

**Design Philosophy:**
- Mobile-first priority with single-column layouts on mobile, grid layouts on larger screens
- Emphasis on scannable information with discount amounts as visual anchors
- Minimum 44px tap targets for touch optimization
- Purple/blue gradient theme using Inter/DM Sans fonts with extrabold discount displays

**State Management:**
- React Query handles all server state with automatic caching and invalidation
- Local component state for UI interactions (modals, filters, search)
- Optimistic updates for save/unsave operations

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript running on Node.js
- RESTful API design with clear route separation
- Custom middleware for request logging and error handling

**Data Storage Strategy:**
- In-memory storage (MemStorage class) suitable for MVP
- Designed with interface abstraction (IStorage) to allow easy migration to PostgreSQL
- Drizzle ORM configured for future database integration with schema already defined
- Sample data includes 10 diverse coupons with location coordinates

**API Endpoints:**
- `/api/coupons` - Get all coupons
- `/api/coupons/trending` - Get trending deals
- `/api/coupons/nearby` - **NEW** Location-based coupon discovery with distance calculation
  - Query params: `latitude`, `longitude`, `radius` (in miles, default 10)
  - Returns coupons sorted by distance with distance field included
- `/api/coupons/ai-picks` - AI-powered personalized recommendations
- `/api/coupons/category/:category` - Get deals by category
- `/api/coupons/search?q=query` - Search deals
- `/api/coupons/:id` - Get specific coupon
- `/api/coupons/:id/claim` - Claim a coupon (increments claim count)
- `/api/saved-coupons` - CRUD operations for saved deals
- `/api/user-preferences` - User category preferences management

**Business Logic:**
- Haversine formula implementation for accurate distance calculations (in miles)
- Category-based filtering and search functionality
- Claim count tracking for popularity metrics

### Data Models

**Core Entities:**
- **Coupons**: Store name, logo, discount amount/percentage, title, description, code, category, expiration date, claim count, trending status, terms, and **geographic coordinates (latitude, longitude)**
- **Saved Coupons**: User's bookmarked deals with timestamps
- **User Preferences**: Category selections for personalized recommendations

**Database Schema:**
- Drizzle ORM schema defined in `shared/schema.ts`
- PostgreSQL dialect configured with Neon serverless support
- Zod validation schemas for runtime type checking

### Geocoding & Location Features

**Implementation:**
- Haversine distance formula in `server/geocoding.ts`
- Calculates accurate distances between coordinates in miles
- All sample coupons include San Francisco Bay Area coordinates

**Nearby Deals API:**
- Filters coupons within specified radius
- Returns results sorted by distance (nearest first)
- Includes distance field in response for each coupon

**Future Enhancements:**
- UI components to display distance on deal cards
- Map view toggle for visualizing deals geographically
- Browser geolocation API integration

### AI Integration

**OpenAI Implementation:**
- GPT-based recommendation engine analyzing user preferences and available deals
- Fallback to category-based filtering when API key unavailable
- Considers discount value, popularity (claim count), and category match
- Returns top 5 personalized deals with variety across stores

**Recommendation Strategy:**
- Primary: AI analysis of user category preferences vs. available inventory
- Fallback: Simple category matching with claim count sorting
- Ensures recommendations span multiple stores for variety

### Build and Deployment

**Development:**
- `npm run dev` - Runs both Vite dev server and Express backend with tsx
- Hot module replacement for frontend
- Auto-restart for backend changes

**Production Build:**
- Vite builds optimized frontend bundle
- esbuild bundles backend into single ESM file
- Static assets served from `dist/public`

**Configuration:**
- TypeScript with strict mode and ESNext modules
- Path aliases (@, @shared, @assets) for clean imports
- Environment variables for OpenAI API key and database URL

### Authentication and Session Management

**Current State:**
- No authentication implemented (MVP scope)
- Single-user experience with in-memory storage
- Designed for future multi-user support with session management infrastructure in place (connect-pg-simple dependency)

## External Dependencies

### Third-Party Services

**OpenAI API:**
- Used for generating personalized coupon recommendations
- Graceful degradation to category-based filtering when unavailable
- Requires `OPENAI_API_KEY` environment variable

**Neon Database (Configured but Not Active):**
- PostgreSQL serverless database provider
- Configured via Drizzle with `@neondatabase/serverless` driver
- Schema ready for migration from in-memory storage
- Requires `DATABASE_URL` environment variable

### Key NPM Packages

**UI Components:**
- @radix-ui/* - Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- class-variance-authority - Type-safe component variants
- cmdk - Command menu component
- embla-carousel-react - Touch-friendly carousels
- lucide-react - Icon library

**Data Management:**
- drizzle-orm - TypeScript ORM with Zod integration
- @tanstack/react-query - Server state management
- zod - Runtime schema validation
- date-fns - Date formatting and manipulation

**Development Tools:**
- vite - Frontend build tool with HMR
- tsx - TypeScript execution for development
- esbuild - Production backend bundling
- @replit/* plugins - Development environment enhancements

### Font Dependencies

**Google Fonts:**
- Inter - Primary body font
- DM Sans - Display font for headings
- Outfit - Accent font for discount numbers
- (Plus other loaded fonts: Architects Daughter, Fira Code, Geist Mono, etc.)

### Browser APIs Used

- Geolocation API for location-based deal discovery (ready for frontend integration)
- Clipboard API for coupon code copying
- Local Storage (implicit via React Query persistence)

## Testing

**End-to-End Testing Completed:**
- ✅ Homepage trending deals display and search
- ✅ Browse page filtering, sorting, and search
- ✅ AI Picks personalized recommendations
- ✅ Saved deals functionality (save/unsave)
- ✅ Profile preferences management
- ✅ **Nearby deals API with geocoding** (latitude, longitude, radius)
- ✅ Bottom navigation across all pages
- ✅ Deal detail modals
- ✅ All interactive elements and data-testid attributes

**Test Results:**
- All core functionality verified and working
- API endpoints responding correctly
- UI interactions behaving as expected
- Minor accessibility improvements recommended (non-critical)

## Deployment Status

**Ready for Deployment:**
The application is fully functional and ready to be published on Replit.

**Environment Variables Needed:**
- `OPENAI_API_KEY` (optional) - For AI recommendations. Falls back to category-based filtering if not provided.
- `SESSION_SECRET` (already configured) - For session management

**Next Steps:**
1. Click "Publish" in Replit to deploy the application
2. Add OPENAI_API_KEY environment variable if you want AI-powered recommendations
3. The app will be available at your .replit.app domain

## Future Enhancements

**Planned Features:**
- Migrate from in-memory storage to PostgreSQL for persistent data across sessions
- Add UI components for location features (distance badges on cards, map view toggle)
- Implement push notifications for expiring deals near user location
- Add user authentication system for personalized saved deals and preferences across devices
- Create deal analytics dashboard to track claim rates and user engagement
- Enable actual geolocation in browser for automatic location detection
- Add deal submission form for users to contribute coupons
- Implement deal sharing functionality (social media, email)
