(function() {
  'use strict';
  
  /**
   * Enhanced Server-Side Script for Incident Data Retrieval and Processing
   * Features: GlideRecord queries, data filtering, performance optimization, security, API formatting
   * Author: ServiceNow Multi-Agent System
   * Version: 2.0
   */
  
  var IncidentDataProcessor = {
    
    // Configuration constants
    CONFIG: {
      MAX_RECORDS: 1000,
      DEFAULT_LIMIT: 50,
      CACHE_DURATION: 300000, // 5 minutes in milliseconds
      SLA_THRESHOLDS: {
        '1': 4,   // Critical: 4 hours
        '2': 8,   // High: 8 hours
        '3': 24,  // Medium: 24 hours
        '4': 72   // Low: 72 hours
      },
      REQUIRED_ROLES: ['incident_manager', 'itil']
    },
    
    // Security validation
    validateAccess: function() {
      try {
        // Check if user has required roles
        var userRoles = gs.getUser().getRoles();
        var hasAccess = false;
        
        for (var i = 0; i < this.CONFIG.REQUIRED_ROLES.length; i++) {
          if (gs.hasRole(this.CONFIG.REQUIRED_ROLES[i])) {
            hasAccess = true;
            break;
          }
        }
        
        if (!hasAccess) {
          gs.warn('Unauthorized access attempt to incident data by user: ' + gs.getUserName());
          return false;
        }
        
        return true;
      } catch (e) {
        gs.error('Error validating access: ' + e.message);
        return false;
      }
    },
    
    // Input sanitization
    sanitizeInput: function(inputValue) {
      if (!inputValue) return '';
      
      // Remove potentially harmful characters
      var sanitized = String(inputValue)
        .replace(/[<>\\"']/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .substring(0, 255); // Limit length
      
      return sanitized;
    },
    
    // Initialize widget with security and performance checks
    init: function() {
      try {
        // Security validation
        if (!this.validateAccess()) {
          data.error = 'Access denied';
          data.incidents = [];
          return;
        }
        
        // Initialize data structure
        data.title = this.sanitizeInput(options.title) || 'Incident Management Dashboard';
        data.incidents = [];
        data.summary = {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          open: 0,
          resolved: 0,
          overdue: 0
        };
        data.metadata = {
          last_updated: new GlideDateTime().getDisplayValue(),
          user: gs.getUserName(),
          query_time: 0,
          cache_hit: false
        };
        
        // Load incident data
        this.loadIncidents();
        
      } catch (error) {
        gs.error('Error initializing incident processor: ' + error.message);
        data.error = 'Initialization failed';
        data.incidents = [];
      }
    },
    
    // Build optimized query filters
    buildQueryFilters: function() {
      var filters = [];
      
      try {
        // Base security filter - only show incidents user can access
        filters.push('active=true');
        
        // Priority filter with validation
        if (input && input.priority) {
          var priority = this.sanitizeInput(input.priority);
          if (['1', '2', '3', '4'].indexOf(priority) !== -1) {
            filters.push('priority=' + priority);
          }
        }
        
        // State filter with validation
        if (input && input.state) {
          var state = this.sanitizeInput(input.state);
          if (['1', '2', '3', '4', '5', '6', '7'].indexOf(state) !== -1) {
            filters.push('state=' + state);
          }
        }
        
        // Assignment group filter
        if (input && input.assignment_group) {
          var assignmentGroup = this.sanitizeInput(input.assignment_group);
          if (assignmentGroup) {
            filters.push('assignment_group=' + assignmentGroup);
          }
        }
        
        // User-specific filters
        if (options.show_my_incidents === 'true') {
          filters.push('assigned_to=' + gs.getUserID());
        }
        
        // Date range filter with performance optimization
        if (options.date_range) {
          var dateRange = parseInt(this.sanitizeInput(options.date_range));
          if (dateRange > 0 && dateRange <= 365) {
            var startDate = gs.daysAgoStart(dateRange);
            filters.push('sys_created_on>=' + startDate);
          }
        }
        
        // Search filter with indexed fields
        if (input && input.search_term) {
          var searchTerm = this.sanitizeInput(input.search_term);
          if (searchTerm.length >= 3) {
            filters.push('numberCONTAINS' + searchTerm + 
                        '^ORshort_descriptionCONTAINS' + searchTerm +
                        '^ORcaller_id.nameCONTAINS' + searchTerm);
          }
        }
        
        // Business service filter
        if (options.business_service) {
          filters.push('business_service=' + this.sanitizeInput(options.business_service));
        }
        
        // Category filter
        if (input && input.category) {
          filters.push('category=' + this.sanitizeInput(input.category));
        }
        
        return filters.join('^');
        
      } catch (error) {
        gs.error('Error building query filters: ' + error.message);
        return 'active=true'; // Safe fallback
      }
    },
    
    // Execute optimized incident query
    queryIncidents: function(encodedQuery) {
      var startTime = new Date().getTime();
      var incidents = [];
      
      try {
        var gr = new GlideRecord('incident');
        
        // Apply security query
        gr.addEncodedQuery(encodedQuery);
        
        // Optimized ordering
        gr.orderBy('priority');
        gr.orderByDesc('sys_created_on');
        
        // Apply limit with validation
        var limit = parseInt(options.max_records) || this.CONFIG.DEFAULT_LIMIT;
        if (limit > this.CONFIG.MAX_RECORDS) {
          limit = this.CONFIG.MAX_RECORDS;
        }
        gr.setLimit(limit);
        
        // Execute query
        gr.query();
        
        // Process results
        while (gr.next()) {
          var incident = this.buildSecureIncidentObject(gr);
          if (incident) {
            incidents.push(incident);
          }
        }
        
        // Record query performance
        var queryTime = new Date().getTime() - startTime;
        data.metadata.query_time = queryTime;
        
        gs.info('Incident query completed in ' + queryTime + 'ms, returned ' + incidents.length + ' records');
        
        return incidents;
        
      } catch (error) {
        gs.error('Error querying incidents: ' + error.message);
        return [];
      }
    },
    
    // Build secure incident object with field validation
    buildSecureIncidentObject: function(gr) {
      try {
        var incident = {
          sys_id: gr.getValue('sys_id'),
          number: gr.getValue('number'),
          short_description: this.truncateText(gr.getValue('short_description'), 200),
          priority: gr.getValue('priority'),
          priority_label: this.getPriorityLabel(gr.getValue('priority')),
          state: gr.getValue('state'),
          state_label: this.getStateLabel(gr.getValue('state')),
          impact: gr.getValue('impact'),
          urgency: gr.getValue('urgency'),
          category: gr.getValue('category'),
          subcategory: gr.getValue('subcategory'),
          
          // User/Group information with display values
          assigned_to: gr.getDisplayValue('assigned_to'),
          assigned_to_sys_id: gr.getValue('assigned_to'),
          assignment_group: gr.getDisplayValue('assignment_group'),
          assignment_group_sys_id: gr.getValue('assignment_group'),
          caller_id: gr.getDisplayValue('caller_id'),
          caller_id_sys_id: gr.getValue('caller_id'),
          
          // Dates
          opened_at: gr.getValue('opened_at'),
          opened_at_formatted: this.formatDateTime(gr.getValue('opened_at')),
          sys_created_on: gr.getValue('sys_created_on'),
          sys_updated_on: gr.getValue('sys_updated_on'),
          updated_at_formatted: this.formatDateTime(gr.getValue('sys_updated_on')),
          resolved_at: gr.getValue('resolved_at'),
          closed_at: gr.getValue('closed_at'),
          
          // Business context
          business_service: gr.getDisplayValue('business_service'),
          business_service_sys_id: gr.getValue('business_service'),
          cmdb_ci: gr.getDisplayValue('cmdb_ci'),
          cmdb_ci_sys_id: gr.getValue('cmdb_ci'),
          location: gr.getDisplayValue('location'),
          company: gr.getDisplayValue('company'),
          contact_type: gr.getValue('contact_type'),
          resolution_code: gr.getValue('resolution_code'),
          
          // Computed fields
          age_days: this.calculateAge(gr.getValue('opened_at')),
          is_overdue: this.isOverdue(gr),
          severity_class: this.getSeverityClass(gr.getValue('priority')),
          can_edit: gr.canWrite(),
          can_delete: gr.canDelete()
        };
        
        return incident;
        
      } catch (error) {
        gs.error('Error building incident object: ' + error.message);
        return null;
      }
    },
    
    // Calculate comprehensive summary statistics
    calculateSummaryStats: function() {
      try {
        var stats = {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          open: 0,
          resolved: 0,
          overdue: 0
        };
        
        // Use aggregate query for better performance
        var ga = new GlideAggregate('incident');
        ga.addQuery('active', true);
        
        // Apply same filters as main query
        if (options.assignment_group) {
          ga.addQuery('assignment_group', options.assignment_group);
        }
        
        if (options.date_range) {
          var dateRange = parseInt(options.date_range);
          if (dateRange > 0) {
            ga.addQuery('sys_created_on', '>=', gs.daysAgoStart(dateRange));
          }
        }
        
        // Group by priority
        ga.addAggregate('COUNT');
        ga.groupBy('priority');
        ga.query();
        
        while (ga.next()) {
          var priority = ga.getValue('priority');
          var count = parseInt(ga.getAggregate('COUNT'));
          stats.total += count;
          
          switch (priority) {
            case '1': stats.critical = count; break;
            case '2': stats.high = count; break;
            case '3': stats.medium = count; break;
            case '4': stats.low = count; break;
          }
        }
        
        // Calculate additional metrics
        this.calculateAdditionalStats(stats);
        
        return stats;
        
      } catch (error) {
        gs.error('Error calculating summary stats: ' + error.message);
        return {
          total: 0, critical: 0, high: 0, medium: 0, low: 0,
          open: 0, resolved: 0, overdue: 0
        };
      }
    },
    
    // Calculate additional statistics
    calculateAdditionalStats: function(stats) {
      var ga = new GlideAggregate('incident');
      ga.addQuery('active', true);
      
      // Count open vs resolved
      ga.addAggregate('COUNT');
      ga.groupBy('state');
      ga.query();
      
      while (ga.next()) {
        var state = ga.getValue('state');
        var count = parseInt(ga.getAggregate('COUNT'));
        
        if (['1', '2', '3', '4', '5'].indexOf(state) !== -1) {
          stats.open += count;
        } else {
          stats.resolved += count;
        }
      }
    },
    
    // Main data loading function
    loadIncidents: function() {
      try {
        var startTime = new Date().getTime();
        
        // Build query filters
        var encodedQuery = this.buildQueryFilters();
        
        // Execute query
        var incidents = this.queryIncidents(encodedQuery);
        
        // Calculate summary statistics
        var summaryStats = this.calculateSummaryStats();
        
        // Process incidents for display
        var processedIncidents = this.processIncidentsForDisplay(incidents);
        
        // Update data object
        data.incidents = processedIncidents;
        data.summary = summaryStats;
        data.metadata.total_processing_time = new Date().getTime() - startTime;
        data.metadata.record_count = incidents.length;
        
        gs.info('Incident data loaded successfully: ' + incidents.length + ' records in ' + 
                data.metadata.total_processing_time + 'ms');
        
      } catch (error) {
        gs.error('Error loading incident data: ' + error.message);
        data.error = 'Failed to load incident data';
        data.incidents = [];
      }
    },
    
    // Process incidents for display optimization
    processIncidentsForDisplay: function(incidents) {
      var processed = [];
      
      for (var i = 0; i < incidents.length; i++) {
        var incident = incidents[i];
        
        // Add display enhancements
        incident.short_description_truncated = this.truncateText(incident.short_description, 80);
        incident.age_formatted = this.formatAge(incident.age_days);
        incident.priority_icon = this.getPriorityIcon(incident.priority);
        incident.state_color = this.getStateColor(incident.state);
        
        processed.push(incident);
      }
      
      return processed;
    },
    
    // Utility functions
    truncateText: function(text, maxLength) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },
    
    formatDateTime: function(dateTimeString) {
      if (!dateTimeString) return '';
      var gdt = new GlideDateTime(dateTimeString);
      return gdt.getDisplayValue();
    },
    
    calculateAge: function(openedAt) {
      if (!openedAt) return 0;
      var now = new GlideDateTime();
      var opened = new GlideDateTime(openedAt);
      var duration = GlideDateTime.subtract(now, opened);
      return Math.floor(duration.getNumericValue() / (1000 * 60 * 60 * 24));
    },
    
    formatAge: function(days) {
      if (days === 0) return 'Today';
      if (days === 1) return '1 day';
      if (days < 7) return days + ' days';
      if (days < 30) return Math.floor(days / 7) + ' weeks';
      return Math.floor(days / 30) + ' months';
    },
    
    isOverdue: function(gr) {
      var priority = gr.getValue('priority');
      var state = gr.getValue('state');
      var openedAt = gr.getValue('opened_at');
      
      if (!priority || !openedAt || ['6', '7'].indexOf(state) !== -1) {
        return false;
      }
      
      var thresholdHours = this.CONFIG.SLA_THRESHOLDS[priority] || 72;
      var age = this.calculateAge(openedAt);
      return age > (thresholdHours / 24);
    },
    
    getPriorityLabel: function(priority) {
      var labels = {
        '1': 'Critical',
        '2': 'High', 
        '3': 'Medium',
        '4': 'Low'
      };
      return labels[priority] || 'Unknown';
    },
    
    getStateLabel: function(state) {
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
    },
    
    getSeverityClass: function(priority) {
      var classes = {
        '1': 'severity-critical',
        '2': 'severity-high',
        '3': 'severity-medium',
        '4': 'severity-low'
      };
      return classes[priority] || 'severity-unknown';
    },
    
    getPriorityIcon: function(priority) {
      var icons = {
        '1': 'fa-exclamation-triangle',
        '2': 'fa-exclamation-circle',
        '3': 'fa-info-circle',
        '4': 'fa-minus-circle'
      };
      return icons[priority] || 'fa-question-circle';
    },
    
    getStateColor: function(state) {
      var colors = {
        '1': '#ff6b6b',  // New - Red
        '2': '#ffa500',  // In Progress - Orange
        '3': '#ffff00',  // On Hold - Yellow
        '4': '#87ceeb',  // Pending - Sky Blue
        '5': '#dda0dd',  // Pending Approval - Plum
        '6': '#90ee90',  // Resolved - Light Green
        '7': '#d3d3d3'   // Closed - Light Gray
      };
      return colors[state] || '#cccccc';
    },
    
    // Get assignment groups for filter dropdown
    getAssignmentGroups: function() {
      var groups = [];
      var gr = new GlideRecord('sys_user_group');
      gr.addQuery('active', true);
      gr.orderBy('name');
      gr.query();
      
      while (gr.next()) {
        groups.push({
          sys_id: gr.getValue('sys_id'),
          name: gr.getValue('name')
        });
      }
      
      return groups;
    },
    
    // AJAX request handler
    handleAjaxRequest: function() {
      try {
        if (!this.validateAccess()) {
          return { error: 'Access denied' };
        }
        
        var action = this.sanitizeInput(input.action);
        
        switch (action) {
          case 'refresh':
            this.loadIncidents();
            return { success: true, message: 'Data refreshed' };
            
          case 'get_assignment_groups':
            return { 
              success: true, 
              assignment_groups: this.getAssignmentGroups() 
            };
            
          case 'export':
            return this.exportIncidentData();
            
          case 'get_details':
            return this.getIncidentDetails(input.sys_id);
            
          default:
            this.loadIncidents();
            return { success: true };
        }
        
      } catch (error) {
        gs.error('Error handling AJAX request: ' + error.message);
        return { error: 'Request failed' };
      }
    },
    
    // Export incident data with security
    exportIncidentData: function() {
      try {
        var exportData = {
          incidents: data.incidents,
          summary: data.summary,
          metadata: {
            exported_at: new GlideDateTime().getDisplayValue(),
            exported_by: gs.getUserName(),
            export_type: 'incident_data',
            record_count: data.incidents.length
          },
          filters_applied: this.buildQueryFilters()
        };
        
        // Log export activity
        gs.info('Incident data exported by user: ' + gs.getUserName() + 
                ', Records: ' + data.incidents.length);
        
        return exportData;
        
      } catch (error) {
        gs.error('Error exporting incident data: ' + error.message);
        return { error: 'Export failed' };
      }
    },
    
    // Get detailed incident information
    getIncidentDetails: function(sysId) {
      try {
        if (!sysId) return { error: 'System ID required' };
        
        var sanitizedSysId = this.sanitizeInput(sysId);
        var gr = new GlideRecord('incident');
        
        if (gr.get(sanitizedSysId)) {
          if (!gr.canRead()) {
            return { error: 'Access denied' };
          }
          
          var details = this.buildSecureIncidentObject(gr);
          
          // Add additional details
          details.work_notes = gr.getValue('work_notes');
          details.comments = gr.getValue('comments');
          details.description = gr.getValue('description');
          details.resolution_notes = gr.getValue('resolution_notes');
          
          return { success: true, data: details };
        }
        
        return { error: 'Record not found' };
        
      } catch (error) {
        gs.error('Error getting incident details: ' + error.message);
        return { error: 'Failed to retrieve details' };
      }
    }
  };
  
  // Main execution logic
  try {
    if (input && input.action) {
      // Handle AJAX requests
      var result = IncidentDataProcessor.handleAjaxRequest();
      if (result.error) {
        data.error = result.error;
      }
    } else {
      // Initialize widget
      IncidentDataProcessor.init();
    }
    
  } catch (error) {
    gs.error('Fatal error in incident data processor: ' + error.message);
    data.error = 'System error occurred';
    data.incidents = [];
  }
  
})();