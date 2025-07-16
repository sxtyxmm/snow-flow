/**
 * Enhanced Incident Management Widget Controller
 * Features: Visual charts, real-time updates, filtering, export capabilities
 */
function IncidentWidgetController($scope, $timeout, $interval, $http, spUtil) {
  var c = this;
  
  // Controller properties
  c.loading = false;
  c.selectedPriority = '';
  c.selectedState = '';
  c.selectedGroup = '';
  c.searchText = '';
  c.refreshInterval = null;
  c.nextRefresh = null;
  c.filteredIncidents = [];
  c.displayLimit = 20;
  c.assignmentGroups = [];
  c.trendData = [];
  c.charts = {};
  c.filters = {
    searchTerm: '',
    priority: '',
    state: '',
    assignmentGroup: ''
  };
  
  // Initialize widget
  c.init = function() {
    c.loading = true;
    c.loadIncidents();
    c.loadAssignmentGroups();
    c.setupAutoRefresh();
    c.initializeCharts();
  };
  
  // Load incidents from server
  c.loadIncidents = function() {
    c.loading = true;
    
    var requestData = {
      action: 'refresh',
      priority: c.selectedPriority,
      state: c.selectedState,
      assignment_group: c.selectedGroup,
      search_term: c.filters.searchTerm,
      limit: $scope.options.max_records || 100
    };
    
    c.server.update(requestData).then(function(response) {
      if (response && response.incidents) {
        $scope.data.incidents = response.incidents;
        $scope.data.summary = response.summary || {};
        $scope.data.metadata = response.metadata || {};
        $scope.data.last_updated = new Date();
        
        // Process incidents for display
        c.processIncidents();
        
        // Update charts
        c.updateCharts();
        
        // Update filtered incidents
        c.applyFilters();
        
        c.loading = false;
      } else {
        c.handleError('No data received from server');
      }
    }).catch(function(error) {
      c.handleError('Error loading incidents: ' + (error.message || error));
    });
  };
  
  // Load assignment groups for filter dropdown
  c.loadAssignmentGroups = function() {
    c.server.update({action: 'get_assignment_groups'}).then(function(response) {
      if (response && response.assignment_groups) {
        c.assignmentGroups = response.assignment_groups;
      }
    });
  };
  
  // Process incidents for enhanced display
  c.processIncidents = function() {
    if (!$scope.data.incidents) return;
    
    $scope.data.incidents.forEach(function(incident) {
      incident.priority_label = c.getPriorityLabel(incident.priority);
      incident.state_label = c.getStateLabel(incident.state);
      incident.age_formatted = c.formatAge(incident.age_days);
      incident.updated_at_formatted = c.formatRelativeTime(incident.sys_updated_on);
      
      // Add severity class for styling
      incident.severity_class = c.getSeverityClass(incident.priority);
      
      // Add overdue indicator
      incident.is_overdue = c.isIncidentOverdue(incident);
    });
  };
  
  // Apply filters to incidents
  c.applyFilters = function() {
    if (!$scope.data.incidents) {
      c.filteredIncidents = [];
      return;
    }
    
    c.filteredIncidents = $scope.data.incidents.filter(function(incident) {
      // Priority filter
      if (c.selectedPriority && incident.priority !== c.selectedPriority) {
        return false;
      }
      
      // State filter
      if (c.selectedState && incident.state !== c.selectedState) {
        return false;
      }
      
      // Assignment group filter
      if (c.selectedGroup && incident.assignment_group_sys_id !== c.selectedGroup) {
        return false;
      }
      
      // Search filter
      if (c.filters.searchTerm) {
        var searchTerm = c.filters.searchTerm.toLowerCase();
        var searchableText = [
          incident.number,
          incident.short_description,
          incident.assigned_to,
          incident.assignment_group,
          incident.caller_id
        ].join(' ').toLowerCase();
        
        if (searchableText.indexOf(searchTerm) === -1) {
          return false;
        }
      }
      
      return true;
    });
  };
  
  // Filter change handler
  c.onFilterChange = function() {
    c.applyFilters();
  };
  
  // Filter incidents based on selected criteria
  c.filterIncidents = function() {
    c.applyFilters();
  };
  
  // Filter by priority (from summary cards)
  c.filterByPriority = function(priority) {
    c.selectedPriority = c.selectedPriority === priority ? '' : priority;
    c.applyFilters();
  };
  
  // Clear all filters
  c.clearFilters = function() {
    c.selectedPriority = '';
    c.selectedState = '';
    c.selectedGroup = '';
    c.filters.searchTerm = '';
    c.applyFilters();
  };
  
  // Refresh data manually
  c.refresh = function() {
    c.loadIncidents();
    spUtil.addInfoMessage('Incident data refreshed');
  };
  
  // Export data
  c.exportData = function() {
    var exportData = {
      incidents: c.filteredIncidents,
      summary: $scope.data.summary,
      metadata: $scope.data.metadata,
      exported_at: new Date().toISOString(),
      exported_by: $scope.user.name
    };
    
    var dataStr = JSON.stringify(exportData, null, 2);
    var dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    var exportFileDefaultName = 'incidents_' + new Date().toISOString().split('T')[0] + '.json';
    var linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Open incident record
  c.openIncident = function(incident, $event) {
    if ($event) {
      $event.stopPropagation();
    }
    window.open('/nav_to.do?uri=incident.do?sys_id=' + incident.sys_id, '_blank');
  };
  
  // Initialize charts
  c.initializeCharts = function() {
    $timeout(function() {
      c.updateCharts();
    }, 500);
  };
  
  // Update charts with current data
  c.updateCharts = function() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      return;
    }
    
    var widgetId = $scope.$id;
    var chartData = {
      summary: $scope.data.summary || {},
      trends: c.trendData
    };
    
    $timeout(function() {
      if (window.updateIncidentCharts) {
        window.updateIncidentCharts(widgetId, chartData);
      }
    }, 100);
  };
  
  // Load more incidents (pagination)
  c.loadMore = function() {
    c.displayLimit += 20;
  };
  
  // Show all incidents
  c.showAll = function() {
    c.displayLimit = c.filteredIncidents.length;
  };
  
  // Get card CSS class based on incident
  c.getCardClass = function(incident) {
    var classes = ['incident-card'];
    
    if (incident.priority) {
      classes.push('priority-' + incident.priority);
    }
    
    if (incident.is_overdue) {
      classes.push('overdue');
    }
    
    return classes.join(' ');
  };
  
  // Get priority badge CSS class
  c.getPriorityClass = function(priority) {
    var classes = {
      '1': 'critical',
      '2': 'high',
      '3': 'medium',
      '4': 'low'
    };
    return classes[priority] || 'unknown';
  };
  
  // Get state badge CSS class
  c.getStateClass = function(state) {
    return 'state-' + state;
  };
  
  // Get severity class for styling
  c.getSeverityClass = function(priority) {
    var classes = {
      '1': 'severity-critical',
      '2': 'severity-high',
      '3': 'severity-medium',
      '4': 'severity-low'
    };
    return classes[priority] || 'severity-unknown';
  };
  
  // Check if incident is overdue
  c.isIncidentOverdue = function(incident) {
    if (!incident.age_days || incident.state === '6' || incident.state === '7') {
      return false;
    }
    
    var thresholds = {
      '1': 0.5,  // Critical: 12 hours
      '2': 1,    // High: 1 day
      '3': 3,    // Medium: 3 days
      '4': 7     // Low: 7 days
    };
    
    var threshold = thresholds[incident.priority] || 7;
    return incident.age_days > threshold;
  };
  
  // Format age in days to human readable
  c.formatAge = function(days) {
    if (!days) return '0 days';
    if (days < 1) return 'Today';
    if (days === 1) return '1 day';
    if (days < 7) return Math.floor(days) + ' days';
    if (days < 30) return Math.floor(days / 7) + ' weeks';
    return Math.floor(days / 30) + ' months';
  };
  
  // Format relative time
  c.formatRelativeTime = function(dateString) {
    if (!dateString) return '';
    
    var now = new Date();
    var date = new Date(dateString);
    var diffMs = now - date;
    var diffMins = Math.floor(diffMs / 60000);
    var diffHours = Math.floor(diffMins / 60);
    var diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + ' min ago';
    if (diffHours < 24) return diffHours + ' hr ago';
    if (diffDays < 7) return diffDays + ' days ago';
    
    return date.toLocaleDateString();
  };
  
  // Get priority label
  c.getPriorityLabel = function(priority) {
    var labels = {
      '1': 'Critical',
      '2': 'High',
      '3': 'Medium',
      '4': 'Low'
    };
    return labels[priority] || 'Unknown';
  };
  
  // Get state label
  c.getStateLabel = function(state) {
    var labels = {
      '1': 'New',
      '2': 'In Progress',
      '3': 'On Hold',
      '4': 'Pending',
      '5': 'Pending Approval',
      '6': 'Resolved',
      '7': 'Closed'
    };
    return labels[state] || 'Unknown';
  };
  
  // Handle errors
  c.handleError = function(message) {
    console.error('Incident Widget Error:', message);
    c.loading = false;
    $scope.data.error = message;
    spUtil.addErrorMessage('Error loading incidents: ' + message);
  };
  
  // Setup auto refresh
  c.setupAutoRefresh = function() {
    var refreshInterval = ($scope.options.refresh_interval || 30) * 1000;
    
    if (c.refreshInterval) {
      $interval.cancel(c.refreshInterval);
    }
    
    if ($scope.options.auto_refresh !== 'false') {
      c.refreshInterval = $interval(function() {
        c.loadIncidents();
      }, refreshInterval);
    }
  };
  
  // Handle keyboard navigation
  c.handleKeyPress = function(event, incident) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      c.openIncident(incident);
    }
  };
  
  // Watch for options changes
  $scope.$watch('options.refresh_interval', function(newVal, oldVal) {
    if (newVal !== oldVal) {
      c.setupAutoRefresh();
    }
  });
  
  // Watch for data changes
  $scope.$watchCollection('data.incidents', function(newIncidents) {
    if (newIncidents && newIncidents.length > 0) {
      c.processIncidents();
      c.applyFilters();
    }
  });
  
  // Watch for filter changes
  $scope.$watch(function() {
    return c.selectedPriority + c.selectedState + c.selectedGroup;
  }, function() {
    c.applyFilters();
  });
  
  // Cleanup on destroy
  $scope.$on('$destroy', function() {
    if (c.refreshInterval) {
      $interval.cancel(c.refreshInterval);
    }
    
    // Destroy charts
    Object.keys(c.charts).forEach(function(key) {
      if (c.charts[key] && typeof c.charts[key].destroy === 'function') {
        c.charts[key].destroy();
      }
    });
  });
  
  // Initialize controller
  c.init();
}

// Register the controller
angular.module('sn.widget.incident_management', [])
  .controller('IncidentWidgetController', IncidentWidgetController);