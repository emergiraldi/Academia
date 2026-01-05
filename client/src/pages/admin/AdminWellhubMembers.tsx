import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Search, UserPlus, Edit, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type MemberStatus = "active" | "inactive" | "blocked";

export default function AdminWellhubMembers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    wellhubId: "",
    name: "",
    email: "",
    phone: "",
    customCode: "",
    status: "active" as MemberStatus,
    faceImageUrl: "",
  });

  // tRPC queries
  const { data: members = [], refetch } = trpc.wellhub.listMembers.useQuery({
    status: statusFilter === "all" ? undefined : (statusFilter as MemberStatus),
    search: searchTerm || undefined,
  });

  // Mutations
  const createMember = trpc.wellhub.createMember.useMutation({
    onSuccess: () => {
      toast.success("Membro Wellhub cadastrado com sucesso!");
      setAddModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar membro: ${error.message}`);
    },
  });

  const updateMember = trpc.wellhub.updateMember.useMutation({
    onSuccess: () => {
      toast.success("Membro atualizado com sucesso!");
      setEditModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar membro: ${error.message}`);
    },
  });

  const deleteMember = trpc.wellhub.deleteMember.useMutation({
    onSuccess: () => {
      toast.success("Membro removido com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao remover membro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      wellhubId: "",
      name: "",
      email: "",
      phone: "",
      customCode: "",
      status: "active",
      faceImageUrl: "",
    });
    setSelectedMember(null);
  };

  const handleAddMember = () => {
    if (!formData.wellhubId || formData.wellhubId.length !== 13) {
      toast.error("Wellhub ID deve ter 13 dígitos");
      return;
    }

    createMember.mutate({
      wellhubId: formData.wellhubId,
      name: formData.name || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      customCode: formData.customCode || undefined,
      faceImageUrl: formData.faceImageUrl || undefined,
      faceEnrolled: formData.faceImageUrl ? true : undefined,
    });
  };

  const handleEditMember = () => {
    if (!selectedMember) return;

    updateMember.mutate({
      id: selectedMember.id,
      name: formData.name || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      customCode: formData.customCode || undefined,
      status: formData.status,
      faceImageUrl: formData.faceImageUrl || undefined,
      faceEnrolled: formData.faceImageUrl ? true : undefined,
    });
  };

  const openEditModal = (member: any) => {
    setSelectedMember(member);
    setFormData({
      wellhubId: member.wellhubId,
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      customCode: member.customCode || "",
      status: member.status,
      faceImageUrl: member.faceImageUrl || "",
    });
    setEditModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFormData({ ...formData, faceImageUrl: base64 });
      toast.success('Foto carregada com sucesso');
    };
    reader.onerror = () => {
      toast.error('Erro ao carregar foto');
    };
    reader.readAsDataURL(file);
  };

  const getStatusBadge = (status: MemberStatus) => {
    const badges = {
      active: (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      ),
      inactive: (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <XCircle className="w-3 h-3 mr-1" />
          Inativo
        </Badge>
      ),
      blocked: (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Bloqueado
        </Badge>
      ),
    };
    return badges[status];
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Membros Wellhub"
          description="Gerenciar membros da integração Wellhub (antigo GymPass)"
        />

        {/* Filters */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por Wellhub ID, nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setAddModalOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Membro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Lista de Membros Wellhub</CardTitle>
            <CardDescription>
              Total de {members.length} membros cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wellhub ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Última Visita</TableHead>
                  <TableHead>Total Visitas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum membro cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-mono text-sm">{member.wellhubId}</TableCell>
                      <TableCell>{member.name || "-"}</TableCell>
                      <TableCell className="text-sm">{member.email || "-"}</TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell>
                        {member.lastCheckIn ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {new Date(member.lastCheckIn).toLocaleDateString("pt-BR")}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">{member.totalVisits || 0}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(member)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Deseja remover este membro?")) {
                                deleteMember.mutate({ id: member.id });
                              }
                            }}
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
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

        {/* Add Member Modal */}
        <Dialog open={addModalOpen} onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Membro Wellhub</DialogTitle>
              <DialogDescription>
                Cadastre um novo membro da integração Wellhub
              </DialogDescription>
            </DialogHeader>
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
              <div>
                <Label htmlFor="wellhubId">Wellhub ID *</Label>
                <Input
                  id="wellhubId"
                  placeholder="1234567890123 (13 dígitos)"
                  value={formData.wellhubId}
                  onChange={(e) => setFormData({ ...formData, wellhubId: e.target.value })}
                  maxLength={13}
                />
              </div>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customCode">Código Customizado</Label>
                <Input
                  id="customCode"
                  placeholder="Código opcional"
                  value={formData.customCode}
                  onChange={(e) => setFormData({ ...formData, customCode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-facePhoto">Foto Facial (para reconhecimento)</Label>
                <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                  {formData.faceImageUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={formData.faceImageUrl}
                        alt="Foto facial"
                        className="w-20 h-20 rounded-lg object-cover border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, faceImageUrl: "" })}
                      >
                        Remover foto
                      </Button>
                    </div>
                  )}
                  <Input
                    id="add-facePhoto"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <p className="text-xs text-muted-foreground">
                    Foto do rosto do membro para liberação automática na catraca
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddMember}>Cadastrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Member Modal */}
        <Dialog open={editModalOpen} onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Membro Wellhub</DialogTitle>
              <DialogDescription>
                Wellhub ID: {formData.wellhubId}
              </DialogDescription>
            </DialogHeader>
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-customCode">Código Customizado</Label>
                <Input
                  id="edit-customCode"
                  placeholder="Código opcional"
                  value={formData.customCode}
                  onChange={(e) => setFormData({ ...formData, customCode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-facePhoto">Foto Facial (para reconhecimento)</Label>
                <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                  {formData.faceImageUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={formData.faceImageUrl}
                        alt="Foto facial"
                        className="w-20 h-20 rounded-lg object-cover border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, faceImageUrl: "" })}
                      >
                        Remover foto
                      </Button>
                    </div>
                  )}
                  <Input
                    id="edit-facePhoto"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <p className="text-xs text-muted-foreground">
                    Foto do rosto do membro para liberação automática na catraca
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as MemberStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditMember}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
