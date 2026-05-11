import { useState, useRef } from 'react'
import useCrypto from '../hooks/useCrypto'
import ProcessingOverlay from '../components/ProcessingOverlay'
import { copyToClipboard } from '../lib/download'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

/**
 * Generates a cryptographically secure random password.
 * Uses crypto.getRandomValues() for true randomness.
 * 
 * @param {number} length - Password length (default: 16)
 * @returns {string} - Generated password
 */
function generatePassword(length = 16) {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%&*_+-='
  const allChars = uppercase + lowercase + numbers + symbols

  // Ensure at least one of each type
  const randomValues = crypto.getRandomValues(new Uint32Array(length))
  const required = [
    uppercase[randomValues[0] % uppercase.length],
    lowercase[randomValues[1] % lowercase.length],
    numbers[randomValues[2] % numbers.length],
    symbols[randomValues[3] % symbols.length],
  ]

  // Fill the rest randomly
  const rest = []
  for (let i = 4; i < length; i++) {
    rest.push(allChars[randomValues[i] % allChars.length])
  }

  // Shuffle using Fisher-Yates
  const combined = [...required, ...rest]
  const shuffleValues = crypto.getRandomValues(new Uint32Array(combined.length))
  for (let i = combined.length - 1; i > 0; i--) {
    const j = shuffleValues[i] % (i + 1)
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }

  return combined.join('')
}

export default function Encrypt() {
  const [mode, setMode] = useState('file') // 'file' or 'text'
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileSizeError, setFileSizeError] = useState(null)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [suggestedPassword, setSuggestedPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)

  const {
    status,
    progress,
    statusText,
    error,
    result,
    encrypt,
    reset,
    downloadResult,
  } = useCrypto()

  const getPasswordStrength = (pw) => {
    if (pw.length === 0) return { label: '', level: 0, color: '' }
    if (pw.length < 6) return { label: 'Lemah', level: 1, color: 'bg-error' }
    if (pw.length < 10) return { label: 'Sedang', level: 2, color: 'bg-tertiary-container' }
    return { label: 'Kuat', level: 3, color: 'bg-secondary' }
  }

  const strength = getPasswordStrength(password)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) validateAndSetFile(droppedFile)
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) validateAndSetFile(selected)
  }

  const validateAndSetFile = (f) => {
    if (f.size > MAX_FILE_SIZE) {
      setFileSizeError(`File terlalu besar (${(f.size / 1024 / 1024).toFixed(1)} MB). Maksimal 100 MB.`)
      setFile(null)
    } else {
      setFileSizeError(null)
      setFile(f)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleEncrypt = () => {
    if (mode === 'file' && file) {
      encrypt(file, password, 'file')
    } else if (mode === 'text' && text.trim().length > 0) {
      encrypt(text, password, 'text')
    }
  }

  const handleReset = () => {
    reset()
    // Don't clear the form — let user re-encrypt with different password if needed
  }

  const isFormValid = (mode === 'file' ? file !== null : text.trim().length > 0) && password.length >= 8
  const isDisabled = status === 'processing'

  return (
    <section className="w-full max-w-2xl mx-auto">
      {/* Page Title */}
      <div className="flex items-center gap-3 mb-8">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}
        >
          enhanced_encryption
        </span>
        <h1 className="text-headline-lg font-headline-lg text-on-surface">
          Enkripsi File
        </h1>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('file')}
          disabled={isDisabled}
          className={`flex items-center gap-2 px-4 py-2 rounded text-code-sm font-code-sm uppercase tracking-widest transition-all duration-200 border ${
            mode === 'file'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Upload File
        </button>
        <button
          onClick={() => setMode('text')}
          disabled={isDisabled}
          className={`flex items-center gap-2 px-4 py-2 rounded text-code-sm font-code-sm uppercase tracking-widest transition-all duration-200 border ${
            mode === 'text'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          Ketik Teks
        </button>
      </div>

      {/* Content Panel */}
      <div className="bg-surface-container/40 backdrop-blur-md border border-outline-variant/50 rounded-lg p-6 mb-6">
        {mode === 'file' ? (
          <>
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isDisabled && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-all duration-200 ${
                isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              } ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-outline-variant/50 hover:border-primary/50 hover:bg-surface-container/50'
              }`}
            >
              <span
                className="material-symbols-outlined text-on-surface-variant mb-3"
                style={{ fontSize: '48px' }}
              >
                cloud_upload
              </span>
              <p className="text-body-md font-body-md text-on-surface-variant mb-1">
                Drag & Drop file atau{' '}
                <span className="text-primary font-semibold">klik untuk browse</span>
              </p>
              <p className="text-code-sm font-code-sm text-outline">
                .txt .md .jpg .png .mp3 .wav .mp4 .mkv — maks 100 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md,.jpg,.jpeg,.png,.mp3,.wav,.mp4,.mkv"
                disabled={isDisabled}
              />
            </div>

            {/* File Size Error */}
            {fileSizeError && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-error-container/20 rounded border border-error/30">
                <span className="material-symbols-outlined text-error text-[20px]">error</span>
                <p className="text-body-md font-body-md text-error">{fileSizeError}</p>
              </div>
            )}

            {/* File Info */}
            {file && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-surface-container-high rounded border border-outline-variant/50">
                <span className="material-symbols-outlined text-primary">description</span>
                <div className="flex-grow">
                  <p className="text-body-md font-body-md text-on-surface">{file.name}</p>
                  <p className="text-code-sm font-code-sm text-outline">{formatSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setFileSizeError(null) }}
                  className="text-on-surface-variant hover:text-error transition-colors"
                  disabled={isDisabled}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Text Input */}
            <label className="text-code-sm font-code-sm text-on-surface-variant uppercase tracking-widest mb-2 block">
              Masukkan pesan rahasia:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 5000))}
              placeholder="Ketik teks yang ingin dienkripsi..."
              className="w-full h-40 bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-4 text-body-md font-body-md text-on-surface placeholder:text-outline resize-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              disabled={isDisabled}
            />
            <div className="text-right mt-1">
              <span className="text-code-sm font-code-sm text-outline">
                {text.length}/5000
              </span>
            </div>
          </>
        )}
      </div>

      {/* Password Input */}
      <div className="bg-surface-container/40 backdrop-blur-md border border-outline-variant/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-code-sm font-code-sm text-on-surface-variant uppercase tracking-widest">
            Password
          </label>
          <button
            onClick={() => {
              const pw = generatePassword(16)
              setSuggestedPassword(pw)
              setShowSuggestion(true)
              setCopied(false)
            }}
            disabled={isDisabled}
            className="flex items-center gap-1.5 text-code-sm font-code-sm text-primary hover:text-primary-fixed-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">passkey</span>
            Sarankan Password
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setShowSuggestion(false) }}
            placeholder="Minimal 8 karakter"
            className="flex-grow bg-surface-container-lowest border border-outline-variant/50 rounded px-4 py-3 text-body-md font-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            disabled={isDisabled}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="px-3 py-3 bg-surface-container-high border border-outline-variant rounded text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors"
            aria-label="Toggle password visibility"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>

        {/* Password Suggestion Dropdown */}
        {showSuggestion && suggestedPassword && (
          <div className="mt-3 bg-surface-container-high border border-primary/30 rounded-lg p-4 shadow-lg animate-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
              <span className="text-code-sm font-code-sm text-primary uppercase tracking-widest">Password Kuat Disarankan</span>
            </div>
            <div
              className="bg-surface-container-lowest rounded px-4 py-3 mb-3 font-code-sm text-body-md text-on-surface select-all break-all tracking-wider cursor-pointer"
              onClick={(e) => {
                const range = document.createRange()
                range.selectNodeContents(e.currentTarget)
                const sel = window.getSelection()
                sel.removeAllRanges()
                sel.addRange(range)
              }}
            >
              {suggestedPassword}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPassword(suggestedPassword)
                  setShowPassword(true)
                  setShowSuggestion(false)
                  copyToClipboard(suggestedPassword).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 3000)
                  })
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary text-code-sm font-code-sm font-semibold rounded hover:bg-primary-fixed-dim transition-all duration-200 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Gunakan Password Ini
              </button>
              <button
                onClick={() => {
                  const pw = generatePassword(16)
                  setSuggestedPassword(pw)
                  setCopied(false)
                }}
                className="px-3 py-2 bg-surface-container border border-outline-variant rounded text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors"
                aria-label="Generate new password"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
              <button
                onClick={() => setShowSuggestion(false)}
                className="px-3 py-2 bg-surface-container border border-outline-variant rounded text-on-surface-variant hover:text-error hover:border-error/50 transition-colors"
                aria-label="Dismiss suggestion"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Copied Notification */}
        {copied && !showSuggestion && (
          <div className="mt-3 flex items-center gap-2 text-code-sm font-code-sm text-secondary">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Password disalin ke clipboard — simpan di tempat aman!
          </div>
        )}

        {/* Strength Meter */}
        {password.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-code-sm font-code-sm text-on-surface-variant">Kekuatan:</span>
            <div className="flex-grow h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${(strength.level / 3) * 100}%` }}
              />
            </div>
            <span className={`text-code-sm font-code-sm ${
              strength.level === 3 ? 'text-secondary' : strength.level === 2 ? 'text-tertiary-container' : 'text-error'
            }`}>
              {strength.label} {strength.level === 3 ? '✅' : strength.level === 2 ? '⚠️' : '❌'}
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleEncrypt}
        disabled={!isFormValid || isDisabled}
        className="w-full bg-primary text-on-primary text-body-md font-body-md font-semibold px-8 py-4 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(164,230,255,0.2)] hover:bg-primary-fixed-dim transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        <span className="material-symbols-outlined text-[20px]">enhanced_encryption</span>
        ENKRIPSI SEKARANG
      </button>

      {/* Processing Overlay */}
      <ProcessingOverlay
        status={status}
        progress={progress}
        statusText={statusText}
        error={error}
        result={result}
        onDownload={downloadResult}
        onReset={handleReset}
        operation="encrypt"
      />
    </section>
  )
}
