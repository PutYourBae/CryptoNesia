import { useState, useRef } from 'react'
import useCrypto from '../hooks/useCrypto'
import ProcessingOverlay from '../components/ProcessingOverlay'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export default function Encrypt() {
  const [mode, setMode] = useState('file') // 'file' or 'text'
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileSizeError, setFileSizeError] = useState(null)
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
        <label className="text-code-sm font-code-sm text-on-surface-variant uppercase tracking-widest mb-3 block">
          Password
        </label>
        <div className="flex gap-2">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
