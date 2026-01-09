import * as db from "./db";
import { sendPaymentConfirmationEmail, sendGymPaymentConfirmedEmail } from "./email";
import { generateReceiptHTML, generateReceiptFilename } from "./receipt";
import { storagePut } from "./storage";

/**
 * Process PIX webhook notification from Efí Pay
 * This is called when a PIX payment is completed
 */
export async function processPixWebhook(payload: any) {
  console.log("[PIX Webhook] Received notification:", JSON.stringify(payload, null, 2));

  try {
    // Extract payment information from webhook
    const { pix } = payload;

    if (!pix || pix.length === 0) {
      console.warn("[PIX Webhook] No PIX data in payload");
      return { success: false, error: "No PIX data" };
    }

    // Get first PIX transaction
    const pixTransaction = pix[0];
    const txid = pixTransaction.txid;
    const e2eId = pixTransaction.endToEndId;
    const amountInCents = Math.round(parseFloat(pixTransaction.valor) * 100);
    const paidAt = new Date(pixTransaction.horario);

    console.log(`[PIX Webhook] Processing txid: ${txid}, amount: ${amountInCents}, paidAt: ${paidAt}`);

    // ========== STEP 1: CHECK IF IT'S A GYM SUBSCRIPTION PAYMENT ==========
    const gymPayment = await db.getGymPaymentByPixTxId(txid);

    if (gymPayment) {
      console.log(`[PIX Webhook] 🏢 Detected GYM SUBSCRIPTION payment - ID: ${gymPayment.id}`);

      // Check if already processed
      if (gymPayment.status === "paid") {
        console.log(`[PIX Webhook] Gym payment ${gymPayment.id} already processed`);
        return { success: true, message: "Already processed" };
      }

      // Update payment status
      await db.updateGymPayment(gymPayment.id, gymPayment.gymId, {
        status: "paid",
        paidAt,
      });

      console.log(`[PIX Webhook] ✅ Gym payment ${gymPayment.id} marked as paid`);

      // Get gym
      const gym = await db.getGymById(gymPayment.gymId);
      if (!gym) {
        console.error("[PIX Webhook] Gym not found");
        return { success: false, error: "Gym not found" };
      }

      // Send admin credentials if this is the first payment (onboarding)
      try {
        if (gym.tempAdminPassword && gym.tempAdminEmail) {
          // Salvar email antes de limpar
          const adminEmail = gym.tempAdminEmail;

          console.log(`[PIX Webhook] 📧 Sending admin credentials to ${adminEmail}...`);

          const { sendGymAdminCredentials } = await import("./email");
          await sendGymAdminCredentials(
            adminEmail,
            gym.tempAdminPassword,
            gym.name,
            gym.slug,
            gym.plan
          );

          console.log(`[PIX Webhook] ✅ Credentials sent successfully!`);

          // Clear temp credentials and activate plan
          await db.updateGym(gym.id, {
            tempAdminPassword: null,
            tempAdminEmail: null,
            status: "active",              // ✅ Desbloquear academia
            planStatus: "active",          // ✅ Ativar plano
            blockedReason: null,           // ✅ Limpar motivo do bloqueio
            subscriptionStartsAt: paidAt,
            nextBillingDate: new Date(paidAt.getFullYear(), paidAt.getMonth() + 1, 10),
          });

          console.log(`[PIX Webhook] ✅ Gym ${gym.id} plan activated and unblocked - subscription starts!`);

          // Enviar email de confirmação de pagamento e ativação
          console.log(`[PIX Webhook] 📧 Sending payment confirmation email to ${adminEmail}...`);
          await sendGymPaymentConfirmedEmail(
            adminEmail,
            gym.name,
            gym.slug,
            gym.plan
          );
          console.log(`[PIX Webhook] ✅ Payment confirmation email sent!`);
        } else {
          console.log(`[PIX Webhook] ℹ️ No temp credentials found - this is a recurring payment`);

          // For recurring payments, just update next billing date
          await db.updateGym(gym.id, {
            nextBillingDate: new Date(paidAt.getFullYear(), paidAt.getMonth() + 1, 10),
            planStatus: "active", // Ensure plan stays active
          });

          console.log(`[PIX Webhook] ✅ Gym ${gym.id} billing updated for next month`);
        }
      } catch (emailError) {
        console.error("[PIX Webhook] Failed to send credentials:", emailError);
        // Don't fail the webhook if email fails
      }

      return {
        success: true,
        paymentId: gymPayment.id,
        gymId: gym.id,
        message: "Gym subscription payment confirmed and processed"
      };
    }

    // ========== STEP 2: CHECK IF IT'S A BILLING CYCLE PAYMENT ==========
    console.log(`[PIX Webhook] Not a gym subscription, checking for billing cycle payment...`);

    // Try to find a billing cycle linked to a gym payment with this txid
    const allGymsForBilling = await db.listGyms();

    for (const gym of allGymsForBilling) {
      // First, try to find the gym payment with this txid
      const gymPaymentForBilling = await db.getGymPaymentByPixTxId(txid);

      if (gymPaymentForBilling) {
        // Now check if this payment is linked to a billing cycle
        const billingCycles = await db.getBillingCyclesByPaymentId(gymPaymentForBilling.id);

        if (billingCycles && billingCycles.length > 0) {
          const billingCycle = billingCycles[0];
          console.log(`[PIX Webhook] 💰 Detected BILLING CYCLE payment - Cycle ID: ${billingCycle.id}, Gym ID: ${billingCycle.gymId}`);

          // Check if already processed
          if (billingCycle.status === "paid") {
            console.log(`[PIX Webhook] Billing cycle ${billingCycle.id} already processed`);
            return { success: true, message: "Already processed" };
          }

          // Update billing cycle status
          await db.updateBillingCycle(billingCycle.id, {
            status: "paid",
            paidAt,
          });

          console.log(`[PIX Webhook] ✅ Billing cycle ${billingCycle.id} marked as paid`);

          // Get gym to unblock if needed
          const gymForBilling = await db.getGymById(billingCycle.gymId);
          if (!gymForBilling) {
            console.error("[PIX Webhook] Gym not found for billing cycle");
            return { success: false, error: "Gym not found" };
          }

          // Unblock gym if it was suspended due to non-payment
          if (gymForBilling.status === "suspended" || gymForBilling.planStatus === "suspended") {
            await db.updateGym(gymForBilling.id, {
              status: "active",
              planStatus: "active",
              blockedReason: null,
            });

            console.log(`[PIX Webhook] ✅ Gym ${gymForBilling.id} (${gymForBilling.name}) unblocked after billing payment`);
          }

          // Send confirmation email to gym admin
          try {
            // Get gym admin user
            const admins = await db.getUsersByRole(gymForBilling.id, "admin");
            const adminUser = admins[0];

            if (adminUser?.email) {
              console.log(`[PIX Webhook] 📧 Sending billing confirmation email to ${adminUser.email}...`);

              const { sendGymBillingConfirmedEmail } = await import("./email");
              await sendGymBillingConfirmedEmail(
                adminUser.email,
                gymForBilling.name,
                billingCycle.referenceMonth,
                amountInCents,
                paidAt
              );

              console.log(`[PIX Webhook] ✅ Billing confirmation email sent!`);
            }
          } catch (emailError) {
            console.error("[PIX Webhook] Failed to send billing confirmation email:", emailError);
            // Don't fail the webhook if email fails
          }

          return {
            success: true,
            billingCycleId: billingCycle.id,
            gymId: gymForBilling.id,
            message: "Billing cycle payment confirmed and gym unblocked"
          };
        }
      }
    }

    // ========== STEP 3: CHECK IF IT'S A STUDENT PAYMENT ==========
    console.log(`[PIX Webhook] Not a billing cycle payment, checking for student payment...`);

    // Try to find payment by txid in all gyms
    // (we need to search across gyms since webhook doesn't include gymId)
    const allGyms = await db.listGyms();

    let payment: any = null;
    let gymId: number | null = null;

    for (const gym of allGyms) {
      const foundPayment = await db.getPaymentByPixTxId(txid, gym.id);
      if (foundPayment) {
        payment = foundPayment;
        gymId = gym.id;
        break;
      }
    }

    if (!payment || !gymId) {
      console.warn(`[PIX Webhook] Payment not found for txid: ${txid}`);

      // Still save webhook for debugging
      await db.createPixWebhook({
        gymId: allGyms[0]?.id || 1, // Fallback to first gym
        txId: txid,
        e2eId,
        paymentId: null,
        status: "CONCLUIDA",
        amountInCents,
        payload: JSON.stringify(payload),
        processedAt: new Date(),
      });

      return { success: false, error: "Payment not found" };
    }

    // Check if already processed
    if (payment.status === "paid") {
      console.log(`[PIX Webhook] Payment ${payment.id} already processed`);
      return { success: true, message: "Already processed" };
    }

    // Get student and gym info
    const student = await db.getStudentById(payment.studentId, gymId);
    const gym = await db.getGymById(gymId);

    if (!student || !gym) {
      console.error("[PIX Webhook] Student or gym not found");
      return { success: false, error: "Student or gym not found" };
    }

    // Generate receipt
    const user = await db.getUserById(student.userId);
    const receiptHTML = generateReceiptHTML({
      paymentId: payment.id,
      studentName: user?.name || "Aluno",
      studentCpf: student.cpf,
      amount: amountInCents,
      paidAt,
      paymentMethod: "pix",
      gymName: gym.name,
      description: "Mensalidade",
    });

    // Save receipt to S3
    const filename = generateReceiptFilename(payment.id);
    const receiptResult = await storagePut(
      filename,
      Buffer.from(receiptHTML, "utf-8"),
      "text/html"
    );

    // Update payment status
    await db.updatePayment(payment.id, gymId, {
      status: "paid",
      paidAt,
      receiptUrl: receiptResult.url,
    });

    console.log(`[PIX Webhook] Payment ${payment.id} marked as paid`);

    // Send confirmation email
    if (user?.email) {
      try {
        await sendPaymentConfirmationEmail(
          user.email,
          user.name || "Aluno",
          amountInCents,
          payment.dueDate
        );
        console.log(`[PIX Webhook] Confirmation email sent to ${user.email}`);
      } catch (emailError) {
        console.error("[PIX Webhook] Failed to send email:", emailError);
        // Don't fail the webhook if email fails
      }
    }

    // Activate student membership if inactive
    if (student.membershipStatus === "inactive" || student.membershipStatus === "blocked") {
      await db.updateStudentMembershipStatus(student.id, gymId, "active");
      console.log(`[PIX Webhook] Student ${student.id} membership activated`);

      // Unblock access in Control ID if exists
      if (student.controlIdUserId) {
        try {
          await unblockStudentAccess(student.id, gymId);
          console.log(`[PIX Webhook] Student ${student.id} unblocked in Control ID`);
        } catch (controlIdError) {
          console.error("[PIX Webhook] Failed to unblock in Control ID:", controlIdError);
          // Don't fail the webhook if Control ID fails
        }
      }
    }

    // Save webhook record
    await db.createPixWebhook({
      gymId,
      txId: txid,
      e2eId,
      paymentId: payment.id,
      status: "CONCLUIDA",
      amountInCents,
      payload: JSON.stringify(payload),
      processedAt: new Date(),
    });

    console.log(`[PIX Webhook] Processing completed successfully for payment ${payment.id}`);

    return {
      success: true,
      paymentId: payment.id,
      studentId: student.id,
      message: "Payment confirmed and access activated"
    };

  } catch (error: any) {
    console.error("[PIX Webhook] Error processing webhook:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Unblock student access in all Control ID devices
 */
async function unblockStudentAccess(studentId: number, gymId: number) {
  const student = await db.getStudentById(studentId, gymId);

  if (!student || !student.controlIdUserId) {
    return;
  }

  // Unblock in Control ID devices (if configured)
  try {
    const { getControlIdServiceForGym } = await import("./controlId");
    const service = await getControlIdServiceForGym(gymId);

    if (service) {
      await service.unblockUserAccess(student.controlIdUserId, 1);
      console.log(`[Control ID] ✅ Student ${student.name} (ID ${student.id}) unblocked - payment received`);
    }
  } catch (error) {
    console.error(`[Control ID] ❌ Failed to unblock student ${student.id}:`, error);
    // Continue even if Control ID fails
  }
}
