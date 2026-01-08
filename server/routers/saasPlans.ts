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

export const saasPlansRouter = router({
  /**
   * List all active SaaS plans (public for landing page)
   */
  listActive: publicProcedure.query(async () => {
    return await db.listSaasPlans(true); // Only active plans
  }),

  /**
   * List all SaaS plans (super admin)
   */
  list: superAdminProcedure.query(async () => {
    return await db.listSaasPlans(false); // All plans
  }),

  /**
   * Get SaaS plan by slug (public)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const plan = await db.getSaasPlanBySlug(input.slug);
      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
      }
      return plan;
    }),

  /**
   * Create new SaaS plan (super admin only)
   */
  create: superAdminProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      slug: z.string().min(1, "Slug é obrigatório"),
      description: z.string().optional(),
      priceInCents: z.number().min(0, "Preço deve ser maior ou igual a zero"),
      features: z.string().optional(), // JSON string
      hasWellhub: z.boolean().default(false),
      hasControlId: z.boolean().default(false),
      hasAdvancedReports: z.boolean().default(false),
      hasWhatsappIntegration: z.boolean().default(false),
      hasPrioritySupport: z.boolean().default(false),
      featured: z.boolean().default(false),
      displayOrder: z.number().default(0),
      active: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      // Check if slug already exists
      const existingPlan = await db.getSaasPlanBySlug(input.slug);
      if (existingPlan) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Slug já está em uso" });
      }

      await db.createSaasPlan({
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, message: "Plano criado com sucesso!" };
    }),

  /**
   * Update SaaS plan (super admin only)
   */
  update: superAdminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1, "Nome é obrigatório").optional(),
      slug: z.string().min(1, "Slug é obrigatório").optional(),
      description: z.string().optional(),
      priceInCents: z.number().min(0, "Preço deve ser maior ou igual a zero").optional(),
      features: z.string().optional(), // JSON string
      hasWellhub: z.boolean().optional(),
      hasControlId: z.boolean().optional(),
      hasAdvancedReports: z.boolean().optional(),
      hasWhatsappIntegration: z.boolean().optional(),
      hasPrioritySupport: z.boolean().optional(),
      featured: z.boolean().optional(),
      displayOrder: z.number().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // Check if plan exists
      const plan = await db.getSaasPlanById(id);
      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
      }

      // If slug is being updated, check if it's unique
      if (data.slug && data.slug !== plan.slug) {
        const existingPlan = await db.getSaasPlanBySlug(data.slug);
        if (existingPlan) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Slug já está em uso" });
        }
      }

      await db.updateSaasPlan(id, data);

      return { success: true, message: "Plano atualizado com sucesso!" };
    }),

  /**
   * Delete SaaS plan (super admin only)
   */
  delete: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const plan = await db.getSaasPlanById(input.id);
      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
      }

      // TODO: Check if any gyms are using this plan before deleting
      // For now, just delete it

      await db.deleteSaasPlan(input.id);

      return { success: true, message: "Plano deletado com sucesso!" };
    }),
});
