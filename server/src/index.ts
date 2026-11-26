import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import * as Y from 'yjs'
import { WebSocketServer } from 'ws'
import * as utils from 'y-websocket/bin/utils'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'
import { documentRoutes } from './routes/documents'
import { persistence } from './persistence/leveldb'

//npx tsx src/index.ts

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

async function main() {
  const fastify = Fastify();

  await fastify.register(cors, {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await fastify.register(cookie);
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });
  await fastify.register(authRoutes);
  await fastify.register(documentRoutes);

  fastify.get('/health', async () => ({ status: 'ok' }));

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
