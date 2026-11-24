import { LeveldbPersistence } from "y-leveldb";
import type { DocumentRecord } from "../types";
import * as Y from 'yjs';

const persistence = new LeveldbPersistence('./storage');
const DOCUMENT_REGISTRY = '__documents__';

export async function getDocuments(ownerId: string): Promise<DocumentRecord[]> {
  const registryDoc = await persistence.getYDoc(DOCUMENT_REGISTRY);

  const documents = registryDoc.getArray<DocumentRecord>('documents');

  return documents.toArray().filter((document) => document.ownerId === ownerId) as DocumentRecord[];
}

export async function addDocumentToRegistry(docName: string, title: string, ownerId: string) {
  const registryDoc = await persistence.getYDoc(DOCUMENT_REGISTRY);

  const documents = registryDoc.getArray<DocumentRecord>('documents');

  const exists = documents.toArray().some((document) => document.id === docName);

  if (!exists) {
    documents.push([
      {
        id: docName,
        title,
        ownerId,
      },
    ]);

    await persistence.storeUpdate(
      DOCUMENT_REGISTRY,
      Y.encodeStateAsUpdate(registryDoc)
    );
  }
}

export async function renameDocument(docName: string, title: string, ownerId: string): Promise<void> {
  const registryDoc = await persistence.getYDoc(DOCUMENT_REGISTRY);

  const documents = registryDoc.getArray<DocumentRecord>('documents');

  const index = documents.toArray().findIndex((document) => document.id === docName);

  if (index === -1) {
    throw new Error('Document not found');
  }

  const document = documents.toArray()[index];

  if (document?.ownerId !== ownerId) {
    throw new Error('Forbidden');
  }

  documents.delete(index, 1);
  documents.insert(index, [
    {
      id: document.id,
      title,
      ownerId: document.ownerId,
    },
  ]);

  await persistence.storeUpdate(
      DOCUMENT_REGISTRY,
      Y.encodeStateAsUpdate(registryDoc)
  );
}

export async function deleteDocument(docName: string) {
  const registryDoc = await persistence.getYDoc(DOCUMENT_REGISTRY);
  const documents = registryDoc.getArray<DocumentRecord>('documents');

  const index = documents.toArray().findIndex((document) => document.id === docName);

  if (index !== -1) {
    documents.delete(index, 1);

    await persistence.storeUpdate(
      DOCUMENT_REGISTRY,
      Y.encodeStateAsUpdate(registryDoc)
    );
  }

  await persistence.clearDocument(docName);
}
