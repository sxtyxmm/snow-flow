/**
 * Widget Backend Agent - Backend Development Specialist
 * Handles server-side scripts, data processing, API integrations, and performance optimization
 */
import { BaseSnowAgent } from '../base-team';
import { 
  BackendRequirements,
  TeamResult,
  AgentCapability,
  SpecializationProfile
} from '../team-types';
import { ServiceNowAgentConfig } from '../../../types/servicenow.types';

export class WidgetBackendAgent extends BaseSnowAgent {
  constructor(config: ServiceNowAgentConfig) {
    const capabilities: AgentCapability[] = [
      {
        name: 'server_script_development',
        description: 'Create efficient server-side scripts for widgets',
        proficiency: 0.95,
        tools: ['javascript', 'servicenow_server_api', 'gliderecord']
      },
      {
        name: 'data_processing',
        description: 'Process and transform data for widget consumption',
        proficiency: 0.9,
        tools: ['data_transformation', 'aggregation', 'filtering']
      },
      {
        name: 'api_integration',
        description: 'Integrate with external APIs and ServiceNow APIs',
        proficiency: 0.88,
        tools: ['rest_api', 'soap_api', 'servicenow_api']
      },
      {
        name: 'performance_optimization',
        description: 'Optimize scripts for performance and scalability',
        proficiency: 0.85,
        tools: ['caching', 'query_optimization', 'lazy_loading']
      },
      {
        name: 'security_implementation',
        description: 'Implement security best practices and validation',
        proficiency: 0.83,
        tools: ['input_validation', 'access_control', 'sanitization']
      }
    ];

    const specialization: SpecializationProfile = {
      primary: ['server_scripting', 'data_processing', 'api_integration'],
      secondary: ['performance_optimization', 'security', 'error_handling'],
      tools: ['GlideRecord', 'GlideAjax', 'RESTMessage', 'ServiceNow APIs'],
      experience: 0.88
    };

    super(
      'widget-backend-001',
      'Widget Backend Specialist',
      'backend_developer',
      capabilities,
      specialization,
      config
    );
  }

  /**
   * Analyze backend requirements and prepare implementation plan
   */
  async analyzeRequirements(requirements: BackendRequirements & { platform?: any }): Promise<any> {
    try {
      this.setStatus('busy');
      console.log('Backend Agent: Analyzing backend requirements...');

      const analysis = {
        dataProcessingNeeds: this.analyzeDataProcessing(requirements),
        apiIntegrationNeeds: this.analyzeApiIntegrations(requirements),
        performanceStrategy: this.analyzePerformanceNeeds(requirements),
        securityRequirements: this.analyzeSecurityNeeds(requirements),
        errorHandlingStrategy: this.analyzeErrorHandling(requirements)
      };

      console.log('Backend Agent: Analysis complete');
      return analysis;

    } catch (error) {
      console.error('Backend Agent: Error analyzing requirements:', error);
      throw error;
    } finally {
      this.setStatus('available');
    }
  }

  /**
   * Execute backend development tasks
   */
  async execute(requirements: BackendRequirements & { platform?: any }): Promise<TeamResult> {
    try {
      this.setStatus('busy');
      console.log('Backend Agent: Starting backend development...');

      // Create server-side script
      const serverScript = await this.createServerScript(requirements);
      
      // Create data processing functions
      const dataProcessors = await this.createDataProcessors(requirements);
      
      // Create API integration handlers
      const apiHandlers = await this.createApiHandlers(requirements);
      
      // Create performance optimizations
      const performanceOptimizations = await this.createPerformanceOptimizations(requirements);
      
      // Create security validations
      const securityValidations = await this.createSecurityValidations(requirements);
      
      // Validate and test the implementation
      const validation = await this.validateImplementation({
        serverScript,
        dataProcessors,
        apiHandlers,
        requirements
      });

      console.log('Backend Agent: Backend development completed');

      return {
        success: true,
        artifact: {
          serverScript,
          dataProcessors,
          apiHandlers,
          performanceOptimizations,
          securityValidations,
          validation
        },
        metadata: {
          duration: 0,
          performance: {
            script_efficiency: this.assessScriptEfficiency(serverScript),
            query_optimization: this.assessQueryOptimization(serverScript),
            api_performance: this.assessApiPerformance(apiHandlers)
          },
          quality: {
            error_handling: validation.errorHandling,
            security_score: validation.security,
            maintainability: validation.maintainability
          }
        }
      };

    } catch (error) {
      console.error('Backend Agent: Error in backend development:', error);
      return this.handleError(error);
    } finally {
      this.setStatus('available');
    }
  }

  /**
   * Create comprehensive server-side script
   */
  async createServerScript(requirements: BackendRequirements): Promise<string> {
    console.log('Backend Agent: Creating server script...');

    const { serverScript: scriptReq, performance, security } = requirements;
    
    let script = `(function() {
  'use strict';
  
  // Widget data object
  data.loading = true;
  data.error = null;
  data.items = [];
  data.total = 0;
  data.metadata = {};
  
  try {
    // Initialize widget
    initializeWidget();
    
    // Process main data request
    processDataRequest();
    
  } catch (error) {
    handleError(error);
  }
  
  /**
   * Initialize widget with options and security checks
   */
  function initializeWidget() {
    // Validate user permissions
    if (!validateUserAccess()) {
      throw new Error('Access denied: Insufficient permissions');
    }
    
    // Initialize default options
    options = options || {};
    options.max_items = options.max_items || 10;
    options.refresh_interval = options.refresh_interval || 30;
    
    // Log widget initialization
    gs.info('Widget initialized for user: ' + gs.getUserID());
  }
  
  /**
   * Main data processing function
   */
  function processDataRequest() {
    var action = input && input.action;
    
    switch (action) {
      case 'load_data':
        loadMainData();
        break;
      case 'refresh_data':
        refreshData();
        break;
      case 'save_item':
        saveItemData(input.item);
        break;
      case 'delete_item':
        deleteItemData(input.item_id);
        break;
      default:
        loadMainData();
    }
  }`;

    // Add data loading functions
    script += this.createDataLoadingFunctions(scriptReq);
    
    // Add API integration functions
    script += this.createApiIntegrationFunctions(scriptReq);
    
    // Add performance optimization functions
    if (performance.caching) {
      script += this.createCachingFunctions();
    }
    
    // Add security validation functions
    script += this.createSecurityFunctions(security);
    
    // Add error handling functions
    script += this.createErrorHandlingFunctions();
    
    // Close main function
    script += `
  
  /**
   * Finalize data processing
   */
  function finalizeData() {
    data.loading = false;
    data.lastUpdated = new GlideDateTime().getDisplayValue();
    
    // Add metadata
    data.metadata = {
      total_records: data.total,
      processing_time: getProcessingTime(),
      cache_hit: data.cache_hit || false,
      user_id: gs.getUserID()
    };
    
    gs.info('Widget data processing completed. Items: ' + data.items.length);
  }
  
  // Always finalize data
  finalizeData();
  
})();`;

    return script;
  }

  /**
   * Create data processing functions
   */
  async createDataProcessors(requirements: BackendRequirements): Promise<any> {
    console.log('Backend Agent: Creating data processors...');

    const processors = {
      dataFiltering: this.createDataFilterProcessor(requirements),
      dataAggregation: this.createDataAggregationProcessor(requirements),
      dataTransformation: this.createDataTransformationProcessor(requirements),
      dataValidation: this.createDataValidationProcessor(requirements)
    };

    return processors;
  }

  /**
   * Create API integration handlers
   */
  async createApiHandlers(requirements: BackendRequirements): Promise<any> {
    console.log('Backend Agent: Creating API handlers...');

    const handlers = {
      restApiHandler: this.createRestApiHandler(requirements),
      externalApiHandler: this.createExternalApiHandler(requirements),
      serviceNowApiHandler: this.createServiceNowApiHandler(requirements)
    };

    return handlers;
  }

  /**
   * Create performance optimizations
   */
  async createPerformanceOptimizations(requirements: BackendRequirements): Promise<any> {
    console.log('Backend Agent: Creating performance optimizations...');

    const optimizations = {
      queryOptimization: this.createQueryOptimizations(requirements),
      cachingStrategy: this.createCachingStrategy(requirements),
      lazyLoading: this.createLazyLoadingStrategy(requirements)
    };

    return optimizations;
  }

  /**
   * Create security validations
   */
  async createSecurityValidations(requirements: BackendRequirements): Promise<any> {
    console.log('Backend Agent: Creating security validations...');

    const validations = {
      inputValidation: this.createInputValidation(requirements),
      accessControl: this.createAccessControl(requirements),
      dataSanitization: this.createDataSanitization(requirements)
    };

    return validations;
  }

  // Server script creation helpers
  private createDataLoadingFunctions(scriptReq: any): string {
    return `
  
  /**
   * Load main widget data
   */
  function loadMainData() {
    try {
      var startTime = new GlideDateTime();
      
      // Check cache first if enabled
      var cachedData = getCachedData('main_data');
      if (cachedData) {
        data.items = cachedData.items;
        data.total = cachedData.total;
        data.cache_hit = true;
        return;
      }
      
      // Query main data
      var gr = new GlideRecord('${scriptReq.dataProcessing.includes('incident') ? 'incident' : 'task'}');
      
      // Apply filters
      applyDataFilters(gr);
      
      // Apply ordering
      gr.orderByDesc('sys_updated_on');
      
      // Apply limits
      gr.setLimit(options.max_items || 10);
      
      // Execute query
      gr.query();
      
      var items = [];
      var count = 0;
      
      while (gr.next() && count < (options.max_items || 10)) {
        items.push(processRecord(gr));
        count++;
      }
      
      // Set data
      data.items = items;
      data.total = getTotal();
      
      // Cache results if enabled
      if (shouldCacheResults()) {
        setCachedData('main_data', {
          items: data.items,
          total: data.total,
          timestamp: new GlideDateTime().getNumericValue()
        });
      }
      
      // Log performance
      var endTime = new GlideDateTime();
      var processingTime = endTime.getNumericValue() - startTime.getNumericValue();
      gs.info('Data loading completed in ' + processingTime + 'ms');
      
    } catch (error) {
      gs.error('Error loading main data: ' + error.message);
      handleError(error);
    }
  }
  
  /**
   * Refresh data (bypass cache)
   */
  function refreshData() {
    clearCache('main_data');
    loadMainData();
  }
  
  /**
   * Process individual record
   */
  function processRecord(gr) {
    var item = {
      sys_id: gr.getUniqueValue(),
      display_value: gr.getDisplayValue(),
      table: gr.getTableName(),
      updated_on: gr.getValue('sys_updated_on'),
      created_on: gr.getValue('sys_created_on')
    };
    
    // Add specific fields based on table
    if (gr.getTableName() === 'incident') {
      item.number = gr.getValue('number');
      item.priority = gr.getValue('priority');
      item.state = gr.getValue('state');
      item.short_description = gr.getValue('short_description');
      item.assigned_to = gr.getDisplayValue('assigned_to');
    }
    
    // Transform data if needed
    item = transformItemData(item);
    
    return item;
  }
  
  /**
   * Apply data filters based on options and user context
   */
  function applyDataFilters(gr) {
    // User-specific filters
    if (options.assigned_to_me) {
      gr.addQuery('assigned_to', gs.getUserID());
    }
    
    // Time-based filters
    if (options.time_range) {
      var timeFilter = getTimeFilter(options.time_range);
      gr.addQuery('sys_created_on', '>=', timeFilter);
    }
    
    // Status filters
    if (options.active_only) {
      gr.addQuery('active', true);
    }
    
    // Custom filters from input
    if (input && input.filters) {
      applyCustomFilters(gr, input.filters);
    }
  }
  
  /**
   * Get total count for pagination
   */
  function getTotal() {
    var countGr = new GlideRecord('${scriptReq.dataProcessing.includes('incident') ? 'incident' : 'task'}');
    applyDataFilters(countGr);
    countGr.query();
    return countGr.getRowCount();
  }`;
  }

  private createApiIntegrationFunctions(scriptReq: any): string {
    if (!scriptReq.apiIntegrations || scriptReq.apiIntegrations.length === 0) {
      return '';
    }

    return `
  
  /**
   * Handle external API integrations
   */
  function handleApiIntegrations() {
    try {
      var apiResults = {};
      
      // Process each API integration
      ${scriptReq.apiIntegrations.map((api: string) => `
      apiResults.${api} = call${this.capitalizeFirst(api)}Api();`).join('')}
      
      // Merge API results with main data
      mergeApiResults(apiResults);
      
    } catch (error) {
      gs.error('API integration error: ' + error.message);
      // Continue without API data
    }
  }
  
  /**
   * Call external REST API
   */
  function callExternalApi(endpoint, params) {
    try {
      var request = new sn_ws.RESTMessageV2();
      request.setEndpoint(endpoint);
      request.setHttpMethod('GET');
      
      // Add parameters
      if (params) {
        for (var key in params) {
          request.setQueryParameter(key, params[key]);
        }
      }
      
      // Add authentication if configured
      addApiAuthentication(request);
      
      var response = request.execute();
      var responseBody = response.getBody();
      var httpStatus = response.getStatusCode();
      
      if (httpStatus === 200) {
        return JSON.parse(responseBody);
      } else {
        throw new Error('API call failed with status: ' + httpStatus);
      }
      
    } catch (error) {
      gs.error('External API call failed: ' + error.message);
      return null;
    }
  }
  
  /**
   * Add API authentication
   */
  function addApiAuthentication(request) {
    // Basic authentication example
    if (options.api_username && options.api_password) {
      request.setBasicAuth(options.api_username, options.api_password);
    }
    
    // Bearer token example
    if (options.api_token) {
      request.setRequestHeader('Authorization', 'Bearer ' + options.api_token);
    }
  }`;
  }

  private createCachingFunctions(): string {
    return `
  
  /**
   * Cache management functions
   */
  function getCachedData(key) {
    try {
      var cacheKey = 'widget_cache_' + key + '_' + gs.getUserID();
      var cache = gs.getProperty(cacheKey);
      
      if (cache) {
        var cacheData = JSON.parse(cache);
        var now = new GlideDateTime().getNumericValue();
        var cacheAge = now - cacheData.timestamp;
        var maxAge = (options.cache_ttl || 300) * 1000; // Default 5 minutes
        
        if (cacheAge < maxAge) {
          gs.info('Cache hit for key: ' + key);
          return cacheData;
        } else {
          clearCache(key);
        }
      }
    } catch (error) {
      gs.error('Cache retrieval error: ' + error.message);
    }
    
    return null;
  }
  
  function setCachedData(key, data) {
    try {
      var cacheKey = 'widget_cache_' + key + '_' + gs.getUserID();
      var cacheData = {
        data: data,
        timestamp: new GlideDateTime().getNumericValue()
      };
      
      gs.setProperty(cacheKey, JSON.stringify(cacheData));
      gs.info('Data cached for key: ' + key);
      
    } catch (error) {
      gs.error('Cache storage error: ' + error.message);
    }
  }
  
  function clearCache(key) {
    try {
      var cacheKey = 'widget_cache_' + key + '_' + gs.getUserID();
      gs.setProperty(cacheKey, '');
      gs.info('Cache cleared for key: ' + key);
      
    } catch (error) {
      gs.error('Cache clearing error: ' + error.message);
    }
  }
  
  function shouldCacheResults() {
    return options.enable_cache !== false && 
           data.items.length > 0 && 
           !input.force_refresh;
  }`;
  }

  private createSecurityFunctions(security: any): string {
    return `
  
  /**
   * Security validation functions
   */
  function validateUserAccess() {
    try {
      // Check if user is logged in
      if (!gs.getUserID()) {
        return false;
      }
      
      // Check required roles
      var requiredRoles = options.required_roles || [];
      if (requiredRoles.length > 0) {
        var hasRole = false;
        for (var i = 0; i < requiredRoles.length; i++) {
          if (gs.hasRole(requiredRoles[i])) {
            hasRole = true;
            break;
          }
        }
        if (!hasRole) {
          return false;
        }
      }
      
      // Check table access
      if (options.table_name) {
        var testGr = new GlideRecord(options.table_name);
        if (!testGr.canRead()) {
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      gs.error('Access validation error: ' + error.message);
      return false;
    }
  }
  
  function validateInput(inputData) {
    if (!inputData) {
      return true;
    }
    
    // Sanitize string inputs
    for (var key in inputData) {
      if (typeof inputData[key] === 'string') {
        inputData[key] = sanitizeString(inputData[key]);
      }
    }
    
    // Validate specific fields
    if (inputData.sys_id && !isValidSysId(inputData.sys_id)) {
      throw new Error('Invalid sys_id format');
    }
    
    return true;
  }
  
  function sanitizeString(str) {
    if (!str) return str;
    
    // Remove potential script tags
    str = str.replace(/<script[^>]*>.*?<\\/script>/gi, '');
    
    // Remove potential SQL injection patterns
    str = str.replace(/['";\\\\]/g, '');
    
    // Limit length
    if (str.length > 255) {
      str = str.substring(0, 255);
    }
    
    return str;
  }
  
  function isValidSysId(sysId) {
    return /^[a-f0-9]{32}$/.test(sysId);
  }`;
  }

  private createErrorHandlingFunctions(): string {
    return `
  
  /**
   * Error handling functions
   */
  function handleError(error) {
    var errorMessage = error.message || 'Unknown error occurred';
    var errorCode = error.code || 'GENERAL_ERROR';
    
    // Log detailed error
    gs.error('Widget error [' + errorCode + ']: ' + errorMessage);
    gs.error('Stack trace: ' + error.stack);
    
    // Set user-friendly error message
    data.error = {
      message: getUserFriendlyErrorMessage(errorCode),
      code: errorCode,
      timestamp: new GlideDateTime().getDisplayValue()
    };
    
    data.loading = false;
    data.items = [];
  }
  
  function getUserFriendlyErrorMessage(errorCode) {
    var messages = {
      'ACCESS_DENIED': 'You do not have permission to view this data.',
      'DATA_NOT_FOUND': 'No data found matching your criteria.',
      'API_ERROR': 'Unable to retrieve external data at this time.',
      'VALIDATION_ERROR': 'Invalid input provided.',
      'GENERAL_ERROR': 'An unexpected error occurred. Please try again.'
    };
    
    return messages[errorCode] || messages['GENERAL_ERROR'];
  }
  
  function getProcessingTime() {
    // This would be calculated from start time
    return 0;
  }
  
  // Utility functions
  function transformItemData(item) {
    // Apply any data transformations
    return item;
  }
  
  function applyCustomFilters(gr, filters) {
    // Apply custom filters from input
    for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      gr.addQuery(filter.field, filter.operator, filter.value);
    }
  }
  
  function getTimeFilter(range) {
    var now = new GlideDateTime();
    switch (range) {
      case 'today':
        var today = new GlideDate();
        return today.getDisplayValue() + ' 00:00:00';
      case 'week':
        now.addWeeksLocalTime(-1);
        return now.getDisplayValue();
      case 'month':
        now.addMonthsLocalTime(-1);
        return now.getDisplayValue();
      default:
        return '';
    }
  }
  
  function mergeApiResults(apiResults) {
    // Merge API results with main data
    for (var api in apiResults) {
      if (apiResults[api] && apiResults[api].data) {
        data[api + '_data'] = apiResults[api].data;
      }
    }
  }`;
  }

  // Data processor creation methods
  private createDataFilterProcessor(requirements: BackendRequirements): string {
    return `
// Data filtering processor
function filterData(items, filters) {
  if (!filters || filters.length === 0) {
    return items;
  }
  
  return items.filter(function(item) {
    return filters.every(function(filter) {
      switch (filter.operator) {
        case 'equals':
          return item[filter.field] === filter.value;
        case 'contains':
          return item[filter.field] && item[filter.field].toString().toLowerCase().includes(filter.value.toLowerCase());
        case 'greater_than':
          return parseFloat(item[filter.field]) > parseFloat(filter.value);
        case 'less_than':
          return parseFloat(item[filter.field]) < parseFloat(filter.value);
        default:
          return true;
      }
    });
  });
}`;
  }

  private createDataAggregationProcessor(requirements: BackendRequirements): string {
    return `
// Data aggregation processor
function aggregateData(items, aggregations) {
  var result = {};
  
  aggregations.forEach(function(agg) {
    switch (agg.type) {
      case 'count':
        result[agg.name] = items.length;
        break;
      case 'sum':
        result[agg.name] = items.reduce(function(sum, item) {
          return sum + (parseFloat(item[agg.field]) || 0);
        }, 0);
        break;
      case 'average':
        var sum = items.reduce(function(sum, item) {
          return sum + (parseFloat(item[agg.field]) || 0);
        }, 0);
        result[agg.name] = items.length > 0 ? sum / items.length : 0;
        break;
      case 'group_by':
        result[agg.name] = groupBy(items, agg.field);
        break;
    }
  });
  
  return result;
}

function groupBy(items, field) {
  return items.reduce(function(groups, item) {
    var key = item[field] || 'Unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}`;
  }

  private createDataTransformationProcessor(requirements: BackendRequirements): string {
    return `
// Data transformation processor
function transformData(items, transformations) {
  return items.map(function(item) {
    var transformed = Object.assign({}, item);
    
    transformations.forEach(function(transform) {
      switch (transform.type) {
        case 'format_date':
          if (transformed[transform.field]) {
            transformed[transform.field] = formatDate(transformed[transform.field], transform.format);
          }
          break;
        case 'format_currency':
          if (transformed[transform.field]) {
            transformed[transform.field] = formatCurrency(transformed[transform.field]);
          }
          break;
        case 'concatenate':
          transformed[transform.target] = transform.fields.map(function(field) {
            return transformed[field] || '';
          }).join(transform.separator || ' ');
          break;
        case 'calculate':
          transformed[transform.target] = calculateValue(transformed, transform.formula);
          break;
      }
    });
    
    return transformed;
  });
}

function formatDate(dateValue, format) {
  var date = new GlideDateTime(dateValue);
  return date.getDisplayValue();
}

function formatCurrency(value) {
  return '$' + parseFloat(value).toFixed(2);
}

function calculateValue(item, formula) {
  // Simple calculation engine
  try {
    return eval(formula.replace(/\{(\w+)\}/g, function(match, field) {
      return parseFloat(item[field]) || 0;
    }));
  } catch (e) {
    return 0;
  }
}`;
  }

  private createDataValidationProcessor(requirements: BackendRequirements): string {
    return `
// Data validation processor
function validateData(items, validationRules) {
  return items.map(function(item) {
    var validated = Object.assign({}, item);
    validated._validationErrors = [];
    
    validationRules.forEach(function(rule) {
      var value = validated[rule.field];
      var isValid = true;
      
      switch (rule.type) {
        case 'required':
          isValid = value !== null && value !== undefined && value !== '';
          break;
        case 'email':
          isValid = !value || /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
          break;
        case 'phone':
          isValid = !value || /^[\\d\\s\\-\\(\\)\\+]+$/.test(value);
          break;
        case 'range':
          var numValue = parseFloat(value);
          isValid = !isNaN(numValue) && numValue >= rule.min && numValue <= rule.max;
          break;
      }
      
      if (!isValid) {
        validated._validationErrors.push({
          field: rule.field,
          message: rule.message || 'Validation failed for ' + rule.field
        });
      }
    });
    
    validated._isValid = validated._validationErrors.length === 0;
    return validated;
  });
}`;
  }

  // API handler creation methods
  private createRestApiHandler(requirements: BackendRequirements): string {
    return `
// REST API handler
var RestApiHandler = {
  call: function(endpoint, method, data) {
    try {
      var request = new sn_ws.RESTMessageV2();
      request.setEndpoint(endpoint);
      request.setHttpMethod(method || 'GET');
      
      if (data && (method === 'POST' || method === 'PUT')) {
        request.setRequestBody(JSON.stringify(data));
        request.setRequestHeader('Content-Type', 'application/json');
      }
      
      var response = request.execute();
      var responseBody = response.getBody();
      var statusCode = response.getStatusCode();
      
      return {
        success: statusCode >= 200 && statusCode < 300,
        data: statusCode < 400 ? JSON.parse(responseBody) : null,
        error: statusCode >= 400 ? responseBody : null,
        statusCode: statusCode
      };
      
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
        statusCode: 0
      };
    }
  }
};`;
  }

  private createExternalApiHandler(requirements: BackendRequirements): string {
    return `
// External API handler
var ExternalApiHandler = {
  authenticate: function(config) {
    // Handle different authentication methods
    switch (config.auth_type) {
      case 'bearer':
        return 'Bearer ' + config.token;
      case 'api_key':
        return 'ApiKey ' + config.api_key;
      case 'basic':
        return 'Basic ' + GlideStringUtil.base64Encode(config.username + ':' + config.password);
      default:
        return null;
    }
  },
  
  call: function(config, endpoint, params) {
    try {
      var request = new sn_ws.RESTMessageV2();
      request.setEndpoint(config.base_url + endpoint);
      request.setHttpMethod('GET');
      
      // Add authentication
      var authHeader = this.authenticate(config);
      if (authHeader) {
        request.setRequestHeader('Authorization', authHeader);
      }
      
      // Add parameters
      if (params) {
        for (var key in params) {
          request.setQueryParameter(key, params[key]);
        }
      }
      
      var response = request.execute();
      return {
        success: response.getStatusCode() === 200,
        data: JSON.parse(response.getBody()),
        statusCode: response.getStatusCode()
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};`;
  }

  private createServiceNowApiHandler(requirements: BackendRequirements): string {
    return `
// ServiceNow API handler
var ServiceNowApiHandler = {
  getTableData: function(table, query, fields) {
    try {
      var gr = new GlideRecord(table);
      
      if (query) {
        gr.addEncodedQuery(query);
      }
      
      gr.query();
      
      var results = [];
      while (gr.next()) {
        var item = {};
        
        if (fields && fields.length > 0) {
          fields.forEach(function(field) {
            item[field] = gr.getDisplayValue(field);
          });
        } else {
          // Get all fields
          var elements = gr.getElements();
          for (var i = 0; i < elements.size(); i++) {
            var element = elements.get(i);
            item[element.getName()] = gr.getDisplayValue(element.getName());
          }
        }
        
        item.sys_id = gr.getUniqueValue();
        results.push(item);
      }
      
      return {
        success: true,
        data: results,
        total: results.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  updateRecord: function(table, sysId, data) {
    try {
      var gr = new GlideRecord(table);
      if (gr.get(sysId)) {
        for (var field in data) {
          gr.setValue(field, data[field]);
        }
        gr.update();
        
        return {
          success: true,
          sys_id: sysId
        };
      } else {
        return {
          success: false,
          error: 'Record not found'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};`;
  }

  // Optimization creation methods
  private createQueryOptimizations(requirements: BackendRequirements): string {
    return `
// Query optimization strategies
var QueryOptimizer = {
  optimizeQuery: function(gr, options) {
    // Use indexed fields for filtering when possible
    if (options.indexed_fields) {
      options.indexed_fields.forEach(function(field) {
        if (options.filters && options.filters[field]) {
          gr.addQuery(field, options.filters[field]);
        }
      });
    }
    
    // Limit results
    if (options.limit) {
      gr.setLimit(options.limit);
    }
    
    // Only select needed fields
    if (options.fields) {
      gr.setDisplayValue(true);
      // Note: GlideRecord doesn't have field selection, but we can optimize by only accessing needed fields
    }
    
    return gr;
  },
  
  batchProcess: function(table, query, batchSize, processor) {
    var offset = 0;
    var totalProcessed = 0;
    
    do {
      var gr = new GlideRecord(table);
      gr.addEncodedQuery(query);
      gr.setLimit(batchSize);
      gr.query();
      
      var batchCount = 0;
      while (gr.next()) {
        processor(gr);
        batchCount++;
        totalProcessed++;
      }
      
      offset += batchSize;
    } while (batchCount === batchSize);
    
    return totalProcessed;
  }
};`;
  }

  private createCachingStrategy(requirements: BackendRequirements): string {
    return `
// Caching strategy
var CacheManager = {
  generateKey: function(prefix, params) {
    var key = prefix + '_' + gs.getUserID();
    if (params) {
      key += '_' + JSON.stringify(params).replace(/[^a-zA-Z0-9]/g, '');
    }
    return key;
  },
  
  get: function(key, maxAge) {
    try {
      var cached = gs.getProperty('cache_' + key);
      if (cached) {
        var data = JSON.parse(cached);
        var age = new GlideDateTime().getNumericValue() - data.timestamp;
        
        if (age < (maxAge || 300000)) { // Default 5 minutes
          return data.value;
        } else {
          this.clear(key);
        }
      }
    } catch (error) {
      gs.error('Cache get error: ' + error.message);
    }
    return null;
  },
  
  set: function(key, value, ttl) {
    try {
      var data = {
        value: value,
        timestamp: new GlideDateTime().getNumericValue(),
        ttl: ttl || 300000
      };
      
      gs.setProperty('cache_' + key, JSON.stringify(data));
    } catch (error) {
      gs.error('Cache set error: ' + error.message);
    }
  },
  
  clear: function(key) {
    gs.setProperty('cache_' + key, '');
  }
};`;
  }

  private createLazyLoadingStrategy(requirements: BackendRequirements): string {
    return `
// Lazy loading strategy
var LazyLoader = {
  loadInChunks: function(table, query, chunkSize, callback) {
    var offset = 0;
    var hasMore = true;
    
    return {
      next: function() {
        if (!hasMore) return null;
        
        var gr = new GlideRecord(table);
        gr.addEncodedQuery(query);
        gr.setLimit(chunkSize);
        // Note: ServiceNow doesn't have OFFSET, so we use different approach
        gr.query();
        
        var items = [];
        var count = 0;
        
        while (gr.next() && count < chunkSize) {
          items.push(callback ? callback(gr) : gr);
          count++;
        }
        
        hasMore = items.length === chunkSize;
        offset += chunkSize;
        
        return {
          items: items,
          hasMore: hasMore,
          offset: offset
        };
      }
    };
  }
};`;
  }

  // Security validation creation methods
  private createInputValidation(requirements: BackendRequirements): string {
    return `
// Input validation
var InputValidator = {
  validate: function(input, rules) {
    var errors = [];
    
    for (var field in rules) {
      var rule = rules[field];
      var value = input[field];
      
      if (rule.required && (!value || value === '')) {
        errors.push(field + ' is required');
        continue;
      }
      
      if (value && rule.type) {
        switch (rule.type) {
          case 'email':
            if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
              errors.push(field + ' must be a valid email');
            }
            break;
          case 'sys_id':
            if (!/^[a-f0-9]{32}$/.test(value)) {
              errors.push(field + ' must be a valid sys_id');
            }
            break;
          case 'number':
            if (isNaN(parseFloat(value))) {
              errors.push(field + ' must be a number');
            }
            break;
        }
      }
      
      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors.push(field + ' must not exceed ' + rule.maxLength + ' characters');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },
  
  sanitize: function(input) {
    var sanitized = {};
    
    for (var key in input) {
      var value = input[key];
      
      if (typeof value === 'string') {
        // Remove potential XSS
        value = value.replace(/<script[^>]*>.*?<\\/script>/gi, '');
        value = value.replace(/javascript:/gi, '');
        
        // Remove potential SQL injection
        value = value.replace(/['";\\\\]/g, '');
        
        // Trim whitespace
        value = value.trim();
      }
      
      sanitized[key] = value;
    }
    
    return sanitized;
  }
};`;
  }

  private createAccessControl(requirements: BackendRequirements): string {
    return `
// Access control
var AccessController = {
  checkTableAccess: function(table, operation) {
    try {
      var gr = new GlideRecord(table);
      
      switch (operation) {
        case 'read':
          return gr.canRead();
        case 'write':
          return gr.canWrite();
        case 'create':
          return gr.canCreate();
        case 'delete':
          return gr.canDelete();
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  },
  
  checkRecordAccess: function(table, sysId, operation) {
    try {
      var gr = new GlideRecord(table);
      if (gr.get(sysId)) {
        switch (operation) {
          case 'read':
            return gr.canRead();
          case 'write':
            return gr.canWrite();
          case 'delete':
            return gr.canDelete();
          default:
            return false;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  },
  
  checkRole: function(role) {
    return gs.hasRole(role);
  },
  
  checkRoleOr: function(roles) {
    return roles.some(function(role) {
      return gs.hasRole(role);
    });
  }
};`;
  }

  private createDataSanitization(requirements: BackendRequirements): string {
    return `
// Data sanitization
var DataSanitizer = {
  sanitizeHtml: function(html) {
    if (!html) return html;
    
    // Remove script tags
    html = html.replace(/<script[^>]*>.*?<\\/script>/gi, '');
    
    // Remove event handlers
    html = html.replace(/on\\w+\\s*=\\s*"[^"]*"/gi, '');
    html = html.replace(/on\\w+\\s*=\\s*'[^']*'/gi, '');
    
    // Remove javascript: URLs
    html = html.replace(/href\\s*=\\s*["']javascript:[^"']*["']/gi, '');
    
    return html;
  },
  
  sanitizeJson: function(json) {
    try {
      var obj = typeof json === 'string' ? JSON.parse(json) : json;
      return this.sanitizeObject(obj);
    } catch (error) {
      return {};
    }
  },
  
  sanitizeObject: function(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    var sanitized = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var value = obj[key];
        
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value);
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  },
  
  sanitizeString: function(str) {
    if (!str) return str;
    
    // Remove control characters
    str = str.replace(/[\\x00-\\x1F\\x7F]/g, '');
    
    // Limit length
    if (str.length > 1000) {
      str = str.substring(0, 1000);
    }
    
    return str;
  }
};`;
  }

  // Analysis methods
  private analyzeDataProcessing(requirements: BackendRequirements): any {
    return {
      complexity: requirements.serverScript.dataProcessing.length > 3 ? 'high' : 'medium',
      operations: requirements.serverScript.dataProcessing,
      optimizationNeeded: requirements.serverScript.dataProcessing.includes('aggregation')
    };
  }

  private analyzeApiIntegrations(requirements: BackendRequirements): any {
    return {
      count: requirements.serverScript.apiIntegrations.length,
      complexity: requirements.serverScript.apiIntegrations.length > 2 ? 'high' : 'low',
      types: requirements.serverScript.apiIntegrations
    };
  }

  private analyzePerformanceNeeds(requirements: BackendRequirements): any {
    return {
      caching: requirements.performance.caching,
      optimization: requirements.performance.optimization,
      priority: requirements.performance.caching ? 'high' : 'medium'
    };
  }

  private analyzeSecurityNeeds(requirements: BackendRequirements): any {
    return {
      validation: requirements.security.validation,
      authorization: requirements.security.authorization,
      priority: 'high'
    };
  }

  private analyzeErrorHandling(requirements: BackendRequirements): any {
    return {
      strategy: 'comprehensive',
      logging: true,
      userFriendly: true
    };
  }

  // Validation methods
  private async validateImplementation(implementation: any): Promise<any> {
    return {
      errorHandling: this.validateErrorHandling(implementation),
      security: this.validateSecurity(implementation),
      maintainability: this.validateMaintainability(implementation)
    };
  }

  private validateErrorHandling(implementation: any): number {
    const hasTryCatch = implementation.serverScript.includes('try') && implementation.serverScript.includes('catch');
    const hasErrorLogging = implementation.serverScript.includes('gs.error');
    const hasUserFriendlyErrors = implementation.serverScript.includes('getUserFriendlyErrorMessage');
    
    let score = 0.3;
    if (hasTryCatch) score += 0.3;
    if (hasErrorLogging) score += 0.2;
    if (hasUserFriendlyErrors) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private validateSecurity(implementation: any): number {
    const hasInputValidation = implementation.serverScript.includes('validateInput');
    const hasAccessControl = implementation.serverScript.includes('validateUserAccess');
    const hasSanitization = implementation.serverScript.includes('sanitize');
    
    let score = 0.2;
    if (hasInputValidation) score += 0.3;
    if (hasAccessControl) score += 0.3;
    if (hasSanitization) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private validateMaintainability(implementation: any): number {
    const hasComments = implementation.serverScript.includes('/**');
    const hasFunctions = (implementation.serverScript.match(/function /g) || []).length > 5;
    const hasErrorHandling = implementation.serverScript.includes('handleError');
    
    let score = 0.4;
    if (hasComments) score += 0.2;
    if (hasFunctions) score += 0.2;
    if (hasErrorHandling) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  // Assessment methods
  private assessScriptEfficiency(script: string): number {
    const queries = (script.match(/new GlideRecord/g) || []).length;
    const loops = (script.match(/while|for/g) || []).length;
    
    // Lower is better for efficiency
    return Math.max(0.3, 1.0 - (queries * 0.1) - (loops * 0.05));
  }

  private assessQueryOptimization(script: string): number {
    const hasLimits = script.includes('setLimit');
    const hasIndexedQueries = script.includes('addQuery');
    const hasCaching = script.includes('cache');
    
    let score = 0.3;
    if (hasLimits) score += 0.25;
    if (hasIndexedQueries) score += 0.25;
    if (hasCaching) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private assessApiPerformance(handlers: any): number {
    // Assess based on error handling and caching in API handlers
    const handlerString = JSON.stringify(handlers);
    const hasErrorHandling = handlerString.includes('error');
    const hasCaching = handlerString.includes('cache');
    const hasTimeout = handlerString.includes('timeout');
    
    let score = 0.4;
    if (hasErrorHandling) score += 0.25;
    if (hasCaching) score += 0.25;
    if (hasTimeout) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  // Utility methods
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}