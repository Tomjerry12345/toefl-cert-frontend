'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { verifyCertificate } from '@/lib/api'
import { ShieldCheck, ShieldX, Search, ExternalLink, Hash, Calendar, User, Building } from 'lucide-react'
import toast from 'react-hot-toast'
import { Suspense } from 'react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const [certId, setCertId] = useState(searchParams.get('certId') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const id = searchParams.get('certId')
    if (id) { setCertId(id); handleVerify(id) }
  }, [])

  const handleVerify = async (id) => {
    const target = id || certId
    if (!target) { toast.error('Masukkan Cert ID terlebih dahulu'); return }

    try {
      setLoading(true)
      setResult(null)
      const res = await verifyCertificate(target)
      setResult(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ verified: false, message: 'Sertifikat tidak ditemukan' })
      } else {
        toast.error('Gagal verifikasi')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Sertifikat</h1>
      <p className="text-gray-500 mb-8">Verifikasi keaslian sertifikat TOEFL via Blockchain & Merkle Tree</p>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="card">
          <label className="label">Certificate ID</label>
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="Contoh: TOEFL-DE926221"
              value={certId}
              onChange={e => setCertId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
            />
            <button onClick={() => handleVerify()} className="btn-primary" disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Search size={16} /> Verifikasi</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="max-w-2xl mx-auto">
          {/* Status Banner */}
          <div className={`rounded-xl p-6 mb-6 flex items-center gap-4 ${
            result.verified
              ? 'bg-emerald-50 border-2 border-emerald-200'
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            {result.verified ? (
              <ShieldCheck size={48} className="text-emerald-500 shrink-0" />
            ) : (
              <ShieldX size={48} className="text-red-500 shrink-0" />
            )}
            <div>
              <h2 className={`text-xl font-bold ${result.verified ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.verified ? '✓ Sertifikat VALID' : '✗ Sertifikat TIDAK VALID'}
              </h2>
              <p className={`text-sm ${result.verified ? 'text-emerald-600' : 'text-red-600'}`}>
                {result.verified
                  ? 'Sertifikat ini terverifikasi di Blockchain Ethereum Sepolia'
                  : result.message || 'Sertifikat tidak ditemukan atau telah dicabut'}
              </p>
            </div>
          </div>

          {/* Detail */}
          {result.data && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">Detail Sertifikat</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: User, label: 'Nama', value: result.data.holderName },
                  { icon: Building, label: 'Institusi', value: result.data.institution },
                  { icon: Calendar, label: 'Tanggal Tes', value: formatDate(result.data.testDate) },
                  { icon: Calendar, label: 'Kadaluarsa', value: formatDate(result.data.expiryDate) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Icon size={18} className="text-primary-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="font-semibold text-gray-800 text-sm">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Score */}
              <div className="p-4 bg-primary-50 rounded-xl mb-6 text-center">
                <p className="text-sm text-primary-600 font-semibold">Skor TOEFL</p>
                <p className="text-4xl font-bold text-primary-700">{result.data.score}</p>
                <p className="text-xs text-primary-500">dari 677</p>
              </div>

              {/* Blockchain Info */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Informasi Blockchain</p>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Merkle Root', value: result.data.merkleRoot },
                    { label: 'TX Hash', value: result.data.txHash },
                    { label: 'Block', value: result.data.blockNumber },
                    { label: 'Issued At', value: formatDate(result.data.issuedAt) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-gray-500 w-24 shrink-0">{label}:</span>
                      <span className="font-mono text-gray-700 truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Verification Status */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className={`p-3 rounded-lg text-center text-xs font-semibold ${
                    result.data.localVerification ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {result.data.localVerification ? '✓' : '✗'} Merkle Proof Valid
                  </div>
                  <div className={`p-3 rounded-lg text-center text-xs font-semibold ${
                    result.data.blockchainVerification ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {result.data.blockchainVerification ? '✓' : '✗'} Blockchain Verified
                  </div>
                </div>

                {result.data.etherscan && (
                  <a
                    href={result.data.etherscan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs mt-4 inline-flex"
                  >
                    <ExternalLink size={14} />
                    Lihat di Etherscan
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
