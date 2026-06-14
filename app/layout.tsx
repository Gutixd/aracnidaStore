import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: {
    default: 'AracnidaStore — Trajes y Máscaras Premium',
    template: '%s | AracnidaStore',
  },
  description:
    'Trajes y máscaras de araña premium. Calidad profesional, envíos a todo Chile.',
  keywords: ['trajes spider', 'mascaras araña', 'spider-man', 'disfraces premium'],
  openGraph: {
    title: 'AracnidaStore',
    description: 'Trajes y máscaras premium inspirados en el hombre araña',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={geist.variable}>
      <body className="bg-[#0a0a0a] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
