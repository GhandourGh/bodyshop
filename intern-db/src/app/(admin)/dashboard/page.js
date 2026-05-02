'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import ModalOverlay from '@/components/ModalOverlay';
import { StatCard, ActivityItem, LoadingSpinner, ErrorMessage } from '@/components/ui';
import JobForm from '@/components/forms/JobForm';
import UserForm from '@/components/forms/UserForm';
import VehicleForm from '@/components/forms/VehicleForm';
import PartForm from '@/components/forms/PartForm';
import AiTriggerForm from '@/components/forms/AiTriggerForm';
import { styles } from '@/lib/styles';

export default function OverviewPage() {
  const router = useRouter();
  const { user, isAdmin } = useUser();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [modalType, setModalType] = useState(null);

  const fetchData = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch('/api/analytics/overview', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then(res => {
        if (res.status === 403) throw new Error('Admin access required');
        return res.json();
      })
      .then(json => { if (json.success) setData(json.data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const closeAndRefresh = () => { setModalType(null); fetchData(); };

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.pageTitle}>Overview</h2>
        <div style={styles.headerActions}>
          <button style={styles.primaryBtn} onClick={() => setModalType('create_job')}>+ Quick Job</button>
          <button style={styles.actionBtn} onClick={() => { localStorage.removeItem('token'); router.replace('/login'); }}>Logout</button>
        </div>
      </header>

      <div style={styles.content}>
        {loading && !data ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Stat Cards */}
            <div style={styles.dashboardGrid}>
              <StatCard title="Active Jobs"    value={data.totalJobs}     trend="Total System Jobs" color="#3b82f6" />
              <StatCard title="Pending Est."   value={data.pendingJobs}   trend="Needs attention"   color="#f59e0b" />
              <StatCard title="Vehicles"       value={data.totalVehicles} trend="Registered"        color="#10b981" />
              <StatCard title="Parts in Stock" value={data.totalParts}    trend="Inventory Count"   color="#8b5cf6" />
            </div>

            {/* Quick Actions */}
            <div style={styles.fullWidthCard}>
              <h3 style={styles.cardTitle}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <button onClick={() => setModalType('create_job')}      style={styles.actionBlock}>➕ Create Job</button>
                <button onClick={() => router.push('/jobs')}             style={styles.actionBlock}>🔧 View Jobs</button>
                <button onClick={() => setModalType('create_vehicle')}  style={styles.actionBlock}>➕ Add Vehicle</button>
                <button onClick={() => router.push('/vehicles')}         style={styles.actionBlock}>🚗 View Vehicles</button>
                <button onClick={() => setModalType('create_customer')} style={styles.actionBlock}>➕ New Customer</button>
                <button onClick={() => router.push('/customers')}        style={styles.actionBlock}>👥 View Customers</button>
                <button onClick={() => setModalType('create_part')}     style={styles.actionBlock}>➕ Add Part</button>
                <button onClick={() => router.push('/inventory')}        style={styles.actionBlock}>📦 View Inventory</button>
                {isAdmin && <button onClick={() => setModalType('run_ai')} style={{ ...styles.actionBlock, borderColor: '#3b82f6', color: '#3b82f6' }}>🤖 Run AI</button>}
                {isAdmin && <button onClick={() => router.push('/users')} style={{ ...styles.actionBlock, borderColor: '#8b5cf6', color: '#8b5cf6' }}>🧑‍💻 Manage Users</button>}
              </div>
            </div>

            {/* AI Insights (admin only) */}
            {isAdmin && data.recentAiPredictions && (
              <div style={styles.fullWidthCard}>
                <h3 style={styles.cardTitle}>Live AI Insights</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {data.recentAiPredictions.length === 0
                    ? <p style={{ color: '#666' }}>No AI insights yet.</p>
                    : data.recentAiPredictions.map(pred => (
                      <div key={pred.id} style={styles.aiInsightCard}>
                        <div style={styles.aiInsightHeader}>
                          <span style={styles.aiBadge}>{pred.type}</span>
                          <span style={styles.aiConfidence}>{pred.confidence} Confidence</span>
                        </div>
                        <div style={styles.aiInsightVehicle}>{pred.vehicle}</div>
                        <div style={styles.aiInsightResult}>
                          {pred.result?.estimatedCost    && <div>Est. Cost: <strong>${pred.result.estimatedCost.toFixed(2)}</strong></div>}
                          {pred.result?.timeframe        && <div>Timeframe: <strong>{pred.result.timeframe}</strong></div>}
                          {pred.result?.suggestedMechanic && <div>Assign: <strong>{pred.result.suggestedMechanic}</strong></div>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div style={styles.fullWidthCard}>
              <h3 style={styles.cardTitle}>Recent System Activity</h3>
              <div style={styles.activityList}>
                {data.recentActivity?.length > 0
                  ? data.recentActivity.map(act => (
                    <ActivityItem key={act.id} text={act.text} time={new Date(act.time).toLocaleString()} />
                  ))
                  : <p style={{ color: '#666' }}>No recent activity.</p>
                }
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {modalType && (
        <ModalOverlay onClose={closeAndRefresh}>
          {modalType === 'create_job'      && <JobForm       onSuccess={closeAndRefresh} onCancel={closeAndRefresh} />}
          {modalType === 'create_vehicle'  && <VehicleForm   onSuccess={closeAndRefresh} onCancel={closeAndRefresh} />}
          {modalType === 'create_customer' && <UserForm       onSuccess={closeAndRefresh} onCancel={closeAndRefresh} forcedRole="customer" />}
          {modalType === 'create_part'     && <PartForm       onSuccess={closeAndRefresh} onCancel={closeAndRefresh} />}
          {modalType === 'create_user'     && <UserForm       onSuccess={closeAndRefresh} onCancel={closeAndRefresh} forcedRole={null} />}
          {modalType === 'run_ai'          && <AiTriggerForm  onSuccess={closeAndRefresh} onCancel={closeAndRefresh} />}
        </ModalOverlay>
      )}
    </>
  );
}
