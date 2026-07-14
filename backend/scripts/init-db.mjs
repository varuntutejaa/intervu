// One-time (and re-runnable) setup: creates the target database if it
// doesn't exist yet, then applies schema.sql against it. Exists because RDS
// only creates the database you name in "Initial database name" at
// creation time — easy to miss — and not everyone has psql installed
// locally.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sslEnabled = process.env.DB_SSL !== "false";
const baseConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
};

const targetDb = process.env.PGDATABASE;
if (!targetDb) {
  console.error("PGDATABASE is not set in .env");
  process.exit(1);
}

const adminClient = new Client({ ...baseConfig, database: "postgres" });
await adminClient.connect();

const { rows } = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [
  targetDb,
]);

if (rows.length === 0) {
  console.log(`Creating database "${targetDb}"...`);
  // Database names can't be parameterized — safe here since it's our own
  // config value, not user input.
  await adminClient.query(`CREATE DATABASE "${targetDb}"`);
} else {
  console.log(`Database "${targetDb}" already exists.`);
}

await adminClient.end();

const dbClient = new Client({ ...baseConfig, database: targetDb });
await dbClient.connect();

const schemaSql = readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
console.log("Applying schema.sql...");
await dbClient.query(schemaSql);
console.log("Done.");

await dbClient.end();
