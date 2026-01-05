import { ENV } from "./_core/env";
import axios from "axios";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Manus built-in email service
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Use Manus built-in notification API to send emails
    // This is a placeholder - in production, integrate with actual email service
    console.log(`[Email] Sending email to ${options.to}: ${options.subject}`);
    
    // For now, we'll use console.log
    // In production, integrate with SendGrid, AWS SES, or similar
    console.log(`[Email] Content: ${options.html}`);
    
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/**
 * Send password reset code email
 */
export async function sendPasswordResetEmail(email: string, code: string, name: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .code { font-size: 32px; font-weight: bold; color: #3b82f6; text-align: center; padding: 20px; background-color: white; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recuperação de Senha</h1>
        </div>
        <div class="content">
          <p>Olá ${name},</p>
          <p>Você solicitou a recuperação de senha da sua conta na academia.</p>
          <p>Use o código abaixo para redefinir sua senha:</p>
          <div class="code">${code}</div>
          <p>Este código é válido por 15 minutos.</p>
          <p>Se você não solicitou esta recuperação, ignore este email.</p>
        </div>
        <div class="footer">
          <p>© 2025 Sistema de Academia. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Código de Recuperação de Senha",
    html,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  amount: number,
  dueDate: Date
): Promise<boolean> {
  const formattedAmount = (amount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const formattedDate = dueDate.toLocaleDateString("pt-BR");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .amount { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Pagamento Confirmado</h1>
        </div>
        <div class="content">
          <p>Olá ${name},</p>
          <p>Seu pagamento foi confirmado com sucesso!</p>
          <div class="amount">${formattedAmount}</div>
          <p><strong>Data de vencimento:</strong> ${formattedDate}</p>
          <p>Seu acesso à academia foi liberado automaticamente.</p>
          <p>Obrigado por manter sua mensalidade em dia!</p>
        </div>
        <div class="footer">
          <p>© 2025 Sistema de Academia. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Pagamento Confirmado - Academia",
    html,
  });
}

/**
 * Send payment due reminder email
 */
export async function sendPaymentDueReminderEmail(
  email: string,
  name: string,
  amount: number,
  dueDate: Date
): Promise<boolean> {
  const formattedAmount = (amount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const formattedDate = dueDate.toLocaleDateString("pt-BR");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .amount { font-size: 24px; font-weight: bold; color: #f59e0b; text-align: center; padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Mensalidade Próxima do Vencimento</h1>
        </div>
        <div class="content">
          <p>Olá ${name},</p>
          <p>Sua mensalidade está próxima do vencimento.</p>
          <div class="amount">${formattedAmount}</div>
          <p><strong>Data de vencimento:</strong> ${formattedDate}</p>
          <p>Para manter seu acesso ativo, realize o pagamento até a data de vencimento.</p>
          <p>Você pode pagar via PIX através do app da academia.</p>
        </div>
        <div class="footer">
          <p>© 2025 Sistema de Academia. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Lembrete: Mensalidade Próxima do Vencimento",
    html,
  });
}

/**
 * Send medical exam expiry reminder email
 */
export async function sendMedicalExamExpiryReminderEmail(
  email: string,
  name: string,
  expiryDate: Date
): Promise<boolean> {
  const formattedDate = expiryDate.toLocaleDateString("pt-BR");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .date { font-size: 20px; font-weight: bold; color: #ef4444; text-align: center; padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Exame Médico Próximo do Vencimento</h1>
        </div>
        <div class="content">
          <p>Olá ${name},</p>
          <p>Seu exame médico está próximo do vencimento.</p>
          <div class="date">Vencimento: ${formattedDate}</div>
          <p>Para continuar frequentando a academia, você precisa renovar seu exame médico.</p>
          <p>Agende sua consulta o quanto antes para evitar bloqueio de acesso.</p>
        </div>
        <div class="footer">
          <p>© 2025 Sistema de Academia. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Lembrete: Exame Médico Próximo do Vencimento",
    html,
  });
}

/**
 * Send new workout notification email
 */
export async function sendNewWorkoutEmail(
  email: string,
  name: string,
  workoutName: string,
  professorName: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .workout { font-size: 20px; font-weight: bold; color: #8b5cf6; text-align: center; padding: 20px; background-color: white; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💪 Novo Treino Disponível</h1>
        </div>
        <div class="content">
          <p>Olá ${name},</p>
          <p>Um novo treino personalizado foi criado para você!</p>
          <div class="workout">${workoutName}</div>
          <p><strong>Professor:</strong> ${professorName}</p>
          <p>Acesse o app da academia para visualizar os exercícios e começar seu treino.</p>
          <p>Bons treinos!</p>
        </div>
        <div class="footer">
          <p>© 2025 Sistema de Academia. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Novo Treino Disponível - Academia",
    html,
  });
}
