import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dumbbell,
  Users,
  Wallet,
  Calendar,
  Smartphone,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Mail,
  Phone,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

const features = [
  {
    icon: Shield,
    title: "Control ID - Reconhecimento Facial",
    description: "Integração com Control ID para controle de acesso biométrico facial. Liberação automática apenas para alunos com mensalidade em dia e exames válidos",
    color: "blue",
    highlight: true,
  },
  {
    icon: TrendingUp,
    title: "Integração Wellhub (Gainpass)",
    description: "Sincronização automática com Wellhub. Receba check-ins, gerencie membros e processse pagamentos da plataforma diretamente no sistema",
    color: "purple",
    highlight: true,
  },
  {
    icon: Wallet,
    title: "PIX Automático com QR Code",
    description: "Geração automática de QR Code PIX para mensalidades. Pagamento confirmado em tempo real e liberação instantânea de acesso",
    color: "green",
    highlight: true,
  },
  {
    icon: Users,
    title: "Gestão Completa de Alunos",
    description: "Cadastro, histórico, pagamentos, planos, exames médicos, fotos, carteirinha digital e controle de inadimplência",
    color: "indigo",
  },
  {
    icon: Clock,
    title: "Controle de Exames Médicos",
    description: "Validação automática de exames. Sistema bloqueia acesso automaticamente quando o exame vence. Upload de documentos integrado",
    color: "orange",
  },
  {
    icon: Dumbbell,
    title: "Treinos Personalizados",
    description: "Professores criam exercícios com fotos, vídeos e GIFs. Monte treinos completos com séries, repetições e carga. Alunos acessam pelo app",
    color: "pink",
  },
  {
    icon: Smartphone,
    title: "App Mobile para Alunos",
    description: "Aplicativo responsivo onde alunos veem treinos, fazem pagamentos, baixam carteirinha digital e acompanham mensalidades",
    color: "cyan",
  },
  {
    icon: Users,
    title: "Gestão de Professores",
    description: "Controle de professores, vincule alunos, gerencie treinos criados e acompanhe evolução dos alunos",
    color: "violet",
  },
  {
    icon: TrendingUp,
    title: "CRM e Gestão de Leads",
    description: "Sistema completo de CRM para gerenciar visitantes, agendamentos de avaliação, conversão de leads em alunos e follow-up",
    color: "emerald",
  },
  {
    icon: Calendar,
    title: "Agendamento de Aulas",
    description: "Sistema de reservas para aulas em grupo, avaliações físicas e horários especiais. Controle de vagas e confirmações",
    color: "amber",
  },
  {
    icon: Wallet,
    title: "Gestão Financeira Completa",
    description: "Controle de receitas, despesas, contas a pagar/receber, fluxo de caixa, categorização e conciliação bancária",
    color: "rose",
  },
  {
    icon: CheckCircle2,
    title: "Relatórios Avançados",
    description: "Dashboard com métricas em tempo real, relatórios de faturamento, inadimplência, novos alunos, cancelamentos e muito mais",
    color: "sky",
  },
];

const benefits = [
  "Controle de acesso biométrico com Control ID - sem cartões ou senhas",
  "Integração nativa com Wellhub (antigo Gympass) - receba mais alunos",
  "Pagamento PIX automático - confirmação em tempo real",
  "Bloqueio automático por inadimplência ou exame vencido",
  "App mobile completo para alunos - treinos e pagamentos",
  "Redução de 70% do tempo gasto com tarefas administrativas",
  "Aumento de 40% na retenção de alunos com melhor experiência",
  "Relatórios em tempo real para decisões baseadas em dados",
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Buscar configurações do site
  const { data: settings } = trpc.settings.get.useQuery();

  // Buscar planos SaaS dinâmicos
  const { data: saasPlans, isLoading: plansLoading } = trpc.saasPlans.listActive.useQuery();

  // Buscar configurações de trial do Super Admin (rota pública)
  const { data: superAdminSettings } = trpc.superAdminSettings.getPublicInfo.useQuery();

  // Buscar screenshots do banco de dados
  const { data: screenshotsData } = trpc.landingPageScreenshots.listActive.useQuery();

  // Screenshots padrão caso não haja no banco
  const defaultScreenshots = [
    { title: "Dashboard Principal", description: "Visão geral com métricas importantes", imageUrl: "" },
    { title: "Gestão de Alunos", description: "Controle completo de cadastros", imageUrl: "" },
    { title: "Controle Financeiro", description: "Acompanhe pagamentos em tempo real", imageUrl: "" },
  ];

  const screenshots = screenshotsData && screenshotsData.length > 0
    ? screenshotsData.map(s => ({ title: s.title, description: s.description || "", imageUrl: s.imageUrl }))
    : defaultScreenshots;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false); // Fecha o menu ao clicar
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {settings?.siteName || "SysFit Pro"}
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection("features")} className="text-gray-700 hover:text-indigo-600 transition">
                Funcionalidades
              </button>
              <button onClick={() => scrollToSection("benefits")} className="text-gray-700 hover:text-indigo-600 transition">
                Benefícios
              </button>
              <button onClick={() => scrollToSection("pricing")} className="text-gray-700 hover:text-indigo-600 transition">
                Planos
              </button>
              <Button
                onClick={() => setLocation("/pricing")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Começar Agora
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-4">
              <button
                onClick={() => scrollToSection("features")}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection("benefits")}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Planos
              </button>
              <Button
                onClick={() => {
                  setLocation("/pricing");
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Começar Agora
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {settings?.heroTitle || "Sistema Completo para Academias Modernas"}
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                {settings?.heroDescription || "Controle biométrico Control ID, integração Wellhub, PIX automático e app mobile para alunos."}
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  ✓ Control ID Integrado
                </span>
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  ✓ Wellhub/Gympass
                </span>
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  ✓ PIX Automático
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => setLocation("/pricing")}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Experimente Grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection("features")}
                >
                  Conhecer Funcionalidades
                </Button>
              </div>

              <div className="mt-8 flex items-center space-x-8">
                <div>
                  <p className="text-3xl font-bold text-indigo-600">500+</p>
                  <p className="text-sm text-gray-600">Academias Ativas</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">50k+</p>
                  <p className="text-sm text-gray-600">Alunos Gerenciados</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">98%</p>
                  <p className="text-sm text-gray-600">Satisfação</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-2">
                <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {screenshots[currentSlide].imageUrl ? (
                    <img
                      src={screenshots[currentSlide].imageUrl}
                      alt={screenshots[currentSlide].title}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        // Se a imagem falhar ao carregar, mostrar o fallback
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <Dumbbell className="w-20 h-20 text-indigo-600 mx-auto mb-4" />
                      <p className="text-gray-600">{screenshots[currentSlide].title}</p>
                      <p className="text-sm text-gray-500">{screenshots[currentSlide].description}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4 space-x-2">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition ${
                      index === currentSlide ? "bg-indigo-600 w-8" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banners Section */}
      {(settings?.banner1Image || settings?.banner2Image) && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
              {settings?.banner1Image && (
                <Card className="overflow-hidden hover:shadow-xl transition-all">
                  <CardContent className="p-0">
                    <img
                      src={settings.banner1Image}
                      alt={settings.banner1Title || "Banner Control ID"}
                      className="w-full h-auto"
                    />
                    {settings.banner1Title && (
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {settings.banner1Title}
                        </h3>
                        {settings.banner1Description && (
                          <p className="text-gray-600">{settings.banner1Description}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {settings?.banner2Image && (
                <Card className="overflow-hidden hover:shadow-xl transition-all">
                  <CardContent className="p-0">
                    <img
                      src={settings.banner2Image}
                      alt={settings.banner2Title || "Banner Wellhub"}
                      className="w-full h-auto"
                    />
                    {settings.banner2Title && (
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {settings.banner2Title}
                        </h3>
                        {settings.banner2Description && (
                          <p className="text-gray-600">{settings.banner2Description}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Completas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistema completo com controle biométrico, integração Wellhub, pagamentos automáticos e muito mais
            </p>
          </div>

          {/* Highlighted Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {features.filter(f => f.highlight).map((feature, index) => {
              const Icon = feature.icon;
              const colors = {
                blue: "from-blue-500 to-blue-600",
                purple: "from-purple-500 to-purple-600",
                green: "from-green-500 to-green-600",
              };
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[feature.color as keyof typeof colors]} opacity-10 rounded-full -mr-16 -mt-16`} />
                  <CardContent className="p-6 relative">
                    <div className={`w-14 h-14 bg-gradient-to-br ${colors[feature.color as keyof typeof colors]} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {feature.title}
                      </h3>
                      <span className="px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold rounded-full">
                        DESTAQUE
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Regular Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.filter(f => !f.highlight).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="border-l-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  style={{ borderLeftColor: `rgb(var(--${feature.color}-600))` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 bg-${feature.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 text-${feature.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Vantagens do {settings?.siteName || "SysFit Pro"}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Transforme a gestão da sua academia com tecnologia de ponta e aumente seus
                resultados.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-gray-700 text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <Shield className="w-10 h-10 text-indigo-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Segurança</h4>
                  <p className="text-sm text-gray-600">
                    Dados protegidos e backup automático
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <Clock className="w-10 h-10 text-purple-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Economia de Tempo</h4>
                  <p className="text-sm text-gray-600">
                    Automatize tarefas repetitivas
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <TrendingUp className="w-10 h-10 text-green-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Crescimento</h4>
                  <p className="text-sm text-gray-600">
                    Insights para expandir seu negócio
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <Smartphone className="w-10 h-10 text-orange-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">App Mobile</h4>
                  <p className="text-sm text-gray-600">
                    Acesse de qualquer lugar
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planos e Preços
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Escolha o plano ideal para sua academia.{" "}
              {superAdminSettings?.trialEnabled
                ? `Todos os planos incluem ${superAdminSettings.trialDays} dias grátis.`
                : "Comece agora mesmo!"
              }
            </p>
          </div>

          {plansLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : saasPlans && saasPlans.length > 0 ? (
            <div
              className={`grid gap-8 max-w-7xl mx-auto ${
                saasPlans.length === 1 ? 'md:grid-cols-1 max-w-md' :
                saasPlans.length === 2 ? 'md:grid-cols-2' :
                'md:grid-cols-3'
              }`}
            >
              {saasPlans
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((plan) => {
                  const features = plan.features ? JSON.parse(plan.features) : [];
                  const priceInReais = (plan.priceInCents / 100).toFixed(2);

                  return (
                    <Card
                      key={plan.id}
                      className={`${
                        plan.featured
                          ? 'border-2 border-indigo-500 hover:shadow-2xl relative'
                          : 'border-2 border-gray-200 hover:shadow-xl'
                      } transition-all`}
                    >
                      {plan.featured && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            MAIS POPULAR
                          </span>
                        </div>
                      )}
                      <CardContent className="p-8">
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                          {plan.description && (
                            <p className="text-gray-600 mb-4">{plan.description}</p>
                          )}
                          <div className="mb-4">
                            <span className={`text-4xl font-bold ${
                              plan.featured ? 'text-indigo-600' : 'text-gray-900'
                            }`}>
                              R$ {priceInReais.replace('.', ',')}
                            </span>
                            <span className="text-gray-600">/mês</span>
                          </div>
                        </div>
                        <ul className="space-y-3 mb-8">
                          {features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                          {plan.hasControlId && (
                            <li className="flex items-start">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">Control ID - Reconhecimento facial</span>
                            </li>
                          )}
                          {plan.hasWellhub && (
                            <li className="flex items-start">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">Integração Wellhub (Gympass)</span>
                            </li>
                          )}
                          {plan.hasWhatsappIntegration && (
                            <li className="flex items-start">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">Integração WhatsApp</span>
                            </li>
                          )}
                          {plan.hasAdvancedReports && (
                            <li className="flex items-start">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">Relatórios Avançados</span>
                            </li>
                          )}
                          {plan.hasPrioritySupport && (
                            <li className="flex items-start">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">Suporte Prioritário</span>
                            </li>
                          )}
                        </ul>
                        <Button
                          className={`w-full ${
                            plan.featured
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          onClick={() => setLocation(`/pricing`)}
                        >
                          Começar Grátis
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

          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/pricing")}
            >
              Ver comparação completa dos planos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para transformar sua academia?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Comece hoje mesmo e veja os resultados em poucos dias
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation("/pricing")}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              Cadastre-se no {settings?.siteName || "SysFit Pro"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10"
              onClick={() => window.open(`https://wa.me/${settings?.whatsappNumber || "5511999999999"}`, "_blank")}
            >
              Falar com Vendas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Dumbbell className="w-6 h-6 text-indigo-400" />
                <span className="text-xl font-bold text-white">{settings?.siteName || "SysFit Pro"}</span>
              </div>
              <p className="text-sm text-gray-400">
                Sistema completo de gestão para academias modernas
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Funcionalidades</h4>
              <ul className="space-y-2 text-sm">
                <li>Gestão de Alunos</li>
                <li>Controle Financeiro</li>
                <li>Treinos Personalizados</li>
                <li>App Mobile</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>Sobre Nós</li>
                <li>Planos</li>
                <li>Blog</li>
                <li>Suporte</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Contato</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{settings?.contactEmail || "contato@sysfit.com.br"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{settings?.contactPhone || "(11) 99999-9999"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 {settings?.siteName || "SysFit Pro"}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      {settings?.whatsappNumber && (
        <a
          href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
          aria-label="Fale conosco no WhatsApp"
        >
          <MessageCircle className="w-8 h-8" />
        </a>
      )}
    </div>
  );
}
