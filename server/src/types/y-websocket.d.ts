declare module 'y-websocket/bin/utils' {
  import type * as Y from 'yjs';

  export interface Persistence {
    provider: unknown;

    bindState: (
      docName: string,
      ydoc: Y.Doc
    ) => void | Promise<void>;

    writeState: (
      docName: string,
      ydoc: Y.Doc
    ) => void | Promise<void>;
  }

  export function setPersistence(persistence: Persistence): void;

  export function setupWSConnection(
    conn: unknown,
    req: unknown,
    opts?: Record<string, unknown>
  ): void;
}