import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calendar,
  Ruler,
  Weight,
  ArrowLeft,
  BarChart3,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useGym } from "@/_core/hooks/useGym";
import PhysicalAssessmentForm from "@/components/PhysicalAssessmentForm";
import AssessmentComparative from "@/components/AssessmentComparative";

type Screen = "list" | "form" | "comparativo";

export default function AdminAssessments() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentScreen, setCurrentScreen] = useState<Screen>("list");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedStudentSex, setSelectedStudentSex] = useState("M");
  const [selectedStudentBirthDate, setSelectedStudentBirthDate] = useState("");
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [newAssessmentStudentId, setNewAssessmentStudentId] = useState("");
  const { gymSlug } = useGym();

  // Queries
  const { data: assessments = [], refetch: refetchAssessments } = trpc.assessments.list.useQuery({ studentId: undefined });
  const { data: students = [] } = trpc.students.listAll.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });

  const filteredAssessments = assessments.filter((assessment: any) =>
    searchTerm === "" ||
    assessment.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAssessments = assessments.length;
  const avgIMC = assessments.length > 0
    ? assessments.reduce((sum: number, a: any) => {
        const bmi = a.bmi || (a.weight && a.height ? Number(a.weight) / Math.pow(Number(a.height) / 100, 2) : 0);
        return sum + bmi;
      }, 0) / assessments.length
    : 0;
  const avgBodyFat = assessments.length > 0
    ? assessments.filter((a: any) => a.bodyFatPct || a.bodyFat).reduce((sum: number, a: any) => sum + Number(a.bodyFatPct || a.bodyFat || 0), 0) / (assessments.filter((a: any) => a.bodyFatPct || a.bodyFat).length || 1)
    : 0;
  const uniqueStudents = new Set(assessments.map((a: any) => a.studentId)).size;

  const getIMCStatus = (imc: number) => {
    if (imc < 18.5) return { label: "Abaixo", color: "bg-blue-100 text-blue-800" };
    if (imc < 25) return { label: "Normal", color: "bg-green-100 text-green-800" };
    if (imc < 30) return { label: "Sobrepeso", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Obesidade", color: "bg-red-100 text-red-800" };
  };

  const openNewAssessment = () => {
    if (!newAssessmentStudentId) {
      toast.error("Selecione um aluno primeiro");
      return;
    }
    const student = (students as any[]).find((s: any) => s.id === parseInt(newAssessmentStudentId));
    if (!student) return;
    setSelectedStudentId(student.id);
    setSelectedStudentName(student.name);
    setSelectedStudentSex(student.sex || "M");
    setSelectedStudentBirthDate(student.birthDate || "");
    setEditingAssessment(null);
    setCurrentScreen("form");
  };

  const openEditAssessment = (assessment: any) => {
    const student = (students as any[]).find((s: any) => s.id === assessment.studentId);
    setSelectedStudentId(assessment.studentId);
    setSelectedStudentName(assessment.studentName || student?.name || "");
    setSelectedStudentSex(student?.sex || "M");
    setSelectedStudentBirthDate(student?.birthDate || "");
    setEditingAssessment(assessment);
    setCurrentScreen("form");
  };

  const openComparativo = (assessment: any) => {
    const student = (students as any[]).find((s: any) => s.id === assessment.studentId);
    setSelectedStudentId(assessment.studentId);
    setSelectedStudentName(assessment.studentName || student?.name || "");
    setCurrentScreen("comparativo");
  };

  // FORM SCREEN
  if (currentScreen === "form" && selectedStudentId) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <PhysicalAssessmentForm
            studentId={selectedStudentId}
            studentName={selectedStudentName}
            studentSex={selectedStudentSex}
            studentBirthDate={selectedStudentBirthDate}
            existingAssessment={editingAssessment}
            onBack={() => {
              setCurrentScreen("list");
              refetchAssessments();
            }}
            onSaved={() => {
              setCurrentScreen("list");
              refetchAssessments();
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  // COMPARATIVO SCREEN
  if (currentScreen === "comparativo" && selectedStudentId) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AssessmentComparative
            studentId={selectedStudentId}
            studentName={selectedStudentName}
            onBack={() => setCurrentScreen("list")}
          />
        </div>
      </DashboardLayout>
    );
  }

  // LIST SCREEN
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
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
                Acompanhamento completo de medidas e evolução dos alunos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={newAssessmentStudentId} onValueChange={setNewAssessmentStudentId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {(students as any[]).map((student: any) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openNewAssessment}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Avaliação
            </Button>
          </div>
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
              <div className="text-3xl font-bold">{uniqueStudents}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </CardTitle>
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
                    const bmi = assessment.bmi
                      ? Number(assessment.bmi)
                      : assessment.weight && assessment.height
                        ? Number(assessment.weight) / Math.pow(Number(assessment.height) / 100, 2)
                        : 0;
                    const imcStatus = getIMCStatus(bmi);
                    const bodyFat = assessment.bodyFatPct || assessment.bodyFat;
                    return (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.studentName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleDateString("pt-BR") : "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Weight className="w-3 h-3 text-muted-foreground" />
                            {assessment.weight ? `${Number(assessment.weight).toFixed(1)} kg` : "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Ruler className="w-3 h-3 text-muted-foreground" />
                            {assessment.height ? `${Number(assessment.height).toFixed(1)} cm` : "—"}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {bmi ? bmi.toFixed(1) : "—"}
                        </TableCell>
                        <TableCell>
                          {bodyFat ? `${Number(bodyFat).toFixed(1)}%` : "—"}
                        </TableCell>
                        <TableCell>
                          {bmi > 0 && <Badge className={imcStatus.color}>{imcStatus.label}</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditAssessment(assessment)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openComparativo(assessment)}
                              title="Comparativo & Gráficos"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </div>
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
