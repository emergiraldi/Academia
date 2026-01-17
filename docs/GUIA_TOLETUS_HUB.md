# Guia Toletus HUB - Integração Híbrida

## 🎯 Como Funciona

Seu sistema agora tem **integração híbrida**:
- **Control ID** reconhece a face do aluno
- **Toletus HUB** libera a catraca LiteNet física

## 🚀 Iniciar o Sistema

### 1. Iniciar o Toletus HUB (OBRIGATÓRIO)

```powershell
# Execute este script SEMPRE que reiniciar o computador
.\RODAR_TOLETUS_HUB.ps1
```

**IMPORTANTE**: Este programa DEVE ficar rodando! Não feche a janela.

### 2. Iniciar o Agent

```bash
cd agent
npm start
```

O agent já está configurado para se comunicar com o Toletus HUB.

## 📋 Configuração no Sistema

### 1. Acessar Parâmetros da Academia

No painel admin, vá em: **Parâmetros → Sistema de Catraca**

### 2. Escolher Toletus HUB

Selecione "Toletus HUB" no dropdown e salve.

### 3. Cadastrar Dispositivos LiteNet

Vá em: **Menu Lateral → Toletus HUB → Dispositivos Toletus**

Clique em:
1. **"Verificar Status do HUB"** - Deve mostrar ✅ Online
2. **"Descobrir Dispositivos"** - Encontra catracas na rede
3. Cadastre cada catraca encontrada

## 🔄 Fluxo Automático

Quando um aluno chega:

1. **Control ID** reconhece o rosto ✅
2. Sistema verifica se a academia usa Toletus HUB
3. **Automaticamente** envia comando para liberar a catraca LiteNet 🚪
4. Aluno passa pela catraca

**Tudo acontece automaticamente!** Sem necessidade de intervenção manual.

## 🔧 Liberação Manual

Caso precise liberar a catraca manualmente:

1. Vá em **Alunos**
2. Clique no ícone de porta 🚪 ao lado do aluno
3. Selecione a catraca e clique em "Liberar Entrada"

## ⚙️ Endpoints do Toletus HUB

O sistema se comunica com:
- `https://localhost:7067` (Toletus HUB)
- Toletus HUB se comunica com as catracas LiteNet via TCP

## 🐛 Solução de Problemas

### Catraca não libera?

1. **Verificar se o Toletus HUB está rodando**:
   ```bash
   curl -k https://localhost:7067/DeviceConnection/GetDefaultNetworkName
   ```
   Deve retornar o nome da sua rede (ex: "Ethernet").

2. **Verificar se o agent está rodando**:
   - Deve estar conectado ao VPS
   - Deve mostrar logs de comunicação

3. **Verificar se a catraca está cadastrada**:
   - Acesse "Toletus HUB → Dispositivos Toletus"
   - Verifique se o dispositivo está ativo ✅
   - Tente conectar manualmente

4. **Verificar configuração da academia**:
   - Parâmetros → Tipo de catraca deve ser "Toletus HUB"

### Certificado SSL warning?

Isso é normal! O Toletus HUB usa certificado auto-assinado. O agent já está configurado para aceitar (`rejectUnauthorized: false`).

## 📞 Suporte

- Logs do Toletus HUB: Janela do PowerShell
- Logs do Agent: Terminal onde rodou `npm start`
- Logs do VPS: `pm2 logs academia-api`

## 🔐 Segurança

- Toletus HUB roda apenas na rede local (localhost)
- Agent se comunica com VPS via WebSocket seguro (wss://)
- Agent se comunica com Toletus HUB via HTTPS local
