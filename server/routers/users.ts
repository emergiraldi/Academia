import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// Helper to check if user is super admin
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso de super administrador necessário" });
  }
  return next({ ctx });
});

export const usersRouter = router({
  /**
   * List all super_admin users
   * Only super_admin can access this
   */
  list: superAdminProcedure.query(async () => {
    const db_ = await db.getDb();
    if (!db_) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const allUsers = await db_.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      gymId: users.gymId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "super_admin"));

    return allUsers;
  }),

  /**
   * Create new super_admin user
   * Only super_admin can access this
   */
  create: superAdminProcedure
    .input(z.object({
      name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      // Check if email already exists
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email já está em uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

      // Create user
      await db.createUser({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: "super_admin",
        gymId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, message: "Usuário criado com sucesso!" };
    }),

  /**
   * Update any user's password (admin function)
   * Only super_admin can access this
   */
  updatePassword: superAdminProcedure
    .input(z.object({
      userId: z.number(),
      newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      await db.updateUserPassword(input.userId, hashedPassword);

      return { success: true, message: "Senha atualizada com sucesso!" };
    }),

  /**
   * Change current logged user's password
   * Any logged user can access this
   */
  changeMyPassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, "Senha atual é obrigatória"),
      newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(input.currentPassword, user.password);
      if (!isValidPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta" });
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      await db.updateUserPassword(ctx.user.id, hashedPassword);

      return { success: true, message: "Senha alterada com sucesso!" };
    }),

  /**
   * Delete user
   * Only super_admin can access this
   */
  delete: superAdminProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Prevent deleting yourself
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode deletar sua própria conta" });
      }

      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      await db.deleteUser(input.userId);

      return { success: true, message: "Usuário deletado com sucesso!" };
    }),
});
