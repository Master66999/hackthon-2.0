import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Warning, XCircle, X } from '@phosphor-icons/react';
import './Toast.css';

const ICONS = {
  success: <CheckCircle size={20} weight="fill" />,
  warning: <Warning size={20} weight="fill" />,
  error: <XCircle size={20} weight="fill" />,
};

/**
 * Toast notification that slides in from top with a spring bounce,
 * then auto-dismisses.
 */
export default function Toast({ message, type = 'success', onDismiss, duration = 4000 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timerRef.current);
  }, [duration, onDismiss]);

  return createPortal(
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      <span className="toast__icon">{ICONS[type]}</span>
      <p className="toast__message">{message}</p>
      <button
        className="toast__close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X size={16} weight="bold" />
      </button>
    </div>,
    document.body
  );
}
