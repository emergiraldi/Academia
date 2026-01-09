import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, CheckCircle2, ArrowLeft, ArrowRight, Building2, User, CreditCard, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FormData {
  // Gym data
  gymName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;

  // Admin data
  adminName: string;
  adminEmail: string;

  // Payment
  plan: string;
  price: number;
}

export default function Signup() {
  const [location, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    gymName: "",
    contactEmail: "",
    contactPhone: "",
    city: "",
    state: "",
    adminName: "",
    adminEmail: "",
    plan: "professional",
    price: 299,
  });

  const utils = trpc.useUtils();

  // Buscar planos SaaS dinâmicos
  const { data: saasPlans } = trpc.saasPlans.listActive.useQuery();

  useEffect(() => {
    // Get plan from URL params
    const params = new URLSearchParams(window.location.search);
    const planSlug = params.get("plan") || "professional";

    // Se temos os planos carregados, buscar o preço correto
    if (saasPlans && saasPlans.length > 0) {
      const selectedPlan = saasPlans.find(p => p.slug === planSlug);
      if (selectedPlan) {
        const priceInReais = selectedPlan.priceInCents / 100;
        setFormData((prev) => ({
          ...prev,
          plan: planSlug,
          price: priceInReais
        }));
      }
    } else {
      // Fallback para preço padrão se não encontrar
      const price = parseInt(params.get("price") || "299");
      setFormData((prev) => ({ ...prev, plan: planSlug, price }));
    }
  }, [saasPlans]);

  const createGymMutation = trpc.gyms.create.useMutation({
    onSuccess: (data) => {
      toast.success("Academia cadastrada com sucesso!");
      setStep(4);
      // Aqui você poderia redirecionar para confirmação ou dashboard
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar academia");
      setIsSubmitting(false);
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.gymName || !formData.contactEmail) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
    } else if (step === 2) {
      if (!formData.adminName || !formData.adminEmail) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Generate slug automatically from gym name
    const slug = formData.gymName.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    await createGymMutation.mutateAsync({
      name: formData.gymName,
      slug,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      city: formData.city,
      state: formData.state,
      adminName: formData.adminName,
      adminEmail: formData.adminEmail,
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="gymName">Nome da Academia *</Label>
              <Input
                id="gymName"
                placeholder="Ex: Academia Fitness Pro"
                value={formData.gymName}
                onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">Email de Contato *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contato@academia.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Telefone</Label>
                <Input
                  id="contactPhone"
                  placeholder="(11) 99999-9999"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder="São Paulo"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Estes serão os dados do administrador principal da academia. Um email com as
              credenciais de acesso será enviado.
            </p>
            <div>
              <Label htmlFor="adminName">Nome Completo *</Label>
              <Input
                id="adminName"
                placeholder="João Silva"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="adminEmail">Email do Administrador *</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@academia.com"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Uma senha temporária será gerada e enviada para este email
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
              <h4 className="font-semibold text-gray-900 mb-2">Resumo do Pedido</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano:</span>
                  <span className="font-semibold capitalize">{formData.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Academia:</span>
                  <span className="font-semibold">{formData.gymName}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold">Total Mensal:</span>
                  <span className="font-bold text-indigo-600">
                    R$ {formData.price.toFixed(2).replace('.', ',')}/mês
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Teste Grátis:</strong> Você terá 14 dias de teste grátis. A cobrança
                  só será realizada após este período.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    Acesso imediato a todas as funcionalidades do plano {formData.plan}
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    Suporte técnico para configuração inicial
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    Cancelamento a qualquer momento sem multa
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Academia Cadastrada com Sucesso!
            </h3>
            <p className="text-gray-600 mb-6">
              Em breve você receberá um email com as credenciais de acesso.
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-left max-w-md mx-auto mb-6">
              <p className="text-sm text-indigo-900 font-semibold mb-2">
                Próximos passos:
              </p>
              <ol className="text-sm text-indigo-800 space-y-2 list-decimal list-inside">
                <li>Verifique seu email para as credenciais de acesso</li>
                <li>Faça login no painel administrativo</li>
                <li>Complete a configuração da sua academia</li>
                <li>Cadastre seus primeiros alunos</li>
              </ol>
            </div>
            <Button
              onClick={() => setLocation("/admin/login")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size="lg"
            >
              Ir para Login
            </Button>
          </div>
        );
    }
  };

  const stepIcons = [
    { icon: Building2, label: "Academia" },
    { icon: User, label: "Administrador" },
    { icon: CreditCard, label: "Pagamento" },
  ];

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
            {step !== 4 && (
              <Button variant="ghost" onClick={() => setLocation("/pricing")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Progress */}
          {step !== 4 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                {stepIcons.map((item, index) => {
                  const Icon = item.icon;
                  const stepNum = index + 1;
                  const isActive = stepNum === step;
                  const isCompleted = stepNum < step;

                  return (
                    <div key={index} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                            isActive
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : isCompleted
                              ? "bg-green-600 border-green-600 text-white"
                              : "bg-white border-gray-300 text-gray-400"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </div>
                        <span className={`text-xs mt-2 ${isActive ? "font-semibold text-indigo-600" : "text-gray-600"}`}>
                          {item.label}
                        </span>
                      </div>
                      {index < stepIcons.length - 1 && (
                        <div className={`flex-1 h-1 mx-4 ${stepNum < step ? "bg-green-600" : "bg-gray-300"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 1 && "Dados da Academia"}
                {step === 2 && "Dados do Administrador"}
                {step === 3 && "Confirmação e Pagamento"}
                {step === 4 && "Cadastro Concluído"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStep()}

              {step !== 4 && (
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1 || isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  {step < 3 ? (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          Finalizar Cadastro
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
