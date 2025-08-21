import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCollectionSchema, insertWishlistSchema, insertTradingProfileSchema, insertTradeInterestSchema } from "@shared/schema";
import { z } from "zod";
import Anthropic from '@anthropic-ai/sdk';

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for demo - in production this would come from authentication
  const DEMO_USER_ID = "demo-user";

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // <important_do_not_delete>
  const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";
  // </important_do_not_delete>

  // Search cards via Scryfall API
  app.get("/api/cards/search", async (req, res) => {
    try {
      const { q, page = "1", unique = "prints" } = req.query;
      
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const scryfallUrl = new URL("https://api.scryfall.com/cards/search");
      scryfallUrl.searchParams.set("q", q);
      scryfallUrl.searchParams.set("page", page.toString());
      // Show card variations/printings instead of unique cards only
      scryfallUrl.searchParams.set("unique", unique.toString());
      // Order by release date to show newer printings first, then by set
      scryfallUrl.searchParams.set("order", "released");
      scryfallUrl.searchParams.set("dir", "desc");

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

  // Clear entire collection (must come before :cardId route)
  app.delete("/api/collection/clear", async (req, res) => {
    try {
      await storage.clearCollection(DEMO_USER_ID);
      res.json({ 
        success: true, 
        message: "Collection cleared successfully" 
      });
    } catch (error) {
      console.error("Clear collection error:", error);
      res.status(500).json({ error: "Failed to clear collection" });
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

  // Rules Q&A endpoint
  app.post("/api/rules/ask", async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Question is required" });
      }

      // Create AI prompt for MTG rules
      const prompt = `You are an expert Magic: The Gathering rules advisor. A player is asking about the rules. Please provide a clear, accurate, and concise answer to their question. Focus on the official rules and provide practical examples when helpful.

Player's Question: "${question}"

Please provide a helpful answer that explains the rule clearly and concisely. If the question involves complex interactions, break it down into simple steps. If the question is unclear or too broad, ask for clarification while providing some general guidance.`;

      const response = await anthropic.messages.create({
        // "claude-sonnet-4-20250514"
        model: DEFAULT_MODEL_STR,
        max_tokens: 1000,
        system: "You are a Magic: The Gathering rules expert. Provide accurate, clear, and helpful explanations of MTG rules. Keep answers concise but thorough.",
        messages: [
          { role: 'user', content: prompt }
        ],
      });

      const answer = (response.content[0] as any).text;

      res.json({ 
        question,
        answer,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error("Rules Q&A error:", error);
      res.status(500).json({ 
        error: "Failed to get rules answer",
        message: "The AI service encountered an error. Please try again."
      });
    }
  });

  // === TRADING ENDPOINTS ===

  // Get user wishlist
  app.get("/api/wishlist", async (req, res) => {
    try {
      const wishlist = await storage.getUserWishlist(DEMO_USER_ID);
      res.json(wishlist);
    } catch (error) {
      console.error("Get wishlist error:", error);
      res.status(500).json({ error: "Failed to get wishlist" });
    }
  });

  // Add card to wishlist
  app.post("/api/wishlist", async (req, res) => {
    try {
      const validatedData = insertWishlistSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID,
      });

      // Check if card already exists in wishlist
      const existing = await storage.getWishlistItem(DEMO_USER_ID, validatedData.cardId);
      
      if (existing) {
        // Update quantity
        const updated = await storage.updateWishlistQuantity(
          DEMO_USER_ID, 
          validatedData.cardId, 
          existing.quantity + (validatedData.quantity || 1)
        );
        res.json(updated);
      } else {
        // Add new card to wishlist
        const wishlist = await storage.addToWishlist(validatedData);
        res.json(wishlist);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Add to wishlist error:", error);
      res.status(500).json({ error: "Failed to add card to wishlist" });
    }
  });

  // Remove card from wishlist
  app.delete("/api/wishlist/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;
      const success = await storage.removeFromWishlist(DEMO_USER_ID, cardId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Card not found in wishlist" });
      }
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      res.status(500).json({ error: "Failed to remove card from wishlist" });
    }
  });

  // Update wishlist card quantity
  app.patch("/api/wishlist/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      const updated = await storage.updateWishlistQuantity(DEMO_USER_ID, cardId, quantity);
      
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ error: "Card not found in wishlist" });
      }
    } catch (error) {
      console.error("Update wishlist error:", error);
      res.status(500).json({ error: "Failed to update wishlist" });
    }
  });

  // Get user trading profile
  app.get("/api/trading/profile", async (req, res) => {
    try {
      const profile = await storage.getTradingProfile(DEMO_USER_ID);
      res.json(profile);
    } catch (error) {
      console.error("Get trading profile error:", error);
      res.status(500).json({ error: "Failed to get trading profile" });
    }
  });

  // Create or update trading profile
  app.post("/api/trading/profile", async (req, res) => {
    try {
      const existing = await storage.getTradingProfile(DEMO_USER_ID);
      
      if (existing) {
        // Update existing profile
        const validatedData = insertTradingProfileSchema.partial().parse(req.body);
        const updated = await storage.updateTradingProfile(DEMO_USER_ID, validatedData);
        res.json(updated);
      } else {
        // Create new profile
        const validatedData = insertTradingProfileSchema.parse({
          ...req.body,
          userId: DEMO_USER_ID,
        });
        const profile = await storage.createTradingProfile(validatedData);
        res.json(profile);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Create/update trading profile error:", error);
      res.status(500).json({ error: "Failed to save trading profile" });
    }
  });

  // Find trade matches
  app.get("/api/trading/matches", async (req, res) => {
    try {
      const matches = await storage.findTradeMatches(DEMO_USER_ID);
      res.json(matches);
    } catch (error) {
      console.error("Find trade matches error:", error);
      res.status(500).json({ error: "Failed to find trade matches" });
    }
  });

  // Create trade interest
  app.post("/api/trading/interests", async (req, res) => {
    try {
      const validatedData = insertTradeInterestSchema.parse({
        ...req.body,
        fromUserId: DEMO_USER_ID,
      });

      const tradeInterest = await storage.createTradeInterest(validatedData);
      res.json(tradeInterest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Create trade interest error:", error);
      res.status(500).json({ error: "Failed to create trade interest" });
    }
  });

  // Get user's trade interests
  app.get("/api/trading/interests", async (req, res) => {
    try {
      const interests = await storage.getUserTradeInterests(DEMO_USER_ID);
      res.json(interests);
    } catch (error) {
      console.error("Get trade interests error:", error);
      res.status(500).json({ error: "Failed to get trade interests" });
    }
  });

  // Update trade interest status
  app.patch("/api/trading/interests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !["pending", "accepted", "declined", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updated = await storage.updateTradeInterestStatus(id, status);
      
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ error: "Trade interest not found" });
      }
    } catch (error) {
      console.error("Update trade interest error:", error);
      res.status(500).json({ error: "Failed to update trade interest" });
    }
  });

  // Get card pricing/valuation from Scryfall
  app.get("/api/cards/:id/pricing", async (req, res) => {
    try {
      const { id } = req.params;
      const response = await fetch(`https://api.scryfall.com/cards/${id}`);
      
      if (!response.ok) {
        return res.status(404).json({ error: "Card not found" });
      }

      const card = await response.json();
      
      // Extract pricing information
      const pricing = {
        cardId: id,
        name: card.name,
        prices: card.prices || {},
        purchase_uris: card.purchase_uris || {},
        last_updated: new Date().toISOString()
      };
      
      res.json(pricing);
    } catch (error) {
      console.error("Get card pricing error:", error);
      res.status(500).json({ error: "Failed to get card pricing" });
    }
  });

  // AI Dictionary Q&A endpoint
  app.post("/api/ai/dictionary", async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "Question is required" });
      }

      const prompt = `You are helping someone learn Magic: The Gathering. They asked: "${question}"

Please provide a concise, helpful answer that:
1. Explains the Magic term or concept clearly and thoroughly
2. Uses appropriate vocabulary for 6th grade reading level (more sophisticated than elementary but still accessible)
3. Includes 1-2 practical examples from actual Magic cards or gameplay scenarios
4. Stays focused on the specific question asked
5. Keeps the response to 2-4 sentences with proper explanations

If the question isn't about Magic: The Gathering, politely redirect them to ask about Magic terms instead.`;

      const message = await anthropic.messages.create({
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
        model: DEFAULT_MODEL_STR,
      });

      const firstContent = message.content[0];
      const response = (firstContent?.type === 'text' ? firstContent.text : null) || "I'm sorry, I couldn't generate a response. Please try asking about a specific Magic: The Gathering term.";

      res.json({ answer: response });
    } catch (error) {
      console.error("AI Dictionary error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
