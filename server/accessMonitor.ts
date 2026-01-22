/**
 * Access Monitor
 *
 * Monitora logs de acesso da leitora Control ID em tempo real
 * e libera a catraca Toletus automaticamente quando um acesso válido é detectado.
 */

import { getControlIdServiceForGym } from './controlId';
import { getToletusHubServiceForGym, createToletusDevicePayload } from './toletusHub';

// ============================================
// TIPOS
// ============================================

interface AccessLog {
  time: number;           // Unix timestamp
  event: number;          // Tipo de evento
  identifier_id: number;  // ID do usuário na Control ID
  user_id?: number;       // ID do usuário (pode estar em identifier_id)
  device_id: number;      // ID do dispositivo
}

interface MonitorState {
  lastProcessedTime: number;  // Último timestamp processado
  isRunning: boolean;
}

// ============================================
// ESTADO GLOBAL
// ============================================

const monitors = new Map<number, MonitorState>();
const POLL_INTERVAL = 1000; // 1 segundo

// ============================================
// LÓGICA PRINCIPAL
// ============================================

/**
 * Iniciar monitoramento para uma academia
 */
export async function startAccessMonitor(gymId: number): Promise<void> {
  if (monitors.has(gymId)) {
    console.log(`[AccessMonitor] Monitor já rodando para gymId ${gymId}`);
    return;
  }

  console.log(`[AccessMonitor] 🚀 Iniciando monitor para gymId ${gymId}...`);

  const state: MonitorState = {
    lastProcessedTime: Math.floor(Date.now() / 1000), // Começar do agora
    isRunning: true,
  };

  monitors.set(gymId, state);

  // Iniciar loop de monitoramento
  pollAccessLogs(gymId);
}

/**
 * Parar monitoramento para uma academia
 */
export function stopAccessMonitor(gymId: number): void {
  const state = monitors.get(gymId);

  if (!state) {
    console.log(`[AccessMonitor] Monitor não existe para gymId ${gymId}`);
    return;
  }

  console.log(`[AccessMonitor] ⏹️  Parando monitor para gymId ${gymId}...`);
  state.isRunning = false;
  monitors.delete(gymId);
}

/**
 * Loop de polling dos logs de acesso
 */
async function pollAccessLogs(gymId: number): Promise<void> {
  const state = monitors.get(gymId);

  if (!state || !state.isRunning) {
    return; // Monitor foi parado
  }

  try {
    // Buscar serviço da Control ID
    const controlIdService = await getControlIdServiceForGym(gymId);

    if (!controlIdService) {
      console.log(`[AccessMonitor] Nenhum dispositivo Control ID encontrado para gymId ${gymId}`);
      setTimeout(() => pollAccessLogs(gymId), POLL_INTERVAL * 10); // Retry a cada 10 segundos
      return;
    }

    // Carregar logs de acesso
    const logs = await controlIdService.loadAccessLogs();

    // Filtrar apenas logs novos (após lastProcessedTime)
    const newLogs = logs.filter((log: AccessLog) => log.time > state.lastProcessedTime);

    if (newLogs.length > 0) {
      console.log(`[AccessMonitor] 📋 ${newLogs.length} novo(s) log(s) detectado(s) para gymId ${gymId}`);

      // Processar cada log novo
      for (const log of newLogs) {
        await processAccessLog(gymId, log);
      }

      // Atualizar último timestamp processado
      const latestTime = Math.max(...newLogs.map((log: AccessLog) => log.time));
      state.lastProcessedTime = latestTime;
    }

  } catch (error: any) {
    console.error(`[AccessMonitor] ❌ Erro ao processar logs para gymId ${gymId}:`, error.message);
  }

  // Agendar próxima verificação
  setTimeout(() => pollAccessLogs(gymId), POLL_INTERVAL);
}

/**
 * Processar um log de acesso individual
 */
async function processAccessLog(gymId: number, log: AccessLog): Promise<void> {
  try {
    console.log(`[AccessMonitor] 🔍 Processando acesso: userId=${log.identifier_id || log.user_id}, event=${log.event}, time=${new Date(log.time * 1000).toISOString()}`);

    // EVENT CODES (Control ID):
    // 7 = Access granted (acesso permitido)
    // 30 = Unknown user (usuário desconhecido)
    // Outros eventos podem existir dependendo da configuração

    const userId = log.identifier_id || log.user_id;

    // Verificar se é um acesso concedido
    if (log.event !== 7) {
      console.log(`[AccessMonitor] ℹ️  Evento ${log.event} ignorado (não é acesso concedido)`);
      return;
    }

    console.log(`[AccessMonitor] ✅ Acesso CONCEDIDO para userId ${userId} no gymId ${gymId}`);

    // Buscar dados do aluno/staff no banco
    const db = await import('./db');
    const person = await findPersonByControlIdUserId(gymId, userId);

    if (!person) {
      console.log(`[AccessMonitor] ⚠️  Usuário ${userId} não encontrado no banco de dados`);
      return;
    }

    console.log(`[AccessMonitor] 👤 Usuário identificado: ${person.name} (${person.type})`);

    // Buscar configuração da academia para ver tipo de catraca
    const gym = await db.getGymById(gymId);

    if (!gym) {
      console.log(`[AccessMonitor] ⚠️  Academia ${gymId} não encontrada`);
      return;
    }

    // Verificar se a academia usa catraca Toletus
    if (gym.turnstileType !== 'toletus') {
      console.log(`[AccessMonitor] ℹ️  Academia ${gymId} não usa catraca Toletus (tipo: ${gym.turnstileType})`);
      return;
    }

    // Liberar entrada na catraca Toletus
    await releaseToletusEntry(gymId, person.name);

  } catch (error: any) {
    console.error(`[AccessMonitor] ❌ Erro ao processar log de acesso:`, error.message);
  }
}

/**
 * Buscar pessoa (aluno ou staff) pelo controlIdUserId
 */
async function findPersonByControlIdUserId(gymId: number, controlIdUserId: number): Promise<{ name: string; type: 'student' | 'staff' } | null> {
  const db = await import('./db');

  // Procurar em students
  const students = await db.query(
    `SELECT u.name FROM students s
     LEFT JOIN users u ON s.userId = u.id
     WHERE s.gymId = ? AND s.controlIdUserId = ?`,
    [gymId, controlIdUserId]
  );

  if (students.length > 0) {
    return { name: students[0].name, type: 'student' };
  }

  // Procurar em staff
  const staff = await db.query(
    `SELECT userName as name FROM staff
     WHERE gymId = ? AND controlIdUserId = ?`,
    [gymId, controlIdUserId]
  );

  if (staff.length > 0) {
    return { name: staff[0].name, type: 'staff' };
  }

  return null;
}

/**
 * Liberar entrada na catraca Toletus
 */
async function releaseToletusEntry(gymId: number, personName: string): Promise<void> {
  try {
    console.log(`[AccessMonitor] 🚪 Liberando catraca Toletus para ${personName} no gymId ${gymId}...`);

    // Buscar serviço Toletus
    const toletusService = await getToletusHubServiceForGym(gymId);

    if (!toletusService) {
      console.log(`[AccessMonitor] ⚠️  Nenhum dispositivo Toletus encontrado para gymId ${gymId}`);
      return;
    }

    // Buscar dispositivos Toletus da academia
    const db = await import('./db');
    const devices = await db.listToletusDevices(gymId);

    if (devices.length === 0) {
      console.log(`[AccessMonitor] ⚠️  Nenhum dispositivo Toletus configurado para gymId ${gymId}`);
      return;
    }

    // Usar o primeiro dispositivo (pode melhorar depois para suportar múltiplos)
    const device = devices[0];
    const toletusDevice = createToletusDevicePayload(device);

    // Liberar entrada
    const success = await toletusService.releaseEntry(toletusDevice, `Bem-vindo, ${personName}!`);

    if (success) {
      console.log(`[AccessMonitor] ✅ Catraca liberada com sucesso para ${personName}`);
    } else {
      console.log(`[AccessMonitor] ❌ Falha ao liberar catraca para ${personName}`);
    }

  } catch (error: any) {
    console.error(`[AccessMonitor] ❌ Erro ao liberar catraca Toletus:`, error.message);
  }
}

// ============================================
// API PÚBLICA
// ============================================

/**
 * Obter status de todos os monitors
 */
export function getMonitorStatus(): Array<{ gymId: number; lastProcessedTime: number; isRunning: boolean }> {
  return Array.from(monitors.entries()).map(([gymId, state]) => ({
    gymId,
    lastProcessedTime: state.lastProcessedTime,
    isRunning: state.isRunning,
  }));
}

/**
 * Verificar se monitor está rodando para uma academia
 */
export function isMonitorRunning(gymId: number): boolean {
  const state = monitors.get(gymId);
  return state !== undefined && state.isRunning;
}
