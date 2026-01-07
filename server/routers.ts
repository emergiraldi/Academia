import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { gymsRouter } from "./routers/gyms";
import { settingsRouter } from "./routers/settings";
import { publicProcedure, protectedProcedure, router, gymAdminProcedure, professorProcedure, studentProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as bcrypt from "bcrypt";
import { sendPasswordResetEmail, sendPaymentConfirmationEmail, sendNewWorkoutEmail } from "./email";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { getPixService, getPixServiceFromBankAccount } from "./pix";
import { generateReceiptHTML, generateReceiptFilename, generateExpenseReceiptHTML } from "./receipt";

const SALT_ROUNDS = 10;

// ============ HELPER FUNCTIONS FOR MULTI-TENANT SECURITY ============

/**
 * Valida se o gym pertence ao usuário logado (exceto super_admin)
 * Previne vazamento de dados entre academias (multi-tenant isolation)
 */
async function validateGymAccess(gymSlug: string, userGymId: number | null, userRole: string): Promise<{ id: number; name: string; slug: string }> {
  const gym = await db.getGymBySlug(gymSlug);
  if (!gym) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Academia não encontrada" });
  }

  // Super admin pode acessar qualquer academia
  if (userRole === 'super_admin') {
    return gym;
  }

  // Outros usuários só podem acessar sua própria academia
  if (gym.id !== userGymId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso negado: você não pode acessar dados de outra academia"
    });
  }

  return gym;
}

// Configurar mensagens de erro do Zod em português
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === "string") {
      return { message: "Campo obrigatório" };
    }
    return { message: `Tipo inválido: esperado ${issue.expected}, recebido ${issue.received}` };
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === "string") {
      return { message: `Mínimo de ${issue.minimum} caracteres` };
    }
    if (issue.type === "number") {
      return { message: `Valor mínimo: ${issue.minimum}` };
    }
    return { message: `Valor muito pequeno` };
  }
  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === "string") {
      return { message: `Máximo de ${issue.maximum} caracteres` };
    }
    if (issue.type === "number") {
      return { message: `Valor máximo: ${issue.maximum}` };
    }
    return { message: `Valor muito grande` };
  }
  if (issue.code === z.ZodIssueCode.invalid_string) {
    if (issue.validation === "email") {
      return { message: "Email inválido" };
    }
    if (issue.validation === "url") {
      return { message: "URL inválida" };
    }
    return { message: "Formato inválido" };
  }
  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    return { message: `Valor inválido. Opções: ${issue.options.join(", ")}` };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);

// Helper to check if user is super admin
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso de super administrador necessário" });
  }
  return next({ ctx });
});

// Helper to check if user is gym admin
const gymAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "gym_admin" && ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso de administrador necessário" });
  }
  return next({ ctx });
});

// Helper to check if user is professor
const professorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "professor" && ctx.user.role !== "gym_admin" && ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso de professor necessário" });
  }
  return next({ ctx });
});

// Helper to check if user is gym admin or staff (allows staff to access admin features)
const gymAdminOrStaffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "gym_admin" && ctx.user.role !== "super_admin" && ctx.user.role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso de administrador ou funcionário necessário" });
  }
  return next({ ctx });
});

// Helper to check if user is student
const studentProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "student" && ctx.user.role !== "gym_admin" && ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Student access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  gyms: gymsRouter,
  settings: settingsRouter,

  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;

      // Include gymSlug for convenience
      if (ctx.user.gymId) {
        const gym = await db.getGymById(ctx.user.gymId);
        return {
          ...ctx.user,
          gymSlug: gym?.slug || null,
        };
      }

      return {
        ...ctx.user,
        gymSlug: null,
      };
    }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Student/Professor/Gym Admin login with email/password
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        gymSlug: z.string().optional(), // For multi-tenant selection
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        // If gymSlug provided, verify user belongs to that gym
        if (input.gymSlug && user.gymId) {
          const gym = await db.getGymById(user.gymId);
          if (!gym || gym.slug !== input.gymSlug) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid gym access" });
          }

          // Check if gym is suspended or blocked
          if (gym.status === "suspended" || gym.planStatus === "suspended") {
            const reason = gym.blockedReason || "Academia temporariamente suspensa";
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Acesso bloqueado: ${reason}. Entre em contato com o administrador da academia.`
            });
          }
        } else if (user.gymId && user.role !== "super_admin") {
          // For users with gymId (not super admin), always check gym status
          const gym = await db.getGymById(user.gymId);
          if (!gym) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Academia não encontrada" });
          }

          // Check if gym is suspended or blocked
          if (gym.status === "suspended" || gym.planStatus === "suspended") {
            const reason = gym.blockedReason || "Academia temporariamente suspensa";
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Acesso bloqueado: ${reason}. Entre em contato com o administrador da academia.`
            });
          }
        }

        // Ensure user has an openId (for legacy users created without openId)
        if (!user.openId) {
          const openId = `email-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          await db.updateUser(user.id, { openId });
          user.openId = openId;
        }

        // Create session token
        const { sdk } = await import("./_core/sdk");
        const sessionToken = await sdk.createSessionToken(
          user.openId,
          { name: user.name || user.email }
        );

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        });

        return { success: true, user };
      }),

    // Register new student
    register: publicProcedure
      .input(z.object({
        gymSlug: z.string(),
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
        cpf: z.string(),
        phone: z.string().optional(),
        birthDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if gym exists
        const gym = await db.getGymBySlug(input.gymSlug);
        if (!gym) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Academia não encontrada" });
        }

        // Check if email already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

        // Generate unique openId for email/password users
        const openId = `email-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Create user
        const userResult = await db.createUser({
          gymId: gym.id,
          openId,
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: "student",
          loginMethod: "email",
        });

        // Create student profile
        const registrationNumber = `${gym.slug.toUpperCase()}-${Date.now()}`;
        await db.createStudent({
          gymId: gym.id,
          userId: userResult.insertId,
          registrationNumber,
          cpf: input.cpf,
          phone: input.phone || null,
          birthDate: input.birthDate ? new Date(input.birthDate) : null,
          membershipStatus: "inactive",
        });

        // Get the created user to create session
        const user = await db.getUserByEmail(input.email);
        if (user) {
          // Create session token
          const { sdk } = await import("./_core/sdk");
          const sessionToken = await sdk.createSessionToken(
            user.openId || `user-${user.id}`,
            { name: user.name || user.email }
          );

          // Set session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
          });
        }

        return { success: true, userId: userResult.insertId };
      }),

    // Request password reset code
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          return { success: true };
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await db.createPasswordResetToken({
          userId: user.id,
          token: code,
          expiresAt,
          used: false,
        });

        await sendPasswordResetEmail(user.email!, code, user.name || "Usuário");
        return { success: true };
      }),

    // Reset password with code
    resetPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const tokenRecord = await db.getPasswordResetToken(input.code);
        if (!tokenRecord || tokenRecord.userId !== user.id || tokenRecord.used) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired code" });
        }

        if (new Date() > tokenRecord.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Code expired" });
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
        await db.updateUserPassword(user.id, hashedPassword);
        await db.markTokenAsUsed(tokenRecord.id);

        return { success: true };
      }),
  }),

  // ============ STUDENTS ============
  students: router({
    me: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      return await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
    }),

    updatePhoto: studentProcedure
      .input(z.object({
        photoData: z.string(), // base64 photo data
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Get student by userId
        const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Update student's photoUrl with the base64 data
        await db.updateStudent(student.id, ctx.user.gymId, {
          photoUrl: input.photoData,
        });

        return {
          success: true,
          photoUrl: input.photoData
        };
      }),

    list: professorProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      // Professor vê apenas seus alunos
      return await db.listStudentsByProfessor(ctx.user.id, ctx.user.gymId);
    }),

    listAll: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        return await db.listStudents(gym.id);
      }),

    create: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
        cpf: z.string(),
        phone: z.string().optional(),
        dateOfBirth: z.string().optional(),
        address: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        planId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);

        // Create user first
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const userResult = await db.createUser({
          openId: `student-${Date.now()}-${Math.random()}`,
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: "student",
          gymId: gym.id,
        });

        // Create student
        const studentResult = await db.createStudent({
          gymId: gym.id,
          userId: userResult.insertId,
          cpf: input.cpf,
          phone: input.phone,
          birthDate: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          address: input.address,
          number: input.number,
          complement: input.complement,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          registrationNumber: `${gym.id}-${Date.now()}`,
        });

        // Create subscription
        const plan = await db.getPlanById(input.planId, gym.id);
        if (plan) {
          const subscriptionResult = await db.createSubscription({
            gymId: gym.id,
            studentId: studentResult.insertId,
            planId: input.planId,
            status: "active",
            startDate: new Date(),
            endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
          });

          // Create first payment
          await db.createPayment({
            gymId: gym.id,
            studentId: studentResult.insertId,
            subscriptionId: subscriptionResult.insertId,
            amountInCents: plan.priceInCents,
            dueDate: new Date(),
            status: "pending",
            paymentMethod: "pix",
          });
        }

        return { success: true, studentId: studentResult.insertId };
      }),

    update: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        studentId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().optional().transform(val => val === "" ? undefined : val).pipe(z.string().min(6).optional()),
        cpf: z.string().optional(),
        phone: z.string().optional(),
        dateOfBirth: z.string().optional(),
        address: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        planId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);

        // Get student to access userId
        const student = await db.getStudentById(input.studentId, gym.id);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Update students table fields (cpf, phone, address, etc.)
        const studentUpdates: any = {};
        if (input.cpf !== undefined) studentUpdates.cpf = input.cpf;
        if (input.phone !== undefined) studentUpdates.phone = input.phone;
        if (input.dateOfBirth !== undefined) studentUpdates.birthDate = new Date(input.dateOfBirth);
        if (input.address !== undefined) studentUpdates.address = input.address;
        if (input.number !== undefined) studentUpdates.number = input.number;
        if (input.complement !== undefined) studentUpdates.complement = input.complement;
        if (input.neighborhood !== undefined) studentUpdates.neighborhood = input.neighborhood;
        if (input.city !== undefined) studentUpdates.city = input.city;
        if (input.state !== undefined) studentUpdates.state = input.state;
        if (input.zipCode !== undefined) studentUpdates.zipCode = input.zipCode;

        if (Object.keys(studentUpdates).length > 0) {
          await db.updateStudent(input.studentId, gym.id, studentUpdates);
        }

        // Update users table fields (name, email, password)
        if (student.userId) {
          const userUpdates: any = {};
          if (input.name !== undefined) userUpdates.name = input.name;
          if (input.email !== undefined) userUpdates.email = input.email;
          if (input.password) {
            userUpdates.password = await bcrypt.hash(input.password, 10);
          }

          if (Object.keys(userUpdates).length > 0) {
            await db.updateUser(student.userId, userUpdates);
          }
        }

        return { success: true };
      }),

    delete: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        studentId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);

        // Get student data before deletion
        const student = await db.getStudentById(input.studentId, gym.id);

        // Delete user from Control ID if enrolled
        if (student && student.controlIdUserId) {
          try {
            const { getControlIdServiceForGym } = await import("./controlId");
            const service = await getControlIdServiceForGym(gym.id);

            if (service) {
              await service.deleteUser(student.controlIdUserId);
              console.log(`[Control ID] ✅ Student ${student.name} (ID ${student.id}) deleted from Control ID`);
            }
          } catch (error) {
            console.error(`[Control ID] ❌ Failed to delete student ${student.id} from Control ID:`, error);
            // Continue with database deletion even if Control ID fails
          }
        }

        // Delete from database
        await db.deleteStudent(input.studentId, gym.id);
        return { success: true };
      }),

    updateStatus: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        studentId: z.number(),
        membershipStatus: z.enum(["active", "inactive", "suspended", "blocked"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);

        // Get student data
        const student = await db.getStudentById(input.studentId, gym.id);

        // Update status in database
        await db.updateStudent(input.studentId, gym.id, {
          membershipStatus: input.membershipStatus
        });

        // Sync with Control ID if student has facial enrollment
        if (student && student.controlIdUserId) {
          try {
            const { getControlIdServiceForGym } = await import("./controlId");
            const service = await getControlIdServiceForGym(gym.id);

            if (service) {
              // If activating, unblock access in Control ID only if has active subscription
              if (input.membershipStatus === "active") {
                const activeSubscription = await db.getActiveSubscription(student.id, gym.id);

                if (activeSubscription) {
                  await service.unblockUserAccess(student.controlIdUserId, 1);
                  console.log(`[Control ID] ✅ Student ${student.name} (ID ${student.id}) unblocked - status changed to active`);
                } else {
                  console.log(`[Control ID] ⚠️ Student ${student.name} (ID ${student.id}) has no active subscription - access NOT unblocked`);
                }
              }
              // If blocking/suspending/deactivating, block access in Control ID
              else if (["blocked", "suspended", "inactive"].includes(input.membershipStatus)) {
                await service.blockUserAccess(student.controlIdUserId);
                console.log(`[Control ID] 🚫 Student ${student.name} (ID ${student.id}) blocked - status changed to ${input.membershipStatus}`);
              }
            }
          } catch (error) {
            console.error(`[Control ID] ❌ Failed to update access for student ${student.id}:`, error);
            // Continue even if Control ID sync fails
          }
        }

        return { success: true };
      }),

    updateMembershipStatus: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        studentId: z.number(),
        membershipStatus: z.enum(["active", "inactive", "suspended", "blocked"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.updateStudent(input.studentId, gym.id, {
          membershipStatus: input.membershipStatus
        });
        return { success: true };
      }),

    updateProfile: studentProcedure
      .input(z.object({
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }
        await db.updateStudent(student.id, ctx.user.gymId, input);
        return { success: true };
      }),

    uploadFaceImage: studentProcedure
      .input(z.object({
        imageData: z.string(), // base64
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Store image as base64 in database (no external storage needed)
        const base64Image = input.imageData.startsWith('data:')
          ? input.imageData
          : `data:image/jpeg;base64,${input.imageData}`;

        // Update database with face image
        await db.updateStudent(student.id, ctx.user.gymId, {
          faceImageUrl: base64Image,
          faceEnrolled: false, // Will be true after Control ID upload
        });

        // Upload to Control ID automatically
        console.log('[uploadFaceImage] 🚀 Iniciando upload para Control ID...');
        console.log('[uploadFaceImage] gymId:', ctx.user.gymId);
        console.log('[uploadFaceImage] student.id:', student.id);
        console.log('[uploadFaceImage] student.controlIdUserId:', student.controlIdUserId);

        try {
          const { getControlIdServiceForGym } = await import('./controlId');
          const controlIdService = await getControlIdServiceForGym(ctx.user.gymId);

          console.log('[uploadFaceImage] controlIdService encontrado:', !!controlIdService);

          if (controlIdService) {
            // Get or create Control ID user ID
            let controlIdUserId = student.controlIdUserId;

            // Check if student has active subscription
            const activeSubscription = await db.getActiveSubscription(student.id, ctx.user.gymId);
            const hasActiveSubscription = !!activeSubscription;

            console.log('[uploadFaceImage] 📋 Verificando assinatura ativa:', hasActiveSubscription);

            if (!controlIdUserId) {
              console.log('[uploadFaceImage] 👤 Criando usuário no Control ID...');
              console.log('[uploadFaceImage]    Nome:', ctx.user.name || 'Student');
              console.log('[uploadFaceImage]    Matrícula:', student.registrationNumber || String(student.id));

              // Create user in Control ID without group initially
              controlIdUserId = await controlIdService.createUser(
                ctx.user.name || 'Student',
                student.registrationNumber || String(student.id)
              );

              console.log('[uploadFaceImage] ✅ Usuário criado no Control ID com ID:', controlIdUserId);

              // Update student with Control ID user ID
              await db.updateStudent(student.id, ctx.user.gymId, {
                controlIdUserId: controlIdUserId,
              });

              console.log('[uploadFaceImage] ✅ Banco atualizado com controlIdUserId:', controlIdUserId);
            } else {
              console.log('[uploadFaceImage] ℹ️  Usuário já existe no Control ID, ID:', controlIdUserId);
            }

            // Upload face image to Control ID
            console.log('[uploadFaceImage] 📸 Enviando foto para Control ID...');

            const imageBuffer = Buffer.from(
              input.imageData.replace(/^data:image\/\w+;base64,/, ''),
              'base64'
            );

            console.log('[uploadFaceImage]    Tamanho da foto:', (imageBuffer.length / 1024).toFixed(2), 'KB');

            const result = await controlIdService.uploadFaceImage(controlIdUserId, imageBuffer);

            console.log('[uploadFaceImage] 📊 Resultado do upload:', JSON.stringify(result, null, 2));

            if (result.success) {
              // Mark as enrolled
              console.log('[uploadFaceImage] ✅ Marcando como cadastrado no banco...');

              await db.updateStudent(student.id, ctx.user.gymId, {
                faceEnrolled: true,
              });

              // Add to access group only if has active subscription AND status is active
              if (hasActiveSubscription && student.membershipStatus === 'active') {
                await controlIdService.unblockUserAccess(controlIdUserId, 1);
                console.log('[uploadFaceImage] 🔓 Acesso desbloqueado - aluno tem assinatura ativa');
              } else {
                console.log('[uploadFaceImage] ⚠️  Acesso NÃO desbloqueado - sem assinatura ativa ou status não é "active"');
                console.log('[uploadFaceImage]    - hasActiveSubscription:', hasActiveSubscription);
                console.log('[uploadFaceImage]    - membershipStatus:', student.membershipStatus);
              }

              console.log('[uploadFaceImage] ✅✅✅ SUCESSO TOTAL! Foto enviada e cadastrada!');

              return {
                success: true,
                imageUrl: base64Image,
                controlIdStatus: 'uploaded',
                quality: result.scores
              };
            } else {
              console.log('[uploadFaceImage] ❌ Upload falhou:', result.errors);

              return {
                success: true,
                imageUrl: base64Image,
                controlIdStatus: 'failed',
                error: result.errors
              };
            }
          } else {
            // No Control ID device configured
            console.log('[uploadFaceImage] ⚠️  NENHUM DISPOSITIVO Control ID ENCONTRADO!');

            return {
              success: true,
              imageUrl: base64Image,
              controlIdStatus: 'no_device'
            };
          }
        } catch (error: any) {
          console.error('[uploadFaceImage] ❌ ERRO ao enviar para Control ID:', error);
          console.error('[uploadFaceImage] Stack:', error.stack);

          // Still return success because image is saved in database
          return {
            success: true,
            imageUrl: base64Image,
            controlIdStatus: 'error',
            error: error.message
          };
        }
      }),

    // Enroll face with base64 image (from webcam or upload)
    enrollFace: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        studentId: z.number(),
        imageData: z.string(), // Base64 image
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);

        // Get student
        const student = await db.getStudentById(input.studentId, gym.id);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        try {
          // Get Control ID service
          const { getControlIdServiceForGym } = await import("./controlId");
          const service = await getControlIdServiceForGym(gym.id);

          if (!service) {
            throw new Error("Nenhum dispositivo Control ID configurado");
          }

          // Extract base64 data (remove data:image/...;base64, prefix if present)
          const base64Data = input.imageData.includes('base64,')
            ? input.imageData.split('base64,')[1]
            : input.imageData;

          // Convert base64 to buffer
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Create or get Control ID user
          let controlIdUserId = student.controlIdUserId;

          if (!controlIdUserId) {
            // Create user in Control ID
            controlIdUserId = await service.createUser(
              student.name || 'Aluno',
              student.registrationNumber || String(student.id)
            );

            // Update student with Control ID user ID
            await db.updateStudent(student.id, gym.id, {
              controlIdUserId: controlIdUserId
            });
          }

          // Upload face image
          const uploadResult = await service.uploadFaceImage(controlIdUserId, imageBuffer);

          if (uploadResult) {
            // Add user to default access group only if:
            // 1. Status is 'active'
            // 2. Has active subscription
            if (student.membershipStatus === 'active') {
              const activeSubscription = await db.getActiveSubscription(student.id, gym.id);

              if (activeSubscription) {
                await service.unblockUserAccess(controlIdUserId, 1);
                console.log(`[enrollFace] ✅ Access unblocked for ${student.name}`);
              } else {
                console.log(`[enrollFace] ⚠️ Student ${student.name} has no active subscription - access NOT unblocked`);
              }
            }

            return {
              success: true,
              controlIdUserId: controlIdUserId,
              message: "Foto facial cadastrada com sucesso!"
            };
          } else {
            throw new Error("Falha ao enviar foto para Control ID");
          }
        } catch (error) {
          console.error('[enrollFace] Error:', error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Erro ao cadastrar foto facial"
          });
        }
      }),
  }),

  // ============ PLANS ============
  plans: router({
    list: publicProcedure
      .input(z.object({
        gymSlug: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        return await db.listPlans(gym.id);
      }),

    create: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        durationDays: z.number(),
        features: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        const result = await db.createPlan({
          gymId: gym.id,
          name: input.name,
          description: input.description,
          priceInCents: Math.round(input.price * 100),
          durationDays: input.durationDays,
          features: input.features,
          active: true,
        });
        return { success: true, planId: result.insertId };
      }),

    update: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        planId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        durationDays: z.number(),
        features: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.updatePlan(input.planId, {
          name: input.name,
          description: input.description,
          priceInCents: Math.round(input.price * 100),
          durationDays: input.durationDays,
          features: input.features,
        });
        return { success: true };
      }),

    delete: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        planId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.deletePlan(input.planId);
        return { success: true };
      }),
  }),

  // ============ PAYMENTS ============
  payments: router({
    myPayments: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      return await db.getPaymentsByStudent(student.id, ctx.user.gymId);
    }),

    list: gymAdminProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      return await db.listPayments(ctx.user.gymId);
    }),

    listAll: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
      }))
      .query(async ({ ctx }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        // Get all payments with student info
        const payments = await db.listPayments(ctx.user.gymId);
        const students = await db.listStudents(ctx.user.gymId);

        // Join student info
        return payments.map(payment => {
          const student = students.find(s => s.id === payment.studentId);
          return {
            ...payment,
            student,
          };
        });
      }),

    getByStudent: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        studentId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Verify student exists and belongs to this gym
        const student = await db.getStudentById(input.studentId, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Get all payments for this student
        return await db.getPaymentsByStudent(input.studentId, ctx.user.gymId);
      }),

    generateMonthlyPayments: gymAdminProcedure
      .input(z.object({
        referenceMonth: z.date().optional(),
        studentIds: z.array(z.number()).optional(),
        planId: z.number().optional(),
        monthsToGenerate: z.number().min(1).max(12).optional(),
        dueDay: z.number().min(1).max(31).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const monthsToGenerate = input.monthsToGenerate || 1;
        const dueDay = input.dueDay || 10;
        const startDate = input.startDate || new Date();

        let totalGenerated = 0;

        // Generate payments for each month
        for (let i = 0; i < monthsToGenerate; i++) {
          const referenceMonth = new Date(startDate);
          referenceMonth.setMonth(referenceMonth.getMonth() + i);

          const result = await db.generateMonthlyPayments(ctx.user.gymId, referenceMonth, {
            studentIds: input.studentIds,
            planId: input.planId,
            dueDay,
          });

          totalGenerated += result.generated;
        }

        return {
          success: true,
          generated: totalGenerated,
          message: `${totalGenerated} mensalidade(s) gerada(s) com sucesso para ${monthsToGenerate} mês(es)`,
        };
      }),

    markAsPaid: gymAdminProcedure
      .input(z.object({
        paymentId: z.number(),
        paymentMethod: z.string(),
        paidAt: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Get payment
        const payment = await db.getPaymentById(input.paymentId, ctx.user.gymId);
        if (!payment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pagamento não encontrado" });
        }

        if (payment.status === "paid") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Pagamento já está quitado" });
        }

        // Update payment
        await db.updatePayment(input.paymentId, ctx.user.gymId, {
          status: "paid",
          paymentMethod: input.paymentMethod,
          paidAt: input.paidAt,
        });

        const paymentId = input.paymentId;

        // Get student for receipt
        const student = await db.getStudentById(payment.studentId, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Generate receipt (optional - won't block if storage fails)
        let receiptUrl: string | undefined;
        try {
          const gym = await db.getGymById(ctx.user.gymId);
          const receiptHTML = generateReceiptHTML({
            paymentId,
            studentName: student.registrationNumber,
            studentCpf: student.cpf,
            amount: payment.amountInCents,
            paidAt: input.paidAt,
            paymentMethod: input.paymentMethod,
            gymName: gym?.name || "Academia",
            description: "Mensalidade",
          });

          // Save receipt to S3
          const filename = generateReceiptFilename(paymentId);
          const receiptResult = await storagePut(
            filename,
            Buffer.from(receiptHTML, "utf-8"),
            "text/html"
          );

          receiptUrl = receiptResult.url;

          // Update payment with receipt URL
          await db.updatePayment(paymentId, ctx.user.gymId, {
            receiptUrl: receiptResult.url,
          });
        } catch (receiptError) {
          console.warn("Failed to generate/save receipt (storage not configured):", receiptError);
          // Continue without receipt - payment confirmation is more important
        }

        // Activate student membership if blocked/inactive (same logic as PIX webhook)
        if (student && (student.membershipStatus === "inactive" || student.membershipStatus === "blocked")) {
          await db.updateStudentMembershipStatus(student.id, ctx.user.gymId, "active");
          console.log(`[Payment] Student ${student.id} membership activated - payment confirmed by admin`);
        }

        // Unblock student access in Control ID when payment is confirmed
        if (student && student.controlIdUserId) {
          try {
            const { getControlIdServiceForGym } = await import("./controlId");
            const service = await getControlIdServiceForGym(ctx.user.gymId);

            if (service) {
              await service.unblockUserAccess(student.controlIdUserId, 1);
              console.log(`[Control ID] ✅ Student ID ${student.id} unblocked - payment confirmed by admin`);
            }
          } catch (error) {
            console.error(`[Control ID] ❌ Failed to unblock student ${student.id}:`, error);
            // Continue - payment confirmation is more important than unblocking
          }
        }

        return {
          success: true,
          paymentId,
          receiptUrl,
        };
      }),

    generatePixQrCode: studentProcedure
      .input(z.object({
        paymentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        
        const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Get payment details
        const payment = await db.getPaymentById(input.paymentId, ctx.user.gymId);
        if (!payment || payment.studentId !== student.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        }

        if (payment.status === "paid") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already paid" });
        }

        try {
          const pixService = await getPixServiceFromBankAccount(ctx.user.gymId!);
          const pixCharge = await pixService.createImmediateCharge({
            valor: payment.amountInCents,
            pagador: {
              cpf: student.cpf,
              nome: ctx.user.name || "Aluno",
            },
            infoAdicionais: `Mensalidade - Academia`,
            expiracao: 3600, // 1 hour
          });

          // Update payment with PIX txid
          await db.updatePayment(payment.id, ctx.user.gymId, {
            pixTxId: pixCharge.txid,
          });

          return {
            success: true,
            txid: pixCharge.txid,
            pixCopiaECola: pixCharge.pixCopiaECola,
            qrcodeBase64: pixCharge.qrcode,
            valor: pixCharge.valor,
            expiresAt: new Date(Date.now() + pixCharge.calendario.expiracao * 1000),
          };
        } catch (error: any) {
          console.error("Failed to generate PIX QR Code:", error);
          const errorMessage = error.message === "Failed to authenticate with PIX service"
            ? "Pagamento via PIX não está disponível no momento. Entre em contato com a academia para outras formas de pagamento."
            : error.message || "Erro ao gerar QR Code PIX";
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: errorMessage
          });
        }
      }),

    checkPaymentStatus: studentProcedure
      .input(z.object({
        paymentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const payment = await db.getPaymentById(input.paymentId, ctx.user.gymId);
        if (!payment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        }
        if (!payment.pixTxId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "PIX not generated yet for this payment" });
        }

        try {
          const pixService = await getPixServiceFromBankAccount(ctx.user.gymId!);
          const status = await pixService.checkPaymentStatus(payment.pixTxId);

          // Update payment if paid
          if (status.status === "CONCLUIDA" && payment.status !== "paid") {
            // Get student and gym info for receipt
            const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId!);
            const gym = await db.getGymById(ctx.user.gymId!);

            // Generate receipt (optional - won't block payment confirmation if it fails)
            let receiptUrl: string | undefined;
            if (student && gym) {
              try {
                const receiptHTML = generateReceiptHTML({
                  paymentId: payment.id,
                  studentName: ctx.user.name || "Aluno",
                  studentCpf: student.cpf,
                  amount: payment.amountInCents,
                  paidAt: status.paidAt || new Date(),
                  paymentMethod: payment.paymentMethod,
                  gymName: gym.name,
                  description: "Mensalidade",
                });

                // Save receipt to S3
                const filename = generateReceiptFilename(payment.id);
                const receiptResult = await storagePut(
                  filename,
                  Buffer.from(receiptHTML, "utf-8"),
                  "text/html"
                );
                receiptUrl = receiptResult.url;
              } catch (storageError) {
                console.warn("Failed to generate/save receipt (storage not configured):", storageError);
                // Continue without receipt URL - payment confirmation is more important
              }
            }

            await db.updatePayment(payment.id, ctx.user.gymId!, {
              status: "paid",
              paidAt: status.paidAt || new Date(),
              receiptUrl,
            });

            // Send confirmation email (optional - won't block if it fails)
            if (ctx.user.email) {
              try {
                await sendPaymentConfirmationEmail(
                  ctx.user.email,
                  ctx.user.name || "Aluno",
                  payment.amountInCents,
                  payment.dueDate
                );
              } catch (emailError) {
                console.warn("Failed to send confirmation email:", emailError);
                // Continue without email - payment confirmation is more important
              }
            }

            // Activate student membership if blocked/inactive
            if (student && (student.membershipStatus === "inactive" || student.membershipStatus === "blocked")) {
              await db.updateStudentMembershipStatus(student.id, ctx.user.gymId!, "active");
              console.log(`[Payment] Student ${student.id} membership activated - payment confirmed`);
            }

            // Unblock student access in Control ID when payment is confirmed
            if (student && student.controlIdUserId) {
              try {
                const { getControlIdServiceForGym } = await import("./controlId");
                const service = await getControlIdServiceForGym(ctx.user.gymId!);

                if (service) {
                  await service.unblockUserAccess(student.controlIdUserId, 1);
                  console.log(`[Control ID] ✅ Student ${student.name} (ID ${student.id}) unblocked - payment confirmed via API`);
                }
              } catch (error) {
                console.error(`[Control ID] ❌ Failed to unblock student ${student.id}:`, error);
                // Continue - payment confirmation is more important than unblocking
              }
            }
          }

          return {
            status: status.status,
            paid: status.status === "CONCLUIDA",
            paidAt: status.paidAt,
          };
        } catch (error: any) {
          console.error("Failed to check payment status:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to check payment status"
          });
        }
      }),

    generateReceipt: studentProcedure
      .input(z.object({
        paymentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const payment = await db.getPaymentById(input.paymentId, ctx.user.gymId);
        if (!payment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        }

        if (payment.status !== "paid") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment not completed yet" });
        }

        // Get student and gym info
        const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId!);
        const gym = await db.getGymById(ctx.user.gymId!);

        if (!student || !gym) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Student or gym not found" });
        }

        const receiptHTML = generateReceiptHTML({
          paymentId: payment.id,
          studentName: ctx.user.name || "Aluno",
          studentCpf: student.cpf,
          amount: payment.amountInCents,
          paidAt: payment.paidAt || new Date(),
          paymentMethod: payment.paymentMethod,
          gymName: gym.name,
          description: "Mensalidade",
        });

        return {
          html: receiptHTML,
          paymentId: payment.id,
        };
      }),

    // Admin endpoint to generate receipt
    generateReceiptAdmin: gymAdminProcedure
      .input(z.object({
        paymentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const payment = await db.getPaymentById(input.paymentId, ctx.user.gymId);
        if (!payment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        }

        if (payment.status !== "paid") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment not completed yet" });
        }

        // Get student and gym info
        const student = await db.getStudentById(payment.studentId, ctx.user.gymId!);
        const gym = await db.getGymById(ctx.user.gymId!);

        if (!student || !gym) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Student or gym not found" });
        }

        // Get user info for student name
        const user = await db.getUserById(student.userId);

        const receiptHTML = generateReceiptHTML({
          paymentId: payment.id,
          studentName: user?.name || "Aluno",
          studentCpf: student.cpf,
          amount: payment.amountInCents,
          paidAt: payment.paidAt || new Date(),
          paymentMethod: payment.paymentMethod,
          gymName: gym.name,
          description: "Mensalidade",
        });

        return {
          html: receiptHTML,
          paymentId: payment.id,
        };
      }),

    createInstallment: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        studentId: z.number(),
        paymentIds: z.array(z.number()),
        numInstallments: z.number().min(1).max(24),
        totalAmount: z.number(),
        forgiveInterest: z.boolean(),
        firstDueDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);

        // Verify student exists
        const student = await db.getStudentById(input.studentId, gym.id);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Verify all payments exist and belong to this student
        for (const paymentId of input.paymentIds) {
          const payment = await db.getPaymentById(paymentId, gym.id);
          if (!payment || payment.studentId !== input.studentId) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Pagamento ${paymentId} não encontrado ou não pertence ao aluno`
            });
          }
          if (payment.status === "paid") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Pagamento ${paymentId} já está quitado`
            });
          }
        }

        // Get settings to validate installment parameters
        const settings = await db.getGymSettings(gym.id);
        if (!settings?.allowInstallments) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Parcelamento não está habilitado nas configurações"
          });
        }

        if (input.numInstallments > settings.maxInstallments) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Número de parcelas excede o máximo permitido (${settings.maxInstallments})`
          });
        }

        const installmentValue = input.totalAmount / input.numInstallments;
        if (installmentValue < settings.minimumInstallmentValue) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Valor da parcela (R$ ${(installmentValue / 100).toFixed(2)}) é menor que o mínimo permitido (R$ ${(settings.minimumInstallmentValue / 100).toFixed(2)})`
          });
        }

        // Create installments
        const result = await db.createInstallmentPayments(
          gym.id,
          input.studentId,
          input.paymentIds,
          input.numInstallments,
          input.totalAmount,
          input.forgiveInterest,
          new Date(input.firstDueDate)
        );

        return {
          success: true,
          installmentPlanId: result.installmentPlanId,
          payments: result.payments,
          message: `Parcelamento criado com sucesso: ${input.numInstallments}x de R$ ${(installmentValue / 100).toFixed(2)}`
        };
      }),
  }),

  // ============ MEDICAL EXAMS ============
  medicalExams: router({
    myExams: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      return await db.getStudentMedicalExams(student.id, ctx.user.gymId);
    }),

    upload: studentProcedure
      .input(z.object({
        examDate: z.string(),
        expiryDate: z.string(),
        documentData: z.string(), // base64
        termAccepted: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        if (!input.termAccepted) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Term must be accepted" });
        }

        const buffer = Buffer.from(input.documentData, "base64");
        const fileKey = `gyms/${ctx.user.gymId}/students/${student.id}/exam-${Date.now()}.pdf`;
        const { url } = await storagePut(fileKey, buffer, "application/pdf");

        await db.createMedicalExam({
          gymId: ctx.user.gymId,
          studentId: student.id,
          examDate: new Date(input.examDate),
          expiryDate: new Date(input.expiryDate),
          documentUrl: url,
          status: "valid",
          termAccepted: true,
          termAcceptedAt: new Date(),
        });

        return { success: true, documentUrl: url };
      }),
  }),

  // ============ WORKOUTS ============
  workouts: router({
    list: professorProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      return await db.getAllWorkouts(ctx.user.gymId);
    }),

    myWorkouts: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      return await db.getStudentWorkouts(student.id, ctx.user.gymId);
    }),

    getById: publicProcedure
      .input(z.object({
        workoutId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
        }
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const workoutData = await db.getWorkoutWithExercises(input.workoutId, ctx.user.gymId);
        if (!workoutData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workout not found" });
        }
        return { workout: workoutData, exercises: workoutData.exercises || [] };
      }),

    create: professorProcedure
      .input(z.object({
        studentId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // SECURITY: Validate that student belongs to the same gym
        const student = await db.getStudentById(input.studentId, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Aluno não encontrado ou não pertence à sua academia"
          });
        }

        const result = await db.createWorkout({
          gymId: ctx.user.gymId,
          studentId: input.studentId,
          professorId: ctx.user.id,
          name: input.name,
          description: input.description || null,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          active: true,
        });
        return { success: true, workoutId: result.insertId };
      }),

    markExerciseComplete: studentProcedure
      .input(z.object({
        workoutExerciseId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // SECURITY: Validate that the workout exercise belongs to this student's gym
        // This prevents students from marking exercises from other gyms as complete
        const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Note: db.markExerciseComplete should validate workoutExerciseId belongs to student
        await db.markExerciseComplete(input.workoutExerciseId);
        return { success: true };
      }),

    addExercise: professorProcedure
      .input(z.object({
        workoutId: z.number(),
        exerciseId: z.number(),
        dayOfWeek: z.string(),
        sets: z.number(),
        reps: z.string(),
        load: z.string().optional(),
        restSeconds: z.number().optional(),
        technique: z.enum(["normal", "dropset", "superset", "giant_set", "rest_pause", "pyramidal"]).optional(),
        supersetWith: z.number().optional(),
        notes: z.string().optional(),
        orderIndex: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // SECURITY: Validate that workout belongs to professor's gym
        const workout = await db.getWorkoutWithExercises(input.workoutId, ctx.user.gymId);
        if (!workout) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Treino não encontrado ou não pertence à sua academia"
          });
        }

        const result = await db.addExerciseToWorkout({
          workoutId: input.workoutId,
          exerciseId: input.exerciseId,
          dayOfWeek: input.dayOfWeek,
          sets: input.sets,
          reps: input.reps,
          load: input.load || null,
          restSeconds: input.restSeconds || null,
          technique: input.technique || null, // Corrigido: null em vez de "normal"
          supersetWith: input.supersetWith || null,
          notes: input.notes || null,
          orderIndex: input.orderIndex,
        });
        return { success: true, exerciseId: result.insertId };
      }),

    updateExercise: professorProcedure
      .input(z.object({
        id: z.number(),
        sets: z.number().optional(),
        reps: z.string().optional(),
        load: z.string().optional(),
        restSeconds: z.number().optional(),
        technique: z.enum(["normal", "dropset", "superset", "giant_set", "rest_pause", "pyramidal"]).optional(),
        supersetWith: z.number().optional(),
        notes: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // SECURITY: Validate that workout exercise belongs to professor's gym
        const workoutExercise = await db.getWorkoutExerciseWithGym(input.id, ctx.user.gymId);
        if (!workoutExercise) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Exercício não encontrado ou não pertence à sua academia"
          });
        }

        const { id, ...updates } = input;
        await db.updateWorkoutExercise(id, updates);
        return { success: true };
      }),

    deleteExercise: professorProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // SECURITY: Validate that workout exercise belongs to professor's gym
        const workoutExercise = await db.getWorkoutExerciseWithGym(input.id, ctx.user.gymId);
        if (!workoutExercise) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Exercício não encontrado ou não pertence à sua academia"
          });
        }

        await db.deleteWorkoutExercise(input.id);
        return { success: true };
      }),

    getWithExercises: professorProcedure
      .input(z.object({
        workoutId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const workout = await db.getWorkoutWithExercises(input.workoutId, ctx.user.gymId);
        if (!workout) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Treino não encontrado" });
        }
        return workout;
      }),

    completeWorkoutDay: studentProcedure
      .input(z.object({
        workoutId: z.number(),
        dayOfWeek: z.string(),
        totalExercises: z.number(),
        totalSets: z.number(),
        durationSeconds: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        const conn = await db.getConnection();
        try {
          await conn.execute(`
            INSERT INTO workout_day_completions
            (workoutId, studentId, gymId, dayOfWeek, completedAt, totalExercises, totalSets, durationSeconds)
            VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
          `, [
            input.workoutId,
            student.id,
            ctx.user.gymId,
            input.dayOfWeek,
            input.totalExercises,
            input.totalSets,
            input.durationSeconds || null
          ]);
          return { success: true };
        } finally {
          conn.release();
        }
      }),

    checkDayCompletion: studentProcedure
      .input(z.object({
        workoutId: z.number(),
        dayOfWeek: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        const conn = await db.getConnection();
        try {
          const [rows] = await conn.execute(`
            SELECT id, completedAt
            FROM workout_day_completions
            WHERE workoutId = ?
              AND studentId = ?
              AND dayOfWeek = ?
              AND DATE(completedAt) = CURDATE()
            ORDER BY completedAt DESC
            LIMIT 1
          `, [input.workoutId, student.id, input.dayOfWeek]);

          const completions = rows as any[];
          return {
            completed: completions.length > 0,
            completedAt: completions.length > 0 ? completions[0].completedAt : null
          };
        } finally {
          conn.release();
        }
      }),

    delete: professorProcedure
      .input(z.object({
        workoutId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        await db.deleteWorkout(input.workoutId, ctx.user.gymId);
        return { success: true };
      }),
  }),

  // ============ EXERCISES ============
  exercises: router({
    list: professorProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      return await db.listExercises(ctx.user.gymId);
    }),

    create: professorProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        muscleGroup: z.string().optional(),
        equipment: z.string().optional(),
        imageData: z.string().optional(), // base64
        videoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        let imageUrl: string | null = null;
        if (input.imageData) {
          const buffer = Buffer.from(input.imageData, "base64");
          const fileKey = `gyms/${ctx.user.gymId}/exercises/img-${Date.now()}.jpg`;
          const result = await storagePut(fileKey, buffer, "image/jpeg");
          imageUrl = result.url;
        }

        const result = await db.createExercise({
          gymId: ctx.user.gymId,
          createdBy: ctx.user.id,
          name: input.name,
          description: input.description || null,
          muscleGroup: input.muscleGroup || null,
          equipment: input.equipment || null,
          imageUrl,
          videoUrl: input.videoUrl || null,
        });

        return { success: true, exerciseId: result.insertId };
      }),

    addToWorkout: professorProcedure
      .input(z.object({
        workoutId: z.number(),
        exerciseId: z.number(),
        dayOfWeek: z.string(),
        sets: z.number(),
        reps: z.string(),
        restSeconds: z.number().optional(),
        notes: z.string().optional(),
        orderIndex: z.number(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.addExerciseToWorkout({
          workoutId: input.workoutId,
          exerciseId: input.exerciseId,
          dayOfWeek: input.dayOfWeek,
          sets: input.sets,
          reps: input.reps,
          restSeconds: input.restSeconds || null,
          notes: input.notes || null,
          orderIndex: input.orderIndex,
        });
        return { success: true, workoutExerciseId: result.insertId };
      }),

    update: professorProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().optional(),
        muscleGroup: z.string().optional(),
        equipment: z.string().optional(),
        instructions: z.string().optional(),
        imageData: z.string().optional(), // base64
        videoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // SECURITY: Validate that exercise belongs to professor's gym
        const exercise = await db.getExerciseById(input.id, ctx.user.gymId);
        if (!exercise) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Exercício não encontrado ou não pertence à sua academia"
          });
        }

        let imageUrl: string | undefined;
        if (input.imageData) {
          const buffer = Buffer.from(input.imageData.split(',')[1] || input.imageData, "base64");
          const fileKey = `gyms/${ctx.user.gymId}/exercises/img-${Date.now()}.jpg`;
          const result = await storagePut(fileKey, buffer, "image/jpeg");
          imageUrl = result.url;
        }

        await db.updateExercise({
          id: input.id,
          name: input.name,
          description: input.description || null,
          muscleGroup: input.muscleGroup || null,
          equipment: input.equipment || null,
          instructions: input.instructions || null,
          imageUrl,
          videoUrl: input.videoUrl || null,
        });

        return { success: true };
      }),

    delete: professorProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        await db.deleteExercise(input.id, ctx.user.gymId);
        return { success: true };
      }),

    // Photos
    photos: router({
      list: professorProcedure
        .input(z.object({ exerciseId: z.number() }))
        .query(async ({ input }) => {
          return await db.getExercisePhotos(input.exerciseId);
        }),

      add: professorProcedure
        .input(z.object({
          exerciseId: z.number(),
          photoData: z.string(), // base64
          caption: z.string().optional(),
          orderIndex: z.number().default(0),
        }))
        .mutation(async ({ ctx, input }) => {
          if (!ctx.user.gymId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
          }

          const buffer = Buffer.from(input.photoData, "base64");
          const fileKey = `gyms/${ctx.user.gymId}/exercises/${input.exerciseId}/photo-${Date.now()}.jpg`;
          const uploadResult = await storagePut(fileKey, buffer, "image/jpeg");

          const result = await db.addExercisePhoto({
            exerciseId: input.exerciseId,
            photoUrl: uploadResult.url,
            caption: input.caption || null,
            orderIndex: input.orderIndex,
          });

          return { success: true, photoId: result.insertId };
        }),

      delete: professorProcedure
        .input(z.object({ photoId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          if (!ctx.user.gymId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
          }

          // SECURITY: Validate that photo belongs to professor's gym
          const photo = await db.getExercisePhotoWithGym(input.photoId, ctx.user.gymId);
          if (!photo) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Foto não encontrada ou não pertence à sua academia"
            });
          }

          await db.deleteExercisePhoto(input.photoId);
          return { success: true };
        }),
    }),

    // Videos
    videos: router({
      list: professorProcedure
        .input(z.object({ exerciseId: z.number() }))
        .query(async ({ input }) => {
          return await db.getExerciseVideos(input.exerciseId);
        }),

      add: professorProcedure
        .input(z.object({
          exerciseId: z.number(),
          videoData: z.string(), // base64
          title: z.string().optional(),
          durationSeconds: z.number().optional(),
          thumbnailData: z.string().optional(), // base64
        }))
        .mutation(async ({ ctx, input }) => {
          if (!ctx.user.gymId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
          }

          // Upload video
          const videoBuffer = Buffer.from(input.videoData, "base64");
          const videoKey = `gyms/${ctx.user.gymId}/exercises/${input.exerciseId}/video-${Date.now()}.mp4`;
          const videoResult = await storagePut(videoKey, videoBuffer, "video/mp4");

          // Upload thumbnail if provided
          let thumbnailUrl: string | null = null;
          if (input.thumbnailData) {
            const thumbBuffer = Buffer.from(input.thumbnailData, "base64");
            const thumbKey = `gyms/${ctx.user.gymId}/exercises/${input.exerciseId}/thumb-${Date.now()}.jpg`;
            const thumbResult = await storagePut(thumbKey, thumbBuffer, "image/jpeg");
            thumbnailUrl = thumbResult.url;
          }

          const result = await db.addExerciseVideo({
            exerciseId: input.exerciseId,
            createdBy: ctx.user.id,
            videoUrl: videoResult.url,
            thumbnailUrl,
            title: input.title || null,
            durationSeconds: input.durationSeconds || null,
          });

          return { success: true, videoId: result.insertId };
        }),

      delete: professorProcedure
        .input(z.object({ videoId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          if (!ctx.user.gymId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
          }

          // SECURITY: Validate that video belongs to professor's gym
          const video = await db.getExerciseVideoWithGym(input.videoId, ctx.user.gymId);
          if (!video) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Vídeo não encontrado ou não pertence à sua academia"
            });
          }

          await db.deleteExerciseVideo(input.videoId);
          return { success: true };
        }),
    }),
  }),

  // ============ ACCESS LOGS ============
  accessLogs: router({
    myLogs: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      const student = await db.getStudentByUserId(ctx.user.id, ctx.user.gymId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      return await db.getStudentAccessLogs(student.id, ctx.user.gymId);
    }),
  }),

  // ============ CONTROL ID DEVICES ============
  devices: router({
    list: gymAdminProcedure.query(async ({ ctx }) => {
      if (!ctx.user.gymId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
      }
      return await db.listDevices(ctx.user.gymId);
    }),

    create: gymAdminProcedure
      .input(z.object({
        name: z.string(),
        ipAddress: z.string(),
        port: z.number().default(80),
        username: z.string().optional(),
        password: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const result = await db.createDevice({
          gymId: ctx.user.gymId,
          name: input.name,
          ipAddress: input.ipAddress,
          port: input.port,
          username: input.username || null,
          password: input.password || null,
          location: input.location || null,
          active: true,
        });
        return { success: true, deviceId: result.insertId };
      }),

    update: gymAdminProcedure
      .input(z.object({
        deviceId: z.number(),
        name: z.string(),
        ipAddress: z.string(),
        port: z.number(),
        username: z.string().optional(),
        password: z.string().optional(),
        location: z.string().optional(),
        active: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const { deviceId, ...data } = input;
        await db.updateDevice(deviceId, data);
        return { success: true };
      }),

    delete: gymAdminProcedure
      .input(z.object({ deviceId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDevice(input.deviceId);
        return { success: true };
      }),

    checkStatus: gymAdminProcedure
      .input(z.object({ deviceId: z.number() }))
      .query(async ({ input }) => {
        const device = await db.getDeviceById(input.deviceId);
        if (!device) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Device not found" });
        }
        const { createControlIdService } = await import("./controlId");
        const service = createControlIdService(device.ipAddress, device.port);
        const online = await service.checkStatus();
        return { online, device };
      }),
  }),

  // Professors Management
  professors: router({
    list: gymAdminProcedure
      .input(z.object({ gymSlug: z.string() }))
      .query(async ({ ctx }) => {
        if (!ctx.user.gymId) throw new TRPCError({ code: "FORBIDDEN" });
        return await db.getUsersByRole(ctx.user.gymId, "professor");
      }),

    create: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if email already exists
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já está em uso" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Generate unique openId
        const openId = `professor-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Create user with professor role
        const userId = await db.createUser({
          gymId: ctx.user.gymId,
          openId,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          phone: input.phone,
          role: "professor",
          loginMethod: "password",
        });

        return { success: true, userId };
      }),

    update: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        professorId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const professor = await db.getUserById(input.professorId);
        if (!professor || professor.gymId !== ctx.user.gymId || professor.role !== "professor") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Professor não encontrado" });
        }

        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.email) updates.email = input.email;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.password) {
          updates.password = await bcrypt.hash(input.password, 10);
        }

        await db.updateUser(input.professorId, updates);
        return { success: true };
      }),

    delete: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        professorId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const professor = await db.getUserById(input.professorId);
        if (!professor || professor.gymId !== ctx.user.gymId || professor.role !== "professor") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Professor não encontrado" });
        }

        await db.deleteUser(input.professorId);
        return { success: true };
      }),
  }),

  // Staff Management (with permissions)
  staff: router({
    list: gymAdminProcedure
      .input(z.object({ gymSlug: z.string() }))
      .query(async ({ ctx }) => {
        if (!ctx.user.gymId) throw new TRPCError({ code: "FORBIDDEN" });
        return await db.getUsersByRole(ctx.user.gymId, "staff");
      }),

    create: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
        phone: z.string().optional(),
        permissions: z.object({
          viewStudents: z.boolean().default(false),
          editStudents: z.boolean().default(false),
          viewPayments: z.boolean().default(false),
          editPayments: z.boolean().default(false),
          viewReports: z.boolean().default(false),
          manageAccess: z.boolean().default(false),
          managePlans: z.boolean().default(false),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if email already exists
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já está em uso" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Generate unique openId
        const openId = `staff-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Create user with staff role
        const userId = await db.createUser({
          gymId: ctx.user.gymId,
          openId,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: "staff",
          loginMethod: "password",
          permissions: JSON.stringify(input.permissions),
        });

        return { success: true, userId };
      }),

    update: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        staffId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
        phone: z.string().optional(),
        permissions: z.object({
          viewStudents: z.boolean().optional(),
          editStudents: z.boolean().optional(),
          viewPayments: z.boolean().optional(),
          editPayments: z.boolean().optional(),
          viewReports: z.boolean().optional(),
          manageAccess: z.boolean().optional(),
          managePlans: z.boolean().optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const staff = await db.getUserById(input.staffId);
        if (!staff || staff.gymId !== ctx.user.gymId || staff.role !== "staff") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Staff member not found" });
        }

        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.email) updates.email = input.email;
        if (input.password) {
          updates.password = await bcrypt.hash(input.password, 10);
        }
        if (input.permissions) {
          updates.permissions = JSON.stringify(input.permissions);
        }

        await db.updateUser(input.staffId, updates);
        return { success: true };
      }),

    delete: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        staffId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const staff = await db.getUserById(input.staffId);
        if (!staff || staff.gymId !== ctx.user.gymId || staff.role !== "staff") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Staff member not found" });
        }

        await db.deleteUser(input.staffId);
        return { success: true };
      }),
  }),

  // ============ CONTROL ID FACIAL RECOGNITION ============
  controlId: router({    
    // Enroll face remotely (interactive - student looks at device)
    enrollFace: gymAdminProcedure
      .input(z.object({
        studentId: z.number(),
        deviceId: z.number().optional(), // If not provided, use active device
        auto: z.boolean().default(true),
        countdown: z.number().default(5),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Get student
        const student = await db.getStudentById(input.studentId, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Get device
        let device;
        if (input.deviceId) {
          device = await db.getDeviceById(input.deviceId);
        } else {
          device = await db.getActiveDeviceByGym(ctx.user.gymId);
        }

        if (!device) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No active Control ID device found" });
        }

        // Create Control ID service
        const { createControlIdService } = await import("./controlId");
        const service = createControlIdService(device.ipAddress, device.port);

        // Login
        await service.login(device.username || "admin", device.password || "admin");

        // Create or sync user in Control ID
        const controlIdUserId = student.controlIdUserId || student.id;
        await service.syncUser(controlIdUserId, student.name || "Sem Nome", student.registrationNumber, true);

        // Enroll face
        const result = await service.enrollFace(
          controlIdUserId,
          true, // save
          true, // sync
          input.auto,
          input.countdown
        );

        if (result.success && result.user_image) {
          // Save face image as base64 (no external storage needed)
          const base64Image = `data:image/jpeg;base64,${result.user_image}`;

          // Update student record
          await db.updateStudent(student.id, ctx.user.gymId, {
            controlIdUserId,
            faceEnrolled: true,
            faceImageUrl: base64Image,
          });

          return { success: true, imageUrl: base64Image };
        }

        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Face enrollment failed" });
      }),

    // Upload face photo (remote - no device interaction needed)
    uploadFacePhoto: gymAdminProcedure
      .input(z.object({
        studentId: z.number(),
        photoBase64: z.string(), // Base64 encoded image
        deviceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Get student
        const student = await db.getStudentById(input.studentId, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }

        // Get device
        let device;
        if (input.deviceId) {
          device = await db.getDeviceById(input.deviceId);
        } else {
          device = await db.getActiveDeviceByGym(ctx.user.gymId);
        }

        if (!device) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No active Control ID device found" });
        }

        // Create Control ID service
        const { createControlIdService } = await import("./controlId");
        const service = createControlIdService(device.ipAddress, device.port);

        // Login
        await service.login(device.username || "admin", device.password || "admin");

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(input.photoBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");

        // Create or sync user in Control ID
        const controlIdUserId = student.controlIdUserId || student.id;
        await service.syncUser(controlIdUserId, student.name || "Sem Nome", student.registrationNumber, true);

        // Upload face image
        const result = await service.uploadFaceImage(controlIdUserId, imageBuffer);

        if (result.success) {
          // Save face image as base64 (no external storage needed)
          const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

          // Update student record
          await db.updateStudent(student.id, ctx.user.gymId, {
            controlIdUserId,
            faceEnrolled: true,
            faceImageUrl: base64Image,
          });

          return { success: true, imageUrl: base64Image, scores: result.scores };
        }

        // Return errors
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: result.errors?.[0]?.message || "Face upload failed" 
        });
      }),

    // Block student access
    blockStudent: gymAdminProcedure
      .input(z.object({
        studentId: z.number(),
        deviceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const student = await db.getStudentById(input.studentId, ctx.user.gymId);
        if (!student || !student.controlIdUserId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado or not enrolled" });
        }

        // Get device
        let device;
        if (input.deviceId) {
          device = await db.getDeviceById(input.deviceId);
        } else {
          device = await db.getActiveDeviceByGym(ctx.user.gymId);
        }

        if (!device) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No active Control ID device found" });
        }

        const { createControlIdService } = await import("./controlId");
        const service = createControlIdService(device.ipAddress, device.port);
        await service.login(device.username || "admin", device.password || "admin");
        await service.blockUser(student.controlIdUserId);

        return { success: true };
      }),

    // Unblock student access
    unblockStudent: gymAdminProcedure
      .input(z.object({
        studentId: z.number(),
        deviceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const student = await db.getStudentById(input.studentId, ctx.user.gymId);
        if (!student || !student.controlIdUserId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado or not enrolled" });
        }

        // Get device
        let device;
        if (input.deviceId) {
          device = await db.getDeviceById(input.deviceId);
        } else {
          device = await db.getActiveDeviceByGym(ctx.user.gymId);
        }

        if (!device) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No active Control ID device found" });
        }

        const { createControlIdService } = await import("./controlId");
        const service = createControlIdService(device.ipAddress, device.port);
        await service.login(device.username || "admin", device.password || "admin");
        await service.unblockUser(student.controlIdUserId);

        return { success: true };
      }),

    // Get access logs from device
    getAccessLogs: gymAdminProcedure
      .input(z.object({
        deviceId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Get device
        let device;
        if (input.deviceId) {
          device = await db.getDeviceById(input.deviceId);
        } else {
          device = await db.getActiveDeviceByGym(ctx.user.gymId);
        }

        if (!device) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No active Control ID device found" });
        }

        const { createControlIdService } = await import("./controlId");
        const service = createControlIdService(device.ipAddress, device.port);
        await service.login(device.username || "admin", device.password || "admin");
        const logs = await service.loadAccessLogs();

        return { logs };
      }),
  }),

  // ============ EXPENSES (CONTAS A PAGAR) ============
  expenses: router({
    list: gymAdminProcedure
      .input(z.object({
        status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const expenses = await db.getExpensesByGym(ctx.user.gymId);

        // Filter by status if provided
        if (input.status) {
          return (expenses as any[]).filter(e => e.status === input.status);
        }

        return expenses;
      }),

    create: gymAdminProcedure
      .input(z.object({
        description: z.string(),
        supplierId: z.number(),
        categoryId: z.number().optional(),
        costCenterId: z.number().optional(),
        amountInCents: z.number(),
        dueDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.createExpense({
          ...input,
          gymId: ctx.user.gymId,
          createdBy: ctx.user.id,
          paymentMethod: null,
        });
      }),

    update: gymAdminProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        supplier: z.string().optional(),
        category: z.enum(['rent', 'utilities', 'equipment', 'maintenance', 'salaries', 'supplies', 'marketing', 'insurance', 'taxes', 'other']).optional(),
        amountInCents: z.number().optional(),
        dueDate: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const { id, ...updates } = input;
        return await db.updateExpense(id, ctx.user.gymId, updates);
      }),

    markAsPaid: gymAdminProcedure
      .input(z.object({
        id: z.number(),
        paymentMethodId: z.number(),
        paidDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.markExpenseAsPaid(
          input.id,
          ctx.user.gymId,
          input.paymentMethodId,
          input.paidDate
        );
      }),

    generateReceipt: gymAdminProcedure
      .input(z.object({
        expenseId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const expense = await db.getExpenseById(input.expenseId, ctx.user.gymId);
        if (!expense) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Despesa não encontrada" });
        }

        if (expense.status !== "paid") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Despesa ainda não foi paga" });
        }

        const gym = await db.getGymById(ctx.user.gymId);
        const supplier = await db.getSupplierById(expense.supplierId);

        const receiptHTML = generateExpenseReceiptHTML({
          expenseId: expense.id,
          supplierName: supplier?.name || "Fornecedor",
          supplierCnpj: supplier?.cnpjCpf,
          amount: expense.amountInCents || 0,
          paidAt: expense.paymentDate ? new Date(expense.paymentDate) : new Date(),
          paymentMethod: expense.paymentMethod || "N/A",
          gymName: gym.name,
          description: expense.description,
          category: expense.categoryName,
        });

        return {
          html: receiptHTML,
          expenseId: expense.id,
        };
      }),

    delete: gymAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.deleteExpense(input.id, ctx.user.gymId);
      }),
  }),

  // ============ PAYMENT METHODS ============
  paymentMethods: router({
    list: gymAdminProcedure.query(async () => {
      return await db.getPaymentMethods();
    }),

    create: gymAdminProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'pix', 'check', 'other']),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPaymentMethod(input);
      }),

    update: gymAdminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'pix', 'check', 'other']).optional(),
        description: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePaymentMethod(id, data);
      }),
  }),

  // ============ BANK ACCOUNTS (Contas Bancárias) ============
  bankAccounts: router({
    list: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        return await db.listBankAccounts(gym.id);
      }),

    create: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        titularNome: z.string().optional(),
        banco: z.number(),
        agenciaNumero: z.string().optional(),
        agenciaDv: z.string().optional(),
        contaNumero: z.string().optional(),
        contaDv: z.string().optional(),
        pixAtivo: z.string().optional(),
        pixScope: z.string().optional(),
        pixChave: z.string().optional(),
        pixTipoChave: z.string().optional(),
        pixTipoAmbiente: z.string().optional(),
        pixClientId: z.string().optional(),
        pixClientSecret: z.string().optional(),
        pixCertificado: z.string().optional(),
        pixChavePrivada: z.string().optional(),
        pixSenhaCertificado: z.string().optional(),
        pixVersaoApi: z.string().optional(),
        pixTimeoutMs: z.number().optional(),
        pixTokenExpiracao: z.number().optional(),
        pixTipoAutenticacao: z.string().optional(),
        pixUrlBase: z.string().optional(),
        pixUrlToken: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        const { gymSlug, ...data } = input;
        await db.createBankAccount({ ...data, gymId: gym.id });
        return { success: true };
      }),

    update: gymAdminProcedure
      .input(z.object({
        id: z.number(),
        gymSlug: z.string(),
        titularNome: z.string().optional(),
        banco: z.number().optional(),
        agenciaNumero: z.string().optional(),
        agenciaDv: z.string().optional(),
        contaNumero: z.string().optional(),
        contaDv: z.string().optional(),
        pixAtivo: z.string().optional(),
        pixScope: z.string().optional(),
        pixChave: z.string().optional(),
        pixTipoChave: z.string().optional(),
        pixTipoAmbiente: z.string().optional(),
        pixClientId: z.string().optional(),
        pixClientSecret: z.string().optional(),
        pixCertificado: z.string().optional(),
        pixChavePrivada: z.string().optional(),
        pixSenhaCertificado: z.string().optional(),
        pixVersaoApi: z.string().optional(),
        pixTimeoutMs: z.number().optional(),
        pixTokenExpiracao: z.number().optional(),
        pixTipoAutenticacao: z.string().optional(),
        pixUrlBase: z.string().optional(),
        pixUrlToken: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        const { id, gymSlug, ...data } = input;
        await db.updateBankAccount(id, gym.id, data);
        return { success: true };
      }),

    delete: gymAdminProcedure
      .input(z.object({
        id: z.number(),
        gymSlug: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.deleteBankAccount(input.id, gym.id);
        return { success: true };
      }),
  }),

  // ============ GYM SETTINGS (Parâmetros do Sistema) ============
  gymSettings: router({
    get: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        return await db.getGymSettings(gym.id);
      }),

    update: gymAdminProcedure
      .input(z.object({
        gymSlug: z.string(),
        daysToBlockAfterDue: z.number().min(1).max(90),
        blockOnExpiredExam: z.boolean(),
        examValidityDays: z.number().min(30).max(365),
        minimumAge: z.number().min(0).max(100),
        daysToStartInterest: z.number().min(0).max(90),
        interestRatePerMonth: z.number().min(0).max(100),
        lateFeePercentage: z.number().min(0).max(100),
        allowInstallments: z.boolean(),
        maxInstallments: z.number().min(1).max(24),
        minimumInstallmentValue: z.number().min(1000),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);

        const { gymSlug, ...settings } = input;
        await db.updateGymSettings(gym.id, settings);
        return { success: true };
      }),
  }),

  // ============ LEADS (CRM) ============
  leads: router({
    list: gymAdminProcedure
      .input(z.object({
        status: z.enum(['new', 'contacted', 'interested', 'negotiating', 'converted', 'lost']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const leads = await db.getLeadsByGym(ctx.user.gymId);

        // Filter by status if provided
        if (input.status) {
          return (leads as any[]).filter(l => l.status === input.status);
        }

        return leads;
      }),

    create: gymAdminProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().optional(),
        phone: z.string(),
        source: z.string(),
        notes: z.string().optional(),
        assignedTo: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.createLead({
          ...input,
          gymId: ctx.user.gymId,
        });
      }),

    update: gymAdminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        source: z.string().optional(),
        status: z.enum(['new', 'contacted', 'interested', 'negotiating', 'converted', 'lost']).optional(),
        notes: z.string().optional(),
        assignedTo: z.number().optional(),
        lastContactDate: z.string().optional(),
        nextFollowUpDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const { id, ...updates } = input;
        return await db.updateLead(id, ctx.user.gymId, updates);
      }),

    delete: gymAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.deleteLead(input.id, ctx.user.gymId);
      }),
  }),

  // ============ CLASS SCHEDULES ============
  schedules: router({
    list: gymAdminOrStaffProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.getClassSchedulesByGym(ctx.user.gymId);
      }),

    create: gymAdminOrStaffProcedure
      .input(z.object({
        name: z.string(),
        type: z.string(),
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        startTime: z.string(),
        durationMinutes: z.number(),
        capacity: z.number(),
        professorId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.createClassSchedule({
          ...input,
          gymId: ctx.user.gymId,
        });
      }),

    update: gymAdminOrStaffProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.string().optional(),
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
        startTime: z.string().optional(),
        durationMinutes: z.number().optional(),
        capacity: z.number().optional(),
        professorId: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const { id, ...updates } = input;
        return await db.updateClassSchedule(id, ctx.user.gymId, updates);
      }),

    delete: gymAdminOrStaffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.deleteClassSchedule(input.id, ctx.user.gymId);
      }),
  }),

  // ============ CLASS BOOKINGS (Reservas/Agendamentos) ============
  bookings: router({
    // Listar agendamentos de uma aula específica
    listBySchedule: gymAdminOrStaffProcedure
      .input(z.object({
        scheduleId: z.number(),
        bookingDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getClassBookingsBySchedule(input.scheduleId, input.bookingDate);
      }),

    // Listar próximos agendamentos da academia
    upcoming: gymAdminOrStaffProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getUpcomingClassBookings(ctx.user.gymId);
      }),

    // Criar novo agendamento
    create: gymAdminOrStaffProcedure
      .input(z.object({
        scheduleId: z.number(),
        studentId: z.number(),
        bookingDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se já existe agendamento
        const existing = await db.checkBookingExists(input.scheduleId, input.studentId, input.bookingDate);
        if (existing) {
          if (existing.status === 'cancelled') {
            // Reativar agendamento cancelado
            await db.updateClassBookingStatus(existing.id, 'confirmed');
            return { success: true, id: existing.id, message: "Agendamento reativado" };
          }
          throw new TRPCError({ code: "CONFLICT", message: "Aluno já agendado para esta aula" });
        }

        // Verificar capacidade
        const schedule = await db.getClassScheduleById(input.scheduleId, ctx.user.gymId!);
        if (!schedule) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aula não encontrada" });
        }

        const bookingCount = await db.getBookingCountForDate(input.scheduleId, input.bookingDate);
        if (bookingCount >= schedule.capacity) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Aula já está lotada" });
        }

        const result = await db.createClassBooking(input);
        return { success: true, id: result.insertId };
      }),

    // Atualizar status do agendamento (presença, falta, etc)
    updateStatus: gymAdminOrStaffProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['confirmed', 'cancelled', 'attended', 'no_show']),
      }))
      .mutation(async ({ input }) => {
        await db.updateClassBookingStatus(input.id, input.status);
        return { success: true };
      }),

    // Cancelar agendamento
    cancel: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.cancelClassBooking(input.id, ctx.user.id);
        return { success: true };
      }),

    // Listar agendamentos do aluno (para área do aluno)
    myBookings: studentProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getClassBookingsByStudent(ctx.user.id, ctx.user.gymId);
      }),
  }),

  // ============ VISITOR BOOKINGS (Agendamentos de Visitantes/Experimentais) ============
  visitorBookings: router({
    // Listar agendamentos de visitantes para uma aula
    listBySchedule: gymAdminOrStaffProcedure
      .input(z.object({
        scheduleId: z.number(),
        bookingDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getVisitorBookingsBySchedule(input.scheduleId, input.bookingDate);
      }),

    // Listar próximos agendamentos de visitantes (7 dias)
    upcoming: gymAdminOrStaffProcedure
      .query(async () => {
        return await db.getUpcomingVisitorBookings();
      }),

    // Criar novo agendamento de visitante
    create: gymAdminOrStaffProcedure
      .input(z.object({
        scheduleId: z.number(),
        visitorName: z.string(),
        visitorPhone: z.string(),
        visitorEmail: z.string().optional(),
        bookingDate: z.string(),
        notes: z.string().optional(),
        leadId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createVisitorBooking(input);
        return { success: true, id: result.insertId };
      }),

    // Atualizar status do agendamento de visitante
    updateStatus: gymAdminOrStaffProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['confirmed', 'cancelled', 'attended', 'no_show', 'converted']),
      }))
      .mutation(async ({ input }) => {
        await db.updateVisitorBookingStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ============ PHYSICAL ASSESSMENTS ============
  assessments: router({
    // Listar avaliações: Admin vê todas, Professor vê suas, Aluno vê próprias
    list: protectedProcedure
      .input(z.object({
        studentId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Aluno pode ver apenas suas próprias avaliações
        if (ctx.user.role === 'student') {
          return await db.getPhysicalAssessmentsByStudent(ctx.user.id, ctx.user.gymId);
        }

        // Professor vê avaliações que ele fez
        if (ctx.user.role === 'gym_staff') {
          if (input.studentId) {
            // Professor pode ver avaliações de um aluno específico se ele fez a avaliação
            const assessments = await db.getPhysicalAssessmentsByStudent(input.studentId, ctx.user.gymId);
            return assessments;
          }
          return await db.getPhysicalAssessmentsByProfessor(ctx.user.id, ctx.user.gymId);
        }

        // Admin vê todas
        if (input.studentId) {
          return await db.getPhysicalAssessmentsByStudent(input.studentId, ctx.user.gymId);
        }

        return await db.getPhysicalAssessmentsByGym(ctx.user.gymId);
      }),

    // Buscar avaliação por ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const assessment = await db.getPhysicalAssessmentById(input.id, ctx.user.gymId);

        if (!assessment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
        }

        // Aluno só pode ver suas próprias avaliações
        if (ctx.user.role === 'student' && assessment.studentId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        // Professor só pode ver avaliações que ele fez
        if (ctx.user.role === 'gym_staff' && assessment.assessedBy !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        return assessment;
      }),

    // Criar avaliação: Admin e Professor podem criar
    create: gymAdminOrStaffProcedure
      .input(z.object({
        studentId: z.number(),
        assessmentDate: z.string(),
        weightKg: z.number(),
        heightCm: z.number(),
        bodyFatPercentage: z.number().optional(),
        muscleMassKg: z.number().optional(),
        bmi: z.number().optional(),
        chestCm: z.number().optional(),
        waistCm: z.number().optional(),
        hipCm: z.number().optional(),
        rightArmCm: z.number().optional(),
        leftArmCm: z.number().optional(),
        rightThighCm: z.number().optional(),
        leftThighCm: z.number().optional(),
        rightCalfCm: z.number().optional(),
        leftCalfCm: z.number().optional(),
        notes: z.string().optional(),
        goals: z.string().optional(),
        photos: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.createPhysicalAssessment({
          ...input,
          assessedBy: ctx.user.id,
          gymId: ctx.user.gymId,
        });
      }),

    // Atualizar avaliação: Admin pode editar qualquer, Professor pode editar apenas suas
    update: gymAdminOrStaffProcedure
      .input(z.object({
        id: z.number(),
        assessmentDate: z.string().optional(),
        weightKg: z.number().optional(),
        heightCm: z.number().optional(),
        bodyFatPercentage: z.number().optional(),
        muscleMassKg: z.number().optional(),
        bmi: z.number().optional(),
        chestCm: z.number().optional(),
        waistCm: z.number().optional(),
        hipCm: z.number().optional(),
        rightArmCm: z.number().optional(),
        leftArmCm: z.number().optional(),
        rightThighCm: z.number().optional(),
        leftThighCm: z.number().optional(),
        rightCalfCm: z.number().optional(),
        leftCalfCm: z.number().optional(),
        notes: z.string().optional(),
        goals: z.string().optional(),
        photos: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Verificar se a avaliação existe e se o professor tem permissão
        const assessment = await db.getPhysicalAssessmentById(input.id, ctx.user.gymId);
        if (!assessment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
        }

        // Professor só pode editar suas próprias avaliações
        if (ctx.user.role === 'gym_staff' && assessment.assessedBy !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você só pode editar suas próprias avaliações" });
        }

        const { id, ...updates } = input;
        return await db.updatePhysicalAssessment(id, ctx.user.gymId, updates);
      }),

    // Deletar avaliação: Apenas Admin
    delete: gymAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.deletePhysicalAssessment(input.id, ctx.user.gymId);
      }),
  }),

  // ============ CATEGORIES ============
  categories: router({
    list: publicProcedure
      .input(z.object({
        gymSlug: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        return await db.listCategories(gym.id);
      }),

    create: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        name: z.string(),
        description: z.string().optional(),
        type: z.enum(["income", "expense"]),
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        const result = await db.createCategory({
          gymId: gym.id,
          name: input.name,
          description: input.description,
          type: input.type,
          color: input.color,
          active: true,
        });
        return { success: true, categoryId: result.insertId };
      }),

    update: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        categoryId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        type: z.enum(["income", "expense"]),
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.updateCategory(input.categoryId, {
          name: input.name,
          description: input.description,
          type: input.type,
          color: input.color,
        });
        return { success: true };
      }),

    delete: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        categoryId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.deleteCategory(input.categoryId);
        return { success: true };
      }),

    toggleActive: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        categoryId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.toggleCategoryActive(input.categoryId);
        return { success: true };
      }),
  }),

  // ============ SUPPLIERS ============
  suppliers: router({
    list: publicProcedure
      .input(z.object({
        gymSlug: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        return await db.listSuppliers(gym.id);
      }),

    fetchCNPJ: publicProcedure
      .input(z.object({
        cnpj: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const cleanCNPJ = input.cnpj.replace(/\D/g, '');

          if (cleanCNPJ.length !== 14) {
            throw new Error('CNPJ deve ter 14 dígitos');
          }

          const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);

          if (!response.ok) {
            throw new Error('Erro ao buscar CNPJ');
          }

          const data = await response.json();

          if (data.erro || data.message) {
            return null;
          }

          return {
            cnpj: data.cnpj,
            nome: data.nome,
            fantasia: data.fantasia,
            abertura: data.abertura,
            logradouro: data.logradouro,
            numero: data.numero,
            complemento: data.complemento,
            bairro: data.bairro,
            municipio: data.municipio,
            uf: data.uf,
            cep: data.cep,
            email: data.email,
            telefone: data.telefone,
            situacao: data.situacao,
          };
        } catch (error) {
          console.error('Erro ao buscar CNPJ:', error);
          return null;
        }
      }),

    create: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        name: z.string(),
        cnpjCpf: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        const result = await db.createSupplier({
          gymId: gym.id,
          name: input.name,
          cnpjCpf: input.cnpjCpf,
          email: input.email,
          phone: input.phone,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          notes: input.notes,
          active: true,
        });
        return { success: true, supplierId: result.insertId };
      }),

    update: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        supplierId: z.number(),
        name: z.string(),
        cnpjCpf: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.updateSupplier(input.supplierId, {
          name: input.name,
          cnpjCpf: input.cnpjCpf,
          email: input.email,
          phone: input.phone,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          notes: input.notes,
        });
        return { success: true };
      }),

    delete: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        supplierId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.deleteSupplier(input.supplierId);
        return { success: true };
      }),

    toggleActive: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        supplierId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.toggleSupplierActive(input.supplierId);
        return { success: true };
      }),
  }),

  // ============ COST CENTERS ============
  costCenters: router({
    list: publicProcedure
      .input(z.object({
        gymSlug: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        return await db.listCostCenters(gym.id);
      }),

    create: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        name: z.string(),
        code: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        const result = await db.createCostCenter({
          gymId: gym.id,
          name: input.name,
          code: input.code,
          description: input.description,
          active: true,
        });
        return { success: true, costCenterId: result.insertId };
      }),

    update: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        costCenterId: z.number(),
        name: z.string(),
        code: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.updateCostCenter(input.costCenterId, {
          name: input.name,
          code: input.code,
          description: input.description,
        });
        return { success: true };
      }),

    delete: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        costCenterId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.deleteCostCenter(input.costCenterId);
        return { success: true };
      }),

    toggleActive: gymAdminOrStaffProcedure
      .input(z.object({
        gymSlug: z.string(),
        costCenterId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const gym = await validateGymAccess(input.gymSlug, ctx.user.gymId, ctx.user.role);
        await db.toggleCostCenterActive(input.costCenterId);
        return { success: true };
      }),
  }),

  // ============ WELLHUB INTEGRATION ============
  wellhub: router({
    // Settings
    getSettings: gymAdminProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getWellhubSettings(ctx.user.gymId);
      }),

    saveSettings: gymAdminProcedure
      .input(z.object({
        apiToken: z.string(),
        wellhubGymId: z.string(),
        environment: z.enum(['sandbox', 'production']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.createWellhubSettings({
          gymId: ctx.user.gymId,
          ...input,
        });
      }),

    // Members
    listMembers: gymAdminOrStaffProcedure
      .input(z.object({
        status: z.enum(['active', 'inactive', 'blocked']).optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.listWellhubMembers(ctx.user.gymId, input);
      }),

    getMemberById: gymAdminOrStaffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const member = await db.getWellhubMemberById(input.id, ctx.user.gymId);
        if (!member) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Membro Wellhub não encontrado" });
        }
        return member;
      }),

    createMember: gymAdminOrStaffProcedure
      .input(z.object({
        wellhubId: z.string().length(13, 'Wellhub ID deve ter 13 dígitos'),
        name: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        customCode: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Check if member already exists
        const existing = await db.getWellhubMemberByWellhubId(input.wellhubId, ctx.user.gymId);
        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Membro Wellhub já cadastrado nesta academia"
          });
        }

        return await db.createWellhubMember({
          gymId: ctx.user.gymId,
          ...input,
          email: input.email || undefined,
        });
      }),

    updateMember: gymAdminOrStaffProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        customCode: z.string().optional(),
        status: z.enum(['active', 'inactive', 'blocked']).optional(),
        faceImageUrl: z.string().optional(),
        faceEnrolled: z.boolean().optional(),
        controlIdUserId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const { id, ...data } = input;
        await db.updateWellhubMember(id, ctx.user.gymId, {
          ...data,
          email: data.email || undefined,
        });

        return { success: true };
      }),

    deleteMember: gymAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        await db.deleteWellhubMember(input.id, ctx.user.gymId);
        return { success: true };
      }),

    // Check-ins
    validateCheckIn: gymAdminOrStaffProcedure
      .input(z.object({
        wellhubId: z.string(),
        method: z.enum(['app', 'custom_code', 'manual']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // Get or create member
        let member = await db.getWellhubMemberByWellhubId(input.wellhubId, ctx.user.gymId);

        if (!member) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Membro Wellhub não encontrado. Cadastre o membro primeiro."
          });
        }

        // Check if member is blocked
        if (member.status === 'blocked') {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Membro Wellhub bloqueado"
          });
        }

        // Create check-in
        const checkIn = await db.createWellhubCheckIn({
          wellhubMemberId: member.id,
          gymId: ctx.user.gymId,
          wellhubId: input.wellhubId,
          method: input.method || 'manual',
          createdBy: ctx.user.id,
        });

        // TODO: Call Wellhub API to validate check-in
        // For now, mark as validated
        await db.updateWellhubCheckIn(checkIn.insertId, {
          validatedAt: new Date(),
          validationStatus: 'validated',
          validationResponse: JSON.stringify({ status: 'success', method: 'manual' }),
        });

        // Update member stats
        await db.updateWellhubMemberCheckInStats(member.id);

        return {
          success: true,
          checkInId: checkIn.insertId,
          memberName: member.name || 'Membro Wellhub',
        };
      }),

    listCheckIns: gymAdminOrStaffProcedure
      .input(z.object({
        wellhubMemberId: z.number().optional(),
        validationStatus: z.enum(['pending', 'validated', 'rejected', 'expired']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const filters = {
          ...input,
          startDate: input?.startDate ? new Date(input.startDate) : undefined,
          endDate: input?.endDate ? new Date(input.endDate) : undefined,
        };

        return await db.listWellhubCheckIns(ctx.user.gymId, filters);
      }),

    getCheckInById: gymAdminOrStaffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const checkIn = await db.getWellhubCheckInById(input.id, ctx.user.gymId);
        if (!checkIn) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Check-in não encontrado" });
        }
        return checkIn;
      }),
  }),

  // Professor Dashboard
  professorDashboard: router({
    getMetrics: professorProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getProfessorDashboardMetrics(ctx.user.gymId);
      }),

    getRecentActivities: professorProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getRecentActivities(ctx.user.gymId, input?.limit || 10);
      }),

    getAlerts: professorProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getStudentAlerts(ctx.user.gymId);
      }),

    getStudentProfile: professorProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        const profile = await db.getStudentProfile(input.studentId, ctx.user.gymId);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        }
        return profile;
      }),
  }),

  // ============ WORKOUT LOGS ============
  workoutLogs: router({
    create: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        workoutId: z.number(),
        workoutDate: z.date(),
        startTime: z.date(),
        endTime: z.date().optional(),
        duration: z.number().optional(),
        overallFeeling: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
        exercises: z.array(z.object({
          exerciseId: z.number(),
          exerciseName: z.string(),
          sets: z.array(z.object({
            setNumber: z.number(),
            reps: z.number(),
            weight: z.number(),
            completed: z.boolean(),
            isPR: z.boolean().optional(),
          })),
          notes: z.string().optional(),
          orderIndex: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        // SECURITY: Validate that student belongs to the same gym
        const student = await db.getStudentById(input.studentId, ctx.user.gymId);
        if (!student) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Aluno não encontrado ou não pertence à sua academia"
          });
        }

        // SECURITY: Validate that workout belongs to the same gym
        const workout = await db.getWorkoutById(input.workoutId, ctx.user.gymId);
        if (!workout) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Treino não encontrado ou não pertence à sua academia"
          });
        }

        // Criar workout log
        const logResult = await db.createWorkoutLog({
          studentId: input.studentId,
          workoutId: input.workoutId,
          gymId: ctx.user.gymId,
          workoutDate: input.workoutDate,
          startTime: input.startTime,
          endTime: input.endTime,
          duration: input.duration,
          overallFeeling: input.overallFeeling,
          notes: input.notes,
        });

        // Criar workout log exercises
        for (const exercise of input.exercises) {
          await db.createWorkoutLogExercise({
            workoutLogId: logResult.insertId,
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            sets: JSON.stringify(exercise.sets),
            notes: exercise.notes,
            orderIndex: exercise.orderIndex,
          });
        }

        return logResult;
      }),

    list: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getStudentWorkoutLogs(input.studentId, ctx.user.gymId, input.limit);
      }),

    getById: protectedProcedure
      .input(z.object({ logId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getWorkoutLogById(input.logId, ctx.user.gymId);
      }),

    getExercises: protectedProcedure
      .input(z.object({ logId: z.number() }))
      .query(async ({ ctx, input }) => {
        const exercises = await db.getWorkoutLogExercises(input.logId);
        return exercises.map(ex => ({
          ...ex,
          sets: JSON.parse(ex.sets as string),
        }));
      }),

    update: protectedProcedure
      .input(z.object({
        logId: z.number(),
        endTime: z.date().optional(),
        duration: z.number().optional(),
        overallFeeling: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        const { logId, ...updates } = input;
        return await db.updateWorkoutLog(logId, ctx.user.gymId, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ logId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.deleteWorkoutLog(input.logId, ctx.user.gymId);
      }),
  }),

  // ============ PERSONAL RECORDS ============
  personalRecords: router({
    create: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        exerciseId: z.number(),
        recordType: z.enum(["1rm", "3rm", "5rm", "max_reps", "max_volume"]),
        weight: z.number().optional(),
        reps: z.number().optional(),
        volume: z.number().optional(),
        workoutLogId: z.number().optional(),
        achievedDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }

        return await db.createPersonalRecord({
          studentId: input.studentId,
          exerciseId: input.exerciseId,
          gymId: ctx.user.gymId,
          recordType: input.recordType,
          weight: input.weight?.toString(),
          reps: input.reps,
          volume: input.volume?.toString(),
          workoutLogId: input.workoutLogId,
          achievedDate: input.achievedDate,
          notes: input.notes,
        });
      }),

    list: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        exerciseId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getStudentPersonalRecords(input.studentId, ctx.user.gymId, input.exerciseId);
      }),

    getCurrentPR: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        exerciseId: z.number(),
        recordType: z.enum(["1rm", "3rm", "5rm", "max_reps", "max_volume"]),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getExerciseCurrentPR(input.studentId, input.exerciseId, input.recordType);
      }),

    getProgressData: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        exerciseId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.getExerciseProgressData(input.studentId, ctx.user.gymId, input.exerciseId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        weight: z.number().optional(),
        reps: z.number().optional(),
        volume: z.number().optional(),
        achievedDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const updateData: any = {};

        if (updates.weight !== undefined) updateData.weight = updates.weight.toString();
        if (updates.reps !== undefined) updateData.reps = updates.reps;
        if (updates.volume !== undefined) updateData.volume = updates.volume.toString();
        if (updates.achievedDate !== undefined) updateData.achievedDate = updates.achievedDate;
        if (updates.notes !== undefined) updateData.notes = updates.notes;

        return await db.updatePersonalRecord(id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.gymId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma academia associada" });
        }
        return await db.deletePersonalRecord(input.id, ctx.user.gymId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
