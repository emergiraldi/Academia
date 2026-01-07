import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Lock,
  Calendar,
  DollarSign,
  User,
  FileCheck,
  CreditCard,
  Save,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useGym } from "@/_core/hooks/useGym";

export default function AdminSettings() {
  const { gymSlug } = useGym();

  // Query settings
  const { data: settings, refetch } = trpc.gymSettings.get.useQuery({ gymSlug }, { enabled: !!gymSlug });

  // Mutation
  const updateSettings = trpc.gymSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
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
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
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
      });
    }
  }, [settings]);

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
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
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

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
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
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
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
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
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
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
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

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
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

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
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
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-0.5">
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
                  <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
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

                  <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
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
