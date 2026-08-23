// One-off CLI helper to generate an ADMIN_PASSWORD_HASH value for .env /
// Vercel env vars, since admin login now checks a scrypt hash rather than a
// plaintext password (see src/lib/password.ts, src/lib/admin-rbac.ts).
//
// Usage:
//   npx tsx scripts/hash-password.ts 'your-chosen-password'
//
// Copy the printed hash into ADMIN_PASSWORD_HASH. The plaintext password is
// never stored anywhere — only this hash is.
import { hashPassword } from "../src/lib/password";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts '<password>'");
  process.exit(1);
}

console.log(hashPassword(password));
