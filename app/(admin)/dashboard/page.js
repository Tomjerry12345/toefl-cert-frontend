'use client'
import { useEffect, useState } from 'react'
import { getAllCertificates } from '@/lib/api'
import { FileCheck, Clock, XCircle, Hash, ExternalLink, Search, RefreshCw, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const statusBadge = {
  issued: <span className="badge-valid">✓ Issued</span>,
  revoked: <span className="badge-invalid">✗ Revoked</span>,
  pending: <span className="badge-pending">⏳ Pending</span>,
}

export default function DashboardPage() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })

  const fetchCerts = async (page = 1) => {
    try {
      setLoading(true)
      const res = await getAllCertificates({ page, limit: 10, search, status })
      setCerts(res.data.data)
      setPagination(res.data.pagination)
    } catch {
      toast.error('Gagal mengambil data sertifikat')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCerts() }, [search, status])

  const stats = [
    { label: 'Total Sertifikat', value: pagination.total, icon: FileCheck, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Issued', value: certs.filter(c => c.status === 'issued').length, icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Revoked', value: certs.filter(c => c.status === 'revoked').length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Pending', value: certs.filter(c => c.status === 'pending').length, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Kelola dan monitor sertifikat TOEFL</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Daftar Sertifikat</h2>
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9 w-64"
                placeholder="Cari nama / email / ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Filter status */}
            <select className="input w-36" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="issued">Issued</option>
              <option value="revoked">Revoked</option>
              <option value="pending">Pending</option>
            </select>
            <button onClick={() => fetchCerts()} className="btn-secondary py-2 px-3">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : certs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Belum ada sertifikat</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Cert ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Nama</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Skor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">TX Hash</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {certs.map(cert => (
                  <tr key={cert.certId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-primary-700 font-semibold">{cert.certId}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{cert.holderName}</td>
                    <td className="py-3 px-4 text-gray-500">{cert.holderEmail}</td>
                    <td className="py-3 px-4 font-bold text-gray-800">{cert.score}</td>
                    <td className="py-3 px-4">{statusBadge[cert.status]}</td>
                    <td className="py-3 px-4">
                      {cert.txHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${cert.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:underline font-mono text-xs"
                        >
                          <Hash size={12} />
                          {cert.txHash.slice(0, 10)}...
                          <ExternalLink size={10} />
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <Link
                        href={`/verify?certId=${cert.certId}`}
                        className="text-xs text-primary-600 hover:underline font-semibold"
                      >
                        Verifikasi
                      </Link>
                      {cert.filePath && (
                        <a
                          href={`http://localhost:5000/${cert.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          <FileText size={12} />
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => fetchCerts(page)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                  page === pagination.page
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
