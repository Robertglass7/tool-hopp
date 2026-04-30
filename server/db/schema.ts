import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Users table
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  password: text("password").notNull(),
  role: mysqlEnum("role", ["user", "admin", "hopper"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  phone: varchar("phone", { length: 20 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Tools table
 */
export const tools = mysqlTable("tools", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  condition: mysqlEnum("condition", ["new", "excellent", "good", "fair", "needs_repair"]).notNull(),
  pricePerHour: decimal("pricePerHour", { precision: 10, scale: 2 }).notNull(),
  location: varchar("location", { length: 255 }),
  isAvailable: boolean("isAvailable").default(true),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Bookings table
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  toolId: int("toolId").notNull(),
  renterId: int("renterId").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "active", "completed", "cancelled"]).default("pending").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Messages table
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Hopper Tasks table
 */
export const hopperTasks = mysqlTable("hopperTasks", {
  id: int("id").autoincrement().primaryKey(),
  hopperId: int("hopperId"),
  bookingId: int("bookingId"),
  type: mysqlEnum("type", ["delivery", "pickup", "inspection"]).notNull(),
  status: mysqlEnum("status", ["available", "assigned", "in_progress", "completed"]).default("available").notNull(),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Reports table (Community Safety)
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  reportedId: int("reportedId"), // Reported user
  toolId: int("toolId"), // Or reported tool
  reason: text("reason").notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["pending", "reviewed", "resolved"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
