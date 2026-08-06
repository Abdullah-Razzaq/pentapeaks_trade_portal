import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function migrate() {
  try {
    console.log("1. Creating extension on database...");
    await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

    console.log("2 & 3. Creating tables, indexes, and constraints...");

    // USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name text NOT NULL,
        email text NOT NULL,
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'user'::text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        last_activated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        current_session_token text,
        download_count integer DEFAULT 0,
        downloads_today integer DEFAULT 0,
        last_download_date date,
        subscription_expires_at timestamp without time zone,
        subscription_status text DEFAULT 'ACTIVE'::text,
        subscription_start_date timestamp with time zone
      );
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON public.users USING btree (email);
      DO $$ BEGIN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE USING INDEX users_email_key;
      EXCEPTION WHEN OTHERS THEN NULL; END $$;
    `);

    // EXPORT SHIPMENTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS export_shipments (
        id BIGSERIAL PRIMARY KEY,
        period text NOT NULL,
        source_file text NOT NULL,
        ex_code integer,
        mltcd text,
        sb bigint,
        date timestamp without time zone,
        pct double precision,
        origin text,
        ntn text,
        exporter text,
        importer text,
        qty double precision,
        unit text,
        unit_prc double precision,
        curr integer,
        value_fc double precision,
        value_pkr double precision,
        description text
      );
      CREATE INDEX IF NOT EXISTS idx_export_shipments_period ON public.export_shipments USING btree (period);
      CREATE INDEX IF NOT EXISTS idx_export_shipments_date ON public.export_shipments USING btree (date);
      CREATE INDEX IF NOT EXISTS idx_export_shipments_pct ON public.export_shipments USING btree (pct);
      CREATE INDEX IF NOT EXISTS idx_export_shipments_exporter ON public.export_shipments USING btree (exporter);
      CREATE INDEX IF NOT EXISTS idx_export_shipments_origin ON public.export_shipments USING btree (origin);
    `);

    // HS CODE DIRECTORY
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hs_code_directory (
        id SERIAL PRIMARY KEY,
        section text NOT NULL,
        hs_code text NOT NULL,
        description text NOT NULL,
        parent text,
        level integer
      );
      CREATE INDEX IF NOT EXISTS idx_hs_code_directory_hscode ON public.hs_code_directory USING btree (hs_code);
      CREATE INDEX IF NOT EXISTS idx_hs_code_directory_desc_trgm ON public.hs_code_directory USING gin (description gin_trgm_ops);
    `);

    console.log("Migration (Schema Initialization) Completed Successfully.");
  } catch (err) {
    console.error("Migration Failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
