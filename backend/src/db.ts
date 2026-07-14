import { Pool } from "pg";

const sslEnabled = process.env.DB_SSL !== "false";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
});
