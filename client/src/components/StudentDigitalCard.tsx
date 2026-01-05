import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Check, Loader2, QrCode, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface StudentDigitalCardProps {
  student: any;
  onPhotoUpdate?: () => void;
  onBack?: () => void;
}

export function StudentDigitalCard({ student, onPhotoUpdate, onBack }: StudentDigitalCardProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<{ file: Blob; url: string } | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutation for updating photo
  const updatePhotoMutation = trpc.students.updatePhoto.useMutation();

  // Sincroniza foto do banco com o estado local
  useEffect(() => {
    if (student?.photoUrl) {
      setCurrentPhoto(student.photoUrl);
    }
  }, [student?.photoUrl]);

  // Dados da carteirinha
  const fullName = student.userName || student.name || student.user?.name || "Aluno";
  const cardData = {
    member_number: student.registrationNumber || student.id || "000000",
    name: fullName,
    photo_url: currentPhoto || student.photoUrl || student.cardImageUrl || null,
    membership_type: student.planName || "Plano Básico",
    membership_status: student.membershipStatus === "active" ? "Ativo" : "Inativo",
    join_date: student.createdAt || new Date().toISOString(),
    cpf: student.cpf || "---",
    qr_code_data: JSON.stringify({
      tipo: "CARTEIRINHA_DIGITAL",
      student_id: student.id,
      registration_number: student.registrationNumber,
      name: fullName,
      cpf: student.cpf,
      versao: "1.0",
      timestamp: Date.now()
    }),
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const previewUrl = URL.createObjectURL(blob);
              setPhotoPreview({
                file: blob,
                url: previewUrl,
              });
            }
          },
          "image/jpeg",
          0.9
        );
      };
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (file: Blob) => {
    setUploading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Call the tRPC mutation
      await updatePhotoMutation.mutateAsync({
        photoData: base64Data,
      });

      // Update local state
      setCurrentPhoto(base64Data);
      setShowPhotoModal(false);
      setPhotoPreview(null);
      toast.success("Foto atualizada com sucesso!");

      // Trigger parent component refresh
      onPhotoUpdate?.();
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast.error(error.message || "Erro ao fazer upload da foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const confirmUpload = () => {
    if (photoPreview) {
      uploadPhoto(photoPreview.file);
    }
  };

  const cancelPreview = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold">Carteirinha Digital</h1>
        </div>
        <p className="text-sm text-white/90 ml-11">
          Apresente sua carteirinha na academia
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Carteirinha Digital */}
        <Card className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-xl rounded-2xl overflow-hidden border-0">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">ACADEMIA DIGITAL</h2>
            <QrCode className="w-8 h-8" />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-400 rounded-full border-4 border-white flex items-center justify-center text-lg font-semibold overflow-hidden">
                {cardData.photo_url ? (
                  <img
                    src={cardData.photo_url}
                    alt="Foto do Aluno"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const initials = cardData.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `<span class="text-2xl font-bold text-white">${initials}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {cardData.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPhotoModal(true)}
                className="absolute -bottom-1 -right-1 bg-white text-blue-600 rounded-full p-1.5 shadow-lg hover:bg-gray-50 transition-colors"
                title="Atualizar foto"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <p className="text-xl font-semibold">{cardData.name}</p>
              <p className="text-sm opacity-90">
                Matrícula: {cardData.member_number}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm opacity-90">
            <div>
              <p className="font-medium">Plano:</p>
              <p>{cardData.membership_type}</p>
            </div>
            <div>
              <p className="font-medium">Status:</p>
              <p>{cardData.membership_status}</p>
            </div>
            <div>
              <p className="font-medium">CPF:</p>
              <p>{cardData.cpf}</p>
            </div>
            <div>
              <p className="font-medium">Desde:</p>
              <p>
                {new Date(cardData.join_date).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card className="text-center p-6">
        <h3 className="font-bold text-lg mb-4">Apresente seu QR Code</h3>
        <div className="w-48 h-48 bg-gray-100 mx-auto flex items-center justify-center rounded-xl mb-4 p-4">
          <QRCodeSVG
            value={cardData.qr_code_data}
            size={180}
            bgColor="#F3F4F6"
            fgColor="#0f172a"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Escaneie para acesso rápido e validação
        </p>

        {/* Botão para copiar JSON */}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(cardData.qr_code_data);
              toast.success("QR Code copiado!");
            }}
            className="w-full"
          >
            📋 Copiar dados do QR Code
          </Button>
        </div>
      </Card>
      </div>

      {/* Modal de Upload de Foto */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {photoPreview ? "Confirmar Foto" : "Atualizar Foto"}
                </h2>
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    cancelPreview();
                  }}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {photoPreview ? (
                <div className="text-center space-y-4">
                  <div className="w-48 h-48 mx-auto bg-muted rounded-full overflow-hidden">
                    <img
                      src={photoPreview.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Como ficará na sua carteirinha
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={cancelPreview}
                      disabled={uploading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={confirmUpload}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground text-sm mb-6">
                    Escolha uma opção para atualizar sua foto:
                  </p>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition-colors flex flex-col items-center space-y-2"
                    disabled={uploading}
                  >
                    <Camera className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Tirar Foto
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Use a câmera do seu celular
                    </span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition-colors flex flex-col items-center space-y-2"
                    disabled={uploading}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Escolher da Galeria
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Selecione uma foto existente
                    </span>
                  </button>
                  <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
                    <p>• Apenas imagens (JPG, PNG)</p>
                    <p>• Tamanho máximo: 5MB</p>
                    <p>
                      • Para melhores resultados, use uma foto em que você
                      apareça claramente
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
