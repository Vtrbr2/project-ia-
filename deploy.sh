#!/bin/bash

echo "🚀 Iniciando deploy do Content Manager AI..."
echo "📂 Diretório atual: $(pwd)"

# Verificar se estamos no diretório correto
if [ ! -f "render.yaml" ]; then
    echo "❌ Erro: Execute o script a partir da raiz do projeto!"
    exit 1
fi

# Build do frontend
echo "📦 Build do frontend..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro na instalação do frontend"
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend"
    exit 1
fi

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    echo "❌ Pasta dist não encontrada após build"
    exit 1
fi

# Copiar build do frontend para o backend
echo "📁 Copiando build do frontend para backend..."
mkdir -p ../backend/public
cp -r dist/* ../backend/public/

echo "✅ Build do frontend concluído!"

# Instalar dependências do backend
echo "🔧 Instalando dependências do backend..."
cd ../backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro na instalação do backend"
    exit 1
fi

echo "✅✅✅ Deploy local configurado com sucesso!"
echo ""
echo "📝 PRÓXIMOS PASSOS PARA DEPLOY NO RENDER:"
echo "1. 🚀 Envie este código para o GitHub"
echo "2. 🌐 Conecte o repositório no Render.com"
echo "3. ⚙️ Configure as variáveis de ambiente:"
echo "   - MONGODB_URI=sua_uri_mongodb_atlas"
echo "   - JWT_SECRET=seu_jwt_secret_producao"
echo "   - NODE_ENV=production"
echo "4. ✅ O Render fará deploy automático!"
