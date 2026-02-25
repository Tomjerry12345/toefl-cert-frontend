'use client'
import { useState } from 'react'
import { getCertificateById, revokeCertificate } from '@/lib/api'
import toast from 'react-hot-toast'
import { Search, XCircle, AlertTriangle, CheckCircle } from 'lucide-react'

export default function RevokePage() {
  const [certId, setCertId] = useState('')
  const [reason, setReason] = useState('')
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [revoked, setRevoked] = useState(false)

  const handleSearch = async () => {
    if (!certId) { toast.error('Masukkan Cert ID'); return }
    try {
      setSearching(true)
      setCert(null)
      const res = await getCertificateById(certId)
      setCert(res.data.data)
    } catch {
      toast.error('Sertifikat tidak ditemukan')
    } finally {
      setSearching(false)
    }
  }

  const handleRevoke = async () => {
    if (!reason) { toast.error('Masukkan alasan pencabutan'); return }
    if (!confirm(`Yakin ingin mencabut sertifikat ${cert.certId}? Tindakan ini tidak dapat dibatalkan.`)) return

    try {
      setLoading(true)
      await revokeCertificate(cert.certId, reason)
      setRevoked(true)
      toast.success('Sertifikat berhasil dicabut')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mencabut sertifikat')
    } finally {
      setLoading(false)
    }
  }

  if (revoked) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Revoke Sertifikat</h1>
        <div className="max-w-lg mx-auto card border-l-4 border-red-500 text-center py-8">
          <CheckCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="font-bold text-gray-900 text-lg mb-2">Sertifikat Berhasil Dicabut</h2>
          <p className="text-gray-500 text-sm mb-2">Cert ID: <span className="font-mono font-semibold">{cert?.certId}</span></p>
          <p className="text-gray-500 text-sm">Status telah diperbarui di blockchain dan database</p>
          <button onClick={() => { setCert(null); setCertId(''); setReason(''); setRevoked(false) }}
            className="btn-secondary mt-6 mx-auto">
            Revoke Sertifikat Lain
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Revoke Sertifikat</h1>
      <p className="text-gray-500 mb-8">Cabut sertifikat yang tidak valid atau bermasalah</p>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Warning */}
        <div className="card bg-red-50 border border-red-100 flex gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            <strong>Perhatian:</strong> Pencabutan sertifikat akan dicatat permanen di blockchain dan tidak dapat dibatalkan.
          </p>
        </div>

        {/* Search */}
        <div className="card">
          <label className="label">Cari Sertifikat</label>
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="Masukkan Cert ID (TOEFL-XXXXXXXX)"
              value={certId}
              onChange={e => setCertId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="btn-secondary" disabled={searching}>
              {searching ? (
                <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
              ) : (
                <Search size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Cert Detail */}
        {cert && (
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4">Detail Sertifikat</h3>
            <div className="space-y-2 text-sm mb-4">
              {[
                ['Cert ID', cert.certId],
                ['Nama', cert.holderName],
                ['Email', cert.holderEmail],
                ['Skor', cert.score],
                ['Status', cert.status],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 w-20">{label}:</span>
                  <span className={`font-semibold ${label === 'Status' && cert.status === 'revoked' ? 'text-red-600' : 'text-gray-800'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {cert.status === 'revoked' ? (
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-red-600 font-semibold text-sm">Sertifikat ini sudah dicabut</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="label">Alasan Pencabutan *</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Contoh: Sertifikat palsu, data tidak valid, dll."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
                <button onClick={handleRevoke} className="btn-danger w-full justify-center" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Cabut Sertifikat
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
