'use client';

import { useState, useEffect } from 'react';
import { styles } from '@/lib/styles';

export default function VehicleForm({ onSuccess, onCancel, initialData }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    vin:        initialData?.vin    || '',
    make:       initialData?.make   || '',
    model:      initialData?.model  || '',
    year:       initialData?.year   || '',
    customerId: initialData?.ownerId || '',
  });
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    fetch('/api/customers', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      cache: 'no-store',
    })
      .then(res => res.json())
      .then(json => { if (json.success) setCustomers(json.data); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method   = isEditing ? 'PUT'  : 'POST';
    const endpoint = isEditing ? `/api/vehicles/${initialData.id}` : '/api/vehicles';
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      onSuccess();
    } catch {
      alert('Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.formContent}>
      <h3 style={{ margin: '0 0 1rem 0' }}>{isEditing ? 'Edit Vehicle' : 'Register Vehicle'}</h3>

      <input
        required
        style={styles.input}
        placeholder="VIN"
        value={formData.vin}
        onChange={e => setFormData({ ...formData, vin: e.target.value })}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          required
          style={styles.input}
          placeholder="Make"
          value={formData.make}
          onChange={e => setFormData({ ...formData, make: e.target.value })}
        />
        <input
          required
          style={styles.input}
          placeholder="Model"
          value={formData.model}
          onChange={e => setFormData({ ...formData, model: e.target.value })}
        />
      </div>
      <input
        required
        type="number"
        style={styles.input}
        placeholder="Year"
        value={formData.year}
        onChange={e => setFormData({ ...formData, year: e.target.value })}
      />
      <select
        required
        style={styles.input}
        value={formData.customerId}
        onChange={e => setFormData({ ...formData, customerId: e.target.value })}
      >
        <option value="">Select Owner (Customer)...</option>
        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <div style={styles.modalActions}>
        <button type="button" onClick={onCancel} style={styles.actionBtn}>Cancel</button>
        <button type="submit" disabled={loading} style={styles.primaryBtn}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
