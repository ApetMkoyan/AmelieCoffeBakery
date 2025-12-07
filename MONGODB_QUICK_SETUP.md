# 🚀 Быстрое подключение MongoDB - КОПИРУЙ И ВСТАВЛЯЙ

## Шаг 1: Получи Connection String в MongoDB Atlas

1. Открой https://cloud.mongodb.com
2. Войди в аккаунт
3. Нажми **"Database"** → выбери кластер **"Amelie"**
4. Нажми **"Connect"**
5. Выбери **"Connect your application"**
6. Скопируй строку подключения (она выглядит так):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Шаг 2: Замени в строке подключения

Замени `<username>` и `<password>` на свои данные, и добавь имя базы данных:

**Было:**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Стало (пример):**
```
mongodb+srv://admin:MyPassword123@cluster0.xxxxx.mongodb.net/amelie-cafe?retryWrites=true&w=majority
```

**ВАЖНО:** Добавь `/amelie-cafe` перед `?` (это имя базы данных)

## Шаг 3: Добавь в Vercel

1. Открой проект на Vercel
2. **Settings** → **Environment Variables**
3. Найди или создай переменную:
   - **Name:** `MONGODB_URI`
   - **Value:** вставь свою строку из Шага 2
   - **Environment:** выбери все (Production, Preview, Development)
4. Нажми **"Save"**

## Шаг 4: Проверь Network Access

1. В MongoDB Atlas → **Network Access**
2. Убедись, что есть правило:
   - **IP Address:** `0.0.0.0/0`
   - **Comment:** "Allow from anywhere"
3. Если нет - добавь:
   - Нажми **"Add IP Address"**
   - Выбери **"Allow Access from Anywhere"**
   - Нажми **"Confirm"**

## Шаг 5: Проверь Database Access

1. В MongoDB Atlas → **Database Access**
2. Убедись, что есть пользователь с правами **"Read and write to any database"**
3. Если нет - создай:
   - Нажми **"Add New Database User"**
   - **Authentication Method:** Password
   - Введи имя и пароль (запомни их!)
   - **Database User Privileges:** Read and write to any database
   - Нажми **"Add User"**

## Шаг 6: Перезапусти деплой

1. В Vercel → **Deployments**
2. Найди последний деплой
3. Нажми **"Redeploy"**
4. Подожди 2-3 минуты

## Шаг 7: Разбуди кластер (если спит)

1. В MongoDB Atlas → **Database** → **Clusters**
2. Найди кластер **"Amelie"**
3. Если видишь "Paused" или "Sleeping":
   - Нажми на три точки (⋮) рядом с кластером
   - Выбери **"Resume"** или **"Wake Up"**
   - Подожди 1-2 минуты

## Готово! ✅

Теперь открой сайт и попробуй загрузить продукты. Подожди 30-60 секунд - кластер проснется автоматически.

---

## 📋 Чек-лист (отметь галочками):

- [ ] Connection String скопирован из MongoDB Atlas
- [ ] В строке заменены `<username>` и `<password>`
- [ ] Добавлено `/amelie-cafe` перед `?` в строке
- [ ] `MONGODB_URI` добавлена в Vercel Environment Variables
- [ ] Network Access разрешает `0.0.0.0/0`
- [ ] Database Access пользователь создан с правами записи
- [ ] Деплой перезапущен на Vercel
- [ ] Кластер разбужен (если был спящим)

