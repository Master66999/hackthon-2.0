import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ShieldCheck, Lightning, Plant, Envelope, Lock, User, ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

const FEATURES = [
  { icon: <Lightning size={18} weight="fill" />, text: 'Instant AI diagnosis in under 3 seconds' },
  { icon: <Plant size={18} weight="fill" />,    text: 'Expert treatment recommendations' },
  { icon: <ShieldCheck size={18} weight="fill" />, text: 'Your scan history saved securely' },
];

export default function Login() {
  const { status, loginWithCredentials, registerWithCredentials } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  // Where to go after login (from ProtectedRoute redirect)
  const from = location.state?.from?.pathname || '/';

  // Mode: 'signin' | 'register'
  const [mode, setMode] = useState('signin');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status & error states
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Already logged in — send away
  useEffect(() => {
    if (status === 'authenticated') navigate(from, { replace: true });
  }, [status, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    if (mode === 'register') {
      if (!name.trim()) {
        setFormError('Please enter your full name');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const res = await registerWithCredentials(name.trim(), email.trim(), password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setFormError(res.error || 'Registration failed');
      }
    } else {
      const res = await loginWithCredentials(email.trim(), password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setFormError(res.error || 'Invalid email or password');
      }
    }
    setLoading(false);
  };

  return (
    <main className="login-page">
      {/* Left — branding panel */}
      <motion.div
        className="login-panel login-panel--left"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
      >
        <div className="login-panel__leaf-bg" />

        <div className="login-panel__content">
          <Link to="/" className="login-logo" aria-label="Back to LeafSense home">
            <span className="login-logo__icon">
              <Leaf size={20} weight="fill" />
            </span>
            <span className="login-logo__text">
              Leaf<em>Sense</em>
            </span>
          </Link>

          <div className="login-headline">
            <motion.h1
              className="login-headline__title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Protect your crops.<br />
              <em>Save your harvest.</em>
            </motion.h1>
            <motion.p
              className="login-headline__sub"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Sign in to save your diagnosis history, track disease trends
              across your farm, and get personalized recommendations.
            </motion.p>
          </div>

          <motion.ul
            className="login-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {FEATURES.map((f, i) => (
              <motion.li
                key={i}
                className="login-feature"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
              >
                <span className="login-feature__icon">{f.icon}</span>
                <span>{f.text}</span>
              </motion.li>
            ))}
          </motion.ul>

          <p className="login-panel__quote">
            "Early detection saves up to 40% of crop losses."
          </p>
        </div>
      </motion.div>

      {/* Right — auth card */}
      <motion.div
        className="login-panel login-panel--right"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
      >
        <div className="login-card neo-raised">
          {/* Header */}
          <div className="login-card__header">
            <h2 className="login-card__title">
              {mode === 'signin' ? 'Welcome back' : 'Create an Account'}
            </h2>
            <p className="login-card__subtitle">
              {mode === 'signin'
                ? 'Sign in to access your crop pathology reports'
                : 'Join LeafSense for smart disease monitoring'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${mode === 'signin' ? 'login-tab--active' : ''}`}
              onClick={() => { setMode('signin'); setFormError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`login-tab ${mode === 'register' ? 'login-tab--active' : ''}`}
              onClick={() => { setMode('register'); setFormError(''); }}
            >
              Register
            </button>
          </div>

          {/* Error notification */}
          {formError && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {formError}
            </motion.div>
          )}

          {/* Email / Password Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="register-name">Full Name</label>
                <div className="input-wrap">
                  <User size={18} className="input-icon" />
                  <input
                    id="register-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ansh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email Address</label>
              <div className="input-wrap">
                <Envelope size={18} className="input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">Password</label>
              <div className="input-wrap">
                <Lock size={18} className="input-icon" />
                <input
                  id="auth-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              id="email-auth-submit"
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="login-card__links">
            <a href="#" className="login-card__link">Privacy Policy</a>
            <span>·</span>
            <a href="#" className="login-card__link">Terms of Service</a>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
