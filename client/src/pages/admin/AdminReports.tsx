import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { FileText, FileSpreadsheet, Download, TrendingUp, Users, DollarSign, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useGym } from "@/_core/hooks/useGym";

export default function AdminReports() {
  // Filtros de período
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [useDateRange, setUseDateRange] = useState(false);

  // Filtros de status e categorias
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  const [generating, setGenerating] = useState<string | null>(null);

  const { gymSlug } = useGym();

  // Queries
  const { data: settings } = trpc.settings.get.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: students = [] } = trpc.students.listAll.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: payments = [] } = trpc.payments.listAll.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: plans = [] } = trpc.plans.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });

  // Gym name from settings
  const gymName = settings?.gymName || "Academia";

  // DEBUG: Verificar estrutura dos dados
  if (payments.length > 0) {
    console.log('🔍 [AdminReports] Total de pagamentos:', payments.length);
    console.log('🔍 [AdminReports] Primeiro pagamento:', payments[0]);
    console.log('🔍 [AdminReports] Student existe?', payments[0].student ? 'SIM' : 'NÃO');
    if (payments[0].student) {
      console.log('🔍 [AdminReports] Nome do student:', payments[0].student.name);
    }
  }

  // PDF Header with Logo and Gym Info
  const addPDFHeader = (doc: jsPDF, title: string, subtitle?: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add logo if available
    if (settings?.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', 14, 10, 30, 30);
      } catch (error) {
        console.log('Logo not added:', error);
      }
    }

    // Gym name and title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(gymName, settings?.logoUrl ? 50 : 14, 20);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(59, 130, 246);
    doc.text(title, settings?.logoUrl ? 50 : 14, 30);

    // Subtitle
    if (subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, settings?.logoUrl ? 50 : 14, 36);
    }

    // Date generated
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, settings?.logoUrl ? 50 : 14, 42);

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 48, pageWidth - 14, 48);

    // Reset colors
    doc.setTextColor(0, 0, 0);

    return 55; // Return Y position after header
  };

  // PDF Footer with page numbers
  const addPDFFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        gymName,
        14,
        pageHeight - 10
      );
    }
  };

  // Apply filters to students
  const getFilteredStudents = () => {
    return students.filter((student: any) => {
      // Status filter
      if (statusFilter !== "all" && student.membershipStatus !== statusFilter) {
        return false;
      }

      // Plan filter
      if (planFilter !== "all" && student.planId !== parseInt(planFilter)) {
        return false;
      }

      return true;
    });
  };

  // Apply filters to payments
  const getFilteredPayments = () => {
    return payments.filter((payment: any) => {
      const paymentDate = new Date(payment.dueDate);

      // Date filter
      if (useDateRange && customDateStart && customDateEnd) {
        const start = new Date(customDateStart);
        const end = new Date(customDateEnd);
        if (paymentDate < start || paymentDate > end) {
          return false;
        }
      } else {
        if (paymentDate.getMonth() + 1 !== selectedMonth || paymentDate.getFullYear() !== selectedYear) {
          return false;
        }
      }

      // Payment status filter
      if (paymentStatusFilter !== "all" && payment.status !== paymentStatusFilter) {
        return false;
      }

      return true;
    });
  };

  const filteredStudents = getFilteredStudents();
  const filteredPayments = getFilteredPayments();
  const defaulters = filteredStudents.filter((student: any) => student.membershipStatus === "inactive");

  // Calculate totals
  const totalReceived = filteredPayments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0) / 100;

  const totalPending = filteredPayments
    .filter((p: any) => p.status === "pending" || p.status === "overdue")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0) / 100;

  // Generate Students List Report (PDF)
  const generateStudentsReportPDF = () => {
    setGenerating("students-pdf");
    try {
      const doc = new jsPDF('landscape');
      const startY = addPDFHeader(doc, "Relatório de Alunos", "Lista completa de alunos cadastrados");

      // Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total de Alunos: ${filteredStudents.length}`, 14, startY + 8);
      doc.setFont('helvetica', 'normal');

      // Table data
      const tableData = filteredStudents.map((student: any) => [
        student.registrationNumber,
        student.name || "Sem Nome",
        student.cpf,
        student.email,
        student.phone || "-",
        `${student.city || "-"}/${student.state || "-"}`,
        student.membershipStatus === "active" ? "Ativo" :
        student.membershipStatus === "inactive" ? "Inativo" : "Bloqueado",
        student.faceEnrolled ? "Sim" : "Não",
        new Date(student.createdAt).toLocaleDateString("pt-BR"),
      ]);

      autoTable(doc, {
        head: [["Matrícula", "Nome", "CPF", "Email", "Telefone", "Cidade/UF", "Status", "Face", "Cadastro"]],
        body: tableData,
        startY: startY + 15,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 40 },
          2: { cellWidth: 28 },
          3: { cellWidth: 45 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 },
          6: { cellWidth: 18, halign: 'center' },
          7: { cellWidth: 12, halign: 'center' },
          8: { cellWidth: 20 },
        },
      });

      addPDFFooter(doc);
      doc.save(`alunos-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Relatório de alunos gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(null);
    }
  };

  // Generate Defaulters Report (PDF)
  const generateDefaultersReport = () => {
    setGenerating("defaulters");
    try {
      const doc = new jsPDF();
      const startY = addPDFHeader(doc, "Relatório de Inadimplência", `Total de inadimplentes: ${defaulters.length}`);

      // Table
      const tableData = defaulters.map((student: any) => [
        student.registrationNumber,
        student.name || "Sem Nome",
        student.email,
        student.phone || "-",
        student.membershipStatus === "inactive" ? "Inativo" : "Bloqueado",
      ]);

      autoTable(doc, {
        head: [["Matrícula", "Nome", "Email", "Telefone", "Status"]],
        body: tableData,
        startY: startY + 5,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [254, 242, 242] },
      });

      addPDFFooter(doc);
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

    // DEBUG: Alert para verificar dados (ignora cache)
    if (filteredPayments.length > 0) {
      const first = filteredPayments[0];
      alert(`🔍 DEBUG PDF
Total: ${filteredPayments.length} pagamentos
Primeiro pagamento ID: ${first.id}
Student existe? ${first.student ? 'SIM' : 'NÃO'}
Nome: ${first.student?.name || 'UNDEFINED'}`);
    } else {
      alert('⚠️ Nenhum pagamento filtrado!');
    }

    try {
      const doc = new jsPDF('landscape');
      const period = useDateRange && customDateStart && customDateEnd
        ? `${new Date(customDateStart).toLocaleDateString("pt-BR")} a ${new Date(customDateEnd).toLocaleDateString("pt-BR")}`
        : `${selectedMonth}/${selectedYear}`;

      const startY = addPDFHeader(doc, "Relatório de Pagamentos", `Período: ${period}`);

      // Summary boxes
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(14, startY + 5, 80, 20, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("Total Recebido", 18, startY + 12);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${totalReceived.toFixed(2)}`, 18, startY + 20);

      doc.setFillColor(234, 179, 8);
      doc.roundedRect(100, startY + 5, 80, 20, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Total Pendente", 104, startY + 12);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${totalPending.toFixed(2)}`, 104, startY + 20);

      doc.setFillColor(59, 130, 246);
      doc.roundedRect(186, startY + 5, 80, 20, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Total Esperado", 190, startY + 12);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${(totalReceived + totalPending).toFixed(2)}`, 190, startY + 20);

      // Reset colors
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      // Table
      const tableData = filteredPayments.map((payment: any) => [
        new Date(payment.dueDate).toLocaleDateString("pt-BR"),
        payment.student?.name || "-",
        `R$ ${(payment.amountInCents / 100).toFixed(2)}`,
        payment.status === "paid" ? "Pago" :
        payment.status === "pending" ? "Pendente" :
        payment.status === "overdue" ? "Vencido" : "Cancelado",
        payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("pt-BR") : "-",
        payment.paymentMethod || "-",
      ]);

      autoTable(doc, {
        head: [["Vencimento", "Aluno", "Valor", "Status", "Pago em", "Método"]],
        body: tableData,
        startY: startY + 30,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'center' },
        },
      });

      addPDFFooter(doc);
      doc.save(`pagamentos-${period.replace(/\//g, '-')}.pdf`);
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
      const period = useDateRange && customDateStart && customDateEnd
        ? `${new Date(customDateStart).toLocaleDateString("pt-BR")} a ${new Date(customDateEnd).toLocaleDateString("pt-BR")}`
        : `${selectedMonth}/${selectedYear}`;

      const startY = addPDFHeader(doc, "Relatório Financeiro", `Período: ${period}`);

      // Financial Summary with colored boxes
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(14, startY + 5, 180, 35, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Resumo Financeiro", 18, startY + 13);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Recebido: R$ ${totalReceived.toFixed(2)}`, 18, startY + 21);
      doc.text(`Total Pendente: R$ ${totalPending.toFixed(2)}`, 18, startY + 27);
      doc.text(`Total Esperado: R$ ${(totalReceived + totalPending).toFixed(2)}`, 18, startY + 33);

      const receiptRate = totalReceived + totalPending > 0
        ? ((totalReceived / (totalReceived + totalPending)) * 100).toFixed(1)
        : "0.0";
      doc.text(`Taxa de Recebimento: ${receiptRate}%`, 120, startY + 21);

      // Reset colors
      doc.setTextColor(0, 0, 0);

      // Students Summary
      const activeStudents = filteredStudents.filter((s: any) => s.membershipStatus === "active").length;

      doc.setFillColor(34, 197, 94);
      doc.roundedRect(14, startY + 48, 180, 25, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Resumo de Alunos", 18, startY + 56);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total: ${filteredStudents.length} | Ativos: ${activeStudents} | Inativos: ${defaulters.length}`, 18, startY + 63);
      doc.text(`Taxa de Atividade: ${((activeStudents / filteredStudents.length) * 100).toFixed(1)}%`, 18, startY + 69);

      // Reset colors
      doc.setTextColor(0, 0, 0);

      // Plans Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Planos Cadastrados", 14, startY + 85);

      const plansData = plans.map((plan: any) => [
        plan.name,
        `R$ ${(plan.priceInCents / 100).toFixed(2)}`,
        `${plan.durationMonths} meses`,
        plan.description || "-",
      ]);

      autoTable(doc, {
        head: [["Plano", "Valor", "Duração", "Descrição"]],
        body: plansData,
        startY: startY + 90,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
          fillColor: [139, 92, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 243, 255] },
      });

      addPDFFooter(doc);
      doc.save(`financeiro-${period.replace(/\//g, '-')}.pdf`);
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
      const data = filteredStudents.map((student: any) => ({
        Matrícula: student.registrationNumber,
        Nome: student.name || "Sem Nome",
        Email: student.email,
        CPF: student.cpf,
        Telefone: student.phone || "-",
        Endereço: student.address || "-",
        Cidade: student.city || "-",
        Estado: student.state || "-",
        Status: student.membershipStatus === "active" ? "Ativo" :
                student.membershipStatus === "inactive" ? "Inativo" : "Bloqueado",
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
        Aluno: payment.student?.name || "-",
        Valor: `R$ ${(payment.amountInCents / 100).toFixed(2)}`,
        Status: payment.status === "paid" ? "Pago" :
                payment.status === "pending" ? "Pendente" :
                payment.status === "overdue" ? "Vencido" : "Cancelado",
        "Pago em": payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("pt-BR") : "-",
        "Método": payment.paymentMethod || "-",
        "ID Transação": payment.txId || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");

      const period = useDateRange && customDateStart && customDateEnd
        ? `${customDateStart}_${customDateEnd}`
        : `${selectedMonth}-${selectedYear}`;

      XLSX.writeFile(wb, `pagamentos-${period}.xlsx`);
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
          <p className="text-muted-foreground">Gere relatórios profissionais em PDF e Excel para análise completa</p>
        </div>

        {/* Advanced Filters */}
        <Card className="shadow-md border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <CardTitle>Filtros Avançados</CardTitle>
            </div>
            <CardDescription>Personalize os relatórios com filtros detalhados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Period Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Label className="font-semibold">Período</Label>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant={!useDateRange ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseDateRange(false)}
                >
                  Mês/Ano
                </Button>
                <Button
                  variant={useDateRange ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseDateRange(true)}
                >
                  Período Personalizado
                </Button>
              </div>

              {!useDateRange ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
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

                  <div>
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
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status and Plan Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <Label>Status do Aluno</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="blocked">Bloqueados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Plano</Label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Planos</SelectItem>
                    {plans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status de Pagamento</Label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="overdue">Vencidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {totalReceived.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {useDateRange && customDateStart && customDateEnd
                  ? `${new Date(customDateStart).toLocaleDateString()} - ${new Date(customDateEnd).toLocaleDateString()}`
                  : `${selectedMonth}/${selectedYear}`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">R$ {totalPending.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredPayments.filter((p: any) => p.status === "pending" || p.status === "overdue").length} pagamentos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{defaulters.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredStudents.length > 0
                  ? `${((defaulters.length / filteredStudents.length) * 100).toFixed(1)}% dos alunos`
                  : "Sem dados"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Students Report */}
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Lista de Alunos
              </CardTitle>
              <CardDescription>
                Relatório completo com {filteredStudents.length} alunos cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={generateStudentsReportPDF}
                disabled={generating === "students-pdf"}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                {generating === "students-pdf" ? "Gerando PDF..." : "Gerar PDF"}
              </Button>
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

          {/* Defaulters Report */}
          <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                Relatório de Inadimplência
              </CardTitle>
              <CardDescription>
                Lista de {defaulters.length} alunos inadimplentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateDefaultersReport}
                disabled={generating === "defaulters" || defaulters.length === 0}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Download className="mr-2 h-4 w-4" />
                {generating === "defaulters" ? "Gerando..." : "Gerar PDF"}
              </Button>
            </CardContent>
          </Card>

          {/* Payments Report */}
          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Relatório de Pagamentos
              </CardTitle>
              <CardDescription>
                {filteredPayments.length} pagamentos no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={generatePaymentsReport}
                disabled={generating === "payments"}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                {generating === "payments" ? "Gerando PDF..." : "Gerar PDF"}
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
          <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Relatório Financeiro Completo
              </CardTitle>
              <CardDescription>
                Resumo executivo com análises e indicadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateFinancialReport}
                disabled={generating === "financial"}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Download className="mr-2 h-4 w-4" />
                {generating === "financial" ? "Gerando..." : "Gerar PDF"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Footer */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Sobre os Relatórios</p>
                <ul className="space-y-1">
                  <li>• Os PDFs incluem logo e nome da academia automaticamente</li>
                  <li>• Filtros são aplicados em todos os relatórios gerados</li>
                  <li>• Excel permite análise detalhada e gráficos personalizados</li>
                  <li>• Todos os valores são calculados em tempo real</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
