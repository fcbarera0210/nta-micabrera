import type { Metadata } from 'next';
import { Toaster } from 'sileo';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mica Cabrera | Nutricionista',
  description:
    'Acompañamiento integral para mejorar tu energía, digestión y relación con la comida. Consultas online y presenciales.',
  icons: {
    icon: [
      { url: '/svg/isotipo-1.svg', type: 'image/svg+xml' },
      { url: '/png/isotipo-1.png', type: 'image/png', sizes: '32x32' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
