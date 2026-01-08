import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Plus,
  Key,
  Trash2,
  Shield,
  Lock,
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
import { useAuth } from "@/_core/hooks/useAuth";

export default function SuperAdminUsers() {
  const { user: currentUser } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [updatePasswordDialogOpen, setUpdatePasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Form states
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [updatePasswordForm, setUpdatePasswordForm] = useState({
    newPassword: "",
  });

  // Queries
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();

  // Mutations
  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      setCreateDialogOpen(false);
      setNewUser({ name: "", email: "", password: "" });
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar usuário: " + error.message);
    },
  });

  const changeMyPasswordMutation = trpc.users.changeMyPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setChangePasswordDialogOpen(false);
      setChangePasswordForm({ currentPassword: "", newPassword: "" });
    },
    onError: (error) => {
      toast.error("Erro ao alterar senha: " + error.message);
    },
  });

  const updatePasswordMutation = trpc.users.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha do usuário atualizada com sucesso!");
      setUpdatePasswordDialogOpen(false);
      setUpdatePasswordForm({ newPassword: "" });
      setSelectedUserId(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar senha: " + error.message);
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao deletar usuário: " + error.message);
    },
  });

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Preencha todos os campos");
      return;
    }
    createMutation.mutate(newUser);
  };

  const handleChangeMyPassword = () => {
    if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    changeMyPasswordMutation.mutate(changePasswordForm);
  };

  const handleUpdatePassword = () => {
    if (!updatePasswordForm.newPassword || !selectedUserId) {
      toast.error("Preencha a nova senha");
      return;
    }
    updatePasswordMutation.mutate({
      userId: selectedUserId,
      newPassword: updatePasswordForm.newPassword,
    });
  };

  const handleDeleteUser = (userId: number) => {
    deleteMutation.mutate({ userId });
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
            <p className="text-gray-600 mt-1">Gerencie usuários e senhas do sistema</p>
          </div>
          <div className="flex gap-3">
            {/* Change My Password Button */}
            <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Minha Senha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Minha Senha</DialogTitle>
                  <DialogDescription>
                    Digite sua senha atual e a nova senha desejada
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={changePasswordForm.currentPassword}
                      onChange={(e) =>
                        setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPasswordChange">Nova Senha</Label>
                    <Input
                      id="newPasswordChange"
                      type="password"
                      value={changePasswordForm.newPassword}
                      onChange={(e) =>
                        setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                  </div>
                  <Button
                    onClick={handleChangeMyPassword}
                    disabled={changeMyPasswordMutation.isPending}
                    className="w-full"
                  >
                    {changeMyPasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create User Button */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Crie um novo usuário super administrador
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="João Silva"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="joao@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                  </div>
                  <Button
                    onClick={handleCreateUser}
                    disabled={createMutation.isPending}
                    className="w-full"
                  >
                    {createMutation.isPending ? "Criando..." : "Criar Usuário"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Usuários Super Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Carregando...</p>
            ) : users && users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            Super Admin
                          </span>
                          {currentUser?.id === user.id && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              Você
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Update Password Button */}
                      <Dialog
                        open={updatePasswordDialogOpen && selectedUserId === user.id}
                        onOpenChange={(open) => {
                          setUpdatePasswordDialogOpen(open);
                          if (open) setSelectedUserId(user.id);
                          else setSelectedUserId(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Key className="w-4 h-4 mr-1" />
                            Alterar Senha
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Alterar Senha do Usuário</DialogTitle>
                            <DialogDescription>
                              Alterar senha de <strong>{user.name}</strong>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="newPasswordUpdate">Nova Senha</Label>
                              <Input
                                id="newPasswordUpdate"
                                type="password"
                                value={updatePasswordForm.newPassword}
                                onChange={(e) =>
                                  setUpdatePasswordForm({ newPassword: e.target.value })
                                }
                              />
                              <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                            </div>
                            <Button
                              onClick={handleUpdatePassword}
                              disabled={updatePasswordMutation.isPending}
                              className="w-full"
                            >
                              {updatePasswordMutation.isPending ? "Atualizando..." : "Atualizar Senha"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Delete Button - disabled for current user */}
                      {currentUser?.id !== user.id && (
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
                                Esta ação não pode ser desfeita. O usuário <strong>{user.name}</strong> será permanentemente deletado.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum usuário encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
