import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dumbbell,
  Shield,
  TrendingUp,
  Wallet,
  Users,
  Clock,
  Smartphone,
  Calendar,
  BarChart3,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Zap,
  Lock,
  QrCode,
  UserCheck,
} from "lucide-react";
import { useLocation } from "wouter";

const mainFeatures = [
  {
    icon: Shield,
    title: "Control ID - Reconhecimento Facial",
    subtitle: "Acesso biométrico 100% automático",
    description: "Integração completa com Control ID para controle de acesso por reconhecimento facial. Tecnologia de ponta para segurança máxima.",
    details: [
      "Cadastro facial direto do sistema",
      "Liberação automática apenas com mensalidade em dia",
      "Bloqueio automático por inadimplência",
      "Bloqueio automático por exame médico vencido",
      "Registro de todos os acessos com foto e horário",
      "Múltiplos pontos de acesso (Enterprise)",
      "Sem necessidade de cartões ou senhas",
      "Relatórios de frequência em tempo real",
    ],
    color: "blue",
  },
  {
    icon: TrendingUp,
    title: "Integração Wellhub (Gympass)",
    subtitle: "Aumente sua base de alunos",
    description: "Sincronização automática com a plataforma Wellhub. Receba alunos corporativos e gerencie tudo pelo SysFit.",
    details: [
      "Recebimento automático de novos membros Wellhub",
      "Check-in sincronizado em tempo real",
      "Gestão de pagamentos Wellhub no sistema",
      "Relatórios de alunos Wellhub separados",
      "Configuração de planos específicos",
      "Webhook para atualizações instantâneas",
      "Controle de status (ativo, pausado, cancelado)",
      "Integração com API Wellhub oficial",
    ],
    color: "purple",
  },
  {
    icon: Wallet,
    title: "PIX Automático com QR Code",
    subtitle: "Receba pagamentos instantaneamente",
    description: "Geração automática de QR Codes PIX para mensalidades. Confirmação em tempo real e liberação imediata de acesso.",
    details: [
      "Geração de QR Code PIX personalizado",
      "Confirmação de pagamento em tempo real",
      "Liberação automática de acesso após pagamento",
      "Envio de cobrança por WhatsApp",
      "Conciliação bancária automática",
      "Histórico completo de transações",
      "Múltiplas chaves PIX configuráveis",
      "Integração com gateway de pagamento",
    ],
    color: "green",
  },
];

const additionalFeatures = [
  {
    icon: Users,
    title: "Gestão Completa de Alunos",
    items: [
      "Cadastro completo com foto",
      "Carteirinha digital",
      "Histórico de pagamentos",
      "Controle de planos e valores",
      "Upload de documentos",
      "Gestão de exames médicos",
      "Histórico de treinos",
      "Controle de inadimplência",
    ],
  },
  {
    icon: Dumbbell,
    title: "Treinos Personalizados",
    items: [
      "Biblioteca de exercícios",
      "Upload de fotos, vídeos e GIFs",
      "Criação de fichas de treino",
      "Séries, repetições e carga",
      "Atribuição de treinos aos alunos",
      "Visualização no app mobile",
      "Histórico de evolução",
      "Filtros por grupo muscular",
    ],
  },
  {
    icon: Users,
    title: "Gestão de Professores",
    items: [
      "Cadastro de professores",
      "Vínculo de alunos por professor",
      "Gestão de treinos criados",
      "Relatórios de alunos ativos",
      "Controle de acesso ao sistema",
      "Dashboard exclusivo",
      "Acompanhamento de evolução",
      "Múltiplos professores (planos Pro/Enterprise)",
    ],
  },
  {
    icon: TrendingUp,
    title: "CRM e Gestão de Leads",
    items: [
      "Cadastro de visitantes/leads",
      "Agendamento de avaliação",
      "Status do lead (quente, frio, convertido)",
      "Histórico de interações",
      "Follow-up automático",
      "Conversão de lead em aluno",
      "Relatórios de conversão",
      "Origem do lead (indicação, Google, etc)",
    ],
  },
  {
    icon: Calendar,
    title: "Agendamento de Aulas",
    items: [
      "Criação de aulas em grupo",
      "Controle de vagas disponíveis",
      "Reserva de horários",
      "Confirmação automática",
      "Lista de presença",
      "Cancelamento de reservas",
      "Notificações por WhatsApp",
      "Relatórios de ocupação",
    ],
  },
  {
    icon: BarChart3,
    title: "Gestão Financeira",
    items: [
      "Controle de receitas e despesas",
      "Categorização de transações",
      "Contas a pagar e receber",
      "Fluxo de caixa",
      "Conciliação bancária",
      "Relatórios financeiros",
      "Gráficos de faturamento",
      "Exportação para Excel",
    ],
  },
  {
    icon: Clock,
    title: "Controle de Exames Médicos",
    items: [
      "Cadastro de exames com data de validade",
      "Upload de documentos",
      "Alerta de vencimento",
      "Bloqueio automático de acesso",
      "Notificação ao aluno",
      "Histórico de exames",
      "Relatório de pendências",
      "Integração com Control ID",
    ],
  },
  {
    icon: Smartphone,
    title: "App Mobile Responsivo",
    items: [
      "Visualização de treinos",
      "Carteirinha digital",
      "Pagamento de mensalidades",
      "Histórico de pagamentos",
      "Visualização de exercícios",
      "Fotos e vídeos dos treinos",
      "Notificações push",
      "Funciona em qualquer dispositivo",
    ],
  },
  {
    icon: FileText,
    title: "Relatórios Avançados",
    items: [
      "Dashboard com métricas em tempo real",
      "Relatório de faturamento",
      "Relatório de inadimplência",
      "Relatório de novos alunos",
      "Relatório de cancelamentos",
      "Relatório de frequência",
      "Relatório de Wellhub",
      "Exportação em PDF e Excel",
    ],
  },
];

export default function Features() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SysFit Pro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => setLocation("/pricing")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Ver Planos
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Todas as Funcionalidades
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Descubra tudo que o SysFit Pro pode fazer pela sua academia. Da biometria facial
            ao app mobile, temos tudo que você precisa.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              <Shield className="w-4 h-4 inline mr-2" />
              Control ID
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Wellhub
            </span>
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              <QrCode className="w-4 h-4 inline mr-2" />
              PIX Automático
            </span>
            <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
              <Smartphone className="w-4 h-4 inline mr-2" />
              App Mobile
            </span>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-gray-600">
              As features que fazem do SysFit Pro único no mercado
            </p>
          </div>

          <div className="space-y-20">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              const colors = {
                blue: { gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
                purple: { gradient: "from-purple-500 to-purple-600", bg: "bg-purple-50", text: "text-purple-600" },
                green: { gradient: "from-green-500 to-green-600", bg: "bg-green-50", text: "text-green-600" },
              };
              const color = colors[feature.color as keyof typeof colors];

              return (
                <div key={index} className={`grid md:grid-cols-2 gap-12 items-center ${!isEven ? "md:flex-row-reverse" : ""}`}>
                  <div className={!isEven ? "md:order-2" : ""}>
                    <div className={`w-16 h-16 bg-gradient-to-br ${color.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className={`text-lg font-semibold ${color.text} mb-4`}>
                      {feature.subtitle}
                    </p>
                    <p className="text-gray-600 mb-6 text-lg">
                      {feature.description}
                    </p>
                    <Button
                      onClick={() => setLocation("/signup")}
                      className={`bg-gradient-to-r ${color.gradient} hover:opacity-90`}
                      size="lg"
                    >
                      Começar Agora
                    </Button>
                  </div>

                  <Card className={`${color.bg} border-2`}>
                    <CardContent className="p-8">
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                        O que está incluído:
                      </h4>
                      <div className="space-y-3">
                        {feature.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <CheckCircle2 className={`w-5 h-5 ${color.text} flex-shrink-0 mt-0.5`} />
                            <span className="text-gray-700">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              E tem muito mais
            </h2>
            <p className="text-xl text-gray-600">
              Todas as ferramentas que você precisa em um só lugar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <div className="space-y-2">
                      {feature.items.map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para transformar sua academia?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de academias que já usam o SysFit Pro para crescer
            e automatizar seus processos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation("/signup")}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              Começar Teste Grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10"
              onClick={() => setLocation("/pricing")}
            >
              Ver Planos e Preços
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
