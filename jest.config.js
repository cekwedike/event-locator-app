module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.js',
    '<rootDir>/src/tests/jest.setup.js',
    '<rootDir>/src/tests/setupAfterEnv.js'
  ],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js', '**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  coveragePathIgnorePatterns: ['/node_modules/'],
  globals: {
    NODE_ENV: 'test'
  }
}; 