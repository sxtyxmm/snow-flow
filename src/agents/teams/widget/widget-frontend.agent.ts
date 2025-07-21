/**
 * Widget Frontend Agent - Frontend Development Specialist
 * Handles HTML templates, CSS styling, and client-side JavaScript for widgets
 */
import { BaseSnowAgent } from '../base-team';
import { 
  FrontendRequirements,
  TeamResult,
  AgentCapability,
  SpecializationProfile
} from '../team-types';
import { ServiceNowAgentConfig } from '../../../types/servicenow.types';

export class WidgetFrontendAgent extends BaseSnowAgent {
  constructor(config: ServiceNowAgentConfig) {
    const capabilities: AgentCapability[] = [
      {
        name: 'html_template_creation',
        description: 'Create responsive HTML templates for widgets',
        proficiency: 0.95,
        tools: ['html5', 'angular', 'responsive_design']
      },
      {
        name: 'css_styling',
        description: 'Create CSS styles and themes for widgets',
        proficiency: 0.9,
        tools: ['css3', 'scss', 'bootstrap', 'servicenow_themes']
      },
      {
        name: 'client_javascript',
        description: 'Develop client-side JavaScript functionality',
        proficiency: 0.88,
        tools: ['javascript', 'angular', 'servicenow_client_api']
      },
      {
        name: 'responsive_design',
        description: 'Ensure responsive design across devices',
        proficiency: 0.85,
        tools: ['media_queries', 'flexbox', 'grid']
      },
      {
        name: 'accessibility',
        description: 'Implement accessibility best practices',
        proficiency: 0.8,
        tools: ['wcag', 'aria', 'keyboard_navigation']
      }
    ];

    const specialization: SpecializationProfile = {
      primary: ['html_templates', 'css_styling', 'client_scripting'],
      secondary: ['ui_components', 'responsive_design', 'accessibility'],
      tools: ['HTML5', 'CSS3', 'JavaScript', 'AngularJS', 'ServiceNow Client API'],
      experience: 0.88
    };

    super(
      'widget-frontend-001',
      'Widget Frontend Specialist',
      'frontend_developer',
      capabilities,
      specialization,
      config
    );
  }

  /**
   * Analyze frontend requirements and prepare implementation plan
   */
  async analyzeRequirements(requirements: FrontendRequirements & { design?: any }): Promise<any> {
    try {
      this.setStatus('busy');
      console.log('Frontend Agent: Analyzing frontend requirements...');

      const analysis = {
        templateStructure: this.analyzeTemplateNeeds(requirements),
        stylingApproach: this.analyzeStylingNeeds(requirements),
        scriptingNeeds: this.analyzeScriptingNeeds(requirements),
        responsiveStrategy: this.analyzeResponsiveNeeds(requirements),
        accessibilityRequirements: this.analyzeAccessibilityNeeds(requirements)
      };

      console.log('Frontend Agent: Analysis complete');
      return analysis;

    } catch (error) {
      console.error('Frontend Agent: Error analyzing requirements:', error);
      throw error;
    } finally {
      this.setStatus('available');
    }
  }

  /**
   * Execute frontend development tasks
   */
  async execute(requirements: FrontendRequirements & { design?: any }): Promise<TeamResult> {
    try {
      this.setStatus('busy');
      console.log('Frontend Agent: Starting frontend development...');

      // Create HTML template
      const template = await this.createTemplate(requirements);
      
      // Create CSS styling
      const css = await this.createStyling(requirements);
      
      // Create client-side script
      const clientScript = await this.createClientScript(requirements);
      
      // Create option schema for widget configuration
      const optionSchema = await this.createOptionSchema(requirements);
      
      // Validate responsiveness and accessibility
      const validation = await this.validateImplementation({
        template,
        css,
        clientScript,
        requirements
      });

      console.log('Frontend Agent: Frontend development completed');

      return {
        success: true,
        artifact: {
          template,
          css,
          clientScript,
          optionSchema,
          validation
        },
        metadata: {
          duration: 0,
          performance: {
            template_complexity: this.assessTemplateComplexity(template),
            css_efficiency: this.assessCSSEfficiency(css),
            script_optimization: this.assessScriptOptimization(clientScript)
          },
          quality: {
            responsiveness_score: validation.responsiveness,
            accessibility_score: validation.accessibility,
            code_quality: validation.codeQuality
          }
        }
      };

    } catch (error) {
      console.error('Frontend Agent: Error in frontend development:', error);
      return this.handleError(error);
    } finally {
      this.setStatus('available');
    }
  }

  /**
   * Create responsive HTML template
   */
  async createTemplate(requirements: FrontendRequirements & { design?: any }): Promise<string> {
    console.log('Frontend Agent: Creating HTML template...');

    const { template: templateReq, design } = requirements;
    
    // Base template structure
    let template = `<div class="widget-container" ng-controller="WidgetController">`;
    
    // Add loading state
    template += `
  <div ng-if="data.loading" class="loading-container">
    <i class="fa fa-spinner fa-spin"></i>
    <span>Loading...</span>
  </div>`;

    // Main content based on layout
    switch (templateReq.layout) {
      case 'grid':
        template += this.createGridTemplate(templateReq, design);
        break;
      case 'table':
        template += this.createTableTemplate(templateReq, design);
        break;
      case 'centered':
        template += this.createCenteredTemplate(templateReq, design);
        break;
      case 'vertical':
        template += this.createVerticalTemplate(templateReq, design);
        break;
      default:
        template += this.createFlexibleTemplate(templateReq, design);
    }

    // Add error handling
    template += `
  <div ng-if="data.error" class="error-container alert alert-danger">
    <i class="fa fa-exclamation-triangle"></i>
    <span>{{data.error.message}}</span>
  </div>`;

    // Close main container
    template += `</div>`;

    // Add responsive meta and accessibility attributes
    template = this.enhanceTemplateAccessibility(template);
    
    return template;
  }

  /**
   * Create CSS styling
   */
  async createStyling(requirements: FrontendRequirements & { design?: any }): Promise<string> {
    console.log('Frontend Agent: Creating CSS styling...');

    const { styling, template: templateReq, design } = requirements;
    
    let css = `/* Widget Styles */
.widget-container {
  width: 100%;
  height: 100%;
  font-family: 'Source Sans Pro', Arial, sans-serif;
  color: var(--text-primary, #333);
  background: var(--background-primary, #fff);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 16px;
  box-sizing: border-box;
}

/* Loading States */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--text-secondary, #666);
}

.loading-container .fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Error States */
.error-container {
  margin: 16px 0;
  padding: 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}`;

    // Add layout-specific styles
    css += this.createLayoutStyles(templateReq.layout);
    
    // Add responsive styles
    if (templateReq.responsive) {
      css += this.createResponsiveStyles();
    }
    
    // Add accessibility styles
    css += this.createAccessibilityStyles();
    
    // Add theme-specific styles
    css += this.createThemeStyles(styling.theme);
    
    // Add custom CSS if provided
    if (styling.customCSS) {
      css += `\n/* Custom Styles */\n${styling.customCSS}`;
    }

    return css;
  }

  /**
   * Create client-side JavaScript
   */
  async createClientScript(requirements: FrontendRequirements & { design?: any }): Promise<string> {
    console.log('Frontend Agent: Creating client script...');

    const { clientScript: scriptReq } = requirements;
    
    let script = `function WidgetController($scope, $rootScope, spUtil, $timeout) {
  var c = this;
  
  // Initialize widget
  c.init = function() {
    $scope.data.loading = true;
    $scope.data.error = null;
    
    // Load initial data
    c.loadData();
    
    // Setup event listeners
    c.setupEventListeners();
  };
  
  // Load widget data
  c.loadData = function() {
    c.server.get().then(function(response) {
      $scope.data.loading = false;
      
      if (response.error) {
        $scope.data.error = response.error;
        return;
      }
      
      // Process server data
      c.processData(response);
      
    }).catch(function(error) {
      $scope.data.loading = false;
      $scope.data.error = {
        message: 'Failed to load data: ' + (error.message || 'Unknown error')
      };
    });
  };
  
  // Process server response
  c.processData = function(response) {
    $scope.data.items = response.items || [];
    $scope.data.total = response.total || 0;
    $scope.data.lastUpdated = new Date();
    
    // Trigger data processing events
    $rootScope.$broadcast('widget.dataLoaded', {
      widget: 'widget_name',
      data: $scope.data
    });
  };`;

    // Add event handling
    if (scriptReq.events.includes('onClick')) {
      script += `
  
  // Handle click events
  c.handleClick = function(item, event) {
    event.preventDefault();
    
    // Emit click event
    $rootScope.$broadcast('widget.itemClicked', {
      item: item,
      widget: 'widget_name'
    });
    
    // Custom click logic
    if (item.action) {
      c.executeAction(item.action, item);
    }
  };`;
    }

    if (scriptReq.events.includes('onChange')) {
      script += `
  
  // Handle change events
  c.handleChange = function(field, value, item) {
    // Validate input
    if (!c.validateInput(field, value)) {
      return;
    }
    
    // Update data
    item[field] = value;
    
    // Save changes
    c.saveChanges(item);
  };`;
    }

    if (scriptReq.events.includes('onUpdate')) {
      script += `
  
  // Handle real-time updates
  c.setupRealTimeUpdates = function() {
    // Setup periodic refresh
    var refreshInterval = setInterval(function() {
      if (!$scope.data.loading) {
        c.loadData();
      }
    }, 30000); // 30 seconds
    
    // Cleanup on scope destroy
    $scope.$on('$destroy', function() {
      clearInterval(refreshInterval);
    });
  };`;
    }

    // Add utility functions
    script += `
  
  // Setup event listeners
  c.setupEventListeners = function() {
    // Listen for external events
    $scope.$on('widget.refresh', function() {
      c.loadData();
    });
    
    $scope.$on('widget.configure', function(event, config) {
      $scope.options = angular.extend($scope.options, config);
      c.loadData();
    });
  };
  
  // Validate input
  c.validateInput = function(field, value) {
    // Basic validation
    if (!value && $scope.options.required && $scope.options.required.includes(field)) {
      spUtil.addErrorMessage('Field ' + field + ' is required');
      return false;
    }
    
    return true;
  };
  
  // Execute actions
  c.executeAction = function(action, item) {
    switch(action) {
      case 'view':
        spUtil.getURL('form', item.table, item.sys_id).then(function(url) {
          window.open(url, '_blank');
        });
        break;
      case 'edit':
        spUtil.getURL('form', item.table, item.sys_id + '&view=edit').then(function(url) {
          window.location.href = url;
        });
        break;
      default:
        console.log('Unknown action:', action);
    }
  };
  
  // Save changes
  c.saveChanges = function(item) {
    $scope.data.saving = true;
    
    c.server.update({
      action: 'save_item',
      item: item
    }).then(function(response) {
      $scope.data.saving = false;
      
      if (response.success) {
        spUtil.addInfoMessage('Changes saved successfully');
      } else {
        spUtil.addErrorMessage('Failed to save changes: ' + response.error);
      }
    });
  };
  
  // Initialize widget on load
  c.init();
}`;

    return script;
  }

  /**
   * Create option schema for widget configuration
   */
  async createOptionSchema(requirements: FrontendRequirements): Promise<any> {
    console.log('Frontend Agent: Creating option schema...');

    const schema = [
      {
        name: "title",
        label: "Widget Title",
        type: "string",
        default_value: "My Widget"
      },
      {
        name: "max_items",
        label: "Maximum Items",
        type: "integer",
        default_value: 10
      },
      {
        name: "refresh_interval",
        label: "Refresh Interval (seconds)",
        type: "integer",
        default_value: 30
      },
      {
        name: "show_icons",
        label: "Show Icons",
        type: "boolean",
        default_value: true
      }
    ];

    // Add responsive options
    if (requirements.template.responsive) {
      schema.push({
        name: "mobile_columns",
        label: "Mobile Columns",
        type: "integer",
        default_value: 1
      });
    }

    // Add accessibility options
    if (requirements.styling.accessibility) {
      schema.push({
        name: "high_contrast",
        label: "High Contrast Mode",
        type: "boolean",
        default_value: false
      });
    }

    return schema;
  }

  // Template creation methods
  private createGridTemplate(templateReq: any, design: any): string {
    return `
  <div class="grid-container" ng-if="!data.loading && !data.error">
    <div class="grid-header" ng-if="options.title">
      <h3>{{options.title}}</h3>
    </div>
    <div class="grid-content">
      <div class="grid-item" ng-repeat="item in data.items | limitTo:options.max_items" 
           ng-click="c.handleClick(item, $event)"
           role="button" tabindex="0"
           aria-label="{{item.display_value || item.name}}">
        <div class="item-content">
          <i class="fa {{item.icon}}" ng-if="options.show_icons && item.icon"></i>
          <span class="item-title">{{item.display_value || item.name}}</span>
          <span class="item-description">{{item.description}}</span>
        </div>
      </div>
    </div>
  </div>`;
  }

  private createTableTemplate(templateReq: any, design: any): string {
    return `
  <div class="table-container" ng-if="!data.loading && !data.error">
    <div class="table-header" ng-if="options.title">
      <h3>{{options.title}}</h3>
    </div>
    <div class="table-content">
      <table class="table table-striped">
        <thead>
          <tr>
            <th ng-repeat="field in data.fields">{{field.label}}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr ng-repeat="item in data.items | limitTo:options.max_items">
            <td ng-repeat="field in data.fields">
              {{item[field.name]}}
            </td>
            <td>
              <button class="btn btn-sm btn-primary" ng-click="c.handleClick(item, $event)">
                View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`;
  }

  private createCenteredTemplate(templateReq: any, design: any): string {
    return `
  <div class="centered-container" ng-if="!data.loading && !data.error">
    <div class="centered-content">
      <div class="chart-container" ng-if="data.chartData">
        <canvas id="widget-chart" width="400" height="200"></canvas>
      </div>
      <div class="stats-container">
        <div class="stat-item" ng-repeat="stat in data.stats">
          <span class="stat-label">{{stat.label}}</span>
          <span class="stat-value">{{stat.value}}</span>
        </div>
      </div>
    </div>
  </div>`;
  }

  private createVerticalTemplate(templateReq: any, design: any): string {
    return `
  <div class="vertical-container" ng-if="!data.loading && !data.error">
    <div class="form-section" ng-repeat="section in data.sections">
      <h4>{{section.title}}</h4>
      <div class="form-fields">
        <div class="field-group" ng-repeat="field in section.fields">
          <label>{{field.label}}</label>
          <input type="{{field.type}}" 
                 ng-model="field.value"
                 ng-change="c.handleChange(field.name, field.value, section)"
                 class="form-control">
        </div>
      </div>
    </div>
  </div>`;
  }

  private createFlexibleTemplate(templateReq: any, design: any): string {
    return `
  <div class="flexible-container" ng-if="!data.loading && !data.error">
    <div class="content-area">
      <div ng-repeat="item in data.items | limitTo:options.max_items"
           class="flexible-item"
           ng-click="c.handleClick(item, $event)">
        <div class="item-header">
          <span class="item-title">{{item.title || item.name}}</span>
          <span class="item-meta">{{item.updated_on | date}}</span>
        </div>
        <div class="item-body">
          <p>{{item.description || item.short_description}}</p>
        </div>
      </div>
    </div>
  </div>`;
  }

  // Styling methods
  private createLayoutStyles(layout: string): string {
    const layouts = {
      grid: `
/* Grid Layout */
.grid-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.grid-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.grid-item {
  background: var(--background-secondary, #f8f9fa);
  border-radius: 4px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.grid-item:hover {
  background: var(--background-hover, #e9ecef);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.grid-item:focus {
  outline: 2px solid var(--primary-color, #007bff);
  outline-offset: 2px;
}`,

      table: `
/* Table Layout */
.table-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table-content {
  flex: 1;
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background: var(--background-secondary, #f8f9fa);
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--border-color, #dee2e6);
}

.table td {
  padding: 12px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
}

.table-striped tbody tr:nth-child(odd) {
  background: var(--background-alternate, #f8f9fa);
}`,

      centered: `
/* Centered Layout */
.centered-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.centered-content {
  text-align: center;
  max-width: 600px;
}

.chart-container {
  margin-bottom: 24px;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary, #666);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color, #007bff);
}`,

      vertical: `
/* Vertical Layout */
.vertical-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section h4 {
  margin: 0 0 16px 0;
  color: var(--text-primary, #333);
  border-bottom: 1px solid var(--border-color, #dee2e6);
  padding-bottom: 8px;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-group label {
  font-weight: 500;
  color: var(--text-secondary, #666);
}

.form-control {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #007bff);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}`,

      flexible: `
/* Flexible Layout */
.flexible-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.flexible-item {
  background: var(--background-secondary, #f8f9fa);
  border-radius: 4px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.flexible-item:hover {
  background: var(--background-hover, #e9ecef);
  border-left-color: var(--primary-color, #007bff);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-title {
  font-weight: 500;
  color: var(--text-primary, #333);
}

.item-meta {
  font-size: 12px;
  color: var(--text-secondary, #666);
}

.item-body p {
  margin: 0;
  color: var(--text-secondary, #666);
  line-height: 1.4;
}`
    };

    return layouts[layout as keyof typeof layouts] || layouts.flexible;
  }

  private createResponsiveStyles(): string {
    return `
/* Responsive Styles */
@media (max-width: 768px) {
  .grid-content {
    grid-template-columns: repeat(var(--mobile-columns, 1), 1fr);
  }
  
  .table-content {
    overflow-x: auto;
  }
  
  .stats-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .widget-container {
    padding: 12px;
  }
  
  .grid-content {
    gap: 12px;
  }
  
  .grid-item {
    padding: 12px;
  }
}`;
  }

  private createAccessibilityStyles(): string {
    return `
/* Accessibility Styles */
.widget-container:focus-within {
  outline: 2px solid var(--focus-color, #007bff);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .widget-container {
    border: 2px solid currentColor;
  }
  
  .grid-item,
  .flexible-item {
    border: 1px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .grid-item,
  .flexible-item,
  .form-control {
    transition: none;
  }
  
  .loading-container .fa-spinner {
    animation: none;
  }
}

/* Focus management */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Keyboard navigation */
[role="button"]:focus,
button:focus,
.form-control:focus {
  outline: 2px solid var(--focus-color, #007bff);
  outline-offset: 2px;
}`;
  }

  private createThemeStyles(theme: string): string {
    const themes = {
      light: `
/* Light Theme */
:root {
  --background-primary: #ffffff;
  --background-secondary: #f8f9fa;
  --background-hover: #e9ecef;
  --background-alternate: #f8f9fa;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #dee2e6;
  --primary-color: #007bff;
  --focus-color: #007bff;
}`,

      dark: `
/* Dark Theme */
:root {
  --background-primary: #1a1a1a;
  --background-secondary: #2d2d2d;
  --background-hover: #404040;
  --background-alternate: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --border-color: #555555;
  --primary-color: #0d6efd;
  --focus-color: #0d6efd;
}`,

      servicenow: `
/* ServiceNow Theme */
:root {
  --background-primary: #ffffff;
  --background-secondary: #f4f6f8;
  --background-hover: #e8ebef;
  --background-alternate: #f9fafb;
  --text-primary: #293e40;
  --text-secondary: #6c7b7f;
  --border-color: #dae1e7;
  --primary-color: #0f62fe;
  --focus-color: #0f62fe;
}`
    };

    return themes[theme as keyof typeof themes] || themes.light;
  }

  private enhanceTemplateAccessibility(template: string): string {
    // Add ARIA labels and roles where needed
    template = template.replace(/ng-repeat="([^"]+)"/g, 
      'ng-repeat="$1" role="listitem" tabindex="0"');
    
    // Add semantic HTML where possible
    template = template.replace(/<div class="grid-container"/g, 
      '<section class="grid-container" role="region" aria-label="Widget content"');
    
    return template;
  }

  // Analysis methods
  private analyzeTemplateNeeds(requirements: FrontendRequirements): any {
    return {
      complexity: requirements.template.components.length > 5 ? 'high' : 'medium',
      components: requirements.template.components,
      responsive: requirements.template.responsive
    };
  }

  private analyzeStylingNeeds(requirements: FrontendRequirements): any {
    return {
      theme: requirements.styling.theme,
      customizations: !!requirements.styling.customCSS,
      accessibility: requirements.styling.accessibility
    };
  }

  private analyzeScriptingNeeds(requirements: FrontendRequirements): any {
    return {
      complexity: requirements.clientScript.events.length > 3 ? 'high' : 'medium',
      events: requirements.clientScript.events,
      apiCalls: requirements.clientScript.apiCalls
    };
  }

  private analyzeResponsiveNeeds(requirements: FrontendRequirements): any {
    return {
      required: requirements.template.responsive,
      breakpoints: ['mobile', 'tablet', 'desktop']
    };
  }

  private analyzeAccessibilityNeeds(requirements: FrontendRequirements): any {
    return {
      required: requirements.styling.accessibility,
      standards: ['WCAG 2.1 AA'],
      features: ['keyboard_navigation', 'screen_reader', 'high_contrast']
    };
  }

  // Validation methods
  private async validateImplementation(implementation: any): Promise<any> {
    return {
      responsiveness: this.validateResponsiveness(implementation),
      accessibility: this.validateAccessibility(implementation),
      codeQuality: this.validateCodeQuality(implementation)
    };
  }

  private validateResponsiveness(implementation: any): number {
    // Simple validation - in real implementation, this would be more sophisticated
    const hasMediaQueries = implementation.css.includes('@media');
    const hasFlexbox = implementation.css.includes('flex');
    const hasGrid = implementation.css.includes('grid');
    
    let score = 0.5;
    if (hasMediaQueries) score += 0.3;
    if (hasFlexbox || hasGrid) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private validateAccessibility(implementation: any): number {
    const hasAriaLabels = implementation.template.includes('aria-label');
    const hasSemanticHTML = implementation.template.includes('role=');
    const hasFocusStyles = implementation.css.includes(':focus');
    
    let score = 0.3;
    if (hasAriaLabels) score += 0.3;
    if (hasSemanticHTML) score += 0.2;
    if (hasFocusStyles) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private validateCodeQuality(implementation: any): number {
    // Basic code quality checks
    const hasErrorHandling = implementation.clientScript.includes('catch');
    const hasValidation = implementation.clientScript.includes('validateInput');
    const hasComments = implementation.clientScript.includes('//');
    
    let score = 0.4;
    if (hasErrorHandling) score += 0.2;
    if (hasValidation) score += 0.2;
    if (hasComments) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  // Assessment methods
  private assessTemplateComplexity(template: string): number {
    const components = (template.match(/ng-/g) || []).length;
    return Math.min(components / 20, 1.0);
  }

  private assessCSSEfficiency(css: string): number {
    const rules = (css.match(/\{[^}]+\}/g) || []).length;
    const mediaQueries = (css.match(/@media/g) || []).length;
    
    // Efficiency based on rule count and media query usage
    return Math.max(0.5, 1.0 - (rules / 100) + (mediaQueries * 0.1));
  }

  private assessScriptOptimization(script: string): number {
    const functions = (script.match(/function|=>/g) || []).length;
    const eventListeners = (script.match(/\$on\(/g) || []).length;
    
    // Optimization based on function count and event management
    return Math.max(0.5, 1.0 - (functions / 20) + (eventListeners * 0.05));
  }
}