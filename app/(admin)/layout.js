import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
