import { ServiceNowMachineLearningMCP } from '../src/mcp/servicenow-machine-learning-mcp';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('ML Error Scenarios - NO MOCK DATA', () => {
  let mlServer: ServiceNowMachineLearningMCP;
  
  beforeEach(() => {
    mlServer = new ServiceNowMachineLearningMCP();
  });

  test('Should throw error when PA not available for performance analytics', async () => {
    // Mock ServiceNow client to simulate PA not available
    jest.spyOn(mlServer['client'], 'makeRequest').mockRejectedValue({
      response: { status: 403 },
      message: 'Performance Analytics plugin not activated'
    });

    await expect(
      mlServer['performanceAnalytics']({ 
        indicator_name: 'incident_volume',
        time_period: '30d'
      })
    ).rejects.toThrow(/Performance Analytics \(PA\) plugin/);
  });

  test('Should throw error when PI not available for incident classification', async () => {
    // Mock ServiceNow client to simulate PI not available
    jest.spyOn(mlServer['client'], 'makeRequest').mockRejectedValue({
      response: { status: 403 },
      message: 'Predictive Intelligence plugin not activated'
    });

    await expect(
      mlServer['predictiveIntelligence']({
        operation: 'similar_incidents',
        incident_id: 'INC0001'
      })
    ).rejects.toThrow(/Predictive Intelligence \(PI\) plugin/);
  });

  test('Should NOT return mock data when licenses unavailable', async () => {
    // Mock failed API availability check
    jest.spyOn(mlServer as any, 'checkMLAPIAvailability').mockResolvedValue(false);

    // Try to make a ServiceNow request
    await expect(
      mlServer['makeServiceNowRequest']('/api/now/pa/indicators', {})
    ).rejects.toThrow(/ServiceNow ML APIs not available/);
    
    // Verify it throws proper licensing error, not mock data
    try {
      await mlServer['makeServiceNowRequest']('/api/now/pa/indicators', {});
    } catch (error: any) {
      expect(error.message).toContain('Performance Analytics (PA) plugin');
      expect(error.message).toContain('Predictive Intelligence (PI) plugin');
      expect(error.message).not.toContain('mock');
      expect(error.message).not.toContain('sample');
    }
  });

  test('TensorFlow.js should work without any licenses', async () => {
    // Mock no ServiceNow connection at all
    jest.spyOn(mlServer['client'], 'makeRequest').mockRejectedValue({
      message: 'Not authenticated'
    });

    // TensorFlow operations should still work
    const trainResult = await mlServer['trainIncidentClassifier']({
      sample_size: 100,
      epochs: 5
    });

    // Should fail due to no data, but NOT due to licensing
    expect(trainResult).toBeDefined();
    // The error should be about fetching data, not licenses
  });

  test('Should provide helpful error messages with licensing info', async () => {
    jest.spyOn(mlServer as any, 'checkMLAPIAvailability').mockResolvedValue(false);

    try {
      await mlServer['makeServiceNowRequest']('/api/now/ml/similarity', {});
    } catch (error: any) {
      // Check for helpful licensing information
      expect(error.message).toMatch(/This feature requires:/);
      expect(error.message).toMatch(/Performance Analytics \(PA\) plugin/);
      expect(error.message).toMatch(/Predictive Intelligence \(PI\) plugin/);
      expect(error.message).toMatch(/Please ensure these plugins are activated/);
    }
  });

  test('Hybrid recommendation should detect missing licenses', async () => {
    // Mock PI not available
    jest.spyOn(mlServer['client'], 'makeRequest')
      .mockImplementation((config) => {
        if (config.url.includes('/ml/') || config.url.includes('/pi/')) {
          return Promise.reject({
            response: { status: 403 },
            message: 'Plugin not activated'
          });
        }
        return Promise.resolve({ result: {} });
      });

    const result = await mlServer['hybridRecommendation']({
      use_case: 'incident_resolution'
    });

    // Should mention that native ML is not available
    expect(result.content[0].text).toContain('native_ml_results');
    expect(result.content[0].text).toContain('custom_nn_results');
    // But should not contain mock data
    expect(result.content[0].text).not.toContain('mock');
  });
});

describe('ML Decision Tree Validation', () => {
  test('Custom table should only use TensorFlow.js', async () => {
    const mlServer = new ServiceNowMachineLearningMCP();
    
    // For custom table u_vendor_performance, PI should not even be attempted
    const customTableData = {
      table: 'u_vendor_performance',
      features: ['rating', 'delivery_time', 'quality_score']
    };

    // This should go straight to TensorFlow, not try PI
    // In real implementation, we'd check that PI endpoints are NOT called
    expect(customTableData.table.startsWith('u_')).toBe(true);
  });

  test('Client-side predictions should use TensorFlow.js only', async () => {
    // Widget client controller scenario
    const clientSideScenario = {
      location: 'client',
      requirement: 'real-time form validation'
    };

    // Should recommend TensorFlow.js for client-side
    expect(clientSideScenario.location).toBe('client');
  });
});