import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Plus, Wifi, WifiOff, Edit, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function AdminControlIdDevices() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);

  const { data: devices = [], refetch } = trpc.devices.list.useQuery();

  const createMutation = trpc.devices.create.useMutation({
    onSuccess: () => {
      toast.success("Dispositivo cadastrado com sucesso!");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar dispositivo: ${error.message}`);
    },
  });

  const updateMutation = trpc.devices.update.useMutation({
    onSuccess: () => {
      toast.success("Dispositivo atualizado com sucesso!");
      setIsEditOpen(false);
      setEditingDevice(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar dispositivo: ${error.message}`);
    },
  });

  const deleteMutation = trpc.devices.delete.useMutation({
    onSuccess: () => {
      toast.success("Dispositivo excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir dispositivo: ${error.message}`);
    },
  });

  const [checkingDeviceId, setCheckingDeviceId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const handleCheckStatus = async (deviceId: number) => {
    setCheckingDeviceId(deviceId);
    try {
      const result = await utils.devices.checkStatus.fetch({ deviceId });
      if (result.online) {
        toast.success("Dispositivo Online - O dispositivo está respondendo");
      } else {
        toast.error("Dispositivo Offline - Não foi possível conectar ao dispositivo");
      }
    } catch (error) {
      toast.error("Erro ao verificar status");
    } finally {
      setCheckingDeviceId(null);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
    port: 80,
    username: "admin",
    password: "admin",
    location: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      ipAddress: "",
      port: 80,
      username: "admin",
      password: "admin",
      location: "",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (device: any) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      ipAddress: device.ipAddress,
      port: device.port,
      username: device.username || "admin",
      password: device.password || "admin",
      location: device.location || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingDevice) return;
    updateMutation.mutate({
      deviceId: editingDevice.id,
      ...formData,
      active: editingDevice.active,
    });
  };

  const handleDelete = (deviceId: number) => {
    if (confirm("Tem certeza que deseja excluir este dispositivo?")) {
      deleteMutation.mutate({ deviceId });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dispositivos Control ID</h1>
            <p className="text-muted-foreground">Gerencie os dispositivos de reconhecimento facial</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Dispositivo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Dispositivo</DialogTitle>
                <DialogDescription>
                  Configure um novo dispositivo Control ID para reconhecimento facial
                </DialogDescription>
              </DialogHeader>

              <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Dispositivo</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Catraca Principal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="ipAddress">Endereço IP</Label>
                  <Input
                    id="ipAddress"
                    placeholder="192.168.1.100"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="port">Porta</Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    placeholder="Ex: Entrada Principal"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {devices.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum dispositivo cadastrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Cadastre um dispositivo Control ID para começar a usar reconhecimento facial
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro Dispositivo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device: any) => (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {device.location || "Localização não informada"}
                      </CardDescription>
                    </div>
                    <Badge variant={device.active ? "default" : "secondary"}>
                      {device.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP:</span>
                      <span className="font-mono">{device.ipAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Porta:</span>
                      <span className="font-mono">{device.port}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCheckStatus(device.id)}
                      disabled={checkingDeviceId === device.id}
                    >
                      {checkingDeviceId === device.id ? (
                        <WifiOff className="h-4 w-4" />
                      ) : (
                        <Wifi className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(device)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDelete(device.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Dispositivo</DialogTitle>
              <DialogDescription>Atualize as informações do dispositivo Control ID</DialogDescription>
            </DialogHeader>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Dispositivo</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-ipAddress">Endereço IP</Label>
                <Input
                  id="edit-ipAddress"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-port">Porta</Label>
                <Input
                  id="edit-port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="edit-username">Usuário</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-password">Senha</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-location">Localização</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <Button onClick={handleUpdate} className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
