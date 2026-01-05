/**
 * Wellhub Webhook Handler
 * Recebe notificações de check-in do Wellhub e processa automaticamente
 */

import express from 'express';
import * as db from './db';
import { getControlIdServiceForGym } from './controlId';

const router = express.Router();

/**
 * Wellhub Webhook Endpoint
 * POST /api/webhooks/wellhub/checkin
 *
 * Recebe notificação quando um usuário faz check-in no app Wellhub
 */
router.post('/api/webhooks/wellhub/checkin', async (req, res) => {
  try {
    console.log('📩 Webhook Wellhub recebido:', JSON.stringify(req.body, null, 2));

    const { wellhub_id, gym_id, event_type, timestamp } = req.body;

    // Validar dados do webhook
    if (!wellhub_id || !gym_id) {
      console.error('❌ Webhook inválido: faltam dados obrigatórios');
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Verificar se é evento de check-in
    if (event_type !== 'check_in') {
      console.log('ℹ️ Evento ignorado (não é check-in):', event_type);
      return res.status(200).json({ message: 'Event ignored' });
    }

    // Buscar configurações Wellhub da academia
    const gym = await db.getGymById(parseInt(gym_id));
    if (!gym) {
      console.error('❌ Academia não encontrada:', gym_id);
      return res.status(404).json({ error: 'Gym not found' });
    }

    const wellhubSettings = await db.getWellhubSettings(gym.id);
    if (!wellhubSettings || !wellhubSettings.isActive) {
      console.error('❌ Integração Wellhub não configurada para academia:', gym.id);
      return res.status(400).json({ error: 'Wellhub integration not configured' });
    }

    // Buscar ou criar membro Wellhub
    let member = await db.getWellhubMemberByWellhubId(wellhub_id, gym.id);

    if (!member) {
      console.log('⚠️ Membro Wellhub não cadastrado, criando automaticamente:', wellhub_id);
      const result = await db.createWellhubMember({
        gymId: gym.id,
        wellhubId: wellhub_id,
      });
      member = await db.getWellhubMemberById(result.insertId, gym.id);
    }

    // Verificar se membro está bloqueado
    if (member.status === 'blocked') {
      console.error('🚫 Membro Wellhub bloqueado:', wellhub_id);
      return res.status(403).json({ error: 'Member blocked' });
    }

    // Validar check-in com API Wellhub
    const validationResult = await validateWellhubCheckIn(
      wellhub_id,
      wellhubSettings.apiToken,
      wellhubSettings.wellhubGymId,
      wellhubSettings.environment
    );

    if (!validationResult.valid) {
      console.error('❌ Check-in inválido:', validationResult.error);

      // Registrar check-in rejeitado
      await db.createWellhubCheckIn({
        wellhubMemberId: member.id,
        gymId: gym.id,
        wellhubId: wellhub_id,
        method: 'app',
      });

      await db.updateWellhubCheckIn(
        (await db.createWellhubCheckIn({
          wellhubMemberId: member.id,
          gymId: gym.id,
          wellhubId: wellhub_id,
          method: 'app',
        })).insertId,
        {
          validatedAt: new Date(),
          validationStatus: 'rejected',
          validationResponse: JSON.stringify(validationResult),
        }
      );

      return res.status(400).json({ error: validationResult.error });
    }

    // Check-in válido! Registrar no banco
    const checkInResult = await db.createWellhubCheckIn({
      wellhubMemberId: member.id,
      gymId: gym.id,
      wellhubId: wellhub_id,
      method: 'app',
    });

    await db.updateWellhubCheckIn(checkInResult.insertId, {
      validatedAt: new Date(),
      validationStatus: 'validated',
      validationResponse: JSON.stringify(validationResult),
    });

    // Atualizar estatísticas do membro
    await db.updateWellhubMemberCheckInStats(member.id);

    // 🚪 LIBERAR CATRACA AUTOMATICAMENTE
    try {
      // Buscar serviço Control ID da academia
      const controlIdService = await getControlIdServiceForGym(gym.id);

      if (controlIdService) {
        console.log(`🚪 Liberando catraca para ${member.name || wellhub_id}...`);

        // Autorizar acesso por 5 segundos (300 = 5 minutos, mas vamos usar 5 segundos = 5)
        if (member.controlIdUserId) {
          await controlIdService.authorizeAccess(member.controlIdUserId, 1, 5);
          console.log(`✅ Catraca liberada - User ID: ${member.controlIdUserId}`);
        } else {
          console.log('⚠️ Membro não possui ID do Control ID. É necessário cadastrar o reconhecimento facial primeiro.');
        }
      } else {
        console.log('⚠️ Nenhum dispositivo Control ID configurado para esta academia');
      }
    } catch (error) {
      console.error('❌ Erro ao liberar catraca:', error);
      // Não retornar erro - check-in foi validado com sucesso
    }

    console.log(`✅ Check-in processado com sucesso para ${member.name || wellhub_id}`);

    return res.status(200).json({
      success: true,
      message: 'Check-in validated and turnstile unlocked',
      checkInId: checkInResult.insertId,
      memberName: member.name || 'Wellhub Member',
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook Wellhub:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Validar check-in com API Wellhub
 */
async function validateWellhubCheckIn(
  wellhubId: string,
  apiToken: string,
  gymId: string,
  environment: 'sandbox' | 'production' = 'production'
): Promise<{ valid: boolean; error?: string; data?: any }> {
  try {
    const baseUrl = environment === 'production'
      ? 'https://api.partners.gympass.com'
      : 'https://apitesting.partners.gympass.com';

    const response = await fetch(`${baseUrl}/access/v1/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        'X-Gym-Id': gymId,
      },
      body: JSON.stringify({
        gympass_id: wellhubId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: errorData.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      valid: true,
      data,
    };

  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Network error',
    };
  }
}

export default router;
