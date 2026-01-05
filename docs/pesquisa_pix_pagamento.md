# Pesquisa: Sistemas de Pagamento PIX com Liberação Automática

## 1. PIX Automático - Visão Geral

O **PIX Automático** é uma evolução do débito automático que permite o pagamento de cobranças recorrentes de forma automatizada, após autorização do usuário pagador.

### Características Principais:
- **Recorrência**: Pagamentos automáticos em datas combinadas
- **Autorização**: Requer consentimento prévio do pagador
- **Disponibilidade**: 24/7 (diferente do débito automático)
- **Notificações**: Automáticas em cada transação
- **Aplicação**: Academias, condomínios, assinaturas, seguros, etc.

---

## 2. Provedores de PIX com API

### 2.1 Efí Pay
- **Documentação**: https://dev.efipay.com.br/
- **Funcionalidades**: PIX Automático, Webhooks, Cobranças Recorrentes
- **Requisito**: Conta Digital Efí Empresas

### 2.2 OpenPix
- **Funcionalidades**: PIX Webhook, PIX Automático
- **Documentação**: https://openpix.com.br/

### 2.3 Woovi
- **Funcionalidades**: PIX Webhook
- **Documentação**: https://woovi.com/pix/webhook/

### 2.4 PagBank
- **Funcionalidades**: Webhooks para PIX
- **Documentação**: https://developer.pagbank.com.br/

---

## 3. Fluxo de PIX Automático (Efí Pay)

### 3.1 Jornadas de Contratação

#### Jornada 1: Negociação Externa
1. Criar recorrência: `POST /v2/rec`
2. Criar solicitação de recorrência: `POST /v2/solicrec`
3. Criar cobrança recorrente: `PUT /v2/cobr/:txid` ou `POST /v2/cobr`

#### Jornada 2: Sem Pagamento Imediato
1. Criar location: `POST /v2/locrec`
2. Criar recorrência: `POST /v2/rec`
3. Consultar recorrência: `GET /v2/rec/:idRec`
4. Criar cobrança recorrente: `PUT /v2/cobr/:txid` ou `POST /v2/cobr`

#### Jornada 3: Com Pagamento Imediato
1. Criar location: `POST /v2/locrec`
2. Criar cobrança imediata: `POST /v2/cob` ou `PUT /v2/cob/:txid`
3. Criar recorrência: `POST /v2/rec`
4. Consultar recorrência: `GET /v2/rec/:idRec`
5. Criar cobrança recorrente: `PUT /v2/cobr/:txid` ou `POST /v2/cobr`

#### Jornada 4: Com Vencimento
1. Criar location: `POST /v2/locrec`
2. Criar cobrança com vencimento: `PUT /v2/cobv/:txid`
3. Criar recorrência: `POST /v2/rec`
4. Consultar recorrência: `GET /v2/rec/:idRec`
5. Criar cobrança recorrente: `PUT /v2/cobr/:txid` ou `POST /v2/cobr`

---

## 4. Webhooks para Confirmação Automática

### 4.1 Configuração de Webhooks

**Endpoints de Gerenciamento**:
- `PUT /v2/webhook/:chave` - Configurar webhook
- `GET /v2/webhook/:chave` - Exibir informações
- `GET /v2/webhook` - Consultar lista
- `DELETE /v2/webhook/:chave` - Cancelar webhook

### 4.2 Webhooks Específicos para PIX Automático

**Recorrências**:
- `PUT /v2/webhookrec` - Configurar webhook de recorrência
- `GET /v2/webhookrec` - Exibir informações
- `DELETE /v2/webhookrec` - Cancelar webhook

**Cobranças Automáticas**:
- `PUT /v2/webhookcobr` - Configurar webhook de cobrança
- `GET /v2/webhookcobr` - Exibir informações
- `DELETE /v2/webhookcobr` - Cancelar webhook

### 4.3 Reenvio de Webhooks
- `POST /v2/gn/webhook/reenviar` - Reenviar notificações

---

## 5. Segurança de Webhooks

### 5.1 Padrão mTLS (Mutual TLS)

**Processo de Validação**:
1. **Primeira Requisição**: Efí envia certificado público
   - Servidor valida e responde com certificado
   - Se recusa, Efí faz segunda tentativa

2. **Segunda Requisição**: Servidor realiza "Hand-Shake"
   - Comunicação estabelecida com mTLS

**Requisitos**:
- TLS mínimo 1.2
- Rota POST com resposta "200"
- Incluir certificado Efí no servidor

### 5.2 Skip-mTLS (Alternativa para Servidores Compartilhados)

**Quando usar**: Hospedagem compartilhada com restrições de certificado

**Validações Recomendadas**:
1. **Validação de IP**: Restringir a IP `34.193.116.226`
2. **Hash na URL**: Adicionar HMAC à URL do webhook
   - Exemplo: `https://seu_dominio.com.br/webhook?hmac=xyz&ignorar=`

---

## 6. Callbacks (Notificações de Pagamento)

### 6.1 Características

- **Método**: POST para URL cadastrada + `/pix`
- **Timeout**: 60 segundos
- **Formato**: JSON com informações da transação
- **Autenticação**: Certificado incluído em cada requisição

### 6.2 Ambiente de Homologação

**Teste Automático de Status**:
- Cobranças de **R$ 0.01 a R$ 10.00**: Confirmadas automaticamente com webhook
- Cobranças **acima de R$ 10.00**: Permanecem ativas sem confirmação

---

## 7. Endpoints de Gerenciamento de Recorrências

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v2/rec` | POST | Criar recorrência |
| `/v2/rec/:idRec` | GET | Consultar recorrência |
| `/v2/rec/:idRec` | PATCH | Revisar recorrência |
| `/v2/rec` | GET | Listar recorrências (com filtros) |
| `/v2/solicrec` | POST | Criar solicitação de recorrência |
| `/v2/solicrec/:idSolicRec` | GET | Consultar solicitação |
| `/v2/solicrec/:idSolicRec` | PATCH | Revisar solicitação |
| `/v2/cobr/:txid` | PUT | Criar cobrança com txid |
| `/v2/cobr/:txid` | PATCH | Revisar cobrança |
| `/v2/cobr/:txid` | GET | Consultar cobrança |
| `/v2/cobr` | POST | Criar cobrança sem txid |
| `/v2/cobr` | GET | Listar cobranças (com filtros) |
| `/v2/cobr/:txid/retentativa/:data` | POST | Solicitar retentativa |

---

## 8. Filtros Disponíveis

**Para Recorrências** (`GET /v2/rec`):
- `inicio` (obrigatório): Data inicial
- `fim` (obrigatório): Data final
- `cpf/cnpj`: Filtro por documento
- `status`: Filtro por status

**Para Cobranças** (`GET /v2/cobr`):
- `inicio` (obrigatório): Data inicial
- `fim` (obrigatório): Data final
- `idRec`: ID da recorrência
- `cpf/cnpj`: Filtro por documento
- `status`: Filtro por status
- `convênio`: Filtro por convênio

---

## 9. Estrutura de Integração para Academia

```
Sistema de Academia
├── Backend (Node.js/Python/FastAPI)
│   ├── Autenticação Efí Pay
│   ├── Criar recorrências PIX
│   ├── Configurar webhooks
│   ├── Processar callbacks
│   ├── Liberar acesso automático
│   └── Sincronizar com Control ID
├── Banco de Dados (MySQL)
│   ├── Usuários/Alunos
│   ├── Planos e Cobranças
│   ├── Recorrências PIX
│   ├── Status de Pagamento
│   ├── Logs de Acesso
│   └── Credenciais (face_id)
└── Frontend
    ├── Admin (gestão de cobranças)
    └── App Aluno (ativar PIX Automático)
```

---

## 10. Fluxo Completo: Aluno + Academia

### 10.1 Cadastro e Ativação

1. Aluno se cadastra no app
2. Admin enrola face no Control ID
3. Aluno ativa PIX Automático
4. Sistema cria recorrência PIX
5. Aluno autoriza pagamento
6. Primeira cobrança é processada

### 10.2 Pagamento Recorrente

1. Sistema cria cobrança recorrente
2. Aluno recebe notificação
3. Aluno efetua pagamento via PIX
4. Webhook notifica sistema
5. Sistema libera acesso automaticamente
6. Control ID autoriza entrada

### 10.3 Monitoramento

- Consultar status de recorrências
- Verificar cobranças pendentes
- Reenviar webhooks se necessário
- Gerar relatórios de pagamento

