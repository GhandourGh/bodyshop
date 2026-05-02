'use client';

import { useState, useEffect } from 'react';
import { styles } from '@/lib/styles';

export default function JobForm({ onSuccess, onCancel, initialData }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    customerId:    initialData?.customer_id              || '',
    vehicleId:     initialData?.vehicle_id               || '',
    mechanicId:    initialData?.assigned_mechanic_id     || '',
    estimatedCost: initialData?.estimatedCost !== undefined ? initialData.estimatedCost : '',
    status:        initialData?.status || 'pending',
  });
  const [data,    setData]    = useState({ customers: [], vehicles: [], mechanics: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const token   = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const cache   = 'no-store';
      const [cRes, vRes, mRes] = await Promise.all([
        fetch('/api/customers', { headers, cache }).then(r => r.json()),
        fetch('/api/vehicles',  { headers, cache }).then(r => r.json()),
        fetch('/api/mechanics', { headers, cache }).then(r => r.json()),
      ]);
      setData({
        customers: cRes.success ? cRes.data : [],
        vehicles:  vRes.success ? vRes.data : [],
        mechanics: mRes.success ? mRes.data : [],
      });
    };
    fetchAll();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method   = isEditing ? 'PUT'  : 'POST';
    const endpoint = isEditing ? `/api/jobs/${initialData.id}` : '/api/jobs';
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      onSuccess();
    } catch {
      alert('Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = formData.customerId
    ? data.vehicles.filter(v => v.ownerId === formData.customerId)
    : data.vehicles;

  return (
    <form onSubmit={handleSubmit} style={styles.formContent}>
      <h3 style={{ margin: '0 0 1rem 0' }}>{isEditing ? 'Edit Job' : 'Create New Job'}</h3>

      <select
        required
        style={styles.input}
        value={formData.customerId}
        onChange={e => setFormData({ ...formData, customerId: e.target.value, vehicleId: '' })}
      >
        <option value="">Select Customer...</option>
        {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select
        required
        style={styles.input}
        value={formData.vehicleId}
        onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
      >
        <option value="">Select Vehicle...</option>
        {filteredVehicles.map(v => (
          <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year})</option>
        ))}
      </select>

      <select
        required
        style={styles.input}
        value={formData.mechanicId}
        onChange={e => setFormData({ ...formData, mechanicId: e.target.value })}
      >
        <option value="">Assign Mechanic...</option>
        {data.mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          required
          type="number"
          step="0.01"
          style={styles.input}
          placeholder="Estimated Cost ($)"
          value={formData.estimatedCost}
          onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })}
        />
        <select
          required
          style={styles.input}
          value={formData.status}
          onChange={e => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div style={styles.modalActions}>
        <button type="button" onClick={onCancel} style={styles.actionBtn}>Cancel</button>
        <button type="submit" disabled={loading} style={styles.primaryBtn}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
