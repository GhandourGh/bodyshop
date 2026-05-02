'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import InteractiveTable from '@/components/InteractiveTable';
import ModalOverlay from '@/components/ModalOverlay';
import AiTriggerForm from '@/components/forms/AiTriggerForm';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import { styles } from '@/lib/styles';

export default function AiPage() {
  const router = useRouter();
  const { isAdmin } = useUser();
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchData = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch('/api/ai/predictions', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(res => {
        if (res.status === 403) { router.replace('/dashboard'); return null; }
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(json => { if (json?.success) setData(json.data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin === false) { router.replace('/dashboard'); return; }
    fetchData();
  }, [isAdmin]);

  const closeAndRefresh = () => { setShowModal(false); fetchData(); };

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.pageTitle}>AI Diagnostics</h2>
        <div style={styles.headerActions}>
          <button style={styles.primaryBtn} onClick={() => setShowModal(true)}>🤖 Run Diagnostics</button>
          <button style={styles.actionBtn} onClick={() => { localStorage.removeItem('token'); router.replace('/login'); }}>Logout</button>
        </div>
      </header>
      <div style={styles.content}>
        {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : (
          <InteractiveTable
            data={data}
            columns={['Vehicle', 'Type', 'Confidence', 'Date']}
            rowMapper={d => [d.vehicle || 'N/A', d.type || 'N/A', d.confidence || 'N/A', d.created ? new Date(d.created).toLocaleDateString() : 'N/A']}
            endpoint="/api/ai/predictions"
            refresh={fetchData}
            hideActions
          />
        )}
      </div>
      {showModal && (
        <ModalOverlay onClose={closeAndRefresh}>
          <AiTriggerForm onSuccess={closeAndRefresh} onCancel={closeAndRefresh} />
        </ModalOverlay>
      )}
    </>
  );
}
