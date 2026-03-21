'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { isAuthenticated } from '@/lib/auth';
import Link from 'next/link';

export default function UserDashboard() {
  const router          = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings,  setBookings]  = useState({ active: [], past: [] });
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [cancelling, setCancelling] = useState(null);

  // ── Redirect if not logged in ─────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated()) router.push('/');
  }, [authLoading]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/api/bookings/my/');
        setBookings(res.data);
      } catch {
        console.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchBookings();
  }, [authLoading]);

  const handleCancel = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      await api.patch(`/api/bookings/${bookingId}/cancel/`);
      // Refresh bookings
      const res = await api.get('/api/bookings/my/');
      setBookings(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel.');
    } finally {
      setCancelling(null);
    }
  };

  if (authLoading || loading) return <div className="loading-container">Loading dashboard...</div>;

  const currentBookings = activeTab === 'active' ? bookings.active : bookings.past;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p style={{ color: '#888', marginTop: '0.25rem' }}>
            {user?.first_name || user?.email}
            &nbsp;<span className="badge badge-green">user</span>
          </p>
        </div>
        <Link href="/" className="btn btn-outline">
          Browse Sessions
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Active Bookings', value: bookings.active.length, color: '#d4edda' },
          { label: 'Past Sessions',   value: bookings.past.length,   color: '#e8d5ff' },
          { label: 'Total Sessions',  value: bookings.active.length + bookings.past.length, color: '#cce5ff' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ textAlign: 'center', background: stat.color, border: 'none' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          Upcoming ({bookings.active.length})
        </button>
        <button className={`tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
          Past ({bookings.past.length})
        </button>
      </div>

      {/* Bookings list */}
      {currentBookings.length === 0 ? (
        <div className="empty-state">
          <h3>{activeTab === 'active' ? 'No upcoming bookings' : 'No past sessions yet'}</h3>
          <p style={{ marginBottom: '1rem' }}>
            {activeTab === 'active' ? 'Browse sessions and book one!' : ''}
          </p>
          {activeTab === 'active' && (
            <Link href="/" className="btn btn-primary">Browse Sessions</Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentBookings.map((booking) => {
            const session = booking.session_detail;
            const date    = new Date(session?.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <div key={booking.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.35rem' }}>{session?.title}</h3>
                  <p style={{ color: '#888', fontSize: '0.875rem' }}>📅 {date} &nbsp;·&nbsp; ⏱ {session?.duration_mins} mins</p>
                  <p style={{ color: '#888', fontSize: '0.875rem' }}>💰 {Number(session?.price) === 0 ? 'Free' : `₹${session?.price}`}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${booking.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>
                    {booking.status}
                  </span>
                  <Link href={`/sessions/${session?.id}`} className="btn btn-outline btn-sm">
                    View
                  </Link>
                  {booking.status === 'confirmed' && activeTab === 'active' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelling === booking.id}
                    >
                      {cancelling === booking.id ? '...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}