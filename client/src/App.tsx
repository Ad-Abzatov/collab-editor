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
  const [search, setSearch] = useState('');

  const filteredDocuments = documents.filter((document) => document.title.toLowerCase().includes(search.toLowerCase()));

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

  const deleteDocument = async (documentId: string) => {
    const confirmed = window.confirm('Удалить этот документ?');

    if (!confirmed) return;

    try {
      await fetch(`http://localhost:3001/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      setDocuments((currentDocuments) => currentDocuments.filter((document) => document.id !== documentId))
    } catch (error) {
      console.error('Failed to delete document:', error);
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

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Поиск документов"
        style={{
          width: '100%',
          padding: '0.5rem',
          marginBottom: '1rem',
          boxSizing: 'border-box',
        }}
      />

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
          {filteredDocuments.map((document) => (
            <li
              key={document.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <Link to={`/doc/${document.id}`}>
                {document.title}
              </Link>

              <button
                onClick={() => deleteDocument(document.id)}
                style={{
                  color: '#dc2626',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App
