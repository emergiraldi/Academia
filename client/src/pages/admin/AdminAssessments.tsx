import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Ruler,
  Weight,
  Target,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useGym } from "@/_core/hooks/useGym";

export default function AdminAssessments() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { gymSlug } = useGym();

  // Form state
  const [formData, setFormData] = useState({
    studentId: "",
    assessmentDate: new Date().toISOString().split('T')[0],
    weightKg: "",
    heightCm: "",
    bodyFatPercentage: "",
    muscleMassKg: "",
    chestCm: "",
    waistCm: "",
    hipCm: "",
    rightArmCm: "",
    leftArmCm: "",
    rightThighCm: "",
    leftThighCm: "",
    rightCalfCm: "",
    leftCalfCm: "",
    notes: "",
    goals: "",
  });

  // Queries
  const { data: assessments = [], refetch: refetchAssessments } = trpc.assessments.list.useQuery({ studentId: undefined });
  const { data: students = [] } = trpc.students.listAll.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });

  // Mutations
  const createAssessment = trpc.assessments.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação cadastrada com sucesso!");
      setAddModalOpen(false);
      resetForm();
      refetchAssessments();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar avaliação");
    },
  });

  const resetForm = () => {
    setFormData({
      studentId: "",
      assessmentDate: new Date().toISOString().split('T')[0],
      weightKg: "",
      heightCm: "",
      bodyFatPercentage: "",
      muscleMassKg: "",
      chestCm: "",
      waistCm: "",
      hipCm: "",
      rightArmCm: "",
      leftArmCm: "",
      rightThighCm: "",
      leftThighCm: "",
      rightCalfCm: "",
      leftCalfCm: "",
      notes: "",
      goals: "",
    });
  };

  // Calcular IMC automaticamente
  const calculateBMI = (weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const handleSubmit = () => {
    if (!formData.studentId || !formData.weightKg || !formData.heightCm) {
      toast.error("Preencha os campos obrigatórios: Aluno, Peso e Altura");
      return;
    }

    const weight = parseFloat(formData.weightKg);
    const height = parseFloat(formData.heightCm);
    const bmi = calculateBMI(weight, height);

    createAssessment.mutate({
      studentId: parseInt(formData.studentId),
      assessmentDate: formData.assessmentDate,
      weightKg: weight,
      heightCm: height,
      bmi,
      bodyFatPercentage: formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : undefined,
      muscleMassKg: formData.muscleMassKg ? parseFloat(formData.muscleMassKg) : undefined,
      chestCm: formData.chestCm ? parseFloat(formData.chestCm) : undefined,
      waistCm: formData.waistCm ? parseFloat(formData.waistCm) : undefined,
      hipCm: formData.hipCm ? parseFloat(formData.hipCm) : undefined,
      rightArmCm: formData.rightArmCm ? parseFloat(formData.rightArmCm) : undefined,
      leftArmCm: formData.leftArmCm ? parseFloat(formData.leftArmCm) : undefined,
      rightThighCm: formData.rightThighCm ? parseFloat(formData.rightThighCm) : undefined,
      leftThighCm: formData.leftThighCm ? parseFloat(formData.leftThighCm) : undefined,
      rightCalfCm: formData.rightCalfCm ? parseFloat(formData.rightCalfCm) : undefined,
      leftCalfCm: formData.leftCalfCm ? parseFloat(formData.leftCalfCm) : undefined,
      notes: formData.notes || undefined,
      goals: formData.goals || undefined,
    });
  };

  const filteredAssessments = assessments.filter((assessment: any) =>
    searchTerm === "" ||
    assessment.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAssessments = assessments.length;
  const avgIMC = assessments.length > 0
    ? assessments.reduce((sum: number, a: any) => sum + (a.bmi || 0), 0) / assessments.length
    : 0;
  const avgBodyFat = assessments.length > 0
    ? assessments.reduce((sum: number, a: any) => sum + (a.bodyFatPercentage || 0), 0) / assessments.length
    : 0;

  const getIMCStatus = (imc: number) => {
    if (imc < 18.5) return { label: "Abaixo", color: "bg-blue-100 text-blue-800" };
    if (imc < 25) return { label: "Normal", color: "bg-green-100 text-green-800" };
    if (imc < 30) return { label: "Sobrepeso", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Obesidade", color: "bg-red-100 text-red-800" };
  };

  const uniqueStudents = new Set(assessments.map((a: any) => a.studentId)).size;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin/dashboard")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Avaliações Físicas</h1>
              <p className="text-muted-foreground">
                Acompanhamento de medidas e evolução dos alunos
              </p>
            </div>
          </div>
          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Registrar Nova Avaliação</DialogTitle>
                <DialogDescription>
                  Cadastre medidas corporais e composição física
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Aluno *</Label>
                    <Select
                      value={formData.studentId}
                      onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={formData.assessmentDate}
                      onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Peso (kg) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="75.5"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Altura (cm) *</Label>
                    <Input
                      type="number"
                      placeholder="175"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Gordura (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="20.5"
                      value={formData.bodyFatPercentage}
                      onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Massa Muscular (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="60"
                      value={formData.muscleMassKg}
                      onChange={(e) => setFormData({ ...formData, muscleMassKg: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3">Perimetria (Medidas em cm)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Peitoral</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="95"
                        value={formData.chestCm}
                        onChange={(e) => setFormData({ ...formData, chestCm: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Cintura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="85"
                        value={formData.waistCm}
                        onChange={(e) => setFormData({ ...formData, waistCm: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Quadril</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="95"
                        value={formData.hipCm}
                        onChange={(e) => setFormData({ ...formData, hipCm: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Braço Direito</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="32"
                        value={formData.rightArmCm}
                        onChange={(e) => setFormData({ ...formData, rightArmCm: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Braço Esquerdo</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="32"
                        value={formData.leftArmCm}
                        onChange={(e) => setFormData({ ...formData, leftArmCm: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Coxa Direita</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="55"
                        value={formData.rightThighCm}
                        onChange={(e) => setFormData({ ...formData, rightThighCm: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Coxa Esquerda</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="55"
                        value={formData.leftThighCm}
                        onChange={(e) => setFormData({ ...formData, leftThighCm: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Panturrilha Direita</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="38"
                        value={formData.rightCalfCm}
                        onChange={(e) => setFormData({ ...formData, rightCalfCm: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Panturrilha Esquerda</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="38"
                        value={formData.leftCalfCm}
                        onChange={(e) => setFormData({ ...formData, leftCalfCm: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
                    <div>
                      <Label>Objetivos/Metas</Label>
                      <Textarea
                        placeholder="Ex: Perder 5kg, ganhar massa muscular..."
                        value={formData.goals}
                        onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Textarea
                        placeholder="Anotações gerais sobre a avaliação..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={createAssessment.isLoading}
                >
                  {createAssessment.isLoading ? "Cadastrando..." : "Cadastrar Avaliação"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Avaliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAssessments}</div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                IMC Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgIMC.toFixed(1)}</div>
              <p className="text-sm text-muted-foreground mt-1">kg/m²</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                % Gordura Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgBodyFat.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alunos Avaliados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {uniqueStudents}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Buscar</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nome do aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Assessments Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Todas as Avaliações</CardTitle>
            <CardDescription>
              {filteredAssessments.length} avaliação(ões) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Altura</TableHead>
                  <TableHead>IMC</TableHead>
                  <TableHead>% Gordura</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma avaliação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssessments.map((assessment: any) => {
                    const imcStatus = getIMCStatus(assessment.bmi || 0);
                    return (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.studentName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {new Date(assessment.assessmentDate).toLocaleDateString("pt-BR")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Weight className="w-3 h-3 text-muted-foreground" />
                            {assessment.weightKg} kg
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Ruler className="w-3 h-3 text-muted-foreground" />
                            {assessment.heightCm} cm
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {assessment.bmi ? assessment.bmi.toFixed(1) : "-"}
                        </TableCell>
                        <TableCell>
                          {assessment.bodyFatPercentage ? `${assessment.bodyFatPercentage}%` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={imcStatus.color}>{imcStatus.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
