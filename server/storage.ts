import { type User, type InsertUser, type Collection, type InsertCollection, type Wishlist, type InsertWishlist, type TradeInterest, type InsertTradeInterest, type TradeCard, type TradingProfile, type InsertTradingProfile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Collection methods
  getUserCollection(userId: string): Promise<Collection[]>;
  addToCollection(collection: InsertCollection): Promise<Collection>;
  removeFromCollection(userId: string, cardId: string): Promise<boolean>;
  updateCollectionQuantity(userId: string, cardId: string, quantity: number): Promise<Collection | undefined>;
  getCollectionItem(userId: string, cardId: string): Promise<Collection | undefined>;
  clearCollection(userId: string): Promise<void>;
  
  // Wishlist methods
  getUserWishlist(userId: string): Promise<Wishlist[]>;
  addToWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, cardId: string): Promise<boolean>;
  updateWishlistQuantity(userId: string, cardId: string, quantity: number): Promise<Wishlist | undefined>;
  getWishlistItem(userId: string, cardId: string): Promise<Wishlist | undefined>;
  
  // Trading profile methods
  getTradingProfile(userId: string): Promise<TradingProfile | undefined>;
  createTradingProfile(profile: InsertTradingProfile): Promise<TradingProfile>;
  updateTradingProfile(userId: string, updates: Partial<InsertTradingProfile>): Promise<TradingProfile | undefined>;
  
  // Trade interest methods
  createTradeInterest(trade: InsertTradeInterest): Promise<TradeInterest>;
  getUserTradeInterests(userId: string): Promise<TradeInterest[]>;
  updateTradeInterestStatus(id: string, status: string): Promise<TradeInterest | undefined>;
  
  // Trade matching methods
  findTradeMatches(userId: string): Promise<{user: User, matches: {have: Collection[], want: Wishlist[]}}[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private collections: Map<string, Collection>;
  private wishlists: Map<string, Wishlist>;
  private tradingProfiles: Map<string, TradingProfile>;
  private tradeInterests: Map<string, TradeInterest>;

  constructor() {
    this.users = new Map();
    this.collections = new Map();
    this.wishlists = new Map();
    this.tradingProfiles = new Map();
    this.tradeInterests = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUserCollection(userId: string): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter(
      (collection) => collection.userId === userId,
    );
  }

  async addToCollection(collection: InsertCollection): Promise<Collection> {
    const id = randomUUID();
    const newCollection: Collection = { 
      ...collection, 
      id,
      quantity: collection.quantity || 1
    };
    this.collections.set(id, newCollection);
    return newCollection;
  }

  async removeFromCollection(userId: string, cardId: string): Promise<boolean> {
    const existing = Array.from(this.collections.entries()).find(
      ([_, collection]) => collection.userId === userId && collection.cardId === cardId
    );
    
    if (existing) {
      this.collections.delete(existing[0]);
      return true;
    }
    return false;
  }

  async updateCollectionQuantity(userId: string, cardId: string, quantity: number): Promise<Collection | undefined> {
    const existing = Array.from(this.collections.entries()).find(
      ([_, collection]) => collection.userId === userId && collection.cardId === cardId
    );
    
    if (existing) {
      const updated = { ...existing[1], quantity };
      this.collections.set(existing[0], updated);
      return updated;
    }
    return undefined;
  }

  async getCollectionItem(userId: string, cardId: string): Promise<Collection | undefined> {
    return Array.from(this.collections.values()).find(
      (collection) => collection.userId === userId && collection.cardId === cardId
    );
  }

  async clearCollection(userId: string): Promise<void> {
    const userCollectionEntries = Array.from(this.collections.entries()).filter(
      ([_, collection]) => collection.userId === userId
    );
    
    for (const [id, _] of userCollectionEntries) {
      this.collections.delete(id);
    }
  }

  // Wishlist methods
  async getUserWishlist(userId: string): Promise<Wishlist[]> {
    return Array.from(this.wishlists.values()).filter(
      (wishlist) => wishlist.userId === userId,
    );
  }

  async addToWishlist(wishlist: InsertWishlist): Promise<Wishlist> {
    const id = randomUUID();
    const newWishlist: Wishlist = { 
      ...wishlist, 
      id,
      quantity: wishlist.quantity || 1,
      priority: wishlist.priority || "medium",
      createdAt: new Date()
    };
    this.wishlists.set(id, newWishlist);
    return newWishlist;
  }

  async removeFromWishlist(userId: string, cardId: string): Promise<boolean> {
    const existing = Array.from(this.wishlists.entries()).find(
      ([_, wishlist]) => wishlist.userId === userId && wishlist.cardId === cardId
    );
    
    if (existing) {
      this.wishlists.delete(existing[0]);
      return true;
    }
    return false;
  }

  async updateWishlistQuantity(userId: string, cardId: string, quantity: number): Promise<Wishlist | undefined> {
    const existing = Array.from(this.wishlists.entries()).find(
      ([_, wishlist]) => wishlist.userId === userId && wishlist.cardId === cardId
    );
    
    if (existing) {
      const updated = { ...existing[1], quantity };
      this.wishlists.set(existing[0], updated);
      return updated;
    }
    return undefined;
  }

  async getWishlistItem(userId: string, cardId: string): Promise<Wishlist | undefined> {
    return Array.from(this.wishlists.values()).find(
      (wishlist) => wishlist.userId === userId && wishlist.cardId === cardId
    );
  }

  // Trading profile methods
  async getTradingProfile(userId: string): Promise<TradingProfile | undefined> {
    return Array.from(this.tradingProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createTradingProfile(profile: InsertTradingProfile): Promise<TradingProfile> {
    const id = randomUUID();
    const newProfile: TradingProfile = {
      ...profile,
      id,
      isTrading: profile.isTrading !== undefined ? profile.isTrading : true,
      location: profile.location || null,
      bio: profile.bio || null,
      reputation: 0,
      completedTrades: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tradingProfiles.set(id, newProfile);
    return newProfile;
  }

  async updateTradingProfile(userId: string, updates: Partial<InsertTradingProfile>): Promise<TradingProfile | undefined> {
    const existing = Array.from(this.tradingProfiles.entries()).find(
      ([_, profile]) => profile.userId === userId
    );
    
    if (existing) {
      const updated = { 
        ...existing[1], 
        ...updates, 
        updatedAt: new Date() 
      };
      this.tradingProfiles.set(existing[0], updated);
      return updated;
    }
    return undefined;
  }

  // Trade interest methods
  async createTradeInterest(trade: InsertTradeInterest): Promise<TradeInterest> {
    const id = randomUUID();
    const newTrade: TradeInterest = {
      ...trade,
      id,
      message: trade.message || null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tradeInterests.set(id, newTrade);
    return newTrade;
  }

  async getUserTradeInterests(userId: string): Promise<TradeInterest[]> {
    return Array.from(this.tradeInterests.values()).filter(
      (trade) => trade.fromUserId === userId || trade.toUserId === userId
    );
  }

  async updateTradeInterestStatus(id: string, status: string): Promise<TradeInterest | undefined> {
    const existing = this.tradeInterests.get(id);
    if (existing) {
      const updated = { ...existing, status, updatedAt: new Date() };
      this.tradeInterests.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Trade matching methods
  async findTradeMatches(userId: string): Promise<{user: User, matches: {have: Collection[], want: Wishlist[]}}[]> {
    const userWishlist = await this.getUserWishlist(userId);
    const userCollection = await this.getUserCollection(userId);
    const matches: {user: User, matches: {have: Collection[], want: Wishlist[]}}[] = [];

    // Find other users who have cards in our wishlist or want cards from our collection
    for (const [_, user] of this.users.entries()) {
      if (user.id === userId) continue;

      const otherUserCollection = await this.getUserCollection(user.id);
      const otherUserWishlist = await this.getUserWishlist(user.id);

      const haveMatches = otherUserCollection.filter(card =>
        userWishlist.some(wish => wish.cardId === card.cardId)
      );

      const wantMatches = otherUserWishlist.filter(wish =>
        userCollection.some(card => card.cardId === wish.cardId)
      );

      if (haveMatches.length > 0 || wantMatches.length > 0) {
        matches.push({
          user,
          matches: {
            have: haveMatches,
            want: wantMatches
          }
        });
      }
    }

    return matches;
  }
}

export const storage = new MemStorage();
