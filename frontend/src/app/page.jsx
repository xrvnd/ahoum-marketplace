'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import SessionCard, { SessionBentoGrid } from '@/components/SessionCard';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user }           = useAuth();
  const [sessions, setSessions] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const fetchSessions = async (query = '') => {
    setLoading(true);
    try {
      const url = query
        ? `/api/sessions/?search=${encodeURIComponent(query)}`
        : '/api/sessions/';
      const res = await api.get(url);
      // DRF returns paginated: { count, results }
      setSessions(res.data.results || res.data);
    } catch {
      setError('Failed to load sessions. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSessions(search);
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem', background: 'linear-gradient(135deg, #f3eeff 0%, #fff 100%)', borderRadius: '16px', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '0.75rem' }}>
          Find Your Next Session ✦
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Browse and book sessions from expert creators
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px', margin: '0 auto' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Login CTA — only shown to logged-out users */}
      {!user && (
        <div className="alert alert-info" style={{ textAlign: 'center' }}>
          <a href={process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL} style={{ color: '#004085', fontWeight: 600 }}>
            Sign in with Google
          </a>
          {' '}to book sessions or create your own.
        </div>
      )}

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Sessions grid */}
      {loading ? (
        <div className="loading-container">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <h3>No sessions found</h3>
          <p>{search ? `No results for "${search}"` : 'Check back soon!'}</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: 600 }}>
              {search ? `Results for "${search}"` : 'All Sessions'}
              <span style={{ color: '#999', fontWeight: 400, fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                ({sessions.length})
              </span>
            </h2>
            {search && (
              <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); fetchSessions(); }}>
                Clear
              </button>
            )}
          </div>
          <SessionBentoGrid sessions={sessions} />
        </>
      )}
    </div>
  );
}