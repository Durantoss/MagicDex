-- Add foil support to collections table
ALTER TABLE collections 
ADD COLUMN normal_quantity INTEGER DEFAULT 0,
ADD COLUMN foil_quantity INTEGER DEFAULT 0,
ADD COLUMN finish TEXT DEFAULT 'normal' CHECK (finish IN ('normal', 'foil', 'both'));

-- Add foil support to wishlists table
ALTER TABLE wishlists 
ADD COLUMN normal_quantity INTEGER DEFAULT 0,
ADD COLUMN foil_quantity INTEGER DEFAULT 0,
ADD COLUMN finish TEXT DEFAULT 'normal' CHECK (finish IN ('normal', 'foil', 'both'));

-- Migrate existing data from quantity column to normal_quantity
UPDATE collections 
SET normal_quantity = quantity 
WHERE quantity IS NOT NULL AND quantity > 0;

UPDATE wishlists 
SET normal_quantity = quantity 
WHERE quantity IS NOT NULL AND quantity > 0;

-- Add constraints to ensure at least one quantity is greater than 0
ALTER TABLE collections 
ADD CONSTRAINT collections_quantity_check 
CHECK (normal_quantity > 0 OR foil_quantity > 0);

ALTER TABLE wishlists 
ADD CONSTRAINT wishlists_quantity_check 
CHECK (normal_quantity > 0 OR foil_quantity > 0);

-- Update the unique constraint to allow multiple entries per card (different finishes)
-- First drop the existing unique constraint
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_user_id_card_id_key;
ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_user_id_card_id_key;

-- Add new unique constraint that includes finish type
ALTER TABLE collections 
ADD CONSTRAINT collections_user_card_unique 
UNIQUE(user_id, card_id);

ALTER TABLE wishlists 
ADD CONSTRAINT wishlists_user_card_unique 
UNIQUE(user_id, card_id);

-- Create indexes for better performance on new columns
CREATE INDEX idx_collections_normal_quantity ON collections(normal_quantity) WHERE normal_quantity > 0;
CREATE INDEX idx_collections_foil_quantity ON collections(foil_quantity) WHERE foil_quantity > 0;
CREATE INDEX idx_collections_finish ON collections(finish);

CREATE INDEX idx_wishlists_normal_quantity ON wishlists(normal_quantity) WHERE normal_quantity > 0;
CREATE INDEX idx_wishlists_foil_quantity ON wishlists(foil_quantity) WHERE foil_quantity > 0;
CREATE INDEX idx_wishlists_finish ON wishlists(finish);

-- Create a function to automatically set finish type based on quantities
CREATE OR REPLACE FUNCTION update_finish_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Determine finish type based on quantities
    IF NEW.normal_quantity > 0 AND NEW.foil_quantity > 0 THEN
        NEW.finish = 'both';
    ELSIF NEW.foil_quantity > 0 THEN
        NEW.finish = 'foil';
    ELSE
        NEW.finish = 'normal';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update finish type
CREATE TRIGGER collections_update_finish_trigger
    BEFORE INSERT OR UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_finish_type();

CREATE TRIGGER wishlists_update_finish_trigger
    BEFORE INSERT OR UPDATE ON wishlists
    FOR EACH ROW
    EXECUTE FUNCTION update_finish_type();

-- Create a view for collection statistics with foil breakdown
CREATE OR REPLACE VIEW collection_stats AS
SELECT 
    user_id,
    COUNT(*) as unique_cards,
    SUM(normal_quantity) as total_normal,
    SUM(foil_quantity) as total_foil,
    SUM(normal_quantity + foil_quantity) as total_cards,
    COUNT(*) FILTER (WHERE foil_quantity > 0) as cards_with_foil,
    COUNT(*) FILTER (WHERE normal_quantity > 0 AND foil_quantity = 0) as normal_only_cards,
    COUNT(*) FILTER (WHERE foil_quantity > 0 AND normal_quantity = 0) as foil_only_cards,
    COUNT(*) FILTER (WHERE normal_quantity > 0 AND foil_quantity > 0) as both_finish_cards,
    ROUND(
        CASE 
            WHEN SUM(normal_quantity + foil_quantity) > 0 
            THEN (SUM(foil_quantity)::DECIMAL / SUM(normal_quantity + foil_quantity)) * 100 
            ELSE 0 
        END, 2
    ) as foil_percentage
FROM collections
GROUP BY user_id;

-- Create a view for wishlist statistics with foil breakdown
CREATE OR REPLACE VIEW wishlist_stats AS
SELECT 
    user_id,
    COUNT(*) as unique_cards,
    SUM(normal_quantity) as total_normal,
    SUM(foil_quantity) as total_foil,
    SUM(normal_quantity + foil_quantity) as total_cards,
    COUNT(*) FILTER (WHERE foil_quantity > 0) as cards_with_foil,
    COUNT(*) FILTER (WHERE normal_quantity > 0 AND foil_quantity = 0) as normal_only_cards,
    COUNT(*) FILTER (WHERE foil_quantity > 0 AND normal_quantity = 0) as foil_only_cards,
    COUNT(*) FILTER (WHERE normal_quantity > 0 AND foil_quantity > 0) as both_finish_cards,
    ROUND(
        CASE 
            WHEN SUM(normal_quantity + foil_quantity) > 0 
            THEN (SUM(foil_quantity)::DECIMAL / SUM(normal_quantity + foil_quantity)) * 100 
            ELSE 0 
        END, 2
    ) as foil_percentage
FROM wishlists
GROUP BY user_id;

-- Grant access to the views
GRANT SELECT ON collection_stats TO authenticated;
GRANT SELECT ON wishlist_stats TO authenticated;

-- Add RLS policies for the views
CREATE POLICY "Users can view their own collection stats" ON collection_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wishlist stats" ON wishlist_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Update existing RLS policies to work with new columns
-- (The existing policies should still work, but we'll add comments for clarity)

-- Note: The existing RLS policies for collections and wishlists will continue to work
-- as they are based on user_id, which hasn't changed.

-- Add a function to help with collection management
CREATE OR REPLACE FUNCTION upsert_collection_entry(
    p_user_id UUID,
    p_card_id TEXT,
    p_normal_quantity INTEGER DEFAULT 0,
    p_foil_quantity INTEGER DEFAULT 0,
    p_card_data JSONB DEFAULT '{}'::jsonb
)
RETURNS collections AS $$
DECLARE
    result collections;
BEGIN
    INSERT INTO collections (user_id, card_id, normal_quantity, foil_quantity, card_data)
    VALUES (p_user_id, p_card_id, p_normal_quantity, p_foil_quantity, p_card_data)
    ON CONFLICT (user_id, card_id)
    DO UPDATE SET
        normal_quantity = collections.normal_quantity + EXCLUDED.normal_quantity,
        foil_quantity = collections.foil_quantity + EXCLUDED.foil_quantity,
        card_data = EXCLUDED.card_data
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to help with wishlist management
CREATE OR REPLACE FUNCTION upsert_wishlist_entry(
    p_user_id UUID,
    p_card_id TEXT,
    p_normal_quantity INTEGER DEFAULT 0,
    p_foil_quantity INTEGER DEFAULT 0,
    p_priority TEXT DEFAULT 'medium',
    p_card_data JSONB DEFAULT '{}'::jsonb
)
RETURNS wishlists AS $$
DECLARE
    result wishlists;
BEGIN
    INSERT INTO wishlists (user_id, card_id, normal_quantity, foil_quantity, priority, card_data)
    VALUES (p_user_id, p_card_id, p_normal_quantity, p_foil_quantity, p_priority, p_card_data)
    ON CONFLICT (user_id, card_id)
    DO UPDATE SET
        normal_quantity = wishlists.normal_quantity + EXCLUDED.normal_quantity,
        foil_quantity = wishlists.foil_quantity + EXCLUDED.foil_quantity,
        priority = EXCLUDED.priority,
        card_data = EXCLUDED.card_data
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION upsert_collection_entry TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_wishlist_entry TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN collections.normal_quantity IS 'Number of normal (non-foil) copies of this card';
COMMENT ON COLUMN collections.foil_quantity IS 'Number of foil copies of this card';
COMMENT ON COLUMN collections.finish IS 'Automatically calculated: normal, foil, or both based on quantities';

COMMENT ON COLUMN wishlists.normal_quantity IS 'Number of normal (non-foil) copies wanted';
COMMENT ON COLUMN wishlists.foil_quantity IS 'Number of foil copies wanted';
COMMENT ON COLUMN wishlists.finish IS 'Automatically calculated: normal, foil, or both based on quantities';

COMMENT ON VIEW collection_stats IS 'Aggregated statistics for user collections including foil breakdown';
COMMENT ON VIEW wishlist_stats IS 'Aggregated statistics for user wishlists including foil breakdown';

COMMENT ON FUNCTION upsert_collection_entry IS 'Add or update a collection entry with normal and foil quantities';
COMMENT ON FUNCTION upsert_wishlist_entry IS 'Add or update a wishlist entry with normal and foil quantities';
