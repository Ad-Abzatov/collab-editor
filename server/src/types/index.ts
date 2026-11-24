export interface DocumentRecord {
  id: string;
  title: string;
  ownerId: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthPayload {
  sub: string;
  email: string;
}
