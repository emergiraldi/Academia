import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  GraduationCap,
  Phone,
  MapPin,
  Award,
  Camera,
  Lock,
  LockOpen,
  Ban,
  Pause,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useGym } from "@/_core/hooks/useGym";

const ACCESS_STATUS_LABELS = {
  active: { label: "Ativo", variant: "default" as const, icon: LockOpen },
  inactive: { label: "Inativo", variant: "secondary" as const, icon: Lock },
  suspended: { label: "Suspenso", variant: "outline" as const, icon: Pause },
  blocked: { label: "Bloqueado", variant: "destructive" as const, icon: Ban },
};

export default function AdminProfessors() {
  const { gymSlug } = useGym();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

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
    specialty: "",
    certifications: "",
    hireDate: "",
    cref: "",
    bio: "",
    photoUrl: "",
    accessStatus: "inactive" as "active" | "inactive" | "suspended" | "blocked",
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
    specialty: "",
    certifications: "",
    hireDate: "",
    cref: "",
    bio: "",
    photoUrl: "",
    accessStatus: "inactive" as "active" | "inactive" | "suspended" | "blocked",
  });

  const utils = trpc.useUtils();
  const { data: professors, isLoading } = trpc.professors.list.useQuery({
    gymSlug,
  }, { enabled: !!gymSlug });

  const createMutation = trpc.professors.create.useMutation({
    onSuccess: () => {
      toast.success("Professor cadastrado com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      utils.professors.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar professor");
    },
  });

  const updateMutation = trpc.professors.update.useMutation({
    onSuccess: () => {
      toast.success("Professor atualizado com sucesso!");
      setIsEditOpen(false);
      utils.professors.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar professor");
    },
  });

  const deleteMutation = trpc.professors.delete.useMutation({
    onSuccess: () => {
      toast.success("Professor excluído com sucesso!");
      utils.professors.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir professor");
    },
  });

  const updateAccessStatusMutation = trpc.professors.updateAccessStatus.useMutation({
    onSuccess: () => {
      toast.success("Status de acesso atualizado!");
      utils.professors.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

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
      specialty: "",
      certifications: "",
      hireDate: "",
      cref: "",
      bio: "",
      photoUrl: "",
      accessStatus: "inactive",
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
    });
  };

  const handleEdit = (professor: any) => {
    setSelectedProfessor(professor);
    setEditFormData({
      name: professor.userName || "",
      email: professor.userEmail || "",
      password: "",
      cpf: professor.cpf || "",
      phone: professor.phone || "",
      birthDate: professor.birthDate ? new Date(professor.birthDate).toISOString().split('T')[0] : "",
      address: professor.address || "",
      number: professor.number || "",
      complement: professor.complement || "",
      neighborhood: professor.neighborhood || "",
      city: professor.city || "",
      state: professor.state || "",
      zipCode: professor.zipCode || "",
      specialty: professor.specialty || "",
      certifications: professor.certifications || "",
      hireDate: professor.hireDate ? new Date(professor.hireDate).toISOString().split('T')[0] : "",
      cref: professor.cref || "",
      bio: professor.bio || "",
      photoUrl: professor.photoUrl || "",
      accessStatus: professor.accessStatus || "inactive",
    });

    setIsEditOpen(true);
    setShowEditPassword(false);
  };

  const handleUpdate = () => {
    if (!selectedProfessor) return;

    if (!gymSlug) {
      toast.error("Academia não identificada");
      return;
    }

    const updates: any = {
      gymSlug,
      professorId: selectedProfessor.id,
      ...editFormData,
    };

    if (!editFormData.password) {
      delete updates.password;
    }

    updateMutation.mutate(updates);
  };

  const handleDelete = (professorId: number) => {
    if (confirm("Tem certeza que deseja excluir este professor?")) {
      if (!gymSlug) {
        toast.error("Academia não identificada");
        return;
      }
      deleteMutation.mutate({
        gymSlug,
        professorId,
      });
    }
  };

  const handleUpdateAccessStatus = (professorId: number, status: "active" | "inactive" | "suspended" | "blocked") => {
    if (!gymSlug) {
      toast.error("Academia não identificada");
      return;
    }
    updateAccessStatusMutation.mutate({
      gymSlug,
      professorId,
      accessStatus: status,
    });
  };

  const filteredProfessors = professors?.filter(professor =>
    professor.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.cpf?.includes(searchTerm) ||
    professor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.cref?.includes(searchTerm)
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando professores...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Gestão de Professores"
          description="Cadastre professores com dados completos e controle de acesso"
          action={
            <Button onClick={() => setIsCreateOpen(true)} size="lg">
              <UserPlus className="mr-2 h-5 w-5" />
              Novo Professor
            </Button>
          }
        />

        <Card className="p-4 shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, CPF, especialidade ou CREF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <div className="grid gap-4">
          {filteredProfessors.length === 0 ? (
            <Card className="p-12 text-center shadow-md">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum professor cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece cadastrando o primeiro professor da academia
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro Professor
              </Button>
            </Card>
          ) : (
            filteredProfessors.map((professor) => {
              const statusInfo = ACCESS_STATUS_LABELS[professor.accessStatus as keyof typeof ACCESS_STATUS_LABELS];
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={professor.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold">{professor.userName}</h3>
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            {professor.faceEnrolled && (
                              <Badge variant="outline" className="gap-1">
                                <Camera className="h-3 w-3" />
                                Facial OK
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{professor.registrationNumber}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{professor.userEmail}</span>
                        </div>
                        {professor.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{professor.phone}</span>
                          </div>
                        )}
                        {professor.specialty && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Award className="h-4 w-4" />
                            <span>{professor.specialty}</span>
                            {professor.cref && ` - CREF: ${professor.cref}`}
                          </div>
                        )}
                        {professor.city && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{professor.city}, {professor.state}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(professor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(professor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Select
                        value={professor.accessStatus}
                        onValueChange={(value: any) => handleUpdateAccessStatus(professor.id, value)}
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
              <DialogTitle>Cadastrar Novo Professor</DialogTitle>
              <DialogDescription>
                Preencha os dados completos do professor
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="professional">Profissional</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Maria Silva"
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
                      placeholder="professor@email.com"
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

              <TabsContent value="professional" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialty">Especialidade</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="Musculação, Pilates, Yoga..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="cref">CREF</Label>
                    <Input
                      id="cref"
                      value={formData.cref}
                      onChange={(e) => setFormData({ ...formData, cref: e.target.value })}
                      placeholder="000000-G/SP"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="certifications">Certificações/Formações</Label>
                    <Textarea
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="Lista de certificações e formações..."
                      rows={3}
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

                  <div className="col-span-2">
                    <Label htmlFor="bio">Biografia/Apresentação</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Breve apresentação do professor..."
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Cadastrando..." : "Cadastrar Professor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Professor</DialogTitle>
              <DialogDescription>
                Atualize os dados do professor (deixe a senha em branco para manter a atual)
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="professional">Profissional</TabsTrigger>
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

              <TabsContent value="professional" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-specialty">Especialidade</Label>
                    <Input
                      id="edit-specialty"
                      value={editFormData.specialty}
                      onChange={(e) => setEditFormData({ ...editFormData, specialty: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-cref">CREF</Label>
                    <Input
                      id="edit-cref"
                      value={editFormData.cref}
                      onChange={(e) => setEditFormData({ ...editFormData, cref: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="edit-certifications">Certificações/Formações</Label>
                    <Textarea
                      id="edit-certifications"
                      value={editFormData.certifications}
                      onChange={(e) => setEditFormData({ ...editFormData, certifications: e.target.value })}
                      rows={3}
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

                  <div className="col-span-2">
                    <Label htmlFor="edit-bio">Biografia/Apresentação</Label>
                    <Textarea
                      id="edit-bio"
                      value={editFormData.bio}
                      onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                      rows={4}
                    />
                  </div>
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
      </div>
    </DashboardLayout>
  );
}
