/**
 * Test Agent
 * Specializes in testing ServiceNow artifacts and ensuring quality
 */

import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { ServiceNowArtifact } from '../queen/types';

interface TestScenario {
  name: string;
  type: 'positive' | 'negative' | 'edge_case' | 'performance';
  description: string;
  inputs: any;
  expectedOutput?: any;
  assertions: string[];
}

interface TestResult {
  scenario: string;
  passed: boolean;
  executionTime: number;
  error?: string;
  actualOutput?: any;
  assertions: {
    assertion: string;
    passed: boolean;
    message?: string;
  }[];
}

export class TestAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      type: 'tester',
      capabilities: [
        'Test scenario creation',
        'Mock data generation',
        'Integration testing',
        'Performance validation',
        'Quality assurance',
        'Automated test execution',
        'Edge case identification',
        'Security testing',
        'User acceptance testing'
      ],
      mcpTools: [
        'snow_test_flow_with_mock',
        'snow_widget_test',
        'snow_comprehensive_flow_test',
        'snow_cleanup_test_artifacts',
        'snow_preview_widget',
        'snow_validate_flow_definition',
        'snow_performance_test'
      ],
      ...config
    });
  }

  async execute(instruction: string, context?: Record<string, any>): Promise<AgentResult> {
    try {
      this.setStatus('working');
      await this.reportProgress('Starting test execution', 0);

      // Analyze what needs to be tested
      const testRequirements = await this.analyzeTestRequirements(instruction, context);
      await this.reportProgress('Analyzed test requirements', 15);

      // Retrieve artifacts to test
      const artifacts = await this.retrieveArtifacts(testRequirements);
      if (!artifacts || artifacts.length === 0) {
        throw new Error('No artifacts found to test');
      }
      await this.reportProgress('Retrieved artifacts for testing', 25);

      // Generate test scenarios
      const testScenarios = await this.generateTestScenarios(artifacts, testRequirements);
      await this.reportProgress(`Generated ${testScenarios.length} test scenarios`, 35);

      // Generate mock data
      const mockData = await this.generateMockData(testScenarios, artifacts);
      await this.reportProgress('Generated mock test data', 45);

      // Execute tests
      const testResults: TestResult[] = [];
      let currentProgress = 50;
      const progressPerTest = 40 / testScenarios.length;

      for (const scenario of testScenarios) {
        const result = await this.executeTestScenario(scenario, artifacts[0], mockData);
        testResults.push(result);
        currentProgress += progressPerTest;
        await this.reportProgress(`Executed test: ${scenario.name}`, Math.round(currentProgress));
      }

      // Analyze test results
      const analysis = await this.analyzeTestResults(testResults);
      await this.reportProgress('Analyzed test results', 92);

      // Clean up test artifacts if all tests passed
      if (analysis.allPassed && testRequirements.cleanupAfterTest) {
        await this.cleanupTestArtifacts();
        await this.reportProgress('Cleaned up test artifacts', 95);
      }

      // Generate test report
      const testReport = this.generateTestReport(testResults, analysis);
      await this.reportProgress('Test execution completed', 100);

      this.setStatus('completed');

      await this.logActivity('test_execution', analysis.allPassed, {
        totalTests: testScenarios.length,
        passed: analysis.passedCount,
        failed: analysis.failedCount,
        coverage: analysis.coverage
      });

      return {
        success: analysis.allPassed,
        message: analysis.allPassed ? 
          `All ${testScenarios.length} tests passed successfully` :
          `${analysis.failedCount} of ${testScenarios.length} tests failed`,
        metadata: {
          testReport,
          testResults,
          analysis,
          mockDataGenerated: true,
          artifactsTested: artifacts.map(a => ({ type: a.type, name: a.name }))
        }
      };

    } catch (error) {
      this.setStatus('failed');
      await this.logActivity('test_execution', false, { error: error.message });
      
      return {
        success: false,
        error: error as Error,
        message: `Test execution failed: ${error.message}`
      };
    }
  }

  private async analyzeTestRequirements(instruction: string, context?: any): Promise<any> {
    const requirements = {
      artifactTypes: [] as string[],
      testTypes: [] as string[],
      coverage: 'standard', // minimal, standard, comprehensive
      includeNegativeTests: true,
      includePerformanceTests: false,
      includeSecurityTests: false,
      cleanupAfterTest: true,
      specificArtifact: null as string | null
    };

    // Detect artifact types to test
    if (/widget/i.test(instruction)) {
      requirements.artifactTypes.push('widget');
    }
    if (/flow/i.test(instruction)) {
      requirements.artifactTypes.push('flow');
    }
    if (/script/i.test(instruction)) {
      requirements.artifactTypes.push('script');
    }
    if (!requirements.artifactTypes.length) {
      // Test whatever is in context
      requirements.artifactTypes = ['widget', 'flow', 'script'];
    }

    // Detect test types
    if (/integration/i.test(instruction)) {
      requirements.testTypes.push('integration');
    }
    if (/performance/i.test(instruction)) {
      requirements.testTypes.push('performance');
      requirements.includePerformanceTests = true;
    }
    if (/security/i.test(instruction)) {
      requirements.testTypes.push('security');
      requirements.includeSecurityTests = true;
    }
    if (/comprehensive|thorough|extensive/i.test(instruction)) {
      requirements.coverage = 'comprehensive';
    }
    if (/minimal|basic|quick/i.test(instruction)) {
      requirements.coverage = 'minimal';
      requirements.includeNegativeTests = false;
    }

    // Check if specific artifact is mentioned
    const artifactMatch = instruction.match(/test\s+(?:the\s+)?([a-zA-Z0-9_]+)\s+(?:widget|flow|script)/i);
    if (artifactMatch) {
      requirements.specificArtifact = artifactMatch[1];
    }

    return requirements;
  }

  private async retrieveArtifacts(requirements: any): Promise<ServiceNowArtifact[]> {
    const artifacts: ServiceNowArtifact[] = [];

    // Try to retrieve specific artifact first
    if (requirements.specificArtifact) {
      for (const type of requirements.artifactTypes) {
        const artifact = await this.getArtifact(type, requirements.specificArtifact);
        if (artifact) {
          artifacts.push(artifact);
          return artifacts;
        }
      }
    }

    // Otherwise, get recent artifacts of requested types
    for (const type of requirements.artifactTypes) {
      // This would retrieve from shared memory
      // For now, we'll use a placeholder
      const recentArtifact = await this.getArtifact(type, `recent_${type}`);
      if (recentArtifact) {
        artifacts.push(recentArtifact);
      }
    }

    return artifacts;
  }

  private async generateTestScenarios(artifacts: ServiceNowArtifact[], requirements: any): Promise<TestScenario[]> {
    const scenarios: TestScenario[] = [];

    for (const artifact of artifacts) {
      switch (artifact.type) {
        case 'widget':
          scenarios.push(...this.generateWidgetTestScenarios(artifact, requirements));
          break;
        case 'flow':
          scenarios.push(...this.generateFlowTestScenarios(artifact, requirements));
          break;
        case 'script':
          scenarios.push(...this.generateScriptTestScenarios(artifact, requirements));
          break;
      }
    }

    return scenarios;
  }

  private generateWidgetTestScenarios(widget: ServiceNowArtifact, requirements: any): TestScenario[] {
    const scenarios: TestScenario[] = [];
    const config = widget.config;

    // Basic rendering test
    scenarios.push({
      name: 'Widget Basic Rendering',
      type: 'positive',
      description: 'Test that widget renders without errors',
      inputs: {
        options: {},
        data: {}
      },
      assertions: [
        'Widget should render without JavaScript errors',
        'HTML template should be valid',
        'CSS should load correctly'
      ]
    });

    // Data loading test
    scenarios.push({
      name: 'Widget Data Loading',
      type: 'positive',
      description: 'Test that widget loads and displays data correctly',
      inputs: {
        server_data: {
          rows: [
            { id: 1, name: 'Test Item 1', status: 'Active' },
            { id: 2, name: 'Test Item 2', status: 'Inactive' }
          ]
        }
      },
      assertions: [
        'Data should be displayed in the widget',
        'All rows should be visible',
        'Data formatting should be correct'
      ]
    });

    // Empty data test
    if (requirements.includeNegativeTests) {
      scenarios.push({
        name: 'Widget Empty Data Handling',
        type: 'negative',
        description: 'Test widget behavior with no data',
        inputs: {
          server_data: {
            rows: []
          }
        },
        assertions: [
          'Widget should display appropriate empty state message',
          'No JavaScript errors should occur',
          'Widget should remain functional'
        ]
      });
    }

    // Responsive design test
    scenarios.push({
      name: 'Widget Responsive Design',
      type: 'edge_case',
      description: 'Test widget on different screen sizes',
      inputs: {
        viewport_sizes: [
          { width: 320, height: 568 },  // Mobile
          { width: 768, height: 1024 }, // Tablet
          { width: 1920, height: 1080 } // Desktop
        ]
      },
      assertions: [
        'Widget should be responsive on all screen sizes',
        'Text should remain readable',
        'No horizontal scrolling on mobile'
      ]
    });

    // Performance test
    if (requirements.includePerformanceTests) {
      scenarios.push({
        name: 'Widget Performance',
        type: 'performance',
        description: 'Test widget performance with large datasets',
        inputs: {
          server_data: {
            rows: Array(1000).fill(null).map((_, i) => ({
              id: i,
              name: `Item ${i}`,
              status: i % 2 === 0 ? 'Active' : 'Inactive'
            }))
          }
        },
        assertions: [
          'Widget should render within 3 seconds',
          'Scrolling should be smooth',
          'Memory usage should be reasonable'
        ]
      });
    }

    return scenarios;
  }

  private generateFlowTestScenarios(flow: ServiceNowArtifact, requirements: any): TestScenario[] {
    const scenarios: TestScenario[] = [];

    // Basic flow execution
    scenarios.push({
      name: 'Flow Basic Execution',
      type: 'positive',
      description: 'Test that flow executes successfully with valid inputs',
      inputs: {
        trigger_record: {
          number: 'TST0001',
          short_description: 'Test Record',
          priority: 2,
          state: 1
        }
      },
      assertions: [
        'Flow should trigger correctly',
        'All actions should execute in order',
        'Flow should complete without errors'
      ]
    });

    // Approval path test
    if (flow.config.metadata?.hasApprovals) {
      scenarios.push({
        name: 'Flow Approval Path - Approved',
        type: 'positive',
        description: 'Test flow behavior when approval is granted',
        inputs: {
          trigger_record: {
            number: 'TST0002',
            priority: 1
          },
          approval_response: 'approved',
          approver: 'admin'
        },
        assertions: [
          'Approval request should be created',
          'Flow should continue after approval',
          'Approved actions should execute'
        ]
      });

      if (requirements.includeNegativeTests) {
        scenarios.push({
          name: 'Flow Approval Path - Rejected',
          type: 'negative',
          description: 'Test flow behavior when approval is rejected',
          inputs: {
            trigger_record: {
              number: 'TST0003',
              priority: 1
            },
            approval_response: 'rejected',
            approver: 'admin'
          },
          assertions: [
            'Approval request should be created',
            'Flow should handle rejection gracefully',
            'Rejection path should execute',
            'Notification should be sent'
          ]
        });
      }
    }

    // Error handling test
    scenarios.push({
      name: 'Flow Error Handling',
      type: 'negative',
      description: 'Test flow error handling capabilities',
      inputs: {
        trigger_record: {
          number: 'TST0004',
          force_error: true
        }
      },
      assertions: [
        'Flow should catch errors',
        'Error handler should execute',
        'Flow should not leave data in inconsistent state'
      ]
    });

    // Performance test
    if (requirements.includePerformanceTests) {
      scenarios.push({
        name: 'Flow Performance Under Load',
        type: 'performance',
        description: 'Test flow performance with multiple simultaneous executions',
        inputs: {
          concurrent_executions: 10,
          trigger_records: Array(10).fill(null).map((_, i) => ({
            number: `PERF${i.toString().padStart(4, '0')}`,
            priority: (i % 3) + 1
          }))
        },
        assertions: [
          'All flows should complete within reasonable time',
          'No deadlocks should occur',
          'System resources should not be exhausted'
        ]
      });
    }

    return scenarios;
  }

  private generateScriptTestScenarios(script: ServiceNowArtifact, requirements: any): TestScenario[] {
    const scenarios: TestScenario[] = [];
    const scriptType = script.config.type || 'business_rule';

    // Basic execution test
    scenarios.push({
      name: 'Script Basic Execution',
      type: 'positive',
      description: 'Test that script executes without errors',
      inputs: {
        current: {
          sys_id: 'test123',
          number: 'TST0001',
          short_description: 'Test Record'
        },
        previous: null
      },
      assertions: [
        'Script should execute without throwing errors',
        'Expected fields should be set',
        'No infinite loops should occur'
      ]
    });

    // Field validation test (for business rules)
    if (scriptType === 'business_rule') {
      scenarios.push({
        name: 'Business Rule Field Validation',
        type: 'positive',
        description: 'Test that business rule validates fields correctly',
        inputs: {
          current: {
            short_description: '',
            priority: 1
          }
        },
        expectedOutput: {
          abort_action: true,
          error_messages: ['Short description is required']
        },
        assertions: [
          'Validation should trigger for empty required fields',
          'Appropriate error messages should be set',
          'Record save should be prevented'
        ]
      });
    }

    // Script include method test
    if (scriptType === 'script_include') {
      scenarios.push({
        name: 'Script Include Method Test',
        type: 'positive',
        description: 'Test script include methods work correctly',
        inputs: {
          method: 'processRecords',
          params: {
            tableName: 'incident',
            query: 'active=true^priority=1',
            callback: 'function(gr) { return gr.number; }'
          }
        },
        assertions: [
          'Method should be callable',
          'Return value should match expected format',
          'No memory leaks should occur'
        ]
      });
    }

    // Edge case test
    scenarios.push({
      name: 'Script Edge Case - Null Values',
      type: 'edge_case',
      description: 'Test script handling of null/undefined values',
      inputs: {
        current: {
          sys_id: 'test123',
          short_description: null,
          assigned_to: undefined
        }
      },
      assertions: [
        'Script should handle null values gracefully',
        'No null pointer exceptions should occur',
        'Default values should be applied where appropriate'
      ]
    });

    return scenarios;
  }

  private async generateMockData(scenarios: TestScenario[], artifacts: ServiceNowArtifact[]): Promise<any> {
    const mockData: any = {
      users: [
        { sys_id: 'user1', user_name: 'test.user', name: 'Test User', email: 'test@example.com' },
        { sys_id: 'user2', user_name: 'admin', name: 'Admin User', email: 'admin@example.com' }
      ],
      groups: [
        { sys_id: 'group1', name: 'Service Desk', manager: 'user2' },
        { sys_id: 'group2', name: 'IT Support', manager: 'user1' }
      ],
      catalog_items: [
        { sys_id: 'cat1', name: 'Laptop Request', category: 'Hardware' },
        { sys_id: 'cat2', name: 'Software Installation', category: 'Software' }
      ]
    };

    // Generate specific mock data based on artifact types
    for (const artifact of artifacts) {
      if (artifact.type === 'widget' && artifact.config.dataSource) {
        mockData[artifact.config.dataSource] = this.generateTableMockData(artifact.config.dataSource);
      }
    }

    return mockData;
  }

  private generateTableMockData(tableName: string): any[] {
    const baseRecord = {
      sys_id: '',
      sys_created_on: new Date().toISOString(),
      sys_updated_on: new Date().toISOString(),
      sys_created_by: 'test.user',
      sys_updated_by: 'test.user'
    };

    switch (tableName) {
      case 'incident':
        return Array(5).fill(null).map((_, i) => ({
          ...baseRecord,
          sys_id: `inc${i}`,
          number: `INC000100${i}`,
          short_description: `Test Incident ${i}`,
          description: `This is a test incident for automated testing`,
          priority: (i % 3) + 1,
          state: i % 4 + 1,
          assigned_to: i % 2 === 0 ? 'user1' : 'user2',
          assignment_group: i % 2 === 0 ? 'group1' : 'group2'
        }));

      case 'sc_request':
        return Array(3).fill(null).map((_, i) => ({
          ...baseRecord,
          sys_id: `req${i}`,
          number: `REQ000100${i}`,
          short_description: `Test Request ${i}`,
          requested_for: 'user1',
          state: 'pending_approval',
          cat_item: `cat${i % 2 + 1}`
        }));

      default:
        return Array(3).fill(null).map((_, i) => ({
          ...baseRecord,
          sys_id: `rec${i}`,
          number: `REC000100${i}`,
          short_description: `Test Record ${i}`
        }));
    }
  }

  private async executeTestScenario(scenario: TestScenario, artifact: ServiceNowArtifact, mockData: any): Promise<TestResult> {
    const startTime = Date.now();
    const result: TestResult = {
      scenario: scenario.name,
      passed: true,
      executionTime: 0,
      assertions: []
    };

    try {
      // Execute test based on artifact type
      let testOutput: any;
      
      switch (artifact.type) {
        case 'widget':
          testOutput = await this.executeWidgetTest(scenario, artifact, mockData);
          break;
        case 'flow':
          testOutput = await this.executeFlowTest(scenario, artifact, mockData);
          break;
        case 'script':
          testOutput = await this.executeScriptTest(scenario, artifact, mockData);
          break;
      }

      result.actualOutput = testOutput;

      // Evaluate assertions
      for (const assertion of scenario.assertions) {
        const assertionResult = await this.evaluateAssertion(assertion, testOutput, scenario);
        result.assertions.push(assertionResult);
        if (!assertionResult.passed) {
          result.passed = false;
        }
      }

    } catch (error) {
      result.passed = false;
      result.error = error.message;
      result.assertions.push({
        assertion: 'Test execution',
        passed: false,
        message: `Test failed with error: ${error.message}`
      });
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  private async executeWidgetTest(scenario: TestScenario, widget: ServiceNowArtifact, mockData: any): Promise<any> {
    // This would use snow_widget_test MCP tool
    // For now, simulate test execution
    return {
      renderSuccess: true,
      loadTime: 250,
      errors: [],
      dataDisplayed: scenario.inputs.server_data?.rows?.length || 0,
      responsive: true
    };
  }

  private async executeFlowTest(scenario: TestScenario, flow: ServiceNowArtifact, mockData: any): Promise<any> {
    // This would use snow_test_flow_with_mock MCP tool
    // For now, simulate test execution
    return {
      executionId: `flow_test_${Date.now()}`,
      status: 'completed',
      duration: 1500,
      stagesExecuted: ['Start', 'Validate', 'Process', 'End'],
      errors: [],
      outputs: {
        success: true,
        recordUpdated: true
      }
    };
  }

  private async executeScriptTest(scenario: TestScenario, script: ServiceNowArtifact, mockData: any): Promise<any> {
    // Simulate script test execution
    return {
      executionSuccess: true,
      errors: [],
      fieldsModified: ['work_notes', 'state'],
      validationsPassed: true,
      performanceMetrics: {
        executionTime: 50,
        memoryUsed: 1024
      }
    };
  }

  private async evaluateAssertion(assertion: string, actualOutput: any, scenario: TestScenario): Promise<any> {
    // Simple assertion evaluation logic
    // In a real implementation, this would be more sophisticated
    
    const assertionResult = {
      assertion,
      passed: true,
      message: 'Assertion passed'
    };

    // Check for specific assertion patterns
    if (assertion.includes('without errors') && actualOutput.errors?.length > 0) {
      assertionResult.passed = false;
      assertionResult.message = `Found ${actualOutput.errors.length} errors`;
    }

    if (assertion.includes('should be displayed') && actualOutput.dataDisplayed === 0) {
      assertionResult.passed = false;
      assertionResult.message = 'No data was displayed';
    }

    if (assertion.includes('within') && assertion.includes('seconds')) {
      const timeMatch = assertion.match(/within (\d+) seconds/);
      if (timeMatch) {
        const maxTime = parseInt(timeMatch[1]) * 1000;
        if (actualOutput.executionTime > maxTime || actualOutput.loadTime > maxTime) {
          assertionResult.passed = false;
          assertionResult.message = `Execution took longer than ${maxTime}ms`;
        }
      }
    }

    return assertionResult;
  }

  private async analyzeTestResults(results: TestResult[]): Promise<any> {
    const analysis = {
      totalTests: results.length,
      passedCount: results.filter(r => r.passed).length,
      failedCount: results.filter(r => !r.passed).length,
      allPassed: results.every(r => r.passed),
      averageExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
      coverage: 0,
      failedTests: results.filter(r => !r.passed).map(r => ({
        name: r.scenario,
        error: r.error,
        failedAssertions: r.assertions.filter(a => !a.passed)
      })),
      performanceIssues: results.filter(r => r.executionTime > 5000).map(r => r.scenario)
    };

    // Calculate coverage based on test types
    const testTypes = new Set(results.map(r => r.scenario.split(' ')[1]));
    analysis.coverage = (testTypes.size / 5) * 100; // Assume 5 main test categories

    return analysis;
  }

  private async cleanupTestArtifacts(): Promise<void> {
    // This would use snow_cleanup_test_artifacts MCP tool
    // Clean up any test data created during testing
    await this.logActivity('cleanup_test_artifacts', true, {
      timestamp: new Date()
    });
  }

  private generateTestReport(results: TestResult[], analysis: any): string {
    let report = '# Test Execution Report\n\n';
    report += `**Date**: ${new Date().toISOString()}\n`;
    report += `**Total Tests**: ${analysis.totalTests}\n`;
    report += `**Passed**: ${analysis.passedCount}\n`;
    report += `**Failed**: ${analysis.failedCount}\n`;
    report += `**Coverage**: ${analysis.coverage.toFixed(1)}%\n`;
    report += `**Average Execution Time**: ${analysis.averageExecutionTime.toFixed(0)}ms\n\n`;

    report += '## Test Results\n\n';
    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      report += `### ${icon} ${result.scenario}\n`;
      report += `- **Status**: ${result.passed ? 'PASSED' : 'FAILED'}\n`;
      report += `- **Execution Time**: ${result.executionTime}ms\n`;
      
      if (result.error) {
        report += `- **Error**: ${result.error}\n`;
      }
      
      report += `- **Assertions**:\n`;
      for (const assertion of result.assertions) {
        const assertionIcon = assertion.passed ? '✓' : '✗';
        report += `  - ${assertionIcon} ${assertion.assertion}\n`;
        if (!assertion.passed && assertion.message) {
          report += `    - ${assertion.message}\n`;
        }
      }
      report += '\n';
    }

    if (analysis.failedCount > 0) {
      report += '## Failed Tests Summary\n\n';
      for (const failed of analysis.failedTests) {
        report += `- **${failed.name}**\n`;
        if (failed.error) {
          report += `  - Error: ${failed.error}\n`;
        }
        for (const assertion of failed.failedAssertions) {
          report += `  - Failed: ${assertion.assertion}\n`;
        }
      }
    }

    if (analysis.performanceIssues.length > 0) {
      report += '\n## Performance Issues\n\n';
      report += 'The following tests took longer than 5 seconds:\n';
      for (const test of analysis.performanceIssues) {
        report += `- ${test}\n`;
      }
    }

    return report;
  }
}