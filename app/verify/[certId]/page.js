'use client'
import { useEffect, useState } from 'react'
import { verifyCertificate } from '@/lib/api'
import { ShieldCheck, ShieldX, ExternalLink, Calendar, User, Building, Loader } from 'lucide-react'

export default function VerifyByIdPage({ params }) {
  const { certId } = params
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await verifyCertificate(certId)
        setResult(res.data)
      } catch (err) {
        if (err.response?.status === 404) {
          setResult({ verified: false, message: 'Sertifikat tidak ditemukan' })
        } else {
          setResult({ verified: false, message: 'Gagal verifikasi, coba lagi' })
        }
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [certId])

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Memverifikasi sertifikat...</p>
          <p className="text-gray-400 text-sm mt-1">Mengecek di Blockchain Ethereum Sepolia</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm">Sistem Verifikasi Sertifikat TOEFL</p>
          <p className="text-gray-400 text-xs">Berbasis Blockchain Ethereum & Merkle Tree</p>
        </div>

        {/* Status Banner */}
        <div className={`rounded-2xl p-6 mb-4 text-center ${
          result?.verified
            ? 'bg-emerald-50 border-2 border-emerald-300'
            : 'bg-red-50 border-2 border-red-300'
        }`}>
          {result?.verified ? (
            <ShieldCheck size={56} className="text-emerald-500 mx-auto mb-3" />
          ) : (
            <ShieldX size={56} className="text-red-500 mx-auto mb-3" />
          )}
          <h1 className={`text-2xl font-bold mb-1 ${
            result?.verified ? 'text-emerald-700' : 'text-red-700'
          }`}>
            {result?.verified ? 'SERTIFIKAT VALID ✓' : 'TIDAK VALID ✗'}
          </h1>
          <p className={`text-sm ${result?.verified ? 'text-emerald-600' : 'text-red-600'}`}>
            {result?.verified
              ? 'Terverifikasi di Blockchain Ethereum Sepolia'
              : result?.message || 'Sertifikat tidak ditemukan atau telah dicabut'}
          </p>
        </div>

        {/* Detail */}
        {result?.data && (
          <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
            {/* Score */}
            <div className="text-center p-4 bg-primary-50 rounded-xl mb-5">
              <p className="text-sm text-primary-600 font-semibold">Skor TOEFL</p>
              <p className="text-5xl font-bold text-primary-700">{result.data.score}</p>
              <p className="text-xs text-primary-400">dari 677</p>
            </div>

            {/* Info */}
            <div className="space-y-3">
              {[
                { icon: User, label: 'Nama', value: result.data.holderName },
                { icon: Building, label: 'Institusi', value: result.data.institution },
                { icon: Calendar, label: 'Tanggal Tes', value: formatDate(result.data.testDate) },
                { icon: Calendar, label: 'Berlaku Sampai', value: formatDate(result.data.expiryDate) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-semibold text-gray-800 text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cert ID */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Certificate ID</p>
              <p className="font-mono text-sm font-semibold text-gray-700">{result.data.certId}</p>
            </div>

            {/* Verification badges */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className={`p-2 rounded-lg text-center text-xs font-semibold ${
                result.data.localVerification ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {result.data.localVerification ? '✓' : '✗'} Merkle Proof
              </div>
              <div className={`p-2 rounded-lg text-center text-xs font-semibold ${
                result.data.blockchainVerification ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {result.data.blockchainVerification ? '✓' : '✗'} Blockchain
              </div>
            </div>

            {/* Etherscan link */}
            {result.data.etherscan && (
              <a
                href={result.data.etherscan}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 text-xs text-primary-600 hover:underline font-semibold"
              >
                <ExternalLink size={14} />
                Lihat di Etherscan
              </a>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          UIN Alauddin Makassar · Sistem Verifikasi Sertifikat TOEFL
        </p>
      </div>
    </div>
  )
}
