-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (Supabase auth handles this, but we can reference it)
-- The auth.users table is automatically created by Supabase

-- Create collections table
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    card_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

-- Create wishlists table
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    card_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

-- Create trading profiles table
CREATE TABLE trading_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_trading BOOLEAN NOT NULL DEFAULT true,
    location TEXT,
    trading_preferences JSONB,
    reputation INTEGER NOT NULL DEFAULT 0,
    completed_trades INTEGER NOT NULL DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trade interests table
CREATE TABLE trade_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trade cards table
CREATE TABLE trade_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_interest_id UUID NOT NULL REFERENCES trade_interests(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    card_data JSONB NOT NULL,
    offered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_card_id ON collections(card_id);
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_card_id ON wishlists(card_id);
CREATE INDEX idx_trading_profiles_user_id ON trading_profiles(user_id);
CREATE INDEX idx_trade_interests_from_user ON trade_interests(from_user_id);
CREATE INDEX idx_trade_interests_to_user ON trade_interests(to_user_id);
CREATE INDEX idx_trade_cards_trade_interest ON trade_cards(trade_interest_id);

-- Enable Row Level Security (RLS)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for collections
CREATE POLICY "Users can view their own collections" ON collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections" ON collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON collections
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for wishlists
CREATE POLICY "Users can view their own wishlists" ON wishlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlists" ON wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlists" ON wishlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlists" ON wishlists
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for trading profiles
CREATE POLICY "Users can view all trading profiles" ON trading_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own trading profile" ON trading_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading profile" ON trading_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading profile" ON trading_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for trade interests
CREATE POLICY "Users can view trade interests involving them" ON trade_interests
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create trade interests" ON trade_interests
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update trade interests involving them" ON trade_interests
    FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Create RLS policies for trade cards
CREATE POLICY "Users can view trade cards for their trade interests" ON trade_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trade_interests 
            WHERE trade_interests.id = trade_cards.trade_interest_id 
            AND (trade_interests.from_user_id = auth.uid() OR trade_interests.to_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert trade cards for their trade interests" ON trade_cards
    FOR INSERT WITH CHECK (
        auth.uid() = offered_by AND
        EXISTS (
            SELECT 1 FROM trade_interests 
            WHERE trade_interests.id = trade_cards.trade_interest_id 
            AND trade_interests.from_user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_trading_profiles_updated_at BEFORE UPDATE ON trading_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_interests_updated_at BEFORE UPDATE ON trade_interests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
