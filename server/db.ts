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

// Dealer Management
export async function getUserDealers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.parentId, userId));
}

export async function createDealer(data: { name: string; email: string; parentId: number; smsBalance?: number; emailBalance?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Create a unique openId for the dealer
  const openId = `dealer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    role: "dealer",
    parentId: data.parentId,
    smsBalance: data.smsBalance || 0,
    emailBalance: data.emailBalance || 0,
  });
}

export async function transferCredit(data: { fromUserId: number; toUserId: number; smsAmount: number; emailAmount: number; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { creditTransfers } = await import("../drizzle/schema");
  const { sql } = await import("drizzle-orm");
  
  // Check if sender has enough balance
  const sender = await db.select().from(users).where(eq(users.id, data.fromUserId)).limit(1);
  if (!sender[0] || sender[0].smsBalance < data.smsAmount || sender[0].emailBalance < data.emailAmount) {
    throw new Error("Insufficient balance");
  }
  
  // Deduct from sender
  await db.update(users)
    .set({
      smsBalance: sql`${users.smsBalance} - ${data.smsAmount}`,
      emailBalance: sql`${users.emailBalance} - ${data.emailAmount}`,
    })
    .where(eq(users.id, data.fromUserId));
  
  // Add to receiver
  await db.update(users)
    .set({
      smsBalance: sql`${users.smsBalance} + ${data.smsAmount}`,
      emailBalance: sql`${users.emailBalance} + ${data.emailAmount}`,
    })
    .where(eq(users.id, data.toUserId));
  
  // Record transfer
  await db.insert(creditTransfers).values(data);
}

export async function getCreditHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { creditTransfers } = await import("../drizzle/schema");
  const { or, desc } = await import("drizzle-orm");
  
  return db.select().from(creditTransfers)
    .where(or(eq(creditTransfers.fromUserId, userId), eq(creditTransfers.toUserId, userId)))
    .orderBy(desc(creditTransfers.createdAt));
}

export async function getAllDealerNumbers(masterId: number) {
  const db = await getDb();
  if (!db) return [];
  const { contacts } = await import("../drizzle/schema");
  
  // Get all dealers of this master
  const dealers = await getUserDealers(masterId);
  const dealerIds = dealers.map(d => d.id);
  
  if (dealerIds.length === 0) return [];
  
  const { inArray } = await import("drizzle-orm");
  const { contactGroups } = await import("../drizzle/schema");
  
  // Get all groups belonging to dealers
  const groups = await db.select().from(contactGroups).where(inArray(contactGroups.userId, dealerIds));
  const groupIds = groups.map(g => g.id);
  
  if (groupIds.length === 0) return [];
  
  // Get all contacts from those groups
  return db.select().from(contacts).where(inArray(contacts.groupId, groupIds));
}

export async function getAllDealerCampaigns(masterId: number) {
  const db = await getDb();
  if (!db) return { sms: [], email: [] };
  const { smsCampaigns, emailCampaigns } = await import("../drizzle/schema");
  
  // Get all dealers of this master
  const dealers = await getUserDealers(masterId);
  const dealerIds = dealers.map(d => d.id);
  
  if (dealerIds.length === 0) return { sms: [], email: [] };
  
  const { inArray, desc } = await import("drizzle-orm");
  
  const sms = await db.select().from(smsCampaigns)
    .where(inArray(smsCampaigns.userId, dealerIds))
    .orderBy(desc(smsCampaigns.createdAt));
  
  const email = await db.select().from(emailCampaigns)
    .where(inArray(emailCampaigns.userId, dealerIds))
    .orderBy(desc(emailCampaigns.createdAt));
  
  return { sms, email };
}

// Number Import
export async function importNumbers(data: { userId: number; groupId: number; numbers: string[]; fileName: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { contacts, numberImports } = await import("../drizzle/schema");
  
  // Remove duplicates
  const uniqueNumbers = Array.from(new Set(data.numbers));
  const duplicatesRemoved = data.numbers.length - uniqueNumbers.length;
  
  // Get existing numbers in this group
  const existingContacts = await db.select().from(contacts).where(eq(contacts.groupId, data.groupId));
  const existingNumbers = new Set(existingContacts.map(c => c.phoneNumber).filter(Boolean));
  
  // Filter out numbers that already exist
  const newNumbers = uniqueNumbers.filter(num => !existingNumbers.has(num));
  
  // Insert new contacts
  if (newNumbers.length > 0) {
    const contactsToInsert = newNumbers.map(phoneNumber => ({
      groupId: data.groupId,
      phoneNumber,
    }));
    await bulkCreateContacts(contactsToInsert);
  }
  
  // Record import
  await db.insert(numberImports).values({
    userId: data.userId,
    groupId: data.groupId,
    fileName: data.fileName,
    totalNumbers: data.numbers.length,
    duplicatesRemoved,
    successfulImports: newNumbers.length,
  });
  
  return {
    total: data.numbers.length,
    duplicatesRemoved,
    imported: newNumbers.length,
    alreadyExists: uniqueNumbers.length - newNumbers.length,
  };
}

export async function getImportHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { numberImports } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  
  return db.select().from(numberImports)
    .where(eq(numberImports.userId, userId))
    .orderBy(desc(numberImports.createdAt));
}

// Activity Logging
export async function logActivity(data: {
  userId: number;
  action: string;
  entity?: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  const { activityLogs } = await import("../drizzle/schema");
  
  try {
    await db.insert(activityLogs).values(data);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getUserActivityLogs(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  const { activityLogs } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  
  return db.select().from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function getAllActivityLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  const { activityLogs } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  
  return db.select().from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}
