# Enhanced Incident Management Widget

## Overview

The Enhanced Incident Management Widget provides a modern, visually appealing interface for managing ServiceNow incidents with advanced features including interactive charts, real-time updates, and comprehensive filtering capabilities.

## Features

### Visual Components
- **Interactive Charts**: Status distribution, priority breakdown, and trend analysis
- **Modern UI**: Card-based layout with smooth animations and transitions
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Color-coded Priority**: Visual indicators for incident priority levels
- **Real-time Updates**: Auto-refresh functionality with configurable intervals

### Data Management
- **Advanced Filtering**: Search, priority, state, and assignment group filters
- **Sorting Options**: Sort by priority, creation date, or update time
- **Export Capabilities**: Export incident data to JSON format
- **Pagination**: Load more functionality for large datasets
- **Performance Optimized**: Efficient database queries and caching

### Accessibility
- **Keyboard Navigation**: Full keyboard support for navigation
- **Screen Reader Support**: ARIA labels and semantic HTML
- **High Contrast Mode**: Support for accessibility preferences
- **Mobile Friendly**: Touch-optimized interface

## Installation

### Prerequisites
- ServiceNow instance (Madrid or later)
- Service Portal enabled
- User with `incident_manager` or `itil` role

### Step 1: Create Widget in ServiceNow

1. Navigate to **Service Portal > Widgets** in your ServiceNow instance
2. Click **New** to create a new widget
3. Fill in the widget details:
   - **Widget Name**: `Incident Management Widget`
   - **Widget ID**: `incident-management-widget`
   - **Description**: `Enhanced incident management with visual features`

### Step 2: Add Widget Files

#### HTML Template
Copy the contents of `incident-management-widget.html` into the **HTML Template** field.

#### CSS Stylesheet
Copy the contents of `incident-management-widget.css` into the **CSS - SCSS** field.

#### Client Controller
Copy the contents of `incident-management-widget.js` into the **Client Controller** field.

#### Server Script
Copy the contents of `incident-management-widget-server.js` into the **Server Script** field.

#### Options Schema
Copy the contents of `incident-management-widget-options.json` into the **Option Schema** field.

### Step 3: Configure Widget Options

The widget includes comprehensive configuration options:

#### Display Options
- **Widget Title**: Customize the widget header title
- **Max Records**: Maximum number of incidents to load (default: 100)
- **Show Charts**: Enable/disable interactive charts
- **Chart Types**: Choose which charts to display
- **Card Layout**: Grid, list, or table layout options

#### Filtering Options
- **Enable Search**: Show search bar for filtering
- **Enable Filters**: Show filter dropdowns
- **Default Priority Filter**: Set default priority filter
- **Default State Filter**: Set default state filter
- **Remember Filters**: Persist user filter preferences

#### Visual Options
- **Color Scheme**: Default, high contrast, or colorblind-friendly
- **Priority Colors**: Color scheme for priority indicators
- **Enable Animations**: Smooth transitions and effects
- **Loading Animation**: Spinner, skeleton, or pulse loading

#### Performance Options
- **Auto Refresh**: Enable automatic data refresh
- **Refresh Interval**: Refresh frequency in seconds (default: 30)
- **Cache Duration**: Data caching duration in minutes (default: 5)

### Step 4: Add Widget to Page

1. Navigate to **Service Portal > Pages**
2. Edit the desired page or create a new one
3. Add the widget to the page layout
4. Configure widget options as needed
5. Save and preview the page

## Configuration Examples

### Basic Configuration
```json
{
  "title": "My Incidents",
  "max_records": 50,
  "show_charts": true,
  "auto_refresh": true,
  "refresh_interval": 30
}
```

### High-Priority Incidents Only
```json
{
  "title": "Critical Incidents",
  "default_priority_filter": "1,2",
  "show_charts": false,
  "highlight_overdue": true,
  "enable_notifications": true
}
```

### Team-Specific Dashboard
```json
{
  "title": "IT Support Team",
  "assignment_group": "IT Support",
  "show_charts": true,
  "chart_types": "status,priority",
  "group_by_assignment": true
}
```

## API Reference

### Server-Side Functions

#### `loadIncidents()`
Loads incident data with applied filters and security validation.

#### `buildQueryFilters()`
Constructs optimized GlideRecord queries with security checks.

#### `calculateSummaryStats()`
Generates summary statistics for dashboard display.

#### `handleAjaxRequest()`
Processes client-side AJAX requests for data updates.

### Client-Side Functions

#### `c.refresh()`
Manually refresh incident data.

#### `c.filterIncidents()`
Apply filters to incident list.

#### `c.exportData()`
Export incident data to JSON format.

#### `c.openIncident(incident)`
Open incident record in new tab.

## Customization

### Custom CSS Classes
Add custom styling by including CSS classes in the `custom_css_class` option:

```css
.my-custom-widget {
  border: 2px solid #007bff;
  border-radius: 10px;
}
```

### Custom Color Schemes
Modify CSS variables to create custom color schemes:

```css
:root {
  --priority-critical: #dc3545;
  --priority-high: #fd7e14;
  --priority-medium: #ffc107;
  --priority-low: #28a745;
}
```

### Custom Chart Colors
Override chart colors by modifying the chart initialization:

```javascript
var chartColors = {
  critical: '#ff0000',
  high: '#ff8000',
  medium: '#ffff00',
  low: '#00ff00'
};
```

## Troubleshooting

### Common Issues

#### Widget Not Loading
- Check user permissions (incident_manager or itil role required)
- Verify ServiceNow version compatibility (Madrid or later)
- Ensure Chart.js library is loaded

#### Charts Not Displaying
- Verify `show_charts` option is enabled
- Check browser console for JavaScript errors
- Ensure Chart.js CDN is accessible

#### Performance Issues
- Reduce `max_records` setting
- Increase `cache_duration` setting
- Optimize filters to reduce query complexity

#### Filter Not Working
- Check filter syntax and values
- Verify user has access to filtered data
- Review server logs for query errors

### Debug Mode
Enable debug mode by adding URL parameter: `?debug=true`

This will show additional information in the browser console including:
- Query execution times
- Record counts
- Filter parameters
- Error messages

## Security

### Access Control
- Role-based access control with `incident_manager` and `itil` roles
- Field-level security enforcement
- Input sanitization and validation
- Audit logging for data access

### Data Protection
- XSS prevention in templates
- SQL injection protection in queries
- CSRF protection for state changes
- Secure parameter handling

## Performance Optimization

### Database Optimization
- Indexed field queries
- Aggregate queries for statistics
- Query result caching
- Field selection optimization

### Client-Side Optimization
- Lazy loading of data
- Debounced search inputs
- Virtual scrolling for large lists
- Efficient DOM manipulation

## Browser Compatibility

### Supported Browsers
- Chrome 60+
- Firefox 55+
- Safari 10+
- Edge 79+
- Internet Explorer 11 (limited support)

### Mobile Support
- iOS Safari 10+
- Android Chrome 60+
- Responsive design for all screen sizes
- Touch-optimized interface

## Changelog

### Version 2.0
- Added interactive charts with Chart.js
- Implemented real-time updates
- Enhanced responsive design
- Added comprehensive filtering
- Improved accessibility features
- Performance optimizations

### Version 1.0
- Initial release with basic functionality
- Card-based layout
- Basic filtering and search
- Priority color coding

## Support

For issues and feature requests, please contact your ServiceNow administrator or create a support ticket.

### Requirements for Support
- ServiceNow instance version
- Widget configuration settings
- Browser and version information
- Console error messages (if any)
- Steps to reproduce the issue

## License

This widget is provided as-is for ServiceNow environments. Please review your organization's software policies before deployment.

---

**Built with ❤️ by the ServiceNow Multi-Agent System**