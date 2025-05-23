const supabase_url = "https://txlcbandjqfdkyantcid.supabase.co"
const supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bGNiYW5kanFmZGt5YW50Y2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMjY4MjIsImV4cCI6MjA2MzYwMjgyMn0.atonpqQS699ly5Yz9ZeQKySXKHPtpzupM20Js7p8Vqc"

// Initialize Supabase client (will be loaded from CDN)
let supabase = null;

// Multiplayer state
const multiplayer = {
    playerId: null,
    playerName: null,
    gameSessionId: null,
    otherPlayers: new Map(),
    subscription: null,
    lastUpdateTime: 0,
    updateInterval: 100, // Update every 100ms
    initialized: false
};

// Initialize multiplayer system
async function initMultiplayer() {
    if (multiplayer.initialized) return;
    
    try {
        // Generate unique player ID and name
        multiplayer.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        multiplayer.playerName = 'Ghost ' + Math.floor(Math.random() * 1000);
        multiplayer.gameSessionId = 'session_' + Date.now();
        
        multiplayer.initialized = true;
        
        // Subscribe to realtime updates
        subscribeToPlayerPositions();
        
        // Load existing players after our ID is set
        loadExistingPlayers();
        
    } catch (error) {
        console.error('Error initializing multiplayer:', error);
    }
}

// Load existing players as ghosts
async function loadExistingPlayers() {
    if (!supabase || !multiplayer.playerId) return;
    
    try {
        // Get recent player positions (last 30 seconds)
        const { data, error } = await supabase
            .from('player_positions')
            .select('*')
            .gte('last_updated', new Date(Date.now() - 30000).toISOString())
            .neq('player_id', multiplayer.playerId);
            
        if (error) {
            console.error('Error loading existing players:', error);
            return;
        }
        
        // Load existing players as ghosts
        data.forEach(record => {
            multiplayer.otherPlayers.set(record.player_id, {
                id: record.player_id,
                name: record.player_name,
                x: record.x,
                y: record.y,
                angle: record.angle,
                vx: record.vx,
                vy: record.vy,
                fuel: record.fuel,
                thrustersActive: record.thrusters_active,
                crashed: record.crashed,
                landed: record.landed,
                lastUpdated: new Date(record.last_updated)
            });
        });
        
    } catch (error) {
        console.error('Error loading existing players:', error);
    }
}

// Subscribe to realtime player position updates
function subscribeToPlayerPositions() {
    if (!supabase || multiplayer.subscription) return;
    
    multiplayer.subscription = supabase
        .channel('player_positions_channel')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'player_positions'
        }, (payload) => {
            handlePlayerPositionUpdate(payload);
        })
        .subscribe();
}

// Handle incoming player position updates
function handlePlayerPositionUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Ignore our own updates
    if (newRecord && newRecord.player_id === multiplayer.playerId) return;
    if (oldRecord && oldRecord.player_id === multiplayer.playerId) return;
    
    switch (eventType) {
        case 'INSERT':
        case 'UPDATE':
            if (newRecord) {
                multiplayer.otherPlayers.set(newRecord.player_id, {
                    id: newRecord.player_id,
                    name: newRecord.player_name,
                    x: newRecord.x,
                    y: newRecord.y,
                    angle: newRecord.angle,
                    vx: newRecord.vx,
                    vy: newRecord.vy,
                    fuel: newRecord.fuel,
                    thrustersActive: newRecord.thrusters_active,
                    crashed: newRecord.crashed,
                    landed: newRecord.landed,
                    lastUpdated: new Date(newRecord.last_updated)
                });
            }
            break;
        case 'DELETE':
            if (oldRecord) {
                multiplayer.otherPlayers.delete(oldRecord.player_id);
            }
            break;
    }
}

// Send current player position to other players
async function sendPlayerPosition() {
    if (!supabase || !multiplayer.initialized) return;
    if (!gameStarted) return;
    
    const now = Date.now();
    if (now - multiplayer.lastUpdateTime < multiplayer.updateInterval) return;
    
    try {
        const playerData = {
            player_id: multiplayer.playerId,
            player_name: multiplayer.playerName,
            x: gameState.lander.x,
            y: gameState.lander.y,
            angle: gameState.lander.angle,
            vx: gameState.lander.vx,
            vy: gameState.lander.vy,
            fuel: gameState.lander.fuel,
            thrusters_active: gameState.thrustersActive,
            crashed: gameState.crashed,
            landed: gameState.lander.landed,
            game_session_id: multiplayer.gameSessionId
        };
        
        // Try upsert first, if it fails due to constraint issues, try insert or update separately
        let { error } = await supabase
            .from('player_positions')
            .upsert(playerData, {
                onConflict: 'player_id',
                ignoreDuplicates: false
            });
            
        // If upsert fails due to constraint issues, try insert/update approach
        if (error && error.code === '42P10') {
            // Try to update first
            const { error: updateError } = await supabase
                .from('player_positions')
                .update(playerData)
                .eq('player_id', multiplayer.playerId);
                
            // If update didn't affect any rows (player doesn't exist), insert
            if (updateError || updateError?.code === 'PGRST116') {
                const { error: insertError } = await supabase
                    .from('player_positions')
                    .insert(playerData);
                    
                if (insertError) {
                    console.error('Error inserting player position:', insertError);
                    return;
                }
            }
            error = null; // Clear the error if we succeeded with insert/update
        }
            
        if (error) {
            console.error('Error sending player position:', error);
        }
        
        multiplayer.lastUpdateTime = now;
    } catch (error) {
        console.error('Error in sendPlayerPosition:', error);
    }
}

// Clean up player data when leaving
async function cleanupPlayerData() {
    if (!supabase || !multiplayer.playerId) return;
    
    try {
        await supabase
            .from('player_positions')
            .delete()
            .eq('player_id', multiplayer.playerId);
            
        if (multiplayer.subscription) {
            supabase.removeChannel(multiplayer.subscription);
            multiplayer.subscription = null;
        }
    } catch (error) {
        console.error('Error cleaning up player data:', error);
    }
}

// Initialize when page loads (after Supabase client is available)
function initSupabaseClient() {
    // Try multiple ways to access the Supabase client from CDN
    let createClient = null;
    
    if (typeof window !== 'undefined') {
        // Method 1: window.supabase.createClient (newer CDN versions)
        if (window.supabase && window.supabase.createClient) {
            createClient = window.supabase.createClient;
        }
        // Method 2: global createClient (older CDN versions)
        else if (typeof window.createClient === 'function') {
            createClient = window.createClient;
        }
        // Method 3: check global supabase object
        else if (typeof window.supabase === 'object') {
            // Look for createClient in the supabase object
            if (window.supabase.createClient) {
                createClient = window.supabase.createClient;
            }
        }
    }
    
    if (createClient) {
        try {
            supabase = createClient(supabase_url, supabase_key);
            
            // Test the connection
            testSupabaseConnection();
            
        } catch (error) {
            console.error('Error creating Supabase client:', error);
            setTimeout(initSupabaseClient, 500);
            return;
        }
    } else {
        // Retry in 200ms if Supabase client isn't loaded yet
        setTimeout(initSupabaseClient, 200);
        return;
    }
}

// Test Supabase connection
async function testSupabaseConnection() {
    if (!supabase) return;
    
    try {
        // Try a simple query to test the connection - just get any records (limit 1)
        const { data, error } = await supabase
            .from('player_positions')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('Supabase connection test failed:', error);
            if (error.message.includes('relation "player_positions" does not exist')) {
                console.error('The player_positions table doesn\'t exist. Please run the SQL migration first!');
            }
        } else {
            // Connection works, now initialize multiplayer
            initMultiplayer();
        }
    } catch (error) {
        console.error('Error testing Supabase connection:', error);
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', cleanupPlayerData);

// Start initialization
initSupabaseClient();
