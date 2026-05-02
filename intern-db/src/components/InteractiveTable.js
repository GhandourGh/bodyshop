'use client';

import { styles } from '@/lib/styles';

/**
 * InteractiveTable
 * Props:
 *   data       – array of raw record objects
 *   columns    – array of header strings
 *   rowMapper  – fn(record) → array of cell values
 *   endpoint   – API base path for delete  (e.g. '/api/jobs')
 *   refresh    – fn() to re-fetch data after mutation
 *   onEdit     – fn(record) called when Edit is clicked
 *   hideActions – bool, hides Edit/Delete column
 */
export default function InteractiveTable({ data, columns, rowMapper, endpoint, refresh, hideActions, onEdit }) {
  const safeData = Array.isArray(data) ? data : [];

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.tableCard}>
      {safeData.length === 0 ? (
        <p style={{ color: '#666', padding: '2rem 0', textAlign: 'center' }}>No records found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {columns.map((col, i) => <th key={i} style={styles.th}>{col}</th>)}
                {!hideActions && <th style={styles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {safeData.map((rawRow, i) => {
                const row = rowMapper(rawRow);
                return (
                  <tr key={rawRow.id || i} style={styles.tr}>
                    {Array.isArray(row)
                      ? row.map((cell, j) => <td key={j} style={styles.td}>{cell}</td>)
                      : <td style={styles.td}>Invalid</td>}
                    {!hideActions && (
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => onEdit(rawRow)} style={styles.editBtn}>Edit</button>
                          <button onClick={() => handleDelete(rawRow.id)} style={styles.dangerBtn}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
