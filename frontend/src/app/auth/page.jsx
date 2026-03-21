'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveTokens } from '@/lib/auth';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallback() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const access  = searchParams.get('access');
      const refresh = searchParams.get('refresh');
      const role    = searchParams.get('role');

      // Validate tokens exist in URL
      if (!access || !refresh) {
        setError('Authentication failed — no tokens received.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      // Save tokens to cookies
      saveTokens(access, refresh);

      // Fetch full user profile
      try {
        const res = await api.get('/api/auth/me/');
        login(res.data);

        // Redirect based on role
        const userRole = res.data.profile?.role || role;
        if (userRole === 'creator') {
          router.push('/dashboard/creator');
        } else {
          router.push('/dashboard/user');
        }
      } catch {
        setError('Failed to load profile. Please try again.');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleCallback();
  }, []);  // eslint-disable-line

  if (error) {
    return (
      <div className="loading-container">
        <div className="alert alert-error">{error} Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>✦</p>
        <p>Signing you in...</p>
      </div>
    </div>
  );
}