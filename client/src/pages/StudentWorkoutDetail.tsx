import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Dumbbell,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Video
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ExerciseMediaModal } from "@/components/ExerciseMediaModal";

export default function StudentWorkoutDetail() {
  const [, params] = useRoute("/student/workout/:id");
  const [, setLocation] = useLocation();
  const workoutId = params?.id ? parseInt(params.id) : 0;

  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
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

  const { data: workoutData } = trpc.workouts.getById.useQuery({ workoutId });
  const workout = workoutData?.workout;
  const exercises = workoutData?.exercises || [];

  const totalExercises = exercises.length;
  const completedCount = completedExercises.size;
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  const toggleExercise = (exerciseId: number) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
        toast.info("Exercício desmarcado");
      } else {
        newSet.add(exerciseId);
        toast.success("Exercício concluído!");
      }
      return newSet;
    });
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

  const handleFinishWorkout = () => {
    if (completedCount === totalExercises) {
      toast.success("Treino concluído! Parabéns! 🎉");
      setLocation("/student/dashboard");
    } else {
      toast.error("Complete todos os exercícios antes de finalizar o treino");
    }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/student/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{workout.name}</h1>
              {workout?.description && (
                <p className="text-muted-foreground">{workout.description}</p>
              )}
            </div>
            <Badge className={workout?.active ? "status-active" : "status-inactive"}>
              {workout?.active ? "Ativo" : "Concluído"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Progress Section */}
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Progresso do Treino</CardTitle>
            <CardDescription>
              {completedCount} de {totalExercises} exercícios concluídos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {Math.round(progressPercentage)}% completo
              </span>
              {completedCount === totalExercises && totalExercises > 0 && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Treino completo!
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercises List */}
      <div className="container pb-8">
        <h2 className="text-2xl font-bold mb-6">Exercícios</h2>
        
        {exercises.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum exercício adicionado ainda
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
              {exercises.map((workoutExercise: any, index: number) => {
              const isCompleted = completedExercises.has(workoutExercise.id);
              
              return (
                <Card 
                  key={workoutExercise.id} 
                  className={`transition-all ${isCompleted ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => toggleExercise(workoutExercise.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl font-bold text-primary">
                                {index + 1}
                              </span>
                              <h3 className="text-xl font-semibold">
                                {workoutExercise.exerciseName || "Exercício"}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {workoutExercise.exerciseMuscleGroup && `Grupo muscular: ${workoutExercise.exerciseMuscleGroup}`}
                            </p>
                          </div>
                          {workoutExercise.exerciseImageUrl && (
                            <div
                              className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                              onClick={() => openPhotoModal(workoutExercise)}
                            >
                              <img
                                src={workoutExercise.exerciseImageUrl}
                                alt={workoutExercise.exerciseName || "Exercício"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Exercise Details */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{workoutExercise.sets}</p>
                            <p className="text-sm text-muted-foreground">Séries</p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{workoutExercise.reps}</p>
                            <p className="text-sm text-muted-foreground">Repetições</p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-2xl font-bold text-primary">
                              {workoutExercise.restSeconds ? `${workoutExercise.restSeconds}s` : "-"}
                            </p>
                            <p className="text-sm text-muted-foreground">Descanso</p>
                          </div>
                        </div>

                        {/* Notes */}
                        {workoutExercise.notes && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Observações:
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {workoutExercise.notes}
                            </p>
                          </div>
                        )}

                        {/* Media Buttons */}
                        <div className="flex gap-2">
                          {workoutExercise.exerciseImageUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPhotoModal(workoutExercise)}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Ver Foto
                            </Button>
                          )}
                          {workoutExercise.exerciseVideoUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openVideoModal(workoutExercise)}
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Ver Vídeo
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Finish Button */}
        {exercises.length > 0 && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Finalizar Treino</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedCount === totalExercises 
                      ? "Todos os exercícios foram concluídos!" 
                      : `Faltam ${totalExercises - completedCount} exercícios`}
                  </p>
                </div>
                <Button 
                  size="lg"
                  onClick={handleFinishWorkout}
                  disabled={completedCount !== totalExercises}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar Treino
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Exercise Media Modal */}
      <ExerciseMediaModal
        isOpen={mediaModal.isOpen}
        onClose={closeModal}
        exerciseName={mediaModal.exerciseName}
        photoUrl={mediaModal.photoUrl}
        videoUrl={mediaModal.videoUrl}
        type={mediaModal.type}
        description={mediaModal.description}
      />
    </div>
  );
}
