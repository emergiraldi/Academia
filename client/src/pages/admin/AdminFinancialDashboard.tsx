import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Clock,
  UserPlus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useGym } from "@/_core/hooks/useGym";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

export default function AdminFinancialDashboard() {
  const [period, setPeriod] = useState("12");
  const { gymSlug } = useGym();

  const { data: payments = [] } = trpc.payments.listAll.useQuery({
    gymSlug,
  });

  // Buscar próximas aulas (próximos 7 dias)
  const { data: schedules = [] } = trpc.schedules.list.useQuery();
  // const { data: upcomingBookings = [] } = trpc.bookings.upcoming.useQuery();
  const { data: leads = [] } = trpc.leads.list.useQuery();

  // Calculate metrics
  const totalReceived = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const totalPending = payments
    .filter((p: any) => p.status === "pending")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const paidCount = payments.filter((p: any) => p.status === "paid").length;
  const pendingCount = payments.filter((p: any) => p.status === "pending").length;

  // Calculate monthly revenue (last 12 months)
  const monthlyRevenue = Array.from({ length: parseInt(period) }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (parseInt(period) - 1 - i));
    const month = date.toLocaleDateString("pt-BR", { month: "short" });
    const year = date.getFullYear();

    const monthPayments = payments.filter((p: any) => {
      if (p.status !== "paid" || !p.paidAt) return false;
      const paidDate = new Date(p.paidAt);
      return (
        paidDate.getMonth() === date.getMonth() &&
        paidDate.getFullYear() === date.getFullYear()
      );
    });

    const total = monthPayments.reduce((sum: number, p: any) => sum + p.amountInCents, 0);

    return {
      month: `${month}/${year.toString().slice(2)}`,
      receita: total / 100,
      pagamentos: monthPayments.length,
    };
  });

  // Calculate payment methods distribution
  const paymentMethods = [
    {
      name: "PIX",
      value: payments.filter((p: any) => p.paymentMethod === "pix" && p.status === "paid").length,
      color: "#3b82f6",
    },
    {
      name: "Dinheiro",
      value: payments.filter((p: any) => p.paymentMethod === "cash" && p.status === "paid").length,
      color: "#10b981",
    },
    {
      name: "Cartão Crédito",
      value: payments.filter((p: any) => p.paymentMethod === "credit_card" && p.status === "paid")
        .length,
      color: "#8b5cf6",
    },
    {
      name: "Cartão Débito",
      value: payments.filter((p: any) => p.paymentMethod === "debit_card" && p.status === "paid")
        .length,
      color: "#6366f1",
    },
  ].filter((method) => method.value > 0);

  // Calculate payment status distribution
  const statusData = [
    {
      name: "Pago",
      value: paidCount,
      color: "#10b981",
    },
    {
      name: "Pendente",
      value: pendingCount,
      color: "#f59e0b",
    },
    {
      name: "Atrasado",
      value: payments.filter(
        (p: any) => p.status === "pending" && new Date(p.dueDate) < new Date()
      ).length,
      color: "#ef4444",
    },
  ].filter((status) => status.value > 0);

  // Calculate conversion rate
  const totalPayments = payments.length;
  const conversionRate = totalPayments > 0 ? (paidCount / totalPayments) * 100 : 0;

  // Calculate average ticket
  const averageTicket = paidCount > 0 ? totalReceived / paidCount : 0;

  // Calculate growth (comparing last month vs previous month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const currentMonthRevenue = payments
    .filter((p: any) => {
      if (p.status !== "paid" || !p.paidAt) return false;
      const paidDate = new Date(p.paidAt);
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
    })
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const lastMonthRevenue = payments
    .filter((p: any) => {
      if (p.status !== "paid" || !p.paidAt) return false;
      const paidDate = new Date(p.paidAt);
      return (
        paidDate.getMonth() === lastMonth.getMonth() &&
        paidDate.getFullYear() === lastMonth.getFullYear()
      );
    })
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const growthRate =
    lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
            <p className="text-muted-foreground">
              Análise detalhada de receitas e pagamentos
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Total
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {(totalReceived / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {growthRate >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-600">+{growthRate.toFixed(1)}%</p>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{growthRate.toFixed(1)}%</p>
                  </>
                )}
                <p className="text-sm text-muted-foreground ml-1">vs mês anterior</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ticket Médio
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {(averageTicket / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {paidCount} pagamentos recebidos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conversão
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{conversionRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground mt-2">
                {paidCount} de {totalPayments} pagamentos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                A Receber
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Users className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {(totalPending / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {pendingCount} pagamentos pendentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Revenue Chart */}
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
              <CardDescription>Evolução da receita nos últimos {period} meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) =>
                      value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    }
                  />
                  <Legend />
                  <Bar dataKey="receita" fill="#10b981" name="Receita (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods Distribution */}
          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>Distribuição por método de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Payment Count Trend */}
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader>
              <CardTitle>Volume de Pagamentos</CardTitle>
              <CardDescription>Quantidade de pagamentos por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pagamentos"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Pagamentos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Status Distribution */}
          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardHeader>
              <CardTitle>Status dos Pagamentos</CardTitle>
              <CardDescription>Distribuição por status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Classes Section */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximas Aulas Agendadas
                </CardTitle>
                <CardDescription>Aulas dos próximos 7 dias com participantes confirmados</CardDescription>
              </div>
              <Button variant="outline" onClick={() => window.location.href = "/admin/schedule"}>
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma aula agendada nos próximos dias</p>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
                {upcomingBookings.slice(0, 5).map((booking: any) => {
                  const schedule = schedules.find((s: any) => s.id === booking.scheduleId);
                  const bookingDate = new Date(booking.bookingDate);
                  const isToday = bookingDate.toDateString() === new Date().toDateString();
                  const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                  let dateLabel = bookingDate.toLocaleDateString('pt-BR');
                  if (isToday) dateLabel = 'Hoje';
                  else if (isTomorrow) dateLabel = 'Amanhã';

                  return (
                    <div key={booking.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary" />
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
                            {booking.studentName}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {booking.status === 'confirmed' && (
                          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            Confirmado
                          </span>
                        )}
                        {booking.status === 'attended' && (
                          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            Presente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {upcomingBookings.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="link" onClick={() => window.location.href = "/admin/schedule"}>
                      Ver mais {upcomingBookings.length - 5} aulas agendadas
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
