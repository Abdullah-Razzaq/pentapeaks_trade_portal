# Trade Portal

A clean, minimal web app for an import/export business to look up **buyers (importers)** and **suppliers (exporters)** from real Pakistan Customs shipment data, with secure role-based access for Admins and Users.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — white & orange theme
- **PostgreSQL (Neon)** via `pg` — data lives in the `export_shipments` table already seeded from the `.xls` exports, plus a `users` table for auth
- **Auth**: custom JWT sessions (`jose`) in an httpOnly cookie + `bcryptjs` password hashing — no external auth service, no microservices

## Features

- Login page (white/orange theme, simple email + password form)
- Role-based access:
  - **Admin**: everything a User can do, plus a "Manage Users" page to view all registered users, create new users, and activate/deactivate accounts
  - **User**: dashboard with two buttons — **Find Buyer** and **Find Supplier**
- Find Buyer / Find Supplier pages: live company-name filter over `export_shipments`, aggregated into a clean table (shipments, countries, buyers/suppliers, total value, last shipment)
- Route protection via `src/proxy.ts` (Next 16's `middleware` → `proxy` convention) plus server-side session checks on every page/API route (defense in depth)

## Getting Started

```bash
npm install
npm run seed   # creates the `users` table and one admin account (first run only)
npm run dev    # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (same database as `export_shipments`) |
| `JWT_SECRET` | Random secret used to sign session tokens — already generated |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used **once** by `npm run seed` to create the first admin login |

Default admin login created by the seed script:

- Email: `admin@tradeportal.local`
- Password: `ChangeMe123!`

**Change this password** by logging in as this admin, creating a new admin account with your real email/password from the Manage Users page, then deactivating the default one.

### Adding more users

Log in as an admin → **Manage Users** → fill in the "Add New User" form (name, email, temporary password, role). There is no public sign-up page by design — this is an internal business tool.

## Data model

- `export_shipments` — one row per customs shipment (already populated by `../import_exports.py`). `exporter` = Pakistani supplier, `importer` = foreign buyer.
- `users` — `id, name, email, password_hash, role ('admin'|'user'), is_active, created_at`.

## Branding

`src/components/Logo.tsx` is a placeholder import/export mark (orange circular badge with an exchange-arrows motif). Swap it for your real logo and update the "Trade Portal" name in `src/app/layout.tsx`, `src/app/login/page.tsx`, and `src/components/DashboardHeader.tsx` once the company name is finalized.

## Production notes

- Run `npm run build && npm start` to serve the production build.
- Set `DATABASE_URL` and a strong random `JWT_SECRET` in your hosting provider's environment settings (don't reuse the local one).
- Cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.
