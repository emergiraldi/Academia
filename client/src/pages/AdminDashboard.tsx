import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  UserPlus,
  DollarSign,
  Activity,
  CheckCircle,
  GraduationCap,
  UserCog,
  Calendar,
  Clock
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  // Get current user to get gym slug
  const { data: currentUser } = trpc.auth.me.useQuery();
  const gymSlug = currentUser?.gymSlug || "";

  const { data: students = [] } = trpc.students.listAll.useQuery(
    { gymSlug },
    { enabled: !!gymSlug }
  );
  const { data: plans = [] } = trpc.plans.list.useQuery(
    { gymSlug },
    { enabled: !!gymSlug }
  );
  const { data: payments = [] } = trpc.payments.listAll.useQuery(
    { gymSlug },
    { enabled: !!gymSlug }
  );
  const { data: schedules = [] } = trpc.schedules.list.useQuery();
  const { data: upcomingBookings = [] } = trpc.bookings.upcoming.useQuery();
  const { data: upcomingVisitorBookings = [] } = trpc.visitorBookings.upcoming.useQuery();

  const activeStudents = students.filter(s => s.membershipStatus === "active").length;
  const inactiveStudents = students.filter(s => s.membershipStatus === "inactive").length;
  const blockedStudents = students.filter(s => s.membershipStatus === "blocked").length;

  // Calculate monthly revenue from confirmed payments this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyRevenue = payments
    .filter((p: any) => {
      if (p.status !== "paid") return false;
      const paymentDate = p.paidAt ? new Date(p.paidAt) : new Date(p.dueDate);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    })
    .reduce((sum: number, p: any) => sum + (p.amountInCents || 0), 0);

  const overduePayments = payments.filter((p: any) => {
    if (p.status === "paid") return false;
    const dueDate = new Date(p.dueDate);
    return dueDate < now;
  }).length;

  const stats = [
    {
      title: "Total de Alunos",
      value: students.length,
      icon: Users,
      description: `${activeStudents} ativos`,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Alunos Ativos",
      value: activeStudents,
      icon: CheckCircle,
      description: "Com mensalidade em dia",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Receita Mensal",
      value: (monthlyRevenue / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      icon: DollarSign,
      description: "Pagamentos confirmados",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Inadimplentes",
      value: overduePayments,
      icon: AlertCircle,
      description: "Mensalidades atrasadas",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
  ];

  const navigationItems = [
    {
      title: "Alunos",
      href: "/admin/students",
      icon: Users,
      description: "Gerenciar cadastros",
    },
    {
      title: "Planos",
      href: "/admin/plans",
      icon: CreditCard,
      description: "Gerenciar mensalidades",
    },
    {
      title: "Professores",
      href: "/admin/professors",
      icon: GraduationCap,
      description: "Gerenciar professores",
    },
    {
      title: "Funcionários",
      href: "/admin/staff",
      icon: UserCog,
      description: "Gerenciar equipe",
    },
    {
      title: "Pagamentos",
      href: "/admin/payments",
      icon: DollarSign,
      description: "Histórico financeiro",
    },
    {
      title: "Dashboard Financeiro",
      href: "/admin/financial",
      icon: TrendingUp,
      description: "Gráficos e métricas",
    },
    {
      title: "Inadimplentes",
      href: "/admin/defaulters",
      icon: AlertCircle,
      description: "Gestão de cobranças",
    },
    {
      title: "Acessos",
      href: "/admin/access-logs",
      icon: Activity,
      description: "Logs de entrada/saída",
    },
    {
      title: "Dispositivos Control ID",
      href: "/admin/control-id-devices",
      icon: Activity,
      description: "Reconhecimento facial",
    },
    {
      title: "Relatórios",
      href: "/admin/reports",
      icon: TrendingUp,
      description: "Exportar PDF/Excel",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da academia e principais métricas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const borderColors = ['border-l-blue-500', 'border-l-green-500', 'border-l-emerald-500', 'border-l-red-500'];
            const iconBgColors = ['bg-blue-100', 'bg-green-100', 'bg-emerald-100', 'bg-red-100'];
            const iconColors = ['text-blue-600', 'text-green-600', 'text-emerald-600', 'text-red-600'];

            return (
              <Card key={stat.title} className={`border-l-4 ${borderColors[index]} shadow-md`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.description}</p>
                    </div>
                    <div className={`w-12 h-12 ${iconBgColors[index]} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${iconColors[index]}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-yellow-100', 'bg-orange-100', 'bg-pink-100', 'bg-red-100', 'bg-indigo-100', 'bg-cyan-100', 'bg-teal-100'];
              const textColors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-yellow-600', 'text-orange-600', 'text-pink-600', 'text-red-600', 'text-indigo-600', 'text-cyan-600', 'text-teal-600'];
              const borderColors = ['border-l-blue-500', 'border-l-green-500', 'border-l-purple-500', 'border-l-yellow-500', 'border-l-orange-500', 'border-l-pink-500', 'border-l-red-500', 'border-l-indigo-500', 'border-l-cyan-500', 'border-l-teal-500'];

              return (
                <Card
                  key={item.href}
                  className={`border-l-4 ${borderColors[index % borderColors.length]} shadow-md hover:shadow-lg transition cursor-pointer group`}
                  onClick={() => setLocation(item.href)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${bgColors[index % bgColors.length]} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition`}>
                      <Icon className={`w-8 h-8 ${textColors[index % textColors.length]}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Próximas Aulas Agendadas</h2>
            <Button variant="outline" onClick={() => setLocation("/admin/schedule")}>
              Ver Todos
            </Button>
          </div>
          <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>
              Aulas dos próximos 7 dias - Alunos e Visitantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 && upcomingVisitorBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="mb-4">Nenhuma aula agendada nos próximos dias</p>
                <Button onClick={() => setLocation("/admin/schedule")}>
                  Agendar Aula
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Alunos Cadastrados */}
                {upcomingBookings.slice(0, 3).map((booking: any) => {
                  const schedule = schedules.find((s: any) => s.id === booking.scheduleId);
                  const bookingDate = new Date(booking.bookingDate);
                  const isToday = bookingDate.toDateString() === new Date().toDateString();
                  const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                  let dateLabel = bookingDate.toLocaleDateString('pt-BR');
                  if (isToday) dateLabel = 'Hoje';
                  else if (isTomorrow) dateLabel = 'Amanhã';

                  return (
                    <div
                      key={`student-${booking.id}`}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setLocation("/admin/schedule")}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">{schedule?.name || 'Aula'}</h3>
                          {isToday && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Hoje
                            </span>
                          )}
                          {isTomorrow && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Amanhã
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {schedule?.startTime?.slice(0, 5)} - {dateLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {booking.studentName}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Aluno
                        </Badge>
                      </div>
                    </div>
                  );
                })}

                {/* Visitantes/Experimentais */}
                {upcomingVisitorBookings.slice(0, 3).map((booking: any) => {
                  const schedule = schedules.find((s: any) => s.id === booking.scheduleId);
                  const bookingDate = new Date(booking.bookingDate);
                  const isToday = bookingDate.toDateString() === new Date().toDateString();
                  const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                  let dateLabel = bookingDate.toLocaleDateString('pt-BR');
                  if (isToday) dateLabel = 'Hoje';
                  else if (isTomorrow) dateLabel = 'Amanhã';

                  return (
                    <div
                      key={`visitor-${booking.id}`}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setLocation("/admin/schedule")}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <UserPlus className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">{schedule?.name || 'Aula'}</h3>
                          {isToday && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Hoje
                            </span>
                          )}
                          {isTomorrow && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Amanhã
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {schedule?.startTime?.slice(0, 5)} - {dateLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserPlus className="h-3 w-3" />
                            {booking.visitorName}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          Visitante
                        </Badge>
                      </div>
                    </div>
                  );
                })}

                {(upcomingBookings.length > 3 || upcomingVisitorBookings.length > 3) && (
                  <div className="text-center pt-2">
                    <Button variant="link" onClick={() => setLocation("/admin/schedule")}>
                      Ver todos os agendamentos
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Recent Students */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Alunos Recentes</h2>
            <Button onClick={() => setLocation("/admin/students")}>
              Ver Todos
            </Button>
          </div>
          <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>
              Últimos cadastros realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhum aluno cadastrado ainda
                </p>
                <Button onClick={() => setLocation("/admin/students/new")}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {students.slice(0, 5).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all bg-white"
                    onClick={() => setLocation("/admin/students")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <span className="text-lg font-semibold text-white">
                          {student.name?.charAt(0).toUpperCase() || student.registrationNumber?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{student.name || student.registrationNumber}</p>
                        <p className="text-sm text-gray-500">{student.email || student.cpf}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        student.membershipStatus === "active"
                          ? "bg-green-500 hover:bg-green-600"
                          : student.membershipStatus === "blocked"
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      }
                    >
                      {student.membershipStatus === "active"
                        ? "Ativo"
                        : student.membershipStatus === "blocked"
                        ? "Bloqueado"
                        : "Inativo"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Plans Overview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Planos Disponíveis</h2>
            <Button onClick={() => setLocation("/admin/plans")}>
              Gerenciar
            </Button>
          </div>
          <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>
              Planos de mensalidade ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhum plano cadastrado ainda
                </p>
                <Button onClick={() => setLocation("/admin/plans/new")}>
                  Criar Primeiro Plano
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan, index) => {
                  const borderColors = ['border-l-blue-500', 'border-l-green-500', 'border-l-purple-500'];
                  return (
                    <Card
                      key={plan.id}
                      className={`border-l-4 ${borderColors[index % borderColors.length]} shadow-md hover:shadow-lg transition cursor-pointer`}
                      onClick={() => setLocation("/admin/plans")}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-900">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {(plan.priceInCents / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                        <p className="text-sm text-gray-500">
                          {plan.durationDays} dias
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
