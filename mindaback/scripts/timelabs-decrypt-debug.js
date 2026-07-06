/* eslint-disable no-undef */
// Debug helper for TimeLabs SSO token decryption.
//
// Usage:
//   node scripts/timelabs-decrypt-debug.js "<paste the auth_token / JWE here>"
//
// It reads TIMELABS_ENCRYPTION_KEY from your .env and tells you:
//   - the JWE header (which alg/enc TimeLabs actually used)
//   - whether your key decrypts the token, trying utf8 / base64 / hex encodings
//
// It does NOT touch the database or log anyone in. Pure diagnosis.

import dotenv from "dotenv";
import { compactDecrypt, decodeProtectedHeader } from "jose";

dotenv.config();

const line = () => console.log("-".repeat(70));
const safe = (fn) => {
  try {
    return fn();
  } catch {
    return null;
  }
};

const token = (process.argv[2] || process.env.SAMPLE_TOKEN || "").trim();
const rawKey = (process.env.TIMELABS_ENCRYPTION_KEY || "").trim();

if (!token) {
  console.error(
    'No token given. Run:\n  node scripts/timelabs-decrypt-debug.js "<auth_token>"'
  );
  process.exit(1);
}
if (!rawKey) {
  console.error("TIMELABS_ENCRYPTION_KEY is empty in .env");
  process.exit(1);
}

line();
console.log("Token segments:", token.split(".").length, "(JWE compact = 5, JWS = 3)");

try {
  const header = decodeProtectedHeader(token);
  console.log("Header:", JSON.stringify(header));
  console.log(" -> alg (key management):", header.alg);
  console.log(" -> enc (content cipher) :", header.enc);
} catch (e) {
  console.log("Could not read a JWE/JWS header — is this really the auth_token?");
  console.log("Error:", e.message);
}

line();
console.log("Configured key:", JSON.stringify(rawKey), "(", rawKey.length, "chars )");

const candidates = [
  ["utf8 (as TimeLabs docs show)", Buffer.from(rawKey, "utf8")],
  ["base64", safe(() => Buffer.from(rawKey, "base64"))],
  ["base64url", safe(() => Buffer.from(rawKey, "base64url"))],
  ["hex", safe(() => Buffer.from(rawKey, "hex"))],
];

let success = false;
for (const [label, keyBytes] of candidates) {
  if (!keyBytes || keyBytes.length === 0) {
    console.log(`\n[${label}] skipped (not decodable)`);
    continue;
  }
  try {
    const { plaintext } = await compactDecrypt(token, new Uint8Array(keyBytes));
    const text = new TextDecoder().decode(plaintext);
    line();
    console.log(`SUCCESS — key interpreted as ${label} (${keyBytes.length} bytes)`);
    console.log("Decrypted payload:");
    console.log(text);
    success = true;
    break;
  } catch (e) {
    console.log(`\n[${label}] (${keyBytes.length} bytes) -> FAILED: ${e.message}`);
  }
}

line();
if (!success) {
  console.log("None of the key encodings could decrypt this token.");
  console.log("=> The TIMELABS_ENCRYPTION_KEY value is almost certainly wrong.");
  console.log("=> Ask TimeLabs for the exact encryption key for this application.");
}
