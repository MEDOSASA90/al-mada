import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Al-Mada — إدارة العيادات الطبية',
  description: 'SaaS platform for medical clinics in Egypt',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
