// Jest test setup file
// This file is executed before each test file

import 'dotenv/config';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SNOW_FLOW_ENV = 'development';
process.env.SNOW_FLOW_LOG_LEVEL = 'error';

// Mock external dependencies that are not needed for unit tests
jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => ({
    prepare: jest.fn(() => ({
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    })),
    close: jest.fn(),
    exec: jest.fn()
  }));
});

// Mock Neo4j driver
jest.mock('neo4j-driver', () => ({
  driver: jest.fn(() => ({
    session: jest.fn(() => ({
      run: jest.fn(),
      close: jest.fn()
    })),
    close: jest.fn()
  })),
  auth: {
    basic: jest.fn()
  }
}));

// Increase timeout for integration tests
jest.setTimeout(30000);

// Suppress console output during tests unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};