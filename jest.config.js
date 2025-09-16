/**
 * Jest Configuration for Email Workflow Testing
 * 
 * Configures Jest to run comprehensive email workflow tests with proper
 * TypeScript support, module resolution, and test environment setup.
 */

const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // TypeScript support
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          noEmit: true,
          esModuleInterop: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [
            {
              name: 'next'
            }
          ],
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*']
          }
        }
      }
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Module name mapping for path aliases
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/'
    }),
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],

  // Module path ignore patterns
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup/jest.setup.ts'
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/app/**/page.tsx',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/template.tsx'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    },
    // Email workflow components should have higher coverage
    'src/services/participant-email-service.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/lib/resend.ts': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/lib/meeting-response-tokens.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Test timeout
  testTimeout: 30000, // 30 seconds for integration tests

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },

  // Extensions to resolve
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@supabase|@vercel|resend))'
  ],

  // Test suites configuration
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: [
        '<rootDir>/src/__tests__/email-workflow.test.ts',
        '<rootDir>/src/__tests__/meeting-response-system.test.ts',
        '<rootDir>/src/__tests__/resend-api-integration.test.ts'
      ],
      testTimeout: 10000
    },
    {
      displayName: 'Integration Tests',
      testMatch: [
        '<rootDir>/src/__tests__/api-email-integration.test.ts',
        '<rootDir>/src/__tests__/database-email-tracking.test.ts'
      ],
      testTimeout: 20000
    },
    {
      displayName: 'End-to-End Tests',
      testMatch: [
        '<rootDir>/src/__tests__/e2e-email-workflow.test.ts'
      ],
      testTimeout: 60000
    }
  ],

  // Max workers for parallel test execution
  maxWorkers: '50%',

  // Error handling
  errorOnDeprecated: true,

  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/'
  ],

  // Snapshot configuration
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true
  }
};