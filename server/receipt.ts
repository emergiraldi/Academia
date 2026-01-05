/**
 * Receipt generation service
 * Generates PDF receipts for payments
 */

interface ReceiptData {
  paymentId: number;
  studentName: string;
  studentCpf: string;
  amount: number; // in cents
  paidAt: Date;
  paymentMethod: string;
  gymName: string;
  description?: string;
}

/**
 * Generate receipt PDF as HTML string
 * This HTML can be converted to PDF using a service like WeasyPrint or Puppeteer
 */
export function generateReceiptHTML(data: ReceiptData): string {
  const formattedAmount = (data.amount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const formattedDate = data.paidAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedTime = data.paidAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo de Pagamento #${data.paymentId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      background-color: #f5f5f5;
    }
    
    .receipt {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #3b82f6;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #666;
      font-size: 14px;
    }
    
    .receipt-number {
      text-align: center;
      background: #f0f9ff;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    
    .receipt-number strong {
      color: #3b82f6;
      font-size: 18px;
    }
    
    .info-section {
      margin-bottom: 25px;
    }
    
    .info-section h2 {
      color: #333;
      font-size: 16px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      color: #666;
      font-weight: 600;
    }
    
    .info-value {
      color: #333;
      text-align: right;
    }
    
    .amount-section {
      background: #f0f9ff;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }
    
    .amount-section .label {
      color: #666;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .amount-section .value {
      color: #3b82f6;
      font-size: 36px;
      font-weight: bold;
    }
    
    .status-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .footer p {
      margin: 5px 0;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .receipt {
        box-shadow: none;
        border: 1px solid #ddd;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${data.gymName}</h1>
      <p>Recibo de Pagamento</p>
    </div>
    
    <div class="receipt-number">
      <strong>Recibo Nº ${String(data.paymentId).padStart(6, '0')}</strong>
    </div>
    
    <div class="info-section">
      <h2>Dados do Pagador</h2>
      <div class="info-row">
        <span class="info-label">Nome:</span>
        <span class="info-value">${data.studentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">CPF:</span>
        <span class="info-value">${formatCpf(data.studentCpf)}</span>
      </div>
    </div>
    
    <div class="info-section">
      <h2>Dados do Pagamento</h2>
      <div class="info-row">
        <span class="info-label">Data:</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Hora:</span>
        <span class="info-value">${formattedTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Método:</span>
        <span class="info-value">${data.paymentMethod === 'pix' ? 'PIX' : data.paymentMethod}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Descrição:</span>
        <span class="info-value">${data.description || 'Mensalidade'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value"><span class="status-badge">PAGO</span></span>
      </div>
    </div>
    
    <div class="amount-section">
      <div class="label">Valor Pago</div>
      <div class="value">${formattedAmount}</div>
    </div>
    
    <div class="footer">
      <p>Este é um recibo eletrônico válido.</p>
      <p>Documento gerado em ${new Date().toLocaleString("pt-BR")}</p>
      <p>Em caso de dúvidas, entre em contato com a academia.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Format CPF with mask
 */
function formatCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Generate receipt URL (to be saved in S3)
 */
export function generateReceiptFilename(paymentId: number): string {
  const timestamp = Date.now();
  return `receipts/receipt-${paymentId}-${timestamp}.html`;
}

/**
 * Expense receipt data interface
 */
interface ExpenseReceiptData {
  expenseId: number;
  supplierName: string;
  supplierCnpj?: string;
  amount: number; // in cents
  paidAt: Date;
  paymentMethod: string;
  gymName: string;
  description: string;
  category?: string;
}

/**
 * Generate expense receipt HTML
 */
export function generateExpenseReceiptHTML(data: ExpenseReceiptData): string {
  const formattedAmount = (data.amount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const formattedDate = data.paidAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedTime = data.paidAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprovante de Pagamento #${data.expenseId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      background-color: #f5f5f5;
    }

    .receipt {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #f59e0b;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #f59e0b;
      font-size: 28px;
      margin-bottom: 10px;
    }

    .header p {
      color: #666;
      font-size: 14px;
    }

    .receipt-number {
      text-align: center;
      background: #fffbeb;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 30px;
    }

    .receipt-number strong {
      color: #f59e0b;
      font-size: 18px;
    }

    .info-section {
      margin-bottom: 25px;
    }

    .info-section h2 {
      color: #333;
      font-size: 16px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #666;
      font-weight: 600;
    }

    .info-value {
      color: #333;
      text-align: right;
    }

    .amount-section {
      background: #fffbeb;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }

    .amount-section .label {
      color: #666;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .amount-section .value {
      color: #f59e0b;
      font-size: 36px;
      font-weight: bold;
    }

    .status-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }

    .footer p {
      margin: 5px 0;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .receipt {
        box-shadow: none;
        border: 1px solid #ddd;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${data.gymName}</h1>
      <p>Comprovante de Pagamento de Despesa</p>
    </div>

    <div class="receipt-number">
      <strong>Comprovante Nº ${String(data.expenseId).padStart(6, '0')}</strong>
    </div>

    <div class="info-section">
      <h2>Dados do Fornecedor</h2>
      <div class="info-row">
        <span class="info-label">Nome/Razão Social:</span>
        <span class="info-value">${data.supplierName}</span>
      </div>
      ${data.supplierCnpj ? `
      <div class="info-row">
        <span class="info-label">CNPJ:</span>
        <span class="info-value">${formatCnpj(data.supplierCnpj)}</span>
      </div>
      ` : ''}
    </div>

    <div class="info-section">
      <h2>Dados do Pagamento</h2>
      <div class="info-row">
        <span class="info-label">Data:</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Hora:</span>
        <span class="info-value">${formattedTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Método:</span>
        <span class="info-value">${data.paymentMethod === 'pix' ? 'PIX' : data.paymentMethod}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Descrição:</span>
        <span class="info-value">${data.description}</span>
      </div>
      ${data.category ? `
      <div class="info-row">
        <span class="info-label">Categoria:</span>
        <span class="info-value">${data.category}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value"><span class="status-badge">PAGO</span></span>
      </div>
    </div>

    <div class="amount-section">
      <div class="label">Valor Pago</div>
      <div class="value">${formattedAmount}</div>
    </div>

    <div class="footer">
      <p>Este é um comprovante eletrônico válido.</p>
      <p>Documento gerado em ${new Date().toLocaleString("pt-BR")}</p>
      <p>Em caso de dúvidas, entre em contato com a administração.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Format CNPJ with mask
 */
function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
