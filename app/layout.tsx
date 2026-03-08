import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mica Cabrera | Nutricionista',
  description:
    'Acompañamiento integral para mejorar tu energía, digestión y relación con la comida. Consultas online y presenciales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
