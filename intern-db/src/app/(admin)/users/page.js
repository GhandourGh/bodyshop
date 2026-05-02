'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import InteractiveTable from '@/components/InteractiveTable';
import ModalOverlay from '@/components/ModalOverlay';
import UserForm from '@/components/forms/UserForm';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import { styles } from '@/lib/styles';

export default function UsersPage() {
  const router = useRouter();
  const { isAdmin } = useUser();
  const [data,          setData]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [modalType,     setModalType]     = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchData = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
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

  const openEdit = (record) => { setEditingRecord(record); setModalType('edit_user'); };
  const closeAndRefresh = () => { setModalType(null); setEditingRecord(null); fetchData(); };

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.pageTitle}>User Management</h2>
        <div style={styles.headerActions}>
          <button style={styles.primaryBtn} onClick={() => setModalType('create_user')}>+ Create User</button>
          <button style={styles.actionBtn} onClick={() => { localStorage.removeItem('token'); router.replace('/login'); }}>Logout</button>
        </div>
      </header>
      <div style={styles.content}>
        {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : (
          <InteractiveTable
            data={data}
            columns={['Name', 'Email', 'Role']}
            rowMapper={d => [d.name || 'N/A', d.email || 'N/A', d.role || 'N/A']}
            endpoint="/api/users"
            refresh={fetchData}
            onEdit={openEdit}
          />
        )}
      </div>
      {modalType && (
        <ModalOverlay onClose={closeAndRefresh}>
          {modalType === 'create_user' && <UserForm onSuccess={closeAndRefresh} onCancel={closeAndRefresh} forcedRole={null} />}
          {modalType === 'edit_user'   && <UserForm onSuccess={closeAndRefresh} onCancel={closeAndRefresh} initialData={editingRecord} />}
        </ModalOverlay>
      )}
    </>
  );
}
