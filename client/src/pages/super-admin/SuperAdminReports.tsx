import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  TrendingDown,
  DollarSign,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet,
  Check
} from "lucide-react";
import { useState, useMemo } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type ReportType = "overdue" | "pending" | "paid" | "all";
type SortField = "dueDate" | "gymName" | "amount" | "status";
type SortOrder = "asc" | "desc";

export default function SuperAdminReports() {
  const [reportType, setReportType] = useState<ReportType>("all");
  const [selectedGym, setSelectedGym] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Modal de dar baixa
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Buscar dados
  const { data: billingStats, isLoading, refetch } = trpc.gymBillingCycles.getBillingStats.useQuery();
  const { data: gyms } = trpc.gyms.list.useQuery();
  const markAsPaid = trpc.gymBillingCycles.markAsPaid.useMutation();

  // Formatar valores
  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "-";
    let d: Date;
    if (typeof date === "string") {
      const [year, month, day] = date.split(/[-T]/);
      d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      d = date;
    }
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Dar baixa manual em billing cycle
  const handleMarkAsPaid = async () => {
    if (!selectedBilling || !paymentMethod) {
      alert("Selecione a forma de pagamento");
      return;
    }

    try {
      await markAsPaid.mutateAsync({
        billingCycleId: selectedBilling.id,
        paymentMethod,
        notes: notes || undefined,
      });

      alert("✅ Baixa efetuada com sucesso!");
      setDialogOpen(false);
      setPaymentMethod("");
      setNotes("");
      setSelectedBilling(null);
      refetch(); // Refresh data
    } catch (error: any) {
      console.error("Erro ao dar baixa:", error);
      alert(`❌ Erro ao dar baixa: ${error.message || "Erro desconhecido"}`);
    }
  };

  // Aplicar filtros e ordenação
  const filteredData = useMemo(() => {
    if (!billingStats) return [];

    // Flatten all billings from all gyms
    let allBillings: any[] = [];
    billingStats.gyms.forEach((gym) => {
      gym.billings.forEach((billing: any) => {
        allBillings.push({
          ...billing,
          gymName: gym.gymName,
          gymSlug: gym.gymSlug,
          gymPlan: gym.gymPlan,
        });
      });
    });

    // Filter by report type
    if (reportType !== "all") {
      allBillings = allBillings.filter((b) => b.status === reportType);
    }

    // Filter by gym
    if (selectedGym !== "all") {
      allBillings = allBillings.filter((b) => b.gymId.toString() === selectedGym);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      allBillings = allBillings.filter((b) => {
        const dueDate = new Date(b.dueDate);
        return dueDate >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      allBillings = allBillings.filter((b) => {
        const dueDate = new Date(b.dueDate);
        return dueDate <= end;
      });
    }

    // Sort
    allBillings.sort((a, b) => {
      let aVal, bVal;

      if (sortField === "dueDate") {
        aVal = new Date(a.dueDate).getTime();
        bVal = new Date(b.dueDate).getTime();
      } else if (sortField === "gymName") {
        aVal = a.gymName.toLowerCase();
        bVal = b.gymName.toLowerCase();
      } else if (sortField === "amount") {
        aVal = a.amountCents;
        bVal = b.amountCents;
      } else if (sortField === "status") {
        aVal = a.status;
        bVal = b.status;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return allBillings;
  }, [billingStats, reportType, selectedGym, startDate, endDate, sortField, sortOrder]);

  // Calcular estatísticas dos dados filtrados
  const filteredStats = useMemo(() => {
    const total = filteredData.reduce((sum, b) => sum + b.amountCents, 0);
    const overdue = filteredData.filter((b) => b.status === "overdue");
    const pending = filteredData.filter((b) => b.status === "pending");
    const paid = filteredData.filter((b) => b.status === "paid");

    return {
      total,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, b) => sum + b.amountCents, 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, b) => sum + b.amountCents, 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, b) => sum + b.amountCents, 0),
    };
  }, [filteredData]);

  // Exportar para CSV
  const exportToCSV = () => {
    const headers = [
      "Academia",
      "Plano",
      "Mês Referência",
      "Data Vencimento",
      "Valor",
      "Status",
      "Forma Pagamento",
      "Data Pagamento",
    ];

    const rows = filteredData.map((billing) => [
      billing.gymName,
      billing.gymPlan,
      billing.referenceMonth,
      formatDate(billing.dueDate),
      formatCurrency(billing.amountCents),
      billing.status === "paid" ? "Pago" : billing.status === "overdue" ? "Vencido" : "Pendente",
      billing.paymentMethod || "-",
      billing.paidAt ? formatDate(billing.paidAt) : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_mensalidades_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar para PDF
  const exportToPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // ========== HEADER PROFISSIONAL ==========
    // Background azul no topo
    pdf.setFillColor(59, 130, 246); // Azul profissional
    pdf.rect(0, 0, pageWidth, 35, "F");

    // Título principal branco
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    const title = "SysFit Pro";
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, yPosition + 8);

    // Subtítulo
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    const subtitle = "Relatório Financeiro";
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, yPosition + 15);

    // Data de geração
    pdf.setFontSize(9);
    const dateText = `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`;
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, (pageWidth - dateWidth) / 2, yPosition + 22);

    // Linha separadora elegante
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition + 27, pageWidth - margin, yPosition + 27);

    yPosition = 45; // Após o header
    pdf.setTextColor(0, 0, 0); // Voltar para preto

    // ========== RESUMO COM CORES ==========
    // Box de resumo com fundo cinza claro (aumentei altura)
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 42, 2, 2, "F");

    yPosition += 8;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(31, 41, 55);
    pdf.text("Resumo Financeiro", margin + 5, yPosition);

    yPosition += 8;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    // Total de Registros
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Total de Registros: ${filteredData.length}`, margin + 5, yPosition);
    yPosition += 6;

    // Inadimplentes (vermelho)
    pdf.setTextColor(220, 38, 38);
    pdf.text(`Inadimplentes: ${filteredStats.overdueCount} (${formatCurrency(filteredStats.overdueAmount)})`, margin + 5, yPosition);
    yPosition += 5;

    // Pendentes (amarelo escuro)
    pdf.setTextColor(202, 138, 4);
    pdf.text(`Pendentes: ${filteredStats.pendingCount} (${formatCurrency(filteredStats.pendingAmount)})`, margin + 5, yPosition);
    yPosition += 5;

    // Pagos (verde)
    pdf.setTextColor(21, 128, 61);
    pdf.text(`Pagos: ${filteredStats.paidCount} (${formatCurrency(filteredStats.paidAmount)})`, margin + 5, yPosition);
    yPosition += 5;

    // Total (preto, negrito, maior)
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total: ${formatCurrency(filteredStats.total)}`, margin + 5, yPosition);

    yPosition += 18;
    pdf.setFont("helvetica", "normal");

    // ========== TABELA COM HEADER COLORIDO ==========
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(31, 41, 55);
    pdf.text("Detalhamento", margin, yPosition);
    yPosition += 10;

    // Cabeçalho da tabela com fundo azul
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 9, "F");

    yPosition += 6;
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    const colWidths = [45, 22, 18, 24, 24, 20, 24];
    let xPosition = margin + 3;

    pdf.text("Academia", xPosition, yPosition);
    xPosition += colWidths[0];
    pdf.text("Plano", xPosition, yPosition);
    xPosition += colWidths[1];
    pdf.text("Mês Ref.", xPosition, yPosition);
    xPosition += colWidths[2];
    pdf.text("Vencimento", xPosition, yPosition);
    xPosition += colWidths[3];
    pdf.text("Valor", xPosition, yPosition);
    xPosition += colWidths[4];
    pdf.text("Status", xPosition, yPosition);
    xPosition += colWidths[5];
    pdf.text("Forma Pag.", xPosition, yPosition);

    yPosition += 7;
    pdf.setTextColor(0, 0, 0);

    // Dados com linhas alternadas
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    filteredData.forEach((billing, index) => {
      if (yPosition > pageHeight - 35) {
        // Rodapé antes de nova página
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Página ${pdf.internal.getNumberOfPages()}`, pageWidth / 2 - 10, pageHeight - 10);

        pdf.addPage();
        yPosition = margin + 15;
      }

      // Fundo alternado (zebra striping)
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, "F");
      }

      xPosition = margin + 3;
      pdf.setTextColor(31, 41, 55);

      // Limitar texto da academia
      const gymName = billing.gymName.length > 24 ? billing.gymName.substring(0, 24) + "..." : billing.gymName;
      pdf.text(gymName, xPosition, yPosition);
      xPosition += colWidths[0];

      pdf.text(billing.gymPlan, xPosition, yPosition);
      xPosition += colWidths[1];

      pdf.text(billing.referenceMonth, xPosition, yPosition);
      xPosition += colWidths[2];

      pdf.text(formatDate(billing.dueDate), xPosition, yPosition);
      xPosition += colWidths[3];

      pdf.text(formatCurrency(billing.amountCents), xPosition, yPosition);
      xPosition += colWidths[4];

      // Status com cor
      const status = billing.status === "paid" ? "Pago" : billing.status === "overdue" ? "Vencido" : "Pendente";
      if (billing.status === "paid") {
        pdf.setTextColor(21, 128, 61); // Verde
      } else if (billing.status === "overdue") {
        pdf.setTextColor(220, 38, 38); // Vermelho
      } else {
        pdf.setTextColor(202, 138, 4); // Amarelo
      }
      pdf.text(status, xPosition, yPosition);
      pdf.setTextColor(31, 41, 55);
      xPosition += colWidths[5];

      // Forma de Pagamento
      const payMethod = billing.paymentMethod || "-";
      pdf.setFontSize(7);
      pdf.text(payMethod.length > 12 ? payMethod.substring(0, 12) : payMethod, xPosition, yPosition);
      pdf.setFontSize(8);

      yPosition += 7;
    });

    // ========== RODAPÉ PROFISSIONAL ==========
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // Linha separadora
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.5);
      pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

      // Texto do rodapé
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);

      // Logo/Nome do sistema (esquerda)
      pdf.setFont("helvetica", "bold");
      pdf.text("SysFit Pro", margin, pageHeight - 12);

      // Página (centro)
      pdf.setFont("helvetica", "normal");
      const pageText = `Página ${i} de ${totalPages}`;
      const pageTextWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 12);

      // Site/contato (direita)
      const contactText = "www.sysfitpro.com.br";
      const contactWidth = pdf.getTextWidth(contactText);
      pdf.text(contactText, pageWidth - margin - contactWidth, pageHeight - 12);

      // Linha "Gerado automaticamente" (muito pequena)
      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      const autoText = "Relatório gerado automaticamente pelo sistema SysFit Pro";
      const autoWidth = pdf.getTextWidth(autoText);
      pdf.text(autoText, (pageWidth - autoWidth) / 2, pageHeight - 6);
    }

    // Salvar PDF
    pdf.save(`relatorio_mensalidades_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === "overdue") return <XCircle className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-orange-600" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Pago</span>;
    }
    if (status === "overdue") {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Vencido</span>;
    }
    return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Pendente</span>;
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Relatórios Financeiros</h2>
            <p className="text-gray-600 mt-1">Análise detalhada de inadimplência e receitas</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportToCSV}
              disabled={filteredData.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={filteredData.length === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards - Filtered */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Inadimplentes</p>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{filteredStats.overdueCount}</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(filteredStats.overdueAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Pendentes</p>
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{filteredStats.pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(filteredStats.pendingAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Pagos</p>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{filteredStats.paidCount}</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(filteredStats.paidAmount)}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total</p>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(filteredStats.total)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {/* Report Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tipo de Relatório
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="overdue">Inadimplentes</option>
                  <option value="pending">Pendentes</option>
                  <option value="paid">Pagos</option>
                </select>
              </div>

              {/* Gym Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Academia
                </label>
                <select
                  value={selectedGym}
                  onChange={(e) => setSelectedGym(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas</option>
                  {gyms?.map((gym) => (
                    <option key={gym.id} value={gym.id}>
                      {gym.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Data Final
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setReportType("all");
                    setSelectedGym("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resultados ({filteredData.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-gray-600 py-8">Carregando...</p>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum resultado encontrado com os filtros selecionados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th
                        className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("gymName")}
                      >
                        Academia {sortField === "gymName" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                        Plano
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                        Mês Ref.
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("dueDate")}
                      >
                        Vencimento {sortField === "dueDate" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("amount")}
                      >
                        Valor {sortField === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("status")}
                      >
                        Status {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                        Forma Pag.
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                        Pago em
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((billing, index) => (
                      <tr
                        key={`${billing.id}-${index}`}
                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{billing.gymName}</p>
                            <p className="text-xs text-gray-500">@{billing.gymSlug}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {billing.gymPlan}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {billing.referenceMonth}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {formatDate(billing.dueDate)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(billing.amountCents)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(billing.status)}
                            {getStatusBadge(billing.status)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {billing.paymentMethod || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {billing.paidAt ? formatDate(billing.paidAt) : "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {(billing.status === "pending" || billing.status === "overdue") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setSelectedBilling(billing);
                                setDialogOpen(true);
                              }}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Dar Baixa
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary by Gym */}
        {reportType === "overdue" && filteredData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Resumo de Inadimplência por Academia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {billingStats?.gyms
                  .filter((gym) =>
                    selectedGym === "all" || gym.gymId.toString() === selectedGym
                  )
                  .filter((gym) => gym.overdueCount > 0)
                  .map((gym) => (
                    <div
                      key={gym.gymId}
                      className="border-l-4 border-l-red-500 bg-red-50 p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{gym.gymName}</h4>
                          <p className="text-sm text-gray-600">@{gym.gymSlug} • {gym.gymPlan}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">
                            {gym.overdueCount}
                          </p>
                          <p className="text-xs text-gray-600">mensalidade(s) vencida(s)</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal para dar baixa manual */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Confirmar Baixa de Mensalidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedBilling && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Academia:</span>
                    <span className="text-sm font-semibold">{selectedBilling.gymName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mês Referência:</span>
                    <span className="text-sm font-semibold">{selectedBilling.referenceMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(selectedBilling.amountCents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vencimento:</span>
                    <span className="text-sm font-semibold">{formatDate(selectedBilling.dueDate)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ex: Pago em 3 parcelas, comprovante enviado por email, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setPaymentMethod("");
                    setNotes("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={!paymentMethod || markAsPaid.isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {markAsPaid.isLoading ? "Processando..." : "Confirmar Baixa"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
