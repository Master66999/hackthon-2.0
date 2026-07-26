import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Landing from './pages/Landing.jsx';
import Analyze from './pages/Analyze.jsx';
import Result from './pages/Result.jsx';
import Login from './pages/Login.jsx';
import VisionConsole from './pages/VisionConsole.jsx';

/* ─── Page transition wrapper ─── */
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in:      { opacity: 1, y: 0  },
  out:     { opacity: 0, y: -8 },
};
const pageTransition = { duration: 0.3, ease: [0.33, 1, 0.68, 1] };

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

/* ─── Auth Callback page ─── */
function AuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');

    if (!token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    loginWithToken(token).then((ok) => {
      const savedPath = sessionStorage.getItem('leafsense_return_to') || '/';
      sessionStorage.removeItem('leafsense_return_to');
      navigate(ok ? savedPath : '/login?error=oauth_failed', { replace: true });
    });
  }, [loginWithToken, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Signing you in…</p>
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <Navbar />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Landing route */}
          <Route
            path="/"
            element={
              <AnimatedPage>
                <Landing />
                <Footer />
              </AnimatedPage>
            }
          />

          {/* Protected routes requiring login/registration */}
          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <AnimatedPage>
                  <Analyze />
                </AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/console"
            element={
              <ProtectedRoute>
                <AnimatedPage>
                  <VisionConsole />
                  <Footer />
                </AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <AnimatedPage>
                  <Result />
                  <Footer />
                </AnimatedPage>
              </ProtectedRoute>
            }
          />

          {/* Auth routes */}
          <Route
            path="/login"
            element={
              <AnimatedPage>
                <Login />
              </AnimatedPage>
            }
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}
