import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Download,
  Filter,
  Plus,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Printer,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useGym } from "@/_core/hooks/useGym";

export default function AdminPayments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("current_month");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState<string>("");

  // Generate payment filters
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectAll, setSelectAll] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [monthsToGenerate, setMonthsToGenerate] = useState<string>("");
  const [dueDay, setDueDay] = useState<string>("10");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>("");

  const { gymSlug } = useGym();

  // Queries
  const { data: payments = [], refetch: refetchPayments } = trpc.payments.listAll.useQuery(
    { gymSlug: gymSlug || '' },
    {
      enabled: !!gymSlug,
      onSuccess: (data) => {
        console.log('[QUERY DEBUG] Payments received from API:', data.length);
        if (data.length > 0) {
          console.log('[QUERY DEBUG] First payment from API:', data[0]);
          console.log('[QUERY DEBUG] First payment student from API:', data[0].student);
        }
      }
    }
  );
  const { data: students = [] } = trpc.students.listAll.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: plans = [] } = trpc.plans.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: paymentMethods = [] } = trpc.paymentMethods.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });

  // Mutations
  const generateMutation = trpc.payments.generateMonthlyPayments.useMutation({
    onSuccess: (data) => {
      if (data.generated === 0) {
        toast.info("Mensalidades já foram geradas para este mês. Nenhuma mensalidade nova foi criada.");
      } else {
        toast.success(data.message);
      }
      refetchPayments();
      setGenerateModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar mensalidades");
    },
  });

  const markAsPaidMutation = trpc.payments.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("Pagamento quitado com sucesso!");
      setPaymentModalOpen(false);
      setSelectedPayment(null);
      refetchPayments();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao quitar pagamento");
    },
  });

  const generateReceiptMutation = trpc.payments.generateReceiptAdmin.useMutation({
    onSuccess: (data) => {
      setReceiptHtml(data.html);
      setReceiptModalOpen(true);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar recibo");
    },
  });

  // Filter payments
  const filteredPayments = payments.filter((payment: any) => {
    const matchesSearch =
      searchTerm === "" ||
      payment.student?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter - incluindo "overdue" para pagamentos atrasados
    let matchesStatus = false;
    if (statusFilter === "all") {
      // Excluir cancelados do filtro "todos"
      matchesStatus = payment.status !== "cancelled";
    } else if (statusFilter === "overdue") {
      matchesStatus = payment.status === "pending" && new Date(payment.dueDate) < new Date();
    } else if (statusFilter === "installment") {
      matchesStatus = payment.isInstallment === true;
    } else {
      matchesStatus = payment.status === statusFilter;
    }

    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter;

    // Period filter
    let matchesPeriod = false;
    const dueDate = new Date(payment.dueDate);
    const now = new Date();

    if (periodFilter === "all") {
      matchesPeriod = true;
    } else if (periodFilter === "current_month") {
      matchesPeriod = dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
    } else if (periodFilter === "last_30_days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesPeriod = dueDate >= thirtyDaysAgo;
    } else if (periodFilter === "last_60_days") {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      matchesPeriod = dueDate >= sixtyDaysAgo;
    } else if (periodFilter === "last_90_days") {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      matchesPeriod = dueDate >= ninetyDaysAgo;
    } else if (periodFilter === "next_30_days") {
      const thirtyDaysAhead = new Date();
      thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
      matchesPeriod = dueDate <= thirtyDaysAhead && dueDate >= now;
    }

    return matchesSearch && matchesStatus && matchesMethod && matchesPeriod;
  });

  // Calculate totals
  const totalReceived = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const totalPending = payments
    .filter((p: any) => p.status === "pending")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const totalOverdue = payments
    .filter((p: any) => {
      if (p.status !== "pending") return false;
      return new Date(p.dueDate) < new Date();
    })
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const handleOpenGenerateModal = () => {
    setSelectedStudents([]);
    setSelectedPlan("all");
    setSelectAll(false);
    setStudentSearchTerm("");
    setMonthsToGenerate("");
    setDueDay("10");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setGenerateModalOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // Filter students based on plan selection and search term
      const filteredStudents = students.filter((s: any) => {
        const matchesPlan = selectedPlan === "all" || s.planId?.toString() === selectedPlan;
        const matchesSearch = studentSearchTerm === "" ||
          s.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
          s.registrationNumber?.toLowerCase().includes(studentSearchTerm.toLowerCase());
        return matchesPlan && matchesSearch;
      });
      setSelectedStudents(filteredStudents.map((s: any) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handlePlanFilterChange = (planId: string) => {
    setSelectedPlan(planId);
    setSelectAll(false);
    setSelectedStudents([]);
  };

  const handleGenerateMonthly = async () => {
    const options: any = {};

    if (selectedStudents.length > 0) {
      options.studentIds = selectedStudents;
    }

    if (selectedPlan !== "all") {
      options.planId = parseInt(selectedPlan);
    }

    if (monthsToGenerate) {
      options.monthsToGenerate = parseInt(monthsToGenerate);
    }

    if (dueDay) {
      options.dueDay = parseInt(dueDay);
    }

    if (startDate) {
      options.startDate = new Date(startDate);
    }

    if (endDate) {
      options.endDate = new Date(endDate);
    }

    await generateMutation.mutateAsync(options);
  };

  const handleOpenPayment = (payment: any) => {
    setSelectedPayment(payment);

    // Debug: log available payment methods
    console.log("Available payment methods:", paymentMethods);
    console.log("Payment methods length:", paymentMethods.length);

    // Find default payment method (cash) or first active method
    if (paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find((m: any) => m.active && m.code === "cash");
      const firstActiveMethod = paymentMethods.find((m: any) => m.active);
      const selectedMethod = defaultMethod?.code || firstActiveMethod?.code || "cash";
      console.log("Selected payment method:", selectedMethod);
      setPaymentMethod(selectedMethod);
    } else {
      console.warn("No payment methods available, using default 'cash'");
      setPaymentMethod("cash");
    }

    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentModalOpen(true);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayment) return;

    // Validate payment method is selected
    if (!paymentMethod || paymentMethod.trim() === "") {
      toast.error("Selecione um método de pagamento");
      return;
    }

    await markAsPaidMutation.mutateAsync({
      paymentId: selectedPayment.id,
      paymentMethod,
      paidAt: new Date(paymentDate),
    });
  };

  const handleViewReceipt = (payment: any) => {
    setSelectedPayment(payment);
    generateReceiptMutation.mutate({ paymentId: payment.id });
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadReceipt = () => {
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-pagamento-${selectedPayment?.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === "paid") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      );
    }

    if (status === "cancelled") {
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      );
    }

    const isOverdue = new Date(dueDate) < new Date();
    if (isOverdue && status === "pending") {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Atrasado
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const methods: Record<string, { label: string; color: string }> = {
      pix: { label: "PIX", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      cash: { label: "Dinheiro", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      credit_card: { label: "Cartão", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      debit_card: { label: "Débito", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
    };

    const methodInfo = methods[method] || { label: method, color: "bg-gray-100 text-gray-800" };

    return <Badge className={methodInfo.color}>{methodInfo.label}</Badge>;
  };

  const handlePrint = () => {
    // DEBUG COM ALERT - Ignora cache do navegador
    if (filteredPayments.length > 0) {
      const firstPayment = filteredPayments[0];
      const debugInfo = `
🔍 DEBUG - DADOS DO PAGAMENTO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: ${firstPayment.id}
Status: ${firstPayment.status}
Valor: R$ ${(firstPayment.amountInCents / 100).toFixed(2)}

📋 OBJETO STUDENT:
${firstPayment.student ? 'EXISTE' : 'NÃO EXISTE (undefined)'}

👤 DADOS DO ALUNO:
Nome: ${firstPayment.student?.name || 'UNDEFINED'}
Email: ${firstPayment.student?.email || 'UNDEFINED'}
Matrícula: ${firstPayment.student?.registrationNumber || 'UNDEFINED'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de pagamentos: ${filteredPayments.length}
      `.trim();

      alert(debugInfo);
    } else {
      alert('⚠️ Nenhum pagamento encontrado em filteredPayments!');
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // DEBUG: Adicionar linha de debug no PDF
    let debugRowHTML = '';
    if (filteredPayments.length > 0) {
      const fp = filteredPayments[0];
      debugRowHTML = `
        <tr style="background-color: #fffbeb; border: 3px solid #f59e0b;">
          <td colspan="6" style="padding: 15px; border: 3px solid #f59e0b;">
            <div style="font-family: monospace; font-size: 11px; color: #92400e;">
              <strong style="color: #f59e0b; font-size: 14px;">🔍 DEBUG - DADOS DO PRIMEIRO PAGAMENTO:</strong><br>
              <strong>ID:</strong> ${fp.id} |
              <strong>Status:</strong> ${fp.status} |
              <strong>Valor:</strong> R$ ${(fp.amountInCents / 100).toFixed(2)}<br>
              <strong>Student Object EXISTS:</strong> ${fp.student ? 'SIM' : 'NÃO (undefined)'}<br>
              <strong>Student NAME:</strong> ${fp.student?.name || 'UNDEFINED'}<br>
              <strong>Student EMAIL:</strong> ${fp.student?.email || 'UNDEFINED'}<br>
              <strong>Student REGISTRATION:</strong> ${fp.student?.registrationNumber || 'UNDEFINED'}<br>
              <strong>Timestamp:</strong> ${new Date().toISOString()}
            </div>
          </td>
        </tr>
      `;
    }

    const tableHTML = filteredPayments.map((payment: any) => {
      const status = payment.status === "paid" ? "Pago" :
                     new Date(payment.dueDate) < new Date() ? "Atrasado" : "Pendente";
      const method = payment.paymentMethod === "pix" ? "PIX" :
                     payment.paymentMethod === "cash" ? "Dinheiro" :
                     payment.paymentMethod === "credit_card" ? "Cartão" :
                     payment.paymentMethod === "debit_card" ? "Débito" : payment.paymentMethod;

      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">
            <div><strong>${payment.student?.name || "N/A"}</strong></div>
            <div style="font-size: 12px; color: #666;">${payment.student?.registrationNumber || "N/A"}</div>
          </td>
          <td style="border: 1px solid #ddd; padding: 8px;">R$ ${(payment.amountInCents / 100).toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${method}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(payment.dueDate).toLocaleDateString("pt-BR")}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("pt-BR") : "-"}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${status}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Pagamentos - Academia</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: left; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Pagamentos</h1>
          <p style="text-align: center;">Data: ${new Date().toLocaleDateString("pt-BR")}</p>
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Valor</th>
                <th>Método</th>
                <th>Vencimento</th>
                <th>Pagamento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${debugRowHTML}
              ${tableHTML}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = () => {
    // For a simple implementation, we'll open print dialog with PDF option
    handlePrint();
    toast.success("Use a opção 'Salvar como PDF' na janela de impressão");
  };

  const handleExportExcel = () => {
    const headers = ["Aluno", "Matrícula", "Valor", "Método", "Vencimento", "Pagamento", "Status"];
    const rows = filteredPayments.map((payment: any) => {
      const status = payment.status === "paid" ? "Pago" :
                     new Date(payment.dueDate) < new Date() ? "Atrasado" : "Pendente";
      const method = payment.paymentMethod === "pix" ? "PIX" :
                     payment.paymentMethod === "cash" ? "Dinheiro" :
                     payment.paymentMethod === "credit_card" ? "Cartão" :
                     payment.paymentMethod === "debit_card" ? "Débito" : payment.paymentMethod;

      return [
        payment.student?.name || "N/A",
        payment.student?.registrationNumber || "N/A",
        `R$ ${(payment.amountInCents / 100).toFixed(2)}`,
        method,
        new Date(payment.dueDate).toLocaleDateString("pt-BR"),
        payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("pt-BR") : "-",
        status
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += headers.join(";") + "\n";
    rows.forEach(row => {
      csvContent += row.join(";") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pagamentos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportação para Excel realizada com sucesso!");
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground">
              Mensalidades geradas automaticamente para assinaturas ativas
            </p>
          </div>
          <Button onClick={handleOpenGenerateModal} disabled={generateMutation.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            Gerar Mensalidades do Mês
          </Button>
        </div>

        {/* Payment Modal */}
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dar Baixa em Mensalidade</DialogTitle>
              <DialogDescription>
                Registre o recebimento do pagamento
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Aluno:</span>
                      <p className="font-medium">{selectedPayment.student?.registrationNumber || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor:</span>
                      <p className="font-medium">
                        {(selectedPayment.amountInCents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vencimento:</span>
                      <p className="font-medium">
                        {new Date(selectedPayment.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment-method">Método de Pagamento</Label>
                  <select
                    id="payment-method"
                    value={paymentMethod || "cash"}
                    onChange={(e) => {
                      console.log("Payment method changed to:", e.target.value);
                      setPaymentMethod(e.target.value);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paymentMethods.length > 0 ? (
                      paymentMethods
                        .filter((m: any) => m.active)
                        .map((method: any) => (
                          <option key={method.id} value={method.code}>
                            {method.name}
                          </option>
                        ))
                    ) : (
                      <>
                        <option value="cash">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="credit_card">Cartão de Crédito</option>
                        <option value="debit_card">Cartão de Débito</option>
                      </>
                    )}
                  </select>
                  {paymentMethods.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Métodos de pagamento não carregados. Usando opções padrão.
                    </p>
                  )}
                </div>

                <div>
                  <Label>Data do Pagamento</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleMarkAsPaid}
                  className="w-full"
                  disabled={markAsPaidMutation.isPending}
                >
                  {markAsPaidMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Generate Monthly Payments Modal */}
        <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerar Mensalidades do Mês</DialogTitle>
              <DialogDescription>
                Selecione os alunos para gerar mensalidades. Por padrão, gera para todos com assinatura ativa.
              </DialogDescription>
            </DialogHeader>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4 py-4">
              {/* Search Student */}
              <div>
                <Label>Buscar Aluno</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou matrícula..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Plan Filter */}
              <div>
                <Label>Filtrar por Plano</Label>
                <Select value={selectedPlan} onValueChange={handlePlanFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os planos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Planos</SelectItem>
                    {plans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - R$ {(plan.priceInCents / 100).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Generation Options */}
              <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                <h3 className="font-semibold text-sm">Opções de Geração</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="months-to-generate">Quantidade de Mensalidades *</Label>
                    <Input
                      id="months-to-generate"
                      type="number"
                      min="1"
                      max="60"
                      value={monthsToGenerate}
                      onChange={(e) => setMonthsToGenerate(e.target.value)}
                      placeholder="Ex: 12"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Digite a quantidade (1 a 60 meses)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="due-day">Dia de Vencimento *</Label>
                    <Input
                      id="due-day"
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      placeholder="Ex: 10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Dia do mês (1 a 31)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Data Inicial</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mês inicial para geração
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="end-date">Data Final (Opcional)</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe em branco para usar a quantidade
                    </p>
                  </div>
                </div>

                {monthsToGenerate && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Serão geradas {monthsToGenerate} mensalidade{parseInt(monthsToGenerate) > 1 ? 's' : ''}:
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {Array.from({ length: parseInt(monthsToGenerate) }, (_, i) => {
                        const date = new Date(startDate);
                        date.setMonth(date.getMonth() + i);
                        return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
                      }).join(", ")}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Vencimento: Dia {dueDay} de cada mês
                    </p>
                  </div>
                )}
              </div>

              {/* Select All Checkbox */}
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Selecionar todos os alunos {selectedPlan !== "all" ? "deste plano" : ""}
                </label>
              </div>

              {/* Students List */}
              <div>
                <Label className="mb-2 block">
                  Alunos ({selectedStudents.length} selecionado{selectedStudents.length !== 1 ? 's' : ''})
                </Label>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {students
                    .filter((s: any) => {
                      const matchesPlan = selectedPlan === "all" || s.planId?.toString() === selectedPlan;
                      const matchesSearch = studentSearchTerm === "" ||
                        s.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        s.registrationNumber?.toLowerCase().includes(studentSearchTerm.toLowerCase());
                      return matchesPlan && matchesSearch;
                    })
                    .map((student: any) => {
                      const plan = plans.find((p: any) => p.id === student.planId);
                      return (
                        <div
                          key={student.id}
                          className="flex items-center space-x-2 p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer"
                          onClick={() => handleStudentToggle(student.id)}
                        >
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => handleStudentToggle(student.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {student.registrationNumber} • {plan?.name || "Sem plano"}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {student.membershipStatus === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Atenção:</strong> Serão geradas mensalidades apenas para alunos com assinaturas ativas.
                  {selectedStudents.length > 0 && ` ${selectedStudents.length} aluno(s) selecionado(s).`}
                  {selectedStudents.length === 0 && selectedPlan === "all" && " Nenhum aluno selecionado - gerará para TODOS com assinatura ativa."}
                  {selectedStudents.length === 0 && selectedPlan !== "all" && ` Gerará para todos do plano selecionado.`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setGenerateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerateMonthly}
                  disabled={generateMutation.isPending || !monthsToGenerate}
                >
                  {generateMutation.isPending ? "Gerando..." : "Gerar Mensalidades"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Recebido
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {(totalReceived / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {payments.filter((p: any) => p.status === "paid").length} pagamentos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendente
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {(totalPending / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {payments.filter((p: any) => p.status === "pending").length} pagamentos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Atrasado
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {(totalOverdue / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {
                  payments.filter(
                    (p: any) => p.status === "pending" && new Date(p.dueDate) < new Date()
                  ).length
                }{" "}
                pagamentos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div>
                <Label>Buscar Aluno</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou matrícula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Período</Label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Mês Atual</SelectItem>
                    <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                    <SelectItem value="last_60_days">Últimos 60 dias</SelectItem>
                    <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
                    <SelectItem value="next_30_days">Próximos 30 dias</SelectItem>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                    <SelectItem value="installment">Parcelado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Método</Label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {paymentMethods.map((method: any) => (
                      <SelectItem key={method.id} value={method.code}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Exportar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Exportar Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Todos os Pagamentos</CardTitle>
            <CardDescription>
              {filteredPayments.length} pagamento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{payment.student?.name || "N/A"}</span>
                          <span className="text-xs text-muted-foreground">
                            {payment.student?.registrationNumber || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>
                            {(payment.amountInCents / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                          {payment.isInstallment && (
                            <Badge variant="outline" className="w-fit text-xs">
                              Parcela {payment.installmentNumber}/{payment.totalInstallments}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getMethodBadge(payment.paymentMethod)}</TableCell>
                      <TableCell>
                        {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status, payment.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {payment.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPayment(payment)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Dar Baixa
                            </Button>
                          )}
                          {payment.status === "paid" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReceipt(payment)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Ver Recibo
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Recibo */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Recibo de Pagamento</DialogTitle>
            <DialogDescription>
              Pagamento #{selectedPayment?.id} - {selectedPayment && (
                <span>
                  {(selectedPayment.amountInCents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-w-7xl mx-auto px-8 py-8 space-y-4">
            {/* Preview do recibo */}
            <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '500px' }}>
              <iframe
                srcDoc={receiptHtml}
                className="w-full h-full"
                title="Recibo de Pagamento"
                style={{ border: 'none' }}
              />
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 justify-end">
              <Button onClick={handlePrintReceipt} variant="default">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleDownloadReceipt} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </Button>
              <Button onClick={() => setReceiptModalOpen(false)} variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
