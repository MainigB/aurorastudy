import { getMigrations } from 'better-auth/db/migration';
import { getAuth } from '../lib/auth.mjs';
import { getPool } from '../lib/db.mjs';
try {
 const migration=await getMigrations(getAuth().options);
 await migration.runMigrations();
 await getPool().query(`CREATE TABLE IF NOT EXISTS aurora_progress (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
 )`);
 console.log('Esquema de autenticação e progresso aplicado.');
}finally{await getPool().end();}
