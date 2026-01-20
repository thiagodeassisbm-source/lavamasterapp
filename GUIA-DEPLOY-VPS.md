# 🚀 GUIA DE DEPLOY NA VPS - Estética Automotiva

## Informações da VPS
- **IP:** 72.60.138.126
- **Usuário:** root
- **Senha:** Isajoca4163998-
- **SO:** AlmaLinux 10

## Passo 1: Conectar na VPS

Abra o PowerShell ou CMD e execute:

```bash
ssh root@72.60.138.126
```

Quando pedir a senha, digite: `Isajoca4163998-`

---

## Passo 2: Atualizar o Sistema

```bash
dnf update -y
```

---

## Passo 3: Instalar Node.js 20

```bash
dnf module reset nodejs -y
dnf module enable nodejs:20 -y
dnf install nodejs -y
```

Verificar instalação:
```bash
node -v
npm -v
```

---

## Passo 4: Instalar Git

```bash
dnf install git -y
```

---

## Passo 5: Instalar Nginx

```bash
dnf install nginx -y
systemctl enable nginx
systemctl start nginx
```

---

## Passo 6: Instalar PM2

```bash
npm install -g pm2
```

---

## Passo 7: Clonar o Projeto

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/thiagodeassisbm/lavamasterapp.git estetica-automotiva
cd estetica-automotiva
```

---

## Passo 8: Instalar Dependências

```bash
npm install --legacy-peer-deps
```

---

## Passo 9: Criar Arquivo .env

```bash
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="lavamaster-secret-2026-production"
EOF
```

---

## Passo 10: Configurar Banco de Dados

```bash
npx prisma generate
npx prisma db push --accept-data-loss
node seed-admin.js
```

---

## Passo 11: Build da Aplicação

```bash
npm run build
```

---

## Passo 12: Iniciar com PM2

```bash
pm2 start npm --name "estetica-automotiva" -- start
pm2 save
pm2 startup
```

**IMPORTANTE:** Copie e execute o comando que aparecer após `pm2 startup`

---

## Passo 13: Configurar Nginx

```bash
cat > /etc/nginx/conf.d/lavamaster.conf << 'EOF'
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
    }
}
EOF
```

---

## Passo 14: Testar e Recarregar Nginx

```bash
nginx -t
systemctl reload nginx
```

---

## Passo 15: Configurar Firewall

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

---

## Passo 16: Verificar Status

```bash
pm2 status
systemctl status nginx
```

---

## ✅ PRONTO!

Seu site deve estar acessível em: **http://app.lavamaster.com.br**

---

## 🔒 Configurar SSL (HTTPS) - OPCIONAL

```bash
dnf install certbot python3-certbot-nginx -y
certbot --nginx -d app.lavamaster.com.br
```

Siga as instruções do Certbot.

---

## 📊 Comandos Úteis

- Ver logs: `pm2 logs estetica-automotiva`
- Reiniciar app: `pm2 restart estetica-automotiva`
- Parar app: `pm2 stop estetica-automotiva`
- Status: `pm2 status`

---

## 🆘 Em Caso de Problemas

1. Ver logs do PM2: `pm2 logs --lines 50`
2. Ver logs do Nginx: `tail -f /var/log/nginx/error.log`
3. Reiniciar tudo: `pm2 restart all && systemctl restart nginx`
