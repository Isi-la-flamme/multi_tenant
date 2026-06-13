module.exports = {
    testEnvironment: 'node',
    setupFiles: ['./tests/setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
    testTimeout: 30000,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/database/**',
        '!src/wait-for-services.js'
    ]
};