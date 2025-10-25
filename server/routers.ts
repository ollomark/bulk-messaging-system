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

  dealers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserDealers } = await import("./db");
      return getUserDealers(ctx.user.id);
    }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "name" in val && "email" in val) {
          return val as { name: string; email: string; smsBalance?: number; emailBalance?: number };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { createDealer } = await import("./db");
        await createDealer({ ...input, parentId: ctx.user.id });
        return { success: true };
      }),
    transferCredit: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "dealerId" in val) {
          return val as { dealerId: number; smsAmount: number; emailAmount: number; note?: string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { transferCredit } = await import("./db");
        await transferCredit({
          fromUserId: ctx.user.id,
          toUserId: input.dealerId,
          smsAmount: input.smsAmount,
          emailAmount: input.emailAmount,
          note: input.note,
        });
        return { success: true };
      }),
    creditHistory: protectedProcedure.query(async ({ ctx }) => {
      const { getCreditHistory } = await import("./db");
      return getCreditHistory(ctx.user.id);
    }),
    allNumbers: protectedProcedure.query(async ({ ctx }) => {
      const { getAllDealerNumbers } = await import("./db");
      return getAllDealerNumbers(ctx.user.id);
    }),
    allCampaigns: protectedProcedure.query(async ({ ctx }) => {
      const { getAllDealerCampaigns } = await import("./db");
      return getAllDealerCampaigns(ctx.user.id);
    }),
  }),

  activityLogs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserActivityLogs } = await import("./db");
      return getUserActivityLogs(ctx.user.id);
    }),
  }),

  importNumbers: router({
    upload: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "groupId" in val && "numbers" in val) {
          return val as { groupId: number; numbers: string[]; fileName: string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { importNumbers } = await import("./db");
        const result = await importNumbers({
          userId: ctx.user.id,
          groupId: input.groupId,
          numbers: input.numbers,
          fileName: input.fileName,
        });
        return result;
      }),
    history: protectedProcedure.query(async ({ ctx }) => {
      const { getImportHistory } = await import("./db");
      return getImportHistory(ctx.user.id);
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
