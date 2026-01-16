/**
 * Toletus HUB Service
 *
 * Integração com Toletus HUB para controle de catracas LiteNet via agent local.
 * Similar ao ControlIdService, mas específico para dispositivos Toletus HUB.
 *
 * Comunicação:
 * - Servidor VPS → Agent Local (WebSocket)
 * - Agent Local → Toletus HUB (HTTP local)
 * - Toletus HUB → Catr

acas LiteNet (TCP)
 */

import { sendCommandToAgent, isAgentConnected } from "./agentWebSocket";

// ============================================
// TIPOS
// ============================================

export interface ToletusDevice {
  id: number;
  name: string;
  ip: string;
  port: number;
  type: 'LiteNet1' | 'LiteNet2' | 'LiteNet3';
  connected: boolean;
}

interface ToletusHubConfig {
  hubUrl: string;
  agentId: string;
}

// ============================================
// CLASSE TOLETUS HUB SERVICE
// ============================================

/**
 * Service para comunicação com Toletus HUB via agent local
 */
export class ToletusHubService {
  private hubUrl: string;
  private agentId: string;

  constructor(config: ToletusHubConfig) {
    this.hubUrl = config.hubUrl;
    this.agentId = config.agentId;
  }

  /**
   * Envia comando para o agent via WebSocket
   */
  private async sendToAgent(action: string, data?: any, timeout = 30000): Promise<any> {
    if (!this.agentId) {
      throw new Error('Agent ID not configured');
    }

    if (!isAgentConnected(this.agentId)) {
      throw new Error(`Agent ${this.agentId} não está conectado`);
    }

    console.log(`[ToletusHub] Enviando comando para agent ${this.agentId}: ${action}`);

    return await sendCommandToAgent(this.agentId, action, data, timeout);
  }

  /**
   * Descobrir dispositivos na rede
   */
  async discoverDevices(): Promise<ToletusDevice[]> {
    console.log('[ToletusHub] Descobrindo dispositivos na rede...');
    return await this.sendToAgent('toletus_discoverDevices');
  }

  /**
   * Listar dispositivos conectados ao HUB
   */
  async getDevices(): Promise<ToletusDevice[]> {
    console.log('[ToletusHub] Buscando dispositivos conectados...');
    return await this.sendToAgent('toletus_getDevices');
  }

  /**
   * Conectar a um dispositivo
   */
  async connectDevice(ip: string, type: string): Promise<void> {
    console.log(`[ToletusHub] Conectando ao dispositivo ${ip} (${type})...`);
    return await this.sendToAgent('toletus_connectDevice', { ip, type });
  }

  /**
   * Desconectar de um dispositivo
   */
  async disconnectDevice(ip: string, type: string): Promise<void> {
    console.log(`[ToletusHub] Desconectando do dispositivo ${ip} (${type})...`);
    return await this.sendToAgent('toletus_disconnectDevice', { ip, type });
  }

  /**
   * Liberar entrada na catraca
   */
  async releaseEntry(device: ToletusDevice, message: string): Promise<boolean> {
    console.log(`[ToletusHub] Liberando entrada no dispositivo ${device.name} (${device.ip})`);
    return await this.sendToAgent('toletus_releaseEntry', {
      device,
      message
    }, 60000); // 60 segundos para discover + connect + release
  }

  /**
   * Liberar saída na catraca
   */
  async releaseExit(device: ToletusDevice, message: string): Promise<boolean> {
    console.log(`[ToletusHub] Liberando saída no dispositivo ${device.name} (${device.ip})`);
    return await this.sendToAgent('toletus_releaseExit', {
      device,
      message
    }, 60000); // 60 segundos para discover + connect + release
  }

  /**
   * Liberar entrada e saída simultaneamente
   */
  async releaseEntryAndExit(device: ToletusDevice, message: string): Promise<boolean> {
    console.log(`[ToletusHub] Liberando entrada/saída no dispositivo ${device.name} (${device.ip})`);
    return await this.sendToAgent('toletus_releaseEntryAndExit', {
      device,
      message
    }, 60000); // 60 segundos para discover + connect + release
  }

  /**
   * Configurar direção da entrada (sentido horário ou anti-horário)
   * IMPORTANTE: Só funciona para dispositivos LiteNet2
   */
  async setEntryClockwise(device: ToletusDevice, entryClockwise: boolean): Promise<boolean> {
    console.log(`[ToletusHub] Configurando direção da entrada no dispositivo ${device.name} (${device.ip}) para ${entryClockwise ? 'HORÁRIO' : 'ANTI-HORÁRIO'}`);
    return await this.sendToAgent('toletus_setEntryClockwise', {
      device,
      entryClockwise
    }, 30000); // 30 segundos para configurar
  }

  /**
   * Configurar endpoint de webhook
   */
  async setWebhook(endpoint: string): Promise<void> {
    console.log(`[ToletusHub] Configurando webhook: ${endpoint}`);
    return await this.sendToAgent('toletus_setWebhook', { endpoint });
  }

  /**
   * Verificar status do Toletus HUB
   */
  async checkStatus(): Promise<boolean> {
    try {
      console.log('[ToletusHub] Verificando status do Toletus HUB...');
      await this.sendToAgent('toletus_checkStatus', {}, 5000);
      return true;
    } catch (error) {
      console.error('[ToletusHub] Erro ao verificar status:', error);
      return false;
    }
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Obter instância do ToletusHubService para uma academia
 * Busca a configuração do HUB no banco e cria a instância
 */
export async function getToletusHubServiceForGym(gymId: number): Promise<ToletusHubService | null> {
  const db = await import('./db');

  // Buscar dispositivos Toletus da academia
  const devices = await db.listToletusDevices(gymId);

  if (devices.length === 0) {
    console.log(`[ToletusHub] Nenhum dispositivo Toletus encontrado para academia ${gymId}`);
    return null;
  }

  // Todos os dispositivos usam o mesmo Toletus HUB local
  const hubUrl = devices[0].hubUrl;
  const agentId = `academia-${gymId}`;

  console.log(`[ToletusHub] Criando serviço para academia ${gymId}`);
  console.log(`[ToletusHub] HUB URL: ${hubUrl}`);
  console.log(`[ToletusHub] Agent ID: ${agentId}`);

  return new ToletusHubService({
    hubUrl,
    agentId
  });
}

/**
 * Converter tipo de string para número (usado na comunicação com Toletus HUB)
 */
export function deviceTypeToNumber(type: string): number {
  const typeMap: Record<string, number> = {
    'LiteNet1': 0,
    'LiteNet2': 1,
    'LiteNet3': 2,
    'SM25': 3
  };
  return typeMap[type] || 1; // Default: LiteNet2
}

/**
 * Criar objeto device no formato esperado pelo Toletus HUB
 */
export function createToletusDevicePayload(device: {
  deviceId: number;
  name: string;
  deviceIp: string;
  devicePort: number;
  deviceType: string;
}): ToletusDevice {
  return {
    id: device.deviceId,
    name: device.name,
    ip: device.deviceIp,
    port: device.devicePort,
    type: device.deviceType as 'LiteNet1' | 'LiteNet2' | 'LiteNet3',
    connected: true
  };
}
