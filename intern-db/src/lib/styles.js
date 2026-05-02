// Shared design system styles — used across all dashboard components and pages

export const styles = {
  // Layout
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a', fontFamily: "'Inter', sans-serif", color: '#e5e5e5' },
  sidebar: { width: '280px', backgroundColor: '#111111', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  main: { flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },

  // Logo
  logoContainer: { padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #222' },
  logoIcon: { fontSize: '1.5rem', backgroundColor: '#222', padding: '0.5rem', borderRadius: '8px' },
  logoText: { fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: 0, letterSpacing: '-0.5px' },

  // Nav
  nav: { padding: '1.5rem 1rem', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  navSection: { fontSize: '0.75rem', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '0.75rem' },
  navItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#aaa', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  navItemActive: { backgroundColor: '#1e3a5f', color: '#93c5fd' },
  navIcon: { fontSize: '1.1rem' },

  // User profile (bottom of sidebar)
  userProfile: { padding: '1.25rem', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#0a0a0a' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '1rem' },
  userInfo: { flexGrow: 1, overflow: 'hidden' },
  userName: { fontSize: '0.9rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  userRole: { fontSize: '0.75rem', color: '#888' },
  logoutIconBtn: { background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', opacity: 0.7 },

  // Header
  header: { height: '73px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', backgroundColor: '#111' },
  pageTitle: { fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0 },
  headerActions: { display: 'flex', gap: '1rem' },

  // Content area
  content: { padding: '2rem', overflowY: 'auto', flexGrow: 1 },
  centerContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' },

  // Buttons
  primaryBtn: { padding: '0.6rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' },
  actionBtn: { padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#ddd', fontSize: '0.85rem', cursor: 'pointer' },
  dangerBtn: { padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #7f1d1d', backgroundColor: '#450a0a', color: '#fca5a5', fontSize: '0.8rem', cursor: 'pointer' },
  editBtn: { padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #064e3b', backgroundColor: '#022c22', color: '#6ee7b7', fontSize: '0.8rem', cursor: 'pointer' },
  actionBlock: { padding: '1rem', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem', cursor: 'pointer', textAlign: 'center', fontWeight: '500', transition: 'border-color 0.2s' },

  // Cards
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' },
  statCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  statTitle: { fontSize: '0.85rem', color: '#888', fontWeight: '500' },
  statValue: { fontSize: '2rem', fontWeight: '700', color: '#fff' },
  statTrend: { fontSize: '0.8rem', color: '#aaa' },
  fullWidthCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', marginTop: '0.5rem' },
  tableCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' },
  cardTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#fff', margin: '0 0 1.5rem 0' },

  // Table
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid #333', color: '#888', fontSize: '0.85rem', fontWeight: '600' },
  tr: { borderBottom: '1px solid #222' },
  td: { padding: '1rem', color: '#ddd', fontSize: '0.9rem' },

  // Activity feed
  activityList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  activityItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#1a1a1a', borderRadius: '8px' },
  activityDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' },
  activityText: { flexGrow: 1, fontSize: '0.9rem', color: '#ddd' },
  activityTime: { fontSize: '0.8rem', color: '#666' },

  // Full page states
  centerPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' },
  spinner: { width: '40px', height: '40px', border: '3px solid #222', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  errorCard: { backgroundColor: '#111', border: '1px solid #f87171', borderRadius: '12px', padding: '2rem', maxWidth: '400px', textAlign: 'center' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', width: '100%', maxWidth: '500px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
  modalClose: { position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' },
  formContent: { padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.85rem', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#fff', fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' },

  // AI Insights
  aiInsightCard: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  aiInsightHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  aiBadge: { backgroundColor: '#1e3a5f', color: '#93c5fd', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase' },
  aiConfidence: { fontSize: '0.75rem', color: '#10b981', fontWeight: '500' },
  aiInsightVehicle: { fontSize: '0.95rem', fontWeight: '600', color: '#fff' },
  aiInsightResult: { fontSize: '0.85rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
};

// Inject keyframe animation once (client-side only)
if (typeof document !== 'undefined' && !document.getElementById('spin-keyframes')) {
  const style = document.createElement('style');
  style.id = 'spin-keyframes';
  style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
