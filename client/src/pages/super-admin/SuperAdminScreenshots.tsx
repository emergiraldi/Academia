import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Image,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
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

interface ScreenshotForm {
  title: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  active: string;
}

const emptyForm: ScreenshotForm = {
  title: "",
  description: "",
  imageUrl: "",
  displayOrder: 0,
  active: "Y",
};

export default function SuperAdminScreenshots() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<any>(null);
  const [formData, setFormData] = useState<ScreenshotForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Queries
  const { data: screenshots, isLoading, refetch } = trpc.landingPageScreenshots.list.useQuery();

  // Mutations
  const createMutation = trpc.landingPageScreenshots.create.useMutation({
    onSuccess: () => {
      toast.success("Screenshot criado com sucesso!");
      setCreateDialogOpen(false);
      setFormData(emptyForm);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar screenshot: " + error.message);
    },
  });

  const updateMutation = trpc.landingPageScreenshots.update.useMutation({
    onSuccess: () => {
      toast.success("Screenshot atualizado com sucesso!");
      setEditDialogOpen(false);
      setSelectedScreenshot(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar screenshot: " + error.message);
    },
  });

  const deleteMutation = trpc.landingPageScreenshots.delete.useMutation({
    onSuccess: () => {
      toast.success("Screenshot deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao deletar screenshot: " + error.message);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao fazer upload da imagem");
    }

    const data = await response.json();
    return data.url;
  };

  const handleCreate = async () => {
    if (!formData.title) {
      toast.error("Preencha o título");
      return;
    }

    if (!imageFile && !formData.imageUrl) {
      toast.error("Selecione uma imagem");
      return;
    }

    try {
      setUploading(true);

      let imageUrl = formData.imageUrl;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      createMutation.mutate({ ...formData, imageUrl });
      setImageFile(null);
      setImagePreview("");
    } catch (error) {
      toast.error("Erro ao fazer upload: " + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (screenshot: any) => {
    setSelectedScreenshot(screenshot);
    setFormData({
      title: screenshot.title,
      description: screenshot.description || "",
      imageUrl: screenshot.imageUrl,
      displayOrder: screenshot.displayOrder,
      active: screenshot.active,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedScreenshot) return;
    updateMutation.mutate({
      id: selectedScreenshot.id,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0 || !screenshots) return;
    const current = screenshots[index];
    const previous = screenshots[index - 1];

    updateMutation.mutate({
      id: current.id,
      displayOrder: previous.displayOrder,
    });
    updateMutation.mutate({
      id: previous.id,
      displayOrder: current.displayOrder,
    });
  };

  const handleMoveDown = (index: number) => {
    if (!screenshots || index === screenshots.length - 1) return;
    const current = screenshots[index];
    const next = screenshots[index + 1];

    updateMutation.mutate({
      id: current.id,
      displayOrder: next.displayOrder,
    });
    updateMutation.mutate({
      id: next.id,
      displayOrder: current.displayOrder,
    });
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Screenshots da Landing Page</h2>
            <p className="text-gray-600 mt-1">Gerenciar imagens do carrossel da página inicial</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Screenshot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Screenshot</DialogTitle>
                <DialogDescription>
                  Adicione um novo screenshot ao carrossel da landing page
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Ex: Dashboard Principal"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Ex: Visão geral com métricas importantes"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="image">Imagem *</Label>
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition cursor-pointer">
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        {imagePreview ? (
                          <div className="space-y-2 text-center">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-40 rounded-lg mx-auto"
                            />
                            <p className="text-sm text-gray-600">
                              Clique para trocar a imagem
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Clique ou arraste uma imagem aqui
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG, GIF até 5MB
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                    {imageFile && (
                      <p className="text-xs text-green-600">
                        ✓ {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="displayOrder">Ordem de Exibição</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active === "Y"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        active: e.target.checked ? "Y" : "N",
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={uploading || createMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={uploading || createMutation.isPending}
                  >
                    {uploading
                      ? "Fazendo upload..."
                      : createMutation.isPending
                      ? "Criando..."
                      : "Criar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Screenshots List */}
        <Card>
          <CardHeader>
            <CardTitle>Screenshots Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Carregando...</p>
            ) : screenshots && screenshots.length > 0 ? (
              <div className="space-y-4">
                {screenshots.map((screenshot, index) => (
                  <div
                    key={screenshot.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start gap-4">
                      {/* Image Preview */}
                      <div className="w-32 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                        {screenshot.imageUrl ? (
                          <img
                            src={screenshot.imageUrl}
                            alt={screenshot.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "";
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Image className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {screenshot.title}
                            </h4>
                            {screenshot.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {screenshot.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Ordem: {screenshot.displayOrder}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {screenshot.active === "Y" ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Ativo
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium flex items-center">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inativo
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === screenshots.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(screenshot)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-1" />
                                Deletar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja deletar o screenshot "{screenshot.title}"?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(screenshot.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Nenhum screenshot cadastrado ainda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Screenshot</DialogTitle>
              <DialogDescription>
                Atualize as informações do screenshot
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-imageUrl">URL da Imagem *</Label>
                <Input
                  id="edit-imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-displayOrder">Ordem de Exibição</Label>
                <Input
                  id="edit-displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formData.active === "Y"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      active: e.target.checked ? "Y" : "N",
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="edit-active">Ativo</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
