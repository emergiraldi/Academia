const fs = require('fs');

const arquivo = 'C:/Projeto/Academia/server/routers.ts';
let conteudo = fs.readFileSync(arquivo, 'utf8');

// Correção 1: Professores
const antigoProf = `              // Unblock access if status is active
              if (professor.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Professor] 🔓 Acesso desbloqueado');
              }`;

const novoProf = `              // Control access based on status
              if (professor.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Professor] 🔓 Acesso desbloqueado (ATIVO)');
              } else {
                await controlIdService.blockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Professor] 🔒 Acesso bloqueado (INATIVO)');
              }`;

conteudo = conteudo.replace(antigoProf, novoProf);

// Correção 2: Staff
const antigoStaff = `              // Unblock access if status is active
              if (staffMember.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Staff] 🔓 Acesso desbloqueado');
              }`;

const novoStaff = `              // Control access based on status
              if (staffMember.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Staff] 🔓 Acesso desbloqueado (ATIVO)');
              } else {
                await controlIdService.blockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Staff] 🔒 Acesso bloqueado (INATIVO)');
              }`;

conteudo = conteudo.replace(antigoStaff, novoStaff);

fs.writeFileSync(arquivo, conteudo, 'utf8');

console.log('✅ Correções aplicadas!');
console.log('📝 Modificações:');
console.log('  - Professores: Bloqueiam catraca quando INATIVO');
console.log('  - Staff: Bloqueiam catraca quando INATIVO');
