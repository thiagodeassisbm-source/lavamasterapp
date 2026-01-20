#!/bin/bash

# Script de Deploy Automático para VPS
# Sistema: Estética Automotiva
# Servidor: AlmaLinux 10

set -e

echo "🚀 Iniciando configuração da VPS..."

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
dnf update -y

# 2. Instalar Node.js 20
echo "📦 Instalando Node.js 20..."
dnf module reset nodejs -y
dnf module enable nodejs:20 -y
dnf install nodejs -y

# 3. Instalar Git
echo "📦 Instalando Git..."
dnf install git -y

# 4. Instalar Nginx
echo "📦 Instalando Nginx..."
dnf install nginx -y
systemctl enable nginx
systemctl start nginx

# 5. Instalar PM2 globalmente
echo "📦 Instalando PM2..."
npm install -g pm2

# 6. Criar diretório do projeto
echo "📁 Criando diretório do projeto..."
mkdir -p /var/www
cd /var/www

# 7. Clonar repositório
echo "📥 Clonando repositório..."
if [ -d "estetica-automotiva" ]; then
    rm -rf estetica-automotiva
fi
git clone https://github.com/thiagodeassisbm/lavamasterapp.git estetica-automotiva
cd estetica-automotiva

# 8. Instalar dependências
echo "📦 Instalando dependências do projeto..."
npm install --legacy-peer-deps

# 9. Criar arquivo .env
echo "⚙️ Configurando variáveis de ambiente..."
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="lavamaster-secret-2026-production"
EOF

# 10. Gerar Prisma Client e criar banco
echo "🗄️ Configurando banco de dados..."
npx prisma generate
npx prisma db push --accept-data-loss
node seed-admin.js || echo "Seed já executado"

# 11. Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# 12. Configurar PM2
echo "⚙️ Configurando PM2..."
pm2 delete estetica-automotiva || true
pm2 start npm --name "estetica-automotiva" -- start
pm2 save
pm2 startup

# 13. Configurar Nginx
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/conf.d/lavamaster.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name app.lavamaster.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
NGINX_EOF

# 14. Testar e recarregar Nginx
echo "🔄 Recarregando Nginx..."
nginx -t
systemctl reload nginx

# 15. Configurar Firewall
echo "🔥 Configurando Firewall..."
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload || echo "Firewall não disponível"

echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📊 Status dos serviços:"
pm2 status
echo ""
echo "🌐 Seu site está disponível em: http://app.lavamaster.com.br"
echo "⚠️ Para configurar SSL (HTTPS), execute: certbot --nginx -d app.lavamaster.com.br"
