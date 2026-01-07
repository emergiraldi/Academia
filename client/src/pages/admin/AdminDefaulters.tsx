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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Clock,
  Mail,
  Download,
  Search,
  Ban,
  Calendar,
  DollarSign,
  Send,
  Unlock,
  CreditCard,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useGym } from "@/_core/hooks/useGym";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminDefaulters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [daysOverdueFilter, setDaysOverdueFilter] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [selectedDefaulter, setSelectedDefaulter] = useState<any>(null);
  const [numInstallments, setNumInstallments] = useState(1);
  const [forgiveInterest, setForgiveInterest] = useState(false);

  const { gymSlug } = useGym();

  // Queries
  const { data: payments = [], refetch: refetchPayments } = trpc.payments.listAll.useQuery({
    gymSlug,
  });
  const { data: students = [], refetch: refetchStudents } = trpc.students.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });

  // Mutations
  const updateMembershipStatus = trpc.students.updateMembershipStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do aluno atualizado!");
      refetchStudents();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const createInstallment = trpc.payments.createInstallment.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Parcelamento criado com sucesso!");
      setInstallmentModalOpen(false);
      setSelectedDefaulter(null);
      setNumInstallments(1);
      setForgiveInterest(false);
      refetchStudents();
      refetchPayments();
    },
    onError: (error) => {
      toast.error(`Erro ao criar parcelamento: ${error.message}`);
    },
  });

  // Get overdue payments (exclude cancelled payments)
  const overduePayments = payments.filter((p: any) => {
    if (p.status !== "pending") return false;
    if (p.status === "cancelled") return false;
    return new Date(p.dueDate) < new Date();
  });

  // Get payments due soon (next 7 days)
  const dueSoonPayments = payments.filter((p: any) => {
    if (p.status !== "pending") return false;
    const dueDate = new Date(p.dueDate);
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    return dueDate >= today && dueDate <= in7Days;
  });

  // Group overdue payments by student
  const defaultersByStudent = overduePayments.reduce((acc: any, payment: any) => {
    const studentId = payment.studentId;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: payment.student,
        payments: [],
        totalOwed: 0,
        oldestDueDate: payment.dueDate,
      };
    }
    acc[studentId].payments.push(payment);
    acc[studentId].totalOwed += payment.amountInCents;
    if (new Date(payment.dueDate) < new Date(acc[studentId].oldestDueDate)) {
      acc[studentId].oldestDueDate = payment.dueDate;
    }
    return acc;
  }, {});

  const defaultersList = Object.values(defaultersByStudent).map((defaulter: any) => {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(defaulter.oldestDueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      ...defaulter,
      daysOverdue,
    };
  });

  // Filter defaulters
  const filteredDefaulters = defaultersList.filter((defaulter: any) => {
    const matchesSearch =
      searchTerm === "" ||
      defaulter.student?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      defaulter.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      defaulter.student?.cpf?.includes(searchTerm);

    let matchesDays = true;
    if (daysOverdueFilter === "1-7") {
      matchesDays = defaulter.daysOverdue >= 1 && defaulter.daysOverdue <= 7;
    } else if (daysOverdueFilter === "8-15") {
      matchesDays = defaulter.daysOverdue >= 8 && defaulter.daysOverdue <= 15;
    } else if (daysOverdueFilter === "16-30") {
      matchesDays = defaulter.daysOverdue >= 16 && defaulter.daysOverdue <= 30;
    } else if (daysOverdueFilter === "30+") {
      matchesDays = defaulter.daysOverdue > 30;
    }

    return matchesSearch && matchesDays;
  });

  // Calculate totals
  const totalOverdueAmount = overduePayments.reduce(
    (sum: number, p: any) => sum + p.amountInCents,
    0
  );
  const totalDueSoonAmount = dueSoonPayments.reduce(
    (sum: number, p: any) => sum + p.amountInCents,
    0
  );

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredDefaulters.map((d: any) => d.student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSendReminders = () => {
    if (selectedStudents.length === 0) {
      toast.error("Selecione pelo menos um aluno");
      return;
    }
    toast.success(`Enviando lembretes para ${selectedStudents.length} aluno(s)...`);
    // TODO: Implement email sending
  };

  const handleBlockStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Selecione pelo menos um aluno");
      return;
    }

    try {
      for (const studentId of selectedStudents) {
        await updateMembershipStatus.mutateAsync({
          gymSlug,
          studentId,
          membershipStatus: "blocked",
        });
      }
      toast.success(`${selectedStudents.length} aluno(s) bloqueado(s) com sucesso!`);
      setSelectedStudents([]);
    } catch (error) {
      // Error is already handled in mutation
    }
  };

  const handleToggleBlockStudent = async (studentId: number, currentStatus: string) => {
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    const action = newStatus === "blocked" ? "bloqueado" : "desbloqueado";

    await updateMembershipStatus.mutateAsync({
      gymSlug,
      studentId,
      membershipStatus: newStatus as "active" | "inactive" | "suspended" | "blocked",
    });
  };

  const calculateInterestAndFees = (defaulter: any) => {
    if (!settings) return { totalWithInterest: defaulter.totalOwed, interest: 0, lateFee: 0 };

    const daysToStartInterest = settings.daysToStartInterest || 0;
    const interestRate = parseFloat(settings.interestRatePerMonth) / 100 || 0;
    const lateFeeRate = parseFloat(settings.lateFeePercentage) / 100 || 0;

    let totalInterest = 0;
    let totalLateFee = 0;

    defaulter.payments.forEach((payment: any) => {
      const dueDate = new Date(payment.dueDate);
      const now = new Date();
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue > daysToStartInterest) {
        // Calculate late fee (once)
        const lateFee = payment.amountInCents * lateFeeRate;
        totalLateFee += lateFee;

        // Calculate interest (proportional to days)
        const monthsOverdue = (daysOverdue - daysToStartInterest) / 30;
        const interest = payment.amountInCents * interestRate * monthsOverdue;
        totalInterest += interest;
      }
    });

    return {
      totalWithInterest: defaulter.totalOwed + totalInterest + totalLateFee,
      interest: totalInterest,
      lateFee: totalLateFee,
    };
  };

  const handleOpenInstallment = (defaulter: any) => {
    setSelectedDefaulter(defaulter);
    setNumInstallments(1);
    setForgiveInterest(false);
    setInstallmentModalOpen(true);
  };

  const handleCreateInstallment = async () => {
    if (!selectedDefaulter || !settings) return;

    const maxInstallments = settings.maxInstallments || 6;
    const minInstallmentValue = settings.minimumInstallmentValue || 5000;

    if (numInstallments > maxInstallments) {
      toast.error(`Máximo de ${maxInstallments} parcelas permitido`);
      return;
    }

    const { totalWithInterest } = calculateInterestAndFees(selectedDefaulter);
    const finalTotal = forgiveInterest ? selectedDefaulter.totalOwed : totalWithInterest;
    const installmentValue = Math.ceil(finalTotal / numInstallments);

    if (installmentValue < minInstallmentValue) {
      toast.error(
        `Valor da parcela (R$ ${(installmentValue / 100).toFixed(2)}) é menor que o mínimo permitido (R$ ${(minInstallmentValue / 100).toFixed(2)})`
      );
      return;
    }

    // Get payment IDs from the selected defaulter
    const paymentIds = selectedDefaulter.payments.map((p: any) => p.id);

    // Calculate first due date (next month from today)
    const firstDueDate = new Date();
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    firstDueDate.setDate(10); // Set to 10th of next month

    // Call the mutation
    await createInstallment.mutateAsync({
      gymSlug,
      studentId: selectedDefaulter.student.id,
      paymentIds,
      numInstallments,
      totalAmount: finalTotal,
      forgiveInterest,
      firstDueDate: firstDueDate.toISOString().split('T')[0],
    });
  };

  const handleExportReport = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Título
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Inadimplência", pageWidth / 2, 15, { align: "center" });

      // Data de geração
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const today = new Date().toLocaleDateString("pt-BR");
      doc.text(`Data: ${today}`, pageWidth / 2, 22, { align: "center" });

      // Resumo
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo", 14, 32);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de inadimplentes: ${filteredDefaulters.length}`, 14, 39);
      doc.text(`Valor total em atraso: R$ ${(totalOverdueAmount / 100).toFixed(2)}`, 14, 45);
      doc.text(`Valor com vencimento próximo: R$ ${(totalDueSoonAmount / 100).toFixed(2)}`, 14, 51);

      // Tabela de inadimplentes
      const tableData = filteredDefaulters.map((defaulter: any) => {
        const { totalWithInterest } = calculateInterestAndFees(defaulter);
        return [
          defaulter.student.registrationNumber || "-",
          defaulter.student.name || "-",
          `${defaulter.daysOverdue} dias`,
          `R$ ${(totalWithInterest / 100).toFixed(2)}`,
          defaulter.student.membershipStatus === "blocked" ? "Bloqueado" : "Ativo"
        ];
      });

      autoTable(doc, {
        startY: 58,
        head: [["Matrícula", "Nome", "Atraso", "Valor Devido", "Status"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 60 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 30 },
        },
      });

      // Salvar PDF
      const filename = `inadimplentes_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  const handleSendIndividualReminder = (studentId: number, studentName: string) => {
    toast.success(`Enviando cobrança para ${studentName}...`);
    // TODO: Implement individual email sending
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Inadimplentes</h1>
            <p className="text-muted-foreground">
              Controle de mensalidades atrasadas e a vencer
            </p>
          </div>
          <Button onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Installment Modal */}
        <Dialog open={installmentModalOpen} onOpenChange={setInstallmentModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Parcelar Débitos</DialogTitle>
              <DialogDescription>
                Configure o parcelamento das mensalidades atrasadas
              </DialogDescription>
            </DialogHeader>
            {selectedDefaulter && (
              <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 py-4">
                {/* Student Info */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Aluno</h4>
                  <p className="text-lg">{selectedDefaulter.student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDefaulter.student.registrationNumber}
                  </p>
                </div>

                {/* Debt Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Mensalidades Atrasadas</p>
                    <p className="text-2xl font-bold">{selectedDefaulter.payments.length}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Dias de Atraso</p>
                    <p className="text-2xl font-bold text-red-600">
                      {selectedDefaulter.daysOverdue} dia(s)
                    </p>
                  </div>
                </div>

                {/* Interest Calculation */}
                {(() => {
                  const { totalWithInterest, interest, lateFee } =
                    calculateInterestAndFees(selectedDefaulter);
                  const finalTotal = forgiveInterest
                    ? selectedDefaulter.totalOwed
                    : totalWithInterest;

                  return (
                    <>
                      <div className="max-w-7xl mx-auto px-8 py-8 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Valor Original:</span>
                          <span className="font-semibold">
                            {(selectedDefaulter.totalOwed / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>

                        {!forgiveInterest && (
                          <>
                            <div className="flex justify-between items-center text-red-600">
                              <span>Multa ({((parseFloat(settings?.lateFeePercentage || "0")) || 0).toFixed(2)}%):</span>
                              <span>
                                +{" "}
                                {(lateFee / 100).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-red-600">
                              <span>Juros ({((parseFloat(settings?.interestRatePerMonth || "0")) || 0).toFixed(2)}% a.m.):</span>
                              <span>
                                +{" "}
                                {(interest / 100).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </div>
                          </>
                        )}

                        <Separator />

                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total a Parcelar:</span>
                          <span className={forgiveInterest ? "text-green-600" : ""}>
                            {(finalTotal / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Forgive Interest Option */}
                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="max-w-7xl mx-auto px-8 py-8 space-y-0.5">
                          <Label htmlFor="forgive">Perdoar juros e multa</Label>
                          <p className="text-sm text-muted-foreground">
                            Parcelar apenas o valor original das mensalidades
                          </p>
                        </div>
                        <Switch
                          id="forgive"
                          checked={forgiveInterest}
                          onCheckedChange={setForgiveInterest}
                        />
                      </div>

                      {/* Number of Installments */}
                      <div className="max-w-7xl mx-auto px-8 py-8 space-y-2">
                        <Label htmlFor="installments">
                          Número de Parcelas (máx: {settings?.maxInstallments || 6})
                        </Label>
                        <Input
                          id="installments"
                          type="number"
                          min="1"
                          max={settings?.maxInstallments || 6}
                          value={numInstallments}
                          onChange={(e) =>
                            setNumInstallments(parseInt(e.target.value) || 1)
                          }
                        />
                        {numInstallments > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {numInstallments}x de{" "}
                            {(Math.ceil(finalTotal / numInstallments) / 100).toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              }
                            )}
                          </p>
                        )}
                      </div>

                      {/* Minimum Value Warning */}
                      {numInstallments > 0 &&
                        Math.ceil(finalTotal / numInstallments) <
                          (settings?.minimumInstallmentValue || 5000) && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-900 dark:text-red-100">
                              ⚠️ Valor da parcela é menor que o mínimo permitido (R${" "}
                              {((settings?.minimumInstallmentValue || 5000) / 100).toFixed(2)})
                            </p>
                          </div>
                        )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setInstallmentModalOpen(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateInstallment} className="flex-1">
                          Criar Parcelamento
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Atrasado
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {(totalOverdueAmount / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {overduePayments.length} mensalidade(s) atrasada(s)
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                A Vencer (7 dias)
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {(totalDueSoonAmount / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {dueSoonPayments.length} mensalidade(s) a vencer
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inadimplentes
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Ban className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {defaultersList.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">aluno(s) com atraso</p>
            </CardContent>
          </Card>
        </div>

        {/* Mensalidades a Vencer */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mensalidades a Vencer (Próximos 7 Dias)</CardTitle>
                <CardDescription>
                  {dueSoonPayments.length} mensalidade(s) com vencimento próximo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {dueSoonPayments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma mensalidade com vencimento nos próximos 7 dias
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueSoonPayments.map((payment: any) => {
                    const daysRemaining = Math.ceil(
                      (new Date(payment.dueDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
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
                          {(payment.amountInCents / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              daysRemaining <= 3
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }
                          >
                            {daysRemaining} dia(s)
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Pesquisa de Inadimplentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Buscar Aluno</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, matrícula ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Dias de Atraso</Label>
                <Select value={daysOverdueFilter} onValueChange={setDaysOverdueFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="1-7">1-7 dias</SelectItem>
                    <SelectItem value="8-15">8-15 dias</SelectItem>
                    <SelectItem value="16-30">16-30 dias</SelectItem>
                    <SelectItem value="30+">Mais de 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSendReminders}
                  disabled={selectedStudents.length === 0}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Cobrança ({selectedStudents.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBlockStudents}
                  disabled={selectedStudents.length === 0}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Bloquear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defaulters Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Alunos Inadimplentes</CardTitle>
            <CardDescription>
              {filteredDefaulters.length} aluno(s) com mensalidades atrasadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedStudents.length === filteredDefaulters.length &&
                        filteredDefaulters.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensalidades Atrasadas</TableHead>
                  <TableHead>Valor Total Devido</TableHead>
                  <TableHead>Dias de Atraso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDefaulters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum inadimplente encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDefaulters.map((defaulter: any) => (
                    <TableRow key={defaulter.student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(defaulter.student.id)}
                          onCheckedChange={(checked) =>
                            handleSelectStudent(defaulter.student.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{defaulter.student.name || "N/A"}</span>
                          <span className="text-xs text-muted-foreground">
                            {defaulter.student.registrationNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{defaulter.student.cpf}</TableCell>
                      <TableCell>
                        {defaulter.student.membershipStatus === "blocked" ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <Ban className="w-3 h-3 mr-1" />
                            Bloqueado
                          </Badge>
                        ) : defaulter.student.membershipStatus === "active" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {defaulter.student.membershipStatus || "N/A"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{defaulter.payments.length}</span>
                          {defaulter.payments.some((p: any) => p.isInstallment) && (
                            <Badge variant="outline" className="text-xs">
                              <CreditCard className="w-3 h-3 mr-1" />
                              Parcelado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-red-600">
                        {(defaulter.totalOwed / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            defaulter.daysOverdue > 30
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : defaulter.daysOverdue > 15
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }
                        >
                          {defaulter.daysOverdue} dia(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSendIndividualReminder(
                                defaulter.student.id,
                                defaulter.student.name || defaulter.student.registrationNumber
                              )
                            }
                            title="Enviar cobrança"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenInstallment(defaulter)}
                            title="Parcelar débitos"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleBlockStudent(
                                defaulter.student.id,
                                defaulter.student.membershipStatus
                              )
                            }
                            title={
                              defaulter.student.membershipStatus === "blocked"
                                ? "Desbloquear aluno"
                                : "Bloquear aluno"
                            }
                          >
                            {defaulter.student.membershipStatus === "blocked" ? (
                              <Unlock className="w-4 h-4 text-green-600" />
                            ) : (
                              <Ban className="w-4 h-4 text-red-600" />
                            )}
                          </Button>
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
    </DashboardLayout>
  );
}
