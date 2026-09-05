import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ChatWidget from './components/ChatWidget.jsx';
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
        </Routes>
      </AnimatePresence>

      <ChatWidget />
    </AuthProvider>
  );
}
