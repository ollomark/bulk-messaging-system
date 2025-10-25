import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "master", "dealer"]).default("user").notNull(),
  smsBalance: int("smsBalance").default(0).notNull(),
  emailBalance: int("emailBalance").default(0).notNull(),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contact groups - User's contact lists
 */
export const contactGroups = mysqlTable("contactGroups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContactGroup = typeof contactGroups.$inferSelect;
export type InsertContactGroup = typeof contactGroups.$inferInsert;

/**
 * Contacts - Individual contacts in groups
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  email: varchar("email", { length: 320 }),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  customField1: text("customField1"),
  customField2: text("customField2"),
  isBlacklisted: int("isBlacklisted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * SMS Campaigns
 */
export const smsCampaigns = mysqlTable("smsCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  sendType: mysqlEnum("sendType", ["standard", "fromList"]).default("standard").notNull(),
  groupId: int("groupId"),
  scheduledAt: timestamp("scheduledAt"),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "completed", "failed"]).default("draft").notNull(),
  totalRecipients: int("totalRecipients").default(0).notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  deliveredCount: int("deliveredCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmsCampaign = typeof smsCampaigns.$inferSelect;
export type InsertSmsCampaign = typeof smsCampaigns.$inferInsert;

/**
 * Email Campaigns
 */
export const emailCampaigns = mysqlTable("emailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("bodyHtml").notNull(),
  groupId: int("groupId"),
  scheduledAt: timestamp("scheduledAt"),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "completed", "failed"]).default("draft").notNull(),
  totalRecipients: int("totalRecipients").default(0).notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  deliveredCount: int("deliveredCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

/**
 * SMS Logs - Track individual SMS sends
 */
export const smsLogs = mysqlTable("smsLogs", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  contactId: int("contactId"),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  externalId: varchar("externalId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmsLog = typeof smsLogs.$inferSelect;
export type InsertSmsLog = typeof smsLogs.$inferInsert;

/**
 * Email Logs - Track individual email sends
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  contactId: int("contactId"),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("bodyHtml").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  externalId: varchar("externalId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * Credit Transfers - Track credit transfers between master and dealers
 */
export const creditTransfers = mysqlTable("creditTransfers", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(),
  toUserId: int("toUserId").notNull(),
  smsAmount: int("smsAmount").default(0).notNull(),
  emailAmount: int("emailAmount").default(0).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransfer = typeof creditTransfers.$inferSelect;
export type InsertCreditTransfer = typeof creditTransfers.$inferInsert;

/**
 * Number Imports - Track bulk number imports from Excel/CSV
 */
export const numberImports = mysqlTable("numberImports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  totalNumbers: int("totalNumbers").default(0).notNull(),
  duplicatesRemoved: int("duplicatesRemoved").default(0).notNull(),
  successfulImports: int("successfulImports").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NumberImport = typeof numberImports.$inferSelect;
export type InsertNumberImport = typeof numberImports.$inferInsert;

/**
 * Activity Logs - Track all user activities and system events
 */
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 50 }),
  entityId: int("entityId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;