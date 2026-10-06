// Dev helper: mint a session cookie for a user email (never ship to production images).
import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";

const email = process.argv[2];
const secret = process.env.AUTH_SECRET ?? "dev-only-secret-change-me-please-0123456789";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const u = await client.query('select id from "User" where email=$1', [email]);
if (!u.rowCount) throw new Error("no such user " + email);
const token = randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(token + secret).digest("hex");
await client.query('insert into "Session"(id,"tokenHash","userId","expiresAt") values ($1,$2,$3,now()+interval \'1 day\')', ["s_" + randomBytes(6).toString("hex"), hash, u.rows[0].id]);
await client.end();
console.log(token);
