import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Dumbbell,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Minus,
  Trophy,
  Sparkles,
  Award
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ExerciseMediaModal } from "@/components/ExerciseMediaModal";

// Dias da semana
const DIAS_SEMANA = [
  { id: 0, key: "A", nome: "SEG", completo: "Segunda-feira" },
  { id: 1, key: "B", nome: "TER", completo: "Terça-feira" },
  { id: 2, key: "C", nome: "QUA", completo: "Quarta-feira" },
  { id: 3, key: "D", nome: "QUI", completo: "Quinta-feira" },
  { id: 4, key: "A", nome: "SEX", completo: "Sexta-feira" },
  { id: 5, key: "B", nome: "SAB", completo: "Sábado" },
];

// Determinar qual dia é hoje
const getDayOfWeek = () => {
  // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  // Segunda=A, Terça=B, Quarta=C, Quinta=D, Sexta=A, Sábado=B, Domingo=C
  const days = ["C", "A", "B", "C", "D", "A", "B"];
  return days[new Date().getDay()];
};

interface SetData {
  completed: boolean;
  reps: number;
  weight: number;
}

export default function StudentWorkoutDetailNew() {
  const [, params] = useRoute("/student/workout/:id");
  const [, setLocation] = useLocation();
  const workoutId = params?.id ? parseInt(params.id) : 0;

  // Estados principais
  const [selectedDay, setSelectedDay] = useState<string>(getDayOfWeek());
  const [selectedDayId, setSelectedDayId] = useState<number>(() => {
    // Encontrar o ID do dia atual
    const todayKey = getDayOfWeek();
    const today = new Date().getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
    // Mapear para o ID correto: 1=Seg(id:0), 2=Ter(id:1), 3=Qua(id:2), 4=Qui(id:3), 5=Sex(id:4), 6=Sab(id:5)
    return today === 1 ? 0 : today === 2 ? 1 : today === 3 ? 2 : today === 4 ? 3 : today === 5 ? 4 : today === 6 ? 5 : 0;
  });
  const [exerciseSetsData, setExerciseSetsData] = useState<Record<number, SetData[]>>({});

  // Timer states
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutPaused, setWorkoutPaused] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [activeRestExercise, setActiveRestExercise] = useState<number | null>(null);

  // Modal states
  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean;
    exerciseName: string;
    photoUrl?: string;
    videoUrl?: string;
    type: 'photo' | 'video';
    description?: string;
  }>({
    isOpen: false,
    exerciseName: '',
    type: 'photo'
  });

  const [completionModal, setCompletionModal] = useState(false);

  // Data fetching
  const { data: workoutData } = trpc.workouts.getById.useQuery({ workoutId });
  const workout = workoutData?.workout;
  const allExercises = workoutData?.exercises || [];

  // Check if workout day was completed today
  const { data: completionData } = trpc.workouts.checkDayCompletion.useQuery({
    workoutId,
    dayOfWeek: selectedDay
  });
  const completedToday = completionData?.completed || false;

  // Mutation to save workout completion
  const completeWorkoutMutation = trpc.workouts.completeWorkoutDay.useMutation();

  // Filtrar exercícios pelo dia selecionado
  const dayExercises = allExercises.filter(
    (ex: any) => ex.dayOfWeek === selectedDay
  );

  // Timer de treino
  useEffect(() => {
    let interval: any;
    if (workoutStarted && !workoutPaused) {
      interval = setInterval(() => {
        setWorkoutTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutStarted, workoutPaused]);

  // Timer de descanso
  useEffect(() => {
    let interval: any;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            setActiveRestExercise(null);
            toast.success("Descanso concluído!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  // Inicializar dados das séries
  useEffect(() => {
    const initialData: Record<number, SetData[]> = {};
    dayExercises.forEach((ex: any) => {
      if (!exerciseSetsData[ex.id]) {
        initialData[ex.id] = Array(ex.sets).fill(null).map(() => ({
          completed: false,
          reps: ex.reps || 0, // Usar o valor definido pelo professor
          weight: ex.load || 0,
        }));
      }
    });
    if (Object.keys(initialData).length > 0) {
      setExerciseSetsData(prev => ({ ...prev, ...initialData }));
    }
  }, [dayExercises]);

  // Detectar conclusão do treino
  useEffect(() => {
    const totalSets = getTotalSets();
    const completedSets = getTotalSetsCompleted();

    if (workoutStarted && totalSets > 0 && completedSets === totalSets && !completionModal) {
      // Pequeno delay para dar tempo de ver a última série marcada
      setTimeout(async () => {
        // Save workout completion to database
        try {
          await completeWorkoutMutation.mutateAsync({
            workoutId,
            dayOfWeek: selectedDay,
            totalExercises: dayExercises.length,
            totalSets: totalSets,
            durationSeconds: workoutTime
          });
        } catch (error) {
          console.error("Erro ao salvar conclusão do treino:", error);
        }

        setCompletionModal(true);
        setWorkoutPaused(true); // Pausar o timer
      }, 500);
    }
  }, [exerciseSetsData, workoutStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startWorkout = () => {
    const todayWorkoutDay = getDayOfWeek();

    // Check if workout was already completed today
    if (completedToday) {
      toast.error("Você já concluiu este treino hoje! Volte amanhã para treinar novamente.");
      return;
    }

    if (selectedDay !== todayWorkoutDay) {
      const todayDayName = DIAS_SEMANA.find(d => d.key === todayWorkoutDay)?.completo || "hoje";
      toast.error(`Você só pode iniciar o treino de ${todayDayName}. Hoje é treino ${todayWorkoutDay}.`);
      return;
    }
    setWorkoutStarted(true);
    setWorkoutPaused(false);
    toast.success("Treino iniciado! Boa sorte!");
  };

  const pauseWorkout = () => {
    setWorkoutPaused(!workoutPaused);
    toast.info(workoutPaused ? "Treino retomado" : "Treino pausado");
  };

  const handleStartRest = (exerciseId: number, restSeconds: number) => {
    setIsResting(true);
    setRestTimer(restSeconds);
    setActiveRestExercise(exerciseId);
    toast.info(`Descanso iniciado: ${restSeconds}s`);
  };

  const toggleSetComplete = (exerciseId: number, setIndex: number) => {
    setExerciseSetsData(prev => {
      const newData = { ...prev };
      if (!newData[exerciseId]) return prev;

      newData[exerciseId] = [...newData[exerciseId]];
      newData[exerciseId][setIndex] = {
        ...newData[exerciseId][setIndex],
        completed: !newData[exerciseId][setIndex].completed,
      };

      return newData;
    });
  };

  const updateSetData = (exerciseId: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExerciseSetsData(prev => {
      const newData = { ...prev };
      if (!newData[exerciseId]) return prev;

      newData[exerciseId] = [...newData[exerciseId]];
      newData[exerciseId][setIndex] = {
        ...newData[exerciseId][setIndex],
        [field]: value,
      };

      return newData;
    });
  };

  const getCompletedSets = (exerciseId: number) => {
    const setsData = exerciseSetsData[exerciseId] || [];
    return setsData.filter(set => set.completed).length;
  };

  const getTotalSetsCompleted = () => {
    return Object.values(exerciseSetsData).reduce((total, sets) => {
      return total + sets.filter(set => set.completed).length;
    }, 0);
  };

  const getTotalSets = () => {
    return dayExercises.reduce((total: number, ex: any) => total + ex.sets, 0);
  };

  const openPhotoModal = (exercise: any) => {
    setMediaModal({
      isOpen: true,
      exerciseName: exercise.exerciseName || 'Exercício',
      photoUrl: exercise.exerciseImageUrl,
      type: 'photo',
      description: exercise.exerciseDescription
    });
  };

  const openVideoModal = (exercise: any) => {
    setMediaModal({
      isOpen: true,
      exerciseName: exercise.exerciseName || 'Exercício',
      videoUrl: exercise.exerciseVideoUrl,
      type: 'video',
      description: exercise.exerciseDescription
    });
  };

  const closeModal = () => {
    setMediaModal({
      isOpen: false,
      exerciseName: '',
      type: 'photo'
    });
  };

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando treino...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = getTotalSets() > 0
    ? (getTotalSetsCompleted() / getTotalSets()) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 pb-20">
      {/* Header com Timer */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white sticky top-0 z-10 shadow-lg">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/student/dashboard")}
            className="mb-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-sm">{workout.name}</h1>
              <p className="text-sm text-white/90">{workout.description}</p>
            </div>
            <Badge className={workout.active ? "bg-green-500 text-white" : "bg-gray-400 text-white"}>
              {workout.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {/* Timer e Controles */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
            <div className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-md">
              <Timer className="w-6 h-6 text-white" />
              <span className="text-3xl font-mono font-bold text-white">{formatTime(workoutTime)}</span>
            </div>

            {!workoutStarted ? (
              <div className="flex-1">
                <Button
                  onClick={startWorkout}
                  disabled={selectedDay !== getDayOfWeek() || completedToday}
                  size="lg"
                  className="w-full h-14 text-lg font-semibold touch-manipulation shadow-lg bg-white text-blue-600 hover:bg-white/90"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {completedToday && selectedDay === getDayOfWeek()
                    ? "✅ Treino Concluído Hoje"
                    : selectedDay === getDayOfWeek()
                    ? "Iniciar Treino"
                    : `Treino ${selectedDay} (não é hoje)`}
                </Button>
                {completedToday && selectedDay === getDayOfWeek() ? (
                  <p className="text-sm text-green-100 text-center mt-2 font-semibold bg-green-600/30 py-2 px-3 rounded-lg">
                    🎉 Parabéns! Você já completou este treino hoje. Volte amanhã!
                  </p>
                ) : selectedDay !== getDayOfWeek() ? (
                  <p className="text-sm text-white/90 text-center mt-2 font-medium">
                    Hoje é treino {getDayOfWeek()} - {DIAS_SEMANA.find(d => d.key === getDayOfWeek())?.completo}
                  </p>
                ) : null}
              </div>
            ) : (
              <Button
                onClick={pauseWorkout}
                size="lg"
                className="flex-1 h-14 text-lg font-semibold touch-manipulation shadow-md bg-white/30 text-white hover:bg-white/40 border-white/50"
              >
                {workoutPaused ? (
                  <><Play className="w-5 h-5 mr-2" /> Retomar</>
                ) : (
                  <><Pause className="w-5 h-5 mr-2" /> Pausar</>
                )}
              </Button>
            )}
          </div>

          {/* Progresso Global */}
          <div className="space-y-3">
            <div className="flex justify-between text-base font-semibold text-white">
              <span>Progresso: {getTotalSetsCompleted()} / {getTotalSets()} séries</span>
              <span className="text-yellow-300">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Seletor de Dia */}
      <div className="container py-6">
        {workoutStarted && (
          <div className="mb-3 text-sm text-orange-800 text-center font-medium bg-orange-100 py-3 px-4 rounded-xl shadow-sm border border-orange-200">
            ⚠️ Treino em andamento - troca de dias bloqueada
          </div>
        )}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {DIAS_SEMANA.map((dia) => {
            const isSelected = selectedDayId === dia.id;
            const dayColors = {
              0: "from-purple-500 to-purple-600", // SEG - A
              1: "from-blue-500 to-blue-600",     // TER - B
              2: "from-green-500 to-green-600",   // QUA - C
              3: "from-orange-500 to-orange-600", // QUI - D
              4: "from-pink-500 to-pink-600",     // SEX - A
              5: "from-teal-500 to-teal-600",     // SAB - B
            };

            return (
              <Button
                key={dia.id}
                size="lg"
                onClick={() => {
                  if (workoutStarted) {
                    toast.error("Você não pode trocar de dia durante o treino. Pause ou finalize o treino primeiro.");
                    return;
                  }
                  setSelectedDay(dia.key);
                  setSelectedDayId(dia.id);
                }}
                disabled={workoutStarted && !isSelected}
                className={`flex-shrink-0 h-20 px-6 touch-manipulation shadow-lg active:scale-95 transition-all duration-200 ${
                  isSelected
                    ? `bg-gradient-to-br ${dayColors[dia.id]} text-white border-none hover:shadow-xl`
                    : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
                }`}
              >
                <div className="text-center">
                  <div className="text-base font-bold">{dia.nome}</div>
                  <div className={`text-xs mt-0.5 ${isSelected ? "text-white/90" : "text-gray-500"}`}>
                    Treino {dia.key}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Exercícios do Dia */}
      <div className="container space-y-6 pb-20">
        {dayExercises.length === 0 ? (
          <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-none">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                <Dumbbell className="w-12 h-12 text-white" />
              </div>
              <p className="text-2xl font-bold mb-3 text-gray-800">Nenhum exercício para hoje</p>
              <p className="text-base text-gray-600 max-w-sm mx-auto">
                Selecione outro dia ou aguarde o professor adicionar exercícios ao seu treino
              </p>
            </CardContent>
          </Card>
        ) : (
          dayExercises.map((exercise: any, index: number) => {
            const setsData = exerciseSetsData[exercise.id] || [];
            const completedSets = getCompletedSets(exercise.id);

            return (
              <Card key={exercise.id} className="overflow-hidden shadow-xl border-none bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-blue-500 to-cyan-500">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg shadow-lg text-white">
                          {index + 1}
                        </div>
                        <h3 className="text-xl font-bold leading-tight text-white drop-shadow-sm">{exercise.exerciseName}</h3>
                      </div>
                      {exercise.exerciseMuscleGroup && (
                        <p className="text-base text-white/90 font-medium ml-12">
                          {exercise.exerciseMuscleGroup}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3 ml-12">
                        <Badge className="text-sm px-3 py-1 bg-white/20 text-white border-white/30">
                          {completedSets} / {exercise.sets} séries
                        </Badge>
                        {exercise.restSeconds && (
                          <Badge className="text-sm px-3 py-1 bg-white/20 text-white border-white/30">
                            <Timer className="w-4 h-4 mr-1" />
                            {exercise.restSeconds}s
                          </Badge>
                        )}
                      </div>
                    </div>

                    {exercise.exerciseImageUrl && (
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-white cursor-pointer hover:ring-4 hover:ring-white transition-all flex-shrink-0 shadow-lg active:scale-95 border-2 border-white/50"
                        onClick={() => openPhotoModal(exercise)}
                      >
                        <img
                          src={exercise.exerciseImageUrl}
                          alt={exercise.exerciseName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-6">
                  {/* Séries */}
                  {setsData.map((setData, setIndex) => (
                    <div
                      key={setIndex}
                      className={`p-4 rounded-xl border-2 transition-all shadow-md ${
                        setData.completed
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-green-200'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <button
                            onClick={() => toggleSetComplete(exercise.id, setIndex)}
                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all active:scale-95 ${
                              setData.completed
                                ? 'bg-green-500 border-green-500 shadow-lg'
                                : 'border-gray-300 hover:border-primary hover:shadow-md'
                            }`}
                          >
                            {setData.completed && <CheckCircle className="w-6 h-6 text-white" />}
                          </button>

                          <span className="font-semibold text-lg">
                            Série {setIndex + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap w-full sm:flex-1">
                          <div className="flex items-center gap-1 bg-background rounded-lg p-1 shadow-sm">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 touch-manipulation"
                              onClick={() => updateSetData(exercise.id, setIndex, 'reps', Math.max(0, setData.reps - 1))}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={setData.reps || ''}
                              onChange={(e) => updateSetData(exercise.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                              className="w-20 h-10 text-center text-lg font-semibold border-0"
                              placeholder="Reps"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 touch-manipulation"
                              onClick={() => updateSetData(exercise.id, setIndex, 'reps', setData.reps + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <span className="text-lg text-muted-foreground font-bold">×</span>

                          <div className="flex items-center gap-1 bg-background rounded-lg p-1 shadow-sm">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 touch-manipulation"
                              onClick={() => updateSetData(exercise.id, setIndex, 'weight', Math.max(0, setData.weight - 2.5))}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={setData.weight || ''}
                              onChange={(e) => updateSetData(exercise.id, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                              className="w-20 h-10 text-center text-lg font-semibold border-0"
                              placeholder="Kg"
                              step="0.5"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 touch-manipulation"
                              onClick={() => updateSetData(exercise.id, setIndex, 'weight', setData.weight + 2.5)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="text-sm text-muted-foreground font-semibold">kg</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Botão de Descanso */}
                  {exercise.restSeconds && completedSets > 0 && completedSets < exercise.sets && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-14 text-base touch-manipulation shadow-md"
                      onClick={() => handleStartRest(exercise.id, exercise.restSeconds)}
                      disabled={isResting && activeRestExercise === exercise.id}
                    >
                      {isResting && activeRestExercise === exercise.id ? (
                        <>
                          <Timer className="w-5 h-5 mr-2 animate-pulse" />
                          Descansando... {formatTime(restTimer)}
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-5 h-5 mr-2" />
                          Iniciar Descanso ({exercise.restSeconds}s)
                        </>
                      )}
                    </Button>
                  )}

                  {/* Botões de Mídia */}
                  <div className="flex gap-3 pt-2">
                    {exercise.exerciseImageUrl && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => openPhotoModal(exercise)}
                        className="flex-1 h-12 touch-manipulation"
                      >
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Ver Foto
                      </Button>
                    )}
                    {exercise.exerciseVideoUrl && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => openVideoModal(exercise)}
                        className="flex-1 h-12 touch-manipulation"
                      >
                        <VideoIcon className="w-5 h-5 mr-2" />
                        Ver Vídeo
                      </Button>
                    )}
                  </div>

                  {exercise.notes && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Observações do Professor:
                      </p>
                      <p className="text-base text-blue-700 dark:text-blue-300 leading-relaxed">
                        {exercise.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

      </div>

      {/* Modal de Mídia */}
      <ExerciseMediaModal
        isOpen={mediaModal.isOpen}
        onClose={closeModal}
        exerciseName={mediaModal.exerciseName}
        photoUrl={mediaModal.photoUrl}
        videoUrl={mediaModal.videoUrl}
        type={mediaModal.type}
        description={mediaModal.description}
      />

      {/* Modal de Conclusão do Treino */}
      <Dialog open={completionModal} onOpenChange={setCompletionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4 pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-bounce">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <DialogTitle className="text-3xl font-bold text-center">
              Parabéns! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              Você completou o treino com sucesso!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                <Timer className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatTime(workoutTime)}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Tempo Total</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                <Award className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {getTotalSetsCompleted()}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Séries Completas</div>
              </div>
            </div>

            {/* Mensagem motivacional */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Excelente trabalho!
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Continue assim e você alcançará seus objetivos. Não esqueça de se hidratar e descansar!
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                onClick={() => {
                  toast.success("Treino finalizado! Excelente trabalho!");
                  setLocation("/student/dashboard");
                }}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Finalizar Treino
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setCompletionModal(false)}
              >
                Revisar Treino
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
