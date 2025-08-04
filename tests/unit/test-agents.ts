/**
 * Test ServiceNow Agents
 * Quick test to verify agent implementations
 */

import { WidgetCreatorAgent } from './widget-creator-agent';
import { FlowBuilderAgent } from './flow-builder-agent';
import { ScriptWriterAgent } from './script-writer-agent';
import { TestAgent } from './test-agent';
import { SecurityAgent } from './security-agent';

async function testAgents() {
  console.log('🧪 Testing ServiceNow Specialist Agents\n');

  // Test Widget Creator Agent
  console.log('1️⃣ Testing Widget Creator Agent...');
  const widgetAgent = new WidgetCreatorAgent({ debugMode: true });
  const widgetResult = await widgetAgent.execute(
    'Create an incident dashboard widget with charts showing incidents by priority and state'
  );
  console.log(`   Result: ${widgetResult.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Message: ${widgetResult.message}\n`);

  // Test Flow Builder Agent
  console.log('2️⃣ Testing Flow Builder Agent...');
  const flowAgent = new FlowBuilderAgent({ debugMode: true });
  const flowResult = await flowAgent.execute(
    'Create an approval flow for new incident requests with manager approval'
  );
  console.log(`   Result: ${flowResult.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Message: ${flowResult.message}\n`);

  // Test Script Writer Agent
  console.log('3️⃣ Testing Script Writer Agent...');
  const scriptAgent = new ScriptWriterAgent({ debugMode: true });
  const scriptResult = await scriptAgent.execute(
    'Create a business rule to validate incident priority based on impact and urgency'
  );
  console.log(`   Result: ${scriptResult.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Message: ${scriptResult.message}\n`);

  // Test Test Agent
  console.log('4️⃣ Testing Test Agent...');
  const testAgent = new TestAgent({ debugMode: true });
  // First store a mock widget artifact for testing
  const mockWidget = {
    type: 'widget' as const,
    name: 'test_widget',
    config: { name: 'test_widget', template: '<div>Test</div>' },
    dependencies: []
  };
  await testAgent['storeArtifact'](mockWidget);
  
  const testResult = await testAgent.execute(
    'Test the test_widget widget with comprehensive test scenarios'
  );
  console.log(`   Result: ${testResult.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Message: ${testResult.message}\n`);

  // Test Security Agent
  console.log('5️⃣ Testing Security Agent...');
  const securityAgent = new SecurityAgent({ debugMode: true });
  const securityResult = await securityAgent.execute(
    'Perform security scan on recent artifacts checking for vulnerabilities'
  );
  console.log(`   Result: ${securityResult.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Message: ${securityResult.message}\n`);

  console.log('✨ Agent testing completed!');
  
  // Clean up
  await widgetAgent.cleanup();
  await flowAgent.cleanup();
  await scriptAgent.cleanup();
  await testAgent.cleanup();
  await securityAgent.cleanup();
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAgents().catch(console.error);
}

export { testAgents };