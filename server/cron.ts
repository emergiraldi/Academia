import cron from "node-cron";
import { sendDailyPaymentReminders, sendDailyMedicalExamReminders, checkAndBlockDefaulters, syncAccessLogsFromControlId, checkTrialExpirations, pollGymPixPayments, generateMonthlyBillingCycles, sendBillingNotifications, blockOverdueGyms } from "./notifications";

/**
 * Cron job scheduler for automated notifications
 */

export function startCronJobs() {
  console.log("🕐 Starting cron jobs for automated notifications...");

  // Run daily at 9:00 AM - Payment reminders (7 days before due date)
  cron.schedule("0 9 * * *", async () => {
    console.log("Running daily payment reminders job...");
    try {
      await sendDailyPaymentReminders();
    } catch (error) {
      console.error("Error in payment reminders cron job:", error);
    }
  });

  // Run daily at 10:00 AM - Medical exam reminders (15 days before expiry)
  cron.schedule("0 10 * * *", async () => {
    console.log("Running daily medical exam reminders job...");
    try {
      await sendDailyMedicalExamReminders();
    } catch (error) {
      console.error("Error in medical exam reminders cron job:", error);
    }
  });

  // Run daily at 6:00 AM - Check and block defaulters
  cron.schedule("0 6 * * *", async () => {
    console.log("Running automatic defaulter blocking job...");
    try {
      await checkAndBlockDefaulters();
    } catch (error) {
      console.error("Error in defaulter blocking cron job:", error);
    }
  });

  // Run every 30 seconds - Sync access logs from Control ID devices
  cron.schedule("*/30 * * * * *", async () => {
    console.log("Running access logs sync from Control ID...");
    try {
      await syncAccessLogsFromControlId();
    } catch (error) {
      console.error("Error in access logs sync cron job:", error);
    }
  });

  // Run daily at 8:00 AM - Check trial expirations and send warnings
  cron.schedule("0 8 * * *", async () => {
    console.log("Running trial expiration check job...");
    try {
      await checkTrialExpirations();
    } catch (error) {
      console.error("Error in trial expiration check cron job:", error);
    }
  });

  // Run every minute - Poll pending PIX payments for gyms
  cron.schedule("* * * * *", async () => {
    console.log("Running gym PIX payment polling job...");
    try {
      await pollGymPixPayments();
    } catch (error) {
      console.error("Error in gym PIX payment polling cron job:", error);
    }
  });

  // TESTE: Run every minute - Generate monthly billing cycles
  cron.schedule("* * * * *", async () => {
    console.log("Running monthly billing generation job...");
    try {
      await generateMonthlyBillingCycles();
    } catch (error) {
      console.error("Error in monthly billing generation cron job:", error);
    }
  });

  // Run daily at 5:00 AM - Block overdue gyms
  cron.schedule("0 5 * * *", async () => {
    console.log("Running overdue gym blocking job...");
    try {
      await blockOverdueGyms();
    } catch (error) {
      console.error("Error in overdue gym blocking cron job:", error);
    }
  });

  // Run daily at 9:30 AM - Send billing notifications
  cron.schedule("30 9 * * *", async () => {
    console.log("Running billing notifications job...");
    try {
      await sendBillingNotifications();
    } catch (error) {
      console.error("Error in billing notifications cron job:", error);
    }
  });

  console.log("✅ Cron jobs started successfully");
  console.log("  - Monthly billing generation: TESTE - Every minute");
  console.log("  - Overdue gym blocking: Daily at 5:00 AM");
  console.log("  - Defaulter blocking: Daily at 6:00 AM");
  console.log("  - Trial expiration check: Daily at 8:00 AM");
  console.log("  - Payment reminders: Daily at 9:00 AM");
  console.log("  - Billing notifications: Daily at 9:30 AM");
  console.log("  - Medical exam reminders: Daily at 10:00 AM");
  console.log("  - Access logs sync: Every 30 seconds");
  console.log("  - Gym PIX payment polling: Every minute");
}
