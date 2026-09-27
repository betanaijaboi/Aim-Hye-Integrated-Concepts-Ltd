# Aim-Hye Integrated Concepts Ltd — Distribution Platform

A full-stack beverage distribution web app for Aim-Hye Integrated Concepts Limited. Customers can browse products, place orders, and track deliveries. Admins manage stock, procurement, trucks, drivers, and payments.

---

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Database**: SQLite via Prisma ORM (`@prisma/adapter-libsql`)
- **Styling**: Tailwind CSS v4
- **Payments**: Paystack
- **Auth**: OTP (SMS), PIN, WebAuthn (biometric/passkey)

---

## Running on a Fresh Laptop

### 1. Prerequisites

Install the following before starting:

- [Node.js 20+](https://nodejs.org) — download and install the LTS version
- [Git](https://git-scm.com/downloads) — for cloning the repo

Verify both are installed:

```bash
node -v
git --version
```

---

### 2. Clone the Repo

```bash
git clone https://github.com/betanaijaboi/Aim-Hye-Integrated-Concepts-Ltd.git
cd Aim-Hye-Integrated-Concepts-Ltd/aim-hye
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Set Up Environment Variables

Create a `.env` file inside the `aim-hye/` folder:

```bash
cp .env.example .env
```

Then open `.env` and fill in these values:

```env
# Signs customer and manager session cookies (and NextAuth).
# Required in production. Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="replace-with-a-long-random-string"

# Paystack (get keys from https://dashboard.paystack.com)
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxxxxxxxxxxxx"

# WebAuthn / passkey settings (must match the browser URL)
NEXT_PUBLIC_RP_ID="localhost"
NEXT_PUBLIC_RP_NAME="Aim-Hye Integrated Concepts"
NEXT_PUBLIC_ORIGIN="http://localhost:3000"

# Canonical site URL for SEO metadata, sitemap and robots.txt
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

The SQLite database lives at `prisma/dev.db`, so no `DATABASE_URL` is needed.

> **Paystack keys are optional for local testing** — the app will still run, but payment flows won't process real transactions.

---

### 5. Set Up the Database

```bash
npx prisma migrate deploy
npx prisma db seed
```

This creates the SQLite database and seeds it with all products (Champion, International Breweries, Nigerian Breweries, Guinness Nigeria).

---

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Customer storefront — browse & order drinks |
| `/account` | Customer account — order history, tracker, security |
| `/account/login` | Customer login (OTP) |
| `/account/register` | Customer registration |
| `/admin` | Admin dashboard — stock, orders, trucks, procurement |

**Default admin login** (created by the seed):
- Email: `admin@aimhye.com`
- Password: `Admin1234!`

> Change this immediately after first login.

---

## Production Deployment

For a production server (e.g. a VPS or cloud host):

```bash
npm run build
npm start
```

Set `NODE_ENV=production` and use a process manager like [PM2](https://pm2.keymetrics.io):

```bash
npm install -g pm2
pm2 start npm --name "aim-hye" -- start
pm2 save
pm2 startup
```

---

## Folder Structure

```
aim-hye/
├── prisma/
│   ├── schema.prisma      # Database models
│   ├── seed.ts            # Product & admin seed data
│   └── dev.db             # SQLite database (local only)
├── public/
│   └── uploads/           # Product images & logo
├── src/
│   ├── app/
│   │   ├── page.tsx       # Storefront
│   │   ├── account/       # Customer account pages
│   │   ├── admin/         # Admin dashboard
│   │   ├── products/      # Product detail pages
│   │   └── api/           # API routes
│   └── lib/
│       ├── prisma.ts      # Prisma client
│       ├── customerAuth.ts
│       ├── paystack.ts
│       ├── invoice.ts
│       └── productImages.ts
└── package.json
```

---

## Support

For issues or questions, contact **Aim-Hye Integrated Concepts Limited**.
