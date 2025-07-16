#!/usr/bin/env node
/**
 * Direct ServiceNow Widget Creator
 * Creates widgets directly in ServiceNow without Claude Code orchestration
 */

import { ServiceNowClient } from '../utils/servicenow-client.js';
import { ServiceNowOAuth } from '../utils/snow-oauth.js';
import { Logger } from '../utils/logger.js';

interface WidgetCreationOptions {
  name: string;
  title: string;
  description: string;
  category: string;
}

export class DirectWidgetCreator {
  private client: ServiceNowClient;
  private oauth: ServiceNowOAuth;
  private logger: Logger;

  constructor() {
    this.client = new ServiceNowClient();
    this.oauth = new ServiceNowOAuth();
    this.logger = new Logger('DirectWidgetCreator');
  }

  async createIncidentManagementWidget(): Promise<void> {
    try {
      console.log('🚀 Creating Incident Management Widget directly in ServiceNow...\n');

      // Check authentication
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        console.error('❌ Not authenticated with ServiceNow. Please run "snow-flow auth login" first.');
        return;
      }

      // Widget configuration
      const widgetConfig = {
        name: 'incident_management_dashboard',
        id: 'incident_management_dashboard',
        title: 'Incident Management Dashboard',
        description: 'Comprehensive dashboard for managing and monitoring incidents',
        category: 'incident',
        template: this.getWidgetTemplate(),
        css: this.getWidgetCSS(),
        client_script: this.getClientScript(),
        server_script: this.getServerScript(),
        option_schema: JSON.stringify(this.getOptionSchema()),
        roles: '',
        public: true,
        active: true
      };

      console.log('📝 Widget Details:');
      console.log(`   Name: ${widgetConfig.title}`);
      console.log(`   ID: ${widgetConfig.id}`);
      console.log(`   Description: ${widgetConfig.description}\n`);

      // Create widget in ServiceNow
      console.log('🔄 Creating widget in ServiceNow...');
      const result = await this.client.createWidget(widgetConfig);

      if (result.success && result.data) {
        console.log('✅ Widget created successfully!');
        console.log(`📊 Widget Sys ID: ${result.data.sys_id}`);
        console.log(`🔗 Widget URL: https://${(await this.oauth.loadCredentials())?.instance}/sp_config?id=widget_editor&sys_id=${result.data.sys_id}`);
        
        console.log('\n📋 Next Steps:');
        console.log('   1. Open the widget editor URL above');
        console.log('   2. Test the widget in Service Portal');
        console.log('   3. Add the widget to a portal page');
        console.log('   4. Configure widget instance options as needed');
      } else {
        console.error('❌ Failed to create widget:', result.error);
      }

    } catch (error) {
      console.error('❌ Error creating widget:', error);
      this.logger.error('Widget creation failed', error);
    }
  }

  private getWidgetTemplate(): string {
    return `<div class="incident-management-widget">
  <!-- Widget Header -->
  <div class="widget-header">
    <h2 class="widget-title">
      <i class="fa fa-exclamation-triangle"></i> Incident Management Dashboard
    </h2>
    <div class="header-actions">
      <button class="btn btn-primary" ng-click="c.createNewIncident()">
        <i class="fa fa-plus"></i> New Incident
      </button>
      <button class="btn btn-default" ng-click="c.refreshData()">
        <i class="fa fa-refresh"></i> Refresh
      </button>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="summary-cards">
    <div class="summary-card critical">
      <div class="card-value">{{c.data.criticalCount || 0}}</div>
      <div class="card-label">Critical</div>
      <div class="card-icon"><i class="fa fa-fire"></i></div>
    </div>
    <div class="summary-card high">
      <div class="card-value">{{c.data.highCount || 0}}</div>
      <div class="card-label">High Priority</div>
      <div class="card-icon"><i class="fa fa-exclamation-circle"></i></div>
    </div>
    <div class="summary-card medium">
      <div class="card-value">{{c.data.mediumCount || 0}}</div>
      <div class="card-label">Medium Priority</div>
      <div class="card-icon"><i class="fa fa-minus-circle"></i></div>
    </div>
    <div class="summary-card total">
      <div class="card-value">{{c.data.totalOpen || 0}}</div>
      <div class="card-label">Total Open</div>
      <div class="card-icon"><i class="fa fa-list"></i></div>
    </div>
  </div>

  <!-- Incidents Table -->
  <div class="incidents-section">
    <h3>Recent Incidents</h3>
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Number</th>
            <th>Priority</th>
            <th>Short Description</th>
            <th>Assigned To</th>
            <th>State</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr ng-repeat="incident in c.data.incidents" ng-click="c.openIncident(incident)">
            <td>{{incident.number}}</td>
            <td><span class="priority-badge priority-{{incident.priority}}">{{incident.priority_label}}</span></td>
            <td>{{incident.short_description}}</td>
            <td>{{incident.assigned_to_display}}</td>
            <td><span class="state-badge state-{{incident.state}}">{{incident.state_label}}</span></td>
            <td>{{incident.sys_updated_on_relative}}</td>
            <td>
              <button class="btn btn-sm btn-default" ng-click="c.viewIncident(incident); $event.stopPropagation();">
                <i class="fa fa-eye"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Pagination -->
    <div class="pagination-controls" ng-if="c.data.totalCount > c.data.pageSize">
      <sp-pagination 
        total="c.data.totalCount" 
        page-size="c.data.pageSize" 
        current="c.data.currentPage"
        on-click="c.changePage">
      </sp-pagination>
    </div>
  </div>
</div>`;
  }

  private getWidgetCSS(): string {
    return `.incident-management-widget {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  padding: 20px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.widget-title {
  margin: 0;
  font-size: 24px;
  color: #293e40;
}

.header-actions button {
  margin-left: 10px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.card-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
}

.card-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  opacity: 0.1;
}

/* Priority Colors */
.summary-card.critical {
  border-left: 4px solid #d9534f;
}
.summary-card.critical .card-value {
  color: #d9534f;
}

.summary-card.high {
  border-left: 4px solid #f0ad4e;
}
.summary-card.high .card-value {
  color: #f0ad4e;
}

.summary-card.medium {
  border-left: 4px solid #5bc0de;
}
.summary-card.medium .card-value {
  color: #5bc0de;
}

.summary-card.total {
  border-left: 4px solid #5cb85c;
}
.summary-card.total .card-value {
  color: #5cb85c;
}

/* Table Styles */
.incidents-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.incidents-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #293e40;
}

.table-responsive {
  margin-bottom: 20px;
}

.priority-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.priority-1 { background: #d9534f; color: white; }
.priority-2 { background: #f0ad4e; color: white; }
.priority-3 { background: #5bc0de; color: white; }
.priority-4 { background: #5cb85c; color: white; }
.priority-5 { background: #777; color: white; }

.state-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.state-1 { background: #337ab7; color: white; }
.state-2 { background: #f0ad4e; color: white; }
.state-3 { background: #5cb85c; color: white; }
.state-6 { background: #777; color: white; }
.state-7 { background: #333; color: white; }`;
  }

  private getClientScript(): string {
    return `function IncidentManagementController($scope, $location, spUtil) {
  var c = this;
  
  // Initialize data
  c.data = c.data || {};
  
  // Refresh data
  c.refreshData = function() {
    c.server.get({
      action: 'refresh_data'
    }).then(function(response) {
      c.data = response.data;
      spUtil.addInfoMessage('Data refreshed successfully');
    });
  };
  
  // Create new incident
  c.createNewIncident = function() {
    $location.url('?id=form&table=incident&sys_id=-1');
  };
  
  // View incident details
  c.viewIncident = function(incident) {
    $location.url('?id=form&table=incident&sys_id=' + incident.sys_id);
  };
  
  // Open incident record
  c.openIncident = function(incident) {
    c.viewIncident(incident);
  };
  
  // Change page
  c.changePage = function(page) {
    c.data.currentPage = page;
    c.server.get({
      action: 'get_incidents',
      page: page
    }).then(function(response) {
      c.data.incidents = response.data.incidents;
    });
  };
}`;
  }

  private getServerScript(): string {
    return `(function() {
  // Initialize data object
  data.incidents = [];
  data.criticalCount = 0;
  data.highCount = 0;
  data.mediumCount = 0;
  data.totalOpen = 0;
  data.pageSize = options.page_size || 10;
  data.currentPage = input.page || 1;
  
  // Handle actions
  if (input.action === 'refresh_data' || !input.action) {
    // Get incident counts by priority
    var grCount = new GlideAggregate('incident');
    grCount.addQuery('active', true);
    grCount.addAggregate('COUNT', 'priority');
    grCount.groupBy('priority');
    grCount.query();
    
    while (grCount.next()) {
      var priority = grCount.getValue('priority');
      var count = parseInt(grCount.getAggregate('COUNT', 'priority'));
      
      switch(priority) {
        case '1': data.criticalCount = count; break;
        case '2': data.highCount = count; break;
        case '3': data.mediumCount = count; break;
      }
      data.totalOpen += count;
    }
    
    // Get recent incidents
    var grIncidents = new GlideRecord('incident');
    grIncidents.addQuery('active', true);
    grIncidents.orderByDesc('sys_updated_on');
    grIncidents.setLimit(data.pageSize);
    grIncidents.chooseWindow((data.currentPage - 1) * data.pageSize, data.currentPage * data.pageSize);
    grIncidents.query();
    
    while (grIncidents.next()) {
      var incident = {
        sys_id: grIncidents.getUniqueValue(),
        number: grIncidents.getValue('number'),
        short_description: grIncidents.getValue('short_description'),
        priority: grIncidents.getValue('priority'),
        priority_label: grIncidents.getDisplayValue('priority'),
        state: grIncidents.getValue('state'),
        state_label: grIncidents.getDisplayValue('state'),
        assigned_to: grIncidents.getValue('assigned_to'),
        assigned_to_display: grIncidents.getDisplayValue('assigned_to'),
        sys_updated_on: grIncidents.getValue('sys_updated_on'),
        sys_updated_on_relative: grIncidents.getDisplayValue('sys_updated_on')
      };
      data.incidents.push(incident);
    }
    
    // Get total count for pagination
    var grTotal = new GlideAggregate('incident');
    grTotal.addQuery('active', true);
    grTotal.addAggregate('COUNT');
    grTotal.query();
    if (grTotal.next()) {
      data.totalCount = parseInt(grTotal.getAggregate('COUNT'));
    }
  }
})();`;
  }

  private getOptionSchema(): any[] {
    return [
      {
        name: 'page_size',
        label: 'Page Size',
        type: 'integer',
        default_value: '10',
        hint: 'Number of incidents to display per page'
      },
      {
        name: 'auto_refresh',
        label: 'Auto Refresh',
        type: 'boolean',
        default_value: 'false',
        hint: 'Automatically refresh data every 30 seconds'
      },
      {
        name: 'show_closed',
        label: 'Show Closed Incidents',
        type: 'boolean',
        default_value: 'false',
        hint: 'Include closed incidents in the display'
      }
    ];
  }
}

// Export for use in other modules
export default DirectWidgetCreator;