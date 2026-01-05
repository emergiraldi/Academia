import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, Plus, Edit, Trash2, MapPin, Phone, Mail, TrendingUp, Copy, CheckCircle2, Key, Shield, ShieldOff, Lock, Unlock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface GymFormData {
  id?: number;
  name: string;
  slug: string;
  cnpj?: string;
  email?: string;
  contactEmail?: string;
  contactPhone?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status?: "active" | "inactive" | "suspended";
  plan?: "basic" | "professional" | "enterprise";
  planStatus?: "trial" | "active" | "suspended" | "cancelled";
  pixKey?: string;
  pixKeyType?: "cpf" | "cnpj" | "email" | "phone" | "random";
  merchantName?: string;
  merchantCity?: string;
  wellhubApiKey?: string;
  wellhubWebhookSecret?: string;
  blockedReason?: string;
  adminEmail?: string;
  adminName?: string;
}

interface AdminCredentials {
  email: string;
  password: string;
  loginUrl: string;
}

export default function SuperAdminGyms() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<GymFormData | null>(null);
  const [formData, setFormData] = useState<GymFormData>({
    name: "",
    slug: "",
    plan: "basic",
    planStatus: "trial",
  });
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: gyms, isLoading } = trpc.gyms.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery(); // Buscar configurações para preços dinâmicos

  const createMutation = trpc.gyms.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Academia criada com sucesso!");
      utils.gyms.list.invalidate();
      handleCloseDialog();

      // Mostrar credenciais do admin criado
      if (data?.adminCredentials) {
        setCredentials(data.adminCredentials);
        setShowCredentials(true);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar academia");
    },
  });

  const updateMutation = trpc.gyms.update.useMutation({
    onSuccess: async () => {
      console.log("✅ [UPDATE SUCCESS] Começando invalidação e refetch");
      toast.success("Academia atualizada com sucesso!");
      await utils.gyms.list.invalidate();
      await utils.gyms.list.refetch();
      console.log("✅ [UPDATE SUCCESS] Invalidação e refetch concluídos");
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error("❌ [FRONTEND ERROR] Erro completo:", error);
      console.error("❌ [FRONTEND ERROR] Error message:", error?.message);
      console.error("❌ [FRONTEND ERROR] Error data:", error?.data);
      const errorMessage = error?.message || error?.toString() || "Erro ao atualizar academia";
      toast.error(errorMessage);
    },
  });

  const deleteMutation = trpc.gyms.delete.useMutation({
    onSuccess: () => {
      toast.success("Academia deletada com sucesso!");
      utils.gyms.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar academia");
    },
  });

  const activateMutation = trpc.gyms.activate.useMutation({
    onSuccess: () => {
      toast.success("Academia ativada com sucesso!");
      utils.gyms.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao ativar academia");
    },
  });

  const deactivateMutation = trpc.gyms.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Academia desativada com sucesso!");
      utils.gyms.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao desativar academia");
    },
  });

  const blockMutation = trpc.gyms.block.useMutation({
    onSuccess: () => {
      toast.success("Academia bloqueada com sucesso!");
      utils.gyms.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao bloquear academia");
    },
  });

  const unblockMutation = trpc.gyms.unblock.useMutation({
    onSuccess: () => {
      toast.success("Academia desbloqueada com sucesso!");
      utils.gyms.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao desbloquear academia");
    },
  });

  const resetPasswordMutation = trpc.gyms.resetAdminPassword.useMutation({
    onSuccess: (data: any) => {
      toast.success("Senha resetada com sucesso!");
      // Mostrar credenciais
      if (data?.credentials) {
        setCredentials(data.credentials);
        setShowCredentials(true);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao resetar senha");
    },
  });

  const handleOpenDialog = async (gym?: any) => {
    console.log("🔵 [handleOpenDialog] Gym recebido:", JSON.stringify(gym, null, 2));

    if (gym) {
      // Buscar dados atualizados diretamente do banco
      console.log("🔍 [handleOpenDialog] Buscando dados do banco para gymId:", gym.id);
      const freshGymData = await utils.gyms.getById.fetch({ gymId: gym.id });
      console.log("✅ [handleOpenDialog] Dados do banco:", JSON.stringify(freshGymData, null, 2));

      setEditingGym(freshGymData);
      // Converter valores null para string vazia, exceto para campos específicos
      const cleanedGym: GymFormData = {
        id: freshGymData.id,
        name: freshGymData.name || "",
        slug: freshGymData.slug || "",
        cnpj: freshGymData.cnpj || "",
        email: freshGymData.email || "",
        contactEmail: freshGymData.contactEmail || "",
        contactPhone: freshGymData.contactPhone || "",
        phone: freshGymData.phone || "",
        address: freshGymData.address || "",
        city: freshGymData.city || "",
        state: freshGymData.state || "",
        zipCode: freshGymData.zipCode || "",
        status: freshGymData.status || "active",
        plan: freshGymData.plan || "basic",
        planStatus: freshGymData.planStatus || "trial",
        pixKey: freshGymData.pixKey || "",
        pixKeyType: freshGymData.pixKeyType || undefined,
        merchantName: freshGymData.merchantName || "",
        merchantCity: freshGymData.merchantCity || "",
        wellhubApiKey: freshGymData.wellhubApiKey || "",
        wellhubWebhookSecret: freshGymData.wellhubWebhookSecret || "",
        blockedReason: freshGymData.blockedReason || "",
      };

      console.log("🟢 [handleOpenDialog] cleanedGym com dados do banco:", JSON.stringify(cleanedGym, null, 2));
      setFormData(cleanedGym);
      console.log("✅ [handleOpenDialog] setFormData chamado com dados frescos do banco");
    } else {
      setEditingGym(null);
      setFormData({
        name: "",
        slug: "",
        plan: "basic",
        planStatus: "trial",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGym(null);
    setFormData({
      name: "",
      slug: "",
      plan: "basic",
      planStatus: "trial",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("📝 [FRONTEND] handleSubmit iniciado");
    console.log("📝 [FRONTEND] editingGym:", editingGym);
    console.log("📝 [FRONTEND] formData atual:", JSON.stringify(formData, null, 2));

    // Validação de campos obrigatórios
    if (!formData.name || !formData.slug) {
      toast.error("Nome e Slug são obrigatórios!");
      return;
    }

    if (!editingGym && !formData.email && !formData.contactEmail) {
      toast.error("É necessário informar pelo menos um email!");
      return;
    }

    if (editingGym) {
      // Apenas enviar campos que realmente têm valor (não vazios e não null)
      const updateData: any = {
        gymId: editingGym.id!,
      };

      // Helper function para adicionar apenas valores válidos
      const addIfValid = (key: string, value: any) => {
        if (value !== null && value !== undefined && value !== "") {
          updateData[key] = value;
        }
      };

      // Adicionar campos apenas se tiverem valor válido
      addIfValid("name", formData.name);
      addIfValid("slug", formData.slug);
      addIfValid("cnpj", formData.cnpj);
      addIfValid("email", formData.email);
      addIfValid("contactEmail", formData.contactEmail);
      addIfValid("contactPhone", formData.contactPhone);
      addIfValid("phone", formData.phone);
      addIfValid("address", formData.address);
      addIfValid("city", formData.city);
      addIfValid("state", formData.state);
      addIfValid("zipCode", formData.zipCode);

      // Para plan e planStatus, sempre garantir valores válidos
      if (formData.plan && ["basic", "professional", "enterprise"].includes(formData.plan)) {
        updateData.plan = formData.plan;
      }
      if (formData.planStatus && ["trial", "active", "suspended", "cancelled"].includes(formData.planStatus)) {
        updateData.planStatus = formData.planStatus;
      }

      addIfValid("pixKey", formData.pixKey);
      addIfValid("pixKeyType", formData.pixKeyType);
      addIfValid("merchantName", formData.merchantName);
      addIfValid("merchantCity", formData.merchantCity);
      addIfValid("wellhubApiKey", formData.wellhubApiKey);
      addIfValid("wellhubWebhookSecret", formData.wellhubWebhookSecret);
      addIfValid("status", formData.status);
      addIfValid("blockedReason", formData.blockedReason);

      console.log("📤 [FRONTEND] Enviando dados para update:", JSON.stringify(updateData, null, 2));

      try {
        console.log("🚀 [FRONTEND] Chamando updateMutation.mutate...");
        updateMutation.mutate(updateData, {
          onSuccess: (data) => {
            console.log("✅ [FRONTEND MUTATION] Update bem-sucedido!", data);
          },
          onError: (error) => {
            console.error("❌ [FRONTEND MUTATION] Erro no update:", error);
          }
        });
        console.log("✅ [FRONTEND] Mutation chamada com sucesso");
      } catch (err) {
        console.error("❌ [FRONTEND] Erro ao chamar mutation:", err);
        throw err;
      }
    } else {
      console.log("📤 [FRONTEND] Criando nova academia");

      // Preparar dados para criação, removendo campos vazios
      const createData: any = {
        name: formData.name,
        slug: formData.slug,
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.cnpj) createData.cnpj = formData.cnpj;
      if (formData.email) createData.email = formData.email;
      if (formData.contactEmail) createData.contactEmail = formData.contactEmail;
      if (formData.contactPhone) createData.contactPhone = formData.contactPhone;
      if (formData.phone) createData.phone = formData.phone;
      if (formData.address) createData.address = formData.address;
      if (formData.city) createData.city = formData.city;
      if (formData.state) createData.state = formData.state;
      if (formData.zipCode) createData.zipCode = formData.zipCode;

      // Sempre enviar plano e status (com valores padrão se necessário)
      createData.plan = formData.plan || "basic";
      createData.planStatus = formData.planStatus || "trial";

      if (formData.pixKey) createData.pixKey = formData.pixKey;
      if (formData.pixKeyType) createData.pixKeyType = formData.pixKeyType;
      if (formData.merchantName) createData.merchantName = formData.merchantName;
      if (formData.merchantCity) createData.merchantCity = formData.merchantCity;
      if (formData.wellhubApiKey) createData.wellhubApiKey = formData.wellhubApiKey;
      if (formData.wellhubWebhookSecret) createData.wellhubWebhookSecret = formData.wellhubWebhookSecret;
      if (formData.adminEmail) createData.adminEmail = formData.adminEmail;
      if (formData.adminName) createData.adminName = formData.adminName;

      console.log("📤 [FRONTEND] Dados para criação:", JSON.stringify(createData, null, 2));
      createMutation.mutate(createData);
    }
  };

  const handleDelete = (gymId: number, gymName: string) => {
    if (confirm(`Tem certeza que deseja deletar a academia "${gymName}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate({ gymId });
    }
  };

  const handleActivate = (gymId: number) => {
    activateMutation.mutate({ gymId });
  };

  const handleDeactivate = (gymId: number, gymName: string) => {
    const reason = prompt(`Digite o motivo da desativação da academia "${gymName}":`);
    if (reason !== null) {
      deactivateMutation.mutate({ gymId, reason });
    }
  };

  const handleBlock = (gymId: number, gymName: string) => {
    const reason = prompt(`Digite o motivo do bloqueio da academia "${gymName}":\n(Ex: Falta de pagamento, Violação dos termos, etc.)`);
    if (reason) {
      blockMutation.mutate({ gymId, reason });
    }
  };

  const handleUnblock = (gymId: number) => {
    unblockMutation.mutate({ gymId });
  };

  const handleResetPassword = (gymId: number, gymName: string) => {
    if (confirm(`Tem certeza que deseja resetar a senha do admin da academia "${gymName}"?\n\nA senha será resetada para: [slug]@2024`)) {
      resetPasswordMutation.mutate({ gymId });
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Academias</h2>
            <p className="text-gray-600 mt-1">Gerenciar todas as academias do sistema</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Academia
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Total de Academias</p>
                  <p className="text-3xl font-bold text-gray-900">{gyms?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Academias Ativas</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {gyms?.filter(g => g.status === 'active')?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Com Wellhub</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {gyms?.filter(g => g.wellhubApiKey)?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gyms List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Todas as Academias</h3>
          {isLoading ? (
            <Card className="shadow-md">
              <CardContent className="p-6">
                <p className="text-gray-600">Carregando...</p>
              </CardContent>
            </Card>
          ) : gyms && gyms.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gyms.map((gym, index) => {
                const borderColors = ['border-l-blue-500', 'border-l-green-500', 'border-l-purple-500', 'border-l-orange-500'];
                const planLabels = { basic: 'Básico', professional: 'Professional', enterprise: 'Enterprise' };
                const planColors = { basic: 'bg-gray-100 text-gray-700', professional: 'bg-blue-100 text-blue-700', enterprise: 'bg-purple-100 text-purple-700' };
                const statusLabels = { trial: 'Trial', active: 'Ativo', suspended: 'Suspenso', cancelled: 'Cancelado' };
                const statusColors = { trial: 'bg-yellow-100 text-yellow-700', active: 'bg-green-100 text-green-700', suspended: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-700' };
                return (
                  <Card key={gym.id} className={`border-l-4 ${borderColors[index % borderColors.length]} shadow-md hover:shadow-lg transition`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900">{gym.name}</h4>
                          <p className="text-sm text-gray-600">@{gym.slug}</p>
                          {gym.cnpj && <p className="text-xs text-gray-500 mt-1">CNPJ: {gym.cnpj}</p>}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {gym.status === 'active' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Ativa
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                              {gym.status === 'suspended' ? 'Suspensa' : 'Inativa'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Plan and Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${planColors[gym.plan as keyof typeof planColors] || planColors.basic}`}>
                          <DollarSign className="w-3 h-3" />
                          {planLabels[gym.plan as keyof typeof planLabels] || 'Básico'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[gym.planStatus as keyof typeof statusColors] || statusColors.trial}`}>
                          {statusLabels[gym.planStatus as keyof typeof statusLabels] || 'Trial'}
                        </span>
                      </div>

                      {/* Blocked Reason Alert */}
                      {gym.blockedReason && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <strong>Bloqueado:</strong> {gym.blockedReason}
                        </div>
                      )}

                      <div className="space-y-2 mb-4">
                        {/* Endereço completo */}
                        {gym.address && (
                          <div className="flex items-start text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <div>{gym.address}</div>
                              {(gym.city || gym.state || gym.zipCode) && (
                                <div className="text-xs text-gray-500">
                                  {gym.city && gym.state ? `${gym.city}, ${gym.state}` : (gym.city || gym.state)}
                                  {gym.zipCode && ` - CEP: ${gym.zipCode}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Se não tiver endereço completo, mostrar cidade/estado */}
                        {!gym.address && gym.city && gym.state && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {gym.city}, {gym.state}
                            {gym.zipCode && ` - CEP: ${gym.zipCode}`}
                          </div>
                        )}

                        {/* Email da Empresa */}
                        {gym.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{gym.email}</span>
                          </div>
                        )}

                        {/* Email de Contato */}
                        {gym.contactEmail && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{gym.contactEmail}</span>
                          </div>
                        )}

                        {/* Telefone */}
                        {gym.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {gym.phone}
                          </div>
                        )}

                        {/* Telefone de Contato */}
                        {gym.contactPhone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {gym.contactPhone}
                          </div>
                        )}

                        {/* Configurações PIX */}
                        {gym.pixKey && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs font-semibold text-gray-700 mb-1">PIX</div>
                            <div className="text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Tipo:</span>
                                <span className="uppercase">{gym.pixKeyType || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-medium">Chave:</span>
                                <span className="truncate">{gym.pixKey}</span>
                              </div>
                              {gym.merchantName && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="font-medium">Beneficiário:</span>
                                  <span>{gym.merchantName}</span>
                                  {gym.merchantCity && ` - ${gym.merchantCity}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Integração Wellhub */}
                        {gym.wellhubApiKey && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs font-semibold text-purple-700 mb-1">Wellhub Integrado</div>
                            <div className="text-xs text-gray-600">
                              <div>API Key: {gym.wellhubApiKey.substring(0, 20)}...</div>
                              {gym.wellhubWebhookSecret && (
                                <div>Webhook configurado</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(gym)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(gym.id, gym.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(gym.id, gym.name)}
                          className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Resetar Senha do Admin
                        </Button>
                        <div className="flex items-center gap-2">
                          {gym.status === 'suspended' || gym.planStatus === 'suspended' ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleActivate(gym.id)}
                                className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Unlock className="w-4 h-4 mr-1" />
                                Ativar
                              </Button>
                              {gym.blockedReason && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnblock(gym.id)}
                                  className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <ShieldOff className="w-4 h-4 mr-1" />
                                  Desbloquear
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeactivate(gym.id, gym.name)}
                                className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                <Lock className="w-4 h-4 mr-1" />
                                Desativar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBlock(gym.id, gym.name)}
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Shield className="w-4 h-4 mr-1" />
                                Bloquear
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-md">
              <CardContent className="p-6">
                <p className="text-gray-600 text-center py-8">
                  Nenhuma academia cadastrada ainda
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGym ? "Editar Academia" : "Nova Academia"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Alerta de Campos Obrigatórios */}
              {!editingGym && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Campos obrigatórios:</strong> Nome, Slug e pelo menos um Email (Empresa ou Contato)
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj || ""}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="email">
                    Email da Empresa {!editingGym && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={!editingGym ? "email@empresa.com (obrigatório)" : ""}
                    required={!editingGym && !formData.contactEmail}
                  />
                  {!editingGym && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ou preencha "Email de Contato" abaixo
                    </p>
                  )}
                </div>
              </div>

              <div className="border p-4 rounded-lg bg-blue-50">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Plano SaaS
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan">Plano</Label>
                    <Select
                      value={formData.plan || "basic"}
                      onValueChange={(value) => {
                        console.log("🎯 [PLAN SELECT] Plano selecionado:", value);
                        setFormData({ ...formData, plan: value as any });
                        console.log("🎯 [PLAN SELECT] formData atualizado:", { ...formData, plan: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Básico - R$ {settings?.basicPrice || 149}/mês</SelectItem>
                        <SelectItem value="professional">Professional - R$ {settings?.professionalPrice || 299}/mês</SelectItem>
                        <SelectItem value="enterprise">Enterprise - R$ {settings?.enterprisePrice || 599}/mês</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Valor atual: {formData.plan || "basic"}</p>
                  </div>
                  <div>
                    <Label htmlFor="planStatus">Status do Plano</Label>
                    <Select
                      value={formData.planStatus || "trial"}
                      onValueChange={(value) => {
                        console.log("🎯 [PLAN STATUS SELECT] Status selecionado:", value);
                        setFormData({ ...formData, planStatus: value as any });
                        console.log("🎯 [PLAN STATUS SELECT] formData atualizado:", { ...formData, planStatus: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial (Teste)</SelectItem>
                        <SelectItem value="active">Ativo (Pago)</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Valor atual: {formData.planStatus || "trial"}</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail || ""}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Telefone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone || ""}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode || ""}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-4">Configurações de Pagamento</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pixKeyType">Tipo de Chave PIX</Label>
                    <Select
                      value={formData.pixKeyType || undefined}
                      onValueChange={(value) => setFormData({ ...formData, pixKeyType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="random">Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pixKey">Chave PIX</Label>
                    <Input
                      id="pixKey"
                      value={formData.pixKey || ""}
                      onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="merchantName">Nome do Beneficiário</Label>
                    <Input
                      id="merchantName"
                      value={formData.merchantName || ""}
                      onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="merchantCity">Cidade do Beneficiário</Label>
                    <Input
                      id="merchantCity"
                      value={formData.merchantCity || ""}
                      onChange={(e) => setFormData({ ...formData, merchantCity: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {!editingGym && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Administrador da Academia</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Será criado automaticamente um usuário admin. Se não preencher, usaremos os dados de contato.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminName">Nome do Admin</Label>
                      <Input
                        id="adminName"
                        placeholder="Opcional - usa 'Admin [Nome da Academia]'"
                        value={formData.adminName || ""}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminEmail">Email do Admin</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="Opcional - usa o email de contato"
                        value={formData.adminEmail || ""}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Senha temporária será gerada automaticamente no formato: [slug]@2024
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-4">Integração Wellhub</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="wellhubApiKey">Wellhub API Key</Label>
                    <Input
                      id="wellhubApiKey"
                      value={formData.wellhubApiKey || ""}
                      onChange={(e) => setFormData({ ...formData, wellhubApiKey: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wellhubWebhookSecret">Wellhub Webhook Secret</Label>
                    <Input
                      id="wellhubWebhookSecret"
                      value={formData.wellhubWebhookSecret || ""}
                      onChange={(e) => setFormData({ ...formData, wellhubWebhookSecret: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingGym ? "Salvar Alterações" : "Criar Academia"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-green-600" />
              </div>
              Credenciais do Administrador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2 font-medium">
                ✓ Academia criada com sucesso!
              </p>
              <p className="text-xs text-green-700">
                As credenciais abaixo foram geradas para o administrador da academia.
                Guarde essas informações em local seguro.
              </p>
            </div>

            {credentials && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={credentials.email}
                      readOnly
                      className="bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(credentials.email, 'email')}
                      className="flex-shrink-0"
                    >
                      {copiedField === 'email' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Senha Temporária</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={credentials.password}
                      readOnly
                      className="bg-gray-50 font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(credentials.password, 'password')}
                      className="flex-shrink-0"
                    >
                      {copiedField === 'password' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">URL de Login</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={window.location.origin + credentials.loginUrl}
                      readOnly
                      className="bg-gray-50 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(window.location.origin + credentials.loginUrl, 'url')}
                      className="flex-shrink-0"
                    >
                      {copiedField === 'url' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Importante:</strong> Anote essas credenciais agora. O administrador deve
                alterar a senha no primeiro acesso.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowCredentials(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
