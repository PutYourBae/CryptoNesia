import { useState, useRef, useEffect } from 'react'
import useCrypto from '../hooks/useCrypto'
import ProcessingOverlay from '../components/ProcessingOverlay'
import { validateMagic, peekMetadata, isValidBase64Format } from '../lib/fileFormat'

export default function Decrypt() {
  const [mode, setMode] = useState('file') // 'file' or 'text'
  const [file, setFile] = useState(null)
  const [fileBytes, setFileBytes] = useState(null)
  const [fileMetadata, setFileMetadata] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [base64Input, setBase64Input] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const {
    status,
    progress,
    statusText,
    error,
    result,
    decrypt,
    reset,
    downloadResult,
  } = useCrypto()

  // When a file is selected, validate it and read metadata
  useEffect(() => {
    if (!file) {
      setFileBytes(null)
      setFileMetadata(null)
      setFileError(null)
      return
    }

    let cancelled = false
    const readFile = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)

        if (cancelled) return

        if (!validateMagic(bytes)) {
          setFileError('Format file tidak valid. Bukan file CryptoNesia (.enc).')
          setFileBytes(null)
          setFileMetadata(null)
          return
        }

        const metadata = peekMetadata(bytes)
        setFileBytes(bytes)
        setFileMetadata(metadata)
        setFileError(null)
      } catch {
        if (!cancelled) {
          setFileError('Gagal membaca file.')
          setFileBytes(null)
          setFileMetadata(null)
        }
      }
    }

    readFile()
    return () => { cancelled = true }
  }, [file])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) setFile(droppedFile)
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) setFile(selected)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDecrypt = () => {
    if (mode === 'file' && file) {
      decrypt(file, password, 'file')
    } else if (mode === 'text' && base64Input.trim().length > 0) {
      decrypt(base64Input, password, 'text')
    }
  }

  const handleReset = () => {
    reset()
  }

  // Validation
  const isBase64Valid = base64Input.trim().length > 0 && isValidBase64Format(base64Input)
  const isFileValid = file !== null && fileBytes !== null && !fileError
  const isFormValid = (mode === 'file' ? isFileValid : isBase64Valid) && password.length >= 1
  const isDisabled = status === 'processing'

  return (
    <section className="w-full max-w-2xl mx-auto">
      {/* Page Title */}
      <div className="flex items-center gap-3 mb-8">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}
        >
          lock_open
        </span>
        <h1 className="text-headline-lg font-headline-lg text-on-surface">
          Dekripsi File
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
          Upload File .enc
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
          <span className="material-symbols-outlined text-[18px]">content_paste</span>
          Paste Teks
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
                Drag & Drop file{' '}
                <span className="text-code-sm font-code-sm text-primary">.enc</span>{' '}
                yang terenkripsi
              </p>
              <p className="text-code-sm font-code-sm text-outline">
                atau klik untuk browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".enc"
                disabled={isDisabled}
              />
            </div>

            {/* File Error */}
            {fileError && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-error-container/20 rounded border border-error/30">
                <span className="material-symbols-outlined text-error text-[20px]">error</span>
                <p className="text-body-md font-body-md text-error">{fileError}</p>
              </div>
            )}

            {/* File Info */}
            {file && !fileError && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-surface-container-high rounded border border-outline-variant/50">
                <span className="material-symbols-outlined text-primary">description</span>
                <div className="flex-grow">
                  <p className="text-body-md font-body-md text-on-surface">{file.name}</p>
                  <p className="text-code-sm font-code-sm text-outline">{formatSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-on-surface-variant hover:text-error transition-colors"
                  disabled={isDisabled}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            )}

            {/* Metadata Preview */}
            {fileMetadata && !fileError && (
              <div className="mt-4 px-4 py-3 bg-surface-container-lowest/50 rounded border border-outline-variant/30">
                <p className="text-code-sm font-code-sm text-on-surface-variant uppercase tracking-widest mb-2">
                  Informasi File Asli
                </p>
                <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                  <span className="text-code-sm font-code-sm text-outline">Nama:</span>
                  <span className="text-code-sm font-code-sm text-on-surface truncate">{fileMetadata.name}</span>
                  <span className="text-code-sm font-code-sm text-outline">Tipe:</span>
                  <span className="text-code-sm font-code-sm text-on-surface">{fileMetadata.type || '-'}</span>
                  <span className="text-code-sm font-code-sm text-outline">Ukuran:</span>
                  <span className="text-code-sm font-code-sm text-on-surface">{formatSize(fileMetadata.size)}</span>
                  {fileMetadata.ts && (
                    <>
                      <span className="text-code-sm font-code-sm text-outline">Dienkripsi:</span>
                      <span className="text-code-sm font-code-sm text-on-surface">
                        {new Date(fileMetadata.ts).toLocaleString('id-ID')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Base64 Text Input */}
            <label className="text-code-sm font-code-sm text-on-surface-variant uppercase tracking-widest mb-2 block">
              Paste teks terenkripsi:
            </label>
            <textarea
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
              placeholder="CNEO:v1:SGVsbG8gV29ybGQh..."
              className="w-full h-40 bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-4 text-code-sm font-code-sm text-on-surface placeholder:text-outline resize-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              disabled={isDisabled}
            />

            {/* Validation indicator */}
            {base64Input.trim().length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                {isBase64Valid ? (
                  <>
                    <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                    <span className="text-code-sm font-code-sm text-secondary">
                      Format valid — siap didekripsi
                    </span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-error text-[18px]">error</span>
                    <span className="text-code-sm font-code-sm text-error">
                      Format tidak valid — harus dimulai dengan &quot;CNEO:v1:&quot;
                    </span>
                  </>
                )}
              </div>
            )}
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
            placeholder="Masukkan password enkripsi"
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
      </div>

      {/* Action Button */}
      <button
        onClick={handleDecrypt}
        disabled={!isFormValid || isDisabled}
        className="w-full bg-primary text-on-primary text-body-md font-body-md font-semibold px-8 py-4 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(164,230,255,0.2)] hover:bg-primary-fixed-dim transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        <span className="material-symbols-outlined text-[20px]">lock_open</span>
        DEKRIPSI SEKARANG
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
        operation="decrypt"
      />
    </section>
  )
}
