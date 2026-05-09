# K-LINE MEN admin dashboard

Phase 1 admin dashboard — Preact SPA + Pages Functions on Cloudflare. Lives at `admin.klinemen.ug`.

## Stack

- **UI:** Preact + Vite, in `src/`
- **API:** Cloudflare Pages Functions, in `functions/` (same-origin with the SPA, no CORS)
- **Database:** Cloudflare D1 (SQLite), schema in `migrations/` (added in Phase 1b)
- **Image storage:** Cloudflare R2 (originals) + Cloudflare Images (WebP variants)
- **Auth:** Cloudflare Access — Google login, allow-listed emails. Manager and Editor groups.

## Phase 1a — first-time setup

These steps require a real Cloudflare account and need to be run by the owner. They are one-shot.

### 1. Install dependencies

```powershell
cd admin-app
npm install
```

### 2. Authenticate with Cloudflare

```powershell
npx wrangler login
```

Opens a browser. Sign in with the Cloudflare account that hosts `klinemen.ug`. Confirm:

```powershell
npx wrangler whoami
```

### 3. Create the D1 database

```powershell
npm run db:create
```

The command prints a `database_id`. Copy it into `wrangler.toml` (the commented `[[d1_databases]]` block) and uncomment those four lines.

### 4. Create the R2 bucket

```powershell
npx wrangler r2 bucket create klinemen-images
```

Then uncomment the `[[r2_buckets]]` block in `wrangler.toml`.

### 5. First deploy

```powershell
npm run build
npm run deploy
```

On first deploy, wrangler will offer to create a Pages project named `klinemen-admin` — say yes. Note the `*.pages.dev` preview URL it returns.

### 6. Custom domain

In the Cloudflare dashboard → **Workers & Pages → klinemen-admin → Custom domains** → add `admin.klinemen.ug`. DNS is auto-configured because the zone is on the same Cloudflare account.

### 7. Cloudflare Access policy

In the Cloudflare dashboard:

1. **Zero Trust → Access → Applications → Add application → Self-hosted**
2. Application domain: `admin.klinemen.ug` (subdomain `admin`, domain `klinemen.ug`)
3. **Identity providers:** enable Google (one-click) and One-time PIN (email OTP — backup if Google access is lost)
4. **Policies:**
   - Policy name: `Manager` — Action: Allow — Include: Emails → owner email. This is the publish-rights group.
   - Policy name: `Editor` — Action: Allow — Include: Emails → (empty for now; staff added in Phase 1j). This is the draft-only group.
5. Save the application.

### 8. Verify

Visit `https://admin.klinemen.ug/healthz` in a private browser window:

- Anonymous: redirects to Google login (Cloudflare Access).
- After signing in with the Manager-allowed email: returns `{ "ok": true, "service": "klinemen-admin", "phase": "1a", "user": "<your email>" }`.

When that returns 200 only for allow-listed logins, **Phase 1a is done.**

## Local development

```powershell
npm run dev          # Vite dev server only — UI in isolation, /healthz returns 404
npm run dev:full     # Wrangler Pages dev server — UI + Functions together
```

`dev:full` is the right choice when working on both the SPA and the API. The first run takes a moment as wrangler downloads the workerd runtime.

## Folder layout

| Path | Purpose |
|---|---|
| `src/` | Preact app — entry point in `main.tsx`, root component in `app.tsx` |
| `functions/` | Pages Functions (the API). One file per route. `healthz.ts` lives at top level so it answers `/healthz`. |
| `public/` | Static assets copied verbatim into `dist/` (e.g. `_headers`, `robots.txt`) |
| `migrations/` | D1 SQL migrations (Phase 1b adds `0001_initial.sql`) |
| `wrangler.toml` | Cloudflare bindings (D1, R2, vars) and Pages config |
| `vite.config.ts` | Vite + Preact build config |
| `tsconfig.json` | TypeScript strict mode, JSX → Preact, Cloudflare Workers types |

## After Phase 1a

The next steps are tracked in [../ROADMAP.md §3.4](../ROADMAP.md). Phase 1b lands the D1 schema and seeds the catalog.
