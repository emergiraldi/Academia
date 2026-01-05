import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, Check, Loader2, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface StudentFaceEnrollmentProps {
  student: any;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function StudentFaceEnrollment({ student, onBack, onSuccess }: StudentFaceEnrollmentProps) {
  const [photoPreview, setPhotoPreview] = useState<{ file: Blob; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [enrolled, setEnrolled] = useState(student?.faceEnrolled || false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadFaceMutation = trpc.students.uploadFaceImage.useMutation();

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

  const uploadPhoto = async () => {
    if (!photoPreview) return;

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

      reader.readAsDataURL(photoPreview.file);
      const base64Data = await base64Promise;

      // Call the tRPC mutation
      await uploadFaceMutation.mutateAsync({
        faceImageData: base64Data,
      });

      setEnrolled(true);
      setPhotoPreview(null);
      toast.success("Cadastro facial realizado com sucesso!");

      // Trigger parent component refresh
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro no cadastro facial:", error);
      toast.error(error.message || "Erro ao cadastrar foto facial. Tente novamente.");
    } finally {
      setUploading(false);
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
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Cadastro Facial</h1>
        </div>
        <p className="text-sm text-white/90 ml-11">
          Configure seu acesso biométrico
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        {enrolled ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-green-900 mb-2">
                    Cadastro Facial Ativo
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    Seu rosto já está cadastrado no sistema de controle de acesso. Você pode utilizar a leitora facial para entrar na academia.
                  </p>
                  <Button
                    onClick={() => setEnrolled(false)}
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-100"
                  >
                    Recadastrar Foto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-blue-900 mb-2">
                    Cadastro Não Realizado
                  </h3>
                  <p className="text-sm text-blue-700">
                    Cadastre sua foto facial para ter acesso à academia através da leitora biométrica.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        {!enrolled && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Como fazer o cadastro:</h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                    1
                  </span>
                  <span>Tire uma foto do seu rosto ou escolha uma foto existente</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                    2
                  </span>
                  <span>Certifique-se de que seu rosto está bem iluminado e visível</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                    3
                  </span>
                  <span>Olhe diretamente para a câmera, sem óculos escuros ou acessórios que cubram o rosto</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                    4
                  </span>
                  <span>Confirme o envio e aguarde a confirmação</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Preview ou Botões de Captura */}
        <Card>
          <CardContent className="p-6">
            {photoPreview ? (
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4">Confirmar Foto</h3>
                <div className="w-full max-w-sm mx-auto bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={photoPreview.url}
                    alt="Preview"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Certifique-se de que seu rosto está bem visível
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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                    onClick={uploadPhoto}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
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
                <h3 className="font-bold text-lg mb-4">Capture sua Foto</h3>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center space-y-3"
                  disabled={uploading}
                >
                  <Camera className="w-12 h-12 text-gray-400" />
                  <span className="text-base font-medium text-gray-700">
                    Tirar Foto
                  </span>
                  <span className="text-sm text-gray-500">
                    Use a câmera do seu dispositivo
                  </span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center space-y-3"
                  disabled={uploading}
                >
                  <Upload className="w-12 h-12 text-gray-400" />
                  <span className="text-base font-medium text-gray-700">
                    Escolher da Galeria
                  </span>
                  <span className="text-sm text-gray-500">
                    Selecione uma foto existente
                  </span>
                </button>
              </div>
            )}
          </CardContent>
        </Card>

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
  );
}
