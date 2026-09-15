import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Footer from './components/Footer.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import HomePage from './routes/HomePage.jsx';
import ReaderPage from './routes/ReaderPage.jsx';
import NotFoundPage from './routes/NotFoundPage.jsx';
import { initLenis, destroyLenis } from './animations/lenis.js';

// При деплое на GitHub Pages сайт живёт в подпапке /<repo>/ — базовый путь
// задаётся в workflow (VITE_BASE_PATH). Локально переменная не установлена.
const basename = import.meta.env.VITE_BASE_PATH || '';

export default function App() {
  // Гладкий скролл на всех страницах (prefers-reduced-motion — пропуск)
  useEffect(() => {
    // Этап 7.2: lenis подключается лениво, вне критического пути
    void initLenis();
    return () => destroyLenis();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={basename}>
        <div className="app-shell">
          <div className="fx-vignette" aria-hidden="true" />
          <div className="fx-noise" aria-hidden="true" />
          <Navbar />
          <main className="site-main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/read/:chapterId/:pageNum"
                element={
                  <ErrorBoundary label="Читалка не загрузилась">
                    <ReaderPage />
                  </ErrorBoundary>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
          <OfflineBanner />
        </div>
      </BrowserRouter>
    </MotionConfig>
  );
}