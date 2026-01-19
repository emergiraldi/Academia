# Script para aplicar correções no upload facial
Write-Host "🔧 Aplicando correções no upload facial..." -ForegroundColor Cyan

$arquivo = "C:\Projeto\Academia\server\routers.ts"

# Ler conteúdo
$conteudo = Get-Content $arquivo -Raw

# Correção 1: Professores
$antigoProf = @'
              // Unblock access if status is active
              if (professor.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Professor] 🔓 Acesso desbloqueado');
              }
'@

$novoProf = @'
              // Control access based on status
              if (professor.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Professor] 🔓 Acesso desbloqueado (ATIVO)');
              } else {
                await controlIdService.blockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Professor] 🔒 Acesso bloqueado (INATIVO)');
              }
'@

$conteudo = $conteudo -replace [regex]::Escape($antigoProf), $novoProf

# Correção 2: Staff
$antigoStaff = @'
              // Unblock access if status is active
              if (staffMember.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Staff] 🔓 Acesso desbloqueado');
              }
'@

$novoStaff = @'
              // Control access based on status
              if (staffMember.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Staff] 🔓 Acesso desbloqueado (ATIVO)');
              } else {
                await controlIdService.blockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Staff] 🔒 Acesso bloqueado (INATIVO)');
              }
'@

$conteudo = $conteudo -replace [regex]::Escape($antigoStaff), $novoStaff

# Salvar
Set-Content -Path $arquivo -Value $conteudo -NoNewline

Write-Host "✅ Correções aplicadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Modificações:" -ForegroundColor Yellow
Write-Host "  - Professores: Bloqueiam catraca quando INATIVO"
Write-Host "  - Staff: Bloqueiam catraca quando INATIVO"
Write-Host ""
Write-Host "🚀 Próximo passo: Fazer commit e push" -ForegroundColor Cyan
