-- Create decks table
CREATE TABLE IF NOT EXISTS decks (
  id BIGSERIAL PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT DEFAULT 'standard',
  colors TEXT[] DEFAULT '{}',
  "isPublic" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create deck_cards table
CREATE TABLE IF NOT EXISTS deck_cards (
  id BIGSERIAL PRIMARY KEY,
  "deckId" BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  "cardId" TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  "cardData" JSONB NOT NULL,
  "isCommander" BOOLEAN DEFAULT false,
  "isSideboard" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks("userId");
CREATE INDEX IF NOT EXISTS idx_decks_format ON decks(format);
CREATE INDEX IF NOT EXISTS idx_decks_public ON decks("isPublic");
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards("deckId");
CREATE INDEX IF NOT EXISTS idx_deck_cards_card_id ON deck_cards("cardId");

-- Enable Row Level Security
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for decks table
CREATE POLICY "Users can view their own decks" ON decks
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can view public decks" ON decks
  FOR SELECT USING ("isPublic" = true);

CREATE POLICY "Users can insert their own decks" ON decks
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own decks" ON decks
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own decks" ON decks
  FOR DELETE USING (auth.uid() = "userId");

-- RLS Policies for deck_cards table
CREATE POLICY "Users can view cards in their own decks" ON deck_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = deck_cards."deckId" 
      AND decks."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can view cards in public decks" ON deck_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = deck_cards."deckId" 
      AND decks."isPublic" = true
    )
  );

CREATE POLICY "Users can insert cards into their own decks" ON deck_cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = deck_cards."deckId" 
      AND decks."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can update cards in their own decks" ON deck_cards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = deck_cards."deckId" 
      AND decks."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can delete cards from their own decks" ON deck_cards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = deck_cards."deckId" 
      AND decks."userId" = auth.uid()
    )
  );

-- Create function to update deck updated_at timestamp
CREATE OR REPLACE FUNCTION update_deck_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE decks SET "updatedAt" = NOW() WHERE id = NEW."deckId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update deck timestamp when cards are modified
CREATE TRIGGER update_deck_timestamp
  AFTER INSERT OR UPDATE OR DELETE ON deck_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_updated_at();
