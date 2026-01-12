# 🚀 Deploy para VPS - Academia SysFit Pro

## Opção 1: Script Automático

Se você tiver **Git Bash** ou **WSL** com `sshpass` instalado:

```bash
bash deploy_vps_complete.sh
```

Este script faz TUDO automaticamente:
- ✅ Atualiza código do GitHub
- ✅ Recria tabelas Wellhub com estrutura correta
- ✅ Compila projeto (npm run build)
- ✅ Reinicia PM2
- ✅ Mostra logs e status

---

## Opção 2: Manual via SSH

### Passo 1: Conectar na VPS

```bash
ssh root@138.197.8.136
```

**Senha:** `935559Emerson@`

### Passo 2: Executar comandos

```bash
cd /var/www/academia

# 1. Atualizar código
git pull origin main

# 2. Recriar tabelas Wellhub
node recreate_wellhub_tables.js

# 3. Compilar projeto
npm run build

# 4. Reiniciar PM2
pm2 restart academia-api

# 5. Verificar logs
pm2 logs academia-api --lines 20
```

---

## 📋 Verificação Pós-Deploy

Acesse o site e teste:

🌐 **Site:** https://www.sysfitpro.com.br

### Páginas para testar:
- ✅ Wellhub Members
- ✅ Bank Accounts - Criação de contas bancárias
- ✅ Cash Flow - Exportação de PDF
- ✅ Defaulters - Exportação de PDF

---

## 🔧 Scripts Disponíveis

### deploy_vps_complete.sh
Deploy completo com todas as etapas (recomendado)

### recreate_wellhub_tables.js
Recria apenas as tabelas Wellhub

### migrate_wellhub_tables_vps.js
Migração inicial (não usar se tabelas já existem)

---

## ⚠️ Troubleshooting

### Erro: "Unknown column 'lastCheckIn'"
**Solução:** Execute node recreate_wellhub_tables.js na VPS

### Erro: "Access denied"
**Solução:** Script usará credenciais do arquivo .env automaticamente

### PM2 não reinicia
**Solução:** Use pm2 list para ver nome correto do processo (deve ser academia-api)

---

## 📞 Suporte

Se encontrar problemas, verifique os logs:

```bash
# Logs do PM2
pm2 logs academia-api --lines 50

# Status do PM2
pm2 status
```
