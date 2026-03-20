/**
 * Seed dummy AdminUsers into PeterAllesweterdb.
 * Run once: node scripts/seed-users.mjs
 * Requires .env to be set up with DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD.
 */

import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed)
try {
  const envPath = resolve(__dirname, '../.env');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.log('.env not found — relying on system environment variables');
}

const dbServer = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const [serverHost, instanceName] = dbServer.split('\\');

const config = {
  server: serverHost,
  database: process.env.DB_DATABASE || 'PeterAllesweterdb',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: instanceName || 'SQLEXPRESS',
  },
};

const dummyUsers = [
  { name: 'Peter Allesweter', email: 'admin@peterallesweter.be', password: 'Admin2026!', role: 'admin' },
  { name: 'Demo Gebruiker',   email: 'demo@peterallesweter.be',  password: 'Demo2026!',  role: 'user'  },
  { name: 'Jan Janssen',      email: 'jan@peterallesweter.be',   password: 'User2026!',  role: 'user'  },
  { name: 'Marie Dupont',     email: 'marie@peterallesweter.be', password: 'User2026!',  role: 'user'  },
];

async function seed() {
  const pool = await new sql.ConnectionPool(config).connect();
  console.log('Connected to database.');

  // Create table if not exists
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AdminUsers' AND xtype='U')
    BEGIN
      CREATE TABLE AdminUsers (
        id                 INT           IDENTITY(1,1) PRIMARY KEY,
        name               NVARCHAR(100) NOT NULL,
        email              NVARCHAR(150) NOT NULL,
        passwordHash       NVARCHAR(255) NOT NULL,
        role               NVARCHAR(20)  NOT NULL DEFAULT 'user',
        isActive           BIT           NOT NULL DEFAULT 1,
        forcePasswordReset BIT           NOT NULL DEFAULT 0,
        lastLogin          DATETIME      NULL,
        createdAt          DATETIME      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_AdminUsers_email UNIQUE (email)
      );
      PRINT 'AdminUsers table created.';
    END
  `);

  for (const u of dummyUsers) {
    const hash = await bcrypt.hash(u.password, 10);
    try {
      await pool.request()
        .input('name',         sql.NVarChar, u.name)
        .input('email',        sql.NVarChar, u.email)
        .input('passwordHash', sql.NVarChar, hash)
        .input('role',         sql.NVarChar, u.role)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM AdminUsers WHERE email = @email)
            INSERT INTO AdminUsers (name, email, passwordHash, role)
            VALUES (@name, @email, @passwordHash, @role)
        `);
      console.log(`  ✓ ${u.name} (${u.email}) — ${u.role}`);
    } catch (err) {
      console.error(`  ✗ ${u.email}: ${err.message}`);
    }
  }

  await pool.close();
  console.log('Seed complete.');
}

seed().catch(err => { console.error(err); process.exit(1); });
