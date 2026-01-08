import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { trpc } from "@/lib/trpc";
import { useGym } from "@/_core/hooks/useGym";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Edit, Trash2, Search, Mail, Phone, Calendar, CreditCard, CheckCircle, XCircle, DollarSign, Clock, AlertCircle, Camera, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { validateCPF, formatCPF, formatCEP, formatPhone, fetchAddressByCEP } from "@/lib/validators";

export default function AdminStudents() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [viewingStudentPayments, setViewingStudentPayments] = useState<any>(null);
  const [futureMonths, setFutureMonths] = useState(1);
  const [dueDay, setDueDay] = useState<string>("10");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [faceImage, setFaceImage] = useState<string>("");
  const [showWebcam, setShowWebcam] = useState(false);
  const [editFaceImage, setEditFaceImage] = useState<string>("");
  const [editShowWebcam, setEditShowWebcam] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    planId: "",
    professorId: "",
  });

  const { gymSlug } = useGym();

  const { data: students, refetch: refetchStudents } = trpc.students.listAll.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: plans } = trpc.plans.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: professors = [] } = trpc.professors.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: studentPayments = [], refetch: refetchPayments } = trpc.payments.getByStudent.useQuery(
    { gymSlug, studentId: viewingStudentPayments?.id || 0 },
    { enabled: !!viewingStudentPayments?.id }
  );
  
  const enrollFaceMutation = trpc.students.enrollFace.useMutation({
    onSuccess: () => {
      toast.success("Foto facial cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar foto facial: " + error.message);
    },
  });

  const createStudent = trpc.students.create.useMutation({
    onSuccess: async (data) => {
      toast.success("Aluno cadastrado com sucesso!");

      // If face image is captured, upload it to Control ID
      if (faceImage && data.studentId) {
        try {
          await enrollFaceMutation.mutateAsync({
            gymSlug,
            studentId: data.studentId,
            imageData: faceImage,
          });
        } catch (error) {
          console.error("Error enrolling face:", error);
        }
      }

      setIsCreateOpen(false);
      resetForm();
      setFaceImage("");
      setShowWebcam(false);
      refetchStudents();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar aluno");
    },
  });

  const updateStudent = trpc.students.update.useMutation({
    onSuccess: async (data, variables) => {
      toast.success("Aluno atualizado com sucesso!");

      // If face image is captured, upload it to Control ID
      if (editFaceImage && editingStudent?.id) {
        try {
          await enrollFaceMutation.mutateAsync({
            gymSlug,
            studentId: editingStudent.id,
            imageData: editFaceImage,
          });
        } catch (error) {
          console.error("Error enrolling face:", error);
        }
      }

      setIsEditOpen(false);
      setEditingStudent(null);
      setEditFaceImage("");
      setEditShowWebcam(false);
      resetForm();
      refetchStudents();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar aluno");
    },
  });

  const deleteStudent = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success("Aluno excluído com sucesso!");
      refetchStudents();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir aluno");
    },
  });

  const updateStatus = trpc.students.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetchStudents();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const generateFuturePayments = trpc.payments.generateMonthlyPayments.useMutation({
    onSuccess: (data) => {
      if (data.generated === 0) {
        toast.info("Mensalidades já foram geradas para os meses selecionados.");
      } else {
        toast.success(`${data.generated} mensalidade(s) gerada(s) com sucesso!`);
      }
      refetchPayments();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar mensalidades");
    },
  });

  // Webcam refs and capture functions
  const webcamRef = useRef<Webcam>(null);
  const editWebcamRef = useRef<Webcam>(null);

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFaceImage(imageSrc);
      setShowWebcam(false);
      toast.success("Foto capturada com sucesso!");
    }
  }, [webcamRef]);

  const captureEditPhoto = useCallback(() => {
    const imageSrc = editWebcamRef.current?.getScreenshot();
    if (imageSrc) {
      setEditFaceImage(imageSrc);
      setEditShowWebcam(false);
      toast.success("Foto capturada com sucesso!");
    }
  }, [editWebcamRef]);

  // File upload handler (converts to base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Tamanho máximo: 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit) {
        setEditFaceImage(base64String);
      } else {
        setFaceImage(base64String);
      }
      toast.success("Foto carregada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleStatusChange = (studentId: number, newStatus: string) => {
    updateStatus.mutate({
      gymSlug,
      studentId,
      membershipStatus: newStatus as "active" | "inactive" | "suspended" | "blocked",
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      cpf: "",
      phone: "",
      dateOfBirth: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      planId: "",
      professorId: "",
    });
  };

  // Buscar endereço pelo CEP
  const handleCEPBlur = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');

    if (cleanCEP.length !== 8) return;

    try {
      const address = await fetchAddressByCEP(cleanCEP);

      if (address) {
        setFormData(prev => ({
          ...prev,
          address: address.logradouro || prev.address,
          neighborhood: address.bairro || prev.neighborhood,
          city: address.localidade || prev.city,
          state: address.uf || prev.state,
          zipCode: formatCEP(cleanCEP),
        }));
        toast.success("Endereço encontrado!");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    }
  };

  // Validar e formatar CPF
  const handleCPFBlur = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length === 0) return;

    if (!validateCPF(cleanCPF)) {
      toast.error("CPF inválido");
      return;
    }

    setFormData(prev => ({ ...prev, cpf: formatCPF(cleanCPF) }));
  };

  // Formatar telefone automaticamente
  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, phone: formatPhone(phone) }));
  };

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.cpf || !formData.planId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!gymSlug) {
      toast.error("Academia não identificada");
      return;
    }

    // Validar CPF antes de criar
    const cleanCPF = formData.cpf.replace(/\D/g, '');
    if (!validateCPF(cleanCPF)) {
      toast.error("CPF inválido");
      return;
    }

    createStudent.mutate({
      gymSlug,
      ...formData,
      planId: parseInt(formData.planId),
      professorId: formData.professorId ? parseInt(formData.professorId) : undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingStudent) return;

    if (!gymSlug) {
      toast.error("Academia não identificada");
      return;
    }

    // Validar CPF se foi alterado
    if (formData.cpf) {
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      if (!validateCPF(cleanCPF)) {
        toast.error("CPF inválido");
        return;
      }
    }

    updateStudent.mutate({
      gymSlug,
      studentId: editingStudent.id,
      ...formData,
      planId: formData.planId ? parseInt(formData.planId) : undefined,
      professorId: formData.professorId ? parseInt(formData.professorId) : null,
    });
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || "",
      email: student.email || "",
      password: "",
      cpf: student.cpf || "",
      phone: student.phone || "",
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : "",
      address: student.address || "",
      number: student.number || "",
      complement: student.complement || "",
      neighborhood: student.neighborhood || "",
      city: student.city || "",
      state: student.state || "",
      zipCode: student.zipCode || "",
      planId: student.planId?.toString() || "",
      professorId: student.professorId?.toString() || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (studentId: number) => {
    if (confirm("Tem certeza que deseja excluir este aluno?")) {
      if (!gymSlug) {
        toast.error("Academia não identificada");
        return;
      }
      deleteStudent.mutate({ gymSlug, studentId });
    }
  };

  const handleViewPayments = (student: any) => {
    setViewingStudentPayments(student);
    setFutureMonths(1);
    setDueDay("10");
    setStartDate(new Date().toISOString().split("T")[0]);
    setIsPaymentsOpen(true);
  };

  const handleGenerateFuturePayments = () => {
    if (!viewingStudentPayments?.id) return;

    generateFuturePayments.mutate({
      studentIds: [viewingStudentPayments.id],
      monthsToGenerate: futureMonths,
      dueDay: parseInt(dueDay),
      startDate: new Date(startDate),
    });
  };

  const filteredStudents = students?.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cpf?.includes(searchTerm) ||
    student.registrationNumber?.includes(searchTerm)
  ) || [];

  const getPlanName = (planId: number | null) => {
    if (!planId) return "Sem plano";
    const plan = plans?.find(p => p.id === planId);
    return plan?.name || "Plano não encontrado";
  };

  const getMembershipStatus = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativo", variant: "default" },
      inactive: { label: "Inativo", variant: "secondary" },
      blocked: { label: "Bloqueado", variant: "destructive" },
    };
    return statusMap[status] || { label: status, variant: "outline" };
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <PageHeader
          title="Gestão de Alunos"
          description="Cadastre e gerencie todos os alunos da academia"
          action={
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-5 w-5" />
                  Novo Aluno
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="João da Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      onBlur={(e) => handleCPFBlur(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="joao@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      onBlur={(e) => handleCEPBlur(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Logradouro</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, Avenida, etc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                      placeholder="Apto, Bloco, etc"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Centro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planId">Plano de Mensalidade *</Label>
                    <Select value={formData.planId} onValueChange={(value) => setFormData({ ...formData, planId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.name} - R$ {(plan.priceInCents / 100).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="professorId">Professor Responsável (Opcional)</Label>
                    <Select value={formData.professorId} onValueChange={(value) => setFormData({ ...formData, professorId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um professor (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {professors?.map((professor: any) => (
                          <SelectItem key={professor.id} value={professor.id.toString()}>
                            {professor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cadastro Facial */}
                <div className="space-y-2 border-t pt-4">
                  <Label>Cadastro Facial (Opcional)</Label>
                  <div className="space-y-3">
                    {!faceImage && !showWebcam && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowWebcam(true)}
                          className="flex-1"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Capturar com Webcam
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('create-file-upload')?.click()}
                          className="flex-1"
                        >
                          Upload de Foto
                        </Button>
                        <input
                          id="create-file-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, false)}
                          className="hidden"
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
                              width: 1280,
                              height: 720,
                              facingMode: "user"
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={capturePhoto}
                            className="flex-1"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Capturar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowWebcam(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {faceImage && (
                      <div className="space-y-3">
                        <div className="relative rounded-lg overflow-hidden border">
                          <img
                            src={faceImage}
                            alt="Foto facial capturada"
                            className="w-full"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setFaceImage("");
                              setShowWebcam(true);
                            }}
                            className="flex-1"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Recapturar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('create-file-upload')?.click()}
                            className="flex-1"
                          >
                            Novo Upload
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFaceImage("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createStudent.isPending}>
                    {createStudent.isPending ? "Cadastrando..." : "Cadastrar Aluno"}
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          }
        />

        {/* Search */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, CPF ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum aluno cadastrado</h3>
              <p className="text-muted-foreground mb-6">Comece cadastrando o primeiro aluno</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Aluno
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredStudents.map((student, index) => {
              const statusInfo = getMembershipStatus(student.membershipStatus);
              const borderColors = ['border-l-blue-500', 'border-l-green-500', 'border-l-purple-500', 'border-l-orange-500'];
              return (
                <Card key={student.id} className={`border-l-4 ${borderColors[index % borderColors.length]} shadow-md hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold">{student.name}</h3>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          {student.registrationNumber && (
                            <Badge variant="outline">Mat. {student.registrationNumber}</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                          {student.cpf && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CreditCard className="h-4 w-4" />
                              <span>{student.cpf}</span>
                            </div>
                          )}
                          {student.dateOfBirth && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {(() => {
                                  try {
                                    const dateStr = String(student.dateOfBirth);
                                    // Extrai YYYY-MM-DD de qualquer formato (ISO, MySQL datetime, etc)
                                    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
                                    if (match) {
                                      const [, year, month, day] = match;
                                      return `${day}/${month}/${year}`;
                                    }
                                    return 'Data inválida';
                                  } catch {
                                    return 'Data inválida';
                                  }
                                })()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {student.faceEnrolled ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Biometria Cadastrada
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Biometria Pendente
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <Select
                              value={student.membershipStatus || 'inactive'}
                              onValueChange={(value) => handleStatusChange(student.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="inactive">Inativo</SelectItem>
                                <SelectItem value="suspended">Suspenso</SelectItem>
                                <SelectItem value="blocked">Bloqueado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleViewPayments(student)} title="Ver Mensalidades">
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleEdit(student)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(student.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Payments Dialog */}
        <Dialog open={isPaymentsOpen} onOpenChange={setIsPaymentsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mensalidades - {viewingStudentPayments?.name}</DialogTitle>
              <DialogDescription>
                Matrícula: {viewingStudentPayments?.registrationNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-yellow-500 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Pendente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {((studentPayments.filter((p: any) => p.status === "pending").reduce((sum: number, p: any) => sum + p.amountInCents, 0)) / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {studentPayments.filter((p: any) => p.status === "pending").length} mensalidade(s)
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {((studentPayments.filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + p.amountInCents, 0)) / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {studentPayments.filter((p: any) => p.status === "paid").length} mensalidade(s)
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Mensalidades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {studentPayments.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mensalidades registradas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Generate Future Payments */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Gerar Mensalidades</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Gere mensalidades futuras para este aluno
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="future-months">Quantas mensalidades gerar? *</Label>
                        <Input
                          id="future-months"
                          type="number"
                          min="1"
                          max="60"
                          value={futureMonths}
                          onChange={(e) => setFutureMonths(parseInt(e.target.value) || 1)}
                          placeholder="Ex: 12"
                        />
                        <p className="text-xs text-muted-foreground">
                          Digite a quantidade (1 a 60 meses)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="due-day">Dia de Vencimento *</Label>
                        <Input
                          id="due-day"
                          type="number"
                          min="1"
                          max="31"
                          value={dueDay}
                          onChange={(e) => setDueDay(e.target.value)}
                          placeholder="Ex: 10"
                        />
                        <p className="text-xs text-muted-foreground">
                          Dia do mês (1 a 31)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start-date">Mês de referência</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Primeiro mês a ser gerado
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Serão geradas {futureMonths} mensalidade{futureMonths > 1 ? 's' : ''}:
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {Array.from({ length: futureMonths }, (_, i) => {
                          const date = new Date(startDate);
                          date.setMonth(date.getMonth() + i);
                          return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
                        }).join(", ")}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Vencimento: Dia {dueDay} de cada mês
                      </p>
                    </div>

                    <Button
                      onClick={handleGenerateFuturePayments}
                      disabled={generateFuturePayments.isPending}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {generateFuturePayments.isPending ? "Gerando..." : `Gerar ${futureMonths} Mensalidade${futureMonths > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payments Table */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Histórico de Mensalidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Nenhuma mensalidade encontrada</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        studentPayments.map((payment: any) => {
                          const isOverdue = payment.status === "pending" && new Date(payment.dueDate) < new Date();
                          return (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {(payment.amountInCents / 100).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </TableCell>
                              <TableCell>
                                {payment.status === "paid" ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Pago
                                  </Badge>
                                ) : isOverdue ? (
                                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Atrasado
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pendente
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {payment.paidAt
                                  ? new Date(payment.paidAt).toLocaleDateString("pt-BR")
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPaymentsOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cpf">CPF</Label>
                  <Input
                    id="edit-cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    onBlur={(e) => handleCPFBlur(e.target.value)}
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dateOfBirth">Data de Nascimento</Label>
                  <Input
                    id="edit-dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-zipCode">CEP</Label>
                  <Input
                    id="edit-zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    onBlur={(e) => handleCEPBlur(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-number">Número</Label>
                  <Input
                    id="edit-number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Logradouro</Label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, Avenida, etc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-complement">Complemento</Label>
                  <Input
                    id="edit-complement"
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    placeholder="Apto, Bloco, etc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-neighborhood">Bairro</Label>
                  <Input
                    id="edit-neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Centro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Cidade</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">Estado</Label>
                  <Input
                    id="edit-state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-planId">Plano de Mensalidade</Label>
                  <Select value={formData.planId} onValueChange={(value) => setFormData({ ...formData, planId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} - R$ {(plan.priceInCents / 100).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-professorId">Professor Responsável (Opcional)</Label>
                  <Select value={formData.professorId} onValueChange={(value) => setFormData({ ...formData, professorId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um professor (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {professors?.map((professor: any) => (
                        <SelectItem key={professor.id} value={professor.id.toString()}>
                          {professor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cadastro Facial */}
              <div className="space-y-2 border-t pt-4">
                <Label>Cadastro Facial (Opcional)</Label>
                <div className="space-y-3">
                  {!editFaceImage && !editShowWebcam && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditShowWebcam(true)}
                        className="flex-1"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Capturar com Webcam
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('edit-file-upload')?.click()}
                        className="flex-1"
                      >
                        Upload de Foto
                      </Button>
                      <input
                        id="edit-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </div>
                  )}

                  {editShowWebcam && (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden bg-black">
                        <Webcam
                          ref={editWebcamRef}
                          audio={false}
                          screenshotFormat="image/jpeg"
                          className="w-full"
                          videoConstraints={{
                            width: 1280,
                            height: 720,
                            facingMode: "user"
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={captureEditPhoto}
                          className="flex-1"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Capturar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditShowWebcam(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {editFaceImage && (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden border">
                        <img
                          src={editFaceImage}
                          alt="Foto facial capturada"
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditFaceImage("");
                            setEditShowWebcam(true);
                          }}
                          className="flex-1"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Recapturar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('edit-file-upload')?.click()}
                          className="flex-1"
                        >
                          Novo Upload
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditFaceImage("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate} disabled={updateStudent.isPending}>
                  {updateStudent.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
