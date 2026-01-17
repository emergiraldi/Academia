import { Router } from "express";
import { getDb } from "./db";
import { ToletusHubService } from "./toletusHub";

const router = Router();

/**
 * Endpoint de teste manual para configurar FlowControl da catraca Toletus
 *
 * Modos disponíveis:
 * - 0: Entrada Controlada, Saída Livre
 * - 1: Entrada Controlada, Saída Bloqueada
 * - 2: Entrada Controlada, Saída Controlada
 * - 3: Entrada Livre, Saída Controlada ← **PROVÁVEL SOLUÇÃO**
 * - 5: Ambos Livres
 * - 6: Entrada Livre, Saída Bloqueada
 * - 7: Entrada Bloqueada, Saída Livre ← **ALTERNATIVA**
 * - 8: Ambos Bloqueados
 *
 * Uso:
 * POST /api/toletus/test-flow-control/:gymId/:mode
 *
 * Exemplo: POST /api/toletus/test-flow-control/33/3
 */
router.post("/api/toletus/test-flow-control/:gymId/:mode", async (req, res) => {
  const { gymId, mode } = req.params;
  const gymIdNum = parseInt(gymId);
  const modeNum = parseInt(mode);

  // Validar parâmetros
  if (isNaN(gymIdNum) || isNaN(modeNum)) {
    return res.status(400).json({
      success: false,
      error: "gymId e mode devem ser números"
    });
  }

  // Validar modo
  const validModes = [0, 1, 2, 3, 5, 6, 7, 8];
  if (!validModes.includes(modeNum)) {
    return res.status(400).json({
      success: false,
      error: `Modo inválido. Modos válidos: ${validModes.join(", ")}`
    });
  }

  try {
    console.log(`[ToletusTest] 🧪 Testando FlowControl mode=${modeNum} para academia ${gymIdNum}`);

    // Obter instância do banco
    const db = await getDb();
    if (!db) {
      console.error("[ToletusTest] ❌ Database not available");
      return res.status(500).json({
        success: false,
        error: "Database not available"
      });
    }

    // Buscar dispositivo Toletus da academia
    const device = await db.query.toletusDevices.findFirst({
      where: (toletusDevices, { eq, and }) =>
        and(
          eq(toletusDevices.gymId, gymIdNum),
          eq(toletusDevices.active, true)
        ),
    });

    if (!device) {
      console.log(`[ToletusTest] ❌ Nenhum dispositivo Toletus ativo encontrado para academia ${gymIdNum}`);
      return res.status(404).json({
        success: false,
        error: `Nenhum dispositivo Toletus ativo encontrado para academia ${gymIdNum}`
      });
    }

    console.log(`[ToletusTest] 📡 Dispositivo encontrado: ${device.name} (${device.deviceIp})`);

    // Criar instância do ToletusHubService
    const toletusService = new ToletusHubService();

    // Preparar payload do dispositivo
    const devicePayload = {
      id: device.id,
      name: device.name,
      ip: device.deviceIp,
      port: device.port || 7878,
      serialNumber: device.serialNumber || '',
      type: 1 // LiteNet2
    };

    // Configurar FlowControl
    console.log(`[ToletusTest] 🔧 Enviando comando SetFlowControl(${modeNum})...`);
    const success = await toletusService.setFlowControl(devicePayload, modeNum);

    if (success) {
      console.log(`[ToletusTest] ✅ FlowControl configurado com sucesso para mode=${modeNum}`);
      return res.json({
        success: true,
        message: `FlowControl configurado para mode=${modeNum}`,
        device: {
          id: device.id,
          name: device.name,
          ip: device.deviceIp
        },
        mode: modeNum,
        modeDescription: getModeDescription(modeNum)
      });
    } else {
      console.log(`[ToletusTest] ❌ Falha ao configurar FlowControl`);
      return res.status(500).json({
        success: false,
        error: "Falha ao configurar FlowControl"
      });
    }

  } catch (error: any) {
    console.error(`[ToletusTest] ❌ Erro ao testar FlowControl:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao configurar FlowControl"
    });
  }
});

/**
 * Endpoint auxiliar para listar modos disponíveis
 */
router.get("/api/toletus/flow-control-modes", (req, res) => {
  res.json({
    modes: [
      { mode: 0, description: "Entrada Controlada, Saída Livre", recommended: false },
      { mode: 1, description: "Entrada Controlada, Saída Bloqueada", recommended: false },
      { mode: 2, description: "Entrada Controlada, Saída Controlada", recommended: false },
      { mode: 3, description: "Entrada Livre, Saída Controlada", recommended: true, note: "PROVÁVEL SOLUÇÃO - Inverte o bloqueio" },
      { mode: 5, description: "Ambos Livres", recommended: false },
      { mode: 6, description: "Entrada Livre, Saída Bloqueada", recommended: false },
      { mode: 7, description: "Entrada Bloqueada, Saída Livre", recommended: true, note: "ALTERNATIVA - Pode funcionar dependendo da catraca" },
      { mode: 8, description: "Ambos Bloqueados", recommended: false }
    ]
  });
});

function getModeDescription(mode: number): string {
  const descriptions: Record<number, string> = {
    0: "Entrada Controlada, Saída Livre",
    1: "Entrada Controlada, Saída Bloqueada",
    2: "Entrada Controlada, Saída Controlada",
    3: "Entrada Livre, Saída Controlada",
    5: "Ambos Livres",
    6: "Entrada Livre, Saída Bloqueada",
    7: "Entrada Bloqueada, Saída Livre",
    8: "Ambos Bloqueados"
  };
  return descriptions[mode] || "Modo desconhecido";
}

export default router;
