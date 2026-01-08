import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  Star,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PlanForm {
  name: string;
  slug: string;
  description: string;
  priceInCents: number;
  features: string;
  hasWellhub: boolean;
  hasControlId: boolean;
  hasAdvancedReports: boolean;
  hasWhatsappIntegration: boolean;
  hasPrioritySupport: boolean;
  featured: boolean;
  displayOrder: number;
  active: boolean;
}

const emptyForm: PlanForm = {
  name: "",
  slug: "",
  description: "",
  priceInCents: 0,
  features: "[]",
  hasWellhub: false,
  hasControlId: false,
  hasAdvancedReports: false,
  hasWhatsappIntegration: false,
  hasPrioritySupport: false,
  featured: false,
  displayOrder: 0,
  active: true,
};

export default function SuperAdminPlans() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [formData, setFormData] = useState<PlanForm>(emptyForm);

  // Queries
  const { data: plans, isLoading, refetch } = trpc.saasPlans.list.useQuery();

  // Mutations
  const createMutation = trpc.saasPlans.create.useMutation({
    onSuccess: () => {
      toast.success("Plano criado com sucesso!");
      setCreateDialogOpen(false);
      setFormData(emptyForm);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar plano: " + error.message);
    },
  });

  const updateMutation = trpc.saasPlans.update.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso!");
      setEditDialogOpen(false);
      setSelectedPlan(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar plano: " + error.message);
    },
  });

  const deleteMutation = trpc.saasPlans.delete.useMutation({
    onSuccess: () => {
      toast.success("Plano deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao deletar plano: " + error.message);
    },
  });

  const handleCreate = () => {
    if (!formData.name || !formData.slug) {
      toast.error("Preencha nome e slug");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (plan: any) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      priceInCents: plan.priceInCents,
      features: plan.features || "[]",
      hasWellhub: plan.hasWellhub,
      hasControlId: plan.hasControlId,
      hasAdvancedReports: plan.hasAdvancedReports,
      hasWhatsappIntegration: plan.hasWhatsappIntegration,
      hasPrioritySupport: plan.hasPrioritySupport,
      featured: plan.featured,
      displayOrder: plan.displayOrder,
      active: plan.active,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedPlan) return;
    updateMutation.mutate({
      id: selectedPlan.id,
      ...formData,
    });
  };

  const handleDelete = (planId: number) => {
    deleteMutation.mutate({ id: planId });
  };

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  const PlanFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Plano *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              setFormData({ ...formData, name, slug });
            }}
            placeholder="Professional"
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="professional"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          placeholder="Ideal para academias em crescimento"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Preço Mensal (R$) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.priceInCents / 100}
            onChange={(e) => setFormData({ ...formData, priceInCents: Math.round(parseFloat(e.target.value) * 100) })}
            step="0.01"
            placeholder="299.00"
          />
        </div>
        <div>
          <Label htmlFor="displayOrder">Ordem de Exibição</Label>
          <Input
            id="displayOrder"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="features">Features (JSON)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          rows={3}
          placeholder='["Gestão de alunos", "Pagamentos PIX", "Relatórios"]'
        />
        <p className="text-xs text-gray-500 mt-1">Lista de features em formato JSON</p>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Recursos Incluídos</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="wellhub"
              checked={formData.hasWellhub}
              onCheckedChange={(checked) => setFormData({ ...formData, hasWellhub: checked })}
            />
            <Label htmlFor="wellhub" className="cursor-pointer">Integração Wellhub</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="controlId"
              checked={formData.hasControlId}
              onCheckedChange={(checked) => setFormData({ ...formData, hasControlId: checked })}
            />
            <Label htmlFor="controlId" className="cursor-pointer">Control ID</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="reports"
              checked={formData.hasAdvancedReports}
              onCheckedChange={(checked) => setFormData({ ...formData, hasAdvancedReports: checked })}
            />
            <Label htmlFor="reports" className="cursor-pointer">Relatórios Avançados</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="whatsapp"
              checked={formData.hasWhatsappIntegration}
              onCheckedChange={(checked) => setFormData({ ...formData, hasWhatsappIntegration: checked })}
            />
            <Label htmlFor="whatsapp" className="cursor-pointer">Integração WhatsApp</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="support"
              checked={formData.hasPrioritySupport}
              onCheckedChange={(checked) => setFormData({ ...formData, hasPrioritySupport: checked })}
            />
            <Label htmlFor="support" className="cursor-pointer">Suporte Prioritário</Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
          />
          <Label htmlFor="featured" className="cursor-pointer">Destacar na landing</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
          <Label htmlFor="active" className="cursor-pointer">Plano ativo</Label>
        </div>
      </div>
    </div>
  );

  return (
    <SuperAdminLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Planos SaaS</h2>
            <p className="text-gray-600 mt-1">Gerencie os planos de assinatura para academias</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setFormData(emptyForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Plano</DialogTitle>
                <DialogDescription>
                  Configure um novo plano de assinatura para as academias
                </DialogDescription>
              </DialogHeader>
              <PlanFormFields />
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Criando..." : "Criar Plano"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Plans List */}
        {isLoading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-l-4 border-l-blue-600">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle>{plan.name}</CardTitle>
                        {plan.featured && (
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        )}
                        {plan.active ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{formatPrice(plan.priceInCents)}/mês</p>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={editDialogOpen && selectedPlan?.id === plan.id} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Editar Plano</DialogTitle>
                            <DialogDescription>Modifique as configurações do plano</DialogDescription>
                          </DialogHeader>
                          <PlanFormFields />
                          <Button
                            onClick={handleUpdate}
                            disabled={updateMutation.isPending}
                            className="w-full"
                          >
                            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O plano <strong>{plan.name}</strong> será permanentemente deletado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(plan.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {plan.hasWellhub && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Wellhub
                      </span>
                    )}
                    {plan.hasControlId && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Control ID
                      </span>
                    )}
                    {plan.hasAdvancedReports && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Relatórios Avançados
                      </span>
                    )}
                    {plan.hasWhatsappIntegration && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        WhatsApp
                      </span>
                    )}
                    {plan.hasPrioritySupport && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        Suporte Prioritário
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum plano cadastrado ainda</p>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperAdminLayout>
  );
}
