const { createClient } = require('redis');

let redisClient = null;

async function getRedisClient() {
    if (!redisClient) {
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://redis:6379'
        });
        
        redisClient.on('error', (err) => {
            console.warn('⚠️ Redis connection error:', err.message);
        });
        
        redisClient.on('connect', () => {
            console.log('✅ Redis connecté');
        });
        
        await redisClient.connect();
    }
    return redisClient;
}

async function cacheGet(key) {
    try {
        const client = await getRedisClient();
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
        await client.setEx(key, ttl, JSON.stringify(value));
    } catch (err) {
        console.warn('⚠️ Redis cacheSet error:', err.message);
    }
}

async function cacheDelete(key) {
    try {
        const client = await getRedisClient();
        await client.del(key);
    } catch (err) {
        console.warn('⚠️ Redis cacheDelete error:', err.message);
    }
}

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDelete };