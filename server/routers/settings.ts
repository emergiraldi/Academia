import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = router({
  /**
   * Get site settings - returns the singleton settings record
   */
  get: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [settings] = await db.select().from(siteSettings).limit(1);

    // If no settings exist, return defaults
    if (!settings) {
      return {
        id: 1,
        siteName: "SysFit Pro",
        logoUrl: null,
        primaryColor: "#6366f1",
        secondaryColor: "#8b5cf6",
        heroTitle: "Sistema Completo para Academias Modernas",
        heroSubtitle: "Gerencie sua academia com eficiência total",
        heroDescription: "Controle biométrico Control ID, integração Wellhub, PIX automático e app mobile para alunos.",
        banner1Title: "Control ID - Reconhecimento Facial",
        banner1Description: "Integração com Control ID para controle de acesso biométrico",
        banner1Image: null,
        banner2Title: "Integração Wellhub (Gympass)",
        banner2Description: "Sincronização automática com Wellhub",
        banner2Image: null,
        basicPrice: 149,
        professionalPrice: 299,
        enterprisePrice: 599,
        contactEmail: "contato@sysfit.com.br",
        contactPhone: "(11) 99999-9999",
        whatsappNumber: "5511999999999",
        facebookUrl: null,
        instagramUrl: null,
        linkedinUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return settings;
  }),

  /**
   * Update site settings - creates if doesn't exist, updates if exists
   */
  update: publicProcedure
    .input(
      z.object({
        // Branding
        siteName: z.string().min(1).optional(),
        logoUrl: z.string().nullable().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),

        // Hero
        heroTitle: z.string().optional(),
        heroSubtitle: z.string().optional(),
        heroDescription: z.string().nullable().optional(),

        // Banners
        banner1Title: z.string().nullable().optional(),
        banner1Description: z.string().nullable().optional(),
        banner1Image: z.string().nullable().optional(),
        banner2Title: z.string().nullable().optional(),
        banner2Description: z.string().nullable().optional(),
        banner2Image: z.string().nullable().optional(),

        // Pricing
        basicPrice: z.number().int().positive().optional(),
        professionalPrice: z.number().int().positive().optional(),
        enterprisePrice: z.number().int().positive().optional(),

        // Contact
        contactEmail: z.string().email().nullable().optional(),
        contactPhone: z.string().nullable().optional(),
        whatsappNumber: z.string().nullable().optional(),

        // Social Media
        facebookUrl: z.string().url().nullable().optional(),
        instagramUrl: z.string().url().nullable().optional(),
        linkedinUrl: z.string().url().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if settings exist
      const [existing] = await db.select().from(siteSettings).limit(1);

      if (existing) {
        // Update existing record
        await db
          .update(siteSettings)
          .set(input)
          .where(eq(siteSettings.id, existing.id));

        const [updated] = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.id, existing.id));

        return updated;
      } else {
        // Create new record
        const [result] = await db.insert(siteSettings).values(input as any);
        const [created] = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.id, Number(result.insertId)));

        return created;
      }
    }),
});
