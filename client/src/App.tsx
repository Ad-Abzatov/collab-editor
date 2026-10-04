import { useEffect, useState } from "react";
import { provider } from "./utils/yjs";
import { Editor } from "./components/Editor";

//npm run dev

function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    provider.on('status', (event: {status: string}) => {
      setConnected(event.status === 'connected');
      console.log('Yjs status:', event.status);
    });

    return () => {
    };
  }, []);

  return (
    <div style={{maxWidth: '900px', margin: '0 auto', padding: '2rem'}}>
      <div style={{
        padding: '0.5rem 1rem',
        background: connected ? '#22c55e' : '#ef4444',
        color: 'white',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
        display: 'inline-block',
      }}
      >
        Status: {connected ? 'Connected' : 'Disconnected'}
      </div>

      <h1 style={{marginBottom: '1.5rem', fontSize: '1.875rem'}}>
        Collaborative Editor
      </h1>

      <p style={{marginBottom: '1.5rem', color: '#6b7280'}}>
        Откройте эту страницу в двух вкладках и начните печатать — изменения синхронизируются в реальном времени.
      </p>

      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '1rem',
      }}>
        <Editor/>
      </div>
    </div>
  );
}

export default App
