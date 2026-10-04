# Collab Editor

Совместный текстовый редактор в реальном времени на Yjs + WebSocket.

## Стек
- React + TypeScript (клиент)
- Fastify + ws (сервер)
- Yjs (CRDT для синхронизации)

## Запуск

```bash
# Сервер
cd server
npm install
npx tsx src/index.ts

# Клиент
cd client
npm install
npm run dev
```

Откройте http://localhost:5173 в двух вкладках — текст синхронизируется.