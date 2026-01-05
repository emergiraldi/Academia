import * as db from "./db";
import { sendPaymentConfirmationEmail } from "./email";
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
