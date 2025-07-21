import { BaseSpecialist, SpecialistOptions } from './base-specialist.js';

// Individual specialist classes for standalone execution
// These are simplified, focused versions of the team specialists

export class IndividualFrontendSpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'Frontend Developer',
      'Frontend Developer',
      ['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'UI Components'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Working on frontend task: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    const requirements = this.analyzeFrontendNeeds(task);
    
    const deliverables = {
      template: await this.createQuickTemplate(requirements),
      styles: await this.createQuickStyles(requirements),
      clientScript: await this.createQuickClientScript(requirements)
    };

    return {
      ...analysis,
      specialist: 'Frontend Developer',
      requirements,
      deliverables,
      quickImplementation: true
    };
  }

  private analyzeFrontendNeeds(task: string): any {
    const lowerTask = task.toLowerCase();
    
    return {
      type: lowerTask.includes('form') ? 'form' : 
            lowerTask.includes('list') ? 'list' : 
            lowerTask.includes('dashboard') ? 'dashboard' : 'generic',
      responsive: lowerTask.includes('mobile') || lowerTask.includes('responsive'),
      interactive: lowerTask.includes('click') || lowerTask.includes('interactive'),
      styling: lowerTask.includes('style') || lowerTask.includes('css')
    };
  }

  private async createQuickTemplate(requirements: any): Promise<string> {
    switch (requirements.type) {
      case 'form':
        return this.createFormTemplate();
      case 'list':
        return this.createListTemplate();
      case 'dashboard':
        return this.createDashboardTemplate();
      default:
        return this.createGenericTemplate();
    }
  }

  private createFormTemplate(): string {
    return `
<div class="widget-form" role="form">
  <h3>{{data.title || 'Form'}}</h3>
  <form ng-submit="c.submitForm()">
    <div ng-repeat="field in data.fields" class="form-group">
      <label>{{field.label}}</label>
      <input type="{{field.type || 'text'}}" 
             ng-model="c.formData[field.name]" 
             class="form-control" 
             ng-required="field.required">
    </div>
    <button type="submit" class="btn btn-primary">Submit</button>
  </form>
</div>
    `.trim();
  }

  private createListTemplate(): string {
    return `
<div class="widget-list">
  <h3>{{data.title || 'List'}}</h3>
  <div class="list-controls" ng-if="data.searchable">
    <input type="search" ng-model="c.searchTerm" placeholder="Search...">
  </div>
  <div class="list-container">
    <div ng-repeat="item in c.filteredItems" class="list-item" ng-click="c.selectItem(item)">
      <h4>{{item.title || item.name}}</h4>
      <p>{{item.description || item.short_description}}</p>
    </div>
  </div>
</div>
    `.trim();
  }

  private createDashboardTemplate(): string {
    return `
<div class="widget-dashboard">
  <h3>{{data.title || 'Dashboard'}}</h3>
  <div class="dashboard-grid">
    <div ng-repeat="widget in data.widgets" class="dashboard-widget">
      <h4>{{widget.title}}</h4>
      <div class="widget-content">{{widget.value}}</div>
    </div>
  </div>
</div>
    `.trim();
  }

  private createGenericTemplate(): string {
    return `
<div class="widget-container">
  <h3>{{data.title || 'Widget'}}</h3>
  <div class="widget-content">
    <p ng-if="data.message">{{data.message}}</p>
    <div ng-repeat="item in data.items" class="widget-item">
      {{item.name || item.title || item}}
    </div>
  </div>
</div>
    `.trim();
  }

  private async createQuickStyles(requirements: any): Promise<string> {
    const baseStyles = `
.widget-container {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.widget-container h3 {
  margin-top: 0;
  color: #333;
}
    `;

    const responsiveStyles = requirements.responsive ? `
@media (max-width: 768px) {
  .widget-container {
    padding: 0.5rem;
    margin: 0.5rem;
  }
}
    ` : '';

    return baseStyles + responsiveStyles;
  }

  private async createQuickClientScript(requirements: any): Promise<string> {
    return `
function($scope) {
  var c = this;
  
  c.init = function() {
    // Initialize component
  };
  
  ${requirements.interactive ? `
  c.selectItem = function(item) {
    c.selectedItem = item;
  };
  ` : ''}
  
  ${requirements.type === 'list' ? `
  c.filteredItems = c.data.items || [];
  
  $scope.$watch('c.searchTerm', function(newVal) {
    if (!newVal) {
      c.filteredItems = c.data.items || [];
      return;
    }
    c.filteredItems = (c.data.items || []).filter(function(item) {
      return JSON.stringify(item).toLowerCase().includes(newVal.toLowerCase());
    });
  });
  ` : ''}
  
  c.init();
}
    `.trim();
  }
}

export class IndividualBackendSpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'Backend Developer',
      'Backend Developer',
      ['Server Scripts', 'GlideRecord', 'Data Processing', 'API Integration'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Working on backend task: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    const requirements = this.analyzeBackendNeeds(task);
    
    const deliverables = {
      serverScript: await this.createQuickServerScript(requirements),
      dataAccess: await this.createDataAccessLayer(requirements),
      apiIntegration: requirements.needsAPI ? await this.createAPIIntegration(requirements) : null
    };

    return {
      ...analysis,
      specialist: 'Backend Developer',
      requirements,
      deliverables,
      quickImplementation: true
    };
  }

  private analyzeBackendNeeds(task: string): any {
    const lowerTask = task.toLowerCase();
    
    return {
      dataType: lowerTask.includes('incident') ? 'incident' :
                lowerTask.includes('request') ? 'request' :
                lowerTask.includes('user') ? 'user' : 'generic',
      needsAPI: lowerTask.includes('api') || lowerTask.includes('integration'),
      needsProcessing: lowerTask.includes('process') || lowerTask.includes('calculate'),
      needsCaching: lowerTask.includes('cache') || lowerTask.includes('performance')
    };
  }

  private async createQuickServerScript(requirements: any): Promise<string> {
    return `
(function() {
  'use strict';
  
  var data = {};
  
  try {
    // Quick data retrieval
    var gr = new GlideRecord('${this.getTableName(requirements.dataType)}');
    gr.orderByDesc('sys_created_on');
    gr.setLimit(10);
    gr.query();
    
    data.items = [];
    while (gr.next()) {
      data.items.push({
        sys_id: gr.getUniqueValue(),
        number: gr.getDisplayValue('number'),
        short_description: gr.getDisplayValue('short_description'),
        state: gr.getDisplayValue('state')
      });
    }
    
    data.count = data.items.length;
    data.title = 'Recent ${requirements.dataType}';
    
    ${requirements.needsProcessing ? this.addProcessingLogic() : ''}
    
  } catch (error) {
    gs.error('Quick backend error: ' + error.message);
    data.error = 'Error loading data';
  }
  
})();
    `.trim();
  }

  private getTableName(dataType: string): string {
    switch (dataType) {
      case 'incident': return 'incident';
      case 'request': return 'sc_request';
      case 'user': return 'sys_user';
      default: return 'task';
    }
  }

  private addProcessingLogic(): string {
    return `
    // Additional processing
    data.summary = {
      total: data.count,
      recent: data.items.filter(function(item) {
        return item.state !== 'Closed';
      }).length
    };
    `;
  }

  private async createDataAccessLayer(requirements: any): any {
    return {
      table: this.getTableName(requirements.dataType),
      fields: ['number', 'short_description', 'state', 'sys_created_on'],
      defaultQuery: 'active=true',
      orderBy: 'sys_created_on DESC'
    };
  }

  private async createAPIIntegration(requirements: any): Promise<string> {
    return `
// Quick API integration example
var restMessage = new sn_ws.RESTMessageV2();
restMessage.setHttpMethod('GET');
restMessage.setEndpoint('https://api.example.com/data');
restMessage.setRequestHeader('Accept', 'application/json');

var response = restMessage.execute();
if (response.getStatusCode() == 200) {
  var responseBody = response.getBody();
  var jsonData = JSON.parse(responseBody);
  // Process API data
}
    `.trim();
  }
}

export class IndividualSecuritySpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'Security Specialist',
      'Security Specialist',
      ['Access Control', 'Security Validation', 'Compliance Check', 'Vulnerability Assessment'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Analyzing security for: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    const securityAssessment = await this.performQuickSecurityAssessment(task);
    
    return {
      ...analysis,
      specialist: 'Security Specialist',
      securityAssessment,
      recommendations: this.generateSecurityRecommendations(securityAssessment),
      quickImplementation: true
    };
  }

  private async performQuickSecurityAssessment(task: string): Promise<any> {
    const lowerTask = task.toLowerCase();
    
    return {
      riskLevel: this.assessRiskLevel(task),
      vulnerabilities: this.identifyQuickVulnerabilities(task),
      complianceChecks: this.performComplianceChecks(task),
      accessControlNeeds: this.assessAccessControlNeeds(task)
    };
  }

  private assessRiskLevel(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('admin') || lowerTask.includes('system') || lowerTask.includes('global')) {
      return 'high';
    } else if (lowerTask.includes('user') || lowerTask.includes('data') || lowerTask.includes('api')) {
      return 'medium';
    }
    
    return 'low';
  }

  private identifyQuickVulnerabilities(task: string): string[] {
    const vulnerabilities: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('input') || lowerTask.includes('form')) {
      vulnerabilities.push('input_validation_needed');
    }
    
    if (lowerTask.includes('api') || lowerTask.includes('integration')) {
      vulnerabilities.push('authentication_required');
    }
    
    if (lowerTask.includes('script') || lowerTask.includes('code')) {
      vulnerabilities.push('code_injection_risk');
    }
    
    return vulnerabilities;
  }

  private performComplianceChecks(task: string): any {
    const lowerTask = task.toLowerCase();
    
    return {
      gdpr: lowerTask.includes('user') || lowerTask.includes('personal'),
      sox: lowerTask.includes('financial') || lowerTask.includes('audit'),
      hipaa: lowerTask.includes('health') || lowerTask.includes('medical'),
      iso27001: lowerTask.includes('security') || lowerTask.includes('information')
    };
  }

  private assessAccessControlNeeds(task: string): any {
    const lowerTask = task.toLowerCase();
    
    return {
      rolesNeeded: lowerTask.includes('admin') ? ['admin'] : ['user'],
      permissionLevel: lowerTask.includes('create') || lowerTask.includes('modify') ? 'write' : 'read',
      restrictionLevel: lowerTask.includes('sensitive') ? 'high' : 'standard'
    };
  }

  private generateSecurityRecommendations(assessment: any): string[] {
    const recommendations: string[] = [];
    
    if (assessment.riskLevel === 'high') {
      recommendations.push('Implement comprehensive access controls');
      recommendations.push('Require admin approval for deployment');
    }
    
    if (assessment.vulnerabilities.includes('input_validation_needed')) {
      recommendations.push('Add input validation and sanitization');
    }
    
    if (assessment.vulnerabilities.includes('authentication_required')) {
      recommendations.push('Implement strong authentication mechanisms');
    }
    
    if (assessment.complianceChecks.gdpr) {
      recommendations.push('Ensure GDPR compliance for data handling');
    }
    
    return recommendations;
  }
}

export class IndividualDataSpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'Data Specialist',
      'Data Specialist',
      ['Data Analysis', 'Query Optimization', 'Data Transformation', 'Data Validation'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Analyzing data requirements for: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    const dataAnalysis = await this.performQuickDataAnalysis(task);
    
    return {
      ...analysis,
      specialist: 'Data Specialist',
      dataAnalysis,
      optimizations: this.generateDataOptimizations(dataAnalysis),
      quickImplementation: true
    };
  }

  private async performQuickDataAnalysis(task: string): Promise<any> {
    const lowerTask = task.toLowerCase();
    
    return {
      dataTypes: this.identifyDataTypes(task),
      queryPatterns: this.identifyQueryPatterns(task),
      transformationNeeds: this.identifyTransformationNeeds(task),
      validationRequirements: this.identifyValidationRequirements(task)
    };
  }

  private identifyDataTypes(task: string): string[] {
    const types: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('string') || lowerTask.includes('text')) types.push('string');
    if (lowerTask.includes('number') || lowerTask.includes('integer')) types.push('number');
    if (lowerTask.includes('date') || lowerTask.includes('time')) types.push('datetime');
    if (lowerTask.includes('boolean') || lowerTask.includes('true') || lowerTask.includes('false')) types.push('boolean');
    if (lowerTask.includes('reference') || lowerTask.includes('link')) types.push('reference');
    
    return types.length > 0 ? types : ['string', 'number', 'datetime'];
  }

  private identifyQueryPatterns(task: string): string[] {
    const patterns: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('search') || lowerTask.includes('find')) patterns.push('search_queries');
    if (lowerTask.includes('filter') || lowerTask.includes('where')) patterns.push('filtered_queries');
    if (lowerTask.includes('sort') || lowerTask.includes('order')) patterns.push('sorted_queries');
    if (lowerTask.includes('group') || lowerTask.includes('aggregate')) patterns.push('aggregate_queries');
    if (lowerTask.includes('join') || lowerTask.includes('relate')) patterns.push('join_queries');
    
    return patterns.length > 0 ? patterns : ['simple_queries'];
  }

  private identifyTransformationNeeds(task: string): string[] {
    const transformations: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('format') || lowerTask.includes('convert')) transformations.push('format_transformation');
    if (lowerTask.includes('calculate') || lowerTask.includes('compute')) transformations.push('calculation_transformation');
    if (lowerTask.includes('combine') || lowerTask.includes('merge')) transformations.push('merge_transformation');
    if (lowerTask.includes('split') || lowerTask.includes('separate')) transformations.push('split_transformation');
    
    return transformations;
  }

  private identifyValidationRequirements(task: string): string[] {
    const validations: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('required') || lowerTask.includes('mandatory')) validations.push('required_validation');
    if (lowerTask.includes('format') || lowerTask.includes('pattern')) validations.push('format_validation');
    if (lowerTask.includes('range') || lowerTask.includes('limit')) validations.push('range_validation');
    if (lowerTask.includes('unique') || lowerTask.includes('duplicate')) validations.push('uniqueness_validation');
    
    return validations;
  }

  private generateDataOptimizations(analysis: any): any {
    return {
      indexing: {
        recommended: analysis.queryPatterns.includes('search_queries') || 
                    analysis.queryPatterns.includes('filtered_queries'),
        fields: this.suggestIndexFields(analysis)
      },
      caching: {
        recommended: analysis.queryPatterns.includes('aggregate_queries'),
        strategy: 'query_result_caching'
      },
      normalization: {
        recommended: analysis.transformationNeeds.includes('split_transformation'),
        level: 'third_normal_form'
      }
    };
  }

  private suggestIndexFields(analysis: any): string[] {
    const fields: string[] = [];
    
    if (analysis.queryPatterns.includes('search_queries')) {
      fields.push('name', 'short_description');
    }
    
    if (analysis.queryPatterns.includes('filtered_queries')) {
      fields.push('state', 'category', 'assigned_to');
    }
    
    if (analysis.queryPatterns.includes('sorted_queries')) {
      fields.push('sys_created_on', 'priority');
    }
    
    return fields;
  }
}

export class IndividualIntegrationSpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'Integration Specialist',
      'Integration Specialist',
      ['API Integration', 'Data Sync', 'Middleware', 'External Systems'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Working on integration task: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    const integrationAnalysis = await this.performQuickIntegrationAnalysis(task);
    
    return {
      ...analysis,
      specialist: 'Integration Specialist',
      integrationAnalysis,
      implementation: this.generateQuickImplementation(integrationAnalysis),
      quickImplementation: true
    };
  }

  private async performQuickIntegrationAnalysis(task: string): Promise<any> {
    const lowerTask = task.toLowerCase();
    
    return {
      integrationType: this.identifyIntegrationType(task),
      protocol: this.identifyProtocol(task),
      authMethod: this.identifyAuthMethod(task),
      dataFormat: this.identifyDataFormat(task),
      direction: this.identifyDirection(task)
    };
  }

  private identifyIntegrationType(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('real') && lowerTask.includes('time')) return 'real_time';
    if (lowerTask.includes('batch') || lowerTask.includes('bulk')) return 'batch';
    if (lowerTask.includes('event') || lowerTask.includes('trigger')) return 'event_driven';
    
    return 'on_demand';
  }

  private identifyProtocol(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('rest') || lowerTask.includes('http')) return 'REST';
    if (lowerTask.includes('soap')) return 'SOAP';
    if (lowerTask.includes('ftp') || lowerTask.includes('file')) return 'FTP';
    if (lowerTask.includes('email') || lowerTask.includes('smtp')) return 'EMAIL';
    
    return 'REST';
  }

  private identifyAuthMethod(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('oauth')) return 'OAuth2';
    if (lowerTask.includes('token')) return 'Bearer Token';
    if (lowerTask.includes('basic')) return 'Basic Auth';
    if (lowerTask.includes('key')) return 'API Key';
    
    return 'Basic Auth';
  }

  private identifyDataFormat(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('json')) return 'JSON';
    if (lowerTask.includes('xml')) return 'XML';
    if (lowerTask.includes('csv')) return 'CSV';
    
    return 'JSON';
  }

  private identifyDirection(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('import') || lowerTask.includes('receive')) return 'inbound';
    if (lowerTask.includes('export') || lowerTask.includes('send')) return 'outbound';
    if (lowerTask.includes('sync') || lowerTask.includes('bidirectional')) return 'bidirectional';
    
    return 'bidirectional';
  }

  private generateQuickImplementation(analysis: any): any {
    return {
      restMessage: this.generateRESTMessageConfig(analysis),
      transformation: this.generateTransformationLogic(analysis),
      errorHandling: this.generateErrorHandling(analysis),
      scheduling: analysis.integrationType === 'batch' ? this.generateScheduling() : null
    };
  }

  private generateRESTMessageConfig(analysis: any): any {
    return {
      name: 'Quick Integration Message',
      endpoint: 'https://api.example.com/endpoint',
      authentication: analysis.authMethod,
      headers: {
        'Content-Type': `application/${analysis.dataFormat.toLowerCase()}`,
        'Accept': `application/${analysis.dataFormat.toLowerCase()}`
      },
      methods: {
        GET: analysis.direction === 'inbound' || analysis.direction === 'bidirectional',
        POST: analysis.direction === 'outbound' || analysis.direction === 'bidirectional'
      }
    };
  }

  private generateTransformationLogic(analysis: any): string {
    return `
// Quick data transformation
function transformData(inputData) {
  var outputData = {};
  
  if (typeof inputData === 'string') {
    inputData = JSON.parse(inputData);
  }
  
  // Map common fields
  outputData.number = inputData.id || inputData.number;
  outputData.short_description = inputData.title || inputData.description;
  outputData.state = inputData.status || inputData.state;
  
  return outputData;
}
    `.trim();
  }

  private generateErrorHandling(analysis: any): any {
    return {
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential'
      },
      errorNotification: true,
      fallbackStrategy: 'log_and_continue',
      monitoring: true
    };
  }

  private generateScheduling(): any {
    return {
      frequency: 'hourly',
      executionWindow: 'business_hours',
      batchSize: 100,
      parallelProcessing: false
    };
  }
}

// Export all individual specialists
export const IndividualSpecialists = {
  Frontend: IndividualFrontendSpecialist,
  Backend: IndividualBackendSpecialist,
  Security: IndividualSecuritySpecialist,
  Data: IndividualDataSpecialist,
  Integration: IndividualIntegrationSpecialist
};