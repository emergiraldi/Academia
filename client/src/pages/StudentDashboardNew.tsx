import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Home,
  Dumbbell,
  CreditCard,
  Calendar,
  User,
  Bell,
  LogOut,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader2,
  ScanFace,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StudentDigitalCard } from "@/components/StudentDigitalCard";
import StudentPayments from "./StudentPayments";
import StudentFaceEnrollment from "./StudentFaceEnrollment";
import StudentMedicalExams from "./StudentMedicalExams";

export default function StudentDashboardNew() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [cancelSource, setCancelSource] = useState<string>("booking");
  const [swapEnrollmentId, setSwapEnrollmentId] = useState<number | null>(null);
  const [swapScheduleId, setSwapScheduleId] = useState<string>("");

  // Queries
  const { data: student, refetch: refetchStudent } = trpc.students.me.useQuery(undefined, {
    retry: false,
  });

  const { data: workouts = [] } = trpc.workouts.myWorkouts.useQuery(undefined, {
    enabled: !!student,
  });

  const { data: payments = [] } = trpc.payments.myPayments.useQuery(undefined, {
    enabled: !!student,
  });

  const { data: myBookings = [], refetch: refetchMyBookings } = trpc.bookings.myBookings.useQuery(undefined, {
    enabled: !!student,
  });

  const { data: cancelRules } = trpc.gymSettings.getCancelRules.useQuery(undefined, {
    enabled: !!student,
  });

  const { data: availableSchedules = [] } = trpc.schedules.list.useQuery({} as any, {
    enabled: swapEnrollmentId !== null,
  });

  const canCancelBooking = (booking: any) => {
    if (booking.status === 'cancelled') return false;
    // Se cancelRules ainda carregando, permitir (backend valida de qualquer forma)
    if (cancelRules && !cancelRules.allowStudentCancelBooking) return false;
    if (cancelRules && cancelRules.minHoursToCancel > 0 && booking.bookingDate && booking.startTime) {
      const bookingDate = new Date(booking.bookingDate);
      const [h, m] = (booking.startTime || '00:00').split(':').map(Number);
      bookingDate.setHours(h, m, 0, 0);
      const hoursUntil = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < cancelRules.minHoursToCancel) return false;
    }
    return true;
  };

  const cancelBooking = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success("Agendamento cancelado com sucesso!");
      setCancelBookingId(null);
      refetchMyBookings();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cancelar agendamento");
    },
  });

  const cancelEnrollment = trpc.enrollments.cancelMyEnrollment.useMutation({
    onSuccess: () => {
      toast.success("Matrícula cancelada com sucesso!");
      setCancelBookingId(null);
      refetchMyBookings();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cancelar matrícula");
    },
  });

  const changeSchedule = trpc.enrollments.changeSchedule.useMutation({
    onSuccess: () => {
      toast.success("Horário trocado com sucesso!");
      setSwapEnrollmentId(null);
      setSwapScheduleId("");
      refetchMyBookings();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao trocar horário");
    },
  });

  useEffect(() => {
    if (!user) {
      setLocation("/student/login");
    }
  }, [user, setLocation]);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = (user?.name || "Aluno").split(" ")[0];

  const menuItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Início",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "workouts",
      icon: Dumbbell,
      label: "Treinos",
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "payments",
      icon: CreditCard,
      label: "Pagamentos",
      color: "from-blue-500 to-indigo-500",
    },
    {
      id: "schedule",
      icon: Calendar,
      label: "Horários",
      color: "from-cyan-500 to-green-400",
    },
    {
      id: "profile",
      icon: QrCode,
      label: "Carteirinha",
      color: "from-purple-500 to-blue-400",
    },
    {
      id: "faceEnrollment",
      icon: ScanFace,
      label: "Acesso Facial",
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "medicalExams",
      icon: FileText,
      label: "Exames",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const navigate = (screen: string) => {
    setCurrentScreen(screen);
    if (screen === "workouts" && workouts.length > 0) {
      setLocation(`/student/workout/${workouts[0].id}`);
    }
  };

  const DAYS_SHORT: Record<string, string> = {
    monday: "Seg", tuesday: "Ter", wednesday: "Qua",
    thursday: "Qui", friday: "Sex", saturday: "Sáb", sunday: "Dom",
    "0": "Dom", "1": "Seg", "2": "Ter", "3": "Qua",
    "4": "Qui", "5": "Sex", "6": "Sáb",
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "profile":
        return <StudentDigitalCard student={student} onPhotoUpdate={refetchStudent} onBack={() => setCurrentScreen("dashboard")} />;

      case "payments":
        return <StudentPayments onBack={() => setCurrentScreen("dashboard")} />;

      case "faceEnrollment":
        return (
          <StudentFaceEnrollment
            student={student}
            onBack={() => setCurrentScreen("dashboard")}
            onSuccess={refetchStudent}
          />
        );

      case "medicalExams":
        return (
          <StudentMedicalExams
            student={student}
            onBack={() => setCurrentScreen("dashboard")}
            onSuccess={refetchStudent}
          />
        );

      case "schedule":
        return (
          <div className="px-4 pt-4 pb-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setCurrentScreen("dashboard")}
                className="p-2 rounded-lg bg-white shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900">Meus Horários</h2>
            </div>

            {myBookings.length === 0 ? (
              <Card className="bg-white/90 rounded-2xl shadow-lg p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum agendamento encontrado.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {myBookings.map((booking: any) => (
                  <Card key={`${booking.source}-${booking.id}`} className="bg-white/90 rounded-2xl shadow-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.scheduleName || booking.className || "Aula"}</h3>
                        <p className="text-sm text-gray-600">
                          {booking.dayOfWeek != null ? DAYS_SHORT[String(booking.dayOfWeek)] || booking.dayOfWeek : ""} - {booking.startTime?.slice(0, 5) || ""}
                        </p>
                        {booking.source === 'enrollment' && (
                          <span className="text-xs text-blue-600 font-medium">Matrícula fixa</span>
                        )}
                        {booking.source === 'booking' && booking.bookingDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(booking.bookingDate).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {/* Botão Trocar - só para matrículas ativas */}
                        {booking.source === 'enrollment' && booking.status === 'active' && (
                          <button
                            onClick={() => { setSwapEnrollmentId(booking.id); setSwapScheduleId(""); }}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          >
                            Trocar
                          </button>
                        )}
                        {/* Botão Cancelar */}
                        {booking.status !== 'cancelled' && canCancelBooking(booking) && (
                          <button
                            onClick={() => { setCancelBookingId(booking.id); setCancelSource(booking.source || 'booking'); }}
                            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          >
                            Cancelar
                          </button>
                        )}
                        {booking.status !== 'cancelled' && !canCancelBooking(booking) && cancelRules && !cancelRules.allowStudentCancelBooking && (
                          <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg">
                            Cancelamento bloqueado
                          </span>
                        )}
                        {booking.status !== 'cancelled' && !canCancelBooking(booking) && cancelRules?.allowStudentCancelBooking && cancelRules?.minHoursToCancel > 0 && (
                          <span className="px-3 py-1.5 text-xs bg-yellow-50 text-yellow-600 rounded-lg">
                            Prazo expirado
                          </span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="px-3 py-1.5 text-sm bg-gray-100 text-gray-500 rounded-lg">
                            Cancelado
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Cancel Confirmation */}
            <AlertDialog open={cancelBookingId !== null} onOpenChange={(open) => { if (!open) setCancelBookingId(null); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar {cancelSource === 'enrollment' ? 'Matrícula' : 'Agendamento'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja cancelar? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Não</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (cancelBookingId) {
                        if (cancelSource === 'enrollment') {
                          cancelEnrollment.mutate({ enrollmentId: cancelBookingId });
                        } else {
                          cancelBooking.mutate({ id: cancelBookingId });
                        }
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sim, Cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Swap Schedule Dialog */}
            <AlertDialog open={swapEnrollmentId !== null} onOpenChange={(open) => { if (!open) { setSwapEnrollmentId(null); setSwapScheduleId(""); } }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Trocar Horário</AlertDialogTitle>
                  <AlertDialogDescription>
                    Escolha o novo horário para sua aula:
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-2 max-h-60 overflow-y-auto">
                  {(availableSchedules as any[])
                    .filter((s: any) => s.active && s.enrolledCount < s.capacity)
                    .map((s: any) => (
                      <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${swapScheduleId === String(s.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="swapSchedule" value={s.id} checked={swapScheduleId === String(s.id)} onChange={() => setSwapScheduleId(String(s.id))} className="text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{s.name} - {s.type}</p>
                          <p className="text-xs text-gray-500">{DAYS_SHORT[String(s.dayOfWeek)] || s.dayOfWeek} às {s.startTime?.slice(0, 5)} ({s.enrolledCount}/{s.capacity} vagas)</p>
                        </div>
                      </label>
                    ))}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (swapEnrollmentId && swapScheduleId) {
                        changeSchedule.mutate({ enrollmentId: swapEnrollmentId, newScheduleId: parseInt(swapScheduleId) });
                      }
                    }}
                    disabled={!swapScheduleId}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Confirmar Troca
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );

      case "dashboard":
      default:
        return (
          <div className="px-4 pt-8">
            <div className="grid grid-cols-2 gap-4">
              {menuItems.slice(1).map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.id}
                    className="cursor-pointer border-none bg-white/80 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.04] transition-all duration-200"
                    onClick={() => navigate(item.id)}
                  >
                    <CardContent className="py-6 px-3 flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md mb-2`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-700 text-sm text-center">
                        {item.label}
                      </h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 space-y-4">
              {workouts.length > 0 && (
                <Card className="bg-white/90 rounded-2xl shadow-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Meus Treinos</h3>
                  <div className="space-y-2">
                    {workouts.slice(0, 3).map((workout: any) => (
                      <div
                        key={workout.id}
                        onClick={() => setLocation(`/student/workout/${workout.id}`)}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{workout.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {workout.active ? "Ativo" : "Inativo"}
                            </p>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {payments.length > 0 && (
                <Card className="bg-white/90 rounded-2xl shadow-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Pagamentos Recentes</h3>
                  <div className="space-y-2">
                    {payments.slice(0, 3).map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            R$ {((payment.totalAmountInCents || payment.amountInCents) / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                          </p>
                          {(payment.lateFeeInCents > 0 || payment.interestInCents > 0) && (
                            <p className="text-xs text-red-600 font-semibold">
                              +R$ {(((payment.lateFeeInCents || 0) + (payment.interestInCents || 0)) / 100).toFixed(2)} acréscimos
                            </p>
                          )}
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full">
                          {payment.status === "paid" ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Pago
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 relative pb-20">
      {/* Header - Only show on dashboard */}
      {currentScreen === "dashboard" && (
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg px-5 py-6 rounded-b-3xl flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            {/* Foto do Aluno */}
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shadow-md ring-4 ring-white/10 overflow-hidden">
              {student.photoUrl || student.cardImageUrl ? (
                <img
                  src={student.photoUrl || student.cardImageUrl}
                  alt="Foto do Aluno"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const initials = (user?.name || "A")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/80"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`;
                    }
                  }}
                />
              ) : (
                <User className="w-7 h-7 text-white/80" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white drop-shadow-sm">
                Olá, {firstName}
              </h2>
              <span className="text-xs text-white/80">
                Matrícula #{student.registrationNumber || student.id}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-white/80 hover:text-white transition"
            >
              <Bell className="w-7 h-7" />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all duration-200 border border-white/30"
              title="Sair do aplicativo"
            >
              <LogOut className="w-5 h-5 text-white" />
              <span className="text-white font-medium text-sm">Sair</span>
            </button>
          </div>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-5 top-20 w-80 bg-white rounded-2xl shadow-2xl border z-50 max-h-96 overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800">Notificações</h3>
              </div>
              <div className="p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Nenhuma notificação</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {renderScreen()}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 rounded-t-2xl shadow">
        <div className="flex justify-between overflow-x-auto py-2 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex flex-col items-center py-2 px-2 transition text-xs min-w-0 flex-shrink-0 ${
                  isActive
                    ? "text-blue-600 font-bold scale-110"
                    : "text-gray-500"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? "text-blue-600" : ""}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
