import type { Metadata } from 'next';
import './globals.css';
import { sanchez, notoSans, ibmPlexSans } from './fonts';

export const metadata: Metadata = {
  title: 'CleanUpGiveBack Admin',
  description: 'Admin portal — Service tracking, simplified.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sanchez.variable} ${notoSans.variable} ${ibmPlexSans.variable}`}
    >
      <body className="bg-bg-app text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
