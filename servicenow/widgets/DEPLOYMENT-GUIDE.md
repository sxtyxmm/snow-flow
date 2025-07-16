# Incident Management Widget - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Enhanced Incident Management Widget to your ServiceNow instance.

## Pre-Deployment Checklist

### System Requirements
- [ ] ServiceNow instance (Madrid or later)
- [ ] Service Portal enabled
- [ ] User with `admin` or `sp_admin` role
- [ ] Access to **Service Portal > Widgets**

### User Permissions
- [ ] `incident_manager` or `itil` role for widget users
- [ ] `incident.read` permission for incident data access
- [ ] Service Portal user role

## Deployment Steps

### Step 1: Create Widget Record

1. Navigate to **Service Portal > Widgets**
2. Click **New** to create a new widget
3. Fill in the basic information:

```
Widget Name: Enhanced Incident Management Widget
Widget ID: incident-management-widget
Description: Advanced incident management with visual features and real-time updates
```

### Step 2: Upload Widget Files

Copy and paste the following files into their respective fields:

#### HTML Template
- Source: `incident-management-widget.html`
- Target: **HTML Template** field
- Size: ~15KB

#### CSS Stylesheet
- Source: `incident-management-widget.css`
- Target: **CSS - SCSS** field
- Size: ~25KB

#### Client Controller
- Source: `incident-management-widget.js`
- Target: **Client Controller** field
- Size: ~12KB

#### Server Script
- Source: `incident-management-widget-server.js`
- Target: **Server Script** field
- Size: ~20KB

#### Options Schema
- Source: `incident-management-widget-options.json`
- Target: **Option Schema** field
- Size: ~8KB

### Step 3: Configure Widget Dependencies

Add the following dependencies in the **Dependencies** field:

```
sp-widget-utils,angular-chart.js,bootstrap
```

### Step 4: Set Widget Categories

Add the widget to appropriate categories:

```
IT Service Management,Incident Management,Dashboard,Monitoring
```

### Step 5: Configure Widget Tags

Add relevant tags for searchability:

```
incident,monitoring,dashboard,real-time,priority,assignment,sla
```

### Step 6: Test Widget Functionality

1. Save the widget
2. Navigate to **Service Portal > Widget Editor**
3. Search for your widget
4. Add it to a test page
5. Verify all features work correctly

## Post-Deployment Configuration

### Create Service Portal Page

1. Navigate to **Service Portal > Pages**
2. Create a new page or edit existing
3. Add the widget to desired layout
4. Configure widget options

### Sample Page Configuration

```json
{
  "title": "Incident Dashboard",
  "id": "incident_dashboard",
  "layout": "container_fluid",
  "widgets": [
    {
      "widget": "incident-management-widget",
      "options": {
        "title": "Active Incidents",
        "max_records": 100,
        "show_charts": true,
        "auto_refresh": true,
        "refresh_interval": 30
      }
    }
  ]
}
```

### Configure Widget Options

#### Basic Configuration
```json
{
  "title": "Incident Management",
  "max_records": 100,
  "show_charts": true,
  "chart_types": "all",
  "auto_refresh": true,
  "refresh_interval": 30,
  "enable_search": true,
  "enable_filters": true
}
```

#### High-Priority Dashboard
```json
{
  "title": "Critical Incidents",
  "default_priority_filter": "1,2",
  "show_charts": false,
  "highlight_overdue": true,
  "enable_notifications": true,
  "refresh_interval": 15
}
```

#### Team-Specific Dashboard
```json
{
  "title": "IT Support Team",
  "assignment_group": "IT Support",
  "show_charts": true,
  "chart_types": "status,priority",
  "group_by_assignment": true,
  "show_my_incidents": true
}
```

## Security Configuration

### Role-Based Access Control

1. Navigate to **System Security > Access Control (ACL)**
2. Verify the following ACLs exist:

```
Table: incident
Operation: read
Role: incident_manager, itil
```

### Field-Level Security

Ensure sensitive fields are protected:

```sql
-- Example ACL for work_notes field
CREATE ACL FOR incident.work_notes
  WHERE role IN ('incident_manager', 'admin')
```

## Performance Optimization

### Database Indexes

Ensure the following indexes exist on the incident table:

```sql
-- Priority index
CREATE INDEX idx_incident_priority ON incident (priority);

-- State index  
CREATE INDEX idx_incident_state ON incident (state);

-- Assignment group index
CREATE INDEX idx_incident_assignment_group ON incident (assignment_group);

-- Composite index for common queries
CREATE INDEX idx_incident_active_priority ON incident (active, priority, sys_created_on);
```

### Cache Configuration

Configure caching for optimal performance:

```javascript
// In widget options
{
  "cache_duration": 5,  // 5 minutes
  "max_records": 100,   // Limit records
  "auto_refresh": true  // Enable auto-refresh
}
```

## Monitoring and Maintenance

### Performance Monitoring

Monitor widget performance using:

1. **System Logs > System Log > All**
2. Filter by: `javascript contains "Incident query completed"`
3. Look for query execution times

### Health Checks

Regular health checks to perform:

- [ ] Widget loads without errors
- [ ] Charts display correctly
- [ ] Filters work properly
- [ ] Search functionality works
- [ ] Auto-refresh operates correctly
- [ ] Export functionality works
- [ ] Mobile responsiveness

### Maintenance Tasks

Monthly maintenance tasks:

1. **Review Performance Metrics**
   - Check query execution times
   - Monitor memory usage
   - Review cache hit rates

2. **Update Widget Options**
   - Adjust refresh intervals
   - Update default filters
   - Modify display settings

3. **Security Review**
   - Verify role assignments
   - Check access logs
   - Review permission changes

## Troubleshooting

### Common Issues

#### Widget Not Loading
```
Error: "Widget failed to load"
Solution: Check user permissions and widget code syntax
```

#### Charts Not Displaying
```
Error: "Chart.js not found"
Solution: Verify Chart.js CDN is accessible
```

#### Performance Issues
```
Error: "Query timeout"
Solution: Reduce max_records or add database indexes
```

#### Filter Not Working
```
Error: "Invalid filter value"
Solution: Check filter syntax and field values
```

### Debug Mode

Enable debug mode for troubleshooting:

```javascript
// Add to URL
?debug=true&trace=true
```

### Log Analysis

Check system logs for errors:

```
Navigate to: System Logs > System Log > All
Filter: javascript contains "Incident"
```

## Rollback Procedure

If deployment issues occur:

1. **Immediate Rollback**
   - Remove widget from Service Portal pages
   - Disable auto-refresh to reduce load

2. **Full Rollback**
   - Delete widget record from **Service Portal > Widgets**
   - Remove any custom ACLs created
   - Clear browser cache

3. **Restore Previous Version**
   - Restore from update set if available
   - Revert to previous widget version

## Update Set Creation

Create update set for deployment:

1. **Create Update Set**
   ```
   Name: Enhanced Incident Management Widget v2.0
   Description: Advanced incident management with visual features
   ```

2. **Capture Changes**
   - Widget record
   - Any custom ACLs
   - Modified pages
   - Configuration changes

3. **Export Update Set**
   - Export as XML
   - Test in development environment
   - Deploy to production

## Testing Checklist

### Functional Testing
- [ ] Widget loads successfully
- [ ] Incident data displays correctly
- [ ] Charts render properly
- [ ] Filters work as expected
- [ ] Search functionality works
- [ ] Export feature works
- [ ] Auto-refresh operates correctly

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Query execution time < 1 second
- [ ] Memory usage within limits
- [ ] No memory leaks detected

### Security Testing
- [ ] Role-based access control works
- [ ] Field-level security enforced
- [ ] Input validation prevents XSS
- [ ] No unauthorized data access

### Compatibility Testing
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Mobile responsiveness verified
- [ ] Tablet layout functions properly
- [ ] High contrast mode works

## Support and Documentation

### Internal Documentation
- Widget architecture diagrams
- Configuration examples
- Troubleshooting guides
- Performance benchmarks

### Training Materials
- User training slides
- Administrator guide
- Video tutorials
- FAQ document

### Support Contacts
- Technical Lead: [Contact Information]
- ServiceNow Administrator: [Contact Information]
- Help Desk: [Contact Information]

## Conclusion

The Enhanced Incident Management Widget provides a modern, feature-rich interface for incident management in ServiceNow. Following this deployment guide ensures a smooth implementation and optimal performance.

For questions or issues, contact your ServiceNow administrator or create a support ticket.

---

**Deployment Date**: [Date]
**Deployed By**: [Name]
**Version**: 2.0
**Environment**: [Instance Name]