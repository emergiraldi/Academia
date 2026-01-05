import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Dumbbell,
  TrendingUp,
  Activity,
  AlertCircle,
  Award,
  FileText,
  Plus,
  Scale,
  Ruler,
  ImageIcon,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { toast } from "sonner";

export default function StudentProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/professor/students/:id");

  const studentId = params?.id ? parseInt(params.id) : 0;

  // State for assessment dialog
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    weight: "",
    height: "",
    bodyFat: "",
    muscleMass: "",
    chest: "",
    waist: "",
    hips: "",
    rightArm: "",
    leftArm: "",
    rightThigh: "",
    leftThigh: "",
    rightCalf: "",
    leftCalf: "",
    flexibility: "",
    pushups: "",
    plankSeconds: "",
    notes: "",
    goals: "",
    nextAssessmentDate: "",
  });

  // Fetch student profile data
  const { data: profile, isLoading } = trpc.professorDashboard.getStudentProfile.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  // Fetch assessments
  const { data: assessments = [], refetch: refetchAssessments } = trpc.assessments.list.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  // Fetch progress data for charts
  const { data: progressData } = trpc.assessments.getProgressData.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  // Create assessment mutation
  const createAssessmentMutation = trpc.assessments.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação criada com sucesso!");
      refetchAssessments();
      setIsAssessmentDialogOpen(false);
      setAssessmentForm({
        weight: "",
        height: "",
        bodyFat: "",
        muscleMass: "",
        chest: "",
        waist: "",
        hips: "",
        rightArm: "",
        leftArm: "",
        rightThigh: "",
        leftThigh: "",
        rightCalf: "",
        leftCalf: "",
        flexibility: "",
        pushups: "",
        plankSeconds: "",
        notes: "",
        goals: "",
        nextAssessmentDate: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar avaliação");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-lg font-medium">Aluno não encontrado</p>
          <Button onClick={() => setLocation("/professor")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "suspended":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handleCreateAssessment = () => {
    createAssessmentMutation.mutate({
      studentId,
      assessmentDate: new Date(),
      weight: assessmentForm.weight ? parseFloat(assessmentForm.weight) : undefined,
      height: assessmentForm.height ? parseFloat(assessmentForm.height) : undefined,
      bodyFat: assessmentForm.bodyFat ? parseFloat(assessmentForm.bodyFat) : undefined,
      muscleMass: assessmentForm.muscleMass ? parseFloat(assessmentForm.muscleMass) : undefined,
      chest: assessmentForm.chest ? parseFloat(assessmentForm.chest) : undefined,
      waist: assessmentForm.waist ? parseFloat(assessmentForm.waist) : undefined,
      hips: assessmentForm.hips ? parseFloat(assessmentForm.hips) : undefined,
      rightArm: assessmentForm.rightArm ? parseFloat(assessmentForm.rightArm) : undefined,
      leftArm: assessmentForm.leftArm ? parseFloat(assessmentForm.leftArm) : undefined,
      rightThigh: assessmentForm.rightThigh ? parseFloat(assessmentForm.rightThigh) : undefined,
      leftThigh: assessmentForm.leftThigh ? parseFloat(assessmentForm.leftThigh) : undefined,
      rightCalf: assessmentForm.rightCalf ? parseFloat(assessmentForm.rightCalf) : undefined,
      leftCalf: assessmentForm.leftCalf ? parseFloat(assessmentForm.leftCalf) : undefined,
      flexibility: assessmentForm.flexibility ? parseFloat(assessmentForm.flexibility) : undefined,
      pushups: assessmentForm.pushups ? parseInt(assessmentForm.pushups) : undefined,
      plankSeconds: assessmentForm.plankSeconds ? parseInt(assessmentForm.plankSeconds) : undefined,
      notes: assessmentForm.notes || undefined,
      goals: assessmentForm.goals || undefined,
      nextAssessmentDate: assessmentForm.nextAssessmentDate
        ? new Date(assessmentForm.nextAssessmentDate)
        : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/professor")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <p className="text-muted-foreground">Perfil do Aluno</p>
            </div>
          </div>
          <Badge className={getStatusColor(profile.membershipStatus)}>
            {profile.membershipStatus === "active" && "Ativo"}
            {profile.membershipStatus === "inactive" && "Inativo"}
            {profile.membershipStatus === "suspended" && "Suspenso"}
            {profile.membershipStatus === "blocked" && "Bloqueado"}
          </Badge>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="treinos">Treinos</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            <TabsTrigger value="frequencia">Frequência</TabsTrigger>
            <TabsTrigger value="notas">Notas</TabsTrigger>
          </TabsList>

          {/* Resumo Tab */}
          <TabsContent value="resumo" className="space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{profile.phone || "Não informado"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Membro desde</p>
                    <p className="font-medium">{formatDate(profile.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Matrícula</p>
                    <p className="font-medium">{profile.registrationNumber || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Workout Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Treino Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.currentWorkout ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{profile.currentWorkout.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile.currentWorkout.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Início: {formatDate(profile.currentWorkout.startDate)}
                      </span>
                      <span className="text-muted-foreground">
                        Término: {formatDate(profile.currentWorkout.endDate)}
                      </span>
                    </div>
                    {profile.currentWorkout.daysUntilExpiry !== null && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Dias restantes</span>
                          <span className="text-sm font-medium">
                            {profile.currentWorkout.daysUntilExpiry > 0
                              ? `${profile.currentWorkout.daysUntilExpiry} dias`
                              : "Expirado"}
                          </span>
                        </div>
                        <Progress
                          value={
                            profile.currentWorkout.daysUntilExpiry > 0
                              ? Math.min(
                                  100,
                                  (profile.currentWorkout.daysUntilExpiry /
                                    90) *
                                    100
                                )
                              : 0
                          }
                          className={
                            profile.currentWorkout.daysUntilExpiry < 7
                              ? "bg-red-200"
                              : ""
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum treino ativo</p>
                    <Button className="mt-4" onClick={() => setLocation("/professor")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Treino
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {profile.attendanceThisWeek || 0}x
                  </div>
                  <p className="text-xs text-muted-foreground">treinos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {profile.attendanceThisMonth || 0}x
                  </div>
                  <p className="text-xs text-muted-foreground">treinos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Média Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {profile.averageWeeklyFrequency?.toFixed(1) || 0}x
                  </div>
                  <p className="text-xs text-muted-foreground">por semana</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Último Acesso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold">
                    {profile.lastAccessDate
                      ? formatDate(profile.lastAccessDate)
                      : "Nunca"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile.lastAccessDate &&
                      `${Math.floor(
                        (Date.now() - new Date(profile.lastAccessDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )} dias atrás`}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Treinos Tab */}
          <TabsContent value="treinos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Treinos</CardTitle>
                <CardDescription>
                  Todos os treinos atribuídos a este aluno
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.workoutHistory && profile.workoutHistory.length > 0 ? (
                  <div className="space-y-4">
                    {profile.workoutHistory.map((workout: any) => (
                      <div
                        key={workout.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{workout.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {workout.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>
                                {formatDate(workout.startDate)} -{" "}
                                {formatDate(workout.endDate)}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              new Date(workout.endDate) > new Date()
                                ? "default"
                                : "secondary"
                            }
                          >
                            {new Date(workout.endDate) > new Date()
                              ? "Ativo"
                              : "Finalizado"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum treino registrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avaliações Tab */}
          <TabsContent value="avaliacoes" className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Avaliações Físicas</h2>
                <p className="text-muted-foreground">
                  Histórico de medidas e evolução do aluno
                </p>
              </div>
              <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Avaliação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nova Avaliação Física</DialogTitle>
                    <DialogDescription>
                      Registre as medidas e dados da avaliação física do aluno
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Medidas Corporais */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Medidas Corporais
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="weight">Peso (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            placeholder="75.5"
                            value={assessmentForm.weight}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, weight: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="height">Altura (cm)</Label>
                          <Input
                            id="height"
                            type="number"
                            step="0.1"
                            placeholder="175"
                            value={assessmentForm.height}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, height: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bodyFat">BF (%)</Label>
                          <Input
                            id="bodyFat"
                            type="number"
                            step="0.1"
                            placeholder="15.8"
                            value={assessmentForm.bodyFat}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, bodyFat: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
                          <Input
                            id="muscleMass"
                            type="number"
                            step="0.1"
                            placeholder="63.4"
                            value={assessmentForm.muscleMass}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, muscleMass: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Circunferências */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Ruler className="w-4 h-4" />
                        Circunferências (cm)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="chest">Peito</Label>
                          <Input
                            id="chest"
                            type="number"
                            step="0.1"
                            value={assessmentForm.chest}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, chest: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="waist">Cintura</Label>
                          <Input
                            id="waist"
                            type="number"
                            step="0.1"
                            value={assessmentForm.waist}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, waist: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hips">Quadril</Label>
                          <Input
                            id="hips"
                            type="number"
                            step="0.1"
                            value={assessmentForm.hips}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, hips: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rightArm">Braço D</Label>
                          <Input
                            id="rightArm"
                            type="number"
                            step="0.1"
                            value={assessmentForm.rightArm}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, rightArm: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="leftArm">Braço E</Label>
                          <Input
                            id="leftArm"
                            type="number"
                            step="0.1"
                            value={assessmentForm.leftArm}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, leftArm: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rightThigh">Coxa D</Label>
                          <Input
                            id="rightThigh"
                            type="number"
                            step="0.1"
                            value={assessmentForm.rightThigh}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, rightThigh: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="leftThigh">Coxa E</Label>
                          <Input
                            id="leftThigh"
                            type="number"
                            step="0.1"
                            value={assessmentForm.leftThigh}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, leftThigh: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rightCalf">Panturrilha D</Label>
                          <Input
                            id="rightCalf"
                            type="number"
                            step="0.1"
                            value={assessmentForm.rightCalf}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, rightCalf: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="leftCalf">Panturrilha E</Label>
                          <Input
                            id="leftCalf"
                            type="number"
                            step="0.1"
                            value={assessmentForm.leftCalf}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, leftCalf: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Testes Funcionais */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Testes Funcionais
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="flexibility">Flexibilidade (cm)</Label>
                          <Input
                            id="flexibility"
                            type="number"
                            step="0.1"
                            value={assessmentForm.flexibility}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, flexibility: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pushups">Flexões</Label>
                          <Input
                            id="pushups"
                            type="number"
                            value={assessmentForm.pushups}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, pushups: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plankSeconds">Prancha (seg)</Label>
                          <Input
                            id="plankSeconds"
                            type="number"
                            value={assessmentForm.plankSeconds}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, plankSeconds: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Objetivos e Notas */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="goals">Objetivos</Label>
                        <Textarea
                          id="goals"
                          placeholder="Ex: Perder 3kg de gordura, ganhar massa muscular..."
                          value={assessmentForm.goals}
                          onChange={(e) =>
                            setAssessmentForm({ ...assessmentForm, goals: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          placeholder="Anotações sobre a avaliação..."
                          value={assessmentForm.notes}
                          onChange={(e) =>
                            setAssessmentForm({ ...assessmentForm, notes: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextAssessmentDate">Próxima Avaliação</Label>
                        <Input
                          id="nextAssessmentDate"
                          type="date"
                          value={assessmentForm.nextAssessmentDate}
                          onChange={(e) =>
                            setAssessmentForm({
                              ...assessmentForm,
                              nextAssessmentDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAssessmentDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateAssessment}
                        disabled={createAssessmentMutation.isPending}
                      >
                        {createAssessmentMutation.isPending ? "Salvando..." : "Salvar Avaliação"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Progress Charts */}
            {progressData && (progressData.weightData.length > 0 || progressData.bodyFatData.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weight Chart */}
                {progressData.weightData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Evolução de Peso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {progressData.weightData.slice(-5).map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground w-20">
                              {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </span>
                            <div className="flex-1">
                              <div className="h-6 bg-blue-100 dark:bg-blue-900/30 rounded relative overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 transition-all"
                                  style={{ width: `${Math.min((item.value / 100) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-medium w-16 text-right">{item.value}kg</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Body Fat Chart */}
                {progressData.bodyFatData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Evolução de BF%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {progressData.bodyFatData.slice(-5).map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground w-20">
                              {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </span>
                            <div className="flex-1">
                              <div className="h-6 bg-green-100 dark:bg-green-900/30 rounded relative overflow-hidden">
                                <div
                                  className="h-full bg-green-600 transition-all"
                                  style={{ width: `${Math.min((item.value / 40) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-medium w-16 text-right">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Assessments List */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Avaliações</CardTitle>
                <CardDescription>
                  {assessments.length} {assessments.length === 1 ? "avaliação registrada" : "avaliações registradas"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <div className="text-center py-12">
                    <Scale className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium mb-2">Nenhuma avaliação registrada</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crie a primeira avaliação física para começar o acompanhamento
                    </p>
                    <Button onClick={() => setIsAssessmentDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Primeira Avaliação
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assessments.map((assessment: any) => (
                      <div
                        key={assessment.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">
                              {new Date(assessment.assessmentDate).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Avaliado por: {assessment.professorName || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {assessment.weight && (
                            <div>
                              <span className="text-muted-foreground">Peso:</span>{" "}
                              <span className="font-medium">{Number(assessment.weight).toFixed(1)}kg</span>
                            </div>
                          )}
                          {assessment.bodyFat && (
                            <div>
                              <span className="text-muted-foreground">BF:</span>{" "}
                              <span className="font-medium">{Number(assessment.bodyFat).toFixed(1)}%</span>
                            </div>
                          )}
                          {assessment.chest && (
                            <div>
                              <span className="text-muted-foreground">Peito:</span>{" "}
                              <span className="font-medium">{Number(assessment.chest).toFixed(1)}cm</span>
                            </div>
                          )}
                          {assessment.waist && (
                            <div>
                              <span className="text-muted-foreground">Cintura:</span>{" "}
                              <span className="font-medium">{Number(assessment.waist).toFixed(1)}cm</span>
                            </div>
                          )}
                          {assessment.rightArm && (
                            <div>
                              <span className="text-muted-foreground">Braço D:</span>{" "}
                              <span className="font-medium">{Number(assessment.rightArm).toFixed(1)}cm</span>
                            </div>
                          )}
                          {assessment.pushups && (
                            <div>
                              <span className="text-muted-foreground">Flexões:</span>{" "}
                              <span className="font-medium">{assessment.pushups}</span>
                            </div>
                          )}
                        </div>

                        {assessment.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">{assessment.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Frequencia Tab */}
          <TabsContent value="frequencia" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Registro de Acessos
                </CardTitle>
                <CardDescription>Últimos 30 acessos à academia</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.recentAccesses && profile.recentAccesses.length > 0 ? (
                  <div className="space-y-2">
                    {profile.recentAccesses.map((access: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">Entrada registrada</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(access.timestamp).toLocaleString("pt-BR", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum acesso registrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notas Tab */}
          <TabsContent value="notas" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Notas do Professor
                    </CardTitle>
                    <CardDescription>
                      Observações e anotações sobre o aluno
                    </CardDescription>
                  </div>
                  <Button disabled>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Nota
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Sistema de notas em desenvolvimento</p>
                  <p className="text-xs mt-2">
                    Em breve você poderá adicionar observações sobre o progresso e
                    comportamento do aluno
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
