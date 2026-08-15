import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  // Enforce SSL certificate verification to prevent man-in-the-middle attacks.
  // In production, rejectUnauthorized MUST be true.
  // For local development only, it can be explicitly disabled via DB_REJECT_UNAUTHORIZED=false.
  const isDev = process.env.NODE_ENV !== "production";
  const rejectUnauthorized = isDev && process.env.DB_REJECT_UNAUTHORIZED === "false" ? false : true;
  
  const sslConfig: Record<string, boolean | string> = { rejectUnauthorized };
  if (process.env.DB_CA_CERT) {
    // If the managed Postgres provider supplies a CA certificate, load it here.
    sslConfig.ca = process.env.DB_CA_CERT.replace(/\\n/g, '\n');
  }

  return new Pool({
    connectionString,
    ssl: sslConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

// Reuse a single pool across hot reloads in development.
export const pool = global.__pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}
