import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import * as Y from 'yjs'
import { WebSocketServer } from 'ws'
import { LeveldbPersistence } from 'y-leveldb'
import * as utils from 'y-websocket/bin/utils'

//npx tsx src/index.ts

const persistence = new LeveldbPersistence('./storage');
const DOCUMENT_REGISTRY = '__documents__';
const {setPersistence, setupWSConnection} = utils;

setPersistence({
  provider: persistence,

  bindState: async (docName: string, ydoc: Y.Doc) => {
    const persistedDoc = await persistence.getYDoc(docName);

    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedDoc));

    ydoc.on('update', (update: Uint8Array) => {
      void persistence.storeUpdate(docName, update).catch(console.error);
    });
  },

  writeState: async (docName: string, ydoc: Y.Doc) => {},
});

async function addDocumentToRegistry(docName: string) {
  const registryDoc = await persistence.getYDoc(DOCUMENT_REGISTRY);

  const documentsIds = registryDoc.getArray('documentsIds');

  if (!documentsIds.toArray().includes(docName)) {
    documentsIds.push([docName]);

    await persistence.storeUpdate(
      DOCUMENT_REGISTRY,
      Y.encodeStateAsUpdate(registryDoc)
    );
  }
}

async function getDocumentsIds(): Promise<string[]> {
  const regystryDoc = await persistence.getYDoc(DOCUMENT_REGISTRY);

  const documentsIds = regystryDoc.getArray('documentsIds');

  return documentsIds.toArray() as string[];
}

async function main() {
  const fastify = Fastify();
  await fastify.register(cors);

  fastify.get('/health', async () => ({ status: 'ok' }));

  fastify.get('/api/documents', async () => {
    const documents = await getDocumentsIds();

    return {documents};
  });

  await fastify.listen({ port: 3001, host: '0.0.0.0' });

  console.log('Server running on http://localhost:3001');

  const wss = new WebSocketServer({ server: fastify.server });

  wss.on('connection', async (ws, req) => {
    const roomName = req.url?.split('?')[0]?.slice(1) || 'default';
    console.log('🔌 Client connected to room', roomName);
    await addDocumentToRegistry(roomName);
    setupWSConnection(ws, req);
  });

  console.log('Yjs WebSocket listening on ws://localhost:3001');
}

main().catch(console.error)
