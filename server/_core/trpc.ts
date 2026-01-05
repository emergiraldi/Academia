import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || (ctx.user.role !== 'super_admin' && ctx.user.role !== 'gym_admin')) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Gym Admin com validação de isolamento de dados (SaaS multi-tenant)
export const gymAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    // Super admin pode acessar qualquer academia
    if (ctx.user.role === 'super_admin') {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }

    // Gym admin só pode acessar dados da própria academia
    if (ctx.user.role !== 'gym_admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    if (!ctx.user.gymId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nenhuma academia associada ao usuário" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Professor procedure
export const professorProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (ctx.user.role !== 'professor' && ctx.user.role !== 'gym_admin' && ctx.user.role !== 'super_admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a professores" });
    }

    if (!ctx.user.gymId && ctx.user.role !== 'super_admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nenhuma academia associada" });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// Student procedure
export const studentProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (!ctx.user.gymId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nenhuma academia associada" });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
