import './globals.css'
import { Toaster } from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'

export const metadata = {
  title: 'TOEFL Certificate Verification System',
  description: 'Sistem Verifikasi Sertifikat TOEFL berbasis Blockchain Ethereum & Merkle Tree',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 bg-gray-50 min-h-screen">
            {children}
          </main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
