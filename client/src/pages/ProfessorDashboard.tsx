import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
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
  ChevronLeft,
  Eye,
  Edit,
  Trash2,
  Video,
  Upload,
  Link,
  X,
  Loader2,
  Menu,
  Home,
  Library,
  ClipboardList,
  GripVertical,
  Play,
  Copy,
  Filter,
  ArrowLeft,
  User,
} from "lucide-react";
import { useLocation } from "wouter";
import PhysicalAssessmentForm from "@/components/PhysicalAssessmentForm";
import AssessmentComparative from "@/components/AssessmentComparative";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

function AssessmentsList({ studentId, onEdit }: { studentId: number; onEdit: (assessment: any) => void }) {
  const { data: assessments = [], isLoading } = trpc.assessments.getByStudent.useQuery({ studentId });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Carregando avaliações...</div>;
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhuma avaliação física registrada</p>
          <p className="text-sm text-gray-400">Clique em "Nova Avaliação" para começar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {(assessments as any[]).map((a: any) => (
        <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onEdit(a)}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                {a.assessmentNumber ? `${a.assessmentNumber}ª Avaliação` : "Avaliação"}
              </Badge>
              <span className="text-xs text-gray-400">
                {a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString("pt-BR") : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {a.weight && <div><span className="text-gray-500">Peso:</span> <span className="font-medium">{a.weight}kg</span></div>}
              {a.height && <div><span className="text-gray-500">Altura:</span> <span className="font-medium">{a.height}cm</span></div>}
              {a.bmi && <div><span className="text-gray-500">IMC:</span> <span className="font-medium">{parseFloat(a.bmi).toFixed(1)}</span></div>}
              {a.bodyFat && <div><span className="text-gray-500">%GC:</span> <span className="font-medium">{parseFloat(a.bodyFat).toFixed(1)}%</span></div>}
            </div>
            {a.protocol && (
              <p className="text-[10px] text-gray-400 mt-2">Protocolo: {a.protocol.replace(/_/g, " ")}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProfessorDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [currentScreen, setCurrentScreen] = useState<"alunos" | "todos-treinos" | "exercicios" | "modelos" | "criar-treino" | "treinos-aluno" | "editar-modelo" | "avaliacoes" | "avaliacao-form" | "comparativo">("alunos");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState<any>(null);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);

  // Workout creation state
  const [workoutForm, setWorkoutForm] = useState({ name: "", startDate: "", endDate: "" });
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [showBibliotecaModal, setShowBibliotecaModal] = useState(false);
  const [bibliotecaSearch, setBibliotecaSearch] = useState("");
  const [bibliotecaMuscle, setBibliotecaMuscle] = useState("all");
  const [bibliotecaPage, setBibliotecaPage] = useState(1);
  const BIBLIOTECA_PER_PAGE = 50;
  const [viewMode, setViewMode] = useState<"list" | "byDay">("list");
  const [videoModalExercicio, setVideoModalExercicio] = useState<any>(null);

  // Template edit state
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const [templateExercises, setTemplateExercises] = useState<any[]>([]);
  const [templateSidebarSearch, setTemplateSidebarSearch] = useState("");
  const [templateSidebarMuscle, setTemplateSidebarMuscle] = useState("all");

  // Assessment state
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [assessmentStudentSearch, setAssessmentStudentSearch] = useState("");

  // Template state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<number | null>(null);
  const [applyStudentIds, setApplyStudentIds] = useState<number[]>([]);
  const [applyStartDate, setApplyStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [applyEndDate, setApplyEndDate] = useState("");
  const [applySearch, setApplySearch] = useState("");

  // Exercise form state
  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    description: "",
    muscleGroup: "",
    equipment: "",
    instructions: "",
  });
  const [exerciseImageFile, setExerciseImageFile] = useState<File | null>(null);
  const [exerciseVideoFile, setExerciseVideoFile] = useState<File | null>(null);
  const [exerciseMedia1Link, setExerciseMedia1Link] = useState("");
  const [exerciseMedia2Link, setExerciseMedia2Link] = useState("");
  const [exerciseMedia1Preview, setExerciseMedia1Preview] = useState<string | null>(null);
  const [exerciseMedia2Preview, setExerciseMedia2Preview] = useState<string | null>(null);
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isExerciseDetailOpen, setIsExerciseDetailOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [isEditExerciseDialogOpen, setIsEditExerciseDialogOpen] = useState(false);

  // Video management state
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
  const [workoutStatusFilter, setWorkoutStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [workoutSearchTerm, setWorkoutSearchTerm] = useState("");
  const WORKOUTS_PER_PAGE = 10;

  // Queries
  const { data: exercises = [], refetch: refetchExercises } = trpc.exercises.list.useQuery();
  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: workouts = [], refetch: refetchWorkouts } = trpc.workouts.list.useQuery();
  const { data: assessments = [], refetch: refetchAssessments } = trpc.assessments.list.useQuery({ studentId: undefined });
  const { data: templates = [], refetch: refetchTemplates } = trpc.templates.list.useQuery();

  // Query to get workout with exercises when editing
  const workoutWithExercisesQuery = trpc.workouts.getWithExercises.useQuery(
    { workoutId: editingWorkout?.id || 0 },
    { enabled: !!editingWorkout?.id }
  );

  // Load exercises when editing workout changes
  useEffect(() => {
    if (workoutWithExercisesQuery.data && editingWorkout) {
      const wData = workoutWithExercisesQuery.data as any;
      const exs = (wData.exercises || []).map((ex: any, i: number) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        name: ex.exerciseName || ex.name || 'Exercício',
        imageUrl: ex.exerciseImageUrl || ex.imageUrl,
        videoUrl: ex.exerciseVideoUrl || ex.videoUrl,
        muscleGroup: ex.exerciseMuscleGroup || ex.muscleGroup,
        sets: ex.sets || 3,
        reps: ex.reps || "12",
        load: ex.load || "",
        restSeconds: ex.restSeconds || 60,
        dayOfWeek: ex.dayOfWeek || "Segunda",
        technique: ex.technique || "normal",
        notes: ex.notes || "",
        orderIndex: ex.orderIndex ?? i,
      }));
      setWorkoutExercises(exs);
      setEditingWorkout((prev: any) => prev ? { ...prev, exercises: wData.exercises || [] } : prev);
    }
  }, [workoutWithExercisesQuery.data]);

  // Dashboard queries
  const { data: dashboardMetrics } = trpc.professorDashboard.getMetrics.useQuery();

  // Filter workouts for "Treinos Criados" screen
  const filteredWorkouts = useMemo(() => {
    let filtered = [...workouts];
    if (workoutStatusFilter === "active") filtered = filtered.filter((w: any) => w.active);
    else if (workoutStatusFilter === "inactive") filtered = filtered.filter((w: any) => !w.active);
    if (workoutSearchTerm) {
      const s = workoutSearchTerm.toLowerCase();
      filtered = filtered.filter((w: any) => {
        const student = students.find((st: any) => st.id === w.studentId);
        return w.name?.toLowerCase().includes(s) || student?.name?.toLowerCase().includes(s);
      });
    }
    return filtered;
  }, [workouts, workoutStatusFilter, workoutSearchTerm, students]);

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

  // Biblioteca modal filtered exercises
  const bibliotecaFiltered = useMemo(() => {
    let filtered = [...exercises];
    if (bibliotecaSearch) {
      const s = bibliotecaSearch.toLowerCase();
      filtered = filtered.filter((ex: any) => ex.name.toLowerCase().includes(s) || ex.muscleGroup?.toLowerCase().includes(s));
    }
    if (bibliotecaMuscle !== "all") {
      filtered = filtered.filter((ex: any) => ex.muscleGroup === bibliotecaMuscle);
    }
    return filtered;
  }, [exercises, bibliotecaSearch, bibliotecaMuscle]);

  const bibliotecaPaginated = useMemo(() => {
    const start = (bibliotecaPage - 1) * BIBLIOTECA_PER_PAGE;
    return bibliotecaFiltered.slice(start, start + BIBLIOTECA_PER_PAGE);
  }, [bibliotecaFiltered, bibliotecaPage]);

  const bibliotecaTotalPages = Math.ceil(bibliotecaFiltered.length / BIBLIOTECA_PER_PAGE);

  // Days of week for workout exercises
  const daysOfWeek = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  // Group workout exercises by day
  const exercisesByDay = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    daysOfWeek.forEach(d => { grouped[d] = []; });
    workoutExercises.forEach(ex => {
      const day = ex.dayOfWeek || "Segunda";
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(ex);
    });
    return grouped;
  }, [workoutExercises]);

  // Add exercise from library to workout
  const handleAddExerciseToWorkout = (exercise: any) => {
    setWorkoutExercises(prev => [...prev, {
      exerciseId: exercise.id,
      name: exercise.name,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      muscleGroup: exercise.muscleGroup,
      sets: 3,
      reps: "12",
      load: "",
      restSeconds: 60,
      dayOfWeek: "Segunda",
      technique: "normal",
      notes: "",
      orderIndex: prev.length,
    }]);
    setShowBibliotecaModal(false);
    toast.success(`${exercise.name} adicionado ao treino`);
  };

  // Remove exercise from workout
  const handleRemoveWorkoutExercise = (index: number) => {
    setWorkoutExercises(prev => prev.filter((_, i) => i !== index));
  };

  // Update exercise in workout
  const handleUpdateWorkoutExercise = (index: number, field: string, value: any) => {
    setWorkoutExercises(prev => prev.map((ex, i) => i === index ? { ...ex, [field]: value } : ex));
  };

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
      setExerciseVideoFile(null);
      setExerciseMedia1Link("");
      setExerciseMedia2Link("");
      setExerciseMedia1Preview(null);
      setExerciseMedia2Preview(null);
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

  // Video queries & mutations - funciona tanto no detail quanto no edit dialog
  const videoExerciseId = selectedExercise?.id || editingExercise?.id || 0;
  const videoQueryEnabled = (!!selectedExercise?.id && isExerciseDetailOpen) || (!!editingExercise?.id && isEditExerciseDialogOpen);
  const { data: exerciseVideos = [], refetch: refetchVideos } = trpc.exercises.videos.list.useQuery(
    { exerciseId: videoExerciseId },
    { enabled: videoQueryEnabled }
  );

  const addVideoMutation = trpc.exercises.videos.add.useMutation({
    onSuccess: () => {
      toast.success("Vídeo enviado com sucesso!");
      refetchVideos();
      setVideoFile(null);
      setIsUploadingVideo(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar vídeo");
      setIsUploadingVideo(false);
      setUploadProgress(0);
    },
  });

  const addVideoUrlMutation = trpc.exercises.videos.addUrl.useMutation({
    onSuccess: () => {
      toast.success("Vídeo adicionado com sucesso!");
      refetchVideos();
      setVideoUrl("");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar vídeo");
    },
  });

  const deleteVideoMutation = trpc.exercises.videos.delete.useMutation({
    onSuccess: () => {
      toast.success("Vídeo removido com sucesso!");
      refetchVideos();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover vídeo");
    },
  });

  const handleUploadVideo = async () => {
    const exerciseId = selectedExercise?.id || editingExercise?.id;
    if (!videoFile || !exerciseId) return;
    if (videoFile.size > 100 * 1024 * 1024) {
      toast.error("Vídeo muito grande. Máximo 100MB.");
      return;
    }

    setIsUploadingVideo(true);
    setUploadProgress(10);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        setUploadProgress(50);
        const base64 = (reader.result as string).split(",")[1];
        await addVideoMutation.mutateAsync({
          exerciseId,
          videoData: base64,
          title: videoFile.name,
        });
      };
      reader.readAsDataURL(videoFile);
    } catch (err) {
      setIsUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const handleAddVideoUrl = () => {
    const exerciseId = selectedExercise?.id || editingExercise?.id;
    if (!videoUrl || !exerciseId) return;
    addVideoUrlMutation.mutate({
      exerciseId,
      videoUrl,
      title: "Vídeo externo",
    });
  };

  const deleteWorkoutMutation = trpc.workouts.delete.useMutation({
    onSuccess: () => {
      toast.success("Treino excluído com sucesso!");
      refetchWorkouts();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir treino");
    },
  });

  const cloneWorkoutMutation = trpc.workouts.clone.useMutation({
    onSuccess: () => {
      toast.success("Treino clonado com sucesso!");
      refetchWorkouts();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao clonar treino");
    },
  });

  const createWorkoutMutation = trpc.workouts.create.useMutation({
    onError: (error) => {
      toast.error(error.message || "Erro ao criar treino");
    },
  });

  const updateWorkoutMutation = trpc.workouts.update.useMutation({
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar treino");
    },
  });

  const addExerciseToWorkoutMutation = trpc.workouts.addExercise.useMutation({
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar exercício");
    },
  });

  const updateWorkoutExerciseMutation = trpc.workouts.updateExercise.useMutation({
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar exercício");
    },
  });

  const deleteWorkoutExerciseMutation = trpc.workouts.deleteExercise.useMutation({
    onError: (error) => {
      toast.error(error.message || "Erro ao remover exercício");
    },
  });

  const handleSaveWorkout = async () => {
    if (!selectedAluno || !workoutForm.name || !workoutForm.startDate) {
      toast.error("Preencha o nome e a data de início");
      return;
    }
    if (workoutExercises.length === 0) {
      toast.error("Adicione pelo menos um exercício");
      return;
    }
    try {
      if (editingWorkout) {
        // Update existing workout
        await updateWorkoutMutation.mutateAsync({
          workoutId: editingWorkout.id,
          name: workoutForm.name,
          startDate: workoutForm.startDate,
          endDate: workoutForm.endDate || undefined,
        });
        // Delete existing exercises and re-add
        const existingExercises = editingWorkout.exercises || [];
        for (const ex of existingExercises) {
          if (ex.id) await deleteWorkoutExerciseMutation.mutateAsync({ id: ex.id });
        }
        for (let i = 0; i < workoutExercises.length; i++) {
          const ex = workoutExercises[i];
          await addExerciseToWorkoutMutation.mutateAsync({
            workoutId: editingWorkout.id,
            exerciseId: ex.exerciseId,
            dayOfWeek: ex.dayOfWeek || "Segunda",
            sets: ex.sets || 3,
            reps: ex.reps || "12",
            load: ex.load || undefined,
            restSeconds: ex.restSeconds || undefined,
            technique: ex.technique || undefined,
            notes: ex.notes || undefined,
            orderIndex: i,
          });
        }
        toast.success("Treino atualizado com sucesso!");
      } else {
        // Create new workout
        const result = await createWorkoutMutation.mutateAsync({
          studentId: selectedAluno.id,
          name: workoutForm.name,
          startDate: workoutForm.startDate,
          endDate: workoutForm.endDate || undefined,
        });
        for (let i = 0; i < workoutExercises.length; i++) {
          const ex = workoutExercises[i];
          await addExerciseToWorkoutMutation.mutateAsync({
            workoutId: result.workoutId,
            exerciseId: ex.exerciseId,
            dayOfWeek: ex.dayOfWeek || "Segunda",
            sets: ex.sets || 3,
            reps: ex.reps || "12",
            load: ex.load || undefined,
            restSeconds: ex.restSeconds || undefined,
            technique: ex.technique || undefined,
            notes: ex.notes || undefined,
            orderIndex: i,
          });
        }
        toast.success("Treino criado com sucesso!");
      }
      setWorkoutForm({ name: "", startDate: "", endDate: "" });
      setWorkoutExercises([]);
      setEditingWorkout(null);
      refetchWorkouts();
      setCurrentScreen("treinos-aluno");
    } catch (err) {
      // errors handled by mutation
    }
  };

  // Save as template from workout form
  const handleSaveAsTemplate = async () => {
    if (!workoutForm.name || workoutExercises.length === 0) {
      toast.error("Preencha o nome e adicione exercícios");
      return;
    }
    try {
      const result = await createTemplateMutation.mutateAsync({
        name: workoutForm.name,
        description: undefined,
      });
      // Add exercises to template
      for (let i = 0; i < workoutExercises.length; i++) {
        const ex = workoutExercises[i];
        await addTemplateExerciseMutation.mutateAsync({
          templateId: result.templateId,
          exerciseId: ex.exerciseId,
          dayOfWeek: ex.dayOfWeek || "Segunda",
          sets: ex.sets || 3,
          reps: ex.reps || "12",
          load: ex.load || undefined,
          restSeconds: ex.restSeconds || undefined,
          technique: ex.technique || undefined,
          notes: ex.notes || undefined,
          orderIndex: i,
        });
      }
      toast.success("Modelo salvo com sucesso!");
    } catch (err) {
      // handled by mutation
    }
  };

  // Load workout exercises when editing
  const handleEditWorkout = async (workout: any) => {
    setEditingWorkout(workout);
    setWorkoutForm({
      name: workout.name || "",
      startDate: workout.startDate ? new Date(workout.startDate).toISOString().split('T')[0] : "",
      endDate: workout.endDate ? new Date(workout.endDate).toISOString().split('T')[0] : "",
    });
    // We need to fetch the exercises
    try {
      const data = await workoutWithExercisesQuery.refetch();
      // This will be handled by the useEffect below
    } catch (err) {
      // handled
    }
    setCurrentScreen("criar-treino");
  };

  // Template mutations
  const toggleTemplateMutation = trpc.templates.toggle.useMutation({
    onSuccess: () => {
      toast.success("Status do modelo atualizado!");
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar modelo");
    },
  });

  const deleteTemplateMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("Modelo excluído com sucesso!");
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir modelo");
    },
  });

  const createTemplateMutation = trpc.templates.create.useMutation({
    onSuccess: (data: any, variables) => {
      toast.success("Modelo criado com sucesso!");
      refetchTemplates();
      // Navigate to edit screen for the new template
      if (data?.templateId) {
        const newTemplate = { id: data.templateId, name: variables.name || "Novo Treino", description: variables.description || "", active: true };
        handleOpenEditTemplate(newTemplate);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar modelo");
    },
  });

  const applyTemplateMutation = trpc.templates.applyToStudents.useMutation({
    onSuccess: (data) => {
      toast.success(`Treino aplicado para ${data.results?.length || 0} aluno(s)!`);
      setApplyModalOpen(false);
      setApplyingTemplateId(null);
      setApplyStudentIds([]);
      refetchWorkouts();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aplicar modelo");
    },
  });

  const fromWorkoutMutation = trpc.templates.fromWorkout.useMutation({
    onSuccess: () => {
      toast.success("Modelo criado a partir do treino!");
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar modelo");
    },
  });

  const cloneTemplateMutation = trpc.templates.clone.useMutation({
    onSuccess: () => {
      toast.success("Modelo duplicado com sucesso!");
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao duplicar modelo");
    },
  });

  const addTemplateExerciseMutation = trpc.templates.addExercise.useMutation({
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar exercício ao modelo");
    },
  });

  const deleteTemplateExerciseMutation = trpc.templates.deleteExercise.useMutation({
    onError: (error) => {
      toast.error(error.message || "Erro ao remover exercício do modelo");
    },
  });

  const updateTemplateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      toast.success("Modelo atualizado!");
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar modelo");
    },
  });

  // Query template with exercises when editing
  const templateWithExercisesQuery = trpc.templates.getById.useQuery(
    { id: editingTemplate?.id || 0 },
    { enabled: !!editingTemplate?.id }
  );

  // Load template exercises when data arrives
  useEffect(() => {
    if (templateWithExercisesQuery.data && editingTemplate) {
      const tData = templateWithExercisesQuery.data as any;
      setTemplateForm({
        name: tData.name || "",
        description: tData.description || "",
        startDate: "",
        endDate: "",
      });
      const exs = (tData.exercises || []).map((ex: any, i: number) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        name: ex.exerciseName || ex.name || 'Exercício',
        imageUrl: ex.exerciseImageUrl || ex.imageUrl,
        videoUrl: ex.exerciseVideoUrl || ex.videoUrl,
        muscleGroup: ex.exerciseMuscleGroup || ex.muscleGroup,
        sets: ex.sets_count || ex.sets || 3,
        reps: ex.reps || "12",
        load: ex.load_value || ex.load || "",
        restSeconds: ex.restSeconds || 60,
        technique: ex.technique || "normal",
        notes: ex.notes || "",
        orderIndex: ex.orderIndex ?? i,
      }));
      setTemplateExercises(exs);
    }
  }, [templateWithExercisesQuery.data]);

  // Sidebar filtered exercises for template edit
  const templateSidebarFiltered = useMemo(() => {
    let filtered = [...exercises];
    if (templateSidebarSearch) {
      const s = templateSidebarSearch.toLowerCase();
      filtered = filtered.filter((ex: any) => ex.name.toLowerCase().includes(s) || ex.muscleGroup?.toLowerCase().includes(s));
    }
    if (templateSidebarMuscle !== "all") {
      filtered = filtered.filter((ex: any) => ex.muscleGroup === templateSidebarMuscle);
    }
    return filtered;
  }, [exercises, templateSidebarSearch, templateSidebarMuscle]);

  const handleOpenEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateForm({ name: template.name || "", description: template.description || "", startDate: "", endDate: "" });
    setTemplateExercises([]);
    setTemplateSidebarSearch("");
    setTemplateSidebarMuscle("all");
    setCurrentScreen("editar-modelo");
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !templateForm.name) {
      toast.error("Nome do modelo é obrigatório");
      return;
    }
    try {
      // Update template metadata
      await updateTemplateMutation.mutateAsync({
        id: editingTemplate.id,
        name: templateForm.name,
        description: templateForm.description || undefined,
      });
      // Clear old exercises and re-add
      await clearTemplateExercisesMutation.mutateAsync({ templateId: editingTemplate.id });
      for (let i = 0; i < templateExercises.length; i++) {
        const ex = templateExercises[i];
        await addTemplateExerciseMutation.mutateAsync({
          templateId: editingTemplate.id,
          exerciseId: ex.exerciseId,
          dayOfWeek: ex.dayOfWeek || "Segunda",
          sets: ex.sets || 3,
          reps: ex.reps || "12",
          load: ex.load || undefined,
          restSeconds: ex.restSeconds || undefined,
          technique: ex.technique || undefined,
          notes: ex.notes || undefined,
          orderIndex: i,
        });
      }
      toast.success("Modelo salvo com sucesso!");
      refetchTemplates();
      setCurrentScreen("modelos");
    } catch (err) {
      // handled
    }
  };

  const clearTemplateExercisesMutation = trpc.templates.clearExercises.useMutation({
    onError: (error) => {
      toast.error(error.message || "Erro ao limpar exercícios");
    },
  });

  const handleAddExerciseToTemplate = (exercise: any) => {
    setTemplateExercises(prev => [...prev, {
      exerciseId: exercise.id,
      name: exercise.name,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      muscleGroup: exercise.muscleGroup,
      sets: 3,
      reps: "12",
      load: "",
      restSeconds: 60,
      technique: "normal",
      notes: "",
      orderIndex: prev.length,
    }]);
    toast.success(`${exercise.name} adicionado`);
  };

  const handleApplyTemplate = () => {
    if (!applyingTemplateId || applyStudentIds.length === 0) {
      toast.error("Selecione pelo menos um aluno");
      return;
    }
    if (!applyStartDate) {
      toast.error("Informe a data de início");
      return;
    }
    applyTemplateMutation.mutate({
      templateId: applyingTemplateId,
      studentIds: applyStudentIds,
      startDate: applyStartDate,
      endDate: applyEndDate || undefined,
    });
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este modelo?")) {
      deleteTemplateMutation.mutate({ id });
    }
  };

  // Template search/filter
  const [templateSearch, setTemplateSearch] = useState("");
  const filteredTemplates = useMemo(() => {
    if (!templateSearch) return templates;
    const searchLower = templateSearch.toLowerCase();
    return templates.filter((t: any) =>
      t.name.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower)
    );
  }, [templates, templateSearch]);

  // Apply modal filtered students
  const applyFilteredStudents = useMemo(() => {
    if (!applySearch) return students;
    const searchLower = applySearch.toLowerCase();
    return students.filter((s: any) =>
      s.name.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower)
    );
  }, [students, applySearch]);

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

    // Determine videoUrl from media 2 (file or external link)
    const videoUrlValue = exerciseMedia2Link || undefined;

    let imageData: string | undefined;
    if (exerciseImageFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        imageData = reader.result as string;
        await createExerciseMutation.mutateAsync({
          ...exerciseForm,
          imageData,
          videoUrl: videoUrlValue,
        });
      };
      reader.readAsDataURL(exerciseImageFile);
    } else if (exerciseMedia1Link) {
      // Use external link as videoUrl for media 1 (image link)
      await createExerciseMutation.mutateAsync({
        ...exerciseForm,
        videoUrl: videoUrlValue,
      });
    } else {
      await createExerciseMutation.mutateAsync({
        ...exerciseForm,
        videoUrl: videoUrlValue,
      });
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
      videoUrl: exercise.videoUrl || "",
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

  const sidebarItems = [
    { id: "alunos", icon: Home, label: "Sócio" },
    { id: "todos-treinos", icon: FileText, label: "Treinos Criados" },
    { id: "exercicios", icon: Dumbbell, label: "Exercicios" },
    { id: "modelos", icon: Library, label: "Biblioteca De Treinos" },
    { id: "criar-treino", icon: ClipboardList, label: "Programas" },
    { id: "avaliacoes", icon: Activity, label: "Avaliação Física" },
  ];

  const handleNavClick = (id: string) => {
    if (id === "criar-treino") {
      if (!selectedAluno) {
        setCurrentScreen("alunos");
        toast.error("Selecione um aluno primeiro");
        return;
      }
      setEditingWorkout(null);
    }
    setCurrentScreen(id as any);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Dumbbell className="w-7 h-7 text-blue-500" />
              <span className="font-bold text-lg text-gray-800">SysFit Pro</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className={`w-5 h-5 text-gray-500 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id || (item.id === 'criar-treino' && (currentScreen === 'criar-treino' || currentScreen === 'treinos-aluno')) || (item.id === 'modelos' && currentScreen === 'editar-modelo') || (item.id === 'avaliacoes' && currentScreen === 'avaliacao-form');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isActive ? 'bg-blue-400 text-white' : ''}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen && (
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Professor'}</p>
              <p className="text-xs text-gray-500">Professor</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileSidebarOpen(true)} className="p-1">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Dumbbell className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-800">SysFit Pro</span>
          </div>
          <button onClick={handleLogout} className="p-1 text-red-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        {/* Mobile tabs */}
        <div className="flex overflow-x-auto px-2 pb-2 gap-1 scrollbar-hide">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-7 h-7 text-blue-500" />
                <span className="font-bold text-lg">SysFit Pro</span>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isActive ? 'bg-blue-400 text-white' : ''}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Professor'}</p>
              <p className="text-xs text-gray-500 mb-3">Professor</p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition px-2 py-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-24 overflow-auto p-3 sm:p-6">

        {/* Tab: Sócio (Alunos) */}
        {currentScreen === "alunos" && (
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Meus Alunos</h2>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 sm:left-3 top-2 sm:top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  value={studentFilters.searchTerm}
                  onChange={(e) => setStudentFilters({ ...studentFilters, searchTerm: e.target.value })}
                  placeholder="Buscar aluno..."
                  style={{ fontSize: '16px' }}
                  className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto outline-none"
                />
              </div>
            </div>

            {/* Info bar */}
            {filteredAndSortedStudents.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="hidden sm:inline">Exibindo {filteredAndSortedStudents.length} de {students.length} sócios</span>
                  <span className="sm:hidden">{filteredAndSortedStudents.length} alunos</span>
                </div>
              </div>
            )}

            {filteredAndSortedStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">Nenhum aluno encontrado</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredAndSortedStudents.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => {
                      setSelectedAluno(student);
                      setCurrentScreen("treinos-aluno");
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{student.name}</h3>
                      <p className="text-xs text-gray-500 truncate mt-0.5">Ficha #{student.id}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Treinos Criados */}
        {currentScreen === "todos-treinos" && (
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Treinos Criados</h2>

            {/* Busca e Filtro */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por sócio ou nome do treino..."
                  value={workoutSearchTerm}
                  onChange={(e) => setWorkoutSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <select
                value={workoutStatusFilter}
                onChange={(e) => setWorkoutStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>

            {filteredWorkouts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 text-sm sm:text-base">Nenhum treino criado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWorkouts.map((workout: any) => {
                  const student = students.find((s: any) => s.id === workout.studentId);
                  const isActive = workout.active;
                  return (
                    <div
                      key={workout.id}
                      className={`border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition cursor-pointer ${isActive ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}
                      onClick={() => {
                        if (student) {
                          setSelectedAluno(student);
                          setCurrentScreen("treinos-aluno");
                        }
                      }}
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">{workout.name || 'Treino sem nome'}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          {student && <p className="text-sm text-blue-600 font-medium mb-1">{student.name}</p>}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {workout.startDate ? new Date(workout.startDate).toLocaleDateString('pt-BR') : '-'}
                                {' - '}
                                {workout.endDate ? new Date(workout.endDate).toLocaleDateString('pt-BR') : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Dumbbell className="w-3 h-3" />
                              <span>{workout.exerciseCount || 0} exercícios</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 hidden sm:block" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Treinos do Aluno */}
        {currentScreen === "treinos-aluno" && (
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedAluno(null); setCurrentScreen("alunos"); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                  title="Voltar para lista de sócios"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {selectedAluno ? selectedAluno.name : 'Treinos do Aluno'}
                  </h2>
                  {selectedAluno && (
                    <p className="text-xs text-gray-500">Código: {selectedAluno.registrationNumber || selectedAluno.id} | Sócio</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingWorkout(null);
                  setWorkoutForm({ name: "", startDate: "", endDate: "" });
                  setWorkoutExercises([]);
                  setCurrentScreen("criar-treino");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Novo Treino
              </button>
            </div>

            {/* Student workouts list */}
            {(() => {
              const studentWorkouts = workouts.filter((w: any) => w.studentId === selectedAluno?.id);
              return studentWorkouts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base mb-4">Nenhum treino criado para este aluno</p>
                  <button
                    onClick={() => {
                      setEditingWorkout(null);
                      setWorkoutForm({ name: "", startDate: "", endDate: "" });
                      setWorkoutExercises([]);
                      setCurrentScreen("criar-treino");
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg text-sm"
                  >
                    <Plus className="w-4 h-4" /> Criar Primeiro Treino
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentWorkouts.map((workout: any) => {
                    const isActive = workout.active;
                    return (
                      <div
                        key={workout.id}
                        className={`border rounded-lg p-3 sm:p-4 ${isActive ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">{workout.name || 'Treino sem nome'}</h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {workout.startDate ? new Date(workout.startDate).toLocaleDateString('pt-BR') : '-'}
                                  {' até '}
                                  {workout.endDate ? new Date(workout.endDate).toLocaleDateString('pt-BR') : '-'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Dumbbell className="w-3 h-3" />
                                <span>{workout.exerciseCount || 0} exercicios</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleEditWorkout(workout)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition"
                            >
                              <Edit className="w-3.5 h-3.5" /> Editar
                            </button>
                            <button
                              onClick={() => cloneWorkoutMutation.mutate({ workoutId: workout.id })}
                              disabled={cloneWorkoutMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                            >
                              <Copy className="w-3.5 h-3.5" /> Clonar
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Excluir este treino?")) deleteWorkoutMutation.mutate({ workoutId: workout.id });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Deletar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab: Exercícios */}
        {currentScreen === "exercicios" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Exercicios</h2>
              <button
                onClick={() => setIsExerciseDialogOpen(true)}
                className="w-10 h-10 flex items-center justify-center bg-blue-400 hover:bg-blue-500 text-white rounded-full transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-blue-400 bg-blue-50 text-gray-800 font-medium">
                <Dumbbell className="w-3.5 h-3.5" /> {exercises.length} exercicios
              </span>
              <span className="text-gray-400">|</span>
              <span>{exercises.filter((e: any) => !e.createdBy || e.createdBy === 0).length} biblioteca</span>
              <span>{exercises.filter((e: any) => e.createdBy && e.createdBy > 0).length} próprio</span>
            </div>

            {/* Stats chips */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setExerciseFilters({ ...exerciseFilters, muscleGroup: "all" })}
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1 rounded-full border-2 transition cursor-pointer ${
                  exerciseFilters.muscleGroup === "all"
                    ? 'border-blue-400 bg-blue-50 text-gray-800'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300'
                }`}
              >
                <span className="font-bold">{exercises.length}</span> Total
              </button>
              {muscleGroups.map((group: any) => (
                <button
                  key={group}
                  onClick={() => setExerciseFilters({ ...exerciseFilters, muscleGroup: exerciseFilters.muscleGroup === group ? "all" : group })}
                  className={`inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1 rounded-full border-2 transition cursor-pointer ${
                    exerciseFilters.muscleGroup === group
                      ? 'border-blue-400 bg-blue-50 text-gray-800'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar exercícios..."
                value={exerciseFilters.searchTerm}
                onChange={(e) => setExerciseFilters({ ...exerciseFilters, searchTerm: e.target.value })}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white outline-none"
                style={{ fontSize: '16px' }}
              />
            </div>

            {exercises.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="mb-4">Nenhum exercício cadastrado</p>
                <button
                  onClick={() => setIsExerciseDialogOpen(true)}
                  className="inline-flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 text-sm"
                >
                  <Plus className="w-4 h-4" /> Criar Primeiro Exercício
                </button>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum exercício encontrado com esses filtros</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
                  {paginatedExercises.map((exercise: any) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => { setSelectedExercise(exercise); setIsExerciseDetailOpen(true); }}
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {(exercise.videoUrl || exercise.imageUrl) ? (
                          <img src={exercise.videoUrl || exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><Dumbbell className="w-6 h-6" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{exercise.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {[exercise.equipment, exercise.muscleGroup].filter(Boolean).join(', ')}
                        </p>
                        {exercise.equipment && (
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">{exercise.equipment}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleEditExercise(exercise); }} className="p-1.5 text-gray-400 hover:text-blue-500 transition" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteExercise(exercise.id); }} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalExercisePages > 1 && (
                  <div className="flex items-center justify-center gap-3 py-2">
                    <button onClick={() => setExercisePage(Math.max(1, exercisePage - 1))} disabled={exercisePage === 1} className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Anterior</span>
                    </button>
                    <span className="text-sm text-gray-600">Pág {exercisePage}/{totalExercisePages}</span>
                    <button onClick={() => setExercisePage(Math.min(totalExercisePages, exercisePage + 1))} disabled={exercisePage === totalExercisePages} className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      <span className="hidden sm:inline">Próxima</span><ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: Biblioteca De Treinos (Templates) */}
        {currentScreen === "modelos" && (
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Biblioteca De Treinos</h2>
              <button
                onClick={() => {
                  createTemplateMutation.mutate({ name: "Novo Treino" });
                }}
                disabled={createTemplateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Novo Modelo
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar modelos..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                style={{ fontSize: '16px' }}
              />
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Library className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 text-sm sm:text-base">
                  {templateSearch ? 'Nenhum modelo encontrado com esse filtro' : 'Nenhum modelo criado ainda'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template: any) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition cursor-pointer ${
                      template.active ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
                    }`}
                    onClick={() => handleOpenEditTemplate(template)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">{template.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${template.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {template.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-500 mb-1 line-clamp-2">{template.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(template.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {/* Toggle */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTemplateMutation.mutate({ id: template.id }); }}
                          className={`relative w-10 h-5 rounded-full transition ${template.active ? 'bg-green-400' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${template.active ? 'left-5' : 'left-0.5'}`} />
                        </button>
                        {/* Copy */}
                        <button
                          onClick={(e) => { e.stopPropagation(); cloneTemplateMutation.mutate({ id: template.id }); }}
                          disabled={cloneTemplateMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition"
                          title="Copiar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {/* Apply to students */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setApplyingTemplateId(template.id);
                            setApplyStudentIds([]);
                            setApplySearch("");
                            setApplyStartDate(new Date().toISOString().split('T')[0]);
                            setApplyEndDate("");
                            setApplyModalOpen(true);
                          }}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          title="Aplicar em alunos"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Programas (Criar/Editar Treino) */}
        {currentScreen === "criar-treino" && (
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            {!selectedAluno ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Selecione um aluno primeiro na aba "Sócio"</p>
                <button onClick={() => setCurrentScreen("alunos")} className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg text-sm">
                  Ir para Sócio
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4">
                  {editingWorkout ? `Editar Treino: ${editingWorkout.name || ''}` : `Criar Treino para ${selectedAluno.name}`}
                </h2>

                {/* Use Template button - only for new workouts */}
                {!editingWorkout && templates.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-1.5 px-4 py-2 border-2 border-blue-400 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-50 transition mb-4">
                        <Library className="w-4 h-4" /> Usar Modelo de Treino
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Selecionar Modelo</DialogTitle>
                        <DialogDescription>Escolha um modelo para preencher o treino</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {templates.filter((t: any) => t.active).map((t: any) => (
                          <button
                            key={t.id}
                            className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 transition"
                            onClick={async () => {
                              try {
                                // Fetch template exercises via API
                                applyTemplateMutation.mutate({
                                  templateId: t.id,
                                  studentIds: [selectedAluno.id],
                                  startDate: workoutForm.startDate || new Date().toISOString().split('T')[0],
                                  endDate: workoutForm.endDate || undefined,
                                });
                              } catch (err) {
                                // handled
                              }
                            }}
                          >
                            <p className="font-medium text-gray-900">{t.name}</p>
                            {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nome do Plano *</Label>
                    <Input
                      placeholder="Ex: Treino A - Hipertrofia"
                      value={workoutForm.name}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                      style={{ fontSize: 16 }}
                    />
                  </div>

                  {/* Aluno readonly */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Aluno</Label>
                    <Input value={selectedAluno.name} disabled className="bg-gray-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Data Inicio *</Label>
                      <Input type="date" value={workoutForm.startDate} onChange={(e) => setWorkoutForm({ ...workoutForm, startDate: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Data Fim *</Label>
                      <Input type="date" value={workoutForm.endDate} onChange={(e) => setWorkoutForm({ ...workoutForm, endDate: e.target.value })} />
                    </div>
                  </div>

                  {/* Exercises section */}
                  <div className="border-t pt-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          Exercícios ({workoutExercises.length})
                        </h3>
                        {/* View mode toggle */}
                        <div className="flex border rounded-lg overflow-hidden">
                          <button
                            onClick={() => setViewMode("list")}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition ${viewMode === "list" ? 'bg-blue-400 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                          >
                            <ClipboardList className="w-3 h-3" /> Lista
                          </button>
                          <button
                            onClick={() => setViewMode("byDay")}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition ${viewMode === "byDay" ? 'bg-blue-400 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                          >
                            <Calendar className="w-3 h-3" /> Por Dia
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setBibliotecaSearch(""); setBibliotecaMuscle("all"); setBibliotecaPage(1); setShowBibliotecaModal(true); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-400 hover:bg-blue-500 text-white rounded-lg text-sm transition"
                        >
                          <Library className="w-4 h-4" /> Da Biblioteca
                        </button>
                        <button
                          onClick={() => {
                            setWorkoutExercises(prev => [...prev, {
                              exerciseId: 0,
                              name: "",
                              imageUrl: null,
                              videoUrl: null,
                              muscleGroup: "",
                              sets: 3,
                              reps: "12",
                              load: "",
                              restSeconds: 60,
                              dayOfWeek: "Segunda",
                              technique: "normal",
                              notes: "",
                              orderIndex: prev.length,
                            }]);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition"
                        >
                          <Plus className="w-4 h-4" /> Manual
                        </button>
                      </div>
                    </div>

                    {workoutExercises.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Dumbbell className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Adicione exercícios ao treino</p>
                      </div>
                    ) : viewMode === "list" ? (
                      /* LIST VIEW */
                      <div className="space-y-4">
                        {workoutExercises.map((ex, idx) => (
                          <div key={idx} className="border rounded-lg p-3 hover:bg-gray-50 transition">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                <span className="text-sm font-semibold text-gray-700">Exercício {idx + 1}</span>
                              </div>
                              <button onClick={() => handleRemoveWorkoutExercise(idx)} className="text-sm text-red-500 hover:text-red-700 font-medium">
                                Remover
                              </button>
                            </div>

                            <div className="flex items-start gap-3">
                              {/* Thumbnail */}
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 cursor-pointer" onClick={() => setVideoModalExercicio(ex)}>
                                {(ex.videoUrl || ex.imageUrl) ? (
                                  <img src={ex.videoUrl || ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Dumbbell className="w-5 h-5 text-gray-300" /></div>
                                )}
                              </div>
                              {/* Name */}
                              <div className="flex-1 min-w-0">
                                <label className="text-xs text-gray-500 block mb-0.5">Nome do Exercício</label>
                                <input
                                  type="text"
                                  value={ex.name}
                                  onChange={(e) => handleUpdateWorkoutExercise(idx, "name", e.target.value)}
                                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                                  placeholder="Nome do exercício"
                                  readOnly={!!ex.exerciseId}
                                />
                              </div>
                            </div>

                            {/* Fields grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Dia</label>
                                <select value={ex.dayOfWeek} onChange={(e) => handleUpdateWorkoutExercise(idx, "dayOfWeek", e.target.value)}
                                  className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white">
                                  {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Séries</label>
                                <input type="number" value={ex.sets} onChange={(e) => handleUpdateWorkoutExercise(idx, "sets", parseInt(e.target.value) || 0)}
                                  className="w-full border rounded-lg px-2 py-1.5 text-sm text-center" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Repetições</label>
                                <input type="text" value={ex.reps} onChange={(e) => handleUpdateWorkoutExercise(idx, "reps", e.target.value)}
                                  className="w-full border rounded-lg px-2 py-1.5 text-sm text-center" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Peso (kg)</label>
                                <input type="text" value={ex.load} onChange={(e) => handleUpdateWorkoutExercise(idx, "load", e.target.value)}
                                  className="w-full border rounded-lg px-2 py-1.5 text-sm text-center" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Descanso (seg)</label>
                                <input type="number" value={ex.restSeconds} onChange={(e) => handleUpdateWorkoutExercise(idx, "restSeconds", parseInt(e.target.value) || 0)}
                                  className="w-full border rounded-lg px-2 py-1.5 text-sm text-center" />
                              </div>
                            </div>

                            {/* Method + Notes row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Método</label>
                                <select value={ex.technique || "normal"} onChange={(e) => handleUpdateWorkoutExercise(idx, "technique", e.target.value)}
                                  className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white">
                                  <option value="normal">Normal</option>
                                  <option value="dropset">Drop Set</option>
                                  <option value="superset">Super Set</option>
                                  <option value="giant_set">Giant Set</option>
                                  <option value="rest_pause">Rest Pause</option>
                                  <option value="pyramidal">Pirâmide</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-0.5">Observação para o Aluno</label>
                                <input type="text" value={ex.notes || ""} onChange={(e) => handleUpdateWorkoutExercise(idx, "notes", e.target.value)}
                                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                                  placeholder="Ex: Manter cotovelos junto ao corpo..." />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* BY DAY VIEW */
                      <div className="space-y-4">
                        {daysOfWeek.map(day => {
                          const dayExercises = exercisesByDay[day] || [];
                          if (dayExercises.length === 0) return null;
                          return (
                            <div key={day}>
                              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {day} <span className="text-xs text-gray-400 font-normal">({dayExercises.length} exercícios)</span>
                              </h4>
                              <div className="space-y-2 ml-6">
                                {dayExercises.map((ex: any) => {
                                  const idx = workoutExercises.indexOf(ex);
                                  return (
                                    <div key={idx} className="flex items-center gap-3 border rounded-lg p-2 bg-gray-50">
                                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 shrink-0">
                                        {(ex.videoUrl || ex.imageUrl) ? <img src={ex.videoUrl || ex.imageUrl} alt="" className="w-full h-full object-cover" /> : <Dumbbell className="w-4 h-4 m-3 text-gray-400" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{ex.name}</p>
                                        <p className="text-xs text-gray-500">{ex.sets}x{ex.reps} {ex.load ? `• ${ex.load}kg` : ''} {ex.restSeconds ? `• ${ex.restSeconds}s` : ''} {ex.technique && ex.technique !== 'normal' ? `• ${ex.technique}` : ''}</p>
                                      </div>
                                      <button onClick={() => handleRemoveWorkoutExercise(idx)} className="p-1 text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {workoutExercises.length > 0 && Object.values(exercisesByDay).every(arr => arr.length === 0) && (
                          <p className="text-center text-gray-400 text-sm py-4">Nenhum exercício organizado por dia</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Save/Cancel/Save Model buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <button onClick={() => { setEditingWorkout(null); setWorkoutExercises([]); setCurrentScreen("treinos-aluno"); }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium">
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveAsTemplate}
                      disabled={createTemplateMutation.isPending}
                      className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                      <BookOpen className="w-4 h-4" />
                      {createTemplateMutation.isPending ? "Salvando..." : "Salvar Modelo"}
                    </button>
                    <button
                      onClick={handleSaveWorkout}
                      disabled={createWorkoutMutation.isPending || updateWorkoutMutation.isPending || addExerciseToWorkoutMutation.isPending}
                      className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                    >
                      {(createWorkoutMutation.isPending || updateWorkoutMutation.isPending) ? "Salvando..." : editingWorkout ? "Atualizar" : "Salvar Treino"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Editar Modelo (Template) - Layout com sidebar */}
        {currentScreen === "editar-modelo" && editingTemplate && (
          <div className="flex gap-0 h-[calc(100vh-6rem)] -m-3 sm:-m-6">
            {/* Left: Form */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingTemplate(null); setCurrentScreen("modelos"); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Editar treino</h2>
                </div>
                <button
                  onClick={() => { if (confirm("Excluir este modelo?")) { deleteTemplateMutation.mutate({ id: editingTemplate.id }); setCurrentScreen("modelos"); } }}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  title="Excluir modelo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Template Form */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nome do Treino</label>
                  <h3 className="text-lg font-bold text-gray-900">
                    <input
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none py-1 text-lg font-bold bg-transparent"
                      style={{ fontSize: 16 }}
                    />
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Início</label>
                    <Input type="date" value={templateForm.startDate} onChange={(e) => setTemplateForm({ ...templateForm, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Fim</label>
                    <Input type="date" value={templateForm.endDate} onChange={(e) => setTemplateForm({ ...templateForm, endDate: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Descrição</label>
                  <Textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    placeholder="Deixe aqui observações sobre este treino"
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* Exercises section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Exercícios</h3>
                    <button className="text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1">
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </button>
                  </div>

                  {templateExercises.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                      <p>Adicionar exercício</p>
                      <p className="text-xs mt-1">Use a sidebar à direita para adicionar</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {templateExercises.map((ex, idx) => (
                        <div key={idx} className="border-l-4 border-red-400 bg-white rounded-r-lg p-4 shadow-sm">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {(ex.videoUrl || ex.imageUrl) ? (
                                <img src={ex.videoUrl || ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Dumbbell className="w-5 h-5" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900">{ex.name}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 block mb-0.5">Metodologia</label>
                              <select value={ex.technique || "normal"} onChange={(e) => {
                                const updated = [...templateExercises];
                                updated[idx] = { ...updated[idx], technique: e.target.value };
                                setTemplateExercises(updated);
                              }} className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white">
                                <option value="normal">Normal</option>
                                <option value="dropset">Drop Set</option>
                                <option value="superset">Super Set</option>
                                <option value="giant_set">Giant Set</option>
                                <option value="rest_pause">Rest Pause</option>
                                <option value="pyramidal">Pirâmide</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-0.5">Repetições</label>
                              <input type="text" value={ex.reps} onChange={(e) => {
                                const updated = [...templateExercises];
                                updated[idx] = { ...updated[idx], reps: e.target.value };
                                setTemplateExercises(updated);
                              }} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-0.5">Carga</label>
                              <input type="text" value={ex.load || ""} onChange={(e) => {
                                const updated = [...templateExercises];
                                updated[idx] = { ...updated[idx], load: e.target.value };
                                setTemplateExercises(updated);
                              }} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-0.5">Intervalo</label>
                              <input type="number" value={ex.restSeconds || ""} onChange={(e) => {
                                const updated = [...templateExercises];
                                updated[idx] = { ...updated[idx], restSeconds: parseInt(e.target.value) || 0 };
                                setTemplateExercises(updated);
                              }} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 block mb-0.5">Observações</label>
                              <Textarea value={ex.notes || ""} onChange={(e) => {
                                const updated = [...templateExercises];
                                updated[idx] = { ...updated[idx], notes: e.target.value };
                                setTemplateExercises(updated);
                              }} rows={1} className="text-sm" placeholder="Observações..." />
                            </div>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              <button className="p-1.5 text-gray-400 hover:text-gray-600"><GripVertical className="w-4 h-4" /></button>
                              <button onClick={() => setTemplateExercises(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 text-gray-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save button */}
                <div className="pt-4 border-t">
                  <button
                    onClick={handleSaveTemplate}
                    disabled={updateTemplateMutation.isPending || addTemplateExerciseMutation.isPending}
                    className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {updateTemplateMutation.isPending ? "Salvando..." : "Salvar Modelo"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Exercise Sidebar */}
            <div className="w-72 lg:w-80 border-l bg-white overflow-y-auto hidden md:flex flex-col">
              <div className="p-3 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">Exercícios</h3>
                  <button
                    onClick={() => { setBibliotecaSearch(""); setBibliotecaMuscle("all"); setBibliotecaPage(1); setShowBibliotecaModal(true); }}
                    className="w-8 h-8 flex items-center justify-center bg-blue-400 hover:bg-blue-500 text-white rounded-full transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar"
                    value={templateSidebarSearch}
                    onChange={(e) => setTemplateSidebarSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    style={{ fontSize: 14 }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {templateSidebarFiltered.slice(0, 50).map((exercise: any) => (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 border-b border-gray-100 transition"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {(exercise.videoUrl || exercise.imageUrl) ? (
                        <img src={exercise.videoUrl || exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Dumbbell className="w-4 h-4 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{exercise.name}</p>
                      <p className="text-xs text-gray-400 truncate">{[exercise.muscleGroup, exercise.equipment].filter(Boolean).join(', ')}</p>
                    </div>
                    <button
                      onClick={() => handleAddExerciseToTemplate(exercise)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Biblioteca de Exercícios Modal */}
      {showBibliotecaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Biblioteca de Exercícios</h2>
                <p className="text-sm text-gray-600">{bibliotecaFiltered.length} exercícios disponíveis</p>
              </div>
              <button onClick={() => setShowBibliotecaModal(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-3 sm:p-4 border-b shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar exercícios..."
                    value={bibliotecaSearch}
                    onChange={(e) => { setBibliotecaSearch(e.target.value); setBibliotecaPage(1); }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    style={{ fontSize: 16 }}
                  />
                </div>
                <select
                  value={bibliotecaMuscle}
                  onChange={(e) => { setBibliotecaMuscle(e.target.value); setBibliotecaPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="all">Todos os grupos musculares</option>
                  {muscleGroups.map((g: any) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Exercise Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bibliotecaPaginated.map((exercise: any) => (
                  <div
                    key={exercise.id}
                    className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer group"
                    onClick={() => handleAddExerciseToWorkout(exercise)}
                  >
                    {/* Image/GIF */}
                    <div className="h-40 sm:h-48 bg-gray-200 relative">
                      {(exercise.videoUrl || exercise.imageUrl) ? (
                        <img
                          src={exercise.videoUrl || exercise.imageUrl}
                          alt={exercise.name}
                          className="w-full h-full object-contain bg-gray-100"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Dumbbell className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {exercise.muscleGroup && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          {exercise.muscleGroup}
                        </div>
                      )}
                      {exercise.videoUrl?.endsWith('.gif') && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-0.5 rounded text-xs">GIF</div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 transition flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                          <Plus className="w-4 h-4 inline mr-1" />Adicionar
                        </div>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{exercise.name}</h3>
                      {exercise.equipment && (
                        <p className="text-xs text-gray-500"><span className="font-medium">Equipamento:</span> {exercise.equipment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {bibliotecaFiltered.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum exercício encontrado</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {bibliotecaTotalPages > 1 && (
              <div className="p-3 border-t flex items-center justify-center gap-4 shrink-0">
                <button onClick={() => setBibliotecaPage(Math.max(1, bibliotecaPage - 1))} disabled={bibliotecaPage === 1}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50 text-sm">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">Página {bibliotecaPage} de {bibliotecaTotalPages}</span>
                <button onClick={() => setBibliotecaPage(Math.min(bibliotecaTotalPages, bibliotecaPage + 1))} disabled={bibliotecaPage >= bibliotecaTotalPages}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50 text-sm">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video/GIF Demo Modal */}
      {videoModalExercicio && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setVideoModalExercicio(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{videoModalExercicio.name}</h3>
              <button onClick={() => setVideoModalExercicio(null)} className="p-1 text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              {(videoModalExercicio.videoUrl || videoModalExercicio.imageUrl) ? (
                <img src={videoModalExercicio.videoUrl || videoModalExercicio.imageUrl} alt={videoModalExercicio.name} className="w-full rounded-lg object-contain max-h-96 bg-gray-100" />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center"><Dumbbell className="w-16 h-16 text-gray-300" /></div>
              )}
              <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Séries</p>
                  <p className="font-bold">{videoModalExercicio.sets}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Repetições</p>
                  <p className="font-bold">{videoModalExercicio.reps}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Peso</p>
                  <p className="font-bold">{videoModalExercicio.load || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Descanso</p>
                  <p className="font-bold">{videoModalExercicio.restSeconds || '-'}s</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Screen: Avaliações Físicas - List */}
        {currentScreen === "avaliacoes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Avaliação Física</h2>
            </div>

            {/* Student selector for assessment */}
            {!selectedAluno ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 mb-3">Selecione um aluno para visualizar ou criar avaliações:</p>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar aluno..."
                      value={assessmentStudentSearch}
                      onChange={(e) => setAssessmentStudentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
                    {students
                      .filter((s: any) => !assessmentStudentSearch || s.name?.toLowerCase().includes(assessmentStudentSearch.toLowerCase()))
                      .map((student: any) => (
                        <Button
                          key={student.id}
                          variant="outline"
                          className="justify-start h-auto py-2"
                          onClick={() => {
                            setSelectedAluno(student);
                          }}
                        >
                          <User className="w-4 h-4 mr-2 text-blue-500" />
                          <div className="text-left">
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-xs text-gray-400">{student.email}</p>
                          </div>
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAluno(null)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> Trocar Aluno
                    </Button>
                    <span className="font-semibold">{selectedAluno.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentScreen("comparativo")}
                    >
                      <BarChart3 className="w-4 h-4 mr-1" /> Comparativo & Gráficos
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setEditingAssessment(null);
                        setCurrentScreen("avaliacao-form");
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Nova Avaliação
                    </Button>
                  </div>
                </div>

                {/* List of existing assessments */}
                <AssessmentsList
                  studentId={selectedAluno.id}
                  onEdit={(assessment: any) => {
                    setEditingAssessment(assessment);
                    setCurrentScreen("avaliacao-form");
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Screen: Assessment Form */}
        {currentScreen === "avaliacao-form" && selectedAluno && (
          <PhysicalAssessmentForm
            studentId={selectedAluno.id}
            studentName={selectedAluno.name}
            studentSex={selectedAluno.gender === "female" ? "F" : "M"}
            studentBirthDate={selectedAluno.birthDate}
            existingAssessment={editingAssessment}
            onBack={() => setCurrentScreen("avaliacoes")}
            onSaved={() => {
              setCurrentScreen("avaliacoes");
              toast.success("Avaliação salva!");
            }}
          />
        )}

        {/* Screen: Comparativo & Gráficos */}
        {currentScreen === "comparativo" && selectedAluno && (
          <AssessmentComparative
            studentId={selectedAluno.id}
            studentName={selectedAluno.name}
            onBack={() => setCurrentScreen("avaliacoes")}
          />
        )}

      {/* Apply Template Modal */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aplicar Modelo em Alunos</DialogTitle>
            <DialogDescription>Selecione os alunos e defina o período do treino</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={applyStartDate}
                  onChange={(e) => setApplyStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Data Fim (opcional)</Label>
                <Input
                  type="date"
                  value={applyEndDate}
                  onChange={(e) => setApplyEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Student search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar alunos..."
                value={applySearch}
                onChange={(e) => setApplySearch(e.target.value)}
                className="pl-10"
                style={{ fontSize: 16 }}
              />
            </div>

            {/* Select all */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{applyStudentIds.length} selecionado(s)</span>
              <button
                type="button"
                className="text-blue-500 hover:text-blue-700 font-medium"
                onClick={() => {
                  if (applyStudentIds.length === applyFilteredStudents.length) {
                    setApplyStudentIds([]);
                  } else {
                    setApplyStudentIds(applyFilteredStudents.map((s: any) => s.id));
                  }
                }}
              >
                {applyStudentIds.length === applyFilteredStudents.length ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>

            {/* Student list with checkboxes */}
            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              {applyFilteredStudents.map((student: any) => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={applyStudentIds.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setApplyStudentIds([...applyStudentIds, student.id]);
                      } else {
                        setApplyStudentIds(applyStudentIds.filter(id => id !== student.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {student.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-900 truncate">{student.name}</span>
                </label>
              ))}
              {applyFilteredStudents.length === 0 && (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">Nenhum aluno encontrado</div>
              )}
            </div>

            <Button
              className="w-full bg-blue-400 hover:bg-blue-500"
              onClick={handleApplyTemplate}
              disabled={applyTemplateMutation.isPending || applyStudentIds.length === 0}
            >
              {applyTemplateMutation.isPending
                ? "Aplicando..."
                : `Aplicar para ${applyStudentIds.length} aluno(s)`
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                {(selectedExercise.videoUrl || selectedExercise.imageUrl) && (
                  <div className="w-full rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={selectedExercise.videoUrl || selectedExercise.imageUrl}
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

                {/* Seção de Vídeos */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-600" />
                    Vídeos de Demonstração
                  </h4>

                  {/* Lista de vídeos existentes */}
                  {exerciseVideos.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {exerciseVideos.map((vid: any) => {
                        const isYoutube = vid.videoUrl?.includes("youtube.com") || vid.videoUrl?.includes("youtu.be");
                        const isVimeo = vid.videoUrl?.includes("vimeo.com");
                        const isEmbed = isYoutube || isVimeo;

                        let embedUrl = vid.videoUrl;
                        if (isYoutube) {
                          const match = vid.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                          if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
                        } else if (isVimeo) {
                          const match = vid.videoUrl.match(/vimeo\.com\/(\d+)/);
                          if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
                        }

                        return (
                          <div key={vid.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium truncate flex-1">
                                {vid.title || "Vídeo sem título"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteVideoMutation.mutate({ videoId: vid.id })}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {isEmbed ? (
                              <div className="aspect-video rounded overflow-hidden bg-black">
                                <iframe
                                  src={embedUrl}
                                  className="w-full h-full"
                                  allowFullScreen
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                              </div>
                            ) : (
                              <video
                                src={vid.videoUrl}
                                controls
                                className="w-full rounded max-h-64"
                                preload="metadata"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">Nenhum vídeo cadastrado para este exercício.</p>
                  )}

                  {/* Upload de vídeo */}
                  <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-800">Adicionar Vídeo</p>

                    {/* Opção 1: Upload de arquivo */}
                    <div className="space-y-2">
                      <Label className="text-sm text-blue-700">Gravar ou enviar vídeo do celular</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="video/*"
                          capture="environment"
                          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                          className="flex-1 text-sm"
                          disabled={isUploadingVideo}
                        />
                        <Button
                          onClick={handleUploadVideo}
                          disabled={!videoFile || isUploadingVideo}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isUploadingVideo ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {isUploadingVideo && (
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-blue-600">Máximo 100MB. Formatos: MP4, MOV, WEBM</p>
                    </div>

                    {/* Opção 2: URL do YouTube/Vimeo */}
                    <div className="space-y-2 border-t border-blue-200 pt-3">
                      <Label className="text-sm text-blue-700">Ou cole um link do YouTube/Vimeo</Label>
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="https://youtube.com/watch?v=..."
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={handleAddVideoUrl}
                          disabled={!videoUrl || addVideoUrlMutation.isPending}
                          size="sm"
                          variant="outline"
                          className="border-blue-300"
                        >
                          <Link className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
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

      {/* Exercise Sheet (Right Drawer) */}
      <Sheet open={isExerciseDialogOpen} onOpenChange={(open) => {
        setIsExerciseDialogOpen(open);
        if (!open) {
          setExerciseForm({ name: "", description: "", muscleGroup: "", equipment: "", instructions: "" });
          setExerciseImageFile(null);
          setExerciseVideoFile(null);
          setExerciseMedia1Link("");
          setExerciseMedia2Link("");
          setExerciseMedia1Preview(null);
          setExerciseMedia2Preview(null);
        }
      }}>
        <SheetContent side="right" className="!w-[400px] !sm:max-w-[400px] overflow-y-auto p-0">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="text-lg">Criar Novo Exercício</SheetTitle>
            <SheetDescription className="sr-only">Adicione um novo exercício à biblioteca</SheetDescription>
          </SheetHeader>

          <div className="p-4 space-y-5 flex-1 overflow-y-auto">
            {/* Mídia 1 */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Mídia 1</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition relative"
                onClick={() => document.getElementById('ex-media1-file')?.click()}
              >
                {exerciseMedia1Preview ? (
                  <div className="relative">
                    <img src={exerciseMedia1Preview} alt="Preview" className="w-full h-32 object-contain rounded" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setExerciseImageFile(null); setExerciseMedia1Preview(null); }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Adicionar Mídia</p>
                  </>
                )}
                <input
                  id="ex-media1-file"
                  type="file"
                  accept="image/*,.gif,.mp4,.mov,.pdf,.xls,.doc,.webp,.jpeg,.jpg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setExerciseImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setExerciseMedia1Preview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-blue-500">.jpg, .png, .gif, .mp4, .mov, .pdf, .xls, .doc, .webp, .jpeg</p>
              <div className="text-center text-xs text-gray-400">Ou</div>
              <div className="relative">
                <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Link externo"
                  value={exerciseMedia1Link}
                  onChange={(e) => setExerciseMedia1Link(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <p className="text-xs text-blue-500">youtube, vimeo, etc</p>
            </div>

            {/* Mídia 2 */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Mídia 2</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition relative"
                onClick={() => document.getElementById('ex-media2-file')?.click()}
              >
                {exerciseMedia2Preview ? (
                  <div className="relative">
                    <img src={exerciseMedia2Preview} alt="Preview" className="w-full h-32 object-contain rounded" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setExerciseVideoFile(null); setExerciseMedia2Preview(null); }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Adicionar Mídia</p>
                  </>
                )}
                <input
                  id="ex-media2-file"
                  type="file"
                  accept="image/*,.gif,.mp4,.mov,.pdf,.xls,.doc,.webp,.jpeg,.jpg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setExerciseVideoFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setExerciseMedia2Preview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-blue-500">.jpg, .png, .gif, .mp4, .mov, .pdf, .xls, .doc, .webp, .jpeg</p>
              <div className="text-center text-xs text-gray-400">Ou</div>
              <div className="relative">
                <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Link externo"
                  value={exerciseMedia2Link}
                  onChange={(e) => setExerciseMedia2Link(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <p className="text-xs text-blue-500">youtube, vimeo, etc</p>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Título</Label>
              <Input
                placeholder="Ex: Supino reto"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
              />
            </div>

            {/* Equipamento */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Equipamento</Label>
              <Input
                placeholder="Selecione um equipamento"
                value={exerciseForm.equipment}
                onChange={(e) => setExerciseForm({ ...exerciseForm, equipment: e.target.value })}
              />
            </div>

            {/* Grupo Muscular */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Grupo Muscular</Label>
              <Input
                placeholder="Ex: Peito"
                value={exerciseForm.muscleGroup}
                onChange={(e) => setExerciseForm({ ...exerciseForm, muscleGroup: e.target.value })}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Descrição</Label>
              <Textarea
                placeholder="Breve descrição do exercício"
                value={exerciseForm.description}
                onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <SheetFooter className="p-4 border-t flex flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsExerciseDialogOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateExercise}
              disabled={createExerciseMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createExerciseMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Exercise Sheet (Right Drawer) */}
      <Sheet open={isEditExerciseDialogOpen} onOpenChange={(open) => {
        setIsEditExerciseDialogOpen(open);
        if (!open) {
          setEditingExercise(null);
          setExerciseImageFile(null);
        }
      }}>
        <SheetContent side="right" className="!w-[400px] !sm:max-w-[400px] overflow-y-auto p-0">
          <SheetHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <SheetTitle className="text-lg">Editar Exercício</SheetTitle>
            <SheetDescription className="sr-only">Atualize as informações do exercício</SheetDescription>
            {editingExercise && (
              <button
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir este exercício?")) {
                    handleDeleteExercise(editingExercise.id);
                    setIsEditExerciseDialogOpen(false);
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition"
                title="Excluir exercício"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </SheetHeader>

          {editingExercise && (
            <>
              <div className="p-4 space-y-5 flex-1 overflow-y-auto">
                {/* Mídia 1 - Current image/video */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Mídia 1</Label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition relative"
                    onClick={() => document.getElementById('edit-ex-media1-file')?.click()}
                  >
                    {(editingExercise.videoUrl || editingExercise.imageUrl) ? (
                      <div className="relative">
                        <img src={editingExercise.videoUrl || editingExercise.imageUrl} alt="Preview" className="w-full h-32 object-contain rounded" />
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Adicionar Mídia</p>
                      </>
                    )}
                    <input
                      id="edit-ex-media1-file"
                      type="file"
                      accept="image/*,.gif,.mp4,.mov,.pdf,.xls,.doc,.webp,.jpeg,.jpg,.png"
                      className="hidden"
                      onChange={(e) => setExerciseImageFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <p className="text-xs text-blue-500">.jpg, .png, .gif, .mp4, .mov, .pdf, .xls, .doc, .webp, .jpeg</p>
                </div>

                {/* Mídia 2 - Videos */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Mídia 2</Label>

                  {exerciseVideos.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {exerciseVideos.map((vid: any) => {
                        const isYoutube = vid.videoUrl?.includes("youtube.com") || vid.videoUrl?.includes("youtu.be");
                        const isVimeo = vid.videoUrl?.includes("vimeo.com");
                        const isEmbed = isYoutube || isVimeo;
                        let embedUrl = vid.videoUrl;
                        if (isYoutube) {
                          const match = vid.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                          if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
                        } else if (isVimeo) {
                          const match = vid.videoUrl.match(/vimeo\.com\/(\d+)/);
                          if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
                        }
                        return (
                          <div key={vid.id} className="border rounded-lg p-2 bg-gray-50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium truncate flex-1">{vid.title || "Vídeo"}</span>
                              <Button variant="ghost" size="sm" onClick={() => deleteVideoMutation.mutate({ videoId: vid.id })} className="text-red-500 hover:text-red-700 h-7 w-7 p-0">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            {isEmbed ? (
                              <div className="aspect-video rounded overflow-hidden bg-black">
                                <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                              </div>
                            ) : (
                              <video src={vid.videoUrl} controls className="w-full rounded max-h-48" preload="metadata" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition"
                    onClick={() => document.getElementById('edit-ex-media2-file')?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Adicionar Mídia</p>
                    <input
                      id="edit-ex-media2-file"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <p className="text-xs text-blue-500">.jpg, .png, .gif, .mp4, .mov, .pdf, .xls, .doc, .webp, .jpeg</p>

                  {videoFile && (
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-600 flex-1 truncate">{videoFile.name}</span>
                      <Button onClick={handleUploadVideo} disabled={isUploadingVideo} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        {isUploadingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      </Button>
                    </div>
                  )}
                  {isUploadingVideo && (
                    <div className="w-full bg-blue-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}

                  <div className="text-center text-xs text-gray-400">Ou</div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input type="url" placeholder="Link externo" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="pl-9 text-sm" />
                    </div>
                    <Button onClick={handleAddVideoUrl} disabled={!videoUrl || addVideoUrlMutation.isPending} size="sm" variant="outline">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-500">youtube, vimeo, etc</p>
                </div>

                {/* Título */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Título</Label>
                  <Input
                    placeholder="Ex: Supino reto"
                    value={editingExercise.name}
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                  />
                </div>

                {/* Equipamento */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Equipamento</Label>
                  <Input
                    placeholder="Selecione um equipamento"
                    value={editingExercise.equipment}
                    onChange={(e) => setEditingExercise({ ...editingExercise, equipment: e.target.value })}
                  />
                </div>

                {/* Grupo Muscular */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Grupo Muscular</Label>
                  <Input
                    placeholder="Ex: Peito"
                    value={editingExercise.muscleGroup}
                    onChange={(e) => setEditingExercise({ ...editingExercise, muscleGroup: e.target.value })}
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Descrição</Label>
                  <Textarea
                    placeholder="Breve descrição do exercício"
                    value={editingExercise.description}
                    onChange={(e) => setEditingExercise({ ...editingExercise, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Instruções */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Instruções de Execução</Label>
                  <Textarea
                    placeholder="Como executar o exercício corretamente"
                    value={editingExercise.instructions}
                    onChange={(e) => setEditingExercise({ ...editingExercise, instructions: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <SheetFooter className="p-4 border-t flex flex-row gap-3">
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {updateExerciseMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

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
