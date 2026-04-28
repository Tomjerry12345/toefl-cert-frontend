'use client'
import { useState, useEffect, useRef } from 'react'
import { issueBatch, getAllTemplates } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Send, CheckCircle, ExternalLink, Upload, FileSpreadsheet, Layout, Download, X, FileDown } from 'lucide-react'

const COLS = [
  { key: 'holderName', label: 'Nama *', type: 'text' },
  { key: 'nim', label: 'NIM *', type: 'text' },
  { key: 'nomorSurat', label: 'No. Surat', type: 'text' },
  { key: 'lokasi', label: 'Lokasi', type: 'text' },
  { key: 'waktuMulai', label: 'Tgl Mulai', type: 'date' },
  { key: 'waktuSelesai', label: 'Tgl Selesai', type: 'date' },
  { key: 'skorListening', label: 'Listening', type: 'number' },
  { key: 'skorStructure', label: 'Structure', type: 'number' },
  { key: 'skorReading', label: 'Reading', type: 'number' },
  { key: 'totalSkor', label: 'Total * ', type: 'number' },
  { key: 'institution', label: 'Institusi', type: 'text' },
]

const EXCEL_HEADERS = COLS.map(c => c.key)
const EXCEL_SAMPLE = ['Ahmad Fauzi','60900119001','001/TOEFL/UIN/2025','Makassar','2025-01-10','2025-01-15','47','47','51','550','UIN Alauddin Makassar']

const emptyRow = () => ({
  id: Date.now() + Math.random(),
  holderName: '', nim: '', nomorSurat: '', lokasi: '',
  waktuMulai: '', waktuSelesai: '',
  skorListening: '', skorStructure: '', skorReading: '', totalSkor: '',
  institution: 'UIN Alauddin Makassar'
})

function downloadExcelTemplate() {
  const csv = [EXCEL_HEADERS.join(','), EXCEL_SAMPLE.join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'template_batch_sertifikat.csv'; a.click()
  URL.revokeObjectURL(url)
}

async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const lines = e.target.result.trim().split('\n').filter(Boolean)
        if (lines.length < 2) return reject(new Error('File CSV kosong atau hanya header'))
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const obj = {}
          headers.forEach((h, i) => { obj[h] = vals[i] || '' })
          return { id: Date.now() + Math.random(), ...obj }
        })
        resolve(rows)
      }
      reader.onerror = reject; reader.readAsText(file)
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const XLSX = await import('xlsx')
          const wb = XLSX.read(e.target.result, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const data = XLSX.utils.sheet_to_json(ws, { raw: false })
          resolve(data.map(row => ({ id: Date.now() + Math.random(), ...row })))
        } catch (err) { reject(err) }
      }
      reader.onerror = reject; reader.readAsArrayBuffer(file)
    } else {
      reject(new Error('Format tidak didukung. Gunakan .xlsx, .xls, atau .csv'))
    }
  })
}

function ResultView({ result, onReset }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Batch Issue</h1>
      <div className="card border-l-4 border-emerald-500 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle size={28} className="text-emerald-500" />
          <div>
            <h2 className="font-bold text-gray-900">{result.certificates?.length} Sertifikat Berhasil Diterbitkan!</h2>
            <p className="text-gray-500 text-sm">1 Transaksi untuk semua sertifikat (efisiensi Merkle Tree)</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div><span className="font-semibold text-gray-600">Batch ID: </span><span className="font-mono">{result.batchId}</span></div>
          <div><span className="font-semibold text-gray-600">Merkle Root: </span><span className="font-mono text-xs">{result.merkleRoot?.slice(0,20)}...</span></div>
          <div><span className="font-semibold text-gray-600">TX Hash: </span><span className="font-mono text-xs">{result.txHash?.slice(0,20)}...</span></div>
          <div><span className="font-semibold text-gray-600">Block: </span><span>{result.blockNumber}</span></div>
        </div>
        <a href={result.etherscan} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm inline-flex">
          <ExternalLink size={16} /> Lihat di Etherscan
        </a>
      </div>
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4">Daftar Sertifikat</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Cert ID','Nama','NIM','Total Skor','QR','PDF'].map(h => (
                  <th key={h} className="text-left py-2 px-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.certificates?.map(cert => (
                <tr key={cert.certId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs text-blue-700">{cert.certId}</td>
                  <td className="py-2 px-3">{cert.holderName}</td>
                  <td className="py-2 px-3 text-gray-500">{cert.nim}</td>
                  <td className="py-2 px-3 font-semibold">{cert.totalSkor}</td>
                  <td className="py-2 px-3">{cert.qrCode && <img src={cert.qrCode} alt="QR" className="w-12 h-12 rounded" />}</td>
                  <td className="py-2 px-3">
                    {cert.pdfUrl
                      ? <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><FileDown size={13}/> PDF</a>
                      : <span className="text-xs text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <button onClick={onReset} className="btn-secondary mt-4">Issue Batch Lagi</button>
    </div>
  )
}

export default function BatchIssuePage() {
  const [rows, setRows] = useState([emptyRow()])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [inputMode, setInputMode] = useState('manual')
  const [excelFile, setExcelFile] = useState(null)
  const [parsedRows, setParsedRows] = useState([])
  const [parsing, setParsing] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => { getAllTemplates().then(res => setTemplates(res.data.data)).catch(() => {}) }, [])

  const addRow = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id))
  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      // Auto-hitung total skor
      if (['skorListening','skorStructure','skorReading'].includes(field)) {
        const l = parseFloat(field === 'skorListening' ? value : r.skorListening) || 0
        const s = parseFloat(field === 'skorStructure' ? value : r.skorStructure) || 0
        const rv = parseFloat(field === 'skorReading' ? value : r.skorReading) || 0
        if (l || s || rv) updated.totalSkor = String(Math.round(l + s + rv))
      }
      return updated
    }))
  }

  const handleExcelChange = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setExcelFile(file); setParsing(true)
    try { const rows = await parseFile(file); setParsedRows(rows); toast.success(`${rows.length} baris berhasil dibaca!`) }
    catch (err) { toast.error(err.message || 'Gagal membaca file'); setParsedRows([]) }
    finally { setParsing(false) }
  }

  const clearExcel = () => { setExcelFile(null); setParsedRows([]); if (fileRef.current) fileRef.current.value = '' }

  const handleSubmit = async () => {
    const activeRows = inputMode === 'excel' ? parsedRows : rows
    if (inputMode === 'excel' && parsedRows.length === 0) return toast.error('Upload file Excel/CSV terlebih dahulu')
    if (activeRows.some(r => !r.holderName || !r.nim || !r.totalSkor))
      return toast.error('Nama, NIM, dan Total Skor wajib diisi di setiap baris')
    try {
      setLoading(true)
      const certificates = activeRows.map(({ id, ...rest }) => ({
        ...rest,
        skorListening: rest.skorListening ? Number(rest.skorListening) : null,
        skorStructure: rest.skorStructure ? Number(rest.skorStructure) : null,
        skorReading: rest.skorReading ? Number(rest.skorReading) : null,
        totalSkor: Number(rest.totalSkor),
      }))
      const payload = { certificates }
      if (selectedTemplateId) payload.templateId = selectedTemplateId
      const res = await issueBatch(payload)
      setResult(res.data.data)
      toast.success(`${certificates.length} sertifikat berhasil diterbitkan!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menerbitkan batch')
    } finally { setLoading(false) }
  }

  const totalRows = inputMode === 'excel' ? parsedRows.length : rows.length

  if (result) return <ResultView result={result} onReset={() => { setResult(null); setRows([emptyRow()]); setParsedRows([]) }} />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Batch Issue Sertifikat</h1>
      <p className="text-gray-500 mb-6 text-sm">Terbitkan banyak sertifikat sekaligus dengan 1 transaksi blockchain</p>

      <div className="card mb-5 bg-blue-50 border border-blue-100">
        <p className="text-sm text-blue-800"><strong>💡 Keunggulan Merkle Tree:</strong> Semua sertifikat dalam batch ini akan memiliki 1 Merkle Root dalam 1 transaksi blockchain, menghemat gas fee secara signifikan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Template */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3"><Layout size={16} className="text-blue-600" /><h3 className="font-semibold text-gray-800 text-sm">Template Sertifikat</h3></div>
          <select className="input text-sm" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
            <option value="">— Tanpa template (QR saja) —</option>
            {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          {selectedTemplateId
            ? <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle size={12}/> PDF akan di-generate otomatis</p>
            : <p className="text-xs text-gray-400 mt-2">Pilih template untuk generate PDF</p>}
          {templates.length === 0 && <a href="/templates" className="text-xs text-blue-600 hover:underline mt-2 block">+ Buat template dulu</a>}
        </div>

        {/* Input mode */}
        <div className="card col-span-2">
          <div className="flex items-center gap-2 mb-3"><Upload size={16} className="text-blue-600" /><h3 className="font-semibold text-gray-800 text-sm">Cara Input Data</h3></div>
          <div className="flex gap-2 mb-4">
            {[{id:'manual',label:'✏️ Input Manual'},{id:'excel',label:'📊 Upload Excel/CSV'}].map(m => (
              <button key={m.id} onClick={() => setInputMode(m.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${inputMode === m.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                {m.label}
              </button>
            ))}
          </div>
          {inputMode === 'excel' && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-sm text-blue-600 font-medium">
                  <FileSpreadsheet size={16}/>{excelFile ? excelFile.name : 'Pilih File Excel / CSV'}
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelChange}/>
                </label>
                {excelFile && <button onClick={clearExcel} className="text-gray-400 hover:text-red-500"><X size={18}/></button>}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={downloadExcelTemplate} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600">
                  <Download size={13}/> Download template CSV
                </button>
                {parsedRows.length > 0 && <span className="text-xs text-emerald-600 font-semibold">✅ {parsedRows.length} baris siap</span>}
                {parsing && <span className="text-xs text-blue-500">🔄 Membaca file...</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual table */}
      {inputMode === 'manual' && (
        <div className="card mb-5 overflow-x-auto">
          <table className="w-full text-sm" style={{minWidth: '900px'}}>
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 font-semibold text-gray-600 text-xs w-8">No</th>
                {COLS.map(c => <th key={c.key} className="text-left py-2 px-2 font-semibold text-gray-600 text-xs">{c.label}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="py-2 px-2 text-gray-400 font-semibold text-xs">{idx + 1}</td>
                  {COLS.map(col => (
                    <td key={col.key} className="py-2 px-1">
                      <input
                        className="input text-xs py-1.5 w-full"
                        style={{minWidth: col.type === 'date' ? '120px' : col.key === 'institution' ? '140px' : '80px'}}
                        type={col.type}
                        value={row[col.key]}
                        onChange={e => updateRow(row.id, col.key, e.target.value)}
                        placeholder={col.type === 'number' ? '0' : ''}
                      />
                    </td>
                  ))}
                  <td className="py-2 px-2">
                    {rows.length > 1 && <button onClick={() => removeRow(row.id)} className="text-red-300 hover:text-red-500"><Trash2 size={15}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button onClick={addRow} className="btn-secondary text-sm" disabled={rows.length >= 100}><Plus size={15}/> Tambah Baris</button>
          </div>
        </div>
      )}

      {/* Excel preview */}
      {inputMode === 'excel' && parsedRows.length > 0 && (
        <div className="card mb-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Preview Data ({parsedRows.length} baris)</h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-100">
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-500">No</th>
                  {COLS.map(c => <th key={c.key} className="text-left py-1.5 px-2 font-semibold text-gray-500">{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 px-2 text-gray-400">{idx + 1}</td>
                    {COLS.map(c => <td key={c.key} className="py-1.5 px-2 text-gray-700">{row[c.key] || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="card flex items-center justify-between">
        <div>
          <span className="font-semibold text-gray-700">{totalRows} sertifikat</span>
          {selectedTemplateId && <span className="ml-2 text-xs text-emerald-600 font-medium">+ PDF dari template</span>}
        </div>
        <button onClick={handleSubmit} className="btn-primary" disabled={loading || totalRows === 0}>
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Memproses...</>
            : <><Send size={16}/> Issue {totalRows} Sertifikat</>}
        </button>
      </div>
    </div>
  )
}
