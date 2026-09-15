/**
 * Баннер офлайн-режима (Этап 6.6): показывается, когда сеть пропала.
 * Контент в этот момент отдаётся из кеша Service Worker.
 */
import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DURATION, EASING } from '../animations/timing.js';

const subscribe = (cb) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

const getSnapshot = () => (typeof navigator === 'undefined' ? false : !navigator.onLine);

export default function OfflineBanner() {
  const offline = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          className="offline-banner"
          role="status"
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 48, opacity: 0 }}
          transition={{ duration: DURATION.medium / 1000, ease: EASING.smooth }}
        >
          <span className="offline-banner__dot" aria-hidden="true" />
          Нет сети — читаете из автономного кеша. При появлении сети контент
          обновится.
        </motion.div>
      )}
    </AnimatePresence>
  );
}