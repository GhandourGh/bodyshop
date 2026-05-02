import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Bodyshop Management System',
  description: 'Car bodyshop management backend with JWT authentication',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          fontFamily: inter.style.fontFamily,
          backgroundColor: '#0f0f0f',
        }}
      >
        {children}
      </body>
    </html>
  );
}
