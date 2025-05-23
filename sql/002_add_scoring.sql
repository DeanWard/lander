-- Migration: Add Scoring System
-- This adds score tracking and leaderboard functionality

-- Add score column to existing player_positions table
ALTER TABLE player_positions ADD COLUMN IF NOT EXISTS pads_visited INTEGER NOT NULL DEFAULT 0;

-- Create leaderboard view for easy querying
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    player_id,
    player_name,
    MAX(pads_visited) as best_score,
    MAX(last_updated) as last_seen,
    game_session_id
FROM player_positions 
WHERE last_updated > NOW() - INTERVAL '24 hours'
GROUP BY player_id, player_name, game_session_id
ORDER BY best_score DESC, last_seen DESC;

-- Create all-time leaderboard table for persistent high scores
CREATE TABLE IF NOT EXISTS high_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    game_session_id TEXT
);

-- Create index for better leaderboard performance
CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_player ON high_scores(player_id);

-- Enable RLS on high_scores table
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read high scores
CREATE POLICY "Anyone can read high scores" ON high_scores
    FOR SELECT USING (true);

-- Policy to allow anyone to insert high scores
CREATE POLICY "Anyone can insert high scores" ON high_scores
    FOR INSERT WITH CHECK (true);

-- Function to update high score when a new record is achieved
CREATE OR REPLACE FUNCTION update_high_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new high score for this player
    IF NOT EXISTS (
        SELECT 1 FROM high_scores 
        WHERE player_id = NEW.player_id 
        AND score >= NEW.pads_visited
    ) THEN
        -- Insert new high score
        INSERT INTO high_scores (player_id, player_name, score, game_session_id)
        VALUES (NEW.player_id, NEW.player_name, NEW.pads_visited, NEW.game_session_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update high scores
CREATE TRIGGER trigger_update_high_score
    AFTER INSERT OR UPDATE ON player_positions
    FOR EACH ROW
    WHEN (NEW.pads_visited > 0)
    EXECUTE FUNCTION update_high_score();

-- Enable realtime on high_scores table
ALTER PUBLICATION supabase_realtime ADD TABLE high_scores; 