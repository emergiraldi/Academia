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
        const logs = await service.loadAccessLogs();

        if (!logs || logs.length === 0) {
          console.log(`[CRON] No access logs found for gym ${gym.id}`);
          continue;
        }

        console.log(`[CRON] Found ${logs.length} access logs from Control ID for gym ${gym.id}`);

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

            // Parse timestamp (Control ID usa Unix timestamp em segundos)
            const timestamp = new Date(log.time * 1000);

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

          } catch (logError) {
            console.error(`[CRON] Error processing individual log:`, logError);
          }
        }

        console.log(`[CRON] ✅ Synced ${newLogs} new access logs for gym ${gym.id}`);

      } catch (gymError) {
        console.error(`[CRON] Error syncing access logs for gym ${gym.id}:`, gymError);
      }
    }

    console.log("[CRON] ✅ Access logs sync completed");

  } catch (error) {
    console.error("[CRON] ❌ Error in access logs sync:", error);
  }
}
