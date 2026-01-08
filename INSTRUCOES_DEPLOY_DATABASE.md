# 🚀 Instruções para Deploy do Banco de Dados

## ✅ Backup criado com sucesso!
- **Arquivo**: `academia_db_backup.sql`
- **Tamanho**: 1.10 MB
- **Localização**: `C:\Projeto\Academia\academia_db_backup.sql`

---

## 📤 Passo 1: Upload do Backup para VPS

Execute este comando no **PowerShell** ou **CMD**:

```powershell
scp academia_db_backup.sql root@138.197.8.136:/var/www/academia/
```

**Quando pedir a senha, digite**: `935559Emerson@`

---

## 🗄️ Passo 2: Restaurar o Banco na VPS

Execute este comando no **PowerShell** ou **CMD**:

```powershell
ssh root@138.197.8.136
```

**Quando pedir a senha, digite**: `935559Emerson@`

Depois que estiver conectado na VPS, execute:

```bash
cd /var/www/academia

# Atualizar código
git pull origin main

# Dropar banco existente
mysql -u root -e "DROP DATABASE IF EXISTS academia_db;"

# Restaurar backup
mysql -u root < academia_db_backup.sql

# Remover arquivo de backup
rm academia_db_backup.sql

# Compilar projeto
npm run build

# Reiniciar PM2
pm2 restart academia-api

# Ver logs
pm2 logs academia-api --lines 30 --nostream

# Sair da VPS
exit
```

---

## 🎯 Alternativa: Comando Único

Se preferir, execute tudo de uma vez (no PowerShell/CMD local):

```powershell
scp academia_db_backup.sql root@138.197.8.136:/var/www/academia/ && ssh root@138.197.8.136 "cd /var/www/academia && git pull origin main && mysql -u root -e 'DROP DATABASE IF EXISTS academia_db;' && mysql -u root < academia_db_backup.sql && rm academia_db_backup.sql && npm run build && pm2 restart academia-api && sleep 3 && pm2 logs academia-api --lines 30 --nostream"
```

**Quando pedir senha (2 vezes), digite**: `935559Emerson@`

---

## ✅ Resultado Esperado

Após executar, você terá:
- ✅ Todos os 873 exercícios com fotos
- ✅ Alunos com professores vinculados
- ✅ Campos de endereço completos
- ✅ Todos os dados sincronizados entre local e VPS

---

## 🌐 Verificar

Acesse: **https://www.sysfitpro.com.br**

- Entre na área de treinos → deve mostrar 873 exercícios
- Entre na área de alunos → deve mostrar professores vinculados
