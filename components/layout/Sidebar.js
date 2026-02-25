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
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/issue", label: "Issue Sertifikat", icon: FilePlus },
  // { href: "/issue-batch", label: "Batch Issue", icon: FileStack },
  { href: "/verify", label: "Verifikasi", icon: ShieldCheck },
  { href: "/revoke", label: "Revoke", icon: XCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 bg-navy-900 text-white flex flex-col z-50"
      style={{
        background: "linear-gradient(180deg, #0a1628 0%, #0d2040 100%)",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg">
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
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-900/30"
                  : "text-blue-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

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
