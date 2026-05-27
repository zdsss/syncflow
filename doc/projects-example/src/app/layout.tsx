import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '超简协同项目管理系统',
  description: '易协同项目管理系统 - 高效项目管控与协同',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
