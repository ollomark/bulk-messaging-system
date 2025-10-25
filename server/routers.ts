import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const { getUserDashboardStats } = await import("./db");
      return getUserDashboardStats(ctx.user.id);
    }),
  }),

  contactGroups: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserContactGroups } = await import("./db");
      return getUserContactGroups(ctx.user.id);
    }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "name" in val) {
          return val as { name: string; description?: string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { createContactGroup } = await import("./db");
        await createContactGroup({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "groupId" in val) {
          return val as { groupId: number };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { deleteContactGroup } = await import("./db");
        await deleteContactGroup(input.groupId, ctx.user.id);
        return { success: true };
      }),
  }),

  contacts: router({
    list: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "groupId" in val) {
          return val as { groupId: number };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ input }) => {
        const { getGroupContacts } = await import("./db");
        return getGroupContacts(input.groupId);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "groupId" in val) {
          return val as any;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { createContact } = await import("./db");
        await createContact(input);
        return { success: true };
      }),
    bulkCreate: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "contacts" in val) {
          return val as { contacts: any[] };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { bulkCreateContacts } = await import("./db");
        await bulkCreateContacts(input.contacts);
        return { success: true };
      }),
  }),

  smsCampaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserSmsCampaigns } = await import("./db");
      return getUserSmsCampaigns(ctx.user.id);
    }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "name" in val && "message" in val) {
          return val as any;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { createSmsCampaign } = await import("./db");
        await createSmsCampaign({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
  }),

  emailCampaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserEmailCampaigns } = await import("./db");
      return getUserEmailCampaigns(ctx.user.id);
    }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "name" in val && "subject" in val && "bodyHtml" in val) {
          return val as any;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { createEmailCampaign } = await import("./db");
        await createEmailCampaign({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
