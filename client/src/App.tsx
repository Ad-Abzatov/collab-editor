import { useEffect, useState } from "react";
import { provider } from "./utils/yjs";
import { Editor } from "./components/Editor";
import { useNavigate } from "react-router-dom";

//npm run dev

function App() {
  const navigate = useNavigate();

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
    </div>
  );
}

export default App
