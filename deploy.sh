#!/bin/bash

echo "🚀 Iniciando deploy do Content Manager AI..."

# Build do frontend
echo "📦 Build do frontend..."
cd frontend
npm install
npm run build

# Copiar build do frontend para o backend
echo "📁 Copiando build do frontend..."
cp -r dist ../backend/

echo "✅ Deploy configurado com sucesso!"
echo "📝 Envie para o GitHub e o Render fará o deploy automaticamente"
