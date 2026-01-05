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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Edit,
  Trash2,
  Wallet,
  Search,
  DollarSign,
  Smartphone,
  CreditCard,
  Building2,
  FileCheck,
  FileText,
  Banknote,
} from "lucide-react";

// Icon mapping
const iconComponents: Record<string, any> = {
  DollarSign,
  Smartphone,
  CreditCard,
  Building2,
  FileCheck,
  FileText,
  Banknote,
  Wallet,
};

export default function AdminPaymentMethods() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    icon: "Wallet",
  });

  const { data: paymentMethods = [], refetch } = trpc.paymentMethods.list.useQuery();

  const createMethod = trpc.paymentMethods.create.useMutation({
    onSuccess: () => {
      toast.success("Forma de pagamento cadastrada com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar forma de pagamento");
    },
  });

  const updateMethod = trpc.paymentMethods.update.useMutation({
    onSuccess: () => {
      toast.success("Forma de pagamento atualizada com sucesso!");
      setIsEditOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar forma de pagamento");
    },
  });

  const deleteMethod = trpc.paymentMethods.delete.useMutation({
    onSuccess: () => {
      toast.success("Forma de pagamento excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir forma de pagamento");
    },
  });

  const toggleActive = trpc.paymentMethods.toggleActive.useMutation({
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
      icon: "Wallet",
    });
    setEditingMethod(null);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.code) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createMethod.mutate(formData);
  };

  const handleEdit = (method: any) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      description: method.description || "",
      icon: method.icon || "Wallet",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingMethod || !formData.name || !formData.code) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    updateMethod.mutate({
      id: editingMethod.id,
      ...formData,
    });
  };

  const handleDelete = (methodId: number) => {
    if (confirm("Tem certeza que deseja excluir esta forma de pagamento?")) {
      deleteMethod.mutate({ id: methodId });
    }
  };

  const handleToggleActive = (methodId: number) => {
    toggleActive.mutate({ id: methodId });
  };

  const filteredMethods = paymentMethods.filter((method: any) =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (iconName: string) => {
    const IconComponent = iconComponents[iconName] || Wallet;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Formas de Pagamento</h1>
            <p className="text-muted-foreground">
              Gerencie as formas de pagamento aceitas na academia
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Forma de Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Forma de Pagamento</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova forma de pagamento
                </DialogDescription>
              </DialogHeader>
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-4 py-4">
                <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: PIX, Dinheiro, Cartão"
                  />
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                    placeholder="Ex: pix, cash, credit_card"
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador único (sem espaços, use underscore _)
                  </p>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                  <Label htmlFor="icon">Ícone</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wallet">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          Carteira
                        </div>
                      </SelectItem>
                      <SelectItem value="DollarSign">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Cifrão
                        </div>
                      </SelectItem>
                      <SelectItem value="Smartphone">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Smartphone
                        </div>
                      </SelectItem>
                      <SelectItem value="CreditCard">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Cartão
                        </div>
                      </SelectItem>
                      <SelectItem value="Building2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Banco
                        </div>
                      </SelectItem>
                      <SelectItem value="FileCheck">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Cheque
                        </div>
                      </SelectItem>
                      <SelectItem value="FileText">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Documento
                        </div>
                      </SelectItem>
                      <SelectItem value="Banknote">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Nota
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva a forma de pagamento..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createMethod.isPending || !formData.name || !formData.code}
                  >
                    {createMethod.isPending ? "Cadastrando..." : "Cadastrar"}
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
              <CardTitle className="text-sm font-medium">Total de Formas de Pagamento</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentMethods.length}</div>
              <p className="text-xs text-muted-foreground">
                {paymentMethods.filter((m: any) => m.active).length} ativas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Pesquisar Formas de Pagamento</CardTitle>
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

        {/* Payment Methods Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Formas de Pagamento Cadastradas</CardTitle>
            <CardDescription>
              {filteredMethods.length} forma(s) de pagamento encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMethods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "Nenhuma forma de pagamento encontrada"
                          : "Nenhuma forma de pagamento cadastrada"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMethods.map((method: any) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                          {getIcon(method.icon)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {method.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {method.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={method.active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(method.id)}
                        >
                          {method.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(method)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(method.id)}
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
              <DialogTitle>Editar Forma de Pagamento</DialogTitle>
              <DialogDescription>
                Atualize as informações da forma de pagamento
              </DialogDescription>
            </DialogHeader>
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4 py-4">
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PIX, Dinheiro, Cartão"
                />
              </div>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-code">Código *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="Ex: pix, cash, credit_card"
                />
                <p className="text-xs text-muted-foreground">
                  Identificador único (sem espaços, use underscore _)
                </p>
              </div>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-icon">Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wallet">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Carteira
                      </div>
                    </SelectItem>
                    <SelectItem value="DollarSign">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Cifrão
                      </div>
                    </SelectItem>
                    <SelectItem value="Smartphone">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Smartphone
                      </div>
                    </SelectItem>
                    <SelectItem value="CreditCard">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cartão
                      </div>
                    </SelectItem>
                    <SelectItem value="Building2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Banco
                      </div>
                    </SelectItem>
                    <SelectItem value="FileCheck">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        Cheque
                      </div>
                    </SelectItem>
                    <SelectItem value="FileText">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documento
                      </div>
                    </SelectItem>
                    <SelectItem value="Banknote">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        Nota
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a forma de pagamento..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMethod.isPending || !formData.name || !formData.code}
                >
                  {updateMethod.isPending ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
