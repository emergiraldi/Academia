# 🚀 Guia de Instalação - Sistema de Academia

## Pré-requisitos

- Node.js 22+ instalado
- MySQL 8+ instalado e rodando
- npm ou pnpm instalado

## Passo 1: Configurar Banco de Dados

### Opção A: Usando MySQL Workbench

1. Abra o MySQL Workbench
2. Conecte-se ao seu servidor MySQL (localhost, user: root, sem senha)
3. Abra o arquivo `setup_database.sql`
4. Execute o script completo (Ctrl+Shift+Enter)
5. Verifique se as tabelas foram criadas

### Opção B: Usando phpMyAdmin

1. Acesse phpMyAdmin (http://localhost/phpmyadmin)
2. Clique em "Import"
3. Selecione o arquivo `setup_database.sql`
4. Clique em "Go"

### Opção C: Linha de comando

Se o MySQL estiver no PATH:

```bash
# Windows (CMD como Administrador)
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root < setup_database.sql

# Linux/Mac
mysql -u root < setup_database.sql
```

## Passo 2: Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e configure:

```env
# Banco de Dados
DATABASE_URL=mysql://root@localhost:3306/academia_db

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app-gmail
SMTP_FROM_NAME=Academia Sistema
SMTP_FROM_EMAIL=noreply@academia.com
```

### Como gerar senha de app do Gmail:

1. Acesse https://myaccount.google.com/security
2. Ative "Verificação em duas etapas"
3. Acesse https://myaccount.google.com/apppasswords
4. Gere uma senha de app
5. Use essa senha no `.env`

## Passo 3: Instalar Dependências

```bash
npm install --legacy-peer-deps
```

ou

```bash
pnpm install
```

## Passo 4: Aplicar Schema ao Banco

```bash
npm run db:push
```

ou manualmente execute o arquivo `create_tables.sql` no MySQL.

## Passo 5: Iniciar Servidor

### Modo Desenvolvimento

```bash
npm run dev
```

### Modo Produção

```bash
npm run build
npm start
```

## Passo 6: Acessar o Sistema

Abra o navegador em: `http://localhost:3000`

### Logins de Teste

**Admin (se criou dados iniciais)**
- Email: admin@sistema.com
- Senha: admin123

**Ou use OAuth da Manus**
- Acesse `/admin` e faça login com sua conta Manus

## Verificação de Instalação

Execute este checklist:

- [ ] MySQL rodando
- [ ] Banco `academia_db` criado
- [ ] Tabelas criadas (19 tabelas)
- [ ] Arquivo `.env` configurado
- [ ] Dependências instaladas
- [ ] Servidor iniciado sem erros
- [ ] Consegue acessar http://localhost:3000

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor dev

# Banco de Dados
npm run db:push          # Aplica schema
npm run db:studio        # Abre interface visual do banco

# Build
npm run build            # Build para produção
npm run start            # Inicia produção

# Testes
npm test                 # Executa testes
```

## Troubleshooting

### Erro: "Cannot connect to database"

1. Verifique se o MySQL está rodando
2. Verifique as credenciais no `.env`
3. Teste a conexão:

```bash
mysql -u root -e "SELECT 1"
```

### Erro: "Port 3000 already in use"

Mude a porta no arquivo `.env`:

```env
PORT=3001
```

### Erro: "SMTP Authentication failed"

1. Verifique se você gerou a senha de app do Gmail
2. Não use sua senha normal do Gmail
3. Certifique-se que a verificação em 2 etapas está ativa

## Próximos Passos

Após instalar:

1. **Criar sua primeira academia**: Acesse `/admin` → Academias
2. **Cadastrar alunos**: Acesse `/admin/students`
3. **Configurar planos**: Acesse `/admin/plans`
4. **Configurar Control ID** (opcional): `/admin/control-id-devices`
5. **Configurar PIX** (opcional): Configure as variáveis no `.env`

## Suporte

- Documentação completa: `DOCUMENTACAO-COMPLETA.md`
- Estrutura do projeto: `ESTRUTURA.md`
- Issues: https://github.com/seu-repo/issues

---

**Instalação concluída com sucesso!** 🎉
