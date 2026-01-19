# Correções para Upload Facial de Professores e Staff

## Problema
- Facial sendo marcada como cadastrada mas não enviando para catraca
- Modal muito grande

## Correções Realizadas

### 1. ✅ Modal reduzida (JÁ APLICADO)
- AdminProfessors.tsx: `max-w-2xl` → `max-w-md`
- AdminStaff.tsx: `max-w-2xl` → `max-w-md`

### 2. ⚠️ Bloquear acesso quando INATIVO (PENDENTE)

**Arquivo:** `server/routers.ts`

**Localização 1 - Professores (linha ~3346-3350):**

**ANTES:**
```typescript
              // Unblock access if status is active
              if (professor.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Professor] 🔓 Acesso desbloqueado');
              }
```

**DEPOIS:**
```typescript
              // Control access based on status
              if (professor.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Professor] 🔓 Acesso desbloqueado (ATIVO)');
              } else {
                await controlIdService.blockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Professor] 🔒 Acesso bloqueado (INATIVO)');
              }
```

---

**Localização 2 - Staff (procurar por "uploadFaceImage.*Staff"):**

Aplicar a mesma lógica:

**ANTES:**
```typescript
              if (staffMember.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Staff] 🔓 Acesso desbloqueado');
              }
```

**DEPOIS:**
```typescript
              if (staffMember.accessStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Staff] 🔓 Acesso desbloqueado (ATIVO)');
              } else {
                await controlIdService.blockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage-Staff] 🔒 Acesso bloqueado (INATIVO)');
              }
```

---

## Como Aplicar

### Opção 1: Manual (VSCode)
1. Abra `server/routers.ts`
2. Procure por `uploadFaceImage-Professor`
3. Encontre a linha com `if (professor.accessStatus === 'active')`
4. Adicione o `else` com `blockUserAccess`
5. Repita para Staff

### Opção 2: Via comandos
```bash
# Parar o servidor primeiro
# Depois editar o arquivo server/routers.ts conforme acima
# Depois reiniciar
```

---

## Regras de Acesso

- **active** (Ativo) → Desbloqueia catraca (`unblockUserAccess`)
- **inactive** (Inativo) → Bloqueia catraca (`blockUserAccess`)
- **suspended** (Suspenso) → Bloqueia catraca
- **blocked** (Bloqueado) → Bloqueia catraca

---

## Teste

Após aplicar as correções:

1. Cadastrar facial de um professor com status ATIVO
   - ✅ Deve desbloquear acesso na catraca

2. Cadastrar facial de um professor com status INATIVO
   - ✅ Deve bloquear acesso na catraca

3. Mudar status de ATIVO para INATIVO
   - ✅ Deve bloquear imediatamente

---

## Deploy

Após fazer as alterações localmente:

```bash
cd C:\Projeto\Academia
git add .
git commit -m "fix: bloquear acesso quando professor/staff estiver inativo"
git push

# No servidor VPS
cd /root/Academia
git pull
pm2 restart academia
```
