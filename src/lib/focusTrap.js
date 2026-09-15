/**
 * Focus trap + inert-фон для модальных слоёв (Этап 6.1, DoD 6.1).
 * Пока `active`: Tab/Shift+Tab циклически ходят внутри rootRef,
 * перечисленные в `inertSelectors` элементы получают `inert`
 * (недоступны и для клавиатуры, и для скринридеров).
 * При закрытии фокус возвращается элементу, который его открыл.
 */
import { useEffect, useRef } from 'react';

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

export function getFocusable(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function useFocusTrap({ active, rootRef, initialFocusRef, inertSelectors = [] }) {
  const savedFocus = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    savedFocus.current = document.activeElement;

    const inerted = inertSelectors
      .map((sel) => document.querySelector(sel))
      .filter(Boolean)
      .map((el) => {
        const prev = el.inert;
        el.inert = true;
        return { el, prev };
      });

    const focusable = getFocusable(root);
    const target = initialFocusRef?.current ?? focusable[0];
    target?.focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const els = getFocusable(root);
      if (!els.length) {
        e.preventDefault();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      const cur = document.activeElement;
      if (e.shiftKey && (cur === first || !root.contains(cur))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (cur === last || !root.contains(cur))) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      inerted.forEach(({ el, prev }) => {
        el.inert = prev;
      });
      if (savedFocus.current && savedFocus.current.isConnected) {
        savedFocus.current.focus();
      }
    };
  }, [active, rootRef, initialFocusRef, inertSelectors]);
}