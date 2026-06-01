# PepcoLab — Premium Research Peptide Platform

A Next.js 14 e-commerce frontend for a UK research-grade peptide supplier. Built with App Router, Tailwind CSS, TypeScript, and Framer Motion.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS 3
- **Language**: TypeScript
- **Fonts**: Instrument Serif (Google Fonts) + Geist (Next.js font)
- **Icons**: Lucide React
- **Animation**: Framer Motion

---

## Project Structure

```
pepcolab/
├── src/
│   ├── app/
│   │   ├── globals.css           # Global styles, animations, base CSS
│   │   ├── layout.tsx            # Root layout with font loading
│   │   ├── page.tsx              # Homepage (all sections assembled)
│   │   ├── data.ts               # Product data, types, constants
│   │   ├── not-found.tsx         # 404 page
│   │   ├── products/
│   │   │   ├── page.tsx          # Products listing page
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Product detail page
│   │   ├── certificates/
│   │   │   └── page.tsx          # COA library page
│   │   ├── bundles/
│   │   │   └── page.tsx          # Bundles page
│   │   ├── research/
│   │   │   └── page.tsx          # Research hub page
│   │   ├── tools/
│   │   │   └── page.tsx          # Tools & calculators page
│   │   └── faq/
│   │       └── page.tsx          # FAQ page
│   ├── components/
│   │   ├── AnnouncementBar.tsx   # Scrolling announcement ticker
│   │   ├── Nav.tsx               # Sticky navigation with search
│   │   ├── Hero.tsx              # Hero with brand statement + product list
│   │   ├── TrustBar.tsx          # 5-metric trust strip
│   │   ├── ProductCard.tsx       # Product card with vial, purity, add-to-cart
│   │   ├── ProductsSection.tsx   # Grid + category filter tabs
│   │   ├── ProductSpotlight.tsx  # Featured product hero banner
│   │   ├── COASection.tsx        # Dark COA terminal section
│   │   ├── BundlesSection.tsx    # Bundle cards
│   │   ├── ProcessSection.tsx    # 4-step synthesis → dispatch flow
│   │   ├── ToolsSection.tsx      # Research tools grid
│   │   ├── ReviewsSection.tsx    # Social proof + ratings
│   │   ├── NewsletterSection.tsx # Email capture
│   │   ├── CartDrawer.tsx        # Slide-out cart drawer
│   │   ├── Footer.tsx            # Comprehensive footer
│   │   └── Vial.tsx              # SVG vial illustration component
│   └── lib/
│       └── utils.ts              # Utility functions
├── public/                       # Static assets
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── tsconfig.json
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Build for production

```bash
npm run build
npm start
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — full storefront |
| `/products` | Product listing with filter tabs |
| `/products/[slug]` | Product detail page |
| `/certificates` | COA library — searchable batch certificates |
| `/bundles` | Bundle packages |
| `/research` | Research hub — articles + tools |
| `/tools` | Reconstitution calculator + batch verifier |
| `/faq` | Frequently asked questions |

---

## Design System

### Colors
- **Ink**: `#0a0a0a` — primary text
- **Canvas**: `#ffffff` — background
- **Canvas Off**: `#f8f8f6` — section backgrounds
- **Steel**: `#6b7280` — secondary text
- **Blue 600**: `#2563eb` — primary accent

### Typography
- **Headings**: Instrument Serif (editorial, premium feel)
- **Body**: Geist (clean, technical, modern)

### Category Color Coding
- 🔵 Metabolic — Blue
- 🟢 Recovery — Green
- 🩷 Cognitive — Pink/Rose
- 🟡 Hormonal — Amber
- 🟣 Anti-Ageing — Violet
- 🟠 Skin — Orange

---

## Key Components

### `Vial.tsx`
SVG vial illustration with glass reflections, gradient fill, and size variants (sm/md/lg/xl). Used throughout product cards and hero sections.

### `ProductCard.tsx`
Full product card with:
- Category-colored vial visual
- Purity progress bar with lot number
- Sale/new/popular/bestseller badges
- Low stock indicator
- Add to cart with confirmation state

### `COASection.tsx`
Dark-themed laboratory transparency section featuring a mock terminal COA viewer with download buttons, row-by-row test data, and lot number search.

---

## Backend Integration

This is a **frontend-only** project. To connect a real backend:

- Replace `src/app/data.ts` with API calls (Shopify, WooCommerce, custom)
- Implement cart state management (Zustand, Context, or Redux)
- Connect checkout to Shopify's Storefront API or similar
- Add real COA PDF hosting and search API

### Shopify Integration
The architecture is designed to work cleanly with Shopify Headless (Hydrogen) or Shopify Storefront API. Product slugs map to Shopify handles, and the cart drawer is pre-built for Shopify cart mutations.

---

## Customisation

### Adding a product
Edit `src/app/data.ts` and add a new entry to the `PRODUCTS` array with the full color scheme object.

### Changing fonts
Update `src/app/layout.tsx` and `tailwind.config.js` `fontFamily` section.

### Modifying the color system
Edit `tailwind.config.js` under `theme.extend.colors`.

---

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

Or any platform supporting Next.js: Netlify, Railway, Render, AWS Amplify.

---

## Legal Notice

All content references research use only. This platform is designed for legitimate UK-registered research peptide suppliers operating within applicable regulations. Ensure compliance with local laws before deployment.

---

*Built for PepcoLab Ltd · Premium Research Peptides · United Kingdom*
