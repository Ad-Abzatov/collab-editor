declare module 'y-leveldb' {
  import type * as Y from 'yjs';

  export class LeveldbPersistence {
    constructor(
      storegeLocation: string,
      options?: Record<string, unknown>
    );

    getYDoc(docName: string): Promise<Y.Doc>;
    storeUpdate(docName: string, update: Uint8Array): Promise<void>;
    clearDocument(docName: string): Promise<void>;
  }
}