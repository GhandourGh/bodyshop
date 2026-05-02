'use client';

import { useState } from 'react';
import { styles } from '@/lib/styles';

export default function PartForm({ onSuccess, onCancel, initialData }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    name:  initialData?.name  || '',
    stock: initialData?.stock !== undefined ? initialData.stock : '',
    price: initialData?.price !== undefined ? initialData.price : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method   = isEditing ? 'PUT'  : 'POST';
    const endpoint = isEditing ? `/api/parts/${initialData.id}` : '/api/parts';
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      onSuccess();
    } catch {
      alert('Failed to save part');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.formContent}>
      <h3 style={{ margin: '0 0 1rem 0' }}>{isEditing ? 'Edit Inventory Part' : 'Add Inventory Part'}</h3>

      <input
        required
        style={styles.input}
        placeholder="Part Name"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        required
        type="number"
        style={styles.input}
        placeholder="Stock Quantity"
        value={formData.stock}
        onChange={e => setFormData({ ...formData, stock: e.target.value })}
      />
      <input
        required
        type="number"
        step="0.01"
        style={styles.input}
        placeholder="Unit Price ($)"
        value={formData.price}
        onChange={e => setFormData({ ...formData, price: e.target.value })}
      />

      <div style={styles.modalActions}>
        <button type="button" onClick={onCancel} style={styles.actionBtn}>Cancel</button>
        <button type="submit" disabled={loading} style={styles.primaryBtn}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
