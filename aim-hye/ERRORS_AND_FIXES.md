# Aim-Hye Integrated Concepts — Errors & Fixes Log

All errors encountered during development of this platform, with root causes and resolutions. Compiled for future documentation and onboarding.

---

## 1. Prisma v7: `url` in datasource block no longer supported

**Error:**
```
The datasource property url is no longer supported in schema files
```

**Root Cause:**
Prisma v7 is a major breaking version. The `url` field was removed from the `datasource` block in `schema.prisma`. It must now live in a separate `prisma.config.ts` file.

**Fix:**
- Removed `url` from `prisma/schema.prisma` datasource block (leave it empty with just `provider = "sqlite"`)
- Created `prisma.config.ts` in the project root:
```ts
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: "file:./prisma/dev.db",
  },
} as any); // `as any` needed because TS doesn't recognise `earlyAccess` flag
```

**Gotcha:** First attempt used `migrate.url` as the key — that's wrong. The correct key is `datasource.url`.

---

## 2. Prisma v7: PrismaClient requires a driver adapter

**Error:**
```
PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions
```

**Root Cause:**
Prisma v7 removed the built-in query engine and requires an explicit driver adapter to connect to the database.

**Fix:**
Install and use `@prisma/adapter-libsql` with `@libsql/client`:
```bash
npm install @prisma/adapter-libsql @libsql/client
```
```ts
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";

function createPrisma() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter } as any);
}
```

---

## 3. Wrong import name: `PrismaLibSQL` vs `PrismaLibSql`

**Error:**
```
PrismaLibSQL is not a constructor
```

**Root Cause:**
The package `@prisma/adapter-libsql` exports `PrismaLibSql` (lowercase `l` at end), not `PrismaLibSQL` (all caps).

**Fix:**
```ts
// WRONG
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// CORRECT
import { PrismaLibSql } from "@prisma/adapter-libsql";
```

Confirmed by running: `Object.keys(require('@prisma/adapter-libsql'))` → `['PrismaLibSql']`

---

## 4. `PrismaLibSql` constructor takes a config object, not a client instance

**Error:**
Runtime error when trying to connect — adapter wasn't initialising properly.

**Root Cause:**
Initially passed a `libsql` client instance to `PrismaLibSql`. The correct usage is to pass a config object directly — the adapter creates the client internally.

**Fix:**
```ts
// WRONG
const client = createClient({ url: `file:${dbPath}` });
const adapter = new PrismaLibSql(client);

// CORRECT
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
```

---

## 5. Windows path separators in file URLs

**Error:**
Database not found / connection error on Windows.

**Root Cause:**
`path.join()` on Windows produces backslashes (`\`). The libsql file URL requires forward slashes.

**Fix:**
```ts
const dbPath = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
// Result: "C:/Users/.../prisma/dev.db"  ✅ (not "C:\Users\...")
```

---

## 6. TypeScript error: `earlyAccess` not in `PrismaConfig` type

**Error:**
```
Argument of type '{ earlyAccess: boolean; schema: string; datasource: { url: string; } }'
is not assignable to parameter of type 'PrismaConfig'
```

**Root Cause:**
The `earlyAccess` flag used in early Prisma v7 docs caused a TS type error because it wasn't declared in the exported type definition.

**Fix:**
Cast the config object as `any`:
```ts
export default defineConfig({ ... } as any);
```

---

## 7. npm commands using `| tail` fail on Windows PowerShell

**Error:**
```
tail: command not found
```

**Root Cause:**
`tail` is a Unix command. PowerShell doesn't have it.

**Fix:**
Use `Select-Object -Last N` instead:
```powershell
npm install 2>&1 | Select-Object -Last 10
```

---

## 8. Next.js port conflict

**Symptom:**
Dev server auto-switched to port 3002 but the app was already responding on port 3000 (another instance was running).

**Fix:**
Stop the other running instance first, or use `npx next dev -p 3001` to pick a specific port.

---

## 9. Next.js 16 SWC binary missing on Windows

**Error:**
```
Failed to load SWC binary for win32/x64
Failed to load next.config.ts
```

**Root Cause:**
Next.js 16 with Turbopack requires the `@next/swc-win32-x64-msvc` native binary. npm installs the package skeleton but the actual `.node` binary file was renamed to `.DELETE.*` in the `next-swc-fallback` directory (likely by a previous failed install).

**Fix:**
```powershell
$dir = "node_modules\next\next-swc-fallback\@next\swc-win32-x64-msvc"
# Find the .DELETE file
$src = "$dir\next-swc.win32-x64-msvc.node.DELETE.*"
# Copy it back to the correct name
Copy-Item $src "$dir\next-swc.win32-x64-msvc.node"
```

**Also:** Rename `next.config.ts` to `next.config.js` if the SWC binary isn't available — TypeScript config files require SWC to compile, plain JS doesn't.

---

## 10. `next.config.ts` fails when SWC is not loaded

**Error:**
```
Failed to load next.config.ts, see more info here https://nextjs.org/docs/messages/next-config-error
```

**Root Cause:**
`next.config.ts` is a TypeScript file and requires the SWC compiler to be loaded first. If SWC fails (see error #9 above), the config can't load.

**Fix:**
Use `next.config.js` instead:
```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
```

---

## 11. `Payment` Prisma model create missing `customerId`

**Error:**
```
Argument `customerId` is missing.
```

**Root Cause:**
The `Payment` model has a required `customerId` foreign key. When creating a payment inline inside a `customerOrder.create()` nested write, the `customerId` must be explicitly included in the nested `payment.create` data.

**Fix:**
```ts
payment: {
  create: {
    customerId: session.id,  // <-- required even in nested create
    method: paymentMethod,
    amount: totalPayable,
    reference: paystackRef,
    status: "PENDING",
  },
},
```

---

## 12. `Buffer` not assignable to `BodyInit` in NextResponse

**Error:**
```ts
Type 'Buffer<ArrayBufferLike>' is not assignable to parameter of type 'BodyInit | null | undefined'
```

**Root Cause:**
`@react-pdf/renderer`'s `renderToBuffer()` returns a Node.js `Buffer`. Next.js `NextResponse` expects `BodyInit` (which includes `Uint8Array` but not `Buffer` directly in strict TS).

**Fix:**
```ts
// WRONG
return new NextResponse(pdfBuffer, { headers: { "Content-Type": "application/pdf" } });

// CORRECT
return new NextResponse(new Uint8Array(pdfBuffer), { headers: { "Content-Type": "application/pdf" } });
```

---

## 13. `CustomerAccount.password` required — OTP-only registration fails

**Error:**
```
Argument `password` is missing.
```

**Root Cause:**
Original schema had `password String` (non-nullable) on `CustomerAccount`. The new OTP-only registration flow doesn't collect a password.

**Fix:**
Change schema to `password String?` (optional), then run:
```bash
npx prisma migrate dev --name make_password_optional
npx prisma generate
```

---

## 14. Prisma relation accessor name mismatch (`webAuthnCredentials` vs `webAuthnCreds`)

**Error:**
Runtime error — property undefined.

**Root Cause:**
The Prisma schema defines the relation field as `webAuthnCreds WebAuthnCredential[]` on `CustomerAccount`. Code was referencing `customer.webAuthnCredentials` (plural, full name) which doesn't exist.

**Fix:**
Always use the exact field name from the schema:
```ts
// WRONG
customer.webAuthnCredentials

// CORRECT (matches schema field name)
customer.webAuthnCreds
```

---

## 15. `order.payment` property not available without `include`

**Error:**
```
Property 'payment' does not exist on type '...'
```

**Root Cause:**
Prisma doesn't auto-include related models. Accessing `order.payment` requires explicitly including it in the query.

**Fix:**
```ts
const order = await prisma.customerOrder.findUnique({
  where: { id: orderId },
  include: {
    customer: true,
    payment: true,  // <-- must explicitly include
  },
});
```

---

## 16. `@simplewebauthn/types` not installed

**Error:**
```
Cannot find module '@simplewebauthn/types' or its corresponding type declarations.
```

**Root Cause:**
`@simplewebauthn/server` and `@simplewebauthn/browser` were installed but the shared types package was not.

**Fix:**
```bash
npm install @simplewebauthn/types
```

---

## 17. Prisma client not updated after schema change

**Symptom:**
Prisma client still shows old field as required after making it optional in schema.

**Root Cause:**
`prisma migrate dev` updates the database but you must also run `prisma generate` to update the TypeScript client types.

**Fix:**
Always run both after a schema change:
```bash
npx prisma migrate dev --name your_migration_name
npx prisma generate
```
And restart the dev server after — the running Node process caches the old module.

---

## 18. Prisma back-relations required on both sides

**Error:**
```
Error validating model "PurchaseOrder": The relation field `raisedBy` on model `PurchaseOrder` is missing an opposite relation field on the model `AdminUser`.
```

**Root Cause:**
Prisma requires every relation to be declared on *both* models. When adding a relation from `PurchaseOrder → AdminUser`, you must also add the back-relation array on `AdminUser`.

**Fix:**
Add back-relation fields on `AdminUser`:
```prisma
model AdminUser {
  // ... existing fields ...
  raisedPOs        PurchaseOrder[]   @relation("RaisedPOs")
  approvedPOs      PurchaseOrder[]   @relation("ApprovedPOs")
  purchasePayments PurchasePayment[]
  goodsReceipts    GoodsReceipt[]
}
```
And similarly on `Brewery` and `Product` for new procurement models.

---

## 23. Product variants — packaging and size grouping

**Design decision:**
Added `packaging String @default("glass")` and `productFamily String?` to the `Product` model.
- `packaging` values: `"glass"` | `"can"` | `"pet"` (plastic bottle)
- `productFamily` is a slug (e.g. `"star-lager"`) that groups all variants of the same drink across different sizes and packaging types.
- Single-variant products leave `productFamily` as `null` — no variant picker is shown on their detail page.

**Stock and deposit rules:**
- Glass bottles: deposit charged per crate (refundable when empties returned).
- Cans / PET: `depositPerCrate = 0` (no return).

**API change:**
`GET /api/products/[id]` now returns `{ ...product, siblings: Product[] }` where siblings are other active variants with the same `productFamily`.

---

## 21. React state cart lost on page navigation — use localStorage hook

**Problem:**
Cart stored in `useState` inside `page.tsx` was wiped whenever the user navigated to `/products/[id]` and back.

**Fix:**
Extracted cart into a `useCart` hook (`src/lib/useCart.ts`) that persists to `localStorage` under key `aimhye_cart_v2`. The hook loads on mount and writes on every change. Both the storefront and the product detail page share the same cart state via this hook.

**Key detail:** Use a versioned key (`_v2`) when the cart item shape changes (added `unit` field) to avoid parsing stale JSON from old sessions.

---

## 22. Bottle vs crate stock deduction — integer math

**Problem:**
`stockCrates` is an `Int` in Prisma. If a customer buys 6 bottles from a 12-bottle crate, the naive deduction would be `Math.floor(6/12) = 0` — nothing deducted.

**Fix:**
Use `Math.ceil(bottleQty / packSize)` for stock deduction on bottle orders. This is conservative (reserves a full crate even for 1 bottle) but prevents overselling. The price is always correct (`pricePerBottle × qty`) regardless of the deduction rounding.

---

## 20. `next/image` requires remote domains to be whitelisted

**Error:**
```
Error: Invalid src prop on `next/image`, hostname "www.nbplc.com" is not configured under images in your `next.config.js`
```

**Root Cause:**
Next.js `<Image>` blocks external image hostnames by default for security. All external CDN domains must be declared in `next.config.js`.

**Fix:**
```js
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.nbplc.com" },
      { protocol: "https", hostname: "assets.untappd.com" },
    ],
  },
};
```

---

## 19. Named relations required for multiple FK relationships to the same model

**Root Cause:**
`PurchaseOrder` has two foreign keys to `AdminUser` (`raisedById` and `approvedById`). Prisma requires named relations (`@relation("RaisedPOs")` etc.) to disambiguate which FK maps to which back-relation field.

**Fix:**
Use `@relation("Name")` on both the forward and back sides:
```prisma
// On PurchaseOrder:
raisedBy   AdminUser  @relation("RaisedPOs", fields: [raisedById], references: [id])
approvedBy AdminUser? @relation("ApprovedPOs", fields: [approvedById], references: [id])

// On AdminUser:
raisedPOs   PurchaseOrder[] @relation("RaisedPOs")
approvedPOs PurchaseOrder[] @relation("ApprovedPOs")
```
