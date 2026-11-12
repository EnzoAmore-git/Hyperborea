import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../lib/focusTrap.js';

const STORAGE_KEY = 'hyperborea:age-gate';

export default function AgeGate() {
  const [status, setStatus] = useState(() => {
    if (typeof window === 'undefined') return 'open';
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'granted') return 'granted';
      if (v === 'denied') return 'denied';
    } catch {
      // Если localStorage недоступен — не блокируем навсегда
    }
    return 'open';
  });

  const [denied, setDenied] = useState(false);

  const trapRef = useFocusTrap(status === 'open' && !denied);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    if (status === 'open' && !denied) {
      const prevOverflow = body.style.overflow;
      body.style.overflow = 'hidden';
      return () => {
        body.style.overflow = prevOverflow;
      };
    }
  }, [status, denied]);

  const grant = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'granted');
    } catch {
      /* ignore */
    }
    setStatus('granted');
    setDenied(false);
  };

  const deny = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'denied');
    } catch {
      /* ignore */
    }
    setDenied(true);
  };

  if (status === 'granted' || typeof document === 'undefined') return null;

  return createPortal(
    <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <div className="age-gate__backdrop" aria-hidden="true" />
      <div className="age-gate__modal" ref={trapRef}>
        <div className="age-gate__header">
          <span className="age-gate__rune" aria-hidden="true">◈</span>
          <span className="age-gate__title" id="age-gate-title">
            Гиперборея
          </span>
        </div>

        {!denied ? (
          <>
            <div className="age-disclaimer age-gate__badge">
              <span className="age-disclaimer__badge">18+</span>
              <span className="age-disclaimer__text meta">Для лиц старше 18 лет</span>
            </div>
            <div className="age-gate__body">
              <p className="age-gate__text">
                Данный сайт содержит мрачный фэнтези-контент с элементами насилия и жестокости.
              </p>
              <p className="age-gate__text">
                Подтверди, что тебе исполнилось 18 лет, чтобы продолжить знакомство с «Легендой о Северном Царстве».
              </p>
            </div>
            <div className="age-gate__actions">
              <button type="button" className="btn btn--primary age-gate__btn" onClick={grant}>
                Мне есть 18 лет
              </button>
              <button type="button" className="btn btn--ghost age-gate__btn" onClick={deny}>
                Мне нет 18 лет
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="age-gate__body age-gate__body--denied">
              <p className="age-gate__text age-gate__text--strong">
                Доступ ограничен
              </p>
              <p className="age-gate__text">
                Контент сайта предназначен только для лиц старше 18 лет.
              </p>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
