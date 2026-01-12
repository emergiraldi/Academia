# ✅ SETUP COMPLETO - Sistema de Academia

## 🎉 Banco de Dados Configurado!

### O que foi criado:

#### 1. **Banco de Dados**
- ✅ Banco `academia_db` criado no MySQL (XAMPP)
- ✅ 14 tabelas criadas com sucesso
- ✅ Dados iniciais inseridos

#### 2. **Tabelas Criadas**
1. `gyms` - Academias (multi-tenant)
2. `users` - Usuários do sistema
3. `students` - Perfil de alunos
4. `plans` - Planos de mensalidade
5. `subscriptions` - Assinaturas de alunos
6. `payments` - Pagamentos e mensalidades
7. `medical_exams` - Exames médicos
8. `workouts` - Fichas de treino
9. `exercises` - Biblioteca de exercícios
10. `workout_exercises` - Exercícios dos treinos
11. `access_logs` - Logs de entrada/saída
12. `control_id_devices` - Dispositivos Control ID
13. `pix_webhooks` - Histórico de webhooks PIX
14. `password_reset_tokens` - Tokens de recuperação de senha

#### 3. **Dados Iniciais**

**Academia Demo Criada:**
- Nome: Academia FitLife
- Slug: fitlife
- Email: contato@fitlife.com

**Usuários Cadastrados:**

1. **Admin da Academia**
   - Email: `admin@fitlife.com`
   - Senha: `admin123`
   - Role: gym_admin

2. **Professor**
   - Email: `carlos@fitlife.com`
   - Senha: `prof123`
   - Role: professor

3. **Aluno de Teste**
   - Email: `joao@email.com`
   - Senha: `aluno123`
   - Role: student
   - Matrícula: FIT001
   - Status: Ativo
   - Plano: Mensal (R$ 150,00)

**Planos Criados:**
1. Plano Mensal - R$ 150,00 (30 dias)
2. Plano Trimestral - R$ 400,00 (90 dias)
3. Plano Anual - R$ 1.200,00 (365 dias)

**Exercícios na Biblioteca:**
1. Supino Reto (Peitoral)
2. Agachamento Livre (Pernas)
3. Rosca Direta (Braços)
4. Desenvolvimento (Ombros)
5. Puxada Frontal (Costas)

**Treino Criado:**
- Nome: Treino de Força
- Aluno: João Santos
- Professor: Carlos Silva
- Dia A: Supino Reto (4x12-10-8-6), Desenvolvimento (3x12)

## 🚀 Como Iniciar o Sistema

### Opção 1: Teste de Conexão (Recomendado)

```bash
cd academia-system
node test_connection.js
```

Este script vai verificar se tudo está funcionando.

### Opção 2: Iniciar o Servidor

**Problema:** O npm install falhou devido ao caminho UNC do Mac.

**Solução Temporária:**
1. Copie a pasta `academia-system` para `C:\Users\emerson\Documents\`
2. Navegue até lá:
   ```bash
   cd C:\Users\emerson\Documents\academia-system
   ```
3. Instale as dependências:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Inicie o servidor:
   ```bash
   npm run dev
   ```

### Opção 3: Usar PowerShell ou CMD

```cmd
cd "C:\Mac\Home\Documents\sistema de academ,ia\Como criar um projeto_\academia-system"
npm install --legacy-peer-deps
npm run dev
```

## 📝 Configurações Importantes

### Arquivo `.env` Criado

Já está configurado com:
- ✅ Conexão com banco de dados local
- ✅ Porta 3000
- ⚠️ Email SMTP (precisa configurar)
- ⚠️ PIX Efí Pay (precisa configurar depois)

### Para Configurar Email:

1. Acesse https://myaccount.google.com/apppasswords
2. Gere uma senha de app
3. Edite o `.env` e configure:
   ```env
   SMTP_USER=seu-email@gmail.com
   SMTP_PASSWORD=senha-app-gerada
   ```

## 🧪 Testar o Sistema

### 1. Teste Manual do Banco

Abra MySQL Workbench ou phpMyAdmin e execute:

```sql
USE academia_db;

-- Ver todos os usuários
SELECT * FROM users;

-- Ver alunos
SELECT s.*, u.name, u.email
FROM students s
JOIN users u ON s.userId = u.id;

-- Ver planos
SELECT * FROM plans;

-- Ver pagamentos
SELECT * FROM payments;
```

### 2. Logins de Teste

Quando o sistema estiver rodando:

**Admin:**
- URL: http://localhost:3000/admin
- Email: admin@fitlife.com
- Senha: admin123

**Professor:**
- URL: http://localhost:3000/professor/login
- Email: carlos@fitlife.com
- Senha: prof123

**Aluno:**
- URL: http://localhost:3000/student/login
- Email: joao@email.com
- Senha: aluno123

## 📂 Arquivos Importantes

- `create_tables.sql` - Script de criação das tabelas (já executado)
- `seed_data.sql` - Dados iniciais (já executado)
- `setup_database.sql` - Script completo de setup
- `.env` - Configurações do ambiente
- `.env.example` - Template de configurações
- `test_connection.js` - Script de teste de conexão
- `INSTALACAO.md` - Guia detalhado de instalação
- `ESTRUTURA.md` - Estrutura do projeto

## ✅ Checklist de Conclusão

- [x] MySQL rodando (XAMPP)
- [x] Banco `academia_db` criado
- [x] 14 tabelas criadas
- [x] Dados iniciais inseridos
- [x] Arquivo `.env` configurado
- [x] Academia demo criada
- [x] Usuários de teste criados
- [x] Planos cadastrados
- [ ] Dependências instaladas (npm install)
- [ ] Servidor iniciado (npm run dev)
- [ ] Email configurado (opcional)
- [ ] PIX configurado (opcional)

## 🎯 Próximos Passos

1. **Resolver o npm install** (movendo projeto para C:\ ou usando CMD)
2. **Iniciar o servidor** com `npm run dev`
3. **Testar os logins** de admin, professor e aluno
4. **Configurar email** (opcional)
5. **Implementar funcionalidades pendentes**:
   - Tela de recuperação de senha
   - Sistema de progressão de treinos
   - Alertas de exame médico
   - Filtros de pagamentos
   - Upload de fotos/vídeos
   - Tela de logs de acesso

## 🆘 Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se o XAMPP está rodando
- Abra phpMyAdmin: http://localhost/phpmyadmin
- Verifique se o banco `academia_db` existe

### Erro: "npm install failed"
- Mova o projeto para `C:\Users\emerson\Documents\`
- Use CMD ou PowerShell em vez do bash

### Erro: "Port 3000 already in use"
- Mude a porta no `.env`: `PORT=3001`

---

**✨ Setup concluído com sucesso!**

**Desenvolvido com ❤️ usando Manus AI**
