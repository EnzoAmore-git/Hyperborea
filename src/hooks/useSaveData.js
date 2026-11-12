/**
 * Хук экономии трафика (Этап 6.8, DoD 6.8).
 * true wenn: навигатор сообщает saveData, effectiveType 2g/slow-2g
 * или пользователь выбрал prefers-reduced-data.
 * Реагирует на изменения соединения на лету.
 */
import { useEffect, useState } from 'react';

function detect() {
  if (typeof navigator === 'undefined') return false;
  const conn = navigator.connection;
  const eff = conn && conn.effectiveType;
  return Boolean(
    (conn && conn.saveData) ||
      (conn && (eff === 'slow-2g' || eff === '2g')) ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-data: reduce)').matches),
  );
}

export function useSaveData() {
  const [saveData, setSaveData] = useState(detect);

  useEffect(() => {
    const update = () => setSaveData(detect());
    const conn = typeof navigator !== 'undefined' ? navigator.connection : null;
    conn && conn.addEventListener && conn.addEventListener('change', update);
    return () => {
      conn && conn.removeEventListener && conn.removeEventListener('change', update);
    };
  }, []);

  return saveData;
}