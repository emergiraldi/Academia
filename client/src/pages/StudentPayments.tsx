import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  Filter,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  Copy,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StudentPaymentsProps {
  onBack: () => void;
}

export default function StudentPayments({ onBack }: StudentPaymentsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [pixConfirmed, setPixConfirmed] = useState(false);

  // Busca pagamentos do aluno
  const { data: payments = [], isLoading, refetch } = trpc.payments.myPayments.useQuery();

  // Mutations
  const generatePixMutation = trpc.payments.generatePixQrCode.useMutation();
  const checkPaymentMutation = trpc.payments.checkPaymentStatus.useMutation();

  // Calcula resumo
  const summary = {
    total: payments.length,
    pending: payments.filter(p => p.status === "pending").length,
    paid: payments.filter(p => p.status === "paid").length,
    overdue: payments.filter(p => {
      if (p.status === "paid") return false;
      return new Date(p.dueDate) < new Date();
    }).length,
    totalPending: payments
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + (p.amountInCents / 100), 0),
    totalOverdue: payments
      .filter(p => {
        if (p.status === "paid") return false;
        return new Date(p.dueDate) < new Date();
      })
      .reduce((sum, p) => sum + (p.amountInCents / 100), 0),
  };

  // Filtra pagamentos
  const filteredPayments = payments.filter(payment => {
    if (statusFilter === "all") return true;
    if (statusFilter === "paid") return payment.status === "paid";
    if (statusFilter === "pending") return payment.status === "pending" && new Date(payment.dueDate) >= new Date();
    if (statusFilter === "overdue") return payment.status === "pending" && new Date(payment.dueDate) < new Date();
    return true;
  });

  const pendingPayments = filteredPayments.filter(p =>
    p.status === "pending" && new Date(p.dueDate) >= new Date()
  );

  const overduePayments = filteredPayments.filter(p =>
    p.status === "pending" && new Date(p.dueDate) < new Date()
  );

  const paidPayments = filteredPayments.filter(p => p.status === "paid");

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusColor = (payment: any) => {
    if (payment.status === "paid") return "text-green-600";
    if (new Date(payment.dueDate) < new Date()) return "text-red-600";
    return "text-orange-600";
  };

  const getStatusBg = (payment: any) => {
    if (payment.status === "paid") return "bg-green-50 border-green-200";
    if (new Date(payment.dueDate) < new Date()) return "bg-red-50 border-red-200";
    return "bg-orange-50 border-orange-200";
  };

  const getStatusLabel = (payment: any) => {
    if (payment.status === "paid") return "PAGO";
    if (new Date(payment.dueDate) < new Date()) return "VENCIDO";
    return "PENDENTE";
  };

  const getStatusIcon = (payment: any) => {
    if (payment.status === "paid") return <CheckCircle className="w-4 h-4" />;
    if (new Date(payment.dueDate) < new Date()) return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getDaysOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handlePayment = async (payment: any) => {
    try {
      console.log("Gerando PIX para pagamento:", payment);
      setSelectedPayment(payment);
      const result = await generatePixMutation.mutateAsync({
        paymentId: payment.id,
      });

      console.log("PIX gerado com sucesso:", result);
      setPixData(result);
      setShowPixModal(true);
      setPixConfirmed(false);
    } catch (error: any) {
      console.error("Erro ao gerar PIX:", error);
      toast.error(error.message || "Erro ao gerar PIX");
    }
  };

  const copyPixCode = async () => {
    if (pixData?.pixCopiaECola) {
      try {
        await navigator.clipboard.writeText(pixData.pixCopiaECola);
        toast.success("Código PIX copiado!");
      } catch (err) {
        toast.error("Erro ao copiar código");
      }
    }
  };

  const closePixModal = () => {
    setShowPixModal(false);
    setPixData(null);
    setSelectedPayment(null);
    setPixConfirmed(false);
    refetch(); // Atualiza lista de pagamentos
  };

  // Verificação automática do status PIX
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showPixModal && pixData?.txid && !pixConfirmed) {
      const checkStatus = async () => {
        try {
          const result = await checkPaymentMutation.mutateAsync({
            paymentId: selectedPayment.id,
          });

          if (result.status === "paid") {
            setPixConfirmed(true);
            toast.success("Pagamento confirmado!");

            // Fecha modal após 3 segundos
            setTimeout(() => {
              closePixModal();
            }, 3000);
          }
        } catch (err) {
          console.error("Erro ao verificar status:", err);
        }
      };

      // Verifica imediatamente
      checkStatus();

      // Depois verifica a cada 5 segundos
      interval = setInterval(checkStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showPixModal, pixData, pixConfirmed, selectedPayment]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Mensalidades
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Filtros"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 transition"
              title="Atualizar"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Filtrar por status:
              </h3>
              <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-2 sm:gap-0">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    statusFilter === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    statusFilter === "pending"
                      ? "bg-orange-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setStatusFilter("overdue")}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    statusFilter === "overdue"
                      ? "bg-red-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Vencidas
                </button>
                <button
                  onClick={() => setStatusFilter("paid")}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    statusFilter === "paid"
                      ? "bg-green-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Pagas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Carregando mensalidades...</span>
          </div>
        )}

        {/* Resumo */}
        {!isLoading && payments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Pendente */}
            {summary.totalPending > 0 && (
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs opacity-80">Total Pendente</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(summary.totalPending)}
                      </p>
                    </div>
                    <DollarSign className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-xs opacity-80">
                    {summary.pending} mensalidade(s)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Total Vencido */}
            {summary.totalOverdue > 0 && (
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs opacity-80">Total Vencido</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(summary.totalOverdue)}
                      </p>
                    </div>
                    <AlertCircle className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-xs opacity-80">
                    {summary.overdue} mensalidade(s)
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Mensalidades Vencidas */}
        {!isLoading && overduePayments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Mensalidades Vencidas {overduePayments.length > 3 && `(${overduePayments.length})`}
            </h2>
            <div className="space-y-3">
              {overduePayments.slice(0, 3).map((payment) => (
                <Card
                  key={payment.id}
                  className={`border-2 ${getStatusBg(payment)} shadow-md hover:shadow-lg transition`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(payment)}
                          <span className={`text-xs font-semibold ${getStatusColor(payment)}`}>
                            {getStatusLabel(payment)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Vencimento: {formatDate(payment.dueDate)}
                        </p>
                        {payment.status !== "paid" && new Date(payment.dueDate) < new Date() && (
                          <p className="text-xs text-red-600 font-semibold mt-1">
                            {getDaysOverdue(payment.dueDate)} dia(s) de atraso
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">
                          {formatCurrency(payment.amountInCents / 100)}
                        </p>
                      </div>
                    </div>
                    {payment.status !== "paid" && (
                      <Button
                        onClick={() => handlePayment(payment)}
                        className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagar com PIX
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {overduePayments.length > 3 && (
              <p className="text-sm text-gray-600 text-center mt-3">
                + {overduePayments.length - 3} mensalidade(s) vencida(s) não exibida(s)
              </p>
            )}
          </div>
        )}

        {/* Mensalidades Pendentes */}
        {!isLoading && pendingPayments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Mensalidades Pendentes {pendingPayments.length > 3 && `(${pendingPayments.length})`}
            </h2>
            <div className="space-y-3">
              {pendingPayments.slice(0, 3).map((payment) => (
                <Card
                  key={payment.id}
                  className={`border-2 ${getStatusBg(payment)} shadow-md hover:shadow-lg transition`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(payment)}
                          <span className={`text-xs font-semibold ${getStatusColor(payment)}`}>
                            {getStatusLabel(payment)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Vencimento: {formatDate(payment.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">
                          {formatCurrency(payment.amountInCents / 100)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handlePayment(payment)}
                      className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar com PIX
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {pendingPayments.length > 3 && (
              <p className="text-sm text-gray-600 text-center mt-3">
                + {pendingPayments.length - 3} mensalidade(s) pendente(s) não exibida(s)
              </p>
            )}
          </div>
        )}

        {/* Mensalidades Pagas */}
        {!isLoading && paidPayments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Mensalidades Pagas
            </h2>
            <div className="space-y-3">
              {paidPayments.slice(0, 5).map((payment) => (
                <Card
                  key={payment.id}
                  className={`border-2 ${getStatusBg(payment)} shadow-md`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(payment)}
                          <span className={`text-xs font-semibold ${getStatusColor(payment)}`}>
                            {getStatusLabel(payment)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Pago em: {formatDate(payment.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">
                          {formatCurrency(payment.amountInCents / 100)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && payments.length === 0 && (
          <Card className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Nenhuma mensalidade encontrada
            </h3>
            <p className="text-gray-600">
              Você está em dia com seus pagamentos!
            </p>
          </Card>
        )}

        {/* Filtered Empty State */}
        {!isLoading && payments.length > 0 && filteredPayments.length === 0 && (
          <Card className="text-center p-8">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Nenhuma mensalidade encontrada
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros de pesquisa
            </p>
          </Card>
        )}
      </div>

      {/* Modal de Pagamento PIX */}
      <Dialog open={showPixModal} onOpenChange={closePixModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Pagamento via PIX</span>
              <button
                onClick={closePixModal}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {generatePixMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-600">Gerando código PIX...</p>
              </div>
            ) : pixConfirmed ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Pagamento Confirmado!
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  Seu pagamento foi processado com sucesso.
                </p>
              </div>
            ) : pixData ? (
              <>
                {/* Informações do Pagamento */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Valor a pagar:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency((selectedPayment?.amountInCents || 0) / 100)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Vencimento:</span>
                    <span>{selectedPayment ? formatDate(selectedPayment.dueDate) : "-"}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center py-4">
                  <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200 mb-4">
                    <QRCodeSVG
                      value={pixData.pixCopiaECola || ""}
                      size={192}
                      level="M"
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 mb-4">
                    Escaneie o QR Code acima com o app do seu banco
                  </p>

                  {/* Botão Copiar Código */}
                  <Button
                    onClick={copyPixCode}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar código PIX
                  </Button>

                  {/* Instruções */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-700 font-medium mb-2">
                      Como pagar:
                    </p>
                    <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                      <li>Abra o app do seu banco</li>
                      <li>Escolha a opção PIX</li>
                      <li>Escaneie o QR Code ou cole o código copiado</li>
                      <li>Confirme o pagamento</li>
                    </ol>
                  </div>

                  {/* Status de Verificação */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Aguardando confirmação do pagamento...</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
