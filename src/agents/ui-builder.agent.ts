import { BaseAppAgent } from './base-app-agent';
import { AppGenerationRequest, ServiceNowUIPage, ServiceNowWidget } from '../types/servicenow-studio.types';
import logger from '../utils/logger';
import * as beautify from 'js-beautify';

export class UIBuilderAgent extends BaseAppAgent {
  constructor(client: any) {
    super('ui-builder', client, [
      'ui-pages',
      'service-portal',
      'forms',
      'lists',
      'widgets',
      'mobile-ui',
      'responsive-design'
    ]);
  }

  async generateComponent(request: AppGenerationRequest): Promise<any> {
    const results = {
      uiPages: [] as ServiceNowUIPage[],
      widgets: [] as ServiceNowWidget[],
      forms: [] as any[],
      lists: [] as any[],
      portals: [] as any[]
    };

    try {
      // Generate UI Pages
      if (request.requirements.ui) {
        for (const ui of request.requirements.ui) {
          if (ui.type === 'portal') {
            const widget = await this.generatePortalWidget(ui, request);
            results.widgets.push(widget);
          } else if (ui.type === 'form') {
            const form = await this.generateForm(ui, request);
            results.forms.push(form);
          } else if (ui.type === 'list') {
            const list = await this.generateList(ui, request);
            results.lists.push(list);
          } else {
            const uiPage = await this.generateUIPage(ui, request);
            results.uiPages.push(uiPage);
          }
        }
      }

      // Generate dashboard widgets if needed
      if (request.preferences?.useModernUI) {
        const dashboardWidget = await this.generateDashboardWidget(request);
        results.widgets.push(dashboardWidget);
      }

      logger.info(`UI generation completed for ${request.appName}`);
      return results;
    } catch (error) {
      logger.error('UI generation failed', error);
      throw error;
    }
  }

  private async generateUIPage(ui: any, request: AppGenerationRequest): Promise<ServiceNowUIPage> {
    const prompt = `Generate a ServiceNow UI Page for:

Application: ${request.appName}
Page Name: ${ui.name}
Description: ${ui.description || ''}
Table: ${ui.table || 'task'}
Fields: ${ui.fields?.join(', ') || 'all fields'}
Layout: ${ui.layout || 'standard'}

Generate a complete UI Page that includes:
1. Professional HTML structure
2. Responsive design
3. ServiceNow UI components
4. Client-side JavaScript for interactions
5. CSS styling for modern appearance
6. Proper form validation
7. Accessibility compliance
8. Mobile-friendly design

The page should integrate with ServiceNow's Jelly framework and use ServiceNow UI components.
Return JSON with HTML, CSS, and JavaScript components.`;

    const response = await this.callClaude(prompt);
    const pageData = JSON.parse(response);

    const formattedHTML = beautify.html(pageData.html, {
      indent_size: 2,
      wrap_line_length: 120,
      preserve_newlines: true
    });

    const formattedCSS = beautify.css(pageData.css || '', {
      indent_size: 2
    });

    const formattedJS = beautify.js(pageData.clientScript || '', {
      indent_size: 2,
      space_in_empty_paren: true
    });

    return {
      sys_id: this.generateUniqueId('ui_'),
      name: this.validateServiceNowName(ui.name),
      title: ui.name,
      html: formattedHTML,
      processing_script: pageData.processingScript || '',
      client_script: formattedJS,
      css: formattedCSS,
      category: 'general',
      direct: false,
      sys_package: request.appScope,
      sys_scope: request.appScope,
      description: ui.description || `UI Page for ${request.appName}`
    };
  }

  private async generatePortalWidget(ui: any, request: AppGenerationRequest): Promise<ServiceNowWidget> {
    const prompt = `Generate a ServiceNow Service Portal Widget for:

Application: ${request.appName}
Widget Name: ${ui.name}
Description: ${ui.description || ''}
Table: ${ui.table || 'task'}
Fields: ${ui.fields?.join(', ') || 'all fields'}

Generate a complete Service Portal Widget that includes:
1. AngularJS controller with proper scope management
2. HTML template with Bootstrap styling
3. CSS for custom styling
4. Server-side script for data processing
5. Option schema for configuration
6. Proper error handling
7. Responsive design
8. Performance optimization

The widget should follow Service Portal best practices.
Return JSON with all widget components.`;

    const response = await this.callClaude(prompt);
    const widgetData = JSON.parse(response);

    const formattedHTML = beautify.html(widgetData.template, {
      indent_size: 2,
      wrap_line_length: 120
    });

    const formattedCSS = beautify.css(widgetData.css || '', {
      indent_size: 2
    });

    const formattedJS = beautify.js(widgetData.controller, {
      indent_size: 2,
      space_in_empty_paren: true
    });

    return {
      sys_id: this.generateUniqueId('widget_'),
      name: this.validateServiceNowName(ui.name),
      title: ui.name,
      template: formattedHTML,
      css: formattedCSS,
      controller: formattedJS,
      script: widgetData.script || '',
      option_schema: JSON.stringify(widgetData.optionSchema || {}),
      demo_data: JSON.stringify(widgetData.demoData || {}),
      description: ui.description || `Widget for ${request.appName}`,
      public: false,
      sys_package: request.appScope,
      sys_scope: request.appScope,
      dependencies: widgetData.dependencies || '',
      servicenow: true,
      internal: false,
      has_preview: true
    };
  }

  private async generateForm(ui: any, request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate a ServiceNow Form configuration for:

Application: ${request.appName}
Form Name: ${ui.name}
Table: ${ui.table}
Fields: ${JSON.stringify(ui.fields || [])}
Layout: ${ui.layout || 'standard'}

Generate form configuration that includes:
1. Form layout sections
2. Field arrangements
3. Related lists configuration
4. Form actions and buttons
5. Field-specific configurations
6. Conditional field display
7. Form validation rules
8. UI policies if needed

Return JSON with complete form configuration.`;

    const response = await this.callClaude(prompt);
    const formData = JSON.parse(response);

    return {
      sys_id: this.generateUniqueId('form_'),
      name: ui.name,
      table: ui.table,
      view: 'default',
      sections: formData.sections || [],
      relatedLists: formData.relatedLists || [],
      uiActions: formData.uiActions || [],
      uiPolicies: formData.uiPolicies || [],
      sys_package: request.appScope,
      sys_scope: request.appScope
    };
  }

  private async generateList(ui: any, request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate a ServiceNow List configuration for:

Application: ${request.appName}
List Name: ${ui.name}
Table: ${ui.table}
Fields: ${JSON.stringify(ui.fields || [])}

Generate list configuration that includes:
1. Column configuration
2. List layout
3. Sorting and filtering
4. List actions
5. Context menu items
6. Performance optimizations
7. Access controls
8. Related list configurations

Return JSON with complete list configuration.`;

    const response = await this.callClaude(prompt);
    const listData = JSON.parse(response);

    return {
      sys_id: this.generateUniqueId('list_'),
      name: ui.name,
      table: ui.table,
      view: 'default',
      columns: listData.columns || [],
      filter: listData.filter || '',
      orderBy: listData.orderBy || '',
      groupBy: listData.groupBy || '',
      sys_package: request.appScope,
      sys_scope: request.appScope
    };
  }

  private async generateDashboardWidget(request: AppGenerationRequest): Promise<ServiceNowWidget> {
    const prompt = `Generate a ServiceNow Dashboard Widget for application overview:

Application: ${request.appName}
Description: ${request.appDescription}
Tables: ${request.requirements.tables?.map(t => t.name).join(', ') || 'none'}

Generate a dashboard widget that provides:
1. Application metrics and KPIs
2. Recent activity summary
3. Quick actions
4. Status indicators
5. Charts and visualizations
6. Responsive design
7. Real-time updates
8. Performance optimization

Use Chart.js or D3.js for visualizations.
Return JSON with complete widget configuration.`;

    const response = await this.callClaude(prompt);
    const widgetData = JSON.parse(response);

    const formattedHTML = beautify.html(widgetData.template, {
      indent_size: 2,
      wrap_line_length: 120
    });

    const formattedCSS = beautify.css(widgetData.css || '', {
      indent_size: 2
    });

    const formattedJS = beautify.js(widgetData.controller, {
      indent_size: 2,
      space_in_empty_paren: true
    });

    return {
      sys_id: this.generateUniqueId('dashboard_'),
      name: `${request.appName} Dashboard`,
      title: `${request.appName} Overview`,
      template: formattedHTML,
      css: formattedCSS,
      controller: formattedJS,
      script: widgetData.script || '',
      option_schema: JSON.stringify(widgetData.optionSchema || {}),
      description: `Dashboard widget for ${request.appName}`,
      public: false,
      sys_package: request.appScope,
      sys_scope: request.appScope,
      dependencies: 'chart.js',
      servicenow: true,
      internal: false,
      has_preview: true
    };
  }

  async generateMobileUI(request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate mobile-optimized UI components for:

Application: ${request.appName}
Requirements: ${JSON.stringify(request.requirements.ui || [])}

Generate mobile UI that includes:
1. Touch-optimized interfaces
2. Responsive layouts
3. Mobile-specific navigation
4. Gesture support
5. Performance optimization
6. Offline capability
7. Push notifications setup
8. Mobile form factors

Return JSON with mobile UI configurations.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async generateAccessibleUI(ui: any, request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate accessible UI components for:

UI Component: ${ui.name}
Type: ${ui.type}
Requirements: ${JSON.stringify(ui)}

Generate accessible UI that includes:
1. ARIA labels and roles
2. Keyboard navigation
3. Screen reader compatibility
4. High contrast support
5. Focus management
6. Semantic HTML
7. WCAG 2.1 compliance
8. Alternative text for images

Return JSON with accessible UI configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async optimizeUIPerformance(uiComponent: any): Promise<any> {
    const prompt = `Optimize this ServiceNow UI component for performance:

Component: ${JSON.stringify(uiComponent)}

Optimize for:
1. Loading speed
2. Runtime performance
3. Memory usage
4. Network requests
5. DOM manipulation
6. Event handling
7. Image optimization
8. Caching strategies

Return optimized component configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }
}