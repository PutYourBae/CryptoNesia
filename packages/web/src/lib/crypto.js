/**
 * CryptoNesia — Core Crypto Engine
 * 
 * AES-256-CBC encryption/decryption with PBKDF2 key derivation and HMAC-SHA256 integrity.
 * Uses the native Web Crypto API (window.crypto.subtle) — zero external dependencies.
 * 
 * Binary layout of encrypted payload:
 *   salt(16) + iv(16) + hmac(32) + ciphertext(N)
 */

const SALT_LENGTH = 16
const IV_LENGTH = 16
const HMAC_LENGTH = 32
const PBKDF2_ITERATIONS = 600_000
const KEY_LENGTH_BITS = 256

/**
 * Derives an AES-256 encryption key and an HMAC key from a password + salt
 * using PBKDF2 with 600,000 iterations of SHA-256.
 * 
 * We derive 512 bits total:
 *   - First 256 bits → AES key
 *   - Last 256 bits  → HMAC key
 * 
 * @param {string} password - User-supplied password
 * @param {Uint8Array} salt - 16-byte random salt
 * @returns {Promise<{ aesKey: CryptoKey, hmacKey: CryptoKey }>}
 */
async function deriveKeys(password, salt) {
  const encoder = new TextEncoder()
  const passwordBytes = encoder.encode(password)

  // Import password as raw key material for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // Derive 512 bits (64 bytes) → split into AES key + HMAC key
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    512 // 256 for AES + 256 for HMAC
  )

  const derivedBytes = new Uint8Array(derivedBits)
  const aesKeyBytes = derivedBytes.slice(0, 32)
  const hmacKeyBytes = derivedBytes.slice(32, 64)

  // Import as AES-CBC key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    aesKeyBytes,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  )

  // Import as HMAC key
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    hmacKeyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )

  return { aesKey, hmacKey }
}

/**
 * Computes HMAC-SHA256 over the given data.
 * 
 * @param {CryptoKey} hmacKey - HMAC key from deriveKeys()
 * @param {Uint8Array} data - Data to authenticate
 * @returns {Promise<Uint8Array>} - 32-byte HMAC
 */
async function computeHMAC(hmacKey, data) {
  const signature = await crypto.subtle.sign('HMAC', hmacKey, data)
  return new Uint8Array(signature)
}

/**
 * Verifies HMAC-SHA256. Throws if verification fails (wrong password or corrupt data).
 * 
 * @param {CryptoKey} hmacKey - HMAC key from deriveKeys()
 * @param {Uint8Array} data - Data that was authenticated
 * @param {Uint8Array} mac - The HMAC to verify against
 * @returns {Promise<boolean>}
 */
async function verifyHMAC(hmacKey, data, mac) {
  return crypto.subtle.verify('HMAC', hmacKey, mac, data)
}

/**
 * Encrypts plaintext bytes using AES-256-CBC with PBKDF2 key derivation and HMAC integrity.
 * 
 * @param {Uint8Array} plainBytes - The data to encrypt
 * @param {string} password - User-supplied password
 * @param {function} [onProgress] - Optional progress callback (0-100)
 * @returns {Promise<Uint8Array>} - Encrypted payload: salt(16) + iv(16) + hmac(32) + ciphertext(N)
 */
export async function encryptData(plainBytes, password, onProgress) {
  onProgress?.(10)

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  onProgress?.(30)

  // Derive AES + HMAC keys from password
  const { aesKey, hmacKey } = await deriveKeys(password, salt)

  onProgress?.(50)

  // Encrypt with AES-256-CBC
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    plainBytes
  )
  const cipherBytes = new Uint8Array(cipherBuffer)

  onProgress?.(70)

  // Compute HMAC over salt + iv + ciphertext (Encrypt-then-MAC)
  const dataToAuth = new Uint8Array(SALT_LENGTH + IV_LENGTH + cipherBytes.length)
  dataToAuth.set(salt, 0)
  dataToAuth.set(iv, SALT_LENGTH)
  dataToAuth.set(cipherBytes, SALT_LENGTH + IV_LENGTH)

  const hmac = await computeHMAC(hmacKey, dataToAuth)

  onProgress?.(90)

  // Assemble final payload: salt + iv + hmac + ciphertext
  const payload = new Uint8Array(SALT_LENGTH + IV_LENGTH + HMAC_LENGTH + cipherBytes.length)
  payload.set(salt, 0)
  payload.set(iv, SALT_LENGTH)
  payload.set(hmac, SALT_LENGTH + IV_LENGTH)
  payload.set(cipherBytes, SALT_LENGTH + IV_LENGTH + HMAC_LENGTH)

  onProgress?.(100)

  return payload
}

/**
 * Decrypts an encrypted payload using AES-256-CBC with HMAC verification.
 * 
 * @param {Uint8Array} payload - Encrypted payload: salt(16) + iv(16) + hmac(32) + ciphertext(N)
 * @param {string} password - User-supplied password
 * @param {function} [onProgress] - Optional progress callback (0-100)
 * @returns {Promise<Uint8Array>} - Decrypted plaintext bytes
 * @throws {Error} - If HMAC verification fails (wrong password or corrupt data)
 */
export async function decryptData(payload, password, onProgress) {
  onProgress?.(10)

  // Extract components from payload
  const salt = payload.slice(0, SALT_LENGTH)
  const iv = payload.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const hmac = payload.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + HMAC_LENGTH)
  const cipherBytes = payload.slice(SALT_LENGTH + IV_LENGTH + HMAC_LENGTH)

  if (cipherBytes.length === 0) {
    throw new Error('Data terenkripsi kosong atau rusak.')
  }

  onProgress?.(30)

  // Derive keys from password + salt
  const { aesKey, hmacKey } = await deriveKeys(password, salt)

  onProgress?.(50)

  // Verify HMAC before decrypting (Encrypt-then-MAC → verify before decrypt)
  const dataToAuth = new Uint8Array(SALT_LENGTH + IV_LENGTH + cipherBytes.length)
  dataToAuth.set(salt, 0)
  dataToAuth.set(iv, SALT_LENGTH)
  dataToAuth.set(cipherBytes, SALT_LENGTH + IV_LENGTH)

  const isValid = await verifyHMAC(hmacKey, dataToAuth, hmac)
  if (!isValid) {
    throw new Error('Password salah atau data telah dimodifikasi.')
  }

  onProgress?.(70)

  // Decrypt with AES-256-CBC
  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      aesKey,
      cipherBytes
    )

    onProgress?.(100)
    return new Uint8Array(plainBuffer)
  } catch {
    throw new Error('Gagal mendekripsi. Password salah atau file rusak.')
  }
}
