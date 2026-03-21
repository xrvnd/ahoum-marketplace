'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { isAuthenticated } from '@/lib/auth';
import Link from 'next/link';

const EMPTY_FORM = {
  title: '', description: '', price: '',
  scheduled_at: '', duration_mins: 60, capacity: 10,
};

export default function CreatorDashboard() {
  const router        = useRouter();
  const { user, loading: authLoading, isCreator } = useAuth();

  const [sessions,    setSessions]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('sessions');
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated()) router.push('/');
  }, [authLoading]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/api/sessions/?my=true');
      setSessions(res.data.results || res.data);
    } catch {
      console.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchSessions();
  }, [authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      await api.post('/api/sessions/', form);
      setFormSuccess('Session created successfully!');
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchSessions();
    } catch (err) {
      const errors = err.response?.data;
      setFormError(
        typeof errors === 'object'
          ? Object.values(errors).flat().join(' ')
          : 'Failed to create session.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    try {
      await api.delete(`/api/sessions/${sessionId}/`);
      fetchSessions();
    } catch {
      alert('Failed to delete session.');
    }
  };

  const handleToggleActive = async (session) => {
    try {
      await api.patch(`/api/sessions/${session.id}/`, { is_active: !session.is_active });
      fetchSessions();
    } catch {
      alert('Failed to update session.');
    }
  };

  if (authLoading || loading) return <div className="loading-container">Loading dashboard...</div>;

  const totalBookings = sessions.reduce((sum, s) => sum + (s.bookings_count || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Creator Dashboard</h1>
          <p style={{ color: '#888', marginTop: '0.25rem' }}>
            {user?.first_name || user?.email}
            &nbsp;<span className="badge badge-purple">creator</span>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess(''); }}>
          {showForm ? '✕ Cancel' : '+ New Session'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Sessions',  value: sessions.length,           color: '#e8d5ff' },
          { label: 'Active Sessions', value: sessions.filter(s => s.is_active).length, color: '#d4edda' },
          { label: 'Total Bookings',  value: totalBookings,             color: '#cce5ff' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ textAlign: 'center', background: stat.color, border: 'none' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Create Session Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid #6c3fc5' }}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Create New Session</h2>
          {formError   && <div className="alert alert-error">{formError}</div>}
          {formSuccess  && <div className="alert alert-success">{formSuccess}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Session Title *</label>
                <input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Morning Yoga for Beginners" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description *</label>
                <textarea className="form-control" required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your session..." />
              </div>
              <div className="form-group">
                <label>Price (₹) — enter 0 for free</label>
                <input className="form-control" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="499" />
              </div>
              <div className="form-group">
                <label>Date & Time *</label>
                <input className="form-control" type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input className="form-control" type="number" min="15" value={form.duration_mins} onChange={(e) => setForm({ ...form, duration_mins: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Capacity (max participants)</label>
                <input className="form-control" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '0.5rem' }}>
              {submitting ? 'Creating...' : 'Create Session'}
            </button>
          </form>
        </div>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="empty-state">
          <h3>No sessions yet</h3>
          <p>Click "+ New Session" to create your first one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessions.map((session) => {
            const date = new Date(session.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const spotsLeft = session.capacity - (session.bookings_count || 0);
            return (
              <div key={session.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontWeight: 600 }}>{session.title}</h3>
                      <span className={`badge ${session.is_active ? 'badge-green' : 'badge-grey'}`}>
                        {session.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ color: '#888', fontSize: '0.875rem' }}>
                      📅 {date} &nbsp;·&nbsp; ⏱ {session.duration_mins} mins &nbsp;·&nbsp;
                      👥 {session.bookings_count}/{session.capacity} booked &nbsp;·&nbsp;
                      💰 {Number(session.price) === 0 ? 'Free' : `₹${session.price}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <Link href={`/sessions/${session.id}`} className="btn btn-outline btn-sm">View</Link>
                    <button
                      className={`btn btn-sm ${session.is_active ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleToggleActive(session)}
                    >
                      {session.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(session.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}