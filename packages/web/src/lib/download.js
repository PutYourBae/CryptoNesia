/**
 * CryptoNesia — Download & Clipboard Helpers
 */

/**
 * Triggers a file download in the browser.
 * Creates a temporary Object URL, clicks a hidden <a> element, then cleans up.
 * 
 * @param {Uint8Array|Blob} data - The file data to download
 * @param {string} filename - The filename for the download
 * @param {string} [mimeType='application/octet-stream'] - MIME type
 */
export function downloadBlob(data, filename, mimeType = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Generates the encrypted filename from the original.
 * Example: "photo.jpg" → "photo.jpg.enc"
 * 
 * @param {string} originalName - Original filename
 * @returns {string} - Encrypted filename
 */
export function getEncFilename(originalName) {
  return `${originalName}.enc`
}

/**
 * Recovers the original filename from an encrypted filename.
 * Example: "photo.jpg.enc" → "photo.jpg"
 * 
 * @param {string} encName - Encrypted filename
 * @returns {string} - Original filename
 */
export function getDecFilename(encName) {
  if (encName.endsWith('.enc')) {
    return encName.slice(0, -4)
  }
  return encName
}

/**
 * Copies text to the system clipboard.
 * Falls back to a textarea-based approach if the Clipboard API is unavailable.
 * 
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - True if copy succeeded
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for non-HTTPS contexts
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}

/**
 * Formats byte size to human-readable string.
 * 
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted string like "2.1 MB"
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
