import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  QrCode,
  Copy,
  CreditCard,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function StudentPayments() {
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [pixData, setPixData] = useState<any>(null);

  // Queries
  const { data: payments = [], refetch } = trpc.payments.myPayments.useQuery();

  // Mutations
  const generatePixMutation = trpc.payments.generatePixQrCode.useMutation({
    onSuccess: (data) => {
      setPixData(data);
      toast.success("QR Code PIX gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar QR Code PIX");
    },
  });

  const handleGeneratePix = async (payment: any) => {
    setSelectedPayment(payment);
    setPixModalOpen(true);

    await generatePixMutation.mutateAsync({
      paymentId: payment.id,
    });
  };

  const handleCopyPix = () => {
    if (pixData?.pixCopiaECola) {
      navigator.clipboard.writeText(pixData.pixCopiaECola);
      toast.success("Código PIX copiado!");
    }
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

    const isOverdue = new Date(dueDate) < new Date();
    if (isOverdue) {
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

  const totalPending = payments
    .filter((p: any) => p.status === "pending")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const totalPaid = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + p.amountInCents, 0);

  const pendingCount = payments.filter((p: any) => p.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Minhas Mensalidades</h1>
          <p className="text-muted-foreground">
            Acompanhe seus pagamentos e gere PIX para quitar mensalidades
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
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
                {pendingCount} mensalidade(s)
              </p>
            </CardContent>
          </Card>

          <Card>
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
                {payments.filter((p: any) => p.status === "paid").length} mensalidade(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Pagamentos
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {payments.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Mensalidades registradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Mensalidades</CardTitle>
            <CardDescription>
              {payments.length} mensalidade(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma mensalidade encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {(payment.amountInCents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status, payment.dueDate)}</TableCell>
                      <TableCell>
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {payment.status === "pending" && (
                          <Button
                            onClick={() => handleGeneratePix(payment)}
                            size="sm"
                            className="bg-gradient-to-r from-teal-500 to-cyan-600"
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            Pagar com PIX
                          </Button>
                        )}
                        {payment.status === "paid" && (
                          <span className="text-sm text-muted-foreground">
                            {payment.paymentMethod === "pix" && "PIX"}
                            {payment.paymentMethod === "cash" && "Dinheiro"}
                            {payment.paymentMethod === "credit_card" && "Cartão de Crédito"}
                            {payment.paymentMethod === "debit_card" && "Cartão de Débito"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* PIX Modal */}
        <Dialog open={pixModalOpen} onOpenChange={(open) => {
          setPixModalOpen(open);
          if (!open) {
            setPixData(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pagar com PIX</DialogTitle>
              <DialogDescription>
                Escaneie o QR Code ou copie o código PIX
              </DialogDescription>
            </DialogHeader>

            {generatePixMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Gerando QR Code...</p>
              </div>
            )}

            {pixData && selectedPayment && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-3xl font-bold text-primary">
                    {(selectedPayment.amountInCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    <img
                      src={`data:image/png;base64,${pixData.qrcodeBase64}`}
                      alt="QR Code PIX"
                      className="w-64 h-64"
                    />
                  </div>
                </div>

                {/* Pix Code */}
                <div>
                  <p className="text-sm font-medium mb-2">Código PIX Copia e Cola:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pixData.pixCopiaECola}
                      readOnly
                      className="flex-1 p-2 text-xs border rounded bg-muted font-mono"
                    />
                    <Button onClick={handleCopyPix} size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Atenção:</strong> O QR Code expira em 1 hora. Após o pagamento, aguarde alguns minutos para a confirmação automática.
                  </p>
                </div>

                <Button onClick={() => {
                  setPixModalOpen(false);
                  refetch();
                }} variant="outline" className="w-full">
                  Fechar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
