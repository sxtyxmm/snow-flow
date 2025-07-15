# Snow-flow: AI-Powered ServiceNow Application Builder 🚀

Een geavanceerd multi-agent systeem dat gebruik maakt van AI om automatisch ServiceNow applicaties te bouwen. Dit systeem gebruikt Claude AI en gespecialiseerde agents om complete ServiceNow applicaties te genereren, inclusief database schema's, business logic, workflows, en UI componenten.

## 🌟 Highlights

- **🤖 6 Gespecialiseerde AI Agents** - Elk verantwoordelijk voor een specifiek aspect van ServiceNow ontwikkeling
- **🏗️ Complete Applicatie Generatie** - Bouwt volledige ServiceNow applicaties van A tot Z
- **⚡ Parallel Processing** - Agents werken tegelijkertijd voor maximale snelheid
- **🎨 Template System** - Voorgedefinieerde templates voor snelle start
- **🔧 CLI Interface** - Eenvoudige command-line interface voor alle functionaliteit
- **🔐 Enterprise Ready** - OAuth2, Basic Auth, en volledige security support

## 📋 Inhoudsopgave

- [Installatie](#-installatie)
- [Configuratie](#-configuratie)
- [Credentials Setup](#-credentials-setup)
- [Gebruik](#-gebruik)
- [Agents Overzicht](#-agents-overzicht)
- [Templates](#-templates)
- [API Documentatie](#-api-documentatie)
- [Troubleshooting](#-troubleshooting)

## 🚀 Installatie

### Vereisten
- Node.js 18+ 
- npm of yarn
- ServiceNow instance met Studio access
- Claude API key van Anthropic

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

4. **Maak de CLI globaal beschikbaar (optioneel)**
```bash
npm link
```

## ⚙️ Configuratie

### 1. Environment Variables

Kopieer het `.env.example` bestand naar `.env`:

```bash
cp .env.example .env
```

### 2. Bewerk het `.env` bestand met je credentials:

```env
# ServiceNow Configuratie
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password

# Optioneel: OAuth2 (aanbevolen voor productie)
SERVICENOW_CLIENT_ID=your-oauth-client-id
SERVICENOW_CLIENT_SECRET=your-oauth-client-secret

# Claude AI Configuratie
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxx

# Applicatie Settings
LOG_LEVEL=info
MAX_CONCURRENT_AGENTS=6
GENERATION_TIMEOUT=300000
VALIDATE_COMPONENTS=true
DEPLOY_COMPONENTS=true
CREATE_UPDATE_SETS=true
```

## 🔐 Credentials Setup

### ServiceNow Credentials

#### Basic Authentication
1. **Username**: Je ServiceNow gebruikersnaam
2. **Password**: Je ServiceNow wachtwoord
3. **Instance URL**: De volledige URL van je ServiceNow instance (bijv. https://dev123456.service-now.com)

⚠️ **Belangrijk**: De gebruiker moet de volgende rollen hebben:
- `admin` of
- `studio_admin` + `app_creator`

#### OAuth2 Authentication (Aanbevolen)
1. Ga naar **System OAuth > Application Registry** in ServiceNow
2. Klik op **New** > **Create an OAuth API endpoint for external clients**
3. Vul in:
   - **Name**: Snow-flow Client
   - **Client ID**: Wordt automatisch gegenereerd
   - **Client Secret**: Klik op het slot icoon om te genereren
4. Sla op en kopieer de Client ID en Secret naar je `.env` bestand

### Claude AI Integration

Snow-flow biedt twee modi voor AI-generatie:

#### 💰 Local Mode (Aanbevolen - Geen extra kosten)
Gebruikt je Claude Code Max abonnement - geen API key nodig!

```bash
# Geen ANTHROPIC_API_KEY nodig!
npm run cli-local generate --template task-management
```

#### 🔴 API Mode (Origineel - Kost geld)
Voor wie direct API access wil:

1. Ga naar [Anthropic Console](https://console.anthropic.com/)
2. Maak een account aan of log in
3. Ga naar **API Keys**
4. Klik op **Create Key**
5. Kopieer de key (begint met `sk-ant-api03-`)
6. Plak in je `.env` bestand

⚠️ **Belangrijk**: API mode kan $100-500+ per maand kosten!

## 🎯 Gebruik

### CLI Commands

#### 💰 Local Mode (Aanbevolen - Geen kosten)

```bash
# Bekijk cost comparison
npm run cost-comparison

# Template mode (instant, gratis)
npm run cli-local generate --template task-management --mode template

# Interactive mode (flexibel, gratis)
npm run cli-local generate --template task-management --mode interactive
npm run claude-process  # Process prompts met Claude Code

# Status checking
npm run claude-status
npm run claude-cleanup
```

#### 🔴 API Mode (Origineel - Kost geld)

```bash
# Initialiseer een nieuw project
servicenow-app-builder init --name "mijn-app" --scope "x_mijn_app"

# Genereer een applicatie
servicenow-app-builder generate --config-file app-config.json

# Met een template
servicenow-app-builder generate \
  --template task-management \
  --app-name "Task Manager" \
  --app-scope "x_task_mgr"

# Dry-run (zonder deployment)
servicenow-app-builder generate --config-file app-config.json --dry-run
```

#### 3. Bekijk beschikbare templates
```bash
servicenow-app-builder templates
```

#### 4. Deploy een update set
```bash
servicenow-app-builder deploy --update-set-id "12345" --environment production
```

#### 5. Valideer een applicatie
```bash
servicenow-app-builder validate --app-id "67890"
```

### Programmatisch Gebruik

```typescript
import { ServiceNowAppOrchestrator } from 'snow-flow';

const orchestrator = new ServiceNowAppOrchestrator({
  instanceUrl: 'https://dev123456.service-now.com',
  username: 'admin',
  password: 'password',
  // Of gebruik OAuth2:
  // clientId: 'your-client-id',
  // clientSecret: 'your-client-secret'
});

await orchestrator.initialize();

const result = await orchestrator.generateApplication({
  appName: 'My Custom App',
  appScope: 'x_my_app',
  appDescription: 'Een custom ServiceNow applicatie',
  requirements: {
    tables: [{
      name: 'x_my_app_record',
      label: 'My Record',
      fields: [
        { name: 'title', label: 'Title', type: 'string', mandatory: true },
        { name: 'description', label: 'Description', type: 'text' }
      ]
    }],
    workflows: [{
      name: 'Approval Workflow',
      table: 'x_my_app_record',
      activities: [
        { name: 'Manager Approval', type: 'approval' }
      ]
    }]
  }
});

console.log(`Application created: ${result.appId}`);
```

## 🤖 Agents Overzicht

### 1. Schema Designer Agent
- **Verantwoordelijk voor**: Database tabellen, velden, relaties
- **Genereert**: 
  - ServiceNow tabellen met inheritance
  - Veld definities met juiste types
  - Relaties tussen tabellen
  - Indexes voor performance

### 2. Script Generator Agent
- **Verantwoordelijk voor**: Server-side scripting
- **Genereert**:
  - Business Rules (before/after/async)
  - Script Includes
  - Scheduled Jobs
  - Fix Scripts

### 3. UI Builder Agent
- **Verantwoordelijk voor**: User interfaces
- **Genereert**:
  - Forms met field layouts
  - Lists met columns en filters
  - UI Pages (HTML/CSS/JS)
  - Service Portal Widgets

### 4. Workflow Designer Agent
- **Verantwoordelijk voor**: Process automation
- **Genereert**:
  - Workflow definitions
  - Approval processes
  - Notifications
  - SLA definitions

### 5. Security Agent
- **Verantwoordelijk voor**: Toegangscontrole
- **Genereert**:
  - Access Control Lists (ACLs)
  - Rollen en groepen
  - Data segregation rules
  - Security policies

### 6. Update Set Manager Agent
- **Verantwoordelijk voor**: Deployment
- **Genereert**:
  - Update Sets
  - Migration scripts
  - Rollback procedures
  - Deployment documentatie

## 📋 Templates

### Basic CRUD
Een simpele CRUD applicatie met:
- Een database tabel
- Form en List views
- Basis ACLs
- Status workflow

```bash
servicenow-app-builder generate --template basic-crud
```

### Task Management
Complete task management systeem met:
- Task tabel met priorities
- Assignment workflows
- Approval processes
- Dashboard widgets
- Email notifications

```bash
servicenow-app-builder generate --template task-management
```

### Meer templates komen binnenkort!
- Asset Management
- Incident Management
- Approval Workflow
- Service Catalog Item
- Mobile App

## 📚 Configuratie Bestand Voorbeeld

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
          },
          {
            "name": "equipment_needed",
            "label": "Equipment Needed",
            "type": "choice",
            "choices": ["Laptop", "Desktop", "Mobile", "All"],
            "multiple": true
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
          },
          {
            "name": "IT Setup",
            "type": "task",
            "assignmentGroup": "it_support"
          },
          {
            "name": "Send Welcome Email",
            "type": "notification"
          }
        ]
      }
    ],
    "ui": [
      {
        "type": "form",
        "name": "Onboarding Form",
        "table": "x_emp_onboard_request"
      },
      {
        "type": "portal",
        "name": "Employee Portal",
        "widgets": ["onboarding_status", "my_requests"]
      }
    ],
    "security": [
      {
        "type": "acl",
        "name": "HR Write Access",
        "table": "x_emp_onboard_request",
        "operation": "write",
        "roles": ["hr_specialist", "hr_manager"]
      }
    ]
  },
  "preferences": {
    "useModernUI": true,
    "includeMobileSupport": true,
    "generateTests": true,
    "includeDocumentation": true
  }
}
```

## 🔧 Troubleshooting

### Veel voorkomende problemen

#### 1. Authentication Failed
**Probleem**: Kan niet inloggen op ServiceNow
**Oplossing**: 
- Controleer username/password
- Verifieer instance URL (moet https:// bevatten)
- Check of gebruiker juiste rollen heeft

#### 2. Claude API Errors
**Probleem**: AI agent errors
**Oplossing**:
- Verifieer API key is geldig
- Check API quota/limits
- Controleer internet connectie

#### 3. Deployment Failed
**Probleem**: Update set deployment faalt
**Oplossing**:
- Verifieer ServiceNow permissions
- Check of target instance bereikbaar is
- Controleer update set dependencies

### Debug Mode

Voor meer gedetailleerde logging:
```bash
LOG_LEVEL=debug servicenow-app-builder generate --config-file app-config.json
```

### Logs bekijken
Logs worden opgeslagen in:
- Console output
- `./logs/app.log` (als geconfigureerd)

## 🤝 Contributing

Bijdragen zijn welkom! 

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is gelicenseerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.

## 🙏 Credits

- Gebouwd met [Claude AI](https://www.anthropic.com/claude) van Anthropic
- ServiceNow® is een geregistreerd handelsmerk van ServiceNow, Inc.

## 📞 Support

Voor vragen of problemen:
- Open een [GitHub Issue](https://github.com/groeimetai/Snow-flow/issues)
- Bekijk de [Wiki](https://github.com/groeimetai/Snow-flow/wiki) voor meer documentatie

---

**Let op**: Dit is een onafhankelijk project en is niet geaffilieerd met ServiceNow, Inc.