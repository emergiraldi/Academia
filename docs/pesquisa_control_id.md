# Pesquisa: Control ID API para Controle de Acesso Facial

## 1. Visão Geral da API Control ID

A **Control ID** oferece uma API moderna baseada em **TCP/IP (Ethernet)** com arquitetura **REST** para integração com dispositivos de controle de acesso.

### Características Principais:
- **Protocolo**: REST API baseado em TCP/IP
- **Autenticação**: Session-based (login/logout)
- **Encoding**: UTF-8 obrigatório
- **Métodos HTTP**: POST, GET
- **Exemplos disponíveis em**: C#, Delphi, Java, NodeJS, Python, JavaScript

---

## 2. Modos de Operação

A API suporta **3 modos de operação**:

### 2.1 Standalone Mode (Recomendado)
- Identificação e autorização ocorrem no terminal
- Comunicação unilateral do servidor para o terminal
- Necessário manter dados de usuários e regras de acesso atualizados

### 2.2 Pro Mode
- Identificação no terminal
- Autorização no servidor

### 2.3 Enterprise Mode
- Identificação e autorização no servidor
- Comunicação bidirecional

---

## 3. Autenticação e Sessão

### 3.1 Login
**Endpoint**: `POST /login.fcgi`

**Parâmetros**:
```json
{
    "login": "admin",
    "password": "admin"
}
```

**Resposta**:
```json
{
    "session": "apx7NM2CErTcvXpuvExuzaZ"
}
```

**Requisitos**:
- Todos os comandos requerem uma sessão válida (exceto `session_is_valid` e `login`)
- A sessão deve ser reutilizada em todas as requisições
- Encoding UTF-8 obrigatório

---

## 4. Enrolamento Remoto (Remote Enrollment)

### 4.1 Endpoint Principal
**POST /remote_enroll.fcgi**

### 4.2 Parâmetros Principais

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `type` | string | "card", "face", "biometry", "pin" ou "password" (OBRIGATÓRIO) |
| `user_id` | int | ID do usuário (obrigatório quando save=true) |
| `save` | boolean | Se true, salva no dispositivo; se false, envia para servidor |
| `sync` | bool | true=síncrono (retorna resposta), false=assíncrono (via webhook) |
| `auto` | bool | Enrolamento facial automático (sem botões) |
| `countdown` | int | Tempo em segundos para captura automática (padrão: 5s) |
| `registration` | string | Número de registro da pessoa |
| `msg` | string | Mensagem exibida durante enrolamento |

### 4.3 Enrolamento Facial (Face)

**Exemplo Síncrono**:
```javascript
$.ajax({
    url: "/remote_enroll.fcgi?session=" + session,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        type: "face",
        user_id: 123,
        save: true,
        sync: true,
        auto: true,
        countdown: 3
    })
});
```

**Resposta de Sucesso**:
- `success`: true/false
- `user_id`: ID do usuário
- `device_id`: ID do dispositivo
- `user_image`: Imagem da face em base64 (se sucesso)
- `error`: Mensagem de erro (se falha)
- `match_user_id`: ID do usuário correspondente (se FACE_EXISTS)

### 4.4 Cancelar Enrolamento
**POST /cancel_remote_enroll.fcgi**
- Sem parâmetros
- Interrompe o processo em andamento

---

## 5. Endpoints para Criação de Credenciais (Online Mode)

Quando enrolamento remoto ocorre em modo online, o resultado vem através destes endpoints:

| Endpoint | Descrição |
|----------|-----------|
| `POST /card_create.fcgi` | Resultado de enrolamento de cartão |
| `POST /fingerprint_create.fcgi` | Resultado de enrolamento biométrico |
| `POST /face_create.fcgi` | Resultado de enrolamento facial |
| `POST /pin_create.fcgi` | Resultado de enrolamento de PIN |
| `POST /password_create.fcgi` | Resultado de enrolamento de senha |

---

## 6. Monitoramento e Notificações

### 6.1 Monitor
- Monitora eventos assíncronos do dispositivo
- Eventos: logs de acesso, logs de alarme, enrolamento remoto, turnstile, abertura de portas

### 6.2 Push
- Mecanismo proativo de comunicação
- Dispositivo envia requisições periódicas ao servidor
- Servidor responde com comandos a executar

---

## 7. Recursos Adicionais

### 7.1 Reconhecimento Facial
- **General Settings**: Configurar operação do reconhecimento facial
- **Facial photo enrollment**: Enrolar fotos de usuários
- **Camera image capture**: Capturar imagens da câmera
- **Manage User Pictures**: Gerenciar fotos de usuários

### 7.2 Autorização Remota
- **Remote Access Authorization**: Autorizar acesso em tempo real com interação do usuário

### 7.3 Operações de Porta
- **Remote Door and Turnstile Opening**: Abrir portas/catraca remotamente

### 7.4 Objetos Gerenciáveis
- Criar, carregar, modificar e destruir objetos
- Exportar relatórios

---

## 8. Exemplos de Código Disponíveis

- **GitHub**: https://github.com/controlid/integracao/
- **Postman Collection**: https://documenter.getpostman.com/view/10800185/2s9YJgSKm2

---

## 9. Recomendações para Integração

1. **Enrolamento Assíncrono**: Configure o Monitor e implemente endpoints no servidor para receber resultados
2. **Imagens Faciais**: Quando save=true em modo assíncrono, recuperar imagem via API "Face registration"
3. **Modo Recomendado**: Standalone para maior independência do dispositivo
4. **Segurança**: Implementar autenticação adequada e validação de sessão

---

## 10. Estrutura de Integração Proposta

```
Sistema de Academia
├── Backend (Node.js/Python)
│   ├── Autenticação Control ID (login/session)
│   ├── Enrolamento de usuários (face)
│   ├── Monitor de eventos (webhook)
│   ├── Autorização remota de acesso
│   └── Sincronização de dados
├── Banco de Dados (MySQL)
│   ├── Usuários
│   ├── Credenciais (face_id, card_id)
│   ├── Logs de acesso
│   └── Dados de pagamento
└── Frontend
    ├── Admin (gestão de usuários, acesso)
    └── App Aluno (perfil, pagamentos)
```

