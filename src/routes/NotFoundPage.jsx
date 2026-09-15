import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <main className="not-found section">
      <div className="container not-found__inner">
        <p className="not-found__runes meta" aria-hidden="true">
          ᚱ ᛰ ᛉ ᚦ ᚨ ᚷ ᛁ
        </p>
        <h1 className="not-found__title">404</h1>
        <p className="not-found__text">
          Этой страницы больше нет в Летописи. Луч Чистого Света поглотил её,
          и она канула под землю вместе с заброшенными кварталами внешнего
          города.
        </p>
        <div className="not-found__actions">
          <Link to="/" className="btn btn--primary">
            Вернуться домой
          </Link>
          <Link to="/read/1/1" className="btn btn--ghost">
            Читать комикс
          </Link>
        </div>
      </div>
    </main>
  );
}