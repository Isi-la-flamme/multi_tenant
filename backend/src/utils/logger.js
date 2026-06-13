const logger = {
    info: (message, ...args) => {
        console.log(`[${new Date().toISOString()}] ℹ️  ${message}`, ...args);
    },
    success: (message, ...args) => {
        console.log(`[${new Date().toISOString()}] ✅ ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[${new Date().toISOString()}] ⚠️  ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[${new Date().toISOString()}] ❌ ${message}`, ...args);
    },
    debug: (message, ...args) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${new Date().toISOString()}] 🔍 ${message}`, ...args);
        }
    },
    tenant: (tenantId, message, ...args) => {
        console.log(`[${new Date().toISOString()}] 🏢 [${tenantId}] ${message}`, ...args);
    }
};

module.exports = logger;