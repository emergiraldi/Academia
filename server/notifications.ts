import * as db from "./db";
import { sendEmail } from "./email";

/**
 * Email notification service for automated notifications
 */

// Email template for payment due reminder (7 days before)
function getPaymentDueReminderTemplate(studentName: string, amount: number, dueDate: Date, gymName: string) {
  const formattedAmount = (amount / 100).toFixed(2);
  const formattedDate = dueDate.toLocaleDateString('pt-BR');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .amount { font-size: 24px; font-weight: bold; color: #667eea; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Lembrete de Pagamento</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${studentName}</strong>,</p>
          
          <p>Este é um lembrete amigável de que sua mensalidade da <strong>${gymName}</strong> vence em breve.</p>
          
          <p><strong>Valor:</strong> <span class="amount">R$ ${formattedAmount}</span></p>
          <p><strong>Vencimento:</strong> ${formattedDate}</p>
          
          <p>Para evitar bloqueio de acesso, realize o pagamento antes da data de vencimento.</p>
          
          <p>Você pode pagar diretamente pelo aplicativo usando PIX ou na recepção da academia.</p>
          
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe ${gymName}</strong></p>
        </div>
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email template for payment confirmation
function getPaymentConfirmationTemplate(studentName: string, amount: number, paidAt: Date, gymName: string, receiptUrl?: string) {
  const formattedAmount = (amount / 100).toFixed(2);
  const formattedDate = paidAt.toLocaleDateString('pt-BR');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .amount { font-size: 24px; font-weight: bold; color: #10b981; }
        .success-icon { font-size: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Pagamento Confirmado!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${studentName}</strong>,</p>
          
          <p>Seu pagamento foi confirmado com sucesso!</p>
          
          <p><strong>Valor pago:</strong> <span class="amount">R$ ${formattedAmount}</span></p>
          <p><strong>Data:</strong> ${formattedDate}</p>
          
          <p>Seu acesso à academia está liberado. Continue treinando e alcançando seus objetivos! 💪</p>
          
          ${receiptUrl ? `<p><a href="${receiptUrl}" class="button">📄 Baixar Recibo</a></p>` : ''}
          
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe ${gymName}</strong></p>
        </div>
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email template for medical exam expiration reminder (15 days before)
function getMedicalExamReminderTemplate(studentName: string, expirationDate: Date, gymName: string) {
  const formattedDate = expirationDate.toLocaleDateString('pt-BR');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚕️ Renovação de Exame Médico</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${studentName}</strong>,</p>
          
          <p>Seu exame médico está próximo do vencimento.</p>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong> Seu exame vence em <strong>${formattedDate}</strong>
          </div>
          
          <p>Para continuar treinando sem interrupções, providencie a renovação do seu exame médico o quanto antes.</p>
          
          <p><strong>O que fazer:</strong></p>
          <ul>
            <li>Agende uma consulta médica</li>
            <li>Solicite o atestado de aptidão física</li>
            <li>Envie o documento pelo aplicativo ou na recepção</li>
          </ul>
          
          <p><strong>Atenção:</strong> Após o vencimento, seu acesso à academia será bloqueado temporariamente até a renovação do exame.</p>
          
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe ${gymName}</strong></p>
        </div>
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email template for welcome message
function getWelcomeTemplate(studentName: string, email: string, gymName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .welcome-icon { font-size: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="welcome-icon">🎉</div>
          <h1>Bem-vindo(a) à ${gymName}!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${studentName}</strong>,</p>
          
          <p>É um prazer tê-lo(a) conosco! Sua matrícula foi realizada com sucesso.</p>
          
          <p><strong>Seus dados de acesso:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Senha:</strong> A senha que você cadastrou</li>
          </ul>
          
          <p><strong>Próximos passos:</strong></p>
          <ol>
            <li>Faça login no aplicativo com seu email e senha</li>
            <li>Tire uma foto para cadastro facial (controle de acesso)</li>
            <li>Envie seu exame médico</li>
            <li>Aguarde a liberação do seu treino personalizado</li>
          </ol>
          
          <p>Estamos aqui para ajudá-lo(a) a alcançar seus objetivos! 💪</p>
          
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe ${gymName}</strong></p>
        </div>
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send payment due reminder (7 days before due date)
 */
export async function sendPaymentDueReminder(
  studentEmail: string,
  studentName: string,
  amount: number,
  dueDate: Date,
  gymName: string
) {
  const html = getPaymentDueReminderTemplate(studentName, amount, dueDate, gymName);
  
  await sendEmail({
    to: studentEmail,
    subject: `🔔 Lembrete: Mensalidade vence em breve - ${gymName}`,
    html,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmation(
  studentEmail: string,
  studentName: string,
  amount: number,
  paidAt: Date,
  gymName: string,
  receiptUrl?: string
) {
  const html = getPaymentConfirmationTemplate(studentName, amount, paidAt, gymName, receiptUrl);
  
  await sendEmail({
    to: studentEmail,
    subject: `✅ Pagamento Confirmado - ${gymName}`,
    html,
  });
}

/**
 * Send medical exam expiration reminder (15 days before)
 */
export async function sendMedicalExamReminder(
  studentEmail: string,
  studentName: string,
  expirationDate: Date,
  gymName: string
) {
  const html = getMedicalExamReminderTemplate(studentName, expirationDate, gymName);
  
  await sendEmail({
    to: studentEmail,
    subject: `⚕️ Renovação de Exame Médico - ${gymName}`,
    html,
  });
}

/**
 * Send welcome email to new student
 */
export async function sendWelcomeEmail(
  studentEmail: string,
  studentName: string,
  gymName: string
) {
  const html = getWelcomeTemplate(studentName, studentEmail, gymName);
  
  await sendEmail({
    to: studentEmail,
    subject: `🎉 Bem-vindo(a) à ${gymName}!`,
    html,
  });
}

/**
 * Check for payments due in 7 days and send reminders
 * Should be run daily via cron job
 */
export async function sendDailyPaymentReminders() {
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    // Get all gyms
    const gyms = await db.listGyms();
    
    for (const gym of gyms) {
      // Get all pending payments for this gym
      const payments = await db.listPayments(gym.id);
      
      for (const payment of payments) {
        if (payment.status === 'pending') {
          const dueDate = new Date(payment.dueDate);
          const diffDays = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          // Send reminder if due in 7 days
          if (diffDays === 7) {
            const student = await db.getStudentById(payment.studentId, gym.id);
            if (student) {
              const user = await db.getUserById(student.userId);
              if (user && user.email) {
                await sendPaymentDueReminder(
                  user.email,
                  user.name || 'Aluno',
                  payment.amountInCents,
                  dueDate,
                  gym.name
                );
                console.log(`Payment reminder sent to ${user.email}`);
              }
            }
          }
        }
      }
    }
    
    console.log('Daily payment reminders sent successfully');
  } catch (error) {
    console.error('Error sending daily payment reminders:', error);
  }
}

/**
 * Check for medical exams expiring in 15 days and send reminders
 * Should be run daily via cron job
 */
export async function sendDailyMedicalExamReminders() {
  try {
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
    
    // Get all gyms
    const gyms = await db.listGyms();
    
    for (const gym of gyms) {
      // Get all students for this gym
      const students = await db.listStudents(gym.id);
      
      for (const student of students) {
        // Get medical exams for this student
        const exams = await db.getStudentMedicalExams(student.id, gym.id);
        
        for (const exam of exams) {
          if (exam.expiryDate) {
            const expirationDate = new Date(exam.expiryDate);
            const diffDays = Math.floor((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            // Send reminder if expiring in 15 days
            if (diffDays === 15) {
              if (student.email) {
                await sendMedicalExamReminder(
                  student.email,
                  student.name || 'Aluno',
                  expirationDate,
                  gym.name
                );
                console.log(`Medical exam reminder sent to ${student.email}`);
              }
            }
          }
        }
      }
    }
    
    console.log('Daily medical exam reminders sent successfully');
  } catch (error) {
    console.error('Error sending daily medical exam reminders:', error);
  }
}

// Email template for access blocked notification
function getAccessBlockedTemplate(studentName: string, gymName: string, overdueAmount: number, overdueDays: number) {
  const formattedAmount = (overdueAmount / 100).toFixed(2);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .amount { font-size: 24px; font-weight: bold; color: #ef4444; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚫 Acesso Bloqueado</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${studentName}</strong>,</p>
          
          <div class="alert">
            <p><strong>⚠️ Seu acesso à academia foi bloqueado devido à inadimplência.</strong></p>
          </div>
          
          <p>Identificamos que você possui mensalidades em atraso há <strong>${overdueDays} dias</strong>.</p>
          
          <p><strong>Valor em atraso:</strong> <span class="amount">R$ ${formattedAmount}</span></p>
          
          <p>Para reativar seu acesso, realize o pagamento das mensalidades pendentes o mais rápido possível.</p>
          
          <p><strong>Como regularizar:</strong></p>
          <ul>
            <li>Acesse o aplicativo e pague via PIX</li>
            <li>Compareça à recepção da academia</li>
            <li>Entre em contato conosco para negociação</li>
          </ul>
          
          <p>Após a confirmação do pagamento, seu acesso será reativado automaticamente.</p>
          
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe ${gymName}</strong></p>
        </div>
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send access blocked notification email
 */
async function sendAccessBlockedNotification(
  email: string,
  studentName: string,
  gymName: string,
  overdueAmount: number,
  overdueDays: number
) {
  const html = getAccessBlockedTemplate(studentName, gymName, overdueAmount, overdueDays);
  
  await sendEmail({
    to: email,
    subject: `⚠️ Acesso Bloqueado - ${gymName}`,
    html,
  });
}

/**
 * Check for overdue payments and block access automatically
 * Should be run daily via cron job at 6:00 AM
 */
export async function checkAndBlockDefaulters() {
  try {
    console.log('[CRON] Starting automatic defaulter blocking...');

    // Get all gyms
    const gyms = await db.listGyms();

    for (const gym of gyms) {
      console.log(`[CRON] Checking gym: ${gym.name}`);

      // Get gym settings
      const settings = await db.getGymSettings(gym.id);
      const daysToBlock = settings?.daysToBlockAfterDue || 7; // Default to 7 days if not configured

      console.log(`[CRON] Using ${daysToBlock} days to block for ${gym.name}`);

      // Get all students for this gym
      const students = await db.listStudents(gym.id);

      for (const student of students) {
        // Skip if already blocked
        if (student.membershipStatus === 'blocked') {
          continue;
        }

        // Get all payments for this student
        const payments = await db.getPaymentsByStudent(student.id, gym.id);

        // Find overdue payments (more than configured days overdue)
        const now = Date.now();
        const blockThreshold = now - (daysToBlock * 24 * 60 * 60 * 1000);

        const overduePayments = payments.filter(payment => {
          if (payment.status === 'paid') return false;
          const dueDate = new Date(payment.dueDate).getTime();
          return dueDate < blockThreshold;
        });
        
        if (overduePayments.length > 0) {
          // Calculate total overdue amount
          const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amountInCents, 0);
          
          // Calculate days overdue (from oldest payment)
          const oldestPayment = overduePayments.reduce((oldest, p) => {
            const pDate = new Date(p.dueDate).getTime();
            const oldestDate = new Date(oldest.dueDate).getTime();
            return pDate < oldestDate ? p : oldest;
          });
          
          const overdueDays = Math.floor((now - new Date(oldestPayment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          
          console.log(`[CRON] Blocking student ${student.name} (${student.email}) - ${overdueDays} days overdue, R$ ${(totalOverdue / 100).toFixed(2)}`);
          
          // Block student in database
          await db.updateStudent(student.id, gym.id, { membershipStatus: 'blocked' });
          
          // Block in Control ID devices (if configured)
          if (student.controlIdUserId) {
            try {
              const { getControlIdServiceForGym } = await import('./controlId');
              const service = await getControlIdServiceForGym(gym.id);

              if (service) {
                await service.blockUserAccess(student.controlIdUserId);
                console.log(`[CRON] 🚫 Blocked student ${student.name} in Control ID`);
              }
            } catch (error) {
              console.error(`[CRON] Error blocking in Control ID:`, error);
              // Continue even if Control ID fails
            }
          }
          
          // Send email notification
          if (student.email) {
            try {
              await sendAccessBlockedNotification(
                student.email,
                student.name || 'Aluno',
                gym.name,
                totalOverdue,
                overdueDays
              );
              console.log(`[CRON] Access blocked email sent to ${student.email}`);
            } catch (error) {
              console.error(`[CRON] Error sending email:`, error);
            }
          }
        }

        // Check for expired medical exam (if enabled in settings)
        if (settings?.blockOnExpiredExam && student.membershipStatus !== 'blocked') {
          const examValidityDays = settings.examValidityDays || 90;

          // Get student's medical exams
          const exams = await db.getMedicalExamsByStudent(student.id, gym.id);

          if (exams.length === 0) {
            // No exam registered - don't block yet, just skip
            continue;
          }

          // Get most recent exam
          const latestExam = exams.reduce((latest, exam) => {
            const examDate = new Date(exam.examDate).getTime();
            const latestDate = new Date(latest.examDate).getTime();
            return examDate > latestDate ? exam : latest;
          });

          // Check if exam is expired
          const examDate = new Date(latestExam.examDate).getTime();
          const validUntil = examDate + (examValidityDays * 24 * 60 * 60 * 1000);

          if (Date.now() > validUntil) {
            console.log(`[CRON] Blocking student ${student.name} - Medical exam expired (${examValidityDays} days)`);

            // Block student in database
            await db.updateStudent(student.id, gym.id, { membershipStatus: 'blocked' });

            // Block in Control ID devices
            if (student.controlIdUserId) {
              try {
                const { getControlIdServiceForGym } = await import('./controlId');
                const service = await getControlIdServiceForGym(gym.id);

                if (service) {
                  await service.blockUserAccess(student.controlIdUserId);
                  console.log(`[CRON] 🚫 Blocked student ${student.name} in Control ID (expired exam)`);
                }
              } catch (error) {
                console.error(`[CRON] Error blocking in Control ID:`, error);
              }
            }
          }
        }
      }
    }

    console.log('[CRON] Automatic defaulter blocking completed successfully');
  } catch (error) {
    console.error('[CRON] Error in automatic defaulter blocking:', error);
  }
}

/**
 * Sync access logs from Control ID devices to database
 * Runs periodically to keep access logs up to date
 */
export async function syncAccessLogsFromControlId() {
  console.log("[CRON] Starting access logs sync from Control ID...");

  try {
    // Get all gyms with Control ID devices configured
    const gyms = await db.listGyms();

    for (const gym of gyms) {
      try {
        const { getControlIdServiceForGym } = await import("./controlId");
        const service = await getControlIdServiceForGym(gym.id);

        if (!service) {
          continue; // Skip gyms without Control ID configured
        }

        // Get the active Control ID device for this gym
        const device = await db.getActiveDeviceByGym(gym.id);
        if (!device) {
          console.log(`[CRON] No active Control ID device found for gym ${gym.id}`);
          continue;
        }

        console.log(`[CRON] Syncing access logs for gym ${gym.name} (ID ${gym.id})...`);

        // Load access logs from Control ID device
        console.log(`[CRON] 📡 Chamando service.loadAccessLogs() para academia ${gym.id}...`);
        const logs = await service.loadAccessLogs();
        console.log(`[CRON] 📊 Resultado de loadAccessLogs():`, logs ? `${logs.length} logs` : 'null/undefined');

        if (!logs || logs.length === 0) {
          console.log(`[CRON] ⚠️  Nenhum log de acesso encontrado para academia ${gym.id}`);
          continue;
        }

        console.log(`[CRON] ✅ Encontrados ${logs.length} logs do Control ID para academia ${gym.id}`);

        // Process and save each log
        let newLogs = 0;
        for (const log of logs) {
          try {
            // Find student by Control ID user ID
            const students = await db.listStudents(gym.id);
            const student = students.find(s => s.controlIdUserId === log.user_id);

            if (!student) {
              console.log(`[CRON] Student not found for Control ID user ${log.user_id}, skipping log`);
              continue;
            }

            // Determine access type based on event code
            // Control ID event codes: 6 = entrada, 7 = saída, outros = negado
            let accessType: "entry" | "exit" | "denied" = "entry";
            let denialReason: string | null = null;

            if (log.event === 7) {
              accessType = "exit";
            } else if (log.event === 6) {
              accessType = "entry";
            } else {
              // Outros eventos podem ser acesso negado
              accessType = "denied";
              denialReason = `Evento ${log.event} - Acesso não autorizado`;
            }

            // Parse timestamp (pode vir como Unix timestamp em segundos OU string formatada)
            console.log(`[CRON] 🔍 RAW log.time value:`, log.time, `type: ${typeof log.time}`);
            const timestamp = typeof log.time === 'number' ? new Date(log.time * 1000) : new Date(log.time);
            console.log(`[CRON] 📅 Converted timestamp:`, timestamp.toISOString());

            console.log(`[CRON] Processing log: user_id=${log.user_id}, event=${log.event}, accessType=${accessType}, time=${timestamp.toLocaleString('pt-BR')}`);

            // Check if this log already exists (avoid duplicates)
            const existingLogs = await db.getStudentAccessLogs(student.id, gym.id);
            console.log(`[CRON] Existing logs for student ${student.id}: ${existingLogs.length}`);

            const isDuplicate = existingLogs.some(existing => {
              const timeDiff = Math.abs(new Date(existing.timestamp).getTime() - timestamp.getTime());
              const isDup = timeDiff < 1000 && existing.accessType === accessType;
              if (isDup) {
                console.log(`[CRON] Duplicate detected: timeDiff=${timeDiff}ms, type=${accessType}`);
              }
              return isDup;
            });

            if (isDuplicate) {
              console.log(`[CRON] Skipping duplicate log for student ${student.id}`);
              continue; // Skip duplicate
            }

            // Save log to database
            await db.createAccessLog({
              gymId: gym.id,
              studentId: student.id,
              deviceId: device.id, // Use the Control ID device from our database
              accessType,
              denialReason,
              timestamp,
            });

            newLogs++;
            console.log(`[CRON] ✅ Saved ${accessType} log for student ${student.id} at ${timestamp.toLocaleString('pt-BR')}`);

            // 🔄 INTEGRAÇÃO HÍBRIDA: Control ID + Toletus HUB
            // Se a academia usa Toletus HUB e o acesso foi aprovado, liberar a catraca Toletus
            // A leitora facial apenas reconhece a pessoa, a catraca física determina o sentido (entrada/saída)
            console.log(`[CRON] 🔍 Verificando liberação automática: accessType=${accessType}, gym.turnstileType=${gym.turnstileType}, student.membershipStatus=${student.membershipStatus}`);

            // IMPORTANTE: Só liberar se o aluno está ATIVO e o acesso foi aprovado (não negado)
            const shouldRelease = (accessType === "entry" || accessType === "exit") &&
                                   gym.turnstileType === "toletus_hub" &&
                                   student.membershipStatus === "active";

            if (shouldRelease) {
              try {
                console.log(`[CRON] 🔓 Academia ${gym.name} usa Toletus HUB - Liberando catraca para ${student.name}...`);

                const { getToletusHubServiceForGym, createToletusDevicePayload } = await import("./toletusHub");
                const toletusService = await getToletusHubServiceForGym(gym.id);

                if (toletusService) {
                  // Buscar dispositivos Toletus ativos da academia
                  const toletusDevices = await db.listToletusDevices(gym.id);
                  const activeDevices = toletusDevices.filter(d => d.active);

                  if (activeDevices.length > 0) {
                    // Liberar entrada no primeiro dispositivo ativo (pode ser ajustado para liberar em todos)
                    const targetDevice = activeDevices[0];
                    const devicePayload = createToletusDevicePayload(targetDevice);
                    const message = `Bem-vindo, ${student.name}!`;

                    console.log(`[CRON] 🚪 Enviando comando de liberação para dispositivo ${targetDevice.name} (${targetDevice.deviceIp})`);
                    console.log(`[CRON] 🔑 Tipo de acesso detectado: ${accessType} - Sempre liberando ENTRADA`);

                    // SEMPRE liberar entrada (independente do tipo de acesso do Control ID)
                    // Isso é necessário porque o Control ID pode estar configurado incorretamente
                    // ou a catraca física sempre precisa de ReleaseEntry para abrir
                    const released = await toletusService.releaseEntry(devicePayload, message);

                    if (released) {
                      console.log(`[CRON] ✅ Catraca Toletus liberada com sucesso para ${student.name}`);
                    } else {
                      console.log(`[CRON] ⚠️  Falha ao liberar catraca Toletus para ${student.name}`);
                    }
                  } else {
                    console.log(`[CRON] ⚠️  Nenhum dispositivo Toletus ativo encontrado para academia ${gym.id}`);
                  }
                } else {
                  console.log(`[CRON] ⚠️  Serviço Toletus HUB não disponível para academia ${gym.id}`);
                }
              } catch (toletusError) {
                console.error(`[CRON] ❌ Erro ao liberar catraca Toletus:`, toletusError);
                // Não interrompe o fluxo - o log já foi salvo
              }
            }

          } catch (logError) {
            console.error(`[CRON] Error processing individual log:`, logError);
          }
        }

        console.log(`[CRON] ✅ Synced ${newLogs} new access logs for gym ${gym.id}`);

      } catch (gymError) {
        console.error(`[CRON] ❌ Erro ao sincronizar logs da academia ${gym.id} (${gym.name}):`, gymError);
        if (gymError instanceof Error) {
          console.error(`[CRON] Stack trace:`, gymError.stack);
        }
      }
    }

    console.log("[CRON] ✅ Access logs sync completed");

  } catch (error) {
    console.error("[CRON] ❌ Error in access logs sync:", error);
  }
}

/**
 * Check trial expirations and send warnings/block gyms
 * Runs daily to:
 * 1. Send warning emails X days before trial ends
 * 2. Send expiration emails when trial ends
 * 3. Block gyms after grace period if no payment
 */
export async function checkTrialExpirations() {
  try {
    console.log("[CRON] 🔍 Checking trial expirations...");

    // Get Super Admin settings for trial configuration
    const db = await getDb();
    if (!db) {
      console.error("[CRON] ❌ Database not available");
      return;
    }

    const { getSuperAdminSettings } = await import("./db");
    const settings = await getSuperAdminSettings();

    if (!settings || !settings.trialEnabled) {
      console.log("[CRON] ⏭️  Trial period disabled, skipping check");
      return;
    }

    const trialWarningDays = settings.trialWarningDays || 3;
    const trialGracePeriodDays = settings.trialGracePeriodDays || 7;

    console.log(`[CRON] Configuration:`);
    console.log(`  - Warning days before expiry: ${trialWarningDays}`);
    console.log(`  - Grace period after expiry: ${trialGracePeriodDays}`);

    // Import email functions
    const { sendTrialWarningEmail, sendTrialExpiredEmail } = await import("./email");
    const { gyms } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Get all gyms in trial
    const gymsInTrial = await db.select().from(gyms).where(eq(gyms.planStatus, "trial"));

    if (gymsInTrial.length === 0) {
      console.log("[CRON] ℹ️  No gyms in trial period");
      return;
    }

    console.log(`[CRON] Found ${gymsInTrial.length} gym(s) in trial`);

    const now = new Date();

    for (const gym of gymsInTrial) {
      try {
        if (!gym.trialEndsAt) {
          console.log(`[CRON] ⚠️  Gym ${gym.id} (${gym.name}) has no trial end date, skipping`);
          continue;
        }

        const trialEndDate = new Date(gym.trialEndsAt);
        const daysUntilExpiry = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`[CRON] Gym ${gym.id} (${gym.name}):`);
        console.log(`  - Trial ends: ${trialEndDate.toLocaleDateString('pt-BR')}`);
        console.log(`  - Days until expiry: ${daysUntilExpiry}`);

        // Case 1: Trial expires soon - send warning email
        if (daysUntilExpiry > 0 && daysUntilExpiry <= trialWarningDays) {
          console.log(`[CRON] ⚠️  Trial expiring soon for gym ${gym.id}, sending warning email`);

          const adminEmail = gym.tempAdminEmail || gym.email;
          try {
            await sendTrialWarningEmail(adminEmail, gym.name, gym.slug, daysUntilExpiry);
            console.log(`[CRON] ✅ Warning email sent to ${adminEmail}`);
          } catch (emailError) {
            console.error(`[CRON] ❌ Failed to send warning email:`, emailError);
          }
        }

        // Case 2: Trial just expired - send expiration email
        else if (daysUntilExpiry === 0 || (daysUntilExpiry < 0 && daysUntilExpiry >= -trialGracePeriodDays)) {
          const daysSinceExpiry = Math.abs(Math.min(daysUntilExpiry, 0));
          console.log(`[CRON] ⌛ Trial expired for gym ${gym.id} (${daysSinceExpiry} days ago)`);

          // Generate PIX payment for the gym if not already generated
          // Check if there's already a pending payment for this month
          const { getGymPaymentByReferenceMonth } = await import("./db");
          const now = new Date();
          const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

          const existingPayment = await getGymPaymentByReferenceMonth(gym.id, referenceMonth);

          let pixQrCode: string | undefined;
          let pixCopyPaste: string | undefined;

          if (!existingPayment || existingPayment.status === 'cancelled') {
            console.log(`[CRON] 💳 Generating PIX payment for gym ${gym.id}`);
            try {
              // Generate PIX payment automatically
              const { getPixServiceFromSuperAdmin } = await import("./pix");
              const { createGymPayment, listSaasPlans } = await import("./db");

              const allPlans = await listSaasPlans(false);
              const plansMap: Record<string, any> = {};
              allPlans.forEach((p: any) => {
                plansMap[p.slug] = p;
              });

              const selectedPlan = plansMap[gym.plan];
              if (selectedPlan) {
                const amountInCents = selectedPlan.priceInCents;
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 10); // 10 days to pay

                const pixService = await getPixServiceFromSuperAdmin();
                const pixCharge = await pixService.createImmediateCharge({
                  valor: amountInCents,
                  pagador: {
                    cpf: gym.cnpj?.replace(/\D/g, "") || "00000000000",
                    nome: gym.name,
                  },
                  infoAdicionais: `Assinatura ${selectedPlan.name} - ${gym.name}`,
                  expiracao: 86400 * 10, // 10 days
                });

                // Save payment
                await createGymPayment({
                  gymId: gym.id,
                  amountInCents,
                  status: "pending",
                  paymentMethod: "pix",
                  pixTxId: pixCharge.txid,
                  pixQrCode: pixCharge.pixCopiaECola,
                  pixQrCodeImage: pixCharge.qrcode,
                  pixCopyPaste: pixCharge.pixCopiaECola,
                  description: `Assinatura ${selectedPlan.name} - ${referenceMonth}`,
                  referenceMonth,
                  dueDate,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });

                pixQrCode = pixCharge.qrcode;
                pixCopyPaste = pixCharge.pixCopiaECola;

                console.log(`[CRON] ✅ PIX payment generated for gym ${gym.id}`);
              }
            } catch (pixError) {
              console.error(`[CRON] ❌ Failed to generate PIX:`, pixError);
            }
          } else if (existingPayment.status === 'pending') {
            console.log(`[CRON] ℹ️  PIX payment already exists for gym ${gym.id}`);
            pixQrCode = existingPayment.pixQrCodeImage || undefined;
            pixCopyPaste = existingPayment.pixCopyPaste || undefined;
          }

          // Send expiration email
          const adminEmail = gym.tempAdminEmail || gym.email;
          try {
            await sendTrialExpiredEmail(
              adminEmail,
              gym.name,
              gym.slug,
              trialGracePeriodDays,
              pixQrCode,
              pixCopyPaste
            );
            console.log(`[CRON] ✅ Expiration email sent to ${adminEmail}`);
          } catch (emailError) {
            console.error(`[CRON] ❌ Failed to send expiration email:`, emailError);
          }
        }

        // Case 3: Trial expired beyond grace period - block gym
        else if (daysUntilExpiry < -trialGracePeriodDays) {
          console.log(`[CRON] 🚫 Grace period expired for gym ${gym.id}, blocking access`);

          try {
            await db.update(gyms).set({
              status: "suspended",
              planStatus: "suspended",
              blockedReason: "Período de teste expirado. Realize o pagamento para reativar o acesso.",
            }).where(eq(gyms.id, gym.id));

            console.log(`[CRON] ✅ Gym ${gym.id} blocked successfully`);
          } catch (blockError) {
            console.error(`[CRON] ❌ Failed to block gym ${gym.id}:`, blockError);
          }
        }

      } catch (gymError) {
        console.error(`[CRON] ❌ Error processing gym ${gym.id}:`, gymError);
      }
    }

    console.log("[CRON] ✅ Trial expiration check completed");

  } catch (error) {
    console.error("[CRON] ❌ Error in trial expiration check:", error);
  }
}

/**
 * Poll pending PIX payments for gym subscriptions
 * Checks payment status with Sicoob/Efí Pay and processes confirmed payments
 * Runs every minute as a fallback when webhook is not configured
 */
export async function pollGymPixPayments() {
  try {
    console.log("[CRON] 🔍 Polling pending PIX payments for gyms...");

    // Get all pending gym payments
    const { getPendingGymPayments } = await import("./db");
    const pendingPayments = await getPendingGymPayments();

    if (!pendingPayments || pendingPayments.length === 0) {
      console.log("[CRON] ℹ️  No pending PIX payments found");
      return;
    }

    console.log(`[CRON] Found ${pendingPayments.length} pending payment(s) to check`);

    // Check each payment with Efí Pay
    const { getPixServiceFromSuperAdmin } = await import("./pix");
    const pixService = await getPixServiceFromSuperAdmin();

    for (const payment of pendingPayments) {
      try {
        if (!payment.pixTxId) {
          console.log(`[CRON] ⚠️  Payment ${payment.id} has no TxID, skipping`);
          continue;
        }

        console.log(`[CRON] Checking payment ${payment.id} (TxID: ${payment.pixTxId})...`);

        // Detect service type and get status accordingly
        let isPaid = false;
        let paidAtDate: Date | undefined;

        // Check if it's Mercado Pago service (has getPaymentStatus method)
        if ('getPaymentStatus' in pixService && typeof pixService.getPaymentStatus === 'function') {
          // Mercado Pago
          const mpStatus = await pixService.getPaymentStatus(payment.pixTxId);
          console.log(`[CRON] Payment ${payment.id} status (Mercado Pago): ${mpStatus}`);

          isPaid = mpStatus === 'approved';
          paidAtDate = isPaid ? new Date() : undefined;
        } else {
          // Sicoob (has checkPaymentStatus method)
          const paymentStatus = await pixService.checkPaymentStatus(payment.pixTxId);
          console.log(`[CRON] Payment ${payment.id} status (Sicoob): ${paymentStatus.status}`);

          isPaid = paymentStatus.status === "CONCLUIDA";
          paidAtDate = paymentStatus.paidAt;
        }

        // If payment is confirmed, process it via webhook function
        if (isPaid) {
          console.log(`[CRON] ✅ Payment ${payment.id} is confirmed! Processing...`);

          const { processPixWebhook } = await import("./pixWebhook");

          // Simulate webhook payload
          const webhookPayload = {
            pix: [{
              txid: payment.pixTxId,
              endToEndId: `E${Date.now()}`,
              valor: (payment.amountInCents / 100).toFixed(2),
              horario: paidAtDate?.toISOString() || new Date().toISOString()
            }]
          };

          await processPixWebhook(webhookPayload);

          console.log(`[CRON] ✅ Payment ${payment.id} processed successfully via polling`);
        }

      } catch (paymentError: any) {
        // Ignore 404 errors (charge not found) - it might not have been created yet in Efí Pay
        if (paymentError.message?.includes("404") || paymentError.message?.includes("not found")) {
          console.log(`[CRON] ℹ️  Payment ${payment.id} not found in Efí Pay yet, will check again later`);
        }
        // Ignore connection timeouts and network errors (old Sicoob payments)
        else if (paymentError.message?.includes("ECONNRESET") ||
                 paymentError.message?.includes("ETIMEDOUT") ||
                 paymentError.message?.includes("ENOTFOUND") ||
                 paymentError.message?.includes("timeout")) {
          console.log(`[CRON] ⚠️  Payment ${payment.id} connection timeout, will retry later (${paymentError.message})`);
        } else {
          console.error(`[CRON] ❌ Error checking payment ${payment.id}:`, paymentError);
        }
      }
    }

    console.log("[CRON] ✅ PIX payment polling completed");

  } catch (error) {
    console.error("[CRON] ❌ Error in PIX payment polling:", error);
  }
}

/**
 * Generate monthly billing cycles for all active gyms
 * Runs on the 1st of each month at 00:00
 */
export async function generateMonthlyBillingCycles() {
  try {
    console.log("[CRON] 💰 Generating monthly billing cycles...");

    // Get Super Admin settings for billing configuration
    const { getSuperAdminSettings, listGyms, listSaasPlans, createBillingCycle, getBillingCycleByGymAndMonth } = await import("./db");
    const settings = await getSuperAdminSettings();

    if (!settings || settings.billingEnabled !== 'Y') {
      console.log("[CRON] ⏭️  Billing disabled, skipping generation");
      return;
    }

    const dueDay = settings.billingDueDay || 10; // Default to day 10
    const now = new Date();
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log(`[CRON] Configuration:`);
    console.log(`  - Due day: ${dueDay}`);
    console.log(`  - Reference month: ${referenceMonth}`);

    // Get all active gyms
    const allGyms = await listGyms();
    const activeGyms = allGyms.filter(g => g.status === 'active' && g.planStatus === 'active');

    if (activeGyms.length === 0) {
      console.log("[CRON] ℹ️  No active gyms found");
      return;
    }

    console.log(`[CRON] Found ${activeGyms.length} active gym(s)`);

    // Get SaaS plans for pricing
    const allPlans = await listSaasPlans(false);
    const plansMap: Record<string, any> = {};
    allPlans.forEach((p: any) => {
      plansMap[p.slug] = p;
    });

    for (const gym of activeGyms) {
      try {
        // Check if billing already exists for this month
        const existingBilling = await getBillingCycleByGymAndMonth(gym.id, referenceMonth);

        if (existingBilling) {
          console.log(`[CRON] ℹ️  Billing cycle already exists for gym ${gym.id} (${gym.name})`);
          continue;
        }

        // Get plan pricing
        const selectedPlan = plansMap[gym.plan];
        if (!selectedPlan) {
          console.log(`[CRON] ⚠️  No plan found for gym ${gym.id} (plan: ${gym.plan})`);
          continue;
        }

        // Calculate due date (set time to noon to avoid timezone issues)
        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay, 12, 0, 0);

        // Create billing cycle
        await createBillingCycle({
          gymId: gym.id,
          referenceMonth,
          dueDate,
          amountCents: selectedPlan.priceInCents,
          status: 'pending',
          createdAt: new Date(),
        });

        console.log(`[CRON] ✅ Created billing cycle for gym ${gym.id} (${gym.name}) - R$ ${(selectedPlan.priceInCents / 100).toFixed(2)}`);

      } catch (gymError) {
        console.error(`[CRON] ❌ Error creating billing for gym ${gym.id}:`, gymError);
      }
    }

    console.log("[CRON] ✅ Monthly billing generation completed");

  } catch (error) {
    console.error("[CRON] ❌ Error in monthly billing generation:", error);
  }
}

/**
 * Send billing notifications X days before due date
 * Runs daily at 09:00
 */
export async function sendBillingNotifications() {
  try {
    console.log("[CRON] 📧 Sending billing notifications...");

    // Get Super Admin settings
    const { getSuperAdminSettings, getPendingBillingCycles, getGymById, updateBillingCycle } = await import("./db");
    const { sendEmail } = await import("./email");
    const settings = await getSuperAdminSettings();

    if (!settings || settings.billingEnabled !== 'Y') {
      console.log("[CRON] ⏭️  Billing disabled, skipping notifications");
      return;
    }

    const advanceDays = settings.billingAdvanceDays || 10;
    console.log(`[CRON] Sending notifications ${advanceDays} days before due date`);

    // Get all pending billing cycles
    const pendingBillings = await getPendingBillingCycles();

    if (!pendingBillings || pendingBillings.length === 0) {
      console.log("[CRON] ℹ️  No pending billing cycles found");
      return;
    }

    const now = Date.now();

    for (const billing of pendingBillings) {
      try {
        // Skip if already notified
        if (billing.notifiedAt) {
          continue;
        }

        const dueDate = new Date(billing.dueDate).getTime();
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        // Send notification if within advance days window
        if (daysUntilDue <= advanceDays && daysUntilDue >= 0) {
          const gym = await getGymById(billing.gymId);
          if (!gym) {
            console.log(`[CRON] ⚠️  Gym ${billing.gymId} not found`);
            continue;
          }

          const adminEmail = gym.tempAdminEmail || gym.email;
          const formattedAmount = (billing.amountCents / 100).toFixed(2);
          const formattedDate = new Date(billing.dueDate).toLocaleDateString('pt-BR');

          // Send email
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .amount { font-size: 24px; font-weight: bold; color: #667eea; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>💰 Mensalidade SysFit Pro</h1>
                </div>
                <div class="content">
                  <p>Olá <strong>${gym.name}</strong>,</p>

                  <p>Sua mensalidade do SysFit Pro vence em breve.</p>

                  <p><strong>Valor:</strong> <span class="amount">R$ ${formattedAmount}</span></p>
                  <p><strong>Vencimento:</strong> ${formattedDate}</p>
                  <p><strong>Referência:</strong> ${billing.referenceMonth}</p>

                  <p>Acesse o painel administrativo para visualizar o QR Code PIX e realizar o pagamento.</p>

                  <p><a href="https://www.sysfitpro.com.br/admin/billing" class="button">Ver Mensalidade</a></p>

                  <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe SysFit Pro</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um email automático. Por favor, não responda.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail({
            to: adminEmail,
            subject: `💰 Mensalidade SysFit Pro - Vence em ${daysUntilDue} dias`,
            html,
          });

          // Mark as notified
          await updateBillingCycle(billing.id, {
            notifiedAt: new Date(),
          });

          console.log(`[CRON] ✅ Billing notification sent to ${adminEmail} (gym: ${gym.name})`);
        }

      } catch (billingError) {
        console.error(`[CRON] ❌ Error sending notification for billing ${billing.id}:`, billingError);
      }
    }

    console.log("[CRON] ✅ Billing notifications completed");

  } catch (error) {
    console.error("[CRON] ❌ Error in billing notifications:", error);
  }
}

/**
 * Block gyms with overdue billing after grace period
 * Runs daily at 06:00
 */
export async function blockOverdueGyms() {
  try {
    console.log("[CRON] 🚫 Checking for overdue gyms to block...");

    // Get Super Admin settings
    const { getSuperAdminSettings, getOverdueBillingCycles, getGymById, updateGym, updateBillingCycle } = await import("./db");
    const { sendEmail } = await import("./email");
    const settings = await getSuperAdminSettings();

    if (!settings || settings.billingEnabled !== 'Y') {
      console.log("[CRON] ⏭️  Billing disabled, skipping blocking");
      return;
    }

    const gracePeriodDays = settings.billingGracePeriodDays || 5;
    console.log(`[CRON] Grace period: ${gracePeriodDays} days`);

    // Get all overdue billing cycles
    const overdueBillings = await getOverdueBillingCycles();

    if (!overdueBillings || overdueBillings.length === 0) {
      console.log("[CRON] ℹ️  No overdue billing cycles found");
      return;
    }

    const now = Date.now();
    const blockThreshold = gracePeriodDays * 24 * 60 * 60 * 1000;

    for (const billing of overdueBillings) {
      try {
        // Skip if already blocked
        if (billing.blockedAt) {
          continue;
        }

        const dueDate = new Date(billing.dueDate).getTime();
        const daysSinceDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

        // Block if past grace period
        if (daysSinceDue > gracePeriodDays) {
          const gym = await getGymById(billing.gymId);
          if (!gym) {
            console.log(`[CRON] ⚠️  Gym ${billing.gymId} not found`);
            continue;
          }

          // Skip if already suspended
          if (gym.status === 'suspended') {
            console.log(`[CRON] ℹ️  Gym ${gym.id} (${gym.name}) already suspended`);
            await updateBillingCycle(billing.id, { blockedAt: new Date() });
            continue;
          }

          console.log(`[CRON] 🚫 Blocking gym ${gym.id} (${gym.name}) - ${daysSinceDue} days overdue`);

          // Block gym
          await updateGym(gym.id, {
            status: 'suspended',
            planStatus: 'suspended',
            blockedReason: `Mensalidade em atraso há ${daysSinceDue} dias. Regularize o pagamento para reativar o acesso.`,
          });

          // Mark billing as blocked
          await updateBillingCycle(billing.id, {
            blockedAt: new Date(),
          });

          // Send blocking notification email
          const adminEmail = gym.tempAdminEmail || gym.email;
          const formattedAmount = (billing.amountCents / 100).toFixed(2);

          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .amount { font-size: 24px; font-weight: bold; color: #ef4444; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🚫 Acesso Bloqueado</h1>
                </div>
                <div class="content">
                  <p>Olá <strong>${gym.name}</strong>,</p>

                  <div class="alert">
                    <p><strong>⚠️ Seu acesso ao SysFit Pro foi bloqueado devido à inadimplência.</strong></p>
                  </div>

                  <p>Identificamos que sua mensalidade está em atraso há <strong>${daysSinceDue} dias</strong>.</p>

                  <p><strong>Valor em atraso:</strong> <span class="amount">R$ ${formattedAmount}</span></p>
                  <p><strong>Referência:</strong> ${billing.referenceMonth}</p>

                  <p>Para reativar seu acesso, realize o pagamento da mensalidade pendente o mais rápido possível.</p>

                  <p><a href="https://www.sysfitpro.com.br/admin/billing" class="button">Pagar Agora</a></p>

                  <p><strong>Como regularizar:</strong></p>
                  <ul>
                    <li>Acesse o painel e pague via PIX</li>
                    <li>Entre em contato conosco: suporte@sysfitpro.com.br</li>
                  </ul>

                  <p>Após a confirmação do pagamento, seu acesso será reativado automaticamente.</p>

                  <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe SysFit Pro</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um email automático. Por favor, não responda.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail({
            to: adminEmail,
            subject: `🚫 Acesso Bloqueado - SysFit Pro`,
            html,
          });

          console.log(`[CRON] ✅ Gym ${gym.id} (${gym.name}) blocked and notified`);
        }

      } catch (billingError) {
        console.error(`[CRON] ❌ Error blocking gym for billing ${billing.id}:`, billingError);
      }
    }

    console.log("[CRON] ✅ Overdue gym blocking completed");

  } catch (error) {
    console.error("[CRON] ❌ Error in overdue gym blocking:", error);
  }
}
