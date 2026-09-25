# PanditJi At Request — Next.js Frontend

This is the Next.js version of the frontend for **PanditJi At Request**, built with Next.js 16 (App Router), TypeScript, and Tailwind CSS.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd nextjs-frontend
npm install
```

### 2. Configure Environment
A configured `.env.local` is already in place:
```env
# Backend API URL
VITE_API_URL=http://localhost:8001/api
NEXT_PUBLIC_API_URL=http://localhost:8001/api

# Encryption Key
VITE_ENCRYPTION_KEY=6b9dec45624b76a35233223264781baf4becc3010bdf5b9655f7edea4aeb102a
NEXT_PUBLIC_ENCRYPTION_KEY=6b9dec45624b76a35233223264781baf4becc3010bdf5b9655f7edea4aeb102a

# Meta Pixel
VITE_META_PIXEL_ID=1991550221408755
NEXT_PUBLIC_META_PIXEL_ID=1991550221408755
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or whichever port Next.js binds to).

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📁 Architecture & Folder Structure

```
nextjs-frontend/
├── src/
│   ├── app/                    # Next.js App Router (Routes & Server Metadata)
│   │   ├── layout.tsx          # Root Layout (Google Fonts, GTM, Meta Pixel, ClientProviders)
│   │   ├── page.tsx            # Home Route (/)
│   │   ├── book-puja/          # Book Puja Route (/book-puja)
│   │   ├── chadhava/           # Chadhava Route (/chadhava)
│   │   ├── kashi/              # Kashi Route (/kashi)
│   │   ├── shop/               # Shop Route (/shop & /shop/[category])
│   │   ├── puja/               # Puja Catalog & Detail (/puja & /puja/[pujaId])
│   │   ├── category/           # Puja Categories (/category & /category/[categoryId])
│   │   ├── vedic-vivah/        # Vedic Vivah Sanskar (/vedic-vivah, checkout, packages, guides)
│   │   ├── all-pandits/        # Pandit Listings (/all-pandits & /pandit/[panditId])
│   │   ├── my-bookings/        # Devotee Bookings (/my-bookings)
│   │   ├── account/            # Account & Profile (/account & /profile)
│   │   ├── [...slug]/          # Catch-all router for deep dynamic URLs and legacy redirects
│   │   └── globals.css         # Complete site styling, animations & Tailwind v4 theme tokens
│   ├── compat/                 # Seamless Next.js compatibility layer
│   │   └── react-router-dom.tsx# Maps useNavigate, useLocation, Link, Navigate to Next.js navigation
│   ├── components/             # Reusable UI components & layouts
│   │   ├── ClientProviders.tsx # Wraps Auth, Shopify Cart, Modals & Currency
│   │   ├── layout/AppLayout.tsx# Main tabbed mobile shell & floating WhatsApp contact button
│   │   └── booking/, vivah/, etc.
│   ├── views/                  # Page view components (migrated from Vite frontend/src/pages)
│   ├── context/                # AuthContext, ShopifyCartContext
│   ├── utils/                  # Currency conversion, analytics, encryption, API configs
│   ├── data/                   # Catalog, packages, rituals, pricing
│   └── store/                  # Zustand stores (e.g. Pandit live tracking)
├── public/                     # Static assets, hero images, badges, robots.txt, sitemap.xml
├── next.config.ts              # Next.js configuration with remote image domains and aliases
├── tsconfig.json               # TypeScript path mappings (@/* and react-router-dom)
└── package.json                # Dependencies and scripts
```

---

## ✨ Features & Enhancements

1. **Full Next.js App Router Compatibility**: All pages are rendered through modern Next.js 16 App Router routes.
2. **SEO & Prerendering**: Includes automatic title tags, Open Graph meta tags, JSON-LD schema, and GTM / Meta Pixel support.
3. **Zero Breaking Changes**: With the `@/compat/react-router-dom` adapter, all existing UI components, modals, and workflows work seamlessly in Next.js.
4. **Original Frontend Preserved**: The existing `frontend/` folder remains untouched as a safe reference and backup.
