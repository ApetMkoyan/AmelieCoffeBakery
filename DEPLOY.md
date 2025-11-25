# Инструкция по деплою на Vercel

## Шаг 1: Подготовка GitHub репозитория

1. **Создайте репозиторий на GitHub:**
   - Зайдите на [github.com](https://github.com) и войдите в аккаунт
   - Нажмите "+" в правом верхнем углу → "New repository"
   - Название: `amelie-cafe` (или любое другое)
   - Описание: "Amelie Coffee & Bakery website"
   - Выберите "Public" (или "Private" если хотите)
   - **НЕ** добавляйте README, .gitignore или лицензию (они уже есть в проекте)
   - Нажмите "Create repository"

2. **Загрузите код в GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit: Amelie Cafe website"
   git branch -M main
   git remote add origin https://github.com/ВАШ_ЛОГИН/amelie-cafe.git
   git push -u origin main
   ```
   Замените `ВАШ_ЛОГИН` на ваш логин GitHub.

## Шаг 2: Деплой на Vercel

1. **Создайте аккаунт на Vercel:**
   - Зайдите на [vercel.com](https://vercel.com)
   - Нажмите "Sign Up"
   - Выберите "Continue with GitHub"
   - Разрешите доступ к вашим репозиториям

2. **Импортируйте проект:**
   - Нажмите "Add New Project"
   - Выберите ваш репозиторий `amelie-cafe`
   - Vercel автоматически определит настройки

3. **Настройте переменные окружения:**
   - В разделе "Environment Variables" добавьте:
     - **Name:** `SUPERVISOR_PASSCODE`
     - **Value:** `Amelie123` (или ваш пароль)
   - Нажмите "Add"

4. **Настройки проекта (если нужно):**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (корень проекта)
   - **Build Command:** `cd client && npm install && npm run build`
   - **Output Directory:** `client/dist`
   - **Install Command:** `npm install` (в корне) или оставьте пустым

5. **Деплой:**
   - Нажмите "Deploy"
   - Дождитесь завершения сборки (обычно 2-3 минуты)

6. **Получите ссылку:**
   - После успешного деплоя вы получите ссылку типа:
     `https://amelie-cafe.vercel.app`
   - Эта ссылка будет работать для всех пользователей
   - При каждом обновлении кода в GitHub будет автоматический деплой

## Шаг 3: Настройка для production

После первого деплоя может понадобиться настроить:

1. **Кастомный домен (опционально):**
   - В настройках проекта → Domains
   - Добавьте свой домен (если есть)

2. **Переменные окружения для production:**
   - Убедитесь, что `SUPERVISOR_PASSCODE` добавлена для всех окружений (Production, Preview, Development)

## Альтернатива: Render.com

Если Vercel не подойдет, можно использовать [Render.com](https://render.com):

1. Создайте аккаунт на render.com
2. Подключите GitHub репозиторий
3. Создайте "Web Service"
4. Настройки:
   - **Build Command:** `cd client && npm install && npm run build && cd ../server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Environment:** Node
5. Добавьте переменную окружения `SUPERVISOR_PASSCODE=Amelie123`
6. Нажмите "Create Web Service"

## Проблемы и решения

**Проблема:** Сборка не проходит
- Убедитесь, что все зависимости установлены
- Проверьте, что `package.json` файлы корректны

**Проблема:** API не работает
- Проверьте, что переменные окружения установлены
- Убедитесь, что сервер запускается на правильном порту

**Проблема:** Статические файлы не загружаются
- Проверьте, что `client/dist` создается после сборки
- Убедитесь, что путь к статическим файлам правильный

## Поддержка

Если возникнут проблемы, проверьте логи в Vercel Dashboard → Deployments → выберите деплой → Logs.

