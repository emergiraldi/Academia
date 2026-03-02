import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Lock,
  Calendar,
  DollarSign,
  User,
  FileCheck,
  CreditCard,
  Save,
  Mail,
  Image,
  Upload,
  X,
  Info,
  Copy,
  CheckCircle2,
  Key,
  CalendarX2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useGym } from "@/_core/hooks/useGym";

export default function AdminSettings() {
  const { gymSlug } = useGym();

  // Query settings
  const { data: settings, refetch } = trpc.gymSettings.get.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const utils = trpc.useUtils();

  // Mutation
  const updateSettings = trpc.gymSettings.update.useMutation({
    onSuccess: async () => {
      toast.success("Configurações salvas com sucesso!");
      // Invalidate cache to ensure fresh data on next load
      await utils.gymSettings.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    },
  });

  const updateTurnstileTypeMutation = trpc.gyms.updateTurnstileType.useMutation({
    onSuccess: async () => {
      toast.success("Tipo de catraca atualizado com sucesso!");
      await utils.gymSettings.get.invalidate();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar tipo de catraca: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    daysToBlockAfterDue: 7,
    blockOnExpiredExam: true,
    examValidityDays: 90,
    minimumAge: 16,
    daysToStartInterest: 1,
    interestRatePerMonth: 2.00,
    lateFeePercentage: 2.00,
    allowInstallments: true,
    maxInstallments: 6,
    minimumInstallmentValue: 5000, // em centavos (R$ 50,00)
    // Configurações SMTP
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: 'Academia',
    smtpUseTls: true,
    smtpUseSsl: false,
    // Regras de Agendamento
    allowStudentCancelBooking: true,
    minHoursToCancel: 0,
    // Logo da Academia
    logoUrl: '',
  });

  // Track if initial data was loaded
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Track if AGENT_ID was copied
  const [copiedAgentId, setCopiedAgentId] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update form when settings are loaded (only on initial load)
  useEffect(() => {
    if (settings && isInitialLoad) {
      setFormData({
        daysToBlockAfterDue: settings.daysToBlockAfterDue,
        blockOnExpiredExam: settings.blockOnExpiredExam === 1,
        examValidityDays: settings.examValidityDays,
        minimumAge: settings.minimumAge,
        daysToStartInterest: settings.daysToStartInterest,
        interestRatePerMonth: parseFloat(settings.interestRatePerMonth),
        lateFeePercentage: parseFloat(settings.lateFeePercentage),
        allowInstallments: settings.allowInstallments === 1,
        maxInstallments: settings.maxInstallments,
        minimumInstallmentValue: settings.minimumInstallmentValue,
        // Configurações SMTP
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || '',
        smtpPassword: settings.smtpPassword || '',
        smtpFromEmail: settings.smtpFromEmail || '',
        smtpFromName: settings.smtpFromName || 'Academia',
        smtpUseTls: settings.smtpUseTls === 1,
        smtpUseSsl: settings.smtpUseSsl === 1,
        // Regras de Agendamento
        allowStudentCancelBooking: settings.allowStudentCancelBooking === 1 || settings.allowStudentCancelBooking === true,
        minHoursToCancel: settings.minHoursToCancel || 0,
        // Logo da Academia
        logoUrl: settings.logoUrl || '',
      });
      setIsInitialLoad(false);
    }
  }, [settings, isInitialLoad]);

  // Upload de logo da academia
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande! Máximo 2MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido! Envie uma imagem');
      return;
    }

    try {
      // Converter para base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData({ ...formData, logoUrl: base64 });
        toast.success('Logo carregado! Clique em "Salvar" para aplicar');
      };
      reader.onerror = () => {
        toast.error('Erro ao ler a imagem');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Erro ao processar imagem');
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoUrl: '' });
    toast.success('Logo removido! Clique em "Salvar" para aplicar');
  };

  const handleCopyAgentId = async () => {
    if (!settings?.gymId) return;

    const agentId = `AGENT_ID=academia-${settings.gymId}`;
    try {
      await navigator.clipboard.writeText(agentId);
      setCopiedAgentId(true);
      toast.success('AGENT_ID copiado para a área de transferência!');
      setTimeout(() => setCopiedAgentId(false), 3000);
    } catch (error) {
      toast.error('Erro ao copiar. Copie manualmente: ' + agentId);
    }
  };

  // Change password mutation
  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      toast.error(`Erro ao alterar senha: ${error.message}`);
    },
  });

  const handleChangePassword = async () => {
    // Validação
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        gymSlug,
        ...formData,
      });
    } catch (error) {
      // Error already handled in mutation
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Parâmetros do Sistema"
          description="Configure regras e comportamentos da academia"
          action={
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          }
        />

        {/* Parâmetros Gerais do Sistema */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>Parâmetros Gerais do Sistema</CardTitle>
            </div>
            <CardDescription>
              Informações da academia e configurações básicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações da Academia */}
            {settings?.gymId && (
              <div className="space-y-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Informações da Academia
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dados importantes para configuração de integrações
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">ID da Academia</Label>
                    <p className="text-2xl font-bold text-primary">{settings.gymId}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nome</Label>
                    <p className="text-lg font-semibold">{settings.gymName}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold">
                      🔧 Configuração do Control ID Agent
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use este AGENT_ID ao configurar o agent da catraca Control ID:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-background rounded-lg border-2 border-dashed border-primary/30">
                    <code className="flex-1 text-base font-mono font-semibold text-primary">
                      AGENT_ID=academia-{settings.gymId}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAgentId}
                      className="shrink-0"
                    >
                      {copiedAgentId ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>⚠️ Importante:</strong> Cada academia precisa do seu próprio AGENT_ID único.
                      Copie este código e cole no arquivo <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">.env</code> do agent instalado na sua academia.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sistema de Catraca */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Sistema de Catraca</CardTitle>
            <CardDescription>
              Escolha qual sistema de controle de acesso sua academia utiliza
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="turnstileType">Tipo de Sistema</Label>
              <Select
                value={settings?.turnstileType || "control_id"}
                onValueChange={(value: "control_id" | "toletus_hub") => {
                  updateTurnstileTypeMutation.mutate({
                    gymId: settings?.gymId || 0,
                    turnstileType: value,
                  });
                }}
              >
                <SelectTrigger id="turnstileType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="control_id">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Control ID</span>
                      <span className="text-xs text-muted-foreground">
                        Catracas com reconhecimento facial automático
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="toletus_hub">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Toletus HUB</span>
                      <span className="text-xs text-muted-foreground">
                        Catracas LiteNet via middleware Toletus HUB
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {settings?.turnstileType === "toletus_hub" ? (
                  <>
                    <strong>Toletus HUB:</strong> Liberação manual ou via cartão. Configure os dispositivos na página{" "}
                    <a href={`/${gymSlug}/admin/toletus-devices`} className="text-primary underline">
                      Dispositivos Toletus
                    </a>
                    .
                  </>
                ) : (
                  <>
                    <strong>Control ID:</strong> Liberação automática por reconhecimento facial. Configure os dispositivos na página{" "}
                    <a href={`/${gymSlug}/admin/control-id-devices`} className="text-primary underline">
                      Dispositivos Control ID
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Bloqueio de Acesso */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Bloqueio de Acesso (Catraca)</CardTitle>
            </div>
            <CardDescription>
              Defina quando bloquear o acesso dos alunos à academia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="daysToBlock">
                  Dias após vencimento para bloquear catraca
                </Label>
                <Input
                  id="daysToBlock"
                  type="number"
                  min="1"
                  max="90"
                  value={formData.daysToBlockAfterDue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daysToBlockAfterDue: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  O aluno será bloqueado {formData.daysToBlockAfterDue} dia(s) após o
                  vencimento
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="blockExam">Bloquear com exame médico vencido</Label>
                  <Switch
                    id="blockExam"
                    checked={formData.blockOnExpiredExam}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, blockOnExpiredExam: checked })
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Bloquear catraca quando o exame médico estiver vencido
                </p>
              </div>
            </div>

            {formData.blockOnExpiredExam && (
              <div className="space-y-2">
                <Label htmlFor="examValidity">
                  Validade do exame médico (dias)
                </Label>
                <Input
                  id="examValidity"
                  type="number"
                  min="30"
                  max="365"
                  value={formData.examValidityDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      examValidityDays: parseInt(e.target.value) || 90,
                    })
                  }
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Exame médico válido por {formData.examValidityDays} dias (
                  {Math.floor(formData.examValidityDays / 30)} meses)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações de Idade */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle>Controle de Idade</CardTitle>
            </div>
            <CardDescription>
              Defina a idade mínima para frequentar a academia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="minimumAge">Idade mínima (anos)</Label>
              <Input
                id="minimumAge"
                type="number"
                min="0"
                max="100"
                value={formData.minimumAge}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumAge: parseInt(e.target.value) || 0,
                  })
                }
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Alunos devem ter no mínimo {formData.minimumAge} anos para se cadastrar
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Regras de Agendamento */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarX2 className="w-5 h-5 text-primary" />
              <CardTitle>Regras de Agendamento</CardTitle>
            </div>
            <CardDescription>
              Configure se alunos podem cancelar agendamentos e com qual antecedência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Permitir aluno cancelar agendamento</Label>
                <p className="text-sm text-muted-foreground">
                  Se desativado, alunos não poderão cancelar seus agendamentos
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{formData.allowStudentCancelBooking ? "Sim" : "Não"}</span>
                <input
                  type="checkbox"
                  checked={formData.allowStudentCancelBooking}
                  onChange={(e) => setFormData({ ...formData, allowStudentCancelBooking: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>
            </div>

            {formData.allowStudentCancelBooking && (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="minHoursToCancel">Antecedência mínima para cancelamento (horas)</Label>
                <Input
                  id="minHoursToCancel"
                  type="number"
                  min="0"
                  max="72"
                  value={formData.minHoursToCancel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minHoursToCancel: parseInt(e.target.value) || 0,
                    })
                  }
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  {formData.minHoursToCancel === 0
                    ? "Aluno pode cancelar a qualquer momento"
                    : `Aluno pode cancelar até ${formData.minHoursToCancel}h antes do horário da aula`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações de Juros e Multa */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle>Juros e Multa por Atraso</CardTitle>
            </div>
            <CardDescription>
              Configure valores de juros e multa para pagamentos atrasados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="daysToInterest">
                  Dias para começar a cobrar juros
                </Label>
                <Input
                  id="daysToInterest"
                  type="number"
                  min="0"
                  max="90"
                  value={formData.daysToStartInterest}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daysToStartInterest: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {formData.daysToStartInterest === 0
                    ? "Juros aplicados imediatamente"
                    : `Juros após ${formData.daysToStartInterest} dia(s)`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Taxa de juros ao mês (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRatePerMonth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interestRatePerMonth: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {formData.interestRatePerMonth}% ao mês
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lateFee">Multa por atraso (%)</Label>
                <Input
                  id="lateFee"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.lateFeePercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lateFeePercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {formData.lateFeePercentage}% de multa
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                Exemplo de Cálculo
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Mensalidade de R$ 100,00 com {formData.daysToStartInterest} dia(s) de
                atraso:
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                • Multa: R$ {((100 * formData.lateFeePercentage) / 100).toFixed(2)}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                • Juros (proporcional): R${" "}
                {(
                  (100 * formData.interestRatePerMonth * formData.daysToStartInterest) /
                  30 /
                  100
                ).toFixed(2)}
              </p>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mt-2">
                Total: R${" "}
                {(
                  100 +
                  (100 * formData.lateFeePercentage) / 100 +
                  (100 * formData.interestRatePerMonth * formData.daysToStartInterest) /
                    30 /
                    100
                ).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Parcelamento */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle>Parcelamento de Débitos</CardTitle>
            </div>
            <CardDescription>
              Configure opções de parcelamento para mensalidades atrasadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowInstallments">Permitir parcelamento</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar parcelamento de débitos em atraso
                </p>
              </div>
              <Switch
                id="allowInstallments"
                checked={formData.allowInstallments}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allowInstallments: checked })
                }
              />
            </div>

            {formData.allowInstallments && (
              <>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxInstallments">Máximo de parcelas</Label>
                    <Input
                      id="maxInstallments"
                      type="number"
                      min="1"
                      max="24"
                      value={formData.maxInstallments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxInstallments: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Permitir até {formData.maxInstallments}x
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minInstallment">Valor mínimo da parcela (R$)</Label>
                    <Input
                      id="minInstallment"
                      type="number"
                      step="0.01"
                      min="10"
                      value={(formData.minimumInstallmentValue / 100).toFixed(2)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimumInstallmentValue: Math.round(
                            parseFloat(e.target.value || "0") * 100
                          ),
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Parcela mínima: R${" "}
                      {(formData.minimumInstallmentValue / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Configurações de Email (SMTP) */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <CardTitle>Configurações de Email (SMTP)</CardTitle>
            </div>
            <CardDescription>
              Configure o servidor SMTP para envio de emails de recuperação de senha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">Servidor SMTP *</Label>
                <Input
                  id="smtpHost"
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={formData.smtpHost}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpHost: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Endereço do servidor SMTP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPort">Porta SMTP *</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  min="1"
                  max="65535"
                  value={formData.smtpPort}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smtpPort: parseInt(e.target.value) || 587,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  587 para TLS, 465 para SSL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUser">Usuário/Email *</Label>
                <Input
                  id="smtpUser"
                  type="text"
                  placeholder="seu-email@gmail.com"
                  value={formData.smtpUser}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpUser: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Email para autenticação SMTP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">Senha SMTP *</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.smtpPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpPassword: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Senha ou senha de app do email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpFromEmail">Email Remetente</Label>
                <Input
                  id="smtpFromEmail"
                  type="email"
                  placeholder="noreply@academia.com"
                  value={formData.smtpFromEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpFromEmail: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Email que aparece como remetente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpFromName">Nome do Remetente</Label>
                <Input
                  id="smtpFromName"
                  type="text"
                  placeholder="Minha Academia"
                  value={formData.smtpFromName}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpFromName: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Nome que aparece no email
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smtpUseTls">Usar TLS (STARTTLS)</Label>
                  <p className="text-sm text-muted-foreground">
                    Recomendado para porta 587
                  </p>
                </div>
                <Switch
                  id="smtpUseTls"
                  checked={formData.smtpUseTls}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, smtpUseTls: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smtpUseSsl">Usar SSL</Label>
                  <p className="text-sm text-muted-foreground">
                    Recomendado para porta 465
                  </p>
                </div>
                <Switch
                  id="smtpUseSsl"
                  checked={formData.smtpUseSsl}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, smtpUseSsl: checked })
                  }
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-amber-900 dark:text-amber-100">
                💡 Configuração recomendada para Gmail:
              </h4>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Servidor: smtp.gmail.com</li>
                <li>• Porta: 587</li>
                <li>• TLS: Ativado</li>
                <li>• SSL: Desativado</li>
                <li>• Use uma senha de app gerada em: myaccount.google.com/apppasswords</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Logo da Academia */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              <CardTitle>Logo da Academia</CardTitle>
            </div>
            <CardDescription>
              Personalize o app com o logo da sua academia (aparece no app do aluno e professor)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Preview do logo */}
              {formData.logoUrl && (
                <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
                  <img
                    src={formData.logoUrl}
                    alt="Logo da Academia"
                    className="w-32 h-32 object-contain rounded-lg bg-white border"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Preview do Logo</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Assim ficará no app do aluno e professor
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover Logo
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload do logo */}
              <div className="space-y-2">
                <Label htmlFor="logoUpload">
                  {formData.logoUrl ? 'Trocar Logo' : 'Fazer Upload do Logo'}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logoUpload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {formData.logoUrl ? 'Escolher Outra Imagem' : 'Escolher Imagem'}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG ou SVG • Máximo 2MB
                  </p>
                </div>
              </div>

              {/* Dica */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                  💡 Dica para melhor resultado:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Use imagens quadradas ou circulares</li>
                  <li>• Tamanho recomendado: 512x512 pixels</li>
                  <li>• Fundo transparente (PNG) fica melhor</li>
                  <li>• O logo aparecerá no header do app</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trocar Senha */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <CardTitle>Trocar Senha</CardTitle>
            </div>
            <CardDescription>
              Altere sua senha de acesso ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite a nova senha (mín. 6 caracteres)"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a nova senha novamente"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                {changePasswordMutation.isPending ? "Alterando Senha..." : "Alterar Senha"}
              </Button>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg max-w-md">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>⚠️ Importante:</strong> Após alterar a senha, você precisará fazer login novamente em todos os dispositivos.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botão de salvar no final */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {updateSettings.isPending ? "Salvando..." : "Salvar Todas as Configurações"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
