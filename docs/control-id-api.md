# Documentação API Control ID - Reconhecimento Facial

## Visão Geral

A API Control ID permite integração com dispositivos de controle de acesso facial (iDFace). O sistema trabalha com **reconhecimento facial** (não biométrico de impressão digital).

## Autenticação

Todas as requisições precisam de uma sessão ativa. Adicione `?session={session_token}` nas URLs.

---

## 1. Cadastro Remoto de Face (Modo Interativo)

Inicia o processo de cadastro facial no dispositivo físico. O usuário precisa olhar para a câmera do dispositivo.

### Endpoint
```
POST /remote_enroll.fcgi
```

### Parâmetros
```json
{
  "type": "face",              // Obrigatório: tipo de cadastro
  "user_id": 123,              // Obrigatório: ID do usuário
  "save": true,                // true = salvar no dispositivo
  "sync": true,                // true = resposta síncrona
  "auto": true,                // true = cadastro automático (sem botões)
  "countdown": 3               // Tempo de contagem regressiva (segundos)
}
```

### Resposta (Sucesso)
```json
{
  "success": true,
  "user_id": 123,
  "device_id": "ABC123",
  "user_image": "base64_encoded_image..."
}
```

### Resposta (Erro - Face já cadastrada)
```json
{
  "success": false,
  "error": "FACE_EXISTS",
  "info": {
    "match_user_id": 456  // ID do usuário que já tem essa face
  }
}
```

---

## 2. Cadastro de Face por Foto (Remoto)

Envia uma foto do usuário para cadastrar sem interação física com o dispositivo.

### Endpoint
```
POST /user_set_image.fcgi?user_id={id}&timestamp={unix_timestamp}&match=1&session={session}
```

### Headers
```
Content-Type: application/octet-stream
```

### Body
Enviar a imagem (JPG ou PNG) diretamente no corpo da requisição (binary data).

### Parâmetros Query String
- **user_id** (int64): ID do usuário - **obrigatório**
- **timestamp** (int): Unix timestamp do cadastro - **obrigatório**
- **match** (int): 0 ou 1. Se 1, rejeita se face já cadastrada para outro usuário

### Resposta (Sucesso)
```json
{
  "user_id": 123,
  "success": true,
  "scores": {
    "bounds_width": 200,
    "horizontal_center_offset": 5,
    "vertical_center_offset": -3,
    "center_pose_quality": 85,
    "sharpness_quality": 90
  }
}
```

### Resposta (Erro)
```json
{
  "user_id": 123,
  "success": false,
  "errors": [
    {
      "code": 2,
      "message": "NO_FACE_FOUND"
    }
  ]
}
```

### Códigos de Erro Comuns
- **1**: `INVALID_IMAGE` - Imagem inválida ou corrompida
- **2**: `NO_FACE_FOUND` - Nenhuma face detectada
- **3**: `MULTIPLE_FACES` - Múltiplas faces na imagem
- **4**: `FACE_TOO_SMALL` - Face muito pequena
- **5**: `FACE_TOO_LARGE` - Face muito grande
- **6**: `POOR_QUALITY` - Qualidade insuficiente
- **7**: `FACE_NOT_CENTERED` - Face não centralizada

---

## 3. Cadastro em Massa de Fotos

Para cadastrar múltiplos usuários de uma vez.

### Endpoint
```
POST /user_set_image_list.fcgi
```

### Body
```json
{
  "user_images": [
    {
      "id": 1,
      "timestamp": 1640000000,
      "image": "base64_encoded_image..."
    },
    {
      "id": 2,
      "timestamp": 1640000001,
      "image": "base64_encoded_image..."
    }
  ]
}
```

### Resposta
```json
{
  "results": [
    {
      "user_id": 1,
      "success": true
    },
    {
      "user_id": 2,
      "success": false,
      "errors": [...]
    }
  ]
}
```

---

## 4. Obter Foto do Usuário

### Endpoint
```
GET /user_get_image.fcgi?user_id={id}&get_timestamp=1&session={session}
```

### Resposta
```json
{
  "timestamp": 1624997578,
  "image": "base64_encoded_image..."
}
```

---

## 5. Listar Usuários com Face Cadastrada

### Endpoint
```
GET /user_list_images.fcgi?get_timestamp=1&session={session}
```

### Resposta
```json
{
  "image_info": [
    {
      "user_id": 1,
      "timestamp": 1628203752
    },
    {
      "user_id": 2,
      "timestamp": 1628203752
    }
  ]
}
```

---

## 6. Excluir Face do Usuário

### Endpoint
```
POST /user_remove_image.fcgi
```

### Body
```json
{
  "user_id": 123
}
```

---

## Recomendações para Fotos

### Formato
- **Formatos aceitos**: JPG, PNG
- **Tamanho máximo**: 2MB
- **Resolução recomendada**: 640x480 ou superior

### Qualidade da Foto
- ✅ Rosto centralizado e frontal
- ✅ Boa iluminação (evitar sombras)
- ✅ Fundo neutro
- ✅ Expressão neutra
- ✅ Sem óculos escuros ou chapéus
- ✅ Uma única pessoa na foto
- ❌ Evitar fotos borradas
- ❌ Evitar contra-luz
- ❌ Evitar ângulos laterais

### Tamanho do Rosto
- O rosto deve ocupar entre 30% e 70% da imagem
- Distância ideal: 50cm a 1m da câmera

---

## Fluxo Recomendado para Academia

### Opção 1: Cadastro Remoto Interativo (Recomendado)
1. Criar usuário no sistema
2. Chamar `/remote_enroll.fcgi` com `auto: true, countdown: 5`
3. Aluno olha para o dispositivo físico
4. Sistema captura e salva automaticamente
5. Receber resposta com imagem em base64

### Opção 2: Cadastro por Upload de Foto
1. Criar usuário no sistema
2. Aluno tira selfie no app
3. Enviar foto via `/user_set_image.fcgi`
4. Validar resposta e scores de qualidade
5. Se qualidade baixa, solicitar nova foto

### Opção 3: Cadastro em Massa (Migração)
1. Preparar lista de usuários com fotos
2. Converter fotos para base64
3. Enviar via `/user_set_image_list.fcgi` (máx 100 por vez)
4. Processar respostas e tratar erros

---

## Configuração do Dispositivo

### IP do Dispositivo
Cada academia terá seu próprio dispositivo Control ID com IP fixo na rede local.

### Credenciais
- **Usuário padrão**: admin
- **Senha padrão**: admin (alterar após instalação)

### Modo de Operação
- **Online**: Dispositivo consulta servidor antes de liberar acesso
- **Offline**: Dispositivo decide localmente baseado em dados sincronizados

---

## Integração com Sistema de Academia

### Tabela de Configuração
```sql
CREATE TABLE control_id_devices (
  id INT PRIMARY KEY,
  gym_id INT,
  device_ip VARCHAR(15),
  device_name VARCHAR(100),
  username VARCHAR(50),
  password VARCHAR(255),
  status ENUM('active', 'inactive'),
  last_sync DATETIME
);
```

### Sincronização
- Sincronizar lista de alunos ativos diariamente
- Bloquear automaticamente inadimplentes
- Bloquear alunos com exame médico vencido
- Registrar logs de entrada/saída

---

## Referências

- Documentação oficial: https://www.controlid.com.br/docs/access-api-pt/
- Reconhecimento facial: https://www.controlid.com.br/docs/access-api-pt/reconhecimento-facial/
- Cadastro remoto: https://www.controlid.com.br/docs/access-api-pt/acoes/cadastro-remoto-biometria-facial-cartao/
