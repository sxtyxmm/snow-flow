/**
 * Widget Creator Agent
 * Specializes in creating ServiceNow Service Portal widgets
 */

import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { ServiceNowArtifact } from '../queen/types';

export class WidgetCreatorAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      type: 'widget-creator',
      capabilities: [
        'HTML template creation',
        'CSS styling and responsive design', 
        'Client-side JavaScript',
        'Server-side data processing',
        'Chart.js integration',
        'ServiceNow widget deployment',
        'Angular.js directives',
        'Bootstrap styling',
        'Data visualization'
      ],
      mcpTools: [
        'snow_deploy',
        'snow_preview_widget',
        'snow_widget_test',
        'snow_catalog_item_search',
        'snow_find_artifact'
      ],
      ...config
    });
  }

  async execute(instruction: string, context?: Record<string, any>): Promise<AgentResult> {
    try {
      this.setStatus('working');
      await this.reportProgress('Starting widget creation', 0);

      // Analyze widget requirements from instruction
      const requirements = await this.analyzeWidgetRequirements(instruction);
      await this.reportProgress('Analyzed requirements', 20);

      // Check for existing similar widgets
      const existingWidgets = await this.checkExistingWidgets(requirements);
      if (existingWidgets.length > 0) {
        await this.reportProgress('Found existing widgets to reference', 30);
      }

      // Create widget components
      const template = await this.createHTMLTemplate(requirements);
      await this.reportProgress('Created HTML template', 40);

      const css = await this.createCSS(requirements);
      await this.reportProgress('Created CSS styling', 50);

      const clientScript = await this.createClientScript(requirements);
      await this.reportProgress('Created client script', 60);

      const serverScript = await this.createServerScript(requirements);
      await this.reportProgress('Created server script', 70);

      // Generate demo data if needed
      const demoData = requirements.needsDemoData ? 
        await this.generateDemoData(requirements) : null;
      await this.reportProgress('Generated demo data', 80);

      // Create widget configuration
      const widgetConfig = {
        name: requirements.name,
        title: requirements.title || requirements.name,
        template,
        css,
        client_script: clientScript,
        server_script: serverScript,
        demo_data: demoData,
        description: requirements.description,
        category: requirements.category || 'custom'
      };

      // Create widget artifact
      const artifact: ServiceNowArtifact = {
        type: 'widget',
        name: requirements.name,
        config: widgetConfig,
        dependencies: requirements.dependencies || []
      };

      // Store artifact for other agents
      await this.storeArtifact(artifact);
      await this.reportProgress('Widget artifact created and stored', 90);

      // Prepare deployment instructions
      const deploymentInstructions = this.prepareDeploymentInstructions(widgetConfig);
      
      await this.reportProgress('Widget creation completed', 100);
      this.setStatus('completed');

      await this.logActivity('widget_creation', true, {
        widgetName: requirements.name,
        features: requirements.features
      });

      return {
        success: true,
        artifacts: [artifact],
        message: `Widget "${requirements.title}" created successfully`,
        metadata: {
          deploymentInstructions,
          features: requirements.features,
          dependencies: requirements.dependencies
        }
      };

    } catch (error) {
      this.setStatus('failed');
      await this.logActivity('widget_creation', false, { error: error.message });
      
      return {
        success: false,
        error: error as Error,
        message: `Failed to create widget: ${error.message}`
      };
    }
  }

  private async analyzeWidgetRequirements(instruction: string): Promise<any> {
    const requirements = {
      name: '',
      title: '',
      description: instruction,
      features: [] as string[],
      dataSource: '',
      needsChart: false,
      needsTable: false,
      needsForm: false,
      needsDemoData: true,
      isResponsive: true,
      dependencies: [] as string[],
      category: 'custom'
    };

    // Extract widget name
    const nameMatch = instruction.match(/(?:create|build|make)\s+(?:a\s+)?([a-zA-Z0-9_\s]+)\s*(?:widget|component)/i);
    if (nameMatch) {
      requirements.name = nameMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
      requirements.title = nameMatch[1].trim();
    }

    // Feature detection
    if (/chart|graph|visualization|analytics/i.test(instruction)) {
      requirements.needsChart = true;
      requirements.features.push('data-visualization');
      requirements.dependencies.push('Chart.js');
    }

    if (/table|list|grid|records/i.test(instruction)) {
      requirements.needsTable = true;
      requirements.features.push('data-table');
    }

    if (/form|input|submit|create/i.test(instruction)) {
      requirements.needsForm = true;
      requirements.features.push('form-input');
    }

    if (/incident/i.test(instruction)) {
      requirements.dataSource = 'incident';
      requirements.category = 'itsm';
    } else if (/request|catalog/i.test(instruction)) {
      requirements.dataSource = 'sc_request';
      requirements.category = 'service-catalog';
    } else if (/task/i.test(instruction)) {
      requirements.dataSource = 'task';
      requirements.category = 'task-management';
    }

    if (/real[\s-]?time|live|refresh/i.test(instruction)) {
      requirements.features.push('real-time-updates');
    }

    if (/mobile|responsive/i.test(instruction)) {
      requirements.features.push('mobile-optimized');
    }

    return requirements;
  }

  private async checkExistingWidgets(requirements: any): Promise<any[]> {
    // This would use snow_find_artifact to check for existing widgets
    // For now, return empty array as we're implementing the agent structure
    return [];
  }

  private async createHTMLTemplate(requirements: any): Promise<string> {
    let template = '<div class="widget-container">\n';
    
    // Add header
    template += `  <div class="widget-header">\n`;
    template += `    <h3>${requirements.title || 'Widget'}</h3>\n`;
    template += `  </div>\n`;
    
    template += '  <div class="widget-body">\n';

    // Add chart container if needed
    if (requirements.needsChart) {
      template += '    <div class="chart-container">\n';
      template += '      <canvas id="widgetChart" width="400" height="200"></canvas>\n';
      template += '    </div>\n';
    }

    // Add table if needed
    if (requirements.needsTable) {
      template += '    <div class="table-container">\n';
      template += '      <table class="table table-striped">\n';
      template += '        <thead>\n';
      template += '          <tr>\n';
      template += '            <th ng-repeat="col in data.columns">{{col.label}}</th>\n';
      template += '          </tr>\n';
      template += '        </thead>\n';
      template += '        <tbody>\n';
      template += '          <tr ng-repeat="row in data.rows">\n';
      template += '            <td ng-repeat="col in data.columns">{{row[col.field]}}</td>\n';
      template += '          </tr>\n';
      template += '        </tbody>\n';
      template += '      </table>\n';
      template += '    </div>\n';
    }

    // Add form if needed
    if (requirements.needsForm) {
      template += '    <form class="widget-form" ng-submit="submitForm()">\n';
      template += '      <div class="form-group">\n';
      template += '        <input type="text" class="form-control" ng-model="formData.input" placeholder="Enter value">\n';
      template += '      </div>\n';
      template += '      <button type="submit" class="btn btn-primary">Submit</button>\n';
      template += '    </form>\n';
    }

    template += '  </div>\n';
    template += '</div>';

    return template;
  }

  private async createCSS(requirements: any): Promise<string> {
    let css = `/* ${requirements.title} Widget Styles */\n\n`;
    
    css += '.widget-container {\n';
    css += '  padding: 15px;\n';
    css += '  background-color: #fff;\n';
    css += '  border-radius: 4px;\n';
    css += '  box-shadow: 0 1px 3px rgba(0,0,0,0.12);\n';
    css += '}\n\n';

    css += '.widget-header {\n';
    css += '  margin-bottom: 20px;\n';
    css += '  padding-bottom: 10px;\n';
    css += '  border-bottom: 1px solid #e7e7e7;\n';
    css += '}\n\n';

    css += '.widget-header h3 {\n';
    css += '  margin: 0;\n';
    css += '  color: #333;\n';
    css += '  font-size: 18px;\n';
    css += '  font-weight: 600;\n';
    css += '}\n\n';

    if (requirements.needsChart) {
      css += '.chart-container {\n';
      css += '  position: relative;\n';
      css += '  height: 300px;\n';
      css += '  margin-bottom: 20px;\n';
      css += '}\n\n';
    }

    if (requirements.needsTable) {
      css += '.table-container {\n';
      css += '  overflow-x: auto;\n';
      css += '  margin-bottom: 20px;\n';
      css += '}\n\n';
      
      css += '.table {\n';
      css += '  width: 100%;\n';
      css += '  margin-bottom: 0;\n';
      css += '}\n\n';
    }

    if (requirements.isResponsive) {
      css += '/* Responsive styles */\n';
      css += '@media (max-width: 768px) {\n';
      css += '  .widget-container {\n';
      css += '    padding: 10px;\n';
      css += '  }\n';
      css += '  \n';
      css += '  .widget-header h3 {\n';
      css += '    font-size: 16px;\n';
      css += '  }\n';
      css += '}\n';
    }

    return css;
  }

  private async createClientScript(requirements: any): Promise<string> {
    let script = 'function WidgetController($scope, $http, $timeout) {\n';
    script += '  var c = this;\n\n';
    
    // Initialize data
    script += '  // Initialize widget data\n';
    script += '  c.data = c.data || {};\n';
    script += '  $scope.data = c.data;\n\n';

    if (requirements.needsChart) {
      script += '  // Chart initialization\n';
      script += '  $timeout(function() {\n';
      script += '    if (c.data.chartData) {\n';
      script += '      initializeChart(c.data.chartData);\n';
      script += '    }\n';
      script += '  }, 100);\n\n';
      
      script += '  function initializeChart(chartData) {\n';
      script += '    var ctx = document.getElementById("widgetChart").getContext("2d");\n';
      script += '    new Chart(ctx, {\n';
      script += '      type: chartData.type || "bar",\n';
      script += '      data: chartData,\n';
      script += '      options: {\n';
      script += '        responsive: true,\n';
      script += '        maintainAspectRatio: false\n';
      script += '      }\n';
      script += '    });\n';
      script += '  }\n\n';
    }

    if (requirements.needsForm) {
      script += '  // Form submission\n';
      script += '  $scope.formData = {};\n';
      script += '  $scope.submitForm = function() {\n';
      script += '    c.server.get({\n';
      script += '      action: "submit",\n';
      script += '      data: $scope.formData\n';
      script += '    }).then(function(response) {\n';
      script += '      // Handle response\n';
      script += '      if (response.data.success) {\n';
      script += '        $scope.formData = {};\n';
      script += '        // Refresh data if needed\n';
      script += '      }\n';
      script += '    });\n';
      script += '  };\n\n';
    }

    if (requirements.features.includes('real-time-updates')) {
      script += '  // Real-time updates\n';
      script += '  var refreshInterval = $timeout(function refresh() {\n';
      script += '    c.server.get({ action: "refresh" }).then(function(response) {\n';
      script += '      c.data = response.data;\n';
      script += '      $scope.data = c.data;\n';
      script += '      refreshInterval = $timeout(refresh, 30000); // Refresh every 30 seconds\n';
      script += '    });\n';
      script += '  }, 30000);\n\n';
      
      script += '  $scope.$on("$destroy", function() {\n';
      script += '    if (refreshInterval) {\n';
      script += '      $timeout.cancel(refreshInterval);\n';
      script += '    }\n';
      script += '  });\n';
    }

    script += '}';

    return script;
  }

  private async createServerScript(requirements: any): Promise<string> {
    let script = '(function() {\n';
    script += '  /* Server Script for ' + requirements.title + ' */\n\n';
    
    script += '  try {\n';
    
    // Handle different actions
    script += '    var action = input.action || "load";\n';
    script += '    gs.log("Widget action: " + action, "' + requirements.name + '");\n\n';
    
    script += '    if (action === "load") {\n';
    script += '      loadWidgetData();\n';
    script += '    } else if (action === "refresh") {\n';
    script += '      loadWidgetData();\n';
    script += '    } else if (action === "submit") {\n';
    script += '      handleFormSubmission();\n';
    script += '    }\n\n';

    // Load data function
    script += '    function loadWidgetData() {\n';
    script += '      try {\n';
    script += '        data.title = "' + requirements.title + '";\n';
    script += '        gs.log("Loading widget data for: " + data.title, "' + requirements.name + '");\n';
    
    if (requirements.dataSource) {
      script += '        \n        // Query ' + requirements.dataSource + ' table\n';
      script += '        var gr = new GlideRecord("' + requirements.dataSource + '");\n';
      script += '        gr.addQuery("active", "true"); // ✅ FIXED: Use string instead of boolean\n';
      script += '        gr.orderByDesc("sys_created_on");\n';
      script += '        gr.setLimit(10);\n';
      script += '        gr.query();\n';
      script += '        \n        var recordCount = gr.getRowCount();\n';
      script += '        gs.log("Found " + recordCount + " active records", "' + requirements.name + '");\n\n';
      
      if (requirements.needsTable) {
        script += '        // Prepare table data\n';
        script += '        data.columns = [\n';
        script += '          { field: "number", label: "Number" },\n';
        script += '          { field: "short_description", label: "Description" },\n';
        script += '          { field: "state", label: "State" },\n';
        script += '          { field: "caller", label: "Caller" }\n';
        script += '        ];\n';
        script += '        data.rows = [];\n\n';
        
        script += '        while (gr.next()) {\n';
        script += '          var row = {\n';
        script += '            sys_id: gr.getUniqueValue(),\n';
        script += '            number: gr.getValue("number") || "",\n';
        script += '            short_description: gr.getValue("short_description") || "",\n';
        script += '            state: gr.getDisplayValue("state") || "Unknown",\n';
        script += '            caller: ""\n';
        script += '          };\n\n';
        
        script += '          // ✅ FIXED: Safe caller info lookup with proper null checks\n';
        script += '          if (gr.caller_id && !gr.caller_id.nil()) {\n';
        script += '            try {\n';
        script += '              var callerGr = new GlideRecord("sys_user");\n';
        script += '              if (callerGr.get(gr.caller_id.toString())) {\n';
        script += '                // ✅ FIXED: Name field with fallback\n';
        script += '                var callerName = callerGr.getDisplayValue("name");\n';
        script += '                if (!callerName) {\n';
        script += '                  var firstName = callerGr.getValue("first_name") || "";\n';
        script += '                  var lastName = callerGr.getValue("last_name") || "";\n';
        script += '                  callerName = (firstName + " " + lastName).trim() || "Unknown User";\n';
        script += '                }\n';
        script += '                row.caller = callerName;\n';
        script += '              } else {\n';
        script += '                row.caller = "User Not Found";\n';
        script += '              }\n';
        script += '            } catch (callerError) {\n';
        script += '              gs.warn("Error fetching caller info: " + callerError.message, "' + requirements.name + '");\n';
        script += '              row.caller = "Error Loading User";\n';
        script += '            }\n';
        script += '          } else {\n';
        script += '            row.caller = "No Caller";\n';
        script += '          }\n\n';
        
        script += '          data.rows.push(row);\n';
        script += '        }\n';
        script += '        \n        gs.log("Processed " + data.rows.length + " table rows", "' + requirements.name + '");\n';
      }
      
      if (requirements.needsChart) {
        script += '        \n        // Prepare chart data\n';
        script += '        var chartData = {\n';
        script += '          type: "bar",\n';
        script += '          labels: [],\n';
        script += '          datasets: [{\n';
        script += '            label: "' + requirements.dataSource + ' by State",\n';
        script += '            data: [],\n';
        script += '            backgroundColor: ["#428bca", "#5cb85c", "#d9534f", "#f0ad4e"]\n';
        script += '          }]\n';
        script += '        };\n\n';
        
        script += '        // Aggregate data for chart\n';
        script += '        var stateCount = {};\n';
        script += '        gr.rewind();\n';
        script += '        while (gr.next()) {\n';
        script += '          var state = gr.getDisplayValue("state") || "Unknown";\n';
        script += '          stateCount[state] = (stateCount[state] || 0) + 1;\n';
        script += '        }\n\n';
        
        script += '        for (var state in stateCount) {\n';
        script += '          chartData.labels.push(state);\n';
        script += '          chartData.datasets[0].data.push(stateCount[state]);\n';
        script += '        }\n';
        script += '        data.chartData = chartData;\n';
        script += '        gs.log("Chart prepared with " + chartData.labels.length + " categories", "' + requirements.name + '");\n';
      }
    }
    
    script += '      } catch (loadError) {\n';
    script += '        gs.error("Error loading widget data: " + loadError.message, "' + requirements.name + '");\n';
    script += '        data.error = "Error loading data: " + loadError.message;\n';
    script += '        data.success = false;\n';
    script += '      }\n';
    script += '    }\n\n';

    if (requirements.needsForm) {
      script += '    function handleFormSubmission() {\n';
      script += '      try {\n';
      script += '        var formData = input.data || {};\n';
      script += '        gs.log("Processing form submission", "' + requirements.name + '");\n';
      script += '        \n';
      script += '        // ✅ FIXED: Validate form data\n';
      script += '        if (!formData || Object.keys(formData).length === 0) {\n';
      script += '          throw new Error("No form data provided");\n';
      script += '        }\n';
      script += '        \n';
      script += '        // Process form submission\n';
      script += '        // Add your form processing logic here\n';
      script += '        \n';
      script += '        data.success = true;\n';
      script += '        data.message = "Form submitted successfully";\n';
      script += '        gs.log("Form submission successful", "' + requirements.name + '");\n';
      script += '      } catch (formError) {\n';
      script += '        gs.error("Error processing form: " + formError.message, "' + requirements.name + '");\n';
      script += '        data.success = false;\n';
      script += '        data.error = "Form submission failed: " + formError.message;\n';
      script += '      }\n';
      script += '    }\n';
    }

    script += '  } catch (error) {\n';
    script += '    gs.error("Critical widget error: " + error.message, "' + requirements.name + '");\n';
    script += '    data.error = "Widget error: " + error.message;\n';
    script += '    data.success = false;\n';
    script += '  }\n';
    script += '})();';

    return script;
  }

  private async generateDemoData(requirements: any): Promise<any> {
    const demoData: any = {};

    if (requirements.needsTable) {
      demoData.rows = [
        { number: 'INC0010001', short_description: 'Network connectivity issue', state: 'Open' },
        { number: 'INC0010002', short_description: 'Software installation request', state: 'In Progress' },
        { number: 'INC0010003', short_description: 'Password reset', state: 'Resolved' }
      ];
    }

    if (requirements.needsChart) {
      demoData.chartData = {
        type: 'bar',
        labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
        datasets: [{
          label: 'Records by State',
          data: [12, 8, 15, 5],
          backgroundColor: ['#428bca', '#5cb85c', '#f0ad4e', '#d9534f']
        }]
      };
    }

    return demoData;
  }

  private prepareDeploymentInstructions(widgetConfig: any): any {
    return {
      mcpTool: 'snow_deploy',
      parameters: {
        type: 'widget',
        config: widgetConfig
      },
      validationSteps: [
        'Preview widget using snow_preview_widget',
        'Test widget functionality with snow_widget_test',
        'Verify responsive design on mobile devices',
        'Check data binding and server script execution'
      ]
    };
  }
}