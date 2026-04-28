"use client";
import { useState, useEffect, useRef } from "react";
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/api";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Edit3,
  Eye,
  X,
  Layout,
  CheckCircle,
  FileDown,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────
const FIELDS = [
  { key: "{{nomorSurat}}", label: "No. Surat / Dokumen", color: "#5F5E5A" },
  { key: "{{holderName}}", label: "Nama", color: "#378ADD" },
  { key: "{{nim}}", label: "NIM", color: "#639922" },
  { key: "{{lokasi}}", label: "Lokasi Pelatihan", color: "#BA7517" },
  { key: "{{waktuMulai}}", label: "Waktu Mulai", color: "#993556" },
  { key: "{{waktuSelesai}}", label: "Waktu Selesai", color: "#993556" },
  { key: "{{skorListening}}", label: "Skor Listening", color: "#D85A30" },
  { key: "{{skorStructure}}", label: "Skor Structure", color: "#D85A30" },
  { key: "{{skorReading}}", label: "Skor Reading", color: "#D85A30" },
  { key: "{{totalSkor}}", label: "Total Skor", color: "#185FA5" },
  { key: "{{institution}}", label: "Institusi", color: "#534AB7" },
  { key: "{{certId}}", label: "Cert ID", color: "#888888" },
  { key: "{{qrCode}}", label: "QR Code", color: "#185FA5" },
];
const SAMPLE = {
  "{{nomorSurat}}": "001/TOEFL/UIN/2025",
  "{{holderName}}": "Ahmad Fauzi",
  "{{nim}}": "60900119001",
  "{{lokasi}}": "Makassar, Sulawesi Selatan",
  "{{waktuMulai}}": "10 Januari 2025",
  "{{waktuSelesai}}": "15 Januari 2025",
  "{{skorListening}}": "47",
  "{{skorStructure}}": "47",
  "{{skorReading}}": "51",
  "{{totalSkor}}": "550",
  "{{institution}}": "UIN Alauddin Makassar",
  "{{certId}}": "TOEFL-ABCD1234",
  "{{qrCode}}":
    "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TOEFL-ABCD1234",
};

// ─── Visual Editor ─────────────────────────────────────────────
function VisualEditor({ template, onClose, onSaved }) {
  const canvasRef = useRef(null);
  const [els, setEls] = useState([]);
  const [sel, setSel] = useState(null);
  const [zoom, setZoom] = useState(0.55);
  const [cW, setCW] = useState(794);
  const [cH, setCH] = useState(1123);
  const [bgUrl, setBgUrl] = useState(template?.backgroundImageUrl || null);
  const [bgFile, setBgFile] = useState(null);
  const [prevMode, setPrevMode] = useState(false);
  const [tplName, setTplName] = useState(template?.name || "");
  const [tplDesc, setTplDesc] = useState(template?.description || "");
  const [tab, setTab] = useState("fields");
  const [saving, setSaving] = useState(false);
  const nid = useRef(1);
  const drag = useRef(null);
  const resize = useRef(null);
  const doff = useRef({ x: 0, y: 0 });
  const rstart = useRef({});

  useEffect(() => {
    if (template?.htmlTemplate) {
      loadFromHTML(template.htmlTemplate);
    } else {
      // addDefaults();
    }
  }, []);

  function loadFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const styleTag = doc.querySelector("style");
    const styleText = styleTag?.textContent || "";
    const loaded = [];

    doc.querySelectorAll("body > div[id], body > img[id]").forEach((el) => {
      const id = el.id;
      const numId = parseInt(id.replace("e", ""));
      const isQR = el.tagName === "IMG";

      const regex = new RegExp(`#${id}\\s*\\{([^}]+)\\}`);
      const match = styleText.match(regex);
      const cssText = match?.[1] || "";

      function getCss(prop) {
        const m = cssText.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`));
        return m?.[1]?.trim() || null;
      }

      let left, top, width;
      if (isQR) {
        // QR pakai inline style
        left = parseFloat(el.style.left) || 0;
        top = parseFloat(el.style.top) || 0;
        width = parseFloat(el.style.width) || 100;
      } else {
        left = parseFloat(getCss("left")) || 0;
        top = parseFloat(getCss("top")) || 0;
        width = parseFloat(getCss("width")) || 200;
      }

      const fontSize = parseFloat(getCss("font-size")) || 16;
      const color = getCss("color") || "#1a1a1a";
      const fontFamily =
        getCss("font-family")?.replace(/['"]/g, "").split(",")[0].trim() ||
        "Times New Roman";
      const fontWeight = getCss("font-weight") || "normal";
      const fontStyle = getCss("font-style") || "normal";
      const textDecoration = getCss("text-decoration") || "none";
      const textAlign = getCss("text-align") || "left";
      const bg = getCss("background") || null;
      const padding = parseFloat(getCss("padding")) || 0;

      // Deteksi posSnap terpisah untuk QR dan div
      let posSnap = null;
      const fullWidth = !isQR && width >= cW - 10;

      if (isQR) {
        // QR: deteksi dari posisi X relatif terhadap canvas
        if (left <= 5) posSnap = "left";
        else if (Math.abs(left - (cW - width)) <= 10) posSnap = "right";
        else if (Math.abs(left - (cW - width) / 2) <= 10) posSnap = "center";
        else posSnap = null; // posisi bebas
      } else {
        if (fullWidth || left <= 5) {
          if (textAlign === "center") posSnap = "center";
          else if (textAlign === "right") posSnap = "right";
          else posSnap = "left";
        }
      }

      const elObj = {
        id: numId,
        text: isQR ? "{{qrCode}}" : el.textContent?.trim() || "",
        x: left,
        y: top,
        w: width,
        size: fontSize,
        font: fontFamily,
        color,
        bold: fontWeight === "bold",
        italic: fontStyle === "italic",
        underline: textDecoration === "underline",
        align: textAlign,
        bg: bg && bg !== "transparent" ? bg : null,
        pad: padding,
        isQR,
        posSnap,
        fullWidth,
      };

      loaded.push(elObj);
      if (numId >= nid.current) nid.current = numId + 1;
    });

    if (loaded.length > 0) {
      setEls(loaded);
    } else {
      addDefaults();
    }
  }

  function mkEl(o = {}) {
    return {
      id: nid.current++,
      text: o.text || "Teks",
      x: o.x ?? 100,
      y: o.y ?? 100,
      w: o.w ?? 200,
      size: o.size ?? 18,
      font: o.font || "Times New Roman",
      color: o.color || "#1a1a1a",
      bold: !!o.bold,
      italic: !!o.italic,
      underline: !!o.underline,
      align: o.align || "left",
      bg: o.bg || null,
      pad: o.pad || 0,
      isQR: !!o.isQR,
      posSnap: o.posSnap || null,
      fullWidth: !!o.fullWidth,
    };
  }

  function addDefaults() {
    const defaults = [
      {
        text: "{{institution}}",
        x: 0,
        y: 70,
        w: 794,
        size: 15,
        font: "Times New Roman",
        color: "#1a3a6e",
        bold: true,
        align: "center",
        posSnap: "center",
        fullWidth: true,
      },
      {
        text: "CERTIFICATE",
        x: 0,
        y: 148,
        w: 794,
        size: 52,
        font: "Times New Roman",
        color: "#c8a84b",
        bold: true,
        align: "center",
        posSnap: "center",
        fullWidth: true,
      },
      {
        text: "OF ACHIEVEMENT",
        x: 0,
        y: 212,
        w: 794,
        size: 13,
        font: "Times New Roman",
        color: "#666666",
        align: "center",
        posSnap: "center",
        fullWidth: true,
      },
      {
        text: "This certificate is proudly presented to",
        x: 0,
        y: 308,
        w: 794,
        size: 13,
        font: "Times New Roman",
        color: "#888888",
        align: "center",
        posSnap: "center",
        fullWidth: true,
      },
      {
        text: "{{holderName}}",
        x: 0,
        y: 348,
        w: 794,
        size: 40,
        font: "Times New Roman",
        color: "#1a3a6e",
        bold: true,
        italic: true,
        align: "center",
        posSnap: "center",
        fullWidth: true,
      },
      {
        text: "NIM: {{nim}}",
        x: 0,
        y: 400,
        w: 794,
        size: 14,
        font: "Times New Roman",
        color: "#555555",
        align: "center",
        posSnap: "center",
        fullWidth: true,
      },
      {
        text: "TOTAL SCORE",
        x: 297,
        y: 468,
        w: 200,
        size: 11,
        font: "Times New Roman",
        color: "#ffffff",
        align: "center",
        bg: "#1a3a6e",
        pad: 6,
        posSnap: "center",
      },
      {
        text: "{{score}}",
        x: 297,
        y: 490,
        w: 200,
        size: 38,
        font: "Times New Roman",
        color: "#ffffff",
        bold: true,
        align: "center",
        bg: "#1a3a6e",
        pad: 12,
        posSnap: "center",
      },
      {
        text: "Test Date: {{testDate}}",
        x: 0,
        y: 598,
        w: 794,
        size: 12,
        font: "Times New Roman",
        color: "#555555",
        align: "center",
        posSnap: "center",
        fullWidth: true,
      },
      {
        text: "Valid Until: {{expiryDate}}",
        x: 0,
        y: 620,
        w: 794,
        size: 12,
        font: "Times New Roman",
        color: "#555555",
        align: "center",
        posSnap: "center",
        fullWidth: true,
      },
      {
        text: "Cert ID: {{certId}}",
        x: 30,
        y: 1075,
        w: 220,
        size: 10,
        font: "Courier New",
        color: "#aaaaaa",
        align: "left",
        posSnap: "left",
      },
    ];
    setEls(defaults.map(mkEl));
  }

  function getElX(e) {
    const ew = e.fullWidth ? cW : e.w || 200;
    if (e.posSnap === "center") return (cW - ew) / 2;
    if (e.posSnap === "right") return cW - ew;
    if (e.posSnap === "left") return 0;
    return e.x;
  }

  function getPreview(text) {
    let t = text;
    Object.keys(SAMPLE).forEach((k) => {
      t = t.replaceAll(k, SAMPLE[k]);
    });
    return t;
  }

  function snapPos(p) {
    if (!sel) return;
    const ew = sel.fullWidth ? cW : sel.w || 200;
    const updated = { ...sel };
    if (p === "left") {
      updated.posSnap = "left";
      updated.x = 0;
    } else if (p === "center") {
      updated.posSnap = "center";
      updated.x = (cW - ew) / 2;
    } else if (p === "right") {
      updated.posSnap = "right";
      updated.x = cW - ew;
    } else if (p === "top") {
      updated.y = 10;
    } else if (p === "middle") {
      updated.y = Math.round((cH - sel.size) / 2);
    } else if (p === "bottom") {
      updated.y = cH - sel.size - 20;
    }
    setSel(updated);
    setEls((prev) => prev.map((e) => (e.id === sel.id ? updated : e)));
  }

  function toggleFullWidth() {
    if (!sel) return;
    const updated = { ...sel, fullWidth: !sel.fullWidth };
    if (updated.fullWidth) {
      updated.w = cW;
      updated.posSnap = "center";
      updated.x = 0;
    }
    setSel(updated);
    setEls((prev) => prev.map((e) => (e.id === sel.id ? updated : e)));
  }

  function updateProp(k, v) {
    if (!sel) return;
    const updated = { ...sel, [k]: v };
    setSel(updated);
    setEls((prev) => prev.map((e) => (e.id === sel.id ? updated : e)));
  }

  function toggleStyle(s) {
    if (!sel) return;
    const updated = { ...sel, [s]: !sel[s] };
    setSel(updated);
    setEls((prev) => prev.map((e) => (e.id === sel.id ? updated : e)));
  }

  function addField(f) {
    // Cek apakah field ini sudah ada di kanvas
    const existing = els.find((e) => e.text === f.key);
    if (existing) {
      // Kalau sudah ada, select saja
      setSel(existing);
      setTab("props");
      return;
    }

    // Kalau belum ada, baru tambah
    const newEl = mkEl({
      text: f.key,
      x: 0,
      y: cH / 2,
      w: f.key === "{{qrCode}}" ? 100 : cW,
      size: 20,
      color: f.color,
      align: f.key === "{{qrCode}}" ? "left" : "center",
      posSnap: f.key === "{{qrCode}}" ? null : "center",
      fullWidth: f.key !== "{{qrCode}}",
      isQR: f.key === "{{qrCode}}",
    });
    setEls((prev) => [...prev, newEl]);
    setSel(newEl);
    setTab("props");
  }

  function addFreeText() {
    const newEl = mkEl({
      text: "Teks bebas",
      x: cW / 2 - 80,
      y: cH / 2,
      w: 160,
      size: 18,
      align: "center",
    });
    setEls((prev) => [...prev, newEl]);
    setSel(newEl);
    setTab("props");
  }

  function deleteEl() {
    if (!sel) return;
    setEls((prev) => prev.filter((e) => e.id !== sel.id));
    setSel(null);
  }

  function generateHTML() {
    let styles = "";
    els.forEach((e) => {
      const ew = e.fullWidth ? cW : e.w || 200;
      const ex = getElX(e);
      styles += `  #e${e.id}{position:absolute;left:${Math.round(ex)}px;top:${Math.round(e.y)}px;width:${Math.round(ew)}px;font-family:'${e.font}',serif;font-size:${e.size}px;color:${e.color};font-weight:${e.bold ? "bold" : "normal"};font-style:${e.italic ? "italic" : "normal"};text-decoration:${e.underline ? "underline" : "none"};text-align:${e.align};${e.bg ? `background:${e.bg};padding:${e.pad}px;border-radius:8px;` : ""}line-height:1.2;}\n`;
    });
    let body = "";
    els.forEach((e) => {
      if (e.isQR)
        body += `  <img id="e${e.id}" src="{{qrCode}}" alt="QR" style="position:absolute;left:${Math.round(getElX(e))}px;top:${Math.round(e.y)}px;width:${e.w || 100}px;height:${e.w || 100}px">\n`;
      else body += `  <div id="e${e.id}">${e.text}</div>\n`;
    });
    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>${tplName || "Sertifikat"}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:${cW}px;height:${cH}px;position:relative;overflow:hidden;background:white;${bgUrl ? `background-image:url('{{backgroundImageUrl}}');background-size:cover;background-position:center;` : ""}}
${styles}</style></head>
<body>
${body}</body></html>`;
  }

  async function handleSave() {
    if (!tplName.trim()) return toast.error("Nama template wajib diisi");
    if (els.length === 0) return toast.error("Tambahkan minimal 1 elemen");
    setSaving(true);
    try {
      const html = generateHTML();
      const fd = new FormData();
      fd.append("name", tplName);
      fd.append("description", tplDesc);
      fd.append("htmlTemplate", html);
      if (bgFile) fd.append("backgroundImage", bgFile);

      if (template?._id) {
        await updateTemplate(template._id, fd);
        toast.success("Template berhasil diperbarui!");
      } else {
        await createTemplate(fd);
        toast.success("Template berhasil disimpan!");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  // Drag logic via event delegation on canvas
  function onCanvasMouseDown(ev) {
    if (ev.target === canvasRef.current) {
      setSel(null);
      return;
    }
  }

  useEffect(() => {
    function onMove(ev) {
      if (drag.current) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nx = Math.max(
          0,
          Math.min(cW - 20, (ev.clientX - rect.left) / zoom - doff.current.x),
        );
        const ny = Math.max(
          0,
          Math.min(cH - 20, (ev.clientY - rect.top) / zoom - doff.current.y),
        );
        setEls((prev) =>
          prev.map((e) =>
            e.id === drag.current.id
              ? { ...e, x: nx, y: ny, posSnap: null }
              : e,
          ),
        );
        setSel((prev) =>
          prev?.id === drag.current.id
            ? { ...prev, x: nx, y: ny, posSnap: null }
            : prev,
        );
      }
      if (resize.current) {
        const dx = (ev.clientX - rstart.current.mx) / zoom;
        const dy = (ev.clientY - rstart.current.my) / zoom;
        const nw = Math.max(40, Math.round(rstart.current.w + dx));
        const nsz = Math.max(6, Math.round(rstart.current.sz + dy * 0.3));
        setEls((prev) =>
          prev.map((e) =>
            e.id === resize.current.id ? { ...e, w: nw, size: nsz } : e,
          ),
        );
        setSel((prev) =>
          prev?.id === resize.current.id ? { ...prev, w: nw, size: nsz } : prev,
        );
      }
    }
    function onUp() {
      drag.current = null;
      resize.current = null;
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [zoom, cW, cH]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <input
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="Nama Template..."
              className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400 w-52"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrevMode((p) => !p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${prevMode ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:text-white"}`}
          >
            {prevMode ? "✏️ Edit" : "👁 Preview"}
          </button>
          <select
            value={`${cW},${cH}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split(",").map(Number);
              setCW(w);
              setCH(h);
            }}
            className="bg-gray-700 text-gray-300 text-xs px-2 py-1.5 rounded-lg border border-gray-600"
          >
            <option value="794,1123">A4 Portrait</option>
            <option value="1123,794">A4 Landscape</option>
          </select>
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            className="bg-gray-700 text-gray-300 hover:text-white w-7 h-7 rounded-lg text-sm font-bold"
          >
            −
          </button>
          <span className="text-gray-400 text-xs w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            className="bg-gray-700 text-gray-300 hover:text-white w-7 h-7 rounded-lg text-sm font-bold"
          >
            +
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg disabled:opacity-60 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Menyimpan...
              </>
            ) : (
              "💾 Simpan Template"
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-56 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-700">
            {["fields", "props"].map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-medium transition-all ${tab === t ? "bg-gray-700 text-white border-b-2 border-blue-400" : "text-gray-400 hover:text-white"}`}
              >
                {["Fields", "Properti"][i]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {tab === "fields" && (
              <>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                  Field Sertifikat
                </p>
                {FIELDS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => addField(f)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-left mb-1.5 transition-all group"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: f.color }}
                    />
                    <span className="text-white text-xs font-medium">
                      {f.label}
                    </span>
                    <span className="text-gray-500 text-xs ml-auto group-hover:text-gray-300 font-mono hidden group-hover:block truncate">
                      {f.key}
                    </span>
                  </button>
                ))}
                <p className="text-gray-500 text-xs uppercase tracking-wider mt-4 mb-2">
                  Teks Bebas
                </p>
                <button
                  onClick={addFreeText}
                  className="w-full py-2 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
                >
                  + Tambah Teks
                </button>
                <p className="text-gray-500 text-xs uppercase tracking-wider mt-4 mb-2">
                  Background
                </p>
                <label className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer text-gray-300 hover:text-white text-xs mb-1.5 transition-all">
                  🖼 Upload Gambar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (!f) return;
                      setBgFile(f);
                      setBgUrl(URL.createObjectURL(f));
                    }}
                  />
                </label>
                {bgUrl && (
                  <button
                    onClick={() => {
                      setBgUrl(null);
                      setBgFile(null);
                    }}
                    className="w-full py-1.5 text-xs text-red-400 hover:text-red-300 bg-gray-700 rounded-lg"
                  >
                    Hapus Background
                  </button>
                )}
              </>
            )}

            {tab === "props" && (
              <>
                {!sel ? (
                  <p className="text-gray-500 text-xs text-center mt-8 leading-relaxed">
                    Klik elemen di kanvas untuk mengatur propertinya
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">
                        Teks / Placeholder
                      </p>
                      <input
                        className="w-full bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400"
                        value={sel.text}
                        onChange={(e) => updateProp("text", e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Font</p>
                      <select
                        className="w-full bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400"
                        value={sel.font}
                        onChange={(e) => updateProp("font", e.target.value)}
                      >
                        {[
                          "Times New Roman",
                          "Arial",
                          "Georgia",
                          "Verdana",
                          "Courier New",
                          "Trebuchet MS",
                          "Palatino Linotype",
                          "Garamond",
                        ].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Ukuran</p>
                        <input
                          type="number"
                          min="6"
                          max="120"
                          className="w-full bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400"
                          value={sel.size}
                          onChange={(e) => updateProp("size", +e.target.value)}
                        />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Warna</p>
                        <input
                          type="color"
                          className="w-full h-[30px] bg-gray-700 rounded-lg border border-gray-600 cursor-pointer p-0.5"
                          value={sel.color}
                          onChange={(e) => updateProp("color", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Style</p>
                      <div className="flex gap-1.5">
                        {[
                          ["bold", "B"],
                          ["italic", "I"],
                          ["underline", "U"],
                        ].map(([s, l]) => (
                          <button
                            key={s}
                            onClick={() => toggleStyle(s)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${sel[s] ? "bg-blue-600 text-white border-blue-500" : "bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400"}`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Text Align</p>
                      <div className="flex gap-1.5">
                        {[
                          ["left", "≡L"],
                          ["center", "≡C"],
                          ["right", "≡R"],
                        ].map(([a, l]) => (
                          <button
                            key={a}
                            onClick={() => updateProp("align", a)}
                            className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${sel.align === a ? "bg-blue-600 text-white border-blue-500" : "bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400"}`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">
                        Posisi Horizontal
                      </p>
                      <div className="flex gap-1.5">
                        {[
                          ["left", "◀ Kiri"],
                          ["center", "● Center"],
                          ["right", "▶ Kanan"],
                        ].map(([p, l]) => (
                          <button
                            key={p}
                            onClick={() => snapPos(p)}
                            className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${sel.posSnap === p ? "bg-blue-600 text-white border-blue-500" : "bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400"}`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">
                        Posisi Vertikal
                      </p>
                      <div className="flex gap-1.5">
                        {[
                          ["top", "▲ Atas"],
                          ["middle", "● Tengah"],
                          ["bottom", "▼ Bawah"],
                        ].map(([p, l]) => (
                          <button
                            key={p}
                            onClick={() => snapPos(p)}
                            className="flex-1 py-1.5 text-xs rounded-lg border bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400 hover:text-white transition-all"
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Lebar Elemen</p>
                      <button
                        onClick={toggleFullWidth}
                        className={`w-full py-1.5 text-xs rounded-lg border mb-1.5 transition-all ${sel.fullWidth ? "bg-green-700 text-white border-green-600" : "bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400"}`}
                      >
                        ↔ Full Width
                      </button>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400"
                        placeholder="Lebar (px)"
                        value={sel.w || ""}
                        onChange={(e) => updateProp("w", +e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">X (px)</p>
                        <input
                          type="number"
                          className="w-full bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400"
                          value={Math.round(sel.x)}
                          onChange={(e) => updateProp("x", +e.target.value)}
                        />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Y (px)</p>
                        <input
                          type="number"
                          className="w-full bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400"
                          value={Math.round(sel.y)}
                          onChange={(e) => updateProp("y", +e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">
                        Background Box
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="h-[30px] w-12 bg-gray-700 rounded-lg border border-gray-600 cursor-pointer p-0.5"
                          value={sel.bg || "#ffffff"}
                          onChange={(e) => updateProp("bg", e.target.value)}
                        />
                        <button
                          onClick={() => updateProp("bg", null)}
                          className="flex-1 py-1.5 text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded-lg hover:border-gray-400"
                        >
                          Hapus BG
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">
                          Padding Box
                        </p>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400"
                          value={sel.pad || 0}
                          onChange={(e) => updateProp("pad", +e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      onClick={deleteEl}
                      className="w-full py-2 text-xs bg-red-900 text-red-300 hover:bg-red-800 rounded-lg border border-red-800 transition-all mt-2"
                    >
                      🗑 Hapus Elemen
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div
          className="flex-1 overflow-auto flex items-start justify-center p-8 bg-gray-900"
          onMouseDown={onCanvasMouseDown}
        >
          <div
            ref={canvasRef}
            style={{
              width: Math.round(cW * zoom),
              height: Math.round(cH * zoom),
              position: "relative",
              background: "#fff",
              flexShrink: 0,
              boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
              backgroundImage: bgUrl ? `url(${bgUrl})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onMouseDown={onCanvasMouseDown}
          >
            {els.map((e) => {
              const ew = e.fullWidth ? cW : e.w || 200;
              const ex =
                e.posSnap === "center"
                  ? (cW - ew) / 2
                  : e.posSnap === "right"
                    ? cW - ew
                    : e.posSnap === "left"
                      ? 0
                      : e.x;
              return (
                <div
                  key={e.id}
                  style={{
                    position: "absolute",
                    left: Math.round(ex * zoom),
                    top: Math.round(e.y * zoom),
                    width: Math.round(ew * zoom),
                    fontSize: Math.round(e.size * zoom),
                    fontFamily: e.font,
                    color: e.color,
                    fontWeight: e.bold ? "bold" : "normal",
                    fontStyle: e.italic ? "italic" : "normal",
                    textDecoration: e.underline ? "underline" : "none",
                    textAlign: e.align,
                    background: e.bg || "transparent",
                    padding: e.bg ? Math.round(e.pad * zoom) : "2px 4px",
                    borderRadius: e.bg ? 6 : 0,
                    lineHeight: 1.2,
                    cursor: "move",
                    userSelect: "none",
                    border:
                      sel?.id === e.id
                        ? "1.5px solid #378ADD"
                        : "1.5px dashed transparent",
                    boxSizing: "border-box",
                    minHeight: 16,
                  }}
                  onMouseDown={(ev) => {
                    if (ev.target.classList.contains("rh")) return;
                    setSel(e);
                    setTab("props");
                    const rect = canvasRef.current.getBoundingClientRect();
                    drag.current = e;
                    doff.current = {
                      x: (ev.clientX - rect.left) / zoom - ex,
                      y: (ev.clientY - rect.top) / zoom - e.y,
                    };
                    ev.stopPropagation();
                  }}
                >
                  {e.isQR ? (
                    <img
                      src={SAMPLE["{{qrCode}}"]}
                      alt="QR"
                      style={{
                        width: Math.round(80 * zoom),
                        height: Math.round(80 * zoom),
                      }}
                    />
                  ) : (
                    <span style={{ width: "100%", display: "block" }}>
                      {prevMode ? getPreview(e.text) : e.text}
                    </span>
                  )}
                  {sel?.id === e.id && (
                    <div
                      className="rh"
                      style={{
                        position: "absolute",
                        right: -5,
                        bottom: -5,
                        width: 10,
                        height: 10,
                        background: "#378ADD",
                        borderRadius: "50%",
                        cursor: "se-resize",
                      }}
                      onMouseDown={(ev) => {
                        resize.current = e;
                        rstart.current = {
                          mx: ev.clientX,
                          my: ev.clientY,
                          w: e.w || 200,
                          sz: e.size,
                        };
                        ev.stopPropagation();
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Templates Page ───────────────────────────────────────
export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [previewTpl, setPreviewTpl] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getAllTemplates();
      setTemplates(res.data.data);
    } catch {
      toast.error("Gagal memuat template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus template "${name}"?`)) return;
    try {
      await deleteTemplate(id);
      toast.success("Template dihapus");
      fetch();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  function previewInject(html, bgUrl) {
    let out = html;
    if (bgUrl) {
      out = out.replace("{{backgroundImageUrl}}", bgUrl);
      out = out
        .replace(/\{\{#if backgroundImageUrl\}\}/g, "")
        .replace(/\{\{\/if\}\}/g, "");
    } else {
      out = out.replace(
        /\{\{#if backgroundImageUrl\}\}[\s\S]*?\{\{\/if\}\}/g,
        "",
      );
    }
    Object.entries(SAMPLE).forEach(([k, v]) => {
      out = out.replaceAll(k, v);
    });
    return out;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Template Sertifikat
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Desain visual sertifikat dengan drag & drop editor
          </p>
        </div>
        <button
          onClick={() => {
            setEditTarget(null);
            setEditorOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} /> Buat Template
        </button>
      </div>

      <div className="card bg-blue-50 border border-blue-100 mb-6">
        <p className="text-sm text-blue-800">
          <strong>💡 Visual Editor:</strong> Drag & drop field ke posisi yang
          diinginkan. Gunakan snap kiri/center/kanan untuk alignment otomatis.
          Template yang dibuat bisa digunakan di Issue Sertifikat dan Batch
          Issue untuk generate PDF otomatis.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card text-center py-16">
          <Layout size={40} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-500 mb-2">
            Belum ada template
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Buat template pertama dengan visual editor drag & drop
          </p>
          <button
            onClick={() => {
              setEditTarget(null);
              setEditorOpen(true);
            }}
            className="btn-primary mx-auto"
          >
            <Plus size={16} /> Buat Template Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div
              key={t._id}
              className="card hover:shadow-md transition-all group"
            >
              <div className="w-full h-36 rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                {t.backgroundImageUrl ? (
                  <img
                    src={t.backgroundImageUrl}
                    alt="bg"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Layout size={32} className="text-blue-200 mx-auto mb-1" />
                    <p className="text-xs text-blue-300">HTML Template</p>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{t.name}</h3>
              {t.description && (
                <p className="text-xs text-gray-500 mb-3">{t.description}</p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className="badge-valid">
                  <CheckCircle size={11} /> Aktif
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(t.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewTpl(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium transition-all border border-gray-100"
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  onClick={() => {
                    setEditTarget(t);
                    setEditorOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-all border border-blue-100"
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(t._id, t.name)}
                  className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs transition-all border border-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                Preview: {previewTpl.name}
              </h2>
              <button
                onClick={() => setPreviewTpl(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-4" style={{ height: "70vh" }}>
              <iframe
                title="preview"
                className="w-full h-full rounded-xl border border-gray-100"
                srcDoc={previewInject(
                  previewTpl.htmlTemplate,
                  previewTpl.backgroundImageUrl,
                )}
                sandbox="allow-same-origin"
              />
            </div>
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Data yang ditampilkan adalah data contoh
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPreviewTpl(null);
                    setEditTarget(previewTpl);
                    setEditorOpen(true);
                  }}
                  className="btn-secondary text-sm"
                >
                  <Edit3 size={14} /> Edit Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Editor fullscreen */}
      {editorOpen && (
        <VisualEditor
          template={editTarget}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            fetch();
          }}
        />
      )}
    </div>
  );
}
