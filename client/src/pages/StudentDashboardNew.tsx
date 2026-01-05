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
import { StudentDigitalCard } from "@/components/StudentDigitalCard";
import StudentPayments from "./StudentPayments";
import StudentFaceEnrollment from "./StudentFaceEnrollment";
import StudentMedicalExams from "./StudentMedicalExams";

export default function StudentDashboardNew() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);

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
                            R$ {(payment.amountInCents / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                          </p>
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
