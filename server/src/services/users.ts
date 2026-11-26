import { persistence } from "../persistence/leveldb";
import type { UserRecord } from "../types";
import * as Y from 'yjs';

const USERS_REGISTRY = '__users__';

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const usersDoc = await persistence.getYDoc(USERS_REGISTRY);

  const users = usersDoc.getArray<UserRecord>('users');

  const user = users.toArray().find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

  return user ?? null;
}

export async function createUser(
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
