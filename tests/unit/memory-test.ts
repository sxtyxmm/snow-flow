/**
 * Snow-Flow Memory System Test
 * Demonstrates and tests the SQLite memory system functionality
 */

import { MemoryClient } from './memory-client.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('MemoryTest');

async function testMemorySystem() {
  logger.info('Starting memory system tests');

  // Create a test session
  const sessionId = `test_session_${Date.now()}`;
  
  // Create memory clients for different agents
  const widgetAgent = MemoryClient.forAgent('widget_creator_001', 'widget-creator', sessionId);
  const uiAgent = MemoryClient.forAgent('ui_specialist_001', 'ui-specialist', sessionId);
  const testAgent = MemoryClient.forAgent('test_agent_001', 'tester', sessionId);

  try {
    logger.info('Test 1: Agent Registration and Coordination');
    
    // Register agents
    await widgetAgent.register(['create_incident_widget']);
    await uiAgent.register(['style_widget', 'add_responsiveness']);
    await testAgent.register(['test_widget_functionality']);
    
    // Update progress
    await widgetAgent.updateProgress(25, 'analyzing_requirements');
    await widgetAgent.updateProgress(50, 'creating_template');
    await widgetAgent.updateProgress(75, 'implementing_server_script');
    
    logger.info('Test 2: Shared Context Storage');
    
    // Store widget requirements in shared context
    await widgetAgent.store({
      key: 'widget_requirements',
      value: {
        name: 'incident_dashboard',
        features: ['real-time updates', 'chart visualization', 'filters'],
        data_sources: ['incident', 'problem'],
        priority: 'high'
      }
    });
    
    // UI agent retrieves requirements
    const requirements = await uiAgent.retrieve({ key: 'widget_requirements' });
    logger.info('UI Agent retrieved requirements', requirements);
    
    logger.info('Test 3: Artifact Management');
    
    // Widget agent creates artifact
    await widgetAgent.storeArtifact({
      sys_id: 'widget_12345',
      type: 'widget',
      name: 'Incident Dashboard Widget',
      description: 'Real-time incident monitoring dashboard',
      status: 'created',
      metadata: {
        template_size: '5KB',
        has_client_script: true,
        has_server_script: true
      }
    });
    
    // Update artifact status
    await widgetAgent.updateArtifactStatus('widget_12345', 'tested');
    
    logger.info('Test 4: Agent Communication');
    
    // Widget agent hands off to UI specialist
    await widgetAgent.handoff({
      to_agent: 'ui_specialist_001',
      artifact_reference: 'widget_12345',
      data: {
        template_ready: true,
        styling_requirements: {
          theme: 'dark',
          responsive: true,
          accessibility: 'WCAG 2.1'
        }
      }
    });
    
    // UI agent checks for handoffs
    const handoffs = await uiAgent.checkHandoffs();
    logger.info('UI Agent received handoffs', handoffs);
    
    // UI agent reports dependency ready to test agent
    await uiAgent.reportDependencyReady('test_agent_001', 'widget_12345');
    
    logger.info('Test 5: Performance Tracking');
    
    // Track widget creation operation
    const tracker = widgetAgent.trackOperation('create_widget_template');
    
    // Simulate operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Complete tracking
    await tracker.complete(true, undefined, { lines_of_code: 250 });
    
    // Get performance stats
    const stats = await widgetAgent.getPerformanceStats('create_widget_template');
    logger.info('Performance stats', stats);
    
    logger.info('Test 6: Deployment History');
    
    // Record deployment events
    await widgetAgent.recordDeployment('widget_12345', 'create', true);
    await uiAgent.recordDeployment('widget_12345', 'update', true);
    await testAgent.recordDeployment('widget_12345', 'test', true);
    await widgetAgent.recordDeployment('widget_12345', 'verify', true);
    
    // Get deployment history
    const history = await widgetAgent.getDeploymentHistory('widget_12345');
    logger.info('Deployment history', history);
    
    logger.info('Test 7: Session State Management');
    
    // Mark agents as completed
    await widgetAgent.complete();
    await uiAgent.complete();
    await testAgent.complete();
    
    // Get complete session state
    const sessionState = await widgetAgent.getSessionState();
    logger.info('Session state', {
      activeAgents: sessionState.agents.length,
      artifacts: sessionState.artifacts.length,
      pendingMessages: sessionState.pendingMessages,
      contextKeys: sessionState.activeContext.map(c => c.context_key),
      performanceSummary: sessionState.performanceSummary
    });
    
    logger.info('Test 8: Memory Statistics');
    
    const stats2 = widgetAgent.getStats();
    logger.info('Memory statistics', stats2);
    
    logger.info('Test 9: Query Performance');
    
    // Test query performance (should be <100ms as per requirements)
    const startTime = Date.now();
    
    // Run multiple queries
    await Promise.all([
      widgetAgent.findSessionArtifacts(),
      widgetAgent.getSessionData(),
      widgetAgent.getPerformanceStats('create_widget_template'),
      uiAgent.checkHandoffs(),
      testAgent.checkDependencies()
    ]);
    
    const queryTime = Date.now() - startTime;
    logger.info(`Query performance: ${queryTime}ms (requirement: <100ms)`);
    
    logger.info('Test 10: Concurrent Operations');
    
    // Test thread-safe concurrent operations
    const concurrentOps = [];
    
    for (let i = 0; i < 10; i++) {
      concurrentOps.push(
        widgetAgent.store({ 
          key: `concurrent_test_${i}`, 
          value: `value_${i}` 
        })
      );
    }
    
    await Promise.all(concurrentOps);
    logger.info('Concurrent operations completed successfully');
    
    // Cleanup
    await widgetAgent.cleanup();
    
    logger.info('All tests completed successfully!');
    
  } catch (error) {
    logger.error('Test failed', error);
    throw error;
  } finally {
    // Shutdown memory system
    MemoryClient.shutdown();
  }
}

// Run tests if called directly
if (require.main === module) {
  testMemorySystem()
    .then(() => {
      logger.info('Memory system test completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Memory system test failed', error);
      process.exit(1);
    });
}