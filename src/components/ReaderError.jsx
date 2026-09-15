/**
 * Плейсхолдер ошибки страницы/главы (DoD 4.5).
 * inline: «Страница не загрузилась» + «Повторить» (пагинация продолжает работать);
 * fullscreen: «Попробовать снова» + ссылка к оглавлению (глава недоступна целиком).
 */
import { Link } from 'react-router-dom';

export default function ReaderError({
  full = false,
  title = 'Страница не загрузилась',
  note = 'Нажмите «Повторить» или листайте дальше.',
  onRetry,
}) {
  return (
    <div className={full ? 'reader-error reader-error--full' : 'reader-error'}>
      <svg
        className="reader-error__icon"
        viewBox="0 0 48 48"
        width="48"
        height="48"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M37 44H11a4 4 0 0 1-4-4V22l9-9h12l4 4H37a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4Z" />
        <path d="M11 25h26M22 32l-5-5M19.5 33.5l5-5" />
      </svg>
      <h3 className="reader-error__title">{title}</h3>
      <p className="reader-error__note">{note}</p>
      <div className="reader-error__actions">
        {onRetry && (
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            Повторить
          </button>
        )}
        {full && (
          <Link to="/" className="btn btn--ghost">
            Вернуться к оглавлению
          </Link>
        )}
      </div>
    </div>
  );
}