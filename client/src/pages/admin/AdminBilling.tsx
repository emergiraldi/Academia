import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Download,
  CreditCard,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import QRCode from "qrcode";

export default function AdminBilling() {
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixQrCodeImage, setPixQrCodeImage] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);

  // Query to get billing cycles
  const { data: billingCycles = [], refetch } = trpc.gymBillingCycles.list.useQuery();

  // Mutation to generate PIX payment
  const generatePixMutation = trpc.gymBillingCycles.generatePixPayment.useMutation({
    onSuccess: async (data) => {
      // Generate QR Code image from PIX string
      const qrCodeDataUrl = await QRCode.toDataURL(data.pixQrCode, {
        width: 300,
        margin: 1,
      });

      setPixQrCode(data.pixQrCode);
      setPixQrCodeImage(qrCodeDataUrl);
      setPixModalOpen(true);
      toast.success("QR Code PIX gerado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao gerar PIX: ${error.message}`);
    },
  });

  const handleGeneratePix = (cycle: any) => {
    setSelectedCycle(cycle);
    generatePixMutation.mutate({ billingCycleId: cycle.id });
  };

  const copyPixCode = () => {
    if (pixQrCode) {
      navigator.clipboard.writeText(pixQrCode);
      toast.success("Código PIX copiado!");
    }
  };

  const downloadQrCode = () => {
    if (pixQrCodeImage) {
      const link = document.createElement("a");
      link.download = `pix-mensalidade-${selectedCycle?.referenceMonth}.png`;
      link.href = pixQrCodeImage;
      link.click();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "overdue":
        return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" />Vencido</Badge>;
      case "canceled":
        return <Badge className="bg-gray-500">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatMonth = (referenceMonth: string) => {
    const [year, month] = referenceMonth.split("-");
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  // Calculate totals
  const totalPending = billingCycles
    .filter((c) => c.status === "pending" || c.status === "overdue")
    .reduce((sum, c) => sum + c.amountCents, 0);

  const totalPaid = billingCycles
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amountCents, 0);

  const overdueCount = billingCycles.filter((c) => c.status === "overdue").length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mensalidades</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as mensalidades recorrentes da sua academia
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor a pagar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagamentos realizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Mensalidades atrasadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Billing Cycles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Mensalidades</CardTitle>
            <CardDescription>
              Lista de todas as mensalidades geradas para sua academia
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billingCycles.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma mensalidade encontrada
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês de Referência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingCycles.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        {formatMonth(cycle.referenceMonth)}
                      </TableCell>
                      <TableCell>
                        {formatDate(cycle.dueDate)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(cycle.amountCents)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cycle.status)}
                      </TableCell>
                      <TableCell>
                        {cycle.paidAt ? formatDate(cycle.paidAt) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {cycle.status === "pending" || cycle.status === "overdue" ? (
                          <Button
                            size="sm"
                            onClick={() => handleGeneratePix(cycle)}
                            disabled={generatePixMutation.isPending}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Gerar PIX
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* PIX QR Code Modal */}
        <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pagamento PIX</DialogTitle>
              <DialogDescription>
                Escaneie o QR Code ou copie o código PIX para realizar o pagamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* QR Code Image */}
              {pixQrCodeImage && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img
                    src={pixQrCodeImage}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>
              )}

              {/* Cycle Info */}
              {selectedCycle && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referência:</span>
                    <span className="font-medium">{formatMonth(selectedCycle.referenceMonth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-bold text-lg">{formatCurrency(selectedCycle.amountCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencimento:</span>
                    <span className="font-medium">{formatDate(selectedCycle.dueDate)}</span>
                  </div>
                </div>
              )}

              {/* PIX Code */}
              {pixQrCode && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código PIX Copia e Cola</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pixQrCode}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                    />
                    <Button size="sm" variant="outline" onClick={copyPixCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={downloadQrCode}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar QR Code
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setPixModalOpen(false)}
                >
                  Fechar
                </Button>
              </div>

              {/* Alert */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Pagamento identificado automaticamente</p>
                  <p className="text-blue-700 mt-1">
                    Após o pagamento, sua mensalidade será confirmada automaticamente e sua academia será desbloqueada.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
