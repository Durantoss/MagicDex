import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCollectionSchema } from "@shared/schema";
import { z } from "zod";
import Anthropic from '@anthropic-ai/sdk';

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for demo - in production this would come from authentication
  const DEMO_USER_ID = "demo-user";

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

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

  // AI Deck Builder endpoint
  app.post("/api/deck-builder", async (req, res) => {
    try {
      const { deckType, strategy } = req.body;
      
      // Get user collection
      const collection = await storage.getUserCollection(DEMO_USER_ID);
      
      if (collection.length === 0) {
        return res.status(400).json({ 
          error: "No cards in collection", 
          message: "Add some cards to your collection first to build decks!" 
        });
      }

      // Prepare collection data for AI analysis
      const collectionSummary = collection.map(item => {
        const cardData = item.cardData as any;
        return {
          name: cardData.name,
          type: cardData.type_line,
          colors: cardData.colors || [],
          cmc: cardData.cmc,
          rarity: cardData.rarity,
          quantity: item.quantity,
          oracle_text: cardData.oracle_text || ""
        };
      });

      // Create AI prompt for deck building
      const prompt = `You are an expert Magic: The Gathering deck builder. I have a collection of cards and want to build a playable deck.

My Collection:
${collectionSummary.map(card => 
  `- ${card.name} (${card.type}) - ${card.colors.join('') || 'Colorless'} - CMC ${card.cmc} - Qty: ${card.quantity}${card.oracle_text ? ' - ' + card.oracle_text.slice(0, 100) : ''}`
).join('\n')}

Deck Requirements:
- Deck Type: ${deckType || 'Any format (60 cards minimum)'}
- Strategy: ${strategy || 'Best possible with available cards'}
- Use ONLY cards from my collection
- Build a balanced, playable deck
- Include lands for proper mana base

Please suggest a deck list with:
1. Main deck (60 cards minimum)
2. Brief strategy explanation
3. Mana curve analysis
4. Key synergies
5. Suggested gameplay tips

Format your response as JSON with this structure:
{
  "deckName": "Deck Name",
  "strategy": "Brief strategy description",
  "mainDeck": [
    {"name": "Card Name", "quantity": 4, "category": "Creature/Spell/Land"}
  ],
  "manaBase": "Mana base explanation",
  "synergies": ["Key synergy 1", "Key synergy 2"],
  "gameplayTips": ["Tip 1", "Tip 2"],
  "totalCards": 60
}`;

      // Call Anthropic API
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      const aiResponse = (response.content[0] as any).text;
      
      // Try to parse JSON response
      let deckSuggestion;
      try {
        // Extract JSON from response if it's wrapped in markdown or other text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          deckSuggestion = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        // Fallback: return the raw AI response
        deckSuggestion = {
          deckName: "AI Suggested Deck",
          strategy: "See full response for details",
          rawResponse: aiResponse,
          error: "Could not parse structured response"
        };
      }

      res.json(deckSuggestion);
      
    } catch (error) {
      console.error("AI Deck Builder error:", error);
      res.status(500).json({ 
        error: "Failed to generate deck suggestions",
        message: "The AI service encountered an error. Please try again."
      });
    }
  });

  // Bulk add cards from sets to collection
  app.post("/api/collection/bulk-add-set", async (req, res) => {
    try {
      const { setCode, quantity = 1 } = req.body;
      
      if (!setCode) {
        return res.status(400).json({ error: "Set code is required" });
      }

      // Search for all cards in the set using Scryfall API
      const scryfallUrl = new URL("https://api.scryfall.com/cards/search");
      scryfallUrl.searchParams.set("q", `set:${setCode}`);
      scryfallUrl.searchParams.set("unique", "cards");
      
      const response = await fetch(scryfallUrl.toString());
      
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "Set not found" });
        }
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const data = await response.json();
      const cards = data.data || [];
      
      let addedCount = 0;
      let updatedCount = 0;

      // Add each card to collection
      for (const card of cards) {
        try {
          // Check if card already exists in collection
          const existing = await storage.getCollectionItem(DEMO_USER_ID, card.id);
          
          if (existing) {
            // Update quantity
            await storage.updateCollectionQuantity(
              DEMO_USER_ID, 
              card.id, 
              existing.quantity + quantity
            );
            updatedCount++;
          } else {
            // Add new card
            await storage.addToCollection({
              userId: DEMO_USER_ID,
              cardId: card.id,
              quantity,
              cardData: card
            });
            addedCount++;
          }
        } catch (error) {
          console.error(`Error adding card ${card.name}:`, error);
        }
      }

      res.json({
        success: true,
        setCode,
        totalCards: cards.length,
        addedCount,
        updatedCount,
        message: `Added ${addedCount} new cards and updated ${updatedCount} existing cards from ${setCode} set`
      });
      
    } catch (error) {
      console.error("Bulk add set error:", error);
      res.status(500).json({ error: "Failed to add cards from set" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
