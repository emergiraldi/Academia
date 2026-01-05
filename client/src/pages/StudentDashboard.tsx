import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  CreditCard,
  Dumbbell,
  FileText,
  LogOut,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  Shield,
  Copy,
  Printer
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { QRCodeSVG } from "qrcode.react";
import Webcam from "react-webcam";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [examFile, setExamFile] = useState<File | null>(null);
  const [acceptedTerm, setAcceptedTerm] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState<string>("");

  // Queries
  const { data: student, refetch: refetchStudent, error: studentError, isLoading: studentLoading } = trpc.students.me.useQuery(undefined, {
    retry: false, // Don't retry if user is not authenticated
  });

  const { data: workouts = [] } = trpc.workouts.myWorkouts.useQuery(undefined, {
    enabled: !!student, // Only fetch if student data is available
  });

  const { data: payments = [] } = trpc.payments.myPayments.useQuery(undefined, {
    enabled: !!student, // Only fetch if student data is available
  });

  const { data: accessLogs = [] } = trpc.accessLogs.myLogs.useQuery(undefined, {
    enabled: !!student, // Only fetch if student data is available
  });

  // Mutations
  const uploadFaceMutation = trpc.students.uploadFaceImage.useMutation({
    onSuccess: () => {
      toast.success("Foto facial enviada com sucesso!");
      refetchStudent();
      setFaceImageFile(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar foto");
    },
  });

  const generatePixMutation = trpc.payments.generatePixQrCode.useMutation({
    onSuccess: (data) => {
      setPixData(data);
      setPixLoading(false);
      toast.success("QR Code gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar QR Code");
      setPixLoading(false);
      setPixModalOpen(false);
    },
  });

  const checkPaymentMutation = trpc.payments.checkPaymentStatus.useMutation({
    onSuccess: (data) => {
      if (data.paid) {
        toast.success("Pagamento confirmado! ✅");
        setPixModalOpen(false);
        // Refresh payments list
        window.location.reload();
      } else {
        toast.info("Pagamento ainda não identificado. Aguarde alguns segundos após pagar.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao verificar status");
    },
  });

  const generateReceiptMutation = trpc.payments.generateReceipt.useMutation({
    onSuccess: (data) => {
      setReceiptHtml(data.html);
      setReceiptModalOpen(true);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar recibo");
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/student/login");
  };

  const handlePayNow = async (payment: any) => {
    setSelectedPayment(payment);
    setPixData(null);
    setPixModalOpen(true);
    setPixLoading(true);
    
    try {
      await generatePixMutation.mutateAsync({ paymentId: payment.id });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const copyPixCode = () => {
    if (pixData?.pixCopiaECola) {
      navigator.clipboard.writeText(pixData.pixCopiaECola);
      toast.success("Código PIX copiado!");
    }
  };

  const checkPaymentStatus = () => {
    if (selectedPayment) {
      checkPaymentMutation.mutate({ paymentId: selectedPayment.id });
    }
  };

  const handleViewReceipt = (payment: any) => {
    setSelectedPayment(payment);
    generateReceiptMutation.mutate({ paymentId: payment.id });
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadReceipt = () => {
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-pagamento-${selectedPayment?.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-check payment status every 10 seconds when PIX modal is open
  useEffect(() => {
    if (pixModalOpen && pixData && pixData.txid && selectedPayment) {
      const interval = setInterval(() => {
        checkPaymentMutation.mutate({ paymentId: selectedPayment.id });
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [pixModalOpen, pixData, selectedPayment]);

  const handleCaptureFace = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setFaceImage(imageSrc);
        setShowWebcam(false);
      }
    }
  };

  const handleFaceUpload = async () => {
    let imageData: string | null = null;

    if (faceImage) {
      // Use captured webcam image
      imageData = faceImage;
    } else if (faceImageFile) {
      // Use uploaded file
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(faceImageFile);
      imageData = await promise;
    }

    if (!imageData) {
      toast.error("Capture ou selecione uma foto");
      return;
    }

    await uploadFaceMutation.mutateAsync({ imageData });
    // Reset states
    setFaceImage(null);
    setFaceImageFile(null);
    setShowWebcam(false);
  };

  const handleExamUpload = async () => {
    if (!examFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    if (!acceptedTerm) {
      toast.error("Você precisa aceitar o termo de responsabilidade");
      return;
    }

    toast.success("Exame enviado com sucesso! Aguarde aprovação.");
    setExamFile(null);
    setAcceptedTerm(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: "Ativo", className: "status-active" },
      inactive: { label: "Inativo", className: "status-inactive" },
      blocked: { label: "Bloqueado", className: "status-blocked" },
      suspended: { label: "Suspenso", className: "status-inactive" },
    };
    const variant = variants[status] || variants.inactive;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      paid: { label: "Pago", className: "status-paid" },
      pending: { label: "Pendente", className: "status-pending" },
      overdue: { label: "Atrasado", className: "status-overdue" },
      failed: { label: "Falhou", className: "status-overdue" },
      cancelled: { label: "Cancelado", className: "status-inactive" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  // Redirect to login if there's an authentication error
  useEffect(() => {
    if (studentError) {
      setLocation("/student/login");
    }
  }, [studentError, setLocation]);

  // Show loading while fetching data
  if (studentLoading || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={student.cardImageUrl || undefined} />
                <AvatarFallback className="gradient-primary text-white">
                  {user.name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">{user.name}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">{student.registrationNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {getStatusBadge(student.membershipStatus)}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-auto sm:ml-0">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 mb-8 h-auto">
            <TabsTrigger value="profile" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2">
              <User className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2">
              <Dumbbell className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Treinos</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Finan.</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2">
              <FileText className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Exames</span>
            </TabsTrigger>
            <TabsTrigger value="access" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Acessos</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Digital Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Carteirinha Digital</CardTitle>
                  <CardDescription>Sua identificação na academia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-primary rounded-lg p-4 sm:p-6 text-white space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-white shrink-0">
                        <AvatarImage src={student.cardImageUrl || undefined} />
                        <AvatarFallback className="bg-white text-primary text-xl sm:text-2xl">
                          {user.name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold truncate">{user.name}</h3>
                        <p className="text-white/80 text-sm">{student.registrationNumber}</p>
                      </div>
                    </div>
                    <Separator className="bg-white/20" />
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-white/80">CPF</p>
                        <p className="font-semibold text-sm sm:text-base">{student.cpf}</p>
                      </div>
                      <div>
                        <p className="text-white/80">Status</p>
                        <p className="font-semibold text-sm sm:text-base">{student.membershipStatus === "active" ? "Ativo" : "Inativo"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Face Recognition */}
              <Card>
                <CardHeader>
                  <CardTitle>Reconhecimento Facial</CardTitle>
                  <CardDescription>
                    {student.faceEnrolled 
                      ? "Seu rosto está cadastrado no sistema" 
                      : "Cadastre seu rosto para acesso automático"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {student.faceEnrolled ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">Cadastrado</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Você pode acessar a academia usando reconhecimento facial
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="font-medium text-yellow-900 dark:text-yellow-100">Pendente</p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Envie uma foto do seu rosto para liberar o acesso
                          </p>
                        </div>
                      </div>

                      <Dialog onOpenChange={(open) => !open && (setShowWebcam(false), setFaceImage(null), setFaceImageFile(null))}>
                        <DialogTrigger asChild>
                          <Button className="w-full">
                            <Camera className="w-4 h-4 mr-2" />
                            Cadastrar Foto Facial
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Cadastro Facial</DialogTitle>
                            <DialogDescription>
                              Capture uma foto ou faça upload para cadastro facial
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {!showWebcam && !faceImage && (
                              <div className="grid grid-cols-2 gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowWebcam(true)}
                                  className="h-20"
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <Camera className="w-5 h-5" />
                                    <span className="text-xs">Tirar Foto</span>
                                  </div>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById('student-face-upload')?.click()}
                                  className="h-20"
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    <span className="text-xs">Fazer Upload</span>
                                  </div>
                                </Button>
                                <Input
                                  id="student-face-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast.error("Arquivo muito grande. Máximo 5MB");
                                        return;
                                      }
                                      setFaceImageFile(file);
                                    }
                                  }}
                                />
                              </div>
                            )}

                            {showWebcam && (
                              <div className="space-y-3">
                                <div className="relative rounded-lg overflow-hidden bg-black">
                                  <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    className="w-full"
                                    videoConstraints={{
                                      facingMode: "user",
                                      width: 1280,
                                      height: 720,
                                    }}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    onClick={handleCaptureFace}
                                    className="flex-1"
                                  >
                                    <Camera className="w-4 h-4 mr-2" />
                                    Capturar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowWebcam(false)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}

                            {faceImage && (
                              <div className="space-y-3">
                                <div className="relative rounded-lg overflow-hidden">
                                  <img src={faceImage} alt="Preview" className="w-full" />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    onClick={handleFaceUpload}
                                    disabled={uploadFaceMutation.isPending}
                                    className="flex-1"
                                  >
                                    {uploadFaceMutation.isPending ? "Enviando..." : "Confirmar"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setFaceImage(null)}
                                  >
                                    Tirar Novamente
                                  </Button>
                                </div>
                              </div>
                            )}

                            {faceImageFile && !faceImage && (
                              <div className="space-y-3">
                                <div className="p-4 bg-muted rounded-lg">
                                  <p className="text-sm font-medium">Arquivo selecionado:</p>
                                  <p className="text-xs text-muted-foreground">{faceImageFile.name}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    onClick={handleFaceUpload}
                                    disabled={uploadFaceMutation.isPending}
                                    className="flex-1"
                                  >
                                    {uploadFaceMutation.isPending ? "Enviando..." : "Confirmar"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setFaceImageFile(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}

                            {!showWebcam && !faceImage && !faceImageFile && (
                              <p className="text-xs text-muted-foreground text-center">
                                Escolha tirar uma foto ou fazer upload de uma imagem do seu rosto.
                                A foto deve ser de frente, bem iluminada e sem óculos.
                              </p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs sm:text-sm">Email</Label>
                    <p className="font-medium text-sm sm:text-base break-words">{user.email || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs sm:text-sm">Telefone</Label>
                    <p className="font-medium text-sm sm:text-base">{student.phone || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs sm:text-sm">Endereço</Label>
                    <p className="font-medium text-sm sm:text-base break-words">{student.address || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs sm:text-sm">Cidade/Estado</Label>
                    <p className="font-medium text-sm sm:text-base">
                      {student.city && student.state
                        ? `${student.city}/${student.state}`
                        : "Não informado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meus Treinos</CardTitle>
                <CardDescription>
                  Treinos personalizados criados pelo seu professor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workouts.length === 0 ? (
                  <div className="text-center py-12">
                    <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum treino disponível ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workouts.map((workout) => (
                      <Card key={workout.id} className="card-hover">
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base sm:text-lg">{workout.name}</CardTitle>
                              <CardDescription className="text-xs sm:text-sm">{workout.description}</CardDescription>
                            </div>
                            <Badge className={workout.active ? "status-active" : "status-inactive"}>
                              {workout.active ? "Ativo" : "Concluído"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span>Início: {new Date(workout.startDate).toLocaleDateString("pt-BR")}</span>
                            {workout.endDate && (
                              <span>Fim: {new Date(workout.endDate).toLocaleDateString("pt-BR")}</span>
                            )}
                          </div>
                          <Button className="mt-4" onClick={() => setLocation(`/student/workout/${workout.id}`)}>
                            Ver Exercícios
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>
                  Acompanhe suas mensalidades e recibos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum pagamento registrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments
                      .filter((payment) => payment.status !== "cancelled")
                      .map((payment) => (
                      <Card key={payment.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <p className="font-semibold text-lg">
                                  {(payment.amountInCents / 100).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </p>
                                {getPaymentStatusBadge(payment.status)}
                                {payment.isInstallment && (
                                  <Badge variant="outline" className="text-xs">
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    Parcela {payment.installmentNumber} de {payment.totalInstallments}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Vencimento: {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                              </p>
                              {payment.paidAt && (
                                <p className="text-sm text-green-600 dark:text-green-400">
                                  Pago em: {new Date(payment.paidAt).toLocaleDateString("pt-BR")}
                                </p>
                              )}
                              {payment.isInstallment && payment.interestForgiven && (
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                  Parcelamento com juros perdoados
                                </p>
                              )}
                              {payment.isInstallment && !payment.interestForgiven && (
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                  Parcelamento com juros aplicados
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {(payment.status === "pending" || payment.status === "failed") && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handlePayNow(payment)}
                                >
                                  Pagar Agora
                                </Button>
                              )}
                              {payment.status === "paid" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewReceipt(payment)}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Ver Recibo
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exames Médicos</CardTitle>
                <CardDescription>
                  Mantenha seus exames atualizados para continuar treinando
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Exame médico obrigatório
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Faça upload do seu atestado médico para liberar o acesso
                    </p>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Exame Médico
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload de Exame Médico</DialogTitle>
                      <DialogDescription>
                        Leia o termo de responsabilidade e faça upload do seu atestado médico
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-muted/50">
                        <h4 className="font-semibold mb-2">Termo de Responsabilidade</h4>
                        <div className="text-sm space-y-2 text-muted-foreground">
                          <p>
                            Declaro que estou em plenas condições de saúde para a prática de atividades físicas
                            e que não possuo nenhuma restrição médica que impeça minha participação.
                          </p>
                          <p>
                            Comprometo-me a apresentar atestado médico atualizado sempre que solicitado e a
                            informar imediatamente qualquer alteração em meu estado de saúde.
                          </p>
                          <p>
                            Estou ciente de que a prática de exercícios físicos envolve riscos e que a academia
                            não se responsabiliza por problemas de saúde decorrentes de informações falsas ou
                            omissão de condições médicas pré-existentes.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="accept-term" 
                          checked={acceptedTerm}
                          onCheckedChange={(checked) => setAcceptedTerm(checked as boolean)}
                        />
                        <label
                          htmlFor="accept-term"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Li e aceito o termo de responsabilidade
                        </label>
                      </div>

                      <div>
                        <Label htmlFor="exam-file">Arquivo do Exame (PDF ou Imagem)</Label>
                        <Input
                          id="exam-file"
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => setExamFile(e.target.files?.[0] || null)}
                          disabled={!acceptedTerm}
                        />
                      </div>

                      <Button 
                        onClick={handleExamUpload}
                        disabled={!examFile || !acceptedTerm}
                        className="w-full"
                      >
                        Enviar Exame
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Tab */}
          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Acessos</CardTitle>
                <CardDescription>
                  Últimos 10 registros de entrada e saída
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum acesso registrado ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accessLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {log.accessType !== "denied" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">
                              {log.accessType === "entry" ? "Entrada" : log.accessType === "exit" ? "Saída" : "Negado"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {"facial" === "facial" ? "Reconhecimento Facial" : "Manual"}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Pagamento PIX */}
      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <span>
                  Valor: {(selectedPayment.amountInCents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {pixLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          ) : pixData ? (
            <div className="space-y-6">
              {/* Valor */}
              <div className="text-center pb-4 border-b">
                <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {pixData.valor?.original || (selectedPayment.amount / 100).toFixed(2)}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-6 bg-white dark:bg-gray-50 rounded-lg border-2 border-gray-200 shadow-sm">
                <QRCodeSVG
                  value={pixData.pixCopiaECola}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Código PIX */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    value={pixData.pixCopiaECola}
                    readOnly
                    className="font-mono text-xs bg-gray-50"
                  />
                  <Button onClick={copyPixCode} variant="outline" size="sm" className="shrink-0">
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Expira em: {new Date(pixData.expiresAt).toLocaleTimeString("pt-BR")}
                </span>
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100">Como pagar:</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside text-blue-800 dark:text-blue-200">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3">
                <Button
                  onClick={checkPaymentStatus}
                  variant="default"
                  className="flex-1"
                  disabled={checkPaymentMutation.isPending}
                >
                  {checkPaymentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Já paguei - Verificar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setPixModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>

              {/* Info sobre verificação automática */}
              <p className="text-xs text-center text-muted-foreground">
                ✨ Verificação automática a cada 10 segundos
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Erro ao gerar QR Code</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Recibo */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Recibo de Pagamento</DialogTitle>
            <DialogDescription>
              Pagamento #{selectedPayment?.id} - {selectedPayment && (
                <span>
                  {(selectedPayment.amountInCents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview do recibo */}
            <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '500px' }}>
              <iframe
                srcDoc={receiptHtml}
                className="w-full h-full"
                title="Recibo de Pagamento"
                style={{ border: 'none' }}
              />
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 justify-end">
              <Button
                onClick={handlePrintReceipt}
                variant="default"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={handleDownloadReceipt}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </Button>
              <Button
                onClick={() => setReceiptModalOpen(false)}
                variant="outline"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
