import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aracnida-store.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AracnidaStore — Disfraces y Máscaras de Spider-Man en Chile',
    template: '%s | AracnidaStore',
  },
  description:
    'Disfraces y máscaras de Spider-Man de calidad premium en Chile. Miles Morales, Tom Holland, Tobey Maguire y Venom. Tallas desde 100 a 190 cm. Envíos a todo Chile desde Santiago.',
  keywords: [
    'disfraz spiderman', 'disfraz spider-man chile', 'mascara spiderman',
    'traje hombre araña', 'disfraz miles morales', 'disfraz tom holland',
    'disfraz venom', 'spider-man chile', 'disfraces santiago', 'mascara araña',
    'disfraz spiderman niño', 'disfraz spiderman adulto', 'cosplay spiderman chile',
  ],
  authors: [{ name: 'AracnidaStore' }],
  creator: 'AracnidaStore',
  applicationName: 'AracnidaStore',
  alternates: { canonical: '/' },
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
  openGraph: {
    title: 'AracnidaStore — Disfraces y Máscaras de Spider-Man en Chile',
    description: 'Disfraces y máscaras de Spider-Man de calidad premium. Envíos a todo Chile desde Santiago.',
    url: SITE_URL,
    siteName: 'AracnidaStore',
    locale: 'es_CL',
    type: 'website',
    images: [{ url: '/logo.jpeg', width: 1024, height: 1024, alt: 'AracnidaStore' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AracnidaStore — Disfraces y Máscaras de Spider-Man',
    description: 'Disfraces y máscaras de Spider-Man premium. Envíos a todo Chile.',
    images: ['/logo.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'AracnidaStore',
  description: 'Disfraces y máscaras de Spider-Man de calidad premium en Chile.',
  url: SITE_URL,
  image: `${SITE_URL}/logo.jpeg`,
  logo: `${SITE_URL}/logo.jpeg`,
  priceRange: '$$',
  currenciesAccepted: 'CLP',
  paymentAccepted: 'Efectivo, Transferencia',
  areaServed: { '@type': 'Country', name: 'Chile' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Santiago',
    addressRegion: 'Región Metropolitana',
    addressCountry: 'CL',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={geist.variable}>
      <body className="min-h-screen antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  )
}
