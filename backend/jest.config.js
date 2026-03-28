/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testMatch: ['**/?(*.)+(test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/integration/'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  moduleNameMapper: {
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },
  collectCoverage: false, // Only collect when --coverage flag is used
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.spec.{ts,js}',
    '!src/server.ts', // Entry point
    '!src/services/authService.ts', // Auth: passport integration
    '!src/services/gridfsService.ts', // File storage integration
    '!src/routes/**/*',
    '!src/models/**/*',
    '!src/config/**/*',
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