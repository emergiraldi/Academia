import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Filter,
  Dumbbell,
  LogOut,
  Users,
  BookOpen,
  Clipboard,
  LayoutDashboard
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorkoutExercise {
  exerciseId: number;
  exerciseName: string;
  exerciseImageUrl?: string;
  exerciseMuscleGroup?: string;
  dayOfWeek: string; // "A", "B", "C", "D"
  sets: number;
  reps: number;
  load?: number;
  restSeconds: number;
  orderIndex: number;
}

export default function WorkoutBuilder() {
  const [, params] = useRoute("/professor/workout/:id/edit");
  const [, setLocation] = useLocation();
  const workoutId = params?.id ? parseInt(params.id) : null;

  const [activeDay, setActiveDay] = useState<string>("A");
  const [selectedExercises, setSelectedExercises] = useState<Record<string, WorkoutExercise[]>>({
    A: [],
    B: [],
    C: [],
    D: [],
  });

  const [workoutForm, setWorkoutForm] = useState({
    studentId: 0,
    name: "",
    description: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
  });

  const [exerciseSearch, setExerciseSearch] = useState("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");

  const { data: exercises = [] } = trpc.exercises.list.useQuery();
  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: workoutData } = trpc.workouts.getById.useQuery(
    { workoutId: workoutId! },
    { enabled: !!workoutId }
  );

  const createWorkoutMutation = trpc.workouts.create.useMutation();
  const addExerciseMutation = trpc.workouts.addExercise.useMutation();

  // Load workout data when editing
  useEffect(() => {
    if (workoutData && workoutData.workout && students.length > 0) {
      const workout = workoutData.workout;

      // Populate workout form
      setWorkoutForm({
        studentId: workout.studentId,
        name: workout.name || "",
        description: workout.description || "",
        startDate: workout.startDate ? new Date(workout.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: workout.endDate ? new Date(workout.endDate).toISOString().split('T')[0] : "",
      });

      // Find and set student name for search field
      const student = students.find((s: any) => s.id === workout.studentId);
      if (student) {
        setStudentSearch(student.name);
      }

      // Populate exercises organized by day
      if (workoutData.exercises && workoutData.exercises.length > 0) {
        const exercisesByDay: Record<string, WorkoutExercise[]> = {
          A: [],
          B: [],
          C: [],
          D: [],
        };

        workoutData.exercises.forEach((ex: any) => {
          const day = ex.dayOfWeek || "A";
          exercisesByDay[day].push({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName || ex.name || "",
            exerciseImageUrl: ex.imageUrl,
            exerciseMuscleGroup: ex.muscleGroup,
            dayOfWeek: day,
            sets: ex.sets || 3,
            reps: ex.reps || 12,
            load: ex.load || undefined,
            restSeconds: ex.restSeconds || 60,
            orderIndex: ex.orderIndex || 0,
          });
        });

        setSelectedExercises(exercisesByDay);
      }
    }
  }, [workoutData, students]);

  // Filter exercises based on search and muscle group
  const filteredExercises = exercises.filter((ex: any) => {
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesMuscle = muscleGroupFilter === "all" || ex.muscleGroup === muscleGroupFilter;
    return matchesSearch && matchesMuscle;
  });

  // Filter students based on search - only show when searching
  const filteredStudents = students.filter((student: any) => {
    if (!studentSearch) return false; // Não mostra nada se não estiver buscando
    const searchLower = studentSearch.toLowerCase();
    return student.name.toLowerCase().includes(searchLower) ||
           student.email?.toLowerCase().includes(searchLower) ||
           student.registrationNumber?.toLowerCase().includes(searchLower);
  });

  // Get unique muscle groups
  const muscleGroups = Array.from(new Set(exercises.map((ex: any) => ex.muscleGroup).filter(Boolean)));

  const handleAddExercise = (exercise: any) => {
    const newExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseImageUrl: exercise.imageUrl,
      exerciseMuscleGroup: exercise.muscleGroup,
      dayOfWeek: activeDay,
      sets: 3,
      reps: 12,
      restSeconds: 60,
      orderIndex: selectedExercises[activeDay].length,
    };

    setSelectedExercises(prev => ({
      ...prev,
      [activeDay]: [...prev[activeDay], newExercise],
    }));

    toast.success(`${exercise.name} adicionado ao Treino ${activeDay}`);
  };

  const handleRemoveExercise = (day: string, index: number) => {
    setSelectedExercises(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const handleUpdateExercise = (day: string, index: number, field: keyof WorkoutExercise, value: any) => {
    setSelectedExercises(prev => ({
      ...prev,
      [day]: prev[day].map((ex, i) => i === index ? { ...ex, [field]: value } : ex),
    }));
  };

  const getTotalExercisesCount = () => {
    return Object.values(selectedExercises).reduce((sum, exercises) => sum + exercises.length, 0);
  };

  const handleSaveWorkout = async () => {
    // Validação
    if (!workoutForm.studentId) {
      toast.error("Selecione um aluno");
      return;
    }
    if (!workoutForm.name.trim()) {
      toast.error("Digite o nome do treino");
      return;
    }
    if (!workoutForm.startDate) {
      toast.error("Selecione a data de início");
      return;
    }

    const totalExercises = getTotalExercisesCount();
    if (totalExercises === 0) {
      toast.error("Adicione pelo menos um exercício ao treino");
      return;
    }

    try {
      // 1. Criar o treino
      const workout = await createWorkoutMutation.mutateAsync({
        studentId: workoutForm.studentId,
        name: workoutForm.name,
        description: workoutForm.description,
        startDate: workoutForm.startDate,
        endDate: workoutForm.endDate || undefined,
      });

      // 2. Adicionar exercícios de todas as divisões (A, B, C, D)
      const allExercises = Object.entries(selectedExercises).flatMap(([day, exercises]) =>
        exercises.map((ex, index) => ({
          workoutId: workout.workoutId, // Corrigido: usar workoutId em vez de id
          exerciseId: ex.exerciseId,
          dayOfWeek: day,
          sets: ex.sets,
          reps: ex.reps.toString(), // Corrigido: converter para string
          load: ex.load ? ex.load.toString() : undefined, // Corrigido: converter para string
          restSeconds: ex.restSeconds,
          orderIndex: index,
        }))
      );

      // Adicionar exercícios em lote
      for (const exercise of allExercises) {
        await addExerciseMutation.mutateAsync(exercise);
      }

      toast.success(`Treino "${workoutForm.name}" criado com sucesso! (${totalExercises} exercícios)`);
      setLocation("/professor/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar treino");
    }
  };

  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/professor/login");
  };

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "students", icon: Users, label: "Alunos" },
    { id: "workouts", icon: Dumbbell, label: "Treinos" },
    { id: "exercises", icon: BookOpen, label: "Exercícios" },
    { id: "assessments", icon: Clipboard, label: "Avaliações" },
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
            const isActive = item.id === "workouts";
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "dashboard") setLocation("/professor/dashboard");
                  else if (item.id === "students") setLocation("/professor/dashboard");
                  else if (item.id === "workouts") setLocation("/professor/dashboard");
                  else if (item.id === "exercises") setLocation("/professor/dashboard");
                  else if (item.id === "assessments") setLocation("/professor/dashboard");
                }}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition relative group ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {workoutId ? "Editar Treino" : "Criar Novo Treino"}
                </h1>
                <p className="text-sm text-gray-500">
                  Monte o treino dividido por dias (A, B, C, D)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Total: {getTotalExercisesCount()} exercícios
              </div>
              <Button
                size="lg"
                onClick={handleSaveWorkout}
                disabled={createWorkoutMutation.isPending || addExerciseMutation.isPending}
              >
                {createWorkoutMutation.isPending || addExerciseMutation.isPending
                  ? "Salvando..."
                  : "Salvar Treino"}
              </Button>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Workout Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações do Treino</CardTitle>
            <CardDescription>
              Configure os dados básicos do treino antes de adicionar os exercícios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Student Selection with Search */}
              <div className="space-y-3">
                <Label htmlFor="student-search" className="text-base font-semibold">
                  1. Selecione o Aluno *
                </Label>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="student-search"
                      placeholder="Buscar aluno por nome, email ou matrícula..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Student List */}
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {!studentSearch ? (
                      <div className="p-8 text-center text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium mb-1">Digite para buscar alunos</p>
                        <p className="text-xs">Comece digitando o nome, email ou matrícula</p>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum aluno encontrado com "{studentSearch}"</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredStudents.map((student: any) => (
                          <div
                            key={student.id}
                            onClick={() => setWorkoutForm({ ...workoutForm, studentId: student.id })}
                            className={`p-4 cursor-pointer transition flex items-center gap-3 ${
                              workoutForm.studentId === student.id
                                ? "bg-blue-50 border-l-4 border-l-blue-600"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-white">
                                {student.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {student.name}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
                                {student.email || "Sem email"}
                              </p>
                            </div>
                            {workoutForm.studentId === student.id && (
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {studentSearch && (
                    <p className="text-xs text-gray-600">
                      {filteredStudents.length > 0 ? (
                        <>
                          {filteredStudents.length} aluno(s) encontrado(s)
                          {workoutForm.studentId > 0 && (
                            <span className="ml-2 text-blue-600 font-semibold">
                              • {students.find((s: any) => s.id === workoutForm.studentId)?.name} selecionado
                            </span>
                          )}
                        </>
                      ) : (
                        'Nenhum aluno encontrado'
                      )}
                    </p>
                  )}
                  {!studentSearch && workoutForm.studentId > 0 && (
                    <p className="text-xs text-blue-600 font-semibold">
                      ✓ {students.find((s: any) => s.id === workoutForm.studentId)?.name} selecionado
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Workout Details */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  2. Detalhes do Treino
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Treino *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Treino ABCD - Hipertrofia"
                      value={workoutForm.name}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Objetivo do treino..."
                      value={workoutForm.description}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={workoutForm.startDate}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Fim (opcional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={workoutForm.endDate}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">3. Monte o Treino por Divisão (A, B, C, D)</h3>
          <p className="text-sm text-gray-500 mt-1">
            Selecione exercícios da biblioteca e adicione aos dias de treino
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exercise Library */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Biblioteca de Exercícios</CardTitle>
              <CardDescription>
                Clique para adicionar ao Treino {activeDay}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar exercício..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Muscle Group Filter */}
              <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  {muscleGroups.map((group) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator />

              {/* Exercise List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredExercises.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum exercício encontrado</p>
                  </div>
                ) : (
                  filteredExercises.map((exercise: any) => (
                    <Card
                      key={exercise.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleAddExercise(exercise)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {exercise.imageUrl && (
                            <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={exercise.imageUrl}
                                alt={exercise.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{exercise.name}</p>
                            {exercise.muscleGroup && (
                              <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                            )}
                          </div>
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workout Days */}
          <div className="lg:col-span-2">
            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="A" className="relative">
                  Treino A
                  {selectedExercises.A.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 h-5 min-w-5 text-xs">
                      {selectedExercises.A.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="B" className="relative">
                  Treino B
                  {selectedExercises.B.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 h-5 min-w-5 text-xs">
                      {selectedExercises.B.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="C" className="relative">
                  Treino C
                  {selectedExercises.C.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 h-5 min-w-5 text-xs">
                      {selectedExercises.C.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="D" className="relative">
                  Treino D
                  {selectedExercises.D.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 h-5 min-w-5 text-xs">
                      {selectedExercises.D.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {["A", "B", "C", "D"].map((day) => (
                <TabsContent key={day} value={day} className="space-y-4 mt-6">
                  {selectedExercises[day].length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="font-medium mb-2">Nenhum exercício no Treino {day}</p>
                        <p className="text-sm text-muted-foreground">
                          Selecione exercícios da biblioteca ao lado
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {selectedExercises[day].map((exercise, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                <span className="text-lg font-bold text-primary">{index + 1}</span>
                              </div>

                              {exercise.exerciseImageUrl && (
                                <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                                  <img
                                    src={exercise.exerciseImageUrl}
                                    alt={exercise.exerciseName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              <div className="flex-1 space-y-3">
                                <div>
                                  <h4 className="font-semibold">{exercise.exerciseName}</h4>
                                  {exercise.exerciseMuscleGroup && (
                                    <p className="text-sm text-muted-foreground">{exercise.exerciseMuscleGroup}</p>
                                  )}
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                  <div>
                                    <Label className="text-xs">Séries</Label>
                                    <Input
                                      type="number"
                                      value={exercise.sets}
                                      onChange={(e) => handleUpdateExercise(day, index, "sets", parseInt(e.target.value))}
                                      className="h-9"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Reps</Label>
                                    <Input
                                      type="number"
                                      value={exercise.reps}
                                      onChange={(e) => handleUpdateExercise(day, index, "reps", parseInt(e.target.value))}
                                      className="h-9"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Carga (kg)</Label>
                                    <Input
                                      type="number"
                                      value={exercise.load || ""}
                                      onChange={(e) => handleUpdateExercise(day, index, "load", parseFloat(e.target.value) || undefined)}
                                      placeholder="Opcional"
                                      className="h-9"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Descanso (s)</Label>
                                    <Input
                                      type="number"
                                      value={exercise.restSeconds}
                                      onChange={(e) => handleUpdateExercise(day, index, "restSeconds", parseInt(e.target.value))}
                                      className="h-9"
                                    />
                                  </div>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveExercise(day, index)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
