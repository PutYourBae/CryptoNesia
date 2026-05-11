import { useState } from 'react'
import { copyToClipboard, formatFileSize } from '../lib/download'

/**
 * ProcessingOverlay — Full-screen overlay shown during encryption/decryption.
 * 
 * Handles 3 states: processing, success (file or text), and error.
 * Design follows the existing HUD dark theme.
 * 
 * @param {object} props
 * @param {'idle'|'processing'|'success'|'error'} props.status
 * @param {number} props.progress - 0-100
 * @param {string} props.statusText
 * @param {string|null} props.error
 * @param {object|null} props.result - { blob, filename, size, base64, plaintext, mode }
 * @param {function} props.onDownload - Trigger file download
 * @param {function} props.onReset - Reset to idle state
 * @param {'encrypt'|'decrypt'} props.operation - Current operation type
 */
export default function ProcessingOverlay({
  status,
  progress,
  statusText,
  error,
  result,
  onDownload,
  onReset,
  operation = 'encrypt',
}) {
  const [copied, setCopied] = useState(false)

  if (status === 'idle') return null

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReset = () => {
    setCopied(false)
    onReset()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-container border border-outline-variant/50 rounded-lg shadow-2xl overflow-hidden">
        {/* Top accent line */}
        <div className={`h-1 w-full ${
          status === 'error' ? 'bg-error' : 
          status === 'success' ? 'bg-secondary' : 'bg-primary'
        }`} />

        <div className="p-8 flex flex-col items-center text-center">
          {/* Icon */}
          {status === 'processing' && (
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <span
                className="material-symbols-outlined text-primary relative z-10 animate-pulse"
                style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}
              >
                {operation === 'encrypt' ? 'enhanced_encryption' : 'lock_open'}
              </span>
            </div>
          )}

          {status === 'success' && (
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full" />
              <span
                className="material-symbols-outlined text-secondary relative z-10"
                style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
          )}

          {status === 'error' && (
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-error/20 blur-2xl rounded-full" />
              <span
                className="material-symbols-outlined text-error relative z-10"
                style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}
              >
                error
              </span>
            </div>
          )}

          {/* Progress Bar (processing & success) */}
          {(status === 'processing' || status === 'success') && (
            <div className="w-full mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-code-sm font-code-sm text-on-surface-variant">
                  {statusText}
                </span>
                <span className="text-code-sm font-code-sm text-primary font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    status === 'success' ? 'bg-secondary' : 'bg-primary'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Processing state — protocol badge */}
          {status === 'processing' && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-primary pulse-glow" />
              <span className="text-code-sm font-code-sm text-primary uppercase tracking-widest">
                AES-256-CBC ACTIVE
              </span>
            </div>
          )}

          {/* Success state — File mode */}
          {status === 'success' && result?.mode === 'file' && (
            <div className="w-full mt-4">
              {/* File info */}
              <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-high rounded border border-outline-variant/50 mb-6">
                <span className="material-symbols-outlined text-secondary">description</span>
                <div className="flex-grow text-left">
                  <p className="text-body-md font-body-md text-on-surface truncate">
                    {result.filename}
                  </p>
                  <p className="text-code-sm font-code-sm text-outline">
                    {formatFileSize(result.size)}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onDownload}
                  className="flex-1 bg-primary text-on-primary text-body-md font-body-md font-semibold px-6 py-3 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(164,230,255,0.2)] hover:bg-primary-fixed-dim transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  UNDUH FILE
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-3 bg-surface-container-high border border-outline-variant rounded text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                  BARU
                </button>
              </div>
            </div>
          )}

          {/* Success state — Text mode (Encrypt: show Base64) */}
          {status === 'success' && result?.mode === 'text' && result?.base64 && (
            <div className="w-full mt-4">
              <textarea
                readOnly
                value={result.base64}
                className="w-full h-32 bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-4 text-code-sm font-code-sm text-on-surface resize-none focus:outline-none select-all"
                onClick={(e) => e.target.select()}
              />
              <p className="text-code-sm font-code-sm text-outline mt-1 mb-4">
                {result.base64.length} karakter
              </p>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleCopy(result.base64)}
                  className={`flex-1 text-body-md font-body-md font-semibold px-6 py-3 rounded transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 ${
                    copied
                      ? 'bg-secondary text-on-secondary shadow-[0_4px_12px_rgba(78,222,163,0.3)]'
                      : 'bg-primary text-on-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(164,230,255,0.2)] hover:bg-primary-fixed-dim'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'TERSALIN!' : 'SALIN KE CLIPBOARD'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-3 bg-surface-container-high border border-outline-variant rounded text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                  BARU
                </button>
              </div>
            </div>
          )}

          {/* Success state — Text mode (Decrypt: show plaintext) */}
          {status === 'success' && result?.mode === 'text' && result?.plaintext !== undefined && (
            <div className="w-full mt-4">
              <textarea
                readOnly
                value={result.plaintext}
                className="w-full h-32 bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-4 text-body-md font-body-md text-on-surface resize-none focus:outline-none"
                onClick={(e) => e.target.select()}
              />
              <p className="text-code-sm font-code-sm text-outline mt-1 mb-4">
                {result.plaintext.length} karakter
              </p>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleCopy(result.plaintext)}
                  className={`flex-1 text-body-md font-body-md font-semibold px-6 py-3 rounded transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 ${
                    copied
                      ? 'bg-secondary text-on-secondary shadow-[0_4px_12px_rgba(78,222,163,0.3)]'
                      : 'bg-primary text-on-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(164,230,255,0.2)] hover:bg-primary-fixed-dim'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'TERSALIN!' : 'SALIN TEKS'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-3 bg-surface-container-high border border-outline-variant rounded text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                  BARU
                </button>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="w-full mt-2">
              <p className="text-body-md font-body-md text-error mb-6">
                {error}
              </p>
              <button
                onClick={handleReset}
                className="w-full bg-surface-container-high border border-outline-variant text-on-surface-variant text-body-md font-body-md font-semibold px-6 py-3 rounded hover:text-primary hover:border-primary/50 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                COBA LAGI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
