import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Wraps a route so it requires authentication.
 * Shows nothing (or a brief spinner) while auth status is loading.
 * Redirects to /login if unauthenticated, preserving the intended destination.
 */
export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location   = useLocation();

  if (status === 'loading') {
    // Very brief — just prevents flash of redirect before token is verified
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Checking session…</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
