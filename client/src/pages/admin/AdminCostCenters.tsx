import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Target, Search } from "lucide-react";

export default function AdminCostCenters() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  const gymSlug = "fitlife";

  const { data: costCenters = [], refetch } = trpc.costCenters.list.useQuery({ gymSlug });

  const createCostCenter = trpc.costCenters.create.useMutation({
    onSuccess: () => {
      toast.success("Centro de custo cadastrado com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar centro de custo");
    },
  });

  const updateCostCenter = trpc.costCenters.update.useMutation({
    onSuccess: () => {
      toast.success("Centro de custo atualizado com sucesso!");
      setIsEditOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar centro de custo");
    },
  });

  const deleteCostCenter = trpc.costCenters.delete.useMutation({
    onSuccess: () => {
      toast.success("Centro de custo excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir centro de custo");
    },
  });

  const toggleActive = trpc.costCenters.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
    });
    setEditingCostCenter(null);
  };

  const handleCreate = () => {
    createCostCenter.mutate({
      gymSlug,
      ...formData,
    });
  };

  const handleEdit = (costCenter: any) => {
    setEditingCostCenter(costCenter);
    setFormData({
      name: costCenter.name,
      code: costCenter.code,
      description: costCenter.description || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCostCenter) return;
    updateCostCenter.mutate({
      gymSlug,
      costCenterId: editingCostCenter.id,
      ...formData,
    });
  };

  const handleDelete = (costCenterId: number) => {
    if (confirm("Tem certeza que deseja excluir este centro de custo?")) {
      deleteCostCenter.mutate({ gymSlug, costCenterId });
    }
  };

  const handleToggleActive = (costCenterId: number) => {
    toggleActive.mutate({ gymSlug, costCenterId });
  };

  const filteredCostCenters = costCenters.filter((cc: any) =>
    cc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cc.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Centros de Custo</h1>
            <p className="text-muted-foreground">
              Gerencie os centros de custo para controle de despesas
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Centro de Custo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Centro de Custo</DialogTitle>
                <DialogDescription>
                  Cadastre um novo centro de custo para organizar suas despesas
                </DialogDescription>
              </DialogHeader>
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-4 py-4">
                <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: ADM, OPE, MKT"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    Código único de identificação (ex: ADM para Administrativo)
                  </p>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Administrativo"
                  />
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o centro de custo..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createCostCenter.isPending || !formData.name || !formData.code}
                  >
                    {createCostCenter.isPending ? "Cadastrando..." : "Cadastrar Centro de Custo"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Centros de Custo</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{costCenters.length}</div>
              <p className="text-xs text-muted-foreground">
                {costCenters.filter((cc: any) => cc.active).length} ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Pesquisar Centros de Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cost Centers Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Centros de Custo Cadastrados</CardTitle>
            <CardDescription>
              {filteredCostCenters.length} centro(s) de custo encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCostCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "Nenhum centro de custo encontrado"
                          : "Nenhum centro de custo cadastrado"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCostCenters.map((costCenter: any) => (
                    <TableRow key={costCenter.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {costCenter.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{costCenter.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {costCenter.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={costCenter.active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(costCenter.id)}
                        >
                          {costCenter.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(costCenter)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(costCenter.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Centro de Custo</DialogTitle>
              <DialogDescription>
                Atualize as informações do centro de custo
              </DialogDescription>
            </DialogHeader>
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4 py-4">
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-code">Código *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: ADM, OPE, MKT"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Código único de identificação (ex: ADM para Administrativo)
                </p>
              </div>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Administrativo"
                />
              </div>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o centro de custo..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateCostCenter.isPending || !formData.name || !formData.code}
                >
                  {updateCostCenter.isPending ? "Atualizando..." : "Atualizar Centro de Custo"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
