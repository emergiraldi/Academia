import { eq, and, asc } from "drizzle-orm";
import { getDb } from "./db";
import { gyms, payments, students, users, whatsappBillingLogs, billingStages } from "../drizzle/schema";
import { sendMessage } from "./whatsapp";

/**
 * Check if a billing message was already sent for a payment+stage
 */
async function wasAlreadySent(
  paymentId: number,
  stage: string
): Promise<boolean> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: whatsappBillingLogs.id })
    .from(whatsappBillingLogs)
    .where(
      and(
        eq(whatsappBillingLogs.paymentId, paymentId),
        eq(whatsappBillingLogs.stage, stage),
        eq(whatsappBillingLogs.status, "sent")
      )
    )
    .limit(1);

  return !!existing;
}

/**
 * Log a billing message attempt
 */
async function logBillingMessage(
  gymId: number,
  paymentId: number,
  studentId: number,
  stage: string,
  message: string,
  status: "sent" | "failed",
  errorMessage?: string
) {
  const db = await getDb();
  await db.insert(whatsappBillingLogs).values({
    gymId,
    paymentId,
    studentId,
    stage,
    message,
    status,
    errorMessage: errorMessage || null,
    sentAt: status === "sent" ? new Date() : null,
  });
}

/**
 * Replace template placeholders with actual values
 */
function applyTemplate(
  template: string,
  data: {
    studentName: string;
    dueDate: string;
    amount: string;
    gymName: string;
    daysOverdue?: number;
  }
): string {
  return template
    .replace(/\{nome\}/gi, data.studentName)
    .replace(/\{vencimento\}/gi, data.dueDate)
    .replace(/\{valor\}/gi, data.amount)
    .replace(/\{academia\}/gi, data.gymName)
    .replace(/\{dias_atraso\}/gi, String(data.daysOverdue || 0));
}

/**
 * Default billing message templates
 */
const DEFAULT_TEMPLATES = {
  reminder: `Olá {nome}! 👋\n\nLembramos que sua mensalidade no valor de R$ {valor} vence em {vencimento}.\n\nEvite atrasos e mantenha sua matrícula em dia!\n\n{academia}`,
  due_date: `Olá {nome}! 👋\n\nSua mensalidade no valor de R$ {valor} vence hoje ({vencimento}).\n\nRealize o pagamento para continuar treinando sem interrupções!\n\n{academia}`,
  overdue: `Olá {nome}! 👋\n\nSua mensalidade no valor de R$ {valor} venceu em {vencimento} e está com {dias_atraso} dia(s) de atraso.\n\nRegularize sua situação para manter o acesso à academia.\n\n{academia}`,
};

/**
 * Process automatic billing messages for all gyms or a specific gym
 */
export async function processAutomaticBilling(gymId?: number, manual?: boolean) {
  const db = await getDb();

  // Get gyms to process
  const gymFilter = gymId ? and(eq(gyms.id, gymId), eq(gyms.status, "active")) : eq(gyms.status, "active");
  const activeGyms = await db
    .select({
      id: gyms.id,
      name: gyms.name,
      wahaUrl: gyms.wahaUrl,
    })
    .from(gyms)
    .where(gymFilter!);

  const results: Array<{
    gymId: number;
    gymName: string;
    sent: number;
    skipped: number;
    failed: number;
    errors: string[];
  }> = [];

  for (const gym of activeGyms) {
    // Skip gyms without WAHA configured
    if (!gym.wahaUrl) {
      continue;
    }

    const result = {
      gymId: gym.id,
      gymName: gym.name,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get pending payments with student info
    const pendingPayments = await db
      .select({
        id: payments.id,
        studentId: payments.studentId,
        amountInCents: payments.amountInCents,
        dueDate: payments.dueDate,
        status: payments.status,
        studentPhone: students.phone,
        userName: users.name,
        userId: students.userId,
      })
      .from(payments)
      .innerJoin(students, eq(payments.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .where(
        and(
          eq(payments.gymId, gym.id),
          eq(payments.status, "pending")
        )
      );

    // Get custom billing stages for this gym
    const customStages = await db
      .select()
      .from(billingStages)
      .where(
        and(
          eq(billingStages.gymId, gym.id),
          eq(billingStages.enabled, true)
        )
      )
      .orderBy(asc(billingStages.displayOrder));

    for (const payment of pendingPayments) {
      if (!payment.studentPhone) {
        continue;
      }

      const now = new Date();
      const dueDate = new Date(payment.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const stagesToProcess: Array<{ stage: string; template: string }> = [];

      // === REMINDER (3 days before due date) ===
      if (diffDays === 3) {
        stagesToProcess.push({
          stage: "reminder",
          template: DEFAULT_TEMPLATES.reminder,
        });
      }

      // === DUE DATE (on the due date) ===
      if (diffDays === 0) {
        stagesToProcess.push({
          stage: "due_date",
          template: DEFAULT_TEMPLATES.due_date,
        });
      }

      // === OVERDUE (after due date) ===
      if (diffDays < 0) {
        stagesToProcess.push({
          stage: "overdue",
          template: DEFAULT_TEMPLATES.overdue,
        });
      }

      // === Custom stages (from billing_stages table) ===
      for (const customStage of customStages) {
        let shouldTrigger = false;
        if (customStage.triggerType === "before" && diffDays > 0 && diffDays === customStage.daysOffset) {
          shouldTrigger = true;
        } else if (customStage.triggerType === "on" && diffDays === 0) {
          shouldTrigger = true;
        } else if (customStage.triggerType === "after" && diffDays < 0 && Math.abs(diffDays) === customStage.daysOffset) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          stagesToProcess.push({
            stage: `custom_${customStage.id}`,
            template: customStage.message,
          });
        }
      }

      // Process each stage
      for (const { stage, template } of stagesToProcess) {
        if (!manual) {
          const alreadySent = await wasAlreadySent(payment.id, stage);
          if (alreadySent) {
            result.skipped++;
            continue;
          }
        }

        const dueDateStr = dueDate.toLocaleDateString("pt-BR");
        const amountStr = (payment.amountInCents / 100).toFixed(2).replace(".", ",");

        const message = applyTemplate(template, {
          studentName: payment.userName || "Aluno",
          dueDate: dueDateStr,
          amount: amountStr,
          gymName: gym.name,
          daysOverdue: diffDays < 0 ? Math.abs(diffDays) : 0,
        });

        try {
          const sendResult = await sendMessage(
            gym.id,
            payment.studentPhone,
            message
          );

          if (sendResult.success) {
            await logBillingMessage(
              gym.id,
              payment.id,
              payment.studentId,
              stage,
              message,
              "sent"
            );
            result.sent++;
          } else {
            await logBillingMessage(
              gym.id,
              payment.id,
              payment.studentId,
              stage,
              message,
              "failed",
              sendResult.error
            );
            result.failed++;
            result.errors.push(
              `Payment ${payment.id}: ${sendResult.error}`
            );
          }
        } catch (error: any) {
          await logBillingMessage(
            gym.id,
            payment.id,
            payment.studentId,
            stage,
            message,
            "failed",
            error.message
          );
          result.failed++;
          result.errors.push(`Payment ${payment.id}: ${error.message}`);
        }
      }
    }

    results.push(result);
  }

  return results;
}
