"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { loginWithMetaMask } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setStatus("signing");
    setErrorMsg("");
    try {
      await loginWithMetaMask();
      router.push("/dashboard");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err?.response?.data?.message || err?.message || "Login gagal",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#0d2040]">
      <div className="w-full max-w-md px-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg mb-4">
              <GraduationCap size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">TOEFL Cert System</h1>
            <p className="text-blue-300 text-sm mt-1">Admin Panel</p>
          </div>
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 mb-6 flex gap-3">
            <ShieldCheck size={20} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-200 text-sm">
              Login menggunakan <strong>MetaMask</strong>. Hubungkan wallet
              manapun untuk masuk.
            </p>
          </div>
          {status === "error" && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-6 flex gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{errorMsg}</p>
            </div>
          )}
          {status === "signing" && (
            <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Loader2 size={18} className="text-yellow-400 animate-spin" />
              <p className="text-yellow-200 text-sm">
                Tunggu, tanda tangani pesan di MetaMask...
              </p>
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={status === "signing"}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
          >
            {status === "signing" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Wallet size={20} />
            )}
            {status === "signing" ? "Memproses..." : "Login dengan MetaMask"}
          </button>
          <p className="text-center text-blue-400/60 text-xs mt-4">
            Belum punya MetaMask?{" "}
            <a
              href="https://metamask.io/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Download di sini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
