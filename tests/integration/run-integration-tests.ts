#!/usr/bin/env node
/**
 * Queen Agent Integration Test Runner
 * 
 * Simplified runner for Queen Agent integration tests
 * Can be called from npm scripts or directly
 */

import { QueenIntegrationTester } from '../../src/queen/integration-test.js';

async function runTests() {
  console.log('🐝 QUEEN AGENT INTEGRATION TESTER');
  console.log('=================================');
  console.log('Testing Queen Agent with MCP tools...\n');

  const tester = new QueenIntegrationTester();
  
  try {
    await tester.runAllTests();
    console.log('\n🎉 Integration tests completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Integration tests failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);