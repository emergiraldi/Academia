// Script para adicionar Carlos Alexandre ao grupo 1
import { getControlIdServiceForGym } from './server/controlId.js';

const controlIdUserId = 10; // ID do Carlos na leitora
const gymId = 33; // Academia 33
const groupId = 1; // Grupo padrão (mesmo dos alunos)

console.log(`[Add to Group] 👥 Adicionando usuário ${controlIdUserId} ao grupo ${groupId}...`);

try {
  const service = await getControlIdServiceForGym(gymId);

  if (!service) {
    console.error('[Add to Group] ❌ Serviço Control ID não disponível');
    process.exit(1);
  }

  // Adicionar ao grupo usando a função unblockUserAccess
  const result = await service.unblockUserAccess(controlIdUserId, groupId);

  if (result) {
    console.log('[Add to Group] ✅ Usuário adicionado ao grupo com sucesso!');
    console.log('[Add to Group] 🎉 Carlos Alexandre agora está no Grupo 1 e pode acessar a academia');
  } else {
    console.error('[Add to Group] ❌ Falha ao adicionar ao grupo');
  }
} catch (error) {
  console.error('[Add to Group] ❌ Erro:', error.message);
  process.exit(1);
}
