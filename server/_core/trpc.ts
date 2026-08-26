import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { TrpcContext } from "./context";

const retryAtFromCause = (cause: unknown) => {
  if (!cause || typeof cause !== "object") return undefined;
  const retryAt = (cause as { retryAt?: unknown }).retryAt;
  return typeof retryAt === "string" && Number.isFinite(Date.parse(retryAt)) ? retryAt : undefined;
};

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    const { stack: _stack, ...safeData } = shape.data;
    const message = error.cause instanceof ZodError
      ? "Please check the information you entered and try again."
      : shape.message;
    const retryAt = shape.data.code === "TOO_MANY_REQUESTS" ? retryAtFromCause(error.cause) : undefined;
    return { ...shape, message, data: { ...safeData, ...(retryAt ? { retryAt } : {}) } };
  },
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

/**
 * Authenticated marketplace participants may browse buyer/seller self-service
 * features. Control-plane administrators must use the admin workspace instead
 * of creating commerce records or acting as buyers.
 */
export const marketplaceUserProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    if (!opts.ctx.user || ["ADMIN", "SUPER_ADMIN"].includes(opts.ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Administrators use the control center and cannot buy or sell." });
    }
    return opts.next({ ctx: { ...opts.ctx, user: opts.ctx.user } });
  }),
);

export const operationsProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    if (!opts.ctx.user || !["SUPPORT", "MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(opts.ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return opts.next({ ctx: { ...opts.ctx, user: opts.ctx.user } });
  }),
);

export const moderatorProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    if (!opts.ctx.user || !["MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(opts.ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return opts.next({ ctx: { ...opts.ctx, user: opts.ctx.user } });
  }),
);

export const sellerProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    if (!opts.ctx.user || opts.ctx.user.role !== "SELLER") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Seller access is required." });
    }
    return opts.next({ ctx: { ...opts.ctx, user: opts.ctx.user } });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || !["ADMIN", "SUPER_ADMIN"].includes(ctx.user.role)) {
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

export const superAdminProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    if (!opts.ctx.user || opts.ctx.user.role !== "SUPER_ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return opts.next({ ctx: { ...opts.ctx, user: opts.ctx.user } });
  }),
);
