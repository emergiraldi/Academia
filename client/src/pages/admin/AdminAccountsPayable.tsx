import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  Download,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Building2,
  DollarSign,
  FileText,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { useGym } from "@/_core/hooks/useGym";

type ExpenseCategory =
  | "rent"
  | "utilities"
  | "equipment"
  | "maintenance"
  | "salaries"
  | "supplies"
  | "marketing"
  | "insurance"
  | "taxes"
  | "other";

type ExpenseStatus = "pending" | "paid" | "overdue" | "cancelled";

export default function AdminAccountsPayable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState<string>("");

  const { gymSlug } = useGym();

  // tRPC queries
  const { data: expenses = [], refetch } = trpc.expenses.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });

  const { data: suppliers = [] } = trpc.suppliers.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: categories = [] } = trpc.categories.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: costCenters = [] } = trpc.costCenters.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });
  const { data: paymentMethods = [] } = trpc.paymentMethods.list.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug });

  // tRPC mutations
  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Despesa cadastrada com sucesso!");
      refetch();
      setAddModalOpen(false);
      setFormData({
        description: "",
        supplierId: "",
        categoryId: "",
        costCenterId: "",
        amount: "",
        dueDate: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar despesa: ${error.message}`);
    },
  });

  const markAsPaid = trpc.expenses.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      refetch();
      setPaymentModalOpen(false);
      setSelectedExpense(null);
      setSelectedPaymentMethod("");
    },
    onError: (error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });

  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Despesa excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir despesa: ${error.message}`);
    },
  });

  const generateExpenseReceiptMutation = trpc.expenses.generateReceipt.useMutation({
    onSuccess: (data) => {
      setReceiptHtml(data.html);
      setReceiptModalOpen(true);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar recibo");
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    description: "",
    supplierId: "",
    categoryId: "",
    costCenterId: "",
    amount: "",
    dueDate: "",
    notes: "",
  });

  const categoryLabels: Record<ExpenseCategory, string> = {
    rent: "Aluguel",
    utilities: "Contas (Água/Luz/Internet)",
    equipment: "Equipamentos",
    maintenance: "Manutenção",
    salaries: "Salários",
    supplies: "Material de Consumo",
    marketing: "Marketing",
    insurance: "Seguros",
    taxes: "Impostos",
    other: "Outros",
  };

  // Filter expenses
  const filteredExpenses = expenses.filter((expense: any) => {
    const matchesSearch =
      searchTerm === "" ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.categoryId?.toString() === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals
  const totalPaid = expenses
    .filter((e: any) => e.status === "paid")
    .reduce((sum: number, e: any) => sum + (e.amountInCents || 0), 0);

  const totalPending = expenses
    .filter((e: any) => e.status === "pending")
    .reduce((sum: number, e: any) => sum + (e.amountInCents || 0), 0);

  const totalOverdue = expenses
    .filter((e: any) => e.status === "overdue")
    .reduce((sum: number, e: any) => sum + (e.amountInCents || 0), 0);

  const handleAddExpense = () => {
    if (!formData.description || !formData.supplierId || !formData.amount || !formData.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createExpense.mutate({
      description: formData.description,
      supplierId: parseInt(formData.supplierId),
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
      costCenterId: formData.costCenterId ? parseInt(formData.costCenterId) : undefined,
      amountInCents: Math.round(parseFloat(formData.amount) * 100),
      dueDate: formData.dueDate,
      notes: formData.notes || undefined,
    });
  };

  const handleMarkAsPaid = () => {
    if (!selectedExpense || !selectedPaymentMethod) {
      toast.error("Selecione a forma de pagamento");
      return;
    }

    markAsPaid.mutate({
      id: selectedExpense,
      paymentMethodId: parseInt(selectedPaymentMethod),
    });
  };

  const handleViewReceipt = (expense: any) => {
    generateExpenseReceiptMutation.mutate({ expenseId: expense.id });
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleDownloadReceipt = () => {
    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recibo-despesa-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    const badges = {
      paid: (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      ),
      pending: (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pendente
        </Badge>
      ),
      overdue: (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Atrasado
        </Badge>
      ),
      cancelled: (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          Cancelado
        </Badge>
      ),
    };
    return badges[status];
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <PageHeader
          title="Contas a Pagar"
          description="Gestão completa de despesas e fornecedores"
          action={
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Despesa</DialogTitle>
                <DialogDescription>
                  Registre uma nova conta a pagar no sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Aluguel - Janeiro 2024"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Fornecedor/Credor *</Label>
                    <Select
                      value={formData.supplierId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, supplierId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.filter((s: any) => s.active).map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, categoryId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c: any) => c.type === "expense" && c.active)
                          .map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="costCenter">Centro de Custo</Label>
                    <Select
                      value={formData.costCenterId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, costCenterId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.filter((cc: any) => cc.active).map((costCenter: any) => (
                          <SelectItem key={costCenter.id} value={costCenter.id.toString()}>
                            {costCenter.code} - {costCenter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Valor (R$) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="1500.00"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Vencimento *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais sobre esta despesa..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <Button onClick={handleAddExpense} className="w-full" disabled={createExpense.isPending}>
                  {createExpense.isPending ? "Cadastrando..." : "Cadastrar Despesa"}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          }
        />

        {/* Payment Modal */}
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                Selecione a forma de pagamento utilizada
              </DialogDescription>
            </DialogHeader>
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-4 py-4">
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method: any) => (
                      <SelectItem key={method.id} value={method.id.toString()}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleMarkAsPaid} className="w-full" disabled={markAsPaid.isPending}>
                {markAsPaid.isPending ? "Registrando..." : "Confirmar Pagamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pago
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {(totalPaid / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {expenses.filter((e: any) => e.status === "paid").length} despesas pagas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                A Pagar
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
                {expenses.filter((e: any) => e.status === "pending").length} despesas pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Atrasadas
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
                {expenses.filter((e: any) => e.status === "overdue").length} despesas atrasadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Descrição ou fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories
                      .filter((c: any) => c.type === "expense")
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Todas as Despesas</CardTitle>
            <CardDescription>
              {filteredExpenses.length} despesa(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense: any) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {expense.supplierName || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.categoryName ? (
                          <Badge
                            variant="outline"
                            style={{ borderColor: expense.categoryColor, color: expense.categoryColor }}
                          >
                            {expense.categoryName}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sem categoria</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {((expense.amountInCents || 0) / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>
                        {new Date(expense.dueDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {expense.paymentDate
                          ? new Date(expense.paymentDate).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {(expense.status === "pending" || expense.status === "overdue") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedExpense(expense.id);
                                setPaymentModalOpen(true);
                              }}
                              title="Registrar Pagamento"
                            >
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {expense.status === "paid" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceipt(expense)}
                              title="Ver Recibo"
                            >
                              <FileText className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Deseja excluir esta despesa?")) {
                                deleteExpense.mutate({ id: expense.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
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

        {/* Receipt Modal */}
        <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Recibo de Pagamento</DialogTitle>
              <DialogDescription>
                Visualize, imprima ou faça download do recibo
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto border rounded-lg">
              {receiptHtml && (
                <iframe
                  srcDoc={receiptHtml}
                  className="w-full h-[600px] border-0"
                  title="Receipt Preview"
                />
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handlePrintReceipt} className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleDownloadReceipt} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Baixar HTML
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
