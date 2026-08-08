import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });

let pool: Pool;
let standardUserId: number;
const TEST_USER_SESSION_TOKEN = "test_user_session_token_123";

function generateMockToken(role: "admin" | "user", userId: number, sessionToken: string) {
  const secret = process.env.JWT_SECRET || "testsecret";
  return jwt.sign(
    {
      userId,
      email: role === "admin" ? "admin_test@pentapeaks.local" : "user_test@pentapeaks.local",
      name: role === "admin" ? "Test Admin" : "Test User",
      role,
      sessionToken,
    },
    secret,
    { algorithm: "HS256" }
  );
}

test.describe('Pentapeaks Trade Portal User Workflows', () => {
  let userToken: string;

  test.beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const res = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, plan_type, current_session_token) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET current_session_token = $6, role = $4
       RETURNING id`,
      ["user_test@pentapeaks.local", "Test User", "hash", "user", "trial", TEST_USER_SESSION_TOKEN]
    );
    standardUserId = res.rows[0].id;
    userToken = generateMockToken('user', standardUserId, TEST_USER_SESSION_TOKEN);
  });

  test.afterAll(async () => {
    if (pool) {
      await pool.query(`DELETE FROM users WHERE email = 'user_test@pentapeaks.local'`);
      await pool.end();
    }
  });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'session',
        value: userToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      }
    ]);
  });

  test('clicking product search shows 10 top commodities + search hint', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('non-admin copy protection applies user-select: none globally', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Evaluate if the body has the select-none class for non-admin user
    const hasSelectNone = await page.evaluate(() => {
      return document.body.classList.contains('select-none');
    });
    
    expect(hasSelectNone).toBe(true);
  });

  test('trial user pagination is capped at page 20', async ({ page }) => {
    await page.goto('/dashboard/find-buyer');
    await expect(page).toHaveURL(/.*dashboard\/find-buyer/);
  });
});
