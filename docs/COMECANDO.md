# 🚀 Começando com o SysFitPro

Guia passo a passo para começar a usar o sistema de gestão para academias.

---

## 📋 Índice

1. [Primeiro Acesso](#1-primeiro-acesso)
2. [Configuração Inicial](#2-configuração-inicial)
3. [Primeiros Cadastros](#3-primeiros-cadastros)
4. [Primeiro Pagamento](#4-primeiro-pagamento)
5. [Próximos Passos](#5-próximos-passos)

---

## 1. Primeiro Acesso

### Para Gestores (Donos de Academia)

**Já tem uma conta?**

1. Acesse: https://www.sysfitpro.com.br/admin/login
2. Digite seu email e senha
3. Pronto! Você está na dashboard

**Primeira vez?**

1. Acesse: https://www.sysfitpro.com.br
2. Clique em **"Cadastre sua Academia"**
3. Preencha:
   - Nome da academia
   - Seu email (será usado para login)
   - Telefone
   - Senha (mínimo 6 caracteres)
4. Clique em **"Criar Conta"**
5. Escolha um plano:
   - 💼 **Starter** (até 50 alunos) - R$ 99/mês
   - 🏢 **Professional** (até 200 alunos) - R$ 199/mês
   - 🚀 **Enterprise** (ilimitado) - R$ 399/mês
6. **14 dias grátis** para testar!

---

## 2. Configuração Inicial

### 2.1. Dados da Academia

Logo após o cadastro, configure os dados da academia:

1. Vá em **Admin > Configurações**
2. Aba **"Dados da Academia"**
3. Preencha:
   - ✅ Nome fantasia
   - ✅ CNPJ (opcional mas recomendado)
   - ✅ Telefone
   - ✅ Endereço completo
   - ✅ Upload da logo (aparece nos recibos e emails)
4. Clique em **"Salvar"**

### 2.2. Horário de Funcionamento

1. Ainda em **Configurações**
2. Aba **"Horário de Funcionamento"**
3. Configure:
   - Segunda a Sexta: Ex: 6h às 22h
   - Sábado: Ex: 8h às 14h
   - Domingo: Fechado ou horário especial
4. Salve

### 2.3. Configurar PIX (Importante!)

Para receber pagamentos via PIX:

1. **Configurações > PIX**
2. Informe:
   - **Chave PIX:** Pode ser seu CPF, CNPJ, email, telefone ou chave aleatória
   - **Nome do beneficiário:** Nome da academia ou do dono
   - **Cidade:** Sua cidade
3. Clique em **"Salvar"**
4. Teste gerando um QR Code de teste

**Dica:** Use uma chave PIX vinculada à conta da academia para facilitar a conciliação.

### 2.4. Email (Opcional mas Recomendado)

Configure email para enviar recibos automaticamente:

1. **Configurações > Email**
2. Se usa **Gmail:**
   - Servidor SMTP: `smtp.gmail.com`
   - Porta: `587`
   - Usuário: seu-email@gmail.com
   - Senha: [Senha de app](https://support.google.com/accounts/answer/185833)
3. Se usa outro provedor, consulte a documentação dele
4. Clique em **"Testar Envio"**
5. Se receber o email de teste, está funcionando!
6. Salve

---

## 3. Primeiros Cadastros

### 3.1. Criar Planos

Antes de cadastrar alunos, crie os planos:

1. **Admin > Planos > + Novo Plano**
2. Exemplo de plano:
   - **Nome:** Musculação Completa
   - **Descrição:** Acesso livre à musculação em todos os horários
   - **Valor mensal:** R$ 150,00
   - **Duração:** Mensal
   - **Benefícios:**
     - Acesso livre à musculação
     - Avaliação física trimestral
     - Ficha de treino personalizada
3. Salve

**Repita** para criar outros planos (Personal, Funcional, etc.)

### 3.2. Cadastrar Primeiro Professor (Opcional)

Se você tem professores/personal trainers:

1. **Admin > Professores > + Novo Professor**
2. Preencha:
   - Nome completo
   - Email (será usado para login dele)
   - Senha inicial (ele pode mudar depois)
   - Telefone
   - CREF (opcional)
   - Especialidades
3. Salve

O professor já pode fazer login em: https://www.sysfitpro.com.br/professor/login

### 3.3. Cadastrar Primeiros Alunos

Agora sim, cadastre seus alunos:

1. **Admin > Alunos > + Novo Aluno**

**Aba: Dados Pessoais**
- ✅ Nome completo
- ✅ Email (para login e recibos)
- ✅ Telefone
- Data de nascimento
- CPF
- Foto (opcional)

**Aba: Matrícula**
- ✅ Plano contratado (selecione o plano criado)
- ✅ Data de início (hoje ou quando começou)
- ✅ Dia de vencimento (ex: 10 - todo dia 10)
- Valor mensal (preenche automaticamente do plano)
- Desconto (se houver)

**Aba: Contato de Emergência** (Opcional mas recomendado)
- Nome
- Telefone
- Parentesco

2. Clique em **"Salvar"**

**Parabéns!** 🎉 Seu primeiro aluno está cadastrado.

O aluno já pode acessar: https://www.sysfitpro.com.br/student/login
- **Usuário:** O email dele
- **Senha:** A senha que você definiu (ele pode mudar depois)

---

## 4. Primeiro Pagamento

### 4.1. Gerar Mensalidades

1. **Admin > Pagamentos > Gerar Mensalidades**
2. Configure:
   - **Selecione os alunos** (marque os que quer gerar)
   - Ou use **"Selecionar Todos"**
3. Clique em **"Gerar Mensalidades"**
4. Sistema cria automaticamente as cobranças

### 4.2. Aluno Paga com PIX

O aluno pode pagar de 2 formas:

**Opção 1: Pelo Portal do Aluno**
1. Aluno acessa: https://www.sysfitpro.com.br/student/login
2. Faz login
3. **Meus Pagamentos**
4. Clica na mensalidade
5. Escolhe **"PIX"**
6. Escaneia o QR Code com app do banco
7. Paga
8. **Confirmação automática em até 2 minutos**

**Opção 2: Presencialmente**
1. Aluno paga no caixa da academia
2. Você (admin) vai em: **Admin > Pagamentos**
3. Encontra a mensalidade do aluno
4. Clica em **"Dar Baixa"**
5. Seleciona método: PIX, Dinheiro, Cartão
6. Confirma
7. Sistema envia recibo por email automaticamente

---

## 5. Próximos Passos

### ✅ Básico Configurado

Você já tem:
- ✅ Academia cadastrada
- ✅ Planos criados
- ✅ Alunos cadastrados
- ✅ Sistema de pagamentos funcionando

### 🎯 Próximas Melhorias

**Semana 1:**
- [ ] Configure **notificações por email** (lembretes de vencimento)
- [ ] Adicione mais planos se necessário
- [ ] Cadastre todos os alunos atuais
- [ ] Gere mensalidades do mês

**Semana 2:**
- [ ] Configure **métodos de pagamento** adicionais (boleto, cartão)
- [ ] Cadastre **professores**
- [ ] Comece a criar **treinos** para os alunos
- [ ] Configure **categorias** e **centros de custo** (financeiro)

**Semana 3:**
- [ ] Registre **avaliações físicas** dos alunos
- [ ] Configure **agenda de aulas** (se aplicável)
- [ ] Cadastre **fornecedores** e comece a registrar **despesas**
- [ ] Explore os **relatórios**

**Semana 4:**
- [ ] Se tiver catraca Control ID, faça a **integração**
- [ ] Configure **Wellhub/Gympass** (se aplicável)
- [ ] Explore o **CRM** para captar novos alunos
- [ ] Comece a usar o **Dashboard Financeiro** para análises

---

## 📚 Precisa de Ajuda?

### Documentação

- **[Manual do Usuário](MANUAL-USUARIO.md)** - Guia completo com prints de todas as telas
- **[Guia Rápido](GUIA-RAPIDO.md)** - Referência rápida para tarefas comuns

### Tutoriais em Vídeo

📺 [Canal no YouTube](https://youtube.com/sysfitpro)

### Suporte

- 📧 **Email:** suporte@sysfitpro.com.br
- 📱 **WhatsApp:** (XX) XXXXX-XXXX (Plano Professional+)
- 💬 **Chat:** Disponível no canto inferior direito do sistema

**Horário:**
- Segunda a Sexta: 8h às 18h
- Sábado: 8h às 12h

---

## 🎓 Treinamento Gratuito

Oferecemos **treinamento online gratuito** para novos clientes!

**Agendamento:**
📧 treinamento@sysfitpro.com.br

**Duração:** 1 hora
**Incluído:**
- Tour pelo sistema
- Demonstração das principais funcionalidades
- Sessão de perguntas e respostas
- Material de apoio

---

## ✨ Dicas para o Sucesso

### 1. Mantenha Dados Atualizados
- Atualize emails e telefones dos alunos
- Registre pagamentos no mesmo dia
- Revise relatórios semanalmente

### 2. Use as Notificações
- Configure emails automáticos de cobrança
- Lembre alunos antes do vencimento
- Evite inadimplência

### 3. Aproveite os Relatórios
- Dashboard Financeiro mostra sua saúde financeira
- Relatório de Inadimplência ajuda na cobrança
- Relatório de Alunos mostra crescimento

### 4. Engaje os Alunos
- Incentive uso do app do aluno
- Professores devem criar treinos personalizados
- Registre avaliações físicas regularmente

### 5. Organize as Finanças
- Cadastre todas as despesas
- Use centros de custo para análise
- Acompanhe o fluxo de caixa

---

## 🎉 Bem-vindo ao SysFitPro!

Agora você está pronto para começar!

Se tiver qualquer dúvida, não hesite em entrar em contato com nosso suporte.

**Bons treinos e boa gestão!** 💪

---

**Versão:** 1.0
**Atualizado:** Janeiro 2025
**Site:** https://www.sysfitpro.com.br
