import crypto from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';

const scrypt = promisify(crypto.scrypt);
const email = String(process.env.ADMIN_EMAIL || process.env.DEMO_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || process.env.DEMO_PASSWORD || '');
if (!email.includes('@') || password.length < 12) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) are required');
const salt = crypto.randomBytes(16).toString('hex');
const derived = await scrypt(password, salt, 64);
const passwordHash = `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const result = await pool.query(`INSERT INTO vendor_app_identities
    (tenant_id, email, password_hash, first_name, last_name, role, active)
    VALUES($1, $2, $3, 'Runtime', 'Administrator', 'admin', TRUE)
    ON CONFLICT(email) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,
      password_hash=EXCLUDED.password_hash, first_name=EXCLUDED.first_name,
      last_name=EXCLUDED.last_name, role='admin', active=TRUE, updated_at=NOW()
    RETURNING id`, [process.env.GOVERNANCE_TENANT_ID || 'runtime', email, passwordHash]);
  console.log(`Provisioned administrator ${email} (${result.rows[0].id}).`);
} finally {
  await pool.end();
}
