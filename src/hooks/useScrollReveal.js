import { useRef, useEffect } from 'react';

/**
 * Hook that triggers a callback once when an element enters the viewport.
 * Uses IntersectionObserver for scroll-triggered reveals.
 *
 * @param {function} callback - Called when element enters viewport
 * @param {object} options - IntersectionObserver options
 * @returns {React.RefObject} - Attach to the element you want to observe
 */
export function useScrollReveal(callback, options = {}) {
  const ref = useRef(null);
  const fired = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          callback();
          observer.unobserve(element);
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [callback, options]);

  return ref;
}
