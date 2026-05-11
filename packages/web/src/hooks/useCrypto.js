/**
 * CryptoNesia — useCrypto React Hook
 * 
 * Connects the crypto engine to React state.
 * Manages progress, status, error handling, and results for both
 * file mode (binary .enc) and text mode (Base64 string).
 */

import { useState, useCallback, useRef } from 'react'
import { encryptData, decryptData } from '../lib/crypto'
import { packEncFile, unpackEncFile, payloadToBase64, base64ToPayload } from '../lib/fileFormat'
import { downloadBlob, getEncFilename, getDecFilename } from '../lib/download'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

/**
 * @typedef {'idle' | 'processing' | 'success' | 'error'} CryptoStatus
 * 
 * @typedef {object} CryptoResult
 * @property {Blob} [blob] - Result blob for file download (file mode)
 * @property {string} [filename] - Suggested filename for download
 * @property {number} [size] - Result size in bytes
 * @property {string} [base64] - Base64 encrypted string (text encrypt mode)
 * @property {string} [plaintext] - Decrypted plaintext (text decrypt mode)
 * @property {'file' | 'text'} mode - Which mode produced this result
 */

export default function useCrypto() {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  // Prevent double-execution
  const processingRef = useRef(false)

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setStatusText('')
    setError(null)
    setResult(null)
    processingRef.current = false
  }, [])

  /**
   * Encrypt a file or text.
   * 
   * @param {File|string} input - File object (file mode) or string (text mode)
   * @param {string} password - Encryption password
   * @param {'file'|'text'} mode - Encryption mode
   */
  const encrypt = useCallback(async (input, password, mode) => {
    if (processingRef.current) return
    processingRef.current = true

    setStatus('processing')
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      let plainBytes

      if (mode === 'file') {
        // — File mode —
        const file = input

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimal 100 MB.`)
        }

        setStatusText('Membaca file...')
        setProgress(5)

        const arrayBuffer = await file.arrayBuffer()
        plainBytes = new Uint8Array(arrayBuffer)

        setStatusText('Menghasilkan kunci enkripsi...')
        setProgress(15)

        // Encrypt the data
        const encryptedPayload = await encryptData(plainBytes, password, (p) => {
          // Map crypto progress (10-100) to our range (15-75)
          setProgress(15 + Math.round(p * 0.6))
        })

        setStatusText('Membungkus file...')
        setProgress(80)

        // Build metadata
        const metadata = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          mode: 'file',
          ts: Date.now(),
        }

        // Pack into .enc format
        const encFileBytes = packEncFile(metadata, encryptedPayload)
        const encFilename = getEncFilename(file.name)
        const blob = new Blob([encFileBytes], { type: 'application/octet-stream' })

        setProgress(100)
        setStatusText('Selesai! File siap diunduh.')
        setStatus('success')
        setResult({
          blob,
          filename: encFilename,
          size: encFileBytes.length,
          mode: 'file',
        })
      } else {
        // — Text mode —
        const text = input

        if (!text || text.trim().length === 0) {
          throw new Error('Teks tidak boleh kosong.')
        }

        setStatusText('Memproses teks...')
        setProgress(10)

        const encoder = new TextEncoder()
        plainBytes = encoder.encode(text)

        setStatusText('Menghasilkan kunci enkripsi...')
        setProgress(20)

        // Encrypt the text bytes
        const encryptedPayload = await encryptData(plainBytes, password, (p) => {
          setProgress(20 + Math.round(p * 0.5))
        })

        setStatusText('Mengkonversi ke Base64...')
        setProgress(80)

        // Convert to Base64 string
        const base64 = payloadToBase64(encryptedPayload)

        setProgress(100)
        setStatusText('Selesai! Teks siap disalin.')
        setStatus('success')
        setResult({
          base64,
          size: base64.length,
          mode: 'text',
        })
      }
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Terjadi kesalahan saat mengenkripsi.')
      setProgress(0)
      setStatusText('')
    } finally {
      processingRef.current = false
    }
  }, [])

  /**
   * Decrypt a file or Base64 text.
   * 
   * @param {File|string} input - File object (file mode) or Base64 string (text mode)
   * @param {string} password - Decryption password
   * @param {'file'|'text'} mode - Decryption mode
   */
  const decrypt = useCallback(async (input, password, mode) => {
    if (processingRef.current) return
    processingRef.current = true

    setStatus('processing')
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      if (mode === 'file') {
        // — File mode —
        const file = input

        setStatusText('Membaca file...')
        setProgress(5)

        const arrayBuffer = await file.arrayBuffer()
        const fileBytes = new Uint8Array(arrayBuffer)

        setStatusText('Memvalidasi format file...')
        setProgress(10)

        // Unpack .enc file
        const { metadata, payload } = unpackEncFile(fileBytes)

        setStatusText('Menghasilkan kunci dekripsi...')
        setProgress(20)

        // Decrypt the payload
        const decryptedBytes = await decryptData(payload, password, (p) => {
          setProgress(20 + Math.round(p * 0.6))
        })

        setStatusText('Menyiapkan file...')
        setProgress(90)

        // Build result
        const mimeType = metadata.type || 'application/octet-stream'
        const blob = new Blob([decryptedBytes], { type: mimeType })
        const filename = metadata.name || getDecFilename(file.name)

        setProgress(100)
        setStatusText('Selesai! File siap diunduh.')
        setStatus('success')
        setResult({
          blob,
          filename,
          size: decryptedBytes.length,
          mode: 'file',
          metadata,
        })
      } else {
        // — Text mode —
        const base64Input = input

        setStatusText('Memvalidasi format teks...')
        setProgress(10)

        // Parse Base64 back to payload bytes
        const payload = base64ToPayload(base64Input)

        setStatusText('Menghasilkan kunci dekripsi...')
        setProgress(20)

        // Decrypt the payload
        const decryptedBytes = await decryptData(payload, password, (p) => {
          setProgress(20 + Math.round(p * 0.6))
        })

        setStatusText('Mendekode teks...')
        setProgress(90)

        // Decode bytes back to string
        const decoder = new TextDecoder()
        const plaintext = decoder.decode(decryptedBytes)

        setProgress(100)
        setStatusText('Berhasil didekripsi!')
        setStatus('success')
        setResult({
          plaintext,
          size: decryptedBytes.length,
          mode: 'text',
        })
      }
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Terjadi kesalahan saat mendekripsi.')
      setProgress(0)
      setStatusText('')
    } finally {
      processingRef.current = false
    }
  }, [])

  /**
   * Downloads the result file (only works if result.mode === 'file')
   */
  const downloadResult = useCallback(() => {
    if (result?.blob && result?.filename) {
      downloadBlob(result.blob, result.filename)
    }
  }, [result])

  return {
    status,
    progress,
    statusText,
    error,
    result,
    encrypt,
    decrypt,
    reset,
    downloadResult,
  }
}
