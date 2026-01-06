import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, createGymSettings } from "../db";
import { gyms, students, users } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const gymsRouter = router({
  // Listar todas as academias (super admin)
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(gyms).orderBy(desc(gyms.createdAt));
    console.log("📋 [LIST GYMS] Retornando", result.length, "academias");
    console.log("📋 [LIST GYMS] Primeira academia:", result[0] ? JSON.stringify({
      id: result[0].id,
      name: result[0].name,
      plan: result[0].plan,
      planStatus: result[0].planStatus
    }, null, 2) : "nenhuma");
    return result;
  }),

  // Obter uma academia específica pelo ID
  getById: publicProcedure
    .input(z.object({ gymId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [gym] = await db.select().from(gyms).where(eq(gyms.id, input.gymId));
      return gym;
    }),

  // Obter academia por slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [gym] = await db.select().from(gyms).where(eq(gyms.slug, input.slug));
      return gym;
    }),

  // Criar nova academia
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        slug: z.string().min(1, "Slug é obrigatório"),
        cnpj: z.string().optional(),
        email: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        plan: z.enum(["basic", "professional", "enterprise"]).optional(),
        planStatus: z.enum(["trial", "active", "suspended", "cancelled"]).optional(),
        pixKey: z.string().optional(),
        pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional(),
        merchantName: z.string().optional(),
        merchantCity: z.string().optional(),
        wellhubApiKey: z.string().optional(),
        wellhubWebhookSecret: z.string().optional(),
        adminEmail: z.string().email().optional(),
        adminName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("🟢 [CREATE GYM] Input recebido:", JSON.stringify(input, null, 2));

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Criar a academia
      const { adminEmail, adminName, ...gymData } = input;

      // Garantir que email seja fornecido (campo obrigatório no schema)
      const finalGymData = {
        ...gymData,
        email: gymData.email || gymData.contactEmail || `contato@${input.slug}.com`,
      };

      console.log("🟢 [CREATE GYM] Dados para inserir (finalGymData):", JSON.stringify(finalGymData, null, 2));

      const [result] = await db.insert(gyms).values(finalGymData);
      const gymId = Number(result.insertId);

      console.log("🟢 [CREATE GYM] Academia criada com ID:", gymId);

      // Gerar credenciais do admin
      const tempPassword = `${input.slug}@2024`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const email = adminEmail || input.contactEmail || `admin@${input.slug}.com`;
      const name = adminName || `Admin ${input.name}`;
      const openId = `gym-admin-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Criar usuário admin para a academia
      await db.insert(users).values({
        gymId,
        openId,
        email,
        password: hashedPassword,
        name,
        role: "gym_admin",
        phone: input.contactPhone || null,
      });

      return {
        gymId,
        adminCredentials: {
          email,
          password: tempPassword,
          loginUrl: `/admin/login?gym=${input.slug}`,
        },
      };
    }),

  // Auto-cadastro de academia (público)
  signUp: publicProcedure
    .input(
      z.object({
        // Dados da Academia
        gymName: z.string().min(1, "Nome da academia é obrigatório"),
        gymSlug: z.string().min(1, "Identificador é obrigatório"),
        cnpj: z.string().optional(),
        email: z.string().email("Email inválido"),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().max(2).optional(),
        zipCode: z.string().optional(),

        // Dados do Administrador
        adminName: z.string().min(1, "Nome do administrador é obrigatório"),
        adminEmail: z.string().email("Email do administrador é inválido"),
        adminPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se slug já existe
      const [existingGym] = await db.select().from(gyms).where(eq(gyms.slug, input.gymSlug));
      if (existingGym) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este identificador já está em uso. Por favor, escolha outro." });
      }

      // Verificar se email admin já existe
      const [existingAdmin] = await db.select().from(users).where(eq(users.email, input.adminEmail));
      if (existingAdmin) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este email já está cadastrado." });
      }

      // Criar a academia
      const [result] = await db.insert(gyms).values({
        name: input.gymName,
        slug: input.gymSlug,
        cnpj: input.cnpj || null,
        email: input.email,
        phone: input.phone || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zipCode: input.zipCode || null,
        plan: "basic",
        planStatus: "trial",
        status: "active",
      });

      const gymId = Number(result.insertId);

      // Criar configurações padrão para a academia
      await createGymSettings(gymId);

      // Criar usuário administrador
      const hashedPassword = await bcrypt.hash(input.adminPassword, 10);
      const openId = `gym-admin-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      await db.insert(users).values({
        gymId,
        openId,
        email: input.adminEmail,
        password: hashedPassword,
        name: input.adminName,
        role: "gym_admin",
        phone: input.phone || null,
      });

      // Retornar informações importantes
      return {
        success: true,
        gymId,
        gymSlug: input.gymSlug,
        agentId: `academia-${gymId}`, // ID para configurar no agent local
        message: "Academia cadastrada com sucesso!",
      };
    }),

  // Atualizar academia
  update: publicProcedure
    .input(
      z.preprocess(
        (data: any) => {
          // Limpar strings vazias e null, convertendo para undefined ANTES da validação
          const cleaned: any = { ...data };
          Object.keys(cleaned).forEach(key => {
            if (cleaned[key] === "" || cleaned[key] === null) {
              cleaned[key] = undefined;
            }
          });
          return cleaned;
        },
        z.object({
          gymId: z.number(),
          name: z.string().optional(),
          cnpj: z.string().optional(),
          email: z.string().optional(),
          contactEmail: z.string().optional(),
          contactPhone: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          logoUrl: z.string().optional(),
          status: z.enum(["active", "inactive", "suspended"]).optional(),
          plan: z.enum(["basic", "professional", "enterprise"]).optional(),
          planStatus: z.enum(["trial", "active", "suspended", "cancelled"]).optional(),
          pixKey: z.string().optional(),
          pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional(),
          merchantName: z.string().optional(),
          merchantCity: z.string().optional(),
          wellhubApiKey: z.string().optional(),
          wellhubWebhookSecret: z.string().optional(),
          blockedReason: z.string().optional(),
        })
      )
    )
    .mutation(async ({ input }) => {
      try {
        console.log("🔵 [UPDATE GYMS] Input recebido:", JSON.stringify(input, null, 2));

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { gymId, ...data } = input;

        console.log("🔵 [UPDATE GYMS] Dados após extrair gymId:", JSON.stringify(data, null, 2));

        // Filtrar valores undefined e strings vazias para não enviar para o banco
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, value]) => {
            // Remover undefined, null e strings vazias
            return value !== undefined && value !== null && value !== "";
          })
        );

        console.log("🔵 [UPDATE GYMS] Dados limpos:", JSON.stringify(cleanData, null, 2));

        if (Object.keys(cleanData).length > 0) {
          console.log("🔵 [UPDATE GYMS] Executando update para gymId:", gymId);
          const result = await db.update(gyms).set(cleanData).where(eq(gyms.id, gymId));
          console.log("✅ [UPDATE GYMS] Update executado! Result:", result);

          // Verificar dados salvos no banco
          const [updatedGym] = await db.select().from(gyms).where(eq(gyms.id, gymId));
          console.log("✅ [UPDATE GYMS] Dados salvos no banco:", JSON.stringify({
            id: updatedGym.id,
            name: updatedGym.name,
            plan: updatedGym.plan,
            planStatus: updatedGym.planStatus
          }, null, 2));
        } else {
          console.log("⚠️ [UPDATE GYMS] Nenhum dado para atualizar");
        }

        return { success: true };
      } catch (error) {
        console.error("❌ [UPDATE GYMS] Erro:", error);
        throw error;
      }
    }),

  // Atualizar plano SaaS
  updatePlan: publicProcedure
    .input(
      z.object({
        gymId: z.number(),
        plan: z.enum(["basic", "professional", "enterprise"]),
        planStatus: z.enum(["trial", "active", "suspended", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { gymId, plan, planStatus } = input;
      const updateData: any = { plan };

      if (planStatus) {
        updateData.planStatus = planStatus;

        // Se ativando plano, definir data de início e próximo pagamento
        if (planStatus === "active") {
          updateData.subscriptionStartsAt = new Date();
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);
          updateData.nextBillingDate = nextBilling;
          updateData.blockedReason = null;
        }
      }

      await db.update(gyms).set(updateData).where(eq(gyms.id, gymId));
      return { success: true };
    }),

  // Ativar academia
  activate: publicProcedure
    .input(z.object({ gymId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(gyms).set({
        status: "active",
        planStatus: "active",
        blockedReason: null,
      }).where(eq(gyms.id, input.gymId));

      return { success: true };
    }),

  // Desativar academia
  deactivate: publicProcedure
    .input(
      z.object({
        gymId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(gyms).set({
        status: "suspended",
        planStatus: "suspended",
        blockedReason: input.reason || "Academia desativada pelo administrador",
      }).where(eq(gyms.id, input.gymId));

      return { success: true };
    }),

  // Bloquear academia (por falta de pagamento)
  block: publicProcedure
    .input(
      z.object({
        gymId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(gyms).set({
        status: "suspended",
        planStatus: "suspended",
        blockedReason: input.reason,
      }).where(eq(gyms.id, input.gymId));

      return { success: true };
    }),

  // Desbloquear academia
  unblock: publicProcedure
    .input(z.object({ gymId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(gyms).set({
        status: "active",
        planStatus: "active",
        blockedReason: null,
      }).where(eq(gyms.id, input.gymId));

      return { success: true };
    }),

  // Resetar senha do admin da academia
  resetAdminPassword: publicProcedure
    .input(z.object({ gymId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar a academia
      const [gym] = await db.select().from(gyms).where(eq(gyms.id, input.gymId));
      if (!gym) throw new Error("Academia não encontrada");

      // Buscar o admin da academia
      const [admin] = await db
        .select()
        .from(users)
        .where(and(eq(users.gymId, input.gymId), eq(users.role, "gym_admin")));

      if (!admin) throw new Error("Admin não encontrado para esta academia");

      // Gerar nova senha temporária
      const tempPassword = `${gym.slug}@2024`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Atualizar senha
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, admin.id));

      return {
        success: true,
        credentials: {
          email: admin.email,
          password: tempPassword,
          loginUrl: `/admin/login?gym=${gym.slug}`,
        },
      };
    }),

  // Deletar academia
  delete: publicProcedure
    .input(z.object({ gymId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(gyms).where(eq(gyms.id, input.gymId));
      return { success: true };
    }),

  // Obter estatísticas da academia
  getStats: publicProcedure
    .input(z.object({ gymId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const studentsCount = await db
        .select()
        .from(students)
        .where(eq(students.gymId, input.gymId));

      return {
        totalStudents: studentsCount.length,
        activeStudents: studentsCount.filter(s => s.membershipStatus === "active").length,
      };
    }),
});
