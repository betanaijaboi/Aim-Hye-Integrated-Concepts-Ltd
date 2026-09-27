# Aim-Hye Distribution Platform

A full-stack beverage distribution platform built for Aim-Hye Integrated
Concepts Ltd, a drinks distributor in Nigeria. Customers browse products,
order, pay and track deliveries. Admins and branch managers run stock,
procurement, trucks, drivers, empties and payments.

**Stack:** Next.js 16 (App Router, TypeScript) · Prisma + SQLite (libSQL
adapter) · Tailwind CSS v4 · Paystack · jose JWT sessions · WebAuthn passkeys ·
react-pdf invoices

## Features

**Customer storefront**
- Browse more than 100 products from four breweries, with per-product SEO pages
- Cart, checkout and Paystack payments, with signature-verified webhooks
- Order history and delivery tracking
- Sign-in with a phone OTP, a PIN, or a passkey (WebAuthn)

**Operations (admin and branch managers)**
- Stock levels and stock movement log
- Procurement: purchase orders, supplier payments and goods receipts
- Fleet: trucks, drivers, salesboys, truck allocations and empty-crate returns
- Customer and order management, PDF invoices and data export
- Role-based access (ADMIN vs branch MANAGER), with manager changes going
  through an approval queue

## Running it

The app lives in [`aim-hye/`](aim-hye/):

```bash
cd aim-hye
npm install
cp .env.example .env         # fill in NEXTAUTH_SECRET (and Paystack keys if needed)
npx prisma migrate deploy
npm run seed
npm run dev                  # http://localhost:3000
```

Full setup, the page map, deployment notes and the folder structure are in
**[aim-hye/README.md](aim-hye/README.md)**.

## Legal

[Terms](TERMS.md) · [Privacy](PRIVACY.md)
