import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  Search,
  Mail,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  CheckCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";

const GYM_SLUG = "fitlife";

interface Permissions {
  viewStudents: boolean;
  editStudents: boolean;
  viewPayments: boolean;
  editPayments: boolean;
  viewReports: boolean;
  manageAccess: boolean;
  managePlans: boolean;
}

const PERMISSION_LABELS: Record<keyof Permissions, string> = {
  viewStudents: "Visualizar Alunos",
  editStudents: "Editar Alunos",
  viewPayments: "Visualizar Pagamentos",
  editPayments: "Editar Pagamentos",
  viewReports: "Visualizar Relatórios",
  manageAccess: "Gerenciar Controle de Acesso",
  managePlans: "Gerenciar Planos",
};

export default function AdminStaff() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [permissions, setPermissions] = useState<Permissions>({
    viewStudents: false,
    editStudents: false,
    viewPayments: false,
    editPayments: false,
    viewReports: false,
    manageAccess: false,
    managePlans: false,
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [editPermissions, setEditPermissions] = useState<Permissions>({
    viewStudents: false,
    editStudents: false,
    viewPayments: false,
    editPayments: false,
    viewReports: false,
    manageAccess: false,
    managePlans: false,
  });

  const utils = trpc.useUtils();
  const { data: staff, isLoading } = trpc.staff.list.useQuery({
    gymSlug: GYM_SLUG,
  });

  const createMutation = trpc.staff.create.useMutation({
    onSuccess: () => {
      toast.success("Funcionário cadastrado com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      utils.staff.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar funcionário");
    },
  });

  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => {
      toast.success("Funcionário atualizado com sucesso!");
      setIsEditOpen(false);
      utils.staff.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar funcionário");
    },
  });

  const deleteMutation = trpc.staff.delete.useMutation({
    onSuccess: () => {
      toast.success("Funcionário excluído com sucesso!");
      utils.staff.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir funcionário");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
    });
    setPermissions({
      viewStudents: false,
      editStudents: false,
      viewPayments: false,
      editPayments: false,
      viewReports: false,
      manageAccess: false,
      managePlans: false,
    });
    setShowPassword(false);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createMutation.mutate({
      gymSlug: GYM_SLUG,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      permissions,
    });
  };

  const handleEdit = (staffMember: any) => {
    setSelectedStaff(staffMember);
    setEditFormData({
      name: staffMember.name || "",
      email: staffMember.email || "",
      password: "",
    });
    
    // Parse permissions from JSON string
    try {
      const parsedPermissions = staffMember.permissions 
        ? JSON.parse(staffMember.permissions)
        : {
            viewStudents: false,
            editStudents: false,
            viewPayments: false,
            editPayments: false,
            viewReports: false,
            manageAccess: false,
            managePlans: false,
          };
      setEditPermissions(parsedPermissions);
    } catch (e) {
      setEditPermissions({
        viewStudents: false,
        editStudents: false,
        viewPayments: false,
        editPayments: false,
        viewReports: false,
        manageAccess: false,
        managePlans: false,
      });
    }
    
    setIsEditOpen(true);
    setShowEditPassword(false);
  };

  const handleUpdate = () => {
    if (!selectedStaff) return;

    const updates: any = {
      gymSlug: GYM_SLUG,
      staffId: selectedStaff.id,
      permissions: editPermissions,
    };

    if (editFormData.name) updates.name = editFormData.name;
    if (editFormData.email) updates.email = editFormData.email;
    if (editFormData.password) updates.password = editFormData.password;

    updateMutation.mutate(updates);
  };

  const handleDelete = (staffId: number) => {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
      deleteMutation.mutate({
        gymSlug: GYM_SLUG,
        staffId,
      });
    }
  };

  const togglePermission = (key: keyof Permissions, isEdit: boolean = false) => {
    if (isEdit) {
      setEditPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    } else {
      setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const getActivePermissionsCount = (perms: string | null) => {
    if (!perms) return 0;
    try {
      const parsed = JSON.parse(perms);
      return Object.values(parsed).filter(v => v === true).length;
    } catch {
      return 0;
    }
  };

  const filteredStaff = staff?.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Gestão de Funcionários"
          description="Cadastre funcionários e defina permissões de acesso"
          action={
            <Button onClick={() => setIsCreateOpen(true)} size="lg">
              <UserPlus className="mr-2 h-5 w-5" />
              Novo Funcionário
            </Button>
          }
        />

        {/* Search Bar */}
      <Card className="p-4 shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Staff Grid */}
      <div className="grid gap-4">
        {filteredStaff.length === 0 ? (
          <Card className="p-12 text-center shadow-md">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum funcionário cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando o primeiro funcionário da academia
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar Primeiro Funcionário
            </Button>
          </Card>
        ) : (
          filteredStaff.map((member) => (
            <Card key={member.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{member.name}</h3>
                      <Badge variant="secondary">Funcionário</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{member.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {getActivePermissionsCount(member.permissions)} permissões ativas
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados e selecione as permissões de acesso
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
              <h3 className="font-semibold text-sm">Dados Pessoais</h3>
              
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="João da Silva"
                />
              </div>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="funcionario@email.com"
                />
              </div>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
              <h3 className="font-semibold text-sm">Permissões de Acesso</h3>
              <p className="text-sm text-muted-foreground">
                Selecione as permissões que este funcionário terá no sistema
              </p>
              
              <div className="grid gap-3">
                {(Object.keys(PERMISSION_LABELS) as Array<keyof Permissions>).map((key) => (
                  <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={key}
                      checked={permissions[key]}
                      onCheckedChange={() => togglePermission(key)}
                    />
                    <Label
                      htmlFor={key}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {PERMISSION_LABELS[key]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Cadastrando..." : "Cadastrar Funcionário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Atualize os dados e permissões (deixe a senha em branco para manter a atual)
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
              <h3 className="font-semibold text-sm">Dados Pessoais</h3>
              
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showEditPassword ? "text" : "password"}
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Deixe em branco para manter"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
              <h3 className="font-semibold text-sm">Permissões de Acesso</h3>
              
              <div className="grid gap-3">
                {(Object.keys(PERMISSION_LABELS) as Array<keyof Permissions>).map((key) => (
                  <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={`edit-${key}`}
                      checked={editPermissions[key]}
                      onCheckedChange={() => togglePermission(key, true)}
                    />
                    <Label
                      htmlFor={`edit-${key}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {PERMISSION_LABELS[key]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
