'use client';

import { useState, useEffect } from 'react';
import { styles } from '@/lib/styles';

export default function AiTriggerForm({ onSuccess, onCancel }) {
  const [jobs,        setJobs]        = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [type,        setType]        = useState('Damage Assessment');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    fetch('/api/jobs', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      cache: 'no-store',
    })
      .then(res => res.json())
      .then(json => { if (json.success) setJobs(json.data); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/ai/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ jobId: selectedJob, type }),
      });
      if (!res.ok) throw new Error();
      onSuccess();
    } catch {
      alert('AI Trigger Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.formContent}>
      <h3 style={{ margin: '0 0 1rem 0' }}>Run AI Diagnostics</h3>
      <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '-0.5rem' }}>
        Select a job to perform an automated AI assessment.
      </p>

      <select
        required
        style={styles.input}
        value={selectedJob}
        onChange={e => setSelectedJob(e.target.value)}
      >
        <option value="">Select Active Job...</option>
        {jobs.map(j => (
          <option key={j.id} value={j.id}>{j.vehicle} - {j.customer}</option>
        ))}
      </select>

      <select
        required
        style={styles.input}
        value={type}
        onChange={e => setType(e.target.value)}
      >
        <option value="Damage Assessment">Damage Assessment</option>
        <option value="Cost Estimation">Cost Estimation</option>
        <option value="Mechanic Recommendation">Mechanic Recommendation</option>
        <option value="Inventory Forecast">Inventory Forecast</option>
      </select>

      <div style={styles.modalActions}>
        <button type="button" onClick={onCancel} style={styles.actionBtn}>Cancel</button>
        <button type="submit" disabled={loading} style={styles.primaryBtn}>
          {loading ? 'Processing...' : 'Start AI Analysis'}
        </button>
      </div>
    </form>
  );
}
