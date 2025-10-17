#!/bin/bash

set -e  # Para em caso de erro

echo "🚀 Iniciando deploy do Content Manager AI..."
echo "📂 Diretório atual: $(pwd)"

# Verificar estrutura do projeto
echo "🔍 Estrutura do projeto:"
ls -la

# Build do frontend
echo "📦 Build do frontend..."
if [ -d "frontend" ]; then
    cd frontend
    echo "🔧 Instalando dependências do frontend..."
    npm install
    echo "🏗️ Executando build do frontend..."
    npm run build
    
    # Copiar build do frontend para o backend
    echo "📁 Copiando build do frontend para backend..."
    mkdir -p ../backend/public
    cp -r dist/* ../backend/public/
    echo "✅ Frontend build completo e copiado!"
    
    cd ..
else
    echo "❌ Pasta frontend não encontrada"
    exit 1
fi

# Instalar dependências do backend
echo "🔧 Instalando dependências do backend..."
if [ -d "backend" ]; then
    cd backend
    echo "📋 Conteúdo do backend/package.json:"
    cat package.json | grep -A 20 '"dependencies"'
    
    echo "📥 Instalando todas as dependências do backend..."
    npm install
    
    echo "🔍 Verificando se as dependências foram instaladas:"
    ls node_modules | grep express || echo "Express não encontrado em node_modules"
    ls node_modules | grep mongoose || echo "Mongoose não encontrado em node_modules"
    
    echo "✅ Dependências do backend instaladas!"
else
    echo "❌ Pasta backend não encontrada"
    exit 1
fi

echo "✅✅✅ Deploy configurado com sucesso!"
