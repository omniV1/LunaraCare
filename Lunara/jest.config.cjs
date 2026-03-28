module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/tests/__mocks__/styleMock.js'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }]
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', 'dashboardIntegration.test.tsx', 'dualWorkflows.test.tsx'],
  collectCoverage: false, // Only collect when --coverage flag is used
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/tests/**',
    '!src/vite-env.d.ts',
    '!src/main.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '\\.test\\.',
    '\\.spec\\.',
  ],
}; 