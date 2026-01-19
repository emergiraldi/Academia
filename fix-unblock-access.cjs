const fs = require('fs');

const arquivo = 'C:/Projeto/Academia/server/routers.ts';
let conteudo = fs.readFileSync(arquivo, 'utf8');

// Corrigir chamadas de unblockUserAccess (adicionar groupId = 1)
// Mas APENAS para Professor e Staff (não para Student que já está correto)

// Professor
conteudo = conteudo.replace(
  /\[uploadFaceImage-Professor\][\s\S]*?await controlIdService\.unblockUserAccess\(controlIdUserId\);/,
  (match) => match.replace(
    'await controlIdService.unblockUserAccess(controlIdUserId);',
    'await controlIdService.unblockUserAccess(controlIdUserId, 1);'
  )
);

// Staff
conteudo = conteudo.replace(
  /\[uploadFaceImage-Staff\][\s\S]*?await controlIdService\.unblockUserAccess\(controlIdUserId\);/,
  (match) => match.replace(
    'await controlIdService.unblockUserAccess(controlIdUserId);',
    'await controlIdService.unblockUserAccess(controlIdUserId, 1);'
  )
);

fs.writeFileSync(arquivo, conteudo, 'utf8');

console.log('✅ Corrigido!');
console.log('📝 Alterações:');
console.log('   Professor: unblockUserAccess(controlIdUserId) → unblockUserAccess(controlIdUserId, 1)');
console.log('   Staff: unblockUserAccess(controlIdUserId) → unblockUserAccess(controlIdUserId, 1)');
console.log('');
console.log('🎯 Agora vai adicionar ao grupo 1 (Padrão) e a catraca vai liberar!');
