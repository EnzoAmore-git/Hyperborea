/**
 * Скелетон загрузки страницы комикса (DoD 4.5).
 * - fullscreen: полноэкранный skeleton при первичной загрузке главы;
 * - inline (по умолчанию): прозрачный контур + shimmer внутри слоя, до onload/таймаута.
 */
export default function ReaderLoading({ full = false, label = 'Загрузка главы…' }) {
  return (
    <div className={full ? 'reader-loading reader-loading--full' : 'reader-loading'} role="status">
      <div className="reader-loading__box" aria-hidden="true">
        <div className="reader-loading__shimmer" />
      </div>
      <p className="reader-loading__label">{label}</p>
    </div>
  );
}