/**
 * Backend root page.
 *
 * The user-facing UI is the React app at http://localhost:5173 — this Next.js
 * server only exposes the JSON API under /api/*. This minimal landing page
 * exists so a browser hitting `/` gets a friendly response instead of a 404.
 */
export const metadata = {
  title: 'AutoForge API',
  description: 'JSON API for the AutoForge bodyshop management platform.',
};

const linkStyle = {
  color: '#60a5fa',
  textDecoration: 'none',
};

const codeStyle = {
  background: '#1f2937',
  color: '#e5e7eb',
  padding: '2px 6px',
  borderRadius: 4,
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontSize: '0.9em',
};

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#e5e7eb',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <p
          style={{
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 12,
          }}
        >
          AutoForge backend
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px' }}>
          API server is running
        </h1>
        <p style={{ color: '#9ca3af', lineHeight: 1.6, marginBottom: 24 }}>
          This is the Next.js + Prisma JSON API. Endpoints live under{' '}
          <code style={codeStyle}>/api/*</code>. The user interface is the React
          app on port 5173.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2 }}>
          <li>
            UI:{' '}
            <a href="http://localhost:5173" style={linkStyle}>
              http://localhost:5173
            </a>
          </li>
          <li>
            Health:{' '}
            <a href="/api/users/me" style={linkStyle}>
              /api/users/me
            </a>
          </li>
          <li>
            Login:{' '}
            <code style={codeStyle}>POST /api/auth/login</code>
          </li>
        </ul>
      </div>
    </main>
  );
}
