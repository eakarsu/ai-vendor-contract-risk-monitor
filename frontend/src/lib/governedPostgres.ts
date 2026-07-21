import fs from 'node:fs';
import { Pool, type QueryResultRow } from 'pg';

let pool: Pool | undefined;
function currentPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLROOTCERT
        ? { rejectUnauthorized: true, ca: fs.readFileSync(process.env.PGSSLROOTCERT, 'utf8') }
        : undefined,
    });
  }
  return pool;
}
export function governedQuery<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return currentPool().query<T>(text, values);
}
export async function governedTransaction<T>(work: (query: typeof governedQuery) => Promise<T>) {
  const client = await currentPool().connect();
  try {
    await client.query('BEGIN');
    const query = ((text: string, values: unknown[] = []) => client.query(text, values)) as typeof governedQuery;
    const result = await work(query);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
