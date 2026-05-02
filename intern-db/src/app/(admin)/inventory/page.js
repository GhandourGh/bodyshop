'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InteractiveTable from '@/components/InteractiveTable';
import ModalOverlay from '@/components/ModalOverlay';
import PartForm from '@/components/forms/PartForm';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import { styles } from '@/lib/styles';

export default function InventoryPage() {
  const router = useRouter();
  const [data,          setData]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [modalType,     setModalType]     = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchData = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch('/api/parts', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(res => { if (!res.ok) throw new Error('Failed to load'); return res.json(); })
      .then(json => { if (json.success) setData(json.data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openEdit = (record) => { setEditingRecord(record); setModalType('edit_part'); };
  const closeAndRefresh = () => { setModalType(null); setEditingRecord(null); fetchData(); };

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.pageTitle}>Parts Inventory</h2>
        <div style={styles.headerActions}>
          <button style={styles.primaryBtn} onClick={() => setModalType('create_part')}>+ Add Part</button>
          <button style={styles.actionBtn} onClick={() => { localStorage.removeItem('token'); router.replace('/login'); }}>Logout</button>
        </div>
      </header>
      <div style={styles.content}>
        {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : (
          <InteractiveTable
            data={data}
            columns={['Part Name', 'Stock', 'Price']}
            rowMapper={d => [d.name || 'N/A', d.stock ?? 0, `$${(d.price || 0).toFixed(2)}`]}
            endpoint="/api/parts"
            refresh={fetchData}
            onEdit={openEdit}
          />
        )}
      </div>
      {modalType && (
        <ModalOverlay onClose={closeAndRefresh}>
          {modalType === 'create_part' && <PartForm onSuccess={closeAndRefresh} onCancel={closeAndRefresh} />}
          {modalType === 'edit_part'   && <PartForm onSuccess={closeAndRefresh} onCancel={closeAndRefresh} initialData={editingRecord} />}
        </ModalOverlay>
      )}
    </>
  );
}
