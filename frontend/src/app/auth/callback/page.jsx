'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveTokens } from '@/lib/auth';


function CallbackHandler() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const access  = searchParams.get('access');
      const refresh = searchParams.get('refresh');
      const role    = searchParams.get('role');

      // Validate tokens exist 
      if (!access || !refresh) {
        setError('Authentication failed — no tokens received.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      // Save tokens to cookies
      saveTokens(access, refresh);

      // Redirect based on role
      // Don't call login() here — AuthContext will auto-fetch
      // the user profile via /api/auth/me/ when the dashboard mounts
      if (role === 'creator') {
        router.push('/dashboard/creator');
      } else {
        router.push('/dashboard/user');
      }
    };

    handleCallback();
  }, [searchParams]); // searchParams is the only real dependency

  // Error state
  if (error) {
    return (
      <div className="loading-container">
        <div className="alert alert-error">
          {error} Redirecting to home...
        </div>
      </div>
    );
  }

  // Loading state (shown while tokens are processed)
  return (
    <div className="loading-container">
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✦</p>
        <p style={{ color: '#666' }}>Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}