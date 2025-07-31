# Manual Widget Deployment Guide

## Quick Deployment Steps

Since the OAuth authentication has expired, please follow these manual steps to deploy your Incident Management Widget:

### Step 1: Login to ServiceNow
1. Open your ServiceNow instance in a browser
2. Login with your credentials

### Step 2: Navigate to Widget Editor
1. Go to **Service Portal > Widgets**
2. Click **New** to create a new widget

### Step 3: Create Widget Record
Fill in these fields:
- **Name**: Enhanced Incident Management Widget
- **ID**: incident-management-widget
- **Description**: Advanced incident management with visual features and real-time updates

### Step 4: Copy Widget Code

#### HTML Template
1. Open `/servicenow/widgets/incident-management-widget.html`
2. Copy ALL content
3. Paste into the **HTML Template** field

#### CSS - SCSS
1. Open `/servicenow/widgets/incident-management-widget.css`
2. Copy ALL content
3. Paste into the **CSS - SCSS** field

#### Client Controller
1. Open `/servicenow/widgets/incident-management-widget.js`
2. Copy ALL content
3. Paste into the **Client Controller** field

#### Server Script
1. Open `/servicenow/widgets/incident-management-widget-server.js`
2. Copy ALL content
3. Paste into the **Server Script** field

#### Option Schema
1. Open `/servicenow/widgets/incident-management-widget-options.json`
2. Copy ONLY the `widget_options` array content
3. Paste into the **Option Schema** field

### Step 5: Save Widget
Click **Submit** to save your widget

### Step 6: Add to Page
1. Navigate to **Service Portal > Pages**
2. Edit or create a page
3. Add your widget using the widget picker
4. Configure options as needed

## Widget Files Location

All widget files are located in:
```
/Users/nielsvanderwerf/Projects/servicenow_multiagent/servicenow/widgets/
```

Files to deploy:
- `incident-management-widget.html` - HTML Template
- `incident-management-widget.css` - Styles
- `incident-management-widget.js` - Client Controller
- `incident-management-widget-server.js` - Server Script
- `incident-management-widget-options.json` - Widget Options

## Alternative: Automated Deployment

To use automated deployment later:

1. **Re-authenticate with ServiceNow:**
   ```bash
   snow-flow auth login
   ```

2. **Run the deployment script:**
   ```bash
   node dist/cli/deploy-incident-widget.js
   ```

## Widget Features

Your deployed widget includes:
- ✨ Interactive charts (Doughnut, Bar, Line)
- 🎯 Real-time incident tracking
- 🎨 Modern card-based UI with animations
- 🔍 Advanced filtering (priority, state, assignment)
- 📱 Responsive design for all devices
- 🔄 Auto-refresh functionality
- 📊 Priority color indicators
- 🚀 Performance optimized queries

## Configuration Options

Key widget options to configure:
- `show_charts`: Enable/disable charts
- `refresh_interval`: Auto-refresh time (seconds)
- `max_records`: Maximum incidents to display
- `default_priority_filter`: Default priority filter
- `color_scheme`: Visual theme

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify user permissions (need incident_manager or itil role)
3. Ensure Chart.js CDN is accessible
4. Review the test scenarios in `TEST-SCENARIOS.md`

---

**Widget Version**: 2.0
**Created**: January 2025
**Built with**: Snow-Flow Multi-Agent System