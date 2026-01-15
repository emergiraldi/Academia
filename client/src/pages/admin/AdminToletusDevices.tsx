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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Wifi, WifiOff, Edit, Trash2, MapPin, Search, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { useGym } from "@/_core/hooks/useGym";
import { Separator } from "@/components/ui/separator";

export default function AdminToletusDevices() {
  const { gymSlug, gym } = useGym();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
  const [isTestReleaseOpen, setIsTestReleaseOpen] = useState(false);

  const { data: devices = [], refetch } = trpc.toletusDevices.list.useQuery();
  const { data: hubStatus } = trpc.toletusDevices.checkStatus.useQuery();
  const { data: discoveredDevices = [], refetch: refetchDiscovered } = trpc.toletusDevices.discover.useQuery(
    undefined,
    { enabled: isDiscoverOpen, retry: false }
  );

  const createMutation = trpc.toletusDevices.create.useMutation({
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

  const updateMutation = trpc.toletusDevices.update.useMutation({
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

  const deleteMutation = trpc.toletusDevices.delete.useMutation({
    onSuccess: () => {
      toast.success("Dispositivo excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir dispositivo: ${error.message}`);
    },
  });

  const releaseEntryMutation = trpc.toletusDevices.releaseEntry.useMutation({
    onSuccess: () => {
      toast.success("Entrada liberada com sucesso!");
      setIsTestReleaseOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao liberar entrada: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    hubUrl: "https://localhost:7067",
    deviceId: 0,
    deviceIp: "",
    devicePort: 7878,
    deviceType: "LiteNet2" as "LiteNet1" | "LiteNet2" | "LiteNet3",
    location: "",
  });

  const [testReleaseData, setTestReleaseData] = useState({
    deviceId: 0,
    message: "Teste de liberação",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      hubUrl: "https://localhost:7067",
      deviceId: 0,
      deviceIp: "",
      devicePort: 7878,
      deviceType: "LiteNet2",
      location: "",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingDevice) return;
    updateMutation.mutate({
      id: editingDevice.id,
      ...formData,
      active: editingDevice.active,
    });
  };

  const handleDelete = (deviceId: number) => {
    if (confirm("Tem certeza que deseja excluir este dispositivo?")) {
      deleteMutation.mutate({ id: deviceId });
    }
  };

  const handleEdit = (device: any) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      hubUrl: device.hubUrl,
      deviceId: device.deviceId,
      deviceIp: device.deviceIp,
      devicePort: device.devicePort,
      deviceType: device.deviceType,
      location: device.location || "",
    });
    setIsEditOpen(true);
  };

  const handleAddFromDiscovered = (device: any) => {
    setFormData({
      name: device.name || `${device.type} #${device.id}`,
      hubUrl: "https://localhost:7067",
      deviceId: device.id,
      deviceIp: device.ip,
      devicePort: device.port,
      deviceType: device.type.replace('DeviceType.', '') as "LiteNet1" | "LiteNet2" | "LiteNet3",
      location: "",
    });
    setIsDiscoverOpen(false);
    setIsCreateOpen(true);
  };

  const handleTestRelease = () => {
    if (!testReleaseData.deviceId) {
      toast.error("Selecione um dispositivo");
      return;
    }
    releaseEntryMutation.mutate(testReleaseData);
  };

  return (
    <DashboardLayout
      title="Dispositivos Toletus HUB"
      description="Gerenciar catracas LiteNet conectadas via Toletus HUB"
      gymSlug={gymSlug}
    >
      <div className="space-y-6">
        {/* Status do HUB */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status do Toletus HUB</CardTitle>
                <CardDescription>
                  Middleware local para comunicação com catracas LiteNet
                </CardDescription>
              </div>
              <Badge variant={hubStatus?.online ? "default" : "destructive"}>
                {hubStatus?.online ? (
                  <>
                    <Wifi className="w-4 h-4 mr-1" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">URL do HUB:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">https://localhost:7067</code>
              </div>
              {!hubStatus?.online && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Toletus HUB offline.</strong> Verifique se:
                  </p>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                    <li>O Toletus HUB está rodando (dotnet run)</li>
                    <li>O agent local está conectado ao servidor</li>
                    <li>A URL está correta nas configurações</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-2">
          <Dialog open={isDiscoverOpen} onOpenChange={setIsDiscoverOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Descobrir Dispositivos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Dispositivos Encontrados na Rede</DialogTitle>
                <DialogDescription>
                  Dispositivos LiteNet descobertos pelo Toletus HUB
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {discoveredDevices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum dispositivo encontrado. Verifique se as catracas estão ligadas e na mesma rede.
                  </p>
                ) : (
                  discoveredDevices.map((device: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{device.name || `Dispositivo #${device.id}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {device.ip}:{device.port} • {device.type}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddFromDiscovered(device)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => refetchDiscovered()}>
                  Atualizar
                </Button>
                <Button variant="outline" onClick={() => setIsDiscoverOpen(false)}>
                  Fechar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Dispositivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Dispositivo Toletus</DialogTitle>
                <DialogDescription>
                  Adicione um novo dispositivo LiteNet ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Dispositivo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Catraca Entrada Principal"
                  />
                </div>

                <div>
                  <Label htmlFor="hubUrl">URL do Toletus HUB</Label>
                  <Input
                    id="hubUrl"
                    value={formData.hubUrl}
                    onChange={(e) => setFormData({ ...formData, hubUrl: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deviceId">ID no HUB</Label>
                    <Input
                      id="deviceId"
                      type="number"
                      value={formData.deviceId}
                      onChange={(e) => setFormData({ ...formData, deviceId: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deviceType">Tipo</Label>
                    <Select
                      value={formData.deviceType}
                      onValueChange={(value) => setFormData({ ...formData, deviceType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LiteNet1">LiteNet1</SelectItem>
                        <SelectItem value="LiteNet2">LiteNet2</SelectItem>
                        <SelectItem value="LiteNet3">LiteNet3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deviceIp">IP do Dispositivo</Label>
                    <Input
                      id="deviceIp"
                      value={formData.deviceIp}
                      onChange={(e) => setFormData({ ...formData, deviceIp: e.target.value })}
                      placeholder="192.168.25.55"
                    />
                  </div>
                  <div>
                    <Label htmlFor="devicePort">Porta</Label>
                    <Input
                      id="devicePort"
                      type="number"
                      value={formData.devicePort}
                      onChange={(e) => setFormData({ ...formData, devicePort: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Localização (Opcional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Entrada Principal"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTestReleaseOpen} onOpenChange={setIsTestReleaseOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <DoorOpen className="w-4 h-4 mr-2" />
                Testar Liberação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Testar Liberação de Catraca</DialogTitle>
                <DialogDescription>
                  Envie um comando de teste para liberar a catraca
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="testDevice">Dispositivo</Label>
                  <Select
                    value={testReleaseData.deviceId.toString()}
                    onValueChange={(value) => setTestReleaseData({ ...testReleaseData, deviceId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um dispositivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device: any) => (
                        <SelectItem key={device.id} value={device.id.toString()}>
                          {device.name} ({device.deviceIp})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="testMessage">Mensagem</Label>
                  <Input
                    id="testMessage"
                    value={testReleaseData.message}
                    onChange={(e) => setTestReleaseData({ ...testReleaseData, message: e.target.value })}
                    placeholder="Mensagem exibida na catraca"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsTestReleaseOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleTestRelease} disabled={releaseEntryMutation.isPending}>
                    {releaseEntryMutation.isPending ? "Liberando..." : "Liberar Entrada"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Dispositivos */}
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos Cadastrados</CardTitle>
            <CardDescription>
              {devices.length} dispositivo(s) LiteNet cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhum dispositivo cadastrado
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Dispositivo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {devices.map((device: any) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{device.name}</h3>
                        <Badge variant="outline">{device.deviceType}</Badge>
                        {device.active && (
                          <Badge variant="default" className="text-xs">Ativo</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{device.deviceIp}:{device.devicePort}</span>
                        {device.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {device.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(device)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(device.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Dispositivo</DialogTitle>
              <DialogDescription>
                Altere as informações do dispositivo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Dispositivo</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
