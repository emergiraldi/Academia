import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Upload,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface StudentMedicalExamsProps {
  student: any;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function StudentMedicalExams({
  student,
  onBack,
  onSuccess,
}: StudentMedicalExamsProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [examFile, setExamFile] = useState<File | null>(null);
  const [acceptedTerm, setAcceptedTerm] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);

  // Query para buscar exames do aluno
  const { data: exams = [], refetch } = trpc.medicalExams.myExams.useQuery();

  // Mutation para upload
  const uploadExamMutation = trpc.medicalExams.upload.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }

    setExamFile(file);
  };

  const handleUpload = async () => {
    if (!examFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    if (!acceptedTerm) {
      toast.error("Você precisa aceitar o termo de responsabilidade");
      return;
    }

    if (!examDate || !expiryDate) {
      toast.error("Informe a data do exame e a data de validade");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URI prefix if present
          const base64Data = base64String.includes(",")
            ? base64String.split(",")[1]
            : base64String;
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(examFile);
      const documentData = await base64Promise;

      // Upload exam
      await uploadExamMutation.mutateAsync({
        examDate,
        expiryDate,
        documentData,
        termAccepted: acceptedTerm,
      });

      toast.success("Exame enviado com sucesso!");
      setShowUploadModal(false);
      setExamFile(null);
      setAcceptedTerm(false);
      setExamDate("");
      setExpiryDate("");
      refetch();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao enviar exame:", error);
      toast.error(error.message || "Erro ao enviar exame. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "expired":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "valid":
        return "Válido";
      case "pending":
        return "Pendente";
      case "expired":
        return "Expirado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
          <h1 className="text-xl font-bold">Exames Médicos</h1>
        </div>
        <p className="text-sm text-white/90 ml-11">
          Mantenha seus exames atualizados
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">
                  Exame médico obrigatório
                </p>
                <p className="text-sm text-blue-700">
                  Faça upload do seu atestado médico para liberar o acesso à
                  academia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Button */}
        <Button
          onClick={() => setShowUploadModal(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Enviar Novo Exame
        </Button>

        {/* List of Exams */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800">Meus Exames</h3>
          {exams.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhum exame cadastrado</p>
                <p className="text-sm text-gray-500 mt-1">
                  Envie seu primeiro exame médico
                </p>
              </CardContent>
            </Card>
          ) : (
            exams.map((exam: any) => (
              <Card key={exam.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(exam.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900">
                            Exame Médico
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                              exam.status
                            )}`}
                          >
                            {getStatusLabel(exam.status)}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Data do exame:{" "}
                            {new Date(exam.examDate).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Validade:{" "}
                            {new Date(exam.expiryDate).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                        {exam.documentUrl && (
                          <a
                            href={exam.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                          >
                            <FileText className="w-4 h-4" />
                            Ver documento
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Upload de Exame Médico</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setExamFile(null);
                    setAcceptedTerm(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Term */}
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  <h4 className="font-semibold mb-2 text-sm">
                    Termo de Responsabilidade
                  </h4>
                  <div className="text-xs space-y-2 text-gray-700">
                    <p>
                      Declaro que estou em plenas condições de saúde para a
                      prática de atividades físicas e que não possuo nenhuma
                      restrição médica que impeça minha participação.
                    </p>
                    <p>
                      Comprometo-me a apresentar atestado médico atualizado
                      sempre que solicitado e a informar imediatamente qualquer
                      alteração em meu estado de saúde.
                    </p>
                    <p>
                      Estou ciente de que a prática de exercícios físicos
                      envolve riscos e que a academia não se responsabiliza por
                      problemas de saúde decorrentes de informações falsas ou
                      omissão de condições médicas pré-existentes.
                    </p>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="accept-term"
                    checked={acceptedTerm}
                    onCheckedChange={(checked) =>
                      setAcceptedTerm(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="accept-term"
                    className="text-sm leading-tight cursor-pointer"
                  >
                    Li e aceito o termo de responsabilidade
                  </label>
                </div>

                {/* Exam Date */}
                <div>
                  <Label htmlFor="exam-date">Data do Exame</Label>
                  <Input
                    id="exam-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    disabled={!acceptedTerm}
                    className="mt-1"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <Label htmlFor="expiry-date">Data de Validade</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    disabled={!acceptedTerm}
                    className="mt-1"
                  />
                </div>

                {/* File Input */}
                <div>
                  <Label htmlFor="exam-file">
                    Arquivo do Exame (PDF ou Imagem)
                  </Label>
                  <Input
                    id="exam-file"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    disabled={!acceptedTerm}
                    className="mt-1"
                  />
                  {examFile && (
                    <p className="text-xs text-gray-600 mt-1">
                      Arquivo selecionado: {examFile.name}
                    </p>
                  )}
                </div>

                {/* Upload Button */}
                <Button
                  onClick={handleUpload}
                  disabled={
                    !examFile ||
                    !acceptedTerm ||
                    !examDate ||
                    !expiryDate ||
                    uploading
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Exame
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
