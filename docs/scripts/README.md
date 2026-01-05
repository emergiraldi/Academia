# Scripts Utilitários - Control ID

Esta pasta contém scripts utilitários para gerenciamento e troubleshooting do sistema de controle de acesso Control ID.

## 📋 Scripts Disponíveis

### `setup_controlid_device.cjs`
**Descrição:** Configuração inicial do dispositivo Control ID.

**Uso:**
```bash
node docs/scripts/setup_controlid_device.cjs
```

**Funcionalidades:**
- Autentica no dispositivo
- Cria grupo padrão de acesso
- Configura parâmetros iniciais

---

### `ver_usuarios_controlid.cjs`
**Descrição:** Lista todos os usuários cadastrados no dispositivo Control ID.

**Uso:**
```bash
node docs/scripts/ver_usuarios_controlid.cjs
```

**Retorna:**
- ID do usuário
- Nome
- Registration number
- Status

---

### `verificar_grupos.cjs`
**Descrição:** Exibe todos os grupos de acesso configurados.

**Uso:**
```bash
node docs/scripts/verificar_grupos.cjs
```

**Retorna:**
- ID do grupo
- Nome do grupo
- Configurações de acesso

---

### `verificar_horario_controlid.cjs`
**Descrição:** Verifica a configuração de horário do dispositivo.

**Uso:**
```bash
node docs/scripts/verificar_horario_controlid.cjs
```

**Verifica:**
- Horário atual do dispositivo
- Timezone configurado
- Sincronização de horário

---

### `verificar_joao_controlid.cjs`
**Descrição:** Script de teste para verificar cadastro específico de um usuário (João).

**Uso:**
```bash
node docs/scripts/verificar_joao_controlid.cjs
```

**Útil para:**
- Troubleshooting de cadastro facial
- Verificar status de usuário específico

---

### `verificar_status_emerson.cjs`
**Descrição:** Script de teste para verificar status de usuário específico (Emerson).

**Uso:**
```bash
node docs/scripts/verificar_status_emerson.cjs
```

**Verifica:**
- Status do usuário
- Grupos de acesso
- Cadastro facial

---

### `verificar_tabela_subscriptions.cjs`
**Descrição:** Verifica a estrutura e dados da tabela de assinaturas.

**Uso:**
```bash
node docs/scripts/verificar_tabela_subscriptions.cjs
```

**Retorna:**
- Estrutura da tabela
- Registros de assinaturas
- Relação com alunos

---

## ⚙️ Configuração

Todos os scripts utilizam as variáveis de ambiente configuradas no arquivo `.env`:

```env
CONTROL_ID_IP=192.168.2.142
CONTROL_ID_PORT=80
```

## 🔧 Troubleshooting

### Erro de Conexão
Se você receber erro de conexão com o Control ID:

1. Verifique se o IP está correto no `.env`
2. Teste ping para o dispositivo:
```bash
ping 192.168.2.142
```
3. Verifique se o dispositivo está ligado e na mesma rede

### Erro de Autenticação
Se você receber erro de autenticação:

1. Verifique as credenciais (padrão: admin/admin)
2. Acesse a interface web do Control ID: `http://192.168.2.142`
3. Redefina a senha se necessário

### Usuário Não Encontrado
Se um usuário não aparece na listagem:

1. Verifique se o cadastro foi concluído
2. Execute `ver_usuarios_controlid.cjs` para listar todos
3. Verifique logs do sistema

## 📝 Notas

- Estes scripts são para uso administrativo e troubleshooting
- Não devem ser executados em produção sem necessidade
- Sempre faça backup antes de executar scripts que modificam dados
- Scripts de teste (verificar_joao, verificar_emerson) são exemplos e podem ser adaptados

## 🔗 Documentação Relacionada

- [CONTROLE_ACESSO.md](../CONTROLE_ACESSO.md) - Documentação técnica completa
- [README.md](../README.md) - Documentação geral do sistema
