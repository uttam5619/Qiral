/**
 * AES-256-GCM Encryption Utility
 * ─────────────────────────────────────────────────────────────────
 * Used to encrypt sensitive data at rest (e.g. tenant DB passwords).
 *
 * Format stored in DB: <iv_hex>:<authTag_hex>:<ciphertext_hex>
 *
 * Requires env var: ENCRYPTION_KEY (64 hex chars = 32 bytes)
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;    // bytes
const TAG_LENGTH = 16;   // bytes

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns: "<iv>:<authTag>:<ciphertext>" (all hex-encoded)
 */
export function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt an encrypted string produced by encrypt().
 * Returns the original plaintext. Falls back to the input
 * if it doesn't look like an encrypted value (safe migration path).
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;

  // If not in our format, treat as plaintext (backwards compatibility)
  const parts = ciphertext.split(':');
  if (parts.length !== 3) return ciphertext;

  try {
    const key = getKey();
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // Decryption failed — return as-is (handles unencrypted legacy data)
    return ciphertext;
  }
}

/**
 * Check if a string looks like an encrypted value.
 */
export function isEncrypted(value) {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}
