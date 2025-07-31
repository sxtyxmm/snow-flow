# Snow-Flow v1.4.7 Release Notes

**Release Date**: 2025-07-31

## 🎉 Major Enhancement: Portal Page Deployment

Snow-Flow now supports complete portal page deployment! This addresses a key limitation where widgets could be created but not easily placed on portal pages.

### ✨ New Features

#### Portal Page Deployment Type
- **New `portal_page` deployment type** in `snow_deploy` tool
- Seamless widget-to-page deployment with a single command
- Automatic portal page creation and widget placement
- Support for multiple layout types:
  - Single column
  - Multi-column
  - With sidebar

#### Enhanced Queen Agent Intelligence
- Queen Agent now recognizes portal page objectives
- New `page-designer` agent type for portal-specific tasks
- Intelligent detection of portal page keywords in multiple languages
- Automatic task coordination for widget + page deployment

#### Portal Configuration Features
- Automatic portal detection (Service Portal vs Employee Service Center)
- Responsive CSS generation for all page layouts
- Widget instance sizing based on layout type
- Direct links to view and edit deployed pages

### 🚀 Example Usage

```bash
# Create widget and place it on a portal page
snow-flow swarm "create incident dashboard widget and place it on portal page"

# Or in Dutch
snow-flow swarm "maak een incident widget en plaats het op een portal pagina"
```

### 🔧 Technical Improvements

- Complete portal page structure creation (containers, rows, columns)
- Widget lookup by name (no sys_id required)
- Fallback manual instructions if deployment fails
- Update Set tracking for all portal changes

### 🐛 Removed Features

- **Flow deployment removed** from MCP tools (v1.4.0+ decision)
- Use ServiceNow's native Flow Designer instead

### 📝 Other Changes

- Updated TypeScript types for portal page support
- Enhanced agent factory with portal page patterns
- Improved neural learning for portal deployments

## 🙏 Acknowledgments

Thanks to our users for the feedback about portal page deployment challenges!

---

For questions or issues, please visit: https://github.com/groeimetai/snow-flow