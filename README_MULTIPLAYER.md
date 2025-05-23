# Multiplayer Setup for Neon Lunar Lander

This document explains how to set up the realtime multiplayer "ghost" system for the Neon Lunar Lander game using Supabase.

## Prerequisites

1. A Supabase project (you already have one set up)
2. Your Supabase URL and anon key (already configured in `js/supabase.js`)

## Database Setup

### Step 1: Run the Migration

Execute the SQL migration file `sql/001_player_positions.sql` in your Supabase dashboard:

1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `sql/001_player_positions.sql`
4. Click "Run" to execute the migration

This will create:
- `player_positions` table to store player locations
- Indexes for performance
- Row Level Security policies
- Realtime subscription setup
- Auto-cleanup functions for stale data

### Step 2: Enable Realtime

Make sure Realtime is enabled for the `player_positions` table:

1. Go to "Database" → "Replication" in your Supabase dashboard
2. Find the `player_positions` table
3. Toggle "Enable" if it's not already enabled

## How It Works

### Ghost Players System

- **Real-time Updates**: Player positions are broadcast every 100ms to all connected players
- **Unique Colors**: Each ghost player gets a unique color based on their player ID
- **Visual Effects**: Ghost players appear semi-transparent with glowing effects
- **Thrust Visualization**: When other players use thrusters, their ghosts show thrust effects
- **Fade Out**: Inactive players fade out over 5 seconds and are automatically removed
- **Player Names**: Each ghost shows a randomly generated name above it
- **Velocity Trails**: Fast-moving ghosts show motion trails

### Performance Features

- **Off-screen Culling**: Ghosts outside the viewport aren't rendered
- **Automatic Cleanup**: Database automatically removes position data older than 30 seconds
- **Efficient Updates**: Only sends updates when position/state actually changes
- **Optimized Queries**: Uses upsert operations to minimize database calls

## Multiplayer UI

The game now shows:
- **Ghost Count**: Number of other players currently visible (👻 Ghosts: X)
- **Player Names**: Each ghost displays its unique name
- **Connection Status**: Visual feedback when multiplayer is active

## Technical Details

### Database Schema

```sql
player_positions (
    id: UUID (primary key)
    player_id: TEXT (unique identifier)
    player_name: TEXT (display name)
    x, y: REAL (position coordinates)
    angle: REAL (lander rotation)
    vx, vy: REAL (velocity components)
    fuel: REAL (fuel percentage)
    thrusters_active: BOOLEAN (thrust state)
    crashed: BOOLEAN (crash state)
    landed: BOOLEAN (landing state)
    last_updated: TIMESTAMP (auto-updated)
    game_session_id: TEXT (session grouping)
)
```

### Security

- **Row Level Security**: Enabled on all tables
- **Public Read**: Anyone can see all player positions (for ghost display)
- **Authenticated Write**: Players can update their own positions
- **Auto-cleanup**: Prevents database bloat from abandoned sessions

## Customization

### Update Frequency
Change the update interval in `js/supabase.js`:
```javascript
updateInterval: 100, // milliseconds (currently 100ms = 10 FPS)
```

### Ghost Appearance
Modify ghost rendering in `js/renderer.js` `drawGhostPlayers()` function:
- Colors, transparency, glow effects
- Player name display
- Velocity trail visualization

### Fade Out Time
Adjust how long inactive players remain visible:
```javascript
const fadeOutTime = 5000; // milliseconds (currently 5 seconds)
```

## Troubleshooting

### No Ghosts Appearing
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Ensure Realtime is enabled for `player_positions` table
4. Check that the migration ran successfully

### Performance Issues
1. Reduce update frequency in `updateInterval`
2. Increase fade out time to reduce database queries
3. Check Supabase dashboard for query performance

### Connection Problems
1. Verify Supabase URL and key in `js/supabase.js`
2. Check CORS settings in Supabase dashboard
3. Ensure browser supports WebSockets for Realtime

## Future Enhancements

Possible improvements:
- **Game Rooms**: Separate players into different sessions/rooms
- **Player Stats**: Track and share crash counts, best times, etc.
- **Chat System**: Add simple text chat between players
- **Spectator Mode**: Allow watching without playing
- **Leaderboards**: Real-time scoring and competition

The system is designed to be easily extensible for these features! 