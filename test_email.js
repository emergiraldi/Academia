/**
 * Script de teste para enviar email usando configurações do Super Admin
 * Execute: node test_email.js
 */

import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import mysql from 'mysql2/promise';

dotenv.config();

async function testEmail() {
  console.log('📧 Teste de Envio de Email\n');
  console.log('========================================\n');

  try {
    // Conectar ao banco para buscar configurações SMTP
    const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
    const url = new URL(dbUrl);

    const connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username || 'root',
      password: url.password || '',
      database: url.pathname.substring(1)
    });

    console.log('✅ Conectado ao banco de dados\n');

    // Buscar configurações SMTP do Super Admin
    const [rows] = await connection.query('SELECT * FROM superadminsettings LIMIT 1');

    if (!rows || rows.length === 0) {
      console.error('❌ Nenhuma configuração encontrada na tabela superAdminSettings');
      return;
    }

    const settings = rows[0];

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      console.error('❌ Configurações SMTP não estão completas!');
      console.log('\nConfigure os seguintes campos no Super Admin:');
      console.log('  - SMTP Host:', settings.smtpHost || '❌ NÃO CONFIGURADO');
      console.log('  - SMTP User:', settings.smtpUser || '❌ NÃO CONFIGURADO');
      console.log('  - SMTP Password:', settings.smtpPassword ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO');
      return;
    }

    console.log('📋 Configurações SMTP encontradas:');
    console.log('  - Host:', settings.smtpHost);
    console.log('  - Porta:', settings.smtpPort || 587);
    console.log('  - Usuário:', settings.smtpUser);
    console.log('  - TLS:', settings.smtpUseTls ? 'SIM' : 'NÃO');
    console.log('  - SSL:', settings.smtpUseSsl ? 'SIM' : 'NÃO');
    console.log('  - Email Remetente:', settings.smtpFromEmail || settings.smtpUser);
    console.log('  - Nome Remetente:', settings.smtpFromName || 'SysFit Pro');
    console.log();

    // Criar transporter do nodemailer
    const transportOptions = {
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpUseSsl ?? false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    };

    if (!settings.smtpUseSsl && (settings.smtpUseTls ?? true)) {
      transportOptions.requireTLS = true;
    }

    console.log('🔄 Criando transporter do nodemailer...\n');
    const transporter = nodemailer.createTransporter(transportOptions);

    // Email de teste
    const emailDestino = 'contato@giralditelecom.com.br';

    console.log(`📤 Enviando email de teste para: ${emailDestino}\n`);

    const info = await transporter.sendMail({
      from: settings.smtpFromEmail
        ? `"${settings.smtpFromName || 'SysFit Pro'}" <${settings.smtpFromEmail}>`
        : settings.smtpUser,
      to: emailDestino,
      subject: '🧪 Teste de Email - SysFit Pro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                        🧪 Teste de Email
                      </h1>
                      <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                        Sistema de envio de emails funcionando!
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0; line-height: 1.6;">
                        Este é um <strong>email de teste</strong> enviado pelo SysFit Pro.
                      </p>

                      <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                          <strong>✅ Configuração SMTP:</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #374151;">
                          Servidor: ${settings.smtpHost}<br>
                          Porta: ${settings.smtpPort || 587}<br>
                          Protocolo: ${settings.smtpUseSsl ? 'SSL' : 'TLS'}
                        </p>
                      </div>

                      <p style="font-size: 16px; color: #374151; margin: 20px 0 0 0; line-height: 1.6;">
                        Se você recebeu este email, significa que o <strong>sistema de envio de emails está funcionando corretamente</strong>! 🎉
                      </p>

                      <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0; line-height: 1.6;">
                        Agora os emails de credenciais para novos clientes serão enviados automaticamente.
                      </p>
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
      `,
    });

    console.log('✅ Email enviado com sucesso!');
    console.log('\n📊 Informações do envio:');
    console.log('  - Message ID:', info.messageId);
    console.log('  - Response:', info.response);
    console.log('\n========================================');
    console.log('✅ Teste concluído! Verifique o email em:', emailDestino);
    console.log('========================================\n');

    await connection.end();

  } catch (error) {
    console.error('\n❌ Erro ao enviar email:', error.message);
    console.error('\n🔍 Detalhes do erro:', error);
    console.log('\n💡 Possíveis causas:');
    console.log('  1. Credenciais SMTP incorretas');
    console.log('  2. Servidor SMTP bloqueado pelo firewall');
    console.log('  3. App Password do Gmail não configurado corretamente');
    console.log('  4. Configurações de porta/TLS/SSL incorretas\n');
  }
}

testEmail();
