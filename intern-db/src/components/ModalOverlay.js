'use client';

import { styles } from '@/lib/styles';

export default function ModalOverlay({ children, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modalContent}>
        <button onClick={onClose} style={styles.modalClose}>×</button>
        {children}
      </div>
    </div>
  );
}
