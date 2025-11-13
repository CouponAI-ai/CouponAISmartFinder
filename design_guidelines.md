# CouponAI Design Guidelines

**CRITICAL:** Preserve all existing UI and design exactly as implemented. Do not modify visual appearance, component layouts, or styling.

## Design Approach
Reference-Based Approach: Mobile-first coupon discovery app inspired by Honey, Rakuten, and Groupon. Card-based layouts optimized for thumb-friendly interaction with emphasis on quick browsing and visual deal recognition.

## Core Principles
1. Mobile-First Priority: Every interaction designed for thumb reach and one-handed use
2. Deal Visibility: Discount amounts are the visual anchor of every card
3. Scannable Information: Users grasp deal value within 2 seconds
4. Touch-Optimized: Minimum 44px tap targets, generous spacing
5. Urgency Without Anxiety: Expiration dates visible but not overwhelming

## Typography
**Fonts:** Inter or DM Sans (primary), Outfit or Space Grotesk (accent numbers)

**Hierarchy:**
- Hero Headlines: text-4xl to text-5xl, font-bold
- Section Titles: text-2xl to text-3xl, font-semibold
- Deal Discount: text-3xl to text-4xl, font-extrabold (visual star)
- Card Titles: text-lg, font-semibold
- Store Names: text-sm, font-medium, uppercase tracking-wide
- Body: text-base, font-normal
- Metadata: text-xs to text-sm, font-medium
- Buttons: text-sm to text-base, font-semibold

## Layout System
**Spacing:** Use Tailwind units 2, 3, 4, 6, 8, 12
- Component padding: p-3 to p-4
- Card spacing: gap-4 to gap-6
- Section margins: my-8 to my-12
- Edge margins: px-4 mobile, px-6 tablet+

**Containers:** max-w-md centered for mobile (448px), full-width on mobile, contained on desktop

## Key Components

### Bottom Tab Bar
Fixed bottom navigation with 5 icons: Home, Browse, AI Picks, Saved, Profile. Height 64px, 24px icons with 8px labels, bold active state.

### Deal Cards (Grid)
**Layout:** Single column mobile, 2 columns tablet, 3 columns desktop

**Structure:**
- Store logo (48px circle, top-left)
- Large discount percentage (prominent)
- Uppercase store name
- Deal description (2 lines max, ellipsis)
- Expiration date with icon
- Save icon (top-right heart/bookmark)
- "View Deal" CTA button
- Padding: p-4, rounded-xl, subtle shadow

**Variants:** Featured (larger, horizontal), Expiring Soon (border accent), AI Recommended (sparkle badge)

### Hero Section
No hero image - dynamic gradient backdrop with:
- Large heading: "Smart Savings, Powered by AI"
- Value proposition subheading
- Prominent search bar (rounded-full, shadow-lg)
- Category chips below
- Height: 40vh mobile

### Categories
Horizontal scroll pill chips (rounded-full, px-4 py-2) with snap points for: Groceries, Fashion, Electronics, Dining, Travel

### AI Recommendations
"Picked For You" section with sparkle icon, 2-3 featured spotlight cards, brief explanation text

### Search & Filters
Full-screen overlay with recent searches, category filters, sort options. Bottom sheet filter panel with checkboxes, sliders, sticky "Apply" button.

## Interactions
- Swipe to reveal save/delete
- Pull-to-refresh
- Long-press for preview
- Skeleton loading screens
- Heart animation on save
- Checkmark on code copy
- Subtle scale on tap (scale-95)

## Images
**Store Logos:** 48x48px to 64x64px, top-left placement, SVG preferred
**Category Icons:** 20-24px for chips and filters
**Empty States:** 200-250px friendly line art illustrations
**No Hero Images:** Design uses gradients and typography

## Responsive
- Mobile (<768px): Single column, bottom nav
- Tablet (768-1024px): 2 columns
- Desktop (>1024px): 3 columns, header nav

## Animation
Minimal and purposeful: 200ms page transitions, subtle hover lift, quick scale feedback, slide-up modals. No auto-play carousels.