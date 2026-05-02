'use client';

import { useState } from 'react';
import { styles } from '@/lib/styles';

export default function UserForm({ onSuccess, onCancel, forcedRole, initialData }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    name:     initialData?.name  || '',
    email:    initialData?.email || '',
    password: '',
    role:     initialData?.role  || forcedRole || 'customer',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const token    = localStorage.getItem('token');
    const method   = isEditing ? 'PUT'  : 'POST';
    const endpoint = isEditing ? `/api/users/${initialData.id}` : '/api/users';
    try {
      const res  = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.formContent}>
      <h3 style={{ margin: '0 0 1rem 0' }}>
        {isEditing ? 'Edit User' : forcedRole === 'customer' ? 'New Customer' : 'Create System User'}
      </h3>

      <input
        required
        style={styles.input}
        placeholder="Full Name"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        required
        type="email"
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
      />
      {!isEditing && (
        <input
          required
          type="password"
          style={styles.input}
          placeholder="Password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
        />
      )}
      {!forcedRole && (
        <select
          style={styles.input}
          value={formData.role}
          onChange={e => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="customer">Customer</option>
          <option value="mechanic">Mechanic</option>
          <option value="admin">Admin</option>
        </select>
      )}

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}

      <div style={styles.modalActions}>
        <button type="button" onClick={onCancel} style={styles.actionBtn}>Cancel</button>
        <button type="submit" disabled={loading} style={styles.primaryBtn}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
