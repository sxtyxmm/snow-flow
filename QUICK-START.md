# 🚀 Quick Start Guide

Kom direct aan de slag met Snow-flow!

## ⚡ Super Quick Start (2 minuten)

```bash
# 1. Clone en setup
git clone https://github.com/groeimetai/Snow-flow.git
cd Snow-flow
npm install && npm run build

# 2. Installeer globaal (optioneel maar handig)
npm install -g .

# 3. Configureer ServiceNow credentials
cp .env.example .env
# Edit .env met jouw ServiceNow gegevens

# 4. Maak je eerste widget!
snow-flow widget "Task Counter" --type counter --table task

# 5. Of maak complete applicatie
snow-flow app "My App" --template task-management
```

## 🎯 Wat kun je maken?

### **Widgets (Service Portal)**
```bash
# Counter widgets
snow-flow widget "Incident Counter" --type counter --table incident
snow-flow widget "Request Counter" --type counter --table sc_request

# Dashboard widgets  
snow-flow widget "My Dashboard" --type dashboard --table sys_user
snow-flow widget "Team Dashboard" --type dashboard --table task

# Form widgets
snow-flow widget "Quick Form" --type form --table incident
snow-flow widget "Feedback Form" --type form --table feedback

# Chart widgets
snow-flow widget "Performance Chart" --type chart --table task
snow-flow widget "Status Chart" --type chart --table incident
```

### **Complete Applicaties**
```bash
# Task Management System
snow-flow app "Task Manager" --template task-management

# Basic CRUD Application
snow-flow app "My CRUD App" --template basic-crud

# Service Portal Widget Collection
snow-flow app "Widget Collection" --template service-portal-widget
```

### **Individuele Componenten**
```bash
# Business Rules
snow-flow component business-rule "Auto Assignment" --table incident

# Client Scripts
snow-flow component client-script "Form Validation" --table task

# Workflows
snow-flow component workflow "Approval Process" --table sc_request
```

## 🔧 Basis Commands

```bash
# Status check
snow-flow status

# Templates bekijken
snow-flow templates

# Project initialiseren
snow-flow init --name "My Project"

# Help
snow-flow --help
snow-flow widget --help
```

## 💰 Cost Modes

### **Local Mode (Gratis - Aanbevolen)**
```bash
# Standaard mode - gebruikt je Claude Code Max abonnement
snow-flow widget "My Widget" --mode local
```

### **API Mode (Kost geld)**
```bash
# Alleen als je Claude API key hebt
snow-flow widget "My Widget" --mode api
```

### **Interactive Mode**
```bash
# Handmatige processing via Claude Code
snow-flow widget "My Widget" --mode interactive
snow-flow claude-process
```

## 🎨 Real-world Examples

### **IT Service Desk**
```bash
# Incident tracking
snow-flow widget "Incident Counter" --type counter --table incident
snow-flow widget "Service Dashboard" --type dashboard --table sc_request
snow-flow app "IT Service Desk" --template task-management --scope x_it_service
```

### **HR Onboarding**
```bash
# Employee onboarding
snow-flow widget "Onboarding Form" --type form --table hr_onboarding
snow-flow widget "Employee Dashboard" --type dashboard --table sys_user
snow-flow app "HR Onboarding" --template basic-crud --scope x_hr_onboard
```

### **Project Management**
```bash
# Project tracking
snow-flow widget "Project Counter" --type counter --table project
snow-flow widget "Project Dashboard" --type dashboard --table project
snow-flow app "Project Manager" --template task-management --scope x_project_mgmt
```

## 🔍 Troubleshooting

### **Common Issues**

1. **Command not found: snow-flow**
   ```bash
   # Optie 1: Installeer globaal
   npm install -g .
   
   # Optie 2: Use npm run
   npm run snow-flow widget "My Widget"
   
   # Optie 3: Use npx
   npx snow-flow widget "My Widget"
   ```

2. **ServiceNow connection issues**
   ```bash
   # Check credentials
   snow-flow status
   # of: npm run snow-flow status
   ```

3. **Build issues**
   ```bash
   # Rebuild
   npm run build
   ```

## 📚 Next Steps

1. **Check out the full README** voor alle features
2. **Bekijk COST-OPTIMIZATION.md** voor kostenvergelijking
3. **Lees CONTRIBUTING.md** als je wilt bijdragen
4. **Open een issue** als je vragen hebt

## 🎯 Cheat Sheet

```bash
# Widget maken
snow-flow widget "My Widget" --type counter

# App maken
snow-flow app "My App" --template basic-crud

# Status check
snow-flow status

# Templates
snow-flow templates

# Help
snow-flow --help
```

**Happy coding! 🚀**