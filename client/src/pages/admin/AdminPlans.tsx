import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";

export default function AdminPlans() {
  const [gymSlug] = useState("fitlife");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [description, setDescription] = useState("");

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("30");
  const [editDescription, setEditDescription] = useState("");

  const { data: plans, refetch } = trpc.plans.list.useQuery({ gymSlug });
  const createMutation = trpc.plans.create.useMutation();
  const updateMutation = trpc.plans.update.useMutation();
  const deleteMutation = trpc.plans.delete.useMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        gymSlug,
        name,
        price: parseFloat(price),
        durationDays: parseInt(duration),
        description: description || undefined,
      });
      toast.success("Plano criado com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar plano");
    }
  };

  const handleEdit = (plan: any) => {
    setSelectedPlan(plan);
    setEditName(plan.name);
    setEditPrice((plan.priceInCents / 100).toString());
    setEditDuration(plan.durationDays.toString());
    setEditDescription(plan.description || "");
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    try {
      await updateMutation.mutateAsync({
        gymSlug,
        planId: selectedPlan.id,
        name: editName,
        price: parseFloat(editPrice),
        durationDays: parseInt(editDuration),
        description: editDescription || undefined,
      });
      toast.success("Plano atualizado com sucesso!");
      setIsEditOpen(false);
      setSelectedPlan(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar plano");
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm("Tem certeza que deseja excluir este plano? Alunos vinculados não serão afetados.")) return;

    try {
      await deleteMutation.mutateAsync({ gymSlug, planId });
      toast.success("Plano excluído com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir plano");
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDuration("30");
    setDescription("");
  };

  const getDurationLabel = (days: number) => {
    if (days === 30) return "Mensal";
    if (days === 90) return "Trimestral";
    if (days === 180) return "Semestral";
    if (days === 365) return "Anual";
    return `${days} dias`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Planos de Mensalidade"
          description="Gerencie os planos disponíveis para os alunos"
          action={
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Plano
                </Button>
              </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Plano</DialogTitle>
              <DialogDescription>
                Defina o nome, valor e duração do plano de mensalidade
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Plano Mensal, Plano Anual"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Valor (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Duração *</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Mensal (30 dias)</SelectItem>
                    <SelectItem value="90">Trimestral (90 dias)</SelectItem>
                    <SelectItem value="180">Semestral (180 dias)</SelectItem>
                    <SelectItem value="365">Anual (365 dias)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional do plano"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Plano"}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
          }
        />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan, index) => {
          const borderColors = ['border-l-blue-500', 'border-l-green-500', 'border-l-purple-500'];
          return (
          <Card key={plan.id} className={`relative border-l-4 ${borderColors[index % borderColors.length]} shadow-md hover:shadow-lg transition`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{getDurationLabel(plan.durationDays)}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold">
                    R$ {(plan.priceInCents / 100).toFixed(2)}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}

        {(!plans || plans.length === 0) && (
          <Card className="col-span-full shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum plano cadastrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie o primeiro plano de mensalidade para começar
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Plano
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Atualize as informações do plano de mensalidade
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="editName">Nome do Plano *</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="editPrice">Valor (R$) *</Label>
              <Input
                id="editPrice"
                type="number"
                step="0.01"
                min="0"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="editDuration">Duração *</Label>
              <Select value={editDuration} onValueChange={setEditDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Mensal (30 dias)</SelectItem>
                  <SelectItem value="90">Trimestral (90 dias)</SelectItem>
                  <SelectItem value="180">Semestral (180 dias)</SelectItem>
                  <SelectItem value="365">Anual (365 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editDescription">Descrição</Label>
              <Input
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
