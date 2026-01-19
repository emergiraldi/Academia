const fs = require('fs');

const arquivo = 'C:/Projeto/Academia/server/routers.ts';
let conteudo = fs.readFileSync(arquivo, 'utf8');

// Corrigir TODAS as chamadas de unblockUserAccess sem segundo parâmetro
// (vamos adicionar groupId = 1 em todas)
conteudo = conteudo.replace(
  /unblockUserAccess\(controlIdUserId\);/g,
  'unblockUserAccess(controlIdUserId, 1);'
);

// Também para variável 'service'
conteudo = conteudo.replace(
  /service\.unblockUserAccess\(controlIdUserId\);/g,
  'service.unblockUserAccess(controlIdUserId, 1);'
);

// Também para variável 'controlIdService'
conteudo = conteudo.replace(
  /controlIdService\.unblockUserAccess\(controlIdUserId\);/g,
  'controlIdService.unblockUserAccess(controlIdUserId, 1);'
);

fs.writeFileSync(arquivo, conteudo, 'utf8');

console.log('✅ Todas as chamadas de unblockUserAccess corrigidas!');
console.log('📝 Agora TODOS vão ser adicionados ao grupo 1 (Padrão) para liberar a catraca');
