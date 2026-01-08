import { z } from "zod";
import { router, superAdminProcedure } from "../_core/trpc";
import * as db from "../db";

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
        pixClientId: z.string().optional(),
        pixClientSecret: z.string().optional(),
        pixCertificate: z.string().optional(),
        pixKey: z.string().optional(),
        pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional(),
        merchantName: z.string().optional(),
        merchantCity: z.string().optional(),
        bankName: z.string().optional(),
        bankAccount: z.string().optional(),
        bankAgency: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateSuperAdminSettings(input);
      return { success: true };
    }),
});
