import type { FastifyInstance } from "fastify";
import bcrypt from 'bcrypt';
import { createUser, getUserByEmail } from "../services/users";
import type { AuthPayload } from "../types";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/register', async (request, reply) => {
    const { email, password } = request.body as {
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
    const { email, password } = request.body as {
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

  fastify.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie('token', {
      path: '/',
    });

    return {
      ok: true,
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
}