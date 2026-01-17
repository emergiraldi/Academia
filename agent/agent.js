#!/usr/bin/env node
/**
 * Control ID Agent - Cliente Local
 *
 * Este agent roda no cliente e faz a ponte entre a VPS e a leitora Control ID local.
 *
 * Funções:
 * - Conecta na VPS via WebSocket seguro (WSS)
 * - Executa comandos HTTP na leitora Control ID (rede local)
 * - Reconexão automática em caso de falha
 * - Logs detalhados para troubleshooting
 */

const WebSocket = require('ws');
const axios = require('axios');
require('dotenv').config();

// ============================================
// CONFIGURAÇÕES
// ============================================

const config = {
  leitora: {
    ip: process.env.LEITORA_IP || '192.168.2.142',
    port: parseInt(process.env.LEITORA_PORT) || 80,
    username: process.env.LEITORA_USERNAME || 'admin',
    password: process.env.LEITORA_PASSWORD || 'admin'
  },
  toletus: {
    hubUrl: process.env.TOLETUS_HUB_URL || 'https://localhost:7067'
  },
  vps: {
    url: process.env.VPS_URL || 'ws://localhost:8080',
    reconnectInterval: 5000, // 5 segundos
    maxReconnectAttempts: 10,
    pingInterval: 30000 // 30 segundos
  },
  agent: {
    id: process.env.AGENT_ID || 'academia-1',
    token: process.env.AUTH_TOKEN || 'development-token'
  }
};

// ============================================
// ESTADO GLOBAL
// ============================================

let ws = null;
let session = null; // Sessão da leitora Control ID
let reconnectAttempts = 0;
let pingInterval = null;
let isConnected = false;

// ============================================
// LOGGING
// ============================================

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📘',
    success: '✅',
    warn: '⚠️',
    error: '❌',
    debug: '🔍'
  }[level] || '📘';

  console.log(`[${timestamp}] ${prefix} ${message}`, ...args);
}

// ============================================
// COMUNICAÇÃO COM LEITORA CONTROL ID
// ============================================

function getLeitoraUrl(endpoint) {
  return `http://${config.leitora.ip}:${config.leitora.port}${endpoint}`;
}

async function loginLeitora() {
  try {
    log('info', 'Fazendo login na leitora Control ID...');

    const response = await axios.post(
      getLeitoraUrl('/login.fcgi'),
      {
        login: config.leitora.username,
        password: config.leitora.password
      },
      { timeout: 10000 }
    );

    session = response.data.session;
    log('success', `Login na leitora OK. Session: ${session.substring(0, 10)}...`);
    return session;
  } catch (error) {
    log('error', 'Erro ao fazer login na leitora:', error.message);
    throw new Error('Falha no login da leitora: ' + error.message);
  }
}

async function garantirSessao() {
  if (!session) {
    await loginLeitora();
  }
  return session;
}

async function verificarLeitora() {
  try {
    const response = await axios.get(
      getLeitoraUrl('/'),
      { timeout: 5000 }
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// ============================================
// COMUNICAÇÃO COM TOLETUS HUB
// ============================================

const https = require('https');

// Agent HTTPS que ignora certificados autoassinados
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

function getToletusUrl(endpoint) {
  return `${config.toletus.hubUrl}${endpoint}`;
}

async function toletusDiscoverDevices() {
  log('info', 'Toletus: Descobrindo dispositivos na rede...');
  const response = await axios.get(
    getToletusUrl('/DeviceConnection/DiscoverDevices'),
    { httpsAgent, timeout: 15000 }
  );
  log('success', `Toletus: ${response.data?.length || 0} dispositivos encontrados`);
  return response.data;
}

async function toletusGetDevices() {
  log('info', 'Toletus: Listando dispositivos conectados...');
  const response = await axios.get(
    getToletusUrl('/DeviceConnection/GetDevices'),
    { httpsAgent, timeout: 10000 }
  );
  log('success', `Toletus: ${response.data?.length || 0} dispositivos conectados`);
  return response.data;
}

async function toletusDiscoverDevices() {
  log('info', `Toletus: Descobrindo dispositivos na rede...`);

  const response = await axios.get(
    getToletusUrl(`/DeviceConnection/DiscoverDevices`),
    { httpsAgent, timeout: 30000 }
  );

  const devices = response.data?.data || [];
  log('success', `Toletus: ${devices.length} dispositivo(s) descoberto(s)`);
  return devices;
}

async function toletusConnectDevice({ ip, type }) {
  log('info', `Toletus: Conectando ao dispositivo ${ip} (${type})...`);

  // LiteNet3 requer parâmetro network (rede do dispositivo, ex: 192.168.0.0)
  let url = `/DeviceConnection/Connect?ip=${ip}&type=${type}`;
  if (type === 'LiteNet3') {
    // Calcular network a partir do IP (ex: 192.168.0.100 -> 192.168.0.0)
    const networkParts = ip.split('.');
    networkParts[3] = '0';
    const network = networkParts.join('.');
    url += `&network=${network}`;
    log('info', `Toletus: LiteNet3 detectado, usando network: ${network}`);
  }

  const response = await axios.post(
    getToletusUrl(url),
    {},
    { httpsAgent, timeout: 10000 }
  );
  log('success', `Toletus: Conectado ao dispositivo ${ip}`);
  return response.data;
}

async function toletusDisconnectDevice({ ip, type }) {
  log('info', `Toletus: Desconectando do dispositivo ${ip} (${type})...`);

  // IMPORTANTE: Toletus HUB espera o tipo como STRING (LiteNet1, LiteNet2, LiteNet3), não como número!
  const response = await axios.post(
    getToletusUrl(`/DeviceConnection/Disconnect?ip=${ip}&type=${type}`),
    {},
    { httpsAgent, timeout: 10000 }
  );
  log('success', `Toletus: Desconectado do dispositivo ${ip}`);
  return response.data;
}

async function toletusReleaseEntry({ device, message }) {
  log('info', `Toletus: Liberando entrada - ${device.name} (${device.ip}) - Msg: "${message}"`);

  // Função auxiliar para tentar liberar
  const tryRelease = async (payload) => {
    const endpoint = device.type === 'LiteNet1' ? '/LiteNet1Commands/ReleaseEntry' :
                     device.type === 'LiteNet2' ? '/LiteNet2Commands/ReleaseEntry' :
                     device.type === 'LiteNet3' ? '/LiteNet3Commands/ReleaseEntry' :
                     '/BasicCommonCommands/ReleaseEntry';

    log('info', `Toletus: Chamando ${endpoint} com payload:`, JSON.stringify(payload));

    const response = await axios.post(
      getToletusUrl(`${endpoint}?message=${encodeURIComponent(message)}`),
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent,
        timeout: 10000
      }
    );

    log('info', `Toletus: Resposta completa do HUB:`, JSON.stringify(response.data));

    return response.data?.response?.success || false;
  };

  // OTIMIZAÇÃO: Tentar liberar diretamente primeiro (assume que já está conectado)
  let payload = {
    Id: device.id,
    Name: device.name,
    Ip: device.ip,
    SerialNumber: '',
    Port: device.port,
    Type: device.type === 'LiteNet1' ? 0 : device.type === 'LiteNet2' ? 1 : device.type === 'LiteNet3' ? 2 : 1,
    Connected: true
  };

  try {
    const success = await tryRelease(payload);
    if (success) {
      log('success', `Toletus: Entrada liberada com sucesso (dispositivo já conectado)`);
      return true;
    }
  } catch (firstError) {
    // Se falhou, verificar se é por "not connected"
    const errorMsg = firstError.response?.data?.response?.message || '';
    if (errorMsg.includes('not in connected') || errorMsg.includes('not connected')) {
      log('info', `Toletus: Dispositivo não conectado, fazendo discover e connect...`);

      // Descobrir dispositivo para obter dados corretos
      try {
        const devices = await toletusDiscoverDevices();
        const discoveredDevice = devices.find(d => d.ip === device.ip);

        if (discoveredDevice) {
          log('success', `Toletus: Dispositivo ${device.ip} encontrado (ID: ${discoveredDevice.id})`);

          // Atualizar payload com dados descobertos
          payload = {
            Id: discoveredDevice.id,
            Name: discoveredDevice.name,
            Ip: discoveredDevice.ip,
            SerialNumber: discoveredDevice.serialNumber || '',
            Port: discoveredDevice.port,
            Type: discoveredDevice.type,
            Connected: true
          };

          // Conectar dispositivo
          try {
            await toletusConnectDevice({
              ip: payload.Ip,
              type: device.type,
              network: device.network
            });
            log('success', `Toletus: Dispositivo conectado`);
          } catch (connectError) {
            if (connectError.response?.data?.response?.message?.includes('already connected')) {
              log('info', `Toletus: Dispositivo já conectado`);
            } else {
              log('warn', `Toletus: Aviso ao conectar: ${connectError.message}`);
            }
          }

          // Tentar liberar novamente
          const success = await tryRelease(payload);
          if (success) {
            log('success', `Toletus: Entrada liberada com sucesso`);
            return true;
          }
        }
      } catch (retryError) {
        log('error', `Toletus: Erro ao reconectar: ${retryError.message}`);
        throw retryError;
      }
    } else {
      log('error', `Toletus: Erro HTTP ${firstError.response?.status}: ${JSON.stringify(firstError.response?.data)}`);
      throw firstError;
    }
  }

  log('error', `Toletus: Falha ao liberar entrada após todas as tentativas`);
  return false;
}

async function toletusReleaseExit({ device, message }) {
  log('info', `Toletus: Liberando saída - ${device.name} (${device.ip}) - Msg: "${message}"`);

  // Usar endpoint específico baseado no tipo de dispositivo
  const endpoint = device.type === 'LiteNet1' ? '/LiteNet1Commands/ReleaseExit' :
                   device.type === 'LiteNet2' ? '/LiteNet2Commands/ReleaseExit' :
                   device.type === 'LiteNet3' ? '/LiteNet3Commands/ReleaseExit' :
                   '/BasicCommonCommands/ReleaseExit';

  // Função auxiliar para tentar liberar
  const tryRelease = async (payload) => {
    log('info', `Toletus: Chamando ${endpoint} com payload:`, JSON.stringify(payload));
    const response = await axios.post(
      getToletusUrl(`${endpoint}?message=${encodeURIComponent(message)}`),
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent,
        timeout: 10000
      }
    );
    log('info', `Toletus: Resposta completa do HUB:`, JSON.stringify(response.data));
    return response.data?.response?.success || false;
  };

  // OTIMIZAÇÃO: Tentar liberar diretamente primeiro (assume que já está conectado)
  let payload = {
    Id: device.id,
    Name: device.name,
    Ip: device.ip,
    SerialNumber: '',
    Port: device.port,
    Type: device.type === 'LiteNet1' ? 0 : device.type === 'LiteNet2' ? 1 : device.type === 'LiteNet3' ? 2 : 1,
    Connected: true
  };

  try {
    const success = await tryRelease(payload);
    if (success) {
      log('success', `Toletus: Saída liberada com sucesso (dispositivo já conectado)`);
      return true;
    }
  } catch (firstError) {
    // Se falhou, verificar se é por "not connected"
    const errorMsg = firstError.response?.data?.response?.message || '';
    if (errorMsg.includes('not in connected') || errorMsg.includes('not connected')) {
      log('info', `Toletus: Dispositivo não conectado, fazendo discover e connect...`);

      // Descobrir dispositivo para obter dados corretos
      try {
        const devices = await toletusDiscoverDevices();
        const discoveredDevice = devices.find(d => d.ip === device.ip);

        if (discoveredDevice) {
          log('success', `Toletus: Dispositivo ${device.ip} encontrado (ID: ${discoveredDevice.id})`);

          // Atualizar payload com dados descobertos
          payload = {
            Id: discoveredDevice.id,
            Name: discoveredDevice.name,
            Ip: discoveredDevice.ip,
            SerialNumber: discoveredDevice.serialNumber || '',
            Port: discoveredDevice.port,
            Type: discoveredDevice.type,
            Connected: true
          };

          // Conectar dispositivo
          try {
            await toletusConnectDevice({
              ip: payload.Ip,
              type: device.type,
              network: device.network
            });
            log('success', `Toletus: Dispositivo conectado`);
          } catch (connectError) {
            if (connectError.response?.data?.response?.message?.includes('already connected')) {
              log('info', `Toletus: Dispositivo já conectado`);
            } else {
              log('warn', `Toletus: Aviso ao conectar: ${connectError.message}`);
            }
          }

          // Tentar liberar novamente
          const success = await tryRelease(payload);
          if (success) {
            log('success', `Toletus: Saída liberada com sucesso`);
            return true;
          }
        }
      } catch (retryError) {
        log('error', `Toletus: Erro ao reconectar: ${retryError.message}`);
        throw retryError;
      }
    } else {
      log('error', `Toletus: Erro HTTP ${firstError.response?.status}: ${JSON.stringify(firstError.response?.data)}`);
      throw firstError;
    }
  }

  log('error', `Toletus: Falha ao liberar saída após todas as tentativas`);
  return false;
}

async function toletusReleaseEntryAndExit({ device, message }) {
  log('info', `Toletus: Liberando entrada/saída - ${device.name} (${device.ip}) - Msg: "${message}"`);

  // IMPORTANTE: Descobrir dispositivos primeiro e obter ID correto do Toletus HUB
  let discoveredDevice = null;
  try {
    log('info', `Toletus: Descobrindo dispositivos na rede...`);
    const devices = await toletusDiscoverDevices();

    // Encontrar o dispositivo específico pelo IP
    discoveredDevice = devices.find(d => d.ip === device.ip);
    if (!discoveredDevice) {
      log('warn', `Toletus: Dispositivo ${device.ip} não encontrado no discover`);
    } else {
      log('success', `Toletus: Dispositivo ${device.ip} encontrado (ID Toletus: ${discoveredDevice.id})`);
    }
  } catch (discoverError) {
    log('warn', `Toletus: Erro ao descobrir (${discoverError.message}), tentando liberar mesmo assim...`);
  }

  // Criar payload usando TODOS os dados do dispositivo descoberto
  const payload = {
    Id: discoveredDevice?.id || device.id,
    Name: discoveredDevice?.name || device.name,
    Ip: discoveredDevice?.ip || device.ip,
    SerialNumber: discoveredDevice?.serialNumber || '',
    Port: discoveredDevice?.port || device.port,
    Type: discoveredDevice?.type || device.type,  // Usar tipo numérico do discover
    Connected: discoveredDevice?.connected || true
  };

  // IMPORTANTE: Conectar o dispositivo antes de liberar (se não estiver conectado)
  try {
    log('info', `Toletus: Conectando dispositivo...`);
    await toletusConnectDevice({
      ip: payload.Ip,
      type: device.type,
      network: device.network
    });
    log('success', `Toletus: Dispositivo conectado`);
  } catch (connectError) {
    // Se já estiver conectado, é ok
    if (connectError.response?.data?.response?.message?.includes('already connected')) {
      log('info', `Toletus: Dispositivo já está conectado`);
    } else {
      log('warn', `Toletus: Aviso ao conectar (${connectError.message}), tentando liberar mesmo assim...`);
    }
  }

  // Usar endpoint específico baseado no tipo de dispositivo
  const endpoint = device.type === 'LiteNet1' ? '/LiteNet1Commands/ReleaseEntryAndExit' :
                   device.type === 'LiteNet2' ? '/LiteNet2Commands/ReleaseEntryAndExit' :
                   device.type === 'LiteNet3' ? '/LiteNet3Commands/ReleaseEntryAndExit' :
                   '/BasicCommonCommands/ReleaseEntryAndExit';

  try {
    const response = await axios.post(
      getToletusUrl(`${endpoint}?message=${encodeURIComponent(message)}`),
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent,
        timeout: 10000
      }
    );

    const success = response.data?.response?.success || false;
    if (success) {
      log('success', `Toletus: Entrada/saída liberada com sucesso`);
    } else {
      log('error', `Toletus: Falha ao liberar entrada/saída`);
    }
    return success;
  } catch (error) {
    log('error', `Toletus: Erro HTTP ${error.response?.status}: ${JSON.stringify(error.response?.data)}`);
    throw error;
  }
}

async function toletusSetWebhook({ endpoint }) {
  log('info', `Toletus: Configurando webhook: ${endpoint}`);
  const response = await axios.post(
    getToletusUrl(`/Webhook/SetEndpoint?endpoint=${encodeURIComponent(endpoint)}`),
    {},
    { httpsAgent, timeout: 10000 }
  );
  log('success', `Toletus: Webhook configurado`);
  return true;
}

async function toletusSetEntryClockwise({ device, entryClockwise }) {
  log('info', `Toletus: Configurando direção de entrada no sentido ${entryClockwise ? 'HORÁRIO' : 'ANTI-HORÁRIO'} - ${device.name} (${device.ip})`);

  // Criar payload do dispositivo
  const payload = {
    Id: device.id,
    Name: device.name,
    Ip: device.ip,
    SerialNumber: device.serialNumber || '',
    Port: device.port,
    Type: device.type,
    Connected: true
  };

  // Usar endpoint específico para LiteNet2
  const endpoint = `/LiteNet2Commands/SetEntryClockwise?entryClockwise=${entryClockwise}`;

  try {
    const response = await axios.post(
      getToletusUrl(endpoint),
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent,
        timeout: 10000
      }
    );

    const success = response.data?.response?.success || false;
    if (success) {
      log('success', `Toletus: Direção configurada para ${entryClockwise ? 'HORÁRIO (sentido correto)' : 'ANTI-HORÁRIO'}`);
    } else {
      log('error', `Toletus: Falha ao configurar direção`);
    }
    return success;
  } catch (error) {
    log('error', `Toletus: Erro HTTP ${error.response?.status}: ${JSON.stringify(error.response?.data)}`);
    throw error;
  }
}

async function toletusSetFlowControl({ device, controlledFlow }) {
  log('info', `Toletus: Configurando FlowControl mode=${controlledFlow} - ${device.name} (${device.ip})`);

  // Criar payload do dispositivo
  const payload = {
    Id: device.id,
    Name: device.name,
    Ip: device.ip,
    SerialNumber: device.serialNumber || '',
    Port: device.port,
    Type: device.type,
    Connected: true
  };

  // Usar endpoint específico para LiteNet2
  const endpoint = `/LiteNet2Commands/SetFlowControl?controlledFlow=${controlledFlow}`;

  try {
    const response = await axios.post(
      getToletusUrl(endpoint),
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent,
        timeout: 10000
      }
    );

    const success = response.data?.response?.success || false;
    if (success) {
      log('success', `Toletus: FlowControl configurado para mode=${controlledFlow}`);
    } else {
      log('error', `Toletus: Falha ao configurar FlowControl`);
    }
    return success;
  } catch (error) {
    log('error', `Toletus: Erro HTTP ${error.response?.status}: ${JSON.stringify(error.response?.data)}`);
    throw error;
  }
}

async function toletusCheckStatus() {
  try {
    log('info', 'Toletus: Verificando status do HUB...');
    await axios.get(
      getToletusUrl('/DeviceConnection/GetNetworks'),
      { httpsAgent, timeout: 5000 }
    );
    log('success', 'Toletus: HUB online');
    return true;
  } catch (error) {
    log('error', `Toletus: HUB offline - ${error.message}`);
    return false;
  }
}

// ============================================
// AÇÕES NA LEITORA
// ============================================

async function executarAcao(action, data) {
  log('debug', `Executando ação: ${action}`, data);

  switch (action) {
    case 'login':
      return await loginLeitora();

    case 'checkStatus':
      return await verificarLeitora();

    case 'createUser':
      return await criarUsuario(data);

    case 'enrollFace':
      return await cadastrarFace(data);

    case 'uploadFaceImage':
      return await uploadFaceImage(data);

    case 'blockUserAccess':
      return await bloquearUsuario(data);

    case 'unblockUserAccess':
      return await desbloquearUsuario(data);

    case 'deleteUser':
      return await deletarUsuario(data);

    case 'loadAccessLogs':
      return await carregarLogs();

    case 'getUserImage':
      return await obterImagemUsuario(data);

    case 'listUsersWithFaces':
      return await listarUsuariosComFaces();

    case 'removeUserFace':
      return await removerFaceUsuario(data);

    // ========== TOLETUS HUB ==========
    case 'toletus_discoverDevices':
      return await toletusDiscoverDevices();

    case 'toletus_getDevices':
      return await toletusGetDevices();

    case 'toletus_connectDevice':
      return await toletusConnectDevice(data);

    case 'toletus_disconnectDevice':
      return await toletusDisconnectDevice(data);

    case 'toletus_releaseEntry':
      return await toletusReleaseEntry(data);

    case 'toletus_releaseExit':
      return await toletusReleaseExit(data);

    case 'toletus_releaseEntryAndExit':
      return await toletusReleaseEntryAndExit(data);

    case 'toletus_setWebhook':
      return await toletusSetWebhook(data);

    case 'toletus_setEntryClockwise':
      return await toletusSetEntryClockwise(data);

    case 'toletus_setFlowControl':
      return await toletusSetFlowControl(data);

    case 'toletus_checkStatus':
      return await toletusCheckStatus();

    default:
      throw new Error(`Ação desconhecida: ${action}`);
  }
}

async function criarUsuario(data) {
  await garantirSessao();

  log('info', `Criando usuário: ${data.name} (${data.registration})`);

  const response = await axios.post(
    getLeitoraUrl(`/create_objects.fcgi?session=${session}`),
    {
      object: 'users',
      values: [{
        name: data.name,
        registration: data.registration,
        begin_time: 0,
        end_time: 2147483647
      }]
    },
    { timeout: 10000 }
  );

  if (!response.data.ids || response.data.ids.length === 0) {
    throw new Error('Falha ao criar usuário - nenhum ID retornado');
  }

  const userId = response.data.ids[0];
  log('success', `Usuário criado com ID: ${userId}`);

  // Adicionar ao grupo padrão
  const groupId = data.groupId || 1;
  try {
    await axios.post(
      getLeitoraUrl(`/create_objects.fcgi?session=${session}`),
      {
        object: 'user_groups',
        values: [{
          user_id: userId,
          group_id: groupId
        }]
      },
      { timeout: 10000 }
    );
    log('success', `Usuário ${userId} adicionado ao grupo ${groupId}`);
  } catch (err) {
    if (!err.response?.data?.error?.includes('already exists')) {
      log('warn', 'Erro ao adicionar usuário ao grupo:', err.message);
    }
  }

  return userId;
}

async function cadastrarFace(data) {
  await garantirSessao();

  log('info', `Cadastrando face para usuário ${data.userId}`);

  const response = await axios.post(
    getLeitoraUrl(`/remote_enroll.fcgi?session=${session}`),
    {
      type: 'face',
      user_id: data.userId,
      save: data.save !== undefined ? data.save : true,
      sync: data.sync !== undefined ? data.sync : true,
      auto: data.auto !== undefined ? data.auto : true,
      countdown: data.countdown || 3
    },
    { timeout: 30000 }
  );

  log('success', `Face cadastrada para usuário ${data.userId}`);
  return response.data;
}

async function uploadFaceImage(data) {
  await garantirSessao();

  log('info', `Fazendo upload de imagem para usuário ${data.userId}`);

  const imageBuffer = Buffer.from(data.imageBase64, 'base64');
  const timestamp = data.timestamp || Math.floor(Date.now() / 1000);

  try {
    const response = await axios.post(
      getLeitoraUrl(`/user_set_image.fcgi?user_id=${data.userId}&timestamp=${timestamp}&match=1&session=${session}`),
      imageBuffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        timeout: 30000
      }
    );

    log('success', `Imagem enviada para usuário ${data.userId}`);
    return response.data;
  } catch (error) {
    log('error', `Erro ao enviar imagem: ${error.message}`);
    if (error.response) {
      log('error', `Status: ${error.response.status}`);
      log('error', `Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function bloquearUsuario(data) {
  await garantirSessao();

  log('info', `Bloqueando acesso do usuário ${data.userId}`);

  // Buscar grupos do usuário
  const userGroupsResp = await axios.post(
    getLeitoraUrl(`/load_objects.fcgi?session=${session}`),
    { object: 'user_groups' },
    { timeout: 10000 }
  );

  const userGroups = (userGroupsResp.data.user_groups || []).filter(
    ug => ug.user_id === data.userId
  );

  if (userGroups.length === 0) {
    log('info', `Usuário ${data.userId} já não está em nenhum grupo`);
    return true;
  }

  // Remover de cada grupo
  for (const ug of userGroups) {
    await axios.post(
      getLeitoraUrl(`/destroy_objects.fcgi?session=${session}`),
      {
        object: 'user_groups',
        where: {
          user_groups: {
            user_id: ug.user_id,
            group_id: ug.group_id
          }
        }
      },
      { timeout: 10000 }
    );
  }

  log('success', `Acesso bloqueado para usuário ${data.userId}`);
  return true;
}

async function desbloquearUsuario(data) {
  await garantirSessao();

  const groupId = data.groupId || 1;
  log('info', `Desbloqueando usuário ${data.userId} (grupo ${groupId})`);

  const response = await axios.post(
    getLeitoraUrl(`/create_objects.fcgi?session=${session}`),
    {
      object: 'user_groups',
      values: [{
        user_id: data.userId,
        group_id: groupId
      }]
    },
    { timeout: 10000 }
  );

  log('success', `Acesso desbloqueado para usuário ${data.userId}`);
  return true;
}

async function deletarUsuario(data) {
  await garantirSessao();

  log('info', `Deletando usuário ${data.userId}`);

  const response = await axios.post(
    getLeitoraUrl(`/destroy_objects.fcgi?session=${session}`),
    {
      object: 'users',
      where: {
        users: {
          id: data.userId
        }
      }
    },
    { timeout: 10000 }
  );

  log('success', `Usuário ${data.userId} deletado`);
  return true;
}

async function carregarLogs() {
  await garantirSessao();

  log('debug', 'Carregando logs de acesso...');

  const response = await axios.post(
    getLeitoraUrl(`/load_objects.fcgi?session=${session}`),
    { object: 'access_logs' },
    { timeout: 10000 }
  );

  const logs = response.data.access_logs || [];
  log('debug', `${logs.length} logs carregados`);
  return logs;
}

async function obterImagemUsuario(data) {
  await garantirSessao();

  const response = await axios.get(
    getLeitoraUrl(`/user_get_image.fcgi?user_id=${data.userId}&get_timestamp=1&session=${session}`),
    { timeout: 10000 }
  );

  return response.data;
}

async function listarUsuariosComFaces() {
  await garantirSessao();

  const response = await axios.get(
    getLeitoraUrl(`/user_list_images.fcgi?get_timestamp=1&session=${session}`),
    { timeout: 10000 }
  );

  return response.data.image_info || [];
}

async function removerFaceUsuario(data) {
  await garantirSessao();

  log('info', `Removendo face do usuário ${data.userId}`);

  const response = await axios.post(
    getLeitoraUrl(`/user_remove_image.fcgi?session=${session}`),
    { user_id: data.userId },
    { timeout: 10000 }
  );

  log('success', `Face removida do usuário ${data.userId}`);
  return true;
}

// ============================================
// COMUNICAÇÃO COM VPS (WebSocket)
// ============================================

function conectarVPS() {
  log('info', `Conectando na VPS: ${config.vps.url}`);

  try {
    ws = new WebSocket(config.vps.url, {
      headers: {
        'x-client-id': config.agent.id,
        'authorization': `Bearer ${config.agent.token}`
      }
    });

    ws.on('open', onVPSOpen);
    ws.on('message', onVPSMessage);
    ws.on('close', onVPSClose);
    ws.on('error', onVPSError);
    ws.on('pong', () => {
      log('debug', 'Pong recebido da VPS');
    });

  } catch (error) {
    log('error', 'Erro ao criar WebSocket:', error.message);
    tentarReconectar();
  }
}

function onVPSOpen() {
  log('success', 'Conectado na VPS!');
  isConnected = true;
  reconnectAttempts = 0;

  // Iniciar ping para manter conexão viva
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.ping();
      log('debug', 'Ping enviado para VPS');
    }
  }, config.vps.pingInterval);

  // Verificar leitora
  verificarLeitora().then(ok => {
    if (ok) {
      log('success', `Leitora Control ID OK (${config.leitora.ip})`);
    } else {
      log('warn', `Leitora Control ID não responde (${config.leitora.ip})`);
    }
  });
}

async function onVPSMessage(data) {
  let comando;

  try {
    comando = JSON.parse(data.toString());
    log('debug', `Comando recebido: ${comando.action} (ID: ${comando.requestId})`);

    // Executar ação na leitora
    const resultado = await executarAcao(comando.action, comando.data);

    // Enviar resposta de sucesso
    enviarResposta({
      requestId: comando.requestId,
      success: true,
      data: resultado
    });

  } catch (error) {
    log('error', `Erro ao executar ${comando?.action}:`, error.message);

    // Enviar resposta de erro
    enviarResposta({
      requestId: comando?.requestId,
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

function enviarResposta(resposta) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(resposta));
    log('debug', `Resposta enviada (ID: ${resposta.requestId})`);
  } else {
    log('error', 'WebSocket não está aberto. Não foi possível enviar resposta.');
  }
}

function onVPSClose() {
  log('warn', 'Conexão com VPS fechada');
  isConnected = false;

  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }

  tentarReconectar();
}

function onVPSError(error) {
  log('error', 'Erro no WebSocket:', error.message);
}

function tentarReconectar() {
  if (reconnectAttempts >= config.vps.maxReconnectAttempts) {
    log('error', `Máximo de tentativas de reconexão atingido (${config.vps.maxReconnectAttempts}). Aguardando 1 minuto...`);
    reconnectAttempts = 0;
    setTimeout(tentarReconectar, 60000);
    return;
  }

  reconnectAttempts++;
  log('info', `Tentativa de reconexão ${reconnectAttempts}/${config.vps.maxReconnectAttempts} em 5 segundos...`);

  setTimeout(() => {
    conectarVPS();
  }, config.vps.reconnectInterval);
}

// ============================================
// INICIALIZAÇÃO
// ============================================

async function iniciar() {
  log('info', '='.repeat(60));
  log('info', 'Control ID Agent - Iniciando...');
  log('info', '='.repeat(60));
  log('info', `Agent ID: ${config.agent.id}`);
  log('info', `Leitora: ${config.leitora.ip}:${config.leitora.port}`);
  log('info', `VPS: ${config.vps.url}`);
  log('info', '='.repeat(60));

  // Verificar leitora antes de conectar
  log('info', 'Verificando leitora Control ID...');
  const leitoraOk = await verificarLeitora();

  if (!leitoraOk) {
    log('warn', 'Leitora não está respondendo. Continuando mesmo assim...');
  } else {
    log('success', 'Leitora Control ID está respondendo!');

    // Fazer login
    try {
      await loginLeitora();
    } catch (error) {
      log('warn', 'Não foi possível fazer login na leitora. Tentando mais tarde...');
    }
  }

  // Conectar na VPS
  conectarVPS();
}

// Tratamento de sinais para shutdown gracioso
process.on('SIGINT', () => {
  log('info', 'Recebido SIGINT. Encerrando...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Recebido SIGTERM. Encerrando...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  log('error', 'Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Promise rejeitada não tratada:', reason);
});

// Iniciar agent
iniciar();
