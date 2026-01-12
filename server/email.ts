/**
 * Serviço de envio de e-mails via SMTP com Nodemailer
 * Usado para recuperação de senha e notificações
 */

import nodemailer from 'nodemailer';
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
 * Send email using Super Admin SMTP configuration
 * Used for sending gym admin credentials and other platform-wide emails
 */
export async function sendEmailFromSuperAdmin(options: EmailOptions): Promise<boolean> {
  try {
    console.log('[Email] 🔍 DEBUG: Iniciando sendEmailFromSuperAdmin');
    console.log('[Email] 🔍 DEBUG: nodemailer type:', typeof nodemailer);
    console.log('[Email] 🔍 DEBUG: nodemailer.createTransporter type:', typeof nodemailer.createTransporter);

    const { getSuperAdminSettings } = await import('./db');
    const settings = await getSuperAdminSettings();

    console.log('[Email] 🔍 DEBUG: Settings loaded:', !!settings);
    console.log('[Email] 🔍 DEBUG: Has SMTP config:', !!(settings?.smtpHost && settings?.smtpUser && settings?.smtpPassword));

    if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      console.error('[Email] ❌ Super Admin SMTP not configured!');
      console.log('[Email] ⚠️  Settings status:', {
        hasSettings: !!settings,
        hasHost: !!settings?.smtpHost,
        hasUser: !!settings?.smtpUser,
        hasPassword: !!settings?.smtpPassword,
      });
      console.log(`[Email] ⚠️  Email would be sent to ${options.to}: ${options.subject}`);
      return false;
    }

    const transportOptions: any = {
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpUseSsl ?? false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
      debug: true, // Habilitar debug do nodemailer
      logger: true, // Habilitar logs detalhados
    };

    // Se não usar SSL mas usar TLS, habilitar STARTTLS
    if (!settings.smtpUseSsl && (settings.smtpUseTls ?? true)) {
      transportOptions.requireTLS = true;
    }

    console.log(`[Email] 📧 Sending email via Super Admin SMTP`);
    console.log(`[Email]   Host: ${settings.smtpHost}`);
    console.log(`[Email]   Port: ${settings.smtpPort}`);
    console.log(`[Email]   SSL: ${settings.smtpUseSsl}`);
    console.log(`[Email]   TLS: ${settings.smtpUseTls}`);
    console.log(`[Email]   To: ${options.to}`);
    console.log(`[Email]   Subject: ${options.subject}`);
    console.log(`[Email]   From: ${settings.smtpFromEmail || settings.smtpUser}`);

    console.log('[Email] 🔍 DEBUG: Creating transporter...');

    // ⚠️ IMPORTANTE: Dynamic import do nodemailer para funcionar com esbuild
    const nodemailerModule = await import('nodemailer');
    const createTransport = nodemailerModule.default?.createTransport || nodemailerModule.createTransport;

    console.log('[Email] 🔍 DEBUG: nodemailerModule keys:', Object.keys(nodemailerModule).slice(0, 10));
    console.log('[Email] 🔍 DEBUG: has default?', !!nodemailerModule.default);
    console.log('[Email] 🔍 DEBUG: createTransport type:', typeof createTransport);

    if (!createTransport) {
      throw new Error('Could not find createTransport function in nodemailer');
    }

    const transporter = createTransport(transportOptions);
    console.log('[Email] 🔍 DEBUG: Transporter created successfully');

    const mailOptions = {
      from: settings.smtpFromEmail
        ? `"${settings.smtpFromName || 'SysFit Pro'}" <${settings.smtpFromEmail}>`
        : settings.smtpUser,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    console.log('[Email] 🔍 DEBUG: Sending mail...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] 🔍 DEBUG: Mail sent, info:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    console.log(`[Email] ✅ Email sent successfully to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('[Email] ❌ Failed to send email from Super Admin');
    console.error('[Email] ❌ Error type:', error.constructor.name);
    console.error('[Email] ❌ Error message:', error.message);
    console.error('[Email] ❌ Error stack:', error.stack);
    console.error('[Email] ❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
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

/**
 * Envia credenciais de acesso para o admin da academia após pagamento confirmado
 */
export async function sendGymAdminCredentials(
  email: string,
  password: string,
  gymName: string,
  gymSlug: string,
  plan: string,
  pixQrCode?: string,
  pixCopyPaste?: string
): Promise<boolean> {
  const loginUrl = `https://www.sysfitpro.com.br/admin/login?gym=${gymSlug}`;
  const planNames: Record<string, string> = {
    basic: "Básico",
    professional: "Professional",
    enterprise: "Enterprise"
  };

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo ao SysFit Pro!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">🎉 Bem-vindo ao SysFit Pro!</h1>
                  <p style="color: #e0e7ff; margin: 0; font-size: 16px;">
                    ${pixCopyPaste ? 'Sua academia foi cadastrada com sucesso!' : 'Sua academia está pronta para testar'}
                  </p>
                </td>
              </tr>

              <!-- Mensagem -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${gymName}! 👋</h2>
                  ${pixCopyPaste ? `
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Sua academia foi cadastrada com sucesso! Para ativar o acesso ao sistema, realize o pagamento do plano <strong style="color: #6366f1;">${planNames[plan] || plan}</strong> via PIX.
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Após a confirmação do pagamento, você receberá as credenciais abaixo por email e poderá fazer login:
                  </p>
                  ` : `
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Sua academia foi cadastrada com sucesso! Você está no <strong>período de teste gratuito</strong> e já pode começar a explorar todas as funcionalidades.
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Plano <strong style="color: #6366f1;">${planNames[plan] || plan}</strong> - Use as credenciais abaixo para fazer login:
                  </p>
                  `}
                </td>
              </tr>

              <!-- Credenciais -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border: 2px solid #6366f1; padding: 30px;">
                    <h3 style="margin: 0 0 20px 0; font-size: 20px; color: #333; text-align: center;">
                      🔑 Suas Credenciais de Acesso
                    </h3>

                    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                        <strong>Email:</strong>
                      </p>
                      <p style="margin: 0; font-size: 18px; color: #6366f1; font-weight: 600; word-break: break-all;">
                        ${email}
                      </p>
                    </div>

                    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                        <strong>Senha:</strong>
                      </p>
                      <p style="margin: 0; font-size: 24px; color: #6366f1; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace; text-align: center; padding: 15px; background-color: #f8fafc; border-radius: 4px;">
                        ${password}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>

              ${pixCopyPaste ? `
              <!-- PIX Payment -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background-color: #f0f9ff; border: 2px solid #0284c7; padding: 25px; border-radius: 12px;">
                    <h3 style="margin: 0 0 20px 0; color: #0369a1; font-size: 20px; text-align: center;">
                      💳 Pagamento via PIX
                    </h3>

                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #92400e;">
                        <strong>⚠️ Importante:</strong> Para ativar o acesso ao sistema, realize o pagamento via PIX usando o QR Code abaixo.
                      </p>
                    </div>

                    <div style="text-align: center; margin: 20px 0;">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCopyPaste)}" alt="QR Code PIX" style="max-width: 250px; border: 3px solid #0284c7; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                    </div>

                    <p style="margin: 15px 0 10px 0; font-size: 14px; color: #0369a1; font-weight: 600;">
                      Código Pix Copia e Cola:
                    </p>
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #bae6fd; word-break: break-all; font-family: monospace; font-size: 11px; color: #0369a1; line-height: 1.4;">
                      ${pixCopyPaste}
                    </div>

                    <p style="margin: 15px 0 0 0; font-size: 13px; color: #0c4a6e; text-align: center;">
                      Após o pagamento, o acesso será liberado automaticamente.
                    </p>
                  </div>
                </td>
              </tr>
              ` : ''}

              <!-- Botão -->
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <a href="${loginUrl}"
                     style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                    🚀 Acessar Minha Academia
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0; font-size: 12px; color: #6c757d;">
                    © 2026 SysFit Pro - Sistema completo de gestão para academias
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmailFromSuperAdmin({
    to: email,
    subject: `🎉 ${gymName} - Suas Credenciais de Acesso`,
    html,
  });
}

/**
 * Enviar email de confirmação de pagamento e ativação da academia
 */
export async function sendGymPaymentConfirmedEmail(
  email: string,
  gymName: string,
  gymSlug: string,
  plan: string
): Promise<boolean> {
  const loginUrl = `https://www.sysfitpro.com.br/admin/login?gym=${gymSlug}`;
  const planNames: Record<string, string> = {
    basic: "Básico",
    professional: "Professional",
    enterprise: "Enterprise"
  };

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pagamento Confirmado - Acesso Liberado!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">✅ Pagamento Confirmado!</h1>
                  <p style="color: #d1fae5; margin: 0; font-size: 16px;">Sua versão paga foi ativada com sucesso</p>
                </td>
              </tr>

              <!-- Mensagem -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">🎉 Parabéns, ${gymName}!</h2>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Seu pagamento foi confirmado e sua <strong style="color: #10b981;">versão paga</strong> foi liberada!
                  </p>
                  <p style="margin: 0 0 30px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Agora você tem acesso completo a todos os recursos do plano <strong style="color: #6366f1;">${planNames[plan] || plan}</strong>.
                  </p>

                  <!-- Botão de Login -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                      Acessar Sistema
                    </a>
                  </div>

                  <!-- Recursos -->
                  <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                    <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">✨ O que você pode fazer agora:</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #666;">
                      <li style="margin-bottom: 10px;">Cadastrar alunos e professores sem limite</li>
                      <li style="margin-bottom: 10px;">Gerenciar pagamentos e mensalidades</li>
                      <li style="margin-bottom: 10px;">Controlar acesso com integração biométrica</li>
                      <li style="margin-bottom: 10px;">Emitir relatórios completos</li>
                      <li style="margin-bottom: 10px;">E muito mais!</li>
                    </ul>
                  </div>

                  <p style="margin: 30px 0 0 0; font-size: 14px; color: #999; line-height: 1.6;">
                    Sua assinatura está ativa. Caso tenha dúvidas, nossa equipe está pronta para ajudar!
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                    <strong>SysFit Pro</strong> - Sistema de Gestão para Academias
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} SysFit Pro. Todos os direitos reservados.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmailFromSuperAdmin({
    to: email,
    subject: `✅ ${gymName} - Pagamento Confirmado! Acesso Liberado`,
    html,
  });
}

/**
 * Enviar email de confirmação de pagamento de mensalidade
 */
export async function sendGymBillingConfirmedEmail(
  email: string,
  gymName: string,
  referenceMonth: string,
  amountCents: number,
  paidAt: Date
): Promise<boolean> {
  const loginUrl = `https://www.sysfitpro.com.br/admin/login`;
  const amount = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const paymentDate = paidAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Convert reference month from "YYYY-MM" to "Mês/YYYY"
  const [year, month] = referenceMonth.split('-');
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthName = monthNames[parseInt(month) - 1];
  const displayMonth = `${monthName}/${year}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mensalidade Paga - Acesso Desbloqueado</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">💰 Pagamento Confirmado!</h1>
                  <p style="color: #d1fae5; margin: 0; font-size: 16px;">Sua mensalidade foi quitada com sucesso</p>
                </td>
              </tr>

              <!-- Mensagem -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${gymName}!</h2>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Recebemos o pagamento da sua mensalidade referente a <strong style="color: #10b981;">${displayMonth}</strong>.
                  </p>

                  <!-- Detalhes do Pagamento -->
                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0;">
                    <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📋 Detalhes do Pagamento</h3>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 8px 0;">Período:</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${displayMonth}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 8px 0;">Valor Pago:</td>
                        <td style="color: #10b981; font-size: 18px; font-weight: bold; text-align: right; padding: 8px 0;">${amount}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 8px 0;">Data do Pagamento:</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${paymentDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 8px 0;">Status:</td>
                        <td style="color: #10b981; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">✅ PAGO</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Sistema Desbloqueado -->
                  <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                    <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 18px;">🎉 Sistema Desbloqueado</h3>
                    <p style="color: #065f46; margin: 0; font-size: 15px; line-height: 1.5;">
                      Seu acesso ao sistema foi <strong>restabelecido automaticamente</strong>. Você já pode continuar utilizando todas as funcionalidades!
                    </p>
                  </div>

                  <!-- Botão de Login -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                      Acessar Sistema
                    </a>
                  </div>

                  <p style="margin: 30px 0 0 0; font-size: 14px; color: #999; line-height: 1.6;">
                    Obrigado por manter sua conta em dia! Caso tenha dúvidas, nossa equipe está pronta para ajudar.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                    <strong>SysFit Pro</strong> - Sistema de Gestão para Academias
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} SysFit Pro. Todos os direitos reservados.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmailFromSuperAdmin({
    to: email,
    subject: `💰 ${gymName} - Mensalidade de ${displayMonth} Confirmada!`,
    html,
  });
}

/**
 * Enviar email de aviso de trial expirando
 */
export async function sendTrialWarningEmail(
  email: string,
  gymName: string,
  gymSlug: string,
  daysRemaining: number
): Promise<boolean> {
  const loginUrl = `https://www.sysfitpro.com.br/admin/login?gym=${gymSlug}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu trial está acabando!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">⏰ Seu Trial Está Acabando!</h1>
                  <p style="color: #fef3c7; margin: 0; font-size: 16px;">Aproveite para garantir seu acesso</p>
                </td>
              </tr>

              <!-- Mensagem -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${gymName}! 👋</h2>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Seu período de teste grátis acaba em <strong style="color: #ef4444;">${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}</strong>!
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Para continuar usando o SysFit Pro sem interrupções, faça o pagamento da sua assinatura através do sistema.
                  </p>

                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">
                      <strong>⚠️ Importante:</strong> Após o vencimento do trial, você terá alguns dias de carência para realizar o pagamento. Caso não seja efetuado, o acesso ao sistema será bloqueado temporariamente.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Botão -->
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <a href="${loginUrl}"
                     style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                    💳 Acessar e Realizar Pagamento
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0; font-size: 12px; color: #6c757d;">
                    © 2026 SysFit Pro - Sistema completo de gestão para academias
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmailFromSuperAdmin({
    to: email,
    subject: `⏰ ${gymName} - Seu Trial Acaba em ${daysRemaining} Dia${daysRemaining > 1 ? 's' : ''}!`,
    html,
  });
}

/**
 * Enviar email de trial expirado com instruções de pagamento
 */
export async function sendTrialExpiredEmail(
  email: string,
  gymName: string,
  gymSlug: string,
  gracePeriodDays: number,
  pixQrCode?: string,
  pixCopyPaste?: string
): Promise<boolean> {
  const loginUrl = `https://www.sysfitpro.com.br/admin/login?gym=${gymSlug}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu trial expirou</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">⌛ Seu Trial Expirou</h1>
                  <p style="color: #fecaca; margin: 0; font-size: 16px;">Faça o pagamento para continuar usando</p>
                </td>
              </tr>

              <!-- Mensagem -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${gymName}! 👋</h2>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Seu período de teste grátis expirou. Para continuar usando o SysFit Pro, realize o pagamento da sua assinatura.
                  </p>

                  <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #991b1b;">
                      <strong>⚠️ Atenção:</strong> Você tem <strong>${gracePeriodDays} dias</strong> de carência para realizar o pagamento.
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #991b1b;">
                      Após esse período, o acesso ao sistema será bloqueado até a regularização.
                    </p>
                  </div>

                  ${pixCopyPaste ? `
                  <div style="background-color: #f0f9ff; border: 2px solid #0284c7; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #0369a1; font-size: 18px;">💳 Pagamento via PIX</h3>

                    <div style="text-align: center; margin: 20px 0;">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCopyPaste)}" alt="QR Code PIX" style="max-width: 250px; border: 3px solid #0284c7; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                    </div>

                    <p style="margin: 10px 0; font-size: 14px; color: #0369a1;">
                      <strong>Código Pix Copia e Cola:</strong>
                    </p>
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; border: 1px solid #bae6fd; word-break: break-all; font-family: monospace; font-size: 12px; color: #0369a1;">
                      ${pixCopyPaste}
                    </div>
                  </div>
                  ` : ''}
                </td>
              </tr>

              <!-- Botão -->
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <a href="${loginUrl}"
                     style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                    💳 Acessar Sistema e Pagar
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0; font-size: 12px; color: #6c757d;">
                    © 2026 SysFit Pro - Sistema completo de gestão para academias
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmailFromSuperAdmin({
    to: email,
    subject: `⌛ ${gymName} - Seu Trial Expirou - Faça o Pagamento`,
    html,
  });
}

/**
 * Enviar email com nova senha após reset pelo Super Admin
 */
export async function sendAdminPasswordResetEmail(
  email: string,
  password: string,
  gymName: string,
  gymSlug: string
): Promise<boolean> {
  const loginUrl = `https://www.sysfitpro.com.br/admin/login?gym=${gymSlug}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sua senha foi resetada</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">🔐 Senha Resetada</h1>
                  <p style="color: #e0e7ff; margin: 0; font-size: 16px;">Nova senha de acesso ao sistema</p>
                </td>
              </tr>

              <!-- Mensagem -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${gymName}! 👋</h2>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    A senha de administrador da sua academia foi resetada pelo Super Admin.
                  </p>
                  <p style="margin: 0 0 30px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Use as credenciais abaixo para fazer login no sistema:
                  </p>
                </td>
              </tr>

              <!-- Credenciais -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border: 2px solid #3b82f6; padding: 30px;">
                    <h3 style="margin: 0 0 20px 0; font-size: 20px; color: #333; text-align: center;">
                      🔑 Novas Credenciais de Acesso
                    </h3>

                    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                        <strong>Email:</strong>
                      </p>
                      <p style="margin: 0; font-size: 18px; color: #1e40af; font-weight: 600; word-break: break-all;">
                        ${email}
                      </p>
                    </div>

                    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                        <strong>Nova Senha:</strong>
                      </p>
                      <p style="margin: 0; font-size: 24px; color: #1e40af; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace; text-align: center; padding: 15px; background-color: #f8fafc; border-radius: 4px;">
                        ${password}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Alerta de Segurança -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                    <p style="margin: 0; font-size: 13px; color: #856404;">
                      <strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere esta senha após fazer login no sistema. Acesse <strong>Configurações > Alterar Senha</strong>.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Botão -->
              <tr>
                <td style="padding: 0 30px 40px 30px; text-align: center;">
                  <a href="${loginUrl}"
                     style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.4);">
                    🚀 Fazer Login
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0; font-size: 12px; color: #6c757d;">
                    © 2026 SysFit Pro - Sistema completo de gestão para academias<br>
                    Este é um e-mail automático. Por favor, não responda.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmailFromSuperAdmin({
    to: email,
    subject: `🔐 ${gymName} - Senha Resetada pelo Administrador`,
    html,
  });
}

/**
 * Enviar email de confirmação de pagamento de mensalidade para o aluno
 */
export async function sendStudentPaymentConfirmationEmail(
  gymId: number,
  studentEmail: string,
  studentName: string,
  amountCents: number,
  paidAt: Date,
  paymentMethod: string,
  dueDate: Date,
  receiptUrl?: string
): Promise<boolean> {
  try {
    const { getEmailServiceForGym } = await import('./email');
    const emailService = await getEmailServiceForGym(gymId);

    if (!emailService) {
      console.log(`[Email] ⚠️  SMTP não configurado para gymId ${gymId} - pulando envio de confirmação de pagamento`);
      return false;
    }

    const amount = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const paymentDate = paidAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const dueDateFormatted = dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pagamento Confirmado</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">💰 Pagamento Confirmado!</h1>
                  <p style="color: #d1fae5; margin: 0; font-size: 16px;">Sua mensalidade foi recebida com sucesso</p>
                </td>
              </tr>

              <!-- Mensagem -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${studentName}! 👋</h2>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Recebemos o pagamento da sua mensalidade. Seu acesso à academia está <strong style="color: #10b981;">liberado</strong>!
                  </p>
                </td>
              </tr>

              <!-- Detalhes do Pagamento -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 0;">
                    <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📋 Detalhes do Pagamento</h3>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 8px 0;">Valor Pago:</td>
                        <td style="color: #10b981; font-size: 18px; font-weight: bold; text-align: right; padding: 8px 0;">${amount}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 8px 0;">Data do Pagamento:</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${paymentDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 8px 0;">Forma de Pagamento:</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 8px 0;">Vencimento:</td>
                        <td style="color: #333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${dueDateFormatted}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px; padding: 8px 0;">Status:</td>
                        <td style="color: #10b981; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">✅ PAGO</td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Acesso Liberado -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px;">
                    <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 18px;">🎉 Acesso Liberado</h3>
                    <p style="color: #065f46; margin: 0; font-size: 15px; line-height: 1.5;">
                      Sua mensalidade está em dia! Você já pode frequentar a academia normalmente. Bons treinos!
                    </p>
                  </div>
                </td>
              </tr>

              ${receiptUrl ? `
              <!-- Recibo -->
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <a href="${receiptUrl}"
                     style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                    📄 Ver Recibo
                  </a>
                </td>
              </tr>
              ` : ''}

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                    Obrigado por manter sua mensalidade em dia! 💪
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} Academia. Todos os direitos reservados.
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

    const textContent = `
Olá ${studentName},

Recebemos o pagamento da sua mensalidade!

Detalhes do Pagamento:
- Valor Pago: ${amount}
- Data do Pagamento: ${paymentDate}
- Forma de Pagamento: ${paymentMethod}
- Vencimento: ${dueDateFormatted}
- Status: PAGO

Seu acesso à academia está liberado! Bons treinos!

---
© ${new Date().getFullYear()} Academia. Todos os direitos reservados.
Este é um e-mail automático, por favor não responda.
    `.trim();

    const result = await emailService.sendResetCodeEmail(
      studentEmail,
      studentName,
      '', // Não precisamos do código aqui
      0    // Não precisamos de validade
    );

    // Como sendResetCodeEmail não é apropriado, vou usar o transporter diretamente
    const config = (emailService as any).config;
    if (!config) {
      return false;
    }

    const nodemailerModule = await import('nodemailer');
    const createTransport = nodemailerModule.default?.createTransport || nodemailerModule.createTransport;
    const transporter = createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpUseSsl,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    await transporter.sendMail({
      from: `${config.smtpFromName} <${config.smtpFromEmail}>`,
      to: studentEmail,
      subject: '💰 Pagamento Confirmado - Mensalidade',
      text: textContent,
      html: html,
    });

    console.log(`[Email] ✅ Email de confirmação de pagamento enviado para ${studentEmail}`);
    return true;
  } catch (error: any) {
    console.error('[Email] ❌ Erro ao enviar confirmação de pagamento:', error);
    return false;
  }
}
