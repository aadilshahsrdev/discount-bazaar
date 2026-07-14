# Project Context: DiscountBazaar.PK

## 1. Project Vision & Business Goals
DiscountBazaar is designed to bypass expensive digital marketing CAC. It incentivizes consumers to form groups ("Squads") of up to 30 buyers to unlock wholesale dropshipping prices. The platform strictly enforces a Zero-Wallet Policy to comply with State Bank of Pakistan (SBP) regulations, holding 10% deposits as pre-authorizations (not settlements) via Safepay.

## 2. Brand Identity & UI Philosophy
*   **Primary Color (Trust):** Oceanic Blue `#0F4C81`
*   **Secondary Color (Action):** Electric Mint `#00E676`
*   **Background:** Off-White `#F8F9FA`
*   **Typography:** 'Inter' (Headings/Numbers) and 'Roboto' (Body).
*   **UI Philosophy:** 2026 Premium Minimalist. Mobile-first for buyers. High data density for Admins.

## 3. Core Mechanisms
*   **Dual-Checkout:** Every product has a "Buy Now" (Standard Retail) and "Join Squad" (Requires 10% deposit, 24-hour lock).
*   **The Voting Phase:** If a Squad reaches 24 hours without hitting 30 members, buyers vote to 'Proceed' (capturing funds at the current dynamic discount) or 'Opt-Out' (voiding the transaction instantly).
*   **Dynamic Discount Formula:** `Discount = (Current Buyers / Max Buyers) * Max Allowed Discount`. Anchored against retail price, never wholesale cost.

## 4. Database Architecture (MongoDB)
*   `Users`: phone_number, role (Buyer/Supplier/Admin), supplier_details.
*   `Products`: market_anchor_price, base_wholesale_cost, max_squad_discount, dual_checkout_enabled.
*   `Squads`: product_id, current_members, expires_at, status.
*   `Transactions`: safepay_tracker_id, hold_amount, escrow_state (Authorized/Captured/Voided).
*   `Orders`: logistics_status, total_order_value, cod_amount_due.
*   `Disputes`: issue_type, evidence_images, status.

## 5. Core API Routes (Node/Express)
*   `/api/auth/whatsapp/*`: OTP generation and verification.
*   `/api/products/*`: Catalog fetching, Admin direct uploads, Supplier proposals.
*   `/api/squads/*`: Active Squad feeds, voting logic triggers.
*   `/api/escrow/*`: Safepay checkout initiation, Webhook listeners (`authorization.success`), manual capture/void overrides.
*   `/api/orders/*`: Buyer history, Supplier manifests, Courier webhook sync.

## 6. Current Status
*   Architecture, UI/UX, and Database Schemas finalized.
*   Ready for backend initialization.