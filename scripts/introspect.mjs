import { Pool } from 'pg';
import fs from 'fs';

const connectionString = 'postgresql://neondb_owner:npg_9mudfpv1ayli@ep-solitary-frog-aypcxct9.c-5.us-east-2.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function introspect() {
  let output = "# Old Database Schema Introspection\n\n";

  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    output += `## Tables Found: \n${tables.map(t => `- ${t}`).join('\n')}\n\n`;

    for (const table of tables) {
      output += `### Table: ${table}\n\n`;
      
      output += `#### Columns\n`;
      const colsRes = await pool.query(`
        SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      
      output += `| Column | Type | Max Length | Default | Nullable |\n`;
      output += `|---|---|---|---|---|\n`;
      colsRes.rows.forEach(r => {
        output += `| ${r.column_name} | ${r.data_type} | ${r.character_maximum_length || 'NULL'} | ${r.column_default || 'NULL'} | ${r.is_nullable} |\n`;
      });
      output += `\n`;

      output += `#### Constraints\n`;
      const constraintsRes = await pool.query(`
        SELECT tc.constraint_name, tc.constraint_type, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public' AND tc.table_name = $1;
      `, [table]);
      
      output += `| Constraint Name | Type | Column | Foreign Table | Foreign Column |\n`;
      output += `|---|---|---|---|---|\n`;
      constraintsRes.rows.forEach(r => {
        output += `| ${r.constraint_name} | ${r.constraint_type} | ${r.column_name} | ${r.foreign_table_name || 'NULL'} | ${r.foreign_column_name || 'NULL'} |\n`;
      });
      output += `\n`;

      output += `#### Indexes\n`;
      const indexesRes = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1;
      `, [table]);
      
      output += `| Index Name | Definition |\n`;
      output += `|---|---|\n`;
      indexesRes.rows.forEach(r => {
        output += `| ${r.indexname} | ${r.indexdef} |\n`;
      });
      output += `\n`;
    }

    fs.writeFileSync('schema_introspection.md', output);
    console.log("Schema successfully written to schema_introspection.md");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

introspect();
