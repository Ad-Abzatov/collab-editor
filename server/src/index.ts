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

interface DocumentRecord {
  id: string;
  title: string;
}

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

async function addDocumentToRegistry(docName: string, title: string) {
  const registryDoc = await persistence.getYDoc(DOCUMENT_REGISTRY);

  const documents = registryDoc.getArray<DocumentRecord>('documents');

  const exists = documents.toArray().some((document) => document.id === docName);

  if (!exists) {
    documents.push([
      {
        id: docName,
        title,
      },
    ]);

    await persistence.storeUpdate(
      DOCUMENT_REGISTRY,
      Y.encodeStateAsUpdate(registryDoc)
    );
  }
}

async function renameDocument(docName: string, title: string) {
  const registryDoc = await persistence.getYDoc(DOCUMENT_REGISTRY);

  const documents = registryDoc.getArray<DocumentRecord>('documents');

  const index = documents.toArray().findIndex((document) => document.id === docName);

  if (index === -1) {
    documents.push([
      {
        id: docName,
        title,
      },
    ]);
  } else {
    documents.delete(index, 1);
    documents.insert(index, [
    {
      id: docName,
      title,
    },
  ]);
  }

  await persistence.storeUpdate(
      DOCUMENT_REGISTRY,
      Y.encodeStateAsUpdate(registryDoc)
  );
}

async function getDocuments(): Promise<DocumentRecord[]> {
  const regystryDoc = await persistence.getYDoc(DOCUMENT_REGISTRY);

  const documents = regystryDoc.getArray('documents');

  return documents.toArray() as DocumentRecord[];
}

async function main() {
  const fastify = Fastify();
  await fastify.register(cors);

  fastify.get('/health', async () => ({ status: 'ok' }));

  fastify.get('/api/documents', async () => {
    const documents = await getDocuments();

    return {documents};
  });

  fastify.post('/api/documents', async (request, reply) => {
    const {title} = request.body as {title?: string};

    const documentTitle = title?.trim() || 'Без названия';
    const roomId = crypto.randomUUID();

    await addDocumentToRegistry(roomId, documentTitle);

    reply.status(201);

    return {
      id: roomId,
      title: documentTitle,
    };
  });

  fastify.patch('/api/documents/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const {title} = request.body as {title?: string};

    if (!title || title.trim().length === 0) {
      reply.status(400);

      return {
        error: 'Title is required',
      };
    }

    await renameDocument(id, title.trim());

    return {
      success: true,
    };
  });

  await fastify.listen({ port: 3001, host: '0.0.0.0' });

  console.log('Server running on http://localhost:3001');

  const wss = new WebSocketServer({ server: fastify.server });

  wss.on('connection', async (ws, req) => {
    const roomName = req.url?.split('?')[0]?.slice(1) || 'default';
    console.log('🔌 Client connected to room', roomName);
    setupWSConnection(ws, req);
  });

  console.log('Yjs WebSocket listening on ws://localhost:3001');
}

main().catch(console.error)
