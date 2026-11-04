import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

//npm run dev

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/documents');
        const data = await response.json();

        console.log('Documents response:', data);

        setDocuments(data.documents ?? []);
      } catch (error) {
        console.error('Failed to load documents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [location.pathname]);

  return (
    <div style={{maxWidth: '900px', margin: '0 auto', padding: '2rem'}}>

      <h1 style={{marginBottom: '1.5rem', fontSize: '1.875rem'}}>
        Collaborative Editor
      </h1>

      <p style={{marginBottom: '1.5rem', color: '#6b7280'}}>
        Создайте документ и откройте его в двух вкладках и начните печатать — изменения синхронизируются в реальном времени.
      </p>

      <button
        onClick={() => {
          const roomId = crypto.randomUUID();
          navigate(`/doc/${roomId}`);
        }}
      >
        Создать документ
      </button>

      <h2 style={{marginTop: '2rem', marginBottom: '1rem'}}>
        Документы
      </h2>

      {loading ? (
        <p>Загрузка...</p>
      ) : documents.length === 0 ? (
        <p style={{color: '#6b7280'}}>
          Пока нет сохраненных документов
        </p>
      ) : (
        <ul style={{listStyle: 'none', padding: 0}}>
          {documents.map((roomId) => (
            <li key={roomId}>
              <Link to={`/doc/${roomId}`}>
                Документ {roomId.slice(0, 8)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App
