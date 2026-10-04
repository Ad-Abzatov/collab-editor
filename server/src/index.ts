import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import * as Y from 'yjs'
import { WebSocketServer } from 'ws'
import { decoding, encoding } from 'lib0'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'

//npx tsx src/index.ts

const docs = new Map<string, Y.Doc>();
const awarenessMap = new Map<string, awarenessProtocol.Awareness>();

async function main() {
  const fastify = Fastify();
  await fastify.register(cors);

  fastify.get('/health', async () => ({ status: 'ok' }));

  await fastify.listen({ port: 3001, host: '0.0.0.0' });
  console.log('Server running on http://localhost:3001');

  const wss = new WebSocketServer({server: fastify.server});

  wss.on('connection', (ws, req) => {
    const roomName = req.url?.split('?')[0]?.slice(1) || 'default';
    console.log('🔌 Client connected to room', roomName);

    let doc = docs.get(roomName);
    if (!doc) {
      doc = new Y.Doc();
      docs.set(roomName, doc);
      console.log('📄 Created new document for room:', roomName);
    }

    let awareness = awarenessMap.get(roomName);
    if (!awareness) {
      awareness = new awarenessProtocol.Awareness(doc);
      awarenessMap.set(roomName, awareness);
    }

    ws.on('message', (message: Buffer) => {
      try {
        const buf = new Uint8Array(message);
        const decoder = decoding.createDecoder(buf)
        const encoder = encoding.createEncoder();
        const messageType = decoding.readVarUint(decoder);

        if (messageType === 0) {
          encoding.writeVarUint(encoder, 0);
          syncProtocol.readSyncMessage(decoder, encoder, doc!, null);
        } else if (messageType === 1) {
          awarenessProtocol.applyAwarenessUpdate(
            awareness!,
            decoding.readVarUint8Array(decoder),
            null
          );
        }

        if (encoding.length(encoder) > 1) {
          ws.send(encoding.toUint8Array(encoder));
        }

        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(message);
          }
        });
      } catch (err) {
        console.error('Error processing Yjs message:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from room:', roomName);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  console.log('Yjs WebSocket listeningon ws://localhost:3001');
}

main().catch(console.error)
