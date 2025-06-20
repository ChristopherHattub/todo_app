module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Enhanced reporting configuration
  verbose: true,
  collectCoverage: false,
  
  // Use custom failure reporter along with default
  reporters: [
    'default',
    '<rootDir>/jest-failure-reporter.js'
  ],
  
  // Better error reporting
  errorOnDeprecated: true,
  
  // Bail configuration - continue running all tests even if some fail
  bail: false,
  
  // Timeout configuration
  testTimeout: 10000,
  
  // Show detailed test results
  testNamePattern: undefined,
  
  // Additional output formatting
  notify: false,
  notifyMode: 'failure-change',
}; 