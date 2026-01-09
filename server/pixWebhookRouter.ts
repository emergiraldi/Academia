import express from "express";
import { processPixWebhook } from "./pixWebhook";

const router = express.Router();

/**
 * PIX Webhook endpoint
 * Receives notifications from Sicoob/Efí Pay when PIX payments are completed
 *
 * URL to configure in payment provider:
 * https://www.sysfitpro.com.br/api/webhooks/pix
 */
router.post("/api/webhooks/pix", async (req, res) => {
  console.log("[PIX Webhook Router] Received webhook notification");
  console.log("[PIX Webhook Router] Payload:", JSON.stringify(req.body, null, 2));

  try {
    const result = await processPixWebhook(req.body);

    console.log("[PIX Webhook Router] Processing result:", result);

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("[PIX Webhook Router] Error processing webhook:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

export default router;
