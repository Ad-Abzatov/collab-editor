import type { FastifyInstance } from "fastify";
import type { AuthPayload } from "../types";
import { addDocumentToRegistry, deleteDocument, getDocuments, renameDocument } from "../services/documents";

export async function documentRoutes(fastify: FastifyInstance) {
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

    return { documents };
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

    const { title } = request.body as { title?: string };

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
    const { id } = request.params as { id: string };

    await deleteDocument(id);

    return {
      success: true,
    };
  });

  fastify.patch('/api/documents/:id', async (request, reply) => {
    let userId: string;

    try {
      const payload = await request.jwtVerify<AuthPayload>();

      userId = payload.sub;
    } catch {
      reply.status(401);

      return {
        error: 'Uauthorized',
      };
    }

    const { id } = request.params as { id: string };
    const { title } = request.body as { title?: string };

    if (!title || title.trim().length === 0) {
      reply.status(400);

      return {
        error: 'Title is required',
      };
    }

    try {
      await renameDocument(id, title.trim(), userId);
    } catch (error) {
      const message = error instanceof Error
      ? error.message
      : 'Unknown error';

      if (message === 'Document not found') {
        reply.status(404);

        return {
          error: 'Document not found',
        };
      }

      if (message === 'Forbidden') {
        reply.status(403);

        return {
          error: 'Forbidden',
        };
      }

      reply.status(500);

      return {
        error: 'Failed to rename document',
      };
    }

    return {
      success: true,
    };
  });
}