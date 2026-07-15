# Project Checklist: DiscountBazaar.PK

## Phase 1: Foundation & Backend Setup
- [✅] Initialize monorepo structure (Web + Backend).
- [✅] Setup Node.js/Express server with TypeScript.
- [✅] Configure MongoDB connection and create all Mongoose schemas (`Users`, `Products`, `Squads`, `Transactions`, `Orders`, `Disputes`).
- [✅] Implement global error handling and middleware (JWT authentication).

## Phase 2: Core API Development
- [✅] Build `/api/auth/whatsapp` endpoints.
- [✅] Build `/api/products` endpoints (CRUD).
- [✅] Integrate Safepay SDK and build `/api/escrow` webhooks.
- [✅] Setup Redis & BullMQ for 24-hour Squad expiration jobs.

## Phase 3: Web Portals (Next.js)
- [✅] Setup Tailwind CSS with Oceanic Blue and Electric Mint themes.
- [✅] Build Hybrid Homepage (Trending Squads + Catalog).
- [✅] Build Dual-Checkout Product Detail Page (PDP).
- [✅] Build Buyer Dashboard (Order Tracking + Voting UI).
- [ ] Build Admin Command Center (Escrow Ledger, Proposal Queue).
- [ ] Build Supplier SaaS Dashboard (Product Generator, Manifests).

## Phase 4: Mobile App (Flutter)
- [ ] Initialize Flutter project.
- [ ] Implement WhatsApp OTP Auth screen.
- [ ] Build Deal Feed and gamified UI progress bars.
- [ ] Integrate Safepay WebView for in-app authorization.
- [ ] Integrate `share_plus` for WhatsApp viral loops.
