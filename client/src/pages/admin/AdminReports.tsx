import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileText, FileSpreadsheet, Download, TrendingUp, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useGym } from "@/_core/hooks/useGym";

export default function AdminReports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState<string | null>(null);

  const { gymSlug } = useGym();
  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: payments = [] } = trpc.payments.listAll.useQuery({ gymSlug });
  const { data: plans = [] } = trpc.plans.list.useQuery({ gymSlug });

  // Filter defaulters (students with pending payments)
  const defaulters = students.filter((student: any) => student.membershipStatus === "inactive");

  // Filter payments by month/year
  const filteredPayments = payments.filter((payment: any) => {
    const paymentDate = new Date(payment.dueDate);
    return paymentDate.getMonth() + 1 === selectedMonth && paymentDate.getFullYear() === selectedYear;
  });

  // Calculate totals
  const totalReceived = filteredPayments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0) / 100;

  const totalPending = filteredPayments
    .filter((p: any) => p.status === "pending" || p.status === "overdue")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0) / 100;

  // Generate Defaulters Report (PDF)
  const generateDefaultersReport = () => {
    setGenerating("defaulters");
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("Relatório de Inadimplência", 14, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);

      // Summary
      doc.setFontSize(12);
      doc.text(`Total de Inadimplentes: ${defaulters.length}`, 14, 38);

      // Table
      const tableData = defaulters.map((student: any) => [
        student.registrationNumber,
        student.name || "Sem Nome",
        student.email,
        student.phone || "-",
        student.membershipStatus === "inactive" ? "Inativo" : "Ativo",
      ]);

      autoTable(doc, {
        head: [["Matrícula", "Nome", "Email", "Telefone", "Status"]],
        body: tableData,
        startY: 45,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`inadimplentes-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Relatório de inadimplência gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(null);
    }
  };

  // Generate Payments Report (PDF)
  const generatePaymentsReport = () => {
    setGenerating("payments");
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("Relatório de Pagamentos", 14, 20);
      doc.setFontSize(10);
      doc.text(`Período: ${selectedMonth}/${selectedYear}`, 14, 28);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 33);

      // Summary
      doc.setFontSize(12);
      doc.text(`Total Recebido: R$ ${totalReceived.toFixed(2)}`, 14, 43);
      doc.text(`Total Pendente: R$ ${totalPending.toFixed(2)}`, 14, 50);

      // Table
      const tableData = filteredPayments.map((payment: any) => [
        new Date(payment.dueDate).toLocaleDateString("pt-BR"),
        payment.studentName || "-",
        `R$ ${(payment.amountInCents / 100).toFixed(2)}`,
        payment.status === "paid" ? "Pago" : payment.status === "pending" ? "Pendente" : "Vencido",
        payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("pt-BR") : "-",
      ]);

      autoTable(doc, {
        head: [["Vencimento", "Aluno", "Valor", "Status", "Pago em"]],
        body: tableData,
        startY: 57,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`pagamentos-${selectedMonth}-${selectedYear}.pdf`);
      toast.success("Relatório de pagamentos gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(null);
    }
  };

  // Generate Financial Report (PDF with charts)
  const generateFinancialReport = () => {
    setGenerating("financial");
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("Relatório Financeiro Mensal", 14, 20);
      doc.setFontSize(10);
      doc.text(`Período: ${selectedMonth}/${selectedYear}`, 14, 28);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 33);

      // Financial Summary
      doc.setFontSize(14);
      doc.text("Resumo Financeiro", 14, 45);
      doc.setFontSize(11);
      doc.text(`Total Recebido: R$ ${totalReceived.toFixed(2)}`, 14, 53);
      doc.text(`Total Pendente: R$ ${totalPending.toFixed(2)}`, 14, 60);
      doc.text(`Total Esperado: R$ ${(totalReceived + totalPending).toFixed(2)}`, 14, 67);
      doc.text(`Taxa de Recebimento: ${((totalReceived / (totalReceived + totalPending)) * 100).toFixed(1)}%`, 14, 74);

      // Students Summary
      doc.setFontSize(14);
      doc.text("Resumo de Alunos", 14, 90);
      doc.setFontSize(11);
      doc.text(`Total de Alunos: ${students.length}`, 14, 98);
      doc.text(`Alunos Ativos: ${students.filter((s: any) => s.membershipStatus === "active").length}`, 14, 105);
      doc.text(`Alunos Inativos: ${defaulters.length}`, 14, 112);

      // Plans Summary
      doc.setFontSize(14);
      doc.text("Planos Cadastrados", 14, 128);

      const plansData = plans.map((plan: any) => [
        plan.name,
        `R$ ${(plan.priceInCents / 100).toFixed(2)}`,
        `${plan.durationMonths} meses`,
      ]);

      autoTable(doc, {
        head: [["Plano", "Valor", "Duração"]],
        body: plansData,
        startY: 135,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`financeiro-${selectedMonth}-${selectedYear}.pdf`);
      toast.success("Relatório financeiro gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(null);
    }
  };

  // Export Students List (Excel)
  const exportStudentsExcel = () => {
    setGenerating("students-excel");
    try {
      const data = students.map((student: any) => ({
        Matrícula: student.registrationNumber,
        Nome: student.name || "Sem Nome",
        Email: student.email,
        CPF: student.cpf,
        Telefone: student.phone || "-",
        Cidade: student.city || "-",
        Estado: student.state || "-",
        Status: student.membershipStatus === "active" ? "Ativo" : "Inativo",
        "Face Cadastrada": student.faceEnrolled ? "Sim" : "Não",
        "Data de Cadastro": new Date(student.createdAt).toLocaleDateString("pt-BR"),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alunos");

      XLSX.writeFile(wb, `alunos-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Lista de alunos exportada com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar lista");
    } finally {
      setGenerating(null);
    }
  };

  // Export Payments (Excel)
  const exportPaymentsExcel = () => {
    setGenerating("payments-excel");
    try {
      const data = filteredPayments.map((payment: any) => ({
        Vencimento: new Date(payment.dueDate).toLocaleDateString("pt-BR"),
        Aluno: payment.studentName || "-",
        Valor: `R$ ${(payment.amountInCents / 100).toFixed(2)}`,
        Status: payment.status === "paid" ? "Pago" : payment.status === "pending" ? "Pendente" : "Vencido",
        "Pago em": payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("pt-BR") : "-",
        "Método": payment.paymentMethod || "-",
        "ID Transação": payment.txId || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");

      XLSX.writeFile(wb, `pagamentos-${selectedMonth}-${selectedYear}.xlsx`);
      toast.success("Relatório de pagamentos exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório");
    } finally {
      setGenerating(null);
    }
  };

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Gere relatórios em PDF e Excel para análise financeira</p>
        </div>

        {/* Filters */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o período para os relatórios</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <Label>Mês</Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalReceived.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{selectedMonth}/{selectedYear}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalPending.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{selectedMonth}/{selectedYear}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{defaulters.length}</div>
              <p className="text-xs text-muted-foreground">Alunos inativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Defaulters Report */}
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório de Inadimplência
              </CardTitle>
              <CardDescription>Lista completa de alunos inadimplentes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateDefaultersReport}
                disabled={generating === "defaulters"}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {generating === "defaulters" ? "Gerando..." : "Gerar PDF"}
              </Button>
            </CardContent>
          </Card>

          {/* Payments Report */}
          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório de Pagamentos
              </CardTitle>
              <CardDescription>Pagamentos do período selecionado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={generatePaymentsReport}
                disabled={generating === "payments"}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {generating === "payments" ? "Gerando..." : "Gerar PDF"}
              </Button>
              <Button
                onClick={exportPaymentsExcel}
                disabled={generating === "payments-excel"}
                variant="outline"
                className="w-full"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {generating === "payments-excel" ? "Exportando..." : "Exportar Excel"}
              </Button>
            </CardContent>
          </Card>

          {/* Financial Report */}
          <Card className="border-l-4 border-l-purple-500 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório Financeiro
              </CardTitle>
              <CardDescription>Resumo financeiro completo do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateFinancialReport}
                disabled={generating === "financial"}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {generating === "financial" ? "Gerando..." : "Gerar PDF"}
              </Button>
            </CardContent>
          </Card>

          {/* Students Export */}
          <Card className="border-l-4 border-l-orange-500 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Lista de Alunos
              </CardTitle>
              <CardDescription>Exportar todos os alunos cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={exportStudentsExcel}
                disabled={generating === "students-excel"}
                variant="outline"
                className="w-full"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {generating === "students-excel" ? "Exportando..." : "Exportar Excel"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
