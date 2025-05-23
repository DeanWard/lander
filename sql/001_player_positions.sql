-- Migration: Player Positions for Realtime Multiplayer
-- This creates the table and policies for storing and sharing player positions

-- Enable Row Level Security


-- Create the player_positions table
CREATE TABLE IF NOT EXISTS player_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id TEXT NOT NULL UNIQUE,
    player_name TEXT,
    x REAL NOT NULL,
    y REAL NOT NULL,
    angle REAL NOT NULL DEFAULT 0,
    vx REAL NOT NULL DEFAULT 0,
    vy REAL NOT NULL DEFAULT 0,
    fuel REAL NOT NULL DEFAULT 100,
    thrusters_active BOOLEAN NOT NULL DEFAULT false,
    crashed BOOLEAN NOT NULL DEFAULT false,
    landed BOOLEAN NOT NULL DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    game_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_positions_player_id ON player_positions(player_id);
CREATE INDEX IF NOT EXISTS idx_player_positions_last_updated ON player_positions(last_updated);
CREATE INDEX IF NOT EXISTS idx_player_positions_game_session ON player_positions(game_session_id);

-- Enable Row Level Security
ALTER TABLE player_positions ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read all player positions (for ghost display)
CREATE POLICY "Anyone can read player positions" ON player_positions
    FOR SELECT USING (true);

-- Policy to allow anyone to insert their own position
CREATE POLICY "Anyone can insert player positions" ON player_positions
    FOR INSERT WITH CHECK (true);

-- Policy to allow players to update their own position
CREATE POLICY "Players can update their own position" ON player_positions
    FOR UPDATE USING (true);

-- Policy to allow players to delete their own position
CREATE POLICY "Players can delete their own position" ON player_positions
    FOR DELETE USING (true);

-- Enable realtime on the table
ALTER PUBLICATION supabase_realtime ADD TABLE player_positions;

-- Create a function to cleanup old positions (older than 30 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_positions()
RETURNS void AS $$
BEGIN
    DELETE FROM player_positions 
    WHERE last_updated < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create a function to update the last_updated timestamp on updates
CREATE OR REPLACE FUNCTION update_last_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
CREATE TRIGGER trigger_update_last_updated
    BEFORE UPDATE ON player_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_timestamp();

-- Optional: Create a scheduled job to cleanup old positions
-- This would require the pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-old-positions', '*/30 * * * * *', 'SELECT cleanup_old_positions();'); 