'use client';

import { useRouter, usePathname } from 'next/navigation';
import { styles } from '@/lib/styles';

const menuItems = [
  { id: 'overview',  href: '/dashboard', label: 'Overview',         icon: '📊' },
  { id: 'jobs',      href: '/jobs',       label: 'Jobs & Orders',    icon: '🔧' },
  { id: 'vehicles',  href: '/vehicles',   label: 'Vehicles',         icon: '🚗' },
  { id: 'customers', href: '/customers',  label: 'Customers',        icon: '👥' },
  { id: 'mechanics', href: '/mechanics',  label: 'Mechanics',        icon: '🛠️' },
  { id: 'inventory', href: '/inventory',  label: 'Parts Inventory',  icon: '📦' },
  { id: 'ai',        href: '/ai',         label: 'AI Diagnostics',   icon: '🤖', adminOnly: true },
  { id: 'users',     href: '/users',      label: 'User Management',  icon: '🧑‍💻', adminOnly: true },
];

export default function Sidebar({ user, isAdmin }) {
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };

  // Determine active item: exact match for /dashboard, prefix match for sub-routes
  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>🏎️</div>
        <h1 style={styles.logoText}>Bodyshop OS</h1>
      </div>

      <nav style={styles.nav}>
        <div style={styles.navSection}>Main Menu</div>
        {menuItems.map(item => {
          if (item.adminOnly && !isAdmin) return null;
          const active = isActive(item.href);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={styles.userProfile}>
        <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
        <div style={styles.userInfo}>
          <div style={styles.userName}>{user?.name}</div>
          <div style={styles.userRole}>{user?.role?.toUpperCase()}</div>
        </div>
        <button onClick={handleLogout} style={styles.logoutIconBtn} title="Logout">🚪</button>
      </div>
    </aside>
  );
}
