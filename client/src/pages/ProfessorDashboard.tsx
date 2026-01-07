import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dumbbell,
  Plus,
  LogOut,
  Users,
  TrendingUp,
  AlertCircle,
  Activity,
  Search,
  UserPlus,
  CalendarCheck,
  DollarSign,
  BookOpen,
  FileText,
  Clipboard,
  BarChart3,
  Settings,
  Calendar,
  Ruler,
  Weight,
  Target,
  ChevronRight,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

export default function ProfessorDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "students" | "exercises" | "workouts" | "assessments">("dashboard");

  // Exercise form state
  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    description: "",
    muscleGroup: "",
    equipment: "",
    instructions: "",
  });
  const [exerciseImageFile, setExerciseImageFile] = useState<File | null>(null);
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isExerciseDetailOpen, setIsExerciseDetailOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [isEditExerciseDialogOpen, setIsEditExerciseDialogOpen] = useState(false);

  // Assessment form state
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
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
  const [assessmentPhotoFiles, setAssessmentPhotoFiles] = useState<File[]>([]);
  const [assessmentSearchTerm, setAssessmentSearchTerm] = useState("");

  // Student filters state
  const [studentFilters, setStudentFilters] = useState({
    status: "all",
    searchTerm: "",
  });
  const [studentSorting, setStudentSorting] = useState<"name" | "createdAt">("name");

  // Exercise filters state
  const [exerciseFilters, setExerciseFilters] = useState({
    searchTerm: "",
    muscleGroup: "all",
  });
  const [exercisePage, setExercisePage] = useState(1);
  const EXERCISES_PER_PAGE = 10;

  // Workout filters state
  const [workoutPage, setWorkoutPage] = useState(1);
  const WORKOUTS_PER_PAGE = 10;

  // Queries
  const { data: exercises = [], refetch: refetchExercises } = trpc.exercises.list.useQuery();
  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: workouts = [], refetch: refetchWorkouts } = trpc.workouts.list.useQuery();
  const { data: assessments = [], refetch: refetchAssessments } = trpc.assessments.list.useQuery({ studentId: undefined });

  // Dashboard queries
  const { data: dashboardMetrics } = trpc.professorDashboard.getMetrics.useQuery();

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let filtered = [...exercises];

    if (exerciseFilters.searchTerm) {
      const searchLower = exerciseFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ex: any) =>
          ex.name.toLowerCase().includes(searchLower) ||
          ex.description?.toLowerCase().includes(searchLower) ||
          ex.muscleGroup?.toLowerCase().includes(searchLower)
      );
    }

    if (exerciseFilters.muscleGroup !== "all") {
      filtered = filtered.filter((ex: any) => ex.muscleGroup === exerciseFilters.muscleGroup);
    }

    return filtered;
  }, [exercises, exerciseFilters]);

  // Paginate exercises
  const paginatedExercises = useMemo(() => {
    const startIndex = (exercisePage - 1) * EXERCISES_PER_PAGE;
    const endIndex = startIndex + EXERCISES_PER_PAGE;
    return filteredExercises.slice(startIndex, endIndex);
  }, [filteredExercises, exercisePage, EXERCISES_PER_PAGE]);

  const totalExercisePages = Math.ceil(filteredExercises.length / EXERCISES_PER_PAGE);

  // Paginate workouts
  const paginatedWorkouts = useMemo(() => {
    const startIndex = (workoutPage - 1) * WORKOUTS_PER_PAGE;
    const endIndex = startIndex + WORKOUTS_PER_PAGE;
    return workouts.slice(startIndex, endIndex);
  }, [workouts, workoutPage, WORKOUTS_PER_PAGE]);

  const totalWorkoutPages = Math.ceil(workouts.length / WORKOUTS_PER_PAGE);

  // Get unique muscle groups
  const muscleGroups = useMemo(() => {
    const groups = new Set(exercises.map((ex: any) => ex.muscleGroup).filter(Boolean));
    return Array.from(groups).sort();
  }, [exercises]);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = [...students];

    if (studentFilters.status !== "all") {
      filtered = filtered.filter((s: any) => s.membershipStatus === studentFilters.status);
    }

    if (studentFilters.searchTerm) {
      const searchLower = studentFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s: any) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower) ||
          s.registrationNumber?.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a: any, b: any) => {
      if (studentSorting === "name") {
        return a.name.localeCompare(b.name);
      } else if (studentSorting === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return filtered;
  }, [students, studentFilters, studentSorting]);

  // Get latest students
  const latestStudents = useMemo(() => {
    return [...students]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [students]);

  // Reset exercise page when filters change
  useEffect(() => {
    setExercisePage(1);
  }, [exerciseFilters.searchTerm, exerciseFilters.muscleGroup]);

  // Mutations
  const createExerciseMutation = trpc.exercises.create.useMutation({
    onSuccess: () => {
      toast.success("Exercício criado com sucesso!");
      refetchExercises();
      setIsExerciseDialogOpen(false);
      setExerciseForm({
        name: "",
        description: "",
        muscleGroup: "",
        equipment: "",
        instructions: "",
      });
      setExerciseImageFile(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar exercício");
    },
  });

  const deleteExerciseMutation = trpc.exercises.delete.useMutation({
    onSuccess: () => {
      toast.success("Exercício excluído com sucesso!");
      refetchExercises();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir exercício");
    },
  });

  const updateExerciseMutation = trpc.exercises.update.useMutation({
    onSuccess: () => {
      toast.success("Exercício atualizado com sucesso!");
      refetchExercises();
      setIsEditExerciseDialogOpen(false);
      setEditingExercise(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar exercício");
    },
  });

  const deleteWorkoutMutation = trpc.workouts.delete.useMutation({
    onSuccess: () => {
      toast.success("Treino excluído com sucesso!");
      refetchWorkouts();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir treino");
    },
  });

  const createAssessmentMutation = trpc.assessments.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação cadastrada com sucesso!");
      setIsAssessmentDialogOpen(false);
      resetAssessmentForm();
      refetchAssessments();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar avaliação");
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/professor/login");
  };

  const handleCreateExercise = async () => {
    if (!exerciseForm.name) {
      toast.error("Nome do exercício é obrigatório");
      return;
    }

    let imageData: string | undefined;
    if (exerciseImageFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        imageData = reader.result as string;
        await createExerciseMutation.mutateAsync({
          ...exerciseForm,
          imageData,
        });
      };
      reader.readAsDataURL(exerciseImageFile);
    } else {
      await createExerciseMutation.mutateAsync(exerciseForm);
    }
  };

  const handleDeleteExercise = (exerciseId: number) => {
    if (confirm("Tem certeza que deseja excluir este exercício?")) {
      deleteExerciseMutation.mutate({ id: exerciseId });
    }
  };

  const handleEditExercise = (exercise: any) => {
    setEditingExercise({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description || "",
      muscleGroup: exercise.muscleGroup || "",
      equipment: exercise.equipment || "",
      instructions: exercise.instructions || "",
      imageUrl: exercise.imageUrl || "",
    });
    setIsEditExerciseDialogOpen(true);
  };

  const handleUpdateExercise = async () => {
    if (!editingExercise?.name) {
      toast.error("Nome do exercício é obrigatório");
      return;
    }

    let imageData: string | undefined;
    if (exerciseImageFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        imageData = reader.result as string;
        await updateExerciseMutation.mutateAsync({
          id: editingExercise.id,
          name: editingExercise.name,
          description: editingExercise.description,
          muscleGroup: editingExercise.muscleGroup,
          equipment: editingExercise.equipment,
          instructions: editingExercise.instructions,
          imageData,
        });
      };
      reader.readAsDataURL(exerciseImageFile);
    } else {
      await updateExerciseMutation.mutateAsync({
        id: editingExercise.id,
        name: editingExercise.name,
        description: editingExercise.description,
        muscleGroup: editingExercise.muscleGroup,
        equipment: editingExercise.equipment,
        instructions: editingExercise.instructions,
      });
    }
  };

  const resetAssessmentForm = () => {
    setAssessmentForm({
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
    setAssessmentPhotoFiles([]);
  };

  const calculateBMI = (weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const handleSubmitAssessment = async () => {
    if (!assessmentForm.studentId || !assessmentForm.weightKg || !assessmentForm.heightCm) {
      toast.error("Preencha os campos obrigatórios: Aluno, Peso e Altura");
      return;
    }

    const weight = parseFloat(assessmentForm.weightKg);
    const height = parseFloat(assessmentForm.heightCm);
    const bmi = calculateBMI(weight, height);

    // Processar fotos se houver
    const photos: string[] = [];
    if (assessmentPhotoFiles.length > 0) {
      for (const file of assessmentPhotoFiles) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        photos.push(base64);
      }
    }

    createAssessmentMutation.mutate({
      studentId: parseInt(assessmentForm.studentId),
      assessmentDate: assessmentForm.assessmentDate,
      weightKg: weight,
      heightCm: height,
      bmi,
      bodyFatPercentage: assessmentForm.bodyFatPercentage ? parseFloat(assessmentForm.bodyFatPercentage) : undefined,
      muscleMassKg: assessmentForm.muscleMassKg ? parseFloat(assessmentForm.muscleMassKg) : undefined,
      chestCm: assessmentForm.chestCm ? parseFloat(assessmentForm.chestCm) : undefined,
      waistCm: assessmentForm.waistCm ? parseFloat(assessmentForm.waistCm) : undefined,
      hipCm: assessmentForm.hipCm ? parseFloat(assessmentForm.hipCm) : undefined,
      rightArmCm: assessmentForm.rightArmCm ? parseFloat(assessmentForm.rightArmCm) : undefined,
      leftArmCm: assessmentForm.leftArmCm ? parseFloat(assessmentForm.leftArmCm) : undefined,
      rightThighCm: assessmentForm.rightThighCm ? parseFloat(assessmentForm.rightThighCm) : undefined,
      leftThighCm: assessmentForm.leftThighCm ? parseFloat(assessmentForm.leftThighCm) : undefined,
      rightCalfCm: assessmentForm.rightCalfCm ? parseFloat(assessmentForm.rightCalfCm) : undefined,
      leftCalfCm: assessmentForm.leftCalfCm ? parseFloat(assessmentForm.leftCalfCm) : undefined,
      notes: assessmentForm.notes || undefined,
      goals: assessmentForm.goals || undefined,
      photos: photos.length > 0 ? photos : undefined,
    });
  };

  const getIMCStatus = (imc: number) => {
    if (imc < 18.5) return { label: "Abaixo", color: "bg-blue-100 text-blue-800" };
    if (imc < 25) return { label: "Normal", color: "bg-green-100 text-green-800" };
    if (imc < 30) return { label: "Sobrepeso", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Obesidade", color: "bg-red-100 text-red-800" };
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment: any) =>
      assessmentSearchTerm === "" ||
      assessment.studentName.toLowerCase().includes(assessmentSearchTerm.toLowerCase())
    );
  }, [assessments, assessmentSearchTerm]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", icon: Users, label: "Dashboard" },
    { id: "students", icon: Users, label: "Alunos" },
    { id: "workouts", icon: Dumbbell, label: "Treinos" },
    { id: "exercises", icon: Activity, label: "Exercícios" },
    { id: "assessments", icon: Clipboard, label: "Avaliações" },
    { id: "medical", icon: FileText, label: "Exames" },
    { id: "reports", icon: BarChart3, label: "Relatórios" },
    { id: "settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-20 bg-gradient-to-b from-blue-600 to-blue-700 flex flex-col items-center py-6 space-y-6">
        {/* Logo */}
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-white" />
        </div>

        {/* Menu Items */}
        <nav className="flex-1 flex flex-col space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "dashboard" && currentScreen === "dashboard";
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "students") setCurrentScreen("students");
                  else if (item.id === "exercises") setCurrentScreen("exercises");
                  else if (item.id === "workouts") setCurrentScreen("workouts");
                  else if (item.id === "assessments") setCurrentScreen("assessments");
                  else setCurrentScreen("dashboard");
                }}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition relative group ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                {item.id === "dashboard" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-400 rounded-r"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-8 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <Dumbbell className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">SysFit Pro</h1>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {currentScreen === "dashboard" && (
          <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card
                className="hover:shadow-lg transition cursor-pointer group"
                onClick={() => setCurrentScreen("students")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Meus Alunos</h3>
                  <p className="text-sm text-gray-500">Ver e gerenciar meus alunos</p>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition cursor-pointer group"
                onClick={() => setLocation("/professor/workout/new")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                    <Dumbbell className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Criar Treino</h3>
                  <p className="text-sm text-gray-500">Montar série de treino para aluno</p>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition cursor-pointer group"
                onClick={() => setCurrentScreen("assessments")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                    <Clipboard className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Avaliações</h3>
                  <p className="text-sm text-gray-500">Registrar avaliações físicas</p>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition cursor-pointer group"
                onClick={() => setCurrentScreen("exercises")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                    <BookOpen className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Biblioteca de Exercícios</h3>
                  <p className="text-sm text-gray-500">Explorar exercícios disponíveis</p>
                </CardContent>
              </Card>
            </div>

            {/* Status Rápido */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Visão Geral</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">Meus Alunos</p>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{students.length}</p>
                        <p className="text-xs text-gray-500">Total de alunos cadastrados</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">Treinos Criados</p>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{workouts.length}</p>
                        <p className="text-xs text-gray-500">Séries de treino ativas</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">Treinos Ativos</p>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{workouts.filter((w: any) => w.active).length}</p>
                        <p className="text-xs text-gray-500">Séries ativas no momento</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Activity className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">Exercícios na Biblioteca</p>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{exercises.length}</p>
                        <p className="text-xs text-gray-500">Total disponível</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Activity className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Últimos Alunos Cadastrados */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Últimos Alunos Cadastrados</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Cadastro</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {latestStudents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                              Nenhum aluno cadastrado ainda
                            </td>
                          </tr>
                        ) : (
                          latestStudents.map((student: any) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-sm font-semibold text-white">
                                      {student.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{student.name}</div>
                                    <div className="text-sm text-gray-500">Ficha #{student.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">Plano Básico</div>
                                <div className="text-sm text-gray-500">R$ 49,90/mês</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(student.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={
                                  student.membershipStatus === "active"
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-gray-500"
                                }>
                                  {student.membershipStatus === "active" ? "ATIVO" : "INATIVO"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => setLocation(`/professor/students/${student.id}`)}
                                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                  >
                                    Ver
                                  </button>
                                  <button
                                    onClick={() => setLocation(`/professor/students/${student.id}`)}
                                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Students Screen */}
        {currentScreen === "students" && (
          <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Alunos</h2>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email ou matrícula..."
                    value={studentFilters.searchTerm}
                    onChange={(e) => setStudentFilters({ ...studentFilters, searchTerm: e.target.value })}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={studentFilters.status}
                    onValueChange={(value) => setStudentFilters({ ...studentFilters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                      <SelectItem value="suspended">Suspensos</SelectItem>
                      <SelectItem value="blocked">Bloqueados</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={studentSorting}
                    onValueChange={(value: any) => setStudentSorting(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="createdAt">Data cadastro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {filteredAndSortedStudents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">Nenhum aluno encontrado</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredAndSortedStudents.map((student: any) => {
                      const studentWorkouts = workouts.filter((w: any) => w.studentId === student.id);
                      return (
                        <div
                          key={student.id}
                          className="p-4 hover:bg-gray-50 transition flex items-center gap-3"
                        >
                          {/* Student Avatar */}
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-white">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Student Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{student.email}</p>
                            {studentWorkouts.length > 0 && (
                              <p className="text-xs text-blue-600 mt-1">
                                {studentWorkouts.length} treino(s) criado(s)
                              </p>
                            )}
                          </div>

                          {/* Status Badge */}
                          <Badge
                            className={
                              student.membershipStatus === "active"
                                ? "bg-green-500"
                                : "bg-gray-500"
                            }
                          >
                            {student.membershipStatus === "active" && "Ativo"}
                            {student.membershipStatus === "inactive" && "Inativo"}
                            {student.membershipStatus === "suspended" && "Suspenso"}
                            {student.membershipStatus === "blocked" && "Bloqueado"}
                          </Badge>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {studentWorkouts.length > 0 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/professor/workout/${studentWorkouts[0].id}/edit`);
                                }}
                                title="Editar treino"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/professor/workout/new`);
                                }}
                                title="Criar treino"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/professor/students/${student.id}`);
                              }}
                              title="Ver perfil do aluno"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Exercises Screen */}
        {currentScreen === "exercises" && (
          <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Biblioteca de Exercícios</h2>
              <Button onClick={() => setIsExerciseDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Exercício
              </Button>
            </div>

            {exercises.length > 0 && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar exercícios..."
                      value={exerciseFilters.searchTerm}
                      onChange={(e) => setExerciseFilters({ ...exerciseFilters, searchTerm: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  {filteredExercises.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {filteredExercises.length} exercício(s) encontrado(s)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {exercises.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Nenhum exercício cadastrado</p>
                  <Button onClick={() => setIsExerciseDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Exercício
                  </Button>
                </CardContent>
              </Card>
            ) : filteredExercises.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum exercício encontrado com esses filtros</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {paginatedExercises.map((exercise: any) => (
                        <div
                          key={exercise.id}
                          className="p-4 hover:bg-gray-50 transition flex items-center gap-3"
                        >
                          {/* Miniatura da foto */}
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            {exercise.imageUrl ? (
                              <img
                                src={exercise.imageUrl}
                                alt={exercise.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Dumbbell className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          {/* Informações */}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                            {exercise.muscleGroup && (
                              <span className="inline-block mt-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {exercise.muscleGroup}
                              </span>
                            )}
                          </div>

                          {/* Botões de ação */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedExercise(exercise);
                                setIsExerciseDetailOpen(true);
                              }}
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditExercise(exercise);
                              }}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteExercise(exercise.id);
                              }}
                              title="Excluir"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Paginação */}
                {totalExercisePages > 1 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Página {exercisePage} de {totalExercisePages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExercisePage(Math.max(1, exercisePage - 1))}
                            disabled={exercisePage === 1}
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExercisePage(Math.min(totalExercisePages, exercisePage + 1))}
                            disabled={exercisePage === totalExercisePages}
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Workouts Screen - Gerenciar treinos por aluno */}
        {currentScreen === "workouts" && (
          <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Gerenciar Treinos</h2>
              <Button onClick={() => setLocation("/professor/workout/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Treino
              </Button>
            </div>

            {(() => {
              // Filtrar apenas alunos que têm treinos criados
              const studentsWithWorkouts = students.filter((student: any) => {
                const studentWorkouts = workouts.filter((w: any) => w.studentId === student.id);
                return studentWorkouts.length > 0;
              });

              if (studentsWithWorkouts.length === 0) {
                return (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nenhum treino criado ainda</p>
                      <p className="text-sm text-gray-500 mb-4">Crie treinos para seus alunos</p>
                      <Button onClick={() => setLocation("/professor/workout/new")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeiro Treino
                      </Button>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {studentsWithWorkouts.map((student: any) => {
                        const studentWorkouts = workouts.filter((w: any) => w.studentId === student.id);
                        return (
                          <div
                            key={student.id}
                            className="p-4 hover:bg-gray-50 transition flex items-center gap-3"
                          >
                            {/* Student Avatar */}
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-lg font-semibold text-white">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>

                            {/* Student Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-500 truncate">{student.email}</p>
                              <p className="text-xs text-blue-600 mt-1">
                                {studentWorkouts.length} treino(s) criado(s)
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/professor/workout/${studentWorkouts[0].id}`);
                                }}
                                title="Visualizar treino"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/professor/workout/${studentWorkouts[0].id}/edit`);
                                }}
                                title="Editar treino"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Deseja realmente excluir o treino de ${student.name}?\n\nEsta ação não pode ser desfeita!`)) {
                                    deleteWorkoutMutation.mutate({ workoutId: studentWorkouts[0].id });
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir treino"
                                disabled={deleteWorkoutMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}

        {/* Assessments Screen */}
        {currentScreen === "assessments" && (
          <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Avaliações Físicas</h2>
              <Button onClick={() => setIsAssessmentDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Total de Avaliações</p>
                  <p className="text-3xl font-bold">{assessments.length}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Alunos Avaliados</p>
                  <p className="text-3xl font-bold">
                    {new Set(assessments.map((a: any) => a.studentId)).size}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">IMC Médio</p>
                  <p className="text-3xl font-bold">
                    {assessments.length > 0
                      ? (assessments.reduce((sum: number, a: any) => sum + (a.bmi || 0), 0) / assessments.length).toFixed(1)
                      : "0.0"}
                  </p>
                  <p className="text-sm text-gray-500">kg/m²</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">% Gordura Média</p>
                  <p className="text-3xl font-bold">
                    {assessments.length > 0
                      ? (assessments.reduce((sum: number, a: any) => sum + (a.bodyFatPercentage || 0), 0) / assessments.length).toFixed(1)
                      : "0.0"}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome do aluno..."
                    value={assessmentSearchTerm}
                    onChange={(e) => setAssessmentSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Assessments Table */}
            <Card>
              <CardHeader>
                <CardTitle>Todas as Avaliações</CardTitle>
                <CardDescription>
                  {filteredAssessments.length} avaliação(ões) encontrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssessments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  {new Date(assessment.assessmentDate).toLocaleDateString("pt-BR")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Weight className="w-3 h-3 text-gray-400" />
                                  {assessment.weightKg} kg
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Ruler className="w-3 h-3 text-gray-400" />
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
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Exercise Detail Dialog */}
      <Dialog open={isExerciseDetailOpen} onOpenChange={setIsExerciseDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedExercise && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedExercise.name}</DialogTitle>
                {selectedExercise.muscleGroup && (
                  <DialogDescription>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {selectedExercise.muscleGroup}
                    </span>
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-4">
                {/* Foto do exercício */}
                {selectedExercise.imageUrl && (
                  <div className="w-full rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={selectedExercise.imageUrl}
                      alt={selectedExercise.name}
                      className="w-full h-auto object-contain max-h-96"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImagem não disponível%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                {/* Informações do exercício */}
                <div className="grid gap-4">
                  {selectedExercise.equipment && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Equipamento</h4>
                      <p className="text-gray-900">{selectedExercise.equipment}</p>
                    </div>
                  )}

                  {selectedExercise.description && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Descrição</h4>
                      <p className="text-gray-900 whitespace-pre-line">{selectedExercise.description}</p>
                    </div>
                  )}

                  {selectedExercise.instructions && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Instruções</h4>
                      <p className="text-gray-900 whitespace-pre-line">{selectedExercise.instructions}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsExerciseDetailOpen(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Exercise Dialog */}
      <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Exercício</DialogTitle>
            <DialogDescription>
              Adicione um novo exercício à biblioteca
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ex-name">Nome do Exercício *</Label>
                <Input
                  id="ex-name"
                  placeholder="Ex: Supino Reto"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-muscle">Grupo Muscular</Label>
                <Input
                  id="ex-muscle"
                  placeholder="Ex: Peito"
                  value={exerciseForm.muscleGroup}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, muscleGroup: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-equipment">Equipamento</Label>
              <Input
                id="ex-equipment"
                placeholder="Ex: Barra, Halteres"
                value={exerciseForm.equipment}
                onChange={(e) => setExerciseForm({ ...exerciseForm, equipment: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-description">Descrição</Label>
              <Textarea
                id="ex-description"
                placeholder="Breve descrição do exercício"
                value={exerciseForm.description}
                onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-instructions">Instruções de Execução</Label>
              <Textarea
                id="ex-instructions"
                placeholder="Como executar o exercício corretamente"
                value={exerciseForm.instructions}
                onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-image">Foto do Exercício</Label>
              <Input
                id="ex-image"
                type="file"
                accept="image/*"
                onChange={(e) => setExerciseImageFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button
              onClick={handleCreateExercise}
              disabled={createExerciseMutation.isPending}
              className="w-full"
            >
              {createExerciseMutation.isPending ? "Criando..." : "Criar Exercício"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Exercise Dialog */}
      <Dialog open={isEditExerciseDialogOpen} onOpenChange={(open) => {
        setIsEditExerciseDialogOpen(open);
        if (!open) {
          setEditingExercise(null);
          setExerciseImageFile(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Exercício</DialogTitle>
            <DialogDescription>
              Atualize as informações do exercício
            </DialogDescription>
          </DialogHeader>
          {editingExercise && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ex-name">Nome do Exercício *</Label>
                  <Input
                    id="edit-ex-name"
                    placeholder="Ex: Supino Reto"
                    value={editingExercise.name}
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ex-muscle">Grupo Muscular</Label>
                  <Input
                    id="edit-ex-muscle"
                    placeholder="Ex: Peito"
                    value={editingExercise.muscleGroup}
                    onChange={(e) => setEditingExercise({ ...editingExercise, muscleGroup: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ex-equipment">Equipamento</Label>
                <Input
                  id="edit-ex-equipment"
                  placeholder="Ex: Barra, Halteres"
                  value={editingExercise.equipment}
                  onChange={(e) => setEditingExercise({ ...editingExercise, equipment: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ex-description">Descrição</Label>
                <Textarea
                  id="edit-ex-description"
                  placeholder="Breve descrição do exercício"
                  value={editingExercise.description}
                  onChange={(e) => setEditingExercise({ ...editingExercise, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ex-instructions">Instruções de Execução</Label>
                <Textarea
                  id="edit-ex-instructions"
                  placeholder="Como executar o exercício corretamente"
                  value={editingExercise.instructions}
                  onChange={(e) => setEditingExercise({ ...editingExercise, instructions: e.target.value })}
                  rows={4}
                />
              </div>

              {editingExercise.imageUrl && (
                <div className="space-y-2">
                  <Label>Foto Atual</Label>
                  <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border">
                    <img
                      src={editingExercise.imageUrl}
                      alt={editingExercise.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-ex-image">
                  {editingExercise.imageUrl ? "Substituir Foto" : "Adicionar Foto"}
                </Label>
                <Input
                  id="edit-ex-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setExerciseImageFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditExerciseDialogOpen(false);
                    setEditingExercise(null);
                    setExerciseImageFile(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateExercise}
                  disabled={updateExerciseMutation.isPending}
                  className="flex-1"
                >
                  {updateExerciseMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nova Avaliação</DialogTitle>
            <DialogDescription>
              Cadastre medidas corporais e composição física
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Aluno *</Label>
                <Select
                  value={assessmentForm.studentId}
                  onValueChange={(value) => setAssessmentForm({ ...assessmentForm, studentId: value })}
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
                  value={assessmentForm.assessmentDate}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentDate: e.target.value })}
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
                  value={assessmentForm.weightKg}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, weightKg: e.target.value })}
                />
              </div>
              <div>
                <Label>Altura (cm) *</Label>
                <Input
                  type="number"
                  placeholder="175"
                  value={assessmentForm.heightCm}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, heightCm: e.target.value })}
                />
              </div>
              <div>
                <Label>Gordura (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="20.5"
                  value={assessmentForm.bodyFatPercentage}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, bodyFatPercentage: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Massa Muscular (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="60"
                value={assessmentForm.muscleMassKg}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, muscleMassKg: e.target.value })}
              />
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
                    value={assessmentForm.chestCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, chestCm: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cintura</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="85"
                    value={assessmentForm.waistCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, waistCm: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Quadril</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="95"
                    value={assessmentForm.hipCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, hipCm: e.target.value })}
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
                    value={assessmentForm.rightArmCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, rightArmCm: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Braço Esquerdo</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="32"
                    value={assessmentForm.leftArmCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, leftArmCm: e.target.value })}
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
                    value={assessmentForm.rightThighCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, rightThighCm: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Coxa Esquerda</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="55"
                    value={assessmentForm.leftThighCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, leftThighCm: e.target.value })}
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
                    value={assessmentForm.rightCalfCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, rightCalfCm: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Panturrilha Esquerda</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="38"
                    value={assessmentForm.leftCalfCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, leftCalfCm: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div>
                <Label>Fotos do Corpo (Comparação Visual)</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Adicione fotos de frente, lado e costas para acompanhar a evolução visual
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setAssessmentPhotoFiles(files);
                  }}
                />
                {assessmentPhotoFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {assessmentPhotoFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setAssessmentPhotoFiles(assessmentPhotoFiles.filter((_, i) => i !== index));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Objetivos/Metas</Label>
                <Textarea
                  placeholder="Ex: Perder 5kg, ganhar massa muscular..."
                  value={assessmentForm.goals}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, goals: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Anotações gerais sobre a avaliação..."
                  value={assessmentForm.notes}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmitAssessment}
              disabled={createAssessmentMutation.isPending}
            >
              {createAssessmentMutation.isPending ? "Cadastrando..." : "Cadastrar Avaliação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
