import { useEffect, useState } from 'react';
import {useParams} from 'react-router-dom';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { Editor } from '../components/Editor';

export default function DocumentPage() {
  const {roomId} = useParams<{roomId: string}>();
  const [connected, setConnected] = useState(false);
  const [ytext, setYtext] = useState<Y.Text | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('content');

    const provider = new WebsocketProvider(
      'ws://localhost:3001',
      roomId,
      ydoc
    );

    provider.on('status', (event: {status: string}) => {
      setConnected(event.status === 'connected');
    });

    setYtext(ytext);

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  if (!roomId || !ytext) return null;

  return (
    <div>
      <div>
        Status: {connected ? 'Connected' : 'Disconnected'}
      </div>
      <Editor ytext={ytext}/>
    </div>
  );
}
