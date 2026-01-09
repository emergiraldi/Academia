/**
 * Envia emails diretamente usando nodemailer
 */
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function getSuperAdminSMTP() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
  const url = new URL(dbUrl);

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1)
  });

  const [settings] = await connection.query('SELECT * FROM superAdminSettings LIMIT 1');
  await connection.end();

  return settings[0];
}

async function sendEmails() {
  console.log('\n========================================');
  console.log('  ENVIANDO EMAILS - ACADEMIA TESTE');
  console.log('========================================\n');

  // Buscar configurações SMTP
  console.log('📧 Buscando configurações SMTP...');
  const smtp = await getSuperAdminSMTP();

  if (!smtp.smtpHost || !smtp.smtpUser || !smtp.smtpPass) {
    console.error('❌ Configurações SMTP não encontradas!');
    return;
  }

  console.log('✅ SMTP configurado:', smtp.smtpHost);

  // Criar transportador
  const transporter = nodemailer.createTransport({
    host: smtp.smtpHost,
    port: smtp.smtpPort || 587,
    secure: smtp.smtpSecure === 'Y',
    auth: {
      user: smtp.smtpUser,
      pass: smtp.smtpPass,
    },
  });

  const email = 'contato@giralditelecom.com.br';
  const password = 'Sc!rzPoaHbx7';
  const gymName = 'teste';
  const gymSlug = 'teste';
  const loginUrl = `https://www.sysfitpro.com.br/admin/login?gym=${gymSlug}`;

  // EMAIL 1: Credenciais
  console.log('\n📨 1. Enviando credenciais de acesso...');

  const credentialsHtml = `
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
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">🎉 Bem-vindo ao SysFit Pro!</h1>
                  <p style="color: #e0e7ff; margin: 0; font-size: 16px;">Suas credenciais de acesso</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${gymName}! 👋</h2>

                  <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="color: #0284c7; margin: 0 0 15px 0; font-size: 18px;">📧 Suas Credenciais de Acesso</h3>
                    <p style="margin: 10px 0; color: #666;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 10px 0; color: #666;"><strong>Senha:</strong> ${password}</p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                      Acessar Sistema
                    </a>
                  </div>

                  <p style="margin: 20px 0 0 0; font-size: 14px; color: #999;">
                    Por segurança, recomendamos que você altere sua senha no primeiro acesso.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
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

  await transporter.sendMail({
    from: `"${smtp.smtpFromName}" <${smtp.smtpFromEmail}>`,
    to: email,
    subject: `🎉 ${gymName} - Suas Credenciais de Acesso`,
    html: credentialsHtml,
  });

  console.log('✅ Credenciais enviadas!\n');

  // EMAIL 2: Confirmação de Pagamento
  console.log('📨 2. Enviando confirmação de pagamento...');

  const confirmationHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pagamento Confirmado!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">✅ Pagamento Confirmado!</h1>
                  <p style="color: #d1fae5; margin: 0; font-size: 16px;">Sua versão paga foi ativada com sucesso</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">🎉 Parabéns, ${gymName}!</h2>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Seu pagamento foi confirmado e sua <strong style="color: #10b981;">versão paga</strong> foi liberada!
                  </p>
                  <p style="margin: 0 0 30px 0; font-size: 16px; color: #666; line-height: 1.6;">
                    Agora você tem acesso completo a todos os recursos do plano <strong style="color: #6366f1;">Enterprise</strong>.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                      Acessar Sistema
                    </a>
                  </div>

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
                </td>
              </tr>
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
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

  await transporter.sendMail({
    from: `"${smtp.smtpFromName}" <${smtp.smtpFromEmail}>`,
    to: email,
    subject: `✅ ${gymName} - Pagamento Confirmado! Acesso Liberado`,
    html: confirmationHtml,
  });

  console.log('✅ Confirmação enviada!\n');

  console.log('========================================');
  console.log('✅ TODOS OS EMAILS FORAM ENVIADOS!');
  console.log('========================================\n');
  console.log(`📧 Emails enviados para: ${email}`);
  console.log(`🔑 Senha: ${password}`);
  console.log(`🌐 Link: ${loginUrl}\n`);
}

sendEmails().catch(error => {
  console.error('❌ Erro ao enviar emails:', error);
  process.exit(1);
});
