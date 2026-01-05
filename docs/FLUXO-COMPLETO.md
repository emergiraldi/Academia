# Fluxo Completo de Uso do Sistema

Este documento descreve todo o fluxo de uso do sistema de academia, desde a contratação até o acesso do aluno pela leitora facial.

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO DO SISTEMA                    │
└─────────────────────────────────────────────────────────────────┘

1. CONTRATAÇÃO (Dono da Academia)
   └─> Cadastra academia no site
       └─> Recebe email com credenciais de admin
           └─> Faz login no painel admin

2. INSTALAÇÃO LOCAL (Técnico/Dono)
   └─> Instala agent na academia
       └─> Conecta com a VPS
           └─> Sistema pronto para uso

3. CADASTRO DE ALUNO (Admin ou Auto-cadastro)
   └─> Aluno é cadastrado no sistema
       └─> Recebe login e senha
           └─> Escolhe/paga plano

4. CADASTRO FACIAL (Admin/Recepcionista)
   └─> Aluno vai até a leitora
       └─> Face é cadastrada
           └─> Sistema libera acesso

5. USO DIÁRIO (Aluno)
   └─> Aproxima do dispositivo
       └─> Leitora reconhece face
           └─> Acesso liberado/bloqueado
               └─> Log registrado no sistema
```

---

## FASE 1: Contratação e Configuração Inicial

### 1.1 Dono da Academia Contrata o Sistema

**URL:** https://seudominio.com.br/signup

1. Acessa o site do sistema
2. Clica em "Cadastrar Academia" ou "Começar Teste Grátis"
3. Preenche formulário de cadastro:

**Passo 1 - Dados da Academia:**
- Nome da academia
- URL personalizada (slug): Ex: `fitlife` → `seudominio.com.br/fitlife`
- Email de contato
- Telefone
- Cidade/Estado

**Passo 2 - Dados do Administrador:**
- Nome completo
- Email do admin
- (Senha gerada automaticamente)

**Passo 3 - Escolha do Plano:**
- Básico (R$ 199/mês)
- Professional (R$ 299/mês) - Recomendado
- Enterprise (R$ 499/mês)

4. Clica em "Finalizar Cadastro"

### 1.2 Sistema Cria Automaticamente

```
✅ Academia criada no banco de dados
✅ Usuário admin criado (role: gym_admin)
✅ Período de teste de 14 dias ativado
✅ Email enviado com:
   - URL de acesso: https://seudominio.com.br/fitlife/admin/login
   - Email: admin@fitlife.com.br
   - Senha temporária: ********
   - Link para alterar senha
```

### 1.3 Admin Faz Primeiro Login

1. Acessa URL do email: `https://seudominio.com.br/fitlife/admin/login`
2. Digita email e senha temporária
3. Sistema solicita alteração de senha
4. Acessa painel administrativo

---

## FASE 2: Configuração da Leitora Facial

### 2.1 Instalação do Agent Local

**Local:** Computador na academia (mesma rede da leitora)

**Pré-requisitos:**
- Leitora Control ID já instalada e funcionando
- Leitora com IP fixo (ex: 192.168.2.142)
- Computador Windows/Linux na mesma rede

**Passos:**

1. Admin baixa o agent do sistema ou recebe por email
2. Descompacta pasta `agent` no computador local
3. Executa instalador:

**Windows:**
```cmd
cd agent
install-windows.bat
```

**Linux/Raspberry Pi:**
```bash
cd agent
chmod +x install-linux.sh
./install-linux.sh
```

4. Instalador pede informações:
   - IP da leitora: `192.168.2.142`
   - URL da VPS: `wss://seudominio.com.br/agent`
   - ID do agent: `fitlife-1` (gerado automaticamente)
   - Token de autenticação: (fornecido pelo sistema)

5. Agent inicia automaticamente e conecta na VPS

### 2.2 Verificar Conexão no Painel Admin

1. Admin acessa: Configurações → Dispositivos Control ID
2. Vê status: **🟢 Conectado** (agent online)
3. Testa conexão: botão "Testar Dispositivo"
4. Sistema retorna: ✅ Dispositivo respondendo

---

## FASE 3: Cadastro de Alunos

### OPÇÃO A: Auto-Cadastro (Aluno se cadastra sozinho)

**URL:** https://seudominio.com.br/fitlife/student/register

1. Aluno acessa site da academia
2. Clica em "Criar Conta" ou "Cadastrar-se"
3. Preenche formulário:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
   - CPF
   - Telefone (opcional)
   - Data de nascimento (opcional)

4. Clica em "Criar Conta"

**Sistema cria automaticamente:**
```
✅ Usuário criado (role: student)
✅ Perfil de aluno criado
✅ Matrícula gerada: FITLIFE-1704812345678
✅ Status: inactive (aguardando pagamento)
✅ Login automático
✅ Redirecionado para escolher plano
```

5. Aluno escolhe plano e faz pagamento via PIX
6. Após confirmação de pagamento: Status → **active**

### OPÇÃO B: Admin Cadastra Aluno

**Painel Admin → Alunos → Novo Aluno**

1. Admin clica em "Cadastrar Aluno"
2. Preenche formulário:
   - Dados pessoais (nome, email, CPF, telefone)
   - Endereço completo
   - Data de nascimento
   - Senha inicial
   - Plano contratado

3. Clica em "Salvar"

**Sistema cria automaticamente:**
```
✅ Usuário criado
✅ Perfil de aluno criado
✅ Matrícula gerada
✅ Assinatura criada (status: active)
✅ Primeiro pagamento gerado (boleto/PIX)
✅ Email enviado para aluno com credenciais
```

4. Aluno recebe email:
   - Login: aluno@email.com
   - Senha: senha-definida
   - Link: https://seudominio.com.br/fitlife/student/login

---

## FASE 4: Cadastro Facial na Leitora

**IMPORTANTE:** O cadastro facial é um passo separado e manual.

### 4.1 Aluno com Plano Ativo

1. Admin/recepcionista verifica que aluno pagou
2. Verifica status no sistema: **Ativo ✅**
3. Convida aluno para cadastrar face

### 4.2 Cadastro da Face

**Painel Admin → Alunos → [Aluno] → Cadastrar Face**

**OPÇÃO A - Cadastro Interativo (Recomendado):**

1. Admin clica em "Cadastrar Face na Leitora"
2. Sistema envia comando para leitora via agent
3. Leitora entra em modo de cadastro
4. Leitora exibe mensagem: "Aproxime seu rosto"
5. Aluno se posiciona em frente à leitora
6. Leitora guia o processo:
   - Olhe para frente
   - Vire levemente para esquerda
   - Vire levemente para direita
   - Cadastro concluído ✓

7. Sistema atualiza automaticamente:
```
✅ students.faceEnrolled = true
✅ students.controlIdUserId = 1234 (ID na leitora)
✅ Badge "Face Cadastrada" aparece no perfil
```

**OPÇÃO B - Upload de Foto:**

1. Admin clica em "Enviar Foto"
2. Faz upload de foto do aluno (frontal, boa iluminação)
3. Sistema processa e envia para leitora
4. Leitora cadastra face baseada na foto
5. Mesmo resultado da Opção A

### 4.3 Verificar Cadastro

1. Admin acessa perfil do aluno
2. Vê badge: **🎭 Face Cadastrada**
3. Aluno está pronto para usar a leitora

---

## FASE 5: Uso Diário - Acesso pela Leitora

### 5.1 Fluxo de Acesso Normal

```
1. Aluno chega na academia
   ↓
2. Aproxima do dispositivo Control ID
   ↓
3. Leitora captura face (< 1 segundo)
   ↓
4. Leitora compara com banco local
   ↓
5. Reconhecimento bem-sucedido?
   ├─ SIM → Libera acesso (LED verde + beep)
   │         Registra log local
   │         Exibe: "Bem-vindo, João!"
   │
   └─ NÃO → Bloqueia acesso (LED vermelho + beep)
             Exibe: "Acesso negado"
             Pode exibir motivo (inadimplente, etc)
```

### 5.2 Sincronização de Logs

**Automático a cada 30 segundos:**

```
1. Cron job executa (a cada 30s)
   ↓
2. Sistema pede logs à leitora via agent
   ↓
3. Leitora retorna logs novos
   ↓
4. Sistema processa e salva no banco:
   - ID do aluno
   - Data/hora do acesso
   - Tipo (entrada/saída)
   - Dispositivo usado
   ↓
5. Logs aparecem no painel admin em tempo real
```

### 5.3 Admin Visualiza Logs

**Painel Admin → Controle de Acesso → Logs**

- Vê todos os acessos em tempo real
- Filtra por aluno, data, dispositivo
- Exporta relatórios (PDF, Excel)

---

## FASE 6: Bloqueio Automático por Inadimplência

### 6.1 Detecção de Inadimplência

**Cron job diário às 06:00:**

```
1. Sistema verifica pagamentos vencidos
   ↓
2. Identifica alunos com:
   - Pagamento vencido há mais de 5 dias
   - Status: active
   ↓
3. Para cada aluno inadimplente:
   - Altera status → blocked
   - Envia comando para leitora via agent
   - Leitora bloqueia acesso do usuário
   - Email enviado ao aluno
   ↓
4. Próximo acesso: Leitora nega entrada
```

### 6.2 Regularização

1. Aluno paga mensalidade atrasada
2. Sistema detecta pagamento confirmado
3. Altera status → active
4. Envia comando para leitora: desbloquear
5. Acesso liberado novamente

---

## FASE 7: Gestão de Planos e Pagamentos

### 7.1 Renovação Automática

```
1. Sistema gera boleto/PIX automaticamente 3 dias antes do vencimento
2. Envia email/notificação para aluno
3. Aluno paga via PIX (instantâneo) ou boleto
4. Webhook de pagamento confirma
5. Sistema renova assinatura automaticamente
6. Ciclo continua no próximo mês
```

### 7.2 Cancelamento

1. Aluno solicita cancelamento
2. Admin processa no sistema
3. Status → cancelled
4. Face permanece na leitora até fim do período pago
5. Após expirar: face removida da leitora
6. Acesso bloqueado

---

## Fluxo Técnico Detalhado - VPS + Agent + Leitora

### Como Funciona com Sistema Hospedado

```
┌─────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA                             │
└─────────────────────────────────────────────────────────────────┘

INTERNET
   │
   │ HTTPS (443)
   ↓
┌─────────────────┐
│  VPS (Nuvem)   │
│                │
│  ├─ Nginx      │ ← SSL/Proxy
│  ├─ Node.js    │ ← Backend (porta 3000)
│  ├─ MySQL      │ ← Banco de dados
│  └─ WebSocket  │ ← Porta 8080 (wss://)
└─────────────────┘
   │
   │ WebSocket Seguro (WSS)
   │ Agent inicia conexão
   ↓
┌─────────────────────────────────┐
│  ACADEMIA (Rede Local)          │
│                                 │
│  ┌─────────────────────┐        │
│  │  Computador Local   │        │
│  │  (Agent rodando)    │        │
│  │                     │        │
│  │  ├─ Node.js         │        │
│  │  ├─ PM2             │        │
│  │  └─ WebSocket Client│        │
│  └─────────────────────┘        │
│          │                      │
│          │ HTTP (LAN)           │
│          ↓                      │
│  ┌─────────────────────┐        │
│  │  Leitora Control ID │        │
│  │  192.168.2.142:80   │        │
│  │                     │        │
│  │  ├─ Banco Local     │        │
│  │  ├─ Faces           │        │
│  │  └─ Logs            │        │
│  └─────────────────────┘        │
│                                 │
└─────────────────────────────────┘
```

### Fluxo de Comando (Admin → Leitora)

**Exemplo: Cadastrar face de aluno**

```
1. Admin clica "Cadastrar Face" no painel web
   ↓
2. Browser faz request HTTPS para VPS
   POST https://seudominio.com.br/api/trpc/controlId.enrollFace
   ↓
3. Backend VPS recebe request
   ↓
4. Backend verifica: Está em produção? useAgent = true
   ↓
5. Backend envia comando via WebSocket:
   {
     requestId: "abc123",
     action: "enrollFace",
     data: { userId: 1234, name: "João Silva" }
   }
   ↓
6. Agent local recebe comando via WebSocket
   ↓
7. Agent faz HTTP request para leitora (LAN):
   POST http://192.168.2.142:80/enroll_user.fcgi
   ↓
8. Leitora processa comando
   ↓
9. Leitora entra em modo cadastro
   ↓
10. Aluno aproxima do dispositivo
   ↓
11. Leitora captura face e confirma
   ↓
12. Leitora retorna sucesso para agent:
    { success: true, userId: 1234 }
   ↓
13. Agent envia resposta via WebSocket para VPS:
    {
      requestId: "abc123",
      success: true,
      data: { userId: 1234 }
    }
   ↓
14. Backend VPS atualiza banco de dados:
    UPDATE students SET faceEnrolled = true
   ↓
15. Backend responde para browser:
    { success: true }
   ↓
16. Interface mostra: ✅ Face cadastrada com sucesso!
```

**Tempo total:** ~2-5 segundos

### Fluxo de Reconhecimento (Leitora → Sistema)

```
1. Aluno aproxima da leitora
   ↓
2. Leitora reconhece face (offline, < 1s)
   ↓
3. Leitora libera/bloqueia acesso (independente da internet)
   ↓
4. Leitora salva log localmente
   ↓
5. [30 segundos depois] Cron job sincroniza logs
   ↓
6. Backend pede logs via agent
   ↓
7. Agent busca logs da leitora
   ↓
8. Leitora retorna logs novos
   ↓
9. Agent envia logs para VPS via WebSocket
   ↓
10. Backend salva logs no MySQL
   ↓
11. Logs aparecem no painel admin automaticamente
```

**IMPORTANTE:** A leitora funciona 100% offline. Mesmo sem internet, ela libera/bloqueia acesso. Os logs são sincronizados quando a conexão voltar.

---

## Vantagens da Arquitetura

### ✅ Funcionamento Offline
- Leitora não depende de internet para funcionar
- Banco de faces armazenado localmente
- Acesso não é interrompido por queda de conexão

### ✅ Segurança
- WebSocket criptografado (WSS)
- Autenticação via token
- Leitora não exposta à internet

### ✅ Escalabilidade
- Múltiplas academias, um único servidor
- Cada academia tem seu próprio agent
- Sistema multi-tenant

### ✅ Facilidade de Uso
- Admin gerencia tudo pela web
- Não precisa acessar leitora diretamente
- Instalação simples do agent

---

## Checklist Final - Sistema Pronto

### ✅ VPS Configurada
- [ ] Backend rodando (porta 3000)
- [ ] WebSocket rodando (porta 8080)
- [ ] MySQL configurado
- [ ] Nginx com SSL
- [ ] Domínio apontando
- [ ] PM2 auto-start configurado

### ✅ Academia Cadastrada
- [ ] Academia criada no sistema
- [ ] Admin tem acesso ao painel
- [ ] URL personalizada funcionando

### ✅ Agent Instalado
- [ ] Agent rodando na academia
- [ ] Conectado com VPS (status: online)
- [ ] Comunicação com leitora OK

### ✅ Leitora Configurada
- [ ] Leitora instalada fisicamente
- [ ] IP fixo configurado
- [ ] Teste de comunicação OK

### ✅ Primeiro Aluno
- [ ] Aluno cadastrado
- [ ] Plano ativo
- [ ] Face cadastrada
- [ ] Acesso testado e funcionando

---

## Próximos Passos

Agora que você entende o fluxo completo:

1. **Contratar VPS** (caso ainda não tenha)
2. **Fazer deploy** seguindo [DEPLOY-VPS.md](./DEPLOY-VPS.md)
3. **Instalar agent** na academia seguindo [AGENT-LOCAL.md](./AGENT-LOCAL.md)
4. **Cadastrar primeira academia** via /signup
5. **Cadastrar primeiro aluno** e testar todo o fluxo
6. **Monitorar logs** e ajustar conforme necessário

Qualquer dúvida, consulte a documentação ou entre em contato com o suporte.
