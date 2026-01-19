import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Phone,
  MapPin,
  Briefcase,
  Camera,
  Lock,
  LockOpen,
  Ban,
  Pause,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useGym } from "@/_core/hooks/useGym";

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

const ACCESS_STATUS_LABELS = {
  active: { label: "Ativo", variant: "default" as const, icon: LockOpen },
  inactive: { label: "Inativo", variant: "secondary" as const, icon: Lock },
  suspended: { label: "Suspenso", variant: "outline" as const, icon: Pause },
  blocked: { label: "Bloqueado", variant: "destructive" as const, icon: Ban },
};

export default function AdminStaff() {
  const { gymSlug } = useGym();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFaceEnrollOpen, setIsFaceEnrollOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [faceImage, setFaceImage] = useState<string>("");
  const [showWebcam, setShowWebcam] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    birthDate: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    position: "",
    department: "",
    hireDate: "",
    salary: "",
    photoUrl: "",
    accessStatus: "inactive" as "active" | "inactive" | "suspended" | "blocked",
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
    cpf: "",
    phone: "",
    birthDate: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    position: "",
    department: "",
    hireDate: "",
    salary: "",
    photoUrl: "",
    accessStatus: "inactive" as "active" | "inactive" | "suspended" | "blocked",
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
    gymSlug,
  }, { enabled: !!gymSlug });

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

  const updateAccessStatusMutation = trpc.staff.updateAccessStatus.useMutation({
    onSuccess: () => {
      toast.success("Status de acesso atualizado!");
      utils.staff.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const uploadFaceMutation = trpc.staff.uploadFaceImage.useMutation({
    onSuccess: () => {
      toast.success("Foto facial cadastrada com sucesso!");
      utils.staff.list.invalidate();
      setIsFaceEnrollOpen(false);
      setFaceImage("");
      setShowWebcam(false);
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar foto facial: " + error.message);
    },
  });

  // Webcam ref and capture function
  const webcamRef = useRef<Webcam>(null);

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFaceImage(imageSrc);
      setShowWebcam(false);
      toast.success("Foto capturada com sucesso!");
    }
  }, [webcamRef]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      cpf: "",
      phone: "",
      birthDate: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      position: "",
      department: "",
      hireDate: "",
      salary: "",
      photoUrl: "",
      accessStatus: "inactive",
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
    if (!formData.name || !formData.email || !formData.password || !formData.cpf) {
      toast.error("Preencha todos os campos obrigatórios (Nome, Email, Senha, CPF)");
      return;
    }

    if (!gymSlug) {
      toast.error("Academia não identificada");
      return;
    }

    createMutation.mutate({
      gymSlug,
      ...formData,
      permissions,
    });
  };

  const handleEdit = (staffMember: any) => {
    setSelectedStaff(staffMember);
    setEditFormData({
      name: staffMember.userName || "",
      email: staffMember.userEmail || "",
      password: "",
      cpf: staffMember.cpf || "",
      phone: staffMember.phone || "",
      birthDate: staffMember.birthDate ? new Date(staffMember.birthDate).toISOString().split('T')[0] : "",
      address: staffMember.address || "",
      number: staffMember.number || "",
      complement: staffMember.complement || "",
      neighborhood: staffMember.neighborhood || "",
      city: staffMember.city || "",
      state: staffMember.state || "",
      zipCode: staffMember.zipCode || "",
      position: staffMember.position || "",
      department: staffMember.department || "",
      hireDate: staffMember.hireDate ? new Date(staffMember.hireDate).toISOString().split('T')[0] : "",
      salary: staffMember.salary || "",
      photoUrl: staffMember.photoUrl || "",
      accessStatus: staffMember.accessStatus || "inactive",
    });

    setEditPermissions({
      viewStudents: false,
      editStudents: false,
      viewPayments: false,
      editPayments: false,
      viewReports: false,
      manageAccess: false,
      managePlans: false,
    });

    setIsEditOpen(true);
    setShowEditPassword(false);
  };

  const handleUpdate = () => {
    if (!selectedStaff) return;

    if (!gymSlug) {
      toast.error("Academia não identificada");
      return;
    }

    const updates: any = {
      gymSlug,
      staffId: selectedStaff.id,
      permissions: editPermissions,
      ...editFormData,
    };

    if (!editFormData.password) {
      delete updates.password;
    }

    updateMutation.mutate(updates);
  };

  const handleDelete = (staffId: number) => {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
      if (!gymSlug) {
        toast.error("Academia não identificada");
        return;
      }
      deleteMutation.mutate({
        gymSlug,
        staffId,
      });
    }
  };

  const handleUpdateAccessStatus = (staffId: number, status: "active" | "inactive" | "suspended" | "blocked") => {
    if (!gymSlug) {
      toast.error("Academia não identificada");
      return;
    }
    updateAccessStatusMutation.mutate({
      gymSlug,
      staffId,
      accessStatus: status,
    });
  };

  const handleOpenFaceEnroll = (staffMember: any) => {
    setSelectedStaff(staffMember);
    setFaceImage("");
    setShowWebcam(false);
    setIsFaceEnrollOpen(true);
  };

  const handleEnrollFace = async () => {
    if (!faceImage || !selectedStaff) {
      toast.error("Capture uma foto antes de cadastrar");
      return;
    }

    if (!gymSlug) {
      toast.error("Academia não identificada");
      return;
    }

    uploadFaceMutation.mutate({
      gymSlug,
      staffId: selectedStaff.id,
      faceImageBase64: faceImage,
    });
  };

  const togglePermission = (key: keyof Permissions, isEdit: boolean = false) => {
    if (isEdit) {
      setEditPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    } else {
      setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const filteredStaff = staff?.filter(member =>
    member.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.cpf?.includes(searchTerm) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase())
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
          description="Cadastre funcionários com dados completos e controle de acesso"
          action={
            <Button onClick={() => setIsCreateOpen(true)} size="lg">
              <UserPlus className="mr-2 h-5 w-5" />
              Novo Funcionário
            </Button>
          }
        />

        <Card className="p-4 shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, CPF ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

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
            filteredStaff.map((member) => {
              const statusInfo = ACCESS_STATUS_LABELS[member.accessStatus as keyof typeof ACCESS_STATUS_LABELS];
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={member.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold">{member.userName}</h3>
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            {member.faceEnrolled && (
                              <Badge variant="outline" className="gap-1">
                                <Camera className="h-3 w-3" />
                                Facial OK
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.registrationNumber}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{member.userEmail}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.position && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            <span>{member.position}</span>
                            {member.department && ` - ${member.department}`}
                          </div>
                        )}
                        {member.city && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{member.city}, {member.state}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
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
                      {!member.faceEnrolled ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenFaceEnroll(member)}
                          className="w-full"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Cadastrar Facial
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFaceEnroll(member)}
                          className="w-full"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Recadastrar Facial
                        </Button>
                      )}
                      <Select
                        value={member.accessStatus}
                        onValueChange={(value: any) => handleUpdateAccessStatus(member.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACCESS_STATUS_LABELS).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
              <DialogDescription>
                Preencha os dados completos do funcionário
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="employment">Emprego</TabsTrigger>
                <TabsTrigger value="permissions">Permissões</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="João da Silva"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="funcionario@email.com"
                    />
                  </div>

                  <div className="col-span-2">
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
              </TabsContent>

              <TabsContent value="address" className="space-y-4 mt-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, Avenida..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="123"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                      placeholder="Apto, Bloco..."
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Centro, Jardim..."
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Recepcionista, Limpeza..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Administrativo, Operacional..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="hireDate">Data de Admissão</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="salary">Salário (opcional)</Label>
                    <Input
                      id="salary"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="accessStatus">Status de Acesso</Label>
                    <Select
                      value={formData.accessStatus}
                      onValueChange={(value: any) => setFormData({ ...formData, accessStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACCESS_STATUS_LABELS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground mb-4">
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
                      <Label htmlFor={key} className="flex-1 cursor-pointer font-normal">
                        {PERMISSION_LABELS[key]}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

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

        {/* Edit Dialog - Similar structure to Create */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Funcionário</DialogTitle>
              <DialogDescription>
                Atualize os dados do funcionário (deixe a senha em branco para manter a atual)
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="employment">Emprego</TabsTrigger>
                <TabsTrigger value="permissions">Permissões</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="edit-name">Nome Completo</Label>
                    <Input
                      id="edit-name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-cpf">CPF</Label>
                    <Input
                      id="edit-cpf"
                      value={editFormData.cpf}
                      onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-phone">Telefone</Label>
                    <Input
                      id="edit-phone"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-birthDate">Data de Nascimento</Label>
                    <Input
                      id="edit-birthDate"
                      type="date"
                      value={editFormData.birthDate}
                      onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
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
              </TabsContent>

              <TabsContent value="address" className="space-y-4 mt-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <Label htmlFor="edit-address">Endereço</Label>
                    <Input
                      id="edit-address"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-number">Número</Label>
                    <Input
                      id="edit-number"
                      value={editFormData.number}
                      onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="edit-complement">Complemento</Label>
                    <Input
                      id="edit-complement"
                      value={editFormData.complement}
                      onChange={(e) => setEditFormData({ ...editFormData, complement: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="edit-neighborhood">Bairro</Label>
                    <Input
                      id="edit-neighborhood"
                      value={editFormData.neighborhood}
                      onChange={(e) => setEditFormData({ ...editFormData, neighborhood: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="edit-city">Cidade</Label>
                    <Input
                      id="edit-city"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-state">Estado</Label>
                    <Input
                      id="edit-state"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-zipCode">CEP</Label>
                    <Input
                      id="edit-zipCode"
                      value={editFormData.zipCode}
                      onChange={(e) => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-position">Cargo</Label>
                    <Input
                      id="edit-position"
                      value={editFormData.position}
                      onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-department">Departamento</Label>
                    <Input
                      id="edit-department"
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-hireDate">Data de Admissão</Label>
                    <Input
                      id="edit-hireDate"
                      type="date"
                      value={editFormData.hireDate}
                      onChange={(e) => setEditFormData({ ...editFormData, hireDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-salary">Salário</Label>
                    <Input
                      id="edit-salary"
                      value={editFormData.salary}
                      onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="edit-accessStatus">Status de Acesso</Label>
                    <Select
                      value={editFormData.accessStatus}
                      onValueChange={(value: any) => setEditFormData({ ...editFormData, accessStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACCESS_STATUS_LABELS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4 mt-4">
                <div className="grid gap-3">
                  {(Object.keys(PERMISSION_LABELS) as Array<keyof Permissions>).map((key) => (
                    <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <Checkbox
                        id={`edit-${key}`}
                        checked={editPermissions[key]}
                        onCheckedChange={() => togglePermission(key, true)}
                      />
                      <Label htmlFor={`edit-${key}`} className="flex-1 cursor-pointer font-normal">
                        {PERMISSION_LABELS[key]}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

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

        {/* Face Enrollment Dialog */}
        <Dialog open={isFaceEnrollOpen} onOpenChange={setIsFaceEnrollOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Reconhecimento Facial</DialogTitle>
              <DialogDescription>
                Capture a foto do funcionário {selectedStaff?.userName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-4">
                <h4 className="font-semibold">Informações do Funcionário</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{selectedStaff?.userName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Matrícula:</span>
                    <p className="font-medium">{selectedStaff?.registrationNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-medium">{selectedStaff?.cpf}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium">
                      {ACCESS_STATUS_LABELS[selectedStaff?.accessStatus as keyof typeof ACCESS_STATUS_LABELS]?.label}
                    </p>
                  </div>
                </div>
              </div>

              {!showWebcam && !faceImage && (
                <div className="flex justify-center py-8">
                  <Button size="lg" onClick={() => setShowWebcam(true)}>
                    <Camera className="mr-2 h-5 w-5" />
                    Abrir Câmera
                  </Button>
                </div>
              )}

              {showWebcam && (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full"
                      videoConstraints={{
                        width: 1280,
                        height: 720,
                        facingMode: "user"
                      }}
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={capturePhoto} size="lg">
                      <Camera className="mr-2 h-5 w-5" />
                      Capturar Foto
                    </Button>
                    <Button variant="outline" onClick={() => setShowWebcam(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {faceImage && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Foto Capturada</h4>
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <img src={faceImage} alt="Foto facial" className="w-full" />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handleEnrollFace}
                      size="lg"
                      disabled={uploadFaceMutation.isPending}
                    >
                      {uploadFaceMutation.isPending ? "Enviando..." : "Enviar para Control ID"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFaceImage("");
                        setShowWebcam(true);
                      }}
                    >
                      Tirar Outra Foto
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Briefcase className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Importante
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Certifique-se de que o funcionário está com o status "Ativo" para que o acesso
                      funcione após o cadastro facial.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsFaceEnrollOpen(false);
                setFaceImage("");
                setShowWebcam(false);
              }}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
