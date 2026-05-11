/**
 * CryptoNesia — File Format Handler
 * 
 * Handles two output formats:
 * 
 * 1. Binary .enc file (for file mode):
 *    Magic("CNEO", 4B) + Version(1B) + MetadataLength(4B LE) + MetadataJSON + EncryptedPayload
 * 
 * 2. Base64 string (for text mode):
 *    "CNEO:v1:<base64-encoded-payload>"
 */

const MAGIC = 'CNEO'
const VERSION = 0x01
const BASE64_PREFIX = 'CNEO:v1:'

/**
 * Packs metadata + encrypted payload into the .enc binary format.
 * 
 * @param {object} metadata - File metadata { name, type, size, mode, ts }
 * @param {Uint8Array} encryptedPayload - The encrypted data from crypto.encryptData()
 * @returns {Uint8Array} - Complete .enc file as bytes
 */
export function packEncFile(metadata, encryptedPayload) {
  const encoder = new TextEncoder()

  // Encode metadata as JSON → UTF-8 bytes
  const metadataJson = JSON.stringify(metadata)
  const metadataBytes = encoder.encode(metadataJson)

  // Calculate total size
  // Magic(4) + Version(1) + MetaLength(4) + MetaBytes(N) + Payload(M)
  const totalSize = 4 + 1 + 4 + metadataBytes.length + encryptedPayload.length
  const result = new Uint8Array(totalSize)

  let offset = 0

  // Magic bytes: "CNEO"
  const magicBytes = encoder.encode(MAGIC)
  result.set(magicBytes, offset)
  offset += 4

  // Version byte
  result[offset] = VERSION
  offset += 1

  // Metadata length (4 bytes, Little-Endian)
  const metaLenView = new DataView(new ArrayBuffer(4))
  metaLenView.setUint32(0, metadataBytes.length, true) // true = little-endian
  result.set(new Uint8Array(metaLenView.buffer), offset)
  offset += 4

  // Metadata JSON bytes
  result.set(metadataBytes, offset)
  offset += metadataBytes.length

  // Encrypted payload
  result.set(encryptedPayload, offset)

  return result
}

/**
 * Unpacks a .enc file into its metadata and encrypted payload.
 * 
 * @param {Uint8Array} fileBytes - The complete .enc file as bytes
 * @returns {{ metadata: object, payload: Uint8Array }} - Parsed components
 * @throws {Error} - If the file format is invalid
 */
export function unpackEncFile(fileBytes) {
  if (fileBytes.length < 9) {
    throw new Error('File terlalu kecil — bukan format CryptoNesia yang valid.')
  }

  // Validate magic bytes
  if (!validateMagic(fileBytes)) {
    throw new Error('Format file tidak valid. Bukan file CryptoNesia (.enc).')
  }

  let offset = 4

  // Read version
  const version = fileBytes[offset]
  if (version !== VERSION) {
    throw new Error(`Versi format tidak didukung (v${version}). Gunakan CryptoNesia versi terbaru.`)
  }
  offset += 1

  // Read metadata length (4 bytes, Little-Endian)
  const metaLenView = new DataView(fileBytes.buffer, fileBytes.byteOffset + offset, 4)
  const metaLen = metaLenView.getUint32(0, true)
  offset += 4

  if (offset + metaLen > fileBytes.length) {
    throw new Error('File rusak — metadata tidak lengkap.')
  }

  // Read metadata JSON
  const decoder = new TextDecoder()
  const metadataJson = decoder.decode(fileBytes.slice(offset, offset + metaLen))
  let metadata
  try {
    metadata = JSON.parse(metadataJson)
  } catch {
    throw new Error('File rusak — metadata tidak bisa dibaca.')
  }
  offset += metaLen

  // Remaining bytes are the encrypted payload
  const payload = fileBytes.slice(offset)

  if (payload.length === 0) {
    throw new Error('File rusak — data terenkripsi kosong.')
  }

  return { metadata, payload }
}

/**
 * Validates that the file starts with the CNEO magic bytes.
 * 
 * @param {Uint8Array} fileBytes - The file bytes to check
 * @returns {boolean} - True if valid CryptoNesia format
 */
export function validateMagic(fileBytes) {
  if (fileBytes.length < 4) return false
  const decoder = new TextDecoder()
  const magic = decoder.decode(fileBytes.slice(0, 4))
  return magic === MAGIC
}

/**
 * Reads metadata from a .enc file without decrypting.
 * Useful for showing file info preview before decryption.
 * 
 * @param {Uint8Array} fileBytes - The .enc file bytes
 * @returns {object|null} - Metadata object or null if invalid
 */
export function peekMetadata(fileBytes) {
  try {
    const { metadata } = unpackEncFile(fileBytes)
    return metadata
  } catch {
    return null
  }
}

/**
 * Converts an encrypted payload to a Base64 string with CNEO prefix.
 * Used for text mode encryption output.
 * 
 * @param {Uint8Array} encryptedPayload - The encrypted payload bytes
 * @returns {string} - "CNEO:v1:<base64-string>"
 */
export function payloadToBase64(encryptedPayload) {
  // Convert Uint8Array to base64 string
  let binary = ''
  for (let i = 0; i < encryptedPayload.length; i++) {
    binary += String.fromCharCode(encryptedPayload[i])
  }
  const base64 = btoa(binary)
  return BASE64_PREFIX + base64
}

/**
 * Parses a Base64 string with CNEO prefix back to encrypted payload bytes.
 * Used for text mode decryption input.
 * 
 * @param {string} base64String - The "CNEO:v1:<base64>" string
 * @returns {Uint8Array} - The encrypted payload bytes
 * @throws {Error} - If the format is invalid
 */
export function base64ToPayload(base64String) {
  const trimmed = base64String.trim()

  if (!trimmed.startsWith(BASE64_PREFIX)) {
    throw new Error('Format teks tidak valid. Pastikan teks dimulai dengan "CNEO:v1:".')
  }

  const base64Data = trimmed.slice(BASE64_PREFIX.length)

  if (base64Data.length === 0) {
    throw new Error('Data terenkripsi kosong.')
  }

  try {
    const binary = atob(base64Data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  } catch {
    throw new Error('Format Base64 tidak valid. Teks mungkin rusak atau terpotong.')
  }
}

/**
 * Validates if a string looks like a valid CNEO Base64 encrypted text.
 * 
 * @param {string} text - The text to validate
 * @returns {boolean} - True if it starts with the CNEO prefix
 */
export function isValidBase64Format(text) {
  return text.trim().startsWith(BASE64_PREFIX)
}
