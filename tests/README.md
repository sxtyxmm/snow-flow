# Tests Directory

This directory contains all test files for the Snow-Flow project.

## Directory Structure

- `integration/` - Integration tests that test component interactions
- `unit/` - Unit tests for individual components (to be added)

## Running Tests

Integration tests can be run using:

```bash
# Run specific integration tests
npm run test:integration

# Run all tests
npm test
```

## Test Types

- **Integration Tests**: Test real interactions between components, MCP tools, and ServiceNow
- **Unit Tests**: Test individual functions and classes in isolation
- **End-to-End Tests**: Full workflow tests (future enhancement)

## Note

All test files are excluded from production builds.