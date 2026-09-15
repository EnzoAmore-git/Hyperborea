import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
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
    initLenis();
    return () => destroyLenis();
  }, []);

  return (
    <BrowserRouter basename={basename}>
      <div className="app-shell">
        <Navbar />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/read/:chapterId/:pageNum" element={<ReaderPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}