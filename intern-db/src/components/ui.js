'use client';

import { styles } from '@/lib/styles';

export function StatCard({ title, value, trend, color }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statTrend}>{trend}</div>
    </div>
  );
}

export function ActivityItem({ text, time }) {
  return (
    <div style={styles.activityItem}>
      <div style={styles.activityDot} />
      <div style={styles.activityText}>{text}</div>
      <div style={styles.activityTime}>{time}</div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div style={styles.centerContainer}>
      <div style={styles.spinner} />
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <div style={styles.centerContainer}>
      <p style={{ color: '#f87171' }}>{message}</p>
    </div>
  );
}
