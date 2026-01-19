const fs = require('fs');

const arquivo = 'C:/Projeto/Academia/server/routers.ts';
let conteudo = fs.readFileSync(arquivo, 'utf8');

// Corrigir chamadas de blockUserAccess (remover segundo parâmetro)
conteudo = conteudo.replace(
  /blockUserAccess\(controlIdUserId, 1\)/g,
  'blockUserAccess(controlIdUserId)'
);

fs.writeFileSync(arquivo, conteudo, 'utf8');

console.log('✅ Corrigido!');
console.log('📝 Alteração:');
console.log('   ANTES: blockUserAccess(controlIdUserId, 1)');
console.log('   DEPOIS: blockUserAccess(controlIdUserId)');
console.log('');
console.log('🎯 Isso vai fazer o bloqueio funcionar corretamente!');
