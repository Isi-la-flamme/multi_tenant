const { createClient } = require('redis');

let redisClient = null;
let redisEnabled = true;
let connectionPromise = null;

function getRedisClient() {
    // Désactiver Redis en mode test ou si variable d'environnement spécifique
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_REDIS === 'true') {
        redisEnabled = false;
        return Promise.resolve(null);
    }
    
    if (redisClient) {
        return Promise.resolve(redisClient);
    }
    
    if (connectionPromise) {
        return connectionPromise;
    }
    
    connectionPromise = (async () => {
        try {
            redisClient = createClient({
                url: process.env.REDIS_URL || 'redis://redis:6379',
                socket: {
                    connectTimeout: 3000,
                    reconnectStrategy: (retries) => {
                        if (retries > 3) {
                            console.warn('⚠️ Redis reconnection failed after 3 attempts, disabling Redis');
                            redisEnabled = false;
                            return false;
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });
            
            redisClient.on('error', (err) => {
                if (redisEnabled) {
                    console.warn('⚠️ Redis connection error:', err.message);
                    redisEnabled = false;
                    redisClient = null;
                }
            });
            
            redisClient.on('connect', () => {
                console.log('✅ Redis connecté');
                redisEnabled = true;
            });
            
            await redisClient.connect();
            return redisClient;
        } catch (err) {
            console.warn('⚠️ Redis not available, continuing without cache');
            redisEnabled = false;
            redisClient = null;
            return null;
        } finally {
            connectionPromise = null;
        }
    })();
    
    return connectionPromise;
}

async function cacheGet(key) {
    try {
        const client = await getRedisClient();
        if (!client) return null;
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.warn('⚠️ Redis cacheGet error:', err.message);
        return null;
    }
}

async function cacheSet(key, value, ttl = 3600) {
    try {
        const client = await getRedisClient();
        if (!client) return;
        await client.setEx(key, ttl, JSON.stringify(value));
    } catch (err) {
        console.warn('⚠️ Redis cacheSet error:', err.message);
    }
}

async function cacheDelete(key) {
    try {
        const client = await getRedisClient();
        if (!client) return;
        await client.del(key);
    } catch (err) {
        console.warn('⚠️ Redis cacheDelete error:', err.message);
    }
}

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDelete };