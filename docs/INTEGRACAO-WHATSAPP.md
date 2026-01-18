# Integração WhatsApp - Sistema Academia

**Status:** 📋 Planejamento / Futura Implementação
**Data:** 17/01/2026
**Versão:** 1.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias e APIs](#tecnologias-e-apis)
3. [Modelo de Preços 2025](#modelo-de-preços-2025)
4. [Casos de Uso para Academia](#casos-de-uso-para-academia)
5. [Arquitetura Proposta](#arquitetura-proposta)
6. [Implementação Técnica](#implementação-técnica)
7. [Templates de Mensagens](#templates-de-mensagens)
8. [Roadmap de Implementação](#roadmap-de-implementação)
9. [Estimativa de Custos](#estimativa-de-custos)
10. [Referências e Links](#referências-e-links)

---

## 🎯 Visão Geral

### Objetivo

Integrar o WhatsApp ao sistema de academia para **automatizar comunicações** com alunos, incluindo:

- 📅 Lembretes de vencimento de mensalidade
- ✅ Confirmações de entrada/presença
- 🔓 Notificações de liberação de catraca
- ⚠️ Alertas de bloqueio/suspensão
- 💳 Links de pagamento
- 📊 Relatórios mensais de frequência

### Benefícios

- ✅ **Redução de inadimplência** - Lembretes automáticos antes do vencimento
- ✅ **Melhor experiência do aluno** - Comunicação instantânea
- ✅ **Redução de trabalho manual** - Notificações automáticas
- ✅ **Maior engajamento** - Canal preferido dos usuários
- ✅ **Rastreabilidade** - Logs de todas as mensagens enviadas

---

## 🛠️ Tecnologias e APIs

### 1. WhatsApp Cloud API (RECOMENDADA) ⭐

**Vantagens:**
- ✅ Gratuita (infraestrutura hospedada pela Meta)
- ✅ Não requer servidor adicional
- ✅ SDK oficial para Node.js
- ✅ Suporte direto da Meta
- ✅ 1.000 conversas grátis/mês

**Requisitos:**
- Conta Meta Business
- Número de telefone dedicado
- Servidor com HTTPS para webhook

**Documentação Oficial:**
- https://developers.facebook.com/docs/whatsapp/cloud-api
- https://whatsapp.github.io/WhatsApp-Nodejs-SDK/

### 2. WhatsApp Business API (On-Premise)

**Vantagens:**
- ✅ Controle total da infraestrutura
- ✅ Maior privacidade dos dados

**Desvantagens:**
- ❌ Requer servidor próprio robusto
- ❌ Custos de infraestrutura
- ❌ Complexidade de manutenção
- ❌ Não recomendado para início

### 3. Provedores BSPs

**Opções no Brasil:**
- **Twilio** - Global, confiável
- **Zenvia** - Brasileiro, suporte local
- **Blip (Take)** - Plataforma completa
- **RD Station Conversas** - Integrado com CRM

**Vantagens:**
- ✅ Setup mais rápido
- ✅ Dashboard visual
- ✅ Suporte técnico

**Desvantagens:**
- ❌ Custos adicionais (taxa do BSP + WhatsApp)
- ❌ Menos flexibilidade
- ❌ Dependência de terceiros

---

## 💰 Modelo de Preços 2025

### Mudança Importante (Julho 2025)

**ANTES:**
- ❌ Cobrança por "janela de conversa" de 24 horas

**AGORA:**
- ✅ Cobrança por **template enviado**
- ✅ Respostas dentro da janela de 24h são **GRATUITAS**

### Gratuidades

1. **1.000 conversas de serviço grátis/mês** por WABA (WhatsApp Business Account)
2. **Janela de 24h:**
   - Cliente envia mensagem → abre janela de 24h
   - Todas as respostas (texto livre) nessa janela são grátis
3. **Templates utilitários** dentro da janela de serviço são grátis

### Custos por Template (Brasil - 2025)

| Categoria | Preço Estimado | Uso |
|-----------|----------------|-----|
| **Utilitário** | R$ 0,20 - R$ 0,30 | Confirmações, alertas |
| **Marketing** | R$ 0,40 - R$ 0,60 | Promoções, novidades |
| **Autenticação** | R$ 0,10 - R$ 0,15 | Códigos 2FA, senhas |

**Nota:** Preços variam por país e volume. Consultar documentação oficial.

### Exemplo de Custo Mensal

**Academia com 500 alunos:**

| Ação | Qtd/Mês | Custo Unit. | Total |
|------|---------|-------------|-------|
| Lembrete de vencimento (5 dias antes) | 500 | R$ 0,25 | R$ 125,00 |
| Lembrete de vencimento (no dia) | 500 | R$ 0,25 | R$ 125,00 |
| Confirmação de entrada (1º acesso do mês) | 500 | Grátis* | R$ 0,00 |
| Alerta de inadimplência | 50 | R$ 0,25 | R$ 12,50 |
| **TOTAL ESTIMADO** | | | **R$ 262,50** |

*Gratuito se dentro da janela de 24h ou nas 1.000 conversas grátis.

---

## 🎯 Casos de Uso para Academia

### 1. Lembrete de Vencimento

**Quando:** 5 dias antes + no dia do vencimento

**Mensagem:**
```
Olá {NOME},

Sua mensalidade vence em {DIAS} dia(s).

💳 Valor: R$ {VALOR}
📅 Vencimento: {DATA}

Pague agora e evite bloqueio:
{LINK_PAGAMENTO}

Academia {NOME_ACADEMIA}
```

**Impacto Esperado:**
- ⬇️ Redução de 30-50% na inadimplência
- ⬆️ Aumento de pagamentos antecipados

### 2. Confirmação de Entrada (Catraca)

**Quando:** Ao passar pela catraca (reconhecimento facial)

**Mensagem:**
```
✅ Entrada confirmada

Olá {NOME}!
Registramos sua entrada às {HORA}.

💪 Tenha um ótimo treino!

Academia {NOME_ACADEMIA}
```

**Benefícios:**
- Segurança (aluno sabe que entrada foi registrada)
- Engagement (lembrança da marca)

### 3. Alerta de Bloqueio

**Quando:** Mensalidade vencida há 3+ dias

**Mensagem:**
```
⚠️ Acesso Bloqueado

Olá {NOME},

Sua mensalidade está em atraso desde {DATA}.

Para continuar acessando a academia, regularize seu pagamento:
{LINK_PAGAMENTO}

💳 Valor: R$ {VALOR} + multa

Dúvidas? Responda esta mensagem.

Academia {NOME_ACADEMIA}
```

### 4. Bem-vindo ao Aluno Novo

**Quando:** Cadastro de novo aluno

**Mensagem:**
```
🎉 Bem-vindo(a) à {NOME_ACADEMIA}!

Olá {NOME}!

Estamos felizes em ter você conosco!

📱 Baixe nosso app: {LINK_APP}
📋 Seu plano: {PLANO}
📅 Vencimento: dia {DIA}

Qualquer dúvida, estamos à disposição!
```

### 5. Relatório Mensal

**Quando:** Todo dia 1º do mês

**Mensagem:**
```
📊 Seu Resumo de {MÊS}

Olá {NOME}!

🏋️ Treinos: {QTD_TREINOS}
🔥 Frequência: {PERCENTUAL}%
🎯 Meta: {META_TREINOS} treinos/mês

{MENSAGEM_MOTIVACIONAL}

Continue assim! 💪

Academia {NOME_ACADEMIA}
```

### 6. Link de Pagamento PIX

**Quando:** Solicitado pelo aluno ou automático

**Mensagem:**
```
💳 Link de Pagamento

Olá {NOME},

Sua mensalidade de {MES}/{ANO}:

💰 Valor: R$ {VALOR}
📅 Vencimento: {DATA}

Pague com PIX:
{LINK_PIX}

Pagamento confirmado em até 1 minuto!

Academia {NOME_ACADEMIA}
```

---

## 🏗️ Arquitetura Proposta

### Fluxo de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA ACADEMIA                         │
│                                                              │
│  ┌──────────┐      ┌──────────┐      ┌─────────────┐       │
│  │  CRON    │─────>│WhatsApp  │─────>│  WhatsApp   │       │
│  │  Jobs    │      │ Service  │      │  Cloud API  │       │
│  └──────────┘      └──────────┘      └─────────────┘       │
│       │                  │                    │              │
│       │                  │                    │              │
│  ┌──────────┐      ┌──────────┐              │              │
│  │ Database │      │ Message  │              │              │
│  │          │<─────│   Log    │<─────────────┘              │
│  └──────────┘      └──────────┘                             │
│       │                                                      │
│       │            ┌──────────┐                             │
│       └───────────>│ Webhook  │<────────────────────────────┤
│                    │ Handler  │        Respostas            │
│                    └──────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

#### 1. WhatsApp Service (`server/whatsapp.ts`)
```typescript
class WhatsAppService {
  // Enviar template
  async sendTemplate(to: string, templateName: string, params: any)

  // Enviar mensagem livre (dentro janela 24h)
  async sendText(to: string, message: string)

  // Enviar mensagem com botões
  async sendInteractive(to: string, buttons: any[])

  // Verificar status de mensagem
  async getMessageStatus(messageId: string)
}
```

#### 2. CRON Jobs (`server/cron.ts`)
```typescript
// Lembrete de vencimento (diário às 9h)
cron.schedule('0 9 * * *', async () => {
  await sendPaymentReminders();
});

// Relatório mensal (dia 1 às 10h)
cron.schedule('0 10 1 * *', async () => {
  await sendMonthlyReports();
});
```

#### 3. Webhook Handler (`server/whatsappWebhook.ts`)
```typescript
// Receber respostas dos alunos
router.post('/webhook/whatsapp', async (req, res) => {
  const { from, message } = req.body;

  // Processar resposta
  await handleIncomingMessage(from, message);

  res.sendStatus(200);
});
```

#### 4. Message Log (Database)
```sql
CREATE TABLE whatsapp_messages (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  phone VARCHAR(20),
  message_type VARCHAR(50), -- 'payment_reminder', 'entry_confirmation', etc
  template_name VARCHAR(100),
  message_id VARCHAR(100), -- WhatsApp message ID
  status VARCHAR(20), -- 'sent', 'delivered', 'read', 'failed'
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT
);
```

---

## 💻 Implementação Técnica

### 1. Instalação

```bash
# SDK Oficial Meta
npm install whatsapp

# Alternativa (wrapper simplificado)
npm install whatsapp-cloud-api

# Dependências
npm install axios dotenv
```

### 2. Configuração (.env)

```env
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxx
WHATSAPP_API_VERSION=v18.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu_token_secreto_aqui
WHATSAPP_WEBHOOK_URL=https://seu-dominio.com/api/webhook/whatsapp

# Academia
ACADEMIA_NAME=Academia Fitness
ACADEMIA_PHONE=5511999999999
ACADEMIA_APP_URL=https://app.academia.com.br
```

### 3. Criar Serviço WhatsApp

**Arquivo:** `server/whatsapp.ts`

```typescript
import axios from 'axios';

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    };

    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
  }

  /**
   * Enviar template aprovado
   */
  async sendTemplate(
    to: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<string> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhone(to),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: this.buildTemplateComponents(params),
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[WhatsApp] Template "${templateName}" enviado para ${to}`);
      return response.data.messages[0].id;
    } catch (error: any) {
      console.error(`[WhatsApp] Erro ao enviar template:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensagem de texto livre (dentro da janela de 24h)
   */
  async sendText(to: string, message: string): Promise<string> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhone(to),
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[WhatsApp] Mensagem enviada para ${to}`);
      return response.data.messages[0].id;
    } catch (error: any) {
      console.error(`[WhatsApp] Erro ao enviar mensagem:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensagem com botões interativos
   */
  async sendInteractive(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<string> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhone(to),
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
              buttons: buttons.map(btn => ({
                type: 'reply',
                reply: { id: btn.id, title: btn.title },
              })),
            },
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[WhatsApp] Mensagem interativa enviada para ${to}`);
      return response.data.messages[0].id;
    } catch (error: any) {
      console.error(`[WhatsApp] Erro ao enviar interativa:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Formatar número de telefone para padrão WhatsApp
   */
  private formatPhone(phone: string): string {
    // Remove tudo exceto números
    const cleaned = phone.replace(/\D/g, '');

    // Adiciona código do país se não tiver
    if (!cleaned.startsWith('55')) {
      return '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Construir componentes do template
   */
  private buildTemplateComponents(params: Record<string, string>) {
    const parameters = Object.values(params).map(value => ({
      type: 'text',
      text: value,
    }));

    return [
      {
        type: 'body',
        parameters,
      },
    ];
  }

  /**
   * Verificar status de mensagem
   */
  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${this.config.apiVersion}/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(`[WhatsApp] Erro ao verificar status:`, error.response?.data || error.message);
      throw error;
    }
  }
}

// Singleton
export const whatsappService = new WhatsAppService();
```

### 4. Webhook para Receber Mensagens

**Arquivo:** `server/whatsappWebhook.ts`

```typescript
import express from 'express';

const router = express.Router();

/**
 * Webhook verification (GET)
 */
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verificação bem-sucedida');
    res.status(200).send(challenge);
  } else {
    console.error('[WhatsApp Webhook] Verificação falhou');
    res.sendStatus(403);
  }
});

/**
 * Webhook para receber mensagens (POST)
 */
router.post('/webhook/whatsapp', async (req, res) => {
  try {
    const body = req.body;

    // Verificar se é notificação do WhatsApp
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Mensagem recebida
          if (value.messages) {
            for (const message of value.messages) {
              await handleIncomingMessage(message, value.metadata);
            }
          }

          // Status de mensagem (enviada, entregue, lida)
          if (value.statuses) {
            for (const status of value.statuses) {
              await handleMessageStatus(status);
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[WhatsApp Webhook] Erro ao processar:', error);
    res.sendStatus(500);
  }
});

/**
 * Processar mensagem recebida
 */
async function handleIncomingMessage(message: any, metadata: any) {
  const from = message.from; // Número do remetente
  const messageId = message.id;
  const timestamp = message.timestamp;

  console.log(`[WhatsApp] Mensagem recebida de ${from}`);

  // Mensagem de texto
  if (message.type === 'text') {
    const text = message.text.body;
    console.log(`[WhatsApp] Texto: ${text}`);

    // Aqui você pode implementar lógica de chatbot
    // Por exemplo, responder automaticamente
    await handleTextMessage(from, text);
  }

  // Botão clicado
  if (message.type === 'interactive') {
    const buttonId = message.interactive.button_reply.id;
    console.log(`[WhatsApp] Botão clicado: ${buttonId}`);

    await handleButtonClick(from, buttonId);
  }

  // Salvar no banco de dados
  await saveIncomingMessage({
    from,
    messageId,
    type: message.type,
    content: message,
    timestamp: new Date(parseInt(timestamp) * 1000),
  });
}

/**
 * Processar status de mensagem enviada
 */
async function handleMessageStatus(status: any) {
  const messageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed

  console.log(`[WhatsApp] Status de ${messageId}: ${statusType}`);

  // Atualizar no banco de dados
  await updateMessageStatus(messageId, statusType, status.timestamp);
}

/**
 * Responder mensagem de texto
 */
async function handleTextMessage(from: string, text: string) {
  const lowerText = text.toLowerCase().trim();

  // Comandos simples
  if (lowerText.includes('horário') || lowerText.includes('horario')) {
    await whatsappService.sendText(
      from,
      '⏰ Horários de Funcionamento:\n\n' +
      'Segunda a Sexta: 6h às 22h\n' +
      'Sábado: 8h às 14h\n' +
      'Domingo: Fechado'
    );
  }
  else if (lowerText.includes('mensalidade') || lowerText.includes('pagar')) {
    // Buscar aluno pelo telefone e enviar link de pagamento
    const student = await findStudentByPhone(from);
    if (student) {
      await sendPaymentLink(student);
    }
  }
  else {
    // Resposta padrão
    await whatsappService.sendText(
      from,
      'Olá! Como posso ajudar?\n\n' +
      '• Digite "horário" para ver nosso funcionamento\n' +
      '• Digite "mensalidade" para receber link de pagamento\n' +
      '• Ou responda com sua dúvida que logo retornaremos!'
    );
  }
}

/**
 * Processar clique em botão
 */
async function handleButtonClick(from: string, buttonId: string) {
  if (buttonId === 'pagar_agora') {
    const student = await findStudentByPhone(from);
    if (student) {
      await sendPaymentLink(student);
    }
  }
  else if (buttonId === 'falar_atendente') {
    await whatsappService.sendText(
      from,
      'Aguarde, em breve um atendente irá responder você! 😊'
    );
    // Notificar equipe...
  }
}

// Funções auxiliares (implementar conforme seu banco)
async function saveIncomingMessage(data: any) {
  // Implementar salvamento no banco
}

async function updateMessageStatus(messageId: string, status: string, timestamp: number) {
  // Implementar atualização no banco
}

async function findStudentByPhone(phone: string) {
  // Buscar aluno no banco pelo telefone
}

async function sendPaymentLink(student: any) {
  // Gerar e enviar link de pagamento
}

export default router;
```

### 5. Integrar com CRON Existente

**Arquivo:** `server/cron.ts`

```typescript
import cron from 'node-cron';
import { whatsappService } from './whatsapp';

/**
 * Lembrete de vencimento - Diário às 9h
 */
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Enviando lembretes de vencimento...');

  try {
    // Buscar alunos com vencimento em 5 dias
    const studentsReminder5Days = await db.getStudentsWithUpcomingPayment(5);

    for (const student of studentsReminder5Days) {
      await whatsappService.sendTemplate(
        student.phone,
        'lembrete_vencimento_5_dias',
        {
          nome: student.name,
          dias: '5',
          valor: student.monthlyFee.toFixed(2),
          data: student.dueDate,
          link: `https://app.academia.com.br/pay/${student.paymentToken}`,
        }
      );

      await sleep(1000); // Rate limit: 1 mensagem/segundo
    }

    // Buscar alunos com vencimento HOJE
    const studentsDueToday = await db.getStudentsWithUpcomingPayment(0);

    for (const student of studentsDueToday) {
      await whatsappService.sendTemplate(
        student.phone,
        'lembrete_vencimento_hoje',
        {
          nome: student.name,
          valor: student.monthlyFee.toFixed(2),
          link: `https://app.academia.com.br/pay/${student.paymentToken}`,
        }
      );

      await sleep(1000);
    }

    console.log('[CRON] Lembretes enviados com sucesso');
  } catch (error) {
    console.error('[CRON] Erro ao enviar lembretes:', error);
  }
});

/**
 * Alerta de inadimplência - Diário às 10h
 */
cron.schedule('0 10 * * *', async () => {
  console.log('[CRON] Enviando alertas de inadimplência...');

  try {
    const overdueStudents = await db.getOverdueStudents();

    for (const student of overdueStudents) {
      const daysOverdue = calculateDaysOverdue(student.dueDate);

      await whatsappService.sendTemplate(
        student.phone,
        'alerta_inadimplencia',
        {
          nome: student.name,
          dias_atraso: daysOverdue.toString(),
          valor: student.totalDue.toFixed(2),
          link: `https://app.academia.com.br/pay/${student.paymentToken}`,
        }
      );

      await sleep(1000);
    }

    console.log('[CRON] Alertas enviados com sucesso');
  } catch (error) {
    console.error('[CRON] Erro ao enviar alertas:', error);
  }
});

/**
 * Relatório mensal - Dia 1 de cada mês às 10h
 */
cron.schedule('0 10 1 * *', async () => {
  console.log('[CRON] Enviando relatórios mensais...');

  try {
    const students = await db.getActiveStudents();

    for (const student of students) {
      const report = await generateMonthlyReport(student.id);

      await whatsappService.sendTemplate(
        student.phone,
        'relatorio_mensal',
        {
          nome: student.name,
          mes: report.month,
          treinos: report.workouts.toString(),
          frequencia: report.frequency.toString(),
        }
      );

      await sleep(1000);
    }

    console.log('[CRON] Relatórios enviados com sucesso');
  } catch (error) {
    console.error('[CRON] Erro ao enviar relatórios:', error);
  }
});

// Função auxiliar para aguardar
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 6. Notificação de Entrada (Catraca)

**Integrar em:** `server/notifications.ts`

```typescript
// Após liberar catraca com sucesso
if (released) {
  console.log(`[CRON] ✅ Catraca Toletus liberada com sucesso para ${student.name}`);

  // Enviar notificação WhatsApp
  try {
    await whatsappService.sendTemplate(
      student.phone,
      'confirmacao_entrada',
      {
        nome: student.name,
        hora: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        academia: gym.name,
      }
    );
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar confirmação de entrada:', error);
  }
}
```

---

## 📝 Templates de Mensagens

### Como Criar Templates

1. Acessar **Meta Business Suite**: https://business.facebook.com
2. Ir em **WhatsApp Manager** → **Message Templates**
3. Clicar em **Create Template**
4. Preencher informações:
   - Nome (ex: `lembrete_vencimento_5_dias`)
   - Categoria (Utility/Marketing/Authentication)
   - Idioma (Portuguese - Brazil)
   - Conteúdo com variáveis `{{1}}`, `{{2}}`, etc.
5. Enviar para aprovação (pode levar 24-48h)

### Templates Sugeridos

#### 1. Lembrete de Vencimento (5 dias)

**Nome:** `lembrete_vencimento_5_dias`
**Categoria:** Utility

```
Olá {{1}},

Sua mensalidade vence em {{2}} dias.

💳 Valor: R$ {{3}}
📅 Vencimento: {{4}}

Pague agora e evite bloqueio:
{{5}}

Academia {{6}}
```

**Variáveis:**
1. Nome do aluno
2. Número de dias
3. Valor
4. Data de vencimento
5. Link de pagamento
6. Nome da academia

#### 2. Lembrete de Vencimento (Hoje)

**Nome:** `lembrete_vencimento_hoje`
**Categoria:** Utility

```
⏰ ÚLTIMO DIA!

Olá {{1}},

Sua mensalidade vence HOJE!

💳 Valor: R$ {{2}}

Pague agora para não perder acesso:
{{3}}

Academia {{4}}
```

#### 3. Confirmação de Entrada

**Nome:** `confirmacao_entrada`
**Categoria:** Utility

```
✅ Entrada confirmada

Olá {{1}}!
Registramos sua entrada às {{2}}.

💪 Tenha um ótimo treino!

{{3}}
```

#### 4. Alerta de Inadimplência

**Nome:** `alerta_inadimplencia`
**Categoria:** Utility

```
⚠️ Mensalidade em Atraso

Olá {{1}},

Sua mensalidade está atrasada há {{2}} dias.

💳 Valor total: R$ {{3}}

Regularize agora:
{{4}}

Evite bloqueio de acesso!

Academia {{5}}
```

#### 5. Bem-vindo

**Nome:** `bem_vindo`
**Categoria:** Utility

```
🎉 Bem-vindo(a) à {{1}}!

Olá {{2}}!

Estamos felizes em ter você conosco!

📱 Baixe nosso app: {{3}}
📋 Seu plano: {{4}}
📅 Vencimento: dia {{5}}

Qualquer dúvida, responda esta mensagem!
```

#### 6. Relatório Mensal

**Nome:** `relatorio_mensal`
**Categoria:** Utility

```
📊 Seu Resumo de {{2}}

Olá {{1}}!

🏋️ Treinos realizados: {{3}}
📈 Frequência: {{4}}%

Continue firme! 💪

Academia {{5}}
```

#### 7. Pagamento Confirmado

**Nome:** `pagamento_confirmado`
**Categoria:** Utility

```
✅ Pagamento Confirmado!

Olá {{1}},

Recebemos seu pagamento de R$ {{2}}.

📅 Válido até: {{3}}

Obrigado pela confiança!

Academia {{4}}
```

---

## 🗓️ Roadmap de Implementação

### Fase 1: Setup Básico (Semana 1-2)

**Tarefas:**
- [ ] Criar conta Meta Business
- [ ] Configurar WhatsApp Business App
- [ ] Obter Phone Number ID e Access Token
- [ ] Configurar webhook (HTTPS)
- [ ] Instalar dependências npm
- [ ] Criar serviço WhatsApp básico
- [ ] Testar envio de mensagem simples

**Entregáveis:**
- ✅ WhatsApp Cloud API funcionando
- ✅ Envio de mensagens de teste

### Fase 2: Templates e Aprovação (Semana 2-3)

**Tarefas:**
- [ ] Criar templates no Meta Business Suite
- [ ] Submeter para aprovação
- [ ] Aguardar aprovação (24-48h)
- [ ] Testar templates aprovados
- [ ] Ajustar conforme feedback

**Entregáveis:**
- ✅ Templates aprovados e funcionando

### Fase 3: Integração com Database (Semana 3-4)

**Tarefas:**
- [ ] Criar tabela `whatsapp_messages`
- [ ] Adicionar campo `phone` em `students`
- [ ] Implementar log de mensagens
- [ ] Implementar tracking de status

**Entregáveis:**
- ✅ Histórico completo de mensagens
- ✅ Rastreamento de entregas

### Fase 4: CRONs Automáticos (Semana 4-5)

**Tarefas:**
- [ ] Implementar CRON de lembrete de vencimento
- [ ] Implementar CRON de inadimplência
- [ ] Implementar CRON de relatório mensal
- [ ] Testar em ambiente de desenvolvimento

**Entregáveis:**
- ✅ Mensagens automáticas funcionando

### Fase 5: Notificação de Catraca (Semana 5)

**Tarefas:**
- [ ] Integrar WhatsApp com liberação de catraca
- [ ] Testar confirmação de entrada
- [ ] Ajustar timing de envio

**Entregáveis:**
- ✅ Confirmação de entrada via WhatsApp

### Fase 6: Webhook e Chatbot (Semana 6-7)

**Tarefas:**
- [ ] Implementar webhook handler
- [ ] Criar respostas automáticas básicas
- [ ] Implementar comandos (horário, pagamento)
- [ ] Testar fluxo completo

**Entregáveis:**
- ✅ Chatbot básico funcionando
- ✅ Alunos podem solicitar link de pagamento

### Fase 7: Testes e Ajustes (Semana 7-8)

**Tarefas:**
- [ ] Testes com grupo pequeno de alunos
- [ ] Coletar feedback
- [ ] Ajustar mensagens e timing
- [ ] Otimizar performance

**Entregáveis:**
- ✅ Sistema testado e validado

### Fase 8: Deploy e Monitoramento (Semana 8)

**Tarefas:**
- [ ] Deploy em produção
- [ ] Ativar para todos os alunos
- [ ] Monitorar custos
- [ ] Monitorar taxa de entrega
- [ ] Documentar processos

**Entregáveis:**
- ✅ Sistema em produção completo
- ✅ Documentação atualizada

---

## 💵 Estimativa de Custos

### Custos Iniciais

| Item | Custo |
|------|-------|
| Conta Meta Business | Grátis |
| WhatsApp Cloud API (infra) | Grátis |
| Número de telefone dedicado | R$ 30-50/mês (operadora) |
| SSL/HTTPS (servidor webhook) | Já incluído |
| **TOTAL INICIAL** | **R$ 30-50/mês** |

### Custos Mensais por Academia

**Exemplo: 500 alunos**

| Mensagem | Qtd/Mês | Custo Unit. | Subtotal |
|----------|---------|-------------|----------|
| Lembrete 5 dias antes | 500 | R$ 0,25 | R$ 125,00 |
| Lembrete no dia | 500 | R$ 0,25 | R$ 125,00 |
| Alerta inadimplência | 50 | R$ 0,25 | R$ 12,50 |
| Confirmação entrada* | 500 | Grátis | R$ 0,00 |
| Relatório mensal | 500 | R$ 0,25 | R$ 125,00 |
| Pagamento confirmado* | 450 | Grátis | R$ 0,00 |
| Respostas chatbot* | 200 | Grátis | R$ 0,00 |
| **TOTAL** | | | **R$ 387,50** |

*Gratuito por estar dentro da janela de 24h ou nas 1.000 conversas grátis/mês.

### Projeção Anual

**Academia com 500 alunos:**
- Custo mensal: R$ 387,50
- Custo anual: R$ 4.650,00

**ROI Esperado:**
- Redução de 30% na inadimplência
- Economia de 10h/mês de trabalho manual
- Maior satisfação dos alunos

---

## 📚 Referências e Links

### Documentação Oficial

- **WhatsApp Cloud API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **WhatsApp Node.js SDK:** https://whatsapp.github.io/WhatsApp-Nodejs-SDK/
- **Meta Business Suite:** https://business.facebook.com
- **Preços WhatsApp:** https://developers.facebook.com/docs/whatsapp/pricing

### Repositórios GitHub

- **SDK Oficial:** https://github.com/WhatsApp/WhatsApp-Nodejs-SDK
- **Wrapper Simplificado:** https://github.com/tawn33y/whatsapp-cloud-api
- **Express Integration:** https://github.com/j05u3/whatsapp-cloud-api-express

### Artigos e Guias

- **RD Station - WhatsApp Business API:** https://www.rdstation.com/blog/conversacional/whatsapp-business-api/
- **Zenvia - Guia Completo:** https://www.zenvia.com/blog/whatsapp-business-api/
- **Blip - Benefícios para Empresas:** https://www.blip.ai/blog/whatsapp/whatsapp-business-api/

### Ferramentas de Teste

- **WhatsApp Test Number:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **Postman Collection:** Importar de https://developers.facebook.com/docs/whatsapp/cloud-api/reference

---

## 🎯 Conclusão

A integração com WhatsApp tem potencial de:

- ✅ **Reduzir inadimplência** em 30-50%
- ✅ **Aumentar engajamento** dos alunos
- ✅ **Economizar tempo** da equipe
- ✅ **Melhorar comunicação** instantânea
- ✅ **Profissionalizar** a academia

**Custo-benefício:** Muito positivo considerando o ROI esperado.

**Próximo passo:** Criar conta Meta Business e começar Fase 1.

---

**Documento criado em:** 17/01/2026
**Última atualização:** 17/01/2026
**Versão:** 1.0
**Autor:** Sistema Academia + Claude Code
