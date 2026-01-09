import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, Dumbbell, X, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Pricing() {
  const [, setLocation] = useLocation();

  // Buscar planos do banco de dados
  const { data: saasPlans, isLoading } = trpc.saasPlans.list.useQuery();

  const handleSelectPlan = (planSlug: string, price: number) => {
    setLocation(`/signup?plan=${planSlug}&price=${price}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
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
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Planos e Preços
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha o plano ideal para sua academia. Todos os planos incluem atualizações
            gratuitas e suporte técnico.
          </p>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando planos...</p>
          </div>
        ) : saasPlans && saasPlans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {saasPlans
              .filter(plan => plan.active)
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((plan) => {
                const features = plan.features ? JSON.parse(plan.features) : [];
                const priceInReais = (plan.priceInCents / 100).toFixed(2);

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      plan.featured
                        ? "border-2 border-indigo-600 shadow-2xl scale-105"
                        : "border shadow-lg"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Mais Popular
                        </span>
                      </div>
                    )}
                    <CardHeader className="text-center pb-8 pt-8">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Dumbbell className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                      )}
                      <div className="mb-4">
                        <span className="text-5xl font-bold text-gray-900">
                          R${priceInReais.replace('.', ',')}
                        </span>
                        <span className="text-gray-600">/mês</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-6">
                        {features.map((feature: string, index: number) => (
                          <div key={index} className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                        {plan.hasControlId && (
                          <div className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">Control ID - Reconhecimento facial</span>
                          </div>
                        )}
                        {plan.hasWellhub && (
                          <div className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">Integração Wellhub (Gympass)</span>
                          </div>
                        )}
                        {plan.hasWhatsappIntegration && (
                          <div className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">Integração WhatsApp</span>
                          </div>
                        )}
                        {plan.hasAdvancedReports && (
                          <div className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">Relatórios Avançados</span>
                          </div>
                        )}
                        {plan.hasPrioritySupport && (
                          <div className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">Suporte Prioritário</span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleSelectPlan(plan.slug, plan.priceInCents)}
                        className={`w-full ${
                          plan.featured
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            : "bg-gray-900 hover:bg-gray-800"
                        }`}
                        size="lg"
                      >
                        Escolher {plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhum plano disponível no momento.</p>
          </div>
        )}

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Como funciona a integração com Control ID?
                </h4>
                <p className="text-gray-600">
                  O Control ID é um sistema de reconhecimento facial biométrico. Instalamos os
                  equipamentos na sua academia e integramos com o SysFit. O sistema libera acesso
                  automaticamente apenas para alunos com mensalidade em dia e exames válidos.
                  Sem cartões, sem senhas, 100% automático.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  A integração Wellhub (Gympass) está inclusa?
                </h4>
                <p className="text-gray-600">
                  A integração Wellhub está disponível apenas no plano Enterprise. Com ela, você
                  recebe automaticamente os check-ins, gerencia membros Wellhub e recebe os
                  pagamentos direto no sistema. Ideal para academias que querem aumentar o número
                  de alunos via parceria corporativa.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Posso mudar de plano depois?
                </h4>
                <p className="text-gray-600">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                  O valor será ajustado proporcionalmente no próximo ciclo de cobrança.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Há período de teste grátis?
                </h4>
                <p className="text-gray-600">
                  Sim! Oferecemos 14 dias de teste grátis em todos os planos. Você tem acesso
                  completo a todas as funcionalidades do plano escolhido. Não é necessário
                  cartão de crédito para começar.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Como funciona o pagamento PIX automático?
                </h4>
                <p className="text-gray-600">
                  O sistema gera automaticamente QR Codes PIX para as mensalidades. Quando o
                  aluno paga, recebemos a confirmação em tempo real e liberamos o acesso
                  instantaneamente. Você também pode configurar para enviar cobranças
                  automáticas por WhatsApp.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Como funciona o suporte técnico?
                </h4>
                <p className="text-gray-600">
                  Plano Básico tem suporte por email. Professional tem suporte prioritário
                  via WhatsApp em horário comercial. Enterprise conta com suporte 24/7 via
                  WhatsApp, telefone e gerente de conta dedicado.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
