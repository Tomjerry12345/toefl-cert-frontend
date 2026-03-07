import Sidebar from "@/components/layout/Sidebar";
import Link from "next/link";

export default function VerifyLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 bg-blue-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight">
                TOEFL Cert
              </p>
              <p className="text-xs text-blue-200">Verification System</p>
            </div>
          </div>

          {/* Tombol Login Admin */}
          <Link
            href="/login"
            className="text-xs font-medium text-blue-100 hover:text-white border border-blue-400 hover:border-white px-4 py-2 rounded-lg transition-all"
          >
            Login Admin
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        Powered by Ethereum Sepolia + Merkle Tree
      </footer>
    </div>
  );
}
