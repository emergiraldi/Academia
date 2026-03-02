import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, createGymSettings } from "../db";
import { gyms, students, users, siteSettings, gymPayments } from "../../drizzle/schema";
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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se slug já existe
      const [existingSlug] = await db.select().from(gyms).where(eq(gyms.slug, input.slug));
      if (existingSlug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Já existe uma academia com este nome. Por favor, escolha outro nome."
        });
      }

      // Verificar se email do admin já existe (se fornecido)
      if (input.adminEmail) {
        const [existingEmail] = await db.select().from(users).where(eq(users.email, input.adminEmail));
        if (existingEmail) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Este email já está cadastrado no sistema. Por favor, use outro email."
          });
        }
      }

      // Criar a academia
      const { adminEmail, adminName, ...gymData } = input;

      // 🔍 Buscar planos SaaS disponíveis para seleção dinâmica
      const { listSaasPlans } = await import("../db");
      const availablePlans = await listSaasPlans(false); // false = apenas ativos

      if (availablePlans.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhum plano SaaS disponível. Configure os planos no Super Admin."
        });
      }

      // Usar o primeiro plano ativo se não for especificado
      const defaultPlan = availablePlans[0];
      const planSlug = gymData.plan || defaultPlan.slug;

      console.log(`📋 [CREATE GYM] Plano selecionado: ${planSlug} (disponíveis: ${availablePlans.map((p: any) => p.slug).join(', ')})`);

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
        plan: planSlug,
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

      // Buscar configurações do Super Admin para verificar trial ANTES da transação
      const { getSuperAdminSettings } = await import("../db");
      const superAdminSettings = await getSuperAdminSettings();

      const plan = planSlug; // Usar o plano selecionado dinamicamente
      const now = new Date();

      // ⚠️ Se trial está DESABILITADO, academia começa BLOQUEADA até pagar
      console.log(`🔍 [CREATE GYM] Super Admin Settings - trialEnabled: ${superAdminSettings?.trialEnabled}`);
      if (!superAdminSettings?.trialEnabled) {
        console.log(`🔒 [CREATE GYM] Trial desabilitado - Academia será criada BLOQUEADA até confirmação de pagamento`);
        finalGymData.status = "suspended";
        finalGymData.planStatus = "suspended";
        finalGymData.blockedReason = "Aguardando confirmação de pagamento PIX";
      } else {
        console.log(`🎁 [CREATE GYM] Trial HABILITADO - Academia será criada ativa com ${superAdminSettings.trialDays} dias de teste`);
      }

      // Preparar senha hash ANTES da transação
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const name = adminName || `Admin ${input.name}`;
      const openId = `gym-admin-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // 🔒 INICIAR TRANSAÇÃO - Todas operações de banco devem acontecer juntas ou nenhuma
      let gymId: number;

      await db.transaction(async (tx) => {
        // 1. Criar academia
        const [result] = await tx.insert(gyms).values(finalGymData);
        gymId = Number(result.insertId);
        console.log("🟢 [CREATE GYM] Academia criada com ID:", gymId);

        // 2. Criar usuário admin para a academia
        await tx.insert(users).values({
          gymId,
          openId,
          email: adminEmailToUse,
          password: hashedPassword,
          name,
          role: "gym_admin",
          phone: input.contactPhone || null,
        });
        console.log(`🟢 [CREATE GYM] Admin criado com email: ${adminEmailToUse}`);

        // 3. Configurar trial se habilitado
        if (superAdminSettings?.trialEnabled) {
          console.log(`🎁 [CREATE GYM] Trial habilitado! Dando ${superAdminSettings.trialDays} dias de acesso grátis`);

          const trialEndsAt = new Date(now);
          trialEndsAt.setDate(trialEndsAt.getDate() + superAdminSettings.trialDays);

          await tx.update(gyms).set({
            trialEndsAt,
            planStatus: "trial",
            status: "active",
            subscriptionStartsAt: now,
          }).where(eq(gyms.id, gymId));

          console.log(`✅ [CREATE GYM] Trial configurado até: ${trialEndsAt.toISOString()}`);
        }
      });

      // 🔒 TRANSAÇÃO CONCLUÍDA COM SUCESSO - Academia e admin foram criados

      // Se trial NÃO está habilitado, gerar PIX automaticamente
      let pixQrCode: string | undefined;
      let pixCopyPaste: string | undefined;

      if (!superAdminSettings?.trialEnabled) {
        console.log(`💳 [CREATE GYM] Trial desabilitado - Gerando PIX para academia ${gymId!}`);
        try {
          const { getPixServiceFromSuperAdmin } = await import("../pix");
          const { createGymPayment } = await import("../db");

          // Encontrar o plano selecionado nos planos já carregados
          const selectedPlan = availablePlans.find((p: any) => p.slug === plan);
          console.log(`📋 [CREATE GYM] Plano para PIX: ${plan}, encontrado: ${!!selectedPlan}`);

          if (selectedPlan) {
            const amountInCents = selectedPlan.priceInCents;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 10); // 10 days to pay

            const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            console.log(`💰 [CREATE GYM] Valor: R$ ${amountInCents / 100} (${amountInCents} centavos)`);
            console.log(`🔌 [CREATE GYM] Obtendo serviço PIX do Super Admin...`);

            const pixService = await getPixServiceFromSuperAdmin();
            console.log(`🔌 [CREATE GYM] Serviço PIX obtido, criando cobrança...`);

            const pixCharge = await pixService.createImmediateCharge({
              valor: amountInCents,
              pagador: {
                documento: finalGymData.cnpj?.replace(/\D/g, "") || "11222333000181", // CNPJ genérico válido como fallback
                nome: finalGymData.name,
              },
              infoAdicionais: `Assinatura ${selectedPlan.name} - ${finalGymData.name}`,
              expiracao: 86400 * 10, // 10 days
            });

            console.log(`💾 [CREATE GYM] Salvando pagamento no banco...`);
            // Save payment
            await createGymPayment({
              gymId: gymId!,
              amountInCents,
              status: "pending",
              paymentMethod: "pix",
              pixTxId: pixCharge.txid,
              pixQrCode: pixCharge.pixCopiaECola,
              pixQrCodeImage: pixCharge.qrcode,
              pixCopyPaste: pixCharge.pixCopiaECola,
              description: `Assinatura ${selectedPlan.name} - ${referenceMonth}`,
              referenceMonth,
              dueDate,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            pixQrCode = pixCharge.qrcode;
            pixCopyPaste = pixCharge.pixCopiaECola;

            console.log(`✅ [CREATE GYM] PIX gerado - TXID: ${pixCharge.txid}`);
          } else {
            console.error(`❌ [CREATE GYM] Plano "${plan}" não encontrado na lista de planos SaaS!`);
          }
        } catch (pixError) {
          console.error("❌ [CREATE GYM] Erro ao gerar PIX:");
          console.error(pixError);
          // Continuar mesmo se PIX falhar
        }
      }

      // ✉️ Enviar email de boas-vindas (FORA da transação - se falhar não desfaz o cadastro)
      console.log(`📧 [CREATE GYM] Enviando email com PIX - pixQrCode: ${pixQrCode ? 'SIM' : 'NÃO'}, pixCopyPaste: ${pixCopyPaste ? 'SIM' : 'NÃO'}`);
      try {
        const { sendGymAdminCredentials } = await import("../email");
        await sendGymAdminCredentials(
          adminEmailToUse,
          tempPassword,
          finalGymData.name,
          finalGymData.slug,
          plan,
          pixQrCode,
          pixCopyPaste
        );
        console.log(`✅ [CREATE GYM] Email de boas-vindas enviado para ${adminEmailToUse}`);
      } catch (emailError) {
        console.error("❌ [CREATE GYM] Erro ao enviar email:", emailError);
        // Continuar mesmo se email falhar - academia já foi criada com sucesso
      }

      // Retornar resposta baseada no tipo de configuração (trial ou pix)
      if (superAdminSettings?.trialEnabled) {
        const trialEndsAt = new Date(now);
        trialEndsAt.setDate(trialEndsAt.getDate() + superAdminSettings.trialDays);

        return {
          gymId: gymId!,
          gymSlug: input.slug,
          plan,
          trial: {
            enabled: true,
            days: superAdminSettings.trialDays,
            endsAt: trialEndsAt.toISOString(),
          },
          credentials: {
            email: adminEmailToUse,
            password: tempPassword,
          },
          message: `Academia cadastrada! Você tem ${superAdminSettings.trialDays} dias de acesso grátis.`,
        };
      }

      // Se trial NÃO está habilitado, retornar com informação do PIX
      return {
        gymId: gymId!,
        gymSlug: input.slug,
        plan,
        trial: {
          enabled: false,
        },
        credentials: {
          email: adminEmailToUse,
          password: tempPassword,
        },
        pixGenerated: !!pixQrCode,
        message: "Academia cadastrada! Pague via PIX para ativar o acesso.",
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

      // 🔍 Buscar planos SaaS disponíveis para seleção dinâmica
      const { listSaasPlans } = await import("../db");
      const availablePlans = await listSaasPlans(false); // false = apenas ativos

      if (availablePlans.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhum plano SaaS disponível. Entre em contato com o suporte."
        });
      }

      // Usar o primeiro plano ativo disponível
      const defaultPlan = availablePlans[0];
      console.log(`📋 [SIGNUP] Usando plano: ${defaultPlan.slug} (${defaultPlan.name})`);

      // Preparar senha hash ANTES da transação
      const hashedPassword = await bcrypt.hash(input.adminPassword, 10);
      const openId = `gym-admin-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // 🔒 INICIAR TRANSAÇÃO - Todas operações de banco devem acontecer juntas ou nenhuma
      let gymId: number;

      await db.transaction(async (tx) => {
        // 1. Criar academia
        const [result] = await tx.insert(gyms).values({
          name: input.gymName,
          slug: input.gymSlug,
          cnpj: input.cnpj || null,
          email: input.email,
          phone: input.phone || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          zipCode: input.zipCode || null,
          plan: defaultPlan.slug,
          planStatus: "trial",
          status: "active",
        });

        gymId = Number(result.insertId);

        // 2. Criar usuário administrador
        await tx.insert(users).values({
          gymId,
          openId,
          email: input.adminEmail,
          password: hashedPassword,
          name: input.adminName,
          role: "gym_admin",
          phone: input.phone || null,
        });
      });

      // 🔒 TRANSAÇÃO CONCLUÍDA - Academia e admin criados com sucesso

      // Criar configurações padrão para a academia (DEPOIS da transação)
      try {
        await createGymSettings(gymId!);
      } catch (settingsError) {
        console.error("❌ Erro ao criar configurações:", settingsError);
        // Continuar mesmo se falhar - configurações podem ser criadas depois
      }

      // Retornar informações importantes
      return {
        success: true,
        gymId: gymId!,
        gymSlug: input.gymSlug,
        agentId: `academia-${gymId!}`,
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

          // Se o email da academia mudou, atualizar também o email do admin (users)
          if (cleanData.email) {
            const admins = await db
              .select()
              .from(users)
              .where(and(eq(users.gymId, gymId), eq(users.role, "gym_admin")));

            if (admins.length > 0) {
              // Verificar se o novo email já existe em outro usuário
              const [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, cleanData.email as string));

              if (!existingUser || existingUser.id === admins[0].id) {
                await db
                  .update(users)
                  .set({ email: cleanData.email as string })
                  .where(and(eq(users.gymId, gymId), eq(users.role, "gym_admin")));
                console.log(`✅ [UPDATE GYMS] Email do admin atualizado para: ${cleanData.email}`);
              } else {
                console.log(`⚠️ [UPDATE GYMS] Email ${cleanData.email} já existe em outro usuário, admin não atualizado`);
              }
            }
          }

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

      // Buscar TODOS os admins da academia
      const admins = await db
        .select()
        .from(users)
        .where(and(eq(users.gymId, input.gymId), eq(users.role, "gym_admin")));

      if (!admins || admins.length === 0) {
        throw new Error("Admin não encontrado para esta academia");
      }

      // Gerar nova senha temporária segura
      const generateSecurePassword = () => {
        const length = 12;
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%&*';
        const allChars = uppercase + lowercase + numbers + symbols;

        let pwd = '';
        // Garantir pelo menos 1 caractere de cada tipo
        pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
        pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
        pwd += numbers[Math.floor(Math.random() * numbers.length)];
        pwd += symbols[Math.floor(Math.random() * symbols.length)];

        // Preencher o resto aleatoriamente
        for (let i = pwd.length; i < length; i++) {
          pwd += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Embaralhar
        return pwd.split('').sort(() => Math.random() - 0.5).join('');
      };

      const tempPassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Atualizar senha de TODOS os admins da academia
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(and(eq(users.gymId, input.gymId), eq(users.role, "gym_admin")));

      console.log(`✅ [RESET PASSWORD] Senha resetada para ${admins.length} admin(s) da academia ${gym.name}`);

      // Determinar email para envio: priorizar email da academia, depois contactEmail, depois email do primeiro admin
      const emailDestino = gym.email || gym.contactEmail || admins[0].email;

      console.log(`📧 [RESET PASSWORD] Email será enviado para: ${emailDestino}`);
      console.log(`📧 [RESET PASSWORD] Admins encontrados: ${admins.map(a => a.email).join(', ')}`);

      // Enviar email com a nova senha
      try {
        const { sendAdminPasswordResetEmail } = await import("../email");
        await sendAdminPasswordResetEmail(
          emailDestino,
          tempPassword,
          gym.name,
          gym.slug
        );
        console.log(`✅ [RESET PASSWORD] Email enviado para ${emailDestino}`);
      } catch (emailError) {
        console.error("❌ [RESET PASSWORD] Erro ao enviar email:", emailError);
        // Continuar mesmo se o email falhar - senha já foi resetada
      }

      return {
        success: true,
        credentials: {
          email: emailDestino, // Email para onde foi enviado (academia)
          password: tempPassword,
          loginUrl: `/admin/login?gym=${gym.slug}`,
        },
      };
    }),

  // Super Admin: Fazer login como academia (sem senha)
  loginAsGym: publicProcedure
    .input(z.object({ gymId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // VERIFICAR SE É SUPER ADMIN
      if (!ctx.user || ctx.user.role !== 'super_admin') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas Super Admin pode acessar outras academias"
        });
      }

      // Buscar a academia
      const [gym] = await db.select().from(gyms).where(eq(gyms.id, input.gymId));
      if (!gym) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Academia não encontrada" });
      }

      // Buscar o primeiro admin da academia
      const [admin] = await db
        .select()
        .from(users)
        .where(and(eq(users.gymId, input.gymId), eq(users.role, "gym_admin")));

      if (!admin) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Admin não encontrado para esta academia" });
      }

      // LOG DE AUDITORIA
      console.log(`🔐 [SUPER ADMIN ACCESS] Super Admin ${ctx.user.email} acessando academia ${gym.name} (ID: ${gym.id})`);

      // Garantir que o admin tem openId
      if (!admin.openId) {
        const openId = `email-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await db.update(users).set({ openId }).where(eq(users.id, admin.id));
        admin.openId = openId;
      }

      // Criar sessão para o admin da academia
      const { sdk } = await import("../_core/sdk");
      const sessionToken = await sdk.createSessionToken(
        admin.openId,
        { name: admin.name || admin.email }
      );

      // Definir cookie de sessão
      const { COOKIE_NAME } = await import("@shared/const");
      const { getSessionCookieOptions } = await import("../_core/cookies");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      console.log(`✅ [SUPER ADMIN ACCESS] Sessão criada para ${admin.email} na academia ${gym.name}`);

      // Retornar dados para redirecionamento
      return {
        success: true,
        adminUserId: admin.id,
        adminEmail: admin.email,
        gymSlug: gym.slug,
        gymName: gym.name,
        loginUrl: `/admin/dashboard?gym=${gym.slug}`,
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

  // Verificar status do pagamento PIX
  checkPaymentStatus: publicProcedure
    .input(z.object({
      gymId: z.number(),
      paymentId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar o pagamento
      const { getGymPaymentById } = await import("../db");
      const payment = await getGymPaymentById(input.paymentId, input.gymId);

      if (!payment) {
        throw new Error("Pagamento não encontrado");
      }

      // Se já estiver pago, retornar o status
      if (payment.status === "paid") {
        return {
          status: "paid",
          paidAt: payment.paidAt,
          message: "Pagamento confirmado!",
        };
      }

      // Se tiver txid, verificar status na API PIX
      if (payment.pixTxId) {
        try {
          const { getPixServiceFromSuperAdmin } = await import("../pix");
          const pixService = await getPixServiceFromSuperAdmin();

          const pixStatus = await pixService.checkPaymentStatus(payment.pixTxId);

          console.log(`🔍 [CHECK PAYMENT] Status do PIX ${payment.pixTxId}:`, pixStatus.status);

          // Se foi pago, atualizar no banco
          if (pixStatus.status === "CONCLUIDA") {
            const { updateGymPayment } = await import("../db");
            await updateGymPayment(payment.id, input.gymId, {
              status: "paid",
              paidAt: pixStatus.paidAt || new Date(),
            });

            // Ativar a academia
            await db.update(gyms).set({
              planStatus: "active",
              subscriptionStartsAt: new Date(),
            }).where(eq(gyms.id, input.gymId));

            console.log(`✅ [CHECK PAYMENT] Academia ${input.gymId} ativada!`);

            return {
              status: "paid",
              paidAt: pixStatus.paidAt,
              message: "Pagamento confirmado! Academia ativada.",
            };
          }

          return {
            status: "pending",
            message: "Aguardando pagamento...",
          };
        } catch (error: any) {
          console.error("❌ [CHECK PAYMENT] Erro ao verificar status:", error);
          return {
            status: "error",
            message: "Erro ao verificar status do pagamento",
          };
        }
      }

      return {
        status: payment.status,
        message: "Aguardando pagamento...",
      };
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
      const { getPixServiceFromSuperAdmin } = await import("../pix");
      const { createGymPayment, getGymPaymentByReferenceMonth, listSaasPlans } = await import("../db");

      // Definir mês de referência (padrão: mês atual)
      const now = new Date();
      const referenceMonth = input.referenceMonth ||
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Verificar se já existe pagamento para este mês
      const existingPayment = await getGymPaymentByReferenceMonth(input.gymId, referenceMonth);
      if (existingPayment && existingPayment.status !== "cancelled") {
        throw new Error("Já existe um pagamento para este mês");
      }

      // Buscar valores dos planos da tabela saasPlans
      const allPlans = await listSaasPlans(false); // Buscar todos os planos

      // Mapear planos por slug
      const plansMap: Record<string, any> = {};
      allPlans.forEach((p: any) => {
        plansMap[p.slug] = p;
      });

      const selectedPlan = plansMap[input.plan];
      if (!selectedPlan) {
        throw new Error(`Plano "${input.plan}" não encontrado. Configure os planos no Super Admin.`);
      }

      const amountInCents = selectedPlan.priceInCents;

      console.log(`💰 [GYM PAYMENT] Plano selecionado:`);
      console.log(`  - Nome: ${selectedPlan.name}`);
      console.log(`  - Slug: ${selectedPlan.slug}`);
      console.log(`  - Valor: R$ ${(amountInCents / 100).toFixed(2)}`);

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
        const pixService = await getPixServiceFromSuperAdmin();

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
        const payment = await createGymPayment({
          gymId: input.gymId,
          amountInCents,
          status: "pending",
          paymentMethod: "pix",
          pixTxId: pixCharge.txid,
          pixQrCode: pixCharge.pixCopiaECola,
          pixQrCodeImage: pixCharge.qrcode,
          pixCopyPaste: pixCharge.pixCopiaECola,
          description: `Assinatura ${selectedPlan.name} - ${referenceMonth}`,
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

  // Atualizar tipo de catraca da academia
  updateTurnstileType: publicProcedure
    .input(z.object({
      gymId: z.number(),
      turnstileType: z.enum(["control_id", "toletus_hub"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      console.log(`🔄 [UPDATE TURNSTILE TYPE] Academia ${input.gymId} → ${input.turnstileType}`);

      await db.update(gyms)
        .set({ turnstileType: input.turnstileType })
        .where(eq(gyms.id, input.gymId));

      console.log(`✅ [UPDATE TURNSTILE TYPE] Tipo de catraca atualizado com sucesso`);

      return { success: true };
    }),
});
