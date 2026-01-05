/**
 * Agent WebSocket Server
 *
 * Gerencia conexões WebSocket com agents locais instalados nos clientes.
 * Cada agent representa uma academia/local com leitora Control ID.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

// ============================================
// TIPOS
// ============================================

interface AgentInfo {
  id: string;
  ws: WebSocket;
  connectedAt: Date;
  lastPing: Date;
  metadata?: {
    leitoraIp?: string;
    version?: string;
  };
}

interface AgentCommand {
  requestId: string;
  action: string;
  data?: any;
}

interface AgentResponse {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

type ResponseHandler = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

// ============================================
// ESTADO GLOBAL
// ============================================

const agents = new Map<string, AgentInfo>();
const pendingResponses = new Map<string, ResponseHandler>();

// ============================================
// WEBSOCKET SERVER
// ============================================

let wss: WebSocketServer | null = null;

export function initializeAgentWebSocket(port: number = 8080): WebSocketServer {
  console.log(`[AgentWS] Inicializando WebSocket Server na porta ${port}...`);

  wss = new WebSocketServer({
    port,
    path: '/agent',
  });

  wss.on('connection', handleConnection);
  wss.on('error', (error) => {
    console.error('[AgentWS] Erro no WebSocket Server:', error);
  });

  // Limpeza periódica de conexões mortas
  setInterval(cleanupDeadConnections, 60000); // A cada 1 minuto

  console.log(`[AgentWS] ✅ WebSocket Server rodando na porta ${port}`);

  return wss;
}

function handleConnection(ws: WebSocket, req: IncomingMessage) {
  const clientId = req.headers['x-client-id'] as string;
  const authToken = req.headers['authorization']?.replace('Bearer ', '');

  console.log(`[AgentWS] Nova conexão: ${clientId}`);

  // Validar cliente
  if (!clientId) {
    console.log('[AgentWS] ❌ Conexão rejeitada: x-client-id ausente');
    ws.close(1008, 'x-client-id header required');
    return;
  }

  // Validar token (básico - você pode melhorar isso)
  if (!authToken) {
    console.log('[AgentWS] ❌ Conexão rejeitada: token ausente');
    ws.close(1008, 'Authorization token required');
    return;
  }

  // TODO: Validar token no banco de dados
  // const isValidToken = await validateToken(clientId, authToken);
  // if (!isValidToken) {
  //   ws.close(1008, 'Invalid token');
  //   return;
  // }

  // Registrar agent
  const agentInfo: AgentInfo = {
    id: clientId,
    ws,
    connectedAt: new Date(),
    lastPing: new Date(),
  };

  agents.set(clientId, agentInfo);
  console.log(`[AgentWS] ✅ Agent ${clientId} conectado (total: ${agents.size})`);

  // Handlers
  ws.on('message', (data) => handleMessage(clientId, data));
  ws.on('pong', () => handlePong(clientId));
  ws.on('close', () => handleClose(clientId));
  ws.on('error', (error) => handleError(clientId, error));

  // Iniciar ping
  startPing(clientId);
}

function handleMessage(clientId: string, data: Buffer | string) {
  try {
    const response: AgentResponse = JSON.parse(data.toString());

    console.log(`[AgentWS] 📨 Resposta do agent ${clientId} (requestId: ${response.requestId})`);

    // Procurar handler pendente
    const handler = pendingResponses.get(response.requestId);

    if (!handler) {
      console.log(`[AgentWS] ⚠️  Resposta sem handler: ${response.requestId}`);
      return;
    }

    // Limpar timeout
    clearTimeout(handler.timeout);
    pendingResponses.delete(response.requestId);

    // Resolver ou rejeitar promise
    if (response.success) {
      handler.resolve(response.data);
    } else {
      handler.reject(new Error(response.error || 'Agent returned error'));
    }
  } catch (error) {
    console.error(`[AgentWS] Erro ao processar mensagem do agent ${clientId}:`, error);
  }
}

function handlePong(clientId: string) {
  const agent = agents.get(clientId);
  if (agent) {
    agent.lastPing = new Date();
  }
}

function handleClose(clientId: string) {
  console.log(`[AgentWS] ❌ Agent ${clientId} desconectado`);
  agents.delete(clientId);

  // Rejeitar todas as promises pendentes deste agent
  pendingResponses.forEach((handler, requestId) => {
    handler.reject(new Error('Agent disconnected'));
    clearTimeout(handler.timeout);
    pendingResponses.delete(requestId);
  });
}

function handleError(clientId: string, error: Error) {
  console.error(`[AgentWS] Erro no agent ${clientId}:`, error.message);
}

function startPing(clientId: string) {
  const agent = agents.get(clientId);
  if (!agent) return;

  const pingInterval = setInterval(() => {
    if (agent.ws.readyState === WebSocket.OPEN) {
      agent.ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000); // 30 segundos

  agent.ws.on('close', () => clearInterval(pingInterval));
}

function cleanupDeadConnections() {
  const now = Date.now();
  const timeout = 90000; // 90 segundos

  agents.forEach((agent, clientId) => {
    const timeSinceLastPing = now - agent.lastPing.getTime();

    if (timeSinceLastPing > timeout) {
      console.log(`[AgentWS] ⏱️  Agent ${clientId} sem resposta há ${timeSinceLastPing}ms. Removendo...`);
      agent.ws.terminate();
      agents.delete(clientId);
    }
  });
}

// ============================================
// API PÚBLICA
// ============================================

/**
 * Enviar comando para agent e aguardar resposta
 */
export async function sendCommandToAgent(
  agentId: string,
  action: string,
  data?: any,
  timeout: number = 30000
): Promise<any> {
  const agent = agents.get(agentId);

  if (!agent) {
    throw new Error(`Agent ${agentId} não está conectado`);
  }

  if (agent.ws.readyState !== WebSocket.OPEN) {
    throw new Error(`Agent ${agentId} não está pronto (readyState: ${agent.ws.readyState})`);
  }

  const requestId = generateRequestId();

  const command: AgentCommand = {
    requestId,
    action,
    data,
  };

  console.log(`[AgentWS] 📤 Enviando comando para ${agentId}: ${action} (requestId: ${requestId})`);

  return new Promise((resolve, reject) => {
    // Criar timeout
    const timeoutHandle = setTimeout(() => {
      pendingResponses.delete(requestId);
      reject(new Error(`Timeout aguardando resposta do agent ${agentId} (${timeout}ms)`));
    }, timeout);

    // Registrar handler
    pendingResponses.set(requestId, {
      resolve,
      reject,
      timeout: timeoutHandle,
    });

    // Enviar comando
    try {
      agent.ws.send(JSON.stringify(command));
    } catch (error) {
      clearTimeout(timeoutHandle);
      pendingResponses.delete(requestId);
      reject(error);
    }
  });
}

/**
 * Verificar se agent está conectado
 */
export function isAgentConnected(agentId: string): boolean {
  const agent = agents.get(agentId);
  return agent !== undefined && agent.ws.readyState === WebSocket.OPEN;
}

/**
 * Listar agents conectados
 */
export function listConnectedAgents(): string[] {
  return Array.from(agents.keys());
}

/**
 * Obter informações de um agent
 */
export function getAgentInfo(agentId: string): AgentInfo | null {
  return agents.get(agentId) || null;
}

/**
 * Desconectar agent
 */
export function disconnectAgent(agentId: string): boolean {
  const agent = agents.get(agentId);

  if (!agent) {
    return false;
  }

  agent.ws.close(1000, 'Disconnected by server');
  agents.delete(agentId);
  return true;
}

/**
 * Obter estatísticas
 */
export function getStats() {
  return {
    connectedAgents: agents.size,
    pendingCommands: pendingResponses.size,
    agents: Array.from(agents.entries()).map(([id, info]) => ({
      id,
      connectedAt: info.connectedAt,
      lastPing: info.lastPing,
      readyState: info.ws.readyState,
    })),
  };
}

// ============================================
// UTILITÁRIOS
// ============================================

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// SHUTDOWN GRACIOSO
// ============================================

export function shutdown() {
  console.log('[AgentWS] Encerrando WebSocket Server...');

  // Fechar todas as conexões
  agents.forEach((agent, clientId) => {
    console.log(`[AgentWS] Fechando conexão com ${clientId}`);
    agent.ws.close(1001, 'Server shutting down');
  });

  // Fechar servidor
  if (wss) {
    wss.close(() => {
      console.log('[AgentWS] WebSocket Server encerrado');
    });
  }

  agents.clear();
  pendingResponses.clear();
}

// Tratamento de sinais
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
