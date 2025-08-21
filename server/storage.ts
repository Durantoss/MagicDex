import { type User, type InsertUser, type Collection, type InsertCollection } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Collection methods
  getUserCollection(userId: string): Promise<Collection[]>;
  addToCollection(collection: InsertCollection): Promise<Collection>;
  removeFromCollection(userId: string, cardId: string): Promise<boolean>;
  updateCollectionQuantity(userId: string, cardId: string, quantity: number): Promise<Collection | undefined>;
  getCollectionItem(userId: string, cardId: string): Promise<Collection | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private collections: Map<string, Collection>;

  constructor() {
    this.users = new Map();
    this.collections = new Map();
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
}

export const storage = new MemStorage();
