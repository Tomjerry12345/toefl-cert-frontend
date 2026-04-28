"use client";
import { useState, useEffect } from "react";
import { issueCertificate, getAllTemplates } from "@/lib/api";
import toast from "react-hot-toast";
import { CheckCircle, ExternalLink, Copy, X, FileDown, Layout } from "lucide-react";

const EMPTY_FORM = {
  holderName: "", nim: "", nomorSurat: "",
  lokasi: "", waktuMulai: "", waktuSelesai: "",
  skorListening: "", skorStructure: "", skorReading: "", totalSkor: "",
  institution: "UIN Alauddin Makassar",
};

export default function IssuePage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    getAllTemplates().then((res) => setTemplates(res.data.data)).catch(() => {});
  }, []);

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success("Disalin!"); };

  // Auto-hitung total skor
  const handleSkorChange = (field, val) => {
    const updated = { ...form, [field]: val };
    const l = parseFloat(updated.skorListening) || 0;
    const s = parseFloat(updated.skorStructure) || 0;
    const r = parseFloat(updated.skorReading) || 0;
    if (l || s || r) updated.totalSkor = String(Math.round(l + s + r));
    setForm(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.holderName) return toast.error("Nama wajib diisi");
    if (!form.nim) return toast.error("NIM wajib diisi");
    if (!form.totalSkor) return toast.error("Total skor wajib diisi");

    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (selectedTemplateId) formData.append("templateId", selectedTemplateId);

      const res = await issueCertificate(formData);
      setResult(res.data.data || res.data);
      toast.success("Sertifikat berhasil diterbitkan!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menerbitkan sertifikat");
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);

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

            <div className="space-y-3 mb-6">
              {[
                { label: "Certificate ID", value: result.certId },
                { label: "No. Surat", value: result.nomorSurat },
                { label: "Nama", value: result.holderName },
                { label: "NIM", value: result.nim },
                { label: "Lokasi", value: result.lokasi },
                { label: "Waktu Mulai", value: result.waktuMulai ? new Date(result.waktuMulai).toLocaleDateString("id-ID") : null },
                { label: "Waktu Selesai", value: result.waktuSelesai ? new Date(result.waktuSelesai).toLocaleDateString("id-ID") : null },
                { label: "Skor Listening", value: result.skorListening },
                { label: "Skor Structure", value: result.skorStructure },
                { label: "Skor Reading", value: result.skorReading },
                { label: "Total Skor", value: result.totalSkor },
                { label: "TX Hash", value: result.txHash, mono: true },
                { label: "Block Number", value: result.blockNumber },
              ].filter(item => item.value != null && item.value !== "").map(({ label, value, mono }) => (
                <div key={label} className="flex items-start justify-between py-2 border-b border-gray-50">
                  <span className="text-sm font-semibold text-gray-600 w-36 shrink-0">{label}</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-sm text-gray-800 truncate ${mono ? "font-mono text-xs" : ""}`}>{String(value)}</span>
                    {mono && value && (
                      <button onClick={() => copyToClipboard(value)} className="shrink-0">
                        <Copy size={14} className="text-gray-400 hover:text-blue-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {result.qrCode && (
              <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-6 mb-6">
                <img src={result.qrCode} alt="QR Code" className="w-24 h-24 rounded-lg" />
                <div>
                  <p className="font-semibold text-gray-800 mb-1">QR Code Verifikasi</p>
                  <p className="text-xs text-gray-500 mb-2">Scan untuk verifikasi sertifikat</p>
                  <p className="text-xs font-mono text-blue-600 break-all">{result.verifyUrl}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {result.etherscan && (
                <a href={result.etherscan} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                  <ExternalLink size={16} /> Lihat di Etherscan
                </a>
              )}
              {result.pdfUrl && (
                <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                  <FileDown size={16} /> Download PDF
                </a>
              )}
              <button onClick={() => { setResult(null); setForm(EMPTY_FORM); }} className="btn-secondary text-sm">
                <X size={16} /> Issue Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Issue Sertifikat</h1>
      <p className="text-gray-500 mb-6">Terbitkan sertifikat TOEFL ke Blockchain Ethereum Sepolia</p>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Template Selector */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Layout size={16} className="text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-sm">Template Sertifikat</h3>
            </div>
            <select className="input" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
              <option value="">— Tanpa template (hanya QR Code) —</option>
              {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            {selectedTemplateId ? (
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-500" />
                <p className="text-xs text-emerald-600 font-medium">PDF akan di-generate dari template <strong>{selectedTemplate?.name}</strong></p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-2">
                Pilih template untuk generate PDF.{" "}
                {templates.length === 0 && <a href="/templates" className="text-blue-600 hover:underline">Buat template dulu →</a>}
              </p>
            )}
          </div>

          {/* Data Peserta */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Data Peserta</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nama Lengkap *</label>
                <input className="input" placeholder="Ahmad Fauzi" value={form.holderName} onChange={(e) => f("holderName", e.target.value)} />
              </div>
              <div>
                <label className="label">NIM *</label>
                <input className="input" placeholder="60900119001" value={form.nim} onChange={(e) => f("nim", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">No. Surat / Dokumen</label>
              <input className="input" placeholder="001/TOEFL/UIN/2025" value={form.nomorSurat} onChange={(e) => f("nomorSurat", e.target.value)} />
            </div>
            <div>
              <label className="label">Institusi</label>
              <input className="input" placeholder="UIN Alauddin Makassar" value={form.institution} onChange={(e) => f("institution", e.target.value)} />
            </div>
          </div>

          {/* Lokasi & Waktu */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Lokasi & Waktu Pelatihan</h3>
            <div>
              <label className="label">Lokasi</label>
              <input className="input" placeholder="Makassar, Sulawesi Selatan" value={form.lokasi} onChange={(e) => f("lokasi", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Waktu Mulai</label>
                <input className="input" type="date" value={form.waktuMulai} onChange={(e) => f("waktuMulai", e.target.value)} />
              </div>
              <div>
                <label className="label">Waktu Selesai</label>
                <input className="input" type="date" value={form.waktuSelesai} onChange={(e) => f("waktuSelesai", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Skor */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Skor TOEFL</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Listening</label>
                <input className="input" type="number" min="0" max="677" placeholder="0" value={form.skorListening} onChange={(e) => handleSkorChange("skorListening", e.target.value)} />
              </div>
              <div>
                <label className="label">Structure</label>
                <input className="input" type="number" min="0" max="677" placeholder="0" value={form.skorStructure} onChange={(e) => handleSkorChange("skorStructure", e.target.value)} />
              </div>
              <div>
                <label className="label">Reading</label>
                <input className="input" type="number" min="0" max="677" placeholder="0" value={form.skorReading} onChange={(e) => handleSkorChange("skorReading", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Total Skor * <span className="text-xs text-gray-400 font-normal">(auto-hitung atau isi manual)</span></label>
              <input className="input font-bold text-lg" type="number" min="0" max="677" placeholder="0-677" value={form.totalSkor} onChange={(e) => f("totalSkor", e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-base py-3">
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses ke Blockchain...</>
            ) : (
              <>🚀 Issue Sertifikat ke Blockchain</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
