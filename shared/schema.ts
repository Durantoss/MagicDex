import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  cardId: text("card_id").notNull(), // Scryfall card ID
  quantity: integer("quantity").notNull().default(1),
  cardData: jsonb("card_data").notNull(), // Store card data from Scryfall
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Trading wishlists - cards users want to acquire
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  cardId: text("card_id").notNull(), // Scryfall card ID
  quantity: integer("quantity").notNull().default(1),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  cardData: jsonb("card_data").notNull(), // Store card data from Scryfall
  createdAt: timestamp("created_at").defaultNow(),
});

// Trade offers/interests - potential trades between users
export const tradeInterests = pgTable("trade_interests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined, completed
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual cards in a trade offer
export const tradeCards = pgTable("trade_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tradeInterestId: varchar("trade_interest_id").notNull(),
  cardId: text("card_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  cardData: jsonb("card_data").notNull(),
  offeredBy: varchar("offered_by").notNull(), // user ID
});

// User trading profiles
export const tradingProfiles = pgTable("trading_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  isTrading: boolean("is_trading").notNull().default(true),
  location: text("location"), // for local trading
  tradingPreferences: jsonb("trading_preferences"), // shipping, local only, etc.
  reputation: integer("reputation").notNull().default(0),
  completedTrades: integer("completed_trades").notNull().default(0),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCollectionSchema = createInsertSchema(collections).pick({
  userId: true,
  cardId: true,
  quantity: true,
  cardData: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).pick({
  userId: true,
  cardId: true,
  quantity: true,
  priority: true,
  cardData: true,
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
