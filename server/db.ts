import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Contact Groups
export async function getUserContactGroups(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { contactGroups } = await import("../drizzle/schema");
  return db.select().from(contactGroups).where(eq(contactGroups.userId, userId));
}

export async function createContactGroup(data: { userId: number; name: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { contactGroups } = await import("../drizzle/schema");
  const result = await db.insert(contactGroups).values(data);
  return result;
}

export async function deleteContactGroup(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { contactGroups, contacts } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  // Delete contacts first
  await db.delete(contacts).where(eq(contacts.groupId, groupId));
  // Delete group
  await db.delete(contactGroups).where(and(eq(contactGroups.id, groupId), eq(contactGroups.userId, userId)));
}

// Contacts
export async function getGroupContacts(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  const { contacts } = await import("../drizzle/schema");
  return db.select().from(contacts).where(eq(contacts.groupId, groupId));
}

export async function createContact(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { contacts } = await import("../drizzle/schema");
  const result = await db.insert(contacts).values(data);
  return result;
}

export async function bulkCreateContacts(contactsData: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { contacts } = await import("../drizzle/schema");
  const result = await db.insert(contacts).values(contactsData);
  return result;
}

// SMS Campaigns
export async function getUserSmsCampaigns(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { smsCampaigns } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return db.select().from(smsCampaigns).where(eq(smsCampaigns.userId, userId)).orderBy(desc(smsCampaigns.createdAt));
}

export async function createSmsCampaign(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { smsCampaigns } = await import("../drizzle/schema");
  const result = await db.insert(smsCampaigns).values(data);
  return result;
}

export async function getSmsCampaignById(campaignId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { smsCampaigns } = await import("../drizzle/schema");
  const result = await db.select().from(smsCampaigns).where(eq(smsCampaigns.id, campaignId)).limit(1);
  return result[0];
}

// Email Campaigns
export async function getUserEmailCampaigns(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { emailCampaigns } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return db.select().from(emailCampaigns).where(eq(emailCampaigns.userId, userId)).orderBy(desc(emailCampaigns.createdAt));
}

export async function createEmailCampaign(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { emailCampaigns } = await import("../drizzle/schema");
  const result = await db.insert(emailCampaigns).values(data);
  return result;
}

// Dashboard Stats
export async function getUserDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const user = await getUserByOpenId((await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]?.openId || "");
  
  const { smsCampaigns, emailCampaigns, smsLogs, emailLogs } = await import("../drizzle/schema");
  const { sql } = await import("drizzle-orm");
  
  // Get SMS stats
  const smsStats = await db.select({
    totalSent: sql<number>`COALESCE(SUM(${smsCampaigns.sentCount}), 0)`,
    totalDelivered: sql<number>`COALESCE(SUM(${smsCampaigns.deliveredCount}), 0)`,
    totalFailed: sql<number>`COALESCE(SUM(${smsCampaigns.failedCount}), 0)`,
  }).from(smsCampaigns).where(eq(smsCampaigns.userId, userId));
  
  // Get Email stats
  const emailStats = await db.select({
    totalSent: sql<number>`COALESCE(SUM(${emailCampaigns.sentCount}), 0)`,
    totalDelivered: sql<number>`COALESCE(SUM(${emailCampaigns.deliveredCount}), 0)`,
    totalFailed: sql<number>`COALESCE(SUM(${emailCampaigns.failedCount}), 0)`,
  }).from(emailCampaigns).where(eq(emailCampaigns.userId, userId));
  
  return {
    smsBalance: user?.smsBalance || 0,
    emailBalance: user?.emailBalance || 0,
    smsStats: smsStats[0] || { totalSent: 0, totalDelivered: 0, totalFailed: 0 },
    emailStats: emailStats[0] || { totalSent: 0, totalDelivered: 0, totalFailed: 0 },
  };
}
