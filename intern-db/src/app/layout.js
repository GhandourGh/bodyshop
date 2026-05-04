/**
 * Required Next.js root layout for the API server.
 * The frontend is served by Vite from a separate process — see autoforge-frontend/.
 */
export const metadata = {
  title: 'AutoForge API',
  description: 'AutoForge bodyshop management JSON API.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          backgroundColor: '#0f0f0f',
        }}
      >
        {children}
      </body>
    </html>
  );
}
