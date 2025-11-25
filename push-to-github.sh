#!/bin/bash

# Скрипт для загрузки кода в GitHub
# Использование: ./push-to-github.sh

cd "$(dirname "$0")"

echo "Проверка состояния git..."
git status

echo ""
echo "Попытка загрузки в GitHub..."
echo "Если запросит пароль, используйте ваш Personal Access Token"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Успешно загружено в GitHub!"
    echo "Репозиторий: https://github.com/ApetMkoyan/AmelieCoffeBakery"
else
    echo ""
    echo "❌ Ошибка при загрузке."
    echo "Проверьте:"
    echo "1. Токен имеет права 'repo'"
    echo "2. Репозиторий существует"
    echo "3. Токен не истек"
fi

