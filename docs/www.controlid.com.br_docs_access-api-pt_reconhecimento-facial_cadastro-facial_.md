# Cadastro facial por fotos - API Linha de Acesso

**URL:** https://www.controlid.com.br/docs/access-api-pt/reconhecimento-facial/cadastro-facial/

---

 API Linha de Acesso

INTRODUÇÃO

Introdução à API

PRIMEIROS PASSOS

Diagrama de Sequência
Realizar Login
Cadastrar usuários e suas regras
Exemplos

PARTICULARIDADE DOS PRODUTOS

Particularidade terminais Control iD
Upgrade iDFace
Streaming iDFace
Interfonia SIP iDFace
Mensagens sonoras de acesso iDFace
QR Code
Upgrade iDFlex e iDAccess Nano
iDBlock Next
Liberação agendada
Sinais configuráveis iDFace Max

GERENCIAMENTO SESSÃO

Fazer login
Fazer logout
Verificar validade da sessão
Alterar usuário e senha de login

OBJETOS

Introdução a Objetos
Lista de Objetos
Criar Objetos
Carregar Objetos
Modificar Objetos
Destruir Objetos
Exportar Relatório

AÇÕES

Autorização Remota de Acesso
Abertura Remota Porta e Catraca
Cadastro Remoto Biometria, Facial, Cartão, PIN ou Senha
Apresentar Mensagem na Tela
Acionamento Remoto Buzzer
Personalizar Mensagem de Eventos

RECONHECIMENTO FACIAL

Configurações
Cadastro facial por fotos
Obter foto do usuário
Obter lista de usuários com foto cadastrada
Obter lista de fotos de usuário
Cadastrar foto de usuário
Cadastrar lista de fotos de usuário
Limiares personalizados para reconhecimento facial de faces semelhantes
Testar foto de usuário
Excluir foto de usuário
Remoção de foto do usuário após o cadastro
Sincronização de fotos usuário
Captura de câmera
Recomendações - fotos e instalação
Informações da catraca

FOTOS, LOGOTIPO E VÍDEO

Gerenciar fotos de usuários
Gerenciar logotipo
Gerenciar modo propaganda

HARDWARE

Ler estado de GPIO
Reler configuração do LED

CONFIGURAÇÕES

Parâmetros Configuração
Obter Configurações
Modificar Configurações
Desabilitar porta USB
Intertravamento via Rede

SISTEMA

Criar hash de senha de usuário
Reforço de Segurança
Obter informações do sistema
Configurações de rede
Alterar data e hora
Redefinir as configurações
Remover administradores
Reiniciar em modo de update
Reiniciar Equipamento
Importar/Exportar dados
Verificar Biometria
Desativar Interface Web
Suporte a SNMP

MODOS DE OPERAÇÃO

Introdução aos Modos de Operação
Configurar Modo Online
Eventos de Identificação Online

MONITOR

Introdução ao Monitor

PUSH

Introdução ao Push
Conexão com iDCloud

ALARME

Introdução ao Alarme

MODO PONTO

Descrição do funcionamento

VISITANTES

Suporte a visitantes

GLOSSÁRIO

Glossário
 RECONHECIMENTO FACIAL Cadastro facial por fotos
Fotos em cadastro facial

As funções descritas abaixo devem ser usadas para cadastrar, ler e apagar fotos de usuários nos terminais de controle de acesso da Control iD com reconhecimento facial.

Neste tipo de equipamento, não é necessário lidar com templates, sendo suficiente incluir ou modificar a foto do usuário para que o reconhecimento facial ocorra normalmente.

Contudo, por questão de privacidade, é possível configurar o equipamento para que a foto seja removida logo após o cadastro do usuário, sendo utilizada apenas para gerar o template facial correspondente. Por padrão, a imagem do usuário é mantida. Se for necessário, é possível configurar a remoção da foto após o cadastro como apresentado na seção Remoção de foto do usuário após o cadastro.

Obter foto do usuário

Obtém a foto de um usuário especificado pelo seu id. O retorno pode ser tanto a própria imagem, no formato image/jpeg, quanto um objeto JSON que contém os dados da imagem em formato base 64 e o timestamp de cadastro no padrão Unix Timestamp.

O formato de retorno é definido pelos parâmetros passados na requisição. Como o método HTTP usado é o GET, todos os parâmetros são enviados através de query string.

GET /user_get_image.fcgi

Parâmetros

user_id (int 64) : Identificador do usuário cuja foto será obtida.
get_timestamp (int) : Se positivo, determina retorno em JSON contendo o timestamp de cadastro da foto.

Resposta

Quando get_timestamp = 0:

Imagem do usuário em formato jpg

Quando get_timestamp = 1:

timestamp (int) : Valor de timestamp da foto cadastrada no padrão Unix Timestamp.
image (string) : Imagem de cadastro em formato base 64
Exemplo de requisição

Esta requisição retorna somente a foto do usuário em formato jpg (timestamp=0)

$.ajax({
  url: "/user_get_image.fcgi?user_id=123&get_timestamp=0&session=" + session,
  type: 'GET',
});

Exemplo de resposta quando timestamp=1
{
  "timestamp": 1624997578,
  "image": "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAE ... SurHnqq4vn5U3Pf5H//Z"
}

Obter lista de usuários com foto cadastrada

Obtém lista de ids dos usuários que possuem face cadastrada no equipamento

GET /user_list_images

Parâmetros

get_timestamp (int) : Se positivo, determina retorno em JSON contendo o timestamp de cadastro da foto.

Resposta

Quando get_timestamp = 0:

user_ids (array de int 64) : Lista de ids dos usuários com foto cadastrada.

Quando get_timestamp = 1:

image_info (array de objetos JSON) : Lista de usuários com foto cadastrada, contendo:
user_id (int 64) : Identificador do usuário.
timestamp (int) : Valor de timestamp da foto cadastrada no padrão Unix Timestamp.
Exemplo de requisição

Esta requisição retorna a lista de usuários com foto cadastrada, incluindo identificador e timestamp de cadastro para cada uma delas.

$.ajax({
  url: "/user_list_images.fcgi?get_timestamp=1&session=" + session,
  type: 'GET'
});

Exemplo de resposta
{
  "image_info": [
    {
        "user_id": 1,
        "timestamp": 1628203752
    },
    {
        "user_id": 2,
        "timestamp": 1628203752
    },
    {
        "user_id": 3,
        "timestamp": 1628203752
    }
  ]
}

Obter lista de fotos de usuário

Obtém lista de fotos cadastradas no equipamento, conforme os ids de usuário requeridos. Esta chamada está limitada a retornar no máximo 100 fotos de usuário por requisição.

POST /user_get_image_list.fcgi

Parâmetros

user_ids (array de int 64) : Lista de ids dos usuários cujas fotos devem ser retornadas.

Resposta

user_images (array de objetos JSON) : Lista com os dados de imagem de cada usuário.

Cada objeto contém:

id (int 64) : Identificador do usuário cuja foto será obtida.
timestamp (int) : Timestamp no formato Unix Timestamp da foto de cadastro retornada.
image (string) : Arquivo de imagem do usuário no formato base 64.

Quando o retorno falha para usuário, o objeto contém as informações de erro:

id (int 64) : Identificador do usuário cuja foto foi requerida.
error (objeto JSON) : Objeto de informações de erro, composto por:
code (int) : Código de erro.
message (string) : Mensagem explicativa do erro.
Exemplo de requisição

Esta requisição irá retornar imagens de uma lista de usuários.

$.ajax({
  url: "/user_get_image_list.fcgi?session=" + session,
  type: 'POST',
  contentType: 'application/json'
  data: {
    user_ids: [ 1, 2, 3 ]
  }
});

Exemplo de resposta
{
  "user_images": [
    {
      "id": 1,
      "timestamp": 1626890032,
      "image": "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAE ... BrBRkuWacorVep//2Q=="
    },
    {
      "id": 2,
      "error": {
        "code": 1,
        "message": "User does not exist"
      }
    },
    {
      "id": 3,
      "timestamp": 1626889927,
      "image": "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAE ... 8kP5Tl+u4uesqtj/2Q=="
    }
  ]
}

Cadastrar foto de usuário

Salva e cadastra a foto de um usuário especificado pelo seu id. Diferentemente da grande maioria dos comandos desta API, o Content-Type deste comando deve ser necessariamente application/octet-stream. A imagem é passada no Content do método POST e as informações de cadastro são passadas na Query String. O arquivo da foto deve ter tamanho menor que 2MB.

Para cadastro de usuários em massa, recomenda-se o uso do endpoint /user_set_image_list.fcgi.

Recomendações sobre formato e tamanho das imagens, além de posicionamento de rosto para cadastro podem ser encontradas consultando o tópico Recomendações - fotos e instalação.

POST /user_set_image.fcgi

Parâmetros

user_id (int 64) : Identificador do usuário cuja foto será atribuída (obrigatório).
timestamp (int) : Timestamp no formato Unix Timestamp a ser registrado para o cadastro da foto (obrigatório).
match (int) : Assume os valores 0 ou 1. Quando seu valor é 1, o cadastro da foto deverá ser rejeitado se o rosto já estiver cadastrado para outro usuário. Para cadastros em massa, é recomendável não verificar duplicados (match = 0) para acelerar o processo.

Esses parâmetros são passados na Query String

Resposta

user_id (int 64) : Identificador do usuário cuja foto será atribuída.
scores (objeto JSON) : Medidas de posicionamento e qualidade da imagem recebida. São elas:
bounds_width (int) : Largura do rosto.
horizontal_center_offset (int) : Distância horizontal do centro do rosto ao centro da imagem.
vertical_center_offset (int) : Distância vertical do centro do rosto ao centro da imagem.
center_pose_quality (int) : Nota para qualidade de centralização, que indica se rosto está virado para a câmera ou se está torto.
sharpness_quality (int) : Nitidez da imagem.
success (bool) : Indica se o cadastro foi bem-sucedido ou não.
errors (array de objetos JSON) : Lista contendo um ou mais erros justificando um cadastro mal-sucedido. Para cada erro:
code (int) : Código correspondente ao erro informado.
message (string) : Mensagem descrevendo o erro.
Erros possíveis da imagem a ser cadastrada

Conforme descrito no tópico Recomendações - fotos e instalação, existem alguns critérios de qualidade da foto que devem ser seguidos para que o reconhecimento facial ocorra da maneira correta. Caso exista uma tentativa de cadastramento de foto remoto, inserindo um arquivo de imagem que não siga as recomendações previstas, haverá mensagens de erros informando os motivos pelos quais a foto não foi aceita. A seguir estão listados os códigos de erros e as mensagens correspondentes que explicam suas causas:

code 1: Corresponde a erros não relacionados com a qualidade do arquivo, mas sim com algum erro na passagem de parâmetros da requisição. Existem vários tipos de mensagens que podem surgir com erros desse código, alguns exemplos são:
message: "Image file not recognized. Image should be either JPG or PNG.", "User does not exist", "Invalid user_id".
code 2: Ocorre quando não é possível identificar uma face no arquivo de imagem enviado.
message: "Face not detected"
code 3: Ocorre quando há uma tentativa de cadastro de face que já existe. Além de retornar a mensagem de erro abaixo, é retornado também o ID do usuário que coincide com a foto enviada. O parâmetro match_user_id é quem indica o ID do usuário já existente que corresponde com a foto.
message: "Face exists"
info { match_user_id: 1 }
code 4: Ocorre quando as distâncias horizontais e verticais do centro do rosto ao centro da imagem estão muito significativas. Para entender quantitativamente como isso pode ser resolvido, deve-se analisar a reposta da requisição. No objeto JSON score, é preciso analisar os valores dos parâmetros horizontal_center_offset e vertical_center_offset. O valor máximo permitido para ambos é 1000. Portanto, quando esse valor é ultrapassado a seguinte mensagem é exibida:
message: "Face not centered"
code 5: Ocorre quando a largura do rosto na imagem é muito pequena (face distante da câmera). Para entender quantitativamente como isso pode ser resolvido, deve-se analisar a reposta da requisição. No objeto JSON score, é preciso analisar o valor do parâmetro bounds_width. O valor mínimo permitido é 60. Portanto, quando esse valor é ultrapassado a seguinte mensagem é exibida:
message: "Face too distant"
code 6: Ocorre quando a largura do rosto na imagem é muito grande (face muito perto da câmera). Para entender quantitativamente como isso pode ser resolvido, deve-se analisar a reposta da requisição. No objeto JSON score, é preciso analisar o valor do parâmetro bounds_width. O valor máximo permitido é 800. Portanto, quando esse valor é ultrapassado a seguinte mensagem é exibida:
message: "Face too close"
code 7: Ocorre quando a centralização do rosto não está boa, indicando que o rosto está torto em relação à câmera. Para entender quantitativamente como isso pode ser resolvido, deve-se analisar a reposta da requisição. No objeto JSON score, é preciso analisar o valor do parâmetro center_pose_quality. O valor máximo permitido é 400. Portanto, quando esse valor é ultrapassado a seguinte mensagem é exibida:
message: "Face pose not centered"
code 8: Ocorre quando a imagem cadastrada não possui nitidez suficiente para garantir o reconhecimento facial. Para entender quantitativamente como isso pode ser resolvido, deve-se analisar a reposta da requisição. No objeto JSON score, é preciso analisar o valor do parâmetro sharpness_quality. O valor mínimo permitido é 450. Portanto, quando esse valor é inferior a seguinte mensagem é exibida:
message: "Low sharpness"
code 9: Ocorre quando o rosto está muito próximo das bordas da imagem.
message: "Face too close to image borders"
Exemplo de requisição

Esta requisição irá cadastrar foto e timestamp para um usuário

$.ajax({
  url: "/user_set_image.fcgi?user_id=123&timestamp=1624997578&match=0&session=" + session,
  type: 'POST',
  contentType: 'application/octet-stream',
  data: [bytes da imagem enviada]
});

Exemplo de resposta

Este resultado corresponde a um cadastro mal-sucedido devido à baixa nitidez da imagem fornecida

{
  "user_id": 123,
  "scores": {
    "bounds_width": 397,
    "horizontal_center_offset": 87,
    "vertical_center_offset": -75,
    "center_pose_quality": 698,
    "sharpness_quality": 105
  },
  "success": false,
  "errors": [
    {
      "code": 8,
      "message": "Low sharpness"
    }
  ]
}

Cadastrar lista de fotos de usuário

Este endpoint cadastra fotos de usuários em massa. Ele recebe um array de ids, timestamps e imagens codificadas em base 64. O limite de tamanho de requisição aceita pelo controlador de acesso é de 2MB.

Recomendações sobre formato e tamanho das imagens, além de posicionamento de rosto para cadastro podem ser encontradas consultando o tópico Recomendações - fotos e instalação.

POST /user_set_image_list.fcgi

Parâmetros

match (bool) : Indica se o cadastro das fotos deverá rejeitar aquelas cujos rostos já estiverem cadastrados para outros usuários. Para cadastros em massa, é recomendável não verificar duplicados (match = 0) para acelerar o processo.
user_images (array) : Este parâmetro deverá ser representado como um objeto JSON contendo os membros user_id, timestamp e image (a imagem em base 64), todos obrigatórios.

Resposta

results (array de objetos JSON) : Lista dos resultados individuais para o cadastro de cada foto enviada na requisição. Cada objeto de resultado possui o mesmo formato de resposta que o da chamada Cadastrar foto de usuário acrescido do respectivo identificador de usuário.
Exemplo de requisição

Esta requisição irá atribuir fotos a dois usuários.

$.ajax({
  url: "/user_set_image_list.fcgi?session=" + session,
  type: 'POST',
  contentType: 'application/json',
  data: {
    "match": false,
    "user_images": [
      {
        "user_id": 20,
        "timestamp": 1628727478,
        "image": "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAY ... QK5JP3FQw2eE1oQf/9k="
      },
      {
        "user_id": 23,
        "timestamp": 1628873297,
        "image": "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAo ... D1odQIroECBAgQIJ/9k="
      }
    ]
  }
});

Exemplo de resposta

Considerando respectivamente as situações de:

Erro na requisição
Erro na imagem (Erros)
Rosto cadastrado com sucesso
Rosto rejeitado pelos critérios de validação

O resultado abaixo mostra os formatos de retorno correspondentes.

{
  "results": [
    {
      "user_id": 1,
      "success": false,
      "errors": [
        {
          "code": 1,
          "message": "Failed: Invalid member 'timestamp' (int expected, got string)"
        }
      ]
    },
    {
      "user_id": 2,
      "success": false,
      "errors": [
        {
          "code": 2,
          "message": "Face not detected"
        }
      ]
    },
    {
      "user_id": 3,
      "scores": {
        "bounds_width": 104,
        "horizontal_center_offset": 16,
        "vertical_center_offset": -150,
        "center_pose_quality": 768,
        "sharpness_quality": 1000
      },
      "success": true
    },
    {
      "user_id": 4,
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)