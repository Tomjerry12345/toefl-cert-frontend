'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { issueCertificate } from '@/lib/api'
import toast from 'react-hot-toast'
import { Upload, FileText, CheckCircle, ExternalLink, Copy, X } from 'lucide-react'

export default function IssuePage() {
  const [form, setForm] = useState({
    holderName: '', holderEmail: '', score: '',
    testDate: '', expiryDate: '', institution: 'UIN Alauddin Makassar'
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const onDrop = useCallback(accepted => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.holderName || !form.holderEmail || !form.score || !form.testDate || !form.expiryDate) {
      toast.error('Lengkapi semua field yang wajib diisi')
      return
    }

    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => formData.append(k, v))
    if (file) formData.append('file', file)

    try {
      setLoading(true)
      const res = await issueCertificate(formData)
      setResult(res.data.data)
      toast.success('Sertifikat berhasil diterbitkan!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menerbitkan sertifikat')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Disalin!')
  }

  if (result) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Issue Sertifikat</h1>
        <div className="max-w-2xl mx-auto">
          <div className="card border-l-4 border-emerald-500">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle size={28} className="text-emerald-500" />
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Sertifikat Berhasil Diterbitkan!</h2>
                <p className="text-gray-500 text-sm">Tersimpan di Blockchain Ethereum Sepolia</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Certificate ID', value: result.certId },
                { label: 'Nama', value: result.holderName },
                { label: 'Skor TOEFL', value: result.score },
                { label: 'Merkle Root', value: result.merkleRoot, mono: true },
                { label: 'TX Hash', value: result.txHash, mono: true },
                { label: 'Block Number', value: result.blockNumber },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-start justify-between py-2 border-b border-gray-50">
                  <span className="text-sm font-semibold text-gray-600 w-32 shrink-0">{label}</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-sm text-gray-800 truncate ${mono ? 'font-mono text-xs' : ''}`}>
                      {value}
                    </span>
                    {mono && (
                      <button onClick={() => copyToClipboard(value)} className="shrink-0">
                        <Copy size={14} className="text-gray-400 hover:text-primary-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* QR Code */}
            {result.qrCode && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center gap-6">
                <img src={result.qrCode} alt="QR Code" className="w-24 h-24 rounded-lg" />
                <div>
                  <p className="font-semibold text-gray-800 mb-1">QR Code Verifikasi</p>
                  <p className="text-xs text-gray-500 mb-2">Scan untuk verifikasi sertifikat</p>
                  <p className="text-xs font-mono text-primary-600 break-all">{result.verifyUrl}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <a
                href={result.etherscan}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm"
              >
                <ExternalLink size={16} />
                Lihat di Etherscan
              </a>
              {result.pdfDownloadUrl && (
                <a
                  href={`http://localhost:5000/${result.pdfDownloadUrl}`}
                  target="_blank"
                  className="btn-secondary text-sm"
                >
                  <FileText size={16} />
                  Download PDF
                </a>
              )}
              <button onClick={() => setResult(null)} className="btn-secondary text-sm">
                <X size={16} />
                Issue Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Issue Sertifikat</h1>
      <p className="text-gray-500 mb-8">Terbitkan sertifikat TOEFL ke Blockchain Ethereum Sepolia</p>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nama Lengkap *</label>
              <input className="input" placeholder="Rahmat Ramadhan"
                value={form.holderName} onChange={e => setForm({...form, holderName: e.target.value})} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="rahmat@email.com"
                value={form.holderEmail} onChange={e => setForm({...form, holderEmail: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Skor TOEFL * (0-677)</label>
              <input className="input" type="number" min="0" max="677" placeholder="400"
                value={form.score} onChange={e => setForm({...form, score: e.target.value})} />
            </div>
            <div>
              <label className="label">Institusi</label>
              <input className="input" placeholder="UIN Alauddin Makassar"
                value={form.institution} onChange={e => setForm({...form, institution: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tanggal Tes *</label>
              <input className="input" type="date"
                value={form.testDate} onChange={e => setForm({...form, testDate: e.target.value})} />
            </div>
            <div>
              <label className="label">Tanggal Kadaluarsa *</label>
              <input className="input" type="date"
                value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="label">Upload PDF Sertifikat (Opsional)</label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-primary-700">
                  <FileText size={20} />
                  <span className="font-medium text-sm">{file.name}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}>
                    <X size={16} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    {isDragActive ? 'Lepaskan file di sini...' : 'Drag & drop PDF atau klik untuk upload'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (maks. 10MB)</p>
                </div>
              )}
            </div>
            {file && <p className="text-xs text-emerald-600 mt-1">✓ QR Code akan di-embed ke dalam PDF ini</p>}
          </div>

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses ke Blockchain...
              </>
            ) : (
              <>Issue Sertifikat ke Blockchain</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
