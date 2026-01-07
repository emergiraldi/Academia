import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useGym } from "@/_core/hooks/useGym";

export default function AdminProfessors() {
  const { gymSlug } = useGym();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const { data: professors, refetch } = trpc.professors.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const createMutation = trpc.professors.create.useMutation();
  const updateMutation = trpc.professors.update.useMutation();
  const deleteMutation = trpc.professors.delete.useMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        gymSlug,
        name,
        email,
        password,
        phone: phone || undefined,
      });
      toast.success("Professor cadastrado com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar professor");
    }
  };

  const handleEdit = (professor: any) => {
    setSelectedProfessor(professor);
    setEditName(professor.name || "");
    setEditEmail(professor.email || "");
    setEditPassword("");
    setEditPhone(professor.phone || "");
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessor) return;

    try {
      await updateMutation.mutateAsync({
        gymSlug,
        professorId: selectedProfessor.id,
        name: editName,
        email: editEmail,
        password: editPassword || undefined,
        phone: editPhone || undefined,
      });
      toast.success("Professor atualizado com sucesso!");
      setIsEditOpen(false);
      setSelectedProfessor(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar professor");
    }
  };

  const handleDelete = async (professorId: number) => {
    if (!confirm("Tem certeza que deseja excluir este professor?")) return;

    try {
      await deleteMutation.mutateAsync({ gymSlug, professorId });
      toast.success("Professor excluído com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir professor");
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Gestão de Professores"
          description="Cadastre e gerencie professores da academia"
          action={
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Professor
                </Button>
              </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Professor</DialogTitle>
              <DialogDescription>
                Preencha os dados do professor. Ele usará o email e senha para acessar o sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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
                <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
            </Dialog>
          }
        />

        <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Professores Cadastrados</CardTitle>
          <CardDescription>
            {professors?.length || 0} professor(es) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!professors || professors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum professor cadastrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professors.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell className="font-medium">{professor.name}</TableCell>
                    <TableCell>{professor.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(professor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(professor.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Professor</DialogTitle>
            <DialogDescription>
              Atualize os dados do professor. Deixe a senha em branco para manter a atual.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="editName">Nome Completo *</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="editPassword">Nova Senha (opcional)</Label>
              <div className="relative">
                <Input
                  id="editPassword"
                  type={showEditPassword ? "text" : "password"}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={6}
                  placeholder="Deixe em branco para manter a atual"
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
            <div>
              <Label htmlFor="editPhone">Telefone</Label>
              <Input
                id="editPhone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="(00) 00000-0000"
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
