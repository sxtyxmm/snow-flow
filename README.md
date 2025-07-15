# Snow-flow: AI-Powered ServiceNow Application Builder 🚀

Een geavanceerd multi-agent systeem dat gebruik maakt van AI om automatisch ServiceNow applicaties te bouwen. Dit systeem gebruikt Claude AI en gespecialiseerde agents om complete ServiceNow applicaties te genereren, inclusief database schema's, business logic, workflows, en UI componenten.

## 🌟 Highlights

- **🤖 6 Gespecialiseerde AI Agents** - Elk verantwoordelijk voor een specifiek aspect van ServiceNow ontwikkeling
- **🏗️ Complete Applicatie Generatie** - Bouwt volledige ServiceNow applicaties van A tot Z
- **⚡ Unified CLI** - Eén command voor alles (zoals `claude-flow swarm`)
- **🎨 Widget Builder** - Maak Service Portal widgets met één commando
- **📱 Template System** - Voorgedefinieerde templates voor snelle start
- **💰 Cost-Effective** - Local Mode gebruikt je Claude Code Max abonnement (geen extra kosten)
- **🔐 Enterprise Ready** - OAuth2, Basic Auth, en volledige security support

## 📋 Inhoudsopgave

- [Installatie](#-installatie)
- [Quick Start](#-quick-start)
- [Unified CLI Commands](#-unified-cli-commands)
- [Widget Builder](#-widget-builder)
- [Application Builder](#-application-builder)
- [Configuration](#-configuration)
- [Agents Overzicht](#-agents-overzicht)
- [Templates](#-templates)
- [Troubleshooting](#-troubleshooting)

## 🚀 Installatie

### Vereisten
- Node.js 18+ 
- npm of yarn
- ServiceNow instance met Studio access
- Claude Code Max abonnement (voor Local Mode)

### Stappen

1. **Clone de repository**
```bash
git clone https://github.com/groeimetai/Snow-flow.git
cd Snow-flow
```

2. **Installeer dependencies**
```bash
npm install
```

3. **Build het project**
```bash
npm run build
```

4. **Installeer globaal (optioneel maar handig)**
```bash
npm install -g .
```

5. **Setup configuratie**
```bash
cp .env.example .env
# Edit .env met je ServiceNow credentials
```

## ⚡ Quick Start

### 1. **Basis Setup**
```bash
# Initialiseer project
snow-flow init --name "My Project"

# Check status
snow-flow status

# Bekijk templates
snow-flow templates
```

### 2. **Maak je eerste widget**
```bash
# Task counter widget
snow-flow widget "Task Counter" --type counter --table task

# Dashboard widget
snow-flow widget "User Dashboard" --type dashboard --table sys_user

# Form widget
snow-flow widget "Quick Form" --type form --table incident
```

### 3. **Maak complete applicatie**
```bash
# Task management app
snow-flow app "Task Manager" --template task-management

# Basic CRUD app
snow-flow app "My App" --template basic-crud

# Custom app met config
snow-flow create application --config my-app-config.json
```

## 🎯 Unified CLI Commands

### **Main Commands**

```bash
# 🎨 Widget Builder
snow-flow widget <name> [options]

# 📱 Application Builder  
snow-flow app <name> [options]

# 🔧 Component Builder
snow-flow component <type> <name> [options]

# 📊 Status & Info
snow-flow status
snow-flow templates
```

### **Widget Commands**

```bash
# Counter widget
snow-flow widget "Task Counter" --type counter --table task

# Dashboard widget
snow-flow widget "User Dashboard" --type dashboard --table sys_user

# Chart widget
snow-flow widget "Performance Chart" --type chart --table task

# Form widget
snow-flow widget "Quick Form" --type form --table incident

# List widget
snow-flow widget "Task List" --type list --table task
```

### **Application Commands**

```bash
# Task Management System
snow-flow app "Task Manager" --template task-management

# Basic CRUD Application
snow-flow app "My CRUD App" --template basic-crud

# Service Portal Application
snow-flow app "Portal App" --template service-portal-widget

# Custom application
snow-flow app "Custom App" --scope x_custom --mode local
```

### **Component Commands**

```bash
# Business Rules
snow-flow component business-rule "Auto Assignment" --table incident

# Client Scripts
snow-flow component client-script "Form Validation" --table task

# UI Pages
snow-flow component ui-page "Custom Page" --table task

# Workflows
snow-flow component workflow "Approval Process" --table sc_request
```

### **Advanced Commands**

```bash
# Met custom config
snow-flow create application --config app-config.json

# Dry run (preview)
snow-flow create widget --name "Test Widget" --dry-run

# Deploy direct
snow-flow app "My App" --deploy

# Interactive mode
snow-flow create application --mode interactive
```

## 🎨 Widget Builder

### **Widget Types**

#### **Counter Widgets**
```bash
# Task counter
snow-flow widget "Task Counter" --type counter --table task

# Incident counter
snow-flow widget "Incident Counter" --type counter --table incident

# Request counter
snow-flow widget "Request Counter" --type counter --table sc_request
```

#### **Dashboard Widgets**
```bash
# User dashboard
snow-flow widget "My Dashboard" --type dashboard --table sys_user

# Team dashboard
snow-flow widget "Team Dashboard" --type dashboard --table task

# Manager dashboard
snow-flow widget "Manager View" --type dashboard --table incident
```

#### **Form Widgets**
```bash
# Quick incident form
snow-flow widget "Quick Incident" --type form --table incident

# Request form
snow-flow widget "Service Request" --type form --table sc_request

# Feedback form
snow-flow widget "Feedback Form" --type form --table feedback
```

#### **Chart Widgets**
```bash
# Performance chart
snow-flow widget "Performance Chart" --type chart --table task

# Trend chart
snow-flow widget "Trend Analysis" --type chart --table incident

# Status chart
snow-flow widget "Status Overview" --type chart --table sc_request
```

### **Generated Widget Components**

Elke widget genereert:
- **HTML Template** - Angular.js template met data binding
- **CSS Styling** - Modern, responsive design
- **JavaScript Controller** - Client-side interactie
- **Server Script** - GlideScript voor data processing
- **Option Schema** - Configuratie opties
- **Demo Data** - Voorbeeld data voor testing

### **Widget Configuration**

```json
{
  "name": "task_counter_widget",
  "type": "counter",
  "table": "task",
  "configuration": {
    "show_chart": true,
    "auto_refresh": true,
    "refresh_interval": 30,
    "status_colors": {
      "new": "#0066cc",
      "in_progress": "#ff9900",
      "completed": "#00cc00"
    }
  }
}
```

## 📱 Application Builder

### **Templates**

#### **Basic CRUD**
```bash
snow-flow app "My CRUD App" --template basic-crud
```
- Database tabel met CRUD operaties
- Form en List views
- Basis ACLs en security
- Status workflow

#### **Task Management**
```bash
snow-flow app "Task Manager" --template task-management
```
- Task tabel met priorities
- Assignment workflows
- Approval processes
- Dashboard widgets
- Email notifications

#### **Service Portal Widget**
```bash
snow-flow app "Widget Collection" --template service-portal-widget
```
- Multiple widget types
- Portal integration
- Configuration options
- Mobile support

### **Custom Applications**

```bash
# Met custom config
snow-flow create application --config custom-app.json

# Interactive mode
snow-flow create application --mode interactive
```

## ⚙️ Configuration

### **Environment Variables**

```env
# ServiceNow Configuration (VERPLICHT)
SERVICENOW_INSTANCE_URL=https://dev123456.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=your-password

# OAuth2 (Optioneel maar aanbevolen)
SERVICENOW_CLIENT_ID=your-client-id
SERVICENOW_CLIENT_SECRET=your-client-secret

# Application Settings
LOG_LEVEL=info
MAX_CONCURRENT_AGENTS=6
TIMEOUT_MS=60000

# Local Mode (Aanbevolen - Gratis)
CLAUDE_CODE_INTEGRATION=true
TEMPLATE_MODE_ENABLED=true

# API Mode (Kost geld)
# ANTHROPIC_API_KEY=sk-ant-api03-your-key
```

### **Application Config File**

```json
{
  "appName": "Employee Onboarding",
  "appScope": "x_emp_onboard",
  "appDescription": "Automated employee onboarding system",
  "appVersion": "1.0.0",
  "requirements": {
    "tables": [
      {
        "name": "x_emp_onboard_request",
        "label": "Onboarding Request",
        "fields": [
          {
            "name": "employee_name",
            "label": "Employee Name",
            "type": "string",
            "mandatory": true
          },
          {
            "name": "start_date",
            "label": "Start Date",
            "type": "date",
            "mandatory": true
          },
          {
            "name": "department",
            "label": "Department",
            "type": "reference",
            "reference": "cmn_department"
          }
        ]
      }
    ],
    "workflows": [
      {
        "name": "Onboarding Approval",
        "table": "x_emp_onboard_request",
        "activities": [
          {
            "name": "Manager Approval",
            "type": "approval",
            "assignmentGroup": "managers"
          }
        ]
      }
    ],
    "ui": [
      {
        "type": "widget",
        "name": "onboarding_dashboard",
        "widget_type": "dashboard",
        "data_source": "x_emp_onboard_request"
      }
    ]
  }
}
```

## 🤖 Agents Overzicht

### **1. Schema Designer Agent**
- **Functie**: Database tabellen, velden, relaties
- **Genereert**: 
  - ServiceNow tabellen met inheritance
  - Veld definities met juiste types
  - Relaties tussen tabellen
  - Indexes voor performance

### **2. Script Generator Agent**
- **Functie**: Server-side scripting
- **Genereert**:
  - Business Rules (before/after/async)
  - Script Includes
  - Scheduled Jobs
  - Fix Scripts

### **3. UI Builder Agent**
- **Functie**: User interfaces
- **Genereert**:
  - Service Portal Widgets
  - Forms met field layouts
  - Lists met columns en filters
  - UI Pages (HTML/CSS/JS)

### **4. Workflow Designer Agent**
- **Functie**: Process automation
- **Genereert**:
  - Workflow definitions
  - Approval processes
  - Notifications
  - SLA definitions

### **5. Security Agent**
- **Functie**: Toegangscontrole
- **Genereert**:
  - Access Control Lists (ACLs)
  - Rollen en groepen
  - Data segregation rules
  - Security policies

### **6. Update Set Manager Agent**
- **Functie**: Deployment
- **Genereert**:
  - Update Sets
  - Migration scripts
  - Rollback procedures
  - Deployment documentatie

## 📋 Templates

### **Available Templates**

```bash
# Bekijk alle templates
snow-flow templates
```

#### **basic-crud**
```bash
snow-flow app "My CRUD App" --template basic-crud
```
- Simpele CRUD applicatie
- Een database tabel
- Form en List views
- Basis ACLs en workflow

#### **task-management**
```bash
snow-flow app "Task Manager" --template task-management
```
- Complete task management systeem
- Task tabel met priorities
- Assignment workflows
- Approval processes
- Dashboard widgets

#### **service-portal-widget**
```bash
snow-flow app "Widget Collection" --template service-portal-widget
```
- Multiple widget types
- Counter, Dashboard, Form widgets
- Service Portal integration
- Mobile support

## 💰 Cost Modes

### **Local Mode (Aanbevolen - Gratis)**
```bash
# Gebruikt je Claude Code Max abonnement
snow-flow widget "My Widget" --mode local  # Default mode
```
- **Kosten**: $0 extra
- **Speed**: Template mode = instant
- **Quality**: Uitstekend voor 90% van use cases

### **API Mode (Kost geld)**
```bash
# Gebruikt Claude API direct
snow-flow widget "My Widget" --mode api
```
- **Kosten**: $100-500+ per maand
- **Speed**: Volledig automatisch
- **Quality**: Hoogste kwaliteit AI generatie

### **Interactive Mode**
```bash
# Handmatige processing via Claude Code
snow-flow widget "My Widget" --mode interactive
```
- **Kosten**: $0 (gebruikt Claude Code)
- **Speed**: Handmatig maar flexibel
- **Quality**: Volledig aanpasbaar

## 🔧 Advanced Usage

### **Batch Operations**
```bash
# Multiple widgets
snow-flow widget "Counter Widget" --type counter --table task
snow-flow widget "Dashboard Widget" --type dashboard --table task
snow-flow widget "Form Widget" --type form --table task

# Complete app with widgets
snow-flow app "Full App" --template task-management --scope x_full_app
```

### **Custom Scopes**
```bash
# Custom scope
snow-flow app "My App" --scope x_custom_scope

# Project-specific scope
snow-flow widget "Project Widget" --scope x_project_mgmt
```

### **Development Workflow**
```bash
# 1. Initialize project
snow-flow init --name "My Project"

# 2. Create widgets
snow-flow widget "Task Counter" --type counter --table task
snow-flow widget "User Dashboard" --type dashboard --table sys_user

# 3. Create main app
snow-flow app "Main App" --template task-management

# 4. Check status
snow-flow status
```

## 🔍 Troubleshooting

### **Common Issues**

#### **1. Command Not Found: snow-flow**
```bash
# Optie 1: Installeer globaal
npm install -g .

# Optie 2: Use npm run
npm run snow-flow widget "My Widget"

# Optie 3: Use npx
npx snow-flow widget "My Widget"
```

#### **2. ServiceNow Connection Issues**
```bash
# Check your .env file
snow-flow status

# Verify credentials
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password
```

#### **3. Build Issues**
```bash
# Rebuild the project
npm run build

# Check for TypeScript errors
npm run typecheck
```

### **Debug Mode**
```bash
# Enable debug logging
LOG_LEVEL=debug snow-flow widget "Debug Widget"

# Check Claude Code integration
snow-flow claude-status
```

## 🎯 Examples

### **Real-world Examples**

#### **IT Service Desk**
```bash
# Create incident counter widget
snow-flow widget "Incident Counter" --type counter --table incident

# Create service request dashboard
snow-flow widget "Service Dashboard" --type dashboard --table sc_request

# Create IT service app
snow-flow app "IT Service Desk" --template task-management --scope x_it_service
```

#### **HR Onboarding**
```bash
# Create onboarding form widget
snow-flow widget "Onboarding Form" --type form --table hr_onboarding

# Create employee dashboard
snow-flow widget "Employee Dashboard" --type dashboard --table sys_user

# Create HR application
snow-flow app "HR Onboarding" --template basic-crud --scope x_hr_onboard
```

#### **Project Management**
```bash
# Create project counter
snow-flow widget "Project Counter" --type counter --table project

# Create project dashboard
snow-flow widget "Project Dashboard" --type dashboard --table project

# Create project management app
snow-flow app "Project Manager" --template task-management --scope x_project_mgmt
```

## 📊 Performance

### **Generation Times**
- **Template Mode**: < 1 seconde
- **Local Mode**: 2-5 seconden
- **API Mode**: 10-30 seconden
- **Interactive Mode**: Manual (flexibel)

### **Resource Usage**
- **Memory**: < 200MB
- **CPU**: Minimal tijdens template mode
- **Network**: Alleen ServiceNow API calls

## 🤝 Contributing

Bijdragen zijn welkom! 

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add: nieuwe unified CLI'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is gelicenseerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.

## 🙏 Credits

- Gebouwd met [Claude AI](https://www.anthropic.com/claude) van Anthropic
- Geïnspireerd door [claude-flow](https://github.com/ruvnet/claude-flow)
- ServiceNow® is een geregistreerd handelsmerk van ServiceNow, Inc.

## 📞 Support

Voor vragen of problemen:
- Open een [GitHub Issue](https://github.com/groeimetai/Snow-flow/issues)
- Bekijk de [Wiki](https://github.com/groeimetai/Snow-flow/wiki) voor meer documentatie
- Check [COST-OPTIMIZATION.md](COST-OPTIMIZATION.md) voor kostenvergelijking

---

**Let op**: Dit is een onafhankelijk project en is niet geaffilieerd met ServiceNow, Inc.

**Quick Commands Cheat Sheet:**
```bash
# Na global install (npm install -g .):
snow-flow widget "My Widget" --type counter    # Widget maken
snow-flow app "My App" --template basic-crud   # App maken  
snow-flow status                               # Status check
snow-flow templates                            # Templates bekijken

# Of gebruik npm run:
npm run snow-flow widget "My Widget" --type counter
npm run snow-flow app "My App" --template basic-crud
npm run snow-flow status
npm run snow-flow templates
```