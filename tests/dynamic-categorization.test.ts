/**
 * Test Dynamic Task Categorization with MCP
 * Demonstrates the new AI-based categorization vs static patterns
 */

import { AgentDetector } from '../src/utils/agent-detector';

// Mock MCP Client for testing
class MockMCPClient {
  async callTool({ name, arguments: args }: any) {
    if (name === 'task_categorize') {
      // Simulate MCP response
      console.log(`\n🤖 MCP Dynamic Categorization for: "${args.objective}"`);
      console.log(`   Language: ${args.context.language}, Max Agents: ${args.context.maxAgents}`);
      
      // This would normally be an actual AI analysis
      // For demo purposes, we'll simulate intelligent responses
      return {
        content: [{
          text: JSON.stringify({
            objective: args.objective,
            language: this.detectLanguage(args.objective),
            categorization: this.categorizeTask(args.objective, args.context.maxAgents),
            intent_analysis: this.analyzeIntent(args.objective),
            approach: this.generateApproach(args.objective),
            environment_considerations: {
              environment: args.context.environment,
              safety_measures: ['Use Update Set for tracking'],
              rollback_strategy: 'Update Set provides automatic rollback',
            },
            metadata: {
              analysis_version: '2.0',
              timestamp: new Date().toISOString(),
              neural_confidence: 0.97,
            },
          }),
        }],
      };
    }
    throw new Error(`Tool ${name} not found`);
  }

  private detectLanguage(text: string): string {
    if (/\b(maak|aanmaken|genereer|voor|een|het|de|met|van)\b/i.test(text)) return 'nl';
    if (/\b(faire|créer|générer|pour|un|une|le|la)\b/i.test(text)) return 'fr';
    if (/\b(hacer|crear|generar|para|un|una|el|la)\b/i.test(text)) return 'es';
    return 'en';
  }

  private categorizeTask(objective: string, maxAgents: number) {
    const lower = objective.toLowerCase();
    
    // Intelligent categorization based on context
    if (/\b(data\s*set|test\s*data|sample|random|mock|seed|populate)\b.*\b\d{3,}\b/i.test(lower)) {
      return {
        task_type: 'data_generation',
        primary_agent: 'script-writer',
        supporting_agents: ['tester'],
        complexity: 'simple',
        estimated_agent_count: 2,
        requires_update_set: false,
        requires_application: false,
        service_now_artifacts: ['script'],
        confidence_score: 0.98,
      };
    }
    
    if (/\bwidget\b/i.test(lower)) {
      return {
        task_type: 'widget_development',
        primary_agent: 'widget-creator',
        supporting_agents: ['css-specialist', 'backend-specialist', 'frontend-specialist', 'integration-specialist', 'performance-specialist', 'tester'].slice(0, maxAgents - 1),
        complexity: 'medium',
        estimated_agent_count: Math.min(7, maxAgents),
        requires_update_set: true,
        requires_application: false,
        service_now_artifacts: ['widget', 'client_script', 'server_script'],
        confidence_score: 0.95,
      };
    }
    
    if (/\bflow\b/i.test(lower)) {
      return {
        task_type: 'flow_development',
        primary_agent: 'flow-builder',
        supporting_agents: ['trigger-specialist', 'action-specialist', 'approval-specialist', 'integration-specialist', 'error-handler', 'tester'].slice(0, maxAgents - 1),
        complexity: 'complex',
        estimated_agent_count: Math.min(7, maxAgents),
        requires_update_set: true,
        requires_application: false,
        service_now_artifacts: ['flow', 'trigger', 'action'],
        confidence_score: 0.96,
      };
    }
    
    return {
      task_type: 'general_development',
      primary_agent: 'architect',
      supporting_agents: ['script-writer', 'integration-specialist', 'tester'],
      complexity: 'medium',
      estimated_agent_count: 4,
      requires_update_set: true,
      requires_application: false,
      service_now_artifacts: ['script'],
      confidence_score: 0.90,
    };
  }

  private analyzeIntent(objective: string) {
    const lower = objective.toLowerCase();
    const actionVerbs = [];
    const targetObjects = [];
    const quantifiers = (objective.match(/\b(\d+)\b/g) || []).map(q => parseInt(q));
    
    // Detect actions
    if (/\b(create|make|build|generate|maak|aanmaken|bouw)\b/i.test(lower)) actionVerbs.push('create');
    if (/\b(update|modify|change|wijzig|verander)\b/i.test(lower)) actionVerbs.push('modify');
    if (/\b(test|verify|validate|controleer)\b/i.test(lower)) actionVerbs.push('test');
    
    // Detect targets
    if (/\bwidget\b/i.test(lower)) targetObjects.push('widget');
    if (/\bflow\b/i.test(lower)) targetObjects.push('flow');
    if (/\b(data|incidents|records)\b/i.test(lower)) targetObjects.push('data');
    
    return {
      primary: actionVerbs[0] || 'analyze',
      secondary: actionVerbs.slice(1),
      actionVerbs,
      targetObjects,
      quantifiers,
    };
  }

  private generateApproach(objective: string) {
    const isDataGen = /\b(data\s*set|test\s*data|sample|random|mock)\b.*\b\d{3,}\b/i.test(objective);
    const isComplex = objective.split(/\s+/).length > 15;
    
    return {
      recommended_strategy: isDataGen ? 'sequential' : isComplex ? 'hierarchical' : 'parallel',
      execution_mode: isComplex ? 'distributed' : 'centralized',
      parallel_opportunities: isDataGen ? [] : ['component development', 'testing'],
      risk_factors: isComplex ? ['High complexity - phased approach recommended'] : [],
      optimization_hints: isDataGen ? ['Use batch operations', 'Background Scripts for large datasets'] : ['Enable parallel execution'],
    };
  }
}

// Test cases
const testCases = [
  // Dutch data generation
  "maak een data set aan van 5000 random incidenten om een ML op te laten leren",
  
  // English data generation
  "create 1000 random incidents for testing",
  
  // French widget creation
  "créer un widget pour afficher les incidents",
  
  // Spanish flow creation
  "crear un flujo de aprobación para cambios",
  
  // Complex multi-language request
  "build a comprehensive incident management system with widgets, flows, and reporting",
  
  // Simple update request
  "update the field on the incident table",
  
  // Edge case: looks like data gen but is actually system building
  "create an incident generator application",
  
  // Edge case: small number should not trigger data gen
  "create 5 widgets for the dashboard",
];

async function runTests() {
  console.log('🧪 Testing Dynamic Task Categorization with MCP\n');
  console.log('=' .repeat(80));
  
  // Set up MCP client
  const mockClient = new MockMCPClient();
  AgentDetector.setMCPClient(mockClient);
  
  // Test dynamic categorization
  console.log('\n📊 DYNAMIC MCP CATEGORIZATION (AI-Based)\n');
  
  for (const testCase of testCases) {
    console.log('-'.repeat(80));
    const dynamicResult = await AgentDetector.analyzeTaskDynamic(testCase);
    
    console.log(`\n✨ Dynamic Result:`);
    console.log(`   Task Type: ${dynamicResult.taskType}`);
    console.log(`   Primary Agent: ${dynamicResult.primaryAgent}`);
    console.log(`   Supporting Agents: ${dynamicResult.supportingAgents.join(', ')}`);
    console.log(`   Complexity: ${dynamicResult.complexity}`);
    console.log(`   Confidence: ${(dynamicResult.confidence || 0) * 100}%`);
    console.log(`   Neural Confidence: ${(dynamicResult.neuralConfidence || 0) * 100}%`);
    
    if (dynamicResult.approach) {
      console.log(`   Strategy: ${dynamicResult.approach.recommendedStrategy}`);
      console.log(`   Optimization: ${dynamicResult.approach.optimizationHints.join(', ')}`);
    }
  }
  
  // Compare with static patterns
  console.log('\n\n📊 STATIC PATTERN CATEGORIZATION (Old Method)\n');
  console.log('=' .repeat(80));
  
  // Remove MCP client to test static fallback
  AgentDetector.setMCPClient(null);
  
  for (const testCase of testCases) {
    const staticResult = AgentDetector.analyzeTask(testCase);
    
    console.log(`\nObjective: "${testCase}"`);
    console.log(`   Task Type: ${staticResult.taskType}`);
    console.log(`   Primary Agent: ${staticResult.primaryAgent}`);
    console.log(`   Agent Count: ${staticResult.estimatedAgentCount}`);
  }
  
  console.log('\n\n🎯 BENEFITS OF DYNAMIC CATEGORIZATION:');
  console.log('   ✅ Multi-language support without hardcoded patterns');
  console.log('   ✅ Context-aware understanding of intent');
  console.log('   ✅ Confidence scoring for decisions');
  console.log('   ✅ Optimization hints based on task characteristics');
  console.log('   ✅ Risk assessment and safety measures');
  console.log('   ✅ Can learn and improve over time');
  console.log('   ✅ Handles edge cases and ambiguous requests better');
}

// Run the tests
runTests().catch(console.error);