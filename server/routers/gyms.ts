import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, createGymSettings } from "../db";
import { gyms, students, users, siteSettings } from "../../drizzle/schema";
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

      // Gerar senha segura automática ANTES de criar a academia
      const generatePassword = () => {
        const length = 12;
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%&*';
        const allChars = uppercase + lowercase + numbers + symbols;

        let pwd = '';
        pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
        pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
        pwd += numbers[Math.floor(Math.random() * numbers.length)];
        pwd += symbols[Math.floor(Math.random() * symbols.length)];

        for (let i = pwd.length; i < length; i++) {
          pwd += allChars[Math.floor(Math.random() * allChars.length)];
        }

        return pwd.split('').sort(() => Math.random() - 0.5).join('');
      };

      const tempPassword = generatePassword();
      const adminEmailToUse = adminEmail || gymData.contactEmail || `admin@${input.slug}.com`;

      // Garantir que email seja fornecido (campo obrigatório no schema)
      const finalGymData: any = {
        name: gymData.name,
        slug: gymData.slug,
        email: gymData.email || gymData.contactEmail || `contato@${input.slug}.com`,
        contactEmail: gymData.contactEmail || null,
        contactPhone: gymData.contactPhone || null,
        phone: gymData.phone || null,
        city: gymData.city || null,
        state: gymData.state || null,
        plan: gymData.plan || "basic",
        planStatus: gymData.planStatus || "trial",
        status: "active",
        tempAdminPassword: tempPassword,
        tempAdminEmail: adminEmailToUse,
      };

      // Adicionar campos opcionais apenas se fornecidos
      if (gymData.cnpj) finalGymData.cnpj = gymData.cnpj;
      if (gymData.address) finalGymData.address = gymData.address;
      if (gymData.zipCode) finalGymData.zipCode = gymData.zipCode;
      if (gymData.pixKey) finalGymData.pixKey = gymData.pixKey;
      if (gymData.pixKeyType) finalGymData.pixKeyType = gymData.pixKeyType;
      if (gymData.merchantName) finalGymData.merchantName = gymData.merchantName;
      if (gymData.merchantCity) finalGymData.merchantCity = gymData.merchantCity;
      if (gymData.wellhubApiKey) finalGymData.wellhubApiKey = gymData.wellhubApiKey;
      if (gymData.wellhubWebhookSecret) finalGymData.wellhubWebhookSecret = gymData.wellhubWebhookSecret;

      console.log("🟢 [CREATE GYM] Dados para inserir (finalGymData):", JSON.stringify(finalGymData, null, 2));

      const [result] = await db.insert(gyms).values(finalGymData);
      const gymId = Number(result.insertId);

      console.log("🟢 [CREATE GYM] Academia criada com ID:", gymId);

      // Criar usuário admin para a academia
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const name = adminName || `Admin ${input.name}`;
      const openId = `gym-admin-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      await db.insert(users).values({
        gymId,
        openId,
        email: adminEmailToUse,
        password: hashedPassword,
        name,
        role: "gym_admin",
        phone: input.contactPhone || null,
      });

      console.log(`🟢 [CREATE GYM] Admin criado com email: ${adminEmailToUse}`);

      // Gerar PIX automaticamente para pagamento da assinatura
      const plan = finalGymData.plan;
      const now = new Date();
      const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      console.log(`💰 [CREATE GYM] Gerando PIX de assinatura automático para plano: ${plan}`);

      try {
        // Buscar preços das configurações
        const [settings] = await db.select().from(siteSettings).limit(1);

        if (!settings) {
          throw new Error("Configurações do site não encontradas");
        }

        const planPrices: Record<string, number> = {
          basic: settings.basicPrice * 100,
          professional: settings.professionalPrice * 100,
          enterprise: settings.enterprisePrice * 100,
        };

        const amountInCents = planPrices[plan];

        // Importar funções PIX
        const { getPixService } = await import("../pix");
        const { createGymPayment } = await import("../db");

        // Criar cobrança PIX usando credenciais do Super Admin
        const pixService = getPixService();

        const pixCharge = await pixService.createImmediateCharge({
          valor: amountInCents,
          pagador: {
            cpf: finalGymData.cnpj?.replace(/\D/g, "") || "00000000000",
            nome: finalGymData.name,
          },
          infoAdicionais: `Assinatura ${plan} - ${finalGymData.name}`,
          expiracao: 86400, // 24 horas
        });

        console.log(`✅ [CREATE GYM] PIX gerado! TXID: ${pixCharge.txid}`);

        // Definir data de vencimento (dia 10 do mês)
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);
        if (now.getDate() > 10) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Salvar pagamento no banco
        const planNames: Record<string, string> = {
          basic: "Básico",
          professional: "Professional",
          enterprise: "Enterprise",
        };

        await createGymPayment({
          gymId,
          amountInCents,
          status: "pending",
          paymentMethod: "pix",
          pixTxId: pixCharge.txid,
          pixQrCode: pixCharge.pixCopiaECola,
          pixQrCodeImage: pixCharge.qrcode,
          pixCopyPaste: pixCharge.pixCopiaECola,
          description: `Assinatura ${planNames[plan]} - ${referenceMonth}`,
          referenceMonth,
          dueDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✅ [CREATE GYM] Pagamento PIX salvo no banco`);

        // Retornar dados incluindo PIX
        return {
          gymId,
          gymSlug: input.slug,
          plan,
          pixPayment: {
            txid: pixCharge.txid,
            qrCode: pixCharge.pixCopiaECola,
            qrCodeImage: pixCharge.qrcode,
            amount: amountInCents,
            amountFormatted: `R$ ${(amountInCents / 100).toFixed(2).replace('.', ',')}`,
            dueDate: dueDate.toISOString(),
          },
          message: "Academia cadastrada! Pague o PIX para ativar o sistema.",
        };

      } catch (pixError: any) {
        console.error("❌ [CREATE GYM] Erro ao gerar PIX:", pixError);
        // Se falhar o PIX, ainda assim academia foi criada
        return {
          gymId,
          gymSlug: input.slug,
          error: `Academia criada, mas erro ao gerar PIX: ${pixError.message}`,
          message: "Academia cadastrada! Entre em contato para finalizar o pagamento.",
        };
      }
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

  // Enviar credenciais para admin da academia (após pagamento)
  sendAdminCredentials: publicProcedure
    .input(z.object({ gymId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar a academia
      const [gym] = await db.select().from(gyms).where(eq(gyms.id, input.gymId));
      if (!gym) throw new Error("Academia não encontrada");

      // Verificar se tem credenciais temporárias
      if (!gym.tempAdminPassword || !gym.tempAdminEmail) {
        throw new Error("Credenciais temporárias não encontradas. Academia já foi ativada?");
      }

      // Importar função de email
      const { sendGymAdminCredentials } = await import("../email");

      // Enviar email
      const sent = await sendGymAdminCredentials(
        gym.tempAdminEmail,
        gym.tempAdminPassword,
        gym.name,
        gym.slug,
        gym.plan
      );

      if (sent) {
        // Limpar credenciais temporárias após enviar email
        await db.update(gyms)
          .set({
            tempAdminPassword: null,
            tempAdminEmail: null,
            planStatus: "active", // Ativar o plano
          })
          .where(eq(gyms.id, input.gymId));

        console.log(`✅ [SEND CREDENTIALS] Email enviado para ${gym.tempAdminEmail}`);

        return {
          success: true,
          message: "Credenciais enviadas com sucesso!",
        };
      } else {
        throw new Error("Falha ao enviar email");
      }
    }),

  // Gerar pagamento PIX para assinatura da academia
  generateSubscriptionPayment: publicProcedure
    .input(z.object({
      gymId: z.number(),
      plan: z.enum(["basic", "professional", "enterprise"]),
      referenceMonth: z.string().optional(), // "2026-01"
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar a academia
      const [gym] = await db.select().from(gyms).where(eq(gyms.id, input.gymId));
      if (!gym) throw new Error("Academia não encontrada");

      // Importar funções
      const { getPixService } = await import("../pix");
      const { createGymPayment, getGymPaymentByReferenceMonth } = await import("../db");

      // Definir mês de referência (padrão: mês atual)
      const now = new Date();
      const referenceMonth = input.referenceMonth ||
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Verificar se já existe pagamento para este mês
      const existingPayment = await getGymPaymentByReferenceMonth(input.gymId, referenceMonth);
      if (existingPayment && existingPayment.status !== "cancelled") {
        throw new Error("Já existe um pagamento para este mês");
      }

      // Buscar valores dos planos das configurações do site
      const [settings] = await db.select().from(siteSettings).limit(1);

      if (!settings) {
        throw new Error("Configurações do site não encontradas. Configure os preços no Super Admin.");
      }

      const planPrices: Record<string, number> = {
        basic: settings.basicPrice * 100, // Converter de reais para centavos
        professional: settings.professionalPrice * 100,
        enterprise: settings.enterprisePrice * 100,
      };

      const amountInCents = planPrices[input.plan];

      console.log(`💰 [GYM PAYMENT] Preços obtidos do Super Admin:`);
      console.log(`  - Básico: R$ ${settings.basicPrice}`);
      console.log(`  - Professional: R$ ${settings.professionalPrice}`);
      console.log(`  - Enterprise: R$ ${settings.enterprisePrice}`);

      // Definir data de vencimento (dia 10 do mês)
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);
      if (now.getDate() > 10) {
        // Se já passou do dia 10, vencimento é no próximo mês
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      console.log(`💰 [GYM PAYMENT] Gerando PIX para academia ${gym.name}`);
      console.log(`  - Plano: ${input.plan}`);
      console.log(`  - Valor: R$ ${(amountInCents / 100).toFixed(2)}`);
      console.log(`  - Vencimento: ${dueDate.toISOString()}`);
      console.log(`  - Mês de referência: ${referenceMonth}`);

      try {
        // Criar cobrança PIX usando credenciais do Super Admin
        const pixService = getPixService();

        const pixCharge = await pixService.createImmediateCharge({
          valor: amountInCents,
          pagador: {
            cpf: gym.cnpj?.replace(/\D/g, "") || "00000000000", // Usar CNPJ como CPF se disponível
            nome: gym.name,
          },
          infoAdicionais: `Assinatura ${input.plan} - ${gym.name}`,
          expiracao: 86400, // 24 horas
        });

        console.log(`✅ [GYM PAYMENT] PIX criado com sucesso!`);
        console.log(`  - TXID: ${pixCharge.txid}`);
        console.log(`  - QR Code: ${pixCharge.pixCopiaECola.substring(0, 50)}...`);

        // Salvar pagamento no banco
        const planNames: Record<string, string> = {
          basic: "Básico",
          professional: "Professional",
          enterprise: "Enterprise",
        };

        const payment = await createGymPayment({
          gymId: input.gymId,
          amountInCents,
          status: "pending",
          paymentMethod: "pix",
          pixTxId: pixCharge.txid,
          pixQrCode: pixCharge.pixCopiaECola,
          pixQrCodeImage: pixCharge.qrcode,
          pixCopyPaste: pixCharge.pixCopiaECola,
          description: `Assinatura ${planNames[input.plan]} - ${referenceMonth}`,
          referenceMonth,
          dueDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✅ [GYM PAYMENT] Pagamento salvo no banco - ID: ${payment.insertId}`);

        return {
          success: true,
          paymentId: payment.insertId,
          txid: pixCharge.txid,
          qrCode: pixCharge.pixCopiaECola,
          qrCodeImage: pixCharge.qrcode,
          amount: amountInCents,
          dueDate: dueDate.toISOString(),
        };
      } catch (error: any) {
        console.error("❌ [GYM PAYMENT] Erro ao gerar PIX:", error);
        throw new Error(`Erro ao gerar pagamento PIX: ${error.message}`);
      }
    }),
});
