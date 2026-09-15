/**
 * Полноэкранная читалка комикса (Этап 4, DoD 4.2–4.4, 4.7).
 * - Фиксированный оверлей поверх всего (z: --z-reader);
 * - зоны клика слева/справа; нижняя sticky-панель прогресса;
 * - GSAP-переходы «справа-налево / слева-направо» + blur (авто-alpha-слои);
 * - клавиатура из design.md; панель глав; подсказка клавиш с авто-скрытием.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { DURATION, EASING } from '../animations/timing.js';
import {
  chapters,
  getChapter,
  getPage,
  getNextChapter,
  getPrevChapter,
  getUpcomingUrls,
} from '../data/comics.js';
import { preloadImages } from '../lib/preload.js';
import { useSaveData } from '../hooks/useSaveData.js';
import { useFocusTrap } from '../lib/focusTrap.js';
import ReaderLoading from './ReaderLoading.jsx';
import ReaderError from './ReaderError.jsx';

const LAYER_IDS = [0, 1];
const LOAD_TIMEOUT = 2500; // скелетон переходит в fallback после таймаута
const RETRY_DELAYS = [1000, 3000, 9000]; // backoff 1с → 3с → 9с, макс. 3 попытки
const HINT_DURATION = 3400;

const CHUNK_SIZE = 1024;
const POSITION_KEY = 'hyperborea:reading-position';

// Синхронизация позиции чтения через localStorage (Этап 6.6)
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

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clampNum = (num, ch) => {
  const n = Number(num);
  if (!Number.isInteger(n)) return 1;
  return Math.max(1, Math.min(n, ch.pages.length));
};

// srcset из WebP-URL страницы (Этап 6.2) + map «webp → оригинал» для fallback
const srcsetFor = (src) => {
  if (!src) return undefined;
  const repl = (w) => src.replace(/-1600\.webp$/i, `-${w}.webp`);
  return `${repl(800)} 800w, ${repl(1200)} 1200w, ${repl(1600)} 1600w`;
};
const FALLBACKS = new Map();
chapters.forEach((ch) =>
  ch.pages.forEach((p) => FALLBACKS.set(p.src, p.fallback)),
);

export default function ComicReader() {
  const params = useParams();
  const navigate = useNavigate();
  const saveData = useSaveData();

  const [chapterId, setChapterId] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [srcs, setSrcs] = useState([null, null]);
  const [layerPages, setLayerPages] = useState([1, 1]);
  const [loading, setLoading] = useState([false, false]);
  const [errMap, setErrMap] = useState({});
  const [chapterLoading, setChapterLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [fatal, setFatal] = useState(false);

  // «Продолжить чтение»: сохранённая позиция, если она отличается от текущего URL
  const resumePos = useMemo(() => {
    const saved = readSavedPosition();
    if (!saved || !getChapter(saved.ch)) return null;
    return saved.ch === params.chapterId && Number(saved.pg) === Number(params.pageNum)
      ? null
      : saved;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chapterIdRef = useRef(null);
  const pageNumRef = useRef(1);
  const layerPagesRef = useRef([1, 1]);
  const chapterLoadingRef = useRef(false);
  const busyRef = useRef(false);
  const pendingRef = useRef(null);
  const queuedRef = useRef(null);
  const frontI = useRef(0);
  const layerEls = useRef([null, null]);
  const layerImgs = useRef([null, null]);
  const attemptsRef = useRef({});
  const loadTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const hintTimerRef = useRef(null);
  const flipTlRef = useRef(null);
  const panelRef = useRef(null);
  const stageRef = useRef(null);
  const exitRef = useRef(null);

  const setPage = (num) => {
    pageNumRef.current = num;
    setPageNum(num);
  };

  const setChapterLoadingState = (v) => {
    chapterLoadingRef.current = v;
    setChapterLoading(v);
  };

  const setLayerPagesState = (arr) => {
    layerPagesRef.current = arr;
    setLayerPages(arr);
  };

  /* ---------- навигация по параметрам URL (единый источник правды) ---------- */
  useEffect(() => {
    const ch = getChapter(params.chapterId);
    if (!ch) {
      setFatal(true);
      return;
    }
    setFatal(false);
    const num = clampNum(params.pageNum, ch);
    if (chapterIdRef.current !== ch.id) {
      openChapter(ch.id, num);
    } else if (num !== pageNumRef.current) {
      if (busyRef.current || chapterLoadingRef.current) {
        // флип/загрузка главы ещё идут — запоминаем цель, догоним после
        queuedRef.current = num;
      } else {
        goTo(num);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.chapterId, params.pageNum]);

  /* ---------- открытие главы ---------- */
  const openChapter = (id, num) => {
    clearTimer(loadTimerRef);
    clearTimer(retryTimerRef);
    flipTlRef.current?.kill();
    flipTlRef.current = null;
    const ch = getChapter(id);
    if (!ch) return;
    const targetNum = clampNum(num, ch);
    const page = getPage(id, targetNum);

    chapterIdRef.current = id;
    setChapterId(id);
    frontI.current = 0;
    pendingRef.current = null;
    queuedRef.current = null;
    busyRef.current = false;
    attemptsRef.current = {};
    setErrMap({});
    setSrcs([page.src, page.src]);
    setLayerPagesState([targetNum, targetNum]);
    setLoading([true, false]);
    setPage(targetNum);
    savePosition(id, targetNum);
    setChapterLoadingState(true);
    setHintVisible(true);

    clearTimer(hintTimerRef);
    hintTimerRef.current = setTimeout(
      () => setHintVisible(false),
      reduceMotion() ? 1 : HINT_DURATION,
    );
  };

  /* ---------- пагинация ---------- */
  const goTo = (num) => {
    if (busyRef.current || chapterLoadingRef.current) return;
    const ch = getChapter(chapterIdRef.current);
    if (!ch) return;
    const targetNum = clampNum(num, ch);
    if (targetNum === pageNumRef.current) return;
    const page = getPage(ch.id, targetNum);
    if (!page) return;

    queuedRef.current = null;
    busyRef.current = true;
    const dir = targetNum > pageNumRef.current ? 1 : -1;
    pendingRef.current = { num: targetNum, dir };
    const back = 1 - frontI.current;

    setSrcs((prev) => {
      const next = [...prev];
      next[back] = page.src;
      return next;
    });
    const nextLayers = [...layerPagesRef.current];
    nextLayers[back] = targetNum;
    setLayerPagesState(nextLayers);
    setLoading((prev) => {
      const next = [...prev];
      next[back] = true;
      return next;
    });
    setErrMap((prev) => {
      if (!(targetNum in prev)) return prev;
      const next = { ...prev };
      delete next[targetNum];
      return next;
    });

    clearTimer(loadTimerRef);
    loadTimerRef.current = setTimeout(() => finalize(), LOAD_TIMEOUT);
  };

  const nextPage = () => {
    if (chapterLoadingRef.current) return;
    const ch = getChapter(chapterIdRef.current);
    if (!ch) return;
    const base = queuedRef.current ?? (pendingRef.current && pendingRef.current.num) ?? pageNumRef.current;
    if (base >= ch.pages.length) {
      const next = getNextChapter(ch.id);
      if (next) navigate(`/read/${next.id}/1`, { replace: true });
      return;
    }
    navigate(`/read/${ch.id}/${base + 1}`);
  };

  const prevPage = () => {
    if (chapterLoadingRef.current) return;
    const ch = getChapter(chapterIdRef.current);
    if (!ch) return;
    const base = queuedRef.current ?? (pendingRef.current && pendingRef.current.num) ?? pageNumRef.current;
    if (base <= 1) {
      const prev = getPrevChapter(ch.id);
      if (prev) navigate(`/read/${prev.id}/${prev.pages.length}`);
      return;
    }
    navigate(`/read/${ch.id}/${base - 1}`);
  };

  /* ---------- завершение перехода (GSAP) ---------- */
  const finalize = () => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    clearTimer(loadTimerRef);

    const { num, dir } = pending;
    const front = layerEls.current[frontI.current];
    const back = layerEls.current[1 - frontI.current];
    if (!front || !back) {
      busyRef.current = false;
      commit(num);
      return;
    }

    const reduced = reduceMotion();
    const dur = reduced ? 0.01 : DURATION.extra / 1000;
    const scale = window.innerWidth >= 768 ? 240 : 120; // выезд примерный в px

    gsap.set(back, { autoAlpha: 0, x: dir > 0 ? scale : -scale, filter: 'blur(10px)', zIndex: 2 });

    const tl = gsap.timeline({
      defaults: { duration: dur, ease: reduced ? 'none' : EASING.smooth },
      onComplete: () => {
        flipTlRef.current = null;
        gsap.set(front, { autoAlpha: 0, x: 0, filter: 'blur(0px)', zIndex: 1 });
        frontI.current = 1 - frontI.current;
        commit(num);
      },
      onInterrupt: () => {
        flipTlRef.current = null;
        frontI.current = 1 - frontI.current;
        commit(num);
      },
    });
    flipTlRef.current = tl;
    tl.to(front, { autoAlpha: 0, x: dir > 0 ? -scale : scale, filter: 'blur(10px)' });
    tl.to(back, { autoAlpha: 1, x: 0, filter: 'blur(0px)' }, '<0.05');
  };

  const commit = (num) => {
    setLoading([false, false]);
    busyRef.current = false;
    setPage(num);
    savePosition(chapterIdRef.current, num);
    const queued = queuedRef.current;
    queuedRef.current = null;
    if (queued != null && queued !== num) goTo(queued);
  };

  /* ---------- состояния загрузки / ошибок ---------- */
  const handleLoad = (i) => {
    setLoading((prev) => {
      if (!prev[i]) return prev;
      const next = [...prev];
      next[i] = false;
      return next;
    });
    setErrMap((prev) => {
      const num = layerPagesRef.current[i];
      if (!(num in prev)) return prev;
      const next = { ...prev };
      delete next[num];
      return next;
    });

    const pending = pendingRef.current;
    if (pending && layerPagesRef.current[i] === pending.num) {
      finalize();
      return;
    }
    // первичная загрузка первой страницы главы (front)
    if (i === frontI.current && chapterLoadingRef.current) {
      setChapterLoadingState(false);
      const el = layerEls.current[i];
      if (el) {
        const reduced = reduceMotion();
        gsap.fromTo(
          el,
          { opacity: 0, y: renderPx() },
          { opacity: 1, y: 0, duration: reduced ? 0.01 : DURATION.extra / 1000, ease: reduced ? 'none' : EASING.smooth },
        );
      }
    }
  };

  const renderPx = () => (typeof window !== 'undefined' && window.innerWidth >= 768 ? 28 : 16);

  const handleError = (i) => {
    const pending = pendingRef.current;
    const num =
      pending && layerPagesRef.current[i] === pending.num
        ? pending.num
        : layerPagesRef.current[i];
    const attempts = (attemptsRef.current[num] || 0) + 1;
    attemptsRef.current[num] = attempts;

    if (attempts > RETRY_DELAYS.length) {
      markError(num, i);
      return;
    }
    const delay = RETRY_DELAYS[attempts - 1];
    clearTimer(retryTimerRef);
    retryTimerRef.current = setTimeout(() => {
      const img = layerImgs.current[i];
      if (img) img.src = img.src; // перезапуск загрузки той же страницы
    }, delay);
  };

  const markError = (num, i) => {
    setErrMap((prev) => ({ ...prev, [num]: true }));
    setLoading((prev) => {
      const next = [...prev];
      next[i] = false;
      return next;
    });
    const pending = pendingRef.current;
    if (pending && pending.num === num) finalize(); // перелистнём на плейсхолдер
  };

  const retryLayer = (i) => {
    const num = layerPagesRef.current[i];
    attemptsRef.current[num] = 0;
    setErrMap((prev) => {
      if (!(num in prev)) return prev;
      const next = { ...prev };
      delete next[num];
      return next;
    });
    setLoading((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
    const img = layerImgs.current[i];
    if (img) img.src = img.src;
  };

  /* ---------- глобальный слушатель клавиатуры (DoD 4.7) ---------- */
  useEffect(() => {
    const onKeyDown = (e) => {
      const handled = ['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', ' ', 'Home', 'End', 'g', 'G', 'Escape', 'm'];
      if (!handled.includes(e.key)) return;

      if (panelOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setPanelOpen(false);
        } else if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          setPanelOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          nextPage();
          break;
        case 'Home':
          e.preventDefault();
          if (chapterIdRef.current) navigate(`/read/${chapterIdRef.current}/1`);
          break;
        case 'End':
          e.preventDefault();
          const ch = getChapter(chapterIdRef.current);
          if (ch) navigate(`/read/${ch.id}/${ch.pages.length}`);
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setPanelOpen(true);
          break;
        case 'Escape':
          e.preventDefault();
          exitReader();
          break;
        case 'm':
          // в читалке нет видео — клавиша из таблицы дизайна не имеет действия
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);

  const exitReader = () => {
    navigate('/', { replace: true });
  };

  /* ---------- предзагрузка следующих страниц (DoD 4.6, 6.8) ---------- */
  useEffect(() => {
    const ch = getChapter(chapterId);
    if (!ch) return;
    // При Save-Data предзагружаем только ближайшую страницу (экономия трафика)
    const count = saveData ? 1 : 2;
    preloadImages(getUpcomingUrls(ch.id, pageNum, count));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, pageNum, saveData]);

  /* ---------- блокировка скролла + фокус при входе ---------- */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    stageRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimer(loadTimerRef);
      clearTimer(retryTimerRef);
      clearTimer(hintTimerRef);
    };
  }, []);

  /* ---------- фокус в панель глав ---------- */
  useEffect(() => {
    if (panelOpen) panelRef.current?.focus();
  }, [panelOpen]);

  // Фокус-ловушка + inert на фоне читалки (DoD 6.1)
  useFocusTrap({
    active: panelOpen,
    rootRef: panelRef,
    inertSelectors: ['.navbar', '.site-footer', '.reader__stage', '.reader__top', '.reader__seek', '.reader__zone'],
  });

  const clearTimer = (ref) => {
    if (ref.current) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  };

  /* ---------- рендер ---------- */
  const ch = chapterId ? getChapter(chapterId) : null;
  const progress = ch ? pageNum / ch.pages.length : 0;
  const currentPage = ch ? ch.pages[pageNum - 1] : null;

  return (
    <div className="reader" ref={stageRef} tabIndex={0} aria-label={`Читалка: ${ch ? ch.title : ''}`}>
      <div className="reader__stage">
        {LAYER_IDS.map((i) => (
          <div
            key={i}
            className="reader__layer"
            ref={(el) => {
              layerEls.current[i] = el;
            }}
          >
            <picture>
              <source
                type="image/webp"
                srcSet={srcsetFor(srcs[i])}
                sizes="(min-width: 640px) 100vw, 100svw"
              />
              <img
                className="reader__img"
                ref={(el) => {
                  layerImgs.current[i] = el;
                }}
                src={srcs[i] || (currentPage ? currentPage.fallback : undefined)}
                alt=""
                decoding="async"
                draggable={false}
                onLoad={() => handleLoad(i)}
                onError={() => handleError(i)}
              />
            </picture>
            {loading[i] && <ReaderLoading label="Загрузка страницы…" />}
            {errMap[layerPages[i]] && (
              <ReaderError
                title="Страница не загрузилась"
                note="Нажмите «Повторить» или листайте дальше."
                onRetry={() => retryLayer(i)}
              />
            )}
          </div>
        ))}
      </div>

      {/* зоны клика вперёд/назад */}
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

      {/* верхняя панель */}
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
          {currentPage && ch ? ` · стр. ${pageNum} / ${ch.pages.length}` : ''}
        </p>
        <button
          type="button"
          className="reader__btn reader__btn--chapters"
          aria-label="Главы (G)"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((v) => !v)}
        >
          Главы
        </button>
      </header>

      {/* панель глав */}
      {panelOpen && (
        <div
          className="reader__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Навигация по главам"
          ref={panelRef}
          tabIndex={-1}
        >
          <div className="reader__panel-card">
            <p className="reader__meta">Оглавление</p>
            {resumePos && (
              <button
                type="button"
                className="reader__resume"
                onClick={() => {
                  setPanelOpen(false);
                  navigate(`/read/${resumePos.ch}/${resumePos.pg}`);
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
                      if (c.id !== chapterIdRef.current) {
                        navigate(`/read/${c.id}/1`, { replace: true });
                      }
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

      {/* нижняя панель прогресса */}
      <footer className="reader__bottom">
        <button
          type="button"
          className="reader__btn"
          aria-label="Предыдущая страница"
          disabled={busyRef.current || chapterLoading || !ch || pageNum <= 1}
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
          <div className="reader__seek-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <button
          type="button"
          className="reader__btn"
          aria-label="Следующая страница"
          disabled={busyRef.current || chapterLoading || !ch}
          onClick={nextPage}
        >
          →
        </button>
      </footer>

      {/* подсказка клавиш */}
      <div className={`reader__hint${hintVisible ? ' reader__hint--visible' : ''}`} role="status">
        ← → листать · G главы · Esc выйти
      </div>

      {/* полноэкранная загрузка главы */}
      {chapterLoading && <ReaderLoading full label="Загрузка главы…" />}

      {/* фатальная ошибка — глава недоступна */}
      {fatal && (
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
      )}
    </div>
  );
}