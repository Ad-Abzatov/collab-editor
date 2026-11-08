import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

//npm run dev

interface DocumentRecord {
  id: string;
  title: string;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createDocument = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('http://localhost:3001/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || 'Без названия',
        }),
      });

      const data = await response.json();

      setTitle('');
      navigate(`/doc/${data.id}`);
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setIsCreating(false);
    }
  };

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

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Название документа"
      />

      <button onClick={createDocument} disabled={isCreating}>
        {isCreating ? 'Создание...' : 'Создать документ'}
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
          {documents.map((document) => (
            <li key={document.id}>
              <Link to={`/doc/${document.id}`}>
                {document.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App
