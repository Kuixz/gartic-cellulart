/** @type {import('jest').Config} */
const config = {
    // workerIdleMemoryLimit: 0.2,
    transform: {
        // 'src.*js$' : '<rootDir>/test/setup/antiquated-transformer.js'
    },
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/test/setup/mock-extension-apis.js'],
    // setupFilesAfterEnv: ['<rootDir>/test/setup/polyfills.js']
    // transform: { }
};
  
module.exports = config;