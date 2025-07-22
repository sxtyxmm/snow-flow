/**
 * Mock MCP Client for Queen Agent Testing
 * 
 * Simulates MCP tool responses without requiring live ServiceNow connections
 * Tests Queen ↔ MCP communication patterns
 */

export interface MockMcpResponse {
  success: boolean;
  result?: any;
  error?: string;
  toolUsed: string;
  executionTime: number;
}

export class MockMcpClient {
  private callHistory: Array<{tool: string, params: any, timestamp: Date}> = [];

  /**
   * Mock snow_deploy tool
   */
  async snow_deploy(params: any): Promise<MockMcpResponse> {
    const startTime = Date.now();
    
    this.callHistory.push({
      tool: 'snow_deploy',
      params,
      timestamp: new Date()
    });

    // Simulate deployment delay
    await this.simulateDelay(1000, 3000);
    
    if (params.type === 'widget') {
      return {
        success: true,
        result: {
          sys_id: 'mock-widget-' + Math.random().toString(36).substring(7),
          name: params.config?.name || 'mock_widget',
          type: 'widget',
          deployed: true,
          update_set: 'mock-update-set-123'
        },
        toolUsed: 'snow_deploy',
        executionTime: Date.now() - startTime
      };
    }
    
    if (params.type === 'flow') {
      return {
        success: true,
        result: {
          sys_id: 'mock-flow-' + Math.random().toString(36).substring(7),
          name: 'Mock Approval Flow',
          type: 'flow',
          deployed: true,
          update_set: 'mock-update-set-123'
        },
        toolUsed: 'snow_deploy',
        executionTime: Date.now() - startTime
      };
    }

    return {
      success: false,
      error: `Unsupported deployment type: ${params.type}`,
      toolUsed: 'snow_deploy',
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Mock snow_create_flow tool
   */
  async snow_create_flow(params: any): Promise<MockMcpResponse> {
    const startTime = Date.now();
    
    this.callHistory.push({
      tool: 'snow_create_flow',
      params,
      timestamp: new Date()
    });

    await this.simulateDelay(2000, 5000);
    
    if (!params.instruction || params.instruction.length < 10) {
      return {
        success: false,
        error: 'Flow instruction too short or missing',
        toolUsed: 'snow_create_flow',
        executionTime: Date.now() - startTime
      };
    }

    return {
      success: true,
      result: {
        sys_id: 'mock-flow-' + Math.random().toString(36).substring(7),
        name: 'AI Generated Flow',
        instruction: params.instruction,
        flow_type: params.flow_type || 'flow',
        deployed: params.deploy_immediately || false,
        analysis: {
          complexity: 'medium',
          estimated_steps: 4,
          requires_approval: true
        }
      },
      toolUsed: 'snow_create_flow',
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Mock snow_find_artifact tool
   */
  async snow_find_artifact(params: any): Promise<MockMcpResponse> {
    const startTime = Date.now();
    
    this.callHistory.push({
      tool: 'snow_find_artifact',
      params,
      timestamp: new Date()
    });

    await this.simulateDelay(500, 1500);
    
    const mockArtifacts = [
      {
        sys_id: 'mock-widget-001',
        name: 'incident_dashboard_widget',
        type: 'widget',
        description: 'Dashboard widget for incident statistics'
      },
      {
        sys_id: 'mock-flow-001',
        name: 'approval_workflow',
        type: 'flow',
        description: 'Approval workflow for service requests'
      },
      {
        sys_id: 'mock-script-001',
        name: 'data_processor_script',
        type: 'script',
        description: 'Data processing script include'
      }
    ];

    // Filter based on query and type
    let results = mockArtifacts;
    
    if (params.type && params.type !== 'any') {
      results = results.filter(a => a.type === params.type);
    }
    
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.description.toLowerCase().includes(query)
      );
    }

    return {
      success: true,
      result: {
        artifacts: results,
        total_found: results.length,
        query: params.query,
        type_filter: params.type
      },
      toolUsed: 'snow_find_artifact',
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Mock snow_catalog_item_search tool
   */
  async snow_catalog_item_search(params: any): Promise<MockMcpResponse> {
    const startTime = Date.now();
    
    this.callHistory.push({
      tool: 'snow_catalog_item_search',
      params,
      timestamp: new Date()
    });

    await this.simulateDelay(800, 2000);
    
    const mockCatalogItems = [
      {
        sys_id: 'mock-catalog-iphone',
        name: 'iPhone 6S',
        short_description: 'iPhone 6S mobile device',
        price: '599.00',
        category: 'Mobile Devices'
      },
      {
        sys_id: 'mock-catalog-laptop',
        name: 'MacBook Pro',
        short_description: 'MacBook Pro laptop computer',
        price: '2399.00',
        category: 'Laptops'
      }
    ];

    // Simple fuzzy search
    let results = mockCatalogItems;
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.short_description.toLowerCase().includes(query)
      );
    }

    return {
      success: true,
      result: {
        catalog_items: results,
        total_found: results.length,
        fuzzy_match: params.fuzzy_match || false
      },
      toolUsed: 'snow_catalog_item_search',
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Mock snow_test_flow_with_mock tool
   */
  async snow_test_flow_with_mock(params: any): Promise<MockMcpResponse> {
    const startTime = Date.now();
    
    this.callHistory.push({
      tool: 'snow_test_flow_with_mock',
      params,
      timestamp: new Date()
    });

    await this.simulateDelay(3000, 8000);
    
    if (!params.flow_id) {
      return {
        success: false,
        error: 'flow_id parameter is required',
        toolUsed: 'snow_test_flow_with_mock',
        executionTime: Date.now() - startTime
      };
    }

    return {
      success: true,
      result: {
        flow_id: params.flow_id,
        test_status: 'completed',
        test_user_created: params.create_test_user || false,
        mock_items_created: params.mock_catalog_items || false,
        test_results: {
          steps_executed: 4,
          approvals_simulated: params.simulate_approvals ? 1 : 0,
          execution_time_ms: 2500,
          errors: [],
          warnings: ['Mock data used - not production ready']
        },
        cleanup_performed: params.cleanup_after_test || false
      },
      toolUsed: 'snow_test_flow_with_mock',
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Mock snow_update_set_create tool
   */
  async snow_update_set_create(params: any): Promise<MockMcpResponse> {
    const startTime = Date.now();
    
    this.callHistory.push({
      tool: 'snow_update_set_create',
      params,
      timestamp: new Date()
    });

    await this.simulateDelay(1000, 2000);
    
    return {
      success: true,
      result: {
        sys_id: 'mock-update-set-' + Math.random().toString(36).substring(7),
        name: params.name,
        description: params.description,
        state: 'in_progress',
        created_by: 'mock-user',
        created_on: new Date().toISOString(),
        is_active: true
      },
      toolUsed: 'snow_update_set_create',
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Get call history for analysis
   */
  getCallHistory(): Array<{tool: string, params: any, timestamp: Date}> {
    return [...this.callHistory];
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalCalls: number;
    toolUsage: Record<string, number>;
    avgResponseTime: number;
  } {
    const toolUsage: Record<string, number> = {};
    
    for (const call of this.callHistory) {
      toolUsage[call.tool] = (toolUsage[call.tool] || 0) + 1;
    }

    return {
      totalCalls: this.callHistory.length,
      toolUsage,
      avgResponseTime: 2000 // Mock average
    };
  }

  /**
   * Clear call history
   */
  clearHistory(): void {
    this.callHistory = [];
  }

  /**
   * Simulate realistic API delay
   */
  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * COMPATIBILITY FIX: makeRequest method for phantom calls
   * MockMcpClient simulates HTTP requests
   */
  async makeRequest(config: any): Promise<any> {
    console.log('🔧 MockMcpClient.makeRequest called with config:', config);
    
    // Simulate delay
    await this.simulateDelay(100, 500);
    
    // Return mock response
    return {
      success: true,
      data: {
        message: 'Mock HTTP response from MockMcpClient',
        method: config.method || 'GET',
        url: config.url || config.endpoint,
        timestamp: new Date().toISOString()
      },
      status: 200
    };
  }
}

export default MockMcpClient;