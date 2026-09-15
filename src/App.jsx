import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './routes/HomePage.jsx';
import ReaderPage from './routes/ReaderPage.jsx';
import NotFoundPage from './routes/NotFoundPage.jsx';

// При деплое на GitHub Pages сайт живёт в подпапке /<repo>/ — базовый путь
// задаётся в workflow (VITE_BASE_PATH). Локально переменная не установлена.
const basename = import.meta.env.VITE_BASE_PATH || '';

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/read/:chapterId/:pageNum" element={<ReaderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}