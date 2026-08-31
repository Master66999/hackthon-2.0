import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Leaf, SignOut, User, CaretDown, Eye, List, X } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext.jsx';
import './Navbar.css';

/* ─── User avatar dropdown ─────────────────────────── */
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef         = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="nav-user" ref={menuRef}>
      <button
        id="nav-user-btn"
        className="nav-user__trigger neo-raised-sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="nav-user__avatar" referrerPolicy="no-referrer" />
        ) : (
          <span className="nav-user__avatar-fallback">
            <User size={16} weight="bold" />
          </span>
        )}
        <span className="nav-user__name">{user.firstName ?? user.name?.split(' ')[0]}</span>
        <CaretDown size={12} weight="bold" className={`nav-user__caret ${open ? 'nav-user__caret--open' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav-user__dropdown neo-raised"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.33, 1, 0.68, 1] }}
          >
            <div className="nav-user__info">
              <p className="nav-user__info-name">{user.name}</p>
              <p className="nav-user__info-email">{user.email}</p>
            </div>
            <div className="nav-user__divider" />
            <button
              id="nav-logout-btn"
              className="nav-user__logout"
              onClick={() => { setOpen(false); onLogout(); }}
            >
              <SignOut size={15} weight="bold" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Navbar ────────────────────────────────────────── */
export default function Navbar() {
  const location          = useLocation();
  const navigate          = useNavigate();
  const { user, status, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLogin = location.pathname === '/login';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (isLogin) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo" aria-label="LeafSense Home">
          <span className="navbar__logo-icon">
            <Leaf size={22} weight="fill" />
          </span>
          <span className="navbar__logo-text">
            Leaf<em>Sense</em>
          </span>
        </Link>

        {/* Nav links (Desktop) */}
        <nav className="navbar__nav" aria-label="Main navigation">
          <Link
            to="/"
            className={`navbar__link ${location.pathname === '/' ? 'navbar__link--active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/analyze"
            className={`navbar__link ${location.pathname === '/analyze' ? 'navbar__link--active' : ''}`}
          >
            Analyze
          </Link>
          <Link
            to="/console"
            className={`navbar__link ${location.pathname === '/console' ? 'navbar__link--active' : ''}`}
          >
            Vision Console
          </Link>
          <a href="/#crops" className="navbar__link">Crops</a>
        </nav>

        {/* Right side */}
        <div className="navbar__right">
          {status === 'authenticated' && user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : status === 'unauthenticated' ? (
            <>
              <Link to="/login" className="btn btn-ghost navbar__signin" id="navbar-signin">
                Sign in
              </Link>
              <Link to="/console" className="btn btn-primary navbar__cta" id="navbar-cta">
                Vision AI
                <ArrowRight size={16} weight="bold" />
              </Link>
            </>
          ) : (
            <div className="navbar__skeleton" aria-hidden="true" />
          )}

          {/* Mobile hamburger toggle */}
          <button
            className="navbar__toggle"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="navbar__mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.33, 1, 0.68, 1] }}
          >
            <div className="navbar__mobile-content container">
              <nav className="navbar__mobile-nav">
                <Link
                  to="/"
                  className={`navbar__mobile-link ${location.pathname === '/' ? 'navbar__mobile-link--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/analyze"
                  className={`navbar__mobile-link ${location.pathname === '/analyze' ? 'navbar__mobile-link--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Analyze
                </Link>
                <Link
                  to="/console"
                  className={`navbar__mobile-link ${location.pathname === '/console' ? 'navbar__mobile-link--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Vision Console
                </Link>
                <a
                  href="/#crops"
                  className="navbar__mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  Crops
                </a>
              </nav>

              <div className="navbar__mobile-footer">
                {status === 'authenticated' && user ? (
                  <div className="navbar__mobile-user">
                    <div className="navbar__mobile-user-info">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="nav-user__avatar" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="nav-user__avatar-fallback">
                          <User size={16} weight="bold" />
                        </span>
                      )}
                      <div className="navbar__mobile-user-meta">
                        <span className="nav-user__info-name">{user.name}</span>
                        <span className="nav-user__info-email">{user.email}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary navbar__mobile-logout"
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                    >
                      <SignOut size={16} weight="bold" />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="navbar__mobile-cta-group">
                    <Link to="/login" className="btn btn-secondary navbar__mobile-btn" onClick={() => setMobileOpen(false)}>
                      Sign in
                    </Link>
                    <Link to="/console" className="btn btn-primary navbar__mobile-btn" onClick={() => setMobileOpen(false)}>
                      Vision AI
                      <ArrowRight size={16} weight="bold" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

