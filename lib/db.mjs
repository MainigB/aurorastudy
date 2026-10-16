import { Pool } from 'pg';
let pool;
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const url=new URL(process.env.DATABASE_URL);
  if(url.searchParams.has('sslmode'))url.searchParams.set('sslmode','verify-full');
  return pool ||= new Pool({ connectionString: url.toString(), max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
}
