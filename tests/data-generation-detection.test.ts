import { AgentDetector } from '../src/utils/agent-detector';

// Test data generation detection
const testCases = [
  // Data generation cases - should be detected as 'data_generation'
  {
    objective: "maak een data set aan van 5000 random incidenten om een ML op te laten leren",
    expected: 'data_generation'
  },
  {
    objective: "create 1000 random incidents for testing",
    expected: 'data_generation'
  },
  {
    objective: "generate 500 test changes with various risk levels",
    expected: 'data_generation'
  },
  {
    objective: "populate the incident table with sample data",
    expected: 'data_generation'
  },
  {
    objective: "seed database with 2000 mock incidents",
    expected: 'data_generation'
  },
  
  // System building cases - should NOT be data_generation
  {
    objective: "build a widget to display incidents",
    expected: 'widget_development'
  },
  {
    objective: "create an incident management system",
    expected: 'general_development'
  },
  {
    objective: "develop a flow for incident approval",
    expected: 'flow_development'
  }
];

console.log('Testing Data Generation Detection\n' + '='.repeat(50));

testCases.forEach(testCase => {
  const analysis = AgentDetector.analyzeTask(testCase.objective);
  const passed = analysis.taskType === testCase.expected;
  
  console.log(`\nObjective: "${testCase.objective}"`);
  console.log(`Expected: ${testCase.expected}`);
  console.log(`Detected: ${analysis.taskType}`);
  console.log(`Primary Agent: ${analysis.primaryAgent}`);
  console.log(`Supporting Agents: ${analysis.supportingAgents.join(', ')}`);
  console.log(`Agent Count: ${analysis.estimatedAgentCount}`);
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
});

// Summary
const passed = testCases.filter(tc => {
  const analysis = AgentDetector.analyzeTask(tc.objective);
  return analysis.taskType === tc.expected;
}).length;

console.log('\n' + '='.repeat(50));
console.log(`Summary: ${passed}/${testCases.length} tests passed`);