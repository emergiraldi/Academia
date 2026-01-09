/**
 * Teste simplificado de envio de email
 */

import nodemailer from 'nodemailer';

async function testEmailSimple() {
  console.log('🧪 Teste Simples de Email\n');

  try {
    // Configurações SMTP do Titan (baseado no log que você viu: smtp.titan.email:465)
    const config = {
      host: 'smtp.titan.email',
      port: 465,
      secure: true, // SSL
      auth: {
        user: 'contato@giralditelecom.com.br', // Substituir pelo seu email SMTP
        pass: 'SUA_SENHA_AQUI', // Substituir pela senha real
      },
    };

    console.log('📋 Configuração:');
    console.log('  Host:', config.host);
    console.log('  Porta:', config.port);
    console.log('  SSL:', config.secure);
    console.log('  Usuário:', config.user);
    console.log();

    console.log('🔧 Criando transporter...');
    const transporter = nodemailer.createTransporter(config);

    console.log('✅ Transporter criado');
    console.log('🔍 Tipo do transporter:', typeof transporter);
    console.log('🔍 Métodos disponíveis:', Object.keys(transporter).slice(0, 10));
    console.log();

    console.log('📧 Enviando email de teste...');
    const info = await transporter.sendMail({
      from: `"Teste SysFit" <${config.auth.user}>`,
      to: 'contato@giralditelecom.com.br',
      subject: '🧪 Teste de Email Simples',
      html: '<h1>Teste</h1><p>Se você recebeu este email, o nodemailer está funcionando!</p>',
    });

    console.log('✅ Email enviado com sucesso!');
    console.log('  Message ID:', info.messageId);
    console.log('  Response:', info.response);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error('\n🔍 Detalhes do erro:', error);
  }
}

testEmailSimple();
