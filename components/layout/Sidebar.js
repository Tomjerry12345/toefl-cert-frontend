"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  FileStack,
  ShieldCheck,
  XCircle,
  GraduationCap,
  LogOut,
  Wallet,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/issue", label: "Issue Sertifikat", icon: FilePlus },
  { href: "/issue-batch", label: "Batch Issue", icon: FileStack },
  { href: "/verify-admin", label: "Verifikasi", icon: ShieldCheck },
  { href: "/revoke", label: "Revoke", icon: XCircle },
];

function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 text-white flex flex-col z-50"
      style={{
        background: "linear-gradient(180deg, #0a1628 0%, #0d2040 100%)",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">
              TOEFL Cert
            </p>
            <p className="text-xs text-blue-300">Verification System</p>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      {user?.walletAddress && (
        <div className="px-4 py-3 mx-3 mt-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={13} className="text-blue-400" />
            <p className="text-xs text-blue-400 font-medium">
              Wallet Terhubung
            </p>
          </div>
          <p className="text-xs font-mono text-blue-200">
            {shortAddress(user.walletAddress)}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-blue-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-blue-400">Powered by</p>
        <p className="text-xs font-semibold text-blue-200">
          Ethereum Sepolia + Merkle Tree
        </p>
      </div>
    </aside>
  );
}
