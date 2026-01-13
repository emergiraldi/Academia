import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useGym } from "@/_core/hooks/useGym";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export default function AdminCashFlow() {
  const [period, setPeriod] = useState("12");
  const { gymSlug } = useGym();

  const { data: payments = [] } = trpc.payments.listAll.useQuery({
    gymSlug,
  });

  // Buscar despesas reais do banco de dados
  const { data: expensesData = [] } = trpc.expenses.list.useQuery({});

  // Mapear despesas para o formato usado no componente
  // Filtrar apenas despesas pagas para cálculo do fluxo de caixa real
  const expenses = expensesData
    .filter((e: any) => e.status === 'paid' && e.paidAt) // Apenas despesas efetivamente pagas
    .map((e: any) => ({
      id: e.id,
      description: e.description,
      amount: e.amountInCents,
      date: e.paidAt, // Data de pagamento efetivo
      category: e.category?.name || 'other',
      type: "expense",
    }));

  // Calculate monthly cash flow
  const monthlyData = Array.from({ length: parseInt(period) }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (parseInt(period) - 1 - i));
    const month = date.toLocaleDateString("pt-BR", { month: "short" });
    const year = date.getFullYear();

    // Calculate income (payments received)
    const monthPayments = payments.filter((p: any) => {
      if (p.status !== "paid" || !p.paidAt) return false;
      const paidDate = new Date(p.paidAt);
      return (
        paidDate.getMonth() === date.getMonth() &&
        paidDate.getFullYear() === date.getFullYear()
      );
    });

    const income = monthPayments.reduce((sum: number, p: any) => sum + p.amountInCents, 0);

    // Mock expenses for now
    const monthExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return (
        expenseDate.getMonth() === date.getMonth() &&
        expenseDate.getFullYear() === date.getFullYear()
      );
    });

    const expense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      month: `${month}/${year.toString().slice(2)}`,
      entradas: income / 100,
      saidas: expense / 100,
      saldo: (income - expense) / 100,
    };
  });

  // Calculate totals
  const totalIncome = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const currentBalance = totalIncome - totalExpenses;

  // Calculate projected balance (next 30 days)
  const pendingIncome = payments
    .filter((p: any) => {
      if (p.status !== "pending") return false;
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);
      return dueDate >= today && dueDate <= in30Days;
    })
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const projectedBalance = currentBalance + pendingIncome;

  // Recent transactions
  const allTransactions = [
    ...payments
      .filter((p: any) => p.status === "paid" && p.paidAt)
      .map((p: any) => ({
        id: `income-${p.id}`,
        description: `Pagamento - ${p.student?.registrationNumber || "N/A"}`,
        amount: p.amountInCents,
        date: p.paidAt,
        type: "income",
        category: p.plan?.name || "Pagamento", // Mostra o nome do plano ou "Pagamento" como fallback
      })),
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      description: e.description,
      amount: e.amount,
      date: e.date,
      type: "expense",
      category: e.category,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Calculate growth
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const currentMonthBalance =
    monthlyData.find(
      (m) => m.month === new Date().toLocaleDateString("pt-BR", { month: "short" }) + "/" + currentYear.toString().slice(2)
    )?.saldo || 0;

  const lastMonthBalance =
    monthlyData.find(
      (m) =>
        m.month ===
        lastMonth.toLocaleDateString("pt-BR", { month: "short" }) +
          "/" +
          lastMonth.getFullYear().toString().slice(2)
    )?.saldo || 0;

  const growthRate =
    lastMonthBalance !== 0 ? ((currentMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100 : 0;

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Título
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Fluxo de Caixa", pageWidth / 2, 15, { align: "center" });

      // Data de geração
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const today = new Date().toLocaleDateString("pt-BR");
      doc.text(`Data: ${today}`, pageWidth / 2, 22, { align: "center" });
      doc.text(`Período: Últimos ${period} meses`, pageWidth / 2, 28, { align: "center" });

      // Resumo de Métricas
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Financeiro", 14, 38);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Saldo Atual: R$ ${(currentBalance / 100).toFixed(2)}`, 14, 45);
      doc.text(`Total de Entradas: R$ ${(totalIncome / 100).toFixed(2)}`, 14, 51);
      doc.text(`Total de Saídas: R$ ${(totalExpenses / 100).toFixed(2)}`, 14, 57);
      doc.text(`Projeção 30 dias: R$ ${(projectedBalance / 100).toFixed(2)}`, 14, 63);
      doc.text(`Crescimento vs mês anterior: ${growthRate.toFixed(1)}%`, 14, 69);

      // Tabela de Fluxo Mensal
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Fluxo Mensal", 14, 79);

      const monthlyTableData = monthlyData.map((m) => [
        m.month,
        `R$ ${m.entradas.toFixed(2)}`,
        `R$ ${m.saidas.toFixed(2)}`,
        `R$ ${m.saldo.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 84,
        head: [["Mês", "Entradas", "Saídas", "Saldo"]],
        body: monthlyTableData,
        theme: "striped",
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 45, halign: "right" },
          2: { cellWidth: 45, halign: "right" },
          3: { cellWidth: 45, halign: "right" },
        },
      });

      // Tabela de Transações Recentes
      const finalY = (doc as any).lastAutoTable.finalY || 84;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Transações Recentes", 14, finalY + 10);

      const transactionsTableData = allTransactions.map((t) => [
        t.type === "income" ? "Entrada" : "Saída",
        t.description,
        t.category,
        new Date(t.date).toLocaleDateString("pt-BR"),
        `${t.type === "income" ? "+" : "-"}R$ ${(t.amount / 100).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: finalY + 15,
        head: [["Tipo", "Descrição", "Categoria", "Data", "Valor"]],
        body: transactionsTableData,
        theme: "striped",
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 60 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 35, halign: "right" },
        },
      });

      // Salvar PDF
      const filename = `fluxo_caixa_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
            <p className="text-muted-foreground">
              Controle completo de entradas e saídas
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
            <Button variant="outline" onClick={handleExportPDF}>
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
                Saldo Atual
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${currentBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {(currentBalance / 100).toLocaleString("pt-BR", {
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
                Total Entradas
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <ArrowUpCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {(totalIncome / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {payments.filter((p: any) => p.status === "paid").length} recebimentos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Saídas
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <ArrowDownCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {(totalExpenses / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {expenses.length} despesas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projeção 30 Dias
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${projectedBalance >= 0 ? "text-purple-600" : "text-red-600"}`}>
                {(projectedBalance / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                +{(pendingIncome / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })} esperado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Evolução do Fluxo de Caixa</CardTitle>
            <CardDescription>
              Comparativo de entradas e saídas nos últimos {period} meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
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
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Balance Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Saldo Mensal</CardTitle>
            <CardDescription>
              Saldo acumulado (entradas - saídas) por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
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
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Saldo"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas 10 movimentações de entrada e saída
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  allTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.type === "income" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <ArrowUpCircle className="w-3 h-3 mr-1" />
                            Entrada
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <ArrowDownCircle className="w-3 h-3 mr-1" />
                            Saída
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          transaction.type === "income" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {(transaction.amount / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
