import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import * as Y from 'yjs'
import { WebSocketServer } from 'ws'
import { LeveldbPersistence } from 'y-leveldb'
import * as utils from 'y-websocket/bin/utils'
import bcrypt from 'bcrypt'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import type {UserRecord, AuthPayload} from './types'
import { getDocuments, addDocumentToRegistry, renameDocument, deleteDocument } from './services/documents'

//npx tsx src/index.ts

const persistence = new LeveldbPersistence('./storage');
const USERS_REGISTRY = '__users__';
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

async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const usersDoc = await persistence.getYDoc(USERS_REGISTRY);

  const users = usersDoc.getArray<UserRecord>('users');

  const user = users.toArray().find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

  return user ?? null;
}

async function createUser(
  email: string,
  passwordHash: string
): Promise<UserRecord> {
  const usersDoc = await persistence.getYDoc(USERS_REGISTRY);

  const users = usersDoc.getArray<UserRecord>('users');

  const user: UserRecord = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push([user]);

  await persistence.storeUpdate(
    USERS_REGISTRY,
    Y.encodeStateAsUpdate(usersDoc)
  );

  return user;
}

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

  fastify.get('/health', async () => ({ status: 'ok' }));

  fastify.get('/api/documents', async (request, reply) => {
    let userId: string;

    try {
      const payload = await request.jwtVerify<AuthPayload>();

      userId = payload.sub;
    } catch {
      reply.status(401);

      return {
        error: 'Unauthorized',
      };
    }

    const documents = await getDocuments(userId);

    return {documents};
  });

  fastify.post('/api/documents', async (request, reply) => {
    let userId: string;
    try {
      const payload = await request.jwtVerify<AuthPayload>();

      userId = payload.sub;
    } catch {
      reply.status(401);

      return {
        error: 'Unauthorized',
      };
    }

    const {title} = request.body as {title?: string};

    const documentTitle = title?.trim() || 'Без названия';
    const roomId = crypto.randomUUID();

    await addDocumentToRegistry(roomId, documentTitle, userId);

    reply.status(201);

    return {
      id: roomId,
      title: documentTitle,
      ownerId: userId,
    };
  });

  fastify.delete('/api/documents/:id', async (request, reply) => {
    const {id} = request.params as {id: string};

    await deleteDocument(id);

    return {
      success: true,
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

  fastify.post('/api/auth/register', async (request, reply) => {
    const {email, password} = request.body as {
      email?: string;
      password?: string;
    };

    const normalizedEmail = email?.trim().toLowerCase() ?? '';

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      reply.status(400);

      return {
        error: 'Valid email os required',
      };
    }

    if (!password || password.length < 8) {
      reply.status(400);

      return {
        error: 'Password must be at least 8 characters long',
      };
    }

    const existingUser = await getUserByEmail(normalizedEmail);

    if (existingUser) {
      reply.status(409);

      return {
        error: 'User with this email already exists',
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser(normalizedEmail, passwordHash);

    reply.status(201);

    return {
      id: user.id,
      email: user.email,
    };
  });

  fastify.post('/api/auth/login', async (request, reply) => {
    const {email, password} = request.body as {
      email?: string;
      password?: string;
    };

    const normalizedEmail = email?.trim().toLowerCase() ?? '';

    if (!normalizedEmail || !password) {
      reply.status(400);

      return {
        error: 'Email and password are required',
      };
    }

    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      reply.status(401);

      return {
        error: 'Invalid email or password',
      };
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      reply.status(401);

      return {
        error: 'Invalid email or password',
      };
    }

    const token = fastify.jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: '7d',
      }
    );

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });

    return {
      id: user.id,
      email: user.email,
    };
  });

  fastify.get('/api/auth/me', async (request, reply) => {
    try {
      const payload = await request.jwtVerify<AuthPayload>();

      return {
        id: payload.sub,
        email: payload.email,
      };
    } catch {
      reply.status(401);

      return {
        error: 'Unauthorized',
      };
    }
  });

  fastify.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie('token', {
      path: '/',
    });

    return {
      ok: true,
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
