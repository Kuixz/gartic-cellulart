/** @type {import('jest').Config} */
const config = {
    // workerIdleMemoryLimit: 0.2,
    transform: {
        // 'src.*js$' : '<rootDir>/test/setup/antiquated-transformer.js'
    },
    setupFiles: ['<rootDir>/test/setup/mock-extension-apis.js'],
    // transform: { }
};
  
module.exports = config;