import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zeroe Pulse AI',
  description: 'AI-powered sales intelligence platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
