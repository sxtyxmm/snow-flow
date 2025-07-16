#!/usr/bin/env node

import { ServiceNowClient, ServiceNowWidget } from '../utils/servicenow-client';

/**
 * Incident Management Dashboard Widget
 * A comprehensive widget for visualizing incident data with charts, cards, and real-time updates
 */

export class IncidentDashboardWidget {
  private client: ServiceNowClient;
  private widgetId = 'incident-dashboard-widget';
  private widgetName = 'Incident Management Dashboard';

  constructor() {
    this.client = new ServiceNowClient();
  }

  /**
   * Create the complete incident dashboard widget
   */
  async createWidget(): Promise<void> {
    console.log('🎨 Creating Incident Management Dashboard Widget...');
    
    const widget: ServiceNowWidget = {
      name: this.widgetName,
      id: this.widgetId,
      title: 'Incident Management Dashboard',
      description: 'A comprehensive dashboard for managing incidents with visual charts, priority indicators, and real-time updates',
      category: 'incident',
      template: this.getTemplate(),
      css: this.getCSS(),
      client_script: this.getClientScript(),
      server_script: this.getServerScript(),
      option_schema: this.getOptionSchema(),
      demo_data: this.getDemoData(),
      has_preview: true
    };

    try {
      const result = await this.client.createWidget(widget);
      
      if (result.success) {
        console.log('✅ Incident Dashboard Widget created successfully!');
        console.log(`🆔 Widget ID: ${result.data?.sys_id}`);
        console.log(`🔗 Widget URL: https://${process.env.SERVICENOW_INSTANCE}/sp_config/?id=widget_editor&sys_id=${result.data?.sys_id}`);
      } else {
        console.error('❌ Failed to create widget:', result.error);
      }
    } catch (error) {
      console.error('❌ Error creating widget:', error);
    }
  }

  /**
   * Widget HTML Template
   */
  private getTemplate(): string {
    return `
<div class="incident-dashboard" ng-controller="IncidentDashboardController">
  <!-- Header Section -->
  <div class="dashboard-header">
    <h2 class="dashboard-title">
      <i class="fa fa-exclamation-triangle"></i>
      Incident Management Dashboard
    </h2>
    <div class="last-updated">
      <i class="fa fa-clock-o"></i>
      Last updated: {{lastUpdated | date:'short'}}
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="row summary-cards">
    <div class="col-md-3 col-sm-6">
      <div class="summary-card critical-card" ng-click="filterByPriority('1')">
        <div class="card-icon">
          <i class="fa fa-fire"></i>
        </div>
        <div class="card-content">
          <h3>{{summary.critical}}</h3>
          <p>Critical</p>
        </div>
        <div class="card-trend" ng-class="{'trend-up': summary.criticalTrend > 0, 'trend-down': summary.criticalTrend < 0}">
          <i class="fa" ng-class="{'fa-arrow-up': summary.criticalTrend > 0, 'fa-arrow-down': summary.criticalTrend < 0}"></i>
          {{summary.criticalTrend}}%
        </div>
      </div>
    </div>
    
    <div class="col-md-3 col-sm-6">
      <div class="summary-card high-card" ng-click="filterByPriority('2')">
        <div class="card-icon">
          <i class="fa fa-exclamation-circle"></i>
        </div>
        <div class="card-content">
          <h3>{{summary.high}}</h3>
          <p>High Priority</p>
        </div>
        <div class="card-trend" ng-class="{'trend-up': summary.highTrend > 0, 'trend-down': summary.highTrend < 0}">
          <i class="fa" ng-class="{'fa-arrow-up': summary.highTrend > 0, 'fa-arrow-down': summary.highTrend < 0}"></i>
          {{summary.highTrend}}%
        </div>
      </div>
    </div>
    
    <div class="col-md-3 col-sm-6">
      <div class="summary-card medium-card" ng-click="filterByPriority('3')">
        <div class="card-icon">
          <i class="fa fa-exclamation"></i>
        </div>
        <div class="card-content">
          <h3>{{summary.medium}}</h3>
          <p>Medium Priority</p>
        </div>
        <div class="card-trend" ng-class="{'trend-up': summary.mediumTrend > 0, 'trend-down': summary.mediumTrend < 0}">
          <i class="fa" ng-class="{'fa-arrow-up': summary.mediumTrend > 0, 'fa-arrow-down': summary.mediumTrend < 0}"></i>
          {{summary.mediumTrend}}%
        </div>
      </div>
    </div>
    
    <div class="col-md-3 col-sm-6">
      <div class="summary-card low-card" ng-click="filterByPriority('4')">
        <div class="card-icon">
          <i class="fa fa-info-circle"></i>
        </div>
        <div class="card-content">
          <h3>{{summary.low}}</h3>
          <p>Low Priority</p>
        </div>
        <div class="card-trend" ng-class="{'trend-up': summary.lowTrend > 0, 'trend-down': summary.lowTrend < 0}">
          <i class="fa" ng-class="{'fa-arrow-up': summary.lowTrend > 0, 'fa-arrow-down': summary.lowTrend < 0}"></i>
          {{summary.lowTrend}}%
        </div>
      </div>
    </div>
  </div>

  <!-- Charts Section -->
  <div class="row charts-section">
    <div class="col-md-6">
      <div class="chart-container">
        <h4>Incident Status Distribution</h4>
        <canvas id="statusChart" width="400" height="200"></canvas>
      </div>
    </div>
    <div class="col-md-6">
      <div class="chart-container">
        <h4>Priority Distribution</h4>
        <canvas id="priorityChart" width="400" height="200"></canvas>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="row filters-section">
    <div class="col-md-12">
      <div class="filter-container">
        <div class="filter-group">
          <label>Priority:</label>
          <select ng-model="filters.priority" ng-change="applyFilters()">
            <option value="">All</option>
            <option value="1">Critical</option>
            <option value="2">High</option>
            <option value="3">Medium</option>
            <option value="4">Low</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>State:</label>
          <select ng-model="filters.state" ng-change="applyFilters()">
            <option value="">All</option>
            <option value="1">New</option>
            <option value="2">In Progress</option>
            <option value="3">On Hold</option>
            <option value="6">Resolved</option>
            <option value="7">Closed</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Assignment Group:</label>
          <select ng-model="filters.assignmentGroup" ng-change="applyFilters()">
            <option value="">All</option>
            <option ng-repeat="group in assignmentGroups" value="{{group.sys_id}}">{{group.name}}</option>
          </select>
        </div>
        
        <div class="filter-group">
          <button class="btn btn-primary" ng-click="refreshData()">
            <i class="fa fa-refresh"></i> Refresh
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Incidents Table -->
  <div class="row incidents-table-section">
    <div class="col-md-12">
      <div class="table-container">
        <h4>Recent Incidents ({{filteredIncidents.length}})</h4>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th ng-click="sortBy('number')">Number 
                  <i class="fa" ng-class="{'fa-sort-up': sortField === 'number' && sortDesc, 'fa-sort-down': sortField === 'number' && !sortDesc, 'fa-sort': sortField !== 'number'}"></i>
                </th>
                <th ng-click="sortBy('priority')">Priority 
                  <i class="fa" ng-class="{'fa-sort-up': sortField === 'priority' && sortDesc, 'fa-sort-down': sortField === 'priority' && !sortDesc, 'fa-sort': sortField !== 'priority'}"></i>
                </th>
                <th ng-click="sortBy('state')">State 
                  <i class="fa" ng-class="{'fa-sort-up': sortField === 'state' && sortDesc, 'fa-sort-down': sortField === 'state' && !sortDesc, 'fa-sort': sortField !== 'state'}"></i>
                </th>
                <th>Short Description</th>
                <th ng-click="sortBy('assigned_to')">Assigned To 
                  <i class="fa" ng-class="{'fa-sort-up': sortField === 'assigned_to' && sortDesc, 'fa-sort-down': sortField === 'assigned_to' && !sortDesc, 'fa-sort': sortField !== 'assigned_to'}"></i>
                </th>
                <th ng-click="sortBy('opened_at')">Opened 
                  <i class="fa" ng-class="{'fa-sort-up': sortField === 'opened_at' && sortDesc, 'fa-sort-down': sortField === 'opened_at' && !sortDesc, 'fa-sort': sortField !== 'opened_at'}"></i>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="incident in filteredIncidents | orderBy:sortField:sortDesc | limitTo:options.recordLimit" 
                  ng-class="{'critical-row': incident.priority == '1', 'high-row': incident.priority == '2', 'medium-row': incident.priority == '3', 'low-row': incident.priority == '4'}">
                <td>
                  <a href="javascript:void(0)" ng-click="openIncident(incident.sys_id)">
                    {{incident.number}}
                  </a>
                </td>
                <td>
                  <span class="priority-badge priority-{{incident.priority}}">
                    {{getPriorityLabel(incident.priority)}}
                  </span>
                </td>
                <td>
                  <span class="state-badge state-{{incident.state}}">
                    {{getStateLabel(incident.state)}}
                  </span>
                </td>
                <td>
                  <span title="{{incident.short_description}}">
                    {{incident.short_description | limitTo:50}}{{incident.short_description.length > 50 ? '...' : ''}}
                  </span>
                </td>
                <td>{{incident.assigned_to_display_value || 'Unassigned'}}</td>
                <td>
                  <span title="{{incident.opened_at | date:'full'}}">
                    {{incident.opened_at | date:'short'}}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" ng-click="openIncident(incident.sys_id)" title="View Incident">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" ng-click="assignToMe(incident)" title="Assign to Me" ng-if="!incident.assigned_to">
                      <i class="fa fa-user"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination-info" ng-if="filteredIncidents.length > options.recordLimit">
          Showing {{options.recordLimit}} of {{filteredIncidents.length}} incidents
        </div>
      </div>
    </div>
  </div>
</div>
    `;
  }

  /**
   * Widget CSS Styling
   */
  private getCSS(): string {
    return `
.incident-dashboard {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  font-family: 'Source Sans Pro', sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
}

.dashboard-title {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.dashboard-title i {
  color: #e74c3c;
  margin-right: 10px;
}

.last-updated {
  color: #6c757d;
  font-size: 14px;
}

.summary-cards {
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2980b9);
}

.critical-card::before {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
}

.high-card::before {
  background: linear-gradient(90deg, #f39c12, #e67e22);
}

.medium-card::before {
  background: linear-gradient(90deg, #f1c40f, #f39c12);
}

.low-card::before {
  background: linear-gradient(90deg, #2ecc71, #27ae60);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.critical-card .card-icon {
  color: #e74c3c;
}

.high-card .card-icon {
  color: #f39c12;
}

.medium-card .card-icon {
  color: #f1c40f;
}

.low-card .card-icon {
  color: #2ecc71;
}

.card-content h3 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.card-content p {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
  font-weight: 500;
}

.card-trend {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 14px;
  font-weight: 600;
}

.trend-up {
  color: #e74c3c;
}

.trend-down {
  color: #2ecc71;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-container {
  background: white;
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chart-container h4 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.filters-section {
  margin-bottom: 30px;
}

.filter-container {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  min-width: 120px;
}

.filter-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-success {
  background: #2ecc71;
  color: white;
}

.btn-success:hover {
  background: #27ae60;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.table-container {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table-container h4 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.table {
  margin-bottom: 0;
}

.table thead th {
  background: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
  cursor: pointer;
  padding: 15px;
}

.table thead th:hover {
  background: #e9ecef;
}

.table tbody td {
  padding: 12px 15px;
  vertical-align: middle;
  border-bottom: 1px solid #dee2e6;
}

.table tbody tr:hover {
  background: #f8f9fa;
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.priority-1 {
  background: #e74c3c;
}

.priority-2 {
  background: #f39c12;
}

.priority-3 {
  background: #f1c40f;
}

.priority-4 {
  background: #2ecc71;
}

.state-badge {
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.state-1 {
  background: #3498db;
}

.state-2 {
  background: #f39c12;
}

.state-3 {
  background: #e67e22;
}

.state-6 {
  background: #2ecc71;
}

.state-7 {
  background: #95a5a6;
}

.critical-row {
  border-left: 4px solid #e74c3c;
}

.high-row {
  border-left: 4px solid #f39c12;
}

.medium-row {
  border-left: 4px solid #f1c40f;
}

.low-row {
  border-left: 4px solid #2ecc71;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.pagination-info {
  text-align: center;
  margin-top: 20px;
  color: #6c757d;
  font-size: 14px;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .filter-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .summary-card {
    margin-bottom: 15px;
  }
  
  .card-content h3 {
    font-size: 28px;
  }
  
  .table-responsive {
    overflow-x: auto;
  }
}
    `;
  }

  /**
   * Widget Client Script (AngularJS)
   */
  private getClientScript(): string {
    return `
function IncidentDashboardController($scope, $http, spUtil) {
  var c = this;
  
  // Initialize scope variables
  $scope.incidents = [];
  $scope.filteredIncidents = [];
  $scope.summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    criticalTrend: 0,
    highTrend: 0,
    mediumTrend: 0,
    lowTrend: 0
  };
  $scope.assignmentGroups = [];
  $scope.filters = {
    priority: '',
    state: '',
    assignmentGroup: ''
  };
  $scope.sortField = 'opened_at';
  $scope.sortDesc = true;
  $scope.lastUpdated = new Date();
  
  // Get data from server
  $scope.incidents = c.data.incidents || [];
  $scope.assignmentGroups = c.data.assignmentGroups || [];
  $scope.summary = c.data.summary || $scope.summary;
  
  // Initialize filtered incidents
  $scope.filteredIncidents = $scope.incidents;
  
  // Initialize charts
  setTimeout(function() {
    initializeCharts();
  }, 500);
  
  // Filter functions
  $scope.filterByPriority = function(priority) {
    $scope.filters.priority = priority;
    $scope.applyFilters();
  };
  
  $scope.applyFilters = function() {
    $scope.filteredIncidents = $scope.incidents.filter(function(incident) {
      var matchesPriority = !$scope.filters.priority || incident.priority === $scope.filters.priority;
      var matchesState = !$scope.filters.state || incident.state === $scope.filters.state;
      var matchesGroup = !$scope.filters.assignmentGroup || incident.assignment_group === $scope.filters.assignmentGroup;
      
      return matchesPriority && matchesState && matchesGroup;
    });
  };
  
  // Sorting functions
  $scope.sortBy = function(field) {
    if ($scope.sortField === field) {
      $scope.sortDesc = !$scope.sortDesc;
    } else {
      $scope.sortField = field;
      $scope.sortDesc = false;
    }
  };
  
  // Utility functions
  $scope.getPriorityLabel = function(priority) {
    var labels = {
      '1': 'Critical',
      '2': 'High',
      '3': 'Medium',
      '4': 'Low'
    };
    return labels[priority] || 'Unknown';
  };
  
  $scope.getStateLabel = function(state) {
    var labels = {
      '1': 'New',
      '2': 'In Progress',
      '3': 'On Hold',
      '6': 'Resolved',
      '7': 'Closed'
    };
    return labels[state] || 'Unknown';
  };
  
  // Actions
  $scope.openIncident = function(sysId) {
    var url = '/nav_to.do?uri=incident.do?sys_id=' + sysId;
    window.open(url, '_blank');
  };
  
  $scope.assignToMe = function(incident) {
    // Call server to assign incident
    c.server.update().then(function() {
      incident.assigned_to = c.data.currentUser.sys_id;
      incident.assigned_to_display_value = c.data.currentUser.name;
      spUtil.addInfoMessage('Incident ' + incident.number + ' assigned to you');
    });
  };
  
  $scope.refreshData = function() {
    $scope.lastUpdated = new Date();
    c.server.update().then(function() {
      $scope.incidents = c.data.incidents || [];
      $scope.summary = c.data.summary || $scope.summary;
      $scope.applyFilters();
      initializeCharts();
      spUtil.addInfoMessage('Data refreshed successfully');
    });
  };
  
  // Chart initialization
  function initializeCharts() {
    // Status Chart
    var statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
      var statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'],
          datasets: [{
            data: [
              $scope.incidents.filter(function(i) { return i.state === '1'; }).length,
              $scope.incidents.filter(function(i) { return i.state === '2'; }).length,
              $scope.incidents.filter(function(i) { return i.state === '3'; }).length,
              $scope.incidents.filter(function(i) { return i.state === '6'; }).length,
              $scope.incidents.filter(function(i) { return i.state === '7'; }).length
            ],
            backgroundColor: ['#3498db', '#f39c12', '#e67e22', '#2ecc71', '#95a5a6'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: {
            position: 'bottom'
          }
        }
      });
    }
    
    // Priority Chart
    var priorityCtx = document.getElementById('priorityChart');
    if (priorityCtx) {
      var priorityChart = new Chart(priorityCtx, {
        type: 'bar',
        data: {
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{
            label: 'Incidents',
            data: [
              $scope.summary.critical,
              $scope.summary.high,
              $scope.summary.medium,
              $scope.summary.low
            ],
            backgroundColor: ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          legend: {
            display: false
          }
        }
      });
    }
  }
  
  // Auto-refresh every 5 minutes
  setInterval(function() {
    $scope.refreshData();
  }, 300000);
}
    `;
  }

  /**
   * Widget Server Script
   */
  private getServerScript(): string {
    return `
(function() {
  // Get current user
  data.currentUser = {
    sys_id: gs.getUserID(),
    name: gs.getUserDisplayName(),
    email: gs.getUserEmail()
  };
  
  // Get incidents
  var incidentGR = new GlideRecord('incident');
  incidentGR.addQuery('active', true);
  incidentGR.orderByDesc('opened_at');
  incidentGR.setLimit(options.recordLimit || 100);
  incidentGR.query();
  
  var incidents = [];
  var summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    criticalTrend: 0,
    highTrend: 0,
    mediumTrend: 0,
    lowTrend: 0
  };
  
  while (incidentGR.next()) {
    var incident = {
      sys_id: incidentGR.getValue('sys_id'),
      number: incidentGR.getValue('number'),
      priority: incidentGR.getValue('priority'),
      state: incidentGR.getValue('state'),
      short_description: incidentGR.getValue('short_description'),
      assigned_to: incidentGR.getValue('assigned_to'),
      assigned_to_display_value: incidentGR.getDisplayValue('assigned_to'),
      assignment_group: incidentGR.getValue('assignment_group'),
      assignment_group_display_value: incidentGR.getDisplayValue('assignment_group'),
      opened_at: incidentGR.getValue('opened_at'),
      resolved_at: incidentGR.getValue('resolved_at'),
      closed_at: incidentGR.getValue('closed_at'),
      caller_id: incidentGR.getDisplayValue('caller_id'),
      category: incidentGR.getValue('category'),
      subcategory: incidentGR.getValue('subcategory'),
      urgency: incidentGR.getValue('urgency'),
      impact: incidentGR.getValue('impact')
    };
    
    incidents.push(incident);
    
    // Update summary counts
    switch (incident.priority) {
      case '1':
        summary.critical++;
        break;
      case '2':
        summary.high++;
        break;
      case '3':
        summary.medium++;
        break;
      case '4':
        summary.low++;
        break;
    }
  }
  
  // Calculate trends (compare with last week)
  var lastWeek = new GlideDateTime();
  lastWeek.addWeeksLocalTime(-1);
  
  var lastWeekGR = new GlideRecord('incident');
  lastWeekGR.addQuery('active', true);
  lastWeekGR.addQuery('opened_at', '>=', lastWeek);
  lastWeekGR.query();
  
  var lastWeekSummary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  while (lastWeekGR.next()) {
    switch (lastWeekGR.getValue('priority')) {
      case '1':
        lastWeekSummary.critical++;
        break;
      case '2':
        lastWeekSummary.high++;
        break;
      case '3':
        lastWeekSummary.medium++;
        break;
      case '4':
        lastWeekSummary.low++;
        break;
    }
  }
  
  // Calculate percentage changes
  summary.criticalTrend = lastWeekSummary.critical > 0 ? 
    Math.round(((summary.critical - lastWeekSummary.critical) / lastWeekSummary.critical) * 100) : 0;
  summary.highTrend = lastWeekSummary.high > 0 ? 
    Math.round(((summary.high - lastWeekSummary.high) / lastWeekSummary.high) * 100) : 0;
  summary.mediumTrend = lastWeekSummary.medium > 0 ? 
    Math.round(((summary.medium - lastWeekSummary.medium) / lastWeekSummary.medium) * 100) : 0;
  summary.lowTrend = lastWeekSummary.low > 0 ? 
    Math.round(((summary.low - lastWeekSummary.low) / lastWeekSummary.low) * 100) : 0;
  
  // Get assignment groups
  var groupGR = new GlideRecord('sys_user_group');
  groupGR.addQuery('active', true);
  groupGR.addQuery('type', 'itil');
  groupGR.orderBy('name');
  groupGR.query();
  
  var assignmentGroups = [];
  while (groupGR.next()) {
    assignmentGroups.push({
      sys_id: groupGR.getValue('sys_id'),
      name: groupGR.getValue('name')
    });
  }
  
  // Return data
  data.incidents = incidents;
  data.summary = summary;
  data.assignmentGroups = assignmentGroups;
  data.lastUpdated = new GlideDateTime().toString();
})();
    `;
  }

  /**
   * Widget Option Schema
   */
  private getOptionSchema(): string {
    return `
[
  {
    "name": "recordLimit",
    "label": "Record Limit",
    "type": "integer",
    "value": 100,
    "hint": "Maximum number of incidents to display"
  },
  {
    "name": "autoRefresh",
    "label": "Auto Refresh",
    "type": "boolean",
    "value": true,
    "hint": "Automatically refresh data every 5 minutes"
  },
  {
    "name": "showCharts",
    "label": "Show Charts",
    "type": "boolean",
    "value": true,
    "hint": "Display status and priority charts"
  },
  {
    "name": "defaultPriority",
    "label": "Default Priority Filter",
    "type": "choice",
    "choices": [
      {"label": "All", "value": ""},
      {"label": "Critical", "value": "1"},
      {"label": "High", "value": "2"},
      {"label": "Medium", "value": "3"},
      {"label": "Low", "value": "4"}
    ],
    "value": "",
    "hint": "Default priority filter when widget loads"
  },
  {
    "name": "defaultState",
    "label": "Default State Filter",
    "type": "choice",
    "choices": [
      {"label": "All", "value": ""},
      {"label": "New", "value": "1"},
      {"label": "In Progress", "value": "2"},
      {"label": "On Hold", "value": "3"},
      {"label": "Resolved", "value": "6"},
      {"label": "Closed", "value": "7"}
    ],
    "value": "",
    "hint": "Default state filter when widget loads"
  }
]
    `;
  }

  /**
   * Widget Demo Data
   */
  private getDemoData(): string {
    return `
{
  "incidents": [
    {
      "sys_id": "demo-001",
      "number": "INC0000001",
      "priority": "1",
      "state": "2",
      "short_description": "Critical database server down",
      "assigned_to": "demo-user-1",
      "assigned_to_display_value": "John Smith",
      "assignment_group": "demo-group-1",
      "assignment_group_display_value": "Database Team",
      "opened_at": "2024-01-15 10:30:00",
      "caller_id": "Jane Doe",
      "category": "hardware",
      "subcategory": "server",
      "urgency": "1",
      "impact": "1"
    },
    {
      "sys_id": "demo-002",
      "number": "INC0000002",
      "priority": "2",
      "state": "1",
      "short_description": "Email service intermittent issues",
      "assigned_to": "",
      "assigned_to_display_value": "Unassigned",
      "assignment_group": "demo-group-2",
      "assignment_group_display_value": "Network Team",
      "opened_at": "2024-01-15 09:15:00",
      "caller_id": "Bob Johnson",
      "category": "software",
      "subcategory": "email",
      "urgency": "2",
      "impact": "2"
    }
  ],
  "summary": {
    "critical": 1,
    "high": 1,
    "medium": 0,
    "low": 0,
    "criticalTrend": 100,
    "highTrend": 0,
    "mediumTrend": -50,
    "lowTrend": 0
  },
  "assignmentGroups": [
    {
      "sys_id": "demo-group-1",
      "name": "Database Team"
    },
    {
      "sys_id": "demo-group-2",
      "name": "Network Team"
    }
  ]
}
    `;
  }
}

// Export for use in CLI
export default IncidentDashboardWidget;