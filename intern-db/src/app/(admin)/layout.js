'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { UserContext } from '@/lib/UserContext';
import { styles } from '@/lib/styles';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }

    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.replace('/login');
          return null;
        }
        return res.json();
      })
      .then(json => {
        if (!json) return;
        if (json.success) setUser(json.data);
        else setError(json.message || 'Authentication failed');
      })
      .catch(() => setError('Failed to load user data'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div style={styles.centerPage}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerPage}>
        <div style={styles.errorCard}>
          <h2 style={{ color: '#f87171', marginTop: 0 }}>Access Error</h2>
          <p style={{ color: '#ddd' }}>{error}</p>
          <button onClick={() => router.replace('/login')} style={styles.primaryBtn}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role.toLowerCase() === 'admin';

  return (
    <UserContext.Provider value={{ user, isAdmin }}>
      <div style={styles.layout}>
        <Sidebar user={user} isAdmin={isAdmin} />
        <main style={styles.main}>
          {children}
        </main>
      </div>
    </UserContext.Provider>
  );
}
