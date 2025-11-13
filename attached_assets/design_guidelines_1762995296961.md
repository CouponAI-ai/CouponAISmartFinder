# CouponAI Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from modern mobile shopping and deal discovery apps like Honey, Rakuten, and Groupon, combined with mobile-first e-commerce patterns. The design emphasizes quick browsing, visual deal recognition, and effortless organization through card-based layouts optimized for thumb-friendly mobile interaction.

## Core Design Principles

1. **Mobile-First Priority**: Every interaction designed for thumb reach and one-handed use
2. **Deal Visibility**: Discount amounts and savings are the visual anchor of every card
3. **Scannable Information**: Users should grasp deal value within 2 seconds of viewing
4. **Touch-Optimized**: Minimum 44px tap targets, generous spacing between interactive elements
5. **Urgency Without Anxiety**: Expiration dates visible but not overwhelming

## Typography System

**Font Stack**: 
- Primary: Inter or DM Sans (via Google Fonts)
- Accent Numbers: Outfit or Space Grotesk for discount percentages

**Hierarchy**:
- Hero Headlines: text-4xl to text-5xl, font-bold (32-48px)
- Section Titles: text-2xl to text-3xl, font-semibold (24-30px)
- Deal Discount Amount: text-3xl to text-4xl, font-extrabold (30-36px) - this is the star
- Card Titles: text-lg, font-semibold (18px)
- Store Names: text-sm, font-medium (14px), uppercase tracking-wide
- Body Text: text-base (16px), font-normal for descriptions
- Metadata (expiration, terms): text-xs to text-sm (12-14px), font-medium
- Button Text: text-sm to text-base, font-semibold

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, 8, and 12 consistently
- Component internal padding: p-3 to p-4
- Card spacing: gap-4 to gap-6
- Section margins: my-8 to my-12
- Edge margins: px-4 on mobile, px-6 on tablet+

**Container Strategy**:
- Max width: max-w-md centered for mobile-optimized content (448px)
- Full-width sections on mobile, contained on desktop
- Safe area padding: px-4 minimum for all content

## Component Library

### Navigation
**Bottom Tab Bar** (Mobile Primary Navigation):
- Fixed bottom position with 5 icons: Home, Browse, AI Picks, Saved, Profile
- Icon size: 24px with 8px label below
- Active state: Bold icon variant
- Height: 64px with safe area padding

**Top Header**:
- Logo left, search icon right, notification bell
- Height: 56px, sticky on scroll
- Search expands into full-width input on tap

### Deal Cards (Primary Component)

**Grid Layout**:
- Mobile: Single column, full-width cards
- Tablet: 2 columns (grid-cols-2)
- Desktop: 3 columns (grid-cols-3)

**Card Structure**:
- Store logo badge (48px circle, top-left overlay or dedicated space)
- Discount percentage in large, bold typography (prominent visual anchor)
- Store name in uppercase, tracked text
- Deal description (2 lines max with ellipsis)
- Expiration date with calendar icon
- Save/bookmark icon (heart or bookmark, top-right)
- "View Deal" CTA button
- Card padding: p-4
- Border radius: rounded-xl (12px)
- Subtle shadow for depth

**Card Variants**:
- Featured Deal: Larger card, horizontal layout on mobile
- Expiring Soon: Border accent or badge indicator
- AI Recommended: Sparkle icon or "AI Pick" badge

### Hero Section
**Homepage Hero**:
- No hero image - instead use dynamic gradient backdrop
- Large heading: "Smart Savings, Powered by AI"
- Subheading explaining value proposition
- Search bar prominently featured (rounded-full, shadow-lg)
- Quick category chips below (pill-shaped buttons)
- Height: 40vh on mobile, allows immediate deal browsing

### Category Browsing
**Horizontal Scroll Chips**:
- Pill-shaped category filters (rounded-full)
- Padding: px-4 py-2
- Active state: filled background
- Horizontal scroll on mobile with snap points
- Categories: Groceries, Fashion, Electronics, Dining, Travel, etc.

### AI Recommendations Section
**Personalized Feed**:
- Section header: "Picked For You" with sparkle icon
- 2-3 featured cards in spotlight layout
- Brief explanation: "Based on your shopping preferences"
- Larger card size than standard grid

### Saved/Collections View
**Organization System**:
- Tab navigation: All Saved, Collections, Expired
- Collection cards with preview images (3-4 coupon thumbnails in grid)
- Collection name and coupon count
- Easy drag-to-organize or multi-select actions

### Deal Detail Page
**Full-Screen Modal or Page**:
- Large discount display at top (hero treatment)
- Store logo and name
- Detailed terms and conditions (expandable)
- "Copy Code" button (primary CTA) with auto-copy feedback
- "Shop Now" secondary button
- Share icon in header
- Similar deals section at bottom

### Search & Filters
**Search Interface**:
- Full-screen overlay when active
- Recent searches below input
- Category quick filters
- Sort options: Expiring Soon, Highest Discount, Newest

**Filter Panel** (Slide-up bottom sheet):
- Category checkboxes
- Distance radius slider (for location-based)
- Discount range slider
- Expiration date range
- "Apply Filters" sticky bottom button

### Location Features
**Nearby Deals**:
- Map view toggle option
- Distance indicators on cards (e.g., "0.3 mi away")
- Location permission prompt (friendly, value-focused)

### Trending Section
**Social Proof Display**:
- "Trending Now" or "Most Claimed Today"
- Small fire or trending icon
- Claim count: "1.2k people claimed this"
- Horizontal carousel on mobile

### Empty States
- Friendly illustrations (not plain text)
- Clear CTAs: "Start browsing deals" or "Enable notifications"
- Helpful suggestions for next actions

## Interaction Patterns

**Touch Gestures**:
- Swipe to reveal save/delete on saved deals
- Pull-to-refresh on feed pages
- Long-press for quick preview or multi-select

**Loading States**:
- Skeleton screens for card grids (match card structure)
- Shimmer animation during data fetch
- Smooth transitions when content loads

**Microinteractions**:
- Heart animation when saving deals
- Checkmark confirmation when copying codes
- Subtle scale on card tap (scale-95)
- Badge notifications on new AI picks

## Accessibility

- Minimum font size: 14px for all readable text
- Touch targets: 44px minimum (iOS guideline)
- Color contrast ratios meeting WCAG AA
- Clear focus indicators for keyboard navigation
- Alt text for all store logos and icons
- Screen reader friendly labels for icon-only buttons

## Responsive Breakpoints

- Mobile (default): < 768px - Single column, bottom nav
- Tablet: 768px - 1024px - 2 columns, introduce side nav option
- Desktop: > 1024px - 3 columns, full navigation in header

## Animation Guidelines

**Use Sparingly**:
- Page transitions: Smooth slide/fade (200ms)
- Card hover on desktop: Subtle lift (translate-y-1, transition-shadow)
- Button press: Quick scale feedback (scale-95)
- Modal appearance: Slide up from bottom on mobile
- No auto-playing carousels or distracting motion

## Images

**Store Logos**: 
- Required for every deal card
- Size: 48x48px to 64x64px
- Placement: Top-left corner or dedicated space above discount
- Format: SVG preferred, or high-res PNG with transparent background

**Category Icons**:
- Shopping cart, clothing hanger, utensils, plane, etc.
- Size: 20-24px
- Used in category chips and filters

**No Hero Image**: Design uses gradient backgrounds and typography to create visual interest without relying on stock photography

**Empty State Illustrations**:
- Simple, friendly line art style
- Used for: No saved deals, no search results, location disabled
- Size: 200-250px width, centered

This mobile-first design creates an intuitive, visually engaging coupon discovery experience that prioritizes quick deal recognition, easy organization, and personalized AI recommendations.