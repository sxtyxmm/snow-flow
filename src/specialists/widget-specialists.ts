import { BaseSpecialist, SpecialistOptions } from './base-specialist.js';

export class FrontendSpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'Frontend Developer',
      'Frontend Developer', 
      ['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'Accessibility', 'UI Components'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Analyzing frontend requirements for: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    
    // Frontend-specific analysis
    const frontendRequirements = {
      templateStructure: this.analyzeTemplateNeeds(task),
      styleRequirements: this.analyzeStyleNeeds(task),
      interactivity: this.analyzeInteractivityNeeds(task),
      responsiveness: this.analyzeResponsivenessNeeds(task),
      accessibility: this.analyzeAccessibilityNeeds(task)
    };

    await this.logProgress('Creating HTML template structure');
    const template = await this.createTemplate(frontendRequirements);
    
    await this.logProgress('Designing CSS styles and responsive layout');
    const styles = await this.createStyles(frontendRequirements);
    
    await this.logProgress('Implementing client-side interactions');
    const clientScript = await this.createClientScript(frontendRequirements);

    return {
      ...analysis,
      specialist: 'Frontend Developer',
      deliverables: {
        template,
        styles,
        clientScript,
        requirements: frontendRequirements
      }
    };
  }

  private analyzeTemplateNeeds(task: string): any {
    const needs = {
      layout: 'grid',
      components: [],
      dataBinding: false,
      forms: false,
      charts: false,
      tables: false
    };

    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('dashboard') || lowerTask.includes('chart')) {
      needs.layout = 'dashboard';
      needs.charts = true;
      needs.components.push('chart-container', 'kpi-cards', 'filter-panel');
    }
    
    if (lowerTask.includes('form') || lowerTask.includes('input')) {
      needs.forms = true;
      needs.components.push('form-fields', 'validation', 'submit-buttons');
    }
    
    if (lowerTask.includes('list') || lowerTask.includes('table')) {
      needs.tables = true;
      needs.components.push('data-table', 'pagination', 'search');
    }

    return needs;
  }

  private analyzeStyleNeeds(task: string): any {
    const needs = {
      theme: 'modern',
      colorScheme: 'primary',
      spacing: 'standard',
      typography: 'readable',
      animations: false,
      responsive: true
    };

    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('mobile') || lowerTask.includes('responsive')) {
      needs.responsive = true;
      needs.spacing = 'compact';
    }
    
    if (lowerTask.includes('dashboard') || lowerTask.includes('executive')) {
      needs.theme = 'executive';
      needs.animations = true;
    }

    return needs;
  }

  private analyzeInteractivityNeeds(task: string): any {
    const needs = {
      events: [],
      filters: false,
      sorting: false,
      pagination: false,
      realtime: false
    };

    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('filter') || lowerTask.includes('search')) {
      needs.filters = true;
      needs.events.push('filter-change', 'search-input');
    }
    
    if (lowerTask.includes('sort') || lowerTask.includes('order')) {
      needs.sorting = true;
      needs.events.push('sort-column');
    }
    
    if (lowerTask.includes('realtime') || lowerTask.includes('live')) {
      needs.realtime = true;
      needs.events.push('data-refresh', 'websocket-update');
    }

    return needs;
  }

  private analyzeResponsivenessNeeds(task: string): any {
    return {
      breakpoints: ['mobile', 'tablet', 'desktop'],
      flexibleLayouts: true,
      touchOptimized: true,
      mobileFirst: true
    };
  }

  private analyzeAccessibilityNeeds(task: string): any {
    return {
      wcagLevel: 'AA',
      screenReader: true,
      keyboardNavigation: true,
      colorContrast: true,
      semanticMarkup: true
    };
  }

  private async createTemplate(requirements: any): Promise<string> {
    if (requirements.templateStructure.layout === 'dashboard') {
      return this.createDashboardTemplate(requirements);
    } else if (requirements.templateStructure.forms) {
      return this.createFormTemplate(requirements);
    } else if (requirements.templateStructure.tables) {
      return this.createTableTemplate(requirements);
    }
    
    return this.createGenericTemplate(requirements);
  }

  private createDashboardTemplate(requirements: any): string {
    return `
<div class="widget-container dashboard-layout" role="main" aria-label="Dashboard Widget">
  <div class="dashboard-header">
    <h2 class="widget-title">{{data.title || 'Dashboard'}}</h2>
    ${requirements.interactivity.filters ? '<div class="filter-panel" role="region" aria-label="Filters"></div>' : ''}
  </div>
  
  <div class="dashboard-content">
    ${requirements.templateStructure.charts ? `
    <div class="chart-container" role="img" aria-label="Data Visualization">
      <canvas id="chart-{{::data.chartId}}" width="400" height="200"></canvas>
    </div>
    ` : ''}
    
    <div class="kpi-grid" role="region" aria-label="Key Performance Indicators">
      <div ng-repeat="kpi in data.kpis" class="kpi-card" tabindex="0">
        <div class="kpi-value">{{kpi.value}}</div>
        <div class="kpi-label">{{kpi.label}}</div>
      </div>
    </div>
  </div>
  
  ${requirements.interactivity.realtime ? `
  <div class="realtime-indicator" role="status" aria-live="polite">
    <span ng-if="data.lastUpdated">Last updated: {{data.lastUpdated | date:'short'}}</span>
  </div>
  ` : ''}
</div>
    `.trim();
  }

  private createFormTemplate(requirements: any): string {
    return `
<div class="widget-container form-layout" role="main" aria-label="Form Widget">
  <form class="widget-form" role="form" ng-submit="c.submitForm()">
    <div class="form-header">
      <h2 class="widget-title">{{data.title || 'Form'}}</h2>
    </div>
    
    <div class="form-content">
      <div ng-repeat="field in data.fields" class="form-group">
        <label for="field-{{field.name}}" class="form-label">{{field.label}}</label>
        <input 
          id="field-{{field.name}}"
          type="{{field.type || 'text'}}" 
          class="form-control"
          ng-model="c.formData[field.name]"
          ng-required="field.required"
          aria-describedby="{{field.name}}-help">
        <div id="{{field.name}}-help" class="form-help" ng-if="field.help">{{field.help}}</div>
      </div>
    </div>
    
    <div class="form-actions">
      <button type="submit" class="btn btn-primary" ng-disabled="!c.isFormValid()">
        {{data.submitLabel || 'Submit'}}
      </button>
      <button type="button" class="btn btn-secondary" ng-click="c.resetForm()">
        Reset
      </button>
    </div>
  </form>
</div>
    `.trim();
  }

  private createTableTemplate(requirements: any): string {
    return `
<div class="widget-container table-layout" role="main" aria-label="Data Table Widget">
  <div class="table-header">
    <h2 class="widget-title">{{data.title || 'Data Table'}}</h2>
    ${requirements.interactivity.filters ? `
    <div class="table-controls">
      <input type="search" 
             class="search-input" 
             placeholder="Search..." 
             ng-model="c.searchTerm"
             aria-label="Search table data">
    </div>
    ` : ''}
  </div>
  
  <div class="table-container" role="region" aria-label="Data Table">
    <table class="data-table" role="table">
      <thead>
        <tr role="row">
          <th ng-repeat="column in data.columns" 
              role="columnheader" 
              ng-click="c.sortBy(column.field)"
              class="sortable"
              tabindex="0">
            {{column.label}}
            <span class="sort-indicator" ng-if="c.sortField === column.field">
              {{c.sortDirection === 'asc' ? '↑' : '↓'}}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="row in c.filteredData" role="row" tabindex="0">
          <td ng-repeat="column in data.columns" role="gridcell">
            {{row[column.field]}}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  ${requirements.interactivity.pagination ? `
  <div class="pagination" role="navigation" aria-label="Table pagination">
    <button ng-click="c.previousPage()" ng-disabled="c.currentPage === 1">Previous</button>
    <span>Page {{c.currentPage}} of {{c.totalPages}}</span>
    <button ng-click="c.nextPage()" ng-disabled="c.currentPage === c.totalPages">Next</button>
  </div>
  ` : ''}
</div>
    `.trim();
  }

  private createGenericTemplate(requirements: any): string {
    return `
<div class="widget-container generic-layout" role="main" aria-label="Widget">
  <div class="widget-header">
    <h2 class="widget-title">{{data.title || 'Widget'}}</h2>
  </div>
  
  <div class="widget-content">
    <div ng-if="data.message" class="widget-message">{{data.message}}</div>
    <div ng-if="data.items" class="widget-items">
      <div ng-repeat="item in data.items" class="widget-item" tabindex="0">
        {{item.title || item.name || item}}
      </div>
    </div>
  </div>
</div>
    `.trim();
  }

  private async createStyles(requirements: any): Promise<string> {
    const baseStyles = `
.widget-container {
  font-family: 'Source Sans Pro', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #2c3e50;
}
    `;

    const responsiveStyles = requirements.styleRequirements.responsive ? `
@media (max-width: 768px) {
  .widget-container {
    margin: 0.5rem;
    border-radius: 4px;
  }
  
  .widget-title {
    font-size: 1.1rem;
  }
}

@media (min-width: 1200px) {
  .widget-container {
    margin: 1rem;
  }
}
    ` : '';

    const layoutSpecificStyles = this.getLayoutStyles(requirements);
    
    return `${baseStyles}\n${layoutSpecificStyles}\n${responsiveStyles}`.trim();
  }

  private getLayoutStyles(requirements: any): string {
    if (requirements.templateStructure.layout === 'dashboard') {
      return `
.dashboard-layout {
  padding: 1.5rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.chart-container {
  margin-bottom: 2rem;
  text-align: center;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.kpi-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.2s ease;
}

.kpi-card:hover, .kpi-card:focus {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.kpi-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.kpi-label {
  font-size: 0.9rem;
  opacity: 0.9;
}
      `;
    }
    
    return '';
  }

  private async createClientScript(requirements: any): Promise<string> {
    const baseScript = `
function($scope, $timeout) {
  var c = this;
  
  // Initialize component
  c.init = function() {
    c.loading = false;
    c.error = null;
    c.setupEventHandlers();
  };
  
  c.setupEventHandlers = function() {
    // Base event handling
  };
  
  // Initialize
  c.init();
}
    `;

    const interactivityScript = this.generateInteractivityScript(requirements);
    
    return `${baseScript}\n${interactivityScript}`.trim();
  }

  private generateInteractivityScript(requirements: any): string {
    let script = '';

    if (requirements.interactivity.filters) {
      script += `
  // Filter functionality
  c.searchTerm = '';
  c.filterData = function() {
    if (!c.searchTerm) {
      c.filteredData = c.data.items || [];
      return;
    }
    
    c.filteredData = (c.data.items || []).filter(function(item) {
      return JSON.stringify(item).toLowerCase().includes(c.searchTerm.toLowerCase());
    });
  };
  
  $scope.$watch('c.searchTerm', c.filterData);
      `;
    }

    if (requirements.interactivity.sorting) {
      script += `
  // Sorting functionality
  c.sortField = null;
  c.sortDirection = 'asc';
  
  c.sortBy = function(field) {
    if (c.sortField === field) {
      c.sortDirection = c.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      c.sortField = field;
      c.sortDirection = 'asc';
    }
    
    c.applySorting();
  };
  
  c.applySorting = function() {
    if (!c.sortField) return;
    
    c.filteredData.sort(function(a, b) {
      var aVal = a[c.sortField];
      var bVal = b[c.sortField];
      
      if (c.sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };
      `;
    }

    if (requirements.interactivity.realtime) {
      script += `
  // Real-time updates
  c.refreshInterval = null;
  
  c.startRealTimeUpdates = function() {
    c.refreshInterval = $timeout(function() {
      c.refreshData();
      c.startRealTimeUpdates();
    }, 30000); // 30 seconds
  };
  
  c.refreshData = function() {
    // Refresh data logic would go here
    c.data.lastUpdated = new Date();
  };
  
  $scope.$on('$destroy', function() {
    if (c.refreshInterval) {
      $timeout.cancel(c.refreshInterval);
    }
  });
  
  // Start real-time updates
  c.startRealTimeUpdates();
      `;
    }

    return script;
  }
}

export class BackendSpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'Backend Developer',
      'Backend Developer',
      ['Server Scripts', 'GlideRecord', 'REST APIs', 'Data Processing', 'Performance', 'Caching'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Analyzing backend requirements for: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    
    // Backend-specific analysis
    const backendRequirements = {
      dataSource: this.analyzeDataSource(task),
      apiRequirements: this.analyzeApiRequirements(task),
      performance: this.analyzePerformanceRequirements(task),
      security: this.analyzeSecurityRequirements(task),
      caching: this.analyzeCachingRequirements(task)
    };

    await this.logProgress('Creating server script for data processing');
    const serverScript = await this.createServerScript(backendRequirements);
    
    await this.logProgress('Designing data access patterns');
    const dataAccess = await this.createDataAccessPatterns(backendRequirements);
    
    await this.logProgress('Implementing performance optimizations');
    const optimizations = await this.createOptimizations(backendRequirements);

    return {
      ...analysis,
      specialist: 'Backend Developer',
      deliverables: {
        serverScript,
        dataAccess,
        optimizations,
        requirements: backendRequirements
      }
    };
  }

  private analyzeDataSource(task: string): any {
    const lowerTask = task.toLowerCase();
    const dataSources = {
      primary: 'incident',
      tables: [],
      joins: false,
      aggregation: false,
      realtime: false
    };

    if (lowerTask.includes('incident')) {
      dataSources.primary = 'incident';
      dataSources.tables.push('incident');
    } else if (lowerTask.includes('request')) {
      dataSources.primary = 'sc_request';
      dataSources.tables.push('sc_request', 'sc_req_item');
    } else if (lowerTask.includes('change')) {
      dataSources.primary = 'change_request';
      dataSources.tables.push('change_request');
    } else if (lowerTask.includes('user')) {
      dataSources.primary = 'sys_user';
      dataSources.tables.push('sys_user');
    }

    if (lowerTask.includes('dashboard') || lowerTask.includes('chart')) {
      dataSources.aggregation = true;
    }

    if (lowerTask.includes('realtime') || lowerTask.includes('live')) {
      dataSources.realtime = true;
    }

    return dataSources;
  }

  private analyzeApiRequirements(task: string): any {
    return {
      restCalls: task.toLowerCase().includes('api') || task.toLowerCase().includes('integration'),
      authentication: true,
      errorHandling: true,
      rateLimiting: false
    };
  }

  private analyzePerformanceRequirements(task: string): any {
    const lowerTask = task.toLowerCase();
    return {
      indexedQueries: true,
      pagination: lowerTask.includes('list') || lowerTask.includes('table'),
      caching: lowerTask.includes('dashboard') || lowerTask.includes('chart'),
      batchProcessing: lowerTask.includes('bulk') || lowerTask.includes('batch')
    };
  }

  private analyzeSecurityRequirements(task: string): any {
    return {
      acl: true,
      inputValidation: true,
      outputSanitization: true,
      auditLogging: task.toLowerCase().includes('sensitive') || task.toLowerCase().includes('security')
    };
  }

  private analyzeCachingRequirements(task: string): any {
    const lowerTask = task.toLowerCase();
    return {
      enabled: lowerTask.includes('dashboard') || lowerTask.includes('performance'),
      ttl: lowerTask.includes('realtime') ? 30 : 300, // seconds
      strategy: lowerTask.includes('realtime') ? 'short' : 'medium'
    };
  }

  private async createServerScript(requirements: any): Promise<string> {
    if (requirements.dataSource.aggregation) {
      return this.createDashboardServerScript(requirements);
    } else if (requirements.performance.pagination) {
      return this.createListServerScript(requirements);
    }
    
    return this.createGenericServerScript(requirements);
  }

  private createDashboardServerScript(requirements: any): string {
    return `
(function() {
  'use strict';
  
  var data = {};
  var cache = new GlideCache();
  var cacheKey = 'widget_dashboard_' + gs.getUserID();
  
  // Check cache first
  if (${requirements.caching.enabled}) {
    var cached = cache.get(cacheKey);
    if (cached) {
      data = JSON.parse(cached);
      data.cached = true;
      data.lastUpdated = new Date();
      return;
    }
  }
  
  // Security check
  if (!gs.hasRole('${requirements.dataSource.primary}_read')) {
    data.error = 'Insufficient privileges';
    return;
  }
  
  try {
    // Get dashboard data
    data.kpis = getKPIData();
    data.chartData = getChartData();
    data.summary = getSummaryData();
    data.lastUpdated = new Date();
    
    // Cache the results
    if (${requirements.caching.enabled}) {
      cache.put(cacheKey, JSON.stringify(data), ${requirements.caching.ttl});
    }
    
  } catch (error) {
    gs.error('Dashboard widget error: ' + error.message);
    data.error = 'Error loading dashboard data';
  }
  
  function getKPIData() {
    var kpis = [];
    
    // Total incidents
    var gr = new GlideRecord('${requirements.dataSource.primary}');
    gr.addQuery('active', true);
    gr.query();
    kpis.push({
      label: 'Active Items',
      value: gr.getRowCount(),
      trend: 'up'
    });
    
    // High priority items
    gr = new GlideRecord('${requirements.dataSource.primary}');
    gr.addQuery('priority', '1');
    gr.addQuery('active', true);
    gr.query();
    kpis.push({
      label: 'High Priority',
      value: gr.getRowCount(),
      trend: 'stable'
    });
    
    return kpis;
  }
  
  function getChartData() {
    var chartData = {
      labels: [],
      datasets: [{
        label: 'Items by State',
        data: [],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
      }]
    };
    
    var ga = new GlideAggregate('${requirements.dataSource.primary}');
    ga.addAggregate('COUNT');
    ga.groupBy('state');
    ga.query();
    
    while (ga.next()) {
      chartData.labels.push(ga.getDisplayValue('state'));
      chartData.datasets[0].data.push(parseInt(ga.getAggregate('COUNT')));
    }
    
    return chartData;
  }
  
  function getSummaryData() {
    return {
      totalItems: getTotalCount(),
      openItems: getOpenCount(),
      resolvedToday: getResolvedTodayCount()
    };
  }
  
  function getTotalCount() {
    var gr = new GlideRecord('${requirements.dataSource.primary}');
    gr.query();
    return gr.getRowCount();
  }
  
  function getOpenCount() {
    var gr = new GlideRecord('${requirements.dataSource.primary}');
    gr.addQuery('active', true);
    gr.query();
    return gr.getRowCount();
  }
  
  function getResolvedTodayCount() {
    var gr = new GlideRecord('${requirements.dataSource.primary}');
    gr.addQuery('resolved_at', '>=', gs.daysAgoStart(0));
    gr.query();
    return gr.getRowCount();
  }
  
})();
    `.trim();
  }

  private createListServerScript(requirements: any): string {
    return `
(function() {
  'use strict';
  
  var data = {};
  
  // Security check
  if (!gs.hasRole('${requirements.dataSource.primary}_read')) {
    data.error = 'Insufficient privileges';
    return;
  }
  
  // Pagination parameters
  var limit = parseInt(options.limit) || 25;
  var offset = parseInt(options.offset) || 0;
  var orderBy = options.orderBy || 'sys_created_on';
  var orderDirection = options.orderDirection || 'DESC';
  
  try {
    // Get data with pagination
    var gr = new GlideRecord('${requirements.dataSource.primary}');
    
    // Apply filters
    if (options.filter) {
      gr.addEncodedQuery(options.filter);
    }
    
    // Apply ordering
    if (orderDirection === 'DESC') {
      gr.orderByDesc(orderBy);
    } else {
      gr.orderBy(orderBy);
    }
    
    // Apply pagination
    gr.chooseWindow(offset, offset + limit);
    gr.query();
    
    data.items = [];
    data.columns = getColumns();
    
    while (gr.next()) {
      var item = {};
      data.columns.forEach(function(column) {
        item[column.field] = gr.getDisplayValue(column.field);
      });
      item.sys_id = gr.getUniqueValue();
      data.items.push(item);
    }
    
    // Get total count for pagination
    data.totalCount = getTotalCount(options.filter);
    data.hasMore = (offset + limit) < data.totalCount;
    data.pagination = {
      limit: limit,
      offset: offset,
      totalCount: data.totalCount,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(data.totalCount / limit)
    };
    
  } catch (error) {
    gs.error('List widget error: ' + error.message);
    data.error = 'Error loading list data';
  }
  
  function getColumns() {
    return [
      { field: 'number', label: 'Number' },
      { field: 'short_description', label: 'Description' },
      { field: 'state', label: 'State' },
      { field: 'priority', label: 'Priority' },
      { field: 'assigned_to', label: 'Assigned To' },
      { field: 'sys_created_on', label: 'Created' }
    ];
  }
  
  function getTotalCount(filter) {
    var gr = new GlideRecord('${requirements.dataSource.primary}');
    if (filter) {
      gr.addEncodedQuery(filter);
    }
    gr.query();
    return gr.getRowCount();
  }
  
})();
    `.trim();
  }

  private createGenericServerScript(requirements: any): string {
    return `
(function() {
  'use strict';
  
  var data = {};
  
  // Security check
  if (!gs.hasRole('${requirements.dataSource.primary}_read')) {
    data.error = 'Insufficient privileges';
    return;
  }
  
  try {
    // Basic data retrieval
    var gr = new GlideRecord('${requirements.dataSource.primary}');
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
    
    data.title = 'Recent ${requirements.dataSource.primary}';
    data.count = data.items.length;
    
  } catch (error) {
    gs.error('Widget error: ' + error.message);
    data.error = 'Error loading data';
  }
  
})();
    `.trim();
  }

  private async createDataAccessPatterns(requirements: any): Promise<any> {
    return {
      queryOptimization: {
        indexedFields: ['sys_created_on', 'state', 'priority'],
        efficientQueries: true,
        avoidCountQueries: true
      },
      caching: requirements.caching,
      batchProcessing: requirements.performance.batchProcessing
    };
  }

  private async createOptimizations(requirements: any): Promise<any> {
    return {
      database: {
        useIndexes: true,
        limitResults: true,
        avoidJoins: true
      },
      memory: {
        objectPooling: true,
        garbageCollection: true
      },
      caching: requirements.caching
    };
  }
}

export class UIUXSpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'UI/UX Designer',
      'UI/UX Designer',
      ['User Experience', 'Design Systems', 'Accessibility', 'Usability', 'Visual Design'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Analyzing UX requirements for: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    
    const uxRequirements = {
      userJourney: this.analyzeUserJourney(task),
      designPatterns: this.identifyDesignPatterns(task),
      accessibility: this.analyzeAccessibilityNeeds(task),
      usability: this.analyzeUsabilityRequirements(task)
    };

    await this.logProgress('Creating user experience design');
    const uxDesign = await this.createUXDesign(uxRequirements);
    
    await this.logProgress('Defining design specifications');
    const designSpecs = await this.createDesignSpecifications(uxRequirements);

    return {
      ...analysis,
      specialist: 'UI/UX Designer',
      deliverables: {
        uxDesign,
        designSpecs,
        requirements: uxRequirements
      }
    };
  }

  private analyzeUserJourney(task: string): any {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('dashboard')) {
      return {
        userType: 'analyst',
        primaryGoal: 'monitor_metrics',
        actions: ['view_overview', 'drill_down', 'filter_data'],
        painPoints: ['information_overload', 'slow_loading']
      };
    }
    
    if (lowerTask.includes('form')) {
      return {
        userType: 'end_user',
        primaryGoal: 'submit_request',
        actions: ['fill_form', 'validate_data', 'submit'],
        painPoints: ['complex_fields', 'validation_errors']
      };
    }
    
    return {
      userType: 'general',
      primaryGoal: 'complete_task',
      actions: ['view_data', 'interact'],
      painPoints: ['unclear_interface']
    };
  }

  private identifyDesignPatterns(task: string): any {
    const patterns = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('dashboard')) {
      patterns.push('card_layout', 'progressive_disclosure', 'data_visualization');
    }
    
    if (lowerTask.includes('form')) {
      patterns.push('stepped_form', 'inline_validation', 'smart_defaults');
    }
    
    if (lowerTask.includes('list') || lowerTask.includes('table')) {
      patterns.push('infinite_scroll', 'filtering', 'sorting');
    }
    
    return patterns;
  }

  private analyzeAccessibilityNeeds(task: string): any {
    return {
      wcagLevel: 'AA',
      requirements: [
        'keyboard_navigation',
        'screen_reader_support',
        'high_contrast',
        'focus_indicators',
        'aria_labels'
      ]
    };
  }

  private analyzeUsabilityRequirements(task: string): any {
    return {
      principles: ['clarity', 'efficiency', 'consistency'],
      metrics: ['task_completion_rate', 'time_to_complete', 'error_rate'],
      testing: ['usability_testing', 'a11y_testing']
    };
  }

  private async createUXDesign(requirements: any): Promise<any> {
    return {
      wireframes: this.createWireframes(requirements),
      userFlow: this.createUserFlow(requirements),
      interactionDesign: this.createInteractionDesign(requirements)
    };
  }

  private createWireframes(requirements: any): any {
    return {
      layout: requirements.designPatterns.includes('card_layout') ? 'card_grid' : 'linear',
      components: requirements.designPatterns,
      hierarchy: 'visual_hierarchy_defined'
    };
  }

  private createUserFlow(requirements: any): any {
    return {
      entry_point: 'widget_load',
      steps: requirements.userJourney.actions,
      exit_point: 'task_completion',
      error_handling: 'graceful_degradation'
    };
  }

  private createInteractionDesign(requirements: any): any {
    return {
      hover_states: true,
      focus_states: true,
      loading_states: true,
      error_states: true,
      animations: 'subtle_transitions'
    };
  }

  private async createDesignSpecifications(requirements: any): Promise<any> {
    return {
      colorPalette: {
        primary: '#0073e6',
        secondary: '#6c757d',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545'
      },
      typography: {
        headings: 'Source Sans Pro',
        body: 'Source Sans Pro',
        sizes: {
          h1: '2rem',
          h2: '1.5rem',
          body: '1rem',
          small: '0.875rem'
        }
      },
      spacing: {
        unit: '0.5rem',
        sections: '2rem',
        components: '1rem'
      },
      accessibility: requirements.accessibility
    };
  }
}

export class ServiceNowSpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'ServiceNow Platform Expert',
      'ServiceNow Specialist',
      ['Platform Integration', 'Best Practices', 'Performance', 'Security', 'Update Sets'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Analyzing ServiceNow platform requirements for: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    
    const platformRequirements = {
      scope: this.analyzeScopeRequirements(task),
      performance: this.analyzePlatformPerformance(task),
      security: this.analyzePlatformSecurity(task),
      updateSets: this.analyzeUpdateSetStrategy(task),
      bestPractices: this.identifyBestPractices(task)
    };

    await this.logProgress('Creating platform integration strategy');
    const integrationStrategy = await this.createIntegrationStrategy(platformRequirements);
    
    await this.logProgress('Defining deployment strategy');
    const deploymentStrategy = await this.createDeploymentStrategy(platformRequirements);

    return {
      ...analysis,
      specialist: 'ServiceNow Specialist',
      deliverables: {
        integrationStrategy,
        deploymentStrategy,
        requirements: platformRequirements
      }
    };
  }

  private analyzeScopeRequirements(task: string): any {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('global') || lowerTask.includes('enterprise')) {
      return { type: 'global', requiresAdmin: true };
    }
    
    if (lowerTask.includes('application') || lowerTask.includes('scoped')) {
      return { type: 'application', requiresAdmin: false };
    }
    
    return { type: 'auto', requiresAdmin: false };
  }

  private analyzePlatformPerformance(task: string): any {
    return {
      caching: true,
      batchProcessing: task.toLowerCase().includes('bulk'),
      indexOptimization: true,
      memoryManagement: true
    };
  }

  private analyzePlatformSecurity(task: string): any {
    return {
      acls: true,
      roleBasedAccess: true,
      dataValidation: true,
      auditCompliance: task.toLowerCase().includes('audit') || task.toLowerCase().includes('compliance')
    };
  }

  private analyzeUpdateSetStrategy(task: string): any {
    return {
      required: true,
      naming: 'auto_generated',
      tracking: 'comprehensive',
      validation: 'pre_commit'
    };
  }

  private identifyBestPractices(task: string): string[] {
    const practices = [
      'use_update_sets',
      'follow_naming_conventions',
      'implement_error_handling',
      'optimize_queries',
      'ensure_security'
    ];
    
    if (task.toLowerCase().includes('widget')) {
      practices.push('responsive_design', 'accessibility', 'performance_optimization');
    }
    
    if (task.toLowerCase().includes('flow')) {
      practices.push('reusable_subflows', 'error_handling', 'testing_coverage');
    }
    
    return practices;
  }

  private async createIntegrationStrategy(requirements: any): Promise<any> {
    return {
      scope: requirements.scope,
      security: requirements.security,
      performance: requirements.performance,
      monitoring: {
        enabled: true,
        metrics: ['response_time', 'error_rate', 'usage_stats']
      }
    };
  }

  private async createDeploymentStrategy(requirements: any): Promise<any> {
    return {
      updateSet: requirements.updateSets,
      testing: {
        required: true,
        types: ['unit', 'integration', 'user_acceptance']
      },
      rollback: {
        strategy: 'update_set_rollback',
        automated: true
      },
      validation: {
        preDeployment: true,
        postDeployment: true
      }
    };
  }
}

export class QASpecialist extends BaseSpecialist {
  constructor(options: SpecialistOptions = {}) {
    super(
      'QA Tester',
      'QA Specialist',
      ['Testing', 'Quality Assurance', 'Test Automation', 'Bug Detection', 'Validation'],
      options
    );
  }

  async execute(task: string, context?: any): Promise<any> {
    await this.logProgress(`Analyzing testing requirements for: ${task}`);
    
    const analysis = await this.analyzeTask(task);
    
    const testingRequirements = {
      testTypes: this.identifyTestTypes(task),
      scenarios: this.createTestScenarios(task),
      automation: this.analyzeAutomationNeeds(task),
      validation: this.createValidationRules(task)
    };

    await this.logProgress('Creating comprehensive test plan');
    const testPlan = await this.createTestPlan(testingRequirements);
    
    await this.logProgress('Generating test scenarios and validation');
    const testCases = await this.createTestCases(testingRequirements);

    return {
      ...analysis,
      specialist: 'QA Specialist',
      deliverables: {
        testPlan,
        testCases,
        requirements: testingRequirements
      }
    };
  }

  private identifyTestTypes(task: string): string[] {
    const types = ['functional', 'ui', 'integration'];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('performance') || lowerTask.includes('load')) {
      types.push('performance');
    }
    
    if (lowerTask.includes('security') || lowerTask.includes('access')) {
      types.push('security');
    }
    
    if (lowerTask.includes('accessibility') || lowerTask.includes('a11y')) {
      types.push('accessibility');
    }
    
    return types;
  }

  private createTestScenarios(task: string): any[] {
    const scenarios = [
      {
        name: 'Happy Path',
        description: 'Test normal user workflow',
        priority: 'high'
      },
      {
        name: 'Error Handling',
        description: 'Test error conditions and recovery',
        priority: 'high'
      },
      {
        name: 'Edge Cases',
        description: 'Test boundary conditions',
        priority: 'medium'
      }
    ];
    
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('form')) {
      scenarios.push({
        name: 'Form Validation',
        description: 'Test field validation and error messages',
        priority: 'high'
      });
    }
    
    if (lowerTask.includes('dashboard')) {
      scenarios.push({
        name: 'Data Loading',
        description: 'Test data retrieval and display',
        priority: 'high'
      });
    }
    
    return scenarios;
  }

  private analyzeAutomationNeeds(task: string): any {
    return {
      enabled: true,
      framework: 'selenium',
      coverage: 'critical_paths',
      reporting: 'detailed'
    };
  }

  private createValidationRules(task: string): any[] {
    return [
      {
        rule: 'All required fields must be validated',
        type: 'functional'
      },
      {
        rule: 'Error messages must be user-friendly',
        type: 'ui'
      },
      {
        rule: 'Performance must meet SLA requirements',
        type: 'performance'
      },
      {
        rule: 'Security controls must be enforced',
        type: 'security'
      }
    ];
  }

  private async createTestPlan(requirements: any): Promise<any> {
    return {
      scope: 'Widget functionality and integration',
      objectives: [
        'Verify functional requirements',
        'Ensure quality standards',
        'Validate user experience',
        'Confirm security compliance'
      ],
      testTypes: requirements.testTypes,
      schedule: {
        phases: ['unit', 'integration', 'system', 'acceptance'],
        duration: '2-3 days'
      },
      resources: ['QA Engineer', 'Test Environment', 'Test Data'],
      deliverables: ['Test Cases', 'Test Reports', 'Bug Reports', 'Sign-off']
    };
  }

  private async createTestCases(requirements: any): Promise<any[]> {
    return requirements.scenarios.map((scenario, index) => ({
      id: `TC_${index + 1}`,
      name: scenario.name,
      description: scenario.description,
      priority: scenario.priority,
      steps: this.generateTestSteps(scenario),
      expectedResult: 'Functionality works as expected',
      actualResult: '',
      status: 'pending'
    }));
  }

  private generateTestSteps(scenario: any): string[] {
    const baseSteps = [
      'Navigate to the widget',
      'Verify widget loads correctly',
      'Interact with widget features'
    ];
    
    if (scenario.name === 'Error Handling') {
      baseSteps.push(
        'Trigger error condition',
        'Verify error message displays',
        'Verify system recovers gracefully'
      );
    }
    
    if (scenario.name === 'Form Validation') {
      baseSteps.push(
        'Submit form with invalid data',
        'Verify validation messages',
        'Correct data and resubmit'
      );
    }
    
    baseSteps.push('Verify expected outcome');
    
    return baseSteps;
  }
}