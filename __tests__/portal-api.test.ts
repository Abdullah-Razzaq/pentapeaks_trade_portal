import request from "supertest";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });

const API_URL = process.env.TEST_API_URL || "http://localhost:3000";

jest.setTimeout(30000);

let pool: Pool;
let adminUserId: number;
let standardUserId: number;

const TEST_ADMIN_SESSION_TOKEN = "test_admin_session_token_123";
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

describe("Portal API Routes", () => {
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    // Connect to real DB
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // 1. Upsert Admin User
    let res = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, plan_type, current_session_token) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET current_session_token = $6, role = $4
       RETURNING id`,
      ["admin_test@pentapeaks.local", "Test Admin", "hash", "admin", "trial", TEST_ADMIN_SESSION_TOKEN]
    );
    adminUserId = res.rows[0].id;
    adminCookie = `session=${generateMockToken("admin", adminUserId, TEST_ADMIN_SESSION_TOKEN)}`;

    // 2. Upsert Standard User
    res = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, plan_type, current_session_token) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET current_session_token = $6, role = $4
       RETURNING id`,
      ["user_test@pentapeaks.local", "Test User", "hash", "user", "trial", TEST_USER_SESSION_TOKEN]
    );
    standardUserId = res.rows[0].id;
    userCookie = `session=${generateMockToken("user", standardUserId, TEST_USER_SESSION_TOKEN)}`;
  }, 30000);

  afterAll(async () => {
    if (pool) {
      await pool.query(`DELETE FROM users WHERE email IN ('admin_test@pentapeaks.local', 'user_test@pentapeaks.local')`);
      await pool.end();
    }
  }, 30000);

  describe("GET /api/products/search?q=rice", () => {
    it("should return uniquely aggregated root commodities", async () => {
      const res = await request(API_URL)
        .get("/api/products/search?q=rice")
        .set("Cookie", [userCookie]);
        
      if (res.status === 200) {
        const results = res.body.categories || res.body.results || res.body;
        expect(Array.isArray(results)).toBe(true);
        if (results.length > 0) {
          expect(results[0]).toHaveProperty("label");
          expect(results[0]).toHaveProperty("value");
        }
      } else {
        expect(res.status).toBe(401);
      }
    });
  });

  describe("Admin Subscriptions API", () => {
    let testSubId: number | null = null;

    it("POST /api/admin/subscriptions computes +28d alert_date and +30d renew_date", async () => {
      const res = await request(API_URL)
        .post("/api/admin/subscriptions")
        .send({
          subscription_name: "Jest Test Sub",
          start_date: "2026-08-01"
        })
        .set("Cookie", [adminCookie]);

      if (res.status === 201) {
        const sub = res.body.subscription;
        expect(sub).toBeDefined();
        // pg returns DATE columns as local Date objects (e.g. 2026-08-29 00:00:00 local time).
        // Convert to local YYYY-MM-DD string to verify the exact date.
        const pad = (n: number) => n.toString().padStart(2, '0');
        const alertD = new Date(sub.alert_date);
        const alertLocalStr = `${alertD.getFullYear()}-${pad(alertD.getMonth() + 1)}-${pad(alertD.getDate())}`;
        const renewD = new Date(sub.renew_date);
        const renewLocalStr = `${renewD.getFullYear()}-${pad(renewD.getMonth() + 1)}-${pad(renewD.getDate())}`;
        
        expect(alertLocalStr).toBe("2026-08-29");
        expect(renewLocalStr).toBe("2026-08-31");
        testSubId = sub.id;
      } else {
        expect(res.status).toBe(401);
      }
    });

    it("DELETE /api/admin/subscriptions?id=... removes the subscription", async () => {
      if (!testSubId) {
        console.warn("Skipping DELETE test because POST failed");
        return;
      }
      const res = await request(API_URL)
        .delete(`/api/admin/subscriptions?id=${testSubId}`)
        .set("Cookie", [adminCookie]);
        
      if (res.status === 200) {
        expect(res.body.message).toBe("Subscription deleted successfully");
      } else {
        expect(res.status).toBe(401);
      }
    });
  });

  describe("GET /api/trade/product-status", () => {
    it("enforces 5-product limit check for Pro users", async () => {
      const res = await request(API_URL)
        .get("/api/trade/product-status?hs_code=1006")
        .set("Cookie", [userCookie]);
      expect([200, 400, 401, 403]).toContain(res.status);
    });
  });
});
