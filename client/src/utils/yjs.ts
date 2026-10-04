import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';

export const ydoc = new Y.Doc();

export const provider = new WebsocketProvider(
  'ws://localhost:3001',
  'collab-editor',
  ydoc
);

export const ytext = ydoc.getText('content');

export const connectionStatus = {
  connected: false,
  onChange: (callback: (connected: boolean) => void) => {
    provider.on('status', (event: {status: string}) => {
      callback(event.status === 'connected');
    });
  },
};
