'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

const GOOGLE_AUTH_URL = process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL || 'http://localhost:8000/accounts/google/login/';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  const role          = user?.profile?.role || 'user';
  const isCreator     = role === 'creator';
  const dashboardHref = isCreator ? '/dashboard/creator' : '/dashboard/user';
  const onDashboard   = pathname?.startsWith('/dashboard');

  return (
    <nav className="navbar">

      <Link href="/" className="navbar-brand">
        ✦ Ahoum
      </Link>

      <div className="navbar-actions">
        {loading && (
          <span className="navbar-user">Loading...</span>
        )}

        {!loading && user && (
          <>
            <span className="navbar-user">
              Hi, {user.first_name || user.email}
              &nbsp;
              <span className={`badge ${isCreator ? 'badge-purple' : 'badge-green'}`}>
                {role}
              </span>
            </span>

            <Link
              href={dashboardHref}
              className={`btn btn-sm ${onDashboard ? 'btn-primary' : 'btn-outline'}`}
            >
              Dashboard
            </Link>

            <button onClick={logout} className="btn btn-danger btn-sm">
              Logout
            </button>
          </>
        )}

        {!loading && !user && (
          <a href={GOOGLE_AUTH_URL} className="btn btn-primary">
            Sign in with Google
          </a>
        )}
      </div>

    </nav>
  );
}