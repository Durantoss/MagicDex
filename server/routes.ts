import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCollectionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for demo - in production this would come from authentication
  const DEMO_USER_ID = "demo-user";

  // Search cards via Scryfall API
  app.get("/api/cards/search", async (req, res) => {
    try {
      const { q, page = "1" } = req.query;
      
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const scryfallUrl = new URL("https://api.scryfall.com/cards/search");
      scryfallUrl.searchParams.set("q", q);
      scryfallUrl.searchParams.set("page", page.toString());

      const response = await fetch(scryfallUrl.toString());
      
      if (!response.ok) {
        if (response.status === 404) {
          return res.json({ data: [], total_cards: 0, has_more: false });
        }
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search cards" });
    }
  });

  // Get card by ID
  app.get("/api/cards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const response = await fetch(`https://api.scryfall.com/cards/${id}`);
      
      if (!response.ok) {
        return res.status(404).json({ error: "Card not found" });
      }

      const card = await response.json();
      res.json(card);
    } catch (error) {
      console.error("Get card error:", error);
      res.status(500).json({ error: "Failed to get card" });
    }
  });

  // Get user collection
  app.get("/api/collection", async (req, res) => {
    try {
      const collection = await storage.getUserCollection(DEMO_USER_ID);
      res.json(collection);
    } catch (error) {
      console.error("Get collection error:", error);
      res.status(500).json({ error: "Failed to get collection" });
    }
  });

  // Add card to collection
  app.post("/api/collection", async (req, res) => {
    try {
      const validatedData = insertCollectionSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID,
      });

      // Check if card already exists in collection
      const existing = await storage.getCollectionItem(DEMO_USER_ID, validatedData.cardId);
      
      if (existing) {
        // Update quantity
        const updated = await storage.updateCollectionQuantity(
          DEMO_USER_ID, 
          validatedData.cardId, 
          existing.quantity + (validatedData.quantity || 1)
        );
        res.json(updated);
      } else {
        // Add new card
        const collection = await storage.addToCollection(validatedData);
        res.json(collection);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Add to collection error:", error);
      res.status(500).json({ error: "Failed to add card to collection" });
    }
  });

  // Remove card from collection
  app.delete("/api/collection/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;
      const success = await storage.removeFromCollection(DEMO_USER_ID, cardId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Card not found in collection" });
      }
    } catch (error) {
      console.error("Remove from collection error:", error);
      res.status(500).json({ error: "Failed to remove card from collection" });
    }
  });

  // Update card quantity in collection
  app.patch("/api/collection/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      const updated = await storage.updateCollectionQuantity(DEMO_USER_ID, cardId, quantity);
      
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ error: "Card not found in collection" });
      }
    } catch (error) {
      console.error("Update collection error:", error);
      res.status(500).json({ error: "Failed to update collection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
