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
import { Plus, Edit, Trash2, Building2, Search } from "lucide-react";
import { useGym } from "@/_core/hooks/useGym";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ, formatCEP, formatPhone, fetchAddressByCEP } from "@/lib/validators";

export default function AdminSuppliers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "", // Razão Social
    tradeName: "", // Nome Fantasia
    cnpjCpf: "",
    email: "",
    phone: "",
    cellphone: "",
    website: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    bank: "",
    bankAgency: "",
    bankAccount: "",
    category: "",
    notes: "",
  });

  const { gymSlug } = useGym();
  const utils = trpc.useUtils();

  const { data: suppliers = [], refetch } = trpc.suppliers.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });

  const createSupplier = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor cadastrado com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar fornecedor");
    },
  });

  const updateSupplier = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor atualizado com sucesso!");
      setIsEditOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar fornecedor");
    },
  });

  const deleteSupplier = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir fornecedor");
    },
  });

  const toggleActive = trpc.suppliers.toggleActive.useMutation({
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
      tradeName: "",
      cnpjCpf: "",
      email: "",
      phone: "",
      cellphone: "",
      website: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      bank: "",
      bankAgency: "",
      bankAccount: "",
      category: "",
      notes: "",
    });
    setEditingSupplier(null);
  };

  // Buscar endereço pelo CEP
  const handleCEPBlur = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    try {
      const address = await fetchAddressByCEP(cleanCEP);
      if (address) {
        setFormData(prev => ({
          ...prev,
          address: address.logradouro || prev.address,
          city: address.localidade || prev.city,
          state: address.uf || prev.state,
          zipCode: formatCEP(cleanCEP),
        }));
        toast.success("Endereço encontrado!");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    }
  };

  // Validar e formatar CNPJ/CPF + Buscar dados da empresa
  const handleCNPJCPFBlur = async (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length === 0) return;

    // Validar CPF (11 dígitos)
    if (clean.length === 11) {
      if (!validateCPF(clean)) {
        toast.error("CPF inválido");
        return;
      }
      setFormData(prev => ({ ...prev, cnpjCpf: formatCPF(clean) }));
      return;
    }

    // Validar e buscar CNPJ (14 dígitos)
    if (clean.length === 14) {
      if (!validateCNPJ(clean)) {
        toast.error("CNPJ inválido");
        return;
      }

      // Formatar CNPJ
      setFormData(prev => ({ ...prev, cnpjCpf: formatCNPJ(clean) }));

      // Buscar dados da empresa via backend
      try {
        const company = await utils.client.suppliers.fetchCNPJ.query({ cnpj: clean });
        if (company) {
          setFormData(prev => ({
            ...prev,
            name: company.nome || prev.name,
            tradeName: company.fantasia || prev.tradeName,
            email: company.email || prev.email,
            phone: company.telefone ? formatPhone(company.telefone) : prev.phone,
            address: company.logradouro || prev.address,
            number: company.numero || prev.number,
            complement: company.complemento || prev.complement,
            neighborhood: company.bairro || prev.neighborhood,
            city: company.municipio || prev.city,
            state: company.uf || prev.state,
            zipCode: company.cep ? formatCEP(company.cep) : prev.zipCode,
          }));
          toast.success("Dados da empresa encontrados!");
        } else {
          toast.error("Dados da empresa não encontrados");
        }
      } catch (error) {
        console.error("Erro ao buscar CNPJ:", error);
        toast.error("Erro ao buscar dados do CNPJ");
      }
      return;
    }

    toast.error("CNPJ/CPF deve ter 11 (CPF) ou 14 (CNPJ) dígitos");
  };

  // Formatar telefone automaticamente
  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, phone: formatPhone(phone) }));
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    // Validar CNPJ/CPF se preenchido
    if (formData.cnpjCpf) {
      const clean = formData.cnpjCpf.replace(/\D/g, '');
      if (clean.length === 11 && !validateCPF(clean)) {
        toast.error("CPF inválido");
        return;
      }
      if (clean.length === 14 && !validateCNPJ(clean)) {
        toast.error("CNPJ inválido");
        return;
      }
    }

    createSupplier.mutate({
      gymSlug,
      ...formData,
    });
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      tradeName: supplier.tradeName || "",
      cnpjCpf: supplier.cnpjCpf || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      cellphone: supplier.cellphone || "",
      website: supplier.website || "",
      address: supplier.address || "",
      number: supplier.number || "",
      complement: supplier.complement || "",
      neighborhood: supplier.neighborhood || "",
      city: supplier.city || "",
      state: supplier.state || "",
      zipCode: supplier.zipCode || "",
      bank: supplier.bank || "",
      bankAgency: supplier.bankAgency || "",
      bankAccount: supplier.bankAccount || "",
      category: supplier.category || "",
      notes: supplier.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingSupplier) return;

    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    // Validar CNPJ/CPF se preenchido
    if (formData.cnpjCpf) {
      const clean = formData.cnpjCpf.replace(/\D/g, '');
      if (clean.length === 11 && !validateCPF(clean)) {
        toast.error("CPF inválido");
        return;
      }
      if (clean.length === 14 && !validateCNPJ(clean)) {
        toast.error("CNPJ inválido");
        return;
      }
    }

    updateSupplier.mutate({
      gymSlug,
      supplierId: editingSupplier.id,
      ...formData,
    });
  };

  const handleDelete = (supplierId: number) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      deleteSupplier.mutate({ gymSlug, supplierId });
    }
  };

  const handleToggleActive = (supplierId: number) => {
    toggleActive.mutate({ gymSlug, supplierId });
  };

  const filteredSuppliers = suppliers.filter((supplier: any) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cnpjCpf?.includes(searchTerm) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie seus fornecedores e prestadores de serviço
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Fornecedor</DialogTitle>
                <DialogDescription>
                  Cadastre um novo fornecedor ou prestador de serviço
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Dados Básicos */}
                  <div className="col-span-2">
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Dados da Empresa</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpjCpf">CNPJ / CPF *</Label>
                    <Input
                      id="cnpjCpf"
                      value={formData.cnpjCpf}
                      onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                      onBlur={(e) => handleCNPJCPFBlur(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Equipamentos, Manutenção..."
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Razão Social *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome completo da empresa"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="tradeName">Nome Fantasia</Label>
                    <Input
                      id="tradeName"
                      value={formData.tradeName}
                      onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                      placeholder="Nome comercial"
                    />
                  </div>

                  {/* Contato */}
                  <div className="col-span-2 mt-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Contato</h3>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@fornecedor.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cellphone">Celular</Label>
                    <Input
                      id="cellphone"
                      value={formData.cellphone}
                      onChange={(e) => setFormData({ ...formData, cellphone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.empresa.com.br"
                    />
                  </div>

                  {/* Endereço */}
                  <div className="col-span-2 mt-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Endereço</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      onBlur={(e) => handleCEPBlur(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="123"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Logradouro</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, Avenida..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                      placeholder="Sala, Andar..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>

                  {/* Dados Bancários */}
                  <div className="col-span-2 mt-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Dados Bancários</h3>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="bank">Banco</Label>
                    <Input
                      id="bank"
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      placeholder="Nome do banco"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAgency">Agência</Label>
                    <Input
                      id="bankAgency"
                      value={formData.bankAgency}
                      onChange={(e) => setFormData({ ...formData, bankAgency: e.target.value })}
                      placeholder="0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Conta</Label>
                    <Input
                      id="bankAccount"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      placeholder="00000-0"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informações adicionais sobre o fornecedor..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createSupplier.isPending || !formData.name}
                  >
                    {createSupplier.isPending ? "Cadastrando..." : "Cadastrar Fornecedor"}
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
              <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">
                {suppliers.filter((s: any) => s.active).length} ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Pesquisar Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ/CPF ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Fornecedores Cadastrados</CardTitle>
            <CardDescription>
              {filteredSuppliers.length} fornecedor(es) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "Nenhum fornecedor encontrado"
                          : "Nenhum fornecedor cadastrado"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier: any) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.cnpjCpf || "-"}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>{supplier.email || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={supplier.active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(supplier.id)}
                        >
                          {supplier.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(supplier.id)}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Fornecedor</DialogTitle>
              <DialogDescription>
                Atualize as informações do fornecedor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Dados Básicos */}
                <div className="col-span-2">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Dados da Empresa</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cnpjCpf">CNPJ / CPF *</Label>
                  <Input
                    id="edit-cnpjCpf"
                    value={formData.cnpjCpf}
                    onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                    onBlur={(e) => handleCNPJCPFBlur(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Categoria</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Equipamentos, Manutenção..."
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-name">Razão Social *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo da empresa"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-tradeName">Nome Fantasia</Label>
                  <Input
                    id="edit-tradeName"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    placeholder="Nome comercial"
                  />
                </div>

                {/* Contato */}
                <div className="col-span-2 mt-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Contato</h3>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@fornecedor.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cellphone">Celular</Label>
                  <Input
                    id="edit-cellphone"
                    value={formData.cellphone}
                    onChange={(e) => setFormData({ ...formData, cellphone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.empresa.com.br"
                  />
                </div>

                {/* Endereço */}
                <div className="col-span-2 mt-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Endereço</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-zipCode">CEP</Label>
                  <Input
                    id="edit-zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    onBlur={(e) => handleCEPBlur(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-number">Número</Label>
                  <Input
                    id="edit-number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="123"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-address">Logradouro</Label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, Avenida..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-complement">Complemento</Label>
                  <Input
                    id="edit-complement"
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    placeholder="Sala, Andar..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-neighborhood">Bairro</Label>
                  <Input
                    id="edit-neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-city">Cidade</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-state">Estado</Label>
                  <Input
                    id="edit-state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>

                {/* Dados Bancários */}
                <div className="col-span-2 mt-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 border-b pb-2">Dados Bancários</h3>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-bank">Banco</Label>
                  <Input
                    id="edit-bank"
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    placeholder="Nome do banco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-bankAgency">Agência</Label>
                  <Input
                    id="edit-bankAgency"
                    value={formData.bankAgency}
                    onChange={(e) => setFormData({ ...formData, bankAgency: e.target.value })}
                    placeholder="0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-bankAccount">Conta</Label>
                  <Input
                    id="edit-bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    placeholder="00000-0"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-notes">Observações</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais sobre o fornecedor..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateSupplier.isPending || !formData.name}
                >
                  {updateSupplier.isPending ? "Atualizando..." : "Atualizar Fornecedor"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
