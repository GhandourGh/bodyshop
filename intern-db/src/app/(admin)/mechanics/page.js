'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InteractiveTable from '@/components/InteractiveTable';
import ModalOverlay from '@/components/ModalOverlay';
import UserForm from '@/components/forms/UserForm';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import { styles } from '@/lib/styles';

export default function MechanicsPage() {
  const router = useRouter();
  const [data,          setData]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [modalType,     setModalType]     = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchData = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch('/api/mechanics', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(res => { if (!res.ok) throw new Error('Failed to load'); return res.json(); })
      .then(json => { if (json.success) setData(json.data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openEdit = (record) => { setEditingRecord(record); setModalType('edit_mechanic'); };
  const closeAndRefresh = () => { setModalType(null); setEditingRecord(null); fetchData(); };

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.pageTitle}>Mechanics</h2>
        <div style={styles.headerActions}>
          <button style={styles.actionBtn} onClick={() => { localStorage.removeItem('token'); router.replace('/login'); }}>Logout</button>
        </div>
      </header>
      <div style={styles.content}>
        {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : (
          <InteractiveTable
            data={data}
            columns={['Name', 'Skill Level', 'Workload']}
            rowMapper={d => [d.name || 'N/A', `Level ${d.skillLevel || 1}`, `${d.workload || 0} active jobs`]}
            endpoint="/api/mechanics"
            refresh={fetchData}
            onEdit={openEdit}
          />
        )}
      </div>
      {modalType && (
        <ModalOverlay onClose={closeAndRefresh}>
          {modalType === 'edit_mechanic' && <UserForm onSuccess={closeAndRefresh} onCancel={closeAndRefresh} initialData={editingRecord} />}
        </ModalOverlay>
      )}
    </>
  );
}
