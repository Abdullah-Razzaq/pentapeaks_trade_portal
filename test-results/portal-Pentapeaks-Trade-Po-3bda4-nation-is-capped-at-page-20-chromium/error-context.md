# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal.spec.ts >> Pentapeaks Trade Portal User Workflows >> trial user pagination is capped at page 20
- Location: e2e\portal.spec.ts:84:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard\/find-buyer/
Received string:  "http://localhost:3000/dashboard/expired"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    23 × locator resolved to <html lang="en" class="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li5zG__variable h-full antialiased">…</html>
       - unexpected value "http://localhost:3000/dashboard/expired"

```

```yaml
- text: Your 1-day free trial is active. Upgrade to Pro to unlock unlimited access and prevent loss of access.
- banner:
  - link "Pentapeaks Trade Portal Logo Pentapeaks Trade Portal":
    - /url: /dashboard
    - img "Pentapeaks Trade Portal Logo"
    - text: Pentapeaks Trade Portal
  - navigation:
    - link "Dashboard":
      - /url: /dashboard
    - link "Find Buyer":
      - /url: /dashboard/find-buyer
    - link "Find Supplier":
      - /url: /dashboard/find-supplier
    - link "HS Code Search":
      - /url: /dashboard/hs-code-search
    - link "Check Tariff/VAT":
      - /url: /dashboard/check-tariff
  - paragraph: Test User • Online
  - text: T
- main:
  - img
  - heading "Subscription Expired" [level=2]
  - paragraph: Your account subscription has expired. You have been temporarily locked out of the dashboard features.
  - paragraph: Please contact your administrator to renew your access to the portal.
- contentinfo:
  - img "Pentapeaks Logo"
  - text: PentaPeaks International
  - paragraph: PentaPeaks Trade Portal — Pakistan's Gateway to Global Markets.
  - link "Facebook":
    - /url: https://www.facebook.com/people/PentaPeaks-International/61589825756983/?mibextid=wwXIfr
    - img
  - link "Instagram":
    - /url: https://www.instagram.com/pentapeaks_intl
    - img
  - link "LinkedIn":
    - /url: https://www.linkedin.com/company/pentapeaks-international-pvt-ltd/
    - img
  - link "TikTok":
    - /url: https://www.tiktok.com/@pentapeaks_intl
    - img
  - link "YouTube":
    - /url: https://www.youtube.com/@PentaPeaksInternational
    - img
  - heading "Quick Links" [level=3]
  - list:
    - listitem:
      - link "Find Buyer":
        - /url: /dashboard/find-buyer
    - listitem:
      - link "Find Supplier":
        - /url: /dashboard/find-supplier
    - listitem:
      - link "HS Code Search":
        - /url: /dashboard/hs-code-search
    - listitem:
      - link "Tariff / Duty Calculator":
        - /url: /dashboard/check-tariff
  - heading "Mentorship & Portal" [level=3]
  - list:
    - listitem:
      - link "Import/Export Mentorship":
        - /url: https://pentapeaks.com/mentorship
    - listitem:
      - link "Become a Supplier":
        - /url: https://pentapeaks.com/supplier
    - listitem:
      - link "Buyer Inquiry":
        - /url: https://pentapeaks.com/buyer
    - listitem:
      - link "About Us":
        - /url: https://pentapeaks.com/about
  - heading "Pakistan Office" [level=3]
  - list:
    - listitem:
      - img
      - text: WAPDA Town Lahore, Pakistan
    - listitem:
      - img
      - link "+92 308 6222283":
        - /url: tel:+923086222283
    - listitem:
      - img
      - link "info@pentapeaks.com":
        - /url: mailto:info@pentapeaks.com
    - listitem:
      - img
      - text: "Mon-Fri: 9AM - 6PM (PKT) Sat: 10AM - 2PM"
  - heading "USA Office" [level=3]
  - list:
    - listitem:
      - img
      - text: 237 N 13th St, Allentown, PA 18102, USA
    - listitem:
      - img
      - link "+1 609 635 5116":
        - /url: tel:+16096355116
    - listitem:
      - img
      - link "info@pentapeaks.com":
        - /url: mailto:info@pentapeaks.com
    - listitem:
      - img
      - text: "Mon-Fri: 9AM - 5PM (EST)"
  - paragraph: © 2026 PentaPeaks International. All rights reserved.
  - link "Privacy Policy":
    - /url: "#"
  - link "Terms of Service":
    - /url: "#"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import jwt from 'jsonwebtoken';
  3  | import dotenv from 'dotenv';
  4  | import { Pool } from 'pg';
  5  | 
  6  | dotenv.config({ path: '.env.local' });
  7  | 
  8  | let pool: Pool;
  9  | let standardUserId: number;
  10 | const TEST_USER_SESSION_TOKEN = "test_user_session_token_123";
  11 | 
  12 | function generateMockToken(role: "admin" | "user", userId: number, sessionToken: string) {
  13 |   const secret = process.env.JWT_SECRET || "testsecret";
  14 |   return jwt.sign(
  15 |     {
  16 |       userId,
  17 |       email: role === "admin" ? "admin_test@pentapeaks.local" : "user_test@pentapeaks.local",
  18 |       name: role === "admin" ? "Test Admin" : "Test User",
  19 |       role,
  20 |       sessionToken,
  21 |     },
  22 |     secret,
  23 |     { algorithm: "HS256" }
  24 |   );
  25 | }
  26 | 
  27 | test.describe('Pentapeaks Trade Portal User Workflows', () => {
  28 |   let userToken: string;
  29 | 
  30 |   test.beforeAll(async () => {
  31 |     pool = new Pool({
  32 |       connectionString: process.env.DATABASE_URL,
  33 |       ssl: { rejectUnauthorized: false }
  34 |     });
  35 | 
  36 |     const res = await pool.query(
  37 |       `INSERT INTO users (email, name, password_hash, role, plan_type, current_session_token) 
  38 |        VALUES ($1, $2, $3, $4, $5, $6)
  39 |        ON CONFLICT (email) DO UPDATE SET current_session_token = $6, role = $4
  40 |        RETURNING id`,
  41 |       ["user_test@pentapeaks.local", "Test User", "hash", "user", "trial", TEST_USER_SESSION_TOKEN]
  42 |     );
  43 |     standardUserId = res.rows[0].id;
  44 |     userToken = generateMockToken('user', standardUserId, TEST_USER_SESSION_TOKEN);
  45 |   });
  46 | 
  47 |   test.afterAll(async () => {
  48 |     if (pool) {
  49 |       await pool.query(`DELETE FROM users WHERE email = 'user_test@pentapeaks.local'`);
  50 |       await pool.end();
  51 |     }
  52 |   });
  53 | 
  54 |   test.beforeEach(async ({ context }) => {
  55 |     await context.addCookies([
  56 |       {
  57 |         name: 'session',
  58 |         value: userToken,
  59 |         domain: 'localhost',
  60 |         path: '/',
  61 |         httpOnly: true,
  62 |         secure: false,
  63 |         sameSite: 'Lax',
  64 |       }
  65 |     ]);
  66 |   });
  67 | 
  68 |   test('clicking product search shows 10 top commodities + search hint', async ({ page }) => {
  69 |     await page.goto('/dashboard');
  70 |     await expect(page).toHaveURL(/.*dashboard/);
  71 |   });
  72 | 
  73 |   test('non-admin copy protection applies user-select: none globally', async ({ page }) => {
  74 |     await page.goto('/dashboard');
  75 |     
  76 |     // Evaluate if the body has the select-none class for non-admin user
  77 |     const hasSelectNone = await page.evaluate(() => {
  78 |       return document.body.classList.contains('select-none');
  79 |     });
  80 |     
  81 |     expect(hasSelectNone).toBe(true);
  82 |   });
  83 | 
  84 |   test('trial user pagination is capped at page 20', async ({ page }) => {
  85 |     await page.goto('/dashboard/find-buyer');
> 86 |     await expect(page).toHaveURL(/.*dashboard\/find-buyer/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  87 |   });
  88 | });
  89 | 
```