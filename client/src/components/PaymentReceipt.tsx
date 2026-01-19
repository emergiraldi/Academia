import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, CheckCircle } from "lucide-react";

interface PaymentReceiptProps {
  payment: {
    id: number;
    amountInCents: number;
    originalAmountInCents?: number;
    lateFeeInCents?: number;
    interestInCents?: number;
    totalAmountInCents?: number;
    daysOverdue?: number;
    dueDate: string;
    paidAt?: string;
    paymentMethod: string;
    status: string;
  };
  student: {
    name: string;
    email: string;
    cpf?: string;
  };
  gym: {
    name: string;
    cnpj?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export default function PaymentReceipt({ payment, student, gym }: PaymentReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger print dialog with save as PDF option
    window.print();
  };

  const originalAmount = payment.originalAmountInCents || payment.amountInCents;
  const lateFee = payment.lateFeeInCents || 0;
  const interest = payment.interestInCents || 0;
  const total = payment.totalAmountInCents || payment.amountInCents;
  const hasLateFees = lateFee > 0 || interest > 0;

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      pix: "PIX",
      cash: "Dinheiro",
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      bank_transfer: "Transferência Bancária",
    };
    return methods[method] || method;
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="flex-1">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
        <Button onClick={handleDownload} variant="outline" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Salvar PDF
        </Button>
      </div>

      {/* Receipt Content */}
      <Card ref={receiptRef} className="print:shadow-none print:border-none">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">{gym.name}</h1>
            {gym.cnpj && (
              <p className="text-sm text-muted-foreground">CNPJ: {gym.cnpj}</p>
            )}
            {gym.address && (
              <p className="text-sm text-muted-foreground">{gym.address}</p>
            )}
            {gym.phone && gym.email && (
              <p className="text-sm text-muted-foreground">
                {gym.phone} • {gym.email}
              </p>
            )}
          </div>

          {/* Receipt Title */}
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-6 py-3 rounded-full">
              <CheckCircle className="w-5 h-5" />
              <span className="text-lg font-semibold">COMPROVANTE DE PAGAMENTO</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Recibo Nº {payment.id.toString().padStart(6, "0")}
            </p>
          </div>

          {/* Student Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
              DADOS DO ALUNO
            </h3>
            <div className="space-y-1">
              <p className="font-medium">{student.name}</p>
              {student.email && (
                <p className="text-sm text-muted-foreground">{student.email}</p>
              )}
              {student.cpf && (
                <p className="text-sm text-muted-foreground">CPF: {student.cpf}</p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">
              DETALHAMENTO DO PAGAMENTO
            </h3>

            <div className="space-y-3">
              {/* Original Amount */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mensalidade</span>
                <span className="font-medium">{formatCurrency(originalAmount)}</span>
              </div>

              {/* Late Fee */}
              {hasLateFees && lateFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Multa por atraso (2%)</span>
                  <span className="font-medium text-red-600">
                    + {formatCurrency(lateFee)}
                  </span>
                </div>
              )}

              {/* Interest */}
              {hasLateFees && interest > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">
                    Juros ({payment.daysOverdue} dia{payment.daysOverdue !== 1 ? "s" : ""})
                  </span>
                  <span className="font-medium text-red-600">
                    + {formatCurrency(interest)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">TOTAL PAGO</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">FORMA DE PAGAMENTO</p>
              <p className="font-medium">{getPaymentMethodLabel(payment.paymentMethod)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">DATA DE VENCIMENTO</p>
              <p className="font-medium">
                {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {payment.paidAt && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">DATA DO PAGAMENTO</p>
                <p className="font-medium">{formatDate(payment.paidAt)}</p>
              </div>
            )}
          </div>

          {/* Late Fee Notice */}
          {hasLateFees && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-900 dark:text-yellow-200">
                <strong>Atenção:</strong> Este pagamento inclui acréscimos por atraso de{" "}
                {payment.daysOverdue} dia{payment.daysOverdue !== 1 ? "s" : ""}:
                <br />
                • Multa: {formatCurrency(lateFee)}
                <br />
                • Juros: {formatCurrency(interest)}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-6 border-t text-xs text-muted-foreground space-y-1">
            <p>Este é um comprovante válido de pagamento.</p>
            <p>Emitido em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
            <p className="text-xs mt-4">
              Sistema de Gestão SysFit Pro • www.sysfitpro.com.br
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
