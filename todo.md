# Sistema de Academia - TODO

## 1. Banco de Dados e Schema
- [x] Criar tabela students (alunos)
- [x] Criar tabela plans (planos de mensalidade)
- [x] Criar tabela subscriptions (assinaturas)
- [x] Criar tabela payments (pagamentos)
- [x] Criar tabela medical_exams (exames médicos)
- [x] Criar tabela workouts (treinos)
- [x] Criar tabela exercises (exercícios)
- [x] Criar tabela workout_exercises (relação treino-exercício)
- [x] Criar tabela access_logs (logs de acesso)
- [x] Criar tabela control_id_devices (dispositivos Control ID)
- [x] Criar tabela pix_webhooks (histórico webhooks)
- [x] Criar tabela password_reset_tokens (tokens recuperação senha)
- [x] Adicionar role "professor" ao enum de roles

## 2. Sistema de Autenticação
- [x] Implementar login de aluno com email/senha
- [x] Implementar recuperação de senha via email
- [x] Criar endpoint para solicitar código de recuperação
- [x] Criar endpoint para validar código e resetar senha
- [x] Implementar gestão de sessões

## 3. Área Administrativa
- [x] Dashboard com métricas principais
- [ ] CRUD de alunos
- [ ] CRUD de planos de mensalidade
- [ ] Gestão de assinaturas
- [ ] Gestão de pagamentos e cobranças
- [ ] Visualização de logs de acesso
- [ ] Relatórios financeiros
- [ ] Gestão de dispositivos Control ID

## 4. App para Alunos
- [x] Tela de login
- [ ] Tela de recuperação de senha
- [x] Perfil do aluno
- [x] Carteirinha digital com foto
- [x] Upload de foto facial self-service
- [x] Histórico de pagamentos
- [x] Status de acesso (ativo/bloqueado)
- [x] Visualização de treinos personalizados
- [ ] Notificações

## 5. Área do Professor
- [x] CRUD de exercícios com fotos/vídeos
- [x] Criar treinos personalizados para alunos
- [ ] Gerenciar treinos existentes
- [ ] Upload de fotos/vídeos dos exercícios

## 6. Integração PIX
- [ ] Configurar credenciais Efí Pay
- [ ] Criar recorrências PIX
- [ ] Criar cobranças recorrentes
- [ ] Configurar webhooks PIX
- [ ] Processar notificações de pagamento
- [ ] Liberar acesso automaticamente ao receber pagamento
- [ ] Bloquear acesso automaticamente quando mensalidade atrasa

## 7. Integração Control ID
- [ ] Configurar conexão com dispositivos Control ID
- [ ] Implementar enrolamento facial remoto
- [ ] Autorizar acesso em tempo real
- [ ] Bloquear acesso em tempo real
- [ ] Registrar logs de entrada/saída
- [ ] Verificar status de pagamento antes de autorizar acesso
- [ ] Verificar validade de exame médico antes de autorizar acesso

## 8. Sistema de Emails
- [ ] Configurar serviço de email
- [ ] Email de vencimento de mensalidade
- [ ] Email de exame médico próximo do vencimento
- [ ] Email de novos treinos disponíveis
- [ ] Email de confirmação de pagamento
- [ ] Email com código de recuperação de senha

## 9. Sistema Financeiro
- [ ] Dashboard de métricas financeiras
- [ ] Controle de inadimplência
- [ ] Relatório de receita mensal
- [ ] Relatório de pagamentos pendentes
- [ ] Relatório de alunos ativos/inativos

## 10. Storage e Arquivos
- [ ] Upload de fotos faciais para S3
- [ ] Upload de fotos para carteirinha digital
- [ ] Upload de fotos de exercícios
- [ ] Upload de vídeos de exercícios

## 11. Testes e Validações
- [ ] Testar fluxo completo de cadastro de aluno
- [ ] Testar upload de foto facial
- [ ] Testar integração Control ID
- [ ] Testar webhooks PIX
- [ ] Testar liberação/bloqueio automático de acesso
- [ ] Testar recuperação de senha
- [ ] Testar envio de emails

## App do Aluno - Detalhes Adicionais
- [x] Visualização completa de treinos com todos os exercícios criados pelo professor
- [x] Detalhes de cada exercício (séries, repetições, descanso, fotos, vídeos)
- [x] Área financeira completa com histórico de pagamentos
- [ ] Filtros de pagamentos (por status, data, valor)
- [ ] Visualização e download de recibos de pagamento
- [ ] Geração de recibos em PDF
- [x] Status detalhado de cada pagamento (pago, pendente, atrasado)

## Sistema de Treinos - Progressão Controlada
- [ ] Treinos organizados por dia (Dia A, B, C, etc)
- [ ] Bloquear acesso ao próximo dia até concluir o dia atual
- [x] Marcar exercícios individuais como concluídos
- [ ] Marcar dia completo quando todos exercícios finalizados
- [ ] Histórico de dias completados
- [ ] Resetar progressão ao criar novo treino

## Sistema de Exames Médicos - App do Aluno
- [x] Visualizar exames médicos cadastrados
- [x] Upload de documentos de exames (PDF, imagens)
- [x] Termo de responsabilidade para assinatura digital
- [x] Checkbox para aceitar termo
- [ ] Alertas de vencimento próximo
- [ ] Indicador visual de exame vencido
- [ ] Bloqueio de acesso quando exame vencido

## Separação de Áreas
- [x] Tela inicial com dois botões: "Sou Aluno" e "Sou Professor"
- [x] Professores e alunos fazem login em telas separadas
- [x] Dentro do app, cada um tem acesso à sua área específica
- [x] Área administrativa separada, acesso direto via /admin
- [x] Área administrativa acessível apenas via Manus OAuth

## Sistema Multi-Tenant (Multi-Empresa)
- [x] Criar tabela gyms (academias)
- [x] Adicionar gymId em todas as tabelas existentes
- [x] Adicionar role "super_admin" para dono do sistema
- [x] Adicionar role "gym_admin" para dono de academia
- [x] Implementar isolamento de dados por gymId
- [ ] Criar tela de cadastro de nova academia (pendente)
- [ ] Criar tela de seleção de academia no login (pendente)
- [ ] Criar dashboard super admin para gerenciar todas academias (pendente)
- [x] Atualizar todas as queries para filtrar por gymId
- [x] Atualizar routers para incluir gymId automaticamente
- [x] Criar middleware para validar acesso por gymId

## Sistema de Pagamento PIX com QR Code
- [x] Implementar geração de cobrança PIX no backend
- [x] Criar endpoint para gerar QR Code PIX
- [x] Adicionar botão "Pagar Agora" em mensalidades pendentes/atrasadas
- [x] Criar modal de pagamento com QR Code
- [x] Implementar função para copiar código PIX
- [x] Adicionar timer de expiração do QR Code
- [ ] Implementar webhook para receber confirmação de pagamento (pendente)
- [x] Atualizar status automaticamente quando pagamento confirmado
- [x] Enviar notificação ao aluno quando pagamento confirmado
- [ ] Liberar acesso automaticamente após pagamento (requer integração Control ID)
- [x] Gerar recibo em HTML automaticamente quando pagamento confirmado
- [x] Salvar recibo no S3
- [x] Adicionar campo receiptUrl na tabela payments
- [x] Implementar download de recibo no frontend

## Sistema Financeiro Administrativo
- [x] Criar tela de gestão financeira completa (/admin/payments)
- [x] Listar todos os pagamentos com filtros (status, período, aluno, método)
- [x] Exibir total recebido, pendente e atrasado
- [x] Implementar registro manual de pagamento em dinheiro/cartão
- [x] Gerar recibo automaticamente para pagamentos manuais
- [x] Criar dashboard financeiro com gráficos
- [x] Gráfico de receita mensal (últimos 12 meses)
- [x] Gráfico de inadimplência (status dos pagamentos)
- [x] Gráfico de métodos de pagamento (PIX vs Dinheiro vs Cartão)
- [ ] Exportar relatório financeiro em PDF/Excel (pendente)
- [x] Visualizar detalhes de cada pagamento
- [ ] Enviar lembrete de pagamento para alunos inadimplentes (pendente)
- [x] Dashboard com métricas em tempo real

## Dashboard de Inadimplentes e Cobranças
- [x] Criar seção de inadimplentes no dashboard principal
- [x] Listar alunos com mensalidades atrasadas
- [x] Exibir dias de atraso e valor devido
- [x] Criar seção de mensalidades a vencer (próximos 7 dias)
- [x] Implementar pesquisa avançada de inadimplentes
- [x] Filtrar por período de atraso (1-7, 8-15, 16-30, 30+ dias)
- [x] Buscar por matrícula ou CPF
- [x] Implementar ações em massa (seleção múltipla)
- [x] Botão enviar email de cobrança para inadimplentes selecionados
- [x] Botão gerar relatório de inadimplência em PDF
- [x] Botão marcar alunos como bloqueados por inadimplência

## Sistema de Cadastro de Professores e Funcionários
- [x] Adicionar role "staff" no banco de dados
- [x] Adicionar campo permissions no users
- [x] Criar API para cadastrar professor com usuário e senha
- [x] Criar API para listar professores
- [x] Criar API para editar professor
- [x] Criar API para excluir professor
- [x] Criar API para cadastrar funcionário com permissões
- [x] Criar API para listar funcionários
- [x] Criar API para editar funcionário e permissões
- [x] Criar API para excluir funcionário
- [ ] Criar tela de gestão de professores (/admin/professors)
- [ ] Formulário de cadastro de professor
- [ ] Lista de professores cadastrados
- [ ] Edição de dados do professor
- [ ] Criar tela de gestão de funcionários (/admin/staff)
- [ ] Formulário de cadastro de funcionário
- [ ] Sistema de seleção de permissões
- [ ] Lista de funcionários cadastrados
- [ ] Edição de funcionário e permissões
- [ ] Definir permissões granulares (ver pagamentos, editar alunos, etc)

## Sistema de Cadastro de Alunos e Planos
- [x] Criar tela de gestão de planos (/admin/plans)
- [x] Formulário de cadastro de plano com nome, valor, duração
- [x] Lista de planos cadastrados
- [x] Edição e exclusão de planos
- [x] Criar tela de gestão de alunos (/admin/students)
- [x] Formulário completo de cadastro de aluno
- [x] Seleção de plano de mensalidade no cadastro
- [x] Geração automática de mensalidades ao vincular plano
- [x] Lista de alunos cadastrados
- [x] Edição de dados do aluno
- [ ] Visualização de mensalidades do aluno
- [ ] Mensalidades aparecem automaticamente no app do aluno

## Prioridade Alta - Concluído

### Tela de Gestão de Professores
- [x] Criar componente AdminProfessors.tsx
- [x] Formulário de cadastro de professor
- [x] Lista de professores com busca
- [x] Modal de edição de professor
- [x] Botão de exclusão com confirmação
- [x] Adicionar rota /admin/professors no App.tsx

### Tela de Gestão de Funcionários
- [x] Criar componente AdminStaff.tsx
- [x] Formulário de cadastro com sistema de permissões
- [x] Checkboxes para permissões granulares:
  * viewStudents - Visualizar alunos
  * editStudents - Editar alunos
  * viewPayments - Visualizar pagamentos
  * editPayments - Editar pagamentos
  * viewReports - Visualizar relatórios
  * manageAccess - Gerenciar controle de acesso
  * managePlans - Gerenciar planos
- [x] Lista de funcionários cadastrados
- [x] Modal de edição de funcionário e permissões
- [x] Botão de exclusão com confirmação
- [x] Adicionar rota /admin/staff no App.tsx

### Sistema de Notificações por Email
- [x] Criar serviço de agendamento de emails (cron jobs)
- [x] Email de vencimento de mensalidade (7 dias antes)
- [x] Email de confirmação de pagamento
- [x] Email de exame médico vencendo (15 dias antes)
- [x] Email de boas-vindas ao novo aluno
- [x] Templates HTML para cada tipo de email
- [x] Configurar cron jobs para execução automática
- [x] Integrar cron jobs no servidor

## Prioridade Média - Em Desenvolvimento

### Cadastro Multi-Tenant de Academias
- [ ] Criar tela de gestão de academias (/super-admin/gyms)
- [ ] Formulário de cadastro com dados completos da academia
- [ ] Campos: nome, slug, CNPJ, email, telefone, endereço completo
- [ ] Upload de logo da academia
- [ ] Lista de academias cadastradas
- [ ] Edição de dados da academia
- [ ] Ativação/desativação de academia
- [ ] Seleção de academia no login (dropdown)
- [ ] Dashboard super admin com visão geral de todas academias

### Integração Control ID para Controle de Acesso
- [x] Criar serviço de comunicação com dispositivos Control ID
- [x] Endpoint para cadastro facial remoto (interativo)
- [x] Endpoint para upload de foto facial
- [x] Métodos de sincronização de usuários
- [x] Métodos de bloqueio/desbloqueio de acesso
- [x] Método para obter logs de acesso
- [x] Documentação completa da API Control ID
- [ ] Criar tabela control_id_devices no banco
- [ ] Endpoints tRPC para chamar Control ID
- [ ] Tela de configuração de dispositivos
- [ ] Tela de visualização de logs de acesso
- [ ] Integração automática com cadastro de alunos

### Exportação de Relatórios
- [ ] Criar tela de relatórios (/admin/reports)
- [ ] Relatório de inadimplência (PDF)
- [ ] Relatório de pagamentos por período (PDF/Excel)
- [ ] Relatório financeiro mensal (PDF)
- [ ] Filtros por data, status, plano
- [ ] Gráficos de receita mensal
- [ ] Lista de alunos ativos/inativos
- [ ] Exportação em PDF usando jsPDF
- [ ] Exportação em Excel usando xlsx

### Melhorias no Menu
- [x] Adicionar link "Professores" no AdminDashboard
- [x] Adicionar link "Funcionários" no AdminDashboard
- [ ] Adicionar link "Relatórios" no AdminDashboard
- [x] Reorganizar ordem dos itens do menu
- [x] Adicionar ícones apropriados para cada item

## Concluído - Control ID e Relatórios

### Integração Control ID (Backend Completo)
- [x] Criar tabela control_id_devices no banco de dados
- [x] Adicionar funções no db.ts para gerenciar dispositivos
- [x] Criar endpoints tRPC para Control ID (enrollFace, uploadFace, syncUser, blockUser, getLogs)
- [x] Tela de configuração de dispositivos (/admin/control-id-devices)
- [x] Adicionar link no menu do dashboard
- [ ] Botão "Cadastrar Face" na tela de alunos (requer dispositivo físico)
- [ ] Integração automática: cadastrar aluno → criar no Control ID (requer dispositivo)
- [ ] Bloqueio automático: inadimplente → bloquear no dispositivo (requer dispositivo)
- [ ] Tela de logs de acesso (/admin/access-logs) (requer dispositivo)
- [ ] Testar cadastro facial interativo (requer dispositivo físico)
- [ ] Testar upload de foto (requer dispositivo físico)

### Sistema de Relatórios
- [x] Instalar bibliotecas: jspdf, jspdf-autotable, xlsx
- [x] Criar tela /admin/reports com filtros
- [x] Relatório de inadimplência (PDF)
- [x] Relatório de pagamentos por período (PDF/Excel)
- [x] Relatório financeiro mensal com gráficos (PDF)
- [x] Exportação de lista de alunos (Excel)
- [x] Botões de download em cada relatório
- [x] Adicionar link no menu do dashboard

## Concluído - Cadastro Facial e Bloqueio Automático

### Botão Cadastrar Face na Tela de Alunos
- [x] Adicionar botão "Cadastrar Face" na lista de alunos
- [x] Criar modal de cadastro facial com 2 opções
- [x] Opção 1: Cadastro interativo (aluno olha para dispositivo)
- [x] Opção 2: Upload de foto
- [x] Integrar com endpoints tRPC controlId.enrollFace e controlId.uploadFacePhoto
- [x] Mostrar status de sucesso/erro após cadastro
- [x] Atualizar tabela automaticamente após cadastro
- [x] Mostrar badge de status de biometria (cadastrada/pendente)

### Bloqueio Automático de Inadimplentes
- [x] Criar função checkAndBlockDefaulters no notifications.ts
- [x] Verificar alunos com mensalidades vencidas há mais de 7 dias
- [x] Bloquear acesso no banco de dados (status = blocked)
- [x] Bloquear acesso no Control ID para inadimplentes
- [x] Enviar email notificando bloqueio
- [x] Adicionar cron job diário (executa às 6h da manhã)
- [x] Registrar logs de bloqueios realizados no console
- [x] Calcular dias de atraso e valor total devido
