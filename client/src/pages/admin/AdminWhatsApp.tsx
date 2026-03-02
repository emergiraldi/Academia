import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Play,
  Power,
  PowerOff,
  Plus,
  Edit,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ScrollText,
  Layers,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useGym } from "@/_core/hooks/useGym";

type TabKey = "status" | "stages" | "logs";

interface StageForm {
  name: string;
  triggerType: "before" | "on" | "after";
  daysOffset: number;
  message: string;
  enabled: boolean;
  displayOrder: number;
}

const EMPTY_STAGE_FORM: StageForm = {
  name: "",
  triggerType: "before",
  daysOffset: 3,
  message: "",
  enabled: true,
  displayOrder: 0,
};

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  before: "Antes do vencimento",
  on: "No dia do vencimento",
  after: "Apos o vencimento",
};

export default function AdminWhatsApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("status");
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [stageForm, setStageForm] = useState<StageForm>(EMPTY_STAGE_FORM);
  const [stageFilter, setStageFilter] = useState<string>("");
  const [wahaForm, setWahaForm] = useState({ wahaUrl: "", wahaApiKey: "" });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Ola! Esta e uma mensagem de teste do sistema de cobranca.");

  const { gymSlug } = useGym();

  // ---- Queries ----
  const { data: wahaConfig, refetch: refetchConfig } =
    trpc.whatsappBilling.getConfig.useQuery(
      { gymSlug: gymSlug || "" },
      {
        enabled: !!gymSlug,
        retry: false,
        onSuccess: (data: any) => {
          setWahaForm({
            wahaUrl: data?.wahaUrl || "",
            wahaApiKey: data?.wahaApiKey || "",
          });
        },
      }
    );

  const { data: wahaStatus, refetch: refetchStatus } =
    trpc.whatsappBilling.getStatus.useQuery(
      { gymSlug: gymSlug || "" },
      {
        enabled: !!gymSlug && !!wahaConfig?.wahaUrl,
        retry: false,
        refetchInterval: 15000, // Auto-refresh every 15s
      }
    );

  const { data: stages = [], refetch: refetchStages } =
    trpc.whatsappBilling.listStages.useQuery(
      { gymSlug: gymSlug || "" },
      {
        enabled: !!gymSlug,
        retry: false,
        onError: (error: any) => {
          console.error("Erro ao carregar etapas:", error.message);
        },
      }
    );

  const { data: logs = [], refetch: refetchLogs } =
    trpc.whatsappBilling.getLogs.useQuery(
      {
        gymSlug: gymSlug || "",
        stage: stageFilter || undefined,
        limit: 50,
      },
      {
        enabled: !!gymSlug,
        retry: false,
        onError: (error: any) => {
          console.error("Erro ao carregar logs:", error.message);
        },
      }
    );

  // ---- Mutations ----
  const runBilling = trpc.whatsappBilling.runBilling.useMutation({
    onSuccess: (data: any) => {
      const totalSent = Array.isArray(data)
        ? data.reduce((sum: number, r: any) => sum + (r.sent || 0), 0)
        : 0;
      const totalFailed = Array.isArray(data)
        ? data.reduce((sum: number, r: any) => sum + (r.failed || 0), 0)
        : 0;
      toast.success(
        `Cobranca executada! ${totalSent} enviada(s), ${totalFailed} falha(s).`
      );
      refetchLogs();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao executar cobranca");
    },
  });

  const startSession = trpc.whatsappBilling.startSession.useMutation({
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success("Sessao iniciada! Aguarde o QR Code...");
        setTimeout(() => refetchStatus(), 2000);
      } else {
        toast.error(data?.error || "Erro ao iniciar sessao");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao iniciar sessao");
    },
  });

  const getQr = trpc.whatsappBilling.getQr.useMutation({
    onSuccess: (data: any) => {
      if (data?.success && data?.qr) {
        setQrCode(data.qr);
      } else {
        toast.error(data?.error || "QR Code nao disponivel");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao obter QR Code");
    },
  });

  const sendTest = trpc.whatsappBilling.sendTest.useMutation({
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success("Mensagem de teste enviada com sucesso!");
      } else {
        toast.error(data?.error || "Falha ao enviar mensagem de teste");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem de teste");
    },
  });

  const updateConfig = trpc.whatsappBilling.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuracao WAHA salva com sucesso!");
      refetchConfig();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar configuracao");
    },
  });

  const logoutSession = trpc.whatsappBilling.logoutSession.useMutation({
    onSuccess: () => {
      toast.success("Sessao WhatsApp desconectada!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desconectar sessao");
    },
  });

  const createStage = trpc.whatsappBilling.createStage.useMutation({
    onSuccess: () => {
      toast.success("Etapa criada com sucesso!");
      setStageDialogOpen(false);
      resetStageForm();
      refetchStages();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar etapa");
    },
  });

  const updateStage = trpc.whatsappBilling.updateStage.useMutation({
    onSuccess: () => {
      toast.success("Etapa atualizada com sucesso!");
      setStageDialogOpen(false);
      resetStageForm();
      refetchStages();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar etapa");
    },
  });

  const deleteStage = trpc.whatsappBilling.deleteStage.useMutation({
    onSuccess: () => {
      toast.success("Etapa excluida!");
      refetchStages();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir etapa");
    },
  });

  // ---- Helpers ----
  const resetStageForm = () => {
    setStageForm(EMPTY_STAGE_FORM);
    setEditingStageId(null);
  };

  const openCreateDialog = () => {
    resetStageForm();
    setStageDialogOpen(true);
  };

  const openEditDialog = (stage: any) => {
    setEditingStageId(stage.id);
    setStageForm({
      name: stage.name,
      triggerType: stage.triggerType,
      daysOffset: stage.daysOffset,
      message: stage.message,
      enabled: stage.enabled,
      displayOrder: stage.displayOrder,
    });
    setStageDialogOpen(true);
  };

  const handleSaveStage = () => {
    if (!stageForm.name || !stageForm.message) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    if (editingStageId) {
      updateStage.mutate({
        gymSlug: gymSlug || "",
        stageId: editingStageId,
        name: stageForm.name,
        triggerType: stageForm.triggerType,
        daysOffset: stageForm.daysOffset,
        message: stageForm.message,
        enabled: stageForm.enabled,
        displayOrder: stageForm.displayOrder,
      });
    } else {
      createStage.mutate({
        gymSlug: gymSlug || "",
        name: stageForm.name,
        triggerType: stageForm.triggerType,
        daysOffset: stageForm.daysOffset,
        message: stageForm.message,
        enabled: stageForm.enabled,
        displayOrder: stageForm.displayOrder,
      });
    }
  };

  const handleDeleteStage = (stageId: number) => {
    if (confirm("Tem certeza que deseja excluir esta etapa?")) {
      deleteStage.mutate({ gymSlug: gymSlug || "", stageId });
    }
  };

  const handleToggleStageEnabled = (stage: any) => {
    updateStage.mutate({
      gymSlug: gymSlug || "",
      stageId: stage.id,
      enabled: !stage.enabled,
    });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "status", label: "Status WhatsApp", icon: <Wifi className="h-4 w-4 mr-2" /> },
    { key: "stages", label: "Etapas de Cobranca", icon: <Layers className="h-4 w-4 mr-2" /> },
    { key: "logs", label: "Logs de Envio", icon: <ScrollText className="h-4 w-4 mr-2" /> },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="WhatsApp - Cobranca"
          description="Gerencie a cobranca automatica via WhatsApp e configure etapas personalizadas"
        />

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center"
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>

        {/* ============ TAB 1: STATUS ============ */}
        {activeTab === "status" && (
          <div className="space-y-6">
            {/* WAHA Configuration Card */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Power className="h-5 w-5" />
                  Configuracao do Servidor WAHA
                </CardTitle>
                <CardDescription>
                  Configure a URL e chave de API do servidor WAHA para integrar com o WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wahaUrl">URL do Servidor WAHA</Label>
                    <Input
                      id="wahaUrl"
                      placeholder="http://localhost:3001"
                      value={wahaForm.wahaUrl}
                      onChange={(e) => setWahaForm({ ...wahaForm, wahaUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: http://seu-servidor:3001
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wahaApiKey">Chave de API (API Key)</Label>
                    <Input
                      id="wahaApiKey"
                      type="password"
                      placeholder="sua-chave-api"
                      value={wahaForm.wahaApiKey}
                      onChange={(e) => setWahaForm({ ...wahaForm, wahaApiKey: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Chave configurada no servidor WAHA (WAHA_API_KEY)
                    </p>
                  </div>
                </div>

                {wahaConfig?.wahaUrl ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Configurado: {wahaConfig.wahaUrl}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700 font-medium">WAHA nao configurado. Preencha os campos acima.</span>
                  </div>
                )}

                <Button
                  onClick={() => {
                    if (!wahaForm.wahaUrl || !wahaForm.wahaApiKey) {
                      toast.error("Preencha a URL e a Chave de API");
                      return;
                    }
                    updateConfig.mutate({
                      gymSlug: gymSlug || "",
                      wahaUrl: wahaForm.wahaUrl,
                      wahaApiKey: wahaForm.wahaApiKey,
                    });
                  }}
                  disabled={updateConfig.isPending}
                >
                  {updateConfig.isPending ? "Salvando..." : "Salvar Configuracao"}
                </Button>
              </CardContent>
            </Card>

            {/* Connection Status Card */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Status da Conexao
                </CardTitle>
                <CardDescription>
                  Status em tempo real da sessao WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!wahaConfig?.wahaUrl ? (
                  <div className="flex items-center gap-3 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm text-yellow-700 font-medium">Configure o servidor WAHA acima para verificar o status.</span>
                  </div>
                ) : (
                  <>
                    <div className={`flex items-center gap-3 p-4 border rounded-lg ${
                      wahaStatus?.status === "WORKING"
                        ? "bg-green-50 border-green-200"
                        : wahaStatus?.status === "SCAN_QR_CODE"
                        ? "bg-orange-50 border-orange-200"
                        : wahaStatus?.status === "not_configured"
                        ? "bg-yellow-50 border-yellow-200"
                        : wahaStatus?.status === "error"
                        ? "bg-red-50 border-red-200"
                        : "bg-muted/50"
                    }`}>
                      {wahaStatus?.status === "WORKING" ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : wahaStatus?.status === "SCAN_QR_CODE" ? (
                        <Clock className="h-6 w-6 text-orange-600" />
                      ) : wahaStatus?.status === "error" ? (
                        <XCircle className="h-6 w-6 text-red-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">
                          {wahaStatus?.status === "WORKING" && "Conectado"}
                          {wahaStatus?.status === "SCAN_QR_CODE" && "Aguardando QR Code"}
                          {wahaStatus?.status === "STOPPED" && "Sessao Parada"}
                          {wahaStatus?.status === "STARTING" && "Iniciando..."}
                          {wahaStatus?.status === "not_configured" && "Nao Configurado"}
                          {wahaStatus?.status === "error" && "Erro de Conexao"}
                          {!wahaStatus && "Verificando..."}
                          {wahaStatus?.status && !["WORKING", "SCAN_QR_CODE", "STOPPED", "STARTING", "not_configured", "error"].includes(wahaStatus.status) && `Status: ${wahaStatus.status}`}
                        </p>
                        {wahaStatus?.error && (
                          <p className="text-xs text-red-600 mt-1">{wahaStatus.error}</p>
                        )}
                        {wahaStatus?.status === "WORKING" && (
                          <p className="text-xs text-green-600 mt-1">WhatsApp pronto para enviar mensagens</p>
                        )}
                        {wahaStatus?.status === "SCAN_QR_CODE" && (
                          <p className="text-xs text-orange-600 mt-1">Escaneie o QR Code no painel WAHA para conectar</p>
                        )}
                      </div>
                    </div>

                    {/* QR Code Display */}
                    {qrCode && wahaStatus?.status !== "WORKING" && (
                      <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-white">
                        <p className="text-sm font-medium">Escaneie o QR Code com o WhatsApp:</p>
                        <div className="p-3 bg-white rounded-lg shadow-md">
                          <img
                            src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                            alt="QR Code WhatsApp"
                            className="w-64 h-64"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Abra o WhatsApp &gt; Menu &gt; Aparelhos conectados &gt; Conectar aparelho
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {wahaStatus?.status !== "WORKING" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            startSession.mutate({ gymSlug: gymSlug || "" });
                            setTimeout(() => {
                              getQr.mutate({ gymSlug: gymSlug || "" });
                            }, 2000);
                          }}
                          disabled={startSession.isPending || getQr.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {startSession.isPending ? "Iniciando..." : "Conectar WhatsApp"}
                        </Button>
                      )}
                      {wahaStatus?.status !== "WORKING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => getQr.mutate({ gymSlug: gymSlug || "" })}
                          disabled={getQr.isPending}
                        >
                          {getQr.isPending ? "Gerando..." : "Gerar QR Code"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          refetchStatus();
                          setQrCode(null);
                        }}
                      >
                        <Wifi className="h-4 w-4 mr-2" />
                        Verificar Status
                      </Button>
                      {wahaStatus?.status === "WORKING" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            logoutSession.mutate({ gymSlug: gymSlug || "" });
                            setQrCode(null);
                            setTimeout(() => refetchStatus(), 2000);
                          }}
                          disabled={logoutSession.isPending}
                        >
                          <PowerOff className="h-4 w-4 mr-2" />
                          {logoutSession.isPending ? "Desconectando..." : "Desconectar Sessao"}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Test Message Card */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Teste de Mensagem
                </CardTitle>
                <CardDescription>
                  Envie uma mensagem de teste para verificar se o WhatsApp esta funcionando
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testPhone">Telefone (com DDD)</Label>
                    <Input
                      id="testPhone"
                      placeholder="5562999999999"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ""))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato: 55 + DDD + numero (ex: 5562999887766)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testMessage">Mensagem</Label>
                    <Textarea
                      id="testMessage"
                      placeholder="Digite a mensagem de teste..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!testPhone || testPhone.length < 10) {
                      toast.error("Digite um telefone valido com DDD");
                      return;
                    }
                    sendTest.mutate({
                      gymSlug: gymSlug || "",
                      phone: testPhone,
                      message: testMessage,
                    });
                  }}
                  disabled={sendTest.isPending || !testPhone}
                  variant="outline"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendTest.isPending ? "Enviando..." : "Enviar Mensagem de Teste"}
                </Button>
              </CardContent>
            </Card>

            {/* Manual Billing Card */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Cobranca Manual
                </CardTitle>
                <CardDescription>
                  Execute o processo de cobranca manualmente para enviar mensagens pendentes agora
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium">Como funciona a cobranca</p>
                    <ul className="mt-2 space-y-1 text-blue-700 list-disc list-inside">
                      <li>Verifica todas as mensalidades pendentes dos alunos</li>
                      <li>Aplica as etapas de cobranca configuradas (lembrete, vencimento, atraso)</li>
                      <li>Envia mensagens via WhatsApp para os alunos correspondentes</li>
                      <li>Na execucao manual, reenvia mesmo que ja tenha sido enviada antes</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={() => runBilling.mutate({ gymSlug: gymSlug || "" })}
                  disabled={runBilling.isPending}
                  className="w-full sm:w-auto"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {runBilling.isPending ? "Executando cobranca..." : "Executar Cobranca Manual"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============ TAB 2: ETAPAS DE COBRANCA ============ */}
        {activeTab === "stages" && (
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Etapas de Cobranca</CardTitle>
                  <CardDescription>
                    Configure etapas personalizadas de cobranca via WhatsApp. {stages.length} etapa(s) cadastrada(s).
                  </CardDescription>
                </div>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Etapa
                </Button>
              </CardHeader>
              <CardContent>
                {stages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhuma etapa personalizada cadastrada.</p>
                    <p className="text-sm mt-1">
                      O sistema utiliza as etapas padrao (lembrete 3 dias antes, no vencimento, apos vencimento).
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ordem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo de Disparo</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Ativada</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stages.map((stage: any) => (
                        <TableRow key={stage.id}>
                          <TableCell className="font-medium">{stage.displayOrder}</TableCell>
                          <TableCell className="font-medium">{stage.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                stage.triggerType === "before"
                                  ? "bg-blue-50 text-blue-700"
                                  : stage.triggerType === "on"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-red-50 text-red-700"
                              }
                            >
                              {TRIGGER_TYPE_LABELS[stage.triggerType]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {stage.triggerType === "on" ? "-" : `${stage.daysOffset} dia(s)`}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="line-clamp-2 text-sm text-muted-foreground">
                              {stage.message}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={stage.enabled}
                              onCheckedChange={() => handleToggleStageEnabled(stage)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(stage)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStage(stage.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Stage Create/Edit Dialog */}
            <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingStageId ? "Editar Etapa" : "Nova Etapa de Cobranca"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure quando e qual mensagem sera enviada ao aluno
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Etapa *</Label>
                      <Input
                        value={stageForm.name}
                        onChange={(e) =>
                          setStageForm({ ...stageForm, name: e.target.value })
                        }
                        placeholder="Ex: Lembrete 5 dias antes"
                      />
                    </div>
                    <div>
                      <Label>Ordem de Exibicao</Label>
                      <Input
                        type="number"
                        value={stageForm.displayOrder}
                        onChange={(e) =>
                          setStageForm({
                            ...stageForm,
                            displayOrder: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Disparo *</Label>
                      <Select
                        value={stageForm.triggerType}
                        onValueChange={(value: "before" | "on" | "after") =>
                          setStageForm({ ...stageForm, triggerType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">Antes do vencimento</SelectItem>
                          <SelectItem value="on">No dia do vencimento</SelectItem>
                          <SelectItem value="after">Apos o vencimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {stageForm.triggerType !== "on" && (
                      <div>
                        <Label>Dias de Offset *</Label>
                        <Input
                          type="number"
                          min={0}
                          value={stageForm.daysOffset}
                          onChange={(e) =>
                            setStageForm({
                              ...stageForm,
                              daysOffset: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {stageForm.triggerType === "before"
                            ? "Quantos dias antes do vencimento"
                            : "Quantos dias apos o vencimento"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Mensagem (template) *</Label>
                    <Textarea
                      value={stageForm.message}
                      onChange={(e) =>
                        setStageForm({ ...stageForm, message: e.target.value })
                      }
                      rows={5}
                      placeholder="Ola {nome}! Sua mensalidade no valor de R$ {valor} vence em {vencimento}."
                    />
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-xs font-medium mb-1">Placeholders disponiveis:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: "{nome}", desc: "Nome do aluno" },
                          { key: "{vencimento}", desc: "Data de vencimento" },
                          { key: "{valor}", desc: "Valor da mensalidade" },
                          { key: "{academia}", desc: "Nome da academia" },
                          { key: "{dias_atraso}", desc: "Dias em atraso" },
                        ].map((ph) => (
                          <Badge key={ph.key} variant="secondary" className="text-xs">
                            <code>{ph.key}</code>
                            <span className="ml-1 text-muted-foreground">- {ph.desc}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={stageForm.enabled}
                      onCheckedChange={(checked) =>
                        setStageForm({ ...stageForm, enabled: checked })
                      }
                    />
                    <Label>Etapa ativada</Label>
                  </div>

                  <Button
                    onClick={handleSaveStage}
                    disabled={createStage.isPending || updateStage.isPending}
                    className="w-full"
                  >
                    {createStage.isPending || updateStage.isPending
                      ? "Salvando..."
                      : editingStageId
                      ? "Atualizar Etapa"
                      : "Criar Etapa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ============ TAB 3: LOGS DE ENVIO ============ */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Logs de Envio</CardTitle>
                <CardDescription>
                  Historico de mensagens de cobranca enviadas via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filter */}
                <div className="flex items-center gap-4">
                  <Label>Filtrar por etapa:</Label>
                  <Input
                    className="w-[250px]"
                    placeholder="Ex: reminder, due_date, overdue, custom_1"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                  />
                  {stageFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStageFilter("")}
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                {/* Logs Table */}
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ScrollText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum log de envio encontrado.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Envio</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Etapa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(log.sentAt || log.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.studentId}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.stage}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.status === "sent" ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Enviado
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Falhou
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[250px]">
                            <span className="line-clamp-2 text-sm text-muted-foreground">
                              {log.message}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {log.errorMessage ? (
                              <span className="text-sm text-destructive line-clamp-2">
                                {log.errorMessage}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
