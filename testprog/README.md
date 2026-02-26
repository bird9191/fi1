# TestMaster

Платформа для создания и прохождения онлайн-тестов с удобной системой управления.

## О проекте

TestMaster - это веб-приложение для проведения тестирования и экзаменов. Поддерживает разные типы вопросов, режимы прохождения и статистику результатов.

### Возможности

- Создание тестов с разными типами вопросов (один ответ, несколько, текстовый)
- Два режима прохождения: тренировка и экзамен
- Таймер и ограничение времени
- Статистика и детальные результаты
- Управление пользователями (админ-панель)
- Темная и светлая тема

## Технологии

**Frontend:**
- Vue 3 + TypeScript
- Pinia (управление состоянием)
- Vue Router
- Vite

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT авторизация

## Установка

### Требования

- Node.js 18+
- PostgreSQL 14+

### Фронтенд

```bash
cd testprog
npm install
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### Бэкенд

```bash
cd testprog/server
npm install
npm run dev
```

API будет доступно по адресу `http://localhost:3001`

## Структура проекта

```
testprog/
├── src/
│   ├── components/     # Компоненты
│   ├── views/          # Страницы
│   ├── stores/         # Хранилища Pinia
│   ├── composables/    # Переиспользуемая логика
│   ├── router/         # Роутинг
│   ├── services/       # API сервис
│   └── utils/          # Утилиты
├── server/
│   ├── routes/         # API роуты
│   ├── middleware/     # Middleware
│   ├── prisma/         # Схема БД
│   └── services/       # Бизнес-логика
└── public/             # Статика
```

## Роли пользователей

- **Студент** - проходит тесты, смотрит результаты
- **Учитель** - создает тесты, смотрит статистику студентов
- **Админ** - управляет пользователями и системой

## Разработка

```bash
npm run dev          # Запуск dev сервера
npm run build        # Сборка для продакшена
npm run type-check   # Проверка типов
```

## База данных

Настройка подключения в файле `server/.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/testmaster"
JWT_SECRET="your-secret-key"
```

Применение миграций:

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

## Лицензия

MIT
