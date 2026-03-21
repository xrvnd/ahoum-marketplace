'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { isAuthenticated } from '@/lib/auth';

export default function SessionDetailPage() {
  const { id }     = useParams();
  const router     = useRouter();
  const { user }   = useAuth();

  const [session,  setSession]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [booking,  setBooking]  = useState(false);
  const [message,  setMessage]  = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/api/sessions/${id}/`);
        setSession(res.data);
      } catch {
        setMessage({ type: 'error', text: 'Session not found.' });
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  const handleBook = async () => {
    if (!isAuthenticated()) {
      window.location.href = process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL;
      return;
    }

    setBooking(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/api/bookings/', { session: id });
      setMessage({ type: 'success', text: '🎉 Booking confirmed! Check your dashboard.' });
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Booking failed. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="loading-container">Loading...</div>;

  if (!session) {
    return (
      <div className="empty-state">
        <h3>Session not found</h3>
        <button className="btn btn-primary" onClick={() => router.push('/')}>
          Back to Catalog
        </button>
      </div>
    );
  }

  const date     = new Date(session.scheduled_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const spotsLeft = session.capacity - session.bookings_count;
  const isOwner   = user?.id === session.creator?.id;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>

      {/* Back */}
      <button className="btn btn-outline btn-sm" onClick={() => router.push('/')} style={{ marginBottom: '1.5rem' }}>
        ← Back to Catalog
      </button>

      <div className="card">
        {/* Title + status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, flex: 1 }}>{session.title}</h1>
          <span className={`badge ${session.is_fully_booked ? 'badge-red' : 'badge-green'}`} style={{ marginLeft: '1rem' }}>
            {session.is_fully_booked ? 'Fully Booked' : `${spotsLeft} spots left`}
          </span>
        </div>

        {/* Creator */}
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          by {session.creator?.first_name} {session.creator?.last_name}
        </p>

        {/* Description */}
        <p style={{ lineHeight: 1.8, color: '#444', marginBottom: '1.5rem' }}>
          {session.description}
        </p>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <div><strong>📅 Date & Time</strong><br /><span style={{ color: '#555', fontSize: '0.9rem' }}>{date}</span></div>
          <div><strong>⏱ Duration</strong><br /><span style={{ color: '#555', fontSize: '0.9rem' }}>{session.duration_mins} minutes</span></div>
          <div><strong>👥 Capacity</strong><br /><span style={{ color: '#555', fontSize: '0.9rem' }}>{session.capacity} people</span></div>
          <div><strong>💰 Price</strong><br /><span style={{ color: '#6c3fc5', fontWeight: 700, fontSize: '1.1rem' }}>{Number(session.price) === 0 ? 'Free' : `₹${session.price}`}</span></div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
            {message.type === 'success' && (
              <button className="btn btn-outline btn-sm" style={{ marginLeft: '1rem' }} onClick={() => router.push('/dashboard/user')}>
                View Booking
              </button>
            )}
          </div>
        )}

        {/* Book button */}
        {!isOwner && (
          <button
            className="btn btn-primary"
            onClick={handleBook}
            disabled={booking || session.is_fully_booked}
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
          >
            {booking            ? 'Booking...'    :
             session.is_fully_booked ? 'Fully Booked' :
             !user              ? 'Sign in to Book' :
             'Book Now'}
          </button>
        )}

        {isOwner && (
          <div className="alert alert-info">
            This is your session. <a href="/dashboard/creator" style={{ fontWeight: 600 }}>Manage it →</a>
          </div>
        )}
      </div>
    </div>
  );
}