# Incident Dashboard Widget Example

This example shows how to create a comprehensive incident management dashboard widget using Snow-Flow's natural language interface.

## <¯ What This Example Creates

A professional incident dashboard widget that displays:
- **Live incident counts** by priority and state
- **SLA compliance metrics** with visual indicators
- **Assignment group distribution** with interactive charts
- **Recent incident trends** over the last 30 days
- **Quick action buttons** for common operations

## =€ Quick Start

### 1. Basic Command
```bash
snow-flow swarm "Create an incident management dashboard with real-time metrics, SLA tracking, and interactive charts"
```

### 2. Advanced Command with Specifications
```bash
snow-flow swarm "Create a professional incident dashboard widget that shows:
- Live incident counts by priority (Critical, High, Medium, Low)
- SLA compliance percentage with red/yellow/green indicators  
- Top 5 assignment groups with incident counts
- 30-day trend chart showing incidents opened vs resolved
- Quick action buttons: Create Incident, My Incidents, Reports
- Auto-refresh every 30 seconds
- Responsive design for mobile and desktop"
```

## =Ë Expected Output

Snow-Flow will automatically:

1. **Analyze Requirements** - Understand the dashboard needs
2. **Design Architecture** - Plan the widget structure and data flow
3. **Generate Widget Code** - Create HTML, CSS, JavaScript, and server script
4. **Deploy to ServiceNow** - Install the widget in your instance
5. **Provide Usage Instructions** - Show how to add it to portals

## =à Customization Options

### Modify Colors and Styling
```bash
snow-flow swarm "Update the incident dashboard to use our corporate colors: 
- Primary: #1f4e79 (dark blue)
- Secondary: #28a745 (green) 
- Warning: #ffc107 (yellow)
- Danger: #dc3545 (red)"
```

### Add Additional Metrics
```bash
snow-flow swarm "Add these metrics to the incident dashboard:
- Average resolution time by priority
- Top 5 incident categories this month
- User satisfaction scores (from surveys)
- Escalation rate percentage"
```

### Change Refresh Behavior  
```bash
snow-flow swarm "Modify the incident dashboard to:
- Refresh every 60 seconds instead of 30
- Show a subtle loading indicator during refresh
- Cache data for 2 minutes to improve performance"
```

## =Ê Widget Features

### Real-Time Data
- **Live Updates**: Data refreshes automatically without page reload
- **WebSocket Support**: Instant updates when incidents change
- **Offline Handling**: Graceful degradation when offline

### Interactive Elements
- **Clickable Metrics**: Click counts to drill down to incident lists
- **Hover Details**: Detailed information on mouse hover
- **Mobile Responsive**: Touch-friendly interface for mobile users

### Performance Optimized
- **Data Caching**: Reduces ServiceNow API calls
- **Lazy Loading**: Only loads visible content
- **Error Handling**: Graceful error display and recovery

## =' Technical Details

### Server Script Features
```javascript
// Snow-Flow automatically generates optimized server scripts like:
data.incidents = {
  critical: new GlideRecord('incident').addQuery('priority', 1).getRowCount(),
  high: new GlideRecord('incident').addQuery('priority', 2).getRowCount(),
  // ... optimized queries with proper error handling
};
```

### Client Script Features
```javascript
// Auto-generated client controller includes:
- Real-time data refresh
- Chart rendering with Chart.js
- Responsive design handling
- Accessibility compliance (ARIA labels)
```

## =ñ Portal Integration

### Add to Service Portal
```bash
snow-flow swarm "Add the incident dashboard widget to the Service Portal homepage in a 2-column layout"
```

### Create Dedicated Page
```bash
snow-flow swarm "Create a new Service Portal page called 'IT Operations Dashboard' with the incident widget as the main content"
```

## = Troubleshooting

### Common Issues

**Widget not loading data?**
```bash
snow-flow swarm "Debug the incident dashboard widget - check data permissions and API connectivity"
```

**Performance issues?**
```bash
snow-flow swarm "Optimize the incident dashboard for better performance - add caching and reduce API calls"
```

**Mobile display problems?**
```bash
snow-flow swarm "Fix mobile responsiveness issues in the incident dashboard - ensure proper scaling and touch support"
```

## =È Analytics Integration

### Add Performance Metrics
```bash
snow-flow swarm "Add Google Analytics tracking to the incident dashboard to monitor:
- Widget load times
- User interactions with different metrics
- Most clicked dashboard elements"
```

## = Security Considerations

The widget automatically includes:
- **ACL Compliance**: Respects ServiceNow access controls
- **Data Sanitization**: Prevents XSS attacks
- **Role-Based Display**: Shows different data based on user roles
- **Audit Logging**: Tracks dashboard usage for compliance

## =Ú Related Examples

- [Flow Integration Example](../flows/incident-automation.md) - Automate incident workflows
- [Advanced Analytics](../advanced/performance-dashboard.md) - Performance monitoring
- [Custom Styling](../basic/widget-theming.md) - Apply custom themes

## > Community

Share your dashboard customizations:
- Post screenshots in our [Discord](https://discord.gg/snow-flow)
- Submit improvements via [GitHub Issues](https://github.com/groeimetai/snow-flow/issues)
- Contribute enhancements through pull requests