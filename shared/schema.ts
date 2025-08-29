import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- ENUMS ---
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const tradeStatusEnum = pgEnum("trade_status", [
  "pending",
  "accepted",
  "declined",
  "completed",
]);

// --- USERS ---
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- COLLECTIONS ---
export const collections = pgTable(
  "collections",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    cardId: text("card_id").notNull(),
    quantity: integer("quantity").notNull().default(1),
    cardData: jsonb("card_data").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("collections_user_id_idx").on(table.userId),
    cardIdx: index("collections_card_id_idx").on(table.cardId),
  })
);

// --- WISHLISTS ---
export const wishlists = pgTable(
  "wishlists",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    cardId: text("card_id").notNull(),
    quantity: integer("quantity").notNull().default(1),
    priority: priorityEnum("priority").notNull().default("medium"),
    cardData: jsonb("card_data").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("wishlists_user_id_idx").on(table.userId),
    priorityIdx: index("wishlists_priority_idx").on(table.priority),
  })
);

// --- TRADE INTERESTS ---
export const tradeInterests = pgTable(
  "trade_interests",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    fromUserId: varchar("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    toUserId: varchar("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    status: tradeStatusEnum("status").notNull().default("pending"),
    message: text("message"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    fromUserIdx: index("trade_interests_from_user_idx").on(table.fromUserId),
    toUserIdx: index("trade_interests_to_user_idx").on(table.toUserId),
    statusIdx: index("trade_interests_status_idx").on(table.status),
  })
);

// --- TRADE CARDS ---
export const tradeCards = pgTable(
  "trade_cards",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tradeInterestId: varchar("trade_interest_id")
      .notNull()
      .references(() => tradeInterests.id, { onDelete: "cascade", onUpdate: "cascade" }),
    cardId: text("card_id").notNull(),
    quantity: integer("quantity").notNull().default(1),
    cardData: jsonb("card_data").notNull(),
    offeredBy: varchar("offered_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tradeInterestIdx: index("trade_cards_trade_interest_idx").on(table.tradeInterestId),
  })
);

// --- TRADING PROFILES ---
export const tradingProfiles = pgTable("trading_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  isTrading: boolean("is_trading").notNull().default(true),
  location: text("location"),
  tradingPreferences: jsonb("trading_preferences"),
  reputation: integer("reputation").notNull().default(0),
  completedTrades: integer("completed_trades").notNull().default(0),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- ZOD SCHEMAS ---
export const insertUserSchema = createInsertSchema(users)
  .pick({ username: true, password: true })
  .extend({
    username: z.string().min(3).max(32),
    password: z.string().min(8),
  });

export const insertCollectionSchema = createInsertSchema(collections)
  .pick({ userId: true, cardId: true, quantity: true, cardData: true })
  .extend({ quantity: z.number().min(1) });

export const insertWishlistSchema = createInsertSchema(wishlists)
  .pick({ userId: true, cardId: true, quantity: true, priority: true, cardData: true })
  .extend({
    quantity: z.number().min(1),
    priority: z.enum(priorityEnum.enumValues),
  });

export const insertTradeInterestSchema = createInsertSchema(tradeInterests).pick({
  fromUserId: true,
  toUserId: true,
  message: true,
});

export const insertTradingProfileSchema = createInsertSchema(tradingProfiles).pick({
  userId: true,
  isTrading: true,
  location: true,
  tradingPreferences: true,
  bio: true,
});

// --- TYPES ---
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlists.$inferSelect;

export type InsertTradeInterest = z.infer<typeof insertTradeInterestSchema>;
export type TradeInterest = typeof tradeInterests.$inferSelect;

export type TradeCard = typeof tradeCards.$inferSelect;

export type InsertTradingProfile = z.infer<typeof insertTradingProfileSchema>;
export type TradingProfile = typeof tradingProfiles.$inferSelect;
