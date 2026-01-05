# Melhorias Sugeridas para o Sistema

Este documento lista melhorias e novas funcionalidades sugeridas para implementação futura, organizadas por prioridade e área.

---

## 📊 Prioridade ALTA (Implementar primeiro)

### 1. 📈 Dashboard de Acessos em Tempo Real

**Objetivo:** Visualizar quem está na academia no momento e métricas de uso.

**Funcionalidades:**
- Lista de alunos presentes agora (entrada sem saída)
- Contador total de pessoas na academia
- Gráfico de acessos por hora do dia
- Gráfico de acessos por dia da semana
- Identificação de horários de pico
- Média de permanência na academia
- Taxa de ocupação atual vs. capacidade máxima

**Benefícios:**
- Controlar lotação em tempo real
- Identificar necessidade de ampliar horários/turmas
- Tomar decisões operacionais baseadas em dados
- Planejar escala de funcionários nos horários de pico

**Complexidade:** Média
**Tempo estimado:** 1-2 dias

**Implementação:**
```typescript
// Nova página: AdminDashboardRealTime.tsx
// Nova query tRPC: accessLogs.getCurrentlyPresent
// Usar WebSocket ou polling para atualização em tempo real
// Charts com Recharts ou similar
```

---

### 2. 🚨 Registro de Tentativas de Acesso Negadas

**Objetivo:** Monitorar tentativas de acesso bloqueadas para identificar problemas.

**Funcionalidades:**
- Log de todas as tentativas negadas
- Motivo do bloqueio:
  - Inadimplente
  - Exame médico vencido
  - Status inativo/suspenso
  - Horário não permitido
  - Usuário não cadastrado
- Data e hora da tentativa
- Dispositivo que negou acesso
- Foto capturada no momento (se disponível)
- Filtros por período, aluno, motivo
- Alertas para recepção em tempo real
- Notificação push quando aluno bloqueado tenta entrar

**Benefícios:**
- Identificar alunos que tentam entrar bloqueados
- Abordagem proativa pela recepção
- Segurança contra tentativas não autorizadas
- Dados para cobrança de inadimplentes

**Complexidade:** Média
**Tempo estimado:** 2 dias

**Implementação:**
```typescript
// Nova tabela: access_denials
// Colunas: id, studentId, deviceId, denialReason, timestamp, photoUrl
// Control ID API: eventos de acesso negado
// Nova página: AdminAccessDenials.tsx
```

---

### 3. ⏰ Controle de Horário de Acesso por Plano

**Objetivo:** Diferenciar planos permitindo acesso apenas em horários específicos.

**Funcionalidades:**
- Definir horários permitidos por plano:
  - Plano Matutino: 6h-12h
  - Plano Vespertino: 12h-18h
  - Plano Noturno: 18h-22h
  - Plano Integral: 6h-22h
  - Plano Personalizado: Admin define
- Bloqueio automático fora do horário
- Mensagem específica na leitora
- Exceções pontuais (liberar aluno específico)
- Horários diferentes por dia da semana
- Feriados com horário especial

**Benefícios:**
- Diferenciar planos por preço
- Controlar fluxo de pessoas
- Incentivar uso em horários vazios
- Aumentar receita com planos premium

**Complexidade:** Alta
**Tempo estimado:** 3 dias

**Implementação:**
```typescript
// Adicionar ao schema de plans:
// - allowedStartTime
// - allowedEndTime
// - allowedDays (array)
// Validação na Control ID antes de liberar acesso
// Configuração de exceções por aluno
```

---

## 📊 Prioridade MÉDIA

### 4. 👥 Registro de Visitantes e Convidados

**Objetivo:** Permitir acesso temporário para visitantes e aulas experimentais.

**Funcionalidades:**
- Cadastro rápido de visitante
- Dados mínimos: nome, CPF, telefone
- Termo de responsabilidade digital
- Acesso válido por 1 dia (ou período definido)
- Cadastro de foto facial temporária
- Limite de visitas por CPF (ex: 1 visita grátis)
- Conversão para aluno regular
- Relatório de conversão de visitantes

**Benefícios:**
- Facilitar aulas experimentais
- Day use para não-alunos
- Controle de acesso de visitantes
- Funil de conversão para vendas

**Complexidade:** Média
**Tempo estimado:** 2-3 dias

---

### 5. 📊 Relatórios de Frequência e Engajamento

**Objetivo:** Identificar alunos em risco de cancelamento.

**Funcionalidades:**
- Frequência semanal por aluno
- Média de treinos por mês
- Alunos inativos (sem acesso há X dias):
  - 7 dias: Alerta amarelo
  - 15 dias: Alerta laranja
  - 30 dias: Alerta vermelho
- Ranking de alunos mais frequentes
- Tendência de frequência (aumentando/diminuindo)
- Campanhas automáticas de reativação
- Email "Sentimos sua falta"
- Sugestão de contato para retenção

**Benefícios:**
- Reduzir churn (cancelamentos)
- Ação proativa de retenção
- Identificar padrões antes do cancelamento
- Aumentar lifetime value do aluno

**Complexidade:** Média
**Tempo estimado:** 2 dias

---

### 6. 🎯 Zonas de Acesso Diferenciadas

**Objetivo:** Controlar acesso a áreas específicas da academia.

**Funcionalidades:**
- Múltiplas zonas:
  - Área de musculação (todos)
  - Piscina (apenas planos premium)
  - Sauna (apenas planos premium)
  - Quadra (agendamento prévio)
  - Área VIP (mensalistas premium)
- Leitoras diferentes para cada zona
- Planos com permissões diferentes
- Agendamento para áreas compartilhadas
- Limite de pessoas por zona

**Benefícios:**
- Valorizar planos premium
- Controlar capacidade por área
- Segurança e organização
- Aumentar receita com upgrades

**Complexidade:** Alta
**Tempo estimado:** 4-5 dias

**Implementação:**
```typescript
// Nova tabela: access_zones
// Nova tabela: plan_zone_permissions
// Múltiplos dispositivos Control ID
// Lógica de verificação de zona antes de liberar
```

---

### 7. 🔔 Notificações Push e SMS

**Objetivo:** Comunicação em tempo real com alunos e responsáveis.

**Funcionalidades:**
- Notificação de entrada/saída (para pais de menores)
- Alerta de bloqueio por inadimplência
- Lembrete de vencimento de mensalidade
- Confirmação de pagamento
- Lembrete de exame médico
- Avisos gerais da academia
- Notificação de novas aulas disponíveis

**Benefícios:**
- Segurança para menores de idade
- Melhor comunicação
- Reduzir inadimplência
- Aumentar engajamento

**Complexidade:** Alta (integração com Twilio/Firebase)
**Tempo estimado:** 3-4 dias

---

### 8. 📸 Captura de Foto em Cada Acesso

**Objetivo:** Segurança contra fraudes e uso indevido.

**Funcionalidades:**
- Foto capturada pela leitora a cada acesso
- Comparação com foto cadastrada
- Armazenamento de fotos de acesso
- Galeria de acessos por aluno
- Detecção de anomalias:
  - Pessoa diferente usando credencial
  - Múltiplos acessos simultâneos (impossível)
- Alerta para equipe de segurança

**Benefícios:**
- Prevenir compartilhamento de cadastro
- Evidência em caso de disputas
- Segurança adicional
- Auditoria de acessos

**Complexidade:** Média (depende da Control ID)
**Tempo estimado:** 2 dias

---

### 9. ⚠️ Alertas de Comportamento Incomum

**Objetivo:** Detectar padrões anormais de uso.

**Funcionalidades:**
- Detecção automática de:
  - Acesso em horário incomum (aluno que nunca vai à noite)
  - Múltiplos acessos no mesmo dia (>3)
  - Tempo de permanência muito curto (<15min)
  - Tempo de permanência muito longo (>4h)
  - Padrão de uso mudou drasticamente
- Dashboard de anomalias
- Notificação para admin
- Possibilidade de investigação

**Benefícios:**
- Detectar uso irregular
- Identificar compartilhamento de cadastro
- Segurança patrimonial
- Dados para abordagem comercial

**Complexidade:** Média-Alta (ML básico)
**Tempo estimado:** 3 dias

---

## 📊 Prioridade BAIXA (Nice to have)

### 10. 🎫 QR Code de Acesso Temporário

**Objetivo:** Alternativa à biometria para contingência.

**Funcionalidades:**
- Geração de QR code único por aluno
- Válido por 24h ou uso único
- Leitor de QR code integrado
- Uso em caso de:
  - Falha na leitora biométrica
  - Aluno com problema no rosto (curativos, etc)
  - Backup de acesso
- Limite de usos por mês

**Benefícios:**
- Redundância do sistema
- Continuidade em caso de falha
- Flexibilidade de acesso

**Complexidade:** Média
**Tempo estimado:** 2 dias

---

### 11. 🌡️ Controle de Temperatura na Entrada

**Objetivo:** Protocolo sanitário (se dispositivo suportar).

**Funcionalidades:**
- Medição automática de temperatura
- Bloqueio se temperatura > 37.5°C
- Log de temperaturas medidas
- Alerta para equipe
- Relatório de medições

**Benefícios:**
- Protocolo sanitário
- Segurança de saúde
- Conformidade com regulamentos

**Complexidade:** Baixa (se Control ID suportar)
**Tempo estimado:** 1 dia

**Observação:** Depende de hardware específico

---

### 12. 📱 Aplicativo Mobile para Alunos

**Objetivo:** Melhorar experiência do aluno.

**Funcionalidades:**
- Login e autenticação
- Visualização de treinos
- Check-in via app
- QR code de acesso
- Agendamento de aulas
- Consulta de pagamentos
- Geração de PIX
- Notificações push
- Chat com professor
- Evolução de medidas

**Benefícios:**
- Modernização
- Melhor experiência do usuário
- Engajamento mobile-first
- Diferencial competitivo

**Complexidade:** Muito Alta
**Tempo estimado:** 4-6 semanas

**Tecnologias sugeridas:**
- React Native ou Flutter
- Expo para deploy
- Firebase para push notifications

---

## 🔄 Melhorias em Funcionalidades Existentes

### Sistema de Pagamentos
- [ ] Integração com outros bancos PIX (além de Sicoob)
- [ ] Pagamento recorrente automático (débito automático)
- [ ] Parcelamento de mensalidades
- [ ] Descontos progressivos (semestral, anual)
- [ ] Cupons promocionais
- [ ] Programa de indicação com desconto

### Relatórios
- [ ] Exportação em PDF
- [ ] Exportação em Excel
- [ ] Filtros avançados
- [ ] Gráficos interativos
- [ ] Comparativo entre períodos
- [ ] Previsão de receita

### Dashboard Admin
- [ ] Widgets personalizáveis
- [ ] Métricas em tempo real
- [ ] Comparativo com mês anterior
- [ ] Alertas configuráveis
- [ ] Metas e objetivos

### Comunicação
- [ ] Templates de email personalizáveis
- [ ] Campanhas de marketing por email
- [ ] WhatsApp Business API
- [ ] Central de notificações unificada

---

## 🎯 Roadmap Sugerido

### Fase 1 (Próximos 15 dias)
1. Dashboard de Acessos em Tempo Real
2. Registro de Tentativas Negadas
3. Relatórios de Frequência

### Fase 2 (30-45 dias)
1. Controle de Horário por Plano
2. Registro de Visitantes
3. Notificações Push/SMS

### Fase 3 (60-90 dias)
1. Zonas de Acesso Diferenciadas
2. Alertas de Comportamento
3. Captura de Fotos em Acesso

### Fase 4 (Longo prazo)
1. Aplicativo Mobile
2. Funcionalidades avançadas de ML
3. Integrações adicionais

---

## 💡 Observações Importantes

**Priorização:**
- Focar primeiro em funcionalidades que geram valor imediato
- Considerar complexidade vs. benefício
- Ouvir feedback dos usuários (admin e alunos)

**Tecnologias:**
- Avaliar necessidade de cada integração
- Considerar custos de APIs externas (SMS, Push)
- Manter compatibilidade com infraestrutura atual

**Métricas de Sucesso:**
- Redução de inadimplência
- Aumento de retenção de alunos
- Melhora na satisfação (NPS)
- Aumento de receita

---

**Última atualização:** 18/12/2024
