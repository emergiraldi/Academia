import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

// Helper to check if user is super admin
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso de super administrador necessário" });
  }
  return next({ ctx });
});

/**
 * Super Admin Settings Router
 * Manages platform-level configuration for receiving gym subscription payments
 */
export const superAdminSettingsRouter = router({
  /**
   * Get current Super Admin settings (PIX configuration)
   */
  get: superAdminProcedure.query(async () => {
    return await db.getSuperAdminSettings();
  }),

  /**
   * Update Super Admin settings
   */
  update: superAdminProcedure
    .input(
      z.object({
        pixProvider: z.string().optional(),
        pixClientId: z.string().optional(),
        pixClientSecret: z.string().optional(),
        pixCertificate: z.string().optional(),
        pixPrivateKey: z.string().optional(),
        pixKey: z.string().optional(),
        pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional(),
        merchantName: z.string().optional(),
        merchantCity: z.string().optional(),
        pixApiUrl: z.string().optional(),
        pixTokenUrl: z.string().optional(),
        bankCode: z.string().optional(),
        bankName: z.string().optional(),
        bankAccount: z.string().optional(),
        bankAgency: z.string().optional(),
        trialEnabled: z.boolean().optional(),
        trialDays: z.number().optional(),
        trialWarningDays: z.number().optional(),
        trialGracePeriodDays: z.number().optional(),
        // SMTP settings
        smtpHost: z.string().optional(),
        smtpPort: z.number().optional(),
        smtpUser: z.string().optional(),
        smtpPassword: z.string().optional(),
        smtpFromEmail: z.string().optional(),
        smtpFromName: z.string().optional(),
        smtpUseTls: z.boolean().optional(),
        smtpUseSsl: z.boolean().optional(),
        // Billing settings
        billingEnabled: z.boolean().optional(),
        billingDueDay: z.number().optional(),
        billingAdvanceDays: z.number().optional(),
        billingGracePeriodDays: z.number().optional(),
        billingLateFeePercentage: z.number().optional(),
        billingLateFeeFixedCents: z.number().optional(),
        billingInterestRatePerDay: z.number().optional(),
        billingLateFeeType: z.enum(["percentage", "fixed", "both"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateSuperAdminSettings(input);
      return { success: true };
    }),
});
