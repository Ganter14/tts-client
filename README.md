# TTS Client (Electron)

Десктопное приложение на Electron, Vue 3 и Vite: приём потока синтеза речи по WebSocket, воспроизведение аудио и передача сигнала для lipsync (VTube Studio).

## Требования

- Node.js (LTS)
- Запущенный TTS Server с доступным OpenAPI (для генерации типов клиента)

## Установка

```sh
npm install
```

Перед первой сборкой сгенерируйте типы и клиент API (сервер должен отдавать `openapi.json` по адресу из `orval.config.ts` или задайте `OPENAPI_SPEC`):

```sh
npm run types:api
```

## Скрипты

| Команда             | Назначение                                                        |
| ------------------- | ----------------------------------------------------------------- |
| `npm run dev`       | Режим разработки (Vite + Electron)                                |
| `npm run build`     | Проверка типов, сборка renderer и упаковка через electron-builder |
| `npm run preview`   | Предпросмотр собранного веб-бандла                                |
| `npm run types:api` | Генерация TypeScript-клиента и моделей (Orval)                    |

## Структура каталогов

- `electron/main` — процесс Electron (окно, IPC)
- `electron/preload` — изолированный скрипт загрузки
- `src` — интерфейс (Vue, Vuetify, маршрутизация)
- `generated/` — сгенерированный код API (не коммитится; создаётся `types:api`)
