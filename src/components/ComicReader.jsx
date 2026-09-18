/**
 * Вертикальная читалка вебтуна (Этап 4 → переработка).
 * - Все страницы главы — друг под другом, выровнены по ширине;
 * - скролл-снап по страницам, счётчик/стрелки/шкала слева (солярный символ);
 * - переключение глав справа (счётчик/стрелки/индикатор глав);
 * - клавиатура из design.md; панель глав; подсказка с авто-скрытием.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  chapters,
  getChapter,
  getNextChapter,
  getPrevChapter,
} from '../data/comics.js';
import { useSaveData } from '../hooks/useSaveData.js';
import { useFocusTrap } from '../lib/focusTrap.js';
import ReaderError from './ReaderError.jsx';

const POSITION_KEY = 'hyperborea:reading-position';
const HINT_DURATION = 3400;
const TOP_OFFSET = 96; // высота подсказки активной страницы от верха вьюпорта

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const readSavedPosition = () => {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const savePosition = (c, p) => {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ ch: c, pg: p }));
  } catch {
    /* ignore quota/private mode */
  }
};

const clampNum = (num, ch) => {
  const n = Number(num);
  if (!Number.isInteger(n)) return 1;
  return Math.max(1, Math.min(n, ch.pages.length));
};

export default function ComicReader() {
  const params = useParams();
  const navigate = useNavigate();
  const saveData = useSaveData();

  const [chapterId, setChapterId] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [fatal, setFatal] = useState(false);
  const [errPages, setErrPages] = useState({});
  const [navTick, setNavTick] = useState(0);

  const scrollRef = useRef(null);
  const readerRef = useRef(null);
  const lastActiveRef = useRef(1);
  const pendingScrollRef = useRef(null);
  const rewindRafRef = useRef(null);
  const rafRef = useRef(null);
  const programmaticUntilRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelLockRef = useRef(0);
  const hintTimerRef = useRef(null);
  const panelRef = useRef(null);
  const exitRef = useRef(null);

  const ch = chapterId ? getChapter(chapterId) : null;

  // «Продолжить чтение»: сохранённая позиция, если она отличается от URL
  const resumePos = useMemo(() => {
    const saved = readSavedPosition();
    if (!saved || !getChapter(saved.ch)) return null;
    return saved.ch === params.chapterId && Number(saved.pg) === Number(params.pageNum)
      ? null
      : saved;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chapterIdx = ch ? chapters.findIndex((c) => c.id === ch.id) + 1 : 0;

  /* ---------- скролл к странице ---------- */
  const scrollToPage = (num, behavior) => {
    const box = scrollRef.current;
    if (!box) return;
    const el = box.querySelector(
      `.reader__webtoon-page[data-page="${Number(num)}"]`,
    );
    if (!el) return;
    el.scrollIntoView({
      behavior: behavior === 'auto' || reduceMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  /* ---------- переход к странице (счётчики синхронны сразу) ---------- */
  const goToPage = (num, behavior = 'smooth') => {
    if (!ch) return;
    const p = Math.max(1, Math.min(ch.pages.length, Number(num) || 1));
    lastActiveRef.current = p;
    setPageNum(p);
    savePosition(ch.id, p);
    navigate(`/read/${ch.id}/${p}`, { replace: true });
    // пока идёт программный скролл, не даём onScroll «откатить» счётчик назад
    programmaticUntilRef.current = performance.now() + 900;
    scrollToPage(p, behavior);
  };

  /* ---------- определение активной страницы по скроллу ---------- */
  const handleScroll = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (!el || !ch) return;
      if (performance.now() < programmaticUntilRef.current) return;
      const nodes = el.querySelectorAll('.reader__webtoon-page');
      if (!nodes.length) return;
      let active = 1;
      const top = el.getBoundingClientRect().top + TOP_OFFSET;
      nodes.forEach((node) => {
        if (node.getBoundingClientRect().top <= top) {
          active = Number(node.dataset.page) || active;
        }
      });
      active = Math.max(1, Math.min(ch.pages.length, active));
      if (active !== lastActiveRef.current) {
        lastActiveRef.current = active;
        setPageNum(active);
        savePosition(ch.id, active);
        navigate(`/read/${ch.id}/${active}`, { replace: true });
      }
    });
  };

  /* ---------- смена главы/страницы ---------- */
  const openChapter = (id, num) => {
    const target = getChapter(id);
    if (!target) return;
    const p = clampNum(num, target);
    setChapterId(id);
    lastActiveRef.current = p;
    setPageNum(p);
    setErrPages({});
    savePosition(id, p);
    pendingScrollRef.current = p;
    setNavTick((t) => t + 1);
    setHintVisible(true);
    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(
      () => setHintVisible(false),
      reduceMotion() ? 1 : HINT_DURATION,
    );
  };

  /* ---------- плавное «отматывание» к началу комикса ---------- */
  const cancelRewind = () => {
    if (rewindRafRef.current) {
      cancelAnimationFrame(rewindRafRef.current);
      rewindRafRef.current = null;
    }
    programmaticUntilRef.current = 0;
    if (scrollRef.current) scrollRef.current.style.scrollSnapType = '';
  };

  const restartComic = () => {
    const box = scrollRef.current;
    const finish = () => {
      if (box) box.style.scrollSnapType = '';
      openChapter(chapters[0].id, 1);
    };
    if (!box || !ch || reduceMotion()) {
      finish();
      return;
    }
    const from = box.scrollTop;
    if (from <= 0) {
      finish();
      return;
    }
    // на время анимации отключаем обязательный снап, чтобы кадры не «дёргались»
    box.style.scrollSnapType = 'none';
    const duration = Math.min(1400, Math.max(500, from * 0.4));
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      box.scrollTop = from * (1 - ease(t));
      if (t < 1) {
        rewindRafRef.current = requestAnimationFrame(step);
      } else {
        rewindRafRef.current = null;
        finish();
      }
    };
    cancelRewind();
    programmaticUntilRef.current = performance.now() + duration + 100;
    rewindRafRef.current = requestAnimationFrame(step);
  };

  // Скролл применяем после монтирования страниц новой главы
  useEffect(() => {
    if (!ch || pendingScrollRef.current == null) return;
    const p = pendingScrollRef.current;
    pendingScrollRef.current = null;
    cancelRewind();
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    scrollToPage(p, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navTick]);

  useEffect(() => cancelRewind, []);

  const nextPage = () => {
    if (!ch || pageNum >= ch.pages.length) return;
    goToPage(pageNum + 1, 'smooth');
  };

  const prevPage = () => {
    if (!ch || pageNum <= 1) return;
    goToPage(pageNum - 1, 'smooth');
  };

  /* ---------- колесо мыши (десктоп): по странице за щелчок ---------- */
  const wheelStep = (dir) => {
    if (!ch) return;
    if (dir > 0) {
      if (pageNum >= ch.pages.length) {
        const next = getNextChapter(ch.id);
        if (next) openChapter(next.id, 1);
        return;
      }
      goToPage(pageNum + 1, 'smooth');
      return;
    }
    if (pageNum <= 1) {
      const prev = getPrevChapter(ch.id);
      if (prev) openChapter(prev.id, prev.pages.length);
      return;
    }
    goToPage(pageNum - 1, 'smooth');
  };

  useEffect(() => {
    const root = readerRef.current;
    if (!root) return;
    const onWheel = (e) => {
      if (panelOpen) return;
      if (!window.matchMedia('(min-width: 1024px)').matches) return;
      if (e.ctrlKey) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (e.target instanceof Element && e.target.closest('.reader__panel')) return;
      e.preventDefault();
      e.stopPropagation();
      cancelRewind();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= scrollRef.current?.clientHeight || 600;
      wheelAccumRef.current += d;
      const now = performance.now();
      if (now - wheelLockRef.current < 220) return;
      if (Math.abs(wheelAccumRef.current) < 40) return;
      const dir = wheelAccumRef.current > 0 ? 1 : -1;
      wheelAccumRef.current = 0;
      wheelLockRef.current = now;
      wheelStep(dir);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel, { passive: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen, ch, pageNum]);

  const nextChapter = () => {
    if (!ch) return;
    const next = getNextChapter(ch.id);
    if (next) openChapter(next.id, 1);
  };

  const prevChapter = () => {
    if (!ch) return;
    const prev = getPrevChapter(ch.id);
    if (prev) openChapter(prev.id, 1);
  };

  const goChapter = (id) => {
    if (id !== chapterId) openChapter(id, 1);
  };

  /* ---------- URL-параметры → открытие главы ---------- */
  useEffect(() => {
    const target = getChapter(params.chapterId);
    if (!target) {
      setFatal(true);
      return;
    }
    setFatal(false);
    if (target.id !== chapterId) {
      openChapter(target.id, params.pageNum);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.chapterId]);

  /* ---------- клавиатура (DoD 4.7) ---------- */
  useEffect(() => {
    const onKeyDown = (e) => {
      const handled = [
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'PageUp', 'PageDown', ' ', 'Home', 'End', 'g', 'G', 'Escape',
      ];
      if (!handled.includes(e.key)) return;

      if (panelOpen) {
        if (e.key === 'Escape' || e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          setPanelOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          nextPage();
          break;
        case 'Home':
          e.preventDefault();
          if (ch) goToPage(1, 'smooth');
          break;
        case 'End':
          e.preventDefault();
          if (ch) goToPage(ch.pages.length, 'smooth');
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setPanelOpen(true);
          break;
        case 'Escape':
          e.preventDefault();
          navigate('/', { replace: true });
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen, ch, pageNum]);

  /* ---------- фокус в панель глав ---------- */
  useEffect(() => {
    if (panelOpen) panelRef.current?.focus();
  }, [panelOpen]);

  useFocusTrap({
    active: panelOpen,
    rootRef: panelRef,
    inertSelectors: ['.navbar', '.site-footer', '.reader__scroll', '.reader__side'],
  });

  /* ---------- загрузка/ошибки страниц ---------- */
  const handleImgError = (num) => {
    setErrPages((prev) => ({ ...prev, [num]: true }));
  };
  const retryImg = (num) => {
    setErrPages((prev) => {
      if (!(num in prev)) return prev;
      const next = { ...prev };
      delete next[num];
      return next;
    });
    const img = scrollRef.current?.querySelector(
      `.reader__webtoon-page[data-page="${Number(num)}"] img`,
    );
    if (img) {
      const src = img.getAttribute('src');
      img.removeAttribute('src');
      requestAnimationFrame(() => img.setAttribute('src', src));
    }
  };

  /* ---------- клик по страничной шкале ---------- */
  const handlePageScaleClick = (e) => {
    if (!ch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = 1 - (e.clientY - rect.top) / rect.height;
    const num = Math.max(
      1,
      Math.min(ch.pages.length, Math.round(frac * ch.pages.length)),
    );
    goToPage(num, 'smooth');
  };

  const exitReader = () => navigate('/', { replace: true });

  if (fatal) {
    return (
      <div className="reader">
        <div className="reader__fatal">
          <ReaderError
            full
            title="Глава не загрузилась"
            note="Попробуйте ещё раз или вернитесь к оглавлению."
            onRetry={() => {
              setFatal(false);
              navigate(`/read/${params.chapterId || '1'}/1`, { replace: true });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="reader"
      ref={readerRef}
      aria-label={`Читалка: ${ch ? ch.title : ''}`}
    >
      {/* ----- вертикальный вебтун ----- */}
      <main
        className="reader__scroll"
        ref={scrollRef}
        onScroll={handleScroll}
        data-lenis-prevent
      >
        <header className="reader__top">
          <button
            type="button"
            className="reader__btn"
            aria-label="Выйти из читалки (Esc)"
            ref={exitRef}
            onClick={exitReader}
          >
            ← Выйти
          </button>
          <p className="reader__meta">
            {ch ? `${ch.title}. ${ch.subtitle}` : ''}
            {ch ? ` · стр. ${pageNum} / ${ch.pages.length}` : ''}
          </p>
          <button
            type="button"
            className="reader__btn reader__btn--chapters"
            aria-label="Главы (G)"
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((v) => !v)}
          >
            Главы {ch && <span className="reader__meta-inline">({chapterIdx}/{chapters.length})</span>}
          </button>
        </header>

        {ch?.pages.map((pg, i) =>
          pg.type === 'text' ? (
            <figure
              key={pg.num}
              className="reader__webtoon-page reader__webtoon-page--text"
              data-page={pg.num}
            >
              <div className="reader__text">
                {pg.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </figure>
          ) : (
            <figure
              key={pg.num}
              className="reader__webtoon-page"
              data-page={pg.num}
            >
              <picture>
                <source
                  type="image/webp"
                  srcSet={pg.srcset}
                  sizes="(min-width: 640px) 100vw, 100svw"
                />
                <img
                  className="reader__webtoon-img"
                  src={pg.src}
                  alt=""
                  loading={i < 3 || saveData ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  onError={() => handleImgError(pg.num)}
                />
              </picture>
              {errPages[pg.num] && (
                <ReaderError
                  title="Страница не загрузилась"
                  note="Нажмите «Повторить» или листайте дальше."
                  onRetry={() => retryImg(pg.num)}
                />
              )}
            </figure>
          ),
        )}

        {/* конец главы */}
        {ch && (
          <div className="reader__endafter">
            <p className="meta">
              {getNextChapter(ch.id) ? 'Конец главы' : 'Продолжение следует'}
            </p>
            {getNextChapter(ch.id) ? (
              <button
                type="button"
                className="btn btn--primary reader__endbtn"
                onClick={nextChapter}
              >
                Дальше · {getNextChapter(ch.id).title}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={restartComic}
              >
                В начало
              </button>
            )}
          </div>
        )}

        {/* клик-зоны по краям экрана (мобильный паддинг) */}
        <button
          type="button"
          className="reader__zone reader__zone--prev"
          aria-label="Назад"
          onClick={prevPage}
        />
        <button
          type="button"
          className="reader__zone reader__zone--next"
          aria-label="Вперёд"
          onClick={nextPage}
        />
      </main>

      {/* ----- левая панель: страницы ----- */}
      <aside className="reader__side reader__side--pages">
        <span className="reader__side-label meta">Страница</span>
        <div className="reader__side-arrows">
          <button
            type="button"
            className="reader__side-btn"
            aria-label="Предыдущая страница"
            disabled={!ch || pageNum <= 1}
            onClick={prevPage}
          >
            ↑
          </button>
          <button
            type="button"
            className="reader__side-btn"
            aria-label="Следующая страница"
            disabled={!ch || pageNum >= ch.pages.length}
            onClick={nextPage}
          >
            ↓
          </button>
        </div>
        <div className="reader__counter" aria-live="polite">
          {pageNum}
          <em>/</em>
          {ch?.pages.length ?? 1}
        </div>
        <div className="reader__scale" onClick={handlePageScaleClick}>
          <div
            className="reader__scale-fill"
            style={{ height: ch ? `${(pageNum / ch.pages.length) * 100}%` : '0%' }}
          />
        </div>
      </aside>

      {/* ----- правая панель: главы ----- */}
      <aside className="reader__side reader__side--chapters">
        <span className="reader__side-label meta">Глава</span>
        <div className="reader__side-arrows">
          <button
            type="button"
            className="reader__side-btn"
            aria-label="Предыдущая глава"
            disabled={!getPrevChapter(ch?.id)}
            onClick={prevChapter}
          >
            ↑
          </button>
          <button
            type="button"
            className="reader__side-btn"
            aria-label="Следующая глава"
            disabled={!getNextChapter(ch?.id)}
            onClick={nextChapter}
          >
            ↓
          </button>
        </div>
        <div className="reader__counter" aria-live="polite">
          {chapterIdx}
          <em>/</em>
          {chapters.length}
        </div>
        <div className="reader__scale reader__scale--chapters" aria-label="Главы">
          {chapters.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`reader__chapter-dot${c.id === chapterId ? ' is-active' : ''}`}
              title={c.title}
              aria-label={c.title}
              aria-pressed={c.id === chapterId}
              onClick={() => goChapter(c.id)}
            />
          ))}
        </div>
      </aside>

      {/* ----- мобильная нижняя панель ----- */}
      <footer className="reader__bottom">
        <button
          type="button"
          className="reader__btn"
          aria-label="Предыдущая страница"
          disabled={!ch || pageNum <= 1}
          onClick={prevPage}
        >
          ←
        </button>
        <div
          className="reader__seek"
          role="progressbar"
          aria-label="Прогресс чтения"
          aria-valuemin={1}
          aria-valuemax={ch?.pages.length ?? 1}
          aria-valuenow={pageNum}
        >
          <div
            className="reader__seek-fill"
            style={{ transform: `scaleX(${ch ? pageNum / ch.pages.length : 0})` }}
          />
        </div>
        <button
          type="button"
          className="reader__btn"
          aria-label="Следующая страница"
          disabled={!ch || pageNum >= ch.pages.length}
          onClick={nextPage}
        >
          →
        </button>
        <button
          type="button"
          className="reader__btn"
          aria-label="Главы (G)"
          onClick={() => setPanelOpen(true)}
        >
          Главы
        </button>
      </footer>

      {/* ----- панель глав ----- */}
      {panelOpen && (
        <div
          className="reader__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Навигация по главам"
          ref={panelRef}
          tabIndex={-1}
          data-lenis-prevent
        >
          <div className="reader__panel-card">
            <p className="reader__meta">Оглавление</p>
            {resumePos && (
              <button
                type="button"
                className="reader__resume"
                onClick={() => {
                  setPanelOpen(false);
                  openChapter(resumePos.ch, resumePos.pg);
                }}
              >
                <span className="reader__resume-label">Продолжить чтение</span>
                <span className="reader__resume-target">
                  {getChapter(resumePos.ch)?.title ?? `Глава ${resumePos.ch}`} · стр. {resumePos.pg}
                </span>
              </button>
            )}
            <ul className="reader__chapters">
              {chapters.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`reader__chapter${c.id === chapterId ? ' reader__chapter--active' : ''}`}
                    onClick={() => {
                      setPanelOpen(false);
                      goChapter(c.id);
                    }}
                  >
                    <span className="reader__chapter-num">{c.id}</span>
                    <span className="reader__chapter-titles">
                      <strong>{c.title}</strong>
                      <em>{c.subtitle}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn--ghost" onClick={() => setPanelOpen(false)}>
              Закрыть (Esc)
            </button>
          </div>
        </div>
      )}

      {/* ----- подсказка клавиш ----- */}
      <div className={`reader__hint${hintVisible ? ' reader__hint--visible' : ''}`} role="status">
        ↑ ↓ листать · G главы · Esc выйти
      </div>

      </div>
  );
}