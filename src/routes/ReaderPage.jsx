/**
 * Страница читалки (Этап 4).
 * DoD 4.8: читалка — отдельный чанк, грузится только при открытии /read
 * (React.lazy + Suspense). Fallback — полноэкранный скелетон.
 */
import { lazy, Suspense } from 'react';
import ReaderLoading from '../components/ReaderLoading.jsx';

const ComicReader = lazy(() => import('../components/ComicReader.jsx'));

export default function ReaderPage() {
  return (
    <Suspense
      fallback={<div className="reader-suspense"><ReaderLoading full label="Грузим читалку…" /></div>}
    >
      <ComicReader />
    </Suspense>
  );
}