import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './routes/HomePage.jsx';
import ReaderPage from './routes/ReaderPage.jsx';
import NotFoundPage from './routes/NotFoundPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/read/:chapterId/:pageNum" element={<ReaderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}