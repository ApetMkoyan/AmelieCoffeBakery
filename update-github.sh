#!/bin/bash

# Скрипт для обновления кода в GitHub
# Использование: ./update-github.sh "описание изменений"

cd "$(dirname "$0")"

if [ -z "$1" ]; then
    echo "Использование: ./update-github.sh \"описание изменений\""
    echo "Пример: ./update-github.sh \"Добавлена новая функция корзины\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo "📦 Проверка изменений..."
git status

echo ""
echo "➕ Добавление всех изменений..."
git add .

echo ""
echo "💾 Создание коммита: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

echo ""
echo "🚀 Загрузка в GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Успешно обновлено в GitHub!"
    echo "📝 Коммит: $COMMIT_MESSAGE"
    echo ""
    echo "🔄 Vercel автоматически обновит сайт через несколько минут"
    echo "   Проверьте: https://vercel.com/dashboard"
else
    echo ""
    echo "❌ Ошибка при загрузке"
fi

