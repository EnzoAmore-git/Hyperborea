import { useParams } from 'react-router-dom';

export default function ReaderPage() {
  const { chapterId, pageNum } = useParams();

  return (
    <main>
      <h1>Читалка</h1>
      <p>
        Заглушка: глава {chapterId}, страница {pageNum}. Полноценная реализация — в Этапе 4.
      </p>
    </main>
  );
}