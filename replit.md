# CouponAI - Smart Coupon Discovery Platform

## Overview

CouponAI is a mobile-first web application designed to help users discover, save, and organize coupons and deals from multiple stores. It features AI-powered personalized recommendations using OpenAI's API, location-based deal discovery with geocoding and real business data from OpenStreetMap, and a comprehensive browsing experience optimized for mobile devices. The platform emphasizes quick deal scanning, thumb-friendly navigation, and clear discount visibility, aiming to provide a modern and efficient coupon discovery experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for development and a mobile-first responsive design. UI is crafted with Shadcn UI, Radix UI primitives, and Tailwind CSS, featuring a purple/blue gradient theme and card-based layouts. Wouter handles client-side routing, and TanStack Query manages server state with caching. Key components include `DealCard`, `DealDetailModal`, `MapView` (with React Leaflet for interactive maps), and a fixed `BottomNav` for mobile optimization.

### Backend Architecture

The backend is an Express.js application with TypeScript and Node.js, providing a RESTful API. Data is currently stored in-memory (MemStorage) but designed for migration to PostgreSQL using Drizzle ORM. Real-time business data is fetched from OpenStreetMap via the Overpass API, and sample coupon deals are dynamically generated for these businesses. Haversine formula is used for accurate distance calculations. Nominatim API handles zip code geocoding. AI-powered recommendations are generated using OpenAI's API.

### Data Models

Core entities include **Coupons** (with geographic coordinates), **Saved Deals** (stores full deal data including couponId, store info, discount, category, expiration, and source), and **User Preferences**. A Drizzle ORM schema is defined for future PostgreSQL integration, and Zod is used for runtime type validation.

### Save Deals Feature

Users can save deals by tapping the heart icon on deal cards across all pages (Home, Browse, AI Picks). Saved deals are stored in-memory using the SavedDeal interface which captures the complete deal data at time of saving. The Saved page displays all saved deals with tabs to filter by Active (not expired), Expired, and All deals. This approach supports dynamically generated Overpass deals that may not have stable IDs.

### Geocoding & Location Features

The application integrates with OpenStreetMap's Nominatim API for zip code geocoding and Overpass API to discover real-world businesses (restaurants, cafes, stores) within a 10-mile radius. It generates dynamic, realistic coupon deals for these businesses, including varied discounts, categories, and logo URLs. An interactive map displays store markers and town boundaries using React Leaflet, allowing users to search by zip code and view nearby deals sorted by distance.

### AI Integration

OpenAI's GPT-based engine provides personalized coupon recommendations based on user preferences and available deals. It includes a graceful fallback to category-based filtering if the AI service is unavailable.

## External Dependencies

### Third-Party Services

-   **OpenAI API**: For AI-powered personalized coupon recommendations.
-   **OpenStreetMap (Nominatim & Overpass APIs)**: For geocoding zip codes, discovering real businesses, and fetching location data.
-   **Clearbit API**: Used for fetching realistic business logo URLs.
-   **DiceBear API**: Provides fallback icons for businesses without Clearbit logos.
-   **Neon Database (Configured but Not Active)**: PostgreSQL serverless database provider, configured via Drizzle for future use.

### Key NPM Packages

-   **UI Components**: `@radix-ui/*`, `class-variance-authority`, `cmdk`, `embla-carousel-react`, `lucide-react`.
-   **Data Management**: `drizzle-orm`, `@tanstack/react-query`, `zod`, `date-fns`.
-   **Development Tools**: `vite`, `tsx`, `esbuild`, `@replit/*` plugins.

### Font Dependencies

-   **Google Fonts**: Inter, DM Sans, Outfit (and others like Architects Daughter, Fira Code, Geist Mono).

### Browser APIs Used

-   **Geolocation API**: Planned for frontend integration for auto-detecting user location.
-   **Clipboard API**: For copying coupon codes.
-   **Local Storage**: Implicitly used by React Query for persistence.