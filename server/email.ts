/**
 * Serviço de envio de e-mails via SMTP com Nodemailer
 * Usado para recuperação de senha e notificações
 */

import * as nodemailer from 'nodemailer';
import * as db from './db';

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpUseTls: boolean;
  smtpUseSsl: boolean;
}

export class EmailService {
  private config: EmailConfig | null = null;

  /**
   * Carrega configurações SMTP do banco de dados para uma academia
   */
  async loadConfig(gymId: number): Promise<boolean> {
    try {
      const settings = await db.getGymSettings(gymId);

      if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
        console.log(`[Email] ⚠️  Configurações SMTP não encontradas para gymId ${gymId}`);
        return false;
      }

      this.config = {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser,
        smtpPassword: settings.smtpPassword,
        smtpFromEmail: settings.smtpFromEmail || settings.smtpUser,
        smtpFromName: settings.smtpFromName || 'Academia',
        smtpUseTls: settings.smtpUseTls ?? true,
        smtpUseSsl: settings.smtpUseSsl ?? false,
      };

      console.log(`[Email] ✅ Configurações SMTP carregadas para gymId ${gymId}`);
      return true;
    } catch (error) {
      console.error('[Email] ❌ Erro ao carregar configurações SMTP:', error);
      return false;
    }
  }

  /**
   * Cria um transporter do nodemailer com as configurações atuais
   */
  private createTransporter() {
    if (!this.config) {
      throw new Error('Configurações SMTP não carregadas. Chame loadConfig() primeiro.');
    }

    const transportOptions: any = {
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpUseSsl, // true para porta 465, false para outras
      auth: {
        user: this.config.smtpUser,
        pass: this.config.smtpPassword,
      },
    };

    // Se não usar SSL mas usar TLS, habilitar STARTTLS
    if (!this.config.smtpUseSsl && this.config.smtpUseTls) {
      transportOptions.requireTLS = true;
    }

    return nodemailer.createTransport(transportOptions);
  }

  /**
   * Envia e-mail com código de recuperação de senha
   */
  async sendResetCodeEmail(
    toEmail: string,
    userName: string,
    code: string,
    validityMinutes: number = 15
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config) {
        return { success: false, message: 'Configurações de email não estão disponíveis' };
      }

      const transporter = this.createTransporter();

      const htmlContent = this.getResetCodeTemplate(userName, code, validityMinutes);
      const textContent = `
Olá ${userName},

Recebemos uma solicitação de recuperação de senha para sua conta na academia.

Seu código de recuperação é: ${code}

Este código expira em ${validityMinutes} minutos.

Se você não solicitou esta recuperação, ignore este e-mail e sua senha permanecerá inalterada.

---
© 2026 ${this.config.smtpFromName}. Todos os direitos reservados.
Este é um e-mail automático, por favor não responda.
      `.trim();

      const mailOptions = {
        from: `${this.config.smtpFromName} <${this.config.smtpFromEmail}>`,
        to: toEmail,
        subject: 'Código de Recuperação de Senha',
        text: textContent,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);

      console.log(`[Email] ✅ Email de recuperação enviado para ${toEmail}`);
      return { success: true, message: 'E-mail enviado com sucesso' };
    } catch (error: any) {
      console.error('[Email] ❌ Erro ao enviar e-mail:', error);
      return { success: false, message: `Erro ao enviar e-mail: ${error.message}` };
    }
  }

  /**
   * Template HTML para e-mail de recuperação de senha
   */
  private getResetCodeTemplate(name: string, code: string, validity: number): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Recuperação</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Recuperação de Senha</h1>
                        </td>
                    </tr>

                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                                Olá <strong>${name}</strong>,
                            </p>

                            <p style="font-size: 14px; color: #666666; margin-bottom: 30px;">
                                Recebemos uma solicitação de recuperação de senha para sua conta na academia.
                                Use o código abaixo para criar uma nova senha:
                            </p>

                            <!-- Código em Destaque -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #f0f9ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; display: inline-block;">
                                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">Seu código de recuperação:</p>
                                            <p style="margin: 0; font-size: 36px; font-weight: bold; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                ${code}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size: 14px; color: #666666; margin-bottom: 20px;">
                                ⏰ <strong>Este código expira em ${validity} minutos.</strong>
                            </p>

                            <!-- Alerta de Segurança -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px;">
                                <p style="margin: 0; font-size: 13px; color: #856404;">
                                    <strong>⚠️ Atenção:</strong> Se você não solicitou esta recuperação,
                                    ignore este e-mail e sua senha permanecerá inalterada.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d;">
                                © 2026 ${this.config?.smtpFromName || 'Academia'}. Todos os direitos reservados.<br>
                                Este é um e-mail automático, por favor não responda.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
  }

  /**
   * Testa a conexão SMTP
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config) {
        return { success: false, message: 'Configurações SMTP não carregadas' };
      }

      const transporter = this.createTransporter();
      await transporter.verify();

      console.log('[Email] ✅ Conexão SMTP testada com sucesso');
      return { success: true, message: 'Conexão SMTP OK' };
    } catch (error: any) {
      console.error('[Email] ❌ Erro na conexão SMTP:', error);
      return { success: false, message: `Erro na conexão: ${error.message}` };
    }
  }
}

// Factory function para criar instância do serviço de email para uma academia
export async function getEmailServiceForGym(gymId: number): Promise<EmailService | null> {
  const service = new EmailService();
  const loaded = await service.loadConfig(gymId);

  if (!loaded) {
    return null;
  }

  return service;
}

// ===== MANTER FUNÇÕES ANTIGAS PARA COMPATIBILIDADE =====
// Estas funções ainda usam console.log por enquanto, mas devem ser migradas para SMTP

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Manus built-in email service (LEGADO - usar EmailService acima)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log(`[Email] Sending email to ${options.to}: ${options.subject}`);
    console.log(`[Email] Content: ${options.html}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

/**
 * Send password reset code email (LEGADO)
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
    subject: 'Código de Recuperação de Senha',
    html,
  });
}

export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  amount: number,
  dueDate: Date
): Promise<boolean> {
  const formattedAmount = (amount / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const formattedDate = dueDate.toLocaleDateString('pt-BR');

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
    subject: 'Pagamento Confirmado - Academia',
    html,
  });
}

export async function sendPaymentDueReminderEmail(
  email: string,
  name: string,
  amount: number,
  dueDate: Date
): Promise<boolean> {
  const formattedAmount = (amount / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const formattedDate = dueDate.toLocaleDateString('pt-BR');

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
    subject: 'Lembrete: Mensalidade Próxima do Vencimento',
    html,
  });
}

export async function sendMedicalExamExpiryReminderEmail(
  email: string,
  name: string,
  expiryDate: Date
): Promise<boolean> {
  const formattedDate = expiryDate.toLocaleDateString('pt-BR');

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
    subject: 'Lembrete: Exame Médico Próximo do Vencimento',
    html,
  });
}

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
    subject: 'Novo Treino Disponível - Academia',
    html,
  });
}
