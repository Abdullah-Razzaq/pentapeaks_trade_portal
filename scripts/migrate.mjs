import { Pool } from 'pg';

const oldConn = 'postgresql://neondb_owner:npg_9mudfpv1ayli@ep-solitary-frog-aypcxct9.c-5.us-east-2.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require';
const newConn = 'postgresql://neondb_owner:npg_dFrDo29ZciEf@ep-fancy-frost-ax4474ej.c-4.us-east-2.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require';

const oldPool = new Pool({ connectionString: oldConn, ssl: { rejectUnauthorized: false } });
const newPool = new Pool({ connectionString: newConn, ssl: { rejectUnauthorized: false } });

async function migrate() {
  try {
    console.log("1. Creating extension on NEW database...");
    await newPool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

    console.log("2 & 3. Creating tables, indexes, and constraints exactly as introspected...");

    // USERS
    await newPool.query(`
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
      -- NOTE: We skip adding explicit constraint for email_key since the UNIQUE index acts as one, 
      -- but just in case, let's add it explicitly:
      DO $$ BEGIN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE USING INDEX users_email_key;
      EXCEPTION WHEN OTHERS THEN NULL; END $$;
    `);

    // EXPORT SHIPMENTS
    await newPool.query(`
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
    await newPool.query(`
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

    console.log("4. Batch-copying all rows...");

    const tables = ['users', 'export_shipments', 'hs_code_directory'];
    
    for (const table of tables) {
      console.log(`Copying rows for ${table}...`);
      
      // Fetch all rows from OLD
      // NOTE: For very large tables this would need chunking, but for this schema it's manageable.
      const { rows } = await oldPool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
      console.log(`- Found ${rows.length} rows in ${table}`);

      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        const colNames = cols.map(c => `"${c}"`).join(', ');

        const BATCH_SIZE = 500;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          const values = [];
          const params = [];
          let paramIdx = 1;

          for (const row of batch) {
            const rowParams = [];
            for (const col of cols) {
              rowParams.push(`$${paramIdx++}`);
              params.push(row[col]);
            }
            values.push(`(${rowParams.join(', ')})`);
          }

          const insertQuery = `INSERT INTO ${table} (${colNames}) VALUES ${values.join(', ')}`;
          await newPool.query(insertQuery, params);
        }
      }
      console.log(`- Copied ${rows.length} rows for ${table}.`);
      
      // 5. Run setval()
      console.log(`5. Updating sequences for ${table}...`);
      await newPool.query(`
        SELECT setval(
          pg_get_serial_sequence('${table}', 'id'),
          COALESCE((SELECT MAX(id) FROM ${table}), 1)
        );
      `);
      console.log(`- Sequence updated for ${table}.`);
    }

    console.log("\n6. Row Count Comparison");
    console.log("-----------------------------------------");
    console.log("Table".padEnd(20) + " | " + "Old DB".padEnd(10) + " | " + "New DB".padEnd(10));
    console.log("-----------------------------------------");
    
    for (const table of tables) {
      const oldCnt = await oldPool.query(`SELECT COUNT(*) FROM ${table}`);
      const newCnt = await newPool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(table.padEnd(20) + " | " + oldCnt.rows[0].count.padEnd(10) + " | " + newCnt.rows[0].count.padEnd(10));
    }
    console.log("-----------------------------------------");

  } catch (err) {
    console.error("Migration Failed:", err);
  } finally {
    await oldPool.end();
    await newPool.end();
  }
}

migrate();
