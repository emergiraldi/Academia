import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";

// Helper to check if user is super admin
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso de super administrador necessário" });
  }
  return next({ ctx });
});

export const landingPageScreenshotsRouter = router({
  /**
   * List all active screenshots (public for landing page)
   */
  listActive: publicProcedure.query(async () => {
    return await db.listLandingPageScreenshots(true); // Only active screenshots
  }),

  /**
   * List all screenshots (super admin)
   */
  list: superAdminProcedure.query(async () => {
    return await db.listLandingPageScreenshots(false); // All screenshots
  }),

  /**
   * Get screenshot by ID (super admin)
   */
  getById: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const screenshot = await db.getLandingPageScreenshotById(input.id);
      if (!screenshot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Screenshot não encontrado" });
      }
      return screenshot;
    }),

  /**
   * Create new screenshot (super admin only)
   */
  create: superAdminProcedure
    .input(z.object({
      title: z.string().min(1, "Título é obrigatório"),
      description: z.string().optional(),
      imageUrl: z.string().min(1, "URL da imagem é obrigatória"),
      displayOrder: z.number().default(0),
      active: z.string().default("Y"),
    }))
    .mutation(async ({ input }) => {
      await db.createLandingPageScreenshot({
        ...input,
      });

      return { success: true, message: "Screenshot criado com sucesso!" };
    }),

  /**
   * Update screenshot (super admin only)
   */
  update: superAdminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1, "Título é obrigatório").optional(),
      description: z.string().optional(),
      imageUrl: z.string().min(1, "URL da imagem é obrigatória").optional(),
      displayOrder: z.number().optional(),
      active: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // Check if screenshot exists
      const screenshot = await db.getLandingPageScreenshotById(id);
      if (!screenshot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Screenshot não encontrado" });
      }

      await db.updateLandingPageScreenshot(id, data);

      return { success: true, message: "Screenshot atualizado com sucesso!" };
    }),

  /**
   * Delete screenshot (super admin only)
   */
  delete: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const screenshot = await db.getLandingPageScreenshotById(input.id);
      if (!screenshot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Screenshot não encontrado" });
      }

      await db.deleteLandingPageScreenshot(input.id);

      return { success: true, message: "Screenshot deletado com sucesso!" };
    }),
});
