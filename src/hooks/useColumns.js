import { useEffect, useState } from 'react';

/**
 * Текущее число колонок сетки концептов по брейкпоинтам layout.css.
 * (4/3/2/1 для 1024/768/480/иначе) — нужно для «3 ряда» сворачивания галереи:
 * на вертикальном телефоне 1 колонка и лимит 5 картинок.
 */
export function useColumns(breakpoints = { lg: 1024, md: 768, sm: 480 }) {
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setCols(w >= breakpoints.lg ? 4 : w >= breakpoints.md ? 3 : w >= breakpoints.sm ? 2 : 1);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [breakpoints.lg, breakpoints.md, breakpoints.sm]);

  return cols;
}