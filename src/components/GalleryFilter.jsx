export default function GalleryFilter({ characters, active, onChange }) {
  return (
    <div className="g-filter" role="group" aria-label="Фильтр по персонажам">
      <ul className="g-filter__list">
        {characters.map((c) => {
          const isActive = c.id === active;
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`g-filter__item${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => onChange(c.id)}
              >
                <span className="g-filter__marker" aria-hidden="true" />
                {c.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}