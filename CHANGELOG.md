# Changelog

All notable changes to Snow-Flow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-17

### 🌊 Enhanced Flow Composer MCP
- **Added** Natural language flow creation with intelligent artifact orchestration
- **Added** Automatic discovery and linking of existing ServiceNow components
- **Added** Smart dependency resolution and data flow mapping
- **Added** Fallback artifact creation when components are missing
- **Added** Flow composition tools: `snow_create_complex_flow`, `snow_analyze_flow_instruction`, `snow_discover_flow_artifacts`, `snow_preview_flow_structure`

### 🎨 Intelligent Template System
- **Added** Context-aware template selection based on natural language
- **Added** Expanded widget templates: Dashboard, Data Table, Form, Chart
- **Added** Advanced flow templates: Approval, Integration, Automation
- **Added** Composite templates for complete systems
- **Added** Smart variable extraction from natural language descriptions
- **Added** Pattern recognition for common ServiceNow scenarios

### 🧠 Enhanced Template Engine
- **Added** Natural language understanding for template selection
- **Added** Intelligent defaults based on ServiceNow best practices
- **Added** ServiceNow-specific context awareness (incident, request, change tables)
- **Added** Automatic security pattern application
- **Added** Performance optimization templates

### ⚡ Update Set Management
- **Added** Automatic Update Set creation and tracking
- **Added** Update Set tools: `snow_update_set_create`, `snow_update_set_switch`, `snow_update_set_current`
- **Added** Production-ready Update Set export
- **Added** Complete audit trail for all deployments

### 📊 New Templates
- **Added** `widget.dashboard.template.json` - Real-time dashboard with metrics and charts
- **Added** `widget.datatable.template.json` - Interactive data table with sorting and filtering
- **Added** `flow.approval.template.json` - Multi-stage approval workflows
- **Added** `flow.integration.template.json` - REST/SOAP integration flows
- **Added** `composite.incident-management.template.json` - Complete incident management system

### 🔧 Technical Improvements
- **Added** Version management system with centralized version info
- **Added** Enhanced CLI with version display in all commands
- **Added** Improved error handling and validation
- **Added** Better TypeScript type safety
- **Fixed** Template loading path issues
- **Fixed** Interface mismatches in Flow Composer MCP

### 📚 Documentation
- **Added** Comprehensive Flow Composer documentation in CLAUDE.md
- **Added** Template system documentation with examples
- **Added** Natural language flow creation examples
- **Updated** README.md with v1.1.0 features and changelog
- **Added** Version information display in CLI

## [1.0.0] - 2025-01-15

### 🚀 Initial Release
- **Added** Multi-agent orchestration framework for ServiceNow
- **Added** ServiceNow OAuth 2.0 authentication
- **Added** Direct ServiceNow API integration
- **Added** SPARC methodology with 17 specialized modes
- **Added** Real-time deployment capabilities
- **Added** Batch operations and parallel execution
- **Added** Persistent memory system for agent coordination
- **Added** Basic template system for widgets and flows
- **Added** MCP (Model Context Protocol) server integration
- **Added** Claude Code integration for AI-powered development

### 🎯 Core Features
- **Added** Widget deployment: `snow_deploy_widget`
- **Added** Flow deployment: `snow_deploy_flow`
- **Added** Application deployment: `snow_deploy_application`
- **Added** Validation and rollback capabilities
- **Added** CLI interface with comprehensive commands
- **Added** Project initialization with `snow-flow init`
- **Added** Authentication management: `snow-flow auth`
- **Added** Real-time monitoring dashboard

### 📦 Templates
- **Added** Basic widget template
- **Added** Basic flow template
- **Added** Basic script include template
- **Added** Basic business rule template
- **Added** Basic table template
- **Added** Basic application template

### 🔗 Integration
- **Added** Claude Code MCP servers
- **Added** ServiceNow REST API client
- **Added** OAuth token management
- **Added** Secure credential storage
- **Added** Connection testing and validation

### 📚 Documentation
- **Added** Comprehensive README with setup instructions
- **Added** CLAUDE.md with development guidelines
- **Added** OAuth setup documentation
- **Added** CLI command reference
- **Added** Project structure documentation

---

## Version History

- **v1.1.0** (2025-01-17) - Enhanced Flow Composer & Intelligent Templates
- **v1.0.0** (2025-01-15) - Initial Release

## Upgrade Guide

### From v1.0.0 to v1.1.0

1. **Update Dependencies**:
   ```bash
   npm install
   npm run build
   ```

2. **New Features Available**:
   - Use `snow-flow create-flow "natural language instruction"` for intelligent flow creation
   - Access expanded templates in `src/templates/patterns/`
   - Utilize Update Set management for all deployments

3. **No Breaking Changes**:
   - All existing functionality continues to work
   - Existing templates remain compatible
   - No configuration changes required

## Support

For issues, questions, or contributions, please visit:
- [GitHub Issues](https://github.com/groeimetai/snow-flow/issues)
- [GitHub Discussions](https://github.com/groeimetai/snow-flow/discussions)
- [Documentation](https://github.com/groeimetai/snow-flow/wiki)