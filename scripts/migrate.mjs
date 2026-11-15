import { Pool } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL_required');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:2000});
const client=await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(73191)');
  await client.query('CREATE TABLE IF NOT EXISTS app_migrations(version text PRIMARY KEY, checksum text NOT NULL)');
  const root=new URL('../migrations/',import.meta.url);
  for(const name of (await readdir(root)).filter(n=>/^\d+_[a-z_]+\.sql$/.test(n)).sort()) {
    const sql=await readFile(new URL(name,root),'utf8'); const checksum=createHash('sha256').update(sql).digest('hex');
    const old=await client.query('SELECT checksum FROM app_migrations WHERE version=$1',[name]);
    if(old.rowCount) { if(old.rows[0].checksum!==checksum) throw new Error('migration_checksum_changed'); continue; }
    await client.query(sql); await client.query('INSERT INTO app_migrations(version,checksum) VALUES($1,$2)',[name,checksum]);
  }
  await client.query('COMMIT');
} catch(e) { await client.query('ROLLBACK'); throw new Error('native_migration_failed'); }
finally { client.release(); await pool.end(); }
