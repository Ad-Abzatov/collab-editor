# Collab Editor

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Yjs](https://img.shields.io/badge/Yjs-CRDT-blueviolet?style=for-the-badge)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)

Совместный текстовый редактор в реальном времени на **React + TypeScript + Yjs (CRDT)** с собственным WebSocket-сервером на **Fastify**.

## Live Demo

> Вставьте ссылку на деплой, когда будет (например, Vercel + Render/Railway).

## Особенности

- Совместное редактирование текста в реальном времени (CRDT через Yjs)
- Создание документов с названиями
- Список документов с поиском по названию
- Переименование документов
- Удаление документов вместе с их данными
- Несколько комнат: каждый URL `http://localhost:5173/doc/abc123` — отдельная комната
- Сохранение документов на сервере (LevelDB)
- TypeScript на клиенте и сервере
- Минималистичный UI

## Стек

- **Frontend**: React 18, TypeScript, Vite, Yjs, y-websocket
- **Backend**: Node.js, Fastify, WebSocket, y-protocols, y-leveldb
- **Хранение**: LevelDB (инкрементальные Yjs-обновления)

## Скриншот

![Демонстрация совместного редактора](demo.gif)
Изменения, внесённые в одной вкладке, появляются в другой в реальном времени.

## Быстрый старт

### Требования

- Node.js 18+
- npm или pnpm

### Установка

```bash
# Клонировать репозиторий
git clone [https://github.com/Ad-Abzatov/collab-editor.git](https://github.com/Ad-Abzatov/collab-editor.git)
cd collab-editor

# Установить зависимости
cd client && npm install
cd ../server && npm install
```

### Запуск

```bash
# Терминал 1 — сервер
cd server
npx tsx src/index.ts

# Терминал 2 — клиент
cd client
npm run dev
```

Откройте `http://localhost:5173` в двух вкладках браузера и начните печатать.

## Как это работает

1. Пользователь создаёт документ через `POST /api/documents`
2. Сервер генерирует `roomId`, сохраняет название и добавляет документ в реестр
3. Клиент открывает `/doc/<roomId>` и создаёт собственный `Y.Doc`
4. Клиент подключается к комнате через `y-websocket`
5. Сервер синхронизирует изменения между клиентами и сохраняет updates в LevelDB
6. CRDT объединяет одновременные правки без конфликтов

## Что можно добавить

- Rich-text (Tiptap + Yjs)
- Курсоры пользователей (awareness)
- Аутентификацию, личные документы и права доступа
- Историю версий
- Экспорт в Markdown и PDF
- Деплой на Vercel + Railway/Render

## Лицензия

MIT