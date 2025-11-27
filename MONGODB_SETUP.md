# Настройка MongoDB для Vercel

## Проблема
На Vercel файловая система доступна только для чтения. Изменения в JSON файлах **не сохраняются** между деплоями и перезапусками сервера.

## Решение: MongoDB Atlas

### Шаг 1: Создайте аккаунт MongoDB Atlas

1. Перейдите на https://www.mongodb.com/cloud/atlas/register
2. Зарегистрируйтесь (можно использовать Google аккаунт)
3. Выберите бесплатный план **M0 (Free)**

### Шаг 2: Создайте кластер

1. Выберите облачного провайдера (AWS, Google Cloud, или Azure)
2. Выберите регион (ближайший к вам)
3. Нажмите "Create Cluster"
4. Дождитесь создания кластера (2-3 минуты)

### Шаг 3: Настройте доступ к базе данных

1. В боковом меню нажмите **"Database Access"**
2. Нажмите **"Add New Database User"**
3. Выберите **"Password"** как метод аутентификации
4. Введите имя пользователя и пароль (сохраните их!)
5. В разделе "Database User Privileges" выберите **"Read and write to any database"**
6. Нажмите **"Add User"**

### Шаг 4: Настройте сетевой доступ

1. В боковом меню нажмите **"Network Access"**
2. Нажмите **"Add IP Address"**
3. Нажмите **"Allow Access from Anywhere"** (для Vercel это необходимо)
4. Или добавьте IP адреса Vercel: `0.0.0.0/0`
5. Нажмите **"Confirm"**

### Шаг 5: Получите Connection String

1. В боковом меню нажмите **"Database"**
2. Нажмите **"Connect"** на вашем кластере
3. Выберите **"Connect your application"**
4. Скопируйте connection string (выглядит примерно так):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Замените `<username>` и `<password>` на ваши данные из Шага 3
6. Добавьте имя базы данных в конец (перед `?`):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/amelie-cafe?retryWrites=true&w=majority
   ```

### Шаг 6: Добавьте переменные окружения в Vercel

1. Откройте ваш проект на Vercel
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте следующие переменные:

   - **Имя:** `MONGODB_URI`
   - **Значение:** ваш connection string из Шага 5
   - **Environment:** Production, Preview, Development (выберите все)

   - **Имя:** `DB_NAME` (опционально)
   - **Значение:** `amelie-cafe`
   - **Environment:** Production, Preview, Development

4. Нажмите **"Save"**

### Шаг 7: Перезапустите деплой

1. В Vercel перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите **"Redeploy"**

## Локальная разработка

Для локальной разработки вы можете:

### Вариант 1: Использовать файлы (по умолчанию)
Просто не устанавливайте переменную `MONGODB_URI` - приложение будет использовать JSON файлы.

### Вариант 2: Использовать MongoDB локально
1. Установите MongoDB локально или используйте MongoDB Atlas
2. Создайте файл `.env` в папке `server/`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/amelie-cafe?retryWrites=true&w=majority
   DB_NAME=amelie-cafe
   ```
3. Установите пакет `dotenv`: `npm install dotenv`
4. Добавьте в начало `server/index.js`:
   ```javascript
   import 'dotenv/config';
   ```

## Проверка

После настройки:
1. Зайдите на сайт на Vercel
2. Войдите как супервайзер
3. Измените фотографию продукта
4. Обновите страницу
5. Изменения должны сохраниться! ✅

## Важно

- **Бесплатный план MongoDB Atlas** дает 512MB хранилища - этого достаточно для начала
- Данные теперь хранятся в облаке и не теряются при перезапуске
- Все изменения сохраняются в реальном времени


