'use client'
import { useState } from 'react'
import { issueBatch } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Send, CheckCircle, ExternalLink } from 'lucide-react'

const emptyRow = () => ({
  id: Date.now(),
  holderName: '', holderEmail: '', score: '',
  testDate: '', expiryDate: '', institution: 'UIN Alauddin Makassar'
})

export default function BatchIssuePage() {
  const [rows, setRows] = useState([emptyRow()])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const addRow = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id))
  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const handleSubmit = async () => {
    const invalid = rows.some(r => !r.holderName || !r.holderEmail || !r.score || !r.testDate || !r.expiryDate)
    if (invalid) {
      toast.error('Lengkapi semua field di setiap baris')
      return
    }

    try {
      setLoading(true)
      const certificates = rows.map(({ id, ...rest }) => rest)
      const res = await issueBatch({ certificates })
      setResult(res.data.data)
      toast.success(`${rows.length} sertifikat berhasil diterbitkan!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menerbitkan batch')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Batch Issue</h1>
        <div className="card border-l-4 border-emerald-500 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={28} className="text-emerald-500" />
            <div>
              <h2 className="font-bold text-gray-900">{result.certificates?.length} Sertifikat Berhasil Diterbitkan!</h2>
              <p className="text-gray-500 text-sm">1 Transaksi untuk semua sertifikat (efisiensi Merkle Tree)</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="font-semibold text-gray-600">Batch ID: </span>
              <span className="font-mono">{result.batchId}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Merkle Root: </span>
              <span className="font-mono text-xs">{result.merkleRoot?.slice(0,20)}...</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">TX Hash: </span>
              <span className="font-mono text-xs">{result.txHash?.slice(0,20)}...</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Block: </span>
              <span>{result.blockNumber}</span>
            </div>
          </div>
          <a href={result.etherscan} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm inline-flex">
            <ExternalLink size={16} /> Lihat di Etherscan
          </a>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Daftar Sertifikat</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Cert ID</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Nama</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Email</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600">QR</th>
              </tr>
            </thead>
            <tbody>
              {result.certificates?.map(cert => (
                <tr key={cert.certId} className="border-b border-gray-50">
                  <td className="py-2 px-3 font-mono text-xs text-primary-700">{cert.certId}</td>
                  <td className="py-2 px-3">{cert.holderName}</td>
                  <td className="py-2 px-3 text-gray-500">{cert.holderEmail}</td>
                  <td className="py-2 px-3">
                    {cert.qrCode && <img src={cert.qrCode} alt="QR" className="w-12 h-12 rounded" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={() => { setResult(null); setRows([emptyRow()]) }} className="btn-secondary mt-4">
          Issue Batch Lagi
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Batch Issue Sertifikat</h1>
      <p className="text-gray-500 mb-6">Terbitkan banyak sertifikat sekaligus dengan 1 transaksi blockchain</p>

      <div className="card mb-4 bg-primary-50 border border-primary-100">
        <p className="text-sm text-primary-800">
          <strong>💡 Keunggulan Merkle Tree:</strong> Semua sertifikat dalam batch ini akan memiliki 1 Merkle Root yang disimpan dalam 1 transaksi blockchain, menghemat gas fee secara signifikan.
        </p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 font-semibold text-gray-600">No</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Nama *</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Email *</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Skor *</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Tgl Tes *</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Tgl Exp *</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Institusi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="py-2 px-2 text-gray-400 font-semibold">{idx + 1}</td>
                  {['holderName', 'holderEmail', 'score', 'testDate', 'expiryDate', 'institution'].map(field => (
                    <td key={field} className="py-2 px-2">
                      <input
                        className="input text-xs py-1.5"
                        type={field === 'score' ? 'number' : field.includes('Date') ? 'date' : 'text'}
                        min={field === 'score' ? 0 : undefined}
                        max={field === 'score' ? 677 : undefined}
                        value={row[field]}
                        onChange={e => updateRow(row.id, field, e.target.value)}
                        placeholder={field === 'score' ? '0-677' : ''}
                      />
                    </td>
                  ))}
                  <td className="py-2 px-2">
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(row.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <button onClick={addRow} className="btn-secondary text-sm" disabled={rows.length >= 100}>
            <Plus size={16} /> Tambah Baris
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{rows.length} sertifikat</span>
            <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Issue {rows.length} Sertifikat
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
